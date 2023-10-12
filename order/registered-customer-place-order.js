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
const { Core, Events } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const { getCustomerData, getCommonFieldData, getAddressData, SearchInFutura, createBlankCustomer, getCustomerDataById, UpdateCustomerInFututra, payloadForSearch } = require('../futura')
const { getCustomer, UpdateCustomerInMagento, getOrderInfo } = require('../magento')
const { generateToken, sendcloudevent } = require('../token')
const { CloudEvent } = require("cloudevents");


// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

    try {

        var paramsRequest;
        let responseData = {};
        //while retrying we get data in params.data.params
        if (typeof params.data.value !== "undefined" && typeof params.data.value.params !== "undefined") {
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
        responseData["entity"] = "Create/Update Customer";
        responseData["from"] = "Magento";
        responseData["reference_id"] = paramsRequest.id; //storing order id
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
                //const token = getBearerToken(params)

                var magecustomerupdate = {};
                var magecustomerupdatedata={};
                magecustomerupdatedata['request'] = {};
                var order_data = {};
                var viare_order = {};

                // Checking order ID is exist with params or not
                if ((params.data) && (paramsRequest.id)) {
                var order_id = paramsRequest.id;
                var orderdata={};

                //Retrying code condition -1
                if (typeof paramsRequest.get_order_data_magento == "undefined" || paramsRequest.get_order_data_magento.status == false){
                    try {
                        orderdata['integration'] = "Magento";
                        orderdata['action'] = "Get Order";
                        orderdata['request'] = order_id;
                        order_data = await getOrderInfo(params, order_id);
                        orderdata['status'] = true;
                        orderdata['response'] = order_data;
                    } catch (error) {
                        if (error.code == "ECONNABORTED") {
                            timeouterror = true
                        }
                        orderdata['status'] = false
                        orderdata['response'] = error
                    }
                } else if (paramsRequest.get_order_data_magento != undefined && paramsRequest.get_order_data_magento.status == true) {
                    order_data = paramsRequest.get_order_data_magento.response;
                    orderdata = paramsRequest.get_order_data_magento;
                }
                responseData['get_order_data_magento'] = orderdata;

                if (
                    (typeof order_data != 'undefined') &&
                    (typeof order_data.status != 'undefined') &&
                    ( (order_data.status == 'processing') ||
                    (order_data.status == 'complete') )
                ) {
                    var futuraId
                    // Checking customer is guest or not
                    if (order_data.customer_is_guest == 0) {
                        var magecustomer;
                        var magecustomerdata = {};

                        //Retrying code condition -2
                        if (typeof paramsRequest.get_customer_magento_data == "undefined" || paramsRequest.get_customer_magento_data.status == false){
                            try{
                                magecustomerdata['integration'] = "Magento";
                                magecustomerdata['action'] = "Get Customer";
                                magecustomerdata['request'] = order_data.customer_id;
                                magecustomer = await getCustomer(params, order_data.customer_id);
                                magecustomerdata['status'] = true;
                                magecustomerdata['response'] = magecustomer;
                            } catch (error) {
                                if (error.code == "ECONNABORTED") {
                                    timeouterror = true
                                }
                                magecustomerdata['status'] = false
                                magecustomerdata['response'] = error
                            }
                        } else if (paramsRequest.get_customer_magento_data != undefined && paramsRequest.get_customer_magento_data.status == true) {
                            magecustomer = paramsRequest.get_customer_magento_data.response;
                            magecustomerdata = paramsRequest.get_customer_magento_data;
                        }
                        responseData['get_customer_magento_data'] = magecustomerdata;

                        if(typeof magecustomer.custom_attributes != "undefined" && magecustomer.custom_attributes.length > 0){
                            for (var i = 0; i < magecustomer.custom_attributes.length; i++) {
                                if(magecustomer.custom_attributes[i].attribute_code == "erp_customer_id")
                                {
                                futuraId = magecustomer.custom_attributes[i].value
                                }
                            }
                        }
                    } else {
                        // <<< -- For Guest Customer --- >>
                        var magecustomer = {
                            "email": order_data.customer_email,
                            "firstname": order_data.customer_firstname,
                            "lastname": order_data.customer_lastname
                        }
                    }
                    // Searching customer by Email
                    var result = {}, searchcustomerdata = {};
                    searchcustomerdata["request"] = {};

                    //Retrying code condition -3.1
                    if (typeof paramsRequest.get_customer_futura == "undefined" || paramsRequest.get_customer_futura.status == false){
                        try {
                            searchcustomerdata['integration'] = "Futura";
                            searchcustomerdata['action'] = "Search Customer In Futura";
                            var searchPaylod =  await payloadForSearch(order_data.customer_email);
                            var customer_email = searchPaylod.web_search_kde.web_flds_fill.string[1]; //extracting email from web_flds_fill.string array;
                            searchcustomerdata['request']['payload'] = searchPaylod;
                            searchcustomerdata['request']['email'] = customer_email;
                            result = await SearchInFutura(params, searchPaylod, customer_email);
                            searchcustomerdata['status'] = true
                            searchcustomerdata['response'] = result
                        } catch (error) {
                            if (error.code == "ECONNABORTED") {
                                timeouterror = true
                            }
                            searchcustomerdata['status'] = false
                            searchcustomerdata['response'] = error
                        }
                    } else if (paramsRequest.get_customer_futura != undefined && paramsRequest.get_customer_futura.status == true) {
                        result = paramsRequest.get_customer_futura.response;
                        searchcustomerdata = paramsRequest.get_customer_futura;
                    }
                    responseData['get_customer_futura'] = searchcustomerdata;

                    // If customer found then Futura customer ID will be assign otherwise it will create new
                    var id, updatecustomer
                    if (result.length > 0 || futuraId) {
                            if(futuraId){
                                id = futuraId
                            }else{
                                id = result[0]    
                            }
                            var getcustomerdata = {};
                            
                            //Retrying code condition -3.2
                            if (typeof paramsRequest.futura_get_customer_detail == "undefined" || paramsRequest.futura_get_customer_detail.status == false) {
                            try {
                                getcustomerdata['integration'] = "Futura"
                                getcustomerdata['action'] = "Get Customer"
                                getcustomerdata['request'] = id
                                //get customer info from futura through futura_id
                                updatecustomer = await getCustomerDataById(params, id);
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
                        responseData['futura_get_customer_detail'] = getcustomerdata;
                    } else {
                        var getBlankcustomerId = {};
                        var customer;

                        //Retrying code condition -3.3
                        if (typeof paramsRequest.futura_get_blank_customer == "undefined" || paramsRequest.futura_get_blank_customer.status == false) {
                            try {
                                getBlankcustomerId['integration'] = "Futura"
                                getBlankcustomerId['action'] = "Create Blank Customer"
                                getBlankcustomerId['request'] = params;
                                customer = await createBlankCustomer(params);
                                id = customer.get_web_new_customer_idResult.web_kde_nummer
                                getBlankcustomerId['status'] = true
                                getBlankcustomerId['response'] = id
                            } catch (error) {
                                if (error.code == "ECONNABORTED") {
                                    timeouterror = true
                                }
                                getBlankcustomerId['status'] = false
                                getBlankcustomerId['response'] = error
                            }
                        } else if (typeof paramsRequest.futura_get_blank_customer != "undefined" && paramsRequest.futura_get_blank_customer.status == true) {
                            customer = paramsRequest.futura_get_blank_customer.response;
                            getBlankcustomerId = paramsRequest.futura_get_blank_customer;
        
                        }
                        responseData['futura_get_blank_customer'] = getBlankcustomerId

                        updatecustomer = {
                            "customer": getCustomerData(),
                            "comon": getCommonFieldData(),
                            "address": getAddressData()
                        }
                    }

                    // Updating (Customer address on futura, Futura ID on Magento)
                    if (id) {
                        updatecustomer.customer.web_kde_nummer = id
                        updatecustomer.address.web_ans_nummer = id
                        updatecustomer.comon.web_add_nummer = id

                        updatecustomer.comon.web_add_status = 2;
                        if ((magecustomer) && (magecustomer.dob)) {
                            const [datesting, time] = magecustomer.dob.split(' ');
                            const [year, month, day] = datesting.split('-');
                            const date = new Date(Date.UTC(year, month - 1, day));
                            const dob = date.toISOString();
                            updatecustomer.address.web_ans_sachgeburtstag = dob
                        }

                        var email = magecustomer.email;
                        updatecustomer.address.web_ans_name1 = magecustomer.firstname
                        updatecustomer.address.web_ans_name2 = magecustomer.lastname
                        updatecustomer.address.web_ans_email = email.toLowerCase()

                        // Saving billing address with customer
                        var street = order_data.billing_address.street;
                        updatecustomer.address.web_ans_strasse = street[0]
                        updatecustomer.address.web_ans_strasse_2 = (typeof street[1] == 'undefined' && street[1] != null) ? "" + street[1] : ""
                        updatecustomer.address.web_ans_ort = order_data.billing_address.city // city
                        updatecustomer.address.web_ans_plz = order_data.billing_address.postcode // postcode
                        updatecustomer.address.web_ans_telefon = order_data.billing_address.telephone // telephone
                        updatecustomer.address.web_ans_land = (order_data.billing_address.country_id == 'AU' ? 1 : 14)// country_id

                        givexnumber = updatecustomer.comon.web_add_kreditkarte

                        var updateCustomerData={}, customerdata;    
                        //Retrying code condition -4
                        if (typeof paramsRequest.update_customer_futura == "undefined" || paramsRequest.update_customer_futura.status == false) {
                            try {
                                updateCustomerData['integration'] = "Futura";
                                updateCustomerData['action'] = "Update Customer"
                                updateCustomerData['request'] = updatecustomer
                                logger.debug("Futura Data placing order")
                                logger.debug(stringParameters(updatecustomer))
                                customerdata = await UpdateCustomerInFututra(params, updatecustomer)
                                updateCustomerData['status'] = true
                                updateCustomerData['response'] = customerdata
                            } catch (error) {
                                if (error.code == "ECONNABORTED") {
                                    timeouterror = true
                                }
                                updateCustomerData['status'] = false
                                updateCustomerData['response'] = error
                            }
                        } else if (typeof paramsRequest.update_customer_futura != "undefined" && paramsRequest.update_customer_futura.status == true) {
                            customerdata = paramsRequest.update_customer_futura.response;
                            updateCustomerData = paramsRequest.update_customer_futura;
                        }
                        responseData['update_customer_futura'] = updateCustomerData;

                        var found = false;
                        var foundAndUpdate = true;
                        if (magecustomer.custom_attributes && magecustomer.custom_attributes.length > 0) {

                            for (var i = 0; i < magecustomer.custom_attributes.length; i++) {
                                if (magecustomer.custom_attributes[i].attribute_code == "erp_customer_id" && id) {
                                    if (magecustomer.custom_attributes[i].value == id) {
                                        foundAndUpdate = false;
                                    }
                                    magecustomer.custom_attributes[i].value = id
                                    found = true;
                                }
                            }

                            if (found == false) {
                                var attrdata = {
                                    "attribute_code": "erp_customer_id",
                                    "value": id
                                }
                                magecustomer.custom_attributes.push(attrdata);
                            }

                            if (foundAndUpdate == true) {

                                //Retrying code condition -5.1
                                if (typeof paramsRequest.update_customer_magento == "undefined" || paramsRequest.update_customer_magento.status == false) {
                                    try{
                                        magecustomerupdatedata['integration'] = "Magento"
                                        magecustomerupdatedata['action'] = "Update Customer"
                                        magecustomerupdatedata['request']['magecustomer'] = magecustomer;
                                        magecustomerupdatedata['request']['customer_id'] = magecustomer.id;
                                        magecustomerupdate = await UpdateCustomerInMagento(params, { "customer": magecustomer }, magecustomer.id);
                                        magecustomerupdatedata['status'] = true;
                                        magecustomerupdatedata['response'] = magecustomerupdate;
                                    } catch (error) {
                                        if (error.code == "ECONNABORTED") {
                                            timeouterror = true
                                        }
                                        magecustomerupdatedata['status'] = false
                                        magecustomerupdatedata['response'] = error
                                    }
                                } else if (typeof paramsRequest.update_customer_magento != "undefined" && paramsRequest.update_customer_magento.status == true) {
                                    magecustomerupdate = paramsRequest.update_customer_magento.response;
                                    magecustomerupdatedata = paramsRequest.update_customer_magento;
                
                                }
                                responseData['update_customer_magento'] = magecustomerupdatedata;
                            }
                        } else {
                            var attrdata = {
                                "attribute_code": "erp_customer_id",
                                "value": id
                            }
                            magecustomer.custom_attributes = [];
                            magecustomer.custom_attributes.push(attrdata);

                            //Retrying code condition -5.2
                            if (typeof paramsRequest.update_customer_magento == "undefined" || paramsRequest.update_customer_magento.status == false) {
                                try{
                                    magecustomerupdatedata['integration'] = "Magento"
                                    magecustomerupdatedata['action'] = "Update Customer"
                                    magecustomerupdatedata['request']['magecustomer'] = magecustomer;
                                    magecustomerupdatedata['request']['customer_id'] = magecustomer.id;
                                    magecustomerupdate = await UpdateCustomerInMagento(params, { "customer": magecustomer }, magecustomer.id);
                                    magecustomerupdatedata['status'] = true;
                                    magecustomerupdatedata['response'] = magecustomerupdate;
                                    } catch (error) {
                                        if (error.code == "ECONNABORTED") {
                                            timeouterror = true
                                        }
                                        magecustomerupdatedata['status'] = false
                                        magecustomerupdatedata['response'] = error
                                    }
                                } else if (typeof paramsRequest.update_customer_magento != "undefined" && paramsRequest.update_customer_magento.status == true) {
                                    magecustomerupdate = paramsRequest.update_customer_magento.response;
                                    magecustomerupdatedata = paramsRequest.update_customer_magento;
                
                                }
                                responseData['update_customer_magento'] = magecustomerupdatedata;
                        }

                        // Viare Order
                        viare_order = await sendcloudevent(params, params.VIARE_ORDER_CREATE_PROVIDERCODE, params.VIARE_ORDER_CREATE_EVENT_CODE, {'futura_customer_id': id, 'order': order_data, "givexnumber": updatecustomer.comon.web_add_kreditkarte});
                    }
                }
            }
        } catch (error) {
            if (typeof responseData['get_order_data_magento']['status'] == "undefined") {
                responseData['get_order_data_magento']['status'] = false;
            }
            if (id && typeof responseData['get_customer_magento_data']['status'] == "undefined") {
                responseData['get_customer_magento_data']['status'] = false;
            }
            if (id && typeof responseData['get_customer_futura']['status'] == "undefined") {
                responseData['get_customer_futura']['status'] = false;
            }
            if (id && typeof responseData['futura_get_customer_detail']['status'] == "undefined") {
                responseData['futura_get_customer_detail']['status'] = false;
            }
            if (id && typeof responseData['futura_get_blank_customer']['status'] == "undefined") {
                responseData['futura_get_blank_customer']['status'] = false;
            }
            if (id && typeof responseData['update_customer_futura']['status'] == "undefined") {
                responseData['update_customer_futura']['status'] = false;
            }
            if (id && typeof responseData['update_customer_magento']['status'] == "undefined") {
                responseData['update_customer_magento']['status'] = false;
            }
        }

        // Magento Logging
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
        return response

    } catch (error) {
        // log any server errors
        console.error(error); // Log the detailed error object
        // return with 500
        return errorResponse(500, 'server error' + error, logger)
    }
}

exports.main = main


