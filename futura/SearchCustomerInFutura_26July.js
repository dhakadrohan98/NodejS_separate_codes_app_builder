var soap = require('soap');
var apiEndpoint = 'https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR';

var headers = {
'trace': 1, 
    'exceptions': true,
    'connection_timeout': 30,
    'CF-Access-Client-Id': '30979c34f222ca7ac7ac3d24120060a5.access',
    'CF-Access-Client-Secret': 'ff6e0612ff3cc2962cd1dbad55a55cf72f5d3d5f3678fdd0f3aece5f0586c048'
}

var payload = {"web_search_kde":{"web_fld_names":{"string":["ADD_NUMMER","ANS_EMAIL","ADD_TYP"]},"web_flds_fill":{"string":["","rohan+5.dhakad@sigmainfo.net","3"]},"web_error":{"web_err_nr":0,"web_err_txt":""}}}	
var result1;

return new Promise((resolve, reject) => {
soap.createClient(apiEndpoint, {wsdl_headers: headers}, function(err, client) {


  client.setEndpoint('https://futura-staging-adr.dusk.com.au/SOAP?service=FuturERS_ADR');
  client.addHttpHeader('CF-Access-Client-Id', '30979c34f222ca7ac7ac3d24120060a5.access'); 
  client.addHttpHeader('CF-Access-Client-Secret', 'ff6e0612ff3cc2962cd1dbad55a55cf72f5d3d5f3678fdd0f3aece5f0586c048');

    client.web_search_customer(payload, function(err, result) {
      result1 = result
       resolve(result)
    });
  });
}).then((result) => {
      console.log(JSON.stringify(result))
      // searchcustomerdata={}
      // searchcustomerdata['status'] = true
      // searchcustomerdata['response'] = result
      // console.log("search customer in Futura: "+ JSON.stringify(searchcustomerdata))
      // var arrayLength = result.web_search_customerResult.Tweb_search_kde_fld.length;
      // let i = 0;
      // var flag = false;

      // while (i < arrayLength && flag != true) {
      //   var email = result.web_search_customerResult.Tweb_search_kde_fld[i].web_flds.string[1];
      //   if(!(email.localeCompare("rohandhakad11@gmail.com"))) {
      //     var futuraNumber = result.web_search_customerResult.Tweb_search_kde_fld[i].web_flds.string[0];
      //     console.log(futuraNumber);
      //     flag = true;
      //   }
      //   i++;
      // }
  });

// // Load the JSON data into an object
// const data = JSON.parse(result);