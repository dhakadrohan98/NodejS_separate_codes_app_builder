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
const { getCustomerData, getCommonFieldData, getAddressData, SearchInFutura, createBlankCustomer, getCustomerDataById, UpdateCustomerInFututra } = require('../futura')
const { getCustomer, UpdateCustomerInMagento } = require('../magento')
const { customerDataPayload, call } = require("../givex")
const { duskportalCustomerPayload, SendCustomerData } = require('../duskportal')
const { sendcloudevent } = require('../token')


// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

    try {

        let responseData = {};
        
        responseData["event_code"] = params.type;
        responseData["provider_id"] = params.source;
        responseData["event_id"] = params.event_id;
        responseData["entity"] = "Customer";
        responseData['params'] = params.data.value;
        // 'info' is the default level if not set
        logger.info('Calling the main action')

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
            const token = getBearerToken(params)

            var requestParams;
            var paramsRequest;
            //while retrying we get data in params.data.params
            if (typeof params.data.value.params !== "undefined") {
                requestParams = params.data.value.params;
            }
            else {
                requestParams = params.data.value;
            }
            paramsRequest = requestParams;
            // get Magento customer
            var magecustomer = await
            getCustomer(params, requestParams.entity_id)
            //Stroing magento customer id for later use
            var customerID = requestParams.entity_id;
            var futuraId
            if (typeof magecustomer.custom_attributes != "undefined" && magecustomer.custom_attributes.length > 0) {
                for (var i = 0; i < magecustomer.custom_attributes.length; i++) {
                    if (magecustomer.custom_attributes[i].attribute_code == "erp_customer_id") {
                        futuraId = magecustomer.custom_attributes[i].value
                    }
                }
            }

            //If Futura id is not found of customer, then retrun
            if(futuraId == undefined) {
                const response = {
                    statusCode: 200,
                    body: "Futura id is not available"
                }
                return response
            }

            // search customer by email
            var result = {}, searchcustomerdata = {}, timeouterror = false;
            var email;

            if (futuraId) {
                result[0] = futuraId
            } else {
                //Retrying code conditions -1


                // If futura_search_email is not present (First time request) or failed then retry it.
                if (typeof paramsRequest.futura_search_email == "undefined" || paramsRequest.futura_search_email.status == false) {
                    try {
                        email = requestParams.email;
                        searchcustomerdata['integration'] = "Futura"
                        searchcustomerdata['action'] = "Search Customer"
                        searchcustomerdata['request'] = email
                        result = await
                        SearchInFutura(params, email);
                        searchcustomerdata['status'] = true
                        searchcustomerdata['response'] = result
                    } catch (error) {
                        if (error.code == "ECONNABORTED") {
                            timeouterror = true
                        }
                        searchcustomerdata['status'] = false
                        searchcustomerdata['response'] = error
                    }
                } else if (paramsRequest.futura_search_email != undefined && paramsRequest.futura_search_email.status == true) {
                    result = paramsRequest.futura_search_email.response;
                    searchcustomerdata = paramsRequest.futura_search_email;
                }
                responseData['futura_search_email'] = searchcustomerdata
            }


            var id, updatecustomer, expirydate, givexnumber, rewarddate
            var getcustomerdata = {}
            if ((result.length > 0 || futuraId) && timeouterror == false) {
                // Get existing customer data based on Id  ""
                if (futuraId) {
                    id = parseInt(futuraId)
                } else {
                    id = result[0]
                }
                //Retrying code conditions -2
                if (typeof paramsRequest.futura_get_customer_detail == "undefined" || paramsRequest.futura_get_customer_detail.status == false) {
                    try {
                        getcustomerdata['integration'] = "Futura"
                        getcustomerdata['action'] = "Get Customer"
                        getcustomerdata['request'] = id
                        updatecustomer = await
                        getCustomerDataById(params, id)
                        getcustomerdata['status'] = true
                        getcustomerdata['response'] = updatecustomer
                    } catch (error) {
                        if (error.code == "ECONNABORTED") {
                            timeouterror = true
                        }
                        getcustomerdata['status'] = false
                        getcustomerdata['response'] = error
                    }
                } else if (typeof paramsRequest.futura_get_customer_detail != "undefined" && paramsRequest.futura_get_customer_detail.status == true) {
                    updatecustomer = paramsRequest.futura_get_customer_detail.response;
                    getcustomerdata = paramsRequest.futura_get_customer_detail;

                }
                responseData['futura_get_customer_detail'] = getcustomerdata
            }

            if (id && timeouterror == false && getcustomerdata.status == true) {

                // Build request for Update customer
                updatecustomer.customer.web_kde_nummer = id
                updatecustomer.address.web_ans_nummer = id
                updatecustomer.comon.web_add_nummer = id

                updatecustomer.comon.web_add_status = 2;
                if (requestParams.dob) {
                    const [datesting, time] = requestParams.dob.split(' ');
                    const [year, month, day] = datesting.split('-');
                    const date = new Date(Date.UTC(year, month - 1, day));
                    const dob = date.toISOString();
                    updatecustomer.address.web_ans_sachgeburtstag = dob
                } else {
                    updatecustomer.address.web_ans_sachgeburtstag = updatecustomer.address.web_ans_sachgeburtstag
                }

                var email = requestParams.email
                updatecustomer.address.web_ans_name1 = requestParams.firstname
                updatecustomer.address.web_ans_name2 = requestParams.lastname
                updatecustomer.address.web_ans_email = email.toLowerCase()

                givexnumber = updatecustomer.comon.web_add_kreditkarte

                //updatecustomer.comon.web_add_sperrdatum = "2025-12-30T00:00:00.000Z"

                // Update customer in Futura
                var updateCustomer = {};
                var customerdata;

                //Retrying code conditions -3
                if (typeof paramsRequest.futura_update_customer == "undefined" || paramsRequest.futura_update_customer.status == false) {
                    try {
                        updateCustomer['integration'] = "Futura"
                        updateCustomer['action'] = "Update Customer"
                        updateCustomer['request'] = updatecustomer
                        logger.debug("Futura Data Customer")
                        logger.debug(stringParameters(updatecustomer))
                        customerdata = await
                        UpdateCustomerInFututra(params, updatecustomer)
                        updateCustomer['status'] = true
                        updateCustomer['response'] = customerdata
                    } catch (error) {
                        if (error.code == "ECONNABORTED") {
                            timeouterror = true
                        }
                        updateCustomer['status'] = false
                        updateCustomer['response'] = error
                    }
                } else if (typeof paramsRequest.futura_update_customer != "undefined" && paramsRequest.futura_update_customer.status == true) {
                    customerdata = paramsRequest.futura_update_customer.response;
                    updateCustomer = paramsRequest.futura_update_customer;
                }
                responseData['futura_update_customer'] = updateCustomer

                // check and Update Futura customer Id

                var mageerp = false, magegivex = false, mageexpiry = false, magentoerp = true, magentogivex = true, magentoreward = true;

                if (typeof magecustomer.custom_attributes != "undefined" && magecustomer.custom_attributes.length > 0) {
                    for (var i = 0; i < magecustomer.custom_attributes.length; i++) {
                        if (magecustomer.custom_attributes[i].attribute_code == "erp_customer_id" && id) {
                            if (magecustomer.custom_attributes[i].value == id) {
                                magentoerp = false;
                            }
                            magecustomer.custom_attributes[i].value = id
                            mageerp = true;
                        }
                        if (magecustomer.custom_attributes[i].attribute_code == "givex_number" && givexnumber) {
                            if (magecustomer.custom_attributes[i].value == givexnumber) {
                                magentogivex = false;
                            }
                            magecustomer.custom_attributes[i].value = givexnumber
                            magegivex = true;
                        }

                        if (magecustomer.custom_attributes[i].attribute_code == "rewards_expiry_date" && expirydate && expirydate != "1899-12-30 00:00:00") {
                            if (magecustomer.custom_attributes[i].value == expirydate) {
                                magentoreward = false;
                            }
                            magecustomer.custom_attributes[i].value = expirydate
                            mageexpiry = true;
                        }
                    }

                }

                if (mageerp == false && id) {
                    var attrdata = {
                        "attribute_code": "erp_customer_id",
                        "value": id
                    }
                    if (typeof magecustomer.custom_attributes != "undefined") {
                        magecustomer.custom_attributes.push(attrdata);
                    } else {
                        magecustomer["custom_attributes"] = []
                        magecustomer.custom_attributes.push(attrdata);
                    }

                }

                if (magegivex == false && givexnumber) {
                    var attrdata = {
                        "attribute_code": "givex_number",
                        "value": givexnumber
                    }
                    if (typeof magecustomer.custom_attributes != "undefined") {
                        magecustomer.custom_attributes.push(attrdata);
                    } else {
                        magecustomer["custom_attributes"] = []
                        magecustomer.custom_attributes.push(attrdata);
                    }
                }

                if (mageexpiry == false && expirydate && expirydate != "1899-12-29 00:00:00" && expirydate != "1899-12-30 00:00:00") {
                    var attrdata = {
                        "attribute_code": "rewards_expiry_date",
                        "value": expirydate
                    }
                    if (typeof magecustomer.custom_attributes != "undefined") {
                        magecustomer.custom_attributes.push(attrdata);
                    } else {
                        magecustomer["custom_attributes"] = []
                        magecustomer.custom_attributes.push(attrdata);
                    }

                }

                // Update Futura Id in Magento @todo - Need to add condition for givexnumber when they change the attribute
                if (magentoerp == true || (expirydate && expirydate != "1899-12-29 00:00:00" && expirydate != "1899-12-30 00:00:00" && magentoreward == true)) {
                    var magecustomerupdate = await
                    UpdateCustomerInMagento(params, {"customer": magecustomer}, requestParams.entity_id);
                }
            }

            // calling givex API to update customer details
            var givexupdatecustomerdata = {};
            givexupdatecustomerdata['request'] = {};

            //calling getCustomerDataById function (customer info from futura)
            var customerDuskPayload = await
            getCustomerDataById(params, futuraId);
            givexnumber = customerDuskPayload.comon.web_add_kreditkarte;
            var updateCustomerGivexResult;
            if (givexnumber != undefined) {
                //extracting futura id from customerInfo(magento)
                var customerInfo = await
                getCustomer(params, requestParams.entity_id);
                var length = customerInfo.custom_attributes.length;
                for (i = 0; i < length; i++) {
                    if (customerInfo.custom_attributes[i].attribute_code == "erp_customer_id") {
                        futuraId = customerInfo.custom_attributes[i].value;
                    }
                }

                //Retrying code conditions -4

                if (typeof paramsRequest.givex_update_customer == "undefined" || paramsRequest.givex_update_customer.status == false) {
                    try {
                        if (paramsRequest.givex_update_customer != undefined) {
                            if (paramsRequest.givex_update_customer.request.customerInfo != undefined && paramsRequest.givex_update_customer.request.givexnumber != undefined) {
                                customerInfo = paramsRequest.givex_update_customer.request.customerInfo;
                                givexnumber = paramsRequest.givex_update_customer.request.givexnumber;
                            }
                        }
                        givexupdatecustomerdata['integration'] = "Givex"
                        givexupdatecustomerdata['action'] = "Update Customer";
                        givexupdatecustomerdata['request']['customerInfo'] = customerInfo;
                        givexupdatecustomerdata['request']['givexnumber'] = givexnumber;
                        var customerPayloadOfGivex = await
                        customerDataPayload(params, 'dc_941', givexnumber, customerInfo);
                        updateCustomerGivexResult = await
                        call(params, 'dc_941', customerPayloadOfGivex);
                        givexupdatecustomerdata['status'] = true;
                        givexupdatecustomerdata['response'] = updateCustomerGivexResult;
                    }
                    catch (error) {
                        if (error.code == "ECONNABORTED") {
                            timeouterror = error;
                        }
                        givexupdatecustomerdata['status'] = false;
                        givexupdatecustomerdata['response'] = error;
                    }
                } else if (typeof paramsRequest.givex_update_customer != "undefined" && paramsRequest.givex_update_customer.status == true) {
                    updateCustomerGivexResult = paramsRequest.givex_update_customer.response;
                    givexupdatecustomerdata = paramsRequest.givex_update_customer;
                }
                responseData['givex_update_customer'] = givexupdatecustomerdata;
            }

            // Updating dusk portal with latest customer data

            var data = {
                "futura_id": customerDuskPayload.address.web_ans_nummer,
                "card_no": customerDuskPayload.comon.web_add_kreditkarte, //customerDuskPayload.comon.web_add_kreditkarte //60586308721100032507
                "givex_id": customerDuskPayload.comon.web_add_kundennummer, //givexNumber or givexId
            }
            duskportalupdatecustomerdata = {};

            var duskPortalCustomerUpdateResult;
            var duskpayload;
            //Retrying code conditions-5

            duskportalupdatecustomerdata['customerDuskPayload'] = customerDuskPayload;
            if (typeof paramsRequest.dusk_portal_update_customer == "undefined" || paramsRequest.dusk_portal_update_customer.status == false) {
                try {
                    if (paramsRequest.dusk_portal_update_customer != undefined) {
                        if (paramsRequest.dusk_portal_update_customer.request != undefined) {
                            duskpayload = paramsRequest.dusk_portal_update_customer.request;
                        }
                    }
                    else {
                        duskpayload = await
                        duskportalCustomerPayload(params, customerDuskPayload, customerID, data);
                    }
                    duskportalupdatecustomerdata['integration'] = "Dusk Portal"
                    duskportalupdatecustomerdata['action'] = "Update Customer";
                    duskportalupdatecustomerdata['request'] = duskpayload;
                    logger.debug("Dusk Portal Data Customer");
                    logger.debug(stringParameters(duskpayload));
                    duskPortalCustomerUpdateResult = await
                    SendCustomerData(params, duskpayload);
                    duskportalupdatecustomerdata['status'] = true;
                    duskportalupdatecustomerdata['response'] = duskPortalCustomerUpdateResult;
                }
                catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true;
                    }
                    duskportalupdatecustomerdata["status"] = false;
                    duskportalupdatecustomerdata["response"] = error;
                }
            } else if (typeof paramsRequest.dusk_portal_update_customer != undefined && paramsRequest.dusk_portal_update_customer.status == true) {
                duskPortalCustomerUpdateResult = paramsRequest.dusk_portal_update_customer.response;
                duskportalupdatecustomerdata = paramsRequest.dusk_portal_update_customer;
            }
            responseData['dusk_portal_update_customer'] = duskportalupdatecustomerdata;

            if (timeouterror == true) {
                responseData['futura'] = {
                    "action": "Timeout error",
                    "request": requestParams,
                    "status": false,
                    "response": "Timeout error",
                }
            }
        } catch (error) {

        }

        var published = await sendcloudevent(params, params.DUSK_MAGENTO_PROVIDER_ID, params.DUSK_LOGGING_EVENT_CODE, responseData)

        const response = {
            statusCode: 200,
            body: published
        }
        return response

    } catch (error) {
        // log any server errors
        console.error(error); // Log the detailed error object
        // return with 500
        return errorResponse(500, 'server error' + error, logger)
    }
}

exports.main = main