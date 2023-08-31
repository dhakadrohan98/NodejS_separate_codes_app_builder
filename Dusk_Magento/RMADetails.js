const { createRMA, rmaDetails } = require('../tcc/rma.js');
var axios = require('axios');

var params = {
    "ECOMMERCE_API_URL":"https://mcstaging.dusk.au/rest/sv_dusk_au_en/V1/",
    "ECOMMERCE_RETURNS_ENDPOINT": "returns",
    "ECOMMERCE_AUTHORIZED_TOKEN":"nq4zr49fhs07xv9584koqyjicyz3yybd",
    "ECOMMERCE_CUSTOMER_ENDPOINT": "customers",
    "ECOMMERCE_ORDER_ENDPOINT": "orders"
}
var rma_id = 6;
var authenticationToken = "963f287e-4d45-4546-b042-afb82fa91066";

async function getRMADetails(params, rma_id){
    var url = params.ECOMMERCE_API_URL+params.ECOMMERCE_RETURNS_ENDPOINT+"/"+rma_id;
    var config = {
        method: 'GET',
        url: url.replace(/\\\//g, "/"),
        headers: {
            'Authorization': 'Bearer '+params.ECOMMERCE_AUTHORIZED_TOKEN,
            'Content-Type': 'application/json'
        }
      };

      try {
        var response = await axios(config);
  
        if (response.status == 200) {
            return response.data;
        }
      } catch (error) {
            return "Error: "+error.message;
        }
}

async function getCustomer(params, id){

    var url = params.ECOMMERCE_API_URL+params.ECOMMERCE_CUSTOMER_ENDPOINT+'/'+id; //params.data.value.entity_id-/18
    
    var config = {
      method: 'get',
      url: url.replace(/\\\//g, "/"), 
      headers: { 
        'Authorization': 'Bearer '+params.ECOMMERCE_AUTHORIZED_TOKEN,
      }
    };

    try{
        var response = await axios(config);

        if(response.status == 200){
            return response.data;
        }
    }catch(error){
        return "Error: "+error.message;
    }
    
}

async function getOrderInfo(params, order_id){

    var url = params.ECOMMERCE_API_URL+params.ECOMMERCE_ORDER_ENDPOINT+'/'+order_id;

    var config = {
        method: 'get',
        url: url.replace(/\\\//g, "/"),
        headers: {
            'Authorization': 'Bearer '+params.ECOMMERCE_AUTHORIZED_TOKEN,
            'Content-Type': 'application/json'
        }
    };

    try{
        var response = await axios(config);

        if(response.status == 200){
            return response.data;
        }
    }catch(error){
        return "Error: "+error.message;
    }
}

async function main(){
    var final = "";
    var rmaDetails = await getRMADetails(params, rma_id);
    var customerDetails = await getCustomer(params, rmaDetails.customer_id);
    var orderDetails = await getOrderInfo(params, rmaDetails.order_id);

    //Extracting item sku for payload of createRMA API of TCC
    var length = orderDetails.items.length;
    var items = orderDetails.items;
    var sku = "";
    for(i=0; i<length; i++) {
        if(items[i].item_id == rmaDetails.items[0].order_item_id) {
            sku = items[i].sku;
        }
    }    

    var result = await createRMA(authenticationToken, rmaDetails, customerDetails, sku);
    console.log(JSON.stringify(orderDetails));
    
}
main();

// const currentDate = new Date();
    // // Increment the date by 1 day (in milliseconds)
    // const nextDayDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    // const nextDate = nextDayDate.getTime() / 1000;

    // var dateString = rmaDetails.date_requested;
    // const epochTimestamp = new Date(dateString).getTime() / 1000;
    // var order_id = rmaDetails.order_id;

    // var variables = {
    //     "AuthenticationToken": authenticationToken,
    //         "Payload": {
    //         "ContainerNumber": null,
    //         "DateCreated": epochTimestamp,
    //         "DateModified": epochTimestamp,
            
    //         "Description": order_id,
    //         "ForeignJobID": 123,
    //         "ForeignReference": null,
    //         "ScheduledReceivingDate": nextDate,
    //         "ID": null,
    //         "Items": [
    //         {
    //         "BatchNo": "",
    //         "BoxPackCountOnly": null,
    //         "CheckQuality": "Yes",
    //         "CollectionDate": null,
    //         "Confidential": null,
    //         "CountIndividualItems": null,
    //         "DeliveryDueDate": nextDate,
    //         "Description": rmaDetails.order_id,
    //         "ForeignFulfilmentID": rmaDetails.items[0].rma_entity_id,
    //         "ForeignReference": null,
    //         "ID": null,
    //         "IsBulkyItem": null,
    //         "JobManagerEmail": "",
    //         "JobManagerName": "",
    //         "MinReOrderLevel": null,
    //         "Notes": null,
    //         "PackageQuantity": null,
    //         "PackageType": null,
    //         "PhotoRequired": null,
    //         "ProductGroup": null,
    //         "ProductPartNumber": null,
    //         "Quantity": rmaDetails.items[0].qty_requested,
    //         "Quarantined": null,
    //         "SampleRequired": null,
    //         "Source": "",
    //         "StockCode": sku,
    //         "StockLocationID": 1,
    //         "SubCategory": null,
    //         "SupplierLocation": null,
    //         "UnitOfMeasure": "",
    //         "WarehouseLocationID": null
    //         }
            
    //         ],
    //         "JobReferenceID": "",
    //         "RequestorEmail": customerDetails.email,
    //         "RequestorName": customerDetails.firstname,
    //         "SenderAddress": customerDetails.addresses[0].street[0],
    //         "SenderName": customerDetails.firstname,
    //         "SenderPostcode": customerDetails.addresses[0].postcode,
    //         "SenderState": customerDetails.addresses[0].region.region_code,
    //         "SenderSuburb": customerDetails.addresses[0].city,
    //         "Status": 10,
    //         "StockLocationID": null,
    //         "WarehouseLocationID": 1
    //         }
    // }

    // console.log(JSON.stringify(variables));