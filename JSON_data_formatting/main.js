// main.js
const child_proc = require("child_process");

console.log("running main.js");
const sub = child_proc.fork("./sub.js");

// sending message to subprocess
sub.send({ from: "parent" });

// listening to message from subprocess
sub.on("message", (message) => {
  console.log("PARENT got message from " + message.from);
  sub.disconnect();
});