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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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
import Promise from 'bluebird';
import Translations from './locales';

const FS = OSjs.require('utils/fs');
const VFS = OSjs.require('vfs/fs');
const FileMetadata = OSjs.require('vfs/file');
const Application =  OSjs.require('core/application');
const Window = OSjs.require('core/window');
const Dialog = OSjs.require('core/dialog');
const Locales = OSjs.require('core/locales');
const Events = OSjs.require('utils/events');
const Utils = OSjs.require('utils/misc');
const SettingsManager = OSjs.require('core/settings-manager');
const MountManager = OSjs.require('core/mount-manager');
const GUIElement = OSjs.require('gui/element');
const Clipboard = OSjs.require('utils/clipboard');
const Keycodes = OSjs.require('utils/keycodes');
const Config = OSjs.require('core/config');
const Theme = OSjs.require('core/theme');
const Notification = OSjs.require('gui/notification');
const doTranslate = Locales.createLocalizer(Translations);

function getSelected(view) {
  var selected = [];
  (view.get('value') || []).forEach(function(sub) {
    if ( !sub.data.shortcut ) {
      selected.push(sub.data);
    }
  });
  return selected;
}

function createUploadDialog(opts, cb, ref) {
  var destination = opts.destination;
  var upload = opts.file;

  Dialog.create('FileUpload', {
    dest: destination,
    file: upload
  }, function(ev, btn, ufile) {
    if ( btn !== 'ok' && btn !== 'complete' ) {
      cb(false, false);
    } else {
      var file = FileMetadata.fromUpload(destination, ufile);
      cb(false, file);
    }
  }, ref);
}

var notificationWasDisplayed = {};

/////////////////////////////////////////////////////////////////////////////
// WINDOWS
/////////////////////////////////////////////////////////////////////////////

class ApplicationFileManagerWindow extends Window {
  constructor(app, metadata, path, settings) {
    super('ApplicationFileManagerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      allow_drop: true,
      width: 650,
      height: 420,
      translator: doTranslate
    }, app);

    this.wasFileDropped = false;
    this.currentPath = path;
    this.currentSummary = {};
    this.viewOptions = Utils.argumentDefaults(settings || {}, {
      ViewNavigation: true,
      ViewSide: true
    }, true);
    this.history = [];
    this.historyIndex = -1;

    var self = this;
    this.settingsWatch = SettingsManager.watch('VFS', function() {
      if ( self._loaded ) {
        self.changePath();
      }
    });

    this._on('drop:upload', function(ev, item) {
      app.upload(self.currentPath, item, self);
    });

    this._on('drop:file', function(ev, src) {
      if ( FS.dirname(src.path) !== self.currentPath ) {
        var dst = new FileMetadata(FS.pathJoin(self.currentPath, src.filename));
        self.wasFileDropped = dst;
        app.copy(src, dst, self);
      }
    });

    this._on('keydown', function(ev, keyCode, shiftKey, ctrlKey, altKey) {
      if ( Events.keyCombination(ev, 'CTRL+V') ) {
        var clip = Clipboard.getClipboard();
        if ( clip && (clip instanceof Array) ) {
          clip.forEach(function(c) {
            if ( c && (c instanceof FileMetadata) ) {
              var dst = new FileMetadata(FS.pathJoin(self.currentPath, c.filename));
              app.copy(c, dst, self);
            }
          });
        }
      } else if ( ev.keyCode === Keycodes.DELETE ) {
        app.rm(getSelected(self._find('FileView')), self);
      }
    });

    this._on('destroy', function() {
      try {
        SettingsManager.unwatch(self.settingsWatch);
      } catch ( e ) {}
    });
  }

  init(wm, app) {
    const root = super.init(...arguments);
    var self = this;
    var view;

    var viewType      = this.viewOptions.ViewType || 'gui-list-view';
    var viewSide      = this.viewOptions.ViewSide === true;
    var viewNav       = this.viewOptions.ViewNavigation === true;

    var vfsOptions = Utils.cloneObject(SettingsManager.get('VFS') || {});
    var scandirOptions = vfsOptions.scandir || {};

    var viewHidden    = scandirOptions.showHiddenFiles === true;
    var viewExtension = scandirOptions.showFileExtensions === true;

    // Load and set up scheme (GUI) here
    this._render('FileManagerWindow', require('osjs-scheme-loader!scheme.html'));

    if ( (Config.getConfig('Connection.Type') !== 'nw') && window.location.protocol.match(/^file/) ) { // FIXME: Translation
      this._setWarning('VFS does not work when in standalone mode');
    }

    //
    // Menus
    //

    var menuMap = {
      MenuClose: function() {
        self._close();
      },
      MenuCreateFile: function() {
        app.mkfile(self.currentPath, self);
      },
      MenuCreateDirectory: function() {
        app.mkdir(self.currentPath, self);
      },
      MenuUpload: function() {
        app.upload(self.currentPath, null, self);
      },
      MenuRename: function() {
        app.rename(getSelected(view), self);
      },
      MenuDelete: function() {
        app.rm(getSelected(view), self);
      },
      MenuInfo: function() {
        app.info(getSelected(view), self);
      },
      MenuOpen: function() {
        app.open(getSelected(view), self);
      },
      MenuDownload: function() {
        app.download(getSelected(view), self);
      },
      MenuRefresh: function() {
        self.changePath();
      },
      MenuViewList: function() {
        self.changeView('gui-list-view', true);
      },
      MenuViewTree: function() {
        self.changeView('gui-tree-view', true);
      },
      MenuViewIcon: function() {
        self.changeView('gui-icon-view', true);
      },
      MenuShowSidebar: function() {
        viewSide = self.toggleSidebar(!viewSide, true);
      },
      MenuShowNavigation: function() {
        viewNav = self.toggleNavbar(!viewNav, true);
      },
      MenuShowHidden: function() {
        viewHidden = self.toggleHidden(!viewHidden, true);
      },
      MenuShowExtension: function() {
        viewExtension = self.toggleExtension(!viewExtension, true);
      },
      MenuColumnFilename: function() {
        self.toggleColumn('filename', true);
      },
      MenuColumnMIME: function() {
        self.toggleColumn('mime', true);
      },
      MenuColumnCreated: function() {
        self.toggleColumn('ctime', true);
      },
      MenuColumnModified: function() {
        self.toggleColumn('mtime', true);
      },
      MenuColumnSize: function() {
        self.toggleColumn('size', true);
      }
    };

    function menuEvent(ev) {
      var f = ev.detail.func || ev.detail.id;
      if ( menuMap[f] ) {
        menuMap[f]();
      }
    }

    this._find('SubmenuFile').on('select', menuEvent);
    var contextMenu = this._find('SubmenuContext').on('select', menuEvent);
    this._find('SubmenuEdit').on('select', menuEvent);
    var viewMenu = this._find('SubmenuView').on('select', menuEvent);

    viewMenu.set('checked', 'MenuViewList', viewType === 'gui-list-view');
    viewMenu.set('checked', 'MenuViewTree', viewType === 'gui-tree-view');
    viewMenu.set('checked', 'MenuViewIcon', viewType === 'gui-icon-view');
    viewMenu.set('checked', 'MenuShowSidebar', viewSide);
    viewMenu.set('checked', 'MenuShowNavigation', viewNav);
    viewMenu.set('checked', 'MenuShowHidden', viewHidden);
    viewMenu.set('checked', 'MenuShowExtension', viewExtension);

    //
    // Toolbar
    //
    this._find('GoLocation').on('enter', function(ev) {
      self.changePath(ev.detail, null, false, true);
    });
    this._find('GoBack').on('click', function(ev) {
      self.changeHistory(-1);
    });
    this._find('GoNext').on('click', function(ev) {
      self.changeHistory(1);
    });

    var pw = this._find('PanedView');
    this._find('ToggleSideview').on('click', function(ev) {
      if ( !pw.$element ) {
        return;
      }
      var curr = pw.$element.getAttribute('data-toggled');
      pw.$element.setAttribute('data-toggled', String(curr === 'true' ? false : true));
    });

    //
    // Side View
    //
    var side = this._find('SideView');
    side.on('activate', function(ev) {
      if ( ev && ev.detail && ev.detail.entries ) {
        var entry = ev.detail.entries[0];
        if ( entry ) {
          self.changePath(entry.data.root);
        }
      }
    });

    //
    // File View
    //
    view = this._find('FileView');
    view.on('activate', function(ev) {
      if ( ev && ev.detail && ev.detail.entries ) {
        self.checkActivation(ev.detail.entries);
      }
    });
    view.on('select', function(ev) {
      if ( ev && ev.detail && ev.detail.entries ) {
        self.checkSelection(ev.detail.entries);
      }
    });
    view.on('contextmenu', function(ev) {
      if ( ev && ev.detail && ev.detail.entries ) {
        self.checkSelection(ev.detail.entries);
      }
      contextMenu.show(ev);
    });

    //
    // Init
    //

    this.renderSideView();

    this.changeView(viewType, false);
    this.toggleHidden(viewHidden, false);
    this.toggleExtension(viewExtension, false);
    this.toggleSidebar(viewSide, false);
    this.toggleNavbar(viewNav, false);

    this.changePath(this.currentPath);
    this.toggleColumn();

    return root;
  }

  checkSelection(files) {
    files = files || [];

    var scheme = this._scheme;

    if ( !scheme ) {
      return;
    }

    var self = this;
    var content = '';
    var statusbar = this._find('Statusbar');

    var sum, label;

    function toggleMenuItems(isFile, isDirectory, isShort) {
      /*
       * Toggling MenuItems with the bit MODE_F or MODE_FD set by type of selected items
       * MODE_F : Selected items consist of ONLY files
       * MODE_FD : One or many items are selected (type doesn't matter)
       */

      var MODE_F = !isFile || !!isDirectory;
      var MODE_FD = !(isFile || isDirectory);

      self._find('MenuRename').set('disabled', isShort || MODE_FD);
      self._find('MenuDelete').set('disabled', isShort || MODE_FD);
      self._find('MenuInfo').set('disabled', MODE_FD);  // TODO: Directory info must be supported
      self._find('MenuDownload').set('disabled', MODE_F);
      self._find('MenuOpen').set('disabled', MODE_F);

      self._find('ContextMenuRename').set('disabled', isShort || MODE_FD);
      self._find('ContextMenuDelete').set('disabled', isShort || MODE_FD);
      self._find('ContextMenuInfo').set('disabled', MODE_FD);  // TODO: Directory info must be supported
      self._find('ContextMenuDownload').set('disabled', MODE_F);
      self._find('ContextMenuOpen').set('disabled', MODE_F);
    }

    if ( files && files.length ) {
      sum = {files: 0, directories: 0, size: 0};

      files.forEach(function(f) {
        if ( f.data.type === 'dir' ) {
          sum.directories++;
        } else {
          sum.files++;
          sum.size += f.data.size;
        }
      });

      var isShortcut = files.length === 1 ? files[0].data.shortcut === true : false;

      label = 'Selected {0} files, {1} dirs, {2}';
      content = doTranslate(label, sum.files, sum.directories, FS.humanFileSize(sum.size));

      toggleMenuItems(sum.files, sum.directories, isShortcut);
    } else {
      sum = this.currentSummary;
      if ( sum ) {
        label = 'Showing {0} files ({1} hidden), {2} dirs, {3}';
        content = doTranslate(label, sum.files, sum.hidden, sum.directories, FS.humanFileSize(sum.size));
      }

      toggleMenuItems(false, false, false);
    }

    statusbar.set('value', content);
  }

  checkActivation(files) {
    var self = this;
    (files || []).forEach(function(f) {
      if ( f.data.type === 'dir' ) {
        self.changePath(f.data.path);
        return false;
      }

      Application.createFromFile(new FileMetadata(f.data));

      return true;
    });
  }

  updateSideView(updateModule) {
    if ( this._destroyed || !this._scheme ) {
      return;
    }

    var found = null;
    var path = this.currentPath || '/';

    if ( updateModule ) {
      this.renderSideView();
    }

    MountManager.getModules({special: true}).forEach(function(m, i) {
      if ( path.match(m.option('match')) ) {
        found = m.option('root');
      }
    });

    var view = this._find('SideView');
    view.set('selected', found, 'root');
  }

  renderSideView() {
    if ( this._destroyed || !this._scheme ) {
      return;
    }

    var sideViewItems = [];
    MountManager.getModules({special: true}).forEach(function(m, i) {
      var classNames = [m.mounted() ? 'mounted' : 'unmounted'];
      if ( m.isReadOnly() ) {
        classNames.push('readonly gui-has-emblem');
      }

      sideViewItems.push({
        value: m.options,
        className: classNames.join(' '),
        columns: [
          {
            label: m.option('title'),
            icon: Theme.getIcon(m.option('icon'))
          }
        ],
        onCreated: function(nel) {
          if ( m.isReadOnly() ) {
            nel.style.backgroundImage = 'url(' + Theme.getIcon('emblems/emblem-readonly.png', '16x16') + ')';
          }
        }
      });
    });

    var side = this._find('SideView');
    side.clear();
    side.add(sideViewItems);
  }

  onMountEvent(m, msg) {
    if ( m ) {
      if ( msg === 'vfs:unmount' ) {
        if ( this.currentPath.match(m.option('match')) ) {
          this.changePath(Config.getDefaultPath());
        }
      }
      this.updateSideView(m);
    }
  }

  onFileEvent(chk, isDest) {
    if ( (this.currentPath === FS.dirname(chk.path)) || (this.currentPath === chk.path) ) {
      this.changePath(null, this.wasFileDropped, false, false, !this.wasFileDroped);
    }
  }

  changeHistory(dir) {
    if ( this.historyIndex !== -1 ) {
      if ( dir < 0 ) {
        if ( this.historyIndex > 0 ) {
          this.historyIndex--;
        }
      } else if ( dir > 0 ) {
        if ( this.historyIndex < this.history.length - 1 ) {
          this.historyIndex++;
        }
      }

      this.changePath(this.history[this.historyIndex], null, true);
    }
  }

  changePath(dir, selectFile, isNav, isInput, applyScroll) {
    if ( this._destroyed || !this._scheme ) {
      return;
    }
    this.wasFileDropped = false;

    //if ( dir === this.currentPath ) { return; }
    dir = dir || this.currentPath;

    var self = this;
    var view = this._find('FileView');

    function updateNavigation() {
      self._find('GoLocation').set('value', dir);
      self._find('GoBack').set('disabled', self.historyIndex <= 0);
      self._find('GoNext').set('disabled', self.historyIndex < 0 || self.historyIndex >= (self.history.length - 1));
    }

    function updateHistory(dir) {
      if ( !isNav ) {
        if ( self.historyIndex >= 0 && self.historyIndex < self.history.length - 1 ) {
          self.history = [];
        }

        var current = self.history[self.history.length - 1];
        if ( current !== dir ) {
          self.history.push(dir);
        }

        if ( self.history.length > 1 ) {
          self.historyIndex = self.history.length - 1;
        } else {
          self.historyIndex = -1;
        }
      }
      if ( isInput ) {
        self.history = [dir];
        self.historyIndex = 0;
      }

      self._setTitle(dir, true);
    }

    this._toggleLoading(true);

    view.chdir({
      path: dir,
      done: function(error, summary) {
        if ( self._destroyed || !self._scheme ) {
          return;
        }

        if ( dir && !error ) {
          self.currentPath = dir;
          self.currentSummary = summary;
          if ( self._app ) {
            self._app._setArgument('path', dir);
          }
          updateHistory(dir);
        }
        self._toggleLoading(false);

        self.checkSelection([]);
        self.updateSideView();

        if ( selectFile && view ) {
          view.set('selected', selectFile.filename, 'filename', {
            scroll: applyScroll
          });
        }

        updateNavigation();
      }
    });

  }

  changeView(viewType, set) {
    if ( this._destroyed || !this._scheme ) {
      return;
    }

    var view = this._find('FileView');
    view.set('type', viewType, !!set);

    if ( set ) {
      this._app._setSetting('ViewType', viewType, true);
    }
  }

  toggleSidebar(toggle, set) {
    if ( this._destroyed || !this._scheme ) {
      return null;
    }

    this.viewOptions.ViewSide = toggle;

    var container = this._find('SideContainer');
    var handle = new GUIElement(container.$element.parentNode.querySelector('gui-paned-view-handle'));
    if ( toggle ) {
      container.show();
      handle.show();
    } else {
      container.hide();
      handle.hide();
    }
    if ( set ) {
      this._app._setSetting('ViewSide', toggle, true);
    }
    return toggle;
  }

  toggleVFSOption(opt, key, toggle, set) {
    if ( this._destroyed || !this._scheme ) {
      return null;
    }

    var view = this._find('FileView');
    var vfsOptions = SettingsManager.instance('VFS');

    var opts = {scandir: {}};
    opts.scandir[opt] = toggle;

    vfsOptions.set(null, opts, null, set); // set triggers refresh because of watch
    view.set(key, toggle);

    return toggle;
  }

  toggleHidden(toggle, set) {
    if ( this._destroyed || !this._scheme ) {
      return null;
    }

    return this.toggleVFSOption('showHiddenFiles', 'dotfiles', toggle, set);
  }

  toggleExtension(toggle, set) {
    if ( this._destroyed || !this._scheme ) {
      return null;
    }

    return this.toggleVFSOption('showFileExtensions', 'extensions', toggle, set);
  }

  toggleNavbar(toggle, set) {
    if ( this._destroyed || !this._scheme ) {
      return null;
    }

    this.viewOptions.ViewNavigation = toggle;

    var viewNav  = this._find('ToolbarContainer');
    if ( toggle ) {
      viewNav.show();
    } else {
      viewNav.hide();
    }

    if ( set ) {
      this._app._setSetting('ViewNavigation', toggle, true);
    }

    return toggle;
  }

  toggleColumn(col, set) {
    if ( this._destroyed || !this._scheme ) {
      return;
    }

    var vfsOptions     = Utils.cloneObject(SettingsManager.get('VFS') || {});
    var scandirOptions = vfsOptions.scandir || {};
    var viewColumns    = scandirOptions.columns || ['filename', 'mime', 'size'];

    if ( col ) {
      var found = viewColumns.indexOf(col);
      if ( found >= 0 ) {
        viewColumns.splice(found, 1);
      } else {
        viewColumns.push(col);
      }

      scandirOptions.columns = viewColumns;

      SettingsManager.set('VFS', 'scandir', scandirOptions, set);
    }

    var viewMenu = this._find('SubmenuView');
    viewMenu.set('checked', 'MenuColumnFilename', viewColumns.indexOf('filename') >= 0);
    viewMenu.set('checked', 'MenuColumnMIME', viewColumns.indexOf('mime') >= 0);
    viewMenu.set('checked', 'MenuColumnCreated', viewColumns.indexOf('ctime') >= 0);
    viewMenu.set('checked', 'MenuColumnModified', viewColumns.indexOf('mtime') >= 0);
    viewMenu.set('checked', 'MenuColumnSize', viewColumns.indexOf('size') >= 0);
  }

}

/////////////////////////////////////////////////////////////////////////////
// APPLICATION
/////////////////////////////////////////////////////////////////////////////

class ApplicationFileManager extends Application {

  constructor(args, metadata) {
    super('ApplicationFileManager', args, metadata);
  }

  init(settings, metadata) {
    super.init(...arguments);

    var self = this;
    var path = this._getArgument('path') || Config.getDefaultPath();

    this._on('vfs', function(msg, obj) {
      var win = self._getMainWindow();
      if ( win ) {
        if ( msg === 'vfs:mount' || msg === 'vfs:unmount' ) {
          win.onMountEvent(obj, msg);
        } else {
          if ( obj.destination ) {
            win.onFileEvent(obj.destination, true);
            win.onFileEvent(obj.source);
          } else {
            win.onFileEvent(obj);
          }
        }
      }
    });

    this._addWindow(new ApplicationFileManagerWindow(this, metadata, path, settings));
  }

  download(items) {
    if ( !items.length ) {
      return;
    }

    items.forEach(function(item) {
      VFS.url(new FileMetadata(item), {download: true}).then((result) => {
        return window.open(result);
      }, {download: true});
    });
  }

  rm(items, win) {
    var self = this;
    if ( !items.length ) {
      return;
    }

    // TODO: These must be async
    var files = [];
    items.forEach(function(i) {
      files.push(i.filename);
    });
    files = files.join(', ');

    win._toggleDisabled(true);
    Dialog.create('Confirm', {
      buttons: ['yes', 'no'],
      message: Utils.format(doTranslate('Delete **{0}** ?'), files)
    }, function(ev, button) {
      win._toggleDisabled(false);
      if ( button !== 'ok' && button !== 'yes' ) {
        return;
      }

      items.forEach(function(item) {
        item = new FileMetadata(item);
        self._action('unlink', [item], function() {
          win.changePath(null);
        });
      });
    }, win);

  }

  info(items, win) {
    if ( !items.length ) {
      return;
    }

    items.forEach(function(item) {
      if ( item.type === 'file' ) {
        Dialog.create('FileInfo', {
          file: new FileMetadata(item)
        }, null, win);
      }
    });
  }

  open(items) {
    if ( !items.length ) {
      return;
    }

    items.forEach(function(item) {
      if ( item.type === 'file' ) {
        Application.createFromFile(new FileMetadata(item), {forceList: true});
      }
    });
  }

  rename(items, win) {
    // TODO: These must be async
    var self = this;
    if ( !items.length ) {
      return;
    }

    function rename(item, newName) {
      item = new FileMetadata(item);

      var newitem = new FileMetadata(item);
      newitem.filename = newName;
      newitem.path = FS.replaceFilename(item.path, newName);

      self._action('move', [item, newitem], function(error) {
        if ( !error ) {
          win.changePath(null, newitem);
        }
      });
    }

    items.forEach(function(item) {
      var dialog = Dialog.create('Input', {
        message: doTranslate('Rename **{0}**', item.filename),
        value: item.filename
      }, function(ev, button, result) {
        if ( button === 'ok' && result ) {
          rename(item, result);
        }
      }, win);
      dialog.setRange(FS.getFilenameRange(item.filename));
    });
  }

  mkfile(dir, win) {
    var self = this;

    win._toggleDisabled(true);
    function finished(write, item) {
      win._toggleDisabled(false);

      if ( item ) {
        VFS.write(item, '', {}, self).then(() => {
          return win.changePath(null, item);
        });
      }
    }

    Dialog.create('Input', {
      value: 'My new File',
      message: doTranslate('Create a new file in **{0}**', dir)
    }, function(ev, button, result) {
      if ( !result ) {
        win._toggleDisabled(false);
        return;
      }

      var item = new FileMetadata(dir + '/' + result);
      const done = (error, result) => {
        if ( result ) {
          win._toggleDisabled(true);

          Dialog.create('Confirm', {
            buttons: ['yes', 'no'],
            message: Locales._('DIALOG_FILE_OVERWRITE', item.filename)
          }, function(ev, button) {
            finished(button === 'yes' || button === 'ok', item);
          }, self);
        } else {
          finished(true, item);
        }
      };

      VFS.exists(item).then((done) => {
        return done(false, result);
      }).catch(done);
    }, win);
  }

  mkdir(dir, win) {
    var self = this;

    win._toggleDisabled(true);
    Dialog.create('Input', {
      message: doTranslate('Create a new directory in **{0}**', dir)
    }, function(ev, button, result) {
      if ( !result ) {
        win._toggleDisabled(false);
        return;
      }

      var item = new FileMetadata(FS.pathJoin(dir, result));
      self._action('mkdir', [item], function() {
        win._toggleDisabled(false);
        win.changePath(null, item);
      });
    }, win);
  }

  copy(src, dest, win) {
    var self = this;
    var dialog = Dialog.create('FileProgress', {
      message: doTranslate('Copying **{0}** to **{1}**', src.filename, dest.path)
    }, function() {
    }, win);

    win._toggleLoading(true);

    const done = (error) => {
      win._toggleLoading(false);

      try {
        dialog._close();
      } catch ( e ) {}

      if ( error ) {
        OSjs.error(Locales._('ERR_GENERIC_APP_FMT', self.__label), Locales._('ERR_GENERIC_APP_REQUEST'), error);
        return;
      }
    };

    VFS.copy(src, dest, {dialog: dialog}, this._app)
      .then(() => done(false))
      .catch(done);
  }

  upload(dest, files, win) {
    var self = this;

    function upload() {
      win._toggleLoading(true);

      function done(error, file) {
        win._toggleLoading(false);
        if ( error ) {
          OSjs.error(Locales._('ERR_GENERIC_APP_FMT', self.__label), Locales._('ERR_GENERIC_APP_REQUEST'), error);
        } else {
          //win.changePath(null, file, false, false, true);
        }
      }

      if ( files ) {
        Promise.each(files, (f) => {
          return new Promise((yes, no) => {
            createUploadDialog({
              file: f,
              destination: dest
            }, function(error) {
              if ( error ) {
                no(error);
              } else {
                yes();
              }
            }, self);
          });
        }).then((res) => done(null, res)).catch(done);
      } else {
        createUploadDialog({
          destination: dest
        }, done, self);
      }
    }

    if ( files ) {
      upload();
    } else {
      Dialog.create('FileUpload', {
        dest: dest
      }, function(ev, button, result) {
        if ( result ) {
          win.changePath(null, result);
        }
      }, win);
    }
  }

  showStorageNotification(type) {
    if ( notificationWasDisplayed[type] ) {
      return;
    }
    notificationWasDisplayed[type] = true;

    Notification.create({
      title: 'External Storage',
      message: 'Using external services requires authorization. A popup-window may appear.',
      icon: Theme.getIcon('status/dialog-information.png', '32x32')
    });
  }

  _action(name, args, callback) {
    callback = callback || function() {};
    VFS[name].apply(VFS, args.concat(null, this)).then((res) => {
      return callback(false, res);
    }).catch((error) => {
      OSjs.error(Locales._('ERR_GENERIC_APP_FMT', this.__label), Locales._('ERR_GENERIC_APP_REQUEST'), error);
      callback(error);
    });
  }
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

OSjs.Applications.ApplicationFileManager = ApplicationFileManager;
