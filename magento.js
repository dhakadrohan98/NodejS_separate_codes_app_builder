const axios = require('axios');

//Getting RMA Details
async function getRMADetails(params){
    var rma_id;
    if(params.data.rma_id != undefined){
        rma_id = params.data.rma_id;
    }
    else{
        rma_id = params.data.value.entity_id;
    }
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

//updating rma in magento
async function updateRMA(params,payload,rma_id){

    var url = params.ECOMMERCE_API_URL+params.ECOMMERCE_RETURNS_ENDPOINT+'/'+rma_id; //params.data.value.entity_id-/18

    var config = {
      method: 'put',
      url: url.replace(/\\\//g, "/"),
      headers: { 
        'Authorization': 'Bearer '+params.ECOMMERCE_AUTHORIZED_TOKEN, 
        'Content-Type': 'application/json'
      },
      data : JSON.stringify(payload)
    };

    try{
        var response = await axios(config);

        if(response.status == 200){
            return response.data;
        }
    }catch(error){
        return error;
    }
}

module.exports = {
    updateRMA,
    getRMADetails
  }