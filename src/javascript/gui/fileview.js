"use strict";
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
(function(GUIElement, ListView, TreeView, IconView, _DataView) {

  /////////////////////////////////////////////////////////////////////////////
  // FileView
  /////////////////////////////////////////////////////////////////////////////

  /**
   * FileView > TreeView
   *
   * options: (See GUIElement for more)
   *  onSelected        Function        Callback - When item is selected (clicked)
   *  onActivated       Function        Callback - When item is activated (dblclick)
   *  onDropped         Function        Callback - When item has been dropped
   */
  var FileTreeView = function(fileView, name, opts) {
    opts = opts || {};
    if ( typeof opts.dnd === 'undefined' ) {
      opts.dnd = true;
    }
    TreeView.apply(this, [name, opts]);

    this.onActivated  = function(path, type, mime) {};
    this.onSelected   = function(item, el) {};
    this.onDropped    = function() { console.warn("Not implemented yet!"); };
    this.fileView     = fileView;
  };

  FileTreeView.prototype = Object.create(TreeView.prototype);

  FileTreeView.prototype.init = function() {
    TreeView.prototype.init.apply(this, arguments);

    var self = this;
    if ( this.opts.dnd && this.opts.dndDrag && OSjs.Compability.dnd ) {
      this.onCreateItem = function(el, item) {
        var self = this;
        if ( item.filename == '..' ) { return; }

        if ( item.type === 'file' ) {
          el.title = ([
            OSjs._("Filename") + ": "  + item.filename,
            OSjs._("Path")     + ": "  + item.path,
            OSjs._("Size")     + ": "  + item.size || 0,
            OSjs._("MIME")     + ": "  + item.mime || 'none'
          ]).join("\n");

          OSjs.GUI.createDraggable(el, {
            type   : 'file',
            source : {wid: self.wid},
            data   : {
              type   : 'file',
              filename: item.filename,
              path: item.path,
              size : item.size,
              mime: item.mime
            }
          });
        } else if ( item.type == 'dir' ) {
          el.title = item.path;

          OSjs.GUI.createDroppable(el, {
            onItemDropped: function(ev, el, item, args) {
              return self.onItemDropped.call(self, ev, el, item, args);
            },
            onFilesDropped: function(ev, el, files, args) {
              return self.onFilesDropped.call(self, ev, el, item, args);
            }
          });
        }

      };
    }
  };

  FileTreeView.prototype._createList = function(list, skipDot) {
    var fileList = [];
    var _createIcon = function(iter) {
      var defIcon = 'status/gtk-dialog-question.png';
      return OSjs.GUI.getFileIcon(iter.filename, iter.mime, iter.type, defIcon, '16x16');
    };

    var iter;
    for ( var i = 0; i < list.length; i++ ) {
      iter = list[i];
      if ( skipDot && iter.filename == '..' ) {
        continue;
      }

      iter.title = iter.filename;
      iter.icon  = _createIcon(iter);
      iter._loaded = false;

      if ( iter.type == 'dir' && iter.filename != '..' ) {
        iter.items = [{
          icon: iter.icon,
          title: 'Loading...'
        }];
      }
      fileList.push(iter);
    }

    return fileList;
  };

  FileTreeView.prototype.render = function(list, dir) {
    if ( this.destroyed ) { return; }
    var fileList = this._createList(list);
    TreeView.prototype.render.apply(this, [fileList, true]);
  };

  FileTreeView.prototype._onSelect = function(ev, item) {
    item = TreeView.prototype._onSelect.apply(this, arguments);
    if ( item && item.path ) {
      this.onSelected(item.path, item.type, item.mime);
    }
  };

  FileTreeView.prototype._onActivate = function(ev, item) {
    item = TreeView.prototype._onActivate.apply(this, arguments);
    if ( item && item.path ) {
      this.onActivated(item.path, item.type, item.mime);
    }
  };

  FileTreeView.prototype._onExpand = function(ev, item) {
    TreeView.prototype._onActivate.apply(this, arguments);
    if ( item._loaded ) {
      return;
    }

    if ( this.fileView && item && item.path && item._element ) {
      var fv = this.fileView;
      var self = this;
      fv._getDir(item.path, function(list, dir, num, size) {
        var ul = item._element.getElementsByTagName('UL')[0];
        if ( ul ) {
          OSjs.Utils.$empty(ul);
        }

        var level = item._element.className.replace('Level_', '') << 0;
        var fileList = self._createList(list, true);
        self._render(fileList, item._element, level+1, ul);
        ul.style.display = 'block';
      });

      item._loaded = true;
    }
  };

  /**
   * FileView > IconView
   *
   * options: (See GUIElement for more)
   *  onSelected        Function        Callback - When item is selected (clicked)
   *  onActivated       Function        Callback - When item is activated (dblclick)
   *  onDropped         Function        Callback - When item has been dropped
   */
  var FileIconView = function(fileView, name, opts) {
    opts = opts || {};
    if ( typeof opts.dnd === 'undefined' ) {
      opts.dnd = true;
    }
    IconView.apply(this, [name, opts]);

    this.onActivated  = function(path, type, mime) {};
    this.onSelected   = function(item, el) {};
    this.onDropped    = function() { console.warn("Not implemented yet!"); };
    this.fileView     = fileView;
  };

  FileIconView.prototype = Object.create(IconView.prototype);

  FileIconView.prototype.init = function() {
    IconView.prototype.init.apply(this, arguments);

    var self = this;
    if ( this.opts.dnd && this.opts.dndDrag && OSjs.Compability.dnd ) {
      this.onCreateItem = function(el, item) {
        var self = this;
        if ( item.filename == '..' ) { return; }

        if ( item.type === 'file' ) {
          el.title = ([
            OSjs._("Filename") + ": "  + item.filename,
            OSjs._("Path")     + ": "  + item.path,
            OSjs._("Size")     + ": "  + item.size || 0,
            OSjs._("MIME")     + ": "  + item.mime || 'none'
          ]).join("\n");

          OSjs.GUI.createDraggable(el, {
            type   : 'file',
            source : {wid: self.wid},
            data   : {
              type   : 'file',
              filename: item.filename,
              path: item.path,
              size : item.size,
              mime: item.mime
            }
          });
        } else if ( item.type == 'dir' ) {
          el.title = item.path;

          OSjs.GUI.createDroppable(el, {
            onItemDropped: function(ev, el, item, args) {
              return self.onItemDropped.call(self, ev, el, item, args);
            },
            onFilesDropped: function(ev, el, files, args) {
              return self.onFilesDropped.call(self, ev, el, item, args);
            }
          });
        }

      };
    }
  };

  FileIconView.prototype.render = function(list, dir) {
    if ( this.destroyed ) { return; }

    var fileList = [];
    var _createIcon = function(iter) {
      var defIcon = 'status/gtk-dialog-question.png';
      return OSjs.GUI.getFileIcon(iter.filename, iter.mime, iter.type, defIcon, '32x32');
    };

    var iter;
    for ( var i = 0; i < list.length; i++ ) {
      iter = list[i];
      iter.label = iter.filename;
      iter.icon  = _createIcon(iter);
      fileList.push(iter);
    }

    IconView.prototype.render.apply(this, [fileList, true]);
  };

  FileIconView.prototype._onSelect = function(ev, item) {
    item = IconView.prototype._onSelect.apply(this, arguments);
    if ( item && item.path ) {
      this.onSelected(item.path, item.type, item.mime);
    }
  };

  FileIconView.prototype._onActivate = function(ev, item) {
    item = IconView.prototype._onActivate.apply(this, arguments);
    if ( item && item.path ) {
      this.onActivated(item.path, item.type, item.mime);
    }
  };

  /**
   * FileView > ListView
   *
   * options: (See GUIElement for more)
   *  onSelected        Function        Callback - When item is selected (clicked)
   *  onActivated       Function        Callback - When item is activated (dblclick)
   *  onDropped         Function        Callback - When item has been dropped
   *  humanSize         bool            Show human-readable sized (default = True)
   */
  var FileListView = function(fileView, name, opts) {
    opts = opts || {};
    if ( typeof opts.dnd === 'undefined' ) {
      opts.dnd = true;
    }

    ListView.apply(this, [name, opts]);

    this.humanSize  = (typeof opts.humanSize === 'undefined' || opts.humanSize);

    this.onActivated  = function(path, type, mime) {};
    this.onSelected   = function(item, el) {};
    this.onDropped    = function() { console.warn("Not implemented yet!"); };
    this.onSort       = function() { console.warn("Not implemented yet!"); };
    this.fileView     = fileView;
  };

  FileListView.prototype = Object.create(ListView.prototype);

  FileListView.prototype.init = function() {
    ListView.prototype.init.apply(this, arguments);

    var self = this;
    if ( this.opts.dnd && this.opts.dndDrag && OSjs.Compability.dnd ) {
      this.onCreateItem = function(el, item, column) {
        var self = this;
        if ( item.filename == '..' ) { return; }

        if ( item.type === 'file' ) {
          el.title = ([
            OSjs._("Filename") + ": "  + item.filename,
            OSjs._("Path")     + ": "  + item.path,
            OSjs._("Size")     + ": "  + item.size || 0,
            OSjs._("MIME")     + ": "  + item.mime || 'none'
          ]).join("\n");

          OSjs.GUI.createDraggable(el, {
            type   : 'file',
            source : {wid: self.wid},
            data   : {
              type: 'file',
              filename: item.filename,
              path: item.path,
              size : item.size,
              mime: item.mime
            }
          });

        } else if ( item.type == 'dir' ) {
          el.title = item.path;

          OSjs.GUI.createDroppable(el, {
            onItemDropped: function(ev, el, item, args) {
              return self.onItemDropped.call(self, ev, el, item, args);
            },
            onFilesDropped: function(ev, el, files, args) {
              return self.onFilesDropped.call(self, ev, el, item, args);
            }
          });
        }

      };
    }
  };

  FileListView.prototype.render = function(list, dir) {
    if ( this.destroyed ) { return; }
    var self = this;

    var _callbackIcon = function(iter) {
      var icon = 'status/gtk-dialog-question.png';
      return OSjs.GUI.getFileIcon(iter.filename, iter.mime, iter.type, icon);
    };

    var _callbackSize = function(iter) {
      if ( iter.size === '' ) { return ''; }
      if ( self.humanSize ) {
        return OSjs.Utils.humanFileSize(iter.size);
      }
      return iter.size;
    };

    this.setColumns([
      {key: 'image',    title: '', type: 'image', callback: _callbackIcon, domProperties: {width: "16"}, resizable: false},
      {key: 'filename', title: OSjs._('Filename')},
      {key: 'mime',     title: OSjs._('MIME'), domProperties: {width: "150"}},
      {key: 'size',     title: OSjs._('Size'), callback: _callbackSize, domProperties: {width: "80"}},
      {key: 'path',     title: OSjs._('Path'), visible: false},
      {key: 'type',     title: OSjs._('Type'), visible: false}
     ]);

    ListView.prototype.render.apply(this, [list, true]);
  };

  FileListView.prototype._onColumnClick = function(ev, col) {
    ListView.prototype._onColumnClick.apply(this, arguments);
    this.onSort(col);
  };

  FileListView.prototype._onActivate = function(ev, item) {
    var item = ListView.prototype._onActivate.apply(this, arguments);
    if ( item && item.path ) {
      this.onActivated(item.path, item.type, item.mime);
    }
  };

  FileListView.prototype._onSelect = function(ev, item) {
    var item = ListView.prototype._onSelect.apply(this, arguments);
    if ( item && item.path ) {
      this.onSelected(item, item._element);
    }
  };

  /**
   * FileView
   *
   * options: (See GUIElement for more)
   *  startViewType       String          Default view type (Default = ListView)
   *  locked              bool            Locked (Default = false)
   *  humanSize           bool            Show human-readable sized (default = True)
   *  summary             bool            Return statistics for onFinished() (Default = False)
   *  onSelected          Function        Callback - When item is selected (clicked)
   *  onActivated         Function        Callback - When item is activated (dblclick)
   *  onItemDropped       Function        Callback - When item has been dropped
   *  onDropped           Function        Callback - When item has been dropped (FIXME)
   *  onError             Function        Callback - When error happened
   *  onRefresh           Function        Callback - On refresh
   *  onContextMenu       Function        Callback - On context menu (item)
   *  onViewContextMenu   Function        Callback - On view context menu (background / view)
   *  onColumnSort        Function        Callback - On sort
   */
  var FileView = function(name, opts) {
    opts = opts || {};

    var self = this;
    var mimeFilter = [];
    if ( opts.mimeFilter ) {
      mimeFilter = opts.mimeFilter || null;
      if ( !mimeFilter || Object.prototype.toString.call(mimeFilter) !== '[object Array]' ) {
        mimeFilter = [];
      }
    }

    var viewOpts = {
      dnd        : (typeof opts.dnd === 'undefined' || opts.dnd === true),
      summary    : opts.summary || false,
      humanSize  : (typeof opts.humanSize === 'undefined' || opts.humanSize)
    };

    this.startViewType  = opts.viewType || 'ListView';
    this.viewType       = null;
    this.viewOpts       = viewOpts;
    this.lastDir        = viewOpts.path || '/';
    this.mimeFilter     = mimeFilter;
    this.typeFilter     = opts.typeFilter || null;
    this.wasUpdated     = false;
    this.sortKey        = null;
    this.sortDir        = true; // true = asc, false = desc
    this.locked         = opts.locked || false;
    this.viewRef        = null;

    this.onActivated        = function(path, type, mime) {};
    this.onError            = function(error) {};
    this.onFinished         = function() {};
    this.onSelected         = function(item, el) {};
    this.onRefresh          = function() {};
    this.onDropped          = function() { console.warn("Not implemented yet!"); };
    this.onContextMenu      = function(ev, el, item) {};
    this.onViewContextMenu  = function(ev) {};
    this.onItemDropped      = function(ev, el, item) {};

    this.onColumnSort   = function(column) {
      if ( column === 'image' ) { column = null; }

      self.setSort(column);
    };

    GUIElement.apply(this, [name, opts]);
  };

  FileView.prototype = Object.create(GUIElement.prototype);

  FileView.prototype.destroy = function() {
    if ( this.viewRef ) {
      this.viewRef.destroy();
      this.viewRef = null;
    }

    GUIElement.prototype.destroy.apply(this, arguments);
  };

  FileView.prototype.init = function() {
    return GUIElement.prototype.init.apply(this, ['GUIFileView']);
  };

  FileView.prototype.update = function() {
    GUIElement.prototype.update.apply(this, arguments);
    this.createView(this.startViewType, this.getRoot());
  };

  FileView.prototype.createView = function(v, root) {
    var self = this;

    if ( v != this.viewType ) {

      if ( this.viewRef ) {
        this.viewRef.destroy();
        this.viewRef = null;

        this.sortKey = null;
        this.sortDir = true;
      }

      if ( v.toLowerCase() == 'listview' ) {
        this.viewRef = new FileListView(this, 'FileListView', this.viewOpts);
      } else if ( v.toLowerCase() == 'iconview' ) {
        this.viewRef = new FileIconView(this, 'FileIconView', this.viewOpts);
      } else if ( v.toLowerCase() == 'treeview' ) {
        this.viewRef = new FileTreeView(this, 'FileTreeView', this.viewOpts);
      } else {
        throw "Invalid view type: " + v;
      }

      // NOTE: Some quirks for having a child element
      if ( this._window ) {
        this.viewRef._setWindow(this._window);
      }
      this.viewRef._hooks = this._hooks;

      this.viewRef.onActivated  = function(path, type, mime) {
        if ( type === 'dir' ) {
          self.chdir(path);
        } else {
          self.onActivated.apply(this, arguments);
        }
      };

      this.viewRef.onSelected         = function() { return self.onSelected.apply(this, arguments); };
      this.viewRef.onDropped          = function() { return self.onDropped.apply(this, arguments); };
      this.viewRef.onContextMenu      = function() { return self.onContextMenu.apply(this, arguments); };
      this.viewRef.onViewContextMenu  = function() { return self.onViewContextMenu.apply(this, arguments); };
      this.viewRef.onItemDropped      = function() { return self.onItemDropped.apply(this, arguments); };
      this.viewRef.onSort             = function() { return self.onColumnSort.apply(this, arguments); };

      (root || this.$element).appendChild(this.viewRef.getRoot());
      this.viewType = v;

      if ( !this.rendered ) {
        this.viewRef.update();
      }
    }
  };

  FileView.prototype.refresh = function(onRefreshed, onError, restoreScroll) {
    onRefreshed = onRefreshed || function() {};
    onError = onError || function() {};
    restoreScroll = (typeof restoreScroll !== 'undefined') && (restoreScroll === true);

    if ( this.viewRef ) {
      var v = this.viewRef.$view || {};
      var scrollTop = v.scrollTop;

      this.chdir(this.getPath(), function() {
        onRefreshed.apply(this, arguments);

        setTimeout(function() {
          if ( v && restoreScroll ) {
            v.scrollTop = scrollTop;
          }
        }, 10);
      }, onError);
    }
  };

  FileView.prototype._getDir = function(dir, onSuccess, onError) {
    var self = this;

    onSuccess = onSuccess || function() {};
    onError   = onError   || function() {};

    function sortList(list, key, asc) {
      if ( !key ) { return list; }

      var first = null;
      if ( list.length && list[0].filename === '..' ) {
        first = list.shift();
      }

      var lst = list.sort(function(a, b) {
        var keyA = new Date(a[key]),
            keyB = new Date(b[key]);

        if(keyA < keyB) { return -1; }
        if(keyA > keyB) { return 1; }
        return 0;
      });

      if ( !asc ) {
        lst.reverse();
      }

      if ( first ) {
        lst.unshift(first);
      }

      return lst;
    }

    OSjs.API.call('fs', {method: 'scandir', 'arguments' : [dir, {mimeFilter: this.mimeFilter, typeFilter: this.typeFilter}]}, function(res) {
      if ( self.destroyed ) { return; }

      var rendered  = false;
      var num       = 0;
      var size      = 0;
      var list      = [];

      if ( res ) {
        if ( res.error ) {
          onError.call(self, res.error, dir);
          return;
        } else {
          if ( res.result /* && res.result.length*/ ) {
            if ( self.locked ) {
              if ( res.result.length > 0 ) {
                if ( res.result[0].filename == '..' ) {
                  res.result.shift();
                }
              }
            }
            if ( self.viewOpts.summary && res.result.length ) {
              for ( var i = 0, l = res.result.length; i < l; i++ ) {
                if ( res.result[i].filename !== ".." ) {
                  if ( res.result[i].size ) {
                    size += (res.result[i].size << 0);
                  }
                  num++;
                }
              }
            }

            list = self.sortKey ? sortList(res.result, self.sortKey, self.sortDir) : res.result;
          }
        }
      }

      onSuccess.call(self, list, dir, num, size);
    }, function(error) {
      onError.call(self, error, dir, true);
    });
  };

  FileView.prototype.chdir = function(dir, onRefreshed, onError) {
    if ( this.destroyed ) { return; }

    onRefreshed = onRefreshed || function() {};
    onError     = onError     || function() {};

    if ( !this.viewRef ) {
      throw "FileView has no GUI element attached!";
    }

    this.onRefresh.call(this);

    this._getDir(dir, function(list, dir, num, size) {
      this.lastDir = dir;
      this.wasUpdated = true;

      if ( this.viewRef ) {
        this.viewRef.render(list, dir);
      }

      this.onFinished(dir, num, size);

      if ( this.viewRef && this.getViewType() === 'ListView' ) {
        if ( this.sortKey ) {
          var col = this.viewRef.$headTop.getElementsByClassName("Column_" + this.sortKey);
          col = (col && col.length) ? col[0] : null;
          if ( col ) {
            //col.className += 'Sorted';
            var arrow = document.createElement('div');
            arrow.className = 'Arrow ' + (this.sortDir ? 'Ascending' : 'Descending');
            col.firstChild.appendChild(arrow);
          }
        }
      }

      onRefreshed.call(this);
    }, function(error, dir, arg) {
      this.onError.call(this, error, dir, (arg || false));
      onError.call(this, error, dir, (arg || false));
    });
  };

  FileView.prototype.onDndDrop = function(ev) {
    if ( this.viewRef ) {
      return this.viewRef.onDndDrop(ev);
    }
    return true;
  };

  FileView.prototype.onKeyPress = function(ev) {
    if ( this.viewRef ) {
      return this.viewRef.onKeyPress(ev);
    }
    return true;
  };

  FileView.prototype.focus = function(ev) {
    if ( GUIElement.prototype.focus.apply(this, arguments) ) {
      if ( this.viewRef ) {
        return this.viewRef.focus(ev);
      }
    }
    return false;
  };

  FileView.prototype.blur = function(ev) {
    if ( GUIElement.prototype.blur.apply(this, arguments) ) {
      if ( this.viewRef ) {
        return this.viewRef.blur(ev);
      }
    }
    return false;
  };

  FileView.prototype.setViewType = function(v) {
    this.createView(v);

    if ( this.wasUpdated ) {
      this.refresh();
    }
  };

  FileView.prototype.setSort = function(col) {
    if ( this.wasUpdated ) {
      if ( col === this.sortKey ) {
        this.sortDir = !this.sortDir;
      } else {
        this.sortDir = true;
      }
      this.sortKey = col;
      this.refresh();
    }
  };

  FileView.prototype.setSelected = function(val, key) {
    if ( this.viewRef ) {
      this.viewRef.setSelected.apply(this.viewRef, [val, key, true]);
    }
  };

  FileView.prototype.getPath = function() {
    return this.lastDir;
  };

  FileView.prototype.getSelected = function() {
    return this.viewRef ? this.viewRef.getSelected() : null;
  };

  FileView.prototype.getViewType = function() {
    return this.viewType;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.FileView     = FileView;

})(OSjs.GUI.GUIElement, OSjs.GUI.ListView, OSjs.GUI.TreeView, OSjs.GUI.IconView, OSjs.GUI._DataView);
