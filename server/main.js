var app = {};

var arDrone = require( 'ar-drone' );
var io = require( 'socket.io' ).listen( 8888 );
var http = require( "http" );
var cntrl = require( './cntrl' );
var fs = require( 'fs' );
var detect = require( './lib/detect' );
var control = require( './lib/control' );

app.kill = false;
app.showedBatteryLevel = false;
app.lastImage = null;
app.lastBattery = null;


app.stopDrone = function( callback ) {
	app.client.removeAllListeners( "navdata" );
	app.client.stop();
	app.client.land( callback );
};

app.init = function() {
	app.createDrone();
	app.initWebSocket();

	var server = http.createServer( function( req, res ) {
		if( !app.lastImage ) {
			res.writeHead( 503 );
			res.end( 'Did not receive any png data yet.' );
			return;
		}

		res.writeHead( 200, {'Content-Type': 'image/png'} );
		res.end( app.lastImage );
	} );

	server.listen( 8080, function() {
		console.log( 'Serving latest png on port 8080 ...' );
	} );
};

process.on( "SIGINT", function() {
	if( app.kill ) {
		process.exit();
	}

	app.kill = true;
	app.stopDrone( function() {
		process.exit();
	} );
} );


app.initWebSocket = function() {
	io.sockets.on( 'connection', function( socket ) {
		app.newConnection = true;

		app.socket = socket;

		app.initSocketEvents( socket );

		app.log( "Socket Connected" );
	} );
};

app.createDrone = function() {
	app.client = arDrone.createClient( {
		timeout: 1000
	} );

    cntrl.watch(app.client);

	app.client.config( 'video:video_channel', 3 );

	app.client.on( 'navdata', function( data ) {
		if( app.newConnection ) {
			app.showedBatteryLevel = false;
			app.lastBattery = null;
		}

		if( !data.demo ) {
			return;
		}

		if( !app.showedBatteryLevel ) {
			if( data.demo.batteryPercentage < 30 ) {
				console.log( "LOW BATTERY WARNING!" );
			}

			console.log( "BATTERY LEVEL AT: " + data.demo.batteryPercentage );
		}

		if( app.socket && app.lastBattery != data.demo.batteryPercentage ) {
			app.socket.emit( 'battery-update', {
				batteryStatus: data.demo.batteryPercentage
			} );

			app.lastBattery = data.demo.batteryPercentage;
		}

		app.showedBatteryLevel = true;
		app.newConnection = false;
	} );

	var stream = app.client.getPngStream();

	stream.on( 'error', function( data ) {
		console.log( "ERROR!!!!: ", data );
	} );

	stream.on( 'data', function( data ) {
		app.lastImage = data;

		if( app.socket ) {
			app.socket.emit( 'picture-response' );
		}

		fs.writeFile( 'image.png', app.lastImage, function( err ) {
			if( err ) throw err;

			detect(function(angle, centroidX) {
                controlInput = control(angle, centroidX);

                console.log(angle, centroidX, controlInput[0], controlInput[1]);

                cntrl.turn(app.client, cntrl.getTurn() + (controlInput[0] * 180 / Math.PI), function() {
                    cntrl.go(app.client, controlInput[1]);
                });
            });

		} );


	} );

	app.log( "drone created" );

	//	app.client
	//		.after( 5000, function() {
	//			this.clockwise( 0.5 );
	//		} )
	//		.after( 3000, function() {
	//			this.stop();
	//			this.land();
	//		} );
};

app.commands = {
	"takeoff": function() {
		app.client.takeoff();
	},

	"up": function() {
		cntrl.up( app.client, 2 );
	},

	"down": function() {
		cntrl.up( app.client, 1 );
	},

	"land": function() {
		app.client.land();
	},

	"flip": function() {
		app.client.animate( 'flipAhead', 1000 );
	},

	"picture": function() {
		app.socket.emit( 'picture-response', app.lastImage );
	}
};

app.initSocketEvents = function( socket ) {
	app.log( "initSocketEvents()" );

	socket.on( 'copter-action', function( data ) {
		console.log( "GOT A COPTER ACTION: " + data.command );

		if( data.command in app.commands ) {
			app.commands[ data.command ]();
		}

		app.client.emit( 'status', { 'message': "Did Command: " + data.command } );
	} );

	socket.on( 'land', function() {
		app.client.land();
	} );

	socket.on( 'my other event', function( data ) {
		console.log( data );
	} );

};

app.log = function( message ) {
	if( app.socket ) {
		app.socket.emit( 'status', { 'message': message } );
	} else {
		console.log( message );
	}
};

app.init();
