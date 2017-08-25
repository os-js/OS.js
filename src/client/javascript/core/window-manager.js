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

import * as DOM from 'utils/dom';
import * as Menu from 'gui/menu';
import * as Events from 'utils/events';
import * as Utils from 'utils/misc';
import Keycodes from 'utils/keycodes';

import Theme from 'core/theme';
import Process from 'core/process';
import Window from 'core/window';
import DialogWindow from 'core/dialog';
import Connection from 'core/connection';
import SettingsManager from 'core/settings-manager';
import Notification from 'gui/notification';

import {_} from 'core/locales';
import {getConfig} from 'core/config';
import {createWindowBehaviour} from 'helpers/window-behaviour';

/////////////////////////////////////////////////////////////////////////////
// MISC HELPERS
/////////////////////////////////////////////////////////////////////////////

function checkForbiddenKeyCombo(ev) {
  return false;
  /* FIXME: This is not supported in browsers :( (in app mode it should be)
  var forbiddenCtrl = ['n', 't', 'w'];
  if ( ev.ctrlKey ) {
    return forbiddenCtrl.some(function(i) {
      return String.fromCharCode(ev.keyCode).toLowerCase() === i;
    });
  }
  return false;
  */
}

function checkPrevent(ev, win) {
  const d = ev.srcElement || ev.target;
  const accept = [122, 123];
  let doPrevent = d.tagName === 'BODY' ? true : false;

  // What browser default keys we prevent in certain situations
  if ( (ev.keyCode === Keycodes.BACKSPACE) && !DOM.$isFormElement(ev) ) { // Backspace
    doPrevent = true;
  } else if ( (ev.keyCode === Keycodes.TAB) && DOM.$isFormElement(ev) ) { // Tab
    doPrevent = true;
  } else {
    if ( accept.indexOf(ev.keyCode) !== -1 ) {
      doPrevent = false;
    } else if ( checkForbiddenKeyCombo(ev) ) {
      doPrevent = true;
    }
  }

  // Only prevent default event if current window is not set up to capture them by force
  if ( doPrevent && (!win || !win._properties.key_capture) ) {
    return true;
  }

  return false;
}

function triggerFullscreen(el, state) {
  function _request() {
    if ( el.requestFullscreen ) {
      el.requestFullscreen();
    } else if ( el.mozRequestFullScreen ) {
      el.mozRequestFullScreen();
    } else if ( el.webkitRequestFullScreen ) {
      el.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  }

  function _restore() {
    if ( el.webkitCancelFullScreen ) {
      el.webkitCancelFullScreen();
    } else if ( el.mozCancelFullScreen ) {
      el.mozCancelFullScreen();
    } else if ( el.exitFullscreen ) {
      el.exitFullscreen();
    }
  }

  if ( el ) {
    if ( state ) {
      _request();
    } else {
      _restore();
    }
  }
}

/////////////////////////////////////////////////////////////////////////////
// WINDOW MANAGER
/////////////////////////////////////////////////////////////////////////////

let _instance;

/**
 * WindowManager Process Class
 *
 * @desc Class used for basis as a Window Manager.
 *
 * @abstract
 */
export default class WindowManager extends Process {

  static get instance() {
    return _instance;
  }

  /**
   * @param   {String}            name      Window Manager name
   * @param   {Object}            args      Constructed arguments
   * @param   {Object}            metadata  Package Metadata
   * @param   {Object}            settings  Restored settings
   */
  constructor(name, args, metadata, settings) {
    console.group('WindowManager::constructor()');
    console.debug('Name', name);
    console.debug('Arguments', args);

    super(name, args, metadata);

    /* eslint consistent-this: "off" */
    _instance = this;

    this._windows        = [];
    this._settings       = SettingsManager.instance(name, settings);
    this._currentWin     = null;
    this._lastWin        = null;
    this._mouselock      = true;
    this._stylesheet     = null;
    this._sessionLoaded  = false;
    this._fullyLoaded    = false;
    this._isResponsive   = false;
    this._responsiveRes  = 800;
    this._dcTimeout      = null;
    this._resizeTimeout  = null;
    this._$fullscreen    = null;
    this._$lastDomInput  = null;

    // Important for usage as "Application"
    this.__name    = (name || 'WindowManager');
    this.__path    = metadata.path;
    this.__iter    = metadata.iter;

    Connection.instance.subscribe('online', () => {
      Notification.create({title: _('LBL_INFO'), message: _('CONNECTION_RESTORED')});
    });

    Connection.instance.subscribe('offline', (reconnecting) => {
      Notification.create({title: _('LBL_WARNING'), message: _(reconnecting ? 'CONNECTION_RESTORE_FAILED' : 'CONNECTION_LOST')});
    });

    console.groupEnd();
  }

  /**
   * Destroy the WindowManager
   *
   * @return {Boolean}
   */
  destroy() {
    console.debug('WindowManager::destroy()');

    this.destroyStylesheet();

    Events.$unbind(document, 'pointerout:windowmanager');
    Events.$unbind(document, 'pointerenter:windowmanager');
    Events.$unbind(window, 'orientationchange:windowmanager');
    Events.$unbind(window, 'hashchange:windowmanager');
    Events.$unbind(window, 'resize:windowmanager');
    Events.$unbind(window, 'scroll:windowmanager');
    Events.$unbind(window, 'fullscreenchange:windowmanager');
    Events.$unbind(window, 'mozfullscreenchange:windowmanager');
    Events.$unbind(window, 'webkitfullscreenchange:windowmanager');
    Events.$unbind(window, 'msfullscreenchange:windowmanager');
    Events.$unbind(document.body, 'contextmenu:windowmanager');
    Events.$unbind(document.body, 'pointerdown:windowmanager,touchstart:windowmanager');
    Events.$unbind(document.body, 'click:windowmanager');
    Events.$unbind(document, 'keyup:windowmanager');
    Events.$unbind(document, 'keydown:windowmanager');
    Events.$unbind(document, 'keypress:windowmanager');

    window.onerror = null;
    window.onbeforeunload = null;

    // Destroy all windows
    this._windows.forEach((win, i) => {
      if ( win ) {
        win.destroy(true);
        this._windows[i] = null;
      }
    });

    this._windows = [];
    this._currentWin = null;
    this._lastWin = null;
    this._$fullscreen = null;

    _instance = null;

    return super.destroy();
  }

  /**
   * Initialize the WindowManager
   *
   * @param   {Object}            metadata      Package metadata
   * @param   {Object}            settings      Package settings
   */
  init(metadata, settings) {
    console.debug('WindowManager::init()');

    document.body.addEventListener('touchend', (ev) => {
      if ( ev.target === document.body ) {
        ev.preventDefault();
      }
    });

    Events.$bind(document, 'pointerout:windowmanager', (ev) => this._onMouseLeave(ev));
    Events.$bind(document, 'pointerenter:windowmanager', (ev) => this._onMouseLeave(ev));
    Events.$bind(window, 'orientationchange:windowmanager', (ev) => this._onOrientationChange(ev));
    Events.$bind(window, 'hashchange:windowmanager', (ev) => this._onHashChange(ev));
    Events.$bind(window, 'resize:windowmanager', (ev) => this._onResize(ev));
    Events.$bind(window, 'scroll:windowmanager', (ev) => this._onScroll(ev));
    Events.$bind(window, 'fullscreenchange:windowmanager', (ev) => this._onFullscreen(ev));
    Events.$bind(window, 'mozfullscreenchange:windowmanager', (ev) => this._onFullscreen(ev));
    Events.$bind(window, 'webkitfullscreenchange:windowmanager', (ev) => this._onFullscreen(ev));
    Events.$bind(window, 'msfullscreenchange:windowmanager', (ev) => this._onFullscreen(ev));
    Events.$bind(document.body, 'contextmenu:windowmanager', (ev) => this._onContextMenu(ev));
    Events.$bind(document.body, 'pointerdown:windowmanager,touchstart:windowmanager', (ev) => this._onMouseDown(ev));
    Events.$bind(document.body, 'click:windowmanager', (ev) => this._onClick(ev));
    Events.$bind(document, 'keyup:windowmanager', (ev) => this._onKeyUp(ev));
    Events.$bind(document, 'keydown:windowmanager', (ev) => this._onKeyDown(ev));
    Events.$bind(document, 'keypress:windowmanager', (ev) => this._onKeyPress(ev));

    window.onerror = this._onError.bind(this);
    window.onbeforeunload = this._onBeforeUnload(this);

    const queries = this.getDefaultSetting('mediaQueries') || {};

    let maxWidth = 0;
    Object.keys(queries).forEach((q) => {
      maxWidth = Math.max(maxWidth, queries[q]);
    });
    this._responsiveRes = maxWidth || 800;

    this._onOrientationChange();
    this.resize();
  }

  /**
   * Setup features
   *
   * THIS IS IMPLEMENTED IN COREWM
   *
   * @param   {Function}  cb        Callback
   */
  setup(cb) {
    // Implement in your WM
    cb();
  }

  /**
   * Get a Window by name
   *
   * @param   {String}      name        Window name
   *
   * @return  {Window}
   */
  getWindow(name) {
    return this.getWindows().find((w) => {
      return  w.__name === name;
    });
  }

  /**
   * Add a Window
   *
   * @throws {Error} If invalid window is given
   *
   * @param   {Window}      w         Window reference
   * @param   {Boolean}     focus     Focus the window
   *
   * @return  {Window}                The added window
   */
  addWindow(w, focus) {
    if ( !(w instanceof Window) ) {
      console.warn('WindowManager::addWindow()', 'Got', w);
      throw new TypeError('given argument was not instance of Core.Window');
    }
    console.debug('WindowManager::addWindow()');

    try {
      w.init(this, w._app);
    } catch ( e ) {
      console.error('WindowManager::addWindow()', '=>', 'Window::init()', e, e.stack);
    }

    createWindowBehaviour(w, this);

    this._windows.push(w);
    w._inited();

    if ( focus === true || w instanceof DialogWindow ) {
      w._focus();
    }

    return w;
  }

  /**
   * Remove a Window
   *
   * @throws {Error} If invalid window is given
   *
   * @param   {Window}      w         Window reference
   *
   * @return  {Boolean}               On success
   */
  removeWindow(w) {
    if ( !(w instanceof Window) ) {
      console.warn('WindowManager::removeWindow()', 'Got', w);
      throw new TypeError('given argument was not instance of Core.Window');
    }

    const foundIndex = this._windows
      .findIndex((win) => win && win._wid === w._wid);

    console.debug('WindowManager::removeWindow()', w._wid, foundIndex);

    if ( foundIndex !== -1 ) {
      this._windows[foundIndex] = null;
      return true;
    }
    return false;
  }

  /**
   * Set WindowManager settings
   *
   * OVERRIDE THIS IN YOUR WM IMPLEMENTATION
   *
   * @param   {Object}      settings              JSON Settings
   * @param   {Boolean}     force                 If forced, no merging will take place
   * @param   {Boolean}     save                  Saves settings
   * @param   {Boolean}     [triggerWatch=true]   Trigger change event for watchers
   *
   * @return  {Boolean}                     On success
   */
  applySettings(settings, force, save, triggerWatch) {
    settings = settings || {};
    console.debug('WindowManager::applySettings()', 'forced?', force);

    const result = force ? settings : Utils.mergeObject(this._settings.get(), settings);
    this._settings.set(null, result, save, triggerWatch);

    return true;
  }

  /**
   * Create Window Manager self-contained CSS from this object
   *
   * {
   *    '.classname': {
   *      'background-image': 'url()'
   *    }
   * }
   *
   * @param   {Object}    styles      Style object
   * @param   {String}    [rawStyles] Raw CSS data
   */
  createStylesheet(styles, rawStyles) {
    this.destroyStylesheet();

    let innerHTML = [];
    Object.keys(styles).forEach((key) => {
      let rules = [];
      Object.keys(styles[key]).forEach((r) => {
        rules.push(Utils.format('    {0}: {1};', r, styles[key][r]));
      });

      rules = rules.join('\n');
      innerHTML.push(Utils.format('{0} {\n{1}\n}', key, rules));
    });

    innerHTML = innerHTML.join('\n');
    if ( rawStyles ) {
      innerHTML += '\n' + rawStyles;
    }

    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'WMGeneratedStyles';
    style.innerHTML = innerHTML;
    document.getElementsByTagName('head')[0].appendChild(style);

    this._stylesheet = style;
  }

  /**
   * Destroy Window Manager self-contained CSS
   */
  destroyStylesheet() {
    if ( this._stylesheet ) {
      DOM.$remove(this._stylesheet);
    }
    this._stylesheet = null;
  }

  resize(ev, rect) {
    // Implement in your WM
    this._isResponsive = window.innerWidth <= 1024;

    this.onResize(ev);
  }

  /**
   * Whenever a window event occurs
   *
   * THIS IS IMPLEMENTED IN COREWM
   *
   * @param   {String}  ev      Event name
   * @param   {Window}  win     Window ref
   *
   * @return  {Boolean}
   */
  eventWindow(ev, win) {
    // Implement in your WM
    return false;
  }

  /**
   * Show Settings Window (Application)
   *
   * THIS IS IMPLEMENTED IN COREWM
   */
  showSettings() {
    // Implement in your WM
  }

  /**
   * Toggles fullscreen for given DOM element
   * @param {Node} el The element
   * @param {Boolean} t Fullscreen state
   */
  toggleFullscreen(el, t) {
    if ( typeof t === 'boolean' ) {
      triggerFullscreen(el, t);
    } else {
      const prev = this._$fullscreen;
      if ( prev  && prev !== el ) {
        triggerFullscreen(prev, false);
      }
      triggerFullscreen(el, prev !== el);
    }

    this._$fullscreen = el;
  }

  /////////////////////////////////////////////////////////////////////////////
  // EVENT HANDLERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * When Key Down Event received
   *
   * @param   {Event}        ev      DOM Event
   * @param   {Window}       win     Active window
   */
  onKeyDown(ev, win) {
    // Implement in your WM
  }

  /**
   * When orientation of device has changed
   *
   * @param   {Event}    ev             DOM Event
   * @param   {String}   orientation    Orientation string
   */
  onOrientationChange(ev, orientation) {
    console.info('ORIENTATION CHANGED', ev, orientation);

    document.body.setAttribute('data-orientation', orientation);

    this._onDisplayChange();
  }

  /**
   * When size of the device display has been changed
   *
   * @param   {Event}    ev             DOM Event
   */
  onResize(ev) {
    this._onDisplayChange();
    this._emit('resized');
  }

  /**
   * When session has been loaded
   *
   * @return {Boolean}
   */
  onSessionLoaded() {
    if ( this._sessionLoaded ) {
      return false;
    }

    this._sessionLoaded = true;
    return true;
  }

  /////////////////////////////////////////////////////////////////////////////
  // BASE EVENT HANDLERS
  /////////////////////////////////////////////////////////////////////////////

  _onMouseEnter(ev) {
    this._mouselock = true;
  }

  _onMouseLeave(ev) {
    const from = ev.relatedTarget || ev.toElement;
    if ( !from || from.nodeName === 'HTML' ) {
      this._mouselock = false;
    } else {
      this._mouselock = true;
    }
  }

  _onDisplayChange() {
    this._dcTimeout = clearTimeout(this._dcTimeout);
    this._dcTimeout = setTimeout(() => {
      if ( !this._windows ) {
        return;
      }

      this.getWindows().forEach((w) => {
        w._onResize();
        w._emit('resize');
      });
    }, 100);

    document.body.setAttribute('data-responsive', String(this._isResponsive));
  }

  _onOrientationChange(ev) {
    let orientation = 'landscape';
    if ( window.screen && window.screen.orientation ) {
      if ( window.screen.orientation.type.indexOf('portrait') !== -1 ) {
        orientation = 'portrait';
      }
    }

    this.onOrientationChange(ev, orientation);
  }

  _onHashChange(ev) {
    const hash = window.location.hash.substr(1);
    const spl = hash.split(/^([\w\.\-_]+)\:(.*)/);

    function getArgs(q) {
      const args = {};
      q.split('&').forEach(function(a) {
        const b = a.split('=');
        const k = decodeURIComponent(b[0]);
        args[k] = decodeURIComponent(b[1] || '');
      });
      return args;
    }

    if ( spl.length === 4 ) {
      const root = spl[1];
      const args = getArgs(spl[2]);

      if ( root ) {
        Process.getProcess(root).forEach(function(p) {
          p._onMessage('hashchange', {
            hash: hash,
            args: args
          }, {source: null});
        });
      }
    }
  }

  _onResize(ev) {
    clearTimeout(this._resizeTimeout);
    this._resizeTimeout = setTimeout(() => {
      const space = this.getWindowSpace();
      this.resize(ev, space);
    }, 100);
  }

  _onScroll(ev) {
    if ( ev.target === document || ev.target === document.body ) {
      ev.preventDefault();
      ev.stopPropagation();
      return false;
    }

    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
    return true;
  }

  _onFullscreen(ev) {
    try {
      const notif = Notification.getIcon('_FullscreenNotification');
      if ( notif ) {
        if ( !document.fullScreen && !document.mozFullScreen && !document.webkitIsFullScreen && !document.msFullscreenElement ) {
          notif.opts._isFullscreen = false;
          notif.setImage(Theme.getIcon('actions/view-fullscreen.png', '16x16'));
        } else {
          notif.opts._isFullscreen = true;
          notif.setImage(Theme.getIcon('actions/view-restore.png', '16x16'));
        }
      }
    } catch ( e ) {
      console.warn(e.stack, e);
    }
  }

  _onContextMenu(ev) {
    this.onContextMenu(ev);

    if ( DOM.$isFormElement(ev) ) {
      Menu.blur();
    } else {
      ev.preventDefault();
      return false;
    }

    return true;
  }

  _onMouseDown(ev) {
    if ( DOM.$isFormElement(ev) ) {
      this._$lastDomInput = ev.target;
    } else {
      if ( this._$lastDomInput ) {
        try {
          this._$lastDomInput.blur();
        } catch ( e ) {}

        this._$lastDomInput = null;
      }
    }
  }

  _onClick(ev) {
    let hitWindow, hitMenu;
    let el = ev.target;

    while ( el.parentNode ) {
      if ( el.tagName.match(/^GUI\-MENU/) ) {
        hitMenu = el;
      } else if (  el.tagName.match(/^APPLICATION\-WINDOW/) ) {
        hitWindow = true;
      }

      if ( hitWindow || hitMenu ) {
        break;
      }

      el = el.parentNode;
    }

    // We should hide the menu if the clicked entry does not match up with
    // the following conditions
    if ( hitMenu ) {
      if ( hitMenu.tagName === 'GUI-MENU-ENTRY'  ) {
        if ( hitMenu.getAttribute('data-disabled') !== 'true' ) {
          if ( !DOM.$hasClass(hitMenu, 'gui-menu-expand') ) {
            hitMenu = null;
          }
        }
      } else if ( hitMenu.tagName === 'GUI-MENU-BAR'  ) {
        hitMenu = null;
      }
    }

    if ( !hitMenu ) {
      Menu.blur();
    }

    // Blur menu if we click body
    if ( ev.target.tagName === 'BODY' ) {
      const win = this.getCurrentWindow();
      if ( win ) {
        win._blur();
      }
    }

    Theme.themeAction('event', [ev]);
  }

  _onKeyUp(ev) {
    const win = this.getCurrentWindow();

    this.onKeyUp(ev, win);

    if ( win ) {
      return win._onKeyEvent(ev, 'keyup');
    }

    return true;
  }

  _onKeyDown(ev) {
    const win = this.getCurrentWindow();

    const reacted = (() => {
      const combination = this.onKeyDown(ev, win);
      if ( win && !combination ) {
        win._onKeyEvent(ev, 'keydown');
      }
      return combination;
    })();

    if ( checkPrevent(ev, win) || reacted ) {
      ev.preventDefault();
    }

    return true;
  }

  _onKeyPress(ev) {
    if ( checkForbiddenKeyCombo(ev) ) {
      ev.preventDefault();
    }

    const win = this.getCurrentWindow();
    if ( win ) {
      return win._onKeyEvent(ev, 'keypress');
    }
    return true;
  }

  _onBeforeUnload(ev) {
    if ( getConfig('ShowQuitWarning') ) {
      return _('MSG_SESSION_WARNING');
    }
    return null;
  }

  _onError(message, url, linenumber, column, exception) {
    if ( typeof exception === 'string' ) {
      exception = null;
    }

    exception = exception || {
      name: 'window::onerror()',
      fileName: url,
      lineNumber: linenumber + ':' + column,
      message: message
    };

    console.warn('window::onerror()', arguments);

    OSjs.error(_('ERR_JAVASCRIPT_EXCEPTION'),
               _('ERR_JAVACSRIPT_EXCEPTION_DESC'),
               _('BUGREPORT_MSG'),
               exception,
               true );

    return false;
  }

  /////////////////////////////////////////////////////////////////////////////
  // GETTERS AND SETTERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get default Settings
   *
   * @return  {Object}      JSON Data
   */
  getDefaultSetting() {
    // Implement in your WM
    return null;
  }

  /**
   * Get panel
   *
   * @return {OSjs.Applications.CoreWM.Panel}
   */
  getPanel() {
    // Implement in your WM
    return null;
  }

  /**
   * Gets all panels
   *
   * @return  {OSjs.Packages.CoreWM.Panel[]}       Panel List
   */
  getPanels() {
    // Implement in your WM
    return [];
  }

  /**
   * Sets a setting
   *
   * @param   {String}  k       Key
   * @param   {*}       v       Value
   *
   * @return  {Boolean}             On success
   */
  setSetting(k, v) {
    return this._settings.set(k, v);
  }

  /**
   * Gets the rectangle for window space
   *
   * @return    {Object} rectangle
   */
  getWindowSpace() {
    return {
      top: 0,
      left: 0,
      width: document.body.offsetWidth,
      height: document.body.offsetHeight
    };
  }

  /**
   * Get next window position
   *
   * @return    {Object} rectangle
   */
  getWindowPosition() {
    const winCount = this._windows.reduce(function(count, win) {
      return win === null ? count : (count + 1);
    }, 0);
    return {x: 10 * winCount, y: 10 * winCount};
  }

  /**
   * Gets a setting
   *
   * @param   {String}    k     Key
   *
   * @return  {*}           Setting value or 'null'
   */
  getSetting(k) {
    return this._settings.get(k);
  }

  /**
   * Gets all settings
   *
   * @return    {Object}        JSON With all settings
   */
  getSettings() {
    return this._settings.get();
  }

  /**
   * Gets all Windows
   *
   * @return    {Window[]}           List of all Windows
   */
  getWindows() {
    return this._windows.filter((w) => !!w);
  }

  /**
   * Gets current Window
   *
   * @return {Window}        Current Window or 'null'
   */
  getCurrentWindow() {
    return this._currentWin;
  }

  /**
   * Sets the current Window
   *
   * @param   {Window}    w       Window
   */
  setCurrentWindow(w) {
    this._currentWin = w || null;
  }

  /**
   * Gets previous Window
   *
   * @return {Window}        Current Window or 'null'
   */
  getLastWindow() {
    return this._lastWin;
  }

  /**
   * Sets the last Window
   *
   * @param   {Window}    w       Window
   */
  setLastWindow(w) {
    this._lastWin = w || null;
  }

  /**
   * If the pointer is inside the browser window
   *
   * @return  {Boolean}
   */
  getMouseLocked() {
    return this._mouselock;
  }

}

