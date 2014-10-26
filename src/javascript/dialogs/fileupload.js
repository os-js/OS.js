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
(function(StandardDialog) {
  'use strict';

  var _ID = 0;

  /**
   * File Upload Dialog
   */
  var FileUploadDialog = function(dest, file, onClose) {
    this.dest             = dest;
    this.file             = file || null;
    this.$file            = null;
    this.dialog           = null;
    this._wmref           = null;
    this.notificationId   = 'FileUploadDialog_' + _ID;

    this.uploadName = null;
    this.uploadSize = null;
    this.uploadMime = null;

    var maxSize = OSjs.API.getHandlerInstance().getConfig('Core').MaxUploadSize;
    var msg = OSjs.API._('Upload file to <span>{0}</span>.<br />Maximum size: {1} bytes', this.dest, maxSize);
    StandardDialog.apply(this, ['FileUploadDialog', {title: OSjs.API._('DIALOG_UPLOAD_TITLE'), message: msg, buttonOk: false}, {width:400, height:140}, onClose]);
    this._icon = 'actions/filenew.png';

    _ID++;
  };

  FileUploadDialog.prototype = Object.create(StandardDialog.prototype);

  FileUploadDialog.prototype.init = function(wm) {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);
    this._wmref = wm;

    var file = document.createElement('input');
    file.type = 'file';
    file.name = 'upload';
    file.onchange = function(ev) {
      self.onFileSelected(ev, file.files[0]);
    };

    this.$file = file;
    this.$element.appendChild(file);
    if ( this.file ) {
      this.onFileSelected(null, this.file);
    }
  };

  FileUploadDialog.prototype.destroy = function() {
    this._wmref = null;
    if ( this.dialog ) {
      this.dialog._close();
      this.dialog = null;
    }

    StandardDialog.prototype.destroy.apply(this, arguments);
  };

  FileUploadDialog.prototype._close = function() {
    if ( this.buttonCancel && (this.buttonCancel.isDisabled()) ) {
      return;
    }
    StandardDialog.prototype._close.apply(this, arguments);
  };

  FileUploadDialog.prototype.end = function() {
    if ( this._wmref ) {
      this._wmref.removeNotificationIcon(this.notificationId);
    }

    if ( this.dialog ) {
      this.dialog._close();
      this.dialog = null;
    }

    this.onClose.apply(this, arguments);
    this._close();
  };

  FileUploadDialog.prototype.upload = function(file, size) {
    this.$file.disabled = 'disabled';
    this.buttonCancel.setDisabled(true);

    var desc = OSjs.API._('DIALOG_UPLOAD_MSG_FMT', file.name, file.type, size, this.dest);
    this.dialog = this._wmref.addWindow(new OSjs.Dialogs.FileProgress(OSjs.API._('DIALOG_UPLOAD_MSG')));
    this.dialog.setDescription(desc);
    this.dialog.setProgress(0);
    this._addChild(this.dialog); // Importante!

    this.uploadName = file.name;
    this.uploadSize = size;
    this.uploadMime = file.type;

    if ( this._wmref ) {
      this._wmref.createNotificationIcon(this.notificationId, {className: 'BusyNotification', tooltip: desc});
    }

    var self = this;
    OSjs.Utils.AjaxUpload(file, size, this.dest, {
      progress: function() { self.onUploadProgress.apply(self, arguments); },
      complete: function() { self.onUploadComplete.apply(self, arguments); },
      failed:   function() { self.onUploadFailed.apply(self, arguments); },
      canceled: function() { self.onUploadCanceled.apply(self, arguments); }
    });

    setTimeout(function() {
      if ( self.dialog ) {
        self.dialog._focus();
      }
    }, 100);
  };

  FileUploadDialog.prototype.onFileSelected = function(evt, file) {
    console.info('FileUploadDialog::onFileSelected()', evt, file);
    if ( file ) {
      var fileSize = 0;
      if ( file.size > 1024 * 1024 ) {
        fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
      } else {
        fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
      }

      this.upload(file, fileSize);
    }
  };

  FileUploadDialog.prototype.onUploadProgress = function(evt) {
    if ( evt.lengthComputable ) {
      var p = Math.round(evt.loaded * 100 / evt.total);
      if ( this.dialog ) {
        this.dialog.setProgress(p);
      }
    }
  };

  FileUploadDialog.prototype.onUploadComplete = function(evt) {
    console.info('FileUploadDialog::onUploadComplete()');

    if ( this.buttonCancel ) {
      this.buttonCancel.setDisabled(false);
    }

    this.end('complete', this.uploadName, this.uploadMime, this.uploadSize);
  };

  FileUploadDialog.prototype.onUploadFailed = function(evt, error) {
    console.info('FileUploadDialog::onUploadFailed()');
    if ( error ) {
      this._error(OSjs.API._('DIALOG_UPLOAD_FAILED'), OSjs.API._('DIALOG_UPLOAD_FAILED_MSG'), error);
    } else {
      this._error(OSjs.API._('DIALOG_UPLOAD_FAILED'), OSjs.API._('DIALOG_UPLOAD_FAILED_MSG'), OSjs.API._('DIALOG_UPLOAD_FAILED_UNKNOWN'));
    }
    if ( this.buttonCancel ) {
      this.buttonCancel.setDisabled(false);
    }
    this.end('fail', error);
  };

  FileUploadDialog.prototype.onUploadCanceled = function(evt) {
    console.info('FileUploadDialog::onUploadCanceled()');
    this._error(OSjs.API._('DIALOG_UPLOAD_FAILED'), OSjs.API._('DIALOG_UPLOAD_FAILED_MSG'), OSjs.API._('DIALOG_UPLOAD_FAILED_CANCELLED'));
    if ( this.buttonCancel ) {
      this.buttonCancel.setDisabled(false);
    }
    this.end('cancelled', evt);
  };

  FileUploadDialog.prototype._error = function() {
    OSjs.API.error.apply(this, arguments); // Because this window may close automatically, and that will remove errors
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.FileUpload         = FileUploadDialog;

})(OSjs.Dialogs.StandardDialog);
