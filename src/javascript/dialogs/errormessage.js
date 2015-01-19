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
(function(API, Utils, DialogWindow) {
  'use strict';

  /**
   * ErrorDialog implementation
   *
   * THIS IS FOR INTERNAL USAGE ONLY
   *
   * @api OSjs.Dialogs.ErrorDialog
   * @see OSjs.Dialogs._StandardDialog
   *
   * @extends _StandardDialog
   * @class
   */
  var ErrorDialog = function() {
    this.data = {title: 'No title', message: 'No message', error: ''};

    DialogWindow.apply(this, ['ErrorDialog', {width:400, height:280}]);
    this._icon = 'status/dialog-error.png';
    this._sound = 'dialog-warning';
    this._soundVolume = 1.0;
  };

  ErrorDialog.prototype = Object.create(DialogWindow.prototype);

  ErrorDialog.prototype.init = function(wmRef) {
    var bugData = this.data;
    var self = this;

    var ok;
    var label;

    var root        = DialogWindow.prototype.init.apply(this, arguments);
    root.className += ' ErrorDialog';

    var messagel        = document.createElement('div');
    messagel.className  = API._('DIALOG_ERROR_MESSAGE');
    messagel.innerHTML  = this.data.message;
    root.appendChild(messagel);

    label           = document.createElement('div');
    label.className = 'Label';
    label.innerHTML = API._('DIALOG_ERROR_SUMMARY');
    root.appendChild(label);

    var messaged = this._addGUIElement(new OSjs.GUI.Textarea('Summary'), root);
    messaged.setValue(this.data.error);

    var exception = this.data.exception;
    if ( exception ) {
      root.className += ' WithTrace';
      var error = '';
      if ( exception.stack ) {
        error = exception.stack;
      } else {
        error = exception.name;
        error += '\nFilename: ' + exception.fileName || '<unknown>';
        error += '\nLine: ' + exception.lineNumber;
        error += '\nMessage: ' + exception.message;
        if ( exception.extMessage ) {
          error += '\n' + exception.extMessage;
        }
      }

      bugData.exceptionDetail = '' + error;

      label           = document.createElement('div');
      label.className = 'Label';
      label.innerHTML = API._('DIALOG_ERROR_TRACE');
      root.appendChild(label);

      var traced = this._addGUIElement(new OSjs.GUI.Textarea('Trace'), root);
      traced.setValue(error);
    }

    ok = this._addGUIElement(new OSjs.GUI.Button('OK', {label: API._('DIALOG_CLOSE'), onClick: function() {
      self._close();
    }}), root);

    if ( this.data.bugreport ) {
      this._addGUIElement(new OSjs.GUI.Button('Bug', {label: API._('DIALOG_ERROR_BUGREPORT'), onClick: function() {
        window.open('//github.com/andersevenrud/OS.js-v2/issues/new');

        if ( ok ) {
          ok.onClick();
        }
      }}), root);
    }

    this._title = this.data.title;
  };

  ErrorDialog.prototype.setError = function(title, message, error, exception, bugreport) {
    this.data = {title: title, message: message, error: error, exception: exception, bugreport: bugreport};
  };

  ErrorDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === Utils.Keys.ESC ) {
      this._close();
    }
  };


  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.ErrorMessage       = ErrorDialog;

})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);
