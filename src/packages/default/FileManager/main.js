/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  var notificationWasDisplayed = {};

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationFileManagerWindow(app, metadata, scheme, path, settings) {
    Window.apply(this, ['ApplicationFileManagerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      allow_drop: true,
      width: 650,
      height: 420
    }, app, scheme]);

    this.currentPath = path;
    this.currentSummary = {};
    this.viewOptions = Utils.argumentDefaults(settings || {}, {
      ViewNavigation: true,
      ViewSide: true
    }, true);
    this.history = [];
    this.historyIndex = -1;

    var self = this;
    this.settingsWatch = OSjs.Core.getSettingsManager().watch('VFS', function() {
      if ( self._loaded ) {
        self.changePath();
      }
    });
  }

  ApplicationFileManagerWindow.prototype = Object.create(Window.prototype);
  ApplicationFileManagerWindow.constructor = Window.prototype;

  ApplicationFileManagerWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;
    var view;

    var viewType      = this.viewOptions.ViewType || 'gui-list-view';
    var viewSide      = this.viewOptions.ViewSide === true;
    var viewNav       = this.viewOptions.ViewNavigation === true;

    var vfsOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
    var scandirOptions = vfsOptions.scandir || {};

    var viewHidden    = scandirOptions.showHiddenFiles === true;
    var viewExtension = scandirOptions.showFileExtensions === true;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'FileManagerWindow', root, null, null, {
      _: OSjs.Applications.ApplicationFileManager._
    });

    if ( (API.getConfig('Connection.Type') !== 'nw') && window.location.protocol.match(/^file/) ) { // FIXME: Translation
      this._setWarning('VFS does not work when in standalone mode');
    }

    //
    // Menus
    //

    function getSelected() {
      var selected = [];
      (view.get('value') || []).forEach(function(sub) {
        selected.push(sub.data);
      });
      return selected;
    }

    var menuMap = {
      MenuClose:          function() { self._close(); },
      MenuCreateFile:     function() { app.mkfile(self.currentPath, self); },
      MenuCreateDirectory:function() { app.mkdir(self.currentPath, self); },
      MenuUpload:         function() { app.upload(self.currentPath, null, self); },
      MenuRename:         function() { app.rename(getSelected(), self); },
      MenuDelete:         function() { app.rm(getSelected(), self); },
      MenuInfo:           function() { app.info(getSelected(), self); },
      MenuOpen:           function() { app.open(getSelected(), self); },
      MenuDownload:       function() { app.download(getSelected(), self); },
      MenuRefresh:        function() { self.changePath(); },
      MenuViewList:       function() { self.changeView('gui-list-view', true); },
      MenuViewTree:       function() { self.changeView('gui-tree-view', true); },
      MenuViewIcon:       function() { self.changeView('gui-icon-view', true); },
      MenuShowSidebar:    function() { viewSide = self.toggleSidebar(!viewSide, true); },
      MenuShowNavigation: function() { viewNav = self.toggleNavbar(!viewNav, true); },
      MenuShowHidden:     function() { viewHidden = self.toggleHidden(!viewHidden, true); },
      MenuShowExtension:  function() { viewExtension = self.toggleExtension(!viewExtension, true); },
      MenuColumnFilename: function() { self.toggleColumn('filename', true); },
      MenuColumnMIME:     function() { self.toggleColumn('mime', true); },
      MenuColumnCreated:  function() { self.toggleColumn('ctime', true); },
      MenuColumnModified: function() { self.toggleColumn('mtime', true); },
      MenuColumnSize:     function() { self.toggleColumn('size', true); }
    };

    function menuEvent(ev) {
      if ( menuMap[ev.detail.id] ) {
        menuMap[ev.detail.id]();
      }
    }

    scheme.find(this, 'SubmenuFile').on('select', menuEvent);
    var editMenu = scheme.find(this, 'SubmenuEdit').on('select', menuEvent);
    var viewMenu = scheme.find(this, 'SubmenuView').on('select', menuEvent);

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
    scheme.find(this, 'GoLocation').on('enter', function(ev) {
      self.changePath(ev.detail, null, false, true);
    });
    scheme.find(this, 'GoBack').on('click', function(ev) {
      self.changeHistory(-1);
    });
    scheme.find(this, 'GoNext').on('click', function(ev) {
      self.changeHistory(1);
    });

    //
    // Side View
    //
    var side = scheme.find(this, 'SideView');
    side.on('activate', function(ev) {
      if ( ev && ev.detail && ev.detail.entries ) {
        var entry = ev.detail.entries[0];
        self.changePath(entry.data.root);
      }
    });

    //
    // File View
    //
    view = this._scheme.find(this, 'FileView');
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
      editMenu.show(ev);
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
  };

  ApplicationFileManagerWindow.prototype.checkSelection = function(files) {
    // FIXME: Locales
    var scheme = this._scheme;

    if ( !scheme ) {
      return;
    }

    var self = this;
    var content = '';
    var statusbar = scheme.find(this, 'Statusbar');

    var sum, label;

    function toggleMenuItems(isFile) {
      scheme.find(self, 'MenuInfo').set('disabled', !isFile);
      scheme.find(self, 'MenuDownload').set('disabled', !isFile);
      scheme.find(self, 'MenuOpen').set('disabled', !isFile);
    }

    if ( files && files.length ) {
      sum = {files: 0, directories: 0, size: 0};
      (files || []).forEach(function(f) {
        if ( f.data.type === 'dir' ) {
          sum.directories++;
        } else {
          sum.files++;
          sum.size += f.data.size;
        }
      });

      label = 'Selected {0} files, {1} dirs, {2}';
      content = Utils.format(label, sum.files, sum.directories, Utils.humanFileSize(sum.size));

      toggleMenuItems(sum.files && !sum.directories);
    } else {
      sum = this.currentSummary;
      if ( sum ) {
        label = 'Showing {0} files ({1} hidden), {2} dirs, {3}';
        content = Utils.format(label, sum.files, sum.hidden, sum.directories, Utils.humanFileSize(sum.size));
      }

      toggleMenuItems(false);
    }

    statusbar.set('value', content);
  };

  ApplicationFileManagerWindow.prototype.checkActivation = function(files) {
    var self = this;
    (files || []).forEach(function(f) {
      if ( f.data.type === 'dir' ) {
        self.changePath(f.data.path);
        return false;
      }

      API.open(new VFS.File(f.data.path, f.data.mime));

      return true;
    });
  };

  ApplicationFileManagerWindow.prototype.updateSideView = function(updateModule) {
    var found = null;
    var path = this.currentPath || '/';

    if ( updateModule ) {
      this.renderSideView();
    }

    VFS.getModules({special: true}).forEach(function(m, i) {
      if ( path.match(m.module.match) ) {
        found = m.module.root;
      }
    });

    var view = this._scheme.find(this, 'SideView');
    view.set('selected', found, 'root');
  };

  ApplicationFileManagerWindow.prototype.renderSideView = function() {
    var sideViewItems = [];
    VFS.getModules({special: true}).forEach(function(m, i) {
      var classNames = [m.module.mounted() ? 'mounted' : 'unmounted'];
      if ( m.module.readOnly ) {
        classNames.push('readonly gui-has-emblem');
      }

      sideViewItems.push({
        value: m.module,
        className: classNames.join(' '),
        columns: [
          {
            label: m.module.description,
            icon: API.getIcon(m.module.icon)
          }
        ],
        onCreated: function(nel) {
          if ( m.module.readOnly ) {
            nel.style.backgroundImage = 'url(' + API.getIcon('emblems/emblem-readonly.png', '16x16') + ')';
          }
        }
      });
    });

    var side = this._scheme.find(this, 'SideView');
    side.clear();
    side.add(sideViewItems);
  };

  ApplicationFileManagerWindow.prototype.vfsEvent = function(args) {
    if ( args.type === 'mount' || args.type === 'unmount' ) {
      if ( args.module ) {
        var m = OSjs.VFS.Modules[args.module];
        if ( m ) {
          if ( args.type === 'unmount' ) {
            if ( this.currentPath.match(m.match) ) {
              var path = API.getDefaultPath();
              this.changePath(path);
            }
          }

          this.updateSideView(m);
        }
      }
    } else {
      if ( args.file && this.currentPath === Utils.dirname(args.file.path) ) {
        this.changePath(null);
      }
    }
  };

  ApplicationFileManagerWindow.prototype.changeHistory = function(dir) {
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
  };

  ApplicationFileManagerWindow.prototype.changePath = function(dir, selectFile, isNav, isInput) {
    //if ( dir === this.currentPath ) { return; }
    dir = dir || this.currentPath;

    var self = this;
    var view = this._scheme.find(this, 'FileView');

    function updateNavigation() {
      self._scheme.find(self, 'GoLocation').set('value', dir);
      self._scheme.find(self, 'GoBack').set('disabled', self.historyIndex <= 0);
      self._scheme.find(self, 'GoNext').set('disabled', self.historyIndex < 0 || self.historyIndex >= (self.history.length - 1));
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

    view._call('chdir', {
      path: dir,
      done: function(error, summary) {
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
          view.set('selected', selectFile.filename, 'filename');
        }

        updateNavigation();
      }
    });

  };

  ApplicationFileManagerWindow.prototype.changeView = function(viewType, set) {
    var view = this._scheme.find(this, 'FileView');
    view.set('type', viewType, !!set);

    if ( set ) {
      this._app._setSetting('ViewType', viewType, true);
    }
  };

  ApplicationFileManagerWindow.prototype.toggleSidebar = function(toggle, set) {
    this.viewOptions.ViewSide = toggle;

    var container = this._scheme.find(this, 'SideContainer');
    var handle = new GUI.Element(container.$element.parentNode.querySelector('gui-paned-view-handle'));
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
  };

  ApplicationFileManagerWindow.prototype.toggleVFSOption = function(opt, key, toggle, set) {
    var self = this;
    var view = this._scheme.find(this, 'FileView');
    var vfsOptions = OSjs.Core.getSettingsManager().instance('VFS');

    var opts = {scandir: {}};
    opts.scandir[opt] = toggle;

    vfsOptions.set(null, opts);
    view.set(key, toggle);

    if ( set ) {
      vfsOptions.save(function() {
        self.changePath(null);
      });
    }
    return toggle;
  };

  ApplicationFileManagerWindow.prototype.toggleHidden = function(toggle, set) {
    return this.toggleVFSOption('showHiddenFiles', 'dotfiles', toggle, set);
  };

  ApplicationFileManagerWindow.prototype.toggleExtension = function(toggle, set) {
    return this.toggleVFSOption('showFileExtensions', 'extensions', toggle, set);
  };

  ApplicationFileManagerWindow.prototype.toggleNavbar = function(toggle, set) {
    this.viewOptions.ViewNavigation = toggle;

    var viewNav  = this._scheme.find(this, 'ToolbarContainer');
    if ( toggle ) {
      viewNav.show();
    } else {
      viewNav.hide();
    }

    if ( set ) {
      this._app._setSetting('ViewNavigation', toggle, true);
    }

    return toggle;
  };

  ApplicationFileManagerWindow.prototype.toggleColumn = function(col, set) {
    var vfsOptions     = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
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

      OSjs.Core.getSettingsManager().set('VFS', 'scandir', scandirOptions, set);
    }

    var viewMenu = this._scheme.find(this, 'SubmenuView');
    viewMenu.set('checked', 'MenuColumnFilename', viewColumns.indexOf('filename') >= 0);
    viewMenu.set('checked', 'MenuColumnMIME', viewColumns.indexOf('mime') >= 0);
    viewMenu.set('checked', 'MenuColumnCreated', viewColumns.indexOf('ctime') >= 0);
    viewMenu.set('checked', 'MenuColumnModified', viewColumns.indexOf('mtime') >= 0);
    viewMenu.set('checked', 'MenuColumnSize', viewColumns.indexOf('size') >= 0);
  };

  ApplicationFileManagerWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) {
      return false;
    }

    if ( type === 'filesDrop' && item ) {
      return this.onDropUpload(ev, item);
    } else if ( type === 'itemDrop' && item && item.type === 'file' && item.data ) {
      return this.onDropItem(ev, item);
    }

    return true;
  };

  ApplicationFileManagerWindow.prototype.onDropItem = function(ev, item) {
    if ( Utils.dirname(item.data.path) === this.currentPath ) {
      return;
    }

    var src = new VFS.File(item.data);
    var dst = new VFS.File((this.currentPath + '/' + src.filename));
    this._app.copy(src, dst, this);
  };

  ApplicationFileManagerWindow.prototype.onDropUpload = function(ev, files) {
    this._app.upload(this.currentPath, files, this);
    return true;
  };

  ApplicationFileManagerWindow.prototype.destroy = function() {
    try {
      OSjs.Core.getSettingsManager().unwatch(this.settingsWatch);
    } catch ( e ) {}
    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationFileManager = function(args, metadata) {
    Application.apply(this, ['ApplicationFileManager', args, metadata]);
  };

  ApplicationFileManager.prototype = Object.create(Application.prototype);
  ApplicationFileManager.constructor = Application;

  ApplicationFileManager.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationFileManager.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var path = this._getArgument('path') || API.getDefaultPath();

    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationFileManagerWindow(self, metadata, scheme, path, settings));

      onInited();
    });

    this._setScheme(scheme);
  };

  ApplicationFileManager.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    // If any outside VFS actions were performed, refresh!

    var win = this._getWindow('ApplicationFileManagerWindow');
    if ( win && msg === 'vfs' && args.source !== this.__pid ) {
      win.vfsEvent(args);
    }
  };

  ApplicationFileManager.prototype.download = function(items) {
    items.forEach(function(item) {
      VFS.url(new VFS.File(item), function(error, result) {
        if ( result ) {
          window.open(result);
        }
      });
    });
  };

  ApplicationFileManager.prototype.rm = function(items, win) {
    var self = this;

    // TODO: These must be async
    var files = [];
    items.forEach(function(i) {
      files.push(i.filename);
    });
    files = files.join(', ');

    win._toggleDisabled(true);
    API.createDialog('Confirm', {
      buttons: ['yes', 'no'],
      message: Utils.format(OSjs.Applications.ApplicationFileManager._('Delete <span>{0}</span> ?'), files)
    }, function(ev, button) {
      win._toggleDisabled(false);
      if ( button !== 'ok' && button !== 'yes' ) { return; }

      items.forEach(function(item) {
        item = new VFS.File(item);
        self._action('delete', [item], function() {
          win.changePath(null);
        });
      });
    }, win);

  };

  ApplicationFileManager.prototype.info = function(items, win) {
    items.forEach(function(item) {
      if ( item.type === 'file' ) {
        API.createDialog('FileInfo', {
          file: new VFS.File(item)
        }, null, win);
      }
    });
  };

  ApplicationFileManager.prototype.open = function(items) {
    items.forEach(function(item) {
      if ( item.type === 'file' ) {
        API.open(new VFS.File(item), {forceList: true});
      }
    });
  };

  ApplicationFileManager.prototype.rename = function(items, win) {
    // TODO: These must be async
    var self = this;

    function rename(item, newName) {
      item = new VFS.File(item);

      var newitem = new VFS.File(item);
      newitem.filename = newName;
      newitem.path = Utils.replaceFilename(item.path, newName);

      self._action('move', [item, newitem], function(error) {
        if ( !error ) {
          win.changePath(null, newitem);
        }
      });
    }

    items.forEach(function(item) {
      var dialog = API.createDialog('Input', {
        message: OSjs.Applications.ApplicationFileManager._('Rename <span>{0}</span>', item.filename),
        value: item.filename
      }, function(ev, button, result) {
        if ( button === 'ok' && result ) {
          rename(item, result);
        }
      }, win);
      dialog.setRange(Utils.getFilenameRange(item.filename));
    });
  };

  ApplicationFileManager.prototype.mkfile = function(dir, win) {
    var self = this;

    win._toggleDisabled(true);
    function finished(write, item) {
      win._toggleDisabled(false);

      if ( item ) {
        VFS.write(item, '', function() {
          win.changePath(null, item);
        }, {}, self);
      }
    }

    API.createDialog('Input', {
      value: 'My new File',
      message: OSjs.Applications.ApplicationFileManager._('Create a new file in <span>{0}</span>', dir)
    }, function(ev, button, result) {
      if ( !result ) {
        win._toggleDisabled(false);
        return;
      }

      var item = new VFS.File(dir + '/' + result);
      VFS.exists(item, function(error, result) {
        if ( result ) {
          win._toggleDisabled(true);

          API.createDialog('Confirm', {
            buttons: ['yes', 'no'],
            message: API._('DIALOG_FILE_OVERWRITE', item.filename)
          }, function(ev, button) {
            finished(button === 'yes' || button === 'ok', item);
          }, self);
        } else {
          finished(true, item);
        }
      });
    }, win);
  };

  ApplicationFileManager.prototype.mkdir = function(dir, win) {
    var self = this;

    win._toggleDisabled(true);
    API.createDialog('Input', {
      message: OSjs.Applications.ApplicationFileManager._('Create a new directory in <span>{0}</span>', dir)
    }, function(ev, button, result) {
      if ( !result ) {
        win._toggleDisabled(false);
        return;
      }

      var item = new VFS.File(dir + '/' + result);
      self._action('mkdir', [item], function() {
        win._toggleDisabled(false);
        win.changePath(null, item);
      });
    }, win);
  };

  ApplicationFileManager.prototype.copy = function(src, dest, win) {
    var self = this;
    var dialog = API.createDialog('FileProgress', {
      message: OSjs.Applications.ApplicationFileManager._('Copying <span>{0}</span> to <span>{1}</span>', src.filename, dest.path)
    }, function() {
    }, win);

    win._toggleLoading(true);

    VFS.copy(src, dest, function(error, result) {
      win._toggleLoading(false);

      try {
        dialog._close();
      } catch ( e ) {}

      if ( error ) {
        API.error(API._('ERR_GENERIC_APP_FMT', self.__label), API._('ERR_GENERIC_APP_REQUEST'), error);
        return;
      }
    }, {dialog: dialog});
  };

  ApplicationFileManager.prototype.upload = function(dest, files, win) {
    var self = this;

    function upload() {
      win._toggleLoading(true);

      VFS.upload({
        files: files,
        destination: dest,
        win: win,
        app: self
      }, function(error, file) {
        win._toggleLoading(false);
        if ( error ) {
          API.error(API._('ERR_GENERIC_APP_FMT', self.__label), API._('ERR_GENERIC_APP_REQUEST'), error);
          return;
        }
        win.changePath(null, file);
      });
    }

    if ( files ) {
      upload();
    } else {
      API.createDialog('FileUpload', {
        dest: dest
      }, function(ev, button, result) {
        if ( result ) {
          win.changePath(null, result.filename);
        }
      }, win);
    }
  };

  ApplicationFileManager.prototype.showStorageNotification = function(type) {
    if ( notificationWasDisplayed[type] ) {
      return;
    }
    notificationWasDisplayed[type] = true;

    var wm = OSjs.Core.getWindowManager();
    var ha = OSjs.Core.getHandler();
    if ( wm ) {
      wm.notification({
        title: 'External Storage',
        message: 'Using external services requires authorization. A popup-window may appear.',
        icon: 'status/dialog-information.png'
      });
    }
  };

  ApplicationFileManager.prototype._action = function(name, args, callback) {
    callback = callback || function() {};
    var self = this;
    var _onError = function(error) {
      API.error(API._('ERR_GENERIC_APP_FMT', self.__label), API._('ERR_GENERIC_APP_REQUEST'), error);
      callback(false);
    };

    VFS[name].apply(VFS, args.concat(function(error, result) {
      if ( error ) {
        _onError(error);
        return;
      }
      callback(error, result);
    }, null, this));
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationFileManager = OSjs.Applications.ApplicationFileManager || {};
  OSjs.Applications.ApplicationFileManager.Class = ApplicationFileManager;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
