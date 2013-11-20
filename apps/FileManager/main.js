(function(Application, Window) {

  /**
   * Main Window
   */
  var ApplicationFileManagerWindow = function(app, opts) {
    Window.apply(this, ['ApplicationFileManagerWindow', opts, app]);

    this.title    = "File Manager";
    this.fileView = null;
    this.sideView = null;
    this.menuBar  = null;

    this._title = this.title;
    this._properties.allow_drop = true;
  };

  ApplicationFileManagerWindow.prototype = Object.create(Window.prototype);

  ApplicationFileManagerWindow.prototype.init = function() {
    var self  = this;
    var app   = this._appRef;
    var root  = Window.prototype.init.apply(this, arguments);

    this.fileView = new OSjs.GUI.FileView('/', {dnd: true, className: 'fileView'});
    this.sideView = new OSjs.GUI.ListView({className: 'sideView', dnd: false});
    this.menuBar  = new OSjs.GUI.MenuBar();

    this.fileView.onItemDropped = function(ev, el, item) {
      // TODO
      console.warn("Not implemented yet!");
      return false;
    };
    this.fileView.onFilesDropped = function(ev, el, files) {
      return self.onDropUpload(ev, el, files);
    };
    this.fileView.onFinished = function(dir) {
      self._toggleLoading(false);
      self._appRef.go(dir, self);
    };
    this.fileView.onRefresh = function() {
      self._toggleLoading(true);
    };
    this.fileView.onActivated = function(name, type, mime) {
      if ( name ) {
        if ( type === 'file' ) {
          app.open(name, mime);
        }
      }
    };
    this.fileView.onError = function(error) {
      self._toggleLoading(false);
      OSjs.API.error("File Manager error", "An error occured while handling your request", error);
    };

    this.menuBar.addItem("File", [
      {title: 'Upload', onClick: function() {
        OSjs.Dialogs.createFileUploadDialog(self.fileView.getPath(), function() {
          if ( self.fileView ) {
            self.fileView.refresh();
          }
        });
      }},
      {title: 'Close', onClick: function() {
        self._close();
      }}
    ]);
    this.menuBar.addItem("View", [
      {title: 'Refresh', onClick: function() {
        self.fileView.refresh();
      }}
    ]);

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

    this.sideView.render();
  };

  ApplicationFileManagerWindow.prototype.destroy = function() {
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

  ApplicationFileManagerWindow.prototype._onDndAction = function(ev, type, item, args) {
    Window.prototype._onDndAction.apply(this, arguments);
    if ( type === 'filesDrop' && item ) {
      return this.onDropUpload(ev, null, item);
    }
    return true;
  };

  ApplicationFileManagerWindow.prototype.onDropUpload = function(ev, el, files) {
    var self = this;
    if ( files && files.length ) {
      var dest = this.fileView.getPath();

      var _onUploaded = function(file) {
        if ( self.fileView ) {
          self.fileView.refresh(function() {
            self.fileView.setSelected(file.name, 'filename');
          });
        }
      };

      for ( var i = 0; i < files.length; i++ ) {
        OSjs.Dialogs.createFileUploadDialog(dest, (function(f) {
          return function() {
            _onUploaded(f);
          };
        })(files[i]), files[i]);
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

    this._addWindow(new ApplicationFileManagerWindow(this, {width: 500, height: 400}));

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
    OSjs.API.getCoreInstance().open(filename, mime);
  };

  ApplicationFileManager.prototype.go = function(dir, w) {
    this._setArgument('path', dir);
    w._setTitle(w.title + ' - ' + (dir || '/'));
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationFileManager = ApplicationFileManager;

})(OSjs.Core.Application, OSjs.Core.Window);
