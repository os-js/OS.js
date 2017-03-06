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

/*eslint valid-jsdoc: "off"*/
(function(WindowManager, Window, GUI, Utils, API, VFS) {
  'use strict';

  // TODO: Redo this because of new API

  function createCreateDialog(title, dir, cb) {
    API.createDialog('Input', {
      value: title,
      message: OSjs.Applications.CoreWM._('Create in {0}', dir)
    }, function(ev, button, result) {
      if ( result ) {
        cb(new VFS.File(Utils.pathJoin(dir, result)));
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // SHORTCUT DIALOG
  /////////////////////////////////////////////////////////////////////////////

  function IconViewShortcutDialog(item, scheme, closeCallback) {
    Window.apply(this, ['IconViewShortcutDialog', {
      title: 'Edit Launcher',
      icon: 'status/appointment-soon.png',
      width: 400,
      height: 220,
      allow_maximize: false,
      allow_resize: false,
      allow_minimize: false
    }, null, scheme]);

    this.values = {
      path: item.path,
      filename: item.filename,
      args: item.args || {}
    };
    this.cb = closeCallback || function() {};
  }

  IconViewShortcutDialog.prototype = Object.create(Window.prototype);
  IconViewShortcutDialog.constructor = Window;

  IconViewShortcutDialog.prototype.init = function(wm, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    this._render(this._name);

    this._find('InputShortcutLaunch').set('value', this.values.path);
    this._find('InputShortcutLabel').set('value', this.values.filename);
    this._find('InputTooltipFormatString').set('value', JSON.stringify(this.values.args || {}));

    this._find('ButtonApply').on('click', function() {
      self.applySettings();
      self._close('ok');
    });

    this._find('ButtonCancel').on('click', function() {
      self._close();
    });

    return root;
  };

  IconViewShortcutDialog.prototype.applySettings = function() {
    this.values.path = this._find('InputShortcutLaunch').get('value');
    this.values.filename = this._find('InputShortcutLabel').get('value');
    this.values.args = JSON.parse(this._find('InputTooltipFormatString').get('value') || {});
  };

  IconViewShortcutDialog.prototype._close = function(button) {
    this.cb(button, this.values);
    return Window.prototype._close.apply(this, arguments);
  };

  IconViewShortcutDialog.prototype._destroy = function() {
    return Window.prototype._destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // ICON VIEW
  /////////////////////////////////////////////////////////////////////////////

  function DesktopIconView(wm) {
    var self = this;

    this.dialog = null;
    this.$iconview = null;
    this.$element = document.createElement('gui-icon-view');
    this.$element.setAttribute('data-multiple', 'false');
    //this.$element.setAttribute('no-selection', 'true');
    this.$element.id = 'CoreWMDesktopIconView';
    this.shortcutCache = [];
    this.refreshTimeout = null;

    GUI.Helpers.createDroppable(this.$element, {
      onOver: function(ev, el, args) {
        wm.onDropOver(ev, el, args);
      },

      onLeave : function() {
        wm.onDropLeave();
      },

      onDrop : function() {
        wm.onDrop();
      },

      onItemDropped: function(ev, el, item, args) {
        wm.onDropItem(ev, el, item, args);
      },

      onFilesDropped: function(ev, el, files, args) {
        wm.onDropFile(ev, el, files, args);
      }
    });

    this.$iconview = GUI.Element.createFromNode(this.$element);
    this.$iconview.build();

    this.$iconview.on('select', function() {
      if ( wm ) {
        var win = wm.getCurrentWindow();
        if ( win ) {
          win._blur();
        }
      }

    }).on('activate', function(ev) {
      if ( ev && ev.detail ) {
        ev.detail.entries.forEach(function(entry) {
          var item = entry.data;
          var file = new VFS.File(item);
          API.open(file, item.args);
        });
      }
    }).on('contextmenu', function(ev) {
      if ( ev && ev.detail && ev.detail.entries ) {
        self.createContextMenu(ev.detail.entries[0], ev);
      }
    });

    this._refresh();
    this.resize(wm);
  }

  DesktopIconView.prototype.destroy = function() {
    Utils.$remove(this.$element);
    this.refreshTimeout = clearTimeout(this.refreshTimeout);
    this.$element = null;
    this.$iconview = null;

    if ( this.dialog ) {
      this.dialog.destroy();
    }
    this.dialog = null;

    this.shortcutCache = [];
  };

  DesktopIconView.prototype.blur = function() {
    var cel = GUI.Element.createFromNode(this.$element);
    cel.set('value', null);
  };

  DesktopIconView.prototype.getRoot = function() {
    return this.$element;
  };

  DesktopIconView.prototype.resize = function(wm) {
    var el = this.getRoot();
    var s  = wm.getWindowSpace();

    if ( el ) {
      el.style.top    = (s.top) + 'px';
      el.style.left   = (s.left) + 'px';
      el.style.width  = (s.width) + 'px';
      el.style.height = (s.height) + 'px';
    }
  };

  DesktopIconView.prototype._refresh = function(wm) {
    var self = this;

    var desktopPath = OSjs.Core.getWindowManager().getSetting('desktopPath');
    var shortcutPath = Utils.pathJoin(desktopPath, '.shortcuts.json');

    this.shortcutCache = [];

    this.refreshTimeout = clearTimeout(this.refreshTimeout);
    this.refreshTimeout = setTimeout(function() {
      VFS.scandir(desktopPath, function(error, result) {
        if ( self.$iconview && !error ) {
          self.$iconview.clear().add(result.map(function(iter) {
            if ( iter.type === 'application' || iter.shortcut === true ) {
              var niter = new VFS.File(iter);
              niter.shortcut = true;

              var idx = self.shortcutCache.push(niter) - 1;

              var file = new VFS.File(iter);
              file.__index = idx;

              return {
                _type: iter.type,
                icon: API.getFileIcon(iter, '32x32'),
                label: iter.filename,
                value: file,
                args: iter.args || {}
              };
            }

            return {
              _type: 'vfs',
              icon: API.getFileIcon(iter, '32x32'),
              label: iter.filename,
              value: iter
            };

          }).filter(function(iter) {
            return iter.value.path !== shortcutPath;
          }));
        }
      });
    }, 150);
  };

  DesktopIconView.prototype._save = function(refresh) {
    var desktopPath = OSjs.Core.getWindowManager().getSetting('desktopPath');
    var path = Utils.pathJoin(desktopPath, '.shortcuts.json');
    var cache = this.shortcutCache;
    var self = this;

    VFS.mkdir(Utils.dirname(path), function(err) {
      VFS.write(path, JSON.stringify(cache, null, 4), function(e, r) {
        if ( refresh ) { // Normally caught by VFS message in main.js
          self._refresh();
        }
      });
    });
  };

  DesktopIconView.prototype.updateShortcut = function(data, values) {
    var o = this.shortcutCache[data.__index];
    if ( o.path === data.path ) {
      Object.keys(values).forEach(function(k) {
        o[k] = values[k];
      });

      this._save(true);
    }
  };

  DesktopIconView.prototype.getShortcutByPath = function(path) {
    var found = null;
    var index = -1;

    this.shortcutCache.forEach(function(i, idx) {
      if ( !found ) {
        if ( i.type !== 'application' && i.path === path ) {
          found = i;
          index = idx;
        }
      }
    });

    return {item: found, index: index};
  };

  DesktopIconView.prototype.addShortcut = function(data, wm, save) {
    (['icon']).forEach(function(k) {
      if ( data[k] ) {
        delete data[k];
      }
    });

    if ( data.type === 'application' ) {
      data.args = data.args || {};
    }

    data.shortcut = true;
    this.shortcutCache.push(data);
    this._save(true);
  };

  DesktopIconView.prototype.removeShortcut = function(data) {
    var o = this.shortcutCache[data.__index];
    if ( o && o.path === data.path ) {
      this.shortcutCache.splice(data.__index, 1);
      this._save(true);
    }
  };

  DesktopIconView.prototype._getContextMenu = function(item) {
    var self = this;
    var mm = OSjs.Core.getMountManager();
    var desktopPath = OSjs.Core.getWindowManager().getSetting('desktopPath');
    var menu = [
      {
        title: API._('LBL_UPLOAD'),
        onClick: function() {
          API.createDialog('FileUpload', {
            dest: desktopPath
          }, function() {
            self._refresh();
          });
        }
      },
      {
        title: API._('LBL_CREATE'),
        menu: [{
          title: API._('LBL_FILE'),
          onClick: function() {
            createCreateDialog('New file', desktopPath, function(f) {
              VFS.write(f, '', function(err) {
                if ( err ) {
                  API.error('CoreWM', API._('ERR_VFSMODULE_MKFILE'), err);
                }
              });
            });
          }
        }, {
          title: API._('LBL_DIRECTORY'),
          onClick: function() {
            createCreateDialog('New directory', desktopPath, function(f) {
              VFS.mkdir(f, function(err) {
                if ( err ) {
                  API.error('CoreWM', API._('ERR_VFSMODULE_MKDIR'), err);
                }
              });
            });
          }
        }]
      }
    ];

    if ( item ) {
      var file = item.data;

      if ( file.type === 'application' ) {
        menu.push({
          title: OSjs.Applications.CoreWM._('Edit shortcut'),
          onClick: function() {
            self.openShortcutEdit(file);
          }
        });
      }

      if ( mm.getRootFromPath(file.path) !== desktopPath  ) {
        menu.push({
          title: OSjs.Applications.CoreWM._('Remove shortcut'),
          onClick: function() {
            self.removeShortcut(file);
          }
        });
      } else {
        menu.push({
          title: API._('LBL_DELETE'),
          onClick: function() {
            VFS.unlink(file, function() {
              //self._refresh(); // Caught by VFS message in main.js
            });
          }
        });
      }
    }

    return menu;
  };

  DesktopIconView.prototype.createContextMenu = function(item, ev) {
    var wm = OSjs.Core.getWindowManager();
    var menu = wm._getContextMenu(item);
    API.createMenu(menu, ev);
  };

  DesktopIconView.prototype.openShortcutEdit = function(item) {
    if ( this.dialog ) {
      this.dialog._close();
    }

    var self = this;
    var wm = OSjs.Core.getWindowManager();

    this.dialog = new IconViewShortcutDialog(item, wm._scheme, function(button, values) {
      if ( button === 'ok' ) {
        self.updateShortcut(item, values);
      }
      self.dialog = null;
    });

    wm.addWindow(this.dialog, true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.DesktopIconView   = DesktopIconView;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
