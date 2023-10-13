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
const { getOrderInfo, getshipmentInfo, getCreditmemoInfo, SearchShipmentOfOrder} = require('../magento')
const { payloadForExistingOrderCheck, isOrderExistonFutura, createDeliveryNote, createdeliverynoteparam, SearchInFutura, isDeliveryNoteExist, deliveryExistPayload} = require('../futura')
const { sendcloudevent} = require('../token')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {

    var paramsRequest;
    var responseData = {};
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

    responseData["event_code"] = params.type;
    responseData["provider_id"] = params.source;
    responseData["event_id"] = params.event_id;
    responseData["entity"] = "Futura";
    responseData["from"] = "Magento";
    responseData["reference_id"] = paramsRequest.order_id; //storin order_id
    responseData['params'] = paramsRequest;

    // 'info' is the default level if not set
    logger.info('Calling the main action')
    //reverse delivery note in Futura

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))

    try {

      // check for missing request input parameters and headers
      const requiredParams = [/* add required params */]
      const requiredHeaders = []
      const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
      if (errorMessage) {
        // return and log client errors
        return errorResponse(400, errorMessage, logger)
      }

      // extract the user Bearer token from the Authorization header
      const token = getBearerToken(params);

      var magentoorderdata= {}, orderinfo;
      var timeouterror = false;

      //stroing shipment data into shipmentinfodata object by extracting from shipment_data.items[0] when SearchShipmentOfOrder function will be called.
      var shipmentinfodata= {};
      //storing shipment_info for logging purpose
      shipmentinfodata['integration'] = "Magento";
      shipmentinfodata['request'] = paramsRequest;
      shipmentinfodata['action'] = "Get Magento Shipment Data"
      try{
        //Retrying code condition -1
        if (typeof paramsRequest.get_order_info_magento == "undefined" || paramsRequest.get_order_info_magento.status == false){
          try{
              magentoorderdata['integration'] = "Magento";
              magentoorderdata['action'] = "Order Data";
              magentoorderdata['request'] = paramsRequest.order_id;
              // get Magento order info
              orderinfo = await getOrderInfo(params, params.data.value.order_id)
              magentoorderdata["status"] = true;
              magentoorderdata["response"] = orderinfo;
            } catch (error) {
            if (error.code == "ECONNABORTED") {
                timeouterror = true
            }
            magentoorderdata['status'] = false
            magentoorderdata['response'] = error
          }
        } else if (typeof paramsRequest.get_order_info_magento != "undefined" && paramsRequest.get_order_info_magento.status == true) {
          orderinfo = paramsRequest.get_order_info_magento.response;
          magentoorderdata = paramsRequest.get_order_info_magento;

        }
        responseData['get_order_info_magento'] = magentoorderdata;

        // get magento shipment info
        var shipment_id = 0;
        var shipmentinfo = {};
        var shipmentdata = {}, shipment_data;
        //Retrying code condition -2
        if (typeof paramsRequest.get_shipment_info_magento == "undefined" || paramsRequest.get_shipment_info_magento.status == false){
          try{
              shipmentdata['integration'] = "Magento";
              shipmentdata['action'] = "Shipment Data";
              shipmentdata['request'] = paramsRequest.order_id;
              // get shipment info from magento
              shipment_data = await SearchShipmentOfOrder(params, 'order_id' , paramsRequest.order_id);
              shipmentdata["status"] = true;
              shipmentdata["response"] = orderinfo;
            } catch (error) {
              if (error.code == "ECONNABORTED") {
                  timeouterror = true
              }
              shipmentdata['status'] = false
              shipmentdata['response'] = error
            }
        } else if (typeof paramsRequest.get_shipment_info_magento != "undefined" && paramsRequest.get_shipment_info_magento.status == true) {
            shipment_data = paramsRequest.get_shipment_info_magento.response;
            shipmentdata = paramsRequest.get_shipment_info_magento;
          }
        responseData['get_shipment_info_magento'] = shipmentdata;
        if(shipment_data.items && (Object.keys(shipment_data.items).length > 0) )
        {
          shipment_id = shipment_data.items[0].increment_id
          shipmentinfo = shipment_data.items[0]
        }
        //storing magento shipment data
          shipmentinfodata['status'] = true
          shipmentinfodata['response'] = shipmentinfo
        }catch(error){
          if (error.code == "ECONNABORTED") {
            timeouterror = true
          }
          shipmentinfodata['status'] = false
          shipmentinfodata['response'] = error.message
        }
      responseData["shipment_info_magento"] = shipmentinfodata

      var creditmemodata= {};
      var creditmemoinfo;
      //Retrying code condition -3
      if (typeof paramsRequest.get_creditmemo_data_magento == "undefined" || paramsRequest.get_creditmemo_data_magento.status == false) {
        try {
          creditmemodata['integration'] = "Magento";
          creditmemodata['request'] = paramsRequest.entity_id;
          creditmemodata['action'] = "Get Cretitmemo Data";
          creditmemoinfo = await getCreditmemoInfo(params, paramsRequest.entity_id)
          creditmemodata['status'] = true
          creditmemodata['response'] = creditmemoinfo
        }catch(error){
          if (error.code == "ECONNABORTED") {
            timeouterror = true
          } 
          creditmemodata['status'] = false;
          creditmemodata['response'] = error.message;     
        }
      } else if (typeof paramsRequest.get_creditmemo_data_magento != "undefined" && paramsRequest.get_creditmemo_data_magento.status == true) {
        creditmemoinfo = paramsRequest.get_creditmemo_data_magento.response;
        creditmemodata = paramsRequest.get_creditmemo_data_magento;

      }
      responseData["get_creditmemo_data_magento"] = creditmemodata

      var futuraordercheck = {};
      futuraordercheck['request'] = {};
      var isOrderAvailableOnFutura;
      var isOrderExistOnFuturaResult;
      var futura_order_id;
      //Retrying code condition -4
      if (typeof paramsRequest.check_order_existence_futura == "undefined" || paramsRequest.check_order_existence_futura.status == false) {
        try{
            futuraordercheck['integration'] = "Futura";
            futuraordercheck['action'] = "Order Exist in Futura"
            var isOrderExistOnFutura = false
            var isOrderExistOnFuturaError = "";
            // created payload info for check order is exist or not
            futura_order_id = parseInt(params.FUTURA_ORDER_RANGE) + parseInt(orderinfo.increment_id);
            var payloadForExistingOrderCheckFutura =  payloadForExistingOrderCheck(futura_order_id);

            futuraordercheck['request']['payloadForExistingOrderCheckFutura'] = payloadForExistingOrderCheckFutura
            futuraordercheck['request']['futura_order_id'] = futura_order_id; 
            // check order is available or not in futura
            isOrderAvailableOnFutura = await isOrderExistonFutura(futura_order_id, params, payloadForExistingOrderCheckFutura);
            futuraordercheck['status'] = true
            futuraordercheck['response'] = isOrderAvailableOnFutura
            isOrderExistOnFutura = true
            isOrderExistOnFuturaResult = isOrderAvailableOnFutura

        }catch(error){
          if (error.code == "ECONNABORTED") {
            timeouterror = true
          }
            futuraordercheck['status'] = false
            futuraordercheck['response'] = error.message
            isOrderExistOnFutura = false
            isOrderExistOnFuturaError = error.message
        }
      } else if (typeof paramsRequest.check_order_existence_futura != "undefined" && paramsRequest.check_order_existence_futura.status == true) {
        isOrderAvailableOnFutura = paramsRequest.check_order_existence_futura.response;
        futuraordercheck = paramsRequest.check_order_existence_futura;
      }
      responseData['check_order_existence_futura'] = futuraordercheck;

      var deliveryNoteExistCheck = {};
      var isDeliveryNoteExistOrNot, payloadOfDeliveryNoteCheck;
      //Retrying code condition -5
      if (typeof paramsRequest.delivery_note_exist_futura == "undefined" || paramsRequest.delivery_note_exist_futura.status == false) {
        try {
          deliveryNoteExistCheck['integration'] = "Futura";
          deliveryNoteExistCheck['action'] = "Delivery Note for Order Exist in Futura";
          var delieveryNoteExistFlag = false;
          payloadOfDeliveryNoteCheck = deliveryExistPayload(futura_order_id);
          deliveryNoteExistCheck['request'] = payloadOfDeliveryNoteCheck;
          isDeliveryNoteExistOrNot = await isDeliveryNoteExist(params, payloadOfDeliveryNoteCheck)
          // var deliveryNoteExistCheckResult = isDeliveryNoteExistOrNot
          // var delieveryNoteExistRequest = isDeliveryNoteExistOrNot.lastcall

          if ( 
            (typeof isDeliveryNoteExistOrNot != 'undefined' ) && 
            (typeof isDeliveryNoteExistOrNot.result != 'undefined' ) && 
            (isDeliveryNoteExistOrNot.result.Result != null ) && 
            (typeof isDeliveryNoteExistOrNot.result.Result.list_db_line != 'undefined') && 
            (isDeliveryNoteExistOrNot.result.Result.list_db_line[0].DB_Response[0].Field_value == futura_order_id) 
            )
          {
            delieveryNoteExistFlag = true
            deliveryNoteExistCheck['status'] = true
            deliveryNoteExistCheck['response'] = isDeliveryNoteExistOrNot
          }
        } catch (error) {
          if (error.code == "ECONNABORTED") {
            timeouterror = true
          }
          delieveryNoteExistFlag = false
          deliveryNoteExistCheck['status'] = false
          deliveryNoteExistCheck['response'] = isDeliveryNoteExistOrNot
        }
      } else if (typeof paramsRequest.delivery_note_exist_futura != "undefined" && paramsRequest.delivery_note_exist_futura.status == true) {
        isDeliveryNoteExistOrNot = paramsRequest.delivery_note_exist_futura.response;
        deliveryNoteExistCheck = paramsRequest.delivery_note_exist_futura;
      }
      responseData['delivery_note_exist_futura'] = deliveryNoteExistCheck;
      
      if ( 
          (typeof isOrderAvailableOnFutura != 'undefined' ) && 
          (typeof isOrderAvailableOnFutura.result != 'undefined' ) && 
          (isOrderAvailableOnFutura.result.Result != null ) && 
          (typeof isOrderAvailableOnFutura.result.Result.list_db_line != 'undefined') && 
          (isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response[0].Field_value == futura_order_id) &&
          (delieveryNoteExistFlag == true)
          ) {
            var deliveryapidata = {};
            deliveryapidata['request'] = {};
            var createreversedeliverynote;
            //Retrying code condition -11
            if (typeof paramsRequest.create_delivery_note_futura == "undefined" || paramsRequest.create_delivery_note_futura.status == false) {
            try{
                deliveryapidata['integration'] = "Futura";
                deliveryapidata['action'] = "Reverse Delivery Note Create";
                var isReverseDeliveryNoteCreated = false              
                // param for reverse deliverynote
                var deliverynoteparamdata = {} ;
                deliverynoteparamdata['request'] = {};
                var deliverynoteparam;
                //Retrying code condition -6
                if (typeof paramsRequest.create_delivery_note_payload_futura == "undefined" || paramsRequest.create_delivery_note_payload_futura.status == false) {
                  try{
                      deliverynoteparamdata['integration'] = "Futura";
                      deliverynoteparamdata['action'] = "Create Delivery Note Payload";
                      deliverynoteparamdata['request']['orderinfo'] = orderinfo;
                      deliverynoteparamdata['request']['shipmentinfo'] = shipmentinfo;
                      deliverynoteparamdata['request']['futura_order_id'] = futura_order_id;
                      deliverynoteparamdata['request']['futura_customerid'] = isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response[1].Field_value;
                      deliverynoteparamdata['request']['shipment_id'] = shipment_id;
                      deliverynoteparamdata['request']['creditmemoinfo'] = creditmemoinfo;
                      deliverynoteparamdata['request']['is_reverse'] = is_reverse;
                      deliverynoteparam = await createdeliverynoteparam(
                        params, orderinfo, shipmentinfo, futura_order_id, 
                        isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response[1].Field_value,
                        shipment_id,
                        creditmemoinfo,
                        is_reverse = true
                      );
                      deliverynoteparamdata['status'] = true;
                      deliverynoteparamdata['response'] = deliverynoteparam;
                  } catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    deliverynoteparamdata['status'] = false
                    deliverynoteparamdata['response'] = error
                }
              } else if (typeof paramsRequest.create_delivery_note_payload_futura != "undefined" && paramsRequest.create_delivery_note_payload_futura.status == true) {
                    deliverynoteparam = paramsRequest.create_delivery_note_payload_futura.response;
                    deliverynoteparamdata = paramsRequest.create_delivery_note_payload_futura;
                }
                responseData['create_delivery_note_payload_futura'] = deliverynoteparamdata;

                //assigning deliverynoteparam to deliveryapidata.request
                deliveryapidata['request'] = deliverynoteparam;
                // create reverse delievery note request
                createreversedeliverynote = await createDeliveryNote(params,deliverynoteparam)
                deliveryapidata['status'] = true
                deliveryapidata['response'] = createreversedeliverynote;

                var deliverynoterequest = createreversedeliverynote.lastcall
                isReverseDeliveryNoteCreated = true
                
                // After making the reverse delivery note, If any postal charge is also refunding in the creditmemo
                // so add that postal charge reverse delivery note separately. This is the current requirement.
                if(
                  (orderinfo.base_shipping_amount != 0) &&
                  typeof creditmemoinfo != undefined && 
                  typeof creditmemoinfo.base_shipping_amount != undefined &&
                  creditmemoinfo.base_shipping_amount != 0
                ){
                  let postaldeliveryapidata = {};
                  postaldeliveryapidata['request'] = {};            
                  var postal_charge_deliverynote_generated = false;
                  var postalcharge_params;

                  //Retryig code condition -7
                  if (typeof paramsRequest.create_delivery_note_payload_postalcharge_futura == "undefined" || paramsRequest.create_delivery_note_payload_postalcharge_futura.status == false) {
                  try{
                      postaldeliveryapidata['integration'] = "Futura";
                      postaldeliveryapidata['action'] = "Create Reverse Delivery Note For Postal Charge";
                      postaldeliveryapidata['request']['orderinfo'] = orderinfo;
                      postaldeliveryapidata['request']['shipmentinfo'] = shipmentinfo;
                      postaldeliveryapidata['request']['futura_order_id'] = futura_order_id;
                      postaldeliveryapidata['request']['futura_customerid'] = isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response[1].Field_value;
                      postaldeliveryapidata['request']['shipment_id'] = shipment_id;
                      postaldeliveryapidata['request']['creditmemoinfo'] = creditmemoinfo;
                      postaldeliveryapidata['request']['is_reverse'] = is_reverse;
                      params['onlyshipmentcharge'] = true;
                      postalcharge_params = await createdeliverynoteparam(
                        params, orderinfo, shipmentinfo, futura_order_id, 
                        isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response[1].Field_value,
                        shipment_id,
                        creditmemoinfo,
                        is_reverse = true
                      );
                      postaldeliveryapidata['status'] = true;
                      postaldeliveryapidata['response'] = postalcharge_params;
                  } catch (error) {
                      if (error.code == "ECONNABORTED") {
                          timeouterror = true
                      }
                      postaldeliveryapidata['status'] = false
                      postaldeliveryapidata['response'] = error
                  }
              } else if (typeof paramsRequest.create_delivery_note_payload_postalcharge_futura != "undefined" && paramsRequest.create_delivery_note_payload_postalcharge_futura.status == true) {
                postalcharge_params = paramsRequest.create_delivery_note_payload_postalcharge_futura.response;
                postaldeliveryapidata = paramsRequest.create_delivery_note_payload_postalcharge_futura;

              }
              responseData['create_delivery_note_payload_postalcharge_futura'] = postaldeliveryapidata;
                  // postaldeliveryapidata['request'] = postalcharge_params
                  var createdeliverynotedata = {};
                  var create_postalcharge_note;
                  //start
                  //Retryig code condition - 8
                  if (typeof paramsRequest.create_delivery_note_postalcharge_futura == "undefined" || paramsRequest.create_delivery_note_postalcharge_futura.status == false) {
                    try{
                        createdeliverynotedata['integration'] = "Futura";
                        createdeliverynotedata['action'] = "Reverse Delivery Note Create"; 
                        createdeliverynotedata['request'] = postalcharge_params;
                        // create reverse delievery note request
                        create_postalcharge_note = await createDeliveryNote(params, postalcharge_params)
                        createdeliverynotedata['status'] = true
                        createdeliverynotedata['response'] = create_postalcharge_note;
                        } catch(error){
                        if (error.code == "ECONNABORTED") {
                            timeouterror = true
                        }
                        createdeliverynotedata['status'] = false
                        createdeliverynotedata['response'] = error.message
                        isReverseDeliveryNoteCreated = false
                     }
                  } else if (typeof paramsRequest.create_delivery_note_postalcharge_futura != "undefined" && paramsRequest.create_delivery_note_postalcharge_futura.status == true) {
                      create_postalcharge_note = paramsRequest.create_delivery_note_postalcharge_futura.response;
                      createdeliverynotedata = paramsRequest.create_delivery_note_postalcharge_futura;
                    }
                    responseData['create_delivery_note_postalcharge_futura'] = createdeliverynotedata;
                    //end 
                  var create_postalcharge_note_request = create_postalcharge_note.lastcall;

                  if(
                    typeof create_postalcharge_note.result != "undefined" &&
                    typeof create_postalcharge_note.result.Result != 'undefined' &&
                    (create_postalcharge_note.result.Result) &&
                    (create_postalcharge_note.result.Result.web_Error) &&
                    typeof create_postalcharge_note.result.Result.web_Error != 'undefined'
                  ) {
                    createdeliverynotedata['status'] = false
                    postal_charge_deliverynote_generated = false
                  } else if(
                    typeof create_postalcharge_note.result != "undefined" &&
                    typeof create_postalcharge_note.result.Result != 'undefined' &&
                    typeof create_postalcharge_note.result.Result == null
                  ) {
                    createdeliverynotedata['status'] = true
                    postal_charge_deliverynote_generated = false
                  } else {
                    createdeliverynotedata['status'] = true
                    postal_charge_deliverynote_generated = true            
                  }
                  createdeliverynotedata['response'] = create_postalcharge_note;
                  responseData['create_delivery_note_postalcharge_futura'] = createdeliverynotedata; 
                }

                // If any adjustment amount is also available in the creditmemo then it should have also a reverse
                // delivery note.

                if(
                  typeof creditmemoinfo != undefined && 
                  typeof creditmemoinfo.adjustment != undefined &&
                  creditmemoinfo.adjustment != 0
                ){
                  delete params["onlyshipmentcharge"];
           
                  var adjustment_charge_deliverynote_generated = false;
                  adjustmentdeliveryapidata;
                  var adjustmentdeliveryapidata = {};
                  var create_adjustmentcharge_note;
                  //Retryig code condition -10
                  if (typeof paramsRequest.create_delivery_note_adjustmentcharge_futura == "undefined" || paramsRequest.create_delivery_note_adjustmentcharge_futura.status == false) {
                  try{
                    adjustmentdeliveryapidata['integration'] = "Futura";
                    adjustmentdeliveryapidata['action'] = "Create Reverse Delivery Note For Adjustment Charge"
                    params['only_adjustment'] = true;

                    var adjustmentchargeparamsdata = {};
                    var adjustmentcharge_params;
                    //Retryig code condition -9
                    if (typeof paramsRequest.create_delivery_note_payload_adjustmentcharge_futura == "undefined" || paramsRequest.create_delivery_note_payload_adjustmentcharge_futura.status == false) {
                      try{
                          adjustmentchargeparamsdata['integration'] = "Futura";
                          adjustmentchargeparamsdata['action'] = "Create Delivery Note Payload";
                          adjustmentchargeparamsdata['request']['orderinfo'] = orderinfo;
                          adjustmentchargeparamsdata['request']['shipmentinfo'] = shipmentinfo;
                          adjustmentchargeparamsdata['request']['futura_order_id'] = futura_order_id;
                          adjustmentchargeparamsdata['request']['futura_customerid'] = isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response[1].Field_value;
                          adjustmentchargeparamsdata['request']['shipment_id'] = shipment_id;
                          adjustmentchargeparamsdata['request']['creditmemoinfo'] = creditmemoinfo;
                          adjustmentchargeparamsdata['request']['is_reverse'] = is_reverse;
                          adjustmentcharge_params = await createdeliverynoteparam(
                            params, orderinfo, shipmentinfo, futura_order_id, 
                            isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response[1].Field_value,
                            shipment_id,
                            creditmemoinfo,
                            is_reverse = true
                          )
                          adjustmentchargeparamsdata['status'] = true;
                          adjustmentchargeparamsdata['response'] = adjustmentcharge_params;
                      } catch (error) {
                        if (error.code == "ECONNABORTED") {
                            timeouterror = true
                        }
                        adjustmentchargeparamsdata['status'] = false
                        adjustmentchargeparamsdata['response'] = error
                      }
                    } else if (typeof paramsRequest.create_delivery_note_payload_adjustmentcharge_futura != "undefined" && paramsRequest.create_delivery_note_payload_adjustmentcharge_futura.status == true) {
                        adjustmentcharge_params = paramsRequest.create_delivery_note_payload_adjustmentcharge_futura.response;
                        adjustmentchargeparamsdata = paramsRequest.create_delivery_note_payload_adjustmentcharge_futura;
                    }
                    responseData['create_delivery_note_payload_adjustmentcharge_futura'] = adjustmentchargeparamsdata;

                    adjustmentdeliveryapidata['request'] = adjustmentcharge_params
                    create_adjustmentcharge_note = await createDeliveryNote(params, adjustmentcharge_params)
                    var create_adjustmentcharge_note_request = create_adjustmentcharge_note.lastcall

                    if(
                      typeof create_adjustmentcharge_note.result != "undefined" &&
                      typeof create_adjustmentcharge_note.result.Result != 'undefined' &&
                      (create_adjustmentcharge_note.result.Result) &&
                      (create_adjustmentcharge_note.result.Result.web_Error) &&
                      typeof create_adjustmentcharge_note.result.Result.web_Error != 'undefined'
                    ) {
                      adjustmentdeliveryapidata['status'] = false
                      adjustment_charge_deliverynote_generated = false
                    } else if(
                      typeof create_adjustmentcharge_note.result != "undefined" &&
                      typeof create_adjustmentcharge_note.result.Result != 'undefined' &&
                      typeof create_adjustmentcharge_note.result.Result == null
                    ) {
                      adjustmentdeliveryapidata['status'] = true
                      adjustment_charge_deliverynote_generated = false
                    } else {
                      adjustmentdeliveryapidata['status'] = true
                      adjustment_charge_deliverynote_generated = true            
                    }
                    adjustmentdeliveryapidata['response'] = create_adjustmentcharge_note;
                } catch (error) {
                  if (error.code == "ECONNABORTED") {
                      timeouterror = true
                  }
                  adjustmentdeliveryapidata['status'] = false
                  adjustmentdeliveryapidata['response'] = error
                }
              } else if (typeof paramsRequest.create_delivery_note_adjustmentcharge_futura != "undefined" && paramsRequest.create_delivery_note_adjustmentcharge_futura.status == true) {
                  create_adjustmentcharge_note = paramsRequest.create_delivery_note_adjustmentcharge_futura.response;
                  adjustmentdeliveryapidata = paramsRequest.create_delivery_note_adjustmentcharge_futura;
                }
                responseData['create_delivery_note_adjustmentcharge_futura'] = adjustmentdeliveryapidata;
                }

            } catch(error){
              if (error.code == "ECONNABORTED") {
                  timeouterror = true
              }
                deliveryapidata['status'] = false
                deliveryapidata['response'] = error.message
                isReverseDeliveryNoteCreated = false
            }
          } else if (typeof paramsRequest.create_delivery_note_futura != "undefined" && paramsRequest.create_delivery_note_futura.status == true) {
              createreversedeliverynote = paramsRequest.create_delivery_note_futura.response;
              deliveryapidata = paramsRequest.create_delivery_note_futura;
            }
            responseData['create_delivery_note_futura'] = deliveryapidata;
        } else {
        if(delieveryNoteExistFlag == true)
        {
          futuraordercheck['status'] = false
          futuraordercheck['response'] = isOrderAvailableOnFutura
        }
        
      }
      responseData['futura_order_exist'] = futuraordercheck;
    } catch (error) {
      if (typeof responseData['get_order_info_magento']['status'] == "undefined") {
          responseData['get_order_info_magento']['status'] = false;
      }
      if (id && typeof responseData['get_shipment_info_magento']['status'] == "undefined") {
          responseData['get_shipment_info_magento']['status'] = false;
      }
      if (id && typeof responseData['get_creditmemo_data_magento']['status'] == "undefined") {
          responseData['get_creditmemo_data_magento']['status'] = false;
      }
      if (id && typeof responseData['check_order_existence_futura']['status'] == "undefined") {
          responseData['check_order_existence_futura']['status'] = false;
      }
      if (id && typeof responseData['delivery_note_exist_futura']['status'] == "undefined") {
          responseData['delivery_note_exist_futura']['status'] = false;
      }
      if (id && typeof responseData['create_delivery_note_payload_futura']['status'] == "undefined") {
        responseData['create_delivery_note_payload_futura']['status'] = false;
      }
      if (id && typeof responseData['create_delivery_note_payload_postalcharge_futura']['status'] == "undefined") {
        responseData['create_delivery_note_payload_postalcharge_futura']['status'] = false;
      }
      if (id && typeof responseData['create_delivery_note_postalcharge_futura']['status'] == "undefined") {
        responseData['create_delivery_note_postalcharge_futura']['status'] = false;
      }
      if (id && typeof responseData['create_delivery_note_payload_adjustmentcharge_futura']['status'] == "undefined") {
        responseData['create_delivery_note_payload_adjustmentcharge_futura']['status'] = false;
      }
      if (id && typeof responseData['create_delivery_note_adjustmentcharge_futura']['status'] == "undefined") {
        responseData['create_delivery_note_adjustmentcharge_futura']['status'] = false;
      }
      if (id && typeof responseData['create_delivery_note_futura']['status'] == "undefined") {
        responseData['create_delivery_note_futura']['status'] = false;
      }
  }

    var published = await sendcloudevent(
      params,
      params.DUSK_MAGENTO_PROVIDER_ID, 
      params.DUSK_LOGGING_EVENT_CODE, 
      responseData
    )
    
    const response = {
      statusCode: 200,
      body: responseData
    }

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    logger.info(response)
    return response
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error'+ error, logger)
  }
}

exports.main = main