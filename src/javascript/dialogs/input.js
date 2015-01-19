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
(function(API, Utils, _StandardDialog) {
  'use strict';

  /**
   * Input Dialog
   *
   * @param   String          msg         Message to display
   * @param   String          val         Default input value (optional)
   * @param   Function        onClose     Callback on close => fn(button, input)
   * @param   Function        onCreated   Callback on input init/create
   *
   * @api OSjs.Dialogs.Input
   * @see OSjs.Dialogs._StandardDialog
   *
   * @extends _StandardDialog
   * @class
   */
  var InputDialog = function(msg, val, onClose, onCreated) {
    _StandardDialog.apply(this, ['InputDialog', {
      title: API._('DIALOG_INPUT_TITLE'),
      icon: 'status/dialog-information.png',
      message: msg,
      buttons: ['cancel', 'ok']
    }, {width:300, height:150}, onClose]);

    this.value = val || '';
    this.input = null;
    this.onInputCreated = onCreated || function _noop() {};
  };

  InputDialog.prototype = Object.create(_StandardDialog.prototype);

  InputDialog.prototype.init = function() {
    var self = this;
    var root = _StandardDialog.prototype.init.apply(this, arguments);

    var inputd = document.createElement('div');

    this.input = this._addGUIElement(new OSjs.GUI.Text('TextInput', {value: this.value, onKeyPress: function(ev) {
      if ( ev.keyCode === Utils.Keys.ENTER ) {
        self.buttons['confirm'].onClick(ev);
        return;
      }
    }}), inputd);
    this.$element.appendChild(inputd);

    return root;
  };

  InputDialog.prototype._inited = function() {
    _StandardDialog.prototype._inited.apply(this, arguments);

    var self = this;
    setTimeout(function() {
      self.onInputCreated(self.input);
    }, 10);
  };

  InputDialog.prototype._focus = function() {
    _StandardDialog.prototype._focus.apply(this, arguments);
    if ( this.input ) {
      this.input.focus();
      this.input.select();
    }
  };

  InputDialog.prototype.onButtonClick = function(btn, ev) {
    if ( btn === 'ok' ) {
      if ( this.buttons[btn] ) {
        this.end('ok', this.input.getValue());
      }
      return;
    }
    _StandardDialog.prototype.onButtonClick.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.Input              = InputDialog;

})(OSjs.API, OSjs.Utils, OSjs.Dialogs._StandardDialog);
