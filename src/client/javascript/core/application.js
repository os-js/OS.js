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

import Process from 'core/process';
import SettingsManager from 'core/settings-manager';
import WindowManager from 'core/window-manager';
import Window from 'core/window';

/**
 * Look at the 'ProcessEvent' for more.
 * The predefined events are as follows:
 *
 * <pre><code>
 *  init        When application was inited              => (settings, metadata)
 * </code></pre>
 * @typedef ApplicationEvent
 */

/////////////////////////////////////////////////////////////////////////////
// APPLICATION
/////////////////////////////////////////////////////////////////////////////

/**
 * Application Base Class
 *
 * @desc The class used for creating Applications.
 *
 * @param   {String}    name                         Process name
 * @param   {Object}    args                         Process arguments
 * @param   {Metadata}  metadata                     Application metadata
 * @param   {Object}    [settings]                   Application settings
 * @param   {Object}    [options]                    Options
 * @param   {Boolean}   [options.closeWithMain=true] Close application when main window closes
 * @param   {Boolean}   [options.closeOnEmpty=false] Close applications when all windows have been removed
 *
 * @link https://manual.os-js.org/packages/
 *
 * @abstract
 */
export default class Application extends Process {

  constructor(name, args, metadata, settings, options) {
    console.group('Application::constructor()', arguments);

    options = Object.assign({
      closeWithMain: true,
      closeOnEmpty: true
    }, options || {});

    super(...arguments);

    /**
     * If Application was inited
     * @type {Boolean}
     */
    this.__inited     = false;

    /**
     * Registered main window
     * @type {Window}
     */
    this.__mainwindow = null;

    /**
     * Registered Windows
     * @type {Window[]}
     */
    this.__windows    = [];

    /**
     * Registered Settings
     * @type {Object}
     */
    this.__settings   = null;

    /**
     * If is in the process of destroying
     * @type {Boolean}
     */
    this.__destroying = false;

    /**
     * Custom options
     * @type {Object}
     */
    this.__options = options;

    try {
      this.__settings = SettingsManager.instance(name, settings || {});
    } catch ( e ) {
      console.warn('Application::construct()', 'An error occured while loading application settings', e);
      console.warn(e.stack);
      this.__settings = SettingsManager.instance(name, {});
    }

    console.groupEnd();
  }

  /**
   * Initialize the Application
   *
   * @param   {Object}      settings      Settings JSON
   * @param   {Object}      metadata      Metadata JSON
   */
  init(settings, metadata) {

    const wm = WindowManager.instance;

    const focusLastWindow = () => {
      let last;

      if ( wm ) {
        this.__windows.forEach((win, i) => {
          if ( win ) {
            wm.addWindow(win);
            last = win;
          }
        });
      }

      if ( last ) {
        last._focus();
      }
    };

    if ( !this.__inited ) {
      console.debug('Application::init()', this.__pname);

      if ( this.__settings ) {
        this.__settings.set(null, settings);
      }

      this.__inited = true;

      this.__evHandler.emit('init', [settings, metadata]);

      focusLastWindow();
    }
  }

  /**
   * Destroy the application
   *
   * @override
   */
  destroy() {
    if ( this.__destroying || this.__destroyed ) { // From 'process.js'
      return true;
    }

    this.__destroying = true;

    console.group('Application::destroy()', this.__pname);

    this.__windows.forEach((w) => (w && w.destroy()));

    if ( this.__scheme && typeof this.__scheme.destroy === 'function' ) {
      this.__scheme.destroy();
    }

    this.__mainwindow = null;
    this.__settings = {};
    this.__windows = [];
    this.__scheme = null;

    const result = super.destroy(...arguments);
    console.groupEnd();
    return result;
  }

  /**
   * Application has received a message
   *
   * @param {String}    msg     Message
   * @param {Object}    obj     Message object
   * @param {Object}    args    Arguments
   * @override
   */
  _onMessage(msg, obj, args) {
    if ( this.__destroying || this.__destroyed ) {
      return false;
    }

    if ( msg === 'destroyWindow' ) {
      if ( !this.__destroying ) {
        this._removeWindow(obj);

        if ( this.__options.closeOnEmpty && !this.__windows.length ) {
          console.info('All windows removed, destroying application');
          this.destroy();
        } else if ( obj._name === this.__mainwindow ) {
          if ( this.__options.closeWithMain ) {
            console.info('Main window was closed, destroying application');
            this.destroy();
          }
        }
      }
    } else if ( msg === 'attention' ) {
      if ( this.__windows.length && this.__windows[0] ) {
        this.__windows[0]._focus();
      }
    }

    return super._onMessage(...arguments);
  }

  /**
   * Add a window to the application
   *
   * This will automatically add it to the WindowManager and show it to you
   *
   * @param   {Window}     w           The Window
   * @param   {Function}   [cb]        Callback for when window was successfully inited
   * @param   {Boolean}    [setmain]   Set if this is the main window (First window always will be)
   *
   * @return  {Window}
   */
  _addWindow(w, cb, setmain) {
    if ( !(w instanceof Window) ) {
      throw new TypeError('Application::_addWindow() expects Core.Window');
    }

    console.debug('Application::_addWindow()');

    this.__windows.push(w);
    if ( setmain || this.__windows.length === 1 ) {
      this.__mainwindow = w._name;
    }

    const wm = WindowManager.instance;
    if ( this.__inited ) {
      if ( wm ) {
        wm.addWindow(w);
      }

      if ( w._properties.start_focused ) {
        setTimeout(() => {
          w._focus();
        }, 5);
      }
    }

    (cb || function() {})(w, wm);

    return w;
  }

  /**
   * Removes given Window
   *
   * @param   {Window}      w     The Windo
   *
   * @return  {Boolean}
   */
  _removeWindow(w) {
    if ( !(w instanceof Window) ) {
      throw new TypeError('Application::_removeWindow() expects Core.Window');
    }

    const found = this.__windows.findIndex((win) => win && win._wid === w._wid);
    if ( found !== -1 ) {
      const win = this.__windows[found];

      console.debug('Application::_removeWindow()', win._wid);
      try {
        win.destroy();
      } catch ( e ) {
        console.warn(e);
      }

      this.__windows.splice(found, 1);
    }

    return found !== -1;
  }

  /**
   * Gets a Window by X
   *
   * If you specify 'tag' the result will end with an Array because
   * these are not unique.
   *
   * If you specify 'null' it will try to return the 'main' window.
   *
   * @param   {String}    value      The value
   * @param   {String}    key        The key to check for
   *
   * @return  {Window} Or null on error or nothing
   */
  _getWindow(value, key) {
    key = key || 'name';
    if ( value === null ) {
      value = this.__mainwindow;
    }

    let result = key === 'tag' ? [] : null;
    this.__windows.every((win, i) => {
      if ( win ) {
        if ( win['_' + key] === value ) {
          if ( key === 'tag' ) {
            result.push(win);
          } else {
            result = win;
            return false;
          }
        }
      }
      return true;
    });

    return result;
  }

  /**
   * Get a Window by Name
   *
   * @see Application#_getWindow
   *
   * @param {String}  name      Window Name
   *
   * @return {Window}
   */
  _getWindowByName(name) {
    return this._getWindow(name);
  }

  /**
   * Get Windows(!) by Tag
   *
   * @see Application#_getWindow
   *
   * @param {String}  tag       Tag name
   *
   * @return {Window[]}
   */
  _getWindowsByTag(tag) {
    return this._getWindow(tag, 'tag');
  }

  /**
   * Get a list of all windows
   *
   * @return {Window[]}
   */
  _getWindows() {
    return this.__windows;
  }

  /**
   * Get the "main" window
   *
   * @return {Window}
   */
  _getMainWindow() {
    return this._getWindow(this.__mainwindow, 'name');
  }

  /**
   * Get the sessions JSON
   *
   * @param   {String}    k       The settings key
   *
   * @return  {Object}    the current settings
   */
  _getSetting(k) {
    return this.__settings ? this.__settings.get(k) : null;
  }

  /**
   * Get the current application session data
   *
   * @return  {Object}    the current session data
   */
  _getSessionData() {
    const args = this.__args;
    const wins = this.__windows;
    const data = {name: this.__pname, args: args, windows: []};

    wins.forEach((win, i) => {
      if ( win && win._properties.allow_session ) {
        data.windows.push({
          name: win._name,
          dimension: win._dimension,
          position: win._position,
          state: win._state
        });
      }
    });

    return data;
  }

  /**
   * Set a setting
   *
   * @param   {String}              k             Key
   * @param   {String}              v             Value
   * @param   {Boolean|Function}    [save=true]   Save given setting(s) (can be a callback function)
   */
  _setSetting(k, v, save) {
    if ( typeof save === 'undefined' ) {
      save = true;
    }
    if ( arguments.length === 4 && typeof arguments[3] === 'function' ) {
      save = arguments[3];
    }
    if ( this.__settings ) {
      this.__settings.set(k, v, save);
    }
  }

}

