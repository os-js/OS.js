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
(function(Utils, API, DialogWindow, GUI) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.Dialogs = OSjs.Dialogs || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Standard Base Dialog
   */
  var StandardDialog = function(className, args, opts, onClose) {
    this.$element       = null;
    this.$message       = null;
    this.buttonConfirm  = null;
    this.buttonCancel   = null;
    this.buttonClose    = null;
    this.buttonContainer= null;

    this.className      = className;
    this.args           = args          || {};
    this.message        = args.message  || null;
    this.onClose        = onClose       || function() {};

    DialogWindow.apply(this, [className, opts]);
    if ( this.args.title ) {
      this._title = this.args.title;
    }

    this._sound = 'dialog-information';
    this._soundVolume = 0.5;
  };

  StandardDialog.prototype = Object.create(DialogWindow.prototype);

  StandardDialog.prototype.destroy = function() {
    if ( this._destroyed ) { return; }

    this.onClose.apply(this, ['destroy']);
    DialogWindow.prototype.destroy.apply(this, arguments);
    this.buttonContainer = null;
  };

  StandardDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var self = this;

    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = 'Buttons';

    this.$element = document.createElement('div');
    Utils.$addClass(this.$element, 'StandardDialog');
    Utils.$addClass(this.$element, this.className);

    if ( this.message ) {
      this.$message           = document.createElement('div');
      this.$message.className = 'Message';
      this.$message.innerHTML = this.message;
      this.$element.appendChild(this.$message);
    }

    var lbl;
    if ( (typeof this.args.buttonClose !== 'undefined') && (this.args.buttonClose === true) ) {
      lbl = (this.args.buttonCloseLabel || API._('Close'));
      this.buttonClose = this._addGUIElement(new OSjs.GUI.Button('Close', {label: lbl, onClick: function(el, ev) {
        if ( !this.isDisabled() ) {
          self.onCloseClick(ev);
        }
      }}), this.buttonContainer);
    }

    if ( (typeof this.args.buttonCancel === 'undefined') || (this.args.buttonCancel === true) ) {
      lbl = (this.args.buttonCancelLabel || API._('Cancel'));
      this.buttonCancel = this._addGUIElement(new OSjs.GUI.Button('Cancel', {label: lbl, onClick: function(el, ev) {
        if ( !this.isDisabled() ) {
          self.onCancelClick(ev);
        }
      }}), this.buttonContainer);
    }

    if ( (typeof this.args.buttonOk === 'undefined') || (this.args.buttonOk === true) ) {
      lbl = (this.args.buttonOkLabel || API._('OK'));
      this.buttonConfirm = this._addGUIElement(new OSjs.GUI.Button('OK', {label: lbl, onClick: function(el, ev) {
        if ( !this.isDisabled() ) {
          self.onConfirmClick.call(self, ev);
        }
      }}), this.buttonContainer);
    }

    this.$element.appendChild(this.buttonContainer);
    root.appendChild(this.$element);
    return root;
  };

  StandardDialog.prototype._inited = function() {
    DialogWindow.prototype._inited.apply(this, arguments);
    if ( this.buttonConfirm ) {
      this.buttonConfirm.focus();
    } else {
      if ( this.buttonCancel ) {
        this.buttonCancel.focus();
      }
    }
  };

  StandardDialog.prototype.onCloseClick = function(ev) {
    if ( !this.buttonClose ) { return; }
    this.end('close');
  };

  StandardDialog.prototype.onCancelClick = function(ev) {
    if ( !this.buttonCancel ) { return; }
    this.end('cancel');
  };

  StandardDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.buttonConfirm ) { return; }
    this.end('ok');
  };

  StandardDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent.apply(this, arguments);
    if ( ev.keyCode === Utils.Keys.ESC ) {
      if ( this.args.buttonClose ) {
        this.end('close');
      } else {
        this.end('cancel');
      }
    }
  };

  StandardDialog.prototype.end = function() {
    this.onClose.apply(this, arguments);
    this._close();
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.StandardDialog    = StandardDialog;

})(OSjs.Utils, OSjs.API, OSjs.Core.DialogWindow, OSjs.GUI);
