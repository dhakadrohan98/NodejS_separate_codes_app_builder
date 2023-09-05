const axios  = require('axios');
const {customerDataPayload, call, staticPayload} = require('../givex')

var params = {
    "ECOMMERCE_API_URL":"https://mcstaging.dusk.au/rest/sv_dusk_au_en/V1/",
    "ECOMMERCE_RETURNS_ENDPOINT": "returns",
    "ECOMMERCE_AUTHORIZED_TOKEN":"nq4zr49fhs07xv9584koqyjicyz3yybd",
    "ECOMMERCE_CUSTOMER_ENDPOINT": "customers",
    "ECOMMERCE_ORDER_ENDPOINT": "orders",
    "GIVEX_ENDPOINT":"https://givex-betaap1-50060.tech180.com.au",
    "GIVEX_USERID":"253133",
    "GIVEX_PASSWORD":"S6uxaMUGp07NlrdL",
    "GIVEX_LANGUAGECODE":"en",
    "GIVEX_PROVIDER_ID":"ce6cc498-f707-4600-8147-bdf5444041f9",
    "GIVEX_PURCHASE_LOYALTYMEMBER_CODE":"com.givex.loyaltypurchase",
    "GIVEX_UPDATE_LOYALTY_DATA_CODE":"com.givex.loyaltyupdatedata",
    "GIVEX_RENEW_LOYALTYMEMBER_CODE":"com.givex.renewloyalty",
    "LOYALTY_MEMBERSHIP_TIME_YEAR":"2",
    "GIVEX_GIFTCARD_CREATE_EVENTCODE":"com.givex.giftcardcreate",
    "GIVEX_GIFTCARD_CREATE_PROVIDER_ID":"86e117ba-2ea2-4b5d-851f-69e04ef93729",
    "GIVEX_LOYALTYPOINTS_PROVIDER_ID":"ce6cc498-f707-4600-8147-bdf5444041f9",
    "GIVEX_LOYALTYPOINTS_EVENTCODE":"com.givex.loyaltypoints"
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

async function updateCustomer(){

}

async function main(){
    // var params.data.value.entity_id = 6;
    var customerInfo = await getCustomer(params , 126);
    var givexNumber = "60586308721100032507";
    
    var oldPayload = await customerDataPayload(params,'dc_941',givexNumber, customerInfo);
    // var customerPayloadOfGivex = await staticPayload(params,'dc_941',givexNumber, customerInfo);
    var givexUpdateResult  = await call(params, 'dc_941', oldPayload);
    console.log("OldPayload: "+"\n");
    console.log(oldPayload);
    console.log("\n");
    console.log(givexUpdateResult);

}

main();