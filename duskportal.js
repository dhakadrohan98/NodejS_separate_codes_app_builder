const axios = require('axios')

/**
 * Reserves a loyalty card through the Dusk Portal API using the provided parameters.
 *
 * @param {Object} params - An object containing necessary parameters.
 * @param {string} params.DUSK_PORTAL_API_URL - The base URL of the Dusk Portal API.
 * @param {string} params.DUSK_PORTAL_RESERVE_CARD_ENDPOINT - The endpoint for reserving a card.
 * @param {string} params.DUSK_PORTAL_AUTH_TOKEN - The authentication token for API access.
 * @returns {Promise<Object|Error>} - A Promise that resolves with the response data upon successful reservation,
 *                                   or rejects with an Error if there's an issue.
 */
async function ReserveLoyaltyCard(params) {
    
    // Construct the URL for reserving a card using the provided endpoint
    var url = params.DUSK_PORTAL_API_URL + params.DUSK_PORTAL_RESERVE_CARD_ENDPOINT;

    // Configure the request
    var config = {
        timeout: params.SOAP_TIMEOUT,
        method: 'post',
        url: url.replace(/\\\//g, "/"), // Normalize any double backslashes to single slashes
        headers: {
            'Authorization': 'Bearer ' + params.DUSK_PORTAL_AUTH_TOKEN,
        }
    };

    try {
        // Send the request and wait for the response
        var response = await axios(config);

        // Check if the response status is successful (200)
        if (response.status === 200) {
            return response.data; // Return the response data
        }
    } catch (error) {
        throw new Error(error); // Return the caught error if there's an issue
    }
}

function duskportalCustomerPayload(params, futuracustomer, customerId)
{
    var data = params.data.value;

    return {
        "Futura_Number": data.futura_id,
        "Futura_Name": futuracustomer.customer.web_kde_index,
        "Card_Type": "",
        "Card_No": data.card_no,
        "ISO_Serial": data.givex[6],
        "Givex_No": data.givex[2],
        "Magento_No": customerId,
        "Expiry_Date": getdateasstring(futuracustomer.comon.web_add_sperrdatum),
        "Expiry_Text": "dusk Rewards Expiry Date",
        "First_Name": futuracustomer.address.web_ans_name1,
        "Last_Name": futuracustomer.address.web_ans_name2,
        "Email": futuracustomer.address.web_ans_email,
        "Street_1": futuracustomer.address.web_ans_strasse,
        "Street_2": futuracustomer.address.web_ans_strasse_2,
        "Suburb": futuracustomer.address.web_ans_ort,
        "Postcode": futuracustomer.address.web_ans_plz,
        "State": futuracustomer.address.web_ans_county,
        "Mobile": futuracustomer.address.web_ans_telefon,
        "Birthdate": getdateasstring(futuracustomer.address.web_ans_sachgeburtstag),
        "Enrolment_Date": getdateasstring(futuracustomer.comon.web_add_wf_date_time_1),
        "Signup_Date": getdateasstring(futuracustomer.comon.web_add_ulog_date_time),
        "Renew_Date": getdateasstring(futuracustomer.comon.web_add_wf_date_time_2)
    }

}


function duskportalrenewCustomerPayload(params, futuracustomer, newexpdate)
{
    return {
      "promotype":"welcome",
      "Renewals":[
            {"email":futuracustomer.address.web_ans_email,"rewards_expiry_date":newexpdate}
       ]
    }


}


async function RenewLoyaltyData(params, payload){
    // Construct the URL for reserving a card using the provided endpoint
    var url = params.DUSK_PORTAL_API_URL + params.DUSK_PORTAL_RENEW_EXP_API;

    // Configure the request
    var config = {
        timeout: params.SOAP_TIMEOUT,
        method: 'post',
        url: url.replace(/\\\//g, "/"), // Normalize any double backslashes to single slashes
        headers: {
            'Authorization': 'Bearer ' + params.DUSK_PORTAL_AUTH_TOKEN,
        },
        data: payload
    };

    try {
        // Send the request and wait for the response
        var response = await axios(config);

        // Check if the response status is successful (200)
        if (response.status === 200) {
            return response.data; // Return the response data
        }
    } catch (error) {
        throw new Error(error); // Return the caught error if there's an issue
    }
}


async function SendCustomerData(params, payload){
    // Construct the URL for reserving a card using the provided endpoint
    var url = params.DUSK_PORTAL_API_URL + params.DUSK_PORTAL_CREATE_UPDATE_MEMBER;

    // Configure the request
    var config = {
        timeout: params.SOAP_TIMEOUT,
        method: 'post',
        url: url.replace(/\\\//g, "/"), // Normalize any double backslashes to single slashes
        headers: {
            'Authorization': 'Bearer ' + params.DUSK_PORTAL_AUTH_TOKEN,
        },
        data: payload
    };

    try {
        // Send the request and wait for the response
        var response = await axios(config);

        // Check if the response status is successful (200)
        if (response.status === 200) {
            return response.data; // Return the response data
        }
    } catch (error) {
        throw new Error(error); // Return the caught error if there's an issue
    }
}

function getdateasstring(Isodate)
{
    var date = new Date(Isodate);
    var year = date.toLocaleString("default", { year: "numeric" });
    var month = date.toLocaleString("default", { month: "2-digit" });
    var day = date.toLocaleString("default", { day: "2-digit" });

    // Generate yyyy-mm-dd date string
    var formattedDate = year + month + day;

    return formattedDate
}


//noinspection JSAnnotator
module.exports = {
    ReserveLoyaltyCard,
    duskportalCustomerPayload,
    SendCustomerData,
    duskportalrenewCustomerPayload,
    RenewLoyaltyData
}
