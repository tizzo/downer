var shoe     = require('shoe');
var ecstatic = require('ecstatic');
var join     = require('path').join;
var reloader = require('client-reloader');

var express = require('express');
var app = express();

var rText = require('r-edit')();
rText.push('open in multiple tabs and start editing!');

var PORT = process.env.PORT || 3000;

app.get('/pages/:title', function(req, res) {
  res.writeHead(200);
  console.log(req.params.something);
  res.end('loaded');
});

app.use(app.router);
app.use(ecstatic(join(__dirname, 'static')));

var shoeHandler = reloader(function (stream) {
  stream.pipe(rText.createStream()).pipe(stream)
  // console.log(rText.text());
  // log the current text each time data comes through.
  stream.on('data', function() {console.log(rText.text())});
});

var server = app.listen(PORT, function () {
  console.log( 'listening on', PORT)
})
shoe(shoeHandler).install(server, '/shoe');
