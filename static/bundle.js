;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){

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
// Mode should be one of 'markdown', 'split', or 'text'
function setMode(mode, element) {
  if (element) {
    setActive(element);
  }
  window.location.hash = mode;
  switch (mode) {
    case 'markdown':
      $textWrapper.hide();
      $markdownWrapper
        .show()
        .removeClass('span6')
        .addClass('span12');
      break;
    case 'split':
      $markdownWrapper
        .show()
        .removeClass('span12')
        .addClass('span6');
      $textWrapper
        .show()
        .removeClass('span12')
        .addClass('span6');
      break;
    case 'text':
      $markdownWrapper.hide();
      $textWrapper
        .show()
        .removeClass('span6')
        .addClass('span12');
      break;
  }
}
var mode = window.location.hash
if (mode && mode != '') {
  var mode = mode.substr(1);
  setMode(mode, $(window['$' + mode + 'Button']).get());
}
$markdownButton.click(function () { setMode('markdown', this); });
$splitButton.click(function () { setMode('split', this); });
$textButton.click(function () { setMode('text', this); });
},{"r-edit/widget":2,"client-reloader":3,"r-edit":4,"mux-demux":5,"marked":6,"reconnect":7}],2:[function(require,module,exports){

function trim (string) {
  return string.substring(1, string.length - 1)
}

function style (rx, tag) {
  return function (text) {
    var m = rx.exec(text)
    while (m) {
      text = text.replace(m[0], '<'+tag+'>'+trim(m[0])+'</'+tag+'>')
      m = rx.exec(text)
    }
    return text
  }
}

var italics = style(/_[^_]+_/, 'em')
var bold    = style(/\*[^\*]+\*/, 'strong')
var code    = style(/`[^`]+`/, 'code')

function prefix (rx, tag) {
  return function (val) {
    var m = rx.exec(val)
    if(m) {
      var l = m[0].length
      //oh yeah, escape chars...
      var t = 'function' === typeof tag ? tag(m) : tag
      return '<'+t+'>'+val.substring(l)+'</'+t+'>'
    }
    return val
  }
}

var header = prefix(/^#+/, function (m) { return 'H'+m[0].length })
var li = prefix(/^\s*-+/,  'li')

function styles (text) {
  return header(li(bold(italics(code(text)))))
}

function toHTML (val) {
  if('\n' === val)
    return '<br/>'
  return styles(val)
}

function defaultTemplate (val, key, el) {
  if(el)
    return el.innerHTML = toHTML(val), el
  var el = document.createElement('span')
  el.innerHTML = toHTML(val)
  return el
}

var widget = require('r-array/widget')

module.exports = function (rEdit, template) {
  return widget(rEdit, template || defaultTemplate)
}

},{"r-array/widget":8}],6:[function(require,module,exports){
(function(global){/**
 * marked - a markdown parser
 * Copyright (c) 2011-2013, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){3,} *\n*/,
  blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', /\n+(?=(?: *[-*_]){3,} *(?:\n+|$))/)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,}) *(\w+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!' + block.gfm.fences.source.replace('\\1', '\\2') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3]
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'list_start',
        ordered: isFinite(cap[2])
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      // Get bullet.
      if (this.options.smartLists) {
        bull = block.bullet.exec(cap[0])[0];
      }

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i+1])[0];
          if (bull !== b && !(bull[1] === '.' && b[1] === '.')) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item[item.length-1] === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: cap[1] === 'pre',
        text: cap[0]
      });
      continue;
    }

    // def
    if (top && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1][cap[1].length-1] === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([^\s]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1][6] === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // url (gfm)
    if (cap = this.rules.url.exec(src)) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0][0];
        src = cap[0].substring(1) + src;
        continue;
      }
      out += this.outputLink(cap, link);
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<strong>'
        + this.output(cap[2] || cap[1])
        + '</strong>';
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<em>'
        + this.output(cap[2] || cap[1])
        + '</em>';
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<code>'
        + escape(cap[2], true)
        + '</code>';
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<br>';
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<del>'
        + this.output(cap[1])
        + '</del>';
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(cap[0]);
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  if (cap[0][0] !== '!') {
    return '<a href="'
      + escape(link.href)
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>'
      + this.output(cap[1])
      + '</a>';
  } else {
    return '<img src="'
      + escape(link.href)
      + '" alt="'
      + escape(cap[1])
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>';
  }
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options) {
  var parser = new Parser(options);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length-1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return '<hr>\n';
    }
    case 'heading': {
      return '<h'
        + this.token.depth
        + '>'
        + this.inline.output(this.token.text)
        + '</h'
        + this.token.depth
        + '>\n';
    }
    case 'code': {
      if (this.options.highlight) {
        var code = this.options.highlight(this.token.text, this.token.lang);
        if (code != null && code !== this.token.text) {
          this.token.escaped = true;
          this.token.text = code;
        }
      }

      if (!this.token.escaped) {
        this.token.text = escape(this.token.text, true);
      }

      return '<pre><code'
        + (this.token.lang
        ? ' class="'
        + this.options.langPrefix
        + this.token.lang
        + '"'
        : '')
        + '>'
        + this.token.text
        + '</code></pre>\n';
    }
    case 'table': {
      var body = ''
        , heading
        , i
        , row
        , cell
        , j;

      // header
      body += '<thead>\n<tr>\n';
      for (i = 0; i < this.token.header.length; i++) {
        heading = this.inline.output(this.token.header[i]);
        body += this.token.align[i]
          ? '<th align="' + this.token.align[i] + '">' + heading + '</th>\n'
          : '<th>' + heading + '</th>\n';
      }
      body += '</tr>\n</thead>\n';

      // body
      body += '<tbody>\n'
      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];
        body += '<tr>\n';
        for (j = 0; j < row.length; j++) {
          cell = this.inline.output(row[j]);
          body += this.token.align[j]
            ? '<td align="' + this.token.align[j] + '">' + cell + '</td>\n'
            : '<td>' + cell + '</td>\n';
        }
        body += '</tr>\n';
      }
      body += '</tbody>\n';

      return '<table>\n'
        + body
        + '</table>\n';
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return '<blockquote>\n'
        + body
        + '</blockquote>\n';
    }
    case 'list_start': {
      var type = this.token.ordered ? 'ol' : 'ul'
        , body = '';

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return '<'
        + type
        + '>\n'
        + body
        + '</'
        + type
        + '>\n';
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'html': {
      return !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
    }
    case 'paragraph': {
      return '<p>'
        + this.inline.output(this.token.text)
        + '</p>\n';
    }
    case 'text': {
      return '<p>'
        + this.parseText()
        + '</p>\n';
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}

/**
 * Marked
 */

function marked(src, opt) {
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-'
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

})(window)
},{}],9:[function(require,module,exports){
var events = require('events');

exports.isArray = isArray;
exports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};
exports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};


exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

},{"events":10}],8:[function(require,module,exports){

module.exports = function (rarry, template) {

  var root = document.createElement('div')
  template = template || function (val, key, el) {
    function pre (val) { return '<pre>'+JSON.stringify(val)+'</pre>' }
    if(el)
      return el.innerHTML = pre(val), el
    var el = document.createElement('span')
    el.innerHTML = pre(val)
    return el
  }

  console.log(template)

  var elements = {}

  rarry.on('update', function (change) {
    for(var id in change)
      update(id, change[id])
  })

  function update (key, change) {
    var el
    if(el = elements[key]) {
      if(change == null) {
        return root.removeChild(el)
      }

      var _el = template.call(el, change, key, el)
      if(_el != el) {
        elements[key] = _el
        div.replaceChild(_el, el)
      }
      //else, template updated el.
      return
    }
    el = template.call(null, change, key)
      console.log(el)
    //var rarry.indexOf(id)
    //insert before the element that is already there...
    var before = elements[rarry.keys[rarry.indexOfKey(key) + 1]]
    elements[key] = el
    if(before) {
      root.insertBefore(el, before)
    } else {
      root.appendChild(el)
    }
  }

  //render the current contents...
  rarry.keys.forEach(function (key) {
    update(key, rarry.get(key))
  })

  return root
}


},{}],11:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],10:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":11}],3:[function(require,module,exports){

var header = require('header-stream')

var version
/**
TODO
more sophisticated reloading, 
pass in a package and a semver range...
**/
module.exports = function (handler) {
  return function (stream) {
    var args = [].slice.call(arguments)
    header(stream).writeHead()
    stream.on('header', function (meta) {

      if(!version)
        version = meta.version
      if(meta.version !== version) {
        stream.emit('reload', meta.version, version)
        stream.end()

        return window.location.reload(true)
      }

      handler.apply(this, args)
    })
  }

}

var wrap = function (stream, _version) {
  version = _version || version
  stream = header(stream)
  stream.on('header', function (meta) {
    //is it same version as last time?
    if(!version)
      version = meta.version
    if(meta.version !== version) {
      stream.emit('reload', meta.version, version)
      stream.end()

      window.location.reload(true)
    }
  })
  return stream
}

},{"header-stream":12}],4:[function(require,module,exports){
var diff     = require('adiff').diff
var RArray   = require('r-array')
var inherits = require('util').inherits

function patch (a, changes) {
  changes.forEach(function (patch) {
    a.splice.apply(a, patch)
  })
  return a
}

function split(str) {
  return str.split('\n').map(function (l, i, a) {
    if(i != a.length - 1)
      return l + '\n'
    return l
  })
}

module.exports = REdit

inherits(REdit, RArray)

function REdit() {
  if(!(this instanceof REdit)) return new REdit()
  RArray.call(this)
}

var R = REdit.prototype

R.text  = function text (text) {
  if(!arguments.length)
    return this.toJSON().join('')
  
  var old = this.toJSON()
  text = split(text)
  //got to adjust the user's selection on the text area...
  var p = diff(old, text)
  patch(this, p)
}

R.unwrap = function () {

}

R.widget = function () {
  var ta = document.createElement('textarea')
  ta.setAttribute('cols', 80)
  ta.setAttribute('rows', 24)
  this.wrap(ta)
  return ta
}

R.wrap = function (ta) {
  if(!ta) throw new Error('wrap(ta) expects TextArea, or Input')

  var cursor = 0, start
  var self = this

  if(this.wrapped)
    throw new Error('rEdit is already wrapping a textarea. unwrap it first!')

  if(ta._rEditWrapper)
    ta._rEditWrapper.unwrap()

  ta._rEditWrapper = this
  this.wrapped = ta

  ta.value = this.text()

  function onPreupdate (ch) {
    //force update when recieve message.
    cursor = 0
    start = ta.selectionStart
    end   = ta.selectionEnd
    //what atom contains the cursor?
    var startKey, sum = 0
    for (var i in self.keys) {
      var key = self.keys[i]
      if((sum = self.store[key].length + sum) >= start) {
        startKey = key; break
      }
    }
    //how much will be inserted into the document?
    for(var key in ch) {
      if(key < startKey)
        cursor += 
          (ch[key] ? ch[key].length : 0)
        - (self.store[key] ? self.store[key].length : 0)
    }
    //THIS IS ACTUALLY WRONG. CAN'T insert into a selection!
    start = start + cursor
    end   = end   + cursor
  }
  this.on('preupdate', onPreupdate)
  function on_update (update) {
    if(update[2] !== self.id) {
      ta.value = self.toJSON().join('')
      ta.selectionStart = ta.selectionEnd = start
    }
  }
  this.on('_update'  , on_update)
  var pending = false
  function onInput () {
    //if(pending) return
    //pending = true
    //setTimeout(function () {
    //pending = false
    self.text(ta.value)
    //}, 300)
  }
  function onKeydown () {
    start = ta.selectionStart
    end   = ta.selectionEnd
  }
  function onFocus () {
    ta.selectionStart = ta.selectionEnd = start
  }
  ta.addEventListener('input'  , onInput)
  ta.addEventListener('keydown', onKeydown)
  ta.addEventListener('focus'  , onFocus )

  this.unwrap = function () {
    ta.removeEventListener('input'  , onInput)
    ta.removeEventListener('keydown', onKeydown)
    ta.removeEventListener('focus'  , onFocus)
    this.removeListener('preupdate' , onPreupdate)
    this.removeListener('_update'   , on_update)
    this.unwrap = function () {}
  }

  return this
}

},{"util":9,"adiff":13,"r-array":14}],5:[function(require,module,exports){
'use strict';

var through = require('through')
  , extend = require('xtend')
  , duplex = require('duplex')
  , serializer = require('stream-serializer')

function MuxDemux (opts, onConnection) {
  if('function' === typeof opts)
    onConnection = opts, opts = null
  opts = opts || {}

  function createID() {
    return (
      Math.random().toString(16).slice(2) +
      Math.random().toString(16).slice(2)
    )
  }

  var streams = {}, streamCount = 0
  var md = duplex()//.resume()

  md.on('_data', function (data) {
    if(!(Array.isArray(data)
      && 'string' === typeof data[0]
      && '__proto__' !== data[0]
      && 'string' === typeof data[1]
      && '__proto__' !== data[1]
    )) return
    var id = data.shift()
    var event = data[0]
    var s = streams[id]
    if(!s) {
      if(event == 'close')
        return
      if(event != 'new')
        return outer.emit('unknown', id)
      md.emit('connection', createStream(id, data[1].meta, data[1].opts))
    }
    else if (event === 'pause')
      s.paused = true
    else if (event === 'resume') {
      var p = s.paused
      s.paused = false
      if(p) s.emit('drain')
    }
    else if (event === 'error') {
      var error = data[1]
      if (typeof error === 'string') {
        s.emit('error', new Error(error))
      } else if (typeof error.message === 'string') {
        var e = new Error(error.message)
        extend(e, error)
        s.emit('error', e)
      } else {
        s.emit('error', error)
      }
    }
    else {
      s.emit.apply(s, data)
    }
  })
  .on('_end', function () {
    destroyAll()
    md._end()
  })

  function destroyAll (_err) {
    md.removeListener('end', destroyAll)
    md.removeListener('error', destroyAll)
    md.removeListener('close', destroyAll)
    var err = _err || new Error ('unexpected disconnection')
    for (var i in streams) {
      var s = streams[i]
      s.destroyed = true
      if (opts.error !== true) {
        s.end()
      } else {
        s.emit('error', err)
        s.destroy()
      }
    }
  }

  //end the stream once sub-streams have ended.
  //(waits for them to close, like on a tcp server)

  function createStream(id, meta, opts) {
    streamCount ++
    var s = through(function (data) {
      if(!this.writable) {
        var err = Error('stream is not writable: ' + id)
        err.stream = this
        return outer.emit("error", err)
      }
      md._data([s.id, 'data', data])
    }, function () {
      md._data([s.id, 'end'])
      if (this.readable && !opts.allowHalfOpen && !this.ended) {
        this.emit("end")
      }
    })
    s.pause = function () {
      md._data([s.id, 'pause'])
    }
    s.resume = function () {
      md._data([s.id, 'resume'])
    }
    s.error = function (message) {
      md._data([s.id, 'error', message])
    }
    s.once('close', function () {
      delete streams[id]
      streamCount --
      md._data([s.id, 'close'])
      if(streamCount === 0)
        md.emit('zero')
    })
    s.writable = opts.writable
    s.readable = opts.readable
    streams[s.id = id] = s
    s.meta = meta
    return s
  }

  var outer = serializer(opts.wrapper)(md)

  if(md !== outer)
    md.on('connection', function (stream) {
      outer.emit('connection', stream)
    })

  outer.close = function (cb) {
    md.once('zero', function () {
      md._end()
      if(cb) cb()
    })
    return this
  }

  if(onConnection)
    outer.on('connection', onConnection)

  outer.on('connection', function (stream) {
    //if mux-demux recieves a stream but there is nothing to handle it,
    //then return an error to the other side.
    //still trying to think of the best error message.
    if(outer.listeners('connection').length === 1)
      stream.error('remote end lacks connection listener ' 
        + outer.listeners('connection').length)
  })

  var pipe = outer.pipe
  outer.pipe = function (dest, opts) {
    pipe.call(outer, dest, opts)
    md.on('end', destroyAll)
    md.on('close', destroyAll)
    md.on('error', destroyAll)
    return dest
  }

  outer.createStream = function (meta, opts) {
    opts = opts || {}
    if (!opts.writable && !opts.readable)
      opts.readable = opts.writable = true
    var s = createStream(createID(), meta, opts)
    var _opts = {writable: opts.readable, readable: opts.writable}
    md._data([s.id, 'new', {meta: meta, opts: _opts}])
    return s
  }
  outer.createWriteStream = function (meta) {
    return outer.createStream(meta, {writable: true, readable: false})
  }
  outer.createReadStream = function (meta) {
    return outer.createStream(meta, {writable: false, readable: true})
  }

  return outer
}

module.exports = MuxDemux


},{"through":15,"xtend":16,"duplex":17,"stream-serializer":18}],13:[function(require,module,exports){
function head (a) {
  return a[0]
}

function last (a) {
  return a[a.length - 1]
}

function tail(a) {
  return a.slice(1)
}

function retreat (e) {
  return e.pop()
}

function hasLength (e) {
  return e.length
}

function any(ary, test) {
  for(var i in ary)
    if(test(ary[i]))
      return true
  return false
}

var _rules // set at the bottom  

// note, naive implementation. will break on circular objects.

function _equal(a, b) {
  if(a && !b) return false
  if(Array.isArray(a))
    if(a.length != b.length) return false
  if(a && 'object' == typeof a) {
    for(var i in a)
      if(!_equal(a[i], b[i])) return false
    return true
  }
  return a == b
}

function getArgs(args) {
  return args.length == 1 ? args[0] : [].slice.call(args)
}

// return the index of the element not like the others, or -1
function oddElement(ary, cmp) {
  var c
  function guess(a) {
    var odd = -1
    c = 0
    for (var i = a; i < ary.length; i ++) {
      if(!cmp(ary[a], ary[i])) {
        odd = i, c++
      }
    }
    return c > 1 ? -1 : odd
  }
  //assume that it is the first element.
  var g = guess(0)
  if(-1 != g) return g
  //0 was the odd one, then all the other elements are equal
  //else there more than one different element
  guess(1)
  return c == 0 ? 0 : -1
}
var exports = module.exports = function (deps, exports) {
  var equal = (deps && deps.equal) || _equal
  exports = exports || {} 
  exports.lcs = 
  function lcs() {
    var cache = {}
    var args = getArgs(arguments)
    var a = args[0], b = args[1]

    function key (a,b){
      return a.length + ':' + b.length
    }

    //find length that matches at the head

    if(args.length > 2) {
      //if called with multiple sequences
      //recurse, since lcs(a, b, c, d) == lcs(lcs(a,b), lcs(c,d))
      args.push(lcs(args.shift(), args.shift()))
      return lcs(args)
    }
    
    //this would be improved by truncating input first
    //and not returning an lcs as an intermediate step.
    //untill that is a performance problem.

    var start = 0, end = 0
    for(var i = 0; i < a.length && i < b.length 
      && equal(a[i], b[i])
      ; i ++
    )
      start = i + 1

    if(a.length === start)
      return a.slice()

    for(var i = 0;  i < a.length - start && i < b.length - start
      && equal(a[a.length - 1 - i], b[b.length - 1 - i])
      ; i ++
    )
      end = i

    function recurse (a, b) {
      if(!a.length || !b.length) return []
      //avoid exponential time by caching the results
      if(cache[key(a, b)]) return cache[key(a, b)]

      if(equal(a[0], b[0]))
        return [head(a)].concat(recurse(tail(a), tail(b)))
      else { 
        var _a = recurse(tail(a), b)
        var _b = recurse(a, tail(b))
        return cache[key(a,b)] = _a.length > _b.length ? _a : _b  
      }
    }
    
    var middleA = a.slice(start, a.length - end)
    var middleB = b.slice(start, b.length - end)

    return (
      a.slice(0, start).concat(
        recurse(middleA, middleB)
      ).concat(a.slice(a.length - end))
    )
  }

  // given n sequences, calc the lcs, and then chunk strings into stable and unstable sections.
  // unstable chunks are passed to build
  exports.chunk =
  function (q, build) {
    var q = q.map(function (e) { return e.slice() })
    var lcs = exports.lcs.apply(null, q)
    var all = [lcs].concat(q)

    function matchLcs (e) {
      if(e.length && !lcs.length || !e.length && lcs.length)
        return false //incase the last item is null 
      return equal(last(e), last(lcs)) || ((e.length + lcs.length) === 0)
    }

    while(any(q, hasLength)) {
      //if each element is at the lcs then this chunk is stable.
      while(q.every(matchLcs) && q.every(hasLength)) 
        all.forEach(retreat) 
      //collect the changes in each array upto the next match with the lcs
      var c = false
      var unstable = q.map(function (e) {
        var change = []
        while(!matchLcs(e)) {
          change.unshift(retreat(e))
          c = true
        }
        return change
      })
      if(c) build(q[0].length, unstable) 
    }
  }

  exports.diff =
  function (a, b) {
    var changes = []
    exports.chunk([a, b], function (index, unstable) {
      var del = unstable.shift().length
      var insert = unstable.shift()
      changes.push([index, del].concat(insert))
    })
    return changes
  }

  exports.patch = function (a, changes, mutate) {
    if(mutate !== true) a = a.slice(a)//copy a
    changes.forEach(function (change) {
      [].splice.apply(a, change)
    })
    return a
  }

  // http://en.wikipedia.org/wiki/Concestor
  // me, concestor, you...
  exports.merge = function () {
    var args = getArgs(arguments)
    var patch = exports.diff3(args)
    return exports.patch(args[0], patch)
  }

  exports.diff3 = function () {
    var args = getArgs(arguments)
    var r = []
    exports.chunk(args, function (index, unstable) {
      var mine = unstable[0]
      var insert = resolve(unstable)
      if(equal(mine, insert)) return 
      r.push([index, mine.length].concat(insert)) 
    })
    return r
  }
  exports.oddOneOut =
    function oddOneOut (changes) {
      changes = changes.slice()
      //put the concestor first
      changes.unshift(changes.splice(1,1)[0])
      var i = oddElement(changes, equal)
      if(i == 0) // concestor was different, 'false conflict'
        return changes[1]
      if (~i)
        return changes[i] 
    }
  exports.insertMergeOverDelete = 
    //i've implemented this as a seperate rule,
    //because I had second thoughts about this.
    function insertMergeOverDelete (changes) {
      changes = changes.slice()
      changes.splice(1,1)// remove concestor
      
      //if there is only one non empty change thats okay.
      //else full confilct
      for (var i = 0, nonempty; i < changes.length; i++)
        if(changes[i].length) 
          if(!nonempty) nonempty = changes[i]
          else return // full conflict
      return nonempty
    }

  var rules = (deps && deps.rules) || [exports.oddOneOut, exports.insertMergeOverDelete]

  function resolve (changes) {
    var l = rules.length
    for (var i in rules) { // first
      
      var c = rules[i] && rules[i](changes)
      if(c) return c
    }
    changes.splice(1,1) // remove concestor
    //returning the conflicts as an object is a really bad idea,
    // because == will not detect they are the same. and conflicts build.
    // better to use
    // '<<<<<<<<<<<<<'
    // of course, i wrote this before i started on snob, so i didn't know that then.
    /*var conflict = ['>>>>>>>>>>>>>>>>']
    while(changes.length)
      conflict = conflict.concat(changes.shift()).concat('============')
    conflict.pop()
    conflict.push          ('<<<<<<<<<<<<<<<')
    changes.unshift       ('>>>>>>>>>>>>>>>')
    return conflict*/
    //nah, better is just to use an equal can handle objects
    return {'?': changes}
  }
  return exports
}
exports(null, exports)

},{}],15:[function(require,module,exports){
(function(process){var Stream = require('stream')

// through
//
// a stream that does nothing but re-emit the input.
// useful for aggregating a series of changing but not ending streams into one stream)

exports = module.exports = through
through.through = through

//create a readable writable stream.

function through (write, end, opts) {
  write = write || function (data) { this.queue(data) }
  end = end || function () { this.queue(null) }

  var ended = false, destroyed = false, buffer = [], _ended = false
  var stream = new Stream()
  stream.readable = stream.writable = true
  stream.paused = false

//  stream.autoPause   = !(opts && opts.autoPause   === false)
  stream.autoDestroy = !(opts && opts.autoDestroy === false)

  stream.write = function (data) {
    write.call(this, data)
    return !stream.paused
  }

  function drain() {
    while(buffer.length && !stream.paused) {
      var data = buffer.shift()
      if(null === data)
        return stream.emit('end')
      else
        stream.emit('data', data)
    }
  }

  stream.queue = stream.push = function (data) {
//    console.error(ended)
    if(_ended) return stream
    if(data == null) _ended = true
    buffer.push(data)
    drain()
    return stream
  }

  //this will be registered as the first 'end' listener
  //must call destroy next tick, to make sure we're after any
  //stream piped from here.
  //this is only a problem if end is not emitted synchronously.
  //a nicer way to do this is to make sure this is the last listener for 'end'

  stream.on('end', function () {
    stream.readable = false
    if(!stream.writable && stream.autoDestroy)
      process.nextTick(function () {
        stream.destroy()
      })
  })

  function _end () {
    stream.writable = false
    end.call(stream)
    if(!stream.readable && stream.autoDestroy)
      stream.destroy()
  }

  stream.end = function (data) {
    if(ended) return
    ended = true
    if(arguments.length) stream.write(data)
    _end() // will emit or queue
    return stream
  }

  stream.destroy = function () {
    if(destroyed) return
    destroyed = true
    ended = true
    buffer.length = 0
    stream.writable = stream.readable = false
    stream.emit('close')
    return stream
  }

  stream.pause = function () {
    if(stream.paused) return
    stream.paused = true
    return stream
  }

  stream.resume = function () {
    if(stream.paused) {
      stream.paused = false
      stream.emit('resume')
    }
    drain()
    //may have become paused again,
    //as drain emits 'data'.
    if(!stream.paused)
      stream.emit('drain')
    return stream
  }
  return stream
}


})(require("__browserify_process"))
},{"stream":19,"__browserify_process":11}],12:[function(require,module,exports){

//the first line is header, in JSON format, with no whitespace.

function merge (a, b) {
  for (var k in b)
    a[k] = a[k] || b[k]
}

module.exports = 
function header (stream) {

  var emit = stream.emit
  var write = stream.write
  var soFar = ''

  stream.emit = function (event, data) {
    if(event !== 'data')
      return emit.apply(stream, arguments)

    soFar += data
    var m
    if(!(m = /\n/.exec(soFar))) return
    var meta = JSON.parse(soFar.substring(0, m.index))
    //+ 1 to get past the newline
    soFar = soFar.substring(m.index + 1)
    stream.emit = emit
    stream.meta = meta
    stream.emit('header', meta)
    //check that the stream is still readable,
    //it may have been ended during the 'header'
    //event.
    if('' !== soFar  && stream.readable)
      stream.emit('data', soFar)
  }

  var meta = {}

  stream.setHeader = function (key, val) {
    if('string' === typeof key)
      meta[key] = val
    else
      merge(meta, key)
    return stream
  }

  stream.writeHead = function (_meta) {
    if(_meta) merge(meta, _meta)
    stream.write = write
    stream.write(JSON.stringify(meta)+'\n')    
  }

  stream.write = function (data) {
    stream.writeHead()
    return stream.write(data)
  }

  return stream
}

},{}],16:[function(require,module,exports){
module.exports = extend

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i],
            keys = Object.keys(source)

        for (var j = 0; j < keys.length; j++) {
            var name = keys[j]
            target[name] = source[name]
        }
    }

    return target
}
},{}],17:[function(require,module,exports){
(function(process){var Stream = require('stream')

module.exports = function (write, end) {
  var stream = new Stream() 
  var buffer = [], ended = false, destroyed = false, emitEnd
  stream.writable = stream.readable = true
  stream.paused = false
  stream._paused = false
  stream.buffer = buffer
  
  stream
    .on('pause', function () {
      stream._paused = true
    })
    .on('drain', function () {
      stream._paused = false
    })
   
  function destroySoon () {
    process.nextTick(stream.destroy.bind(stream))
  }

  if(write)
    stream.on('_data', write)
  if(end)
    stream.on('_end', end)

  //destroy the stream once both ends are over
  //but do it in nextTick, so that other listeners
  //on end have time to respond
  stream.once('end', function () { 
    stream.readable = false
    if(!stream.writable) {
      process.nextTick(function () {
        stream.destroy()
      })
    }
  })

  stream.once('_end', function () { 
    stream.writable = false
    if(!stream.readable)
      stream.destroy()
  })

  // this is the default write method,
  // if you overide it, you are resposible
  // for pause state.

  
  stream._data = function (data) {
    if(!stream.paused && !buffer.length)
      stream.emit('data', data)
    else 
      buffer.push(data)
    return !(stream.paused || buffer.length)
  }

  stream._end = function (data) { 
    if(data) stream._data(data)
    if(emitEnd) return
    emitEnd = true
    //destroy is handled above.
    stream.drain()
  }

  stream.write = function (data) {
    stream.emit('_data', data)
    return !stream._paused
  }

  stream.end = function () {
    stream.writable = false
    if(stream.ended) return
    stream.ended = true
    stream.emit('_end')
  }

  stream.drain = function () {
    if(!buffer.length && !emitEnd) return
    //if the stream is paused after just before emitEnd()
    //end should be buffered.
    while(!stream.paused) {
      if(buffer.length) {
        stream.emit('data', buffer.shift())
        if(buffer.length == 0) {
          stream.emit('_drain')
        }
      }
      else if(emitEnd && stream.readable) {
        stream.readable = false
        stream.emit('end')
        return
      } else {
        //if the buffer has emptied. emit drain.
        return true
      }
    }
  }
  var started = false
  stream.resume = function () {
    //this is where I need pauseRead, and pauseWrite.
    //here the reading side is unpaused,
    //but the writing side may still be paused.
    //the whole buffer might not empity at once.
    //it might pause again.
    //the stream should never emit data inbetween pause()...resume()
    //and write should return !buffer.length
    started = true
    stream.paused = false
    stream.drain() //will emit drain if buffer empties.
    return stream
  }

  stream.destroy = function () {
    if(destroyed) return
    destroyed = ended = true     
    buffer.length = 0
    stream.emit('close')
  }
  var pauseCalled = false
  stream.pause = function () {
    started = true
    stream.paused = true
    stream.emit('_pause')
    return stream
  }
  stream._pause = function () {
    if(!stream._paused) {
      stream._paused = true
      stream.emit('pause')
    }
    return this
  }
  stream.paused = true
  process.nextTick(function () {
    //unless the user manually paused
    if(started) return
    stream.resume()
  })
 
  return stream
}


})(require("__browserify_process"))
},{"stream":19,"__browserify_process":11}],18:[function(require,module,exports){

var EventEmitter = require('events').EventEmitter

exports = module.exports = function (wrapper) {

  if('function' == typeof wrapper)
    return wrapper
  
  return exports[wrapper] || exports.json
}

exports.json = function (stream) {

  var write = stream.write
  var soFar = ''

  function parse (line) {
    var js
    try {
      js = JSON.parse(line)
      //ignore lines of whitespace...
    } catch (err) { 
      return stream.emit('error', err)
      //return console.error('invalid JSON', line)
    }
    if(js !== undefined)
      write.call(stream, js)
  }

  function onData (data) {
    var lines = (soFar + data).split('\n')
    soFar = lines.pop()
    while(lines.length) {
      parse(lines.shift())
    }
  }

  stream.write = onData
  
  var end = stream.end

  stream.end = function (data) {
    if(data)
      stream.write(data)
    //if there is any left over...
    if(soFar) {
      parse(soFar)
    }
    return end.call(stream)
  }

  stream.emit = function (event, data) {

    if(event == 'data') {
      data = JSON.stringify(data) + '\n'
    }
    //since all stream events only use one argument, this is okay...
    EventEmitter.prototype.emit.call(stream, event, data)
  }

  return stream
//  return es.pipeline(es.split(), es.parse(), stream, es.stringify())
}

exports.raw = function (stream) {
  return stream
}


},{"events":10}],7:[function(require,module,exports){

var shoe = require('shoe')

module.exports = require('./inject')(function (){ 
  var args = [].slice.call(arguments)
  return shoe.apply(null, args)
})

},{"./inject":20,"shoe":21}],19:[function(require,module,exports){
var events = require('events');
var util = require('util');

function Stream() {
  events.EventEmitter.call(this);
}
util.inherits(Stream, events.EventEmitter);
module.exports = Stream;
// Backwards-compat with node 0.4.x
Stream.Stream = Stream;

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once, and
  // only when all sources have ended.
  if (!dest._isStdio && (!options || options.end !== false)) {
    dest._pipeCount = dest._pipeCount || 0;
    dest._pipeCount++;

    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest._pipeCount--;

    // remove the listeners
    cleanup();

    if (dest._pipeCount > 0) {
      // waiting for other incoming streams to end.
      return;
    }

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest._pipeCount--;

    // remove the listeners
    cleanup();

    if (dest._pipeCount > 0) {
      // waiting for other incoming streams to end.
      return;
    }

    dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (this.listeners('error').length === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('end', cleanup);
    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('end', cleanup);
  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":10,"util":9}],22:[function(require,module,exports){
exports.createId = 
function () {
  return [1,1,1].map(function () {
    return Math.random().toString(16).substring(2).toUpperCase()
  }).join('')
}

exports.filter = function (update, sources) {
  var ts = update[1]
  var source = update[2]
  return (!sources || !sources[source] || sources[source] < ts)
}

exports.protoIsIllegal = function (s) {
  s.emit('invalid', new Error('"__proto__" is illegal property name'))
  return null
}

function invalidUpdate(t) {
  t.emit('invalid', new Error('invalid update'))
}

exports.validUpdate = function (t, update) {
  if(!Array.isArray(update)) return invalidUpdate(t)
  if('string' !== typeof update[1] || 'number' !== typeof update[2])
    return invalidUpdate(t)
}

exports.sort = function (hist) {
  return hist.sort(function (a, b) {
    //sort by timestamps, then ids.
    //there should never be a pair with equal timestamps
    //and ids.
    return a[1] - b[1] || (a[2] > b[2] ? 1 : -1)
  })
}

},{}],20:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter
var backoff = require('backoff')

module.exports =
function (createConnection) {
  return function (opts, onConnect) {
    onConnect = 'function' == typeof opts ? opts : onConnect
    opts = opts || {initialDelay: 1e3, maxDelay: 30e3}
    if(!onConnect)
      onConnect = opts.onConnect

    var emitter = new EventEmitter()
    emitter.connected = false
    emitter.reconnect = true

    if(onConnect)
      emitter.on('connect', onConnect)

    var backoffMethod = (backoff[opts.type] || backoff.fibonacci) (opts)

    backoffMethod.on('backoff', function (n, d) {
      emitter.emit('backoff', n, d)
    })

    var args
    function attempt (n, delay) {
      if(!emitter.reconnect) return

      emitter.emit('reconnect', n, delay)
      var con = createConnection.apply(null, args)
      emitter._connection = con
      function onDisconnect () {

        emitter.connected = false
        con.removeListener('error', onDisconnect)
        con.removeListener('close', onDisconnect)
        con.removeListener('end'  , onDisconnect)

        //emit disconnect before checking reconnect, so user has a chance to decide not to.
        emitter.emit('disconnect', con)

        if(!emitter.reconnect) return
        backoffMethod.backoff()
      }

      con.on('connect', function () {
        backoffMethod.reset()
        emitter.connected = true
        emitter.emit('connect', con)
      }).on('error', onDisconnect)
        .on('close', onDisconnect)
        .on('end'  , onDisconnect)
    }

    emitter.connect =
    emitter.listen = function () {
      this.reconnect = true
      if(emitter.connected) return
      backoffMethod.reset()
      backoffMethod.on('ready', attempt)
      args = [].slice.call(arguments)
      attempt(0, 0)
      return emitter
    }

    //force reconnection
    emitter.reconnect = function () {
      if(this.connected)
        return emitter.disconnect()
      
      backoffMethod.reset()
      attempt(0, 0)
      return emitter
    }

    emitter.disconnect = function () {
      this.reconnect = false
      if(!emitter.connected) return emitter
      
      else if(emitter._connection)
        emitter._connection.destroy()

      emitter.emit('disconnect')
      return emitter
    }

    var widget
    emitter.widget = function () {
      if(!widget)
        widget = require('./widget')(emitter)
      return widget
    }

    return emitter
  }

}

},{"events":10,"./widget":23,"backoff":24}],14:[function(require,module,exports){

var between     = require('between')
var Scuttlebutt = require('scuttlebutt')
var inherits    = require('util').inherits
var filter      = require('scuttlebutt/util').filter

inherits(RArray, Scuttlebutt)

module.exports = RArray

function fuzz () {
  return Math.random().toString().substring(2, 5)
}

var DOEMIT = true, CHANGE = {}

function order (a, b) {
  //timestamp, then source
  return between.strord(a[1], b[1]) || between.strord(a[2], b[2])
}

function RArray () {
  Scuttlebutt.call(this)
  this.keys = []
  this.store = {}
  this._hist = {}
  this.length = 0
  if(arguments.length) {
    var self = this
    ;[].forEach.call(arguments, function (e) {
      self.push(e)
    })
  }
}

var A = RArray.prototype

A.last = function () {
  return this.keys[this.keys.length - 1]
}

A.first = function () {
  return this.keys[0]
}

A.insert = function (before, val, after) {  
  var key = between(before || between.lo, after || between.hi) + fuzz()
  this.set(key, val)
  return key
}

A.push = function (val) {
  var key = this.insert(this.last(), val)
}

A.unshift = function (val) {
  var key = this.insert(null, val, this.first())
}

A.indexOf = function (val) {
  for(var i in this.keys) {
    var key = this.keys[i]
    if(v === this.get(key)) return i
  }
  return null
}

A.indexOfKey = function (key) {
  return this.keys.indexOf(key)
}

A.toJSON = function () {
  var store = this.store
  var self = this
  return this.keys.map(function (key) {
    return self.get(key)
  })
}

A.set = function (key, val) {
  if('string' == typeof key) {
    if(val === null) return this.unset(key)
    if(null == this.store[key]) this.length ++
    this.store[key] = val
    if(!~this.keys.indexOf(key)) {
      this.keys.push(key)
      this.keys.sort()
    }
    CHANGE[key] = val
    DOEMIT && this._emit()
  }
}

A.get = function (key) {
  return this.store[key]
}

A.unset = function (key) {
  if('string' == typeof key) {
    if(null != this.store[key]) this.length --
    delete this.store[key]
    var i = this.keys.indexOf(key)
    if(!~i) return
    this.keys.splice(i, 1)    

    CHANGE[key] = null
    DOEMIT && this._emit()
  }
}

A.pop = function () {
  var l = this.last()
  var val = this.store[l]
  this.unset(l)
  return val
}

A.shift = function () {
  var f = this.first()
  var val = this.store[f]
  this.unset(f)
  return val
}

A._emit = function () {
  if(!DOEMIT) return
  this.localUpdate(CHANGE)
  CHANGE = {}
}

A.splice = function (i, d /*,...args*/) {
  var args = [].slice.call(arguments, 2)
  var j = 0, l = args.length

  DOEMIT = false

  if(d + i > this.keys.length)
    d = this.keys.length - i
  
  while(j < d) {
    if(j < l)
      this.set(this.keys[i+j], args[j]), j++
    else
      this.unset(this.keys[i+j]), d--
  }

  while(j < l)
    this.insert(this.keys[i+j-1], args[j], this.keys[i+j]), j++

  DOEMIT = true
  this._emit()
}

A.applyUpdate = function (update) {
  DOEMIT = false
  var change = update[0], old
  var apply = {}, ch = {}
  var old = {}
  for(var key in change) {
    if(!this._hist[key] || order(update, this._hist[key]) > 0)
      apply[key] = change[key]
  }
  //allow the user to see what the change is going to be.
  this.emit('preupdate', apply) 

  //apply the change...
  for(var key in apply) {
    var o = this._hist[key]
    o && (old[o[1]+':'+o[2]] = o) //ts:source
    this._hist[key] = update
    this.set(key, apply[key])
  }

  //check if old elements need to be removed.
  //may also want to keep old updates hanging around 
  //so the user can see recent history...
  for(var id in old) {
    var o = old[id][0], rm = true
    for(var key in o) {
      if(this._hist[key] === old[id]) rm = false
    }
    if(rm)
      this.emit('_remove', old[id])
  }
    
  DOEMIT = true
  CHANGE = {}
  this.emit('update', apply)
  return true
}


A.history = function (sources) {
  var h = []
  for (var key in this._hist) {
    var update = this._hist[key]
      if(!~h.indexOf(update) && filter(update, sources))
        h.push(update)
  }
  return h.sort(order)
}

A.forEach = function (fun) {
  return this.toJSON().forEach(fun)
}

A.filter = function (fun) {
  return this.toJSON().filter(fun)
}

A.map = function (fun) {
  return this.toJSON().map(fun)
}

A.reduce = function (fun, initial) {
  return this.toJSON().reduce(fun, initial)
}

//.length is a property, not a function.

},{"util":9,"scuttlebutt/util":22,"between":25,"scuttlebutt":26}],25:[function(require,module,exports){

function inject (chars) {

  chars = chars ||
  '!0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~'

  chars = chars.split('').sort().join('')

  var exports = between

  exports.between   = between

  exports.randstr   = randstr
  exports.between   = between
  exports.strord    = strord

  exports.lo        = chars[0]
  exports.hi        = chars[chars.length - 1]

  exports.inject    = inject

  function randstr(l) {
    var str = ''
    while(l--) 
      str += chars[
        Math.floor(
          Math.random() * chars.length 
        )
      ]
    return str
  }

  /*
    SOME EXAMPLE STRINGS, IN ORDER
   
    0
    00001
    0001
    001
    001001
    00101
    0011
    0011001
    001100101
    00110011
    001101
    00111
    01  

    if you never make a string that ends in the lowest char,
    then it is always possible to make a string between two strings.
    this is like how decimals never end in 0. 

    example:

    between('A', 'AB') 

    ... 'AA' will sort between 'A' and 'AB' but then it is impossible
    to make a string inbetween 'A' and 'AA'.
    instead, return 'AAB', then there will be space.

  */

  function between (a, b) {

    var s = '', i = 0

    while (true) {

      var _a = chars.indexOf(a[i])
      var _b = chars.indexOf(b[i])
     
      if(_a == -1) _a = 0
      if(_b == -1) _b = chars.length - 1

      i++

      var c = chars[
          _a + 1 < _b 
        ? Math.round((_a+_b)/2)
        : _a
      ]

      s += c

      if(a < s && s < b && c != exports.lo)
        return s;
    }
  }

  function strord (a, b) {
    return (
      a == b ?  0
    : a <  b ? -1
    :           1
    )
  }

  between.strord

  return between
}


module.exports = inject(null)

},{}],23:[function(require,module,exports){

var h = require('h')

module.exports = function (emitter) {
  var style = {}
  var el = h('a', {href: '#', style: style, click: emitter.disconnect})
  var int
  emitter.on('reconnect', function (n, d) {
    var delay = Math.round(d / 1000) + 1
    console.log(n, d)
    el.innerText = 'reconnect in ' + delay
    clearInterval(int)
    int = setInterval(function () {
      el.innerText = delay ? 'reconnect in ' + --delay : 'reconnecting...'
    }, 1e3)
  })
  emitter.on('connect',   function () {
    el.innerText = 'connected'
    clearInterval(int)
  })
  return el
}

},{"h":27}],21:[function(require,module,exports){
var Stream = require('stream');
var sockjs = require('sockjs-client');

module.exports = function (uri, cb) {
    if (/^\/\/[^\/]+\//.test(uri)) {
        uri = window.location.protocol + uri;
    }
    else if (!/^https?:\/\//.test(uri)) {
        uri = window.location.protocol + '//'
            + window.location.host
            + (/^\//.test(uri) ? uri : '/' + uri)
        ;
    }
    
    var stream = new Stream;
    stream.readable = true;
    stream.writable = true;
    
    var ready = false;
    var buffer = [];
    
    var sock = sockjs(uri);
    stream.sock = sock;
    
    stream.write = function (msg) {
        if (!ready || buffer.length) buffer.push(msg)
        else sock.send(msg)
    };
    
    stream.end = function (msg) {
        if (msg !== undefined) stream.write(msg);
        if (!ready) {
            stream._ended = true;
            return;
        }
        stream.writable = false;
        sock.close();
    };
    
    stream.destroy = function () {
        stream._ended = true;
        stream.writable = stream.readable = false;
        buffer.length = 0
        sock.close();
    };
    
    sock.onopen = function () {
        if (typeof cb === 'function') cb();
        ready = true;
        for (var i = 0; i < buffer.length; i++) {
            sock.send(buffer[i]);
        }
        buffer = [];
        stream.emit('connect');
        if (stream._ended) stream.end();
    };
    
    sock.onmessage = function (e) {
        stream.emit('data', e.data);
    };
    
    sock.onclose = function () {
        stream.emit('end');
        stream.writable = false;
        stream.readable = false;
    };
    
    return stream;
};

},{"stream":19,"sockjs-client":28}],24:[function(require,module,exports){
/*
 * Copyright (c) 2012 Mathieu Turcotte
 * Licensed under the MIT license.
 */

var Backoff = require('./lib/backoff'),
    FibonacciBackoffStrategy = require('./lib/strategy/fibonacci'),
    ExponentialBackoffStrategy = require('./lib/strategy/exponential');

module.exports.Backoff = Backoff;
module.exports.FibonacciStrategy = FibonacciBackoffStrategy;
module.exports.ExponentialStrategy = ExponentialBackoffStrategy;

/**
 * Constructs a Fibonacci backoff.
 * @param options Fibonacci backoff strategy arguments.
 * @see FibonacciBackoffStrategy
 */
module.exports.fibonacci = function(options) {
    return new Backoff(new FibonacciBackoffStrategy(options));
};

/**
 * Constructs an exponential backoff.
 * @param options Exponential strategy arguments.
 * @see ExponentialBackoffStrategy
 */
module.exports.exponential = function(options) {
    return new Backoff(new ExponentialBackoffStrategy(options));
};


},{"./lib/backoff":29,"./lib/strategy/fibonacci":30,"./lib/strategy/exponential":31}],27:[function(require,module,exports){
;(function () {

function h() {
  var args = [].slice.call(arguments), e = null
  function item (l) {
    
    function parseClass (string) {
      var m = string.split(/([\.#]?[a-zA-Z0-9_-]+)/)
      m.forEach(function (v) {
        var s = v.substring(1,v.length)
        if(!v) return 
        if(!e)
          e = document.createElement(v)
        else if (v[0] === '.')
          e.classList.add(s)
        else if (v[0] === '#')
          e.setAttribute('id', s)
        
      })
    }

    if(l == null)
      ;
    else if('string' === typeof l) {
      if(!e)
        parseClass(l)
      else
        e.appendChild(document.createTextNode(l))
    }
    else if('number' === typeof l 
      || 'boolean' === typeof l
      || l instanceof Date 
      || l instanceof RegExp ) {
        e.appendChild(document.createTextNode(l.toString()))
    }
    else if (Array.isArray(l))
      l.forEach(item)
    else if(l instanceof HTMLElement)
      e.appendChild(l)
    else if ('object' === typeof l) {
      for (var k in l) {
        if('function' === typeof l[k])
          e.addEventListener(k, l[k])
        else if(k === 'style') {
          for (var s in l[k])
            e.style.setProperty(s, l[k][s])
        }
        else
          e.setAttribute(k, l[k])
      }
    }
  }
  while(args.length) {
    item(args.shift())
  }
  return e
}

if(typeof module === 'object')
  module.exports = h
else
  this.h = h
})()

},{}],29:[function(require,module,exports){
/*
 * Copyright (c) 2012 Mathieu Turcotte
 * Licensed under the MIT license.
 */

var events = require('events'),
    util = require('util');

/**
 * Backoff driver.
 * @param backoffStrategy Backoff delay generator/strategy.
 * @constructor
 */
function Backoff(backoffStrategy) {
    events.EventEmitter.call(this);

    this.backoffStrategy_ = backoffStrategy;
    this.backoffNumber_ = 0;
    this.backoffDelay_ = 0;
    this.timeoutID_ = -1;

    this.handlers = {
        backoff: this.onBackoff_.bind(this)
    };
}
util.inherits(Backoff, events.EventEmitter);

/**
 * Starts a backoff operation.
 */
Backoff.prototype.backoff = function() {
    if (this.timeoutID_ !== -1) {
        throw new Error('Backoff in progress.');
    }

    this.backoffDelay_ = this.backoffStrategy_.next();
    this.timeoutID_ = setTimeout(this.handlers.backoff, this.backoffDelay_);
    this.emit('backoff', this.backoffNumber_, this.backoffDelay_);
};

/**
 * Backoff completion handler.
 * @private
 */
Backoff.prototype.onBackoff_ = function() {
    this.timeoutID_ = -1;
    this.emit('ready', this.backoffNumber_++, this.backoffDelay_);
};

/**
 * Stops any backoff operation and resets the backoff
 * delay to its inital value.
 */
Backoff.prototype.reset = function() {
    this.backoffNumber_ = 0;
    this.backoffStrategy_.reset();
    clearTimeout(this.timeoutID_);
    this.timeoutID_ = -1;
};

module.exports = Backoff;


},{"events":10,"util":9}],28:[function(require,module,exports){
(function(){/* SockJS client, version 0.3.1.7.ga67f.dirty, http://sockjs.org, MIT License

Copyright (c) 2011-2012 VMware, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// JSON2 by Douglas Crockford (minified).
var JSON;JSON||(JSON={}),function(){function str(a,b){var c,d,e,f,g=gap,h,i=b[a];i&&typeof i=="object"&&typeof i.toJSON=="function"&&(i=i.toJSON(a)),typeof rep=="function"&&(i=rep.call(b,a,i));switch(typeof i){case"string":return quote(i);case"number":return isFinite(i)?String(i):"null";case"boolean":case"null":return String(i);case"object":if(!i)return"null";gap+=indent,h=[];if(Object.prototype.toString.apply(i)==="[object Array]"){f=i.length;for(c=0;c<f;c+=1)h[c]=str(c,i)||"null";e=h.length===0?"[]":gap?"[\n"+gap+h.join(",\n"+gap)+"\n"+g+"]":"["+h.join(",")+"]",gap=g;return e}if(rep&&typeof rep=="object"){f=rep.length;for(c=0;c<f;c+=1)typeof rep[c]=="string"&&(d=rep[c],e=str(d,i),e&&h.push(quote(d)+(gap?": ":":")+e))}else for(d in i)Object.prototype.hasOwnProperty.call(i,d)&&(e=str(d,i),e&&h.push(quote(d)+(gap?": ":":")+e));e=h.length===0?"{}":gap?"{\n"+gap+h.join(",\n"+gap)+"\n"+g+"}":"{"+h.join(",")+"}",gap=g;return e}}function quote(a){escapable.lastIndex=0;return escapable.test(a)?'"'+a.replace(escapable,function(a){var b=meta[a];return typeof b=="string"?b:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function f(a){return a<10?"0"+a:a}"use strict",typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(a){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(a){return this.valueOf()});var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;typeof JSON.stringify!="function"&&(JSON.stringify=function(a,b,c){var d;gap="",indent="";if(typeof c=="number")for(d=0;d<c;d+=1)indent+=" ";else typeof c=="string"&&(indent=c);rep=b;if(!b||typeof b=="function"||typeof b=="object"&&typeof b.length=="number")return str("",{"":a});throw new Error("JSON.stringify")}),typeof JSON.parse!="function"&&(JSON.parse=function(text,reviver){function walk(a,b){var c,d,e=a[b];if(e&&typeof e=="object")for(c in e)Object.prototype.hasOwnProperty.call(e,c)&&(d=walk(e,c),d!==undefined?e[c]=d:delete e[c]);return reviver.call(a,b,e)}var j;text=String(text),cx.lastIndex=0,cx.test(text)&&(text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver=="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")})}()


//     [*] Including lib/index.js
// Public object
var SockJS = (function(){
              var _document = document;
              var _window = window;
              var utils = {};


//         [*] Including lib/reventtarget.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

/* Simplified implementation of DOM2 EventTarget.
 *   http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget
 */
var REventTarget = function() {};
REventTarget.prototype.addEventListener = function (eventType, listener) {
    if(!this._listeners) {
         this._listeners = {};
    }
    if(!(eventType in this._listeners)) {
        this._listeners[eventType] = [];
    }
    var arr = this._listeners[eventType];
    if(utils.arrIndexOf(arr, listener) === -1) {
        arr.push(listener);
    }
    return;
};

REventTarget.prototype.removeEventListener = function (eventType, listener) {
    if(!(this._listeners && (eventType in this._listeners))) {
        return;
    }
    var arr = this._listeners[eventType];
    var idx = utils.arrIndexOf(arr, listener);
    if (idx !== -1) {
        if(arr.length > 1) {
            this._listeners[eventType] = arr.slice(0, idx).concat( arr.slice(idx+1) );
        } else {
            delete this._listeners[eventType];
        }
        return;
    }
    return;
};

REventTarget.prototype.dispatchEvent = function (event) {
    var t = event.type;
    var args = Array.prototype.slice.call(arguments, 0);
    if (this['on'+t]) {
        this['on'+t].apply(this, args);
    }
    if (this._listeners && t in this._listeners) {
        for(var i=0; i < this._listeners[t].length; i++) {
            this._listeners[t][i].apply(this, args);
        }
    }
};
//         [*] End of lib/reventtarget.js


//         [*] Including lib/simpleevent.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var SimpleEvent = function(type, obj) {
    this.type = type;
    if (typeof obj !== 'undefined') {
        for(var k in obj) {
            if (!obj.hasOwnProperty(k)) continue;
            this[k] = obj[k];
        }
    }
};

SimpleEvent.prototype.toString = function() {
    var r = [];
    for(var k in this) {
        if (!this.hasOwnProperty(k)) continue;
        var v = this[k];
        if (typeof v === 'function') v = '[function]';
        r.push(k + '=' + v);
    }
    return 'SimpleEvent(' + r.join(', ') + ')';
};
//         [*] End of lib/simpleevent.js


//         [*] Including lib/eventemitter.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventEmitter = function(events) {
    this.events = events || [];
};
EventEmitter.prototype.emit = function(type) {
    var that = this;
    var args = Array.prototype.slice.call(arguments, 1);
    if (!that.nuked && that['on'+type]) {
        that['on'+type].apply(that, args);
    }
    if (utils.arrIndexOf(that.events, type) === -1) {
        utils.log('Event ' + JSON.stringify(type) +
                  ' not listed ' + JSON.stringify(that.events) +
                  ' in ' + that);
    }
};

EventEmitter.prototype.nuke = function(type) {
    var that = this;
    that.nuked = true;
    for(var i=0; i<that.events.length; i++) {
        delete that[that.events[i]];
    }
};
//         [*] End of lib/eventemitter.js


//         [*] Including lib/utils.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var random_string_chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
utils.random_string = function(length, max) {
    max = max || random_string_chars.length;
    var i, ret = [];
    for(i=0; i < length; i++) {
        ret.push( random_string_chars.substr(Math.floor(Math.random() * max),1) );
    }
    return ret.join('');
};
utils.random_number = function(max) {
    return Math.floor(Math.random() * max);
};
utils.random_number_string = function(max) {
    var t = (''+(max - 1)).length;
    var p = Array(t+1).join('0');
    return (p + utils.random_number(max)).slice(-t);
};

// Assuming that url looks like: http://asdasd:111/asd
utils.getOrigin = function(url) {
    url += '/';
    var parts = url.split('/').slice(0, 3);
    return parts.join('/');
};

utils.isSameOriginUrl = function(url_a, url_b) {
    // location.origin would do, but it's not always available.
    if (!url_b) url_b = _window.location.href;

    return (url_a.split('/').slice(0,3).join('/')
                ===
            url_b.split('/').slice(0,3).join('/'));
};

utils.getParentDomain = function(url) {
    // ipv4 ip address
    if (/^[0-9.]*$/.test(url)) return url;
    // ipv6 ip address
    if (/^\[/.test(url)) return url;
    // no dots
    if (!(/[.]/.test(url))) return url;

    var parts = url.split('.').slice(1);
    return parts.join('.');
};

utils.objectExtend = function(dst, src) {
    for(var k in src) {
        if (src.hasOwnProperty(k)) {
            dst[k] = src[k];
        }
    }
    return dst;
};

var WPrefix = '_jp';

utils.polluteGlobalNamespace = function() {
    if (!(WPrefix in _window)) {
        _window[WPrefix] = {};
    }
};

utils.closeFrame = function (code, reason) {
    return 'c'+JSON.stringify([code, reason]);
};

utils.userSetCode = function (code) {
    return code === 1000 || (code >= 3000 && code <= 4999);
};

// See: http://www.erg.abdn.ac.uk/~gerrit/dccp/notes/ccid2/rto_estimator/
// and RFC 2988.
utils.countRTO = function (rtt) {
    var rto;
    if (rtt > 100) {
        rto = 3 * rtt; // rto > 300msec
    } else {
        rto = rtt + 200; // 200msec < rto <= 300msec
    }
    return rto;
}

utils.log = function() {
    if (_window.console && console.log && console.log.apply) {
        console.log.apply(console, arguments);
    }
};

utils.bind = function(fun, that) {
    if (fun.bind) {
        return fun.bind(that);
    } else {
        return function() {
            return fun.apply(that, arguments);
        };
    }
};

utils.flatUrl = function(url) {
    return url.indexOf('?') === -1 && url.indexOf('#') === -1;
};

utils.amendUrl = function(url) {
    var dl = _document.location;
    if (!url) {
        throw new Error('Wrong url for SockJS');
    }
    if (!utils.flatUrl(url)) {
        throw new Error('Only basic urls are supported in SockJS');
    }

    //  '//abc' --> 'http://abc'
    if (url.indexOf('//') === 0) {
        url = dl.protocol + url;
    }
    // '/abc' --> 'http://localhost:80/abc'
    if (url.indexOf('/') === 0) {
        url = dl.protocol + '//' + dl.host + url;
    }
    // strip trailing slashes
    url = url.replace(/[/]+$/,'');
    return url;
};

// IE doesn't support [].indexOf.
utils.arrIndexOf = function(arr, obj){
    for(var i=0; i < arr.length; i++){
        if(arr[i] === obj){
            return i;
        }
    }
    return -1;
};

utils.arrSkip = function(arr, obj) {
    var idx = utils.arrIndexOf(arr, obj);
    if (idx === -1) {
        return arr.slice();
    } else {
        var dst = arr.slice(0, idx);
        return dst.concat(arr.slice(idx+1));
    }
};

// Via: https://gist.github.com/1133122/2121c601c5549155483f50be3da5305e83b8c5df
utils.isArray = Array.isArray || function(value) {
    return {}.toString.call(value).indexOf('Array') >= 0
};

utils.delay = function(t, fun) {
    if(typeof t === 'function') {
        fun = t;
        t = 0;
    }
    return setTimeout(fun, t);
};


// Chars worth escaping, as defined by Douglas Crockford:
//   https://github.com/douglascrockford/JSON-js/blob/47a9882cddeb1e8529e07af9736218075372b8ac/json2.js#L196
var json_escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    json_lookup = {
"\u0000":"\\u0000","\u0001":"\\u0001","\u0002":"\\u0002","\u0003":"\\u0003",
"\u0004":"\\u0004","\u0005":"\\u0005","\u0006":"\\u0006","\u0007":"\\u0007",
"\b":"\\b","\t":"\\t","\n":"\\n","\u000b":"\\u000b","\f":"\\f","\r":"\\r",
"\u000e":"\\u000e","\u000f":"\\u000f","\u0010":"\\u0010","\u0011":"\\u0011",
"\u0012":"\\u0012","\u0013":"\\u0013","\u0014":"\\u0014","\u0015":"\\u0015",
"\u0016":"\\u0016","\u0017":"\\u0017","\u0018":"\\u0018","\u0019":"\\u0019",
"\u001a":"\\u001a","\u001b":"\\u001b","\u001c":"\\u001c","\u001d":"\\u001d",
"\u001e":"\\u001e","\u001f":"\\u001f","\"":"\\\"","\\":"\\\\",
"\u007f":"\\u007f","\u0080":"\\u0080","\u0081":"\\u0081","\u0082":"\\u0082",
"\u0083":"\\u0083","\u0084":"\\u0084","\u0085":"\\u0085","\u0086":"\\u0086",
"\u0087":"\\u0087","\u0088":"\\u0088","\u0089":"\\u0089","\u008a":"\\u008a",
"\u008b":"\\u008b","\u008c":"\\u008c","\u008d":"\\u008d","\u008e":"\\u008e",
"\u008f":"\\u008f","\u0090":"\\u0090","\u0091":"\\u0091","\u0092":"\\u0092",
"\u0093":"\\u0093","\u0094":"\\u0094","\u0095":"\\u0095","\u0096":"\\u0096",
"\u0097":"\\u0097","\u0098":"\\u0098","\u0099":"\\u0099","\u009a":"\\u009a",
"\u009b":"\\u009b","\u009c":"\\u009c","\u009d":"\\u009d","\u009e":"\\u009e",
"\u009f":"\\u009f","\u00ad":"\\u00ad","\u0600":"\\u0600","\u0601":"\\u0601",
"\u0602":"\\u0602","\u0603":"\\u0603","\u0604":"\\u0604","\u070f":"\\u070f",
"\u17b4":"\\u17b4","\u17b5":"\\u17b5","\u200c":"\\u200c","\u200d":"\\u200d",
"\u200e":"\\u200e","\u200f":"\\u200f","\u2028":"\\u2028","\u2029":"\\u2029",
"\u202a":"\\u202a","\u202b":"\\u202b","\u202c":"\\u202c","\u202d":"\\u202d",
"\u202e":"\\u202e","\u202f":"\\u202f","\u2060":"\\u2060","\u2061":"\\u2061",
"\u2062":"\\u2062","\u2063":"\\u2063","\u2064":"\\u2064","\u2065":"\\u2065",
"\u2066":"\\u2066","\u2067":"\\u2067","\u2068":"\\u2068","\u2069":"\\u2069",
"\u206a":"\\u206a","\u206b":"\\u206b","\u206c":"\\u206c","\u206d":"\\u206d",
"\u206e":"\\u206e","\u206f":"\\u206f","\ufeff":"\\ufeff","\ufff0":"\\ufff0",
"\ufff1":"\\ufff1","\ufff2":"\\ufff2","\ufff3":"\\ufff3","\ufff4":"\\ufff4",
"\ufff5":"\\ufff5","\ufff6":"\\ufff6","\ufff7":"\\ufff7","\ufff8":"\\ufff8",
"\ufff9":"\\ufff9","\ufffa":"\\ufffa","\ufffb":"\\ufffb","\ufffc":"\\ufffc",
"\ufffd":"\\ufffd","\ufffe":"\\ufffe","\uffff":"\\uffff"};

// Some extra characters that Chrome gets wrong, and substitutes with
// something else on the wire.
var extra_escapable = /[\x00-\x1f\ud800-\udfff\ufffe\uffff\u0300-\u0333\u033d-\u0346\u034a-\u034c\u0350-\u0352\u0357-\u0358\u035c-\u0362\u0374\u037e\u0387\u0591-\u05af\u05c4\u0610-\u0617\u0653-\u0654\u0657-\u065b\u065d-\u065e\u06df-\u06e2\u06eb-\u06ec\u0730\u0732-\u0733\u0735-\u0736\u073a\u073d\u073f-\u0741\u0743\u0745\u0747\u07eb-\u07f1\u0951\u0958-\u095f\u09dc-\u09dd\u09df\u0a33\u0a36\u0a59-\u0a5b\u0a5e\u0b5c-\u0b5d\u0e38-\u0e39\u0f43\u0f4d\u0f52\u0f57\u0f5c\u0f69\u0f72-\u0f76\u0f78\u0f80-\u0f83\u0f93\u0f9d\u0fa2\u0fa7\u0fac\u0fb9\u1939-\u193a\u1a17\u1b6b\u1cda-\u1cdb\u1dc0-\u1dcf\u1dfc\u1dfe\u1f71\u1f73\u1f75\u1f77\u1f79\u1f7b\u1f7d\u1fbb\u1fbe\u1fc9\u1fcb\u1fd3\u1fdb\u1fe3\u1feb\u1fee-\u1fef\u1ff9\u1ffb\u1ffd\u2000-\u2001\u20d0-\u20d1\u20d4-\u20d7\u20e7-\u20e9\u2126\u212a-\u212b\u2329-\u232a\u2adc\u302b-\u302c\uaab2-\uaab3\uf900-\ufa0d\ufa10\ufa12\ufa15-\ufa1e\ufa20\ufa22\ufa25-\ufa26\ufa2a-\ufa2d\ufa30-\ufa6d\ufa70-\ufad9\ufb1d\ufb1f\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufb4e\ufff0-\uffff]/g,
    extra_lookup;

// JSON Quote string. Use native implementation when possible.
var JSONQuote = (JSON && JSON.stringify) || function(string) {
    json_escapable.lastIndex = 0;
    if (json_escapable.test(string)) {
        string = string.replace(json_escapable, function(a) {
            return json_lookup[a];
        });
    }
    return '"' + string + '"';
};

// This may be quite slow, so let's delay until user actually uses bad
// characters.
var unroll_lookup = function(escapable) {
    var i;
    var unrolled = {}
    var c = []
    for(i=0; i<65536; i++) {
        c.push( String.fromCharCode(i) );
    }
    escapable.lastIndex = 0;
    c.join('').replace(escapable, function (a) {
        unrolled[ a ] = '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        return '';
    });
    escapable.lastIndex = 0;
    return unrolled;
};

// Quote string, also taking care of unicode characters that browsers
// often break. Especially, take care of unicode surrogates:
//    http://en.wikipedia.org/wiki/Mapping_of_Unicode_characters#Surrogates
utils.quote = function(string) {
    var quoted = JSONQuote(string);

    // In most cases this should be very fast and good enough.
    extra_escapable.lastIndex = 0;
    if(!extra_escapable.test(quoted)) {
        return quoted;
    }

    if(!extra_lookup) extra_lookup = unroll_lookup(extra_escapable);

    return quoted.replace(extra_escapable, function(a) {
        return extra_lookup[a];
    });
}

var _all_protocols = ['websocket',
                      'xdr-streaming',
                      'xhr-streaming',
                      'iframe-eventsource',
                      'iframe-htmlfile',
                      'xdr-polling',
                      'xhr-polling',
                      'iframe-xhr-polling',
                      'jsonp-polling'];

utils.probeProtocols = function() {
    var probed = {};
    for(var i=0; i<_all_protocols.length; i++) {
        var protocol = _all_protocols[i];
        // User can have a typo in protocol name.
        probed[protocol] = SockJS[protocol] &&
                           SockJS[protocol].enabled();
    }
    return probed;
};

utils.detectProtocols = function(probed, protocols_whitelist, info) {
    var pe = {},
        protocols = [];
    if (!protocols_whitelist) protocols_whitelist = _all_protocols;
    for(var i=0; i<protocols_whitelist.length; i++) {
        var protocol = protocols_whitelist[i];
        pe[protocol] = probed[protocol];
    }
    var maybe_push = function(protos) {
        var proto = protos.shift();
        if (pe[proto]) {
            protocols.push(proto);
        } else {
            if (protos.length > 0) {
                maybe_push(protos);
            }
        }
    }

    // 1. Websocket
    if (info.websocket !== false) {
        maybe_push(['websocket']);
    }

    // 2. Streaming
    if (pe['xhr-streaming'] && !info.null_origin) {
        protocols.push('xhr-streaming');
    } else {
        if (pe['xdr-streaming'] && !info.cookie_needed && !info.null_origin) {
            protocols.push('xdr-streaming');
        } else {
            maybe_push(['iframe-eventsource',
                        'iframe-htmlfile']);
        }
    }

    // 3. Polling
    if (pe['xhr-polling'] && !info.null_origin) {
        protocols.push('xhr-polling');
    } else {
        if (pe['xdr-polling'] && !info.cookie_needed && !info.null_origin) {
            protocols.push('xdr-polling');
        } else {
            maybe_push(['iframe-xhr-polling',
                        'jsonp-polling']);
        }
    }
    return protocols;
}
//         [*] End of lib/utils.js


//         [*] Including lib/dom.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// May be used by htmlfile jsonp and transports.
var MPrefix = '_sockjs_global';
utils.createHook = function() {
    var window_id = 'a' + utils.random_string(8);
    if (!(MPrefix in _window)) {
        var map = {};
        _window[MPrefix] = function(window_id) {
            if (!(window_id in map)) {
                map[window_id] = {
                    id: window_id,
                    del: function() {delete map[window_id];}
                };
            }
            return map[window_id];
        }
    }
    return _window[MPrefix](window_id);
};



utils.attachMessage = function(listener) {
    utils.attachEvent('message', listener);
};
utils.attachEvent = function(event, listener) {
    if (typeof _window.addEventListener !== 'undefined') {
        _window.addEventListener(event, listener, false);
    } else {
        // IE quirks.
        // According to: http://stevesouders.com/misc/test-postmessage.php
        // the message gets delivered only to 'document', not 'window'.
        _document.attachEvent("on" + event, listener);
        // I get 'window' for ie8.
        _window.attachEvent("on" + event, listener);
    }
};

utils.detachMessage = function(listener) {
    utils.detachEvent('message', listener);
};
utils.detachEvent = function(event, listener) {
    if (typeof _window.addEventListener !== 'undefined') {
        _window.removeEventListener(event, listener, false);
    } else {
        _document.detachEvent("on" + event, listener);
        _window.detachEvent("on" + event, listener);
    }
};


var on_unload = {};
// Things registered after beforeunload are to be called immediately.
var after_unload = false;

var trigger_unload_callbacks = function() {
    for(var ref in on_unload) {
        on_unload[ref]();
        delete on_unload[ref];
    };
};

var unload_triggered = function() {
    if(after_unload) return;
    after_unload = true;
    trigger_unload_callbacks();
};

// Onbeforeunload alone is not reliable. We could use only 'unload'
// but it's not working in opera within an iframe. Let's use both.
utils.attachEvent('beforeunload', unload_triggered);
utils.attachEvent('unload', unload_triggered);

utils.unload_add = function(listener) {
    var ref = utils.random_string(8);
    on_unload[ref] = listener;
    if (after_unload) {
        utils.delay(trigger_unload_callbacks);
    }
    return ref;
};
utils.unload_del = function(ref) {
    if (ref in on_unload)
        delete on_unload[ref];
};


utils.createIframe = function (iframe_url, error_callback) {
    var iframe = _document.createElement('iframe');
    var tref, unload_ref;
    var unattach = function() {
        clearTimeout(tref);
        // Explorer had problems with that.
        try {iframe.onload = null;} catch (x) {}
        iframe.onerror = null;
    };
    var cleanup = function() {
        if (iframe) {
            unattach();
            // This timeout makes chrome fire onbeforeunload event
            // within iframe. Without the timeout it goes straight to
            // onunload.
            setTimeout(function() {
                if(iframe) {
                    iframe.parentNode.removeChild(iframe);
                }
                iframe = null;
            }, 0);
            utils.unload_del(unload_ref);
        }
    };
    var onerror = function(r) {
        if (iframe) {
            cleanup();
            error_callback(r);
        }
    };
    var post = function(msg, origin) {
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(msg, origin);
            }
        } catch (x) {};
    };

    iframe.src = iframe_url;
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.onerror = function(){onerror('onerror');};
    iframe.onload = function() {
        // `onload` is triggered before scripts on the iframe are
        // executed. Give it few seconds to actually load stuff.
        clearTimeout(tref);
        tref = setTimeout(function(){onerror('onload timeout');}, 2000);
    };
    _document.body.appendChild(iframe);
    tref = setTimeout(function(){onerror('timeout');}, 15000);
    unload_ref = utils.unload_add(cleanup);
    return {
        post: post,
        cleanup: cleanup,
        loaded: unattach
    };
};

utils.createHtmlfile = function (iframe_url, error_callback) {
    var doc = new ActiveXObject('htmlfile');
    var tref, unload_ref;
    var iframe;
    var unattach = function() {
        clearTimeout(tref);
    };
    var cleanup = function() {
        if (doc) {
            unattach();
            utils.unload_del(unload_ref);
            iframe.parentNode.removeChild(iframe);
            iframe = doc = null;
            CollectGarbage();
        }
    };
    var onerror = function(r)  {
        if (doc) {
            cleanup();
            error_callback(r);
        }
    };
    var post = function(msg, origin) {
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(msg, origin);
            }
        } catch (x) {};
    };

    doc.open();
    doc.write('<html><s' + 'cript>' +
              'document.domain="' + document.domain + '";' +
              '</s' + 'cript></html>');
    doc.close();
    doc.parentWindow[WPrefix] = _window[WPrefix];
    var c = doc.createElement('div');
    doc.body.appendChild(c);
    iframe = doc.createElement('iframe');
    c.appendChild(iframe);
    iframe.src = iframe_url;
    tref = setTimeout(function(){onerror('timeout');}, 15000);
    unload_ref = utils.unload_add(cleanup);
    return {
        post: post,
        cleanup: cleanup,
        loaded: unattach
    };
};
//         [*] End of lib/dom.js


//         [*] Including lib/dom2.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var AbstractXHRObject = function(){};
AbstractXHRObject.prototype = new EventEmitter(['chunk', 'finish']);

AbstractXHRObject.prototype._start = function(method, url, payload, opts) {
    var that = this;

    try {
        that.xhr = new XMLHttpRequest();
    } catch(x) {};

    if (!that.xhr) {
        try {
            that.xhr = new _window.ActiveXObject('Microsoft.XMLHTTP');
        } catch(x) {};
    }
    if (_window.ActiveXObject || _window.XDomainRequest) {
        // IE8 caches even POSTs
        url += ((url.indexOf('?') === -1) ? '?' : '&') + 't='+(+new Date);
    }

    // Explorer tends to keep connection open, even after the
    // tab gets closed: http://bugs.jquery.com/ticket/5280
    that.unload_ref = utils.unload_add(function(){that._cleanup(true);});
    try {
        that.xhr.open(method, url, true);
    } catch(e) {
        // IE raises an exception on wrong port.
        that.emit('finish', 0, '');
        that._cleanup();
        return;
    };

    if (!opts || !opts.no_credentials) {
        // Mozilla docs says https://developer.mozilla.org/en/XMLHttpRequest :
        // "This never affects same-site requests."
        that.xhr.withCredentials = 'true';
    }
    if (opts && opts.headers) {
        for(var key in opts.headers) {
            that.xhr.setRequestHeader(key, opts.headers[key]);
        }
    }

    that.xhr.onreadystatechange = function() {
        if (that.xhr) {
            var x = that.xhr;
            switch (x.readyState) {
            case 3:
                // IE doesn't like peeking into responseText or status
                // on Microsoft.XMLHTTP and readystate=3
                try {
                    var status = x.status;
                    var text = x.responseText;
                } catch (x) {};
                // IE does return readystate == 3 for 404 answers.
                if (text && text.length > 0) {
                    that.emit('chunk', status, text);
                }
                break;
            case 4:
                that.emit('finish', x.status, x.responseText);
                that._cleanup(false);
                break;
            }
        }
    };
    that.xhr.send(payload);
};

AbstractXHRObject.prototype._cleanup = function(abort) {
    var that = this;
    if (!that.xhr) return;
    utils.unload_del(that.unload_ref);

    // IE needs this field to be a function
    that.xhr.onreadystatechange = function(){};

    if (abort) {
        try {
            that.xhr.abort();
        } catch(x) {};
    }
    that.unload_ref = that.xhr = null;
};

AbstractXHRObject.prototype.close = function() {
    var that = this;
    that.nuke();
    that._cleanup(true);
};

var XHRCorsObject = utils.XHRCorsObject = function() {
    var that = this, args = arguments;
    utils.delay(function(){that._start.apply(that, args);});
};
XHRCorsObject.prototype = new AbstractXHRObject();

var XHRLocalObject = utils.XHRLocalObject = function(method, url, payload) {
    var that = this;
    utils.delay(function(){
        that._start(method, url, payload, {
            no_credentials: true
        });
    });
};
XHRLocalObject.prototype = new AbstractXHRObject();



// References:
//   http://ajaxian.com/archives/100-line-ajax-wrapper
//   http://msdn.microsoft.com/en-us/library/cc288060(v=VS.85).aspx
var XDRObject = utils.XDRObject = function(method, url, payload) {
    var that = this;
    utils.delay(function(){that._start(method, url, payload);});
};
XDRObject.prototype = new EventEmitter(['chunk', 'finish']);
XDRObject.prototype._start = function(method, url, payload) {
    var that = this;
    var xdr = new XDomainRequest();
    // IE caches even POSTs
    url += ((url.indexOf('?') === -1) ? '?' : '&') + 't='+(+new Date);

    var onerror = xdr.ontimeout = xdr.onerror = function() {
        that.emit('finish', 0, '');
        that._cleanup(false);
    };
    xdr.onprogress = function() {
        that.emit('chunk', 200, xdr.responseText);
    };
    xdr.onload = function() {
        that.emit('finish', 200, xdr.responseText);
        that._cleanup(false);
    };
    that.xdr = xdr;
    that.unload_ref = utils.unload_add(function(){that._cleanup(true);});
    try {
        // Fails with AccessDenied if port number is bogus
        that.xdr.open(method, url);
        that.xdr.send(payload);
    } catch(x) {
        onerror();
    }
};

XDRObject.prototype._cleanup = function(abort) {
    var that = this;
    if (!that.xdr) return;
    utils.unload_del(that.unload_ref);

    that.xdr.ontimeout = that.xdr.onerror = that.xdr.onprogress =
        that.xdr.onload = null;
    if (abort) {
        try {
            that.xdr.abort();
        } catch(x) {};
    }
    that.unload_ref = that.xdr = null;
};

XDRObject.prototype.close = function() {
    var that = this;
    that.nuke();
    that._cleanup(true);
};

// 1. Is natively via XHR
// 2. Is natively via XDR
// 3. Nope, but postMessage is there so it should work via the Iframe.
// 4. Nope, sorry.
utils.isXHRCorsCapable = function() {
    if (_window.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest()) {
        return 1;
    }
    // XDomainRequest doesn't work if page is served from file://
    if (_window.XDomainRequest && _document.domain) {
        return 2;
    }
    if (IframeTransport.enabled()) {
        return 3;
    }
    return 4;
};
//         [*] End of lib/dom2.js


//         [*] Including lib/sockjs.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var SockJS = function(url, dep_protocols_whitelist, options) {
    if (this === window) {
        // makes `new` optional
        return new SockJS(url, dep_protocols_whitelist, options);
    }
    
    var that = this, protocols_whitelist;
    that._options = {devel: false, debug: false, protocols_whitelist: [],
                     info: undefined, rtt: undefined};
    if (options) {
        utils.objectExtend(that._options, options);
    }
    that._base_url = utils.amendUrl(url);
    that._server = that._options.server || utils.random_number_string(1000);
    if (that._options.protocols_whitelist &&
        that._options.protocols_whitelist.length) {
        protocols_whitelist = that._options.protocols_whitelist;
    } else {
        // Deprecated API
        if (typeof dep_protocols_whitelist === 'string' &&
            dep_protocols_whitelist.length > 0) {
            protocols_whitelist = [dep_protocols_whitelist];
        } else if (utils.isArray(dep_protocols_whitelist)) {
            protocols_whitelist = dep_protocols_whitelist
        } else {
            protocols_whitelist = null;
        }
        if (protocols_whitelist) {
            that._debug('Deprecated API: Use "protocols_whitelist" option ' +
                        'instead of supplying protocol list as a second ' +
                        'parameter to SockJS constructor.');
        }
    }
    that._protocols = [];
    that.protocol = null;
    that.readyState = SockJS.CONNECTING;
    that._ir = createInfoReceiver(that._base_url);
    that._ir.onfinish = function(info, rtt) {
        that._ir = null;
        if (info) {
            if (that._options.info) {
                // Override if user supplies the option
                info = utils.objectExtend(info, that._options.info);
            }
            if (that._options.rtt) {
                rtt = that._options.rtt;
            }
            that._applyInfo(info, rtt, protocols_whitelist);
            that._didClose();
        } else {
            that._didClose(1002, 'Can\'t connect to server', true);
        }
    };
};
// Inheritance
SockJS.prototype = new REventTarget();

SockJS.version = "0.3.1.7.ga67f.dirty";

SockJS.CONNECTING = 0;
SockJS.OPEN = 1;
SockJS.CLOSING = 2;
SockJS.CLOSED = 3;

SockJS.prototype._debug = function() {
    if (this._options.debug)
        utils.log.apply(utils, arguments);
};

SockJS.prototype._dispatchOpen = function() {
    var that = this;
    if (that.readyState === SockJS.CONNECTING) {
        if (that._transport_tref) {
            clearTimeout(that._transport_tref);
            that._transport_tref = null;
        }
        that.readyState = SockJS.OPEN;
        that.dispatchEvent(new SimpleEvent("open"));
    } else {
        // The server might have been restarted, and lost track of our
        // connection.
        that._didClose(1006, "Server lost session");
    }
};

SockJS.prototype._dispatchMessage = function(data) {
    var that = this;
    if (that.readyState !== SockJS.OPEN)
            return;
    that.dispatchEvent(new SimpleEvent("message", {data: data}));
};

SockJS.prototype._dispatchHeartbeat = function(data) {
    var that = this;
    if (that.readyState !== SockJS.OPEN)
        return;
    that.dispatchEvent(new SimpleEvent('heartbeat', {}));
};

SockJS.prototype._didClose = function(code, reason, force) {
    var that = this;
    if (that.readyState !== SockJS.CONNECTING &&
        that.readyState !== SockJS.OPEN &&
        that.readyState !== SockJS.CLOSING)
            throw new Error('INVALID_STATE_ERR');
    if (that._ir) {
        that._ir.nuke();
        that._ir = null;
    }

    if (that._transport) {
        that._transport.doCleanup();
        that._transport = null;
    }

    var close_event = new SimpleEvent("close", {
        code: code,
        reason: reason,
        wasClean: utils.userSetCode(code)});

    if (!utils.userSetCode(code) &&
        that.readyState === SockJS.CONNECTING && !force) {
        if (that._try_next_protocol(close_event)) {
            return;
        }
        close_event = new SimpleEvent("close", {code: 2000,
                                                reason: "All transports failed",
                                                wasClean: false,
                                                last_event: close_event});
    }
    that.readyState = SockJS.CLOSED;

    utils.delay(function() {
                   that.dispatchEvent(close_event);
                });
};

SockJS.prototype._didMessage = function(data) {
    var that = this;
    var type = data.slice(0, 1);
    switch(type) {
    case 'o':
        that._dispatchOpen();
        break;
    case 'a':
        var payload = JSON.parse(data.slice(1) || '[]');
        for(var i=0; i < payload.length; i++){
            that._dispatchMessage(payload[i]);
        }
        break;
    case 'm':
        var payload = JSON.parse(data.slice(1) || 'null');
        that._dispatchMessage(payload);
        break;
    case 'c':
        var payload = JSON.parse(data.slice(1) || '[]');
        that._didClose(payload[0], payload[1]);
        break;
    case 'h':
        that._dispatchHeartbeat();
        break;
    }
};

SockJS.prototype._try_next_protocol = function(close_event) {
    var that = this;
    if (that.protocol) {
        that._debug('Closed transport:', that.protocol, ''+close_event);
        that.protocol = null;
    }
    if (that._transport_tref) {
        clearTimeout(that._transport_tref);
        that._transport_tref = null;
    }

    while(1) {
        var protocol = that.protocol = that._protocols.shift();
        if (!protocol) {
            return false;
        }
        // Some protocols require access to `body`, what if were in
        // the `head`?
        if (SockJS[protocol] &&
            SockJS[protocol].need_body === true &&
            (!_document.body ||
             (typeof _document.readyState !== 'undefined'
              && _document.readyState !== 'complete'))) {
            that._protocols.unshift(protocol);
            that.protocol = 'waiting-for-load';
            utils.attachEvent('load', function(){
                that._try_next_protocol();
            });
            return true;
        }

        if (!SockJS[protocol] ||
              !SockJS[protocol].enabled(that._options)) {
            that._debug('Skipping transport:', protocol);
        } else {
            var roundTrips = SockJS[protocol].roundTrips || 1;
            var to = ((that._options.rto || 0) * roundTrips) || 5000;
            that._transport_tref = utils.delay(to, function() {
                if (that.readyState === SockJS.CONNECTING) {
                    // I can't understand how it is possible to run
                    // this timer, when the state is CLOSED, but
                    // apparently in IE everythin is possible.
                    that._didClose(2007, "Transport timeouted");
                }
            });

            var connid = utils.random_string(8);
            var trans_url = that._base_url + '/' + that._server + '/' + connid;
            that._debug('Opening transport:', protocol, ' url:'+trans_url,
                        ' RTO:'+that._options.rto);
            that._transport = new SockJS[protocol](that, trans_url,
                                                   that._base_url);
            return true;
        }
    }
};

SockJS.prototype.close = function(code, reason) {
    var that = this;
    if (code && !utils.userSetCode(code))
        throw new Error("INVALID_ACCESS_ERR");
    if(that.readyState !== SockJS.CONNECTING &&
       that.readyState !== SockJS.OPEN) {
        return false;
    }
    that.readyState = SockJS.CLOSING;
    that._didClose(code || 1000, reason || "Normal closure");
    return true;
};

SockJS.prototype.send = function(data) {
    var that = this;
    if (that.readyState === SockJS.CONNECTING)
        throw new Error('INVALID_STATE_ERR');
    if (that.readyState === SockJS.OPEN) {
        that._transport.doSend(utils.quote('' + data));
    }
    return true;
};

SockJS.prototype._applyInfo = function(info, rtt, protocols_whitelist) {
    var that = this;
    that._options.info = info;
    that._options.rtt = rtt;
    that._options.rto = utils.countRTO(rtt);
    that._options.info.null_origin = !_document.domain;
    var probed = utils.probeProtocols();
    that._protocols = utils.detectProtocols(probed, protocols_whitelist, info);
};
//         [*] End of lib/sockjs.js


//         [*] Including lib/trans-websocket.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var WebSocketTransport = SockJS.websocket = function(ri, trans_url) {
    var that = this;
    var url = trans_url + '/websocket';
    if (url.slice(0, 5) === 'https') {
        url = 'wss' + url.slice(5);
    } else {
        url = 'ws' + url.slice(4);
    }
    that.ri = ri;
    that.url = url;
    var Constructor = _window.WebSocket || _window.MozWebSocket;

    that.ws = new Constructor(that.url);
    that.ws.onmessage = function(e) {
        that.ri._didMessage(e.data);
    };
    // Firefox has an interesting bug. If a websocket connection is
    // created after onbeforeunload, it stays alive even when user
    // navigates away from the page. In such situation let's lie -
    // let's not open the ws connection at all. See:
    // https://github.com/sockjs/sockjs-client/issues/28
    // https://bugzilla.mozilla.org/show_bug.cgi?id=696085
    that.unload_ref = utils.unload_add(function(){that.ws.close()});
    that.ws.onclose = function() {
        that.ri._didMessage(utils.closeFrame(1006, "WebSocket connection broken"));
    };
};

WebSocketTransport.prototype.doSend = function(data) {
    this.ws.send('[' + data + ']');
};

WebSocketTransport.prototype.doCleanup = function() {
    var that = this;
    var ws = that.ws;
    if (ws) {
        ws.onmessage = ws.onclose = null;
        ws.close();
        utils.unload_del(that.unload_ref);
        that.unload_ref = that.ri = that.ws = null;
    }
};

WebSocketTransport.enabled = function() {
    return !!(_window.WebSocket || _window.MozWebSocket);
};

// In theory, ws should require 1 round trip. But in chrome, this is
// not very stable over SSL. Most likely a ws connection requires a
// separate SSL connection, in which case 2 round trips are an
// absolute minumum.
WebSocketTransport.roundTrips = 2;
//         [*] End of lib/trans-websocket.js


//         [*] Including lib/trans-sender.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var BufferedSender = function() {};
BufferedSender.prototype.send_constructor = function(sender) {
    var that = this;
    that.send_buffer = [];
    that.sender = sender;
};
BufferedSender.prototype.doSend = function(message) {
    var that = this;
    that.send_buffer.push(message);
    if (!that.send_stop) {
        that.send_schedule();
    }
};

// For polling transports in a situation when in the message callback,
// new message is being send. If the sending connection was started
// before receiving one, it is possible to saturate the network and
// timeout due to the lack of receiving socket. To avoid that we delay
// sending messages by some small time, in order to let receiving
// connection be started beforehand. This is only a halfmeasure and
// does not fix the big problem, but it does make the tests go more
// stable on slow networks.
BufferedSender.prototype.send_schedule_wait = function() {
    var that = this;
    var tref;
    that.send_stop = function() {
        that.send_stop = null;
        clearTimeout(tref);
    };
    tref = utils.delay(25, function() {
        that.send_stop = null;
        that.send_schedule();
    });
};

BufferedSender.prototype.send_schedule = function() {
    var that = this;
    if (that.send_buffer.length > 0) {
        var payload = '[' + that.send_buffer.join(',') + ']';
        that.send_stop = that.sender(that.trans_url,
                                     payload,
                                     function() {
                                         that.send_stop = null;
                                         that.send_schedule_wait();
                                     });
        that.send_buffer = [];
    }
};

BufferedSender.prototype.send_destructor = function() {
    var that = this;
    if (that._send_stop) {
        that._send_stop();
    }
    that._send_stop = null;
};

var jsonPGenericSender = function(url, payload, callback) {
    var that = this;

    if (!('_send_form' in that)) {
        var form = that._send_form = _document.createElement('form');
        var area = that._send_area = _document.createElement('textarea');
        area.name = 'd';
        form.style.display = 'none';
        form.style.position = 'absolute';
        form.method = 'POST';
        form.enctype = 'application/x-www-form-urlencoded';
        form.acceptCharset = "UTF-8";
        form.appendChild(area);
        _document.body.appendChild(form);
    }
    var form = that._send_form;
    var area = that._send_area;
    var id = 'a' + utils.random_string(8);
    form.target = id;
    form.action = url + '/jsonp_send?i=' + id;

    var iframe;
    try {
        // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
        iframe = _document.createElement('<iframe name="'+ id +'">');
    } catch(x) {
        iframe = _document.createElement('iframe');
        iframe.name = id;
    }
    iframe.id = id;
    form.appendChild(iframe);
    iframe.style.display = 'none';

    try {
        area.value = payload;
    } catch(e) {
        utils.log('Your browser is seriously broken. Go home! ' + e.message);
    }
    form.submit();

    var completed = function(e) {
        if (!iframe.onerror) return;
        iframe.onreadystatechange = iframe.onerror = iframe.onload = null;
        // Opera mini doesn't like if we GC iframe
        // immediately, thus this timeout.
        utils.delay(500, function() {
                       iframe.parentNode.removeChild(iframe);
                       iframe = null;
                   });
        area.value = '';
        callback();
    };
    iframe.onerror = iframe.onload = completed;
    iframe.onreadystatechange = function(e) {
        if (iframe.readyState == 'complete') completed();
    };
    return completed;
};

var createAjaxSender = function(AjaxObject) {
    return function(url, payload, callback) {
        var xo = new AjaxObject('POST', url + '/xhr_send', payload);
        xo.onfinish = function(status, text) {
            callback(status);
        };
        return function(abort_reason) {
            callback(0, abort_reason);
        };
    };
};
//         [*] End of lib/trans-sender.js


//         [*] Including lib/trans-jsonp-receiver.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// Parts derived from Socket.io:
//    https://github.com/LearnBoost/socket.io/blob/0.6.17/lib/socket.io/transports/jsonp-polling.js
// and jQuery-JSONP:
//    https://code.google.com/p/jquery-jsonp/source/browse/trunk/core/jquery.jsonp.js
var jsonPGenericReceiver = function(url, callback) {
    var tref;
    var script = _document.createElement('script');
    var script2;  // Opera synchronous load trick.
    var close_script = function(frame) {
        if (script2) {
            script2.parentNode.removeChild(script2);
            script2 = null;
        }
        if (script) {
            clearTimeout(tref);
            script.parentNode.removeChild(script);
            script.onreadystatechange = script.onerror =
                script.onload = script.onclick = null;
            script = null;
            callback(frame);
            callback = null;
        }
    };

    // IE9 fires 'error' event after orsc or before, in random order.
    var loaded_okay = false;
    var error_timer = null;

    script.id = 'a' + utils.random_string(8);
    script.src = url;
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.onerror = function(e) {
        if (!error_timer) {
            // Delay firing close_script.
            error_timer = setTimeout(function() {
                if (!loaded_okay) {
                    close_script(utils.closeFrame(
                        1006,
                        "JSONP script loaded abnormally (onerror)"));
                }
            }, 1000);
        }
    };
    script.onload = function(e) {
        close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (onload)"));
    };

    script.onreadystatechange = function(e) {
        if (/loaded|closed/.test(script.readyState)) {
            if (script && script.htmlFor && script.onclick) {
                loaded_okay = true;
                try {
                    // In IE, actually execute the script.
                    script.onclick();
                } catch (x) {}
            }
            if (script) {
                close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (onreadystatechange)"));
            }
        }
    };
    // IE: event/htmlFor/onclick trick.
    // One can't rely on proper order for onreadystatechange. In order to
    // make sure, set a 'htmlFor' and 'event' properties, so that
    // script code will be installed as 'onclick' handler for the
    // script object. Later, onreadystatechange, manually execute this
    // code. FF and Chrome doesn't work with 'event' and 'htmlFor'
    // set. For reference see:
    //   http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
    // Also, read on that about script ordering:
    //   http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
    if (typeof script.async === 'undefined' && _document.attachEvent) {
        // According to mozilla docs, in recent browsers script.async defaults
        // to 'true', so we may use it to detect a good browser:
        // https://developer.mozilla.org/en/HTML/Element/script
        if (!/opera/i.test(navigator.userAgent)) {
            // Naively assume we're in IE
            try {
                script.htmlFor = script.id;
                script.event = "onclick";
            } catch (x) {}
            script.async = true;
        } else {
            // Opera, second sync script hack
            script2 = _document.createElement('script');
            script2.text = "try{var a = document.getElementById('"+script.id+"'); if(a)a.onerror();}catch(x){};";
            script.async = script2.async = false;
        }
    }
    if (typeof script.async !== 'undefined') {
        script.async = true;
    }

    // Fallback mostly for Konqueror - stupid timer, 35 seconds shall be plenty.
    tref = setTimeout(function() {
                          close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (timeout)"));
                      }, 35000);

    var head = _document.getElementsByTagName('head')[0];
    head.insertBefore(script, head.firstChild);
    if (script2) {
        head.insertBefore(script2, head.firstChild);
    }
    return close_script;
};
//         [*] End of lib/trans-jsonp-receiver.js


//         [*] Including lib/trans-jsonp-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// The simplest and most robust transport, using the well-know cross
// domain hack - JSONP. This transport is quite inefficient - one
// mssage could use up to one http request. But at least it works almost
// everywhere.
// Known limitations:
//   o you will get a spinning cursor
//   o for Konqueror a dumb timer is needed to detect errors


var JsonPTransport = SockJS['jsonp-polling'] = function(ri, trans_url) {
    utils.polluteGlobalNamespace();
    var that = this;
    that.ri = ri;
    that.trans_url = trans_url;
    that.send_constructor(jsonPGenericSender);
    that._schedule_recv();
};

// Inheritnace
JsonPTransport.prototype = new BufferedSender();

JsonPTransport.prototype._schedule_recv = function() {
    var that = this;
    var callback = function(data) {
        that._recv_stop = null;
        if (data) {
            // no data - heartbeat;
            if (!that._is_closing) {
                that.ri._didMessage(data);
            }
        }
        // The message can be a close message, and change is_closing state.
        if (!that._is_closing) {
            that._schedule_recv();
        }
    };
    that._recv_stop = jsonPReceiverWrapper(that.trans_url + '/jsonp',
                                           jsonPGenericReceiver, callback);
};

JsonPTransport.enabled = function() {
    return true;
};

JsonPTransport.need_body = true;


JsonPTransport.prototype.doCleanup = function() {
    var that = this;
    that._is_closing = true;
    if (that._recv_stop) {
        that._recv_stop();
    }
    that.ri = that._recv_stop = null;
    that.send_destructor();
};


// Abstract away code that handles global namespace pollution.
var jsonPReceiverWrapper = function(url, constructReceiver, user_callback) {
    var id = 'a' + utils.random_string(6);
    var url_id = url + '?c=' + escape(WPrefix + '.' + id);
    // Callback will be called exactly once.
    var callback = function(frame) {
        delete _window[WPrefix][id];
        user_callback(frame);
    };

    var close_script = constructReceiver(url_id, callback);
    _window[WPrefix][id] = close_script;
    var stop = function() {
        if (_window[WPrefix][id]) {
            _window[WPrefix][id](utils.closeFrame(1000, "JSONP user aborted read"));
        }
    };
    return stop;
};
//         [*] End of lib/trans-jsonp-polling.js


//         [*] Including lib/trans-xhr.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var AjaxBasedTransport = function() {};
AjaxBasedTransport.prototype = new BufferedSender();

AjaxBasedTransport.prototype.run = function(ri, trans_url,
                                            url_suffix, Receiver, AjaxObject) {
    var that = this;
    that.ri = ri;
    that.trans_url = trans_url;
    that.send_constructor(createAjaxSender(AjaxObject));
    that.poll = new Polling(ri, Receiver,
                            trans_url + url_suffix, AjaxObject);
};

AjaxBasedTransport.prototype.doCleanup = function() {
    var that = this;
    if (that.poll) {
        that.poll.abort();
        that.poll = null;
    }
};

// xhr-streaming
var XhrStreamingTransport = SockJS['xhr-streaming'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr_streaming', XhrReceiver, utils.XHRCorsObject);
};

XhrStreamingTransport.prototype = new AjaxBasedTransport();

XhrStreamingTransport.enabled = function() {
    // Support for CORS Ajax aka Ajax2? Opera 12 claims CORS but
    // doesn't do streaming.
    return (_window.XMLHttpRequest &&
            'withCredentials' in new XMLHttpRequest() &&
            (!/opera/i.test(navigator.userAgent)));
};
XhrStreamingTransport.roundTrips = 2; // preflight, ajax

// Safari gets confused when a streaming ajax request is started
// before onload. This causes the load indicator to spin indefinetely.
XhrStreamingTransport.need_body = true;


// According to:
//   http://stackoverflow.com/questions/1641507/detect-browser-support-for-cross-domain-xmlhttprequests
//   http://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/


// xdr-streaming
var XdrStreamingTransport = SockJS['xdr-streaming'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr_streaming', XhrReceiver, utils.XDRObject);
};

XdrStreamingTransport.prototype = new AjaxBasedTransport();

XdrStreamingTransport.enabled = function() {
    return !!_window.XDomainRequest;
};
XdrStreamingTransport.roundTrips = 2; // preflight, ajax



// xhr-polling
var XhrPollingTransport = SockJS['xhr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XHRCorsObject);
};

XhrPollingTransport.prototype = new AjaxBasedTransport();

XhrPollingTransport.enabled = XhrStreamingTransport.enabled;
XhrPollingTransport.roundTrips = 2; // preflight, ajax


// xdr-polling
var XdrPollingTransport = SockJS['xdr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XDRObject);
};

XdrPollingTransport.prototype = new AjaxBasedTransport();

XdrPollingTransport.enabled = XdrStreamingTransport.enabled;
XdrPollingTransport.roundTrips = 2; // preflight, ajax
//         [*] End of lib/trans-xhr.js


//         [*] Including lib/trans-iframe.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// Few cool transports do work only for same-origin. In order to make
// them working cross-domain we shall use iframe, served form the
// remote domain. New browsers, have capabilities to communicate with
// cross domain iframe, using postMessage(). In IE it was implemented
// from IE 8+, but of course, IE got some details wrong:
//    http://msdn.microsoft.com/en-us/library/cc197015(v=VS.85).aspx
//    http://stevesouders.com/misc/test-postmessage.php

var IframeTransport = function() {};

IframeTransport.prototype.i_constructor = function(ri, trans_url, base_url) {
    var that = this;
    that.ri = ri;
    that.origin = utils.getOrigin(base_url);
    that.base_url = base_url;
    that.trans_url = trans_url;

    var iframe_url = base_url + '/iframe.html';
    if (that.ri._options.devel) {
        iframe_url += '?t=' + (+new Date);
    }
    that.window_id = utils.random_string(8);
    iframe_url += '#' + that.window_id;

    that.iframeObj = utils.createIframe(iframe_url, function(r) {
                                            that.ri._didClose(1006, "Unable to load an iframe (" + r + ")");
                                        });

    that.onmessage_cb = utils.bind(that.onmessage, that);
    utils.attachMessage(that.onmessage_cb);
};

IframeTransport.prototype.doCleanup = function() {
    var that = this;
    if (that.iframeObj) {
        utils.detachMessage(that.onmessage_cb);
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (that.iframeObj.iframe.contentWindow) {
                that.postMessage('c');
            }
        } catch (x) {}
        that.iframeObj.cleanup();
        that.iframeObj = null;
        that.onmessage_cb = that.iframeObj = null;
    }
};

IframeTransport.prototype.onmessage = function(e) {
    var that = this;
    if (e.origin !== that.origin) return;
    var window_id = e.data.slice(0, 8);
    var type = e.data.slice(8, 9);
    var data = e.data.slice(9);

    if (window_id !== that.window_id) return;

    switch(type) {
    case 's':
        that.iframeObj.loaded();
        that.postMessage('s', JSON.stringify([SockJS.version, that.protocol, that.trans_url, that.base_url]));
        break;
    case 't':
        that.ri._didMessage(data);
        break;
    }
};

IframeTransport.prototype.postMessage = function(type, data) {
    var that = this;
    that.iframeObj.post(that.window_id + type + (data || ''), that.origin);
};

IframeTransport.prototype.doSend = function (message) {
    this.postMessage('m', message);
};

IframeTransport.enabled = function() {
    // postMessage misbehaves in konqueror 4.6.5 - the messages are delivered with
    // huge delay, or not at all.
    var konqueror = navigator && navigator.userAgent && navigator.userAgent.indexOf('Konqueror') !== -1;
    return ((typeof _window.postMessage === 'function' ||
            typeof _window.postMessage === 'object') && (!konqueror));
};
//         [*] End of lib/trans-iframe.js


//         [*] Including lib/trans-iframe-within.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var curr_window_id;

var postMessage = function (type, data) {
    if(parent !== _window) {
        parent.postMessage(curr_window_id + type + (data || ''), '*');
    } else {
        utils.log("Can't postMessage, no parent window.", type, data);
    }
};

var FacadeJS = function() {};
FacadeJS.prototype._didClose = function (code, reason) {
    postMessage('t', utils.closeFrame(code, reason));
};
FacadeJS.prototype._didMessage = function (frame) {
    postMessage('t', frame);
};
FacadeJS.prototype._doSend = function (data) {
    this._transport.doSend(data);
};
FacadeJS.prototype._doCleanup = function () {
    this._transport.doCleanup();
};

utils.parent_origin = undefined;

SockJS.bootstrap_iframe = function() {
    var facade;
    curr_window_id = _document.location.hash.slice(1);
    var onMessage = function(e) {
        if(e.source !== parent) return;
        if(typeof utils.parent_origin === 'undefined')
            utils.parent_origin = e.origin;
        if (e.origin !== utils.parent_origin) return;

        var window_id = e.data.slice(0, 8);
        var type = e.data.slice(8, 9);
        var data = e.data.slice(9);
        if (window_id !== curr_window_id) return;
        switch(type) {
        case 's':
            var p = JSON.parse(data);
            var version = p[0];
            var protocol = p[1];
            var trans_url = p[2];
            var base_url = p[3];
            if (version !== SockJS.version) {
                utils.log("Incompatibile SockJS! Main site uses:" +
                          " \"" + version + "\", the iframe:" +
                          " \"" + SockJS.version + "\".");
            }
            if (!utils.flatUrl(trans_url) || !utils.flatUrl(base_url)) {
                utils.log("Only basic urls are supported in SockJS");
                return;
            }

            if (!utils.isSameOriginUrl(trans_url) ||
                !utils.isSameOriginUrl(base_url)) {
                utils.log("Can't connect to different domain from within an " +
                          "iframe. (" + JSON.stringify([_window.location.href, trans_url, base_url]) +
                          ")");
                return;
            }
            facade = new FacadeJS();
            facade._transport = new FacadeJS[protocol](facade, trans_url, base_url);
            break;
        case 'm':
            facade._doSend(data);
            break;
        case 'c':
            if (facade)
                facade._doCleanup();
            facade = null;
            break;
        }
    };

    // alert('test ticker');
    // facade = new FacadeJS();
    // facade._transport = new FacadeJS['w-iframe-xhr-polling'](facade, 'http://host.com:9999/ticker/12/basd');

    utils.attachMessage(onMessage);

    // Start
    postMessage('s');
};
//         [*] End of lib/trans-iframe-within.js


//         [*] Including lib/info.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var InfoReceiver = function(base_url, AjaxObject) {
    var that = this;
    utils.delay(function(){that.doXhr(base_url, AjaxObject);});
};

InfoReceiver.prototype = new EventEmitter(['finish']);

InfoReceiver.prototype.doXhr = function(base_url, AjaxObject) {
    var that = this;
    var t0 = (new Date()).getTime();
    var xo = new AjaxObject('GET', base_url + '/info');

    var tref = utils.delay(8000,
                           function(){xo.ontimeout();});

    xo.onfinish = function(status, text) {
        clearTimeout(tref);
        tref = null;
        if (status === 200) {
            var rtt = (new Date()).getTime() - t0;
            var info = JSON.parse(text);
            if (typeof info !== 'object') info = {};
            that.emit('finish', info, rtt);
        } else {
            that.emit('finish');
        }
    };
    xo.ontimeout = function() {
        xo.close();
        that.emit('finish');
    };
};

var InfoReceiverIframe = function(base_url) {
    var that = this;
    var go = function() {
        var ifr = new IframeTransport();
        ifr.protocol = 'w-iframe-info-receiver';
        var fun = function(r) {
            if (typeof r === 'string' && r.substr(0,1) === 'm') {
                var d = JSON.parse(r.substr(1));
                var info = d[0], rtt = d[1];
                that.emit('finish', info, rtt);
            } else {
                that.emit('finish');
            }
            ifr.doCleanup();
            ifr = null;
        };
        var mock_ri = {
            _options: {},
            _didClose: fun,
            _didMessage: fun
        };
        ifr.i_constructor(mock_ri, base_url, base_url);
    }
    if(!_document.body) {
        utils.attachEvent('load', go);
    } else {
        go();
    }
};
InfoReceiverIframe.prototype = new EventEmitter(['finish']);


var InfoReceiverFake = function() {
    // It may not be possible to do cross domain AJAX to get the info
    // data, for example for IE7. But we want to run JSONP, so let's
    // fake the response, with rtt=2s (rto=6s).
    var that = this;
    utils.delay(function() {
        that.emit('finish', {}, 2000);
    });
};
InfoReceiverFake.prototype = new EventEmitter(['finish']);

var createInfoReceiver = function(base_url) {
    if (utils.isSameOriginUrl(base_url)) {
        // If, for some reason, we have SockJS locally - there's no
        // need to start up the complex machinery. Just use ajax.
        return new InfoReceiver(base_url, utils.XHRLocalObject);
    }
    switch (utils.isXHRCorsCapable()) {
    case 1:
        return new InfoReceiver(base_url, utils.XHRCorsObject);
    case 2:
        return new InfoReceiver(base_url, utils.XDRObject);
    case 3:
        // Opera
        return new InfoReceiverIframe(base_url);
    default:
        // IE 7
        return new InfoReceiverFake();
    };
};


var WInfoReceiverIframe = FacadeJS['w-iframe-info-receiver'] = function(ri, _trans_url, base_url) {
    var ir = new InfoReceiver(base_url, utils.XHRLocalObject);
    ir.onfinish = function(info, rtt) {
        ri._didMessage('m'+JSON.stringify([info, rtt]));
        ri._didClose();
    }
};
WInfoReceiverIframe.prototype.doCleanup = function() {};
//         [*] End of lib/info.js


//         [*] Including lib/trans-iframe-eventsource.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventSourceIframeTransport = SockJS['iframe-eventsource'] = function () {
    var that = this;
    that.protocol = 'w-iframe-eventsource';
    that.i_constructor.apply(that, arguments);
};

EventSourceIframeTransport.prototype = new IframeTransport();

EventSourceIframeTransport.enabled = function () {
    return ('EventSource' in _window) && IframeTransport.enabled();
};

EventSourceIframeTransport.need_body = true;
EventSourceIframeTransport.roundTrips = 3; // html, javascript, eventsource


// w-iframe-eventsource
var EventSourceTransport = FacadeJS['w-iframe-eventsource'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/eventsource', EventSourceReceiver, utils.XHRLocalObject);
}
EventSourceTransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-eventsource.js


//         [*] Including lib/trans-iframe-xhr-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var XhrPollingIframeTransport = SockJS['iframe-xhr-polling'] = function () {
    var that = this;
    that.protocol = 'w-iframe-xhr-polling';
    that.i_constructor.apply(that, arguments);
};

XhrPollingIframeTransport.prototype = new IframeTransport();

XhrPollingIframeTransport.enabled = function () {
    return _window.XMLHttpRequest && IframeTransport.enabled();
};

XhrPollingIframeTransport.need_body = true;
XhrPollingIframeTransport.roundTrips = 3; // html, javascript, xhr


// w-iframe-xhr-polling
var XhrPollingITransport = FacadeJS['w-iframe-xhr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XHRLocalObject);
};

XhrPollingITransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-xhr-polling.js


//         [*] Including lib/trans-iframe-htmlfile.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// This transport generally works in any browser, but will cause a
// spinning cursor to appear in any browser other than IE.
// We may test this transport in all browsers - why not, but in
// production it should be only run in IE.

var HtmlFileIframeTransport = SockJS['iframe-htmlfile'] = function () {
    var that = this;
    that.protocol = 'w-iframe-htmlfile';
    that.i_constructor.apply(that, arguments);
};

// Inheritance.
HtmlFileIframeTransport.prototype = new IframeTransport();

HtmlFileIframeTransport.enabled = function() {
    return IframeTransport.enabled();
};

HtmlFileIframeTransport.need_body = true;
HtmlFileIframeTransport.roundTrips = 3; // html, javascript, htmlfile


// w-iframe-htmlfile
var HtmlFileTransport = FacadeJS['w-iframe-htmlfile'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/htmlfile', HtmlfileReceiver, utils.XHRLocalObject);
};
HtmlFileTransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-htmlfile.js


//         [*] Including lib/trans-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var Polling = function(ri, Receiver, recv_url, AjaxObject) {
    var that = this;
    that.ri = ri;
    that.Receiver = Receiver;
    that.recv_url = recv_url;
    that.AjaxObject = AjaxObject;
    that._scheduleRecv();
};

Polling.prototype._scheduleRecv = function() {
    var that = this;
    var poll = that.poll = new that.Receiver(that.recv_url, that.AjaxObject);
    var msg_counter = 0;
    poll.onmessage = function(e) {
        msg_counter += 1;
        that.ri._didMessage(e.data);
    };
    poll.onclose = function(e) {
        that.poll = poll = poll.onmessage = poll.onclose = null;
        if (!that.poll_is_closing) {
            if (e.reason === 'permanent') {
                that.ri._didClose(1006, 'Polling error (' + e.reason + ')');
            } else {
                that._scheduleRecv();
            }
        }
    };
};

Polling.prototype.abort = function() {
    var that = this;
    that.poll_is_closing = true;
    if (that.poll) {
        that.poll.abort();
    }
};
//         [*] End of lib/trans-polling.js


//         [*] Including lib/trans-receiver-eventsource.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventSourceReceiver = function(url) {
    var that = this;
    var es = new EventSource(url);
    es.onmessage = function(e) {
        that.dispatchEvent(new SimpleEvent('message',
                                           {'data': unescape(e.data)}));
    };
    that.es_close = es.onerror = function(e, abort_reason) {
        // ES on reconnection has readyState = 0 or 1.
        // on network error it's CLOSED = 2
        var reason = abort_reason ? 'user' :
            (es.readyState !== 2 ? 'network' : 'permanent');
        that.es_close = es.onmessage = es.onerror = null;
        // EventSource reconnects automatically.
        es.close();
        es = null;
        // Safari and chrome < 15 crash if we close window before
        // waiting for ES cleanup. See:
        //   https://code.google.com/p/chromium/issues/detail?id=89155
        utils.delay(200, function() {
                        that.dispatchEvent(new SimpleEvent('close', {reason: reason}));
                    });
    };
};

EventSourceReceiver.prototype = new REventTarget();

EventSourceReceiver.prototype.abort = function() {
    var that = this;
    if (that.es_close) {
        that.es_close({}, true);
    }
};
//         [*] End of lib/trans-receiver-eventsource.js


//         [*] Including lib/trans-receiver-htmlfile.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var _is_ie_htmlfile_capable;
var isIeHtmlfileCapable = function() {
    if (_is_ie_htmlfile_capable === undefined) {
        if ('ActiveXObject' in _window) {
            try {
                _is_ie_htmlfile_capable = !!new ActiveXObject('htmlfile');
            } catch (x) {}
        } else {
            _is_ie_htmlfile_capable = false;
        }
    }
    return _is_ie_htmlfile_capable;
};


var HtmlfileReceiver = function(url) {
    var that = this;
    utils.polluteGlobalNamespace();

    that.id = 'a' + utils.random_string(6, 26);
    url += ((url.indexOf('?') === -1) ? '?' : '&') +
        'c=' + escape(WPrefix + '.' + that.id);

    var constructor = isIeHtmlfileCapable() ?
        utils.createHtmlfile : utils.createIframe;

    var iframeObj;
    _window[WPrefix][that.id] = {
        start: function () {
            iframeObj.loaded();
        },
        message: function (data) {
            that.dispatchEvent(new SimpleEvent('message', {'data': data}));
        },
        stop: function () {
            that.iframe_close({}, 'network');
        }
    };
    that.iframe_close = function(e, abort_reason) {
        iframeObj.cleanup();
        that.iframe_close = iframeObj = null;
        delete _window[WPrefix][that.id];
        that.dispatchEvent(new SimpleEvent('close', {reason: abort_reason}));
    };
    iframeObj = constructor(url, function(e) {
                                that.iframe_close({}, 'permanent');
                            });
};

HtmlfileReceiver.prototype = new REventTarget();

HtmlfileReceiver.prototype.abort = function() {
    var that = this;
    if (that.iframe_close) {
        that.iframe_close({}, 'user');
    }
};
//         [*] End of lib/trans-receiver-htmlfile.js


//         [*] Including lib/trans-receiver-xhr.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var XhrReceiver = function(url, AjaxObject) {
    var that = this;
    var buf_pos = 0;

    that.xo = new AjaxObject('POST', url, null);
    that.xo.onchunk = function(status, text) {
        if (status !== 200) return;
        while (1) {
            var buf = text.slice(buf_pos);
            var p = buf.indexOf('\n');
            if (p === -1) break;
            buf_pos += p+1;
            var msg = buf.slice(0, p);
            that.dispatchEvent(new SimpleEvent('message', {data: msg}));
        }
    };
    that.xo.onfinish = function(status, text) {
        that.xo.onchunk(status, text);
        that.xo = null;
        var reason = status === 200 ? 'network' : 'permanent';
        that.dispatchEvent(new SimpleEvent('close', {reason: reason}));
    }
};

XhrReceiver.prototype = new REventTarget();

XhrReceiver.prototype.abort = function() {
    var that = this;
    if (that.xo) {
        that.xo.close();
        that.dispatchEvent(new SimpleEvent('close', {reason: 'user'}));
        that.xo = null;
    }
};
//         [*] End of lib/trans-receiver-xhr.js


//         [*] Including lib/test-hooks.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// For testing
SockJS.getUtils = function(){
    return utils;
};

SockJS.getIframeTransport = function(){
    return IframeTransport;
};
//         [*] End of lib/test-hooks.js

                  return SockJS;
          })();
if ('_sockjs_onload' in window) setTimeout(_sockjs_onload, 1);

// AMD compliance
if (typeof define === 'function' && define.amd) {
    define('sockjs', [], function(){return SockJS;});
}

if (typeof module === 'object' && module && module.exports) {
    module.exports = SockJS;
}
//     [*] End of lib/index.js

// [*] End of lib/all.js


})()
},{}],26:[function(require,module,exports){
(function(process){var EventEmitter = require('events').EventEmitter
var i = require('iterate')
var duplex = require('duplex')
var inherits = require('util').inherits
var serializer = require('stream-serializer')
var u = require('./util')
var timestamp = require('monotonic-timestamp')

exports = 
module.exports = Scuttlebutt

exports.createID = u.createID
exports.updateIsRecent = u.filter
exports.filter = u.filter
exports.timestamp = timestamp

function dutyOfSubclass() {
  throw new Error('method must be implemented by subclass')
}

function validate (data) {
  if(!(Array.isArray(data) 
    && 'string' === typeof data[2]
    && '__proto__'     !== data[2] //THIS WOULD BREAK STUFF
    && 'number' === typeof data[1]
  )) return false

  return true
}

var emit = EventEmitter.prototype.emit

inherits (Scuttlebutt, EventEmitter)

function Scuttlebutt (opts) {

  if(!(this instanceof Scuttlebutt)) return new Scuttlebutt(opts)
  var id = 'string' === typeof opts ? opts : opts && opts.id
  this.sources = {}
  this.setMaxListeners(Number.MAX_VALUE)
  //count how many other instances we are replicating to.
  this._streams = 0
  if(opts && opts.sign && opts.verify) {
    this.setId(opts.id || opts.createId())
    this._sign   = opts.sign
    this._verify = opts.verify
  } else {
    this.setId(id || u.createId())
  }
}

var sb = Scuttlebutt.prototype

var emit = EventEmitter.prototype.emit

sb.applyUpdate = dutyOfSubclass
sb.history      = dutyOfSubclass

sb.localUpdate = function (trx) {
  this._update([trx, timestamp(), this.id])
  return this
}

sb._update = function (update) {
  //validated when it comes into the stream
  var ts = update[1]
  var source = update[2]
  //if this message is old for it's source,
  //ignore it. it's out of order.
  //each node must emit it's changes in order!
  
  var latest = this.sources[source]
  if(latest && latest >= ts)
    return emit.call(this, 'old_data', update), false

  this.sources[source] = ts

  var self = this
  function didVerification (err, verified) {

    // I'm not sure how what should happen if a async verification
    // errors. if it's an key not found - that is a verification fail,
    // not a error. if it's genunie error, really you should queue and 
    // try again? or replay the message later
    // -- this should be done my the security plugin though, not scuttlebutt.

    if(err)
      return emit.call(self, 'error', err)

    if(!verified)
      return emit.call(self, 'unverified_data', update)

    // check if this message is older than
    // the value we already have.
    // do nothing if so
    // emit an 'old_data' event because i'll want to track how many
    // unnecessary messages are sent.

    if(self.applyUpdate(update))
      emit.call(self, '_update', update) //write to stream.
  }

  if(source !== this.id) {
    if(this._verify)
      this._verify(update, didVerification)
    else
      didVerification(null, true)
  } else {
    if(this._sign) {
      //could make this async easily enough.
      update[3] = this._sign(update)
    }
    didVerification(null, true)
  }

  return true
}

sb.createStream = function (opts) {
  var self = this
  //the sources for the remote end.
  var sources = {}, other
  var syncSent = false, syncRecv = false

  this._streams ++

  opts = opts || {}
  var d = duplex()
  d.name = opts.name
  var outer = serializer(opts && opts.wrapper)(d)
  outer.inner = d

  d.writable = opts.writable !== false
  d.readable = opts.readable !== false

  syncRecv   = !d.writable
  syncSent   = !d.readable

  var tail = opts.tail !== false //default to tail=true

  function start (data) {
    //when the digest is recieved from the other end,
    //send the history.
    //merge with the current list of sources.
    sources = data.clock
    i.each(self.history(sources), function (data) {d._data(data)})
    
    outer.emit('header', data)
    d._data('SYNC')
    //when we have sent all history
    outer.emit('syncSent')
    syncSent = true
    //when we have recieved all histoyr
    //emit 'synced' when this stream has synced.
    if(syncRecv) outer.emit('sync'), outer.emit('synced')
    if(!tail) d._end()
  }

  d
    .on('_data', function (data) {
      //if it's an array, it's an update.
      if(Array.isArray(data)) {
        if(validate(data))
          return self._update(data)
      }
      //if it's an object, it's a scuttlebut digest.
      else if('object' === typeof data && data)
        start(data)
      else if('string' === typeof data && data == 'SYNC') {
        syncRecv = true
        outer.emit('syncRecieved')
        if(syncSent) outer.emit('sync'), outer.emit('synced')
      }
    }).on('_end', function () {
      d._end()
    })
    .on('close', function () {
      self.removeListener('_update', onUpdate)
      //emit the number of streams that are remaining...
      //this will be used for memory management...
      self._streams --
      emit.call(self, 'unstream', self._streams)
    })

  if(opts && opts.tail === false) {
    outer.on('sync', function () {
      process.nextTick(function () {
        d._end()
      })
    })
  }
  function onUpdate (update) { //value, source, ts
    if(!validate(update) || !u.filter(update, sources))
      return

    d._data(update)

    //really, this should happen before emitting.
    var ts = update[1]
    var source = update[2]
    sources[source] = ts
  }

  var outgoing = { id : self.id, clock : self.sources }

  if (opts && opts.meta) outgoing.meta = opts.meta

  if(d.readable) {
    d._data(outgoing)
    if(!d.writable)
      start({clock:{}})
    if(tail)
      self.on('_update', onUpdate)
  }

  self.once('dispose', function () {
    d.end()
  })

  return outer
}

sb.createWriteStream = function (opts) {
  opts = opts || {}
  opts.writable = true; opts.readable = false
  return this.createStream(opts)
}

sb.createReadStream = function (opts) {
  opts = opts || {}
  opts.writable = false; opts.readable = true
  return this.createStream(opts)
}

sb.dispose = function () {
  emit.call(this, 'dispose')
}

sb.setId = function (id) {
  if('__proto__' === id) throw new Error('__proto__ is invalid id')
  if(id == null) throw new Error('null is not invalid id')
  this.id = id
  return this
}

function streamDone(stream, listener) {

  function remove () {
    stream.removeListener('end',   onDone)
    stream.removeListener('error', onDone)
    stream.removeListener('close',   onDone)
  }
  function onDone (arg) {
    remove()
    listener.call(this, arg)
  }

  //this makes emitter.removeListener(event, listener) still work
  onDone.listener = listener

  stream.on('end',   onDone)
  stream.on('error', onDone)
  stream.on('close', onDone)
}

//create another instance of this scuttlebutt,
//that is in sync and attached to this instance.
sb.clone = function () {
  var A = this
  var B = new (A.constructor)
  B.setId(A.id) //same id. think this will work...

  A._clones = (A._clones || 0) + 1

  var a = A.createStream({wrapper: 'raw'})
  var b = B.createStream({wrapper: 'raw'})

  //all updates must be sync, so make sure pause never happens.
  a.pause = b.pause = function noop(){}

  streamDone(b, function () {
    A._clones--
    emit.call(A, 'unclone', A._clones)
  })

  a.pipe(b).pipe(a)
  //resume both streams, so that the new instance is brought up to date immediately.
  a.resume()
  b.resume()

  return B
}


})(require("__browserify_process"))
},{"events":10,"util":9,"./util":22,"iterate":32,"duplex":33,"stream-serializer":34,"monotonic-timestamp":35,"__browserify_process":11}],32:[function(require,module,exports){

//
// adds all the fields from obj2 onto obj1
//

var each = exports.each = function (obj,iterator){
 var keys = Object.keys(obj)
 keys.forEach(function (key){
  iterator(obj[key],key,obj) 
 })
}

var RX = /sadf/.constructor
function rx (iterator ){
  return iterator instanceof RX ? function (str) { 
      var m = iterator.exec(str)
      return m && (m[1] ? m[1] : m[0]) 
    } : iterator
}

var times = exports.times = function () {
  var args = [].slice.call(arguments)
    , iterator = rx(args.pop())
    , m = args.pop()
    , i = args.shift()
    , j = args.shift()
    , diff, dir
    , a = []
    
    i = 'number' === typeof i ? i : 1
    diff = j ? j - i : 1
    dir = i < m
    if(m == i)
      throw new Error('steps cannot be the same: '+m+', '+i)
  for (; dir ? i <= m : m <= i; i += diff)
    a.push(iterator(i))
  return a
}

var map = exports.map = function (obj, iterator){
  iterator = rx(iterator)
  if(Array.isArray(obj))
    return obj.map(iterator)
  if('number' === typeof obj)
    return times.apply(null, [].slice.call(arguments))  
  //return if null ?  
  var keys = Object.keys(obj)
    , r = {}
  keys.forEach(function (key){
    r[key] = iterator(obj[key],key,obj) 
  })
  return r
}

var findReturn = exports.findReturn = function (obj, iterator) {
  iterator = rx(iterator)
  if(obj == null)
    return
  var keys = Object.keys(obj)
    , l = keys.length
  for (var i = 0; i < l; i ++) {
    var key = keys[i]
      , value = obj[key]
    var r = iterator(value, key)
    if(r) return r
  }
}

var find = exports.find = function (obj, iterator) { 
  iterator = rx(iterator)
  return findReturn (obj, function (v, k) {
    var r = iterator(v, k)
    if(r) return v
  })
}

var findKey = exports.findKey = function (obj, iterator) { 
  iterator = rx(iterator)
  return findReturn (obj, function (v, k) {
    var r = iterator(v, k)
    if(r) return k
  })
}

var filter = exports.filter = function (obj, iterator){
  iterator = rx (iterator)

  if(Array.isArray(obj))
    return obj.filter(iterator)
  
  var keys = Object.keys(obj)
    , r = {}
  keys.forEach(function (key){
    var v
    if(iterator(v = obj[key],key,obj))
      r[key] = v
  })
  return r 
}

var mapKeys = exports.mapKeys = function (ary, iterator){
  var r = {}
  iterator = rx(iterator)
  each(ary, function (v,k){
    r[v] = iterator(v,k)
  })
  return r
}


var mapToArray = exports.mapToArray = function (ary, iterator){
  var r = []
  iterator = rx(iterator)
  each(ary, function (v,k){
    r.push(iterator(v,k))
  })
  return r
}

var path = exports.path = function (object, path) {

  for (var i in path) {
    if(object == null) return undefined
    var key = path[i]
    object = object[key]
  }
  return object
}

/*
NOTE: naive implementation. 
`match` must not contain circular references.
*/

var setPath = exports.setPath = function (object, path, value) {

  for (var i in path) {
    var key = path[i]
    if(object[key] == null) object[key] = ( 
      i + 1 == path.length ? value : {}
    )
    object = object[key]
  }
}

var join = exports.join = function (A, B, it) {
  each(A, function (a, ak) {
    each(B, function (b, bk) {
      it(a, b, ak, bk)
    })
  })
}

},{}],33:[function(require,module,exports){
(function(process){var Stream = require('stream')

module.exports = function (write, end) {
  var stream = new Stream() 
  var buffer = [], ended = false, destroyed = false, emitEnd
  stream.writable = stream.readable = true
  stream.paused = false
  stream._paused = false
  stream.buffer = buffer
  
  stream
    .on('pause', function () {
      stream._paused = true
    })
    .on('drain', function () {
      stream._paused = false
    })
   
  function destroySoon () {
    process.nextTick(stream.destroy.bind(stream))
  }

  if(write)
    stream.on('_data', write)
  if(end)
    stream.on('_end', end)

  //destroy the stream once both ends are over
  //but do it in nextTick, so that other listeners
  //on end have time to respond
  stream.once('end', function () { 
    stream.readable = false
    if(!stream.writable) {
      process.nextTick(function () {
        stream.destroy()
      })
    }
  })

  stream.once('_end', function () { 
    stream.writable = false
    if(!stream.readable)
      stream.destroy()
  })

  // this is the default write method,
  // if you overide it, you are resposible
  // for pause state.

  
  stream._data = function (data) {
    if(!stream.paused && !buffer.length)
      stream.emit('data', data)
    else 
      buffer.push(data)
    return !(stream.paused || buffer.length)
  }

  stream._end = function (data) { 
    if(data) stream._data(data)
    if(emitEnd) return
    emitEnd = true
    //destroy is handled above.
    stream.drain()
  }

  stream.write = function (data) {
    stream.emit('_data', data)
    return !stream._paused
  }

  stream.end = function () {
    stream.writable = false
    if(stream.ended) return
    stream.ended = true
    stream.emit('_end')
  }

  stream.drain = function () {
    if(!buffer.length && !emitEnd) return
    //if the stream is paused after just before emitEnd()
    //end should be buffered.
    while(!stream.paused) {
      if(buffer.length) {
        stream.emit('data', buffer.shift())
        if(buffer.length == 0) {
          stream.emit('_drain')
        }
      }
      else if(emitEnd && stream.readable) {
        stream.readable = false
        stream.emit('end')
        return
      } else {
        //if the buffer has emptied. emit drain.
        return true
      }
    }
  }
  var started = false
  stream.resume = function () {
    //this is where I need pauseRead, and pauseWrite.
    //here the reading side is unpaused,
    //but the writing side may still be paused.
    //the whole buffer might not empity at once.
    //it might pause again.
    //the stream should never emit data inbetween pause()...resume()
    //and write should return !buffer.length
    started = true
    stream.paused = false
    stream.drain() //will emit drain if buffer empties.
    return stream
  }

  stream.destroy = function () {
    if(destroyed) return
    destroyed = ended = true     
    buffer.length = 0
    stream.emit('close')
  }
  var pauseCalled = false
  stream.pause = function () {
    started = true
    stream.paused = true
    stream.emit('_pause')
    return stream
  }
  stream._pause = function () {
    if(!stream._paused) {
      stream._paused = true
      stream.emit('pause')
    }
    return this
  }
  stream.paused = true
  process.nextTick(function () {
    //unless the user manually paused
    if(started) return
    stream.resume()
  })
 
  return stream
}


})(require("__browserify_process"))
},{"stream":19,"__browserify_process":11}],34:[function(require,module,exports){

var EventEmitter = require('events').EventEmitter

exports = module.exports = function (wrapper) {

  if('function' == typeof wrapper)
    return wrapper
  
  return exports[wrapper] || exports.json
}

exports.json = function (stream) {

  var write = stream.write
  var soFar = ''

  function parse (line) {
    var js
    try {
      js = JSON.parse(line)
      //ignore lines of whitespace...
    } catch (err) { 
      return stream.emit('error', err)
      //return console.error('invalid JSON', line)
    }
    if(js !== undefined)
      write.call(stream, js)
  }

  function onData (data) {
    var lines = (soFar + data).split('\n')
    soFar = lines.pop()
    while(lines.length) {
      parse(lines.shift())
    }
  }

  stream.write = onData
  
  var end = stream.end

  stream.end = function (data) {
    if(data)
      stream.write(data)
    //if there is any left over...
    if(soFar) {
      parse(soFar)
    }
    return end.call(stream)
  }

  stream.emit = function (event, data) {

    if(event == 'data') {
      data = JSON.stringify(data) + '\n'
    }
    //since all stream events only use one argument, this is okay...
    EventEmitter.prototype.emit.call(stream, event, data)
  }

  return stream
//  return es.pipeline(es.split(), es.parse(), stream, es.stringify())
}

exports.raw = function (stream) {
  return stream
}


},{"events":10}],35:[function(require,module,exports){
// If `Date.now()` is invoked twice quickly, it's possible to get two
// identical time stamps. To avoid generation duplications, subsequent
// calls are manually ordered to force uniqueness.

var _last = 0
var _count = 1
var adjusted = 0
var _adjusted = 0

module.exports =
function timestamp() {
  /**
  Returns NOT an accurate representation of the current time.
  Since js only measures time as ms, if you call `Date.now()`
  twice quickly, it's possible to get two identical time stamps.
  This function guarantees unique but maybe inaccurate results
  on each call.
  **/
  //uncomment this wen
  var time = Date.now()
  //time = ~~ (time / 1000) 
  //^^^uncomment when testing...

  /**
  If time returned is same as in last call, adjust it by
  adding a number based on the counter. 
  Counter is incremented so that next call get's adjusted properly.
  Because floats have restricted precision, 
  may need to step past some values...
  **/
  if (_last === time)  {
    do {
      adjusted = time + ((_count++) / (_count + 999))
    } while (adjusted === _adjusted)
    _adjusted = adjusted
  }
  // If last time was different reset timer back to `1`.
  else {
    _count = 1
    adjusted = time
  }
  _adjusted = adjusted
  _last = time
  return adjusted
}

},{}],30:[function(require,module,exports){
/*
 * Copyright (c) 2012 Mathieu Turcotte
 * Licensed under the MIT license.
 */

var util = require('util');

var BackoffStrategy = require('./strategy');

/**
 * Fibonacci backoff strategy.
 * @extends BackoffStrategy
 */
function FibonacciBackoffStrategy(options) {
    BackoffStrategy.call(this, options);
    this.backoffDelay_ = 0;
    this.nextBackoffDelay_ = this.getInitialDelay();
}
util.inherits(FibonacciBackoffStrategy, BackoffStrategy);

/** @inheritDoc */
FibonacciBackoffStrategy.prototype.next_ = function() {
    var backoffDelay = Math.min(this.nextBackoffDelay_, this.getMaxDelay());
    this.nextBackoffDelay_ += this.backoffDelay_;
    this.backoffDelay_ = backoffDelay;
    return backoffDelay;
};

/** @inheritDoc */
FibonacciBackoffStrategy.prototype.reset_ = function() {
    this.nextBackoffDelay_ = this.getInitialDelay();
    this.backoffDelay_ = 0;
};

module.exports = FibonacciBackoffStrategy;


},{"util":9,"./strategy":36}],31:[function(require,module,exports){
/*
 * Copyright (c) 2012 Mathieu Turcotte
 * Licensed under the MIT license.
 */

var util = require('util');

var BackoffStrategy = require('./strategy');

/**
 * Exponential backoff strategy.
 * @extends BackoffStrategy
 */
function ExponentialBackoffStrategy(options) {
    BackoffStrategy.call(this, options);
    this.backoffDelay_ = 0;
    this.nextBackoffDelay_ = this.getInitialDelay();
}
util.inherits(ExponentialBackoffStrategy, BackoffStrategy);

/** @inheritDoc */
ExponentialBackoffStrategy.prototype.next_ = function() {
    this.backoffDelay_ = Math.min(this.nextBackoffDelay_, this.getMaxDelay());
    this.nextBackoffDelay_ = this.backoffDelay_ * 2;
    return this.backoffDelay_;
};

/** @inheritDoc */
ExponentialBackoffStrategy.prototype.reset_ = function() {
    this.backoffDelay_ = 0;
    this.nextBackoffDelay_ = this.getInitialDelay();
};

module.exports = ExponentialBackoffStrategy;


},{"util":9,"./strategy":36}],36:[function(require,module,exports){
/*
 * Copyright (c) 2012 Mathieu Turcotte
 * Licensed under the MIT license.
 */

var events = require('events'),
    util = require('util');

function isDef(value) {
    return value !== undefined && value !== null;
}

/**
 * Abstract class defining the skeleton for all backoff strategies.
 * @param options Backoff strategy options.
 * @param options.randomisationFactor The randomisation factor, must be between
 * 0 and 1.
 * @param options.initialDelay The backoff initial delay, in milliseconds.
 * @param options.maxDelay The backoff maximal delay, in milliseconds.
 * @constructor
 */
function BackoffStrategy(options) {
    options = options || {};

    if (isDef(options.initialDelay) && options.initialDelay < 1) {
        throw new Error('The initial timeout must be greater than 0.');
    } else if (isDef(options.maxDelay) && options.maxDelay < 1) {
        throw new Error('The maximal timeout must be greater than 0.');
    }

    this.initialDelay_ = options.initialDelay || 100;
    this.maxDelay_ = options.maxDelay || 10000;

    if (this.maxDelay_ <= this.initialDelay_) {
        throw new Error('The maximal backoff delay must be ' +
                        'greater than the initial backoff delay.');
    }

    if (isDef(options.randomisationFactor) &&
        (options.randomisationFactor < 0 || options.randomisationFactor > 1)) {
        throw new Error('The randomisation factor must be between 0 and 1.');
    }

    this.randomisationFactor_ = options.randomisationFactor || 0;
}

/**
 * Retrieves the maximal backoff delay.
 * @return The maximal backoff delay.
 */
BackoffStrategy.prototype.getMaxDelay = function() {
    return this.maxDelay_;
};

/**
 * Retrieves the initial backoff delay.
 * @return The initial backoff delay.
 */
BackoffStrategy.prototype.getInitialDelay = function() {
    return this.initialDelay_;
};

/**
 * Template method that computes the next backoff delay.
 * @return The backoff delay, in milliseconds.
 */
BackoffStrategy.prototype.next = function() {
    var backoffDelay = this.next_();
    var randomisationMultiple = 1 + Math.random() * this.randomisationFactor_;
    var randomizedDelay = Math.round(backoffDelay * randomisationMultiple);
    return randomizedDelay;
};

/**
 * Computes the next backoff delay.
 * @return The backoff delay, in milliseconds.
 */
BackoffStrategy.prototype.next_ = function() {
    throw new Error('BackoffStrategy.next_() unimplemented.');
};

/**
 * Template method that resets the backoff delay to its initial value.
 */
BackoffStrategy.prototype.reset = function() {
    this.reset_();
};

/**
 * Resets the backoff delay to its initial value.
 */
BackoffStrategy.prototype.reset_ = function() {
    throw new Error('BackoffStrategy.reset_() unimplemented.');
};

module.exports = BackoffStrategy;


},{"events":10,"util":9}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvY2xpZW50LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvd2lkZ2V0LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9tYXJrZWQvbGliL21hcmtlZC5qcyIsIi91c3IvbG9jYWwvc2hhcmUvbnBtL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2J1aWx0aW4vdXRpbC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9yLWFycmF5L3dpZGdldC5qcyIsIi91c3IvbG9jYWwvc2hhcmUvbnBtL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvdXNyL2xvY2FsL3NoYXJlL25wbS9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL2V2ZW50cy5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvY2xpZW50LXJlbG9hZGVyL2Jyb3dzZXIuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvbXV4LWRlbXV4L2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvbm9kZV9tb2R1bGVzL2FkaWZmL2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9tdXgtZGVtdXgvbm9kZV9tb2R1bGVzL3Rocm91Z2gvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL2NsaWVudC1yZWxvYWRlci9ub2RlX21vZHVsZXMvaGVhZGVyLXN0cmVhbS9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvbXV4LWRlbXV4L25vZGVfbW9kdWxlcy94dGVuZC9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvbXV4LWRlbXV4L25vZGVfbW9kdWxlcy9kdXBsZXgvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL211eC1kZW11eC9ub2RlX21vZHVsZXMvc3RyZWFtLXNlcmlhbGl6ZXIvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3JlY29ubmVjdC9zaG9lLmpzIiwiL3Vzci9sb2NhbC9zaGFyZS9ucG0vbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvYnVpbHRpbi9zdHJlYW0uanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9ub2RlX21vZHVsZXMvci1hcnJheS9ub2RlX21vZHVsZXMvc2N1dHRsZWJ1dHQvdXRpbC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvcmVjb25uZWN0L2luamVjdC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9yLWFycmF5L2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvbm9kZV9tb2R1bGVzL3ItYXJyYXkvbm9kZV9tb2R1bGVzL2JldHdlZW4vaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3JlY29ubmVjdC93aWRnZXQuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3Nob2UvYnJvd3Nlci5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvcmVjb25uZWN0L25vZGVfbW9kdWxlcy9iYWNrb2ZmL2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yZWNvbm5lY3Qvbm9kZV9tb2R1bGVzL2gvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3JlY29ubmVjdC9ub2RlX21vZHVsZXMvYmFja29mZi9saWIvYmFja29mZi5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvc2hvZS9ub2RlX21vZHVsZXMvc29ja2pzLWNsaWVudC9zb2NranMuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9ub2RlX21vZHVsZXMvci1hcnJheS9ub2RlX21vZHVsZXMvc2N1dHRsZWJ1dHQvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9ub2RlX21vZHVsZXMvci1hcnJheS9ub2RlX21vZHVsZXMvc2N1dHRsZWJ1dHQvbm9kZV9tb2R1bGVzL2l0ZXJhdGUvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9ub2RlX21vZHVsZXMvci1hcnJheS9ub2RlX21vZHVsZXMvc2N1dHRsZWJ1dHQvbm9kZV9tb2R1bGVzL2R1cGxleC9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9yLWFycmF5L25vZGVfbW9kdWxlcy9zY3V0dGxlYnV0dC9ub2RlX21vZHVsZXMvc3RyZWFtLXNlcmlhbGl6ZXIvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9ub2RlX21vZHVsZXMvci1hcnJheS9ub2RlX21vZHVsZXMvc2N1dHRsZWJ1dHQvbm9kZV9tb2R1bGVzL21vbm90b25pYy10aW1lc3RhbXAvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3JlY29ubmVjdC9ub2RlX21vZHVsZXMvYmFja29mZi9saWIvc3RyYXRlZ3kvZmlib25hY2NpLmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yZWNvbm5lY3Qvbm9kZV9tb2R1bGVzL2JhY2tvZmYvbGliL3N0cmF0ZWd5L2V4cG9uZW50aWFsLmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yZWNvbm5lY3Qvbm9kZV9tb2R1bGVzL2JhY2tvZmYvbGliL3N0cmF0ZWd5L3N0cmF0ZWd5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9WQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3B4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIFJUZXh0ICAgICA9IHJlcXVpcmUoJ3ItZWRpdCcpO1xudmFyIHJlY29ubmVjdCA9IHJlcXVpcmUoJ3JlY29ubmVjdCcpO1xudmFyIHJlbG9hZGVyICA9IHJlcXVpcmUoJ2NsaWVudC1yZWxvYWRlcicpO1xudmFyIHdpZGdldCAgICA9IHJlcXVpcmUoJ3ItZWRpdC93aWRnZXQnKTtcbnZhciBtYXJrZWQgICAgPSByZXF1aXJlKCdtYXJrZWQnKTtcbnZhciBNdXhEZW11eCA9IHJlcXVpcmUoXCJtdXgtZGVtdXhcIik7XG5cblxudmFyIHJUZXh0ID0gUlRFWFQgPSBSVGV4dCgpXG4vLyBVc2luZyB0aGUgZGVmYXVsdCB3aWRnZXQuXG52YXIgJHRleHRBcmVhID0gJChyVGV4dC53aWRnZXQoKSk7XG52YXIgJG1hcmtkb3duID0gJCgnI21hcmtkb3duJyk7XG52YXIgJHRleHRXcmFwcGVyID0gJCgnI3RleHQtd3JhcHBlcicpO1xudmFyICRtYXJrZG93bldyYXBwZXIgPSAkKCcjbWFya2Rvd24td3JhcHBlcicpO1xudmFyICR0ZXh0ID0gJCgnI3RleHQnKTtcbnZhciAkbWFya2Rvd24gPSAkKCcjbWFya2Rvd24nKTtcblxuLy8gYHJlY29ubmVjdCgpYCBhbmQgYHJlbG9hZGVyKClgIHJlY29ubmVjdCB0aGUgc3RyZWFtIGluIHRoZSBldmVudFxuLy8gb2YgYW4gaW50ZXJydXB0aW9uIChuZXR3b3JrIG9yIG90aGVyd2lzZSkuXG5yZWNvbm5lY3QocmVsb2FkZXIoZnVuY3Rpb24gKHN0cmVhbSkge1xuXG4gIC8vIFdlIGNyZWF0ZSBhIG5ldyBpbnN0YW5jZSBvZiBNdXhEZW11eCgpIGZvciBlYWNoIGNvbm5lY3Rpb24uXG4gIHZhciBtZG0gPSBNdXhEZW11eCgpXG5cbiAgLy8gRW5zdXJlIHdlIGRvbid0IG1pc3MgbWVzc2FnZXMgd2hpbGUgd2UgZ2V0IHNldHVwLlxuICBtZG0ucGF1c2UoKTtcblxuICAvLyBXZSBjcmVhdGUgdGhlIHJlYWQvd3JpdGUgc3RyZWFtIHRvIGludGVyZmFjZSB3aXRoIHJUZXh0KCkuXG4gIHZhciBydFN0cmVhbSA9IHJUZXh0LmNyZWF0ZVN0cmVhbSgpO1xuICAkdGV4dC5hcHBlbmQoJHRleHRBcmVhKTtcblxuICAvLyBXZSBjb25uZWN0IG91ciBzaG9lIHN0cmVhbSBkaXJlY3RseSBvdXIgbXV4ZXIvZGVtdXhlci5cbiAgLy8gVGhpcyBhbGxvd3MgdGhlIG11eGVyIHRvIGVuY29kZSBhbnl0aGluZyB3cml0dGVuIHRvIGFueSB2aXJ0dWFsIGNvbm5lY3Rpb25cbiAgLy8gbXVsdGlwbGV4ZWQgdGhyb3VnaCB0aGUgb25lIHN0cmVhbSBhbmQgdGhlIGRlbXV4ZXIgdG8gZGVjb2RlIGFueXRoaW5nIGNvbWluZ1xuICAvLyBiYWNrIGZyb20gdGhlIHNlcnZlci5cbiAgc3RyZWFtLnBpcGUobWRtKS5waXBlKHN0cmVhbSk7XG5cbiAgLy8gQ3JlYXRlIGFuIGluZGl2aWR1YWwgY2hhbm5lbCBvbiB0aGUgbWFpbiByZWFkL3dyaXRlIHN0cmVhbS5cbiAgdmFyIG14ZFRpdGxlU3RyZWFtID0gbWRtLmNyZWF0ZVN0cmVhbSh0aXRsZSlcbiAgbXhkVGl0bGVTdHJlYW0ub24oJ2RhdGEnLCB1cGRhdGVNYXJrZG93bik7XG5cbiAgLy8gRW5zdXJlIHdlIGRvbid0IG1pc3MgbWVzc2FnZXMgd2hpbGUgd2UgZ2V0IHNldHVwLlxuICBtZG0ucmVzdW1lKCk7XG5cbiAgLy8gUGlwZSBhbnl0aGluZyBzZW50IG9uIHRoaXMgY2hhbm5lbCBpbnRvIHRoZSBydGV4dCBzdHJlYW0gYW5kIHBpcGUgYW55dGhpbmdcbiAgLy8gY29taW5nIGJhY2sgZnJvbSB0aGF0IHN0cmVhbSBiYWNrIGFjcm9zcyB0aGUgdmlydHVhbCBjb25uZWN0aW9uLlxuICBteGRUaXRsZVN0cmVhbS5waXBlKHJ0U3RyZWFtKS5waXBlKG14ZFRpdGxlU3RyZWFtKVxuXG59KSkuY29ubmVjdCgnL3Nob2UvJyk7XG5cbmZ1bmN0aW9uIHVwZGF0ZU1hcmtkb3duKCkge1xuICAkbWFya2Rvd24uaHRtbChtYXJrZWQoclRleHQudGV4dCgpKSk7XG59O1xuXG52YXIgJGJ1dHRvbnMgPSAkKCcuYnV0dG9ucycpO1xudmFyICRwYWdlID0gJCgnI3BhZ2UnKTtcblxudmFyICRtYXJrZG93bkJ1dHRvbiA9ICQoJyNtYXJrZG93bi1idXR0b24nLCAkYnV0dG9ucyk7XG52YXIgJHNwbGl0QnV0dG9uID0gJCgnI3NwbGl0LWJ1dHRvbicsICRidXR0b25zKTtcbnZhciAkdGV4dEJ1dHRvbiA9ICQoJyN0ZXh0LWJ1dHRvbicsICRidXR0b25zKTtcblxuZnVuY3Rpb24gc2V0QWN0aXZlKGl0ZW0pIHtcbiAgJG1hcmtkb3duQnV0dG9uLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpO1xuICAkdGV4dEJ1dHRvbi5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKTtcbiAgJHNwbGl0QnV0dG9uLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpO1xuICAkKGl0ZW0pLmFkZENsYXNzKCdzZWxlY3RlZCcpO1xufVxuLy8gTW9kZSBzaG91bGQgYmUgb25lIG9mICdtYXJrZG93bicsICdzcGxpdCcsIG9yICd0ZXh0J1xuZnVuY3Rpb24gc2V0TW9kZShtb2RlLCBlbGVtZW50KSB7XG4gIGlmIChlbGVtZW50KSB7XG4gICAgc2V0QWN0aXZlKGVsZW1lbnQpO1xuICB9XG4gIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gbW9kZTtcbiAgc3dpdGNoIChtb2RlKSB7XG4gICAgY2FzZSAnbWFya2Rvd24nOlxuICAgICAgJHRleHRXcmFwcGVyLmhpZGUoKTtcbiAgICAgICRtYXJrZG93bldyYXBwZXJcbiAgICAgICAgLnNob3coKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ3NwYW42JylcbiAgICAgICAgLmFkZENsYXNzKCdzcGFuMTInKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3NwbGl0JzpcbiAgICAgICRtYXJrZG93bldyYXBwZXJcbiAgICAgICAgLnNob3coKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ3NwYW4xMicpXG4gICAgICAgIC5hZGRDbGFzcygnc3BhbjYnKTtcbiAgICAgICR0ZXh0V3JhcHBlclxuICAgICAgICAuc2hvdygpXG4gICAgICAgIC5yZW1vdmVDbGFzcygnc3BhbjEyJylcbiAgICAgICAgLmFkZENsYXNzKCdzcGFuNicpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndGV4dCc6XG4gICAgICAkbWFya2Rvd25XcmFwcGVyLmhpZGUoKTtcbiAgICAgICR0ZXh0V3JhcHBlclxuICAgICAgICAuc2hvdygpXG4gICAgICAgIC5yZW1vdmVDbGFzcygnc3BhbjYnKVxuICAgICAgICAuYWRkQ2xhc3MoJ3NwYW4xMicpO1xuICAgICAgYnJlYWs7XG4gIH1cbn1cbnZhciBtb2RlID0gd2luZG93LmxvY2F0aW9uLmhhc2hcbmlmIChtb2RlICYmIG1vZGUgIT0gJycpIHtcbiAgdmFyIG1vZGUgPSBtb2RlLnN1YnN0cigxKTtcbiAgc2V0TW9kZShtb2RlLCAkKHdpbmRvd1snJCcgKyBtb2RlICsgJ0J1dHRvbiddKS5nZXQoKSk7XG59XG4kbWFya2Rvd25CdXR0b24uY2xpY2soZnVuY3Rpb24gKCkgeyBzZXRNb2RlKCdtYXJrZG93bicsIHRoaXMpOyB9KTtcbiRzcGxpdEJ1dHRvbi5jbGljayhmdW5jdGlvbiAoKSB7IHNldE1vZGUoJ3NwbGl0JywgdGhpcyk7IH0pO1xuJHRleHRCdXR0b24uY2xpY2soZnVuY3Rpb24gKCkgeyBzZXRNb2RlKCd0ZXh0JywgdGhpcyk7IH0pOyIsIlxuZnVuY3Rpb24gdHJpbSAoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcuc3Vic3RyaW5nKDEsIHN0cmluZy5sZW5ndGggLSAxKVxufVxuXG5mdW5jdGlvbiBzdHlsZSAocngsIHRhZykge1xuICByZXR1cm4gZnVuY3Rpb24gKHRleHQpIHtcbiAgICB2YXIgbSA9IHJ4LmV4ZWModGV4dClcbiAgICB3aGlsZSAobSkge1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShtWzBdLCAnPCcrdGFnKyc+Jyt0cmltKG1bMF0pKyc8LycrdGFnKyc+JylcbiAgICAgIG0gPSByeC5leGVjKHRleHQpXG4gICAgfVxuICAgIHJldHVybiB0ZXh0XG4gIH1cbn1cblxudmFyIGl0YWxpY3MgPSBzdHlsZSgvX1teX10rXy8sICdlbScpXG52YXIgYm9sZCAgICA9IHN0eWxlKC9cXCpbXlxcKl0rXFwqLywgJ3N0cm9uZycpXG52YXIgY29kZSAgICA9IHN0eWxlKC9gW15gXStgLywgJ2NvZGUnKVxuXG5mdW5jdGlvbiBwcmVmaXggKHJ4LCB0YWcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWwpIHtcbiAgICB2YXIgbSA9IHJ4LmV4ZWModmFsKVxuICAgIGlmKG0pIHtcbiAgICAgIHZhciBsID0gbVswXS5sZW5ndGhcbiAgICAgIC8vb2ggeWVhaCwgZXNjYXBlIGNoYXJzLi4uXG4gICAgICB2YXIgdCA9ICdmdW5jdGlvbicgPT09IHR5cGVvZiB0YWcgPyB0YWcobSkgOiB0YWdcbiAgICAgIHJldHVybiAnPCcrdCsnPicrdmFsLnN1YnN0cmluZyhsKSsnPC8nK3QrJz4nXG4gICAgfVxuICAgIHJldHVybiB2YWxcbiAgfVxufVxuXG52YXIgaGVhZGVyID0gcHJlZml4KC9eIysvLCBmdW5jdGlvbiAobSkgeyByZXR1cm4gJ0gnK21bMF0ubGVuZ3RoIH0pXG52YXIgbGkgPSBwcmVmaXgoL15cXHMqLSsvLCAgJ2xpJylcblxuZnVuY3Rpb24gc3R5bGVzICh0ZXh0KSB7XG4gIHJldHVybiBoZWFkZXIobGkoYm9sZChpdGFsaWNzKGNvZGUodGV4dCkpKSkpXG59XG5cbmZ1bmN0aW9uIHRvSFRNTCAodmFsKSB7XG4gIGlmKCdcXG4nID09PSB2YWwpXG4gICAgcmV0dXJuICc8YnIvPidcbiAgcmV0dXJuIHN0eWxlcyh2YWwpXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRUZW1wbGF0ZSAodmFsLCBrZXksIGVsKSB7XG4gIGlmKGVsKVxuICAgIHJldHVybiBlbC5pbm5lckhUTUwgPSB0b0hUTUwodmFsKSwgZWxcbiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpXG4gIGVsLmlubmVySFRNTCA9IHRvSFRNTCh2YWwpXG4gIHJldHVybiBlbFxufVxuXG52YXIgd2lkZ2V0ID0gcmVxdWlyZSgnci1hcnJheS93aWRnZXQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChyRWRpdCwgdGVtcGxhdGUpIHtcbiAgcmV0dXJuIHdpZGdldChyRWRpdCwgdGVtcGxhdGUgfHwgZGVmYXVsdFRlbXBsYXRlKVxufVxuIiwiKGZ1bmN0aW9uKGdsb2JhbCl7LyoqXG4gKiBtYXJrZWQgLSBhIG1hcmtkb3duIHBhcnNlclxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTMsIENocmlzdG9waGVyIEplZmZyZXkuIChNSVQgTGljZW5zZWQpXG4gKiBodHRwczovL2dpdGh1Yi5jb20vY2hqai9tYXJrZWRcbiAqL1xuXG47KGZ1bmN0aW9uKCkge1xuXG4vKipcbiAqIEJsb2NrLUxldmVsIEdyYW1tYXJcbiAqL1xuXG52YXIgYmxvY2sgPSB7XG4gIG5ld2xpbmU6IC9eXFxuKy8sXG4gIGNvZGU6IC9eKCB7NH1bXlxcbl0rXFxuKikrLyxcbiAgZmVuY2VzOiBub29wLFxuICBocjogL14oICpbLSpfXSl7Myx9ICooPzpcXG4rfCQpLyxcbiAgaGVhZGluZzogL14gKigjezEsNn0pICooW15cXG5dKz8pICojKiAqKD86XFxuK3wkKS8sXG4gIG5wdGFibGU6IG5vb3AsXG4gIGxoZWFkaW5nOiAvXihbXlxcbl0rKVxcbiAqKD18LSl7Myx9ICpcXG4qLyxcbiAgYmxvY2txdW90ZTogL14oICo+W15cXG5dKyhcXG5bXlxcbl0rKSpcXG4qKSsvLFxuICBsaXN0OiAvXiggKikoYnVsbCkgW1xcc1xcU10rPyg/OmhyfFxcbnsyLH0oPyEgKSg/IVxcMWJ1bGwgKVxcbip8XFxzKiQpLyxcbiAgaHRtbDogL14gKig/OmNvbW1lbnR8Y2xvc2VkfGNsb3NpbmcpICooPzpcXG57Mix9fFxccyokKS8sXG4gIGRlZjogL14gKlxcWyhbXlxcXV0rKVxcXTogKjw/KFteXFxzPl0rKT4/KD86ICtbXCIoXShbXlxcbl0rKVtcIildKT8gKig/Olxcbit8JCkvLFxuICB0YWJsZTogbm9vcCxcbiAgcGFyYWdyYXBoOiAvXigoPzpbXlxcbl0rXFxuPyg/IWhyfGhlYWRpbmd8bGhlYWRpbmd8YmxvY2txdW90ZXx0YWd8ZGVmKSkrKVxcbiovLFxuICB0ZXh0OiAvXlteXFxuXSsvXG59O1xuXG5ibG9jay5idWxsZXQgPSAvKD86WyorLV18XFxkK1xcLikvO1xuYmxvY2suaXRlbSA9IC9eKCAqKShidWxsKSBbXlxcbl0qKD86XFxuKD8hXFwxYnVsbCApW15cXG5dKikqLztcbmJsb2NrLml0ZW0gPSByZXBsYWNlKGJsb2NrLml0ZW0sICdnbScpXG4gICgvYnVsbC9nLCBibG9jay5idWxsZXQpXG4gICgpO1xuXG5ibG9jay5saXN0ID0gcmVwbGFjZShibG9jay5saXN0KVxuICAoL2J1bGwvZywgYmxvY2suYnVsbGV0KVxuICAoJ2hyJywgL1xcbisoPz0oPzogKlstKl9dKXszLH0gKig/Olxcbit8JCkpLylcbiAgKCk7XG5cbmJsb2NrLl90YWcgPSAnKD8hKD86J1xuICArICdhfGVtfHN0cm9uZ3xzbWFsbHxzfGNpdGV8cXxkZm58YWJicnxkYXRhfHRpbWV8Y29kZSdcbiAgKyAnfHZhcnxzYW1wfGtiZHxzdWJ8c3VwfGl8Ynx1fG1hcmt8cnVieXxydHxycHxiZGl8YmRvJ1xuICArICd8c3Bhbnxicnx3YnJ8aW5zfGRlbHxpbWcpXFxcXGIpXFxcXHcrKD8hOi98QClcXFxcYic7XG5cbmJsb2NrLmh0bWwgPSByZXBsYWNlKGJsb2NrLmh0bWwpXG4gICgnY29tbWVudCcsIC88IS0tW1xcc1xcU10qPy0tPi8pXG4gICgnY2xvc2VkJywgLzwodGFnKVtcXHNcXFNdKz88XFwvXFwxPi8pXG4gICgnY2xvc2luZycsIC88dGFnKD86XCJbXlwiXSpcInwnW14nXSonfFteJ1wiPl0pKj8+LylcbiAgKC90YWcvZywgYmxvY2suX3RhZylcbiAgKCk7XG5cbmJsb2NrLnBhcmFncmFwaCA9IHJlcGxhY2UoYmxvY2sucGFyYWdyYXBoKVxuICAoJ2hyJywgYmxvY2suaHIpXG4gICgnaGVhZGluZycsIGJsb2NrLmhlYWRpbmcpXG4gICgnbGhlYWRpbmcnLCBibG9jay5saGVhZGluZylcbiAgKCdibG9ja3F1b3RlJywgYmxvY2suYmxvY2txdW90ZSlcbiAgKCd0YWcnLCAnPCcgKyBibG9jay5fdGFnKVxuICAoJ2RlZicsIGJsb2NrLmRlZilcbiAgKCk7XG5cbi8qKlxuICogTm9ybWFsIEJsb2NrIEdyYW1tYXJcbiAqL1xuXG5ibG9jay5ub3JtYWwgPSBtZXJnZSh7fSwgYmxvY2spO1xuXG4vKipcbiAqIEdGTSBCbG9jayBHcmFtbWFyXG4gKi9cblxuYmxvY2suZ2ZtID0gbWVyZ2Uoe30sIGJsb2NrLm5vcm1hbCwge1xuICBmZW5jZXM6IC9eICooYHszLH18fnszLH0pICooXFx3Kyk/ICpcXG4oW1xcc1xcU10rPylcXHMqXFwxICooPzpcXG4rfCQpLyxcbiAgcGFyYWdyYXBoOiAvXi9cbn0pO1xuXG5ibG9jay5nZm0ucGFyYWdyYXBoID0gcmVwbGFjZShibG9jay5wYXJhZ3JhcGgpXG4gICgnKD8hJywgJyg/IScgKyBibG9jay5nZm0uZmVuY2VzLnNvdXJjZS5yZXBsYWNlKCdcXFxcMScsICdcXFxcMicpICsgJ3wnKVxuICAoKTtcblxuLyoqXG4gKiBHRk0gKyBUYWJsZXMgQmxvY2sgR3JhbW1hclxuICovXG5cbmJsb2NrLnRhYmxlcyA9IG1lcmdlKHt9LCBibG9jay5nZm0sIHtcbiAgbnB0YWJsZTogL14gKihcXFMuKlxcfC4qKVxcbiAqKFstOl0rICpcXHxbLXwgOl0qKVxcbigoPzouKlxcfC4qKD86XFxufCQpKSopXFxuKi8sXG4gIHRhYmxlOiAvXiAqXFx8KC4rKVxcbiAqXFx8KCAqWy06XStbLXwgOl0qKVxcbigoPzogKlxcfC4qKD86XFxufCQpKSopXFxuKi9cbn0pO1xuXG4vKipcbiAqIEJsb2NrIExleGVyXG4gKi9cblxuZnVuY3Rpb24gTGV4ZXIob3B0aW9ucykge1xuICB0aGlzLnRva2VucyA9IFtdO1xuICB0aGlzLnRva2Vucy5saW5rcyA9IHt9O1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IG1hcmtlZC5kZWZhdWx0cztcbiAgdGhpcy5ydWxlcyA9IGJsb2NrLm5vcm1hbDtcblxuICBpZiAodGhpcy5vcHRpb25zLmdmbSkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMudGFibGVzKSB7XG4gICAgICB0aGlzLnJ1bGVzID0gYmxvY2sudGFibGVzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJ1bGVzID0gYmxvY2suZ2ZtO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEV4cG9zZSBCbG9jayBSdWxlc1xuICovXG5cbkxleGVyLnJ1bGVzID0gYmxvY2s7XG5cbi8qKlxuICogU3RhdGljIExleCBNZXRob2RcbiAqL1xuXG5MZXhlci5sZXggPSBmdW5jdGlvbihzcmMsIG9wdGlvbnMpIHtcbiAgdmFyIGxleGVyID0gbmV3IExleGVyKG9wdGlvbnMpO1xuICByZXR1cm4gbGV4ZXIubGV4KHNyYyk7XG59O1xuXG4vKipcbiAqIFByZXByb2Nlc3NpbmdcbiAqL1xuXG5MZXhlci5wcm90b3R5cGUubGV4ID0gZnVuY3Rpb24oc3JjKSB7XG4gIHNyYyA9IHNyY1xuICAgIC5yZXBsYWNlKC9cXHJcXG58XFxyL2csICdcXG4nKVxuICAgIC5yZXBsYWNlKC9cXHQvZywgJyAgICAnKVxuICAgIC5yZXBsYWNlKC9cXHUwMGEwL2csICcgJylcbiAgICAucmVwbGFjZSgvXFx1MjQyNC9nLCAnXFxuJyk7XG5cbiAgcmV0dXJuIHRoaXMudG9rZW4oc3JjLCB0cnVlKTtcbn07XG5cbi8qKlxuICogTGV4aW5nXG4gKi9cblxuTGV4ZXIucHJvdG90eXBlLnRva2VuID0gZnVuY3Rpb24oc3JjLCB0b3ApIHtcbiAgdmFyIHNyYyA9IHNyYy5yZXBsYWNlKC9eICskL2dtLCAnJylcbiAgICAsIG5leHRcbiAgICAsIGxvb3NlXG4gICAgLCBjYXBcbiAgICAsIGJ1bGxcbiAgICAsIGJcbiAgICAsIGl0ZW1cbiAgICAsIHNwYWNlXG4gICAgLCBpXG4gICAgLCBsO1xuXG4gIHdoaWxlIChzcmMpIHtcbiAgICAvLyBuZXdsaW5lXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMubmV3bGluZS5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBpZiAoY2FwWzBdLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ3NwYWNlJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjb2RlXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuY29kZS5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBjYXAgPSBjYXBbMF0ucmVwbGFjZSgvXiB7NH0vZ20sICcnKTtcbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAnY29kZScsXG4gICAgICAgIHRleHQ6ICF0aGlzLm9wdGlvbnMucGVkYW50aWNcbiAgICAgICAgICA/IGNhcC5yZXBsYWNlKC9cXG4rJC8sICcnKVxuICAgICAgICAgIDogY2FwXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGZlbmNlcyAoZ2ZtKVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmZlbmNlcy5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2NvZGUnLFxuICAgICAgICBsYW5nOiBjYXBbMl0sXG4gICAgICAgIHRleHQ6IGNhcFszXVxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBoZWFkaW5nXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuaGVhZGluZy5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2hlYWRpbmcnLFxuICAgICAgICBkZXB0aDogY2FwWzFdLmxlbmd0aCxcbiAgICAgICAgdGV4dDogY2FwWzJdXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHRhYmxlIG5vIGxlYWRpbmcgcGlwZSAoZ2ZtKVxuICAgIGlmICh0b3AgJiYgKGNhcCA9IHRoaXMucnVsZXMubnB0YWJsZS5leGVjKHNyYykpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuXG4gICAgICBpdGVtID0ge1xuICAgICAgICB0eXBlOiAndGFibGUnLFxuICAgICAgICBoZWFkZXI6IGNhcFsxXS5yZXBsYWNlKC9eICp8ICpcXHwgKiQvZywgJycpLnNwbGl0KC8gKlxcfCAqLyksXG4gICAgICAgIGFsaWduOiBjYXBbMl0ucmVwbGFjZSgvXiAqfFxcfCAqJC9nLCAnJykuc3BsaXQoLyAqXFx8ICovKSxcbiAgICAgICAgY2VsbHM6IGNhcFszXS5yZXBsYWNlKC9cXG4kLywgJycpLnNwbGl0KCdcXG4nKVxuICAgICAgfTtcblxuICAgICAgZm9yIChpID0gMDsgaSA8IGl0ZW0uYWxpZ24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKC9eICotKzogKiQvLnRlc3QoaXRlbS5hbGlnbltpXSkpIHtcbiAgICAgICAgICBpdGVtLmFsaWduW2ldID0gJ3JpZ2h0JztcbiAgICAgICAgfSBlbHNlIGlmICgvXiAqOi0rOiAqJC8udGVzdChpdGVtLmFsaWduW2ldKSkge1xuICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSAnY2VudGVyJztcbiAgICAgICAgfSBlbHNlIGlmICgvXiAqOi0rICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKSB7XG4gICAgICAgICAgaXRlbS5hbGlnbltpXSA9ICdsZWZ0JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtLmFsaWduW2ldID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgaXRlbS5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpdGVtLmNlbGxzW2ldID0gaXRlbS5jZWxsc1tpXS5zcGxpdCgvICpcXHwgKi8pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnRva2Vucy5wdXNoKGl0ZW0pO1xuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBsaGVhZGluZ1xuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmxoZWFkaW5nLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAnaGVhZGluZycsXG4gICAgICAgIGRlcHRoOiBjYXBbMl0gPT09ICc9JyA/IDEgOiAyLFxuICAgICAgICB0ZXh0OiBjYXBbMV1cbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gaHJcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5oci5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2hyJ1xuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBibG9ja3F1b3RlXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuYmxvY2txdW90ZS5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG5cbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAnYmxvY2txdW90ZV9zdGFydCdcbiAgICAgIH0pO1xuXG4gICAgICBjYXAgPSBjYXBbMF0ucmVwbGFjZSgvXiAqPiA/L2dtLCAnJyk7XG5cbiAgICAgIC8vIFBhc3MgYHRvcGAgdG8ga2VlcCB0aGUgY3VycmVudFxuICAgICAgLy8gXCJ0b3BsZXZlbFwiIHN0YXRlLiBUaGlzIGlzIGV4YWN0bHlcbiAgICAgIC8vIGhvdyBtYXJrZG93bi5wbCB3b3Jrcy5cbiAgICAgIHRoaXMudG9rZW4oY2FwLCB0b3ApO1xuXG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2Jsb2NrcXVvdGVfZW5kJ1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGxpc3RcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5saXN0LmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcblxuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdsaXN0X3N0YXJ0JyxcbiAgICAgICAgb3JkZXJlZDogaXNGaW5pdGUoY2FwWzJdKVxuICAgICAgfSk7XG5cbiAgICAgIC8vIEdldCBlYWNoIHRvcC1sZXZlbCBpdGVtLlxuICAgICAgY2FwID0gY2FwWzBdLm1hdGNoKHRoaXMucnVsZXMuaXRlbSk7XG5cbiAgICAgIC8vIEdldCBidWxsZXQuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnNtYXJ0TGlzdHMpIHtcbiAgICAgICAgYnVsbCA9IGJsb2NrLmJ1bGxldC5leGVjKGNhcFswXSlbMF07XG4gICAgICB9XG5cbiAgICAgIG5leHQgPSBmYWxzZTtcbiAgICAgIGwgPSBjYXAubGVuZ3RoO1xuICAgICAgaSA9IDA7XG5cbiAgICAgIGZvciAoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBjYXBbaV07XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBsaXN0IGl0ZW0ncyBidWxsZXRcbiAgICAgICAgLy8gc28gaXQgaXMgc2VlbiBhcyB0aGUgbmV4dCB0b2tlbi5cbiAgICAgICAgc3BhY2UgPSBpdGVtLmxlbmd0aDtcbiAgICAgICAgaXRlbSA9IGl0ZW0ucmVwbGFjZSgvXiAqKFsqKy1dfFxcZCtcXC4pICsvLCAnJyk7XG5cbiAgICAgICAgLy8gT3V0ZGVudCB3aGF0ZXZlciB0aGVcbiAgICAgICAgLy8gbGlzdCBpdGVtIGNvbnRhaW5zLiBIYWNreS5cbiAgICAgICAgaWYgKH5pdGVtLmluZGV4T2YoJ1xcbiAnKSkge1xuICAgICAgICAgIHNwYWNlIC09IGl0ZW0ubGVuZ3RoO1xuICAgICAgICAgIGl0ZW0gPSAhdGhpcy5vcHRpb25zLnBlZGFudGljXG4gICAgICAgICAgICA/IGl0ZW0ucmVwbGFjZShuZXcgUmVnRXhwKCdeIHsxLCcgKyBzcGFjZSArICd9JywgJ2dtJyksICcnKVxuICAgICAgICAgICAgOiBpdGVtLnJlcGxhY2UoL14gezEsNH0vZ20sICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERldGVybWluZSB3aGV0aGVyIHRoZSBuZXh0IGxpc3QgaXRlbSBiZWxvbmdzIGhlcmUuXG4gICAgICAgIC8vIEJhY2twZWRhbCBpZiBpdCBkb2VzIG5vdCBiZWxvbmcgaW4gdGhpcyBsaXN0LlxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNtYXJ0TGlzdHMgJiYgaSAhPT0gbCAtIDEpIHtcbiAgICAgICAgICBiID0gYmxvY2suYnVsbGV0LmV4ZWMoY2FwW2krMV0pWzBdO1xuICAgICAgICAgIGlmIChidWxsICE9PSBiICYmICEoYnVsbFsxXSA9PT0gJy4nICYmIGJbMV0gPT09ICcuJykpIHtcbiAgICAgICAgICAgIHNyYyA9IGNhcC5zbGljZShpICsgMSkuam9pbignXFxuJykgKyBzcmM7XG4gICAgICAgICAgICBpID0gbCAtIDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgaXRlbSBpcyBsb29zZSBvciBub3QuXG4gICAgICAgIC8vIFVzZTogLyhefFxcbikoPyEgKVteXFxuXStcXG5cXG4oPyFcXHMqJCkvXG4gICAgICAgIC8vIGZvciBkaXNjb3VudCBiZWhhdmlvci5cbiAgICAgICAgbG9vc2UgPSBuZXh0IHx8IC9cXG5cXG4oPyFcXHMqJCkvLnRlc3QoaXRlbSk7XG4gICAgICAgIGlmIChpICE9PSBsIC0gMSkge1xuICAgICAgICAgIG5leHQgPSBpdGVtW2l0ZW0ubGVuZ3RoLTFdID09PSAnXFxuJztcbiAgICAgICAgICBpZiAoIWxvb3NlKSBsb29zZSA9IG5leHQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgICB0eXBlOiBsb29zZVxuICAgICAgICAgICAgPyAnbG9vc2VfaXRlbV9zdGFydCdcbiAgICAgICAgICAgIDogJ2xpc3RfaXRlbV9zdGFydCdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUmVjdXJzZS5cbiAgICAgICAgdGhpcy50b2tlbihpdGVtLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ2xpc3RfaXRlbV9lbmQnXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2xpc3RfZW5kJ1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGh0bWxcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5odG1sLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiB0aGlzLm9wdGlvbnMuc2FuaXRpemVcbiAgICAgICAgICA/ICdwYXJhZ3JhcGgnXG4gICAgICAgICAgOiAnaHRtbCcsXG4gICAgICAgIHByZTogY2FwWzFdID09PSAncHJlJyxcbiAgICAgICAgdGV4dDogY2FwWzBdXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGRlZlxuICAgIGlmICh0b3AgJiYgKGNhcCA9IHRoaXMucnVsZXMuZGVmLmV4ZWMoc3JjKSkpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5saW5rc1tjYXBbMV0udG9Mb3dlckNhc2UoKV0gPSB7XG4gICAgICAgIGhyZWY6IGNhcFsyXSxcbiAgICAgICAgdGl0bGU6IGNhcFszXVxuICAgICAgfTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHRhYmxlIChnZm0pXG4gICAgaWYgKHRvcCAmJiAoY2FwID0gdGhpcy5ydWxlcy50YWJsZS5leGVjKHNyYykpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuXG4gICAgICBpdGVtID0ge1xuICAgICAgICB0eXBlOiAndGFibGUnLFxuICAgICAgICBoZWFkZXI6IGNhcFsxXS5yZXBsYWNlKC9eICp8ICpcXHwgKiQvZywgJycpLnNwbGl0KC8gKlxcfCAqLyksXG4gICAgICAgIGFsaWduOiBjYXBbMl0ucmVwbGFjZSgvXiAqfFxcfCAqJC9nLCAnJykuc3BsaXQoLyAqXFx8ICovKSxcbiAgICAgICAgY2VsbHM6IGNhcFszXS5yZXBsYWNlKC8oPzogKlxcfCAqKT9cXG4kLywgJycpLnNwbGl0KCdcXG4nKVxuICAgICAgfTtcblxuICAgICAgZm9yIChpID0gMDsgaSA8IGl0ZW0uYWxpZ24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKC9eICotKzogKiQvLnRlc3QoaXRlbS5hbGlnbltpXSkpIHtcbiAgICAgICAgICBpdGVtLmFsaWduW2ldID0gJ3JpZ2h0JztcbiAgICAgICAgfSBlbHNlIGlmICgvXiAqOi0rOiAqJC8udGVzdChpdGVtLmFsaWduW2ldKSkge1xuICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSAnY2VudGVyJztcbiAgICAgICAgfSBlbHNlIGlmICgvXiAqOi0rICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKSB7XG4gICAgICAgICAgaXRlbS5hbGlnbltpXSA9ICdsZWZ0JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtLmFsaWduW2ldID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgaXRlbS5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpdGVtLmNlbGxzW2ldID0gaXRlbS5jZWxsc1tpXVxuICAgICAgICAgIC5yZXBsYWNlKC9eICpcXHwgKnwgKlxcfCAqJC9nLCAnJylcbiAgICAgICAgICAuc3BsaXQoLyAqXFx8ICovKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy50b2tlbnMucHVzaChpdGVtKTtcblxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdG9wLWxldmVsIHBhcmFncmFwaFxuICAgIGlmICh0b3AgJiYgKGNhcCA9IHRoaXMucnVsZXMucGFyYWdyYXBoLmV4ZWMoc3JjKSkpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ3BhcmFncmFwaCcsXG4gICAgICAgIHRleHQ6IGNhcFsxXVtjYXBbMV0ubGVuZ3RoLTFdID09PSAnXFxuJ1xuICAgICAgICAgID8gY2FwWzFdLnNsaWNlKDAsIC0xKVxuICAgICAgICAgIDogY2FwWzFdXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHRleHRcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy50ZXh0LmV4ZWMoc3JjKSkge1xuICAgICAgLy8gVG9wLWxldmVsIHNob3VsZCBuZXZlciByZWFjaCBoZXJlLlxuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgIHRleHQ6IGNhcFswXVxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc3JjKSB7XG4gICAgICB0aHJvdyBuZXdcbiAgICAgICAgRXJyb3IoJ0luZmluaXRlIGxvb3Agb24gYnl0ZTogJyArIHNyYy5jaGFyQ29kZUF0KDApKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcy50b2tlbnM7XG59O1xuXG4vKipcbiAqIElubGluZS1MZXZlbCBHcmFtbWFyXG4gKi9cblxudmFyIGlubGluZSA9IHtcbiAgZXNjYXBlOiAvXlxcXFwoW1xcXFxgKnt9XFxbXFxdKCkjK1xcLS4hXz5dKS8sXG4gIGF1dG9saW5rOiAvXjwoW14gPl0rKEB8OlxcLylbXiA+XSspPi8sXG4gIHVybDogbm9vcCxcbiAgdGFnOiAvXjwhLS1bXFxzXFxTXSo/LS0+fF48XFwvP1xcdysoPzpcIlteXCJdKlwifCdbXiddKid8W14nXCI+XSkqPz4vLFxuICBsaW5rOiAvXiE/XFxbKGluc2lkZSlcXF1cXChocmVmXFwpLyxcbiAgcmVmbGluazogL14hP1xcWyhpbnNpZGUpXFxdXFxzKlxcWyhbXlxcXV0qKVxcXS8sXG4gIG5vbGluazogL14hP1xcWygoPzpcXFtbXlxcXV0qXFxdfFteXFxbXFxdXSkqKVxcXS8sXG4gIHN0cm9uZzogL15fXyhbXFxzXFxTXSs/KV9fKD8hXyl8XlxcKlxcKihbXFxzXFxTXSs/KVxcKlxcKig/IVxcKikvLFxuICBlbTogL15cXGJfKCg/Ol9ffFtcXHNcXFNdKSs/KV9cXGJ8XlxcKigoPzpcXCpcXCp8W1xcc1xcU10pKz8pXFwqKD8hXFwqKS8sXG4gIGNvZGU6IC9eKGArKVxccyooW1xcc1xcU10qP1teYF0pXFxzKlxcMSg/IWApLyxcbiAgYnI6IC9eIHsyLH1cXG4oPyFcXHMqJCkvLFxuICBkZWw6IG5vb3AsXG4gIHRleHQ6IC9eW1xcc1xcU10rPyg/PVtcXFxcPCFcXFtfKmBdfCB7Mix9XFxufCQpL1xufTtcblxuaW5saW5lLl9pbnNpZGUgPSAvKD86XFxbW15cXF1dKlxcXXxbXlxcXV18XFxdKD89W15cXFtdKlxcXSkpKi87XG5pbmxpbmUuX2hyZWYgPSAvXFxzKjw/KFteXFxzXSo/KT4/KD86XFxzK1snXCJdKFtcXHNcXFNdKj8pWydcIl0pP1xccyovO1xuXG5pbmxpbmUubGluayA9IHJlcGxhY2UoaW5saW5lLmxpbmspXG4gICgnaW5zaWRlJywgaW5saW5lLl9pbnNpZGUpXG4gICgnaHJlZicsIGlubGluZS5faHJlZilcbiAgKCk7XG5cbmlubGluZS5yZWZsaW5rID0gcmVwbGFjZShpbmxpbmUucmVmbGluaylcbiAgKCdpbnNpZGUnLCBpbmxpbmUuX2luc2lkZSlcbiAgKCk7XG5cbi8qKlxuICogTm9ybWFsIElubGluZSBHcmFtbWFyXG4gKi9cblxuaW5saW5lLm5vcm1hbCA9IG1lcmdlKHt9LCBpbmxpbmUpO1xuXG4vKipcbiAqIFBlZGFudGljIElubGluZSBHcmFtbWFyXG4gKi9cblxuaW5saW5lLnBlZGFudGljID0gbWVyZ2Uoe30sIGlubGluZS5ub3JtYWwsIHtcbiAgc3Ryb25nOiAvXl9fKD89XFxTKShbXFxzXFxTXSo/XFxTKV9fKD8hXyl8XlxcKlxcKig/PVxcUykoW1xcc1xcU10qP1xcUylcXCpcXCooPyFcXCopLyxcbiAgZW06IC9eXyg/PVxcUykoW1xcc1xcU10qP1xcUylfKD8hXyl8XlxcKig/PVxcUykoW1xcc1xcU10qP1xcUylcXCooPyFcXCopL1xufSk7XG5cbi8qKlxuICogR0ZNIElubGluZSBHcmFtbWFyXG4gKi9cblxuaW5saW5lLmdmbSA9IG1lcmdlKHt9LCBpbmxpbmUubm9ybWFsLCB7XG4gIGVzY2FwZTogcmVwbGFjZShpbmxpbmUuZXNjYXBlKSgnXSknLCAnfnxdKScpKCksXG4gIHVybDogL14oaHR0cHM/OlxcL1xcL1teXFxzPF0rW148Liw6O1wiJylcXF1cXHNdKS8sXG4gIGRlbDogL15+fig/PVxcUykoW1xcc1xcU10qP1xcUyl+fi8sXG4gIHRleHQ6IHJlcGxhY2UoaW5saW5lLnRleHQpXG4gICAgKCddfCcsICd+XXwnKVxuICAgICgnfCcsICd8aHR0cHM/Oi8vfCcpXG4gICAgKClcbn0pO1xuXG4vKipcbiAqIEdGTSArIExpbmUgQnJlYWtzIElubGluZSBHcmFtbWFyXG4gKi9cblxuaW5saW5lLmJyZWFrcyA9IG1lcmdlKHt9LCBpbmxpbmUuZ2ZtLCB7XG4gIGJyOiByZXBsYWNlKGlubGluZS5icikoJ3syLH0nLCAnKicpKCksXG4gIHRleHQ6IHJlcGxhY2UoaW5saW5lLmdmbS50ZXh0KSgnezIsfScsICcqJykoKVxufSk7XG5cbi8qKlxuICogSW5saW5lIExleGVyICYgQ29tcGlsZXJcbiAqL1xuXG5mdW5jdGlvbiBJbmxpbmVMZXhlcihsaW5rcywgb3B0aW9ucykge1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IG1hcmtlZC5kZWZhdWx0cztcbiAgdGhpcy5saW5rcyA9IGxpbmtzO1xuICB0aGlzLnJ1bGVzID0gaW5saW5lLm5vcm1hbDtcblxuICBpZiAoIXRoaXMubGlua3MpIHtcbiAgICB0aHJvdyBuZXdcbiAgICAgIEVycm9yKCdUb2tlbnMgYXJyYXkgcmVxdWlyZXMgYSBgbGlua3NgIHByb3BlcnR5LicpO1xuICB9XG5cbiAgaWYgKHRoaXMub3B0aW9ucy5nZm0pIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmJyZWFrcykge1xuICAgICAgdGhpcy5ydWxlcyA9IGlubGluZS5icmVha3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucnVsZXMgPSBpbmxpbmUuZ2ZtO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMucGVkYW50aWMpIHtcbiAgICB0aGlzLnJ1bGVzID0gaW5saW5lLnBlZGFudGljO1xuICB9XG59XG5cbi8qKlxuICogRXhwb3NlIElubGluZSBSdWxlc1xuICovXG5cbklubGluZUxleGVyLnJ1bGVzID0gaW5saW5lO1xuXG4vKipcbiAqIFN0YXRpYyBMZXhpbmcvQ29tcGlsaW5nIE1ldGhvZFxuICovXG5cbklubGluZUxleGVyLm91dHB1dCA9IGZ1bmN0aW9uKHNyYywgbGlua3MsIG9wdGlvbnMpIHtcbiAgdmFyIGlubGluZSA9IG5ldyBJbmxpbmVMZXhlcihsaW5rcywgb3B0aW9ucyk7XG4gIHJldHVybiBpbmxpbmUub3V0cHV0KHNyYyk7XG59O1xuXG4vKipcbiAqIExleGluZy9Db21waWxpbmdcbiAqL1xuXG5JbmxpbmVMZXhlci5wcm90b3R5cGUub3V0cHV0ID0gZnVuY3Rpb24oc3JjKSB7XG4gIHZhciBvdXQgPSAnJ1xuICAgICwgbGlua1xuICAgICwgdGV4dFxuICAgICwgaHJlZlxuICAgICwgY2FwO1xuXG4gIHdoaWxlIChzcmMpIHtcbiAgICAvLyBlc2NhcGVcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5lc2NhcGUuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9IGNhcFsxXTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGF1dG9saW5rXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuYXV0b2xpbmsuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgaWYgKGNhcFsyXSA9PT0gJ0AnKSB7XG4gICAgICAgIHRleHQgPSBjYXBbMV1bNl0gPT09ICc6J1xuICAgICAgICAgID8gdGhpcy5tYW5nbGUoY2FwWzFdLnN1YnN0cmluZyg3KSlcbiAgICAgICAgICA6IHRoaXMubWFuZ2xlKGNhcFsxXSk7XG4gICAgICAgIGhyZWYgPSB0aGlzLm1hbmdsZSgnbWFpbHRvOicpICsgdGV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRleHQgPSBlc2NhcGUoY2FwWzFdKTtcbiAgICAgICAgaHJlZiA9IHRleHQ7XG4gICAgICB9XG4gICAgICBvdXQgKz0gJzxhIGhyZWY9XCInXG4gICAgICAgICsgaHJlZlxuICAgICAgICArICdcIj4nXG4gICAgICAgICsgdGV4dFxuICAgICAgICArICc8L2E+JztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHVybCAoZ2ZtKVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLnVybC5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0ZXh0ID0gZXNjYXBlKGNhcFsxXSk7XG4gICAgICBocmVmID0gdGV4dDtcbiAgICAgIG91dCArPSAnPGEgaHJlZj1cIidcbiAgICAgICAgKyBocmVmXG4gICAgICAgICsgJ1wiPidcbiAgICAgICAgKyB0ZXh0XG4gICAgICAgICsgJzwvYT4nO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdGFnXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMudGFnLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSB0aGlzLm9wdGlvbnMuc2FuaXRpemVcbiAgICAgICAgPyBlc2NhcGUoY2FwWzBdKVxuICAgICAgICA6IGNhcFswXTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGxpbmtcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5saW5rLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSB0aGlzLm91dHB1dExpbmsoY2FwLCB7XG4gICAgICAgIGhyZWY6IGNhcFsyXSxcbiAgICAgICAgdGl0bGU6IGNhcFszXVxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyByZWZsaW5rLCBub2xpbmtcbiAgICBpZiAoKGNhcCA9IHRoaXMucnVsZXMucmVmbGluay5leGVjKHNyYykpXG4gICAgICAgIHx8IChjYXAgPSB0aGlzLnJ1bGVzLm5vbGluay5leGVjKHNyYykpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgbGluayA9IChjYXBbMl0gfHwgY2FwWzFdKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICBsaW5rID0gdGhpcy5saW5rc1tsaW5rLnRvTG93ZXJDYXNlKCldO1xuICAgICAgaWYgKCFsaW5rIHx8ICFsaW5rLmhyZWYpIHtcbiAgICAgICAgb3V0ICs9IGNhcFswXVswXTtcbiAgICAgICAgc3JjID0gY2FwWzBdLnN1YnN0cmluZygxKSArIHNyYztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBvdXQgKz0gdGhpcy5vdXRwdXRMaW5rKGNhcCwgbGluayk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBzdHJvbmdcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5zdHJvbmcuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9ICc8c3Ryb25nPidcbiAgICAgICAgKyB0aGlzLm91dHB1dChjYXBbMl0gfHwgY2FwWzFdKVxuICAgICAgICArICc8L3N0cm9uZz4nO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gZW1cbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5lbS5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBvdXQgKz0gJzxlbT4nXG4gICAgICAgICsgdGhpcy5vdXRwdXQoY2FwWzJdIHx8IGNhcFsxXSlcbiAgICAgICAgKyAnPC9lbT4nO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gY29kZVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmNvZGUuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9ICc8Y29kZT4nXG4gICAgICAgICsgZXNjYXBlKGNhcFsyXSwgdHJ1ZSlcbiAgICAgICAgKyAnPC9jb2RlPic7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBiclxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmJyLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSAnPGJyPic7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBkZWwgKGdmbSlcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5kZWwuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9ICc8ZGVsPidcbiAgICAgICAgKyB0aGlzLm91dHB1dChjYXBbMV0pXG4gICAgICAgICsgJzwvZGVsPic7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyB0ZXh0XG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMudGV4dC5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBvdXQgKz0gZXNjYXBlKGNhcFswXSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc3JjKSB7XG4gICAgICB0aHJvdyBuZXdcbiAgICAgICAgRXJyb3IoJ0luZmluaXRlIGxvb3Agb24gYnl0ZTogJyArIHNyYy5jaGFyQ29kZUF0KDApKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb21waWxlIExpbmtcbiAqL1xuXG5JbmxpbmVMZXhlci5wcm90b3R5cGUub3V0cHV0TGluayA9IGZ1bmN0aW9uKGNhcCwgbGluaykge1xuICBpZiAoY2FwWzBdWzBdICE9PSAnIScpIHtcbiAgICByZXR1cm4gJzxhIGhyZWY9XCInXG4gICAgICArIGVzY2FwZShsaW5rLmhyZWYpXG4gICAgICArICdcIidcbiAgICAgICsgKGxpbmsudGl0bGVcbiAgICAgID8gJyB0aXRsZT1cIidcbiAgICAgICsgZXNjYXBlKGxpbmsudGl0bGUpXG4gICAgICArICdcIidcbiAgICAgIDogJycpXG4gICAgICArICc+J1xuICAgICAgKyB0aGlzLm91dHB1dChjYXBbMV0pXG4gICAgICArICc8L2E+JztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJzxpbWcgc3JjPVwiJ1xuICAgICAgKyBlc2NhcGUobGluay5ocmVmKVxuICAgICAgKyAnXCIgYWx0PVwiJ1xuICAgICAgKyBlc2NhcGUoY2FwWzFdKVxuICAgICAgKyAnXCInXG4gICAgICArIChsaW5rLnRpdGxlXG4gICAgICA/ICcgdGl0bGU9XCInXG4gICAgICArIGVzY2FwZShsaW5rLnRpdGxlKVxuICAgICAgKyAnXCInXG4gICAgICA6ICcnKVxuICAgICAgKyAnPic7XG4gIH1cbn07XG5cbi8qKlxuICogTWFuZ2xlIExpbmtzXG4gKi9cblxuSW5saW5lTGV4ZXIucHJvdG90eXBlLm1hbmdsZSA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgdmFyIG91dCA9ICcnXG4gICAgLCBsID0gdGV4dC5sZW5ndGhcbiAgICAsIGkgPSAwXG4gICAgLCBjaDtcblxuICBmb3IgKDsgaSA8IGw7IGkrKykge1xuICAgIGNoID0gdGV4dC5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChNYXRoLnJhbmRvbSgpID4gMC41KSB7XG4gICAgICBjaCA9ICd4JyArIGNoLnRvU3RyaW5nKDE2KTtcbiAgICB9XG4gICAgb3V0ICs9ICcmIycgKyBjaCArICc7JztcbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFBhcnNpbmcgJiBDb21waWxpbmdcbiAqL1xuXG5mdW5jdGlvbiBQYXJzZXIob3B0aW9ucykge1xuICB0aGlzLnRva2VucyA9IFtdO1xuICB0aGlzLnRva2VuID0gbnVsbDtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCBtYXJrZWQuZGVmYXVsdHM7XG59XG5cbi8qKlxuICogU3RhdGljIFBhcnNlIE1ldGhvZFxuICovXG5cblBhcnNlci5wYXJzZSA9IGZ1bmN0aW9uKHNyYywgb3B0aW9ucykge1xuICB2YXIgcGFyc2VyID0gbmV3IFBhcnNlcihvcHRpb25zKTtcbiAgcmV0dXJuIHBhcnNlci5wYXJzZShzcmMpO1xufTtcblxuLyoqXG4gKiBQYXJzZSBMb29wXG4gKi9cblxuUGFyc2VyLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKHNyYykge1xuICB0aGlzLmlubGluZSA9IG5ldyBJbmxpbmVMZXhlcihzcmMubGlua3MsIHRoaXMub3B0aW9ucyk7XG4gIHRoaXMudG9rZW5zID0gc3JjLnJldmVyc2UoKTtcblxuICB2YXIgb3V0ID0gJyc7XG4gIHdoaWxlICh0aGlzLm5leHQoKSkge1xuICAgIG91dCArPSB0aGlzLnRvaygpO1xuICB9XG5cbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogTmV4dCBUb2tlblxuICovXG5cblBhcnNlci5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy50b2tlbiA9IHRoaXMudG9rZW5zLnBvcCgpO1xufTtcblxuLyoqXG4gKiBQcmV2aWV3IE5leHQgVG9rZW5cbiAqL1xuXG5QYXJzZXIucHJvdG90eXBlLnBlZWsgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMudG9rZW5zW3RoaXMudG9rZW5zLmxlbmd0aC0xXSB8fCAwO1xufTtcblxuLyoqXG4gKiBQYXJzZSBUZXh0IFRva2Vuc1xuICovXG5cblBhcnNlci5wcm90b3R5cGUucGFyc2VUZXh0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBib2R5ID0gdGhpcy50b2tlbi50ZXh0O1xuXG4gIHdoaWxlICh0aGlzLnBlZWsoKS50eXBlID09PSAndGV4dCcpIHtcbiAgICBib2R5ICs9ICdcXG4nICsgdGhpcy5uZXh0KCkudGV4dDtcbiAgfVxuXG4gIHJldHVybiB0aGlzLmlubGluZS5vdXRwdXQoYm9keSk7XG59O1xuXG4vKipcbiAqIFBhcnNlIEN1cnJlbnQgVG9rZW5cbiAqL1xuXG5QYXJzZXIucHJvdG90eXBlLnRvayA9IGZ1bmN0aW9uKCkge1xuICBzd2l0Y2ggKHRoaXMudG9rZW4udHlwZSkge1xuICAgIGNhc2UgJ3NwYWNlJzoge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBjYXNlICdocic6IHtcbiAgICAgIHJldHVybiAnPGhyPlxcbic7XG4gICAgfVxuICAgIGNhc2UgJ2hlYWRpbmcnOiB7XG4gICAgICByZXR1cm4gJzxoJ1xuICAgICAgICArIHRoaXMudG9rZW4uZGVwdGhcbiAgICAgICAgKyAnPidcbiAgICAgICAgKyB0aGlzLmlubGluZS5vdXRwdXQodGhpcy50b2tlbi50ZXh0KVxuICAgICAgICArICc8L2gnXG4gICAgICAgICsgdGhpcy50b2tlbi5kZXB0aFxuICAgICAgICArICc+XFxuJztcbiAgICB9XG4gICAgY2FzZSAnY29kZSc6IHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGlnaGxpZ2h0KSB7XG4gICAgICAgIHZhciBjb2RlID0gdGhpcy5vcHRpb25zLmhpZ2hsaWdodCh0aGlzLnRva2VuLnRleHQsIHRoaXMudG9rZW4ubGFuZyk7XG4gICAgICAgIGlmIChjb2RlICE9IG51bGwgJiYgY29kZSAhPT0gdGhpcy50b2tlbi50ZXh0KSB7XG4gICAgICAgICAgdGhpcy50b2tlbi5lc2NhcGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnRva2VuLnRleHQgPSBjb2RlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy50b2tlbi5lc2NhcGVkKSB7XG4gICAgICAgIHRoaXMudG9rZW4udGV4dCA9IGVzY2FwZSh0aGlzLnRva2VuLnRleHQsIHRydWUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJzxwcmU+PGNvZGUnXG4gICAgICAgICsgKHRoaXMudG9rZW4ubGFuZ1xuICAgICAgICA/ICcgY2xhc3M9XCInXG4gICAgICAgICsgdGhpcy5vcHRpb25zLmxhbmdQcmVmaXhcbiAgICAgICAgKyB0aGlzLnRva2VuLmxhbmdcbiAgICAgICAgKyAnXCInXG4gICAgICAgIDogJycpXG4gICAgICAgICsgJz4nXG4gICAgICAgICsgdGhpcy50b2tlbi50ZXh0XG4gICAgICAgICsgJzwvY29kZT48L3ByZT5cXG4nO1xuICAgIH1cbiAgICBjYXNlICd0YWJsZSc6IHtcbiAgICAgIHZhciBib2R5ID0gJydcbiAgICAgICAgLCBoZWFkaW5nXG4gICAgICAgICwgaVxuICAgICAgICAsIHJvd1xuICAgICAgICAsIGNlbGxcbiAgICAgICAgLCBqO1xuXG4gICAgICAvLyBoZWFkZXJcbiAgICAgIGJvZHkgKz0gJzx0aGVhZD5cXG48dHI+XFxuJztcbiAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnRva2VuLmhlYWRlci5sZW5ndGg7IGkrKykge1xuICAgICAgICBoZWFkaW5nID0gdGhpcy5pbmxpbmUub3V0cHV0KHRoaXMudG9rZW4uaGVhZGVyW2ldKTtcbiAgICAgICAgYm9keSArPSB0aGlzLnRva2VuLmFsaWduW2ldXG4gICAgICAgICAgPyAnPHRoIGFsaWduPVwiJyArIHRoaXMudG9rZW4uYWxpZ25baV0gKyAnXCI+JyArIGhlYWRpbmcgKyAnPC90aD5cXG4nXG4gICAgICAgICAgOiAnPHRoPicgKyBoZWFkaW5nICsgJzwvdGg+XFxuJztcbiAgICAgIH1cbiAgICAgIGJvZHkgKz0gJzwvdHI+XFxuPC90aGVhZD5cXG4nO1xuXG4gICAgICAvLyBib2R5XG4gICAgICBib2R5ICs9ICc8dGJvZHk+XFxuJ1xuICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMudG9rZW4uY2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcm93ID0gdGhpcy50b2tlbi5jZWxsc1tpXTtcbiAgICAgICAgYm9keSArPSAnPHRyPlxcbic7XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCByb3cubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjZWxsID0gdGhpcy5pbmxpbmUub3V0cHV0KHJvd1tqXSk7XG4gICAgICAgICAgYm9keSArPSB0aGlzLnRva2VuLmFsaWduW2pdXG4gICAgICAgICAgICA/ICc8dGQgYWxpZ249XCInICsgdGhpcy50b2tlbi5hbGlnbltqXSArICdcIj4nICsgY2VsbCArICc8L3RkPlxcbidcbiAgICAgICAgICAgIDogJzx0ZD4nICsgY2VsbCArICc8L3RkPlxcbic7XG4gICAgICAgIH1cbiAgICAgICAgYm9keSArPSAnPC90cj5cXG4nO1xuICAgICAgfVxuICAgICAgYm9keSArPSAnPC90Ym9keT5cXG4nO1xuXG4gICAgICByZXR1cm4gJzx0YWJsZT5cXG4nXG4gICAgICAgICsgYm9keVxuICAgICAgICArICc8L3RhYmxlPlxcbic7XG4gICAgfVxuICAgIGNhc2UgJ2Jsb2NrcXVvdGVfc3RhcnQnOiB7XG4gICAgICB2YXIgYm9keSA9ICcnO1xuXG4gICAgICB3aGlsZSAodGhpcy5uZXh0KCkudHlwZSAhPT0gJ2Jsb2NrcXVvdGVfZW5kJykge1xuICAgICAgICBib2R5ICs9IHRoaXMudG9rKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAnPGJsb2NrcXVvdGU+XFxuJ1xuICAgICAgICArIGJvZHlcbiAgICAgICAgKyAnPC9ibG9ja3F1b3RlPlxcbic7XG4gICAgfVxuICAgIGNhc2UgJ2xpc3Rfc3RhcnQnOiB7XG4gICAgICB2YXIgdHlwZSA9IHRoaXMudG9rZW4ub3JkZXJlZCA/ICdvbCcgOiAndWwnXG4gICAgICAgICwgYm9keSA9ICcnO1xuXG4gICAgICB3aGlsZSAodGhpcy5uZXh0KCkudHlwZSAhPT0gJ2xpc3RfZW5kJykge1xuICAgICAgICBib2R5ICs9IHRoaXMudG9rKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAnPCdcbiAgICAgICAgKyB0eXBlXG4gICAgICAgICsgJz5cXG4nXG4gICAgICAgICsgYm9keVxuICAgICAgICArICc8LydcbiAgICAgICAgKyB0eXBlXG4gICAgICAgICsgJz5cXG4nO1xuICAgIH1cbiAgICBjYXNlICdsaXN0X2l0ZW1fc3RhcnQnOiB7XG4gICAgICB2YXIgYm9keSA9ICcnO1xuXG4gICAgICB3aGlsZSAodGhpcy5uZXh0KCkudHlwZSAhPT0gJ2xpc3RfaXRlbV9lbmQnKSB7XG4gICAgICAgIGJvZHkgKz0gdGhpcy50b2tlbi50eXBlID09PSAndGV4dCdcbiAgICAgICAgICA/IHRoaXMucGFyc2VUZXh0KClcbiAgICAgICAgICA6IHRoaXMudG9rKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAnPGxpPidcbiAgICAgICAgKyBib2R5XG4gICAgICAgICsgJzwvbGk+XFxuJztcbiAgICB9XG4gICAgY2FzZSAnbG9vc2VfaXRlbV9zdGFydCc6IHtcbiAgICAgIHZhciBib2R5ID0gJyc7XG5cbiAgICAgIHdoaWxlICh0aGlzLm5leHQoKS50eXBlICE9PSAnbGlzdF9pdGVtX2VuZCcpIHtcbiAgICAgICAgYm9keSArPSB0aGlzLnRvaygpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJzxsaT4nXG4gICAgICAgICsgYm9keVxuICAgICAgICArICc8L2xpPlxcbic7XG4gICAgfVxuICAgIGNhc2UgJ2h0bWwnOiB7XG4gICAgICByZXR1cm4gIXRoaXMudG9rZW4ucHJlICYmICF0aGlzLm9wdGlvbnMucGVkYW50aWNcbiAgICAgICAgPyB0aGlzLmlubGluZS5vdXRwdXQodGhpcy50b2tlbi50ZXh0KVxuICAgICAgICA6IHRoaXMudG9rZW4udGV4dDtcbiAgICB9XG4gICAgY2FzZSAncGFyYWdyYXBoJzoge1xuICAgICAgcmV0dXJuICc8cD4nXG4gICAgICAgICsgdGhpcy5pbmxpbmUub3V0cHV0KHRoaXMudG9rZW4udGV4dClcbiAgICAgICAgKyAnPC9wPlxcbic7XG4gICAgfVxuICAgIGNhc2UgJ3RleHQnOiB7XG4gICAgICByZXR1cm4gJzxwPidcbiAgICAgICAgKyB0aGlzLnBhcnNlVGV4dCgpXG4gICAgICAgICsgJzwvcD5cXG4nO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBIZWxwZXJzXG4gKi9cblxuZnVuY3Rpb24gZXNjYXBlKGh0bWwsIGVuY29kZSkge1xuICByZXR1cm4gaHRtbFxuICAgIC5yZXBsYWNlKCFlbmNvZGUgPyAvJig/ISM/XFx3KzspL2cgOiAvJi9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlKHJlZ2V4LCBvcHQpIHtcbiAgcmVnZXggPSByZWdleC5zb3VyY2U7XG4gIG9wdCA9IG9wdCB8fCAnJztcbiAgcmV0dXJuIGZ1bmN0aW9uIHNlbGYobmFtZSwgdmFsKSB7XG4gICAgaWYgKCFuYW1lKSByZXR1cm4gbmV3IFJlZ0V4cChyZWdleCwgb3B0KTtcbiAgICB2YWwgPSB2YWwuc291cmNlIHx8IHZhbDtcbiAgICB2YWwgPSB2YWwucmVwbGFjZSgvKF58W15cXFtdKVxcXi9nLCAnJDEnKTtcbiAgICByZWdleCA9IHJlZ2V4LnJlcGxhY2UobmFtZSwgdmFsKTtcbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5ub29wLmV4ZWMgPSBub29wO1xuXG5mdW5jdGlvbiBtZXJnZShvYmopIHtcbiAgdmFyIGkgPSAxXG4gICAgLCB0YXJnZXRcbiAgICAsIGtleTtcblxuICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHRhcmdldCA9IGFyZ3VtZW50c1tpXTtcbiAgICBmb3IgKGtleSBpbiB0YXJnZXQpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGFyZ2V0LCBrZXkpKSB7XG4gICAgICAgIG9ialtrZXldID0gdGFyZ2V0W2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBNYXJrZWRcbiAqL1xuXG5mdW5jdGlvbiBtYXJrZWQoc3JjLCBvcHQpIHtcbiAgdHJ5IHtcbiAgICBpZiAob3B0KSBvcHQgPSBtZXJnZSh7fSwgbWFya2VkLmRlZmF1bHRzLCBvcHQpO1xuICAgIHJldHVybiBQYXJzZXIucGFyc2UoTGV4ZXIubGV4KHNyYywgb3B0KSwgb3B0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGUubWVzc2FnZSArPSAnXFxuUGxlYXNlIHJlcG9ydCB0aGlzIHRvIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGpqL21hcmtlZC4nO1xuICAgIGlmICgob3B0IHx8IG1hcmtlZC5kZWZhdWx0cykuc2lsZW50KSB7XG4gICAgICByZXR1cm4gJzxwPkFuIGVycm9yIG9jY3VyZWQ6PC9wPjxwcmU+J1xuICAgICAgICArIGVzY2FwZShlLm1lc3NhZ2UgKyAnJywgdHJ1ZSlcbiAgICAgICAgKyAnPC9wcmU+JztcbiAgICB9XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG4vKipcbiAqIE9wdGlvbnNcbiAqL1xuXG5tYXJrZWQub3B0aW9ucyA9XG5tYXJrZWQuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uKG9wdCkge1xuICBtZXJnZShtYXJrZWQuZGVmYXVsdHMsIG9wdCk7XG4gIHJldHVybiBtYXJrZWQ7XG59O1xuXG5tYXJrZWQuZGVmYXVsdHMgPSB7XG4gIGdmbTogdHJ1ZSxcbiAgdGFibGVzOiB0cnVlLFxuICBicmVha3M6IGZhbHNlLFxuICBwZWRhbnRpYzogZmFsc2UsXG4gIHNhbml0aXplOiBmYWxzZSxcbiAgc21hcnRMaXN0czogZmFsc2UsXG4gIHNpbGVudDogZmFsc2UsXG4gIGhpZ2hsaWdodDogbnVsbCxcbiAgbGFuZ1ByZWZpeDogJ2xhbmctJ1xufTtcblxuLyoqXG4gKiBFeHBvc2VcbiAqL1xuXG5tYXJrZWQuUGFyc2VyID0gUGFyc2VyO1xubWFya2VkLnBhcnNlciA9IFBhcnNlci5wYXJzZTtcblxubWFya2VkLkxleGVyID0gTGV4ZXI7XG5tYXJrZWQubGV4ZXIgPSBMZXhlci5sZXg7XG5cbm1hcmtlZC5JbmxpbmVMZXhlciA9IElubGluZUxleGVyO1xubWFya2VkLmlubGluZUxleGVyID0gSW5saW5lTGV4ZXIub3V0cHV0O1xuXG5tYXJrZWQucGFyc2UgPSBtYXJrZWQ7XG5cbmlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBtYXJrZWQ7XG59IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBtYXJrZWQ7IH0pO1xufSBlbHNlIHtcbiAgdGhpcy5tYXJrZWQgPSBtYXJrZWQ7XG59XG5cbn0pLmNhbGwoZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzIHx8ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IGdsb2JhbCk7XG59KCkpO1xuXG59KSh3aW5kb3cpIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuXG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuZXhwb3J0cy5pc0RhdGUgPSBmdW5jdGlvbihvYmope3JldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nfTtcbmV4cG9ydHMuaXNSZWdFeHAgPSBmdW5jdGlvbihvYmope3JldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSd9O1xuXG5cbmV4cG9ydHMucHJpbnQgPSBmdW5jdGlvbiAoKSB7fTtcbmV4cG9ydHMucHV0cyA9IGZ1bmN0aW9uICgpIHt9O1xuZXhwb3J0cy5kZWJ1ZyA9IGZ1bmN0aW9uKCkge307XG5cbmV4cG9ydHMuaW5zcGVjdCA9IGZ1bmN0aW9uKG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycykge1xuICB2YXIgc2VlbiA9IFtdO1xuXG4gIHZhciBzdHlsaXplID0gZnVuY3Rpb24oc3RyLCBzdHlsZVR5cGUpIHtcbiAgICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3NcbiAgICB2YXIgc3R5bGVzID1cbiAgICAgICAgeyAnYm9sZCcgOiBbMSwgMjJdLFxuICAgICAgICAgICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgICAgICAgICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICAgICAgICAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgICAgICAgICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICAgICAgICAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICAgICAgICAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAgICAgICAgICdibHVlJyA6IFszNCwgMzldLFxuICAgICAgICAgICdjeWFuJyA6IFszNiwgMzldLFxuICAgICAgICAgICdncmVlbicgOiBbMzIsIDM5XSxcbiAgICAgICAgICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgICAgICAgICAncmVkJyA6IFszMSwgMzldLFxuICAgICAgICAgICd5ZWxsb3cnIDogWzMzLCAzOV0gfTtcblxuICAgIHZhciBzdHlsZSA9XG4gICAgICAgIHsgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICAgICAgICAgJ251bWJlcic6ICdibHVlJyxcbiAgICAgICAgICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAgICAgICAgICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICAgICAgICAgJ251bGwnOiAnYm9sZCcsXG4gICAgICAgICAgJ3N0cmluZyc6ICdncmVlbicsXG4gICAgICAgICAgJ2RhdGUnOiAnbWFnZW50YScsXG4gICAgICAgICAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgICAgICAgICAncmVnZXhwJzogJ3JlZCcgfVtzdHlsZVR5cGVdO1xuXG4gICAgaWYgKHN0eWxlKSB7XG4gICAgICByZXR1cm4gJ1xcMDMzWycgKyBzdHlsZXNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgICAnXFwwMzNbJyArIHN0eWxlc1tzdHlsZV1bMV0gKyAnbSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICB9O1xuICBpZiAoISBjb2xvcnMpIHtcbiAgICBzdHlsaXplID0gZnVuY3Rpb24oc3RyLCBzdHlsZVR5cGUpIHsgcmV0dXJuIHN0cjsgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdCh2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gICAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAgIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUuaW5zcGVjdCA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgICAgdmFsdWUgIT09IGV4cG9ydHMgJiZcbiAgICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuXG4gICAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcblxuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG5cbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcblxuICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gICAgfVxuICAgIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBzdHlsaXplKCdudWxsJywgJ251bGwnKTtcbiAgICB9XG5cbiAgICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gICAgdmFyIHZpc2libGVfa2V5cyA9IE9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICB2YXIga2V5cyA9IHNob3dIaWRkZW4gPyBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSkgOiB2aXNpYmxlX2tleXM7XG5cbiAgICAvLyBGdW5jdGlvbnMgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmIGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdyZWdleHAnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEYXRlcyB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkXG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkgJiYga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzdHlsaXplKHZhbHVlLnRvVVRDU3RyaW5nKCksICdkYXRlJyk7XG4gICAgfVxuXG4gICAgdmFyIGJhc2UsIHR5cGUsIGJyYWNlcztcbiAgICAvLyBEZXRlcm1pbmUgdGhlIG9iamVjdCB0eXBlXG4gICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICB0eXBlID0gJ0FycmF5JztcbiAgICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gICAgfSBlbHNlIHtcbiAgICAgIHR5cGUgPSAnT2JqZWN0JztcbiAgICAgIGJyYWNlcyA9IFsneycsICd9J107XG4gICAgfVxuXG4gICAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIGJhc2UgPSAoaXNSZWdFeHAodmFsdWUpKSA/ICcgJyArIHZhbHVlIDogJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgICB9IGVsc2Uge1xuICAgICAgYmFzZSA9ICcnO1xuICAgIH1cblxuICAgIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICBiYXNlID0gJyAnICsgdmFsdWUudG9VVENTdHJpbmcoKTtcbiAgICB9XG5cbiAgICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICAgIH1cblxuICAgIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdyZWdleHAnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2Vlbi5wdXNoKHZhbHVlKTtcblxuICAgIHZhciBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBuYW1lLCBzdHI7XG4gICAgICBpZiAodmFsdWUuX19sb29rdXBHZXR0ZXJfXykge1xuICAgICAgICBpZiAodmFsdWUuX19sb29rdXBHZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgaWYgKHZhbHVlLl9fbG9va3VwU2V0dGVyX18oa2V5KSkge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodmFsdWUuX19sb29rdXBTZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodmlzaWJsZV9rZXlzLmluZGV4T2Yoa2V5KSA8IDApIHtcbiAgICAgICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgICAgIH1cbiAgICAgIGlmICghc3RyKSB7XG4gICAgICAgIGlmIChzZWVuLmluZGV4T2YodmFsdWVba2V5XSkgPCAwKSB7XG4gICAgICAgICAgaWYgKHJlY3Vyc2VUaW1lcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyID0gZm9ybWF0KHZhbHVlW2tleV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgPSBmb3JtYXQodmFsdWVba2V5XSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAodHlwZSA9PT0gJ0FycmF5JyAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgICAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgICAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgICAgICBuYW1lID0gc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICAgICAgbmFtZSA9IHN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbiAgICB9KTtcblxuICAgIHNlZW4ucG9wKCk7XG5cbiAgICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICAgIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgICAgbnVtTGluZXNFc3QrKztcbiAgICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICAgIHJldHVybiBwcmV2ICsgY3VyLmxlbmd0aCArIDE7XG4gICAgfSwgMCk7XG5cbiAgICBpZiAobGVuZ3RoID4gNTApIHtcbiAgICAgIG91dHB1dCA9IGJyYWNlc1swXSArXG4gICAgICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgICAgICcgJyArXG4gICAgICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgICAgIGJyYWNlc1sxXTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQgPSBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuICByZXR1cm4gZm9ybWF0KG9iaiwgKHR5cGVvZiBkZXB0aCA9PT0gJ3VuZGVmaW5lZCcgPyAyIDogZGVwdGgpKTtcbn07XG5cblxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gYXIgaW5zdGFuY2VvZiBBcnJheSB8fFxuICAgICAgICAgQXJyYXkuaXNBcnJheShhcikgfHxcbiAgICAgICAgIChhciAmJiBhciAhPT0gT2JqZWN0LnByb3RvdHlwZSAmJiBpc0FycmF5KGFyLl9fcHJvdG9fXykpO1xufVxuXG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiByZSBpbnN0YW5jZW9mIFJlZ0V4cCB8fFxuICAgICh0eXBlb2YgcmUgPT09ICdvYmplY3QnICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nKTtcbn1cblxuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICBpZiAoZCBpbnN0YW5jZW9mIERhdGUpIHJldHVybiB0cnVlO1xuICBpZiAodHlwZW9mIGQgIT09ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gIHZhciBwcm9wZXJ0aWVzID0gRGF0ZS5wcm90b3R5cGUgJiYgT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXMoRGF0ZS5wcm90b3R5cGUpO1xuICB2YXIgcHJvdG8gPSBkLl9fcHJvdG9fXyAmJiBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyhkLl9fcHJvdG9fXyk7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShwcm90bykgPT09IEpTT04uc3RyaW5naWZ5KHByb3BlcnRpZXMpO1xufVxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbiAobXNnKSB7fTtcblxuZXhwb3J0cy5wdW1wID0gbnVsbDtcblxudmFyIE9iamVjdF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSByZXMucHVzaChrZXkpO1xuICAgIHJldHVybiByZXM7XG59O1xuXG52YXIgT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgcmVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBPYmplY3RfY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiAocHJvdG90eXBlLCBwcm9wZXJ0aWVzKSB7XG4gICAgLy8gZnJvbSBlczUtc2hpbVxuICAgIHZhciBvYmplY3Q7XG4gICAgaWYgKHByb3RvdHlwZSA9PT0gbnVsbCkge1xuICAgICAgICBvYmplY3QgPSB7ICdfX3Byb3RvX18nIDogbnVsbCB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm90b3R5cGUgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICd0eXBlb2YgcHJvdG90eXBlWycgKyAodHlwZW9mIHByb3RvdHlwZSkgKyAnXSAhPSBcXCdvYmplY3RcXCcnXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBUeXBlID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgICAgICBvYmplY3QgPSBuZXcgVHlwZSgpO1xuICAgICAgICBvYmplY3QuX19wcm90b19fID0gcHJvdG90eXBlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHByb3BlcnRpZXMgIT09ICd1bmRlZmluZWQnICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKG9iamVjdCwgcHJvcGVydGllcyk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5leHBvcnRzLmluaGVyaXRzID0gZnVuY3Rpb24oY3Rvciwgc3VwZXJDdG9yKSB7XG4gIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yO1xuICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdF9jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICB2YWx1ZTogY3RvcixcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9XG4gIH0pO1xufTtcblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKHR5cGVvZiBmICE9PSAnc3RyaW5nJykge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChleHBvcnRzLmluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOiByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvcih2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pe1xuICAgIGlmICh4ID09PSBudWxsIHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBleHBvcnRzLmluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChyYXJyeSwgdGVtcGxhdGUpIHtcblxuICB2YXIgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIHRlbXBsYXRlID0gdGVtcGxhdGUgfHwgZnVuY3Rpb24gKHZhbCwga2V5LCBlbCkge1xuICAgIGZ1bmN0aW9uIHByZSAodmFsKSB7IHJldHVybiAnPHByZT4nK0pTT04uc3RyaW5naWZ5KHZhbCkrJzwvcHJlPicgfVxuICAgIGlmKGVsKVxuICAgICAgcmV0dXJuIGVsLmlubmVySFRNTCA9IHByZSh2YWwpLCBlbFxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxuICAgIGVsLmlubmVySFRNTCA9IHByZSh2YWwpXG4gICAgcmV0dXJuIGVsXG4gIH1cblxuICBjb25zb2xlLmxvZyh0ZW1wbGF0ZSlcblxuICB2YXIgZWxlbWVudHMgPSB7fVxuXG4gIHJhcnJ5Lm9uKCd1cGRhdGUnLCBmdW5jdGlvbiAoY2hhbmdlKSB7XG4gICAgZm9yKHZhciBpZCBpbiBjaGFuZ2UpXG4gICAgICB1cGRhdGUoaWQsIGNoYW5nZVtpZF0pXG4gIH0pXG5cbiAgZnVuY3Rpb24gdXBkYXRlIChrZXksIGNoYW5nZSkge1xuICAgIHZhciBlbFxuICAgIGlmKGVsID0gZWxlbWVudHNba2V5XSkge1xuICAgICAgaWYoY2hhbmdlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHJvb3QucmVtb3ZlQ2hpbGQoZWwpXG4gICAgICB9XG5cbiAgICAgIHZhciBfZWwgPSB0ZW1wbGF0ZS5jYWxsKGVsLCBjaGFuZ2UsIGtleSwgZWwpXG4gICAgICBpZihfZWwgIT0gZWwpIHtcbiAgICAgICAgZWxlbWVudHNba2V5XSA9IF9lbFxuICAgICAgICBkaXYucmVwbGFjZUNoaWxkKF9lbCwgZWwpXG4gICAgICB9XG4gICAgICAvL2Vsc2UsIHRlbXBsYXRlIHVwZGF0ZWQgZWwuXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgZWwgPSB0ZW1wbGF0ZS5jYWxsKG51bGwsIGNoYW5nZSwga2V5KVxuICAgICAgY29uc29sZS5sb2coZWwpXG4gICAgLy92YXIgcmFycnkuaW5kZXhPZihpZClcbiAgICAvL2luc2VydCBiZWZvcmUgdGhlIGVsZW1lbnQgdGhhdCBpcyBhbHJlYWR5IHRoZXJlLi4uXG4gICAgdmFyIGJlZm9yZSA9IGVsZW1lbnRzW3JhcnJ5LmtleXNbcmFycnkuaW5kZXhPZktleShrZXkpICsgMV1dXG4gICAgZWxlbWVudHNba2V5XSA9IGVsXG4gICAgaWYoYmVmb3JlKSB7XG4gICAgICByb290Lmluc2VydEJlZm9yZShlbCwgYmVmb3JlKVxuICAgIH0gZWxzZSB7XG4gICAgICByb290LmFwcGVuZENoaWxkKGVsKVxuICAgIH1cbiAgfVxuXG4gIC8vcmVuZGVyIHRoZSBjdXJyZW50IGNvbnRlbnRzLi4uXG4gIHJhcnJ5LmtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgdXBkYXRlKGtleSwgcmFycnkuZ2V0KGtleSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJvb3Rcbn1cblxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGlmIChldi5zb3VyY2UgPT09IHdpbmRvdyAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7aWYgKCFwcm9jZXNzLkV2ZW50RW1pdHRlcikgcHJvY2Vzcy5FdmVudEVtaXR0ZXIgPSBmdW5jdGlvbiAoKSB7fTtcblxudmFyIEV2ZW50RW1pdHRlciA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gcHJvY2Vzcy5FdmVudEVtaXR0ZXI7XG52YXIgaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nXG4gICAgPyBBcnJheS5pc0FycmF5XG4gICAgOiBmdW5jdGlvbiAoeHMpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSdcbiAgICB9XG47XG5mdW5jdGlvbiBpbmRleE9mICh4cywgeCkge1xuICAgIGlmICh4cy5pbmRleE9mKSByZXR1cm4geHMuaW5kZXhPZih4KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh4ID09PSB4c1tpXSkgcmV0dXJuIGk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxuLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXG4vLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbi8vXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxudmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBuO1xufTtcblxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc0FycmF5KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKVxuICAgIHtcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiBmYWxzZTtcbiAgdmFyIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGlmICghaGFuZGxlcikgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChpc0FycmF5KGhhbmRsZXIpKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8vIEV2ZW50RW1pdHRlciBpcyBkZWZpbmVkIGluIHNyYy9ub2RlX2V2ZW50cy5jY1xuLy8gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0KCkgaXMgYWxzbyBkZWZpbmVkIHRoZXJlLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2FkZExpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lcnNcIi5cbiAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICAgIHZhciBtO1xuICAgICAgaWYgKHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5vbih0eXBlLCBmdW5jdGlvbiBnKCkge1xuICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNBcnJheShsaXN0KSkge1xuICAgIHZhciBpID0gaW5kZXhPZihsaXN0LCBsaXN0ZW5lcik7XG4gICAgaWYgKGkgPCAwKSByZXR1cm4gdGhpcztcbiAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT0gMClcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH0gZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdID09PSBsaXN0ZW5lcikge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICh0eXBlICYmIHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xuICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICB9XG4gIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG59O1xuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiXG52YXIgaGVhZGVyID0gcmVxdWlyZSgnaGVhZGVyLXN0cmVhbScpXG5cbnZhciB2ZXJzaW9uXG4vKipcblRPRE9cbm1vcmUgc29waGlzdGljYXRlZCByZWxvYWRpbmcsIFxucGFzcyBpbiBhIHBhY2thZ2UgYW5kIGEgc2VtdmVyIHJhbmdlLi4uXG4qKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgIGhlYWRlcihzdHJlYW0pLndyaXRlSGVhZCgpXG4gICAgc3RyZWFtLm9uKCdoZWFkZXInLCBmdW5jdGlvbiAobWV0YSkge1xuXG4gICAgICBpZighdmVyc2lvbilcbiAgICAgICAgdmVyc2lvbiA9IG1ldGEudmVyc2lvblxuICAgICAgaWYobWV0YS52ZXJzaW9uICE9PSB2ZXJzaW9uKSB7XG4gICAgICAgIHN0cmVhbS5lbWl0KCdyZWxvYWQnLCBtZXRhLnZlcnNpb24sIHZlcnNpb24pXG4gICAgICAgIHN0cmVhbS5lbmQoKVxuXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24ucmVsb2FkKHRydWUpXG4gICAgICB9XG5cbiAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncylcbiAgICB9KVxuICB9XG5cbn1cblxudmFyIHdyYXAgPSBmdW5jdGlvbiAoc3RyZWFtLCBfdmVyc2lvbikge1xuICB2ZXJzaW9uID0gX3ZlcnNpb24gfHwgdmVyc2lvblxuICBzdHJlYW0gPSBoZWFkZXIoc3RyZWFtKVxuICBzdHJlYW0ub24oJ2hlYWRlcicsIGZ1bmN0aW9uIChtZXRhKSB7XG4gICAgLy9pcyBpdCBzYW1lIHZlcnNpb24gYXMgbGFzdCB0aW1lP1xuICAgIGlmKCF2ZXJzaW9uKVxuICAgICAgdmVyc2lvbiA9IG1ldGEudmVyc2lvblxuICAgIGlmKG1ldGEudmVyc2lvbiAhPT0gdmVyc2lvbikge1xuICAgICAgc3RyZWFtLmVtaXQoJ3JlbG9hZCcsIG1ldGEudmVyc2lvbiwgdmVyc2lvbilcbiAgICAgIHN0cmVhbS5lbmQoKVxuXG4gICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKHRydWUpXG4gICAgfVxuICB9KVxuICByZXR1cm4gc3RyZWFtXG59XG4iLCJ2YXIgZGlmZiAgICAgPSByZXF1aXJlKCdhZGlmZicpLmRpZmZcbnZhciBSQXJyYXkgICA9IHJlcXVpcmUoJ3ItYXJyYXknKVxudmFyIGluaGVyaXRzID0gcmVxdWlyZSgndXRpbCcpLmluaGVyaXRzXG5cbmZ1bmN0aW9uIHBhdGNoIChhLCBjaGFuZ2VzKSB7XG4gIGNoYW5nZXMuZm9yRWFjaChmdW5jdGlvbiAocGF0Y2gpIHtcbiAgICBhLnNwbGljZS5hcHBseShhLCBwYXRjaClcbiAgfSlcbiAgcmV0dXJuIGFcbn1cblxuZnVuY3Rpb24gc3BsaXQoc3RyKSB7XG4gIHJldHVybiBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbiAobCwgaSwgYSkge1xuICAgIGlmKGkgIT0gYS5sZW5ndGggLSAxKVxuICAgICAgcmV0dXJuIGwgKyAnXFxuJ1xuICAgIHJldHVybiBsXG4gIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUkVkaXRcblxuaW5oZXJpdHMoUkVkaXQsIFJBcnJheSlcblxuZnVuY3Rpb24gUkVkaXQoKSB7XG4gIGlmKCEodGhpcyBpbnN0YW5jZW9mIFJFZGl0KSkgcmV0dXJuIG5ldyBSRWRpdCgpXG4gIFJBcnJheS5jYWxsKHRoaXMpXG59XG5cbnZhciBSID0gUkVkaXQucHJvdG90eXBlXG5cblIudGV4dCAgPSBmdW5jdGlvbiB0ZXh0ICh0ZXh0KSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgIHJldHVybiB0aGlzLnRvSlNPTigpLmpvaW4oJycpXG4gIFxuICB2YXIgb2xkID0gdGhpcy50b0pTT04oKVxuICB0ZXh0ID0gc3BsaXQodGV4dClcbiAgLy9nb3QgdG8gYWRqdXN0IHRoZSB1c2VyJ3Mgc2VsZWN0aW9uIG9uIHRoZSB0ZXh0IGFyZWEuLi5cbiAgdmFyIHAgPSBkaWZmKG9sZCwgdGV4dClcbiAgcGF0Y2godGhpcywgcClcbn1cblxuUi51bndyYXAgPSBmdW5jdGlvbiAoKSB7XG5cbn1cblxuUi53aWRnZXQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJylcbiAgdGEuc2V0QXR0cmlidXRlKCdjb2xzJywgODApXG4gIHRhLnNldEF0dHJpYnV0ZSgncm93cycsIDI0KVxuICB0aGlzLndyYXAodGEpXG4gIHJldHVybiB0YVxufVxuXG5SLndyYXAgPSBmdW5jdGlvbiAodGEpIHtcbiAgaWYoIXRhKSB0aHJvdyBuZXcgRXJyb3IoJ3dyYXAodGEpIGV4cGVjdHMgVGV4dEFyZWEsIG9yIElucHV0JylcblxuICB2YXIgY3Vyc29yID0gMCwgc3RhcnRcbiAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgaWYodGhpcy53cmFwcGVkKVxuICAgIHRocm93IG5ldyBFcnJvcignckVkaXQgaXMgYWxyZWFkeSB3cmFwcGluZyBhIHRleHRhcmVhLiB1bndyYXAgaXQgZmlyc3QhJylcblxuICBpZih0YS5fckVkaXRXcmFwcGVyKVxuICAgIHRhLl9yRWRpdFdyYXBwZXIudW53cmFwKClcblxuICB0YS5fckVkaXRXcmFwcGVyID0gdGhpc1xuICB0aGlzLndyYXBwZWQgPSB0YVxuXG4gIHRhLnZhbHVlID0gdGhpcy50ZXh0KClcblxuICBmdW5jdGlvbiBvblByZXVwZGF0ZSAoY2gpIHtcbiAgICAvL2ZvcmNlIHVwZGF0ZSB3aGVuIHJlY2lldmUgbWVzc2FnZS5cbiAgICBjdXJzb3IgPSAwXG4gICAgc3RhcnQgPSB0YS5zZWxlY3Rpb25TdGFydFxuICAgIGVuZCAgID0gdGEuc2VsZWN0aW9uRW5kXG4gICAgLy93aGF0IGF0b20gY29udGFpbnMgdGhlIGN1cnNvcj9cbiAgICB2YXIgc3RhcnRLZXksIHN1bSA9IDBcbiAgICBmb3IgKHZhciBpIGluIHNlbGYua2V5cykge1xuICAgICAgdmFyIGtleSA9IHNlbGYua2V5c1tpXVxuICAgICAgaWYoKHN1bSA9IHNlbGYuc3RvcmVba2V5XS5sZW5ndGggKyBzdW0pID49IHN0YXJ0KSB7XG4gICAgICAgIHN0YXJ0S2V5ID0ga2V5OyBicmVha1xuICAgICAgfVxuICAgIH1cbiAgICAvL2hvdyBtdWNoIHdpbGwgYmUgaW5zZXJ0ZWQgaW50byB0aGUgZG9jdW1lbnQ/XG4gICAgZm9yKHZhciBrZXkgaW4gY2gpIHtcbiAgICAgIGlmKGtleSA8IHN0YXJ0S2V5KVxuICAgICAgICBjdXJzb3IgKz0gXG4gICAgICAgICAgKGNoW2tleV0gPyBjaFtrZXldLmxlbmd0aCA6IDApXG4gICAgICAgIC0gKHNlbGYuc3RvcmVba2V5XSA/IHNlbGYuc3RvcmVba2V5XS5sZW5ndGggOiAwKVxuICAgIH1cbiAgICAvL1RISVMgSVMgQUNUVUFMTFkgV1JPTkcuIENBTidUIGluc2VydCBpbnRvIGEgc2VsZWN0aW9uIVxuICAgIHN0YXJ0ID0gc3RhcnQgKyBjdXJzb3JcbiAgICBlbmQgICA9IGVuZCAgICsgY3Vyc29yXG4gIH1cbiAgdGhpcy5vbigncHJldXBkYXRlJywgb25QcmV1cGRhdGUpXG4gIGZ1bmN0aW9uIG9uX3VwZGF0ZSAodXBkYXRlKSB7XG4gICAgaWYodXBkYXRlWzJdICE9PSBzZWxmLmlkKSB7XG4gICAgICB0YS52YWx1ZSA9IHNlbGYudG9KU09OKCkuam9pbignJylcbiAgICAgIHRhLnNlbGVjdGlvblN0YXJ0ID0gdGEuc2VsZWN0aW9uRW5kID0gc3RhcnRcbiAgICB9XG4gIH1cbiAgdGhpcy5vbignX3VwZGF0ZScgICwgb25fdXBkYXRlKVxuICB2YXIgcGVuZGluZyA9IGZhbHNlXG4gIGZ1bmN0aW9uIG9uSW5wdXQgKCkge1xuICAgIC8vaWYocGVuZGluZykgcmV0dXJuXG4gICAgLy9wZW5kaW5nID0gdHJ1ZVxuICAgIC8vc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgLy9wZW5kaW5nID0gZmFsc2VcbiAgICBzZWxmLnRleHQodGEudmFsdWUpXG4gICAgLy99LCAzMDApXG4gIH1cbiAgZnVuY3Rpb24gb25LZXlkb3duICgpIHtcbiAgICBzdGFydCA9IHRhLnNlbGVjdGlvblN0YXJ0XG4gICAgZW5kICAgPSB0YS5zZWxlY3Rpb25FbmRcbiAgfVxuICBmdW5jdGlvbiBvbkZvY3VzICgpIHtcbiAgICB0YS5zZWxlY3Rpb25TdGFydCA9IHRhLnNlbGVjdGlvbkVuZCA9IHN0YXJ0XG4gIH1cbiAgdGEuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnICAsIG9uSW5wdXQpXG4gIHRhLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleWRvd24pXG4gIHRhLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJyAgLCBvbkZvY3VzIClcblxuICB0aGlzLnVud3JhcCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0YS5yZW1vdmVFdmVudExpc3RlbmVyKCdpbnB1dCcgICwgb25JbnB1dClcbiAgICB0YS5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlkb3duKVxuICAgIHRhLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJyAgLCBvbkZvY3VzKVxuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoJ3ByZXVwZGF0ZScgLCBvblByZXVwZGF0ZSlcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCdfdXBkYXRlJyAgICwgb25fdXBkYXRlKVxuICAgIHRoaXMudW53cmFwID0gZnVuY3Rpb24gKCkge31cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB0aHJvdWdoID0gcmVxdWlyZSgndGhyb3VnaCcpXG4gICwgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKVxuICAsIGR1cGxleCA9IHJlcXVpcmUoJ2R1cGxleCcpXG4gICwgc2VyaWFsaXplciA9IHJlcXVpcmUoJ3N0cmVhbS1zZXJpYWxpemVyJylcblxuZnVuY3Rpb24gTXV4RGVtdXggKG9wdHMsIG9uQ29ubmVjdGlvbikge1xuICBpZignZnVuY3Rpb24nID09PSB0eXBlb2Ygb3B0cylcbiAgICBvbkNvbm5lY3Rpb24gPSBvcHRzLCBvcHRzID0gbnVsbFxuICBvcHRzID0gb3B0cyB8fCB7fVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUlEKCkge1xuICAgIHJldHVybiAoXG4gICAgICBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyKSArXG4gICAgICBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyKVxuICAgIClcbiAgfVxuXG4gIHZhciBzdHJlYW1zID0ge30sIHN0cmVhbUNvdW50ID0gMFxuICB2YXIgbWQgPSBkdXBsZXgoKS8vLnJlc3VtZSgpXG5cbiAgbWQub24oJ19kYXRhJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBpZighKEFycmF5LmlzQXJyYXkoZGF0YSlcbiAgICAgICYmICdzdHJpbmcnID09PSB0eXBlb2YgZGF0YVswXVxuICAgICAgJiYgJ19fcHJvdG9fXycgIT09IGRhdGFbMF1cbiAgICAgICYmICdzdHJpbmcnID09PSB0eXBlb2YgZGF0YVsxXVxuICAgICAgJiYgJ19fcHJvdG9fXycgIT09IGRhdGFbMV1cbiAgICApKSByZXR1cm5cbiAgICB2YXIgaWQgPSBkYXRhLnNoaWZ0KClcbiAgICB2YXIgZXZlbnQgPSBkYXRhWzBdXG4gICAgdmFyIHMgPSBzdHJlYW1zW2lkXVxuICAgIGlmKCFzKSB7XG4gICAgICBpZihldmVudCA9PSAnY2xvc2UnKVxuICAgICAgICByZXR1cm5cbiAgICAgIGlmKGV2ZW50ICE9ICduZXcnKVxuICAgICAgICByZXR1cm4gb3V0ZXIuZW1pdCgndW5rbm93bicsIGlkKVxuICAgICAgbWQuZW1pdCgnY29ubmVjdGlvbicsIGNyZWF0ZVN0cmVhbShpZCwgZGF0YVsxXS5tZXRhLCBkYXRhWzFdLm9wdHMpKVxuICAgIH1cbiAgICBlbHNlIGlmIChldmVudCA9PT0gJ3BhdXNlJylcbiAgICAgIHMucGF1c2VkID0gdHJ1ZVxuICAgIGVsc2UgaWYgKGV2ZW50ID09PSAncmVzdW1lJykge1xuICAgICAgdmFyIHAgPSBzLnBhdXNlZFxuICAgICAgcy5wYXVzZWQgPSBmYWxzZVxuICAgICAgaWYocCkgcy5lbWl0KCdkcmFpbicpXG4gICAgfVxuICAgIGVsc2UgaWYgKGV2ZW50ID09PSAnZXJyb3InKSB7XG4gICAgICB2YXIgZXJyb3IgPSBkYXRhWzFdXG4gICAgICBpZiAodHlwZW9mIGVycm9yID09PSAnc3RyaW5nJykge1xuICAgICAgICBzLmVtaXQoJ2Vycm9yJywgbmV3IEVycm9yKGVycm9yKSlcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVycm9yLm1lc3NhZ2UgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHZhciBlID0gbmV3IEVycm9yKGVycm9yLm1lc3NhZ2UpXG4gICAgICAgIGV4dGVuZChlLCBlcnJvcilcbiAgICAgICAgcy5lbWl0KCdlcnJvcicsIGUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzLmVtaXQoJ2Vycm9yJywgZXJyb3IpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcy5lbWl0LmFwcGx5KHMsIGRhdGEpXG4gICAgfVxuICB9KVxuICAub24oJ19lbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgZGVzdHJveUFsbCgpXG4gICAgbWQuX2VuZCgpXG4gIH0pXG5cbiAgZnVuY3Rpb24gZGVzdHJveUFsbCAoX2Vycikge1xuICAgIG1kLnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBkZXN0cm95QWxsKVxuICAgIG1kLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIGRlc3Ryb3lBbGwpXG4gICAgbWQucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgZGVzdHJveUFsbClcbiAgICB2YXIgZXJyID0gX2VyciB8fCBuZXcgRXJyb3IgKCd1bmV4cGVjdGVkIGRpc2Nvbm5lY3Rpb24nKVxuICAgIGZvciAodmFyIGkgaW4gc3RyZWFtcykge1xuICAgICAgdmFyIHMgPSBzdHJlYW1zW2ldXG4gICAgICBzLmRlc3Ryb3llZCA9IHRydWVcbiAgICAgIGlmIChvcHRzLmVycm9yICE9PSB0cnVlKSB7XG4gICAgICAgIHMuZW5kKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMuZW1pdCgnZXJyb3InLCBlcnIpXG4gICAgICAgIHMuZGVzdHJveSgpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy9lbmQgdGhlIHN0cmVhbSBvbmNlIHN1Yi1zdHJlYW1zIGhhdmUgZW5kZWQuXG4gIC8vKHdhaXRzIGZvciB0aGVtIHRvIGNsb3NlLCBsaWtlIG9uIGEgdGNwIHNlcnZlcilcblxuICBmdW5jdGlvbiBjcmVhdGVTdHJlYW0oaWQsIG1ldGEsIG9wdHMpIHtcbiAgICBzdHJlYW1Db3VudCArK1xuICAgIHZhciBzID0gdGhyb3VnaChmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgaWYoIXRoaXMud3JpdGFibGUpIHtcbiAgICAgICAgdmFyIGVyciA9IEVycm9yKCdzdHJlYW0gaXMgbm90IHdyaXRhYmxlOiAnICsgaWQpXG4gICAgICAgIGVyci5zdHJlYW0gPSB0aGlzXG4gICAgICAgIHJldHVybiBvdXRlci5lbWl0KFwiZXJyb3JcIiwgZXJyKVxuICAgICAgfVxuICAgICAgbWQuX2RhdGEoW3MuaWQsICdkYXRhJywgZGF0YV0pXG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgbWQuX2RhdGEoW3MuaWQsICdlbmQnXSlcbiAgICAgIGlmICh0aGlzLnJlYWRhYmxlICYmICFvcHRzLmFsbG93SGFsZk9wZW4gJiYgIXRoaXMuZW5kZWQpIHtcbiAgICAgICAgdGhpcy5lbWl0KFwiZW5kXCIpXG4gICAgICB9XG4gICAgfSlcbiAgICBzLnBhdXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgbWQuX2RhdGEoW3MuaWQsICdwYXVzZSddKVxuICAgIH1cbiAgICBzLnJlc3VtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIG1kLl9kYXRhKFtzLmlkLCAncmVzdW1lJ10pXG4gICAgfVxuICAgIHMuZXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgbWQuX2RhdGEoW3MuaWQsICdlcnJvcicsIG1lc3NhZ2VdKVxuICAgIH1cbiAgICBzLm9uY2UoJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgZGVsZXRlIHN0cmVhbXNbaWRdXG4gICAgICBzdHJlYW1Db3VudCAtLVxuICAgICAgbWQuX2RhdGEoW3MuaWQsICdjbG9zZSddKVxuICAgICAgaWYoc3RyZWFtQ291bnQgPT09IDApXG4gICAgICAgIG1kLmVtaXQoJ3plcm8nKVxuICAgIH0pXG4gICAgcy53cml0YWJsZSA9IG9wdHMud3JpdGFibGVcbiAgICBzLnJlYWRhYmxlID0gb3B0cy5yZWFkYWJsZVxuICAgIHN0cmVhbXNbcy5pZCA9IGlkXSA9IHNcbiAgICBzLm1ldGEgPSBtZXRhXG4gICAgcmV0dXJuIHNcbiAgfVxuXG4gIHZhciBvdXRlciA9IHNlcmlhbGl6ZXIob3B0cy53cmFwcGVyKShtZClcblxuICBpZihtZCAhPT0gb3V0ZXIpXG4gICAgbWQub24oJ2Nvbm5lY3Rpb24nLCBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICBvdXRlci5lbWl0KCdjb25uZWN0aW9uJywgc3RyZWFtKVxuICAgIH0pXG5cbiAgb3V0ZXIuY2xvc2UgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICBtZC5vbmNlKCd6ZXJvJywgZnVuY3Rpb24gKCkge1xuICAgICAgbWQuX2VuZCgpXG4gICAgICBpZihjYikgY2IoKVxuICAgIH0pXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIGlmKG9uQ29ubmVjdGlvbilcbiAgICBvdXRlci5vbignY29ubmVjdGlvbicsIG9uQ29ubmVjdGlvbilcblxuICBvdXRlci5vbignY29ubmVjdGlvbicsIGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAvL2lmIG11eC1kZW11eCByZWNpZXZlcyBhIHN0cmVhbSBidXQgdGhlcmUgaXMgbm90aGluZyB0byBoYW5kbGUgaXQsXG4gICAgLy90aGVuIHJldHVybiBhbiBlcnJvciB0byB0aGUgb3RoZXIgc2lkZS5cbiAgICAvL3N0aWxsIHRyeWluZyB0byB0aGluayBvZiB0aGUgYmVzdCBlcnJvciBtZXNzYWdlLlxuICAgIGlmKG91dGVyLmxpc3RlbmVycygnY29ubmVjdGlvbicpLmxlbmd0aCA9PT0gMSlcbiAgICAgIHN0cmVhbS5lcnJvcigncmVtb3RlIGVuZCBsYWNrcyBjb25uZWN0aW9uIGxpc3RlbmVyICcgXG4gICAgICAgICsgb3V0ZXIubGlzdGVuZXJzKCdjb25uZWN0aW9uJykubGVuZ3RoKVxuICB9KVxuXG4gIHZhciBwaXBlID0gb3V0ZXIucGlwZVxuICBvdXRlci5waXBlID0gZnVuY3Rpb24gKGRlc3QsIG9wdHMpIHtcbiAgICBwaXBlLmNhbGwob3V0ZXIsIGRlc3QsIG9wdHMpXG4gICAgbWQub24oJ2VuZCcsIGRlc3Ryb3lBbGwpXG4gICAgbWQub24oJ2Nsb3NlJywgZGVzdHJveUFsbClcbiAgICBtZC5vbignZXJyb3InLCBkZXN0cm95QWxsKVxuICAgIHJldHVybiBkZXN0XG4gIH1cblxuICBvdXRlci5jcmVhdGVTdHJlYW0gPSBmdW5jdGlvbiAobWV0YSwgb3B0cykge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9XG4gICAgaWYgKCFvcHRzLndyaXRhYmxlICYmICFvcHRzLnJlYWRhYmxlKVxuICAgICAgb3B0cy5yZWFkYWJsZSA9IG9wdHMud3JpdGFibGUgPSB0cnVlXG4gICAgdmFyIHMgPSBjcmVhdGVTdHJlYW0oY3JlYXRlSUQoKSwgbWV0YSwgb3B0cylcbiAgICB2YXIgX29wdHMgPSB7d3JpdGFibGU6IG9wdHMucmVhZGFibGUsIHJlYWRhYmxlOiBvcHRzLndyaXRhYmxlfVxuICAgIG1kLl9kYXRhKFtzLmlkLCAnbmV3Jywge21ldGE6IG1ldGEsIG9wdHM6IF9vcHRzfV0pXG4gICAgcmV0dXJuIHNcbiAgfVxuICBvdXRlci5jcmVhdGVXcml0ZVN0cmVhbSA9IGZ1bmN0aW9uIChtZXRhKSB7XG4gICAgcmV0dXJuIG91dGVyLmNyZWF0ZVN0cmVhbShtZXRhLCB7d3JpdGFibGU6IHRydWUsIHJlYWRhYmxlOiBmYWxzZX0pXG4gIH1cbiAgb3V0ZXIuY3JlYXRlUmVhZFN0cmVhbSA9IGZ1bmN0aW9uIChtZXRhKSB7XG4gICAgcmV0dXJuIG91dGVyLmNyZWF0ZVN0cmVhbShtZXRhLCB7d3JpdGFibGU6IGZhbHNlLCByZWFkYWJsZTogdHJ1ZX0pXG4gIH1cblxuICByZXR1cm4gb3V0ZXJcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNdXhEZW11eFxuXG4iLCJmdW5jdGlvbiBoZWFkIChhKSB7XG4gIHJldHVybiBhWzBdXG59XG5cbmZ1bmN0aW9uIGxhc3QgKGEpIHtcbiAgcmV0dXJuIGFbYS5sZW5ndGggLSAxXVxufVxuXG5mdW5jdGlvbiB0YWlsKGEpIHtcbiAgcmV0dXJuIGEuc2xpY2UoMSlcbn1cblxuZnVuY3Rpb24gcmV0cmVhdCAoZSkge1xuICByZXR1cm4gZS5wb3AoKVxufVxuXG5mdW5jdGlvbiBoYXNMZW5ndGggKGUpIHtcbiAgcmV0dXJuIGUubGVuZ3RoXG59XG5cbmZ1bmN0aW9uIGFueShhcnksIHRlc3QpIHtcbiAgZm9yKHZhciBpIGluIGFyeSlcbiAgICBpZih0ZXN0KGFyeVtpXSkpXG4gICAgICByZXR1cm4gdHJ1ZVxuICByZXR1cm4gZmFsc2Vcbn1cblxudmFyIF9ydWxlcyAvLyBzZXQgYXQgdGhlIGJvdHRvbSAgXG5cbi8vIG5vdGUsIG5haXZlIGltcGxlbWVudGF0aW9uLiB3aWxsIGJyZWFrIG9uIGNpcmN1bGFyIG9iamVjdHMuXG5cbmZ1bmN0aW9uIF9lcXVhbChhLCBiKSB7XG4gIGlmKGEgJiYgIWIpIHJldHVybiBmYWxzZVxuICBpZihBcnJheS5pc0FycmF5KGEpKVxuICAgIGlmKGEubGVuZ3RoICE9IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgaWYoYSAmJiAnb2JqZWN0JyA9PSB0eXBlb2YgYSkge1xuICAgIGZvcih2YXIgaSBpbiBhKVxuICAgICAgaWYoIV9lcXVhbChhW2ldLCBiW2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gYSA9PSBiXG59XG5cbmZ1bmN0aW9uIGdldEFyZ3MoYXJncykge1xuICByZXR1cm4gYXJncy5sZW5ndGggPT0gMSA/IGFyZ3NbMF0gOiBbXS5zbGljZS5jYWxsKGFyZ3MpXG59XG5cbi8vIHJldHVybiB0aGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgbm90IGxpa2UgdGhlIG90aGVycywgb3IgLTFcbmZ1bmN0aW9uIG9kZEVsZW1lbnQoYXJ5LCBjbXApIHtcbiAgdmFyIGNcbiAgZnVuY3Rpb24gZ3Vlc3MoYSkge1xuICAgIHZhciBvZGQgPSAtMVxuICAgIGMgPSAwXG4gICAgZm9yICh2YXIgaSA9IGE7IGkgPCBhcnkubGVuZ3RoOyBpICsrKSB7XG4gICAgICBpZighY21wKGFyeVthXSwgYXJ5W2ldKSkge1xuICAgICAgICBvZGQgPSBpLCBjKytcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGMgPiAxID8gLTEgOiBvZGRcbiAgfVxuICAvL2Fzc3VtZSB0aGF0IGl0IGlzIHRoZSBmaXJzdCBlbGVtZW50LlxuICB2YXIgZyA9IGd1ZXNzKDApXG4gIGlmKC0xICE9IGcpIHJldHVybiBnXG4gIC8vMCB3YXMgdGhlIG9kZCBvbmUsIHRoZW4gYWxsIHRoZSBvdGhlciBlbGVtZW50cyBhcmUgZXF1YWxcbiAgLy9lbHNlIHRoZXJlIG1vcmUgdGhhbiBvbmUgZGlmZmVyZW50IGVsZW1lbnRcbiAgZ3Vlc3MoMSlcbiAgcmV0dXJuIGMgPT0gMCA/IDAgOiAtMVxufVxudmFyIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChkZXBzLCBleHBvcnRzKSB7XG4gIHZhciBlcXVhbCA9IChkZXBzICYmIGRlcHMuZXF1YWwpIHx8IF9lcXVhbFxuICBleHBvcnRzID0gZXhwb3J0cyB8fCB7fSBcbiAgZXhwb3J0cy5sY3MgPSBcbiAgZnVuY3Rpb24gbGNzKCkge1xuICAgIHZhciBjYWNoZSA9IHt9XG4gICAgdmFyIGFyZ3MgPSBnZXRBcmdzKGFyZ3VtZW50cylcbiAgICB2YXIgYSA9IGFyZ3NbMF0sIGIgPSBhcmdzWzFdXG5cbiAgICBmdW5jdGlvbiBrZXkgKGEsYil7XG4gICAgICByZXR1cm4gYS5sZW5ndGggKyAnOicgKyBiLmxlbmd0aFxuICAgIH1cblxuICAgIC8vZmluZCBsZW5ndGggdGhhdCBtYXRjaGVzIGF0IHRoZSBoZWFkXG5cbiAgICBpZihhcmdzLmxlbmd0aCA+IDIpIHtcbiAgICAgIC8vaWYgY2FsbGVkIHdpdGggbXVsdGlwbGUgc2VxdWVuY2VzXG4gICAgICAvL3JlY3Vyc2UsIHNpbmNlIGxjcyhhLCBiLCBjLCBkKSA9PSBsY3MobGNzKGEsYiksIGxjcyhjLGQpKVxuICAgICAgYXJncy5wdXNoKGxjcyhhcmdzLnNoaWZ0KCksIGFyZ3Muc2hpZnQoKSkpXG4gICAgICByZXR1cm4gbGNzKGFyZ3MpXG4gICAgfVxuICAgIFxuICAgIC8vdGhpcyB3b3VsZCBiZSBpbXByb3ZlZCBieSB0cnVuY2F0aW5nIGlucHV0IGZpcnN0XG4gICAgLy9hbmQgbm90IHJldHVybmluZyBhbiBsY3MgYXMgYW4gaW50ZXJtZWRpYXRlIHN0ZXAuXG4gICAgLy91bnRpbGwgdGhhdCBpcyBhIHBlcmZvcm1hbmNlIHByb2JsZW0uXG5cbiAgICB2YXIgc3RhcnQgPSAwLCBlbmQgPSAwXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoICYmIGkgPCBiLmxlbmd0aCBcbiAgICAgICYmIGVxdWFsKGFbaV0sIGJbaV0pXG4gICAgICA7IGkgKytcbiAgICApXG4gICAgICBzdGFydCA9IGkgKyAxXG5cbiAgICBpZihhLmxlbmd0aCA9PT0gc3RhcnQpXG4gICAgICByZXR1cm4gYS5zbGljZSgpXG5cbiAgICBmb3IodmFyIGkgPSAwOyAgaSA8IGEubGVuZ3RoIC0gc3RhcnQgJiYgaSA8IGIubGVuZ3RoIC0gc3RhcnRcbiAgICAgICYmIGVxdWFsKGFbYS5sZW5ndGggLSAxIC0gaV0sIGJbYi5sZW5ndGggLSAxIC0gaV0pXG4gICAgICA7IGkgKytcbiAgICApXG4gICAgICBlbmQgPSBpXG5cbiAgICBmdW5jdGlvbiByZWN1cnNlIChhLCBiKSB7XG4gICAgICBpZighYS5sZW5ndGggfHwgIWIubGVuZ3RoKSByZXR1cm4gW11cbiAgICAgIC8vYXZvaWQgZXhwb25lbnRpYWwgdGltZSBieSBjYWNoaW5nIHRoZSByZXN1bHRzXG4gICAgICBpZihjYWNoZVtrZXkoYSwgYildKSByZXR1cm4gY2FjaGVba2V5KGEsIGIpXVxuXG4gICAgICBpZihlcXVhbChhWzBdLCBiWzBdKSlcbiAgICAgICAgcmV0dXJuIFtoZWFkKGEpXS5jb25jYXQocmVjdXJzZSh0YWlsKGEpLCB0YWlsKGIpKSlcbiAgICAgIGVsc2UgeyBcbiAgICAgICAgdmFyIF9hID0gcmVjdXJzZSh0YWlsKGEpLCBiKVxuICAgICAgICB2YXIgX2IgPSByZWN1cnNlKGEsIHRhaWwoYikpXG4gICAgICAgIHJldHVybiBjYWNoZVtrZXkoYSxiKV0gPSBfYS5sZW5ndGggPiBfYi5sZW5ndGggPyBfYSA6IF9iICBcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgdmFyIG1pZGRsZUEgPSBhLnNsaWNlKHN0YXJ0LCBhLmxlbmd0aCAtIGVuZClcbiAgICB2YXIgbWlkZGxlQiA9IGIuc2xpY2Uoc3RhcnQsIGIubGVuZ3RoIC0gZW5kKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIGEuc2xpY2UoMCwgc3RhcnQpLmNvbmNhdChcbiAgICAgICAgcmVjdXJzZShtaWRkbGVBLCBtaWRkbGVCKVxuICAgICAgKS5jb25jYXQoYS5zbGljZShhLmxlbmd0aCAtIGVuZCkpXG4gICAgKVxuICB9XG5cbiAgLy8gZ2l2ZW4gbiBzZXF1ZW5jZXMsIGNhbGMgdGhlIGxjcywgYW5kIHRoZW4gY2h1bmsgc3RyaW5ncyBpbnRvIHN0YWJsZSBhbmQgdW5zdGFibGUgc2VjdGlvbnMuXG4gIC8vIHVuc3RhYmxlIGNodW5rcyBhcmUgcGFzc2VkIHRvIGJ1aWxkXG4gIGV4cG9ydHMuY2h1bmsgPVxuICBmdW5jdGlvbiAocSwgYnVpbGQpIHtcbiAgICB2YXIgcSA9IHEubWFwKGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnNsaWNlKCkgfSlcbiAgICB2YXIgbGNzID0gZXhwb3J0cy5sY3MuYXBwbHkobnVsbCwgcSlcbiAgICB2YXIgYWxsID0gW2xjc10uY29uY2F0KHEpXG5cbiAgICBmdW5jdGlvbiBtYXRjaExjcyAoZSkge1xuICAgICAgaWYoZS5sZW5ndGggJiYgIWxjcy5sZW5ndGggfHwgIWUubGVuZ3RoICYmIGxjcy5sZW5ndGgpXG4gICAgICAgIHJldHVybiBmYWxzZSAvL2luY2FzZSB0aGUgbGFzdCBpdGVtIGlzIG51bGwgXG4gICAgICByZXR1cm4gZXF1YWwobGFzdChlKSwgbGFzdChsY3MpKSB8fCAoKGUubGVuZ3RoICsgbGNzLmxlbmd0aCkgPT09IDApXG4gICAgfVxuXG4gICAgd2hpbGUoYW55KHEsIGhhc0xlbmd0aCkpIHtcbiAgICAgIC8vaWYgZWFjaCBlbGVtZW50IGlzIGF0IHRoZSBsY3MgdGhlbiB0aGlzIGNodW5rIGlzIHN0YWJsZS5cbiAgICAgIHdoaWxlKHEuZXZlcnkobWF0Y2hMY3MpICYmIHEuZXZlcnkoaGFzTGVuZ3RoKSkgXG4gICAgICAgIGFsbC5mb3JFYWNoKHJldHJlYXQpIFxuICAgICAgLy9jb2xsZWN0IHRoZSBjaGFuZ2VzIGluIGVhY2ggYXJyYXkgdXB0byB0aGUgbmV4dCBtYXRjaCB3aXRoIHRoZSBsY3NcbiAgICAgIHZhciBjID0gZmFsc2VcbiAgICAgIHZhciB1bnN0YWJsZSA9IHEubWFwKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBjaGFuZ2UgPSBbXVxuICAgICAgICB3aGlsZSghbWF0Y2hMY3MoZSkpIHtcbiAgICAgICAgICBjaGFuZ2UudW5zaGlmdChyZXRyZWF0KGUpKVxuICAgICAgICAgIGMgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNoYW5nZVxuICAgICAgfSlcbiAgICAgIGlmKGMpIGJ1aWxkKHFbMF0ubGVuZ3RoLCB1bnN0YWJsZSkgXG4gICAgfVxuICB9XG5cbiAgZXhwb3J0cy5kaWZmID1cbiAgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICB2YXIgY2hhbmdlcyA9IFtdXG4gICAgZXhwb3J0cy5jaHVuayhbYSwgYl0sIGZ1bmN0aW9uIChpbmRleCwgdW5zdGFibGUpIHtcbiAgICAgIHZhciBkZWwgPSB1bnN0YWJsZS5zaGlmdCgpLmxlbmd0aFxuICAgICAgdmFyIGluc2VydCA9IHVuc3RhYmxlLnNoaWZ0KClcbiAgICAgIGNoYW5nZXMucHVzaChbaW5kZXgsIGRlbF0uY29uY2F0KGluc2VydCkpXG4gICAgfSlcbiAgICByZXR1cm4gY2hhbmdlc1xuICB9XG5cbiAgZXhwb3J0cy5wYXRjaCA9IGZ1bmN0aW9uIChhLCBjaGFuZ2VzLCBtdXRhdGUpIHtcbiAgICBpZihtdXRhdGUgIT09IHRydWUpIGEgPSBhLnNsaWNlKGEpLy9jb3B5IGFcbiAgICBjaGFuZ2VzLmZvckVhY2goZnVuY3Rpb24gKGNoYW5nZSkge1xuICAgICAgW10uc3BsaWNlLmFwcGx5KGEsIGNoYW5nZSlcbiAgICB9KVxuICAgIHJldHVybiBhXG4gIH1cblxuICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0NvbmNlc3RvclxuICAvLyBtZSwgY29uY2VzdG9yLCB5b3UuLi5cbiAgZXhwb3J0cy5tZXJnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IGdldEFyZ3MoYXJndW1lbnRzKVxuICAgIHZhciBwYXRjaCA9IGV4cG9ydHMuZGlmZjMoYXJncylcbiAgICByZXR1cm4gZXhwb3J0cy5wYXRjaChhcmdzWzBdLCBwYXRjaClcbiAgfVxuXG4gIGV4cG9ydHMuZGlmZjMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBnZXRBcmdzKGFyZ3VtZW50cylcbiAgICB2YXIgciA9IFtdXG4gICAgZXhwb3J0cy5jaHVuayhhcmdzLCBmdW5jdGlvbiAoaW5kZXgsIHVuc3RhYmxlKSB7XG4gICAgICB2YXIgbWluZSA9IHVuc3RhYmxlWzBdXG4gICAgICB2YXIgaW5zZXJ0ID0gcmVzb2x2ZSh1bnN0YWJsZSlcbiAgICAgIGlmKGVxdWFsKG1pbmUsIGluc2VydCkpIHJldHVybiBcbiAgICAgIHIucHVzaChbaW5kZXgsIG1pbmUubGVuZ3RoXS5jb25jYXQoaW5zZXJ0KSkgXG4gICAgfSlcbiAgICByZXR1cm4gclxuICB9XG4gIGV4cG9ydHMub2RkT25lT3V0ID1cbiAgICBmdW5jdGlvbiBvZGRPbmVPdXQgKGNoYW5nZXMpIHtcbiAgICAgIGNoYW5nZXMgPSBjaGFuZ2VzLnNsaWNlKClcbiAgICAgIC8vcHV0IHRoZSBjb25jZXN0b3IgZmlyc3RcbiAgICAgIGNoYW5nZXMudW5zaGlmdChjaGFuZ2VzLnNwbGljZSgxLDEpWzBdKVxuICAgICAgdmFyIGkgPSBvZGRFbGVtZW50KGNoYW5nZXMsIGVxdWFsKVxuICAgICAgaWYoaSA9PSAwKSAvLyBjb25jZXN0b3Igd2FzIGRpZmZlcmVudCwgJ2ZhbHNlIGNvbmZsaWN0J1xuICAgICAgICByZXR1cm4gY2hhbmdlc1sxXVxuICAgICAgaWYgKH5pKVxuICAgICAgICByZXR1cm4gY2hhbmdlc1tpXSBcbiAgICB9XG4gIGV4cG9ydHMuaW5zZXJ0TWVyZ2VPdmVyRGVsZXRlID0gXG4gICAgLy9pJ3ZlIGltcGxlbWVudGVkIHRoaXMgYXMgYSBzZXBlcmF0ZSBydWxlLFxuICAgIC8vYmVjYXVzZSBJIGhhZCBzZWNvbmQgdGhvdWdodHMgYWJvdXQgdGhpcy5cbiAgICBmdW5jdGlvbiBpbnNlcnRNZXJnZU92ZXJEZWxldGUgKGNoYW5nZXMpIHtcbiAgICAgIGNoYW5nZXMgPSBjaGFuZ2VzLnNsaWNlKClcbiAgICAgIGNoYW5nZXMuc3BsaWNlKDEsMSkvLyByZW1vdmUgY29uY2VzdG9yXG4gICAgICBcbiAgICAgIC8vaWYgdGhlcmUgaXMgb25seSBvbmUgbm9uIGVtcHR5IGNoYW5nZSB0aGF0cyBva2F5LlxuICAgICAgLy9lbHNlIGZ1bGwgY29uZmlsY3RcbiAgICAgIGZvciAodmFyIGkgPSAwLCBub25lbXB0eTsgaSA8IGNoYW5nZXMubGVuZ3RoOyBpKyspXG4gICAgICAgIGlmKGNoYW5nZXNbaV0ubGVuZ3RoKSBcbiAgICAgICAgICBpZighbm9uZW1wdHkpIG5vbmVtcHR5ID0gY2hhbmdlc1tpXVxuICAgICAgICAgIGVsc2UgcmV0dXJuIC8vIGZ1bGwgY29uZmxpY3RcbiAgICAgIHJldHVybiBub25lbXB0eVxuICAgIH1cblxuICB2YXIgcnVsZXMgPSAoZGVwcyAmJiBkZXBzLnJ1bGVzKSB8fCBbZXhwb3J0cy5vZGRPbmVPdXQsIGV4cG9ydHMuaW5zZXJ0TWVyZ2VPdmVyRGVsZXRlXVxuXG4gIGZ1bmN0aW9uIHJlc29sdmUgKGNoYW5nZXMpIHtcbiAgICB2YXIgbCA9IHJ1bGVzLmxlbmd0aFxuICAgIGZvciAodmFyIGkgaW4gcnVsZXMpIHsgLy8gZmlyc3RcbiAgICAgIFxuICAgICAgdmFyIGMgPSBydWxlc1tpXSAmJiBydWxlc1tpXShjaGFuZ2VzKVxuICAgICAgaWYoYykgcmV0dXJuIGNcbiAgICB9XG4gICAgY2hhbmdlcy5zcGxpY2UoMSwxKSAvLyByZW1vdmUgY29uY2VzdG9yXG4gICAgLy9yZXR1cm5pbmcgdGhlIGNvbmZsaWN0cyBhcyBhbiBvYmplY3QgaXMgYSByZWFsbHkgYmFkIGlkZWEsXG4gICAgLy8gYmVjYXVzZSA9PSB3aWxsIG5vdCBkZXRlY3QgdGhleSBhcmUgdGhlIHNhbWUuIGFuZCBjb25mbGljdHMgYnVpbGQuXG4gICAgLy8gYmV0dGVyIHRvIHVzZVxuICAgIC8vICc8PDw8PDw8PDw8PDw8J1xuICAgIC8vIG9mIGNvdXJzZSwgaSB3cm90ZSB0aGlzIGJlZm9yZSBpIHN0YXJ0ZWQgb24gc25vYiwgc28gaSBkaWRuJ3Qga25vdyB0aGF0IHRoZW4uXG4gICAgLyp2YXIgY29uZmxpY3QgPSBbJz4+Pj4+Pj4+Pj4+Pj4+Pj4nXVxuICAgIHdoaWxlKGNoYW5nZXMubGVuZ3RoKVxuICAgICAgY29uZmxpY3QgPSBjb25mbGljdC5jb25jYXQoY2hhbmdlcy5zaGlmdCgpKS5jb25jYXQoJz09PT09PT09PT09PScpXG4gICAgY29uZmxpY3QucG9wKClcbiAgICBjb25mbGljdC5wdXNoICAgICAgICAgICgnPDw8PDw8PDw8PDw8PDw8JylcbiAgICBjaGFuZ2VzLnVuc2hpZnQgICAgICAgKCc+Pj4+Pj4+Pj4+Pj4+Pj4nKVxuICAgIHJldHVybiBjb25mbGljdCovXG4gICAgLy9uYWgsIGJldHRlciBpcyBqdXN0IHRvIHVzZSBhbiBlcXVhbCBjYW4gaGFuZGxlIG9iamVjdHNcbiAgICByZXR1cm4geyc/JzogY2hhbmdlc31cbiAgfVxuICByZXR1cm4gZXhwb3J0c1xufVxuZXhwb3J0cyhudWxsLCBleHBvcnRzKVxuIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe3ZhciBTdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKVxuXG4vLyB0aHJvdWdoXG4vL1xuLy8gYSBzdHJlYW0gdGhhdCBkb2VzIG5vdGhpbmcgYnV0IHJlLWVtaXQgdGhlIGlucHV0LlxuLy8gdXNlZnVsIGZvciBhZ2dyZWdhdGluZyBhIHNlcmllcyBvZiBjaGFuZ2luZyBidXQgbm90IGVuZGluZyBzdHJlYW1zIGludG8gb25lIHN0cmVhbSlcblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdGhyb3VnaFxudGhyb3VnaC50aHJvdWdoID0gdGhyb3VnaFxuXG4vL2NyZWF0ZSBhIHJlYWRhYmxlIHdyaXRhYmxlIHN0cmVhbS5cblxuZnVuY3Rpb24gdGhyb3VnaCAod3JpdGUsIGVuZCwgb3B0cykge1xuICB3cml0ZSA9IHdyaXRlIHx8IGZ1bmN0aW9uIChkYXRhKSB7IHRoaXMucXVldWUoZGF0YSkgfVxuICBlbmQgPSBlbmQgfHwgZnVuY3Rpb24gKCkgeyB0aGlzLnF1ZXVlKG51bGwpIH1cblxuICB2YXIgZW5kZWQgPSBmYWxzZSwgZGVzdHJveWVkID0gZmFsc2UsIGJ1ZmZlciA9IFtdLCBfZW5kZWQgPSBmYWxzZVxuICB2YXIgc3RyZWFtID0gbmV3IFN0cmVhbSgpXG4gIHN0cmVhbS5yZWFkYWJsZSA9IHN0cmVhbS53cml0YWJsZSA9IHRydWVcbiAgc3RyZWFtLnBhdXNlZCA9IGZhbHNlXG5cbi8vICBzdHJlYW0uYXV0b1BhdXNlICAgPSAhKG9wdHMgJiYgb3B0cy5hdXRvUGF1c2UgICA9PT0gZmFsc2UpXG4gIHN0cmVhbS5hdXRvRGVzdHJveSA9ICEob3B0cyAmJiBvcHRzLmF1dG9EZXN0cm95ID09PSBmYWxzZSlcblxuICBzdHJlYW0ud3JpdGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHdyaXRlLmNhbGwodGhpcywgZGF0YSlcbiAgICByZXR1cm4gIXN0cmVhbS5wYXVzZWRcbiAgfVxuXG4gIGZ1bmN0aW9uIGRyYWluKCkge1xuICAgIHdoaWxlKGJ1ZmZlci5sZW5ndGggJiYgIXN0cmVhbS5wYXVzZWQpIHtcbiAgICAgIHZhciBkYXRhID0gYnVmZmVyLnNoaWZ0KClcbiAgICAgIGlmKG51bGwgPT09IGRhdGEpXG4gICAgICAgIHJldHVybiBzdHJlYW0uZW1pdCgnZW5kJylcbiAgICAgIGVsc2VcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2RhdGEnLCBkYXRhKVxuICAgIH1cbiAgfVxuXG4gIHN0cmVhbS5xdWV1ZSA9IHN0cmVhbS5wdXNoID0gZnVuY3Rpb24gKGRhdGEpIHtcbi8vICAgIGNvbnNvbGUuZXJyb3IoZW5kZWQpXG4gICAgaWYoX2VuZGVkKSByZXR1cm4gc3RyZWFtXG4gICAgaWYoZGF0YSA9PSBudWxsKSBfZW5kZWQgPSB0cnVlXG4gICAgYnVmZmVyLnB1c2goZGF0YSlcbiAgICBkcmFpbigpXG4gICAgcmV0dXJuIHN0cmVhbVxuICB9XG5cbiAgLy90aGlzIHdpbGwgYmUgcmVnaXN0ZXJlZCBhcyB0aGUgZmlyc3QgJ2VuZCcgbGlzdGVuZXJcbiAgLy9tdXN0IGNhbGwgZGVzdHJveSBuZXh0IHRpY2ssIHRvIG1ha2Ugc3VyZSB3ZSdyZSBhZnRlciBhbnlcbiAgLy9zdHJlYW0gcGlwZWQgZnJvbSBoZXJlLlxuICAvL3RoaXMgaXMgb25seSBhIHByb2JsZW0gaWYgZW5kIGlzIG5vdCBlbWl0dGVkIHN5bmNocm9ub3VzbHkuXG4gIC8vYSBuaWNlciB3YXkgdG8gZG8gdGhpcyBpcyB0byBtYWtlIHN1cmUgdGhpcyBpcyB0aGUgbGFzdCBsaXN0ZW5lciBmb3IgJ2VuZCdcblxuICBzdHJlYW0ub24oJ2VuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBzdHJlYW0ucmVhZGFibGUgPSBmYWxzZVxuICAgIGlmKCFzdHJlYW0ud3JpdGFibGUgJiYgc3RyZWFtLmF1dG9EZXN0cm95KVxuICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0cmVhbS5kZXN0cm95KClcbiAgICAgIH0pXG4gIH0pXG5cbiAgZnVuY3Rpb24gX2VuZCAoKSB7XG4gICAgc3RyZWFtLndyaXRhYmxlID0gZmFsc2VcbiAgICBlbmQuY2FsbChzdHJlYW0pXG4gICAgaWYoIXN0cmVhbS5yZWFkYWJsZSAmJiBzdHJlYW0uYXV0b0Rlc3Ryb3kpXG4gICAgICBzdHJlYW0uZGVzdHJveSgpXG4gIH1cblxuICBzdHJlYW0uZW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBpZihlbmRlZCkgcmV0dXJuXG4gICAgZW5kZWQgPSB0cnVlXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCkgc3RyZWFtLndyaXRlKGRhdGEpXG4gICAgX2VuZCgpIC8vIHdpbGwgZW1pdCBvciBxdWV1ZVxuICAgIHJldHVybiBzdHJlYW1cbiAgfVxuXG4gIHN0cmVhbS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKGRlc3Ryb3llZCkgcmV0dXJuXG4gICAgZGVzdHJveWVkID0gdHJ1ZVxuICAgIGVuZGVkID0gdHJ1ZVxuICAgIGJ1ZmZlci5sZW5ndGggPSAwXG4gICAgc3RyZWFtLndyaXRhYmxlID0gc3RyZWFtLnJlYWRhYmxlID0gZmFsc2VcbiAgICBzdHJlYW0uZW1pdCgnY2xvc2UnKVxuICAgIHJldHVybiBzdHJlYW1cbiAgfVxuXG4gIHN0cmVhbS5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZihzdHJlYW0ucGF1c2VkKSByZXR1cm5cbiAgICBzdHJlYW0ucGF1c2VkID0gdHJ1ZVxuICAgIHJldHVybiBzdHJlYW1cbiAgfVxuXG4gIHN0cmVhbS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoc3RyZWFtLnBhdXNlZCkge1xuICAgICAgc3RyZWFtLnBhdXNlZCA9IGZhbHNlXG4gICAgICBzdHJlYW0uZW1pdCgncmVzdW1lJylcbiAgICB9XG4gICAgZHJhaW4oKVxuICAgIC8vbWF5IGhhdmUgYmVjb21lIHBhdXNlZCBhZ2FpbixcbiAgICAvL2FzIGRyYWluIGVtaXRzICdkYXRhJy5cbiAgICBpZighc3RyZWFtLnBhdXNlZClcbiAgICAgIHN0cmVhbS5lbWl0KCdkcmFpbicpXG4gICAgcmV0dXJuIHN0cmVhbVxuICB9XG4gIHJldHVybiBzdHJlYW1cbn1cblxuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiXG4vL3RoZSBmaXJzdCBsaW5lIGlzIGhlYWRlciwgaW4gSlNPTiBmb3JtYXQsIHdpdGggbm8gd2hpdGVzcGFjZS5cblxuZnVuY3Rpb24gbWVyZ2UgKGEsIGIpIHtcbiAgZm9yICh2YXIgayBpbiBiKVxuICAgIGFba10gPSBhW2tdIHx8IGJba11cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBcbmZ1bmN0aW9uIGhlYWRlciAoc3RyZWFtKSB7XG5cbiAgdmFyIGVtaXQgPSBzdHJlYW0uZW1pdFxuICB2YXIgd3JpdGUgPSBzdHJlYW0ud3JpdGVcbiAgdmFyIHNvRmFyID0gJydcblxuICBzdHJlYW0uZW1pdCA9IGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xuICAgIGlmKGV2ZW50ICE9PSAnZGF0YScpXG4gICAgICByZXR1cm4gZW1pdC5hcHBseShzdHJlYW0sIGFyZ3VtZW50cylcblxuICAgIHNvRmFyICs9IGRhdGFcbiAgICB2YXIgbVxuICAgIGlmKCEobSA9IC9cXG4vLmV4ZWMoc29GYXIpKSkgcmV0dXJuXG4gICAgdmFyIG1ldGEgPSBKU09OLnBhcnNlKHNvRmFyLnN1YnN0cmluZygwLCBtLmluZGV4KSlcbiAgICAvLysgMSB0byBnZXQgcGFzdCB0aGUgbmV3bGluZVxuICAgIHNvRmFyID0gc29GYXIuc3Vic3RyaW5nKG0uaW5kZXggKyAxKVxuICAgIHN0cmVhbS5lbWl0ID0gZW1pdFxuICAgIHN0cmVhbS5tZXRhID0gbWV0YVxuICAgIHN0cmVhbS5lbWl0KCdoZWFkZXInLCBtZXRhKVxuICAgIC8vY2hlY2sgdGhhdCB0aGUgc3RyZWFtIGlzIHN0aWxsIHJlYWRhYmxlLFxuICAgIC8vaXQgbWF5IGhhdmUgYmVlbiBlbmRlZCBkdXJpbmcgdGhlICdoZWFkZXInXG4gICAgLy9ldmVudC5cbiAgICBpZignJyAhPT0gc29GYXIgICYmIHN0cmVhbS5yZWFkYWJsZSlcbiAgICAgIHN0cmVhbS5lbWl0KCdkYXRhJywgc29GYXIpXG4gIH1cblxuICB2YXIgbWV0YSA9IHt9XG5cbiAgc3RyZWFtLnNldEhlYWRlciA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICAgIGlmKCdzdHJpbmcnID09PSB0eXBlb2Yga2V5KVxuICAgICAgbWV0YVtrZXldID0gdmFsXG4gICAgZWxzZVxuICAgICAgbWVyZ2UobWV0YSwga2V5KVxuICAgIHJldHVybiBzdHJlYW1cbiAgfVxuXG4gIHN0cmVhbS53cml0ZUhlYWQgPSBmdW5jdGlvbiAoX21ldGEpIHtcbiAgICBpZihfbWV0YSkgbWVyZ2UobWV0YSwgX21ldGEpXG4gICAgc3RyZWFtLndyaXRlID0gd3JpdGVcbiAgICBzdHJlYW0ud3JpdGUoSlNPTi5zdHJpbmdpZnkobWV0YSkrJ1xcbicpICAgIFxuICB9XG5cbiAgc3RyZWFtLndyaXRlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBzdHJlYW0ud3JpdGVIZWFkKClcbiAgICByZXR1cm4gc3RyZWFtLndyaXRlKGRhdGEpXG4gIH1cblxuICByZXR1cm4gc3RyZWFtXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZFxuXG5mdW5jdGlvbiBleHRlbmQodGFyZ2V0KSB7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXSxcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhzb3VyY2UpXG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IGtleXNbal1cbiAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IHNvdXJjZVtuYW1lXVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldFxufSIsIihmdW5jdGlvbihwcm9jZXNzKXt2YXIgU3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAod3JpdGUsIGVuZCkge1xuICB2YXIgc3RyZWFtID0gbmV3IFN0cmVhbSgpIFxuICB2YXIgYnVmZmVyID0gW10sIGVuZGVkID0gZmFsc2UsIGRlc3Ryb3llZCA9IGZhbHNlLCBlbWl0RW5kXG4gIHN0cmVhbS53cml0YWJsZSA9IHN0cmVhbS5yZWFkYWJsZSA9IHRydWVcbiAgc3RyZWFtLnBhdXNlZCA9IGZhbHNlXG4gIHN0cmVhbS5fcGF1c2VkID0gZmFsc2VcbiAgc3RyZWFtLmJ1ZmZlciA9IGJ1ZmZlclxuICBcbiAgc3RyZWFtXG4gICAgLm9uKCdwYXVzZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHN0cmVhbS5fcGF1c2VkID0gdHJ1ZVxuICAgIH0pXG4gICAgLm9uKCdkcmFpbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHN0cmVhbS5fcGF1c2VkID0gZmFsc2VcbiAgICB9KVxuICAgXG4gIGZ1bmN0aW9uIGRlc3Ryb3lTb29uICgpIHtcbiAgICBwcm9jZXNzLm5leHRUaWNrKHN0cmVhbS5kZXN0cm95LmJpbmQoc3RyZWFtKSlcbiAgfVxuXG4gIGlmKHdyaXRlKVxuICAgIHN0cmVhbS5vbignX2RhdGEnLCB3cml0ZSlcbiAgaWYoZW5kKVxuICAgIHN0cmVhbS5vbignX2VuZCcsIGVuZClcblxuICAvL2Rlc3Ryb3kgdGhlIHN0cmVhbSBvbmNlIGJvdGggZW5kcyBhcmUgb3ZlclxuICAvL2J1dCBkbyBpdCBpbiBuZXh0VGljaywgc28gdGhhdCBvdGhlciBsaXN0ZW5lcnNcbiAgLy9vbiBlbmQgaGF2ZSB0aW1lIHRvIHJlc3BvbmRcbiAgc3RyZWFtLm9uY2UoJ2VuZCcsIGZ1bmN0aW9uICgpIHsgXG4gICAgc3RyZWFtLnJlYWRhYmxlID0gZmFsc2VcbiAgICBpZighc3RyZWFtLndyaXRhYmxlKSB7XG4gICAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RyZWFtLmRlc3Ryb3koKVxuICAgICAgfSlcbiAgICB9XG4gIH0pXG5cbiAgc3RyZWFtLm9uY2UoJ19lbmQnLCBmdW5jdGlvbiAoKSB7IFxuICAgIHN0cmVhbS53cml0YWJsZSA9IGZhbHNlXG4gICAgaWYoIXN0cmVhbS5yZWFkYWJsZSlcbiAgICAgIHN0cmVhbS5kZXN0cm95KClcbiAgfSlcblxuICAvLyB0aGlzIGlzIHRoZSBkZWZhdWx0IHdyaXRlIG1ldGhvZCxcbiAgLy8gaWYgeW91IG92ZXJpZGUgaXQsIHlvdSBhcmUgcmVzcG9zaWJsZVxuICAvLyBmb3IgcGF1c2Ugc3RhdGUuXG5cbiAgXG4gIHN0cmVhbS5fZGF0YSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgaWYoIXN0cmVhbS5wYXVzZWQgJiYgIWJ1ZmZlci5sZW5ndGgpXG4gICAgICBzdHJlYW0uZW1pdCgnZGF0YScsIGRhdGEpXG4gICAgZWxzZSBcbiAgICAgIGJ1ZmZlci5wdXNoKGRhdGEpXG4gICAgcmV0dXJuICEoc3RyZWFtLnBhdXNlZCB8fCBidWZmZXIubGVuZ3RoKVxuICB9XG5cbiAgc3RyZWFtLl9lbmQgPSBmdW5jdGlvbiAoZGF0YSkgeyBcbiAgICBpZihkYXRhKSBzdHJlYW0uX2RhdGEoZGF0YSlcbiAgICBpZihlbWl0RW5kKSByZXR1cm5cbiAgICBlbWl0RW5kID0gdHJ1ZVxuICAgIC8vZGVzdHJveSBpcyBoYW5kbGVkIGFib3ZlLlxuICAgIHN0cmVhbS5kcmFpbigpXG4gIH1cblxuICBzdHJlYW0ud3JpdGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHN0cmVhbS5lbWl0KCdfZGF0YScsIGRhdGEpXG4gICAgcmV0dXJuICFzdHJlYW0uX3BhdXNlZFxuICB9XG5cbiAgc3RyZWFtLmVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBzdHJlYW0ud3JpdGFibGUgPSBmYWxzZVxuICAgIGlmKHN0cmVhbS5lbmRlZCkgcmV0dXJuXG4gICAgc3RyZWFtLmVuZGVkID0gdHJ1ZVxuICAgIHN0cmVhbS5lbWl0KCdfZW5kJylcbiAgfVxuXG4gIHN0cmVhbS5kcmFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZighYnVmZmVyLmxlbmd0aCAmJiAhZW1pdEVuZCkgcmV0dXJuXG4gICAgLy9pZiB0aGUgc3RyZWFtIGlzIHBhdXNlZCBhZnRlciBqdXN0IGJlZm9yZSBlbWl0RW5kKClcbiAgICAvL2VuZCBzaG91bGQgYmUgYnVmZmVyZWQuXG4gICAgd2hpbGUoIXN0cmVhbS5wYXVzZWQpIHtcbiAgICAgIGlmKGJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2RhdGEnLCBidWZmZXIuc2hpZnQoKSlcbiAgICAgICAgaWYoYnVmZmVyLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgc3RyZWFtLmVtaXQoJ19kcmFpbicpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZW1pdEVuZCAmJiBzdHJlYW0ucmVhZGFibGUpIHtcbiAgICAgICAgc3RyZWFtLnJlYWRhYmxlID0gZmFsc2VcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2VuZCcpXG4gICAgICAgIHJldHVyblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9pZiB0aGUgYnVmZmVyIGhhcyBlbXB0aWVkLiBlbWl0IGRyYWluLlxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB2YXIgc3RhcnRlZCA9IGZhbHNlXG4gIHN0cmVhbS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy90aGlzIGlzIHdoZXJlIEkgbmVlZCBwYXVzZVJlYWQsIGFuZCBwYXVzZVdyaXRlLlxuICAgIC8vaGVyZSB0aGUgcmVhZGluZyBzaWRlIGlzIHVucGF1c2VkLFxuICAgIC8vYnV0IHRoZSB3cml0aW5nIHNpZGUgbWF5IHN0aWxsIGJlIHBhdXNlZC5cbiAgICAvL3RoZSB3aG9sZSBidWZmZXIgbWlnaHQgbm90IGVtcGl0eSBhdCBvbmNlLlxuICAgIC8vaXQgbWlnaHQgcGF1c2UgYWdhaW4uXG4gICAgLy90aGUgc3RyZWFtIHNob3VsZCBuZXZlciBlbWl0IGRhdGEgaW5iZXR3ZWVuIHBhdXNlKCkuLi5yZXN1bWUoKVxuICAgIC8vYW5kIHdyaXRlIHNob3VsZCByZXR1cm4gIWJ1ZmZlci5sZW5ndGhcbiAgICBzdGFydGVkID0gdHJ1ZVxuICAgIHN0cmVhbS5wYXVzZWQgPSBmYWxzZVxuICAgIHN0cmVhbS5kcmFpbigpIC8vd2lsbCBlbWl0IGRyYWluIGlmIGJ1ZmZlciBlbXB0aWVzLlxuICAgIHJldHVybiBzdHJlYW1cbiAgfVxuXG4gIHN0cmVhbS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKGRlc3Ryb3llZCkgcmV0dXJuXG4gICAgZGVzdHJveWVkID0gZW5kZWQgPSB0cnVlICAgICBcbiAgICBidWZmZXIubGVuZ3RoID0gMFxuICAgIHN0cmVhbS5lbWl0KCdjbG9zZScpXG4gIH1cbiAgdmFyIHBhdXNlQ2FsbGVkID0gZmFsc2VcbiAgc3RyZWFtLnBhdXNlID0gZnVuY3Rpb24gKCkge1xuICAgIHN0YXJ0ZWQgPSB0cnVlXG4gICAgc3RyZWFtLnBhdXNlZCA9IHRydWVcbiAgICBzdHJlYW0uZW1pdCgnX3BhdXNlJylcbiAgICByZXR1cm4gc3RyZWFtXG4gIH1cbiAgc3RyZWFtLl9wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZighc3RyZWFtLl9wYXVzZWQpIHtcbiAgICAgIHN0cmVhbS5fcGF1c2VkID0gdHJ1ZVxuICAgICAgc3RyZWFtLmVtaXQoJ3BhdXNlJylcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBzdHJlYW0ucGF1c2VkID0gdHJ1ZVxuICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAvL3VubGVzcyB0aGUgdXNlciBtYW51YWxseSBwYXVzZWRcbiAgICBpZihzdGFydGVkKSByZXR1cm5cbiAgICBzdHJlYW0ucmVzdW1lKClcbiAgfSlcbiBcbiAgcmV0dXJuIHN0cmVhbVxufVxuXG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCJcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHdyYXBwZXIpIHtcblxuICBpZignZnVuY3Rpb24nID09IHR5cGVvZiB3cmFwcGVyKVxuICAgIHJldHVybiB3cmFwcGVyXG4gIFxuICByZXR1cm4gZXhwb3J0c1t3cmFwcGVyXSB8fCBleHBvcnRzLmpzb25cbn1cblxuZXhwb3J0cy5qc29uID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuXG4gIHZhciB3cml0ZSA9IHN0cmVhbS53cml0ZVxuICB2YXIgc29GYXIgPSAnJ1xuXG4gIGZ1bmN0aW9uIHBhcnNlIChsaW5lKSB7XG4gICAgdmFyIGpzXG4gICAgdHJ5IHtcbiAgICAgIGpzID0gSlNPTi5wYXJzZShsaW5lKVxuICAgICAgLy9pZ25vcmUgbGluZXMgb2Ygd2hpdGVzcGFjZS4uLlxuICAgIH0gY2F0Y2ggKGVycikgeyBcbiAgICAgIHJldHVybiBzdHJlYW0uZW1pdCgnZXJyb3InLCBlcnIpXG4gICAgICAvL3JldHVybiBjb25zb2xlLmVycm9yKCdpbnZhbGlkIEpTT04nLCBsaW5lKVxuICAgIH1cbiAgICBpZihqcyAhPT0gdW5kZWZpbmVkKVxuICAgICAgd3JpdGUuY2FsbChzdHJlYW0sIGpzKVxuICB9XG5cbiAgZnVuY3Rpb24gb25EYXRhIChkYXRhKSB7XG4gICAgdmFyIGxpbmVzID0gKHNvRmFyICsgZGF0YSkuc3BsaXQoJ1xcbicpXG4gICAgc29GYXIgPSBsaW5lcy5wb3AoKVxuICAgIHdoaWxlKGxpbmVzLmxlbmd0aCkge1xuICAgICAgcGFyc2UobGluZXMuc2hpZnQoKSlcbiAgICB9XG4gIH1cblxuICBzdHJlYW0ud3JpdGUgPSBvbkRhdGFcbiAgXG4gIHZhciBlbmQgPSBzdHJlYW0uZW5kXG5cbiAgc3RyZWFtLmVuZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgaWYoZGF0YSlcbiAgICAgIHN0cmVhbS53cml0ZShkYXRhKVxuICAgIC8vaWYgdGhlcmUgaXMgYW55IGxlZnQgb3Zlci4uLlxuICAgIGlmKHNvRmFyKSB7XG4gICAgICBwYXJzZShzb0ZhcilcbiAgICB9XG4gICAgcmV0dXJuIGVuZC5jYWxsKHN0cmVhbSlcbiAgfVxuXG4gIHN0cmVhbS5lbWl0ID0gZnVuY3Rpb24gKGV2ZW50LCBkYXRhKSB7XG5cbiAgICBpZihldmVudCA9PSAnZGF0YScpIHtcbiAgICAgIGRhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhKSArICdcXG4nXG4gICAgfVxuICAgIC8vc2luY2UgYWxsIHN0cmVhbSBldmVudHMgb25seSB1c2Ugb25lIGFyZ3VtZW50LCB0aGlzIGlzIG9rYXkuLi5cbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQuY2FsbChzdHJlYW0sIGV2ZW50LCBkYXRhKVxuICB9XG5cbiAgcmV0dXJuIHN0cmVhbVxuLy8gIHJldHVybiBlcy5waXBlbGluZShlcy5zcGxpdCgpLCBlcy5wYXJzZSgpLCBzdHJlYW0sIGVzLnN0cmluZ2lmeSgpKVxufVxuXG5leHBvcnRzLnJhdyA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgcmV0dXJuIHN0cmVhbVxufVxuXG4iLCJcbnZhciBzaG9lID0gcmVxdWlyZSgnc2hvZScpXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9pbmplY3QnKShmdW5jdGlvbiAoKXsgXG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gIHJldHVybiBzaG9lLmFwcGx5KG51bGwsIGFyZ3MpXG59KVxuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbmZ1bmN0aW9uIFN0cmVhbSgpIHtcbiAgZXZlbnRzLkV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xufVxudXRpbC5pbmhlcml0cyhTdHJlYW0sIGV2ZW50cy5FdmVudEVtaXR0ZXIpO1xubW9kdWxlLmV4cG9ydHMgPSBTdHJlYW07XG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjQueFxuU3RyZWFtLlN0cmVhbSA9IFN0cmVhbTtcblxuU3RyZWFtLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24oZGVzdCwgb3B0aW9ucykge1xuICB2YXIgc291cmNlID0gdGhpcztcblxuICBmdW5jdGlvbiBvbmRhdGEoY2h1bmspIHtcbiAgICBpZiAoZGVzdC53cml0YWJsZSkge1xuICAgICAgaWYgKGZhbHNlID09PSBkZXN0LndyaXRlKGNodW5rKSAmJiBzb3VyY2UucGF1c2UpIHtcbiAgICAgICAgc291cmNlLnBhdXNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc291cmNlLm9uKCdkYXRhJywgb25kYXRhKTtcblxuICBmdW5jdGlvbiBvbmRyYWluKCkge1xuICAgIGlmIChzb3VyY2UucmVhZGFibGUgJiYgc291cmNlLnJlc3VtZSkge1xuICAgICAgc291cmNlLnJlc3VtZSgpO1xuICAgIH1cbiAgfVxuXG4gIGRlc3Qub24oJ2RyYWluJywgb25kcmFpbik7XG5cbiAgLy8gSWYgdGhlICdlbmQnIG9wdGlvbiBpcyBub3Qgc3VwcGxpZWQsIGRlc3QuZW5kKCkgd2lsbCBiZSBjYWxsZWQgd2hlblxuICAvLyBzb3VyY2UgZ2V0cyB0aGUgJ2VuZCcgb3IgJ2Nsb3NlJyBldmVudHMuICBPbmx5IGRlc3QuZW5kKCkgb25jZSwgYW5kXG4gIC8vIG9ubHkgd2hlbiBhbGwgc291cmNlcyBoYXZlIGVuZGVkLlxuICBpZiAoIWRlc3QuX2lzU3RkaW8gJiYgKCFvcHRpb25zIHx8IG9wdGlvbnMuZW5kICE9PSBmYWxzZSkpIHtcbiAgICBkZXN0Ll9waXBlQ291bnQgPSBkZXN0Ll9waXBlQ291bnQgfHwgMDtcbiAgICBkZXN0Ll9waXBlQ291bnQrKztcblxuICAgIHNvdXJjZS5vbignZW5kJywgb25lbmQpO1xuICAgIHNvdXJjZS5vbignY2xvc2UnLCBvbmNsb3NlKTtcbiAgfVxuXG4gIHZhciBkaWRPbkVuZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBvbmVuZCgpIHtcbiAgICBpZiAoZGlkT25FbmQpIHJldHVybjtcbiAgICBkaWRPbkVuZCA9IHRydWU7XG5cbiAgICBkZXN0Ll9waXBlQ291bnQtLTtcblxuICAgIC8vIHJlbW92ZSB0aGUgbGlzdGVuZXJzXG4gICAgY2xlYW51cCgpO1xuXG4gICAgaWYgKGRlc3QuX3BpcGVDb3VudCA+IDApIHtcbiAgICAgIC8vIHdhaXRpbmcgZm9yIG90aGVyIGluY29taW5nIHN0cmVhbXMgdG8gZW5kLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRlc3QuZW5kKCk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIG9uY2xvc2UoKSB7XG4gICAgaWYgKGRpZE9uRW5kKSByZXR1cm47XG4gICAgZGlkT25FbmQgPSB0cnVlO1xuXG4gICAgZGVzdC5fcGlwZUNvdW50LS07XG5cbiAgICAvLyByZW1vdmUgdGhlIGxpc3RlbmVyc1xuICAgIGNsZWFudXAoKTtcblxuICAgIGlmIChkZXN0Ll9waXBlQ291bnQgPiAwKSB7XG4gICAgICAvLyB3YWl0aW5nIGZvciBvdGhlciBpbmNvbWluZyBzdHJlYW1zIHRvIGVuZC5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBkZXN0LmRlc3Ryb3koKTtcbiAgfVxuXG4gIC8vIGRvbid0IGxlYXZlIGRhbmdsaW5nIHBpcGVzIHdoZW4gdGhlcmUgYXJlIGVycm9ycy5cbiAgZnVuY3Rpb24gb25lcnJvcihlcikge1xuICAgIGNsZWFudXAoKTtcbiAgICBpZiAodGhpcy5saXN0ZW5lcnMoJ2Vycm9yJykubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkIHN0cmVhbSBlcnJvciBpbiBwaXBlLlxuICAgIH1cbiAgfVxuXG4gIHNvdXJjZS5vbignZXJyb3InLCBvbmVycm9yKTtcbiAgZGVzdC5vbignZXJyb3InLCBvbmVycm9yKTtcblxuICAvLyByZW1vdmUgYWxsIHRoZSBldmVudCBsaXN0ZW5lcnMgdGhhdCB3ZXJlIGFkZGVkLlxuICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZGF0YScsIG9uZGF0YSk7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZHJhaW4nLCBvbmRyYWluKTtcblxuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZW5kJywgb25lbmQpO1xuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBvbmNsb3NlKTtcblxuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbmVycm9yKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uZXJyb3IpO1xuXG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBjbGVhbnVwKTtcbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgY2xlYW51cCk7XG5cbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBjbGVhbnVwKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIGNsZWFudXApO1xuICB9XG5cbiAgc291cmNlLm9uKCdlbmQnLCBjbGVhbnVwKTtcbiAgc291cmNlLm9uKCdjbG9zZScsIGNsZWFudXApO1xuXG4gIGRlc3Qub24oJ2VuZCcsIGNsZWFudXApO1xuICBkZXN0Lm9uKCdjbG9zZScsIGNsZWFudXApO1xuXG4gIGRlc3QuZW1pdCgncGlwZScsIHNvdXJjZSk7XG5cbiAgLy8gQWxsb3cgZm9yIHVuaXgtbGlrZSB1c2FnZTogQS5waXBlKEIpLnBpcGUoQylcbiAgcmV0dXJuIGRlc3Q7XG59O1xuIiwiZXhwb3J0cy5jcmVhdGVJZCA9IFxuZnVuY3Rpb24gKCkge1xuICByZXR1cm4gWzEsMSwxXS5tYXAoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMikudG9VcHBlckNhc2UoKVxuICB9KS5qb2luKCcnKVxufVxuXG5leHBvcnRzLmZpbHRlciA9IGZ1bmN0aW9uICh1cGRhdGUsIHNvdXJjZXMpIHtcbiAgdmFyIHRzID0gdXBkYXRlWzFdXG4gIHZhciBzb3VyY2UgPSB1cGRhdGVbMl1cbiAgcmV0dXJuICghc291cmNlcyB8fCAhc291cmNlc1tzb3VyY2VdIHx8IHNvdXJjZXNbc291cmNlXSA8IHRzKVxufVxuXG5leHBvcnRzLnByb3RvSXNJbGxlZ2FsID0gZnVuY3Rpb24gKHMpIHtcbiAgcy5lbWl0KCdpbnZhbGlkJywgbmV3IEVycm9yKCdcIl9fcHJvdG9fX1wiIGlzIGlsbGVnYWwgcHJvcGVydHkgbmFtZScpKVxuICByZXR1cm4gbnVsbFxufVxuXG5mdW5jdGlvbiBpbnZhbGlkVXBkYXRlKHQpIHtcbiAgdC5lbWl0KCdpbnZhbGlkJywgbmV3IEVycm9yKCdpbnZhbGlkIHVwZGF0ZScpKVxufVxuXG5leHBvcnRzLnZhbGlkVXBkYXRlID0gZnVuY3Rpb24gKHQsIHVwZGF0ZSkge1xuICBpZighQXJyYXkuaXNBcnJheSh1cGRhdGUpKSByZXR1cm4gaW52YWxpZFVwZGF0ZSh0KVxuICBpZignc3RyaW5nJyAhPT0gdHlwZW9mIHVwZGF0ZVsxXSB8fCAnbnVtYmVyJyAhPT0gdHlwZW9mIHVwZGF0ZVsyXSlcbiAgICByZXR1cm4gaW52YWxpZFVwZGF0ZSh0KVxufVxuXG5leHBvcnRzLnNvcnQgPSBmdW5jdGlvbiAoaGlzdCkge1xuICByZXR1cm4gaGlzdC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgLy9zb3J0IGJ5IHRpbWVzdGFtcHMsIHRoZW4gaWRzLlxuICAgIC8vdGhlcmUgc2hvdWxkIG5ldmVyIGJlIGEgcGFpciB3aXRoIGVxdWFsIHRpbWVzdGFtcHNcbiAgICAvL2FuZCBpZHMuXG4gICAgcmV0dXJuIGFbMV0gLSBiWzFdIHx8IChhWzJdID4gYlsyXSA/IDEgOiAtMSlcbiAgfSlcbn1cbiIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcbnZhciBiYWNrb2ZmID0gcmVxdWlyZSgnYmFja29mZicpXG5cbm1vZHVsZS5leHBvcnRzID1cbmZ1bmN0aW9uIChjcmVhdGVDb25uZWN0aW9uKSB7XG4gIHJldHVybiBmdW5jdGlvbiAob3B0cywgb25Db25uZWN0KSB7XG4gICAgb25Db25uZWN0ID0gJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygb3B0cyA/IG9wdHMgOiBvbkNvbm5lY3RcbiAgICBvcHRzID0gb3B0cyB8fCB7aW5pdGlhbERlbGF5OiAxZTMsIG1heERlbGF5OiAzMGUzfVxuICAgIGlmKCFvbkNvbm5lY3QpXG4gICAgICBvbkNvbm5lY3QgPSBvcHRzLm9uQ29ubmVjdFxuXG4gICAgdmFyIGVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKClcbiAgICBlbWl0dGVyLmNvbm5lY3RlZCA9IGZhbHNlXG4gICAgZW1pdHRlci5yZWNvbm5lY3QgPSB0cnVlXG5cbiAgICBpZihvbkNvbm5lY3QpXG4gICAgICBlbWl0dGVyLm9uKCdjb25uZWN0Jywgb25Db25uZWN0KVxuXG4gICAgdmFyIGJhY2tvZmZNZXRob2QgPSAoYmFja29mZltvcHRzLnR5cGVdIHx8IGJhY2tvZmYuZmlib25hY2NpKSAob3B0cylcblxuICAgIGJhY2tvZmZNZXRob2Qub24oJ2JhY2tvZmYnLCBmdW5jdGlvbiAobiwgZCkge1xuICAgICAgZW1pdHRlci5lbWl0KCdiYWNrb2ZmJywgbiwgZClcbiAgICB9KVxuXG4gICAgdmFyIGFyZ3NcbiAgICBmdW5jdGlvbiBhdHRlbXB0IChuLCBkZWxheSkge1xuICAgICAgaWYoIWVtaXR0ZXIucmVjb25uZWN0KSByZXR1cm5cblxuICAgICAgZW1pdHRlci5lbWl0KCdyZWNvbm5lY3QnLCBuLCBkZWxheSlcbiAgICAgIHZhciBjb24gPSBjcmVhdGVDb25uZWN0aW9uLmFwcGx5KG51bGwsIGFyZ3MpXG4gICAgICBlbWl0dGVyLl9jb25uZWN0aW9uID0gY29uXG4gICAgICBmdW5jdGlvbiBvbkRpc2Nvbm5lY3QgKCkge1xuXG4gICAgICAgIGVtaXR0ZXIuY29ubmVjdGVkID0gZmFsc2VcbiAgICAgICAgY29uLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uRGlzY29ubmVjdClcbiAgICAgICAgY29uLnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIG9uRGlzY29ubmVjdClcbiAgICAgICAgY29uLnJlbW92ZUxpc3RlbmVyKCdlbmQnICAsIG9uRGlzY29ubmVjdClcblxuICAgICAgICAvL2VtaXQgZGlzY29ubmVjdCBiZWZvcmUgY2hlY2tpbmcgcmVjb25uZWN0LCBzbyB1c2VyIGhhcyBhIGNoYW5jZSB0byBkZWNpZGUgbm90IHRvLlxuICAgICAgICBlbWl0dGVyLmVtaXQoJ2Rpc2Nvbm5lY3QnLCBjb24pXG5cbiAgICAgICAgaWYoIWVtaXR0ZXIucmVjb25uZWN0KSByZXR1cm5cbiAgICAgICAgYmFja29mZk1ldGhvZC5iYWNrb2ZmKClcbiAgICAgIH1cblxuICAgICAgY29uLm9uKCdjb25uZWN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBiYWNrb2ZmTWV0aG9kLnJlc2V0KClcbiAgICAgICAgZW1pdHRlci5jb25uZWN0ZWQgPSB0cnVlXG4gICAgICAgIGVtaXR0ZXIuZW1pdCgnY29ubmVjdCcsIGNvbilcbiAgICAgIH0pLm9uKCdlcnJvcicsIG9uRGlzY29ubmVjdClcbiAgICAgICAgLm9uKCdjbG9zZScsIG9uRGlzY29ubmVjdClcbiAgICAgICAgLm9uKCdlbmQnICAsIG9uRGlzY29ubmVjdClcbiAgICB9XG5cbiAgICBlbWl0dGVyLmNvbm5lY3QgPVxuICAgIGVtaXR0ZXIubGlzdGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5yZWNvbm5lY3QgPSB0cnVlXG4gICAgICBpZihlbWl0dGVyLmNvbm5lY3RlZCkgcmV0dXJuXG4gICAgICBiYWNrb2ZmTWV0aG9kLnJlc2V0KClcbiAgICAgIGJhY2tvZmZNZXRob2Qub24oJ3JlYWR5JywgYXR0ZW1wdClcbiAgICAgIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgIGF0dGVtcHQoMCwgMClcbiAgICAgIHJldHVybiBlbWl0dGVyXG4gICAgfVxuXG4gICAgLy9mb3JjZSByZWNvbm5lY3Rpb25cbiAgICBlbWl0dGVyLnJlY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmKHRoaXMuY29ubmVjdGVkKVxuICAgICAgICByZXR1cm4gZW1pdHRlci5kaXNjb25uZWN0KClcbiAgICAgIFxuICAgICAgYmFja29mZk1ldGhvZC5yZXNldCgpXG4gICAgICBhdHRlbXB0KDAsIDApXG4gICAgICByZXR1cm4gZW1pdHRlclxuICAgIH1cblxuICAgIGVtaXR0ZXIuZGlzY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMucmVjb25uZWN0ID0gZmFsc2VcbiAgICAgIGlmKCFlbWl0dGVyLmNvbm5lY3RlZCkgcmV0dXJuIGVtaXR0ZXJcbiAgICAgIFxuICAgICAgZWxzZSBpZihlbWl0dGVyLl9jb25uZWN0aW9uKVxuICAgICAgICBlbWl0dGVyLl9jb25uZWN0aW9uLmRlc3Ryb3koKVxuXG4gICAgICBlbWl0dGVyLmVtaXQoJ2Rpc2Nvbm5lY3QnKVxuICAgICAgcmV0dXJuIGVtaXR0ZXJcbiAgICB9XG5cbiAgICB2YXIgd2lkZ2V0XG4gICAgZW1pdHRlci53aWRnZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZighd2lkZ2V0KVxuICAgICAgICB3aWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldCcpKGVtaXR0ZXIpXG4gICAgICByZXR1cm4gd2lkZ2V0XG4gICAgfVxuXG4gICAgcmV0dXJuIGVtaXR0ZXJcbiAgfVxuXG59XG4iLCJcbnZhciBiZXR3ZWVuICAgICA9IHJlcXVpcmUoJ2JldHdlZW4nKVxudmFyIFNjdXR0bGVidXR0ID0gcmVxdWlyZSgnc2N1dHRsZWJ1dHQnKVxudmFyIGluaGVyaXRzICAgID0gcmVxdWlyZSgndXRpbCcpLmluaGVyaXRzXG52YXIgZmlsdGVyICAgICAgPSByZXF1aXJlKCdzY3V0dGxlYnV0dC91dGlsJykuZmlsdGVyXG5cbmluaGVyaXRzKFJBcnJheSwgU2N1dHRsZWJ1dHQpXG5cbm1vZHVsZS5leHBvcnRzID0gUkFycmF5XG5cbmZ1bmN0aW9uIGZ1enogKCkge1xuICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygpLnN1YnN0cmluZygyLCA1KVxufVxuXG52YXIgRE9FTUlUID0gdHJ1ZSwgQ0hBTkdFID0ge31cblxuZnVuY3Rpb24gb3JkZXIgKGEsIGIpIHtcbiAgLy90aW1lc3RhbXAsIHRoZW4gc291cmNlXG4gIHJldHVybiBiZXR3ZWVuLnN0cm9yZChhWzFdLCBiWzFdKSB8fCBiZXR3ZWVuLnN0cm9yZChhWzJdLCBiWzJdKVxufVxuXG5mdW5jdGlvbiBSQXJyYXkgKCkge1xuICBTY3V0dGxlYnV0dC5jYWxsKHRoaXMpXG4gIHRoaXMua2V5cyA9IFtdXG4gIHRoaXMuc3RvcmUgPSB7fVxuICB0aGlzLl9oaXN0ID0ge31cbiAgdGhpcy5sZW5ndGggPSAwXG4gIGlmKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICA7W10uZm9yRWFjaC5jYWxsKGFyZ3VtZW50cywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHNlbGYucHVzaChlKVxuICAgIH0pXG4gIH1cbn1cblxudmFyIEEgPSBSQXJyYXkucHJvdG90eXBlXG5cbkEubGFzdCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMua2V5c1t0aGlzLmtleXMubGVuZ3RoIC0gMV1cbn1cblxuQS5maXJzdCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMua2V5c1swXVxufVxuXG5BLmluc2VydCA9IGZ1bmN0aW9uIChiZWZvcmUsIHZhbCwgYWZ0ZXIpIHsgIFxuICB2YXIga2V5ID0gYmV0d2VlbihiZWZvcmUgfHwgYmV0d2Vlbi5sbywgYWZ0ZXIgfHwgYmV0d2Vlbi5oaSkgKyBmdXp6KClcbiAgdGhpcy5zZXQoa2V5LCB2YWwpXG4gIHJldHVybiBrZXlcbn1cblxuQS5wdXNoID0gZnVuY3Rpb24gKHZhbCkge1xuICB2YXIga2V5ID0gdGhpcy5pbnNlcnQodGhpcy5sYXN0KCksIHZhbClcbn1cblxuQS51bnNoaWZ0ID0gZnVuY3Rpb24gKHZhbCkge1xuICB2YXIga2V5ID0gdGhpcy5pbnNlcnQobnVsbCwgdmFsLCB0aGlzLmZpcnN0KCkpXG59XG5cbkEuaW5kZXhPZiA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgZm9yKHZhciBpIGluIHRoaXMua2V5cykge1xuICAgIHZhciBrZXkgPSB0aGlzLmtleXNbaV1cbiAgICBpZih2ID09PSB0aGlzLmdldChrZXkpKSByZXR1cm4gaVxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbkEuaW5kZXhPZktleSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgcmV0dXJuIHRoaXMua2V5cy5pbmRleE9mKGtleSlcbn1cblxuQS50b0pTT04gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzdG9yZSA9IHRoaXMuc3RvcmVcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIHJldHVybiB0aGlzLmtleXMubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gc2VsZi5nZXQoa2V5KVxuICB9KVxufVxuXG5BLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICBpZignc3RyaW5nJyA9PSB0eXBlb2Yga2V5KSB7XG4gICAgaWYodmFsID09PSBudWxsKSByZXR1cm4gdGhpcy51bnNldChrZXkpXG4gICAgaWYobnVsbCA9PSB0aGlzLnN0b3JlW2tleV0pIHRoaXMubGVuZ3RoICsrXG4gICAgdGhpcy5zdG9yZVtrZXldID0gdmFsXG4gICAgaWYoIX50aGlzLmtleXMuaW5kZXhPZihrZXkpKSB7XG4gICAgICB0aGlzLmtleXMucHVzaChrZXkpXG4gICAgICB0aGlzLmtleXMuc29ydCgpXG4gICAgfVxuICAgIENIQU5HRVtrZXldID0gdmFsXG4gICAgRE9FTUlUICYmIHRoaXMuX2VtaXQoKVxuICB9XG59XG5cbkEuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICByZXR1cm4gdGhpcy5zdG9yZVtrZXldXG59XG5cbkEudW5zZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIGlmKCdzdHJpbmcnID09IHR5cGVvZiBrZXkpIHtcbiAgICBpZihudWxsICE9IHRoaXMuc3RvcmVba2V5XSkgdGhpcy5sZW5ndGggLS1cbiAgICBkZWxldGUgdGhpcy5zdG9yZVtrZXldXG4gICAgdmFyIGkgPSB0aGlzLmtleXMuaW5kZXhPZihrZXkpXG4gICAgaWYoIX5pKSByZXR1cm5cbiAgICB0aGlzLmtleXMuc3BsaWNlKGksIDEpICAgIFxuXG4gICAgQ0hBTkdFW2tleV0gPSBudWxsXG4gICAgRE9FTUlUICYmIHRoaXMuX2VtaXQoKVxuICB9XG59XG5cbkEucG9wID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbCA9IHRoaXMubGFzdCgpXG4gIHZhciB2YWwgPSB0aGlzLnN0b3JlW2xdXG4gIHRoaXMudW5zZXQobClcbiAgcmV0dXJuIHZhbFxufVxuXG5BLnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZiA9IHRoaXMuZmlyc3QoKVxuICB2YXIgdmFsID0gdGhpcy5zdG9yZVtmXVxuICB0aGlzLnVuc2V0KGYpXG4gIHJldHVybiB2YWxcbn1cblxuQS5fZW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYoIURPRU1JVCkgcmV0dXJuXG4gIHRoaXMubG9jYWxVcGRhdGUoQ0hBTkdFKVxuICBDSEFOR0UgPSB7fVxufVxuXG5BLnNwbGljZSA9IGZ1bmN0aW9uIChpLCBkIC8qLC4uLmFyZ3MqLykge1xuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKVxuICB2YXIgaiA9IDAsIGwgPSBhcmdzLmxlbmd0aFxuXG4gIERPRU1JVCA9IGZhbHNlXG5cbiAgaWYoZCArIGkgPiB0aGlzLmtleXMubGVuZ3RoKVxuICAgIGQgPSB0aGlzLmtleXMubGVuZ3RoIC0gaVxuICBcbiAgd2hpbGUoaiA8IGQpIHtcbiAgICBpZihqIDwgbClcbiAgICAgIHRoaXMuc2V0KHRoaXMua2V5c1tpK2pdLCBhcmdzW2pdKSwgaisrXG4gICAgZWxzZVxuICAgICAgdGhpcy51bnNldCh0aGlzLmtleXNbaStqXSksIGQtLVxuICB9XG5cbiAgd2hpbGUoaiA8IGwpXG4gICAgdGhpcy5pbnNlcnQodGhpcy5rZXlzW2krai0xXSwgYXJnc1tqXSwgdGhpcy5rZXlzW2kral0pLCBqKytcblxuICBET0VNSVQgPSB0cnVlXG4gIHRoaXMuX2VtaXQoKVxufVxuXG5BLmFwcGx5VXBkYXRlID0gZnVuY3Rpb24gKHVwZGF0ZSkge1xuICBET0VNSVQgPSBmYWxzZVxuICB2YXIgY2hhbmdlID0gdXBkYXRlWzBdLCBvbGRcbiAgdmFyIGFwcGx5ID0ge30sIGNoID0ge31cbiAgdmFyIG9sZCA9IHt9XG4gIGZvcih2YXIga2V5IGluIGNoYW5nZSkge1xuICAgIGlmKCF0aGlzLl9oaXN0W2tleV0gfHwgb3JkZXIodXBkYXRlLCB0aGlzLl9oaXN0W2tleV0pID4gMClcbiAgICAgIGFwcGx5W2tleV0gPSBjaGFuZ2Vba2V5XVxuICB9XG4gIC8vYWxsb3cgdGhlIHVzZXIgdG8gc2VlIHdoYXQgdGhlIGNoYW5nZSBpcyBnb2luZyB0byBiZS5cbiAgdGhpcy5lbWl0KCdwcmV1cGRhdGUnLCBhcHBseSkgXG5cbiAgLy9hcHBseSB0aGUgY2hhbmdlLi4uXG4gIGZvcih2YXIga2V5IGluIGFwcGx5KSB7XG4gICAgdmFyIG8gPSB0aGlzLl9oaXN0W2tleV1cbiAgICBvICYmIChvbGRbb1sxXSsnOicrb1syXV0gPSBvKSAvL3RzOnNvdXJjZVxuICAgIHRoaXMuX2hpc3Rba2V5XSA9IHVwZGF0ZVxuICAgIHRoaXMuc2V0KGtleSwgYXBwbHlba2V5XSlcbiAgfVxuXG4gIC8vY2hlY2sgaWYgb2xkIGVsZW1lbnRzIG5lZWQgdG8gYmUgcmVtb3ZlZC5cbiAgLy9tYXkgYWxzbyB3YW50IHRvIGtlZXAgb2xkIHVwZGF0ZXMgaGFuZ2luZyBhcm91bmQgXG4gIC8vc28gdGhlIHVzZXIgY2FuIHNlZSByZWNlbnQgaGlzdG9yeS4uLlxuICBmb3IodmFyIGlkIGluIG9sZCkge1xuICAgIHZhciBvID0gb2xkW2lkXVswXSwgcm0gPSB0cnVlXG4gICAgZm9yKHZhciBrZXkgaW4gbykge1xuICAgICAgaWYodGhpcy5faGlzdFtrZXldID09PSBvbGRbaWRdKSBybSA9IGZhbHNlXG4gICAgfVxuICAgIGlmKHJtKVxuICAgICAgdGhpcy5lbWl0KCdfcmVtb3ZlJywgb2xkW2lkXSlcbiAgfVxuICAgIFxuICBET0VNSVQgPSB0cnVlXG4gIENIQU5HRSA9IHt9XG4gIHRoaXMuZW1pdCgndXBkYXRlJywgYXBwbHkpXG4gIHJldHVybiB0cnVlXG59XG5cblxuQS5oaXN0b3J5ID0gZnVuY3Rpb24gKHNvdXJjZXMpIHtcbiAgdmFyIGggPSBbXVxuICBmb3IgKHZhciBrZXkgaW4gdGhpcy5faGlzdCkge1xuICAgIHZhciB1cGRhdGUgPSB0aGlzLl9oaXN0W2tleV1cbiAgICAgIGlmKCF+aC5pbmRleE9mKHVwZGF0ZSkgJiYgZmlsdGVyKHVwZGF0ZSwgc291cmNlcykpXG4gICAgICAgIGgucHVzaCh1cGRhdGUpXG4gIH1cbiAgcmV0dXJuIGguc29ydChvcmRlcilcbn1cblxuQS5mb3JFYWNoID0gZnVuY3Rpb24gKGZ1bikge1xuICByZXR1cm4gdGhpcy50b0pTT04oKS5mb3JFYWNoKGZ1bilcbn1cblxuQS5maWx0ZXIgPSBmdW5jdGlvbiAoZnVuKSB7XG4gIHJldHVybiB0aGlzLnRvSlNPTigpLmZpbHRlcihmdW4pXG59XG5cbkEubWFwID0gZnVuY3Rpb24gKGZ1bikge1xuICByZXR1cm4gdGhpcy50b0pTT04oKS5tYXAoZnVuKVxufVxuXG5BLnJlZHVjZSA9IGZ1bmN0aW9uIChmdW4sIGluaXRpYWwpIHtcbiAgcmV0dXJuIHRoaXMudG9KU09OKCkucmVkdWNlKGZ1biwgaW5pdGlhbClcbn1cblxuLy8ubGVuZ3RoIGlzIGEgcHJvcGVydHksIG5vdCBhIGZ1bmN0aW9uLlxuIiwiXG5mdW5jdGlvbiBpbmplY3QgKGNoYXJzKSB7XG5cbiAgY2hhcnMgPSBjaGFycyB8fFxuICAnITAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWl9hYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5en4nXG5cbiAgY2hhcnMgPSBjaGFycy5zcGxpdCgnJykuc29ydCgpLmpvaW4oJycpXG5cbiAgdmFyIGV4cG9ydHMgPSBiZXR3ZWVuXG5cbiAgZXhwb3J0cy5iZXR3ZWVuICAgPSBiZXR3ZWVuXG5cbiAgZXhwb3J0cy5yYW5kc3RyICAgPSByYW5kc3RyXG4gIGV4cG9ydHMuYmV0d2VlbiAgID0gYmV0d2VlblxuICBleHBvcnRzLnN0cm9yZCAgICA9IHN0cm9yZFxuXG4gIGV4cG9ydHMubG8gICAgICAgID0gY2hhcnNbMF1cbiAgZXhwb3J0cy5oaSAgICAgICAgPSBjaGFyc1tjaGFycy5sZW5ndGggLSAxXVxuXG4gIGV4cG9ydHMuaW5qZWN0ICAgID0gaW5qZWN0XG5cbiAgZnVuY3Rpb24gcmFuZHN0cihsKSB7XG4gICAgdmFyIHN0ciA9ICcnXG4gICAgd2hpbGUobC0tKSBcbiAgICAgIHN0ciArPSBjaGFyc1tcbiAgICAgICAgTWF0aC5mbG9vcihcbiAgICAgICAgICBNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoIFxuICAgICAgICApXG4gICAgICBdXG4gICAgcmV0dXJuIHN0clxuICB9XG5cbiAgLypcbiAgICBTT01FIEVYQU1QTEUgU1RSSU5HUywgSU4gT1JERVJcbiAgIFxuICAgIDBcbiAgICAwMDAwMVxuICAgIDAwMDFcbiAgICAwMDFcbiAgICAwMDEwMDFcbiAgICAwMDEwMVxuICAgIDAwMTFcbiAgICAwMDExMDAxXG4gICAgMDAxMTAwMTAxXG4gICAgMDAxMTAwMTFcbiAgICAwMDExMDFcbiAgICAwMDExMVxuICAgIDAxICBcblxuICAgIGlmIHlvdSBuZXZlciBtYWtlIGEgc3RyaW5nIHRoYXQgZW5kcyBpbiB0aGUgbG93ZXN0IGNoYXIsXG4gICAgdGhlbiBpdCBpcyBhbHdheXMgcG9zc2libGUgdG8gbWFrZSBhIHN0cmluZyBiZXR3ZWVuIHR3byBzdHJpbmdzLlxuICAgIHRoaXMgaXMgbGlrZSBob3cgZGVjaW1hbHMgbmV2ZXIgZW5kIGluIDAuIFxuXG4gICAgZXhhbXBsZTpcblxuICAgIGJldHdlZW4oJ0EnLCAnQUInKSBcblxuICAgIC4uLiAnQUEnIHdpbGwgc29ydCBiZXR3ZWVuICdBJyBhbmQgJ0FCJyBidXQgdGhlbiBpdCBpcyBpbXBvc3NpYmxlXG4gICAgdG8gbWFrZSBhIHN0cmluZyBpbmJldHdlZW4gJ0EnIGFuZCAnQUEnLlxuICAgIGluc3RlYWQsIHJldHVybiAnQUFCJywgdGhlbiB0aGVyZSB3aWxsIGJlIHNwYWNlLlxuXG4gICovXG5cbiAgZnVuY3Rpb24gYmV0d2VlbiAoYSwgYikge1xuXG4gICAgdmFyIHMgPSAnJywgaSA9IDBcblxuICAgIHdoaWxlICh0cnVlKSB7XG5cbiAgICAgIHZhciBfYSA9IGNoYXJzLmluZGV4T2YoYVtpXSlcbiAgICAgIHZhciBfYiA9IGNoYXJzLmluZGV4T2YoYltpXSlcbiAgICAgXG4gICAgICBpZihfYSA9PSAtMSkgX2EgPSAwXG4gICAgICBpZihfYiA9PSAtMSkgX2IgPSBjaGFycy5sZW5ndGggLSAxXG5cbiAgICAgIGkrK1xuXG4gICAgICB2YXIgYyA9IGNoYXJzW1xuICAgICAgICAgIF9hICsgMSA8IF9iIFxuICAgICAgICA/IE1hdGgucm91bmQoKF9hK19iKS8yKVxuICAgICAgICA6IF9hXG4gICAgICBdXG5cbiAgICAgIHMgKz0gY1xuXG4gICAgICBpZihhIDwgcyAmJiBzIDwgYiAmJiBjICE9IGV4cG9ydHMubG8pXG4gICAgICAgIHJldHVybiBzO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0cm9yZCAoYSwgYikge1xuICAgIHJldHVybiAoXG4gICAgICBhID09IGIgPyAgMFxuICAgIDogYSA8ICBiID8gLTFcbiAgICA6ICAgICAgICAgICAxXG4gICAgKVxuICB9XG5cbiAgYmV0d2Vlbi5zdHJvcmRcblxuICByZXR1cm4gYmV0d2VlblxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gaW5qZWN0KG51bGwpXG4iLCJcbnZhciBoID0gcmVxdWlyZSgnaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVtaXR0ZXIpIHtcbiAgdmFyIHN0eWxlID0ge31cbiAgdmFyIGVsID0gaCgnYScsIHtocmVmOiAnIycsIHN0eWxlOiBzdHlsZSwgY2xpY2s6IGVtaXR0ZXIuZGlzY29ubmVjdH0pXG4gIHZhciBpbnRcbiAgZW1pdHRlci5vbigncmVjb25uZWN0JywgZnVuY3Rpb24gKG4sIGQpIHtcbiAgICB2YXIgZGVsYXkgPSBNYXRoLnJvdW5kKGQgLyAxMDAwKSArIDFcbiAgICBjb25zb2xlLmxvZyhuLCBkKVxuICAgIGVsLmlubmVyVGV4dCA9ICdyZWNvbm5lY3QgaW4gJyArIGRlbGF5XG4gICAgY2xlYXJJbnRlcnZhbChpbnQpXG4gICAgaW50ID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgZWwuaW5uZXJUZXh0ID0gZGVsYXkgPyAncmVjb25uZWN0IGluICcgKyAtLWRlbGF5IDogJ3JlY29ubmVjdGluZy4uLidcbiAgICB9LCAxZTMpXG4gIH0pXG4gIGVtaXR0ZXIub24oJ2Nvbm5lY3QnLCAgIGZ1bmN0aW9uICgpIHtcbiAgICBlbC5pbm5lclRleHQgPSAnY29ubmVjdGVkJ1xuICAgIGNsZWFySW50ZXJ2YWwoaW50KVxuICB9KVxuICByZXR1cm4gZWxcbn1cbiIsInZhciBTdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKTtcbnZhciBzb2NranMgPSByZXF1aXJlKCdzb2NranMtY2xpZW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHVyaSwgY2IpIHtcbiAgICBpZiAoL15cXC9cXC9bXlxcL10rXFwvLy50ZXN0KHVyaSkpIHtcbiAgICAgICAgdXJpID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgdXJpO1xuICAgIH1cbiAgICBlbHNlIGlmICghL15odHRwcz86XFwvXFwvLy50ZXN0KHVyaSkpIHtcbiAgICAgICAgdXJpID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vJ1xuICAgICAgICAgICAgKyB3aW5kb3cubG9jYXRpb24uaG9zdFxuICAgICAgICAgICAgKyAoL15cXC8vLnRlc3QodXJpKSA/IHVyaSA6ICcvJyArIHVyaSlcbiAgICAgICAgO1xuICAgIH1cbiAgICBcbiAgICB2YXIgc3RyZWFtID0gbmV3IFN0cmVhbTtcbiAgICBzdHJlYW0ucmVhZGFibGUgPSB0cnVlO1xuICAgIHN0cmVhbS53cml0YWJsZSA9IHRydWU7XG4gICAgXG4gICAgdmFyIHJlYWR5ID0gZmFsc2U7XG4gICAgdmFyIGJ1ZmZlciA9IFtdO1xuICAgIFxuICAgIHZhciBzb2NrID0gc29ja2pzKHVyaSk7XG4gICAgc3RyZWFtLnNvY2sgPSBzb2NrO1xuICAgIFxuICAgIHN0cmVhbS53cml0ZSA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICAgaWYgKCFyZWFkeSB8fCBidWZmZXIubGVuZ3RoKSBidWZmZXIucHVzaChtc2cpXG4gICAgICAgIGVsc2Ugc29jay5zZW5kKG1zZylcbiAgICB9O1xuICAgIFxuICAgIHN0cmVhbS5lbmQgPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgICAgIGlmIChtc2cgIT09IHVuZGVmaW5lZCkgc3RyZWFtLndyaXRlKG1zZyk7XG4gICAgICAgIGlmICghcmVhZHkpIHtcbiAgICAgICAgICAgIHN0cmVhbS5fZW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN0cmVhbS53cml0YWJsZSA9IGZhbHNlO1xuICAgICAgICBzb2NrLmNsb3NlKCk7XG4gICAgfTtcbiAgICBcbiAgICBzdHJlYW0uZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RyZWFtLl9lbmRlZCA9IHRydWU7XG4gICAgICAgIHN0cmVhbS53cml0YWJsZSA9IHN0cmVhbS5yZWFkYWJsZSA9IGZhbHNlO1xuICAgICAgICBidWZmZXIubGVuZ3RoID0gMFxuICAgICAgICBzb2NrLmNsb3NlKCk7XG4gICAgfTtcbiAgICBcbiAgICBzb2NrLm9ub3BlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoKTtcbiAgICAgICAgcmVhZHkgPSB0cnVlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1ZmZlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc29jay5zZW5kKGJ1ZmZlcltpXSk7XG4gICAgICAgIH1cbiAgICAgICAgYnVmZmVyID0gW107XG4gICAgICAgIHN0cmVhbS5lbWl0KCdjb25uZWN0Jyk7XG4gICAgICAgIGlmIChzdHJlYW0uX2VuZGVkKSBzdHJlYW0uZW5kKCk7XG4gICAgfTtcbiAgICBcbiAgICBzb2NrLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHN0cmVhbS5lbWl0KCdkYXRhJywgZS5kYXRhKTtcbiAgICB9O1xuICAgIFxuICAgIHNvY2sub25jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2VuZCcpO1xuICAgICAgICBzdHJlYW0ud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgc3RyZWFtLnJlYWRhYmxlID0gZmFsc2U7XG4gICAgfTtcbiAgICBcbiAgICByZXR1cm4gc3RyZWFtO1xufTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIgTWF0aGlldSBUdXJjb3R0ZVxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbnZhciBCYWNrb2ZmID0gcmVxdWlyZSgnLi9saWIvYmFja29mZicpLFxuICAgIEZpYm9uYWNjaUJhY2tvZmZTdHJhdGVneSA9IHJlcXVpcmUoJy4vbGliL3N0cmF0ZWd5L2ZpYm9uYWNjaScpLFxuICAgIEV4cG9uZW50aWFsQmFja29mZlN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9saWIvc3RyYXRlZ3kvZXhwb25lbnRpYWwnKTtcblxubW9kdWxlLmV4cG9ydHMuQmFja29mZiA9IEJhY2tvZmY7XG5tb2R1bGUuZXhwb3J0cy5GaWJvbmFjY2lTdHJhdGVneSA9IEZpYm9uYWNjaUJhY2tvZmZTdHJhdGVneTtcbm1vZHVsZS5leHBvcnRzLkV4cG9uZW50aWFsU3RyYXRlZ3kgPSBFeHBvbmVudGlhbEJhY2tvZmZTdHJhdGVneTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgRmlib25hY2NpIGJhY2tvZmYuXG4gKiBAcGFyYW0gb3B0aW9ucyBGaWJvbmFjY2kgYmFja29mZiBzdHJhdGVneSBhcmd1bWVudHMuXG4gKiBAc2VlIEZpYm9uYWNjaUJhY2tvZmZTdHJhdGVneVxuICovXG5tb2R1bGUuZXhwb3J0cy5maWJvbmFjY2kgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBCYWNrb2ZmKG5ldyBGaWJvbmFjY2lCYWNrb2ZmU3RyYXRlZ3kob3B0aW9ucykpO1xufTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGFuIGV4cG9uZW50aWFsIGJhY2tvZmYuXG4gKiBAcGFyYW0gb3B0aW9ucyBFeHBvbmVudGlhbCBzdHJhdGVneSBhcmd1bWVudHMuXG4gKiBAc2VlIEV4cG9uZW50aWFsQmFja29mZlN0cmF0ZWd5XG4gKi9cbm1vZHVsZS5leHBvcnRzLmV4cG9uZW50aWFsID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgQmFja29mZihuZXcgRXhwb25lbnRpYWxCYWNrb2ZmU3RyYXRlZ3kob3B0aW9ucykpO1xufTtcblxuIiwiOyhmdW5jdGlvbiAoKSB7XG5cbmZ1bmN0aW9uIGgoKSB7XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpLCBlID0gbnVsbFxuICBmdW5jdGlvbiBpdGVtIChsKSB7XG4gICAgXG4gICAgZnVuY3Rpb24gcGFyc2VDbGFzcyAoc3RyaW5nKSB7XG4gICAgICB2YXIgbSA9IHN0cmluZy5zcGxpdCgvKFtcXC4jXT9bYS16QS1aMC05Xy1dKykvKVxuICAgICAgbS5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHZhciBzID0gdi5zdWJzdHJpbmcoMSx2Lmxlbmd0aClcbiAgICAgICAgaWYoIXYpIHJldHVybiBcbiAgICAgICAgaWYoIWUpXG4gICAgICAgICAgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodilcbiAgICAgICAgZWxzZSBpZiAodlswXSA9PT0gJy4nKVxuICAgICAgICAgIGUuY2xhc3NMaXN0LmFkZChzKVxuICAgICAgICBlbHNlIGlmICh2WzBdID09PSAnIycpXG4gICAgICAgICAgZS5zZXRBdHRyaWJ1dGUoJ2lkJywgcylcbiAgICAgICAgXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmKGwgPT0gbnVsbClcbiAgICAgIDtcbiAgICBlbHNlIGlmKCdzdHJpbmcnID09PSB0eXBlb2YgbCkge1xuICAgICAgaWYoIWUpXG4gICAgICAgIHBhcnNlQ2xhc3MobClcbiAgICAgIGVsc2VcbiAgICAgICAgZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShsKSlcbiAgICB9XG4gICAgZWxzZSBpZignbnVtYmVyJyA9PT0gdHlwZW9mIGwgXG4gICAgICB8fCAnYm9vbGVhbicgPT09IHR5cGVvZiBsXG4gICAgICB8fCBsIGluc3RhbmNlb2YgRGF0ZSBcbiAgICAgIHx8IGwgaW5zdGFuY2VvZiBSZWdFeHAgKSB7XG4gICAgICAgIGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobC50b1N0cmluZygpKSlcbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShsKSlcbiAgICAgIGwuZm9yRWFjaChpdGVtKVxuICAgIGVsc2UgaWYobCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KVxuICAgICAgZS5hcHBlbmRDaGlsZChsKVxuICAgIGVsc2UgaWYgKCdvYmplY3QnID09PSB0eXBlb2YgbCkge1xuICAgICAgZm9yICh2YXIgayBpbiBsKSB7XG4gICAgICAgIGlmKCdmdW5jdGlvbicgPT09IHR5cGVvZiBsW2tdKVxuICAgICAgICAgIGUuYWRkRXZlbnRMaXN0ZW5lcihrLCBsW2tdKVxuICAgICAgICBlbHNlIGlmKGsgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICBmb3IgKHZhciBzIGluIGxba10pXG4gICAgICAgICAgICBlLnN0eWxlLnNldFByb3BlcnR5KHMsIGxba11bc10pXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGUuc2V0QXR0cmlidXRlKGssIGxba10pXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdoaWxlKGFyZ3MubGVuZ3RoKSB7XG4gICAgaXRlbShhcmdzLnNoaWZ0KCkpXG4gIH1cbiAgcmV0dXJuIGVcbn1cblxuaWYodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG4gIG1vZHVsZS5leHBvcnRzID0gaFxuZWxzZVxuICB0aGlzLmggPSBoXG59KSgpXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDEyIE1hdGhpZXUgVHVyY290dGVcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG52YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuLyoqXG4gKiBCYWNrb2ZmIGRyaXZlci5cbiAqIEBwYXJhbSBiYWNrb2ZmU3RyYXRlZ3kgQmFja29mZiBkZWxheSBnZW5lcmF0b3Ivc3RyYXRlZ3kuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQmFja29mZihiYWNrb2ZmU3RyYXRlZ3kpIHtcbiAgICBldmVudHMuRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgICB0aGlzLmJhY2tvZmZTdHJhdGVneV8gPSBiYWNrb2ZmU3RyYXRlZ3k7XG4gICAgdGhpcy5iYWNrb2ZmTnVtYmVyXyA9IDA7XG4gICAgdGhpcy5iYWNrb2ZmRGVsYXlfID0gMDtcbiAgICB0aGlzLnRpbWVvdXRJRF8gPSAtMTtcblxuICAgIHRoaXMuaGFuZGxlcnMgPSB7XG4gICAgICAgIGJhY2tvZmY6IHRoaXMub25CYWNrb2ZmXy5iaW5kKHRoaXMpXG4gICAgfTtcbn1cbnV0aWwuaW5oZXJpdHMoQmFja29mZiwgZXZlbnRzLkV2ZW50RW1pdHRlcik7XG5cbi8qKlxuICogU3RhcnRzIGEgYmFja29mZiBvcGVyYXRpb24uXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLmJhY2tvZmYgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy50aW1lb3V0SURfICE9PSAtMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JhY2tvZmYgaW4gcHJvZ3Jlc3MuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5iYWNrb2ZmRGVsYXlfID0gdGhpcy5iYWNrb2ZmU3RyYXRlZ3lfLm5leHQoKTtcbiAgICB0aGlzLnRpbWVvdXRJRF8gPSBzZXRUaW1lb3V0KHRoaXMuaGFuZGxlcnMuYmFja29mZiwgdGhpcy5iYWNrb2ZmRGVsYXlfKTtcbiAgICB0aGlzLmVtaXQoJ2JhY2tvZmYnLCB0aGlzLmJhY2tvZmZOdW1iZXJfLCB0aGlzLmJhY2tvZmZEZWxheV8pO1xufTtcblxuLyoqXG4gKiBCYWNrb2ZmIGNvbXBsZXRpb24gaGFuZGxlci5cbiAqIEBwcml2YXRlXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLm9uQmFja29mZl8gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRpbWVvdXRJRF8gPSAtMTtcbiAgICB0aGlzLmVtaXQoJ3JlYWR5JywgdGhpcy5iYWNrb2ZmTnVtYmVyXysrLCB0aGlzLmJhY2tvZmZEZWxheV8pO1xufTtcblxuLyoqXG4gKiBTdG9wcyBhbnkgYmFja29mZiBvcGVyYXRpb24gYW5kIHJlc2V0cyB0aGUgYmFja29mZlxuICogZGVsYXkgdG8gaXRzIGluaXRhbCB2YWx1ZS5cbiAqL1xuQmFja29mZi5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJhY2tvZmZOdW1iZXJfID0gMDtcbiAgICB0aGlzLmJhY2tvZmZTdHJhdGVneV8ucmVzZXQoKTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SURfKTtcbiAgICB0aGlzLnRpbWVvdXRJRF8gPSAtMTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja29mZjtcblxuIiwiKGZ1bmN0aW9uKCl7LyogU29ja0pTIGNsaWVudCwgdmVyc2lvbiAwLjMuMS43LmdhNjdmLmRpcnR5LCBodHRwOi8vc29ja2pzLm9yZywgTUlUIExpY2Vuc2VcblxuQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS5cbiovXG5cbi8vIEpTT04yIGJ5IERvdWdsYXMgQ3JvY2tmb3JkIChtaW5pZmllZCkuXG52YXIgSlNPTjtKU09OfHwoSlNPTj17fSksZnVuY3Rpb24oKXtmdW5jdGlvbiBzdHIoYSxiKXt2YXIgYyxkLGUsZixnPWdhcCxoLGk9YlthXTtpJiZ0eXBlb2YgaT09XCJvYmplY3RcIiYmdHlwZW9mIGkudG9KU09OPT1cImZ1bmN0aW9uXCImJihpPWkudG9KU09OKGEpKSx0eXBlb2YgcmVwPT1cImZ1bmN0aW9uXCImJihpPXJlcC5jYWxsKGIsYSxpKSk7c3dpdGNoKHR5cGVvZiBpKXtjYXNlXCJzdHJpbmdcIjpyZXR1cm4gcXVvdGUoaSk7Y2FzZVwibnVtYmVyXCI6cmV0dXJuIGlzRmluaXRlKGkpP1N0cmluZyhpKTpcIm51bGxcIjtjYXNlXCJib29sZWFuXCI6Y2FzZVwibnVsbFwiOnJldHVybiBTdHJpbmcoaSk7Y2FzZVwib2JqZWN0XCI6aWYoIWkpcmV0dXJuXCJudWxsXCI7Z2FwKz1pbmRlbnQsaD1bXTtpZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KGkpPT09XCJbb2JqZWN0IEFycmF5XVwiKXtmPWkubGVuZ3RoO2ZvcihjPTA7YzxmO2MrPTEpaFtjXT1zdHIoYyxpKXx8XCJudWxsXCI7ZT1oLmxlbmd0aD09PTA/XCJbXVwiOmdhcD9cIltcXG5cIitnYXAraC5qb2luKFwiLFxcblwiK2dhcCkrXCJcXG5cIitnK1wiXVwiOlwiW1wiK2guam9pbihcIixcIikrXCJdXCIsZ2FwPWc7cmV0dXJuIGV9aWYocmVwJiZ0eXBlb2YgcmVwPT1cIm9iamVjdFwiKXtmPXJlcC5sZW5ndGg7Zm9yKGM9MDtjPGY7Yys9MSl0eXBlb2YgcmVwW2NdPT1cInN0cmluZ1wiJiYoZD1yZXBbY10sZT1zdHIoZCxpKSxlJiZoLnB1c2gocXVvdGUoZCkrKGdhcD9cIjogXCI6XCI6XCIpK2UpKX1lbHNlIGZvcihkIGluIGkpT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGksZCkmJihlPXN0cihkLGkpLGUmJmgucHVzaChxdW90ZShkKSsoZ2FwP1wiOiBcIjpcIjpcIikrZSkpO2U9aC5sZW5ndGg9PT0wP1wie31cIjpnYXA/XCJ7XFxuXCIrZ2FwK2guam9pbihcIixcXG5cIitnYXApK1wiXFxuXCIrZytcIn1cIjpcIntcIitoLmpvaW4oXCIsXCIpK1wifVwiLGdhcD1nO3JldHVybiBlfX1mdW5jdGlvbiBxdW90ZShhKXtlc2NhcGFibGUubGFzdEluZGV4PTA7cmV0dXJuIGVzY2FwYWJsZS50ZXN0KGEpPydcIicrYS5yZXBsYWNlKGVzY2FwYWJsZSxmdW5jdGlvbihhKXt2YXIgYj1tZXRhW2FdO3JldHVybiB0eXBlb2YgYj09XCJzdHJpbmdcIj9iOlwiXFxcXHVcIisoXCIwMDAwXCIrYS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTQpfSkrJ1wiJzonXCInK2ErJ1wiJ31mdW5jdGlvbiBmKGEpe3JldHVybiBhPDEwP1wiMFwiK2E6YX1cInVzZSBzdHJpY3RcIix0eXBlb2YgRGF0ZS5wcm90b3R5cGUudG9KU09OIT1cImZ1bmN0aW9uXCImJihEYXRlLnByb3RvdHlwZS50b0pTT049ZnVuY3Rpb24oYSl7cmV0dXJuIGlzRmluaXRlKHRoaXMudmFsdWVPZigpKT90aGlzLmdldFVUQ0Z1bGxZZWFyKCkrXCItXCIrZih0aGlzLmdldFVUQ01vbnRoKCkrMSkrXCItXCIrZih0aGlzLmdldFVUQ0RhdGUoKSkrXCJUXCIrZih0aGlzLmdldFVUQ0hvdXJzKCkpK1wiOlwiK2YodGhpcy5nZXRVVENNaW51dGVzKCkpK1wiOlwiK2YodGhpcy5nZXRVVENTZWNvbmRzKCkpK1wiWlwiOm51bGx9LFN0cmluZy5wcm90b3R5cGUudG9KU09OPU51bWJlci5wcm90b3R5cGUudG9KU09OPUJvb2xlYW4ucHJvdG90eXBlLnRvSlNPTj1mdW5jdGlvbihhKXtyZXR1cm4gdGhpcy52YWx1ZU9mKCl9KTt2YXIgY3g9L1tcXHUwMDAwXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csZXNjYXBhYmxlPS9bXFxcXFxcXCJcXHgwMC1cXHgxZlxceDdmLVxceDlmXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csZ2FwLGluZGVudCxtZXRhPXtcIlxcYlwiOlwiXFxcXGJcIixcIlxcdFwiOlwiXFxcXHRcIixcIlxcblwiOlwiXFxcXG5cIixcIlxcZlwiOlwiXFxcXGZcIixcIlxcclwiOlwiXFxcXHJcIiwnXCInOidcXFxcXCInLFwiXFxcXFwiOlwiXFxcXFxcXFxcIn0scmVwO3R5cGVvZiBKU09OLnN0cmluZ2lmeSE9XCJmdW5jdGlvblwiJiYoSlNPTi5zdHJpbmdpZnk9ZnVuY3Rpb24oYSxiLGMpe3ZhciBkO2dhcD1cIlwiLGluZGVudD1cIlwiO2lmKHR5cGVvZiBjPT1cIm51bWJlclwiKWZvcihkPTA7ZDxjO2QrPTEpaW5kZW50Kz1cIiBcIjtlbHNlIHR5cGVvZiBjPT1cInN0cmluZ1wiJiYoaW5kZW50PWMpO3JlcD1iO2lmKCFifHx0eXBlb2YgYj09XCJmdW5jdGlvblwifHx0eXBlb2YgYj09XCJvYmplY3RcIiYmdHlwZW9mIGIubGVuZ3RoPT1cIm51bWJlclwiKXJldHVybiBzdHIoXCJcIix7XCJcIjphfSk7dGhyb3cgbmV3IEVycm9yKFwiSlNPTi5zdHJpbmdpZnlcIil9KSx0eXBlb2YgSlNPTi5wYXJzZSE9XCJmdW5jdGlvblwiJiYoSlNPTi5wYXJzZT1mdW5jdGlvbih0ZXh0LHJldml2ZXIpe2Z1bmN0aW9uIHdhbGsoYSxiKXt2YXIgYyxkLGU9YVtiXTtpZihlJiZ0eXBlb2YgZT09XCJvYmplY3RcIilmb3IoYyBpbiBlKU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChlLGMpJiYoZD13YWxrKGUsYyksZCE9PXVuZGVmaW5lZD9lW2NdPWQ6ZGVsZXRlIGVbY10pO3JldHVybiByZXZpdmVyLmNhbGwoYSxiLGUpfXZhciBqO3RleHQ9U3RyaW5nKHRleHQpLGN4Lmxhc3RJbmRleD0wLGN4LnRlc3QodGV4dCkmJih0ZXh0PXRleHQucmVwbGFjZShjeCxmdW5jdGlvbihhKXtyZXR1cm5cIlxcXFx1XCIrKFwiMDAwMFwiK2EuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikpLnNsaWNlKC00KX0pKTtpZigvXltcXF0sOnt9XFxzXSokLy50ZXN0KHRleHQucmVwbGFjZSgvXFxcXCg/OltcIlxcXFxcXC9iZm5ydF18dVswLTlhLWZBLUZdezR9KS9nLFwiQFwiKS5yZXBsYWNlKC9cIlteXCJcXFxcXFxuXFxyXSpcInx0cnVlfGZhbHNlfG51bGx8LT9cXGQrKD86XFwuXFxkKik/KD86W2VFXVsrXFwtXT9cXGQrKT8vZyxcIl1cIikucmVwbGFjZSgvKD86Xnw6fCwpKD86XFxzKlxcWykrL2csXCJcIikpKXtqPWV2YWwoXCIoXCIrdGV4dCtcIilcIik7cmV0dXJuIHR5cGVvZiByZXZpdmVyPT1cImZ1bmN0aW9uXCI/d2Fsayh7XCJcIjpqfSxcIlwiKTpqfXRocm93IG5ldyBTeW50YXhFcnJvcihcIkpTT04ucGFyc2VcIil9KX0oKVxuXG5cbi8vICAgICBbKl0gSW5jbHVkaW5nIGxpYi9pbmRleC5qc1xuLy8gUHVibGljIG9iamVjdFxudmFyIFNvY2tKUyA9IChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICB2YXIgX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgICAgICAgICAgIHZhciBfd2luZG93ID0gd2luZG93O1xuICAgICAgICAgICAgICB2YXIgdXRpbHMgPSB7fTtcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3JldmVudHRhcmdldC5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLyogU2ltcGxpZmllZCBpbXBsZW1lbnRhdGlvbiBvZiBET00yIEV2ZW50VGFyZ2V0LlxuICogICBodHRwOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMi1FdmVudHMvZXZlbnRzLmh0bWwjRXZlbnRzLUV2ZW50VGFyZ2V0XG4gKi9cbnZhciBSRXZlbnRUYXJnZXQgPSBmdW5jdGlvbigpIHt9O1xuUkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICBpZighdGhpcy5fbGlzdGVuZXJzKSB7XG4gICAgICAgICB0aGlzLl9saXN0ZW5lcnMgPSB7fTtcbiAgICB9XG4gICAgaWYoIShldmVudFR5cGUgaW4gdGhpcy5fbGlzdGVuZXJzKSkge1xuICAgICAgICB0aGlzLl9saXN0ZW5lcnNbZXZlbnRUeXBlXSA9IFtdO1xuICAgIH1cbiAgICB2YXIgYXJyID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50VHlwZV07XG4gICAgaWYodXRpbHMuYXJySW5kZXhPZihhcnIsIGxpc3RlbmVyKSA9PT0gLTEpIHtcbiAgICAgICAgYXJyLnB1c2gobGlzdGVuZXIpO1xuICAgIH1cbiAgICByZXR1cm47XG59O1xuXG5SRXZlbnRUYXJnZXQucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBsaXN0ZW5lcikge1xuICAgIGlmKCEodGhpcy5fbGlzdGVuZXJzICYmIChldmVudFR5cGUgaW4gdGhpcy5fbGlzdGVuZXJzKSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgYXJyID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50VHlwZV07XG4gICAgdmFyIGlkeCA9IHV0aWxzLmFyckluZGV4T2YoYXJyLCBsaXN0ZW5lcik7XG4gICAgaWYgKGlkeCAhPT0gLTEpIHtcbiAgICAgICAgaWYoYXJyLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVyc1tldmVudFR5cGVdID0gYXJyLnNsaWNlKDAsIGlkeCkuY29uY2F0KCBhcnIuc2xpY2UoaWR4KzEpICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbGlzdGVuZXJzW2V2ZW50VHlwZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm47XG59O1xuXG5SRXZlbnRUYXJnZXQucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgdCA9IGV2ZW50LnR5cGU7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICAgIGlmICh0aGlzWydvbicrdF0pIHtcbiAgICAgICAgdGhpc1snb24nK3RdLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fbGlzdGVuZXJzICYmIHQgaW4gdGhpcy5fbGlzdGVuZXJzKSB7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpIDwgdGhpcy5fbGlzdGVuZXJzW3RdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLl9saXN0ZW5lcnNbdF1baV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9yZXZlbnR0YXJnZXQuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3NpbXBsZWV2ZW50LmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgU2ltcGxlRXZlbnQgPSBmdW5jdGlvbih0eXBlLCBvYmopIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIGlmICh0eXBlb2Ygb2JqICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBmb3IodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShrKSkgY29udGludWU7XG4gICAgICAgICAgICB0aGlzW2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuU2ltcGxlRXZlbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHIgPSBbXTtcbiAgICBmb3IodmFyIGsgaW4gdGhpcykge1xuICAgICAgICBpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoaykpIGNvbnRpbnVlO1xuICAgICAgICB2YXIgdiA9IHRoaXNba107XG4gICAgICAgIGlmICh0eXBlb2YgdiA9PT0gJ2Z1bmN0aW9uJykgdiA9ICdbZnVuY3Rpb25dJztcbiAgICAgICAgci5wdXNoKGsgKyAnPScgKyB2KTtcbiAgICB9XG4gICAgcmV0dXJuICdTaW1wbGVFdmVudCgnICsgci5qb2luKCcsICcpICsgJyknO1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvc2ltcGxlZXZlbnQuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL2V2ZW50ZW1pdHRlci5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIEV2ZW50RW1pdHRlciA9IGZ1bmN0aW9uKGV2ZW50cykge1xuICAgIHRoaXMuZXZlbnRzID0gZXZlbnRzIHx8IFtdO1xufTtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmICghdGhhdC5udWtlZCAmJiB0aGF0WydvbicrdHlwZV0pIHtcbiAgICAgICAgdGhhdFsnb24nK3R5cGVdLmFwcGx5KHRoYXQsIGFyZ3MpO1xuICAgIH1cbiAgICBpZiAodXRpbHMuYXJySW5kZXhPZih0aGF0LmV2ZW50cywgdHlwZSkgPT09IC0xKSB7XG4gICAgICAgIHV0aWxzLmxvZygnRXZlbnQgJyArIEpTT04uc3RyaW5naWZ5KHR5cGUpICtcbiAgICAgICAgICAgICAgICAgICcgbm90IGxpc3RlZCAnICsgSlNPTi5zdHJpbmdpZnkodGhhdC5ldmVudHMpICtcbiAgICAgICAgICAgICAgICAgICcgaW4gJyArIHRoYXQpO1xuICAgIH1cbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubnVrZSA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5udWtlZCA9IHRydWU7XG4gICAgZm9yKHZhciBpPTA7IGk8dGhhdC5ldmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGVsZXRlIHRoYXRbdGhhdC5ldmVudHNbaV1dO1xuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL2V2ZW50ZW1pdHRlci5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdXRpbHMuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciByYW5kb21fc3RyaW5nX2NoYXJzID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OV8nO1xudXRpbHMucmFuZG9tX3N0cmluZyA9IGZ1bmN0aW9uKGxlbmd0aCwgbWF4KSB7XG4gICAgbWF4ID0gbWF4IHx8IHJhbmRvbV9zdHJpbmdfY2hhcnMubGVuZ3RoO1xuICAgIHZhciBpLCByZXQgPSBbXTtcbiAgICBmb3IoaT0wOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmV0LnB1c2goIHJhbmRvbV9zdHJpbmdfY2hhcnMuc3Vic3RyKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCksMSkgKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldC5qb2luKCcnKTtcbn07XG51dGlscy5yYW5kb21fbnVtYmVyID0gZnVuY3Rpb24obWF4KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG59O1xudXRpbHMucmFuZG9tX251bWJlcl9zdHJpbmcgPSBmdW5jdGlvbihtYXgpIHtcbiAgICB2YXIgdCA9ICgnJysobWF4IC0gMSkpLmxlbmd0aDtcbiAgICB2YXIgcCA9IEFycmF5KHQrMSkuam9pbignMCcpO1xuICAgIHJldHVybiAocCArIHV0aWxzLnJhbmRvbV9udW1iZXIobWF4KSkuc2xpY2UoLXQpO1xufTtcblxuLy8gQXNzdW1pbmcgdGhhdCB1cmwgbG9va3MgbGlrZTogaHR0cDovL2FzZGFzZDoxMTEvYXNkXG51dGlscy5nZXRPcmlnaW4gPSBmdW5jdGlvbih1cmwpIHtcbiAgICB1cmwgKz0gJy8nO1xuICAgIHZhciBwYXJ0cyA9IHVybC5zcGxpdCgnLycpLnNsaWNlKDAsIDMpO1xuICAgIHJldHVybiBwYXJ0cy5qb2luKCcvJyk7XG59O1xuXG51dGlscy5pc1NhbWVPcmlnaW5VcmwgPSBmdW5jdGlvbih1cmxfYSwgdXJsX2IpIHtcbiAgICAvLyBsb2NhdGlvbi5vcmlnaW4gd291bGQgZG8sIGJ1dCBpdCdzIG5vdCBhbHdheXMgYXZhaWxhYmxlLlxuICAgIGlmICghdXJsX2IpIHVybF9iID0gX3dpbmRvdy5sb2NhdGlvbi5ocmVmO1xuXG4gICAgcmV0dXJuICh1cmxfYS5zcGxpdCgnLycpLnNsaWNlKDAsMykuam9pbignLycpXG4gICAgICAgICAgICAgICAgPT09XG4gICAgICAgICAgICB1cmxfYi5zcGxpdCgnLycpLnNsaWNlKDAsMykuam9pbignLycpKTtcbn07XG5cbnV0aWxzLmdldFBhcmVudERvbWFpbiA9IGZ1bmN0aW9uKHVybCkge1xuICAgIC8vIGlwdjQgaXAgYWRkcmVzc1xuICAgIGlmICgvXlswLTkuXSokLy50ZXN0KHVybCkpIHJldHVybiB1cmw7XG4gICAgLy8gaXB2NiBpcCBhZGRyZXNzXG4gICAgaWYgKC9eXFxbLy50ZXN0KHVybCkpIHJldHVybiB1cmw7XG4gICAgLy8gbm8gZG90c1xuICAgIGlmICghKC9bLl0vLnRlc3QodXJsKSkpIHJldHVybiB1cmw7XG5cbiAgICB2YXIgcGFydHMgPSB1cmwuc3BsaXQoJy4nKS5zbGljZSgxKTtcbiAgICByZXR1cm4gcGFydHMuam9pbignLicpO1xufTtcblxudXRpbHMub2JqZWN0RXh0ZW5kID0gZnVuY3Rpb24oZHN0LCBzcmMpIHtcbiAgICBmb3IodmFyIGsgaW4gc3JjKSB7XG4gICAgICAgIGlmIChzcmMuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgIGRzdFtrXSA9IHNyY1trXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZHN0O1xufTtcblxudmFyIFdQcmVmaXggPSAnX2pwJztcblxudXRpbHMucG9sbHV0ZUdsb2JhbE5hbWVzcGFjZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghKFdQcmVmaXggaW4gX3dpbmRvdykpIHtcbiAgICAgICAgX3dpbmRvd1tXUHJlZml4XSA9IHt9O1xuICAgIH1cbn07XG5cbnV0aWxzLmNsb3NlRnJhbWUgPSBmdW5jdGlvbiAoY29kZSwgcmVhc29uKSB7XG4gICAgcmV0dXJuICdjJytKU09OLnN0cmluZ2lmeShbY29kZSwgcmVhc29uXSk7XG59O1xuXG51dGlscy51c2VyU2V0Q29kZSA9IGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgcmV0dXJuIGNvZGUgPT09IDEwMDAgfHwgKGNvZGUgPj0gMzAwMCAmJiBjb2RlIDw9IDQ5OTkpO1xufTtcblxuLy8gU2VlOiBodHRwOi8vd3d3LmVyZy5hYmRuLmFjLnVrL35nZXJyaXQvZGNjcC9ub3Rlcy9jY2lkMi9ydG9fZXN0aW1hdG9yL1xuLy8gYW5kIFJGQyAyOTg4LlxudXRpbHMuY291bnRSVE8gPSBmdW5jdGlvbiAocnR0KSB7XG4gICAgdmFyIHJ0bztcbiAgICBpZiAocnR0ID4gMTAwKSB7XG4gICAgICAgIHJ0byA9IDMgKiBydHQ7IC8vIHJ0byA+IDMwMG1zZWNcbiAgICB9IGVsc2Uge1xuICAgICAgICBydG8gPSBydHQgKyAyMDA7IC8vIDIwMG1zZWMgPCBydG8gPD0gMzAwbXNlY1xuICAgIH1cbiAgICByZXR1cm4gcnRvO1xufVxuXG51dGlscy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoX3dpbmRvdy5jb25zb2xlICYmIGNvbnNvbGUubG9nICYmIGNvbnNvbGUubG9nLmFwcGx5KSB7XG4gICAgICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XG4gICAgfVxufTtcblxudXRpbHMuYmluZCA9IGZ1bmN0aW9uKGZ1biwgdGhhdCkge1xuICAgIGlmIChmdW4uYmluZCkge1xuICAgICAgICByZXR1cm4gZnVuLmJpbmQodGhhdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bi5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH1cbn07XG5cbnV0aWxzLmZsYXRVcmwgPSBmdW5jdGlvbih1cmwpIHtcbiAgICByZXR1cm4gdXJsLmluZGV4T2YoJz8nKSA9PT0gLTEgJiYgdXJsLmluZGV4T2YoJyMnKSA9PT0gLTE7XG59O1xuXG51dGlscy5hbWVuZFVybCA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHZhciBkbCA9IF9kb2N1bWVudC5sb2NhdGlvbjtcbiAgICBpZiAoIXVybCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIHVybCBmb3IgU29ja0pTJyk7XG4gICAgfVxuICAgIGlmICghdXRpbHMuZmxhdFVybCh1cmwpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignT25seSBiYXNpYyB1cmxzIGFyZSBzdXBwb3J0ZWQgaW4gU29ja0pTJyk7XG4gICAgfVxuXG4gICAgLy8gICcvL2FiYycgLS0+ICdodHRwOi8vYWJjJ1xuICAgIGlmICh1cmwuaW5kZXhPZignLy8nKSA9PT0gMCkge1xuICAgICAgICB1cmwgPSBkbC5wcm90b2NvbCArIHVybDtcbiAgICB9XG4gICAgLy8gJy9hYmMnIC0tPiAnaHR0cDovL2xvY2FsaG9zdDo4MC9hYmMnXG4gICAgaWYgKHVybC5pbmRleE9mKCcvJykgPT09IDApIHtcbiAgICAgICAgdXJsID0gZGwucHJvdG9jb2wgKyAnLy8nICsgZGwuaG9zdCArIHVybDtcbiAgICB9XG4gICAgLy8gc3RyaXAgdHJhaWxpbmcgc2xhc2hlc1xuICAgIHVybCA9IHVybC5yZXBsYWNlKC9bL10rJC8sJycpO1xuICAgIHJldHVybiB1cmw7XG59O1xuXG4vLyBJRSBkb2Vzbid0IHN1cHBvcnQgW10uaW5kZXhPZi5cbnV0aWxzLmFyckluZGV4T2YgPSBmdW5jdGlvbihhcnIsIG9iail7XG4gICAgZm9yKHZhciBpPTA7IGkgPCBhcnIubGVuZ3RoOyBpKyspe1xuICAgICAgICBpZihhcnJbaV0gPT09IG9iail7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG59O1xuXG51dGlscy5hcnJTa2lwID0gZnVuY3Rpb24oYXJyLCBvYmopIHtcbiAgICB2YXIgaWR4ID0gdXRpbHMuYXJySW5kZXhPZihhcnIsIG9iaik7XG4gICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIGFyci5zbGljZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBkc3QgPSBhcnIuc2xpY2UoMCwgaWR4KTtcbiAgICAgICAgcmV0dXJuIGRzdC5jb25jYXQoYXJyLnNsaWNlKGlkeCsxKSk7XG4gICAgfVxufTtcblxuLy8gVmlhOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS8xMTMzMTIyLzIxMjFjNjAxYzU1NDkxNTU0ODNmNTBiZTNkYTUzMDVlODNiOGM1ZGZcbnV0aWxzLmlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHt9LnRvU3RyaW5nLmNhbGwodmFsdWUpLmluZGV4T2YoJ0FycmF5JykgPj0gMFxufTtcblxudXRpbHMuZGVsYXkgPSBmdW5jdGlvbih0LCBmdW4pIHtcbiAgICBpZih0eXBlb2YgdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmdW4gPSB0O1xuICAgICAgICB0ID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCB0KTtcbn07XG5cblxuLy8gQ2hhcnMgd29ydGggZXNjYXBpbmcsIGFzIGRlZmluZWQgYnkgRG91Z2xhcyBDcm9ja2ZvcmQ6XG4vLyAgIGh0dHBzOi8vZ2l0aHViLmNvbS9kb3VnbGFzY3JvY2tmb3JkL0pTT04tanMvYmxvYi80N2E5ODgyY2RkZWIxZTg1MjllMDdhZjk3MzYyMTgwNzUzNzJiOGFjL2pzb24yLmpzI0wxOTZcbnZhciBqc29uX2VzY2FwYWJsZSA9IC9bXFxcXFxcXCJcXHgwMC1cXHgxZlxceDdmLVxceDlmXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAganNvbl9sb29rdXAgPSB7XG5cIlxcdTAwMDBcIjpcIlxcXFx1MDAwMFwiLFwiXFx1MDAwMVwiOlwiXFxcXHUwMDAxXCIsXCJcXHUwMDAyXCI6XCJcXFxcdTAwMDJcIixcIlxcdTAwMDNcIjpcIlxcXFx1MDAwM1wiLFxuXCJcXHUwMDA0XCI6XCJcXFxcdTAwMDRcIixcIlxcdTAwMDVcIjpcIlxcXFx1MDAwNVwiLFwiXFx1MDAwNlwiOlwiXFxcXHUwMDA2XCIsXCJcXHUwMDA3XCI6XCJcXFxcdTAwMDdcIixcblwiXFxiXCI6XCJcXFxcYlwiLFwiXFx0XCI6XCJcXFxcdFwiLFwiXFxuXCI6XCJcXFxcblwiLFwiXFx1MDAwYlwiOlwiXFxcXHUwMDBiXCIsXCJcXGZcIjpcIlxcXFxmXCIsXCJcXHJcIjpcIlxcXFxyXCIsXG5cIlxcdTAwMGVcIjpcIlxcXFx1MDAwZVwiLFwiXFx1MDAwZlwiOlwiXFxcXHUwMDBmXCIsXCJcXHUwMDEwXCI6XCJcXFxcdTAwMTBcIixcIlxcdTAwMTFcIjpcIlxcXFx1MDAxMVwiLFxuXCJcXHUwMDEyXCI6XCJcXFxcdTAwMTJcIixcIlxcdTAwMTNcIjpcIlxcXFx1MDAxM1wiLFwiXFx1MDAxNFwiOlwiXFxcXHUwMDE0XCIsXCJcXHUwMDE1XCI6XCJcXFxcdTAwMTVcIixcblwiXFx1MDAxNlwiOlwiXFxcXHUwMDE2XCIsXCJcXHUwMDE3XCI6XCJcXFxcdTAwMTdcIixcIlxcdTAwMThcIjpcIlxcXFx1MDAxOFwiLFwiXFx1MDAxOVwiOlwiXFxcXHUwMDE5XCIsXG5cIlxcdTAwMWFcIjpcIlxcXFx1MDAxYVwiLFwiXFx1MDAxYlwiOlwiXFxcXHUwMDFiXCIsXCJcXHUwMDFjXCI6XCJcXFxcdTAwMWNcIixcIlxcdTAwMWRcIjpcIlxcXFx1MDAxZFwiLFxuXCJcXHUwMDFlXCI6XCJcXFxcdTAwMWVcIixcIlxcdTAwMWZcIjpcIlxcXFx1MDAxZlwiLFwiXFxcIlwiOlwiXFxcXFxcXCJcIixcIlxcXFxcIjpcIlxcXFxcXFxcXCIsXG5cIlxcdTAwN2ZcIjpcIlxcXFx1MDA3ZlwiLFwiXFx1MDA4MFwiOlwiXFxcXHUwMDgwXCIsXCJcXHUwMDgxXCI6XCJcXFxcdTAwODFcIixcIlxcdTAwODJcIjpcIlxcXFx1MDA4MlwiLFxuXCJcXHUwMDgzXCI6XCJcXFxcdTAwODNcIixcIlxcdTAwODRcIjpcIlxcXFx1MDA4NFwiLFwiXFx1MDA4NVwiOlwiXFxcXHUwMDg1XCIsXCJcXHUwMDg2XCI6XCJcXFxcdTAwODZcIixcblwiXFx1MDA4N1wiOlwiXFxcXHUwMDg3XCIsXCJcXHUwMDg4XCI6XCJcXFxcdTAwODhcIixcIlxcdTAwODlcIjpcIlxcXFx1MDA4OVwiLFwiXFx1MDA4YVwiOlwiXFxcXHUwMDhhXCIsXG5cIlxcdTAwOGJcIjpcIlxcXFx1MDA4YlwiLFwiXFx1MDA4Y1wiOlwiXFxcXHUwMDhjXCIsXCJcXHUwMDhkXCI6XCJcXFxcdTAwOGRcIixcIlxcdTAwOGVcIjpcIlxcXFx1MDA4ZVwiLFxuXCJcXHUwMDhmXCI6XCJcXFxcdTAwOGZcIixcIlxcdTAwOTBcIjpcIlxcXFx1MDA5MFwiLFwiXFx1MDA5MVwiOlwiXFxcXHUwMDkxXCIsXCJcXHUwMDkyXCI6XCJcXFxcdTAwOTJcIixcblwiXFx1MDA5M1wiOlwiXFxcXHUwMDkzXCIsXCJcXHUwMDk0XCI6XCJcXFxcdTAwOTRcIixcIlxcdTAwOTVcIjpcIlxcXFx1MDA5NVwiLFwiXFx1MDA5NlwiOlwiXFxcXHUwMDk2XCIsXG5cIlxcdTAwOTdcIjpcIlxcXFx1MDA5N1wiLFwiXFx1MDA5OFwiOlwiXFxcXHUwMDk4XCIsXCJcXHUwMDk5XCI6XCJcXFxcdTAwOTlcIixcIlxcdTAwOWFcIjpcIlxcXFx1MDA5YVwiLFxuXCJcXHUwMDliXCI6XCJcXFxcdTAwOWJcIixcIlxcdTAwOWNcIjpcIlxcXFx1MDA5Y1wiLFwiXFx1MDA5ZFwiOlwiXFxcXHUwMDlkXCIsXCJcXHUwMDllXCI6XCJcXFxcdTAwOWVcIixcblwiXFx1MDA5ZlwiOlwiXFxcXHUwMDlmXCIsXCJcXHUwMGFkXCI6XCJcXFxcdTAwYWRcIixcIlxcdTA2MDBcIjpcIlxcXFx1MDYwMFwiLFwiXFx1MDYwMVwiOlwiXFxcXHUwNjAxXCIsXG5cIlxcdTA2MDJcIjpcIlxcXFx1MDYwMlwiLFwiXFx1MDYwM1wiOlwiXFxcXHUwNjAzXCIsXCJcXHUwNjA0XCI6XCJcXFxcdTA2MDRcIixcIlxcdTA3MGZcIjpcIlxcXFx1MDcwZlwiLFxuXCJcXHUxN2I0XCI6XCJcXFxcdTE3YjRcIixcIlxcdTE3YjVcIjpcIlxcXFx1MTdiNVwiLFwiXFx1MjAwY1wiOlwiXFxcXHUyMDBjXCIsXCJcXHUyMDBkXCI6XCJcXFxcdTIwMGRcIixcblwiXFx1MjAwZVwiOlwiXFxcXHUyMDBlXCIsXCJcXHUyMDBmXCI6XCJcXFxcdTIwMGZcIixcIlxcdTIwMjhcIjpcIlxcXFx1MjAyOFwiLFwiXFx1MjAyOVwiOlwiXFxcXHUyMDI5XCIsXG5cIlxcdTIwMmFcIjpcIlxcXFx1MjAyYVwiLFwiXFx1MjAyYlwiOlwiXFxcXHUyMDJiXCIsXCJcXHUyMDJjXCI6XCJcXFxcdTIwMmNcIixcIlxcdTIwMmRcIjpcIlxcXFx1MjAyZFwiLFxuXCJcXHUyMDJlXCI6XCJcXFxcdTIwMmVcIixcIlxcdTIwMmZcIjpcIlxcXFx1MjAyZlwiLFwiXFx1MjA2MFwiOlwiXFxcXHUyMDYwXCIsXCJcXHUyMDYxXCI6XCJcXFxcdTIwNjFcIixcblwiXFx1MjA2MlwiOlwiXFxcXHUyMDYyXCIsXCJcXHUyMDYzXCI6XCJcXFxcdTIwNjNcIixcIlxcdTIwNjRcIjpcIlxcXFx1MjA2NFwiLFwiXFx1MjA2NVwiOlwiXFxcXHUyMDY1XCIsXG5cIlxcdTIwNjZcIjpcIlxcXFx1MjA2NlwiLFwiXFx1MjA2N1wiOlwiXFxcXHUyMDY3XCIsXCJcXHUyMDY4XCI6XCJcXFxcdTIwNjhcIixcIlxcdTIwNjlcIjpcIlxcXFx1MjA2OVwiLFxuXCJcXHUyMDZhXCI6XCJcXFxcdTIwNmFcIixcIlxcdTIwNmJcIjpcIlxcXFx1MjA2YlwiLFwiXFx1MjA2Y1wiOlwiXFxcXHUyMDZjXCIsXCJcXHUyMDZkXCI6XCJcXFxcdTIwNmRcIixcblwiXFx1MjA2ZVwiOlwiXFxcXHUyMDZlXCIsXCJcXHUyMDZmXCI6XCJcXFxcdTIwNmZcIixcIlxcdWZlZmZcIjpcIlxcXFx1ZmVmZlwiLFwiXFx1ZmZmMFwiOlwiXFxcXHVmZmYwXCIsXG5cIlxcdWZmZjFcIjpcIlxcXFx1ZmZmMVwiLFwiXFx1ZmZmMlwiOlwiXFxcXHVmZmYyXCIsXCJcXHVmZmYzXCI6XCJcXFxcdWZmZjNcIixcIlxcdWZmZjRcIjpcIlxcXFx1ZmZmNFwiLFxuXCJcXHVmZmY1XCI6XCJcXFxcdWZmZjVcIixcIlxcdWZmZjZcIjpcIlxcXFx1ZmZmNlwiLFwiXFx1ZmZmN1wiOlwiXFxcXHVmZmY3XCIsXCJcXHVmZmY4XCI6XCJcXFxcdWZmZjhcIixcblwiXFx1ZmZmOVwiOlwiXFxcXHVmZmY5XCIsXCJcXHVmZmZhXCI6XCJcXFxcdWZmZmFcIixcIlxcdWZmZmJcIjpcIlxcXFx1ZmZmYlwiLFwiXFx1ZmZmY1wiOlwiXFxcXHVmZmZjXCIsXG5cIlxcdWZmZmRcIjpcIlxcXFx1ZmZmZFwiLFwiXFx1ZmZmZVwiOlwiXFxcXHVmZmZlXCIsXCJcXHVmZmZmXCI6XCJcXFxcdWZmZmZcIn07XG5cbi8vIFNvbWUgZXh0cmEgY2hhcmFjdGVycyB0aGF0IENocm9tZSBnZXRzIHdyb25nLCBhbmQgc3Vic3RpdHV0ZXMgd2l0aFxuLy8gc29tZXRoaW5nIGVsc2Ugb24gdGhlIHdpcmUuXG52YXIgZXh0cmFfZXNjYXBhYmxlID0gL1tcXHgwMC1cXHgxZlxcdWQ4MDAtXFx1ZGZmZlxcdWZmZmVcXHVmZmZmXFx1MDMwMC1cXHUwMzMzXFx1MDMzZC1cXHUwMzQ2XFx1MDM0YS1cXHUwMzRjXFx1MDM1MC1cXHUwMzUyXFx1MDM1Ny1cXHUwMzU4XFx1MDM1Yy1cXHUwMzYyXFx1MDM3NFxcdTAzN2VcXHUwMzg3XFx1MDU5MS1cXHUwNWFmXFx1MDVjNFxcdTA2MTAtXFx1MDYxN1xcdTA2NTMtXFx1MDY1NFxcdTA2NTctXFx1MDY1YlxcdTA2NWQtXFx1MDY1ZVxcdTA2ZGYtXFx1MDZlMlxcdTA2ZWItXFx1MDZlY1xcdTA3MzBcXHUwNzMyLVxcdTA3MzNcXHUwNzM1LVxcdTA3MzZcXHUwNzNhXFx1MDczZFxcdTA3M2YtXFx1MDc0MVxcdTA3NDNcXHUwNzQ1XFx1MDc0N1xcdTA3ZWItXFx1MDdmMVxcdTA5NTFcXHUwOTU4LVxcdTA5NWZcXHUwOWRjLVxcdTA5ZGRcXHUwOWRmXFx1MGEzM1xcdTBhMzZcXHUwYTU5LVxcdTBhNWJcXHUwYTVlXFx1MGI1Yy1cXHUwYjVkXFx1MGUzOC1cXHUwZTM5XFx1MGY0M1xcdTBmNGRcXHUwZjUyXFx1MGY1N1xcdTBmNWNcXHUwZjY5XFx1MGY3Mi1cXHUwZjc2XFx1MGY3OFxcdTBmODAtXFx1MGY4M1xcdTBmOTNcXHUwZjlkXFx1MGZhMlxcdTBmYTdcXHUwZmFjXFx1MGZiOVxcdTE5MzktXFx1MTkzYVxcdTFhMTdcXHUxYjZiXFx1MWNkYS1cXHUxY2RiXFx1MWRjMC1cXHUxZGNmXFx1MWRmY1xcdTFkZmVcXHUxZjcxXFx1MWY3M1xcdTFmNzVcXHUxZjc3XFx1MWY3OVxcdTFmN2JcXHUxZjdkXFx1MWZiYlxcdTFmYmVcXHUxZmM5XFx1MWZjYlxcdTFmZDNcXHUxZmRiXFx1MWZlM1xcdTFmZWJcXHUxZmVlLVxcdTFmZWZcXHUxZmY5XFx1MWZmYlxcdTFmZmRcXHUyMDAwLVxcdTIwMDFcXHUyMGQwLVxcdTIwZDFcXHUyMGQ0LVxcdTIwZDdcXHUyMGU3LVxcdTIwZTlcXHUyMTI2XFx1MjEyYS1cXHUyMTJiXFx1MjMyOS1cXHUyMzJhXFx1MmFkY1xcdTMwMmItXFx1MzAyY1xcdWFhYjItXFx1YWFiM1xcdWY5MDAtXFx1ZmEwZFxcdWZhMTBcXHVmYTEyXFx1ZmExNS1cXHVmYTFlXFx1ZmEyMFxcdWZhMjJcXHVmYTI1LVxcdWZhMjZcXHVmYTJhLVxcdWZhMmRcXHVmYTMwLVxcdWZhNmRcXHVmYTcwLVxcdWZhZDlcXHVmYjFkXFx1ZmIxZlxcdWZiMmEtXFx1ZmIzNlxcdWZiMzgtXFx1ZmIzY1xcdWZiM2VcXHVmYjQwLVxcdWZiNDFcXHVmYjQzLVxcdWZiNDRcXHVmYjQ2LVxcdWZiNGVcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAgZXh0cmFfbG9va3VwO1xuXG4vLyBKU09OIFF1b3RlIHN0cmluZy4gVXNlIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiB3aGVuIHBvc3NpYmxlLlxudmFyIEpTT05RdW90ZSA9IChKU09OICYmIEpTT04uc3RyaW5naWZ5KSB8fCBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICBqc29uX2VzY2FwYWJsZS5sYXN0SW5kZXggPSAwO1xuICAgIGlmIChqc29uX2VzY2FwYWJsZS50ZXN0KHN0cmluZykpIHtcbiAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UoanNvbl9lc2NhcGFibGUsIGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgICAgIHJldHVybiBqc29uX2xvb2t1cFthXTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiAnXCInICsgc3RyaW5nICsgJ1wiJztcbn07XG5cbi8vIFRoaXMgbWF5IGJlIHF1aXRlIHNsb3csIHNvIGxldCdzIGRlbGF5IHVudGlsIHVzZXIgYWN0dWFsbHkgdXNlcyBiYWRcbi8vIGNoYXJhY3RlcnMuXG52YXIgdW5yb2xsX2xvb2t1cCA9IGZ1bmN0aW9uKGVzY2FwYWJsZSkge1xuICAgIHZhciBpO1xuICAgIHZhciB1bnJvbGxlZCA9IHt9XG4gICAgdmFyIGMgPSBbXVxuICAgIGZvcihpPTA7IGk8NjU1MzY7IGkrKykge1xuICAgICAgICBjLnB1c2goIFN0cmluZy5mcm9tQ2hhckNvZGUoaSkgKTtcbiAgICB9XG4gICAgZXNjYXBhYmxlLmxhc3RJbmRleCA9IDA7XG4gICAgYy5qb2luKCcnKS5yZXBsYWNlKGVzY2FwYWJsZSwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgdW5yb2xsZWRbIGEgXSA9ICdcXFxcdScgKyAoJzAwMDAnICsgYS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTQpO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfSk7XG4gICAgZXNjYXBhYmxlLmxhc3RJbmRleCA9IDA7XG4gICAgcmV0dXJuIHVucm9sbGVkO1xufTtcblxuLy8gUXVvdGUgc3RyaW5nLCBhbHNvIHRha2luZyBjYXJlIG9mIHVuaWNvZGUgY2hhcmFjdGVycyB0aGF0IGJyb3dzZXJzXG4vLyBvZnRlbiBicmVhay4gRXNwZWNpYWxseSwgdGFrZSBjYXJlIG9mIHVuaWNvZGUgc3Vycm9nYXRlczpcbi8vICAgIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTWFwcGluZ19vZl9Vbmljb2RlX2NoYXJhY3RlcnMjU3Vycm9nYXRlc1xudXRpbHMucXVvdGUgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICB2YXIgcXVvdGVkID0gSlNPTlF1b3RlKHN0cmluZyk7XG5cbiAgICAvLyBJbiBtb3N0IGNhc2VzIHRoaXMgc2hvdWxkIGJlIHZlcnkgZmFzdCBhbmQgZ29vZCBlbm91Z2guXG4gICAgZXh0cmFfZXNjYXBhYmxlLmxhc3RJbmRleCA9IDA7XG4gICAgaWYoIWV4dHJhX2VzY2FwYWJsZS50ZXN0KHF1b3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIHF1b3RlZDtcbiAgICB9XG5cbiAgICBpZighZXh0cmFfbG9va3VwKSBleHRyYV9sb29rdXAgPSB1bnJvbGxfbG9va3VwKGV4dHJhX2VzY2FwYWJsZSk7XG5cbiAgICByZXR1cm4gcXVvdGVkLnJlcGxhY2UoZXh0cmFfZXNjYXBhYmxlLCBmdW5jdGlvbihhKSB7XG4gICAgICAgIHJldHVybiBleHRyYV9sb29rdXBbYV07XG4gICAgfSk7XG59XG5cbnZhciBfYWxsX3Byb3RvY29scyA9IFsnd2Vic29ja2V0JyxcbiAgICAgICAgICAgICAgICAgICAgICAneGRyLXN0cmVhbWluZycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3hoci1zdHJlYW1pbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICdpZnJhbWUtZXZlbnRzb3VyY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICdpZnJhbWUtaHRtbGZpbGUnLFxuICAgICAgICAgICAgICAgICAgICAgICd4ZHItcG9sbGluZycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3hoci1wb2xsaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAnaWZyYW1lLXhoci1wb2xsaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAnanNvbnAtcG9sbGluZyddO1xuXG51dGlscy5wcm9iZVByb3RvY29scyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcm9iZWQgPSB7fTtcbiAgICBmb3IodmFyIGk9MDsgaTxfYWxsX3Byb3RvY29scy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcHJvdG9jb2wgPSBfYWxsX3Byb3RvY29sc1tpXTtcbiAgICAgICAgLy8gVXNlciBjYW4gaGF2ZSBhIHR5cG8gaW4gcHJvdG9jb2wgbmFtZS5cbiAgICAgICAgcHJvYmVkW3Byb3RvY29sXSA9IFNvY2tKU1twcm90b2NvbF0gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFNvY2tKU1twcm90b2NvbF0uZW5hYmxlZCgpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvYmVkO1xufTtcblxudXRpbHMuZGV0ZWN0UHJvdG9jb2xzID0gZnVuY3Rpb24ocHJvYmVkLCBwcm90b2NvbHNfd2hpdGVsaXN0LCBpbmZvKSB7XG4gICAgdmFyIHBlID0ge30sXG4gICAgICAgIHByb3RvY29scyA9IFtdO1xuICAgIGlmICghcHJvdG9jb2xzX3doaXRlbGlzdCkgcHJvdG9jb2xzX3doaXRlbGlzdCA9IF9hbGxfcHJvdG9jb2xzO1xuICAgIGZvcih2YXIgaT0wOyBpPHByb3RvY29sc193aGl0ZWxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHByb3RvY29sID0gcHJvdG9jb2xzX3doaXRlbGlzdFtpXTtcbiAgICAgICAgcGVbcHJvdG9jb2xdID0gcHJvYmVkW3Byb3RvY29sXTtcbiAgICB9XG4gICAgdmFyIG1heWJlX3B1c2ggPSBmdW5jdGlvbihwcm90b3MpIHtcbiAgICAgICAgdmFyIHByb3RvID0gcHJvdG9zLnNoaWZ0KCk7XG4gICAgICAgIGlmIChwZVtwcm90b10pIHtcbiAgICAgICAgICAgIHByb3RvY29scy5wdXNoKHByb3RvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChwcm90b3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIG1heWJlX3B1c2gocHJvdG9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIDEuIFdlYnNvY2tldFxuICAgIGlmIChpbmZvLndlYnNvY2tldCAhPT0gZmFsc2UpIHtcbiAgICAgICAgbWF5YmVfcHVzaChbJ3dlYnNvY2tldCddKTtcbiAgICB9XG5cbiAgICAvLyAyLiBTdHJlYW1pbmdcbiAgICBpZiAocGVbJ3hoci1zdHJlYW1pbmcnXSAmJiAhaW5mby5udWxsX29yaWdpbikge1xuICAgICAgICBwcm90b2NvbHMucHVzaCgneGhyLXN0cmVhbWluZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwZVsneGRyLXN0cmVhbWluZyddICYmICFpbmZvLmNvb2tpZV9uZWVkZWQgJiYgIWluZm8ubnVsbF9vcmlnaW4pIHtcbiAgICAgICAgICAgIHByb3RvY29scy5wdXNoKCd4ZHItc3RyZWFtaW5nJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYXliZV9wdXNoKFsnaWZyYW1lLWV2ZW50c291cmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdpZnJhbWUtaHRtbGZpbGUnXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAzLiBQb2xsaW5nXG4gICAgaWYgKHBlWyd4aHItcG9sbGluZyddICYmICFpbmZvLm51bGxfb3JpZ2luKSB7XG4gICAgICAgIHByb3RvY29scy5wdXNoKCd4aHItcG9sbGluZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwZVsneGRyLXBvbGxpbmcnXSAmJiAhaW5mby5jb29raWVfbmVlZGVkICYmICFpbmZvLm51bGxfb3JpZ2luKSB7XG4gICAgICAgICAgICBwcm90b2NvbHMucHVzaCgneGRyLXBvbGxpbmcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1heWJlX3B1c2goWydpZnJhbWUteGhyLXBvbGxpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2pzb25wLXBvbGxpbmcnXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHByb3RvY29scztcbn1cbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdXRpbHMuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL2RvbS5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLy8gTWF5IGJlIHVzZWQgYnkgaHRtbGZpbGUganNvbnAgYW5kIHRyYW5zcG9ydHMuXG52YXIgTVByZWZpeCA9ICdfc29ja2pzX2dsb2JhbCc7XG51dGlscy5jcmVhdGVIb29rID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHdpbmRvd19pZCA9ICdhJyArIHV0aWxzLnJhbmRvbV9zdHJpbmcoOCk7XG4gICAgaWYgKCEoTVByZWZpeCBpbiBfd2luZG93KSkge1xuICAgICAgICB2YXIgbWFwID0ge307XG4gICAgICAgIF93aW5kb3dbTVByZWZpeF0gPSBmdW5jdGlvbih3aW5kb3dfaWQpIHtcbiAgICAgICAgICAgIGlmICghKHdpbmRvd19pZCBpbiBtYXApKSB7XG4gICAgICAgICAgICAgICAgbWFwW3dpbmRvd19pZF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiB3aW5kb3dfaWQsXG4gICAgICAgICAgICAgICAgICAgIGRlbDogZnVuY3Rpb24oKSB7ZGVsZXRlIG1hcFt3aW5kb3dfaWRdO31cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1hcFt3aW5kb3dfaWRdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfd2luZG93W01QcmVmaXhdKHdpbmRvd19pZCk7XG59O1xuXG5cblxudXRpbHMuYXR0YWNoTWVzc2FnZSA9IGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgdXRpbHMuYXR0YWNoRXZlbnQoJ21lc3NhZ2UnLCBsaXN0ZW5lcik7XG59O1xudXRpbHMuYXR0YWNoRXZlbnQgPSBmdW5jdGlvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIF93aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgX3dpbmRvdy5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lciwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElFIHF1aXJrcy5cbiAgICAgICAgLy8gQWNjb3JkaW5nIHRvOiBodHRwOi8vc3RldmVzb3VkZXJzLmNvbS9taXNjL3Rlc3QtcG9zdG1lc3NhZ2UucGhwXG4gICAgICAgIC8vIHRoZSBtZXNzYWdlIGdldHMgZGVsaXZlcmVkIG9ubHkgdG8gJ2RvY3VtZW50Jywgbm90ICd3aW5kb3cnLlxuICAgICAgICBfZG9jdW1lbnQuYXR0YWNoRXZlbnQoXCJvblwiICsgZXZlbnQsIGxpc3RlbmVyKTtcbiAgICAgICAgLy8gSSBnZXQgJ3dpbmRvdycgZm9yIGllOC5cbiAgICAgICAgX3dpbmRvdy5hdHRhY2hFdmVudChcIm9uXCIgKyBldmVudCwgbGlzdGVuZXIpO1xuICAgIH1cbn07XG5cbnV0aWxzLmRldGFjaE1lc3NhZ2UgPSBmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgIHV0aWxzLmRldGFjaEV2ZW50KCdtZXNzYWdlJywgbGlzdGVuZXIpO1xufTtcbnV0aWxzLmRldGFjaEV2ZW50ID0gZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBfd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIF93aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBfZG9jdW1lbnQuZGV0YWNoRXZlbnQoXCJvblwiICsgZXZlbnQsIGxpc3RlbmVyKTtcbiAgICAgICAgX3dpbmRvdy5kZXRhY2hFdmVudChcIm9uXCIgKyBldmVudCwgbGlzdGVuZXIpO1xuICAgIH1cbn07XG5cblxudmFyIG9uX3VubG9hZCA9IHt9O1xuLy8gVGhpbmdzIHJlZ2lzdGVyZWQgYWZ0ZXIgYmVmb3JldW5sb2FkIGFyZSB0byBiZSBjYWxsZWQgaW1tZWRpYXRlbHkuXG52YXIgYWZ0ZXJfdW5sb2FkID0gZmFsc2U7XG5cbnZhciB0cmlnZ2VyX3VubG9hZF9jYWxsYmFja3MgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IodmFyIHJlZiBpbiBvbl91bmxvYWQpIHtcbiAgICAgICAgb25fdW5sb2FkW3JlZl0oKTtcbiAgICAgICAgZGVsZXRlIG9uX3VubG9hZFtyZWZdO1xuICAgIH07XG59O1xuXG52YXIgdW5sb2FkX3RyaWdnZXJlZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmKGFmdGVyX3VubG9hZCkgcmV0dXJuO1xuICAgIGFmdGVyX3VubG9hZCA9IHRydWU7XG4gICAgdHJpZ2dlcl91bmxvYWRfY2FsbGJhY2tzKCk7XG59O1xuXG4vLyBPbmJlZm9yZXVubG9hZCBhbG9uZSBpcyBub3QgcmVsaWFibGUuIFdlIGNvdWxkIHVzZSBvbmx5ICd1bmxvYWQnXG4vLyBidXQgaXQncyBub3Qgd29ya2luZyBpbiBvcGVyYSB3aXRoaW4gYW4gaWZyYW1lLiBMZXQncyB1c2UgYm90aC5cbnV0aWxzLmF0dGFjaEV2ZW50KCdiZWZvcmV1bmxvYWQnLCB1bmxvYWRfdHJpZ2dlcmVkKTtcbnV0aWxzLmF0dGFjaEV2ZW50KCd1bmxvYWQnLCB1bmxvYWRfdHJpZ2dlcmVkKTtcblxudXRpbHMudW5sb2FkX2FkZCA9IGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgdmFyIHJlZiA9IHV0aWxzLnJhbmRvbV9zdHJpbmcoOCk7XG4gICAgb25fdW5sb2FkW3JlZl0gPSBsaXN0ZW5lcjtcbiAgICBpZiAoYWZ0ZXJfdW5sb2FkKSB7XG4gICAgICAgIHV0aWxzLmRlbGF5KHRyaWdnZXJfdW5sb2FkX2NhbGxiYWNrcyk7XG4gICAgfVxuICAgIHJldHVybiByZWY7XG59O1xudXRpbHMudW5sb2FkX2RlbCA9IGZ1bmN0aW9uKHJlZikge1xuICAgIGlmIChyZWYgaW4gb25fdW5sb2FkKVxuICAgICAgICBkZWxldGUgb25fdW5sb2FkW3JlZl07XG59O1xuXG5cbnV0aWxzLmNyZWF0ZUlmcmFtZSA9IGZ1bmN0aW9uIChpZnJhbWVfdXJsLCBlcnJvcl9jYWxsYmFjaykge1xuICAgIHZhciBpZnJhbWUgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgdmFyIHRyZWYsIHVubG9hZF9yZWY7XG4gICAgdmFyIHVuYXR0YWNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0cmVmKTtcbiAgICAgICAgLy8gRXhwbG9yZXIgaGFkIHByb2JsZW1zIHdpdGggdGhhdC5cbiAgICAgICAgdHJ5IHtpZnJhbWUub25sb2FkID0gbnVsbDt9IGNhdGNoICh4KSB7fVxuICAgICAgICBpZnJhbWUub25lcnJvciA9IG51bGw7XG4gICAgfTtcbiAgICB2YXIgY2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoaWZyYW1lKSB7XG4gICAgICAgICAgICB1bmF0dGFjaCgpO1xuICAgICAgICAgICAgLy8gVGhpcyB0aW1lb3V0IG1ha2VzIGNocm9tZSBmaXJlIG9uYmVmb3JldW5sb2FkIGV2ZW50XG4gICAgICAgICAgICAvLyB3aXRoaW4gaWZyYW1lLiBXaXRob3V0IHRoZSB0aW1lb3V0IGl0IGdvZXMgc3RyYWlnaHQgdG9cbiAgICAgICAgICAgIC8vIG9udW5sb2FkLlxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZihpZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWZyYW1lID0gbnVsbDtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgdXRpbHMudW5sb2FkX2RlbCh1bmxvYWRfcmVmKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIG9uZXJyb3IgPSBmdW5jdGlvbihyKSB7XG4gICAgICAgIGlmIChpZnJhbWUpIHtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIGVycm9yX2NhbGxiYWNrKHIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgcG9zdCA9IGZ1bmN0aW9uKG1zZywgb3JpZ2luKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgbm90IGxvYWRlZCwgSUUgcmFpc2VzIGFuIGV4Y2VwdGlvblxuICAgICAgICAgICAgLy8gb24gJ2NvbnRlbnRXaW5kb3cnLlxuICAgICAgICAgICAgaWYgKGlmcmFtZSAmJiBpZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKG1zZywgb3JpZ2luKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoeCkge307XG4gICAgfTtcblxuICAgIGlmcmFtZS5zcmMgPSBpZnJhbWVfdXJsO1xuICAgIGlmcmFtZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGlmcmFtZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgaWZyYW1lLm9uZXJyb3IgPSBmdW5jdGlvbigpe29uZXJyb3IoJ29uZXJyb3InKTt9O1xuICAgIGlmcmFtZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gYG9ubG9hZGAgaXMgdHJpZ2dlcmVkIGJlZm9yZSBzY3JpcHRzIG9uIHRoZSBpZnJhbWUgYXJlXG4gICAgICAgIC8vIGV4ZWN1dGVkLiBHaXZlIGl0IGZldyBzZWNvbmRzIHRvIGFjdHVhbGx5IGxvYWQgc3R1ZmYuXG4gICAgICAgIGNsZWFyVGltZW91dCh0cmVmKTtcbiAgICAgICAgdHJlZiA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtvbmVycm9yKCdvbmxvYWQgdGltZW91dCcpO30sIDIwMDApO1xuICAgIH07XG4gICAgX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICB0cmVmID0gc2V0VGltZW91dChmdW5jdGlvbigpe29uZXJyb3IoJ3RpbWVvdXQnKTt9LCAxNTAwMCk7XG4gICAgdW5sb2FkX3JlZiA9IHV0aWxzLnVubG9hZF9hZGQoY2xlYW51cCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcG9zdDogcG9zdCxcbiAgICAgICAgY2xlYW51cDogY2xlYW51cCxcbiAgICAgICAgbG9hZGVkOiB1bmF0dGFjaFxuICAgIH07XG59O1xuXG51dGlscy5jcmVhdGVIdG1sZmlsZSA9IGZ1bmN0aW9uIChpZnJhbWVfdXJsLCBlcnJvcl9jYWxsYmFjaykge1xuICAgIHZhciBkb2MgPSBuZXcgQWN0aXZlWE9iamVjdCgnaHRtbGZpbGUnKTtcbiAgICB2YXIgdHJlZiwgdW5sb2FkX3JlZjtcbiAgICB2YXIgaWZyYW1lO1xuICAgIHZhciB1bmF0dGFjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodHJlZik7XG4gICAgfTtcbiAgICB2YXIgY2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgICB1bmF0dGFjaCgpO1xuICAgICAgICAgICAgdXRpbHMudW5sb2FkX2RlbCh1bmxvYWRfcmVmKTtcbiAgICAgICAgICAgIGlmcmFtZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlmcmFtZSk7XG4gICAgICAgICAgICBpZnJhbWUgPSBkb2MgPSBudWxsO1xuICAgICAgICAgICAgQ29sbGVjdEdhcmJhZ2UoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIG9uZXJyb3IgPSBmdW5jdGlvbihyKSAge1xuICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICBlcnJvcl9jYWxsYmFjayhyKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIHBvc3QgPSBmdW5jdGlvbihtc2csIG9yaWdpbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB0aGUgaWZyYW1lIGlzIG5vdCBsb2FkZWQsIElFIHJhaXNlcyBhbiBleGNlcHRpb25cbiAgICAgICAgICAgIC8vIG9uICdjb250ZW50V2luZG93Jy5cbiAgICAgICAgICAgIGlmIChpZnJhbWUgJiYgaWZyYW1lLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgICAgICAgICBpZnJhbWUuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZShtc2csIG9yaWdpbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKHgpIHt9O1xuICAgIH07XG5cbiAgICBkb2Mub3BlbigpO1xuICAgIGRvYy53cml0ZSgnPGh0bWw+PHMnICsgJ2NyaXB0PicgK1xuICAgICAgICAgICAgICAnZG9jdW1lbnQuZG9tYWluPVwiJyArIGRvY3VtZW50LmRvbWFpbiArICdcIjsnICtcbiAgICAgICAgICAgICAgJzwvcycgKyAnY3JpcHQ+PC9odG1sPicpO1xuICAgIGRvYy5jbG9zZSgpO1xuICAgIGRvYy5wYXJlbnRXaW5kb3dbV1ByZWZpeF0gPSBfd2luZG93W1dQcmVmaXhdO1xuICAgIHZhciBjID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRvYy5ib2R5LmFwcGVuZENoaWxkKGMpO1xuICAgIGlmcmFtZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICBjLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgaWZyYW1lLnNyYyA9IGlmcmFtZV91cmw7XG4gICAgdHJlZiA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtvbmVycm9yKCd0aW1lb3V0Jyk7fSwgMTUwMDApO1xuICAgIHVubG9hZF9yZWYgPSB1dGlscy51bmxvYWRfYWRkKGNsZWFudXApO1xuICAgIHJldHVybiB7XG4gICAgICAgIHBvc3Q6IHBvc3QsXG4gICAgICAgIGNsZWFudXA6IGNsZWFudXAsXG4gICAgICAgIGxvYWRlZDogdW5hdHRhY2hcbiAgICB9O1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvZG9tLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi9kb20yLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgQWJzdHJhY3RYSFJPYmplY3QgPSBmdW5jdGlvbigpe307XG5BYnN0cmFjdFhIUk9iamVjdC5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKFsnY2h1bmsnLCAnZmluaXNoJ10pO1xuXG5BYnN0cmFjdFhIUk9iamVjdC5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24obWV0aG9kLCB1cmwsIHBheWxvYWQsIG9wdHMpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0cnkge1xuICAgICAgICB0aGF0LnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIH0gY2F0Y2goeCkge307XG5cbiAgICBpZiAoIXRoYXQueGhyKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGF0LnhociA9IG5ldyBfd2luZG93LkFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7XG4gICAgICAgIH0gY2F0Y2goeCkge307XG4gICAgfVxuICAgIGlmIChfd2luZG93LkFjdGl2ZVhPYmplY3QgfHwgX3dpbmRvdy5YRG9tYWluUmVxdWVzdCkge1xuICAgICAgICAvLyBJRTggY2FjaGVzIGV2ZW4gUE9TVHNcbiAgICAgICAgdXJsICs9ICgodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gJz8nIDogJyYnKSArICd0PScrKCtuZXcgRGF0ZSk7XG4gICAgfVxuXG4gICAgLy8gRXhwbG9yZXIgdGVuZHMgdG8ga2VlcCBjb25uZWN0aW9uIG9wZW4sIGV2ZW4gYWZ0ZXIgdGhlXG4gICAgLy8gdGFiIGdldHMgY2xvc2VkOiBodHRwOi8vYnVncy5qcXVlcnkuY29tL3RpY2tldC81MjgwXG4gICAgdGhhdC51bmxvYWRfcmVmID0gdXRpbHMudW5sb2FkX2FkZChmdW5jdGlvbigpe3RoYXQuX2NsZWFudXAodHJ1ZSk7fSk7XG4gICAgdHJ5IHtcbiAgICAgICAgdGhhdC54aHIub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAgIC8vIElFIHJhaXNlcyBhbiBleGNlcHRpb24gb24gd3JvbmcgcG9ydC5cbiAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCAwLCAnJyk7XG4gICAgICAgIHRoYXQuX2NsZWFudXAoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH07XG5cbiAgICBpZiAoIW9wdHMgfHwgIW9wdHMubm9fY3JlZGVudGlhbHMpIHtcbiAgICAgICAgLy8gTW96aWxsYSBkb2NzIHNheXMgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vWE1MSHR0cFJlcXVlc3QgOlxuICAgICAgICAvLyBcIlRoaXMgbmV2ZXIgYWZmZWN0cyBzYW1lLXNpdGUgcmVxdWVzdHMuXCJcbiAgICAgICAgdGhhdC54aHIud2l0aENyZWRlbnRpYWxzID0gJ3RydWUnO1xuICAgIH1cbiAgICBpZiAob3B0cyAmJiBvcHRzLmhlYWRlcnMpIHtcbiAgICAgICAgZm9yKHZhciBrZXkgaW4gb3B0cy5oZWFkZXJzKSB7XG4gICAgICAgICAgICB0aGF0Lnhoci5zZXRSZXF1ZXN0SGVhZGVyKGtleSwgb3B0cy5oZWFkZXJzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhhdC54aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGF0Lnhocikge1xuICAgICAgICAgICAgdmFyIHggPSB0aGF0LnhocjtcbiAgICAgICAgICAgIHN3aXRjaCAoeC5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgLy8gSUUgZG9lc24ndCBsaWtlIHBlZWtpbmcgaW50byByZXNwb25zZVRleHQgb3Igc3RhdHVzXG4gICAgICAgICAgICAgICAgLy8gb24gTWljcm9zb2Z0LlhNTEhUVFAgYW5kIHJlYWR5c3RhdGU9M1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGF0dXMgPSB4LnN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRleHQgPSB4LnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICB9IGNhdGNoICh4KSB7fTtcbiAgICAgICAgICAgICAgICAvLyBJRSBkb2VzIHJldHVybiByZWFkeXN0YXRlID09IDMgZm9yIDQwNCBhbnN3ZXJzLlxuICAgICAgICAgICAgICAgIGlmICh0ZXh0ICYmIHRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ2NodW5rJywgc3RhdHVzLCB0ZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCB4LnN0YXR1cywgeC5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgIHRoYXQuX2NsZWFudXAoZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGF0Lnhoci5zZW5kKHBheWxvYWQpO1xufTtcblxuQWJzdHJhY3RYSFJPYmplY3QucHJvdG90eXBlLl9jbGVhbnVwID0gZnVuY3Rpb24oYWJvcnQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKCF0aGF0LnhocikgcmV0dXJuO1xuICAgIHV0aWxzLnVubG9hZF9kZWwodGhhdC51bmxvYWRfcmVmKTtcblxuICAgIC8vIElFIG5lZWRzIHRoaXMgZmllbGQgdG8gYmUgYSBmdW5jdGlvblxuICAgIHRoYXQueGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCl7fTtcblxuICAgIGlmIChhYm9ydCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhhdC54aHIuYWJvcnQoKTtcbiAgICAgICAgfSBjYXRjaCh4KSB7fTtcbiAgICB9XG4gICAgdGhhdC51bmxvYWRfcmVmID0gdGhhdC54aHIgPSBudWxsO1xufTtcblxuQWJzdHJhY3RYSFJPYmplY3QucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQubnVrZSgpO1xuICAgIHRoYXQuX2NsZWFudXAodHJ1ZSk7XG59O1xuXG52YXIgWEhSQ29yc09iamVjdCA9IHV0aWxzLlhIUkNvcnNPYmplY3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgdXRpbHMuZGVsYXkoZnVuY3Rpb24oKXt0aGF0Ll9zdGFydC5hcHBseSh0aGF0LCBhcmdzKTt9KTtcbn07XG5YSFJDb3JzT2JqZWN0LnByb3RvdHlwZSA9IG5ldyBBYnN0cmFjdFhIUk9iamVjdCgpO1xuXG52YXIgWEhSTG9jYWxPYmplY3QgPSB1dGlscy5YSFJMb2NhbE9iamVjdCA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBwYXlsb2FkKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHV0aWxzLmRlbGF5KGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoYXQuX3N0YXJ0KG1ldGhvZCwgdXJsLCBwYXlsb2FkLCB7XG4gICAgICAgICAgICBub19jcmVkZW50aWFsczogdHJ1ZVxuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5YSFJMb2NhbE9iamVjdC5wcm90b3R5cGUgPSBuZXcgQWJzdHJhY3RYSFJPYmplY3QoKTtcblxuXG5cbi8vIFJlZmVyZW5jZXM6XG4vLyAgIGh0dHA6Ly9hamF4aWFuLmNvbS9hcmNoaXZlcy8xMDAtbGluZS1hamF4LXdyYXBwZXJcbi8vICAgaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2NjMjg4MDYwKHY9VlMuODUpLmFzcHhcbnZhciBYRFJPYmplY3QgPSB1dGlscy5YRFJPYmplY3QgPSBmdW5jdGlvbihtZXRob2QsIHVybCwgcGF5bG9hZCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB1dGlscy5kZWxheShmdW5jdGlvbigpe3RoYXQuX3N0YXJ0KG1ldGhvZCwgdXJsLCBwYXlsb2FkKTt9KTtcbn07XG5YRFJPYmplY3QucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcihbJ2NodW5rJywgJ2ZpbmlzaCddKTtcblhEUk9iamVjdC5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24obWV0aG9kLCB1cmwsIHBheWxvYWQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHhkciA9IG5ldyBYRG9tYWluUmVxdWVzdCgpO1xuICAgIC8vIElFIGNhY2hlcyBldmVuIFBPU1RzXG4gICAgdXJsICs9ICgodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gJz8nIDogJyYnKSArICd0PScrKCtuZXcgRGF0ZSk7XG5cbiAgICB2YXIgb25lcnJvciA9IHhkci5vbnRpbWVvdXQgPSB4ZHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIDAsICcnKTtcbiAgICAgICAgdGhhdC5fY2xlYW51cChmYWxzZSk7XG4gICAgfTtcbiAgICB4ZHIub25wcm9ncmVzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LmVtaXQoJ2NodW5rJywgMjAwLCB4ZHIucmVzcG9uc2VUZXh0KTtcbiAgICB9O1xuICAgIHhkci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCAyMDAsIHhkci5yZXNwb25zZVRleHQpO1xuICAgICAgICB0aGF0Ll9jbGVhbnVwKGZhbHNlKTtcbiAgICB9O1xuICAgIHRoYXQueGRyID0geGRyO1xuICAgIHRoYXQudW5sb2FkX3JlZiA9IHV0aWxzLnVubG9hZF9hZGQoZnVuY3Rpb24oKXt0aGF0Ll9jbGVhbnVwKHRydWUpO30pO1xuICAgIHRyeSB7XG4gICAgICAgIC8vIEZhaWxzIHdpdGggQWNjZXNzRGVuaWVkIGlmIHBvcnQgbnVtYmVyIGlzIGJvZ3VzXG4gICAgICAgIHRoYXQueGRyLm9wZW4obWV0aG9kLCB1cmwpO1xuICAgICAgICB0aGF0Lnhkci5zZW5kKHBheWxvYWQpO1xuICAgIH0gY2F0Y2goeCkge1xuICAgICAgICBvbmVycm9yKCk7XG4gICAgfVxufTtcblxuWERST2JqZWN0LnByb3RvdHlwZS5fY2xlYW51cCA9IGZ1bmN0aW9uKGFib3J0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICghdGhhdC54ZHIpIHJldHVybjtcbiAgICB1dGlscy51bmxvYWRfZGVsKHRoYXQudW5sb2FkX3JlZik7XG5cbiAgICB0aGF0Lnhkci5vbnRpbWVvdXQgPSB0aGF0Lnhkci5vbmVycm9yID0gdGhhdC54ZHIub25wcm9ncmVzcyA9XG4gICAgICAgIHRoYXQueGRyLm9ubG9hZCA9IG51bGw7XG4gICAgaWYgKGFib3J0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGF0Lnhkci5hYm9ydCgpO1xuICAgICAgICB9IGNhdGNoKHgpIHt9O1xuICAgIH1cbiAgICB0aGF0LnVubG9hZF9yZWYgPSB0aGF0LnhkciA9IG51bGw7XG59O1xuXG5YRFJPYmplY3QucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQubnVrZSgpO1xuICAgIHRoYXQuX2NsZWFudXAodHJ1ZSk7XG59O1xuXG4vLyAxLiBJcyBuYXRpdmVseSB2aWEgWEhSXG4vLyAyLiBJcyBuYXRpdmVseSB2aWEgWERSXG4vLyAzLiBOb3BlLCBidXQgcG9zdE1lc3NhZ2UgaXMgdGhlcmUgc28gaXQgc2hvdWxkIHdvcmsgdmlhIHRoZSBJZnJhbWUuXG4vLyA0LiBOb3BlLCBzb3JyeS5cbnV0aWxzLmlzWEhSQ29yc0NhcGFibGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoX3dpbmRvdy5YTUxIdHRwUmVxdWVzdCAmJiAnd2l0aENyZWRlbnRpYWxzJyBpbiBuZXcgWE1MSHR0cFJlcXVlc3QoKSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgLy8gWERvbWFpblJlcXVlc3QgZG9lc24ndCB3b3JrIGlmIHBhZ2UgaXMgc2VydmVkIGZyb20gZmlsZTovL1xuICAgIGlmIChfd2luZG93LlhEb21haW5SZXF1ZXN0ICYmIF9kb2N1bWVudC5kb21haW4pIHtcbiAgICAgICAgcmV0dXJuIDI7XG4gICAgfVxuICAgIGlmIChJZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCgpKSB7XG4gICAgICAgIHJldHVybiAzO1xuICAgIH1cbiAgICByZXR1cm4gNDtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL2RvbTIuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3NvY2tqcy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIFNvY2tKUyA9IGZ1bmN0aW9uKHVybCwgZGVwX3Byb3RvY29sc193aGl0ZWxpc3QsIG9wdGlvbnMpIHtcbiAgICBpZiAodGhpcyA9PT0gd2luZG93KSB7XG4gICAgICAgIC8vIG1ha2VzIGBuZXdgIG9wdGlvbmFsXG4gICAgICAgIHJldHVybiBuZXcgU29ja0pTKHVybCwgZGVwX3Byb3RvY29sc193aGl0ZWxpc3QsIG9wdGlvbnMpO1xuICAgIH1cbiAgICBcbiAgICB2YXIgdGhhdCA9IHRoaXMsIHByb3RvY29sc193aGl0ZWxpc3Q7XG4gICAgdGhhdC5fb3B0aW9ucyA9IHtkZXZlbDogZmFsc2UsIGRlYnVnOiBmYWxzZSwgcHJvdG9jb2xzX3doaXRlbGlzdDogW10sXG4gICAgICAgICAgICAgICAgICAgICBpbmZvOiB1bmRlZmluZWQsIHJ0dDogdW5kZWZpbmVkfTtcbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICB1dGlscy5vYmplY3RFeHRlbmQodGhhdC5fb3B0aW9ucywgb3B0aW9ucyk7XG4gICAgfVxuICAgIHRoYXQuX2Jhc2VfdXJsID0gdXRpbHMuYW1lbmRVcmwodXJsKTtcbiAgICB0aGF0Ll9zZXJ2ZXIgPSB0aGF0Ll9vcHRpb25zLnNlcnZlciB8fCB1dGlscy5yYW5kb21fbnVtYmVyX3N0cmluZygxMDAwKTtcbiAgICBpZiAodGhhdC5fb3B0aW9ucy5wcm90b2NvbHNfd2hpdGVsaXN0ICYmXG4gICAgICAgIHRoYXQuX29wdGlvbnMucHJvdG9jb2xzX3doaXRlbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgcHJvdG9jb2xzX3doaXRlbGlzdCA9IHRoYXQuX29wdGlvbnMucHJvdG9jb2xzX3doaXRlbGlzdDtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBEZXByZWNhdGVkIEFQSVxuICAgICAgICBpZiAodHlwZW9mIGRlcF9wcm90b2NvbHNfd2hpdGVsaXN0ID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgZGVwX3Byb3RvY29sc193aGl0ZWxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcHJvdG9jb2xzX3doaXRlbGlzdCA9IFtkZXBfcHJvdG9jb2xzX3doaXRlbGlzdF07XG4gICAgICAgIH0gZWxzZSBpZiAodXRpbHMuaXNBcnJheShkZXBfcHJvdG9jb2xzX3doaXRlbGlzdCkpIHtcbiAgICAgICAgICAgIHByb3RvY29sc193aGl0ZWxpc3QgPSBkZXBfcHJvdG9jb2xzX3doaXRlbGlzdFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvdG9jb2xzX3doaXRlbGlzdCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb3RvY29sc193aGl0ZWxpc3QpIHtcbiAgICAgICAgICAgIHRoYXQuX2RlYnVnKCdEZXByZWNhdGVkIEFQSTogVXNlIFwicHJvdG9jb2xzX3doaXRlbGlzdFwiIG9wdGlvbiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdpbnN0ZWFkIG9mIHN1cHBseWluZyBwcm90b2NvbCBsaXN0IGFzIGEgc2Vjb25kICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3BhcmFtZXRlciB0byBTb2NrSlMgY29uc3RydWN0b3IuJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhhdC5fcHJvdG9jb2xzID0gW107XG4gICAgdGhhdC5wcm90b2NvbCA9IG51bGw7XG4gICAgdGhhdC5yZWFkeVN0YXRlID0gU29ja0pTLkNPTk5FQ1RJTkc7XG4gICAgdGhhdC5faXIgPSBjcmVhdGVJbmZvUmVjZWl2ZXIodGhhdC5fYmFzZV91cmwpO1xuICAgIHRoYXQuX2lyLm9uZmluaXNoID0gZnVuY3Rpb24oaW5mbywgcnR0KSB7XG4gICAgICAgIHRoYXQuX2lyID0gbnVsbDtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIGlmICh0aGF0Ll9vcHRpb25zLmluZm8pIHtcbiAgICAgICAgICAgICAgICAvLyBPdmVycmlkZSBpZiB1c2VyIHN1cHBsaWVzIHRoZSBvcHRpb25cbiAgICAgICAgICAgICAgICBpbmZvID0gdXRpbHMub2JqZWN0RXh0ZW5kKGluZm8sIHRoYXQuX29wdGlvbnMuaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhhdC5fb3B0aW9ucy5ydHQpIHtcbiAgICAgICAgICAgICAgICBydHQgPSB0aGF0Ll9vcHRpb25zLnJ0dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoYXQuX2FwcGx5SW5mbyhpbmZvLCBydHQsIHByb3RvY29sc193aGl0ZWxpc3QpO1xuICAgICAgICAgICAgdGhhdC5fZGlkQ2xvc2UoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQuX2RpZENsb3NlKDEwMDIsICdDYW5cXCd0IGNvbm5lY3QgdG8gc2VydmVyJywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcbi8vIEluaGVyaXRhbmNlXG5Tb2NrSlMucHJvdG90eXBlID0gbmV3IFJFdmVudFRhcmdldCgpO1xuXG5Tb2NrSlMudmVyc2lvbiA9IFwiMC4zLjEuNy5nYTY3Zi5kaXJ0eVwiO1xuXG5Tb2NrSlMuQ09OTkVDVElORyA9IDA7XG5Tb2NrSlMuT1BFTiA9IDE7XG5Tb2NrSlMuQ0xPU0lORyA9IDI7XG5Tb2NrSlMuQ0xPU0VEID0gMztcblxuU29ja0pTLnByb3RvdHlwZS5fZGVidWcgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fb3B0aW9ucy5kZWJ1ZylcbiAgICAgICAgdXRpbHMubG9nLmFwcGx5KHV0aWxzLCBhcmd1bWVudHMpO1xufTtcblxuU29ja0pTLnByb3RvdHlwZS5fZGlzcGF0Y2hPcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgPT09IFNvY2tKUy5DT05ORUNUSU5HKSB7XG4gICAgICAgIGlmICh0aGF0Ll90cmFuc3BvcnRfdHJlZikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoYXQuX3RyYW5zcG9ydF90cmVmKTtcbiAgICAgICAgICAgIHRoYXQuX3RyYW5zcG9ydF90cmVmID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGF0LnJlYWR5U3RhdGUgPSBTb2NrSlMuT1BFTjtcbiAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudChcIm9wZW5cIikpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoZSBzZXJ2ZXIgbWlnaHQgaGF2ZSBiZWVuIHJlc3RhcnRlZCwgYW5kIGxvc3QgdHJhY2sgb2Ygb3VyXG4gICAgICAgIC8vIGNvbm5lY3Rpb24uXG4gICAgICAgIHRoYXQuX2RpZENsb3NlKDEwMDYsIFwiU2VydmVyIGxvc3Qgc2Vzc2lvblwiKTtcbiAgICB9XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl9kaXNwYXRjaE1lc3NhZ2UgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5PUEVOKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoXCJtZXNzYWdlXCIsIHtkYXRhOiBkYXRhfSkpO1xufTtcblxuU29ja0pTLnByb3RvdHlwZS5fZGlzcGF0Y2hIZWFydGJlYXQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5PUEVOKVxuICAgICAgICByZXR1cm47XG4gICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnaGVhcnRiZWF0Jywge30pKTtcbn07XG5cblNvY2tKUy5wcm90b3R5cGUuX2RpZENsb3NlID0gZnVuY3Rpb24oY29kZSwgcmVhc29uLCBmb3JjZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5yZWFkeVN0YXRlICE9PSBTb2NrSlMuQ09OTkVDVElORyAmJlxuICAgICAgICB0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5PUEVOICYmXG4gICAgICAgIHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLkNMT1NJTkcpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lOVkFMSURfU1RBVEVfRVJSJyk7XG4gICAgaWYgKHRoYXQuX2lyKSB7XG4gICAgICAgIHRoYXQuX2lyLm51a2UoKTtcbiAgICAgICAgdGhhdC5faXIgPSBudWxsO1xuICAgIH1cblxuICAgIGlmICh0aGF0Ll90cmFuc3BvcnQpIHtcbiAgICAgICAgdGhhdC5fdHJhbnNwb3J0LmRvQ2xlYW51cCgpO1xuICAgICAgICB0aGF0Ll90cmFuc3BvcnQgPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBjbG9zZV9ldmVudCA9IG5ldyBTaW1wbGVFdmVudChcImNsb3NlXCIsIHtcbiAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgcmVhc29uOiByZWFzb24sXG4gICAgICAgIHdhc0NsZWFuOiB1dGlscy51c2VyU2V0Q29kZShjb2RlKX0pO1xuXG4gICAgaWYgKCF1dGlscy51c2VyU2V0Q29kZShjb2RlKSAmJlxuICAgICAgICB0aGF0LnJlYWR5U3RhdGUgPT09IFNvY2tKUy5DT05ORUNUSU5HICYmICFmb3JjZSkge1xuICAgICAgICBpZiAodGhhdC5fdHJ5X25leHRfcHJvdG9jb2woY2xvc2VfZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2xvc2VfZXZlbnQgPSBuZXcgU2ltcGxlRXZlbnQoXCJjbG9zZVwiLCB7Y29kZTogMjAwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlYXNvbjogXCJBbGwgdHJhbnNwb3J0cyBmYWlsZWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdhc0NsZWFuOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RfZXZlbnQ6IGNsb3NlX2V2ZW50fSk7XG4gICAgfVxuICAgIHRoYXQucmVhZHlTdGF0ZSA9IFNvY2tKUy5DTE9TRUQ7XG5cbiAgICB1dGlscy5kZWxheShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQoY2xvc2VfZXZlbnQpO1xuICAgICAgICAgICAgICAgIH0pO1xufTtcblxuU29ja0pTLnByb3RvdHlwZS5fZGlkTWVzc2FnZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHR5cGUgPSBkYXRhLnNsaWNlKDAsIDEpO1xuICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSAnbyc6XG4gICAgICAgIHRoYXQuX2Rpc3BhdGNoT3BlbigpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlICdhJzpcbiAgICAgICAgdmFyIHBheWxvYWQgPSBKU09OLnBhcnNlKGRhdGEuc2xpY2UoMSkgfHwgJ1tdJyk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpIDwgcGF5bG9hZC5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB0aGF0Ll9kaXNwYXRjaE1lc3NhZ2UocGF5bG9hZFtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbSc6XG4gICAgICAgIHZhciBwYXlsb2FkID0gSlNPTi5wYXJzZShkYXRhLnNsaWNlKDEpIHx8ICdudWxsJyk7XG4gICAgICAgIHRoYXQuX2Rpc3BhdGNoTWVzc2FnZShwYXlsb2FkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSAnYyc6XG4gICAgICAgIHZhciBwYXlsb2FkID0gSlNPTi5wYXJzZShkYXRhLnNsaWNlKDEpIHx8ICdbXScpO1xuICAgICAgICB0aGF0Ll9kaWRDbG9zZShwYXlsb2FkWzBdLCBwYXlsb2FkWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSAnaCc6XG4gICAgICAgIHRoYXQuX2Rpc3BhdGNoSGVhcnRiZWF0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cblNvY2tKUy5wcm90b3R5cGUuX3RyeV9uZXh0X3Byb3RvY29sID0gZnVuY3Rpb24oY2xvc2VfZXZlbnQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucHJvdG9jb2wpIHtcbiAgICAgICAgdGhhdC5fZGVidWcoJ0Nsb3NlZCB0cmFuc3BvcnQ6JywgdGhhdC5wcm90b2NvbCwgJycrY2xvc2VfZXZlbnQpO1xuICAgICAgICB0aGF0LnByb3RvY29sID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoYXQuX3RyYW5zcG9ydF90cmVmKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGF0Ll90cmFuc3BvcnRfdHJlZik7XG4gICAgICAgIHRoYXQuX3RyYW5zcG9ydF90cmVmID0gbnVsbDtcbiAgICB9XG5cbiAgICB3aGlsZSgxKSB7XG4gICAgICAgIHZhciBwcm90b2NvbCA9IHRoYXQucHJvdG9jb2wgPSB0aGF0Ll9wcm90b2NvbHMuc2hpZnQoKTtcbiAgICAgICAgaWYgKCFwcm90b2NvbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNvbWUgcHJvdG9jb2xzIHJlcXVpcmUgYWNjZXNzIHRvIGBib2R5YCwgd2hhdCBpZiB3ZXJlIGluXG4gICAgICAgIC8vIHRoZSBgaGVhZGA/XG4gICAgICAgIGlmIChTb2NrSlNbcHJvdG9jb2xdICYmXG4gICAgICAgICAgICBTb2NrSlNbcHJvdG9jb2xdLm5lZWRfYm9keSA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgKCFfZG9jdW1lbnQuYm9keSB8fFxuICAgICAgICAgICAgICh0eXBlb2YgX2RvY3VtZW50LnJlYWR5U3RhdGUgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICYmIF9kb2N1bWVudC5yZWFkeVN0YXRlICE9PSAnY29tcGxldGUnKSkpIHtcbiAgICAgICAgICAgIHRoYXQuX3Byb3RvY29scy51bnNoaWZ0KHByb3RvY29sKTtcbiAgICAgICAgICAgIHRoYXQucHJvdG9jb2wgPSAnd2FpdGluZy1mb3ItbG9hZCc7XG4gICAgICAgICAgICB1dGlscy5hdHRhY2hFdmVudCgnbG9hZCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgdGhhdC5fdHJ5X25leHRfcHJvdG9jb2woKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIVNvY2tKU1twcm90b2NvbF0gfHxcbiAgICAgICAgICAgICAgIVNvY2tKU1twcm90b2NvbF0uZW5hYmxlZCh0aGF0Ll9vcHRpb25zKSkge1xuICAgICAgICAgICAgdGhhdC5fZGVidWcoJ1NraXBwaW5nIHRyYW5zcG9ydDonLCBwcm90b2NvbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgcm91bmRUcmlwcyA9IFNvY2tKU1twcm90b2NvbF0ucm91bmRUcmlwcyB8fCAxO1xuICAgICAgICAgICAgdmFyIHRvID0gKCh0aGF0Ll9vcHRpb25zLnJ0byB8fCAwKSAqIHJvdW5kVHJpcHMpIHx8IDUwMDA7XG4gICAgICAgICAgICB0aGF0Ll90cmFuc3BvcnRfdHJlZiA9IHV0aWxzLmRlbGF5KHRvLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5yZWFkeVN0YXRlID09PSBTb2NrSlMuQ09OTkVDVElORykge1xuICAgICAgICAgICAgICAgICAgICAvLyBJIGNhbid0IHVuZGVyc3RhbmQgaG93IGl0IGlzIHBvc3NpYmxlIHRvIHJ1blxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHRpbWVyLCB3aGVuIHRoZSBzdGF0ZSBpcyBDTE9TRUQsIGJ1dFxuICAgICAgICAgICAgICAgICAgICAvLyBhcHBhcmVudGx5IGluIElFIGV2ZXJ5dGhpbiBpcyBwb3NzaWJsZS5cbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fZGlkQ2xvc2UoMjAwNywgXCJUcmFuc3BvcnQgdGltZW91dGVkXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgY29ubmlkID0gdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICAgICAgICAgIHZhciB0cmFuc191cmwgPSB0aGF0Ll9iYXNlX3VybCArICcvJyArIHRoYXQuX3NlcnZlciArICcvJyArIGNvbm5pZDtcbiAgICAgICAgICAgIHRoYXQuX2RlYnVnKCdPcGVuaW5nIHRyYW5zcG9ydDonLCBwcm90b2NvbCwgJyB1cmw6Jyt0cmFuc191cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAnIFJUTzonK3RoYXQuX29wdGlvbnMucnRvKTtcbiAgICAgICAgICAgIHRoYXQuX3RyYW5zcG9ydCA9IG5ldyBTb2NrSlNbcHJvdG9jb2xdKHRoYXQsIHRyYW5zX3VybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX2Jhc2VfdXJsKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuU29ja0pTLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKGNvZGUsIHJlYXNvbikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAoY29kZSAmJiAhdXRpbHMudXNlclNldENvZGUoY29kZSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIklOVkFMSURfQUNDRVNTX0VSUlwiKTtcbiAgICBpZih0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5DT05ORUNUSU5HICYmXG4gICAgICAgdGhhdC5yZWFkeVN0YXRlICE9PSBTb2NrSlMuT1BFTikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoYXQucmVhZHlTdGF0ZSA9IFNvY2tKUy5DTE9TSU5HO1xuICAgIHRoYXQuX2RpZENsb3NlKGNvZGUgfHwgMTAwMCwgcmVhc29uIHx8IFwiTm9ybWFsIGNsb3N1cmVcIik7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgPT09IFNvY2tKUy5DT05ORUNUSU5HKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lOVkFMSURfU1RBVEVfRVJSJyk7XG4gICAgaWYgKHRoYXQucmVhZHlTdGF0ZSA9PT0gU29ja0pTLk9QRU4pIHtcbiAgICAgICAgdGhhdC5fdHJhbnNwb3J0LmRvU2VuZCh1dGlscy5xdW90ZSgnJyArIGRhdGEpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl9hcHBseUluZm8gPSBmdW5jdGlvbihpbmZvLCBydHQsIHByb3RvY29sc193aGl0ZWxpc3QpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5fb3B0aW9ucy5pbmZvID0gaW5mbztcbiAgICB0aGF0Ll9vcHRpb25zLnJ0dCA9IHJ0dDtcbiAgICB0aGF0Ll9vcHRpb25zLnJ0byA9IHV0aWxzLmNvdW50UlRPKHJ0dCk7XG4gICAgdGhhdC5fb3B0aW9ucy5pbmZvLm51bGxfb3JpZ2luID0gIV9kb2N1bWVudC5kb21haW47XG4gICAgdmFyIHByb2JlZCA9IHV0aWxzLnByb2JlUHJvdG9jb2xzKCk7XG4gICAgdGhhdC5fcHJvdG9jb2xzID0gdXRpbHMuZGV0ZWN0UHJvdG9jb2xzKHByb2JlZCwgcHJvdG9jb2xzX3doaXRlbGlzdCwgaW5mbyk7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9zb2NranMuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLXdlYnNvY2tldC5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIFdlYlNvY2tldFRyYW5zcG9ydCA9IFNvY2tKUy53ZWJzb2NrZXQgPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciB1cmwgPSB0cmFuc191cmwgKyAnL3dlYnNvY2tldCc7XG4gICAgaWYgKHVybC5zbGljZSgwLCA1KSA9PT0gJ2h0dHBzJykge1xuICAgICAgICB1cmwgPSAnd3NzJyArIHVybC5zbGljZSg1KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgPSAnd3MnICsgdXJsLnNsaWNlKDQpO1xuICAgIH1cbiAgICB0aGF0LnJpID0gcmk7XG4gICAgdGhhdC51cmwgPSB1cmw7XG4gICAgdmFyIENvbnN0cnVjdG9yID0gX3dpbmRvdy5XZWJTb2NrZXQgfHwgX3dpbmRvdy5Nb3pXZWJTb2NrZXQ7XG5cbiAgICB0aGF0LndzID0gbmV3IENvbnN0cnVjdG9yKHRoYXQudXJsKTtcbiAgICB0aGF0LndzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhhdC5yaS5fZGlkTWVzc2FnZShlLmRhdGEpO1xuICAgIH07XG4gICAgLy8gRmlyZWZveCBoYXMgYW4gaW50ZXJlc3RpbmcgYnVnLiBJZiBhIHdlYnNvY2tldCBjb25uZWN0aW9uIGlzXG4gICAgLy8gY3JlYXRlZCBhZnRlciBvbmJlZm9yZXVubG9hZCwgaXQgc3RheXMgYWxpdmUgZXZlbiB3aGVuIHVzZXJcbiAgICAvLyBuYXZpZ2F0ZXMgYXdheSBmcm9tIHRoZSBwYWdlLiBJbiBzdWNoIHNpdHVhdGlvbiBsZXQncyBsaWUgLVxuICAgIC8vIGxldCdzIG5vdCBvcGVuIHRoZSB3cyBjb25uZWN0aW9uIGF0IGFsbC4gU2VlOlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zb2NranMvc29ja2pzLWNsaWVudC9pc3N1ZXMvMjhcbiAgICAvLyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTYwODVcbiAgICB0aGF0LnVubG9hZF9yZWYgPSB1dGlscy51bmxvYWRfYWRkKGZ1bmN0aW9uKCl7dGhhdC53cy5jbG9zZSgpfSk7XG4gICAgdGhhdC53cy5vbmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQucmkuX2RpZE1lc3NhZ2UodXRpbHMuY2xvc2VGcmFtZSgxMDA2LCBcIldlYlNvY2tldCBjb25uZWN0aW9uIGJyb2tlblwiKSk7XG4gICAgfTtcbn07XG5cbldlYlNvY2tldFRyYW5zcG9ydC5wcm90b3R5cGUuZG9TZW5kID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHRoaXMud3Muc2VuZCgnWycgKyBkYXRhICsgJ10nKTtcbn07XG5cbldlYlNvY2tldFRyYW5zcG9ydC5wcm90b3R5cGUuZG9DbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciB3cyA9IHRoYXQud3M7XG4gICAgaWYgKHdzKSB7XG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IHdzLm9uY2xvc2UgPSBudWxsO1xuICAgICAgICB3cy5jbG9zZSgpO1xuICAgICAgICB1dGlscy51bmxvYWRfZGVsKHRoYXQudW5sb2FkX3JlZik7XG4gICAgICAgIHRoYXQudW5sb2FkX3JlZiA9IHRoYXQucmkgPSB0aGF0LndzID0gbnVsbDtcbiAgICB9XG59O1xuXG5XZWJTb2NrZXRUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAhIShfd2luZG93LldlYlNvY2tldCB8fCBfd2luZG93Lk1veldlYlNvY2tldCk7XG59O1xuXG4vLyBJbiB0aGVvcnksIHdzIHNob3VsZCByZXF1aXJlIDEgcm91bmQgdHJpcC4gQnV0IGluIGNocm9tZSwgdGhpcyBpc1xuLy8gbm90IHZlcnkgc3RhYmxlIG92ZXIgU1NMLiBNb3N0IGxpa2VseSBhIHdzIGNvbm5lY3Rpb24gcmVxdWlyZXMgYVxuLy8gc2VwYXJhdGUgU1NMIGNvbm5lY3Rpb24sIGluIHdoaWNoIGNhc2UgMiByb3VuZCB0cmlwcyBhcmUgYW5cbi8vIGFic29sdXRlIG1pbnVtdW0uXG5XZWJTb2NrZXRUcmFuc3BvcnQucm91bmRUcmlwcyA9IDI7XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXdlYnNvY2tldC5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtc2VuZGVyLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgQnVmZmVyZWRTZW5kZXIgPSBmdW5jdGlvbigpIHt9O1xuQnVmZmVyZWRTZW5kZXIucHJvdG90eXBlLnNlbmRfY29uc3RydWN0b3IgPSBmdW5jdGlvbihzZW5kZXIpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5zZW5kX2J1ZmZlciA9IFtdO1xuICAgIHRoYXQuc2VuZGVyID0gc2VuZGVyO1xufTtcbkJ1ZmZlcmVkU2VuZGVyLnByb3RvdHlwZS5kb1NlbmQgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQuc2VuZF9idWZmZXIucHVzaChtZXNzYWdlKTtcbiAgICBpZiAoIXRoYXQuc2VuZF9zdG9wKSB7XG4gICAgICAgIHRoYXQuc2VuZF9zY2hlZHVsZSgpO1xuICAgIH1cbn07XG5cbi8vIEZvciBwb2xsaW5nIHRyYW5zcG9ydHMgaW4gYSBzaXR1YXRpb24gd2hlbiBpbiB0aGUgbWVzc2FnZSBjYWxsYmFjayxcbi8vIG5ldyBtZXNzYWdlIGlzIGJlaW5nIHNlbmQuIElmIHRoZSBzZW5kaW5nIGNvbm5lY3Rpb24gd2FzIHN0YXJ0ZWRcbi8vIGJlZm9yZSByZWNlaXZpbmcgb25lLCBpdCBpcyBwb3NzaWJsZSB0byBzYXR1cmF0ZSB0aGUgbmV0d29yayBhbmRcbi8vIHRpbWVvdXQgZHVlIHRvIHRoZSBsYWNrIG9mIHJlY2VpdmluZyBzb2NrZXQuIFRvIGF2b2lkIHRoYXQgd2UgZGVsYXlcbi8vIHNlbmRpbmcgbWVzc2FnZXMgYnkgc29tZSBzbWFsbCB0aW1lLCBpbiBvcmRlciB0byBsZXQgcmVjZWl2aW5nXG4vLyBjb25uZWN0aW9uIGJlIHN0YXJ0ZWQgYmVmb3JlaGFuZC4gVGhpcyBpcyBvbmx5IGEgaGFsZm1lYXN1cmUgYW5kXG4vLyBkb2VzIG5vdCBmaXggdGhlIGJpZyBwcm9ibGVtLCBidXQgaXQgZG9lcyBtYWtlIHRoZSB0ZXN0cyBnbyBtb3JlXG4vLyBzdGFibGUgb24gc2xvdyBuZXR3b3Jrcy5cbkJ1ZmZlcmVkU2VuZGVyLnByb3RvdHlwZS5zZW5kX3NjaGVkdWxlX3dhaXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHRyZWY7XG4gICAgdGhhdC5zZW5kX3N0b3AgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhhdC5zZW5kX3N0b3AgPSBudWxsO1xuICAgICAgICBjbGVhclRpbWVvdXQodHJlZik7XG4gICAgfTtcbiAgICB0cmVmID0gdXRpbHMuZGVsYXkoMjUsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LnNlbmRfc3RvcCA9IG51bGw7XG4gICAgICAgIHRoYXQuc2VuZF9zY2hlZHVsZSgpO1xuICAgIH0pO1xufTtcblxuQnVmZmVyZWRTZW5kZXIucHJvdG90eXBlLnNlbmRfc2NoZWR1bGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQuc2VuZF9idWZmZXIubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgcGF5bG9hZCA9ICdbJyArIHRoYXQuc2VuZF9idWZmZXIuam9pbignLCcpICsgJ10nO1xuICAgICAgICB0aGF0LnNlbmRfc3RvcCA9IHRoYXQuc2VuZGVyKHRoYXQudHJhbnNfdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2VuZF9zdG9wID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZW5kX3NjaGVkdWxlX3dhaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgdGhhdC5zZW5kX2J1ZmZlciA9IFtdO1xuICAgIH1cbn07XG5cbkJ1ZmZlcmVkU2VuZGVyLnByb3RvdHlwZS5zZW5kX2Rlc3RydWN0b3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQuX3NlbmRfc3RvcCkge1xuICAgICAgICB0aGF0Ll9zZW5kX3N0b3AoKTtcbiAgICB9XG4gICAgdGhhdC5fc2VuZF9zdG9wID0gbnVsbDtcbn07XG5cbnZhciBqc29uUEdlbmVyaWNTZW5kZXIgPSBmdW5jdGlvbih1cmwsIHBheWxvYWQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKCEoJ19zZW5kX2Zvcm0nIGluIHRoYXQpKSB7XG4gICAgICAgIHZhciBmb3JtID0gdGhhdC5fc2VuZF9mb3JtID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgICAgICAgdmFyIGFyZWEgPSB0aGF0Ll9zZW5kX2FyZWEgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgICAgICAgYXJlYS5uYW1lID0gJ2QnO1xuICAgICAgICBmb3JtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGZvcm0uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBmb3JtLm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgZm9ybS5lbmN0eXBlID0gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCc7XG4gICAgICAgIGZvcm0uYWNjZXB0Q2hhcnNldCA9IFwiVVRGLThcIjtcbiAgICAgICAgZm9ybS5hcHBlbmRDaGlsZChhcmVhKTtcbiAgICAgICAgX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZm9ybSk7XG4gICAgfVxuICAgIHZhciBmb3JtID0gdGhhdC5fc2VuZF9mb3JtO1xuICAgIHZhciBhcmVhID0gdGhhdC5fc2VuZF9hcmVhO1xuICAgIHZhciBpZCA9ICdhJyArIHV0aWxzLnJhbmRvbV9zdHJpbmcoOCk7XG4gICAgZm9ybS50YXJnZXQgPSBpZDtcbiAgICBmb3JtLmFjdGlvbiA9IHVybCArICcvanNvbnBfc2VuZD9pPScgKyBpZDtcblxuICAgIHZhciBpZnJhbWU7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gaWU2IGR5bmFtaWMgaWZyYW1lcyB3aXRoIHRhcmdldD1cIlwiIHN1cHBvcnQgKHRoYW5rcyBDaHJpcyBMYW1iYWNoZXIpXG4gICAgICAgIGlmcmFtZSA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCc8aWZyYW1lIG5hbWU9XCInKyBpZCArJ1wiPicpO1xuICAgIH0gY2F0Y2goeCkge1xuICAgICAgICBpZnJhbWUgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgICAgIGlmcmFtZS5uYW1lID0gaWQ7XG4gICAgfVxuICAgIGlmcmFtZS5pZCA9IGlkO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICBpZnJhbWUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIHRyeSB7XG4gICAgICAgIGFyZWEudmFsdWUgPSBwYXlsb2FkO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgICB1dGlscy5sb2coJ1lvdXIgYnJvd3NlciBpcyBzZXJpb3VzbHkgYnJva2VuLiBHbyBob21lISAnICsgZS5tZXNzYWdlKTtcbiAgICB9XG4gICAgZm9ybS5zdWJtaXQoKTtcblxuICAgIHZhciBjb21wbGV0ZWQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICghaWZyYW1lLm9uZXJyb3IpIHJldHVybjtcbiAgICAgICAgaWZyYW1lLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGlmcmFtZS5vbmVycm9yID0gaWZyYW1lLm9ubG9hZCA9IG51bGw7XG4gICAgICAgIC8vIE9wZXJhIG1pbmkgZG9lc24ndCBsaWtlIGlmIHdlIEdDIGlmcmFtZVxuICAgICAgICAvLyBpbW1lZGlhdGVseSwgdGh1cyB0aGlzIHRpbWVvdXQuXG4gICAgICAgIHV0aWxzLmRlbGF5KDUwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIGlmcmFtZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlmcmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgIGlmcmFtZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIGFyZWEudmFsdWUgPSAnJztcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICB9O1xuICAgIGlmcmFtZS5vbmVycm9yID0gaWZyYW1lLm9ubG9hZCA9IGNvbXBsZXRlZDtcbiAgICBpZnJhbWUub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoaWZyYW1lLnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJykgY29tcGxldGVkKCk7XG4gICAgfTtcbiAgICByZXR1cm4gY29tcGxldGVkO1xufTtcblxudmFyIGNyZWF0ZUFqYXhTZW5kZXIgPSBmdW5jdGlvbihBamF4T2JqZWN0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHVybCwgcGF5bG9hZCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHhvID0gbmV3IEFqYXhPYmplY3QoJ1BPU1QnLCB1cmwgKyAnL3hocl9zZW5kJywgcGF5bG9hZCk7XG4gICAgICAgIHhvLm9uZmluaXNoID0gZnVuY3Rpb24oc3RhdHVzLCB0ZXh0KSB7XG4gICAgICAgICAgICBjYWxsYmFjayhzdGF0dXMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYWJvcnRfcmVhc29uKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygwLCBhYm9ydF9yZWFzb24pO1xuICAgICAgICB9O1xuICAgIH07XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1zZW5kZXIuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWpzb25wLXJlY2VpdmVyLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vLyBQYXJ0cyBkZXJpdmVkIGZyb20gU29ja2V0LmlvOlxuLy8gICAgaHR0cHM6Ly9naXRodWIuY29tL0xlYXJuQm9vc3Qvc29ja2V0LmlvL2Jsb2IvMC42LjE3L2xpYi9zb2NrZXQuaW8vdHJhbnNwb3J0cy9qc29ucC1wb2xsaW5nLmpzXG4vLyBhbmQgalF1ZXJ5LUpTT05QOlxuLy8gICAgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9qcXVlcnktanNvbnAvc291cmNlL2Jyb3dzZS90cnVuay9jb3JlL2pxdWVyeS5qc29ucC5qc1xudmFyIGpzb25QR2VuZXJpY1JlY2VpdmVyID0gZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICAgIHZhciB0cmVmO1xuICAgIHZhciBzY3JpcHQgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgdmFyIHNjcmlwdDI7ICAvLyBPcGVyYSBzeW5jaHJvbm91cyBsb2FkIHRyaWNrLlxuICAgIHZhciBjbG9zZV9zY3JpcHQgPSBmdW5jdGlvbihmcmFtZSkge1xuICAgICAgICBpZiAoc2NyaXB0Mikge1xuICAgICAgICAgICAgc2NyaXB0Mi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdDIpO1xuICAgICAgICAgICAgc2NyaXB0MiA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjcmlwdCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRyZWYpO1xuICAgICAgICAgICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgICAgIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBzY3JpcHQub25lcnJvciA9XG4gICAgICAgICAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IHNjcmlwdC5vbmNsaWNrID0gbnVsbDtcbiAgICAgICAgICAgIHNjcmlwdCA9IG51bGw7XG4gICAgICAgICAgICBjYWxsYmFjayhmcmFtZSk7XG4gICAgICAgICAgICBjYWxsYmFjayA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gSUU5IGZpcmVzICdlcnJvcicgZXZlbnQgYWZ0ZXIgb3JzYyBvciBiZWZvcmUsIGluIHJhbmRvbSBvcmRlci5cbiAgICB2YXIgbG9hZGVkX29rYXkgPSBmYWxzZTtcbiAgICB2YXIgZXJyb3JfdGltZXIgPSBudWxsO1xuXG4gICAgc2NyaXB0LmlkID0gJ2EnICsgdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICBzY3JpcHQuc3JjID0gdXJsO1xuICAgIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gICAgc2NyaXB0LmNoYXJzZXQgPSAnVVRGLTgnO1xuICAgIHNjcmlwdC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoIWVycm9yX3RpbWVyKSB7XG4gICAgICAgICAgICAvLyBEZWxheSBmaXJpbmcgY2xvc2Vfc2NyaXB0LlxuICAgICAgICAgICAgZXJyb3JfdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICghbG9hZGVkX29rYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2Vfc2NyaXB0KHV0aWxzLmNsb3NlRnJhbWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAxMDA2LFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJKU09OUCBzY3JpcHQgbG9hZGVkIGFibm9ybWFsbHkgKG9uZXJyb3IpXCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY2xvc2Vfc2NyaXB0KHV0aWxzLmNsb3NlRnJhbWUoMTAwNiwgXCJKU09OUCBzY3JpcHQgbG9hZGVkIGFibm9ybWFsbHkgKG9ubG9hZClcIikpO1xuICAgIH07XG5cbiAgICBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoL2xvYWRlZHxjbG9zZWQvLnRlc3Qoc2NyaXB0LnJlYWR5U3RhdGUpKSB7XG4gICAgICAgICAgICBpZiAoc2NyaXB0ICYmIHNjcmlwdC5odG1sRm9yICYmIHNjcmlwdC5vbmNsaWNrKSB7XG4gICAgICAgICAgICAgICAgbG9hZGVkX29rYXkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluIElFLCBhY3R1YWxseSBleGVjdXRlIHRoZSBzY3JpcHQuXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdC5vbmNsaWNrKCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzY3JpcHQpIHtcbiAgICAgICAgICAgICAgICBjbG9zZV9zY3JpcHQodXRpbHMuY2xvc2VGcmFtZSgxMDA2LCBcIkpTT05QIHNjcmlwdCBsb2FkZWQgYWJub3JtYWxseSAob25yZWFkeXN0YXRlY2hhbmdlKVwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIElFOiBldmVudC9odG1sRm9yL29uY2xpY2sgdHJpY2suXG4gICAgLy8gT25lIGNhbid0IHJlbHkgb24gcHJvcGVyIG9yZGVyIGZvciBvbnJlYWR5c3RhdGVjaGFuZ2UuIEluIG9yZGVyIHRvXG4gICAgLy8gbWFrZSBzdXJlLCBzZXQgYSAnaHRtbEZvcicgYW5kICdldmVudCcgcHJvcGVydGllcywgc28gdGhhdFxuICAgIC8vIHNjcmlwdCBjb2RlIHdpbGwgYmUgaW5zdGFsbGVkIGFzICdvbmNsaWNrJyBoYW5kbGVyIGZvciB0aGVcbiAgICAvLyBzY3JpcHQgb2JqZWN0LiBMYXRlciwgb25yZWFkeXN0YXRlY2hhbmdlLCBtYW51YWxseSBleGVjdXRlIHRoaXNcbiAgICAvLyBjb2RlLiBGRiBhbmQgQ2hyb21lIGRvZXNuJ3Qgd29yayB3aXRoICdldmVudCcgYW5kICdodG1sRm9yJ1xuICAgIC8vIHNldC4gRm9yIHJlZmVyZW5jZSBzZWU6XG4gICAgLy8gICBodHRwOi8vamF1Ym91cmcubmV0LzIwMTAvMDcvbG9hZGluZy1zY3JpcHQtYXMtb25jbGljay1oYW5kbGVyLW9mLmh0bWxcbiAgICAvLyBBbHNvLCByZWFkIG9uIHRoYXQgYWJvdXQgc2NyaXB0IG9yZGVyaW5nOlxuICAgIC8vICAgaHR0cDovL3dpa2kud2hhdHdnLm9yZy93aWtpL0R5bmFtaWNfU2NyaXB0X0V4ZWN1dGlvbl9PcmRlclxuICAgIGlmICh0eXBlb2Ygc2NyaXB0LmFzeW5jID09PSAndW5kZWZpbmVkJyAmJiBfZG9jdW1lbnQuYXR0YWNoRXZlbnQpIHtcbiAgICAgICAgLy8gQWNjb3JkaW5nIHRvIG1vemlsbGEgZG9jcywgaW4gcmVjZW50IGJyb3dzZXJzIHNjcmlwdC5hc3luYyBkZWZhdWx0c1xuICAgICAgICAvLyB0byAndHJ1ZScsIHNvIHdlIG1heSB1c2UgaXQgdG8gZGV0ZWN0IGEgZ29vZCBicm93c2VyOlxuICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9IVE1ML0VsZW1lbnQvc2NyaXB0XG4gICAgICAgIGlmICghL29wZXJhL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICAgICAgLy8gTmFpdmVseSBhc3N1bWUgd2UncmUgaW4gSUVcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgc2NyaXB0Lmh0bWxGb3IgPSBzY3JpcHQuaWQ7XG4gICAgICAgICAgICAgICAgc2NyaXB0LmV2ZW50ID0gXCJvbmNsaWNrXCI7XG4gICAgICAgICAgICB9IGNhdGNoICh4KSB7fVxuICAgICAgICAgICAgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE9wZXJhLCBzZWNvbmQgc3luYyBzY3JpcHQgaGFja1xuICAgICAgICAgICAgc2NyaXB0MiA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgICAgIHNjcmlwdDIudGV4dCA9IFwidHJ5e3ZhciBhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ1wiK3NjcmlwdC5pZCtcIicpOyBpZihhKWEub25lcnJvcigpO31jYXRjaCh4KXt9O1wiO1xuICAgICAgICAgICAgc2NyaXB0LmFzeW5jID0gc2NyaXB0Mi5hc3luYyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc2NyaXB0LmFzeW5jICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBzY3JpcHQuYXN5bmMgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEZhbGxiYWNrIG1vc3RseSBmb3IgS29ucXVlcm9yIC0gc3R1cGlkIHRpbWVyLCAzNSBzZWNvbmRzIHNoYWxsIGJlIHBsZW50eS5cbiAgICB0cmVmID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2Vfc2NyaXB0KHV0aWxzLmNsb3NlRnJhbWUoMTAwNiwgXCJKU09OUCBzY3JpcHQgbG9hZGVkIGFibm9ybWFsbHkgKHRpbWVvdXQpXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgICB9LCAzNTAwMCk7XG5cbiAgICB2YXIgaGVhZCA9IF9kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgIGhlYWQuaW5zZXJ0QmVmb3JlKHNjcmlwdCwgaGVhZC5maXJzdENoaWxkKTtcbiAgICBpZiAoc2NyaXB0Mikge1xuICAgICAgICBoZWFkLmluc2VydEJlZm9yZShzY3JpcHQyLCBoZWFkLmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgICByZXR1cm4gY2xvc2Vfc2NyaXB0O1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtanNvbnAtcmVjZWl2ZXIuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWpzb25wLXBvbGxpbmcuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbi8vIFRoZSBzaW1wbGVzdCBhbmQgbW9zdCByb2J1c3QgdHJhbnNwb3J0LCB1c2luZyB0aGUgd2VsbC1rbm93IGNyb3NzXG4vLyBkb21haW4gaGFjayAtIEpTT05QLiBUaGlzIHRyYW5zcG9ydCBpcyBxdWl0ZSBpbmVmZmljaWVudCAtIG9uZVxuLy8gbXNzYWdlIGNvdWxkIHVzZSB1cCB0byBvbmUgaHR0cCByZXF1ZXN0LiBCdXQgYXQgbGVhc3QgaXQgd29ya3MgYWxtb3N0XG4vLyBldmVyeXdoZXJlLlxuLy8gS25vd24gbGltaXRhdGlvbnM6XG4vLyAgIG8geW91IHdpbGwgZ2V0IGEgc3Bpbm5pbmcgY3Vyc29yXG4vLyAgIG8gZm9yIEtvbnF1ZXJvciBhIGR1bWIgdGltZXIgaXMgbmVlZGVkIHRvIGRldGVjdCBlcnJvcnNcblxuXG52YXIgSnNvblBUcmFuc3BvcnQgPSBTb2NrSlNbJ2pzb25wLXBvbGxpbmcnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB1dGlscy5wb2xsdXRlR2xvYmFsTmFtZXNwYWNlKCk7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucmkgPSByaTtcbiAgICB0aGF0LnRyYW5zX3VybCA9IHRyYW5zX3VybDtcbiAgICB0aGF0LnNlbmRfY29uc3RydWN0b3IoanNvblBHZW5lcmljU2VuZGVyKTtcbiAgICB0aGF0Ll9zY2hlZHVsZV9yZWN2KCk7XG59O1xuXG4vLyBJbmhlcml0bmFjZVxuSnNvblBUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEJ1ZmZlcmVkU2VuZGVyKCk7XG5cbkpzb25QVHJhbnNwb3J0LnByb3RvdHlwZS5fc2NoZWR1bGVfcmVjdiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoYXQuX3JlY3Zfc3RvcCA9IG51bGw7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAvLyBubyBkYXRhIC0gaGVhcnRiZWF0O1xuICAgICAgICAgICAgaWYgKCF0aGF0Ll9pc19jbG9zaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5yaS5fZGlkTWVzc2FnZShkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUaGUgbWVzc2FnZSBjYW4gYmUgYSBjbG9zZSBtZXNzYWdlLCBhbmQgY2hhbmdlIGlzX2Nsb3Npbmcgc3RhdGUuXG4gICAgICAgIGlmICghdGhhdC5faXNfY2xvc2luZykge1xuICAgICAgICAgICAgdGhhdC5fc2NoZWR1bGVfcmVjdigpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGF0Ll9yZWN2X3N0b3AgPSBqc29uUFJlY2VpdmVyV3JhcHBlcih0aGF0LnRyYW5zX3VybCArICcvanNvbnAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb25QR2VuZXJpY1JlY2VpdmVyLCBjYWxsYmFjayk7XG59O1xuXG5Kc29uUFRyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5Kc29uUFRyYW5zcG9ydC5uZWVkX2JvZHkgPSB0cnVlO1xuXG5cbkpzb25QVHJhbnNwb3J0LnByb3RvdHlwZS5kb0NsZWFudXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5faXNfY2xvc2luZyA9IHRydWU7XG4gICAgaWYgKHRoYXQuX3JlY3Zfc3RvcCkge1xuICAgICAgICB0aGF0Ll9yZWN2X3N0b3AoKTtcbiAgICB9XG4gICAgdGhhdC5yaSA9IHRoYXQuX3JlY3Zfc3RvcCA9IG51bGw7XG4gICAgdGhhdC5zZW5kX2Rlc3RydWN0b3IoKTtcbn07XG5cblxuLy8gQWJzdHJhY3QgYXdheSBjb2RlIHRoYXQgaGFuZGxlcyBnbG9iYWwgbmFtZXNwYWNlIHBvbGx1dGlvbi5cbnZhciBqc29uUFJlY2VpdmVyV3JhcHBlciA9IGZ1bmN0aW9uKHVybCwgY29uc3RydWN0UmVjZWl2ZXIsIHVzZXJfY2FsbGJhY2spIHtcbiAgICB2YXIgaWQgPSAnYScgKyB1dGlscy5yYW5kb21fc3RyaW5nKDYpO1xuICAgIHZhciB1cmxfaWQgPSB1cmwgKyAnP2M9JyArIGVzY2FwZShXUHJlZml4ICsgJy4nICsgaWQpO1xuICAgIC8vIENhbGxiYWNrIHdpbGwgYmUgY2FsbGVkIGV4YWN0bHkgb25jZS5cbiAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihmcmFtZSkge1xuICAgICAgICBkZWxldGUgX3dpbmRvd1tXUHJlZml4XVtpZF07XG4gICAgICAgIHVzZXJfY2FsbGJhY2soZnJhbWUpO1xuICAgIH07XG5cbiAgICB2YXIgY2xvc2Vfc2NyaXB0ID0gY29uc3RydWN0UmVjZWl2ZXIodXJsX2lkLCBjYWxsYmFjayk7XG4gICAgX3dpbmRvd1tXUHJlZml4XVtpZF0gPSBjbG9zZV9zY3JpcHQ7XG4gICAgdmFyIHN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKF93aW5kb3dbV1ByZWZpeF1baWRdKSB7XG4gICAgICAgICAgICBfd2luZG93W1dQcmVmaXhdW2lkXSh1dGlscy5jbG9zZUZyYW1lKDEwMDAsIFwiSlNPTlAgdXNlciBhYm9ydGVkIHJlYWRcIikpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gc3RvcDtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLWpzb25wLXBvbGxpbmcuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLXhoci5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIEFqYXhCYXNlZFRyYW5zcG9ydCA9IGZ1bmN0aW9uKCkge307XG5BamF4QmFzZWRUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEJ1ZmZlcmVkU2VuZGVyKCk7XG5cbkFqYXhCYXNlZFRyYW5zcG9ydC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsX3N1ZmZpeCwgUmVjZWl2ZXIsIEFqYXhPYmplY3QpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5yaSA9IHJpO1xuICAgIHRoYXQudHJhbnNfdXJsID0gdHJhbnNfdXJsO1xuICAgIHRoYXQuc2VuZF9jb25zdHJ1Y3RvcihjcmVhdGVBamF4U2VuZGVyKEFqYXhPYmplY3QpKTtcbiAgICB0aGF0LnBvbGwgPSBuZXcgUG9sbGluZyhyaSwgUmVjZWl2ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNfdXJsICsgdXJsX3N1ZmZpeCwgQWpheE9iamVjdCk7XG59O1xuXG5BamF4QmFzZWRUcmFuc3BvcnQucHJvdG90eXBlLmRvQ2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5wb2xsKSB7XG4gICAgICAgIHRoYXQucG9sbC5hYm9ydCgpO1xuICAgICAgICB0aGF0LnBvbGwgPSBudWxsO1xuICAgIH1cbn07XG5cbi8vIHhoci1zdHJlYW1pbmdcbnZhciBYaHJTdHJlYW1pbmdUcmFuc3BvcnQgPSBTb2NrSlNbJ3hoci1zdHJlYW1pbmcnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL3hocl9zdHJlYW1pbmcnLCBYaHJSZWNlaXZlciwgdXRpbHMuWEhSQ29yc09iamVjdCk7XG59O1xuXG5YaHJTdHJlYW1pbmdUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuXG5YaHJTdHJlYW1pbmdUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFN1cHBvcnQgZm9yIENPUlMgQWpheCBha2EgQWpheDI/IE9wZXJhIDEyIGNsYWltcyBDT1JTIGJ1dFxuICAgIC8vIGRvZXNuJ3QgZG8gc3RyZWFtaW5nLlxuICAgIHJldHVybiAoX3dpbmRvdy5YTUxIdHRwUmVxdWVzdCAmJlxuICAgICAgICAgICAgJ3dpdGhDcmVkZW50aWFscycgaW4gbmV3IFhNTEh0dHBSZXF1ZXN0KCkgJiZcbiAgICAgICAgICAgICghL29wZXJhL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkpO1xufTtcblhoclN0cmVhbWluZ1RyYW5zcG9ydC5yb3VuZFRyaXBzID0gMjsgLy8gcHJlZmxpZ2h0LCBhamF4XG5cbi8vIFNhZmFyaSBnZXRzIGNvbmZ1c2VkIHdoZW4gYSBzdHJlYW1pbmcgYWpheCByZXF1ZXN0IGlzIHN0YXJ0ZWRcbi8vIGJlZm9yZSBvbmxvYWQuIFRoaXMgY2F1c2VzIHRoZSBsb2FkIGluZGljYXRvciB0byBzcGluIGluZGVmaW5ldGVseS5cblhoclN0cmVhbWluZ1RyYW5zcG9ydC5uZWVkX2JvZHkgPSB0cnVlO1xuXG5cbi8vIEFjY29yZGluZyB0bzpcbi8vICAgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNjQxNTA3L2RldGVjdC1icm93c2VyLXN1cHBvcnQtZm9yLWNyb3NzLWRvbWFpbi14bWxodHRwcmVxdWVzdHNcbi8vICAgaHR0cDovL2hhY2tzLm1vemlsbGEub3JnLzIwMDkvMDcvY3Jvc3Mtc2l0ZS14bWxodHRwcmVxdWVzdC13aXRoLWNvcnMvXG5cblxuLy8geGRyLXN0cmVhbWluZ1xudmFyIFhkclN0cmVhbWluZ1RyYW5zcG9ydCA9IFNvY2tKU1sneGRyLXN0cmVhbWluZyddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHRoaXMucnVuKHJpLCB0cmFuc191cmwsICcveGhyX3N0cmVhbWluZycsIFhoclJlY2VpdmVyLCB1dGlscy5YRFJPYmplY3QpO1xufTtcblxuWGRyU3RyZWFtaW5nVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBBamF4QmFzZWRUcmFuc3BvcnQoKTtcblxuWGRyU3RyZWFtaW5nVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gISFfd2luZG93LlhEb21haW5SZXF1ZXN0O1xufTtcblhkclN0cmVhbWluZ1RyYW5zcG9ydC5yb3VuZFRyaXBzID0gMjsgLy8gcHJlZmxpZ2h0LCBhamF4XG5cblxuXG4vLyB4aHItcG9sbGluZ1xudmFyIFhoclBvbGxpbmdUcmFuc3BvcnQgPSBTb2NrSlNbJ3hoci1wb2xsaW5nJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy94aHInLCBYaHJSZWNlaXZlciwgdXRpbHMuWEhSQ29yc09iamVjdCk7XG59O1xuXG5YaHJQb2xsaW5nVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBBamF4QmFzZWRUcmFuc3BvcnQoKTtcblxuWGhyUG9sbGluZ1RyYW5zcG9ydC5lbmFibGVkID0gWGhyU3RyZWFtaW5nVHJhbnNwb3J0LmVuYWJsZWQ7XG5YaHJQb2xsaW5nVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAyOyAvLyBwcmVmbGlnaHQsIGFqYXhcblxuXG4vLyB4ZHItcG9sbGluZ1xudmFyIFhkclBvbGxpbmdUcmFuc3BvcnQgPSBTb2NrSlNbJ3hkci1wb2xsaW5nJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy94aHInLCBYaHJSZWNlaXZlciwgdXRpbHMuWERST2JqZWN0KTtcbn07XG5cblhkclBvbGxpbmdUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuXG5YZHJQb2xsaW5nVHJhbnNwb3J0LmVuYWJsZWQgPSBYZHJTdHJlYW1pbmdUcmFuc3BvcnQuZW5hYmxlZDtcblhkclBvbGxpbmdUcmFuc3BvcnQucm91bmRUcmlwcyA9IDI7IC8vIHByZWZsaWdodCwgYWpheFxuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy14aHIuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWlmcmFtZS5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLy8gRmV3IGNvb2wgdHJhbnNwb3J0cyBkbyB3b3JrIG9ubHkgZm9yIHNhbWUtb3JpZ2luLiBJbiBvcmRlciB0byBtYWtlXG4vLyB0aGVtIHdvcmtpbmcgY3Jvc3MtZG9tYWluIHdlIHNoYWxsIHVzZSBpZnJhbWUsIHNlcnZlZCBmb3JtIHRoZVxuLy8gcmVtb3RlIGRvbWFpbi4gTmV3IGJyb3dzZXJzLCBoYXZlIGNhcGFiaWxpdGllcyB0byBjb21tdW5pY2F0ZSB3aXRoXG4vLyBjcm9zcyBkb21haW4gaWZyYW1lLCB1c2luZyBwb3N0TWVzc2FnZSgpLiBJbiBJRSBpdCB3YXMgaW1wbGVtZW50ZWRcbi8vIGZyb20gSUUgOCssIGJ1dCBvZiBjb3Vyc2UsIElFIGdvdCBzb21lIGRldGFpbHMgd3Jvbmc6XG4vLyAgICBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvY2MxOTcwMTUodj1WUy44NSkuYXNweFxuLy8gICAgaHR0cDovL3N0ZXZlc291ZGVycy5jb20vbWlzYy90ZXN0LXBvc3RtZXNzYWdlLnBocFxuXG52YXIgSWZyYW1lVHJhbnNwb3J0ID0gZnVuY3Rpb24oKSB7fTtcblxuSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZS5pX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCwgYmFzZV91cmwpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5yaSA9IHJpO1xuICAgIHRoYXQub3JpZ2luID0gdXRpbHMuZ2V0T3JpZ2luKGJhc2VfdXJsKTtcbiAgICB0aGF0LmJhc2VfdXJsID0gYmFzZV91cmw7XG4gICAgdGhhdC50cmFuc191cmwgPSB0cmFuc191cmw7XG5cbiAgICB2YXIgaWZyYW1lX3VybCA9IGJhc2VfdXJsICsgJy9pZnJhbWUuaHRtbCc7XG4gICAgaWYgKHRoYXQucmkuX29wdGlvbnMuZGV2ZWwpIHtcbiAgICAgICAgaWZyYW1lX3VybCArPSAnP3Q9JyArICgrbmV3IERhdGUpO1xuICAgIH1cbiAgICB0aGF0LndpbmRvd19pZCA9IHV0aWxzLnJhbmRvbV9zdHJpbmcoOCk7XG4gICAgaWZyYW1lX3VybCArPSAnIycgKyB0aGF0LndpbmRvd19pZDtcblxuICAgIHRoYXQuaWZyYW1lT2JqID0gdXRpbHMuY3JlYXRlSWZyYW1lKGlmcmFtZV91cmwsIGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yaS5fZGlkQ2xvc2UoMTAwNiwgXCJVbmFibGUgdG8gbG9hZCBhbiBpZnJhbWUgKFwiICsgciArIFwiKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgIHRoYXQub25tZXNzYWdlX2NiID0gdXRpbHMuYmluZCh0aGF0Lm9ubWVzc2FnZSwgdGhhdCk7XG4gICAgdXRpbHMuYXR0YWNoTWVzc2FnZSh0aGF0Lm9ubWVzc2FnZV9jYik7XG59O1xuXG5JZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlLmRvQ2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5pZnJhbWVPYmopIHtcbiAgICAgICAgdXRpbHMuZGV0YWNoTWVzc2FnZSh0aGF0Lm9ubWVzc2FnZV9jYik7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgbm90IGxvYWRlZCwgSUUgcmFpc2VzIGFuIGV4Y2VwdGlvblxuICAgICAgICAgICAgLy8gb24gJ2NvbnRlbnRXaW5kb3cnLlxuICAgICAgICAgICAgaWYgKHRoYXQuaWZyYW1lT2JqLmlmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICAgICAgdGhhdC5wb3N0TWVzc2FnZSgnYycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoICh4KSB7fVxuICAgICAgICB0aGF0LmlmcmFtZU9iai5jbGVhbnVwKCk7XG4gICAgICAgIHRoYXQuaWZyYW1lT2JqID0gbnVsbDtcbiAgICAgICAgdGhhdC5vbm1lc3NhZ2VfY2IgPSB0aGF0LmlmcmFtZU9iaiA9IG51bGw7XG4gICAgfVxufTtcblxuSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZS5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmIChlLm9yaWdpbiAhPT0gdGhhdC5vcmlnaW4pIHJldHVybjtcbiAgICB2YXIgd2luZG93X2lkID0gZS5kYXRhLnNsaWNlKDAsIDgpO1xuICAgIHZhciB0eXBlID0gZS5kYXRhLnNsaWNlKDgsIDkpO1xuICAgIHZhciBkYXRhID0gZS5kYXRhLnNsaWNlKDkpO1xuXG4gICAgaWYgKHdpbmRvd19pZCAhPT0gdGhhdC53aW5kb3dfaWQpIHJldHVybjtcblxuICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSAncyc6XG4gICAgICAgIHRoYXQuaWZyYW1lT2JqLmxvYWRlZCgpO1xuICAgICAgICB0aGF0LnBvc3RNZXNzYWdlKCdzJywgSlNPTi5zdHJpbmdpZnkoW1NvY2tKUy52ZXJzaW9uLCB0aGF0LnByb3RvY29sLCB0aGF0LnRyYW5zX3VybCwgdGhhdC5iYXNlX3VybF0pKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSAndCc6XG4gICAgICAgIHRoYXQucmkuX2RpZE1lc3NhZ2UoZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbklmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUucG9zdE1lc3NhZ2UgPSBmdW5jdGlvbih0eXBlLCBkYXRhKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQuaWZyYW1lT2JqLnBvc3QodGhhdC53aW5kb3dfaWQgKyB0eXBlICsgKGRhdGEgfHwgJycpLCB0aGF0Lm9yaWdpbik7XG59O1xuXG5JZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlLmRvU2VuZCA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgdGhpcy5wb3N0TWVzc2FnZSgnbScsIG1lc3NhZ2UpO1xufTtcblxuSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBwb3N0TWVzc2FnZSBtaXNiZWhhdmVzIGluIGtvbnF1ZXJvciA0LjYuNSAtIHRoZSBtZXNzYWdlcyBhcmUgZGVsaXZlcmVkIHdpdGhcbiAgICAvLyBodWdlIGRlbGF5LCBvciBub3QgYXQgYWxsLlxuICAgIHZhciBrb25xdWVyb3IgPSBuYXZpZ2F0b3IgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0tvbnF1ZXJvcicpICE9PSAtMTtcbiAgICByZXR1cm4gKCh0eXBlb2YgX3dpbmRvdy5wb3N0TWVzc2FnZSA9PT0gJ2Z1bmN0aW9uJyB8fFxuICAgICAgICAgICAgdHlwZW9mIF93aW5kb3cucG9zdE1lc3NhZ2UgPT09ICdvYmplY3QnKSAmJiAoIWtvbnF1ZXJvcikpO1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtaWZyYW1lLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1pZnJhbWUtd2l0aGluLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgY3Vycl93aW5kb3dfaWQ7XG5cbnZhciBwb3N0TWVzc2FnZSA9IGZ1bmN0aW9uICh0eXBlLCBkYXRhKSB7XG4gICAgaWYocGFyZW50ICE9PSBfd2luZG93KSB7XG4gICAgICAgIHBhcmVudC5wb3N0TWVzc2FnZShjdXJyX3dpbmRvd19pZCArIHR5cGUgKyAoZGF0YSB8fCAnJyksICcqJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXRpbHMubG9nKFwiQ2FuJ3QgcG9zdE1lc3NhZ2UsIG5vIHBhcmVudCB3aW5kb3cuXCIsIHR5cGUsIGRhdGEpO1xuICAgIH1cbn07XG5cbnZhciBGYWNhZGVKUyA9IGZ1bmN0aW9uKCkge307XG5GYWNhZGVKUy5wcm90b3R5cGUuX2RpZENsb3NlID0gZnVuY3Rpb24gKGNvZGUsIHJlYXNvbikge1xuICAgIHBvc3RNZXNzYWdlKCd0JywgdXRpbHMuY2xvc2VGcmFtZShjb2RlLCByZWFzb24pKTtcbn07XG5GYWNhZGVKUy5wcm90b3R5cGUuX2RpZE1lc3NhZ2UgPSBmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICBwb3N0TWVzc2FnZSgndCcsIGZyYW1lKTtcbn07XG5GYWNhZGVKUy5wcm90b3R5cGUuX2RvU2VuZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdGhpcy5fdHJhbnNwb3J0LmRvU2VuZChkYXRhKTtcbn07XG5GYWNhZGVKUy5wcm90b3R5cGUuX2RvQ2xlYW51cCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl90cmFuc3BvcnQuZG9DbGVhbnVwKCk7XG59O1xuXG51dGlscy5wYXJlbnRfb3JpZ2luID0gdW5kZWZpbmVkO1xuXG5Tb2NrSlMuYm9vdHN0cmFwX2lmcmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmYWNhZGU7XG4gICAgY3Vycl93aW5kb3dfaWQgPSBfZG9jdW1lbnQubG9jYXRpb24uaGFzaC5zbGljZSgxKTtcbiAgICB2YXIgb25NZXNzYWdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZihlLnNvdXJjZSAhPT0gcGFyZW50KSByZXR1cm47XG4gICAgICAgIGlmKHR5cGVvZiB1dGlscy5wYXJlbnRfb3JpZ2luID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIHV0aWxzLnBhcmVudF9vcmlnaW4gPSBlLm9yaWdpbjtcbiAgICAgICAgaWYgKGUub3JpZ2luICE9PSB1dGlscy5wYXJlbnRfb3JpZ2luKSByZXR1cm47XG5cbiAgICAgICAgdmFyIHdpbmRvd19pZCA9IGUuZGF0YS5zbGljZSgwLCA4KTtcbiAgICAgICAgdmFyIHR5cGUgPSBlLmRhdGEuc2xpY2UoOCwgOSk7XG4gICAgICAgIHZhciBkYXRhID0gZS5kYXRhLnNsaWNlKDkpO1xuICAgICAgICBpZiAod2luZG93X2lkICE9PSBjdXJyX3dpbmRvd19pZCkgcmV0dXJuO1xuICAgICAgICBzd2l0Y2godHlwZSkge1xuICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgIHZhciBwID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gcFswXTtcbiAgICAgICAgICAgIHZhciBwcm90b2NvbCA9IHBbMV07XG4gICAgICAgICAgICB2YXIgdHJhbnNfdXJsID0gcFsyXTtcbiAgICAgICAgICAgIHZhciBiYXNlX3VybCA9IHBbM107XG4gICAgICAgICAgICBpZiAodmVyc2lvbiAhPT0gU29ja0pTLnZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coXCJJbmNvbXBhdGliaWxlIFNvY2tKUyEgTWFpbiBzaXRlIHVzZXM6XCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcXFwiXCIgKyB2ZXJzaW9uICsgXCJcXFwiLCB0aGUgaWZyYW1lOlwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXFxcIlwiICsgU29ja0pTLnZlcnNpb24gKyBcIlxcXCIuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF1dGlscy5mbGF0VXJsKHRyYW5zX3VybCkgfHwgIXV0aWxzLmZsYXRVcmwoYmFzZV91cmwpKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMubG9nKFwiT25seSBiYXNpYyB1cmxzIGFyZSBzdXBwb3J0ZWQgaW4gU29ja0pTXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF1dGlscy5pc1NhbWVPcmlnaW5VcmwodHJhbnNfdXJsKSB8fFxuICAgICAgICAgICAgICAgICF1dGlscy5pc1NhbWVPcmlnaW5VcmwoYmFzZV91cmwpKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMubG9nKFwiQ2FuJ3QgY29ubmVjdCB0byBkaWZmZXJlbnQgZG9tYWluIGZyb20gd2l0aGluIGFuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZnJhbWUuIChcIiArIEpTT04uc3RyaW5naWZ5KFtfd2luZG93LmxvY2F0aW9uLmhyZWYsIHRyYW5zX3VybCwgYmFzZV91cmxdKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFwiKVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmYWNhZGUgPSBuZXcgRmFjYWRlSlMoKTtcbiAgICAgICAgICAgIGZhY2FkZS5fdHJhbnNwb3J0ID0gbmV3IEZhY2FkZUpTW3Byb3RvY29sXShmYWNhZGUsIHRyYW5zX3VybCwgYmFzZV91cmwpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ20nOlxuICAgICAgICAgICAgZmFjYWRlLl9kb1NlbmQoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYyc6XG4gICAgICAgICAgICBpZiAoZmFjYWRlKVxuICAgICAgICAgICAgICAgIGZhY2FkZS5fZG9DbGVhbnVwKCk7XG4gICAgICAgICAgICBmYWNhZGUgPSBudWxsO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gYWxlcnQoJ3Rlc3QgdGlja2VyJyk7XG4gICAgLy8gZmFjYWRlID0gbmV3IEZhY2FkZUpTKCk7XG4gICAgLy8gZmFjYWRlLl90cmFuc3BvcnQgPSBuZXcgRmFjYWRlSlNbJ3ctaWZyYW1lLXhoci1wb2xsaW5nJ10oZmFjYWRlLCAnaHR0cDovL2hvc3QuY29tOjk5OTkvdGlja2VyLzEyL2Jhc2QnKTtcblxuICAgIHV0aWxzLmF0dGFjaE1lc3NhZ2Uob25NZXNzYWdlKTtcblxuICAgIC8vIFN0YXJ0XG4gICAgcG9zdE1lc3NhZ2UoJ3MnKTtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLWlmcmFtZS13aXRoaW4uanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL2luZm8uanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBJbmZvUmVjZWl2ZXIgPSBmdW5jdGlvbihiYXNlX3VybCwgQWpheE9iamVjdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB1dGlscy5kZWxheShmdW5jdGlvbigpe3RoYXQuZG9YaHIoYmFzZV91cmwsIEFqYXhPYmplY3QpO30pO1xufTtcblxuSW5mb1JlY2VpdmVyLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoWydmaW5pc2gnXSk7XG5cbkluZm9SZWNlaXZlci5wcm90b3R5cGUuZG9YaHIgPSBmdW5jdGlvbihiYXNlX3VybCwgQWpheE9iamVjdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgdDAgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgIHZhciB4byA9IG5ldyBBamF4T2JqZWN0KCdHRVQnLCBiYXNlX3VybCArICcvaW5mbycpO1xuXG4gICAgdmFyIHRyZWYgPSB1dGlscy5kZWxheSg4MDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oKXt4by5vbnRpbWVvdXQoKTt9KTtcblxuICAgIHhvLm9uZmluaXNoID0gZnVuY3Rpb24oc3RhdHVzLCB0ZXh0KSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0cmVmKTtcbiAgICAgICAgdHJlZiA9IG51bGw7XG4gICAgICAgIGlmIChzdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgdmFyIHJ0dCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgLSB0MDtcbiAgICAgICAgICAgIHZhciBpbmZvID0gSlNPTi5wYXJzZSh0ZXh0KTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5mbyAhPT0gJ29iamVjdCcpIGluZm8gPSB7fTtcbiAgICAgICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJywgaW5mbywgcnR0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHhvLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB4by5jbG9zZSgpO1xuICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcpO1xuICAgIH07XG59O1xuXG52YXIgSW5mb1JlY2VpdmVySWZyYW1lID0gZnVuY3Rpb24oYmFzZV91cmwpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGdvID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZnIgPSBuZXcgSWZyYW1lVHJhbnNwb3J0KCk7XG4gICAgICAgIGlmci5wcm90b2NvbCA9ICd3LWlmcmFtZS1pbmZvLXJlY2VpdmVyJztcbiAgICAgICAgdmFyIGZ1biA9IGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gJ3N0cmluZycgJiYgci5zdWJzdHIoMCwxKSA9PT0gJ20nKSB7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSBKU09OLnBhcnNlKHIuc3Vic3RyKDEpKTtcbiAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IGRbMF0sIHJ0dCA9IGRbMV07XG4gICAgICAgICAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCBpbmZvLCBydHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWZyLmRvQ2xlYW51cCgpO1xuICAgICAgICAgICAgaWZyID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG1vY2tfcmkgPSB7XG4gICAgICAgICAgICBfb3B0aW9uczoge30sXG4gICAgICAgICAgICBfZGlkQ2xvc2U6IGZ1bixcbiAgICAgICAgICAgIF9kaWRNZXNzYWdlOiBmdW5cbiAgICAgICAgfTtcbiAgICAgICAgaWZyLmlfY29uc3RydWN0b3IobW9ja19yaSwgYmFzZV91cmwsIGJhc2VfdXJsKTtcbiAgICB9XG4gICAgaWYoIV9kb2N1bWVudC5ib2R5KSB7XG4gICAgICAgIHV0aWxzLmF0dGFjaEV2ZW50KCdsb2FkJywgZ28pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGdvKCk7XG4gICAgfVxufTtcbkluZm9SZWNlaXZlcklmcmFtZS5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKFsnZmluaXNoJ10pO1xuXG5cbnZhciBJbmZvUmVjZWl2ZXJGYWtlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gSXQgbWF5IG5vdCBiZSBwb3NzaWJsZSB0byBkbyBjcm9zcyBkb21haW4gQUpBWCB0byBnZXQgdGhlIGluZm9cbiAgICAvLyBkYXRhLCBmb3IgZXhhbXBsZSBmb3IgSUU3LiBCdXQgd2Ugd2FudCB0byBydW4gSlNPTlAsIHNvIGxldCdzXG4gICAgLy8gZmFrZSB0aGUgcmVzcG9uc2UsIHdpdGggcnR0PTJzIChydG89NnMpLlxuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB1dGlscy5kZWxheShmdW5jdGlvbigpIHtcbiAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCB7fSwgMjAwMCk7XG4gICAgfSk7XG59O1xuSW5mb1JlY2VpdmVyRmFrZS5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKFsnZmluaXNoJ10pO1xuXG52YXIgY3JlYXRlSW5mb1JlY2VpdmVyID0gZnVuY3Rpb24oYmFzZV91cmwpIHtcbiAgICBpZiAodXRpbHMuaXNTYW1lT3JpZ2luVXJsKGJhc2VfdXJsKSkge1xuICAgICAgICAvLyBJZiwgZm9yIHNvbWUgcmVhc29uLCB3ZSBoYXZlIFNvY2tKUyBsb2NhbGx5IC0gdGhlcmUncyBub1xuICAgICAgICAvLyBuZWVkIHRvIHN0YXJ0IHVwIHRoZSBjb21wbGV4IG1hY2hpbmVyeS4gSnVzdCB1c2UgYWpheC5cbiAgICAgICAgcmV0dXJuIG5ldyBJbmZvUmVjZWl2ZXIoYmFzZV91cmwsIHV0aWxzLlhIUkxvY2FsT2JqZWN0KTtcbiAgICB9XG4gICAgc3dpdGNoICh1dGlscy5pc1hIUkNvcnNDYXBhYmxlKCkpIHtcbiAgICBjYXNlIDE6XG4gICAgICAgIHJldHVybiBuZXcgSW5mb1JlY2VpdmVyKGJhc2VfdXJsLCB1dGlscy5YSFJDb3JzT2JqZWN0KTtcbiAgICBjYXNlIDI6XG4gICAgICAgIHJldHVybiBuZXcgSW5mb1JlY2VpdmVyKGJhc2VfdXJsLCB1dGlscy5YRFJPYmplY3QpO1xuICAgIGNhc2UgMzpcbiAgICAgICAgLy8gT3BlcmFcbiAgICAgICAgcmV0dXJuIG5ldyBJbmZvUmVjZWl2ZXJJZnJhbWUoYmFzZV91cmwpO1xuICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIElFIDdcbiAgICAgICAgcmV0dXJuIG5ldyBJbmZvUmVjZWl2ZXJGYWtlKCk7XG4gICAgfTtcbn07XG5cblxudmFyIFdJbmZvUmVjZWl2ZXJJZnJhbWUgPSBGYWNhZGVKU1sndy1pZnJhbWUtaW5mby1yZWNlaXZlciddID0gZnVuY3Rpb24ocmksIF90cmFuc191cmwsIGJhc2VfdXJsKSB7XG4gICAgdmFyIGlyID0gbmV3IEluZm9SZWNlaXZlcihiYXNlX3VybCwgdXRpbHMuWEhSTG9jYWxPYmplY3QpO1xuICAgIGlyLm9uZmluaXNoID0gZnVuY3Rpb24oaW5mbywgcnR0KSB7XG4gICAgICAgIHJpLl9kaWRNZXNzYWdlKCdtJytKU09OLnN0cmluZ2lmeShbaW5mbywgcnR0XSkpO1xuICAgICAgICByaS5fZGlkQ2xvc2UoKTtcbiAgICB9XG59O1xuV0luZm9SZWNlaXZlcklmcmFtZS5wcm90b3R5cGUuZG9DbGVhbnVwID0gZnVuY3Rpb24oKSB7fTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvaW5mby5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtaWZyYW1lLWV2ZW50c291cmNlLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgRXZlbnRTb3VyY2VJZnJhbWVUcmFuc3BvcnQgPSBTb2NrSlNbJ2lmcmFtZS1ldmVudHNvdXJjZSddID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnByb3RvY29sID0gJ3ctaWZyYW1lLWV2ZW50c291cmNlJztcbiAgICB0aGF0LmlfY29uc3RydWN0b3IuYXBwbHkodGhhdCwgYXJndW1lbnRzKTtcbn07XG5cbkV2ZW50U291cmNlSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBJZnJhbWVUcmFuc3BvcnQoKTtcblxuRXZlbnRTb3VyY2VJZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKCdFdmVudFNvdXJjZScgaW4gX3dpbmRvdykgJiYgSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQoKTtcbn07XG5cbkV2ZW50U291cmNlSWZyYW1lVHJhbnNwb3J0Lm5lZWRfYm9keSA9IHRydWU7XG5FdmVudFNvdXJjZUlmcmFtZVRyYW5zcG9ydC5yb3VuZFRyaXBzID0gMzsgLy8gaHRtbCwgamF2YXNjcmlwdCwgZXZlbnRzb3VyY2VcblxuXG4vLyB3LWlmcmFtZS1ldmVudHNvdXJjZVxudmFyIEV2ZW50U291cmNlVHJhbnNwb3J0ID0gRmFjYWRlSlNbJ3ctaWZyYW1lLWV2ZW50c291cmNlJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy9ldmVudHNvdXJjZScsIEV2ZW50U291cmNlUmVjZWl2ZXIsIHV0aWxzLlhIUkxvY2FsT2JqZWN0KTtcbn1cbkV2ZW50U291cmNlVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBBamF4QmFzZWRUcmFuc3BvcnQoKTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtaWZyYW1lLWV2ZW50c291cmNlLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1pZnJhbWUteGhyLXBvbGxpbmcuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBYaHJQb2xsaW5nSWZyYW1lVHJhbnNwb3J0ID0gU29ja0pTWydpZnJhbWUteGhyLXBvbGxpbmcnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5wcm90b2NvbCA9ICd3LWlmcmFtZS14aHItcG9sbGluZyc7XG4gICAgdGhhdC5pX2NvbnN0cnVjdG9yLmFwcGx5KHRoYXQsIGFyZ3VtZW50cyk7XG59O1xuXG5YaHJQb2xsaW5nSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBJZnJhbWVUcmFuc3BvcnQoKTtcblxuWGhyUG9sbGluZ0lmcmFtZVRyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfd2luZG93LlhNTEh0dHBSZXF1ZXN0ICYmIElmcmFtZVRyYW5zcG9ydC5lbmFibGVkKCk7XG59O1xuXG5YaHJQb2xsaW5nSWZyYW1lVHJhbnNwb3J0Lm5lZWRfYm9keSA9IHRydWU7XG5YaHJQb2xsaW5nSWZyYW1lVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAzOyAvLyBodG1sLCBqYXZhc2NyaXB0LCB4aHJcblxuXG4vLyB3LWlmcmFtZS14aHItcG9sbGluZ1xudmFyIFhoclBvbGxpbmdJVHJhbnNwb3J0ID0gRmFjYWRlSlNbJ3ctaWZyYW1lLXhoci1wb2xsaW5nJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy94aHInLCBYaHJSZWNlaXZlciwgdXRpbHMuWEhSTG9jYWxPYmplY3QpO1xufTtcblxuWGhyUG9sbGluZ0lUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1pZnJhbWUteGhyLXBvbGxpbmcuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWlmcmFtZS1odG1sZmlsZS5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLy8gVGhpcyB0cmFuc3BvcnQgZ2VuZXJhbGx5IHdvcmtzIGluIGFueSBicm93c2VyLCBidXQgd2lsbCBjYXVzZSBhXG4vLyBzcGlubmluZyBjdXJzb3IgdG8gYXBwZWFyIGluIGFueSBicm93c2VyIG90aGVyIHRoYW4gSUUuXG4vLyBXZSBtYXkgdGVzdCB0aGlzIHRyYW5zcG9ydCBpbiBhbGwgYnJvd3NlcnMgLSB3aHkgbm90LCBidXQgaW5cbi8vIHByb2R1Y3Rpb24gaXQgc2hvdWxkIGJlIG9ubHkgcnVuIGluIElFLlxuXG52YXIgSHRtbEZpbGVJZnJhbWVUcmFuc3BvcnQgPSBTb2NrSlNbJ2lmcmFtZS1odG1sZmlsZSddID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnByb3RvY29sID0gJ3ctaWZyYW1lLWh0bWxmaWxlJztcbiAgICB0aGF0LmlfY29uc3RydWN0b3IuYXBwbHkodGhhdCwgYXJndW1lbnRzKTtcbn07XG5cbi8vIEluaGVyaXRhbmNlLlxuSHRtbEZpbGVJZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IElmcmFtZVRyYW5zcG9ydCgpO1xuXG5IdG1sRmlsZUlmcmFtZVRyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIElmcmFtZVRyYW5zcG9ydC5lbmFibGVkKCk7XG59O1xuXG5IdG1sRmlsZUlmcmFtZVRyYW5zcG9ydC5uZWVkX2JvZHkgPSB0cnVlO1xuSHRtbEZpbGVJZnJhbWVUcmFuc3BvcnQucm91bmRUcmlwcyA9IDM7IC8vIGh0bWwsIGphdmFzY3JpcHQsIGh0bWxmaWxlXG5cblxuLy8gdy1pZnJhbWUtaHRtbGZpbGVcbnZhciBIdG1sRmlsZVRyYW5zcG9ydCA9IEZhY2FkZUpTWyd3LWlmcmFtZS1odG1sZmlsZSddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHRoaXMucnVuKHJpLCB0cmFuc191cmwsICcvaHRtbGZpbGUnLCBIdG1sZmlsZVJlY2VpdmVyLCB1dGlscy5YSFJMb2NhbE9iamVjdCk7XG59O1xuSHRtbEZpbGVUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1pZnJhbWUtaHRtbGZpbGUuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLXBvbGxpbmcuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBQb2xsaW5nID0gZnVuY3Rpb24ocmksIFJlY2VpdmVyLCByZWN2X3VybCwgQWpheE9iamVjdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnJpID0gcmk7XG4gICAgdGhhdC5SZWNlaXZlciA9IFJlY2VpdmVyO1xuICAgIHRoYXQucmVjdl91cmwgPSByZWN2X3VybDtcbiAgICB0aGF0LkFqYXhPYmplY3QgPSBBamF4T2JqZWN0O1xuICAgIHRoYXQuX3NjaGVkdWxlUmVjdigpO1xufTtcblxuUG9sbGluZy5wcm90b3R5cGUuX3NjaGVkdWxlUmVjdiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgcG9sbCA9IHRoYXQucG9sbCA9IG5ldyB0aGF0LlJlY2VpdmVyKHRoYXQucmVjdl91cmwsIHRoYXQuQWpheE9iamVjdCk7XG4gICAgdmFyIG1zZ19jb3VudGVyID0gMDtcbiAgICBwb2xsLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgbXNnX2NvdW50ZXIgKz0gMTtcbiAgICAgICAgdGhhdC5yaS5fZGlkTWVzc2FnZShlLmRhdGEpO1xuICAgIH07XG4gICAgcG9sbC5vbmNsb3NlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGF0LnBvbGwgPSBwb2xsID0gcG9sbC5vbm1lc3NhZ2UgPSBwb2xsLm9uY2xvc2UgPSBudWxsO1xuICAgICAgICBpZiAoIXRoYXQucG9sbF9pc19jbG9zaW5nKSB7XG4gICAgICAgICAgICBpZiAoZS5yZWFzb24gPT09ICdwZXJtYW5lbnQnKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5yaS5fZGlkQ2xvc2UoMTAwNiwgJ1BvbGxpbmcgZXJyb3IgKCcgKyBlLnJlYXNvbiArICcpJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoYXQuX3NjaGVkdWxlUmVjdigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn07XG5cblBvbGxpbmcucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucG9sbF9pc19jbG9zaW5nID0gdHJ1ZTtcbiAgICBpZiAodGhhdC5wb2xsKSB7XG4gICAgICAgIHRoYXQucG9sbC5hYm9ydCgpO1xuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXBvbGxpbmcuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLXJlY2VpdmVyLWV2ZW50c291cmNlLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgRXZlbnRTb3VyY2VSZWNlaXZlciA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgZXMgPSBuZXcgRXZlbnRTb3VyY2UodXJsKTtcbiAgICBlcy5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ21lc3NhZ2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsnZGF0YSc6IHVuZXNjYXBlKGUuZGF0YSl9KSk7XG4gICAgfTtcbiAgICB0aGF0LmVzX2Nsb3NlID0gZXMub25lcnJvciA9IGZ1bmN0aW9uKGUsIGFib3J0X3JlYXNvbikge1xuICAgICAgICAvLyBFUyBvbiByZWNvbm5lY3Rpb24gaGFzIHJlYWR5U3RhdGUgPSAwIG9yIDEuXG4gICAgICAgIC8vIG9uIG5ldHdvcmsgZXJyb3IgaXQncyBDTE9TRUQgPSAyXG4gICAgICAgIHZhciByZWFzb24gPSBhYm9ydF9yZWFzb24gPyAndXNlcicgOlxuICAgICAgICAgICAgKGVzLnJlYWR5U3RhdGUgIT09IDIgPyAnbmV0d29yaycgOiAncGVybWFuZW50Jyk7XG4gICAgICAgIHRoYXQuZXNfY2xvc2UgPSBlcy5vbm1lc3NhZ2UgPSBlcy5vbmVycm9yID0gbnVsbDtcbiAgICAgICAgLy8gRXZlbnRTb3VyY2UgcmVjb25uZWN0cyBhdXRvbWF0aWNhbGx5LlxuICAgICAgICBlcy5jbG9zZSgpO1xuICAgICAgICBlcyA9IG51bGw7XG4gICAgICAgIC8vIFNhZmFyaSBhbmQgY2hyb21lIDwgMTUgY3Jhc2ggaWYgd2UgY2xvc2Ugd2luZG93IGJlZm9yZVxuICAgICAgICAvLyB3YWl0aW5nIGZvciBFUyBjbGVhbnVwLiBTZWU6XG4gICAgICAgIC8vICAgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTg5MTU1XG4gICAgICAgIHV0aWxzLmRlbGF5KDIwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdjbG9zZScsIHtyZWFzb246IHJlYXNvbn0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgfTtcbn07XG5cbkV2ZW50U291cmNlUmVjZWl2ZXIucHJvdG90eXBlID0gbmV3IFJFdmVudFRhcmdldCgpO1xuXG5FdmVudFNvdXJjZVJlY2VpdmVyLnByb3RvdHlwZS5hYm9ydCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5lc19jbG9zZSkge1xuICAgICAgICB0aGF0LmVzX2Nsb3NlKHt9LCB0cnVlKTtcbiAgICB9XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1yZWNlaXZlci1ldmVudHNvdXJjZS5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtcmVjZWl2ZXItaHRtbGZpbGUuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBfaXNfaWVfaHRtbGZpbGVfY2FwYWJsZTtcbnZhciBpc0llSHRtbGZpbGVDYXBhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKF9pc19pZV9odG1sZmlsZV9jYXBhYmxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKCdBY3RpdmVYT2JqZWN0JyBpbiBfd2luZG93KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIF9pc19pZV9odG1sZmlsZV9jYXBhYmxlID0gISFuZXcgQWN0aXZlWE9iamVjdCgnaHRtbGZpbGUnKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKHgpIHt9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfaXNfaWVfaHRtbGZpbGVfY2FwYWJsZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfaXNfaWVfaHRtbGZpbGVfY2FwYWJsZTtcbn07XG5cblxudmFyIEh0bWxmaWxlUmVjZWl2ZXIgPSBmdW5jdGlvbih1cmwpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdXRpbHMucG9sbHV0ZUdsb2JhbE5hbWVzcGFjZSgpO1xuXG4gICAgdGhhdC5pZCA9ICdhJyArIHV0aWxzLnJhbmRvbV9zdHJpbmcoNiwgMjYpO1xuICAgIHVybCArPSAoKHVybC5pbmRleE9mKCc/JykgPT09IC0xKSA/ICc/JyA6ICcmJykgK1xuICAgICAgICAnYz0nICsgZXNjYXBlKFdQcmVmaXggKyAnLicgKyB0aGF0LmlkKTtcblxuICAgIHZhciBjb25zdHJ1Y3RvciA9IGlzSWVIdG1sZmlsZUNhcGFibGUoKSA/XG4gICAgICAgIHV0aWxzLmNyZWF0ZUh0bWxmaWxlIDogdXRpbHMuY3JlYXRlSWZyYW1lO1xuXG4gICAgdmFyIGlmcmFtZU9iajtcbiAgICBfd2luZG93W1dQcmVmaXhdW3RoYXQuaWRdID0ge1xuICAgICAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWZyYW1lT2JqLmxvYWRlZCgpO1xuICAgICAgICB9LFxuICAgICAgICBtZXNzYWdlOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnbWVzc2FnZScsIHsnZGF0YSc6IGRhdGF9KSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuaWZyYW1lX2Nsb3NlKHt9LCAnbmV0d29yaycpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGF0LmlmcmFtZV9jbG9zZSA9IGZ1bmN0aW9uKGUsIGFib3J0X3JlYXNvbikge1xuICAgICAgICBpZnJhbWVPYmouY2xlYW51cCgpO1xuICAgICAgICB0aGF0LmlmcmFtZV9jbG9zZSA9IGlmcmFtZU9iaiA9IG51bGw7XG4gICAgICAgIGRlbGV0ZSBfd2luZG93W1dQcmVmaXhdW3RoYXQuaWRdO1xuICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdjbG9zZScsIHtyZWFzb246IGFib3J0X3JlYXNvbn0pKTtcbiAgICB9O1xuICAgIGlmcmFtZU9iaiA9IGNvbnN0cnVjdG9yKHVybCwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmlmcmFtZV9jbG9zZSh7fSwgJ3Blcm1hbmVudCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xufTtcblxuSHRtbGZpbGVSZWNlaXZlci5wcm90b3R5cGUgPSBuZXcgUkV2ZW50VGFyZ2V0KCk7XG5cbkh0bWxmaWxlUmVjZWl2ZXIucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LmlmcmFtZV9jbG9zZSkge1xuICAgICAgICB0aGF0LmlmcmFtZV9jbG9zZSh7fSwgJ3VzZXInKTtcbiAgICB9XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1yZWNlaXZlci1odG1sZmlsZS5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtcmVjZWl2ZXIteGhyLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgWGhyUmVjZWl2ZXIgPSBmdW5jdGlvbih1cmwsIEFqYXhPYmplY3QpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGJ1Zl9wb3MgPSAwO1xuXG4gICAgdGhhdC54byA9IG5ldyBBamF4T2JqZWN0KCdQT1NUJywgdXJsLCBudWxsKTtcbiAgICB0aGF0LnhvLm9uY2h1bmsgPSBmdW5jdGlvbihzdGF0dXMsIHRleHQpIHtcbiAgICAgICAgaWYgKHN0YXR1cyAhPT0gMjAwKSByZXR1cm47XG4gICAgICAgIHdoaWxlICgxKSB7XG4gICAgICAgICAgICB2YXIgYnVmID0gdGV4dC5zbGljZShidWZfcG9zKTtcbiAgICAgICAgICAgIHZhciBwID0gYnVmLmluZGV4T2YoJ1xcbicpO1xuICAgICAgICAgICAgaWYgKHAgPT09IC0xKSBicmVhaztcbiAgICAgICAgICAgIGJ1Zl9wb3MgKz0gcCsxO1xuICAgICAgICAgICAgdmFyIG1zZyA9IGJ1Zi5zbGljZSgwLCBwKTtcbiAgICAgICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ21lc3NhZ2UnLCB7ZGF0YTogbXNnfSkpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGF0LnhvLm9uZmluaXNoID0gZnVuY3Rpb24oc3RhdHVzLCB0ZXh0KSB7XG4gICAgICAgIHRoYXQueG8ub25jaHVuayhzdGF0dXMsIHRleHQpO1xuICAgICAgICB0aGF0LnhvID0gbnVsbDtcbiAgICAgICAgdmFyIHJlYXNvbiA9IHN0YXR1cyA9PT0gMjAwID8gJ25ldHdvcmsnIDogJ3Blcm1hbmVudCc7XG4gICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ2Nsb3NlJywge3JlYXNvbjogcmVhc29ufSkpO1xuICAgIH1cbn07XG5cblhoclJlY2VpdmVyLnByb3RvdHlwZSA9IG5ldyBSRXZlbnRUYXJnZXQoKTtcblxuWGhyUmVjZWl2ZXIucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnhvKSB7XG4gICAgICAgIHRoYXQueG8uY2xvc2UoKTtcbiAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnY2xvc2UnLCB7cmVhc29uOiAndXNlcid9KSk7XG4gICAgICAgIHRoYXQueG8gPSBudWxsO1xuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXJlY2VpdmVyLXhoci5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdGVzdC1ob29rcy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLy8gRm9yIHRlc3RpbmdcblNvY2tKUy5nZXRVdGlscyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHV0aWxzO1xufTtcblxuU29ja0pTLmdldElmcmFtZVRyYW5zcG9ydCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIElmcmFtZVRyYW5zcG9ydDtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3Rlc3QtaG9va3MuanNcblxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFNvY2tKUztcbiAgICAgICAgICB9KSgpO1xuaWYgKCdfc29ja2pzX29ubG9hZCcgaW4gd2luZG93KSBzZXRUaW1lb3V0KF9zb2NranNfb25sb2FkLCAxKTtcblxuLy8gQU1EIGNvbXBsaWFuY2VcbmlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ3NvY2tqcycsIFtdLCBmdW5jdGlvbigpe3JldHVybiBTb2NrSlM7fSk7XG59XG5cbmlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFNvY2tKUztcbn1cbi8vICAgICBbKl0gRW5kIG9mIGxpYi9pbmRleC5qc1xuXG4vLyBbKl0gRW5kIG9mIGxpYi9hbGwuanNcblxuXG59KSgpIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe3ZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcbnZhciBpID0gcmVxdWlyZSgnaXRlcmF0ZScpXG52YXIgZHVwbGV4ID0gcmVxdWlyZSgnZHVwbGV4JylcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ3V0aWwnKS5pbmhlcml0c1xudmFyIHNlcmlhbGl6ZXIgPSByZXF1aXJlKCdzdHJlYW0tc2VyaWFsaXplcicpXG52YXIgdSA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgdGltZXN0YW1wID0gcmVxdWlyZSgnbW9ub3RvbmljLXRpbWVzdGFtcCcpXG5cbmV4cG9ydHMgPSBcbm1vZHVsZS5leHBvcnRzID0gU2N1dHRsZWJ1dHRcblxuZXhwb3J0cy5jcmVhdGVJRCA9IHUuY3JlYXRlSURcbmV4cG9ydHMudXBkYXRlSXNSZWNlbnQgPSB1LmZpbHRlclxuZXhwb3J0cy5maWx0ZXIgPSB1LmZpbHRlclxuZXhwb3J0cy50aW1lc3RhbXAgPSB0aW1lc3RhbXBcblxuZnVuY3Rpb24gZHV0eU9mU3ViY2xhc3MoKSB7XG4gIHRocm93IG5ldyBFcnJvcignbWV0aG9kIG11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3MnKVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZSAoZGF0YSkge1xuICBpZighKEFycmF5LmlzQXJyYXkoZGF0YSkgXG4gICAgJiYgJ3N0cmluZycgPT09IHR5cGVvZiBkYXRhWzJdXG4gICAgJiYgJ19fcHJvdG9fXycgICAgICE9PSBkYXRhWzJdIC8vVEhJUyBXT1VMRCBCUkVBSyBTVFVGRlxuICAgICYmICdudW1iZXInID09PSB0eXBlb2YgZGF0YVsxXVxuICApKSByZXR1cm4gZmFsc2VcblxuICByZXR1cm4gdHJ1ZVxufVxuXG52YXIgZW1pdCA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdFxuXG5pbmhlcml0cyAoU2N1dHRsZWJ1dHQsIEV2ZW50RW1pdHRlcilcblxuZnVuY3Rpb24gU2N1dHRsZWJ1dHQgKG9wdHMpIHtcblxuICBpZighKHRoaXMgaW5zdGFuY2VvZiBTY3V0dGxlYnV0dCkpIHJldHVybiBuZXcgU2N1dHRsZWJ1dHQob3B0cylcbiAgdmFyIGlkID0gJ3N0cmluZycgPT09IHR5cGVvZiBvcHRzID8gb3B0cyA6IG9wdHMgJiYgb3B0cy5pZFxuICB0aGlzLnNvdXJjZXMgPSB7fVxuICB0aGlzLnNldE1heExpc3RlbmVycyhOdW1iZXIuTUFYX1ZBTFVFKVxuICAvL2NvdW50IGhvdyBtYW55IG90aGVyIGluc3RhbmNlcyB3ZSBhcmUgcmVwbGljYXRpbmcgdG8uXG4gIHRoaXMuX3N0cmVhbXMgPSAwXG4gIGlmKG9wdHMgJiYgb3B0cy5zaWduICYmIG9wdHMudmVyaWZ5KSB7XG4gICAgdGhpcy5zZXRJZChvcHRzLmlkIHx8IG9wdHMuY3JlYXRlSWQoKSlcbiAgICB0aGlzLl9zaWduICAgPSBvcHRzLnNpZ25cbiAgICB0aGlzLl92ZXJpZnkgPSBvcHRzLnZlcmlmeVxuICB9IGVsc2Uge1xuICAgIHRoaXMuc2V0SWQoaWQgfHwgdS5jcmVhdGVJZCgpKVxuICB9XG59XG5cbnZhciBzYiA9IFNjdXR0bGVidXR0LnByb3RvdHlwZVxuXG52YXIgZW1pdCA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdFxuXG5zYi5hcHBseVVwZGF0ZSA9IGR1dHlPZlN1YmNsYXNzXG5zYi5oaXN0b3J5ICAgICAgPSBkdXR5T2ZTdWJjbGFzc1xuXG5zYi5sb2NhbFVwZGF0ZSA9IGZ1bmN0aW9uICh0cngpIHtcbiAgdGhpcy5fdXBkYXRlKFt0cngsIHRpbWVzdGFtcCgpLCB0aGlzLmlkXSlcbiAgcmV0dXJuIHRoaXNcbn1cblxuc2IuX3VwZGF0ZSA9IGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgLy92YWxpZGF0ZWQgd2hlbiBpdCBjb21lcyBpbnRvIHRoZSBzdHJlYW1cbiAgdmFyIHRzID0gdXBkYXRlWzFdXG4gIHZhciBzb3VyY2UgPSB1cGRhdGVbMl1cbiAgLy9pZiB0aGlzIG1lc3NhZ2UgaXMgb2xkIGZvciBpdCdzIHNvdXJjZSxcbiAgLy9pZ25vcmUgaXQuIGl0J3Mgb3V0IG9mIG9yZGVyLlxuICAvL2VhY2ggbm9kZSBtdXN0IGVtaXQgaXQncyBjaGFuZ2VzIGluIG9yZGVyIVxuICBcbiAgdmFyIGxhdGVzdCA9IHRoaXMuc291cmNlc1tzb3VyY2VdXG4gIGlmKGxhdGVzdCAmJiBsYXRlc3QgPj0gdHMpXG4gICAgcmV0dXJuIGVtaXQuY2FsbCh0aGlzLCAnb2xkX2RhdGEnLCB1cGRhdGUpLCBmYWxzZVxuXG4gIHRoaXMuc291cmNlc1tzb3VyY2VdID0gdHNcblxuICB2YXIgc2VsZiA9IHRoaXNcbiAgZnVuY3Rpb24gZGlkVmVyaWZpY2F0aW9uIChlcnIsIHZlcmlmaWVkKSB7XG5cbiAgICAvLyBJJ20gbm90IHN1cmUgaG93IHdoYXQgc2hvdWxkIGhhcHBlbiBpZiBhIGFzeW5jIHZlcmlmaWNhdGlvblxuICAgIC8vIGVycm9ycy4gaWYgaXQncyBhbiBrZXkgbm90IGZvdW5kIC0gdGhhdCBpcyBhIHZlcmlmaWNhdGlvbiBmYWlsLFxuICAgIC8vIG5vdCBhIGVycm9yLiBpZiBpdCdzIGdlbnVuaWUgZXJyb3IsIHJlYWxseSB5b3Ugc2hvdWxkIHF1ZXVlIGFuZCBcbiAgICAvLyB0cnkgYWdhaW4/IG9yIHJlcGxheSB0aGUgbWVzc2FnZSBsYXRlclxuICAgIC8vIC0tIHRoaXMgc2hvdWxkIGJlIGRvbmUgbXkgdGhlIHNlY3VyaXR5IHBsdWdpbiB0aG91Z2gsIG5vdCBzY3V0dGxlYnV0dC5cblxuICAgIGlmKGVycilcbiAgICAgIHJldHVybiBlbWl0LmNhbGwoc2VsZiwgJ2Vycm9yJywgZXJyKVxuXG4gICAgaWYoIXZlcmlmaWVkKVxuICAgICAgcmV0dXJuIGVtaXQuY2FsbChzZWxmLCAndW52ZXJpZmllZF9kYXRhJywgdXBkYXRlKVxuXG4gICAgLy8gY2hlY2sgaWYgdGhpcyBtZXNzYWdlIGlzIG9sZGVyIHRoYW5cbiAgICAvLyB0aGUgdmFsdWUgd2UgYWxyZWFkeSBoYXZlLlxuICAgIC8vIGRvIG5vdGhpbmcgaWYgc29cbiAgICAvLyBlbWl0IGFuICdvbGRfZGF0YScgZXZlbnQgYmVjYXVzZSBpJ2xsIHdhbnQgdG8gdHJhY2sgaG93IG1hbnlcbiAgICAvLyB1bm5lY2Vzc2FyeSBtZXNzYWdlcyBhcmUgc2VudC5cblxuICAgIGlmKHNlbGYuYXBwbHlVcGRhdGUodXBkYXRlKSlcbiAgICAgIGVtaXQuY2FsbChzZWxmLCAnX3VwZGF0ZScsIHVwZGF0ZSkgLy93cml0ZSB0byBzdHJlYW0uXG4gIH1cblxuICBpZihzb3VyY2UgIT09IHRoaXMuaWQpIHtcbiAgICBpZih0aGlzLl92ZXJpZnkpXG4gICAgICB0aGlzLl92ZXJpZnkodXBkYXRlLCBkaWRWZXJpZmljYXRpb24pXG4gICAgZWxzZVxuICAgICAgZGlkVmVyaWZpY2F0aW9uKG51bGwsIHRydWUpXG4gIH0gZWxzZSB7XG4gICAgaWYodGhpcy5fc2lnbikge1xuICAgICAgLy9jb3VsZCBtYWtlIHRoaXMgYXN5bmMgZWFzaWx5IGVub3VnaC5cbiAgICAgIHVwZGF0ZVszXSA9IHRoaXMuX3NpZ24odXBkYXRlKVxuICAgIH1cbiAgICBkaWRWZXJpZmljYXRpb24obnVsbCwgdHJ1ZSlcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbnNiLmNyZWF0ZVN0cmVhbSA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAvL3RoZSBzb3VyY2VzIGZvciB0aGUgcmVtb3RlIGVuZC5cbiAgdmFyIHNvdXJjZXMgPSB7fSwgb3RoZXJcbiAgdmFyIHN5bmNTZW50ID0gZmFsc2UsIHN5bmNSZWN2ID0gZmFsc2VcblxuICB0aGlzLl9zdHJlYW1zICsrXG5cbiAgb3B0cyA9IG9wdHMgfHwge31cbiAgdmFyIGQgPSBkdXBsZXgoKVxuICBkLm5hbWUgPSBvcHRzLm5hbWVcbiAgdmFyIG91dGVyID0gc2VyaWFsaXplcihvcHRzICYmIG9wdHMud3JhcHBlcikoZClcbiAgb3V0ZXIuaW5uZXIgPSBkXG5cbiAgZC53cml0YWJsZSA9IG9wdHMud3JpdGFibGUgIT09IGZhbHNlXG4gIGQucmVhZGFibGUgPSBvcHRzLnJlYWRhYmxlICE9PSBmYWxzZVxuXG4gIHN5bmNSZWN2ICAgPSAhZC53cml0YWJsZVxuICBzeW5jU2VudCAgID0gIWQucmVhZGFibGVcblxuICB2YXIgdGFpbCA9IG9wdHMudGFpbCAhPT0gZmFsc2UgLy9kZWZhdWx0IHRvIHRhaWw9dHJ1ZVxuXG4gIGZ1bmN0aW9uIHN0YXJ0IChkYXRhKSB7XG4gICAgLy93aGVuIHRoZSBkaWdlc3QgaXMgcmVjaWV2ZWQgZnJvbSB0aGUgb3RoZXIgZW5kLFxuICAgIC8vc2VuZCB0aGUgaGlzdG9yeS5cbiAgICAvL21lcmdlIHdpdGggdGhlIGN1cnJlbnQgbGlzdCBvZiBzb3VyY2VzLlxuICAgIHNvdXJjZXMgPSBkYXRhLmNsb2NrXG4gICAgaS5lYWNoKHNlbGYuaGlzdG9yeShzb3VyY2VzKSwgZnVuY3Rpb24gKGRhdGEpIHtkLl9kYXRhKGRhdGEpfSlcbiAgICBcbiAgICBvdXRlci5lbWl0KCdoZWFkZXInLCBkYXRhKVxuICAgIGQuX2RhdGEoJ1NZTkMnKVxuICAgIC8vd2hlbiB3ZSBoYXZlIHNlbnQgYWxsIGhpc3RvcnlcbiAgICBvdXRlci5lbWl0KCdzeW5jU2VudCcpXG4gICAgc3luY1NlbnQgPSB0cnVlXG4gICAgLy93aGVuIHdlIGhhdmUgcmVjaWV2ZWQgYWxsIGhpc3RveXJcbiAgICAvL2VtaXQgJ3N5bmNlZCcgd2hlbiB0aGlzIHN0cmVhbSBoYXMgc3luY2VkLlxuICAgIGlmKHN5bmNSZWN2KSBvdXRlci5lbWl0KCdzeW5jJyksIG91dGVyLmVtaXQoJ3N5bmNlZCcpXG4gICAgaWYoIXRhaWwpIGQuX2VuZCgpXG4gIH1cblxuICBkXG4gICAgLm9uKCdfZGF0YScsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAvL2lmIGl0J3MgYW4gYXJyYXksIGl0J3MgYW4gdXBkYXRlLlxuICAgICAgaWYoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICBpZih2YWxpZGF0ZShkYXRhKSlcbiAgICAgICAgICByZXR1cm4gc2VsZi5fdXBkYXRlKGRhdGEpXG4gICAgICB9XG4gICAgICAvL2lmIGl0J3MgYW4gb2JqZWN0LCBpdCdzIGEgc2N1dHRsZWJ1dCBkaWdlc3QuXG4gICAgICBlbHNlIGlmKCdvYmplY3QnID09PSB0eXBlb2YgZGF0YSAmJiBkYXRhKVxuICAgICAgICBzdGFydChkYXRhKVxuICAgICAgZWxzZSBpZignc3RyaW5nJyA9PT0gdHlwZW9mIGRhdGEgJiYgZGF0YSA9PSAnU1lOQycpIHtcbiAgICAgICAgc3luY1JlY3YgPSB0cnVlXG4gICAgICAgIG91dGVyLmVtaXQoJ3N5bmNSZWNpZXZlZCcpXG4gICAgICAgIGlmKHN5bmNTZW50KSBvdXRlci5lbWl0KCdzeW5jJyksIG91dGVyLmVtaXQoJ3N5bmNlZCcpXG4gICAgICB9XG4gICAgfSkub24oJ19lbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkLl9lbmQoKVxuICAgIH0pXG4gICAgLm9uKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIoJ191cGRhdGUnLCBvblVwZGF0ZSlcbiAgICAgIC8vZW1pdCB0aGUgbnVtYmVyIG9mIHN0cmVhbXMgdGhhdCBhcmUgcmVtYWluaW5nLi4uXG4gICAgICAvL3RoaXMgd2lsbCBiZSB1c2VkIGZvciBtZW1vcnkgbWFuYWdlbWVudC4uLlxuICAgICAgc2VsZi5fc3RyZWFtcyAtLVxuICAgICAgZW1pdC5jYWxsKHNlbGYsICd1bnN0cmVhbScsIHNlbGYuX3N0cmVhbXMpXG4gICAgfSlcblxuICBpZihvcHRzICYmIG9wdHMudGFpbCA9PT0gZmFsc2UpIHtcbiAgICBvdXRlci5vbignc3luYycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBkLl9lbmQoKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG4gIGZ1bmN0aW9uIG9uVXBkYXRlICh1cGRhdGUpIHsgLy92YWx1ZSwgc291cmNlLCB0c1xuICAgIGlmKCF2YWxpZGF0ZSh1cGRhdGUpIHx8ICF1LmZpbHRlcih1cGRhdGUsIHNvdXJjZXMpKVxuICAgICAgcmV0dXJuXG5cbiAgICBkLl9kYXRhKHVwZGF0ZSlcblxuICAgIC8vcmVhbGx5LCB0aGlzIHNob3VsZCBoYXBwZW4gYmVmb3JlIGVtaXR0aW5nLlxuICAgIHZhciB0cyA9IHVwZGF0ZVsxXVxuICAgIHZhciBzb3VyY2UgPSB1cGRhdGVbMl1cbiAgICBzb3VyY2VzW3NvdXJjZV0gPSB0c1xuICB9XG5cbiAgdmFyIG91dGdvaW5nID0geyBpZCA6IHNlbGYuaWQsIGNsb2NrIDogc2VsZi5zb3VyY2VzIH1cblxuICBpZiAob3B0cyAmJiBvcHRzLm1ldGEpIG91dGdvaW5nLm1ldGEgPSBvcHRzLm1ldGFcblxuICBpZihkLnJlYWRhYmxlKSB7XG4gICAgZC5fZGF0YShvdXRnb2luZylcbiAgICBpZighZC53cml0YWJsZSlcbiAgICAgIHN0YXJ0KHtjbG9jazp7fX0pXG4gICAgaWYodGFpbClcbiAgICAgIHNlbGYub24oJ191cGRhdGUnLCBvblVwZGF0ZSlcbiAgfVxuXG4gIHNlbGYub25jZSgnZGlzcG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICBkLmVuZCgpXG4gIH0pXG5cbiAgcmV0dXJuIG91dGVyXG59XG5cbnNiLmNyZWF0ZVdyaXRlU3RyZWFtID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge31cbiAgb3B0cy53cml0YWJsZSA9IHRydWU7IG9wdHMucmVhZGFibGUgPSBmYWxzZVxuICByZXR1cm4gdGhpcy5jcmVhdGVTdHJlYW0ob3B0cylcbn1cblxuc2IuY3JlYXRlUmVhZFN0cmVhbSA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9XG4gIG9wdHMud3JpdGFibGUgPSBmYWxzZTsgb3B0cy5yZWFkYWJsZSA9IHRydWVcbiAgcmV0dXJuIHRoaXMuY3JlYXRlU3RyZWFtKG9wdHMpXG59XG5cbnNiLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIGVtaXQuY2FsbCh0aGlzLCAnZGlzcG9zZScpXG59XG5cbnNiLnNldElkID0gZnVuY3Rpb24gKGlkKSB7XG4gIGlmKCdfX3Byb3RvX18nID09PSBpZCkgdGhyb3cgbmV3IEVycm9yKCdfX3Byb3RvX18gaXMgaW52YWxpZCBpZCcpXG4gIGlmKGlkID09IG51bGwpIHRocm93IG5ldyBFcnJvcignbnVsbCBpcyBub3QgaW52YWxpZCBpZCcpXG4gIHRoaXMuaWQgPSBpZFxuICByZXR1cm4gdGhpc1xufVxuXG5mdW5jdGlvbiBzdHJlYW1Eb25lKHN0cmVhbSwgbGlzdGVuZXIpIHtcblxuICBmdW5jdGlvbiByZW1vdmUgKCkge1xuICAgIHN0cmVhbS5yZW1vdmVMaXN0ZW5lcignZW5kJywgICBvbkRvbmUpXG4gICAgc3RyZWFtLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uRG9uZSlcbiAgICBzdHJlYW0ucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgICBvbkRvbmUpXG4gIH1cbiAgZnVuY3Rpb24gb25Eb25lIChhcmcpIHtcbiAgICByZW1vdmUoKVxuICAgIGxpc3RlbmVyLmNhbGwodGhpcywgYXJnKVxuICB9XG5cbiAgLy90aGlzIG1ha2VzIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKSBzdGlsbCB3b3JrXG4gIG9uRG9uZS5saXN0ZW5lciA9IGxpc3RlbmVyXG5cbiAgc3RyZWFtLm9uKCdlbmQnLCAgIG9uRG9uZSlcbiAgc3RyZWFtLm9uKCdlcnJvcicsIG9uRG9uZSlcbiAgc3RyZWFtLm9uKCdjbG9zZScsIG9uRG9uZSlcbn1cblxuLy9jcmVhdGUgYW5vdGhlciBpbnN0YW5jZSBvZiB0aGlzIHNjdXR0bGVidXR0LFxuLy90aGF0IGlzIGluIHN5bmMgYW5kIGF0dGFjaGVkIHRvIHRoaXMgaW5zdGFuY2UuXG5zYi5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIEEgPSB0aGlzXG4gIHZhciBCID0gbmV3IChBLmNvbnN0cnVjdG9yKVxuICBCLnNldElkKEEuaWQpIC8vc2FtZSBpZC4gdGhpbmsgdGhpcyB3aWxsIHdvcmsuLi5cblxuICBBLl9jbG9uZXMgPSAoQS5fY2xvbmVzIHx8IDApICsgMVxuXG4gIHZhciBhID0gQS5jcmVhdGVTdHJlYW0oe3dyYXBwZXI6ICdyYXcnfSlcbiAgdmFyIGIgPSBCLmNyZWF0ZVN0cmVhbSh7d3JhcHBlcjogJ3Jhdyd9KVxuXG4gIC8vYWxsIHVwZGF0ZXMgbXVzdCBiZSBzeW5jLCBzbyBtYWtlIHN1cmUgcGF1c2UgbmV2ZXIgaGFwcGVucy5cbiAgYS5wYXVzZSA9IGIucGF1c2UgPSBmdW5jdGlvbiBub29wKCl7fVxuXG4gIHN0cmVhbURvbmUoYiwgZnVuY3Rpb24gKCkge1xuICAgIEEuX2Nsb25lcy0tXG4gICAgZW1pdC5jYWxsKEEsICd1bmNsb25lJywgQS5fY2xvbmVzKVxuICB9KVxuXG4gIGEucGlwZShiKS5waXBlKGEpXG4gIC8vcmVzdW1lIGJvdGggc3RyZWFtcywgc28gdGhhdCB0aGUgbmV3IGluc3RhbmNlIGlzIGJyb3VnaHQgdXAgdG8gZGF0ZSBpbW1lZGlhdGVseS5cbiAgYS5yZXN1bWUoKVxuICBiLnJlc3VtZSgpXG5cbiAgcmV0dXJuIEJcbn1cblxuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiXG4vL1xuLy8gYWRkcyBhbGwgdGhlIGZpZWxkcyBmcm9tIG9iajIgb250byBvYmoxXG4vL1xuXG52YXIgZWFjaCA9IGV4cG9ydHMuZWFjaCA9IGZ1bmN0aW9uIChvYmosaXRlcmF0b3Ipe1xuIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKVxuIGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KXtcbiAgaXRlcmF0b3Iob2JqW2tleV0sa2V5LG9iaikgXG4gfSlcbn1cblxudmFyIFJYID0gL3NhZGYvLmNvbnN0cnVjdG9yXG5mdW5jdGlvbiByeCAoaXRlcmF0b3IgKXtcbiAgcmV0dXJuIGl0ZXJhdG9yIGluc3RhbmNlb2YgUlggPyBmdW5jdGlvbiAoc3RyKSB7IFxuICAgICAgdmFyIG0gPSBpdGVyYXRvci5leGVjKHN0cilcbiAgICAgIHJldHVybiBtICYmIChtWzFdID8gbVsxXSA6IG1bMF0pIFxuICAgIH0gOiBpdGVyYXRvclxufVxuXG52YXIgdGltZXMgPSBleHBvcnRzLnRpbWVzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgICwgaXRlcmF0b3IgPSByeChhcmdzLnBvcCgpKVxuICAgICwgbSA9IGFyZ3MucG9wKClcbiAgICAsIGkgPSBhcmdzLnNoaWZ0KClcbiAgICAsIGogPSBhcmdzLnNoaWZ0KClcbiAgICAsIGRpZmYsIGRpclxuICAgICwgYSA9IFtdXG4gICAgXG4gICAgaSA9ICdudW1iZXInID09PSB0eXBlb2YgaSA/IGkgOiAxXG4gICAgZGlmZiA9IGogPyBqIC0gaSA6IDFcbiAgICBkaXIgPSBpIDwgbVxuICAgIGlmKG0gPT0gaSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignc3RlcHMgY2Fubm90IGJlIHRoZSBzYW1lOiAnK20rJywgJytpKVxuICBmb3IgKDsgZGlyID8gaSA8PSBtIDogbSA8PSBpOyBpICs9IGRpZmYpXG4gICAgYS5wdXNoKGl0ZXJhdG9yKGkpKVxuICByZXR1cm4gYVxufVxuXG52YXIgbWFwID0gZXhwb3J0cy5tYXAgPSBmdW5jdGlvbiAob2JqLCBpdGVyYXRvcil7XG4gIGl0ZXJhdG9yID0gcngoaXRlcmF0b3IpXG4gIGlmKEFycmF5LmlzQXJyYXkob2JqKSlcbiAgICByZXR1cm4gb2JqLm1hcChpdGVyYXRvcilcbiAgaWYoJ251bWJlcicgPT09IHR5cGVvZiBvYmopXG4gICAgcmV0dXJuIHRpbWVzLmFwcGx5KG51bGwsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkgIFxuICAvL3JldHVybiBpZiBudWxsID8gIFxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iailcbiAgICAsIHIgPSB7fVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSl7XG4gICAgcltrZXldID0gaXRlcmF0b3Iob2JqW2tleV0sa2V5LG9iaikgXG4gIH0pXG4gIHJldHVybiByXG59XG5cbnZhciBmaW5kUmV0dXJuID0gZXhwb3J0cy5maW5kUmV0dXJuID0gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IpIHtcbiAgaXRlcmF0b3IgPSByeChpdGVyYXRvcilcbiAgaWYob2JqID09IG51bGwpXG4gICAgcmV0dXJuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKVxuICAgICwgbCA9IGtleXMubGVuZ3RoXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSArKykge1xuICAgIHZhciBrZXkgPSBrZXlzW2ldXG4gICAgICAsIHZhbHVlID0gb2JqW2tleV1cbiAgICB2YXIgciA9IGl0ZXJhdG9yKHZhbHVlLCBrZXkpXG4gICAgaWYocikgcmV0dXJuIHJcbiAgfVxufVxuXG52YXIgZmluZCA9IGV4cG9ydHMuZmluZCA9IGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yKSB7IFxuICBpdGVyYXRvciA9IHJ4KGl0ZXJhdG9yKVxuICByZXR1cm4gZmluZFJldHVybiAob2JqLCBmdW5jdGlvbiAodiwgaykge1xuICAgIHZhciByID0gaXRlcmF0b3IodiwgaylcbiAgICBpZihyKSByZXR1cm4gdlxuICB9KVxufVxuXG52YXIgZmluZEtleSA9IGV4cG9ydHMuZmluZEtleSA9IGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yKSB7IFxuICBpdGVyYXRvciA9IHJ4KGl0ZXJhdG9yKVxuICByZXR1cm4gZmluZFJldHVybiAob2JqLCBmdW5jdGlvbiAodiwgaykge1xuICAgIHZhciByID0gaXRlcmF0b3IodiwgaylcbiAgICBpZihyKSByZXR1cm4ga1xuICB9KVxufVxuXG52YXIgZmlsdGVyID0gZXhwb3J0cy5maWx0ZXIgPSBmdW5jdGlvbiAob2JqLCBpdGVyYXRvcil7XG4gIGl0ZXJhdG9yID0gcnggKGl0ZXJhdG9yKVxuXG4gIGlmKEFycmF5LmlzQXJyYXkob2JqKSlcbiAgICByZXR1cm4gb2JqLmZpbHRlcihpdGVyYXRvcilcbiAgXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKVxuICAgICwgciA9IHt9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KXtcbiAgICB2YXIgdlxuICAgIGlmKGl0ZXJhdG9yKHYgPSBvYmpba2V5XSxrZXksb2JqKSlcbiAgICAgIHJba2V5XSA9IHZcbiAgfSlcbiAgcmV0dXJuIHIgXG59XG5cbnZhciBtYXBLZXlzID0gZXhwb3J0cy5tYXBLZXlzID0gZnVuY3Rpb24gKGFyeSwgaXRlcmF0b3Ipe1xuICB2YXIgciA9IHt9XG4gIGl0ZXJhdG9yID0gcngoaXRlcmF0b3IpXG4gIGVhY2goYXJ5LCBmdW5jdGlvbiAodixrKXtcbiAgICByW3ZdID0gaXRlcmF0b3IodixrKVxuICB9KVxuICByZXR1cm4gclxufVxuXG5cbnZhciBtYXBUb0FycmF5ID0gZXhwb3J0cy5tYXBUb0FycmF5ID0gZnVuY3Rpb24gKGFyeSwgaXRlcmF0b3Ipe1xuICB2YXIgciA9IFtdXG4gIGl0ZXJhdG9yID0gcngoaXRlcmF0b3IpXG4gIGVhY2goYXJ5LCBmdW5jdGlvbiAodixrKXtcbiAgICByLnB1c2goaXRlcmF0b3IodixrKSlcbiAgfSlcbiAgcmV0dXJuIHJcbn1cblxudmFyIHBhdGggPSBleHBvcnRzLnBhdGggPSBmdW5jdGlvbiAob2JqZWN0LCBwYXRoKSB7XG5cbiAgZm9yICh2YXIgaSBpbiBwYXRoKSB7XG4gICAgaWYob2JqZWN0ID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcbiAgICB2YXIga2V5ID0gcGF0aFtpXVxuICAgIG9iamVjdCA9IG9iamVjdFtrZXldXG4gIH1cbiAgcmV0dXJuIG9iamVjdFxufVxuXG4vKlxuTk9URTogbmFpdmUgaW1wbGVtZW50YXRpb24uIFxuYG1hdGNoYCBtdXN0IG5vdCBjb250YWluIGNpcmN1bGFyIHJlZmVyZW5jZXMuXG4qL1xuXG52YXIgc2V0UGF0aCA9IGV4cG9ydHMuc2V0UGF0aCA9IGZ1bmN0aW9uIChvYmplY3QsIHBhdGgsIHZhbHVlKSB7XG5cbiAgZm9yICh2YXIgaSBpbiBwYXRoKSB7XG4gICAgdmFyIGtleSA9IHBhdGhbaV1cbiAgICBpZihvYmplY3Rba2V5XSA9PSBudWxsKSBvYmplY3Rba2V5XSA9ICggXG4gICAgICBpICsgMSA9PSBwYXRoLmxlbmd0aCA/IHZhbHVlIDoge31cbiAgICApXG4gICAgb2JqZWN0ID0gb2JqZWN0W2tleV1cbiAgfVxufVxuXG52YXIgam9pbiA9IGV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uIChBLCBCLCBpdCkge1xuICBlYWNoKEEsIGZ1bmN0aW9uIChhLCBhaykge1xuICAgIGVhY2goQiwgZnVuY3Rpb24gKGIsIGJrKSB7XG4gICAgICBpdChhLCBiLCBhaywgYmspXG4gICAgfSlcbiAgfSlcbn1cbiIsIihmdW5jdGlvbihwcm9jZXNzKXt2YXIgU3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAod3JpdGUsIGVuZCkge1xuICB2YXIgc3RyZWFtID0gbmV3IFN0cmVhbSgpIFxuICB2YXIgYnVmZmVyID0gW10sIGVuZGVkID0gZmFsc2UsIGRlc3Ryb3llZCA9IGZhbHNlLCBlbWl0RW5kXG4gIHN0cmVhbS53cml0YWJsZSA9IHN0cmVhbS5yZWFkYWJsZSA9IHRydWVcbiAgc3RyZWFtLnBhdXNlZCA9IGZhbHNlXG4gIHN0cmVhbS5fcGF1c2VkID0gZmFsc2VcbiAgc3RyZWFtLmJ1ZmZlciA9IGJ1ZmZlclxuICBcbiAgc3RyZWFtXG4gICAgLm9uKCdwYXVzZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHN0cmVhbS5fcGF1c2VkID0gdHJ1ZVxuICAgIH0pXG4gICAgLm9uKCdkcmFpbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHN0cmVhbS5fcGF1c2VkID0gZmFsc2VcbiAgICB9KVxuICAgXG4gIGZ1bmN0aW9uIGRlc3Ryb3lTb29uICgpIHtcbiAgICBwcm9jZXNzLm5leHRUaWNrKHN0cmVhbS5kZXN0cm95LmJpbmQoc3RyZWFtKSlcbiAgfVxuXG4gIGlmKHdyaXRlKVxuICAgIHN0cmVhbS5vbignX2RhdGEnLCB3cml0ZSlcbiAgaWYoZW5kKVxuICAgIHN0cmVhbS5vbignX2VuZCcsIGVuZClcblxuICAvL2Rlc3Ryb3kgdGhlIHN0cmVhbSBvbmNlIGJvdGggZW5kcyBhcmUgb3ZlclxuICAvL2J1dCBkbyBpdCBpbiBuZXh0VGljaywgc28gdGhhdCBvdGhlciBsaXN0ZW5lcnNcbiAgLy9vbiBlbmQgaGF2ZSB0aW1lIHRvIHJlc3BvbmRcbiAgc3RyZWFtLm9uY2UoJ2VuZCcsIGZ1bmN0aW9uICgpIHsgXG4gICAgc3RyZWFtLnJlYWRhYmxlID0gZmFsc2VcbiAgICBpZighc3RyZWFtLndyaXRhYmxlKSB7XG4gICAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RyZWFtLmRlc3Ryb3koKVxuICAgICAgfSlcbiAgICB9XG4gIH0pXG5cbiAgc3RyZWFtLm9uY2UoJ19lbmQnLCBmdW5jdGlvbiAoKSB7IFxuICAgIHN0cmVhbS53cml0YWJsZSA9IGZhbHNlXG4gICAgaWYoIXN0cmVhbS5yZWFkYWJsZSlcbiAgICAgIHN0cmVhbS5kZXN0cm95KClcbiAgfSlcblxuICAvLyB0aGlzIGlzIHRoZSBkZWZhdWx0IHdyaXRlIG1ldGhvZCxcbiAgLy8gaWYgeW91IG92ZXJpZGUgaXQsIHlvdSBhcmUgcmVzcG9zaWJsZVxuICAvLyBmb3IgcGF1c2Ugc3RhdGUuXG5cbiAgXG4gIHN0cmVhbS5fZGF0YSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgaWYoIXN0cmVhbS5wYXVzZWQgJiYgIWJ1ZmZlci5sZW5ndGgpXG4gICAgICBzdHJlYW0uZW1pdCgnZGF0YScsIGRhdGEpXG4gICAgZWxzZSBcbiAgICAgIGJ1ZmZlci5wdXNoKGRhdGEpXG4gICAgcmV0dXJuICEoc3RyZWFtLnBhdXNlZCB8fCBidWZmZXIubGVuZ3RoKVxuICB9XG5cbiAgc3RyZWFtLl9lbmQgPSBmdW5jdGlvbiAoZGF0YSkgeyBcbiAgICBpZihkYXRhKSBzdHJlYW0uX2RhdGEoZGF0YSlcbiAgICBpZihlbWl0RW5kKSByZXR1cm5cbiAgICBlbWl0RW5kID0gdHJ1ZVxuICAgIC8vZGVzdHJveSBpcyBoYW5kbGVkIGFib3ZlLlxuICAgIHN0cmVhbS5kcmFpbigpXG4gIH1cblxuICBzdHJlYW0ud3JpdGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHN0cmVhbS5lbWl0KCdfZGF0YScsIGRhdGEpXG4gICAgcmV0dXJuICFzdHJlYW0uX3BhdXNlZFxuICB9XG5cbiAgc3RyZWFtLmVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBzdHJlYW0ud3JpdGFibGUgPSBmYWxzZVxuICAgIGlmKHN0cmVhbS5lbmRlZCkgcmV0dXJuXG4gICAgc3RyZWFtLmVuZGVkID0gdHJ1ZVxuICAgIHN0cmVhbS5lbWl0KCdfZW5kJylcbiAgfVxuXG4gIHN0cmVhbS5kcmFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZighYnVmZmVyLmxlbmd0aCAmJiAhZW1pdEVuZCkgcmV0dXJuXG4gICAgLy9pZiB0aGUgc3RyZWFtIGlzIHBhdXNlZCBhZnRlciBqdXN0IGJlZm9yZSBlbWl0RW5kKClcbiAgICAvL2VuZCBzaG91bGQgYmUgYnVmZmVyZWQuXG4gICAgd2hpbGUoIXN0cmVhbS5wYXVzZWQpIHtcbiAgICAgIGlmKGJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2RhdGEnLCBidWZmZXIuc2hpZnQoKSlcbiAgICAgICAgaWYoYnVmZmVyLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgc3RyZWFtLmVtaXQoJ19kcmFpbicpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZW1pdEVuZCAmJiBzdHJlYW0ucmVhZGFibGUpIHtcbiAgICAgICAgc3RyZWFtLnJlYWRhYmxlID0gZmFsc2VcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2VuZCcpXG4gICAgICAgIHJldHVyblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9pZiB0aGUgYnVmZmVyIGhhcyBlbXB0aWVkLiBlbWl0IGRyYWluLlxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB2YXIgc3RhcnRlZCA9IGZhbHNlXG4gIHN0cmVhbS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy90aGlzIGlzIHdoZXJlIEkgbmVlZCBwYXVzZVJlYWQsIGFuZCBwYXVzZVdyaXRlLlxuICAgIC8vaGVyZSB0aGUgcmVhZGluZyBzaWRlIGlzIHVucGF1c2VkLFxuICAgIC8vYnV0IHRoZSB3cml0aW5nIHNpZGUgbWF5IHN0aWxsIGJlIHBhdXNlZC5cbiAgICAvL3RoZSB3aG9sZSBidWZmZXIgbWlnaHQgbm90IGVtcGl0eSBhdCBvbmNlLlxuICAgIC8vaXQgbWlnaHQgcGF1c2UgYWdhaW4uXG4gICAgLy90aGUgc3RyZWFtIHNob3VsZCBuZXZlciBlbWl0IGRhdGEgaW5iZXR3ZWVuIHBhdXNlKCkuLi5yZXN1bWUoKVxuICAgIC8vYW5kIHdyaXRlIHNob3VsZCByZXR1cm4gIWJ1ZmZlci5sZW5ndGhcbiAgICBzdGFydGVkID0gdHJ1ZVxuICAgIHN0cmVhbS5wYXVzZWQgPSBmYWxzZVxuICAgIHN0cmVhbS5kcmFpbigpIC8vd2lsbCBlbWl0IGRyYWluIGlmIGJ1ZmZlciBlbXB0aWVzLlxuICAgIHJldHVybiBzdHJlYW1cbiAgfVxuXG4gIHN0cmVhbS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKGRlc3Ryb3llZCkgcmV0dXJuXG4gICAgZGVzdHJveWVkID0gZW5kZWQgPSB0cnVlICAgICBcbiAgICBidWZmZXIubGVuZ3RoID0gMFxuICAgIHN0cmVhbS5lbWl0KCdjbG9zZScpXG4gIH1cbiAgdmFyIHBhdXNlQ2FsbGVkID0gZmFsc2VcbiAgc3RyZWFtLnBhdXNlID0gZnVuY3Rpb24gKCkge1xuICAgIHN0YXJ0ZWQgPSB0cnVlXG4gICAgc3RyZWFtLnBhdXNlZCA9IHRydWVcbiAgICBzdHJlYW0uZW1pdCgnX3BhdXNlJylcbiAgICByZXR1cm4gc3RyZWFtXG4gIH1cbiAgc3RyZWFtLl9wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZighc3RyZWFtLl9wYXVzZWQpIHtcbiAgICAgIHN0cmVhbS5fcGF1c2VkID0gdHJ1ZVxuICAgICAgc3RyZWFtLmVtaXQoJ3BhdXNlJylcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBzdHJlYW0ucGF1c2VkID0gdHJ1ZVxuICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAvL3VubGVzcyB0aGUgdXNlciBtYW51YWxseSBwYXVzZWRcbiAgICBpZihzdGFydGVkKSByZXR1cm5cbiAgICBzdHJlYW0ucmVzdW1lKClcbiAgfSlcbiBcbiAgcmV0dXJuIHN0cmVhbVxufVxuXG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCJcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHdyYXBwZXIpIHtcblxuICBpZignZnVuY3Rpb24nID09IHR5cGVvZiB3cmFwcGVyKVxuICAgIHJldHVybiB3cmFwcGVyXG4gIFxuICByZXR1cm4gZXhwb3J0c1t3cmFwcGVyXSB8fCBleHBvcnRzLmpzb25cbn1cblxuZXhwb3J0cy5qc29uID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuXG4gIHZhciB3cml0ZSA9IHN0cmVhbS53cml0ZVxuICB2YXIgc29GYXIgPSAnJ1xuXG4gIGZ1bmN0aW9uIHBhcnNlIChsaW5lKSB7XG4gICAgdmFyIGpzXG4gICAgdHJ5IHtcbiAgICAgIGpzID0gSlNPTi5wYXJzZShsaW5lKVxuICAgICAgLy9pZ25vcmUgbGluZXMgb2Ygd2hpdGVzcGFjZS4uLlxuICAgIH0gY2F0Y2ggKGVycikgeyBcbiAgICAgIHJldHVybiBzdHJlYW0uZW1pdCgnZXJyb3InLCBlcnIpXG4gICAgICAvL3JldHVybiBjb25zb2xlLmVycm9yKCdpbnZhbGlkIEpTT04nLCBsaW5lKVxuICAgIH1cbiAgICBpZihqcyAhPT0gdW5kZWZpbmVkKVxuICAgICAgd3JpdGUuY2FsbChzdHJlYW0sIGpzKVxuICB9XG5cbiAgZnVuY3Rpb24gb25EYXRhIChkYXRhKSB7XG4gICAgdmFyIGxpbmVzID0gKHNvRmFyICsgZGF0YSkuc3BsaXQoJ1xcbicpXG4gICAgc29GYXIgPSBsaW5lcy5wb3AoKVxuICAgIHdoaWxlKGxpbmVzLmxlbmd0aCkge1xuICAgICAgcGFyc2UobGluZXMuc2hpZnQoKSlcbiAgICB9XG4gIH1cblxuICBzdHJlYW0ud3JpdGUgPSBvbkRhdGFcbiAgXG4gIHZhciBlbmQgPSBzdHJlYW0uZW5kXG5cbiAgc3RyZWFtLmVuZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgaWYoZGF0YSlcbiAgICAgIHN0cmVhbS53cml0ZShkYXRhKVxuICAgIC8vaWYgdGhlcmUgaXMgYW55IGxlZnQgb3Zlci4uLlxuICAgIGlmKHNvRmFyKSB7XG4gICAgICBwYXJzZShzb0ZhcilcbiAgICB9XG4gICAgcmV0dXJuIGVuZC5jYWxsKHN0cmVhbSlcbiAgfVxuXG4gIHN0cmVhbS5lbWl0ID0gZnVuY3Rpb24gKGV2ZW50LCBkYXRhKSB7XG5cbiAgICBpZihldmVudCA9PSAnZGF0YScpIHtcbiAgICAgIGRhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhKSArICdcXG4nXG4gICAgfVxuICAgIC8vc2luY2UgYWxsIHN0cmVhbSBldmVudHMgb25seSB1c2Ugb25lIGFyZ3VtZW50LCB0aGlzIGlzIG9rYXkuLi5cbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQuY2FsbChzdHJlYW0sIGV2ZW50LCBkYXRhKVxuICB9XG5cbiAgcmV0dXJuIHN0cmVhbVxuLy8gIHJldHVybiBlcy5waXBlbGluZShlcy5zcGxpdCgpLCBlcy5wYXJzZSgpLCBzdHJlYW0sIGVzLnN0cmluZ2lmeSgpKVxufVxuXG5leHBvcnRzLnJhdyA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgcmV0dXJuIHN0cmVhbVxufVxuXG4iLCIvLyBJZiBgRGF0ZS5ub3coKWAgaXMgaW52b2tlZCB0d2ljZSBxdWlja2x5LCBpdCdzIHBvc3NpYmxlIHRvIGdldCB0d29cbi8vIGlkZW50aWNhbCB0aW1lIHN0YW1wcy4gVG8gYXZvaWQgZ2VuZXJhdGlvbiBkdXBsaWNhdGlvbnMsIHN1YnNlcXVlbnRcbi8vIGNhbGxzIGFyZSBtYW51YWxseSBvcmRlcmVkIHRvIGZvcmNlIHVuaXF1ZW5lc3MuXG5cbnZhciBfbGFzdCA9IDBcbnZhciBfY291bnQgPSAxXG52YXIgYWRqdXN0ZWQgPSAwXG52YXIgX2FkanVzdGVkID0gMFxuXG5tb2R1bGUuZXhwb3J0cyA9XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIC8qKlxuICBSZXR1cm5zIE5PVCBhbiBhY2N1cmF0ZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgY3VycmVudCB0aW1lLlxuICBTaW5jZSBqcyBvbmx5IG1lYXN1cmVzIHRpbWUgYXMgbXMsIGlmIHlvdSBjYWxsIGBEYXRlLm5vdygpYFxuICB0d2ljZSBxdWlja2x5LCBpdCdzIHBvc3NpYmxlIHRvIGdldCB0d28gaWRlbnRpY2FsIHRpbWUgc3RhbXBzLlxuICBUaGlzIGZ1bmN0aW9uIGd1YXJhbnRlZXMgdW5pcXVlIGJ1dCBtYXliZSBpbmFjY3VyYXRlIHJlc3VsdHNcbiAgb24gZWFjaCBjYWxsLlxuICAqKi9cbiAgLy91bmNvbW1lbnQgdGhpcyB3ZW5cbiAgdmFyIHRpbWUgPSBEYXRlLm5vdygpXG4gIC8vdGltZSA9IH5+ICh0aW1lIC8gMTAwMCkgXG4gIC8vXl5edW5jb21tZW50IHdoZW4gdGVzdGluZy4uLlxuXG4gIC8qKlxuICBJZiB0aW1lIHJldHVybmVkIGlzIHNhbWUgYXMgaW4gbGFzdCBjYWxsLCBhZGp1c3QgaXQgYnlcbiAgYWRkaW5nIGEgbnVtYmVyIGJhc2VkIG9uIHRoZSBjb3VudGVyLiBcbiAgQ291bnRlciBpcyBpbmNyZW1lbnRlZCBzbyB0aGF0IG5leHQgY2FsbCBnZXQncyBhZGp1c3RlZCBwcm9wZXJseS5cbiAgQmVjYXVzZSBmbG9hdHMgaGF2ZSByZXN0cmljdGVkIHByZWNpc2lvbiwgXG4gIG1heSBuZWVkIHRvIHN0ZXAgcGFzdCBzb21lIHZhbHVlcy4uLlxuICAqKi9cbiAgaWYgKF9sYXN0ID09PSB0aW1lKSAge1xuICAgIGRvIHtcbiAgICAgIGFkanVzdGVkID0gdGltZSArICgoX2NvdW50KyspIC8gKF9jb3VudCArIDk5OSkpXG4gICAgfSB3aGlsZSAoYWRqdXN0ZWQgPT09IF9hZGp1c3RlZClcbiAgICBfYWRqdXN0ZWQgPSBhZGp1c3RlZFxuICB9XG4gIC8vIElmIGxhc3QgdGltZSB3YXMgZGlmZmVyZW50IHJlc2V0IHRpbWVyIGJhY2sgdG8gYDFgLlxuICBlbHNlIHtcbiAgICBfY291bnQgPSAxXG4gICAgYWRqdXN0ZWQgPSB0aW1lXG4gIH1cbiAgX2FkanVzdGVkID0gYWRqdXN0ZWRcbiAgX2xhc3QgPSB0aW1lXG4gIHJldHVybiBhZGp1c3RlZFxufVxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAxMiBNYXRoaWV1IFR1cmNvdHRlXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbnZhciBCYWNrb2ZmU3RyYXRlZ3kgPSByZXF1aXJlKCcuL3N0cmF0ZWd5Jyk7XG5cbi8qKlxuICogRmlib25hY2NpIGJhY2tvZmYgc3RyYXRlZ3kuXG4gKiBAZXh0ZW5kcyBCYWNrb2ZmU3RyYXRlZ3lcbiAqL1xuZnVuY3Rpb24gRmlib25hY2NpQmFja29mZlN0cmF0ZWd5KG9wdGlvbnMpIHtcbiAgICBCYWNrb2ZmU3RyYXRlZ3kuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLmJhY2tvZmZEZWxheV8gPSAwO1xuICAgIHRoaXMubmV4dEJhY2tvZmZEZWxheV8gPSB0aGlzLmdldEluaXRpYWxEZWxheSgpO1xufVxudXRpbC5pbmhlcml0cyhGaWJvbmFjY2lCYWNrb2ZmU3RyYXRlZ3ksIEJhY2tvZmZTdHJhdGVneSk7XG5cbi8qKiBAaW5oZXJpdERvYyAqL1xuRmlib25hY2NpQmFja29mZlN0cmF0ZWd5LnByb3RvdHlwZS5uZXh0XyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBiYWNrb2ZmRGVsYXkgPSBNYXRoLm1pbih0aGlzLm5leHRCYWNrb2ZmRGVsYXlfLCB0aGlzLmdldE1heERlbGF5KCkpO1xuICAgIHRoaXMubmV4dEJhY2tvZmZEZWxheV8gKz0gdGhpcy5iYWNrb2ZmRGVsYXlfO1xuICAgIHRoaXMuYmFja29mZkRlbGF5XyA9IGJhY2tvZmZEZWxheTtcbiAgICByZXR1cm4gYmFja29mZkRlbGF5O1xufTtcblxuLyoqIEBpbmhlcml0RG9jICovXG5GaWJvbmFjY2lCYWNrb2ZmU3RyYXRlZ3kucHJvdG90eXBlLnJlc2V0XyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubmV4dEJhY2tvZmZEZWxheV8gPSB0aGlzLmdldEluaXRpYWxEZWxheSgpO1xuICAgIHRoaXMuYmFja29mZkRlbGF5XyA9IDA7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpYm9uYWNjaUJhY2tvZmZTdHJhdGVneTtcblxuIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAxMiBNYXRoaWV1IFR1cmNvdHRlXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbnZhciBCYWNrb2ZmU3RyYXRlZ3kgPSByZXF1aXJlKCcuL3N0cmF0ZWd5Jyk7XG5cbi8qKlxuICogRXhwb25lbnRpYWwgYmFja29mZiBzdHJhdGVneS5cbiAqIEBleHRlbmRzIEJhY2tvZmZTdHJhdGVneVxuICovXG5mdW5jdGlvbiBFeHBvbmVudGlhbEJhY2tvZmZTdHJhdGVneShvcHRpb25zKSB7XG4gICAgQmFja29mZlN0cmF0ZWd5LmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy5iYWNrb2ZmRGVsYXlfID0gMDtcbiAgICB0aGlzLm5leHRCYWNrb2ZmRGVsYXlfID0gdGhpcy5nZXRJbml0aWFsRGVsYXkoKTtcbn1cbnV0aWwuaW5oZXJpdHMoRXhwb25lbnRpYWxCYWNrb2ZmU3RyYXRlZ3ksIEJhY2tvZmZTdHJhdGVneSk7XG5cbi8qKiBAaW5oZXJpdERvYyAqL1xuRXhwb25lbnRpYWxCYWNrb2ZmU3RyYXRlZ3kucHJvdG90eXBlLm5leHRfID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5iYWNrb2ZmRGVsYXlfID0gTWF0aC5taW4odGhpcy5uZXh0QmFja29mZkRlbGF5XywgdGhpcy5nZXRNYXhEZWxheSgpKTtcbiAgICB0aGlzLm5leHRCYWNrb2ZmRGVsYXlfID0gdGhpcy5iYWNrb2ZmRGVsYXlfICogMjtcbiAgICByZXR1cm4gdGhpcy5iYWNrb2ZmRGVsYXlfO1xufTtcblxuLyoqIEBpbmhlcml0RG9jICovXG5FeHBvbmVudGlhbEJhY2tvZmZTdHJhdGVneS5wcm90b3R5cGUucmVzZXRfID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5iYWNrb2ZmRGVsYXlfID0gMDtcbiAgICB0aGlzLm5leHRCYWNrb2ZmRGVsYXlfID0gdGhpcy5nZXRJbml0aWFsRGVsYXkoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXhwb25lbnRpYWxCYWNrb2ZmU3RyYXRlZ3k7XG5cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIgTWF0aGlldSBUdXJjb3R0ZVxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbnZhciBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKSxcbiAgICB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5mdW5jdGlvbiBpc0RlZih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsO1xufVxuXG4vKipcbiAqIEFic3RyYWN0IGNsYXNzIGRlZmluaW5nIHRoZSBza2VsZXRvbiBmb3IgYWxsIGJhY2tvZmYgc3RyYXRlZ2llcy5cbiAqIEBwYXJhbSBvcHRpb25zIEJhY2tvZmYgc3RyYXRlZ3kgb3B0aW9ucy5cbiAqIEBwYXJhbSBvcHRpb25zLnJhbmRvbWlzYXRpb25GYWN0b3IgVGhlIHJhbmRvbWlzYXRpb24gZmFjdG9yLCBtdXN0IGJlIGJldHdlZW5cbiAqIDAgYW5kIDEuXG4gKiBAcGFyYW0gb3B0aW9ucy5pbml0aWFsRGVsYXkgVGhlIGJhY2tvZmYgaW5pdGlhbCBkZWxheSwgaW4gbWlsbGlzZWNvbmRzLlxuICogQHBhcmFtIG9wdGlvbnMubWF4RGVsYXkgVGhlIGJhY2tvZmYgbWF4aW1hbCBkZWxheSwgaW4gbWlsbGlzZWNvbmRzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEJhY2tvZmZTdHJhdGVneShvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAoaXNEZWYob3B0aW9ucy5pbml0aWFsRGVsYXkpICYmIG9wdGlvbnMuaW5pdGlhbERlbGF5IDwgMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbml0aWFsIHRpbWVvdXQgbXVzdCBiZSBncmVhdGVyIHRoYW4gMC4nKTtcbiAgICB9IGVsc2UgaWYgKGlzRGVmKG9wdGlvbnMubWF4RGVsYXkpICYmIG9wdGlvbnMubWF4RGVsYXkgPCAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIG1heGltYWwgdGltZW91dCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiAwLicpO1xuICAgIH1cblxuICAgIHRoaXMuaW5pdGlhbERlbGF5XyA9IG9wdGlvbnMuaW5pdGlhbERlbGF5IHx8IDEwMDtcbiAgICB0aGlzLm1heERlbGF5XyA9IG9wdGlvbnMubWF4RGVsYXkgfHwgMTAwMDA7XG5cbiAgICBpZiAodGhpcy5tYXhEZWxheV8gPD0gdGhpcy5pbml0aWFsRGVsYXlfKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIG1heGltYWwgYmFja29mZiBkZWxheSBtdXN0IGJlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2dyZWF0ZXIgdGhhbiB0aGUgaW5pdGlhbCBiYWNrb2ZmIGRlbGF5LicpO1xuICAgIH1cblxuICAgIGlmIChpc0RlZihvcHRpb25zLnJhbmRvbWlzYXRpb25GYWN0b3IpICYmXG4gICAgICAgIChvcHRpb25zLnJhbmRvbWlzYXRpb25GYWN0b3IgPCAwIHx8IG9wdGlvbnMucmFuZG9taXNhdGlvbkZhY3RvciA+IDEpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHJhbmRvbWlzYXRpb24gZmFjdG9yIG11c3QgYmUgYmV0d2VlbiAwIGFuZCAxLicpO1xuICAgIH1cblxuICAgIHRoaXMucmFuZG9taXNhdGlvbkZhY3Rvcl8gPSBvcHRpb25zLnJhbmRvbWlzYXRpb25GYWN0b3IgfHwgMDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIG1heGltYWwgYmFja29mZiBkZWxheS5cbiAqIEByZXR1cm4gVGhlIG1heGltYWwgYmFja29mZiBkZWxheS5cbiAqL1xuQmFja29mZlN0cmF0ZWd5LnByb3RvdHlwZS5nZXRNYXhEZWxheSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm1heERlbGF5Xztcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBpbml0aWFsIGJhY2tvZmYgZGVsYXkuXG4gKiBAcmV0dXJuIFRoZSBpbml0aWFsIGJhY2tvZmYgZGVsYXkuXG4gKi9cbkJhY2tvZmZTdHJhdGVneS5wcm90b3R5cGUuZ2V0SW5pdGlhbERlbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5pdGlhbERlbGF5Xztcbn07XG5cbi8qKlxuICogVGVtcGxhdGUgbWV0aG9kIHRoYXQgY29tcHV0ZXMgdGhlIG5leHQgYmFja29mZiBkZWxheS5cbiAqIEByZXR1cm4gVGhlIGJhY2tvZmYgZGVsYXksIGluIG1pbGxpc2Vjb25kcy5cbiAqL1xuQmFja29mZlN0cmF0ZWd5LnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJhY2tvZmZEZWxheSA9IHRoaXMubmV4dF8oKTtcbiAgICB2YXIgcmFuZG9taXNhdGlvbk11bHRpcGxlID0gMSArIE1hdGgucmFuZG9tKCkgKiB0aGlzLnJhbmRvbWlzYXRpb25GYWN0b3JfO1xuICAgIHZhciByYW5kb21pemVkRGVsYXkgPSBNYXRoLnJvdW5kKGJhY2tvZmZEZWxheSAqIHJhbmRvbWlzYXRpb25NdWx0aXBsZSk7XG4gICAgcmV0dXJuIHJhbmRvbWl6ZWREZWxheTtcbn07XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIG5leHQgYmFja29mZiBkZWxheS5cbiAqIEByZXR1cm4gVGhlIGJhY2tvZmYgZGVsYXksIGluIG1pbGxpc2Vjb25kcy5cbiAqL1xuQmFja29mZlN0cmF0ZWd5LnByb3RvdHlwZS5uZXh0XyA9IGZ1bmN0aW9uKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQmFja29mZlN0cmF0ZWd5Lm5leHRfKCkgdW5pbXBsZW1lbnRlZC4nKTtcbn07XG5cbi8qKlxuICogVGVtcGxhdGUgbWV0aG9kIHRoYXQgcmVzZXRzIHRoZSBiYWNrb2ZmIGRlbGF5IHRvIGl0cyBpbml0aWFsIHZhbHVlLlxuICovXG5CYWNrb2ZmU3RyYXRlZ3kucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yZXNldF8oKTtcbn07XG5cbi8qKlxuICogUmVzZXRzIHRoZSBiYWNrb2ZmIGRlbGF5IHRvIGl0cyBpbml0aWFsIHZhbHVlLlxuICovXG5CYWNrb2ZmU3RyYXRlZ3kucHJvdG90eXBlLnJlc2V0XyA9IGZ1bmN0aW9uKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQmFja29mZlN0cmF0ZWd5LnJlc2V0XygpIHVuaW1wbGVtZW50ZWQuJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tvZmZTdHJhdGVneTtcblxuIl19
;