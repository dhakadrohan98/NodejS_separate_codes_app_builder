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
const {getRMADetails, getCustomer, getOrderInfo} = require('../magento')
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
    if (typeof params.data.value.params !== "undefined") {
        paramsRequest = params.data.value.params;
        // //If receiving parent_id from retrying then store it in responseData['id']. 
        // if(typeof params.data.value.api_id !== "undefined") {
        //     responseData["api_id"] = params.data.value.api_id;
        // }
      }
    else {
          paramsRequest = params.data.value;
    }

    var result, resultRMA;;
    var sku = "";

    responseData["event_code"] = params.type;
    responseData["provider_id"] = params.source;
    responseData["event_id"] = params.event_id;
    responseData["entity"] = "Order";
    responseData["from"] = "Magento";
    responseData["reference_id"] = paramsRequest.entity_id; //email is not available. storing rma_id
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

     if(paramsRequest.entity_id != null) {
      var rmaDetails;
      var rmadata = {};

      //Retrying code condition -1
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

        if(rmaDetails != undefined) {
          var customerdata = {}; 
          var customerDetails;

          //Retrying code condition -2
          if (typeof paramsRequest.magento_get_customer_info == "undefined" || paramsRequest.magento_get_customer_info.status == false) {
            try{
                customerdata['integration'] = "Magento";
                customerdata['action'] = "Get Customer";
                customerdata['request'] = rmaDetails.customer_id;
                customerDetails = await getCustomer(params, rmaDetails.customer_id);
                customerdata['status'] = true
                customerdata['response'] = customerDetails
              } catch(error) {
                if (error.code == "ECONNABORTED") {
                  timeouterror = true
                }
                customerdata['status'] = false
                customerdata['response'] = error
              }
        } else if (typeof paramsRequest.magento_get_customer_info != "undefined" && paramsRequest.magento_get_customer_info.status == true) {
          customerDetails = paramsRequest.magento_get_customer_info.response;
          customerdata = paramsRequest.magento_get_customer_info;
        } 
        responseData['magento_get_customer_info'] = customerdata;

          if(customerDetails != undefined) {
            var orderdata={};
            var orderDetails;

            //Retrying code condition -3
            if (typeof paramsRequest.magento_get_order_info == "undefined" || paramsRequest.magento_get_order_info.status == false){
              try{
                orderdata['integration']="Magento";
                orderdata['action'] = "Get Order";
                orderdata['request'] = rmaDetails.order_id;
                orderDetails = await getOrderInfo(params, rmaDetails.order_id);
                orderdata['status'] = true;
                orderdata['response'] = orderDetails;
              } catch(error) {
                  if (error.code == "ECONNABORTED") {
                    timeouterror = true
                  }
                  orderdata['status'] = false
                  orderdata['response'] = error
              }
            } else if (typeof paramsRequest.magento_get_order_info != "undefined" && paramsRequest.magento_get_order_info.status == true) {
              orderDetails = paramsRequest.magento_get_order_info.response;
              orderdata = paramsRequest.magento_get_order_info;
            } 
            responseData['magento_get_order_info'] = orderdata;

            if(orderDetails != undefined) {
 
            //Extracting item sku for payload of createRMA API of TCC
              var length = orderDetails.items.length;
              var items = orderDetails.items;
              for(i=0; i<length; i++) {
                  if(items[i].item_id == rmaDetails.items[0].order_item_id) {
                      sku = items[i].sku;
                  }
              }
            }
            var authenticationToken;
            //caching mechanism 
            var tcc_token = myCache.get('tcc_token');

            if(tcc_token == undefined) {
              var authenticationResult = await authenticate(params);
              authenticationToken = authenticationResult.Payload.AuthenticationToken;
              await myCache.set("tcc_token",authenticationToken);
            }
            else {
              authenticationToken = myCache.get('tcc_token');
              result = authenticationToken;
            }

            var resultdata = {};
            resultdata['request'] = {};

            //Retrying code condition -4
            if (typeof paramsRequest.create_rma_magento == "undefined" || paramsRequest.create_rma_magento.status == false) {
            try{
              resultdata['integration'] = "Magento";
              resultdata['action'] = "Create RMA";
              resultdata['request']['authenticationToken'] = authenticationToken;
              resultdata['request']['rmaDetails'] = rmaDetails;
              resultdata['request']['customerDetails'] = customerDetails;
              resultdata['request']['sku'] = sku;
              resultRMA = await createRMA(params, authenticationToken, rmaDetails, customerDetails, sku);
              resultdata['status'] = true
              resultdata['response'] = updatecustomer
            } catch (error) {
                if (error.code == "ECONNABORTED") {
                    timeouterror = true
                }
                resultdata['status'] = false
                resultdata['response'] = error
              }
            } else if (typeof paramsRequest.create_rma_magento != "undefined" && paramsRequest.create_rma_magento.status == true) {
                resultRMA = paramsRequest.create_rma_magento.response;
                resultdata = paramsRequest.create_rma_magento;

            }
            responseData['create_rma_magento'] = resultdata;
          }
        }
    }
    else {
        result = {"error":"provide RMA id"};
    }
  } catch (error) {
      if (typeof responseData['get_rma_info_magento']['status'] == "undefined") {
          responseData['get_rma_info_magento']['status'] = false;
      }
      if (id && typeof responseData['magento_get_customer_info']['status'] == "undefined") {
          responseData['magento_get_customer_info']['status'] = false;
      }
      if (typeof responseData['magento_get_order_info']['status'] == "undefined") {
        responseData['magento_get_order_info']['status'] = false;
      }
      if (id && typeof responseData['create_rma_magento']['status'] == "undefined") {
          responseData['create_rma_magento']['status'] = false;
      }
  }

  var published = await sendcloudevent(params, params.DUSK_MAGENTO_PROVIDER_ID, params.DUSK_LOGGING_EVENT_CODE, responseData);


  const response = {
    statusCode: 200,
    body: published
  }
  // log the response status code
  logger.info(`${response.statusCode}: successful request`)
  return response
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error'+ error, logger)
  }
}

exports.main = main