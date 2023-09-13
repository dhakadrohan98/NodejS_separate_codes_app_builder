// sub.js
console.log("sub.js is running");

setTimeout(() => {
  // subprocess sending message to parent
  process.send({ from: "client" });
}, 2000);

// subprocess listening to message from parent
process.on("message", (message) => {
  console.log("SUBPROCESS got message from " + message.from);
});




// // Given numeric date
// var num = 20050611;

// // Convert it to a string
// var dateString = num.toString();

// // Extract year, month, and day parts
// var year = dateString.substring(0, 4);
// var month = dateString.substring(4, 6);
// var day = dateString.substring(6, 8);

// // Create the formatted date string
// var formattedDate = year + '-' + month + '-' + day;

// console.log(formattedDate); // Output: "2005-06-11"
