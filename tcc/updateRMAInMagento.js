const { updateRMA, getRMADetails } = require('../magento')


var params = {
    "data": {
        "rma_id": "15",
        "status": "approved_on_item",
        "comment": [
            "items of order are approved for return"
        ],
        "items": [
            {
                "rma_item_id": 15,
                "qty_approved": 1,
                "qty_returned": 1,
                "status": "approved"
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
        for (var i = 0; i < items.length; i++) {

            if (items[i].rma_item_id == rmaDetails.items[i].rma_entity_id) {
                obj["entity_id"] = rmaDetails.items[i].entity_id;
                obj["rma_entity_id"] = rmaDetails.items[i].rma_entity_id;  //From magento
                obj["order_item_id"] = rmaDetails.items[i].order_item_id;
                obj["qty_requested"] = rmaDetails.items[i].qty_requested;
                obj["qty_authorized"] = rmaDetails.items[i].qty_authorized;
                obj["qty_approved"] = items[i].qty_approved; //getting from TCC
                obj["qty_returned"] = items[i].qty_returned; //getting from TCC
                obj["reason"] = rmaDetails.items[i].reason;
                obj["condition"] = rmaDetails.items[i].condition;
                obj["resolution"] = rmaDetails.items[i].resolution;
                obj["status"] = items[i].status; //From TCC
                itemsArray.push(obj);
                console.log("**************");
                console.log(itemsArray);
                console.log("(((((((((((((((((((((((");
            }
        }
    }

    // if rma id is defined and rma status is approved of item, then update item status & details in magento
    if (rma_id != undefined && rma_status == "approved_on_item") {

        payloadForUpdatingRMA["rmaDataObject"]["increment_id"] = rmaDetails.increment_id;
        payloadForUpdatingRMA["rmaDataObject"]["entity_id"] = rma_id; //from TCC
        payloadForUpdatingRMA["rmaDataObject"]['order_id'] = rmaDetails.order_id;
        payloadForUpdatingRMA["rmaDataObject"]['order_increment_id'] = rmaDetails.order_increment_id;
        payloadForUpdatingRMA["rmaDataObject"]['store_id'] = rmaDetails.store_id;
        payloadForUpdatingRMA["rmaDataObject"]['customer_id'] = rmaDetails.customer_id;
        payloadForUpdatingRMA["rmaDataObject"]['date_requested'] = rmaDetails.date_requested;
        payloadForUpdatingRMA["rmaDataObject"]['customer_custom_email'] = rmaDetails.customer_custom_email;
        payloadForUpdatingRMA["rmaDataObject"]['items'] = itemsArray; //in above logic, it is built
        payloadForUpdatingRMA["rmaDataObject"]['status'] = rmaDetails.status;
    }
    else {
        payloadForUpdatingRMA["rmaDataObject"]["message"] = "can't use objects as associative array";
    }

    //calling updateRMA API of magento to update rma details
    var result = await updateRMA(params, payloadForUpdatingRMA, rma_id);

    const response = {
        statusCode: 200,
        body: {
            "rmaDetails items": rmaDetails.items,
            "payloadForUpdatingRMA": payloadForUpdatingRMA,
            "result": result
        }
    }
    console.log("\n")
    console.log(JSON.stringify(response))
    // return response
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

