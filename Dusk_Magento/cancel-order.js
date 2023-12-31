var axios = require('axios');
var soap = require('soap');
var orderId = 219;
var creditMemoId = 75;
var orderItemsLength=0;

var viareEndpoint = 'https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR';

var orderItemIdCreditMemo = 0;
var orderItemId = 0;

async function getOrderDetails(orderId){

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

async function matchingOrderItems(orderId, creditMemoId) {

    var finalResponse = [];
    var orderResponse = await getOrderDetails(orderId);
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
}

matchingOrderItems(orderId,creditMemoId);

// getOrderDetails(orderId);
// console.log("********************************************************")
// getCreditMemo(creditMemoId);

// if(orderItemId == orderItemIdCreditMemo) {
//     console.log("Items id of both order & credit memo matched");
// }