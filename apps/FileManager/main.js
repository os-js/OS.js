(function(Application, Window, GUI) {

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      'Show Sidebar' : 'Vis Sidebar',
      'Copying file...' : 'Kopierer fil...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Kopierer <span>{0}</span> to <span>{1}</span>",
      "Showing {0} item(s), {1}" : "Viser {0} objekt(er), {1}",
      "Refreshing..." : "Gjenoppfrisker...",
      "Loading..." : "Laster...",
      "Create a new directory in <span>{0}</span>" : "Opprett ny mappe i <span>{0}</span>",
      "Rename <span>{0}</span>" : "Navngi <span>{0}</span>",
      "Delete <span>{0}</span> ?" : "Slette <span>{0}</span> ?"
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return OSjs.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window
   */
  var ApplicationFileManagerWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationFileManagerWindow', {width: 650, height: 420}, app]);

    this.title                  = metadata.name;
    this._title                 = this.title;
    this._properties.allow_drop = true;
    this._icon                  = metadata.icon;
  };

  ApplicationFileManagerWindow.prototype = Object.create(Window.prototype);

  ApplicationFileManagerWindow.prototype.init = function() {
    var self  = this;
    var app   = this._appRef;
    var root  = Window.prototype.init.apply(this, arguments);
    var vt    = app._getArgument('viewType');
    var vs    = true;

    var panedView  = this._addGUIElement(new GUI.PanedView('FileManagerPanedView'), root);
    var viewSide   = panedView.createView('Side');
    var viewFile   = panedView.createView('File');
    var sideView   = this._addGUIElement(new GUI.ListView('FileManagerSideView', {dnd: false, singleClick: true}), viewSide);
    var fileView   = this._addGUIElement(new GUI.FileView('FileManagerFileView', {path: '/', dnd: true, summary: true, viewType: vt}), viewFile);
    var statusBar  = this._addGUIElement(new GUI.StatusBar('FileManagerStatusBar'), root);
    var menuBar    = this._addGUIElement(new GUI.MenuBar('FileManagerMenuBar'), root);

    var defaultStatusText = '';

    var _toggleSidebar = function(val) {
      vs = val;
      app._setArgument('viewSidebar', vs);
      viewSide.style.display = vs ? 'block' : 'none';
      panedView.$separator.style.display = vs ? 'block' : 'none';
    };

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

        var d = app._createDialog('FileProgress', [_('Copying file...')], self);
        d.setDescription(_("Copying <span>{0}</span> to <span>{1}</span>", fnm, dir));

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
      defaultStatusText = _("Showing {0} item(s), {1}", numItems, hifs);
      statusBar.setText(defaultStatusText);

      self._toggleLoading(false);
      try {
        self._appRef.go(dir, self);
      } catch ( e ) {
        console.warn("ApplicationFileManagerWindow->onFinished()", e);
      }
    };
    fileView.onRefresh = function() {
      statusBar.setText(_("Refreshing..."));
      self._toggleLoading(true);
    };
    fileView.onActivated = function(name, type, mime) {
      if ( name ) {
        if ( type === 'file' ) {
          app.open(name, mime);
        } else {
          statusBar.setText(_("Loading..."));
        }
      }
    };

    /*
    fileView.onSelected = function(item, el) {
      if ( !item || item.type === 'dir' ) {
        statusBar.setText(defaultStatusText);
        return;
      }
      var hifs = OSjs.Utils.humanFileSize(item.size);
      statusBar.setText('1 item: ' + item.filename + ' (' + hifs + ')');
    };
    */

    fileView.onError = function(error) {
      self._toggleLoading(false);
      self._error(OSjs._("{0} Application Error", self.title), OSjs._("An error occured while handling your request"), error);
    };

    var menuAction = function(action, check) {
      self._focus();
      //var fileView = self._getGUIElement('FileManagerFileView');
      var cur = fileView.getSelected();
      var dir = fileView.getPath();
      if ( check ) {
        if ( !cur || !cur.path ) return;
      }
      var fname = cur ? OSjs.Utils.filename(cur.path) : null;

      if ( action == 'mkdir' ) {
        app._createDialog('Input', [_("Create a new directory in <span>{0}</span>", dir), '', function(btn, value) {
          self._focus();
          if ( btn !== 'ok' || !value ) return;

          app.mkdir((dir + '/' + value), function(result) {
            if ( result && fileView ) {
              fileView.refresh(function() {
                fileView.setSelected('filename', value);
              });
              OSjs.API.getCoreInstance().message('vfs', {type: 'mkdir', path: dir, filename: value, source: self._appRef.__pid});
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
              OSjs.API.getCoreInstance().message('vfs', {type: 'upload', path: dir, filename: filename, source: self._appRef.__pid});
            }
          }
        }], self);
      }

      else if ( action == 'rename' ) {
        app._createDialog('Input', [_("Rename <span>{0}</span>", fname), fname, function(btn, value) {
          self._focus();
          if ( btn !== 'ok' || !value ) return;
          var newpath = OSjs.Utils.dirname(cur.path) + '/' + value;

          app.move(cur.path, newpath, function(result) {
            if ( result && fileView ) {
              fileView.refresh(function() {
                if ( fileView ) fileView.setSelected(value, 'filename');
              });
              self._focus();
              OSjs.API.getCoreInstance().message('vfs', {type: 'rename', path: dir, filename: value, source: self._appRef.__pid});
            }
          });
        }], self);
      }

      else if ( action == 'delete' ) {
        app._createDialog('Confirm', [_("Delete <span>{0}</span> ?", fname), function(btn) {
          self._focus();
          if ( btn !== 'ok' ) return;
          app.unlink(cur.path, function(result) {
            if ( result && fileView ) {
              fileView.refresh();
              OSjs.API.getCoreInstance().message('vfs', {type: 'delete', path: OSjs.Utils.dirname(cur.path), filename: OSjs.Utils.filename(cur.path), source: self._appRef.__pid});
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

      else if ( action == 'openWith' ) {
        if ( cur.type === 'dir' ) return;
        app.open(cur.path, cur.mime, true);
      }
    };

    menuBar.addItem(OSjs._("File"), [
      {title: OSjs._('Create directory'), onClick: function() {
        menuAction('mkdir');
      }},
      {title: OSjs._('Upload'), onClick: function() {
        menuAction('upload');
      }},
      {title: OSjs._('Close'), onClick: function() {
        self._close();
      }}
    ]);

    menuBar.addItem(OSjs._("Edit"), [
      {name: 'Rename', title: OSjs._('Rename'), onClick: function() {
        menuAction('rename', true);
      }},
      {name: 'Delete', title: OSjs._('Delete'), onClick: function() {
        menuAction('delete', true);
      }},
      {name: 'Information', title: OSjs._('Information'), onClick: function() {
        menuAction('info', true);
      }},
      {name: 'OpenWith', title: OSjs._('Open With ...'), onClick: function() {
        menuAction('openWith', true);
      }}
    ]);

    var viewTypeMenu = [
      {name: 'ListView', title: OSjs._('List View'), onClick: function() {
        fileView.setViewType('ListView');
        self._focus();
        app._setArgument('viewType', 'ListView');
        //app._setSetting('viewType', 'ListView');
      }},
      {name: 'IconView', title: OSjs._('Icon View'), onClick: function() {
        fileView.setViewType('IconView');
        self._focus();
        app._setArgument('viewType', 'IconView');
        //app._setSetting('viewType', 'IconView');
      }}
    ];

    var chk;
    menuBar.addItem(OSjs._("View"), [
      {title: OSjs._('Refresh'), onClick: function() {
        fileView.refresh();
        self._focus();
      }},
      {title: _('Show Sidebar'),
        onCreate: function(menu, item) {
          var span = document.createElement('span');
          chk  = document.createElement('input');
          chk.type = 'checkbox';
          if ( vs ) {
            chk.setAttribute('checked', 'checked');
          }
          span.appendChild(document.createTextNode(item.title));
          span.appendChild(chk);
          menu.appendChild(span);
        }, onClick: function() {
          fileView.refresh();
          if ( chk ) {
            if ( chk.checked ) {
              chk.removeAttribute('checked');
              _toggleSidebar(false);
            } else {
              chk.setAttribute('checked', 'checked');
              _toggleSidebar(true);
            }
          }
          self._focus();
        }
      },
      {title: OSjs._('View type'), menu: viewTypeMenu}
    ]);

    menuBar.onMenuOpen = function(menu, mpos, mtitle, menuBar) {
      if ( mtitle === OSjs._('File') ) return;

      var fileView = self._getGUIElement('FileManagerFileView');
      var sel = fileView.getSelected();
      var cur = sel ? sel.filename != '..' : false;

      if ( cur ) {
        menu.setItemDisabled("Rename", false);
        menu.setItemDisabled("Delete", false);
      } else {
        menu.setItemDisabled("Rename", true);
        menu.setItemDisabled("Delete", true);
      }

      if ( cur && sel.type === 'file' ) {
        menu.setItemDisabled("Information", false);
        menu.setItemDisabled("OpenWith", false);
      } else {
        menu.setItemDisabled("Information", true);
        menu.setItemDisabled("OpenWith", true);
      }

      if ( fileView.getViewType() === 'IconView' ) {
        menu.setItemDisabled("ListView", false);
        menu.setItemDisabled("IconView", true);
      } else {
        menu.setItemDisabled("ListView", true);
        menu.setItemDisabled("IconView", false);
      }
    };

    var _getFileIcon = function(r) {
      return OSjs.API.getThemeResource(r, 'icon');
    };

    sideView.setColumns([
      {key: 'image', title: '', type: 'image', domProperties: {width: "16"}},
      {key: 'filename', title: OSjs._('Filename')},
      {key: 'mime', title: OSjs._('Mime'), visible: false},
      {key: 'size', title: OSjs._('Size'), visible: false},
      {key: 'path', title: OSjs._('Path'), visible: false, domProperties: {width: "70"}},
      {key: 'type', title: OSjs._('Type'), visible: false, domProperties: {width: "50"}}
     ]);
    sideView.setRows([
      {image: _getFileIcon('places/folder_home.png'), filename: 'Home', mime: null, size: 0, type: 'link', path: OSjs.API.getDefaultPath('/')},
      {image: _getFileIcon('places/folder-documents.png'), filename: 'Documents', mime: null, size: 0, type: 'link', path: '/Documents'}
      /*,
      {image: _getFileIcon('places/folder.png'), filename: 'Temp', mime: null, size: 0, type: 'link', path: '/tmp'},
      {image: _getFileIcon('devices/drive-harddisk.png'), filename: 'Filesystem', mime: null, size: 0, type: 'link', path: '/'}*/
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

    if ( app._getArgument('viewSidebar') === false ) {
      _toggleSidebar(false);
    }
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
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) return;

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

            OSjs.API.getCoreInstance().message('vfs', {type: 'upload', path: dest, filename: filename, source: self._appRef.__pid});
          }
        }], this);
      }
    }
    return false;
  };

  ApplicationFileManagerWindow.prototype.vfsEvent = function(path, filename) {
    var fileView = this._getGUIElement('FileManagerFileView');
    if ( fileView ) {
      if ( fileView.getPath() == path ) {
        fileView.refresh();
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

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

  ApplicationFileManager.prototype.init = function(core, session, metadata) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationFileManagerWindow(this, metadata));

    var path = this._getArgument('path') || OSjs.API.getDefaultPath('/');
    var w = this._getWindow('ApplicationFileManagerWindow');
    w._getGUIElement('FileManagerFileView').chdir(path);
    this.go(path, w);
  };

  ApplicationFileManager.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationFileManagerWindow' ) {
      this.destroy();
    } else if ( msg == 'vfs' ) {
      if ( args.source !== this.__pid ) {
        var win = this._getWindow('ApplicationFileManagerWindow');
        if ( win ) {
          win.vfsEvent(args.path, args.filename);
        }
      }
    }
  };

  ApplicationFileManager.prototype.open = function(filename, mime, forceList) {
    OSjs.API.open(filename, mime, {forceList: (forceList?true:false)});
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
        win._error(OSjs._("{0} Application Error", self.__label), OSjs._("An error occured while handling your request"), error);
      } else {
        OSjs.API.error(OSjs._("{0} Application Error", self.__label), OSjs._("An error occured while handling your request"), error);
      }

      callback(false);
    };

    OSjs.API.call('fs', {'method': name, 'arguments': args}, function(res) {
      if ( !res || (typeof res.result === 'undefined') || res.error ) {
        _onError(res.error || OSjs._('Fatal error'));
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

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationFileManager = ApplicationFileManager;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI);
