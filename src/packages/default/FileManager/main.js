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
    this.viewOptions = settings || {};
  }

  ApplicationFileManagerWindow.prototype = Object.create(Window.prototype);
  ApplicationFileManagerWindow.constructor = Window.prototype;

  ApplicationFileManagerWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;
    var view;
    var viewType   = this.viewOptions.ViewType || 'gui-list-view';
    var viewSide   = typeof this.viewOptions.ViewSide === 'undefined' || this.viewOptions.ViewSide === true;
    var viewHidden = this.viewOptions.ViewHidden === true;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'FileManagerWindow', root);

    if ( window.location.protocol.match(/^file/) ) { // FIXME: Translation
      this._setWarning('VFS does not work when in standalone mode');
    }

    //
    // Menus
    //

    // TODO: Disabled menu items
    function getSelected() {
      var selected = [];
      (view.get('value') || []).forEach(function(sub) {
        selected.push(sub.data);
      });
      return selected;
    }

    var menuMap = {
      MenuClose:        function() { self._close(); },
      MenuCreate:       function() { app.mkdir(self.currentPath, self); },
      MenuUpload:       function() { app.upload(self.currentPath, self); },
      MenuRename:       function() { app.rename(getSelected(), self); },
      MenuDelete:       function() { app.rm(getSelected(), self); },
      MenuInfo:         function() { app.info(getSelected()); },
      MenuOpen:         function() { app.open(getSelected()); },
      MenuDownload:     function() { app.download(getSelected()); },
      MenuRefresh:      function() { self.changePath(); },
      MenuViewList:     function() { self.changeView('gui-list-view', true); },
      MenuViewTree:     function() { self.changeView('gui-tree-view', true); },
      MenuViewIcon:     function() { self.changeView('gui-icon-view', true); },
      MenuShowSidebar:  function() { viewSide = self.toggleSidebar(!viewSide, true); },
      MenuShowHidden:   function() { viewHidden = self.toggleHidden(!viewHidden, true); }
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
    viewMenu.set('checked', 'MenuShowHidden', viewHidden);

    //
    // Side View
    //
    var sideViewItems = [];
    VFS.getModules().forEach(function(m, i) {
      sideViewItems.push({
        value: m.module,
        columns: [
          {
            label: m.module.description + (m.module.readOnly ? Utils.format(' ({0})', API._('LBL_READONLY')) : ''),
            icon: API.getIcon(m.module.icon),
          }
        ]
      });
    });

    var side = scheme.find(this, 'SideView');
    side.on('activate', function(ev) {
      if ( ev && ev.detail && ev.detail.entries ) {
        var entry = ev.detail.entries[0];
        self.changePath(entry.data.root);
      }
    });
    side.add(sideViewItems);

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

    this.changeView(viewType, false);
    this.toggleHidden(viewHidden, false);
    this.toggleSidebar(viewSide, false);

    this.changePath(this.currentPath);

    return root;
  };

  ApplicationFileManagerWindow.prototype.checkSelection = function(files) {
    // FIXME: Locales
    var statusbar = this._scheme.find(this, 'Statusbar');
    var content = '';
    var sum, label;

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
    } else {
      sum = this.currentSummary;
      if ( sum ) {
        label = 'Showing {0} files ({1} hidden), {2} dirs, {3}';
        content = Utils.format(label, sum.files, sum.hidden, sum.directories, Utils.humanFileSize(sum.size));
      }
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

  ApplicationFileManagerWindow.prototype.updateSideView = function() {
    // TODO: Show greyed modules
    var found = null;
    var path = this.currentPath || '/';

    VFS.getModules().forEach(function(m, i) {
      if ( path.match(m.module.match) ) {
        found = m.module.root;
      }
    });

    var view = this._scheme.find(this, 'SideView');
    view.set('selected', found, 'root');
  };

  ApplicationFileManagerWindow.prototype.changePath = function(dir, selectFile) {
    //if ( dir === this.currentPath ) { return; }
    dir = dir || this.currentPath;

    var self = this;
    var view = this._scheme.find(this, 'FileView');

    this._toggleLoading(true);

    view._call('chdir', {
      path: dir,
      done: function(error, summary) {
        if ( dir && !error ) {
          self.currentPath = dir;
          self.currentSummary = summary;
        }
        self._toggleLoading(false);

        self.checkSelection([]);
        self.updateSideView();

        if ( selectFile ) {
          view.set('selected', selectFile.filename, 'filename');
        }
      }
    });

    this._focus();
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
    if ( toggle ) {
      container.show();
    } else {
      container.hide();
    }
    if ( set ) {
      this._app._setSetting('ViewSide', toggle, true);
    }
    return toggle;
  };

  ApplicationFileManagerWindow.prototype.toggleHidden = function(toggle, set) {
    this.viewOptions.ViewHidden = toggle;
    this.changePath(null);

    var view = this._scheme.find(this, 'FileView');
    view.set('dotfiles', toggle);
    this.changePath(null);

    if ( set ) {
      this._app._setSetting('ViewHidden', toggle, true);
    }
    return toggle;
  };

  ApplicationFileManagerWindow.prototype.onDropUpload = function(ev, el, files) {
    var self = this;

    VFS.upload({
      files: files,
      destination: this.currentPath,
      win: this,
      app: this._appRef,
    }, function(error, file) {
      if ( error ) {
        API.error(API._('ERR_GENERIC_APP_FMT', self.__label), API._('ERR_GENERIC_APP_REQUEST'), error);
        return;
      }
      self.changePath(null, file);
    });

    return false;
  };

  ApplicationFileManagerWindow.prototype.destroy = function() {
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

  ApplicationFileManager.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var path = this._getArgument('path') || API.getDefaultPath('/');

    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationFileManagerWindow(self, metadata, scheme, path, settings));
    });
  };

  ApplicationFileManager.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    // If any outside VFS actions were performed, refresh!
    if ( msg == 'vfs' && args.source !== this.__pid ) {
      var win = this._getWindow('ApplicationFileManagerWindow');
      if ( win && args.file ) {
        if ( win.currentPath === Utils.dirname(args.file.path) ) {
          win.changePath(null);
        }
      }
    }
  };

  ApplicationFileManager.prototype.upload = function(dest, win) {
    API.createDialog('FileUpload', {
      dest: dest,
    }, function(ev, button, result) {
      if ( result ) {
        win.changePath(null, result.filename);
      }
    });
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
    // TODO: Confirmation dialog
    items.forEach(function(item) {
      item = new VFS.File(item);
      self._action('delete', [item], function() {
        win.changePath(null);
      });
    });
  };

  ApplicationFileManager.prototype.info = function(items) {
    items.forEach(function(item) {
      if ( item.type === 'file' ) {
        API.createDialog('FileInfo', {
          file: new VFS.File(item)
        });
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
      });
      dialog.setRange(Utils.getFilenameRange(item.filename));
    });
  };

  ApplicationFileManager.prototype.mkdir = function(dir, win) {
    var self = this;

    API.createDialog('Input', {
      message: OSjs.Applications.ApplicationFileManager._('Create a new directory in <span>{0}</span>', dir)
    }, function(ev, button, result) {
      if ( !result ) { return; }

      var item = new VFS.File(dir + '/' + result);
      self._action('mkdir', [item], function() {
        win.changePath(null, item);
      });
    }, win);
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
