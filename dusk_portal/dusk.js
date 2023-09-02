const {getCustomerDataById} = require("../futura.js")
const {duskportalCustomerPayload, SendCustomerData} = require("../duskportal.js")
var params = {
    "ECOMMERCE_API_URL":"https://mcstaging.dusk.au/rest/sv_dusk_au_en/V1/",
    "ECOMMERCE_RETURNS_ENDPOINT": "returns",
    "ECOMMERCE_AUTHORIZED_TOKEN":"nq4zr49fhs07xv9584koqyjicyz3yybd",
    "ECOMMERCE_CUSTOMER_ENDPOINT": "customers",
    "ECOMMERCE_ORDER_ENDPOINT": "orders",
    "FUTURA_CUSTOMER_API":"",
    "ECOMMERCE_API_URL":"https://mcstaging.dusk.au/rest/sv_dusk_au_en/V1/",
    "ECOMMERCE_RETURNS_ENDPOINT": "returns",
    "ECOMMERCE_AUTHORIZED_TOKEN":"nq4zr49fhs07xv9584koqyjicyz3yybd",
    "ECOMMERCE_CUSTOMER_ENDPOINT": "customers",
    "ECOMMERCE_ORDER_ENDPOINT": "orders",
    "FUTURA_CUSTOMER_API":"https://futura-staging-adr.dusk.com.au/SOAP",
    "FUTURA_CF_ACCESS_CLIENT_ID":"30979c34f222ca7ac7ac3d24120060a5.access",
    "FUTURA_CF_ACCESS_CLIENT_SECRET":"ff6e0612ff3cc2962cd1dbad55a55cf72f5d3d5f3678fdd0f3aece5f0586c048",
    "data":{
        "value":{
            "futuraId":"704732351",
        }
    },
    "customerID":"126"

};


async function main(){
    //Updating dusk portal with latest customer data
    var updatecustomer = await getCustomerDataById(params,params.data.value.futuraId);
    var duskpayload = await duskportalCustomerPayload(params, updatecustomer,params.customerID)
    var duskcustomercreate = await SendCustomerData(params, duskpayload);
    console.log(duskcustomercreate);
}

main();

