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
(function(API, VFS, Utils, DialogWindow) {
  'use strict';

  /**
   * An 'FileUpload' dialog
   *
   * @param   args      Object        An object with arguments
   * @param   callback  Function      Callback when done => fn(ev, button, result)
   *
   * @option    args    title       String      Dialog title
   * @option    args    dest        String      Upload destination path
   * @option    args    file        Mixed       (Optional) Upload this file
   *
   * @extends DialogWindow
   * @class FileUploadDialog
   * @api OSjs.Dialogs.FileUpload
   */
  function FileUploadDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      dest:     API.getDefaultPath('/'),
      progress: {},
      file:     null
    });

    DialogWindow.apply(this, ['FileUploadDialog', {
      title: args.title || API._('DIALOG_UPLOAD_TITLE'),
      icon: 'actions/filenew.png',
      width: 400,
      height: 100
    }, args, callback]);
  }

  FileUploadDialog.prototype = Object.create(DialogWindow.prototype);
  FileUploadDialog.constructor = DialogWindow;

  FileUploadDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);

    var message = this.scheme.find(this, 'Message');
    var maxSize = OSjs.Core.getHandler().getConfig('Core').MaxUploadSize;

    message.set('value', API._('DIALOG_UPLOAD_DESC', this.args.dest, maxSize), true);

    var input = this.scheme.find(this, 'File');
    if ( this.args.file ) {
      this.setFile(this.args.file, input);
    } else {
      input.on('change', function(ev) {
        self.setFile(ev.detail, input);
      });
    }

    return root;
  };

  FileUploadDialog.prototype.setFile = function(file, input) {
    var self = this;

    function error(msg, ev) {
      API.error(
        OSjs.API._('DIALOG_UPLOAD_FAILED'),
        OSjs.API._('DIALOG_UPLOAD_FAILED_MSG'),
        msg || OSjs.API._('DIALOG_UPLOAD_FAILED_UNKNOWN')
      );

      progressDialog._close(true);
      self.onClose(ev, 'cancel');
    }

    if ( file ) {
      var fileSize = 0;
      if ( file.size > 1024 * 1024 ) {
        fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
      } else {
        fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
      }

      if ( input ) {
        input.set('disabled', true);
      }

      this.scheme.find(this, 'ButtonCancel').set('disabled', true);

      var desc = OSjs.API._('DIALOG_UPLOAD_MSG_FMT', file.name, file.type, fileSize, this.dest);

      var progressDialog = API.createDialog('FileProgress', {
        message: desc,
        dest: this.args.dest,
        filename: file.name,
        mime: file.type,
        size: fileSize
      }, function(ev, button) {
        // Dialog closed
      }, this);


      if ( this._wmref ) {
        this._wmref.createNotificationIcon(this.notificationId, {className: 'BusyNotification', tooltip: desc});
      }

      OSjs.VFS.internalUpload(file, this.args.dest, function(type, ev) {
        if ( type === 'success' ) {
          progressDialog._close();
          self.onClose(ev, 'ok', file);
        } else if ( type === 'failed' ) {
          error(ev.toString(), ev);
        } else if ( type === 'canceled' ) {
          error(OSjs.API._('DIALOG_UPLOAD_FAILED_CANCELLED'), ev);
        } else if ( type === 'progress' ) {
          if ( ev.lengthComputable ) {
            var p = Math.round(ev.loaded * 100 / ev.total);
            progressDialog.setProgress(p);
          }
        } else {
          error(ev.toString(), ev);
        }
      });

      setTimeout(function() {
        if ( progressDialog ) { progressDialog._focus(); }
      }, 100);
    }
  };


  FileUploadDialog.prototype.onClose = function(ev, button, result) {
    result = result || null;
    this.closeCallback(ev, button, result);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.FileUpload = FileUploadDialog;

})(OSjs.API, OSjs.VFS, OSjs.Utils, OSjs.Core.DialogWindow);
