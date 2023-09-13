const axios = require('axios');

var params = {
    "VIARE_CLICK_COLLECT_URL":"https://dusk.staging.viare.io/api/availability/store/"
};

var storesArray = [100,102,103,109];
var skuArray = [502062092];
var skuArrayLength = skuArray.length;
//50209484, 50123063,50210244,50121564,50209484

var main_result = {}

async function clickAndCollect(params, skuArray, storesArray) {
    var finalResponse = {};
    var lines = [];
    var storeIds = storesArray.join(',');
    var skuArrayLength = skuArray.length;
    lines.push(413)
    const requests = skuArray.map( (sku) => 
          axios.get(params.VIARE_CLICK_COLLECT_URL+sku+"?stores="+storeIds)
        //params.VIARE_CLICK_COLLECT_URL
      );
      lines.push(418)
      //https://dusk.viare.io/api/availability/store/50209484?stores=100
      try {
        lines.push(421)
        const response = await Promise.all(requests);
        lines.push(423)
  
        var tempArr=[];
        var k=0;
        lines.push(427)
        response.map((item) => {
            var i=0;
            while(i<skuArrayLength) {
                lines.push(431)
                var branchVal =item.data[i].Branch;
                var actualVal =item.data[i].Barcodes[0].Value;
                tempArr[i] = {"Branch": branchVal,"qty":actualVal};
                i++;
            }
            if(skuArrayLength == i){
                lines.push(438)
                var sku = skuArray[k];
                finalResponse[sku] = tempArr;
                k++;
            }
           });    
           lines.push(444)        
      } 
      catch (error) {
        finalResponse = error.message
        lines.push(448)
      }

      return {'response': finalResponse, 'lines': lines};
}


  async function main(){
    let startTime = new Date();
    var result = await clickAndCollect(params, skuArray, storesArray);
    let endTime = new Date();
    console.log(JSON.stringify(result));
    console.log("Total resposne time: "+ (endTime - startTime));
}
main();

//   await Promise.all(promises);

// async function clickAndCollect(params, skuArray, storesArray) {
//     const finalResponse = {};
//     const storeIds = storesArray.join(',');
  
//     const axiosInstances = skuArray.map((sku) => {
//       const config = {
//         method: 'get',
//         url: `${params.VIARE_CLICK_COLLECT_URL}${sku}?stores=${storeIds}`,
//       };
      
//       return axios(config); // Create an axios instance for each request
//     });
  
//     try {
//       const responses = await axios.all(axiosInstances); // Execute all requests concurrently
  
//       responses.forEach((response, index) => {
//         const sku = skuArray[index];
  
//         if (response.status === 200) {
//           const tempArr = response.data.map((item) => ({
//             Branch: item.Branch,
//             qty: item.Barcodes[0].Value,
//           }));
//           finalResponse[sku] = tempArr;
//         } else {
//           finalResponse[sku] = { error: `Request for SKU ${sku} failed with status ${response.status}` };
//         }
//       });
//     } catch (error) {
//       // Handle errors that occurred while making concurrent requests
//       console.error('Error making concurrent requests:', error);
//     }
  
//     return finalResponse;
//   }

// async function clickAndCollect(params, skuArray, storesArray) {
//   let finalResponse = {};
//   const storeIds = storesArray.join(',');
//   //create a new array called promises.
//   const promises = skuArray.map( (sku) => 
//     axios.get(params.VIARE_CLICK_COLLECT_URL+sku+"?stores="+storeIds)
//     );
//     //https://dusk.viare.io/api/availability/store/50209484?stores=100

//     try {
//       const response = await Promise.all(promises);

//       if (response.status === 200) {
//         const tempArr = response.data.map( (item) => ({
//           Branch: item.Branch,
//           qty: item.Barcodes[0].Value,
//         }));
//         finalResponse[sku] = tempArr;
//       }
//     } catch (error) {
//       finalResponse[sku] = { error: error.message };
//     }
//     return finalResponse;
//   }

//   await Promise.all(promises);


//  Implemented through promises
// async function clickAndCollect(params, skuArray, storesArray) {
//     const finalResponse = {};
//     const storeIds = storesArray.join(',');
//     //create a new array called promises.
//     const promises = skuArray.map( async(sku) => {
//       const config = {
//         method: 'get',
//         url: `${params.VIARE_CLICK_COLLECT_URL}${sku}?stores=${storeIds}`,
//       };
  
//       try {
//         const response = await axios(config);
  
//         if (response.status === 200) {
//           const tempArr = response.data.map( (item) => ({
//             Branch: item.Branch,
//             qty: item.Barcodes[0].Value,
//           }));
//           finalResponse[sku] = tempArr;
//         }
//       } catch (error) {
//         finalResponse[sku] = { error: error.message };
//       }
//     });
  


// const { fork } = require('child_process');
// const axios = require('axios');

// async function clickAndCollect(params, skuArray, storesArray) {
//   const finalResponse = {};
//   const storeIds = storesArray.join(',');

//   const promises = skuArray.map((sku) => {
//     return new Promise((resolve, reject) => {
//       const childProcess = fork(__filename, [], { detached: true });
      
//       childProcess.on('message', (message) => {
//         if (message.sku === sku) {
//           finalResponse[sku] = message.data;
//           childProcess.kill();
//           resolve();
//         }
//       });

//       childProcess.on('error', (error) => {
//         reject(error);
//       });

//       childProcess.send({ sku, params, storeIds });
//     });
//   });

//   await Promise.all(promises);
//   return finalResponse;
// }

// // Main thread
// if (!module.parent) {
//   process.on('message', async (message) => {
//     const { sku, params, storeIds } = message;

//     const config = {
//       method: 'get',
//       url: `${params.VIARE_CLICK_COLLECT_URL}${sku}?stores=${storeIds}`,
//     };

//     try {
//       const response = await axios(config);

//       if (response.status === 200) {
//         const tempArr = [];
//         for (let k = 0; k < response.data.length; k++) {
//           const branchVal = response.data[k].Branch;
//           const actualVal = response.data[k].Barcodes[0].Value;
//           tempArr.push({ "Branch": branchVal, "qty": actualVal });
//         }
//         process.send({ sku, data: tempArr });
//       }
//     } catch (error) {
//       process.send({ sku, data: { "error": error.message } });
//     }
//   });
// }
