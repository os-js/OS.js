(function(Application, Window) {

  /**
   * Main Window
   */
  var ApplicationFileManagerWindow = function(app) {
    Window.apply(this, ['ApplicationFileManagerWindow', {width: 650, height: 420}, app]);

    this.title                  = "File Manager";
    this._title                 = this.title;
    this._properties.allow_drop = true;
    this._icon                  = 'apps/file-manager.png';
  };

  ApplicationFileManagerWindow.prototype = Object.create(Window.prototype);

  ApplicationFileManagerWindow.prototype.init = function() {
    var self  = this;
    var app   = this._appRef;
    var root  = Window.prototype.init.apply(this, arguments);

    var fileView   = this._addGUIElement(new OSjs.GUI.FileView('FileManagerFileView', '/', {dnd: true, summary: true}), root);
    var sideView   = this._addGUIElement(new OSjs.GUI.ListView('FileManagerSideView', {dnd: false, singleClick: true}), root);
    var statusBar  = this._addGUIElement(new OSjs.GUI.StatusBar('FileManagerStatusBar'), root);
    var menuBar    = this._addGUIElement(new OSjs.GUI.MenuBar('FileManagerMenuBar'), root);

    fileView.onContextMenu = function(ev, el, item) {
      if ( menuBar ) {
        menuBar.createContextMenu(ev, 1);
      }
    };

    fileView.onItemDropped = function(ev, el, item) {
      if ( item && item.type === "file" && item.data ) {
        var dir = fileView.getPath();
        var fnm = item.data.filename;
        var src = item.data.path;
        var dst = dir + '/' + fnm;

        var d = app._createDialog('FileProgress', ['Copying file...'], self);
        d.setDescription("Copying <span>" + fnm + "</span> to <span>" + dir + "</span>");

        app.copy(src, dst, function(result) {
          d.setProgress(100);
          if ( result ) {
            fileView.refresh(function() {
              fileView.setSelected(fnm, 'filename');
            });
            self._focus();
          }
          d._close();
        });

        return true;
      }
      return false;
    };
    fileView.onFilesDropped = function(ev, el, files) {
      return self.onDropUpload(ev, el, files);
    };
    fileView.onFinished = function(dir, numItems, totalBytes) {
      var hifs = OSjs.Utils.humanFileSize(totalBytes);
      statusBar.setText("Showing " + numItems + " item(s), " + hifs);
      self._toggleLoading(false);
      try {
        self._appRef.go(dir, self);
      } catch ( e ) {
        console.warn("ApplicationFileManagerWindow->onFinished()", e);
      }
    };
    fileView.onRefresh = function() {
      statusBar.setText("Refreshing...");
      self._toggleLoading(true);
    };
    fileView.onActivated = function(name, type, mime) {
      if ( name ) {
        if ( type === 'file' ) {
          app.open(name, mime);
        } else {
          statusBar.setText("Loading...");
        }
      }
    };
    fileView.onError = function(error) {
      self._toggleLoading(false);
      self._error("File Manager error", "An error occured while handling your request", error);
    };

    var menuAction = function(action, check) {
      self._focus();
      var fileView = self._getGUIElement('FileManagerFileView');
      var cur = fileView.getSelected();
      var dir = fileView.getPath();
      if ( check ) {
        if ( !cur || !cur.path ) return;
      }
      var fname = cur ? OSjs.Utils.filename(cur.path) : null;

      if ( action == 'mkdir' ) {
        app._createDialog('Input', ["Create a new directory in <span>" + dir + "</span>", '', function(btn, value) {
          self._focus();
          if ( btn !== 'ok' || !value ) return;

          app.mkdir((dir + '/' + value), function(result) {
            if ( result && fileView ) {
              fileView.refresh(function() {
                fileView.setSelected('filename', value);
              });
            }
          });
        }], self);
      }

      else if ( action == 'upload' ) {
        app._createDialog('FileUpload', [fileView.getPath(), null, function(btn, filename, mime, size) {
          if ( btn == 'complete' ) {
            self._focus();
            if ( fileView ) {
              fileView.refresh(function() {
                fileView.setSelected(filename, 'filename');
              });
            }
          }
        }], self);
      }

      else if ( action == 'rename' ) {
        app._createDialog('Input', ["Rename <span>" + fname + "</span>", fname, function(btn, value) {
          self._focus();
          if ( btn !== 'ok' || !value ) return;
          var newpath = OSjs.Utils.dirname(cur.path) + '/' + value;

          app.move(cur.path, newpath, function(result) {
            if ( result && fileView ) {
              fileView.refresh(function() {
                if ( fileView ) fileView.setSelected(value, 'filename');
              });
              self._focus();
            }
          });
        }], self);
      }

      else if ( action == 'delete' ) {
        app._createDialog('Confirm', ["Delete <span>" + fname + "</span> ?", function(btn) {
          self._focus();
          if ( btn !== 'ok' ) return;
          app.unlink(cur.path, function(result) {
            if ( result && fileView ) {
              fileView.refresh();
            }
          });
        }]);
      }

      else if ( action == 'info' ) {
        if ( cur.type === 'dir' ) return;
        app._createDialog('FileInfo', [cur.path, function(btn) {
          self._focus();
        }]);
      }
    };

    menuBar.addItem("File", [
      {title: 'Create directory', onClick: function() {
        menuAction('mkdir');
      }},
      {title: 'Upload', onClick: function() {
        menuAction('upload');
      }},
      {title: 'Close', onClick: function() {
        self._close();
      }}
    ]);

    menuBar.addItem("Edit", [
      {name: 'Rename', title: 'Rename', onClick: function() {
        menuAction('rename', true);
      }},
      {name: 'Delete', title: 'Delete', onClick: function() {
        menuAction('delete', true);
      }},
      {name: 'Information', title: 'Information', onClick: function() {
        menuAction('info', true);
      }}
    ]);

    menuBar.addItem("View", [
      {title: 'Refresh', onClick: function() {
        var fileView = self._getGUIElement('FileManagerFileView');
        fileView.refresh();
        self._focus();
      }}
    ]);

    menuBar.onMenuOpen = function(menu, mpos, mtitle) {
      if ( mtitle !== 'Edit' ) return;

      var fileView = self._getGUIElement('FileManagerFileView');
      var sel = fileView.getSelected();
      var el;
      var cur = sel ? sel.filename != '..' : false;
      if ( cur ) {
        el = menu.getRoot().getElementsByClassName("MenuItem_Rename")[0];
        if ( el ) el.className = el.className.replace(/\s?Disabled/, '');

        el = menu.getRoot().getElementsByClassName("MenuItem_Delete")[0];
        if ( el ) el.className = el.className.replace(/\s?Disabled/, '');
      } else {
        el = menu.getRoot().getElementsByClassName("MenuItem_Rename")[0];
        if ( el ) el.className += ' Disabled';

        el = menu.getRoot().getElementsByClassName("MenuItem_Delete")[0];
        if ( el ) el.className += ' Disabled';
      }

      if ( cur && sel.type === 'file' ) {
        el = menu.getRoot().getElementsByClassName("MenuItem_Information")[0];
        if ( el ) el.className = el.className.replace(/\s?Disabled/, '');
      } else {
        el = menu.getRoot().getElementsByClassName("MenuItem_Information")[0];
        if ( el ) el.className += ' Disabled';
      }

    };

    var _getFileIcon = function(r) {
      return OSjs.API.getThemeResource(r, 'icon');
    };

    sideView.setColumns([
      {key: 'image', title: '', type: 'image', domProperties: {width: "16"}},
      {key: 'filename', title: 'Filename'},
      {key: 'mime', title: 'Mime', visible: false},
      {key: 'size', title: 'Size', visible: false},
      {key: 'path', title: 'Path', visible: false, domProperties: {width: "70"}},
      {key: 'type', title: 'Type', visible: false, domProperties: {width: "50"}}
     ]);
    sideView.setRows([
      {image: _getFileIcon('places/folder_home.png'), filename: 'Home', mime: null, size: 0, type: 'link', path: OSjs.API.getDefaultPath('/')},
      {image: _getFileIcon('places/folder.png'), filename: 'Temp', mime: null, size: 0, type: 'link', path: '/tmp'},
      {image: _getFileIcon('devices/drive-harddisk.png'), filename: 'Filesystem', mime: null, size: 0, type: 'link', path: '/'}
    ]);
    sideView.onActivate = function(ev, el, item) {
      if ( el && item && item.path ) {
        if ( item.type === 'file' ) {
          app.open(item.path, item.mime);
        } else {
          var fileView = self._getGUIElement('FileManagerFileView');
          if ( fileView ) {
            fileView.chdir(item.path);
          }
        }
      }
    };

    sideView.render();
  };

  ApplicationFileManagerWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationFileManagerWindow.prototype._onKeyEvent = function(ev) {
    Window.prototype._onKeyEvent.apply(this, arguments);
    var fileView = this._getGUIElement('FileManagerFileView');
    if ( fileView ) {
      fileView.onKeyPress(ev);
    }
  };

  ApplicationFileManagerWindow.prototype._onDndEvent = function(ev, type, item, args) {
    Window.prototype._onDndEvent.apply(this, arguments);
    if ( type === 'filesDrop' && item ) {
      return this.onDropUpload(ev, null, item);
    }
    return true;
  };

  ApplicationFileManagerWindow.prototype.onDropUpload = function(ev, el, files) {
    var self = this;
    if ( files && files.length ) {
      var app = this._appRef;
      var fileView = this._getGUIElement('FileManagerFileView');
      var dest = fileView.getPath();

      for ( var i = 0; i < files.length; i++ ) {
        app._createDialog('FileUpload', [dest, files[i], function(btn, filename, mime, size) {
          if ( btn != 'ok' && btn != 'complete' ) return;
          var fileView = self._getGUIElement('FileManagerFileView');
          if ( fileView ) {
            fileView.refresh(function() {
              fileView.setSelected(filename, 'filename');
              self._focus();
            });
          }
        }], this);
      }
    }
    return false;
  };

  /**
   * Application
   */
  var ApplicationFileManager = function(args, metadata) {
    Application.apply(this, ['ApplicationFileManager', args, metadata]);
  };

  ApplicationFileManager.prototype = Object.create(Application.prototype);

  ApplicationFileManager.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, []);
  };

  ApplicationFileManager.prototype.init = function(core, session) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationFileManagerWindow(this));

    var path = this._getArgument('path') || OSjs.API.getDefaultPath('/');
    var w = this._getWindow('ApplicationFileManagerWindow');
    w._getGUIElement('FileManagerFileView').chdir(path);
    this.go(path, w);
  };

  ApplicationFileManager.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationFileManagerWindow' ) {
      this.destroy();
    }
  };

  ApplicationFileManager.prototype.open = function(filename, mime) {
    OSjs.API.open(filename, mime);
  };

  ApplicationFileManager.prototype.go = function(dir, w) {
    this._setArgument('path', dir);
    w._setTitle(w.title + ' - ' + (dir || '/'));
  };

  ApplicationFileManager.prototype._action = function(name, args, callback) {
    callback = callback || function() {};

    var self = this;
    var _onError = function(error) {
      var win = self._getWindow('ApplicationFileManagerWindow');
      if ( win ) {
        win._error("File Manager error", "An error occured while handling your request", error);
      } else {
        OSjs.API.error("File Manager error", "An error occured while handling your request", error);
      }

      callback(false);
    };

    OSjs.API.call('fs', {'method': name, 'arguments': args}, function(res) {
      if ( !res || (typeof res.result === 'undefined') || res.error ) {
        _onError(res.error || 'Fatal error');
      } else {
        callback(res.result);
      }
    }, function(error) {
      _onError(error);
    });
  };

  ApplicationFileManager.prototype.move = function(src, dest, callback) {
    return this._action('move', [src, dest], callback);
  };

  ApplicationFileManager.prototype.unlink = function(name, callback) {
    return this._action('delete', [name], callback);
  };

  ApplicationFileManager.prototype.mkdir = function(name, callback) {
    return this._action('mkdir', [name], callback);
  };

  ApplicationFileManager.prototype.copy = function(src, dest, callback) {
    return this._action('copy', [src, dest], callback);
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationFileManager = ApplicationFileManager;

})(OSjs.Core.Application, OSjs.Core.Window);
