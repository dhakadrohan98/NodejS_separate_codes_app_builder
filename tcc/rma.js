const soap = require('soap')
const axios = require('axios')
// const NodeCache = require( "node-cache" );
// const myCache = new NodeCache();
const memoryCache = require('memory-cache');


var d1 = new Date();
var d1t1 = parseInt(d1.getTime() / 1000);

var rmaDetails = {
    "increment_id": "000000006",
    "entity_id": 6,
    "order_id": 540,
    "order_increment_id": "000000540",
    "store_id": 1,
    "customer_id": 87,
    "date_requested": "2023-08-21 15:38:54",
    "customer_custom_email": null,
    "items": [
        {
            "entity_id": 6,
            "rma_entity_id": 6,
            "order_item_id": 1155,
            "qty_requested": 1,
            "qty_authorized": 1,
            "qty_approved": null,
            "qty_returned": null,
            "reason": "0",
            "condition": "22",
            "resolution": "13",
            "status": "authorized"
        }
    ],
    "status": "closed",
    "comments": [
        {
            "comment": "We placed your Return request.",
            "rma_entity_id": 6,
            "created_at": "2023-08-21 15:38:55",
            "entity_id": 3,
            "customer_notified": true,
            "visible_on_front": true,
            "status": "pending",
            "admin": true
        },
        {
            "comment": "We authorized your Return request.",
            "rma_entity_id": 6,
            "created_at": "2023-08-23 05:14:48",
            "entity_id": 6,
            "customer_notified": true,
            "visible_on_front": true,
            "status": "authorized",
            "admin": true
        },
        {
            "comment": "We closed your Return request.",
            "rma_entity_id": 6,
            "created_at": "2023-08-23 05:15:09",
            "entity_id": 9,
            "customer_notified": null,
            "visible_on_front": true,
            "status": "closed",
            "admin": true
        }
    ],
    "tracks": []
}

async function authenticate(){

    var payload = {
        "Username":"duskd2c.sigma.ws@consortiumclemenger.com.au",
        "Password":"dRbE5^66*]k}{l",
        "AccountID": "34468"
    }

    var config = {
        method: 'post',
        url: 'https://odyssey-services.tccondemand.com.au/version2.9/OMS/Authenticate',
        headers: {
            'Content-Type': 'application/json'
        },
        data : payload
    };

    try {
        var response = await axios(config);
        
        if(response.status == 200){
            return response.data;
        }
        
      } catch (error) {
        console.error(error);
    }
}

async function createRMA(authenticationToken, rmaDetails, customerDetails, sku){

    const currentDate = new Date();
    // Increment the date by 1 day (in milliseconds)
    const nextDayDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    const nextDate = nextDayDate.getTime() / 1000;

    var dateString = rmaDetails.date_requested;
    const epochTimestamp = new Date(dateString).getTime() / 1000;
    var order_id = rmaDetails.order_id;
    var state = customerDetails.addresses[0].region.region_code;

    //prepairing payload
    var payload = {
            "AuthenticationToken": authenticationToken,
            "Payload": {
            "ContainerNumber": null,
            "DateCreated": epochTimestamp,
            "DateModified": epochTimestamp,
            
            "Description": order_id,
            "ForeignJobID": 123,
            "ForeignReference": null,
            "ScheduledReceivingDate": nextDate,
            "ID": null,
            "Items": [
            {
            "BatchNo": "",
            "BoxPackCountOnly": null,
            "CheckQuality": "Yes",
            "CollectionDate": null,
            "Confidential": null,
            "CountIndividualItems": null,
            "DeliveryDueDate": nextDate,
            "Description": rmaDetails.order_id,
            "ForeignFulfilmentID": rmaDetails.items[0].entity_id,
            "ForeignReference": null,
            "ID": null,
            "IsBulkyItem": null,
            "JobManagerEmail": "",
            "JobManagerName": "",
            "MinReOrderLevel": null,
            "Notes": null,
            "PackageQuantity": null,
            "PackageType": null,
            "PhotoRequired": null,
            "ProductGroup": null,
            "ProductPartNumber": null,
            "Quantity": rmaDetails.items[0].qty_requested,
            "Quarantined": null,
            "SampleRequired": null,
            "Source": "",
            "StockCode": sku,
            "StockLocationID": 1,
            "SubCategory": null,
            "SupplierLocation": null,
            "UnitOfMeasure": "",
            "WarehouseLocationID": null
            }
            
            ],
            "JobReferenceID": "",
            "RequestorEmail": customerDetails.email,
            "RequestorName": customerDetails.firstname,
            "SenderAddress": customerDetails.addresses[0].street[0],
            "SenderName": customerDetails.firstname,
            "SenderPostcode": customerDetails.addresses[0].postcode,
            "SenderState": customerDetails.addresses[0].region.region_code,
            "SenderSuburb": customerDetails.addresses[0].city,
            "Status": 10,
            "StockLocationID": null,
            "WarehouseLocationID": 1
            }
    }
    var config = {
        method: 'POST',
        url: "https://odyssey-services.tccondemand.com.au/version2.9/OMS/ISN",
        headers: {
            'Content-Type': 'application/json'
        },
        data : payload
    };

      try {
        var response = await axios(config);
  
        if (response.status == 200) {
            return response.data;
        }
      } catch (error) {
        console.error("Error: "+error.message);
        }
}

async function getCachedToken() {
    const cachedToken = cache["tccRmaToken"];

    if (cachedToken && cachedToken.expiry > Date.now()) {
        return cachedToken.token;
    }

    return null;
}

async function cacheToken(token, ttl) {
    cache["tccRmaToken"] = {
        token,
        expiry: Date.now() + ttl
    };
}

const cache = {};
async function main(){

    var authenticationToken = await getCachedToken();

    if (!authenticationToken) {
        console.log("Fetching new token...");
        var authenticationResult = await authenticate();
        authenticationToken = authenticationResult.Payload.AuthenticationToken;
        await cacheToken(authenticationToken, 10000); // Cache for 10 seconds
    }

    console.log("Final Token:", authenticationToken);
}

//==> memoryCache library:

    // var final = await authenticate();
    // var authenticationToken = final.Payload.AuthenticationToken;
    // var results = await createRMA(authenticationToken, rmaDetails);
    // console.log(JSON.stringify(results));

            // var authenticationToken = memoryCache.get("tccRmaToken");
            // console.log("Cached Token:" + authenticationToken);

            // if (authenticationToken == null) {
            //     console.log("Fetching new token...");
            //     var authenticationResult = await authenticate();
            //     authenticationToken = authenticationResult.Payload.AuthenticationToken;
            //     memoryCache.put("tccRmaToken", authenticationToken, 10000); // Cache for 10 seconds
            // }
            // console.log("Final Token:" + authenticationToken);



main();

module.exports = { createRMA, rmaDetails };