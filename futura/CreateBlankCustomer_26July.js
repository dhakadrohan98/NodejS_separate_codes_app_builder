var soap = require('soap');
  var url = 'https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR';


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

  client.get_web_new_customer_id(function(err, result) {
         console.log(result);
      });
  });