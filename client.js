
var RText     = require('r-edit');
var reconnect = require('reconnect');
var reloader  = require('client-reloader');
var widget    = require('r-edit/widget');
var marked    = require('marked');
var MuxDemux = require("mux-demux");


var rText = RTEXT = RText()
// Using the default widget.
var $textArea = $(rText.widget());
var $markdown = $('#markdown');
var $textWrapper = $('#text-wrapper');
var $markdownWrapper = $('#markdown-wrapper');
var $text = $('#text');
var $markdown = $('#markdown');

// `reconnect()` and `reloader()` reconnect the stream in the event
// of an interruption (network or otherwise).
reconnect(reloader(function (stream) {

  // We create a new instance of MuxDemux() for each connection.
  var mdm = MuxDemux()

  // Ensure we don't miss messages while we get setup.
  mdm.pause();

  // We create the read/write stream to interface with rText().
  var rtStream = rText.createStream();
  $text.append($textArea);

  // We connect our shoe stream directly our muxer/demuxer.
  // This allows the muxer to encode anything written to any virtual connection
  // multiplexed through the one stream and the demuxer to decode anything coming
  // back from the server.
  stream.pipe(mdm).pipe(stream);

  // Create an individual channel on the main read/write stream.
  var mxdTitleStream = mdm.createStream(title)
  mxdTitleStream.on('data', updateMarkdown);

  // Ensure we don't miss messages while we get setup.
  mdm.resume();

  // Pipe anything sent on this channel into the rtext stream and pipe anything
  // coming back from that stream back across the virtual connection.
  mxdTitleStream.pipe(rtStream).pipe(mxdTitleStream)

})).connect('/shoe/');

function updateMarkdown() {
  $markdown.html(marked(rText.text()));
};

var $buttons = $('.buttons');
var $page = $('#page');

var $markdownButton = $('#markdown-button', $buttons);
var $splitButton = $('#split-button', $buttons);
var $textButton = $('#text-button', $buttons);

function setActive(item) {
  $markdownButton.removeClass('selected');
  $textButton.removeClass('selected');
  $splitButton.removeClass('selected');
  $(item).addClass('selected');
}

$markdownButton.click(function() {
  setActive(this);
  $textWrapper.hide();
  $markdownWrapper
    .show()
    .removeClass('span6')
    .addClass('span12');
});
$splitButton.click(function() {
  setActive(this);
  $markdownWrapper
    .show()
    .removeClass('span12')
    .addClass('span6');
  $textWrapper
    .show()
    .removeClass('span12')
    .addClass('span6');
});
$textButton.click(function() {
  setActive(this);
  $markdownWrapper.hide();
  $textWrapper
    .show()
    .removeClass('span6')
    .addClass('span12');
});