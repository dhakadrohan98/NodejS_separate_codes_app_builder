//Retrying code conditions
if (params.data.futura_get_customer != undefined && params.data.futura_get_customer.status == "true") {
    result = params.data.futura_get_customer.response;
    searchcustomerdata = params.data.futura_get_customer;
}
else {
    try {
        if (params.data.futura_get_customer.request !== "undefined") {
            email = params.data.futura_get_customer.request;
        }
        else {
            email = params.data.value.email;
        }

        searchcustomerdata['action'] = "Search By Email"
        searchcustomerdata['request'] = params.data.value.email
        result = await SearchInFutura(params, email);
        searchcustomerdata['status'] = true
        searchcustomerdata['response'] = result
    } catch (error) {
        if (error.code == "ECONNABORTED") {
            timeouterror = true
        }
        searchcustomerdata['status'] = false
        searchcustomerdata['response'] = error
    }
}
responseData['futura_search_email'] = searchcustomerdata