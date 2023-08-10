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
const {getOrderInfo, getCreditMemo, matchingOrderItems} = require('../magento')
const {getViareAuthcode, deleteOrder, isOrderExist, generatePayloadForOrderExist} = require('../viare')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))

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
    var magentoOrderId = 153;

    const header = {
        'trace':1,
        'exceptions': true,
        'connection_timeout': 15
    }

    var viareAuthToken = await getViareAuthcode(params);

    var viarePayload= {
        'authenticationToken': viareAuthToken,
        'orderItemID':viareOrderItem,
        'quantity':1
    }

    var order_data = await getOrderInfo(params, magentoOrderId);
    var orderCheckPayload = generatePayloadForOrderExist(order_data, viareAuthToken)
    var viareOrderIdResponse = await isOrderExist(params.VIARE_ORDER_API, header, orderCheckPayload);

    // var delteOrderResponse = await deleteOrder(params,headers,viarePayload);
    // var cancelOrderPayload = await matchingOrderItems(params, params.data.value.order_id, params.data.value.entity_id);

    // var cancelOrderPayload = await matchingOrderItems(params, 141, 51);
    // var orderResponse = await getOrderInfo();
    // var CreditMemoResponse = await getCreditMemo(params,params.data.value.entity_id);
    // params,params.data.value.order_id
    // var creditMemoResponse = await getCreditMemo(params, params.data.value.entity_id);


    const response = {
      statusCode: 200,
      body: viareOrderIdResponse
    }

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, error, logger)
  }
}

exports.main = main
