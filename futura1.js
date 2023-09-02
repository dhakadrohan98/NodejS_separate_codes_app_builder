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




//Search customer through email
async function SearchInFutura(params,email) {
    var headers = getFuturaHeader(params)

    var payload = {
        "web_search_kde": {
            "web_fld_names": {
                "string": [
                    "ADD_NUMMER",
                    "ANS_EMAIL",
                    "ADD_TYP"
                ]
            },
            "web_flds_fill": {
                "string": [
                    "",
                    email,
                    "3"
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
                    ids.push(rows[i].web_flds.string[0]);
                    break;
                }
            }
            resolve(ids)
          }
        })
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
        })
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
        })
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
        })
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
        })
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
        })
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
        'CF-Access-Client-Id': params.FUTURA_CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': params.FUTURA_CF_ACCESS_CLIENT_SECRET
    }
}

function setCustomClient(params, client){

    client.setEndpoint(params.FUTURA_CUSTOMER_API+'?service=FuturERS_ADR')
    client.addHttpHeader('CF-Access-Client-Id', params.FUTURA_CF_ACCESS_CLIENT_ID);
    client.addHttpHeader('CF-Access-Client-Secret', params.FUTURA_CF_ACCESS_CLIENT_SECRET);
}


module.exports = {
    getCustomerData,
    getCommonFieldData,
    getAddressData,
    SearchInFutura,
    createBlankCustomer,
    getCustomerDataById,
    UpdateCustomerInFututra
}