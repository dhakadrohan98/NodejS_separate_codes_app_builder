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
const axios = require('axios');
var soap = require('soap');
const { Core, Events } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const { getOrderInfo, itemLeftForShipment} = require('../magento')

const {generatePayloadForFuturaFromEcomOrder, createOrderOnFutura, isOrderExistonFutura, payloadForExistingOrderCheck, getCommonById } = require('../futura');
const { CloudEvent } = require("cloudevents");
const { generateToken, sendcloudevent } = require('../token')

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', { level: 'info' });

    try {

        var paramsRequest;
        var responseData = {};
        var futura_order_result = {};
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
      responseData["entity"] = "Futura Fulfilment API";
      responseData["from"] = "Magento";
      responseData["reference_id"] = paramsRequest.order_id; //stroing order_id
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

            var order_data;
            var getorderdata = {}; 
            //Retrying code condition -1
            if (typeof paramsRequest.get_order_data_magento == "undefined" || paramsRequest.get_order_data_magento.status == false) {
                try{
                    getorderdata['integration'] = "Magento";
                    getorderdata['action'] = "Get Order";
                    getorderdata['request'] = paramsRequest.order_id;
                    order_data = await getOrderInfo(params, paramsRequest.order_id)
                    getorderdata['status'] = true
                    getorderdata['response'] = order_data;
                } catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    getorderdata['status'] = false
                    getorderdata['response'] = error
                }
            } else if (typeof paramsRequest.get_order_data_magento != "undefined" && paramsRequest.get_order_data_magento.status == true) {
                order_data = paramsRequest.get_order_data_magento.response;
                getorderdata = paramsRequest.get_order_data_magento;

            }
            responseData['get_order_data_magento'] = getorderdata;

            // Function will check if any item is left for the shipping. No Items should be left for shipping.
            var isAnyItemLeftForShippment = itemLeftForShipment(order_data)

            
            // If the order hasn't been shipped, and an admin creates a credit memo from the admin panel,
            // we'll check if the whole order has been refunded. If the entire order has been refunded,
            // we'll make a call to the futura fulfill order API.
            var total_paid = order_data.total_paid.toFixed(2);
            var total_refunded = (order_data.total_refunded != 'undeined') ? order_data.total_refunded.toFixed(2) : 0;

            var isOrderRefunded = ( (total_paid - total_refunded) == 0 ) ? true : false;

            // If there were no shipments made for any items in the order, and the admin issued a refund (credit memo) for the entire order,
            // we modify the "isAnyItemLeftForShippment" value based on whether the order has been fully refunded ("isOrderRefunded").
            // This adjustment avoids the need to alter the condition when calling the Futura Order Fulfill API.
            if( (isOrderRefunded == true ) && (isAnyItemLeftForShippment == true) )
            {
                isAnyItemLeftForShippment = false;
            } 

            // This check ensures whether the order status is "complete" or not.
            // We've added this check here because there are situations where the shipment and credit memo quantities 
            // might differ, but the order status shows as "completed.
            // For instance: Imagine an order with 3 items. 2 items were shipped, and 1 item was refunded. 
            // In this case, the order status changed from "processing" to "completed."
            if(order_data.status == 'complete')
            {
                isAnyItemLeftForShippment = false;
            }

        /** -- Futura order check  -- */
            /** -- Checking order is already exists or not on futura -- */
            var futura_order_id = parseInt(params.FUTURA_ORDER_RANGE) + parseInt(order_data.increment_id);
            var payloadForExistingOrderCheckFutura = payloadForExistingOrderCheck(futura_order_id);
            try {
                var isOrderAvailableOnFutura;
                var orderavailableonfuturadata = {};
                orderavailableonfuturadata['request'] = {};
                //Retrying code condition - 2
                if (typeof paramsRequest.futura_check_order_existence == "undefined" || paramsRequest.futura_check_order_existence.status == false) {
                    try{
                        orderavailableonfuturadata['integration'] = "Futura";
                        orderavailableonfuturadata['action'] = "Check Order Existence Futura";
                        orderavailableonfuturadata['request']['futura_order_id'] = futura_order_id;
                        orderavailableonfuturadata['request']['payloadForExistingOrderCheckFutura'] = payloadForExistingOrderCheckFutura;
                        isOrderAvailableOnFutura = await isOrderExistonFutura(futura_order_id, params, payloadForExistingOrderCheckFutura);
                        orderavailableonfuturadata['status'] = true;
                        orderavailableonfuturadata['response'] = isOrderAvailableOnFutura;
                    } catch (error) {
                        if (error.code == "ECONNABORTED") {
                            timeouterror = true
                        }
                        orderavailableonfuturadata['status'] = false
                        orderavailableonfuturadata['response'] = error
                    }
                } else if (typeof paramsRequest.futura_check_order_existence != "undefined" && paramsRequest.futura_check_order_existence.status == true) {
                    isOrderAvailableOnFutura = paramsRequest.futura_check_order_existence.response;
                    orderavailableonfuturadata = paramsRequest.futura_check_order_existence;
                }
                responseData['futura_check_order_existence'] = orderavailableonfuturadata;
                if(
                    isOrderAvailableOnFutura.result.Result && 
                    isOrderAvailableOnFutura.result.Result.list_db_line &&
                    (isAnyItemLeftForShippment == false)
                ){
                    var futura_customer_id

                    isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response.forEach((item, index) => {
                        if(item.Field_name == "ANG_KNR"){
                            futura_customer_id = item.Field_value
                        }
                    });

                    var only_bundle_item_exist = true;
                    // Check if only bundle item is there or not
                    order_data.items.forEach((item, index) => {
                        if (item.product_type != 'bundle') {
                            only_bundle_item_exist = false;
                        }
                    });
                    // If other product type exist then it will create the order
                    if (only_bundle_item_exist == false) {
                        var futura_payload_string = generatePayloadForFuturaFromEcomOrder(order_data, futura_order_id, futura_customer_id, params, true);
                        var payloadFuturaOrder = { "lines": { "string": futura_payload_string }};

                        var futuraorderresultdata = {};
                        try {
                                //Retrying code condition -3
                                if (typeof paramsRequest.create_order_futura == "undefined" || paramsRequest.create_order_futura.status == false) {
                                    try{
                                        futuraorderresultdata['integration'] = "Futura";
                                        futuraorderresultdata['action'] = "Create Order";
                                        futuraorderresultdata['request'] = payloadFuturaOrder;
                                        futura_order_result = await createOrderOnFutura(payloadFuturaOrder, params);
                                        futuraorderresultdata['status'] = true
                                        futuraorderresultdata['response'] = futura_order_result;
                                    } catch (error) {
                                        if (error.code == "ECONNABORTED") {
                                            timeouterror = true
                                        }
                                        futuraorderresultdata['status'] = false
                                        futuraorderresultdata['response'] = error
                                    }
                                } else if (typeof paramsRequest.create_order_futura != "undefined" && paramsRequest.create_order_futura.status == true) {
                                    futura_order_result = paramsRequest.create_order_futura.response;
                                    futuraorderresultdata = paramsRequest.create_order_futura;
                
                                }
                                responseData['create_order_futura'] = futuraorderresultdata;
                                // with order data
                                if (Object.keys(futura_order_result).length > 0) { 
                                    futuraorderresultdata = {
                                        "status": ((futura_order_result.result.Result) && (futura_order_result.result.Result == true)) ? true : false,
                                        "request": payloadFuturaOrder,
                                        "response": futura_order_result,
                                        "action": "Create Order"
                                    };
                                    responseData['create_order_futura'] = futuraorderresultdata;
                                }
                                // without order data 
                                else { 
                                    futuraorderresultdata = {
                                        "status": false,
                                        "request": payloadFuturaOrder,
                                        "response": futura_order_result,
                                        "action": "Create Order"
                                    };
                                    responseData['create_order_futura'] = futuraorderresultdata;
                                } 
                            } catch (error) {
                                futuraorderresultdata = {
                                    "status": false,
                                    "request": payloadFuturaOrder,
                                    "response": error,
                                    "action": "Create Order"
                                };
                                responseData['create_order_futura'] = futuraorderresultdata;
                            }
                    }

                } else if(isAnyItemLeftForShippment == true) {
                    responseData['futura'] = {
                        "status": true,
                        "request": payloadForExistingOrderCheckFutura,
                        "response": {"message": "Items are pending for the shipment. Order is not completed yet."},
                        "action": "Order is fulfilled",
                        "status_code": 200
                    };
                } else {
                    responseData['futura'] = {
                        "status": false,
                        "request": payloadForExistingOrderCheckFutura,
                        "response": error,
                        "action": "Order exist or not",
                        "status_code": 502
                    };
                }

            } catch (error) {
                responseData['futura'] = {
                    "status": false,
                    "request": payloadForExistingOrderCheckFutura,
                    "response": error,
                    "action": "Order exist or not",
                    "status_code": 502
                };
            }
        } catch (error) {
            if (typeof responseData['get_order_data_magento']['status'] == "undefined") {
                responseData['get_order_data_magento']['status'] = false;
            }
            if (id && typeof responseData['futura_check_order_existence']['status'] == "undefined") {
                responseData['futura_check_order_existence']['status'] = false;
            }
            if (id && typeof responseData['create_order_futura']['status'] == "undefined") {
                responseData['create_order_futura']['status'] = false;
            }
        }

        var published = await sendcloudevent(
            params,
            params.DUSK_MAGENTO_PROVIDER_ID,
            params.DUSK_LOGGING_EVENT_CODE,
            responseData
        );

        const response = {
            statusCode: 200,
            body: responseData
        }

        // log the response status code
        logger.info(response.body);
        logger.info(`${response.statusCode}: successful request`)
        return response
    } catch (error) {
        // log any server errors
        // return with 500
        return errorResponse(error.statusCode, 'Server Error: ' + ((error.message) ? (error.message) : error.error), logger)
    }
}

exports.main = main

// body: {
//     "isAnyItemLeftForShippment": isAnyItemLeftForShippment,
//     "futura_order_id": futura_order_id,
//     "payloadForExistingOrderCheckFutura": payloadForExistingOrderCheckFutura,
//     "isOrderAvailableOnFutura": isOrderAvailableOnFutura,
//     "futura_order_result":futura_order_result,
//     "payloadFuturaOrder": payloadFuturaOrder,
//     "z_responseData": responseData
// }
