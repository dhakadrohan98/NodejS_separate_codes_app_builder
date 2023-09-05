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
    "SOAP_TIMEOUT":20000,
    "data":{
        "value":{
            "futuraId":"704732351",
        }
    },
    "customerID":"9"

};

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

var payload = {
    'customer': {   
        'Value':customer,
        'web_user': '',
        'web_Pass': ''
    },
    "comon": {
        'Value' : commonfield,
        'web_user': '',
        'web_Pass': ''
    },
    "address": {
        'Value' : address,
        'web_user': '',
        'web_Pass': ''
    }
};

var duskpayload = {
    "Birthdate": "20080806",
    "Card_No": "783883483782",
    "Card_Type": "credit",
    "Email": "rohan+5.dhakad@sigmainfo.net",
    "Enrolment_Date": "18991230",
    "Expiry_Date": "18991230",
    "Expiry_Text": "dusk Rewards Expiry Date",
    "First_Name": "Rohan",
    "Futura_Name": "DHAKAD,ROHAN,DOREEN",
    "Futura_Number": "704732351",
    "Givex_No": "2782382438",
    "ISO_Serial": "0987654321",
    "Last_Name": "Sigma",
    "Magento_No": "126",
    "Mobile": "6261122929",
    "Postcode": "63762",
    "Renew_Date": "18991230",
    "Signup_Date": "20230906",
    "State": "",
    "Street_1": "2 Testolin Place",
    "Street_2": "",
    "Suburb": "Berlin"
}


async function main(){
    //Updating dusk portal with latest customer data
    // var updatecustomer = await getCustomerDataById(params,"126");
    // console.log(updatecustomer);
    // console.log("\n");
    // var duskpayload = await duskportalCustomerPayload(params, updatecustomer,params.customerID)
    var duskcustomercreate = await SendCustomerData(params, duskpayload);
    console.log(duskcustomercreate);
}

main();

