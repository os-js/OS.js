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

(function() {

  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};

  var Application = OSjs.Core.Application;
  var Window      = OSjs.Core.Window;

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
        this._appRef.defaultAction('open', data.path, data.mime);
      }
    }
  };

  /**
   * Display confirmation dialog of out file has changed
   * Prevent closing of window
   */
  DefaultApplicationWindow.prototype._close = function() {
    var self = this;
    var callback = function() {
      self._close();
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
   * This class is a basic implementation of OSjs.Core.Application
   * with support for creating/opening/saving files.
   *
   * You should use this if your application handles files.
   *
   * To do so change your wrapper (located in bottom of your application script)
   * from:  })(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs);
   * to:    })(OSjs.Helpers.DefaultApplication, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs);
   *
   * For example implementation see the 'Texpad' application
   */
  var DefaultApplication = function() {
    Application.apply(this, arguments);

    this.currentFile          = {path: null, mime: null};

    //
    // User-defineable variables. Put these in your class
    //
    this.defaultFilename      = "New file";                         // Default filename used in Save dialog
    this.defaultMime          = null;                               // Default mime for files (can leave blank)
    this.acceptMime           = null;                               // Array of mime types to accept (can be blank, or filled with RegExp strings)
    this.defaultActionError   = function() {};                      // Callback on action error
    this.defaultActionSuccess = function() {};                      // Callback on action success
    this.defaultActionWindow  = null;                               // Name of your "main window" in application
    this.allowedActions       = ['new', 'open', 'save', 'saveas'];  // Array of actions this application uses
    this.openAction           = 'raw';                              // 'raw' for getting file contents, 'filename' to just handle filenames
    this.getSaveData          = function() { return null; };        // Callback for getting what file-data to save
  };

  DefaultApplication.prototype = Object.create(Application.prototype);

  /**
   * Set current file to application storage.
   * This makes sure session restore works properly
   */
  DefaultApplication.prototype.setCurrentFile = function(filename, mime) {
    this.currentFile.path = filename || null;
    this.currentFile.mime = mime     || null;

    this._setArgument('file', this.currentFile.path);
    this._setArgument('mime', this.currentFile.mime);
  };

  DefaultApplication.prototype.init = function(core, settings) {
    Application.prototype.init.apply(this, arguments);

    // Get launch/restore argument(s)
    var filename = this._getArgument('file');
    var mime     = this._getArgument('mime');

    if ( filename ) {
      this.defaultAction('open', filename, mime);
    }
  };

  DefaultApplication.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    // Make sure we destroy our application when main window closes
    if ( this.defaultActionWindow ) {
      if ( msg == 'destroyWindow' && obj._name === this.defaultActionWindow ) {
        this.destroy();
      }
    }
  };

  /**
   * Display confirmation dialog
   * Used to prevent accidental removal of changes in file(s)
   */
  DefaultApplication.prototype.defaultConfirmClose = function(win, msg, callback) {
    msg = msg || 'Quit without saving?';
    win._toggleDisabled(true);
    this._createDialog('Confirm', [msg, function(btn) {
      win._toggleDisabled(false);
      if ( btn == "ok" ) {
        callback();
      }
    }]);
    return true;
  };

  /**
   * Perform default file handling action
   *
   * Actions: new, open, save, saveas
   *
   * To show the dialog for 'open' action ignore the filename argument.
   */
  DefaultApplication.prototype.defaultAction = function(action, filename, mime) {
    var self = this;
    var win  = this.defaultActionWindow ? this._getWindow(this.defaultActionWindow) : null;

    if ( !action ) { throw "Action was expected..."; }
    if ( action && !OSjs.Utils.inArray(this.allowedActions, action) ) {
      throw "Unsupported action given: " + action;
    }

    var _onError = function(act, error) {
      self.defaultActionError(act, error);
    };

    var _newFile = function() {
      self.setCurrentFile(null, null);
      self.defaultActionSuccess('new', self.currentFile);
    };

    var _openFile = function(fname, fmime) {
      fmime = fmime || mime;

      // Check if our application accepts this MIME type
      if ( fmime && (self.acceptMime !== null) ) {
        var found = false;
        for ( var i = 0; i < self.acceptMime.length; i++ ) {
          if ( (new RegExp(self.acceptMime[i])).test(fmime) !== false ) {
            found = self.acceptMime[i];
            break;
          }
        }

        if ( !found ) {
          _onError('open', OSjs._("The requested file MIME '{0}' is not accepted by this application.", fmime || 'unknown'));
          return;
        }
      }

      if ( self.openAction === 'filename' ) {
        self.setCurrentFile(fname, fmime);
        self.defaultActionSuccess('open', self.currentFile);
        return;
      }

      // Read file from server
      OSjs.API.call('fs', {'method': 'file_get_contents', 'arguments': [fname]}, function(res) {
        if ( res && (res.result !== false) ) {
          self.setCurrentFile(fname, fmime);
          self.defaultActionSuccess('open', res.result, self.currentFile);
          return;
        }

        _onError('open', (res && res.error) ? res.error : OSjs._('Fatal error on open file!'));
      }, function(error) {
        _onError('open', OSjs._("Failed to open file: {0}", fname), error);
      });
    };

    var _saveFile = function(fname, fmime) {
      fmime = fmime || mime;
      var fdata = self.getSaveData();

      // Write file to server
      OSjs.API.call('fs', {'method': 'file_put_contents', 'arguments': [fname, fdata]}, function(res) {
        if ( res && res.result !== false ) {
          self.setCurrentFile(fname, fmime);
          self.defaultActionSuccess('save', self.currentFile);

          OSjs.API.getCoreInstance().message('vfs', {type: 'write', path: OSjs.Utils.dirname(fname), filename: OSjs.Utils.filename(fname), source: self.__pid});
          return;
        }

        _onError('save', (res && res.error) ? res.error : OSjs._('Fatal error on save file!'));
      }, function(error) {
        _onError('save', OSjs._("Failed to save file: {0}", fname), error);
      });
    };

    var currentPath = this.currentFile.path ? OSjs.Utils.dirname(this.currentFile.path) : null;
    var currentFile = this.currentFile.path ? OSjs.Utils.filename(this.currentFile.path) : null;

    switch ( action ) {
      case 'new' :
        _newFile();
      break;

      case 'open' :
        if ( filename ) {
          _openFile(filename, mime);
        } else {
          if ( !win ) { throw "Cannot show a dialog without assigned Window"; }
          win._toggleDisabled(true);

          this._createDialog('File', [{type: 'open', mime: this.defaultMime, mimes: this.acceptMime, path: currentPath}, function(btn, fname, fmime) {
            win._toggleDisabled(false);

            if ( btn !== 'ok' ) { return; }
            _openFile(fname, fmime);
          }], win);
        }
      break;

      case 'save' :
        if ( this.currentFile.path ) {
          _saveFile(this.currentFile.path, this.currentFile.mime);
        }
      break;

      case 'saveas' :
        if ( !win ) { throw "Cannot show a dialog without assigned Window"; }
        win._toggleDisabled(true);

        this._createDialog('File', [{type: 'save', path: currentPath, filename: currentFile, mime: this.defaultMime, mimes: this.acceptMime, defaultFilename: this.defaultFilename}, function(btn, fname, fmime) {
          win._toggleDisabled(false);

          if ( btn !== 'ok' ) { return; }
          _saveFile(fname, fmime);
        }], win);
      break;

      default :
        throw "Invalid action: " + action;
      break;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // SETTINGS MANAGER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Settings Manager
   */
  function SettingsManager(defaults, defaultMerge) {
    this.defaults = {};
    this.settings = {};
    this.defaultMerge = (typeof defaultMerge === 'undefined' || defaultMerge === true);

    this.load(defaults);
  }

  SettingsManager.prototype.load = function(obj) {
    this.defaults = {};
    this.settings = {};

    if ( obj ) {
      this.defaults = JSON.parse(JSON.stringify(obj));
      this.reset();
    }
  };

  SettingsManager.prototype.reset = function() {
    this.settings = JSON.parse(JSON.stringify(this.defaults));
  };

  SettingsManager.prototype.set = function(category, name, value, merge) {
    if ( !name ) {
      return this.setCategory(category, value, merge);
    }
    return this.setCategoryItem(category, name, value, merge);
  };

  SettingsManager.prototype.get = function(category, name, defaultValue) {
    if ( !category ) {
      return this.settings;
    }
    if ( !name ) {
      return this.getCategory(category, defaultValue);
    }
    return this.getCategoryItem(category, name, defaultValue);
  };

  SettingsManager.prototype._mergeSettings = function(obj1, obj2) {
    if ( ((typeof obj2) !== (typeof obj1)) && (!obj2 && obj1) ) {
      return obj1;
    }
    if ( (typeof obj2) !== (typeof obj1) ) {
      return obj2;
    }
    return OSjs.Utils.mergeObject(obj1, obj2);
  };

  SettingsManager.prototype.setCategory = function(category, value, merge) {
    console.debug("SettingsManager::setCategory()", category, value);
    if ( typeof merge === 'undefined' ) { merge = this.defaultMerge; }

    if ( merge ) {
      this.settings[category] = this._mergeSettings(this.settings[category], value);
    } else {
      this.settings[category] = value;
    }
  };

  SettingsManager.prototype.setCategoryItem = function(category, name, value, merge) {
    console.debug("SettingsManager::setCategoryItem()", category, name, value);
    if ( typeof merge === 'undefined' ) { merge = this.defaultMerge; }

    if ( !this.settings[category] ) {
      this.settings[category] = {};
    }

    if ( merge ) {
      this.settings[category][name] = this._mergeSettings(this.settings[category][name], value);
    } else {
      this.settings[category][name] = value;
    }
  };

  SettingsManager.prototype.getCategory = function(category, defaultValue) {
    if ( typeof this.settings[category] !== 'undefined' ) {
      return this.settings[category];
    }
    return defaultValue;
  };

  SettingsManager.prototype.getCategoryItem = function(category, name, defaultValue) {
    if ( typeof this.settings[category] !== 'undefined' ) {
      if ( typeof this.settings[category][name] !== 'undefined' ) {
        return this.settings[category][name];
      }
    }
    return defaultValue;
  };

  /////////////////////////////////////////////////////////////////////////////
  // MISC FUNCTIONS
  /////////////////////////////////////////////////////////////////////////////

  function UploadFiles(app, win, dest, files, onUploaded) {
    files = files || [];
    onUploaded = onUploaded || function(dest, filename, mime, size) {};

    var _dialogClose  = function(btn, filename, mime, size) {
      if ( btn != 'ok' && btn != 'complete' ) return;

      OSjs.API.getCoreInstance().message('vfs', {type: 'upload', path: dest, filename: filename, source: app.__pid});

      onUploaded(dest, filename, mime, size);
    };

    if ( files && files.length ) {
      for ( var i = 0; i < files.length; i++ ) {
        if ( win ) {
          app._createDialog('FileUpload', [dest, files[i], _dialogClose], win);
        } else {
          app.addWindow(new OSjs.Dialogs.FileUpload(dest, files[i], _dialogClose), false);
        }
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.DefaultApplication       = DefaultApplication;
  OSjs.Helpers.DefaultApplicationWindow = DefaultApplicationWindow;
  OSjs.Helpers.SettingsManager          = SettingsManager;
  OSjs.Helpers.UploadFiles              = UploadFiles;

})();

