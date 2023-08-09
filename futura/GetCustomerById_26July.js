var soap = require('soap');

var url = 'https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR';
var arg = {
	Value: {
    web_kde_nummer: 704750609,
    web_kde_typ: 3,
    web_kde_index: '',
    web_kde_filiale: 0,
    web_kde_land: '1',
    web_kde_region: '0',
    web_kde_konto: 0,
    web_kde_vertreter: 0,
    web_kde_rabatt: 0,
    web_kde_rab_regel: 0,
    web_kde_kondition: '',
    web_kde_waehrung: '',
    web_kde_provision: 0,
    web_kde_kreditlimit: 0,
    web_kde_eigensch_typ: 0,
    web_kde_eigen_page: 0,
    web_kde_eigensch: '',
    web_kde_berater: 0,
    web_kde_eigensch_aend: 0,
    web_kde_kreditvers: '',
    web_kde_haendler: 0,
    web_kde_preisstufe: 0,
    web_kde_egsteuernr: '',
    web_kde_fasteuernr: '',
    web_kde_keine_ust: 0,
    web_kde_skonto: 0,
    web_kde_skonto_frist: 0,
    web_kde_plz_index: '',
    web_kde_prio: 0,
    web_kde_tour: 0,
    web_error: {
      web_err_nr: 0,
      web_err_txt: '',
    },
  },
  web_user: '',
  web_Pass: ''
};

var headers = {
    'trace':1, 
    'exceptions': true,
    'connection_timeout': 15, 	
    'CF-Access-Client-Id': '30979c34f222ca7ac7ac3d24120060a5.access',
    'CF-Access-Client-Secret': 'ff6e0612ff3cc2962cd1dbad55a55cf72f5d3d5f3678fdd0f3aece5f0586c048'
}

  soap.createClient(url, {wsdl_headers: headers}, function(err, client) {
  

  client.setEndpoint('https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR')
  client.addHttpHeader('CF-Access-Client-Id', '30979c34f222ca7ac7ac3d24120060a5.access'); 
  client.addHttpHeader('CF-Access-Client-Secret', 'ff6e0612ff3cc2962cd1dbad55a55cf72f5d3d5f3678fdd0f3aece5f0586c048');

  client.get_web_customer(arg,function(err, result) {
         console.log(result);
      });
  });
