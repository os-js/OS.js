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

  /**
   * File Information Dialog
   */
  var FileInformationDialog = function(path, onClose) {
    this.path = path;
    onClose = onClose || function() {};
    StandardDialog.apply(this, ['FileInformationDialog', {title: OSjs._('File Information'), buttonCancel: false, buttonOkLabel: OSjs._('Close')}, {width:300, height:370}, onClose]);
  };
  FileInformationDialog.prototype = Object.create(StandardDialog.prototype);

  FileInformationDialog.prototype.init = function() {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);

    var desc = OSjs._('Loading file information for: {0}', this.path);
    var txt = this._addGUIElement(new OSjs.GUI.Textarea('FileInformationTextarea', {disabled: true, value: desc}), this.$element);

    function _onError(err) {
      var fname = OSjs.Utils.filename(self.path);
      self._error(OSjs._('FileInformationDialog Error'), OSjs._('Failed to get file information for <span>{0}</span>', fname), err);
      txt.setValue(OSjs._('Failed to get file information for: {0}', self.path));
    }

    function _onSuccess(data) {
      var info = [];
      for ( var i in data ) {
        if ( data.hasOwnProperty(i) ) {
          if ( i === 'exif' ) {
            info.push(i + ':\n\n' + data[i]);
          } else {
            info.push(i + ':\n\t' + data[i]);
          }
        }
      }
      txt.setValue(info.join('\n\n'));
    }

    OSjs.API.call('fs', {method: 'fileinfo', 'arguments' : [this.path]}, function(res) {
      if ( res ) {
        if ( res.error ) {
          _onError(res.error);
          return;
        }
        if ( res.result ) {
          _onSuccess(res.result);
        }
      }
    }, function(error) {
      _onError(error);
    });

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.FileInfo           = FileInformationDialog;

})(OSjs.Dialogs.StandardDialog);
