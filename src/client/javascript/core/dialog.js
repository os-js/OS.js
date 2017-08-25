/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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
import {$empty, $addClass, $escape} from 'utils/dom';
import Keycodes from 'utils/keycodes';
import Window from 'core/window';
import Application from 'core/application';
import WindowManager from 'core/window-manager';
import GUIScheme from 'gui/scheme';
import {_} from 'core/locales';

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
 * @param {*}       result  Result from dialog input
 */

/////////////////////////////////////////////////////////////////////////////
// DIALOG
/////////////////////////////////////////////////////////////////////////////

/**
 * Base Dialog Window Class
 *
 * @desc Class used for basis as a Dialog.
 *
 * @extends {Window}
 * @abstract
 */
export default class DialogWindow extends Window {

  /**
   * @param {String}          className     Dialog Class Name
   * @param {Object}          opts          Dialog Class Options
   * @param {Object}          args          Dialog Class Arguments
   * @param {CallbackDialog}  callback      Callback function
   */
  constructor(className, opts, args, callback) {
    opts = opts || {};
    args = args || {};
    callback = callback || function() {};

    if ( typeof callback !== 'function' ) {
      throw new TypeError('DialogWindow expects a callback Function, gave: ' + typeof callback);
    }

    console.info('DialogWindow::construct()', className, opts, args);

    super(className, opts);

    this._properties.gravity          = 'center';
    this._properties.allow_resize     = false;
    this._properties.allow_minimize   = false;
    this._properties.allow_maximize   = false;
    this._properties.allow_windowlist = false;
    this._properties.allow_session    = false;
    this._state.ontop                 = true;
    this._tag                         = 'DialogWindow';

    if ( args.scheme && args.scheme instanceof GUIScheme ) {
      this.scheme = args.scheme;
      delete args.scheme;
    }

    this.args = args;
    this.className = className;
    this.buttonClicked = false;
    this.closeCallback = (ev, button, result) => {
      if ( this._destroyed ) {
        return;
      }

      this.buttonClicked = true;
      callback.call(this, ev, button, result);
      this._close();
    };
  }

  /**
   * @override
   */
  destroy() {
    if ( this.scheme ) {
      this.scheme = this.scheme.destroy();
    }

    return super.destroy(...arguments);
  }

  /**
   * @override
   */
  init() {
    const root = super.init(...arguments);

    root.setAttribute('role', 'dialog');

    const windowName = this.className.replace(/Dialog$/, '');
    const focusButtons = ['ButtonCancel', 'ButtonNo'];
    const buttonMap = {
      ButtonOK: 'ok',
      ButtonCancel: 'cancel',
      ButtonYes: 'yes',
      ButtonNo: 'no'
    };

    if ( this.scheme ) {
      this.scheme.render(this, windowName, root, 'application-dialog', (node) => {
        node.querySelectorAll('gui-label').forEach((el) => {
          if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
            const label = el.childNodes[0].nodeValue;
            $empty(el);
            el.appendChild(document.createTextNode(_(label)));
          }
        });
      });
    } else {
      this._render(windowName, require('osjs-scheme-loader!dialogs.html'));
    }

    Object.keys(buttonMap).filter((id) => this._findDOM(id)).forEach((id) => {
      const btn = this._find(id);
      btn.on('click', (ev) => {
        this.onClose(ev, buttonMap[id]);
      });

      if ( focusButtons.indexOf(id) >= 0 ) {
        btn.focus();
      }
    });

    $addClass(root, 'DialogWindow');

    return root;
  }

  /**
   * When dialog closes
   *
   * @param   {Event}     ev        DOM Event
   * @param   {String}    button    Button used
   */
  onClose(ev, button) {
    this.closeCallback(ev, button, null);
  }

  /**
   * @override
   */
  _close() {
    if ( !this.buttonClicked ) {
      this.onClose(null, 'cancel', null);
    }
    return super._close(...arguments);
  }

  /**
   * @override
   */
  _onKeyEvent(ev) {
    super._onKeyEvent(...arguments);

    if ( ev.keyCode === Keycodes.ESC ) {
      this.onClose(ev, 'cancel');
    }
  }

  /**
   * Parses given message to be inserted into Dialog
   *
   * @param {String}  msg   Message
   *
   * @return {DocumentFragment}
   */
  static parseMessage(msg) {
    msg = $escape(msg || '').replace(/\*\*(.*)\*\*/g, '<span>$1</span>');

    let tmp = document.createElement('div');
    tmp.innerHTML = msg;

    const frag = document.createDocumentFragment();
    for ( let i = 0; i < tmp.childNodes.length; i++ ) {
      frag.appendChild(tmp.childNodes[i].cloneNode(true));
    }
    tmp = null;

    return frag;
  }

  /**
   * Create a new dialog
   *
   * You can also pass a function as `className` to return an instance of your own class
   *
   * @param   {String}                     className             Dialog Namespace Class Name
   * @param   {Object}                     args                  Arguments you want to send to dialog
   * @param   {CallbackDialog}             callback              Callback on dialog action (close/ok etc) => fn(ev, button, result)
   * @param   {Object|Window|Application}  [options]             A window or app (to make it a child window) or a set of options:
   * @param   {Window|Application}         [options.parent]      Same as above argument (without options context)
   * @param   {Boolean}                    [options.modal=false] If you provide a parent you can toggle "modal" mode.
   *
   * @return  {Window}
   */
  static create(className, args, callback, options) {

    callback = callback || function() {};
    options = options || {};

    let parentObj = options;
    let parentIsWindow = (parentObj instanceof Window);
    let parentIsProcess = (parentObj instanceof Application);
    if ( parentObj && !(parentIsWindow && parentIsProcess) ) {
      parentObj = options.parent;
      parentIsWindow = (parentObj instanceof Window);
      parentIsProcess = (parentObj instanceof Application);
    }

    function cb() {
      if ( parentObj ) {
        if ( parentIsWindow && parentObj._destroyed ) {
          console.warn('DialogWindow::create()', 'INGORED EVENT: Window was destroyed');
          return;
        }
        if ( parentIsProcess && parentObj.__destroyed ) {
          console.warn('DialogWindow::create()', 'INGORED EVENT: Process was destroyed');
          return;
        }
      }

      if ( options.modal && parentIsWindow ) {
        parentObj._toggleDisabled(false);
      }

      callback.apply(null, arguments);
    }

    const win = typeof className === 'string' ? new OSjs.Dialogs[className](args, cb) : className(args, cb);

    if ( !parentObj ) {
      const wm = WindowManager.instance;
      wm.addWindow(win, true);
    } else if ( parentObj instanceof Window ) {
      win._on('destroy', () => {
        if ( parentObj ) {
          parentObj._focus();
        }
      });
      parentObj._addChild(win, true);
    } else if ( parentObj instanceof Application ) {
      parentObj._addWindow(win);
    }

    if ( options.modal && parentIsWindow ) {
      parentObj._toggleDisabled(true);
    }

    win._focus();

    return win;
  }
}
