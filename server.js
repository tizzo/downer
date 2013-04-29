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
  var title = req.params.title;
  res.render('index', {title: title});
});

var shoeHandler = reloader(function (stream) {
  // We create a new instance of MuxDemux() for each connection.
  var mdm = MuxDemux();
  mdm.on('connection', function (_stream) {
    // On connection we inspect the meta attribute to determine which stream
    // we are dealing with on the multiplexed connection.  We then looking the
    // appropriate stream to connect to and pipe it into the stream.
    _stream.pipe(getRtext(_stream.meta).createStream()).pipe(_stream)
  })
  // Wire our muxer/demuxer into the browser
  stream.pipe(mdm).pipe(stream);
});

var server = app.listen(PORT, function () {
  console.log( 'listening on', PORT)
})
shoe(shoeHandler).install(server, '/shoe');
