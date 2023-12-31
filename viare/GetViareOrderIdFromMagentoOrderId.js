const soap = require('soap')
const axios = require('axios')

var VIARE_ORDER_API= 'https://dusk.viare.io/global/api/Orders.asmx?WSDL'
var VIARE_TOKEN = 'f5a31427-0329-4996-a8e4-90c0e3f78f6d';
var itemQuantity = 1;
var ECOMMERCE_API_URL='https//mcstaging.dusk.au/rest/default/V1/';
var ECOMMERCE_ORDER_ENDPOINT='orders';
var ECOMMERCE_AUTHORIZED_TOKEN='nq4zr49fhs07xv9584koqyjicyz3yybd';
var ECOMMERCE_CREDITMEMO_ENDPOINT = 'creditmemo';
var magentoOrderId = '000000216';
var creditMemoId = 72;
var orderItemsLength=0;


const header = {
            'trace':1,
            'exceptions': true,
            'connection_timeout': 15,
}

// SendViare Authentication Request
async function SendViareAuthenticationRequest(){

    const args = {
        "username": 'duskAPI',
        "password": 'duskAPI123'
      };

      const header = {
      'trace':1,
      'exceptions': true,
      'connection_timeout': 15
    }

    return new Promise((resolve, reject) => {
            soap.createClient(VIARE_PRODUCT_API, header, function(err, client) {
            if(err){
              reject(err)
            }
            client.Authenticate(args, function(err, result) {
              if(err){
                reject(err)
              }else{
                resolve(result)
              }
            }, {timeout: 10000})
          })
        })
}

//Auth token
async function getViareAuthcode(forced=false){

    var token = myCache.get("viare_token");

    if(token == undefined || forced == true){
        var response = await SendViareAuthenticationRequest()
        await myCache.set("viare_token", response, 20000)
        return response;
    }else{
        return token
    }
}

//Get viare Order ID from external/magento order id
async function isOrderExist(apiEndpoint, header, payload)
{
    return new Promise((resolve, reject) => {
        soap.createClient(apiEndpoint, header, function(err, client) {
            if(err){
                reject(err)
            }
            client.Search(payload, function(err, result) {
                if(err){
                    reject(err)
                }else{
                    resolve(result)
                }
            })
        })
    })
}

// Magento's Order info
async function getOrderInfo(orderId){

    var config = {
        method: 'get',
        url: 'https://mcstaging.dusk.au/rest/default/V1/orders/'+ orderId,
        headers: {
            'Authorization': 'Bearer nq4zr49fhs07xv9584koqyjicyz3yybd',
            'Content-Type': 'application/json'
        },
        data : {}
    };

    try {
        var response = await axios(config);
        
        if(response.status == 200){
            return response.data;
            // orderItemId = response.data.items[0].item_id;
            // orderItemsLength = response.data.items.length;
            // console.log("Order item id: "+orderItemId);
            // console.log("Order data: "+ JSON.stringify(response.data));
        }
        
      } catch (error) {
      console.error(error);
    }
}

async function getCreditMemo(creditMemoId){

    var config = {
        method: 'get',
        url: 'https://mcstaging.dusk.au/rest/default/V1/creditmemo/'+ creditMemoId,
        headers: {
            'Authorization': 'Bearer nq4zr49fhs07xv9584koqyjicyz3yybd',
            'Content-Type': 'application/json'
        },
        data : {}
    };

    try {
        var response = await axios(config);
        
        if(response.status == 200){
            return response.data
            // orderItemIdCreditMemo = response.data.items[0].order_item_id;
            // console.log("Credit Memo's order item ID: "+response.data.items[0].order_item_id);
            // console.log("Credit memo data: "+ JSON.stringify(response.data))
        }
        
      } catch (error) {
      console.error(error);
    }
}



var viarePayload = {
  'authenticationToken': VIARE_TOKEN,
  'externalOrderID': magentoOrderId
}

async function getRelatedOrders(VIARE_ORDER_API, header, viareOrderId) {

  var payload = {
  'authenticationToken': VIARE_TOKEN,
  'orderID': viareOrderId
  }

  return new Promise((resolve, reject) => {
    soap.createClient(VIARE_ORDER_API, header, function(err, client) {
        if(err){
            reject(err)
        }
        client.RetrieveRelatedOrders(payload, function(err, result) {
            if(err){
                reject(err)
            }else{
                resolve(result)
            }
        })
    })
})
}

async function voidOrders(VIARE_ORDER_API, header, viareOrderId, voidReasonCode) {
  var voidpayload = {
    'authenticationToken': VIARE_TOKEN,
    'orderID': viareOrderId,
    'voidReasonCode': voidReasonCode
  }
  
    return new Promise((resolve, reject) => {
      soap.createClient(VIARE_ORDER_API, header, function(err, client) {
          if(err){
              reject(err)
          }
          client.VoidOrder(voidpayload, function(err, result) {
              if(err){
                  reject(err)
              }else{
                  resolve(result)
              }
          })
      })
  })
}

//Delete order
async function deleteOrderItem(VIARE_ORDER_API, headers, viareOrderItemID, itemQuantity){

  var viarePayload = {
    'authenticationToken':VIARE_TOKEN,
    'orderItemID': viareOrderItemID,
    'quantity': itemQuantity
  }

  return new Promise((resolve, reject) => {
          soap.createClient(VIARE_ORDER_API, {wsdl_headers: headers}, function(err, client) {
          if(err){
              reject(err)
          }
          client.DeleteOrderItem(viarePayload, function(err, result) {
              if(err){
                  reject(err)
              }else{
                  resolve(result)
              }
          })
      })
    })
}

// Matching Order Items
async function matchingOrderItems(orderId, creditMemoId) {

    var finalResponse = [];
    var orderResponse = await getOrderInfo(orderId);
    var creditmemoResponse = await getCreditMemo(creditMemoId);

    orderItemsLength = orderResponse.items.length;
    creditMemoLength = creditmemoResponse.items.length
    console.log("orderItemsLength: " +orderItemsLength);
    console.log("creditMemoLength: "+creditMemoLength);

    console.log('Order Response: '+JSON.stringify(orderResponse));
    console.log("\n");
    console.log('Credit Memo Response: '+ JSON.stringify(creditmemoResponse));
    var i=0,k=0;
    var unShippedArray = [];
    var temp = {};

    while(i<orderItemsLength) {

        itemQuantityShippedFromOrder = orderResponse.items[i].qty_shipped;

        if(itemQuantityShippedFromOrder == 0) {
            unShippedArray[k] = orderResponse.items[i].sku;
            k++;
        }
        i++;
    }
    console.log("\n");
    console.log("unShippedArray: "+unShippedArray)

    var unShippedArrayLength = unShippedArray.length;


    //comparing length of unShippedArray with creditMemoLength.
        if(creditMemoLength > unShippedArrayLength) {

        for(j=0; j<creditMemoLength; j++) {

            // if(creditmemoResponse.items[l] == undefined) {
            //     break;
            // }
            if(unShippedArray.includes(creditmemoResponse.items[j].sku) == true) {
                
                temp = {"orderItemID": creditmemoResponse.items[j].sku, 
                            "quantity": creditmemoResponse.items[j].qty};
                finalResponse.push(temp);
            }
        }
    } else {
        for(j=0; j<unShippedArray.length; j++) {

            for(k=0; k<creditMemoLength; k++) {
                if(unShippedArray[j] == creditmemoResponse.items[j].sku) {
                
                    temp = {"orderItemID": creditmemoResponse.items[j].sku, 
                                "quantity": creditmemoResponse.items[j].qty};
                    finalResponse.push(temp);
                }
            }
        }
    }
    console.log("\n");
    console.log("unShippedArray after creditmemo condition: "+ JSON.stringify(finalResponse));
    return finalResponse;
}


var viareHeader = {
  'SOAPAction': "http://www.estaronline.com/api/orders/DeleteOrderItem"
}


async function main() {
//   var orderData = await getOrderInfo(magentoOrderId); //Get order info from magento.
  var magentoOrderDataResponse = await getOrderInfo(magentoOrderId); 
  var magentoCreditMemoResponse = await getCreditMemo(creditMemoId);
  var matchingOrderItemsResponse = await matchingOrderItems(magentoOrderId, creditMemoId); 
  var viareOrderId = await isOrderExist(VIARE_ORDER_API, header, viarePayload); // get ViareOrder id from viare by passing magento id

  var actualViareOrderId = await viareOrderId.SearchResult.Data.int[0]; //Actual viare order id from above API
  var relatedOrdersResponse = await getRelatedOrders(VIARE_ORDER_API, header, actualViareOrderId); //Get related order details through viare order id
  
  var voidReasonCode = "nr";
  var subOrderLength = relatedOrdersResponse.RetrieveRelatedOrdersResult.Data.Order.length;

  console.log("subOrderLength: " + subOrderLength);
  for(i=0; i<subOrderLength; i++) {

    var viareRelatedOrderData = relatedOrdersResponse.RetrieveRelatedOrdersResult.Data;
    var viareSplitOrderDetails = viareRelatedOrderData.Order[i]; // storing viare order id from relatedOrders API
    var subItemsLength = viareSplitOrderDetails.OrderItems.OrderItem.length;
    var splitViareOrderId = viareRelatedOrderData.Order[i].ID;

    console.log("Splitted Viare Order Id: "+splitViareOrderId);
    console.log("subItemsLength: " + subItemsLength);

    for(j=0; j<subItemsLength; j++) {
        
        var viareOrderItemID = viareRelatedOrderData.Order[i].OrderItems.OrderItem[j].ID;
        var viareItemSKU = viareRelatedOrderData.Order[i].OrderItems.OrderItem[j].Style;
        // viareRelatedOrderData.Order[i].OrderItems.OrderItem[j].Style == matchingOrderItemsResponse[0].orderItemID
        for(k=0; k<matchingOrderItemsResponse.length; k++) {

            if(viareItemSKU == matchingOrderItemsResponse[k].orderItemID){
                var viareItemQuantity = viareRelatedOrderData.Order[i].OrderItems.OrderItem[j].Quantity;
                console.log("Third for loop interation count: " + (k+1));
                console.log("***********");
                var cancelOrderItemResponse = await deleteOrderItem(VIARE_ORDER_API, viareHeader, viareOrderItemID, viareItemQuantity); //Now try to delete the item. itemQuantity is 1 here.
                console.log("\n");
                console.log(JSON.stringify(cancelOrderItemResponse));
            }
        }
    }

    if(viareRelatedOrderData.Order[i].OrderItems.OrderItem.length >= 0) {
        var voidOrdersResponse = await voidOrders(VIARE_ORDER_API, header, splitViareOrderId, voidReasonCode); //Void order which viare order we got from above API
        console.log("\n");
        console.log("voidOrdersResponse: "+JSON.stringify(voidOrdersResponse));
    }
    
} 

  console.log("******START******")
  console.log("Matching Order Items Response: " + JSON.stringify(matchingOrderItemsResponse));
  console.log("\n")
//   console.log("Magento Order Data: "+ JSON.stringify(orderData));
//   console.log("\n");
  console.log("Related Orders Response: " +relatedOrdersResponse);
  console.log("****************************");
  console.log("viareOrderId=> " + JSON.stringify(viareOrderId));
  console.log("****************************");
  console.log("Related order response: "+ JSON.stringify(relatedOrdersResponse));
  console.log("\n");
  console.log("******END******")

}

// Now test this script
main(); // => viare_order_id = 10580;