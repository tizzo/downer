;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){

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
},{"r-edit/widget":2,"client-reloader":3,"marked":4,"r-edit":5,"reconnect":6,"mux-demux":7}],2:[function(require,module,exports){

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

},{"r-array/widget":8}],4:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){

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

},{"events":10}],11:[function(require,module,exports){
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

},{"header-stream":12}],5:[function(require,module,exports){
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

},{"util":9,"adiff":13,"r-array":14}],7:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){

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
},{"stream":19,"__browserify_process":11}],6:[function(require,module,exports){

var shoe = require('shoe')

module.exports = require('./inject')(function (){ 
  var args = [].slice.call(arguments)
  return shoe.apply(null, args)
})

},{"./inject":20,"shoe":21}],16:[function(require,module,exports){
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


},{"events":10}],19:[function(require,module,exports){
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

},{"events":10,"util":9}],20:[function(require,module,exports){
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

},{"events":10,"./widget":22,"backoff":23}],24:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){

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

},{"util":9,"scuttlebutt/util":24,"between":25,"scuttlebutt":26}],21:[function(require,module,exports){
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

},{"stream":19,"sockjs-client":27}],23:[function(require,module,exports){
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


},{"./lib/backoff":28,"./lib/strategy/fibonacci":29,"./lib/strategy/exponential":30}],22:[function(require,module,exports){

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

},{"h":31}],25:[function(require,module,exports){

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

},{}],27:[function(require,module,exports){
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
},{}],28:[function(require,module,exports){
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


},{"events":10,"util":9}],31:[function(require,module,exports){
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


},{"util":9,"./strategy":32}],30:[function(require,module,exports){
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


},{"util":9,"./strategy":32}],26:[function(require,module,exports){
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
},{"events":10,"util":9,"./util":24,"iterate":33,"duplex":34,"stream-serializer":35,"monotonic-timestamp":36,"__browserify_process":11}],32:[function(require,module,exports){
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


},{"events":10,"util":9}],33:[function(require,module,exports){

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

},{}],34:[function(require,module,exports){
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
},{"stream":19,"__browserify_process":11}],35:[function(require,module,exports){

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


},{"events":10}],36:[function(require,module,exports){
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

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvY2xpZW50LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvd2lkZ2V0LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9tYXJrZWQvbGliL21hcmtlZC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9yLWFycmF5L3dpZGdldC5qcyIsIi91c3IvbG9jYWwvc2hhcmUvbnBtL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2J1aWx0aW4vdXRpbC5qcyIsIi91c3IvbG9jYWwvc2hhcmUvbnBtL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvdXNyL2xvY2FsL3NoYXJlL25wbS9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL2V2ZW50cy5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvY2xpZW50LXJlbG9hZGVyL2Jyb3dzZXIuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvbXV4LWRlbXV4L2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvbm9kZV9tb2R1bGVzL2FkaWZmL2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9jbGllbnQtcmVsb2FkZXIvbm9kZV9tb2R1bGVzL2hlYWRlci1zdHJlYW0vaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL211eC1kZW11eC9ub2RlX21vZHVsZXMvdGhyb3VnaC9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvcmVjb25uZWN0L3Nob2UuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL211eC1kZW11eC9ub2RlX21vZHVsZXMveHRlbmQvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL211eC1kZW11eC9ub2RlX21vZHVsZXMvZHVwbGV4L2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9tdXgtZGVtdXgvbm9kZV9tb2R1bGVzL3N0cmVhbS1zZXJpYWxpemVyL2luZGV4LmpzIiwiL3Vzci9sb2NhbC9zaGFyZS9ucG0vbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvYnVpbHRpbi9zdHJlYW0uanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3JlY29ubmVjdC9pbmplY3QuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9ub2RlX21vZHVsZXMvci1hcnJheS9ub2RlX21vZHVsZXMvc2N1dHRsZWJ1dHQvdXRpbC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9yLWFycmF5L2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9zaG9lL2Jyb3dzZXIuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3JlY29ubmVjdC9ub2RlX21vZHVsZXMvYmFja29mZi9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvcmVjb25uZWN0L3dpZGdldC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9yLWFycmF5L25vZGVfbW9kdWxlcy9iZXR3ZWVuL2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9zaG9lL25vZGVfbW9kdWxlcy9zb2NranMtY2xpZW50L3NvY2tqcy5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvcmVjb25uZWN0L25vZGVfbW9kdWxlcy9iYWNrb2ZmL2xpYi9iYWNrb2ZmLmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yZWNvbm5lY3Qvbm9kZV9tb2R1bGVzL2gvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3JlY29ubmVjdC9ub2RlX21vZHVsZXMvYmFja29mZi9saWIvc3RyYXRlZ3kvZmlib25hY2NpLmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yZWNvbm5lY3Qvbm9kZV9tb2R1bGVzL2JhY2tvZmYvbGliL3N0cmF0ZWd5L2V4cG9uZW50aWFsLmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvbm9kZV9tb2R1bGVzL3ItYXJyYXkvbm9kZV9tb2R1bGVzL3NjdXR0bGVidXR0L2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yZWNvbm5lY3Qvbm9kZV9tb2R1bGVzL2JhY2tvZmYvbGliL3N0cmF0ZWd5L3N0cmF0ZWd5LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvbm9kZV9tb2R1bGVzL3ItYXJyYXkvbm9kZV9tb2R1bGVzL3NjdXR0bGVidXR0L25vZGVfbW9kdWxlcy9pdGVyYXRlL2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvbm9kZV9tb2R1bGVzL3ItYXJyYXkvbm9kZV9tb2R1bGVzL3NjdXR0bGVidXR0L25vZGVfbW9kdWxlcy9kdXBsZXgvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9ub2RlX21vZHVsZXMvci1hcnJheS9ub2RlX21vZHVsZXMvc2N1dHRsZWJ1dHQvbm9kZV9tb2R1bGVzL3N0cmVhbS1zZXJpYWxpemVyL2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvbm9kZV9tb2R1bGVzL3ItYXJyYXkvbm9kZV9tb2R1bGVzL3NjdXR0bGVidXR0L25vZGVfbW9kdWxlcy9tb25vdG9uaWMtdGltZXN0YW1wL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmpDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25RQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNweEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBSVGV4dCAgICAgPSByZXF1aXJlKCdyLWVkaXQnKTtcbnZhciByZWNvbm5lY3QgPSByZXF1aXJlKCdyZWNvbm5lY3QnKTtcbnZhciByZWxvYWRlciAgPSByZXF1aXJlKCdjbGllbnQtcmVsb2FkZXInKTtcbnZhciB3aWRnZXQgICAgPSByZXF1aXJlKCdyLWVkaXQvd2lkZ2V0Jyk7XG52YXIgbWFya2VkICAgID0gcmVxdWlyZSgnbWFya2VkJyk7XG52YXIgTXV4RGVtdXggPSByZXF1aXJlKFwibXV4LWRlbXV4XCIpO1xuXG5cbnZhciByVGV4dCA9IFJURVhUID0gUlRleHQoKVxuXG5cbi8vIGByZWNvbm5lY3QoKWAgYW5kIGByZWxvYWRlcigpYCByZWNvbm5lY3QgdGhlIHN0cmVhbSBpbiB0aGUgZXZlbnRcbi8vIG9mIGFuIGludGVycnVwdGlvbiAobmV0d29yayBvciBvdGhlcndpc2UpLlxucmVjb25uZWN0KHJlbG9hZGVyKGZ1bmN0aW9uIChzdHJlYW0pIHtcblxuICAvLyBXZSBjcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgTXV4RGVtdXgoKSBmb3IgZWFjaCBjb25uZWN0aW9uLlxuICB2YXIgbWRtID0gTXV4RGVtdXgoKVxuXG4gIC8vIFdlIGNyZWF0ZSB0aGUgcmVhZC93cml0ZSBzdHJlYW0gdG8gaW50ZXJmYWNlIHdpdGggclRleHQoKS5cbiAgdmFyIHJ0U3RyZWFtID0gclRleHQuY3JlYXRlU3RyZWFtKCk7XG4gIHJ0U3RyZWFtLm9uKCdkYXRhJywgdXBkYXRlTWFya2Rvd24pO1xuXG4gIC8vIFdlIGNvbm5lY3Qgb3VyIHNob2Ugc3RyZWFtIGRpcmVjdGx5IG91ciBtdXhlci9kZW11eGVyLlxuICAvLyBUaGlzIGFsbG93cyB0aGUgbXV4ZXIgdG8gZW5jb2RlIGFueXRoaW5nIHdyaXR0ZW4gdG8gYW55IHZpcnR1YWwgY29ubmVjdGlvblxuICAvLyBtdWx0aXBsZXhlZCB0aHJvdWdoIHRoZSBvbmUgc3RyZWFtIGFuZCB0aGUgZGVtdXhlciB0byBkZWNvZGUgYW55dGhpbmcgY29taW5nXG4gIC8vIGJhY2sgZnJvbSB0aGUgc2VydmVyLlxuICBzdHJlYW0ucGlwZShtZG0pLnBpcGUoc3RyZWFtKTtcblxuICAvLyBDcmVhdGUgYW4gaW5kaXZpZHVhbCBjaGFubmVsIG9uIHRoZSBtYWluIHJlYWQvd3JpdGUgc3RyZWFtLlxuICB2YXIgbXhkVGl0bGVTdHJlYW0gPSBtZG0uY3JlYXRlU3RyZWFtKHRpdGxlKVxuXG4gIC8vIFBpcGUgYW55dGhpbmcgc2VudCBvbiB0aGlzIGNoYW5uZWwgaW50byB0aGUgcnRleHQgc3RyZWFtIGFuZCBwaXBlIGFueXRoaW5nXG4gIC8vIGNvbWluZyBiYWNrIGZyb20gdGhhdCBzdHJlYW0gYmFjayBhY3Jvc3MgdGhlIHZpcnR1YWwgY29ubmVjdGlvbi5cbiAgbXhkVGl0bGVTdHJlYW0ucGlwZShydFN0cmVhbSkucGlwZShteGRUaXRsZVN0cmVhbSlcblxufSkpLmNvbm5lY3QoJy9zaG9lLycpO1xuXG4gIC8vIFVzaW5nIHRoZSBkZWZhdWx0IHdpZGdldC5cbiAgdmFyICR0ZXh0QXJlYSA9IG51bGw7XG4gIHZhciAkbWFya2Rvd24gPSBudWxsO1xuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgLy8gVXNpbmcgdGhlIGRlZmF1bHQgd2lkZ2V0LlxuICAkdGV4dEFyZWEgPSAkKHJUZXh0LndpZGdldCgpKTtcbiAgJG1hcmtkb3duID0gJCgnI21hcmtkb3duJyk7XG5cbiAgJCgnI3RleHQnKS5hcHBlbmQoJHRleHRBcmVhKTtcblxuICAvLyBUT0RPOiBmaW5kIGEgd2F5IHRvIG1ha2UgdGhpcyBldmVudGVkLlxuICAvLyBSdW4gYW4gaW5pdGlhbCByZW5kZXIgYWZ0ZXIgdGhlIHRleHQgYXJlYSBoYXMgdGltZSB0byBwb3B1bGF0ZS5cbiAgc2V0VGltZW91dCh1cGRhdGVNYXJrZG93biwgMjUwKTtcbn0pO1xuXG5mdW5jdGlvbiB1cGRhdGVNYXJrZG93bigpIHtcbiAgJG1hcmtkb3duLmh0bWwobWFya2VkKCR0ZXh0QXJlYS52YWwoKSkpO1xufTsiLCJcbmZ1bmN0aW9uIHRyaW0gKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLnN1YnN0cmluZygxLCBzdHJpbmcubGVuZ3RoIC0gMSlcbn1cblxuZnVuY3Rpb24gc3R5bGUgKHJ4LCB0YWcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgdmFyIG0gPSByeC5leGVjKHRleHQpXG4gICAgd2hpbGUgKG0pIHtcbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UobVswXSwgJzwnK3RhZysnPicrdHJpbShtWzBdKSsnPC8nK3RhZysnPicpXG4gICAgICBtID0gcnguZXhlYyh0ZXh0KVxuICAgIH1cbiAgICByZXR1cm4gdGV4dFxuICB9XG59XG5cbnZhciBpdGFsaWNzID0gc3R5bGUoL19bXl9dK18vLCAnZW0nKVxudmFyIGJvbGQgICAgPSBzdHlsZSgvXFwqW15cXCpdK1xcKi8sICdzdHJvbmcnKVxudmFyIGNvZGUgICAgPSBzdHlsZSgvYFteYF0rYC8sICdjb2RlJylcblxuZnVuY3Rpb24gcHJlZml4IChyeCwgdGFnKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsKSB7XG4gICAgdmFyIG0gPSByeC5leGVjKHZhbClcbiAgICBpZihtKSB7XG4gICAgICB2YXIgbCA9IG1bMF0ubGVuZ3RoXG4gICAgICAvL29oIHllYWgsIGVzY2FwZSBjaGFycy4uLlxuICAgICAgdmFyIHQgPSAnZnVuY3Rpb24nID09PSB0eXBlb2YgdGFnID8gdGFnKG0pIDogdGFnXG4gICAgICByZXR1cm4gJzwnK3QrJz4nK3ZhbC5zdWJzdHJpbmcobCkrJzwvJyt0Kyc+J1xuICAgIH1cbiAgICByZXR1cm4gdmFsXG4gIH1cbn1cblxudmFyIGhlYWRlciA9IHByZWZpeCgvXiMrLywgZnVuY3Rpb24gKG0pIHsgcmV0dXJuICdIJyttWzBdLmxlbmd0aCB9KVxudmFyIGxpID0gcHJlZml4KC9eXFxzKi0rLywgICdsaScpXG5cbmZ1bmN0aW9uIHN0eWxlcyAodGV4dCkge1xuICByZXR1cm4gaGVhZGVyKGxpKGJvbGQoaXRhbGljcyhjb2RlKHRleHQpKSkpKVxufVxuXG5mdW5jdGlvbiB0b0hUTUwgKHZhbCkge1xuICBpZignXFxuJyA9PT0gdmFsKVxuICAgIHJldHVybiAnPGJyLz4nXG4gIHJldHVybiBzdHlsZXModmFsKVxufVxuXG5mdW5jdGlvbiBkZWZhdWx0VGVtcGxhdGUgKHZhbCwga2V5LCBlbCkge1xuICBpZihlbClcbiAgICByZXR1cm4gZWwuaW5uZXJIVE1MID0gdG9IVE1MKHZhbCksIGVsXG4gIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxuICBlbC5pbm5lckhUTUwgPSB0b0hUTUwodmFsKVxuICByZXR1cm4gZWxcbn1cblxudmFyIHdpZGdldCA9IHJlcXVpcmUoJ3ItYXJyYXkvd2lkZ2V0JylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAockVkaXQsIHRlbXBsYXRlKSB7XG4gIHJldHVybiB3aWRnZXQockVkaXQsIHRlbXBsYXRlIHx8IGRlZmF1bHRUZW1wbGF0ZSlcbn1cbiIsIihmdW5jdGlvbihnbG9iYWwpey8qKlxuICogbWFya2VkIC0gYSBtYXJrZG93biBwYXJzZXJcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEzLCBDaHJpc3RvcGhlciBKZWZmcmV5LiAoTUlUIExpY2Vuc2VkKVxuICogaHR0cHM6Ly9naXRodWIuY29tL2NoamovbWFya2VkXG4gKi9cblxuOyhmdW5jdGlvbigpIHtcblxuLyoqXG4gKiBCbG9jay1MZXZlbCBHcmFtbWFyXG4gKi9cblxudmFyIGJsb2NrID0ge1xuICBuZXdsaW5lOiAvXlxcbisvLFxuICBjb2RlOiAvXiggezR9W15cXG5dK1xcbiopKy8sXG4gIGZlbmNlczogbm9vcCxcbiAgaHI6IC9eKCAqWy0qX10pezMsfSAqKD86XFxuK3wkKS8sXG4gIGhlYWRpbmc6IC9eICooI3sxLDZ9KSAqKFteXFxuXSs/KSAqIyogKig/Olxcbit8JCkvLFxuICBucHRhYmxlOiBub29wLFxuICBsaGVhZGluZzogL14oW15cXG5dKylcXG4gKig9fC0pezMsfSAqXFxuKi8sXG4gIGJsb2NrcXVvdGU6IC9eKCAqPlteXFxuXSsoXFxuW15cXG5dKykqXFxuKikrLyxcbiAgbGlzdDogL14oICopKGJ1bGwpIFtcXHNcXFNdKz8oPzpocnxcXG57Mix9KD8hICkoPyFcXDFidWxsIClcXG4qfFxccyokKS8sXG4gIGh0bWw6IC9eICooPzpjb21tZW50fGNsb3NlZHxjbG9zaW5nKSAqKD86XFxuezIsfXxcXHMqJCkvLFxuICBkZWY6IC9eICpcXFsoW15cXF1dKylcXF06ICo8PyhbXlxccz5dKyk+Pyg/OiArW1wiKF0oW15cXG5dKylbXCIpXSk/ICooPzpcXG4rfCQpLyxcbiAgdGFibGU6IG5vb3AsXG4gIHBhcmFncmFwaDogL14oKD86W15cXG5dK1xcbj8oPyFocnxoZWFkaW5nfGxoZWFkaW5nfGJsb2NrcXVvdGV8dGFnfGRlZikpKylcXG4qLyxcbiAgdGV4dDogL15bXlxcbl0rL1xufTtcblxuYmxvY2suYnVsbGV0ID0gLyg/OlsqKy1dfFxcZCtcXC4pLztcbmJsb2NrLml0ZW0gPSAvXiggKikoYnVsbCkgW15cXG5dKig/Olxcbig/IVxcMWJ1bGwgKVteXFxuXSopKi87XG5ibG9jay5pdGVtID0gcmVwbGFjZShibG9jay5pdGVtLCAnZ20nKVxuICAoL2J1bGwvZywgYmxvY2suYnVsbGV0KVxuICAoKTtcblxuYmxvY2subGlzdCA9IHJlcGxhY2UoYmxvY2subGlzdClcbiAgKC9idWxsL2csIGJsb2NrLmJ1bGxldClcbiAgKCdocicsIC9cXG4rKD89KD86ICpbLSpfXSl7Myx9ICooPzpcXG4rfCQpKS8pXG4gICgpO1xuXG5ibG9jay5fdGFnID0gJyg/ISg/OidcbiAgKyAnYXxlbXxzdHJvbmd8c21hbGx8c3xjaXRlfHF8ZGZufGFiYnJ8ZGF0YXx0aW1lfGNvZGUnXG4gICsgJ3x2YXJ8c2FtcHxrYmR8c3VifHN1cHxpfGJ8dXxtYXJrfHJ1Ynl8cnR8cnB8YmRpfGJkbydcbiAgKyAnfHNwYW58YnJ8d2JyfGluc3xkZWx8aW1nKVxcXFxiKVxcXFx3Kyg/ITovfEApXFxcXGInO1xuXG5ibG9jay5odG1sID0gcmVwbGFjZShibG9jay5odG1sKVxuICAoJ2NvbW1lbnQnLCAvPCEtLVtcXHNcXFNdKj8tLT4vKVxuICAoJ2Nsb3NlZCcsIC88KHRhZylbXFxzXFxTXSs/PFxcL1xcMT4vKVxuICAoJ2Nsb3NpbmcnLCAvPHRhZyg/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXidcIj5dKSo/Pi8pXG4gICgvdGFnL2csIGJsb2NrLl90YWcpXG4gICgpO1xuXG5ibG9jay5wYXJhZ3JhcGggPSByZXBsYWNlKGJsb2NrLnBhcmFncmFwaClcbiAgKCdocicsIGJsb2NrLmhyKVxuICAoJ2hlYWRpbmcnLCBibG9jay5oZWFkaW5nKVxuICAoJ2xoZWFkaW5nJywgYmxvY2subGhlYWRpbmcpXG4gICgnYmxvY2txdW90ZScsIGJsb2NrLmJsb2NrcXVvdGUpXG4gICgndGFnJywgJzwnICsgYmxvY2suX3RhZylcbiAgKCdkZWYnLCBibG9jay5kZWYpXG4gICgpO1xuXG4vKipcbiAqIE5vcm1hbCBCbG9jayBHcmFtbWFyXG4gKi9cblxuYmxvY2subm9ybWFsID0gbWVyZ2Uoe30sIGJsb2NrKTtcblxuLyoqXG4gKiBHRk0gQmxvY2sgR3JhbW1hclxuICovXG5cbmJsb2NrLmdmbSA9IG1lcmdlKHt9LCBibG9jay5ub3JtYWwsIHtcbiAgZmVuY2VzOiAvXiAqKGB7Myx9fH57Myx9KSAqKFxcdyspPyAqXFxuKFtcXHNcXFNdKz8pXFxzKlxcMSAqKD86XFxuK3wkKS8sXG4gIHBhcmFncmFwaDogL14vXG59KTtcblxuYmxvY2suZ2ZtLnBhcmFncmFwaCA9IHJlcGxhY2UoYmxvY2sucGFyYWdyYXBoKVxuICAoJyg/IScsICcoPyEnICsgYmxvY2suZ2ZtLmZlbmNlcy5zb3VyY2UucmVwbGFjZSgnXFxcXDEnLCAnXFxcXDInKSArICd8JylcbiAgKCk7XG5cbi8qKlxuICogR0ZNICsgVGFibGVzIEJsb2NrIEdyYW1tYXJcbiAqL1xuXG5ibG9jay50YWJsZXMgPSBtZXJnZSh7fSwgYmxvY2suZ2ZtLCB7XG4gIG5wdGFibGU6IC9eICooXFxTLipcXHwuKilcXG4gKihbLTpdKyAqXFx8Wy18IDpdKilcXG4oKD86LipcXHwuKig/OlxcbnwkKSkqKVxcbiovLFxuICB0YWJsZTogL14gKlxcfCguKylcXG4gKlxcfCggKlstOl0rWy18IDpdKilcXG4oKD86ICpcXHwuKig/OlxcbnwkKSkqKVxcbiovXG59KTtcblxuLyoqXG4gKiBCbG9jayBMZXhlclxuICovXG5cbmZ1bmN0aW9uIExleGVyKG9wdGlvbnMpIHtcbiAgdGhpcy50b2tlbnMgPSBbXTtcbiAgdGhpcy50b2tlbnMubGlua3MgPSB7fTtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCBtYXJrZWQuZGVmYXVsdHM7XG4gIHRoaXMucnVsZXMgPSBibG9jay5ub3JtYWw7XG5cbiAgaWYgKHRoaXMub3B0aW9ucy5nZm0pIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRhYmxlcykge1xuICAgICAgdGhpcy5ydWxlcyA9IGJsb2NrLnRhYmxlcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ydWxlcyA9IGJsb2NrLmdmbTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBFeHBvc2UgQmxvY2sgUnVsZXNcbiAqL1xuXG5MZXhlci5ydWxlcyA9IGJsb2NrO1xuXG4vKipcbiAqIFN0YXRpYyBMZXggTWV0aG9kXG4gKi9cblxuTGV4ZXIubGV4ID0gZnVuY3Rpb24oc3JjLCBvcHRpb25zKSB7XG4gIHZhciBsZXhlciA9IG5ldyBMZXhlcihvcHRpb25zKTtcbiAgcmV0dXJuIGxleGVyLmxleChzcmMpO1xufTtcblxuLyoqXG4gKiBQcmVwcm9jZXNzaW5nXG4gKi9cblxuTGV4ZXIucHJvdG90eXBlLmxleCA9IGZ1bmN0aW9uKHNyYykge1xuICBzcmMgPSBzcmNcbiAgICAucmVwbGFjZSgvXFxyXFxufFxcci9nLCAnXFxuJylcbiAgICAucmVwbGFjZSgvXFx0L2csICcgICAgJylcbiAgICAucmVwbGFjZSgvXFx1MDBhMC9nLCAnICcpXG4gICAgLnJlcGxhY2UoL1xcdTI0MjQvZywgJ1xcbicpO1xuXG4gIHJldHVybiB0aGlzLnRva2VuKHNyYywgdHJ1ZSk7XG59O1xuXG4vKipcbiAqIExleGluZ1xuICovXG5cbkxleGVyLnByb3RvdHlwZS50b2tlbiA9IGZ1bmN0aW9uKHNyYywgdG9wKSB7XG4gIHZhciBzcmMgPSBzcmMucmVwbGFjZSgvXiArJC9nbSwgJycpXG4gICAgLCBuZXh0XG4gICAgLCBsb29zZVxuICAgICwgY2FwXG4gICAgLCBidWxsXG4gICAgLCBiXG4gICAgLCBpdGVtXG4gICAgLCBzcGFjZVxuICAgICwgaVxuICAgICwgbDtcblxuICB3aGlsZSAoc3JjKSB7XG4gICAgLy8gbmV3bGluZVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLm5ld2xpbmUuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgaWYgKGNhcFswXS5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdzcGFjZSdcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29kZVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmNvZGUuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgY2FwID0gY2FwWzBdLnJlcGxhY2UoL14gezR9L2dtLCAnJyk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2NvZGUnLFxuICAgICAgICB0ZXh0OiAhdGhpcy5vcHRpb25zLnBlZGFudGljXG4gICAgICAgICAgPyBjYXAucmVwbGFjZSgvXFxuKyQvLCAnJylcbiAgICAgICAgICA6IGNhcFxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBmZW5jZXMgKGdmbSlcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5mZW5jZXMuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdjb2RlJyxcbiAgICAgICAgbGFuZzogY2FwWzJdLFxuICAgICAgICB0ZXh0OiBjYXBbM11cbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gaGVhZGluZ1xuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmhlYWRpbmcuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdoZWFkaW5nJyxcbiAgICAgICAgZGVwdGg6IGNhcFsxXS5sZW5ndGgsXG4gICAgICAgIHRleHQ6IGNhcFsyXVxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyB0YWJsZSBubyBsZWFkaW5nIHBpcGUgKGdmbSlcbiAgICBpZiAodG9wICYmIChjYXAgPSB0aGlzLnJ1bGVzLm5wdGFibGUuZXhlYyhzcmMpKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcblxuICAgICAgaXRlbSA9IHtcbiAgICAgICAgdHlwZTogJ3RhYmxlJyxcbiAgICAgICAgaGVhZGVyOiBjYXBbMV0ucmVwbGFjZSgvXiAqfCAqXFx8ICokL2csICcnKS5zcGxpdCgvICpcXHwgKi8pLFxuICAgICAgICBhbGlnbjogY2FwWzJdLnJlcGxhY2UoL14gKnxcXHwgKiQvZywgJycpLnNwbGl0KC8gKlxcfCAqLyksXG4gICAgICAgIGNlbGxzOiBjYXBbM10ucmVwbGFjZSgvXFxuJC8sICcnKS5zcGxpdCgnXFxuJylcbiAgICAgIH07XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBpdGVtLmFsaWduLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICgvXiAqLSs6ICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKSB7XG4gICAgICAgICAgaXRlbS5hbGlnbltpXSA9ICdyaWdodCc7XG4gICAgICAgIH0gZWxzZSBpZiAoL14gKjotKzogKiQvLnRlc3QoaXRlbS5hbGlnbltpXSkpIHtcbiAgICAgICAgICBpdGVtLmFsaWduW2ldID0gJ2NlbnRlcic7XG4gICAgICAgIH0gZWxzZSBpZiAoL14gKjotKyAqJC8udGVzdChpdGVtLmFsaWduW2ldKSkge1xuICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSAnbGVmdCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXRlbS5hbGlnbltpXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZm9yIChpID0gMDsgaSA8IGl0ZW0uY2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaXRlbS5jZWxsc1tpXSA9IGl0ZW0uY2VsbHNbaV0uc3BsaXQoLyAqXFx8ICovKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy50b2tlbnMucHVzaChpdGVtKTtcblxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gbGhlYWRpbmdcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5saGVhZGluZy5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2hlYWRpbmcnLFxuICAgICAgICBkZXB0aDogY2FwWzJdID09PSAnPScgPyAxIDogMixcbiAgICAgICAgdGV4dDogY2FwWzFdXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGhyXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuaHIuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdocidcbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gYmxvY2txdW90ZVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmJsb2NrcXVvdGUuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuXG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2Jsb2NrcXVvdGVfc3RhcnQnXG4gICAgICB9KTtcblxuICAgICAgY2FwID0gY2FwWzBdLnJlcGxhY2UoL14gKj4gPy9nbSwgJycpO1xuXG4gICAgICAvLyBQYXNzIGB0b3BgIHRvIGtlZXAgdGhlIGN1cnJlbnRcbiAgICAgIC8vIFwidG9wbGV2ZWxcIiBzdGF0ZS4gVGhpcyBpcyBleGFjdGx5XG4gICAgICAvLyBob3cgbWFya2Rvd24ucGwgd29ya3MuXG4gICAgICB0aGlzLnRva2VuKGNhcCwgdG9wKTtcblxuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdibG9ja3F1b3RlX2VuZCdcbiAgICAgIH0pO1xuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBsaXN0XG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMubGlzdC5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG5cbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAnbGlzdF9zdGFydCcsXG4gICAgICAgIG9yZGVyZWQ6IGlzRmluaXRlKGNhcFsyXSlcbiAgICAgIH0pO1xuXG4gICAgICAvLyBHZXQgZWFjaCB0b3AtbGV2ZWwgaXRlbS5cbiAgICAgIGNhcCA9IGNhcFswXS5tYXRjaCh0aGlzLnJ1bGVzLml0ZW0pO1xuXG4gICAgICAvLyBHZXQgYnVsbGV0LlxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zbWFydExpc3RzKSB7XG4gICAgICAgIGJ1bGwgPSBibG9jay5idWxsZXQuZXhlYyhjYXBbMF0pWzBdO1xuICAgICAgfVxuXG4gICAgICBuZXh0ID0gZmFsc2U7XG4gICAgICBsID0gY2FwLmxlbmd0aDtcbiAgICAgIGkgPSAwO1xuXG4gICAgICBmb3IgKDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpdGVtID0gY2FwW2ldO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgbGlzdCBpdGVtJ3MgYnVsbGV0XG4gICAgICAgIC8vIHNvIGl0IGlzIHNlZW4gYXMgdGhlIG5leHQgdG9rZW4uXG4gICAgICAgIHNwYWNlID0gaXRlbS5sZW5ndGg7XG4gICAgICAgIGl0ZW0gPSBpdGVtLnJlcGxhY2UoL14gKihbKistXXxcXGQrXFwuKSArLywgJycpO1xuXG4gICAgICAgIC8vIE91dGRlbnQgd2hhdGV2ZXIgdGhlXG4gICAgICAgIC8vIGxpc3QgaXRlbSBjb250YWlucy4gSGFja3kuXG4gICAgICAgIGlmICh+aXRlbS5pbmRleE9mKCdcXG4gJykpIHtcbiAgICAgICAgICBzcGFjZSAtPSBpdGVtLmxlbmd0aDtcbiAgICAgICAgICBpdGVtID0gIXRoaXMub3B0aW9ucy5wZWRhbnRpY1xuICAgICAgICAgICAgPyBpdGVtLnJlcGxhY2UobmV3IFJlZ0V4cCgnXiB7MSwnICsgc3BhY2UgKyAnfScsICdnbScpLCAnJylcbiAgICAgICAgICAgIDogaXRlbS5yZXBsYWNlKC9eIHsxLDR9L2dtLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZXRlcm1pbmUgd2hldGhlciB0aGUgbmV4dCBsaXN0IGl0ZW0gYmVsb25ncyBoZXJlLlxuICAgICAgICAvLyBCYWNrcGVkYWwgaWYgaXQgZG9lcyBub3QgYmVsb25nIGluIHRoaXMgbGlzdC5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zbWFydExpc3RzICYmIGkgIT09IGwgLSAxKSB7XG4gICAgICAgICAgYiA9IGJsb2NrLmJ1bGxldC5leGVjKGNhcFtpKzFdKVswXTtcbiAgICAgICAgICBpZiAoYnVsbCAhPT0gYiAmJiAhKGJ1bGxbMV0gPT09ICcuJyAmJiBiWzFdID09PSAnLicpKSB7XG4gICAgICAgICAgICBzcmMgPSBjYXAuc2xpY2UoaSArIDEpLmpvaW4oJ1xcbicpICsgc3JjO1xuICAgICAgICAgICAgaSA9IGwgLSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERldGVybWluZSB3aGV0aGVyIGl0ZW0gaXMgbG9vc2Ugb3Igbm90LlxuICAgICAgICAvLyBVc2U6IC8oXnxcXG4pKD8hIClbXlxcbl0rXFxuXFxuKD8hXFxzKiQpL1xuICAgICAgICAvLyBmb3IgZGlzY291bnQgYmVoYXZpb3IuXG4gICAgICAgIGxvb3NlID0gbmV4dCB8fCAvXFxuXFxuKD8hXFxzKiQpLy50ZXN0KGl0ZW0pO1xuICAgICAgICBpZiAoaSAhPT0gbCAtIDEpIHtcbiAgICAgICAgICBuZXh0ID0gaXRlbVtpdGVtLmxlbmd0aC0xXSA9PT0gJ1xcbic7XG4gICAgICAgICAgaWYgKCFsb29zZSkgbG9vc2UgPSBuZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgICAgdHlwZTogbG9vc2VcbiAgICAgICAgICAgID8gJ2xvb3NlX2l0ZW1fc3RhcnQnXG4gICAgICAgICAgICA6ICdsaXN0X2l0ZW1fc3RhcnQnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFJlY3Vyc2UuXG4gICAgICAgIHRoaXMudG9rZW4oaXRlbSwgZmFsc2UpO1xuXG4gICAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdsaXN0X2l0ZW1fZW5kJ1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdsaXN0X2VuZCdcbiAgICAgIH0pO1xuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBodG1sXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuaHRtbC5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogdGhpcy5vcHRpb25zLnNhbml0aXplXG4gICAgICAgICAgPyAncGFyYWdyYXBoJ1xuICAgICAgICAgIDogJ2h0bWwnLFxuICAgICAgICBwcmU6IGNhcFsxXSA9PT0gJ3ByZScsXG4gICAgICAgIHRleHQ6IGNhcFswXVxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBkZWZcbiAgICBpZiAodG9wICYmIChjYXAgPSB0aGlzLnJ1bGVzLmRlZi5leGVjKHNyYykpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGhpcy50b2tlbnMubGlua3NbY2FwWzFdLnRvTG93ZXJDYXNlKCldID0ge1xuICAgICAgICBocmVmOiBjYXBbMl0sXG4gICAgICAgIHRpdGxlOiBjYXBbM11cbiAgICAgIH07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyB0YWJsZSAoZ2ZtKVxuICAgIGlmICh0b3AgJiYgKGNhcCA9IHRoaXMucnVsZXMudGFibGUuZXhlYyhzcmMpKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcblxuICAgICAgaXRlbSA9IHtcbiAgICAgICAgdHlwZTogJ3RhYmxlJyxcbiAgICAgICAgaGVhZGVyOiBjYXBbMV0ucmVwbGFjZSgvXiAqfCAqXFx8ICokL2csICcnKS5zcGxpdCgvICpcXHwgKi8pLFxuICAgICAgICBhbGlnbjogY2FwWzJdLnJlcGxhY2UoL14gKnxcXHwgKiQvZywgJycpLnNwbGl0KC8gKlxcfCAqLyksXG4gICAgICAgIGNlbGxzOiBjYXBbM10ucmVwbGFjZSgvKD86ICpcXHwgKik/XFxuJC8sICcnKS5zcGxpdCgnXFxuJylcbiAgICAgIH07XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBpdGVtLmFsaWduLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICgvXiAqLSs6ICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKSB7XG4gICAgICAgICAgaXRlbS5hbGlnbltpXSA9ICdyaWdodCc7XG4gICAgICAgIH0gZWxzZSBpZiAoL14gKjotKzogKiQvLnRlc3QoaXRlbS5hbGlnbltpXSkpIHtcbiAgICAgICAgICBpdGVtLmFsaWduW2ldID0gJ2NlbnRlcic7XG4gICAgICAgIH0gZWxzZSBpZiAoL14gKjotKyAqJC8udGVzdChpdGVtLmFsaWduW2ldKSkge1xuICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSAnbGVmdCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXRlbS5hbGlnbltpXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZm9yIChpID0gMDsgaSA8IGl0ZW0uY2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaXRlbS5jZWxsc1tpXSA9IGl0ZW0uY2VsbHNbaV1cbiAgICAgICAgICAucmVwbGFjZSgvXiAqXFx8ICp8ICpcXHwgKiQvZywgJycpXG4gICAgICAgICAgLnNwbGl0KC8gKlxcfCAqLyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudG9rZW5zLnB1c2goaXRlbSk7XG5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHRvcC1sZXZlbCBwYXJhZ3JhcGhcbiAgICBpZiAodG9wICYmIChjYXAgPSB0aGlzLnJ1bGVzLnBhcmFncmFwaC5leGVjKHNyYykpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnLFxuICAgICAgICB0ZXh0OiBjYXBbMV1bY2FwWzFdLmxlbmd0aC0xXSA9PT0gJ1xcbidcbiAgICAgICAgICA/IGNhcFsxXS5zbGljZSgwLCAtMSlcbiAgICAgICAgICA6IGNhcFsxXVxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyB0ZXh0XG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMudGV4dC5leGVjKHNyYykpIHtcbiAgICAgIC8vIFRvcC1sZXZlbCBzaG91bGQgbmV2ZXIgcmVhY2ggaGVyZS5cbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICB0ZXh0OiBjYXBbMF1cbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHNyYykge1xuICAgICAgdGhyb3cgbmV3XG4gICAgICAgIEVycm9yKCdJbmZpbml0ZSBsb29wIG9uIGJ5dGU6ICcgKyBzcmMuY2hhckNvZGVBdCgwKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXMudG9rZW5zO1xufTtcblxuLyoqXG4gKiBJbmxpbmUtTGV2ZWwgR3JhbW1hclxuICovXG5cbnZhciBpbmxpbmUgPSB7XG4gIGVzY2FwZTogL15cXFxcKFtcXFxcYCp7fVxcW1xcXSgpIytcXC0uIV8+XSkvLFxuICBhdXRvbGluazogL148KFteID5dKyhAfDpcXC8pW14gPl0rKT4vLFxuICB1cmw6IG5vb3AsXG4gIHRhZzogL148IS0tW1xcc1xcU10qPy0tPnxePFxcLz9cXHcrKD86XCJbXlwiXSpcInwnW14nXSonfFteJ1wiPl0pKj8+LyxcbiAgbGluazogL14hP1xcWyhpbnNpZGUpXFxdXFwoaHJlZlxcKS8sXG4gIHJlZmxpbms6IC9eIT9cXFsoaW5zaWRlKVxcXVxccypcXFsoW15cXF1dKilcXF0vLFxuICBub2xpbms6IC9eIT9cXFsoKD86XFxbW15cXF1dKlxcXXxbXlxcW1xcXV0pKilcXF0vLFxuICBzdHJvbmc6IC9eX18oW1xcc1xcU10rPylfXyg/IV8pfF5cXCpcXCooW1xcc1xcU10rPylcXCpcXCooPyFcXCopLyxcbiAgZW06IC9eXFxiXygoPzpfX3xbXFxzXFxTXSkrPylfXFxifF5cXCooKD86XFwqXFwqfFtcXHNcXFNdKSs/KVxcKig/IVxcKikvLFxuICBjb2RlOiAvXihgKylcXHMqKFtcXHNcXFNdKj9bXmBdKVxccypcXDEoPyFgKS8sXG4gIGJyOiAvXiB7Mix9XFxuKD8hXFxzKiQpLyxcbiAgZGVsOiBub29wLFxuICB0ZXh0OiAvXltcXHNcXFNdKz8oPz1bXFxcXDwhXFxbXypgXXwgezIsfVxcbnwkKS9cbn07XG5cbmlubGluZS5faW5zaWRlID0gLyg/OlxcW1teXFxdXSpcXF18W15cXF1dfFxcXSg/PVteXFxbXSpcXF0pKSovO1xuaW5saW5lLl9ocmVmID0gL1xccyo8PyhbXlxcc10qPyk+Pyg/OlxccytbJ1wiXShbXFxzXFxTXSo/KVsnXCJdKT9cXHMqLztcblxuaW5saW5lLmxpbmsgPSByZXBsYWNlKGlubGluZS5saW5rKVxuICAoJ2luc2lkZScsIGlubGluZS5faW5zaWRlKVxuICAoJ2hyZWYnLCBpbmxpbmUuX2hyZWYpXG4gICgpO1xuXG5pbmxpbmUucmVmbGluayA9IHJlcGxhY2UoaW5saW5lLnJlZmxpbmspXG4gICgnaW5zaWRlJywgaW5saW5lLl9pbnNpZGUpXG4gICgpO1xuXG4vKipcbiAqIE5vcm1hbCBJbmxpbmUgR3JhbW1hclxuICovXG5cbmlubGluZS5ub3JtYWwgPSBtZXJnZSh7fSwgaW5saW5lKTtcblxuLyoqXG4gKiBQZWRhbnRpYyBJbmxpbmUgR3JhbW1hclxuICovXG5cbmlubGluZS5wZWRhbnRpYyA9IG1lcmdlKHt9LCBpbmxpbmUubm9ybWFsLCB7XG4gIHN0cm9uZzogL15fXyg/PVxcUykoW1xcc1xcU10qP1xcUylfXyg/IV8pfF5cXCpcXCooPz1cXFMpKFtcXHNcXFNdKj9cXFMpXFwqXFwqKD8hXFwqKS8sXG4gIGVtOiAvXl8oPz1cXFMpKFtcXHNcXFNdKj9cXFMpXyg/IV8pfF5cXCooPz1cXFMpKFtcXHNcXFNdKj9cXFMpXFwqKD8hXFwqKS9cbn0pO1xuXG4vKipcbiAqIEdGTSBJbmxpbmUgR3JhbW1hclxuICovXG5cbmlubGluZS5nZm0gPSBtZXJnZSh7fSwgaW5saW5lLm5vcm1hbCwge1xuICBlc2NhcGU6IHJlcGxhY2UoaW5saW5lLmVzY2FwZSkoJ10pJywgJ358XSknKSgpLFxuICB1cmw6IC9eKGh0dHBzPzpcXC9cXC9bXlxcczxdK1tePC4sOjtcIicpXFxdXFxzXSkvLFxuICBkZWw6IC9efn4oPz1cXFMpKFtcXHNcXFNdKj9cXFMpfn4vLFxuICB0ZXh0OiByZXBsYWNlKGlubGluZS50ZXh0KVxuICAgICgnXXwnLCAnfl18JylcbiAgICAoJ3wnLCAnfGh0dHBzPzovL3wnKVxuICAgICgpXG59KTtcblxuLyoqXG4gKiBHRk0gKyBMaW5lIEJyZWFrcyBJbmxpbmUgR3JhbW1hclxuICovXG5cbmlubGluZS5icmVha3MgPSBtZXJnZSh7fSwgaW5saW5lLmdmbSwge1xuICBicjogcmVwbGFjZShpbmxpbmUuYnIpKCd7Mix9JywgJyonKSgpLFxuICB0ZXh0OiByZXBsYWNlKGlubGluZS5nZm0udGV4dCkoJ3syLH0nLCAnKicpKClcbn0pO1xuXG4vKipcbiAqIElubGluZSBMZXhlciAmIENvbXBpbGVyXG4gKi9cblxuZnVuY3Rpb24gSW5saW5lTGV4ZXIobGlua3MsIG9wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCBtYXJrZWQuZGVmYXVsdHM7XG4gIHRoaXMubGlua3MgPSBsaW5rcztcbiAgdGhpcy5ydWxlcyA9IGlubGluZS5ub3JtYWw7XG5cbiAgaWYgKCF0aGlzLmxpbmtzKSB7XG4gICAgdGhyb3cgbmV3XG4gICAgICBFcnJvcignVG9rZW5zIGFycmF5IHJlcXVpcmVzIGEgYGxpbmtzYCBwcm9wZXJ0eS4nKTtcbiAgfVxuXG4gIGlmICh0aGlzLm9wdGlvbnMuZ2ZtKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5icmVha3MpIHtcbiAgICAgIHRoaXMucnVsZXMgPSBpbmxpbmUuYnJlYWtzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJ1bGVzID0gaW5saW5lLmdmbTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnBlZGFudGljKSB7XG4gICAgdGhpcy5ydWxlcyA9IGlubGluZS5wZWRhbnRpYztcbiAgfVxufVxuXG4vKipcbiAqIEV4cG9zZSBJbmxpbmUgUnVsZXNcbiAqL1xuXG5JbmxpbmVMZXhlci5ydWxlcyA9IGlubGluZTtcblxuLyoqXG4gKiBTdGF0aWMgTGV4aW5nL0NvbXBpbGluZyBNZXRob2RcbiAqL1xuXG5JbmxpbmVMZXhlci5vdXRwdXQgPSBmdW5jdGlvbihzcmMsIGxpbmtzLCBvcHRpb25zKSB7XG4gIHZhciBpbmxpbmUgPSBuZXcgSW5saW5lTGV4ZXIobGlua3MsIG9wdGlvbnMpO1xuICByZXR1cm4gaW5saW5lLm91dHB1dChzcmMpO1xufTtcblxuLyoqXG4gKiBMZXhpbmcvQ29tcGlsaW5nXG4gKi9cblxuSW5saW5lTGV4ZXIucHJvdG90eXBlLm91dHB1dCA9IGZ1bmN0aW9uKHNyYykge1xuICB2YXIgb3V0ID0gJydcbiAgICAsIGxpbmtcbiAgICAsIHRleHRcbiAgICAsIGhyZWZcbiAgICAsIGNhcDtcblxuICB3aGlsZSAoc3JjKSB7XG4gICAgLy8gZXNjYXBlXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuZXNjYXBlLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSBjYXBbMV07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBhdXRvbGlua1xuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmF1dG9saW5rLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIGlmIChjYXBbMl0gPT09ICdAJykge1xuICAgICAgICB0ZXh0ID0gY2FwWzFdWzZdID09PSAnOidcbiAgICAgICAgICA/IHRoaXMubWFuZ2xlKGNhcFsxXS5zdWJzdHJpbmcoNykpXG4gICAgICAgICAgOiB0aGlzLm1hbmdsZShjYXBbMV0pO1xuICAgICAgICBocmVmID0gdGhpcy5tYW5nbGUoJ21haWx0bzonKSArIHRleHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0ZXh0ID0gZXNjYXBlKGNhcFsxXSk7XG4gICAgICAgIGhyZWYgPSB0ZXh0O1xuICAgICAgfVxuICAgICAgb3V0ICs9ICc8YSBocmVmPVwiJ1xuICAgICAgICArIGhyZWZcbiAgICAgICAgKyAnXCI+J1xuICAgICAgICArIHRleHRcbiAgICAgICAgKyAnPC9hPic7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyB1cmwgKGdmbSlcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy51cmwuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGV4dCA9IGVzY2FwZShjYXBbMV0pO1xuICAgICAgaHJlZiA9IHRleHQ7XG4gICAgICBvdXQgKz0gJzxhIGhyZWY9XCInXG4gICAgICAgICsgaHJlZlxuICAgICAgICArICdcIj4nXG4gICAgICAgICsgdGV4dFxuICAgICAgICArICc8L2E+JztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHRhZ1xuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLnRhZy5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBvdXQgKz0gdGhpcy5vcHRpb25zLnNhbml0aXplXG4gICAgICAgID8gZXNjYXBlKGNhcFswXSlcbiAgICAgICAgOiBjYXBbMF07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBsaW5rXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMubGluay5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBvdXQgKz0gdGhpcy5vdXRwdXRMaW5rKGNhcCwge1xuICAgICAgICBocmVmOiBjYXBbMl0sXG4gICAgICAgIHRpdGxlOiBjYXBbM11cbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gcmVmbGluaywgbm9saW5rXG4gICAgaWYgKChjYXAgPSB0aGlzLnJ1bGVzLnJlZmxpbmsuZXhlYyhzcmMpKVxuICAgICAgICB8fCAoY2FwID0gdGhpcy5ydWxlcy5ub2xpbmsuZXhlYyhzcmMpKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIGxpbmsgPSAoY2FwWzJdIHx8IGNhcFsxXSkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xuICAgICAgbGluayA9IHRoaXMubGlua3NbbGluay50b0xvd2VyQ2FzZSgpXTtcbiAgICAgIGlmICghbGluayB8fCAhbGluay5ocmVmKSB7XG4gICAgICAgIG91dCArPSBjYXBbMF1bMF07XG4gICAgICAgIHNyYyA9IGNhcFswXS5zdWJzdHJpbmcoMSkgKyBzcmM7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgb3V0ICs9IHRoaXMub3V0cHV0TGluayhjYXAsIGxpbmspO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gc3Ryb25nXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuc3Ryb25nLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSAnPHN0cm9uZz4nXG4gICAgICAgICsgdGhpcy5vdXRwdXQoY2FwWzJdIHx8IGNhcFsxXSlcbiAgICAgICAgKyAnPC9zdHJvbmc+JztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGVtXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuZW0uZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9ICc8ZW0+J1xuICAgICAgICArIHRoaXMub3V0cHV0KGNhcFsyXSB8fCBjYXBbMV0pXG4gICAgICAgICsgJzwvZW0+JztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGNvZGVcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5jb2RlLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSAnPGNvZGU+J1xuICAgICAgICArIGVzY2FwZShjYXBbMl0sIHRydWUpXG4gICAgICAgICsgJzwvY29kZT4nO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gYnJcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5ici5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBvdXQgKz0gJzxicj4nO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gZGVsIChnZm0pXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuZGVsLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSAnPGRlbD4nXG4gICAgICAgICsgdGhpcy5vdXRwdXQoY2FwWzFdKVxuICAgICAgICArICc8L2RlbD4nO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdGV4dFxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLnRleHQuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9IGVzY2FwZShjYXBbMF0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHNyYykge1xuICAgICAgdGhyb3cgbmV3XG4gICAgICAgIEVycm9yKCdJbmZpbml0ZSBsb29wIG9uIGJ5dGU6ICcgKyBzcmMuY2hhckNvZGVBdCgwKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29tcGlsZSBMaW5rXG4gKi9cblxuSW5saW5lTGV4ZXIucHJvdG90eXBlLm91dHB1dExpbmsgPSBmdW5jdGlvbihjYXAsIGxpbmspIHtcbiAgaWYgKGNhcFswXVswXSAhPT0gJyEnKSB7XG4gICAgcmV0dXJuICc8YSBocmVmPVwiJ1xuICAgICAgKyBlc2NhcGUobGluay5ocmVmKVxuICAgICAgKyAnXCInXG4gICAgICArIChsaW5rLnRpdGxlXG4gICAgICA/ICcgdGl0bGU9XCInXG4gICAgICArIGVzY2FwZShsaW5rLnRpdGxlKVxuICAgICAgKyAnXCInXG4gICAgICA6ICcnKVxuICAgICAgKyAnPidcbiAgICAgICsgdGhpcy5vdXRwdXQoY2FwWzFdKVxuICAgICAgKyAnPC9hPic7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICc8aW1nIHNyYz1cIidcbiAgICAgICsgZXNjYXBlKGxpbmsuaHJlZilcbiAgICAgICsgJ1wiIGFsdD1cIidcbiAgICAgICsgZXNjYXBlKGNhcFsxXSlcbiAgICAgICsgJ1wiJ1xuICAgICAgKyAobGluay50aXRsZVxuICAgICAgPyAnIHRpdGxlPVwiJ1xuICAgICAgKyBlc2NhcGUobGluay50aXRsZSlcbiAgICAgICsgJ1wiJ1xuICAgICAgOiAnJylcbiAgICAgICsgJz4nO1xuICB9XG59O1xuXG4vKipcbiAqIE1hbmdsZSBMaW5rc1xuICovXG5cbklubGluZUxleGVyLnByb3RvdHlwZS5tYW5nbGUgPSBmdW5jdGlvbih0ZXh0KSB7XG4gIHZhciBvdXQgPSAnJ1xuICAgICwgbCA9IHRleHQubGVuZ3RoXG4gICAgLCBpID0gMFxuICAgICwgY2g7XG5cbiAgZm9yICg7IGkgPCBsOyBpKyspIHtcbiAgICBjaCA9IHRleHQuY2hhckNvZGVBdChpKTtcbiAgICBpZiAoTWF0aC5yYW5kb20oKSA+IDAuNSkge1xuICAgICAgY2ggPSAneCcgKyBjaC50b1N0cmluZygxNik7XG4gICAgfVxuICAgIG91dCArPSAnJiMnICsgY2ggKyAnOyc7XG4gIH1cblxuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQYXJzaW5nICYgQ29tcGlsaW5nXG4gKi9cblxuZnVuY3Rpb24gUGFyc2VyKG9wdGlvbnMpIHtcbiAgdGhpcy50b2tlbnMgPSBbXTtcbiAgdGhpcy50b2tlbiA9IG51bGw7XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgbWFya2VkLmRlZmF1bHRzO1xufVxuXG4vKipcbiAqIFN0YXRpYyBQYXJzZSBNZXRob2RcbiAqL1xuXG5QYXJzZXIucGFyc2UgPSBmdW5jdGlvbihzcmMsIG9wdGlvbnMpIHtcbiAgdmFyIHBhcnNlciA9IG5ldyBQYXJzZXIob3B0aW9ucyk7XG4gIHJldHVybiBwYXJzZXIucGFyc2Uoc3JjKTtcbn07XG5cbi8qKlxuICogUGFyc2UgTG9vcFxuICovXG5cblBhcnNlci5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbihzcmMpIHtcbiAgdGhpcy5pbmxpbmUgPSBuZXcgSW5saW5lTGV4ZXIoc3JjLmxpbmtzLCB0aGlzLm9wdGlvbnMpO1xuICB0aGlzLnRva2VucyA9IHNyYy5yZXZlcnNlKCk7XG5cbiAgdmFyIG91dCA9ICcnO1xuICB3aGlsZSAodGhpcy5uZXh0KCkpIHtcbiAgICBvdXQgKz0gdGhpcy50b2soKTtcbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIE5leHQgVG9rZW5cbiAqL1xuXG5QYXJzZXIucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMudG9rZW4gPSB0aGlzLnRva2Vucy5wb3AoKTtcbn07XG5cbi8qKlxuICogUHJldmlldyBOZXh0IFRva2VuXG4gKi9cblxuUGFyc2VyLnByb3RvdHlwZS5wZWVrID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnRva2Vuc1t0aGlzLnRva2Vucy5sZW5ndGgtMV0gfHwgMDtcbn07XG5cbi8qKlxuICogUGFyc2UgVGV4dCBUb2tlbnNcbiAqL1xuXG5QYXJzZXIucHJvdG90eXBlLnBhcnNlVGV4dCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYm9keSA9IHRoaXMudG9rZW4udGV4dDtcblxuICB3aGlsZSAodGhpcy5wZWVrKCkudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgYm9keSArPSAnXFxuJyArIHRoaXMubmV4dCgpLnRleHQ7XG4gIH1cblxuICByZXR1cm4gdGhpcy5pbmxpbmUub3V0cHV0KGJvZHkpO1xufTtcblxuLyoqXG4gKiBQYXJzZSBDdXJyZW50IFRva2VuXG4gKi9cblxuUGFyc2VyLnByb3RvdHlwZS50b2sgPSBmdW5jdGlvbigpIHtcbiAgc3dpdGNoICh0aGlzLnRva2VuLnR5cGUpIHtcbiAgICBjYXNlICdzcGFjZSc6IHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgY2FzZSAnaHInOiB7XG4gICAgICByZXR1cm4gJzxocj5cXG4nO1xuICAgIH1cbiAgICBjYXNlICdoZWFkaW5nJzoge1xuICAgICAgcmV0dXJuICc8aCdcbiAgICAgICAgKyB0aGlzLnRva2VuLmRlcHRoXG4gICAgICAgICsgJz4nXG4gICAgICAgICsgdGhpcy5pbmxpbmUub3V0cHV0KHRoaXMudG9rZW4udGV4dClcbiAgICAgICAgKyAnPC9oJ1xuICAgICAgICArIHRoaXMudG9rZW4uZGVwdGhcbiAgICAgICAgKyAnPlxcbic7XG4gICAgfVxuICAgIGNhc2UgJ2NvZGUnOiB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmhpZ2hsaWdodCkge1xuICAgICAgICB2YXIgY29kZSA9IHRoaXMub3B0aW9ucy5oaWdobGlnaHQodGhpcy50b2tlbi50ZXh0LCB0aGlzLnRva2VuLmxhbmcpO1xuICAgICAgICBpZiAoY29kZSAhPSBudWxsICYmIGNvZGUgIT09IHRoaXMudG9rZW4udGV4dCkge1xuICAgICAgICAgIHRoaXMudG9rZW4uZXNjYXBlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy50b2tlbi50ZXh0ID0gY29kZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMudG9rZW4uZXNjYXBlZCkge1xuICAgICAgICB0aGlzLnRva2VuLnRleHQgPSBlc2NhcGUodGhpcy50b2tlbi50ZXh0LCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICc8cHJlPjxjb2RlJ1xuICAgICAgICArICh0aGlzLnRva2VuLmxhbmdcbiAgICAgICAgPyAnIGNsYXNzPVwiJ1xuICAgICAgICArIHRoaXMub3B0aW9ucy5sYW5nUHJlZml4XG4gICAgICAgICsgdGhpcy50b2tlbi5sYW5nXG4gICAgICAgICsgJ1wiJ1xuICAgICAgICA6ICcnKVxuICAgICAgICArICc+J1xuICAgICAgICArIHRoaXMudG9rZW4udGV4dFxuICAgICAgICArICc8L2NvZGU+PC9wcmU+XFxuJztcbiAgICB9XG4gICAgY2FzZSAndGFibGUnOiB7XG4gICAgICB2YXIgYm9keSA9ICcnXG4gICAgICAgICwgaGVhZGluZ1xuICAgICAgICAsIGlcbiAgICAgICAgLCByb3dcbiAgICAgICAgLCBjZWxsXG4gICAgICAgICwgajtcblxuICAgICAgLy8gaGVhZGVyXG4gICAgICBib2R5ICs9ICc8dGhlYWQ+XFxuPHRyPlxcbic7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy50b2tlbi5oZWFkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaGVhZGluZyA9IHRoaXMuaW5saW5lLm91dHB1dCh0aGlzLnRva2VuLmhlYWRlcltpXSk7XG4gICAgICAgIGJvZHkgKz0gdGhpcy50b2tlbi5hbGlnbltpXVxuICAgICAgICAgID8gJzx0aCBhbGlnbj1cIicgKyB0aGlzLnRva2VuLmFsaWduW2ldICsgJ1wiPicgKyBoZWFkaW5nICsgJzwvdGg+XFxuJ1xuICAgICAgICAgIDogJzx0aD4nICsgaGVhZGluZyArICc8L3RoPlxcbic7XG4gICAgICB9XG4gICAgICBib2R5ICs9ICc8L3RyPlxcbjwvdGhlYWQ+XFxuJztcblxuICAgICAgLy8gYm9keVxuICAgICAgYm9keSArPSAnPHRib2R5PlxcbidcbiAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnRva2VuLmNlbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJvdyA9IHRoaXMudG9rZW4uY2VsbHNbaV07XG4gICAgICAgIGJvZHkgKz0gJzx0cj5cXG4nO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgcm93Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY2VsbCA9IHRoaXMuaW5saW5lLm91dHB1dChyb3dbal0pO1xuICAgICAgICAgIGJvZHkgKz0gdGhpcy50b2tlbi5hbGlnbltqXVxuICAgICAgICAgICAgPyAnPHRkIGFsaWduPVwiJyArIHRoaXMudG9rZW4uYWxpZ25bal0gKyAnXCI+JyArIGNlbGwgKyAnPC90ZD5cXG4nXG4gICAgICAgICAgICA6ICc8dGQ+JyArIGNlbGwgKyAnPC90ZD5cXG4nO1xuICAgICAgICB9XG4gICAgICAgIGJvZHkgKz0gJzwvdHI+XFxuJztcbiAgICAgIH1cbiAgICAgIGJvZHkgKz0gJzwvdGJvZHk+XFxuJztcblxuICAgICAgcmV0dXJuICc8dGFibGU+XFxuJ1xuICAgICAgICArIGJvZHlcbiAgICAgICAgKyAnPC90YWJsZT5cXG4nO1xuICAgIH1cbiAgICBjYXNlICdibG9ja3F1b3RlX3N0YXJ0Jzoge1xuICAgICAgdmFyIGJvZHkgPSAnJztcblxuICAgICAgd2hpbGUgKHRoaXMubmV4dCgpLnR5cGUgIT09ICdibG9ja3F1b3RlX2VuZCcpIHtcbiAgICAgICAgYm9keSArPSB0aGlzLnRvaygpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJzxibG9ja3F1b3RlPlxcbidcbiAgICAgICAgKyBib2R5XG4gICAgICAgICsgJzwvYmxvY2txdW90ZT5cXG4nO1xuICAgIH1cbiAgICBjYXNlICdsaXN0X3N0YXJ0Jzoge1xuICAgICAgdmFyIHR5cGUgPSB0aGlzLnRva2VuLm9yZGVyZWQgPyAnb2wnIDogJ3VsJ1xuICAgICAgICAsIGJvZHkgPSAnJztcblxuICAgICAgd2hpbGUgKHRoaXMubmV4dCgpLnR5cGUgIT09ICdsaXN0X2VuZCcpIHtcbiAgICAgICAgYm9keSArPSB0aGlzLnRvaygpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJzwnXG4gICAgICAgICsgdHlwZVxuICAgICAgICArICc+XFxuJ1xuICAgICAgICArIGJvZHlcbiAgICAgICAgKyAnPC8nXG4gICAgICAgICsgdHlwZVxuICAgICAgICArICc+XFxuJztcbiAgICB9XG4gICAgY2FzZSAnbGlzdF9pdGVtX3N0YXJ0Jzoge1xuICAgICAgdmFyIGJvZHkgPSAnJztcblxuICAgICAgd2hpbGUgKHRoaXMubmV4dCgpLnR5cGUgIT09ICdsaXN0X2l0ZW1fZW5kJykge1xuICAgICAgICBib2R5ICs9IHRoaXMudG9rZW4udHlwZSA9PT0gJ3RleHQnXG4gICAgICAgICAgPyB0aGlzLnBhcnNlVGV4dCgpXG4gICAgICAgICAgOiB0aGlzLnRvaygpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJzxsaT4nXG4gICAgICAgICsgYm9keVxuICAgICAgICArICc8L2xpPlxcbic7XG4gICAgfVxuICAgIGNhc2UgJ2xvb3NlX2l0ZW1fc3RhcnQnOiB7XG4gICAgICB2YXIgYm9keSA9ICcnO1xuXG4gICAgICB3aGlsZSAodGhpcy5uZXh0KCkudHlwZSAhPT0gJ2xpc3RfaXRlbV9lbmQnKSB7XG4gICAgICAgIGJvZHkgKz0gdGhpcy50b2soKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICc8bGk+J1xuICAgICAgICArIGJvZHlcbiAgICAgICAgKyAnPC9saT5cXG4nO1xuICAgIH1cbiAgICBjYXNlICdodG1sJzoge1xuICAgICAgcmV0dXJuICF0aGlzLnRva2VuLnByZSAmJiAhdGhpcy5vcHRpb25zLnBlZGFudGljXG4gICAgICAgID8gdGhpcy5pbmxpbmUub3V0cHV0KHRoaXMudG9rZW4udGV4dClcbiAgICAgICAgOiB0aGlzLnRva2VuLnRleHQ7XG4gICAgfVxuICAgIGNhc2UgJ3BhcmFncmFwaCc6IHtcbiAgICAgIHJldHVybiAnPHA+J1xuICAgICAgICArIHRoaXMuaW5saW5lLm91dHB1dCh0aGlzLnRva2VuLnRleHQpXG4gICAgICAgICsgJzwvcD5cXG4nO1xuICAgIH1cbiAgICBjYXNlICd0ZXh0Jzoge1xuICAgICAgcmV0dXJuICc8cD4nXG4gICAgICAgICsgdGhpcy5wYXJzZVRleHQoKVxuICAgICAgICArICc8L3A+XFxuJztcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogSGVscGVyc1xuICovXG5cbmZ1bmN0aW9uIGVzY2FwZShodG1sLCBlbmNvZGUpIHtcbiAgcmV0dXJuIGh0bWxcbiAgICAucmVwbGFjZSghZW5jb2RlID8gLyYoPyEjP1xcdys7KS9nIDogLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZShyZWdleCwgb3B0KSB7XG4gIHJlZ2V4ID0gcmVnZXguc291cmNlO1xuICBvcHQgPSBvcHQgfHwgJyc7XG4gIHJldHVybiBmdW5jdGlvbiBzZWxmKG5hbWUsIHZhbCkge1xuICAgIGlmICghbmFtZSkgcmV0dXJuIG5ldyBSZWdFeHAocmVnZXgsIG9wdCk7XG4gICAgdmFsID0gdmFsLnNvdXJjZSB8fCB2YWw7XG4gICAgdmFsID0gdmFsLnJlcGxhY2UoLyhefFteXFxbXSlcXF4vZywgJyQxJyk7XG4gICAgcmVnZXggPSByZWdleC5yZXBsYWNlKG5hbWUsIHZhbCk7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxubm9vcC5leGVjID0gbm9vcDtcblxuZnVuY3Rpb24gbWVyZ2Uob2JqKSB7XG4gIHZhciBpID0gMVxuICAgICwgdGFyZ2V0XG4gICAgLCBrZXk7XG5cbiAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICB0YXJnZXQgPSBhcmd1bWVudHNbaV07XG4gICAgZm9yIChrZXkgaW4gdGFyZ2V0KSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRhcmdldCwga2V5KSkge1xuICAgICAgICBvYmpba2V5XSA9IHRhcmdldFtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogTWFya2VkXG4gKi9cblxuZnVuY3Rpb24gbWFya2VkKHNyYywgb3B0KSB7XG4gIHRyeSB7XG4gICAgaWYgKG9wdCkgb3B0ID0gbWVyZ2Uoe30sIG1hcmtlZC5kZWZhdWx0cywgb3B0KTtcbiAgICByZXR1cm4gUGFyc2VyLnBhcnNlKExleGVyLmxleChzcmMsIG9wdCksIG9wdCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlLm1lc3NhZ2UgKz0gJ1xcblBsZWFzZSByZXBvcnQgdGhpcyB0byBodHRwczovL2dpdGh1Yi5jb20vY2hqai9tYXJrZWQuJztcbiAgICBpZiAoKG9wdCB8fCBtYXJrZWQuZGVmYXVsdHMpLnNpbGVudCkge1xuICAgICAgcmV0dXJuICc8cD5BbiBlcnJvciBvY2N1cmVkOjwvcD48cHJlPidcbiAgICAgICAgKyBlc2NhcGUoZS5tZXNzYWdlICsgJycsIHRydWUpXG4gICAgICAgICsgJzwvcHJlPic7XG4gICAgfVxuICAgIHRocm93IGU7XG4gIH1cbn1cblxuLyoqXG4gKiBPcHRpb25zXG4gKi9cblxubWFya2VkLm9wdGlvbnMgPVxubWFya2VkLnNldE9wdGlvbnMgPSBmdW5jdGlvbihvcHQpIHtcbiAgbWVyZ2UobWFya2VkLmRlZmF1bHRzLCBvcHQpO1xuICByZXR1cm4gbWFya2VkO1xufTtcblxubWFya2VkLmRlZmF1bHRzID0ge1xuICBnZm06IHRydWUsXG4gIHRhYmxlczogdHJ1ZSxcbiAgYnJlYWtzOiBmYWxzZSxcbiAgcGVkYW50aWM6IGZhbHNlLFxuICBzYW5pdGl6ZTogZmFsc2UsXG4gIHNtYXJ0TGlzdHM6IGZhbHNlLFxuICBzaWxlbnQ6IGZhbHNlLFxuICBoaWdobGlnaHQ6IG51bGwsXG4gIGxhbmdQcmVmaXg6ICdsYW5nLSdcbn07XG5cbi8qKlxuICogRXhwb3NlXG4gKi9cblxubWFya2VkLlBhcnNlciA9IFBhcnNlcjtcbm1hcmtlZC5wYXJzZXIgPSBQYXJzZXIucGFyc2U7XG5cbm1hcmtlZC5MZXhlciA9IExleGVyO1xubWFya2VkLmxleGVyID0gTGV4ZXIubGV4O1xuXG5tYXJrZWQuSW5saW5lTGV4ZXIgPSBJbmxpbmVMZXhlcjtcbm1hcmtlZC5pbmxpbmVMZXhlciA9IElubGluZUxleGVyLm91dHB1dDtcblxubWFya2VkLnBhcnNlID0gbWFya2VkO1xuXG5pZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gbWFya2VkO1xufSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gbWFya2VkOyB9KTtcbn0gZWxzZSB7XG4gIHRoaXMubWFya2VkID0gbWFya2VkO1xufVxuXG59KS5jYWxsKGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcyB8fCAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiBnbG9iYWwpO1xufSgpKTtcblxufSkod2luZG93KSIsIlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocmFycnksIHRlbXBsYXRlKSB7XG5cbiAgdmFyIHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICB0ZW1wbGF0ZSA9IHRlbXBsYXRlIHx8IGZ1bmN0aW9uICh2YWwsIGtleSwgZWwpIHtcbiAgICBmdW5jdGlvbiBwcmUgKHZhbCkgeyByZXR1cm4gJzxwcmU+JytKU09OLnN0cmluZ2lmeSh2YWwpKyc8L3ByZT4nIH1cbiAgICBpZihlbClcbiAgICAgIHJldHVybiBlbC5pbm5lckhUTUwgPSBwcmUodmFsKSwgZWxcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcbiAgICBlbC5pbm5lckhUTUwgPSBwcmUodmFsKVxuICAgIHJldHVybiBlbFxuICB9XG5cbiAgY29uc29sZS5sb2codGVtcGxhdGUpXG5cbiAgdmFyIGVsZW1lbnRzID0ge31cblxuICByYXJyeS5vbigndXBkYXRlJywgZnVuY3Rpb24gKGNoYW5nZSkge1xuICAgIGZvcih2YXIgaWQgaW4gY2hhbmdlKVxuICAgICAgdXBkYXRlKGlkLCBjaGFuZ2VbaWRdKVxuICB9KVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZSAoa2V5LCBjaGFuZ2UpIHtcbiAgICB2YXIgZWxcbiAgICBpZihlbCA9IGVsZW1lbnRzW2tleV0pIHtcbiAgICAgIGlmKGNoYW5nZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByb290LnJlbW92ZUNoaWxkKGVsKVxuICAgICAgfVxuXG4gICAgICB2YXIgX2VsID0gdGVtcGxhdGUuY2FsbChlbCwgY2hhbmdlLCBrZXksIGVsKVxuICAgICAgaWYoX2VsICE9IGVsKSB7XG4gICAgICAgIGVsZW1lbnRzW2tleV0gPSBfZWxcbiAgICAgICAgZGl2LnJlcGxhY2VDaGlsZChfZWwsIGVsKVxuICAgICAgfVxuICAgICAgLy9lbHNlLCB0ZW1wbGF0ZSB1cGRhdGVkIGVsLlxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGVsID0gdGVtcGxhdGUuY2FsbChudWxsLCBjaGFuZ2UsIGtleSlcbiAgICAgIGNvbnNvbGUubG9nKGVsKVxuICAgIC8vdmFyIHJhcnJ5LmluZGV4T2YoaWQpXG4gICAgLy9pbnNlcnQgYmVmb3JlIHRoZSBlbGVtZW50IHRoYXQgaXMgYWxyZWFkeSB0aGVyZS4uLlxuICAgIHZhciBiZWZvcmUgPSBlbGVtZW50c1tyYXJyeS5rZXlzW3JhcnJ5LmluZGV4T2ZLZXkoa2V5KSArIDFdXVxuICAgIGVsZW1lbnRzW2tleV0gPSBlbFxuICAgIGlmKGJlZm9yZSkge1xuICAgICAgcm9vdC5pbnNlcnRCZWZvcmUoZWwsIGJlZm9yZSlcbiAgICB9IGVsc2Uge1xuICAgICAgcm9vdC5hcHBlbmRDaGlsZChlbClcbiAgICB9XG4gIH1cblxuICAvL3JlbmRlciB0aGUgY3VycmVudCBjb250ZW50cy4uLlxuICByYXJyeS5rZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIHVwZGF0ZShrZXksIHJhcnJ5LmdldChrZXkpKVxuICB9KVxuXG4gIHJldHVybiByb290XG59XG5cbiIsInZhciBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcblxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcbmV4cG9ydHMuaXNEYXRlID0gZnVuY3Rpb24ob2JqKXtyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IERhdGVdJ307XG5leHBvcnRzLmlzUmVnRXhwID0gZnVuY3Rpb24ob2JqKXtyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nfTtcblxuXG5leHBvcnRzLnByaW50ID0gZnVuY3Rpb24gKCkge307XG5leHBvcnRzLnB1dHMgPSBmdW5jdGlvbiAoKSB7fTtcbmV4cG9ydHMuZGVidWcgPSBmdW5jdGlvbigpIHt9O1xuXG5leHBvcnRzLmluc3BlY3QgPSBmdW5jdGlvbihvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMpIHtcbiAgdmFyIHNlZW4gPSBbXTtcblxuICB2YXIgc3R5bGl6ZSA9IGZ1bmN0aW9uKHN0ciwgc3R5bGVUeXBlKSB7XG4gICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG4gICAgdmFyIHN0eWxlcyA9XG4gICAgICAgIHsgJ2JvbGQnIDogWzEsIDIyXSxcbiAgICAgICAgICAnaXRhbGljJyA6IFszLCAyM10sXG4gICAgICAgICAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAgICAgICAgICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICAgICAgICAgJ3doaXRlJyA6IFszNywgMzldLFxuICAgICAgICAgICdncmV5JyA6IFs5MCwgMzldLFxuICAgICAgICAgICdibGFjaycgOiBbMzAsIDM5XSxcbiAgICAgICAgICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgICAgICAgICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgICAgICAgICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICAgICAgICAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICAgICAgICAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgICAgICAgICAneWVsbG93JyA6IFszMywgMzldIH07XG5cbiAgICB2YXIgc3R5bGUgPVxuICAgICAgICB7ICdzcGVjaWFsJzogJ2N5YW4nLFxuICAgICAgICAgICdudW1iZXInOiAnYmx1ZScsXG4gICAgICAgICAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgICAgICAgICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAgICAgICAgICdudWxsJzogJ2JvbGQnLFxuICAgICAgICAgICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAgICAgICAgICdkYXRlJzogJ21hZ2VudGEnLFxuICAgICAgICAgIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICAgICAgICAgJ3JlZ2V4cCc6ICdyZWQnIH1bc3R5bGVUeXBlXTtcblxuICAgIGlmIChzdHlsZSkge1xuICAgICAgcmV0dXJuICdcXDAzM1snICsgc3R5bGVzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICAgJ1xcMDMzWycgKyBzdHlsZXNbc3R5bGVdWzFdICsgJ20nO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgfTtcbiAgaWYgKCEgY29sb3JzKSB7XG4gICAgc3R5bGl6ZSA9IGZ1bmN0aW9uKHN0ciwgc3R5bGVUeXBlKSB7IHJldHVybiBzdHI7IH07XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXQodmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAgIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlLmluc3BlY3QgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICAgIHZhbHVlICE9PSBleHBvcnRzICYmXG4gICAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgICByZXR1cm4gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMpO1xuICAgIH1cblxuICAgIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICAgIGNhc2UgJ3VuZGVmaW5lZCc6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG5cbiAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgICAgIHJldHVybiBzdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuXG4gICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG5cbiAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAgIH1cbiAgICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG4gICAgfVxuXG4gICAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICAgIHZhciB2aXNpYmxlX2tleXMgPSBPYmplY3Rfa2V5cyh2YWx1ZSk7XG4gICAgdmFyIGtleXMgPSBzaG93SGlkZGVuID8gT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXModmFsdWUpIDogdmlzaWJsZV9rZXlzO1xuXG4gICAgLy8gRnVuY3Rpb25zIHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAncmVnZXhwJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGF0ZXMgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZFxuICAgIGlmIChpc0RhdGUodmFsdWUpICYmIGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gc3R5bGl6ZSh2YWx1ZS50b1VUQ1N0cmluZygpLCAnZGF0ZScpO1xuICAgIH1cblxuICAgIHZhciBiYXNlLCB0eXBlLCBicmFjZXM7XG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBvYmplY3QgdHlwZVxuICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgdHlwZSA9ICdBcnJheSc7XG4gICAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eXBlID0gJ09iamVjdCc7XG4gICAgICBicmFjZXMgPSBbJ3snLCAnfSddO1xuICAgIH1cblxuICAgIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICBiYXNlID0gKGlzUmVnRXhwKHZhbHVlKSkgPyAnICcgKyB2YWx1ZSA6ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhc2UgPSAnJztcbiAgICB9XG5cbiAgICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgYmFzZSA9ICcgJyArIHZhbHVlLnRvVVRDU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgICB9XG5cbiAgICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAncmVnZXhwJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgICB2YXIgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgbmFtZSwgc3RyO1xuICAgICAgaWYgKHZhbHVlLl9fbG9va3VwR2V0dGVyX18pIHtcbiAgICAgICAgaWYgKHZhbHVlLl9fbG9va3VwR2V0dGVyX18oa2V5KSkge1xuICAgICAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cFNldHRlcl9fKGtleSkpIHtcbiAgICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHZhbHVlLl9fbG9va3VwU2V0dGVyX18oa2V5KSkge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHZpc2libGVfa2V5cy5pbmRleE9mKGtleSkgPCAwKSB7XG4gICAgICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gICAgICB9XG4gICAgICBpZiAoIXN0cikge1xuICAgICAgICBpZiAoc2Vlbi5pbmRleE9mKHZhbHVlW2tleV0pIDwgMCkge1xuICAgICAgICAgIGlmIChyZWN1cnNlVGltZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciA9IGZvcm1hdCh2YWx1ZVtrZXldKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyID0gZm9ybWF0KHZhbHVlW2tleV0sIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdBcnJheScgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICAgICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICAgICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICAgICAgbmFtZSA9IHN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgICAgIG5hbWUgPSBzdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG4gICAgfSk7XG5cbiAgICBzZWVuLnBvcCgpO1xuXG4gICAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICAgIG51bUxpbmVzRXN0Kys7XG4gICAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgICByZXR1cm4gcHJldiArIGN1ci5sZW5ndGggKyAxO1xuICAgIH0sIDApO1xuXG4gICAgaWYgKGxlbmd0aCA+IDUwKSB7XG4gICAgICBvdXRwdXQgPSBicmFjZXNbMF0gK1xuICAgICAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICAgICAnICcgK1xuICAgICAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgICAgICcgJyArXG4gICAgICAgICAgICAgICBicmFjZXNbMV07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0ID0gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbiAgcmV0dXJuIGZvcm1hdChvYmosICh0eXBlb2YgZGVwdGggPT09ICd1bmRlZmluZWQnID8gMiA6IGRlcHRoKSk7XG59O1xuXG5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIGFyIGluc3RhbmNlb2YgQXJyYXkgfHxcbiAgICAgICAgIEFycmF5LmlzQXJyYXkoYXIpIHx8XG4gICAgICAgICAoYXIgJiYgYXIgIT09IE9iamVjdC5wcm90b3R5cGUgJiYgaXNBcnJheShhci5fX3Byb3RvX18pKTtcbn1cblxuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gcmUgaW5zdGFuY2VvZiBSZWdFeHAgfHxcbiAgICAodHlwZW9mIHJlID09PSAnb2JqZWN0JyAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocmUpID09PSAnW29iamVjdCBSZWdFeHBdJyk7XG59XG5cblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgaWYgKGQgaW5zdGFuY2VvZiBEYXRlKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKHR5cGVvZiBkICE9PSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICB2YXIgcHJvcGVydGllcyA9IERhdGUucHJvdG90eXBlICYmIE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzKERhdGUucHJvdG90eXBlKTtcbiAgdmFyIHByb3RvID0gZC5fX3Byb3RvX18gJiYgT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXMoZC5fX3Byb3RvX18pO1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocHJvdG8pID09PSBKU09OLnN0cmluZ2lmeShwcm9wZXJ0aWVzKTtcbn1cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cbmV4cG9ydHMubG9nID0gZnVuY3Rpb24gKG1zZykge307XG5cbmV4cG9ydHMucHVtcCA9IG51bGw7XG5cbnZhciBPYmplY3Rfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgcmVzLnB1c2goa2V5KTtcbiAgICByZXR1cm4gcmVzO1xufTtcblxudmFyIE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHJlcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59O1xuXG52YXIgT2JqZWN0X2NyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gKHByb3RvdHlwZSwgcHJvcGVydGllcykge1xuICAgIC8vIGZyb20gZXM1LXNoaW1cbiAgICB2YXIgb2JqZWN0O1xuICAgIGlmIChwcm90b3R5cGUgPT09IG51bGwpIHtcbiAgICAgICAgb2JqZWN0ID0geyAnX19wcm90b19fJyA6IG51bGwgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJvdG90eXBlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICAndHlwZW9mIHByb3RvdHlwZVsnICsgKHR5cGVvZiBwcm90b3R5cGUpICsgJ10gIT0gXFwnb2JqZWN0XFwnJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgVHlwZSA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICBUeXBlLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICAgICAgb2JqZWN0ID0gbmV3IFR5cGUoKTtcbiAgICAgICAgb2JqZWN0Ll9fcHJvdG9fXyA9IHByb3RvdHlwZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcm9wZXJ0aWVzICE9PSAndW5kZWZpbmVkJyAmJiBPYmplY3QuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhvYmplY3QsIHByb3BlcnRpZXMpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xufTtcblxuZXhwb3J0cy5pbmhlcml0cyA9IGZ1bmN0aW9uKGN0b3IsIHN1cGVyQ3Rvcikge1xuICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvcjtcbiAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3RfY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfVxuICB9KTtcbn07XG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICh0eXBlb2YgZiAhPT0gJ3N0cmluZycpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goZXhwb3J0cy5pbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzogcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKXtcbiAgICBpZiAoeCA9PT0gbnVsbCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgZXhwb3J0cy5pbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBpZiAoZXYuc291cmNlID09PSB3aW5kb3cgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe2lmICghcHJvY2Vzcy5FdmVudEVtaXR0ZXIpIHByb2Nlc3MuRXZlbnRFbWl0dGVyID0gZnVuY3Rpb24gKCkge307XG5cbnZhciBFdmVudEVtaXR0ZXIgPSBleHBvcnRzLkV2ZW50RW1pdHRlciA9IHByb2Nlc3MuRXZlbnRFbWl0dGVyO1xudmFyIGlzQXJyYXkgPSB0eXBlb2YgQXJyYXkuaXNBcnJheSA9PT0gJ2Z1bmN0aW9uJ1xuICAgID8gQXJyYXkuaXNBcnJheVxuICAgIDogZnVuY3Rpb24gKHhzKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nXG4gICAgfVxuO1xuZnVuY3Rpb24gaW5kZXhPZiAoeHMsIHgpIHtcbiAgICBpZiAoeHMuaW5kZXhPZikgcmV0dXJuIHhzLmluZGV4T2YoeCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoeCA9PT0geHNbaV0pIHJldHVybiBpO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW5cbi8vIDEwIGxpc3RlbmVycyBhcmUgYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaFxuLy8gaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG4vL1xuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbnZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzID0gbjtcbn07XG5cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNBcnJheSh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSlcbiAgICB7XG4gICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgYXJndW1lbnRzWzFdOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5jYXVnaHQsIHVuc3BlY2lmaWVkICdlcnJvcicgZXZlbnQuXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gZmFsc2U7XG4gIHZhciBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBpZiAoIWhhbmRsZXIpIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIGhhbmRsZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoaXNBcnJheShoYW5kbGVyKSkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgIHZhciBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG4vLyBFdmVudEVtaXR0ZXIgaXMgZGVmaW5lZCBpbiBzcmMvbm9kZV9ldmVudHMuY2Ncbi8vIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCgpIGlzIGFsc28gZGVmaW5lZCB0aGVyZS5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGxpc3RlbmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhZGRMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT0gXCJuZXdMaXN0ZW5lcnNcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJzXCIuXG4gIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHtcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgfSBlbHNlIGlmIChpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcblxuICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgICB2YXIgbTtcbiAgICAgIGlmICh0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbSA9IHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtID0gZGVmYXVsdE1heExpc3RlbmVycztcbiAgICAgIH1cblxuICAgICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYub24odHlwZSwgZnVuY3Rpb24gZygpIHtcbiAgICBzZWxmLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlbW92ZUxpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSkgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzQXJyYXkobGlzdCkpIHtcbiAgICB2YXIgaSA9IGluZGV4T2YobGlzdCwgbGlzdGVuZXIpO1xuICAgIGlmIChpIDwgMCkgcmV0dXJuIHRoaXM7XG4gICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgaWYgKGxpc3QubGVuZ3RoID09IDApXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICB9IGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSA9PT0gbGlzdGVuZXIpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAodHlwZSAmJiB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBudWxsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBbXTtcbiAgaWYgKCFpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgfVxuICByZXR1cm4gdGhpcy5fZXZlbnRzW3R5cGVdO1xufTtcblxufSkocmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpKSIsIlxudmFyIGhlYWRlciA9IHJlcXVpcmUoJ2hlYWRlci1zdHJlYW0nKVxuXG52YXIgdmVyc2lvblxuLyoqXG5UT0RPXG5tb3JlIHNvcGhpc3RpY2F0ZWQgcmVsb2FkaW5nLCBcbnBhc3MgaW4gYSBwYWNrYWdlIGFuZCBhIHNlbXZlciByYW5nZS4uLlxuKiovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICBoZWFkZXIoc3RyZWFtKS53cml0ZUhlYWQoKVxuICAgIHN0cmVhbS5vbignaGVhZGVyJywgZnVuY3Rpb24gKG1ldGEpIHtcblxuICAgICAgaWYoIXZlcnNpb24pXG4gICAgICAgIHZlcnNpb24gPSBtZXRhLnZlcnNpb25cbiAgICAgIGlmKG1ldGEudmVyc2lvbiAhPT0gdmVyc2lvbikge1xuICAgICAgICBzdHJlYW0uZW1pdCgncmVsb2FkJywgbWV0YS52ZXJzaW9uLCB2ZXJzaW9uKVxuICAgICAgICBzdHJlYW0uZW5kKClcblxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLnJlbG9hZCh0cnVlKVxuICAgICAgfVxuXG4gICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgfSlcbiAgfVxuXG59XG5cbnZhciB3cmFwID0gZnVuY3Rpb24gKHN0cmVhbSwgX3ZlcnNpb24pIHtcbiAgdmVyc2lvbiA9IF92ZXJzaW9uIHx8IHZlcnNpb25cbiAgc3RyZWFtID0gaGVhZGVyKHN0cmVhbSlcbiAgc3RyZWFtLm9uKCdoZWFkZXInLCBmdW5jdGlvbiAobWV0YSkge1xuICAgIC8vaXMgaXQgc2FtZSB2ZXJzaW9uIGFzIGxhc3QgdGltZT9cbiAgICBpZighdmVyc2lvbilcbiAgICAgIHZlcnNpb24gPSBtZXRhLnZlcnNpb25cbiAgICBpZihtZXRhLnZlcnNpb24gIT09IHZlcnNpb24pIHtcbiAgICAgIHN0cmVhbS5lbWl0KCdyZWxvYWQnLCBtZXRhLnZlcnNpb24sIHZlcnNpb24pXG4gICAgICBzdHJlYW0uZW5kKClcblxuICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCh0cnVlKVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIHN0cmVhbVxufVxuIiwidmFyIGRpZmYgICAgID0gcmVxdWlyZSgnYWRpZmYnKS5kaWZmXG52YXIgUkFycmF5ICAgPSByZXF1aXJlKCdyLWFycmF5JylcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ3V0aWwnKS5pbmhlcml0c1xuXG5mdW5jdGlvbiBwYXRjaCAoYSwgY2hhbmdlcykge1xuICBjaGFuZ2VzLmZvckVhY2goZnVuY3Rpb24gKHBhdGNoKSB7XG4gICAgYS5zcGxpY2UuYXBwbHkoYSwgcGF0Y2gpXG4gIH0pXG4gIHJldHVybiBhXG59XG5cbmZ1bmN0aW9uIHNwbGl0KHN0cikge1xuICByZXR1cm4gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24gKGwsIGksIGEpIHtcbiAgICBpZihpICE9IGEubGVuZ3RoIC0gMSlcbiAgICAgIHJldHVybiBsICsgJ1xcbidcbiAgICByZXR1cm4gbFxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJFZGl0XG5cbmluaGVyaXRzKFJFZGl0LCBSQXJyYXkpXG5cbmZ1bmN0aW9uIFJFZGl0KCkge1xuICBpZighKHRoaXMgaW5zdGFuY2VvZiBSRWRpdCkpIHJldHVybiBuZXcgUkVkaXQoKVxuICBSQXJyYXkuY2FsbCh0aGlzKVxufVxuXG52YXIgUiA9IFJFZGl0LnByb3RvdHlwZVxuXG5SLnRleHQgID0gZnVuY3Rpb24gdGV4dCAodGV4dCkge1xuICBpZighYXJndW1lbnRzLmxlbmd0aClcbiAgICByZXR1cm4gdGhpcy50b0pTT04oKS5qb2luKCcnKVxuICBcbiAgdmFyIG9sZCA9IHRoaXMudG9KU09OKClcbiAgdGV4dCA9IHNwbGl0KHRleHQpXG4gIC8vZ290IHRvIGFkanVzdCB0aGUgdXNlcidzIHNlbGVjdGlvbiBvbiB0aGUgdGV4dCBhcmVhLi4uXG4gIHZhciBwID0gZGlmZihvbGQsIHRleHQpXG4gIHBhdGNoKHRoaXMsIHApXG59XG5cblIudW53cmFwID0gZnVuY3Rpb24gKCkge1xuXG59XG5cblIud2lkZ2V0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpXG4gIHRhLnNldEF0dHJpYnV0ZSgnY29scycsIDgwKVxuICB0YS5zZXRBdHRyaWJ1dGUoJ3Jvd3MnLCAyNClcbiAgdGhpcy53cmFwKHRhKVxuICByZXR1cm4gdGFcbn1cblxuUi53cmFwID0gZnVuY3Rpb24gKHRhKSB7XG4gIGlmKCF0YSkgdGhyb3cgbmV3IEVycm9yKCd3cmFwKHRhKSBleHBlY3RzIFRleHRBcmVhLCBvciBJbnB1dCcpXG5cbiAgdmFyIGN1cnNvciA9IDAsIHN0YXJ0XG4gIHZhciBzZWxmID0gdGhpc1xuXG4gIGlmKHRoaXMud3JhcHBlZClcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3JFZGl0IGlzIGFscmVhZHkgd3JhcHBpbmcgYSB0ZXh0YXJlYS4gdW53cmFwIGl0IGZpcnN0IScpXG5cbiAgaWYodGEuX3JFZGl0V3JhcHBlcilcbiAgICB0YS5fckVkaXRXcmFwcGVyLnVud3JhcCgpXG5cbiAgdGEuX3JFZGl0V3JhcHBlciA9IHRoaXNcbiAgdGhpcy53cmFwcGVkID0gdGFcblxuICB0YS52YWx1ZSA9IHRoaXMudGV4dCgpXG5cbiAgZnVuY3Rpb24gb25QcmV1cGRhdGUgKGNoKSB7XG4gICAgLy9mb3JjZSB1cGRhdGUgd2hlbiByZWNpZXZlIG1lc3NhZ2UuXG4gICAgY3Vyc29yID0gMFxuICAgIHN0YXJ0ID0gdGEuc2VsZWN0aW9uU3RhcnRcbiAgICBlbmQgICA9IHRhLnNlbGVjdGlvbkVuZFxuICAgIC8vd2hhdCBhdG9tIGNvbnRhaW5zIHRoZSBjdXJzb3I/XG4gICAgdmFyIHN0YXJ0S2V5LCBzdW0gPSAwXG4gICAgZm9yICh2YXIgaSBpbiBzZWxmLmtleXMpIHtcbiAgICAgIHZhciBrZXkgPSBzZWxmLmtleXNbaV1cbiAgICAgIGlmKChzdW0gPSBzZWxmLnN0b3JlW2tleV0ubGVuZ3RoICsgc3VtKSA+PSBzdGFydCkge1xuICAgICAgICBzdGFydEtleSA9IGtleTsgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgLy9ob3cgbXVjaCB3aWxsIGJlIGluc2VydGVkIGludG8gdGhlIGRvY3VtZW50P1xuICAgIGZvcih2YXIga2V5IGluIGNoKSB7XG4gICAgICBpZihrZXkgPCBzdGFydEtleSlcbiAgICAgICAgY3Vyc29yICs9IFxuICAgICAgICAgIChjaFtrZXldID8gY2hba2V5XS5sZW5ndGggOiAwKVxuICAgICAgICAtIChzZWxmLnN0b3JlW2tleV0gPyBzZWxmLnN0b3JlW2tleV0ubGVuZ3RoIDogMClcbiAgICB9XG4gICAgLy9USElTIElTIEFDVFVBTExZIFdST05HLiBDQU4nVCBpbnNlcnQgaW50byBhIHNlbGVjdGlvbiFcbiAgICBzdGFydCA9IHN0YXJ0ICsgY3Vyc29yXG4gICAgZW5kICAgPSBlbmQgICArIGN1cnNvclxuICB9XG4gIHRoaXMub24oJ3ByZXVwZGF0ZScsIG9uUHJldXBkYXRlKVxuICBmdW5jdGlvbiBvbl91cGRhdGUgKHVwZGF0ZSkge1xuICAgIGlmKHVwZGF0ZVsyXSAhPT0gc2VsZi5pZCkge1xuICAgICAgdGEudmFsdWUgPSBzZWxmLnRvSlNPTigpLmpvaW4oJycpXG4gICAgICB0YS5zZWxlY3Rpb25TdGFydCA9IHRhLnNlbGVjdGlvbkVuZCA9IHN0YXJ0XG4gICAgfVxuICB9XG4gIHRoaXMub24oJ191cGRhdGUnICAsIG9uX3VwZGF0ZSlcbiAgdmFyIHBlbmRpbmcgPSBmYWxzZVxuICBmdW5jdGlvbiBvbklucHV0ICgpIHtcbiAgICAvL2lmKHBlbmRpbmcpIHJldHVyblxuICAgIC8vcGVuZGluZyA9IHRydWVcbiAgICAvL3NldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIC8vcGVuZGluZyA9IGZhbHNlXG4gICAgc2VsZi50ZXh0KHRhLnZhbHVlKVxuICAgIC8vfSwgMzAwKVxuICB9XG4gIGZ1bmN0aW9uIG9uS2V5ZG93biAoKSB7XG4gICAgc3RhcnQgPSB0YS5zZWxlY3Rpb25TdGFydFxuICAgIGVuZCAgID0gdGEuc2VsZWN0aW9uRW5kXG4gIH1cbiAgZnVuY3Rpb24gb25Gb2N1cyAoKSB7XG4gICAgdGEuc2VsZWN0aW9uU3RhcnQgPSB0YS5zZWxlY3Rpb25FbmQgPSBzdGFydFxuICB9XG4gIHRhLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JyAgLCBvbklucHV0KVxuICB0YS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlkb3duKVxuICB0YS5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycgICwgb25Gb2N1cyApXG5cbiAgdGhpcy51bndyYXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGEucmVtb3ZlRXZlbnRMaXN0ZW5lcignaW5wdXQnICAsIG9uSW5wdXQpXG4gICAgdGEucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5ZG93bilcbiAgICB0YS5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycgICwgb25Gb2N1cylcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKCdwcmV1cGRhdGUnICwgb25QcmV1cGRhdGUpXG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcignX3VwZGF0ZScgICAsIG9uX3VwZGF0ZSlcbiAgICB0aGlzLnVud3JhcCA9IGZ1bmN0aW9uICgpIHt9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGhyb3VnaCA9IHJlcXVpcmUoJ3Rocm91Z2gnKVxuICAsIGV4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kJylcbiAgLCBkdXBsZXggPSByZXF1aXJlKCdkdXBsZXgnKVxuICAsIHNlcmlhbGl6ZXIgPSByZXF1aXJlKCdzdHJlYW0tc2VyaWFsaXplcicpXG5cbmZ1bmN0aW9uIE11eERlbXV4IChvcHRzLCBvbkNvbm5lY3Rpb24pIHtcbiAgaWYoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIG9wdHMpXG4gICAgb25Db25uZWN0aW9uID0gb3B0cywgb3B0cyA9IG51bGxcbiAgb3B0cyA9IG9wdHMgfHwge31cblxuICBmdW5jdGlvbiBjcmVhdGVJRCgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgTWF0aC5yYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMikgK1xuICAgICAgTWF0aC5yYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMilcbiAgICApXG4gIH1cblxuICB2YXIgc3RyZWFtcyA9IHt9LCBzdHJlYW1Db3VudCA9IDBcbiAgdmFyIG1kID0gZHVwbGV4KCkvLy5yZXN1bWUoKVxuXG4gIG1kLm9uKCdfZGF0YScsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgaWYoIShBcnJheS5pc0FycmF5KGRhdGEpXG4gICAgICAmJiAnc3RyaW5nJyA9PT0gdHlwZW9mIGRhdGFbMF1cbiAgICAgICYmICdfX3Byb3RvX18nICE9PSBkYXRhWzBdXG4gICAgICAmJiAnc3RyaW5nJyA9PT0gdHlwZW9mIGRhdGFbMV1cbiAgICAgICYmICdfX3Byb3RvX18nICE9PSBkYXRhWzFdXG4gICAgKSkgcmV0dXJuXG4gICAgdmFyIGlkID0gZGF0YS5zaGlmdCgpXG4gICAgdmFyIGV2ZW50ID0gZGF0YVswXVxuICAgIHZhciBzID0gc3RyZWFtc1tpZF1cbiAgICBpZighcykge1xuICAgICAgaWYoZXZlbnQgPT0gJ2Nsb3NlJylcbiAgICAgICAgcmV0dXJuXG4gICAgICBpZihldmVudCAhPSAnbmV3JylcbiAgICAgICAgcmV0dXJuIG91dGVyLmVtaXQoJ3Vua25vd24nLCBpZClcbiAgICAgIG1kLmVtaXQoJ2Nvbm5lY3Rpb24nLCBjcmVhdGVTdHJlYW0oaWQsIGRhdGFbMV0ubWV0YSwgZGF0YVsxXS5vcHRzKSlcbiAgICB9XG4gICAgZWxzZSBpZiAoZXZlbnQgPT09ICdwYXVzZScpXG4gICAgICBzLnBhdXNlZCA9IHRydWVcbiAgICBlbHNlIGlmIChldmVudCA9PT0gJ3Jlc3VtZScpIHtcbiAgICAgIHZhciBwID0gcy5wYXVzZWRcbiAgICAgIHMucGF1c2VkID0gZmFsc2VcbiAgICAgIGlmKHApIHMuZW1pdCgnZHJhaW4nKVxuICAgIH1cbiAgICBlbHNlIGlmIChldmVudCA9PT0gJ2Vycm9yJykge1xuICAgICAgdmFyIGVycm9yID0gZGF0YVsxXVxuICAgICAgaWYgKHR5cGVvZiBlcnJvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcy5lbWl0KCdlcnJvcicsIG5ldyBFcnJvcihlcnJvcikpXG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlcnJvci5tZXNzYWdlID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YXIgZSA9IG5ldyBFcnJvcihlcnJvci5tZXNzYWdlKVxuICAgICAgICBleHRlbmQoZSwgZXJyb3IpXG4gICAgICAgIHMuZW1pdCgnZXJyb3InLCBlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcy5lbWl0KCdlcnJvcicsIGVycm9yKVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHMuZW1pdC5hcHBseShzLCBkYXRhKVxuICAgIH1cbiAgfSlcbiAgLm9uKCdfZW5kJywgZnVuY3Rpb24gKCkge1xuICAgIGRlc3Ryb3lBbGwoKVxuICAgIG1kLl9lbmQoKVxuICB9KVxuXG4gIGZ1bmN0aW9uIGRlc3Ryb3lBbGwgKF9lcnIpIHtcbiAgICBtZC5yZW1vdmVMaXN0ZW5lcignZW5kJywgZGVzdHJveUFsbClcbiAgICBtZC5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBkZXN0cm95QWxsKVxuICAgIG1kLnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIGRlc3Ryb3lBbGwpXG4gICAgdmFyIGVyciA9IF9lcnIgfHwgbmV3IEVycm9yICgndW5leHBlY3RlZCBkaXNjb25uZWN0aW9uJylcbiAgICBmb3IgKHZhciBpIGluIHN0cmVhbXMpIHtcbiAgICAgIHZhciBzID0gc3RyZWFtc1tpXVxuICAgICAgcy5kZXN0cm95ZWQgPSB0cnVlXG4gICAgICBpZiAob3B0cy5lcnJvciAhPT0gdHJ1ZSkge1xuICAgICAgICBzLmVuZCgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzLmVtaXQoJ2Vycm9yJywgZXJyKVxuICAgICAgICBzLmRlc3Ryb3koKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vZW5kIHRoZSBzdHJlYW0gb25jZSBzdWItc3RyZWFtcyBoYXZlIGVuZGVkLlxuICAvLyh3YWl0cyBmb3IgdGhlbSB0byBjbG9zZSwgbGlrZSBvbiBhIHRjcCBzZXJ2ZXIpXG5cbiAgZnVuY3Rpb24gY3JlYXRlU3RyZWFtKGlkLCBtZXRhLCBvcHRzKSB7XG4gICAgc3RyZWFtQ291bnQgKytcbiAgICB2YXIgcyA9IHRocm91Z2goZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGlmKCF0aGlzLndyaXRhYmxlKSB7XG4gICAgICAgIHZhciBlcnIgPSBFcnJvcignc3RyZWFtIGlzIG5vdCB3cml0YWJsZTogJyArIGlkKVxuICAgICAgICBlcnIuc3RyZWFtID0gdGhpc1xuICAgICAgICByZXR1cm4gb3V0ZXIuZW1pdChcImVycm9yXCIsIGVycilcbiAgICAgIH1cbiAgICAgIG1kLl9kYXRhKFtzLmlkLCAnZGF0YScsIGRhdGFdKVxuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1kLl9kYXRhKFtzLmlkLCAnZW5kJ10pXG4gICAgICBpZiAodGhpcy5yZWFkYWJsZSAmJiAhb3B0cy5hbGxvd0hhbGZPcGVuICYmICF0aGlzLmVuZGVkKSB7XG4gICAgICAgIHRoaXMuZW1pdChcImVuZFwiKVxuICAgICAgfVxuICAgIH0pXG4gICAgcy5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIG1kLl9kYXRhKFtzLmlkLCAncGF1c2UnXSlcbiAgICB9XG4gICAgcy5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBtZC5fZGF0YShbcy5pZCwgJ3Jlc3VtZSddKVxuICAgIH1cbiAgICBzLmVycm9yID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgIG1kLl9kYXRhKFtzLmlkLCAnZXJyb3InLCBtZXNzYWdlXSlcbiAgICB9XG4gICAgcy5vbmNlKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGRlbGV0ZSBzdHJlYW1zW2lkXVxuICAgICAgc3RyZWFtQ291bnQgLS1cbiAgICAgIG1kLl9kYXRhKFtzLmlkLCAnY2xvc2UnXSlcbiAgICAgIGlmKHN0cmVhbUNvdW50ID09PSAwKVxuICAgICAgICBtZC5lbWl0KCd6ZXJvJylcbiAgICB9KVxuICAgIHMud3JpdGFibGUgPSBvcHRzLndyaXRhYmxlXG4gICAgcy5yZWFkYWJsZSA9IG9wdHMucmVhZGFibGVcbiAgICBzdHJlYW1zW3MuaWQgPSBpZF0gPSBzXG4gICAgcy5tZXRhID0gbWV0YVxuICAgIHJldHVybiBzXG4gIH1cblxuICB2YXIgb3V0ZXIgPSBzZXJpYWxpemVyKG9wdHMud3JhcHBlcikobWQpXG5cbiAgaWYobWQgIT09IG91dGVyKVxuICAgIG1kLm9uKCdjb25uZWN0aW9uJywgZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgb3V0ZXIuZW1pdCgnY29ubmVjdGlvbicsIHN0cmVhbSlcbiAgICB9KVxuXG4gIG91dGVyLmNsb3NlID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgbWQub25jZSgnemVybycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1kLl9lbmQoKVxuICAgICAgaWYoY2IpIGNiKClcbiAgICB9KVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBpZihvbkNvbm5lY3Rpb24pXG4gICAgb3V0ZXIub24oJ2Nvbm5lY3Rpb24nLCBvbkNvbm5lY3Rpb24pXG5cbiAgb3V0ZXIub24oJ2Nvbm5lY3Rpb24nLCBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgLy9pZiBtdXgtZGVtdXggcmVjaWV2ZXMgYSBzdHJlYW0gYnV0IHRoZXJlIGlzIG5vdGhpbmcgdG8gaGFuZGxlIGl0LFxuICAgIC8vdGhlbiByZXR1cm4gYW4gZXJyb3IgdG8gdGhlIG90aGVyIHNpZGUuXG4gICAgLy9zdGlsbCB0cnlpbmcgdG8gdGhpbmsgb2YgdGhlIGJlc3QgZXJyb3IgbWVzc2FnZS5cbiAgICBpZihvdXRlci5saXN0ZW5lcnMoJ2Nvbm5lY3Rpb24nKS5sZW5ndGggPT09IDEpXG4gICAgICBzdHJlYW0uZXJyb3IoJ3JlbW90ZSBlbmQgbGFja3MgY29ubmVjdGlvbiBsaXN0ZW5lciAnIFxuICAgICAgICArIG91dGVyLmxpc3RlbmVycygnY29ubmVjdGlvbicpLmxlbmd0aClcbiAgfSlcblxuICB2YXIgcGlwZSA9IG91dGVyLnBpcGVcbiAgb3V0ZXIucGlwZSA9IGZ1bmN0aW9uIChkZXN0LCBvcHRzKSB7XG4gICAgcGlwZS5jYWxsKG91dGVyLCBkZXN0LCBvcHRzKVxuICAgIG1kLm9uKCdlbmQnLCBkZXN0cm95QWxsKVxuICAgIG1kLm9uKCdjbG9zZScsIGRlc3Ryb3lBbGwpXG4gICAgbWQub24oJ2Vycm9yJywgZGVzdHJveUFsbClcbiAgICByZXR1cm4gZGVzdFxuICB9XG5cbiAgb3V0ZXIuY3JlYXRlU3RyZWFtID0gZnVuY3Rpb24gKG1ldGEsIG9wdHMpIHtcbiAgICBvcHRzID0gb3B0cyB8fCB7fVxuICAgIGlmICghb3B0cy53cml0YWJsZSAmJiAhb3B0cy5yZWFkYWJsZSlcbiAgICAgIG9wdHMucmVhZGFibGUgPSBvcHRzLndyaXRhYmxlID0gdHJ1ZVxuICAgIHZhciBzID0gY3JlYXRlU3RyZWFtKGNyZWF0ZUlEKCksIG1ldGEsIG9wdHMpXG4gICAgdmFyIF9vcHRzID0ge3dyaXRhYmxlOiBvcHRzLnJlYWRhYmxlLCByZWFkYWJsZTogb3B0cy53cml0YWJsZX1cbiAgICBtZC5fZGF0YShbcy5pZCwgJ25ldycsIHttZXRhOiBtZXRhLCBvcHRzOiBfb3B0c31dKVxuICAgIHJldHVybiBzXG4gIH1cbiAgb3V0ZXIuY3JlYXRlV3JpdGVTdHJlYW0gPSBmdW5jdGlvbiAobWV0YSkge1xuICAgIHJldHVybiBvdXRlci5jcmVhdGVTdHJlYW0obWV0YSwge3dyaXRhYmxlOiB0cnVlLCByZWFkYWJsZTogZmFsc2V9KVxuICB9XG4gIG91dGVyLmNyZWF0ZVJlYWRTdHJlYW0gPSBmdW5jdGlvbiAobWV0YSkge1xuICAgIHJldHVybiBvdXRlci5jcmVhdGVTdHJlYW0obWV0YSwge3dyaXRhYmxlOiBmYWxzZSwgcmVhZGFibGU6IHRydWV9KVxuICB9XG5cbiAgcmV0dXJuIG91dGVyXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTXV4RGVtdXhcblxuIiwiZnVuY3Rpb24gaGVhZCAoYSkge1xuICByZXR1cm4gYVswXVxufVxuXG5mdW5jdGlvbiBsYXN0IChhKSB7XG4gIHJldHVybiBhW2EubGVuZ3RoIC0gMV1cbn1cblxuZnVuY3Rpb24gdGFpbChhKSB7XG4gIHJldHVybiBhLnNsaWNlKDEpXG59XG5cbmZ1bmN0aW9uIHJldHJlYXQgKGUpIHtcbiAgcmV0dXJuIGUucG9wKClcbn1cblxuZnVuY3Rpb24gaGFzTGVuZ3RoIChlKSB7XG4gIHJldHVybiBlLmxlbmd0aFxufVxuXG5mdW5jdGlvbiBhbnkoYXJ5LCB0ZXN0KSB7XG4gIGZvcih2YXIgaSBpbiBhcnkpXG4gICAgaWYodGVzdChhcnlbaV0pKVxuICAgICAgcmV0dXJuIHRydWVcbiAgcmV0dXJuIGZhbHNlXG59XG5cbnZhciBfcnVsZXMgLy8gc2V0IGF0IHRoZSBib3R0b20gIFxuXG4vLyBub3RlLCBuYWl2ZSBpbXBsZW1lbnRhdGlvbi4gd2lsbCBicmVhayBvbiBjaXJjdWxhciBvYmplY3RzLlxuXG5mdW5jdGlvbiBfZXF1YWwoYSwgYikge1xuICBpZihhICYmICFiKSByZXR1cm4gZmFsc2VcbiAgaWYoQXJyYXkuaXNBcnJheShhKSlcbiAgICBpZihhLmxlbmd0aCAhPSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gIGlmKGEgJiYgJ29iamVjdCcgPT0gdHlwZW9mIGEpIHtcbiAgICBmb3IodmFyIGkgaW4gYSlcbiAgICAgIGlmKCFfZXF1YWwoYVtpXSwgYltpXSkpIHJldHVybiBmYWxzZVxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGEgPT0gYlxufVxuXG5mdW5jdGlvbiBnZXRBcmdzKGFyZ3MpIHtcbiAgcmV0dXJuIGFyZ3MubGVuZ3RoID09IDEgPyBhcmdzWzBdIDogW10uc2xpY2UuY2FsbChhcmdzKVxufVxuXG4vLyByZXR1cm4gdGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IG5vdCBsaWtlIHRoZSBvdGhlcnMsIG9yIC0xXG5mdW5jdGlvbiBvZGRFbGVtZW50KGFyeSwgY21wKSB7XG4gIHZhciBjXG4gIGZ1bmN0aW9uIGd1ZXNzKGEpIHtcbiAgICB2YXIgb2RkID0gLTFcbiAgICBjID0gMFxuICAgIGZvciAodmFyIGkgPSBhOyBpIDwgYXJ5Lmxlbmd0aDsgaSArKykge1xuICAgICAgaWYoIWNtcChhcnlbYV0sIGFyeVtpXSkpIHtcbiAgICAgICAgb2RkID0gaSwgYysrXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjID4gMSA/IC0xIDogb2RkXG4gIH1cbiAgLy9hc3N1bWUgdGhhdCBpdCBpcyB0aGUgZmlyc3QgZWxlbWVudC5cbiAgdmFyIGcgPSBndWVzcygwKVxuICBpZigtMSAhPSBnKSByZXR1cm4gZ1xuICAvLzAgd2FzIHRoZSBvZGQgb25lLCB0aGVuIGFsbCB0aGUgb3RoZXIgZWxlbWVudHMgYXJlIGVxdWFsXG4gIC8vZWxzZSB0aGVyZSBtb3JlIHRoYW4gb25lIGRpZmZlcmVudCBlbGVtZW50XG4gIGd1ZXNzKDEpXG4gIHJldHVybiBjID09IDAgPyAwIDogLTFcbn1cbnZhciBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZGVwcywgZXhwb3J0cykge1xuICB2YXIgZXF1YWwgPSAoZGVwcyAmJiBkZXBzLmVxdWFsKSB8fCBfZXF1YWxcbiAgZXhwb3J0cyA9IGV4cG9ydHMgfHwge30gXG4gIGV4cG9ydHMubGNzID0gXG4gIGZ1bmN0aW9uIGxjcygpIHtcbiAgICB2YXIgY2FjaGUgPSB7fVxuICAgIHZhciBhcmdzID0gZ2V0QXJncyhhcmd1bWVudHMpXG4gICAgdmFyIGEgPSBhcmdzWzBdLCBiID0gYXJnc1sxXVxuXG4gICAgZnVuY3Rpb24ga2V5IChhLGIpe1xuICAgICAgcmV0dXJuIGEubGVuZ3RoICsgJzonICsgYi5sZW5ndGhcbiAgICB9XG5cbiAgICAvL2ZpbmQgbGVuZ3RoIHRoYXQgbWF0Y2hlcyBhdCB0aGUgaGVhZFxuXG4gICAgaWYoYXJncy5sZW5ndGggPiAyKSB7XG4gICAgICAvL2lmIGNhbGxlZCB3aXRoIG11bHRpcGxlIHNlcXVlbmNlc1xuICAgICAgLy9yZWN1cnNlLCBzaW5jZSBsY3MoYSwgYiwgYywgZCkgPT0gbGNzKGxjcyhhLGIpLCBsY3MoYyxkKSlcbiAgICAgIGFyZ3MucHVzaChsY3MoYXJncy5zaGlmdCgpLCBhcmdzLnNoaWZ0KCkpKVxuICAgICAgcmV0dXJuIGxjcyhhcmdzKVxuICAgIH1cbiAgICBcbiAgICAvL3RoaXMgd291bGQgYmUgaW1wcm92ZWQgYnkgdHJ1bmNhdGluZyBpbnB1dCBmaXJzdFxuICAgIC8vYW5kIG5vdCByZXR1cm5pbmcgYW4gbGNzIGFzIGFuIGludGVybWVkaWF0ZSBzdGVwLlxuICAgIC8vdW50aWxsIHRoYXQgaXMgYSBwZXJmb3JtYW5jZSBwcm9ibGVtLlxuXG4gICAgdmFyIHN0YXJ0ID0gMCwgZW5kID0gMFxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aCAmJiBpIDwgYi5sZW5ndGggXG4gICAgICAmJiBlcXVhbChhW2ldLCBiW2ldKVxuICAgICAgOyBpICsrXG4gICAgKVxuICAgICAgc3RhcnQgPSBpICsgMVxuXG4gICAgaWYoYS5sZW5ndGggPT09IHN0YXJ0KVxuICAgICAgcmV0dXJuIGEuc2xpY2UoKVxuXG4gICAgZm9yKHZhciBpID0gMDsgIGkgPCBhLmxlbmd0aCAtIHN0YXJ0ICYmIGkgPCBiLmxlbmd0aCAtIHN0YXJ0XG4gICAgICAmJiBlcXVhbChhW2EubGVuZ3RoIC0gMSAtIGldLCBiW2IubGVuZ3RoIC0gMSAtIGldKVxuICAgICAgOyBpICsrXG4gICAgKVxuICAgICAgZW5kID0gaVxuXG4gICAgZnVuY3Rpb24gcmVjdXJzZSAoYSwgYikge1xuICAgICAgaWYoIWEubGVuZ3RoIHx8ICFiLmxlbmd0aCkgcmV0dXJuIFtdXG4gICAgICAvL2F2b2lkIGV4cG9uZW50aWFsIHRpbWUgYnkgY2FjaGluZyB0aGUgcmVzdWx0c1xuICAgICAgaWYoY2FjaGVba2V5KGEsIGIpXSkgcmV0dXJuIGNhY2hlW2tleShhLCBiKV1cblxuICAgICAgaWYoZXF1YWwoYVswXSwgYlswXSkpXG4gICAgICAgIHJldHVybiBbaGVhZChhKV0uY29uY2F0KHJlY3Vyc2UodGFpbChhKSwgdGFpbChiKSkpXG4gICAgICBlbHNlIHsgXG4gICAgICAgIHZhciBfYSA9IHJlY3Vyc2UodGFpbChhKSwgYilcbiAgICAgICAgdmFyIF9iID0gcmVjdXJzZShhLCB0YWlsKGIpKVxuICAgICAgICByZXR1cm4gY2FjaGVba2V5KGEsYildID0gX2EubGVuZ3RoID4gX2IubGVuZ3RoID8gX2EgOiBfYiAgXG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHZhciBtaWRkbGVBID0gYS5zbGljZShzdGFydCwgYS5sZW5ndGggLSBlbmQpXG4gICAgdmFyIG1pZGRsZUIgPSBiLnNsaWNlKHN0YXJ0LCBiLmxlbmd0aCAtIGVuZClcblxuICAgIHJldHVybiAoXG4gICAgICBhLnNsaWNlKDAsIHN0YXJ0KS5jb25jYXQoXG4gICAgICAgIHJlY3Vyc2UobWlkZGxlQSwgbWlkZGxlQilcbiAgICAgICkuY29uY2F0KGEuc2xpY2UoYS5sZW5ndGggLSBlbmQpKVxuICAgIClcbiAgfVxuXG4gIC8vIGdpdmVuIG4gc2VxdWVuY2VzLCBjYWxjIHRoZSBsY3MsIGFuZCB0aGVuIGNodW5rIHN0cmluZ3MgaW50byBzdGFibGUgYW5kIHVuc3RhYmxlIHNlY3Rpb25zLlxuICAvLyB1bnN0YWJsZSBjaHVua3MgYXJlIHBhc3NlZCB0byBidWlsZFxuICBleHBvcnRzLmNodW5rID1cbiAgZnVuY3Rpb24gKHEsIGJ1aWxkKSB7XG4gICAgdmFyIHEgPSBxLm1hcChmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5zbGljZSgpIH0pXG4gICAgdmFyIGxjcyA9IGV4cG9ydHMubGNzLmFwcGx5KG51bGwsIHEpXG4gICAgdmFyIGFsbCA9IFtsY3NdLmNvbmNhdChxKVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hMY3MgKGUpIHtcbiAgICAgIGlmKGUubGVuZ3RoICYmICFsY3MubGVuZ3RoIHx8ICFlLmxlbmd0aCAmJiBsY3MubGVuZ3RoKVxuICAgICAgICByZXR1cm4gZmFsc2UgLy9pbmNhc2UgdGhlIGxhc3QgaXRlbSBpcyBudWxsIFxuICAgICAgcmV0dXJuIGVxdWFsKGxhc3QoZSksIGxhc3QobGNzKSkgfHwgKChlLmxlbmd0aCArIGxjcy5sZW5ndGgpID09PSAwKVxuICAgIH1cblxuICAgIHdoaWxlKGFueShxLCBoYXNMZW5ndGgpKSB7XG4gICAgICAvL2lmIGVhY2ggZWxlbWVudCBpcyBhdCB0aGUgbGNzIHRoZW4gdGhpcyBjaHVuayBpcyBzdGFibGUuXG4gICAgICB3aGlsZShxLmV2ZXJ5KG1hdGNoTGNzKSAmJiBxLmV2ZXJ5KGhhc0xlbmd0aCkpIFxuICAgICAgICBhbGwuZm9yRWFjaChyZXRyZWF0KSBcbiAgICAgIC8vY29sbGVjdCB0aGUgY2hhbmdlcyBpbiBlYWNoIGFycmF5IHVwdG8gdGhlIG5leHQgbWF0Y2ggd2l0aCB0aGUgbGNzXG4gICAgICB2YXIgYyA9IGZhbHNlXG4gICAgICB2YXIgdW5zdGFibGUgPSBxLm1hcChmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgY2hhbmdlID0gW11cbiAgICAgICAgd2hpbGUoIW1hdGNoTGNzKGUpKSB7XG4gICAgICAgICAgY2hhbmdlLnVuc2hpZnQocmV0cmVhdChlKSlcbiAgICAgICAgICBjID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGFuZ2VcbiAgICAgIH0pXG4gICAgICBpZihjKSBidWlsZChxWzBdLmxlbmd0aCwgdW5zdGFibGUpIFxuICAgIH1cbiAgfVxuXG4gIGV4cG9ydHMuZGlmZiA9XG4gIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgdmFyIGNoYW5nZXMgPSBbXVxuICAgIGV4cG9ydHMuY2h1bmsoW2EsIGJdLCBmdW5jdGlvbiAoaW5kZXgsIHVuc3RhYmxlKSB7XG4gICAgICB2YXIgZGVsID0gdW5zdGFibGUuc2hpZnQoKS5sZW5ndGhcbiAgICAgIHZhciBpbnNlcnQgPSB1bnN0YWJsZS5zaGlmdCgpXG4gICAgICBjaGFuZ2VzLnB1c2goW2luZGV4LCBkZWxdLmNvbmNhdChpbnNlcnQpKVxuICAgIH0pXG4gICAgcmV0dXJuIGNoYW5nZXNcbiAgfVxuXG4gIGV4cG9ydHMucGF0Y2ggPSBmdW5jdGlvbiAoYSwgY2hhbmdlcywgbXV0YXRlKSB7XG4gICAgaWYobXV0YXRlICE9PSB0cnVlKSBhID0gYS5zbGljZShhKS8vY29weSBhXG4gICAgY2hhbmdlcy5mb3JFYWNoKGZ1bmN0aW9uIChjaGFuZ2UpIHtcbiAgICAgIFtdLnNwbGljZS5hcHBseShhLCBjaGFuZ2UpXG4gICAgfSlcbiAgICByZXR1cm4gYVxuICB9XG5cbiAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Db25jZXN0b3JcbiAgLy8gbWUsIGNvbmNlc3RvciwgeW91Li4uXG4gIGV4cG9ydHMubWVyZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBnZXRBcmdzKGFyZ3VtZW50cylcbiAgICB2YXIgcGF0Y2ggPSBleHBvcnRzLmRpZmYzKGFyZ3MpXG4gICAgcmV0dXJuIGV4cG9ydHMucGF0Y2goYXJnc1swXSwgcGF0Y2gpXG4gIH1cblxuICBleHBvcnRzLmRpZmYzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gZ2V0QXJncyhhcmd1bWVudHMpXG4gICAgdmFyIHIgPSBbXVxuICAgIGV4cG9ydHMuY2h1bmsoYXJncywgZnVuY3Rpb24gKGluZGV4LCB1bnN0YWJsZSkge1xuICAgICAgdmFyIG1pbmUgPSB1bnN0YWJsZVswXVxuICAgICAgdmFyIGluc2VydCA9IHJlc29sdmUodW5zdGFibGUpXG4gICAgICBpZihlcXVhbChtaW5lLCBpbnNlcnQpKSByZXR1cm4gXG4gICAgICByLnB1c2goW2luZGV4LCBtaW5lLmxlbmd0aF0uY29uY2F0KGluc2VydCkpIFxuICAgIH0pXG4gICAgcmV0dXJuIHJcbiAgfVxuICBleHBvcnRzLm9kZE9uZU91dCA9XG4gICAgZnVuY3Rpb24gb2RkT25lT3V0IChjaGFuZ2VzKSB7XG4gICAgICBjaGFuZ2VzID0gY2hhbmdlcy5zbGljZSgpXG4gICAgICAvL3B1dCB0aGUgY29uY2VzdG9yIGZpcnN0XG4gICAgICBjaGFuZ2VzLnVuc2hpZnQoY2hhbmdlcy5zcGxpY2UoMSwxKVswXSlcbiAgICAgIHZhciBpID0gb2RkRWxlbWVudChjaGFuZ2VzLCBlcXVhbClcbiAgICAgIGlmKGkgPT0gMCkgLy8gY29uY2VzdG9yIHdhcyBkaWZmZXJlbnQsICdmYWxzZSBjb25mbGljdCdcbiAgICAgICAgcmV0dXJuIGNoYW5nZXNbMV1cbiAgICAgIGlmICh+aSlcbiAgICAgICAgcmV0dXJuIGNoYW5nZXNbaV0gXG4gICAgfVxuICBleHBvcnRzLmluc2VydE1lcmdlT3ZlckRlbGV0ZSA9IFxuICAgIC8vaSd2ZSBpbXBsZW1lbnRlZCB0aGlzIGFzIGEgc2VwZXJhdGUgcnVsZSxcbiAgICAvL2JlY2F1c2UgSSBoYWQgc2Vjb25kIHRob3VnaHRzIGFib3V0IHRoaXMuXG4gICAgZnVuY3Rpb24gaW5zZXJ0TWVyZ2VPdmVyRGVsZXRlIChjaGFuZ2VzKSB7XG4gICAgICBjaGFuZ2VzID0gY2hhbmdlcy5zbGljZSgpXG4gICAgICBjaGFuZ2VzLnNwbGljZSgxLDEpLy8gcmVtb3ZlIGNvbmNlc3RvclxuICAgICAgXG4gICAgICAvL2lmIHRoZXJlIGlzIG9ubHkgb25lIG5vbiBlbXB0eSBjaGFuZ2UgdGhhdHMgb2theS5cbiAgICAgIC8vZWxzZSBmdWxsIGNvbmZpbGN0XG4gICAgICBmb3IgKHZhciBpID0gMCwgbm9uZW1wdHk7IGkgPCBjaGFuZ2VzLmxlbmd0aDsgaSsrKVxuICAgICAgICBpZihjaGFuZ2VzW2ldLmxlbmd0aCkgXG4gICAgICAgICAgaWYoIW5vbmVtcHR5KSBub25lbXB0eSA9IGNoYW5nZXNbaV1cbiAgICAgICAgICBlbHNlIHJldHVybiAvLyBmdWxsIGNvbmZsaWN0XG4gICAgICByZXR1cm4gbm9uZW1wdHlcbiAgICB9XG5cbiAgdmFyIHJ1bGVzID0gKGRlcHMgJiYgZGVwcy5ydWxlcykgfHwgW2V4cG9ydHMub2RkT25lT3V0LCBleHBvcnRzLmluc2VydE1lcmdlT3ZlckRlbGV0ZV1cblxuICBmdW5jdGlvbiByZXNvbHZlIChjaGFuZ2VzKSB7XG4gICAgdmFyIGwgPSBydWxlcy5sZW5ndGhcbiAgICBmb3IgKHZhciBpIGluIHJ1bGVzKSB7IC8vIGZpcnN0XG4gICAgICBcbiAgICAgIHZhciBjID0gcnVsZXNbaV0gJiYgcnVsZXNbaV0oY2hhbmdlcylcbiAgICAgIGlmKGMpIHJldHVybiBjXG4gICAgfVxuICAgIGNoYW5nZXMuc3BsaWNlKDEsMSkgLy8gcmVtb3ZlIGNvbmNlc3RvclxuICAgIC8vcmV0dXJuaW5nIHRoZSBjb25mbGljdHMgYXMgYW4gb2JqZWN0IGlzIGEgcmVhbGx5IGJhZCBpZGVhLFxuICAgIC8vIGJlY2F1c2UgPT0gd2lsbCBub3QgZGV0ZWN0IHRoZXkgYXJlIHRoZSBzYW1lLiBhbmQgY29uZmxpY3RzIGJ1aWxkLlxuICAgIC8vIGJldHRlciB0byB1c2VcbiAgICAvLyAnPDw8PDw8PDw8PDw8PCdcbiAgICAvLyBvZiBjb3Vyc2UsIGkgd3JvdGUgdGhpcyBiZWZvcmUgaSBzdGFydGVkIG9uIHNub2IsIHNvIGkgZGlkbid0IGtub3cgdGhhdCB0aGVuLlxuICAgIC8qdmFyIGNvbmZsaWN0ID0gWyc+Pj4+Pj4+Pj4+Pj4+Pj4+J11cbiAgICB3aGlsZShjaGFuZ2VzLmxlbmd0aClcbiAgICAgIGNvbmZsaWN0ID0gY29uZmxpY3QuY29uY2F0KGNoYW5nZXMuc2hpZnQoKSkuY29uY2F0KCc9PT09PT09PT09PT0nKVxuICAgIGNvbmZsaWN0LnBvcCgpXG4gICAgY29uZmxpY3QucHVzaCAgICAgICAgICAoJzw8PDw8PDw8PDw8PDw8PCcpXG4gICAgY2hhbmdlcy51bnNoaWZ0ICAgICAgICgnPj4+Pj4+Pj4+Pj4+Pj4+JylcbiAgICByZXR1cm4gY29uZmxpY3QqL1xuICAgIC8vbmFoLCBiZXR0ZXIgaXMganVzdCB0byB1c2UgYW4gZXF1YWwgY2FuIGhhbmRsZSBvYmplY3RzXG4gICAgcmV0dXJuIHsnPyc6IGNoYW5nZXN9XG4gIH1cbiAgcmV0dXJuIGV4cG9ydHNcbn1cbmV4cG9ydHMobnVsbCwgZXhwb3J0cylcbiIsIlxuLy90aGUgZmlyc3QgbGluZSBpcyBoZWFkZXIsIGluIEpTT04gZm9ybWF0LCB3aXRoIG5vIHdoaXRlc3BhY2UuXG5cbmZ1bmN0aW9uIG1lcmdlIChhLCBiKSB7XG4gIGZvciAodmFyIGsgaW4gYilcbiAgICBhW2tdID0gYVtrXSB8fCBiW2tdXG59XG5cbm1vZHVsZS5leHBvcnRzID0gXG5mdW5jdGlvbiBoZWFkZXIgKHN0cmVhbSkge1xuXG4gIHZhciBlbWl0ID0gc3RyZWFtLmVtaXRcbiAgdmFyIHdyaXRlID0gc3RyZWFtLndyaXRlXG4gIHZhciBzb0ZhciA9ICcnXG5cbiAgc3RyZWFtLmVtaXQgPSBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcbiAgICBpZihldmVudCAhPT0gJ2RhdGEnKVxuICAgICAgcmV0dXJuIGVtaXQuYXBwbHkoc3RyZWFtLCBhcmd1bWVudHMpXG5cbiAgICBzb0ZhciArPSBkYXRhXG4gICAgdmFyIG1cbiAgICBpZighKG0gPSAvXFxuLy5leGVjKHNvRmFyKSkpIHJldHVyblxuICAgIHZhciBtZXRhID0gSlNPTi5wYXJzZShzb0Zhci5zdWJzdHJpbmcoMCwgbS5pbmRleCkpXG4gICAgLy8rIDEgdG8gZ2V0IHBhc3QgdGhlIG5ld2xpbmVcbiAgICBzb0ZhciA9IHNvRmFyLnN1YnN0cmluZyhtLmluZGV4ICsgMSlcbiAgICBzdHJlYW0uZW1pdCA9IGVtaXRcbiAgICBzdHJlYW0ubWV0YSA9IG1ldGFcbiAgICBzdHJlYW0uZW1pdCgnaGVhZGVyJywgbWV0YSlcbiAgICAvL2NoZWNrIHRoYXQgdGhlIHN0cmVhbSBpcyBzdGlsbCByZWFkYWJsZSxcbiAgICAvL2l0IG1heSBoYXZlIGJlZW4gZW5kZWQgZHVyaW5nIHRoZSAnaGVhZGVyJ1xuICAgIC8vZXZlbnQuXG4gICAgaWYoJycgIT09IHNvRmFyICAmJiBzdHJlYW0ucmVhZGFibGUpXG4gICAgICBzdHJlYW0uZW1pdCgnZGF0YScsIHNvRmFyKVxuICB9XG5cbiAgdmFyIG1ldGEgPSB7fVxuXG4gIHN0cmVhbS5zZXRIZWFkZXIgPSBmdW5jdGlvbiAoa2V5LCB2YWwpIHtcbiAgICBpZignc3RyaW5nJyA9PT0gdHlwZW9mIGtleSlcbiAgICAgIG1ldGFba2V5XSA9IHZhbFxuICAgIGVsc2VcbiAgICAgIG1lcmdlKG1ldGEsIGtleSlcbiAgICByZXR1cm4gc3RyZWFtXG4gIH1cblxuICBzdHJlYW0ud3JpdGVIZWFkID0gZnVuY3Rpb24gKF9tZXRhKSB7XG4gICAgaWYoX21ldGEpIG1lcmdlKG1ldGEsIF9tZXRhKVxuICAgIHN0cmVhbS53cml0ZSA9IHdyaXRlXG4gICAgc3RyZWFtLndyaXRlKEpTT04uc3RyaW5naWZ5KG1ldGEpKydcXG4nKSAgICBcbiAgfVxuXG4gIHN0cmVhbS53cml0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgc3RyZWFtLndyaXRlSGVhZCgpXG4gICAgcmV0dXJuIHN0cmVhbS53cml0ZShkYXRhKVxuICB9XG5cbiAgcmV0dXJuIHN0cmVhbVxufVxuIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe3ZhciBTdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKVxuXG4vLyB0aHJvdWdoXG4vL1xuLy8gYSBzdHJlYW0gdGhhdCBkb2VzIG5vdGhpbmcgYnV0IHJlLWVtaXQgdGhlIGlucHV0LlxuLy8gdXNlZnVsIGZvciBhZ2dyZWdhdGluZyBhIHNlcmllcyBvZiBjaGFuZ2luZyBidXQgbm90IGVuZGluZyBzdHJlYW1zIGludG8gb25lIHN0cmVhbSlcblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdGhyb3VnaFxudGhyb3VnaC50aHJvdWdoID0gdGhyb3VnaFxuXG4vL2NyZWF0ZSBhIHJlYWRhYmxlIHdyaXRhYmxlIHN0cmVhbS5cblxuZnVuY3Rpb24gdGhyb3VnaCAod3JpdGUsIGVuZCwgb3B0cykge1xuICB3cml0ZSA9IHdyaXRlIHx8IGZ1bmN0aW9uIChkYXRhKSB7IHRoaXMucXVldWUoZGF0YSkgfVxuICBlbmQgPSBlbmQgfHwgZnVuY3Rpb24gKCkgeyB0aGlzLnF1ZXVlKG51bGwpIH1cblxuICB2YXIgZW5kZWQgPSBmYWxzZSwgZGVzdHJveWVkID0gZmFsc2UsIGJ1ZmZlciA9IFtdLCBfZW5kZWQgPSBmYWxzZVxuICB2YXIgc3RyZWFtID0gbmV3IFN0cmVhbSgpXG4gIHN0cmVhbS5yZWFkYWJsZSA9IHN0cmVhbS53cml0YWJsZSA9IHRydWVcbiAgc3RyZWFtLnBhdXNlZCA9IGZhbHNlXG5cbi8vICBzdHJlYW0uYXV0b1BhdXNlICAgPSAhKG9wdHMgJiYgb3B0cy5hdXRvUGF1c2UgICA9PT0gZmFsc2UpXG4gIHN0cmVhbS5hdXRvRGVzdHJveSA9ICEob3B0cyAmJiBvcHRzLmF1dG9EZXN0cm95ID09PSBmYWxzZSlcblxuICBzdHJlYW0ud3JpdGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHdyaXRlLmNhbGwodGhpcywgZGF0YSlcbiAgICByZXR1cm4gIXN0cmVhbS5wYXVzZWRcbiAgfVxuXG4gIGZ1bmN0aW9uIGRyYWluKCkge1xuICAgIHdoaWxlKGJ1ZmZlci5sZW5ndGggJiYgIXN0cmVhbS5wYXVzZWQpIHtcbiAgICAgIHZhciBkYXRhID0gYnVmZmVyLnNoaWZ0KClcbiAgICAgIGlmKG51bGwgPT09IGRhdGEpXG4gICAgICAgIHJldHVybiBzdHJlYW0uZW1pdCgnZW5kJylcbiAgICAgIGVsc2VcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2RhdGEnLCBkYXRhKVxuICAgIH1cbiAgfVxuXG4gIHN0cmVhbS5xdWV1ZSA9IHN0cmVhbS5wdXNoID0gZnVuY3Rpb24gKGRhdGEpIHtcbi8vICAgIGNvbnNvbGUuZXJyb3IoZW5kZWQpXG4gICAgaWYoX2VuZGVkKSByZXR1cm4gc3RyZWFtXG4gICAgaWYoZGF0YSA9PSBudWxsKSBfZW5kZWQgPSB0cnVlXG4gICAgYnVmZmVyLnB1c2goZGF0YSlcbiAgICBkcmFpbigpXG4gICAgcmV0dXJuIHN0cmVhbVxuICB9XG5cbiAgLy90aGlzIHdpbGwgYmUgcmVnaXN0ZXJlZCBhcyB0aGUgZmlyc3QgJ2VuZCcgbGlzdGVuZXJcbiAgLy9tdXN0IGNhbGwgZGVzdHJveSBuZXh0IHRpY2ssIHRvIG1ha2Ugc3VyZSB3ZSdyZSBhZnRlciBhbnlcbiAgLy9zdHJlYW0gcGlwZWQgZnJvbSBoZXJlLlxuICAvL3RoaXMgaXMgb25seSBhIHByb2JsZW0gaWYgZW5kIGlzIG5vdCBlbWl0dGVkIHN5bmNocm9ub3VzbHkuXG4gIC8vYSBuaWNlciB3YXkgdG8gZG8gdGhpcyBpcyB0byBtYWtlIHN1cmUgdGhpcyBpcyB0aGUgbGFzdCBsaXN0ZW5lciBmb3IgJ2VuZCdcblxuICBzdHJlYW0ub24oJ2VuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBzdHJlYW0ucmVhZGFibGUgPSBmYWxzZVxuICAgIGlmKCFzdHJlYW0ud3JpdGFibGUgJiYgc3RyZWFtLmF1dG9EZXN0cm95KVxuICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0cmVhbS5kZXN0cm95KClcbiAgICAgIH0pXG4gIH0pXG5cbiAgZnVuY3Rpb24gX2VuZCAoKSB7XG4gICAgc3RyZWFtLndyaXRhYmxlID0gZmFsc2VcbiAgICBlbmQuY2FsbChzdHJlYW0pXG4gICAgaWYoIXN0cmVhbS5yZWFkYWJsZSAmJiBzdHJlYW0uYXV0b0Rlc3Ryb3kpXG4gICAgICBzdHJlYW0uZGVzdHJveSgpXG4gIH1cblxuICBzdHJlYW0uZW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBpZihlbmRlZCkgcmV0dXJuXG4gICAgZW5kZWQgPSB0cnVlXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCkgc3RyZWFtLndyaXRlKGRhdGEpXG4gICAgX2VuZCgpIC8vIHdpbGwgZW1pdCBvciBxdWV1ZVxuICAgIHJldHVybiBzdHJlYW1cbiAgfVxuXG4gIHN0cmVhbS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKGRlc3Ryb3llZCkgcmV0dXJuXG4gICAgZGVzdHJveWVkID0gdHJ1ZVxuICAgIGVuZGVkID0gdHJ1ZVxuICAgIGJ1ZmZlci5sZW5ndGggPSAwXG4gICAgc3RyZWFtLndyaXRhYmxlID0gc3RyZWFtLnJlYWRhYmxlID0gZmFsc2VcbiAgICBzdHJlYW0uZW1pdCgnY2xvc2UnKVxuICAgIHJldHVybiBzdHJlYW1cbiAgfVxuXG4gIHN0cmVhbS5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZihzdHJlYW0ucGF1c2VkKSByZXR1cm5cbiAgICBzdHJlYW0ucGF1c2VkID0gdHJ1ZVxuICAgIHJldHVybiBzdHJlYW1cbiAgfVxuXG4gIHN0cmVhbS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoc3RyZWFtLnBhdXNlZCkge1xuICAgICAgc3RyZWFtLnBhdXNlZCA9IGZhbHNlXG4gICAgICBzdHJlYW0uZW1pdCgncmVzdW1lJylcbiAgICB9XG4gICAgZHJhaW4oKVxuICAgIC8vbWF5IGhhdmUgYmVjb21lIHBhdXNlZCBhZ2FpbixcbiAgICAvL2FzIGRyYWluIGVtaXRzICdkYXRhJy5cbiAgICBpZighc3RyZWFtLnBhdXNlZClcbiAgICAgIHN0cmVhbS5lbWl0KCdkcmFpbicpXG4gICAgcmV0dXJuIHN0cmVhbVxuICB9XG4gIHJldHVybiBzdHJlYW1cbn1cblxuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiXG52YXIgc2hvZSA9IHJlcXVpcmUoJ3Nob2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vaW5qZWN0JykoZnVuY3Rpb24gKCl7IFxuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICByZXR1cm4gc2hvZS5hcHBseShudWxsLCBhcmdzKVxufSlcbiIsIm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kXG5cbmZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQpIHtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldLFxuICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKHNvdXJjZSlcblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGtleXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0ga2V5c1tqXVxuICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gc291cmNlW25hbWVdXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0XG59IiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe3ZhciBTdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh3cml0ZSwgZW5kKSB7XG4gIHZhciBzdHJlYW0gPSBuZXcgU3RyZWFtKCkgXG4gIHZhciBidWZmZXIgPSBbXSwgZW5kZWQgPSBmYWxzZSwgZGVzdHJveWVkID0gZmFsc2UsIGVtaXRFbmRcbiAgc3RyZWFtLndyaXRhYmxlID0gc3RyZWFtLnJlYWRhYmxlID0gdHJ1ZVxuICBzdHJlYW0ucGF1c2VkID0gZmFsc2VcbiAgc3RyZWFtLl9wYXVzZWQgPSBmYWxzZVxuICBzdHJlYW0uYnVmZmVyID0gYnVmZmVyXG4gIFxuICBzdHJlYW1cbiAgICAub24oJ3BhdXNlJywgZnVuY3Rpb24gKCkge1xuICAgICAgc3RyZWFtLl9wYXVzZWQgPSB0cnVlXG4gICAgfSlcbiAgICAub24oJ2RyYWluJywgZnVuY3Rpb24gKCkge1xuICAgICAgc3RyZWFtLl9wYXVzZWQgPSBmYWxzZVxuICAgIH0pXG4gICBcbiAgZnVuY3Rpb24gZGVzdHJveVNvb24gKCkge1xuICAgIHByb2Nlc3MubmV4dFRpY2soc3RyZWFtLmRlc3Ryb3kuYmluZChzdHJlYW0pKVxuICB9XG5cbiAgaWYod3JpdGUpXG4gICAgc3RyZWFtLm9uKCdfZGF0YScsIHdyaXRlKVxuICBpZihlbmQpXG4gICAgc3RyZWFtLm9uKCdfZW5kJywgZW5kKVxuXG4gIC8vZGVzdHJveSB0aGUgc3RyZWFtIG9uY2UgYm90aCBlbmRzIGFyZSBvdmVyXG4gIC8vYnV0IGRvIGl0IGluIG5leHRUaWNrLCBzbyB0aGF0IG90aGVyIGxpc3RlbmVyc1xuICAvL29uIGVuZCBoYXZlIHRpbWUgdG8gcmVzcG9uZFxuICBzdHJlYW0ub25jZSgnZW5kJywgZnVuY3Rpb24gKCkgeyBcbiAgICBzdHJlYW0ucmVhZGFibGUgPSBmYWxzZVxuICAgIGlmKCFzdHJlYW0ud3JpdGFibGUpIHtcbiAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzdHJlYW0uZGVzdHJveSgpXG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICBzdHJlYW0ub25jZSgnX2VuZCcsIGZ1bmN0aW9uICgpIHsgXG4gICAgc3RyZWFtLndyaXRhYmxlID0gZmFsc2VcbiAgICBpZighc3RyZWFtLnJlYWRhYmxlKVxuICAgICAgc3RyZWFtLmRlc3Ryb3koKVxuICB9KVxuXG4gIC8vIHRoaXMgaXMgdGhlIGRlZmF1bHQgd3JpdGUgbWV0aG9kLFxuICAvLyBpZiB5b3Ugb3ZlcmlkZSBpdCwgeW91IGFyZSByZXNwb3NpYmxlXG4gIC8vIGZvciBwYXVzZSBzdGF0ZS5cblxuICBcbiAgc3RyZWFtLl9kYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBpZighc3RyZWFtLnBhdXNlZCAmJiAhYnVmZmVyLmxlbmd0aClcbiAgICAgIHN0cmVhbS5lbWl0KCdkYXRhJywgZGF0YSlcbiAgICBlbHNlIFxuICAgICAgYnVmZmVyLnB1c2goZGF0YSlcbiAgICByZXR1cm4gIShzdHJlYW0ucGF1c2VkIHx8IGJ1ZmZlci5sZW5ndGgpXG4gIH1cblxuICBzdHJlYW0uX2VuZCA9IGZ1bmN0aW9uIChkYXRhKSB7IFxuICAgIGlmKGRhdGEpIHN0cmVhbS5fZGF0YShkYXRhKVxuICAgIGlmKGVtaXRFbmQpIHJldHVyblxuICAgIGVtaXRFbmQgPSB0cnVlXG4gICAgLy9kZXN0cm95IGlzIGhhbmRsZWQgYWJvdmUuXG4gICAgc3RyZWFtLmRyYWluKClcbiAgfVxuXG4gIHN0cmVhbS53cml0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgc3RyZWFtLmVtaXQoJ19kYXRhJywgZGF0YSlcbiAgICByZXR1cm4gIXN0cmVhbS5fcGF1c2VkXG4gIH1cblxuICBzdHJlYW0uZW5kID0gZnVuY3Rpb24gKCkge1xuICAgIHN0cmVhbS53cml0YWJsZSA9IGZhbHNlXG4gICAgaWYoc3RyZWFtLmVuZGVkKSByZXR1cm5cbiAgICBzdHJlYW0uZW5kZWQgPSB0cnVlXG4gICAgc3RyZWFtLmVtaXQoJ19lbmQnKVxuICB9XG5cbiAgc3RyZWFtLmRyYWluID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKCFidWZmZXIubGVuZ3RoICYmICFlbWl0RW5kKSByZXR1cm5cbiAgICAvL2lmIHRoZSBzdHJlYW0gaXMgcGF1c2VkIGFmdGVyIGp1c3QgYmVmb3JlIGVtaXRFbmQoKVxuICAgIC8vZW5kIHNob3VsZCBiZSBidWZmZXJlZC5cbiAgICB3aGlsZSghc3RyZWFtLnBhdXNlZCkge1xuICAgICAgaWYoYnVmZmVyLmxlbmd0aCkge1xuICAgICAgICBzdHJlYW0uZW1pdCgnZGF0YScsIGJ1ZmZlci5zaGlmdCgpKVxuICAgICAgICBpZihidWZmZXIubGVuZ3RoID09IDApIHtcbiAgICAgICAgICBzdHJlYW0uZW1pdCgnX2RyYWluJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZihlbWl0RW5kICYmIHN0cmVhbS5yZWFkYWJsZSkge1xuICAgICAgICBzdHJlYW0ucmVhZGFibGUgPSBmYWxzZVxuICAgICAgICBzdHJlYW0uZW1pdCgnZW5kJylcbiAgICAgICAgcmV0dXJuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2lmIHRoZSBidWZmZXIgaGFzIGVtcHRpZWQuIGVtaXQgZHJhaW4uXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHZhciBzdGFydGVkID0gZmFsc2VcbiAgc3RyZWFtLnJlc3VtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvL3RoaXMgaXMgd2hlcmUgSSBuZWVkIHBhdXNlUmVhZCwgYW5kIHBhdXNlV3JpdGUuXG4gICAgLy9oZXJlIHRoZSByZWFkaW5nIHNpZGUgaXMgdW5wYXVzZWQsXG4gICAgLy9idXQgdGhlIHdyaXRpbmcgc2lkZSBtYXkgc3RpbGwgYmUgcGF1c2VkLlxuICAgIC8vdGhlIHdob2xlIGJ1ZmZlciBtaWdodCBub3QgZW1waXR5IGF0IG9uY2UuXG4gICAgLy9pdCBtaWdodCBwYXVzZSBhZ2Fpbi5cbiAgICAvL3RoZSBzdHJlYW0gc2hvdWxkIG5ldmVyIGVtaXQgZGF0YSBpbmJldHdlZW4gcGF1c2UoKS4uLnJlc3VtZSgpXG4gICAgLy9hbmQgd3JpdGUgc2hvdWxkIHJldHVybiAhYnVmZmVyLmxlbmd0aFxuICAgIHN0YXJ0ZWQgPSB0cnVlXG4gICAgc3RyZWFtLnBhdXNlZCA9IGZhbHNlXG4gICAgc3RyZWFtLmRyYWluKCkgLy93aWxsIGVtaXQgZHJhaW4gaWYgYnVmZmVyIGVtcHRpZXMuXG4gICAgcmV0dXJuIHN0cmVhbVxuICB9XG5cbiAgc3RyZWFtLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoZGVzdHJveWVkKSByZXR1cm5cbiAgICBkZXN0cm95ZWQgPSBlbmRlZCA9IHRydWUgICAgIFxuICAgIGJ1ZmZlci5sZW5ndGggPSAwXG4gICAgc3RyZWFtLmVtaXQoJ2Nsb3NlJylcbiAgfVxuICB2YXIgcGF1c2VDYWxsZWQgPSBmYWxzZVxuICBzdHJlYW0ucGF1c2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgc3RhcnRlZCA9IHRydWVcbiAgICBzdHJlYW0ucGF1c2VkID0gdHJ1ZVxuICAgIHN0cmVhbS5lbWl0KCdfcGF1c2UnKVxuICAgIHJldHVybiBzdHJlYW1cbiAgfVxuICBzdHJlYW0uX3BhdXNlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKCFzdHJlYW0uX3BhdXNlZCkge1xuICAgICAgc3RyZWFtLl9wYXVzZWQgPSB0cnVlXG4gICAgICBzdHJlYW0uZW1pdCgncGF1c2UnKVxuICAgIH1cbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIHN0cmVhbS5wYXVzZWQgPSB0cnVlXG4gIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgIC8vdW5sZXNzIHRoZSB1c2VyIG1hbnVhbGx5IHBhdXNlZFxuICAgIGlmKHN0YXJ0ZWQpIHJldHVyblxuICAgIHN0cmVhbS5yZXN1bWUoKVxuICB9KVxuIFxuICByZXR1cm4gc3RyZWFtXG59XG5cblxufSkocmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpKSIsIlxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlclxuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAod3JhcHBlcikge1xuXG4gIGlmKCdmdW5jdGlvbicgPT0gdHlwZW9mIHdyYXBwZXIpXG4gICAgcmV0dXJuIHdyYXBwZXJcbiAgXG4gIHJldHVybiBleHBvcnRzW3dyYXBwZXJdIHx8IGV4cG9ydHMuanNvblxufVxuXG5leHBvcnRzLmpzb24gPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG5cbiAgdmFyIHdyaXRlID0gc3RyZWFtLndyaXRlXG4gIHZhciBzb0ZhciA9ICcnXG5cbiAgZnVuY3Rpb24gcGFyc2UgKGxpbmUpIHtcbiAgICB2YXIganNcbiAgICB0cnkge1xuICAgICAganMgPSBKU09OLnBhcnNlKGxpbmUpXG4gICAgICAvL2lnbm9yZSBsaW5lcyBvZiB3aGl0ZXNwYWNlLi4uXG4gICAgfSBjYXRjaCAoZXJyKSB7IFxuICAgICAgcmV0dXJuIHN0cmVhbS5lbWl0KCdlcnJvcicsIGVycilcbiAgICAgIC8vcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ2ludmFsaWQgSlNPTicsIGxpbmUpXG4gICAgfVxuICAgIGlmKGpzICE9PSB1bmRlZmluZWQpXG4gICAgICB3cml0ZS5jYWxsKHN0cmVhbSwganMpXG4gIH1cblxuICBmdW5jdGlvbiBvbkRhdGEgKGRhdGEpIHtcbiAgICB2YXIgbGluZXMgPSAoc29GYXIgKyBkYXRhKS5zcGxpdCgnXFxuJylcbiAgICBzb0ZhciA9IGxpbmVzLnBvcCgpXG4gICAgd2hpbGUobGluZXMubGVuZ3RoKSB7XG4gICAgICBwYXJzZShsaW5lcy5zaGlmdCgpKVxuICAgIH1cbiAgfVxuXG4gIHN0cmVhbS53cml0ZSA9IG9uRGF0YVxuICBcbiAgdmFyIGVuZCA9IHN0cmVhbS5lbmRcblxuICBzdHJlYW0uZW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBpZihkYXRhKVxuICAgICAgc3RyZWFtLndyaXRlKGRhdGEpXG4gICAgLy9pZiB0aGVyZSBpcyBhbnkgbGVmdCBvdmVyLi4uXG4gICAgaWYoc29GYXIpIHtcbiAgICAgIHBhcnNlKHNvRmFyKVxuICAgIH1cbiAgICByZXR1cm4gZW5kLmNhbGwoc3RyZWFtKVxuICB9XG5cbiAgc3RyZWFtLmVtaXQgPSBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcblxuICAgIGlmKGV2ZW50ID09ICdkYXRhJykge1xuICAgICAgZGF0YSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpICsgJ1xcbidcbiAgICB9XG4gICAgLy9zaW5jZSBhbGwgc3RyZWFtIGV2ZW50cyBvbmx5IHVzZSBvbmUgYXJndW1lbnQsIHRoaXMgaXMgb2theS4uLlxuICAgIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdC5jYWxsKHN0cmVhbSwgZXZlbnQsIGRhdGEpXG4gIH1cblxuICByZXR1cm4gc3RyZWFtXG4vLyAgcmV0dXJuIGVzLnBpcGVsaW5lKGVzLnNwbGl0KCksIGVzLnBhcnNlKCksIHN0cmVhbSwgZXMuc3RyaW5naWZ5KCkpXG59XG5cbmV4cG9ydHMucmF3ID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuICByZXR1cm4gc3RyZWFtXG59XG5cbiIsInZhciBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5mdW5jdGlvbiBTdHJlYW0oKSB7XG4gIGV2ZW50cy5FdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcbn1cbnV0aWwuaW5oZXJpdHMoU3RyZWFtLCBldmVudHMuRXZlbnRFbWl0dGVyKTtcbm1vZHVsZS5leHBvcnRzID0gU3RyZWFtO1xuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC40LnhcblN0cmVhbS5TdHJlYW0gPSBTdHJlYW07XG5cblN0cmVhbS5wcm90b3R5cGUucGlwZSA9IGZ1bmN0aW9uKGRlc3QsIG9wdGlvbnMpIHtcbiAgdmFyIHNvdXJjZSA9IHRoaXM7XG5cbiAgZnVuY3Rpb24gb25kYXRhKGNodW5rKSB7XG4gICAgaWYgKGRlc3Qud3JpdGFibGUpIHtcbiAgICAgIGlmIChmYWxzZSA9PT0gZGVzdC53cml0ZShjaHVuaykgJiYgc291cmNlLnBhdXNlKSB7XG4gICAgICAgIHNvdXJjZS5wYXVzZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNvdXJjZS5vbignZGF0YScsIG9uZGF0YSk7XG5cbiAgZnVuY3Rpb24gb25kcmFpbigpIHtcbiAgICBpZiAoc291cmNlLnJlYWRhYmxlICYmIHNvdXJjZS5yZXN1bWUpIHtcbiAgICAgIHNvdXJjZS5yZXN1bWUoKTtcbiAgICB9XG4gIH1cblxuICBkZXN0Lm9uKCdkcmFpbicsIG9uZHJhaW4pO1xuXG4gIC8vIElmIHRoZSAnZW5kJyBvcHRpb24gaXMgbm90IHN1cHBsaWVkLCBkZXN0LmVuZCgpIHdpbGwgYmUgY2FsbGVkIHdoZW5cbiAgLy8gc291cmNlIGdldHMgdGhlICdlbmQnIG9yICdjbG9zZScgZXZlbnRzLiAgT25seSBkZXN0LmVuZCgpIG9uY2UsIGFuZFxuICAvLyBvbmx5IHdoZW4gYWxsIHNvdXJjZXMgaGF2ZSBlbmRlZC5cbiAgaWYgKCFkZXN0Ll9pc1N0ZGlvICYmICghb3B0aW9ucyB8fCBvcHRpb25zLmVuZCAhPT0gZmFsc2UpKSB7XG4gICAgZGVzdC5fcGlwZUNvdW50ID0gZGVzdC5fcGlwZUNvdW50IHx8IDA7XG4gICAgZGVzdC5fcGlwZUNvdW50Kys7XG5cbiAgICBzb3VyY2Uub24oJ2VuZCcsIG9uZW5kKTtcbiAgICBzb3VyY2Uub24oJ2Nsb3NlJywgb25jbG9zZSk7XG4gIH1cblxuICB2YXIgZGlkT25FbmQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gb25lbmQoKSB7XG4gICAgaWYgKGRpZE9uRW5kKSByZXR1cm47XG4gICAgZGlkT25FbmQgPSB0cnVlO1xuXG4gICAgZGVzdC5fcGlwZUNvdW50LS07XG5cbiAgICAvLyByZW1vdmUgdGhlIGxpc3RlbmVyc1xuICAgIGNsZWFudXAoKTtcblxuICAgIGlmIChkZXN0Ll9waXBlQ291bnQgPiAwKSB7XG4gICAgICAvLyB3YWl0aW5nIGZvciBvdGhlciBpbmNvbWluZyBzdHJlYW1zIHRvIGVuZC5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBkZXN0LmVuZCgpO1xuICB9XG5cblxuICBmdW5jdGlvbiBvbmNsb3NlKCkge1xuICAgIGlmIChkaWRPbkVuZCkgcmV0dXJuO1xuICAgIGRpZE9uRW5kID0gdHJ1ZTtcblxuICAgIGRlc3QuX3BpcGVDb3VudC0tO1xuXG4gICAgLy8gcmVtb3ZlIHRoZSBsaXN0ZW5lcnNcbiAgICBjbGVhbnVwKCk7XG5cbiAgICBpZiAoZGVzdC5fcGlwZUNvdW50ID4gMCkge1xuICAgICAgLy8gd2FpdGluZyBmb3Igb3RoZXIgaW5jb21pbmcgc3RyZWFtcyB0byBlbmQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZGVzdC5kZXN0cm95KCk7XG4gIH1cblxuICAvLyBkb24ndCBsZWF2ZSBkYW5nbGluZyBwaXBlcyB3aGVuIHRoZXJlIGFyZSBlcnJvcnMuXG4gIGZ1bmN0aW9uIG9uZXJyb3IoZXIpIHtcbiAgICBjbGVhbnVwKCk7XG4gICAgaWYgKHRoaXMubGlzdGVuZXJzKCdlcnJvcicpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCBzdHJlYW0gZXJyb3IgaW4gcGlwZS5cbiAgICB9XG4gIH1cblxuICBzb3VyY2Uub24oJ2Vycm9yJywgb25lcnJvcik7XG4gIGRlc3Qub24oJ2Vycm9yJywgb25lcnJvcik7XG5cbiAgLy8gcmVtb3ZlIGFsbCB0aGUgZXZlbnQgbGlzdGVuZXJzIHRoYXQgd2VyZSBhZGRlZC5cbiAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2RhdGEnLCBvbmRhdGEpO1xuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2RyYWluJywgb25kcmFpbik7XG5cbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2VuZCcsIG9uZW5kKTtcbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgb25jbG9zZSk7XG5cbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25lcnJvcik7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbmVycm9yKTtcblxuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZW5kJywgY2xlYW51cCk7XG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIGNsZWFudXApO1xuXG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZW5kJywgY2xlYW51cCk7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBjbGVhbnVwKTtcbiAgfVxuXG4gIHNvdXJjZS5vbignZW5kJywgY2xlYW51cCk7XG4gIHNvdXJjZS5vbignY2xvc2UnLCBjbGVhbnVwKTtcblxuICBkZXN0Lm9uKCdlbmQnLCBjbGVhbnVwKTtcbiAgZGVzdC5vbignY2xvc2UnLCBjbGVhbnVwKTtcblxuICBkZXN0LmVtaXQoJ3BpcGUnLCBzb3VyY2UpO1xuXG4gIC8vIEFsbG93IGZvciB1bml4LWxpa2UgdXNhZ2U6IEEucGlwZShCKS5waXBlKEMpXG4gIHJldHVybiBkZXN0O1xufTtcbiIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcbnZhciBiYWNrb2ZmID0gcmVxdWlyZSgnYmFja29mZicpXG5cbm1vZHVsZS5leHBvcnRzID1cbmZ1bmN0aW9uIChjcmVhdGVDb25uZWN0aW9uKSB7XG4gIHJldHVybiBmdW5jdGlvbiAob3B0cywgb25Db25uZWN0KSB7XG4gICAgb25Db25uZWN0ID0gJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygb3B0cyA/IG9wdHMgOiBvbkNvbm5lY3RcbiAgICBvcHRzID0gb3B0cyB8fCB7aW5pdGlhbERlbGF5OiAxZTMsIG1heERlbGF5OiAzMGUzfVxuICAgIGlmKCFvbkNvbm5lY3QpXG4gICAgICBvbkNvbm5lY3QgPSBvcHRzLm9uQ29ubmVjdFxuXG4gICAgdmFyIGVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKClcbiAgICBlbWl0dGVyLmNvbm5lY3RlZCA9IGZhbHNlXG4gICAgZW1pdHRlci5yZWNvbm5lY3QgPSB0cnVlXG5cbiAgICBpZihvbkNvbm5lY3QpXG4gICAgICBlbWl0dGVyLm9uKCdjb25uZWN0Jywgb25Db25uZWN0KVxuXG4gICAgdmFyIGJhY2tvZmZNZXRob2QgPSAoYmFja29mZltvcHRzLnR5cGVdIHx8IGJhY2tvZmYuZmlib25hY2NpKSAob3B0cylcblxuICAgIGJhY2tvZmZNZXRob2Qub24oJ2JhY2tvZmYnLCBmdW5jdGlvbiAobiwgZCkge1xuICAgICAgZW1pdHRlci5lbWl0KCdiYWNrb2ZmJywgbiwgZClcbiAgICB9KVxuXG4gICAgdmFyIGFyZ3NcbiAgICBmdW5jdGlvbiBhdHRlbXB0IChuLCBkZWxheSkge1xuICAgICAgaWYoIWVtaXR0ZXIucmVjb25uZWN0KSByZXR1cm5cblxuICAgICAgZW1pdHRlci5lbWl0KCdyZWNvbm5lY3QnLCBuLCBkZWxheSlcbiAgICAgIHZhciBjb24gPSBjcmVhdGVDb25uZWN0aW9uLmFwcGx5KG51bGwsIGFyZ3MpXG4gICAgICBlbWl0dGVyLl9jb25uZWN0aW9uID0gY29uXG4gICAgICBmdW5jdGlvbiBvbkRpc2Nvbm5lY3QgKCkge1xuXG4gICAgICAgIGVtaXR0ZXIuY29ubmVjdGVkID0gZmFsc2VcbiAgICAgICAgY29uLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uRGlzY29ubmVjdClcbiAgICAgICAgY29uLnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIG9uRGlzY29ubmVjdClcbiAgICAgICAgY29uLnJlbW92ZUxpc3RlbmVyKCdlbmQnICAsIG9uRGlzY29ubmVjdClcblxuICAgICAgICAvL2VtaXQgZGlzY29ubmVjdCBiZWZvcmUgY2hlY2tpbmcgcmVjb25uZWN0LCBzbyB1c2VyIGhhcyBhIGNoYW5jZSB0byBkZWNpZGUgbm90IHRvLlxuICAgICAgICBlbWl0dGVyLmVtaXQoJ2Rpc2Nvbm5lY3QnLCBjb24pXG5cbiAgICAgICAgaWYoIWVtaXR0ZXIucmVjb25uZWN0KSByZXR1cm5cbiAgICAgICAgYmFja29mZk1ldGhvZC5iYWNrb2ZmKClcbiAgICAgIH1cblxuICAgICAgY29uLm9uKCdjb25uZWN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBiYWNrb2ZmTWV0aG9kLnJlc2V0KClcbiAgICAgICAgZW1pdHRlci5jb25uZWN0ZWQgPSB0cnVlXG4gICAgICAgIGVtaXR0ZXIuZW1pdCgnY29ubmVjdCcsIGNvbilcbiAgICAgIH0pLm9uKCdlcnJvcicsIG9uRGlzY29ubmVjdClcbiAgICAgICAgLm9uKCdjbG9zZScsIG9uRGlzY29ubmVjdClcbiAgICAgICAgLm9uKCdlbmQnICAsIG9uRGlzY29ubmVjdClcbiAgICB9XG5cbiAgICBlbWl0dGVyLmNvbm5lY3QgPVxuICAgIGVtaXR0ZXIubGlzdGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5yZWNvbm5lY3QgPSB0cnVlXG4gICAgICBpZihlbWl0dGVyLmNvbm5lY3RlZCkgcmV0dXJuXG4gICAgICBiYWNrb2ZmTWV0aG9kLnJlc2V0KClcbiAgICAgIGJhY2tvZmZNZXRob2Qub24oJ3JlYWR5JywgYXR0ZW1wdClcbiAgICAgIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgIGF0dGVtcHQoMCwgMClcbiAgICAgIHJldHVybiBlbWl0dGVyXG4gICAgfVxuXG4gICAgLy9mb3JjZSByZWNvbm5lY3Rpb25cbiAgICBlbWl0dGVyLnJlY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmKHRoaXMuY29ubmVjdGVkKVxuICAgICAgICByZXR1cm4gZW1pdHRlci5kaXNjb25uZWN0KClcbiAgICAgIFxuICAgICAgYmFja29mZk1ldGhvZC5yZXNldCgpXG4gICAgICBhdHRlbXB0KDAsIDApXG4gICAgICByZXR1cm4gZW1pdHRlclxuICAgIH1cblxuICAgIGVtaXR0ZXIuZGlzY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMucmVjb25uZWN0ID0gZmFsc2VcbiAgICAgIGlmKCFlbWl0dGVyLmNvbm5lY3RlZCkgcmV0dXJuIGVtaXR0ZXJcbiAgICAgIFxuICAgICAgZWxzZSBpZihlbWl0dGVyLl9jb25uZWN0aW9uKVxuICAgICAgICBlbWl0dGVyLl9jb25uZWN0aW9uLmRlc3Ryb3koKVxuXG4gICAgICBlbWl0dGVyLmVtaXQoJ2Rpc2Nvbm5lY3QnKVxuICAgICAgcmV0dXJuIGVtaXR0ZXJcbiAgICB9XG5cbiAgICB2YXIgd2lkZ2V0XG4gICAgZW1pdHRlci53aWRnZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZighd2lkZ2V0KVxuICAgICAgICB3aWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldCcpKGVtaXR0ZXIpXG4gICAgICByZXR1cm4gd2lkZ2V0XG4gICAgfVxuXG4gICAgcmV0dXJuIGVtaXR0ZXJcbiAgfVxuXG59XG4iLCJleHBvcnRzLmNyZWF0ZUlkID0gXG5mdW5jdGlvbiAoKSB7XG4gIHJldHVybiBbMSwxLDFdLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygyKS50b1VwcGVyQ2FzZSgpXG4gIH0pLmpvaW4oJycpXG59XG5cbmV4cG9ydHMuZmlsdGVyID0gZnVuY3Rpb24gKHVwZGF0ZSwgc291cmNlcykge1xuICB2YXIgdHMgPSB1cGRhdGVbMV1cbiAgdmFyIHNvdXJjZSA9IHVwZGF0ZVsyXVxuICByZXR1cm4gKCFzb3VyY2VzIHx8ICFzb3VyY2VzW3NvdXJjZV0gfHwgc291cmNlc1tzb3VyY2VdIDwgdHMpXG59XG5cbmV4cG9ydHMucHJvdG9Jc0lsbGVnYWwgPSBmdW5jdGlvbiAocykge1xuICBzLmVtaXQoJ2ludmFsaWQnLCBuZXcgRXJyb3IoJ1wiX19wcm90b19fXCIgaXMgaWxsZWdhbCBwcm9wZXJ0eSBuYW1lJykpXG4gIHJldHVybiBudWxsXG59XG5cbmZ1bmN0aW9uIGludmFsaWRVcGRhdGUodCkge1xuICB0LmVtaXQoJ2ludmFsaWQnLCBuZXcgRXJyb3IoJ2ludmFsaWQgdXBkYXRlJykpXG59XG5cbmV4cG9ydHMudmFsaWRVcGRhdGUgPSBmdW5jdGlvbiAodCwgdXBkYXRlKSB7XG4gIGlmKCFBcnJheS5pc0FycmF5KHVwZGF0ZSkpIHJldHVybiBpbnZhbGlkVXBkYXRlKHQpXG4gIGlmKCdzdHJpbmcnICE9PSB0eXBlb2YgdXBkYXRlWzFdIHx8ICdudW1iZXInICE9PSB0eXBlb2YgdXBkYXRlWzJdKVxuICAgIHJldHVybiBpbnZhbGlkVXBkYXRlKHQpXG59XG5cbmV4cG9ydHMuc29ydCA9IGZ1bmN0aW9uIChoaXN0KSB7XG4gIHJldHVybiBoaXN0LnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAvL3NvcnQgYnkgdGltZXN0YW1wcywgdGhlbiBpZHMuXG4gICAgLy90aGVyZSBzaG91bGQgbmV2ZXIgYmUgYSBwYWlyIHdpdGggZXF1YWwgdGltZXN0YW1wc1xuICAgIC8vYW5kIGlkcy5cbiAgICByZXR1cm4gYVsxXSAtIGJbMV0gfHwgKGFbMl0gPiBiWzJdID8gMSA6IC0xKVxuICB9KVxufVxuIiwiXG52YXIgYmV0d2VlbiAgICAgPSByZXF1aXJlKCdiZXR3ZWVuJylcbnZhciBTY3V0dGxlYnV0dCA9IHJlcXVpcmUoJ3NjdXR0bGVidXR0JylcbnZhciBpbmhlcml0cyAgICA9IHJlcXVpcmUoJ3V0aWwnKS5pbmhlcml0c1xudmFyIGZpbHRlciAgICAgID0gcmVxdWlyZSgnc2N1dHRsZWJ1dHQvdXRpbCcpLmZpbHRlclxuXG5pbmhlcml0cyhSQXJyYXksIFNjdXR0bGVidXR0KVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJBcnJheVxuXG5mdW5jdGlvbiBmdXp6ICgpIHtcbiAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMiwgNSlcbn1cblxudmFyIERPRU1JVCA9IHRydWUsIENIQU5HRSA9IHt9XG5cbmZ1bmN0aW9uIG9yZGVyIChhLCBiKSB7XG4gIC8vdGltZXN0YW1wLCB0aGVuIHNvdXJjZVxuICByZXR1cm4gYmV0d2Vlbi5zdHJvcmQoYVsxXSwgYlsxXSkgfHwgYmV0d2Vlbi5zdHJvcmQoYVsyXSwgYlsyXSlcbn1cblxuZnVuY3Rpb24gUkFycmF5ICgpIHtcbiAgU2N1dHRsZWJ1dHQuY2FsbCh0aGlzKVxuICB0aGlzLmtleXMgPSBbXVxuICB0aGlzLnN0b3JlID0ge31cbiAgdGhpcy5faGlzdCA9IHt9XG4gIHRoaXMubGVuZ3RoID0gMFxuICBpZihhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgO1tdLmZvckVhY2guY2FsbChhcmd1bWVudHMsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBzZWxmLnB1c2goZSlcbiAgICB9KVxuICB9XG59XG5cbnZhciBBID0gUkFycmF5LnByb3RvdHlwZVxuXG5BLmxhc3QgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmtleXNbdGhpcy5rZXlzLmxlbmd0aCAtIDFdXG59XG5cbkEuZmlyc3QgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmtleXNbMF1cbn1cblxuQS5pbnNlcnQgPSBmdW5jdGlvbiAoYmVmb3JlLCB2YWwsIGFmdGVyKSB7ICBcbiAgdmFyIGtleSA9IGJldHdlZW4oYmVmb3JlIHx8IGJldHdlZW4ubG8sIGFmdGVyIHx8IGJldHdlZW4uaGkpICsgZnV6eigpXG4gIHRoaXMuc2V0KGtleSwgdmFsKVxuICByZXR1cm4ga2V5XG59XG5cbkEucHVzaCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgdmFyIGtleSA9IHRoaXMuaW5zZXJ0KHRoaXMubGFzdCgpLCB2YWwpXG59XG5cbkEudW5zaGlmdCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgdmFyIGtleSA9IHRoaXMuaW5zZXJ0KG51bGwsIHZhbCwgdGhpcy5maXJzdCgpKVxufVxuXG5BLmluZGV4T2YgPSBmdW5jdGlvbiAodmFsKSB7XG4gIGZvcih2YXIgaSBpbiB0aGlzLmtleXMpIHtcbiAgICB2YXIga2V5ID0gdGhpcy5rZXlzW2ldXG4gICAgaWYodiA9PT0gdGhpcy5nZXQoa2V5KSkgcmV0dXJuIGlcbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG5BLmluZGV4T2ZLZXkgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiB0aGlzLmtleXMuaW5kZXhPZihrZXkpXG59XG5cbkEudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3RvcmUgPSB0aGlzLnN0b3JlXG4gIHZhciBzZWxmID0gdGhpc1xuICByZXR1cm4gdGhpcy5rZXlzLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHNlbGYuZ2V0KGtleSlcbiAgfSlcbn1cblxuQS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWwpIHtcbiAgaWYoJ3N0cmluZycgPT0gdHlwZW9mIGtleSkge1xuICAgIGlmKHZhbCA9PT0gbnVsbCkgcmV0dXJuIHRoaXMudW5zZXQoa2V5KVxuICAgIGlmKG51bGwgPT0gdGhpcy5zdG9yZVtrZXldKSB0aGlzLmxlbmd0aCArK1xuICAgIHRoaXMuc3RvcmVba2V5XSA9IHZhbFxuICAgIGlmKCF+dGhpcy5rZXlzLmluZGV4T2Yoa2V5KSkge1xuICAgICAgdGhpcy5rZXlzLnB1c2goa2V5KVxuICAgICAgdGhpcy5rZXlzLnNvcnQoKVxuICAgIH1cbiAgICBDSEFOR0Vba2V5XSA9IHZhbFxuICAgIERPRU1JVCAmJiB0aGlzLl9lbWl0KClcbiAgfVxufVxuXG5BLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgcmV0dXJuIHRoaXMuc3RvcmVba2V5XVxufVxuXG5BLnVuc2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICBpZignc3RyaW5nJyA9PSB0eXBlb2Yga2V5KSB7XG4gICAgaWYobnVsbCAhPSB0aGlzLnN0b3JlW2tleV0pIHRoaXMubGVuZ3RoIC0tXG4gICAgZGVsZXRlIHRoaXMuc3RvcmVba2V5XVxuICAgIHZhciBpID0gdGhpcy5rZXlzLmluZGV4T2Yoa2V5KVxuICAgIGlmKCF+aSkgcmV0dXJuXG4gICAgdGhpcy5rZXlzLnNwbGljZShpLCAxKSAgICBcblxuICAgIENIQU5HRVtrZXldID0gbnVsbFxuICAgIERPRU1JVCAmJiB0aGlzLl9lbWl0KClcbiAgfVxufVxuXG5BLnBvcCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGwgPSB0aGlzLmxhc3QoKVxuICB2YXIgdmFsID0gdGhpcy5zdG9yZVtsXVxuICB0aGlzLnVuc2V0KGwpXG4gIHJldHVybiB2YWxcbn1cblxuQS5zaGlmdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGYgPSB0aGlzLmZpcnN0KClcbiAgdmFyIHZhbCA9IHRoaXMuc3RvcmVbZl1cbiAgdGhpcy51bnNldChmKVxuICByZXR1cm4gdmFsXG59XG5cbkEuX2VtaXQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmKCFET0VNSVQpIHJldHVyblxuICB0aGlzLmxvY2FsVXBkYXRlKENIQU5HRSlcbiAgQ0hBTkdFID0ge31cbn1cblxuQS5zcGxpY2UgPSBmdW5jdGlvbiAoaSwgZCAvKiwuLi5hcmdzKi8pIHtcbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMilcbiAgdmFyIGogPSAwLCBsID0gYXJncy5sZW5ndGhcblxuICBET0VNSVQgPSBmYWxzZVxuXG4gIGlmKGQgKyBpID4gdGhpcy5rZXlzLmxlbmd0aClcbiAgICBkID0gdGhpcy5rZXlzLmxlbmd0aCAtIGlcbiAgXG4gIHdoaWxlKGogPCBkKSB7XG4gICAgaWYoaiA8IGwpXG4gICAgICB0aGlzLnNldCh0aGlzLmtleXNbaStqXSwgYXJnc1tqXSksIGorK1xuICAgIGVsc2VcbiAgICAgIHRoaXMudW5zZXQodGhpcy5rZXlzW2kral0pLCBkLS1cbiAgfVxuXG4gIHdoaWxlKGogPCBsKVxuICAgIHRoaXMuaW5zZXJ0KHRoaXMua2V5c1tpK2otMV0sIGFyZ3Nbal0sIHRoaXMua2V5c1tpK2pdKSwgaisrXG5cbiAgRE9FTUlUID0gdHJ1ZVxuICB0aGlzLl9lbWl0KClcbn1cblxuQS5hcHBseVVwZGF0ZSA9IGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgRE9FTUlUID0gZmFsc2VcbiAgdmFyIGNoYW5nZSA9IHVwZGF0ZVswXSwgb2xkXG4gIHZhciBhcHBseSA9IHt9LCBjaCA9IHt9XG4gIHZhciBvbGQgPSB7fVxuICBmb3IodmFyIGtleSBpbiBjaGFuZ2UpIHtcbiAgICBpZighdGhpcy5faGlzdFtrZXldIHx8IG9yZGVyKHVwZGF0ZSwgdGhpcy5faGlzdFtrZXldKSA+IDApXG4gICAgICBhcHBseVtrZXldID0gY2hhbmdlW2tleV1cbiAgfVxuICAvL2FsbG93IHRoZSB1c2VyIHRvIHNlZSB3aGF0IHRoZSBjaGFuZ2UgaXMgZ29pbmcgdG8gYmUuXG4gIHRoaXMuZW1pdCgncHJldXBkYXRlJywgYXBwbHkpIFxuXG4gIC8vYXBwbHkgdGhlIGNoYW5nZS4uLlxuICBmb3IodmFyIGtleSBpbiBhcHBseSkge1xuICAgIHZhciBvID0gdGhpcy5faGlzdFtrZXldXG4gICAgbyAmJiAob2xkW29bMV0rJzonK29bMl1dID0gbykgLy90czpzb3VyY2VcbiAgICB0aGlzLl9oaXN0W2tleV0gPSB1cGRhdGVcbiAgICB0aGlzLnNldChrZXksIGFwcGx5W2tleV0pXG4gIH1cblxuICAvL2NoZWNrIGlmIG9sZCBlbGVtZW50cyBuZWVkIHRvIGJlIHJlbW92ZWQuXG4gIC8vbWF5IGFsc28gd2FudCB0byBrZWVwIG9sZCB1cGRhdGVzIGhhbmdpbmcgYXJvdW5kIFxuICAvL3NvIHRoZSB1c2VyIGNhbiBzZWUgcmVjZW50IGhpc3RvcnkuLi5cbiAgZm9yKHZhciBpZCBpbiBvbGQpIHtcbiAgICB2YXIgbyA9IG9sZFtpZF1bMF0sIHJtID0gdHJ1ZVxuICAgIGZvcih2YXIga2V5IGluIG8pIHtcbiAgICAgIGlmKHRoaXMuX2hpc3Rba2V5XSA9PT0gb2xkW2lkXSkgcm0gPSBmYWxzZVxuICAgIH1cbiAgICBpZihybSlcbiAgICAgIHRoaXMuZW1pdCgnX3JlbW92ZScsIG9sZFtpZF0pXG4gIH1cbiAgICBcbiAgRE9FTUlUID0gdHJ1ZVxuICBDSEFOR0UgPSB7fVxuICB0aGlzLmVtaXQoJ3VwZGF0ZScsIGFwcGx5KVxuICByZXR1cm4gdHJ1ZVxufVxuXG5cbkEuaGlzdG9yeSA9IGZ1bmN0aW9uIChzb3VyY2VzKSB7XG4gIHZhciBoID0gW11cbiAgZm9yICh2YXIga2V5IGluIHRoaXMuX2hpc3QpIHtcbiAgICB2YXIgdXBkYXRlID0gdGhpcy5faGlzdFtrZXldXG4gICAgICBpZighfmguaW5kZXhPZih1cGRhdGUpICYmIGZpbHRlcih1cGRhdGUsIHNvdXJjZXMpKVxuICAgICAgICBoLnB1c2godXBkYXRlKVxuICB9XG4gIHJldHVybiBoLnNvcnQob3JkZXIpXG59XG5cbkEuZm9yRWFjaCA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgcmV0dXJuIHRoaXMudG9KU09OKCkuZm9yRWFjaChmdW4pXG59XG5cbkEuZmlsdGVyID0gZnVuY3Rpb24gKGZ1bikge1xuICByZXR1cm4gdGhpcy50b0pTT04oKS5maWx0ZXIoZnVuKVxufVxuXG5BLm1hcCA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgcmV0dXJuIHRoaXMudG9KU09OKCkubWFwKGZ1bilcbn1cblxuQS5yZWR1Y2UgPSBmdW5jdGlvbiAoZnVuLCBpbml0aWFsKSB7XG4gIHJldHVybiB0aGlzLnRvSlNPTigpLnJlZHVjZShmdW4sIGluaXRpYWwpXG59XG5cbi8vLmxlbmd0aCBpcyBhIHByb3BlcnR5LCBub3QgYSBmdW5jdGlvbi5cbiIsInZhciBTdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKTtcbnZhciBzb2NranMgPSByZXF1aXJlKCdzb2NranMtY2xpZW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHVyaSwgY2IpIHtcbiAgICBpZiAoL15cXC9cXC9bXlxcL10rXFwvLy50ZXN0KHVyaSkpIHtcbiAgICAgICAgdXJpID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgdXJpO1xuICAgIH1cbiAgICBlbHNlIGlmICghL15odHRwcz86XFwvXFwvLy50ZXN0KHVyaSkpIHtcbiAgICAgICAgdXJpID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vJ1xuICAgICAgICAgICAgKyB3aW5kb3cubG9jYXRpb24uaG9zdFxuICAgICAgICAgICAgKyAoL15cXC8vLnRlc3QodXJpKSA/IHVyaSA6ICcvJyArIHVyaSlcbiAgICAgICAgO1xuICAgIH1cbiAgICBcbiAgICB2YXIgc3RyZWFtID0gbmV3IFN0cmVhbTtcbiAgICBzdHJlYW0ucmVhZGFibGUgPSB0cnVlO1xuICAgIHN0cmVhbS53cml0YWJsZSA9IHRydWU7XG4gICAgXG4gICAgdmFyIHJlYWR5ID0gZmFsc2U7XG4gICAgdmFyIGJ1ZmZlciA9IFtdO1xuICAgIFxuICAgIHZhciBzb2NrID0gc29ja2pzKHVyaSk7XG4gICAgc3RyZWFtLnNvY2sgPSBzb2NrO1xuICAgIFxuICAgIHN0cmVhbS53cml0ZSA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICAgaWYgKCFyZWFkeSB8fCBidWZmZXIubGVuZ3RoKSBidWZmZXIucHVzaChtc2cpXG4gICAgICAgIGVsc2Ugc29jay5zZW5kKG1zZylcbiAgICB9O1xuICAgIFxuICAgIHN0cmVhbS5lbmQgPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgICAgIGlmIChtc2cgIT09IHVuZGVmaW5lZCkgc3RyZWFtLndyaXRlKG1zZyk7XG4gICAgICAgIGlmICghcmVhZHkpIHtcbiAgICAgICAgICAgIHN0cmVhbS5fZW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN0cmVhbS53cml0YWJsZSA9IGZhbHNlO1xuICAgICAgICBzb2NrLmNsb3NlKCk7XG4gICAgfTtcbiAgICBcbiAgICBzdHJlYW0uZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RyZWFtLl9lbmRlZCA9IHRydWU7XG4gICAgICAgIHN0cmVhbS53cml0YWJsZSA9IHN0cmVhbS5yZWFkYWJsZSA9IGZhbHNlO1xuICAgICAgICBidWZmZXIubGVuZ3RoID0gMFxuICAgICAgICBzb2NrLmNsb3NlKCk7XG4gICAgfTtcbiAgICBcbiAgICBzb2NrLm9ub3BlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoKTtcbiAgICAgICAgcmVhZHkgPSB0cnVlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1ZmZlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc29jay5zZW5kKGJ1ZmZlcltpXSk7XG4gICAgICAgIH1cbiAgICAgICAgYnVmZmVyID0gW107XG4gICAgICAgIHN0cmVhbS5lbWl0KCdjb25uZWN0Jyk7XG4gICAgICAgIGlmIChzdHJlYW0uX2VuZGVkKSBzdHJlYW0uZW5kKCk7XG4gICAgfTtcbiAgICBcbiAgICBzb2NrLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHN0cmVhbS5lbWl0KCdkYXRhJywgZS5kYXRhKTtcbiAgICB9O1xuICAgIFxuICAgIHNvY2sub25jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2VuZCcpO1xuICAgICAgICBzdHJlYW0ud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgc3RyZWFtLnJlYWRhYmxlID0gZmFsc2U7XG4gICAgfTtcbiAgICBcbiAgICByZXR1cm4gc3RyZWFtO1xufTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIgTWF0aGlldSBUdXJjb3R0ZVxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbnZhciBCYWNrb2ZmID0gcmVxdWlyZSgnLi9saWIvYmFja29mZicpLFxuICAgIEZpYm9uYWNjaUJhY2tvZmZTdHJhdGVneSA9IHJlcXVpcmUoJy4vbGliL3N0cmF0ZWd5L2ZpYm9uYWNjaScpLFxuICAgIEV4cG9uZW50aWFsQmFja29mZlN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9saWIvc3RyYXRlZ3kvZXhwb25lbnRpYWwnKTtcblxubW9kdWxlLmV4cG9ydHMuQmFja29mZiA9IEJhY2tvZmY7XG5tb2R1bGUuZXhwb3J0cy5GaWJvbmFjY2lTdHJhdGVneSA9IEZpYm9uYWNjaUJhY2tvZmZTdHJhdGVneTtcbm1vZHVsZS5leHBvcnRzLkV4cG9uZW50aWFsU3RyYXRlZ3kgPSBFeHBvbmVudGlhbEJhY2tvZmZTdHJhdGVneTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgRmlib25hY2NpIGJhY2tvZmYuXG4gKiBAcGFyYW0gb3B0aW9ucyBGaWJvbmFjY2kgYmFja29mZiBzdHJhdGVneSBhcmd1bWVudHMuXG4gKiBAc2VlIEZpYm9uYWNjaUJhY2tvZmZTdHJhdGVneVxuICovXG5tb2R1bGUuZXhwb3J0cy5maWJvbmFjY2kgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBCYWNrb2ZmKG5ldyBGaWJvbmFjY2lCYWNrb2ZmU3RyYXRlZ3kob3B0aW9ucykpO1xufTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGFuIGV4cG9uZW50aWFsIGJhY2tvZmYuXG4gKiBAcGFyYW0gb3B0aW9ucyBFeHBvbmVudGlhbCBzdHJhdGVneSBhcmd1bWVudHMuXG4gKiBAc2VlIEV4cG9uZW50aWFsQmFja29mZlN0cmF0ZWd5XG4gKi9cbm1vZHVsZS5leHBvcnRzLmV4cG9uZW50aWFsID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgQmFja29mZihuZXcgRXhwb25lbnRpYWxCYWNrb2ZmU3RyYXRlZ3kob3B0aW9ucykpO1xufTtcblxuIiwiXG52YXIgaCA9IHJlcXVpcmUoJ2gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbWl0dGVyKSB7XG4gIHZhciBzdHlsZSA9IHt9XG4gIHZhciBlbCA9IGgoJ2EnLCB7aHJlZjogJyMnLCBzdHlsZTogc3R5bGUsIGNsaWNrOiBlbWl0dGVyLmRpc2Nvbm5lY3R9KVxuICB2YXIgaW50XG4gIGVtaXR0ZXIub24oJ3JlY29ubmVjdCcsIGZ1bmN0aW9uIChuLCBkKSB7XG4gICAgdmFyIGRlbGF5ID0gTWF0aC5yb3VuZChkIC8gMTAwMCkgKyAxXG4gICAgY29uc29sZS5sb2cobiwgZClcbiAgICBlbC5pbm5lclRleHQgPSAncmVjb25uZWN0IGluICcgKyBkZWxheVxuICAgIGNsZWFySW50ZXJ2YWwoaW50KVxuICAgIGludCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIGVsLmlubmVyVGV4dCA9IGRlbGF5ID8gJ3JlY29ubmVjdCBpbiAnICsgLS1kZWxheSA6ICdyZWNvbm5lY3RpbmcuLi4nXG4gICAgfSwgMWUzKVxuICB9KVxuICBlbWl0dGVyLm9uKCdjb25uZWN0JywgICBmdW5jdGlvbiAoKSB7XG4gICAgZWwuaW5uZXJUZXh0ID0gJ2Nvbm5lY3RlZCdcbiAgICBjbGVhckludGVydmFsKGludClcbiAgfSlcbiAgcmV0dXJuIGVsXG59XG4iLCJcbmZ1bmN0aW9uIGluamVjdCAoY2hhcnMpIHtcblxuICBjaGFycyA9IGNoYXJzIHx8XG4gICchMDEyMzQ1Njc4OUFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaX2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6fidcblxuICBjaGFycyA9IGNoYXJzLnNwbGl0KCcnKS5zb3J0KCkuam9pbignJylcblxuICB2YXIgZXhwb3J0cyA9IGJldHdlZW5cblxuICBleHBvcnRzLmJldHdlZW4gICA9IGJldHdlZW5cblxuICBleHBvcnRzLnJhbmRzdHIgICA9IHJhbmRzdHJcbiAgZXhwb3J0cy5iZXR3ZWVuICAgPSBiZXR3ZWVuXG4gIGV4cG9ydHMuc3Ryb3JkICAgID0gc3Ryb3JkXG5cbiAgZXhwb3J0cy5sbyAgICAgICAgPSBjaGFyc1swXVxuICBleHBvcnRzLmhpICAgICAgICA9IGNoYXJzW2NoYXJzLmxlbmd0aCAtIDFdXG5cbiAgZXhwb3J0cy5pbmplY3QgICAgPSBpbmplY3RcblxuICBmdW5jdGlvbiByYW5kc3RyKGwpIHtcbiAgICB2YXIgc3RyID0gJydcbiAgICB3aGlsZShsLS0pIFxuICAgICAgc3RyICs9IGNoYXJzW1xuICAgICAgICBNYXRoLmZsb29yKFxuICAgICAgICAgIE1hdGgucmFuZG9tKCkgKiBjaGFycy5sZW5ndGggXG4gICAgICAgIClcbiAgICAgIF1cbiAgICByZXR1cm4gc3RyXG4gIH1cblxuICAvKlxuICAgIFNPTUUgRVhBTVBMRSBTVFJJTkdTLCBJTiBPUkRFUlxuICAgXG4gICAgMFxuICAgIDAwMDAxXG4gICAgMDAwMVxuICAgIDAwMVxuICAgIDAwMTAwMVxuICAgIDAwMTAxXG4gICAgMDAxMVxuICAgIDAwMTEwMDFcbiAgICAwMDExMDAxMDFcbiAgICAwMDExMDAxMVxuICAgIDAwMTEwMVxuICAgIDAwMTExXG4gICAgMDEgIFxuXG4gICAgaWYgeW91IG5ldmVyIG1ha2UgYSBzdHJpbmcgdGhhdCBlbmRzIGluIHRoZSBsb3dlc3QgY2hhcixcbiAgICB0aGVuIGl0IGlzIGFsd2F5cyBwb3NzaWJsZSB0byBtYWtlIGEgc3RyaW5nIGJldHdlZW4gdHdvIHN0cmluZ3MuXG4gICAgdGhpcyBpcyBsaWtlIGhvdyBkZWNpbWFscyBuZXZlciBlbmQgaW4gMC4gXG5cbiAgICBleGFtcGxlOlxuXG4gICAgYmV0d2VlbignQScsICdBQicpIFxuXG4gICAgLi4uICdBQScgd2lsbCBzb3J0IGJldHdlZW4gJ0EnIGFuZCAnQUInIGJ1dCB0aGVuIGl0IGlzIGltcG9zc2libGVcbiAgICB0byBtYWtlIGEgc3RyaW5nIGluYmV0d2VlbiAnQScgYW5kICdBQScuXG4gICAgaW5zdGVhZCwgcmV0dXJuICdBQUInLCB0aGVuIHRoZXJlIHdpbGwgYmUgc3BhY2UuXG5cbiAgKi9cblxuICBmdW5jdGlvbiBiZXR3ZWVuIChhLCBiKSB7XG5cbiAgICB2YXIgcyA9ICcnLCBpID0gMFxuXG4gICAgd2hpbGUgKHRydWUpIHtcblxuICAgICAgdmFyIF9hID0gY2hhcnMuaW5kZXhPZihhW2ldKVxuICAgICAgdmFyIF9iID0gY2hhcnMuaW5kZXhPZihiW2ldKVxuICAgICBcbiAgICAgIGlmKF9hID09IC0xKSBfYSA9IDBcbiAgICAgIGlmKF9iID09IC0xKSBfYiA9IGNoYXJzLmxlbmd0aCAtIDFcblxuICAgICAgaSsrXG5cbiAgICAgIHZhciBjID0gY2hhcnNbXG4gICAgICAgICAgX2EgKyAxIDwgX2IgXG4gICAgICAgID8gTWF0aC5yb3VuZCgoX2ErX2IpLzIpXG4gICAgICAgIDogX2FcbiAgICAgIF1cblxuICAgICAgcyArPSBjXG5cbiAgICAgIGlmKGEgPCBzICYmIHMgPCBiICYmIGMgIT0gZXhwb3J0cy5sbylcbiAgICAgICAgcmV0dXJuIHM7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3Ryb3JkIChhLCBiKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIGEgPT0gYiA/ICAwXG4gICAgOiBhIDwgIGIgPyAtMVxuICAgIDogICAgICAgICAgIDFcbiAgICApXG4gIH1cblxuICBiZXR3ZWVuLnN0cm9yZFxuXG4gIHJldHVybiBiZXR3ZWVuXG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBpbmplY3QobnVsbClcbiIsIihmdW5jdGlvbigpey8qIFNvY2tKUyBjbGllbnQsIHZlcnNpb24gMC4zLjEuNy5nYTY3Zi5kaXJ0eSwgaHR0cDovL3NvY2tqcy5vcmcsIE1JVCBMaWNlbnNlXG5cbkNvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuXG4qL1xuXG4vLyBKU09OMiBieSBEb3VnbGFzIENyb2NrZm9yZCAobWluaWZpZWQpLlxudmFyIEpTT047SlNPTnx8KEpTT049e30pLGZ1bmN0aW9uKCl7ZnVuY3Rpb24gc3RyKGEsYil7dmFyIGMsZCxlLGYsZz1nYXAsaCxpPWJbYV07aSYmdHlwZW9mIGk9PVwib2JqZWN0XCImJnR5cGVvZiBpLnRvSlNPTj09XCJmdW5jdGlvblwiJiYoaT1pLnRvSlNPTihhKSksdHlwZW9mIHJlcD09XCJmdW5jdGlvblwiJiYoaT1yZXAuY2FsbChiLGEsaSkpO3N3aXRjaCh0eXBlb2YgaSl7Y2FzZVwic3RyaW5nXCI6cmV0dXJuIHF1b3RlKGkpO2Nhc2VcIm51bWJlclwiOnJldHVybiBpc0Zpbml0ZShpKT9TdHJpbmcoaSk6XCJudWxsXCI7Y2FzZVwiYm9vbGVhblwiOmNhc2VcIm51bGxcIjpyZXR1cm4gU3RyaW5nKGkpO2Nhc2VcIm9iamVjdFwiOmlmKCFpKXJldHVyblwibnVsbFwiO2dhcCs9aW5kZW50LGg9W107aWYoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5hcHBseShpKT09PVwiW29iamVjdCBBcnJheV1cIil7Zj1pLmxlbmd0aDtmb3IoYz0wO2M8ZjtjKz0xKWhbY109c3RyKGMsaSl8fFwibnVsbFwiO2U9aC5sZW5ndGg9PT0wP1wiW11cIjpnYXA/XCJbXFxuXCIrZ2FwK2guam9pbihcIixcXG5cIitnYXApK1wiXFxuXCIrZytcIl1cIjpcIltcIitoLmpvaW4oXCIsXCIpK1wiXVwiLGdhcD1nO3JldHVybiBlfWlmKHJlcCYmdHlwZW9mIHJlcD09XCJvYmplY3RcIil7Zj1yZXAubGVuZ3RoO2ZvcihjPTA7YzxmO2MrPTEpdHlwZW9mIHJlcFtjXT09XCJzdHJpbmdcIiYmKGQ9cmVwW2NdLGU9c3RyKGQsaSksZSYmaC5wdXNoKHF1b3RlKGQpKyhnYXA/XCI6IFwiOlwiOlwiKStlKSl9ZWxzZSBmb3IoZCBpbiBpKU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChpLGQpJiYoZT1zdHIoZCxpKSxlJiZoLnB1c2gocXVvdGUoZCkrKGdhcD9cIjogXCI6XCI6XCIpK2UpKTtlPWgubGVuZ3RoPT09MD9cInt9XCI6Z2FwP1wie1xcblwiK2dhcCtoLmpvaW4oXCIsXFxuXCIrZ2FwKStcIlxcblwiK2crXCJ9XCI6XCJ7XCIraC5qb2luKFwiLFwiKStcIn1cIixnYXA9ZztyZXR1cm4gZX19ZnVuY3Rpb24gcXVvdGUoYSl7ZXNjYXBhYmxlLmxhc3RJbmRleD0wO3JldHVybiBlc2NhcGFibGUudGVzdChhKT8nXCInK2EucmVwbGFjZShlc2NhcGFibGUsZnVuY3Rpb24oYSl7dmFyIGI9bWV0YVthXTtyZXR1cm4gdHlwZW9mIGI9PVwic3RyaW5nXCI/YjpcIlxcXFx1XCIrKFwiMDAwMFwiK2EuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikpLnNsaWNlKC00KX0pKydcIic6J1wiJythKydcIid9ZnVuY3Rpb24gZihhKXtyZXR1cm4gYTwxMD9cIjBcIithOmF9XCJ1c2Ugc3RyaWN0XCIsdHlwZW9mIERhdGUucHJvdG90eXBlLnRvSlNPTiE9XCJmdW5jdGlvblwiJiYoRGF0ZS5wcm90b3R5cGUudG9KU09OPWZ1bmN0aW9uKGEpe3JldHVybiBpc0Zpbml0ZSh0aGlzLnZhbHVlT2YoKSk/dGhpcy5nZXRVVENGdWxsWWVhcigpK1wiLVwiK2YodGhpcy5nZXRVVENNb250aCgpKzEpK1wiLVwiK2YodGhpcy5nZXRVVENEYXRlKCkpK1wiVFwiK2YodGhpcy5nZXRVVENIb3VycygpKStcIjpcIitmKHRoaXMuZ2V0VVRDTWludXRlcygpKStcIjpcIitmKHRoaXMuZ2V0VVRDU2Vjb25kcygpKStcIlpcIjpudWxsfSxTdHJpbmcucHJvdG90eXBlLnRvSlNPTj1OdW1iZXIucHJvdG90eXBlLnRvSlNPTj1Cb29sZWFuLnByb3RvdHlwZS50b0pTT049ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMudmFsdWVPZigpfSk7dmFyIGN4PS9bXFx1MDAwMFxcdTAwYWRcXHUwNjAwLVxcdTA2MDRcXHUwNzBmXFx1MTdiNFxcdTE3YjVcXHUyMDBjLVxcdTIwMGZcXHUyMDI4LVxcdTIwMmZcXHUyMDYwLVxcdTIwNmZcXHVmZWZmXFx1ZmZmMC1cXHVmZmZmXS9nLGVzY2FwYWJsZT0vW1xcXFxcXFwiXFx4MDAtXFx4MWZcXHg3Zi1cXHg5ZlxcdTAwYWRcXHUwNjAwLVxcdTA2MDRcXHUwNzBmXFx1MTdiNFxcdTE3YjVcXHUyMDBjLVxcdTIwMGZcXHUyMDI4LVxcdTIwMmZcXHUyMDYwLVxcdTIwNmZcXHVmZWZmXFx1ZmZmMC1cXHVmZmZmXS9nLGdhcCxpbmRlbnQsbWV0YT17XCJcXGJcIjpcIlxcXFxiXCIsXCJcXHRcIjpcIlxcXFx0XCIsXCJcXG5cIjpcIlxcXFxuXCIsXCJcXGZcIjpcIlxcXFxmXCIsXCJcXHJcIjpcIlxcXFxyXCIsJ1wiJzonXFxcXFwiJyxcIlxcXFxcIjpcIlxcXFxcXFxcXCJ9LHJlcDt0eXBlb2YgSlNPTi5zdHJpbmdpZnkhPVwiZnVuY3Rpb25cIiYmKEpTT04uc3RyaW5naWZ5PWZ1bmN0aW9uKGEsYixjKXt2YXIgZDtnYXA9XCJcIixpbmRlbnQ9XCJcIjtpZih0eXBlb2YgYz09XCJudW1iZXJcIilmb3IoZD0wO2Q8YztkKz0xKWluZGVudCs9XCIgXCI7ZWxzZSB0eXBlb2YgYz09XCJzdHJpbmdcIiYmKGluZGVudD1jKTtyZXA9YjtpZighYnx8dHlwZW9mIGI9PVwiZnVuY3Rpb25cInx8dHlwZW9mIGI9PVwib2JqZWN0XCImJnR5cGVvZiBiLmxlbmd0aD09XCJudW1iZXJcIilyZXR1cm4gc3RyKFwiXCIse1wiXCI6YX0pO3Rocm93IG5ldyBFcnJvcihcIkpTT04uc3RyaW5naWZ5XCIpfSksdHlwZW9mIEpTT04ucGFyc2UhPVwiZnVuY3Rpb25cIiYmKEpTT04ucGFyc2U9ZnVuY3Rpb24odGV4dCxyZXZpdmVyKXtmdW5jdGlvbiB3YWxrKGEsYil7dmFyIGMsZCxlPWFbYl07aWYoZSYmdHlwZW9mIGU9PVwib2JqZWN0XCIpZm9yKGMgaW4gZSlPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZSxjKSYmKGQ9d2FsayhlLGMpLGQhPT11bmRlZmluZWQ/ZVtjXT1kOmRlbGV0ZSBlW2NdKTtyZXR1cm4gcmV2aXZlci5jYWxsKGEsYixlKX12YXIgajt0ZXh0PVN0cmluZyh0ZXh0KSxjeC5sYXN0SW5kZXg9MCxjeC50ZXN0KHRleHQpJiYodGV4dD10ZXh0LnJlcGxhY2UoY3gsZnVuY3Rpb24oYSl7cmV0dXJuXCJcXFxcdVwiKyhcIjAwMDBcIithLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCl9KSk7aWYoL15bXFxdLDp7fVxcc10qJC8udGVzdCh0ZXh0LnJlcGxhY2UoL1xcXFwoPzpbXCJcXFxcXFwvYmZucnRdfHVbMC05YS1mQS1GXXs0fSkvZyxcIkBcIikucmVwbGFjZSgvXCJbXlwiXFxcXFxcblxccl0qXCJ8dHJ1ZXxmYWxzZXxudWxsfC0/XFxkKyg/OlxcLlxcZCopPyg/OltlRV1bK1xcLV0/XFxkKyk/L2csXCJdXCIpLnJlcGxhY2UoLyg/Ol58OnwsKSg/OlxccypcXFspKy9nLFwiXCIpKSl7aj1ldmFsKFwiKFwiK3RleHQrXCIpXCIpO3JldHVybiB0eXBlb2YgcmV2aXZlcj09XCJmdW5jdGlvblwiP3dhbGsoe1wiXCI6an0sXCJcIik6an10aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJKU09OLnBhcnNlXCIpfSl9KClcblxuXG4vLyAgICAgWypdIEluY2x1ZGluZyBsaWIvaW5kZXguanNcbi8vIFB1YmxpYyBvYmplY3RcbnZhciBTb2NrSlMgPSAoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgdmFyIF9kb2N1bWVudCA9IGRvY3VtZW50O1xuICAgICAgICAgICAgICB2YXIgX3dpbmRvdyA9IHdpbmRvdztcbiAgICAgICAgICAgICAgdmFyIHV0aWxzID0ge307XG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi9yZXZlbnR0YXJnZXQuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbi8qIFNpbXBsaWZpZWQgaW1wbGVtZW50YXRpb24gb2YgRE9NMiBFdmVudFRhcmdldC5cbiAqICAgaHR0cDovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTItRXZlbnRzL2V2ZW50cy5odG1sI0V2ZW50cy1FdmVudFRhcmdldFxuICovXG52YXIgUkV2ZW50VGFyZ2V0ID0gZnVuY3Rpb24oKSB7fTtcblJFdmVudFRhcmdldC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGxpc3RlbmVyKSB7XG4gICAgaWYoIXRoaXMuX2xpc3RlbmVycykge1xuICAgICAgICAgdGhpcy5fbGlzdGVuZXJzID0ge307XG4gICAgfVxuICAgIGlmKCEoZXZlbnRUeXBlIGluIHRoaXMuX2xpc3RlbmVycykpIHtcbiAgICAgICAgdGhpcy5fbGlzdGVuZXJzW2V2ZW50VHlwZV0gPSBbXTtcbiAgICB9XG4gICAgdmFyIGFyciA9IHRoaXMuX2xpc3RlbmVyc1tldmVudFR5cGVdO1xuICAgIGlmKHV0aWxzLmFyckluZGV4T2YoYXJyLCBsaXN0ZW5lcikgPT09IC0xKSB7XG4gICAgICAgIGFyci5wdXNoKGxpc3RlbmVyKTtcbiAgICB9XG4gICAgcmV0dXJuO1xufTtcblxuUkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICBpZighKHRoaXMuX2xpc3RlbmVycyAmJiAoZXZlbnRUeXBlIGluIHRoaXMuX2xpc3RlbmVycykpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGFyciA9IHRoaXMuX2xpc3RlbmVyc1tldmVudFR5cGVdO1xuICAgIHZhciBpZHggPSB1dGlscy5hcnJJbmRleE9mKGFyciwgbGlzdGVuZXIpO1xuICAgIGlmIChpZHggIT09IC0xKSB7XG4gICAgICAgIGlmKGFyci5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aGlzLl9saXN0ZW5lcnNbZXZlbnRUeXBlXSA9IGFyci5zbGljZSgwLCBpZHgpLmNvbmNhdCggYXJyLnNsaWNlKGlkeCsxKSApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2xpc3RlbmVyc1tldmVudFR5cGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuO1xufTtcblxuUkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIHQgPSBldmVudC50eXBlO1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICBpZiAodGhpc1snb24nK3RdKSB7XG4gICAgICAgIHRoaXNbJ29uJyt0XS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2xpc3RlbmVycyAmJiB0IGluIHRoaXMuX2xpc3RlbmVycykge1xuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IHRoaXMuX2xpc3RlbmVyc1t0XS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5fbGlzdGVuZXJzW3RdW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgfVxufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvcmV2ZW50dGFyZ2V0LmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi9zaW1wbGVldmVudC5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIFNpbXBsZUV2ZW50ID0gZnVuY3Rpb24odHlwZSwgb2JqKSB7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICBpZiAodHlwZW9mIG9iaiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZm9yKHZhciBrIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoaykpIGNvbnRpbnVlO1xuICAgICAgICAgICAgdGhpc1trXSA9IG9ialtrXTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblNpbXBsZUV2ZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByID0gW107XG4gICAgZm9yKHZhciBrIGluIHRoaXMpIHtcbiAgICAgICAgaWYgKCF0aGlzLmhhc093blByb3BlcnR5KGspKSBjb250aW51ZTtcbiAgICAgICAgdmFyIHYgPSB0aGlzW2tdO1xuICAgICAgICBpZiAodHlwZW9mIHYgPT09ICdmdW5jdGlvbicpIHYgPSAnW2Z1bmN0aW9uXSc7XG4gICAgICAgIHIucHVzaChrICsgJz0nICsgdik7XG4gICAgfVxuICAgIHJldHVybiAnU2ltcGxlRXZlbnQoJyArIHIuam9pbignLCAnKSArICcpJztcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3NpbXBsZWV2ZW50LmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi9ldmVudGVtaXR0ZXIuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBFdmVudEVtaXR0ZXIgPSBmdW5jdGlvbihldmVudHMpIHtcbiAgICB0aGlzLmV2ZW50cyA9IGV2ZW50cyB8fCBbXTtcbn07XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBpZiAoIXRoYXQubnVrZWQgJiYgdGhhdFsnb24nK3R5cGVdKSB7XG4gICAgICAgIHRoYXRbJ29uJyt0eXBlXS5hcHBseSh0aGF0LCBhcmdzKTtcbiAgICB9XG4gICAgaWYgKHV0aWxzLmFyckluZGV4T2YodGhhdC5ldmVudHMsIHR5cGUpID09PSAtMSkge1xuICAgICAgICB1dGlscy5sb2coJ0V2ZW50ICcgKyBKU09OLnN0cmluZ2lmeSh0eXBlKSArXG4gICAgICAgICAgICAgICAgICAnIG5vdCBsaXN0ZWQgJyArIEpTT04uc3RyaW5naWZ5KHRoYXQuZXZlbnRzKSArXG4gICAgICAgICAgICAgICAgICAnIGluICcgKyB0aGF0KTtcbiAgICB9XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm51a2UgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQubnVrZWQgPSB0cnVlO1xuICAgIGZvcih2YXIgaT0wOyBpPHRoYXQuZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGRlbGV0ZSB0aGF0W3RoYXQuZXZlbnRzW2ldXTtcbiAgICB9XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9ldmVudGVtaXR0ZXIuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3V0aWxzLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgcmFuZG9tX3N0cmluZ19jaGFycyA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlfJztcbnV0aWxzLnJhbmRvbV9zdHJpbmcgPSBmdW5jdGlvbihsZW5ndGgsIG1heCkge1xuICAgIG1heCA9IG1heCB8fCByYW5kb21fc3RyaW5nX2NoYXJzLmxlbmd0aDtcbiAgICB2YXIgaSwgcmV0ID0gW107XG4gICAgZm9yKGk9MDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJldC5wdXNoKCByYW5kb21fc3RyaW5nX2NoYXJzLnN1YnN0cihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpLDEpICk7XG4gICAgfVxuICAgIHJldHVybiByZXQuam9pbignJyk7XG59O1xudXRpbHMucmFuZG9tX251bWJlciA9IGZ1bmN0aW9uKG1heCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xufTtcbnV0aWxzLnJhbmRvbV9udW1iZXJfc3RyaW5nID0gZnVuY3Rpb24obWF4KSB7XG4gICAgdmFyIHQgPSAoJycrKG1heCAtIDEpKS5sZW5ndGg7XG4gICAgdmFyIHAgPSBBcnJheSh0KzEpLmpvaW4oJzAnKTtcbiAgICByZXR1cm4gKHAgKyB1dGlscy5yYW5kb21fbnVtYmVyKG1heCkpLnNsaWNlKC10KTtcbn07XG5cbi8vIEFzc3VtaW5nIHRoYXQgdXJsIGxvb2tzIGxpa2U6IGh0dHA6Ly9hc2Rhc2Q6MTExL2FzZFxudXRpbHMuZ2V0T3JpZ2luID0gZnVuY3Rpb24odXJsKSB7XG4gICAgdXJsICs9ICcvJztcbiAgICB2YXIgcGFydHMgPSB1cmwuc3BsaXQoJy8nKS5zbGljZSgwLCAzKTtcbiAgICByZXR1cm4gcGFydHMuam9pbignLycpO1xufTtcblxudXRpbHMuaXNTYW1lT3JpZ2luVXJsID0gZnVuY3Rpb24odXJsX2EsIHVybF9iKSB7XG4gICAgLy8gbG9jYXRpb24ub3JpZ2luIHdvdWxkIGRvLCBidXQgaXQncyBub3QgYWx3YXlzIGF2YWlsYWJsZS5cbiAgICBpZiAoIXVybF9iKSB1cmxfYiA9IF93aW5kb3cubG9jYXRpb24uaHJlZjtcblxuICAgIHJldHVybiAodXJsX2Euc3BsaXQoJy8nKS5zbGljZSgwLDMpLmpvaW4oJy8nKVxuICAgICAgICAgICAgICAgID09PVxuICAgICAgICAgICAgdXJsX2Iuc3BsaXQoJy8nKS5zbGljZSgwLDMpLmpvaW4oJy8nKSk7XG59O1xuXG51dGlscy5nZXRQYXJlbnREb21haW4gPSBmdW5jdGlvbih1cmwpIHtcbiAgICAvLyBpcHY0IGlwIGFkZHJlc3NcbiAgICBpZiAoL15bMC05Ll0qJC8udGVzdCh1cmwpKSByZXR1cm4gdXJsO1xuICAgIC8vIGlwdjYgaXAgYWRkcmVzc1xuICAgIGlmICgvXlxcWy8udGVzdCh1cmwpKSByZXR1cm4gdXJsO1xuICAgIC8vIG5vIGRvdHNcbiAgICBpZiAoISgvWy5dLy50ZXN0KHVybCkpKSByZXR1cm4gdXJsO1xuXG4gICAgdmFyIHBhcnRzID0gdXJsLnNwbGl0KCcuJykuc2xpY2UoMSk7XG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oJy4nKTtcbn07XG5cbnV0aWxzLm9iamVjdEV4dGVuZCA9IGZ1bmN0aW9uKGRzdCwgc3JjKSB7XG4gICAgZm9yKHZhciBrIGluIHNyYykge1xuICAgICAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICBkc3Rba10gPSBzcmNba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRzdDtcbn07XG5cbnZhciBXUHJlZml4ID0gJ19qcCc7XG5cbnV0aWxzLnBvbGx1dGVHbG9iYWxOYW1lc3BhY2UgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIShXUHJlZml4IGluIF93aW5kb3cpKSB7XG4gICAgICAgIF93aW5kb3dbV1ByZWZpeF0gPSB7fTtcbiAgICB9XG59O1xuXG51dGlscy5jbG9zZUZyYW1lID0gZnVuY3Rpb24gKGNvZGUsIHJlYXNvbikge1xuICAgIHJldHVybiAnYycrSlNPTi5zdHJpbmdpZnkoW2NvZGUsIHJlYXNvbl0pO1xufTtcblxudXRpbHMudXNlclNldENvZGUgPSBmdW5jdGlvbiAoY29kZSkge1xuICAgIHJldHVybiBjb2RlID09PSAxMDAwIHx8IChjb2RlID49IDMwMDAgJiYgY29kZSA8PSA0OTk5KTtcbn07XG5cbi8vIFNlZTogaHR0cDovL3d3dy5lcmcuYWJkbi5hYy51ay9+Z2Vycml0L2RjY3Avbm90ZXMvY2NpZDIvcnRvX2VzdGltYXRvci9cbi8vIGFuZCBSRkMgMjk4OC5cbnV0aWxzLmNvdW50UlRPID0gZnVuY3Rpb24gKHJ0dCkge1xuICAgIHZhciBydG87XG4gICAgaWYgKHJ0dCA+IDEwMCkge1xuICAgICAgICBydG8gPSAzICogcnR0OyAvLyBydG8gPiAzMDBtc2VjXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcnRvID0gcnR0ICsgMjAwOyAvLyAyMDBtc2VjIDwgcnRvIDw9IDMwMG1zZWNcbiAgICB9XG4gICAgcmV0dXJuIHJ0bztcbn1cblxudXRpbHMubG9nID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKF93aW5kb3cuY29uc29sZSAmJiBjb25zb2xlLmxvZyAmJiBjb25zb2xlLmxvZy5hcHBseSkge1xuICAgICAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpO1xuICAgIH1cbn07XG5cbnV0aWxzLmJpbmQgPSBmdW5jdGlvbihmdW4sIHRoYXQpIHtcbiAgICBpZiAoZnVuLmJpbmQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bi5iaW5kKHRoYXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkodGhhdCwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG51dGlscy5mbGF0VXJsID0gZnVuY3Rpb24odXJsKSB7XG4gICAgcmV0dXJuIHVybC5pbmRleE9mKCc/JykgPT09IC0xICYmIHVybC5pbmRleE9mKCcjJykgPT09IC0xO1xufTtcblxudXRpbHMuYW1lbmRVcmwgPSBmdW5jdGlvbih1cmwpIHtcbiAgICB2YXIgZGwgPSBfZG9jdW1lbnQubG9jYXRpb247XG4gICAgaWYgKCF1cmwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXcm9uZyB1cmwgZm9yIFNvY2tKUycpO1xuICAgIH1cbiAgICBpZiAoIXV0aWxzLmZsYXRVcmwodXJsKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgYmFzaWMgdXJscyBhcmUgc3VwcG9ydGVkIGluIFNvY2tKUycpO1xuICAgIH1cblxuICAgIC8vICAnLy9hYmMnIC0tPiAnaHR0cDovL2FiYydcbiAgICBpZiAodXJsLmluZGV4T2YoJy8vJykgPT09IDApIHtcbiAgICAgICAgdXJsID0gZGwucHJvdG9jb2wgKyB1cmw7XG4gICAgfVxuICAgIC8vICcvYWJjJyAtLT4gJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAvYWJjJ1xuICAgIGlmICh1cmwuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgIHVybCA9IGRsLnByb3RvY29sICsgJy8vJyArIGRsLmhvc3QgKyB1cmw7XG4gICAgfVxuICAgIC8vIHN0cmlwIHRyYWlsaW5nIHNsYXNoZXNcbiAgICB1cmwgPSB1cmwucmVwbGFjZSgvWy9dKyQvLCcnKTtcbiAgICByZXR1cm4gdXJsO1xufTtcblxuLy8gSUUgZG9lc24ndCBzdXBwb3J0IFtdLmluZGV4T2YuXG51dGlscy5hcnJJbmRleE9mID0gZnVuY3Rpb24oYXJyLCBvYmope1xuICAgIGZvcih2YXIgaT0wOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgaWYoYXJyW2ldID09PSBvYmope1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufTtcblxudXRpbHMuYXJyU2tpcCA9IGZ1bmN0aW9uKGFyciwgb2JqKSB7XG4gICAgdmFyIGlkeCA9IHV0aWxzLmFyckluZGV4T2YoYXJyLCBvYmopO1xuICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICAgIHJldHVybiBhcnIuc2xpY2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZHN0ID0gYXJyLnNsaWNlKDAsIGlkeCk7XG4gICAgICAgIHJldHVybiBkc3QuY29uY2F0KGFyci5zbGljZShpZHgrMSkpO1xuICAgIH1cbn07XG5cbi8vIFZpYTogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vMTEzMzEyMi8yMTIxYzYwMWM1NTQ5MTU1NDgzZjUwYmUzZGE1MzA1ZTgzYjhjNWRmXG51dGlscy5pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB7fS50b1N0cmluZy5jYWxsKHZhbHVlKS5pbmRleE9mKCdBcnJheScpID49IDBcbn07XG5cbnV0aWxzLmRlbGF5ID0gZnVuY3Rpb24odCwgZnVuKSB7XG4gICAgaWYodHlwZW9mIHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZnVuID0gdDtcbiAgICAgICAgdCA9IDA7XG4gICAgfVxuICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgdCk7XG59O1xuXG5cbi8vIENoYXJzIHdvcnRoIGVzY2FwaW5nLCBhcyBkZWZpbmVkIGJ5IERvdWdsYXMgQ3JvY2tmb3JkOlxuLy8gICBodHRwczovL2dpdGh1Yi5jb20vZG91Z2xhc2Nyb2NrZm9yZC9KU09OLWpzL2Jsb2IvNDdhOTg4MmNkZGViMWU4NTI5ZTA3YWY5NzM2MjE4MDc1MzcyYjhhYy9qc29uMi5qcyNMMTk2XG52YXIganNvbl9lc2NhcGFibGUgPSAvW1xcXFxcXFwiXFx4MDAtXFx4MWZcXHg3Zi1cXHg5ZlxcdTAwYWRcXHUwNjAwLVxcdTA2MDRcXHUwNzBmXFx1MTdiNFxcdTE3YjVcXHUyMDBjLVxcdTIwMGZcXHUyMDI4LVxcdTIwMmZcXHUyMDYwLVxcdTIwNmZcXHVmZWZmXFx1ZmZmMC1cXHVmZmZmXS9nLFxuICAgIGpzb25fbG9va3VwID0ge1xuXCJcXHUwMDAwXCI6XCJcXFxcdTAwMDBcIixcIlxcdTAwMDFcIjpcIlxcXFx1MDAwMVwiLFwiXFx1MDAwMlwiOlwiXFxcXHUwMDAyXCIsXCJcXHUwMDAzXCI6XCJcXFxcdTAwMDNcIixcblwiXFx1MDAwNFwiOlwiXFxcXHUwMDA0XCIsXCJcXHUwMDA1XCI6XCJcXFxcdTAwMDVcIixcIlxcdTAwMDZcIjpcIlxcXFx1MDAwNlwiLFwiXFx1MDAwN1wiOlwiXFxcXHUwMDA3XCIsXG5cIlxcYlwiOlwiXFxcXGJcIixcIlxcdFwiOlwiXFxcXHRcIixcIlxcblwiOlwiXFxcXG5cIixcIlxcdTAwMGJcIjpcIlxcXFx1MDAwYlwiLFwiXFxmXCI6XCJcXFxcZlwiLFwiXFxyXCI6XCJcXFxcclwiLFxuXCJcXHUwMDBlXCI6XCJcXFxcdTAwMGVcIixcIlxcdTAwMGZcIjpcIlxcXFx1MDAwZlwiLFwiXFx1MDAxMFwiOlwiXFxcXHUwMDEwXCIsXCJcXHUwMDExXCI6XCJcXFxcdTAwMTFcIixcblwiXFx1MDAxMlwiOlwiXFxcXHUwMDEyXCIsXCJcXHUwMDEzXCI6XCJcXFxcdTAwMTNcIixcIlxcdTAwMTRcIjpcIlxcXFx1MDAxNFwiLFwiXFx1MDAxNVwiOlwiXFxcXHUwMDE1XCIsXG5cIlxcdTAwMTZcIjpcIlxcXFx1MDAxNlwiLFwiXFx1MDAxN1wiOlwiXFxcXHUwMDE3XCIsXCJcXHUwMDE4XCI6XCJcXFxcdTAwMThcIixcIlxcdTAwMTlcIjpcIlxcXFx1MDAxOVwiLFxuXCJcXHUwMDFhXCI6XCJcXFxcdTAwMWFcIixcIlxcdTAwMWJcIjpcIlxcXFx1MDAxYlwiLFwiXFx1MDAxY1wiOlwiXFxcXHUwMDFjXCIsXCJcXHUwMDFkXCI6XCJcXFxcdTAwMWRcIixcblwiXFx1MDAxZVwiOlwiXFxcXHUwMDFlXCIsXCJcXHUwMDFmXCI6XCJcXFxcdTAwMWZcIixcIlxcXCJcIjpcIlxcXFxcXFwiXCIsXCJcXFxcXCI6XCJcXFxcXFxcXFwiLFxuXCJcXHUwMDdmXCI6XCJcXFxcdTAwN2ZcIixcIlxcdTAwODBcIjpcIlxcXFx1MDA4MFwiLFwiXFx1MDA4MVwiOlwiXFxcXHUwMDgxXCIsXCJcXHUwMDgyXCI6XCJcXFxcdTAwODJcIixcblwiXFx1MDA4M1wiOlwiXFxcXHUwMDgzXCIsXCJcXHUwMDg0XCI6XCJcXFxcdTAwODRcIixcIlxcdTAwODVcIjpcIlxcXFx1MDA4NVwiLFwiXFx1MDA4NlwiOlwiXFxcXHUwMDg2XCIsXG5cIlxcdTAwODdcIjpcIlxcXFx1MDA4N1wiLFwiXFx1MDA4OFwiOlwiXFxcXHUwMDg4XCIsXCJcXHUwMDg5XCI6XCJcXFxcdTAwODlcIixcIlxcdTAwOGFcIjpcIlxcXFx1MDA4YVwiLFxuXCJcXHUwMDhiXCI6XCJcXFxcdTAwOGJcIixcIlxcdTAwOGNcIjpcIlxcXFx1MDA4Y1wiLFwiXFx1MDA4ZFwiOlwiXFxcXHUwMDhkXCIsXCJcXHUwMDhlXCI6XCJcXFxcdTAwOGVcIixcblwiXFx1MDA4ZlwiOlwiXFxcXHUwMDhmXCIsXCJcXHUwMDkwXCI6XCJcXFxcdTAwOTBcIixcIlxcdTAwOTFcIjpcIlxcXFx1MDA5MVwiLFwiXFx1MDA5MlwiOlwiXFxcXHUwMDkyXCIsXG5cIlxcdTAwOTNcIjpcIlxcXFx1MDA5M1wiLFwiXFx1MDA5NFwiOlwiXFxcXHUwMDk0XCIsXCJcXHUwMDk1XCI6XCJcXFxcdTAwOTVcIixcIlxcdTAwOTZcIjpcIlxcXFx1MDA5NlwiLFxuXCJcXHUwMDk3XCI6XCJcXFxcdTAwOTdcIixcIlxcdTAwOThcIjpcIlxcXFx1MDA5OFwiLFwiXFx1MDA5OVwiOlwiXFxcXHUwMDk5XCIsXCJcXHUwMDlhXCI6XCJcXFxcdTAwOWFcIixcblwiXFx1MDA5YlwiOlwiXFxcXHUwMDliXCIsXCJcXHUwMDljXCI6XCJcXFxcdTAwOWNcIixcIlxcdTAwOWRcIjpcIlxcXFx1MDA5ZFwiLFwiXFx1MDA5ZVwiOlwiXFxcXHUwMDllXCIsXG5cIlxcdTAwOWZcIjpcIlxcXFx1MDA5ZlwiLFwiXFx1MDBhZFwiOlwiXFxcXHUwMGFkXCIsXCJcXHUwNjAwXCI6XCJcXFxcdTA2MDBcIixcIlxcdTA2MDFcIjpcIlxcXFx1MDYwMVwiLFxuXCJcXHUwNjAyXCI6XCJcXFxcdTA2MDJcIixcIlxcdTA2MDNcIjpcIlxcXFx1MDYwM1wiLFwiXFx1MDYwNFwiOlwiXFxcXHUwNjA0XCIsXCJcXHUwNzBmXCI6XCJcXFxcdTA3MGZcIixcblwiXFx1MTdiNFwiOlwiXFxcXHUxN2I0XCIsXCJcXHUxN2I1XCI6XCJcXFxcdTE3YjVcIixcIlxcdTIwMGNcIjpcIlxcXFx1MjAwY1wiLFwiXFx1MjAwZFwiOlwiXFxcXHUyMDBkXCIsXG5cIlxcdTIwMGVcIjpcIlxcXFx1MjAwZVwiLFwiXFx1MjAwZlwiOlwiXFxcXHUyMDBmXCIsXCJcXHUyMDI4XCI6XCJcXFxcdTIwMjhcIixcIlxcdTIwMjlcIjpcIlxcXFx1MjAyOVwiLFxuXCJcXHUyMDJhXCI6XCJcXFxcdTIwMmFcIixcIlxcdTIwMmJcIjpcIlxcXFx1MjAyYlwiLFwiXFx1MjAyY1wiOlwiXFxcXHUyMDJjXCIsXCJcXHUyMDJkXCI6XCJcXFxcdTIwMmRcIixcblwiXFx1MjAyZVwiOlwiXFxcXHUyMDJlXCIsXCJcXHUyMDJmXCI6XCJcXFxcdTIwMmZcIixcIlxcdTIwNjBcIjpcIlxcXFx1MjA2MFwiLFwiXFx1MjA2MVwiOlwiXFxcXHUyMDYxXCIsXG5cIlxcdTIwNjJcIjpcIlxcXFx1MjA2MlwiLFwiXFx1MjA2M1wiOlwiXFxcXHUyMDYzXCIsXCJcXHUyMDY0XCI6XCJcXFxcdTIwNjRcIixcIlxcdTIwNjVcIjpcIlxcXFx1MjA2NVwiLFxuXCJcXHUyMDY2XCI6XCJcXFxcdTIwNjZcIixcIlxcdTIwNjdcIjpcIlxcXFx1MjA2N1wiLFwiXFx1MjA2OFwiOlwiXFxcXHUyMDY4XCIsXCJcXHUyMDY5XCI6XCJcXFxcdTIwNjlcIixcblwiXFx1MjA2YVwiOlwiXFxcXHUyMDZhXCIsXCJcXHUyMDZiXCI6XCJcXFxcdTIwNmJcIixcIlxcdTIwNmNcIjpcIlxcXFx1MjA2Y1wiLFwiXFx1MjA2ZFwiOlwiXFxcXHUyMDZkXCIsXG5cIlxcdTIwNmVcIjpcIlxcXFx1MjA2ZVwiLFwiXFx1MjA2ZlwiOlwiXFxcXHUyMDZmXCIsXCJcXHVmZWZmXCI6XCJcXFxcdWZlZmZcIixcIlxcdWZmZjBcIjpcIlxcXFx1ZmZmMFwiLFxuXCJcXHVmZmYxXCI6XCJcXFxcdWZmZjFcIixcIlxcdWZmZjJcIjpcIlxcXFx1ZmZmMlwiLFwiXFx1ZmZmM1wiOlwiXFxcXHVmZmYzXCIsXCJcXHVmZmY0XCI6XCJcXFxcdWZmZjRcIixcblwiXFx1ZmZmNVwiOlwiXFxcXHVmZmY1XCIsXCJcXHVmZmY2XCI6XCJcXFxcdWZmZjZcIixcIlxcdWZmZjdcIjpcIlxcXFx1ZmZmN1wiLFwiXFx1ZmZmOFwiOlwiXFxcXHVmZmY4XCIsXG5cIlxcdWZmZjlcIjpcIlxcXFx1ZmZmOVwiLFwiXFx1ZmZmYVwiOlwiXFxcXHVmZmZhXCIsXCJcXHVmZmZiXCI6XCJcXFxcdWZmZmJcIixcIlxcdWZmZmNcIjpcIlxcXFx1ZmZmY1wiLFxuXCJcXHVmZmZkXCI6XCJcXFxcdWZmZmRcIixcIlxcdWZmZmVcIjpcIlxcXFx1ZmZmZVwiLFwiXFx1ZmZmZlwiOlwiXFxcXHVmZmZmXCJ9O1xuXG4vLyBTb21lIGV4dHJhIGNoYXJhY3RlcnMgdGhhdCBDaHJvbWUgZ2V0cyB3cm9uZywgYW5kIHN1YnN0aXR1dGVzIHdpdGhcbi8vIHNvbWV0aGluZyBlbHNlIG9uIHRoZSB3aXJlLlxudmFyIGV4dHJhX2VzY2FwYWJsZSA9IC9bXFx4MDAtXFx4MWZcXHVkODAwLVxcdWRmZmZcXHVmZmZlXFx1ZmZmZlxcdTAzMDAtXFx1MDMzM1xcdTAzM2QtXFx1MDM0NlxcdTAzNGEtXFx1MDM0Y1xcdTAzNTAtXFx1MDM1MlxcdTAzNTctXFx1MDM1OFxcdTAzNWMtXFx1MDM2MlxcdTAzNzRcXHUwMzdlXFx1MDM4N1xcdTA1OTEtXFx1MDVhZlxcdTA1YzRcXHUwNjEwLVxcdTA2MTdcXHUwNjUzLVxcdTA2NTRcXHUwNjU3LVxcdTA2NWJcXHUwNjVkLVxcdTA2NWVcXHUwNmRmLVxcdTA2ZTJcXHUwNmViLVxcdTA2ZWNcXHUwNzMwXFx1MDczMi1cXHUwNzMzXFx1MDczNS1cXHUwNzM2XFx1MDczYVxcdTA3M2RcXHUwNzNmLVxcdTA3NDFcXHUwNzQzXFx1MDc0NVxcdTA3NDdcXHUwN2ViLVxcdTA3ZjFcXHUwOTUxXFx1MDk1OC1cXHUwOTVmXFx1MDlkYy1cXHUwOWRkXFx1MDlkZlxcdTBhMzNcXHUwYTM2XFx1MGE1OS1cXHUwYTViXFx1MGE1ZVxcdTBiNWMtXFx1MGI1ZFxcdTBlMzgtXFx1MGUzOVxcdTBmNDNcXHUwZjRkXFx1MGY1MlxcdTBmNTdcXHUwZjVjXFx1MGY2OVxcdTBmNzItXFx1MGY3NlxcdTBmNzhcXHUwZjgwLVxcdTBmODNcXHUwZjkzXFx1MGY5ZFxcdTBmYTJcXHUwZmE3XFx1MGZhY1xcdTBmYjlcXHUxOTM5LVxcdTE5M2FcXHUxYTE3XFx1MWI2YlxcdTFjZGEtXFx1MWNkYlxcdTFkYzAtXFx1MWRjZlxcdTFkZmNcXHUxZGZlXFx1MWY3MVxcdTFmNzNcXHUxZjc1XFx1MWY3N1xcdTFmNzlcXHUxZjdiXFx1MWY3ZFxcdTFmYmJcXHUxZmJlXFx1MWZjOVxcdTFmY2JcXHUxZmQzXFx1MWZkYlxcdTFmZTNcXHUxZmViXFx1MWZlZS1cXHUxZmVmXFx1MWZmOVxcdTFmZmJcXHUxZmZkXFx1MjAwMC1cXHUyMDAxXFx1MjBkMC1cXHUyMGQxXFx1MjBkNC1cXHUyMGQ3XFx1MjBlNy1cXHUyMGU5XFx1MjEyNlxcdTIxMmEtXFx1MjEyYlxcdTIzMjktXFx1MjMyYVxcdTJhZGNcXHUzMDJiLVxcdTMwMmNcXHVhYWIyLVxcdWFhYjNcXHVmOTAwLVxcdWZhMGRcXHVmYTEwXFx1ZmExMlxcdWZhMTUtXFx1ZmExZVxcdWZhMjBcXHVmYTIyXFx1ZmEyNS1cXHVmYTI2XFx1ZmEyYS1cXHVmYTJkXFx1ZmEzMC1cXHVmYTZkXFx1ZmE3MC1cXHVmYWQ5XFx1ZmIxZFxcdWZiMWZcXHVmYjJhLVxcdWZiMzZcXHVmYjM4LVxcdWZiM2NcXHVmYjNlXFx1ZmI0MC1cXHVmYjQxXFx1ZmI0My1cXHVmYjQ0XFx1ZmI0Ni1cXHVmYjRlXFx1ZmZmMC1cXHVmZmZmXS9nLFxuICAgIGV4dHJhX2xvb2t1cDtcblxuLy8gSlNPTiBRdW90ZSBzdHJpbmcuIFVzZSBuYXRpdmUgaW1wbGVtZW50YXRpb24gd2hlbiBwb3NzaWJsZS5cbnZhciBKU09OUXVvdGUgPSAoSlNPTiAmJiBKU09OLnN0cmluZ2lmeSkgfHwgZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAganNvbl9lc2NhcGFibGUubGFzdEluZGV4ID0gMDtcbiAgICBpZiAoanNvbl9lc2NhcGFibGUudGVzdChzdHJpbmcpKSB7XG4gICAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKGpzb25fZXNjYXBhYmxlLCBmdW5jdGlvbihhKSB7XG4gICAgICAgICAgICByZXR1cm4ganNvbl9sb29rdXBbYV07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gJ1wiJyArIHN0cmluZyArICdcIic7XG59O1xuXG4vLyBUaGlzIG1heSBiZSBxdWl0ZSBzbG93LCBzbyBsZXQncyBkZWxheSB1bnRpbCB1c2VyIGFjdHVhbGx5IHVzZXMgYmFkXG4vLyBjaGFyYWN0ZXJzLlxudmFyIHVucm9sbF9sb29rdXAgPSBmdW5jdGlvbihlc2NhcGFibGUpIHtcbiAgICB2YXIgaTtcbiAgICB2YXIgdW5yb2xsZWQgPSB7fVxuICAgIHZhciBjID0gW11cbiAgICBmb3IoaT0wOyBpPDY1NTM2OyBpKyspIHtcbiAgICAgICAgYy5wdXNoKCBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpICk7XG4gICAgfVxuICAgIGVzY2FwYWJsZS5sYXN0SW5kZXggPSAwO1xuICAgIGMuam9pbignJykucmVwbGFjZShlc2NhcGFibGUsIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgIHVucm9sbGVkWyBhIF0gPSAnXFxcXHUnICsgKCcwMDAwJyArIGEuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikpLnNsaWNlKC00KTtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH0pO1xuICAgIGVzY2FwYWJsZS5sYXN0SW5kZXggPSAwO1xuICAgIHJldHVybiB1bnJvbGxlZDtcbn07XG5cbi8vIFF1b3RlIHN0cmluZywgYWxzbyB0YWtpbmcgY2FyZSBvZiB1bmljb2RlIGNoYXJhY3RlcnMgdGhhdCBicm93c2Vyc1xuLy8gb2Z0ZW4gYnJlYWsuIEVzcGVjaWFsbHksIHRha2UgY2FyZSBvZiB1bmljb2RlIHN1cnJvZ2F0ZXM6XG4vLyAgICBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01hcHBpbmdfb2ZfVW5pY29kZV9jaGFyYWN0ZXJzI1N1cnJvZ2F0ZXNcbnV0aWxzLnF1b3RlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdmFyIHF1b3RlZCA9IEpTT05RdW90ZShzdHJpbmcpO1xuXG4gICAgLy8gSW4gbW9zdCBjYXNlcyB0aGlzIHNob3VsZCBiZSB2ZXJ5IGZhc3QgYW5kIGdvb2QgZW5vdWdoLlxuICAgIGV4dHJhX2VzY2FwYWJsZS5sYXN0SW5kZXggPSAwO1xuICAgIGlmKCFleHRyYV9lc2NhcGFibGUudGVzdChxdW90ZWQpKSB7XG4gICAgICAgIHJldHVybiBxdW90ZWQ7XG4gICAgfVxuXG4gICAgaWYoIWV4dHJhX2xvb2t1cCkgZXh0cmFfbG9va3VwID0gdW5yb2xsX2xvb2t1cChleHRyYV9lc2NhcGFibGUpO1xuXG4gICAgcmV0dXJuIHF1b3RlZC5yZXBsYWNlKGV4dHJhX2VzY2FwYWJsZSwgZnVuY3Rpb24oYSkge1xuICAgICAgICByZXR1cm4gZXh0cmFfbG9va3VwW2FdO1xuICAgIH0pO1xufVxuXG52YXIgX2FsbF9wcm90b2NvbHMgPSBbJ3dlYnNvY2tldCcsXG4gICAgICAgICAgICAgICAgICAgICAgJ3hkci1zdHJlYW1pbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICd4aHItc3RyZWFtaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAnaWZyYW1lLWV2ZW50c291cmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAnaWZyYW1lLWh0bWxmaWxlJyxcbiAgICAgICAgICAgICAgICAgICAgICAneGRyLXBvbGxpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICd4aHItcG9sbGluZycsXG4gICAgICAgICAgICAgICAgICAgICAgJ2lmcmFtZS14aHItcG9sbGluZycsXG4gICAgICAgICAgICAgICAgICAgICAgJ2pzb25wLXBvbGxpbmcnXTtcblxudXRpbHMucHJvYmVQcm90b2NvbHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJvYmVkID0ge307XG4gICAgZm9yKHZhciBpPTA7IGk8X2FsbF9wcm90b2NvbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHByb3RvY29sID0gX2FsbF9wcm90b2NvbHNbaV07XG4gICAgICAgIC8vIFVzZXIgY2FuIGhhdmUgYSB0eXBvIGluIHByb3RvY29sIG5hbWUuXG4gICAgICAgIHByb2JlZFtwcm90b2NvbF0gPSBTb2NrSlNbcHJvdG9jb2xdICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBTb2NrSlNbcHJvdG9jb2xdLmVuYWJsZWQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb2JlZDtcbn07XG5cbnV0aWxzLmRldGVjdFByb3RvY29scyA9IGZ1bmN0aW9uKHByb2JlZCwgcHJvdG9jb2xzX3doaXRlbGlzdCwgaW5mbykge1xuICAgIHZhciBwZSA9IHt9LFxuICAgICAgICBwcm90b2NvbHMgPSBbXTtcbiAgICBpZiAoIXByb3RvY29sc193aGl0ZWxpc3QpIHByb3RvY29sc193aGl0ZWxpc3QgPSBfYWxsX3Byb3RvY29scztcbiAgICBmb3IodmFyIGk9MDsgaTxwcm90b2NvbHNfd2hpdGVsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwcm90b2NvbCA9IHByb3RvY29sc193aGl0ZWxpc3RbaV07XG4gICAgICAgIHBlW3Byb3RvY29sXSA9IHByb2JlZFtwcm90b2NvbF07XG4gICAgfVxuICAgIHZhciBtYXliZV9wdXNoID0gZnVuY3Rpb24ocHJvdG9zKSB7XG4gICAgICAgIHZhciBwcm90byA9IHByb3Rvcy5zaGlmdCgpO1xuICAgICAgICBpZiAocGVbcHJvdG9dKSB7XG4gICAgICAgICAgICBwcm90b2NvbHMucHVzaChwcm90byk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAocHJvdG9zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBtYXliZV9wdXNoKHByb3Rvcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAxLiBXZWJzb2NrZXRcbiAgICBpZiAoaW5mby53ZWJzb2NrZXQgIT09IGZhbHNlKSB7XG4gICAgICAgIG1heWJlX3B1c2goWyd3ZWJzb2NrZXQnXSk7XG4gICAgfVxuXG4gICAgLy8gMi4gU3RyZWFtaW5nXG4gICAgaWYgKHBlWyd4aHItc3RyZWFtaW5nJ10gJiYgIWluZm8ubnVsbF9vcmlnaW4pIHtcbiAgICAgICAgcHJvdG9jb2xzLnB1c2goJ3hoci1zdHJlYW1pbmcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocGVbJ3hkci1zdHJlYW1pbmcnXSAmJiAhaW5mby5jb29raWVfbmVlZGVkICYmICFpbmZvLm51bGxfb3JpZ2luKSB7XG4gICAgICAgICAgICBwcm90b2NvbHMucHVzaCgneGRyLXN0cmVhbWluZycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWF5YmVfcHVzaChbJ2lmcmFtZS1ldmVudHNvdXJjZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAnaWZyYW1lLWh0bWxmaWxlJ10pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gMy4gUG9sbGluZ1xuICAgIGlmIChwZVsneGhyLXBvbGxpbmcnXSAmJiAhaW5mby5udWxsX29yaWdpbikge1xuICAgICAgICBwcm90b2NvbHMucHVzaCgneGhyLXBvbGxpbmcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocGVbJ3hkci1wb2xsaW5nJ10gJiYgIWluZm8uY29va2llX25lZWRlZCAmJiAhaW5mby5udWxsX29yaWdpbikge1xuICAgICAgICAgICAgcHJvdG9jb2xzLnB1c2goJ3hkci1wb2xsaW5nJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYXliZV9wdXNoKFsnaWZyYW1lLXhoci1wb2xsaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdqc29ucC1wb2xsaW5nJ10pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcm90b2NvbHM7XG59XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3V0aWxzLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi9kb20uanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbi8vIE1heSBiZSB1c2VkIGJ5IGh0bWxmaWxlIGpzb25wIGFuZCB0cmFuc3BvcnRzLlxudmFyIE1QcmVmaXggPSAnX3NvY2tqc19nbG9iYWwnO1xudXRpbHMuY3JlYXRlSG9vayA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB3aW5kb3dfaWQgPSAnYScgKyB1dGlscy5yYW5kb21fc3RyaW5nKDgpO1xuICAgIGlmICghKE1QcmVmaXggaW4gX3dpbmRvdykpIHtcbiAgICAgICAgdmFyIG1hcCA9IHt9O1xuICAgICAgICBfd2luZG93W01QcmVmaXhdID0gZnVuY3Rpb24od2luZG93X2lkKSB7XG4gICAgICAgICAgICBpZiAoISh3aW5kb3dfaWQgaW4gbWFwKSkge1xuICAgICAgICAgICAgICAgIG1hcFt3aW5kb3dfaWRdID0ge1xuICAgICAgICAgICAgICAgICAgICBpZDogd2luZG93X2lkLFxuICAgICAgICAgICAgICAgICAgICBkZWw6IGZ1bmN0aW9uKCkge2RlbGV0ZSBtYXBbd2luZG93X2lkXTt9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtYXBbd2luZG93X2lkXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gX3dpbmRvd1tNUHJlZml4XSh3aW5kb3dfaWQpO1xufTtcblxuXG5cbnV0aWxzLmF0dGFjaE1lc3NhZ2UgPSBmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgIHV0aWxzLmF0dGFjaEV2ZW50KCdtZXNzYWdlJywgbGlzdGVuZXIpO1xufTtcbnV0aWxzLmF0dGFjaEV2ZW50ID0gZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBfd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIF93aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJRSBxdWlya3MuXG4gICAgICAgIC8vIEFjY29yZGluZyB0bzogaHR0cDovL3N0ZXZlc291ZGVycy5jb20vbWlzYy90ZXN0LXBvc3RtZXNzYWdlLnBocFxuICAgICAgICAvLyB0aGUgbWVzc2FnZSBnZXRzIGRlbGl2ZXJlZCBvbmx5IHRvICdkb2N1bWVudCcsIG5vdCAnd2luZG93Jy5cbiAgICAgICAgX2RvY3VtZW50LmF0dGFjaEV2ZW50KFwib25cIiArIGV2ZW50LCBsaXN0ZW5lcik7XG4gICAgICAgIC8vIEkgZ2V0ICd3aW5kb3cnIGZvciBpZTguXG4gICAgICAgIF93aW5kb3cuYXR0YWNoRXZlbnQoXCJvblwiICsgZXZlbnQsIGxpc3RlbmVyKTtcbiAgICB9XG59O1xuXG51dGlscy5kZXRhY2hNZXNzYWdlID0gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICB1dGlscy5kZXRhY2hFdmVudCgnbWVzc2FnZScsIGxpc3RlbmVyKTtcbn07XG51dGlscy5kZXRhY2hFdmVudCA9IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgX3dpbmRvdy5hZGRFdmVudExpc3RlbmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBfd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgX2RvY3VtZW50LmRldGFjaEV2ZW50KFwib25cIiArIGV2ZW50LCBsaXN0ZW5lcik7XG4gICAgICAgIF93aW5kb3cuZGV0YWNoRXZlbnQoXCJvblwiICsgZXZlbnQsIGxpc3RlbmVyKTtcbiAgICB9XG59O1xuXG5cbnZhciBvbl91bmxvYWQgPSB7fTtcbi8vIFRoaW5ncyByZWdpc3RlcmVkIGFmdGVyIGJlZm9yZXVubG9hZCBhcmUgdG8gYmUgY2FsbGVkIGltbWVkaWF0ZWx5LlxudmFyIGFmdGVyX3VubG9hZCA9IGZhbHNlO1xuXG52YXIgdHJpZ2dlcl91bmxvYWRfY2FsbGJhY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yKHZhciByZWYgaW4gb25fdW5sb2FkKSB7XG4gICAgICAgIG9uX3VubG9hZFtyZWZdKCk7XG4gICAgICAgIGRlbGV0ZSBvbl91bmxvYWRbcmVmXTtcbiAgICB9O1xufTtcblxudmFyIHVubG9hZF90cmlnZ2VyZWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZihhZnRlcl91bmxvYWQpIHJldHVybjtcbiAgICBhZnRlcl91bmxvYWQgPSB0cnVlO1xuICAgIHRyaWdnZXJfdW5sb2FkX2NhbGxiYWNrcygpO1xufTtcblxuLy8gT25iZWZvcmV1bmxvYWQgYWxvbmUgaXMgbm90IHJlbGlhYmxlLiBXZSBjb3VsZCB1c2Ugb25seSAndW5sb2FkJ1xuLy8gYnV0IGl0J3Mgbm90IHdvcmtpbmcgaW4gb3BlcmEgd2l0aGluIGFuIGlmcmFtZS4gTGV0J3MgdXNlIGJvdGguXG51dGlscy5hdHRhY2hFdmVudCgnYmVmb3JldW5sb2FkJywgdW5sb2FkX3RyaWdnZXJlZCk7XG51dGlscy5hdHRhY2hFdmVudCgndW5sb2FkJywgdW5sb2FkX3RyaWdnZXJlZCk7XG5cbnV0aWxzLnVubG9hZF9hZGQgPSBmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgIHZhciByZWYgPSB1dGlscy5yYW5kb21fc3RyaW5nKDgpO1xuICAgIG9uX3VubG9hZFtyZWZdID0gbGlzdGVuZXI7XG4gICAgaWYgKGFmdGVyX3VubG9hZCkge1xuICAgICAgICB1dGlscy5kZWxheSh0cmlnZ2VyX3VubG9hZF9jYWxsYmFja3MpO1xuICAgIH1cbiAgICByZXR1cm4gcmVmO1xufTtcbnV0aWxzLnVubG9hZF9kZWwgPSBmdW5jdGlvbihyZWYpIHtcbiAgICBpZiAocmVmIGluIG9uX3VubG9hZClcbiAgICAgICAgZGVsZXRlIG9uX3VubG9hZFtyZWZdO1xufTtcblxuXG51dGlscy5jcmVhdGVJZnJhbWUgPSBmdW5jdGlvbiAoaWZyYW1lX3VybCwgZXJyb3JfY2FsbGJhY2spIHtcbiAgICB2YXIgaWZyYW1lID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICAgIHZhciB0cmVmLCB1bmxvYWRfcmVmO1xuICAgIHZhciB1bmF0dGFjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodHJlZik7XG4gICAgICAgIC8vIEV4cGxvcmVyIGhhZCBwcm9ibGVtcyB3aXRoIHRoYXQuXG4gICAgICAgIHRyeSB7aWZyYW1lLm9ubG9hZCA9IG51bGw7fSBjYXRjaCAoeCkge31cbiAgICAgICAgaWZyYW1lLm9uZXJyb3IgPSBudWxsO1xuICAgIH07XG4gICAgdmFyIGNsZWFudXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGlmcmFtZSkge1xuICAgICAgICAgICAgdW5hdHRhY2goKTtcbiAgICAgICAgICAgIC8vIFRoaXMgdGltZW91dCBtYWtlcyBjaHJvbWUgZmlyZSBvbmJlZm9yZXVubG9hZCBldmVudFxuICAgICAgICAgICAgLy8gd2l0aGluIGlmcmFtZS4gV2l0aG91dCB0aGUgdGltZW91dCBpdCBnb2VzIHN0cmFpZ2h0IHRvXG4gICAgICAgICAgICAvLyBvbnVubG9hZC5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYoaWZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmcmFtZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlmcmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmcmFtZSA9IG51bGw7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIHV0aWxzLnVubG9hZF9kZWwodW5sb2FkX3JlZik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciBvbmVycm9yID0gZnVuY3Rpb24ocikge1xuICAgICAgICBpZiAoaWZyYW1lKSB7XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICBlcnJvcl9jYWxsYmFjayhyKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIHBvc3QgPSBmdW5jdGlvbihtc2csIG9yaWdpbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB0aGUgaWZyYW1lIGlzIG5vdCBsb2FkZWQsIElFIHJhaXNlcyBhbiBleGNlcHRpb25cbiAgICAgICAgICAgIC8vIG9uICdjb250ZW50V2luZG93Jy5cbiAgICAgICAgICAgIGlmIChpZnJhbWUgJiYgaWZyYW1lLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgICAgICAgICBpZnJhbWUuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZShtc2csIG9yaWdpbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKHgpIHt9O1xuICAgIH07XG5cbiAgICBpZnJhbWUuc3JjID0gaWZyYW1lX3VybDtcbiAgICBpZnJhbWUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBpZnJhbWUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGlmcmFtZS5vbmVycm9yID0gZnVuY3Rpb24oKXtvbmVycm9yKCdvbmVycm9yJyk7fTtcbiAgICBpZnJhbWUub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGBvbmxvYWRgIGlzIHRyaWdnZXJlZCBiZWZvcmUgc2NyaXB0cyBvbiB0aGUgaWZyYW1lIGFyZVxuICAgICAgICAvLyBleGVjdXRlZC4gR2l2ZSBpdCBmZXcgc2Vjb25kcyB0byBhY3R1YWxseSBsb2FkIHN0dWZmLlxuICAgICAgICBjbGVhclRpbWVvdXQodHJlZik7XG4gICAgICAgIHRyZWYgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7b25lcnJvcignb25sb2FkIHRpbWVvdXQnKTt9LCAyMDAwKTtcbiAgICB9O1xuICAgIF9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgdHJlZiA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtvbmVycm9yKCd0aW1lb3V0Jyk7fSwgMTUwMDApO1xuICAgIHVubG9hZF9yZWYgPSB1dGlscy51bmxvYWRfYWRkKGNsZWFudXApO1xuICAgIHJldHVybiB7XG4gICAgICAgIHBvc3Q6IHBvc3QsXG4gICAgICAgIGNsZWFudXA6IGNsZWFudXAsXG4gICAgICAgIGxvYWRlZDogdW5hdHRhY2hcbiAgICB9O1xufTtcblxudXRpbHMuY3JlYXRlSHRtbGZpbGUgPSBmdW5jdGlvbiAoaWZyYW1lX3VybCwgZXJyb3JfY2FsbGJhY2spIHtcbiAgICB2YXIgZG9jID0gbmV3IEFjdGl2ZVhPYmplY3QoJ2h0bWxmaWxlJyk7XG4gICAgdmFyIHRyZWYsIHVubG9hZF9yZWY7XG4gICAgdmFyIGlmcmFtZTtcbiAgICB2YXIgdW5hdHRhY2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRyZWYpO1xuICAgIH07XG4gICAgdmFyIGNsZWFudXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGRvYykge1xuICAgICAgICAgICAgdW5hdHRhY2goKTtcbiAgICAgICAgICAgIHV0aWxzLnVubG9hZF9kZWwodW5sb2FkX3JlZik7XG4gICAgICAgICAgICBpZnJhbWUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpZnJhbWUpO1xuICAgICAgICAgICAgaWZyYW1lID0gZG9jID0gbnVsbDtcbiAgICAgICAgICAgIENvbGxlY3RHYXJiYWdlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciBvbmVycm9yID0gZnVuY3Rpb24ocikgIHtcbiAgICAgICAgaWYgKGRvYykge1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgZXJyb3JfY2FsbGJhY2socik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciBwb3N0ID0gZnVuY3Rpb24obXNnLCBvcmlnaW4pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGlmcmFtZSBpcyBub3QgbG9hZGVkLCBJRSByYWlzZXMgYW4gZXhjZXB0aW9uXG4gICAgICAgICAgICAvLyBvbiAnY29udGVudFdpbmRvdycuXG4gICAgICAgICAgICBpZiAoaWZyYW1lICYmIGlmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICAgICAgaWZyYW1lLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UobXNnLCBvcmlnaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoICh4KSB7fTtcbiAgICB9O1xuXG4gICAgZG9jLm9wZW4oKTtcbiAgICBkb2Mud3JpdGUoJzxodG1sPjxzJyArICdjcmlwdD4nICtcbiAgICAgICAgICAgICAgJ2RvY3VtZW50LmRvbWFpbj1cIicgKyBkb2N1bWVudC5kb21haW4gKyAnXCI7JyArXG4gICAgICAgICAgICAgICc8L3MnICsgJ2NyaXB0PjwvaHRtbD4nKTtcbiAgICBkb2MuY2xvc2UoKTtcbiAgICBkb2MucGFyZW50V2luZG93W1dQcmVmaXhdID0gX3dpbmRvd1tXUHJlZml4XTtcbiAgICB2YXIgYyA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkb2MuYm9keS5hcHBlbmRDaGlsZChjKTtcbiAgICBpZnJhbWUgPSBkb2MuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgYy5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgIGlmcmFtZS5zcmMgPSBpZnJhbWVfdXJsO1xuICAgIHRyZWYgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7b25lcnJvcigndGltZW91dCcpO30sIDE1MDAwKTtcbiAgICB1bmxvYWRfcmVmID0gdXRpbHMudW5sb2FkX2FkZChjbGVhbnVwKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwb3N0OiBwb3N0LFxuICAgICAgICBjbGVhbnVwOiBjbGVhbnVwLFxuICAgICAgICBsb2FkZWQ6IHVuYXR0YWNoXG4gICAgfTtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL2RvbS5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvZG9tMi5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIEFic3RyYWN0WEhST2JqZWN0ID0gZnVuY3Rpb24oKXt9O1xuQWJzdHJhY3RYSFJPYmplY3QucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcihbJ2NodW5rJywgJ2ZpbmlzaCddKTtcblxuQWJzdHJhY3RYSFJPYmplY3QucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBwYXlsb2FkLCBvcHRzKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhhdC54aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB9IGNhdGNoKHgpIHt9O1xuXG4gICAgaWYgKCF0aGF0Lnhocikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhhdC54aHIgPSBuZXcgX3dpbmRvdy5BY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MSFRUUCcpO1xuICAgICAgICB9IGNhdGNoKHgpIHt9O1xuICAgIH1cbiAgICBpZiAoX3dpbmRvdy5BY3RpdmVYT2JqZWN0IHx8IF93aW5kb3cuWERvbWFpblJlcXVlc3QpIHtcbiAgICAgICAgLy8gSUU4IGNhY2hlcyBldmVuIFBPU1RzXG4gICAgICAgIHVybCArPSAoKHVybC5pbmRleE9mKCc/JykgPT09IC0xKSA/ICc/JyA6ICcmJykgKyAndD0nKygrbmV3IERhdGUpO1xuICAgIH1cblxuICAgIC8vIEV4cGxvcmVyIHRlbmRzIHRvIGtlZXAgY29ubmVjdGlvbiBvcGVuLCBldmVuIGFmdGVyIHRoZVxuICAgIC8vIHRhYiBnZXRzIGNsb3NlZDogaHR0cDovL2J1Z3MuanF1ZXJ5LmNvbS90aWNrZXQvNTI4MFxuICAgIHRoYXQudW5sb2FkX3JlZiA9IHV0aWxzLnVubG9hZF9hZGQoZnVuY3Rpb24oKXt0aGF0Ll9jbGVhbnVwKHRydWUpO30pO1xuICAgIHRyeSB7XG4gICAgICAgIHRoYXQueGhyLm9wZW4obWV0aG9kLCB1cmwsIHRydWUpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAvLyBJRSByYWlzZXMgYW4gZXhjZXB0aW9uIG9uIHdyb25nIHBvcnQuXG4gICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJywgMCwgJycpO1xuICAgICAgICB0aGF0Ll9jbGVhbnVwKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9O1xuXG4gICAgaWYgKCFvcHRzIHx8ICFvcHRzLm5vX2NyZWRlbnRpYWxzKSB7XG4gICAgICAgIC8vIE1vemlsbGEgZG9jcyBzYXlzIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL1hNTEh0dHBSZXF1ZXN0IDpcbiAgICAgICAgLy8gXCJUaGlzIG5ldmVyIGFmZmVjdHMgc2FtZS1zaXRlIHJlcXVlc3RzLlwiXG4gICAgICAgIHRoYXQueGhyLndpdGhDcmVkZW50aWFscyA9ICd0cnVlJztcbiAgICB9XG4gICAgaWYgKG9wdHMgJiYgb3B0cy5oZWFkZXJzKSB7XG4gICAgICAgIGZvcih2YXIga2V5IGluIG9wdHMuaGVhZGVycykge1xuICAgICAgICAgICAgdGhhdC54aHIuc2V0UmVxdWVzdEhlYWRlcihrZXksIG9wdHMuaGVhZGVyc1trZXldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoYXQueGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhhdC54aHIpIHtcbiAgICAgICAgICAgIHZhciB4ID0gdGhhdC54aHI7XG4gICAgICAgICAgICBzd2l0Y2ggKHgucmVhZHlTdGF0ZSkge1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIC8vIElFIGRvZXNuJ3QgbGlrZSBwZWVraW5nIGludG8gcmVzcG9uc2VUZXh0IG9yIHN0YXR1c1xuICAgICAgICAgICAgICAgIC8vIG9uIE1pY3Jvc29mdC5YTUxIVFRQIGFuZCByZWFkeXN0YXRlPTNcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhdHVzID0geC5zdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0geC5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoeCkge307XG4gICAgICAgICAgICAgICAgLy8gSUUgZG9lcyByZXR1cm4gcmVhZHlzdGF0ZSA9PSAzIGZvciA0MDQgYW5zd2Vycy5cbiAgICAgICAgICAgICAgICBpZiAodGV4dCAmJiB0ZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5lbWl0KCdjaHVuaycsIHN0YXR1cywgdGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJywgeC5zdGF0dXMsIHgucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICB0aGF0Ll9jbGVhbnVwKGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhhdC54aHIuc2VuZChwYXlsb2FkKTtcbn07XG5cbkFic3RyYWN0WEhST2JqZWN0LnByb3RvdHlwZS5fY2xlYW51cCA9IGZ1bmN0aW9uKGFib3J0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICghdGhhdC54aHIpIHJldHVybjtcbiAgICB1dGlscy51bmxvYWRfZGVsKHRoYXQudW5sb2FkX3JlZik7XG5cbiAgICAvLyBJRSBuZWVkcyB0aGlzIGZpZWxkIHRvIGJlIGEgZnVuY3Rpb25cbiAgICB0aGF0Lnhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpe307XG5cbiAgICBpZiAoYWJvcnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoYXQueGhyLmFib3J0KCk7XG4gICAgICAgIH0gY2F0Y2goeCkge307XG4gICAgfVxuICAgIHRoYXQudW5sb2FkX3JlZiA9IHRoYXQueGhyID0gbnVsbDtcbn07XG5cbkFic3RyYWN0WEhST2JqZWN0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0Lm51a2UoKTtcbiAgICB0aGF0Ll9jbGVhbnVwKHRydWUpO1xufTtcblxudmFyIFhIUkNvcnNPYmplY3QgPSB1dGlscy5YSFJDb3JzT2JqZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuICAgIHV0aWxzLmRlbGF5KGZ1bmN0aW9uKCl7dGhhdC5fc3RhcnQuYXBwbHkodGhhdCwgYXJncyk7fSk7XG59O1xuWEhSQ29yc09iamVjdC5wcm90b3R5cGUgPSBuZXcgQWJzdHJhY3RYSFJPYmplY3QoKTtcblxudmFyIFhIUkxvY2FsT2JqZWN0ID0gdXRpbHMuWEhSTG9jYWxPYmplY3QgPSBmdW5jdGlvbihtZXRob2QsIHVybCwgcGF5bG9hZCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB1dGlscy5kZWxheShmdW5jdGlvbigpe1xuICAgICAgICB0aGF0Ll9zdGFydChtZXRob2QsIHVybCwgcGF5bG9hZCwge1xuICAgICAgICAgICAgbm9fY3JlZGVudGlhbHM6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuWEhSTG9jYWxPYmplY3QucHJvdG90eXBlID0gbmV3IEFic3RyYWN0WEhST2JqZWN0KCk7XG5cblxuXG4vLyBSZWZlcmVuY2VzOlxuLy8gICBodHRwOi8vYWpheGlhbi5jb20vYXJjaGl2ZXMvMTAwLWxpbmUtYWpheC13cmFwcGVyXG4vLyAgIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9jYzI4ODA2MCh2PVZTLjg1KS5hc3B4XG52YXIgWERST2JqZWN0ID0gdXRpbHMuWERST2JqZWN0ID0gZnVuY3Rpb24obWV0aG9kLCB1cmwsIHBheWxvYWQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdXRpbHMuZGVsYXkoZnVuY3Rpb24oKXt0aGF0Ll9zdGFydChtZXRob2QsIHVybCwgcGF5bG9hZCk7fSk7XG59O1xuWERST2JqZWN0LnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoWydjaHVuaycsICdmaW5pc2gnXSk7XG5YRFJPYmplY3QucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBwYXlsb2FkKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciB4ZHIgPSBuZXcgWERvbWFpblJlcXVlc3QoKTtcbiAgICAvLyBJRSBjYWNoZXMgZXZlbiBQT1NUc1xuICAgIHVybCArPSAoKHVybC5pbmRleE9mKCc/JykgPT09IC0xKSA/ICc/JyA6ICcmJykgKyAndD0nKygrbmV3IERhdGUpO1xuXG4gICAgdmFyIG9uZXJyb3IgPSB4ZHIub250aW1lb3V0ID0geGRyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCAwLCAnJyk7XG4gICAgICAgIHRoYXQuX2NsZWFudXAoZmFsc2UpO1xuICAgIH07XG4gICAgeGRyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhhdC5lbWl0KCdjaHVuaycsIDIwMCwgeGRyLnJlc3BvbnNlVGV4dCk7XG4gICAgfTtcbiAgICB4ZHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJywgMjAwLCB4ZHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgdGhhdC5fY2xlYW51cChmYWxzZSk7XG4gICAgfTtcbiAgICB0aGF0LnhkciA9IHhkcjtcbiAgICB0aGF0LnVubG9hZF9yZWYgPSB1dGlscy51bmxvYWRfYWRkKGZ1bmN0aW9uKCl7dGhhdC5fY2xlYW51cCh0cnVlKTt9KTtcbiAgICB0cnkge1xuICAgICAgICAvLyBGYWlscyB3aXRoIEFjY2Vzc0RlbmllZCBpZiBwb3J0IG51bWJlciBpcyBib2d1c1xuICAgICAgICB0aGF0Lnhkci5vcGVuKG1ldGhvZCwgdXJsKTtcbiAgICAgICAgdGhhdC54ZHIuc2VuZChwYXlsb2FkKTtcbiAgICB9IGNhdGNoKHgpIHtcbiAgICAgICAgb25lcnJvcigpO1xuICAgIH1cbn07XG5cblhEUk9iamVjdC5wcm90b3R5cGUuX2NsZWFudXAgPSBmdW5jdGlvbihhYm9ydCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAoIXRoYXQueGRyKSByZXR1cm47XG4gICAgdXRpbHMudW5sb2FkX2RlbCh0aGF0LnVubG9hZF9yZWYpO1xuXG4gICAgdGhhdC54ZHIub250aW1lb3V0ID0gdGhhdC54ZHIub25lcnJvciA9IHRoYXQueGRyLm9ucHJvZ3Jlc3MgPVxuICAgICAgICB0aGF0Lnhkci5vbmxvYWQgPSBudWxsO1xuICAgIGlmIChhYm9ydCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhhdC54ZHIuYWJvcnQoKTtcbiAgICAgICAgfSBjYXRjaCh4KSB7fTtcbiAgICB9XG4gICAgdGhhdC51bmxvYWRfcmVmID0gdGhhdC54ZHIgPSBudWxsO1xufTtcblxuWERST2JqZWN0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0Lm51a2UoKTtcbiAgICB0aGF0Ll9jbGVhbnVwKHRydWUpO1xufTtcblxuLy8gMS4gSXMgbmF0aXZlbHkgdmlhIFhIUlxuLy8gMi4gSXMgbmF0aXZlbHkgdmlhIFhEUlxuLy8gMy4gTm9wZSwgYnV0IHBvc3RNZXNzYWdlIGlzIHRoZXJlIHNvIGl0IHNob3VsZCB3b3JrIHZpYSB0aGUgSWZyYW1lLlxuLy8gNC4gTm9wZSwgc29ycnkuXG51dGlscy5pc1hIUkNvcnNDYXBhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKF93aW5kb3cuWE1MSHR0cFJlcXVlc3QgJiYgJ3dpdGhDcmVkZW50aWFscycgaW4gbmV3IFhNTEh0dHBSZXF1ZXN0KCkpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIC8vIFhEb21haW5SZXF1ZXN0IGRvZXNuJ3Qgd29yayBpZiBwYWdlIGlzIHNlcnZlZCBmcm9tIGZpbGU6Ly9cbiAgICBpZiAoX3dpbmRvdy5YRG9tYWluUmVxdWVzdCAmJiBfZG9jdW1lbnQuZG9tYWluKSB7XG4gICAgICAgIHJldHVybiAyO1xuICAgIH1cbiAgICBpZiAoSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQoKSkge1xuICAgICAgICByZXR1cm4gMztcbiAgICB9XG4gICAgcmV0dXJuIDQ7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9kb20yLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi9zb2NranMuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBTb2NrSlMgPSBmdW5jdGlvbih1cmwsIGRlcF9wcm90b2NvbHNfd2hpdGVsaXN0LCBvcHRpb25zKSB7XG4gICAgaWYgKHRoaXMgPT09IHdpbmRvdykge1xuICAgICAgICAvLyBtYWtlcyBgbmV3YCBvcHRpb25hbFxuICAgICAgICByZXR1cm4gbmV3IFNvY2tKUyh1cmwsIGRlcF9wcm90b2NvbHNfd2hpdGVsaXN0LCBvcHRpb25zKTtcbiAgICB9XG4gICAgXG4gICAgdmFyIHRoYXQgPSB0aGlzLCBwcm90b2NvbHNfd2hpdGVsaXN0O1xuICAgIHRoYXQuX29wdGlvbnMgPSB7ZGV2ZWw6IGZhbHNlLCBkZWJ1ZzogZmFsc2UsIHByb3RvY29sc193aGl0ZWxpc3Q6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgaW5mbzogdW5kZWZpbmVkLCBydHQ6IHVuZGVmaW5lZH07XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgdXRpbHMub2JqZWN0RXh0ZW5kKHRoYXQuX29wdGlvbnMsIG9wdGlvbnMpO1xuICAgIH1cbiAgICB0aGF0Ll9iYXNlX3VybCA9IHV0aWxzLmFtZW5kVXJsKHVybCk7XG4gICAgdGhhdC5fc2VydmVyID0gdGhhdC5fb3B0aW9ucy5zZXJ2ZXIgfHwgdXRpbHMucmFuZG9tX251bWJlcl9zdHJpbmcoMTAwMCk7XG4gICAgaWYgKHRoYXQuX29wdGlvbnMucHJvdG9jb2xzX3doaXRlbGlzdCAmJlxuICAgICAgICB0aGF0Ll9vcHRpb25zLnByb3RvY29sc193aGl0ZWxpc3QubGVuZ3RoKSB7XG4gICAgICAgIHByb3RvY29sc193aGl0ZWxpc3QgPSB0aGF0Ll9vcHRpb25zLnByb3RvY29sc193aGl0ZWxpc3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRGVwcmVjYXRlZCBBUElcbiAgICAgICAgaWYgKHR5cGVvZiBkZXBfcHJvdG9jb2xzX3doaXRlbGlzdCA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAgIGRlcF9wcm90b2NvbHNfd2hpdGVsaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHByb3RvY29sc193aGl0ZWxpc3QgPSBbZGVwX3Byb3RvY29sc193aGl0ZWxpc3RdO1xuICAgICAgICB9IGVsc2UgaWYgKHV0aWxzLmlzQXJyYXkoZGVwX3Byb3RvY29sc193aGl0ZWxpc3QpKSB7XG4gICAgICAgICAgICBwcm90b2NvbHNfd2hpdGVsaXN0ID0gZGVwX3Byb3RvY29sc193aGl0ZWxpc3RcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb3RvY29sc193aGl0ZWxpc3QgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcm90b2NvbHNfd2hpdGVsaXN0KSB7XG4gICAgICAgICAgICB0aGF0Ll9kZWJ1ZygnRGVwcmVjYXRlZCBBUEk6IFVzZSBcInByb3RvY29sc193aGl0ZWxpc3RcIiBvcHRpb24gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnaW5zdGVhZCBvZiBzdXBwbHlpbmcgcHJvdG9jb2wgbGlzdCBhcyBhIHNlY29uZCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdwYXJhbWV0ZXIgdG8gU29ja0pTIGNvbnN0cnVjdG9yLicpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoYXQuX3Byb3RvY29scyA9IFtdO1xuICAgIHRoYXQucHJvdG9jb2wgPSBudWxsO1xuICAgIHRoYXQucmVhZHlTdGF0ZSA9IFNvY2tKUy5DT05ORUNUSU5HO1xuICAgIHRoYXQuX2lyID0gY3JlYXRlSW5mb1JlY2VpdmVyKHRoYXQuX2Jhc2VfdXJsKTtcbiAgICB0aGF0Ll9pci5vbmZpbmlzaCA9IGZ1bmN0aW9uKGluZm8sIHJ0dCkge1xuICAgICAgICB0aGF0Ll9pciA9IG51bGw7XG4gICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICBpZiAodGhhdC5fb3B0aW9ucy5pbmZvKSB7XG4gICAgICAgICAgICAgICAgLy8gT3ZlcnJpZGUgaWYgdXNlciBzdXBwbGllcyB0aGUgb3B0aW9uXG4gICAgICAgICAgICAgICAgaW5mbyA9IHV0aWxzLm9iamVjdEV4dGVuZChpbmZvLCB0aGF0Ll9vcHRpb25zLmluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoYXQuX29wdGlvbnMucnR0KSB7XG4gICAgICAgICAgICAgICAgcnR0ID0gdGhhdC5fb3B0aW9ucy5ydHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGF0Ll9hcHBseUluZm8oaW5mbywgcnR0LCBwcm90b2NvbHNfd2hpdGVsaXN0KTtcbiAgICAgICAgICAgIHRoYXQuX2RpZENsb3NlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGF0Ll9kaWRDbG9zZSgxMDAyLCAnQ2FuXFwndCBjb25uZWN0IHRvIHNlcnZlcicsIHRydWUpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG4vLyBJbmhlcml0YW5jZVxuU29ja0pTLnByb3RvdHlwZSA9IG5ldyBSRXZlbnRUYXJnZXQoKTtcblxuU29ja0pTLnZlcnNpb24gPSBcIjAuMy4xLjcuZ2E2N2YuZGlydHlcIjtcblxuU29ja0pTLkNPTk5FQ1RJTkcgPSAwO1xuU29ja0pTLk9QRU4gPSAxO1xuU29ja0pTLkNMT1NJTkcgPSAyO1xuU29ja0pTLkNMT1NFRCA9IDM7XG5cblNvY2tKUy5wcm90b3R5cGUuX2RlYnVnID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX29wdGlvbnMuZGVidWcpXG4gICAgICAgIHV0aWxzLmxvZy5hcHBseSh1dGlscywgYXJndW1lbnRzKTtcbn07XG5cblNvY2tKUy5wcm90b3R5cGUuX2Rpc3BhdGNoT3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5yZWFkeVN0YXRlID09PSBTb2NrSlMuQ09OTkVDVElORykge1xuICAgICAgICBpZiAodGhhdC5fdHJhbnNwb3J0X3RyZWYpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGF0Ll90cmFuc3BvcnRfdHJlZik7XG4gICAgICAgICAgICB0aGF0Ll90cmFuc3BvcnRfdHJlZiA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhhdC5yZWFkeVN0YXRlID0gU29ja0pTLk9QRU47XG4gICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoXCJvcGVuXCIpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGUgc2VydmVyIG1pZ2h0IGhhdmUgYmVlbiByZXN0YXJ0ZWQsIGFuZCBsb3N0IHRyYWNrIG9mIG91clxuICAgICAgICAvLyBjb25uZWN0aW9uLlxuICAgICAgICB0aGF0Ll9kaWRDbG9zZSgxMDA2LCBcIlNlcnZlciBsb3N0IHNlc3Npb25cIik7XG4gICAgfVxufTtcblxuU29ja0pTLnByb3RvdHlwZS5fZGlzcGF0Y2hNZXNzYWdlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5yZWFkeVN0YXRlICE9PSBTb2NrSlMuT1BFTilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KFwibWVzc2FnZVwiLCB7ZGF0YTogZGF0YX0pKTtcbn07XG5cblNvY2tKUy5wcm90b3R5cGUuX2Rpc3BhdGNoSGVhcnRiZWF0ID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5yZWFkeVN0YXRlICE9PSBTb2NrSlMuT1BFTilcbiAgICAgICAgcmV0dXJuO1xuICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ2hlYXJ0YmVhdCcsIHt9KSk7XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl9kaWRDbG9zZSA9IGZ1bmN0aW9uKGNvZGUsIHJlYXNvbiwgZm9yY2UpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLkNPTk5FQ1RJTkcgJiZcbiAgICAgICAgdGhhdC5yZWFkeVN0YXRlICE9PSBTb2NrSlMuT1BFTiAmJlxuICAgICAgICB0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5DTE9TSU5HKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJTlZBTElEX1NUQVRFX0VSUicpO1xuICAgIGlmICh0aGF0Ll9pcikge1xuICAgICAgICB0aGF0Ll9pci5udWtlKCk7XG4gICAgICAgIHRoYXQuX2lyID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGhhdC5fdHJhbnNwb3J0KSB7XG4gICAgICAgIHRoYXQuX3RyYW5zcG9ydC5kb0NsZWFudXAoKTtcbiAgICAgICAgdGhhdC5fdHJhbnNwb3J0ID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgY2xvc2VfZXZlbnQgPSBuZXcgU2ltcGxlRXZlbnQoXCJjbG9zZVwiLCB7XG4gICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgIHJlYXNvbjogcmVhc29uLFxuICAgICAgICB3YXNDbGVhbjogdXRpbHMudXNlclNldENvZGUoY29kZSl9KTtcblxuICAgIGlmICghdXRpbHMudXNlclNldENvZGUoY29kZSkgJiZcbiAgICAgICAgdGhhdC5yZWFkeVN0YXRlID09PSBTb2NrSlMuQ09OTkVDVElORyAmJiAhZm9yY2UpIHtcbiAgICAgICAgaWYgKHRoYXQuX3RyeV9uZXh0X3Byb3RvY29sKGNsb3NlX2V2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNsb3NlX2V2ZW50ID0gbmV3IFNpbXBsZUV2ZW50KFwiY2xvc2VcIiwge2NvZGU6IDIwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFzb246IFwiQWxsIHRyYW5zcG9ydHMgZmFpbGVkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YXNDbGVhbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0X2V2ZW50OiBjbG9zZV9ldmVudH0pO1xuICAgIH1cbiAgICB0aGF0LnJlYWR5U3RhdGUgPSBTb2NrSlMuQ0xPU0VEO1xuXG4gICAgdXRpbHMuZGVsYXkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KGNsb3NlX2V2ZW50KTtcbiAgICAgICAgICAgICAgICB9KTtcbn07XG5cblNvY2tKUy5wcm90b3R5cGUuX2RpZE1lc3NhZ2UgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciB0eXBlID0gZGF0YS5zbGljZSgwLCAxKTtcbiAgICBzd2l0Y2godHlwZSkge1xuICAgIGNhc2UgJ28nOlxuICAgICAgICB0aGF0Ll9kaXNwYXRjaE9wZW4oKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSAnYSc6XG4gICAgICAgIHZhciBwYXlsb2FkID0gSlNPTi5wYXJzZShkYXRhLnNsaWNlKDEpIHx8ICdbXScpO1xuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IHBheWxvYWQubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdGhhdC5fZGlzcGF0Y2hNZXNzYWdlKHBheWxvYWRbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ20nOlxuICAgICAgICB2YXIgcGF5bG9hZCA9IEpTT04ucGFyc2UoZGF0YS5zbGljZSgxKSB8fCAnbnVsbCcpO1xuICAgICAgICB0aGF0Ll9kaXNwYXRjaE1lc3NhZ2UocGF5bG9hZCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2MnOlxuICAgICAgICB2YXIgcGF5bG9hZCA9IEpTT04ucGFyc2UoZGF0YS5zbGljZSgxKSB8fCAnW10nKTtcbiAgICAgICAgdGhhdC5fZGlkQ2xvc2UocGF5bG9hZFswXSwgcGF5bG9hZFsxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2gnOlxuICAgICAgICB0aGF0Ll9kaXNwYXRjaEhlYXJ0YmVhdCgpO1xuICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl90cnlfbmV4dF9wcm90b2NvbCA9IGZ1bmN0aW9uKGNsb3NlX2V2ZW50KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnByb3RvY29sKSB7XG4gICAgICAgIHRoYXQuX2RlYnVnKCdDbG9zZWQgdHJhbnNwb3J0OicsIHRoYXQucHJvdG9jb2wsICcnK2Nsb3NlX2V2ZW50KTtcbiAgICAgICAgdGhhdC5wcm90b2NvbCA9IG51bGw7XG4gICAgfVxuICAgIGlmICh0aGF0Ll90cmFuc3BvcnRfdHJlZikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhhdC5fdHJhbnNwb3J0X3RyZWYpO1xuICAgICAgICB0aGF0Ll90cmFuc3BvcnRfdHJlZiA9IG51bGw7XG4gICAgfVxuXG4gICAgd2hpbGUoMSkge1xuICAgICAgICB2YXIgcHJvdG9jb2wgPSB0aGF0LnByb3RvY29sID0gdGhhdC5fcHJvdG9jb2xzLnNoaWZ0KCk7XG4gICAgICAgIGlmICghcHJvdG9jb2wpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBTb21lIHByb3RvY29scyByZXF1aXJlIGFjY2VzcyB0byBgYm9keWAsIHdoYXQgaWYgd2VyZSBpblxuICAgICAgICAvLyB0aGUgYGhlYWRgP1xuICAgICAgICBpZiAoU29ja0pTW3Byb3RvY29sXSAmJlxuICAgICAgICAgICAgU29ja0pTW3Byb3RvY29sXS5uZWVkX2JvZHkgPT09IHRydWUgJiZcbiAgICAgICAgICAgICghX2RvY3VtZW50LmJvZHkgfHxcbiAgICAgICAgICAgICAodHlwZW9mIF9kb2N1bWVudC5yZWFkeVN0YXRlICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgICAmJiBfZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gJ2NvbXBsZXRlJykpKSB7XG4gICAgICAgICAgICB0aGF0Ll9wcm90b2NvbHMudW5zaGlmdChwcm90b2NvbCk7XG4gICAgICAgICAgICB0aGF0LnByb3RvY29sID0gJ3dhaXRpbmctZm9yLWxvYWQnO1xuICAgICAgICAgICAgdXRpbHMuYXR0YWNoRXZlbnQoJ2xvYWQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHRoYXQuX3RyeV9uZXh0X3Byb3RvY29sKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFTb2NrSlNbcHJvdG9jb2xdIHx8XG4gICAgICAgICAgICAgICFTb2NrSlNbcHJvdG9jb2xdLmVuYWJsZWQodGhhdC5fb3B0aW9ucykpIHtcbiAgICAgICAgICAgIHRoYXQuX2RlYnVnKCdTa2lwcGluZyB0cmFuc3BvcnQ6JywgcHJvdG9jb2wpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJvdW5kVHJpcHMgPSBTb2NrSlNbcHJvdG9jb2xdLnJvdW5kVHJpcHMgfHwgMTtcbiAgICAgICAgICAgIHZhciB0byA9ICgodGhhdC5fb3B0aW9ucy5ydG8gfHwgMCkgKiByb3VuZFRyaXBzKSB8fCA1MDAwO1xuICAgICAgICAgICAgdGhhdC5fdHJhbnNwb3J0X3RyZWYgPSB1dGlscy5kZWxheSh0bywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoYXQucmVhZHlTdGF0ZSA9PT0gU29ja0pTLkNPTk5FQ1RJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSSBjYW4ndCB1bmRlcnN0YW5kIGhvdyBpdCBpcyBwb3NzaWJsZSB0byBydW5cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyB0aW1lciwgd2hlbiB0aGUgc3RhdGUgaXMgQ0xPU0VELCBidXRcbiAgICAgICAgICAgICAgICAgICAgLy8gYXBwYXJlbnRseSBpbiBJRSBldmVyeXRoaW4gaXMgcG9zc2libGUuXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2RpZENsb3NlKDIwMDcsIFwiVHJhbnNwb3J0IHRpbWVvdXRlZFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIGNvbm5pZCA9IHV0aWxzLnJhbmRvbV9zdHJpbmcoOCk7XG4gICAgICAgICAgICB2YXIgdHJhbnNfdXJsID0gdGhhdC5fYmFzZV91cmwgKyAnLycgKyB0aGF0Ll9zZXJ2ZXIgKyAnLycgKyBjb25uaWQ7XG4gICAgICAgICAgICB0aGF0Ll9kZWJ1ZygnT3BlbmluZyB0cmFuc3BvcnQ6JywgcHJvdG9jb2wsICcgdXJsOicrdHJhbnNfdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgJyBSVE86Jyt0aGF0Ll9vcHRpb25zLnJ0byk7XG4gICAgICAgICAgICB0aGF0Ll90cmFuc3BvcnQgPSBuZXcgU29ja0pTW3Byb3RvY29sXSh0aGF0LCB0cmFuc191cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9iYXNlX3VybCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblNvY2tKUy5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbihjb2RlLCByZWFzb24pIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKGNvZGUgJiYgIXV0aWxzLnVzZXJTZXRDb2RlKGNvZGUpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJTlZBTElEX0FDQ0VTU19FUlJcIik7XG4gICAgaWYodGhhdC5yZWFkeVN0YXRlICE9PSBTb2NrSlMuQ09OTkVDVElORyAmJlxuICAgICAgIHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLk9QRU4pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGF0LnJlYWR5U3RhdGUgPSBTb2NrSlMuQ0xPU0lORztcbiAgICB0aGF0Ll9kaWRDbG9zZShjb2RlIHx8IDEwMDAsIHJlYXNvbiB8fCBcIk5vcm1hbCBjbG9zdXJlXCIpO1xuICAgIHJldHVybiB0cnVlO1xufTtcblxuU29ja0pTLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5yZWFkeVN0YXRlID09PSBTb2NrSlMuQ09OTkVDVElORylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJTlZBTElEX1NUQVRFX0VSUicpO1xuICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgPT09IFNvY2tKUy5PUEVOKSB7XG4gICAgICAgIHRoYXQuX3RyYW5zcG9ydC5kb1NlbmQodXRpbHMucXVvdGUoJycgKyBkYXRhKSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcblxuU29ja0pTLnByb3RvdHlwZS5fYXBwbHlJbmZvID0gZnVuY3Rpb24oaW5mbywgcnR0LCBwcm90b2NvbHNfd2hpdGVsaXN0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQuX29wdGlvbnMuaW5mbyA9IGluZm87XG4gICAgdGhhdC5fb3B0aW9ucy5ydHQgPSBydHQ7XG4gICAgdGhhdC5fb3B0aW9ucy5ydG8gPSB1dGlscy5jb3VudFJUTyhydHQpO1xuICAgIHRoYXQuX29wdGlvbnMuaW5mby5udWxsX29yaWdpbiA9ICFfZG9jdW1lbnQuZG9tYWluO1xuICAgIHZhciBwcm9iZWQgPSB1dGlscy5wcm9iZVByb3RvY29scygpO1xuICAgIHRoYXQuX3Byb3RvY29scyA9IHV0aWxzLmRldGVjdFByb3RvY29scyhwcm9iZWQsIHByb3RvY29sc193aGl0ZWxpc3QsIGluZm8pO1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvc29ja2pzLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy13ZWJzb2NrZXQuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBXZWJTb2NrZXRUcmFuc3BvcnQgPSBTb2NrSlMud2Vic29ja2V0ID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgdXJsID0gdHJhbnNfdXJsICsgJy93ZWJzb2NrZXQnO1xuICAgIGlmICh1cmwuc2xpY2UoMCwgNSkgPT09ICdodHRwcycpIHtcbiAgICAgICAgdXJsID0gJ3dzcycgKyB1cmwuc2xpY2UoNSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXJsID0gJ3dzJyArIHVybC5zbGljZSg0KTtcbiAgICB9XG4gICAgdGhhdC5yaSA9IHJpO1xuICAgIHRoYXQudXJsID0gdXJsO1xuICAgIHZhciBDb25zdHJ1Y3RvciA9IF93aW5kb3cuV2ViU29ja2V0IHx8IF93aW5kb3cuTW96V2ViU29ja2V0O1xuXG4gICAgdGhhdC53cyA9IG5ldyBDb25zdHJ1Y3Rvcih0aGF0LnVybCk7XG4gICAgdGhhdC53cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoYXQucmkuX2RpZE1lc3NhZ2UoZS5kYXRhKTtcbiAgICB9O1xuICAgIC8vIEZpcmVmb3ggaGFzIGFuIGludGVyZXN0aW5nIGJ1Zy4gSWYgYSB3ZWJzb2NrZXQgY29ubmVjdGlvbiBpc1xuICAgIC8vIGNyZWF0ZWQgYWZ0ZXIgb25iZWZvcmV1bmxvYWQsIGl0IHN0YXlzIGFsaXZlIGV2ZW4gd2hlbiB1c2VyXG4gICAgLy8gbmF2aWdhdGVzIGF3YXkgZnJvbSB0aGUgcGFnZS4gSW4gc3VjaCBzaXR1YXRpb24gbGV0J3MgbGllIC1cbiAgICAvLyBsZXQncyBub3Qgb3BlbiB0aGUgd3MgY29ubmVjdGlvbiBhdCBhbGwuIFNlZTpcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vc29ja2pzL3NvY2tqcy1jbGllbnQvaXNzdWVzLzI4XG4gICAgLy8gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk2MDg1XG4gICAgdGhhdC51bmxvYWRfcmVmID0gdXRpbHMudW5sb2FkX2FkZChmdW5jdGlvbigpe3RoYXQud3MuY2xvc2UoKX0pO1xuICAgIHRoYXQud3Mub25jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LnJpLl9kaWRNZXNzYWdlKHV0aWxzLmNsb3NlRnJhbWUoMTAwNiwgXCJXZWJTb2NrZXQgY29ubmVjdGlvbiBicm9rZW5cIikpO1xuICAgIH07XG59O1xuXG5XZWJTb2NrZXRUcmFuc3BvcnQucHJvdG90eXBlLmRvU2VuZCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB0aGlzLndzLnNlbmQoJ1snICsgZGF0YSArICddJyk7XG59O1xuXG5XZWJTb2NrZXRUcmFuc3BvcnQucHJvdG90eXBlLmRvQ2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgd3MgPSB0aGF0LndzO1xuICAgIGlmICh3cykge1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSB3cy5vbmNsb3NlID0gbnVsbDtcbiAgICAgICAgd3MuY2xvc2UoKTtcbiAgICAgICAgdXRpbHMudW5sb2FkX2RlbCh0aGF0LnVubG9hZF9yZWYpO1xuICAgICAgICB0aGF0LnVubG9hZF9yZWYgPSB0aGF0LnJpID0gdGhhdC53cyA9IG51bGw7XG4gICAgfVxufTtcblxuV2ViU29ja2V0VHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gISEoX3dpbmRvdy5XZWJTb2NrZXQgfHwgX3dpbmRvdy5Nb3pXZWJTb2NrZXQpO1xufTtcblxuLy8gSW4gdGhlb3J5LCB3cyBzaG91bGQgcmVxdWlyZSAxIHJvdW5kIHRyaXAuIEJ1dCBpbiBjaHJvbWUsIHRoaXMgaXNcbi8vIG5vdCB2ZXJ5IHN0YWJsZSBvdmVyIFNTTC4gTW9zdCBsaWtlbHkgYSB3cyBjb25uZWN0aW9uIHJlcXVpcmVzIGFcbi8vIHNlcGFyYXRlIFNTTCBjb25uZWN0aW9uLCBpbiB3aGljaCBjYXNlIDIgcm91bmQgdHJpcHMgYXJlIGFuXG4vLyBhYnNvbHV0ZSBtaW51bXVtLlxuV2ViU29ja2V0VHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAyO1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy13ZWJzb2NrZXQuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLXNlbmRlci5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIEJ1ZmZlcmVkU2VuZGVyID0gZnVuY3Rpb24oKSB7fTtcbkJ1ZmZlcmVkU2VuZGVyLnByb3RvdHlwZS5zZW5kX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24oc2VuZGVyKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQuc2VuZF9idWZmZXIgPSBbXTtcbiAgICB0aGF0LnNlbmRlciA9IHNlbmRlcjtcbn07XG5CdWZmZXJlZFNlbmRlci5wcm90b3R5cGUuZG9TZW5kID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnNlbmRfYnVmZmVyLnB1c2gobWVzc2FnZSk7XG4gICAgaWYgKCF0aGF0LnNlbmRfc3RvcCkge1xuICAgICAgICB0aGF0LnNlbmRfc2NoZWR1bGUoKTtcbiAgICB9XG59O1xuXG4vLyBGb3IgcG9sbGluZyB0cmFuc3BvcnRzIGluIGEgc2l0dWF0aW9uIHdoZW4gaW4gdGhlIG1lc3NhZ2UgY2FsbGJhY2ssXG4vLyBuZXcgbWVzc2FnZSBpcyBiZWluZyBzZW5kLiBJZiB0aGUgc2VuZGluZyBjb25uZWN0aW9uIHdhcyBzdGFydGVkXG4vLyBiZWZvcmUgcmVjZWl2aW5nIG9uZSwgaXQgaXMgcG9zc2libGUgdG8gc2F0dXJhdGUgdGhlIG5ldHdvcmsgYW5kXG4vLyB0aW1lb3V0IGR1ZSB0byB0aGUgbGFjayBvZiByZWNlaXZpbmcgc29ja2V0LiBUbyBhdm9pZCB0aGF0IHdlIGRlbGF5XG4vLyBzZW5kaW5nIG1lc3NhZ2VzIGJ5IHNvbWUgc21hbGwgdGltZSwgaW4gb3JkZXIgdG8gbGV0IHJlY2VpdmluZ1xuLy8gY29ubmVjdGlvbiBiZSBzdGFydGVkIGJlZm9yZWhhbmQuIFRoaXMgaXMgb25seSBhIGhhbGZtZWFzdXJlIGFuZFxuLy8gZG9lcyBub3QgZml4IHRoZSBiaWcgcHJvYmxlbSwgYnV0IGl0IGRvZXMgbWFrZSB0aGUgdGVzdHMgZ28gbW9yZVxuLy8gc3RhYmxlIG9uIHNsb3cgbmV0d29ya3MuXG5CdWZmZXJlZFNlbmRlci5wcm90b3R5cGUuc2VuZF9zY2hlZHVsZV93YWl0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciB0cmVmO1xuICAgIHRoYXQuc2VuZF9zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQuc2VuZF9zdG9wID0gbnVsbDtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRyZWYpO1xuICAgIH07XG4gICAgdHJlZiA9IHV0aWxzLmRlbGF5KDI1LCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhhdC5zZW5kX3N0b3AgPSBudWxsO1xuICAgICAgICB0aGF0LnNlbmRfc2NoZWR1bGUoKTtcbiAgICB9KTtcbn07XG5cbkJ1ZmZlcmVkU2VuZGVyLnByb3RvdHlwZS5zZW5kX3NjaGVkdWxlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnNlbmRfYnVmZmVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIHBheWxvYWQgPSAnWycgKyB0aGF0LnNlbmRfYnVmZmVyLmpvaW4oJywnKSArICddJztcbiAgICAgICAgdGhhdC5zZW5kX3N0b3AgPSB0aGF0LnNlbmRlcih0aGF0LnRyYW5zX3VybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNlbmRfc3RvcCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2VuZF9zY2hlZHVsZV93YWl0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIHRoYXQuc2VuZF9idWZmZXIgPSBbXTtcbiAgICB9XG59O1xuXG5CdWZmZXJlZFNlbmRlci5wcm90b3R5cGUuc2VuZF9kZXN0cnVjdG9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0Ll9zZW5kX3N0b3ApIHtcbiAgICAgICAgdGhhdC5fc2VuZF9zdG9wKCk7XG4gICAgfVxuICAgIHRoYXQuX3NlbmRfc3RvcCA9IG51bGw7XG59O1xuXG52YXIganNvblBHZW5lcmljU2VuZGVyID0gZnVuY3Rpb24odXJsLCBwYXlsb2FkLCBjYWxsYmFjaykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICghKCdfc2VuZF9mb3JtJyBpbiB0aGF0KSkge1xuICAgICAgICB2YXIgZm9ybSA9IHRoYXQuX3NlbmRfZm9ybSA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJyk7XG4gICAgICAgIHZhciBhcmVhID0gdGhhdC5fc2VuZF9hcmVhID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgICAgIGFyZWEubmFtZSA9ICdkJztcbiAgICAgICAgZm9ybS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBmb3JtLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgZm9ybS5tZXRob2QgPSAnUE9TVCc7XG4gICAgICAgIGZvcm0uZW5jdHlwZSA9ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnO1xuICAgICAgICBmb3JtLmFjY2VwdENoYXJzZXQgPSBcIlVURi04XCI7XG4gICAgICAgIGZvcm0uYXBwZW5kQ2hpbGQoYXJlYSk7XG4gICAgICAgIF9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGZvcm0pO1xuICAgIH1cbiAgICB2YXIgZm9ybSA9IHRoYXQuX3NlbmRfZm9ybTtcbiAgICB2YXIgYXJlYSA9IHRoYXQuX3NlbmRfYXJlYTtcbiAgICB2YXIgaWQgPSAnYScgKyB1dGlscy5yYW5kb21fc3RyaW5nKDgpO1xuICAgIGZvcm0udGFyZ2V0ID0gaWQ7XG4gICAgZm9ybS5hY3Rpb24gPSB1cmwgKyAnL2pzb25wX3NlbmQ/aT0nICsgaWQ7XG5cbiAgICB2YXIgaWZyYW1lO1xuICAgIHRyeSB7XG4gICAgICAgIC8vIGllNiBkeW5hbWljIGlmcmFtZXMgd2l0aCB0YXJnZXQ9XCJcIiBzdXBwb3J0ICh0aGFua3MgQ2hyaXMgTGFtYmFjaGVyKVxuICAgICAgICBpZnJhbWUgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnPGlmcmFtZSBuYW1lPVwiJysgaWQgKydcIj4nKTtcbiAgICB9IGNhdGNoKHgpIHtcbiAgICAgICAgaWZyYW1lID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICAgICAgICBpZnJhbWUubmFtZSA9IGlkO1xuICAgIH1cbiAgICBpZnJhbWUuaWQgPSBpZDtcbiAgICBmb3JtLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICB0cnkge1xuICAgICAgICBhcmVhLnZhbHVlID0gcGF5bG9hZDtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgdXRpbHMubG9nKCdZb3VyIGJyb3dzZXIgaXMgc2VyaW91c2x5IGJyb2tlbi4gR28gaG9tZSEgJyArIGUubWVzc2FnZSk7XG4gICAgfVxuICAgIGZvcm0uc3VibWl0KCk7XG5cbiAgICB2YXIgY29tcGxldGVkID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoIWlmcmFtZS5vbmVycm9yKSByZXR1cm47XG4gICAgICAgIGlmcmFtZS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBpZnJhbWUub25lcnJvciA9IGlmcmFtZS5vbmxvYWQgPSBudWxsO1xuICAgICAgICAvLyBPcGVyYSBtaW5pIGRvZXNuJ3QgbGlrZSBpZiB3ZSBHQyBpZnJhbWVcbiAgICAgICAgLy8gaW1tZWRpYXRlbHksIHRodXMgdGhpcyB0aW1lb3V0LlxuICAgICAgICB1dGlscy5kZWxheSg1MDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBpZnJhbWUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpZnJhbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICBpZnJhbWUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICBhcmVhLnZhbHVlID0gJyc7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfTtcbiAgICBpZnJhbWUub25lcnJvciA9IGlmcmFtZS5vbmxvYWQgPSBjb21wbGV0ZWQ7XG4gICAgaWZyYW1lLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGlmcmFtZS5yZWFkeVN0YXRlID09ICdjb21wbGV0ZScpIGNvbXBsZXRlZCgpO1xuICAgIH07XG4gICAgcmV0dXJuIGNvbXBsZXRlZDtcbn07XG5cbnZhciBjcmVhdGVBamF4U2VuZGVyID0gZnVuY3Rpb24oQWpheE9iamVjdCkge1xuICAgIHJldHVybiBmdW5jdGlvbih1cmwsIHBheWxvYWQsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciB4byA9IG5ldyBBamF4T2JqZWN0KCdQT1NUJywgdXJsICsgJy94aHJfc2VuZCcsIHBheWxvYWQpO1xuICAgICAgICB4by5vbmZpbmlzaCA9IGZ1bmN0aW9uKHN0YXR1cywgdGV4dCkge1xuICAgICAgICAgICAgY2FsbGJhY2soc3RhdHVzKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFib3J0X3JlYXNvbikge1xuICAgICAgICAgICAgY2FsbGJhY2soMCwgYWJvcnRfcmVhc29uKTtcbiAgICAgICAgfTtcbiAgICB9O1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtc2VuZGVyLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1qc29ucC1yZWNlaXZlci5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLy8gUGFydHMgZGVyaXZlZCBmcm9tIFNvY2tldC5pbzpcbi8vICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9MZWFybkJvb3N0L3NvY2tldC5pby9ibG9iLzAuNi4xNy9saWIvc29ja2V0LmlvL3RyYW5zcG9ydHMvanNvbnAtcG9sbGluZy5qc1xuLy8gYW5kIGpRdWVyeS1KU09OUDpcbi8vICAgIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvanF1ZXJ5LWpzb25wL3NvdXJjZS9icm93c2UvdHJ1bmsvY29yZS9qcXVlcnkuanNvbnAuanNcbnZhciBqc29uUEdlbmVyaWNSZWNlaXZlciA9IGZ1bmN0aW9uKHVybCwgY2FsbGJhY2spIHtcbiAgICB2YXIgdHJlZjtcbiAgICB2YXIgc2NyaXB0ID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgIHZhciBzY3JpcHQyOyAgLy8gT3BlcmEgc3luY2hyb25vdXMgbG9hZCB0cmljay5cbiAgICB2YXIgY2xvc2Vfc2NyaXB0ID0gZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgaWYgKHNjcmlwdDIpIHtcbiAgICAgICAgICAgIHNjcmlwdDIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQyKTtcbiAgICAgICAgICAgIHNjcmlwdDIgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY3JpcHQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0cmVmKTtcbiAgICAgICAgICAgIHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XG4gICAgICAgICAgICBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gc2NyaXB0Lm9uZXJyb3IgPVxuICAgICAgICAgICAgICAgIHNjcmlwdC5vbmxvYWQgPSBzY3JpcHQub25jbGljayA9IG51bGw7XG4gICAgICAgICAgICBzY3JpcHQgPSBudWxsO1xuICAgICAgICAgICAgY2FsbGJhY2soZnJhbWUpO1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIElFOSBmaXJlcyAnZXJyb3InIGV2ZW50IGFmdGVyIG9yc2Mgb3IgYmVmb3JlLCBpbiByYW5kb20gb3JkZXIuXG4gICAgdmFyIGxvYWRlZF9va2F5ID0gZmFsc2U7XG4gICAgdmFyIGVycm9yX3RpbWVyID0gbnVsbDtcblxuICAgIHNjcmlwdC5pZCA9ICdhJyArIHV0aWxzLnJhbmRvbV9zdHJpbmcoOCk7XG4gICAgc2NyaXB0LnNyYyA9IHVybDtcbiAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICAgIHNjcmlwdC5jaGFyc2V0ID0gJ1VURi04JztcbiAgICBzY3JpcHQub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCFlcnJvcl90aW1lcikge1xuICAgICAgICAgICAgLy8gRGVsYXkgZmlyaW5nIGNsb3NlX3NjcmlwdC5cbiAgICAgICAgICAgIGVycm9yX3RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWxvYWRlZF9va2F5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNsb3NlX3NjcmlwdCh1dGlscy5jbG9zZUZyYW1lKFxuICAgICAgICAgICAgICAgICAgICAgICAgMTAwNixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSlNPTlAgc2NyaXB0IGxvYWRlZCBhYm5vcm1hbGx5IChvbmVycm9yKVwiKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGNsb3NlX3NjcmlwdCh1dGlscy5jbG9zZUZyYW1lKDEwMDYsIFwiSlNPTlAgc2NyaXB0IGxvYWRlZCBhYm5vcm1hbGx5IChvbmxvYWQpXCIpKTtcbiAgICB9O1xuXG4gICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKC9sb2FkZWR8Y2xvc2VkLy50ZXN0KHNjcmlwdC5yZWFkeVN0YXRlKSkge1xuICAgICAgICAgICAgaWYgKHNjcmlwdCAmJiBzY3JpcHQuaHRtbEZvciAmJiBzY3JpcHQub25jbGljaykge1xuICAgICAgICAgICAgICAgIGxvYWRlZF9va2F5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJbiBJRSwgYWN0dWFsbHkgZXhlY3V0ZSB0aGUgc2NyaXB0LlxuICAgICAgICAgICAgICAgICAgICBzY3JpcHQub25jbGljaygpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKHgpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgY2xvc2Vfc2NyaXB0KHV0aWxzLmNsb3NlRnJhbWUoMTAwNiwgXCJKU09OUCBzY3JpcHQgbG9hZGVkIGFibm9ybWFsbHkgKG9ucmVhZHlzdGF0ZWNoYW5nZSlcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBJRTogZXZlbnQvaHRtbEZvci9vbmNsaWNrIHRyaWNrLlxuICAgIC8vIE9uZSBjYW4ndCByZWx5IG9uIHByb3BlciBvcmRlciBmb3Igb25yZWFkeXN0YXRlY2hhbmdlLiBJbiBvcmRlciB0b1xuICAgIC8vIG1ha2Ugc3VyZSwgc2V0IGEgJ2h0bWxGb3InIGFuZCAnZXZlbnQnIHByb3BlcnRpZXMsIHNvIHRoYXRcbiAgICAvLyBzY3JpcHQgY29kZSB3aWxsIGJlIGluc3RhbGxlZCBhcyAnb25jbGljaycgaGFuZGxlciBmb3IgdGhlXG4gICAgLy8gc2NyaXB0IG9iamVjdC4gTGF0ZXIsIG9ucmVhZHlzdGF0ZWNoYW5nZSwgbWFudWFsbHkgZXhlY3V0ZSB0aGlzXG4gICAgLy8gY29kZS4gRkYgYW5kIENocm9tZSBkb2Vzbid0IHdvcmsgd2l0aCAnZXZlbnQnIGFuZCAnaHRtbEZvcidcbiAgICAvLyBzZXQuIEZvciByZWZlcmVuY2Ugc2VlOlxuICAgIC8vICAgaHR0cDovL2phdWJvdXJnLm5ldC8yMDEwLzA3L2xvYWRpbmctc2NyaXB0LWFzLW9uY2xpY2staGFuZGxlci1vZi5odG1sXG4gICAgLy8gQWxzbywgcmVhZCBvbiB0aGF0IGFib3V0IHNjcmlwdCBvcmRlcmluZzpcbiAgICAvLyAgIGh0dHA6Ly93aWtpLndoYXR3Zy5vcmcvd2lraS9EeW5hbWljX1NjcmlwdF9FeGVjdXRpb25fT3JkZXJcbiAgICBpZiAodHlwZW9mIHNjcmlwdC5hc3luYyA9PT0gJ3VuZGVmaW5lZCcgJiYgX2RvY3VtZW50LmF0dGFjaEV2ZW50KSB7XG4gICAgICAgIC8vIEFjY29yZGluZyB0byBtb3ppbGxhIGRvY3MsIGluIHJlY2VudCBicm93c2VycyBzY3JpcHQuYXN5bmMgZGVmYXVsdHNcbiAgICAgICAgLy8gdG8gJ3RydWUnLCBzbyB3ZSBtYXkgdXNlIGl0IHRvIGRldGVjdCBhIGdvb2QgYnJvd3NlcjpcbiAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vSFRNTC9FbGVtZW50L3NjcmlwdFxuICAgICAgICBpZiAoIS9vcGVyYS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICAgIC8vIE5haXZlbHkgYXNzdW1lIHdlJ3JlIGluIElFXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHNjcmlwdC5odG1sRm9yID0gc2NyaXB0LmlkO1xuICAgICAgICAgICAgICAgIHNjcmlwdC5ldmVudCA9IFwib25jbGlja1wiO1xuICAgICAgICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgICAgICAgIHNjcmlwdC5hc3luYyA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPcGVyYSwgc2Vjb25kIHN5bmMgc2NyaXB0IGhhY2tcbiAgICAgICAgICAgIHNjcmlwdDIgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgICAgICBzY3JpcHQyLnRleHQgPSBcInRyeXt2YXIgYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdcIitzY3JpcHQuaWQrXCInKTsgaWYoYSlhLm9uZXJyb3IoKTt9Y2F0Y2goeCl7fTtcIjtcbiAgICAgICAgICAgIHNjcmlwdC5hc3luYyA9IHNjcmlwdDIuYXN5bmMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHNjcmlwdC5hc3luYyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBGYWxsYmFjayBtb3N0bHkgZm9yIEtvbnF1ZXJvciAtIHN0dXBpZCB0aW1lciwgMzUgc2Vjb25kcyBzaGFsbCBiZSBwbGVudHkuXG4gICAgdHJlZiA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsb3NlX3NjcmlwdCh1dGlscy5jbG9zZUZyYW1lKDEwMDYsIFwiSlNPTlAgc2NyaXB0IGxvYWRlZCBhYm5vcm1hbGx5ICh0aW1lb3V0KVwiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSwgMzUwMDApO1xuXG4gICAgdmFyIGhlYWQgPSBfZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICBoZWFkLmluc2VydEJlZm9yZShzY3JpcHQsIGhlYWQuZmlyc3RDaGlsZCk7XG4gICAgaWYgKHNjcmlwdDIpIHtcbiAgICAgICAgaGVhZC5pbnNlcnRCZWZvcmUoc2NyaXB0MiwgaGVhZC5maXJzdENoaWxkKTtcbiAgICB9XG4gICAgcmV0dXJuIGNsb3NlX3NjcmlwdDtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLWpzb25wLXJlY2VpdmVyLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1qc29ucC1wb2xsaW5nLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vLyBUaGUgc2ltcGxlc3QgYW5kIG1vc3Qgcm9idXN0IHRyYW5zcG9ydCwgdXNpbmcgdGhlIHdlbGwta25vdyBjcm9zc1xuLy8gZG9tYWluIGhhY2sgLSBKU09OUC4gVGhpcyB0cmFuc3BvcnQgaXMgcXVpdGUgaW5lZmZpY2llbnQgLSBvbmVcbi8vIG1zc2FnZSBjb3VsZCB1c2UgdXAgdG8gb25lIGh0dHAgcmVxdWVzdC4gQnV0IGF0IGxlYXN0IGl0IHdvcmtzIGFsbW9zdFxuLy8gZXZlcnl3aGVyZS5cbi8vIEtub3duIGxpbWl0YXRpb25zOlxuLy8gICBvIHlvdSB3aWxsIGdldCBhIHNwaW5uaW5nIGN1cnNvclxuLy8gICBvIGZvciBLb25xdWVyb3IgYSBkdW1iIHRpbWVyIGlzIG5lZWRlZCB0byBkZXRlY3QgZXJyb3JzXG5cblxudmFyIEpzb25QVHJhbnNwb3J0ID0gU29ja0pTWydqc29ucC1wb2xsaW5nJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdXRpbHMucG9sbHV0ZUdsb2JhbE5hbWVzcGFjZSgpO1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnJpID0gcmk7XG4gICAgdGhhdC50cmFuc191cmwgPSB0cmFuc191cmw7XG4gICAgdGhhdC5zZW5kX2NvbnN0cnVjdG9yKGpzb25QR2VuZXJpY1NlbmRlcik7XG4gICAgdGhhdC5fc2NoZWR1bGVfcmVjdigpO1xufTtcblxuLy8gSW5oZXJpdG5hY2Vcbkpzb25QVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBCdWZmZXJlZFNlbmRlcigpO1xuXG5Kc29uUFRyYW5zcG9ydC5wcm90b3R5cGUuX3NjaGVkdWxlX3JlY3YgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGF0Ll9yZWN2X3N0b3AgPSBudWxsO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgLy8gbm8gZGF0YSAtIGhlYXJ0YmVhdDtcbiAgICAgICAgICAgIGlmICghdGhhdC5faXNfY2xvc2luZykge1xuICAgICAgICAgICAgICAgIHRoYXQucmkuX2RpZE1lc3NhZ2UoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlIG1lc3NhZ2UgY2FuIGJlIGEgY2xvc2UgbWVzc2FnZSwgYW5kIGNoYW5nZSBpc19jbG9zaW5nIHN0YXRlLlxuICAgICAgICBpZiAoIXRoYXQuX2lzX2Nsb3NpbmcpIHtcbiAgICAgICAgICAgIHRoYXQuX3NjaGVkdWxlX3JlY3YoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhhdC5fcmVjdl9zdG9wID0ganNvblBSZWNlaXZlcldyYXBwZXIodGhhdC50cmFuc191cmwgKyAnL2pzb25wJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29uUEdlbmVyaWNSZWNlaXZlciwgY2FsbGJhY2spO1xufTtcblxuSnNvblBUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0cnVlO1xufTtcblxuSnNvblBUcmFuc3BvcnQubmVlZF9ib2R5ID0gdHJ1ZTtcblxuXG5Kc29uUFRyYW5zcG9ydC5wcm90b3R5cGUuZG9DbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQuX2lzX2Nsb3NpbmcgPSB0cnVlO1xuICAgIGlmICh0aGF0Ll9yZWN2X3N0b3ApIHtcbiAgICAgICAgdGhhdC5fcmVjdl9zdG9wKCk7XG4gICAgfVxuICAgIHRoYXQucmkgPSB0aGF0Ll9yZWN2X3N0b3AgPSBudWxsO1xuICAgIHRoYXQuc2VuZF9kZXN0cnVjdG9yKCk7XG59O1xuXG5cbi8vIEFic3RyYWN0IGF3YXkgY29kZSB0aGF0IGhhbmRsZXMgZ2xvYmFsIG5hbWVzcGFjZSBwb2xsdXRpb24uXG52YXIganNvblBSZWNlaXZlcldyYXBwZXIgPSBmdW5jdGlvbih1cmwsIGNvbnN0cnVjdFJlY2VpdmVyLCB1c2VyX2NhbGxiYWNrKSB7XG4gICAgdmFyIGlkID0gJ2EnICsgdXRpbHMucmFuZG9tX3N0cmluZyg2KTtcbiAgICB2YXIgdXJsX2lkID0gdXJsICsgJz9jPScgKyBlc2NhcGUoV1ByZWZpeCArICcuJyArIGlkKTtcbiAgICAvLyBDYWxsYmFjayB3aWxsIGJlIGNhbGxlZCBleGFjdGx5IG9uY2UuXG4gICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZnJhbWUpIHtcbiAgICAgICAgZGVsZXRlIF93aW5kb3dbV1ByZWZpeF1baWRdO1xuICAgICAgICB1c2VyX2NhbGxiYWNrKGZyYW1lKTtcbiAgICB9O1xuXG4gICAgdmFyIGNsb3NlX3NjcmlwdCA9IGNvbnN0cnVjdFJlY2VpdmVyKHVybF9pZCwgY2FsbGJhY2spO1xuICAgIF93aW5kb3dbV1ByZWZpeF1baWRdID0gY2xvc2Vfc2NyaXB0O1xuICAgIHZhciBzdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChfd2luZG93W1dQcmVmaXhdW2lkXSkge1xuICAgICAgICAgICAgX3dpbmRvd1tXUHJlZml4XVtpZF0odXRpbHMuY2xvc2VGcmFtZSgxMDAwLCBcIkpTT05QIHVzZXIgYWJvcnRlZCByZWFkXCIpKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIHN0b3A7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1qc29ucC1wb2xsaW5nLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy14aHIuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBBamF4QmFzZWRUcmFuc3BvcnQgPSBmdW5jdGlvbigpIHt9O1xuQWpheEJhc2VkVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBCdWZmZXJlZFNlbmRlcigpO1xuXG5BamF4QmFzZWRUcmFuc3BvcnQucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybF9zdWZmaXgsIFJlY2VpdmVyLCBBamF4T2JqZWN0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucmkgPSByaTtcbiAgICB0aGF0LnRyYW5zX3VybCA9IHRyYW5zX3VybDtcbiAgICB0aGF0LnNlbmRfY29uc3RydWN0b3IoY3JlYXRlQWpheFNlbmRlcihBamF4T2JqZWN0KSk7XG4gICAgdGhhdC5wb2xsID0gbmV3IFBvbGxpbmcocmksIFJlY2VpdmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zX3VybCArIHVybF9zdWZmaXgsIEFqYXhPYmplY3QpO1xufTtcblxuQWpheEJhc2VkVHJhbnNwb3J0LnByb3RvdHlwZS5kb0NsZWFudXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucG9sbCkge1xuICAgICAgICB0aGF0LnBvbGwuYWJvcnQoKTtcbiAgICAgICAgdGhhdC5wb2xsID0gbnVsbDtcbiAgICB9XG59O1xuXG4vLyB4aHItc3RyZWFtaW5nXG52YXIgWGhyU3RyZWFtaW5nVHJhbnNwb3J0ID0gU29ja0pTWyd4aHItc3RyZWFtaW5nJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy94aHJfc3RyZWFtaW5nJywgWGhyUmVjZWl2ZXIsIHV0aWxzLlhIUkNvcnNPYmplY3QpO1xufTtcblxuWGhyU3RyZWFtaW5nVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBBamF4QmFzZWRUcmFuc3BvcnQoKTtcblxuWGhyU3RyZWFtaW5nVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBTdXBwb3J0IGZvciBDT1JTIEFqYXggYWthIEFqYXgyPyBPcGVyYSAxMiBjbGFpbXMgQ09SUyBidXRcbiAgICAvLyBkb2Vzbid0IGRvIHN0cmVhbWluZy5cbiAgICByZXR1cm4gKF93aW5kb3cuWE1MSHR0cFJlcXVlc3QgJiZcbiAgICAgICAgICAgICd3aXRoQ3JlZGVudGlhbHMnIGluIG5ldyBYTUxIdHRwUmVxdWVzdCgpICYmXG4gICAgICAgICAgICAoIS9vcGVyYS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpKTtcbn07XG5YaHJTdHJlYW1pbmdUcmFuc3BvcnQucm91bmRUcmlwcyA9IDI7IC8vIHByZWZsaWdodCwgYWpheFxuXG4vLyBTYWZhcmkgZ2V0cyBjb25mdXNlZCB3aGVuIGEgc3RyZWFtaW5nIGFqYXggcmVxdWVzdCBpcyBzdGFydGVkXG4vLyBiZWZvcmUgb25sb2FkLiBUaGlzIGNhdXNlcyB0aGUgbG9hZCBpbmRpY2F0b3IgdG8gc3BpbiBpbmRlZmluZXRlbHkuXG5YaHJTdHJlYW1pbmdUcmFuc3BvcnQubmVlZF9ib2R5ID0gdHJ1ZTtcblxuXG4vLyBBY2NvcmRpbmcgdG86XG4vLyAgIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTY0MTUwNy9kZXRlY3QtYnJvd3Nlci1zdXBwb3J0LWZvci1jcm9zcy1kb21haW4teG1saHR0cHJlcXVlc3RzXG4vLyAgIGh0dHA6Ly9oYWNrcy5tb3ppbGxhLm9yZy8yMDA5LzA3L2Nyb3NzLXNpdGUteG1saHR0cHJlcXVlc3Qtd2l0aC1jb3JzL1xuXG5cbi8vIHhkci1zdHJlYW1pbmdcbnZhciBYZHJTdHJlYW1pbmdUcmFuc3BvcnQgPSBTb2NrSlNbJ3hkci1zdHJlYW1pbmcnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL3hocl9zdHJlYW1pbmcnLCBYaHJSZWNlaXZlciwgdXRpbHMuWERST2JqZWN0KTtcbn07XG5cblhkclN0cmVhbWluZ1RyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQWpheEJhc2VkVHJhbnNwb3J0KCk7XG5cblhkclN0cmVhbWluZ1RyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICEhX3dpbmRvdy5YRG9tYWluUmVxdWVzdDtcbn07XG5YZHJTdHJlYW1pbmdUcmFuc3BvcnQucm91bmRUcmlwcyA9IDI7IC8vIHByZWZsaWdodCwgYWpheFxuXG5cblxuLy8geGhyLXBvbGxpbmdcbnZhciBYaHJQb2xsaW5nVHJhbnNwb3J0ID0gU29ja0pTWyd4aHItcG9sbGluZyddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHRoaXMucnVuKHJpLCB0cmFuc191cmwsICcveGhyJywgWGhyUmVjZWl2ZXIsIHV0aWxzLlhIUkNvcnNPYmplY3QpO1xufTtcblxuWGhyUG9sbGluZ1RyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQWpheEJhc2VkVHJhbnNwb3J0KCk7XG5cblhoclBvbGxpbmdUcmFuc3BvcnQuZW5hYmxlZCA9IFhoclN0cmVhbWluZ1RyYW5zcG9ydC5lbmFibGVkO1xuWGhyUG9sbGluZ1RyYW5zcG9ydC5yb3VuZFRyaXBzID0gMjsgLy8gcHJlZmxpZ2h0LCBhamF4XG5cblxuLy8geGRyLXBvbGxpbmdcbnZhciBYZHJQb2xsaW5nVHJhbnNwb3J0ID0gU29ja0pTWyd4ZHItcG9sbGluZyddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHRoaXMucnVuKHJpLCB0cmFuc191cmwsICcveGhyJywgWGhyUmVjZWl2ZXIsIHV0aWxzLlhEUk9iamVjdCk7XG59O1xuXG5YZHJQb2xsaW5nVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBBamF4QmFzZWRUcmFuc3BvcnQoKTtcblxuWGRyUG9sbGluZ1RyYW5zcG9ydC5lbmFibGVkID0gWGRyU3RyZWFtaW5nVHJhbnNwb3J0LmVuYWJsZWQ7XG5YZHJQb2xsaW5nVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAyOyAvLyBwcmVmbGlnaHQsIGFqYXhcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMteGhyLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1pZnJhbWUuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbi8vIEZldyBjb29sIHRyYW5zcG9ydHMgZG8gd29yayBvbmx5IGZvciBzYW1lLW9yaWdpbi4gSW4gb3JkZXIgdG8gbWFrZVxuLy8gdGhlbSB3b3JraW5nIGNyb3NzLWRvbWFpbiB3ZSBzaGFsbCB1c2UgaWZyYW1lLCBzZXJ2ZWQgZm9ybSB0aGVcbi8vIHJlbW90ZSBkb21haW4uIE5ldyBicm93c2VycywgaGF2ZSBjYXBhYmlsaXRpZXMgdG8gY29tbXVuaWNhdGUgd2l0aFxuLy8gY3Jvc3MgZG9tYWluIGlmcmFtZSwgdXNpbmcgcG9zdE1lc3NhZ2UoKS4gSW4gSUUgaXQgd2FzIGltcGxlbWVudGVkXG4vLyBmcm9tIElFIDgrLCBidXQgb2YgY291cnNlLCBJRSBnb3Qgc29tZSBkZXRhaWxzIHdyb25nOlxuLy8gICAgaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2NjMTk3MDE1KHY9VlMuODUpLmFzcHhcbi8vICAgIGh0dHA6Ly9zdGV2ZXNvdWRlcnMuY29tL21pc2MvdGVzdC1wb3N0bWVzc2FnZS5waHBcblxudmFyIElmcmFtZVRyYW5zcG9ydCA9IGZ1bmN0aW9uKCkge307XG5cbklmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUuaV9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwsIGJhc2VfdXJsKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucmkgPSByaTtcbiAgICB0aGF0Lm9yaWdpbiA9IHV0aWxzLmdldE9yaWdpbihiYXNlX3VybCk7XG4gICAgdGhhdC5iYXNlX3VybCA9IGJhc2VfdXJsO1xuICAgIHRoYXQudHJhbnNfdXJsID0gdHJhbnNfdXJsO1xuXG4gICAgdmFyIGlmcmFtZV91cmwgPSBiYXNlX3VybCArICcvaWZyYW1lLmh0bWwnO1xuICAgIGlmICh0aGF0LnJpLl9vcHRpb25zLmRldmVsKSB7XG4gICAgICAgIGlmcmFtZV91cmwgKz0gJz90PScgKyAoK25ldyBEYXRlKTtcbiAgICB9XG4gICAgdGhhdC53aW5kb3dfaWQgPSB1dGlscy5yYW5kb21fc3RyaW5nKDgpO1xuICAgIGlmcmFtZV91cmwgKz0gJyMnICsgdGhhdC53aW5kb3dfaWQ7XG5cbiAgICB0aGF0LmlmcmFtZU9iaiA9IHV0aWxzLmNyZWF0ZUlmcmFtZShpZnJhbWVfdXJsLCBmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmkuX2RpZENsb3NlKDEwMDYsIFwiVW5hYmxlIHRvIGxvYWQgYW4gaWZyYW1lIChcIiArIHIgKyBcIilcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICB0aGF0Lm9ubWVzc2FnZV9jYiA9IHV0aWxzLmJpbmQodGhhdC5vbm1lc3NhZ2UsIHRoYXQpO1xuICAgIHV0aWxzLmF0dGFjaE1lc3NhZ2UodGhhdC5vbm1lc3NhZ2VfY2IpO1xufTtcblxuSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZS5kb0NsZWFudXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQuaWZyYW1lT2JqKSB7XG4gICAgICAgIHV0aWxzLmRldGFjaE1lc3NhZ2UodGhhdC5vbm1lc3NhZ2VfY2IpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB0aGUgaWZyYW1lIGlzIG5vdCBsb2FkZWQsIElFIHJhaXNlcyBhbiBleGNlcHRpb25cbiAgICAgICAgICAgIC8vIG9uICdjb250ZW50V2luZG93Jy5cbiAgICAgICAgICAgIGlmICh0aGF0LmlmcmFtZU9iai5pZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgICAgIHRoYXQucG9zdE1lc3NhZ2UoJ2MnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgICAgdGhhdC5pZnJhbWVPYmouY2xlYW51cCgpO1xuICAgICAgICB0aGF0LmlmcmFtZU9iaiA9IG51bGw7XG4gICAgICAgIHRoYXQub25tZXNzYWdlX2NiID0gdGhhdC5pZnJhbWVPYmogPSBudWxsO1xuICAgIH1cbn07XG5cbklmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAoZS5vcmlnaW4gIT09IHRoYXQub3JpZ2luKSByZXR1cm47XG4gICAgdmFyIHdpbmRvd19pZCA9IGUuZGF0YS5zbGljZSgwLCA4KTtcbiAgICB2YXIgdHlwZSA9IGUuZGF0YS5zbGljZSg4LCA5KTtcbiAgICB2YXIgZGF0YSA9IGUuZGF0YS5zbGljZSg5KTtcblxuICAgIGlmICh3aW5kb3dfaWQgIT09IHRoYXQud2luZG93X2lkKSByZXR1cm47XG5cbiAgICBzd2l0Y2godHlwZSkge1xuICAgIGNhc2UgJ3MnOlxuICAgICAgICB0aGF0LmlmcmFtZU9iai5sb2FkZWQoKTtcbiAgICAgICAgdGhhdC5wb3N0TWVzc2FnZSgncycsIEpTT04uc3RyaW5naWZ5KFtTb2NrSlMudmVyc2lvbiwgdGhhdC5wcm90b2NvbCwgdGhhdC50cmFuc191cmwsIHRoYXQuYmFzZV91cmxdKSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3QnOlxuICAgICAgICB0aGF0LnJpLl9kaWRNZXNzYWdlKGRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5JZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlLnBvc3RNZXNzYWdlID0gZnVuY3Rpb24odHlwZSwgZGF0YSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LmlmcmFtZU9iai5wb3N0KHRoYXQud2luZG93X2lkICsgdHlwZSArIChkYXRhIHx8ICcnKSwgdGhhdC5vcmlnaW4pO1xufTtcblxuSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZS5kb1NlbmQgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIHRoaXMucG9zdE1lc3NhZ2UoJ20nLCBtZXNzYWdlKTtcbn07XG5cbklmcmFtZVRyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gcG9zdE1lc3NhZ2UgbWlzYmVoYXZlcyBpbiBrb25xdWVyb3IgNC42LjUgLSB0aGUgbWVzc2FnZXMgYXJlIGRlbGl2ZXJlZCB3aXRoXG4gICAgLy8gaHVnZSBkZWxheSwgb3Igbm90IGF0IGFsbC5cbiAgICB2YXIga29ucXVlcm9yID0gbmF2aWdhdG9yICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdLb25xdWVyb3InKSAhPT0gLTE7XG4gICAgcmV0dXJuICgodHlwZW9mIF93aW5kb3cucG9zdE1lc3NhZ2UgPT09ICdmdW5jdGlvbicgfHxcbiAgICAgICAgICAgIHR5cGVvZiBfd2luZG93LnBvc3RNZXNzYWdlID09PSAnb2JqZWN0JykgJiYgKCFrb25xdWVyb3IpKTtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLWlmcmFtZS5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtaWZyYW1lLXdpdGhpbi5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIGN1cnJfd2luZG93X2lkO1xuXG52YXIgcG9zdE1lc3NhZ2UgPSBmdW5jdGlvbiAodHlwZSwgZGF0YSkge1xuICAgIGlmKHBhcmVudCAhPT0gX3dpbmRvdykge1xuICAgICAgICBwYXJlbnQucG9zdE1lc3NhZ2UoY3Vycl93aW5kb3dfaWQgKyB0eXBlICsgKGRhdGEgfHwgJycpLCAnKicpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWxzLmxvZyhcIkNhbid0IHBvc3RNZXNzYWdlLCBubyBwYXJlbnQgd2luZG93LlwiLCB0eXBlLCBkYXRhKTtcbiAgICB9XG59O1xuXG52YXIgRmFjYWRlSlMgPSBmdW5jdGlvbigpIHt9O1xuRmFjYWRlSlMucHJvdG90eXBlLl9kaWRDbG9zZSA9IGZ1bmN0aW9uIChjb2RlLCByZWFzb24pIHtcbiAgICBwb3N0TWVzc2FnZSgndCcsIHV0aWxzLmNsb3NlRnJhbWUoY29kZSwgcmVhc29uKSk7XG59O1xuRmFjYWRlSlMucHJvdG90eXBlLl9kaWRNZXNzYWdlID0gZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgcG9zdE1lc3NhZ2UoJ3QnLCBmcmFtZSk7XG59O1xuRmFjYWRlSlMucHJvdG90eXBlLl9kb1NlbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHRoaXMuX3RyYW5zcG9ydC5kb1NlbmQoZGF0YSk7XG59O1xuRmFjYWRlSlMucHJvdG90eXBlLl9kb0NsZWFudXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fdHJhbnNwb3J0LmRvQ2xlYW51cCgpO1xufTtcblxudXRpbHMucGFyZW50X29yaWdpbiA9IHVuZGVmaW5lZDtcblxuU29ja0pTLmJvb3RzdHJhcF9pZnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZmFjYWRlO1xuICAgIGN1cnJfd2luZG93X2lkID0gX2RvY3VtZW50LmxvY2F0aW9uLmhhc2guc2xpY2UoMSk7XG4gICAgdmFyIG9uTWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYoZS5zb3VyY2UgIT09IHBhcmVudCkgcmV0dXJuO1xuICAgICAgICBpZih0eXBlb2YgdXRpbHMucGFyZW50X29yaWdpbiA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICB1dGlscy5wYXJlbnRfb3JpZ2luID0gZS5vcmlnaW47XG4gICAgICAgIGlmIChlLm9yaWdpbiAhPT0gdXRpbHMucGFyZW50X29yaWdpbikgcmV0dXJuO1xuXG4gICAgICAgIHZhciB3aW5kb3dfaWQgPSBlLmRhdGEuc2xpY2UoMCwgOCk7XG4gICAgICAgIHZhciB0eXBlID0gZS5kYXRhLnNsaWNlKDgsIDkpO1xuICAgICAgICB2YXIgZGF0YSA9IGUuZGF0YS5zbGljZSg5KTtcbiAgICAgICAgaWYgKHdpbmRvd19pZCAhPT0gY3Vycl93aW5kb3dfaWQpIHJldHVybjtcbiAgICAgICAgc3dpdGNoKHR5cGUpIHtcbiAgICAgICAgY2FzZSAncyc6XG4gICAgICAgICAgICB2YXIgcCA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICB2YXIgdmVyc2lvbiA9IHBbMF07XG4gICAgICAgICAgICB2YXIgcHJvdG9jb2wgPSBwWzFdO1xuICAgICAgICAgICAgdmFyIHRyYW5zX3VybCA9IHBbMl07XG4gICAgICAgICAgICB2YXIgYmFzZV91cmwgPSBwWzNdO1xuICAgICAgICAgICAgaWYgKHZlcnNpb24gIT09IFNvY2tKUy52ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMubG9nKFwiSW5jb21wYXRpYmlsZSBTb2NrSlMhIE1haW4gc2l0ZSB1c2VzOlwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXFxcIlwiICsgdmVyc2lvbiArIFwiXFxcIiwgdGhlIGlmcmFtZTpcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFxcXCJcIiArIFNvY2tKUy52ZXJzaW9uICsgXCJcXFwiLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdXRpbHMuZmxhdFVybCh0cmFuc191cmwpIHx8ICF1dGlscy5mbGF0VXJsKGJhc2VfdXJsKSkge1xuICAgICAgICAgICAgICAgIHV0aWxzLmxvZyhcIk9ubHkgYmFzaWMgdXJscyBhcmUgc3VwcG9ydGVkIGluIFNvY2tKU1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdXRpbHMuaXNTYW1lT3JpZ2luVXJsKHRyYW5zX3VybCkgfHxcbiAgICAgICAgICAgICAgICAhdXRpbHMuaXNTYW1lT3JpZ2luVXJsKGJhc2VfdXJsKSkge1xuICAgICAgICAgICAgICAgIHV0aWxzLmxvZyhcIkNhbid0IGNvbm5lY3QgdG8gZGlmZmVyZW50IGRvbWFpbiBmcm9tIHdpdGhpbiBhbiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWZyYW1lLiAoXCIgKyBKU09OLnN0cmluZ2lmeShbX3dpbmRvdy5sb2NhdGlvbi5ocmVmLCB0cmFuc191cmwsIGJhc2VfdXJsXSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBcIilcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmFjYWRlID0gbmV3IEZhY2FkZUpTKCk7XG4gICAgICAgICAgICBmYWNhZGUuX3RyYW5zcG9ydCA9IG5ldyBGYWNhZGVKU1twcm90b2NvbF0oZmFjYWRlLCB0cmFuc191cmwsIGJhc2VfdXJsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgICAgIGZhY2FkZS5fZG9TZW5kKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2MnOlxuICAgICAgICAgICAgaWYgKGZhY2FkZSlcbiAgICAgICAgICAgICAgICBmYWNhZGUuX2RvQ2xlYW51cCgpO1xuICAgICAgICAgICAgZmFjYWRlID0gbnVsbDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIGFsZXJ0KCd0ZXN0IHRpY2tlcicpO1xuICAgIC8vIGZhY2FkZSA9IG5ldyBGYWNhZGVKUygpO1xuICAgIC8vIGZhY2FkZS5fdHJhbnNwb3J0ID0gbmV3IEZhY2FkZUpTWyd3LWlmcmFtZS14aHItcG9sbGluZyddKGZhY2FkZSwgJ2h0dHA6Ly9ob3N0LmNvbTo5OTk5L3RpY2tlci8xMi9iYXNkJyk7XG5cbiAgICB1dGlscy5hdHRhY2hNZXNzYWdlKG9uTWVzc2FnZSk7XG5cbiAgICAvLyBTdGFydFxuICAgIHBvc3RNZXNzYWdlKCdzJyk7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1pZnJhbWUtd2l0aGluLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi9pbmZvLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgSW5mb1JlY2VpdmVyID0gZnVuY3Rpb24oYmFzZV91cmwsIEFqYXhPYmplY3QpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdXRpbHMuZGVsYXkoZnVuY3Rpb24oKXt0aGF0LmRvWGhyKGJhc2VfdXJsLCBBamF4T2JqZWN0KTt9KTtcbn07XG5cbkluZm9SZWNlaXZlci5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKFsnZmluaXNoJ10pO1xuXG5JbmZvUmVjZWl2ZXIucHJvdG90eXBlLmRvWGhyID0gZnVuY3Rpb24oYmFzZV91cmwsIEFqYXhPYmplY3QpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHQwID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICB2YXIgeG8gPSBuZXcgQWpheE9iamVjdCgnR0VUJywgYmFzZV91cmwgKyAnL2luZm8nKTtcblxuICAgIHZhciB0cmVmID0gdXRpbHMuZGVsYXkoODAwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCl7eG8ub250aW1lb3V0KCk7fSk7XG5cbiAgICB4by5vbmZpbmlzaCA9IGZ1bmN0aW9uKHN0YXR1cywgdGV4dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodHJlZik7XG4gICAgICAgIHRyZWYgPSBudWxsO1xuICAgICAgICBpZiAoc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIHZhciBydHQgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpIC0gdDA7XG4gICAgICAgICAgICB2YXIgaW5mbyA9IEpTT04ucGFyc2UodGV4dCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGluZm8gIT09ICdvYmplY3QnKSBpbmZvID0ge307XG4gICAgICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIGluZm8sIHJ0dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB4by5vbnRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgeG8uY2xvc2UoKTtcbiAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnKTtcbiAgICB9O1xufTtcblxudmFyIEluZm9SZWNlaXZlcklmcmFtZSA9IGZ1bmN0aW9uKGJhc2VfdXJsKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBnbyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaWZyID0gbmV3IElmcmFtZVRyYW5zcG9ydCgpO1xuICAgICAgICBpZnIucHJvdG9jb2wgPSAndy1pZnJhbWUtaW5mby1yZWNlaXZlcic7XG4gICAgICAgIHZhciBmdW4gPSBmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdzdHJpbmcnICYmIHIuc3Vic3RyKDAsMSkgPT09ICdtJykge1xuICAgICAgICAgICAgICAgIHZhciBkID0gSlNPTi5wYXJzZShyLnN1YnN0cigxKSk7XG4gICAgICAgICAgICAgICAgdmFyIGluZm8gPSBkWzBdLCBydHQgPSBkWzFdO1xuICAgICAgICAgICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJywgaW5mbywgcnR0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmci5kb0NsZWFudXAoKTtcbiAgICAgICAgICAgIGlmciA9IG51bGw7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBtb2NrX3JpID0ge1xuICAgICAgICAgICAgX29wdGlvbnM6IHt9LFxuICAgICAgICAgICAgX2RpZENsb3NlOiBmdW4sXG4gICAgICAgICAgICBfZGlkTWVzc2FnZTogZnVuXG4gICAgICAgIH07XG4gICAgICAgIGlmci5pX2NvbnN0cnVjdG9yKG1vY2tfcmksIGJhc2VfdXJsLCBiYXNlX3VybCk7XG4gICAgfVxuICAgIGlmKCFfZG9jdW1lbnQuYm9keSkge1xuICAgICAgICB1dGlscy5hdHRhY2hFdmVudCgnbG9hZCcsIGdvKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBnbygpO1xuICAgIH1cbn07XG5JbmZvUmVjZWl2ZXJJZnJhbWUucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcihbJ2ZpbmlzaCddKTtcblxuXG52YXIgSW5mb1JlY2VpdmVyRmFrZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIEl0IG1heSBub3QgYmUgcG9zc2libGUgdG8gZG8gY3Jvc3MgZG9tYWluIEFKQVggdG8gZ2V0IHRoZSBpbmZvXG4gICAgLy8gZGF0YSwgZm9yIGV4YW1wbGUgZm9yIElFNy4gQnV0IHdlIHdhbnQgdG8gcnVuIEpTT05QLCBzbyBsZXQnc1xuICAgIC8vIGZha2UgdGhlIHJlc3BvbnNlLCB3aXRoIHJ0dD0ycyAocnRvPTZzKS5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdXRpbHMuZGVsYXkoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJywge30sIDIwMDApO1xuICAgIH0pO1xufTtcbkluZm9SZWNlaXZlckZha2UucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcihbJ2ZpbmlzaCddKTtcblxudmFyIGNyZWF0ZUluZm9SZWNlaXZlciA9IGZ1bmN0aW9uKGJhc2VfdXJsKSB7XG4gICAgaWYgKHV0aWxzLmlzU2FtZU9yaWdpblVybChiYXNlX3VybCkpIHtcbiAgICAgICAgLy8gSWYsIGZvciBzb21lIHJlYXNvbiwgd2UgaGF2ZSBTb2NrSlMgbG9jYWxseSAtIHRoZXJlJ3Mgbm9cbiAgICAgICAgLy8gbmVlZCB0byBzdGFydCB1cCB0aGUgY29tcGxleCBtYWNoaW5lcnkuIEp1c3QgdXNlIGFqYXguXG4gICAgICAgIHJldHVybiBuZXcgSW5mb1JlY2VpdmVyKGJhc2VfdXJsLCB1dGlscy5YSFJMb2NhbE9iamVjdCk7XG4gICAgfVxuICAgIHN3aXRjaCAodXRpbHMuaXNYSFJDb3JzQ2FwYWJsZSgpKSB7XG4gICAgY2FzZSAxOlxuICAgICAgICByZXR1cm4gbmV3IEluZm9SZWNlaXZlcihiYXNlX3VybCwgdXRpbHMuWEhSQ29yc09iamVjdCk7XG4gICAgY2FzZSAyOlxuICAgICAgICByZXR1cm4gbmV3IEluZm9SZWNlaXZlcihiYXNlX3VybCwgdXRpbHMuWERST2JqZWN0KTtcbiAgICBjYXNlIDM6XG4gICAgICAgIC8vIE9wZXJhXG4gICAgICAgIHJldHVybiBuZXcgSW5mb1JlY2VpdmVySWZyYW1lKGJhc2VfdXJsKTtcbiAgICBkZWZhdWx0OlxuICAgICAgICAvLyBJRSA3XG4gICAgICAgIHJldHVybiBuZXcgSW5mb1JlY2VpdmVyRmFrZSgpO1xuICAgIH07XG59O1xuXG5cbnZhciBXSW5mb1JlY2VpdmVySWZyYW1lID0gRmFjYWRlSlNbJ3ctaWZyYW1lLWluZm8tcmVjZWl2ZXInXSA9IGZ1bmN0aW9uKHJpLCBfdHJhbnNfdXJsLCBiYXNlX3VybCkge1xuICAgIHZhciBpciA9IG5ldyBJbmZvUmVjZWl2ZXIoYmFzZV91cmwsIHV0aWxzLlhIUkxvY2FsT2JqZWN0KTtcbiAgICBpci5vbmZpbmlzaCA9IGZ1bmN0aW9uKGluZm8sIHJ0dCkge1xuICAgICAgICByaS5fZGlkTWVzc2FnZSgnbScrSlNPTi5zdHJpbmdpZnkoW2luZm8sIHJ0dF0pKTtcbiAgICAgICAgcmkuX2RpZENsb3NlKCk7XG4gICAgfVxufTtcbldJbmZvUmVjZWl2ZXJJZnJhbWUucHJvdG90eXBlLmRvQ2xlYW51cCA9IGZ1bmN0aW9uKCkge307XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL2luZm8uanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWlmcmFtZS1ldmVudHNvdXJjZS5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIEV2ZW50U291cmNlSWZyYW1lVHJhbnNwb3J0ID0gU29ja0pTWydpZnJhbWUtZXZlbnRzb3VyY2UnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5wcm90b2NvbCA9ICd3LWlmcmFtZS1ldmVudHNvdXJjZSc7XG4gICAgdGhhdC5pX2NvbnN0cnVjdG9yLmFwcGx5KHRoYXQsIGFyZ3VtZW50cyk7XG59O1xuXG5FdmVudFNvdXJjZUlmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgSWZyYW1lVHJhbnNwb3J0KCk7XG5cbkV2ZW50U291cmNlSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICgnRXZlbnRTb3VyY2UnIGluIF93aW5kb3cpICYmIElmcmFtZVRyYW5zcG9ydC5lbmFibGVkKCk7XG59O1xuXG5FdmVudFNvdXJjZUlmcmFtZVRyYW5zcG9ydC5uZWVkX2JvZHkgPSB0cnVlO1xuRXZlbnRTb3VyY2VJZnJhbWVUcmFuc3BvcnQucm91bmRUcmlwcyA9IDM7IC8vIGh0bWwsIGphdmFzY3JpcHQsIGV2ZW50c291cmNlXG5cblxuLy8gdy1pZnJhbWUtZXZlbnRzb3VyY2VcbnZhciBFdmVudFNvdXJjZVRyYW5zcG9ydCA9IEZhY2FkZUpTWyd3LWlmcmFtZS1ldmVudHNvdXJjZSddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHRoaXMucnVuKHJpLCB0cmFuc191cmwsICcvZXZlbnRzb3VyY2UnLCBFdmVudFNvdXJjZVJlY2VpdmVyLCB1dGlscy5YSFJMb2NhbE9iamVjdCk7XG59XG5FdmVudFNvdXJjZVRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQWpheEJhc2VkVHJhbnNwb3J0KCk7XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLWlmcmFtZS1ldmVudHNvdXJjZS5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtaWZyYW1lLXhoci1wb2xsaW5nLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgWGhyUG9sbGluZ0lmcmFtZVRyYW5zcG9ydCA9IFNvY2tKU1snaWZyYW1lLXhoci1wb2xsaW5nJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucHJvdG9jb2wgPSAndy1pZnJhbWUteGhyLXBvbGxpbmcnO1xuICAgIHRoYXQuaV9jb25zdHJ1Y3Rvci5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xufTtcblxuWGhyUG9sbGluZ0lmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgSWZyYW1lVHJhbnNwb3J0KCk7XG5cblhoclBvbGxpbmdJZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gX3dpbmRvdy5YTUxIdHRwUmVxdWVzdCAmJiBJZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCgpO1xufTtcblxuWGhyUG9sbGluZ0lmcmFtZVRyYW5zcG9ydC5uZWVkX2JvZHkgPSB0cnVlO1xuWGhyUG9sbGluZ0lmcmFtZVRyYW5zcG9ydC5yb3VuZFRyaXBzID0gMzsgLy8gaHRtbCwgamF2YXNjcmlwdCwgeGhyXG5cblxuLy8gdy1pZnJhbWUteGhyLXBvbGxpbmdcbnZhciBYaHJQb2xsaW5nSVRyYW5zcG9ydCA9IEZhY2FkZUpTWyd3LWlmcmFtZS14aHItcG9sbGluZyddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHRoaXMucnVuKHJpLCB0cmFuc191cmwsICcveGhyJywgWGhyUmVjZWl2ZXIsIHV0aWxzLlhIUkxvY2FsT2JqZWN0KTtcbn07XG5cblhoclBvbGxpbmdJVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBBamF4QmFzZWRUcmFuc3BvcnQoKTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtaWZyYW1lLXhoci1wb2xsaW5nLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1pZnJhbWUtaHRtbGZpbGUuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbi8vIFRoaXMgdHJhbnNwb3J0IGdlbmVyYWxseSB3b3JrcyBpbiBhbnkgYnJvd3NlciwgYnV0IHdpbGwgY2F1c2UgYVxuLy8gc3Bpbm5pbmcgY3Vyc29yIHRvIGFwcGVhciBpbiBhbnkgYnJvd3NlciBvdGhlciB0aGFuIElFLlxuLy8gV2UgbWF5IHRlc3QgdGhpcyB0cmFuc3BvcnQgaW4gYWxsIGJyb3dzZXJzIC0gd2h5IG5vdCwgYnV0IGluXG4vLyBwcm9kdWN0aW9uIGl0IHNob3VsZCBiZSBvbmx5IHJ1biBpbiBJRS5cblxudmFyIEh0bWxGaWxlSWZyYW1lVHJhbnNwb3J0ID0gU29ja0pTWydpZnJhbWUtaHRtbGZpbGUnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5wcm90b2NvbCA9ICd3LWlmcmFtZS1odG1sZmlsZSc7XG4gICAgdGhhdC5pX2NvbnN0cnVjdG9yLmFwcGx5KHRoYXQsIGFyZ3VtZW50cyk7XG59O1xuXG4vLyBJbmhlcml0YW5jZS5cbkh0bWxGaWxlSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBJZnJhbWVUcmFuc3BvcnQoKTtcblxuSHRtbEZpbGVJZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBJZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCgpO1xufTtcblxuSHRtbEZpbGVJZnJhbWVUcmFuc3BvcnQubmVlZF9ib2R5ID0gdHJ1ZTtcbkh0bWxGaWxlSWZyYW1lVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAzOyAvLyBodG1sLCBqYXZhc2NyaXB0LCBodG1sZmlsZVxuXG5cbi8vIHctaWZyYW1lLWh0bWxmaWxlXG52YXIgSHRtbEZpbGVUcmFuc3BvcnQgPSBGYWNhZGVKU1sndy1pZnJhbWUtaHRtbGZpbGUnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL2h0bWxmaWxlJywgSHRtbGZpbGVSZWNlaXZlciwgdXRpbHMuWEhSTG9jYWxPYmplY3QpO1xufTtcbkh0bWxGaWxlVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBBamF4QmFzZWRUcmFuc3BvcnQoKTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtaWZyYW1lLWh0bWxmaWxlLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1wb2xsaW5nLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgUG9sbGluZyA9IGZ1bmN0aW9uKHJpLCBSZWNlaXZlciwgcmVjdl91cmwsIEFqYXhPYmplY3QpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5yaSA9IHJpO1xuICAgIHRoYXQuUmVjZWl2ZXIgPSBSZWNlaXZlcjtcbiAgICB0aGF0LnJlY3ZfdXJsID0gcmVjdl91cmw7XG4gICAgdGhhdC5BamF4T2JqZWN0ID0gQWpheE9iamVjdDtcbiAgICB0aGF0Ll9zY2hlZHVsZVJlY3YoKTtcbn07XG5cblBvbGxpbmcucHJvdG90eXBlLl9zY2hlZHVsZVJlY3YgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHBvbGwgPSB0aGF0LnBvbGwgPSBuZXcgdGhhdC5SZWNlaXZlcih0aGF0LnJlY3ZfdXJsLCB0aGF0LkFqYXhPYmplY3QpO1xuICAgIHZhciBtc2dfY291bnRlciA9IDA7XG4gICAgcG9sbC5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIG1zZ19jb3VudGVyICs9IDE7XG4gICAgICAgIHRoYXQucmkuX2RpZE1lc3NhZ2UoZS5kYXRhKTtcbiAgICB9O1xuICAgIHBvbGwub25jbG9zZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhhdC5wb2xsID0gcG9sbCA9IHBvbGwub25tZXNzYWdlID0gcG9sbC5vbmNsb3NlID0gbnVsbDtcbiAgICAgICAgaWYgKCF0aGF0LnBvbGxfaXNfY2xvc2luZykge1xuICAgICAgICAgICAgaWYgKGUucmVhc29uID09PSAncGVybWFuZW50Jykge1xuICAgICAgICAgICAgICAgIHRoYXQucmkuX2RpZENsb3NlKDEwMDYsICdQb2xsaW5nIGVycm9yICgnICsgZS5yZWFzb24gKyAnKScpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGF0Ll9zY2hlZHVsZVJlY3YoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59O1xuXG5Qb2xsaW5nLnByb3RvdHlwZS5hYm9ydCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnBvbGxfaXNfY2xvc2luZyA9IHRydWU7XG4gICAgaWYgKHRoYXQucG9sbCkge1xuICAgICAgICB0aGF0LnBvbGwuYWJvcnQoKTtcbiAgICB9XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1wb2xsaW5nLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1yZWNlaXZlci1ldmVudHNvdXJjZS5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIEV2ZW50U291cmNlUmVjZWl2ZXIgPSBmdW5jdGlvbih1cmwpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGVzID0gbmV3IEV2ZW50U291cmNlKHVybCk7XG4gICAgZXMub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdtZXNzYWdlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7J2RhdGEnOiB1bmVzY2FwZShlLmRhdGEpfSkpO1xuICAgIH07XG4gICAgdGhhdC5lc19jbG9zZSA9IGVzLm9uZXJyb3IgPSBmdW5jdGlvbihlLCBhYm9ydF9yZWFzb24pIHtcbiAgICAgICAgLy8gRVMgb24gcmVjb25uZWN0aW9uIGhhcyByZWFkeVN0YXRlID0gMCBvciAxLlxuICAgICAgICAvLyBvbiBuZXR3b3JrIGVycm9yIGl0J3MgQ0xPU0VEID0gMlxuICAgICAgICB2YXIgcmVhc29uID0gYWJvcnRfcmVhc29uID8gJ3VzZXInIDpcbiAgICAgICAgICAgIChlcy5yZWFkeVN0YXRlICE9PSAyID8gJ25ldHdvcmsnIDogJ3Blcm1hbmVudCcpO1xuICAgICAgICB0aGF0LmVzX2Nsb3NlID0gZXMub25tZXNzYWdlID0gZXMub25lcnJvciA9IG51bGw7XG4gICAgICAgIC8vIEV2ZW50U291cmNlIHJlY29ubmVjdHMgYXV0b21hdGljYWxseS5cbiAgICAgICAgZXMuY2xvc2UoKTtcbiAgICAgICAgZXMgPSBudWxsO1xuICAgICAgICAvLyBTYWZhcmkgYW5kIGNocm9tZSA8IDE1IGNyYXNoIGlmIHdlIGNsb3NlIHdpbmRvdyBiZWZvcmVcbiAgICAgICAgLy8gd2FpdGluZyBmb3IgRVMgY2xlYW51cC4gU2VlOlxuICAgICAgICAvLyAgIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD04OTE1NVxuICAgICAgICB1dGlscy5kZWxheSgyMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnY2xvc2UnLCB7cmVhc29uOiByZWFzb259KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIH07XG59O1xuXG5FdmVudFNvdXJjZVJlY2VpdmVyLnByb3RvdHlwZSA9IG5ldyBSRXZlbnRUYXJnZXQoKTtcblxuRXZlbnRTb3VyY2VSZWNlaXZlci5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQuZXNfY2xvc2UpIHtcbiAgICAgICAgdGhhdC5lc19jbG9zZSh7fSwgdHJ1ZSk7XG4gICAgfVxufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtcmVjZWl2ZXItZXZlbnRzb3VyY2UuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLXJlY2VpdmVyLWh0bWxmaWxlLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgX2lzX2llX2h0bWxmaWxlX2NhcGFibGU7XG52YXIgaXNJZUh0bWxmaWxlQ2FwYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChfaXNfaWVfaHRtbGZpbGVfY2FwYWJsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICgnQWN0aXZlWE9iamVjdCcgaW4gX3dpbmRvdykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBfaXNfaWVfaHRtbGZpbGVfY2FwYWJsZSA9ICEhbmV3IEFjdGl2ZVhPYmplY3QoJ2h0bWxmaWxlJyk7XG4gICAgICAgICAgICB9IGNhdGNoICh4KSB7fVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2lzX2llX2h0bWxmaWxlX2NhcGFibGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gX2lzX2llX2h0bWxmaWxlX2NhcGFibGU7XG59O1xuXG5cbnZhciBIdG1sZmlsZVJlY2VpdmVyID0gZnVuY3Rpb24odXJsKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHV0aWxzLnBvbGx1dGVHbG9iYWxOYW1lc3BhY2UoKTtcblxuICAgIHRoYXQuaWQgPSAnYScgKyB1dGlscy5yYW5kb21fc3RyaW5nKDYsIDI2KTtcbiAgICB1cmwgKz0gKCh1cmwuaW5kZXhPZignPycpID09PSAtMSkgPyAnPycgOiAnJicpICtcbiAgICAgICAgJ2M9JyArIGVzY2FwZShXUHJlZml4ICsgJy4nICsgdGhhdC5pZCk7XG5cbiAgICB2YXIgY29uc3RydWN0b3IgPSBpc0llSHRtbGZpbGVDYXBhYmxlKCkgP1xuICAgICAgICB1dGlscy5jcmVhdGVIdG1sZmlsZSA6IHV0aWxzLmNyZWF0ZUlmcmFtZTtcblxuICAgIHZhciBpZnJhbWVPYmo7XG4gICAgX3dpbmRvd1tXUHJlZml4XVt0aGF0LmlkXSA9IHtcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmcmFtZU9iai5sb2FkZWQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgbWVzc2FnZTogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ21lc3NhZ2UnLCB7J2RhdGEnOiBkYXRhfSkpO1xuICAgICAgICB9LFxuICAgICAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGF0LmlmcmFtZV9jbG9zZSh7fSwgJ25ldHdvcmsnKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhhdC5pZnJhbWVfY2xvc2UgPSBmdW5jdGlvbihlLCBhYm9ydF9yZWFzb24pIHtcbiAgICAgICAgaWZyYW1lT2JqLmNsZWFudXAoKTtcbiAgICAgICAgdGhhdC5pZnJhbWVfY2xvc2UgPSBpZnJhbWVPYmogPSBudWxsO1xuICAgICAgICBkZWxldGUgX3dpbmRvd1tXUHJlZml4XVt0aGF0LmlkXTtcbiAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnY2xvc2UnLCB7cmVhc29uOiBhYm9ydF9yZWFzb259KSk7XG4gICAgfTtcbiAgICBpZnJhbWVPYmogPSBjb25zdHJ1Y3Rvcih1cmwsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5pZnJhbWVfY2xvc2Uoe30sICdwZXJtYW5lbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbn07XG5cbkh0bWxmaWxlUmVjZWl2ZXIucHJvdG90eXBlID0gbmV3IFJFdmVudFRhcmdldCgpO1xuXG5IdG1sZmlsZVJlY2VpdmVyLnByb3RvdHlwZS5hYm9ydCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5pZnJhbWVfY2xvc2UpIHtcbiAgICAgICAgdGhhdC5pZnJhbWVfY2xvc2Uoe30sICd1c2VyJyk7XG4gICAgfVxufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtcmVjZWl2ZXItaHRtbGZpbGUuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLXJlY2VpdmVyLXhoci5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIFhoclJlY2VpdmVyID0gZnVuY3Rpb24odXJsLCBBamF4T2JqZWN0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBidWZfcG9zID0gMDtcblxuICAgIHRoYXQueG8gPSBuZXcgQWpheE9iamVjdCgnUE9TVCcsIHVybCwgbnVsbCk7XG4gICAgdGhhdC54by5vbmNodW5rID0gZnVuY3Rpb24oc3RhdHVzLCB0ZXh0KSB7XG4gICAgICAgIGlmIChzdGF0dXMgIT09IDIwMCkgcmV0dXJuO1xuICAgICAgICB3aGlsZSAoMSkge1xuICAgICAgICAgICAgdmFyIGJ1ZiA9IHRleHQuc2xpY2UoYnVmX3Bvcyk7XG4gICAgICAgICAgICB2YXIgcCA9IGJ1Zi5pbmRleE9mKCdcXG4nKTtcbiAgICAgICAgICAgIGlmIChwID09PSAtMSkgYnJlYWs7XG4gICAgICAgICAgICBidWZfcG9zICs9IHArMTtcbiAgICAgICAgICAgIHZhciBtc2cgPSBidWYuc2xpY2UoMCwgcCk7XG4gICAgICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdtZXNzYWdlJywge2RhdGE6IG1zZ30pKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhhdC54by5vbmZpbmlzaCA9IGZ1bmN0aW9uKHN0YXR1cywgdGV4dCkge1xuICAgICAgICB0aGF0LnhvLm9uY2h1bmsoc3RhdHVzLCB0ZXh0KTtcbiAgICAgICAgdGhhdC54byA9IG51bGw7XG4gICAgICAgIHZhciByZWFzb24gPSBzdGF0dXMgPT09IDIwMCA/ICduZXR3b3JrJyA6ICdwZXJtYW5lbnQnO1xuICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdjbG9zZScsIHtyZWFzb246IHJlYXNvbn0pKTtcbiAgICB9XG59O1xuXG5YaHJSZWNlaXZlci5wcm90b3R5cGUgPSBuZXcgUkV2ZW50VGFyZ2V0KCk7XG5cblhoclJlY2VpdmVyLnByb3RvdHlwZS5hYm9ydCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC54bykge1xuICAgICAgICB0aGF0LnhvLmNsb3NlKCk7XG4gICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ2Nsb3NlJywge3JlYXNvbjogJ3VzZXInfSkpO1xuICAgICAgICB0aGF0LnhvID0gbnVsbDtcbiAgICB9XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1yZWNlaXZlci14aHIuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3Rlc3QtaG9va3MuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbi8vIEZvciB0ZXN0aW5nXG5Tb2NrSlMuZ2V0VXRpbHMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiB1dGlscztcbn07XG5cblNvY2tKUy5nZXRJZnJhbWVUcmFuc3BvcnQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBJZnJhbWVUcmFuc3BvcnQ7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90ZXN0LWhvb2tzLmpzXG5cbiAgICAgICAgICAgICAgICAgIHJldHVybiBTb2NrSlM7XG4gICAgICAgICAgfSkoKTtcbmlmICgnX3NvY2tqc19vbmxvYWQnIGluIHdpbmRvdykgc2V0VGltZW91dChfc29ja2pzX29ubG9hZCwgMSk7XG5cbi8vIEFNRCBjb21wbGlhbmNlXG5pZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKCdzb2NranMnLCBbXSwgZnVuY3Rpb24oKXtyZXR1cm4gU29ja0pTO30pO1xufVxuXG5pZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBTb2NrSlM7XG59XG4vLyAgICAgWypdIEVuZCBvZiBsaWIvaW5kZXguanNcblxuLy8gWypdIEVuZCBvZiBsaWIvYWxsLmpzXG5cblxufSkoKSIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIgTWF0aGlldSBUdXJjb3R0ZVxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbnZhciBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKSxcbiAgICB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG4vKipcbiAqIEJhY2tvZmYgZHJpdmVyLlxuICogQHBhcmFtIGJhY2tvZmZTdHJhdGVneSBCYWNrb2ZmIGRlbGF5IGdlbmVyYXRvci9zdHJhdGVneS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBCYWNrb2ZmKGJhY2tvZmZTdHJhdGVneSkge1xuICAgIGV2ZW50cy5FdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcblxuICAgIHRoaXMuYmFja29mZlN0cmF0ZWd5XyA9IGJhY2tvZmZTdHJhdGVneTtcbiAgICB0aGlzLmJhY2tvZmZOdW1iZXJfID0gMDtcbiAgICB0aGlzLmJhY2tvZmZEZWxheV8gPSAwO1xuICAgIHRoaXMudGltZW91dElEXyA9IC0xO1xuXG4gICAgdGhpcy5oYW5kbGVycyA9IHtcbiAgICAgICAgYmFja29mZjogdGhpcy5vbkJhY2tvZmZfLmJpbmQodGhpcylcbiAgICB9O1xufVxudXRpbC5pbmhlcml0cyhCYWNrb2ZmLCBldmVudHMuRXZlbnRFbWl0dGVyKTtcblxuLyoqXG4gKiBTdGFydHMgYSBiYWNrb2ZmIG9wZXJhdGlvbi5cbiAqL1xuQmFja29mZi5wcm90b3R5cGUuYmFja29mZiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnRpbWVvdXRJRF8gIT09IC0xKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQmFja29mZiBpbiBwcm9ncmVzcy4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmJhY2tvZmZEZWxheV8gPSB0aGlzLmJhY2tvZmZTdHJhdGVneV8ubmV4dCgpO1xuICAgIHRoaXMudGltZW91dElEXyA9IHNldFRpbWVvdXQodGhpcy5oYW5kbGVycy5iYWNrb2ZmLCB0aGlzLmJhY2tvZmZEZWxheV8pO1xuICAgIHRoaXMuZW1pdCgnYmFja29mZicsIHRoaXMuYmFja29mZk51bWJlcl8sIHRoaXMuYmFja29mZkRlbGF5Xyk7XG59O1xuXG4vKipcbiAqIEJhY2tvZmYgY29tcGxldGlvbiBoYW5kbGVyLlxuICogQHByaXZhdGVcbiAqL1xuQmFja29mZi5wcm90b3R5cGUub25CYWNrb2ZmXyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudGltZW91dElEXyA9IC0xO1xuICAgIHRoaXMuZW1pdCgncmVhZHknLCB0aGlzLmJhY2tvZmZOdW1iZXJfKyssIHRoaXMuYmFja29mZkRlbGF5Xyk7XG59O1xuXG4vKipcbiAqIFN0b3BzIGFueSBiYWNrb2ZmIG9wZXJhdGlvbiBhbmQgcmVzZXRzIHRoZSBiYWNrb2ZmXG4gKiBkZWxheSB0byBpdHMgaW5pdGFsIHZhbHVlLlxuICovXG5CYWNrb2ZmLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYmFja29mZk51bWJlcl8gPSAwO1xuICAgIHRoaXMuYmFja29mZlN0cmF0ZWd5Xy5yZXNldCgpO1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJRF8pO1xuICAgIHRoaXMudGltZW91dElEXyA9IC0xO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrb2ZmO1xuXG4iLCI7KGZ1bmN0aW9uICgpIHtcblxuZnVuY3Rpb24gaCgpIHtcbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyksIGUgPSBudWxsXG4gIGZ1bmN0aW9uIGl0ZW0gKGwpIHtcbiAgICBcbiAgICBmdW5jdGlvbiBwYXJzZUNsYXNzIChzdHJpbmcpIHtcbiAgICAgIHZhciBtID0gc3RyaW5nLnNwbGl0KC8oW1xcLiNdP1thLXpBLVowLTlfLV0rKS8pXG4gICAgICBtLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgdmFyIHMgPSB2LnN1YnN0cmluZygxLHYubGVuZ3RoKVxuICAgICAgICBpZighdikgcmV0dXJuIFxuICAgICAgICBpZighZSlcbiAgICAgICAgICBlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh2KVxuICAgICAgICBlbHNlIGlmICh2WzBdID09PSAnLicpXG4gICAgICAgICAgZS5jbGFzc0xpc3QuYWRkKHMpXG4gICAgICAgIGVsc2UgaWYgKHZbMF0gPT09ICcjJylcbiAgICAgICAgICBlLnNldEF0dHJpYnV0ZSgnaWQnLCBzKVxuICAgICAgICBcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYobCA9PSBudWxsKVxuICAgICAgO1xuICAgIGVsc2UgaWYoJ3N0cmluZycgPT09IHR5cGVvZiBsKSB7XG4gICAgICBpZighZSlcbiAgICAgICAgcGFyc2VDbGFzcyhsKVxuICAgICAgZWxzZVxuICAgICAgICBlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGwpKVxuICAgIH1cbiAgICBlbHNlIGlmKCdudW1iZXInID09PSB0eXBlb2YgbCBcbiAgICAgIHx8ICdib29sZWFuJyA9PT0gdHlwZW9mIGxcbiAgICAgIHx8IGwgaW5zdGFuY2VvZiBEYXRlIFxuICAgICAgfHwgbCBpbnN0YW5jZW9mIFJlZ0V4cCApIHtcbiAgICAgICAgZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShsLnRvU3RyaW5nKCkpKVxuICAgIH1cbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGwpKVxuICAgICAgbC5mb3JFYWNoKGl0ZW0pXG4gICAgZWxzZSBpZihsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpXG4gICAgICBlLmFwcGVuZENoaWxkKGwpXG4gICAgZWxzZSBpZiAoJ29iamVjdCcgPT09IHR5cGVvZiBsKSB7XG4gICAgICBmb3IgKHZhciBrIGluIGwpIHtcbiAgICAgICAgaWYoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGxba10pXG4gICAgICAgICAgZS5hZGRFdmVudExpc3RlbmVyKGssIGxba10pXG4gICAgICAgIGVsc2UgaWYoayA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgIGZvciAodmFyIHMgaW4gbFtrXSlcbiAgICAgICAgICAgIGUuc3R5bGUuc2V0UHJvcGVydHkocywgbFtrXVtzXSlcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZS5zZXRBdHRyaWJ1dGUoaywgbFtrXSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2hpbGUoYXJncy5sZW5ndGgpIHtcbiAgICBpdGVtKGFyZ3Muc2hpZnQoKSlcbiAgfVxuICByZXR1cm4gZVxufVxuXG5pZih0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JylcbiAgbW9kdWxlLmV4cG9ydHMgPSBoXG5lbHNlXG4gIHRoaXMuaCA9IGhcbn0pKClcbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIgTWF0aGlldSBUdXJjb3R0ZVxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG52YXIgQmFja29mZlN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9zdHJhdGVneScpO1xuXG4vKipcbiAqIEZpYm9uYWNjaSBiYWNrb2ZmIHN0cmF0ZWd5LlxuICogQGV4dGVuZHMgQmFja29mZlN0cmF0ZWd5XG4gKi9cbmZ1bmN0aW9uIEZpYm9uYWNjaUJhY2tvZmZTdHJhdGVneShvcHRpb25zKSB7XG4gICAgQmFja29mZlN0cmF0ZWd5LmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy5iYWNrb2ZmRGVsYXlfID0gMDtcbiAgICB0aGlzLm5leHRCYWNrb2ZmRGVsYXlfID0gdGhpcy5nZXRJbml0aWFsRGVsYXkoKTtcbn1cbnV0aWwuaW5oZXJpdHMoRmlib25hY2NpQmFja29mZlN0cmF0ZWd5LCBCYWNrb2ZmU3RyYXRlZ3kpO1xuXG4vKiogQGluaGVyaXREb2MgKi9cbkZpYm9uYWNjaUJhY2tvZmZTdHJhdGVneS5wcm90b3R5cGUubmV4dF8gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYmFja29mZkRlbGF5ID0gTWF0aC5taW4odGhpcy5uZXh0QmFja29mZkRlbGF5XywgdGhpcy5nZXRNYXhEZWxheSgpKTtcbiAgICB0aGlzLm5leHRCYWNrb2ZmRGVsYXlfICs9IHRoaXMuYmFja29mZkRlbGF5XztcbiAgICB0aGlzLmJhY2tvZmZEZWxheV8gPSBiYWNrb2ZmRGVsYXk7XG4gICAgcmV0dXJuIGJhY2tvZmZEZWxheTtcbn07XG5cbi8qKiBAaW5oZXJpdERvYyAqL1xuRmlib25hY2NpQmFja29mZlN0cmF0ZWd5LnByb3RvdHlwZS5yZXNldF8gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLm5leHRCYWNrb2ZmRGVsYXlfID0gdGhpcy5nZXRJbml0aWFsRGVsYXkoKTtcbiAgICB0aGlzLmJhY2tvZmZEZWxheV8gPSAwO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWJvbmFjY2lCYWNrb2ZmU3RyYXRlZ3k7XG5cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIgTWF0aGlldSBUdXJjb3R0ZVxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG52YXIgQmFja29mZlN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9zdHJhdGVneScpO1xuXG4vKipcbiAqIEV4cG9uZW50aWFsIGJhY2tvZmYgc3RyYXRlZ3kuXG4gKiBAZXh0ZW5kcyBCYWNrb2ZmU3RyYXRlZ3lcbiAqL1xuZnVuY3Rpb24gRXhwb25lbnRpYWxCYWNrb2ZmU3RyYXRlZ3kob3B0aW9ucykge1xuICAgIEJhY2tvZmZTdHJhdGVneS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIHRoaXMuYmFja29mZkRlbGF5XyA9IDA7XG4gICAgdGhpcy5uZXh0QmFja29mZkRlbGF5XyA9IHRoaXMuZ2V0SW5pdGlhbERlbGF5KCk7XG59XG51dGlsLmluaGVyaXRzKEV4cG9uZW50aWFsQmFja29mZlN0cmF0ZWd5LCBCYWNrb2ZmU3RyYXRlZ3kpO1xuXG4vKiogQGluaGVyaXREb2MgKi9cbkV4cG9uZW50aWFsQmFja29mZlN0cmF0ZWd5LnByb3RvdHlwZS5uZXh0XyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYmFja29mZkRlbGF5XyA9IE1hdGgubWluKHRoaXMubmV4dEJhY2tvZmZEZWxheV8sIHRoaXMuZ2V0TWF4RGVsYXkoKSk7XG4gICAgdGhpcy5uZXh0QmFja29mZkRlbGF5XyA9IHRoaXMuYmFja29mZkRlbGF5XyAqIDI7XG4gICAgcmV0dXJuIHRoaXMuYmFja29mZkRlbGF5Xztcbn07XG5cbi8qKiBAaW5oZXJpdERvYyAqL1xuRXhwb25lbnRpYWxCYWNrb2ZmU3RyYXRlZ3kucHJvdG90eXBlLnJlc2V0XyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYmFja29mZkRlbGF5XyA9IDA7XG4gICAgdGhpcy5uZXh0QmFja29mZkRlbGF5XyA9IHRoaXMuZ2V0SW5pdGlhbERlbGF5KCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV4cG9uZW50aWFsQmFja29mZlN0cmF0ZWd5O1xuXG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7dmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlclxudmFyIGkgPSByZXF1aXJlKCdpdGVyYXRlJylcbnZhciBkdXBsZXggPSByZXF1aXJlKCdkdXBsZXgnKVxudmFyIGluaGVyaXRzID0gcmVxdWlyZSgndXRpbCcpLmluaGVyaXRzXG52YXIgc2VyaWFsaXplciA9IHJlcXVpcmUoJ3N0cmVhbS1zZXJpYWxpemVyJylcbnZhciB1ID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciB0aW1lc3RhbXAgPSByZXF1aXJlKCdtb25vdG9uaWMtdGltZXN0YW1wJylcblxuZXhwb3J0cyA9IFxubW9kdWxlLmV4cG9ydHMgPSBTY3V0dGxlYnV0dFxuXG5leHBvcnRzLmNyZWF0ZUlEID0gdS5jcmVhdGVJRFxuZXhwb3J0cy51cGRhdGVJc1JlY2VudCA9IHUuZmlsdGVyXG5leHBvcnRzLmZpbHRlciA9IHUuZmlsdGVyXG5leHBvcnRzLnRpbWVzdGFtcCA9IHRpbWVzdGFtcFxuXG5mdW5jdGlvbiBkdXR5T2ZTdWJjbGFzcygpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdtZXRob2QgbXVzdCBiZSBpbXBsZW1lbnRlZCBieSBzdWJjbGFzcycpXG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlIChkYXRhKSB7XG4gIGlmKCEoQXJyYXkuaXNBcnJheShkYXRhKSBcbiAgICAmJiAnc3RyaW5nJyA9PT0gdHlwZW9mIGRhdGFbMl1cbiAgICAmJiAnX19wcm90b19fJyAgICAgIT09IGRhdGFbMl0gLy9USElTIFdPVUxEIEJSRUFLIFNUVUZGXG4gICAgJiYgJ251bWJlcicgPT09IHR5cGVvZiBkYXRhWzFdXG4gICkpIHJldHVybiBmYWxzZVxuXG4gIHJldHVybiB0cnVlXG59XG5cbnZhciBlbWl0ID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0XG5cbmluaGVyaXRzIChTY3V0dGxlYnV0dCwgRXZlbnRFbWl0dGVyKVxuXG5mdW5jdGlvbiBTY3V0dGxlYnV0dCAob3B0cykge1xuXG4gIGlmKCEodGhpcyBpbnN0YW5jZW9mIFNjdXR0bGVidXR0KSkgcmV0dXJuIG5ldyBTY3V0dGxlYnV0dChvcHRzKVxuICB2YXIgaWQgPSAnc3RyaW5nJyA9PT0gdHlwZW9mIG9wdHMgPyBvcHRzIDogb3B0cyAmJiBvcHRzLmlkXG4gIHRoaXMuc291cmNlcyA9IHt9XG4gIHRoaXMuc2V0TWF4TGlzdGVuZXJzKE51bWJlci5NQVhfVkFMVUUpXG4gIC8vY291bnQgaG93IG1hbnkgb3RoZXIgaW5zdGFuY2VzIHdlIGFyZSByZXBsaWNhdGluZyB0by5cbiAgdGhpcy5fc3RyZWFtcyA9IDBcbiAgaWYob3B0cyAmJiBvcHRzLnNpZ24gJiYgb3B0cy52ZXJpZnkpIHtcbiAgICB0aGlzLnNldElkKG9wdHMuaWQgfHwgb3B0cy5jcmVhdGVJZCgpKVxuICAgIHRoaXMuX3NpZ24gICA9IG9wdHMuc2lnblxuICAgIHRoaXMuX3ZlcmlmeSA9IG9wdHMudmVyaWZ5XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5zZXRJZChpZCB8fCB1LmNyZWF0ZUlkKCkpXG4gIH1cbn1cblxudmFyIHNiID0gU2N1dHRsZWJ1dHQucHJvdG90eXBlXG5cbnZhciBlbWl0ID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0XG5cbnNiLmFwcGx5VXBkYXRlID0gZHV0eU9mU3ViY2xhc3NcbnNiLmhpc3RvcnkgICAgICA9IGR1dHlPZlN1YmNsYXNzXG5cbnNiLmxvY2FsVXBkYXRlID0gZnVuY3Rpb24gKHRyeCkge1xuICB0aGlzLl91cGRhdGUoW3RyeCwgdGltZXN0YW1wKCksIHRoaXMuaWRdKVxuICByZXR1cm4gdGhpc1xufVxuXG5zYi5fdXBkYXRlID0gZnVuY3Rpb24gKHVwZGF0ZSkge1xuICAvL3ZhbGlkYXRlZCB3aGVuIGl0IGNvbWVzIGludG8gdGhlIHN0cmVhbVxuICB2YXIgdHMgPSB1cGRhdGVbMV1cbiAgdmFyIHNvdXJjZSA9IHVwZGF0ZVsyXVxuICAvL2lmIHRoaXMgbWVzc2FnZSBpcyBvbGQgZm9yIGl0J3Mgc291cmNlLFxuICAvL2lnbm9yZSBpdC4gaXQncyBvdXQgb2Ygb3JkZXIuXG4gIC8vZWFjaCBub2RlIG11c3QgZW1pdCBpdCdzIGNoYW5nZXMgaW4gb3JkZXIhXG4gIFxuICB2YXIgbGF0ZXN0ID0gdGhpcy5zb3VyY2VzW3NvdXJjZV1cbiAgaWYobGF0ZXN0ICYmIGxhdGVzdCA+PSB0cylcbiAgICByZXR1cm4gZW1pdC5jYWxsKHRoaXMsICdvbGRfZGF0YScsIHVwZGF0ZSksIGZhbHNlXG5cbiAgdGhpcy5zb3VyY2VzW3NvdXJjZV0gPSB0c1xuXG4gIHZhciBzZWxmID0gdGhpc1xuICBmdW5jdGlvbiBkaWRWZXJpZmljYXRpb24gKGVyciwgdmVyaWZpZWQpIHtcblxuICAgIC8vIEknbSBub3Qgc3VyZSBob3cgd2hhdCBzaG91bGQgaGFwcGVuIGlmIGEgYXN5bmMgdmVyaWZpY2F0aW9uXG4gICAgLy8gZXJyb3JzLiBpZiBpdCdzIGFuIGtleSBub3QgZm91bmQgLSB0aGF0IGlzIGEgdmVyaWZpY2F0aW9uIGZhaWwsXG4gICAgLy8gbm90IGEgZXJyb3IuIGlmIGl0J3MgZ2VudW5pZSBlcnJvciwgcmVhbGx5IHlvdSBzaG91bGQgcXVldWUgYW5kIFxuICAgIC8vIHRyeSBhZ2Fpbj8gb3IgcmVwbGF5IHRoZSBtZXNzYWdlIGxhdGVyXG4gICAgLy8gLS0gdGhpcyBzaG91bGQgYmUgZG9uZSBteSB0aGUgc2VjdXJpdHkgcGx1Z2luIHRob3VnaCwgbm90IHNjdXR0bGVidXR0LlxuXG4gICAgaWYoZXJyKVxuICAgICAgcmV0dXJuIGVtaXQuY2FsbChzZWxmLCAnZXJyb3InLCBlcnIpXG5cbiAgICBpZighdmVyaWZpZWQpXG4gICAgICByZXR1cm4gZW1pdC5jYWxsKHNlbGYsICd1bnZlcmlmaWVkX2RhdGEnLCB1cGRhdGUpXG5cbiAgICAvLyBjaGVjayBpZiB0aGlzIG1lc3NhZ2UgaXMgb2xkZXIgdGhhblxuICAgIC8vIHRoZSB2YWx1ZSB3ZSBhbHJlYWR5IGhhdmUuXG4gICAgLy8gZG8gbm90aGluZyBpZiBzb1xuICAgIC8vIGVtaXQgYW4gJ29sZF9kYXRhJyBldmVudCBiZWNhdXNlIGknbGwgd2FudCB0byB0cmFjayBob3cgbWFueVxuICAgIC8vIHVubmVjZXNzYXJ5IG1lc3NhZ2VzIGFyZSBzZW50LlxuXG4gICAgaWYoc2VsZi5hcHBseVVwZGF0ZSh1cGRhdGUpKVxuICAgICAgZW1pdC5jYWxsKHNlbGYsICdfdXBkYXRlJywgdXBkYXRlKSAvL3dyaXRlIHRvIHN0cmVhbS5cbiAgfVxuXG4gIGlmKHNvdXJjZSAhPT0gdGhpcy5pZCkge1xuICAgIGlmKHRoaXMuX3ZlcmlmeSlcbiAgICAgIHRoaXMuX3ZlcmlmeSh1cGRhdGUsIGRpZFZlcmlmaWNhdGlvbilcbiAgICBlbHNlXG4gICAgICBkaWRWZXJpZmljYXRpb24obnVsbCwgdHJ1ZSlcbiAgfSBlbHNlIHtcbiAgICBpZih0aGlzLl9zaWduKSB7XG4gICAgICAvL2NvdWxkIG1ha2UgdGhpcyBhc3luYyBlYXNpbHkgZW5vdWdoLlxuICAgICAgdXBkYXRlWzNdID0gdGhpcy5fc2lnbih1cGRhdGUpXG4gICAgfVxuICAgIGRpZFZlcmlmaWNhdGlvbihudWxsLCB0cnVlKVxuICB9XG5cbiAgcmV0dXJuIHRydWVcbn1cblxuc2IuY3JlYXRlU3RyZWFtID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIC8vdGhlIHNvdXJjZXMgZm9yIHRoZSByZW1vdGUgZW5kLlxuICB2YXIgc291cmNlcyA9IHt9LCBvdGhlclxuICB2YXIgc3luY1NlbnQgPSBmYWxzZSwgc3luY1JlY3YgPSBmYWxzZVxuXG4gIHRoaXMuX3N0cmVhbXMgKytcblxuICBvcHRzID0gb3B0cyB8fCB7fVxuICB2YXIgZCA9IGR1cGxleCgpXG4gIGQubmFtZSA9IG9wdHMubmFtZVxuICB2YXIgb3V0ZXIgPSBzZXJpYWxpemVyKG9wdHMgJiYgb3B0cy53cmFwcGVyKShkKVxuICBvdXRlci5pbm5lciA9IGRcblxuICBkLndyaXRhYmxlID0gb3B0cy53cml0YWJsZSAhPT0gZmFsc2VcbiAgZC5yZWFkYWJsZSA9IG9wdHMucmVhZGFibGUgIT09IGZhbHNlXG5cbiAgc3luY1JlY3YgICA9ICFkLndyaXRhYmxlXG4gIHN5bmNTZW50ICAgPSAhZC5yZWFkYWJsZVxuXG4gIHZhciB0YWlsID0gb3B0cy50YWlsICE9PSBmYWxzZSAvL2RlZmF1bHQgdG8gdGFpbD10cnVlXG5cbiAgZnVuY3Rpb24gc3RhcnQgKGRhdGEpIHtcbiAgICAvL3doZW4gdGhlIGRpZ2VzdCBpcyByZWNpZXZlZCBmcm9tIHRoZSBvdGhlciBlbmQsXG4gICAgLy9zZW5kIHRoZSBoaXN0b3J5LlxuICAgIC8vbWVyZ2Ugd2l0aCB0aGUgY3VycmVudCBsaXN0IG9mIHNvdXJjZXMuXG4gICAgc291cmNlcyA9IGRhdGEuY2xvY2tcbiAgICBpLmVhY2goc2VsZi5oaXN0b3J5KHNvdXJjZXMpLCBmdW5jdGlvbiAoZGF0YSkge2QuX2RhdGEoZGF0YSl9KVxuICAgIFxuICAgIG91dGVyLmVtaXQoJ2hlYWRlcicsIGRhdGEpXG4gICAgZC5fZGF0YSgnU1lOQycpXG4gICAgLy93aGVuIHdlIGhhdmUgc2VudCBhbGwgaGlzdG9yeVxuICAgIG91dGVyLmVtaXQoJ3N5bmNTZW50JylcbiAgICBzeW5jU2VudCA9IHRydWVcbiAgICAvL3doZW4gd2UgaGF2ZSByZWNpZXZlZCBhbGwgaGlzdG95clxuICAgIC8vZW1pdCAnc3luY2VkJyB3aGVuIHRoaXMgc3RyZWFtIGhhcyBzeW5jZWQuXG4gICAgaWYoc3luY1JlY3YpIG91dGVyLmVtaXQoJ3N5bmMnKSwgb3V0ZXIuZW1pdCgnc3luY2VkJylcbiAgICBpZighdGFpbCkgZC5fZW5kKClcbiAgfVxuXG4gIGRcbiAgICAub24oJ19kYXRhJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIC8vaWYgaXQncyBhbiBhcnJheSwgaXQncyBhbiB1cGRhdGUuXG4gICAgICBpZihBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgIGlmKHZhbGlkYXRlKGRhdGEpKVxuICAgICAgICAgIHJldHVybiBzZWxmLl91cGRhdGUoZGF0YSlcbiAgICAgIH1cbiAgICAgIC8vaWYgaXQncyBhbiBvYmplY3QsIGl0J3MgYSBzY3V0dGxlYnV0IGRpZ2VzdC5cbiAgICAgIGVsc2UgaWYoJ29iamVjdCcgPT09IHR5cGVvZiBkYXRhICYmIGRhdGEpXG4gICAgICAgIHN0YXJ0KGRhdGEpXG4gICAgICBlbHNlIGlmKCdzdHJpbmcnID09PSB0eXBlb2YgZGF0YSAmJiBkYXRhID09ICdTWU5DJykge1xuICAgICAgICBzeW5jUmVjdiA9IHRydWVcbiAgICAgICAgb3V0ZXIuZW1pdCgnc3luY1JlY2lldmVkJylcbiAgICAgICAgaWYoc3luY1NlbnQpIG91dGVyLmVtaXQoJ3N5bmMnKSwgb3V0ZXIuZW1pdCgnc3luY2VkJylcbiAgICAgIH1cbiAgICB9KS5vbignX2VuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGQuX2VuZCgpXG4gICAgfSlcbiAgICAub24oJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5yZW1vdmVMaXN0ZW5lcignX3VwZGF0ZScsIG9uVXBkYXRlKVxuICAgICAgLy9lbWl0IHRoZSBudW1iZXIgb2Ygc3RyZWFtcyB0aGF0IGFyZSByZW1haW5pbmcuLi5cbiAgICAgIC8vdGhpcyB3aWxsIGJlIHVzZWQgZm9yIG1lbW9yeSBtYW5hZ2VtZW50Li4uXG4gICAgICBzZWxmLl9zdHJlYW1zIC0tXG4gICAgICBlbWl0LmNhbGwoc2VsZiwgJ3Vuc3RyZWFtJywgc2VsZi5fc3RyZWFtcylcbiAgICB9KVxuXG4gIGlmKG9wdHMgJiYgb3B0cy50YWlsID09PSBmYWxzZSkge1xuICAgIG91dGVyLm9uKCdzeW5jJywgZnVuY3Rpb24gKCkge1xuICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGQuX2VuZCgpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cbiAgZnVuY3Rpb24gb25VcGRhdGUgKHVwZGF0ZSkgeyAvL3ZhbHVlLCBzb3VyY2UsIHRzXG4gICAgaWYoIXZhbGlkYXRlKHVwZGF0ZSkgfHwgIXUuZmlsdGVyKHVwZGF0ZSwgc291cmNlcykpXG4gICAgICByZXR1cm5cblxuICAgIGQuX2RhdGEodXBkYXRlKVxuXG4gICAgLy9yZWFsbHksIHRoaXMgc2hvdWxkIGhhcHBlbiBiZWZvcmUgZW1pdHRpbmcuXG4gICAgdmFyIHRzID0gdXBkYXRlWzFdXG4gICAgdmFyIHNvdXJjZSA9IHVwZGF0ZVsyXVxuICAgIHNvdXJjZXNbc291cmNlXSA9IHRzXG4gIH1cblxuICB2YXIgb3V0Z29pbmcgPSB7IGlkIDogc2VsZi5pZCwgY2xvY2sgOiBzZWxmLnNvdXJjZXMgfVxuXG4gIGlmIChvcHRzICYmIG9wdHMubWV0YSkgb3V0Z29pbmcubWV0YSA9IG9wdHMubWV0YVxuXG4gIGlmKGQucmVhZGFibGUpIHtcbiAgICBkLl9kYXRhKG91dGdvaW5nKVxuICAgIGlmKCFkLndyaXRhYmxlKVxuICAgICAgc3RhcnQoe2Nsb2NrOnt9fSlcbiAgICBpZih0YWlsKVxuICAgICAgc2VsZi5vbignX3VwZGF0ZScsIG9uVXBkYXRlKVxuICB9XG5cbiAgc2VsZi5vbmNlKCdkaXNwb3NlJywgZnVuY3Rpb24gKCkge1xuICAgIGQuZW5kKClcbiAgfSlcblxuICByZXR1cm4gb3V0ZXJcbn1cblxuc2IuY3JlYXRlV3JpdGVTdHJlYW0gPSBmdW5jdGlvbiAob3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fVxuICBvcHRzLndyaXRhYmxlID0gdHJ1ZTsgb3B0cy5yZWFkYWJsZSA9IGZhbHNlXG4gIHJldHVybiB0aGlzLmNyZWF0ZVN0cmVhbShvcHRzKVxufVxuXG5zYi5jcmVhdGVSZWFkU3RyZWFtID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge31cbiAgb3B0cy53cml0YWJsZSA9IGZhbHNlOyBvcHRzLnJlYWRhYmxlID0gdHJ1ZVxuICByZXR1cm4gdGhpcy5jcmVhdGVTdHJlYW0ob3B0cylcbn1cblxuc2IuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgZW1pdC5jYWxsKHRoaXMsICdkaXNwb3NlJylcbn1cblxuc2Iuc2V0SWQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgaWYoJ19fcHJvdG9fXycgPT09IGlkKSB0aHJvdyBuZXcgRXJyb3IoJ19fcHJvdG9fXyBpcyBpbnZhbGlkIGlkJylcbiAgaWYoaWQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKCdudWxsIGlzIG5vdCBpbnZhbGlkIGlkJylcbiAgdGhpcy5pZCA9IGlkXG4gIHJldHVybiB0aGlzXG59XG5cbmZ1bmN0aW9uIHN0cmVhbURvbmUoc3RyZWFtLCBsaXN0ZW5lcikge1xuXG4gIGZ1bmN0aW9uIHJlbW92ZSAoKSB7XG4gICAgc3RyZWFtLnJlbW92ZUxpc3RlbmVyKCdlbmQnLCAgIG9uRG9uZSlcbiAgICBzdHJlYW0ucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25Eb25lKVxuICAgIHN0cmVhbS5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCAgIG9uRG9uZSlcbiAgfVxuICBmdW5jdGlvbiBvbkRvbmUgKGFyZykge1xuICAgIHJlbW92ZSgpXG4gICAgbGlzdGVuZXIuY2FsbCh0aGlzLCBhcmcpXG4gIH1cblxuICAvL3RoaXMgbWFrZXMgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpIHN0aWxsIHdvcmtcbiAgb25Eb25lLmxpc3RlbmVyID0gbGlzdGVuZXJcblxuICBzdHJlYW0ub24oJ2VuZCcsICAgb25Eb25lKVxuICBzdHJlYW0ub24oJ2Vycm9yJywgb25Eb25lKVxuICBzdHJlYW0ub24oJ2Nsb3NlJywgb25Eb25lKVxufVxuXG4vL2NyZWF0ZSBhbm90aGVyIGluc3RhbmNlIG9mIHRoaXMgc2N1dHRsZWJ1dHQsXG4vL3RoYXQgaXMgaW4gc3luYyBhbmQgYXR0YWNoZWQgdG8gdGhpcyBpbnN0YW5jZS5cbnNiLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICB2YXIgQSA9IHRoaXNcbiAgdmFyIEIgPSBuZXcgKEEuY29uc3RydWN0b3IpXG4gIEIuc2V0SWQoQS5pZCkgLy9zYW1lIGlkLiB0aGluayB0aGlzIHdpbGwgd29yay4uLlxuXG4gIEEuX2Nsb25lcyA9IChBLl9jbG9uZXMgfHwgMCkgKyAxXG5cbiAgdmFyIGEgPSBBLmNyZWF0ZVN0cmVhbSh7d3JhcHBlcjogJ3Jhdyd9KVxuICB2YXIgYiA9IEIuY3JlYXRlU3RyZWFtKHt3cmFwcGVyOiAncmF3J30pXG5cbiAgLy9hbGwgdXBkYXRlcyBtdXN0IGJlIHN5bmMsIHNvIG1ha2Ugc3VyZSBwYXVzZSBuZXZlciBoYXBwZW5zLlxuICBhLnBhdXNlID0gYi5wYXVzZSA9IGZ1bmN0aW9uIG5vb3AoKXt9XG5cbiAgc3RyZWFtRG9uZShiLCBmdW5jdGlvbiAoKSB7XG4gICAgQS5fY2xvbmVzLS1cbiAgICBlbWl0LmNhbGwoQSwgJ3VuY2xvbmUnLCBBLl9jbG9uZXMpXG4gIH0pXG5cbiAgYS5waXBlKGIpLnBpcGUoYSlcbiAgLy9yZXN1bWUgYm90aCBzdHJlYW1zLCBzbyB0aGF0IHRoZSBuZXcgaW5zdGFuY2UgaXMgYnJvdWdodCB1cCB0byBkYXRlIGltbWVkaWF0ZWx5LlxuICBhLnJlc3VtZSgpXG4gIGIucmVzdW1lKClcblxuICByZXR1cm4gQlxufVxuXG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDEyIE1hdGhpZXUgVHVyY290dGVcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG52YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuZnVuY3Rpb24gaXNEZWYodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbDtcbn1cblxuLyoqXG4gKiBBYnN0cmFjdCBjbGFzcyBkZWZpbmluZyB0aGUgc2tlbGV0b24gZm9yIGFsbCBiYWNrb2ZmIHN0cmF0ZWdpZXMuXG4gKiBAcGFyYW0gb3B0aW9ucyBCYWNrb2ZmIHN0cmF0ZWd5IG9wdGlvbnMuXG4gKiBAcGFyYW0gb3B0aW9ucy5yYW5kb21pc2F0aW9uRmFjdG9yIFRoZSByYW5kb21pc2F0aW9uIGZhY3RvciwgbXVzdCBiZSBiZXR3ZWVuXG4gKiAwIGFuZCAxLlxuICogQHBhcmFtIG9wdGlvbnMuaW5pdGlhbERlbGF5IFRoZSBiYWNrb2ZmIGluaXRpYWwgZGVsYXksIGluIG1pbGxpc2Vjb25kcy5cbiAqIEBwYXJhbSBvcHRpb25zLm1heERlbGF5IFRoZSBiYWNrb2ZmIG1heGltYWwgZGVsYXksIGluIG1pbGxpc2Vjb25kcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBCYWNrb2ZmU3RyYXRlZ3kob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKGlzRGVmKG9wdGlvbnMuaW5pdGlhbERlbGF5KSAmJiBvcHRpb25zLmluaXRpYWxEZWxheSA8IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgaW5pdGlhbCB0aW1lb3V0IG11c3QgYmUgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgfSBlbHNlIGlmIChpc0RlZihvcHRpb25zLm1heERlbGF5KSAmJiBvcHRpb25zLm1heERlbGF5IDwgMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBtYXhpbWFsIHRpbWVvdXQgbXVzdCBiZSBncmVhdGVyIHRoYW4gMC4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmluaXRpYWxEZWxheV8gPSBvcHRpb25zLmluaXRpYWxEZWxheSB8fCAxMDA7XG4gICAgdGhpcy5tYXhEZWxheV8gPSBvcHRpb25zLm1heERlbGF5IHx8IDEwMDAwO1xuXG4gICAgaWYgKHRoaXMubWF4RGVsYXlfIDw9IHRoaXMuaW5pdGlhbERlbGF5Xykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBtYXhpbWFsIGJhY2tvZmYgZGVsYXkgbXVzdCBiZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdncmVhdGVyIHRoYW4gdGhlIGluaXRpYWwgYmFja29mZiBkZWxheS4nKTtcbiAgICB9XG5cbiAgICBpZiAoaXNEZWYob3B0aW9ucy5yYW5kb21pc2F0aW9uRmFjdG9yKSAmJlxuICAgICAgICAob3B0aW9ucy5yYW5kb21pc2F0aW9uRmFjdG9yIDwgMCB8fCBvcHRpb25zLnJhbmRvbWlzYXRpb25GYWN0b3IgPiAxKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSByYW5kb21pc2F0aW9uIGZhY3RvciBtdXN0IGJlIGJldHdlZW4gMCBhbmQgMS4nKTtcbiAgICB9XG5cbiAgICB0aGlzLnJhbmRvbWlzYXRpb25GYWN0b3JfID0gb3B0aW9ucy5yYW5kb21pc2F0aW9uRmFjdG9yIHx8IDA7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBtYXhpbWFsIGJhY2tvZmYgZGVsYXkuXG4gKiBAcmV0dXJuIFRoZSBtYXhpbWFsIGJhY2tvZmYgZGVsYXkuXG4gKi9cbkJhY2tvZmZTdHJhdGVneS5wcm90b3R5cGUuZ2V0TWF4RGVsYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5tYXhEZWxheV87XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgaW5pdGlhbCBiYWNrb2ZmIGRlbGF5LlxuICogQHJldHVybiBUaGUgaW5pdGlhbCBiYWNrb2ZmIGRlbGF5LlxuICovXG5CYWNrb2ZmU3RyYXRlZ3kucHJvdG90eXBlLmdldEluaXRpYWxEZWxheSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmluaXRpYWxEZWxheV87XG59O1xuXG4vKipcbiAqIFRlbXBsYXRlIG1ldGhvZCB0aGF0IGNvbXB1dGVzIHRoZSBuZXh0IGJhY2tvZmYgZGVsYXkuXG4gKiBAcmV0dXJuIFRoZSBiYWNrb2ZmIGRlbGF5LCBpbiBtaWxsaXNlY29uZHMuXG4gKi9cbkJhY2tvZmZTdHJhdGVneS5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBiYWNrb2ZmRGVsYXkgPSB0aGlzLm5leHRfKCk7XG4gICAgdmFyIHJhbmRvbWlzYXRpb25NdWx0aXBsZSA9IDEgKyBNYXRoLnJhbmRvbSgpICogdGhpcy5yYW5kb21pc2F0aW9uRmFjdG9yXztcbiAgICB2YXIgcmFuZG9taXplZERlbGF5ID0gTWF0aC5yb3VuZChiYWNrb2ZmRGVsYXkgKiByYW5kb21pc2F0aW9uTXVsdGlwbGUpO1xuICAgIHJldHVybiByYW5kb21pemVkRGVsYXk7XG59O1xuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBuZXh0IGJhY2tvZmYgZGVsYXkuXG4gKiBAcmV0dXJuIFRoZSBiYWNrb2ZmIGRlbGF5LCBpbiBtaWxsaXNlY29uZHMuXG4gKi9cbkJhY2tvZmZTdHJhdGVneS5wcm90b3R5cGUubmV4dF8gPSBmdW5jdGlvbigpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0JhY2tvZmZTdHJhdGVneS5uZXh0XygpIHVuaW1wbGVtZW50ZWQuJyk7XG59O1xuXG4vKipcbiAqIFRlbXBsYXRlIG1ldGhvZCB0aGF0IHJlc2V0cyB0aGUgYmFja29mZiBkZWxheSB0byBpdHMgaW5pdGlhbCB2YWx1ZS5cbiAqL1xuQmFja29mZlN0cmF0ZWd5LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmVzZXRfKCk7XG59O1xuXG4vKipcbiAqIFJlc2V0cyB0aGUgYmFja29mZiBkZWxheSB0byBpdHMgaW5pdGlhbCB2YWx1ZS5cbiAqL1xuQmFja29mZlN0cmF0ZWd5LnByb3RvdHlwZS5yZXNldF8gPSBmdW5jdGlvbigpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0JhY2tvZmZTdHJhdGVneS5yZXNldF8oKSB1bmltcGxlbWVudGVkLicpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrb2ZmU3RyYXRlZ3k7XG5cbiIsIlxuLy9cbi8vIGFkZHMgYWxsIHRoZSBmaWVsZHMgZnJvbSBvYmoyIG9udG8gb2JqMVxuLy9cblxudmFyIGVhY2ggPSBleHBvcnRzLmVhY2ggPSBmdW5jdGlvbiAob2JqLGl0ZXJhdG9yKXtcbiB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iailcbiBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSl7XG4gIGl0ZXJhdG9yKG9ialtrZXldLGtleSxvYmopIFxuIH0pXG59XG5cbnZhciBSWCA9IC9zYWRmLy5jb25zdHJ1Y3RvclxuZnVuY3Rpb24gcnggKGl0ZXJhdG9yICl7XG4gIHJldHVybiBpdGVyYXRvciBpbnN0YW5jZW9mIFJYID8gZnVuY3Rpb24gKHN0cikgeyBcbiAgICAgIHZhciBtID0gaXRlcmF0b3IuZXhlYyhzdHIpXG4gICAgICByZXR1cm4gbSAmJiAobVsxXSA/IG1bMV0gOiBtWzBdKSBcbiAgICB9IDogaXRlcmF0b3Jcbn1cblxudmFyIHRpbWVzID0gZXhwb3J0cy50aW1lcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAsIGl0ZXJhdG9yID0gcngoYXJncy5wb3AoKSlcbiAgICAsIG0gPSBhcmdzLnBvcCgpXG4gICAgLCBpID0gYXJncy5zaGlmdCgpXG4gICAgLCBqID0gYXJncy5zaGlmdCgpXG4gICAgLCBkaWZmLCBkaXJcbiAgICAsIGEgPSBbXVxuICAgIFxuICAgIGkgPSAnbnVtYmVyJyA9PT0gdHlwZW9mIGkgPyBpIDogMVxuICAgIGRpZmYgPSBqID8gaiAtIGkgOiAxXG4gICAgZGlyID0gaSA8IG1cbiAgICBpZihtID09IGkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3N0ZXBzIGNhbm5vdCBiZSB0aGUgc2FtZTogJyttKycsICcraSlcbiAgZm9yICg7IGRpciA/IGkgPD0gbSA6IG0gPD0gaTsgaSArPSBkaWZmKVxuICAgIGEucHVzaChpdGVyYXRvcihpKSlcbiAgcmV0dXJuIGFcbn1cblxudmFyIG1hcCA9IGV4cG9ydHMubWFwID0gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3Ipe1xuICBpdGVyYXRvciA9IHJ4KGl0ZXJhdG9yKVxuICBpZihBcnJheS5pc0FycmF5KG9iaikpXG4gICAgcmV0dXJuIG9iai5tYXAoaXRlcmF0b3IpXG4gIGlmKCdudW1iZXInID09PSB0eXBlb2Ygb2JqKVxuICAgIHJldHVybiB0aW1lcy5hcHBseShudWxsLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpICBcbiAgLy9yZXR1cm4gaWYgbnVsbCA/ICBcbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopXG4gICAgLCByID0ge31cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpe1xuICAgIHJba2V5XSA9IGl0ZXJhdG9yKG9ialtrZXldLGtleSxvYmopIFxuICB9KVxuICByZXR1cm4gclxufVxuXG52YXIgZmluZFJldHVybiA9IGV4cG9ydHMuZmluZFJldHVybiA9IGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yKSB7XG4gIGl0ZXJhdG9yID0gcngoaXRlcmF0b3IpXG4gIGlmKG9iaiA9PSBudWxsKVxuICAgIHJldHVyblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iailcbiAgICAsIGwgPSBrZXlzLmxlbmd0aFxuICBmb3IgKHZhciBpID0gMDsgaSA8IGw7IGkgKyspIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpXVxuICAgICAgLCB2YWx1ZSA9IG9ialtrZXldXG4gICAgdmFyIHIgPSBpdGVyYXRvcih2YWx1ZSwga2V5KVxuICAgIGlmKHIpIHJldHVybiByXG4gIH1cbn1cblxudmFyIGZpbmQgPSBleHBvcnRzLmZpbmQgPSBmdW5jdGlvbiAob2JqLCBpdGVyYXRvcikgeyBcbiAgaXRlcmF0b3IgPSByeChpdGVyYXRvcilcbiAgcmV0dXJuIGZpbmRSZXR1cm4gKG9iaiwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICB2YXIgciA9IGl0ZXJhdG9yKHYsIGspXG4gICAgaWYocikgcmV0dXJuIHZcbiAgfSlcbn1cblxudmFyIGZpbmRLZXkgPSBleHBvcnRzLmZpbmRLZXkgPSBmdW5jdGlvbiAob2JqLCBpdGVyYXRvcikgeyBcbiAgaXRlcmF0b3IgPSByeChpdGVyYXRvcilcbiAgcmV0dXJuIGZpbmRSZXR1cm4gKG9iaiwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICB2YXIgciA9IGl0ZXJhdG9yKHYsIGspXG4gICAgaWYocikgcmV0dXJuIGtcbiAgfSlcbn1cblxudmFyIGZpbHRlciA9IGV4cG9ydHMuZmlsdGVyID0gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3Ipe1xuICBpdGVyYXRvciA9IHJ4IChpdGVyYXRvcilcblxuICBpZihBcnJheS5pc0FycmF5KG9iaikpXG4gICAgcmV0dXJuIG9iai5maWx0ZXIoaXRlcmF0b3IpXG4gIFxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iailcbiAgICAsIHIgPSB7fVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSl7XG4gICAgdmFyIHZcbiAgICBpZihpdGVyYXRvcih2ID0gb2JqW2tleV0sa2V5LG9iaikpXG4gICAgICByW2tleV0gPSB2XG4gIH0pXG4gIHJldHVybiByIFxufVxuXG52YXIgbWFwS2V5cyA9IGV4cG9ydHMubWFwS2V5cyA9IGZ1bmN0aW9uIChhcnksIGl0ZXJhdG9yKXtcbiAgdmFyIHIgPSB7fVxuICBpdGVyYXRvciA9IHJ4KGl0ZXJhdG9yKVxuICBlYWNoKGFyeSwgZnVuY3Rpb24gKHYsayl7XG4gICAgclt2XSA9IGl0ZXJhdG9yKHYsaylcbiAgfSlcbiAgcmV0dXJuIHJcbn1cblxuXG52YXIgbWFwVG9BcnJheSA9IGV4cG9ydHMubWFwVG9BcnJheSA9IGZ1bmN0aW9uIChhcnksIGl0ZXJhdG9yKXtcbiAgdmFyIHIgPSBbXVxuICBpdGVyYXRvciA9IHJ4KGl0ZXJhdG9yKVxuICBlYWNoKGFyeSwgZnVuY3Rpb24gKHYsayl7XG4gICAgci5wdXNoKGl0ZXJhdG9yKHYsaykpXG4gIH0pXG4gIHJldHVybiByXG59XG5cbnZhciBwYXRoID0gZXhwb3J0cy5wYXRoID0gZnVuY3Rpb24gKG9iamVjdCwgcGF0aCkge1xuXG4gIGZvciAodmFyIGkgaW4gcGF0aCkge1xuICAgIGlmKG9iamVjdCA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgdmFyIGtleSA9IHBhdGhbaV1cbiAgICBvYmplY3QgPSBvYmplY3Rba2V5XVxuICB9XG4gIHJldHVybiBvYmplY3Rcbn1cblxuLypcbk5PVEU6IG5haXZlIGltcGxlbWVudGF0aW9uLiBcbmBtYXRjaGAgbXVzdCBub3QgY29udGFpbiBjaXJjdWxhciByZWZlcmVuY2VzLlxuKi9cblxudmFyIHNldFBhdGggPSBleHBvcnRzLnNldFBhdGggPSBmdW5jdGlvbiAob2JqZWN0LCBwYXRoLCB2YWx1ZSkge1xuXG4gIGZvciAodmFyIGkgaW4gcGF0aCkge1xuICAgIHZhciBrZXkgPSBwYXRoW2ldXG4gICAgaWYob2JqZWN0W2tleV0gPT0gbnVsbCkgb2JqZWN0W2tleV0gPSAoIFxuICAgICAgaSArIDEgPT0gcGF0aC5sZW5ndGggPyB2YWx1ZSA6IHt9XG4gICAgKVxuICAgIG9iamVjdCA9IG9iamVjdFtrZXldXG4gIH1cbn1cblxudmFyIGpvaW4gPSBleHBvcnRzLmpvaW4gPSBmdW5jdGlvbiAoQSwgQiwgaXQpIHtcbiAgZWFjaChBLCBmdW5jdGlvbiAoYSwgYWspIHtcbiAgICBlYWNoKEIsIGZ1bmN0aW9uIChiLCBiaykge1xuICAgICAgaXQoYSwgYiwgYWssIGJrKVxuICAgIH0pXG4gIH0pXG59XG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7dmFyIFN0cmVhbSA9IHJlcXVpcmUoJ3N0cmVhbScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHdyaXRlLCBlbmQpIHtcbiAgdmFyIHN0cmVhbSA9IG5ldyBTdHJlYW0oKSBcbiAgdmFyIGJ1ZmZlciA9IFtdLCBlbmRlZCA9IGZhbHNlLCBkZXN0cm95ZWQgPSBmYWxzZSwgZW1pdEVuZFxuICBzdHJlYW0ud3JpdGFibGUgPSBzdHJlYW0ucmVhZGFibGUgPSB0cnVlXG4gIHN0cmVhbS5wYXVzZWQgPSBmYWxzZVxuICBzdHJlYW0uX3BhdXNlZCA9IGZhbHNlXG4gIHN0cmVhbS5idWZmZXIgPSBidWZmZXJcbiAgXG4gIHN0cmVhbVxuICAgIC5vbigncGF1c2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzdHJlYW0uX3BhdXNlZCA9IHRydWVcbiAgICB9KVxuICAgIC5vbignZHJhaW4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzdHJlYW0uX3BhdXNlZCA9IGZhbHNlXG4gICAgfSlcbiAgIFxuICBmdW5jdGlvbiBkZXN0cm95U29vbiAoKSB7XG4gICAgcHJvY2Vzcy5uZXh0VGljayhzdHJlYW0uZGVzdHJveS5iaW5kKHN0cmVhbSkpXG4gIH1cblxuICBpZih3cml0ZSlcbiAgICBzdHJlYW0ub24oJ19kYXRhJywgd3JpdGUpXG4gIGlmKGVuZClcbiAgICBzdHJlYW0ub24oJ19lbmQnLCBlbmQpXG5cbiAgLy9kZXN0cm95IHRoZSBzdHJlYW0gb25jZSBib3RoIGVuZHMgYXJlIG92ZXJcbiAgLy9idXQgZG8gaXQgaW4gbmV4dFRpY2ssIHNvIHRoYXQgb3RoZXIgbGlzdGVuZXJzXG4gIC8vb24gZW5kIGhhdmUgdGltZSB0byByZXNwb25kXG4gIHN0cmVhbS5vbmNlKCdlbmQnLCBmdW5jdGlvbiAoKSB7IFxuICAgIHN0cmVhbS5yZWFkYWJsZSA9IGZhbHNlXG4gICAgaWYoIXN0cmVhbS53cml0YWJsZSkge1xuICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0cmVhbS5kZXN0cm95KClcbiAgICAgIH0pXG4gICAgfVxuICB9KVxuXG4gIHN0cmVhbS5vbmNlKCdfZW5kJywgZnVuY3Rpb24gKCkgeyBcbiAgICBzdHJlYW0ud3JpdGFibGUgPSBmYWxzZVxuICAgIGlmKCFzdHJlYW0ucmVhZGFibGUpXG4gICAgICBzdHJlYW0uZGVzdHJveSgpXG4gIH0pXG5cbiAgLy8gdGhpcyBpcyB0aGUgZGVmYXVsdCB3cml0ZSBtZXRob2QsXG4gIC8vIGlmIHlvdSBvdmVyaWRlIGl0LCB5b3UgYXJlIHJlc3Bvc2libGVcbiAgLy8gZm9yIHBhdXNlIHN0YXRlLlxuXG4gIFxuICBzdHJlYW0uX2RhdGEgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIGlmKCFzdHJlYW0ucGF1c2VkICYmICFidWZmZXIubGVuZ3RoKVxuICAgICAgc3RyZWFtLmVtaXQoJ2RhdGEnLCBkYXRhKVxuICAgIGVsc2UgXG4gICAgICBidWZmZXIucHVzaChkYXRhKVxuICAgIHJldHVybiAhKHN0cmVhbS5wYXVzZWQgfHwgYnVmZmVyLmxlbmd0aClcbiAgfVxuXG4gIHN0cmVhbS5fZW5kID0gZnVuY3Rpb24gKGRhdGEpIHsgXG4gICAgaWYoZGF0YSkgc3RyZWFtLl9kYXRhKGRhdGEpXG4gICAgaWYoZW1pdEVuZCkgcmV0dXJuXG4gICAgZW1pdEVuZCA9IHRydWVcbiAgICAvL2Rlc3Ryb3kgaXMgaGFuZGxlZCBhYm92ZS5cbiAgICBzdHJlYW0uZHJhaW4oKVxuICB9XG5cbiAgc3RyZWFtLndyaXRlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBzdHJlYW0uZW1pdCgnX2RhdGEnLCBkYXRhKVxuICAgIHJldHVybiAhc3RyZWFtLl9wYXVzZWRcbiAgfVxuXG4gIHN0cmVhbS5lbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgc3RyZWFtLndyaXRhYmxlID0gZmFsc2VcbiAgICBpZihzdHJlYW0uZW5kZWQpIHJldHVyblxuICAgIHN0cmVhbS5lbmRlZCA9IHRydWVcbiAgICBzdHJlYW0uZW1pdCgnX2VuZCcpXG4gIH1cblxuICBzdHJlYW0uZHJhaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoIWJ1ZmZlci5sZW5ndGggJiYgIWVtaXRFbmQpIHJldHVyblxuICAgIC8vaWYgdGhlIHN0cmVhbSBpcyBwYXVzZWQgYWZ0ZXIganVzdCBiZWZvcmUgZW1pdEVuZCgpXG4gICAgLy9lbmQgc2hvdWxkIGJlIGJ1ZmZlcmVkLlxuICAgIHdoaWxlKCFzdHJlYW0ucGF1c2VkKSB7XG4gICAgICBpZihidWZmZXIubGVuZ3RoKSB7XG4gICAgICAgIHN0cmVhbS5lbWl0KCdkYXRhJywgYnVmZmVyLnNoaWZ0KCkpXG4gICAgICAgIGlmKGJ1ZmZlci5sZW5ndGggPT0gMCkge1xuICAgICAgICAgIHN0cmVhbS5lbWl0KCdfZHJhaW4nKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmKGVtaXRFbmQgJiYgc3RyZWFtLnJlYWRhYmxlKSB7XG4gICAgICAgIHN0cmVhbS5yZWFkYWJsZSA9IGZhbHNlXG4gICAgICAgIHN0cmVhbS5lbWl0KCdlbmQnKVxuICAgICAgICByZXR1cm5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vaWYgdGhlIGJ1ZmZlciBoYXMgZW1wdGllZC4gZW1pdCBkcmFpbi5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdmFyIHN0YXJ0ZWQgPSBmYWxzZVxuICBzdHJlYW0ucmVzdW1lID0gZnVuY3Rpb24gKCkge1xuICAgIC8vdGhpcyBpcyB3aGVyZSBJIG5lZWQgcGF1c2VSZWFkLCBhbmQgcGF1c2VXcml0ZS5cbiAgICAvL2hlcmUgdGhlIHJlYWRpbmcgc2lkZSBpcyB1bnBhdXNlZCxcbiAgICAvL2J1dCB0aGUgd3JpdGluZyBzaWRlIG1heSBzdGlsbCBiZSBwYXVzZWQuXG4gICAgLy90aGUgd2hvbGUgYnVmZmVyIG1pZ2h0IG5vdCBlbXBpdHkgYXQgb25jZS5cbiAgICAvL2l0IG1pZ2h0IHBhdXNlIGFnYWluLlxuICAgIC8vdGhlIHN0cmVhbSBzaG91bGQgbmV2ZXIgZW1pdCBkYXRhIGluYmV0d2VlbiBwYXVzZSgpLi4ucmVzdW1lKClcbiAgICAvL2FuZCB3cml0ZSBzaG91bGQgcmV0dXJuICFidWZmZXIubGVuZ3RoXG4gICAgc3RhcnRlZCA9IHRydWVcbiAgICBzdHJlYW0ucGF1c2VkID0gZmFsc2VcbiAgICBzdHJlYW0uZHJhaW4oKSAvL3dpbGwgZW1pdCBkcmFpbiBpZiBidWZmZXIgZW1wdGllcy5cbiAgICByZXR1cm4gc3RyZWFtXG4gIH1cblxuICBzdHJlYW0uZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZihkZXN0cm95ZWQpIHJldHVyblxuICAgIGRlc3Ryb3llZCA9IGVuZGVkID0gdHJ1ZSAgICAgXG4gICAgYnVmZmVyLmxlbmd0aCA9IDBcbiAgICBzdHJlYW0uZW1pdCgnY2xvc2UnKVxuICB9XG4gIHZhciBwYXVzZUNhbGxlZCA9IGZhbHNlXG4gIHN0cmVhbS5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBzdGFydGVkID0gdHJ1ZVxuICAgIHN0cmVhbS5wYXVzZWQgPSB0cnVlXG4gICAgc3RyZWFtLmVtaXQoJ19wYXVzZScpXG4gICAgcmV0dXJuIHN0cmVhbVxuICB9XG4gIHN0cmVhbS5fcGF1c2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoIXN0cmVhbS5fcGF1c2VkKSB7XG4gICAgICBzdHJlYW0uX3BhdXNlZCA9IHRydWVcbiAgICAgIHN0cmVhbS5lbWl0KCdwYXVzZScpXG4gICAgfVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgc3RyZWFtLnBhdXNlZCA9IHRydWVcbiAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgLy91bmxlc3MgdGhlIHVzZXIgbWFudWFsbHkgcGF1c2VkXG4gICAgaWYoc3RhcnRlZCkgcmV0dXJuXG4gICAgc3RyZWFtLnJlc3VtZSgpXG4gIH0pXG4gXG4gIHJldHVybiBzdHJlYW1cbn1cblxuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh3cmFwcGVyKSB7XG5cbiAgaWYoJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygd3JhcHBlcilcbiAgICByZXR1cm4gd3JhcHBlclxuICBcbiAgcmV0dXJuIGV4cG9ydHNbd3JhcHBlcl0gfHwgZXhwb3J0cy5qc29uXG59XG5cbmV4cG9ydHMuanNvbiA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcblxuICB2YXIgd3JpdGUgPSBzdHJlYW0ud3JpdGVcbiAgdmFyIHNvRmFyID0gJydcblxuICBmdW5jdGlvbiBwYXJzZSAobGluZSkge1xuICAgIHZhciBqc1xuICAgIHRyeSB7XG4gICAgICBqcyA9IEpTT04ucGFyc2UobGluZSlcbiAgICAgIC8vaWdub3JlIGxpbmVzIG9mIHdoaXRlc3BhY2UuLi5cbiAgICB9IGNhdGNoIChlcnIpIHsgXG4gICAgICByZXR1cm4gc3RyZWFtLmVtaXQoJ2Vycm9yJywgZXJyKVxuICAgICAgLy9yZXR1cm4gY29uc29sZS5lcnJvcignaW52YWxpZCBKU09OJywgbGluZSlcbiAgICB9XG4gICAgaWYoanMgIT09IHVuZGVmaW5lZClcbiAgICAgIHdyaXRlLmNhbGwoc3RyZWFtLCBqcylcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uRGF0YSAoZGF0YSkge1xuICAgIHZhciBsaW5lcyA9IChzb0ZhciArIGRhdGEpLnNwbGl0KCdcXG4nKVxuICAgIHNvRmFyID0gbGluZXMucG9wKClcbiAgICB3aGlsZShsaW5lcy5sZW5ndGgpIHtcbiAgICAgIHBhcnNlKGxpbmVzLnNoaWZ0KCkpXG4gICAgfVxuICB9XG5cbiAgc3RyZWFtLndyaXRlID0gb25EYXRhXG4gIFxuICB2YXIgZW5kID0gc3RyZWFtLmVuZFxuXG4gIHN0cmVhbS5lbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIGlmKGRhdGEpXG4gICAgICBzdHJlYW0ud3JpdGUoZGF0YSlcbiAgICAvL2lmIHRoZXJlIGlzIGFueSBsZWZ0IG92ZXIuLi5cbiAgICBpZihzb0Zhcikge1xuICAgICAgcGFyc2Uoc29GYXIpXG4gICAgfVxuICAgIHJldHVybiBlbmQuY2FsbChzdHJlYW0pXG4gIH1cblxuICBzdHJlYW0uZW1pdCA9IGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xuXG4gICAgaWYoZXZlbnQgPT0gJ2RhdGEnKSB7XG4gICAgICBkYXRhID0gSlNPTi5zdHJpbmdpZnkoZGF0YSkgKyAnXFxuJ1xuICAgIH1cbiAgICAvL3NpbmNlIGFsbCBzdHJlYW0gZXZlbnRzIG9ubHkgdXNlIG9uZSBhcmd1bWVudCwgdGhpcyBpcyBva2F5Li4uXG4gICAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0LmNhbGwoc3RyZWFtLCBldmVudCwgZGF0YSlcbiAgfVxuXG4gIHJldHVybiBzdHJlYW1cbi8vICByZXR1cm4gZXMucGlwZWxpbmUoZXMuc3BsaXQoKSwgZXMucGFyc2UoKSwgc3RyZWFtLCBlcy5zdHJpbmdpZnkoKSlcbn1cblxuZXhwb3J0cy5yYXcgPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gIHJldHVybiBzdHJlYW1cbn1cblxuIiwiLy8gSWYgYERhdGUubm93KClgIGlzIGludm9rZWQgdHdpY2UgcXVpY2tseSwgaXQncyBwb3NzaWJsZSB0byBnZXQgdHdvXG4vLyBpZGVudGljYWwgdGltZSBzdGFtcHMuIFRvIGF2b2lkIGdlbmVyYXRpb24gZHVwbGljYXRpb25zLCBzdWJzZXF1ZW50XG4vLyBjYWxscyBhcmUgbWFudWFsbHkgb3JkZXJlZCB0byBmb3JjZSB1bmlxdWVuZXNzLlxuXG52YXIgX2xhc3QgPSAwXG52YXIgX2NvdW50ID0gMVxudmFyIGFkanVzdGVkID0gMFxudmFyIF9hZGp1c3RlZCA9IDBcblxubW9kdWxlLmV4cG9ydHMgPVxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICAvKipcbiAgUmV0dXJucyBOT1QgYW4gYWNjdXJhdGUgcmVwcmVzZW50YXRpb24gb2YgdGhlIGN1cnJlbnQgdGltZS5cbiAgU2luY2UganMgb25seSBtZWFzdXJlcyB0aW1lIGFzIG1zLCBpZiB5b3UgY2FsbCBgRGF0ZS5ub3coKWBcbiAgdHdpY2UgcXVpY2tseSwgaXQncyBwb3NzaWJsZSB0byBnZXQgdHdvIGlkZW50aWNhbCB0aW1lIHN0YW1wcy5cbiAgVGhpcyBmdW5jdGlvbiBndWFyYW50ZWVzIHVuaXF1ZSBidXQgbWF5YmUgaW5hY2N1cmF0ZSByZXN1bHRzXG4gIG9uIGVhY2ggY2FsbC5cbiAgKiovXG4gIC8vdW5jb21tZW50IHRoaXMgd2VuXG4gIHZhciB0aW1lID0gRGF0ZS5ub3coKVxuICAvL3RpbWUgPSB+fiAodGltZSAvIDEwMDApIFxuICAvL15eXnVuY29tbWVudCB3aGVuIHRlc3RpbmcuLi5cblxuICAvKipcbiAgSWYgdGltZSByZXR1cm5lZCBpcyBzYW1lIGFzIGluIGxhc3QgY2FsbCwgYWRqdXN0IGl0IGJ5XG4gIGFkZGluZyBhIG51bWJlciBiYXNlZCBvbiB0aGUgY291bnRlci4gXG4gIENvdW50ZXIgaXMgaW5jcmVtZW50ZWQgc28gdGhhdCBuZXh0IGNhbGwgZ2V0J3MgYWRqdXN0ZWQgcHJvcGVybHkuXG4gIEJlY2F1c2UgZmxvYXRzIGhhdmUgcmVzdHJpY3RlZCBwcmVjaXNpb24sIFxuICBtYXkgbmVlZCB0byBzdGVwIHBhc3Qgc29tZSB2YWx1ZXMuLi5cbiAgKiovXG4gIGlmIChfbGFzdCA9PT0gdGltZSkgIHtcbiAgICBkbyB7XG4gICAgICBhZGp1c3RlZCA9IHRpbWUgKyAoKF9jb3VudCsrKSAvIChfY291bnQgKyA5OTkpKVxuICAgIH0gd2hpbGUgKGFkanVzdGVkID09PSBfYWRqdXN0ZWQpXG4gICAgX2FkanVzdGVkID0gYWRqdXN0ZWRcbiAgfVxuICAvLyBJZiBsYXN0IHRpbWUgd2FzIGRpZmZlcmVudCByZXNldCB0aW1lciBiYWNrIHRvIGAxYC5cbiAgZWxzZSB7XG4gICAgX2NvdW50ID0gMVxuICAgIGFkanVzdGVkID0gdGltZVxuICB9XG4gIF9hZGp1c3RlZCA9IGFkanVzdGVkXG4gIF9sYXN0ID0gdGltZVxuICByZXR1cm4gYWRqdXN0ZWRcbn1cbiJdfQ==
;