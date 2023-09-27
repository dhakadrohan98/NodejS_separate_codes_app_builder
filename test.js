var obj = {};
obj["rmaDataObject"] = {};
obj["rmaDataObject"]["entity_id"] = "2";
obj["rmaDataObject"]["increment_id"] = "00000115";
console.log(obj);
console.log("*********");
obj.rmaDataObject.entity_id = "4"
console.log(obj);

var itemArray = [];
itemArray.push({"key1":"val1"});
itemArray.push({"key2":"val2"});
console.log(itemArray);

var num = "2043-09-06";
// Convert it to a string
var dateString = num.toString();
// Extract year, month, and day parts
var year = dateString.substring(0, 4);
var month = dateString.substring(5, 7);
var day = dateString.substring(8, 10);
// Create the formatted date string
var cardExpDate = month + '-' + day + '-' + year;

console.log(cardExpDate)