var axios = require('axios');
var skuArray = [50209644, 50209484];
var storesArray = [100, 102, 104, 105, 106];

var config = {};
var storeIds = "";

for (i = 0; i < storesArray.length; i++) {
  storeIds = storeIds + storesArray[i] + ",";
}

var responseData = [];

async function fetchData() {

  var finalResponse = {};
  var final = {};
  var grandFinal = {};

  for (j = 0; j < skuArray.length; j++) {
    var config = {
      method: 'get',
      url: 'https://dusk.viare.io/api/availability/store/' + skuArray[j] + '?stores=' + storeIds
      //'50209484?stores=100,102,104,105,106'
    };

    try {
      var response = await axios(config);

      if (response.status == 200) {

        var sku = skuArray[j];

        
        
        var xyz=[];
        for(k=0; k < storesArray.length; k++) {
          var branchVal =response.data[k].Branch;
          var actualVal =response.data[k].Barcodes[0].Value;

          // var obj = JSON.parse(response.data);

          xyz.push({"Branch": branchVal,"qty":actualVal});

          //  final[sku] = [{"Branch": branchVal,"qty":actualVal}];
        }
      final[sku]=xyz;
        // final[sku[i].qty] = finalResponse[i].Barcodes[0].Value;
      }
    } catch (error) {
      console.error(error);
    }
  }
  // console.log(JSON.stringify(finalResponse));
  console.log(JSON.stringify(final))
}

fetchData();
