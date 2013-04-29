
var RText     = require('r-edit');
var reconnect = require('reconnect');
var reloader  = require('client-reloader');
var widget    = require('r-edit/widget');
var marked    = require('marked');
var MuxDemux = require("mux-demux");


var rText = RTEXT = RText()


// `reconnect()` and `reloader()` reconnect the stream in the event
// of an interruption (network or otherwise).
reconnect(reloader(function (stream) {

  // We create a new instance of MuxDemux() for each connection.
  var mdm = MuxDemux()

  // We create the read/write stream to interface with rText().
  var rtStream = rText.createStream();
  rtStream.on('data', updateMarkdown);

  // We connect our shoe stream directly our muxer/demuxer.
  // This allows the muxer to encode anything written to any virtual connection
  // multiplexed through the one stream and the demuxer to decode anything coming
  // back from the server.
  stream.pipe(mdm).pipe(stream);

  // Create an individual channel on the main read/write stream.
  var mxdTitleStream = mdm.createStream(title)

  // Pipe anything sent on this channel into the rtext stream and pipe anything
  // coming back from that stream back across the virtual connection.
  mxdTitleStream.pipe(rtStream).pipe(mxdTitleStream)

})).connect('/shoe/');

  // Using the default widget.
  var $textArea = null;
  var $markdown = null;

$(document).ready(function() {
  // Using the default widget.
  $textArea = $(rText.widget());
  $markdown = $('#markdown');

  $('#text').append($textArea);

  // TODO: find a way to make this evented.
  // Run an initial render after the text area has time to populate.
  setTimeout(updateMarkdown, 250);
});

function updateMarkdown() {
  $markdown.html(marked($textArea.val()));
};