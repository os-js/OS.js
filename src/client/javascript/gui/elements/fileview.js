/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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
(function(API, Utils, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ABSTRACTION HELPERS
  /////////////////////////////////////////////////////////////////////////////

  var _iconSizes = { // Defaults to 16x16
    'gui-icon-view': '32x32'
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function getFileIcon(iter, size) {
    if ( iter.icon && typeof iter.icon === 'object' ) {
      return API.getIcon(iter.icon.filename, size, iter.icon.application);
    }

    var icon = 'status/dialog-question.png';
    return API.getFileIcon(iter, size, icon);
  }

  function getFileSize(iter) {
    var filesize = '';
    if ( iter.type !== 'dir' && iter.size >= 0 ) {
      filesize = Utils.humanFileSize(iter.size);
    }
    return filesize;
  }

  var removeExtension = (function() {
    var mimeConfig;

    return function(str, opts) {
      if ( !mimeConfig ) {
        mimeConfig = API.getConfig('MIME.mapping');
      }

      if ( opts.extensions === false ) {
        var ext = Utils.filext(str);
        if ( ext ) {
          ext = '.' + ext;
          if ( mimeConfig[ext] ) {
            str = str.substr(0, str.length - ext.length);
          }
        }
      }
      return str;
    };
  })();

  function getDateFromStamp(stamp) {
    if ( typeof stamp === 'string' ) {
      var date = null;
      try {
        date = new Date(stamp);
        //date = new Date(stamp.replace('T', ' ').replace(/\..+/, ''));
      } catch ( e ) {}

      if ( date ) {
        return OSjs.Helpers.Date.format(date);
      }
    }
    return stamp;
  }

  function getListViewColumns(cls, iter, opts) {
    opts = opts || {};

    var columnMapping = {
      filename: {
        label: 'LBL_FILENAME',
        icon: function() {
          return getFileIcon(iter);
        },
        value: function() {
          return removeExtension(iter.filename, opts);
        }
      },
      mime: {
        label: 'LBL_MIME',
        size: '100px',
        icon: function() {
          return null;
        },
        value: function() {
          return iter.mime;
        }
      },
      mtime: {
        label: 'LBL_MODIFIED',
        size: '160px',
        icon: function() {
          return null;
        },
        value: function() {
          return getDateFromStamp(iter.mtime);
        }
      },
      ctime: {
        label: 'LBL_CREATED',
        size: '160px',
        icon: function() {
          return null;
        },
        value: function() {
          return getDateFromStamp(iter.ctime);
        }
      },
      size: {
        label: 'LBL_SIZE',
        size: '120px',
        icon: function() {
          return null;
        },
        value: function() {
          return getFileSize(iter);
        }
      }
    };

    var defColumns = ['filename', 'mime', 'size'];
    var useColumns = defColumns;

    if ( !opts.defaultcolumns ) {
      var vfsOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
      var scandirOptions = vfsOptions.scandir || {};
      useColumns = scandirOptions.columns || defColumns;
    }

    var columns = [];
    var sortBy = cls.$element.getAttribute('data-sortby');
    var sortDir = cls.$element.getAttribute('data-sortdir');

    useColumns.forEach(function(key, idx) {
      var map = columnMapping[key];

      if ( iter ) {
        columns.push({
          sortBy: key,
          label: map.value(),
          icon: map.icon(),
          textalign: idx === 0 ? 'left' : 'right'
        });
      } else {
        columns.push({
          sortBy: key,
          sortDir: key === sortBy ? sortDir : null,
          label: API._(map.label),
          size: map.size || '',
          resizable: idx > 0,
          textalign: idx === 0 ? 'left' : 'right'
        });
      }
    });

    return columns;
  }

  function scandir(dir, opts, cb, oncreate) {
    var file = new VFS.File(dir);
    file.type  = 'dir';

    var scanopts = {
      backlink:           opts.backlink,
      showDotFiles:       opts.dotfiles === true,
      showFileExtensions: opts.extensions === true,
      mimeFilter:         opts.filter || [],
      typeFilter:         opts.filetype || null,
      sortBy:             opts.sortby,
      sortDir:            opts.sortdir
    };

    try {
      VFS.scandir(file, function(error, result) {
        if ( error ) {
          cb(error); return;
        }

        var list = [];
        var summary = {size: 0, directories: 0, files: 0, hidden: 0};

        function isHidden(iter) {
          return (iter.filename || '').substr(0) === '.';
        }

        (result || []).forEach(function(iter) {
          list.push(oncreate(iter));

          summary.size += iter.size || 0;
          summary.directories += iter.type === 'dir' ? 1 : 0;
          summary.files += iter.type !== 'dir' ? 1 : 0;
          summary.hidden += isHidden(iter) ? 1 : 0;
        });

        cb(false, list, summary);
      }, scanopts);
    } catch ( e ) {
      cb(e);
    }
  }

  function readdir(cls, dir, done, sopts) {
    var childView = cls.getChildView();
    if ( !childView ) {
      return;
    }
    sopts = sopts || {};

    var vfsOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
    var scandirOptions = vfsOptions.scandir || {};

    var el = cls.$element;
    var target = childView.$element;
    var tagName = target.tagName.toLowerCase();
    el.setAttribute('data-path', dir);

    var opts = {filter: null, backlink: sopts.backlink};
    function setOption(s, d, c, cc) {
      if ( el.hasAttribute(s) ) {
        opts[d] = c(el.getAttribute(s));
      } else {
        opts[d] = (cc || function() {})();
      }
    }

    setOption('data-sortby', 'sortby', function(val) {
      return val;
    });
    setOption('data-sortdir', 'sortdir', function(val) {
      return val;
    });
    setOption('data-dotfiles', 'dotfiles', function(val) {
      return val === 'true';
    }, function() {
      return scandirOptions.showHiddenFiles === true;
    });
    setOption('data-extensions', 'extensions', function(val) {
      return val === 'true';
    }, function() {
      return scandirOptions.showFileExtensions === true;
    });
    setOption('data-filetype', 'filetype', function(val) {
      return val;
    });
    setOption('data-defaultcolumns', 'defaultcolumns', function(val) {
      return val === 'true';
    });

    try {
      opts.filter = JSON.parse(el.getAttribute('data-filter'));
    } catch ( e ) {
    }

    scandir(dir, opts, function(error, result, summary) {
      if ( tagName === 'gui-list-view' ) {
        cls.getChildView().set('zebra', true);
        if ( sopts.headers !== false ) {
          cls.getChildView().set('columns', getListViewColumns(cls, null, opts));
        }
      }

      done(error, result, summary);
    }, function(iter) {
      var tooltip = Utils.format('{0}\n{1}\n{2} {3}', iter.type.toUpperCase(), iter.filename, getFileSize(iter), iter.mime || '');

      function _createEntry() {
        var row = {
          value: iter,
          id: iter.id || removeExtension(iter.filename, opts),
          label: iter.filename,
          tooltip: tooltip,
          icon: getFileIcon(iter, _iconSizes[tagName] || '16x16')
        };

        if ( tagName === 'gui-tree-view' && iter.type === 'dir' ) {
          if ( iter.filename !== '..' ) {
            row.entries = [{
              label: 'Loading...'
            }];
          }
        }

        return row;
      }

      // List view works a little differently
      if ( tagName !== 'gui-list-view' ) {
        return _createEntry();
      }

      return {
        value: iter,
        id: iter.id || iter.filename,
        tooltip: tooltip,
        columns: getListViewColumns(cls, iter, opts)
      };
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-file-view'
   *
   * Abstraction layer for displaying files within Icon-, Tree- or List Views
   *
   * For more properties and events etc, see 'dataview'
   *
   * <pre><code>
   *   property  multiple    boolean       If multiple elements are selectable
   *   property  type        String        Child type
   *   property  filter      Array         MIME Filters
   *   property  dotfiles    boolean       Show dotfiles (default=true)
   *   property  extensions  boolean       Show file extensions (default=true)
   *   action    chdir                     Change directory => fn(args)  (args = {path: '', done: function() })
   * </code></pre>
   *
   * @constructor FileView
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   * @see OSjs.GUI.Elements.GUIListView
   * @see OSjs.GUI.Elements.GUITreeView
   * @see OSjs.GUI.Elements.GUIIconView
   */
  GUI.Element.register({
    tagName: 'gui-file-view'
  }, {
    on: function(evName, callback, params) {
      if ( (['activate', 'select', 'contextmenu', 'sort']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }

      var el = this.$element;
      if ( evName === '_contextmenu' ) {
        el.setAttribute('data-has-contextmenu', 'true');
      }

      Utils.$bind(el, evName, callback.bind(this), params);
      return this;
    },

    set: function(param, value, arg, arg2) {
      var el = this.$element;

      if ( param === 'type' ) {
        var firstChild = el.children[0];
        if ( firstChild && firstChild.tagName.toLowerCase() === value ) {
          return true;
        }

        el.setAttribute('data-type', value);
        this.buildChildView();

        if ( typeof arg === 'undefined' || arg === true ) {
          this.chdir({
            path: el.getAttribute('data-path')
          });
        }
        return this;
      } else if ( (['filter', 'dotfiles', 'filetype', 'extensions', 'defaultcolumns', 'sortby', 'sortdir']).indexOf(param) >= 0 ) {
        GUI.Helpers.setProperty(el, param, value);
        return this;
      }

      var childView = this.getChildView();
      if ( childView ) {
        return childView.set.apply(childView, arguments);
      }
      return GUI.DataView.prototype.set.apply(this, arguments);
    },

    build: function() {
      if ( this.childView ) {
        return;
      }

      this.buildChildView();

      var el = this.$element;
      var self = this;

      Utils.$bind(el, '_expand', function(ev) {
        var target = ev.detail.element;
        if ( target.getAttribute('data-was-rendered') ) {
          return;
        }

        if ( ev.detail.expanded ) {
          var entry = ev.detail.entries[0].data;
          target.setAttribute('data-was-rendered', String(true));
          readdir(self, entry.path, function(error, result, summary) {
            if ( !error ) {
              target.querySelectorAll('gui-tree-view-entry').forEach(function(e) {
                Utils.$remove(e);
              });

              var childView = self.getChildView();
              if ( childView ) {
                childView.add({
                  entries: result,
                  parentNode: target
                });
              }
            }
          }, {backlink: false});
        }
      });

      return this;
    },

    values: function() {
      var childView = this.getChildView();
      if ( childView ) {
        return childView.values();
      }
      return null;
    },

    contextmenu: function(ev) {
      var vfsOptions = OSjs.Core.getSettingsManager().instance('VFS');
      var scandirOptions = (vfsOptions.get('scandir') || {});

      function setOption(opt, toggle) {
        var opts = {scandir: {}};
        opts.scandir[opt] = toggle;
        vfsOptions.set(null, opts, true);
      }

      API.createMenu([{
        title: API._('LBL_SHOW_HIDDENFILES'),
        type: 'checkbox',
        checked: scandirOptions.showHiddenFiles === true,
        onClick: function() {
          setOption('showHiddenFiles', !scandirOptions.showHiddenFiles);
        }
      }, {
        title: API._('LBL_SHOW_FILEEXTENSIONS'),
        type: 'checkbox',
        checked: scandirOptions.showFileExtensions === true,
        onClick: function() {
          setOption('showFileExtensions', !scandirOptions.showFileExtensions);
        }
      }], ev);
    },

    chdir: function(args) {
      var childView = this.getChildView();
      if ( !childView ) {
        childView = this.buildChildView();
      }

      var self = this;
      var cb = args.done || function() {};
      var dir = args.path || OSjs.API.getDefaultPath();
      var child = childView;
      var el = this.$element;

      clearTimeout(el._readdirTimeout);
      el._readdirTimeout = setTimeout(function() {
        readdir(self, dir, function(error, result, summary) {
          if ( error ) {
            API.error(API._('ERR_VFSMODULE_XHR_ERROR'), API._('ERR_VFSMODULE_SCANDIR_FMT', dir), error);
          } else {
            child.clear();
            child.add(result);
          }
          cb(error, summary);
        }, args.opts);
      }, 50); // Prevent exessive calls
    },

    getChildViewType: function() {
      var type = this.$element.getAttribute('data-type') || 'list-view';
      if ( !type.match(/^gui\-/) ) {
        type = 'gui-' + type;
      }
      return type;
    },

    getChildView: function() {
      return GUI.Element.createFromNode(this.$element.children[0]);
    },

    buildChildView: function() {
      var self = this;
      var el = this.$element;
      var type = this.getChildViewType();
      var childView = this.getChildView();

      if ( childView ) {
        if ( childView.$element && childView.$element.tagName.toLowerCase() === type ) {
          return;
        }
      }

      Utils.$empty(el);

      var nel = GUI.Element.create(type, {'draggable': true, 'draggable-type': 'file'});
      nel.build();

      nel.on('select', function(ev) {
        el.dispatchEvent(new CustomEvent('_select', {detail: ev.detail}));
      });
      nel.on('activate', function(ev) {
        el.dispatchEvent(new CustomEvent('_activate', {detail: ev.detail}));
      });
      nel.on('sort', function(ev) {
        el.setAttribute('data-sortby', String(ev.detail.sortBy));
        el.setAttribute('data-sortdir', String(ev.detail.sortDir));

        self.chdir({
          sopts: {
            headers: false
          },
          path: el.getAttribute('data-path')
        });

        el.dispatchEvent(new CustomEvent('_sort', {detail: ev.detail}));
      });
      nel.on('contextmenu', function(ev) {
        if ( !el.hasAttribute('data-has-contextmenu') || el.hasAttribute('data-has-contextmenu') === 'false' ) {
          self.contextmenu(ev);
        }
        el.dispatchEvent(new CustomEvent('_contextmenu', {detail: ev.detail}));
      });

      if ( type === 'gui-tree-view' ) {
        nel.on('expand', function(ev) {
          el.dispatchEvent(new CustomEvent('_expand', {detail: ev.detail}));
        });
      }

      el.setAttribute('role', 'region');
      el.appendChild(nel.$element);

      return nel;
    }

  });

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
