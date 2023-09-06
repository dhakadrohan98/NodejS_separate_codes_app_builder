var soap = require('soap');
  var url = 'https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR';


var headers = {
    'trace':1, 
    'exceptions': true,
    'connection_timeout': 15, 	
    'CF-Access-Client-Id': '30979c34f222ca7ac7ac3d24120060a5.access',
    'CF-Access-Client-Secret': 'ff6e0612ff3cc2962cd1dbad55a55cf72f5d3d5f3678fdd0f3aece5f0586c048'
}

var payload = {
    Value: {
            web_ans_typ: 3,
            web_ans_nummer: 704856404,
            web_ans_count: 1,
            web_ans_name1: '',
            web_ans_name2: '',
            web_ans_strasse: '',
            web_ans_strasse_2: '',
            web_ans_plz: '',
            web_ans_plz_zusatz: '',
            web_ans_postfach_valid: 0,
            web_ans_postfach_plz: '',
            web_ans_postfach_plz_zusatz: '',
            web_ans_postfach: '',
            web_ans_ort: '',
            web_ans_county: '',
            web_ans_land: '1',
            web_ans_titel: '',
            web_ans_anrede: '',
            web_ans_sachbearbeiter: '',
            web_ans_sachgeburtstag: '1899-12-30T00:00:00', // Birthday
            web_ans_telefon: '',
            web_ans_telefon2: '',
            web_ans_telefax: '',
            web_ans_email: '',
            web_ans_com_mode: '0',
            web_ans_m_typ: 0,
            web_ans_modem: '',
            web_error: {
              web_err_nr: 0,
              web_err_txt: ''
            }
        },
    'web_user': '',
    'web_Pass': '',
}

  soap.createClient(url, {wsdl_headers: headers}, function(err, client) {
  

  client.setEndpoint('https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR')
  client.addHttpHeader('CF-Access-Client-Id', '30979c34f222ca7ac7ac3d24120060a5.access'); 
  client.addHttpHeader('CF-Access-Client-Secret', 'ff6e0612ff3cc2962cd1dbad55a55cf72f5d3d5f3678fdd0f3aece5f0586c048');

  client.get_web_address(payload, function(err, result) {
         console.log(result);
         console.log(JSON.stringify(result))
      });
  });
