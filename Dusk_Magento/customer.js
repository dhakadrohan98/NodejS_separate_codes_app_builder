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
        responseData["entity"] = "Create/Update Customer";
        responseData['params'] = params.data.value;
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

        var requestParams;
        //while retrying we get data in params.data.params
        if(params.data.params != undefined) {
            requestParams = params.data.params;
        }
        else {
            requestParams = params.data.value;
        }
        // get Magento customer
        var magecustomer = await getCustomer(params, requestParams.entity_id)
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

        // search customer by email
        var result = {}, searchcustomerdata = {}, timeouterror = false;
        var email;

        if (futuraId) {
            result[0] = futuraId
        } else {
            //Retrying code conditions -1
            if(params.data.futura_search_email != undefined) {
                if (params.data.futura_search_email != undefined && params.data.futura_search_email.status == "true") 
                {
                    result = params.data.futura_search_email.response;
                    searchcustomerdata = params.data.futura_search_email;
                }
            }
            else {
                try {
                    email = requestParams.email;
                    searchcustomerdata['action'] = "Futura Search Customer"
                    searchcustomerdata['request'] = email
                    result = await SearchInFutura(params, email);
                    searchcustomerdata['status'] = true
                    searchcustomerdata['response'] = result
                } catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    searchcustomerdata['status'] = false
                    searchcustomerdata['response'] = error
                }
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
            if(params.data.futura_get_customer_detail != undefined){
                if (params.data.futura_get_customer_detail != undefined && params.data.futura_get_customer_detail.status == "true") {
                    updatecustomer = params.data.futura_get_customer_detail.response;
                    getcustomerdata = params.data.futura_get_customer_detail;
                }
            }
            else{
                try {
                    if(params.data.futura_get_customer_detail != undefined){
                        if (params.data.futura_get_customer_detail.request != undefined) {
                            id = params.data.futura_get_customer_detail.request;
                        }
                    }
                    getcustomerdata['action'] = "Get Customer Details From Futura"
                    getcustomerdata['request'] = id 
                    updatecustomer = await getCustomerDataById(params, id)
                    getcustomerdata['status'] = true
                    getcustomerdata['response'] = updatecustomer
                } catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    getcustomerdata['status'] = false
                    getcustomerdata['response'] = error
                }
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
            if (params.data.futura_update_customer != undefined && params.data.futura_update_customer.status == "true") {
                customerdata = params.data.futura_update_customer.response;
                updateCustomer = params.data.futura_update_customer;
            }
            else {
                if(params.data.futura_update_customer != undefined){
                    if (params.data.futura_update_customer.request != undefined) {
                        updatecustomer = params.data.futura_update_customer.request;
                    }
                }
                updateCustomer['action'] = "Update Customer in Futura"
                updateCustomer['request'] = updatecustomer
                try {
                    logger.debug("Futura Data Customer")
                    logger.debug(stringParameters(updatecustomer))
                    customerdata = await UpdateCustomerInFututra(params, updatecustomer)
                    updateCustomer['status'] = true
                    updateCustomer['response'] = customerdata
                } catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    updateCustomer['status'] = false
                    updateCustomer['response'] = error
                }
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
                var magecustomerupdate = await UpdateCustomerInMagento(params, { "customer": magecustomer }, requestParams.entity_id);
            }
        }

        // calling givex API to update customer details
        var futuraId;
        var givexupdatecustomerdata = {};
        givexupdatecustomerdata['request'] = {};

        //calling getCustomerDataById function (customer info from futura)
        var customerDuskPayload = await getCustomerDataById(params, futuraId);
        givexnumber = customerDuskPayload.comon.web_add_kreditkarte;
        var updateCustomerGivexResult;
        if (givexnumber != undefined) {
            //extracting futura id from customerInfo(magento)
            var customerInfo = await getCustomer(params, requestParams.entity_id);
            var length = customerInfo.custom_attributes.length;
            for (i = 0; i < length; i++) {
                if (customerInfo.custom_attributes[i].attribute_code == "erp_customer_id") {
                    futuraId = customerInfo.custom_attributes[i].value;
                }
            }

            //Retrying code conditions -4

            if(params.data.givex_update_customer != undefined) {
                if (params.data.givex_update_customer != undefined && params.data.givex_update_customer.status == "true") {
                    updateCustomerGivexResult    = params.data.givex_update_customer.response;
                    givexupdatecustomerdata = params.data.givex_update_customer;
                }   
            }
            else {
                try {
                    if(params.data.givex_update_customer != undefined){
                        if (params.data.givex_update_customer.request.customerInfo != undefined && params.data.givex_update_customer.request.givexnumber != undefined) {
                            customerInfo = params.data.givex_update_customer.request.customerInfo;
                            givexnumber = params.data.givex_update_customer.request.givexnumber;
                        }
                    }
                    givexupdatecustomerdata['action'] = "Update Customer details in Givex";
                    givexupdatecustomerdata['request']['customerInfo'] = customerInfo;
                    givexupdatecustomerdata['request']['givexnumber'] = givexnumber;
                    var customerPayloadOfGivex = await customerDataPayload(params, 'dc_941', givexnumber, customerInfo);
                    updateCustomerGivexResult = await call(params, 'dc_941', customerPayloadOfGivex);
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
            }
            responseData['givex_update_customer'] = givexupdatecustomerdata;
        }

        // Updating dusk portal with latest customer data

        var data = {
            "futura_id": customerDuskPayload.address.web_ans_nummer,
            "card_no": customerDuskPayload.comon.web_add_kreditkarte, //customerDuskPayload.comon.web_add_kreditkarte //60586308721100032507
            "givex_id":customerDuskPayload.comon.web_add_kundennummer, //givexNumber or givexId
        }
        duskportalupdatecustomerdata = {};

        var duskPortalCustomerUpdateResult;
        var duskpayload;
        //Retrying code conditions-5

            duskportalupdatecustomerdata['customerDuskPayload'] = customerDuskPayload;
            if(params.data.dusk_portal_update_customer != undefined){
                if (params.data.dusk_portal_update_customer != undefined && params.data.dusk_portal_update_customer.status == "true") {
                    duskPortalCustomerUpdateResult = params.data.dusk_portal_update_customer.response;
                    duskportalupdatecustomerdata = params.data.dusk_portal_update_customer;
                }
            }
            else {
                try {
                    if(params.data.dusk_portal_update_customer != undefined) {
                        if (params.data.dusk_portal_update_customer.request != undefined) {
                            duskpayload = params.data.dusk_portal_update_customer.request;
                        }
                    }
                    else {
                        duskpayload = await duskportalCustomerPayload(params, customerDuskPayload,customerID, data);
                    }
                    duskportalupdatecustomerdata['action'] = "Update customer data in Dusk Portal";
                    duskportalupdatecustomerdata['request'] = duskpayload;
                    logger.debug("Dusk Portal Data Customer");
                    logger.debug(stringParameters(duskpayload));
                    duskPortalCustomerUpdateResult = await SendCustomerData(params, duskpayload);
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