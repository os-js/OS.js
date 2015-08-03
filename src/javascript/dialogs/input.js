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
   * @extends DialogWindow
   */
  function InputDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});

    DialogWindow.apply(this, ['InputDialog', {
      title: args.title || API._('DIALOG_INPUT_TITLE'),
      icon: 'status/dialog-information.png',
      width: 400,
      height: 120
    }, args, callback]);
  }

  InputDialog.prototype = Object.create(DialogWindow.prototype);
  InputDialog.constructor = DialogWindow;

  InputDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    if ( this.args.message ) {
      this.scheme.find(this, 'Message').set('value', this.args.message, true);
    }

    var input = this.scheme.find(this, 'Input');
    input.set('placeholder', this.args.placeholder || '');
    input.set('value', this.args.value || '');
    input.on('enter', function(ev) {
      self.onClose(ev, 'ok');
    });

    return root;
  };

  InputDialog.prototype._focus = function() {
    if ( DialogWindow.prototype._focus.apply(this, arguments) ) {
      this.scheme.find(this, 'Input').focus();
      return true;
    }
    return false;
  };

  InputDialog.prototype.onClose = function(ev, button) {
    var result = this.scheme.find(this, 'Input').get('value');
    this.closeCallback(ev, button, button === 'ok' ? result : null);
  };

  InputDialog.prototype.setRange = function(range) {
    var input = this.scheme.find(this, 'Input');
    if ( input.$element ) {
      input.$element.querySelector('input').select(range);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.Input = InputDialog;

})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);
