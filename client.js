
var RText     = require('r-edit');
var reconnect = require('reconnect');
var reloader  = require('client-reloader');
var widget    = require('r-edit/widget');
var marked    = require('marked');
var MuxDemux = require("mux-demux");

/*
var shoe = require("mux-demux-shoe")
    , mdm = shoe("/shoe")
*/

var rText = RTEXT = RText()

reconnect(reloader(function (stream) {
  var mx = MuxDemux();
  console.log(title);
  stream.pipe(rText.createStream()).pipe(stream);
})).connect('/shoe/');

//using the default template...
textArea = rText.widget()
$('#text').append(textArea);
$textArea = $('#text textarea');
var updateMarkdown = function() {
  $('#markdown').html(marked($textArea.val()));
};
// $textArea.on('change', updateMarkdown);
setInterval(updateMarkdown, 10);
$('#markdown').html(marked($textArea.val()));
// $('#markdown').append(widget(rText));
