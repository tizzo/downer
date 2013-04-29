// We use the mux-demux-shoe to to support multiple channels.
var shoe     = require('shoe');
var ecstatic = require('ecstatic');
var join     = require('path').join;
var reloader = require('client-reloader');
var hbs      = require('hbs');
var REdit    = require('r-edit');
var MuxDemux = require('mux-demux');

var express = require('express');
var app = express();

var openPages = {};

var PORT = process.env.PORT || 3000;

function getRtext(name) {
  if (!openPages[name]) {
    openPages[name] = REdit();
    openPages[name].push('# ' + name);
  }
  return openPages[name];
}

app.use(app.router);
app.use(ecstatic(join(__dirname, 'static')));
app.set('view engine', 'hbs');

app.get('/pages/:title', function(req, res) {
  // res.writeHead(200);
  var title = req.params.title;
  // getRtext(title);
  console.log(title);
  res.render('index', {title: title});
});

var shoeHandler = reloader(function (stream) {
  stream.on('connection', function() {
    console.log('pancakebatter')
  });
  stream.pipe(getRtext('foo').createStream()).pipe(stream)
  // stream.pipe(MuxDemux(function (_stream) {
  //   console.log(_stream);
  //   // stream.pipe(getRtext().createStream()).pipe(stream)
  // }));
});

var server = app.listen(PORT, function () {
  console.log( 'listening on', PORT)
})
shoe(shoeHandler).install(server, '/shoe');
