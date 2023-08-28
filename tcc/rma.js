const soap = require('soap')
const axios = require('axios')

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

async function createRMA(authenticationToken, rmaDetails){

    var date = new Date().toLocaleDateString();
    //prepairing payload
    var payload = {
            "AuthenticationToken": authenticationToken,
            "Payload": {
            "ContainerNumber": null,
            "DateCreated": rmaDetails.date_requested,
            "DateModified": rmaDetails.date_requested,
            
            "Description": rmaDetails.items[0].reason,
            "ForeignJobID": 123,
            "ForeignReference": rmaDetails.entity_id,
            "ScheduledReceivingDate": date,
            "ID": null,
            "Items": [
            {
            "BatchNo": "",
            "BoxPackCountOnly": null,
            "CheckQuality": "Yes",
            "CollectionDate": null,
            "Confidential": null,
            "CountIndividualItems": null,
            "DeliveryDueDate": date,
            "Description": rmaDetails.order_id,
            "ForeignFulfilmentID": rmaDetails.items[0].rma_entity_id,
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
            "StockCode": "need to call one more API to fetch sku",
            "StockLocationID": 1,
            "SubCategory": null,
            "SupplierLocation": null,
            "UnitOfMeasure": "",
            "WarehouseLocationID": null
            }
            
            ],
            "JobReferenceID": "",
            "RequestorEmail": rmaDetails.customer_custom_email,
            "RequestorName": "customer to fetch from customer id",
            "SenderAddress": "Need to fetch",
            "SenderName": "customer name to fetch",
            "SenderPostcode": "2068",
            "SenderState": "NSW",
            "SenderSuburb": "NORTH WILLOUGHBY",
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
        console.error(error.message);
        }
}

async function main(){
    var final = await authenticate();
    var authenticationToken = final.Payload.AuthenticationToken;
    var results = await createRMA(authenticationToken, rmaDetails);
    console.log(JSON.stringify(results));
}

main();