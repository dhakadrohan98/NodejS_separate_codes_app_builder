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
    
    var responseData = {};
    var futura_result = {}

      responseData["event_code"] = params.type;
      responseData["provider_id"] = params.source;
      responseData["event_id"] = params.event_id;
      responseData["entity"] = "Futura Fulfilment API";

    try {
        // check for missing request input parameters and headers
        const requiredParams = [/* add required params */]
        const requiredHeaders = []
        const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
        if (errorMessage) {
            // return and log client errors
            return errorResponse(400, errorMessage, logger)
        }

        var order_data = await getOrderInfo(params, params.data.value.order_id)

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

            var isOrderAvailableOnFutura = await isOrderExistonFutura(futura_order_id, params, payloadForExistingOrderCheckFutura);

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

                    try {
                            futura_result = await createOrderOnFutura(payloadFuturaOrder, params)

                            if (Object.keys(futura_result).length > 0) { // t
                                responseData['futura_order'] = {
                                    "status": ((futura_result.result.Result) && (futura_result.result.Result == true)) ? true : false,
                                    "request": payloadFuturaOrder,
                                    "response": futura_result,
                                    "action": "Creating Order",
                                    "status_code": futura_result.statusCode
                                };
                            } else {
                                responseData['futura_order'] = {
                                    "status": false,
                                    "request": payloadFuturaOrder,
                                    "response": futura_result,
                                    "action": "Creating Order",
                                    "status_code": 503
                                };
                            }

                        } catch (error) {
                            responseData['futura'] = {
                                "status": false,
                                "request": payloadFuturaOrder,
                                "response": error,
                                "action": "Creating Order",
                                "status_code": 503
                            };
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

        var final_response = await sendcloudevent(
            params,
            params.DUSK_MAGENTO_PROVIDER_ID,
            params.DUSK_LOGGING_EVENT_CODE,
            responseData
        );

        const response = {
            statusCode: 200,
            body: {
                "isAnyItemLeftForShippment": isAnyItemLeftForShippment,
                "futura_order_id": futura_order_id,
                "payloadForExistingOrderCheckFutura": payloadForExistingOrderCheckFutura,
                "isOrderAvailableOnFutura": isOrderAvailableOnFutura,
                "futura_result":futura_result,
                "payloadFuturaOrder": payloadFuturaOrder,
                "z_responseData": responseData
            }
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
