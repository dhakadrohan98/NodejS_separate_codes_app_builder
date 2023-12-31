/*
* <license header>
*/

/**
 * This is a sample action showcasing how to access an external API
 *
 * Note:
 * You might want to disable authentication and authorization checks against Adobe Identity Management System for a generic action. In that case:
 *   - Remove the require-adobe-auth annotation for this action in the manifest.yml of your application
 *   - Remove the Authorization header from the array passed in checkMissingRequestInputs
 *   - The two steps above imply that every client knowing the URL to this deployed action will be able to invoke it without any authentication and authorization checks against Adobe Identity Management System
 *   - Make sure to validate these changes against your security requirements before deploying the action
 */


const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const {sendcloudevent} = require('../token')
const {getProduct,converImageintoBase64,getProductOptions} = require('../magento')
const {getViareAuthcode, sendProductDetail, updateProductImage} = require('../viare')
const {CloudEvent} = require("cloudevents");



// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try{
    
    var paramsRequest;
    var responseData = {};
    //while retrying we get data in params.data.params
    if (typeof params.data.value.params !== "undefined") {
      paramsRequest = params.data.value.params;
      // //If receiving parent_id from retrying then store it in responseData['id']. 
      if(typeof params.data.value.api_id !== "undefined") {
          responseData["api_id"] = params.data.value.api_id;
      }
  }
  else {
      paramsRequest = params.data.value;
  }

    responseData["event_code"] = params.type;
    responseData["provider_id"] = params.source;
    responseData["event_id"] = params.event_id;
    responseData["entity"] = "Product";
    responseData["from"] = "Magento";
    responseData["reference_id"] = paramsRequest.sku;
    responseData['params'] = paramsRequest;

      // header info for all the  SOAP request
      const header = {
        'trace':1,
        'exceptions': true,
        'connection_timeout': 15
      } 
      const apiEndpoint = params.VIARE_PRODUCT_API;
      var published;

      // 'info' is the default level if not set
      logger.info('Calling the main action')

      // log parameters, only if params.LOG_LEVEL === 'debug'
      logger.debug(stringParameters(params))

      try {
          // check for missing request input parameters and headers
          const requiredParams = [/* add required params */]
          const requiredHeaders = []
          const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
          if (errorMessage) {
            // return and log client errors
            return errorResponse(400, errorMessage, logger)
          }

          // extract the user Bearer token from the Authorization header
          const token = getBearerToken(params)

          // send authentication request
          var getauthentication = await getViareAuthcode(params)
          var authtoken = getauthentication.AuthenticateResult.Message;
          var timeouterror = false;

          var productmagentodata={};
          var productdata = {};
          //Retrying condition -1
          if (typeof paramsRequest.get_product_data == "undefined" || paramsRequest.get_product_data.status == false) {
            try {
              productmagentodata['integration'] = "Magento";
              productmagentodata['action'] = "Get Product";
              productmagentodata['request'] = params;
              // Magento product data
              productdata = await getProduct(params)
              productmagentodata['status'] = true;
              productmagentodata['response'] = productdata;
            } catch (error) {
              if (error.code == "ECONNABORTED") {
                  timeouterror = true //is timeout defined & set globally
              }
              productmagentodata['status'] = false
              productmagentodata['response'] = error
          }
        } else if (typeof paramsRequest.get_product_data != "undefined" && paramsRequest.get_product_data.status == true) {
            productdata = paramsRequest.get_product_data.response;
            productmagentodata = paramsRequest.get_product_data;
        }
        responseData['get_product_data'] = productmagentodata;

          for (var i = 0; i < productdata.custom_attributes.length; i++) {
              if(productdata.custom_attributes[i].attribute_code == "erp_barcode" ||
                  productdata.custom_attributes[i].attribute_code == "erp_value_added_services" ||
                  productdata.custom_attributes[i].attribute_code == "erp_product_group" ||
                  productdata.custom_attributes[i].attribute_code == "image")
              {
                    var attr_code = productdata.custom_attributes[i].attribute_code;
                    productdata[attr_code] = productdata.custom_attributes[i].value;
              }


              if(productdata.custom_attributes[i].attribute_code == "color"){
                    var attr_code = productdata.custom_attributes[i].attribute_code;
                    var getproducttoptiondata = {};
                    getproducttoptiondata['request'] = {};
                    //Retrying condition -2
                    if (typeof paramsRequest.get_product_option_magento == "undefined" || paramsRequest.get_product_option_magento.status == false){
                    try {
                      getproducttoptiondata['integration'] = "Magento";
                      getproducttoptiondata['action'] = "Get Product Option";
                      getproducttoptiondata['request']['attr_code'] = attr_code;
                      getproducttoptiondata['request']['color'] = productdata.custom_attributes[i].value;
                      // get Magento product attribute option Label from option Id
                      productdata[attr_code] = await getProductOptions(params,attr_code,productdata.custom_attributes[i].value);
                      getproducttoptiondata['status'] = true;
                      getproducttoptiondata['response'] = productdata[attr_code];
                    } catch (error) {
                      if (error.code == "ECONNABORTED") {
                          timeouterror = true
                      }
                      getproducttoptiondata['status'] = false;
                      getproducttoptiondata['response'] = error;
                  }
                } else if (paramsRequest.get_product_option_magento != undefined && paramsRequest.get_product_option_magento.status == true) {
                    productdata[attr_code] = paramsRequest.get_product_option_magento.response;
                    getproducttoptiondata = paramsRequest.get_product_option_magento;
                  }
                  responseData['get_product_option_magento'] = getproducttoptiondata;
              }
          }

          if(productdata.type_id == "simple"){

              // Update Viare product
              var sendproductrequestdata={}, sendProductRequestResult={};
              sendproductrequestdata['request'] = {};
              //Retrying condition -3
              if (typeof paramsRequest.send_product_request_viare == "undefined" || paramsRequest.send_product_request_viare.status == false) {
                try {
                  sendproductrequestdata['integration'] = "Viare";
                  sendproductrequestdata['action'] = "Send Product Request";
                  sendproductrequestdata['request']['authtoken'] = authtoken;
                  sendproductrequestdata['request']['productdata'] = productdata;
                  sendproductrequestdata['request']['apiEndpoint'] = apiEndpoint;
                  sendproductrequestdata['request']['header'] = header;
                  sendProductRequestResult = await SendProductRequest(authtoken, params, productdata, apiEndpoint, header);
                  sendproductrequestdata['status'] = true;
                  sendproductrequestdata['response'] = sendProductRequestResult;
                } catch (error) {
                  if (error.code == "ECONNABORTED") {
                      timeouterror = true
                  }
                  sendproductrequestdata['status'] = false
                  sendproductrequestdata['response'] = error
              }
            } else if (typeof paramsRequest.send_product_request_viare != "undefined" && paramsRequest.send_product_request_viare.status == true) {
              sendProductRequestResult = paramsRequest.send_product_request_viare.response;
              sendproductrequestdata = paramsRequest.send_product_request_viare;
            }
            responseData['send_product_request_viare'] = sendproductrequestdata;

            var sendMediaImageResult = {};
            var sendmediaimagedata = {};
            //Retrying condition -4
            if (typeof paramsRequest.send_media_image_viare == "undefined" || paramsRequest.send_media_image_viare.status == false) {
              try{
                sendmediaimagedata['integration'] = "Viare";
                sendmediaimagedata['action'] = "Send Media Image";
                if(responseData['send_product_request_viare'] != undefined && responseData['send_product_request_viare']['request'] != undefined) {
                  sendmediaimagedata['request'] = responseData['send_product_request_viare']['request'];
                }
                // Update Viare Media
                sendMediaImageResult = await SendMediaImage(authtoken, params, productdata, apiEndpoint, header);
                sendmediaimagedata['status'] = true;
                sendmediaimagedata['response'] = sendMediaImageResult;
              } catch (error) {
                if (error.code == "ECONNABORTED") {
                    timeouterror = true
                }
                sendmediaimagedata['status'] = false
                sendmediaimagedata['response'] = error
            }
          } else if (typeof paramsRequest.send_media_image_viare != "undefined" && paramsRequest.send_media_image_viare.status == true) {
            sendMediaImageResult = paramsRequest.send_media_image_viare.response;
            sendmediaimagedata = paramsRequest.send_media_image_viare;
          }
          responseData['send_media_image_viare'] = sendmediaimagedata;
      } else {
          //logging productdata.type_id into responseData (just for logging purpose if productdata.type_id is not simple)
          responseData['product_type_not_simple'] = {};
          responseData['product_type_not_simple']['integration'] = "Magento";
          responseData['product_type_not_simple']['action'] = "Logging Product Data Type Id"
          responseData['product_type_not_simple']['request'] = "";
          responseData['product_type_not_simple']['status'] = true;
          responseData['product_type_not_simple']['response'] = productdata.type_id;
          // response = {
          //     statusCode: 200,
          //     body: productdata.type_id
          // }
        }		
      } catch(error) {
        if (typeof responseData['get_product_data']['status'] == "undefined") {
          responseData['get_product_data']['status'] = false;
        }
        if (id && typeof responseData['get_product_option_magento']['status'] == "undefined") {
            responseData['get_product_option_magento']['status'] = false;
        }
        if (id && typeof responseData['send_product_request_viare']['status'] == "undefined") {
          responseData['send_product_request_viare']['status'] = false;
        }
        if (id && typeof responseData['send_media_image_viare']['status'] == "undefined") {
          responseData['send_media_image_viare']['status'] = false;
        }
      } 
      // Logging request
      published = await sendcloudevent(params,params.DUSK_MAGENTO_PROVIDER_ID, params.DUSK_LOGGING_EVENT_CODE, responseData);

      const response = {
          statusCode: 200,
          body: responseData
      }
      return response;
    } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    //return errorResponse(500, 'server error'+error, logger)
    const response = {
      statusCode: 200,
      body: error
    }
  }
}




async function SendProductRequest(authtoken, params, productparam, apiEndpoint, header, count=0){
  var productArg = {
    "authenticationToken": authtoken,
    "product": {
      "ForeignIdentity": productparam.id,
      "Style": productparam.sku,
      "Title": productparam.name,
      "Manufacturer": productparam.erp_product_group? productparam.erp_product_group : "",
      "ProductInformation": [
        {
          "NameValuePair": {
            "Name": "PackingInstructions",
            "Value": productparam.erp_value_added_services ? productparam.erp_value_added_services : ""
          }
        }
      ],
      "Items": [
        {
          "ProductItem": {
            "ForeignIdentity": productparam.sku,
            "Barcode": productparam.erp_barcode? productparam.erp_barcode : productparam.sku ,
            "Colour": productparam.color? productparam.color : "",
            "Weight": productparam.weight
          }
        },
      ]
    },
  }

  var productdata= "";
  var returnData= {};

  try{
    productdata = await sendProductDetail(apiEndpoint, header, productArg, params.SOAP_TIMEOUT);
    if(productdata.UpdateProductResult.Code == 1001 && count < 2){
        var viareauthresponse = await getViareAuthcode(params, true);
        var authtoken = viareauthresponse.AuthenticateResult.Message
        var productdata = await SendProductRequest(authtoken, params, productparam, apiEndpoint, header,count+1)
    }

    if (productdata.UpdateProductResult.Code != 0){
      returnData['status'] = false;
    }else{
      returnData['status'] = true;
    }
    returnData['request'] = productArg;
    returnData['response'] = productdata;
    returnData['action'] = "Create/Update Product";
  }catch (error){
    productdata = "";
    returnData['status'] = false;
    returnData['request'] = productArg;
    returnData['response'] = error;
    returnData['action'] = "Create/Update Product";
  }

  

  return returnData;
}

// send Product image Update request
async function SendMediaImage(authtoken, params, productparam, apiEndpoint, header, count=0) {

    var imagedata, imageurl;

    if(productparam.hasOwnProperty("image")){
      imageurl = params.MAGENTO_MEDIA_URL+"catalog/product"+productparam.image;
      imagedata = await converImageintoBase64(imageurl);
    }else{
      return false;
    }

    var label;
    for (var i = 0; i < productparam.media_gallery_entries.length; i++) {
        var mediatypes = productparam.media_gallery_entries[i].types
        if(mediatypes.includes("image"))
        {
               label = productparam.media_gallery_entries[i].label
        }
    }

    var productArg = {
      "authenticationToken": authtoken,
      "style": productparam.sku,
      "barcode": productparam.erp_barcode? productparam.erp_barcode : productparam.sku ,
      "isDefault": true,
      "caption": label ? label : productparam.name,
      "imageData": imagedata
  }

  var productdata= "";
  var returnData= {};

  try{
    productdata = await updateProductImage(apiEndpoint, header, productArg, params.SOAP_TIMEOUT);
    if(productdata.SetMainImageResult.Code == 1001 && count < 2){
        var viareauthresponse = await getViareAuthcode(params, true);
        var authtoken = viareauthresponse.AuthenticateResult.Message
        var productdata = await SendMediaImage(authtoken, params, productparam, apiEndpoint, header,count+1)
    }

    if (productdata.SetMainImageResult.Code != 0){
      returnData['status'] = false;
    }else{
      returnData['status'] = true;
    }
    productArg.imageData = imageurl;
    returnData['request'] = productArg;
    returnData['response'] = productdata;
    returnData['action'] = "Create/Update Product Image";
  }catch (error){
    productdata = "";
    productArg.imageData = imageurl;
    returnData['status'] = false;
    returnData['request'] = productArg;
    returnData['response'] = error;
    returnData['action'] = "Create/Update Product Image";
  }

  return returnData;
}

exports.main = main
