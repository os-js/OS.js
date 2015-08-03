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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationTextpadWindow(app, metadata, scheme, file) {
    Window.apply(this, ['ApplicationTextpadWindow', {
      allow_drop: true,
      icon: metadata.icon,
      title: metadata.name,
      width: 450,
      height: 300
    }, app, scheme]);

    this.currentFile = file ? new VFS.File(file) : null;
  }

  ApplicationTextpadWindow.prototype = Object.create(Window.prototype);
  ApplicationTextpadWindow.constructor = Window.prototype;

  ApplicationTextpadWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'TextpadWindow', root);

    var input = scheme.find(this, 'Text');

    this._scheme.find(this, 'MenuSave').set('disabled', true);

    var menuMap = {
      MenuNew:    function() { app.newDialog(self.currentFile, self); },
      MenuSave:   function() { app.saveDialog(self.currentFile, input.get('value'), self); },
      MenuSaveAs: function() { app.saveDialog(self.currentFile, input.get('value'), self, true); },
      MenuOpen:   function() { app.openDialog(self.currentFile, self); },
      MenuClose:  function() { self._close(); }
    };

    scheme.find(this, 'SubmenuFile').on('select', function(ev) {
      if ( menuMap[ev.detail.id] ) { menuMap[ev.detail.id](); }
    });

    // Load given file
    if ( this.currentFile ) {
      if ( !app.openFile(this.currentFile, this) ) {
        this.currentFile = null;
      }
    }

    return root;
  };

  ApplicationTextpadWindow.prototype.update = function(file) {
    if ( file ) {
      this._setTitle(file.filename, true);
    } else {
      this._setTitle();
    }
    this.currentFile = file || null;

    var input = this._scheme.find(this, 'Text');
    input.$element.focus();

    this._scheme.find(this, 'MenuSave').set('disabled', !file);
  };

  ApplicationTextpadWindow.prototype.display = function(file, content) {
    var temp = this._scheme.find(this, 'Text').set('value', content || '');
    this.update(file);
  };

  ApplicationTextpadWindow.prototype._focus = function() {
    if ( Window.prototype._focus.apply(this, arguments) ) {
      var input = this._scheme.find(this, 'Text').$element;
      if ( input ) {
        input.focus();
      }
      return true;
    }
    return false;
  };

  ApplicationTextpadWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) { return; }

    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._app.openFile(new VFS.File(data), this);
      }
    }
  };

  ApplicationTextpadWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
    this.currentFile = null;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationTextpad = function(args, metadata) {
    Application.apply(this, ['ApplicationTextpad', args, metadata]);
  };

  ApplicationTextpad.prototype = Object.create(Application.prototype);
  ApplicationTextpad.constructor = Application;

  ApplicationTextpad.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationTextpad.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    var file = this._getArgument('file');
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationTextpadWindow(self, metadata, scheme, file));
    });
  };

  ApplicationTextpad.prototype.openFile = function(file, win) {
    var self = this;
    if ( !file ) { return; }

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
    VFS.read(file, function(error, result) {
      win._toggleLoading(false);

      if ( error ) {
        API.error(this.__label,
                  API._('ERR_FILE_APP_OPEN'),
                  API._('ERR_FILE_APP_OPEN_ALT_FMT',
                  file.path));
        return;
      }

      self._setArgument('file', file);
      win.display(file, result);
    }, {type: 'text'});

    return true;
  };

  ApplicationTextpad.prototype.saveFile = function(file, value, win) {
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
      win.update(file);
    }, {}, this);
  };

  ApplicationTextpad.prototype.saveDialog = function(file, value, win, saveAs) {
    var self = this;
    if ( !saveAs ) {
      this.saveFile(file, value, win);
      return;
    }

    win._toggleDisabled(true);
    API.createDialog('File', {
      file: file,
      filename: file ? file.filename : 'New text file.txt',
      filter: this.__metadata.mime,
      extension: 'txt',
      mime: 'text/plain',
      type: 'save'
    }, function(ev, button, result) {
      win._toggleDisabled(false);
      if ( button === 'ok' ) {
        self.saveFile(result, value, win);
      }
    }, win);
  };

  ApplicationTextpad.prototype.openDialog = function(file, win) {
    var self = this;

    win._toggleDisabled(true);
    API.createDialog('File', {
      file: file,
      filter: this.__metadata.mime
    }, function(ev, button, result) {
      win._toggleDisabled(false);
      if ( result ) {
        self.openFile(new VFS.File(result), win);
      }
    }, win);
  };

  ApplicationTextpad.prototype.newDialog = function(path, win) {
    var self = this;

    this._setArgument('file', null);
    win.display(null, null);
  };

  ApplicationTextpad.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    var self = this;
    var current = this._getArgument('file');
    var win = this._getWindow('ApplicationTextpadWindow');

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

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationTextpad = OSjs.Applications.ApplicationTextpad || {};
  OSjs.Applications.ApplicationTextpad.Class = ApplicationTextpad;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
