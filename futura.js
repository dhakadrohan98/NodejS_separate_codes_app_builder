const soap = require('soap')

var customer = {
    "web_kde_nummer": 0,
    "web_kde_typ": 3,
    "web_kde_index": "",
    "web_kde_filiale": 0,
    "web_kde_land": "1",
    "web_kde_region": "0",
    "web_kde_konto": 0,
    "web_kde_vertreter": 0,
    "web_kde_rabatt": 0,
    "web_kde_rab_regel": 0,
    "web_kde_kondition": "",
    "web_kde_waehrung": "",
    "web_kde_provision": 0,
    "web_kde_kreditlimit": 0,
    "web_kde_eigensch_typ": 0,
    "web_kde_eigen_page": 0,
    "web_kde_eigensch": "",
    "web_kde_berater": 0,
    "web_kde_eigensch_aend": 0,
    "web_kde_kreditvers": "",
    "web_kde_haendler": 0,
    "web_kde_preisstufe": 0,
    "web_kde_egsteuernr": "",
    "web_kde_fasteuernr": "",
    "web_kde_keine_ust": 0,
    "web_kde_skonto": 0,
    "web_kde_skonto_frist": 0,
    "web_kde_plz_index": "",
    "web_kde_prio": 0,
    "web_kde_tour": 0,
    "web_error": {
        "web_err_nr": 0,
        "web_err_txt": ""
    }
}

var commonfield = {
    "web_add_typ": 3,
    "web_add_number": 0,
    "web_add_index": "B0",
    "web_add_zahlart": 0,
    "web_add_zahlinttyp": 0,
    "web_add_zahlintcount": 0,
    "web_add_last_rg_datum": "1899-12-29T18:38:50.000Z",
    "web_add_last_pay_datum": "1899-12-29T18:38:50.000Z",
    "web_add_kundennummer": "",
    "web_add_bankname": "",
    "web_add_bankleitzahl": "",
    "web_add_bankkonto": "",
    "web_add_bic": "",
    "web_add_iban": "",
    "web_add_kreditkarte": "",
    "web_add_sperrdatum": "1899-12-29T18:38:50.000Z",
    "web_add_sperrgrund": "",
    "web_add_last_sammelrg_datum": "1899-12-29T18:38:50.000Z",
    "web_add_manumahnung": 0,
    "web_add_status": 0,
    "web_add_loesch_datum": "1899-12-29T18:38:50.000Z",
    "web_add_inactive": 0,
    "web_add_bildname": "",
    "web_add_zahlziel": 0,
    "web_add_gutschrift": 0,
    "web_add_sprache": "",
    "web_add_fibuexport_first": "1899-12-29T18:38:50.000Z",
    "web_add_fibuexport_last": "1899-12-29T18:38:50.000Z",
    "web_add_vfw_bereich": 0,
    "web_add_rg_druckrabatt": 0,
    "web_add_rg_druckformat": 0,
    "web_add_info_nodisplay": 0,
    "web_add_externid": "",
    "web_add_geschlecht": 0,
    "web_add_werbung": 0,
    "web_add_master_typ": 0,
    "web_add_master_nummer": 0,
    "web_add_karte_erfasst": "1899-12-29T18:38:50.000Z",
    "web_add_karte_ausgegeben": "1899-12-29T18:38:50.000Z",
    "web_add_ohne_bonus": 0,
    "web_add_wf_status": 0,
    "web_add_wf_flags": 0,
    "web_add_wf_id": 0,
    "web_add_wf_date_time_1": "1899-12-29T18:38:50.000Z",
    "web_add_wf_date_time_2": "1899-12-29T18:38:50.000Z",
    "web_add_wf_date_time_3": "1899-12-29T18:38:50.000Z",
    "web_add_import_datum": "1899-12-29T18:38:50.000Z",
    "web_add_export_datum": "1899-12-29T18:38:50.000Z",
    "web_add_datum_user": "1899-12-29T18:38:50.000Z",
    "web_add_obild": "",
    "web_add_obild_ext": "",
    "web_add_clog_user": 0,
    "web_add_clog_date_time": "1899-12-29T18:38:50.000Z",
    "web_add_ulog_user": 0,
    "web_add_ulog_date_time": "1899-12-29T18:38:50.000Z",
    "web_error": {
        "web_err_nr": 0,
        "web_err_txt": ""
    }
}

var address = {
    "web_ans_typ": 3,
    "web_ans_number": 0,
    "web_ans_count": 1,
    "web_ans_name1": "",
    "web_ans_name2": "",
    "web_ans_strasse": "",
    "web_ans_strasse_2": "",
    "web_ans_plz": "",
    "web_ans_plz_zusatz": "",
    "web_ans_postfach_valid": 0,
    "web_ans_postfach_plz": "",
    "web_ans_postfach_plz_zusatz": "",
    "web_ans_postfach": "",
    "web_ans_ort": "",
    "web_ans_county": "",
    "web_ans_land": "1",
    "web_ans_titel": "",
    "web_ans_anrede": "",
    "web_ans_sachbearbeiter": "",
    "web_ans_sachgeburtstag": "1899-12-29T18:38:50.000Z",
    "web_ans_telefon": "",
    "web_ans_telefon2": "",
    "web_ans_telefax": "",
    "web_ans_email": "",
    "web_ans_com_mode": "0",
    "web_ans_m_typ": 0,
    "web_ans_modem": "",
    "web_error": {
        "web_err_nr": 0,
        "web_err_txt": ""
    }
}

var payloadOrderInfo = {
    "Table_name": "ANGEBOTKOPF",
    "Limit": "1",
    "Request_fields": [
        {
            "DB_request": {
                "Field_name": "ANG_ANR",
                "Field_value": "",
            }
        }
    ],
    "Response_fields": {
        "string": ["ANG_ANR","ANG_KNR","ANG_DATANG","ANG_TEXT","ANG_DATAB"]
    }
}


//Search customer through email
async function SearchInFutura(params,email) {
    var headers = getFuturaHeader(params)

    var payload = {
        "web_search_kde": {
            "web_fld_names": {
                "string": [
                    "ADD_NUMMER",
                    "ANS_EMAIL",
                    "ADD_TYP",
                    "ADD_KREDITKARTE",
                    "ADD_SPERRDATUM"
                ]
            },
            "web_flds_fill": {
                "string": [
                    "",
                    email.toLowerCase(),
                    "3",
                    "",
                    ""
                ]
            },
            "web_error": {
                "web_err_nr": 0,
                "web_err_txt": ""
            }
        }
    }
    return new Promise((resolve, reject) => {
        soap.createClient(params.FUTURA_CUSTOMER_API, {wsdl_headers: headers}, function(err, client) {
        if(err){
          reject(err)
        }
        setCustomClient(params,client)
        client.web_search_customer(payload, function(err, result) {
          if(err){
            reject(err)
          }else{
            var ids=[];
            var rows = result.web_search_customerResult.Tweb_search_kde_fld
            for (var i=0; i < rows.length; i++) {
                if(rows[i].web_error.web_err_nr != 0){
                    continue;
                }

                if(rows[i].web_flds.string[1] == email){
                    var ids=[];
                    if(rows[i].web_flds.string[3]){
                        ids.push(rows[i].web_flds.string[0]);
                        break;    
                    }else{
                        ids.push(rows[i].web_flds.string[0]);
                    }
                }
            }
            resolve(ids)
          }
        },{timeout: params.SOAP_TIMEOUT})
      })
    })
}

//Create blank customer in futura
async function createBlankCustomer(params) {
    var headers = getFuturaHeader(params)

    return new Promise((resolve, reject) => {
        soap.createClient(params.FUTURA_CUSTOMER_API, {wsdl_headers: headers}, function(err, client) {
        if(err){
          reject(err)
        }
        setCustomClient(params,client)
        client.get_web_new_customer_id(function(err, result) {
          if(err){
            reject(err)
          }else{
            resolve((result))
          }
        },{timeout: params.SOAP_TIMEOUT})
      })
    })
}

async function getCustomerDataById(params,id){

    var response = {
        "customer": "",
        "comon": "",
        "address": ""
    };

    response.customer = await getCustomerById(params,id)

    response.comon = await getCommonById(params,id)

    response.address = await getAddressById(params,id)

    return response;

}

//Get customer details by id
async function getCustomerById(params,id){
    var headers = getFuturaHeader(params)

    var customerarray = getCustomerData()
    customerarray.web_kde_nummer = id

    var customerpayload = {
        'Value' : customerarray,
        'web_user': '',
        'web_Pass': ''
    }

     return  new Promise((resolve, reject) => {
        soap.createClient(params.FUTURA_CUSTOMER_API, {wsdl_headers: headers}, function(err, client) {
        if(err){
          reject(err)
        }
        setCustomClient(params,client)
        client.get_web_customer(customerpayload, function(err, result) {
          if(err){
            reject(err)
          }else{
            var response = result.get_web_customerResult
            resolve(response)
          }
        },{timeout: params.SOAP_TIMEOUT})
      })
    })
}

async function getCommonById(params, id){

    var headers = getFuturaHeader(params)

    var commonrarray = getCommonFieldData()
    commonrarray.web_add_nummer = id

    var commonpayload = {
        'Value' : commonrarray,
        'web_user': '',
        'web_Pass': ''
    }

    return new Promise((resolve, reject) => {
        soap.createClient(params.FUTURA_CUSTOMER_API, {wsdl_headers: headers}, function(err, client) {
        if(err){
          reject(err)
        }
        setCustomClient(params,client)
        client.get_web_common(commonpayload, function(err, result) {
          if(err){
            reject(err)
          }else{
            var response = result.get_web_commonResult
            resolve(response)
          }
        },{timeout: params.SOAP_TIMEOUT})
      })
    })
}


async function getAddressById(params, id){

    var headers = getFuturaHeader(params)

    var addressarray = getAddressData()
    addressarray.web_ans_nummer = id

    var addresspayload = {
        'Value' : addressarray,
        'web_user': '',
        'web_Pass': ''
    }

    return new Promise((resolve, reject) => {
        soap.createClient(params.FUTURA_CUSTOMER_API, {wsdl_headers: headers}, function(err, client) {
        if(err){
          reject(err)
        }
        setCustomClient(params,client)
        client.get_web_address(addresspayload, function(err, result) {
          if(err){
            reject(err)
          }else{
            var response = result.get_web_addressResult.Tweb_ans[0];
            resolve(response)
          }
        },{timeout: params.SOAP_TIMEOUT})
      })
    })
}

//update customer in futura
async function UpdateCustomerInFututra(params, payload){
    var headers = getFuturaHeader(params)

    var updatedata = {
        'web_kde' : payload.customer,
        'web_add' : payload.comon,
        'web_ans' : payload.address,
        'web_user' : "",
        'web_Pass' : ""
    }
    
    return new Promise((resolve, reject) => {
        soap.createClient(params.FUTURA_CUSTOMER_API, {wsdl_headers: headers}, function(err, client) {
        if(err){
          reject(err)
        }
        
        setCustomClient(params,client)

        client.set_web_customer(updatedata, function(err, result) {
          if(err){
            reject(err)
          }else{
            resolve((result))
          }
        },{timeout: params.SOAP_TIMEOUT})
      })
    })
}

function getCustomerData() {
    return customer;
}

function getCommonFieldData() {
    return commonfield;
}

function getAddressData() {
    return address;
}

function getFuturaHeader(params){
    return  {
        'trace':1,
        'exceptions': true,
        'timeout': 1000,
        'CF-Access-Client-Id': params.FUTURA_CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': params.FUTURA_CF_ACCESS_CLIENT_SECRET
    }
}

function setCustomClient(params, client){

    client.setEndpoint(params.FUTURA_CUSTOMER_API+'?service=FuturERS_ADR')
    client.addHttpHeader('CF-Access-Client-Id', params.FUTURA_CF_ACCESS_CLIENT_ID);
    client.addHttpHeader('CF-Access-Client-Secret', params.FUTURA_CF_ACCESS_CLIENT_SECRET);
}


function setOrderClient(params, client){

    client.setEndpoint(params.FUTURA_ORDER_API+'?service=FuturaERS_HOST')
    client.addHttpHeader('CF-Access-Client-Id', params.FUTURA_CF_ACCESS_CLIENT_ID);
    client.addHttpHeader('CF-Access-Client-Secret', params.FUTURA_CF_ACCESS_CLIENT_SECRET);
}

/* ----------- Futura Create Order ---------- */
// Generate Payload for Existing order check
function payloadForExistingOrderCheck(order_id)
{
    payloadOrderInfo.Request_fields[0].DB_request.Field_value = order_id;
    return payloadOrderInfo;
}

// Checks order is exists or not
async function isOrderExistonFutura(order_id, params, payloadOrderInfo) {
    var apiEndpoint = params.FUTURA_ORDER_API+'?service=FuturaERS_HOST';
    var futura_headers = getFuturaHeader(params);

    return new Promise((resolve, reject)=> {
        soap.createClient(apiEndpoint, {wsdl_headers:futura_headers, escapeXML: false}, function(err, client) {

            if(err) {
                reject({'statusCode': 502, 'error': {"message": "Futura Order Exist Check | Not able to connect "+apiEndpoint, "errorCode": error.code}})
            }

            if (client) {
                setOrderClient(params, client)
                client.read_table(payloadOrderInfo, function(err, result) {
                    if(err){
                        reject({'statusCode': 400, 'error': err})
                    }
                    else {
                        resolve({'statusCode': 200, 'result': result})
                    }
                });
            } else {
                reject({'statusCode': 404, 'error': 'read_table method not found.'});
            }

        })
    })

}

// Process create order 
async function createOrderOnFutura(payloadFuturaOrder, params) {

    var futura_headers = getFuturaHeader(params);
    var futuraurl = params.FUTURA_ORDER_API+'?service=FuturaERS_HOST';
    var orderResult =  await createOrder(futuraurl, futura_headers, payloadFuturaOrder, params);
    return orderResult;

}

// Create order on futura
function createOrder(apiEndpoint, header, payload, params) {

    return new Promise((resolve, reject)=> {
        soap.createClient(apiEndpoint, {wsdl_headers:header, escapeXML: false}, function(err, client) {

            if(err) {
                reject({'statusCode': 502, 'error': {"message": "Futura Order Create | Not able to connect "+apiEndpoint, "errorCode": error.code}})
            }

            if (client) {
                setOrderClient(params, client)
                client.set_import_lines(payload, function(err, result) {
                    if(err){
                        reject({'statusCode': 400, 'error': err})
                    }
                    else {
                        resolve({'statusCode': 200, 'result': result})
                    }
                });
            } else {
                reject({'statusCode': 404, 'error': 'set_import_lines method not found.'});
            }

        })
    })
}

// Generate the payload for Order create
function generatePayloadForFuturaFromEcomOrder(order, order_id, futura_customer_id, params) {
    var stringData = [];

    var order_comment = 'ONLINE ORDER '+order.increment_id; // Order Comment
    var order_payment_method = (order.payment.method) ? order.payment.method : 'Credit Card';

    stringData.push(orderInfoForFututa(order, order_comment, order_payment_method, order_id, futura_customer_id, params));

    var order_items = getOrderItemInfoForFutura(order, order_id, futura_customer_id, params);
    order_items.forEach((item, index) => {
        stringData.push(item);
    });
    //var order_items_shipping = getShippingInfoFutura(order, order_id, futura_customer_id, params);
    // stringData.push(order_items_shipping);
    stringData.push(getBillingAddressInfoForFutura(order, order_id, params));
    var shipping_information = getShippingAddressForFutura(order, order_id, params)
    if(shipping_information && shipping_information.length > 0) {
        stringData.push(shipping_information);
    } 

    return stringData;
}

// Generate Order Information for Futura
function orderInfoForFututa(order, order_comment, order_payment_method, order_id, futura_customer_id, params)
{
    var order_info = [];
    order_info.push(13); // FUTURA_RECORD_TYPE
    order_info.push(1); // FUTURA_HEADER_PREFIX
    order_info.push(order_id); // Magento Order ID
    order_info.push(futura_customer_id); // Futura Customer ID
    order_info.push(futuraFormatDate(order.created_at)); // Order Created Date
    order_info.push(futuraFormatDate(order.created_at)); // Order Created Date
    order_info.push(1); // isVatCacl
    order_info.push('"' + order_comment + '"'); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''+order.base_currency_code); // Order Currency
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push('"' + order_payment_method + '"'); // Order Payment Method
    order_info.push('"' + order.base_total_paid + '"'); // Order base_grand_total
    order_info.push(''); // Order Comment
    order_info.push(''); // Order Comment
    order_info.push((order.store_id == 1 ? params.FUTURA_AUS_DELIVERY_BRANCH : params.FUTURA_NZL_DELIVERY_BRANCH)); // FUTURA_BRANCH_DELIVERY

    return order_info.join(',');
}

// Generate order item information for futura
function getOrderItemInfoForFutura(order, order_id, futura_customer_id, params) {
    var all_items = [];
    var counter = 1;

    order.items.forEach((item, index) => {
        if ( 
            (item.product_type == 'simple' || item.is_virtual == true) &&
            (typeof item.parent_item == 'undefined') // Not pass the bundle item
        ) {
            var unitPrice = 0;
            var quantity = 0;
            var itemBasePriceIncludingTax = 0;
            var itemInfo = []

            if (
                (typeof item.parent_item != 'undefined') &&
                Object.keys(item.parent_item).length > 0 &&
                item.parent_item.product_type == 'bundle') {
                // For dynamic price
                if (item.base_price > 0) {
                    // unitPrice = item.base_price
                    unitPrice = item.row_total_incl_tax
                    quantity = item.qty_ordered
                } else { // For fixed price
                    unitPrice = item.extension_attributes.bundle_option_price
                    //quantity = item.extension_attributes.bundle_option_qty
                    quantity = item.qty_ordered
                }
                itemBasePriceIncludingTax = unitPrice
            } else {
                unitPrice = item.base_price
                quantity = item.qty_ordered
                itemBasePriceIncludingTax = item.row_total_incl_tax
            }

            var sku = item.sku
            // if we get loyalty product
            if(item.sku == params.FUTURA_PURCHASE_LOYALTY_SKU){

                // if customer is already loyalty customer then change sku with renew sku
                if(params.data.givexnumber){
                    sku = params.FUTURA_RENEW_LOYALTY_SKU
                }
            }

            // including = base_row_total_incl_tax / qty_invoiced
            var qty_invoiced = (item.qty_invoiced == 0 ) ? 1 : item.qty_invoiced; 
            var itemPriceIncludingTax = (item.base_row_total_incl_tax / qty_invoiced)
            // excluding = ( base_row_total_incl_tax - base_tax_invoiced ) / qty_invoiced
            var itemPriceExcludingTax = ( item.base_row_total_incl_tax - item.base_tax_invoiced ) / qty_invoiced;
            var order_item_info = [];
            order_item_info.push(13); // FUTURA_RECORD_TYPE
            order_item_info.push(2); // FUTURA_HEADER_PREFIX
            order_item_info.push(order_id); // Magento Order ID
            order_item_info.push(futura_customer_id); // Futura Customer ID
            order_item_info.push(futuraFormatDate(order.created_at)); // Order Created Date
            order_item_info.push(1); // IsVat Calculated
            order_item_info.push(sku); // Item SKU
            order_item_info.push(counter); // COrder
            order_item_info.push((item.qty_invoiced > 0) ? item.qty_invoiced : 1); // Item Quantity Invoiced
            order_item_info.push((item.qty_invoiced > 0) ? item.qty_invoiced : 1); // Item Quantity Invoiced
            order_item_info.push(''); //shippingCostPrice (default set 0)
            order_item_info.push((item.product_type == 'giftcard') ? 0 : unitPrice) // row_total_incl_tax
            order_item_info.push((item.product_type == 'giftcard') ? 0 : itemPriceExcludingTax); // itemPriceExcludingTax 
            order_item_info.push((item.product_type == 'giftcard') ? 0 : itemPriceIncludingTax); // itemPriceExcludingTax 
            order_item_info.push(3); // vkBruttoPrice | row_total - member_discount
            order_item_info.push(''); //
            order_item_info.push(''); //
            order_item_info.push(''); //
            counter++
            all_items.push('' + order_item_info.join(','));
        }
    });

    var order_shipping_info = [];
    order_shipping_info.push(13); // FUTURA_RECORD_TYPE
    order_shipping_info.push(2); // FUTURA_HEADER_PREFIX
    order_shipping_info.push(order_id); // Magento Order ID
    order_shipping_info.push(futura_customer_id); // Futura Customer ID
    order_shipping_info.push(futuraFormatDate(order.created_at)); // Order Created Date
    order_shipping_info.push(1); // IsVat Calculated
    order_shipping_info.push(params.FUTURA_SHIPPING_SKU); // Shipping SKU // 50012848
    order_shipping_info.push(counter); // Item Count (Total Items)
    order_shipping_info.push(1); // Item Quantity Invoiced
    order_shipping_info.push(1); // Item Quantity Invoiced
    order_shipping_info.push(''); //
    order_shipping_info.push('0.0000'); // shipping Cost Price
    order_shipping_info.push((order.base_shipping_incl_tax - order.base_shipping_tax_amount)); // Order Shipping Amount Vk NettoPrice = ( orderShippingAmount - shipemntTaxAmount )
    order_shipping_info.push(order.base_shipping_incl_tax); // base_shipping_amountt
    order_shipping_info.push(3); // vkBruttoPrice | row_total - member_discount
    order_shipping_info.push(''); //
    order_shipping_info.push(''); //
    order_shipping_info.push(''); //
    all_items.push('' + order_shipping_info.join(','));

    return all_items;

}

function getShippingInfoFutura(order, order_id, futura_customer_id, params) {
    var order_shipping_info = [];
    order_shipping_info.push(13); // FUTURA_RECORD_TYPE
    order_shipping_info.push(2); // FUTURA_HEADER_PREFIX
    order_shipping_info.push(order_id); // Magento Order ID
    order_shipping_info.push(futura_customer_id); // Futura Customer ID
    order_shipping_info.push(futuraFormatDate(order.created_at)); // Order Created Date
    order_shipping_info.push(1); // IsVat Calculated
    order_shipping_info.push(params.FUTURA_SHIPPING_SKU); // Shipping SKU // 50012848
    order_shipping_info.push(order.items.length); // Item Count (Total Items)
    order_shipping_info.push(1); // Item Quantity Invoiced
    order_shipping_info.push(1); // Item Quantity Invoiced
    order_shipping_info.push(''); //
    order_shipping_info.push('0.0000'); // shipping Cost Price
    order_shipping_info.push((order.base_shipping_incl_tax - order.base_shipping_tax_amount)); // Order Shipping Amount Vk NettoPrice = ( orderShippingAmount - shipemntTaxAmount )
    order_shipping_info.push(order.base_shipping_incl_tax); // base_shipping_amountt
    order_shipping_info.push(3); // vkBruttoPrice | row_total - member_discount
    order_shipping_info.push(''); //
    order_shipping_info.push(''); //
    order_shipping_info.push(''); //
    return order_shipping_info.join(',');
}

// Generate shipping order information
function getShippingAddressForFutura(order, order_id, params) {
    var shipping_address_info = [];

    if (typeof order.extension_attributes.shipping_assignments[0].shipping.address == 'undefined') {
        return false;
    } else {
        var shipping_address = order.extension_attributes.shipping_assignments[0].shipping.address;
        var street2 = (typeof shipping_address.street[1] == 'undefined' && shipping_address.street[1] != null) ? "" + shipping_address.street[1] : "";
        shipping_address_info.push(13); // FUTURA_RECORD_TYPE
        shipping_address_info.push(3); // FUTURA_HEADER_PREFIX
        shipping_address_info.push(order_id); // Magento Order ID
        shipping_address_info.push('"' + shipping_address.firstname + '"'); // First name
        shipping_address_info.push('"' + shipping_address.lastname + '"'); // Last name
        shipping_address_info.push('"' + shipping_address.street[0] + '"'); // Street one
        shipping_address_info.push('"' + shipping_address.postcode + '"'); // Postcode
        shipping_address_info.push('"' + shipping_address.city + '"'); // City
        shipping_address_info.push((shipping_address.country_id = "AU") ? params.FUTURA_AU_CODE : params.FUTURA_NZ_CODE); // Country ID
        shipping_address_info.push('"' + shipping_address.firstname + ' ' + shipping_address.lastname + '"'); // Full name
        shipping_address_info.push(''); // Title
        shipping_address_info.push(street2); // Street 2
        shipping_address_info.push('"' + shipping_address.region + '"'); // Magento Order ID
        shipping_address_info.push('"' + shipping_address.telephone + '"'); // Magento Order ID
        shipping_address_info.push(''); // Fax
        shipping_address_info.push('"' + shipping_address.email + '"'); // Magento Order ID

        return shipping_address_info.join(',');
    }
    
}

// Generate billing order information
function getBillingAddressInfoForFutura(order, order_id, params) {
    var billing_address_info = [];
    var billing_address = order.billing_address;

    var street2 = (typeof billing_address.street[1] == 'undefined' && billing_address.street[1] != null) ? "" + billing_address.street[1] : "";

    billing_address_info.push(13); // FUTURA_RECORD_TYPE
    billing_address_info.push(3); // FUTURA_HEADER_PREFIX
    billing_address_info.push(order_id); // Magento Order ID
    billing_address_info.push('"' + billing_address.firstname + '"'); // Firstname
    billing_address_info.push('"' + billing_address.lastname + '"'); // Lastname
    billing_address_info.push('"' + billing_address.street[0] + '"'); // Street 1
    billing_address_info.push('"' + billing_address.postcode + '"'); // Postcode
    billing_address_info.push('"' + billing_address.city + '"'); // City
    billing_address_info.push((billing_address.country_id = "AU") ? params.FUTURA_AU_CODE : params.FUTURA_NZ_CODE); // Country ID
    billing_address_info.push('"' + billing_address.firstname + ' ' + billing_address.lastname + '"'); // Full Name
    billing_address_info.push(''); // Customer Title
    billing_address_info.push(street2); // Street 2
    billing_address_info.push('"' + billing_address.region + '"'); // State
    billing_address_info.push('"' + billing_address.telephone + '"'); // Telephone Number
    billing_address_info.push(''); // Fax
    billing_address_info.push('"' + billing_address.email + '"'); // Email Address

    return billing_address_info.join(',');
}

// Date format uses by Futura
function futuraFormatDate(inputDate) {
    const dateObject = new Date(inputDate);

    const day = String(dateObject.getDate()).padStart(2, '0');
    const month = String(dateObject.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so we add 1
    const year = dateObject.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;

    return formattedDate;
}
/* ----------- Futura Create Order | Ends  ---------- */


/**
 *
 * Create delivery note in Futura
 *
 * @param {object} params action input parameters.
 * @param {object} payload for import delivery data
 * @returns {object} futura result object
 *
 */
function createDeliveryNote(params,payload) {

    var headers = getFuturaHeader(params)

    var updatedata = {
        'main_typ' : 15,
        'import_data' : payload,
    }

    return new Promise((resolve, reject) => {
        soap.createClient(params.FUTURA_ORDER_API, {wsdl_headers: headers}, function(err, client) {
        if(err){
          reject(err)
        }
        
        setOrderClient(params,client)

        client.set_delivery_note(updatedata, function(err, result) {
          if(err){
            reject(err)
          }else{
            resolve(result)
          }
        },{timeout: params.SOAP_TIMEOUT})
      })
    })
}


async function createdeliverynoteparam(params, orderinfo, shipmentinfo, futuraorderid, futuracustomerid){
    var deleiveryno = await getNewdeliverynoteNo(params, futuraorderid)
    var type1 = await gettype1items(orderinfo,futuraorderid,futuracustomerid, deleiveryno)
    var type2 = await gettype2items(shipmentinfo,orderinfo, futuraorderid,futuracustomerid, deleiveryno)
    var type3 = await gettype3items(orderinfo,futuraorderid,futuracustomerid, deleiveryno);

    return {"typ_1":type1 , "typ_2": type2, "typ_3": type3}
}

function gettype1items(orderinfo,futuraorderid,futuracustomerid,deleiveryno){

    return {
      "Nummer": deleiveryno.Result,
      "Empfaenger": futuracustomerid,
      "Lieferscheindatum": datetoISO(orderinfo.created_at),
      "Filiale": 998,
      "Umst_flag": 1,
      "Text": "MAGENTO ORDER "+orderinfo.increment_id,
      "Auftrag": futuraorderid,
      "Vertreter": 1,
      "Waehrung": orderinfo.base_currency_code,
      "Buchungsdatum": datetoISO(orderinfo.created_at),
      "Lfs_notOK": 0
    }
}


function gettype2items(shipmentinfo,orderinfo,futuraorderid,futuracustomerid,deleiveryno){


    shipmentitems = {}

    shipmentinfo.items.forEach((shipitems, index) => {

        var shipmentitem = {
            "qty": shipitems.qty,
            "sku": shipitems.sku
        }

        shipmentitems[shipitems.order_item_id] = shipmentitem
    });

    var shippinginfo = [];
    var counter = 1;
    orderinfo.items.forEach((item, index) => {
        if(item.product_type == "simple" || item.is_virtual == true){
            var unitPrice = 0;
            if (
                (typeof item.parent_item != 'undefined') && 
                Object.keys(item.parent_item).length > 0 && 
                item.parent_item.product_type == 'bundle') {
                    // For dynamic price
                    if(item.base_price > 0) {
                        unitPrice = item.base_price
                    } else { // For fixed price
                        unitPrice = item.extension_attributes.bundle_option_price
                    }

            } else {
                unitPrice = item.base_price
            }


            if(shipmentitems[item.item_id]){
                var qty_invoiced = (item.qty_invoiced == 0 ) ? 1 : item.qty_invoiced; 
                var itemPriceIncludingTax = (item.base_row_total_incl_tax / qty_invoiced)
                // excluding = ( base_row_total_incl_tax - base_tax_invoiced ) / qty_invoiced
                var itemPriceExcludingTax = ( item.base_row_total_incl_tax - item.base_tax_invoiced ) / qty_invoiced;
                var order_shipping_info = {
                  "Nummer": deleiveryno.Result,
                  "Empfaenger": futuracustomerid,
                  "Lieferdatum": datetoISO(item.created_at),
                  "Filiale": 998,
                  "Auftrag": futuraorderid,
                  "Umst_flag": 1,
                  "Hostid": item.sku,
                  "Lfs_pos": counter,
                  "Auf_pos": 0,
                  "Menge": item.qty_shipped,
                  "Berechnet": qty_invoiced,
                  "Ek": unitPrice,
                  "Vk_netto": itemPriceExcludingTax,
                  "Vk_brutto": itemPriceIncludingTax,
                  "Umsatzsteuerschluessel": 3
                };

                counter++

                shippinginfo.push(order_shipping_info);
            }
        }


            
    });

    return {"Delivery_typ_2": shippinginfo}
}

function gettype3items(orderinfo,futuraorderid,futuracustomerid,deleiveryno){

    var billing_address = orderinfo.billing_address;
    if (typeof orderinfo.extension_attributes.shipping_assignments[0].shipping.address == 'undefined') {
        var shipping_address = orderinfo.billing_address;
    } else {
        var shipping_address = orderinfo.extension_attributes.shipping_assignments[0].shipping.address;
    }

    var type3 = [
        {
          "Nummer": deleiveryno.Result,
          "Name_1": billing_address.firstname,
          "Name_2": billing_address.lastname,
          "Strasse": billing_address.street[0],
          "Postleitzahl": billing_address.postcode,
          "Ort": billing_address.city,
          "Land": billing_address.country_id == "NZ"? 14 : 1,
          "Sachbearbeiter": "",
          "Titel": "",
          "Strasse2": billing_address.street[1],
          "Landkreis": billing_address.region
        },
        {
          "Nummer": deleiveryno.Result,
          "Name_1": shipping_address.firstname,
          "Name_2": shipping_address.lastname,
          "Strasse": shipping_address.street[0],
          "Postleitzahl": shipping_address.postcode,
          "Ort": shipping_address.city,
          "Land": shipping_address.country_id == "NZ"? 14 : 1,
          "Sachbearbeiter": "",
          "Titel": "",
          "Strasse2": shipping_address.street[1],
          "Landkreis": shipping_address.region
        }
      ];
    return {"Delivery_typ_3": type3}

}

function getNewdeliverynoteNo(params, futuraorderid){
    var headers = getFuturaHeader(params)

    var updatedata = {
        'Order_no' : futuraorderid
    }

    return new Promise((resolve, reject) => {
        soap.createClient(params.FUTURA_ORDER_API, {wsdl_headers: headers}, function(err, client) {
        if(err){
          reject(err)
        }
        
        setOrderClient(params,client)

        client.get_new_delivery_no(updatedata, function(err, result) {
          if(err){
            reject(err)
          }else{
            resolve(result)
          }
        },{timeout: params.SOAP_TIMEOUT})
      })
    })
}

function datetoISO(datetime){
    const [datesting,time] = datetime.split(' ');
    const [year,month, day] = datesting.split('-');
    const date = new Date(Date.UTC(year, month - 1, day));
    const ISOdate = date.toISOString();

    return ISOdate
}


//noinspection JSAnnotator
module.exports = {
    getCustomerData,
    getCommonFieldData,
    getAddressData,
    SearchInFutura,
    createBlankCustomer,
    getCustomerDataById,
    UpdateCustomerInFututra,
    generatePayloadForFuturaFromEcomOrder,
    createOrderOnFutura,
    isOrderExistonFutura,
    payloadForExistingOrderCheck,
    createDeliveryNote,
    createdeliverynoteparam,
    getCommonById
}