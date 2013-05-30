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
		if (navdata.demo.batteryPercentage < 20) {
			console.log("I am running out of battery!");
		}
	} else {
		console.log(navdata);
	}
});

console.log("I am taking off now");
client.takeoff(function() {
	console.log("action happens now :)");
	cntrl.up(client, 1.0);
	cntrl.turn(client, 50.0);
	setTimeout(function() {
		cntrl.turn(client, -70.0);
	}, 10000);
});
