/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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

(function(Application, Window, Utils, VFS) {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};

  /////////////////////////////////////////////////////////////////////////////
  // Default Application Window Helper
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This class is a basic implementation of OSjs.Core.Window
   * with support for file handling and drag-and-drop
   *
   * Use this in combination with 'DefaultApplication'
   */
  var DefaultApplicationWindow = function(name, opts, app) {
    Window.apply(this, arguments);

    this._properties.allow_drop = true;
  };

  DefaultApplicationWindow.prototype = Object.create(Window.prototype);

  /**
   * You need to implement this in your application.
   * For an example see the 'Textpad' application
   */
  DefaultApplicationWindow.prototype.checkChanged = function() {
    return false;
  };

  /**
   * Default DnD event
   */
  DefaultApplicationWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) { return; }

    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        var file = new VFS.File(data);
        this._appRef.action('open', file);
      }
    }
  };

  /**
   * Display confirmation dialog of out file has changed
   * Prevent closing of window
   */
  DefaultApplicationWindow.prototype._close = function() {
    var self = this;
    function callback(discard) {
      if ( discard ) {
        self._close();
      }
    }

    if ( this.checkChanged(callback) !== false ) {
      return false;
    }
    return Window.prototype._close.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // Default Application Helper
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application constructor
   *
   * Usage: (Look at Textpad as an example)
   *
   * Implement this as your base-class and set `dialogOptions` on construct.
   * Then add these methods to your Application class: onNew, onOpen, onSave, onGetSaveData
   * In init() assign your main window to `this.mainWindow`
   */
  var DefaultApplication = function() {
    Application.apply(this, arguments);

    // These are reserved
    this.currentFile         = null;
    this.mainWindow          = null;
    this.defaultCheckChange  = false;
    this.dialogOptions       = {
      read: true,           // Read file data
      upload: false,        // Upload instead of writing

      // These are passed on to Dialog
      filetypes: null,
      mime: null,
      mimes: [],
      select: 'file',
      defaultFilename: ''
    };
  };

  DefaultApplication.prototype = Object.create(Application.prototype);

  /**
   * Default Destruction code
   */
  DefaultApplication.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  /**
   * Default init() code (run this last in your Application init() method)
   */
  DefaultApplication.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    // Get launch/restore argument(s)

    var file = this._getArgument('file');
    if ( file && (typeof file === 'object') ) {
      this.currentFile = new VFS.File(file);
      this.action('open', this.currentFile);
    }
  };

  /**
   * Default Messaging handler
   */
  DefaultApplication.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    // Make sure we kill our application if main window was closed
    if ( this.mainWindow ) {
      if ( msg === 'destroyWindow' && obj._name === this.mainWindow._name ) {
        this.destroy();
      } else if ( msg === 'vfs' ) {
        if ( args.source !== this.__pid && args.file ) {
          if ( this.currentFile && this.currentFile.path ) {
            if ( args.file.path === this.currentFile.path ) {
              this.onFileHasChanged(args.file);
            }
          }
        }
      }
    }
  };

  DefaultApplication.prototype.onNew = function() {
    // IMPLEMENT THIS IN YOUR CLASS
  };

  DefaultApplication.prototype.onOpen = function(file, data) {
    // IMPLEMENT THIS IN YOUR CLASS
  };

  DefaultApplication.prototype.onSave = function(file, data) {
    // IMPLEMENT THIS IN YOUR CLASS
  };

  DefaultApplication.prototype.onGetSaveData = function(callback, item) {
    // IMPLEMENT THIS IN YOUR CLASS
    callback(null);
  };

  DefaultApplication.prototype.onFileHasChanged = function(file) {
    if ( !file ) { return; }

    var self = this;
    var win = this.mainWindow;

    if ( win ) {
      win._toggleDisabled(true);
    }
    var msg = OSjs.API._('MSG_FILE_CHANGED');
    this._createDialog('Confirm', [msg, function(btn) {
      if ( win ) {
        win._toggleDisabled(false);
      }
      if ( btn === 'ok' ) {
        self.action('open', file);
      }
    }, win]);
  };

  DefaultApplication.prototype.onCheckChanged = function(callback) {
    function _cb(discard) {
      self.mainWindow._focus();

      callback(discard);
    }

    if ( this.defaultCheckChange ) {
      var self = this;

      var msg = OSjs.API._('MSG_GENERIC_APP_DISCARD');
      if ( this.mainWindow ) {
        if ( this.mainWindow.checkChanged(function(discard) { _cb(discard); }, msg) === false ) {
          _cb(true);
        }
      }
    } else {
      callback(true); // discard true/false
    }
  };

  DefaultApplication.prototype.onCheckDataSource = function(file) {
    return false;
  };

  /**
   * Confirmation dialog creator
   */
  DefaultApplication.prototype.onConfirmDialog = function(win, msg, callback) {
    msg = msg || OSjs.API._('Discard changes?');
    win._toggleDisabled(true);
    this._createDialog('Confirm', [msg, function(btn) {
      win._toggleDisabled(false);
      callback(btn === 'ok');
    }]);
    return true;
  };

  /**
   * Default Error Handler
   */
  DefaultApplication.prototype.onError = function(title, message, action) {
    return false; // Use internal error handler
  };

  /**
   * Perform an external action
   */
  DefaultApplication.prototype.action = function(action, file) {
    var self = this;

    switch ( action ) {
      case 'new' :
        this.onCheckChanged(function(discard) {
          if ( discard ) {
            self._onNew();
          }
        });
      break;

      case 'open' :
        this.onCheckChanged(function(discard) {
          if ( discard ) {
            self._onOpen(file);
          }
        });
      break;

      case 'save' :
        self._onSave(file);
      break;

      case 'saveas' :
        self._onSaveAs();
      break;

      case 'close' :
        self.destroy();
      break;
    }

  };

  /**
   * Open given file
   */
  DefaultApplication.prototype._doOpen = function(file, data, sendArgs) {
    this._setCurrentFile(file);
    this.onOpen(file, data, sendArgs);
    if ( this.mainWindow ) {
      this.mainWindow._toggleLoading(false);
    }
  };

  /**
   * Save to given file
   */
  DefaultApplication.prototype._doSave = function(file) {
    var self = this;

    if ( !file ) {
      throw new Error('cannot save without File ref');
    }
    if ( !file.path ) {
      throw new Error('cannot save without a path');
    }

    if ( this.dialogOptions.filetypes !== null ) {
      var filetypes = this.dialogOptions.filetypes;
      if ( filetypes ) {
        var ext = Utils.filext(file.path).toLowerCase();
        if ( filetypes[ext] ) {
          file.mime = filetypes[ext];
        } else {
          var first = null;
          Object.keys(filetypes).forEach(function(t) {
            first = t;
            return false;
          });

          if ( first ) {
            var newname = Utils.replaceFileExtension(file.path, first);
            file.path = newname;
            file.filename = Utils.filename(newname);

            var msg = Utils.format('The filetype "{0}" is not supported, using "{1}" instead.', ext, first);
            this._createDialog('Alert', [msg, null, {title: OSjs.API._('MSG_APPLICATION_WARNING')}]);
          }
        }
      }
    }

    function _onSaveFinished(item) {
      self.onSave(item);
      self.mainWindow._toggleLoading(false);
      self._setCurrentFile(item);
    }

    function _onSaveRequest(error, result, item) {
      if ( error ) {
        self._onError(OSjs.API._('ERR_FILE_APP_SAVE_ALT_FMT', item.path), error, 'doSave');
        return;
      }
      if ( result === false ) {
        self._onError(OSjs.API._('ERR_FILE_APP_SAVE_ALT_FMT', item.path), OSjs.API._('Unknown error'), 'doSave');
        return;
      }
      _onSaveFinished(item);
    }

    if ( !file.mime && this.dialogOptions.defaultMime ) {
      file.mime = this.dialogOptions.defaultMime;
    }

    this.onGetSaveData(function(data) {
      self.mainWindow._toggleLoading(true);
      var item = new VFS.File(file);
      var options = {dataSource: self.onCheckDataSource(file)};

      if ( self.dialogOptions.upload ) {
        VFS.upload({
          destination: OSjs.Utils.dirname(item.path),
          files: [data]
        }, function(error, result) {
          _onSaveRequest(error, result, item);
        });
      } else {
        VFS.write(item, data, function(error, result) {
          _onSaveRequest(error, result, item);
        }, options, self);
      }
    }, file);
  };

  /**
   * File operation error
   */
  DefaultApplication.prototype._onError = function(title, message, action) {
    action = action || 'unknown';

    if ( action !== 'doSave' ) {
      this._setCurrentFile(null);
    }

    if ( !this.onError(title, message, action) ) {
      var t = OSjs.API._('ERR_GENERIC_APP_FMT', this.__label);
      if ( this.mainWindow ) {
        //this.mainWindow._error(OSjs.API._('ERR_GENERIC_APP_FMT', this.__label), OSjs.API._('ERR_GENERIC_APP_ACTION_FMT', action), error);
        this.mainWindow._error(t, title, message);
        this.mainWindow._toggleDisabled(false);
        this.mainWindow._toggleLoading(false);
      } else {
        //OSjs.API.error(OSjs.API._('ERR_GENERIC_APP_FMT', this.__label), OSjs.API._('ERR_GENERIC_APP_ACTION_FMT', action), error);
        OSjs.API.error(t, title, message);
      }
    }
  };

  /**
   * Wrapper for save action
   */
  DefaultApplication.prototype._onSave = function(file) {
    if ( !file && this.currentFile && this.currentFile.path) {
      file = new VFS.File(this.currentFile);
    }
    if ( !file ) {
      file = new VFS.File(
        '/' + this.dialogOptions.defaultFilename, // FIXME
        this.dialogOptions.defaultMime
      );
    }
    if ( !file.path && this.currentFile && this.currentFile.path ) {
      file.path = this.currentFile.path;
    }
    if ( !file.mime && this.currentFile && this.currentFile.mime ) {
      file.mime = this.currentFile.mime;
    }

    this._doSave(file);
  };

  /**
   * Wrapper for save as action
   */
  DefaultApplication.prototype._onSaveAs = function(callback) {
    var self = this;
    if ( this.mainWindow ) {
      var fn       = '/' + this.dialogOptions.defaultFilename; // FIXME
      var mime     = this.dialogOptions.defaumtMime;
      var opt      = Utils.cloneObject(this.dialogOptions);
      opt.type     =  'save';
      opt.path     = Utils.dirname(fn);
      opt.filename = Utils.filename(fn);

      if ( this.currentFile && this.currentFile.mime ) {
        mime = this.currentFile.mime;
      }
      var currentPath = this.currentFile ? this.currentFile.path : '';
      if ( !currentPath.match(/^\//) && !currentPath.match(/^([A-z0-9\-_]+)\:\/\//) ) {
        currentPath = OSjs.API.getDefaultPath('/') + currentPath;
      }

      if ( currentPath ) {
        opt.path = Utils.dirname(currentPath);
        opt.filename = Utils.filename(currentPath);
      }

      this.mainWindow._toggleDisabled(true);
      this._createDialog('File', [opt, function(btn, item) {
        if ( self.mainWindow ) {
          self.mainWindow._toggleDisabled(false);
        }
        if ( btn !== 'ok' ) { return; }
        if ( !item.mime ) { item.mime = mime; }

        if ( callback ) {
          callback(item);
        } else {
          self._doSave(item);
        }
      }], this.mainWindow);
    }
  };

  /**
   * Wrapper for open action
   */
  DefaultApplication.prototype._onOpen = function(file, sendArgs) {
    var self = this;

    var opt = Utils.cloneObject(this.dialogOptions);
    opt.type =  'open';

    function _openFile(item) {
      if ( !Utils.checkAcceptMime(item.mime, opt.mimes) ) {
        OSjs.API.error(self.__label, OSjs.API._('ERR_FILE_APP_OPEN'), OSjs.API._('ERR_FILE_APP_OPEN_FMT', item.path, item.mime));
        return;
      }

      var ext = Utils.filext(item.path).toLowerCase();

      if ( self.mainWindow ) {
        self.mainWindow._toggleLoading(true);
      }
      if ( !opt.read ) {
        self._doOpen(item, null, sendArgs);
        return;
      }

      VFS.read(item, function(error, result) {
        if ( error ) {
          self._onError(OSjs.API._('ERR_FILE_APP_OPEN_ALT_FMT', item.path), error, 'onOpen');
          return;
        }
        if ( result === false ) {
          self._onError(OSjs.API._('ERR_FILE_APP_OPEN_ALT_FMT', item.path), OSjs.API._('Unknown error'), 'onOpen');
          return;
        }
        self._doOpen(item, result, sendArgs);
      }, {dataSource: self.onCheckDataSource(item)});
    }

    if ( file && file.path ) {
      _openFile(file);
    } else {
      opt.path = (this.currentFile && this.currentFile.path) ? Utils.dirname(this.currentFile.path) : null;

      this.mainWindow._toggleDisabled(true);

      this._createDialog('File', [opt, function(btn, item) {
        if ( self.mainWindow ) {
          self.mainWindow._toggleDisabled(false);
        }

        if ( btn !== 'ok' ) { return; }
        _openFile(item);
      }], this.mainWindow);
    }
  };

  /**
   * Wrapper for new action
   */
  DefaultApplication.prototype._onNew = function() {
    this._setCurrentFile(null);
    this.onNew();
  };

  /**
   * Sets current active file
   */
  DefaultApplication.prototype._setCurrentFile = function(file) {
    this.currentFile = file || null;
    var data = file;
    if ( data instanceof VFS.File ) {
      data = this.currentFile.getData();
    }
    this._setArgument('file', data);
  };


  //
  // EXPORTS
  //
  OSjs.Helpers.DefaultApplication       = DefaultApplication;
  OSjs.Helpers.DefaultApplicationWindow = DefaultApplicationWindow;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS);

