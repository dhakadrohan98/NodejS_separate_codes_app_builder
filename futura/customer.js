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
        var magecustomerupdate;
        
        responseData["event_code"] = params.type;
        responseData["provider_id"] = params.source;
        responseData["event_id"] = params.event_id;
        responseData["entity"] = "Customer";
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
        var lines = [];;
        var parameter = params.data.params.value;
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


            // If futura_search_email is not present (First time request) or failed then retry it.
            if(parameter.futura_search_email == undefined || (parameter.futura_search_email.status != undefined && parameter.futura_search_email.status == "false")) {
                try {
                    email = requestParams.email;
                    searchcustomerdata['integration'] = "Futura"
                    searchcustomerdata['action'] = "Search Customer"
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
            } else if (parameter.futura_search_email != undefined && parameter.futura_search_email.status == "true")
            {
                result = parameter.futura_search_email.response;
                searchcustomerdata = parameter.futura_search_email;
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

            // if (params.data.futura_get_customer_detail != undefined && params.data.futura_get_customer_detail.status == "true") {
            //     updatecustomer = params.data.futura_get_customer_detail.response;
            //     getcustomerdata = params.data.futura_get_customer_detail;
            // } 

            if(parameter.futura_get_customer_detail == undefined || (parameter.futura_get_customer_detail.status != undefined && parameter.futura_get_customer_detail.status == "false")){
                try{
                        getcustomerdata['integration'] = "Futura"
                        getcustomerdata['action'] = "Get Customer"
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
            else if(parameter.futura_get_customer_detail != undefined && parameter.futura_get_customer_detail.status == "true") {
                updatecustomer = parameter.futura_get_customer_detail.response;
                getcustomerdata = parameter.futura_get_customer_detail;
            }
                        
            responseData['futura_get_customer_detail'] = getcustomerdata
        }
        // var response = {
        //     statusCode: 200,
        //     body: {"params":params.data}
        // }
        // return response

        if (id && timeouterror == false && getcustomerdata.status == true) {
            lines.push(165);
            // Build request for Update customer
            updatecustomer.customer.web_kde_nummer = id
            updatecustomer.address.web_ans_nummer = id
            updatecustomer.comon.web_add_nummer = id
            lines.push(170);
            updatecustomer.comon.web_add_status = 2;
            if (requestParams.dob) {
                lines.push(173);
                const [datesting, time] = requestParams.dob.split(' ');
                const [year, month, day] = datesting.split('-');
                const date = new Date(Date.UTC(year, month - 1, day));
                const dob = date.toISOString();
                updatecustomer.address.web_ans_sachgeburtstag = dob
                lines.push(179);
            } else {
                updatecustomer.address.web_ans_sachgeburtstag = updatecustomer.address.web_ans_sachgeburtstag
                lines.push(182);
            }

            var email = requestParams.email
            updatecustomer.address.web_ans_name1 = requestParams.firstname
            updatecustomer.address.web_ans_name2 = requestParams.lastname
            updatecustomer.address.web_ans_email = email.toLowerCase()

            givexnumber = updatecustomer.comon.web_add_kreditkarte

            // updatecustomer.comon.web_add_sperrdatum = "2025-12-30T00:00:00.000Z"
            
            // Update customer in Futura
            var updateCustomer = {};
            var customerdata;
            
        //     //Retrying code conditions -3
        //     // customerdata = params.data.futura_update_customer.response;
        //     // updateCustomer = params.data.futura_update_customer;


            if (parameter.futura_update_customer == undefined || (parameter.futura_update_customer.status != undefined && parameter.futura_update_customer.status == "false")) {
                lines.push(204);
                try {
                    lines.push(206);
                    //futura_update_customer.status is defined then fetch updatecustomer from requestParams.responseData.updateCustomer.request Otherwise updatecustomer is result of previous request(getCustomerDataById)
                    if(parameter.futura_update_customer != undefined && parameter.futura_update_customer.request != undefined) {
                        updatecustomer = parameter.futura_update_customer.request;
                    }
                    updateCustomer['integration'] = "Futura"
                    updateCustomer['action'] = "Update Customer"
                    updateCustomer['request'] = updatecustomer
                    lines.push(214);
                    customerdata = await UpdateCustomerInFututra(params, updatecustomer)
                    lines.push(216);
                    updateCustomer['status'] = true
                    updateCustomer['response'] = customerdata
                } catch (error) {
                    lines.push(220);
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    updateCustomer['status'] = false
                    updateCustomer['response'] = error
                    lines.push(226);
                }
            }
            else if(parameter.futura_update_customer != undefined &&  parameter.futura_update_customer.status == "true") {
                lines.push(228);
                customerdata = parameter.futura_update_customer.response;  //stroing response
                updateCustomer = parameter.futura_update_customer; //stroing whole object: futura_update_customer
                lines.push(231);
            }            
            responseData['futura_update_customer'] = updateCustomer
            lines.push(237);

            // var response = {
            //     statusCode: 200,
            //     body: {"searchcustomerdata":searchcustomerdata,"getcustomerdata":getcustomerdata,
            //             "updatecustomer":updatecustomer,"futuraId":futuraId, "customerdata":customerdata,
            //             "lines":lines, "givexnumber":givexnumber}
            // }
            // return response
        // // }

            // check and Update Futura customer Id

            var mageerp = false, magegivex = false, mageexpiry = false, magentoerp = true, magentogivex = true, magentoreward = true;
            lines.push(251);

            if (typeof magecustomer.custom_attributes != "undefined" && magecustomer.custom_attributes.length > 0) {
                lines.push(254);
                for (var i = 0; i < magecustomer.custom_attributes.length; i++) {
                    lines.push(256);
                    if (magecustomer.custom_attributes[i].attribute_code == "erp_customer_id" && id) {
                        lines.push(258);
                        if (magecustomer.custom_attributes[i].value == id) {
                            lines.push(260);
                            magentoerp = false;
                        }
                        magecustomer.custom_attributes[i].value = id
                        mageerp = true;
                        lines.push(265);
                    }
                    if (magecustomer.custom_attributes[i].attribute_code == "givex_number" && givexnumber) {
                        if (magecustomer.custom_attributes[i].value == givexnumber) {
                            lines.push(269);
                            magentogivex = false;
                        }
                        lines.push(272);
                        magecustomer.custom_attributes[i].value = givexnumber
                        magegivex = true;
                    }

                    if (magecustomer.custom_attributes[i].attribute_code == "rewards_expiry_date" && expirydate && expirydate != "1899-12-30 00:00:00") {
                        if (magecustomer.custom_attributes[i].value == expirydate) {
                            lines.push(279);
                            magentoreward = false;
                        }
                        lines.push(282);
                        magecustomer.custom_attributes[i].value = expirydate
                        mageexpiry = true;
                        lines.push(285);
                    }
                }

            }

            if (mageerp == false && id) {
                lines.push(292);
                var attrdata = {
                    "attribute_code": "erp_customer_id",
                    "value": id
                }
                if (typeof magecustomer.custom_attributes != "undefined") {
                    lines.push(298);
                    magecustomer.custom_attributes.push(attrdata);
                } else {
                    lines.push(301);
                    magecustomer["custom_attributes"] = []
                    magecustomer.custom_attributes.push(attrdata);
                    lines.push(304);
                }

            }

            if (magegivex == false && givexnumber) {
                lines.push(310);
                var attrdata = {
                    "attribute_code": "givex_number",
                    "value": givexnumber
                }
                if (typeof magecustomer.custom_attributes != "undefined") {
                    lines.push(316);
                    magecustomer.custom_attributes.push(attrdata);
                } else {
                    magecustomer["custom_attributes"] = []
                    lines.push(320);
                    magecustomer.custom_attributes.push(attrdata);
                    lines.push(322);
                }
            }

            if (mageexpiry == false && expirydate && expirydate != "1899-12-29 00:00:00" && expirydate != "1899-12-30 00:00:00") {
                lines.push(327);
                var attrdata = {
                    "attribute_code": "rewards_expiry_date",
                    "value": expirydate
                }
                if (typeof magecustomer.custom_attributes != "undefined") {
                    lines.push(333);
                    magecustomer.custom_attributes.push(attrdata);
                } else {
                    magecustomer["custom_attributes"] = []
                    magecustomer.custom_attributes.push(attrdata);
                    lines.push(338);
                }

            }

            // Update Futura Id in Magento @todo - Need to add condition for givexnumber when they change the attribute
            lines.push(344)
            if (magentoerp == true || (expirydate && expirydate != "1899-12-29 00:00:00" && expirydate != "1899-12-30 00:00:00" && magentoreward == true)) {
                lines.push(346)
                magecustomerupdate = await UpdateCustomerInMagento(params, { "customer": magecustomer }, requestParams.entity_id);
            }
            lines.push(349)
            // var response = {
            //     statusCode: 200,
            //     body: {"magentoerp":magentoerp,"expirydate":expirydate,"magentoreward":magentoreward}
            // }
            // return response;
            // body: {"searchcustomerdata":searchcustomerdata,"getcustomerdata":getcustomerdata,
            //             "updatecustomer":updatecustomer,"futuraId":futuraId,"customerdata":customerdata, 
            //             "givexnumber":givexnumber,"magecustomer":magecustomer, "magentoerp":magentoerp,"magecustomerupdate":magecustomerupdate}
            // }
        }

        lines.push(361);
        // calling givex API to update customer details
        var futuraId;
        var givexupdatecustomerdata = {};
        givexupdatecustomerdata['request'] = {};
        lines.push(366);
        //calling getCustomerDataById function (customer info from futura)
        var customerDuskPayload = await getCustomerDataById(params, futuraId);
        givexnumber = customerDuskPayload.comon.web_add_kreditkarte;
        var updateCustomerGivexResult;
        var customerPayloadOfGivex;
        lines.push(337);
        if (givexnumber != undefined) {
            lines.push(338);
            //extracting futura id from customerInfo(magento)
            var customerInfo = await getCustomer(params, requestParams.entity_id);
            var length = customerInfo.custom_attributes.length;
            for (i = 0; i < length; i++) {
                if (customerInfo.custom_attributes[i].attribute_code == "erp_customer_id") {
                    lines.push(345);
                    futuraId = customerInfo.custom_attributes[i].value;
                    lines.push(347);
                }
            }
        }

            //Retrying code conditions -4
            // if (params.data.givex_update_customer != undefined && params.data.givex_update_customer.status == "true") {
            //     updateCustomerGivexResult    = params.data.givex_update_customer.response;
            //     givexupdatecustomerdata = params.data.givex_update_customer;
            // }  
            // if(params.data.givex_update_customer != undefined){
            //     if (params.data.givex_update_customer.request.customerInfo != undefined && params.data.givex_update_customer.request.givexnumber != undefined) {
            //         customerInfo = params.data.givex_update_customer.request.customerInfo;
            //         givexnumber = params.data.givex_update_customer.request.givexnumber;
            //     }
            // } 
            // var response = {
            //     statusCode: 200,
            //     body: {"searchcustomerdata":searchcustomerdata,"getcustomerdata":getcustomerdata,
            //             "updatecustomer":updatecustomer,"futuraId":futuraId, 
            //             "customerdata":customerdata, "givexnumber":givexnumber,"customerInfo":customerInfo}
            // }
            // return response

            if(parameter.givex_update_customer == undefined || (parameter.givex_update_customer.status != undefined && parameter.givex_update_customer.status == "false")) {
                lines.push(365);
                try {
                    if(parameter.givex_update_customer != undefined && parameter.givex_update_customer.request.customerInfo != undefined && parameter.givex_update_customer.request.givexnumber != undefined){
                        lines.push(368);
                        customerInfo = parameter.givex_update_customer.request.customerInfo;
                        givexnumber = parameter.givex_update_customer.request.givexnumber;
                        lines.push(371);
                    }
                    givexupdatecustomerdata['integration'] = "Givex"
                    givexupdatecustomerdata['action'] = "Update Customer";
                    givexupdatecustomerdata['request']['customerInfo'] = customerInfo;  
                    givexupdatecustomerdata['request']['givexnumber'] = givexnumber;
                    lines.push(377);
                    customerPayloadOfGivex = await customerDataPayload(params, 'dc_941', givexnumber, customerInfo);
                    lines.push(379);
                    updateCustomerGivexResult = await call(params, 'dc_941', customerPayloadOfGivex);
                    givexupdatecustomerdata['status'] = true;
                    givexupdatecustomerdata['response'] = updateCustomerGivexResult;
                }
                catch (error) {
                    lines.push(385);
                    if (error.code == "ECONNABORTED") {
                        timeouterror = error;
                    }
                    lines.push(389);
                    givexupdatecustomerdata['status'] = false;
                    givexupdatecustomerdata['response'] = error;
                    lines.push(392);
                }  
            } 
            else if(parameter.givex_update_customer != undefined && parameter.givex_update_customer.status == "true") {
                updateCustomerGivexResult = parameter.givex_update_customer.response;
                givexupdatecustomerdata = parameter.givex_update_customer;
            }
            lines.push(399);
            responseData['givex_update_customer'] = givexupdatecustomerdata;
            lines.push(401);
            // var response = {
            //     statusCode: 200,
            //     body: {"searchcustomerdata":searchcustomerdata,"getcustomerdata":getcustomerdata,
            //             "updatecustomer":updatecustomer,"futuraId":futuraId, "customerdata":customerdata,
            //             "lines":lines, "givexnumber":givexnumber, "customerPayloadOfGivex":customerPayloadOfGivex,
            //             "givexupdatecustomerdata":givexupdatecustomerdata,"updateCustomerGivexResult":updateCustomerGivexResult}
            // }
            // return response


        // Updating dusk portal with latest customer data

        var data = {
            "futura_id": customerDuskPayload.address.web_ans_nummer,
            "card_no": customerDuskPayload.comon.web_add_kreditkarte, 
            "givex_id":customerDuskPayload.comon.web_add_kundennummer, //givexNumber or givexId
        }
        duskportalupdatecustomerdata = {};

        var duskPortalCustomerUpdateResult;
        var duskpayload;
        // //Retrying code conditions-5
        // // if (params.data.dusk_portal_update_customer != undefined && params.data.dusk_portal_update_customer.status == "true") {
        // //             duskPortalCustomerUpdateResult = params.data.dusk_portal_update_customer.response;
        // //             duskportalupdatecustomerdata = params.data.dusk_portal_update_customer;
        // // }

        if(parameter.dusk_portal_update_customer == undefined || (parameter.dusk_portal_update_customer.status != undefined && parameter.dusk_portal_update_customer.status == "false")){
            try {
                    if(parameter.dusk_portal_update_customer != undefined) {
                        if (parameter.dusk_portal_update_customer.request != undefined) {
                            duskpayload = parameter.dusk_portal_update_customer.request;
                        }
                    }
                    else {
                        duskpayload = await duskportalCustomerPayload(params, customerDuskPayload,customerID, data);
                    }
                    duskportalupdatecustomerdata['integration'] = "Dusk Portal"
                    duskportalupdatecustomerdata['action'] = "Update Customer";
                    duskportalupdatecustomerdata['request'] = duskpayload;
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
            else if(parameter.dusk_portal_update_customer != undefined && parameter.dusk_portal_update_customer.status == "true") {
                duskPortalCustomerUpdateResult = parameter.dusk_portal_update_customer.response;
                duskportalupdatecustomerdata = parameter.dusk_portal_update_customer;
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

        // var response = {
        //     statusCode: 200,
        //     body: {"searchcustomerdata":searchcustomerdata,"getcustomerdata":getcustomerdata,
        //             "updatecustomer":updatecustomer,"futuraId":futuraId, "customerdata":customerdata,
        //             "lines":lines, "givexnumber":givexnumber, "customerPayloadOfGivex":customerPayloadOfGivex,
        //             "givexupdatecustomerdata":givexupdatecustomerdata,"updateCustomerGivexResult":updateCustomerGivexResult, 
        //             "duskpayload":duskpayload, "duskPortalCustomerUpdateResult":duskPortalCustomerUpdateResult}
        // }
        // return response

        var published = await sendcloudevent(params, params.DUSK_MAGENTO_PROVIDER_ID, params.DUSK_LOGGING_EVENT_CODE, responseData)

        const response = {
            statusCode: 200,
            body: {
                "responseData":responseData
            }
        }
        return response
        // body: {
        //     "result":result, "updatecustomer":updatecustomer,"customerdata":customerdata,"magecustomerupdate":magecustomerupdate,
        //     "magecustomer":magecustomer,"customerDuskPayload":customerDuskPayload,"customerPayloadOfGivex":customerPayloadOfGivex,
        //     "updateCustomerGivexResult":updateCustomerGivexResult, "duskpayload":duskpayload,
        //     "duskPortalCustomerUpdateResult": duskPortalCustomerUpdateResult,
        //     "responseData":responseData,"magecustomerupdate":magecustomerupdate,"magecustomer":magecustomer, 
        //     "lines":lines,"magentoerp":magentoerp,"expirydate":expirydate,"magentoreward":magentoreward
        // }
    } catch (error) {
        // log any server errors
        console.error(error); // Log the detailed error object
        // return with 500
        return errorResponse(500, 'server error' + error, logger)
    }
}

exports.main = main