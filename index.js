var arDrone = require("ar-drone");
var client  = arDrone.createClient();
var cntrl = require("server/cntrl");

var kill = false;
process.on("SIGINT", function() {
	if (kill) {
		process.exit();
	} else {
		kill = true;
		console.log("I am goind down now");
		cntrl.emergency(client);
	}
});
process.on("uncaughtException", function(err) {
	console.log("Caught exception: " + err, err);
	cntrl.emergency(client);
});

client.on("navdata", function(navdata) {
	if (navdata.demo) {
		if (navdata.demo.batteryPercentage < 10) {
			console.log("I am running out of battery!");
			cntrl.emergency(client);
		}
	} else {
		console.log(navdata);
	}
});

console.log("I am taking off now");
client.takeoff(function() {
	console.log("calibration happens now...")
	//client.calibrate(0);
	//setTimeout(function() {
		console.log("action happens now :)");
		cntrl.go(client, 0.5, function() {
			cntrl.emergency(client);
		});
	//}, 5000);
});
