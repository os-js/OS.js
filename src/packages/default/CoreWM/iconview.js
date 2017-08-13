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
import Translations from './locales';

const _ = OSjs.require('core/locales').createLocalizer(Translations);
const FS = OSjs.require('utils/fs');
const Menu = OSjs.require('gui/menu');
const DOM = OSjs.require('utils/dom');
const GUI = OSjs.require('utils/gui');
const VFS = OSjs.require('vfs/fs');
const Process = OSjs.require('core/process');
const Theme = OSjs.require('core/theme');
const Dialog = OSjs.require('core/dialog');
const FileMetadata = OSjs.require('vfs/file');
const MountManager = OSjs.require('core/mount-manager');
const GUIElement = OSjs.require('gui/element');
const WindowManager = OSjs.require('core/window-manager');

function createCreateDialog(title, dir, cb) {
  Dialog.create('Input', {
    value: title,
    message: _('Create in {0}', dir)
  }, function(ev, button, result) {
    if ( result ) {
      cb(new FileMetadata(FS.pathJoin(dir, result)));
    }
  });
}

/////////////////////////////////////////////////////////////////////////////
// SHORTCUT DIALOG
/////////////////////////////////////////////////////////////////////////////

class IconViewShortcutDialog extends Dialog {
  constructor(item, scheme, closeCallback) {
    super('IconViewShortcutDialog', {
      title: 'Edit Launcher',
      icon: 'status/appointment-soon.png',
      width: 400,
      height: 220,
      allow_maximize: false,
      allow_resize: false,
      allow_minimize: false
    }, () => {});

    this.scheme = scheme;
    this.values = {
      path: item.path,
      filename: item.filename,
      args: item.args || {}
    };

    this.cb = closeCallback || function() {};
  }

  init(wm, app) {
    const root = super.init(...arguments);

    this._render(this._name, this.scheme);

    this._find('InputShortcutLaunch').set('value', this.values.path);
    this._find('InputShortcutLabel').set('value', this.values.filename);
    this._find('InputTooltipFormatString').set('value', JSON.stringify(this.values.args || {}));

    this._find('ButtonApply').on('click', () => {
      this.applySettings();
      this._close('ok');
    });

    this._find('ButtonCancel').on('click', () => {
      this._close();
    });

    return root;
  }

  applySettings() {
    this.values.path = this._find('InputShortcutLaunch').get('value');
    this.values.filename = this._find('InputShortcutLabel').get('value');
    this.values.args = JSON.parse(this._find('InputTooltipFormatString').get('value') || {});
  }

  _close(button) {
    this.cb(button, this.values);
    return super._close(...arguments);
  }
}

/////////////////////////////////////////////////////////////////////////////
// ICON VIEW
/////////////////////////////////////////////////////////////////////////////

/**
 * FIXME: This can now be remade into extending the GUI IconView base class
 * FIXME: Implement the grid desktopview I made in Jan
 */
export default class DesktopIconView {

  constructor(wm) {
    this.dialog = null;
    this.$iconview = null;
    this.$element = document.createElement('gui-icon-view');
    this.$element.setAttribute('data-multiple', 'false');
    //this.$element.setAttribute('no-selection', 'true');
    this.$element.id = 'CoreWMDesktopIconView';
    this.shortcutCache = [];
    this.refreshTimeout = null;

    GUI.createDroppable(this.$element, {
      onOver: function(ev, el, args) {
        wm.onDropOver(ev, el, args);
      },

      onLeave: function() {
        wm.onDropLeave();
      },

      onDrop: function() {
        wm.onDrop();
      },

      onItemDropped: function(ev, el, item, args) {
        wm.onDropItem(ev, el, item, args);
      },

      onFilesDropped: function(ev, el, files, args) {
        wm.onDropFile(ev, el, files, args);
      }
    });

    this.$iconview = GUIElement.createFromNode(this.$element);
    this.$iconview.build();

    this.$iconview.on('select', () => {
      if ( wm ) {
        const win = wm.getCurrentWindow();
        if ( win ) {
          win._blur();
        }
      }
    }).on('activate', (ev) => {
      if ( ev && ev.detail ) {
        ev.detail.entries.forEach((entry) => {
          const item = entry.data;
          const file = new FileMetadata(item);
          Process.createFromFile(file, item.args);
        });
      }
    }).on('contextmenu', (ev) => {
      if ( ev && ev.detail && ev.detail.entries ) {
        this.createContextMenu(ev.detail.entries[0], ev);
      }
    });

    this._refresh();
  }

  destroy() {
    DOM.$remove(this.$element);
    this.refreshTimeout = clearTimeout(this.refreshTimeout);
    this.$element = null;
    this.$iconview = null;

    if ( this.dialog ) {
      this.dialog.destroy();
    }
    this.dialog = null;

    this.shortcutCache = [];
  }

  blur() {
    const cel = GUIElement.createFromNode(this.$element);
    cel.set('value', null);
  }

  getRoot() {
    return this.$element;
  }

  resize(wm) {
    const el = this.getRoot();
    const s  = wm.getWindowSpace();

    if ( el ) {
      el.style.top    = (s.top) + 'px';
      el.style.left   = (s.left) + 'px';
      el.style.width  = (s.width) + 'px';
      el.style.height = (s.height) + 'px';
    }
  }

  _refresh(wm) {
    const desktopPath = WindowManager.instance.getSetting('desktopPath');
    const shortcutPath = FS.pathJoin(desktopPath, '.shortcuts.json');

    this.shortcutCache = [];

    this.refreshTimeout = clearTimeout(this.refreshTimeout);
    this.refreshTimeout = setTimeout(() => {
      VFS.scandir(desktopPath, {backlink: false}).then((result) => {
        if ( this.$iconview ) {
          const entries = result.map((iter) => {
            if ( iter.type === 'application' || iter.shortcut === true ) {
              const niter = new FileMetadata(iter);
              niter.shortcut = true;

              const idx = this.shortcutCache.push(niter) - 1;

              const file = new FileMetadata(iter);
              file.__index = idx;

              return {
                _type: iter.type,
                icon: Theme.getFileIcon(iter, '32x32'),
                label: iter.filename,
                value: file,
                args: iter.args || {}
              };
            }

            return {
              _type: 'vfs',
              icon: Theme.getFileIcon(iter, '32x32'),
              label: iter.filename,
              value: iter
            };

          }).filter(function(iter) {
            return iter.value.path !== shortcutPath;
          });

          this.$iconview.clear().add(entries);
        }
      });
    }, 150);
  }

  _save(refresh) {
    const desktopPath = WindowManager.instance.getSetting('desktopPath');
    const path = FS.pathJoin(desktopPath, '.shortcuts.json');
    const cache = this.shortcutCache;

    VFS.mkdir(FS.dirname(path)).finally(() => {
      VFS.write(path, JSON.stringify(cache, null, 4)).then(() => {
        if ( refresh ) { // Normally caught by VFS message in main.js
          this._refresh();
        }
      });
    });
  }

  updateShortcut(data, values) {
    const o = this.shortcutCache[data.__index];
    if ( o.path === data.path ) {
      Object.keys(values).forEach(function(k) {
        o[k] = values[k];
      });

      this._save(true);
    }
  }

  getShortcutByPath(path) {
    let found = null;
    let index = -1;

    this.shortcutCache.forEach(function(i, idx) {
      if ( !found ) {
        if ( i.type !== 'application' && i.path === path ) {
          found = i;
          index = idx;
        }
      }
    });

    return {item: found, index: index};
  }

  addShortcut(data, wm, save) {
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
  }

  removeShortcut(data) {
    const o = this.shortcutCache[data.__index];
    if ( o && o.path === data.path ) {
      this.shortcutCache.splice(data.__index, 1);
      this._save(true);
    }
  }

  _getContextMenu(item) {
    const desktopPath = WindowManager.instance.getSetting('desktopPath');
    const menu = [
      {
        title: _('LBL_UPLOAD'),
        onClick: () => {
          Dialog.create('FileUpload', {
            dest: desktopPath
          }, () => {
            this._refresh();
          });
        }
      },
      {
        title: _('LBL_CREATE'),
        menu: [{
          title: _('LBL_FILE'),
          onClick: () => {
            createCreateDialog('New file', desktopPath, (f) => {
              VFS.write(f, '').catch((err) => {
                OSjs.error('CoreWM', _('ERR_VFSMODULE_MKFILE'), err);
              });
            });
          }
        }, {
          title: _('LBL_DIRECTORY'),
          onClick: () => {
            createCreateDialog('New directory', desktopPath, (f) => {
              VFS.mkdir(f).catch((err) => {
                OSjs.error('CoreWM', _('ERR_VFSMODULE_MKDIR'), err);
              });
            });
          }
        }]
      }
    ];

    if ( item && item.data ) {
      const file = item.data;

      if ( file.type === 'application' ) {
        menu.push({
          title: _('Edit shortcut'),
          onClick: () => this.openShortcutEdit(file)
        });
      }

      const m = MountManager.getModuleFromPath(file.path);
      if ( !m || m.option('root') !== desktopPath  ) {
        menu.push({
          title: _('Remove shortcut'),
          onClick: () => this.removeShortcut(file)
        });
      } else {
        menu.push({
          title: _('LBL_DELETE'),
          onClick: () =>VFS.unlink(file) // Caught by VFS message in main.js
        });
      }
    }

    return menu;
  }

  createContextMenu(item, ev) {
    const wm = WindowManager.instance;
    const menu = wm._getContextMenu(item);
    Menu.create(menu, ev);
  }

  openShortcutEdit(item) {
    if ( this.dialog ) {
      this.dialog._close();
    }

    const wm = WindowManager.instance;

    this.dialog = new IconViewShortcutDialog(item, wm._scheme, (button, values) => {
      if ( button === 'ok' ) {
        this.updateShortcut(item, values);
      }
      this.dialog = null;
    });

    wm.addWindow(this.dialog, true);
  }

}
