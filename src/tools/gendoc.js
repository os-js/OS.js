//
// THIS IS AN UGLY-ASS PIECE OF CODE, BUT IT WORKS
// I SHOULD PROBABLY REWRITE THIS SOME TIME
//

Array.prototype.unique = function(){
  var u = {}, a = [];
  for(var i = 0, l = this.length; i < l; ++i){
    if(u.hasOwnProperty(this[i])) {
      continue;
    }
    a.push(this[i]);
    u[this[i]] = 1;
  }
  return a;
};

(function(_fs, _path, _markdown) {
  var ROOT = _path.join(__dirname, '../../');
  var TPLDIR = _path.join(ROOT, 'src', 'tools', 'templates');
  var OUTDIR = _path.join(ROOT, 'doc', 'generated');

  var NAMESPACES = [];

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is a block
   */
  function DocumentationBlock(comment) {
    this.description = '';
    this.api = '';
    this.isClass = false;
    this.className = null;
    this.methodName = null;
    this.extendsFrom = [];
    this.references = [];
    this.link = [];
    this.parameters = [];
    this.returns = null;
    this.returnDescription = null;
    this.parentClass = null;
    this.functionName = null;
    this.comment = comment;
    this.methods = [];
    this.options = {};

    this.parse(comment);
  }

  DocumentationBlock.prototype.parse = function(comment) {
    var lines = comment.split('\n');
    var newlines = [];
    lines.forEach(function(line) {
      var inner = line.match(/^\s*\* (.*)/);
      if ( inner && inner[1] ) {
        newlines.push(inner[1].replace(/\s+/g, ' '));
      }
    });

    var self = this;
    newlines.forEach(function(line) {
      var tmp;
      if ( line.match(/^@param/) ) {
        tmp = line.replace(/^@param\s/, '').split(' ');
        self.parameters.push({
          type: tmp.shift(),
          key: tmp.shift(),
          description: tmp.join(' ')
        });
      } else if ( line.match(/^@option/) ) {
        tmp = line.replace(/^@option\s/, '').split(' ');
        var tmp2 = tmp.shift();

        if ( typeof self.options[tmp2] === 'undefined' ) {
          self.options[tmp2] = [];
        }

        self.options[tmp2].push({
          type: tmp.shift(),
          key: tmp.shift(),
          description: tmp.join(' ')
        });
      } else if ( line.match(/^@return/) ) {
        tmp = line.replace(/^@return\s/, '').split(' ');
        self.returns = tmp.shift();
        if ( tmp.length ) {
          self.returnDescription = tmp.join(' ');
        }
      } else if ( line.match(/^@extends/) ) {
        tmp = line.split(' ', 2);
        self.extendsFrom.push(tmp[1]);
      } else if ( line.match(/^@class/) ) {
        tmp = line.split(' ', 2);
        self.isClass = true;
        if ( tmp[1] ) {
          self.className = tmp[1];
        }
      } else if ( line.match(/^@method/) ) {
        tmp = line.split(' ', 2);
        self.methodName = tmp[1];
        self.parentClass = tmp[1].split('::')[0]
      } else if ( line.match(/^@link/) ) {
        tmp = line.split(' ', 2);
        self.link.push(tmp[1]);
      } else if ( line.match(/^@see/) ) {
        tmp = line.split(' ', 2);
        self.references.push(tmp[1]);
      } else if ( line.match(/^@api/) ) {
        tmp = line.split(' ', 2);
        self.api = tmp[1];
      } else {
        if ( self.description ) {
          self.description += '\n';
          self.description += '\n';
        }
        self.description += line;
      }
    });

    if ( this.api ) {
      if ( this.isClass ) {
        if ( !this.className ) {
          this.className = this.api.split('.').pop();
        }
      } else {
        if ( !this.isMethod ) {
          this.functionName = this.api.split('.').pop();
        }
      }
    }
  };

  DocumentationBlock.prototype.markdown = function() {
    if ( this.isClass ) {
      var inner = [];
      inner.push(parseMethod.call(this, true));

      this.methods.forEach(function(m) {
        href = createHref(m.methodName);

        inner.push('<div class="section-method" id="' + href + '">');
        inner.push(m.markdown());
        inner.push('</div>');
      });

      return inner.join('\n');
    }

    return parseMethod.call(this);
  };

  function parseNotice(comment) {
    var lines = comment.split('\n');
    var newlines = [];
    lines.forEach(function(line) {
      var inner = line.match(/^\s*\*( (.*))?/);
      if ( inner && inner[1] ) {
        newlines.push(inner[1]);
      } else {
        newlines.push('\n');
      }
    });
    return newlines.join('\n').replace(/^\n+/g, '').replace(/\n+$/, '');
  }

  /////////////////////////////////////////////////////////////////////////////
  // HTML
  /////////////////////////////////////////////////////////////////////////////

  function parseMethod(head) {
    var mark = [];
    var self = this;

    function addToBuffer() {
      var line = Array.prototype.slice.call(arguments).join(' ');
      mark.push(line);
    }

    function createParamList() {
      var lst = [];
      self.parameters.forEach(function(p) {
        lst.push(p.key);
      });
      return '(' + lst.join(', ') + ')';
    }

    if ( this.isClass ) {
      addToBuffer('##', this.className);
    } else {
      if ( this.methodName ) {
        addToBuffer('###', this.methodName.replace('()', createParamList()));
      } else {
        addToBuffer('##', this.api.replace('()', createParamList()));
      }
    }

    if ( this.description ) {
      addToBuffer('<pre>');
      addToBuffer(this.description);
      addToBuffer('</pre>');
    }

    addToBuffer('');

    if ( this.api && this.isClass ) {
      addToBuffer('####', 'Namespace');
      addToBuffer('-', this.api);
    }
    addToBuffer('');

    if ( this.extendsFrom.length ) {
      addToBuffer('####', 'Extends');
      this.extendsFrom.forEach(function(x) {
        addToBuffer('-', x);
      });
      addToBuffer('');
    }

    if ( this.references.length ) {
      addToBuffer('####', 'See');
      this.references.forEach(function(f) {
        addToBuffer('-', f);
      });
      addToBuffer('');
    }

    if ( this.link.length ) {
      addToBuffer('####', 'Links');
      this.link.forEach(function(f) {
        addToBuffer('-', f);
      });
      addToBuffer('');
    }

    if ( this.parameters.length ) {
      addToBuffer('####', this.isClass ? 'Constructor' : 'Parameters');
      addToBuffer('| Name | Type | Description |');
      addToBuffer('| ---  | ---  | --- |');

      this.parameters.forEach(function(p) {
        addToBuffer('|', p.key, '|', p.type, '|', p.description || '', '|');
      });

      if ( this.isClass ) {
        addToBuffer('\n&nbsp;\n');
      }
    }

    if ( Object.keys(this.options).length ) {
      Object.keys(this.options).forEach(function(o) {
        addToBuffer('####', 'Options for', '*' + o + '*');

        addToBuffer('| Name | Type | Description |');
        addToBuffer('| ---  | ---  | --- |');

        self.options[o].forEach(function(p) {
          addToBuffer('|', p.key, '|', p.type, '|', p.description || '', '|');
        });

        if ( self.isClass ) {
          addToBuffer('\n&nbsp;\n');
        }
      });
    }

    addToBuffer('');
    if ( this.returns !== null ) {
      addToBuffer('####', 'Returns');
      if ( this.returnDescription ) {
        addToBuffer('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<u>' + this.returns + '</u> *' + this.returnDescription + '*');
      } else {
        addToBuffer('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<u>' + this.returns + '</u>');
      }
    }

    return _markdown(mark.join('\n'));
  }

  function generateMenu(fileList) {
    var menuHTML = [];

    var sorted = {};
    fileList.forEach(function(m) {
      var tmp = m.split('/');

      var lastRef;
      tmp.forEach(function(t, i) {
        var isLast = ( i >= tmp.length-1 );
        if ( lastRef ) {
          if ( typeof lastRef[t] === 'undefined' ) {
            if ( isLast ) {
              lastRef[t] = m;
            } else {
              lastRef[t] = {};
            }
          }
          lastRef = lastRef[t];
        } else {
          if ( typeof sorted[t] === 'undefined' ) {
            sorted[t] = {};
          }
          lastRef = sorted[t];
        }
      });
    });

    function generateList(lst, level) {
      var html = '';
      var lastRef;
      Object.keys(lst).forEach(function(l) {
        lastRef = lastRef || l;
        var inner = '';

        if ( typeof lst[l] !== 'string' ) {
          inner += l;
          inner += '<ul>';
          inner += generateList(lst[l], level + 1);
          inner += '</ul>';
        } else {
          var filename = lst[l].replace(/[^A-z0-9_\-]/g, '') + '.html';
          inner += '<a href="' + filename + '">' + l + '</a>';
        }

        html += '<li>' + inner + '</li>';

      });
      return html;
    }

    return generateList(sorted, 0);

    /*
    fileList.forEach(function(m) {
      console.log(m);
      var filename = m.replace(/[^A-z0-9_\-]/g, '') + '.html';
      menuHTML.push('<li><a href="' + filename + '">' + m + '</a></li>');
    });
    return menuHTML.join('\n');
    */
  }

  function runReplace(tpl, menu, content) {
    var namespaces = generateNamespaces();
    tpl = tpl.toString();
    tpl = tpl.replace('%MENU%', menu);
    tpl = tpl.replace('%CONTENT%', content);
    tpl = tpl.replace('%NAMESPACE%', namespaces);
    return tpl;
  }

  function generateIndex(menu, fileList) {
    var pageContent = _fs.readFileSync(_path.join(TPLDIR, 'doc-index.html'));
    generatePage([pageContent], 'index.html', fileList, menu);
  }

  function generatePage(buffer, filename, fileList, menu) {
    if ( filename !== 'index.html' ) {
      filename = filename.replace(/[^A-z0-9_\-]/g, '') + '.html';
    }

    var tpl = runReplace(
      _fs.readFileSync(_path.join(TPLDIR, 'doc-tpl.html')),
      menu,
      buffer
    );

    var dst = _path.join(OUTDIR, filename);
    return _fs.writeFileSync(dst, tpl);
  }

  function generateNamespaces() {
    var list = {};

    function sortList(lastRef) {
      var keys = Object.keys(lastRef).sort();
      var newRef = {};
      keys.forEach(function(k) {
        newRef[k] = lastRef[k];
      });

      return newRef;
    }

    Object.keys(NAMESPACES).forEach(function(n) {
      var tmp = n.split('.');
      var lastRef;

      tmp.forEach(function(l, idx) {
        if ( lastRef ) {
          if ( typeof lastRef[l] === 'undefined' ) {

            if ( idx >= tmp.length-1 ) {
              lastRef[l] = NAMESPACES[n];
            } else {
              lastRef[l] = {};
            }
          }
          lastRef = lastRef[l];
        } else {
          if ( typeof list[l] === 'undefined' ) {
            list[l] = {};
          }
          lastRef = list[l];
        }
      });
    });

    function generateList(lst, level) {
      var html = '';
      var lastRef;
      Object.keys(lst).forEach(function(l) {
        lastRef = lastRef || l;
        var inner = '';

        if ( typeof lst[l] !== 'string' ) {
          inner += l;
          inner += '<ul>';
          inner += generateList(sortList(lst[l]), level + 1);
          inner += '</ul>';
        } else {
          var href = '';


          var tmp = lst[l].split('#');
          href += tmp[0].replace(/[^A-z0-9_\-]/g, '') + '.html';
          href += '#' + tmp[1];
          var cn = '';

          if ( l.match(/\(\)$/) === null ) {
            cn = 'Class';
          }

          inner += '<a class="' + cn + '" href="' + href + '">' + l + '</a>';
        }

        html += '<li>' + inner + '</li>';

      });
      return html;
    }

    return generateList(list, 0);
  }

  /////////////////////////////////////////////////////////////////////////////
  // GENERATION
  /////////////////////////////////////////////////////////////////////////////

  function createHref(n) {
    return n.replace(/(\.)|(\:\:)/g, '-').replace(/[^A-z0-9_\-]/g, '').toLowerCase();
  }

  function generateNamespace(filename) {
    var raw = _fs.readFileSync(filename).toString('utf-8');
    var comments = raw.match(/((?:\/\*(?:[^*]|(?:\*+[^*\/]))*\*+\/)|(?:\/\/.*))/g);
    var blocks = [];

    comments.forEach(function(comment) {
      if ( comment.match(/^\/\*\*/) ) {
        var block = new DocumentationBlock(comment)
        blocks.push(block);
      }
    });

    blocks.forEach(function(b) {
      if ( b.api ) {
        if ( !NAMESPACES[b.api] ) {
          NAMESPACES[b.api] = filename + '#' + createHref(b.api);
        }
      }
    });
  }

  function readFile(filename) {
    var raw = _fs.readFileSync(filename).toString('utf-8');
    var comments = raw.match(/((?:\/\*(?:[^*]|(?:\*+[^*\/]))*\*+\/)|(?:\/\/.*))/g);
    var blocks = [];
    var notices = [];

    comments.forEach(function(comment) {
      if ( comment.match(/^\/\*\*/) ) { // Docbloc
        var block = new DocumentationBlock(comment)
        blocks.push(block);
      } else if ( comment.match(/^\/\*\@/) ) { // Notice
        notices.push(parseNotice(comment));
      }
    });

    // Now sort them
    var classes = {};
    var functions = [];

    blocks.forEach(function(b) {
      if ( b.isClass ) {
        if ( !classes[b.className] ) {
          classes[b.className] = b;
        }
      } else {
        if ( b.methodName && b.parentClass ) {
          if ( classes[b.parentClass] ) {
            classes[b.parentClass].methods.push(b);
          }
        } else {
          functions.push(b);
        }
      }
    });


    // Finally output
    var output = [];
    output.push('<h1>Overview</h1>');

    output.push('<p><i>' + filename + '</i></p>');

    notices.forEach(function(n) {
      output.push('<pre>');
      output.push(n);
      output.push('</pre>');
    });

    output.push('<h2>Functions</h2>');
    output.push('<ul>');
    functions.forEach(function(f) {
      if ( f.functionName ) {
        var href = createHref(f.api);
        var pre = f.api.replace(f.functionName, '');
        var title = f.functionName;

        output.push('<li>' + pre + '<a href="#' + href + '">' + title + '</a></li>');
      }
    });
    output.push('</ul>');

    output.push('<h2>Classes</h2>');
    output.push('<ul>');
    Object.keys(classes).forEach(function(cn) {
      var href = createHref(classes[cn].api);
      var pre = classes[cn].api;//.replace(cn, '');
      var title = cn;

      output.push('<li>');
      output.push('<a href="#' + href + '">' + title + '</a>' + ' (' + pre + ')');
      output.push('<ul>');
      classes[cn].methods.forEach(function(m) {
        title = m.methodName.split('::').pop();
        href = createHref(m.methodName);
        output.push('<li><a href="#' + href + '">' + title + '</a></li>');
      });
      output.push('</ul>');
      output.push('</li>');
    });
    output.push('</ul>');

    output.push('<h1>Functions</h1>');
    functions.forEach(function(f) {
      if ( f.functionName ) {
        href = createHref(f.api);
        output.push('<div class="section-function" id="' + href + '">');
        output.push(f.markdown());
        output.push('</div>');
      }
    });

    output.push('<h1>Classes</h1>');
    Object.keys(classes).forEach(function(cn) {
      var c = classes[cn];
      if ( c.className ) {
        href = createHref(c.api);
        output.push('<div class="section-class" id="' + href + '">');
        output.push(c.markdown());
        output.push('</div>');
      }
    });

    output.push('<p><i>Generated: ' + (new Date()) + '</i></p>');
    output.push('<p><i>Copyright &copy; 2011-2015 Anders Evenrud</i></p>');

    return output.join('\n');
  }

  /////////////////////////////////////////////////////////////////////////////
  // MAIN
  /////////////////////////////////////////////////////////////////////////////

  _markdown.setOptions({
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
  });

  _fs.removeSync(OUTDIR);
  _fs.mkdirpSync(OUTDIR);

  _fs.copy(
    _path.join(TPLDIR, 'doc-style.css'),
    _path.join(OUTDIR, 'main.css')
  );

  _fs.copy(
    _path.join(TPLDIR, 'doc-logo.png'),
    _path.join(OUTDIR, 'logo.png')
  );

  var files = [
    'src/javascript/session.js',
    'src/javascript/api.js',
    'src/javascript/process.js',
    'src/javascript/application.js',
    'src/javascript/service.js',
    'src/javascript/window.js',
    'src/javascript/dialog.js',
    'src/javascript/windowmanager.js',
    'src/javascript/handler.js',
    'src/javascript/vfs.js',
    'src/javascript/guielement.js',
    'src/javascript/utils.js',

    'src/javascript/helpers/default-application.js',
    'src/javascript/helpers/google-api.js',
    'src/javascript/helpers/windows-live-api.js',
    'src/javascript/helpers/firefox-marketplace.js',
    'src/javascript/helpers/zip-archiver.js',

    'src/javascript/gui/_dataview.js',
    'src/javascript/gui/_input.js',
    'src/javascript/gui/iframe.js',
    'src/javascript/gui/button.js',
    'src/javascript/gui/canvas.js',
    'src/javascript/gui/checkbox.js',
    'src/javascript/gui/colorswatch.js',
    'src/javascript/gui/fileview.js',
    'src/javascript/gui/iconview.js',
    'src/javascript/gui/label.js',
    'src/javascript/gui/listview.js',
    'src/javascript/gui/menu.js',
    'src/javascript/gui/menubar.js',
    'src/javascript/gui/panedview.js',
    'src/javascript/gui/progressbar.js',
    'src/javascript/gui/radio.js',
    'src/javascript/gui/richtext.js',
    'src/javascript/gui/scrollview.js',
    'src/javascript/gui/select.js',
    'src/javascript/gui/selectlist.js',
    'src/javascript/gui/slider.js',
    'src/javascript/gui/statusbar.js',
    'src/javascript/gui/tabs.js',
    'src/javascript/gui/text.js',
    'src/javascript/gui/textarea.js',
    'src/javascript/gui/toolbar.js',
    'src/javascript/gui/treeview.js',
    'src/javascript/gui/switch.js',
    'src/javascript/gui/box.js',

    'src/javascript/dialogs/_standard.js',
    'src/javascript/dialogs/alert.js',
    'src/javascript/dialogs/applicationchooser.js',
    'src/javascript/dialogs/color.js',
    'src/javascript/dialogs/confirm.js',
    'src/javascript/dialogs/errormessage.js',
    'src/javascript/dialogs/file.js',
    'src/javascript/dialogs/fileinfo.js',
    'src/javascript/dialogs/fileprogress.js',
    'src/javascript/dialogs/fileupload.js',
    'src/javascript/dialogs/font.js',
    'src/javascript/dialogs/input.js'

  ];

  var menu = generateMenu(files);
  var buffers = {};

  files.forEach(function(f) {
    var buffer = readFile(f);
    generateNamespace(f);
    buffers[f] = buffer;
  });

  Object.keys(buffers).forEach(function(f) {
    generatePage(buffers[f], f, files, menu);
  });

  /*
  files.forEach(function(f) {
    var buffer = readFile(f);
    generatePage(buffer, f, files, menu);
  });
  */

  generateIndex(menu, files);

})(
  require("node-fs-extra"),
  require("path"),
  require("marked")
);
