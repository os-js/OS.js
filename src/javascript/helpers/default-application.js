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

(function(Application, Window, Utils, VFS, API, GUI) {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};

  /////////////////////////////////////////////////////////////////////////////
  // Default Application Window Helper
  /////////////////////////////////////////////////////////////////////////////

  function DefaultApplicationWindow(name, app, args, scheme, file) {
    Window.apply(this, arguments);
    this.currentFile = file ? new VFS.File(file) : null;
  }

  DefaultApplicationWindow.prototype = Object.create(Window.prototype);
  DefaultApplicationWindow.constructor = Window;

  DefaultApplicationWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    return root;
  };

  DefaultApplicationWindow.prototype._inited = function() {
    var result = Window.prototype._inited.apply(this, arguments);
    var self = this;
    var app = this._app;

    var menuMap = {
      MenuNew:    function() { app.newDialog(self.currentFile, self); },
      MenuSave:   function() { app.saveDialog(self.currentFile, self); },
      MenuSaveAs: function() { app.saveDialog(self.currentFile, self, true); },
      MenuOpen:   function() { app.openDialog(self.currentFile, self); },
      MenuClose:  function() { self._close(); }
    };

    this._scheme.find(this, 'SubmenuFile').on('select', function(ev) {
      if ( menuMap[ev.detail.id] ) { menuMap[ev.detail.id](); }
    });

    this._scheme.find(this, 'MenuSave').set('disabled', true);

    // Load given file
    if ( this.currentFile ) {
      if ( !this._app.openFile(this.currentFile, this) ) {
        this.currentFile = null;
      }
    }

    return result;
  };

  DefaultApplicationWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) { return; }

    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._app.openFile(new VFS.File(data), this);
      }
    }
  };

  DefaultApplicationWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
    this.currentFile = null;
  };

  DefaultApplicationWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) { return; }

    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._app.openFile(new VFS.File(data), this);
      }
    }
  };

  DefaultApplicationWindow.prototype.showFile = function(file, content) {
    this.updateFile(file);
  };

  DefaultApplicationWindow.prototype.updateFile = function(file) {
    this.currentFile = file || null;

    this._scheme.find(this, 'MenuSave').set('disabled', !file);

    if ( file ) {
      this._setTitle(file.filename, true);
    } else {
      this._setTitle();
    }
  };

  DefaultApplicationWindow.prototype.getFileData = function() {
    return null;
  };

  /////////////////////////////////////////////////////////////////////////////
  // Default Application Helper
  /////////////////////////////////////////////////////////////////////////////

  function DefaultApplication(name, args, metadata, opts) {
    this.defaultOptions = Utils.argumentDefaults(opts, {
      readData: true,
      rawData: false,
      extension: '',
      mime: 'application/octet-stream',
      filetypes: [],
      filename: 'New file'
    });

    Application.apply(this, [name, args, metadata]);
  }

  DefaultApplication.prototype = Object.create(Application.prototype);
  DefaultApplication.constructor = Application;

  DefaultApplication.prototype.init = function(settings, metadata, onLoaded) {
    Application.prototype.init.call(this, settings, metadata);

    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    var file = this._getArgument('file');
    scheme.load(function(error, result) {
      onLoaded(scheme, file);
    });
  };

  DefaultApplication.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    var self = this;
    var current = this._getArgument('file');
    var win = this._getWindow(this.__mainwindow);

    if ( msg === 'vfs' && args.source !== null && args.source !== this.__pid && args.file ) {
      if ( win && current && current.path === args.file.path ) {
        win._toggleDisabled(true);
        API.createDialog('Confirm', {
          message: API._('MSG_FILE_CHANGED'),
        }, function(ev, button) {
          win._toggleDisabled(false);
          if ( button === 'ok' || button === 'yes' ) {
            self.openFile(new VFS.File(args.file), win);
          }
        }, win);
      }
    }
  };

  DefaultApplication.prototype.openFile = function(file, win) {
    var self = this;
    if ( !file ) { return; }

    function onError(error) {
      if ( error ) {
        API.error(self.__label,
                  API._('ERR_FILE_APP_OPEN'),
                  API._('ERR_FILE_APP_OPEN_ALT_FMT',
                  file.path));
        return true;
      }
      return false;
    }

    function onDone(result) {
      self._setArgument('file', file);
      win.showFile(file, result);
    }

    var check = this.__metadata.mime || [];
    if ( !Utils.checkAcceptMime(file.mime, check) ) {
      API.error(this.__label,
                API._('ERR_FILE_APP_OPEN'),
                API._('ERR_FILE_APP_OPEN_FMT',
                file.path, file.mime)
      );
      return false;
    }

    win._toggleLoading(true);

    if ( this.defaultOptions.readData ) {
      VFS.read(file, function(error, result) {
        win._toggleLoading(false);
        if ( onError(error) ) {
          return;
        }
        onDone(result);
      }, {type: this.defaultOptions.rawData ? 'binary' : 'text'});
    } else {
      VFS.url(file, function(error, result) {
        win._toggleLoading(false);
        if ( onError(error) ) {
          return;
        }
        onDone(result);
      });
    }

    return true;
  };

  DefaultApplication.prototype.saveFile = function(file, value, win) {
    var self = this;
    if ( !file ) { return; }

    win._toggleLoading(true);
    VFS.write(file, value || '', function(error, result) {
      win._toggleLoading(false);

      if ( error ) {
        API.error(this.__label,
                  API._('ERR_FILE_APP_SAVE'),
                  API._('ERR_FILE_APP_SAVE_ALT_FMT',
                  file.path));
        return;
      }

      self._setArgument('file', file);
      win.updateFile(file);
    }, {}, this);
  };

  DefaultApplication.prototype.saveDialog = function(file, win, saveAs) {
    var self = this;
    var value = win.getFileData();

    if ( !saveAs ) {
      this.saveFile(file, value, win);
      return;
    }

    win._toggleDisabled(true);
    API.createDialog('File', {
      file: file,
      filename: file ? file.filename : this.defaultOptions.filename,
      filetypes: this.defaultOptions.filetypes,
      filter: this.__metadata.mime,
      extension: this.defaultOptions.extension,
      mime: this.defaultOptions.mime,
      type: 'save'
    }, function(ev, button, result) {
      win._toggleDisabled(false);
      if ( button === 'ok' ) {
        self.saveFile(result, value, win);
      }
    }, win);
  };

  DefaultApplication.prototype.openDialog = function(file, win) {
    var self = this;

    win._toggleDisabled(true);
    API.createDialog('File', {
      file: file,
      filter: this.__metadata.mime
    }, function(ev, button, result) {
      win._toggleDisabled(false);
      if ( button === 'ok' && result ) {
        self.openFile(new VFS.File(result), win);
      }
    }, win);
  };

  DefaultApplication.prototype.newDialog = function(path, win) {
    var self = this;

    this._setArgument('file', null);
    win.showFile(null, null);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.DefaultApplication       = DefaultApplication;
  OSjs.Helpers.DefaultApplicationWindow = DefaultApplicationWindow;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.API, OSjs.GUI);

