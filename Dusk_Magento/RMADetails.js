var axios = require('axios');

var params = {
    "ECOMMERCE_API_URL":"https://mcstaging.dusk.au/rest/sv_dusk_au_en/V1/",
    "ECOMMERCE_RETURNS_ENDPOINT": "returns",
    "ECOMMERCE_AUTHORIZED_TOKEN":"nq4zr49fhs07xv9584koqyjicyz3yybd"
}
var rma_id = 6;

async function getRMADetails(params, rma_id){
    var url = params.ECOMMERCE_API_URL+params.ECOMMERCE_RETURNS_ENDPOINT+"/"+rma_id;
    var config = {
        method: 'GET',
        url: url.replace(/\\\//g, "/"),
        headers: {
            'Authorization': 'Bearer '+params.ECOMMERCE_AUTHORIZED_TOKEN,
            'Content-Type': 'application/json'
        }
      };

      try {
        var response = await axios(config);
  
        if (response.status == 200) {
            return response.data;
        }
      } catch (error) {
            return "Error: "+error.message;
        }
}

async function main(){
    var result = await getRMADetails(params,rma_id);
    console.log(result);
}

main();