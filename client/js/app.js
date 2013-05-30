var app = {};

app._counter = 0;

app.init = function() {
	app.startListening();
	app.initEvents();
	app.refreshCamera();
};

app.startListening = function() {
	app.socket = io.connect( 'http://localhost:8888' );
	app.socket.on( 'status', function( data ) {
		app.log( "STATUS: " + data.message, true );
	} );

	app.socket.on( 'picture-response', function( data ) {
		console.log( "onImageData" );
		console.log( data );
	} );
};

app.refreshCamera = function() {
	var image = $( "<img />" ).attr( 'src', 'http://localhost:8080' );
	$( "#cameraWrapper" )
		.empty()
		.append( image );

	console.log("refreshing camera");

	setTimeout( function() {
		app.refreshCamera();
	}, 2000 );
};

app.initEvents = function() {
	$( "#app-takeoff" ).on( 'click', app.takeoff );
	$( "#app-land" ).on( 'click', app.land );
	$( "#app-flip" ).on( 'click', app.flip );
	$( "#app-picture" ).on( 'click', app.picture );
};

app.flip = function() {
	app.log( "Flipping" );
	app.socket.emit( 'copter-action', { command: "flip" } );
};

app.picture = function() {
	app.log( "Taking A Picture" );
	app.socket.emit( 'copter-action', { command: "picture" } );
};

app.land = function() {
	app.log( "Land" );
	app.socket.emit( 'copter-action', { command: "land" } );
};

app.takeoff = function() {
	app.log( "Taking Off" );
	app.socket.emit( 'copter-action', { command: "takeoff" } );
};

app.log = function( str, fromServer ) {
	var ele = document.getElementById( "debug" );

	app._counter++;
	if( fromServer ) {
		ele.innerHTML += "<strong>" + app._counter + ": " + str + "</strong><br />";
	} else {
		ele.innerHTML += app._counter + ": " + str + "<br />";
	}
};

app.init();
