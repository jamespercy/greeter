var fs = require('fs');
var props = {};
fs.readFile('./etc/app.properties', 'utf-8', function(err, data) {
	props = JSON.parse(data.toString());
});

var express = require('express');
var app = express();
app.get('/', function(req, res) {
  res.send('hi, my name is ' + props.name);
});

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Server started at http://%s:%s', host, port);

});