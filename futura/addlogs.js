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
const axios = require('axios');

// main function that will be executed by Adobe I/O Runtime
async function main (params) {


  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })
  const apiUrl = params.ECOMMERCE_API_URL+params.ECOMMERCE_LOGGING_ENDPOINT;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer '+params.ECOMMERCE_AUTHORIZED_TOKEN
  };

  try {
    // 'info' is the default level if not set
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

    // Create Param for logging request

    var loggingparam = {}

    if(params.data.id){
        loggingparam['id'] = params.data.id;      
    }

    loggingparam["event_id"] = params.data.event_id
    loggingparam["provider_id"] = params.data.provider_id
    loggingparam["event_code"] = params.data.event_code
    loggingparam["entity"] = params.data.entity
    if(typeof  params.data.params != "undefined") {
      loggingparam["params"] = params.data.params
    }
    loggingparam["request"]= params.data


    
    var logResponse = await callPostApi(apiUrl, headers, {"log": loggingparam});

    /*const response = {
      statusCode: 200,
      body: params['data']['entity']
    }*/
    const response = {
      statusCode: 200,
      body: logResponse
    }

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

async function callPostApi(apiUrl, headers, payload) {

  var config = {
    method: 'post',
    url: apiUrl.replace(/\\\//g, "/"),
    headers: headers,
    data : JSON.stringify(payload)
  };

  try{
      var response = await axios(config);
      if(response.status == 200){
          return response.data;
      }
  }catch(error){
      return error;
  }
}

exports.main = main
