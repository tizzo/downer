// We use the mux-demux-shoe to to support multiple channels.
var shoe     = require('shoe');
var ecstatic = require('ecstatic');
var join     = require('path').join;
var reloader = require('client-reloader');
var hbs      = require('hbs');
var REdit    = require('r-edit');
var MuxDemux = require('mux-demux');
var Redis    = require('redis');

var express = require('express');
var app = express();

var openPages = {};

var conf = {};
conf.port = process.env.PORT || 3000;
conf.testing = process.env.TESTING || false;
conf.redis = {};
conf.redis.host = process.env.REDIS_HOST|| '127.0.0.1';
conf.redis.port = process.env.REDIS_PORT || 6379;
conf.redis.db = process.env.REDIS_DB || 0;
conf.testing = process.env.TESTING || false;


if (conf.testing) {
  Redis = require('fakeredis');
}
var redisClient = Redis.createClient(conf.redis.port, conf.redis.host);

if (!conf.testing) {
  redisClient.select(conf.redis.db);
}


function getRtext(uri, next) {
  if (!openPages[uri]) {
    openPages[uri] = REdit();
    redisClient.get('pages:' + uri, function(error, contents) {
      if (contents == null) {
        openPages[uri].push('# ' + uri);
      }
      else {
        openPages[uri].push(contents);
      }
      next(null, openPages[uri]);
    });
  }
  else {
    next(null, openPages[uri]);
  }
}

app.use(app.router);
app.use(ecstatic(join(__dirname, 'static')));
app.set('view engine', 'hbs');

app.get('/pages/:title', function(req, res) {
  var title = req.params.title;
  res.render('page', {title: title});
});

var shoeHandler = reloader(function (stream) {
  // We create a new instance of MuxDemux() for each connection.
  var mdm = MuxDemux();
  mdm.on('connection', function (_stream) {
    // On connection we inspect the meta attribute to determine which stream
    // we are dealing with on the multiplexed connection.  We then looking the
    // appropriate stream to connect to and pipe it into the stream.
    getRtext(_stream.meta, function(error, rText) {
      rtStream = rText.createStream();
      _stream.pipe(rtStream).pipe(_stream)
      rtStream.on('data', function() {
        redisClient.set('pages:' + _stream.meta, rText.text());
      });
    });
  })
  // Wire our muxer/demuxer into the browser
  stream.pipe(mdm).pipe(stream);
});

var server = app.listen(conf.port, function () {
  console.log( 'listening on', conf.port)
})
shoe(shoeHandler).install(server, '/shoe');
