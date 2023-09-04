const xmlrpc = require("davexmlrpc");
const { security } = require("soap");

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

// dc_904 | Reguster a new card
function payloadForRegisterCard(params, amount)
{
    return [
        params.GIVEX_LANGUAGECODE,
        generateTransactionCode('dc_904'),
        params.GIVEX_USERID,
        params.GIVEX_PASSWORD,
        amount.toFixed(2)
    ];

}

// dc_995 | Payload For Gift Card Balance
function payloadForGiftCardBalance(params, givexNumber)
{
    return [
        params.GIVEX_LANGUAGECODE,
        generateTransactionCode('dc_995'),
        params.GIVEX_USERID,
        params.GIVEX_PASSWORD,
        givexNumber,
        "",
        "",
        "PreAuth"
    ];
}


// dc_920 | Forced Pre-Auth Amount
function payloadForPreAuthAmount(params, givexNumber, amount)
{
    return [
        params.GIVEX_LANGUAGECODE,
        generateTransactionCode('dc_920'),
        params.GIVEX_USERID,
        params.GIVEX_PASSWORD,
        givexNumber,
        amount,
        "",
        "",
        "Ecommerce Order's Pre-Auth Amount",
        ""
    ];
}

// dc_921 | Forced Post-Auth Amount
function payloadForPostAuthAmount(params, givexNumber, amount, preAuthRef)
{
    return [
        params.GIVEX_LANGUAGECODE,
        generateTransactionCode('dc_921'),
        params.GIVEX_USERID,
        params.GIVEX_PASSWORD,
        givexNumber,
        amount,
        preAuthRef,
        "", // security check
        "Ecommerce Order's Post-Auth Amount (For Ref: "+preAuthRef+")", // comment
        "" // Total Check Amount
    ];
}

// dc_918 | Reversal the request
function payloadForReversalRequest(params, transactionCode, amount)
{
    return [
        params.GIVEX_LANGUAGECODE,
        transactionCode,
        params.GIVEX_USERID,
        params.GIVEX_PASSWORD,
        amount.toFixed(2)
    ];
}

// dc_911 | Points
function payloadForPoints(params, givexnumber, order)
{
    return [
        params.GIVEX_LANGUAGECODE,
        generateTransactionCode('dc_911'),
        params.GIVEX_USERID,
        params.GIVEX_PASSWORD,
        givexnumber,
        '',
		'',
		'',
        getSkuListDataFromOrder(order) // [itemsku, unitPriceIncludingTax, quantityInvoiced]
    ];
}

// dc_30 | Reversal the point request
function payloadForPointReversalRequest(params, previousReq)
{
    return [
        params.GIVEX_LANGUAGECODE,
        previousReq[1],
        previousReq[2],
        previousReq[3],
        previousReq[4],
        previousReq[5],
        previousReq[6],
        previousReq[7],
        previousReq[8]
    ];
}

// Call all the GIVEX APIs
async function call(params, method, payload)
{
    return new Promise((resolve, reject) => {
        xmlrpc.client(params.GIVEX_ENDPOINT, method, payload, "xml", function (err, data) {        
            if (err) {        
                reject(err);   
                return;     
            } else {        
                resolve(data);
            }        
        });
    })
}

function PayloadForCreateNewAccount(params,api_endpoint,giveXNumber,customerData){

    var password = Math.random().toString(36).substring(2,10)


    return [
        params.GIVEX_LANGUAGECODE,
        generateTransactionCode(api_endpoint),
        params.GIVEX_USERID,
        params.GIVEX_PASSWORD,
        giveXNumber,
        'customer',
        customerData.email, //customerLogin
        '', //customerTitle (*optional)
        customerData.firstname, //customerFirstName
        '', //customerMiddleName (*optional)
        customerData.lastname, //customerLastName
        "N/A", //customerGender (*optional)
        customerData.dob, //customerBirthdate (*optional)
        customerData.street[0] ? customerData.street[0] : "", //customerAddress
        customerData.street[1] ? customerData.street[1] : "", //customerAddress2
        customerData.city ?  customerData.city : "" , //customerCity
        customerData.region_code ? customerData.region_code == "WA" ? "WA:AU" : customerData.region_code : "", //customerProvince
        '', //customerCounty
        customerData.country_id ? customerData.country_id : "", //customerCountry
        customerData.postcode ? customerData.postcode : "", //customerPostalCode
        "", //customerPhone
        '0', //customerDiscount (*optional)
        'true', //promotionOptIn (*optional)
        customerData.email, //customerEmail(optional)
        password, //customerPassword
        customerData.telephone ? customerData.telephone : "", //customerMobile(optional)
        customerData.company ? customerData.company : "", //customerCompany(optional)
        '', //securityCode(optional)
        '', //newCardRequest(optional)
        'false', //promotionOptInMail(optional)
        '', //Member Type (optional)
        '', //customerLangPref(optional)
        '', //Message Type (optional)
        '', //Message Delivery Method (optional)
        
    ];
}

// Transaction Code for Each API call
function generateTransactionCode(prefix)
{
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
  
    for (let i = 0; i < 15; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
  
    return prefix+'.'+result;
}

function getSkuListDataFromOrder(order)
{
    var allowed_types = ['simple', 'giftcard', 'loyaltycard']
    var skuList = []

    order.items.forEach((item, index) => {

        if (allowed_types.includes(item.product_type)) {
            var quantityInvoiced = (item.qty_invoiced > 0) ? item.qty_invoiced : 1
            var totalDiscount = item.discount_invoiced + ((item.member_discount) ? item.member_discount : 0 )
            var unitPriceIncludingTax = item.base_row_total_incl_tax / quantityInvoiced
            skuList.push([''+item.sku, parseFloat(unitPriceIncludingTax), quantityInvoiced]);
        }
    })

    return skuList
}

//Generarting customer payload
async function customerDataPayload(params, api_endpoint, giveXNumber, customerData) {

    // api_endpoint = "dc_941";
    var length = customerData.addresses.length;
    var customerAddress;
    var telephoneNo;
    //Storing customer's city & telephone no. of billing address
    for(i=0; i<length; i++) {
        if(customerData.addresses[i].default_billing != undefined && 
            customerData.addresses[i].default_billing==true) {
            //if customer address is set as billing address then store street, city and region in customerAddress variable. 
            customerAddress = customerData.addresses[i].street[0] +", "+customerData.addresses[i].city+", "+
                              customerData.addresses[i].region.region;
            telephoneNo = customerData.addresses[i].telephone;
        }
    }
    
    return [ 
        params.GIVEX_LANGUAGECODE,
        generateTransactionCode(api_endpoint),
        params.GIVEX_USERID,
        params.GIVEX_PASSWORD,
        giveXNumber,
        '', //Member title 
        customerData.firstname,
        '', //Customer middlename 
        customerData.lastname,
        customerAddress,
        telephoneNo,
        customerData.email, //customerData.email 
        "", //Customer birthDate 
        "", // SMS contact number (*optional)
        "", //Email contact answer
        "", //Mail contact answer
        "", //member phone
        "", //Referring member number
        "", //Security code
        "", //member_type
        "", //member_status
        "", //member_type
        "", //member_delivery_method 
        "", //customer_company
        "", //customer_pos_notes
        "", //comment
    ];
}

//Passing static data (for general purpose)
async function staticPayload(params, api_endpoint, giveXNumber, customerData){
    return [ 
        "en",
        "qwerty4545454545qq",
        "228808",
        "FEFijCf8d6kps22r",
        "6058634-10000655",
        '', //Member title 
        "Rohan",
        'Kumar', //Customer middlename 
        "Dhakad",
        "SchemeNo",
        "98989123456",
        "praveenverma@gmail.com", //customerData.email (*optional)
        "", //Customer birthDate (*optional)
        "", // SMS contact number
        "", //Email contact answer
        "", //Mail contact answer
        "", //member phone
        "", //Referring member number
        "", //Security code
        "", //member_type
        "", //member_status
        "", //member_type
        "", //member_delivery_method 
        "Sigma InfoSolutions", //customer_company
        "", //customer_pos_notes
        "This is a test comment", //comment
    ];
}

//noinspection JSAnnotator
module.exports = {
    payloadForRegisterCard,
    payloadForReversalRequest,
    payloadForGiftCardBalance,
    payloadForPreAuthAmount,
    payloadForPostAuthAmount,
    PayloadForCreateNewAccount,
    payloadForPoints,
    payloadForPointReversalRequest,
    call,
    customerDataPayload,
    staticPayload
}


// var updatecustomer = await getCustomerDataById(params,params.data.value.futura_id);
// var duskpayload = await duskportalCustomerPayload(params, updatecustomer,customerid)
// var duskcustomercreate = await SendCustomerData(params, duskpayload);