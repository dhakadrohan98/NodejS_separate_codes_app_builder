const {getCustomerData, getCommonFieldData, getAddressData,SearchInFutura,createBlankCustomer, getCustomerDataById, UpdateCustomerInFututra} = require('../futura')


  try {

    let responseData = {};
    let params = {
        'event_code': "customEventCode",
        'provider_id': "73847384783",
        'event_id': "customEventId"
    };

    responseData["event_code"] = params.event_code;
    responseData["provider_id"] = params.provider_id;
    responseData["event_id"] = params.event_id;
    responseData["entity"] = "Create/Update Customer";

    console.log("Magento customer data");

    var result={},searchcustomerdata={}
    searchcustomerdata['request'] = params.data.value.email
    searchcustomerdata['action'] = "Search By Email"
    try{
        console.log("search customer in futura: ")
        result = await SearchInFutura(params,params.data.value.email);
        // console.log(result)
        searchcustomerdata['status'] = true
        searchcustomerdata['response'] = result
    }catch(error){
        searchcustomerdata['status'] = false
        searchcustomerdata['response'] = error
        
    }

    responseData['futura_search_email'] = searchcustomerdata
    console.log("1st responseData array: "+ JSON.stringify(responseData));

    
    var id,updatecustomer
    if(result.length > 0){
      id = result[0]
      var getcustomerdata={}
      getcustomerdata['action'] = "Get Customer Detail"
      getcustomerdata['request'] = id
      try{
          updatecustomer = await getCustomerDataById(params,id);
          console.log("Update customer Data: ");
          console.log(JSON.stringify(updatecustomer));
          getcustomerdata['status'] = true
          getcustomerdata['response'] = updatecustomer
      }catch(error){
          getcustomerdata['status'] = false
          getcustomerdata['response'] = error
      }
      responseData['futura_get_customer_detail'] = getcustomerdata
      console.log("2nd responseData array: "+JSON.stringify(responseData));
    }else{
        var getBlankcustomerId={}
        getBlankcustomerId['action'] = "Get Blank Customer"
        try{
            var customer = await createBlankCustomer(params)
            id = customer.get_web_new_customer_idResult.web_kde_nummer
            getBlankcustomerId['status'] = true
            getBlankcustomerId['response'] = id  
        }catch(error){
            getBlankcustomerId['status'] = false
            getBlankcustomerId['response'] = error
        }
        responseData['futura_get_blank_customer'] = getBlankcustomerId
        updatecustomer = {
          "customer": getCustomerData(),
          "comon": getCommonFieldData(),
          "address": getAddressData()
        }
        console.log(JSON.stringify(updatecustomer))
    }

    if(id){
        console.log("118: ID is: "+id);
        updatecustomer.customer.web_kde_nummer = id
        updatecustomer.address.web_ans_nummer = id
        updatecustomer.comon.web_add_nummer = id

        updatecustomer.comon.web_add_status = 2;
        const [datesting,time] = params.data.value.dob.split(' ');
        const [year,month, day] = datesting.split('-');
        const date = new Date(Date.UTC(year, month - 1, day));
        const dob = date.toISOString();
        updatecustomer.address.web_ans_sachgeburtstag = dob
        updatecustomer.address.web_ans_name1 = params.data.value.firstname
        updatecustomer.address.web_ans_name2 = params.data.value.lastname
        updatecustomer.address.web_ans_email = params.data.value.email

        console.log("updatecustomer: ");
        console.log(JSON.stringify(updatecustomer));

        var updateCustomer={}
        updateCustomer['action'] = "Update Customer"
        updateCustomer['request'] = updatecustomer
        try{
            var customerdata = await UpdateCustomerInFututra(params, updatecustomer)
            console.log(JSON.stringify(updatecustomer))
            updateCustomer['status'] = true
            updateCustomer['response'] = customerdata
            console.log("UpdateCustomerInFututra: ");
            console.log(customerdata);
        }catch(error){
            updateCustomer['status'] = false
            updateCustomer['response'] = error
        }

        console.log("150=> 3rd responseData array:");
        responseData['futura_update_customer'] = updateCustomer;
        console.log(JSON.stringify(responseData));


        for (var i = 0; i < magecustomer.custom_attributes.length; i++) {
            console.log("158=> Magecustomer length: "+ magecustomer.custom_attributes.length)
            if(magecustomer.custom_attributes[i].attribute_code == "erp_customer_id" && id)
            {
                  console.log("161: "+magecustomer.custom_attributes[i]);
                  magecustomer.custom_attributes[i].value = id      
            }
        }

        var magecustomerupdate = await UpdateCustomerInMagento(params,{"customer": magecustomer});
        console.log("167=> " + magecustomerupdate)
    }
    
    var published = await sendcloudevent(params,params.DUSK_MAGENTO_PROVIDER_ID, params.DUSK_LOGGING_EVENT_CODE, responseData)

    const response = {
      statusCode: 200,
      body: published
    }
    return response

}catch (error) {
    // log any server errors
    console.error(error); // Log the detailed error object
    // return with 500
    return errorResponse(500, 'server error'+error, logger)
  }


