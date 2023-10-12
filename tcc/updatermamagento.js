/*
* <license header>
*/

/**
 * This is a sample action showcasing how to access an external API
 *
 * Note:
 * You might want to disable authentication and authorization checks against Adobe Identity Management System for a generic action. In that case:
 *   - Remove the require-adobe-auth annotation for this action in the manifest.yml of your application
 *   - Remove the Authorization header from the array passed in checkMissingRequestInputs
 *   - The two steps above imply that every client knowing the URL to this deployed action will be able to invoke it without any authentication and authorization checks against Adobe Identity Management System
 *   - Make sure to validate these changes against your security requirements before deploying the action
 */


const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const {authenticate, createRMA} = require("../tcc")
const {getRMADetails, getCustomer, getOrderInfo, updateRMA} = require('../magento')
const { sendcloudevent } = require('../token')
const NodeCache = require( "node-cache" );
const myCache = new NodeCache(); 


// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    var paramsRequest;
    let responseData = {};

    //while retrying we get data in params.data.params
    if (params.data.value != undefined && params.data.value.params != undefined) {
        paramsRequest = params.data.value.params;
        // //If receiving parent_id from retrying then store it in responseData['id']. 
        // if(typeof params.data.value.api_id !== "undefined") {
        //     responseData["api_id"] = params.data.value.api_id;
        // }
    }
    else {
        paramsRequest = params.data;
    }

    var rma_id = paramsRequest.rma_id;
    var rma_status = paramsRequest.status;
    var comment = paramsRequest.comment; //comment array from TCC
    var items = paramsRequest.items;

    responseData["event_code"] = params.type;
    responseData["provider_id"] = params.source;
    responseData["event_id"] = params.event_id;
    responseData["entity"] = "Order";
    responseData["from"] = "Magento";
    responseData["reference_id"] = paramsRequest.rma_id; //email is not available. stroing rma_id
    responseData['params'] = paramsRequest;
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))

    try{
    // check for missing request input parameters and headers
    const requiredParams = [/* add required params */]
    const requiredHeaders = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
        // return and log client errors
        return errorResponse(400, errorMessage, logger)
    }

    // extract the user Bearer token from the Authorization header
    const token = getBearerToken(params)

    var rmaDetails;
    var rmadata = {};

    //Retrying code condition - 1
    if (typeof paramsRequest.get_rma_info_magento == "undefined" || paramsRequest.get_rma_info_magento.status == false) {
        try{
            rmadata['integration'] = "Magento";
            rmadata['action'] = "Get RMA";
            rmadata['request'] = params;
            //calling magento APIs to fetch RMAdetails, customerDetails & orderInfo(sku)
            rmaDetails = await getRMADetails(params);
            rmadata['status'] = true
            rmadata['response'] = rmaDetails
        } catch(error) {
            if (error.code == "ECONNABORTED") {
                timeouterror = true
            }
            rmadata['status'] = false
            rmadata['response'] = error
        }
    } else if (typeof paramsRequest.get_rma_info_magento != "undefined" && paramsRequest.get_rma_info_magento.status == true) {
        rmaDetails = paramsRequest.get_rma_info_magento.response;
        rmadata = paramsRequest.get_rma_info_magento;
      } 
      responseData['get_rma_info_magento'] = rmadata;

    var payloadForUpdatingRMA = {}; //making an object
    payloadForUpdatingRMA["rmaDataObject"] = {}; //making rmaDataObject as a outer key for payloadForUpdatingRMA object.
    var itemsArray = [];
    var obj = {};

    //updating items array & it will be used while prepairing payload of updating RMA.
    if (items != undefined) {
        for (i = 0; i < items.length; i++) {
            //iterating through RMA items of magento (same RMA_ID)
            for(j=0; j<rmaDetails.items.length; j++) {
            //matching rma_item_id from TCC with entity_id of items from magento.
            if (items[i].rma_item_id == rmaDetails.items[j].entity_id) {
                obj["entity_id"] = rmaDetails.items[j].entity_id;
                obj["rma_entity_id"] = rmaDetails.items[j].rma_entity_id;  
                obj["order_item_id"] = rmaDetails.items[j].order_item_id;
                obj["qty_requested"] = rmaDetails.items[j].qty_requested;
                //setting value of qty_authorized with the value of qty_approved.
                obj["qty_authorized"] = items[i].qty_returned; //getting from TCC
                obj["qty_approved"] = items[i].qty_approved; //getting from TCC
                obj["qty_returned"] = items[i].qty_returned; //getting from TCC
                obj["reason"] = rmaDetails.items[j].reason;
                obj["condition"] = rmaDetails.items[j].condition;
                obj["resolution"] = rmaDetails.items[j].resolution;
                obj["status"] = items[i].status; //From TCC
                itemsArray.push(obj);
                obj = {};
            }
          }
        }
    }

    // // //Adding comment at item level from TCC
    var itemCommentsObject = {};
    var itemCommentArray = [];
    var oldItemCommentFromMagento = rmaDetails.comments;
    // //if comment length and items length from TCC input are equal and comment length of RMA(from magento) should be equal to or greater than comment length of items(from TCC).

        for(var i=0; i<comment.length; i++) {
            itemCommentsObject['comment'] = comment[i]; // From Tcc
            itemCommentsObject['rma_entity_id'] = rma_id;  //From TCC (whole rma_id=> params.data.rma_id)
            itemCommentsObject['created_at']= rmaDetails.date_requested; //From Magento
            itemCommentsObject['entity_id'] = items[i].rma_item_id; //from TCC (rma_item_id) keeps on changing
            itemCommentsObject['customer_notified'] = false; 
            itemCommentsObject['visible_on_front'] = false;
            itemCommentsObject['status'] = rma_status; //from TCC (header level status;)
            itemCommentsObject['admin'] = true; //custom value  
            itemCommentArray.push(itemCommentsObject); 
            itemCommentsObject = {};
        }
        //concate two comment array old+new
        var mergedCommentArray = oldItemCommentFromMagento.concat(itemCommentArray);

    // // // if rma id is defined and rma status is approved_of_item, then update item status & details in magento
    if (rma_id != undefined && rma_status != undefined) {

        payloadForUpdatingRMA["rmaDataObject"]["increment_id"] = rmaDetails.increment_id;
        payloadForUpdatingRMA["rmaDataObject"]["entity_id"] = rma_id; //from TCC
        payloadForUpdatingRMA["rmaDataObject"]['order_id'] = rmaDetails.order_id;
        payloadForUpdatingRMA["rmaDataObject"]['order_increment_id'] = rmaDetails.order_increment_id;
        payloadForUpdatingRMA["rmaDataObject"]['store_id'] = rmaDetails.store_id;
        payloadForUpdatingRMA["rmaDataObject"]['customer_id'] = rmaDetails.customer_id;
        payloadForUpdatingRMA["rmaDataObject"]['date_requested'] = rmaDetails.date_requested;
        payloadForUpdatingRMA["rmaDataObject"]['customer_custom_email'] = rmaDetails.customer_custom_email;
        payloadForUpdatingRMA["rmaDataObject"]['items'] = itemsArray; //in above logic, it is built
        payloadForUpdatingRMA["rmaDataObject"]['status'] = rma_status;
        payloadForUpdatingRMA["rmaDataObject"]['comments'] = mergedCommentArray; //from Magento and TCC
    }
    else {
        payloadForUpdatingRMA["rmaDataObject"]["message"] = "can't use objects as associative array";
    }

     //Retrying code conditions -2
     var updateRMAResult;
     var resultdata = {};
     resultdata['request'] = {};
     if (typeof paramsRequest.update_rma_magento == "undefined" || paramsRequest.update_rma_magento.status == false){
     try{
            resultdata['integration'] = "Magento";
            resultdata['action'] = "Update RMA";
            resultdata['request']['payloadforupdatingRMA'] = payloadForUpdatingRMA;
            resultdata['request']['rma_id'] = rma_id;
            //calling updateRMA API of magento to update rma details
            updateRMAResult = await updateRMA(params, payloadForUpdatingRMA, rma_id);
            resultdata['status'] = true
            resultdata['response'] = updateRMAResult
        } catch (error) {
          if (error.code == "ECONNABORTED") {
              timeouterror = true
          }
          resultdata['status'] = false
          resultdata['response'] = error
        }
    } else if (typeof paramsRequest.update_rma_magento != "undefined" && paramsRequest.update_rma_magento.status == true) {
        updateRMAResult = paramsRequest.update_rma_magento.response;
        resultdata = paramsRequest.update_rma_magento;

    }
    responseData['update_rma_magento'] = resultdata;
    } catch (error) {
        if (typeof responseData['get_rma_info_magento']['status'] == "undefined") {
            responseData['get_rma_info_magento']['status'] = false;
        }
        if (id && typeof responseData['update_rma_magento']['status'] == "undefined") {
            responseData['update_rma_magento']['status'] = false;
        }
    }

    var published = await sendcloudevent(params, params.DUSK_MAGENTO_PROVIDER_ID, params.DUSK_LOGGING_EVENT_CODE, responseData);

    const response = {
        statusCode: 200,
        body: published
    }
    return response
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error'+ error, logger)
  }
}

exports.main = main