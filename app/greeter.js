var fs = require('fs');
var winston = require('winston');
var winston_es = require( 'winston-elasticsearch');
var express = require('express');
var elastical = require( 'elastical' );
var request = require('request');

var es = {host: '192.168.132.128', port : 9200};

//configure logging
var log = new winston.Logger({ 
  transports: [ new (winston.transports.File)({ filename: './logs/greeter.log' }),
		new winston_es({ 
		  level: 'info', 
		  client: new elastical.Client( es.host, { port: es.port }),
		  fireAndForget: true
		}) ]
});

log.level = 'info';

// log.info(JSON.stringify(process.env));

var app = express();

var props = {};
fs.readFile('./etc/app.properties', 'utf-8', function(err, data) {
	props = JSON.parse(data.toString());
	if (process.env.HOSTNAME) {
		props.name = process.env.HOSTNAME;
	}
	createServer();
});

function assignId(requestId) {
	return (requestId === undefined) ? '' + new Date().getTime() : requestId;
}

app.get('/', function(req, res) {
	var id = assignId(req.query.id);

	function handleResponse(err, response, body) {
		if (err) {
			log.error(JSON.stringify(err));
			return;
		}
		if (response.statusCode == 200) {
			log.info('got a response \'' + body + '\'', {id : id, name: props.name});
		}
	}

	function requestAGreeting(count, props, id) {
		log.info(props.name + ' is calling ', {id : id, count: count, name: props.name});
		request('http://' + props.host + ':' + encodeURI(props.port + '/?caller=' + props.name + '&count=' + count + '&id=' + id),
			handleResponse);
	}

	res.send('hi, my name is ' + props.name);

	var caller = (req.query.caller) ? req.query.caller : 'a stranger';
	if (caller !== props.name) {
		log.info(props.name + ' said hi to ' + caller, {id : id, name: props.name});
	} else {
		log.info(props.name + ' is talking to it\'s self', {id : id, name: props.name});
	}
	
		//pass it on
	var count = (req.query.count) ? +req.query.count + 1 : 1;
	if (count <= 10) {

		requestAGreeting(count, props, id);
	}

});


function createServer() {
	var server = app.listen(3000, function () {
	  var host = server.address().address;
	  var port = server.address().port;
	  log.info(props.name + '\'s server started at http://%s:%s', host, port);
	});

	//check if elastic search is available
	request('http://' + es.host + ':' + es.port,
			function(err, response, body) {
				if (err || response.statusCode != 200) {
					log.warn('could not access elastcsearch at ' + es.host + ':' + es.port);
				} else 
				log.info('logging to elastcsearch at ' + es.host + ':' + es.port);
			});
}

