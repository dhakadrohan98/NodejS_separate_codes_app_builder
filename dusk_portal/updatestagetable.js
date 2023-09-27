const {UpdateCustomerInMagento, getCustomerByEmail} = require("../magento.js")

var params = {
    "ECOMMERCE_API_URL":"https://mcstaging.dusk.au/rest/sv_dusk_au_en/V1/",
    "ECOMMERCE_AUTHORIZED_TOKEN":"nq4zr49fhs07xv9584koqyjicyz3yybd",
    "ECOMMERCE_CUSTOMER_ENDPOINT":"customers",
    "data":{
        "Futura_Number": "704856433",
       "Futura_Name": "Ritesh_sigma_abc Rana_Sigma_Sigma",
       "Card_Type":"DIGITAL",
       "Card_No":"60586301852100032794",
       "ISO_Serial":"",
       "Givex_No":"",
       "Magento_No":"",
       "Expiry_Date":"20270928",
       "Expiry_Text":"",
       "First_name":"Ritesh sigma",
       "Last_name":"Rana",
       "email":"ritesh.rana+1@sigmainfo.net",
       "Street_1":"367",
       "Street_2":"jiffaz stut",
       "Suburb":"Bengaluru",
       "Postcode":"45200",
       "State":"Australian Capital Territory",
       "Mobile":"6261122786",
       "Birthdate":"20150110",
       "Enrolment_Date":"",
       "Signup_Date":"",
       "Renew_Date":"",
       "updated_at":""
    }
}
var givex_id; //store givex_id from futura
var magentostagetable;
var givexBoolean=false, expDateBoolean=false; //flag

    //converting date(20050611) into date format(yyyy-mm-dd)
    // Given numeric date
    var num = params.data.Expiry_Date;
    // Convert it to a string
    var dateString = num.toString();
    // Extract year, month, and day parts
    var year = dateString.substring(0, 4);
    var month = dateString.substring(4, 6);
    var day = dateString.substring(6, 8);
    // Create the formatted date string
    var cardExpDate = day + '-' + month + '-' + year;

    if(params.data.Birthdate != undefined && params.data.Birthdate!= "") {
        //Formating DOB (yyyy-mm-dd)
        var dob = params.data.Birthdate;
        // Convert it to a string
        dateString = dob.toString();
        // Extract year, month, and day parts
        year = dateString.substring(0, 4);
        month = dateString.substring(4, 6);
        day = dateString.substring(6, 8);
        // Create the formatted date string
        var date_of_birth = year + '-' + month + '-' + day; //1999-01-10
    }

    var email = params.data.email; //rohan.dhakad@sigmainfo.net
    var futuraId = params.data.Futura_Number; //704856432
    var membershipCardNo = params.data.Card_No; // 60586307761100032569
    var firstName = params.data.First_name;
    var lastName= params.data.Last_name;

async function main(){
    var customerData = await getCustomerByEmail(params, params.data.email);
    // console.log(JSON.stringify(customerData));
    // Updating/Adding custom attributes(if not present)

    if(customerData.total_count == 1){ //customer found in magento

        //updating firstname, lastname and DOB
        customerData.items[0].firstname = firstName;
        customerData.items[0].lastname = lastName;
        customerData.items[0].dob = date_of_birth;

        var magecustomer = customerData.items[0];  //storing magento details to a variable
        var magentoId = customerData.items[0].id; //taking magento id
        var customAttrlen =  magecustomer.custom_attributes.length; //length of custom Attributes of customer(magento)
        let i=0;
        
        while(i<customAttrlen) {

            if(magecustomer.custom_attributes[i].attribute_code == 'erp_customer_id') { //updating Futura Id
                magecustomer.custom_attributes[i].value = futuraId;
            }
            else if(magecustomer.custom_attributes[i].attribute_code == 'givex_number') { //updating Givex Card Number if givex_number attrubute exists already, Otherwise add givex_number as new custom attributes
                magecustomer.custom_attributes[i].value = membershipCardNo;
                givexBoolean = true;
            }
            else if(magecustomer.custom_attributes[i].attribute_code == 'rewards_expiry_date') { //updating Rewards Expiry Date
                magecustomer.custom_attributes[i].value = cardExpDate;
                expDateBoolean = true;
            }
            i++;
        }
        //adding new custom attributes as givex_number into magento's customer attributes. If it is not present already
        if(membershipCardNo != undefined && i == customAttrlen && givexBoolean==false){
            magecustomer.custom_attributes.push({"attribute_code": "givex_number", "value": membershipCardNo});
        }
        //adding new custom attributes as rewards_expiry_date into magento's customer attributes. If it is not present already
        if(cardExpDate != undefined && i == customAttrlen && expDateBoolean==false){
            magecustomer.custom_attributes.push({"attribute_code": "rewards_expiry_date", "value": cardExpDate});
        }

        var customAttributesnewLength =  magecustomer.custom_attributes.length;
        var flag=false;
            //updating customer data in magento (erp_customer_id, givex_number & rewards_expiry_date)
            updateCustomerDataResult = await UpdateCustomerInMagento(params,{"customer":magecustomer},magentoId);
            flag = true;
            
        console.log(JSON.stringify(updateCustomerDataResult));
    }
}
main();