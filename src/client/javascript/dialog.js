/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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

  /**
   * A callback for Dialogs.
   *
   * <pre>
   * The list of included buttons are: ok, cancel, yes, no
   * depending on which dialog was called.
   *
   * The result also depends on which dialog was called.
   *
   * The default button is 'cancel' if window was closed.
   *
   * You only get an event back if an actual button was pressed.
   * </pre>
   *
   * @callback CallbackDialog
   * @param {Event}   ev      Browser event that occured from action
   * @param {String}  button  Which button that was clicked
   * @param {Mixed}   result  Result from dialog input
   */

  /////////////////////////////////////////////////////////////////////////////
  // DIALOG
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Dialog Window
   *
   * A simple wrapper with some pre-defined options
   *
   * <pre><b>
   * YOU CANNOT CANNOT USE THIS VIA 'new' KEYWORD.
   * </b></pre>
   *
   * @summary Class used for basis as a Dialog.
   *
   * @abstract
   * @constructor
   * @memberof OSjs.Core
   * @extends OSjs.Core.Window
   * @see OSjs.API.createDialog
   */
  function DialogWindow(className, opts, args, callback) {
    var self = this;

    opts = opts || {};
    args = args || {};

    callback = callback || function() {};
    if ( typeof callback !== 'function' ) {
      throw new TypeError('DialogWindow expects a callback Function, gave: ' + typeof callback);
    }

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

    if ( args.scheme && args.scheme instanceof OSjs.GUI.Scheme ) {
      this.scheme = args.scheme;
      delete args.scheme;
    } else {
      this.scheme = OSjs.GUI.DialogScheme.get();
    }

    this.args = args;
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

  /**
   * @override
   * @function init
   * @memberof OSjs.Core.DialogWindow#
   */
  DialogWindow.prototype.init = function() {
    var self = this;

    var root = Window.prototype.init.apply(this, arguments);
    root.setAttribute('role', 'dialog');

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

    var focusButtons = ['ButtonCancel', 'ButtonNo'];

    Object.keys(buttonMap).forEach(function(id) {
      if ( self.scheme.findDOM(self, id) ) {
        var btn = self.scheme.find(self, id);
        btn.on('click', function(ev) {
          self.onClose(ev, buttonMap[id]);
        });
        if ( focusButtons.indexOf(id) >= 0 ) {
          btn.focus();
        }
      }
    });

    Utils.$addClass(root, 'DialogWindow');

    return root;
  };

  /**
   * When dialog closes
   *
   * @function onClose
   * @memberof OSjs.Core.DialogWindow#
   */
  DialogWindow.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };

  /**
   * @override
   * @function _close
   * @memberof OSjs.Core.DialogWindow#
   */
  DialogWindow.prototype._close = function() {
    if ( !this.buttonClicked ) {
      this.onClose(null, 'cancel', null);
    }
    return Window.prototype._close.apply(this, arguments);
  };

  /**
   * @override
   * @function _onKeyEvent
   * @memberof OSjs.Core.DialogWindow#
   */
  DialogWindow.prototype._onKeyEvent = function(ev) {
    Window.prototype._onKeyEvent.apply(this, arguments);

    if ( ev.keyCode === Utils.Keys.ESC ) {
      this.onClose(ev, 'cancel');
    }
  };

  /**
   * Parses given message to be inserted into Dialog
   *
   * @function parseMessage
   * @memberof OSjs.Core.DialogWindow
   */
  DialogWindow.parseMessage = function(msg) {
    msg = Utils.$escape(msg || '').replace(/\*\*(.*)\*\*/g, '<span>$1</span>');

    var tmp = document.createElement('div');
    tmp.innerHTML = msg;

    var frag = document.createDocumentFragment();
    for ( var i = 0; i < tmp.childNodes.length; i++ ) {
      frag.appendChild(tmp.childNodes[i].cloneNode(true));
    }
    tmp = null;

    return frag;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.DialogWindow = Object.seal(DialogWindow);

})(OSjs.Utils, OSjs.API, OSjs.Core.Window);
