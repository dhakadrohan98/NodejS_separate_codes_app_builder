const { updateRMA, getRMADetails } = require('../magento')


var params = {
    "data": {
        "rma_id": "30",
        "status": "approved_on_item",
        "comment": [
            "wait for next 24 hrs for returns to be approved"
        ],
        "items": [
            {
                "rma_item_id": 42,
                "qty_approved": 1,
                "qty_returned": 1,
                "status": "approved"
            },
            {
                "rma_item_id": 45,
                "qty_approved": 0,
                "qty_returned": 0,
                "status": "rejected"
            }          
        ]
    },
    "ECOMMERCE_API_URL": "https://mcstaging.dusk.au/rest/sv_dusk_au_en/V1/",
    "ECOMMERCE_RETURNS_ENDPOINT": "returns",
    "ECOMMERCE_AUTHORIZED_TOKEN": "nq4zr49fhs07xv9584koqyjicyz3yybd"
};

async function main() {
    var rma_id = params.data.rma_id;
    var rma_status = params.data.status;
    var comment = params.data.comment; //comment array from TCC
    var items = params.data.items;

    var rmaDetails = await getRMADetails(params);
    var payloadForUpdatingRMA = {}; //making an object
    payloadForUpdatingRMA["rmaDataObject"] = {}; //making rmaDataObject as a outer key for payloadForUpdatingRMA object.
    var itemsArray = [];
    var obj = {};

    //updating items array & it will be used while prepairing payload of updating RMA.
    if (items != undefined) {
        for (i = 0; i < items.length; i++) {
            //iterating through RMA items of magento (same RMA_ID)
            for(j=0; j<rmaDetails.items.length; j++) {
            //matching rma_item_id from TCC with entity_id of items from magento.
            if (items[i].rma_item_id == rmaDetails.items[j].entity_id) {
                obj["entity_id"] = rmaDetails.items[j].entity_id;
                obj["rma_entity_id"] = rmaDetails.items[j].rma_entity_id;  
                obj["order_item_id"] = rmaDetails.items[j].order_item_id;
                obj["qty_requested"] = rmaDetails.items[j].qty_requested;
                //setting value of qty_authorized with the value of qty_approved.
                obj["qty_authorized"] = items[i].qty_returned; //getting from TCC
                obj["qty_approved"] = items[i].qty_approved; //getting from TCC
                obj["qty_returned"] = items[i].qty_returned; //getting from TCC
                obj["reason"] = rmaDetails.items[j].reason;
                obj["condition"] = rmaDetails.items[j].condition;
                obj["resolution"] = rmaDetails.items[j].resolution;
                obj["status"] = items[i].status; //From TCC
                itemsArray.push(obj);
                console.log("(((((((((((((((((((((((");
                console.log(itemsArray);
                console.log(")))))))))))))))))))))))");
                obj = {};
            }
          }
        }
    }

    //Adding comment at item level from TCC
    var itemCommentsObject = {};
    var itemCommentArray = [];
    var oldItemCommentFromMagento = rmaDetails.comments;
    //if comment length and items length from TCC input are equal and comment length of RMA(from magento) should be equal to or greater than comment length of items(from TCC).

        for(var i=0; i<comment.length; i++) {
            itemCommentsObject['comment'] = comment[i]; // From Tcc
            itemCommentsObject['rma_entity_id'] = rma_id;  //From TCC (whole rma_id=> params.data.rma_id)
            itemCommentsObject['created_at']= rmaDetails.date_requested; //From Magento
            itemCommentsObject['entity_id'] = items[i].rma_item_id; //from TCC (rma_item_id) keeps on changing
            itemCommentsObject['customer_notified'] = false; 
            itemCommentsObject['visible_on_front'] = false;
            itemCommentsObject['status'] = rma_status; //from TCC (header level status;)
            itemCommentsObject['admin'] = true; //custom value  
            itemCommentArray.push(itemCommentsObject); 
            console.log("**************************");
            console.log(itemCommentArray);
            console.log("%%%%%%%%%%%%%%%%%%%%%%");
            itemCommentsObject = {};
        }
        //concate two comment array old+new
        var mergedCommentArray = oldItemCommentFromMagento.concat(itemCommentArray);
        console.log("mergedCommentArray:\n"+JSON.stringify(mergedCommentArray));

    // if rma id is defined and rma status is approved_of_item, then update item status & details in magento
    if (rma_id != undefined && rma_status != undefined) {

        payloadForUpdatingRMA["rmaDataObject"]["increment_id"] = rmaDetails.increment_id;
        payloadForUpdatingRMA["rmaDataObject"]["entity_id"] = rma_id; //from TCC
        payloadForUpdatingRMA["rmaDataObject"]['order_id'] = rmaDetails.order_id;
        payloadForUpdatingRMA["rmaDataObject"]['order_increment_id'] = rmaDetails.order_increment_id;
        payloadForUpdatingRMA["rmaDataObject"]['store_id'] = rmaDetails.store_id;
        payloadForUpdatingRMA["rmaDataObject"]['customer_id'] = rmaDetails.customer_id;
        payloadForUpdatingRMA["rmaDataObject"]['date_requested'] = rmaDetails.date_requested;
        payloadForUpdatingRMA["rmaDataObject"]['customer_custom_email'] = rmaDetails.customer_custom_email;
        payloadForUpdatingRMA["rmaDataObject"]['items'] = itemsArray; //in above logic, it is built
        payloadForUpdatingRMA["rmaDataObject"]['status'] = rma_status;
        payloadForUpdatingRMA["rmaDataObject"]['comments'] = mergedCommentArray; //from Magento and TCC
    }
    else {
        payloadForUpdatingRMA["rmaDataObject"]["message"] = "can't use objects as associative array";
    }

    //calling updateRMA API of magento to update rma details
    var result = await updateRMA(params, payloadForUpdatingRMA, rma_id);

    const response = {
        statusCode: 200,
        body: {
            "Get rmaDetails response ": rmaDetails,
            "payloadForUpdatingRMA": payloadForUpdatingRMA,
            "result": result
        }
    }
    console.log("\n")
    console.log(JSON.stringify(response))
   
    // const response = {
    //     statusCode: 200,
    //     body: {"rmaDetails items":rmaDetails.items}
    //   }
    //   return response
}

main();

// "rmaDataObject":{
//         "increment_id": rmaDetails.increment_id,
//         "entity_id": rma_id,
//         "order_id": rmaDetails.order_id,
//         "order_increment_id": rmaDetails.order_increment_id,
//         "store_id": rmaDetails.store_id,
//         "customer_id": rmaDetails.customer_id,
//         "date_requested": rmaDetails.date_requested,
//         "customer_custom_email": rmaDetails.customer_custom_email

