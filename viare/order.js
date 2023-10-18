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
const { getOrderInfo } = require('../magento')
const { getViareAuthcode, generatePayloadForOrderCreate, createOrderOnViare, geViaretOrderInfo,
    isOrderExist, generatePayloadForOrderExist } = require('../viare')
const {generatePayloadForFuturaFromEcomOrder, createOrderOnFutura, isOrderExistonFutura, payloadForExistingOrderCheck, getCommonById } = require('../futura');
const { CloudEvent } = require("cloudevents");
const { generateToken, sendcloudevent } = require('../token')

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

    try{

        const ecommerce_order_endpoint = params.ECOMMERCE_API_URL + params.ECOMMERCE_ORDER_ENDPOINT + '/';

        const providerId = params.VIARE_ORDER_CREATE_PROVIDERCODE;
        const eventCode = params.VIARE_ORDER_CREATE_EVENT_CODE;
        const eventId = params.VIARE_ORDER_CREATE_EVENT_ID;

        var paramsRequest;
        var responseData = {};
            //while retrying we get data in params.data.params
            if (typeof params.data.value !== "undefined" && typeof params.data.value.params !== "undefined") {
                paramsRequest = params.data.value.params;
                // //If receiving parent_id from retrying then store it in responseData['id']. 
                // if(typeof params.data.value.api_id !== "undefined") {
                //     responseData["api_id"] = params.data.value.api_id;
                // }
            }
            else {
                paramsRequest = params.data;
        }

        responseData["event_code"] = eventCode;
        responseData["provider_id"] = providerId;
        responseData["event_id"] = eventId;
        responseData["entity"] = "Order";
        responseData["from"] = "Magento";
        responseData["reference_id"] = paramsRequest.order;
        responseData['params'] = paramsRequest;
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
            const token = await generateToken(params);

            const viareOrderSearchEndpoint = params.VIARE_ORDER_SEARCH_API

            const header = {
                'trace': 1,
                'exceptions': true,
                'connection_timeout': 15
            }

            var getauthenticationdata={};
            var getauthentication;
            var timeouterror = false;
            //Retrying condition -1
            /*----  Viare Authtoken Generation ---*/
            if (typeof paramsRequest.get_auth_token_viare == "undefined" || paramsRequest.get_auth_token_viare.status == false) {
                try {
                    getauthenticationdata['integration'] = "Viare";
                    getauthenticationdata['action'] = "Get Auth Token";
                    getauthenticationdata['request'] = params;
                    getauthentication = await getViareAuthcode(params);
                    getauthenticationdata['status'] = true;
                    getauthenticationdata['response'] = getauthentication;
                } catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    getauthenticationdata['status'] = false
                    getauthenticationdata['response'] = error
                }
            } else if (typeof paramsRequest.get_auth_token_viare != "undefined" && paramsRequest.get_auth_token_viare.status == true) {
                getauthentication = paramsRequest.get_auth_token_viare.response;
                getauthenticationdata = paramsRequest.get_auth_token_viare;
            }
            responseData['get_auth_token_viare'] = getauthenticationdata;
            /*----  Viare Authtoken Generation | Ends ---*/

            /*
            * Checking order ID is exists with params or not
            * */
            if ((paramsRequest.order) && (paramsRequest.order.entity_id)) {
                //var order_id = params.data.value.id;
                //order_data =  await getOrderInfo(params, order_id)
                var order_id = paramsRequest.order.entity_id;
                var viareorder= false, futuraorder = false
                var order_data = {};
                order_data = paramsRequest.order;
                var isgiftcardAvailable = false, isLoyaltyPurchaseAvailable = false, isLoyaltyRenewAvailable = false



                // Check for Gift card product, Loyalty Create or Loyalty Renew

                order_data.items.forEach((item, index) => {
                    // check for gift card product exists
                    if (item.product_type == 'giftcard') {
                        isgiftcardAvailable = true
                    }

                    // check for Loyalty Product exists
                    if(item.sku == params.FUTURA_PURCHASE_LOYALTY_SKU){

                        // if customer has givex number then we will consider for renew
                        if(paramsRequest.givexnumber){
                            isLoyaltyRenewAvailable = true
                        }else{
                            isLoyaltyPurchaseAvailable = true
                        }
                    }
                });

                var isOrderExistData;
                var orderexistdata = {};
                orderexistdata['request'] = {};

                //  <<<<<<<<< Viare Order Check >>>>>>>>>>>

                if ((getauthentication) && (getauthentication.AuthenticateResult) && (getauthentication.AuthenticateResult.Message)) {
                    
                    var authtoken = getauthentication.AuthenticateResult.Message;
                    //Retrying condition -2
                    if (typeof paramsRequest.order_exist_viare == "undefined" || paramsRequest.order_exist_viare.status == false) {
                        try{
                            orderexistdata['integration'] = "Viare";
                            orderexistdata['action'] = "Order Existence Viare";
                            /** -- Generate payload and check order is existing or not -- */
                            var orderCheckPayload = generatePayloadForOrderExist(order_data, authtoken);
                            orderexistdata['request']['ordercheckpayload'] = orderCheckPayload;
                            orderexistdata['request']['header'] = header;
                            isOrderExistData = await isOrderExist(params.VIARE_ORDER_API, header, orderCheckPayload);
                            orderexistdata['status'] = true;
                            orderexistdata['response'] = isOrderExistData;
                        } catch (error) {
                            if (error.code == "ECONNABORTED") {
                                timeouterror = true
                            }
                            orderexistdata['status'] = false
                            orderexistdata['response'] = error
                        }
                    } else if (typeof paramsRequest.order_exist_viare != "undefined" && paramsRequest.order_exist_viare.status == true) {
                        isOrderExistData = paramsRequest.order_exist_viare.response;
                        orderexistdata = paramsRequest.order_exist_viare;
                    }
                    responseData['order_exist_viare'] = orderexistdata;

                    var existingOrderId = 0;
                    /** -- Generate payload and check order is existing or not | Ends -- */

                    /** -- Log the response if the order is exists otherwise generate the order and log the response -- */
                    if (
                        (Object.keys(isOrderExistData).length > 0) &&
                        (typeof isOrderExistData.SearchResult != 'undefined') &&
                        (isOrderExistData.SearchResult.Success == true) &&
                        (isOrderExistData.SearchResult.Data != null) &&
                        (typeof isOrderExistData.SearchResult.Data.int != 'undefined') &&
                        (typeof isOrderExistData.SearchResult.Data.int[0] != 'undefined')
                    ) {
                        existingOrderId = isOrderExistData.SearchResult.Data.int[0];
                        responseData['order_exist_viare'] = {};
                        responseData['order_exist_viare']['integration'] = "Viare";
                        responseData['order_exist_viare']['action'] = "Order Existence Viare";
                        responseData['order_exist_viare']['request'] = {};
                        responseData['order_exist_viare']['request']['ordercheckpayload'] =  orderCheckPayload;
                        responseData['order_exist_viare']['request']['header'] = header;
                        responseData["order_exist_viare"]['response'] = isOrderExistData;
                        responseData['order_exist_viare']['status'] = true;
                        viareorder= true
                    } else {
                        var payload = generatePayloadForOrderCreate(order_data, authtoken);
                        if (payload !== false) {
                            var order_create = {};
                            var ordercreateonviaredata = {};
                            ordercreateonviaredata['request'] = {};
                            //Retrying condition -3
                            if (typeof paramsRequest.create_order_viare == "undefined" || paramsRequest.create_order_viare.status == false) {
                                try {
                                    ordercreateonviaredata['integration'] = "Viare";
                                    ordercreateonviaredata['action'] = "Create Order Viare";
                                    ordercreateonviaredata['request']['header'] = header;
                                    ordercreateonviaredata['request']['payload'] = payload;
                                    order_create = await createOrderOnViare(params.VIARE_ORDER_API, header, payload);
                                    ordercreateonviaredata['status'] = true
                                    ordercreateonviaredata['response'] = order_create;
                                } catch (error) {
                                    if (error.code == "ECONNABORTED") {
                                        timeouterror = true
                                    }
                                    ordercreateonviaredata['status'] = false
                                    ordercreateonviaredata['response'] = error
                                }
                            } else if (typeof paramsRequest.create_order_viare != "undefined" && paramsRequest.create_order_viare.status == true) {
                                order_create = paramsRequest.create_order_viare.response;
                                ordercreateonviaredata = paramsRequest.create_order_viare;
                            }
                            responseData['create_order_viare'] = ordercreateonviaredata;

                            viareorder = (order_create.ImportOrderResult.Code == 0) ? true : false
                            var viareOrderId = 0;
                            var viareOrderItems = [];

                            if (Object.keys(order_create).length !== 0) {
                                if (order_create.ImportOrderResult.Code == 0) {
                                    /* <<<---- Oredr ID and Order Item ID Sync --->>> */
                                    // var orderIdViare = order_create.ImportOrderResult.Data.int[0];
                                    // var viare_order_info = await geViaretOrderInfo(params.VIARE_ORDER_API, header, authtoken, orderIdViare)
                                    //
                                    // if (viare_order_info.RetrieveResult && (viare_order_info.RetrieveResult.Code == 0)){
                                    //     var viareOrder = viare_order_info.RetrieveResult.Data.Order[0];
                                    //     viareOrderId = viareOrder.ID;
                                    //     var orderItems = viareOrder.OrderItems.OrderItem;
                                    //     orderItems.forEach((item, index) => {
                                    //         viareOrderItems.push({'sku': item.Barcode, 'item_id': item.ID, 'order_id': item.OrderID})
                                    //     })
                                    // }        
                                    /* <<<---- Oredr ID and Order Item ID Sync --->>> */
                                }
                            }
                        } else {
                            // When only virtual products are available in the cart
                            viareorder= true
                        }
                    }
                } else {
                    responseData['get_auth_token_viare'] = {};
                    responseData['get_auth_token_viare']['integration'] = "Viare";
                    responseData['get_auth_token_viare']['action'] = "Get Auth Token";
                    responseData['get_auth_token_viare']['request'] = {};
                    responseData['get_auth_token_viare']['response'] = { 'errorCode': getauthentication.errno, "message": (getauthentication.errno == '-3008' ? "Not able to connect. Server timeout." : "Something went wrong.") };
                    responseData['get_auth_token_viare']['status'] = false;
                    // responseData['viare'] = {
                    //     "status": false,
                    //     "request": {},
                    //     "response": { 'errorCode': getauthentication.errno, "message": (getauthentication.errno == '-3008' ? "Not able to connect. Server timeout." : "Something went wrong.") },
                    //     "action": "Viare Authorization Token",
                    //     "status_code": 502
                    // };
                }



                // <<<<<<<<<<< Viare Order Check | Ends >>>>>>>>>>>>>


                /** -- Futura order check  -- */
                /** -- Checking order is already exists or not on futura -- */
                var futura_order_id = parseInt(params.FUTURA_ORDER_RANGE) + parseInt(order_data.increment_id);
                var payloadForExistingOrderCheckFutura = payloadForExistingOrderCheck(futura_order_id);
                var isOrderAvailableOnFutura;
                var isorderavailableonfuturadata = {};
                isorderavailableonfuturadata['request'] = {};
                //Retrying condition -4
                if (typeof paramsRequest.is_order_exist_futura == "undefined" || paramsRequest.is_order_exist_futura.status == false) {    
                    try {
                        isorderavailableonfuturadata['integration'] = "Futura";
                        isorderavailableonfuturadata['action'] = "Check Order Futura";
                        isorderavailableonfuturadata['request']['futura_order_id'] = futura_order_id;
                        isorderavailableonfuturadata['request']['payloadForExistingOrderCheckFutura'] = payloadForExistingOrderCheckFutura;
                        isOrderAvailableOnFutura = await isOrderExistonFutura(futura_order_id, params, payloadForExistingOrderCheckFutura);

                            if (
                                (typeof isOrderAvailableOnFutura != 'undefined') &&
                                (typeof isOrderAvailableOnFutura.result != 'undefined') &&
                                (isOrderAvailableOnFutura.result.Result != null) &&
                                (typeof isOrderAvailableOnFutura.result.Result.list_db_line != 'undefined') &&
                                (isOrderAvailableOnFutura.result.Result.list_db_line[0].DB_Response[0].Field_value == futura_order_id)
                            ) {
                                //order available on futura
                                isorderavailableonfuturadata['status'] = true;
                                isorderavailableonfuturadata['response'] = isOrderAvailableOnFutura;
                                futuraorder = true
                            } else {
                                /** -- Creating order on Futura -- */
                                var futura_customer_id = paramsRequest.futura_customer_id;
                                var only_bundle_item_exist = true;
                                // Check if only bundle item is there or not
                                order_data.items.forEach((item, index) => {
                                    if (item.product_type != 'bundle') {
                                        only_bundle_item_exist = false;
                                    }
                                });
                                // If other product type exist then it will create the order
                                if (only_bundle_item_exist == false) {
                                    var futura_payload_string = generatePayloadForFuturaFromEcomOrder(order_data, futura_order_id, futura_customer_id, params);
                                    var payloadFuturaOrder = { "lines": { "string": futura_payload_string } };
                                    
                                    var futura_result = {};
                                    var futuraordercreatedata = {};
                                    //Retrying condition -5
                                    if (typeof paramsRequest.create_order_futura == "undefined" || paramsRequest.create_order_futura.status == false) {
                                        try {
                                            futuraordercreatedata['integration'] = "Futura";
                                            futuraordercreatedata['action'] = "Create Order Futura"
                                            futuraordercreatedata['request'] = payloadFuturaOrder;
                                            futura_result = await createOrderOnFutura(payloadFuturaOrder, params);

                                            if (Object.keys(futura_result).length > 0) { 
                                                futuraordercreatedata['status'] = true;
                                                futuraordercreatedata['response'] = futura_result;
                                                // responseData['futura_order'] = {
                                                //     "status": ((futura_result.result.Result) && (futura_result.result.Result == true)) ? true : false,
                                                //     "request": payloadFuturaOrder,
                                                //     "response": futura_result,
                                                //     "action": "Creating Order",
                                                //     "status_code": futura_result.statusCode
                                                // };
                                                futuraorder = ((futura_result.result.Result) && (futura_result.result.Result == true)) ? true : false
                                            } else {
                                                futuraordercreatedata['status'] = false;
                                                futuraordercreatedata['response'] = futura_result;
                                                // responseData['futura_order'] = {
                                                //     "status": false,
                                                //     "request": payloadFuturaOrder,
                                                //     "response": futura_result,
                                                //     "action": "Creating Order",
                                                //     "status_code": 503
                                                // };
                                            }
                                        } catch (error) {
                                            if (error.code == "ECONNABORTED") {
                                                timeouterror = true
                                            }
                                            futuraordercreatedata['status'] = false
                                            futuraordercreatedata['response'] = error
                                        }
                                    } else if (typeof paramsRequest.create_order_futura != "undefined" && paramsRequest.create_order_futura.status == true) {
                                        futura_result = paramsRequest.create_order_futura.response;
                                        futuraordercreatedata = paramsRequest.create_order_futura;
                                    }
                                    responseData['create_order_futura'] = futuraordercreatedata;
                                } else {
                                    // If bundle product is exist then it will not create the order.
                                    //only log the response;
                                    var bundleitemsfuturadata = {};
                                    bundleitemsfuturadata['integration'] = "Futura";
                                    bundleitemsfuturadata['action'] = {};
                                    bundleitemsfuturadata['request'] = order_data;
                                    bundleitemsfuturadata['response'] = { 'message': "Only bundle product exist in the order." };
                                    bundleitemsfuturadata['status'] = true;
                                    responseData['bundle_items_order_futura'] = bundleitemsfuturadata;
                                    futuraorder = true
                                    // responseData['bundle_items_order_futura'] = {
                                    //     "status": true,
                                    //     "request": order_data,
                                    //     "response": { 'message': "Only bundle product exist in the order." },
                                    //     "action": "Creating Order",
                                    //     "status_code": 200
                                    // };
                                }
                            }

                        } catch (error) {
                            if (error.code == "ECONNABORTED") {
                                timeouterror = true
                            }
                            isorderavailableonfuturadata['status'] = false
                            isorderavailableonfuturadata['response'] = error
                    }
                } else if (typeof paramsRequest.is_order_exist_futura != "undefined" && paramsRequest.is_order_exist_futura.status == true) {
                    isOrderAvailableOnFutura = paramsRequest.is_order_exist_futura.response;
                    isorderavailableonfuturadata = paramsRequest.is_order_exist_futura;

                }
                responseData['is_order_exist_futura'] = isorderavailableonfuturadata;

                // if futura and viare both get success
                if(futuraorder == true && viareorder == true){
                    // Create order on GIVEX if the loyaltynumber is available
                    if((paramsRequest.order) && (paramsRequest.givexnumber))
                    {
                        var createordergivexdata = {}, loyaltypointsresponse;
                        var loyaltypoints_payload;
                        if (typeof paramsRequest.create_order_givex_sendcloudevent == "undefined" || paramsRequest.create_order_givex_sendcloudevent.status == false) {
                            try {
                                //Rerying condition -6
                                createordergivexdata['integration'] = "Givex";
                                createordergivexdata['action'] = "Create Order"
                                loyaltypoints_payload = {"value": {"givexnumber": ""+paramsRequest.givexnumber, "order": paramsRequest.order}}
                                createordergivexdata['request'] = loyaltypoints_payload;
                                loyaltypointsresponse = await sendcloudevent(
                                params,
                                params.GIVEX_LOYALTYPOINTS_PROVIDER_ID,
                                params.GIVEX_LOYALTYPOINTS_EVENTCODE,
                                loyaltypoints_payload
                                );
                                createordergivexdata['status'] = true;
                                createordergivexdata['response'] = loyaltypointsresponse;
                            } catch (error) {
                                if (error.code == "ECONNABORTED") {
                                    timeouterror = true
                                }
                                createordergivexdata['status'] = false
                                createordergivexdata['response'] = error
                            }
                        } else if (typeof paramsRequest.create_order_givex_sendcloudevent != "undefined" && paramsRequest.create_order_givex_sendcloudevent.status == true) {
                            loyaltypointsresponse = paramsRequest.create_order_givex_sendcloudevent.response;
                            createordergivexdata = paramsRequest.create_order_givex_sendcloudevent;
                        }
                        responseData['create_order_givex_sendcloudevent'] = createordergivexdata;                        
                    }

                    // if gift card product is there execute giftcard purchase event
                    if(isgiftcardAvailable == true){
                        var giftcardPayload = { "value": { "order": paramsRequest.order, "futura_id": paramsRequest.futura_customer_id } }
                        // Checking if the futura order is created or not. If futura order is created means giftcard order is 
                        // also created.
                        if(
                            (responseData.futura_order) && 
                            (responseData.futura_order.status) && 
                            (responseData.futura_order.status == true) 
                        ) {
                            var giftcardpurchasedata = {};
                            var gitcardResponse;
                            //Retrying condition -7 
                            if (typeof paramsRequest.create_gift_card_sendcloudevent == "undefined" || paramsRequest.create_gift_card_sendcloudevent.status == false) {
                                try {
                                    giftcardpurchasedata['integration'] = "Givex";
                                    giftcardpurchasedata['action'] = "Create Gift Card";
                                    giftcardpurchasedata['request'] = giftcardPayload;
                                    // Event Call | It will not create any giftcard if the order is not having any giftcard type item
                                    gitcardResponse = await sendcloudevent(
                                        params,
                                        params.GIVEX_GIFTCARD_CREATE_PROVIDER_ID,
                                        params.GIVEX_GIFTCARD_CREATE_EVENTCODE,
                                        giftcardPayload
                                    );
                                    giftcardpurchasedata['status'] = true;
                                    giftcardpurchasedata['response'] = gitcardResponse;
                                } catch (error) {
                                    if (error.code == "ECONNABORTED") {
                                        timeouterror = true
                                    }
                                    giftcardpurchasedata['status'] = false
                                    giftcardpurchasedata['response'] = error
                                }
                            } else if (typeof paramsRequest.create_gift_card_sendcloudevent != "undefined" && paramsRequest.create_gift_card_sendcloudevent.status == true) {
                                gitcardResponse = paramsRequest.create_gift_card_sendcloudevent.response;
                                giftcardpurchasedata = paramsRequest.create_gift_card_sendcloudevent;
            
                            }
                            responseData['create_gift_card_sendcloudevent'] = giftcardpurchasedata;
                        }
                    }

                    // If Purchase new loyalty card this execute this event
                    if(isLoyaltyPurchaseAvailable == true){
                        var loyaltypurchasedata = {};
                        var loyaltypurchase, loyaltypayload;
                        //Retrying condition -8
                        if (typeof paramsRequest.puchase_new_loyalty_card_sendcloudevent == "undefined" || paramsRequest.puchase_new_loyalty_card_sendcloudevent.status == false) {
                            try {
                                loyaltypurchasedata['integration'] = "Givex";
                                loyaltypurchasedata['action'] = "Create Loyalty Card";
                                loyaltypayload = {"order_id": paramsRequest.order.entity_id , "futura_id": paramsRequest.futura_customer_id };
                                loyaltypurchasedata['request'] = loyaltypayload;
                                loyaltypurchase = await sendcloudevent(params,params.GIVEX_PROVIDER_ID,params.GIVEX_PURCHASE_LOYALTYMEMBER_CODE,{"value": loyaltypayload});
                                loyaltypurchasedata['status'] = true;
                                loyaltypurchasedata['response'] = loyaltypurchase;
                            } catch (error) {
                                if (error.code == "ECONNABORTED") {
                                    timeouterror = true
                                }
                                loyaltypurchasedata['status'] = false
                                loyaltypurchasedata['response'] = error
                            }
                        } else if (typeof paramsRequest.puchase_new_loyalty_card_sendcloudevent != "undefined" && paramsRequest.puchase_new_loyalty_card_sendcloudevent.status == true) {
                            loyaltypurchase = paramsRequest.puchase_new_loyalty_card_sendcloudevent.response;
                            loyaltypurchasedata = paramsRequest.puchase_new_loyalty_card_sendcloudevent;
                        }
                        responseData['puchase_new_loyalty_card_sendcloudevent'] = loyaltypurchasedata;
                    }

                    // If renew Loyalty card then execute this event
                    if(isLoyaltyRenewAvailable == true){
                        var renewloyaltydata = {};
                        var renewloyaltypayload, renewLoyaltyPurchase;
                        //Retrying condition -9
                        if (typeof paramsRequest.renew_loyalty_card_sedncloudevent == "undefined" || paramsRequest.renew_loyalty_card_sedncloudevent.status == false) {
                            try {
                                renewloyaltydata['integration'] = "Givex"
                                renewloyaltydata['action'] = "Renew Loyalty Card"
                                renewloyaltypayload = {"order_id": paramsRequest.order.entity_id , "futura_id": paramsRequest.futura_customer_id };
                                renewloyaltydata['request'] = renewloyaltypayload;
                                renewLoyaltyPurchase = await sendcloudevent(params,params.GIVEX_PROVIDER_ID,params.GIVEX_RENEW_LOYALTYMEMBER_CODE,{"value": renewloyaltypayload});
                                renewloyaltydata['status'] = true
                                renewloyaltydata['response'] = renewLoyaltyPurchase
                            } catch (error) {
                                if (error.code == "ECONNABORTED") {
                                    timeouterror = true
                                }
                                renewloyaltydata['status'] = false
                                renewloyaltydata['response'] = error
                            }
                        } else if (typeof paramsRequest.renew_loyalty_card_sedncloudevent != "undefined" && paramsRequest.renew_loyalty_card_sedncloudevent.status == true) {
                            renewLoyaltyPurchase = paramsRequest.renew_loyalty_card_sedncloudevent.response;
                            renewloyaltydata = paramsRequest.renew_loyalty_card_sedncloudevent;
                        }
                        responseData['renew_loyalty_card_sedncloudevent'] = renewloyaltydata;
                    }
                }
                /** -- Futura order check | Ends  -- */
            }
        } catch (error) {
            if (typeof responseData['get_auth_token_viare']['status'] == "undefined") {
                responseData['get_auth_token_viare']['status'] = false;
            }
            if (id && typeof responseData['order_exist_viare']['status'] == "undefined") {
                responseData['order_exist_viare']['status'] = false;
            }
            if (id && typeof responseData['create_order_viare']['status'] == "undefined") {
                responseData['create_order_viare']['status'] = false;
            }
            if (id && typeof responseData['is_order_exist_futura']['status'] == "undefined") {
                responseData['is_order_exist_futura']['status'] = false;
            }
            if (id && typeof responseData['create_order_futura']['status'] == "undefined") {
                responseData['create_order_futura']['status'] = false;
            }
            if (id && typeof responseData['create_order_givex_sendcloudevent']['status'] == "undefined") {
                responseData['create_order_givex_sendcloudevent']['status'] = false;
            }
            if (id && typeof responseData['create_gift_card_sendcloudevent']['status'] == "undefined") {
                responseData['create_gift_card_sendcloudevent']['status'] = false;
            }
            if (id && typeof responseData['puchase_new_loyalty_card_sendcloudevent']['status'] == "undefined") {
                responseData['puchase_new_loyalty_card_sendcloudevent']['status'] = false;
            }
            if (id && typeof responseData['renew_loyalty_card_sedncloudevent']['status'] == "undefined") {
                responseData['renew_loyalty_card_sedncloudevent']['status'] = false;
            }
        }

            try { 

                //Magento Logging
                var final_response = await sendcloudevent(
                    params,
                    params.DUSK_MAGENTO_PROVIDER_ID,
                    params.DUSK_LOGGING_EVENT_CODE,
                    responseData
                );
            } catch (error) {
                const final_response = error.message
            }

            logger.info(" Viare-Order Response Data: ");
            logger.info(responseData, null, 4);
            // logger.info(" Viare-Order Final Response: ");
            // logger.info(final_response, null, 4);

            const response = {
                statusCode: 200,
                body: responseData
            }

            // log the response status code
            logger.info(`${response.statusCode}: successful request`)
            return response;
    } catch (error) {
        // log any server errors
        // return with 500
        const error_response = {
            statusCode: 200,
            body: {                
                "Error": error.message
            }
        }
        //return errorResponse(error.statusCode, 'Server Error: ' + ((error.message) ? (error.message) : error.error), logger)
        return error_response
    }
}

async function createCloudEvent(providerId, eventCode, payload) {

    let cloudevent = new CloudEvent({
        source: 'urn:uuid:' + providerId,
        type: eventCode,
        datacontenttype: "application/json",
        data: payload,
        id: providerId
    });
    return cloudevent
}


exports.main = main
