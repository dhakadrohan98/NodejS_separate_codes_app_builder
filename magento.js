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

async function UpdateCustomerInMagento(params,payload,id){
    if(typeof payload.customer.custom_attributes != "undefined" && payload.customer.custom_attributes.length > 0)
    {
        for (var i = 0; i < payload.customer.custom_attributes.length; i++) 
        {
            // Checking if custom attribute of customer has expiry date or not
            if(payload.customer.custom_attributes[i].attribute_code == "rewards_expiry_date")
            {
                expirydateinpayload = payload.customer.custom_attributes[i].value
                var currentAusDate = new Date().toLocaleDateString("en-US", {timeZone: "Australia/Sydney"});
                var currentAusDateIso = new Date(currentAusDate);
                var expirydateIso = new Date(expirydateinpayload);
               //Checking if customer is not already in loyalty customer group and non-expired loyalty membership
               if(payload.customer.group_id != params.ECOMMERCE_CUSTOMER_LOYALTY_GROUP_ID && currentAusDateIso.getTime() < expirydateIso.getTime()){
                    for (var j = 0; j < payload.customer.custom_attributes.length; j++) {
                        // checking if custom attribute of customer is having givex number or not
                        if(payload.customer.custom_attributes[j].attribute_code == "givex_number"){
                            payload.customer.group_id = params.ECOMMERCE_CUSTOMER_LOYALTY_GROUP_ID;
                        }
                    }    
                }else if(payload.customer.group_id != params.ECOMMERCE_CUSTOMER_GENERAL_GROUP_ID && currentAusDateIso.getTime() > expirydateIso.getTime()){
                    payload.customer.group_id = params.ECOMMERCE_CUSTOMER_GENERAL_GROUP_ID;
                }
            }
        }
    }
    
    var url = params.ECOMMERCE_API_URL+params.ECOMMERCE_CUSTOMER_ENDPOINT+'/'+id; //params.data.value.entity_id-/18
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

async function getCustomerByEmail(params, email){

    var urlparams = "search?searchCriteria[filterGroups][0][filters][0][field]=email&searchCriteria[filterGroups][0][filters][0][value]="+encodeURIComponent(email)+"&searchCriteria[filterGroups][0][filters][0][condition_type]=eq"
    var url = params.ECOMMERCE_API_URL+params.ECOMMERCE_CUSTOMER_ENDPOINT+'/'+urlparams; //params.data.value.entity_id-/18
    
    var config = {
      method: 'get',
      url: url.replace(/\\\//g, "/"), 
      headers: { 
        'Authorization': 'Bearer '+params.ECOMMERCE_AUTHORIZED_TOKEN,
      }
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
    getRMADetails,
    UpdateCustomerInMagento,
    getCustomerByEmail
  }