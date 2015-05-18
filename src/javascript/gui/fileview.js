/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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
(function(GUIElement, ListView, TreeView, IconView, _DataView, VFS) {
  'use strict';

  function createDragImage(ev, dragRoot) {
    return null;
    /*
    var el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.zIndex = -2;
    el.style.background = 'red';
    return {element: el, offset: {x: 20, y: 20}};
    */
  }

  /////////////////////////////////////////////////////////////////////////////
  // FileView
  /////////////////////////////////////////////////////////////////////////////

  /**
   * FileView > TreeView
   *
   * options: (See GUIElement for more)
   *  onSelected        Function        Callback - When item is selected (clicked)
   *  onActivated       Function        Callback - When item is activated (dblclick)
   */
  var FileTreeView = function(fileView, name, opts) {
    opts = opts || {};
    if ( typeof opts.dnd === 'undefined' ) {
      opts.dnd = true;
    }
    TreeView.apply(this, [name, opts]);

    this.onActivated  = function(item, el) {};
    this.onSelected   = function(item, el) {};
    this.fileView     = fileView;
  };

  FileTreeView.prototype = Object.create(TreeView.prototype);

  FileTreeView.prototype.init = function() {
    TreeView.prototype.init.apply(this, arguments);

    var self = this;
    if ( this.opts.dnd && this.opts.dndDrag && OSjs.Compability.dnd ) {
      this.onCreateItem = function(el, item) {
        var self = this;
        if ( item.filename === '..' ) { return; }

        if ( item.type === 'file' ) {
          el.title = ([
            OSjs.API._('LBL_FILENAME') + ': '  + item.filename,
            OSjs.API._('LBL_PATH')     + ': '  + item.path,
            OSjs.API._('LBL_SIZE')     + ': '  + item.size || 0,
            OSjs.API._('LBL_MIME')     + ': '  + item.mime || 'none'
          ]).join('\n');

          var file = new VFS.File(item);
          OSjs.API.createDraggable(el, {
            type   : 'file',
            source : {wid: self.wid},
            data   : file.getData(),
            dragImage : createDragImage
          });
        } else {
          el.title = item.path;

          OSjs.API.createDroppable(el, {
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
    function _createIcon(iter) {
      var defIcon = 'status/gtk-dialog-question.png';
      return OSjs.API.getFileIcon(iter, '16x16', defIcon);
    }

    list.forEach(function(iter, i) {
      if ( skipDot && iter.filename === '..' ) {
        return true;
      }

      iter.title = iter.filename;
      iter.icon  = _createIcon(iter);
      iter._loaded = false;

      if ( iter.type !== 'file' && iter.filename !== '..' ) {
        iter.items = [{
          icon: iter.icon,
          title: OSjs.API._('LBL_LOADING')
        }];
      }
      fileList.push(iter);

      return true;
    });

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
      this.onSelected(item, item._element);
    }
  };

  FileTreeView.prototype._onActivate = function(ev, item) {
    item = TreeView.prototype._onActivate.apply(this, arguments);
    if ( item && item.path ) {
      this.onActivated(item, item._element);
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

        var level = parseInt(item._element.className.replace('Level_', ''), 0);
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
   */
  var FileIconView = function(fileView, name, opts) {
    opts = opts || {};
    if ( typeof opts.dnd === 'undefined' ) {
      opts.dnd = true;
    }
    IconView.apply(this, [name, opts]);

    this.onActivated  = function(item, el) {};
    this.onSelected   = function(item, el) {};
    this.fileView     = fileView;
  };

  FileIconView.prototype = Object.create(IconView.prototype);

  FileIconView.prototype.init = function() {
    IconView.prototype.init.apply(this, arguments);

    var self = this;
    if ( this.opts.dnd && this.opts.dndDrag && OSjs.Compability.dnd ) {
      this.onCreateItem = function(el, item) {
        var self = this;
        if ( item.filename === '..' ) { return; }

        if ( item.type === 'file' ) {
          el.title = ([
            OSjs.API._('LBL_FILENAME') + ': '  + item.filename,
            OSjs.API._('LBL_PATH')     + ': '  + item.path,
            OSjs.API._('LBL_SIZE')     + ': '  + item.size || 0,
            OSjs.API._('LBL_MIME')     + ': '  + item.mime || 'none'
          ]).join('\n');

          var file = new VFS.File(item);
          OSjs.API.createDraggable(el, {
            type   : 'file',
            source : {wid: self.wid},
            data   : file.getData(),
            dragImage: createDragImage
          });
        } else {
          el.title = item.path;

          OSjs.API.createDroppable(el, {
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
    function _createIcon(iter) {
      var defIcon = 'status/gtk-dialog-question.png';
      return OSjs.API.getFileIcon(iter, '32x32', defIcon);
    }

    list.forEach(function(iter, i) {
      iter.label = iter.filename;
      iter.icon  = _createIcon(iter);
      fileList.push(iter);
    });

    IconView.prototype.render.apply(this, [fileList, true]);
  };

  FileIconView.prototype._onSelect = function(ev, item) {
    item = IconView.prototype._onSelect.apply(this, arguments);
    if ( item && item.path ) {
      this.onSelected(item, item._element);
    }
  };

  FileIconView.prototype._onActivate = function(ev, item) {
    item = IconView.prototype._onActivate.apply(this, arguments);
    if ( item && item.path ) {
      this.onActivated(item, item._element);
    }
  };

  /**
   * FileView > ListView
   *
   * options: (See GUIElement for more)
   *  onSelected        Function        Callback - When item is selected (clicked)
   *  onActivated       Function        Callback - When item is activated (dblclick)
   *  humanSize         bool            Show human-readable sized (default = True)
   */
  var FileListView = function(fileView, name, opts) {
    opts = opts || {};
    if ( typeof opts.dnd === 'undefined' ) {
      opts.dnd = true;
    }

    ListView.apply(this, [name, opts]);

    this.humanSize  = (typeof opts.humanSize === 'undefined' || opts.humanSize);

    this.onActivated  = function(item, el) {};
    this.onSelected   = function(item, el) {};
    this.onSort       = function() { console.warn('Not implemented yet!'); };
    this.fileView     = fileView;
    this.listColumns  = {
      mime: true,
      ctime: false,
      mtime: false,
      size: true
    };
  };

  FileListView.prototype = Object.create(ListView.prototype);

  FileListView.prototype.init = function() {
    ListView.prototype.init.apply(this, arguments);

    var self = this;
    if ( this.opts.dnd && this.opts.dndDrag && OSjs.Compability.dnd ) {
      this.onCreateItem = function(el, item, column) {
        var self = this;
        if ( item.filename === '..' ) { return; }

        if ( item.type === 'file' ) {
          el.title = ([
            OSjs.API._('LBL_FILENAME') + ': '  + item.filename,
            OSjs.API._('LBL_PATH')     + ': '  + item.path,
            OSjs.API._('LBL_SIZE')     + ': '  + item.size || 0,
            OSjs.API._('LBL_MIME')     + ': '  + item.mime || 'none'
          ]).join('\n');

          var file = new VFS.File(item);
          OSjs.API.createDraggable(el, {
            type   : 'file',
            source : {wid: self.wid},
            data   : file.getData(),
            dragImage : createDragImage
          });

        } else {
          el.title = item.path;

          OSjs.API.createDroppable(el, {
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

    function _callbackIcon(iter) {
      var icon = 'status/gtk-dialog-question.png';
      return OSjs.API.getFileIcon(iter, null, icon);
    }

    function _callbackSize(iter) {
      if ( iter.size === '' ) { return ''; }
      if ( self.humanSize ) {
        return OSjs.Utils.humanFileSize(iter.size);
      }
      return iter.size;
    }

    var cols = [
      {key: 'image',    title: '', type: 'image', callback: _callbackIcon, width: 16, resizable: false},
      {key: 'filename', title: OSjs.API._('LBL_FILENAME')},
      {key: 'mime',     title: OSjs.API._('LBL_MIME'), width: 150, visible: this.listColumns.mime},
      {key: 'ctime',    title: OSjs.API._('LBL_CREATED'), width: 150, visible: this.listColumns.ctime},
      {key: 'mtime',    title: OSjs.API._('LBL_MODIFIED'), width: 150, visible: this.listColumns.mtime},
      {key: 'size',     title: OSjs.API._('LBL_SIZE'), callback: _callbackSize, width: 80, visible: this.listColumns.size},
      {key: 'path',     title: OSjs.API._('LBL_PATH'), visible: false},
      {key: 'type',     title: OSjs.API._('LBL_TYPE'), visible: false}
    ];
    this.setColumns(cols);

    ListView.prototype.render.apply(this, [list, true]);
  };

  FileListView.prototype._onColumnClick = function(ev, col) {
    ListView.prototype._onColumnClick.apply(this, arguments);
    this.onSort(col);
  };

  FileListView.prototype._onActivate = function(ev, item) {
    item = ListView.prototype._onActivate.apply(this, arguments);
    if ( item && item.path ) {
      this.onActivated(item, item._element);
    }
  };

  FileListView.prototype._onSelect = function(ev, item) {
    item = ListView.prototype._onSelect.apply(this, arguments);
    if ( item && item.path ) {
      this.onSelected(item, item._element);
    }
  };

  /**
   * FileView
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @option  opts String      startViewType           Default view type (Default = ListView)
   * @option  opts bool        locked                  Locked (Default = false)
   * @option  opts bool        humanSize               Show human-readable sized (default = True)
   * @option  opts bool        summary                 Return statistics for onFinished() (Default = False)
   * @option  opts Function    onSelected              Callback - When item is selected (clicked)
   * @option  opts Function    onActivated             Callback - When item is activated (dblclick)
   * @option  opts Function    onItemDropped           Callback - When item has been dropped
   * @option  opts Function    onError                 Callback - When error happened
   * @option  opts Function    onRefresh               Callback - On refresh
   * @option  opts Function    onContextMenu           Callback - On context menu (item)
   * @option  opts Function    onViewContextMenu       Callback - On view context menu (background / view)
   * @option  opts Function    onColumnSort            Callback - On sort
   *
   * @see OSjs.Core.GUIElement
   * @api OSjs.GUI.FileView
   *
   * @class
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
    this.showDotFiles   = (typeof opts.showDotFiles === 'undefined') || opts.showDotFiles === true;
    this.locked         = opts.locked || false;
    this.viewRef        = null;

    this.onActivated        = function(item, el) {};
    this.onError            = function(error) {};
    this.onFinished         = function() {};
    this.onSelected         = function(item, el) {};
    this.onRefresh          = function() {};
    this.onContextMenu      = function(ev, el, item) {};
    this.onViewContextMenu  = function(ev) {};
    this.onItemDropped      = function(ev, el, item) {};
    this.onFilesDropped     = function(ev, el, files) {};

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
    if ( !this.inited ) {
      GUIElement.prototype.update.apply(this, arguments);

      this.createView(this.startViewType, this.getRoot());
    }
  };

  FileView.prototype.createView = function(v, root) {
    var self = this;

    if ( v !== this.viewType ) {

      if ( this.viewRef ) {
        this.viewRef.destroy();
        this.viewRef = null;

        this.sortKey = null;
        this.sortDir = true;
      }

      if ( v.toLowerCase() === 'listview' ) {
        this.viewRef = new FileListView(this, 'FileListView', this.viewOpts);
      } else if ( v.toLowerCase() === 'iconview' ) {
        this.viewRef = new FileIconView(this, 'FileIconView', this.viewOpts);
      } else if ( v.toLowerCase() === 'treeview' ) {
        this.viewRef = new FileTreeView(this, 'FileTreeView', this.viewOpts);
      } else {
        throw new Error('Invalid view type: ' + v);
      }

      // NOTE: Some quirks for having a child element
      if ( this._window ) {
        this.viewRef._setWindow(this._window);
      }
      this.viewRef._hooks = this._hooks;

      this.viewRef.onActivated  = function(item) {
        item = new VFS.File(item);
        if ( item ) {
          if ( item.type === 'file' ) {
            self.onActivated.call(this, item);
          } else {
            self.chdir(item.path);
          }
        }
      };

      this.viewRef.onSelected         = function() { return self.onSelected.apply(this, arguments); };
      this.viewRef.onContextMenu      = function() { return self.onContextMenu.apply(this, arguments); };
      this.viewRef.onViewContextMenu  = function() { return self.onViewContextMenu.apply(this, arguments); };
      this.viewRef.onItemDropped      = function() { return self.onItemDropped.apply(this, arguments); };
      this.viewRef.onFilesDropped     = function() { return self.onFilesDropped.apply(this, arguments); };
      this.viewRef.onSort             = function() { return self.onColumnSort.apply(this, arguments); };

      (root || this.$element).appendChild(this.viewRef.getRoot());
      this.viewType = v;

      if ( !this.rendered ) {
        this.viewRef.update();
      }
    }
  };

  /**
   * Refreshes the view
   *
   * @param   Function      onRefreshed       Callback on refreshed
   * @param   Function      onError           Callback on error
   * @param   boolean       restoreScroll     Restore previous scroll position ?
   *
   * @return  void
   *
   * @method  FileView::refresh()
   */
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

  /**
   * Performs a scandir and sorts the list
   *
   * @param   String    dir       The directory
   * @param   Function  onSuccess Callback on success
   * @param   Function  onError   Callback on error
   *
   * @return  void
   *
   * @method  FileView::_getDir()
   */
  FileView.prototype._getDir = function(dir, onSuccess, onError) {
    var self = this;

    onSuccess = onSuccess || function() {};
    onError   = onError   || function() {};

    function sortList(list, key, asc) {
      if ( !key ) { return list; }
      console.warn(list.length, key, asc);

      var first = null;
      if ( list.length && list[0].filename === '..' ) {
        first = list.shift();
      }

      var lst = list.sort(function(a, b) {
        var x = (a[key] === null) ? '' : '' + a[key],
            y = (b[key] === null) ? '' : '' + b[key];

        if ( key === 'size' ) {
          x = parseInt(x, 10);
          y = parseInt(y, 10);
          if ( isNaN(x) ) { x = asc ? -1 : Number.MAX_VALUE; }
          if ( isNaN(y) ) { y = asc ? -1 : Number.MAX_VALUE; }
        }
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      });

      if ( !asc ) {
        lst.reverse();
      }

      if ( first ) {
        lst.unshift(first);
      }

      return lst;
    }

    var file = new VFS.File(dir);
    file.type  = 'dir';
    VFS.scandir(file, function(error, result) {
      if ( error ) {
        onError.call(self, error, dir);
        return;
      }

      if ( result ) {
        if ( self.destroyed ) { return; }

        var rendered  = false;
        var num       = 0;
        var size      = 0;

        if ( self.locked ) {
          if ( result.length > 0 ) {
            if ( result[0].filename === '..' ) {
              result.shift();
            }
          }
        }
        if ( self.viewOpts.summary && result.length ) {
          result.forEach(function(s, i) {
            if ( s.filename !== '..' ) {
              if ( s.size ) {
                size += parseInt(s.size, 10);
              }
              num++;
            }
          });
        }

        var list = self.sortKey ? sortList(result, self.sortKey, self.sortDir) : result;
        onSuccess.call(self, list, dir, num, size);
      }
    }, {mimeFilter: this.mimeFilter, typeFilter: this.typeFilter, showDotFiles: this.showDotFiles});
  };

  FileView.prototype.chdir = function(dir, onRefreshed, onError) {
    if ( this.destroyed ) { return; }

    onRefreshed = onRefreshed || function() {};
    onError     = onError     || function() {};

    if ( !this.viewRef ) {
      throw new Error('FileView has no GUI element attached!');
    }

    this.onRefresh.call(this);

    this._getDir(dir, function(list, dir, num, size) {
      this.lastDir = dir;
      this.wasUpdated = true;

      if ( this.viewRef ) {
        try {
          this.viewRef.render(list, dir);
        } catch ( ex ) {
          console.warn('FileView::chdir()', 'exception', ex);
        }
      }

      this.onFinished(dir, num, size);

      if ( this.viewRef && this.getViewType() === 'ListView' ) {
        if ( this.sortKey ) {
          var col = this.viewRef.$headTop.getElementsByClassName('Column_' + this.sortKey);
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

  FileView.prototype.onGlobalKeyPress = function(ev) {
    if ( this.viewRef ) {
      return this.viewRef.onGlobalKeyPress(ev);
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

  /**
   * Sets if to display (hidden) dotfiles
   *
   * @param   boolean     t         Toggle on/off
   *
   * @return  void
   *
   * @method  FileView::setShowDotFiles()
   */
  FileView.prototype.setShowDotFiles = function(t) {
    this.showDotFiles = (t === true);
  };

  /**
   * Set the view type
   *
   * @param   String      v       View type (treeview/iconview/listview)
   *
   * @return  void
   *
   * @method  FileView::setViewType()
   */
  FileView.prototype.setViewType = function(v) {
    this.createView(v);

    if ( this.wasUpdated ) {
      this.refresh();
    }
  };

  /**
   * Set what key to sort by
   *
   * @param   String      col     The key to sort by
   *
   * @return  void
   *
   * @method  FileView::setSort()
   */
  FileView.prototype.setSort = function(col) {
    if ( this.wasUpdated ) {
      if ( this.sortKey === col && this.sortDir === false ) {
        this.sortKey = null;
        this.sortDir = true;
      } else {
        if ( col === this.sortKey ) {
          this.sortDir = !this.sortDir;
        } else {
          this.sortDir = true;
        }
        this.sortKey = col;
      }
      this.refresh();
    }
  };

  /**
   * Set the selected item
   *
   * @see     IconView::setSelected()
   * @see     TreeView::setSelected()
   * @see     ListView::setSelected()
   * @method  _DataView::setSelected()
   */
  FileView.prototype.setSelected = function(val, key) {
    if ( this.viewRef ) {
      this.viewRef.setSelected.apply(this.viewRef, [val, key, true]);
    }
  };

  /**
   * Get the current path
   *
   * @return  String
   *
   * @method FileView::getPath()
   */
  FileView.prototype.getPath = function() {
    return this.lastDir;
  };

  /**
   * Gets the selected item
   *
   * @return  Object
   *
   * @see     IconView::getSelected()
   * @see     TreeView::getSelected()
   * @see     ListView::getSelected()
   * @method  _DataView::getSelected()
   */
  FileView.prototype.getSelected = function() {
    return this.viewRef ? this.viewRef.getSelected() : null;
  };

  /**
   * Gets the current view type
   *
   * @return  String
   *
   * @method FileView::getViewType()
   */
  FileView.prototype.getViewType = function() {
    return this.viewType;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.FileView     = FileView;

})(OSjs.Core.GUIElement, OSjs.GUI.ListView, OSjs.GUI.TreeView, OSjs.GUI.IconView, OSjs.GUI._DataView, OSjs.VFS);
