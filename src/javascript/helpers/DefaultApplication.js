"use strict";
/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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

  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};

  function checkAcceptMime(mime, list) {
    if ( mime && list.length ) {
      var re;
      for ( var i = 0; i < list.length; i++ ) {
        re = new RegExp(list[i]);
        if ( re.test(mime) ) {
          return true;
        }
      }
    }
    return false;
  }

  function cloneObject(o) {
    return JSON.parse(JSON.stringify(o));
  }

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
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) return;

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
    var callback = function(discard) {
      if ( discard ) {
        self._close();
      }
    };

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
    this.currentFilename = null;
    this.mainWindow      = null;

    this.dialogOptions   = {
      read: true,           // Read file data

      // These are passed on to Dialog
      mime: null,
      mimes: [],
      select: "file",
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
  DefaultApplication.prototype.init = function(core, settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    // Get launch/restore argument(s)
    this.currentFilename = this._getArgument('file');
    if ( this.currentFilename ) {
      this.action('open', this.currentFilename, this._getArgument('mime'));
    }
  };

  /**
   * Default Messaging handler
   */
  DefaultApplication.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    // Make sure we kill our application if main window was closed
    if ( this.mainWindow ) {
      if ( msg == 'destroyWindow' && obj._name === this.mainWindow._name ) {
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

  DefaultApplication.prototype.onGetSaveData = function(callback) {
    // IMPLEMENT THIS IN YOUR CLASS
    callback(null);
  };

  DefaultApplication.prototype.onCheckChanged = function(callback) {
    // IMPLEMENT THIS IN YOUR CLASS
    callback(true); // discard true/false
  };

  /**
   * Confirmation dialog creator
   */
  DefaultApplication.prototype.onConfirmDialog = function(win, msg, callback) {
    msg = msg || 'Discard changes?';
    win._toggleDisabled(true);
    this._createDialog('Confirm', [msg, function(btn) {
      win._toggleDisabled(false);
      callback(btn == "ok");
    }]);
    return true;
  };

  /**
   * Default Error Handler
   */
  DefaultApplication.prototype.onError = function(error, action) {
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

    var _onSaveFinished = function(name) {
      self._setCurrentFile(name, mime);
      OSjs.API.getCoreInstance().message('vfs', {type: 'write', path: OSjs.Utils.dirname(name), filename: OSjs.Utils.filename(name), source: self.__pid});
      self.onSave(filename, mime);
      self.mainWindow._toggleLoading(false);
    };


    this.onGetSaveData(function(data) {
      self.mainWindow._toggleLoading(true);
      OSjs.API.call('fs', {'method': 'write', 'arguments': [filename, data]}, function(res) {
        if ( res && res.result ) {
          _onSaveFinished(filename);
        } else {
          if ( res && res.error ) {
            self._onError(OSjs._("Failed to save file: {0}", filename), res.error, "doSave");
            return;
          }
          self._onError(OSjs._("Failed to save file: {0}", filename), OSjs._("Unknown error"), "doSave");
        }
      }, function(error) {
        self._onError(OSjs._("Failed to save file (call): {0}", filename), error, "doSave");
      });
    });
  };

  /**
   * File operation error
   */
  DefaultApplication.prototype._onError = function(error, action) {
    action || "unknown";

    this._setCurrentFile(null, null);

    if ( !this.onError(error, action) ) {
      if ( this.mainWindow ) {
        this.mainWindow._error(OSjs._("{0} Application Error", this.__label), OSjs._("Failed to perform action '{0}'", action), error);
        this.mainWindow._toggleDisabled(false);
        this.mainWindow._toggleLoading(false);
      } else {
        OSjs.API.error(OSjs._("{0} Application Error", this.__label), OSjs._("Failed to perform action '{0}'", action), error);
      }
    }
  };

  /**
   * Wrapper for save action
   */
  DefaultApplication.prototype._onSave = function(filename, mime) {
    if ( this.currentFilename ) {
      this._doSave(this.currentFilename, mime);
    }
  };

  /**
   * Wrapper for save as action
   */
  DefaultApplication.prototype._onSaveAs = function(filename, mime) {
    var self = this;
    var dir = this.currentFilename ? Utils.dirname(this.currentFilename) : null;
    var fnm = this.currentFilename ? Utils.filename(this.currentFilename) : null;

    if ( this.mainWindow ) {
      this.mainWindow._toggleDisabled(true);
      var opt = cloneObject(this.dialogOptions);
      opt.type =  "save";
      opt.path = dir;
      opt.filename = fnm;

      this._createDialog('File', [opt, function(btn, fname) {
        if ( self.mainWindow ) {
          self.mainWindow._toggleDisabled(false);
        }
        if ( btn !== 'ok' ) return;
        self._doSave(fname, mime);
      }], this.mainWindow);
    }
  };

  /**
   * Wrapper for open action
   */
  DefaultApplication.prototype._onOpen = function(filename, mime) {
    var self = this;

    var opt = cloneObject(this.dialogOptions);
    opt.type =  "open";

    var _openFile = function(fname, fmime) {
      if ( !checkAcceptMime(fmime, opt.mimes) ) {
        OSjs.API.error(self.__label, OSjs._("Cannot open file"), OSjs._("Not supported!"));
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

      OSjs.API.call('fs', {'method': 'read', 'arguments': [fname]}, function(res) {
        if ( res && res.result ) {
          self._doOpen(fname, fmime, res.result);
        } else {
          if ( res && res.error ) {
            self._onError(OSjs._("Failed to open file: {0}", fname), res.error, "onOpen");
            return;
          }
          self._onError(OSjs._("Failed to open file: {0}", fname), OSjs._("Unknown error"), "onOpen");
        }
      }, function(error) {
        self._onError(OSjs._("Failed to open file (call): {0}", fname), error, "onOpen");
      });
    };

    if ( filename ) {
      _openFile(filename, mime);
    } else {
      opt.path = (this.currentFilename) ? Utils.dirname(this.currentFilename) : null;

      this.mainWindow._toggleDisabled(true);

      this._createDialog('File', [opt, function(btn, fname, fmime) {
        if ( self.mainWindow ) {
          self.mainWindow._toggleDisabled(false);
        }

        if ( btn !== 'ok' ) return;
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
    this._setArgument('file', name);
    this._setArgument('mime', mime || null);
  };

  //
  // EXPORTS
  //
  OSjs.Helpers.DefaultApplication       = DefaultApplication;
  OSjs.Helpers.DefaultApplicationWindow = DefaultApplicationWindow;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils)

