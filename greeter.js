var fs = require('fs');
var log = require('winston');
var express = require('express');
var request = require('request');

//configure logging
log.level = 'info';
log.add(log.transports.File, { filename: './logs/greeter.log' });
log.remove(log.transports.Console);

var app = express();

var props = {};
fs.readFile('./etc/app.properties', 'utf-8', function(err, data) {
	props = JSON.parse(data.toString());
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
			log.info('got a response \'' + body + '\'', {id : id});
		}
	}

	function requestAGreeting(count, props, id) {
		log.info(props.name + ' is calling ', {id : id, count: count});
		request('http://' + props.host + ':' + encodeURI(props.port + '/?caller=' + props.name + '&count=' + count + '&id=' + id),
			handleResponse);
	}

	res.send('hi, my name is ' + props.name);

	var caller = (req.query.caller) ? req.query.caller : 'a stranger';
	if (caller !== props.name) {
		log.info(props.name + ' said hi to ' + caller, {id : id});
	} else {
		log.info(props.name + ' is talking to it\'s self', {id : id});
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
}
