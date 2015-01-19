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
(function(Utils, API, DialogWindow, GUI) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.Dialogs = OSjs.Dialogs || {};

  var StandardDialogButtons = {
    'ok': 'DIALOG_OK',
    'cancel': 'DIALOG_CANCEL',
    'close': 'DIALOG_CLOSE'
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Standard Dialog Window Implementation
   *
   * This is a version of Dialog Window that makes
   * it easy to add buttons etc.
   *
   * @param   String      className       Dialog Class Name
   * @param   Object      args            Dialog Arguments
   * @param   Object      opts            Window Options
   * @param   Function    onClose         Callback => fn(button)
   *
   * @option  args    String      title     Dialog title
   * @option  args    String      message   Dialog message
   * @option  args    Array       buttons   List of buttons: ['ok', 'cancel', 'close', {name:'custom', label:'Custom'}]
   *
   * @see     OSjs.Core.DialogWindow
   * @api     OSjs.Core.StandardDialog
   * @extends DialogWindow
   * @class
   */
  var StandardDialog = function(className, args, opts, onClose) {
    this.$buttons = null;
    this.$element = null;
    this.$message = null;

    this.className      = className;
    this.args           = args              || {};
    this.message        = args.message      || null;
    this.onClose        = onClose           || function() {};
    this.buttons        = {};

    DialogWindow.apply(this, [className, opts]);
    if ( this.args.title ) {
      this._title = this.args.title;
    }
    if ( this.args.icon ) {
      this._icon = this.args.icon;
    }

    this._sound = 'dialog-information';
    this._soundVolume = 0.5;
  };

  StandardDialog.prototype = Object.create(DialogWindow.prototype);

  /**
   * Destroy the Dialog Window
   *
   * @see     OSjs.Core.DialogWindow::destroy()
   * @return  void
   *
   * @method  StandardDialog::destroy()
   */
  StandardDialog.prototype.destroy = function() {
    if ( this._destroyed ) { return; }

    this.onClose.apply(this, ['destroy']);
    DialogWindow.prototype.destroy.apply(this, arguments);

    this.$element = null;
    this.$buttons = null;
    this.$message = null;
  };

  /**
   * Initialize Dialog Window
   *
   * @see     OSjs.Core.DialogWindow::init()
   * @return  DOMElement
   *
   * @method  StandardDialog::init()
   */
  StandardDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var self = this;

    this.$buttons = document.createElement('div');
    this.$buttons.className = 'Buttons';

    this.$element = document.createElement('div');
    Utils.$addClass(this.$element, 'StandardDialog');
    Utils.$addClass(this.$element, this.className);

    if ( this.message ) {
      this.$message           = document.createElement('div');
      this.$message.className = 'Message';
      this.$message.innerHTML = this.message;
      this.$element.appendChild(this.$message);
    }

    function createButton(b, i, buttonName, buttonLabel) {
      self.buttons[buttonName] = self._addGUIElement(new OSjs.GUI.Button(buttonName, {label: buttonLabel, onClick: function(el, ev) {
        if ( !this.isDisabled() ) {
          self.onButtonClick(buttonName, ev);
        }
      }}), self.$buttons);
    }

    if ( this.args.buttons ) {
      this.args.buttons.forEach(function(b, i) {
        var buttonName;
        var buttonLabel;

        if ( typeof b === 'string' ) {
          buttonName = b;
          buttonLabel = API._(StandardDialogButtons[b]);
        } else {
          buttonName = b.name;
          buttonLabel = b.label;
        }

        if ( !buttonName ) {
          buttonName = 'Button' + i.toString();
        }
        if ( !buttonLabel ) {
          buttonLabel = buttonName;
        }

        createButton(b, i, buttonName, buttonLabel);
      });
    }

    this.$element.appendChild(this.$buttons);
    root.appendChild(this.$element);
    return root;
  };

  /**
   * When Dialog Windows has been inited
   *
   * @see     OSjs.Core.DialogWindow::_inited()
   * @return  void
   *
   * @method  StandardDialog::_inited()
   */
  StandardDialog.prototype._inited = function() {
    DialogWindow.prototype._inited.apply(this, arguments);

    if ( this.buttons['ok'] ) {
      this.buttons['ok'].focus();
    } else {
      if ( this.buttons['cancel'] ) {
        this.buttons['cancel'].focus();
      }
    }
  };

  /**
   * When Close has been clicked
   *
   * @param   String      btn     Button name
   * @param   DOMEvent    ev      Event
   *
   * @return  void
   *
   * @method  StandardDialog::onButtonClick()
   */
  StandardDialog.prototype.onButtonClick = function(btn, ev) {
    if ( !this.buttons[btn] ) { return; }
    this.end(btn);
  };

  /**
   * On Key event
   *
   * @see     OSjs.Core.DialogWindow::_onKeyEvent()
   * @return  void
   *
   * @method  StandardDialog::_onKeyEvent()
   */
  StandardDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent.apply(this, arguments);
    if ( ev.keyCode === Utils.Keys.ESC ) {
      if ( this.buttons['close'] ) {
        this.end('close');
      } else {
        this.end('cancel');
      }
    }
  };

  /**
   * End/Close Dialog Window
   *
   * @return  void
   *
   * @method  StandardDialog::end()
   */
  StandardDialog.prototype.end = function() {
    this.onClose.apply(this, arguments);
    this._close();
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.StandardDialog    = StandardDialog;

})(OSjs.Utils, OSjs.API, OSjs.Core.DialogWindow, OSjs.GUI);
