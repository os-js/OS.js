/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
(function() {
  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};

  // TODO: ProgressBar
  // TODO: Slider
  // TODO: Select + SelectList
  // TODO: Button
  // TODO: Option
  // TODO: Checkbox
  // TODO: Image
  // TODO: Video, Audio => Media
  // TODO: IconView
  // TODO: TreeView

  function createDroppable(el, args) {
    args = args || {};

    args.accept = args.accept || null;
    args.effect = args.effect || 'move';
    args.mime   = args.mime   || 'application/json';
    args.files  = args.files  || true;

    args.onFilesDropped = args.onFilesDropped || function() { return true; };
    args.onItemDropped  = args.onItemDropped  || function() { return true; };
    args.onEnter        = args.onEnter        || function() { return true; };
    args.onOver         = args.onOver         || function() { return true; };
    args.onLeave        = args.onLeave        || function() { return true; };
    args.onDrop         = args.onDrop         || function() { return true; };

    var _onDrop = function(ev, el) {
      ev.stopPropagation();
      ev.preventDefault();

      args.onDrop.call(this, ev, el);
      if ( !ev.dataTransfer ) return true;

      if ( args.files ) {
        var files = ev.dataTransfer.files;
        if ( files && files.length ) {
          return args.onFilesDropped.call(this, ev, el, files, args);
        }
      }

      var data;
      var self = this;
      try {
        data = ev.dataTransfer.getData(args.mime);
      } catch ( e ) {
        console.warn('Failed to drop: ' + e);
      }
      if ( data ) {
        var item = JSON.parse(data);
        if ( args.accept === null || args.accept == item.type ) {
          return args.onItemDropped.call(self, ev, el, item, args);
        }
      }

      return false;
    };

    el.addEventListener('drop', function(ev) {
      return _onDrop(ev, this);
    }, false);

    el.addEventListener('dragenter', function(ev) {
      return args.onEnter.call(this, ev, this, args);
    }, false);

    el.addEventListener('dragover', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      ev.dataTransfer.dropEffect = args.effect;
      return args.onOver.call(this, ev, this, args);
    }, false);

    el.addEventListener('dragleave', function(ev) {
      return args.onLeave.call(this, ev, this, args);
    }, false);
  }

  function createDraggable(el, args) {
    args        = args        || {};
    args.type   = args.type   || null;
    args.effect = args.effect || 'move';
    args.data   = args.data   || null;
    args.mime   = args.mime   || 'application/json';

    args.onStart  = args.onStart  || function() { return true; };
    args.onEnd    = args.onEnd    || function() { return true; };

    var _toString = function(mime) {
      return JSON.stringify({
        type:   args.type,
        effect: args.effect,
        data:   args.data,
        mime:   args.mime
      });
    };

    el.setAttribute("draggable", "true");
    el.addEventListener('dragstart', function(ev) {
      this.style.opacity = '0.4';
      if ( ev.dataTransfer ) {
        try {
          ev.dataTransfer.effectAllowed = args.effect;
          ev.dataTransfer.setData(args.mime, _toString(args.mime));
        } catch ( e ) {
          console.warn("Failed to dragstart: " + e);
        }
      }

      return args.onStart(ev, this, args);
    }, false);

    el.addEventListener('dragend', function(ev) {
      this.style.opacity = '1.0';

      return args.onEnd(ev, this, args);
    }, false);
  }

  /**
   * Menu class
   */
  var Menu = function(list) {
    var el = document.createElement('div');
    el.className = 'Menu';

    var ul = document.createElement('ul');

    var _onclick = function(ev, func) {
      func();
      OSjs.GUI.blurMenu();
    };

    if ( list ) {
      var m;
      var img;
      var span;
      for ( var i = 0, l = list.length; i < l; i++ ) {
        img = null;
        m = document.createElement('li');
        if ( list[i].icon ) {
          img = document.createElement('img');
          img.alt = '';
          img.src = list[i].icon.match(/^\//) ? list[i].icon : ('/themes/default/icons/16x16/' + list[i].icon);
          m.appendChild(img);
        }

        if ( list[i].name ) {
          m.className = 'MenuItem_' + list[i].name;
        }

        span = document.createElement('span');
        span.innerHTML = list[i].title;
        m.appendChild(span);

        m.onclick = (function(ref) {
          return function(ev) {
            if ( this.getAttribute("disabled") == "disabled" ) return;
            _onclick(ev, ref.onClick);
          };
        })(list[i]);
        ul.appendChild(m);
      }
    }

    el.appendChild(ul);

    this.$element = el;
  };

  Menu.prototype.destroy = function() {
    if ( this.$element && this.$element.parentNode ) {
      this.$element.parentNode.removeChild(this.$element);
    }
    this.$element = null;
  };

  Menu.prototype.show = function(pos) {
    this.$element.style.top = -10000 + 'px';
    this.$element.style.left = -10000 + 'px';
    document.body.appendChild(this.$element);

    var tw = pos.x + this.$element.offsetWidth;
    var th = pos.y + this.$element.offsetHeight;
    var px = pos.x;
    var py = pos.y;
    if ( tw > window.innerWidth ) {
      px = window.innerWidth - this.$element.offsetWidth;
    }
    if ( th > window.innerHeight ) {
      py = window.innerHeight - this.$element.offsetHeight;
    }

    this.$element.style.top = py + 'px';
    this.$element.style.left = px + 'px';
  };

  Menu.prototype.getRoot = function() {
    return this.$element;
  };

  /**
   * MenuBar Class
   */
  var MenuBar = function() {
    this.$element = document.createElement('div');
    this.$element.className = 'MenuBar';
    this.$ul = document.createElement('ul');
    this.$element.appendChild(this.$ul);
    this.onMenuOpen = function() {};

    this.$element.oncontextmenu = function(ev) {
      return false;
    };
  };

  MenuBar.prototype.destroy = function() {
    if ( this.$element && this.$element.parentNode) {
      this.$element.parentNode.removeChild(this.$element);
    }
    this.$element = null;
    this.$ul = null;
  };

  MenuBar.prototype.addItem = function(title, menu, pos) {
    var self = this;
    var el = document.createElement('li');
    el.innerHTML = title;
    el.onclick = function(ev) {
      var pos = {x: ev.clientX, y: ev.clientY};
      var tpos = OSjs.Utils.$position(this);
      if ( tpos ) {
        pos.x = tpos.left;
        pos.y = tpos.top;
      }
      var elm = OSjs.GUI.createMenu(menu, pos);
      self.onMenuOpen.call(this, elm, pos);
    };

    this.$ul.appendChild(el);
  };

  MenuBar.prototype.getRoot = function() {
    return this.$element;
  };

  /**
   * GUI Element
   */
  var _GUIElementCount = 0;
  var GUIElement = function(opts) {
    this.opts = opts || {};
    this.id = _GUIElementCount;
    this.destroyed = false;

    if ( typeof this.opts.dnd === 'undefined' ) {
      this.opts.dnd     = false;
    }
    if ( typeof this.opts.dndDrop === 'undefined' ) {
      this.opts.dndDrop = this.opts.dnd;
    }
    if ( typeof this.opts.dndDrag === 'undefined' ) {
      this.opts.dndDrag = this.opts.dnd;
    }
    if ( typeof this.opts.dndOpts === 'undefined' ) {
      this.opts.dndOpts = {};
    }

    this.onItemDropped  = function() {};
    this.onFilesDropped = function() {};

    this.$element = null;
    this.init();
    _GUIElementCount++;
  };

  GUIElement.prototype.init = function(className) {
    this.$element = document.createElement('div');
    this.$element.className = className;
    if ( this.opts.className ) {
      this.$element.className += ' ' + this.opts.className;
    }

    var cpb = OSjs.Utils.getCompability();
    if ( this.opts.dnd && this.opts.dndDrop && cpb.dnd ) {
      var opts = this.opts.dndOpts;
      var self = this;
      opts.onItemDropped = function(ev, el, item) {
        return self.onItemDropped.call(self, ev, el, item);
      };
      opts.onFilesDropped = function(ev, el, files) {
        return self.onFilesDropped.call(self, ev, el, files);
      };

      createDroppable(this.$element, opts);
    }

    var self = this;
    this.$element.addEventListener('mousedown', function(ev) {
      self.focus();
    }, false);

    return this.$element;
  };

  GUIElement.prototype.destroy = function() {
    this.destroyed = true;
    if ( this.$element && this.$element.parentNode ) {
      this.$element.parentNode.removeChild(this.$element);
    }
  };

  GUIElement.prototype.getRoot = function() {
    return this.$element;
  };

  GUIElement.prototype.onDndDrop = function(ev) {
    return true;
  };

  GUIElement.prototype.onKeyPress = function(ev) {
    if ( !this.focused ) return false;
    return true;
  };

  GUIElement.prototype.focus = function() {
    if ( this.focused ) return false;
    console.log("GUIElement::focus()", this.id);
    this.focused = true;
    return true;
  };

  GUIElement.prototype.blur = function() {
    if ( !this.focused ) return;
    this.focused = false;
  };

  /**
   * List View Class
   */
  var ListView = function(opts) {
    opts = opts || {};
    this.singleClick = typeof opts.singleClick === 'undefined' ? false : (opts.singleClick === true);
    this.rows = [];
    this.columns = [];
    this.$head = null;
    this.$body = null;
    this.$table = null;

    this.onActivate = function() {};
    this.onSelect = function() {};
    this.onCreateRow = function() {};

    GUIElement.apply(this, [opts]);
  };

  ListView.prototype = Object.create(GUIElement.prototype);

  ListView.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIListView']);

    var table = document.createElement('table');
    var head = document.createElement('thead');
    var body = document.createElement('tbody');

    var self = this;
    var activate = function(ev, type) {
      var t = ev.target;
      if ( t && t.tagName != 'TR' ) {
        if ( t.parentNode.tagName == 'TR' ) {
          t = t.parentNode;
        }
      }

      if ( t && t.tagName == 'TR' ) {
        if ( type == 'activate' ) {
          self.onActivate(ev, self, t);
        } else if ( type == 'select' ) {
          self.onSelect(ev, self, t);
        }
      }
    };

    var onDblClick = function(ev) {
      activate(ev, 'activate');
    };

    var onClick = function(ev) {
      activate(ev, 'select');
    };

    table.addEventListener('click', onClick, false);
    table.addEventListener(this.singleClick ? 'click' : 'dblclick', onDblClick, false);

    table.appendChild(head);
    table.appendChild(body);
    el.appendChild(table);

    this.$head = head;
    this.$body = body;
    this.$table = table;
    this.callback = function() {};
  };

  ListView.prototype.render = function() {
    OSjs.Utils.$empty(this.$head);
    OSjs.Utils.$empty(this.$body);

    var self = this;
    var i, l, ii, ll, row, col, colref, iter, val, type, tmp, d, span;

    row = document.createElement('tr');
    for ( i = 0, l = this.columns.length; i < l; i++ ) {
      colref = this.columns[i];
      if ( typeof colref.visible !== 'undefined' && colref.visible === false ) continue;

      col = document.createElement('td');
      col.className = 'Column_' + colref.key;
      col.innerHTML = colref.title;

      if ( colref.domProperties ) {
        for ( d in colref.domProperties ) {
          if ( colref.domProperties.hasOwnProperty(d) ) {
            col.setAttribute(d, colref.domProperties[d]);
          }
        }
      }

      row.appendChild(col);
    }
    this.$head.appendChild(row);

    for ( i = 0, l = this.rows.length; i < l; i++ ) {
      row = document.createElement('tr');
      iter = this.rows[i];

      for ( ii = 0, ll = this.columns.length; ii < ll; ii++ ) {
        span = null;

        colref = this.columns[ii];
        row.setAttribute('data-' + colref.key, iter[colref.key]);

        if ( (typeof colref.visible !== 'undefined' && colref.visible === false) ) continue;
        type = (typeof colref.type === 'undefined') ? 'text' : colref.type;
        col = document.createElement('td');
        col.className = 'Column_' + colref.key;

        if ( colref.callback ) {
          val = colref.callback(iter);
        } else {
          val = iter[colref.key];
        }

        if ( colref.domProperties ) {
          for ( d in colref.domProperties ) {
            if ( colref.domProperties.hasOwnProperty(d) ) {
              col.setAttribute(d, colref.domProperties[d]);
            }
          }
        }

        if ( type === 'image' ) {
          tmp = document.createElement('img');
          //tmp.ondragstart = function() { return false; };
          tmp.alt = '';
          tmp.src = val;
          col.appendChild(tmp);
          row.removeAttribute('data-' + colref.key);
        } else if ( type === 'button' ) {
          tmp = document.createElement('button');
          tmp.innerHTML = val;
          tmp.onclick = iter.customEvent;
          col.appendChild(tmp);
          row.removeAttribute('data-' + colref.key);
        } else {
          span = document.createElement('span');
          span.innerHTML = val;
          col.appendChild(span);
        }

        row.onclick = function(ev) {
          self._onRowClick.call(self, this, ev);
        };
        row.appendChild(col);
      }
      this.$body.appendChild(row);

      this.onCreateRow(row, iter, colref);
    }

    this.$element.scrollTop = 0;
  };

  ListView.prototype._onRowClick = (function() {
    var last;

    return function(el, ev) {
      if ( last ) {
        last.className = '';
      }
      el.className = 'active';
      last = el;

      if ( !ev ) {
        var viewHeight = this.$element.offsetHeight - (this.$head.style.visible === 'none' ? 0 : this.$head.offsetHeight);
        var viewBottom = this.$element.scrollTop;
        if ( el.offsetTop > (viewHeight + this.$element.scrollTop) ) {
          this.$element.scrollTop = el.offsetTop;
        } else if ( el.offsetTop < viewBottom ) {
          this.$element.scrollTop = el.offsetTop;
        }
      }
    };
  })();

  ListView.prototype.addColumn = function(c) {
    this.columns.push(c);
  };

  ListView.prototype.addRow = function(r) {
    this.rows.push(r);
  };

  ListView.prototype.setColumns = function(cols) {
    this.columns = cols || [];
  };

  ListView.prototype.setRows = function(rows) {
    this.rows = rows || [];
  };

  /**
   * FileView
   * FIXME: Fix exessive calls to chdir/refresh
   */
  var FileView = function(path, opts) {
    opts = opts || {};
    var mimeFilter = [];
    if ( opts.mimeFilter ) {
      mimeFilter = opts.mimeFilter || null;
      if ( !mimeFilter || Object.prototype.toString.call(mimeFilter) !== '[object Array]' ) {
        mimeFilter = [];
      }
    }

    ListView.apply(this, [opts]);
    this.opts.dnd = true;

    var self = this;
    this.selected = null;
    this.selectedDOMItem = null;
    this.path = path || '/';
    this.lastPath = this.path;
    this.mimeFilter = mimeFilter;
    this.onActivated = function(path, type, mime) {};
    this.onError = function(error) {};
    this.onFinished = function() {};
    this.onSelected = function(item, el) {};
    this.onRefresh = function() {};
    this.onDropped = function() { console.warn("Not implemented yet!"); /* FIXME */ };

    this.onActivate = function(ev, listView, t) {
      if ( t ) {
        var path = t.getAttribute('data-path');
        var type = t.getAttribute('data-type');
        if ( path ) {
          if ( type === 'file' ) {
            self.onActivated(path, type, t.getAttribute('data-mime'));
          } else {
            self.chdir(path);
          }
        }
      }
    };

    this.onSelect = function(ev, listView, t) {
      if ( t ) {
        var path = t.getAttribute('data-path');
        if ( path ) {
          self.selectedDOMItem = t;
          self.selected = {
            path: path,
            type: t.getAttribute('data-type'),
            mime: t.getAttribute('data-mime'),
            filename: t.getAttribute('data-filename')
          };

          self.onSelected(self.selected, t);
        }
      }
    };
  };

  FileView.prototype = Object.create(ListView.prototype);

  FileView.prototype.init = function() {
    ListView.prototype.init.apply(this, arguments);

    var cpb = OSjs.Utils.getCompability();
    if ( this.opts.dnd && this.opts.dndDrag && cpb.dnd ) {
      this.onCreateRow = function(el, item, column) {
        var self = this;
        createDraggable(el, {
          type: 'file',
          data: item
        });

        createDroppable(el, {
          onItemDropped: function(ev, el, item, args) {
            return self.onItemDropped.call(self, ev, el, item, args);
          },
          onFilesDropped: function(ev, el, files, args) {
            return self.onFilesDropped.call(self, ev, el, item, args);
          }
        });

      };
    }
  };

  FileView.prototype.onKeyPress = function(ev) {
    if ( this.destroyed ) return false;
    if ( !ListView.prototype.onKeyPress.apply(this, arguments) ) return;

    ev.preventDefault();
    if ( this.selected ) {

      var idx = OSjs.Utils.$index(this.selectedDOMItem, this.$body);
      var tidx = idx;
      if ( idx >= 0 && idx < this.$body.childNodes.length ) {
        if ( ev.keyCode === 38 ) {
          idx--;
        } else if ( ev.keyCode === 40 ) {
          idx++;
        } else if ( ev.keyCode === 13 ) {
          this.onActivate(ev, this, this.selectedDOMItem);
          return true;
        }

        if ( idx != tidx ) {
          this.setSelectedIndex(idx);
        }
      }
    }
    return true;
  };

  FileView.prototype.render = function(list, dir) {
    if ( this.destroyed ) return;
    this.selected = null;
    this.selectedDOMItem = null;

    var _callback = function(iter) {
      var icon = 'status/gtk-dialog-question.png';

      if ( iter.type == 'dir' ) {
        icon = 'places/folder.png';
      } else if ( iter.type == 'file' ) {
        if ( iter.mime ) {
          if ( iter.mime.match(/^text\//) ) {
            icon = 'mimetypes/txt.png';
          } else if ( iter.mime.match(/^audio\//) ) {
            icon = 'mimetypes/sound.png';
          } else if ( iter.mime.match(/^video\//) ) {
            icon = 'mimetypes/video.png';
          } else if ( iter.mime.match(/^image\//) ) {
            icon = 'mimetypes/image.png';
          } else if ( iter.mime.match(/^application\//) ) {
            icon = 'mimetypes/binary.png';
          }
        }
      }

      return  '/themes/default/icons/16x16/' + icon;
    };

    this.setColumns([
      {key: 'image', title: '', type: 'image', callback: _callback, domProperties: {width: "16"}},
      {key: 'filename', title: 'Filename'},
      {key: 'mime', title: 'Mime', domProperties: {width: "150"}},
      {key: 'size', title: 'Size', domProperties: {width: "100", textAlign: "right"}},
      {key: 'path', title: 'Path', visible: false},
      {key: 'type', title: 'Type', visible: false}
     ]);

    this.setRows(list);

    ListView.prototype.render.apply(this, []);
  };

  FileView.prototype.refresh = function(onRefreshed) {
    if ( this.destroyed ) return;
    return this.chdir(this.path, onRefreshed);
  };

  FileView.prototype.chdir = function(dir, onRefreshed) {
    if ( this.destroyed ) return;
    onRefreshed = onRefreshed || function() {};

    var self = this;
    this.onRefresh.call(this);

    OSjs.API.call('fs', {method: 'scandir', 'arguments' : [dir, {mimeFilter: this.mimeFilter}]}, function(res) {
      if ( self.destroyed ) return;

      var error = null;
      var rendered = false;
      if ( res ) {
        if ( res.error ) {
          self.onError.call(self, res.error, dir);
        } else {
          self.lastPath = self.path;
          self.path = dir;
          if ( res.result /* && res.result.length*/ ) {
            self.render(res.result, dir);
            rendered = true;
          }
        }

        if ( !rendered ) {
          self.render([], dir);
        }

        self.onFinished(dir);

        onRefreshed.call(this);
      }
    }, function(error) {
      self.onError.call(self, error, dir);
    });
  };

  FileView.prototype._onRowClick = function(el, ev) {
    if ( this.destroyed ) return;
    ListView.prototype._onRowClick.apply(this, arguments);
    this.selectedDOMItem = el;
    this.onSelect(ev, this, el);
  };

  FileView.prototype.getSelected = function() {
    return this.selected;
  };

  FileView.prototype.getItemByKey = function(key, val) {
    var rows = this.$table.tBodies[0].rows;
    var tmp, row;
    for ( var i = 0, l = rows.length; i < l; i++ ) {
      row = rows[i];
      tmp = row.getAttribute('data-' + key);
      if ( tmp == val ) {
        return row;
      }
    }
    return null;
  };

  FileView.prototype.setSelectedIndex = function(idx) {
    if ( this.destroyed ) return;
    var row = this.$table.tBodies[0].rows[idx];
    if ( row ) {
      this._onRowClick(row, null);
    }
  };

  FileView.prototype.setSelected = function(val, key) {
    if ( this.destroyed ) return;
    var row = this.getItemByKey(key, val);
    if ( row ) {
      this._onRowClick(row, null);
    }
  };

  FileView.prototype.getPath = function() {
    return this.path;
  };

  /**
   * Textarea
   */
  var Textarea = function() {
    this.$area = null;
    GUIElement.apply(this, arguments);
  };

  Textarea.prototype = Object.create(GUIElement.prototype);

  Textarea.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUITextarea']);
    this.$area = document.createElement('textarea');
    el.appendChild(this.$area);
    return el;
  };

  Textarea.prototype.setText = function(t) {
    if ( this.$area ) {
      this.$area.value = (t || '');
      return true;
    }
    return false;
  };

  Textarea.prototype.getText = function() {
    return this.$area ? this.$area.value : '';
  };

  Textarea.prototype.focus = function() {
    if ( !GUIElement.prototype.focus.apply(this, arguments) ) return false;
    if ( this.$area ) this.$area.focus();
    return true;
  };

  /**
   * Color Swatch
   */
  var ColorSwatch = function(w, h, onSelect) {
    this.$element = null;
    this.$canvas  = null;
    this.width    = w || 100;
    this.height   = h || 100;
    this.onSelect = onSelect || function(r, g, b) {};

    if ( !OSjs.Utils.getCompability()['canvas'] ) {
      throw "Canvas is not supported on your platform!";
    }

    this.init();
  };

  ColorSwatch.prototype.init = function() {
    var el        = document.createElement('div');
    el.className  = 'GUIColorSwatch';

    var cv        = document.createElement('canvas');
    cv.width      = this.width;
    cv.height     = this.height;

    var ctx       = cv.getContext('2d');
    var gradient  = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);

    // Create color gradient
    gradient.addColorStop(0,    "rgb(255,   0,   0)");
    gradient.addColorStop(0.15, "rgb(255,   0, 255)");
    gradient.addColorStop(0.33, "rgb(0,     0, 255)");
    gradient.addColorStop(0.49, "rgb(0,   255, 255)");
    gradient.addColorStop(0.67, "rgb(0,   255,   0)");
    gradient.addColorStop(0.84, "rgb(255, 255,   0)");
    gradient.addColorStop(1,    "rgb(255,   0,   0)");

    // Apply gradient to canvas
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Create semi transparent gradient (white -> trans. -> black)
    gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0,   "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.5, "rgba(0,     0,   0, 0)");
    gradient.addColorStop(1,   "rgba(0,     0,   0, 1)");

    // Apply gradient to canvas
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var self = this;
    cv.addEventListener('click', function(e) {
      var data = ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
      self.onSelect.call(self, data[0], data[1], data[2]);
    }, false);

    el.appendChild(cv);
    this.$element = el;
    this.$canvas = cv;
  };

  //
  // EXPORTS
  //
  OSjs.GUI.GUIElement   = GUIElement;

  OSjs.GUI.MenuBar      = MenuBar;
  OSjs.GUI.ListView     = ListView;
  OSjs.GUI.FileView     = FileView;
  OSjs.GUI.Textarea     = Textarea;
  OSjs.GUI.ColorSwatch  = ColorSwatch;

  OSjs.GUI.createDraggable  = createDraggable;
  OSjs.GUI.createDroppable  = createDroppable;

  var _MENU;
  OSjs.GUI.createMenu = function(items, pos) {
    items = items || [];
    pos = pos || {x: 0, y: 0};

    OSjs.GUI.blurMenu();

    _MENU = new Menu(items);
    _MENU.show(pos);
    return _MENU;
  };
  OSjs.GUI.blurMenu   = function() {
    if ( _MENU ) {
      _MENU.destroy();
      _MENU = null;
    }
  };

})();
