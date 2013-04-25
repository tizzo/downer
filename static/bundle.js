;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){

var RText     = require('r-edit')
var reconnect = require('reconnect')
var reloader  = require('client-reloader')
var widget    = require('r-edit/widget')
var marked    = require('marked')

var rText = RTEXT = RText()

reconnect(reloader(function (stream) {
  stream.pipe(rText.createStream()).pipe(stream)
})).connect('/shoe');

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

},{"r-edit/widget":2,"client-reloader":3,"marked":4,"r-edit":5,"reconnect":6}],2:[function(require,module,exports){

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

},{"r-array/widget":7}],4:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){

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


},{}],8:[function(require,module,exports){
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

},{"events":9}],10:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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
},{"__browserify_process":10}],3:[function(require,module,exports){

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

},{"header-stream":11}],5:[function(require,module,exports){
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

},{"util":8,"adiff":12,"r-array":13}],12:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){

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

},{}],6:[function(require,module,exports){

var shoe = require('shoe')

module.exports = require('./inject')(function (){ 
  var args = [].slice.call(arguments)
  return shoe.apply(null, args)
})

},{"./inject":14,"shoe":15}],14:[function(require,module,exports){
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

},{"events":9,"./widget":16,"backoff":17}],18:[function(require,module,exports){
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

},{"events":9,"util":8}],19:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){

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

},{"util":8,"scuttlebutt/util":19,"between":20,"scuttlebutt":21}],15:[function(require,module,exports){
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

},{"stream":18,"sockjs-client":22}],17:[function(require,module,exports){
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


},{"./lib/backoff":23,"./lib/strategy/fibonacci":24,"./lib/strategy/exponential":25}],16:[function(require,module,exports){

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

},{"h":26}],20:[function(require,module,exports){

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

},{}],22:[function(require,module,exports){
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
},{}],23:[function(require,module,exports){
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


},{"events":9,"util":8}],26:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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


},{"util":8,"./strategy":27}],25:[function(require,module,exports){
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


},{"util":8,"./strategy":27}],21:[function(require,module,exports){
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
},{"events":9,"util":8,"./util":19,"iterate":28,"duplex":29,"stream-serializer":30,"monotonic-timestamp":31,"__browserify_process":10}],27:[function(require,module,exports){
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


},{"events":9,"util":8}],28:[function(require,module,exports){

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

},{}],29:[function(require,module,exports){
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
},{"stream":18,"__browserify_process":10}],30:[function(require,module,exports){

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


},{"events":9}],31:[function(require,module,exports){
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvY2xpZW50LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvd2lkZ2V0LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9tYXJrZWQvbGliL21hcmtlZC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9yLWFycmF5L3dpZGdldC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2J1aWx0aW4vdXRpbC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL2V2ZW50cy5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvY2xpZW50LXJlbG9hZGVyL2Jyb3dzZXIuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9hZGlmZi9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvY2xpZW50LXJlbG9hZGVyL25vZGVfbW9kdWxlcy9oZWFkZXItc3RyZWFtL2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yZWNvbm5lY3Qvc2hvZS5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvcmVjb25uZWN0L2luamVjdC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2J1aWx0aW4vc3RyZWFtLmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvbm9kZV9tb2R1bGVzL3ItYXJyYXkvbm9kZV9tb2R1bGVzL3NjdXR0bGVidXR0L3V0aWwuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9ub2RlX21vZHVsZXMvci1hcnJheS9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvc2hvZS9icm93c2VyLmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yZWNvbm5lY3Qvbm9kZV9tb2R1bGVzL2JhY2tvZmYvaW5kZXguanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3JlY29ubmVjdC93aWRnZXQuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3ItZWRpdC9ub2RlX21vZHVsZXMvci1hcnJheS9ub2RlX21vZHVsZXMvYmV0d2Vlbi9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvc2hvZS9ub2RlX21vZHVsZXMvc29ja2pzLWNsaWVudC9zb2NranMuanMiLCIvVXNlcnMvaG93YXJkdHlzb24vRG9jdW1lbnRzL0NvZGUvTm9kZS5qcy9kb3duZXIvbm9kZV9tb2R1bGVzL3JlY29ubmVjdC9ub2RlX21vZHVsZXMvYmFja29mZi9saWIvYmFja29mZi5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvcmVjb25uZWN0L25vZGVfbW9kdWxlcy9oL2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yZWNvbm5lY3Qvbm9kZV9tb2R1bGVzL2JhY2tvZmYvbGliL3N0cmF0ZWd5L2ZpYm9uYWNjaS5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvcmVjb25uZWN0L25vZGVfbW9kdWxlcy9iYWNrb2ZmL2xpYi9zdHJhdGVneS9leHBvbmVudGlhbC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9yLWFycmF5L25vZGVfbW9kdWxlcy9zY3V0dGxlYnV0dC9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvcmVjb25uZWN0L25vZGVfbW9kdWxlcy9iYWNrb2ZmL2xpYi9zdHJhdGVneS9zdHJhdGVneS5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9yLWFycmF5L25vZGVfbW9kdWxlcy9zY3V0dGxlYnV0dC9ub2RlX21vZHVsZXMvaXRlcmF0ZS9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9yLWFycmF5L25vZGVfbW9kdWxlcy9zY3V0dGxlYnV0dC9ub2RlX21vZHVsZXMvZHVwbGV4L2luZGV4LmpzIiwiL1VzZXJzL2hvd2FyZHR5c29uL0RvY3VtZW50cy9Db2RlL05vZGUuanMvZG93bmVyL25vZGVfbW9kdWxlcy9yLWVkaXQvbm9kZV9tb2R1bGVzL3ItYXJyYXkvbm9kZV9tb2R1bGVzL3NjdXR0bGVidXR0L25vZGVfbW9kdWxlcy9zdHJlYW0tc2VyaWFsaXplci9pbmRleC5qcyIsIi9Vc2Vycy9ob3dhcmR0eXNvbi9Eb2N1bWVudHMvQ29kZS9Ob2RlLmpzL2Rvd25lci9ub2RlX21vZHVsZXMvci1lZGl0L25vZGVfbW9kdWxlcy9yLWFycmF5L25vZGVfbW9kdWxlcy9zY3V0dGxlYnV0dC9ub2RlX21vZHVsZXMvbW9ub3RvbmljLXRpbWVzdGFtcC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmpDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcHhFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiXG52YXIgUlRleHQgICAgID0gcmVxdWlyZSgnci1lZGl0JylcbnZhciByZWNvbm5lY3QgPSByZXF1aXJlKCdyZWNvbm5lY3QnKVxudmFyIHJlbG9hZGVyICA9IHJlcXVpcmUoJ2NsaWVudC1yZWxvYWRlcicpXG52YXIgd2lkZ2V0ICAgID0gcmVxdWlyZSgnci1lZGl0L3dpZGdldCcpXG52YXIgbWFya2VkICAgID0gcmVxdWlyZSgnbWFya2VkJylcblxudmFyIHJUZXh0ID0gUlRFWFQgPSBSVGV4dCgpXG5cbnJlY29ubmVjdChyZWxvYWRlcihmdW5jdGlvbiAoc3RyZWFtKSB7XG4gIHN0cmVhbS5waXBlKHJUZXh0LmNyZWF0ZVN0cmVhbSgpKS5waXBlKHN0cmVhbSlcbn0pKS5jb25uZWN0KCcvc2hvZScpO1xuXG4vL3VzaW5nIHRoZSBkZWZhdWx0IHRlbXBsYXRlLi4uXG50ZXh0QXJlYSA9IHJUZXh0LndpZGdldCgpXG4kKCcjdGV4dCcpLmFwcGVuZCh0ZXh0QXJlYSk7XG4kdGV4dEFyZWEgPSAkKCcjdGV4dCB0ZXh0YXJlYScpO1xudmFyIHVwZGF0ZU1hcmtkb3duID0gZnVuY3Rpb24oKSB7XG4gICQoJyNtYXJrZG93bicpLmh0bWwobWFya2VkKCR0ZXh0QXJlYS52YWwoKSkpO1xufTtcbi8vICR0ZXh0QXJlYS5vbignY2hhbmdlJywgdXBkYXRlTWFya2Rvd24pO1xuc2V0SW50ZXJ2YWwodXBkYXRlTWFya2Rvd24sIDEwKTtcbiQoJyNtYXJrZG93bicpLmh0bWwobWFya2VkKCR0ZXh0QXJlYS52YWwoKSkpO1xuLy8gJCgnI21hcmtkb3duJykuYXBwZW5kKHdpZGdldChyVGV4dCkpO1xuIiwiXG5mdW5jdGlvbiB0cmltIChzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5zdWJzdHJpbmcoMSwgc3RyaW5nLmxlbmd0aCAtIDEpXG59XG5cbmZ1bmN0aW9uIHN0eWxlIChyeCwgdGFnKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodGV4dCkge1xuICAgIHZhciBtID0gcnguZXhlYyh0ZXh0KVxuICAgIHdoaWxlIChtKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG1bMF0sICc8Jyt0YWcrJz4nK3RyaW0obVswXSkrJzwvJyt0YWcrJz4nKVxuICAgICAgbSA9IHJ4LmV4ZWModGV4dClcbiAgICB9XG4gICAgcmV0dXJuIHRleHRcbiAgfVxufVxuXG52YXIgaXRhbGljcyA9IHN0eWxlKC9fW15fXStfLywgJ2VtJylcbnZhciBib2xkICAgID0gc3R5bGUoL1xcKlteXFwqXStcXCovLCAnc3Ryb25nJylcbnZhciBjb2RlICAgID0gc3R5bGUoL2BbXmBdK2AvLCAnY29kZScpXG5cbmZ1bmN0aW9uIHByZWZpeCAocngsIHRhZykge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbCkge1xuICAgIHZhciBtID0gcnguZXhlYyh2YWwpXG4gICAgaWYobSkge1xuICAgICAgdmFyIGwgPSBtWzBdLmxlbmd0aFxuICAgICAgLy9vaCB5ZWFoLCBlc2NhcGUgY2hhcnMuLi5cbiAgICAgIHZhciB0ID0gJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIHRhZyA/IHRhZyhtKSA6IHRhZ1xuICAgICAgcmV0dXJuICc8Jyt0Kyc+Jyt2YWwuc3Vic3RyaW5nKGwpKyc8LycrdCsnPidcbiAgICB9XG4gICAgcmV0dXJuIHZhbFxuICB9XG59XG5cbnZhciBoZWFkZXIgPSBwcmVmaXgoL14jKy8sIGZ1bmN0aW9uIChtKSB7IHJldHVybiAnSCcrbVswXS5sZW5ndGggfSlcbnZhciBsaSA9IHByZWZpeCgvXlxccyotKy8sICAnbGknKVxuXG5mdW5jdGlvbiBzdHlsZXMgKHRleHQpIHtcbiAgcmV0dXJuIGhlYWRlcihsaShib2xkKGl0YWxpY3MoY29kZSh0ZXh0KSkpKSlcbn1cblxuZnVuY3Rpb24gdG9IVE1MICh2YWwpIHtcbiAgaWYoJ1xcbicgPT09IHZhbClcbiAgICByZXR1cm4gJzxici8+J1xuICByZXR1cm4gc3R5bGVzKHZhbClcbn1cblxuZnVuY3Rpb24gZGVmYXVsdFRlbXBsYXRlICh2YWwsIGtleSwgZWwpIHtcbiAgaWYoZWwpXG4gICAgcmV0dXJuIGVsLmlubmVySFRNTCA9IHRvSFRNTCh2YWwpLCBlbFxuICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcbiAgZWwuaW5uZXJIVE1MID0gdG9IVE1MKHZhbClcbiAgcmV0dXJuIGVsXG59XG5cbnZhciB3aWRnZXQgPSByZXF1aXJlKCdyLWFycmF5L3dpZGdldCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHJFZGl0LCB0ZW1wbGF0ZSkge1xuICByZXR1cm4gd2lkZ2V0KHJFZGl0LCB0ZW1wbGF0ZSB8fCBkZWZhdWx0VGVtcGxhdGUpXG59XG4iLCIoZnVuY3Rpb24oZ2xvYmFsKXsvKipcbiAqIG1hcmtlZCAtIGEgbWFya2Rvd24gcGFyc2VyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMywgQ2hyaXN0b3BoZXIgSmVmZnJleS4gKE1JVCBMaWNlbnNlZClcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGpqL21hcmtlZFxuICovXG5cbjsoZnVuY3Rpb24oKSB7XG5cbi8qKlxuICogQmxvY2stTGV2ZWwgR3JhbW1hclxuICovXG5cbnZhciBibG9jayA9IHtcbiAgbmV3bGluZTogL15cXG4rLyxcbiAgY29kZTogL14oIHs0fVteXFxuXStcXG4qKSsvLFxuICBmZW5jZXM6IG5vb3AsXG4gIGhyOiAvXiggKlstKl9dKXszLH0gKig/Olxcbit8JCkvLFxuICBoZWFkaW5nOiAvXiAqKCN7MSw2fSkgKihbXlxcbl0rPykgKiMqICooPzpcXG4rfCQpLyxcbiAgbnB0YWJsZTogbm9vcCxcbiAgbGhlYWRpbmc6IC9eKFteXFxuXSspXFxuICooPXwtKXszLH0gKlxcbiovLFxuICBibG9ja3F1b3RlOiAvXiggKj5bXlxcbl0rKFxcblteXFxuXSspKlxcbiopKy8sXG4gIGxpc3Q6IC9eKCAqKShidWxsKSBbXFxzXFxTXSs/KD86aHJ8XFxuezIsfSg/ISApKD8hXFwxYnVsbCApXFxuKnxcXHMqJCkvLFxuICBodG1sOiAvXiAqKD86Y29tbWVudHxjbG9zZWR8Y2xvc2luZykgKig/OlxcbnsyLH18XFxzKiQpLyxcbiAgZGVmOiAvXiAqXFxbKFteXFxdXSspXFxdOiAqPD8oW15cXHM+XSspPj8oPzogK1tcIihdKFteXFxuXSspW1wiKV0pPyAqKD86XFxuK3wkKS8sXG4gIHRhYmxlOiBub29wLFxuICBwYXJhZ3JhcGg6IC9eKCg/OlteXFxuXStcXG4/KD8haHJ8aGVhZGluZ3xsaGVhZGluZ3xibG9ja3F1b3RlfHRhZ3xkZWYpKSspXFxuKi8sXG4gIHRleHQ6IC9eW15cXG5dKy9cbn07XG5cbmJsb2NrLmJ1bGxldCA9IC8oPzpbKistXXxcXGQrXFwuKS87XG5ibG9jay5pdGVtID0gL14oICopKGJ1bGwpIFteXFxuXSooPzpcXG4oPyFcXDFidWxsIClbXlxcbl0qKSovO1xuYmxvY2suaXRlbSA9IHJlcGxhY2UoYmxvY2suaXRlbSwgJ2dtJylcbiAgKC9idWxsL2csIGJsb2NrLmJ1bGxldClcbiAgKCk7XG5cbmJsb2NrLmxpc3QgPSByZXBsYWNlKGJsb2NrLmxpc3QpXG4gICgvYnVsbC9nLCBibG9jay5idWxsZXQpXG4gICgnaHInLCAvXFxuKyg/PSg/OiAqWy0qX10pezMsfSAqKD86XFxuK3wkKSkvKVxuICAoKTtcblxuYmxvY2suX3RhZyA9ICcoPyEoPzonXG4gICsgJ2F8ZW18c3Ryb25nfHNtYWxsfHN8Y2l0ZXxxfGRmbnxhYmJyfGRhdGF8dGltZXxjb2RlJ1xuICArICd8dmFyfHNhbXB8a2JkfHN1YnxzdXB8aXxifHV8bWFya3xydWJ5fHJ0fHJwfGJkaXxiZG8nXG4gICsgJ3xzcGFufGJyfHdicnxpbnN8ZGVsfGltZylcXFxcYilcXFxcdysoPyE6L3xAKVxcXFxiJztcblxuYmxvY2suaHRtbCA9IHJlcGxhY2UoYmxvY2suaHRtbClcbiAgKCdjb21tZW50JywgLzwhLS1bXFxzXFxTXSo/LS0+LylcbiAgKCdjbG9zZWQnLCAvPCh0YWcpW1xcc1xcU10rPzxcXC9cXDE+LylcbiAgKCdjbG9zaW5nJywgLzx0YWcoPzpcIlteXCJdKlwifCdbXiddKid8W14nXCI+XSkqPz4vKVxuICAoL3RhZy9nLCBibG9jay5fdGFnKVxuICAoKTtcblxuYmxvY2sucGFyYWdyYXBoID0gcmVwbGFjZShibG9jay5wYXJhZ3JhcGgpXG4gICgnaHInLCBibG9jay5ocilcbiAgKCdoZWFkaW5nJywgYmxvY2suaGVhZGluZylcbiAgKCdsaGVhZGluZycsIGJsb2NrLmxoZWFkaW5nKVxuICAoJ2Jsb2NrcXVvdGUnLCBibG9jay5ibG9ja3F1b3RlKVxuICAoJ3RhZycsICc8JyArIGJsb2NrLl90YWcpXG4gICgnZGVmJywgYmxvY2suZGVmKVxuICAoKTtcblxuLyoqXG4gKiBOb3JtYWwgQmxvY2sgR3JhbW1hclxuICovXG5cbmJsb2NrLm5vcm1hbCA9IG1lcmdlKHt9LCBibG9jayk7XG5cbi8qKlxuICogR0ZNIEJsb2NrIEdyYW1tYXJcbiAqL1xuXG5ibG9jay5nZm0gPSBtZXJnZSh7fSwgYmxvY2subm9ybWFsLCB7XG4gIGZlbmNlczogL14gKihgezMsfXx+ezMsfSkgKihcXHcrKT8gKlxcbihbXFxzXFxTXSs/KVxccypcXDEgKig/Olxcbit8JCkvLFxuICBwYXJhZ3JhcGg6IC9eL1xufSk7XG5cbmJsb2NrLmdmbS5wYXJhZ3JhcGggPSByZXBsYWNlKGJsb2NrLnBhcmFncmFwaClcbiAgKCcoPyEnLCAnKD8hJyArIGJsb2NrLmdmbS5mZW5jZXMuc291cmNlLnJlcGxhY2UoJ1xcXFwxJywgJ1xcXFwyJykgKyAnfCcpXG4gICgpO1xuXG4vKipcbiAqIEdGTSArIFRhYmxlcyBCbG9jayBHcmFtbWFyXG4gKi9cblxuYmxvY2sudGFibGVzID0gbWVyZ2Uoe30sIGJsb2NrLmdmbSwge1xuICBucHRhYmxlOiAvXiAqKFxcUy4qXFx8LiopXFxuICooWy06XSsgKlxcfFstfCA6XSopXFxuKCg/Oi4qXFx8LiooPzpcXG58JCkpKilcXG4qLyxcbiAgdGFibGU6IC9eICpcXHwoLispXFxuICpcXHwoICpbLTpdK1stfCA6XSopXFxuKCg/OiAqXFx8LiooPzpcXG58JCkpKilcXG4qL1xufSk7XG5cbi8qKlxuICogQmxvY2sgTGV4ZXJcbiAqL1xuXG5mdW5jdGlvbiBMZXhlcihvcHRpb25zKSB7XG4gIHRoaXMudG9rZW5zID0gW107XG4gIHRoaXMudG9rZW5zLmxpbmtzID0ge307XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgbWFya2VkLmRlZmF1bHRzO1xuICB0aGlzLnJ1bGVzID0gYmxvY2subm9ybWFsO1xuXG4gIGlmICh0aGlzLm9wdGlvbnMuZ2ZtKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy50YWJsZXMpIHtcbiAgICAgIHRoaXMucnVsZXMgPSBibG9jay50YWJsZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucnVsZXMgPSBibG9jay5nZm07XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRXhwb3NlIEJsb2NrIFJ1bGVzXG4gKi9cblxuTGV4ZXIucnVsZXMgPSBibG9jaztcblxuLyoqXG4gKiBTdGF0aWMgTGV4IE1ldGhvZFxuICovXG5cbkxleGVyLmxleCA9IGZ1bmN0aW9uKHNyYywgb3B0aW9ucykge1xuICB2YXIgbGV4ZXIgPSBuZXcgTGV4ZXIob3B0aW9ucyk7XG4gIHJldHVybiBsZXhlci5sZXgoc3JjKTtcbn07XG5cbi8qKlxuICogUHJlcHJvY2Vzc2luZ1xuICovXG5cbkxleGVyLnByb3RvdHlwZS5sZXggPSBmdW5jdGlvbihzcmMpIHtcbiAgc3JjID0gc3JjXG4gICAgLnJlcGxhY2UoL1xcclxcbnxcXHIvZywgJ1xcbicpXG4gICAgLnJlcGxhY2UoL1xcdC9nLCAnICAgICcpXG4gICAgLnJlcGxhY2UoL1xcdTAwYTAvZywgJyAnKVxuICAgIC5yZXBsYWNlKC9cXHUyNDI0L2csICdcXG4nKTtcblxuICByZXR1cm4gdGhpcy50b2tlbihzcmMsIHRydWUpO1xufTtcblxuLyoqXG4gKiBMZXhpbmdcbiAqL1xuXG5MZXhlci5wcm90b3R5cGUudG9rZW4gPSBmdW5jdGlvbihzcmMsIHRvcCkge1xuICB2YXIgc3JjID0gc3JjLnJlcGxhY2UoL14gKyQvZ20sICcnKVxuICAgICwgbmV4dFxuICAgICwgbG9vc2VcbiAgICAsIGNhcFxuICAgICwgYnVsbFxuICAgICwgYlxuICAgICwgaXRlbVxuICAgICwgc3BhY2VcbiAgICAsIGlcbiAgICAsIGw7XG5cbiAgd2hpbGUgKHNyYykge1xuICAgIC8vIG5ld2xpbmVcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5uZXdsaW5lLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIGlmIChjYXBbMF0ubGVuZ3RoID4gMSkge1xuICAgICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAnc3BhY2UnXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNvZGVcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5jb2RlLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIGNhcCA9IGNhcFswXS5yZXBsYWNlKC9eIHs0fS9nbSwgJycpO1xuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdjb2RlJyxcbiAgICAgICAgdGV4dDogIXRoaXMub3B0aW9ucy5wZWRhbnRpY1xuICAgICAgICAgID8gY2FwLnJlcGxhY2UoL1xcbiskLywgJycpXG4gICAgICAgICAgOiBjYXBcbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gZmVuY2VzIChnZm0pXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuZmVuY2VzLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAnY29kZScsXG4gICAgICAgIGxhbmc6IGNhcFsyXSxcbiAgICAgICAgdGV4dDogY2FwWzNdXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGhlYWRpbmdcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5oZWFkaW5nLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAnaGVhZGluZycsXG4gICAgICAgIGRlcHRoOiBjYXBbMV0ubGVuZ3RoLFxuICAgICAgICB0ZXh0OiBjYXBbMl1cbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdGFibGUgbm8gbGVhZGluZyBwaXBlIChnZm0pXG4gICAgaWYgKHRvcCAmJiAoY2FwID0gdGhpcy5ydWxlcy5ucHRhYmxlLmV4ZWMoc3JjKSkpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG5cbiAgICAgIGl0ZW0gPSB7XG4gICAgICAgIHR5cGU6ICd0YWJsZScsXG4gICAgICAgIGhlYWRlcjogY2FwWzFdLnJlcGxhY2UoL14gKnwgKlxcfCAqJC9nLCAnJykuc3BsaXQoLyAqXFx8ICovKSxcbiAgICAgICAgYWxpZ246IGNhcFsyXS5yZXBsYWNlKC9eICp8XFx8ICokL2csICcnKS5zcGxpdCgvICpcXHwgKi8pLFxuICAgICAgICBjZWxsczogY2FwWzNdLnJlcGxhY2UoL1xcbiQvLCAnJykuc3BsaXQoJ1xcbicpXG4gICAgICB9O1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgaXRlbS5hbGlnbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoL14gKi0rOiAqJC8udGVzdChpdGVtLmFsaWduW2ldKSkge1xuICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSAncmlnaHQnO1xuICAgICAgICB9IGVsc2UgaWYgKC9eICo6LSs6ICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKSB7XG4gICAgICAgICAgaXRlbS5hbGlnbltpXSA9ICdjZW50ZXInO1xuICAgICAgICB9IGVsc2UgaWYgKC9eICo6LSsgKiQvLnRlc3QoaXRlbS5hbGlnbltpXSkpIHtcbiAgICAgICAgICBpdGVtLmFsaWduW2ldID0gJ2xlZnQnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBpdGVtLmNlbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGl0ZW0uY2VsbHNbaV0gPSBpdGVtLmNlbGxzW2ldLnNwbGl0KC8gKlxcfCAqLyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudG9rZW5zLnB1c2goaXRlbSk7XG5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGxoZWFkaW5nXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMubGhlYWRpbmcuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdoZWFkaW5nJyxcbiAgICAgICAgZGVwdGg6IGNhcFsyXSA9PT0gJz0nID8gMSA6IDIsXG4gICAgICAgIHRleHQ6IGNhcFsxXVxuICAgICAgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBoclxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmhyLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAnaHInXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGJsb2NrcXVvdGVcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5ibG9ja3F1b3RlLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcblxuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdibG9ja3F1b3RlX3N0YXJ0J1xuICAgICAgfSk7XG5cbiAgICAgIGNhcCA9IGNhcFswXS5yZXBsYWNlKC9eICo+ID8vZ20sICcnKTtcblxuICAgICAgLy8gUGFzcyBgdG9wYCB0byBrZWVwIHRoZSBjdXJyZW50XG4gICAgICAvLyBcInRvcGxldmVsXCIgc3RhdGUuIFRoaXMgaXMgZXhhY3RseVxuICAgICAgLy8gaG93IG1hcmtkb3duLnBsIHdvcmtzLlxuICAgICAgdGhpcy50b2tlbihjYXAsIHRvcCk7XG5cbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAnYmxvY2txdW90ZV9lbmQnXG4gICAgICB9KTtcblxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gbGlzdFxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmxpc3QuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuXG4gICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2xpc3Rfc3RhcnQnLFxuICAgICAgICBvcmRlcmVkOiBpc0Zpbml0ZShjYXBbMl0pXG4gICAgICB9KTtcblxuICAgICAgLy8gR2V0IGVhY2ggdG9wLWxldmVsIGl0ZW0uXG4gICAgICBjYXAgPSBjYXBbMF0ubWF0Y2godGhpcy5ydWxlcy5pdGVtKTtcblxuICAgICAgLy8gR2V0IGJ1bGxldC5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc21hcnRMaXN0cykge1xuICAgICAgICBidWxsID0gYmxvY2suYnVsbGV0LmV4ZWMoY2FwWzBdKVswXTtcbiAgICAgIH1cblxuICAgICAgbmV4dCA9IGZhbHNlO1xuICAgICAgbCA9IGNhcC5sZW5ndGg7XG4gICAgICBpID0gMDtcblxuICAgICAgZm9yICg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGNhcFtpXTtcblxuICAgICAgICAvLyBSZW1vdmUgdGhlIGxpc3QgaXRlbSdzIGJ1bGxldFxuICAgICAgICAvLyBzbyBpdCBpcyBzZWVuIGFzIHRoZSBuZXh0IHRva2VuLlxuICAgICAgICBzcGFjZSA9IGl0ZW0ubGVuZ3RoO1xuICAgICAgICBpdGVtID0gaXRlbS5yZXBsYWNlKC9eICooWyorLV18XFxkK1xcLikgKy8sICcnKTtcblxuICAgICAgICAvLyBPdXRkZW50IHdoYXRldmVyIHRoZVxuICAgICAgICAvLyBsaXN0IGl0ZW0gY29udGFpbnMuIEhhY2t5LlxuICAgICAgICBpZiAofml0ZW0uaW5kZXhPZignXFxuICcpKSB7XG4gICAgICAgICAgc3BhY2UgLT0gaXRlbS5sZW5ndGg7XG4gICAgICAgICAgaXRlbSA9ICF0aGlzLm9wdGlvbnMucGVkYW50aWNcbiAgICAgICAgICAgID8gaXRlbS5yZXBsYWNlKG5ldyBSZWdFeHAoJ14gezEsJyArIHNwYWNlICsgJ30nLCAnZ20nKSwgJycpXG4gICAgICAgICAgICA6IGl0ZW0ucmVwbGFjZSgvXiB7MSw0fS9nbSwgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgdGhlIG5leHQgbGlzdCBpdGVtIGJlbG9uZ3MgaGVyZS5cbiAgICAgICAgLy8gQmFja3BlZGFsIGlmIGl0IGRvZXMgbm90IGJlbG9uZyBpbiB0aGlzIGxpc3QuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc21hcnRMaXN0cyAmJiBpICE9PSBsIC0gMSkge1xuICAgICAgICAgIGIgPSBibG9jay5idWxsZXQuZXhlYyhjYXBbaSsxXSlbMF07XG4gICAgICAgICAgaWYgKGJ1bGwgIT09IGIgJiYgIShidWxsWzFdID09PSAnLicgJiYgYlsxXSA9PT0gJy4nKSkge1xuICAgICAgICAgICAgc3JjID0gY2FwLnNsaWNlKGkgKyAxKS5qb2luKCdcXG4nKSArIHNyYztcbiAgICAgICAgICAgIGkgPSBsIC0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZXRlcm1pbmUgd2hldGhlciBpdGVtIGlzIGxvb3NlIG9yIG5vdC5cbiAgICAgICAgLy8gVXNlOiAvKF58XFxuKSg/ISApW15cXG5dK1xcblxcbig/IVxccyokKS9cbiAgICAgICAgLy8gZm9yIGRpc2NvdW50IGJlaGF2aW9yLlxuICAgICAgICBsb29zZSA9IG5leHQgfHwgL1xcblxcbig/IVxccyokKS8udGVzdChpdGVtKTtcbiAgICAgICAgaWYgKGkgIT09IGwgLSAxKSB7XG4gICAgICAgICAgbmV4dCA9IGl0ZW1baXRlbS5sZW5ndGgtMV0gPT09ICdcXG4nO1xuICAgICAgICAgIGlmICghbG9vc2UpIGxvb3NlID0gbmV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICAgIHR5cGU6IGxvb3NlXG4gICAgICAgICAgICA/ICdsb29zZV9pdGVtX3N0YXJ0J1xuICAgICAgICAgICAgOiAnbGlzdF9pdGVtX3N0YXJ0J1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBSZWN1cnNlLlxuICAgICAgICB0aGlzLnRva2VuKGl0ZW0sIGZhbHNlKTtcblxuICAgICAgICB0aGlzLnRva2Vucy5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAnbGlzdF9pdGVtX2VuZCdcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAnbGlzdF9lbmQnXG4gICAgICB9KTtcblxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gaHRtbFxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmh0bWwuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6IHRoaXMub3B0aW9ucy5zYW5pdGl6ZVxuICAgICAgICAgID8gJ3BhcmFncmFwaCdcbiAgICAgICAgICA6ICdodG1sJyxcbiAgICAgICAgcHJlOiBjYXBbMV0gPT09ICdwcmUnLFxuICAgICAgICB0ZXh0OiBjYXBbMF1cbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gZGVmXG4gICAgaWYgKHRvcCAmJiAoY2FwID0gdGhpcy5ydWxlcy5kZWYuZXhlYyhzcmMpKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIHRoaXMudG9rZW5zLmxpbmtzW2NhcFsxXS50b0xvd2VyQ2FzZSgpXSA9IHtcbiAgICAgICAgaHJlZjogY2FwWzJdLFxuICAgICAgICB0aXRsZTogY2FwWzNdXG4gICAgICB9O1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdGFibGUgKGdmbSlcbiAgICBpZiAodG9wICYmIChjYXAgPSB0aGlzLnJ1bGVzLnRhYmxlLmV4ZWMoc3JjKSkpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG5cbiAgICAgIGl0ZW0gPSB7XG4gICAgICAgIHR5cGU6ICd0YWJsZScsXG4gICAgICAgIGhlYWRlcjogY2FwWzFdLnJlcGxhY2UoL14gKnwgKlxcfCAqJC9nLCAnJykuc3BsaXQoLyAqXFx8ICovKSxcbiAgICAgICAgYWxpZ246IGNhcFsyXS5yZXBsYWNlKC9eICp8XFx8ICokL2csICcnKS5zcGxpdCgvICpcXHwgKi8pLFxuICAgICAgICBjZWxsczogY2FwWzNdLnJlcGxhY2UoLyg/OiAqXFx8ICopP1xcbiQvLCAnJykuc3BsaXQoJ1xcbicpXG4gICAgICB9O1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgaXRlbS5hbGlnbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoL14gKi0rOiAqJC8udGVzdChpdGVtLmFsaWduW2ldKSkge1xuICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSAncmlnaHQnO1xuICAgICAgICB9IGVsc2UgaWYgKC9eICo6LSs6ICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKSB7XG4gICAgICAgICAgaXRlbS5hbGlnbltpXSA9ICdjZW50ZXInO1xuICAgICAgICB9IGVsc2UgaWYgKC9eICo6LSsgKiQvLnRlc3QoaXRlbS5hbGlnbltpXSkpIHtcbiAgICAgICAgICBpdGVtLmFsaWduW2ldID0gJ2xlZnQnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBpdGVtLmNlbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGl0ZW0uY2VsbHNbaV0gPSBpdGVtLmNlbGxzW2ldXG4gICAgICAgICAgLnJlcGxhY2UoL14gKlxcfCAqfCAqXFx8ICokL2csICcnKVxuICAgICAgICAgIC5zcGxpdCgvICpcXHwgKi8pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnRva2Vucy5wdXNoKGl0ZW0pO1xuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyB0b3AtbGV2ZWwgcGFyYWdyYXBoXG4gICAgaWYgKHRvcCAmJiAoY2FwID0gdGhpcy5ydWxlcy5wYXJhZ3JhcGguZXhlYyhzcmMpKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIHRoaXMudG9rZW5zLnB1c2goe1xuICAgICAgICB0eXBlOiAncGFyYWdyYXBoJyxcbiAgICAgICAgdGV4dDogY2FwWzFdW2NhcFsxXS5sZW5ndGgtMV0gPT09ICdcXG4nXG4gICAgICAgICAgPyBjYXBbMV0uc2xpY2UoMCwgLTEpXG4gICAgICAgICAgOiBjYXBbMV1cbiAgICAgIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdGV4dFxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLnRleHQuZXhlYyhzcmMpKSB7XG4gICAgICAvLyBUb3AtbGV2ZWwgc2hvdWxkIG5ldmVyIHJlYWNoIGhlcmUuXG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgdGhpcy50b2tlbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgdGV4dDogY2FwWzBdXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChzcmMpIHtcbiAgICAgIHRocm93IG5ld1xuICAgICAgICBFcnJvcignSW5maW5pdGUgbG9vcCBvbiBieXRlOiAnICsgc3JjLmNoYXJDb2RlQXQoMCkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzLnRva2Vucztcbn07XG5cbi8qKlxuICogSW5saW5lLUxldmVsIEdyYW1tYXJcbiAqL1xuXG52YXIgaW5saW5lID0ge1xuICBlc2NhcGU6IC9eXFxcXChbXFxcXGAqe31cXFtcXF0oKSMrXFwtLiFfPl0pLyxcbiAgYXV0b2xpbms6IC9ePChbXiA+XSsoQHw6XFwvKVteID5dKyk+LyxcbiAgdXJsOiBub29wLFxuICB0YWc6IC9ePCEtLVtcXHNcXFNdKj8tLT58XjxcXC8/XFx3Kyg/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXidcIj5dKSo/Pi8sXG4gIGxpbms6IC9eIT9cXFsoaW5zaWRlKVxcXVxcKGhyZWZcXCkvLFxuICByZWZsaW5rOiAvXiE/XFxbKGluc2lkZSlcXF1cXHMqXFxbKFteXFxdXSopXFxdLyxcbiAgbm9saW5rOiAvXiE/XFxbKCg/OlxcW1teXFxdXSpcXF18W15cXFtcXF1dKSopXFxdLyxcbiAgc3Ryb25nOiAvXl9fKFtcXHNcXFNdKz8pX18oPyFfKXxeXFwqXFwqKFtcXHNcXFNdKz8pXFwqXFwqKD8hXFwqKS8sXG4gIGVtOiAvXlxcYl8oKD86X198W1xcc1xcU10pKz8pX1xcYnxeXFwqKCg/OlxcKlxcKnxbXFxzXFxTXSkrPylcXCooPyFcXCopLyxcbiAgY29kZTogL14oYCspXFxzKihbXFxzXFxTXSo/W15gXSlcXHMqXFwxKD8hYCkvLFxuICBicjogL14gezIsfVxcbig/IVxccyokKS8sXG4gIGRlbDogbm9vcCxcbiAgdGV4dDogL15bXFxzXFxTXSs/KD89W1xcXFw8IVxcW18qYF18IHsyLH1cXG58JCkvXG59O1xuXG5pbmxpbmUuX2luc2lkZSA9IC8oPzpcXFtbXlxcXV0qXFxdfFteXFxdXXxcXF0oPz1bXlxcW10qXFxdKSkqLztcbmlubGluZS5faHJlZiA9IC9cXHMqPD8oW15cXHNdKj8pPj8oPzpcXHMrWydcIl0oW1xcc1xcU10qPylbJ1wiXSk/XFxzKi87XG5cbmlubGluZS5saW5rID0gcmVwbGFjZShpbmxpbmUubGluaylcbiAgKCdpbnNpZGUnLCBpbmxpbmUuX2luc2lkZSlcbiAgKCdocmVmJywgaW5saW5lLl9ocmVmKVxuICAoKTtcblxuaW5saW5lLnJlZmxpbmsgPSByZXBsYWNlKGlubGluZS5yZWZsaW5rKVxuICAoJ2luc2lkZScsIGlubGluZS5faW5zaWRlKVxuICAoKTtcblxuLyoqXG4gKiBOb3JtYWwgSW5saW5lIEdyYW1tYXJcbiAqL1xuXG5pbmxpbmUubm9ybWFsID0gbWVyZ2Uoe30sIGlubGluZSk7XG5cbi8qKlxuICogUGVkYW50aWMgSW5saW5lIEdyYW1tYXJcbiAqL1xuXG5pbmxpbmUucGVkYW50aWMgPSBtZXJnZSh7fSwgaW5saW5lLm5vcm1hbCwge1xuICBzdHJvbmc6IC9eX18oPz1cXFMpKFtcXHNcXFNdKj9cXFMpX18oPyFfKXxeXFwqXFwqKD89XFxTKShbXFxzXFxTXSo/XFxTKVxcKlxcKig/IVxcKikvLFxuICBlbTogL15fKD89XFxTKShbXFxzXFxTXSo/XFxTKV8oPyFfKXxeXFwqKD89XFxTKShbXFxzXFxTXSo/XFxTKVxcKig/IVxcKikvXG59KTtcblxuLyoqXG4gKiBHRk0gSW5saW5lIEdyYW1tYXJcbiAqL1xuXG5pbmxpbmUuZ2ZtID0gbWVyZ2Uoe30sIGlubGluZS5ub3JtYWwsIHtcbiAgZXNjYXBlOiByZXBsYWNlKGlubGluZS5lc2NhcGUpKCddKScsICd+fF0pJykoKSxcbiAgdXJsOiAvXihodHRwcz86XFwvXFwvW15cXHM8XStbXjwuLDo7XCInKVxcXVxcc10pLyxcbiAgZGVsOiAvXn5+KD89XFxTKShbXFxzXFxTXSo/XFxTKX5+LyxcbiAgdGV4dDogcmVwbGFjZShpbmxpbmUudGV4dClcbiAgICAoJ118JywgJ35dfCcpXG4gICAgKCd8JywgJ3xodHRwcz86Ly98JylcbiAgICAoKVxufSk7XG5cbi8qKlxuICogR0ZNICsgTGluZSBCcmVha3MgSW5saW5lIEdyYW1tYXJcbiAqL1xuXG5pbmxpbmUuYnJlYWtzID0gbWVyZ2Uoe30sIGlubGluZS5nZm0sIHtcbiAgYnI6IHJlcGxhY2UoaW5saW5lLmJyKSgnezIsfScsICcqJykoKSxcbiAgdGV4dDogcmVwbGFjZShpbmxpbmUuZ2ZtLnRleHQpKCd7Mix9JywgJyonKSgpXG59KTtcblxuLyoqXG4gKiBJbmxpbmUgTGV4ZXIgJiBDb21waWxlclxuICovXG5cbmZ1bmN0aW9uIElubGluZUxleGVyKGxpbmtzLCBvcHRpb25zKSB7XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgbWFya2VkLmRlZmF1bHRzO1xuICB0aGlzLmxpbmtzID0gbGlua3M7XG4gIHRoaXMucnVsZXMgPSBpbmxpbmUubm9ybWFsO1xuXG4gIGlmICghdGhpcy5saW5rcykge1xuICAgIHRocm93IG5ld1xuICAgICAgRXJyb3IoJ1Rva2VucyBhcnJheSByZXF1aXJlcyBhIGBsaW5rc2AgcHJvcGVydHkuJyk7XG4gIH1cblxuICBpZiAodGhpcy5vcHRpb25zLmdmbSkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuYnJlYWtzKSB7XG4gICAgICB0aGlzLnJ1bGVzID0gaW5saW5lLmJyZWFrcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ydWxlcyA9IGlubGluZS5nZm07XG4gICAgfVxuICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5wZWRhbnRpYykge1xuICAgIHRoaXMucnVsZXMgPSBpbmxpbmUucGVkYW50aWM7XG4gIH1cbn1cblxuLyoqXG4gKiBFeHBvc2UgSW5saW5lIFJ1bGVzXG4gKi9cblxuSW5saW5lTGV4ZXIucnVsZXMgPSBpbmxpbmU7XG5cbi8qKlxuICogU3RhdGljIExleGluZy9Db21waWxpbmcgTWV0aG9kXG4gKi9cblxuSW5saW5lTGV4ZXIub3V0cHV0ID0gZnVuY3Rpb24oc3JjLCBsaW5rcywgb3B0aW9ucykge1xuICB2YXIgaW5saW5lID0gbmV3IElubGluZUxleGVyKGxpbmtzLCBvcHRpb25zKTtcbiAgcmV0dXJuIGlubGluZS5vdXRwdXQoc3JjKTtcbn07XG5cbi8qKlxuICogTGV4aW5nL0NvbXBpbGluZ1xuICovXG5cbklubGluZUxleGVyLnByb3RvdHlwZS5vdXRwdXQgPSBmdW5jdGlvbihzcmMpIHtcbiAgdmFyIG91dCA9ICcnXG4gICAgLCBsaW5rXG4gICAgLCB0ZXh0XG4gICAgLCBocmVmXG4gICAgLCBjYXA7XG5cbiAgd2hpbGUgKHNyYykge1xuICAgIC8vIGVzY2FwZVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmVzY2FwZS5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBvdXQgKz0gY2FwWzFdO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gYXV0b2xpbmtcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5hdXRvbGluay5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBpZiAoY2FwWzJdID09PSAnQCcpIHtcbiAgICAgICAgdGV4dCA9IGNhcFsxXVs2XSA9PT0gJzonXG4gICAgICAgICAgPyB0aGlzLm1hbmdsZShjYXBbMV0uc3Vic3RyaW5nKDcpKVxuICAgICAgICAgIDogdGhpcy5tYW5nbGUoY2FwWzFdKTtcbiAgICAgICAgaHJlZiA9IHRoaXMubWFuZ2xlKCdtYWlsdG86JykgKyB0ZXh0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGV4dCA9IGVzY2FwZShjYXBbMV0pO1xuICAgICAgICBocmVmID0gdGV4dDtcbiAgICAgIH1cbiAgICAgIG91dCArPSAnPGEgaHJlZj1cIidcbiAgICAgICAgKyBocmVmXG4gICAgICAgICsgJ1wiPidcbiAgICAgICAgKyB0ZXh0XG4gICAgICAgICsgJzwvYT4nO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdXJsIChnZm0pXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMudXJsLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIHRleHQgPSBlc2NhcGUoY2FwWzFdKTtcbiAgICAgIGhyZWYgPSB0ZXh0O1xuICAgICAgb3V0ICs9ICc8YSBocmVmPVwiJ1xuICAgICAgICArIGhyZWZcbiAgICAgICAgKyAnXCI+J1xuICAgICAgICArIHRleHRcbiAgICAgICAgKyAnPC9hPic7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyB0YWdcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy50YWcuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9IHRoaXMub3B0aW9ucy5zYW5pdGl6ZVxuICAgICAgICA/IGVzY2FwZShjYXBbMF0pXG4gICAgICAgIDogY2FwWzBdO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gbGlua1xuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmxpbmsuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9IHRoaXMub3V0cHV0TGluayhjYXAsIHtcbiAgICAgICAgaHJlZjogY2FwWzJdLFxuICAgICAgICB0aXRsZTogY2FwWzNdXG4gICAgICB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHJlZmxpbmssIG5vbGlua1xuICAgIGlmICgoY2FwID0gdGhpcy5ydWxlcy5yZWZsaW5rLmV4ZWMoc3JjKSlcbiAgICAgICAgfHwgKGNhcCA9IHRoaXMucnVsZXMubm9saW5rLmV4ZWMoc3JjKSkpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBsaW5rID0gKGNhcFsyXSB8fCBjYXBbMV0pLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbiAgICAgIGxpbmsgPSB0aGlzLmxpbmtzW2xpbmsudG9Mb3dlckNhc2UoKV07XG4gICAgICBpZiAoIWxpbmsgfHwgIWxpbmsuaHJlZikge1xuICAgICAgICBvdXQgKz0gY2FwWzBdWzBdO1xuICAgICAgICBzcmMgPSBjYXBbMF0uc3Vic3RyaW5nKDEpICsgc3JjO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG91dCArPSB0aGlzLm91dHB1dExpbmsoY2FwLCBsaW5rKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHN0cm9uZ1xuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLnN0cm9uZy5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBvdXQgKz0gJzxzdHJvbmc+J1xuICAgICAgICArIHRoaXMub3V0cHV0KGNhcFsyXSB8fCBjYXBbMV0pXG4gICAgICAgICsgJzwvc3Ryb25nPic7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBlbVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmVtLmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSAnPGVtPidcbiAgICAgICAgKyB0aGlzLm91dHB1dChjYXBbMl0gfHwgY2FwWzFdKVxuICAgICAgICArICc8L2VtPic7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBjb2RlXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuY29kZS5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBvdXQgKz0gJzxjb2RlPidcbiAgICAgICAgKyBlc2NhcGUoY2FwWzJdLCB0cnVlKVxuICAgICAgICArICc8L2NvZGU+JztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGJyXG4gICAgaWYgKGNhcCA9IHRoaXMucnVsZXMuYnIuZXhlYyhzcmMpKSB7XG4gICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKGNhcFswXS5sZW5ndGgpO1xuICAgICAgb3V0ICs9ICc8YnI+JztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGRlbCAoZ2ZtKVxuICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmRlbC5leGVjKHNyYykpIHtcbiAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcoY2FwWzBdLmxlbmd0aCk7XG4gICAgICBvdXQgKz0gJzxkZWw+J1xuICAgICAgICArIHRoaXMub3V0cHV0KGNhcFsxXSlcbiAgICAgICAgKyAnPC9kZWw+JztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHRleHRcbiAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy50ZXh0LmV4ZWMoc3JjKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhjYXBbMF0ubGVuZ3RoKTtcbiAgICAgIG91dCArPSBlc2NhcGUoY2FwWzBdKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChzcmMpIHtcbiAgICAgIHRocm93IG5ld1xuICAgICAgICBFcnJvcignSW5maW5pdGUgbG9vcCBvbiBieXRlOiAnICsgc3JjLmNoYXJDb2RlQXQoMCkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvbXBpbGUgTGlua1xuICovXG5cbklubGluZUxleGVyLnByb3RvdHlwZS5vdXRwdXRMaW5rID0gZnVuY3Rpb24oY2FwLCBsaW5rKSB7XG4gIGlmIChjYXBbMF1bMF0gIT09ICchJykge1xuICAgIHJldHVybiAnPGEgaHJlZj1cIidcbiAgICAgICsgZXNjYXBlKGxpbmsuaHJlZilcbiAgICAgICsgJ1wiJ1xuICAgICAgKyAobGluay50aXRsZVxuICAgICAgPyAnIHRpdGxlPVwiJ1xuICAgICAgKyBlc2NhcGUobGluay50aXRsZSlcbiAgICAgICsgJ1wiJ1xuICAgICAgOiAnJylcbiAgICAgICsgJz4nXG4gICAgICArIHRoaXMub3V0cHV0KGNhcFsxXSlcbiAgICAgICsgJzwvYT4nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnPGltZyBzcmM9XCInXG4gICAgICArIGVzY2FwZShsaW5rLmhyZWYpXG4gICAgICArICdcIiBhbHQ9XCInXG4gICAgICArIGVzY2FwZShjYXBbMV0pXG4gICAgICArICdcIidcbiAgICAgICsgKGxpbmsudGl0bGVcbiAgICAgID8gJyB0aXRsZT1cIidcbiAgICAgICsgZXNjYXBlKGxpbmsudGl0bGUpXG4gICAgICArICdcIidcbiAgICAgIDogJycpXG4gICAgICArICc+JztcbiAgfVxufTtcblxuLyoqXG4gKiBNYW5nbGUgTGlua3NcbiAqL1xuXG5JbmxpbmVMZXhlci5wcm90b3R5cGUubWFuZ2xlID0gZnVuY3Rpb24odGV4dCkge1xuICB2YXIgb3V0ID0gJydcbiAgICAsIGwgPSB0ZXh0Lmxlbmd0aFxuICAgICwgaSA9IDBcbiAgICAsIGNoO1xuXG4gIGZvciAoOyBpIDwgbDsgaSsrKSB7XG4gICAgY2ggPSB0ZXh0LmNoYXJDb2RlQXQoaSk7XG4gICAgaWYgKE1hdGgucmFuZG9tKCkgPiAwLjUpIHtcbiAgICAgIGNoID0gJ3gnICsgY2gudG9TdHJpbmcoMTYpO1xuICAgIH1cbiAgICBvdXQgKz0gJyYjJyArIGNoICsgJzsnO1xuICB9XG5cbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGFyc2luZyAmIENvbXBpbGluZ1xuICovXG5cbmZ1bmN0aW9uIFBhcnNlcihvcHRpb25zKSB7XG4gIHRoaXMudG9rZW5zID0gW107XG4gIHRoaXMudG9rZW4gPSBudWxsO1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IG1hcmtlZC5kZWZhdWx0cztcbn1cblxuLyoqXG4gKiBTdGF0aWMgUGFyc2UgTWV0aG9kXG4gKi9cblxuUGFyc2VyLnBhcnNlID0gZnVuY3Rpb24oc3JjLCBvcHRpb25zKSB7XG4gIHZhciBwYXJzZXIgPSBuZXcgUGFyc2VyKG9wdGlvbnMpO1xuICByZXR1cm4gcGFyc2VyLnBhcnNlKHNyYyk7XG59O1xuXG4vKipcbiAqIFBhcnNlIExvb3BcbiAqL1xuXG5QYXJzZXIucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24oc3JjKSB7XG4gIHRoaXMuaW5saW5lID0gbmV3IElubGluZUxleGVyKHNyYy5saW5rcywgdGhpcy5vcHRpb25zKTtcbiAgdGhpcy50b2tlbnMgPSBzcmMucmV2ZXJzZSgpO1xuXG4gIHZhciBvdXQgPSAnJztcbiAgd2hpbGUgKHRoaXMubmV4dCgpKSB7XG4gICAgb3V0ICs9IHRoaXMudG9rKCk7XG4gIH1cblxuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBOZXh0IFRva2VuXG4gKi9cblxuUGFyc2VyLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnRva2VuID0gdGhpcy50b2tlbnMucG9wKCk7XG59O1xuXG4vKipcbiAqIFByZXZpZXcgTmV4dCBUb2tlblxuICovXG5cblBhcnNlci5wcm90b3R5cGUucGVlayA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy50b2tlbnNbdGhpcy50b2tlbnMubGVuZ3RoLTFdIHx8IDA7XG59O1xuXG4vKipcbiAqIFBhcnNlIFRleHQgVG9rZW5zXG4gKi9cblxuUGFyc2VyLnByb3RvdHlwZS5wYXJzZVRleHQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJvZHkgPSB0aGlzLnRva2VuLnRleHQ7XG5cbiAgd2hpbGUgKHRoaXMucGVlaygpLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgIGJvZHkgKz0gJ1xcbicgKyB0aGlzLm5leHQoKS50ZXh0O1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuaW5saW5lLm91dHB1dChib2R5KTtcbn07XG5cbi8qKlxuICogUGFyc2UgQ3VycmVudCBUb2tlblxuICovXG5cblBhcnNlci5wcm90b3R5cGUudG9rID0gZnVuY3Rpb24oKSB7XG4gIHN3aXRjaCAodGhpcy50b2tlbi50eXBlKSB7XG4gICAgY2FzZSAnc3BhY2UnOiB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGNhc2UgJ2hyJzoge1xuICAgICAgcmV0dXJuICc8aHI+XFxuJztcbiAgICB9XG4gICAgY2FzZSAnaGVhZGluZyc6IHtcbiAgICAgIHJldHVybiAnPGgnXG4gICAgICAgICsgdGhpcy50b2tlbi5kZXB0aFxuICAgICAgICArICc+J1xuICAgICAgICArIHRoaXMuaW5saW5lLm91dHB1dCh0aGlzLnRva2VuLnRleHQpXG4gICAgICAgICsgJzwvaCdcbiAgICAgICAgKyB0aGlzLnRva2VuLmRlcHRoXG4gICAgICAgICsgJz5cXG4nO1xuICAgIH1cbiAgICBjYXNlICdjb2RlJzoge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5oaWdobGlnaHQpIHtcbiAgICAgICAgdmFyIGNvZGUgPSB0aGlzLm9wdGlvbnMuaGlnaGxpZ2h0KHRoaXMudG9rZW4udGV4dCwgdGhpcy50b2tlbi5sYW5nKTtcbiAgICAgICAgaWYgKGNvZGUgIT0gbnVsbCAmJiBjb2RlICE9PSB0aGlzLnRva2VuLnRleHQpIHtcbiAgICAgICAgICB0aGlzLnRva2VuLmVzY2FwZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMudG9rZW4udGV4dCA9IGNvZGU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLnRva2VuLmVzY2FwZWQpIHtcbiAgICAgICAgdGhpcy50b2tlbi50ZXh0ID0gZXNjYXBlKHRoaXMudG9rZW4udGV4dCwgdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAnPHByZT48Y29kZSdcbiAgICAgICAgKyAodGhpcy50b2tlbi5sYW5nXG4gICAgICAgID8gJyBjbGFzcz1cIidcbiAgICAgICAgKyB0aGlzLm9wdGlvbnMubGFuZ1ByZWZpeFxuICAgICAgICArIHRoaXMudG9rZW4ubGFuZ1xuICAgICAgICArICdcIidcbiAgICAgICAgOiAnJylcbiAgICAgICAgKyAnPidcbiAgICAgICAgKyB0aGlzLnRva2VuLnRleHRcbiAgICAgICAgKyAnPC9jb2RlPjwvcHJlPlxcbic7XG4gICAgfVxuICAgIGNhc2UgJ3RhYmxlJzoge1xuICAgICAgdmFyIGJvZHkgPSAnJ1xuICAgICAgICAsIGhlYWRpbmdcbiAgICAgICAgLCBpXG4gICAgICAgICwgcm93XG4gICAgICAgICwgY2VsbFxuICAgICAgICAsIGo7XG5cbiAgICAgIC8vIGhlYWRlclxuICAgICAgYm9keSArPSAnPHRoZWFkPlxcbjx0cj5cXG4nO1xuICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMudG9rZW4uaGVhZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGhlYWRpbmcgPSB0aGlzLmlubGluZS5vdXRwdXQodGhpcy50b2tlbi5oZWFkZXJbaV0pO1xuICAgICAgICBib2R5ICs9IHRoaXMudG9rZW4uYWxpZ25baV1cbiAgICAgICAgICA/ICc8dGggYWxpZ249XCInICsgdGhpcy50b2tlbi5hbGlnbltpXSArICdcIj4nICsgaGVhZGluZyArICc8L3RoPlxcbidcbiAgICAgICAgICA6ICc8dGg+JyArIGhlYWRpbmcgKyAnPC90aD5cXG4nO1xuICAgICAgfVxuICAgICAgYm9keSArPSAnPC90cj5cXG48L3RoZWFkPlxcbic7XG5cbiAgICAgIC8vIGJvZHlcbiAgICAgIGJvZHkgKz0gJzx0Ym9keT5cXG4nXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy50b2tlbi5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICByb3cgPSB0aGlzLnRva2VuLmNlbGxzW2ldO1xuICAgICAgICBib2R5ICs9ICc8dHI+XFxuJztcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHJvdy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNlbGwgPSB0aGlzLmlubGluZS5vdXRwdXQocm93W2pdKTtcbiAgICAgICAgICBib2R5ICs9IHRoaXMudG9rZW4uYWxpZ25bal1cbiAgICAgICAgICAgID8gJzx0ZCBhbGlnbj1cIicgKyB0aGlzLnRva2VuLmFsaWduW2pdICsgJ1wiPicgKyBjZWxsICsgJzwvdGQ+XFxuJ1xuICAgICAgICAgICAgOiAnPHRkPicgKyBjZWxsICsgJzwvdGQ+XFxuJztcbiAgICAgICAgfVxuICAgICAgICBib2R5ICs9ICc8L3RyPlxcbic7XG4gICAgICB9XG4gICAgICBib2R5ICs9ICc8L3Rib2R5Plxcbic7XG5cbiAgICAgIHJldHVybiAnPHRhYmxlPlxcbidcbiAgICAgICAgKyBib2R5XG4gICAgICAgICsgJzwvdGFibGU+XFxuJztcbiAgICB9XG4gICAgY2FzZSAnYmxvY2txdW90ZV9zdGFydCc6IHtcbiAgICAgIHZhciBib2R5ID0gJyc7XG5cbiAgICAgIHdoaWxlICh0aGlzLm5leHQoKS50eXBlICE9PSAnYmxvY2txdW90ZV9lbmQnKSB7XG4gICAgICAgIGJvZHkgKz0gdGhpcy50b2soKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICc8YmxvY2txdW90ZT5cXG4nXG4gICAgICAgICsgYm9keVxuICAgICAgICArICc8L2Jsb2NrcXVvdGU+XFxuJztcbiAgICB9XG4gICAgY2FzZSAnbGlzdF9zdGFydCc6IHtcbiAgICAgIHZhciB0eXBlID0gdGhpcy50b2tlbi5vcmRlcmVkID8gJ29sJyA6ICd1bCdcbiAgICAgICAgLCBib2R5ID0gJyc7XG5cbiAgICAgIHdoaWxlICh0aGlzLm5leHQoKS50eXBlICE9PSAnbGlzdF9lbmQnKSB7XG4gICAgICAgIGJvZHkgKz0gdGhpcy50b2soKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICc8J1xuICAgICAgICArIHR5cGVcbiAgICAgICAgKyAnPlxcbidcbiAgICAgICAgKyBib2R5XG4gICAgICAgICsgJzwvJ1xuICAgICAgICArIHR5cGVcbiAgICAgICAgKyAnPlxcbic7XG4gICAgfVxuICAgIGNhc2UgJ2xpc3RfaXRlbV9zdGFydCc6IHtcbiAgICAgIHZhciBib2R5ID0gJyc7XG5cbiAgICAgIHdoaWxlICh0aGlzLm5leHQoKS50eXBlICE9PSAnbGlzdF9pdGVtX2VuZCcpIHtcbiAgICAgICAgYm9keSArPSB0aGlzLnRva2VuLnR5cGUgPT09ICd0ZXh0J1xuICAgICAgICAgID8gdGhpcy5wYXJzZVRleHQoKVxuICAgICAgICAgIDogdGhpcy50b2soKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICc8bGk+J1xuICAgICAgICArIGJvZHlcbiAgICAgICAgKyAnPC9saT5cXG4nO1xuICAgIH1cbiAgICBjYXNlICdsb29zZV9pdGVtX3N0YXJ0Jzoge1xuICAgICAgdmFyIGJvZHkgPSAnJztcblxuICAgICAgd2hpbGUgKHRoaXMubmV4dCgpLnR5cGUgIT09ICdsaXN0X2l0ZW1fZW5kJykge1xuICAgICAgICBib2R5ICs9IHRoaXMudG9rKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAnPGxpPidcbiAgICAgICAgKyBib2R5XG4gICAgICAgICsgJzwvbGk+XFxuJztcbiAgICB9XG4gICAgY2FzZSAnaHRtbCc6IHtcbiAgICAgIHJldHVybiAhdGhpcy50b2tlbi5wcmUgJiYgIXRoaXMub3B0aW9ucy5wZWRhbnRpY1xuICAgICAgICA/IHRoaXMuaW5saW5lLm91dHB1dCh0aGlzLnRva2VuLnRleHQpXG4gICAgICAgIDogdGhpcy50b2tlbi50ZXh0O1xuICAgIH1cbiAgICBjYXNlICdwYXJhZ3JhcGgnOiB7XG4gICAgICByZXR1cm4gJzxwPidcbiAgICAgICAgKyB0aGlzLmlubGluZS5vdXRwdXQodGhpcy50b2tlbi50ZXh0KVxuICAgICAgICArICc8L3A+XFxuJztcbiAgICB9XG4gICAgY2FzZSAndGV4dCc6IHtcbiAgICAgIHJldHVybiAnPHA+J1xuICAgICAgICArIHRoaXMucGFyc2VUZXh0KClcbiAgICAgICAgKyAnPC9wPlxcbic7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEhlbHBlcnNcbiAqL1xuXG5mdW5jdGlvbiBlc2NhcGUoaHRtbCwgZW5jb2RlKSB7XG4gIHJldHVybiBodG1sXG4gICAgLnJlcGxhY2UoIWVuY29kZSA/IC8mKD8hIz9cXHcrOykvZyA6IC8mL2csICcmYW1wOycpXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7JylcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgLnJlcGxhY2UoLycvZywgJyYjMzk7Jyk7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2UocmVnZXgsIG9wdCkge1xuICByZWdleCA9IHJlZ2V4LnNvdXJjZTtcbiAgb3B0ID0gb3B0IHx8ICcnO1xuICByZXR1cm4gZnVuY3Rpb24gc2VsZihuYW1lLCB2YWwpIHtcbiAgICBpZiAoIW5hbWUpIHJldHVybiBuZXcgUmVnRXhwKHJlZ2V4LCBvcHQpO1xuICAgIHZhbCA9IHZhbC5zb3VyY2UgfHwgdmFsO1xuICAgIHZhbCA9IHZhbC5yZXBsYWNlKC8oXnxbXlxcW10pXFxeL2csICckMScpO1xuICAgIHJlZ2V4ID0gcmVnZXgucmVwbGFjZShuYW1lLCB2YWwpO1xuICAgIHJldHVybiBzZWxmO1xuICB9O1xufVxuXG5mdW5jdGlvbiBub29wKCkge31cbm5vb3AuZXhlYyA9IG5vb3A7XG5cbmZ1bmN0aW9uIG1lcmdlKG9iaikge1xuICB2YXIgaSA9IDFcbiAgICAsIHRhcmdldFxuICAgICwga2V5O1xuXG4gIGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdGFyZ2V0ID0gYXJndW1lbnRzW2ldO1xuICAgIGZvciAoa2V5IGluIHRhcmdldCkge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXQsIGtleSkpIHtcbiAgICAgICAgb2JqW2tleV0gPSB0YXJnZXRba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIE1hcmtlZFxuICovXG5cbmZ1bmN0aW9uIG1hcmtlZChzcmMsIG9wdCkge1xuICB0cnkge1xuICAgIGlmIChvcHQpIG9wdCA9IG1lcmdlKHt9LCBtYXJrZWQuZGVmYXVsdHMsIG9wdCk7XG4gICAgcmV0dXJuIFBhcnNlci5wYXJzZShMZXhlci5sZXgoc3JjLCBvcHQpLCBvcHQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZS5tZXNzYWdlICs9ICdcXG5QbGVhc2UgcmVwb3J0IHRoaXMgdG8gaHR0cHM6Ly9naXRodWIuY29tL2NoamovbWFya2VkLic7XG4gICAgaWYgKChvcHQgfHwgbWFya2VkLmRlZmF1bHRzKS5zaWxlbnQpIHtcbiAgICAgIHJldHVybiAnPHA+QW4gZXJyb3Igb2NjdXJlZDo8L3A+PHByZT4nXG4gICAgICAgICsgZXNjYXBlKGUubWVzc2FnZSArICcnLCB0cnVlKVxuICAgICAgICArICc8L3ByZT4nO1xuICAgIH1cbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbi8qKlxuICogT3B0aW9uc1xuICovXG5cbm1hcmtlZC5vcHRpb25zID1cbm1hcmtlZC5zZXRPcHRpb25zID0gZnVuY3Rpb24ob3B0KSB7XG4gIG1lcmdlKG1hcmtlZC5kZWZhdWx0cywgb3B0KTtcbiAgcmV0dXJuIG1hcmtlZDtcbn07XG5cbm1hcmtlZC5kZWZhdWx0cyA9IHtcbiAgZ2ZtOiB0cnVlLFxuICB0YWJsZXM6IHRydWUsXG4gIGJyZWFrczogZmFsc2UsXG4gIHBlZGFudGljOiBmYWxzZSxcbiAgc2FuaXRpemU6IGZhbHNlLFxuICBzbWFydExpc3RzOiBmYWxzZSxcbiAgc2lsZW50OiBmYWxzZSxcbiAgaGlnaGxpZ2h0OiBudWxsLFxuICBsYW5nUHJlZml4OiAnbGFuZy0nXG59O1xuXG4vKipcbiAqIEV4cG9zZVxuICovXG5cbm1hcmtlZC5QYXJzZXIgPSBQYXJzZXI7XG5tYXJrZWQucGFyc2VyID0gUGFyc2VyLnBhcnNlO1xuXG5tYXJrZWQuTGV4ZXIgPSBMZXhlcjtcbm1hcmtlZC5sZXhlciA9IExleGVyLmxleDtcblxubWFya2VkLklubGluZUxleGVyID0gSW5saW5lTGV4ZXI7XG5tYXJrZWQuaW5saW5lTGV4ZXIgPSBJbmxpbmVMZXhlci5vdXRwdXQ7XG5cbm1hcmtlZC5wYXJzZSA9IG1hcmtlZDtcblxuaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICBtb2R1bGUuZXhwb3J0cyA9IG1hcmtlZDtcbn0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gIGRlZmluZShmdW5jdGlvbigpIHsgcmV0dXJuIG1hcmtlZDsgfSk7XG59IGVsc2Uge1xuICB0aGlzLm1hcmtlZCA9IG1hcmtlZDtcbn1cblxufSkuY2FsbChmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMgfHwgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogZ2xvYmFsKTtcbn0oKSk7XG5cbn0pKHdpbmRvdykiLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHJhcnJ5LCB0ZW1wbGF0ZSkge1xuXG4gIHZhciByb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgdGVtcGxhdGUgPSB0ZW1wbGF0ZSB8fCBmdW5jdGlvbiAodmFsLCBrZXksIGVsKSB7XG4gICAgZnVuY3Rpb24gcHJlICh2YWwpIHsgcmV0dXJuICc8cHJlPicrSlNPTi5zdHJpbmdpZnkodmFsKSsnPC9wcmU+JyB9XG4gICAgaWYoZWwpXG4gICAgICByZXR1cm4gZWwuaW5uZXJIVE1MID0gcHJlKHZhbCksIGVsXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpXG4gICAgZWwuaW5uZXJIVE1MID0gcHJlKHZhbClcbiAgICByZXR1cm4gZWxcbiAgfVxuXG4gIGNvbnNvbGUubG9nKHRlbXBsYXRlKVxuXG4gIHZhciBlbGVtZW50cyA9IHt9XG5cbiAgcmFycnkub24oJ3VwZGF0ZScsIGZ1bmN0aW9uIChjaGFuZ2UpIHtcbiAgICBmb3IodmFyIGlkIGluIGNoYW5nZSlcbiAgICAgIHVwZGF0ZShpZCwgY2hhbmdlW2lkXSlcbiAgfSlcblxuICBmdW5jdGlvbiB1cGRhdGUgKGtleSwgY2hhbmdlKSB7XG4gICAgdmFyIGVsXG4gICAgaWYoZWwgPSBlbGVtZW50c1trZXldKSB7XG4gICAgICBpZihjaGFuZ2UgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gcm9vdC5yZW1vdmVDaGlsZChlbClcbiAgICAgIH1cblxuICAgICAgdmFyIF9lbCA9IHRlbXBsYXRlLmNhbGwoZWwsIGNoYW5nZSwga2V5LCBlbClcbiAgICAgIGlmKF9lbCAhPSBlbCkge1xuICAgICAgICBlbGVtZW50c1trZXldID0gX2VsXG4gICAgICAgIGRpdi5yZXBsYWNlQ2hpbGQoX2VsLCBlbClcbiAgICAgIH1cbiAgICAgIC8vZWxzZSwgdGVtcGxhdGUgdXBkYXRlZCBlbC5cbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBlbCA9IHRlbXBsYXRlLmNhbGwobnVsbCwgY2hhbmdlLCBrZXkpXG4gICAgICBjb25zb2xlLmxvZyhlbClcbiAgICAvL3ZhciByYXJyeS5pbmRleE9mKGlkKVxuICAgIC8vaW5zZXJ0IGJlZm9yZSB0aGUgZWxlbWVudCB0aGF0IGlzIGFscmVhZHkgdGhlcmUuLi5cbiAgICB2YXIgYmVmb3JlID0gZWxlbWVudHNbcmFycnkua2V5c1tyYXJyeS5pbmRleE9mS2V5KGtleSkgKyAxXV1cbiAgICBlbGVtZW50c1trZXldID0gZWxcbiAgICBpZihiZWZvcmUpIHtcbiAgICAgIHJvb3QuaW5zZXJ0QmVmb3JlKGVsLCBiZWZvcmUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoZWwpXG4gICAgfVxuICB9XG5cbiAgLy9yZW5kZXIgdGhlIGN1cnJlbnQgY29udGVudHMuLi5cbiAgcmFycnkua2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICB1cGRhdGUoa2V5LCByYXJyeS5nZXQoa2V5KSlcbiAgfSlcblxuICByZXR1cm4gcm9vdFxufVxuXG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5leHBvcnRzLmlzRGF0ZSA9IGZ1bmN0aW9uKG9iail7cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBEYXRlXSd9O1xuZXhwb3J0cy5pc1JlZ0V4cCA9IGZ1bmN0aW9uKG9iail7cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBSZWdFeHBdJ307XG5cblxuZXhwb3J0cy5wcmludCA9IGZ1bmN0aW9uICgpIHt9O1xuZXhwb3J0cy5wdXRzID0gZnVuY3Rpb24gKCkge307XG5leHBvcnRzLmRlYnVnID0gZnVuY3Rpb24oKSB7fTtcblxuZXhwb3J0cy5pbnNwZWN0ID0gZnVuY3Rpb24ob2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKSB7XG4gIHZhciBzZWVuID0gW107XG5cbiAgdmFyIHN0eWxpemUgPSBmdW5jdGlvbihzdHIsIHN0eWxlVHlwZSkge1xuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuICAgIHZhciBzdHlsZXMgPVxuICAgICAgICB7ICdib2xkJyA6IFsxLCAyMl0sXG4gICAgICAgICAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAgICAgICAgICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgICAgICAgICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAgICAgICAgICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgICAgICAgICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgICAgICAgICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICAgICAgICAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICAgICAgICAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICAgICAgICAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAgICAgICAgICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAgICAgICAgICdyZWQnIDogWzMxLCAzOV0sXG4gICAgICAgICAgJ3llbGxvdycgOiBbMzMsIDM5XSB9O1xuXG4gICAgdmFyIHN0eWxlID1cbiAgICAgICAgeyAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgICAgICAgICAnbnVtYmVyJzogJ2JsdWUnLFxuICAgICAgICAgICdib29sZWFuJzogJ3llbGxvdycsXG4gICAgICAgICAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgICAgICAgICAnbnVsbCc6ICdib2xkJyxcbiAgICAgICAgICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgICAgICAgICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgICAgICAgICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAgICAgICAgICdyZWdleHAnOiAncmVkJyB9W3N0eWxlVHlwZV07XG5cbiAgICBpZiAoc3R5bGUpIHtcbiAgICAgIHJldHVybiAnXFwwMzNbJyArIHN0eWxlc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAgICdcXDAzM1snICsgc3R5bGVzW3N0eWxlXVsxXSArICdtJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gIH07XG4gIGlmICghIGNvbG9ycykge1xuICAgIHN0eWxpemUgPSBmdW5jdGlvbihzdHIsIHN0eWxlVHlwZSkgeyByZXR1cm4gc3RyOyB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0KHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gICAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZS5pbnNwZWN0ID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgICB2YWx1ZSAhPT0gZXhwb3J0cyAmJlxuICAgICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzKTtcbiAgICB9XG5cbiAgICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgICByZXR1cm4gc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuXG4gICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgICAgICByZXR1cm4gc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcblxuICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuXG4gICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgICB9XG4gICAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xuICAgIH1cblxuICAgIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgICB2YXIgdmlzaWJsZV9rZXlzID0gT2JqZWN0X2tleXModmFsdWUpO1xuICAgIHZhciBrZXlzID0gc2hvd0hpZGRlbiA/IE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKSA6IHZpc2libGVfa2V5cztcblxuICAgIC8vIEZ1bmN0aW9ucyB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ3JlZ2V4cCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERhdGVzIHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWRcbiAgICBpZiAoaXNEYXRlKHZhbHVlKSAmJiBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHN0eWxpemUodmFsdWUudG9VVENTdHJpbmcoKSwgJ2RhdGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYmFzZSwgdHlwZSwgYnJhY2VzO1xuICAgIC8vIERldGVybWluZSB0aGUgb2JqZWN0IHR5cGVcbiAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHR5cGUgPSAnQXJyYXknO1xuICAgICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHlwZSA9ICdPYmplY3QnO1xuICAgICAgYnJhY2VzID0gWyd7JywgJ30nXTtcbiAgICB9XG5cbiAgICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgYmFzZSA9IChpc1JlZ0V4cCh2YWx1ZSkpID8gJyAnICsgdmFsdWUgOiAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYXNlID0gJyc7XG4gICAgfVxuXG4gICAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIGJhc2UgPSAnICcgKyB2YWx1ZS50b1VUQ1N0cmluZygpO1xuICAgIH1cblxuICAgIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gICAgfVxuXG4gICAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ3JlZ2V4cCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZWVuLnB1c2godmFsdWUpO1xuXG4gICAgdmFyIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIG5hbWUsIHN0cjtcbiAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cEdldHRlcl9fKSB7XG4gICAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cEdldHRlcl9fKGtleSkpIHtcbiAgICAgICAgICBpZiAodmFsdWUuX19sb29rdXBTZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cFNldHRlcl9fKGtleSkpIHtcbiAgICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh2aXNpYmxlX2tleXMuaW5kZXhPZihrZXkpIDwgMCkge1xuICAgICAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICAgICAgfVxuICAgICAgaWYgKCFzdHIpIHtcbiAgICAgICAgaWYgKHNlZW4uaW5kZXhPZih2YWx1ZVtrZXldKSA8IDApIHtcbiAgICAgICAgICBpZiAocmVjdXJzZVRpbWVzID09PSBudWxsKSB7XG4gICAgICAgICAgICBzdHIgPSBmb3JtYXQodmFsdWVba2V5XSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0ciA9IGZvcm1hdCh2YWx1ZVtrZXldLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0eXBlID09PSAnQXJyYXknICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgICAgIG5hbWUgPSBzdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgICAgICBuYW1lID0gc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xuICAgIH0pO1xuXG4gICAgc2Vlbi5wb3AoKTtcblxuICAgIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gICAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgICBudW1MaW5lc0VzdCsrO1xuICAgICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgICAgcmV0dXJuIHByZXYgKyBjdXIubGVuZ3RoICsgMTtcbiAgICB9LCAwKTtcblxuICAgIGlmIChsZW5ndGggPiA1MCkge1xuICAgICAgb3V0cHV0ID0gYnJhY2VzWzBdICtcbiAgICAgICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICAgICAnICcgK1xuICAgICAgICAgICAgICAgYnJhY2VzWzFdO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dCA9IGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG4gIHJldHVybiBmb3JtYXQob2JqLCAodHlwZW9mIGRlcHRoID09PSAndW5kZWZpbmVkJyA/IDIgOiBkZXB0aCkpO1xufTtcblxuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBhciBpbnN0YW5jZW9mIEFycmF5IHx8XG4gICAgICAgICBBcnJheS5pc0FycmF5KGFyKSB8fFxuICAgICAgICAgKGFyICYmIGFyICE9PSBPYmplY3QucHJvdG90eXBlICYmIGlzQXJyYXkoYXIuX19wcm90b19fKSk7XG59XG5cblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIHJlIGluc3RhbmNlb2YgUmVnRXhwIHx8XG4gICAgKHR5cGVvZiByZSA9PT0gJ29iamVjdCcgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXScpO1xufVxuXG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIGlmIChkIGluc3RhbmNlb2YgRGF0ZSkgcmV0dXJuIHRydWU7XG4gIGlmICh0eXBlb2YgZCAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgdmFyIHByb3BlcnRpZXMgPSBEYXRlLnByb3RvdHlwZSAmJiBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyhEYXRlLnByb3RvdHlwZSk7XG4gIHZhciBwcm90byA9IGQuX19wcm90b19fICYmIE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzKGQuX19wcm90b19fKTtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHByb3RvKSA9PT0gSlNPTi5zdHJpbmdpZnkocHJvcGVydGllcyk7XG59XG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uIChtc2cpIHt9O1xuXG5leHBvcnRzLnB1bXAgPSBudWxsO1xuXG52YXIgT2JqZWN0X2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHJlcy5wdXNoKGtleSk7XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSByZXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufTtcblxudmFyIE9iamVjdF9jcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIChwcm90b3R5cGUsIHByb3BlcnRpZXMpIHtcbiAgICAvLyBmcm9tIGVzNS1zaGltXG4gICAgdmFyIG9iamVjdDtcbiAgICBpZiAocHJvdG90eXBlID09PSBudWxsKSB7XG4gICAgICAgIG9iamVjdCA9IHsgJ19fcHJvdG9fXycgOiBudWxsIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAodHlwZW9mIHByb3RvdHlwZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgJ3R5cGVvZiBwcm90b3R5cGVbJyArICh0eXBlb2YgcHJvdG90eXBlKSArICddICE9IFxcJ29iamVjdFxcJydcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIFR5cGUgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgVHlwZS5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgICAgIG9iamVjdCA9IG5ldyBUeXBlKCk7XG4gICAgICAgIG9iamVjdC5fX3Byb3RvX18gPSBwcm90b3R5cGU7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJvcGVydGllcyAhPT0gJ3VuZGVmaW5lZCcgJiYgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMob2JqZWN0LCBwcm9wZXJ0aWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbn07XG5cbmV4cG9ydHMuaW5oZXJpdHMgPSBmdW5jdGlvbihjdG9yLCBzdXBlckN0b3IpIHtcbiAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3I7XG4gIGN0b3IucHJvdG90eXBlID0gT2JqZWN0X2NyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH1cbiAgfSk7XG59O1xuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAodHlwZW9mIGYgIT09ICdzdHJpbmcnKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGV4cG9ydHMuaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6IHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSl7XG4gICAgaWYgKHggPT09IG51bGwgfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGV4cG9ydHMuaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgaWYgKGV2LnNvdXJjZSA9PT0gd2luZG93ICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIihmdW5jdGlvbihwcm9jZXNzKXtpZiAoIXByb2Nlc3MuRXZlbnRFbWl0dGVyKSBwcm9jZXNzLkV2ZW50RW1pdHRlciA9IGZ1bmN0aW9uICgpIHt9O1xuXG52YXIgRXZlbnRFbWl0dGVyID0gZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBwcm9jZXNzLkV2ZW50RW1pdHRlcjtcbnZhciBpc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbidcbiAgICA/IEFycmF5LmlzQXJyYXlcbiAgICA6IGZ1bmN0aW9uICh4cykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICAgIH1cbjtcbmZ1bmN0aW9uIGluZGV4T2YgKHhzLCB4KSB7XG4gICAgaWYgKHhzLmluZGV4T2YpIHJldHVybiB4cy5pbmRleE9mKHgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHggPT09IHhzW2ldKSByZXR1cm4gaTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXG4vLyAxMCBsaXN0ZW5lcnMgYXJlIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2hcbi8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuLy9cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IG47XG59O1xuXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzQXJyYXkodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpXG4gICAge1xuICAgICAgaWYgKGFyZ3VtZW50c1sxXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGFyZ3VtZW50c1sxXTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuY2F1Z2h0LCB1bnNwZWNpZmllZCAnZXJyb3InIGV2ZW50LlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIGZhbHNlO1xuICB2YXIgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgaWYgKCFoYW5kbGVyKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09ICdmdW5jdGlvbicpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGlzQXJyYXkoaGFuZGxlcikpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICB2YXIgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuLy8gRXZlbnRFbWl0dGVyIGlzIGRlZmluZWQgaW4gc3JjL25vZGVfZXZlbnRzLmNjXG4vLyBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQoKSBpcyBhbHNvIGRlZmluZWQgdGhlcmUuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcignYWRkTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyc1wiLlxuICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG5cbiAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgICAgdmFyIG07XG4gICAgICBpZiAodGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbSA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgICB9XG5cbiAgICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIH0gZWxzZSB7XG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLm9uKHR5cGUsIGZ1bmN0aW9uIGcoKSB7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcbiAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGxpc3RlbmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0FycmF5KGxpc3QpKSB7XG4gICAgdmFyIGkgPSBpbmRleE9mKGxpc3QsIGxpc3RlbmVyKTtcbiAgICBpZiAoaSA8IDApIHJldHVybiB0aGlzO1xuICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgIGlmIChsaXN0Lmxlbmd0aCA9PSAwKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfSBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0gPT09IGxpc3RlbmVyKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgaWYgKHR5cGUgJiYgdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gW107XG4gIGlmICghaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2V2ZW50c1t0eXBlXTtcbn07XG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCJcbnZhciBoZWFkZXIgPSByZXF1aXJlKCdoZWFkZXItc3RyZWFtJylcblxudmFyIHZlcnNpb25cbi8qKlxuVE9ET1xubW9yZSBzb3BoaXN0aWNhdGVkIHJlbG9hZGluZywgXG5wYXNzIGluIGEgcGFja2FnZSBhbmQgYSBzZW12ZXIgcmFuZ2UuLi5cbioqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaGFuZGxlcikge1xuICByZXR1cm4gZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgaGVhZGVyKHN0cmVhbSkud3JpdGVIZWFkKClcbiAgICBzdHJlYW0ub24oJ2hlYWRlcicsIGZ1bmN0aW9uIChtZXRhKSB7XG5cbiAgICAgIGlmKCF2ZXJzaW9uKVxuICAgICAgICB2ZXJzaW9uID0gbWV0YS52ZXJzaW9uXG4gICAgICBpZihtZXRhLnZlcnNpb24gIT09IHZlcnNpb24pIHtcbiAgICAgICAgc3RyZWFtLmVtaXQoJ3JlbG9hZCcsIG1ldGEudmVyc2lvbiwgdmVyc2lvbilcbiAgICAgICAgc3RyZWFtLmVuZCgpXG5cbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQodHJ1ZSlcbiAgICAgIH1cblxuICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKVxuICAgIH0pXG4gIH1cblxufVxuXG52YXIgd3JhcCA9IGZ1bmN0aW9uIChzdHJlYW0sIF92ZXJzaW9uKSB7XG4gIHZlcnNpb24gPSBfdmVyc2lvbiB8fCB2ZXJzaW9uXG4gIHN0cmVhbSA9IGhlYWRlcihzdHJlYW0pXG4gIHN0cmVhbS5vbignaGVhZGVyJywgZnVuY3Rpb24gKG1ldGEpIHtcbiAgICAvL2lzIGl0IHNhbWUgdmVyc2lvbiBhcyBsYXN0IHRpbWU/XG4gICAgaWYoIXZlcnNpb24pXG4gICAgICB2ZXJzaW9uID0gbWV0YS52ZXJzaW9uXG4gICAgaWYobWV0YS52ZXJzaW9uICE9PSB2ZXJzaW9uKSB7XG4gICAgICBzdHJlYW0uZW1pdCgncmVsb2FkJywgbWV0YS52ZXJzaW9uLCB2ZXJzaW9uKVxuICAgICAgc3RyZWFtLmVuZCgpXG5cbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQodHJ1ZSlcbiAgICB9XG4gIH0pXG4gIHJldHVybiBzdHJlYW1cbn1cbiIsInZhciBkaWZmICAgICA9IHJlcXVpcmUoJ2FkaWZmJykuZGlmZlxudmFyIFJBcnJheSAgID0gcmVxdWlyZSgnci1hcnJheScpXG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCd1dGlsJykuaW5oZXJpdHNcblxuZnVuY3Rpb24gcGF0Y2ggKGEsIGNoYW5nZXMpIHtcbiAgY2hhbmdlcy5mb3JFYWNoKGZ1bmN0aW9uIChwYXRjaCkge1xuICAgIGEuc3BsaWNlLmFwcGx5KGEsIHBhdGNoKVxuICB9KVxuICByZXR1cm4gYVxufVxuXG5mdW5jdGlvbiBzcGxpdChzdHIpIHtcbiAgcmV0dXJuIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uIChsLCBpLCBhKSB7XG4gICAgaWYoaSAhPSBhLmxlbmd0aCAtIDEpXG4gICAgICByZXR1cm4gbCArICdcXG4nXG4gICAgcmV0dXJuIGxcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSRWRpdFxuXG5pbmhlcml0cyhSRWRpdCwgUkFycmF5KVxuXG5mdW5jdGlvbiBSRWRpdCgpIHtcbiAgaWYoISh0aGlzIGluc3RhbmNlb2YgUkVkaXQpKSByZXR1cm4gbmV3IFJFZGl0KClcbiAgUkFycmF5LmNhbGwodGhpcylcbn1cblxudmFyIFIgPSBSRWRpdC5wcm90b3R5cGVcblxuUi50ZXh0ICA9IGZ1bmN0aW9uIHRleHQgKHRleHQpIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgcmV0dXJuIHRoaXMudG9KU09OKCkuam9pbignJylcbiAgXG4gIHZhciBvbGQgPSB0aGlzLnRvSlNPTigpXG4gIHRleHQgPSBzcGxpdCh0ZXh0KVxuICAvL2dvdCB0byBhZGp1c3QgdGhlIHVzZXIncyBzZWxlY3Rpb24gb24gdGhlIHRleHQgYXJlYS4uLlxuICB2YXIgcCA9IGRpZmYob2xkLCB0ZXh0KVxuICBwYXRjaCh0aGlzLCBwKVxufVxuXG5SLnVud3JhcCA9IGZ1bmN0aW9uICgpIHtcblxufVxuXG5SLndpZGdldCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKVxuICB0YS5zZXRBdHRyaWJ1dGUoJ2NvbHMnLCA4MClcbiAgdGEuc2V0QXR0cmlidXRlKCdyb3dzJywgMjQpXG4gIHRoaXMud3JhcCh0YSlcbiAgcmV0dXJuIHRhXG59XG5cblIud3JhcCA9IGZ1bmN0aW9uICh0YSkge1xuICBpZighdGEpIHRocm93IG5ldyBFcnJvcignd3JhcCh0YSkgZXhwZWN0cyBUZXh0QXJlYSwgb3IgSW5wdXQnKVxuXG4gIHZhciBjdXJzb3IgPSAwLCBzdGFydFxuICB2YXIgc2VsZiA9IHRoaXNcblxuICBpZih0aGlzLndyYXBwZWQpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdyRWRpdCBpcyBhbHJlYWR5IHdyYXBwaW5nIGEgdGV4dGFyZWEuIHVud3JhcCBpdCBmaXJzdCEnKVxuXG4gIGlmKHRhLl9yRWRpdFdyYXBwZXIpXG4gICAgdGEuX3JFZGl0V3JhcHBlci51bndyYXAoKVxuXG4gIHRhLl9yRWRpdFdyYXBwZXIgPSB0aGlzXG4gIHRoaXMud3JhcHBlZCA9IHRhXG5cbiAgdGEudmFsdWUgPSB0aGlzLnRleHQoKVxuXG4gIGZ1bmN0aW9uIG9uUHJldXBkYXRlIChjaCkge1xuICAgIC8vZm9yY2UgdXBkYXRlIHdoZW4gcmVjaWV2ZSBtZXNzYWdlLlxuICAgIGN1cnNvciA9IDBcbiAgICBzdGFydCA9IHRhLnNlbGVjdGlvblN0YXJ0XG4gICAgZW5kICAgPSB0YS5zZWxlY3Rpb25FbmRcbiAgICAvL3doYXQgYXRvbSBjb250YWlucyB0aGUgY3Vyc29yP1xuICAgIHZhciBzdGFydEtleSwgc3VtID0gMFxuICAgIGZvciAodmFyIGkgaW4gc2VsZi5rZXlzKSB7XG4gICAgICB2YXIga2V5ID0gc2VsZi5rZXlzW2ldXG4gICAgICBpZigoc3VtID0gc2VsZi5zdG9yZVtrZXldLmxlbmd0aCArIHN1bSkgPj0gc3RhcnQpIHtcbiAgICAgICAgc3RhcnRLZXkgPSBrZXk7IGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIC8vaG93IG11Y2ggd2lsbCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBkb2N1bWVudD9cbiAgICBmb3IodmFyIGtleSBpbiBjaCkge1xuICAgICAgaWYoa2V5IDwgc3RhcnRLZXkpXG4gICAgICAgIGN1cnNvciArPSBcbiAgICAgICAgICAoY2hba2V5XSA/IGNoW2tleV0ubGVuZ3RoIDogMClcbiAgICAgICAgLSAoc2VsZi5zdG9yZVtrZXldID8gc2VsZi5zdG9yZVtrZXldLmxlbmd0aCA6IDApXG4gICAgfVxuICAgIC8vVEhJUyBJUyBBQ1RVQUxMWSBXUk9ORy4gQ0FOJ1QgaW5zZXJ0IGludG8gYSBzZWxlY3Rpb24hXG4gICAgc3RhcnQgPSBzdGFydCArIGN1cnNvclxuICAgIGVuZCAgID0gZW5kICAgKyBjdXJzb3JcbiAgfVxuICB0aGlzLm9uKCdwcmV1cGRhdGUnLCBvblByZXVwZGF0ZSlcbiAgZnVuY3Rpb24gb25fdXBkYXRlICh1cGRhdGUpIHtcbiAgICBpZih1cGRhdGVbMl0gIT09IHNlbGYuaWQpIHtcbiAgICAgIHRhLnZhbHVlID0gc2VsZi50b0pTT04oKS5qb2luKCcnKVxuICAgICAgdGEuc2VsZWN0aW9uU3RhcnQgPSB0YS5zZWxlY3Rpb25FbmQgPSBzdGFydFxuICAgIH1cbiAgfVxuICB0aGlzLm9uKCdfdXBkYXRlJyAgLCBvbl91cGRhdGUpXG4gIHZhciBwZW5kaW5nID0gZmFsc2VcbiAgZnVuY3Rpb24gb25JbnB1dCAoKSB7XG4gICAgLy9pZihwZW5kaW5nKSByZXR1cm5cbiAgICAvL3BlbmRpbmcgPSB0cnVlXG4gICAgLy9zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAvL3BlbmRpbmcgPSBmYWxzZVxuICAgIHNlbGYudGV4dCh0YS52YWx1ZSlcbiAgICAvL30sIDMwMClcbiAgfVxuICBmdW5jdGlvbiBvbktleWRvd24gKCkge1xuICAgIHN0YXJ0ID0gdGEuc2VsZWN0aW9uU3RhcnRcbiAgICBlbmQgICA9IHRhLnNlbGVjdGlvbkVuZFxuICB9XG4gIGZ1bmN0aW9uIG9uRm9jdXMgKCkge1xuICAgIHRhLnNlbGVjdGlvblN0YXJ0ID0gdGEuc2VsZWN0aW9uRW5kID0gc3RhcnRcbiAgfVxuICB0YS5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcgICwgb25JbnB1dClcbiAgdGEuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5ZG93bilcbiAgdGEuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnICAsIG9uRm9jdXMgKVxuXG4gIHRoaXMudW53cmFwID0gZnVuY3Rpb24gKCkge1xuICAgIHRhLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2lucHV0JyAgLCBvbklucHV0KVxuICAgIHRhLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleWRvd24pXG4gICAgdGEucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnICAsIG9uRm9jdXMpXG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcigncHJldXBkYXRlJyAsIG9uUHJldXBkYXRlKVxuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoJ191cGRhdGUnICAgLCBvbl91cGRhdGUpXG4gICAgdGhpcy51bndyYXAgPSBmdW5jdGlvbiAoKSB7fVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cbiIsImZ1bmN0aW9uIGhlYWQgKGEpIHtcbiAgcmV0dXJuIGFbMF1cbn1cblxuZnVuY3Rpb24gbGFzdCAoYSkge1xuICByZXR1cm4gYVthLmxlbmd0aCAtIDFdXG59XG5cbmZ1bmN0aW9uIHRhaWwoYSkge1xuICByZXR1cm4gYS5zbGljZSgxKVxufVxuXG5mdW5jdGlvbiByZXRyZWF0IChlKSB7XG4gIHJldHVybiBlLnBvcCgpXG59XG5cbmZ1bmN0aW9uIGhhc0xlbmd0aCAoZSkge1xuICByZXR1cm4gZS5sZW5ndGhcbn1cblxuZnVuY3Rpb24gYW55KGFyeSwgdGVzdCkge1xuICBmb3IodmFyIGkgaW4gYXJ5KVxuICAgIGlmKHRlc3QoYXJ5W2ldKSlcbiAgICAgIHJldHVybiB0cnVlXG4gIHJldHVybiBmYWxzZVxufVxuXG52YXIgX3J1bGVzIC8vIHNldCBhdCB0aGUgYm90dG9tICBcblxuLy8gbm90ZSwgbmFpdmUgaW1wbGVtZW50YXRpb24uIHdpbGwgYnJlYWsgb24gY2lyY3VsYXIgb2JqZWN0cy5cblxuZnVuY3Rpb24gX2VxdWFsKGEsIGIpIHtcbiAgaWYoYSAmJiAhYikgcmV0dXJuIGZhbHNlXG4gIGlmKEFycmF5LmlzQXJyYXkoYSkpXG4gICAgaWYoYS5sZW5ndGggIT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZVxuICBpZihhICYmICdvYmplY3QnID09IHR5cGVvZiBhKSB7XG4gICAgZm9yKHZhciBpIGluIGEpXG4gICAgICBpZighX2VxdWFsKGFbaV0sIGJbaV0pKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBhID09IGJcbn1cblxuZnVuY3Rpb24gZ2V0QXJncyhhcmdzKSB7XG4gIHJldHVybiBhcmdzLmxlbmd0aCA9PSAxID8gYXJnc1swXSA6IFtdLnNsaWNlLmNhbGwoYXJncylcbn1cblxuLy8gcmV0dXJuIHRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBub3QgbGlrZSB0aGUgb3RoZXJzLCBvciAtMVxuZnVuY3Rpb24gb2RkRWxlbWVudChhcnksIGNtcCkge1xuICB2YXIgY1xuICBmdW5jdGlvbiBndWVzcyhhKSB7XG4gICAgdmFyIG9kZCA9IC0xXG4gICAgYyA9IDBcbiAgICBmb3IgKHZhciBpID0gYTsgaSA8IGFyeS5sZW5ndGg7IGkgKyspIHtcbiAgICAgIGlmKCFjbXAoYXJ5W2FdLCBhcnlbaV0pKSB7XG4gICAgICAgIG9kZCA9IGksIGMrK1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYyA+IDEgPyAtMSA6IG9kZFxuICB9XG4gIC8vYXNzdW1lIHRoYXQgaXQgaXMgdGhlIGZpcnN0IGVsZW1lbnQuXG4gIHZhciBnID0gZ3Vlc3MoMClcbiAgaWYoLTEgIT0gZykgcmV0dXJuIGdcbiAgLy8wIHdhcyB0aGUgb2RkIG9uZSwgdGhlbiBhbGwgdGhlIG90aGVyIGVsZW1lbnRzIGFyZSBlcXVhbFxuICAvL2Vsc2UgdGhlcmUgbW9yZSB0aGFuIG9uZSBkaWZmZXJlbnQgZWxlbWVudFxuICBndWVzcygxKVxuICByZXR1cm4gYyA9PSAwID8gMCA6IC0xXG59XG52YXIgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGRlcHMsIGV4cG9ydHMpIHtcbiAgdmFyIGVxdWFsID0gKGRlcHMgJiYgZGVwcy5lcXVhbCkgfHwgX2VxdWFsXG4gIGV4cG9ydHMgPSBleHBvcnRzIHx8IHt9IFxuICBleHBvcnRzLmxjcyA9IFxuICBmdW5jdGlvbiBsY3MoKSB7XG4gICAgdmFyIGNhY2hlID0ge31cbiAgICB2YXIgYXJncyA9IGdldEFyZ3MoYXJndW1lbnRzKVxuICAgIHZhciBhID0gYXJnc1swXSwgYiA9IGFyZ3NbMV1cblxuICAgIGZ1bmN0aW9uIGtleSAoYSxiKXtcbiAgICAgIHJldHVybiBhLmxlbmd0aCArICc6JyArIGIubGVuZ3RoXG4gICAgfVxuXG4gICAgLy9maW5kIGxlbmd0aCB0aGF0IG1hdGNoZXMgYXQgdGhlIGhlYWRcblxuICAgIGlmKGFyZ3MubGVuZ3RoID4gMikge1xuICAgICAgLy9pZiBjYWxsZWQgd2l0aCBtdWx0aXBsZSBzZXF1ZW5jZXNcbiAgICAgIC8vcmVjdXJzZSwgc2luY2UgbGNzKGEsIGIsIGMsIGQpID09IGxjcyhsY3MoYSxiKSwgbGNzKGMsZCkpXG4gICAgICBhcmdzLnB1c2gobGNzKGFyZ3Muc2hpZnQoKSwgYXJncy5zaGlmdCgpKSlcbiAgICAgIHJldHVybiBsY3MoYXJncylcbiAgICB9XG4gICAgXG4gICAgLy90aGlzIHdvdWxkIGJlIGltcHJvdmVkIGJ5IHRydW5jYXRpbmcgaW5wdXQgZmlyc3RcbiAgICAvL2FuZCBub3QgcmV0dXJuaW5nIGFuIGxjcyBhcyBhbiBpbnRlcm1lZGlhdGUgc3RlcC5cbiAgICAvL3VudGlsbCB0aGF0IGlzIGEgcGVyZm9ybWFuY2UgcHJvYmxlbS5cblxuICAgIHZhciBzdGFydCA9IDAsIGVuZCA9IDBcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGggJiYgaSA8IGIubGVuZ3RoIFxuICAgICAgJiYgZXF1YWwoYVtpXSwgYltpXSlcbiAgICAgIDsgaSArK1xuICAgIClcbiAgICAgIHN0YXJ0ID0gaSArIDFcblxuICAgIGlmKGEubGVuZ3RoID09PSBzdGFydClcbiAgICAgIHJldHVybiBhLnNsaWNlKClcblxuICAgIGZvcih2YXIgaSA9IDA7ICBpIDwgYS5sZW5ndGggLSBzdGFydCAmJiBpIDwgYi5sZW5ndGggLSBzdGFydFxuICAgICAgJiYgZXF1YWwoYVthLmxlbmd0aCAtIDEgLSBpXSwgYltiLmxlbmd0aCAtIDEgLSBpXSlcbiAgICAgIDsgaSArK1xuICAgIClcbiAgICAgIGVuZCA9IGlcblxuICAgIGZ1bmN0aW9uIHJlY3Vyc2UgKGEsIGIpIHtcbiAgICAgIGlmKCFhLmxlbmd0aCB8fCAhYi5sZW5ndGgpIHJldHVybiBbXVxuICAgICAgLy9hdm9pZCBleHBvbmVudGlhbCB0aW1lIGJ5IGNhY2hpbmcgdGhlIHJlc3VsdHNcbiAgICAgIGlmKGNhY2hlW2tleShhLCBiKV0pIHJldHVybiBjYWNoZVtrZXkoYSwgYildXG5cbiAgICAgIGlmKGVxdWFsKGFbMF0sIGJbMF0pKVxuICAgICAgICByZXR1cm4gW2hlYWQoYSldLmNvbmNhdChyZWN1cnNlKHRhaWwoYSksIHRhaWwoYikpKVxuICAgICAgZWxzZSB7IFxuICAgICAgICB2YXIgX2EgPSByZWN1cnNlKHRhaWwoYSksIGIpXG4gICAgICAgIHZhciBfYiA9IHJlY3Vyc2UoYSwgdGFpbChiKSlcbiAgICAgICAgcmV0dXJuIGNhY2hlW2tleShhLGIpXSA9IF9hLmxlbmd0aCA+IF9iLmxlbmd0aCA/IF9hIDogX2IgIFxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICB2YXIgbWlkZGxlQSA9IGEuc2xpY2Uoc3RhcnQsIGEubGVuZ3RoIC0gZW5kKVxuICAgIHZhciBtaWRkbGVCID0gYi5zbGljZShzdGFydCwgYi5sZW5ndGggLSBlbmQpXG5cbiAgICByZXR1cm4gKFxuICAgICAgYS5zbGljZSgwLCBzdGFydCkuY29uY2F0KFxuICAgICAgICByZWN1cnNlKG1pZGRsZUEsIG1pZGRsZUIpXG4gICAgICApLmNvbmNhdChhLnNsaWNlKGEubGVuZ3RoIC0gZW5kKSlcbiAgICApXG4gIH1cblxuICAvLyBnaXZlbiBuIHNlcXVlbmNlcywgY2FsYyB0aGUgbGNzLCBhbmQgdGhlbiBjaHVuayBzdHJpbmdzIGludG8gc3RhYmxlIGFuZCB1bnN0YWJsZSBzZWN0aW9ucy5cbiAgLy8gdW5zdGFibGUgY2h1bmtzIGFyZSBwYXNzZWQgdG8gYnVpbGRcbiAgZXhwb3J0cy5jaHVuayA9XG4gIGZ1bmN0aW9uIChxLCBidWlsZCkge1xuICAgIHZhciBxID0gcS5tYXAoZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUuc2xpY2UoKSB9KVxuICAgIHZhciBsY3MgPSBleHBvcnRzLmxjcy5hcHBseShudWxsLCBxKVxuICAgIHZhciBhbGwgPSBbbGNzXS5jb25jYXQocSlcblxuICAgIGZ1bmN0aW9uIG1hdGNoTGNzIChlKSB7XG4gICAgICBpZihlLmxlbmd0aCAmJiAhbGNzLmxlbmd0aCB8fCAhZS5sZW5ndGggJiYgbGNzLmxlbmd0aClcbiAgICAgICAgcmV0dXJuIGZhbHNlIC8vaW5jYXNlIHRoZSBsYXN0IGl0ZW0gaXMgbnVsbCBcbiAgICAgIHJldHVybiBlcXVhbChsYXN0KGUpLCBsYXN0KGxjcykpIHx8ICgoZS5sZW5ndGggKyBsY3MubGVuZ3RoKSA9PT0gMClcbiAgICB9XG5cbiAgICB3aGlsZShhbnkocSwgaGFzTGVuZ3RoKSkge1xuICAgICAgLy9pZiBlYWNoIGVsZW1lbnQgaXMgYXQgdGhlIGxjcyB0aGVuIHRoaXMgY2h1bmsgaXMgc3RhYmxlLlxuICAgICAgd2hpbGUocS5ldmVyeShtYXRjaExjcykgJiYgcS5ldmVyeShoYXNMZW5ndGgpKSBcbiAgICAgICAgYWxsLmZvckVhY2gocmV0cmVhdCkgXG4gICAgICAvL2NvbGxlY3QgdGhlIGNoYW5nZXMgaW4gZWFjaCBhcnJheSB1cHRvIHRoZSBuZXh0IG1hdGNoIHdpdGggdGhlIGxjc1xuICAgICAgdmFyIGMgPSBmYWxzZVxuICAgICAgdmFyIHVuc3RhYmxlID0gcS5tYXAoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIGNoYW5nZSA9IFtdXG4gICAgICAgIHdoaWxlKCFtYXRjaExjcyhlKSkge1xuICAgICAgICAgIGNoYW5nZS51bnNoaWZ0KHJldHJlYXQoZSkpXG4gICAgICAgICAgYyA9IHRydWVcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hhbmdlXG4gICAgICB9KVxuICAgICAgaWYoYykgYnVpbGQocVswXS5sZW5ndGgsIHVuc3RhYmxlKSBcbiAgICB9XG4gIH1cblxuICBleHBvcnRzLmRpZmYgPVxuICBmdW5jdGlvbiAoYSwgYikge1xuICAgIHZhciBjaGFuZ2VzID0gW11cbiAgICBleHBvcnRzLmNodW5rKFthLCBiXSwgZnVuY3Rpb24gKGluZGV4LCB1bnN0YWJsZSkge1xuICAgICAgdmFyIGRlbCA9IHVuc3RhYmxlLnNoaWZ0KCkubGVuZ3RoXG4gICAgICB2YXIgaW5zZXJ0ID0gdW5zdGFibGUuc2hpZnQoKVxuICAgICAgY2hhbmdlcy5wdXNoKFtpbmRleCwgZGVsXS5jb25jYXQoaW5zZXJ0KSlcbiAgICB9KVxuICAgIHJldHVybiBjaGFuZ2VzXG4gIH1cblxuICBleHBvcnRzLnBhdGNoID0gZnVuY3Rpb24gKGEsIGNoYW5nZXMsIG11dGF0ZSkge1xuICAgIGlmKG11dGF0ZSAhPT0gdHJ1ZSkgYSA9IGEuc2xpY2UoYSkvL2NvcHkgYVxuICAgIGNoYW5nZXMuZm9yRWFjaChmdW5jdGlvbiAoY2hhbmdlKSB7XG4gICAgICBbXS5zcGxpY2UuYXBwbHkoYSwgY2hhbmdlKVxuICAgIH0pXG4gICAgcmV0dXJuIGFcbiAgfVxuXG4gIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ29uY2VzdG9yXG4gIC8vIG1lLCBjb25jZXN0b3IsIHlvdS4uLlxuICBleHBvcnRzLm1lcmdlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gZ2V0QXJncyhhcmd1bWVudHMpXG4gICAgdmFyIHBhdGNoID0gZXhwb3J0cy5kaWZmMyhhcmdzKVxuICAgIHJldHVybiBleHBvcnRzLnBhdGNoKGFyZ3NbMF0sIHBhdGNoKVxuICB9XG5cbiAgZXhwb3J0cy5kaWZmMyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IGdldEFyZ3MoYXJndW1lbnRzKVxuICAgIHZhciByID0gW11cbiAgICBleHBvcnRzLmNodW5rKGFyZ3MsIGZ1bmN0aW9uIChpbmRleCwgdW5zdGFibGUpIHtcbiAgICAgIHZhciBtaW5lID0gdW5zdGFibGVbMF1cbiAgICAgIHZhciBpbnNlcnQgPSByZXNvbHZlKHVuc3RhYmxlKVxuICAgICAgaWYoZXF1YWwobWluZSwgaW5zZXJ0KSkgcmV0dXJuIFxuICAgICAgci5wdXNoKFtpbmRleCwgbWluZS5sZW5ndGhdLmNvbmNhdChpbnNlcnQpKSBcbiAgICB9KVxuICAgIHJldHVybiByXG4gIH1cbiAgZXhwb3J0cy5vZGRPbmVPdXQgPVxuICAgIGZ1bmN0aW9uIG9kZE9uZU91dCAoY2hhbmdlcykge1xuICAgICAgY2hhbmdlcyA9IGNoYW5nZXMuc2xpY2UoKVxuICAgICAgLy9wdXQgdGhlIGNvbmNlc3RvciBmaXJzdFxuICAgICAgY2hhbmdlcy51bnNoaWZ0KGNoYW5nZXMuc3BsaWNlKDEsMSlbMF0pXG4gICAgICB2YXIgaSA9IG9kZEVsZW1lbnQoY2hhbmdlcywgZXF1YWwpXG4gICAgICBpZihpID09IDApIC8vIGNvbmNlc3RvciB3YXMgZGlmZmVyZW50LCAnZmFsc2UgY29uZmxpY3QnXG4gICAgICAgIHJldHVybiBjaGFuZ2VzWzFdXG4gICAgICBpZiAofmkpXG4gICAgICAgIHJldHVybiBjaGFuZ2VzW2ldIFxuICAgIH1cbiAgZXhwb3J0cy5pbnNlcnRNZXJnZU92ZXJEZWxldGUgPSBcbiAgICAvL2kndmUgaW1wbGVtZW50ZWQgdGhpcyBhcyBhIHNlcGVyYXRlIHJ1bGUsXG4gICAgLy9iZWNhdXNlIEkgaGFkIHNlY29uZCB0aG91Z2h0cyBhYm91dCB0aGlzLlxuICAgIGZ1bmN0aW9uIGluc2VydE1lcmdlT3ZlckRlbGV0ZSAoY2hhbmdlcykge1xuICAgICAgY2hhbmdlcyA9IGNoYW5nZXMuc2xpY2UoKVxuICAgICAgY2hhbmdlcy5zcGxpY2UoMSwxKS8vIHJlbW92ZSBjb25jZXN0b3JcbiAgICAgIFxuICAgICAgLy9pZiB0aGVyZSBpcyBvbmx5IG9uZSBub24gZW1wdHkgY2hhbmdlIHRoYXRzIG9rYXkuXG4gICAgICAvL2Vsc2UgZnVsbCBjb25maWxjdFxuICAgICAgZm9yICh2YXIgaSA9IDAsIG5vbmVtcHR5OyBpIDwgY2hhbmdlcy5sZW5ndGg7IGkrKylcbiAgICAgICAgaWYoY2hhbmdlc1tpXS5sZW5ndGgpIFxuICAgICAgICAgIGlmKCFub25lbXB0eSkgbm9uZW1wdHkgPSBjaGFuZ2VzW2ldXG4gICAgICAgICAgZWxzZSByZXR1cm4gLy8gZnVsbCBjb25mbGljdFxuICAgICAgcmV0dXJuIG5vbmVtcHR5XG4gICAgfVxuXG4gIHZhciBydWxlcyA9IChkZXBzICYmIGRlcHMucnVsZXMpIHx8IFtleHBvcnRzLm9kZE9uZU91dCwgZXhwb3J0cy5pbnNlcnRNZXJnZU92ZXJEZWxldGVdXG5cbiAgZnVuY3Rpb24gcmVzb2x2ZSAoY2hhbmdlcykge1xuICAgIHZhciBsID0gcnVsZXMubGVuZ3RoXG4gICAgZm9yICh2YXIgaSBpbiBydWxlcykgeyAvLyBmaXJzdFxuICAgICAgXG4gICAgICB2YXIgYyA9IHJ1bGVzW2ldICYmIHJ1bGVzW2ldKGNoYW5nZXMpXG4gICAgICBpZihjKSByZXR1cm4gY1xuICAgIH1cbiAgICBjaGFuZ2VzLnNwbGljZSgxLDEpIC8vIHJlbW92ZSBjb25jZXN0b3JcbiAgICAvL3JldHVybmluZyB0aGUgY29uZmxpY3RzIGFzIGFuIG9iamVjdCBpcyBhIHJlYWxseSBiYWQgaWRlYSxcbiAgICAvLyBiZWNhdXNlID09IHdpbGwgbm90IGRldGVjdCB0aGV5IGFyZSB0aGUgc2FtZS4gYW5kIGNvbmZsaWN0cyBidWlsZC5cbiAgICAvLyBiZXR0ZXIgdG8gdXNlXG4gICAgLy8gJzw8PDw8PDw8PDw8PDwnXG4gICAgLy8gb2YgY291cnNlLCBpIHdyb3RlIHRoaXMgYmVmb3JlIGkgc3RhcnRlZCBvbiBzbm9iLCBzbyBpIGRpZG4ndCBrbm93IHRoYXQgdGhlbi5cbiAgICAvKnZhciBjb25mbGljdCA9IFsnPj4+Pj4+Pj4+Pj4+Pj4+PiddXG4gICAgd2hpbGUoY2hhbmdlcy5sZW5ndGgpXG4gICAgICBjb25mbGljdCA9IGNvbmZsaWN0LmNvbmNhdChjaGFuZ2VzLnNoaWZ0KCkpLmNvbmNhdCgnPT09PT09PT09PT09JylcbiAgICBjb25mbGljdC5wb3AoKVxuICAgIGNvbmZsaWN0LnB1c2ggICAgICAgICAgKCc8PDw8PDw8PDw8PDw8PDwnKVxuICAgIGNoYW5nZXMudW5zaGlmdCAgICAgICAoJz4+Pj4+Pj4+Pj4+Pj4+PicpXG4gICAgcmV0dXJuIGNvbmZsaWN0Ki9cbiAgICAvL25haCwgYmV0dGVyIGlzIGp1c3QgdG8gdXNlIGFuIGVxdWFsIGNhbiBoYW5kbGUgb2JqZWN0c1xuICAgIHJldHVybiB7Jz8nOiBjaGFuZ2VzfVxuICB9XG4gIHJldHVybiBleHBvcnRzXG59XG5leHBvcnRzKG51bGwsIGV4cG9ydHMpXG4iLCJcbi8vdGhlIGZpcnN0IGxpbmUgaXMgaGVhZGVyLCBpbiBKU09OIGZvcm1hdCwgd2l0aCBubyB3aGl0ZXNwYWNlLlxuXG5mdW5jdGlvbiBtZXJnZSAoYSwgYikge1xuICBmb3IgKHZhciBrIGluIGIpXG4gICAgYVtrXSA9IGFba10gfHwgYltrXVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFxuZnVuY3Rpb24gaGVhZGVyIChzdHJlYW0pIHtcblxuICB2YXIgZW1pdCA9IHN0cmVhbS5lbWl0XG4gIHZhciB3cml0ZSA9IHN0cmVhbS53cml0ZVxuICB2YXIgc29GYXIgPSAnJ1xuXG4gIHN0cmVhbS5lbWl0ID0gZnVuY3Rpb24gKGV2ZW50LCBkYXRhKSB7XG4gICAgaWYoZXZlbnQgIT09ICdkYXRhJylcbiAgICAgIHJldHVybiBlbWl0LmFwcGx5KHN0cmVhbSwgYXJndW1lbnRzKVxuXG4gICAgc29GYXIgKz0gZGF0YVxuICAgIHZhciBtXG4gICAgaWYoIShtID0gL1xcbi8uZXhlYyhzb0ZhcikpKSByZXR1cm5cbiAgICB2YXIgbWV0YSA9IEpTT04ucGFyc2Uoc29GYXIuc3Vic3RyaW5nKDAsIG0uaW5kZXgpKVxuICAgIC8vKyAxIHRvIGdldCBwYXN0IHRoZSBuZXdsaW5lXG4gICAgc29GYXIgPSBzb0Zhci5zdWJzdHJpbmcobS5pbmRleCArIDEpXG4gICAgc3RyZWFtLmVtaXQgPSBlbWl0XG4gICAgc3RyZWFtLm1ldGEgPSBtZXRhXG4gICAgc3RyZWFtLmVtaXQoJ2hlYWRlcicsIG1ldGEpXG4gICAgLy9jaGVjayB0aGF0IHRoZSBzdHJlYW0gaXMgc3RpbGwgcmVhZGFibGUsXG4gICAgLy9pdCBtYXkgaGF2ZSBiZWVuIGVuZGVkIGR1cmluZyB0aGUgJ2hlYWRlcidcbiAgICAvL2V2ZW50LlxuICAgIGlmKCcnICE9PSBzb0ZhciAgJiYgc3RyZWFtLnJlYWRhYmxlKVxuICAgICAgc3RyZWFtLmVtaXQoJ2RhdGEnLCBzb0ZhcilcbiAgfVxuXG4gIHZhciBtZXRhID0ge31cblxuICBzdHJlYW0uc2V0SGVhZGVyID0gZnVuY3Rpb24gKGtleSwgdmFsKSB7XG4gICAgaWYoJ3N0cmluZycgPT09IHR5cGVvZiBrZXkpXG4gICAgICBtZXRhW2tleV0gPSB2YWxcbiAgICBlbHNlXG4gICAgICBtZXJnZShtZXRhLCBrZXkpXG4gICAgcmV0dXJuIHN0cmVhbVxuICB9XG5cbiAgc3RyZWFtLndyaXRlSGVhZCA9IGZ1bmN0aW9uIChfbWV0YSkge1xuICAgIGlmKF9tZXRhKSBtZXJnZShtZXRhLCBfbWV0YSlcbiAgICBzdHJlYW0ud3JpdGUgPSB3cml0ZVxuICAgIHN0cmVhbS53cml0ZShKU09OLnN0cmluZ2lmeShtZXRhKSsnXFxuJykgICAgXG4gIH1cblxuICBzdHJlYW0ud3JpdGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHN0cmVhbS53cml0ZUhlYWQoKVxuICAgIHJldHVybiBzdHJlYW0ud3JpdGUoZGF0YSlcbiAgfVxuXG4gIHJldHVybiBzdHJlYW1cbn1cbiIsIlxudmFyIHNob2UgPSByZXF1aXJlKCdzaG9lJylcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2luamVjdCcpKGZ1bmN0aW9uICgpeyBcbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgcmV0dXJuIHNob2UuYXBwbHkobnVsbCwgYXJncylcbn0pXG4iLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyXG52YXIgYmFja29mZiA9IHJlcXVpcmUoJ2JhY2tvZmYnKVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5mdW5jdGlvbiAoY3JlYXRlQ29ubmVjdGlvbikge1xuICByZXR1cm4gZnVuY3Rpb24gKG9wdHMsIG9uQ29ubmVjdCkge1xuICAgIG9uQ29ubmVjdCA9ICdmdW5jdGlvbicgPT0gdHlwZW9mIG9wdHMgPyBvcHRzIDogb25Db25uZWN0XG4gICAgb3B0cyA9IG9wdHMgfHwge2luaXRpYWxEZWxheTogMWUzLCBtYXhEZWxheTogMzBlM31cbiAgICBpZighb25Db25uZWN0KVxuICAgICAgb25Db25uZWN0ID0gb3B0cy5vbkNvbm5lY3RcblxuICAgIHZhciBlbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpXG4gICAgZW1pdHRlci5jb25uZWN0ZWQgPSBmYWxzZVxuICAgIGVtaXR0ZXIucmVjb25uZWN0ID0gdHJ1ZVxuXG4gICAgaWYob25Db25uZWN0KVxuICAgICAgZW1pdHRlci5vbignY29ubmVjdCcsIG9uQ29ubmVjdClcblxuICAgIHZhciBiYWNrb2ZmTWV0aG9kID0gKGJhY2tvZmZbb3B0cy50eXBlXSB8fCBiYWNrb2ZmLmZpYm9uYWNjaSkgKG9wdHMpXG5cbiAgICBiYWNrb2ZmTWV0aG9kLm9uKCdiYWNrb2ZmJywgZnVuY3Rpb24gKG4sIGQpIHtcbiAgICAgIGVtaXR0ZXIuZW1pdCgnYmFja29mZicsIG4sIGQpXG4gICAgfSlcblxuICAgIHZhciBhcmdzXG4gICAgZnVuY3Rpb24gYXR0ZW1wdCAobiwgZGVsYXkpIHtcbiAgICAgIGlmKCFlbWl0dGVyLnJlY29ubmVjdCkgcmV0dXJuXG5cbiAgICAgIGVtaXR0ZXIuZW1pdCgncmVjb25uZWN0JywgbiwgZGVsYXkpXG4gICAgICB2YXIgY29uID0gY3JlYXRlQ29ubmVjdGlvbi5hcHBseShudWxsLCBhcmdzKVxuICAgICAgZW1pdHRlci5fY29ubmVjdGlvbiA9IGNvblxuICAgICAgZnVuY3Rpb24gb25EaXNjb25uZWN0ICgpIHtcblxuICAgICAgICBlbWl0dGVyLmNvbm5lY3RlZCA9IGZhbHNlXG4gICAgICAgIGNvbi5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbkRpc2Nvbm5lY3QpXG4gICAgICAgIGNvbi5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBvbkRpc2Nvbm5lY3QpXG4gICAgICAgIGNvbi5yZW1vdmVMaXN0ZW5lcignZW5kJyAgLCBvbkRpc2Nvbm5lY3QpXG5cbiAgICAgICAgLy9lbWl0IGRpc2Nvbm5lY3QgYmVmb3JlIGNoZWNraW5nIHJlY29ubmVjdCwgc28gdXNlciBoYXMgYSBjaGFuY2UgdG8gZGVjaWRlIG5vdCB0by5cbiAgICAgICAgZW1pdHRlci5lbWl0KCdkaXNjb25uZWN0JywgY29uKVxuXG4gICAgICAgIGlmKCFlbWl0dGVyLnJlY29ubmVjdCkgcmV0dXJuXG4gICAgICAgIGJhY2tvZmZNZXRob2QuYmFja29mZigpXG4gICAgICB9XG5cbiAgICAgIGNvbi5vbignY29ubmVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYmFja29mZk1ldGhvZC5yZXNldCgpXG4gICAgICAgIGVtaXR0ZXIuY29ubmVjdGVkID0gdHJ1ZVxuICAgICAgICBlbWl0dGVyLmVtaXQoJ2Nvbm5lY3QnLCBjb24pXG4gICAgICB9KS5vbignZXJyb3InLCBvbkRpc2Nvbm5lY3QpXG4gICAgICAgIC5vbignY2xvc2UnLCBvbkRpc2Nvbm5lY3QpXG4gICAgICAgIC5vbignZW5kJyAgLCBvbkRpc2Nvbm5lY3QpXG4gICAgfVxuXG4gICAgZW1pdHRlci5jb25uZWN0ID1cbiAgICBlbWl0dGVyLmxpc3RlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMucmVjb25uZWN0ID0gdHJ1ZVxuICAgICAgaWYoZW1pdHRlci5jb25uZWN0ZWQpIHJldHVyblxuICAgICAgYmFja29mZk1ldGhvZC5yZXNldCgpXG4gICAgICBiYWNrb2ZmTWV0aG9kLm9uKCdyZWFkeScsIGF0dGVtcHQpXG4gICAgICBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgICBhdHRlbXB0KDAsIDApXG4gICAgICByZXR1cm4gZW1pdHRlclxuICAgIH1cblxuICAgIC8vZm9yY2UgcmVjb25uZWN0aW9uXG4gICAgZW1pdHRlci5yZWNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZih0aGlzLmNvbm5lY3RlZClcbiAgICAgICAgcmV0dXJuIGVtaXR0ZXIuZGlzY29ubmVjdCgpXG4gICAgICBcbiAgICAgIGJhY2tvZmZNZXRob2QucmVzZXQoKVxuICAgICAgYXR0ZW1wdCgwLCAwKVxuICAgICAgcmV0dXJuIGVtaXR0ZXJcbiAgICB9XG5cbiAgICBlbWl0dGVyLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnJlY29ubmVjdCA9IGZhbHNlXG4gICAgICBpZighZW1pdHRlci5jb25uZWN0ZWQpIHJldHVybiBlbWl0dGVyXG4gICAgICBcbiAgICAgIGVsc2UgaWYoZW1pdHRlci5fY29ubmVjdGlvbilcbiAgICAgICAgZW1pdHRlci5fY29ubmVjdGlvbi5kZXN0cm95KClcblxuICAgICAgZW1pdHRlci5lbWl0KCdkaXNjb25uZWN0JylcbiAgICAgIHJldHVybiBlbWl0dGVyXG4gICAgfVxuXG4gICAgdmFyIHdpZGdldFxuICAgIGVtaXR0ZXIud2lkZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYoIXdpZGdldClcbiAgICAgICAgd2lkZ2V0ID0gcmVxdWlyZSgnLi93aWRnZXQnKShlbWl0dGVyKVxuICAgICAgcmV0dXJuIHdpZGdldFxuICAgIH1cblxuICAgIHJldHVybiBlbWl0dGVyXG4gIH1cblxufVxuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbmZ1bmN0aW9uIFN0cmVhbSgpIHtcbiAgZXZlbnRzLkV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xufVxudXRpbC5pbmhlcml0cyhTdHJlYW0sIGV2ZW50cy5FdmVudEVtaXR0ZXIpO1xubW9kdWxlLmV4cG9ydHMgPSBTdHJlYW07XG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjQueFxuU3RyZWFtLlN0cmVhbSA9IFN0cmVhbTtcblxuU3RyZWFtLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24oZGVzdCwgb3B0aW9ucykge1xuICB2YXIgc291cmNlID0gdGhpcztcblxuICBmdW5jdGlvbiBvbmRhdGEoY2h1bmspIHtcbiAgICBpZiAoZGVzdC53cml0YWJsZSkge1xuICAgICAgaWYgKGZhbHNlID09PSBkZXN0LndyaXRlKGNodW5rKSAmJiBzb3VyY2UucGF1c2UpIHtcbiAgICAgICAgc291cmNlLnBhdXNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc291cmNlLm9uKCdkYXRhJywgb25kYXRhKTtcblxuICBmdW5jdGlvbiBvbmRyYWluKCkge1xuICAgIGlmIChzb3VyY2UucmVhZGFibGUgJiYgc291cmNlLnJlc3VtZSkge1xuICAgICAgc291cmNlLnJlc3VtZSgpO1xuICAgIH1cbiAgfVxuXG4gIGRlc3Qub24oJ2RyYWluJywgb25kcmFpbik7XG5cbiAgLy8gSWYgdGhlICdlbmQnIG9wdGlvbiBpcyBub3Qgc3VwcGxpZWQsIGRlc3QuZW5kKCkgd2lsbCBiZSBjYWxsZWQgd2hlblxuICAvLyBzb3VyY2UgZ2V0cyB0aGUgJ2VuZCcgb3IgJ2Nsb3NlJyBldmVudHMuICBPbmx5IGRlc3QuZW5kKCkgb25jZSwgYW5kXG4gIC8vIG9ubHkgd2hlbiBhbGwgc291cmNlcyBoYXZlIGVuZGVkLlxuICBpZiAoIWRlc3QuX2lzU3RkaW8gJiYgKCFvcHRpb25zIHx8IG9wdGlvbnMuZW5kICE9PSBmYWxzZSkpIHtcbiAgICBkZXN0Ll9waXBlQ291bnQgPSBkZXN0Ll9waXBlQ291bnQgfHwgMDtcbiAgICBkZXN0Ll9waXBlQ291bnQrKztcblxuICAgIHNvdXJjZS5vbignZW5kJywgb25lbmQpO1xuICAgIHNvdXJjZS5vbignY2xvc2UnLCBvbmNsb3NlKTtcbiAgfVxuXG4gIHZhciBkaWRPbkVuZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBvbmVuZCgpIHtcbiAgICBpZiAoZGlkT25FbmQpIHJldHVybjtcbiAgICBkaWRPbkVuZCA9IHRydWU7XG5cbiAgICBkZXN0Ll9waXBlQ291bnQtLTtcblxuICAgIC8vIHJlbW92ZSB0aGUgbGlzdGVuZXJzXG4gICAgY2xlYW51cCgpO1xuXG4gICAgaWYgKGRlc3QuX3BpcGVDb3VudCA+IDApIHtcbiAgICAgIC8vIHdhaXRpbmcgZm9yIG90aGVyIGluY29taW5nIHN0cmVhbXMgdG8gZW5kLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRlc3QuZW5kKCk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIG9uY2xvc2UoKSB7XG4gICAgaWYgKGRpZE9uRW5kKSByZXR1cm47XG4gICAgZGlkT25FbmQgPSB0cnVlO1xuXG4gICAgZGVzdC5fcGlwZUNvdW50LS07XG5cbiAgICAvLyByZW1vdmUgdGhlIGxpc3RlbmVyc1xuICAgIGNsZWFudXAoKTtcblxuICAgIGlmIChkZXN0Ll9waXBlQ291bnQgPiAwKSB7XG4gICAgICAvLyB3YWl0aW5nIGZvciBvdGhlciBpbmNvbWluZyBzdHJlYW1zIHRvIGVuZC5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBkZXN0LmRlc3Ryb3koKTtcbiAgfVxuXG4gIC8vIGRvbid0IGxlYXZlIGRhbmdsaW5nIHBpcGVzIHdoZW4gdGhlcmUgYXJlIGVycm9ycy5cbiAgZnVuY3Rpb24gb25lcnJvcihlcikge1xuICAgIGNsZWFudXAoKTtcbiAgICBpZiAodGhpcy5saXN0ZW5lcnMoJ2Vycm9yJykubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkIHN0cmVhbSBlcnJvciBpbiBwaXBlLlxuICAgIH1cbiAgfVxuXG4gIHNvdXJjZS5vbignZXJyb3InLCBvbmVycm9yKTtcbiAgZGVzdC5vbignZXJyb3InLCBvbmVycm9yKTtcblxuICAvLyByZW1vdmUgYWxsIHRoZSBldmVudCBsaXN0ZW5lcnMgdGhhdCB3ZXJlIGFkZGVkLlxuICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZGF0YScsIG9uZGF0YSk7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZHJhaW4nLCBvbmRyYWluKTtcblxuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZW5kJywgb25lbmQpO1xuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBvbmNsb3NlKTtcblxuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbmVycm9yKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uZXJyb3IpO1xuXG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBjbGVhbnVwKTtcbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgY2xlYW51cCk7XG5cbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBjbGVhbnVwKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIGNsZWFudXApO1xuICB9XG5cbiAgc291cmNlLm9uKCdlbmQnLCBjbGVhbnVwKTtcbiAgc291cmNlLm9uKCdjbG9zZScsIGNsZWFudXApO1xuXG4gIGRlc3Qub24oJ2VuZCcsIGNsZWFudXApO1xuICBkZXN0Lm9uKCdjbG9zZScsIGNsZWFudXApO1xuXG4gIGRlc3QuZW1pdCgncGlwZScsIHNvdXJjZSk7XG5cbiAgLy8gQWxsb3cgZm9yIHVuaXgtbGlrZSB1c2FnZTogQS5waXBlKEIpLnBpcGUoQylcbiAgcmV0dXJuIGRlc3Q7XG59O1xuIiwiZXhwb3J0cy5jcmVhdGVJZCA9IFxuZnVuY3Rpb24gKCkge1xuICByZXR1cm4gWzEsMSwxXS5tYXAoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMikudG9VcHBlckNhc2UoKVxuICB9KS5qb2luKCcnKVxufVxuXG5leHBvcnRzLmZpbHRlciA9IGZ1bmN0aW9uICh1cGRhdGUsIHNvdXJjZXMpIHtcbiAgdmFyIHRzID0gdXBkYXRlWzFdXG4gIHZhciBzb3VyY2UgPSB1cGRhdGVbMl1cbiAgcmV0dXJuICghc291cmNlcyB8fCAhc291cmNlc1tzb3VyY2VdIHx8IHNvdXJjZXNbc291cmNlXSA8IHRzKVxufVxuXG5leHBvcnRzLnByb3RvSXNJbGxlZ2FsID0gZnVuY3Rpb24gKHMpIHtcbiAgcy5lbWl0KCdpbnZhbGlkJywgbmV3IEVycm9yKCdcIl9fcHJvdG9fX1wiIGlzIGlsbGVnYWwgcHJvcGVydHkgbmFtZScpKVxuICByZXR1cm4gbnVsbFxufVxuXG5mdW5jdGlvbiBpbnZhbGlkVXBkYXRlKHQpIHtcbiAgdC5lbWl0KCdpbnZhbGlkJywgbmV3IEVycm9yKCdpbnZhbGlkIHVwZGF0ZScpKVxufVxuXG5leHBvcnRzLnZhbGlkVXBkYXRlID0gZnVuY3Rpb24gKHQsIHVwZGF0ZSkge1xuICBpZighQXJyYXkuaXNBcnJheSh1cGRhdGUpKSByZXR1cm4gaW52YWxpZFVwZGF0ZSh0KVxuICBpZignc3RyaW5nJyAhPT0gdHlwZW9mIHVwZGF0ZVsxXSB8fCAnbnVtYmVyJyAhPT0gdHlwZW9mIHVwZGF0ZVsyXSlcbiAgICByZXR1cm4gaW52YWxpZFVwZGF0ZSh0KVxufVxuXG5leHBvcnRzLnNvcnQgPSBmdW5jdGlvbiAoaGlzdCkge1xuICByZXR1cm4gaGlzdC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgLy9zb3J0IGJ5IHRpbWVzdGFtcHMsIHRoZW4gaWRzLlxuICAgIC8vdGhlcmUgc2hvdWxkIG5ldmVyIGJlIGEgcGFpciB3aXRoIGVxdWFsIHRpbWVzdGFtcHNcbiAgICAvL2FuZCBpZHMuXG4gICAgcmV0dXJuIGFbMV0gLSBiWzFdIHx8IChhWzJdID4gYlsyXSA/IDEgOiAtMSlcbiAgfSlcbn1cbiIsIlxudmFyIGJldHdlZW4gICAgID0gcmVxdWlyZSgnYmV0d2VlbicpXG52YXIgU2N1dHRsZWJ1dHQgPSByZXF1aXJlKCdzY3V0dGxlYnV0dCcpXG52YXIgaW5oZXJpdHMgICAgPSByZXF1aXJlKCd1dGlsJykuaW5oZXJpdHNcbnZhciBmaWx0ZXIgICAgICA9IHJlcXVpcmUoJ3NjdXR0bGVidXR0L3V0aWwnKS5maWx0ZXJcblxuaW5oZXJpdHMoUkFycmF5LCBTY3V0dGxlYnV0dClcblxubW9kdWxlLmV4cG9ydHMgPSBSQXJyYXlcblxuZnVuY3Rpb24gZnV6eiAoKSB7XG4gIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDIsIDUpXG59XG5cbnZhciBET0VNSVQgPSB0cnVlLCBDSEFOR0UgPSB7fVxuXG5mdW5jdGlvbiBvcmRlciAoYSwgYikge1xuICAvL3RpbWVzdGFtcCwgdGhlbiBzb3VyY2VcbiAgcmV0dXJuIGJldHdlZW4uc3Ryb3JkKGFbMV0sIGJbMV0pIHx8IGJldHdlZW4uc3Ryb3JkKGFbMl0sIGJbMl0pXG59XG5cbmZ1bmN0aW9uIFJBcnJheSAoKSB7XG4gIFNjdXR0bGVidXR0LmNhbGwodGhpcylcbiAgdGhpcy5rZXlzID0gW11cbiAgdGhpcy5zdG9yZSA9IHt9XG4gIHRoaXMuX2hpc3QgPSB7fVxuICB0aGlzLmxlbmd0aCA9IDBcbiAgaWYoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIDtbXS5mb3JFYWNoLmNhbGwoYXJndW1lbnRzLCBmdW5jdGlvbiAoZSkge1xuICAgICAgc2VsZi5wdXNoKGUpXG4gICAgfSlcbiAgfVxufVxuXG52YXIgQSA9IFJBcnJheS5wcm90b3R5cGVcblxuQS5sYXN0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5rZXlzW3RoaXMua2V5cy5sZW5ndGggLSAxXVxufVxuXG5BLmZpcnN0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5rZXlzWzBdXG59XG5cbkEuaW5zZXJ0ID0gZnVuY3Rpb24gKGJlZm9yZSwgdmFsLCBhZnRlcikgeyAgXG4gIHZhciBrZXkgPSBiZXR3ZWVuKGJlZm9yZSB8fCBiZXR3ZWVuLmxvLCBhZnRlciB8fCBiZXR3ZWVuLmhpKSArIGZ1enooKVxuICB0aGlzLnNldChrZXksIHZhbClcbiAgcmV0dXJuIGtleVxufVxuXG5BLnB1c2ggPSBmdW5jdGlvbiAodmFsKSB7XG4gIHZhciBrZXkgPSB0aGlzLmluc2VydCh0aGlzLmxhc3QoKSwgdmFsKVxufVxuXG5BLnVuc2hpZnQgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHZhciBrZXkgPSB0aGlzLmluc2VydChudWxsLCB2YWwsIHRoaXMuZmlyc3QoKSlcbn1cblxuQS5pbmRleE9mID0gZnVuY3Rpb24gKHZhbCkge1xuICBmb3IodmFyIGkgaW4gdGhpcy5rZXlzKSB7XG4gICAgdmFyIGtleSA9IHRoaXMua2V5c1tpXVxuICAgIGlmKHYgPT09IHRoaXMuZ2V0KGtleSkpIHJldHVybiBpXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuQS5pbmRleE9mS2V5ID0gZnVuY3Rpb24gKGtleSkge1xuICByZXR1cm4gdGhpcy5rZXlzLmluZGV4T2Yoa2V5KVxufVxuXG5BLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHN0b3JlID0gdGhpcy5zdG9yZVxuICB2YXIgc2VsZiA9IHRoaXNcbiAgcmV0dXJuIHRoaXMua2V5cy5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiBzZWxmLmdldChrZXkpXG4gIH0pXG59XG5cbkEuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsKSB7XG4gIGlmKCdzdHJpbmcnID09IHR5cGVvZiBrZXkpIHtcbiAgICBpZih2YWwgPT09IG51bGwpIHJldHVybiB0aGlzLnVuc2V0KGtleSlcbiAgICBpZihudWxsID09IHRoaXMuc3RvcmVba2V5XSkgdGhpcy5sZW5ndGggKytcbiAgICB0aGlzLnN0b3JlW2tleV0gPSB2YWxcbiAgICBpZighfnRoaXMua2V5cy5pbmRleE9mKGtleSkpIHtcbiAgICAgIHRoaXMua2V5cy5wdXNoKGtleSlcbiAgICAgIHRoaXMua2V5cy5zb3J0KClcbiAgICB9XG4gICAgQ0hBTkdFW2tleV0gPSB2YWxcbiAgICBET0VNSVQgJiYgdGhpcy5fZW1pdCgpXG4gIH1cbn1cblxuQS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiB0aGlzLnN0b3JlW2tleV1cbn1cblxuQS51bnNldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYoJ3N0cmluZycgPT0gdHlwZW9mIGtleSkge1xuICAgIGlmKG51bGwgIT0gdGhpcy5zdG9yZVtrZXldKSB0aGlzLmxlbmd0aCAtLVxuICAgIGRlbGV0ZSB0aGlzLnN0b3JlW2tleV1cbiAgICB2YXIgaSA9IHRoaXMua2V5cy5pbmRleE9mKGtleSlcbiAgICBpZighfmkpIHJldHVyblxuICAgIHRoaXMua2V5cy5zcGxpY2UoaSwgMSkgICAgXG5cbiAgICBDSEFOR0Vba2V5XSA9IG51bGxcbiAgICBET0VNSVQgJiYgdGhpcy5fZW1pdCgpXG4gIH1cbn1cblxuQS5wb3AgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBsID0gdGhpcy5sYXN0KClcbiAgdmFyIHZhbCA9IHRoaXMuc3RvcmVbbF1cbiAgdGhpcy51bnNldChsKVxuICByZXR1cm4gdmFsXG59XG5cbkEuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBmID0gdGhpcy5maXJzdCgpXG4gIHZhciB2YWwgPSB0aGlzLnN0b3JlW2ZdXG4gIHRoaXMudW5zZXQoZilcbiAgcmV0dXJuIHZhbFxufVxuXG5BLl9lbWl0ID0gZnVuY3Rpb24gKCkge1xuICBpZighRE9FTUlUKSByZXR1cm5cbiAgdGhpcy5sb2NhbFVwZGF0ZShDSEFOR0UpXG4gIENIQU5HRSA9IHt9XG59XG5cbkEuc3BsaWNlID0gZnVuY3Rpb24gKGksIGQgLyosLi4uYXJncyovKSB7XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpXG4gIHZhciBqID0gMCwgbCA9IGFyZ3MubGVuZ3RoXG5cbiAgRE9FTUlUID0gZmFsc2VcblxuICBpZihkICsgaSA+IHRoaXMua2V5cy5sZW5ndGgpXG4gICAgZCA9IHRoaXMua2V5cy5sZW5ndGggLSBpXG4gIFxuICB3aGlsZShqIDwgZCkge1xuICAgIGlmKGogPCBsKVxuICAgICAgdGhpcy5zZXQodGhpcy5rZXlzW2kral0sIGFyZ3Nbal0pLCBqKytcbiAgICBlbHNlXG4gICAgICB0aGlzLnVuc2V0KHRoaXMua2V5c1tpK2pdKSwgZC0tXG4gIH1cblxuICB3aGlsZShqIDwgbClcbiAgICB0aGlzLmluc2VydCh0aGlzLmtleXNbaStqLTFdLCBhcmdzW2pdLCB0aGlzLmtleXNbaStqXSksIGorK1xuXG4gIERPRU1JVCA9IHRydWVcbiAgdGhpcy5fZW1pdCgpXG59XG5cbkEuYXBwbHlVcGRhdGUgPSBmdW5jdGlvbiAodXBkYXRlKSB7XG4gIERPRU1JVCA9IGZhbHNlXG4gIHZhciBjaGFuZ2UgPSB1cGRhdGVbMF0sIG9sZFxuICB2YXIgYXBwbHkgPSB7fSwgY2ggPSB7fVxuICB2YXIgb2xkID0ge31cbiAgZm9yKHZhciBrZXkgaW4gY2hhbmdlKSB7XG4gICAgaWYoIXRoaXMuX2hpc3Rba2V5XSB8fCBvcmRlcih1cGRhdGUsIHRoaXMuX2hpc3Rba2V5XSkgPiAwKVxuICAgICAgYXBwbHlba2V5XSA9IGNoYW5nZVtrZXldXG4gIH1cbiAgLy9hbGxvdyB0aGUgdXNlciB0byBzZWUgd2hhdCB0aGUgY2hhbmdlIGlzIGdvaW5nIHRvIGJlLlxuICB0aGlzLmVtaXQoJ3ByZXVwZGF0ZScsIGFwcGx5KSBcblxuICAvL2FwcGx5IHRoZSBjaGFuZ2UuLi5cbiAgZm9yKHZhciBrZXkgaW4gYXBwbHkpIHtcbiAgICB2YXIgbyA9IHRoaXMuX2hpc3Rba2V5XVxuICAgIG8gJiYgKG9sZFtvWzFdKyc6JytvWzJdXSA9IG8pIC8vdHM6c291cmNlXG4gICAgdGhpcy5faGlzdFtrZXldID0gdXBkYXRlXG4gICAgdGhpcy5zZXQoa2V5LCBhcHBseVtrZXldKVxuICB9XG5cbiAgLy9jaGVjayBpZiBvbGQgZWxlbWVudHMgbmVlZCB0byBiZSByZW1vdmVkLlxuICAvL21heSBhbHNvIHdhbnQgdG8ga2VlcCBvbGQgdXBkYXRlcyBoYW5naW5nIGFyb3VuZCBcbiAgLy9zbyB0aGUgdXNlciBjYW4gc2VlIHJlY2VudCBoaXN0b3J5Li4uXG4gIGZvcih2YXIgaWQgaW4gb2xkKSB7XG4gICAgdmFyIG8gPSBvbGRbaWRdWzBdLCBybSA9IHRydWVcbiAgICBmb3IodmFyIGtleSBpbiBvKSB7XG4gICAgICBpZih0aGlzLl9oaXN0W2tleV0gPT09IG9sZFtpZF0pIHJtID0gZmFsc2VcbiAgICB9XG4gICAgaWYocm0pXG4gICAgICB0aGlzLmVtaXQoJ19yZW1vdmUnLCBvbGRbaWRdKVxuICB9XG4gICAgXG4gIERPRU1JVCA9IHRydWVcbiAgQ0hBTkdFID0ge31cbiAgdGhpcy5lbWl0KCd1cGRhdGUnLCBhcHBseSlcbiAgcmV0dXJuIHRydWVcbn1cblxuXG5BLmhpc3RvcnkgPSBmdW5jdGlvbiAoc291cmNlcykge1xuICB2YXIgaCA9IFtdXG4gIGZvciAodmFyIGtleSBpbiB0aGlzLl9oaXN0KSB7XG4gICAgdmFyIHVwZGF0ZSA9IHRoaXMuX2hpc3Rba2V5XVxuICAgICAgaWYoIX5oLmluZGV4T2YodXBkYXRlKSAmJiBmaWx0ZXIodXBkYXRlLCBzb3VyY2VzKSlcbiAgICAgICAgaC5wdXNoKHVwZGF0ZSlcbiAgfVxuICByZXR1cm4gaC5zb3J0KG9yZGVyKVxufVxuXG5BLmZvckVhY2ggPSBmdW5jdGlvbiAoZnVuKSB7XG4gIHJldHVybiB0aGlzLnRvSlNPTigpLmZvckVhY2goZnVuKVxufVxuXG5BLmZpbHRlciA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgcmV0dXJuIHRoaXMudG9KU09OKCkuZmlsdGVyKGZ1bilcbn1cblxuQS5tYXAgPSBmdW5jdGlvbiAoZnVuKSB7XG4gIHJldHVybiB0aGlzLnRvSlNPTigpLm1hcChmdW4pXG59XG5cbkEucmVkdWNlID0gZnVuY3Rpb24gKGZ1biwgaW5pdGlhbCkge1xuICByZXR1cm4gdGhpcy50b0pTT04oKS5yZWR1Y2UoZnVuLCBpbml0aWFsKVxufVxuXG4vLy5sZW5ndGggaXMgYSBwcm9wZXJ0eSwgbm90IGEgZnVuY3Rpb24uXG4iLCJ2YXIgU3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJyk7XG52YXIgc29ja2pzID0gcmVxdWlyZSgnc29ja2pzLWNsaWVudCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh1cmksIGNiKSB7XG4gICAgaWYgKC9eXFwvXFwvW15cXC9dK1xcLy8udGVzdCh1cmkpKSB7XG4gICAgICAgIHVyaSA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIHVyaTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIS9eaHR0cHM/OlxcL1xcLy8udGVzdCh1cmkpKSB7XG4gICAgICAgIHVyaSA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArICcvLydcbiAgICAgICAgICAgICsgd2luZG93LmxvY2F0aW9uLmhvc3RcbiAgICAgICAgICAgICsgKC9eXFwvLy50ZXN0KHVyaSkgPyB1cmkgOiAnLycgKyB1cmkpXG4gICAgICAgIDtcbiAgICB9XG4gICAgXG4gICAgdmFyIHN0cmVhbSA9IG5ldyBTdHJlYW07XG4gICAgc3RyZWFtLnJlYWRhYmxlID0gdHJ1ZTtcbiAgICBzdHJlYW0ud3JpdGFibGUgPSB0cnVlO1xuICAgIFxuICAgIHZhciByZWFkeSA9IGZhbHNlO1xuICAgIHZhciBidWZmZXIgPSBbXTtcbiAgICBcbiAgICB2YXIgc29jayA9IHNvY2tqcyh1cmkpO1xuICAgIHN0cmVhbS5zb2NrID0gc29jaztcbiAgICBcbiAgICBzdHJlYW0ud3JpdGUgPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgICAgIGlmICghcmVhZHkgfHwgYnVmZmVyLmxlbmd0aCkgYnVmZmVyLnB1c2gobXNnKVxuICAgICAgICBlbHNlIHNvY2suc2VuZChtc2cpXG4gICAgfTtcbiAgICBcbiAgICBzdHJlYW0uZW5kID0gZnVuY3Rpb24gKG1zZykge1xuICAgICAgICBpZiAobXNnICE9PSB1bmRlZmluZWQpIHN0cmVhbS53cml0ZShtc2cpO1xuICAgICAgICBpZiAoIXJlYWR5KSB7XG4gICAgICAgICAgICBzdHJlYW0uX2VuZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdHJlYW0ud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgc29jay5jbG9zZSgpO1xuICAgIH07XG4gICAgXG4gICAgc3RyZWFtLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0cmVhbS5fZW5kZWQgPSB0cnVlO1xuICAgICAgICBzdHJlYW0ud3JpdGFibGUgPSBzdHJlYW0ucmVhZGFibGUgPSBmYWxzZTtcbiAgICAgICAgYnVmZmVyLmxlbmd0aCA9IDBcbiAgICAgICAgc29jay5jbG9zZSgpO1xuICAgIH07XG4gICAgXG4gICAgc29jay5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKCk7XG4gICAgICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWZmZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNvY2suc2VuZChidWZmZXJbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGJ1ZmZlciA9IFtdO1xuICAgICAgICBzdHJlYW0uZW1pdCgnY29ubmVjdCcpO1xuICAgICAgICBpZiAoc3RyZWFtLl9lbmRlZCkgc3RyZWFtLmVuZCgpO1xuICAgIH07XG4gICAgXG4gICAgc29jay5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBzdHJlYW0uZW1pdCgnZGF0YScsIGUuZGF0YSk7XG4gICAgfTtcbiAgICBcbiAgICBzb2NrLm9uY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0cmVhbS5lbWl0KCdlbmQnKTtcbiAgICAgICAgc3RyZWFtLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIHN0cmVhbS5yZWFkYWJsZSA9IGZhbHNlO1xuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIHN0cmVhbTtcbn07XG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDEyIE1hdGhpZXUgVHVyY290dGVcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG52YXIgQmFja29mZiA9IHJlcXVpcmUoJy4vbGliL2JhY2tvZmYnKSxcbiAgICBGaWJvbmFjY2lCYWNrb2ZmU3RyYXRlZ3kgPSByZXF1aXJlKCcuL2xpYi9zdHJhdGVneS9maWJvbmFjY2knKSxcbiAgICBFeHBvbmVudGlhbEJhY2tvZmZTdHJhdGVneSA9IHJlcXVpcmUoJy4vbGliL3N0cmF0ZWd5L2V4cG9uZW50aWFsJyk7XG5cbm1vZHVsZS5leHBvcnRzLkJhY2tvZmYgPSBCYWNrb2ZmO1xubW9kdWxlLmV4cG9ydHMuRmlib25hY2NpU3RyYXRlZ3kgPSBGaWJvbmFjY2lCYWNrb2ZmU3RyYXRlZ3k7XG5tb2R1bGUuZXhwb3J0cy5FeHBvbmVudGlhbFN0cmF0ZWd5ID0gRXhwb25lbnRpYWxCYWNrb2ZmU3RyYXRlZ3k7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIEZpYm9uYWNjaSBiYWNrb2ZmLlxuICogQHBhcmFtIG9wdGlvbnMgRmlib25hY2NpIGJhY2tvZmYgc3RyYXRlZ3kgYXJndW1lbnRzLlxuICogQHNlZSBGaWJvbmFjY2lCYWNrb2ZmU3RyYXRlZ3lcbiAqL1xubW9kdWxlLmV4cG9ydHMuZmlib25hY2NpID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgQmFja29mZihuZXcgRmlib25hY2NpQmFja29mZlN0cmF0ZWd5KG9wdGlvbnMpKTtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhbiBleHBvbmVudGlhbCBiYWNrb2ZmLlxuICogQHBhcmFtIG9wdGlvbnMgRXhwb25lbnRpYWwgc3RyYXRlZ3kgYXJndW1lbnRzLlxuICogQHNlZSBFeHBvbmVudGlhbEJhY2tvZmZTdHJhdGVneVxuICovXG5tb2R1bGUuZXhwb3J0cy5leHBvbmVudGlhbCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IEJhY2tvZmYobmV3IEV4cG9uZW50aWFsQmFja29mZlN0cmF0ZWd5KG9wdGlvbnMpKTtcbn07XG5cbiIsIlxudmFyIGggPSByZXF1aXJlKCdoJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZW1pdHRlcikge1xuICB2YXIgc3R5bGUgPSB7fVxuICB2YXIgZWwgPSBoKCdhJywge2hyZWY6ICcjJywgc3R5bGU6IHN0eWxlLCBjbGljazogZW1pdHRlci5kaXNjb25uZWN0fSlcbiAgdmFyIGludFxuICBlbWl0dGVyLm9uKCdyZWNvbm5lY3QnLCBmdW5jdGlvbiAobiwgZCkge1xuICAgIHZhciBkZWxheSA9IE1hdGgucm91bmQoZCAvIDEwMDApICsgMVxuICAgIGNvbnNvbGUubG9nKG4sIGQpXG4gICAgZWwuaW5uZXJUZXh0ID0gJ3JlY29ubmVjdCBpbiAnICsgZGVsYXlcbiAgICBjbGVhckludGVydmFsKGludClcbiAgICBpbnQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICBlbC5pbm5lclRleHQgPSBkZWxheSA/ICdyZWNvbm5lY3QgaW4gJyArIC0tZGVsYXkgOiAncmVjb25uZWN0aW5nLi4uJ1xuICAgIH0sIDFlMylcbiAgfSlcbiAgZW1pdHRlci5vbignY29ubmVjdCcsICAgZnVuY3Rpb24gKCkge1xuICAgIGVsLmlubmVyVGV4dCA9ICdjb25uZWN0ZWQnXG4gICAgY2xlYXJJbnRlcnZhbChpbnQpXG4gIH0pXG4gIHJldHVybiBlbFxufVxuIiwiXG5mdW5jdGlvbiBpbmplY3QgKGNoYXJzKSB7XG5cbiAgY2hhcnMgPSBjaGFycyB8fFxuICAnITAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWl9hYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5en4nXG5cbiAgY2hhcnMgPSBjaGFycy5zcGxpdCgnJykuc29ydCgpLmpvaW4oJycpXG5cbiAgdmFyIGV4cG9ydHMgPSBiZXR3ZWVuXG5cbiAgZXhwb3J0cy5iZXR3ZWVuICAgPSBiZXR3ZWVuXG5cbiAgZXhwb3J0cy5yYW5kc3RyICAgPSByYW5kc3RyXG4gIGV4cG9ydHMuYmV0d2VlbiAgID0gYmV0d2VlblxuICBleHBvcnRzLnN0cm9yZCAgICA9IHN0cm9yZFxuXG4gIGV4cG9ydHMubG8gICAgICAgID0gY2hhcnNbMF1cbiAgZXhwb3J0cy5oaSAgICAgICAgPSBjaGFyc1tjaGFycy5sZW5ndGggLSAxXVxuXG4gIGV4cG9ydHMuaW5qZWN0ICAgID0gaW5qZWN0XG5cbiAgZnVuY3Rpb24gcmFuZHN0cihsKSB7XG4gICAgdmFyIHN0ciA9ICcnXG4gICAgd2hpbGUobC0tKSBcbiAgICAgIHN0ciArPSBjaGFyc1tcbiAgICAgICAgTWF0aC5mbG9vcihcbiAgICAgICAgICBNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoIFxuICAgICAgICApXG4gICAgICBdXG4gICAgcmV0dXJuIHN0clxuICB9XG5cbiAgLypcbiAgICBTT01FIEVYQU1QTEUgU1RSSU5HUywgSU4gT1JERVJcbiAgIFxuICAgIDBcbiAgICAwMDAwMVxuICAgIDAwMDFcbiAgICAwMDFcbiAgICAwMDEwMDFcbiAgICAwMDEwMVxuICAgIDAwMTFcbiAgICAwMDExMDAxXG4gICAgMDAxMTAwMTAxXG4gICAgMDAxMTAwMTFcbiAgICAwMDExMDFcbiAgICAwMDExMVxuICAgIDAxICBcblxuICAgIGlmIHlvdSBuZXZlciBtYWtlIGEgc3RyaW5nIHRoYXQgZW5kcyBpbiB0aGUgbG93ZXN0IGNoYXIsXG4gICAgdGhlbiBpdCBpcyBhbHdheXMgcG9zc2libGUgdG8gbWFrZSBhIHN0cmluZyBiZXR3ZWVuIHR3byBzdHJpbmdzLlxuICAgIHRoaXMgaXMgbGlrZSBob3cgZGVjaW1hbHMgbmV2ZXIgZW5kIGluIDAuIFxuXG4gICAgZXhhbXBsZTpcblxuICAgIGJldHdlZW4oJ0EnLCAnQUInKSBcblxuICAgIC4uLiAnQUEnIHdpbGwgc29ydCBiZXR3ZWVuICdBJyBhbmQgJ0FCJyBidXQgdGhlbiBpdCBpcyBpbXBvc3NpYmxlXG4gICAgdG8gbWFrZSBhIHN0cmluZyBpbmJldHdlZW4gJ0EnIGFuZCAnQUEnLlxuICAgIGluc3RlYWQsIHJldHVybiAnQUFCJywgdGhlbiB0aGVyZSB3aWxsIGJlIHNwYWNlLlxuXG4gICovXG5cbiAgZnVuY3Rpb24gYmV0d2VlbiAoYSwgYikge1xuXG4gICAgdmFyIHMgPSAnJywgaSA9IDBcblxuICAgIHdoaWxlICh0cnVlKSB7XG5cbiAgICAgIHZhciBfYSA9IGNoYXJzLmluZGV4T2YoYVtpXSlcbiAgICAgIHZhciBfYiA9IGNoYXJzLmluZGV4T2YoYltpXSlcbiAgICAgXG4gICAgICBpZihfYSA9PSAtMSkgX2EgPSAwXG4gICAgICBpZihfYiA9PSAtMSkgX2IgPSBjaGFycy5sZW5ndGggLSAxXG5cbiAgICAgIGkrK1xuXG4gICAgICB2YXIgYyA9IGNoYXJzW1xuICAgICAgICAgIF9hICsgMSA8IF9iIFxuICAgICAgICA/IE1hdGgucm91bmQoKF9hK19iKS8yKVxuICAgICAgICA6IF9hXG4gICAgICBdXG5cbiAgICAgIHMgKz0gY1xuXG4gICAgICBpZihhIDwgcyAmJiBzIDwgYiAmJiBjICE9IGV4cG9ydHMubG8pXG4gICAgICAgIHJldHVybiBzO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0cm9yZCAoYSwgYikge1xuICAgIHJldHVybiAoXG4gICAgICBhID09IGIgPyAgMFxuICAgIDogYSA8ICBiID8gLTFcbiAgICA6ICAgICAgICAgICAxXG4gICAgKVxuICB9XG5cbiAgYmV0d2Vlbi5zdHJvcmRcblxuICByZXR1cm4gYmV0d2VlblxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gaW5qZWN0KG51bGwpXG4iLCIoZnVuY3Rpb24oKXsvKiBTb2NrSlMgY2xpZW50LCB2ZXJzaW9uIDAuMy4xLjcuZ2E2N2YuZGlydHksIGh0dHA6Ly9zb2NranMub3JnLCBNSVQgTGljZW5zZVxuXG5Db3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuKi9cblxuLy8gSlNPTjIgYnkgRG91Z2xhcyBDcm9ja2ZvcmQgKG1pbmlmaWVkKS5cbnZhciBKU09OO0pTT058fChKU09OPXt9KSxmdW5jdGlvbigpe2Z1bmN0aW9uIHN0cihhLGIpe3ZhciBjLGQsZSxmLGc9Z2FwLGgsaT1iW2FdO2kmJnR5cGVvZiBpPT1cIm9iamVjdFwiJiZ0eXBlb2YgaS50b0pTT049PVwiZnVuY3Rpb25cIiYmKGk9aS50b0pTT04oYSkpLHR5cGVvZiByZXA9PVwiZnVuY3Rpb25cIiYmKGk9cmVwLmNhbGwoYixhLGkpKTtzd2l0Y2godHlwZW9mIGkpe2Nhc2VcInN0cmluZ1wiOnJldHVybiBxdW90ZShpKTtjYXNlXCJudW1iZXJcIjpyZXR1cm4gaXNGaW5pdGUoaSk/U3RyaW5nKGkpOlwibnVsbFwiO2Nhc2VcImJvb2xlYW5cIjpjYXNlXCJudWxsXCI6cmV0dXJuIFN0cmluZyhpKTtjYXNlXCJvYmplY3RcIjppZighaSlyZXR1cm5cIm51bGxcIjtnYXArPWluZGVudCxoPVtdO2lmKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkoaSk9PT1cIltvYmplY3QgQXJyYXldXCIpe2Y9aS5sZW5ndGg7Zm9yKGM9MDtjPGY7Yys9MSloW2NdPXN0cihjLGkpfHxcIm51bGxcIjtlPWgubGVuZ3RoPT09MD9cIltdXCI6Z2FwP1wiW1xcblwiK2dhcCtoLmpvaW4oXCIsXFxuXCIrZ2FwKStcIlxcblwiK2crXCJdXCI6XCJbXCIraC5qb2luKFwiLFwiKStcIl1cIixnYXA9ZztyZXR1cm4gZX1pZihyZXAmJnR5cGVvZiByZXA9PVwib2JqZWN0XCIpe2Y9cmVwLmxlbmd0aDtmb3IoYz0wO2M8ZjtjKz0xKXR5cGVvZiByZXBbY109PVwic3RyaW5nXCImJihkPXJlcFtjXSxlPXN0cihkLGkpLGUmJmgucHVzaChxdW90ZShkKSsoZ2FwP1wiOiBcIjpcIjpcIikrZSkpfWVsc2UgZm9yKGQgaW4gaSlPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaSxkKSYmKGU9c3RyKGQsaSksZSYmaC5wdXNoKHF1b3RlKGQpKyhnYXA/XCI6IFwiOlwiOlwiKStlKSk7ZT1oLmxlbmd0aD09PTA/XCJ7fVwiOmdhcD9cIntcXG5cIitnYXAraC5qb2luKFwiLFxcblwiK2dhcCkrXCJcXG5cIitnK1wifVwiOlwie1wiK2guam9pbihcIixcIikrXCJ9XCIsZ2FwPWc7cmV0dXJuIGV9fWZ1bmN0aW9uIHF1b3RlKGEpe2VzY2FwYWJsZS5sYXN0SW5kZXg9MDtyZXR1cm4gZXNjYXBhYmxlLnRlc3QoYSk/J1wiJythLnJlcGxhY2UoZXNjYXBhYmxlLGZ1bmN0aW9uKGEpe3ZhciBiPW1ldGFbYV07cmV0dXJuIHR5cGVvZiBiPT1cInN0cmluZ1wiP2I6XCJcXFxcdVwiKyhcIjAwMDBcIithLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCl9KSsnXCInOidcIicrYSsnXCInfWZ1bmN0aW9uIGYoYSl7cmV0dXJuIGE8MTA/XCIwXCIrYTphfVwidXNlIHN0cmljdFwiLHR5cGVvZiBEYXRlLnByb3RvdHlwZS50b0pTT04hPVwiZnVuY3Rpb25cIiYmKERhdGUucHJvdG90eXBlLnRvSlNPTj1mdW5jdGlvbihhKXtyZXR1cm4gaXNGaW5pdGUodGhpcy52YWx1ZU9mKCkpP3RoaXMuZ2V0VVRDRnVsbFllYXIoKStcIi1cIitmKHRoaXMuZ2V0VVRDTW9udGgoKSsxKStcIi1cIitmKHRoaXMuZ2V0VVRDRGF0ZSgpKStcIlRcIitmKHRoaXMuZ2V0VVRDSG91cnMoKSkrXCI6XCIrZih0aGlzLmdldFVUQ01pbnV0ZXMoKSkrXCI6XCIrZih0aGlzLmdldFVUQ1NlY29uZHMoKSkrXCJaXCI6bnVsbH0sU3RyaW5nLnByb3RvdHlwZS50b0pTT049TnVtYmVyLnByb3RvdHlwZS50b0pTT049Qm9vbGVhbi5wcm90b3R5cGUudG9KU09OPWZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLnZhbHVlT2YoKX0pO3ZhciBjeD0vW1xcdTAwMDBcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxlc2NhcGFibGU9L1tcXFxcXFxcIlxceDAwLVxceDFmXFx4N2YtXFx4OWZcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxnYXAsaW5kZW50LG1ldGE9e1wiXFxiXCI6XCJcXFxcYlwiLFwiXFx0XCI6XCJcXFxcdFwiLFwiXFxuXCI6XCJcXFxcblwiLFwiXFxmXCI6XCJcXFxcZlwiLFwiXFxyXCI6XCJcXFxcclwiLCdcIic6J1xcXFxcIicsXCJcXFxcXCI6XCJcXFxcXFxcXFwifSxyZXA7dHlwZW9mIEpTT04uc3RyaW5naWZ5IT1cImZ1bmN0aW9uXCImJihKU09OLnN0cmluZ2lmeT1mdW5jdGlvbihhLGIsYyl7dmFyIGQ7Z2FwPVwiXCIsaW5kZW50PVwiXCI7aWYodHlwZW9mIGM9PVwibnVtYmVyXCIpZm9yKGQ9MDtkPGM7ZCs9MSlpbmRlbnQrPVwiIFwiO2Vsc2UgdHlwZW9mIGM9PVwic3RyaW5nXCImJihpbmRlbnQ9Yyk7cmVwPWI7aWYoIWJ8fHR5cGVvZiBiPT1cImZ1bmN0aW9uXCJ8fHR5cGVvZiBiPT1cIm9iamVjdFwiJiZ0eXBlb2YgYi5sZW5ndGg9PVwibnVtYmVyXCIpcmV0dXJuIHN0cihcIlwiLHtcIlwiOmF9KTt0aHJvdyBuZXcgRXJyb3IoXCJKU09OLnN0cmluZ2lmeVwiKX0pLHR5cGVvZiBKU09OLnBhcnNlIT1cImZ1bmN0aW9uXCImJihKU09OLnBhcnNlPWZ1bmN0aW9uKHRleHQscmV2aXZlcil7ZnVuY3Rpb24gd2FsayhhLGIpe3ZhciBjLGQsZT1hW2JdO2lmKGUmJnR5cGVvZiBlPT1cIm9iamVjdFwiKWZvcihjIGluIGUpT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGUsYykmJihkPXdhbGsoZSxjKSxkIT09dW5kZWZpbmVkP2VbY109ZDpkZWxldGUgZVtjXSk7cmV0dXJuIHJldml2ZXIuY2FsbChhLGIsZSl9dmFyIGo7dGV4dD1TdHJpbmcodGV4dCksY3gubGFzdEluZGV4PTAsY3gudGVzdCh0ZXh0KSYmKHRleHQ9dGV4dC5yZXBsYWNlKGN4LGZ1bmN0aW9uKGEpe3JldHVyblwiXFxcXHVcIisoXCIwMDAwXCIrYS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTQpfSkpO2lmKC9eW1xcXSw6e31cXHNdKiQvLnRlc3QodGV4dC5yZXBsYWNlKC9cXFxcKD86W1wiXFxcXFxcL2JmbnJ0XXx1WzAtOWEtZkEtRl17NH0pL2csXCJAXCIpLnJlcGxhY2UoL1wiW15cIlxcXFxcXG5cXHJdKlwifHRydWV8ZmFsc2V8bnVsbHwtP1xcZCsoPzpcXC5cXGQqKT8oPzpbZUVdWytcXC1dP1xcZCspPy9nLFwiXVwiKS5yZXBsYWNlKC8oPzpefDp8LCkoPzpcXHMqXFxbKSsvZyxcIlwiKSkpe2o9ZXZhbChcIihcIit0ZXh0K1wiKVwiKTtyZXR1cm4gdHlwZW9mIHJldml2ZXI9PVwiZnVuY3Rpb25cIj93YWxrKHtcIlwiOmp9LFwiXCIpOmp9dGhyb3cgbmV3IFN5bnRheEVycm9yKFwiSlNPTi5wYXJzZVwiKX0pfSgpXG5cblxuLy8gICAgIFsqXSBJbmNsdWRpbmcgbGliL2luZGV4LmpzXG4vLyBQdWJsaWMgb2JqZWN0XG52YXIgU29ja0pTID0gKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIHZhciBfZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICAgICAgICAgICAgdmFyIF93aW5kb3cgPSB3aW5kb3c7XG4gICAgICAgICAgICAgIHZhciB1dGlscyA9IHt9O1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvcmV2ZW50dGFyZ2V0LmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vKiBTaW1wbGlmaWVkIGltcGxlbWVudGF0aW9uIG9mIERPTTIgRXZlbnRUYXJnZXQuXG4gKiAgIGh0dHA6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0yLUV2ZW50cy9ldmVudHMuaHRtbCNFdmVudHMtRXZlbnRUYXJnZXRcbiAqL1xudmFyIFJFdmVudFRhcmdldCA9IGZ1bmN0aW9uKCkge307XG5SRXZlbnRUYXJnZXQucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBsaXN0ZW5lcikge1xuICAgIGlmKCF0aGlzLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xuICAgIH1cbiAgICBpZighKGV2ZW50VHlwZSBpbiB0aGlzLl9saXN0ZW5lcnMpKSB7XG4gICAgICAgIHRoaXMuX2xpc3RlbmVyc1tldmVudFR5cGVdID0gW107XG4gICAgfVxuICAgIHZhciBhcnIgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRUeXBlXTtcbiAgICBpZih1dGlscy5hcnJJbmRleE9mKGFyciwgbGlzdGVuZXIpID09PSAtMSkge1xuICAgICAgICBhcnIucHVzaChsaXN0ZW5lcik7XG4gICAgfVxuICAgIHJldHVybjtcbn07XG5cblJFdmVudFRhcmdldC5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGxpc3RlbmVyKSB7XG4gICAgaWYoISh0aGlzLl9saXN0ZW5lcnMgJiYgKGV2ZW50VHlwZSBpbiB0aGlzLl9saXN0ZW5lcnMpKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBhcnIgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRUeXBlXTtcbiAgICB2YXIgaWR4ID0gdXRpbHMuYXJySW5kZXhPZihhcnIsIGxpc3RlbmVyKTtcbiAgICBpZiAoaWR4ICE9PSAtMSkge1xuICAgICAgICBpZihhcnIubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhpcy5fbGlzdGVuZXJzW2V2ZW50VHlwZV0gPSBhcnIuc2xpY2UoMCwgaWR4KS5jb25jYXQoIGFyci5zbGljZShpZHgrMSkgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRUeXBlXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybjtcbn07XG5cblJFdmVudFRhcmdldC5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciB0ID0gZXZlbnQudHlwZTtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgaWYgKHRoaXNbJ29uJyt0XSkge1xuICAgICAgICB0aGlzWydvbicrdF0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9saXN0ZW5lcnMgJiYgdCBpbiB0aGlzLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCB0aGlzLl9saXN0ZW5lcnNbdF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVyc1t0XVtpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3JldmVudHRhcmdldC5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvc2ltcGxlZXZlbnQuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBTaW1wbGVFdmVudCA9IGZ1bmN0aW9uKHR5cGUsIG9iaikge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgaWYgKHR5cGVvZiBvYmogIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvcih2YXIgayBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KGspKSBjb250aW51ZTtcbiAgICAgICAgICAgIHRoaXNba10gPSBvYmpba107XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5TaW1wbGVFdmVudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgciA9IFtdO1xuICAgIGZvcih2YXIgayBpbiB0aGlzKSB7XG4gICAgICAgIGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eShrKSkgY29udGludWU7XG4gICAgICAgIHZhciB2ID0gdGhpc1trXTtcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSAnZnVuY3Rpb24nKSB2ID0gJ1tmdW5jdGlvbl0nO1xuICAgICAgICByLnB1c2goayArICc9JyArIHYpO1xuICAgIH1cbiAgICByZXR1cm4gJ1NpbXBsZUV2ZW50KCcgKyByLmpvaW4oJywgJykgKyAnKSc7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9zaW1wbGVldmVudC5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvZXZlbnRlbWl0dGVyLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgRXZlbnRFbWl0dGVyID0gZnVuY3Rpb24oZXZlbnRzKSB7XG4gICAgdGhpcy5ldmVudHMgPSBldmVudHMgfHwgW107XG59O1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKCF0aGF0Lm51a2VkICYmIHRoYXRbJ29uJyt0eXBlXSkge1xuICAgICAgICB0aGF0WydvbicrdHlwZV0uYXBwbHkodGhhdCwgYXJncyk7XG4gICAgfVxuICAgIGlmICh1dGlscy5hcnJJbmRleE9mKHRoYXQuZXZlbnRzLCB0eXBlKSA9PT0gLTEpIHtcbiAgICAgICAgdXRpbHMubG9nKCdFdmVudCAnICsgSlNPTi5zdHJpbmdpZnkodHlwZSkgK1xuICAgICAgICAgICAgICAgICAgJyBub3QgbGlzdGVkICcgKyBKU09OLnN0cmluZ2lmeSh0aGF0LmV2ZW50cykgK1xuICAgICAgICAgICAgICAgICAgJyBpbiAnICsgdGhhdCk7XG4gICAgfVxufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5udWtlID0gZnVuY3Rpb24odHlwZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0Lm51a2VkID0gdHJ1ZTtcbiAgICBmb3IodmFyIGk9MDsgaTx0aGF0LmV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBkZWxldGUgdGhhdFt0aGF0LmV2ZW50c1tpXV07XG4gICAgfVxufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvZXZlbnRlbWl0dGVyLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi91dGlscy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIHJhbmRvbV9zdHJpbmdfY2hhcnMgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Xyc7XG51dGlscy5yYW5kb21fc3RyaW5nID0gZnVuY3Rpb24obGVuZ3RoLCBtYXgpIHtcbiAgICBtYXggPSBtYXggfHwgcmFuZG9tX3N0cmluZ19jaGFycy5sZW5ndGg7XG4gICAgdmFyIGksIHJldCA9IFtdO1xuICAgIGZvcihpPTA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICByZXQucHVzaCggcmFuZG9tX3N0cmluZ19jaGFycy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KSwxKSApO1xuICAgIH1cbiAgICByZXR1cm4gcmV0LmpvaW4oJycpO1xufTtcbnV0aWxzLnJhbmRvbV9udW1iZXIgPSBmdW5jdGlvbihtYXgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbn07XG51dGlscy5yYW5kb21fbnVtYmVyX3N0cmluZyA9IGZ1bmN0aW9uKG1heCkge1xuICAgIHZhciB0ID0gKCcnKyhtYXggLSAxKSkubGVuZ3RoO1xuICAgIHZhciBwID0gQXJyYXkodCsxKS5qb2luKCcwJyk7XG4gICAgcmV0dXJuIChwICsgdXRpbHMucmFuZG9tX251bWJlcihtYXgpKS5zbGljZSgtdCk7XG59O1xuXG4vLyBBc3N1bWluZyB0aGF0IHVybCBsb29rcyBsaWtlOiBodHRwOi8vYXNkYXNkOjExMS9hc2RcbnV0aWxzLmdldE9yaWdpbiA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHVybCArPSAnLyc7XG4gICAgdmFyIHBhcnRzID0gdXJsLnNwbGl0KCcvJykuc2xpY2UoMCwgMyk7XG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbnV0aWxzLmlzU2FtZU9yaWdpblVybCA9IGZ1bmN0aW9uKHVybF9hLCB1cmxfYikge1xuICAgIC8vIGxvY2F0aW9uLm9yaWdpbiB3b3VsZCBkbywgYnV0IGl0J3Mgbm90IGFsd2F5cyBhdmFpbGFibGUuXG4gICAgaWYgKCF1cmxfYikgdXJsX2IgPSBfd2luZG93LmxvY2F0aW9uLmhyZWY7XG5cbiAgICByZXR1cm4gKHVybF9hLnNwbGl0KCcvJykuc2xpY2UoMCwzKS5qb2luKCcvJylcbiAgICAgICAgICAgICAgICA9PT1cbiAgICAgICAgICAgIHVybF9iLnNwbGl0KCcvJykuc2xpY2UoMCwzKS5qb2luKCcvJykpO1xufTtcblxudXRpbHMuZ2V0UGFyZW50RG9tYWluID0gZnVuY3Rpb24odXJsKSB7XG4gICAgLy8gaXB2NCBpcCBhZGRyZXNzXG4gICAgaWYgKC9eWzAtOS5dKiQvLnRlc3QodXJsKSkgcmV0dXJuIHVybDtcbiAgICAvLyBpcHY2IGlwIGFkZHJlc3NcbiAgICBpZiAoL15cXFsvLnRlc3QodXJsKSkgcmV0dXJuIHVybDtcbiAgICAvLyBubyBkb3RzXG4gICAgaWYgKCEoL1suXS8udGVzdCh1cmwpKSkgcmV0dXJuIHVybDtcblxuICAgIHZhciBwYXJ0cyA9IHVybC5zcGxpdCgnLicpLnNsaWNlKDEpO1xuICAgIHJldHVybiBwYXJ0cy5qb2luKCcuJyk7XG59O1xuXG51dGlscy5vYmplY3RFeHRlbmQgPSBmdW5jdGlvbihkc3QsIHNyYykge1xuICAgIGZvcih2YXIgayBpbiBzcmMpIHtcbiAgICAgICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgZHN0W2tdID0gc3JjW2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkc3Q7XG59O1xuXG52YXIgV1ByZWZpeCA9ICdfanAnO1xuXG51dGlscy5wb2xsdXRlR2xvYmFsTmFtZXNwYWNlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEoV1ByZWZpeCBpbiBfd2luZG93KSkge1xuICAgICAgICBfd2luZG93W1dQcmVmaXhdID0ge307XG4gICAgfVxufTtcblxudXRpbHMuY2xvc2VGcmFtZSA9IGZ1bmN0aW9uIChjb2RlLCByZWFzb24pIHtcbiAgICByZXR1cm4gJ2MnK0pTT04uc3RyaW5naWZ5KFtjb2RlLCByZWFzb25dKTtcbn07XG5cbnV0aWxzLnVzZXJTZXRDb2RlID0gZnVuY3Rpb24gKGNvZGUpIHtcbiAgICByZXR1cm4gY29kZSA9PT0gMTAwMCB8fCAoY29kZSA+PSAzMDAwICYmIGNvZGUgPD0gNDk5OSk7XG59O1xuXG4vLyBTZWU6IGh0dHA6Ly93d3cuZXJnLmFiZG4uYWMudWsvfmdlcnJpdC9kY2NwL25vdGVzL2NjaWQyL3J0b19lc3RpbWF0b3IvXG4vLyBhbmQgUkZDIDI5ODguXG51dGlscy5jb3VudFJUTyA9IGZ1bmN0aW9uIChydHQpIHtcbiAgICB2YXIgcnRvO1xuICAgIGlmIChydHQgPiAxMDApIHtcbiAgICAgICAgcnRvID0gMyAqIHJ0dDsgLy8gcnRvID4gMzAwbXNlY1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJ0byA9IHJ0dCArIDIwMDsgLy8gMjAwbXNlYyA8IHJ0byA8PSAzMDBtc2VjXG4gICAgfVxuICAgIHJldHVybiBydG87XG59XG5cbnV0aWxzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChfd2luZG93LmNvbnNvbGUgJiYgY29uc29sZS5sb2cgJiYgY29uc29sZS5sb2cuYXBwbHkpIHtcbiAgICAgICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgICB9XG59O1xuXG51dGlscy5iaW5kID0gZnVuY3Rpb24oZnVuLCB0aGF0KSB7XG4gICAgaWYgKGZ1bi5iaW5kKSB7XG4gICAgICAgIHJldHVybiBmdW4uYmluZCh0aGF0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuLmFwcGx5KHRoYXQsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfVxufTtcblxudXRpbHMuZmxhdFVybCA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHJldHVybiB1cmwuaW5kZXhPZignPycpID09PSAtMSAmJiB1cmwuaW5kZXhPZignIycpID09PSAtMTtcbn07XG5cbnV0aWxzLmFtZW5kVXJsID0gZnVuY3Rpb24odXJsKSB7XG4gICAgdmFyIGRsID0gX2RvY3VtZW50LmxvY2F0aW9uO1xuICAgIGlmICghdXJsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignV3JvbmcgdXJsIGZvciBTb2NrSlMnKTtcbiAgICB9XG4gICAgaWYgKCF1dGlscy5mbGF0VXJsKHVybCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IGJhc2ljIHVybHMgYXJlIHN1cHBvcnRlZCBpbiBTb2NrSlMnKTtcbiAgICB9XG5cbiAgICAvLyAgJy8vYWJjJyAtLT4gJ2h0dHA6Ly9hYmMnXG4gICAgaWYgKHVybC5pbmRleE9mKCcvLycpID09PSAwKSB7XG4gICAgICAgIHVybCA9IGRsLnByb3RvY29sICsgdXJsO1xuICAgIH1cbiAgICAvLyAnL2FiYycgLS0+ICdodHRwOi8vbG9jYWxob3N0OjgwL2FiYydcbiAgICBpZiAodXJsLmluZGV4T2YoJy8nKSA9PT0gMCkge1xuICAgICAgICB1cmwgPSBkbC5wcm90b2NvbCArICcvLycgKyBkbC5ob3N0ICsgdXJsO1xuICAgIH1cbiAgICAvLyBzdHJpcCB0cmFpbGluZyBzbGFzaGVzXG4gICAgdXJsID0gdXJsLnJlcGxhY2UoL1svXSskLywnJyk7XG4gICAgcmV0dXJuIHVybDtcbn07XG5cbi8vIElFIGRvZXNuJ3Qgc3VwcG9ydCBbXS5pbmRleE9mLlxudXRpbHMuYXJySW5kZXhPZiA9IGZ1bmN0aW9uKGFyciwgb2JqKXtcbiAgICBmb3IodmFyIGk9MDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7XG4gICAgICAgIGlmKGFycltpXSA9PT0gb2JqKXtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn07XG5cbnV0aWxzLmFyclNraXAgPSBmdW5jdGlvbihhcnIsIG9iaikge1xuICAgIHZhciBpZHggPSB1dGlscy5hcnJJbmRleE9mKGFyciwgb2JqKTtcbiAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICByZXR1cm4gYXJyLnNsaWNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGRzdCA9IGFyci5zbGljZSgwLCBpZHgpO1xuICAgICAgICByZXR1cm4gZHN0LmNvbmNhdChhcnIuc2xpY2UoaWR4KzEpKTtcbiAgICB9XG59O1xuXG4vLyBWaWE6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tLzExMzMxMjIvMjEyMWM2MDFjNTU0OTE1NTQ4M2Y1MGJlM2RhNTMwNWU4M2I4YzVkZlxudXRpbHMuaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4ge30udG9TdHJpbmcuY2FsbCh2YWx1ZSkuaW5kZXhPZignQXJyYXknKSA+PSAwXG59O1xuXG51dGlscy5kZWxheSA9IGZ1bmN0aW9uKHQsIGZ1bikge1xuICAgIGlmKHR5cGVvZiB0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGZ1biA9IHQ7XG4gICAgICAgIHQgPSAwO1xuICAgIH1cbiAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIHQpO1xufTtcblxuXG4vLyBDaGFycyB3b3J0aCBlc2NhcGluZywgYXMgZGVmaW5lZCBieSBEb3VnbGFzIENyb2NrZm9yZDpcbi8vICAgaHR0cHM6Ly9naXRodWIuY29tL2RvdWdsYXNjcm9ja2ZvcmQvSlNPTi1qcy9ibG9iLzQ3YTk4ODJjZGRlYjFlODUyOWUwN2FmOTczNjIxODA3NTM3MmI4YWMvanNvbjIuanMjTDE5NlxudmFyIGpzb25fZXNjYXBhYmxlID0gL1tcXFxcXFxcIlxceDAwLVxceDFmXFx4N2YtXFx4OWZcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxcbiAgICBqc29uX2xvb2t1cCA9IHtcblwiXFx1MDAwMFwiOlwiXFxcXHUwMDAwXCIsXCJcXHUwMDAxXCI6XCJcXFxcdTAwMDFcIixcIlxcdTAwMDJcIjpcIlxcXFx1MDAwMlwiLFwiXFx1MDAwM1wiOlwiXFxcXHUwMDAzXCIsXG5cIlxcdTAwMDRcIjpcIlxcXFx1MDAwNFwiLFwiXFx1MDAwNVwiOlwiXFxcXHUwMDA1XCIsXCJcXHUwMDA2XCI6XCJcXFxcdTAwMDZcIixcIlxcdTAwMDdcIjpcIlxcXFx1MDAwN1wiLFxuXCJcXGJcIjpcIlxcXFxiXCIsXCJcXHRcIjpcIlxcXFx0XCIsXCJcXG5cIjpcIlxcXFxuXCIsXCJcXHUwMDBiXCI6XCJcXFxcdTAwMGJcIixcIlxcZlwiOlwiXFxcXGZcIixcIlxcclwiOlwiXFxcXHJcIixcblwiXFx1MDAwZVwiOlwiXFxcXHUwMDBlXCIsXCJcXHUwMDBmXCI6XCJcXFxcdTAwMGZcIixcIlxcdTAwMTBcIjpcIlxcXFx1MDAxMFwiLFwiXFx1MDAxMVwiOlwiXFxcXHUwMDExXCIsXG5cIlxcdTAwMTJcIjpcIlxcXFx1MDAxMlwiLFwiXFx1MDAxM1wiOlwiXFxcXHUwMDEzXCIsXCJcXHUwMDE0XCI6XCJcXFxcdTAwMTRcIixcIlxcdTAwMTVcIjpcIlxcXFx1MDAxNVwiLFxuXCJcXHUwMDE2XCI6XCJcXFxcdTAwMTZcIixcIlxcdTAwMTdcIjpcIlxcXFx1MDAxN1wiLFwiXFx1MDAxOFwiOlwiXFxcXHUwMDE4XCIsXCJcXHUwMDE5XCI6XCJcXFxcdTAwMTlcIixcblwiXFx1MDAxYVwiOlwiXFxcXHUwMDFhXCIsXCJcXHUwMDFiXCI6XCJcXFxcdTAwMWJcIixcIlxcdTAwMWNcIjpcIlxcXFx1MDAxY1wiLFwiXFx1MDAxZFwiOlwiXFxcXHUwMDFkXCIsXG5cIlxcdTAwMWVcIjpcIlxcXFx1MDAxZVwiLFwiXFx1MDAxZlwiOlwiXFxcXHUwMDFmXCIsXCJcXFwiXCI6XCJcXFxcXFxcIlwiLFwiXFxcXFwiOlwiXFxcXFxcXFxcIixcblwiXFx1MDA3ZlwiOlwiXFxcXHUwMDdmXCIsXCJcXHUwMDgwXCI6XCJcXFxcdTAwODBcIixcIlxcdTAwODFcIjpcIlxcXFx1MDA4MVwiLFwiXFx1MDA4MlwiOlwiXFxcXHUwMDgyXCIsXG5cIlxcdTAwODNcIjpcIlxcXFx1MDA4M1wiLFwiXFx1MDA4NFwiOlwiXFxcXHUwMDg0XCIsXCJcXHUwMDg1XCI6XCJcXFxcdTAwODVcIixcIlxcdTAwODZcIjpcIlxcXFx1MDA4NlwiLFxuXCJcXHUwMDg3XCI6XCJcXFxcdTAwODdcIixcIlxcdTAwODhcIjpcIlxcXFx1MDA4OFwiLFwiXFx1MDA4OVwiOlwiXFxcXHUwMDg5XCIsXCJcXHUwMDhhXCI6XCJcXFxcdTAwOGFcIixcblwiXFx1MDA4YlwiOlwiXFxcXHUwMDhiXCIsXCJcXHUwMDhjXCI6XCJcXFxcdTAwOGNcIixcIlxcdTAwOGRcIjpcIlxcXFx1MDA4ZFwiLFwiXFx1MDA4ZVwiOlwiXFxcXHUwMDhlXCIsXG5cIlxcdTAwOGZcIjpcIlxcXFx1MDA4ZlwiLFwiXFx1MDA5MFwiOlwiXFxcXHUwMDkwXCIsXCJcXHUwMDkxXCI6XCJcXFxcdTAwOTFcIixcIlxcdTAwOTJcIjpcIlxcXFx1MDA5MlwiLFxuXCJcXHUwMDkzXCI6XCJcXFxcdTAwOTNcIixcIlxcdTAwOTRcIjpcIlxcXFx1MDA5NFwiLFwiXFx1MDA5NVwiOlwiXFxcXHUwMDk1XCIsXCJcXHUwMDk2XCI6XCJcXFxcdTAwOTZcIixcblwiXFx1MDA5N1wiOlwiXFxcXHUwMDk3XCIsXCJcXHUwMDk4XCI6XCJcXFxcdTAwOThcIixcIlxcdTAwOTlcIjpcIlxcXFx1MDA5OVwiLFwiXFx1MDA5YVwiOlwiXFxcXHUwMDlhXCIsXG5cIlxcdTAwOWJcIjpcIlxcXFx1MDA5YlwiLFwiXFx1MDA5Y1wiOlwiXFxcXHUwMDljXCIsXCJcXHUwMDlkXCI6XCJcXFxcdTAwOWRcIixcIlxcdTAwOWVcIjpcIlxcXFx1MDA5ZVwiLFxuXCJcXHUwMDlmXCI6XCJcXFxcdTAwOWZcIixcIlxcdTAwYWRcIjpcIlxcXFx1MDBhZFwiLFwiXFx1MDYwMFwiOlwiXFxcXHUwNjAwXCIsXCJcXHUwNjAxXCI6XCJcXFxcdTA2MDFcIixcblwiXFx1MDYwMlwiOlwiXFxcXHUwNjAyXCIsXCJcXHUwNjAzXCI6XCJcXFxcdTA2MDNcIixcIlxcdTA2MDRcIjpcIlxcXFx1MDYwNFwiLFwiXFx1MDcwZlwiOlwiXFxcXHUwNzBmXCIsXG5cIlxcdTE3YjRcIjpcIlxcXFx1MTdiNFwiLFwiXFx1MTdiNVwiOlwiXFxcXHUxN2I1XCIsXCJcXHUyMDBjXCI6XCJcXFxcdTIwMGNcIixcIlxcdTIwMGRcIjpcIlxcXFx1MjAwZFwiLFxuXCJcXHUyMDBlXCI6XCJcXFxcdTIwMGVcIixcIlxcdTIwMGZcIjpcIlxcXFx1MjAwZlwiLFwiXFx1MjAyOFwiOlwiXFxcXHUyMDI4XCIsXCJcXHUyMDI5XCI6XCJcXFxcdTIwMjlcIixcblwiXFx1MjAyYVwiOlwiXFxcXHUyMDJhXCIsXCJcXHUyMDJiXCI6XCJcXFxcdTIwMmJcIixcIlxcdTIwMmNcIjpcIlxcXFx1MjAyY1wiLFwiXFx1MjAyZFwiOlwiXFxcXHUyMDJkXCIsXG5cIlxcdTIwMmVcIjpcIlxcXFx1MjAyZVwiLFwiXFx1MjAyZlwiOlwiXFxcXHUyMDJmXCIsXCJcXHUyMDYwXCI6XCJcXFxcdTIwNjBcIixcIlxcdTIwNjFcIjpcIlxcXFx1MjA2MVwiLFxuXCJcXHUyMDYyXCI6XCJcXFxcdTIwNjJcIixcIlxcdTIwNjNcIjpcIlxcXFx1MjA2M1wiLFwiXFx1MjA2NFwiOlwiXFxcXHUyMDY0XCIsXCJcXHUyMDY1XCI6XCJcXFxcdTIwNjVcIixcblwiXFx1MjA2NlwiOlwiXFxcXHUyMDY2XCIsXCJcXHUyMDY3XCI6XCJcXFxcdTIwNjdcIixcIlxcdTIwNjhcIjpcIlxcXFx1MjA2OFwiLFwiXFx1MjA2OVwiOlwiXFxcXHUyMDY5XCIsXG5cIlxcdTIwNmFcIjpcIlxcXFx1MjA2YVwiLFwiXFx1MjA2YlwiOlwiXFxcXHUyMDZiXCIsXCJcXHUyMDZjXCI6XCJcXFxcdTIwNmNcIixcIlxcdTIwNmRcIjpcIlxcXFx1MjA2ZFwiLFxuXCJcXHUyMDZlXCI6XCJcXFxcdTIwNmVcIixcIlxcdTIwNmZcIjpcIlxcXFx1MjA2ZlwiLFwiXFx1ZmVmZlwiOlwiXFxcXHVmZWZmXCIsXCJcXHVmZmYwXCI6XCJcXFxcdWZmZjBcIixcblwiXFx1ZmZmMVwiOlwiXFxcXHVmZmYxXCIsXCJcXHVmZmYyXCI6XCJcXFxcdWZmZjJcIixcIlxcdWZmZjNcIjpcIlxcXFx1ZmZmM1wiLFwiXFx1ZmZmNFwiOlwiXFxcXHVmZmY0XCIsXG5cIlxcdWZmZjVcIjpcIlxcXFx1ZmZmNVwiLFwiXFx1ZmZmNlwiOlwiXFxcXHVmZmY2XCIsXCJcXHVmZmY3XCI6XCJcXFxcdWZmZjdcIixcIlxcdWZmZjhcIjpcIlxcXFx1ZmZmOFwiLFxuXCJcXHVmZmY5XCI6XCJcXFxcdWZmZjlcIixcIlxcdWZmZmFcIjpcIlxcXFx1ZmZmYVwiLFwiXFx1ZmZmYlwiOlwiXFxcXHVmZmZiXCIsXCJcXHVmZmZjXCI6XCJcXFxcdWZmZmNcIixcblwiXFx1ZmZmZFwiOlwiXFxcXHVmZmZkXCIsXCJcXHVmZmZlXCI6XCJcXFxcdWZmZmVcIixcIlxcdWZmZmZcIjpcIlxcXFx1ZmZmZlwifTtcblxuLy8gU29tZSBleHRyYSBjaGFyYWN0ZXJzIHRoYXQgQ2hyb21lIGdldHMgd3JvbmcsIGFuZCBzdWJzdGl0dXRlcyB3aXRoXG4vLyBzb21ldGhpbmcgZWxzZSBvbiB0aGUgd2lyZS5cbnZhciBleHRyYV9lc2NhcGFibGUgPSAvW1xceDAwLVxceDFmXFx1ZDgwMC1cXHVkZmZmXFx1ZmZmZVxcdWZmZmZcXHUwMzAwLVxcdTAzMzNcXHUwMzNkLVxcdTAzNDZcXHUwMzRhLVxcdTAzNGNcXHUwMzUwLVxcdTAzNTJcXHUwMzU3LVxcdTAzNThcXHUwMzVjLVxcdTAzNjJcXHUwMzc0XFx1MDM3ZVxcdTAzODdcXHUwNTkxLVxcdTA1YWZcXHUwNWM0XFx1MDYxMC1cXHUwNjE3XFx1MDY1My1cXHUwNjU0XFx1MDY1Ny1cXHUwNjViXFx1MDY1ZC1cXHUwNjVlXFx1MDZkZi1cXHUwNmUyXFx1MDZlYi1cXHUwNmVjXFx1MDczMFxcdTA3MzItXFx1MDczM1xcdTA3MzUtXFx1MDczNlxcdTA3M2FcXHUwNzNkXFx1MDczZi1cXHUwNzQxXFx1MDc0M1xcdTA3NDVcXHUwNzQ3XFx1MDdlYi1cXHUwN2YxXFx1MDk1MVxcdTA5NTgtXFx1MDk1ZlxcdTA5ZGMtXFx1MDlkZFxcdTA5ZGZcXHUwYTMzXFx1MGEzNlxcdTBhNTktXFx1MGE1YlxcdTBhNWVcXHUwYjVjLVxcdTBiNWRcXHUwZTM4LVxcdTBlMzlcXHUwZjQzXFx1MGY0ZFxcdTBmNTJcXHUwZjU3XFx1MGY1Y1xcdTBmNjlcXHUwZjcyLVxcdTBmNzZcXHUwZjc4XFx1MGY4MC1cXHUwZjgzXFx1MGY5M1xcdTBmOWRcXHUwZmEyXFx1MGZhN1xcdTBmYWNcXHUwZmI5XFx1MTkzOS1cXHUxOTNhXFx1MWExN1xcdTFiNmJcXHUxY2RhLVxcdTFjZGJcXHUxZGMwLVxcdTFkY2ZcXHUxZGZjXFx1MWRmZVxcdTFmNzFcXHUxZjczXFx1MWY3NVxcdTFmNzdcXHUxZjc5XFx1MWY3YlxcdTFmN2RcXHUxZmJiXFx1MWZiZVxcdTFmYzlcXHUxZmNiXFx1MWZkM1xcdTFmZGJcXHUxZmUzXFx1MWZlYlxcdTFmZWUtXFx1MWZlZlxcdTFmZjlcXHUxZmZiXFx1MWZmZFxcdTIwMDAtXFx1MjAwMVxcdTIwZDAtXFx1MjBkMVxcdTIwZDQtXFx1MjBkN1xcdTIwZTctXFx1MjBlOVxcdTIxMjZcXHUyMTJhLVxcdTIxMmJcXHUyMzI5LVxcdTIzMmFcXHUyYWRjXFx1MzAyYi1cXHUzMDJjXFx1YWFiMi1cXHVhYWIzXFx1ZjkwMC1cXHVmYTBkXFx1ZmExMFxcdWZhMTJcXHVmYTE1LVxcdWZhMWVcXHVmYTIwXFx1ZmEyMlxcdWZhMjUtXFx1ZmEyNlxcdWZhMmEtXFx1ZmEyZFxcdWZhMzAtXFx1ZmE2ZFxcdWZhNzAtXFx1ZmFkOVxcdWZiMWRcXHVmYjFmXFx1ZmIyYS1cXHVmYjM2XFx1ZmIzOC1cXHVmYjNjXFx1ZmIzZVxcdWZiNDAtXFx1ZmI0MVxcdWZiNDMtXFx1ZmI0NFxcdWZiNDYtXFx1ZmI0ZVxcdWZmZjAtXFx1ZmZmZl0vZyxcbiAgICBleHRyYV9sb29rdXA7XG5cbi8vIEpTT04gUXVvdGUgc3RyaW5nLiBVc2UgbmF0aXZlIGltcGxlbWVudGF0aW9uIHdoZW4gcG9zc2libGUuXG52YXIgSlNPTlF1b3RlID0gKEpTT04gJiYgSlNPTi5zdHJpbmdpZnkpIHx8IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIGpzb25fZXNjYXBhYmxlLmxhc3RJbmRleCA9IDA7XG4gICAgaWYgKGpzb25fZXNjYXBhYmxlLnRlc3Qoc3RyaW5nKSkge1xuICAgICAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZShqc29uX2VzY2FwYWJsZSwgZnVuY3Rpb24oYSkge1xuICAgICAgICAgICAgcmV0dXJuIGpzb25fbG9va3VwW2FdO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuICdcIicgKyBzdHJpbmcgKyAnXCInO1xufTtcblxuLy8gVGhpcyBtYXkgYmUgcXVpdGUgc2xvdywgc28gbGV0J3MgZGVsYXkgdW50aWwgdXNlciBhY3R1YWxseSB1c2VzIGJhZFxuLy8gY2hhcmFjdGVycy5cbnZhciB1bnJvbGxfbG9va3VwID0gZnVuY3Rpb24oZXNjYXBhYmxlKSB7XG4gICAgdmFyIGk7XG4gICAgdmFyIHVucm9sbGVkID0ge31cbiAgICB2YXIgYyA9IFtdXG4gICAgZm9yKGk9MDsgaTw2NTUzNjsgaSsrKSB7XG4gICAgICAgIGMucHVzaCggU3RyaW5nLmZyb21DaGFyQ29kZShpKSApO1xuICAgIH1cbiAgICBlc2NhcGFibGUubGFzdEluZGV4ID0gMDtcbiAgICBjLmpvaW4oJycpLnJlcGxhY2UoZXNjYXBhYmxlLCBmdW5jdGlvbiAoYSkge1xuICAgICAgICB1bnJvbGxlZFsgYSBdID0gJ1xcXFx1JyArICgnMDAwMCcgKyBhLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCk7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9KTtcbiAgICBlc2NhcGFibGUubGFzdEluZGV4ID0gMDtcbiAgICByZXR1cm4gdW5yb2xsZWQ7XG59O1xuXG4vLyBRdW90ZSBzdHJpbmcsIGFsc28gdGFraW5nIGNhcmUgb2YgdW5pY29kZSBjaGFyYWN0ZXJzIHRoYXQgYnJvd3NlcnNcbi8vIG9mdGVuIGJyZWFrLiBFc3BlY2lhbGx5LCB0YWtlIGNhcmUgb2YgdW5pY29kZSBzdXJyb2dhdGVzOlxuLy8gICAgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NYXBwaW5nX29mX1VuaWNvZGVfY2hhcmFjdGVycyNTdXJyb2dhdGVzXG51dGlscy5xdW90ZSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHZhciBxdW90ZWQgPSBKU09OUXVvdGUoc3RyaW5nKTtcblxuICAgIC8vIEluIG1vc3QgY2FzZXMgdGhpcyBzaG91bGQgYmUgdmVyeSBmYXN0IGFuZCBnb29kIGVub3VnaC5cbiAgICBleHRyYV9lc2NhcGFibGUubGFzdEluZGV4ID0gMDtcbiAgICBpZighZXh0cmFfZXNjYXBhYmxlLnRlc3QocXVvdGVkKSkge1xuICAgICAgICByZXR1cm4gcXVvdGVkO1xuICAgIH1cblxuICAgIGlmKCFleHRyYV9sb29rdXApIGV4dHJhX2xvb2t1cCA9IHVucm9sbF9sb29rdXAoZXh0cmFfZXNjYXBhYmxlKTtcblxuICAgIHJldHVybiBxdW90ZWQucmVwbGFjZShleHRyYV9lc2NhcGFibGUsIGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgcmV0dXJuIGV4dHJhX2xvb2t1cFthXTtcbiAgICB9KTtcbn1cblxudmFyIF9hbGxfcHJvdG9jb2xzID0gWyd3ZWJzb2NrZXQnLFxuICAgICAgICAgICAgICAgICAgICAgICd4ZHItc3RyZWFtaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAneGhyLXN0cmVhbWluZycsXG4gICAgICAgICAgICAgICAgICAgICAgJ2lmcmFtZS1ldmVudHNvdXJjZScsXG4gICAgICAgICAgICAgICAgICAgICAgJ2lmcmFtZS1odG1sZmlsZScsXG4gICAgICAgICAgICAgICAgICAgICAgJ3hkci1wb2xsaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAneGhyLXBvbGxpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICdpZnJhbWUteGhyLXBvbGxpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICdqc29ucC1wb2xsaW5nJ107XG5cbnV0aWxzLnByb2JlUHJvdG9jb2xzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHByb2JlZCA9IHt9O1xuICAgIGZvcih2YXIgaT0wOyBpPF9hbGxfcHJvdG9jb2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwcm90b2NvbCA9IF9hbGxfcHJvdG9jb2xzW2ldO1xuICAgICAgICAvLyBVc2VyIGNhbiBoYXZlIGEgdHlwbyBpbiBwcm90b2NvbCBuYW1lLlxuICAgICAgICBwcm9iZWRbcHJvdG9jb2xdID0gU29ja0pTW3Byb3RvY29sXSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgU29ja0pTW3Byb3RvY29sXS5lbmFibGVkKCk7XG4gICAgfVxuICAgIHJldHVybiBwcm9iZWQ7XG59O1xuXG51dGlscy5kZXRlY3RQcm90b2NvbHMgPSBmdW5jdGlvbihwcm9iZWQsIHByb3RvY29sc193aGl0ZWxpc3QsIGluZm8pIHtcbiAgICB2YXIgcGUgPSB7fSxcbiAgICAgICAgcHJvdG9jb2xzID0gW107XG4gICAgaWYgKCFwcm90b2NvbHNfd2hpdGVsaXN0KSBwcm90b2NvbHNfd2hpdGVsaXN0ID0gX2FsbF9wcm90b2NvbHM7XG4gICAgZm9yKHZhciBpPTA7IGk8cHJvdG9jb2xzX3doaXRlbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcHJvdG9jb2wgPSBwcm90b2NvbHNfd2hpdGVsaXN0W2ldO1xuICAgICAgICBwZVtwcm90b2NvbF0gPSBwcm9iZWRbcHJvdG9jb2xdO1xuICAgIH1cbiAgICB2YXIgbWF5YmVfcHVzaCA9IGZ1bmN0aW9uKHByb3Rvcykge1xuICAgICAgICB2YXIgcHJvdG8gPSBwcm90b3Muc2hpZnQoKTtcbiAgICAgICAgaWYgKHBlW3Byb3RvXSkge1xuICAgICAgICAgICAgcHJvdG9jb2xzLnB1c2gocHJvdG8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHByb3Rvcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbWF5YmVfcHVzaChwcm90b3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gMS4gV2Vic29ja2V0XG4gICAgaWYgKGluZm8ud2Vic29ja2V0ICE9PSBmYWxzZSkge1xuICAgICAgICBtYXliZV9wdXNoKFsnd2Vic29ja2V0J10pO1xuICAgIH1cblxuICAgIC8vIDIuIFN0cmVhbWluZ1xuICAgIGlmIChwZVsneGhyLXN0cmVhbWluZyddICYmICFpbmZvLm51bGxfb3JpZ2luKSB7XG4gICAgICAgIHByb3RvY29scy5wdXNoKCd4aHItc3RyZWFtaW5nJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBlWyd4ZHItc3RyZWFtaW5nJ10gJiYgIWluZm8uY29va2llX25lZWRlZCAmJiAhaW5mby5udWxsX29yaWdpbikge1xuICAgICAgICAgICAgcHJvdG9jb2xzLnB1c2goJ3hkci1zdHJlYW1pbmcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1heWJlX3B1c2goWydpZnJhbWUtZXZlbnRzb3VyY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2lmcmFtZS1odG1sZmlsZSddKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIDMuIFBvbGxpbmdcbiAgICBpZiAocGVbJ3hoci1wb2xsaW5nJ10gJiYgIWluZm8ubnVsbF9vcmlnaW4pIHtcbiAgICAgICAgcHJvdG9jb2xzLnB1c2goJ3hoci1wb2xsaW5nJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBlWyd4ZHItcG9sbGluZyddICYmICFpbmZvLmNvb2tpZV9uZWVkZWQgJiYgIWluZm8ubnVsbF9vcmlnaW4pIHtcbiAgICAgICAgICAgIHByb3RvY29scy5wdXNoKCd4ZHItcG9sbGluZycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWF5YmVfcHVzaChbJ2lmcmFtZS14aHItcG9sbGluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAnanNvbnAtcG9sbGluZyddKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHJvdG9jb2xzO1xufVxuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi91dGlscy5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvZG9tLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vLyBNYXkgYmUgdXNlZCBieSBodG1sZmlsZSBqc29ucCBhbmQgdHJhbnNwb3J0cy5cbnZhciBNUHJlZml4ID0gJ19zb2NranNfZ2xvYmFsJztcbnV0aWxzLmNyZWF0ZUhvb2sgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgd2luZG93X2lkID0gJ2EnICsgdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICBpZiAoIShNUHJlZml4IGluIF93aW5kb3cpKSB7XG4gICAgICAgIHZhciBtYXAgPSB7fTtcbiAgICAgICAgX3dpbmRvd1tNUHJlZml4XSA9IGZ1bmN0aW9uKHdpbmRvd19pZCkge1xuICAgICAgICAgICAgaWYgKCEod2luZG93X2lkIGluIG1hcCkpIHtcbiAgICAgICAgICAgICAgICBtYXBbd2luZG93X2lkXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHdpbmRvd19pZCxcbiAgICAgICAgICAgICAgICAgICAgZGVsOiBmdW5jdGlvbigpIHtkZWxldGUgbWFwW3dpbmRvd19pZF07fVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWFwW3dpbmRvd19pZF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF93aW5kb3dbTVByZWZpeF0od2luZG93X2lkKTtcbn07XG5cblxuXG51dGlscy5hdHRhY2hNZXNzYWdlID0gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICB1dGlscy5hdHRhY2hFdmVudCgnbWVzc2FnZScsIGxpc3RlbmVyKTtcbn07XG51dGlscy5hdHRhY2hFdmVudCA9IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgX3dpbmRvdy5hZGRFdmVudExpc3RlbmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBfd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSUUgcXVpcmtzLlxuICAgICAgICAvLyBBY2NvcmRpbmcgdG86IGh0dHA6Ly9zdGV2ZXNvdWRlcnMuY29tL21pc2MvdGVzdC1wb3N0bWVzc2FnZS5waHBcbiAgICAgICAgLy8gdGhlIG1lc3NhZ2UgZ2V0cyBkZWxpdmVyZWQgb25seSB0byAnZG9jdW1lbnQnLCBub3QgJ3dpbmRvdycuXG4gICAgICAgIF9kb2N1bWVudC5hdHRhY2hFdmVudChcIm9uXCIgKyBldmVudCwgbGlzdGVuZXIpO1xuICAgICAgICAvLyBJIGdldCAnd2luZG93JyBmb3IgaWU4LlxuICAgICAgICBfd2luZG93LmF0dGFjaEV2ZW50KFwib25cIiArIGV2ZW50LCBsaXN0ZW5lcik7XG4gICAgfVxufTtcblxudXRpbHMuZGV0YWNoTWVzc2FnZSA9IGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgdXRpbHMuZGV0YWNoRXZlbnQoJ21lc3NhZ2UnLCBsaXN0ZW5lcik7XG59O1xudXRpbHMuZGV0YWNoRXZlbnQgPSBmdW5jdGlvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIF93aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgX3dpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lciwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIF9kb2N1bWVudC5kZXRhY2hFdmVudChcIm9uXCIgKyBldmVudCwgbGlzdGVuZXIpO1xuICAgICAgICBfd2luZG93LmRldGFjaEV2ZW50KFwib25cIiArIGV2ZW50LCBsaXN0ZW5lcik7XG4gICAgfVxufTtcblxuXG52YXIgb25fdW5sb2FkID0ge307XG4vLyBUaGluZ3MgcmVnaXN0ZXJlZCBhZnRlciBiZWZvcmV1bmxvYWQgYXJlIHRvIGJlIGNhbGxlZCBpbW1lZGlhdGVseS5cbnZhciBhZnRlcl91bmxvYWQgPSBmYWxzZTtcblxudmFyIHRyaWdnZXJfdW5sb2FkX2NhbGxiYWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIGZvcih2YXIgcmVmIGluIG9uX3VubG9hZCkge1xuICAgICAgICBvbl91bmxvYWRbcmVmXSgpO1xuICAgICAgICBkZWxldGUgb25fdW5sb2FkW3JlZl07XG4gICAgfTtcbn07XG5cbnZhciB1bmxvYWRfdHJpZ2dlcmVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYoYWZ0ZXJfdW5sb2FkKSByZXR1cm47XG4gICAgYWZ0ZXJfdW5sb2FkID0gdHJ1ZTtcbiAgICB0cmlnZ2VyX3VubG9hZF9jYWxsYmFja3MoKTtcbn07XG5cbi8vIE9uYmVmb3JldW5sb2FkIGFsb25lIGlzIG5vdCByZWxpYWJsZS4gV2UgY291bGQgdXNlIG9ubHkgJ3VubG9hZCdcbi8vIGJ1dCBpdCdzIG5vdCB3b3JraW5nIGluIG9wZXJhIHdpdGhpbiBhbiBpZnJhbWUuIExldCdzIHVzZSBib3RoLlxudXRpbHMuYXR0YWNoRXZlbnQoJ2JlZm9yZXVubG9hZCcsIHVubG9hZF90cmlnZ2VyZWQpO1xudXRpbHMuYXR0YWNoRXZlbnQoJ3VubG9hZCcsIHVubG9hZF90cmlnZ2VyZWQpO1xuXG51dGlscy51bmxvYWRfYWRkID0gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICB2YXIgcmVmID0gdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICBvbl91bmxvYWRbcmVmXSA9IGxpc3RlbmVyO1xuICAgIGlmIChhZnRlcl91bmxvYWQpIHtcbiAgICAgICAgdXRpbHMuZGVsYXkodHJpZ2dlcl91bmxvYWRfY2FsbGJhY2tzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlZjtcbn07XG51dGlscy51bmxvYWRfZGVsID0gZnVuY3Rpb24ocmVmKSB7XG4gICAgaWYgKHJlZiBpbiBvbl91bmxvYWQpXG4gICAgICAgIGRlbGV0ZSBvbl91bmxvYWRbcmVmXTtcbn07XG5cblxudXRpbHMuY3JlYXRlSWZyYW1lID0gZnVuY3Rpb24gKGlmcmFtZV91cmwsIGVycm9yX2NhbGxiYWNrKSB7XG4gICAgdmFyIGlmcmFtZSA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICB2YXIgdHJlZiwgdW5sb2FkX3JlZjtcbiAgICB2YXIgdW5hdHRhY2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRyZWYpO1xuICAgICAgICAvLyBFeHBsb3JlciBoYWQgcHJvYmxlbXMgd2l0aCB0aGF0LlxuICAgICAgICB0cnkge2lmcmFtZS5vbmxvYWQgPSBudWxsO30gY2F0Y2ggKHgpIHt9XG4gICAgICAgIGlmcmFtZS5vbmVycm9yID0gbnVsbDtcbiAgICB9O1xuICAgIHZhciBjbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChpZnJhbWUpIHtcbiAgICAgICAgICAgIHVuYXR0YWNoKCk7XG4gICAgICAgICAgICAvLyBUaGlzIHRpbWVvdXQgbWFrZXMgY2hyb21lIGZpcmUgb25iZWZvcmV1bmxvYWQgZXZlbnRcbiAgICAgICAgICAgIC8vIHdpdGhpbiBpZnJhbWUuIFdpdGhvdXQgdGhlIHRpbWVvdXQgaXQgZ29lcyBzdHJhaWdodCB0b1xuICAgICAgICAgICAgLy8gb251bmxvYWQuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmKGlmcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpZnJhbWUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpZnJhbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZnJhbWUgPSBudWxsO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB1dGlscy51bmxvYWRfZGVsKHVubG9hZF9yZWYpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgb25lcnJvciA9IGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgaWYgKGlmcmFtZSkge1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgZXJyb3JfY2FsbGJhY2socik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciBwb3N0ID0gZnVuY3Rpb24obXNnLCBvcmlnaW4pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGlmcmFtZSBpcyBub3QgbG9hZGVkLCBJRSByYWlzZXMgYW4gZXhjZXB0aW9uXG4gICAgICAgICAgICAvLyBvbiAnY29udGVudFdpbmRvdycuXG4gICAgICAgICAgICBpZiAoaWZyYW1lICYmIGlmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICAgICAgaWZyYW1lLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UobXNnLCBvcmlnaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoICh4KSB7fTtcbiAgICB9O1xuXG4gICAgaWZyYW1lLnNyYyA9IGlmcmFtZV91cmw7XG4gICAgaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgaWZyYW1lLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBpZnJhbWUub25lcnJvciA9IGZ1bmN0aW9uKCl7b25lcnJvcignb25lcnJvcicpO307XG4gICAgaWZyYW1lLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBgb25sb2FkYCBpcyB0cmlnZ2VyZWQgYmVmb3JlIHNjcmlwdHMgb24gdGhlIGlmcmFtZSBhcmVcbiAgICAgICAgLy8gZXhlY3V0ZWQuIEdpdmUgaXQgZmV3IHNlY29uZHMgdG8gYWN0dWFsbHkgbG9hZCBzdHVmZi5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRyZWYpO1xuICAgICAgICB0cmVmID0gc2V0VGltZW91dChmdW5jdGlvbigpe29uZXJyb3IoJ29ubG9hZCB0aW1lb3V0Jyk7fSwgMjAwMCk7XG4gICAgfTtcbiAgICBfZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgIHRyZWYgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7b25lcnJvcigndGltZW91dCcpO30sIDE1MDAwKTtcbiAgICB1bmxvYWRfcmVmID0gdXRpbHMudW5sb2FkX2FkZChjbGVhbnVwKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwb3N0OiBwb3N0LFxuICAgICAgICBjbGVhbnVwOiBjbGVhbnVwLFxuICAgICAgICBsb2FkZWQ6IHVuYXR0YWNoXG4gICAgfTtcbn07XG5cbnV0aWxzLmNyZWF0ZUh0bWxmaWxlID0gZnVuY3Rpb24gKGlmcmFtZV91cmwsIGVycm9yX2NhbGxiYWNrKSB7XG4gICAgdmFyIGRvYyA9IG5ldyBBY3RpdmVYT2JqZWN0KCdodG1sZmlsZScpO1xuICAgIHZhciB0cmVmLCB1bmxvYWRfcmVmO1xuICAgIHZhciBpZnJhbWU7XG4gICAgdmFyIHVuYXR0YWNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0cmVmKTtcbiAgICB9O1xuICAgIHZhciBjbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChkb2MpIHtcbiAgICAgICAgICAgIHVuYXR0YWNoKCk7XG4gICAgICAgICAgICB1dGlscy51bmxvYWRfZGVsKHVubG9hZF9yZWYpO1xuICAgICAgICAgICAgaWZyYW1lLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICAgIGlmcmFtZSA9IGRvYyA9IG51bGw7XG4gICAgICAgICAgICBDb2xsZWN0R2FyYmFnZSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgb25lcnJvciA9IGZ1bmN0aW9uKHIpICB7XG4gICAgICAgIGlmIChkb2MpIHtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIGVycm9yX2NhbGxiYWNrKHIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgcG9zdCA9IGZ1bmN0aW9uKG1zZywgb3JpZ2luKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgbm90IGxvYWRlZCwgSUUgcmFpc2VzIGFuIGV4Y2VwdGlvblxuICAgICAgICAgICAgLy8gb24gJ2NvbnRlbnRXaW5kb3cnLlxuICAgICAgICAgICAgaWYgKGlmcmFtZSAmJiBpZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKG1zZywgb3JpZ2luKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoeCkge307XG4gICAgfTtcblxuICAgIGRvYy5vcGVuKCk7XG4gICAgZG9jLndyaXRlKCc8aHRtbD48cycgKyAnY3JpcHQ+JyArXG4gICAgICAgICAgICAgICdkb2N1bWVudC5kb21haW49XCInICsgZG9jdW1lbnQuZG9tYWluICsgJ1wiOycgK1xuICAgICAgICAgICAgICAnPC9zJyArICdjcmlwdD48L2h0bWw+Jyk7XG4gICAgZG9jLmNsb3NlKCk7XG4gICAgZG9jLnBhcmVudFdpbmRvd1tXUHJlZml4XSA9IF93aW5kb3dbV1ByZWZpeF07XG4gICAgdmFyIGMgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZG9jLmJvZHkuYXBwZW5kQ2hpbGQoYyk7XG4gICAgaWZyYW1lID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICAgIGMuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICBpZnJhbWUuc3JjID0gaWZyYW1lX3VybDtcbiAgICB0cmVmID0gc2V0VGltZW91dChmdW5jdGlvbigpe29uZXJyb3IoJ3RpbWVvdXQnKTt9LCAxNTAwMCk7XG4gICAgdW5sb2FkX3JlZiA9IHV0aWxzLnVubG9hZF9hZGQoY2xlYW51cCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcG9zdDogcG9zdCxcbiAgICAgICAgY2xlYW51cDogY2xlYW51cCxcbiAgICAgICAgbG9hZGVkOiB1bmF0dGFjaFxuICAgIH07XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9kb20uanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL2RvbTIuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBBYnN0cmFjdFhIUk9iamVjdCA9IGZ1bmN0aW9uKCl7fTtcbkFic3RyYWN0WEhST2JqZWN0LnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoWydjaHVuaycsICdmaW5pc2gnXSk7XG5cbkFic3RyYWN0WEhST2JqZWN0LnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbihtZXRob2QsIHVybCwgcGF5bG9hZCwgb3B0cykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRyeSB7XG4gICAgICAgIHRoYXQueGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgfSBjYXRjaCh4KSB7fTtcblxuICAgIGlmICghdGhhdC54aHIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoYXQueGhyID0gbmV3IF93aW5kb3cuQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTtcbiAgICAgICAgfSBjYXRjaCh4KSB7fTtcbiAgICB9XG4gICAgaWYgKF93aW5kb3cuQWN0aXZlWE9iamVjdCB8fCBfd2luZG93LlhEb21haW5SZXF1ZXN0KSB7XG4gICAgICAgIC8vIElFOCBjYWNoZXMgZXZlbiBQT1NUc1xuICAgICAgICB1cmwgKz0gKCh1cmwuaW5kZXhPZignPycpID09PSAtMSkgPyAnPycgOiAnJicpICsgJ3Q9JysoK25ldyBEYXRlKTtcbiAgICB9XG5cbiAgICAvLyBFeHBsb3JlciB0ZW5kcyB0byBrZWVwIGNvbm5lY3Rpb24gb3BlbiwgZXZlbiBhZnRlciB0aGVcbiAgICAvLyB0YWIgZ2V0cyBjbG9zZWQ6IGh0dHA6Ly9idWdzLmpxdWVyeS5jb20vdGlja2V0LzUyODBcbiAgICB0aGF0LnVubG9hZF9yZWYgPSB1dGlscy51bmxvYWRfYWRkKGZ1bmN0aW9uKCl7dGhhdC5fY2xlYW51cCh0cnVlKTt9KTtcbiAgICB0cnkge1xuICAgICAgICB0aGF0Lnhoci5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgLy8gSUUgcmFpc2VzIGFuIGV4Y2VwdGlvbiBvbiB3cm9uZyBwb3J0LlxuICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIDAsICcnKTtcbiAgICAgICAgdGhhdC5fY2xlYW51cCgpO1xuICAgICAgICByZXR1cm47XG4gICAgfTtcblxuICAgIGlmICghb3B0cyB8fCAhb3B0cy5ub19jcmVkZW50aWFscykge1xuICAgICAgICAvLyBNb3ppbGxhIGRvY3Mgc2F5cyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9YTUxIdHRwUmVxdWVzdCA6XG4gICAgICAgIC8vIFwiVGhpcyBuZXZlciBhZmZlY3RzIHNhbWUtc2l0ZSByZXF1ZXN0cy5cIlxuICAgICAgICB0aGF0Lnhoci53aXRoQ3JlZGVudGlhbHMgPSAndHJ1ZSc7XG4gICAgfVxuICAgIGlmIChvcHRzICYmIG9wdHMuaGVhZGVycykge1xuICAgICAgICBmb3IodmFyIGtleSBpbiBvcHRzLmhlYWRlcnMpIHtcbiAgICAgICAgICAgIHRoYXQueGhyLnNldFJlcXVlc3RIZWFkZXIoa2V5LCBvcHRzLmhlYWRlcnNba2V5XSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGF0Lnhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoYXQueGhyKSB7XG4gICAgICAgICAgICB2YXIgeCA9IHRoYXQueGhyO1xuICAgICAgICAgICAgc3dpdGNoICh4LnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAvLyBJRSBkb2Vzbid0IGxpa2UgcGVla2luZyBpbnRvIHJlc3BvbnNlVGV4dCBvciBzdGF0dXNcbiAgICAgICAgICAgICAgICAvLyBvbiBNaWNyb3NvZnQuWE1MSFRUUCBhbmQgcmVhZHlzdGF0ZT0zXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHguc3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IHgucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKHgpIHt9O1xuICAgICAgICAgICAgICAgIC8vIElFIGRvZXMgcmV0dXJuIHJlYWR5c3RhdGUgPT0gMyBmb3IgNDA0IGFuc3dlcnMuXG4gICAgICAgICAgICAgICAgaWYgKHRleHQgJiYgdGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZW1pdCgnY2h1bmsnLCBzdGF0dXMsIHRleHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIHguc3RhdHVzLCB4LnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgdGhhdC5fY2xlYW51cChmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoYXQueGhyLnNlbmQocGF5bG9hZCk7XG59O1xuXG5BYnN0cmFjdFhIUk9iamVjdC5wcm90b3R5cGUuX2NsZWFudXAgPSBmdW5jdGlvbihhYm9ydCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAoIXRoYXQueGhyKSByZXR1cm47XG4gICAgdXRpbHMudW5sb2FkX2RlbCh0aGF0LnVubG9hZF9yZWYpO1xuXG4gICAgLy8gSUUgbmVlZHMgdGhpcyBmaWVsZCB0byBiZSBhIGZ1bmN0aW9uXG4gICAgdGhhdC54aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKXt9O1xuXG4gICAgaWYgKGFib3J0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGF0Lnhoci5hYm9ydCgpO1xuICAgICAgICB9IGNhdGNoKHgpIHt9O1xuICAgIH1cbiAgICB0aGF0LnVubG9hZF9yZWYgPSB0aGF0LnhociA9IG51bGw7XG59O1xuXG5BYnN0cmFjdFhIUk9iamVjdC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5udWtlKCk7XG4gICAgdGhhdC5fY2xlYW51cCh0cnVlKTtcbn07XG5cbnZhciBYSFJDb3JzT2JqZWN0ID0gdXRpbHMuWEhSQ29yc09iamVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcbiAgICB1dGlscy5kZWxheShmdW5jdGlvbigpe3RoYXQuX3N0YXJ0LmFwcGx5KHRoYXQsIGFyZ3MpO30pO1xufTtcblhIUkNvcnNPYmplY3QucHJvdG90eXBlID0gbmV3IEFic3RyYWN0WEhST2JqZWN0KCk7XG5cbnZhciBYSFJMb2NhbE9iamVjdCA9IHV0aWxzLlhIUkxvY2FsT2JqZWN0ID0gZnVuY3Rpb24obWV0aG9kLCB1cmwsIHBheWxvYWQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdXRpbHMuZGVsYXkoZnVuY3Rpb24oKXtcbiAgICAgICAgdGhhdC5fc3RhcnQobWV0aG9kLCB1cmwsIHBheWxvYWQsIHtcbiAgICAgICAgICAgIG5vX2NyZWRlbnRpYWxzOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblhIUkxvY2FsT2JqZWN0LnByb3RvdHlwZSA9IG5ldyBBYnN0cmFjdFhIUk9iamVjdCgpO1xuXG5cblxuLy8gUmVmZXJlbmNlczpcbi8vICAgaHR0cDovL2FqYXhpYW4uY29tL2FyY2hpdmVzLzEwMC1saW5lLWFqYXgtd3JhcHBlclxuLy8gICBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvY2MyODgwNjAodj1WUy44NSkuYXNweFxudmFyIFhEUk9iamVjdCA9IHV0aWxzLlhEUk9iamVjdCA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBwYXlsb2FkKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHV0aWxzLmRlbGF5KGZ1bmN0aW9uKCl7dGhhdC5fc3RhcnQobWV0aG9kLCB1cmwsIHBheWxvYWQpO30pO1xufTtcblhEUk9iamVjdC5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKFsnY2h1bmsnLCAnZmluaXNoJ10pO1xuWERST2JqZWN0LnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbihtZXRob2QsIHVybCwgcGF5bG9hZCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgeGRyID0gbmV3IFhEb21haW5SZXF1ZXN0KCk7XG4gICAgLy8gSUUgY2FjaGVzIGV2ZW4gUE9TVHNcbiAgICB1cmwgKz0gKCh1cmwuaW5kZXhPZignPycpID09PSAtMSkgPyAnPycgOiAnJicpICsgJ3Q9JysoK25ldyBEYXRlKTtcblxuICAgIHZhciBvbmVycm9yID0geGRyLm9udGltZW91dCA9IHhkci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJywgMCwgJycpO1xuICAgICAgICB0aGF0Ll9jbGVhbnVwKGZhbHNlKTtcbiAgICB9O1xuICAgIHhkci5vbnByb2dyZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQuZW1pdCgnY2h1bmsnLCAyMDAsIHhkci5yZXNwb25zZVRleHQpO1xuICAgIH07XG4gICAgeGRyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIDIwMCwgeGRyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIHRoYXQuX2NsZWFudXAoZmFsc2UpO1xuICAgIH07XG4gICAgdGhhdC54ZHIgPSB4ZHI7XG4gICAgdGhhdC51bmxvYWRfcmVmID0gdXRpbHMudW5sb2FkX2FkZChmdW5jdGlvbigpe3RoYXQuX2NsZWFudXAodHJ1ZSk7fSk7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gRmFpbHMgd2l0aCBBY2Nlc3NEZW5pZWQgaWYgcG9ydCBudW1iZXIgaXMgYm9ndXNcbiAgICAgICAgdGhhdC54ZHIub3BlbihtZXRob2QsIHVybCk7XG4gICAgICAgIHRoYXQueGRyLnNlbmQocGF5bG9hZCk7XG4gICAgfSBjYXRjaCh4KSB7XG4gICAgICAgIG9uZXJyb3IoKTtcbiAgICB9XG59O1xuXG5YRFJPYmplY3QucHJvdG90eXBlLl9jbGVhbnVwID0gZnVuY3Rpb24oYWJvcnQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKCF0aGF0LnhkcikgcmV0dXJuO1xuICAgIHV0aWxzLnVubG9hZF9kZWwodGhhdC51bmxvYWRfcmVmKTtcblxuICAgIHRoYXQueGRyLm9udGltZW91dCA9IHRoYXQueGRyLm9uZXJyb3IgPSB0aGF0Lnhkci5vbnByb2dyZXNzID1cbiAgICAgICAgdGhhdC54ZHIub25sb2FkID0gbnVsbDtcbiAgICBpZiAoYWJvcnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoYXQueGRyLmFib3J0KCk7XG4gICAgICAgIH0gY2F0Y2goeCkge307XG4gICAgfVxuICAgIHRoYXQudW5sb2FkX3JlZiA9IHRoYXQueGRyID0gbnVsbDtcbn07XG5cblhEUk9iamVjdC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5udWtlKCk7XG4gICAgdGhhdC5fY2xlYW51cCh0cnVlKTtcbn07XG5cbi8vIDEuIElzIG5hdGl2ZWx5IHZpYSBYSFJcbi8vIDIuIElzIG5hdGl2ZWx5IHZpYSBYRFJcbi8vIDMuIE5vcGUsIGJ1dCBwb3N0TWVzc2FnZSBpcyB0aGVyZSBzbyBpdCBzaG91bGQgd29yayB2aWEgdGhlIElmcmFtZS5cbi8vIDQuIE5vcGUsIHNvcnJ5LlxudXRpbHMuaXNYSFJDb3JzQ2FwYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChfd2luZG93LlhNTEh0dHBSZXF1ZXN0ICYmICd3aXRoQ3JlZGVudGlhbHMnIGluIG5ldyBYTUxIdHRwUmVxdWVzdCgpKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICAvLyBYRG9tYWluUmVxdWVzdCBkb2Vzbid0IHdvcmsgaWYgcGFnZSBpcyBzZXJ2ZWQgZnJvbSBmaWxlOi8vXG4gICAgaWYgKF93aW5kb3cuWERvbWFpblJlcXVlc3QgJiYgX2RvY3VtZW50LmRvbWFpbikge1xuICAgICAgICByZXR1cm4gMjtcbiAgICB9XG4gICAgaWYgKElmcmFtZVRyYW5zcG9ydC5lbmFibGVkKCkpIHtcbiAgICAgICAgcmV0dXJuIDM7XG4gICAgfVxuICAgIHJldHVybiA0O1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvZG9tMi5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvc29ja2pzLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgU29ja0pTID0gZnVuY3Rpb24odXJsLCBkZXBfcHJvdG9jb2xzX3doaXRlbGlzdCwgb3B0aW9ucykge1xuICAgIGlmICh0aGlzID09PSB3aW5kb3cpIHtcbiAgICAgICAgLy8gbWFrZXMgYG5ld2Agb3B0aW9uYWxcbiAgICAgICAgcmV0dXJuIG5ldyBTb2NrSlModXJsLCBkZXBfcHJvdG9jb2xzX3doaXRlbGlzdCwgb3B0aW9ucyk7XG4gICAgfVxuICAgIFxuICAgIHZhciB0aGF0ID0gdGhpcywgcHJvdG9jb2xzX3doaXRlbGlzdDtcbiAgICB0aGF0Ll9vcHRpb25zID0ge2RldmVsOiBmYWxzZSwgZGVidWc6IGZhbHNlLCBwcm90b2NvbHNfd2hpdGVsaXN0OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgIGluZm86IHVuZGVmaW5lZCwgcnR0OiB1bmRlZmluZWR9O1xuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgIHV0aWxzLm9iamVjdEV4dGVuZCh0aGF0Ll9vcHRpb25zLCBvcHRpb25zKTtcbiAgICB9XG4gICAgdGhhdC5fYmFzZV91cmwgPSB1dGlscy5hbWVuZFVybCh1cmwpO1xuICAgIHRoYXQuX3NlcnZlciA9IHRoYXQuX29wdGlvbnMuc2VydmVyIHx8IHV0aWxzLnJhbmRvbV9udW1iZXJfc3RyaW5nKDEwMDApO1xuICAgIGlmICh0aGF0Ll9vcHRpb25zLnByb3RvY29sc193aGl0ZWxpc3QgJiZcbiAgICAgICAgdGhhdC5fb3B0aW9ucy5wcm90b2NvbHNfd2hpdGVsaXN0Lmxlbmd0aCkge1xuICAgICAgICBwcm90b2NvbHNfd2hpdGVsaXN0ID0gdGhhdC5fb3B0aW9ucy5wcm90b2NvbHNfd2hpdGVsaXN0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERlcHJlY2F0ZWQgQVBJXG4gICAgICAgIGlmICh0eXBlb2YgZGVwX3Byb3RvY29sc193aGl0ZWxpc3QgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICBkZXBfcHJvdG9jb2xzX3doaXRlbGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBwcm90b2NvbHNfd2hpdGVsaXN0ID0gW2RlcF9wcm90b2NvbHNfd2hpdGVsaXN0XTtcbiAgICAgICAgfSBlbHNlIGlmICh1dGlscy5pc0FycmF5KGRlcF9wcm90b2NvbHNfd2hpdGVsaXN0KSkge1xuICAgICAgICAgICAgcHJvdG9jb2xzX3doaXRlbGlzdCA9IGRlcF9wcm90b2NvbHNfd2hpdGVsaXN0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm90b2NvbHNfd2hpdGVsaXN0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvdG9jb2xzX3doaXRlbGlzdCkge1xuICAgICAgICAgICAgdGhhdC5fZGVidWcoJ0RlcHJlY2F0ZWQgQVBJOiBVc2UgXCJwcm90b2NvbHNfd2hpdGVsaXN0XCIgb3B0aW9uICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2luc3RlYWQgb2Ygc3VwcGx5aW5nIHByb3RvY29sIGxpc3QgYXMgYSBzZWNvbmQgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAncGFyYW1ldGVyIHRvIFNvY2tKUyBjb25zdHJ1Y3Rvci4nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGF0Ll9wcm90b2NvbHMgPSBbXTtcbiAgICB0aGF0LnByb3RvY29sID0gbnVsbDtcbiAgICB0aGF0LnJlYWR5U3RhdGUgPSBTb2NrSlMuQ09OTkVDVElORztcbiAgICB0aGF0Ll9pciA9IGNyZWF0ZUluZm9SZWNlaXZlcih0aGF0Ll9iYXNlX3VybCk7XG4gICAgdGhhdC5faXIub25maW5pc2ggPSBmdW5jdGlvbihpbmZvLCBydHQpIHtcbiAgICAgICAgdGhhdC5faXIgPSBudWxsO1xuICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgaWYgKHRoYXQuX29wdGlvbnMuaW5mbykge1xuICAgICAgICAgICAgICAgIC8vIE92ZXJyaWRlIGlmIHVzZXIgc3VwcGxpZXMgdGhlIG9wdGlvblxuICAgICAgICAgICAgICAgIGluZm8gPSB1dGlscy5vYmplY3RFeHRlbmQoaW5mbywgdGhhdC5fb3B0aW9ucy5pbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGF0Ll9vcHRpb25zLnJ0dCkge1xuICAgICAgICAgICAgICAgIHJ0dCA9IHRoYXQuX29wdGlvbnMucnR0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhhdC5fYXBwbHlJbmZvKGluZm8sIHJ0dCwgcHJvdG9jb2xzX3doaXRlbGlzdCk7XG4gICAgICAgICAgICB0aGF0Ll9kaWRDbG9zZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhhdC5fZGlkQ2xvc2UoMTAwMiwgJ0NhblxcJ3QgY29ubmVjdCB0byBzZXJ2ZXInLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuLy8gSW5oZXJpdGFuY2VcblNvY2tKUy5wcm90b3R5cGUgPSBuZXcgUkV2ZW50VGFyZ2V0KCk7XG5cblNvY2tKUy52ZXJzaW9uID0gXCIwLjMuMS43LmdhNjdmLmRpcnR5XCI7XG5cblNvY2tKUy5DT05ORUNUSU5HID0gMDtcblNvY2tKUy5PUEVOID0gMTtcblNvY2tKUy5DTE9TSU5HID0gMjtcblNvY2tKUy5DTE9TRUQgPSAzO1xuXG5Tb2NrSlMucHJvdG90eXBlLl9kZWJ1ZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9vcHRpb25zLmRlYnVnKVxuICAgICAgICB1dGlscy5sb2cuYXBwbHkodXRpbHMsIGFyZ3VtZW50cyk7XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl9kaXNwYXRjaE9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucmVhZHlTdGF0ZSA9PT0gU29ja0pTLkNPTk5FQ1RJTkcpIHtcbiAgICAgICAgaWYgKHRoYXQuX3RyYW5zcG9ydF90cmVmKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhhdC5fdHJhbnNwb3J0X3RyZWYpO1xuICAgICAgICAgICAgdGhhdC5fdHJhbnNwb3J0X3RyZWYgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoYXQucmVhZHlTdGF0ZSA9IFNvY2tKUy5PUEVOO1xuICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KFwib3BlblwiKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhlIHNlcnZlciBtaWdodCBoYXZlIGJlZW4gcmVzdGFydGVkLCBhbmQgbG9zdCB0cmFjayBvZiBvdXJcbiAgICAgICAgLy8gY29ubmVjdGlvbi5cbiAgICAgICAgdGhhdC5fZGlkQ2xvc2UoMTAwNiwgXCJTZXJ2ZXIgbG9zdCBzZXNzaW9uXCIpO1xuICAgIH1cbn07XG5cblNvY2tKUy5wcm90b3R5cGUuX2Rpc3BhdGNoTWVzc2FnZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLk9QRU4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudChcIm1lc3NhZ2VcIiwge2RhdGE6IGRhdGF9KSk7XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl9kaXNwYXRjaEhlYXJ0YmVhdCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLk9QRU4pXG4gICAgICAgIHJldHVybjtcbiAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdoZWFydGJlYXQnLCB7fSkpO1xufTtcblxuU29ja0pTLnByb3RvdHlwZS5fZGlkQ2xvc2UgPSBmdW5jdGlvbihjb2RlLCByZWFzb24sIGZvcmNlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5DT05ORUNUSU5HICYmXG4gICAgICAgIHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLk9QRU4gJiZcbiAgICAgICAgdGhhdC5yZWFkeVN0YXRlICE9PSBTb2NrSlMuQ0xPU0lORylcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSU5WQUxJRF9TVEFURV9FUlInKTtcbiAgICBpZiAodGhhdC5faXIpIHtcbiAgICAgICAgdGhhdC5faXIubnVrZSgpO1xuICAgICAgICB0aGF0Ll9pciA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHRoYXQuX3RyYW5zcG9ydCkge1xuICAgICAgICB0aGF0Ll90cmFuc3BvcnQuZG9DbGVhbnVwKCk7XG4gICAgICAgIHRoYXQuX3RyYW5zcG9ydCA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGNsb3NlX2V2ZW50ID0gbmV3IFNpbXBsZUV2ZW50KFwiY2xvc2VcIiwge1xuICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICByZWFzb246IHJlYXNvbixcbiAgICAgICAgd2FzQ2xlYW46IHV0aWxzLnVzZXJTZXRDb2RlKGNvZGUpfSk7XG5cbiAgICBpZiAoIXV0aWxzLnVzZXJTZXRDb2RlKGNvZGUpICYmXG4gICAgICAgIHRoYXQucmVhZHlTdGF0ZSA9PT0gU29ja0pTLkNPTk5FQ1RJTkcgJiYgIWZvcmNlKSB7XG4gICAgICAgIGlmICh0aGF0Ll90cnlfbmV4dF9wcm90b2NvbChjbG9zZV9ldmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjbG9zZV9ldmVudCA9IG5ldyBTaW1wbGVFdmVudChcImNsb3NlXCIsIHtjb2RlOiAyMDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVhc29uOiBcIkFsbCB0cmFuc3BvcnRzIGZhaWxlZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FzQ2xlYW46IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdF9ldmVudDogY2xvc2VfZXZlbnR9KTtcbiAgICB9XG4gICAgdGhhdC5yZWFkeVN0YXRlID0gU29ja0pTLkNMT1NFRDtcblxuICAgIHV0aWxzLmRlbGF5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChjbG9zZV9ldmVudCk7XG4gICAgICAgICAgICAgICAgfSk7XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl9kaWRNZXNzYWdlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgdHlwZSA9IGRhdGEuc2xpY2UoMCwgMSk7XG4gICAgc3dpdGNoKHR5cGUpIHtcbiAgICBjYXNlICdvJzpcbiAgICAgICAgdGhhdC5fZGlzcGF0Y2hPcGVuKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2EnOlxuICAgICAgICB2YXIgcGF5bG9hZCA9IEpTT04ucGFyc2UoZGF0YS5zbGljZSgxKSB8fCAnW10nKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBwYXlsb2FkLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHRoYXQuX2Rpc3BhdGNoTWVzc2FnZShwYXlsb2FkW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICBjYXNlICdtJzpcbiAgICAgICAgdmFyIHBheWxvYWQgPSBKU09OLnBhcnNlKGRhdGEuc2xpY2UoMSkgfHwgJ251bGwnKTtcbiAgICAgICAgdGhhdC5fZGlzcGF0Y2hNZXNzYWdlKHBheWxvYWQpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlICdjJzpcbiAgICAgICAgdmFyIHBheWxvYWQgPSBKU09OLnBhcnNlKGRhdGEuc2xpY2UoMSkgfHwgJ1tdJyk7XG4gICAgICAgIHRoYXQuX2RpZENsb3NlKHBheWxvYWRbMF0sIHBheWxvYWRbMV0pO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlICdoJzpcbiAgICAgICAgdGhhdC5fZGlzcGF0Y2hIZWFydGJlYXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuU29ja0pTLnByb3RvdHlwZS5fdHJ5X25leHRfcHJvdG9jb2wgPSBmdW5jdGlvbihjbG9zZV9ldmVudCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5wcm90b2NvbCkge1xuICAgICAgICB0aGF0Ll9kZWJ1ZygnQ2xvc2VkIHRyYW5zcG9ydDonLCB0aGF0LnByb3RvY29sLCAnJytjbG9zZV9ldmVudCk7XG4gICAgICAgIHRoYXQucHJvdG9jb2wgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodGhhdC5fdHJhbnNwb3J0X3RyZWYpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoYXQuX3RyYW5zcG9ydF90cmVmKTtcbiAgICAgICAgdGhhdC5fdHJhbnNwb3J0X3RyZWYgPSBudWxsO1xuICAgIH1cblxuICAgIHdoaWxlKDEpIHtcbiAgICAgICAgdmFyIHByb3RvY29sID0gdGhhdC5wcm90b2NvbCA9IHRoYXQuX3Byb3RvY29scy5zaGlmdCgpO1xuICAgICAgICBpZiAoIXByb3RvY29sKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU29tZSBwcm90b2NvbHMgcmVxdWlyZSBhY2Nlc3MgdG8gYGJvZHlgLCB3aGF0IGlmIHdlcmUgaW5cbiAgICAgICAgLy8gdGhlIGBoZWFkYD9cbiAgICAgICAgaWYgKFNvY2tKU1twcm90b2NvbF0gJiZcbiAgICAgICAgICAgIFNvY2tKU1twcm90b2NvbF0ubmVlZF9ib2R5ID09PSB0cnVlICYmXG4gICAgICAgICAgICAoIV9kb2N1bWVudC5ib2R5IHx8XG4gICAgICAgICAgICAgKHR5cGVvZiBfZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgJiYgX2RvY3VtZW50LnJlYWR5U3RhdGUgIT09ICdjb21wbGV0ZScpKSkge1xuICAgICAgICAgICAgdGhhdC5fcHJvdG9jb2xzLnVuc2hpZnQocHJvdG9jb2wpO1xuICAgICAgICAgICAgdGhhdC5wcm90b2NvbCA9ICd3YWl0aW5nLWZvci1sb2FkJztcbiAgICAgICAgICAgIHV0aWxzLmF0dGFjaEV2ZW50KCdsb2FkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB0aGF0Ll90cnlfbmV4dF9wcm90b2NvbCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghU29ja0pTW3Byb3RvY29sXSB8fFxuICAgICAgICAgICAgICAhU29ja0pTW3Byb3RvY29sXS5lbmFibGVkKHRoYXQuX29wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGF0Ll9kZWJ1ZygnU2tpcHBpbmcgdHJhbnNwb3J0OicsIHByb3RvY29sKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciByb3VuZFRyaXBzID0gU29ja0pTW3Byb3RvY29sXS5yb3VuZFRyaXBzIHx8IDE7XG4gICAgICAgICAgICB2YXIgdG8gPSAoKHRoYXQuX29wdGlvbnMucnRvIHx8IDApICogcm91bmRUcmlwcykgfHwgNTAwMDtcbiAgICAgICAgICAgIHRoYXQuX3RyYW5zcG9ydF90cmVmID0gdXRpbHMuZGVsYXkodG8sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgPT09IFNvY2tKUy5DT05ORUNUSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEkgY2FuJ3QgdW5kZXJzdGFuZCBob3cgaXQgaXMgcG9zc2libGUgdG8gcnVuXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgdGltZXIsIHdoZW4gdGhlIHN0YXRlIGlzIENMT1NFRCwgYnV0XG4gICAgICAgICAgICAgICAgICAgIC8vIGFwcGFyZW50bHkgaW4gSUUgZXZlcnl0aGluIGlzIHBvc3NpYmxlLlxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9kaWRDbG9zZSgyMDA3LCBcIlRyYW5zcG9ydCB0aW1lb3V0ZWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBjb25uaWQgPSB1dGlscy5yYW5kb21fc3RyaW5nKDgpO1xuICAgICAgICAgICAgdmFyIHRyYW5zX3VybCA9IHRoYXQuX2Jhc2VfdXJsICsgJy8nICsgdGhhdC5fc2VydmVyICsgJy8nICsgY29ubmlkO1xuICAgICAgICAgICAgdGhhdC5fZGVidWcoJ09wZW5pbmcgdHJhbnNwb3J0OicsIHByb3RvY29sLCAnIHVybDonK3RyYW5zX3VybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICcgUlRPOicrdGhhdC5fb3B0aW9ucy5ydG8pO1xuICAgICAgICAgICAgdGhhdC5fdHJhbnNwb3J0ID0gbmV3IFNvY2tKU1twcm90b2NvbF0odGhhdCwgdHJhbnNfdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fYmFzZV91cmwpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oY29kZSwgcmVhc29uKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmIChjb2RlICYmICF1dGlscy51c2VyU2V0Q29kZShjb2RlKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSU5WQUxJRF9BQ0NFU1NfRVJSXCIpO1xuICAgIGlmKHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLkNPTk5FQ1RJTkcgJiZcbiAgICAgICB0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5PUEVOKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhhdC5yZWFkeVN0YXRlID0gU29ja0pTLkNMT1NJTkc7XG4gICAgdGhhdC5fZGlkQ2xvc2UoY29kZSB8fCAxMDAwLCByZWFzb24gfHwgXCJOb3JtYWwgY2xvc3VyZVwiKTtcbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cblNvY2tKUy5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucmVhZHlTdGF0ZSA9PT0gU29ja0pTLkNPTk5FQ1RJTkcpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSU5WQUxJRF9TVEFURV9FUlInKTtcbiAgICBpZiAodGhhdC5yZWFkeVN0YXRlID09PSBTb2NrSlMuT1BFTikge1xuICAgICAgICB0aGF0Ll90cmFuc3BvcnQuZG9TZW5kKHV0aWxzLnF1b3RlKCcnICsgZGF0YSkpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cblNvY2tKUy5wcm90b3R5cGUuX2FwcGx5SW5mbyA9IGZ1bmN0aW9uKGluZm8sIHJ0dCwgcHJvdG9jb2xzX3doaXRlbGlzdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0Ll9vcHRpb25zLmluZm8gPSBpbmZvO1xuICAgIHRoYXQuX29wdGlvbnMucnR0ID0gcnR0O1xuICAgIHRoYXQuX29wdGlvbnMucnRvID0gdXRpbHMuY291bnRSVE8ocnR0KTtcbiAgICB0aGF0Ll9vcHRpb25zLmluZm8ubnVsbF9vcmlnaW4gPSAhX2RvY3VtZW50LmRvbWFpbjtcbiAgICB2YXIgcHJvYmVkID0gdXRpbHMucHJvYmVQcm90b2NvbHMoKTtcbiAgICB0aGF0Ll9wcm90b2NvbHMgPSB1dGlscy5kZXRlY3RQcm90b2NvbHMocHJvYmVkLCBwcm90b2NvbHNfd2hpdGVsaXN0LCBpbmZvKTtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3NvY2tqcy5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtd2Vic29ja2V0LmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgV2ViU29ja2V0VHJhbnNwb3J0ID0gU29ja0pTLndlYnNvY2tldCA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHVybCA9IHRyYW5zX3VybCArICcvd2Vic29ja2V0JztcbiAgICBpZiAodXJsLnNsaWNlKDAsIDUpID09PSAnaHR0cHMnKSB7XG4gICAgICAgIHVybCA9ICd3c3MnICsgdXJsLnNsaWNlKDUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCA9ICd3cycgKyB1cmwuc2xpY2UoNCk7XG4gICAgfVxuICAgIHRoYXQucmkgPSByaTtcbiAgICB0aGF0LnVybCA9IHVybDtcbiAgICB2YXIgQ29uc3RydWN0b3IgPSBfd2luZG93LldlYlNvY2tldCB8fCBfd2luZG93Lk1veldlYlNvY2tldDtcblxuICAgIHRoYXQud3MgPSBuZXcgQ29uc3RydWN0b3IodGhhdC51cmwpO1xuICAgIHRoYXQud3Mub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGF0LnJpLl9kaWRNZXNzYWdlKGUuZGF0YSk7XG4gICAgfTtcbiAgICAvLyBGaXJlZm94IGhhcyBhbiBpbnRlcmVzdGluZyBidWcuIElmIGEgd2Vic29ja2V0IGNvbm5lY3Rpb24gaXNcbiAgICAvLyBjcmVhdGVkIGFmdGVyIG9uYmVmb3JldW5sb2FkLCBpdCBzdGF5cyBhbGl2ZSBldmVuIHdoZW4gdXNlclxuICAgIC8vIG5hdmlnYXRlcyBhd2F5IGZyb20gdGhlIHBhZ2UuIEluIHN1Y2ggc2l0dWF0aW9uIGxldCdzIGxpZSAtXG4gICAgLy8gbGV0J3Mgbm90IG9wZW4gdGhlIHdzIGNvbm5lY3Rpb24gYXQgYWxsLiBTZWU6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3NvY2tqcy9zb2NranMtY2xpZW50L2lzc3Vlcy8yOFxuICAgIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NjA4NVxuICAgIHRoYXQudW5sb2FkX3JlZiA9IHV0aWxzLnVubG9hZF9hZGQoZnVuY3Rpb24oKXt0aGF0LndzLmNsb3NlKCl9KTtcbiAgICB0aGF0LndzLm9uY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhhdC5yaS5fZGlkTWVzc2FnZSh1dGlscy5jbG9zZUZyYW1lKDEwMDYsIFwiV2ViU29ja2V0IGNvbm5lY3Rpb24gYnJva2VuXCIpKTtcbiAgICB9O1xufTtcblxuV2ViU29ja2V0VHJhbnNwb3J0LnByb3RvdHlwZS5kb1NlbmQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdGhpcy53cy5zZW5kKCdbJyArIGRhdGEgKyAnXScpO1xufTtcblxuV2ViU29ja2V0VHJhbnNwb3J0LnByb3RvdHlwZS5kb0NsZWFudXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHdzID0gdGhhdC53cztcbiAgICBpZiAod3MpIHtcbiAgICAgICAgd3Mub25tZXNzYWdlID0gd3Mub25jbG9zZSA9IG51bGw7XG4gICAgICAgIHdzLmNsb3NlKCk7XG4gICAgICAgIHV0aWxzLnVubG9hZF9kZWwodGhhdC51bmxvYWRfcmVmKTtcbiAgICAgICAgdGhhdC51bmxvYWRfcmVmID0gdGhhdC5yaSA9IHRoYXQud3MgPSBudWxsO1xuICAgIH1cbn07XG5cbldlYlNvY2tldFRyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICEhKF93aW5kb3cuV2ViU29ja2V0IHx8IF93aW5kb3cuTW96V2ViU29ja2V0KTtcbn07XG5cbi8vIEluIHRoZW9yeSwgd3Mgc2hvdWxkIHJlcXVpcmUgMSByb3VuZCB0cmlwLiBCdXQgaW4gY2hyb21lLCB0aGlzIGlzXG4vLyBub3QgdmVyeSBzdGFibGUgb3ZlciBTU0wuIE1vc3QgbGlrZWx5IGEgd3MgY29ubmVjdGlvbiByZXF1aXJlcyBhXG4vLyBzZXBhcmF0ZSBTU0wgY29ubmVjdGlvbiwgaW4gd2hpY2ggY2FzZSAyIHJvdW5kIHRyaXBzIGFyZSBhblxuLy8gYWJzb2x1dGUgbWludW11bS5cbldlYlNvY2tldFRyYW5zcG9ydC5yb3VuZFRyaXBzID0gMjtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtd2Vic29ja2V0LmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1zZW5kZXIuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBCdWZmZXJlZFNlbmRlciA9IGZ1bmN0aW9uKCkge307XG5CdWZmZXJlZFNlbmRlci5wcm90b3R5cGUuc2VuZF9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKHNlbmRlcikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnNlbmRfYnVmZmVyID0gW107XG4gICAgdGhhdC5zZW5kZXIgPSBzZW5kZXI7XG59O1xuQnVmZmVyZWRTZW5kZXIucHJvdG90eXBlLmRvU2VuZCA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5zZW5kX2J1ZmZlci5wdXNoKG1lc3NhZ2UpO1xuICAgIGlmICghdGhhdC5zZW5kX3N0b3ApIHtcbiAgICAgICAgdGhhdC5zZW5kX3NjaGVkdWxlKCk7XG4gICAgfVxufTtcblxuLy8gRm9yIHBvbGxpbmcgdHJhbnNwb3J0cyBpbiBhIHNpdHVhdGlvbiB3aGVuIGluIHRoZSBtZXNzYWdlIGNhbGxiYWNrLFxuLy8gbmV3IG1lc3NhZ2UgaXMgYmVpbmcgc2VuZC4gSWYgdGhlIHNlbmRpbmcgY29ubmVjdGlvbiB3YXMgc3RhcnRlZFxuLy8gYmVmb3JlIHJlY2VpdmluZyBvbmUsIGl0IGlzIHBvc3NpYmxlIHRvIHNhdHVyYXRlIHRoZSBuZXR3b3JrIGFuZFxuLy8gdGltZW91dCBkdWUgdG8gdGhlIGxhY2sgb2YgcmVjZWl2aW5nIHNvY2tldC4gVG8gYXZvaWQgdGhhdCB3ZSBkZWxheVxuLy8gc2VuZGluZyBtZXNzYWdlcyBieSBzb21lIHNtYWxsIHRpbWUsIGluIG9yZGVyIHRvIGxldCByZWNlaXZpbmdcbi8vIGNvbm5lY3Rpb24gYmUgc3RhcnRlZCBiZWZvcmVoYW5kLiBUaGlzIGlzIG9ubHkgYSBoYWxmbWVhc3VyZSBhbmRcbi8vIGRvZXMgbm90IGZpeCB0aGUgYmlnIHByb2JsZW0sIGJ1dCBpdCBkb2VzIG1ha2UgdGhlIHRlc3RzIGdvIG1vcmVcbi8vIHN0YWJsZSBvbiBzbG93IG5ldHdvcmtzLlxuQnVmZmVyZWRTZW5kZXIucHJvdG90eXBlLnNlbmRfc2NoZWR1bGVfd2FpdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgdHJlZjtcbiAgICB0aGF0LnNlbmRfc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LnNlbmRfc3RvcCA9IG51bGw7XG4gICAgICAgIGNsZWFyVGltZW91dCh0cmVmKTtcbiAgICB9O1xuICAgIHRyZWYgPSB1dGlscy5kZWxheSgyNSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQuc2VuZF9zdG9wID0gbnVsbDtcbiAgICAgICAgdGhhdC5zZW5kX3NjaGVkdWxlKCk7XG4gICAgfSk7XG59O1xuXG5CdWZmZXJlZFNlbmRlci5wcm90b3R5cGUuc2VuZF9zY2hlZHVsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5zZW5kX2J1ZmZlci5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBwYXlsb2FkID0gJ1snICsgdGhhdC5zZW5kX2J1ZmZlci5qb2luKCcsJykgKyAnXSc7XG4gICAgICAgIHRoYXQuc2VuZF9zdG9wID0gdGhhdC5zZW5kZXIodGhhdC50cmFuc191cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZW5kX3N0b3AgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNlbmRfc2NoZWR1bGVfd2FpdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB0aGF0LnNlbmRfYnVmZmVyID0gW107XG4gICAgfVxufTtcblxuQnVmZmVyZWRTZW5kZXIucHJvdG90eXBlLnNlbmRfZGVzdHJ1Y3RvciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5fc2VuZF9zdG9wKSB7XG4gICAgICAgIHRoYXQuX3NlbmRfc3RvcCgpO1xuICAgIH1cbiAgICB0aGF0Ll9zZW5kX3N0b3AgPSBudWxsO1xufTtcblxudmFyIGpzb25QR2VuZXJpY1NlbmRlciA9IGZ1bmN0aW9uKHVybCwgcGF5bG9hZCwgY2FsbGJhY2spIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAoISgnX3NlbmRfZm9ybScgaW4gdGhhdCkpIHtcbiAgICAgICAgdmFyIGZvcm0gPSB0aGF0Ll9zZW5kX2Zvcm0gPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9ybScpO1xuICAgICAgICB2YXIgYXJlYSA9IHRoYXQuX3NlbmRfYXJlYSA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgICAgICBhcmVhLm5hbWUgPSAnZCc7XG4gICAgICAgIGZvcm0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZm9ybS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIGZvcm0ubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICBmb3JtLmVuY3R5cGUgPSAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJztcbiAgICAgICAgZm9ybS5hY2NlcHRDaGFyc2V0ID0gXCJVVEYtOFwiO1xuICAgICAgICBmb3JtLmFwcGVuZENoaWxkKGFyZWEpO1xuICAgICAgICBfZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmb3JtKTtcbiAgICB9XG4gICAgdmFyIGZvcm0gPSB0aGF0Ll9zZW5kX2Zvcm07XG4gICAgdmFyIGFyZWEgPSB0aGF0Ll9zZW5kX2FyZWE7XG4gICAgdmFyIGlkID0gJ2EnICsgdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICBmb3JtLnRhcmdldCA9IGlkO1xuICAgIGZvcm0uYWN0aW9uID0gdXJsICsgJy9qc29ucF9zZW5kP2k9JyArIGlkO1xuXG4gICAgdmFyIGlmcmFtZTtcbiAgICB0cnkge1xuICAgICAgICAvLyBpZTYgZHluYW1pYyBpZnJhbWVzIHdpdGggdGFyZ2V0PVwiXCIgc3VwcG9ydCAodGhhbmtzIENocmlzIExhbWJhY2hlcilcbiAgICAgICAgaWZyYW1lID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJzxpZnJhbWUgbmFtZT1cIicrIGlkICsnXCI+Jyk7XG4gICAgfSBjYXRjaCh4KSB7XG4gICAgICAgIGlmcmFtZSA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICAgICAgaWZyYW1lLm5hbWUgPSBpZDtcbiAgICB9XG4gICAgaWZyYW1lLmlkID0gaWQ7XG4gICAgZm9ybS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgIGlmcmFtZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgYXJlYS52YWx1ZSA9IHBheWxvYWQ7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHV0aWxzLmxvZygnWW91ciBicm93c2VyIGlzIHNlcmlvdXNseSBicm9rZW4uIEdvIGhvbWUhICcgKyBlLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBmb3JtLnN1Ym1pdCgpO1xuXG4gICAgdmFyIGNvbXBsZXRlZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCFpZnJhbWUub25lcnJvcikgcmV0dXJuO1xuICAgICAgICBpZnJhbWUub25yZWFkeXN0YXRlY2hhbmdlID0gaWZyYW1lLm9uZXJyb3IgPSBpZnJhbWUub25sb2FkID0gbnVsbDtcbiAgICAgICAgLy8gT3BlcmEgbWluaSBkb2Vzbid0IGxpa2UgaWYgd2UgR0MgaWZyYW1lXG4gICAgICAgIC8vIGltbWVkaWF0ZWx5LCB0aHVzIHRoaXMgdGltZW91dC5cbiAgICAgICAgdXRpbHMuZGVsYXkoNTAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgaWZyYW1lLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgaWZyYW1lID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgYXJlYS52YWx1ZSA9ICcnO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgIH07XG4gICAgaWZyYW1lLm9uZXJyb3IgPSBpZnJhbWUub25sb2FkID0gY29tcGxldGVkO1xuICAgIGlmcmFtZS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChpZnJhbWUucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnKSBjb21wbGV0ZWQoKTtcbiAgICB9O1xuICAgIHJldHVybiBjb21wbGV0ZWQ7XG59O1xuXG52YXIgY3JlYXRlQWpheFNlbmRlciA9IGZ1bmN0aW9uKEFqYXhPYmplY3QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odXJsLCBwYXlsb2FkLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgeG8gPSBuZXcgQWpheE9iamVjdCgnUE9TVCcsIHVybCArICcveGhyX3NlbmQnLCBwYXlsb2FkKTtcbiAgICAgICAgeG8ub25maW5pc2ggPSBmdW5jdGlvbihzdGF0dXMsIHRleHQpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHN0YXR1cyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihhYm9ydF9yZWFzb24pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKDAsIGFib3J0X3JlYXNvbik7XG4gICAgICAgIH07XG4gICAgfTtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXNlbmRlci5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtanNvbnAtcmVjZWl2ZXIuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbi8vIFBhcnRzIGRlcml2ZWQgZnJvbSBTb2NrZXQuaW86XG4vLyAgICBodHRwczovL2dpdGh1Yi5jb20vTGVhcm5Cb29zdC9zb2NrZXQuaW8vYmxvYi8wLjYuMTcvbGliL3NvY2tldC5pby90cmFuc3BvcnRzL2pzb25wLXBvbGxpbmcuanNcbi8vIGFuZCBqUXVlcnktSlNPTlA6XG4vLyAgICBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2pxdWVyeS1qc29ucC9zb3VyY2UvYnJvd3NlL3RydW5rL2NvcmUvanF1ZXJ5Lmpzb25wLmpzXG52YXIganNvblBHZW5lcmljUmVjZWl2ZXIgPSBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHRyZWY7XG4gICAgdmFyIHNjcmlwdCA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICB2YXIgc2NyaXB0MjsgIC8vIE9wZXJhIHN5bmNocm9ub3VzIGxvYWQgdHJpY2suXG4gICAgdmFyIGNsb3NlX3NjcmlwdCA9IGZ1bmN0aW9uKGZyYW1lKSB7XG4gICAgICAgIGlmIChzY3JpcHQyKSB7XG4gICAgICAgICAgICBzY3JpcHQyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0Mik7XG4gICAgICAgICAgICBzY3JpcHQyID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NyaXB0KSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodHJlZik7XG4gICAgICAgICAgICBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xuICAgICAgICAgICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHNjcmlwdC5vbmVycm9yID1cbiAgICAgICAgICAgICAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9uY2xpY2sgPSBudWxsO1xuICAgICAgICAgICAgc2NyaXB0ID0gbnVsbDtcbiAgICAgICAgICAgIGNhbGxiYWNrKGZyYW1lKTtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBJRTkgZmlyZXMgJ2Vycm9yJyBldmVudCBhZnRlciBvcnNjIG9yIGJlZm9yZSwgaW4gcmFuZG9tIG9yZGVyLlxuICAgIHZhciBsb2FkZWRfb2theSA9IGZhbHNlO1xuICAgIHZhciBlcnJvcl90aW1lciA9IG51bGw7XG5cbiAgICBzY3JpcHQuaWQgPSAnYScgKyB1dGlscy5yYW5kb21fc3RyaW5nKDgpO1xuICAgIHNjcmlwdC5zcmMgPSB1cmw7XG4gICAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcbiAgICBzY3JpcHQuY2hhcnNldCA9ICdVVEYtOCc7XG4gICAgc2NyaXB0Lm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICghZXJyb3JfdGltZXIpIHtcbiAgICAgICAgICAgIC8vIERlbGF5IGZpcmluZyBjbG9zZV9zY3JpcHQuXG4gICAgICAgICAgICBlcnJvcl90aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFsb2FkZWRfb2theSkge1xuICAgICAgICAgICAgICAgICAgICBjbG9zZV9zY3JpcHQodXRpbHMuY2xvc2VGcmFtZShcbiAgICAgICAgICAgICAgICAgICAgICAgIDEwMDYsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkpTT05QIHNjcmlwdCBsb2FkZWQgYWJub3JtYWxseSAob25lcnJvcilcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBzY3JpcHQub25sb2FkID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBjbG9zZV9zY3JpcHQodXRpbHMuY2xvc2VGcmFtZSgxMDA2LCBcIkpTT05QIHNjcmlwdCBsb2FkZWQgYWJub3JtYWxseSAob25sb2FkKVwiKSk7XG4gICAgfTtcblxuICAgIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICgvbG9hZGVkfGNsb3NlZC8udGVzdChzY3JpcHQucmVhZHlTdGF0ZSkpIHtcbiAgICAgICAgICAgIGlmIChzY3JpcHQgJiYgc2NyaXB0Lmh0bWxGb3IgJiYgc2NyaXB0Lm9uY2xpY2spIHtcbiAgICAgICAgICAgICAgICBsb2FkZWRfb2theSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW4gSUUsIGFjdHVhbGx5IGV4ZWN1dGUgdGhlIHNjcmlwdC5cbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0Lm9uY2xpY2soKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoICh4KSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNjcmlwdCkge1xuICAgICAgICAgICAgICAgIGNsb3NlX3NjcmlwdCh1dGlscy5jbG9zZUZyYW1lKDEwMDYsIFwiSlNPTlAgc2NyaXB0IGxvYWRlZCBhYm5vcm1hbGx5IChvbnJlYWR5c3RhdGVjaGFuZ2UpXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLy8gSUU6IGV2ZW50L2h0bWxGb3Ivb25jbGljayB0cmljay5cbiAgICAvLyBPbmUgY2FuJ3QgcmVseSBvbiBwcm9wZXIgb3JkZXIgZm9yIG9ucmVhZHlzdGF0ZWNoYW5nZS4gSW4gb3JkZXIgdG9cbiAgICAvLyBtYWtlIHN1cmUsIHNldCBhICdodG1sRm9yJyBhbmQgJ2V2ZW50JyBwcm9wZXJ0aWVzLCBzbyB0aGF0XG4gICAgLy8gc2NyaXB0IGNvZGUgd2lsbCBiZSBpbnN0YWxsZWQgYXMgJ29uY2xpY2snIGhhbmRsZXIgZm9yIHRoZVxuICAgIC8vIHNjcmlwdCBvYmplY3QuIExhdGVyLCBvbnJlYWR5c3RhdGVjaGFuZ2UsIG1hbnVhbGx5IGV4ZWN1dGUgdGhpc1xuICAgIC8vIGNvZGUuIEZGIGFuZCBDaHJvbWUgZG9lc24ndCB3b3JrIHdpdGggJ2V2ZW50JyBhbmQgJ2h0bWxGb3InXG4gICAgLy8gc2V0LiBGb3IgcmVmZXJlbmNlIHNlZTpcbiAgICAvLyAgIGh0dHA6Ly9qYXVib3VyZy5uZXQvMjAxMC8wNy9sb2FkaW5nLXNjcmlwdC1hcy1vbmNsaWNrLWhhbmRsZXItb2YuaHRtbFxuICAgIC8vIEFsc28sIHJlYWQgb24gdGhhdCBhYm91dCBzY3JpcHQgb3JkZXJpbmc6XG4gICAgLy8gICBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvRHluYW1pY19TY3JpcHRfRXhlY3V0aW9uX09yZGVyXG4gICAgaWYgKHR5cGVvZiBzY3JpcHQuYXN5bmMgPT09ICd1bmRlZmluZWQnICYmIF9kb2N1bWVudC5hdHRhY2hFdmVudCkge1xuICAgICAgICAvLyBBY2NvcmRpbmcgdG8gbW96aWxsYSBkb2NzLCBpbiByZWNlbnQgYnJvd3NlcnMgc2NyaXB0LmFzeW5jIGRlZmF1bHRzXG4gICAgICAgIC8vIHRvICd0cnVlJywgc28gd2UgbWF5IHVzZSBpdCB0byBkZXRlY3QgYSBnb29kIGJyb3dzZXI6XG4gICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0hUTUwvRWxlbWVudC9zY3JpcHRcbiAgICAgICAgaWYgKCEvb3BlcmEvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgICAgICAvLyBOYWl2ZWx5IGFzc3VtZSB3ZSdyZSBpbiBJRVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBzY3JpcHQuaHRtbEZvciA9IHNjcmlwdC5pZDtcbiAgICAgICAgICAgICAgICBzY3JpcHQuZXZlbnQgPSBcIm9uY2xpY2tcIjtcbiAgICAgICAgICAgIH0gY2F0Y2ggKHgpIHt9XG4gICAgICAgICAgICBzY3JpcHQuYXN5bmMgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gT3BlcmEsIHNlY29uZCBzeW5jIHNjcmlwdCBoYWNrXG4gICAgICAgICAgICBzY3JpcHQyID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICAgICAgc2NyaXB0Mi50ZXh0ID0gXCJ0cnl7dmFyIGEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnXCIrc2NyaXB0LmlkK1wiJyk7IGlmKGEpYS5vbmVycm9yKCk7fWNhdGNoKHgpe307XCI7XG4gICAgICAgICAgICBzY3JpcHQuYXN5bmMgPSBzY3JpcHQyLmFzeW5jID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzY3JpcHQuYXN5bmMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHNjcmlwdC5hc3luYyA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2sgbW9zdGx5IGZvciBLb25xdWVyb3IgLSBzdHVwaWQgdGltZXIsIDM1IHNlY29uZHMgc2hhbGwgYmUgcGxlbnR5LlxuICAgIHRyZWYgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9zZV9zY3JpcHQodXRpbHMuY2xvc2VGcmFtZSgxMDA2LCBcIkpTT05QIHNjcmlwdCBsb2FkZWQgYWJub3JtYWxseSAodGltZW91dClcIikpO1xuICAgICAgICAgICAgICAgICAgICAgIH0sIDM1MDAwKTtcblxuICAgIHZhciBoZWFkID0gX2RvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaGVhZC5pbnNlcnRCZWZvcmUoc2NyaXB0LCBoZWFkLmZpcnN0Q2hpbGQpO1xuICAgIGlmIChzY3JpcHQyKSB7XG4gICAgICAgIGhlYWQuaW5zZXJ0QmVmb3JlKHNjcmlwdDIsIGhlYWQuZmlyc3RDaGlsZCk7XG4gICAgfVxuICAgIHJldHVybiBjbG9zZV9zY3JpcHQ7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1qc29ucC1yZWNlaXZlci5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtanNvbnAtcG9sbGluZy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLy8gVGhlIHNpbXBsZXN0IGFuZCBtb3N0IHJvYnVzdCB0cmFuc3BvcnQsIHVzaW5nIHRoZSB3ZWxsLWtub3cgY3Jvc3Ncbi8vIGRvbWFpbiBoYWNrIC0gSlNPTlAuIFRoaXMgdHJhbnNwb3J0IGlzIHF1aXRlIGluZWZmaWNpZW50IC0gb25lXG4vLyBtc3NhZ2UgY291bGQgdXNlIHVwIHRvIG9uZSBodHRwIHJlcXVlc3QuIEJ1dCBhdCBsZWFzdCBpdCB3b3JrcyBhbG1vc3Rcbi8vIGV2ZXJ5d2hlcmUuXG4vLyBLbm93biBsaW1pdGF0aW9uczpcbi8vICAgbyB5b3Ugd2lsbCBnZXQgYSBzcGlubmluZyBjdXJzb3Jcbi8vICAgbyBmb3IgS29ucXVlcm9yIGEgZHVtYiB0aW1lciBpcyBuZWVkZWQgdG8gZGV0ZWN0IGVycm9yc1xuXG5cbnZhciBKc29uUFRyYW5zcG9ydCA9IFNvY2tKU1snanNvbnAtcG9sbGluZyddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHV0aWxzLnBvbGx1dGVHbG9iYWxOYW1lc3BhY2UoKTtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5yaSA9IHJpO1xuICAgIHRoYXQudHJhbnNfdXJsID0gdHJhbnNfdXJsO1xuICAgIHRoYXQuc2VuZF9jb25zdHJ1Y3Rvcihqc29uUEdlbmVyaWNTZW5kZXIpO1xuICAgIHRoYXQuX3NjaGVkdWxlX3JlY3YoKTtcbn07XG5cbi8vIEluaGVyaXRuYWNlXG5Kc29uUFRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQnVmZmVyZWRTZW5kZXIoKTtcblxuSnNvblBUcmFuc3BvcnQucHJvdG90eXBlLl9zY2hlZHVsZV9yZWN2ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhhdC5fcmVjdl9zdG9wID0gbnVsbDtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIC8vIG5vIGRhdGEgLSBoZWFydGJlYXQ7XG4gICAgICAgICAgICBpZiAoIXRoYXQuX2lzX2Nsb3NpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnJpLl9kaWRNZXNzYWdlKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFRoZSBtZXNzYWdlIGNhbiBiZSBhIGNsb3NlIG1lc3NhZ2UsIGFuZCBjaGFuZ2UgaXNfY2xvc2luZyBzdGF0ZS5cbiAgICAgICAgaWYgKCF0aGF0Ll9pc19jbG9zaW5nKSB7XG4gICAgICAgICAgICB0aGF0Ll9zY2hlZHVsZV9yZWN2KCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoYXQuX3JlY3Zfc3RvcCA9IGpzb25QUmVjZWl2ZXJXcmFwcGVyKHRoYXQudHJhbnNfdXJsICsgJy9qc29ucCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvblBHZW5lcmljUmVjZWl2ZXIsIGNhbGxiYWNrKTtcbn07XG5cbkpzb25QVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbkpzb25QVHJhbnNwb3J0Lm5lZWRfYm9keSA9IHRydWU7XG5cblxuSnNvblBUcmFuc3BvcnQucHJvdG90eXBlLmRvQ2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0Ll9pc19jbG9zaW5nID0gdHJ1ZTtcbiAgICBpZiAodGhhdC5fcmVjdl9zdG9wKSB7XG4gICAgICAgIHRoYXQuX3JlY3Zfc3RvcCgpO1xuICAgIH1cbiAgICB0aGF0LnJpID0gdGhhdC5fcmVjdl9zdG9wID0gbnVsbDtcbiAgICB0aGF0LnNlbmRfZGVzdHJ1Y3RvcigpO1xufTtcblxuXG4vLyBBYnN0cmFjdCBhd2F5IGNvZGUgdGhhdCBoYW5kbGVzIGdsb2JhbCBuYW1lc3BhY2UgcG9sbHV0aW9uLlxudmFyIGpzb25QUmVjZWl2ZXJXcmFwcGVyID0gZnVuY3Rpb24odXJsLCBjb25zdHJ1Y3RSZWNlaXZlciwgdXNlcl9jYWxsYmFjaykge1xuICAgIHZhciBpZCA9ICdhJyArIHV0aWxzLnJhbmRvbV9zdHJpbmcoNik7XG4gICAgdmFyIHVybF9pZCA9IHVybCArICc/Yz0nICsgZXNjYXBlKFdQcmVmaXggKyAnLicgKyBpZCk7XG4gICAgLy8gQ2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgZXhhY3RseSBvbmNlLlxuICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKGZyYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBfd2luZG93W1dQcmVmaXhdW2lkXTtcbiAgICAgICAgdXNlcl9jYWxsYmFjayhmcmFtZSk7XG4gICAgfTtcblxuICAgIHZhciBjbG9zZV9zY3JpcHQgPSBjb25zdHJ1Y3RSZWNlaXZlcih1cmxfaWQsIGNhbGxiYWNrKTtcbiAgICBfd2luZG93W1dQcmVmaXhdW2lkXSA9IGNsb3NlX3NjcmlwdDtcbiAgICB2YXIgc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoX3dpbmRvd1tXUHJlZml4XVtpZF0pIHtcbiAgICAgICAgICAgIF93aW5kb3dbV1ByZWZpeF1baWRdKHV0aWxzLmNsb3NlRnJhbWUoMTAwMCwgXCJKU09OUCB1c2VyIGFib3J0ZWQgcmVhZFwiKSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBzdG9wO1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtanNvbnAtcG9sbGluZy5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMteGhyLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgQWpheEJhc2VkVHJhbnNwb3J0ID0gZnVuY3Rpb24oKSB7fTtcbkFqYXhCYXNlZFRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQnVmZmVyZWRTZW5kZXIoKTtcblxuQWpheEJhc2VkVHJhbnNwb3J0LnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmxfc3VmZml4LCBSZWNlaXZlciwgQWpheE9iamVjdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnJpID0gcmk7XG4gICAgdGhhdC50cmFuc191cmwgPSB0cmFuc191cmw7XG4gICAgdGhhdC5zZW5kX2NvbnN0cnVjdG9yKGNyZWF0ZUFqYXhTZW5kZXIoQWpheE9iamVjdCkpO1xuICAgIHRoYXQucG9sbCA9IG5ldyBQb2xsaW5nKHJpLCBSZWNlaXZlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc191cmwgKyB1cmxfc3VmZml4LCBBamF4T2JqZWN0KTtcbn07XG5cbkFqYXhCYXNlZFRyYW5zcG9ydC5wcm90b3R5cGUuZG9DbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnBvbGwpIHtcbiAgICAgICAgdGhhdC5wb2xsLmFib3J0KCk7XG4gICAgICAgIHRoYXQucG9sbCA9IG51bGw7XG4gICAgfVxufTtcblxuLy8geGhyLXN0cmVhbWluZ1xudmFyIFhoclN0cmVhbWluZ1RyYW5zcG9ydCA9IFNvY2tKU1sneGhyLXN0cmVhbWluZyddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHRoaXMucnVuKHJpLCB0cmFuc191cmwsICcveGhyX3N0cmVhbWluZycsIFhoclJlY2VpdmVyLCB1dGlscy5YSFJDb3JzT2JqZWN0KTtcbn07XG5cblhoclN0cmVhbWluZ1RyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQWpheEJhc2VkVHJhbnNwb3J0KCk7XG5cblhoclN0cmVhbWluZ1RyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gU3VwcG9ydCBmb3IgQ09SUyBBamF4IGFrYSBBamF4Mj8gT3BlcmEgMTIgY2xhaW1zIENPUlMgYnV0XG4gICAgLy8gZG9lc24ndCBkbyBzdHJlYW1pbmcuXG4gICAgcmV0dXJuIChfd2luZG93LlhNTEh0dHBSZXF1ZXN0ICYmXG4gICAgICAgICAgICAnd2l0aENyZWRlbnRpYWxzJyBpbiBuZXcgWE1MSHR0cFJlcXVlc3QoKSAmJlxuICAgICAgICAgICAgKCEvb3BlcmEvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSk7XG59O1xuWGhyU3RyZWFtaW5nVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAyOyAvLyBwcmVmbGlnaHQsIGFqYXhcblxuLy8gU2FmYXJpIGdldHMgY29uZnVzZWQgd2hlbiBhIHN0cmVhbWluZyBhamF4IHJlcXVlc3QgaXMgc3RhcnRlZFxuLy8gYmVmb3JlIG9ubG9hZC4gVGhpcyBjYXVzZXMgdGhlIGxvYWQgaW5kaWNhdG9yIHRvIHNwaW4gaW5kZWZpbmV0ZWx5LlxuWGhyU3RyZWFtaW5nVHJhbnNwb3J0Lm5lZWRfYm9keSA9IHRydWU7XG5cblxuLy8gQWNjb3JkaW5nIHRvOlxuLy8gICBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE2NDE1MDcvZGV0ZWN0LWJyb3dzZXItc3VwcG9ydC1mb3ItY3Jvc3MtZG9tYWluLXhtbGh0dHByZXF1ZXN0c1xuLy8gICBodHRwOi8vaGFja3MubW96aWxsYS5vcmcvMjAwOS8wNy9jcm9zcy1zaXRlLXhtbGh0dHByZXF1ZXN0LXdpdGgtY29ycy9cblxuXG4vLyB4ZHItc3RyZWFtaW5nXG52YXIgWGRyU3RyZWFtaW5nVHJhbnNwb3J0ID0gU29ja0pTWyd4ZHItc3RyZWFtaW5nJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy94aHJfc3RyZWFtaW5nJywgWGhyUmVjZWl2ZXIsIHV0aWxzLlhEUk9iamVjdCk7XG59O1xuXG5YZHJTdHJlYW1pbmdUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuXG5YZHJTdHJlYW1pbmdUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAhIV93aW5kb3cuWERvbWFpblJlcXVlc3Q7XG59O1xuWGRyU3RyZWFtaW5nVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAyOyAvLyBwcmVmbGlnaHQsIGFqYXhcblxuXG5cbi8vIHhoci1wb2xsaW5nXG52YXIgWGhyUG9sbGluZ1RyYW5zcG9ydCA9IFNvY2tKU1sneGhyLXBvbGxpbmcnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL3hocicsIFhoclJlY2VpdmVyLCB1dGlscy5YSFJDb3JzT2JqZWN0KTtcbn07XG5cblhoclBvbGxpbmdUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuXG5YaHJQb2xsaW5nVHJhbnNwb3J0LmVuYWJsZWQgPSBYaHJTdHJlYW1pbmdUcmFuc3BvcnQuZW5hYmxlZDtcblhoclBvbGxpbmdUcmFuc3BvcnQucm91bmRUcmlwcyA9IDI7IC8vIHByZWZsaWdodCwgYWpheFxuXG5cbi8vIHhkci1wb2xsaW5nXG52YXIgWGRyUG9sbGluZ1RyYW5zcG9ydCA9IFNvY2tKU1sneGRyLXBvbGxpbmcnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL3hocicsIFhoclJlY2VpdmVyLCB1dGlscy5YRFJPYmplY3QpO1xufTtcblxuWGRyUG9sbGluZ1RyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQWpheEJhc2VkVHJhbnNwb3J0KCk7XG5cblhkclBvbGxpbmdUcmFuc3BvcnQuZW5hYmxlZCA9IFhkclN0cmVhbWluZ1RyYW5zcG9ydC5lbmFibGVkO1xuWGRyUG9sbGluZ1RyYW5zcG9ydC5yb3VuZFRyaXBzID0gMjsgLy8gcHJlZmxpZ2h0LCBhamF4XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXhoci5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtaWZyYW1lLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vLyBGZXcgY29vbCB0cmFuc3BvcnRzIGRvIHdvcmsgb25seSBmb3Igc2FtZS1vcmlnaW4uIEluIG9yZGVyIHRvIG1ha2Vcbi8vIHRoZW0gd29ya2luZyBjcm9zcy1kb21haW4gd2Ugc2hhbGwgdXNlIGlmcmFtZSwgc2VydmVkIGZvcm0gdGhlXG4vLyByZW1vdGUgZG9tYWluLiBOZXcgYnJvd3NlcnMsIGhhdmUgY2FwYWJpbGl0aWVzIHRvIGNvbW11bmljYXRlIHdpdGhcbi8vIGNyb3NzIGRvbWFpbiBpZnJhbWUsIHVzaW5nIHBvc3RNZXNzYWdlKCkuIEluIElFIGl0IHdhcyBpbXBsZW1lbnRlZFxuLy8gZnJvbSBJRSA4KywgYnV0IG9mIGNvdXJzZSwgSUUgZ290IHNvbWUgZGV0YWlscyB3cm9uZzpcbi8vICAgIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9jYzE5NzAxNSh2PVZTLjg1KS5hc3B4XG4vLyAgICBodHRwOi8vc3RldmVzb3VkZXJzLmNvbS9taXNjL3Rlc3QtcG9zdG1lc3NhZ2UucGhwXG5cbnZhciBJZnJhbWVUcmFuc3BvcnQgPSBmdW5jdGlvbigpIHt9O1xuXG5JZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlLmlfY29uc3RydWN0b3IgPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsLCBiYXNlX3VybCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnJpID0gcmk7XG4gICAgdGhhdC5vcmlnaW4gPSB1dGlscy5nZXRPcmlnaW4oYmFzZV91cmwpO1xuICAgIHRoYXQuYmFzZV91cmwgPSBiYXNlX3VybDtcbiAgICB0aGF0LnRyYW5zX3VybCA9IHRyYW5zX3VybDtcblxuICAgIHZhciBpZnJhbWVfdXJsID0gYmFzZV91cmwgKyAnL2lmcmFtZS5odG1sJztcbiAgICBpZiAodGhhdC5yaS5fb3B0aW9ucy5kZXZlbCkge1xuICAgICAgICBpZnJhbWVfdXJsICs9ICc/dD0nICsgKCtuZXcgRGF0ZSk7XG4gICAgfVxuICAgIHRoYXQud2luZG93X2lkID0gdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICBpZnJhbWVfdXJsICs9ICcjJyArIHRoYXQud2luZG93X2lkO1xuXG4gICAgdGhhdC5pZnJhbWVPYmogPSB1dGlscy5jcmVhdGVJZnJhbWUoaWZyYW1lX3VybCwgZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnJpLl9kaWRDbG9zZSgxMDA2LCBcIlVuYWJsZSB0byBsb2FkIGFuIGlmcmFtZSAoXCIgKyByICsgXCIpXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgdGhhdC5vbm1lc3NhZ2VfY2IgPSB1dGlscy5iaW5kKHRoYXQub25tZXNzYWdlLCB0aGF0KTtcbiAgICB1dGlscy5hdHRhY2hNZXNzYWdlKHRoYXQub25tZXNzYWdlX2NiKTtcbn07XG5cbklmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUuZG9DbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LmlmcmFtZU9iaikge1xuICAgICAgICB1dGlscy5kZXRhY2hNZXNzYWdlKHRoYXQub25tZXNzYWdlX2NiKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGlmcmFtZSBpcyBub3QgbG9hZGVkLCBJRSByYWlzZXMgYW4gZXhjZXB0aW9uXG4gICAgICAgICAgICAvLyBvbiAnY29udGVudFdpbmRvdycuXG4gICAgICAgICAgICBpZiAodGhhdC5pZnJhbWVPYmouaWZyYW1lLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnBvc3RNZXNzYWdlKCdjJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKHgpIHt9XG4gICAgICAgIHRoYXQuaWZyYW1lT2JqLmNsZWFudXAoKTtcbiAgICAgICAgdGhhdC5pZnJhbWVPYmogPSBudWxsO1xuICAgICAgICB0aGF0Lm9ubWVzc2FnZV9jYiA9IHRoYXQuaWZyYW1lT2JqID0gbnVsbDtcbiAgICB9XG59O1xuXG5JZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKGUub3JpZ2luICE9PSB0aGF0Lm9yaWdpbikgcmV0dXJuO1xuICAgIHZhciB3aW5kb3dfaWQgPSBlLmRhdGEuc2xpY2UoMCwgOCk7XG4gICAgdmFyIHR5cGUgPSBlLmRhdGEuc2xpY2UoOCwgOSk7XG4gICAgdmFyIGRhdGEgPSBlLmRhdGEuc2xpY2UoOSk7XG5cbiAgICBpZiAod2luZG93X2lkICE9PSB0aGF0LndpbmRvd19pZCkgcmV0dXJuO1xuXG4gICAgc3dpdGNoKHR5cGUpIHtcbiAgICBjYXNlICdzJzpcbiAgICAgICAgdGhhdC5pZnJhbWVPYmoubG9hZGVkKCk7XG4gICAgICAgIHRoYXQucG9zdE1lc3NhZ2UoJ3MnLCBKU09OLnN0cmluZ2lmeShbU29ja0pTLnZlcnNpb24sIHRoYXQucHJvdG9jb2wsIHRoYXQudHJhbnNfdXJsLCB0aGF0LmJhc2VfdXJsXSkpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlICd0JzpcbiAgICAgICAgdGhhdC5yaS5fZGlkTWVzc2FnZShkYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZS5wb3N0TWVzc2FnZSA9IGZ1bmN0aW9uKHR5cGUsIGRhdGEpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5pZnJhbWVPYmoucG9zdCh0aGF0LndpbmRvd19pZCArIHR5cGUgKyAoZGF0YSB8fCAnJyksIHRoYXQub3JpZ2luKTtcbn07XG5cbklmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUuZG9TZW5kID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICB0aGlzLnBvc3RNZXNzYWdlKCdtJywgbWVzc2FnZSk7XG59O1xuXG5JZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIHBvc3RNZXNzYWdlIG1pc2JlaGF2ZXMgaW4ga29ucXVlcm9yIDQuNi41IC0gdGhlIG1lc3NhZ2VzIGFyZSBkZWxpdmVyZWQgd2l0aFxuICAgIC8vIGh1Z2UgZGVsYXksIG9yIG5vdCBhdCBhbGwuXG4gICAgdmFyIGtvbnF1ZXJvciA9IG5hdmlnYXRvciAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignS29ucXVlcm9yJykgIT09IC0xO1xuICAgIHJldHVybiAoKHR5cGVvZiBfd2luZG93LnBvc3RNZXNzYWdlID09PSAnZnVuY3Rpb24nIHx8XG4gICAgICAgICAgICB0eXBlb2YgX3dpbmRvdy5wb3N0TWVzc2FnZSA9PT0gJ29iamVjdCcpICYmICgha29ucXVlcm9yKSk7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1pZnJhbWUuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWlmcmFtZS13aXRoaW4uanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBjdXJyX3dpbmRvd19pZDtcblxudmFyIHBvc3RNZXNzYWdlID0gZnVuY3Rpb24gKHR5cGUsIGRhdGEpIHtcbiAgICBpZihwYXJlbnQgIT09IF93aW5kb3cpIHtcbiAgICAgICAgcGFyZW50LnBvc3RNZXNzYWdlKGN1cnJfd2luZG93X2lkICsgdHlwZSArIChkYXRhIHx8ICcnKSwgJyonKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1dGlscy5sb2coXCJDYW4ndCBwb3N0TWVzc2FnZSwgbm8gcGFyZW50IHdpbmRvdy5cIiwgdHlwZSwgZGF0YSk7XG4gICAgfVxufTtcblxudmFyIEZhY2FkZUpTID0gZnVuY3Rpb24oKSB7fTtcbkZhY2FkZUpTLnByb3RvdHlwZS5fZGlkQ2xvc2UgPSBmdW5jdGlvbiAoY29kZSwgcmVhc29uKSB7XG4gICAgcG9zdE1lc3NhZ2UoJ3QnLCB1dGlscy5jbG9zZUZyYW1lKGNvZGUsIHJlYXNvbikpO1xufTtcbkZhY2FkZUpTLnByb3RvdHlwZS5fZGlkTWVzc2FnZSA9IGZ1bmN0aW9uIChmcmFtZSkge1xuICAgIHBvc3RNZXNzYWdlKCd0JywgZnJhbWUpO1xufTtcbkZhY2FkZUpTLnByb3RvdHlwZS5fZG9TZW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB0aGlzLl90cmFuc3BvcnQuZG9TZW5kKGRhdGEpO1xufTtcbkZhY2FkZUpTLnByb3RvdHlwZS5fZG9DbGVhbnVwID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3RyYW5zcG9ydC5kb0NsZWFudXAoKTtcbn07XG5cbnV0aWxzLnBhcmVudF9vcmlnaW4gPSB1bmRlZmluZWQ7XG5cblNvY2tKUy5ib290c3RyYXBfaWZyYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZhY2FkZTtcbiAgICBjdXJyX3dpbmRvd19pZCA9IF9kb2N1bWVudC5sb2NhdGlvbi5oYXNoLnNsaWNlKDEpO1xuICAgIHZhciBvbk1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmKGUuc291cmNlICE9PSBwYXJlbnQpIHJldHVybjtcbiAgICAgICAgaWYodHlwZW9mIHV0aWxzLnBhcmVudF9vcmlnaW4gPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgdXRpbHMucGFyZW50X29yaWdpbiA9IGUub3JpZ2luO1xuICAgICAgICBpZiAoZS5vcmlnaW4gIT09IHV0aWxzLnBhcmVudF9vcmlnaW4pIHJldHVybjtcblxuICAgICAgICB2YXIgd2luZG93X2lkID0gZS5kYXRhLnNsaWNlKDAsIDgpO1xuICAgICAgICB2YXIgdHlwZSA9IGUuZGF0YS5zbGljZSg4LCA5KTtcbiAgICAgICAgdmFyIGRhdGEgPSBlLmRhdGEuc2xpY2UoOSk7XG4gICAgICAgIGlmICh3aW5kb3dfaWQgIT09IGN1cnJfd2luZG93X2lkKSByZXR1cm47XG4gICAgICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICAgICAgdmFyIHAgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSBwWzBdO1xuICAgICAgICAgICAgdmFyIHByb3RvY29sID0gcFsxXTtcbiAgICAgICAgICAgIHZhciB0cmFuc191cmwgPSBwWzJdO1xuICAgICAgICAgICAgdmFyIGJhc2VfdXJsID0gcFszXTtcbiAgICAgICAgICAgIGlmICh2ZXJzaW9uICE9PSBTb2NrSlMudmVyc2lvbikge1xuICAgICAgICAgICAgICAgIHV0aWxzLmxvZyhcIkluY29tcGF0aWJpbGUgU29ja0pTISBNYWluIHNpdGUgdXNlczpcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFxcXCJcIiArIHZlcnNpb24gKyBcIlxcXCIsIHRoZSBpZnJhbWU6XCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcXFwiXCIgKyBTb2NrSlMudmVyc2lvbiArIFwiXFxcIi5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXV0aWxzLmZsYXRVcmwodHJhbnNfdXJsKSB8fCAhdXRpbHMuZmxhdFVybChiYXNlX3VybCkpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coXCJPbmx5IGJhc2ljIHVybHMgYXJlIHN1cHBvcnRlZCBpbiBTb2NrSlNcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXV0aWxzLmlzU2FtZU9yaWdpblVybCh0cmFuc191cmwpIHx8XG4gICAgICAgICAgICAgICAgIXV0aWxzLmlzU2FtZU9yaWdpblVybChiYXNlX3VybCkpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coXCJDYW4ndCBjb25uZWN0IHRvIGRpZmZlcmVudCBkb21haW4gZnJvbSB3aXRoaW4gYW4gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBcImlmcmFtZS4gKFwiICsgSlNPTi5zdHJpbmdpZnkoW193aW5kb3cubG9jYXRpb24uaHJlZiwgdHJhbnNfdXJsLCBiYXNlX3VybF0pICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXCIpXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZhY2FkZSA9IG5ldyBGYWNhZGVKUygpO1xuICAgICAgICAgICAgZmFjYWRlLl90cmFuc3BvcnQgPSBuZXcgRmFjYWRlSlNbcHJvdG9jb2xdKGZhY2FkZSwgdHJhbnNfdXJsLCBiYXNlX3VybCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgICAgICBmYWNhZGUuX2RvU2VuZChkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjJzpcbiAgICAgICAgICAgIGlmIChmYWNhZGUpXG4gICAgICAgICAgICAgICAgZmFjYWRlLl9kb0NsZWFudXAoKTtcbiAgICAgICAgICAgIGZhY2FkZSA9IG51bGw7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBhbGVydCgndGVzdCB0aWNrZXInKTtcbiAgICAvLyBmYWNhZGUgPSBuZXcgRmFjYWRlSlMoKTtcbiAgICAvLyBmYWNhZGUuX3RyYW5zcG9ydCA9IG5ldyBGYWNhZGVKU1sndy1pZnJhbWUteGhyLXBvbGxpbmcnXShmYWNhZGUsICdodHRwOi8vaG9zdC5jb206OTk5OS90aWNrZXIvMTIvYmFzZCcpO1xuXG4gICAgdXRpbHMuYXR0YWNoTWVzc2FnZShvbk1lc3NhZ2UpO1xuXG4gICAgLy8gU3RhcnRcbiAgICBwb3N0TWVzc2FnZSgncycpO1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtaWZyYW1lLXdpdGhpbi5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvaW5mby5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIEluZm9SZWNlaXZlciA9IGZ1bmN0aW9uKGJhc2VfdXJsLCBBamF4T2JqZWN0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHV0aWxzLmRlbGF5KGZ1bmN0aW9uKCl7dGhhdC5kb1hocihiYXNlX3VybCwgQWpheE9iamVjdCk7fSk7XG59O1xuXG5JbmZvUmVjZWl2ZXIucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcihbJ2ZpbmlzaCddKTtcblxuSW5mb1JlY2VpdmVyLnByb3RvdHlwZS5kb1hociA9IGZ1bmN0aW9uKGJhc2VfdXJsLCBBamF4T2JqZWN0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciB0MCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgdmFyIHhvID0gbmV3IEFqYXhPYmplY3QoJ0dFVCcsIGJhc2VfdXJsICsgJy9pbmZvJyk7XG5cbiAgICB2YXIgdHJlZiA9IHV0aWxzLmRlbGF5KDgwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpe3hvLm9udGltZW91dCgpO30pO1xuXG4gICAgeG8ub25maW5pc2ggPSBmdW5jdGlvbihzdGF0dXMsIHRleHQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRyZWYpO1xuICAgICAgICB0cmVmID0gbnVsbDtcbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICB2YXIgcnR0ID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSAtIHQwO1xuICAgICAgICAgICAgdmFyIGluZm8gPSBKU09OLnBhcnNlKHRleHQpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbmZvICE9PSAnb2JqZWN0JykgaW5mbyA9IHt9O1xuICAgICAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCBpbmZvLCBydHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgeG8ub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHhvLmNsb3NlKCk7XG4gICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJyk7XG4gICAgfTtcbn07XG5cbnZhciBJbmZvUmVjZWl2ZXJJZnJhbWUgPSBmdW5jdGlvbihiYXNlX3VybCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgZ28gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlmciA9IG5ldyBJZnJhbWVUcmFuc3BvcnQoKTtcbiAgICAgICAgaWZyLnByb3RvY29sID0gJ3ctaWZyYW1lLWluZm8tcmVjZWl2ZXInO1xuICAgICAgICB2YXIgZnVuID0gZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByID09PSAnc3RyaW5nJyAmJiByLnN1YnN0cigwLDEpID09PSAnbScpIHtcbiAgICAgICAgICAgICAgICB2YXIgZCA9IEpTT04ucGFyc2Uoci5zdWJzdHIoMSkpO1xuICAgICAgICAgICAgICAgIHZhciBpbmZvID0gZFswXSwgcnR0ID0gZFsxXTtcbiAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIGluZm8sIHJ0dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZnIuZG9DbGVhbnVwKCk7XG4gICAgICAgICAgICBpZnIgPSBudWxsO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgbW9ja19yaSA9IHtcbiAgICAgICAgICAgIF9vcHRpb25zOiB7fSxcbiAgICAgICAgICAgIF9kaWRDbG9zZTogZnVuLFxuICAgICAgICAgICAgX2RpZE1lc3NhZ2U6IGZ1blxuICAgICAgICB9O1xuICAgICAgICBpZnIuaV9jb25zdHJ1Y3Rvcihtb2NrX3JpLCBiYXNlX3VybCwgYmFzZV91cmwpO1xuICAgIH1cbiAgICBpZighX2RvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgdXRpbHMuYXR0YWNoRXZlbnQoJ2xvYWQnLCBnbyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ28oKTtcbiAgICB9XG59O1xuSW5mb1JlY2VpdmVySWZyYW1lLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoWydmaW5pc2gnXSk7XG5cblxudmFyIEluZm9SZWNlaXZlckZha2UgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBJdCBtYXkgbm90IGJlIHBvc3NpYmxlIHRvIGRvIGNyb3NzIGRvbWFpbiBBSkFYIHRvIGdldCB0aGUgaW5mb1xuICAgIC8vIGRhdGEsIGZvciBleGFtcGxlIGZvciBJRTcuIEJ1dCB3ZSB3YW50IHRvIHJ1biBKU09OUCwgc28gbGV0J3NcbiAgICAvLyBmYWtlIHRoZSByZXNwb25zZSwgd2l0aCBydHQ9MnMgKHJ0bz02cykuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHV0aWxzLmRlbGF5KGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIHt9LCAyMDAwKTtcbiAgICB9KTtcbn07XG5JbmZvUmVjZWl2ZXJGYWtlLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoWydmaW5pc2gnXSk7XG5cbnZhciBjcmVhdGVJbmZvUmVjZWl2ZXIgPSBmdW5jdGlvbihiYXNlX3VybCkge1xuICAgIGlmICh1dGlscy5pc1NhbWVPcmlnaW5VcmwoYmFzZV91cmwpKSB7XG4gICAgICAgIC8vIElmLCBmb3Igc29tZSByZWFzb24sIHdlIGhhdmUgU29ja0pTIGxvY2FsbHkgLSB0aGVyZSdzIG5vXG4gICAgICAgIC8vIG5lZWQgdG8gc3RhcnQgdXAgdGhlIGNvbXBsZXggbWFjaGluZXJ5LiBKdXN0IHVzZSBhamF4LlxuICAgICAgICByZXR1cm4gbmV3IEluZm9SZWNlaXZlcihiYXNlX3VybCwgdXRpbHMuWEhSTG9jYWxPYmplY3QpO1xuICAgIH1cbiAgICBzd2l0Y2ggKHV0aWxzLmlzWEhSQ29yc0NhcGFibGUoKSkge1xuICAgIGNhc2UgMTpcbiAgICAgICAgcmV0dXJuIG5ldyBJbmZvUmVjZWl2ZXIoYmFzZV91cmwsIHV0aWxzLlhIUkNvcnNPYmplY3QpO1xuICAgIGNhc2UgMjpcbiAgICAgICAgcmV0dXJuIG5ldyBJbmZvUmVjZWl2ZXIoYmFzZV91cmwsIHV0aWxzLlhEUk9iamVjdCk7XG4gICAgY2FzZSAzOlxuICAgICAgICAvLyBPcGVyYVxuICAgICAgICByZXR1cm4gbmV3IEluZm9SZWNlaXZlcklmcmFtZShiYXNlX3VybCk7XG4gICAgZGVmYXVsdDpcbiAgICAgICAgLy8gSUUgN1xuICAgICAgICByZXR1cm4gbmV3IEluZm9SZWNlaXZlckZha2UoKTtcbiAgICB9O1xufTtcblxuXG52YXIgV0luZm9SZWNlaXZlcklmcmFtZSA9IEZhY2FkZUpTWyd3LWlmcmFtZS1pbmZvLXJlY2VpdmVyJ10gPSBmdW5jdGlvbihyaSwgX3RyYW5zX3VybCwgYmFzZV91cmwpIHtcbiAgICB2YXIgaXIgPSBuZXcgSW5mb1JlY2VpdmVyKGJhc2VfdXJsLCB1dGlscy5YSFJMb2NhbE9iamVjdCk7XG4gICAgaXIub25maW5pc2ggPSBmdW5jdGlvbihpbmZvLCBydHQpIHtcbiAgICAgICAgcmkuX2RpZE1lc3NhZ2UoJ20nK0pTT04uc3RyaW5naWZ5KFtpbmZvLCBydHRdKSk7XG4gICAgICAgIHJpLl9kaWRDbG9zZSgpO1xuICAgIH1cbn07XG5XSW5mb1JlY2VpdmVySWZyYW1lLnByb3RvdHlwZS5kb0NsZWFudXAgPSBmdW5jdGlvbigpIHt9O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9pbmZvLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1pZnJhbWUtZXZlbnRzb3VyY2UuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBFdmVudFNvdXJjZUlmcmFtZVRyYW5zcG9ydCA9IFNvY2tKU1snaWZyYW1lLWV2ZW50c291cmNlJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucHJvdG9jb2wgPSAndy1pZnJhbWUtZXZlbnRzb3VyY2UnO1xuICAgIHRoYXQuaV9jb25zdHJ1Y3Rvci5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xufTtcblxuRXZlbnRTb3VyY2VJZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IElmcmFtZVRyYW5zcG9ydCgpO1xuXG5FdmVudFNvdXJjZUlmcmFtZVRyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoJ0V2ZW50U291cmNlJyBpbiBfd2luZG93KSAmJiBJZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCgpO1xufTtcblxuRXZlbnRTb3VyY2VJZnJhbWVUcmFuc3BvcnQubmVlZF9ib2R5ID0gdHJ1ZTtcbkV2ZW50U291cmNlSWZyYW1lVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAzOyAvLyBodG1sLCBqYXZhc2NyaXB0LCBldmVudHNvdXJjZVxuXG5cbi8vIHctaWZyYW1lLWV2ZW50c291cmNlXG52YXIgRXZlbnRTb3VyY2VUcmFuc3BvcnQgPSBGYWNhZGVKU1sndy1pZnJhbWUtZXZlbnRzb3VyY2UnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL2V2ZW50c291cmNlJywgRXZlbnRTb3VyY2VSZWNlaXZlciwgdXRpbHMuWEhSTG9jYWxPYmplY3QpO1xufVxuRXZlbnRTb3VyY2VUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1pZnJhbWUtZXZlbnRzb3VyY2UuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWlmcmFtZS14aHItcG9sbGluZy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIFhoclBvbGxpbmdJZnJhbWVUcmFuc3BvcnQgPSBTb2NrSlNbJ2lmcmFtZS14aHItcG9sbGluZyddID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnByb3RvY29sID0gJ3ctaWZyYW1lLXhoci1wb2xsaW5nJztcbiAgICB0aGF0LmlfY29uc3RydWN0b3IuYXBwbHkodGhhdCwgYXJndW1lbnRzKTtcbn07XG5cblhoclBvbGxpbmdJZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IElmcmFtZVRyYW5zcG9ydCgpO1xuXG5YaHJQb2xsaW5nSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF93aW5kb3cuWE1MSHR0cFJlcXVlc3QgJiYgSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQoKTtcbn07XG5cblhoclBvbGxpbmdJZnJhbWVUcmFuc3BvcnQubmVlZF9ib2R5ID0gdHJ1ZTtcblhoclBvbGxpbmdJZnJhbWVUcmFuc3BvcnQucm91bmRUcmlwcyA9IDM7IC8vIGh0bWwsIGphdmFzY3JpcHQsIHhoclxuXG5cbi8vIHctaWZyYW1lLXhoci1wb2xsaW5nXG52YXIgWGhyUG9sbGluZ0lUcmFuc3BvcnQgPSBGYWNhZGVKU1sndy1pZnJhbWUteGhyLXBvbGxpbmcnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL3hocicsIFhoclJlY2VpdmVyLCB1dGlscy5YSFJMb2NhbE9iamVjdCk7XG59O1xuXG5YaHJQb2xsaW5nSVRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQWpheEJhc2VkVHJhbnNwb3J0KCk7XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLWlmcmFtZS14aHItcG9sbGluZy5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtaWZyYW1lLWh0bWxmaWxlLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vLyBUaGlzIHRyYW5zcG9ydCBnZW5lcmFsbHkgd29ya3MgaW4gYW55IGJyb3dzZXIsIGJ1dCB3aWxsIGNhdXNlIGFcbi8vIHNwaW5uaW5nIGN1cnNvciB0byBhcHBlYXIgaW4gYW55IGJyb3dzZXIgb3RoZXIgdGhhbiBJRS5cbi8vIFdlIG1heSB0ZXN0IHRoaXMgdHJhbnNwb3J0IGluIGFsbCBicm93c2VycyAtIHdoeSBub3QsIGJ1dCBpblxuLy8gcHJvZHVjdGlvbiBpdCBzaG91bGQgYmUgb25seSBydW4gaW4gSUUuXG5cbnZhciBIdG1sRmlsZUlmcmFtZVRyYW5zcG9ydCA9IFNvY2tKU1snaWZyYW1lLWh0bWxmaWxlJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucHJvdG9jb2wgPSAndy1pZnJhbWUtaHRtbGZpbGUnO1xuICAgIHRoYXQuaV9jb25zdHJ1Y3Rvci5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xufTtcblxuLy8gSW5oZXJpdGFuY2UuXG5IdG1sRmlsZUlmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgSWZyYW1lVHJhbnNwb3J0KCk7XG5cbkh0bWxGaWxlSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQoKTtcbn07XG5cbkh0bWxGaWxlSWZyYW1lVHJhbnNwb3J0Lm5lZWRfYm9keSA9IHRydWU7XG5IdG1sRmlsZUlmcmFtZVRyYW5zcG9ydC5yb3VuZFRyaXBzID0gMzsgLy8gaHRtbCwgamF2YXNjcmlwdCwgaHRtbGZpbGVcblxuXG4vLyB3LWlmcmFtZS1odG1sZmlsZVxudmFyIEh0bWxGaWxlVHJhbnNwb3J0ID0gRmFjYWRlSlNbJ3ctaWZyYW1lLWh0bWxmaWxlJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy9odG1sZmlsZScsIEh0bWxmaWxlUmVjZWl2ZXIsIHV0aWxzLlhIUkxvY2FsT2JqZWN0KTtcbn07XG5IdG1sRmlsZVRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQWpheEJhc2VkVHJhbnNwb3J0KCk7XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLWlmcmFtZS1odG1sZmlsZS5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtcG9sbGluZy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIFBvbGxpbmcgPSBmdW5jdGlvbihyaSwgUmVjZWl2ZXIsIHJlY3ZfdXJsLCBBamF4T2JqZWN0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucmkgPSByaTtcbiAgICB0aGF0LlJlY2VpdmVyID0gUmVjZWl2ZXI7XG4gICAgdGhhdC5yZWN2X3VybCA9IHJlY3ZfdXJsO1xuICAgIHRoYXQuQWpheE9iamVjdCA9IEFqYXhPYmplY3Q7XG4gICAgdGhhdC5fc2NoZWR1bGVSZWN2KCk7XG59O1xuXG5Qb2xsaW5nLnByb3RvdHlwZS5fc2NoZWR1bGVSZWN2ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBwb2xsID0gdGhhdC5wb2xsID0gbmV3IHRoYXQuUmVjZWl2ZXIodGhhdC5yZWN2X3VybCwgdGhhdC5BamF4T2JqZWN0KTtcbiAgICB2YXIgbXNnX2NvdW50ZXIgPSAwO1xuICAgIHBvbGwub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBtc2dfY291bnRlciArPSAxO1xuICAgICAgICB0aGF0LnJpLl9kaWRNZXNzYWdlKGUuZGF0YSk7XG4gICAgfTtcbiAgICBwb2xsLm9uY2xvc2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoYXQucG9sbCA9IHBvbGwgPSBwb2xsLm9ubWVzc2FnZSA9IHBvbGwub25jbG9zZSA9IG51bGw7XG4gICAgICAgIGlmICghdGhhdC5wb2xsX2lzX2Nsb3NpbmcpIHtcbiAgICAgICAgICAgIGlmIChlLnJlYXNvbiA9PT0gJ3Blcm1hbmVudCcpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnJpLl9kaWRDbG9zZSgxMDA2LCAnUG9sbGluZyBlcnJvciAoJyArIGUucmVhc29uICsgJyknKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhhdC5fc2NoZWR1bGVSZWN2KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuUG9sbGluZy5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5wb2xsX2lzX2Nsb3NpbmcgPSB0cnVlO1xuICAgIGlmICh0aGF0LnBvbGwpIHtcbiAgICAgICAgdGhhdC5wb2xsLmFib3J0KCk7XG4gICAgfVxufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtcG9sbGluZy5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtcmVjZWl2ZXItZXZlbnRzb3VyY2UuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBFdmVudFNvdXJjZVJlY2VpdmVyID0gZnVuY3Rpb24odXJsKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBlcyA9IG5ldyBFdmVudFNvdXJjZSh1cmwpO1xuICAgIGVzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnbWVzc2FnZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeydkYXRhJzogdW5lc2NhcGUoZS5kYXRhKX0pKTtcbiAgICB9O1xuICAgIHRoYXQuZXNfY2xvc2UgPSBlcy5vbmVycm9yID0gZnVuY3Rpb24oZSwgYWJvcnRfcmVhc29uKSB7XG4gICAgICAgIC8vIEVTIG9uIHJlY29ubmVjdGlvbiBoYXMgcmVhZHlTdGF0ZSA9IDAgb3IgMS5cbiAgICAgICAgLy8gb24gbmV0d29yayBlcnJvciBpdCdzIENMT1NFRCA9IDJcbiAgICAgICAgdmFyIHJlYXNvbiA9IGFib3J0X3JlYXNvbiA/ICd1c2VyJyA6XG4gICAgICAgICAgICAoZXMucmVhZHlTdGF0ZSAhPT0gMiA/ICduZXR3b3JrJyA6ICdwZXJtYW5lbnQnKTtcbiAgICAgICAgdGhhdC5lc19jbG9zZSA9IGVzLm9ubWVzc2FnZSA9IGVzLm9uZXJyb3IgPSBudWxsO1xuICAgICAgICAvLyBFdmVudFNvdXJjZSByZWNvbm5lY3RzIGF1dG9tYXRpY2FsbHkuXG4gICAgICAgIGVzLmNsb3NlKCk7XG4gICAgICAgIGVzID0gbnVsbDtcbiAgICAgICAgLy8gU2FmYXJpIGFuZCBjaHJvbWUgPCAxNSBjcmFzaCBpZiB3ZSBjbG9zZSB3aW5kb3cgYmVmb3JlXG4gICAgICAgIC8vIHdhaXRpbmcgZm9yIEVTIGNsZWFudXAuIFNlZTpcbiAgICAgICAgLy8gICBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9ODkxNTVcbiAgICAgICAgdXRpbHMuZGVsYXkoMjAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ2Nsb3NlJywge3JlYXNvbjogcmVhc29ufSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICB9O1xufTtcblxuRXZlbnRTb3VyY2VSZWNlaXZlci5wcm90b3R5cGUgPSBuZXcgUkV2ZW50VGFyZ2V0KCk7XG5cbkV2ZW50U291cmNlUmVjZWl2ZXIucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LmVzX2Nsb3NlKSB7XG4gICAgICAgIHRoYXQuZXNfY2xvc2Uoe30sIHRydWUpO1xuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXJlY2VpdmVyLWV2ZW50c291cmNlLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1yZWNlaXZlci1odG1sZmlsZS5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIF9pc19pZV9odG1sZmlsZV9jYXBhYmxlO1xudmFyIGlzSWVIdG1sZmlsZUNhcGFibGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoX2lzX2llX2h0bWxmaWxlX2NhcGFibGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoJ0FjdGl2ZVhPYmplY3QnIGluIF93aW5kb3cpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgX2lzX2llX2h0bWxmaWxlX2NhcGFibGUgPSAhIW5ldyBBY3RpdmVYT2JqZWN0KCdodG1sZmlsZScpO1xuICAgICAgICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9pc19pZV9odG1sZmlsZV9jYXBhYmxlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF9pc19pZV9odG1sZmlsZV9jYXBhYmxlO1xufTtcblxuXG52YXIgSHRtbGZpbGVSZWNlaXZlciA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB1dGlscy5wb2xsdXRlR2xvYmFsTmFtZXNwYWNlKCk7XG5cbiAgICB0aGF0LmlkID0gJ2EnICsgdXRpbHMucmFuZG9tX3N0cmluZyg2LCAyNik7XG4gICAgdXJsICs9ICgodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gJz8nIDogJyYnKSArXG4gICAgICAgICdjPScgKyBlc2NhcGUoV1ByZWZpeCArICcuJyArIHRoYXQuaWQpO1xuXG4gICAgdmFyIGNvbnN0cnVjdG9yID0gaXNJZUh0bWxmaWxlQ2FwYWJsZSgpID9cbiAgICAgICAgdXRpbHMuY3JlYXRlSHRtbGZpbGUgOiB1dGlscy5jcmVhdGVJZnJhbWU7XG5cbiAgICB2YXIgaWZyYW1lT2JqO1xuICAgIF93aW5kb3dbV1ByZWZpeF1bdGhhdC5pZF0gPSB7XG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZnJhbWVPYmoubG9hZGVkKCk7XG4gICAgICAgIH0sXG4gICAgICAgIG1lc3NhZ2U6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdtZXNzYWdlJywgeydkYXRhJzogZGF0YX0pKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhhdC5pZnJhbWVfY2xvc2Uoe30sICduZXR3b3JrJyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoYXQuaWZyYW1lX2Nsb3NlID0gZnVuY3Rpb24oZSwgYWJvcnRfcmVhc29uKSB7XG4gICAgICAgIGlmcmFtZU9iai5jbGVhbnVwKCk7XG4gICAgICAgIHRoYXQuaWZyYW1lX2Nsb3NlID0gaWZyYW1lT2JqID0gbnVsbDtcbiAgICAgICAgZGVsZXRlIF93aW5kb3dbV1ByZWZpeF1bdGhhdC5pZF07XG4gICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ2Nsb3NlJywge3JlYXNvbjogYWJvcnRfcmVhc29ufSkpO1xuICAgIH07XG4gICAgaWZyYW1lT2JqID0gY29uc3RydWN0b3IodXJsLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuaWZyYW1lX2Nsb3NlKHt9LCAncGVybWFuZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG59O1xuXG5IdG1sZmlsZVJlY2VpdmVyLnByb3RvdHlwZSA9IG5ldyBSRXZlbnRUYXJnZXQoKTtcblxuSHRtbGZpbGVSZWNlaXZlci5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQuaWZyYW1lX2Nsb3NlKSB7XG4gICAgICAgIHRoYXQuaWZyYW1lX2Nsb3NlKHt9LCAndXNlcicpO1xuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXJlY2VpdmVyLWh0bWxmaWxlLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1yZWNlaXZlci14aHIuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBYaHJSZWNlaXZlciA9IGZ1bmN0aW9uKHVybCwgQWpheE9iamVjdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgYnVmX3BvcyA9IDA7XG5cbiAgICB0aGF0LnhvID0gbmV3IEFqYXhPYmplY3QoJ1BPU1QnLCB1cmwsIG51bGwpO1xuICAgIHRoYXQueG8ub25jaHVuayA9IGZ1bmN0aW9uKHN0YXR1cywgdGV4dCkge1xuICAgICAgICBpZiAoc3RhdHVzICE9PSAyMDApIHJldHVybjtcbiAgICAgICAgd2hpbGUgKDEpIHtcbiAgICAgICAgICAgIHZhciBidWYgPSB0ZXh0LnNsaWNlKGJ1Zl9wb3MpO1xuICAgICAgICAgICAgdmFyIHAgPSBidWYuaW5kZXhPZignXFxuJyk7XG4gICAgICAgICAgICBpZiAocCA9PT0gLTEpIGJyZWFrO1xuICAgICAgICAgICAgYnVmX3BvcyArPSBwKzE7XG4gICAgICAgICAgICB2YXIgbXNnID0gYnVmLnNsaWNlKDAsIHApO1xuICAgICAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnbWVzc2FnZScsIHtkYXRhOiBtc2d9KSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoYXQueG8ub25maW5pc2ggPSBmdW5jdGlvbihzdGF0dXMsIHRleHQpIHtcbiAgICAgICAgdGhhdC54by5vbmNodW5rKHN0YXR1cywgdGV4dCk7XG4gICAgICAgIHRoYXQueG8gPSBudWxsO1xuICAgICAgICB2YXIgcmVhc29uID0gc3RhdHVzID09PSAyMDAgPyAnbmV0d29yaycgOiAncGVybWFuZW50JztcbiAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnY2xvc2UnLCB7cmVhc29uOiByZWFzb259KSk7XG4gICAgfVxufTtcblxuWGhyUmVjZWl2ZXIucHJvdG90eXBlID0gbmV3IFJFdmVudFRhcmdldCgpO1xuXG5YaHJSZWNlaXZlci5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQueG8pIHtcbiAgICAgICAgdGhhdC54by5jbG9zZSgpO1xuICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdjbG9zZScsIHtyZWFzb246ICd1c2VyJ30pKTtcbiAgICAgICAgdGhhdC54byA9IG51bGw7XG4gICAgfVxufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtcmVjZWl2ZXIteGhyLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90ZXN0LWhvb2tzLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vLyBGb3IgdGVzdGluZ1xuU29ja0pTLmdldFV0aWxzID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gdXRpbHM7XG59O1xuXG5Tb2NrSlMuZ2V0SWZyYW1lVHJhbnNwb3J0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gSWZyYW1lVHJhbnNwb3J0O1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdGVzdC1ob29rcy5qc1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm4gU29ja0pTO1xuICAgICAgICAgIH0pKCk7XG5pZiAoJ19zb2NranNfb25sb2FkJyBpbiB3aW5kb3cpIHNldFRpbWVvdXQoX3NvY2tqc19vbmxvYWQsIDEpO1xuXG4vLyBBTUQgY29tcGxpYW5jZVxuaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZSgnc29ja2pzJywgW10sIGZ1bmN0aW9uKCl7cmV0dXJuIFNvY2tKUzt9KTtcbn1cblxuaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gU29ja0pTO1xufVxuLy8gICAgIFsqXSBFbmQgb2YgbGliL2luZGV4LmpzXG5cbi8vIFsqXSBFbmQgb2YgbGliL2FsbC5qc1xuXG5cbn0pKCkiLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDEyIE1hdGhpZXUgVHVyY290dGVcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG52YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuLyoqXG4gKiBCYWNrb2ZmIGRyaXZlci5cbiAqIEBwYXJhbSBiYWNrb2ZmU3RyYXRlZ3kgQmFja29mZiBkZWxheSBnZW5lcmF0b3Ivc3RyYXRlZ3kuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQmFja29mZihiYWNrb2ZmU3RyYXRlZ3kpIHtcbiAgICBldmVudHMuRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgICB0aGlzLmJhY2tvZmZTdHJhdGVneV8gPSBiYWNrb2ZmU3RyYXRlZ3k7XG4gICAgdGhpcy5iYWNrb2ZmTnVtYmVyXyA9IDA7XG4gICAgdGhpcy5iYWNrb2ZmRGVsYXlfID0gMDtcbiAgICB0aGlzLnRpbWVvdXRJRF8gPSAtMTtcblxuICAgIHRoaXMuaGFuZGxlcnMgPSB7XG4gICAgICAgIGJhY2tvZmY6IHRoaXMub25CYWNrb2ZmXy5iaW5kKHRoaXMpXG4gICAgfTtcbn1cbnV0aWwuaW5oZXJpdHMoQmFja29mZiwgZXZlbnRzLkV2ZW50RW1pdHRlcik7XG5cbi8qKlxuICogU3RhcnRzIGEgYmFja29mZiBvcGVyYXRpb24uXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLmJhY2tvZmYgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy50aW1lb3V0SURfICE9PSAtMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JhY2tvZmYgaW4gcHJvZ3Jlc3MuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5iYWNrb2ZmRGVsYXlfID0gdGhpcy5iYWNrb2ZmU3RyYXRlZ3lfLm5leHQoKTtcbiAgICB0aGlzLnRpbWVvdXRJRF8gPSBzZXRUaW1lb3V0KHRoaXMuaGFuZGxlcnMuYmFja29mZiwgdGhpcy5iYWNrb2ZmRGVsYXlfKTtcbiAgICB0aGlzLmVtaXQoJ2JhY2tvZmYnLCB0aGlzLmJhY2tvZmZOdW1iZXJfLCB0aGlzLmJhY2tvZmZEZWxheV8pO1xufTtcblxuLyoqXG4gKiBCYWNrb2ZmIGNvbXBsZXRpb24gaGFuZGxlci5cbiAqIEBwcml2YXRlXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLm9uQmFja29mZl8gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRpbWVvdXRJRF8gPSAtMTtcbiAgICB0aGlzLmVtaXQoJ3JlYWR5JywgdGhpcy5iYWNrb2ZmTnVtYmVyXysrLCB0aGlzLmJhY2tvZmZEZWxheV8pO1xufTtcblxuLyoqXG4gKiBTdG9wcyBhbnkgYmFja29mZiBvcGVyYXRpb24gYW5kIHJlc2V0cyB0aGUgYmFja29mZlxuICogZGVsYXkgdG8gaXRzIGluaXRhbCB2YWx1ZS5cbiAqL1xuQmFja29mZi5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJhY2tvZmZOdW1iZXJfID0gMDtcbiAgICB0aGlzLmJhY2tvZmZTdHJhdGVneV8ucmVzZXQoKTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SURfKTtcbiAgICB0aGlzLnRpbWVvdXRJRF8gPSAtMTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja29mZjtcblxuIiwiOyhmdW5jdGlvbiAoKSB7XG5cbmZ1bmN0aW9uIGgoKSB7XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpLCBlID0gbnVsbFxuICBmdW5jdGlvbiBpdGVtIChsKSB7XG4gICAgXG4gICAgZnVuY3Rpb24gcGFyc2VDbGFzcyAoc3RyaW5nKSB7XG4gICAgICB2YXIgbSA9IHN0cmluZy5zcGxpdCgvKFtcXC4jXT9bYS16QS1aMC05Xy1dKykvKVxuICAgICAgbS5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHZhciBzID0gdi5zdWJzdHJpbmcoMSx2Lmxlbmd0aClcbiAgICAgICAgaWYoIXYpIHJldHVybiBcbiAgICAgICAgaWYoIWUpXG4gICAgICAgICAgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodilcbiAgICAgICAgZWxzZSBpZiAodlswXSA9PT0gJy4nKVxuICAgICAgICAgIGUuY2xhc3NMaXN0LmFkZChzKVxuICAgICAgICBlbHNlIGlmICh2WzBdID09PSAnIycpXG4gICAgICAgICAgZS5zZXRBdHRyaWJ1dGUoJ2lkJywgcylcbiAgICAgICAgXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmKGwgPT0gbnVsbClcbiAgICAgIDtcbiAgICBlbHNlIGlmKCdzdHJpbmcnID09PSB0eXBlb2YgbCkge1xuICAgICAgaWYoIWUpXG4gICAgICAgIHBhcnNlQ2xhc3MobClcbiAgICAgIGVsc2VcbiAgICAgICAgZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShsKSlcbiAgICB9XG4gICAgZWxzZSBpZignbnVtYmVyJyA9PT0gdHlwZW9mIGwgXG4gICAgICB8fCAnYm9vbGVhbicgPT09IHR5cGVvZiBsXG4gICAgICB8fCBsIGluc3RhbmNlb2YgRGF0ZSBcbiAgICAgIHx8IGwgaW5zdGFuY2VvZiBSZWdFeHAgKSB7XG4gICAgICAgIGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobC50b1N0cmluZygpKSlcbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShsKSlcbiAgICAgIGwuZm9yRWFjaChpdGVtKVxuICAgIGVsc2UgaWYobCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KVxuICAgICAgZS5hcHBlbmRDaGlsZChsKVxuICAgIGVsc2UgaWYgKCdvYmplY3QnID09PSB0eXBlb2YgbCkge1xuICAgICAgZm9yICh2YXIgayBpbiBsKSB7XG4gICAgICAgIGlmKCdmdW5jdGlvbicgPT09IHR5cGVvZiBsW2tdKVxuICAgICAgICAgIGUuYWRkRXZlbnRMaXN0ZW5lcihrLCBsW2tdKVxuICAgICAgICBlbHNlIGlmKGsgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICBmb3IgKHZhciBzIGluIGxba10pXG4gICAgICAgICAgICBlLnN0eWxlLnNldFByb3BlcnR5KHMsIGxba11bc10pXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGUuc2V0QXR0cmlidXRlKGssIGxba10pXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdoaWxlKGFyZ3MubGVuZ3RoKSB7XG4gICAgaXRlbShhcmdzLnNoaWZ0KCkpXG4gIH1cbiAgcmV0dXJuIGVcbn1cblxuaWYodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG4gIG1vZHVsZS5leHBvcnRzID0gaFxuZWxzZVxuICB0aGlzLmggPSBoXG59KSgpXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDEyIE1hdGhpZXUgVHVyY290dGVcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxudmFyIEJhY2tvZmZTdHJhdGVneSA9IHJlcXVpcmUoJy4vc3RyYXRlZ3knKTtcblxuLyoqXG4gKiBGaWJvbmFjY2kgYmFja29mZiBzdHJhdGVneS5cbiAqIEBleHRlbmRzIEJhY2tvZmZTdHJhdGVneVxuICovXG5mdW5jdGlvbiBGaWJvbmFjY2lCYWNrb2ZmU3RyYXRlZ3kob3B0aW9ucykge1xuICAgIEJhY2tvZmZTdHJhdGVneS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIHRoaXMuYmFja29mZkRlbGF5XyA9IDA7XG4gICAgdGhpcy5uZXh0QmFja29mZkRlbGF5XyA9IHRoaXMuZ2V0SW5pdGlhbERlbGF5KCk7XG59XG51dGlsLmluaGVyaXRzKEZpYm9uYWNjaUJhY2tvZmZTdHJhdGVneSwgQmFja29mZlN0cmF0ZWd5KTtcblxuLyoqIEBpbmhlcml0RG9jICovXG5GaWJvbmFjY2lCYWNrb2ZmU3RyYXRlZ3kucHJvdG90eXBlLm5leHRfID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJhY2tvZmZEZWxheSA9IE1hdGgubWluKHRoaXMubmV4dEJhY2tvZmZEZWxheV8sIHRoaXMuZ2V0TWF4RGVsYXkoKSk7XG4gICAgdGhpcy5uZXh0QmFja29mZkRlbGF5XyArPSB0aGlzLmJhY2tvZmZEZWxheV87XG4gICAgdGhpcy5iYWNrb2ZmRGVsYXlfID0gYmFja29mZkRlbGF5O1xuICAgIHJldHVybiBiYWNrb2ZmRGVsYXk7XG59O1xuXG4vKiogQGluaGVyaXREb2MgKi9cbkZpYm9uYWNjaUJhY2tvZmZTdHJhdGVneS5wcm90b3R5cGUucmVzZXRfID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5uZXh0QmFja29mZkRlbGF5XyA9IHRoaXMuZ2V0SW5pdGlhbERlbGF5KCk7XG4gICAgdGhpcy5iYWNrb2ZmRGVsYXlfID0gMDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmlib25hY2NpQmFja29mZlN0cmF0ZWd5O1xuXG4iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDEyIE1hdGhpZXUgVHVyY290dGVcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxudmFyIEJhY2tvZmZTdHJhdGVneSA9IHJlcXVpcmUoJy4vc3RyYXRlZ3knKTtcblxuLyoqXG4gKiBFeHBvbmVudGlhbCBiYWNrb2ZmIHN0cmF0ZWd5LlxuICogQGV4dGVuZHMgQmFja29mZlN0cmF0ZWd5XG4gKi9cbmZ1bmN0aW9uIEV4cG9uZW50aWFsQmFja29mZlN0cmF0ZWd5KG9wdGlvbnMpIHtcbiAgICBCYWNrb2ZmU3RyYXRlZ3kuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLmJhY2tvZmZEZWxheV8gPSAwO1xuICAgIHRoaXMubmV4dEJhY2tvZmZEZWxheV8gPSB0aGlzLmdldEluaXRpYWxEZWxheSgpO1xufVxudXRpbC5pbmhlcml0cyhFeHBvbmVudGlhbEJhY2tvZmZTdHJhdGVneSwgQmFja29mZlN0cmF0ZWd5KTtcblxuLyoqIEBpbmhlcml0RG9jICovXG5FeHBvbmVudGlhbEJhY2tvZmZTdHJhdGVneS5wcm90b3R5cGUubmV4dF8gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJhY2tvZmZEZWxheV8gPSBNYXRoLm1pbih0aGlzLm5leHRCYWNrb2ZmRGVsYXlfLCB0aGlzLmdldE1heERlbGF5KCkpO1xuICAgIHRoaXMubmV4dEJhY2tvZmZEZWxheV8gPSB0aGlzLmJhY2tvZmZEZWxheV8gKiAyO1xuICAgIHJldHVybiB0aGlzLmJhY2tvZmZEZWxheV87XG59O1xuXG4vKiogQGluaGVyaXREb2MgKi9cbkV4cG9uZW50aWFsQmFja29mZlN0cmF0ZWd5LnByb3RvdHlwZS5yZXNldF8gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJhY2tvZmZEZWxheV8gPSAwO1xuICAgIHRoaXMubmV4dEJhY2tvZmZEZWxheV8gPSB0aGlzLmdldEluaXRpYWxEZWxheSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFeHBvbmVudGlhbEJhY2tvZmZTdHJhdGVneTtcblxuIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe3ZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcbnZhciBpID0gcmVxdWlyZSgnaXRlcmF0ZScpXG52YXIgZHVwbGV4ID0gcmVxdWlyZSgnZHVwbGV4JylcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ3V0aWwnKS5pbmhlcml0c1xudmFyIHNlcmlhbGl6ZXIgPSByZXF1aXJlKCdzdHJlYW0tc2VyaWFsaXplcicpXG52YXIgdSA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgdGltZXN0YW1wID0gcmVxdWlyZSgnbW9ub3RvbmljLXRpbWVzdGFtcCcpXG5cbmV4cG9ydHMgPSBcbm1vZHVsZS5leHBvcnRzID0gU2N1dHRsZWJ1dHRcblxuZXhwb3J0cy5jcmVhdGVJRCA9IHUuY3JlYXRlSURcbmV4cG9ydHMudXBkYXRlSXNSZWNlbnQgPSB1LmZpbHRlclxuZXhwb3J0cy5maWx0ZXIgPSB1LmZpbHRlclxuZXhwb3J0cy50aW1lc3RhbXAgPSB0aW1lc3RhbXBcblxuZnVuY3Rpb24gZHV0eU9mU3ViY2xhc3MoKSB7XG4gIHRocm93IG5ldyBFcnJvcignbWV0aG9kIG11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3MnKVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZSAoZGF0YSkge1xuICBpZighKEFycmF5LmlzQXJyYXkoZGF0YSkgXG4gICAgJiYgJ3N0cmluZycgPT09IHR5cGVvZiBkYXRhWzJdXG4gICAgJiYgJ19fcHJvdG9fXycgICAgICE9PSBkYXRhWzJdIC8vVEhJUyBXT1VMRCBCUkVBSyBTVFVGRlxuICAgICYmICdudW1iZXInID09PSB0eXBlb2YgZGF0YVsxXVxuICApKSByZXR1cm4gZmFsc2VcblxuICByZXR1cm4gdHJ1ZVxufVxuXG52YXIgZW1pdCA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdFxuXG5pbmhlcml0cyAoU2N1dHRsZWJ1dHQsIEV2ZW50RW1pdHRlcilcblxuZnVuY3Rpb24gU2N1dHRsZWJ1dHQgKG9wdHMpIHtcblxuICBpZighKHRoaXMgaW5zdGFuY2VvZiBTY3V0dGxlYnV0dCkpIHJldHVybiBuZXcgU2N1dHRsZWJ1dHQob3B0cylcbiAgdmFyIGlkID0gJ3N0cmluZycgPT09IHR5cGVvZiBvcHRzID8gb3B0cyA6IG9wdHMgJiYgb3B0cy5pZFxuICB0aGlzLnNvdXJjZXMgPSB7fVxuICB0aGlzLnNldE1heExpc3RlbmVycyhOdW1iZXIuTUFYX1ZBTFVFKVxuICAvL2NvdW50IGhvdyBtYW55IG90aGVyIGluc3RhbmNlcyB3ZSBhcmUgcmVwbGljYXRpbmcgdG8uXG4gIHRoaXMuX3N0cmVhbXMgPSAwXG4gIGlmKG9wdHMgJiYgb3B0cy5zaWduICYmIG9wdHMudmVyaWZ5KSB7XG4gICAgdGhpcy5zZXRJZChvcHRzLmlkIHx8IG9wdHMuY3JlYXRlSWQoKSlcbiAgICB0aGlzLl9zaWduICAgPSBvcHRzLnNpZ25cbiAgICB0aGlzLl92ZXJpZnkgPSBvcHRzLnZlcmlmeVxuICB9IGVsc2Uge1xuICAgIHRoaXMuc2V0SWQoaWQgfHwgdS5jcmVhdGVJZCgpKVxuICB9XG59XG5cbnZhciBzYiA9IFNjdXR0bGVidXR0LnByb3RvdHlwZVxuXG52YXIgZW1pdCA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdFxuXG5zYi5hcHBseVVwZGF0ZSA9IGR1dHlPZlN1YmNsYXNzXG5zYi5oaXN0b3J5ICAgICAgPSBkdXR5T2ZTdWJjbGFzc1xuXG5zYi5sb2NhbFVwZGF0ZSA9IGZ1bmN0aW9uICh0cngpIHtcbiAgdGhpcy5fdXBkYXRlKFt0cngsIHRpbWVzdGFtcCgpLCB0aGlzLmlkXSlcbiAgcmV0dXJuIHRoaXNcbn1cblxuc2IuX3VwZGF0ZSA9IGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgLy92YWxpZGF0ZWQgd2hlbiBpdCBjb21lcyBpbnRvIHRoZSBzdHJlYW1cbiAgdmFyIHRzID0gdXBkYXRlWzFdXG4gIHZhciBzb3VyY2UgPSB1cGRhdGVbMl1cbiAgLy9pZiB0aGlzIG1lc3NhZ2UgaXMgb2xkIGZvciBpdCdzIHNvdXJjZSxcbiAgLy9pZ25vcmUgaXQuIGl0J3Mgb3V0IG9mIG9yZGVyLlxuICAvL2VhY2ggbm9kZSBtdXN0IGVtaXQgaXQncyBjaGFuZ2VzIGluIG9yZGVyIVxuICBcbiAgdmFyIGxhdGVzdCA9IHRoaXMuc291cmNlc1tzb3VyY2VdXG4gIGlmKGxhdGVzdCAmJiBsYXRlc3QgPj0gdHMpXG4gICAgcmV0dXJuIGVtaXQuY2FsbCh0aGlzLCAnb2xkX2RhdGEnLCB1cGRhdGUpLCBmYWxzZVxuXG4gIHRoaXMuc291cmNlc1tzb3VyY2VdID0gdHNcblxuICB2YXIgc2VsZiA9IHRoaXNcbiAgZnVuY3Rpb24gZGlkVmVyaWZpY2F0aW9uIChlcnIsIHZlcmlmaWVkKSB7XG5cbiAgICAvLyBJJ20gbm90IHN1cmUgaG93IHdoYXQgc2hvdWxkIGhhcHBlbiBpZiBhIGFzeW5jIHZlcmlmaWNhdGlvblxuICAgIC8vIGVycm9ycy4gaWYgaXQncyBhbiBrZXkgbm90IGZvdW5kIC0gdGhhdCBpcyBhIHZlcmlmaWNhdGlvbiBmYWlsLFxuICAgIC8vIG5vdCBhIGVycm9yLiBpZiBpdCdzIGdlbnVuaWUgZXJyb3IsIHJlYWxseSB5b3Ugc2hvdWxkIHF1ZXVlIGFuZCBcbiAgICAvLyB0cnkgYWdhaW4/IG9yIHJlcGxheSB0aGUgbWVzc2FnZSBsYXRlclxuICAgIC8vIC0tIHRoaXMgc2hvdWxkIGJlIGRvbmUgbXkgdGhlIHNlY3VyaXR5IHBsdWdpbiB0aG91Z2gsIG5vdCBzY3V0dGxlYnV0dC5cblxuICAgIGlmKGVycilcbiAgICAgIHJldHVybiBlbWl0LmNhbGwoc2VsZiwgJ2Vycm9yJywgZXJyKVxuXG4gICAgaWYoIXZlcmlmaWVkKVxuICAgICAgcmV0dXJuIGVtaXQuY2FsbChzZWxmLCAndW52ZXJpZmllZF9kYXRhJywgdXBkYXRlKVxuXG4gICAgLy8gY2hlY2sgaWYgdGhpcyBtZXNzYWdlIGlzIG9sZGVyIHRoYW5cbiAgICAvLyB0aGUgdmFsdWUgd2UgYWxyZWFkeSBoYXZlLlxuICAgIC8vIGRvIG5vdGhpbmcgaWYgc29cbiAgICAvLyBlbWl0IGFuICdvbGRfZGF0YScgZXZlbnQgYmVjYXVzZSBpJ2xsIHdhbnQgdG8gdHJhY2sgaG93IG1hbnlcbiAgICAvLyB1bm5lY2Vzc2FyeSBtZXNzYWdlcyBhcmUgc2VudC5cblxuICAgIGlmKHNlbGYuYXBwbHlVcGRhdGUodXBkYXRlKSlcbiAgICAgIGVtaXQuY2FsbChzZWxmLCAnX3VwZGF0ZScsIHVwZGF0ZSkgLy93cml0ZSB0byBzdHJlYW0uXG4gIH1cblxuICBpZihzb3VyY2UgIT09IHRoaXMuaWQpIHtcbiAgICBpZih0aGlzLl92ZXJpZnkpXG4gICAgICB0aGlzLl92ZXJpZnkodXBkYXRlLCBkaWRWZXJpZmljYXRpb24pXG4gICAgZWxzZVxuICAgICAgZGlkVmVyaWZpY2F0aW9uKG51bGwsIHRydWUpXG4gIH0gZWxzZSB7XG4gICAgaWYodGhpcy5fc2lnbikge1xuICAgICAgLy9jb3VsZCBtYWtlIHRoaXMgYXN5bmMgZWFzaWx5IGVub3VnaC5cbiAgICAgIHVwZGF0ZVszXSA9IHRoaXMuX3NpZ24odXBkYXRlKVxuICAgIH1cbiAgICBkaWRWZXJpZmljYXRpb24obnVsbCwgdHJ1ZSlcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbnNiLmNyZWF0ZVN0cmVhbSA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAvL3RoZSBzb3VyY2VzIGZvciB0aGUgcmVtb3RlIGVuZC5cbiAgdmFyIHNvdXJjZXMgPSB7fSwgb3RoZXJcbiAgdmFyIHN5bmNTZW50ID0gZmFsc2UsIHN5bmNSZWN2ID0gZmFsc2VcblxuICB0aGlzLl9zdHJlYW1zICsrXG5cbiAgb3B0cyA9IG9wdHMgfHwge31cbiAgdmFyIGQgPSBkdXBsZXgoKVxuICBkLm5hbWUgPSBvcHRzLm5hbWVcbiAgdmFyIG91dGVyID0gc2VyaWFsaXplcihvcHRzICYmIG9wdHMud3JhcHBlcikoZClcbiAgb3V0ZXIuaW5uZXIgPSBkXG5cbiAgZC53cml0YWJsZSA9IG9wdHMud3JpdGFibGUgIT09IGZhbHNlXG4gIGQucmVhZGFibGUgPSBvcHRzLnJlYWRhYmxlICE9PSBmYWxzZVxuXG4gIHN5bmNSZWN2ICAgPSAhZC53cml0YWJsZVxuICBzeW5jU2VudCAgID0gIWQucmVhZGFibGVcblxuICB2YXIgdGFpbCA9IG9wdHMudGFpbCAhPT0gZmFsc2UgLy9kZWZhdWx0IHRvIHRhaWw9dHJ1ZVxuXG4gIGZ1bmN0aW9uIHN0YXJ0IChkYXRhKSB7XG4gICAgLy93aGVuIHRoZSBkaWdlc3QgaXMgcmVjaWV2ZWQgZnJvbSB0aGUgb3RoZXIgZW5kLFxuICAgIC8vc2VuZCB0aGUgaGlzdG9yeS5cbiAgICAvL21lcmdlIHdpdGggdGhlIGN1cnJlbnQgbGlzdCBvZiBzb3VyY2VzLlxuICAgIHNvdXJjZXMgPSBkYXRhLmNsb2NrXG4gICAgaS5lYWNoKHNlbGYuaGlzdG9yeShzb3VyY2VzKSwgZnVuY3Rpb24gKGRhdGEpIHtkLl9kYXRhKGRhdGEpfSlcbiAgICBcbiAgICBvdXRlci5lbWl0KCdoZWFkZXInLCBkYXRhKVxuICAgIGQuX2RhdGEoJ1NZTkMnKVxuICAgIC8vd2hlbiB3ZSBoYXZlIHNlbnQgYWxsIGhpc3RvcnlcbiAgICBvdXRlci5lbWl0KCdzeW5jU2VudCcpXG4gICAgc3luY1NlbnQgPSB0cnVlXG4gICAgLy93aGVuIHdlIGhhdmUgcmVjaWV2ZWQgYWxsIGhpc3RveXJcbiAgICAvL2VtaXQgJ3N5bmNlZCcgd2hlbiB0aGlzIHN0cmVhbSBoYXMgc3luY2VkLlxuICAgIGlmKHN5bmNSZWN2KSBvdXRlci5lbWl0KCdzeW5jJyksIG91dGVyLmVtaXQoJ3N5bmNlZCcpXG4gICAgaWYoIXRhaWwpIGQuX2VuZCgpXG4gIH1cblxuICBkXG4gICAgLm9uKCdfZGF0YScsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAvL2lmIGl0J3MgYW4gYXJyYXksIGl0J3MgYW4gdXBkYXRlLlxuICAgICAgaWYoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICBpZih2YWxpZGF0ZShkYXRhKSlcbiAgICAgICAgICByZXR1cm4gc2VsZi5fdXBkYXRlKGRhdGEpXG4gICAgICB9XG4gICAgICAvL2lmIGl0J3MgYW4gb2JqZWN0LCBpdCdzIGEgc2N1dHRsZWJ1dCBkaWdlc3QuXG4gICAgICBlbHNlIGlmKCdvYmplY3QnID09PSB0eXBlb2YgZGF0YSAmJiBkYXRhKVxuICAgICAgICBzdGFydChkYXRhKVxuICAgICAgZWxzZSBpZignc3RyaW5nJyA9PT0gdHlwZW9mIGRhdGEgJiYgZGF0YSA9PSAnU1lOQycpIHtcbiAgICAgICAgc3luY1JlY3YgPSB0cnVlXG4gICAgICAgIG91dGVyLmVtaXQoJ3N5bmNSZWNpZXZlZCcpXG4gICAgICAgIGlmKHN5bmNTZW50KSBvdXRlci5lbWl0KCdzeW5jJyksIG91dGVyLmVtaXQoJ3N5bmNlZCcpXG4gICAgICB9XG4gICAgfSkub24oJ19lbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkLl9lbmQoKVxuICAgIH0pXG4gICAgLm9uKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIoJ191cGRhdGUnLCBvblVwZGF0ZSlcbiAgICAgIC8vZW1pdCB0aGUgbnVtYmVyIG9mIHN0cmVhbXMgdGhhdCBhcmUgcmVtYWluaW5nLi4uXG4gICAgICAvL3RoaXMgd2lsbCBiZSB1c2VkIGZvciBtZW1vcnkgbWFuYWdlbWVudC4uLlxuICAgICAgc2VsZi5fc3RyZWFtcyAtLVxuICAgICAgZW1pdC5jYWxsKHNlbGYsICd1bnN0cmVhbScsIHNlbGYuX3N0cmVhbXMpXG4gICAgfSlcblxuICBpZihvcHRzICYmIG9wdHMudGFpbCA9PT0gZmFsc2UpIHtcbiAgICBvdXRlci5vbignc3luYycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBkLl9lbmQoKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG4gIGZ1bmN0aW9uIG9uVXBkYXRlICh1cGRhdGUpIHsgLy92YWx1ZSwgc291cmNlLCB0c1xuICAgIGlmKCF2YWxpZGF0ZSh1cGRhdGUpIHx8ICF1LmZpbHRlcih1cGRhdGUsIHNvdXJjZXMpKVxuICAgICAgcmV0dXJuXG5cbiAgICBkLl9kYXRhKHVwZGF0ZSlcblxuICAgIC8vcmVhbGx5LCB0aGlzIHNob3VsZCBoYXBwZW4gYmVmb3JlIGVtaXR0aW5nLlxuICAgIHZhciB0cyA9IHVwZGF0ZVsxXVxuICAgIHZhciBzb3VyY2UgPSB1cGRhdGVbMl1cbiAgICBzb3VyY2VzW3NvdXJjZV0gPSB0c1xuICB9XG5cbiAgdmFyIG91dGdvaW5nID0geyBpZCA6IHNlbGYuaWQsIGNsb2NrIDogc2VsZi5zb3VyY2VzIH1cblxuICBpZiAob3B0cyAmJiBvcHRzLm1ldGEpIG91dGdvaW5nLm1ldGEgPSBvcHRzLm1ldGFcblxuICBpZihkLnJlYWRhYmxlKSB7XG4gICAgZC5fZGF0YShvdXRnb2luZylcbiAgICBpZighZC53cml0YWJsZSlcbiAgICAgIHN0YXJ0KHtjbG9jazp7fX0pXG4gICAgaWYodGFpbClcbiAgICAgIHNlbGYub24oJ191cGRhdGUnLCBvblVwZGF0ZSlcbiAgfVxuXG4gIHNlbGYub25jZSgnZGlzcG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICBkLmVuZCgpXG4gIH0pXG5cbiAgcmV0dXJuIG91dGVyXG59XG5cbnNiLmNyZWF0ZVdyaXRlU3RyZWFtID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgb3B0cyA9IG9wdHMgfHwge31cbiAgb3B0cy53cml0YWJsZSA9IHRydWU7IG9wdHMucmVhZGFibGUgPSBmYWxzZVxuICByZXR1cm4gdGhpcy5jcmVhdGVTdHJlYW0ob3B0cylcbn1cblxuc2IuY3JlYXRlUmVhZFN0cmVhbSA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9XG4gIG9wdHMud3JpdGFibGUgPSBmYWxzZTsgb3B0cy5yZWFkYWJsZSA9IHRydWVcbiAgcmV0dXJuIHRoaXMuY3JlYXRlU3RyZWFtKG9wdHMpXG59XG5cbnNiLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIGVtaXQuY2FsbCh0aGlzLCAnZGlzcG9zZScpXG59XG5cbnNiLnNldElkID0gZnVuY3Rpb24gKGlkKSB7XG4gIGlmKCdfX3Byb3RvX18nID09PSBpZCkgdGhyb3cgbmV3IEVycm9yKCdfX3Byb3RvX18gaXMgaW52YWxpZCBpZCcpXG4gIGlmKGlkID09IG51bGwpIHRocm93IG5ldyBFcnJvcignbnVsbCBpcyBub3QgaW52YWxpZCBpZCcpXG4gIHRoaXMuaWQgPSBpZFxuICByZXR1cm4gdGhpc1xufVxuXG5mdW5jdGlvbiBzdHJlYW1Eb25lKHN0cmVhbSwgbGlzdGVuZXIpIHtcblxuICBmdW5jdGlvbiByZW1vdmUgKCkge1xuICAgIHN0cmVhbS5yZW1vdmVMaXN0ZW5lcignZW5kJywgICBvbkRvbmUpXG4gICAgc3RyZWFtLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uRG9uZSlcbiAgICBzdHJlYW0ucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgICBvbkRvbmUpXG4gIH1cbiAgZnVuY3Rpb24gb25Eb25lIChhcmcpIHtcbiAgICByZW1vdmUoKVxuICAgIGxpc3RlbmVyLmNhbGwodGhpcywgYXJnKVxuICB9XG5cbiAgLy90aGlzIG1ha2VzIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKSBzdGlsbCB3b3JrXG4gIG9uRG9uZS5saXN0ZW5lciA9IGxpc3RlbmVyXG5cbiAgc3RyZWFtLm9uKCdlbmQnLCAgIG9uRG9uZSlcbiAgc3RyZWFtLm9uKCdlcnJvcicsIG9uRG9uZSlcbiAgc3RyZWFtLm9uKCdjbG9zZScsIG9uRG9uZSlcbn1cblxuLy9jcmVhdGUgYW5vdGhlciBpbnN0YW5jZSBvZiB0aGlzIHNjdXR0bGVidXR0LFxuLy90aGF0IGlzIGluIHN5bmMgYW5kIGF0dGFjaGVkIHRvIHRoaXMgaW5zdGFuY2UuXG5zYi5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIEEgPSB0aGlzXG4gIHZhciBCID0gbmV3IChBLmNvbnN0cnVjdG9yKVxuICBCLnNldElkKEEuaWQpIC8vc2FtZSBpZC4gdGhpbmsgdGhpcyB3aWxsIHdvcmsuLi5cblxuICBBLl9jbG9uZXMgPSAoQS5fY2xvbmVzIHx8IDApICsgMVxuXG4gIHZhciBhID0gQS5jcmVhdGVTdHJlYW0oe3dyYXBwZXI6ICdyYXcnfSlcbiAgdmFyIGIgPSBCLmNyZWF0ZVN0cmVhbSh7d3JhcHBlcjogJ3Jhdyd9KVxuXG4gIC8vYWxsIHVwZGF0ZXMgbXVzdCBiZSBzeW5jLCBzbyBtYWtlIHN1cmUgcGF1c2UgbmV2ZXIgaGFwcGVucy5cbiAgYS5wYXVzZSA9IGIucGF1c2UgPSBmdW5jdGlvbiBub29wKCl7fVxuXG4gIHN0cmVhbURvbmUoYiwgZnVuY3Rpb24gKCkge1xuICAgIEEuX2Nsb25lcy0tXG4gICAgZW1pdC5jYWxsKEEsICd1bmNsb25lJywgQS5fY2xvbmVzKVxuICB9KVxuXG4gIGEucGlwZShiKS5waXBlKGEpXG4gIC8vcmVzdW1lIGJvdGggc3RyZWFtcywgc28gdGhhdCB0aGUgbmV3IGluc3RhbmNlIGlzIGJyb3VnaHQgdXAgdG8gZGF0ZSBpbW1lZGlhdGVseS5cbiAgYS5yZXN1bWUoKVxuICBiLnJlc3VtZSgpXG5cbiAgcmV0dXJuIEJcbn1cblxuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiLypcbiAqIENvcHlyaWdodCAoYykgMjAxMiBNYXRoaWV1IFR1cmNvdHRlXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxudmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpLFxuICAgIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbmZ1bmN0aW9uIGlzRGVmKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGw7XG59XG5cbi8qKlxuICogQWJzdHJhY3QgY2xhc3MgZGVmaW5pbmcgdGhlIHNrZWxldG9uIGZvciBhbGwgYmFja29mZiBzdHJhdGVnaWVzLlxuICogQHBhcmFtIG9wdGlvbnMgQmFja29mZiBzdHJhdGVneSBvcHRpb25zLlxuICogQHBhcmFtIG9wdGlvbnMucmFuZG9taXNhdGlvbkZhY3RvciBUaGUgcmFuZG9taXNhdGlvbiBmYWN0b3IsIG11c3QgYmUgYmV0d2VlblxuICogMCBhbmQgMS5cbiAqIEBwYXJhbSBvcHRpb25zLmluaXRpYWxEZWxheSBUaGUgYmFja29mZiBpbml0aWFsIGRlbGF5LCBpbiBtaWxsaXNlY29uZHMuXG4gKiBAcGFyYW0gb3B0aW9ucy5tYXhEZWxheSBUaGUgYmFja29mZiBtYXhpbWFsIGRlbGF5LCBpbiBtaWxsaXNlY29uZHMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQmFja29mZlN0cmF0ZWd5KG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGlmIChpc0RlZihvcHRpb25zLmluaXRpYWxEZWxheSkgJiYgb3B0aW9ucy5pbml0aWFsRGVsYXkgPCAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGluaXRpYWwgdGltZW91dCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiAwLicpO1xuICAgIH0gZWxzZSBpZiAoaXNEZWYob3B0aW9ucy5tYXhEZWxheSkgJiYgb3B0aW9ucy5tYXhEZWxheSA8IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgbWF4aW1hbCB0aW1lb3V0IG11c3QgYmUgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5pbml0aWFsRGVsYXlfID0gb3B0aW9ucy5pbml0aWFsRGVsYXkgfHwgMTAwO1xuICAgIHRoaXMubWF4RGVsYXlfID0gb3B0aW9ucy5tYXhEZWxheSB8fCAxMDAwMDtcblxuICAgIGlmICh0aGlzLm1heERlbGF5XyA8PSB0aGlzLmluaXRpYWxEZWxheV8pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgbWF4aW1hbCBiYWNrb2ZmIGRlbGF5IG11c3QgYmUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnZ3JlYXRlciB0aGFuIHRoZSBpbml0aWFsIGJhY2tvZmYgZGVsYXkuJyk7XG4gICAgfVxuXG4gICAgaWYgKGlzRGVmKG9wdGlvbnMucmFuZG9taXNhdGlvbkZhY3RvcikgJiZcbiAgICAgICAgKG9wdGlvbnMucmFuZG9taXNhdGlvbkZhY3RvciA8IDAgfHwgb3B0aW9ucy5yYW5kb21pc2F0aW9uRmFjdG9yID4gMSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcmFuZG9taXNhdGlvbiBmYWN0b3IgbXVzdCBiZSBiZXR3ZWVuIDAgYW5kIDEuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5yYW5kb21pc2F0aW9uRmFjdG9yXyA9IG9wdGlvbnMucmFuZG9taXNhdGlvbkZhY3RvciB8fCAwO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgbWF4aW1hbCBiYWNrb2ZmIGRlbGF5LlxuICogQHJldHVybiBUaGUgbWF4aW1hbCBiYWNrb2ZmIGRlbGF5LlxuICovXG5CYWNrb2ZmU3RyYXRlZ3kucHJvdG90eXBlLmdldE1heERlbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMubWF4RGVsYXlfO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGluaXRpYWwgYmFja29mZiBkZWxheS5cbiAqIEByZXR1cm4gVGhlIGluaXRpYWwgYmFja29mZiBkZWxheS5cbiAqL1xuQmFja29mZlN0cmF0ZWd5LnByb3RvdHlwZS5nZXRJbml0aWFsRGVsYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5pbml0aWFsRGVsYXlfO1xufTtcblxuLyoqXG4gKiBUZW1wbGF0ZSBtZXRob2QgdGhhdCBjb21wdXRlcyB0aGUgbmV4dCBiYWNrb2ZmIGRlbGF5LlxuICogQHJldHVybiBUaGUgYmFja29mZiBkZWxheSwgaW4gbWlsbGlzZWNvbmRzLlxuICovXG5CYWNrb2ZmU3RyYXRlZ3kucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYmFja29mZkRlbGF5ID0gdGhpcy5uZXh0XygpO1xuICAgIHZhciByYW5kb21pc2F0aW9uTXVsdGlwbGUgPSAxICsgTWF0aC5yYW5kb20oKSAqIHRoaXMucmFuZG9taXNhdGlvbkZhY3Rvcl87XG4gICAgdmFyIHJhbmRvbWl6ZWREZWxheSA9IE1hdGgucm91bmQoYmFja29mZkRlbGF5ICogcmFuZG9taXNhdGlvbk11bHRpcGxlKTtcbiAgICByZXR1cm4gcmFuZG9taXplZERlbGF5O1xufTtcblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgbmV4dCBiYWNrb2ZmIGRlbGF5LlxuICogQHJldHVybiBUaGUgYmFja29mZiBkZWxheSwgaW4gbWlsbGlzZWNvbmRzLlxuICovXG5CYWNrb2ZmU3RyYXRlZ3kucHJvdG90eXBlLm5leHRfID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCYWNrb2ZmU3RyYXRlZ3kubmV4dF8oKSB1bmltcGxlbWVudGVkLicpO1xufTtcblxuLyoqXG4gKiBUZW1wbGF0ZSBtZXRob2QgdGhhdCByZXNldHMgdGhlIGJhY2tvZmYgZGVsYXkgdG8gaXRzIGluaXRpYWwgdmFsdWUuXG4gKi9cbkJhY2tvZmZTdHJhdGVneS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlc2V0XygpO1xufTtcblxuLyoqXG4gKiBSZXNldHMgdGhlIGJhY2tvZmYgZGVsYXkgdG8gaXRzIGluaXRpYWwgdmFsdWUuXG4gKi9cbkJhY2tvZmZTdHJhdGVneS5wcm90b3R5cGUucmVzZXRfID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCYWNrb2ZmU3RyYXRlZ3kucmVzZXRfKCkgdW5pbXBsZW1lbnRlZC4nKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja29mZlN0cmF0ZWd5O1xuXG4iLCJcbi8vXG4vLyBhZGRzIGFsbCB0aGUgZmllbGRzIGZyb20gb2JqMiBvbnRvIG9iajFcbi8vXG5cbnZhciBlYWNoID0gZXhwb3J0cy5lYWNoID0gZnVuY3Rpb24gKG9iaixpdGVyYXRvcil7XG4gdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopXG4ga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpe1xuICBpdGVyYXRvcihvYmpba2V5XSxrZXksb2JqKSBcbiB9KVxufVxuXG52YXIgUlggPSAvc2FkZi8uY29uc3RydWN0b3JcbmZ1bmN0aW9uIHJ4IChpdGVyYXRvciApe1xuICByZXR1cm4gaXRlcmF0b3IgaW5zdGFuY2VvZiBSWCA/IGZ1bmN0aW9uIChzdHIpIHsgXG4gICAgICB2YXIgbSA9IGl0ZXJhdG9yLmV4ZWMoc3RyKVxuICAgICAgcmV0dXJuIG0gJiYgKG1bMV0gPyBtWzFdIDogbVswXSkgXG4gICAgfSA6IGl0ZXJhdG9yXG59XG5cbnZhciB0aW1lcyA9IGV4cG9ydHMudGltZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgLCBpdGVyYXRvciA9IHJ4KGFyZ3MucG9wKCkpXG4gICAgLCBtID0gYXJncy5wb3AoKVxuICAgICwgaSA9IGFyZ3Muc2hpZnQoKVxuICAgICwgaiA9IGFyZ3Muc2hpZnQoKVxuICAgICwgZGlmZiwgZGlyXG4gICAgLCBhID0gW11cbiAgICBcbiAgICBpID0gJ251bWJlcicgPT09IHR5cGVvZiBpID8gaSA6IDFcbiAgICBkaWZmID0gaiA/IGogLSBpIDogMVxuICAgIGRpciA9IGkgPCBtXG4gICAgaWYobSA9PSBpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzdGVwcyBjYW5ub3QgYmUgdGhlIHNhbWU6ICcrbSsnLCAnK2kpXG4gIGZvciAoOyBkaXIgPyBpIDw9IG0gOiBtIDw9IGk7IGkgKz0gZGlmZilcbiAgICBhLnB1c2goaXRlcmF0b3IoaSkpXG4gIHJldHVybiBhXG59XG5cbnZhciBtYXAgPSBleHBvcnRzLm1hcCA9IGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yKXtcbiAgaXRlcmF0b3IgPSByeChpdGVyYXRvcilcbiAgaWYoQXJyYXkuaXNBcnJheShvYmopKVxuICAgIHJldHVybiBvYmoubWFwKGl0ZXJhdG9yKVxuICBpZignbnVtYmVyJyA9PT0gdHlwZW9mIG9iailcbiAgICByZXR1cm4gdGltZXMuYXBwbHkobnVsbCwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSAgXG4gIC8vcmV0dXJuIGlmIG51bGwgPyAgXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKVxuICAgICwgciA9IHt9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KXtcbiAgICByW2tleV0gPSBpdGVyYXRvcihvYmpba2V5XSxrZXksb2JqKSBcbiAgfSlcbiAgcmV0dXJuIHJcbn1cblxudmFyIGZpbmRSZXR1cm4gPSBleHBvcnRzLmZpbmRSZXR1cm4gPSBmdW5jdGlvbiAob2JqLCBpdGVyYXRvcikge1xuICBpdGVyYXRvciA9IHJ4KGl0ZXJhdG9yKVxuICBpZihvYmogPT0gbnVsbClcbiAgICByZXR1cm5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopXG4gICAgLCBsID0ga2V5cy5sZW5ndGhcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpICsrKSB7XG4gICAgdmFyIGtleSA9IGtleXNbaV1cbiAgICAgICwgdmFsdWUgPSBvYmpba2V5XVxuICAgIHZhciByID0gaXRlcmF0b3IodmFsdWUsIGtleSlcbiAgICBpZihyKSByZXR1cm4gclxuICB9XG59XG5cbnZhciBmaW5kID0gZXhwb3J0cy5maW5kID0gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IpIHsgXG4gIGl0ZXJhdG9yID0gcngoaXRlcmF0b3IpXG4gIHJldHVybiBmaW5kUmV0dXJuIChvYmosIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgdmFyIHIgPSBpdGVyYXRvcih2LCBrKVxuICAgIGlmKHIpIHJldHVybiB2XG4gIH0pXG59XG5cbnZhciBmaW5kS2V5ID0gZXhwb3J0cy5maW5kS2V5ID0gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IpIHsgXG4gIGl0ZXJhdG9yID0gcngoaXRlcmF0b3IpXG4gIHJldHVybiBmaW5kUmV0dXJuIChvYmosIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgdmFyIHIgPSBpdGVyYXRvcih2LCBrKVxuICAgIGlmKHIpIHJldHVybiBrXG4gIH0pXG59XG5cbnZhciBmaWx0ZXIgPSBleHBvcnRzLmZpbHRlciA9IGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yKXtcbiAgaXRlcmF0b3IgPSByeCAoaXRlcmF0b3IpXG5cbiAgaWYoQXJyYXkuaXNBcnJheShvYmopKVxuICAgIHJldHVybiBvYmouZmlsdGVyKGl0ZXJhdG9yKVxuICBcbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopXG4gICAgLCByID0ge31cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpe1xuICAgIHZhciB2XG4gICAgaWYoaXRlcmF0b3IodiA9IG9ialtrZXldLGtleSxvYmopKVxuICAgICAgcltrZXldID0gdlxuICB9KVxuICByZXR1cm4gciBcbn1cblxudmFyIG1hcEtleXMgPSBleHBvcnRzLm1hcEtleXMgPSBmdW5jdGlvbiAoYXJ5LCBpdGVyYXRvcil7XG4gIHZhciByID0ge31cbiAgaXRlcmF0b3IgPSByeChpdGVyYXRvcilcbiAgZWFjaChhcnksIGZ1bmN0aW9uICh2LGspe1xuICAgIHJbdl0gPSBpdGVyYXRvcih2LGspXG4gIH0pXG4gIHJldHVybiByXG59XG5cblxudmFyIG1hcFRvQXJyYXkgPSBleHBvcnRzLm1hcFRvQXJyYXkgPSBmdW5jdGlvbiAoYXJ5LCBpdGVyYXRvcil7XG4gIHZhciByID0gW11cbiAgaXRlcmF0b3IgPSByeChpdGVyYXRvcilcbiAgZWFjaChhcnksIGZ1bmN0aW9uICh2LGspe1xuICAgIHIucHVzaChpdGVyYXRvcih2LGspKVxuICB9KVxuICByZXR1cm4gclxufVxuXG52YXIgcGF0aCA9IGV4cG9ydHMucGF0aCA9IGZ1bmN0aW9uIChvYmplY3QsIHBhdGgpIHtcblxuICBmb3IgKHZhciBpIGluIHBhdGgpIHtcbiAgICBpZihvYmplY3QgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHZhciBrZXkgPSBwYXRoW2ldXG4gICAgb2JqZWN0ID0gb2JqZWN0W2tleV1cbiAgfVxuICByZXR1cm4gb2JqZWN0XG59XG5cbi8qXG5OT1RFOiBuYWl2ZSBpbXBsZW1lbnRhdGlvbi4gXG5gbWF0Y2hgIG11c3Qgbm90IGNvbnRhaW4gY2lyY3VsYXIgcmVmZXJlbmNlcy5cbiovXG5cbnZhciBzZXRQYXRoID0gZXhwb3J0cy5zZXRQYXRoID0gZnVuY3Rpb24gKG9iamVjdCwgcGF0aCwgdmFsdWUpIHtcblxuICBmb3IgKHZhciBpIGluIHBhdGgpIHtcbiAgICB2YXIga2V5ID0gcGF0aFtpXVxuICAgIGlmKG9iamVjdFtrZXldID09IG51bGwpIG9iamVjdFtrZXldID0gKCBcbiAgICAgIGkgKyAxID09IHBhdGgubGVuZ3RoID8gdmFsdWUgOiB7fVxuICAgIClcbiAgICBvYmplY3QgPSBvYmplY3Rba2V5XVxuICB9XG59XG5cbnZhciBqb2luID0gZXhwb3J0cy5qb2luID0gZnVuY3Rpb24gKEEsIEIsIGl0KSB7XG4gIGVhY2goQSwgZnVuY3Rpb24gKGEsIGFrKSB7XG4gICAgZWFjaChCLCBmdW5jdGlvbiAoYiwgYmspIHtcbiAgICAgIGl0KGEsIGIsIGFrLCBiaylcbiAgICB9KVxuICB9KVxufVxuIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe3ZhciBTdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh3cml0ZSwgZW5kKSB7XG4gIHZhciBzdHJlYW0gPSBuZXcgU3RyZWFtKCkgXG4gIHZhciBidWZmZXIgPSBbXSwgZW5kZWQgPSBmYWxzZSwgZGVzdHJveWVkID0gZmFsc2UsIGVtaXRFbmRcbiAgc3RyZWFtLndyaXRhYmxlID0gc3RyZWFtLnJlYWRhYmxlID0gdHJ1ZVxuICBzdHJlYW0ucGF1c2VkID0gZmFsc2VcbiAgc3RyZWFtLl9wYXVzZWQgPSBmYWxzZVxuICBzdHJlYW0uYnVmZmVyID0gYnVmZmVyXG4gIFxuICBzdHJlYW1cbiAgICAub24oJ3BhdXNlJywgZnVuY3Rpb24gKCkge1xuICAgICAgc3RyZWFtLl9wYXVzZWQgPSB0cnVlXG4gICAgfSlcbiAgICAub24oJ2RyYWluJywgZnVuY3Rpb24gKCkge1xuICAgICAgc3RyZWFtLl9wYXVzZWQgPSBmYWxzZVxuICAgIH0pXG4gICBcbiAgZnVuY3Rpb24gZGVzdHJveVNvb24gKCkge1xuICAgIHByb2Nlc3MubmV4dFRpY2soc3RyZWFtLmRlc3Ryb3kuYmluZChzdHJlYW0pKVxuICB9XG5cbiAgaWYod3JpdGUpXG4gICAgc3RyZWFtLm9uKCdfZGF0YScsIHdyaXRlKVxuICBpZihlbmQpXG4gICAgc3RyZWFtLm9uKCdfZW5kJywgZW5kKVxuXG4gIC8vZGVzdHJveSB0aGUgc3RyZWFtIG9uY2UgYm90aCBlbmRzIGFyZSBvdmVyXG4gIC8vYnV0IGRvIGl0IGluIG5leHRUaWNrLCBzbyB0aGF0IG90aGVyIGxpc3RlbmVyc1xuICAvL29uIGVuZCBoYXZlIHRpbWUgdG8gcmVzcG9uZFxuICBzdHJlYW0ub25jZSgnZW5kJywgZnVuY3Rpb24gKCkgeyBcbiAgICBzdHJlYW0ucmVhZGFibGUgPSBmYWxzZVxuICAgIGlmKCFzdHJlYW0ud3JpdGFibGUpIHtcbiAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzdHJlYW0uZGVzdHJveSgpXG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICBzdHJlYW0ub25jZSgnX2VuZCcsIGZ1bmN0aW9uICgpIHsgXG4gICAgc3RyZWFtLndyaXRhYmxlID0gZmFsc2VcbiAgICBpZighc3RyZWFtLnJlYWRhYmxlKVxuICAgICAgc3RyZWFtLmRlc3Ryb3koKVxuICB9KVxuXG4gIC8vIHRoaXMgaXMgdGhlIGRlZmF1bHQgd3JpdGUgbWV0aG9kLFxuICAvLyBpZiB5b3Ugb3ZlcmlkZSBpdCwgeW91IGFyZSByZXNwb3NpYmxlXG4gIC8vIGZvciBwYXVzZSBzdGF0ZS5cblxuICBcbiAgc3RyZWFtLl9kYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBpZighc3RyZWFtLnBhdXNlZCAmJiAhYnVmZmVyLmxlbmd0aClcbiAgICAgIHN0cmVhbS5lbWl0KCdkYXRhJywgZGF0YSlcbiAgICBlbHNlIFxuICAgICAgYnVmZmVyLnB1c2goZGF0YSlcbiAgICByZXR1cm4gIShzdHJlYW0ucGF1c2VkIHx8IGJ1ZmZlci5sZW5ndGgpXG4gIH1cblxuICBzdHJlYW0uX2VuZCA9IGZ1bmN0aW9uIChkYXRhKSB7IFxuICAgIGlmKGRhdGEpIHN0cmVhbS5fZGF0YShkYXRhKVxuICAgIGlmKGVtaXRFbmQpIHJldHVyblxuICAgIGVtaXRFbmQgPSB0cnVlXG4gICAgLy9kZXN0cm95IGlzIGhhbmRsZWQgYWJvdmUuXG4gICAgc3RyZWFtLmRyYWluKClcbiAgfVxuXG4gIHN0cmVhbS53cml0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgc3RyZWFtLmVtaXQoJ19kYXRhJywgZGF0YSlcbiAgICByZXR1cm4gIXN0cmVhbS5fcGF1c2VkXG4gIH1cblxuICBzdHJlYW0uZW5kID0gZnVuY3Rpb24gKCkge1xuICAgIHN0cmVhbS53cml0YWJsZSA9IGZhbHNlXG4gICAgaWYoc3RyZWFtLmVuZGVkKSByZXR1cm5cbiAgICBzdHJlYW0uZW5kZWQgPSB0cnVlXG4gICAgc3RyZWFtLmVtaXQoJ19lbmQnKVxuICB9XG5cbiAgc3RyZWFtLmRyYWluID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKCFidWZmZXIubGVuZ3RoICYmICFlbWl0RW5kKSByZXR1cm5cbiAgICAvL2lmIHRoZSBzdHJlYW0gaXMgcGF1c2VkIGFmdGVyIGp1c3QgYmVmb3JlIGVtaXRFbmQoKVxuICAgIC8vZW5kIHNob3VsZCBiZSBidWZmZXJlZC5cbiAgICB3aGlsZSghc3RyZWFtLnBhdXNlZCkge1xuICAgICAgaWYoYnVmZmVyLmxlbmd0aCkge1xuICAgICAgICBzdHJlYW0uZW1pdCgnZGF0YScsIGJ1ZmZlci5zaGlmdCgpKVxuICAgICAgICBpZihidWZmZXIubGVuZ3RoID09IDApIHtcbiAgICAgICAgICBzdHJlYW0uZW1pdCgnX2RyYWluJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZihlbWl0RW5kICYmIHN0cmVhbS5yZWFkYWJsZSkge1xuICAgICAgICBzdHJlYW0ucmVhZGFibGUgPSBmYWxzZVxuICAgICAgICBzdHJlYW0uZW1pdCgnZW5kJylcbiAgICAgICAgcmV0dXJuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2lmIHRoZSBidWZmZXIgaGFzIGVtcHRpZWQuIGVtaXQgZHJhaW4uXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHZhciBzdGFydGVkID0gZmFsc2VcbiAgc3RyZWFtLnJlc3VtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvL3RoaXMgaXMgd2hlcmUgSSBuZWVkIHBhdXNlUmVhZCwgYW5kIHBhdXNlV3JpdGUuXG4gICAgLy9oZXJlIHRoZSByZWFkaW5nIHNpZGUgaXMgdW5wYXVzZWQsXG4gICAgLy9idXQgdGhlIHdyaXRpbmcgc2lkZSBtYXkgc3RpbGwgYmUgcGF1c2VkLlxuICAgIC8vdGhlIHdob2xlIGJ1ZmZlciBtaWdodCBub3QgZW1waXR5IGF0IG9uY2UuXG4gICAgLy9pdCBtaWdodCBwYXVzZSBhZ2Fpbi5cbiAgICAvL3RoZSBzdHJlYW0gc2hvdWxkIG5ldmVyIGVtaXQgZGF0YSBpbmJldHdlZW4gcGF1c2UoKS4uLnJlc3VtZSgpXG4gICAgLy9hbmQgd3JpdGUgc2hvdWxkIHJldHVybiAhYnVmZmVyLmxlbmd0aFxuICAgIHN0YXJ0ZWQgPSB0cnVlXG4gICAgc3RyZWFtLnBhdXNlZCA9IGZhbHNlXG4gICAgc3RyZWFtLmRyYWluKCkgLy93aWxsIGVtaXQgZHJhaW4gaWYgYnVmZmVyIGVtcHRpZXMuXG4gICAgcmV0dXJuIHN0cmVhbVxuICB9XG5cbiAgc3RyZWFtLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoZGVzdHJveWVkKSByZXR1cm5cbiAgICBkZXN0cm95ZWQgPSBlbmRlZCA9IHRydWUgICAgIFxuICAgIGJ1ZmZlci5sZW5ndGggPSAwXG4gICAgc3RyZWFtLmVtaXQoJ2Nsb3NlJylcbiAgfVxuICB2YXIgcGF1c2VDYWxsZWQgPSBmYWxzZVxuICBzdHJlYW0ucGF1c2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgc3RhcnRlZCA9IHRydWVcbiAgICBzdHJlYW0ucGF1c2VkID0gdHJ1ZVxuICAgIHN0cmVhbS5lbWl0KCdfcGF1c2UnKVxuICAgIHJldHVybiBzdHJlYW1cbiAgfVxuICBzdHJlYW0uX3BhdXNlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKCFzdHJlYW0uX3BhdXNlZCkge1xuICAgICAgc3RyZWFtLl9wYXVzZWQgPSB0cnVlXG4gICAgICBzdHJlYW0uZW1pdCgncGF1c2UnKVxuICAgIH1cbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIHN0cmVhbS5wYXVzZWQgPSB0cnVlXG4gIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgIC8vdW5sZXNzIHRoZSB1c2VyIG1hbnVhbGx5IHBhdXNlZFxuICAgIGlmKHN0YXJ0ZWQpIHJldHVyblxuICAgIHN0cmVhbS5yZXN1bWUoKVxuICB9KVxuIFxuICByZXR1cm4gc3RyZWFtXG59XG5cblxufSkocmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpKSIsIlxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlclxuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAod3JhcHBlcikge1xuXG4gIGlmKCdmdW5jdGlvbicgPT0gdHlwZW9mIHdyYXBwZXIpXG4gICAgcmV0dXJuIHdyYXBwZXJcbiAgXG4gIHJldHVybiBleHBvcnRzW3dyYXBwZXJdIHx8IGV4cG9ydHMuanNvblxufVxuXG5leHBvcnRzLmpzb24gPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG5cbiAgdmFyIHdyaXRlID0gc3RyZWFtLndyaXRlXG4gIHZhciBzb0ZhciA9ICcnXG5cbiAgZnVuY3Rpb24gcGFyc2UgKGxpbmUpIHtcbiAgICB2YXIganNcbiAgICB0cnkge1xuICAgICAganMgPSBKU09OLnBhcnNlKGxpbmUpXG4gICAgICAvL2lnbm9yZSBsaW5lcyBvZiB3aGl0ZXNwYWNlLi4uXG4gICAgfSBjYXRjaCAoZXJyKSB7IFxuICAgICAgcmV0dXJuIHN0cmVhbS5lbWl0KCdlcnJvcicsIGVycilcbiAgICAgIC8vcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ2ludmFsaWQgSlNPTicsIGxpbmUpXG4gICAgfVxuICAgIGlmKGpzICE9PSB1bmRlZmluZWQpXG4gICAgICB3cml0ZS5jYWxsKHN0cmVhbSwganMpXG4gIH1cblxuICBmdW5jdGlvbiBvbkRhdGEgKGRhdGEpIHtcbiAgICB2YXIgbGluZXMgPSAoc29GYXIgKyBkYXRhKS5zcGxpdCgnXFxuJylcbiAgICBzb0ZhciA9IGxpbmVzLnBvcCgpXG4gICAgd2hpbGUobGluZXMubGVuZ3RoKSB7XG4gICAgICBwYXJzZShsaW5lcy5zaGlmdCgpKVxuICAgIH1cbiAgfVxuXG4gIHN0cmVhbS53cml0ZSA9IG9uRGF0YVxuICBcbiAgdmFyIGVuZCA9IHN0cmVhbS5lbmRcblxuICBzdHJlYW0uZW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBpZihkYXRhKVxuICAgICAgc3RyZWFtLndyaXRlKGRhdGEpXG4gICAgLy9pZiB0aGVyZSBpcyBhbnkgbGVmdCBvdmVyLi4uXG4gICAgaWYoc29GYXIpIHtcbiAgICAgIHBhcnNlKHNvRmFyKVxuICAgIH1cbiAgICByZXR1cm4gZW5kLmNhbGwoc3RyZWFtKVxuICB9XG5cbiAgc3RyZWFtLmVtaXQgPSBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcblxuICAgIGlmKGV2ZW50ID09ICdkYXRhJykge1xuICAgICAgZGF0YSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpICsgJ1xcbidcbiAgICB9XG4gICAgLy9zaW5jZSBhbGwgc3RyZWFtIGV2ZW50cyBvbmx5IHVzZSBvbmUgYXJndW1lbnQsIHRoaXMgaXMgb2theS4uLlxuICAgIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdC5jYWxsKHN0cmVhbSwgZXZlbnQsIGRhdGEpXG4gIH1cblxuICByZXR1cm4gc3RyZWFtXG4vLyAgcmV0dXJuIGVzLnBpcGVsaW5lKGVzLnNwbGl0KCksIGVzLnBhcnNlKCksIHN0cmVhbSwgZXMuc3RyaW5naWZ5KCkpXG59XG5cbmV4cG9ydHMucmF3ID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuICByZXR1cm4gc3RyZWFtXG59XG5cbiIsIi8vIElmIGBEYXRlLm5vdygpYCBpcyBpbnZva2VkIHR3aWNlIHF1aWNrbHksIGl0J3MgcG9zc2libGUgdG8gZ2V0IHR3b1xuLy8gaWRlbnRpY2FsIHRpbWUgc3RhbXBzLiBUbyBhdm9pZCBnZW5lcmF0aW9uIGR1cGxpY2F0aW9ucywgc3Vic2VxdWVudFxuLy8gY2FsbHMgYXJlIG1hbnVhbGx5IG9yZGVyZWQgdG8gZm9yY2UgdW5pcXVlbmVzcy5cblxudmFyIF9sYXN0ID0gMFxudmFyIF9jb3VudCA9IDFcbnZhciBhZGp1c3RlZCA9IDBcbnZhciBfYWRqdXN0ZWQgPSAwXG5cbm1vZHVsZS5leHBvcnRzID1cbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgLyoqXG4gIFJldHVybnMgTk9UIGFuIGFjY3VyYXRlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjdXJyZW50IHRpbWUuXG4gIFNpbmNlIGpzIG9ubHkgbWVhc3VyZXMgdGltZSBhcyBtcywgaWYgeW91IGNhbGwgYERhdGUubm93KClgXG4gIHR3aWNlIHF1aWNrbHksIGl0J3MgcG9zc2libGUgdG8gZ2V0IHR3byBpZGVudGljYWwgdGltZSBzdGFtcHMuXG4gIFRoaXMgZnVuY3Rpb24gZ3VhcmFudGVlcyB1bmlxdWUgYnV0IG1heWJlIGluYWNjdXJhdGUgcmVzdWx0c1xuICBvbiBlYWNoIGNhbGwuXG4gICoqL1xuICAvL3VuY29tbWVudCB0aGlzIHdlblxuICB2YXIgdGltZSA9IERhdGUubm93KClcbiAgLy90aW1lID0gfn4gKHRpbWUgLyAxMDAwKSBcbiAgLy9eXl51bmNvbW1lbnQgd2hlbiB0ZXN0aW5nLi4uXG5cbiAgLyoqXG4gIElmIHRpbWUgcmV0dXJuZWQgaXMgc2FtZSBhcyBpbiBsYXN0IGNhbGwsIGFkanVzdCBpdCBieVxuICBhZGRpbmcgYSBudW1iZXIgYmFzZWQgb24gdGhlIGNvdW50ZXIuIFxuICBDb3VudGVyIGlzIGluY3JlbWVudGVkIHNvIHRoYXQgbmV4dCBjYWxsIGdldCdzIGFkanVzdGVkIHByb3Blcmx5LlxuICBCZWNhdXNlIGZsb2F0cyBoYXZlIHJlc3RyaWN0ZWQgcHJlY2lzaW9uLCBcbiAgbWF5IG5lZWQgdG8gc3RlcCBwYXN0IHNvbWUgdmFsdWVzLi4uXG4gICoqL1xuICBpZiAoX2xhc3QgPT09IHRpbWUpICB7XG4gICAgZG8ge1xuICAgICAgYWRqdXN0ZWQgPSB0aW1lICsgKChfY291bnQrKykgLyAoX2NvdW50ICsgOTk5KSlcbiAgICB9IHdoaWxlIChhZGp1c3RlZCA9PT0gX2FkanVzdGVkKVxuICAgIF9hZGp1c3RlZCA9IGFkanVzdGVkXG4gIH1cbiAgLy8gSWYgbGFzdCB0aW1lIHdhcyBkaWZmZXJlbnQgcmVzZXQgdGltZXIgYmFjayB0byBgMWAuXG4gIGVsc2Uge1xuICAgIF9jb3VudCA9IDFcbiAgICBhZGp1c3RlZCA9IHRpbWVcbiAgfVxuICBfYWRqdXN0ZWQgPSBhZGp1c3RlZFxuICBfbGFzdCA9IHRpbWVcbiAgcmV0dXJuIGFkanVzdGVkXG59XG4iXX0=
;