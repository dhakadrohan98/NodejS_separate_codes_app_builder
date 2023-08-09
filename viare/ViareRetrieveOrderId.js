
const axios = require('axios');
var soap = require('soap');

var params = {};
var order_data = {};
params['VIARE_USERNAME'] = 'duskAPI';
params['VIARE_PASSWORD'] = 'duskAPI123';

var orderExist = {
    "authenticationToken": "",
    "externalOrderID": ""
};

global.authenticationToken = "";

try{
    const header = {
        'trace':1,
        'exceptions': true,
        'connection_timeout': 15
    };
    var apiEndpoint = 'https://dusk.viare.io/global/api/Orders.asmx?WSDL';
    var authtoken = getAuthTokenViare(params,apiEndpoint,header);
    setTimeout(function(){
        console.log(" 1 Authtoken: ", authtoken);
        var order_id = 3;

        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://mcstaging.kellyhayes.com/rest/default/V1/orders/'+order_id,
            headers: {
                'Authorization': 'Bearer u39b869kztwla5eb5jzasuh6ookp84um'
            },
            data : {}
        };

        console.log("Auth Token is: ", global.authenticationToken);
        var payload = generatePayloadForOrderExist(order_data, global.authenticationToken)

        console.log('Payload: ', payload);

        var isOrderExistData = isOrderExist('https://dusk.viare.io/global/api/Orders.asmx?WSDL', header, payload);

        console.log('isOrderExistData: ', isOrderExistData);


    }, 10000);
    console.log(" 2 Authtoken: ", authtoken);

} catch (error) {
    console.log('Last Error Message: ', error.message);
}

function generatePayloadForOrderExist(ecommerce_order_data, token)
{
    var order = ecommerce_order_data;
    var payload = orderExist;
    payload['authenticationToken'] = ""+token;
    //payload['externalOrderID'] = ""+order.entity_id;
    payload['externalOrderID'] = 138;

    return payload;
}

async function getAuthTokenViare(params,apiEndpoint,header)
{
    var token = await authrequestsend(params,apiEndpoint,header);
    return token; 
}

async function authrequestsend(params,apiEndpoint,header){
    const args = {
        "username": params.VIARE_USERNAME,
        "password": params.VIARE_PASSWORD
    };

    var authrequest = await SendViareAuthRequest(apiEndpoint, header, args);
    var authtoken = authrequest.AuthenticateResult.Message

    return authtoken;
}

async function SendViareAuthRequest(apiEndpoint, header, payload){
    return new Promise((resolve, reject) => {
          soap.createClient(apiEndpoint, header, function(err, client) {
          if(err){
            console.log('Promise Err: ', err.message);
            reject(err)
          }
          client.Authenticate(payload, function(err, result) {
            if(err){
                console.log('Authenticate Err: ', err.message);
              reject(err)
            }else{
                console.log('Authenticate resolve: ', result);
                global.authenticationToken = result.AuthenticateResult.Message;
              resolve(result)
            }
          })
        })
      })
}

async function isOrderExist(apiEndpoint, header, payload)
{
    return new Promise((resolve, reject) => {
        soap.createClient(apiEndpoint, header, function(err, client) {
            if(err){
                console.log('First Reject', err)
                reject(err)
            }
            client.Search(payload, function(err, result) {
                if(err){
                    console.log('Second Reject', err)
                    reject(err)
                }else{
                    console.log('result: ', result)
                    console.log('result data: ', JSON.stringify(result.SearchResult.Data))
                    console.log('result data type: ', typeof (result.SearchResult.Data))
                    console.log('result data id: ', (result.SearchResult.Data.int[0]))
                    resolve(result)
                }
            })
        })
    })
}
