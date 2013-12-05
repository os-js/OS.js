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

  /////////////////////////////////////////////////////////////////////////////
  // Default Application Helper
  /////////////////////////////////////////////////////////////////////////////

  var Application = OSjs.Core.Application;

  var DefaultApplication = function() {
    Application.apply(this, arguments);

    this.currentFile          = {path: null, mime: null};
    this.defaultFilename      = "New file";
    this.defaultMime          = null;
    this.acceptMime           = null;
    this.defaultActionError   = function() {};
    this.defaultActionSuccess = function() {};
    this.defaultActionWindow  = null;
    this.allowedActions       = ['new', 'open', 'save', 'saveas'];
    this.openAction           = 'raw';
    this.getSaveData          = function() { return null; };
  };

  DefaultApplication.prototype = Object.create(Application.prototype);

  DefaultApplication.prototype.setCurrentFile = function(filename, mime) {
    this.currentFile.path = filename || null;
    this.currentFile.mime = mime     || null;

    this._setArgument('file', this.currentFile.path);
    this._setArgument('mime', this.currentFile.mime);
  };

  DefaultApplication.prototype.init = function(core, session) {
    Application.prototype.init.apply(this, arguments);

    var filename = this._getArgument('file');
    var mime     = this._getArgument('mime');

    if ( filename ) {
      this.defaultAction('open', filename, mime);
    }
  };

  DefaultApplication.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);
    if ( this.defaultActionWindow ) {
      if ( msg == 'destroyWindow' && obj._name === this.defaultActionWindow ) {
        this.destroy();
      }
    }
  };

  DefaultApplication.prototype.defaultAction = function(action, filename, mime) {
    var self = this;

    if ( !action ) throw "Action was expected...";
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
      if ( fmime && (self.acceptMime !== null) ) {
        var found = false;
        for ( var i = 0; i < self.acceptMime.length; i++ ) {
          if ( (new RegExp(self.acceptMime[i])).test(fmime) !== false ) {
            found = true;
            break;
          }
        }
        if ( !found ) {
          _onError('open', "The requested file MIME is not accepted by this application.");
          return;
        }
      }

      if ( self.openAction === 'filename' ) {
        self.setCurrentFile(fname, fmime);
        self.defaultActionSuccess('open', self.currentFile);
        return;
      }

      OSjs.API.call('fs', {'method': 'file_get_contents', 'arguments': [fname]}, function(res) {
        if ( res && res.result ) {
          self.setCurrentFile(fname, fmime);
          self.defaultActionSuccess('open', res.result, self.currentFile);
          return;
        }

        _onError('open', (res && res.error) ? res.error : 'Fatal error on open file!');
      }, function(error) {
        _onError('open', "Failed to open file (call): " + fname, error);
      });
    };

    var _saveFile = function(fname, fmime) {
      fmime = fmime || mime;
      var fdata = self.getSaveData();
      OSjs.API.call('fs', {'method': 'file_put_contents', 'arguments': [fname, fdata]}, function(res) {
        if ( res && res.result ) {
          self.setCurrentFile(fname, fmime);
          self.defaultActionSuccess('save', self.currentFile);

          OSjs.API.getCoreInstance().message('vfs', {type: 'write', path: OSjs.Utils.dirname(fname), filename: OSjs.Utils.filename(fname), source: self.__pid});
          return;
        }

        _onError('save', (res && res.error) ? res.error : 'Fatal error on save file!');
      }, function(error) {
        _onError('save', "Failed to save file (call): " + fname, error);
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
          if ( !this.defaultActionWindow ) throw "Cannot show a dialog without assigned Window";
          this._createDialog('File', [{type: 'open', mime: this.defaultMime, mimes: this.acceptMime, path: currentPath}, function(btn, fname, fmime) {
            if ( btn !== 'ok' ) return;
            _openFile(fname, fmime);
          }], this._getWindow(this.defaultActionWindow));
        }
      break;

      case 'save' :
        if ( this.currentFile.path ) {
          _saveFile(this.currentFile.path, this.currentFile.mime);
        }
      break;

      case 'saveas' :
        if ( !this.defaultActionWindow ) throw "Cannot show a dialog without assigned Window";
        this._createDialog('File', [{type: 'save', path: currentPath, filename: currentFile, mime: this.defaultMime, mimes: this.acceptMime, defaultFilename: this.defaultFilename}, function(btn, fname, fmime) {
          if ( btn !== 'ok' ) return;
          _saveFile(fname, fmime);
        }], this._getWindow(this.defaultActionWindow));
      break;

      default :
        throw "Invalid action: " + action;
      break;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.DefaultApplication = DefaultApplication;
})();

