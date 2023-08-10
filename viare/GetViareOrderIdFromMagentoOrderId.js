const soap = require('soap')
const axios = require('axios')

var VIARE_ORDER_API= 'https://dusk.viare.io/global/api/Orders.asmx?WSDL'
var VIARE_TOKEN = 'f5a31427-0329-4996-a8e4-90c0e3f78f6d';
var itemQuantity = 1;
var magentoOrderId = 144;
var ECOMMERCE_API_URL=https='//mcstaging.dusk.au/rest/default/V1/';
var ECOMMERCE_ORDER_ENDPOINT='orders';
var ECOMMERCE_AUTHORIZED_TOKEN='nq4zr49fhs07xv9584koqyjicyz3yybd';


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

async function getOrderInfo(order_id){

  var url = ECOMMERCE_API_URL+ECOMMERCE_ORDER_ENDPOINT+'/'+order_id;

  var config = {
      method: 'get',
      url: url.replace(/\\\//g, "/"),
      headers: {
          'Authorization': 'Bearer '+ECOMMERCE_AUTHORIZED_TOKEN,
          'Content-Type': 'application/json'
      },
      data : {}
  };

  try{
      var response = await axios(config);

      if(response.status == 200){
          return response.data;
      }
  }catch(error){
      return error;
  }
}

// function generatePayloadForOrderExist(order_data, token)
// {
//     var order = order_data;
//     var payload = [];
//     payload['authenticationToken'] = ""+token;
//     payload['externalOrderID'] = ""+order.entity_id;

//     return payload;
// }

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
async function deleteOrder(VIARE_ORDER_API, headers, viareOrderItemID, itemQuantity){

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


var viareHeader = {
  'SOAPAction': "http://www.estaronline.com/api/orders/DeleteOrderItem"
}


async function test() {
  var orderData = await getOrderInfo(magentoOrderId);
  var viareOrderId = await isOrderExist(VIARE_ORDER_API, header, viarePayload);

  var actualViareOrderId = viareOrderId.SearchResult.Data.int[0];
  var relatedOrdersResponse = await getRelatedOrders(VIARE_ORDER_API, header, actualViareOrderId);

  var voidReasonCode = "nr";
  var voidOrdersResponse = await voidOrders(VIARE_ORDER_API, header, actualViareOrderId, voidReasonCode);

  var viareOrderItemID = relatedOrdersResponse.RetrieveRelatedOrdersResult.Data.Order[0].OrderItems.OrderItem[0].ID;
  var cancelOrderItemResponse = await deleteOrder(VIARE_ORDER_API, viareHeader, viareOrderItemID, itemQuantity);
  console.log("******START******")
  console.log("Order Data: "+ JSON.stringify(orderData));
  console.log("\n");
  console.log("****************************");
  console.log("viareOrderId=> " + actualViareOrderId);
  console.log("****************************");
  console.log("Related order response: "+ JSON.stringify(relatedOrdersResponse));
  console.log("\n");
  console.log("voidOrdersResponse: "+JSON.stringify(voidOrdersResponse));
  console.log("\n");
  console.log("viareOrderItemID: "+viareOrderItemID);
  console.log("\n");
  console.log(JSON.stringify(cancelOrderItemResponse));
  console.log("******END******")
}

test(); // => viare_order_id = 10580;