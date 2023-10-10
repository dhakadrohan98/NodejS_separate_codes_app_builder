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
const { getOrderInfo, getshipmentInfo } = require('../magento')
const { sendcloudevent } = require('../token')
const { payloadForExistingOrderCheck, isOrderExistonFutura, createDeliveryNote, createdeliverynoteparam, SearchInFutura, deliveryExistPayload, isDeliveryNoteExist, getShipmentIncrementNumber, getNewdeliverynoteNo} = require('../futura')

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    
    var paramsRequest;
    // Variable defined for Magento Loggig
    let responseData = {};

      //while retrying we get data in params.data.params
      if (typeof params.data.value.params !== "undefined") {
        paramsRequest = params.data.value.params;
        // //If receiving parent_id from retrying then store it in responseData['api_id']. 
        // if(typeof params.data.value.api_id !== "undefined") {
        //     responseData["api_id"] = params.data.value.api_id;
        // }
    }
    else {
        paramsRequest = params.data.value;
    }

    responseData["event_code"] = params.type;
    responseData["provider_id"] = params.source;
    responseData["event_id"] = params.event_id;
    responseData["entity"] = "Order";
    responseData["from"] = "Magento";
    responseData["reference_id"] = paramsRequest.email;
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

    var orderExistonFutura = false;
    var deliveryNoteCreated = false;
    var delieveryNoteExistFlag = false
    var delivery_note_exist_for_same_shipment = false
    var deliverynoterequest = ""
    var postalcharge_params = {}
    var create_postalcharge_note = {}
    var create_postalcharge_note_request = {}
    var postal_charge_deliverynote_generated = false

    var magentolog = {}
    var shipmentinfo;
    //Retrying code condition -1
    if (typeof paramsRequest.get_shipment_magento == "undefined" || paramsRequest.get_shipment_magento.status == false){
      try {
        magentolog['integration'] = "Magento" ;
        magentolog['action'] = "Get Shipment Data";
        magentolog['request'] = paramsRequest.entity_id;
        // get magento shipment info based on the shipment id
        shipmentinfo = await getshipmentInfo(params, params.data.value.entity_id)
        magentolog['status'] = true
        magentolog['response'] = shipmentinfo
      } catch (error) {
        magentolog['status'] = false
        magentolog['response'] = error.message
      }
    } else if (typeof paramsRequest.get_shipment_magento != "undefined" && paramsRequest.get_shipment_magento.status == true) {
      shipmentinfo = paramsRequest.get_shipment_magento.response;
      magentolog = paramsRequest.get_shipment_magento;
    }
    // Adding the magento shipment fetch log for logging
    responseData["get_shipment_magento"] = magentolog

    var orderInfo;
    var orderdata = {};
    //Retrying code condition -2
    if (typeof paramsRequest.get_order_from_magento == "undefined" || paramsRequest.get_order_from_magento.status == false){
      try {
        orderdata['integration'] = "Magento" ;
        orderdata['action'] = "Get Order Data";
        orderdata['request'] = paramsRequest.order_id;
        // get Magento order info based on the order id
        orderInfo = await getOrderInfo(params, paramsRequest.order_id);
        orderdata['status'] = true
        orderdata['response'] = orderInfo;
      } catch (error) {
        orderdata['status'] = false
        orderdata['response'] = error.message
      }
    } else if (typeof paramsRequest.get_order_from_magento != "undefined" && paramsRequest.get_order_from_magento.status == true) {
      orderInfo = paramsRequest.get_order_from_magento.response;
      orderdata = paramsRequest.get_order_from_magento;
    }
    // Adding the magento order fetch log for logging
    responseData["get_order_from_magento"] = orderdata;


     //Retrying code condition -3
    let futuraordercheck = {}
    futuraordercheck['request'] = {};
    var isOrderAvailableOnFutura;
    if (typeof paramsRequest.futura_order_exist == "undefined" || paramsRequest.futura_order_exist.status == false) {
      try {
        futuraordercheck['integration'] = "Futura" ;
        futuraordercheck['request'] = orderInfo.increment_id
        futuraordercheck['action'] = "Order Exist in Futura"
        // created payload info for check order is exist or not
        // Order should be exist on the FUTURA
        var futura_order_id = parseInt(params.FUTURA_ORDER_RANGE) + parseInt(orderInfo.increment_id);
        var payloadForExistingOrderCheckFutura = payloadForExistingOrderCheck(futura_order_id);
        futuraordercheck['request']['futura_order_id'] = futura_order_id;
        futuraordercheck['request']['payloadforexistingordercheckfutura'] = payloadForExistingOrderCheckFutura
        // check order is available or not in futura
        isOrderAvailableOnFutura = await isOrderExistonFutura(futura_order_id, params, payloadForExistingOrderCheckFutura);
        futuraordercheck['status'] = true
        futuraordercheck['response'] = isOrderAvailableOnFutura
  
      } catch (error) {
        futuraordercheck['status'] = false
        futuraordercheck['response'] = error.message
        orderExistonFutura = false;
      } 
    } else if (typeof paramsRequest.futura_order_exist != "undefined" && paramsRequest.futura_order_exist.status == true) {
      isOrderAvailableOnFutura = paramsRequest.futura_order_exist.response;
      futuraordercheck = paramsRequest.futura_order_exist;
    } 
    responseData['futura_order_exist'] = futuraordercheck;  
      
    if (
      (typeof isOrderAvailableOnFutura != 'undefined') &&
      (typeof isOrderAvailableOnFutura.result != 'undefined') &&
      (isOrderAvailableOnFutura.result.Result != null) &&
      (typeof isOrderAvailableOnFutura.result.Result.list_db_line != 'undefined') &&
      (isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response[0].Field_value == futura_order_id)
    ) {
      orderExistonFutura = true;

      // Magento Logging
      let deliverynoteexist = {}  
      var isDeliveryNoteExistOrNot;    
      // ### Delivery note is exist or not for the same shipment ID Check
      
       //Retrying code condition -4
      if (typeof paramsRequest.delivery_note_exist_futura == "undefined" || paramsRequest.delivery_note_exist_futura.status == false){
        try {
          deliverynoteexist['integration'] = "Futura";
          deliverynoteexist['action'] = "Delivery Note Existence In Futura"
          // generate the payload for delivery note exist check
          var payloadOfDeliveryNoteCheck = deliveryExistPayload(futura_order_id)
          deliverynoteexist['request'] = payloadOfDeliveryNoteCheck
          // isDeliveryNoteExist (futura.js) will provide the response
          isDeliveryNoteExistOrNot = await isDeliveryNoteExist(params, payloadOfDeliveryNoteCheck);
          if (
            (typeof isDeliveryNoteExistOrNot != 'undefined') &&
            (typeof isDeliveryNoteExistOrNot.result != 'undefined') &&
            (isDeliveryNoteExistOrNot.result.Result != null) &&
            (typeof isDeliveryNoteExistOrNot.result.Result.list_db_line != 'undefined') &&
            (isDeliveryNoteExistOrNot.result.Result.list_db_line[0].DB_Response[0].Field_value == futura_order_id)
          ) {
            
            // Checking the existing delivery notes | it contains the shipment increment id
            // based on that we are identifying that delivery note is exist or not for the
            // same shipment number
            isDeliveryNoteExistOrNot.result.Result.list_db_line.forEach(result_item => {
              var deliverynote_text = result_item.DB_Response[3].Field_value
              var exist_shipment_id = getShipmentIncrementNumber(deliverynote_text)
              if (exist_shipment_id == shipmentinfo.increment_id) {
                delivery_note_exist_for_same_shipment = true;
              }
            });
  
            delieveryNoteExistFlag = true
            deliverynoteexist['status'] = true
            deliverynoteexist['response'] = isDeliveryNoteExistOrNot
          } else {
            // When order have no delivery notes
            deliverynoteexist['status'] = true  //->is false will be assigned to deliverynoteexist['status']
            deliverynoteexist['response'] = isDeliveryNoteExistOrNot
            delieveryNoteExistFlag = false
          }
        } catch (error) {
  
          // If anything goes wrong it should be logged into the Magento
          delieveryNoteExistFlag = false
          deliverynoteexist['status'] = false
          deliverynoteexist['response'] = isDeliveryNoteExistOrNot
        }
      } else if (typeof paramsRequest.delivery_note_exist_futura != "undefined" && paramsRequest.delivery_note_exist_futura.status == true) {
        isDeliveryNoteExistOrNot = paramsRequest.delivery_note_exist_futura.response;
        deliverynoteexist = paramsRequest.delivery_note_exist_futura;
        delieveryNoteExistFlag = true;
      }
      responseData['delivery_note_exist_futura'] = deliverynoteexist

      // If the delivery note exist for the same shipment then new delivery note will not generate
      // if (delivery_note_exist_for_same_shipment == false) {
        let deliveryapi = {};
        var deliverynoteparam;
        var createdeliverynote ;
         //Retrying code condition -5
      if (typeof paramsRequest.delivery_note == "undefined" || paramsRequest.delivery_note.status == false){
        try {
          deliveryapi['integration'] = "Futura"
          deliveryapi['action'] = "Create Delivery Note"
          // param for deliverynote
          deliverynoteparam = await createdeliverynoteparam(
            params, orderInfo, shipmentinfo, futura_order_id,
            isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response[1].Field_value,
            shipmentinfo.increment_id
          )
          deliveryapi['request'] = deliverynoteparam;
          // create the delivery note in futura for item.
          createdeliverynote = await createDeliveryNote(params, deliverynoteparam)
          // this variable will contain the XML request generated by SOAP | You can use this XML request
          // directly in postman. (Just Replace the '\"' )
          deliverynoterequest = createdeliverynote.lastcall
          if(
            typeof createdeliverynote.result != "undefined" &&
            typeof createdeliverynote.result.Result != 'undefined' &&
            (createdeliverynote.result.Result) &&
            (createdeliverynote.result.Result.web_Error) &&
            typeof createdeliverynote.result.Result.web_Error != 'undefined'
          ) {
            deliveryapi['status'] = false
            deliveryNoteCreated = false
          } else {
            deliveryapi['status'] = true
            deliveryNoteCreated = true            
          }
          deliveryapi['response'] = createdeliverynote

          // --------- for shipping charges ------
          // Postal Charge Delivery note will be generated only when the delivery note number is 2.
          // As per the requirement, postalcharge delivery note should be generated after 1st delivery note.
          // 1st Delivery Note will have the delivery note number 1. So that's why delivery note number should be 
          // 2 to generate the delivery note for the postal charge.
          var deleiveryno = await getNewdeliverynoteNo(params, futura_order_id);
          if(
            (orderInfo.base_shipping_amount != 0) &&
            typeof deleiveryno != undefined &&
            typeof deleiveryno.Result != undefined &&
            deleiveryno.Result == 2
          ){
            let postal_delivery_api = {}            
            postal_delivery_api['action'] = "Create Delivery Note For Postal Charge"
            params['onlyshipmentcharge'] = true;
            postalcharge_params = await createdeliverynoteparam(
              params, orderInfo, shipmentinfo, futura_order_id,
              isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response[1].Field_value,
              shipmentinfo.increment_id
            )
            postal_delivery_api['request'] = postalcharge_params
            create_postalcharge_note = await createDeliveryNote(params, postalcharge_params)
            create_postalcharge_note_request = create_postalcharge_note.lastcall

            if(
              typeof create_postalcharge_note.result != "undefined" &&
              typeof create_postalcharge_note.result.Result != 'undefined' &&
              (create_postalcharge_note.result.Result) &&
              (create_postalcharge_note.result.Result.web_Error) &&
              typeof create_postalcharge_note.result.Result.web_Error != 'undefined'
            ) {
              postal_delivery_api['status'] = false
              postal_charge_deliverynote_generated = false
            } else if(
              typeof create_postalcharge_note.result != "undefined" &&
              typeof create_postalcharge_note.result.Result != 'undefined' &&
              typeof create_postalcharge_note.result.Result == null
            ) {
              postal_delivery_api['status'] = true
              postal_charge_deliverynote_generated = false
            } else {
              postal_delivery_api['status'] = true
              postal_charge_deliverynote_generated = true            
            }

            responseData['postal_delivery_api'] = postal_delivery_api

          }          
          // ---------- ends ------
        } catch (error) {
          deliveryapi['status'] = false
          deliveryapi['response'] = error.message
          deliveryNoteCreated = false
        }
      } else if (typeof paramsRequest.delivery_note != "undefined" && paramsRequest.delivery_note.status == true) {
        createdeliverynote = paramsRequest.delivery_note.response;
        deliveryapi = paramsRequest.delivery_note;

      }
      responseData['delivery_note'] = deliveryapi

    } else {
      orderExistonFutura = false;
      futuraordercheck['status'] = false
      futuraordercheck['response'] = isOrderAvailableOnFutura
    }
    // 1. qtyy_refund > 0 ... | Call full fill.. || - 1
    // shiped -> reverse 
    // no shipment | fullfiled | all item processed || - 2

    // 12 = 1-1 refund | 8 ship | 2 refund = ship nahi refund
    // 12 - 9 ship | -2 return -3 refund

    // item 1 = 2 ordered & invoiced | 1 shipped | 1 refunded ------------> 1 returned
    // 
    responseData['futura_order_exist'] = futuraordercheck;
  } catch (error) {
    if (typeof responseData['get_shipment_magento']['status'] == "undefined") {
        responseData['get_shipment_magento']['status'] = false;
    }
    if (id && typeof responseData['get_order_from_magento']['status'] == "undefined") {
        responseData['get_order_from_magento']['status'] = false;
    }
    if (id && typeof responseData['futura_order_exist']['status'] == "undefined") {
        responseData['futura_order_exist']['status'] = false;
    }
    if (id && typeof responseData['delivery_note_exist_futura']['status'] == "undefined") {
        responseData['delivery_note_exist_futura']['status'] = false;
    }
    if (id && typeof responseData['delivery_note']['status'] == "undefined") {
        responseData['delivery_note']['status'] = false;
    }
}

  var published = await sendcloudevent(params, params.DUSK_MAGENTO_PROVIDER_ID, params.DUSK_LOGGING_EVENT_CODE, responseData)

    var custom_response = {
      "a_params_check": {
        "futura_order_id": futura_order_id,
        "shipmentinfo-increment_id": shipmentinfo.increment_id,
        "isOrderAvailableOnFutura": orderExistonFutura
      },
      "b_item_delivery_note": {
        "delieveryNoteExistFlag": delieveryNoteExistFlag,
        "delivery_note_exist_for_same_shipment": delivery_note_exist_for_same_shipment,
        "deliveryNoteCreated": deliveryNoteCreated
      },
      "c_postalcharge": {
        "postalcharge_params": postalcharge_params,
        "delivery_note_exist_for_same_shipment": delivery_note_exist_for_same_shipment,
        "create_postalcharge_note_request": create_postalcharge_note_request,
        "postal_charge_deliverynote_generated": postal_charge_deliverynote_generated
      },
      "response": responseData
    }

    const response = {
      statusCode: 200,
      body: custom_response
    }

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error' + error, logger)
  }
}

exports.main = main

