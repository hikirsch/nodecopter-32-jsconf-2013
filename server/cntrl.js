function smoothSpeed(should, is) { // calculates the speed based on the diff of should and is
	var diff = Math.abs(should - is); // diff is [0;N]
	var speed = 1.1 * (Math.exp(2 * diff) - 1);
	return Math.min(speed, 1);
}

function adjustHeightIfNeeded(client, should, is) {
	if (is < should && Math.abs(is-should) > 0.05) {
		// go up a little
		client.up(smoothSpeed(should, is));
	} else if (is > should && Math.abs(is-should) > 0.05) {
		// go down a little
		client.down(smoothSpeed(should, is));
	} else {
		// stop moving up or down
		client.up(0);
		client.down(0);
		return true;
	}
	return false;
}

var upCallback;
/**
 * @param clint Client
 * @params meters (should be > 0.3 otherwise stop controlling it)
 * @param cb Callback if we finished uping (optional)
 **/
function up(client, meters, cb) {
	if (upCallback) {
		client.removeListener("navdata", upCallback);
	}
	if (meters > 0.3) {
		upCallback = function(navdata) {
			// console.log(" we are on " + navdata.demo.altitudeMeters + " meters");
			var reached = adjustHeightIfNeeded(client, meters, navdata.demo.altitudeMeters);
			if (reached === true && cb && cb.fired !== true) {
				cb();
				cb.fired = true;
			}
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
	if (is < should && Math.abs(is-should) > 1.0) {
		// turn right a little
		client.clockwise(smoothTurn(should, is));
	} else if (is > should && Math.abs(is-should) > 1.0) {
		// turn left a little
		client.counterClockwise(smoothTurn(should, is));
	} else {
		// stop turning left or right
		client.clockwise(0);
		client.counterClockwise(0);
		return true;
	}
	return false;
}

var turnCallback;
/**
 * @param clint Client
 * @params degrees (should be between -180 and 180 otherwise stop controlling it)
 * @param cb Callback if we finished turning (optional)
 **/
function turn(client, degrees, cb) {
	if (turnCallback) {
		client.removeListener("navdata", turnCallback);
	}
	if (degrees >= -180 && degrees <= 180) {
		turnCallback = function(navdata) {
			// console.log(" we are at " + navdata.demo.clockwiseDegrees + " degrees");
			var reached = adjustTurnIfNeeded(client, degrees, navdata.demo.clockwiseDegrees);
			if (reached === true && cb && cb.fired !== true) {
				cb();
				cb.fired = true;
			}
		};
		console.log("should be turn " + degrees + " degrees");
		client.on("navdata", turnCallback);
	} else {
		// stop turning left or right
		client.clockwise(0);
		client.counterClockwise(0);
	}
}

/**
 * @param client Client
 **/
function emergency(client) {
	client.removeAllListeners("navdata");
	client.stop();
	client.land(function() {
		console.log("down");
		process.exit();
	});
}

/**
 * @param client Client
 * @param meters Go meters forward (or backward if negative)
 * @param cb Callback if we finished going (optional)
 **/
function go(client, meters, cb) {
	var goTime = Math.abs(meters) * 500;
	if (meters > 0) {
		client.front(0.5);
	} else {
		client.back(0.5);
	}
	setTimeout(function() {
		client.front(0);
		client.back(0);
		if (cb && cb.fired !== true) {
			setTimeout(function() {
				cb();
			}, 1000);
			cb.fired = true;
		}
	}, goTime);
}

var watchedTurn, watchedBattery, watchedUp;

function getTurn() {
	return lastTurn;
}

function getBattery() {
	return watchedBattery;
}

function getUp() {
	return watchedUp;
}

function watch(client) {
	client.on("navdata", function(navdata) {
		if (navdata.demo) {
			watchedTurn = navdata.demo.clockwiseDegrees;
			watchedBattery = navdata.demo.batteryPercentage;
			watchedUp = navdata.demo.altitudeMeters;
			if (watchedBattery < 10) {
				console.log("I am running out of battery!");
				emergency(client);
			}
		} else {
			watchedTurn = undefined;
			watchedBattery = undefined;
			watchedUp = undefined;
		}
	});
}

exports.watch = watch;
exports.turn = turn;
exports.up = up;
exports.go = go;
exports.emergency = emergency;
exports.getTurn = getTurn;
exports.getBattery = getBattery;
exports.getUp = getUp;
