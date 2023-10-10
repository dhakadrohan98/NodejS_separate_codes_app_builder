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
const { SearchInFutura, getCommonById, payloadForSearch } = require('../futura')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {

  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    var paramsRequest;
    let responseData = {};
    //while retrying we get data in params.data.params
    if (params.data != undefined && params.data.value != undefined &&  params.data.value.params != undefined) {
      paramsRequest = params.data.value.params;
      // //If receiving parent_id from retrying then store it in responseData['id']. 
      // if(typeof params.data.value.api_id !== "undefined") {
      //     responseData["api_id"] = params.data.value.api_id;
      // }
  }
  else {
      paramsRequest = params;
  }
        responseData["event_code"] = params.type;
        responseData["provider_id"] = params.source;
        responseData["event_id"] = params.event_id;
        responseData["entity"] = "Customer";
        responseData["from"] = "Futura";
        responseData["reference_id"] = paramsRequest.email;
        responseData['params'] = paramsRequest;
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))

    try{
    // check for missing request input parameters and headers
    const requiredParams = []
    const requiredHeaders = ['Authorization']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    if(!paramsRequest.email && !paramsRequest.futura_id){
        // don't have require param
        return errorResponse(400, "email or futura_id is required parameter", logger) 
    }

    var futuraId = "", futuracustomer={}
    var lolaltyCardNo = "", futuracustomerdata={};
    var loyaltyExpiryDetails= "";
    var searchPaylod;
    var timeouterror = false;
    var getwebcommondata = {}, getWebCommonResult;

    if (typeof paramsRequest.futura_get_customer_detail == "undefined" || paramsRequest.futura_get_customer_detail.status == false) {
      try{
          futuracustomerdata['integration'] = "Futura";
          futuracustomerdata['action'] = "Get Customer Futura";
          // check payload customer based on email or futura id
          if(paramsRequest.email){
            searchPaylod =  await payloadForSearch(paramsRequest.email);
            futuracustomerdata['request'] = searchPaylod;
            futuracustomer = await SearchInFutura(params,searchPaylod, paramsRequest.email);  
          }else{
              futuracustomerdata['request'] = paramsRequest.email;
              futuracustomer = [paramsRequest.futura_id] 
          }
          futuracustomerdata['status'] = true;
          futuracustomerdata['response'] = futuracustomer;
          //Now calling getCommonById method if Futura_Id of customer is found 
          if (typeof paramsRequest.get_common_customer_futura == "undefined" || paramsRequest.get_common_customer_futura.status == false) {
            try{
              if(futuracustomer.length > 0){
                getwebcommondata['integration'] = "Futura";
                getwebcommondata['action'] = "Get Common Data Futura";
                futuraId = futuracustomer[0]
                getwebcommondata['request'] = futuraId;
                // get common detail of customer from Futura
                getWebCommonResult = await getCommonById(params, futuraId);
                var lolaltyCardNo = getWebCommonResult.web_add_kreditkarte;
                var loyaltyExpiryDetails = getWebCommonResult.web_add_sperrdatum;
                let newdate = new Date(loyaltyExpiryDetails)
                let exp = String(newdate.getFullYear());
                if(exp == "1899"){
                  loyaltyExpiryDetails = "";
                }
                getwebcommondata['status'] = true;
                getwebcommondata['response'] =  getWebCommonResult;
              }
            } catch(error){
              if (error.code == "ECONNABORTED") {
                timeouterror = true
              }
              getwebcommondata['status'] = false
              getwebcommondata['response'] = error
           }
          } else if (typeof paramsRequest.get_common_customer_futura != "undefined" && paramsRequest.get_common_customer_futura.status == true) {
            getWebCommonResult = paramsRequest.get_common_customer_futura.response;
            getwebcommondata = paramsRequest.get_common_customer_futura;

          }
          responseData['get_common_customer_futura'] = getwebcommondata;
        } catch (error) {
          if (error.code == "ECONNABORTED") {
              timeouterror = true
          }
          futuracustomerdata['status'] = false
          futuracustomerdata['response'] = error
        } 
      } else if (typeof paramsRequest.futura_get_customer_detail != "undefined" && paramsRequest.futura_get_customer_detail.status == true) {
        futuracustomer = paramsRequest.futura_get_customer_detail.response;
        futuracustomerdata = paramsRequest.futura_get_customer_detail;
    }
    responseData['futura_get_customer_detail'] = futuracustomerdata;


  } catch (error) {
    if (typeof responseData['get_common_customer_futura']['status'] == "undefined") {
        responseData['get_common_customer_futura']['status'] = false;
    }
    if (id && typeof responseData['futura_get_customer_detail']['status'] == "undefined") {
        responseData['futura_get_customer_detail']['status'] = false;
    }
  }
    
    var content = {
      "futura_id": futuraId,
      "Loyalty_card_no": lolaltyCardNo,
      "exp_date": loyaltyExpiryDetails,
      "responseData":responseData
    }

    const response = {
      statusCode: 200,
      body: content

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
