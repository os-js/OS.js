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

(function(Application, Window, Utils) {
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
        this._appRef.action('open', data.path, data.mime);
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
    this.currentFilename     = null;
    this.currentMime         = null;
    this.mainWindow          = null;
    this.defaultCheckChange  = false;
    this.dialogOptions       = {
      read: true,           // Read file data

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
    this.currentFilename = this._getArgument('file');
    this.currentMime     = this._getArgument('mime');
    if ( this.currentFilename ) {
      this.action('open', this.currentFilename, this.currentMime);
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
      }
    }
  };

  DefaultApplication.prototype.onNew = function() {
    // IMPLEMENT THIS IN YOUR CLASS
  };

  DefaultApplication.prototype.onOpen = function(filename, mime, data) {
    // IMPLEMENT THIS IN YOUR CLASS
  };

  DefaultApplication.prototype.onSave = function(filename, mime, data) {
    // IMPLEMENT THIS IN YOUR CLASS
  };

  DefaultApplication.prototype.onGetSaveData = function(callback, filename, mime) {
    // IMPLEMENT THIS IN YOUR CLASS
    callback(null);
  };

  DefaultApplication.prototype.onCheckChanged = function(callback) {
    function _cb(discard) {
      self.mainWindow._focus();

      callback(discard);
    }

    if ( this.defaultCheckChange ) {
      var self = this;

      var msg = OSjs._('MSG_GENERIC_APP_DISCARD');
      if ( this.mainWindow ) {
        if ( this.mainWindow.checkChanged(function(discard) { _cb(discard); }, msg) === false ) {
          _cb(true);
        }
      }
    } else {
      callback(true); // discard true/false
    }
  };

  DefaultApplication.prototype.onCheckDataSource = function(filename, mime) {
    return false;
  };

  /**
   * Confirmation dialog creator
   */
  DefaultApplication.prototype.onConfirmDialog = function(win, msg, callback) {
    msg = msg || OSjs._('Discard changes?');
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
  DefaultApplication.prototype.action = function(action, filename, mime) {
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
            self._onOpen(filename, mime);
          }
        });
      break;

      case 'save' :
        self._onSave(filename, mime);
      break;

      case 'saveas' :
        self._onSaveAs(filename, mime);
      break;

      case 'close' :
        self.destroy();
      break;
    }

  };

  /**
   * Open given file
   */
  DefaultApplication.prototype._doOpen = function(filename, mime, data) {
    this._setCurrentFile(filename, mime);

    this.onOpen(filename, mime, data);

    if ( this.mainWindow ) {
      this.mainWindow._toggleLoading(false);
    }
  };

  /**
   * Save to given file
   */
  DefaultApplication.prototype._doSave = function(filename, mime) {
    var self = this;
    var ext = OSjs.Utils.filext(filename).toLowerCase();

    if ( !mime && this.currentMime ) {
      mime = this.currentMime;
    }

    if ( this.dialogOptions.filetypes !== null ) {
      var filetypes = this.dialogOptions.filetypes;
      if ( filetypes ) {
        if ( filetypes[ext] ) {
          mime = filetypes[ext];
        } else {
          return;
        }
      }
    }

    function _onSaveFinished(name) {
      self.onSave(name, mime);
      self.mainWindow._toggleLoading(false);
      self._setCurrentFile(name, mime);

      OSjs.API.message('vfs', {type: 'write', path: OSjs.Utils.dirname(name), filename: OSjs.Utils.filename(name), source: self.__pid});
    }


    this.onGetSaveData(function(data) {
      self.mainWindow._toggleLoading(true);
      var wopts = [filename, data];
      var dataSource = self.onCheckDataSource(filename, mime);
      if ( dataSource !== false ) {
        wopts.push({dataSource: dataSource});
      }

      OSjs.API.call('fs', {'method': 'write', 'arguments': wopts}, function(res) {
        if ( res && res.result ) {
          _onSaveFinished(filename);
        } else {
          if ( res && res.error ) {
            self._onError(OSjs._('ERR_FILE_APP_SAVE_ALT_FMT', filename), res.error, 'doSave');
            return;
          }
          self._onError(OSjs._('ERR_FILE_APP_SAVE_ALT_FMT', filename), OSjs._('Unknown error'), 'doSave');
        }
      }, function(error) {
        self._onError(OSjs._('ERR_FILE_APP_SAVE_ALT_FMT', filename), error, 'doSave');
      });
    }, filename, mime);
  };

  /**
   * File operation error
   */
  DefaultApplication.prototype._onError = function(title, message, action) {
    action = action || 'unknown';

    this._setCurrentFile(null, null);

    if ( !this.onError(title, message, action) ) {
      var t = OSjs._('ERR_GENERIC_APP_FMT', this.__label);
      if ( this.mainWindow ) {
        //this.mainWindow._error(OSjs._('ERR_GENERIC_APP_FMT', this.__label), OSjs._('ERR_GENERIC_APP_ACTION_FMT', action), error);
        this.mainWindow._error(t, title, message);
        this.mainWindow._toggleDisabled(false);
        this.mainWindow._toggleLoading(false);
      } else {
        //OSjs.API.error(OSjs._('ERR_GENERIC_APP_FMT', this.__label), OSjs._('ERR_GENERIC_APP_ACTION_FMT', action), error);
        OSjs.API.error(t, title, message);
      }
    }
  };

  /**
   * Wrapper for save action
   */
  DefaultApplication.prototype._onSave = function(filename, mime) {
    filename = filename || this.currentFilename;
    mime = mime || this.currentMime;

    if ( filename ) {
      this._doSave(filename, mime);
    }
  };

  /**
   * Wrapper for save as action
   */
  DefaultApplication.prototype._onSaveAs = function(filename, mime) {
    var self = this;
    filename = filename || this.currentFilename;
    mime = mime || this.currentMime;

    var dir = filename ? Utils.dirname(filename) : null;
    var fnm = filename ? Utils.filename(filename) : null;


    if ( this.mainWindow ) {
      this.mainWindow._toggleDisabled(true);
      var opt = Utils.cloneObject(this.dialogOptions);
      opt.type =  'save';
      opt.path = dir;
      opt.filename = fnm;

      this._createDialog('File', [opt, function(btn, fname, fmime) {
        if ( self.mainWindow ) {
          self.mainWindow._toggleDisabled(false);
        }
        if ( btn !== 'ok' ) { return; }
        self._doSave(fname, fmime);
      }], this.mainWindow);
    }
  };

  /**
   * Wrapper for open action
   */
  DefaultApplication.prototype._onOpen = function(filename, mime) {
    var self = this;

    var opt = Utils.cloneObject(this.dialogOptions);
    opt.type =  'open';

    function _openFile(fname, fmime) {
      if ( !Utils.checkAcceptMime(fmime, opt.mimes) ) {
        OSjs.API.error(self.__label, OSjs._('ERR_FILE_APP_OPEN'), OSjs._('ERR_FILE_APP_OPEN_FMT', filename, mime));
        return;
      }

      var ext = OSjs.Utils.filext(fname).toLowerCase();

      if ( self.mainWindow ) {
        self.mainWindow._toggleLoading(true);
      }
      if ( !opt.read ) {
        self._doOpen(fname, fmime, null);
        return;
      }

      var ropts = [fname];
      var dataSource = self.onCheckDataSource(fname, fmime);
      if ( dataSource !== false ) {
        ropts.push({dataSource: dataSource});
      }

      OSjs.API.call('fs', {'method': 'read', 'arguments': ropts}, function(res) {
        if ( res && res.result ) {
          self._doOpen(fname, fmime, res.result);
        } else {
          if ( res && res.error ) {
            self._onError(OSjs._('ERR_FILE_APP_OPEN_ALT_FMT', fname), res.error, 'onOpen');
            return;
          }
          self._onError(OSjs._('ERR_FILE_APP_OPEN_ALT_FMT', fname), OSjs._('Unknown error'), 'onOpen');
        }
      }, function(error) {
        self._onError(OSjs._('ERR_FILE_APP_OPEN_ALT_FMT', fname), error, 'onOpen');
      });
    }

    if ( filename ) {
      _openFile(filename, mime);
    } else {
      opt.path = (this.currentFilename) ? Utils.dirname(this.currentFilename) : null;

      this.mainWindow._toggleDisabled(true);

      this._createDialog('File', [opt, function(btn, fname, fmime) {
        if ( self.mainWindow ) {
          self.mainWindow._toggleDisabled(false);
        }

        if ( btn !== 'ok' ) { return; }
        _openFile(fname, fmime);
      }], this.mainWindow);
    }
  };

  /**
   * Wrapper for new action
   */
  DefaultApplication.prototype._onNew = function() {
    this._setCurrentFile(null, null);
    this.onNew();
  };

  /**
   * Sets current active file
   */
  DefaultApplication.prototype._setCurrentFile = function(name, mime) {
    this.currentFilename = name;
    this.currentMime = mime || null;
    this._setArgument('file', name);
    this._setArgument('mime', mime || null);
  };

  //
  // EXPORTS
  //
  OSjs.Helpers.DefaultApplication       = DefaultApplication;
  OSjs.Helpers.DefaultApplicationWindow = DefaultApplicationWindow;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils);

