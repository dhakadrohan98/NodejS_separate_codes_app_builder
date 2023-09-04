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
    "DUSK_PORTAL_API_URL":"http://staging-portal.dusk.com.au/api/",
    "DUSK_PORTAL_CREATE_UPDATE_MEMBER":"members/create-or-update",
    "DUSK_PORTAL_AUTH_TOKEN":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vc3RhZ2luZy1wb3J0YWwuZHVzay5jb20uYXUvaW5kZXgucGhwL2FwaS9hdXRoL2xvZ2luIiwiaWF0IjoxNjkxMTM0MjAyLCJuYmYiOjE2OTExMzQyMDIsImp0aSI6Img1NXNrZlFPamQwZ2FXU0ciLCJzdWIiOjEsInBydiI6IjYyZGFjM2UzMDg0YTcxZmJhMTMxMWQ0MDM5YzZjYTQ3MmQ0MTZmOTciLCJuYW1lIjoiYWRtaW4iLCJpc19hZG1pbiI6dHJ1ZSwiZnV0dXJhX3N0b3JlX2lkIjoiMSIsImFkbWluX3R5cGUiOjF9.A2vnXKPyrG23uf4F6x3Rary7J5KdZX_BgY9dY8eNic0",
    "DUSK_PORTAL_RESERVE_CARD_ENDPOINT":"members/digital-cards/reserve-number",
    "DUSK_PORTAL_CREATE_UPDATE_MEMBER":"members/create-or-update",
    "SOAP_TIMEOUT":7000,
    "data":{
        "value":{
            "futuraId":"704732351",
        }
    },
    "customerID":"9"

};


async function main(){
    //Updating dusk portal with latest customer data
    var updatecustomer = await getCustomerDataById(params,params.data.value.futuraId);
    var duskpayload = await duskportalCustomerPayload(params, updatecustomer,params.customerID)
    var duskcustomercreate = await SendCustomerData(params, duskpayload);
    console.log(duskcustomercreate);
}

main();

