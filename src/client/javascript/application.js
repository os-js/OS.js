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
(function(Utils, API, Process) {
  'use strict';

  /**
   * Look at the 'ProcessEvent' for more.
   * The predefined events are as follows:
   *
   * <pre><code>
   *  init        When application was inited              => (settings, metadata, scheme)
   * </code></pre>
   * @typedef ApplicationEvent
   */

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application Class
   *
   * The 'Process arguments' is a JSON object with the arguments the
   * Applications was launched with. Just like 'argv'
   *
   * <pre><b>
   * YOU CANNOT CANNOT USE THIS VIA 'new' KEYWORD.
   * </b></pre>
   *
   * @summary Class used for basis as an Application.
   *
   * @param   {String}            name        Process name
   * @param   {Object}            args        Process arguments
   * @param   {Metadata}          metadata    Application metadata
   * @param   {Object}            [settings]  Application settings
   *
   * @link https://os.js.org/doc/tutorials/create-application.html
   * @link https://os.js.org/doc/tutorials/application-with-server-api.html
   *
   * @abstract
   * @constructor
   * @memberof OSjs.Core
   * @extends OSjs.Core.Process
   */
  function Application(name, args, metadata, settings) {
    console.group('Application::constructor()', arguments);

    /**
     * If Application was inited
     * @name __inited
     * @memberof OSjs.Core.Application#
     * @type {Boolean}
     */
    this.__inited     = false;

    /**
     * Registered main window
     * @name __mainwindow
     * @memberof OSjs.Core.Application#
     * @type {OSjs.Core.Window}
     */
    this.__mainwindow = null;

    /**
     * Scheme reference
     * @name __scheme
     * @memberof OSjs.Core.Application#
     * @type {OSjs.GUI.Scheme}
     */
    this.__scheme     = null;

    /**
     * Registered Windows
     * @name __windows
     * @memberof OSjs.Core.Application#
     * @type {OSjs.Core.Window[]}
     */
    this.__windows    = [];

    /**
     * Registered Settings
     * @name __settings
     * @memberof OSjs.Core.Application#
     * @type {Object}
     */
    this.__settings   = {};

    /**
     * If is in the process of destroying
     * @name __destroying
     * @memberof OSjs.Core.Application#
     * @type {Boolean}
     */
    this.__destroying = false;

    try {
      this.__settings = OSjs.Core.getSettingsManager().instance(name, settings || {});
    } catch ( e ) {
      console.warn('Application::construct()', 'An error occured while loading application settings', e);
      console.warn(e.stack);
      this.__settings = OSjs.Core.getSettingsManager().instance(name, {});
    }

    Process.apply(this, arguments);

    console.groupEnd();
  }

  Application.prototype = Object.create(Process.prototype);
  Application.constructor = Process;

  /**
   * Initialize the Application
   *
   * @function init
   * @memberof OSjs.Core.Application#
   *
   * @param   {Object}            settings      Settings JSON
   * @param   {Metadata}          metadata      Metadata JSON
   * @param   {OSjs.GUI.Scheme}   [scheme]      GUI Scheme instance
   */
  Application.prototype.init = function(settings, metadata, scheme) {

    var wm = OSjs.Core.getWindowManager();
    var self = this;

    function focusLastWindow() {
      var last;

      if ( wm ) {
        self.__windows.forEach(function(win, i) {
          if ( win ) {
            wm.addWindow(win);
            last = win;
          }
        });
      }

      if ( last ) {
        last._focus();
      }
    }

    if ( !this.__inited ) {
      console.debug('Application::init()', this.__pname);

      if ( scheme ) {
        this._setScheme(scheme);
      }

      this.__settings.set(null, settings);

      this.__inited = true;

      this.__evHandler.emit('init', [settings, metadata, scheme]);

      focusLastWindow();
    }
  };

  /**
   * Destroy the application
   *
   * @override
   * @function destroy
   * @memberof OSjs.Core.Application#
   * @see OSjs.Core.Process#destroy
   */
  Application.prototype.destroy = function(sourceWid) {
    if ( this.__destroying || this.__destroyed ) { // From 'process.js'
      return true;
    }
    this.__destroying = true;

    console.group('Application::destroy()', this.__pname);

    this.__windows.forEach(function(w) {
      try {
        if ( w && w._wid !== sourceWid ) {
          w.destroy();
        }
      } catch ( e ) {
        console.warn('Application::destroy()', e, e.stack);
      }
    });

    this.__mainwindow = null;
    this.__settings = {};
    this.__windows = [];

    if ( this.__scheme ) {
      this.__scheme.destroy();
    }
    this.__scheme = null;

    var result = Process.prototype.destroy.apply(this, arguments);
    console.groupEnd();
    return result;
  };

  /**
   * Application has received a message
   *
   * @override
   * @function _onMessage
   * @memberof OSjs.Core.Application#
   */
  Application.prototype._onMessage = function(msg, obj, args) {
    if ( this.__destroying || this.__destroyed ) {
      return false;
    }

    if ( msg === 'destroyWindow' ) {
      if ( obj._name === this.__mainwindow ) {
        this.destroy(obj._wid);
      } else {
        this._removeWindow(obj);
      }
    } else if ( msg === 'attention' ) {
      if ( this.__windows.length && this.__windows[0] ) {
        this.__windows[0]._focus();
      }
    }

    return Process.prototype._onMessage.apply(this, arguments);
  };

  /**
   * Default method for loading a Scheme file
   *
   * @TODO DEPRECATED This is kept for backward compability
   *
   * @function _loadScheme
   * @memberof OSjs.Core.Application#
   *
   * @param   {String}        s       Scheme filename
   * @param   {Function}      cb      Callback => fn(scheme)
   */
  Application.prototype._loadScheme = function(s, cb) {
    var scheme = OSjs.GUI.createScheme(this._getResource(s));
    scheme.load(function __onApplicationLoadScheme(error, result) {
      if ( error ) {
        console.error('Application::_loadScheme()', error);
      }
      cb(scheme);
    });
    this._setScheme(scheme);
  };

  /**
   * Add a window to the application
   *
   * This will automatically add it to the WindowManager and show it to you
   *
   * @function _addWindow
   * @memberof OSjs.Core.Application#
   *
   * @param   {OSjs.Core.Window}  w           The Window
   * @param   {Function}          [cb]        Callback for when window was successfully inited
   * @param   {Boolean}           [setmain]   Set if this is the main window (First window always will be)
   *
   * @return  {OSjs.Core.Window}
   */
  Application.prototype._addWindow = function(w, cb, setmain) {
    if ( !(w instanceof OSjs.Core.Window) ) {
      throw new TypeError('Application::_addWindow() expects Core.Window');
    }

    console.debug('Application::_addWindow()');

    this.__windows.push(w);
    if ( setmain || this.__windows.length === 1 ) {
      this.__mainwindow = w._name;
    }

    var wm = OSjs.Core.getWindowManager();
    if ( this.__inited ) {
      if ( wm ) {
        wm.addWindow(w);
      }

      if ( w._properties.start_focused ) {
        setTimeout(function() {
          w._focus();
        }, 5);
      }
    }

    (cb || function() {})(w, wm);

    return w;
  };

  /**
   * Removes given Window
   *
   * @function _removeWindow
   * @memberof OSjs.Core.Application#
   *
   * @param   {OSjs.Core.Window}      w     The Windo
   *
   * @return  {Boolean}
   */
  Application.prototype._removeWindow = function(w) {
    if ( !(w instanceof OSjs.Core.Window) ) {
      throw new TypeError('Application::_removeWindow() expects Core.Window');
    }

    var self = this;
    this.__windows.forEach(function(win, i) {
      if ( win ) {
        if ( win._wid === w._wid ) {
          console.debug('Application::_removeWindow()', w._wid);
          win.destroy();

          self.__windows.splice(i, 1);

          return false;
        }
      }
      return true;
    });
  };

  /**
   * Gets a Window by X
   *
   * If you specify 'tag' the result will end with an Array because
   * these are not unique.
   *
   * If you specify 'null' it will try to return the 'main' window.
   *
   * @function _getWindow
   * @memberof OSjs.Core.Application#
   *
   * @param   {String}    value      The value
   * @param   {Mixed}     key        The key to check for
   *
   * @return  {OSjs.Core.Window} Or null on error or nothing
   */
  Application.prototype._getWindow = function(value, key) {
    key = key || 'name';
    if ( value === null ) {
      value = this.__mainwindow;
    }

    var result = key === 'tag' ? [] : null;
    this.__windows.every(function(win, i) {
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
  };

  /**
   * Get a Window by Name
   *
   * @function _getWindowByName
   * @memberof OSjs.Core.Application#
   * @see OSjs.Core.Application#_getWindow
   *
   * @param {String}  name      Window Name
   */
  Application.prototype._getWindowByName = function(name) {
    return this._getWindow(name);
  };

  /**
   * Get Windows(!) by Tag
   *
   * @function _getWindowByTag
   * @memberof OSjs.Core.Application#
   * @see OSjs.Core.Application#_getWindow
   *
   * @param {String}  tag       Tag name
   *
   * @return {OSjs.Core.Window[]}
   */
  Application.prototype._getWindowsByTag = function(tag) {
    return this._getWindow(tag, 'tag');
  };

  /**
   * Get a list of all windows
   *
   * @function _getWindows
   * @memberof OSjs.Core.Application#
   *
   * @return {OSjs.Core.Window[]}
   */
  Application.prototype._getWindows = function() {
    return this.__windows;
  };

  /**
   * Get the "main" window
   *
   * @function _getMainWindow
   * @memberof OSjs.Core.Application#
   *
   * @return {OSjs.Core.Window}
   */
  Application.prototype._getMainWindow = function() {
    return this._getWindow(this.__mainwindow, 'name');
  };

  /**
   * Get the sessions JSON
   *
   * @function _getSettings
   * @memberof OSjs.Core.Application#
   *
   * @param   {String}    k       The settings key
   *
   * @return  {Object}    the current settings
   */
  Application.prototype._getSetting = function(k) {
    return this.__settings.get(k);
  };

  /**
   * Get the current application session data
   *
   * @function _getSessionData
   * @memberof OSjs.Core.Application#
   *
   * @return  {Object}    the current session data
   */
  Application.prototype._getSessionData = function() {
    var args = this.__args;
    var wins = this.__windows;
    var data = {name: this.__pname, args: args, windows: []};

    wins.forEach(function(win, i) {
      if ( win && win._properties.allow_session ) {
        data.windows.push({
          name      : win._name,
          dimension : win._dimension,
          position  : win._position,
          state     : win._state
        });
      }
    });

    return data;
  };

  /**
   * Gets the scheme instance
   *
   * @function _getScheme
   * @memberof OSjs.Core.Application#
   * @return OSjs.GUI.Scheme
   */
  Application.prototype._getScheme = function() {
    return this.__scheme;
  };

  /**
   * Set a setting
   *
   * @function _setSetting
   * @memberof OSjs.Core.Application#
   *
   * @param   {String}    k             Key
   * @param   {String}    v             Value
   * @param   {boolean}   save          Immediately save settings ?
   * @param   {Function}  saveCallback  If you save, this will be called when done
   */
  Application.prototype._setSetting = function(k, v, save, saveCallback) {
    save = (typeof save === 'undefined' || save === true);
    this.__settings.set(k, v, save ? (saveCallback || function() {}) : false);
  };

  /**
   * Sets the scheme instance
   *
   * @function _setScheme
   * @memberof OSjs.Core.Application#
   * @see OSjs.GUI.Scheme
   *
   * @param   {OSjs.GUI.Scheme}      s       Scheme Ref
   */
  Application.prototype._setScheme = function(s) {
    this.__scheme = s;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Application = Object.seal(Application);

})(OSjs.Utils, OSjs.API, OSjs.Core.Process);
