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
(function(API, Utils, VFS, StandardDialog) {
  'use strict';

  /**
   * File Information Dialog
   */
  var FileInformationDialog = function(file, onClose) {
    this.path = file ? file.path : null;
    this.file = file;
    onClose = onClose || function() {};
    StandardDialog.apply(this, ['FileInformationDialog', {title: API._('DIALOG_FILEINFO_TITLE'), buttonCancel: false, buttonOkLabel: API._('DIALOG_CLOSE')}, {width:300, height:370}, onClose]);
  };
  FileInformationDialog.prototype = Object.create(StandardDialog.prototype);

  FileInformationDialog.prototype.init = function() {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);

    var desc = API._('DIALOG_FILEINFO_LOADING', this.path);
    var txt = this._addGUIElement(new OSjs.GUI.Textarea('FileInformationTextarea', {disabled: true, value: desc}), this.$element);

    function _onError(err) {
      var fname = Utils.filename(self.path);
      self._error(API._('DIALOG_FILEINFO_ERROR'), API._('DIALOG_FILEINFO_ERROR_LOOKUP', fname), err);
      txt.setValue(API._('DIALOG_FILEINFO_ERROR_LOOKUP_FMT', self.path));
    }

    function _onSuccess(data) {
      var info = [];
      Object.keys(data).forEach(function(i) {
        if ( i === 'exif' ) {
          info.push(i + ':\n\n' + data[i]);
        } else {
          info.push(i + ':\n\t' + data[i]);
        }
      });
      txt.setValue(info.join('\n\n'));
    }

    VFS.fileinfo(this.file, function(error, result) {
      if ( error ) {
        _onError(error);
        return;
      }
      _onSuccess(result || {});
    });

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.FileInfo           = FileInformationDialog;

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.Dialogs.StandardDialog);
