(function(Application, Window) {

  /**
   * Main Window
   */
  var ApplicationFileManagerWindow = function(app) {
    Window.apply(this, ['ApplicationFileManagerWindow', {width: 650, height: 420}, app]);

    this.title      = "File Manager";
    this.fileView   = null;
    this.sideView   = null;
    this.menuBar    = null;
    this.statusBar  = null;

    this._title = this.title;
    this._properties.allow_drop = true;
  };

  ApplicationFileManagerWindow.prototype = Object.create(Window.prototype);

  ApplicationFileManagerWindow.prototype.init = function() {
    var self  = this;
    var app   = this._appRef;
    var root  = Window.prototype.init.apply(this, arguments);

    this.fileView   = new OSjs.GUI.FileView('/', {dnd: true, className: 'fileView', summary: true});
    this.sideView   = new OSjs.GUI.ListView({className: 'sideView', dnd: false, singleClick: true});
    this.menuBar    = new OSjs.GUI.MenuBar();
    this.statusBar  = new OSjs.GUI.StatusBar();

    this.fileView.onItemDropped = function(ev, el, item) {
      // TODO
      console.warn("Not implemented yet!");
      return false;
    };
    this.fileView.onFilesDropped = function(ev, el, files) {
      return self.onDropUpload(ev, el, files);
    };
    this.fileView.onFinished = function(dir, numItems, totalBytes) {
      self.statusBar.setText("Showing " + numItems + " item(s), " + totalBytes + " byte(s)");
      self._toggleLoading(false);
      try {
        self._appRef.go(dir, self);
      } catch ( e ) {
        console.warn("ApplicationFileManagerWindow->onFinished()", e);
      }
    };
    this.fileView.onRefresh = function() {
      self.statusBar.setText("Refreshing...");
      self._toggleLoading(true);
    };
    this.fileView.onActivated = function(name, type, mime) {
      if ( name ) {
        if ( type === 'file' ) {
          app.open(name, mime);
        } else {
          self.statusBar.setText("Loading...");
        }
      }
    };
    this.fileView.onError = function(error) {
      self._toggleLoading(false);
      OSjs.API.error("File Manager error", "An error occured while handling your request", error);
    };

    this.menuBar.addItem("File", [
      {title: 'Create directory', onClick: function() {
        var cur = self.fileView.getPath();
        app._createDialog('Input', ["Create a new directory in <span>" + cur + "</span>", '', function(btn, value) {
          if ( btn !== 'ok' || !value ) return;

          app.mkdir((cur + '/' + value), function() {
            if ( self.fileView ) {
              self.fileView.refresh();
            }
          });
        }], self);
      }},
      {title: 'Upload', onClick: function() {
        app._createDialog('FileUpload', [self.fileView.getPath(), null, function(btn, filename, mime, size) {
          if ( btn != 'ok' && btn != 'complete' ) return;
          if ( self.fileView ) {
            self.fileView.refresh(function() {
              self.fileView.setSelected(filename, 'filename');
            });
          }
        }], self);
      }},
      {title: 'Close', onClick: function() {
        self._close();
      }}
    ]);
    this.menuBar.addItem("Edit", [
      {name: 'Rename', title: 'Rename', onClick: function() {
        var cur = self.fileView.getSelected();
        if ( !cur ) return;
        var fname = OSjs.Utils.filename(cur.path);
        app._createDialog('Input', ["Rename <span>" + fname + "</span>", fname, function(btn, value) {
          if ( btn !== 'ok' || !value ) return;
          var newpath = OSjs.Utils.dirname(cur.path) + '/' + value;

          app.move(cur.path, newpath, function() {
            if ( self.fileView ) {
              self.fileView.refresh();
            }
          });
        }], self);
      }},
      {name: 'Delete', title: 'Delete', onClick: function() {
        var cur = self.fileView.getSelected();
        if ( !cur ) return;
        var fname = OSjs.Utils.filename(cur.path);

        app._createDialog('Confirm', ["Delete <span>" + fname + "</span> ?", function(btn) {
          if ( btn !== 'ok' ) return;
          app.unlink(cur.path, function() {
            if ( self.fileView ) {
              self.fileView.refresh();
            }
          });
        }]);
      }}
    ]);
    this.menuBar.addItem("View", [
      {title: 'Refresh', onClick: function() {
        self.fileView.refresh();
      }}
    ]);
    this.menuBar.onMenuOpen = function(menu) {
      var sel = self.fileView.getSelected();
      var el1 = menu.getRoot().getElementsByClassName("MenuItem_Rename")[0];
      var el2 = menu.getRoot().getElementsByClassName("MenuItem_Delete")[0];
      var cur = sel ? sel.filename != '..' : false;
      if ( el1 ) {
        if ( cur ) {
          el1.className = el1.className.replace(/\s?Disabled/, '');
        } else {
          el1.className += ' Disabled';
        }
      }
      if ( el2 ) {
        if ( cur ) {
          el2.className = el2.className.replace(/\s?Disabled/, '');
        } else {
          el2.className += ' Disabled';
        }
      }
    };

    this.sideView.setColumns([
      {key: 'image', title: '', type: 'image', domProperties: {width: "16"}},
      {key: 'filename', title: 'Filename'},
      {key: 'mime', title: 'Mime', visible: false},
      {key: 'size', title: 'Size', visible: false},
      {key: 'path', title: 'Path', visible: false, domProperties: {width: "70"}},
      {key: 'type', title: 'Type', visible: false, domProperties: {width: "50"}}
     ]);
    this.sideView.setRows([
      {image: '/themes/default/icons/16x16/places/folder_home.png', filename: 'Home', mime: null, size: 0, type: 'link', path: OSjs.API.getDefaultPath('/')},
      {image: '/themes/default/icons/16x16/places/folder.png', filename: 'Temp', mime: null, size: 0, type: 'link', path: '/tmp'},
      {image: '/themes/default/icons/16x16/devices/drive-harddisk.png', filename: 'Filesystem', mime: null, size: 0, type: 'link', path: '/'}
    ]);
    this.sideView.onActivate = function(ev, listView, t) {
      if ( t ) {
        var path = t.getAttribute('data-path');
        var type = t.getAttribute('data-type');
        if ( path ) {
          if ( type === 'file' ) {
            app.open(path, t.getAttribute('data-mime'));
          } else {
            self.fileView.chdir(path);
          }
        }
      }
    };

    root.appendChild(this.menuBar.getRoot());
    root.appendChild(this.sideView.getRoot());
    root.appendChild(this.fileView.getRoot());
    root.appendChild(this.statusBar.getRoot());

    this._addGUIElement(this.sideView);
    this._addGUIElement(this.fileView);
    this._addGUIElement(this.statusBar);

    this.sideView.render();
  };

  ApplicationFileManagerWindow.prototype.destroy = function() {
    if ( this.statusBar ) {
      this.statusBar.destroy();
      this.statusBar = null;
    }
    if ( this.menuBar ) {
      this.menuBar.destroy();
      this.menuBar = null;
    }
    if ( this.sideView ) {
      this.sideView.destroy();
      this.sideView = null;
    }
    if ( this.fileView ) {
      this.fileView.destroy();
      this.fileView = null;
    }

    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationFileManagerWindow.prototype._onKeyEvent = function(ev) {
    Window.prototype._onKeyEvent.apply(this, arguments);
    if ( this.fileView ) {
      this.fileView.onKeyPress(ev);
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
      var dest = this.fileView.getPath();

      for ( var i = 0; i < files.length; i++ ) {
        app._createDialog('FileUpload', [dest, files[i], function(btn, filename, mime, size) {
          if ( btn != 'ok' && btn != 'complete' ) return;
          if ( self.fileView ) {
            self.fileView.refresh(function() {
              self.fileView.setSelected(filename, 'filename');
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
    w.fileView.chdir(path);
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

    var _onError = function(error) {
      // FIXME
      OSjs.API.error("File Manager error", "An error occured while handling your request", error);

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

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationFileManager = ApplicationFileManager;

})(OSjs.Core.Application, OSjs.Core.Window);
