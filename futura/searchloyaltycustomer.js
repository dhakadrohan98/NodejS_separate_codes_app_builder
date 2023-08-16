const soap = require('soap')
const axios = require('axios')
const url = "https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR";

var params = {
    "email":"rohan.dhakad@sigmainfo.net"
}

var headers = {
    'trace': 1, 
        'exceptions': true,
        'connection_timeout': 30,
        'CF-Access-Client-Id': '30979c34f222ca7ac7ac3d24120060a5.access',
        'CF-Access-Client-Secret': 'ff6e0612ff3cc2962cd1dbad55a55cf72f5d3d5f3678fdd0f3aece5f0586c048'
}

//Search in Futura
async function searchCustomerInFutura(email, headers) {

var apiEndpoint = 'https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR';

var payload = {"web_search_kde":{"web_fld_names":{"string":["ADD_NUMMER","ANS_EMAIL","ADD_TYP"]},"web_flds_fill":{"string":["",email,"3"]},"web_error":{"web_err_nr":0,"web_err_txt":""}}}	

return new Promise((resolve, reject) => {
soap.createClient(apiEndpoint, {wsdl_headers: headers}, function(err, client) {


  client.setEndpoint('https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR');
  client.addHttpHeader('CF-Access-Client-Id', '30979c34f222ca7ac7ac3d24120060a5.access'); 
  client.addHttpHeader('CF-Access-Client-Secret', 'ff6e0612ff3cc2962cd1dbad55a55cf72f5d3d5f3678fdd0f3aece5f0586c048');

    client.web_search_customer(payload, function(err, result) { 
       resolve(result)
    });
  });
})
}

async function getWebCommon(futuraId){
   
    var payload = {
        Value: {
            web_add_typ: 3,
            web_add_nummer: futuraId,
            web_add_index: '',
            web_add_zahlart: 0,
            web_add_zahlinttyp: 0,
            web_add_zahlintcount: 0,
            web_add_last_rg_datum: '1899-12-30T00:00:00',
            web_add_last_pay_datum: '1899-12-30T00:00:00',
            web_add_kundennummer: '',
            web_add_bankname: '',
            web_add_bankleitzahl: '',
            web_add_bankkonto: '',
            web_add_bic: '',
            web_add_iban: '',
            web_add_kreditkarte: '',
            web_add_sperrdatum: '1899-12-30T00:00:00',
            web_add_sperrgrund: '',
            web_add_last_sammelrg_datum: '1899-12-30T00:00:00',
            web_add_manumahnung: 0,
            web_add_status: 0,
            web_add_loesch_datum: '1899-12-30T00:00:00',
            web_add_inactive: 0,
            web_add_bildname: '',
            web_add_zahlziel: 0,
            web_add_gutschrift: 0,
            web_add_sprache: '',
            web_add_fibuexport_first: '1899-12-30T00:00:00',
            web_add_fibuexport_last: '1899-12-30T00:00:00',
            web_add_vfw_bereich: 0,
            web_add_rg_druckrabatt: 0,
            web_add_rg_druckformat: 0,
            web_add_info_nodisplay: 0,
            web_add_externid: '',
            web_add_geschlecht: 0,
            web_add_werbung: 0,
            web_add_master_typ: 0,
            web_add_master_nummer: 0,
            web_add_karte_erfasst: '1899-12-30T00:00:00',
            web_add_karte_ausgegeben: '1899-12-30T00:00:00',
            web_add_ohne_bonus: 0,
            web_add_wf_status: 0,
            web_add_wf_flags: 0,
            web_add_wf_id: 0,
            web_add_wf_date_time_1: '1899-12-30T00:00:00',
            web_add_wf_date_time_2: '1899-12-30T00:00:00',
            web_add_wf_date_time_3: '1899-12-30T00:00:00',
            web_add_import_datum: '1899-12-30T00:00:00',
            web_add_export_datum: '1899-12-30T00:00:00',
            web_add_datum_user: '1899-12-30T00:00:00',
            web_add_obild: '',
            web_add_obild_ext: '',
            web_add_clog_user: 0,
            web_add_clog_date_time: '1899-12-30T00:00:00',
            web_add_ulog_user: 0,
            web_add_ulog_date_time: '1899-12-30T00:00:00',
            web_error: {
                web_err_nr: 0,
                web_err_txt: '',
            }
        },
        'web_user': '',
        'web_Pass': '',
    }
    
    return new Promise((resolve, reject) => {
      soap.createClient(url, {wsdl_headers: headers}, function(err, client) {
      
    
      client.setEndpoint('https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR')
      client.addHttpHeader('CF-Access-Client-Id', '30979c34f222ca7ac7ac3d24120060a5.access'); 
      client.addHttpHeader('CF-Access-Client-Secret', 'ff6e0612ff3cc2962cd1dbad55a55cf72f5d3d5f3678fdd0f3aece5f0586c048');
    
      client.get_web_common(payload, function(err, result) {
                resolve(result);
          });
      });
    })
}

async function main() {
    var futuraId = null;
    var searchcustomerdata = await searchCustomerInFutura(params.email, headers);

    console.log("search customer in Futura: "+ JSON.stringify(searchcustomerdata))
      var arrayLength = searchcustomerdata.web_search_customerResult.Tweb_search_kde_fld.length;
      let i = 0;
      var flag = false;

      while (i < arrayLength && flag != true) {
        var email = searchcustomerdata.web_search_customerResult.Tweb_search_kde_fld[i].web_flds.string[1];
        if(!(email.localeCompare("rohan.dhakad@sigmainfo.net"))) {
          futuraId = searchcustomerdata.web_search_customerResult.Tweb_search_kde_fld[i].web_flds.string[0];
          console.log("FuturaId: "+futuraId);
          flag = true;
        }
        i++;
      }

      if(flag) {
        var getWebCommonResult = await getWebCommon(futuraId, headers);
        var lolaltyCardNo = getWebCommonResult.web_add_kreditkarte;
        var loyaltyExpiryDetails = getWebCommonResult.web_add_sperrdatum;

        if(lolaltyCardNo == undefined) {
            lolaltyCardNo = "";
        }
        if(loyaltyExpiryDetails == undefined) {
            loyaltyExpiryDetails = "";
        }

        var finalResponse = {
            "futura_id": futuraId,
            "loyalty_card_no": lolaltyCardNo,
            "exp_date":loyaltyExpiryDetails
        }

        console.log(finalResponse);
      }
      else {
        console.log("%%%%%%%%%%%%%%%%%%%%%%")
        console.log("Customer not found")
      }



    // console.log(JSON.stringify(seachCustomerResponse));

    // var seachCustomerResponse1 = seachCustomerResponse.web_search_customerResult.Tweb_search_kde_fld;
    // console.log("\n");
    // console.log(seachCustomerResponse1[0].web_flds.string[0]);
    // console.log("************************************");

    // if(seachCustomerResponse1[0].web_error.web_err_nr == 0) {
    //     var length =  seachCustomerResponse1[0].web_flds.length;

    //     for(i=0; i<length; i++) {
    //             if(params.email == seachCustomerResponse1[0].web_flds.string[i]) {
    //                 futuraId = seachCustomerResponse1[0].web_flds[i].string[0];
    //             }    
    //     }
    // }
    // console.log("\n");
    // console.log("FuturaId: "+futuraId);
}
main();
