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
const { errorResponse, getBearerToken, stringParameters, addObjtoArray, checkMissingRequestInputs } = require('../utils')
const { geViaretOrderInfo, getViareAuthcode, getDispatchBranchNumber} = require('../viare')
const { SearchMagentoOrder, addCommentintoOrder, Createshipment } = require('../magento')
const { sendcloudevent } = require('../token')

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

    var paramsRequest;
        let responseData = {};
        //while retrying we get data in params.data.params
        if (typeof params.data.value.params !== "undefined") {
            paramsRequest = params.data.value.params;
            // //If receiving parent_id from retrying then store it in responseData['id']. 
            if(typeof params.data.value.api_id !== "undefined") {
                responseData["api_id"] = params.data.value.api_id;
            }
        }
        else {
            paramsRequest = params.data;
    }

    responseData["event_code"] = params.type;
    responseData["provider_id"] = params.source;
    responseData["event_id"] = params.event_id;
    responseData["entity"] = "Order";
    responseData["from"] = "Magento";
    responseData["reference_id"] = paramsRequest.message.orderID; //order_id is storing in reference_id.
    responseData['params'] = paramsRequest;

    try {

        const header = {
            'trace': 1,
            'exceptions': true,
            'connection_timeout': 15
        }

        // check for missing request input parameters and headers
        const requiredParams = []
        const requiredHeaders = []
        const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
        if (errorMessage) {
            // return and log client errors
            return errorResponse(400, errorMessage, logger)
        }

        var timeouterror = false;
        // send authentication request
        var getauthentication = await getViareAuthcode(params)
        var authtoken = getauthentication.AuthenticateResult.Message;

        var assigned_store = 160

        if(params.data.message.dispatchBranchNumber && (params.data.message.dispatchBranchNumber != 'undefined') )
        {
            assigned_store = params.data.message.dispatchBranchNumber
        } else if(params.data.message.dispatchPoint && (params.data.message.dispatchPoint != 'undefined') ){
            assigned_store = getDispatchBranchNumber(params.data.message.dispatchPoint)
        }

        var viareorderdata = {};
        viareorderdata['request'] = {};
        var viareorder;
        //Retrying condition -1
        if (typeof paramsRequest.get_order_data_viare == "undefined" || paramsRequest.get_order_data_viare.status == false) {
            try {
                viareorderdata['integration'] = "Viare";
                viareorderdata['action'] = "Get Order";
                viareorderdata['request']['authtoken'] = authtoken;
                viareorderdata['request']['order_id'] = paramsRequest.message.orderID;
                // Get Viare order Info
                viareorder = await geViaretOrderInfo(params.VIARE_ORDER_API, header, authtoken, paramsRequest.message.orderID);
                viareorderdata['status'] = true;
                viareorderdata['response'] = viareorder;
            } catch (error) {
                if (error.code == "ECONNABORTED") {
                    timeouterror = true
                }
                viareorderdata['status'] = false
                viareorderdata['response'] = error
            }
        } else if (typeof paramsRequest.get_order_data_viare != "undefined" && paramsRequest.get_order_data_viare.status == true) {
            viareorder = paramsRequest.get_order_data_viare.response;
            viareorderdata = paramsRequest.get_order_data_viare;
        }
        responseData['get_order_data_viare'] = viareorderdata;

        if (viareorder.RetrieveResult.Code == 0) {
            var orderinfo = viareorder.RetrieveResult.Data.Order

            var magentoorderdata = {};
            var magentoorder, magentoOrderinfo;
            magentoorderdata['request'] = {};

            //Retrying condition -2
            if (typeof paramsRequest.search_order_magento == "undefined" || paramsRequest.search_order_magento.status == false) {
                try {
                    magentoorderdata['integration'] = "Magento"
                    magentoorderdata['action'] = "Search Order "
                    magentoorderdata['request']['order_id'] = orderinfo[0].AdminReference;
                    //get Adobe commerce order Detail from Increment Id
                    magentoorder = await SearchMagentoOrder(params, 'increment_id', orderinfo[0].AdminReference, "eq")
                    magentoOrderinfo = magentoorder.items
                    magentoorderdata['status'] = true
                    magentoorderdata['response'] = magentoorder
                } catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    magentoorderdata['status'] = false
                    magentoorderdata['response'] = error
                }
            } else if (typeof paramsRequest.search_order_magento != "undefined" && paramsRequest.search_order_magento.status == true) {
                magentoorder = paramsRequest.search_order_magento.response;
                magentoorderdata = paramsRequest.search_order_magento;
            }
            responseData['search_order_magento'] = magentoorderdata;
        } else {
            //logging reponse of viareorder only with status=false. 
            var viareorderres = {};
            viareorderres['integration'] = "Viare";
            viareorderres['action'] = "Order Data"
            viareorderres['request'] = paramsRequest;
            viareorderres['status'] = false
            viareorderres['response'] = viareorder
            responseData['order_data_viare'] = viareorder
        }

        // When Dispatch assigned
        if (params.data.type == "dispatch.assigned" && viareorder.RetrieveResult.Code == 0) {
            var viareassignedresponse = {};
            if (typeof paramsRequest.viare_assigned_response == "undefined" || paramsRequest.viare_assigned_response.status == false) {
                try {
                    //Retrying condition -3
                    viareassignedresponse['integration'] = "Viare";
                    viareassignedresponse['action'] = "Assigned Order";
                    viareassignedresponse['request'] = paramsRequest;
                    // get the sku which assigned to the Location
                    viareOrderItemskus = []
                    orderinfo[0].OrderItems.OrderItem.forEach((item, index) => {
                        // We are not considering items which are deleted/splitted to new order.
                        if (item.StatusCode == "Deleted") {
                            return;
                        }
                        viareOrderItemskus.push(item.Style + " with qty " + item.Quantity)
                    });

                    // Payload for order comment in Adobe Commerce
                    var payload = {
                        "comment": viareOrderItemskus.join(', ') + " assigned to " + params.data.message.dispatchPoint,
                        "status": magentoOrderinfo[0].status
                    }

                    var commentresponsedata = {};
                    commentresponsedata['request'] = {};
                    var commentresponse;
                    //Retrying condition -4
                    if (typeof paramsRequest.add_order_comment_magento == "undefined" || paramsRequest.add_order_comment_magento.status == false) {
                        try {
                            commentresponsedata['integration'] = "Magento"
                            commentresponsedata['action'] = "Add Order Comment"
                            commentresponsedata['request']['order_id'] =  magentoOrderinfo[0].entity_id;
                            commentresponsedata['request']['payload'] = payload;
                            // Add comment into Adobe Commerce order
                            commentresponse = await addCommentintoOrder(params, magentoOrderinfo[0].entity_id, { "statusHistory": payload })
                            commentresponsedata['status'] = true
                            commentresponsedata['response'] = commentresponse
                        } catch (error) {
                            if (error.code == "ECONNABORTED") {
                                timeouterror = true
                            }
                            commentresponsedata['status'] = false
                            commentresponsedata['response'] = error.message
                        }
                    } else if (typeof paramsRequest.add_order_comment_magento != "undefined" && paramsRequest.add_order_comment_magento.status == true) {
                        commentresponse = paramsRequest.add_order_comment_magento.response;
                        commentresponsedata = paramsRequest.add_order_comment_magento;
                    }
                    responseData['add_order_comment_magento'] = commentresponsedata;
                    //if commentresponse is undefined then only assign commentresponse into viareassignedresponse['response']
                    if(commentresponse != undefined) {
                        viareassignedresponse['status'] = true
                        viareassignedresponse['response'] = commentresponse
                    }
                } catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    viareassignedresponse['status'] = false
                    viareassignedresponse['response'] = error.message
                }
            } else if (typeof paramsRequest.viare_assigned_response != "undefined" && paramsRequest.viare_assigned_response.status == true) {
                commentresponse = paramsRequest.viare_assigned_response.response;
                viareassignedresponse = paramsRequest.viare_assigned_response;
            }
            responseData['viare_assigned_response'] = viareassignedresponse;
        }


        // When click and collect order ready for Collect
        if (params.data.type == "dispatch.collect.received" && viareorder.RetrieveResult.Code == 0) {
            var viareassignedresponseclickandcollect = {};
            if (typeof paramsRequest.click_and_collect_order_viare == "undefined" || paramsRequest.click_and_collect_order_viare.status == false) {
                //Retrying condition -5
                try {
                    viareassignedresponseclickandcollect['integration'] = "Magento";
                    viareassignedresponseclickandcollect['action'] = "Click and Collect Order";
                    viareassignedresponseclickandcollect['request'] = paramsRequest;
                    viareOrderItemskus = []
                    // Magento Item get data of bundle Items
                    var bundleitems = {}
                    magentoOrderinfo[0].items.forEach((item, index) => {
                        if (item.product_type == "bundle") {
                            bundleitems[item.item_id] = item.extension_attributes.bundle_shipment_type
                        }

                    })
                    // shipment Items
                    var orderitems = []
                    orderinfo[0].OrderItems.OrderItem.forEach((item, index) => {
                        var itemId, bundleId

                        // We are not considering items which are deleted/splitted to new order.
                        if (item.StatusCode == "Deleted") {
                            return;
                        }
                        viareOrderItemskus.push(item.Style + " with qty " + item.Quantity)

                        item.ItemInfo.OrderItemInfo.forEach((iteminfo, pos) => {
                            if (iteminfo.Key == "MagentoOrderItemId") {
                                itemId = iteminfo.Value
                            }

                            if (iteminfo.Key == "Bundle ID") {
                                bundleId = iteminfo.Value
                            }
                        })
                        if (bundleId) {
                            if (bundleitems[bundleId] && bundleitems[bundleId] == 0) {
                                itemId = bundleId
                            }
                        }
                        let iteminfo = {}
                        var orderiteminfo = item.ItemInfo.OrderItemInfo;
                        iteminfo["order_item_id"] = parseInt(itemId)
                        iteminfo["qty"] = item.Quantity
                        orderitems = addObjtoArray(iteminfo, orderitems, "order_item_id");
                        //orderitems.push(iteminfo)
                    })

                    // Payload for Create shipemt in Adobe Commerce
                    // @TODO Add classification and store | classification 2 | 
                    var payload = {
                        "items": orderitems,
                        "appendComment": true,
                        "comment": {
                            "comment": viareOrderItemskus.join(', ') + " ready for pickup in " + params.data.message.dispatchPoint + " location.",
                            "is_visible_on_front": 0
                        },
                        "extension_attributes": {
                            "classification": 2,
                            "assigned_store": assigned_store
                        }
                    }
                    var createshipmentdata = {};
                    createshipmentdata['request'] = {};
                    var shipment;
                    //Retrying condition -6
                    if (typeof paramsRequest.create_shipment_magento == "undefined" || paramsRequest.create_shipment_magento.status == false) {
                        try {
                            createshipmentdata['integration'] = "Magento"
                            createshipmentdata['action'] = "Create Shipment"
                            createshipmentdata['request']['id'] = magentoOrderinfo[0].entity_id;
                            createshipmentdata['request']['payload'] = payload;
                            // shipment created
                            shipment = await Createshipment(params, magentoOrderinfo[0].entity_id, payload)
                            createshipmentdata['status'] = true
                            createshipmentdata['response'] = shipment
                        } catch (error) {
                            if (error.code == "ECONNABORTED") {
                                timeouterror = true
                            }
                            createshipmentdata['status'] = false
                            createshipmentdata['response'] = error.message
                        }
                    } else if (typeof paramsRequest.create_shipment_magento != "undefined" && paramsRequest.create_shipment_magento.status == true) {
                        shipment = paramsRequest.create_shipment_magento.response;
                        createshipmentdata = paramsRequest.create_shipment_magento;
                    }
                    responseData['create_shipment_magento'] = createshipmentdata;

                    viareassignedresponseclickandcollect['status'] = true
                    viareassignedresponseclickandcollect['response'] = shipment
                } catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    viareassignedresponseclickandcollect['status'] = false
                    viareassignedresponseclickandcollect['response'] = error.message
                }
            } else if (typeof paramsRequest.click_and_collect_order_viare != "undefined" && paramsRequest.click_and_collect_order_viare.status == true) {
                shipment = paramsRequest.click_and_collect_order_viare.response;
                viareassignedresponseclickandcollect = paramsRequest.click_and_collect_order_viare;
            }
            responseData['click_and_collect_order_viare'] = viareassignedresponseclickandcollect;
        }

        // order is shipped event from viare | classification
        if (params.data.type == "dispatch.shipped" && viareorder.RetrieveResult.Code == 0) {
            var viareshippedresponse = {};
            //Retrying condition -7
            if (typeof paramsRequest.shipment_viare == "undefined" || paramsRequest.shipment_viare.status == false) {
                try {
                    viareshippedresponse['integration'] = "Viare";
                    viareshippedresponse['action'] = "Shipped Order";
                    viareshippedresponse['request'] = paramsRequest;
                    // add tracking data
                    // TODO when we get tacking info with carrier code
                    var tracks = []
                    if (params.data.message && params.data.message.shipping) {
                        params.data.message.shipping.forEach((track, index) => {
                            let trackinginfo = {}
                            trackinginfo["track_number"] = track.reference
                            trackinginfo["title"] = "AUS POST"
                            trackinginfo["carrier_code"] = "custom"

                            tracks.push(trackinginfo)
                        })
                    }


                    // Magento Item get data of bundle Items
                    var bundleitems = {}
                    magentoOrderinfo[0].items.forEach((item, index) => {
                        if (item.product_type == "bundle") {
                            bundleitems[item.item_id] = item.extension_attributes.bundle_shipment_type
                        }

                    })


                    // shipment Items
                    var orderitems = []
                    orderinfo[0].OrderItems.OrderItem.forEach((item, index) => {
                        var itemId, bundleId

                        // We are not considering items which are deleted/splitted to new order.
                        if (item.StatusCode == "Deleted") {
                            return;
                        }

                        item.ItemInfo.OrderItemInfo.forEach((iteminfo, pos) => {
                            if (iteminfo.Key == "MagentoOrderItemId") {
                                itemId = iteminfo.Value
                            }

                            if (iteminfo.Key == "Bundle ID") {
                                bundleId = iteminfo.Value
                            }
                        })
                        if (bundleId) {
                            if (bundleitems[bundleId] && bundleitems[bundleId] == 0) {
                                itemId = bundleId
                            }
                        }
                        let iteminfo = {}
                        var orderiteminfo = item.ItemInfo.OrderItemInfo;
                        iteminfo["order_item_id"] = parseInt(itemId)
                        iteminfo["qty"] = item.Quantity
                        orderitems = addObjtoArray(iteminfo, orderitems, "order_item_id");
                        //orderitems.push(iteminfo)
                    })

                    // Payload for Create shipemt in Adobe Commerce
                    // @TODO Add classification and store | classiication 1, 
                    var payload = {
                        "items": orderitems,
                        "tracks": tracks,
                        "extension_attributes": {
                            "classification": 1,
                            "assigned_store": assigned_store
                        }
                    }

                    // shipment created
                    var logDispatchShippedPayloadShipment = payload
                    

                        var createshipmentdatatoviare = {};
                        createshipmentdatatoviare['request'] = {};
                        var shipment;
                        //Retrying condition -8
                        if (typeof paramsRequest.create_shipment_magento_to_viare == "undefined" || paramsRequest.create_shipment_magento_to_viare.status == false) {
                            try {
                                createshipmentdatatoviare['integration'] = "Magento"
                                createshipmentdatatoviare['action'] = "Create Shipment"
                                createshipmentdatatoviare['request']['id'] = magentoOrderinfo[0].entity_id;
                                createshipmentdatatoviare['request']['payload'] = payload;
                                // shipment created
                                shipment = await Createshipment(params, magentoOrderinfo[0].entity_id, payload)
                                createshipmentdatatoviare['status'] = true
                                createshipmentdatatoviare['response'] = shipment
                            } catch (error) {
                                if (error.code == "ECONNABORTED") {
                                    timeouterror = true
                                }
                                createshipmentdatatoviare['status'] = false
                                createshipmentdatatoviare['response'] = error.message
                            }
                        } else if (typeof paramsRequest.create_shipment_magento_to_viare != "undefined" && paramsRequest.create_shipment_magento_to_viare.status == true) {
                            shipment = paramsRequest.create_shipment_magento_to_viare.response;
                            createshipmentdatatoviare = paramsRequest.create_shipment_magento_to_viare;
                        }
                        responseData['create_shipment_magento_to_viare'] = createshipmentdatatoviare;

                    var logDispatchShippedPayloadShipmentResult = shipment

                    // get the sku which assigned to the Location
                    /*viareOrderItemskus = []
                    orderinfo[0].OrderItems.OrderItem.forEach((item, index) => {
                        viareOrderItemskus.push(item.Style)
                    });*/

                    viareshippedresponse['status'] = true
                    viareshippedresponse['response'] = shipment

                } catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    viareshippedresponse['status'] = false
                    viareshippedresponse['response'] = error.message
                }
            }  else if (typeof paramsRequest.shipment_viare != "undefined" && paramsRequest.shipment_viare.status == true) {
                shipment = paramsRequest.shipment_viare.response;
                viareshippedresponse = paramsRequest.shipment_viare;
            }
            responseData['shipment_viare'] = viareshippedresponse
        }

        // Click and collect order is Shipped
        if (params.data.type == "dispatch.collect.collected" && viareorder.RetrieveResult.Code == 0) {
            var viareshippedresponseclickcollect = {};
            //Retrying condition -9
            if (typeof paramsRequest.viare_shipped_click_collect == "undefined" || paramsRequest.viare_shipped_click_collect.status == false) {
                try {
                    viareshippedresponseclickcollect['integration'] = "Viare";
                    viareshippedresponseclickcollect['action'] = "Order Collection";
                    viareshippedresponseclickcollect['request'] = paramsRequest;

                    // get the sku which assigned to the Location
                    orderinfo[0].OrderItems.OrderItem.forEach((item, index) => {
                        // We are not considering items which are deleted/splitted to new order.
                        if (item.StatusCode == "Deleted") {
                            return;
                        }
                        viareOrderItemskus.push(item.Style + " with qty " + item.Quantity)
                    });

                    // Payload for order comment in Adobe Commerce
                    var payload = {
                        "comment": ((typeof params.data.message.collectedBy !== "undefined") ? params.data.message.collectedBy + " has collected" : "Collected") + " the order " + ((typeof params.data.message.staffNumber !== "undefined") ? "from " + params.data.message.staffNumber : "") + " " + viareOrderItemskus.join(', '),
                        "status": magentoOrderinfo[0].status
                    }

                    var commentresponsedataclickcollect = {};
                    commentresponsedataclickcollect['request'] = {};
                    var commentresponseclickcollect;
                    //Retrying condition -10
                    if (typeof paramsRequest.add_order_comment_magento_click_collect_ship == "undefined" || paramsRequest.add_order_comment_magento_click_collect_ship.status == false) {
                        try {
                            commentresponsedataclickcollect['integration'] = "Magento"
                            commentresponsedataclickcollect['action'] = "Add Order Comment"
                            commentresponsedataclickcollect['request']['order_id'] =  magentoOrderinfo[0].entity_id;
                            commentresponsedataclickcollect['request']['payload'] = payload;
                            // Add comment into Adobe Commerce order
                            commentresponseclickcollect = await addCommentintoOrder(params, magentoOrderinfo[0].entity_id, { "statusHistory": payload })
                            commentresponsedataclickcollect['status'] = true
                            commentresponsedataclickcollect['response'] = commentresponse
                        } catch (error) {
                            if (error.code == "ECONNABORTED") {
                                timeouterror = true
                            }
                            commentresponsedataclickcollect['status'] = false
                            commentresponsedataclickcollect['response'] = error.message
                        }
                    } else if (typeof paramsRequest.add_order_comment_magento_click_collect_ship != "undefined" && paramsRequest.add_order_comment_magento_click_collect_ship.status == true) {
                        commentresponseclickcollect = paramsRequest.add_order_comment_magento_click_collect_ship.response;
                        commentresponsedataclickcollect = paramsRequest.add_order_comment_magento_click_collect_ship;
                    }
                    responseData['add_order_comment_magento_click_collect_ship'] = commentresponsedataclickcollect;

                    viareassignedresponse['status'] = true
                    viareassignedresponse['response'] = commentresponse

                    // Payload for Create shipemt in Adobe Commerce
                    var payload = {
                        "items": orderitems,
                        "appendComment": true,
                        "comment": {
                            "comment": ((typeof params.data.message.collectedBy !== "undefined") ? params.data.message.collectedBy + " has collected" : "Collected") + " the order " + ((typeof params.data.message.staffNumber !== "undefined") ? "from " + params.data.message.staffNumber : ""),
                            "is_visible_on_front": 0
                        }
                    }
            
                    var createshipmentdataclickcollect = {};
                    createshipmentdataclickcollect['request'] = {};
                    var shipmentclickcollect;
                    //Retrying condition -11
                    if (typeof paramsRequest.create_shipment_magento_click_collect == "undefined" || paramsRequest.create_shipment_magento_click_collect.status == false) {
                        try {
                            createshipmentdataclickcollect['integration'] = "Magento"
                            createshipmentdataclickcollect['action'] = "Create Shipment"
                            createshipmentdataclickcollect['request']['id'] = magentoOrderinfo[0].entity_id;
                            createshipmentdataclickcollect['request']['payload'] = payload;
                            // shipment created
                            shipmentclickcollect = await Createshipment(params, magentoOrderinfo[0].entity_id, payload)
                            createshipmentdataclickcollect['status'] = true
                            createshipmentdataclickcollect['response'] = shipmentclickcollect
                        } catch (error) {
                            if (error.code == "ECONNABORTED") {
                                timeouterror = true
                            }
                            createshipmentdataclickcollect['status'] = false
                            createshipmentdataclickcollect['response'] = error.message
                        }
                    } else if (typeof paramsRequest.create_shipment_magento_click_collect != "undefined" && paramsRequest.create_shipment_magento_click_collect.status == true) {
                        shipmentclickcollect = paramsRequest.create_shipment_magento_click_collect.response;
                        createshipmentdataclickcollect = paramsRequest.create_shipment_magento_click_collect;
                    }
                    responseData['create_shipment_magento_click_collect'] = createshipmentdataclickcollect;


                    viareshippedresponseclickcollect['status'] = true
                    viareshippedresponseclickcollect['response'] = shipmentclickcollect

                } catch (error) {
                    if (error.code == "ECONNABORTED") {
                        timeouterror = true
                    }
                    viareshippedresponseclickcollect['status'] = true
                    viareshippedresponseclickcollect['response'] = error.message
                }
            }  else if (typeof paramsRequest.viare_shipped_click_collect != "undefined" && paramsRequest.viare_shipped_click_collect.status == true) {
                    shipmentclickcollect = paramsRequest.viare_shipped_click_collect.response;
                    viareshippedresponseclickcollect = paramsRequest.viare_shipped_click_collect;
                }
            responseData['viare_shipped_click_collect'] = viareshippedresponseclickcollect
        }

        var published = await sendcloudevent(params, params.DUSK_MAGENTO_PROVIDER_ID, params.DUSK_LOGGING_EVENT_CODE, responseData)

        const response = {
            statusCode: 200,
            body: responseData
        }

        // log the response status code
        logger.info(`${response.statusCode}: successful request`)
        return response
    } catch (error) {
        // log any server errors
        logger.error(error)
        // return with 500
        return errorResponse(500, "Server Error: "+error.message, logger)
    }
}

exports.main = main
