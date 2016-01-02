/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Utils, API, Window) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};

  /////////////////////////////////////////////////////////////////////////////
  // DIALOG
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Dialog Window
   *
   * A simple wrapper with some pre-defined options
   *
   * @see OSjs.Core.Window
   * @api OSjs.Core.DialogWindow
   * @class DialogWindow
   * @extends Window
   */
  function DialogWindow(className, opts, args, callback) {
    var self = this;

    opts = opts || {};
    args = args || {};
    callback = callback || function() {};

    console.info('DialogWindow::construct()', className, opts, args);

    Window.apply(this, [className, opts]);

    this._properties.gravity          = 'center';
    this._properties.allow_resize     = false;
    this._properties.allow_minimize   = false;
    this._properties.allow_maximize   = false;
    this._properties.allow_windowlist = false;
    this._properties.allow_session    = false;
    this._state.ontop                 = true;
    this._tag                         = 'DialogWindow';

    this.args = args;
    this.scheme = OSjs.Core.getHandler().dialogs;
    this.className = className;
    this.buttonClicked = false;

    this.closeCallback = function(ev, button, result) {
      if ( self._destroyed ) {
        return;
      }

      self.buttonClicked = true;
      callback.apply(self, arguments);
      self._close();
    };
  }

  DialogWindow.prototype = Object.create(Window.prototype);
  DialogWindow.constructor = Window;

  DialogWindow.prototype.init = function() {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    this.scheme.render(this, this.className.replace(/Dialog$/, ''), root, 'application-dialog', function(node) {
      node.querySelectorAll('gui-label').forEach(function(el) {
        if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
          var label = el.childNodes[0].nodeValue;
          Utils.$empty(el);
          el.appendChild(document.createTextNode(API._(label)));
        }
      });
    });

    var buttonMap = {
      ButtonOK:     'ok',
      ButtonCancel: 'cancel',
      ButtonYes:    'yes',
      ButtonNo:     'no'
    };

    Object.keys(buttonMap).forEach(function(id) {
      if ( self.scheme.findDOM(self, id) ) {
        self.scheme.find(self, id).on('click', function(ev) {
          self.onClose(ev, buttonMap[id]);
        });
      }
    });

    Utils.$addClass(root, 'DialogWindow');

    return root;
  };

  DialogWindow.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };

  DialogWindow.prototype._close = function() {
    if ( !this.buttonClicked ) {
      this.onClose(null, 'cancel', null);
    }
    return Window.prototype._close.apply(this, arguments);
  };

  DialogWindow.prototype._onKeyEvent = function(ev) {
    Window.prototype._onKeyEvent.apply(this, arguments);

    if ( ev.keyCode === Utils.Keys.ESC ) {
      this.onClose(ev, 'cancel');
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.DialogWindow      = DialogWindow;

})(OSjs.Utils, OSjs.API, OSjs.Core.Window);
