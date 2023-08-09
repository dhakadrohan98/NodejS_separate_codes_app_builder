var soap = require('soap');
var apiEndpoint = 'https://dusk.viare.io/global/api/Orders.asmx?WSDL';

var headers = {
'SOAPACTION': 'http://www.estaronline.com/api/orders/DeleteOrderItem',
}

var payload = {
    'authenticationToken':'14a7aff1-c18a-48cb-9e04-3c37e8bea2f1',
    'orderItemID':1034,
    'quantity':1
};

soap.createClient(apiEndpoint, {wsdl_headers: headers}, function(err, client) {


//   client.setEndpoint('https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR')
//   client.addHttpHeader('CF-Access-Client-Id', '30979c34f222ca7ac7ac3d24120060a5.access'); 
//   client.addHttpHeader('CF-Access-Client-Secret', 'ff6e0612ff3cc2962cd1dbad55a55cf72f5d3d5f3678fdd0f3aece5f0586c048');

    client.DeleteOrderItem(payload, function(err, result) {
       console.log(result);
    });
}); 