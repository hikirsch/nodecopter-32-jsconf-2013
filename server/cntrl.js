function smoothSpeed(should, is) { // calculates the speed based on the diff of should and is
	var diff = Math.abs(should - is); // diff is [0;N]
	var speed = 1.1 * (Math.exp(2 * diff) - 1);
	return Math.min(speed, 1);
}

function adjustHeightIfNeeded(client, should, is) {
	if (is < should) {
//		console.log("go up a little");
		client.up(smoothSpeed(should, is));
	} else if (is > should) {
		// go down a little
		client.down(smoothSpeed(should, is));
	} else {
		// stop moving up or down
		client.up(0);
		client.down(0);
	}
}

var upCallback;
function up(client, meters) {
	if (upCallback) {
		client.removeListener("navdata", upCallback);
	}
	if (meters > 0) {
		upCallback = function(navdata) {
			// console.log(" we are on " + navdata.demo.altitudeMeters + " meters");
			adjustHeightIfNeeded(client, meters, navdata.demo.altitudeMeters);
		};
		console.log("should be up " + meters + " meters");
		client.on("navdata", upCallback);
	} else {
		// stop moving up or down
		client.up(0);
		client.down(0);
	}
}

function smoothTurn(should, is) { // calculates the speed based on the diff of should and is
	var diff = Math.abs(should - is); // diff is [0;360]
	var speed = 1.1 * (Math.exp(0.05 * diff) - 1);
	return Math.min(speed, 1);
}

function adjustTurnIfNeeded(client, should, is) {
	if (is < should) {
		// turn right a little
		client.clockwise(smoothTurn(should, is));
	} else if (is > should) {
		// turn left a little
		client.counterClockwise(smoothTurn(should, is));
	} else {
		// stop turning left or right
		client.clockwise(0);
		client.counterClockwise(0);
	}
}

var turnCallback;
function turn(client, degrees) {
	if (turnCallback) {
		client.removeListener("navdata", turnCallback);
	}
	if (degrees >= -180 && degrees <= 180) {
		turnCallback = function(navdata) {
			// console.log(" we are at " + navdata.demo.clockwiseDegrees + " degrees");
			adjustTurnIfNeeded(client, degrees, navdata.demo.clockwiseDegrees);
		};
		console.log("should be turn " + degrees + " degrees");
		client.on("navdata", turnCallback);
	} else {
		// stop turning left or right
		client.clockwise(0);
		client.counterClockwise(0);
	}
}

function emergency(client) {
	client.removeAllListeners("navdata");
	client.stop();
	client.land(function() {
		console.log("down");
		process.exit();
	});
}

exports.turn = turn;
exports.up = up;
exports.emergency = emergency;
