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
(function(Utils, API, Process) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application Class
   *
   * The 'Process arguments' is a JSON object with the arguments the
   * Applications was launched with. Just like 'argv'
   *
   * @param   String    name      Process name
   * @param   Object    args      Process arguments
   * @param   Object    metadata  Application metadata
   * @param   Object    settings  Application settings
   *
   * @api     OSjs.Core.Application
   * @link    http://os.js.org/doc/tutorials/create-application.html
   * @link    http://os.js.org/doc/tutorials/application-with-server-api.html
   * @extends Process
   * @class
   */
  var Application = function(name, args, metadata, settings) {
    console.group('Application::constructor()');
    this.__destroyed  = false;
    this.__running    = true;
    this.__inited     = false;
    this.__mainwindow = null;
    this.__scheme     = null;
    this.__windows    = [];
    this.__settings   = {};

    try {
      this.__settings = OSjs.Core.getSettingsManager().instance(name, settings || {});
    } catch ( e ) {
      console.warn('Application::construct()', 'An error occured while loading application settings', e);
      console.warn(e.stack);
      this.__settings = OSjs.Core.getSettingsManager().instance(name, {});
    }

    Process.apply(this, arguments);

    console.groupEnd();
  };

  Application.prototype = Object.create(Process.prototype);
  Application.constructor = Process;

  /**
   * Initialize the Application
   *
   * @param   Object    settings      Settings JSON
   * @param   Object    metadata      Metadata JSON
   *
   * @return  void
   *
   * @method  Application::init()
   */
  Application.prototype.init = function(settings, metadata) {
    console.debug('Application::init()', this.__pname);

    this.__settings.set(null, settings);

    if ( this.__windows.length ) {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        var last = null;

        this.__windows.forEach(function(win, i) {
          if ( win ) {
            wm.addWindow(win);
            last = win;
          }
        });

        if ( last ) { last._focus(); }
      }
    }

    this.__inited = true;
  };

  /**
   * Destroy the application
   *
   * @see Process::destroy()
   *
   * @method    Application::destroy()
   */
  Application.prototype.destroy = function(kill) {
    if ( this.__destroyed ) { return true; }
    this.__destroyed = true;

    console.debug('Application::destroy()', this.__pname);

    if ( this.__scheme ) {
      this.__scheme.destroy();
    }

    this.__windows.forEach(function(w) {
      if ( w ) {
        w.destroy();
      }
    });

    this.__mainwindow = null;
    this.__settings = {};
    this.__windows = [];
    this.__scheme = null;

    return Process.prototype.destroy.apply(this, arguments);
  };

  /**
   * Application has received a message
   *
   * @param   Object    obj       Where it came from
   * @param   String    msg       Name of message
   * @param   Object    args      Message arguments
   *
   * @return  void
   *
   * @method  Application::_onMessage()
   */
  Application.prototype._onMessage = function(obj, msg, args) {
    if ( !msg ) { return; }

    if ( msg === 'destroyWindow' ) {
      this._removeWindow(obj);

      if ( obj && obj._name === this.__mainwindow ) {
        this.destroy();
      }

    } else if ( msg === 'attention' ) {
      if ( this.__windows.length && this.__windows[0] ) {
        this.__windows[0]._focus();
      }
    }
  };

  /**
   * Add a window to the application
   *
   * This will automatically add it to the WindowManager and show it to you
   *
   * @param   Window    w         The Window
   * @param   Function  cb        (Optional) Callback for when window was successfully inited
   * @param   boolean   setmain   (Optional) Set if this is the main window (First window always will be)
   *
   * @return  Window
   *
   * @method  Application::_addWindow()
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
   * @param   Window      w     The Windo
   *
   * @return  boolean
   *
   * @method  Application::_removeWindow()
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
   * @param   String    value      The value
   * @param   Mixed     key        The key to check for
   *
   * @return  Window               Or null on error or nothing
   *
   * @method  Application::_getWindow()
   */
  Application.prototype._getWindow = function(value, key) {
    key = key || 'name';
    if ( value === null ) {
      value = this.__mainwindow;
    }

    var result = key === 'tag' ? [] : null;
    this.__windows.forEach(function(win, i) {
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
   * @see Application::_getWindow()
   *
   * @method Application::_getWindowsByName()
   */
  Application.prototype._getWindowByName = function(name) {
    return this._getWindow(name);
  };

  /**
   * Get Windows(!) by Tag
   *
   * @see Application::_getWindow()
   * @return Array
   *
   * @method Application::_getWindowsByTag()
   */
  Application.prototype._getWindowsByTag = function(tag) {
    return this._getWindow(tag, 'tag');
  };

  /**
   * Get a list of all windows
   *
   * @retrun Array
   *
   * @method Application::_getWindows()
   */
  Application.prototype._getWindows = function() {
    return this.__windows;
  };

  /**
   * Get the "main" window
   *
   * @method  Application::_getMainWindow()
   * @return OSjs.Core.Window
   */
  Application.prototype._getMainWindow = function() {
    return this._getWindow(this.__mainwindow, 'name');
  };

  /**
   * Get the sessions JSON
   *
   * @return  Object    the current settings
   *
   * @method  Application::_getSettings()
   */
  Application.prototype._getSetting = function(k) {
    return this.__settings.get(k);
  };

  /**
   * Set a setting
   *
   * @param   String    k             Key
   * @param   String    v             Value
   * @param   boolean   save          Immediately save settings ?
   * @param   Function  saveCallback  If you save, this will be called when done
   *
   * @return  void
   *
   * @method  Application::_setSetting()
   */
  Application.prototype._setSetting = function(k, v, save, saveCallback) {
    save = (typeof save === 'undefined' || save === true);
    this.__settings.set(k, v, save ? (saveCallback || function() {}) : false);
  };

  /**
   * Sets the scheme instance
   *
   * @param   UIScheme      s       Scheme Ref
   *
   * @see UIScheme
   * @method Application::_setScheme()
   */
  Application.prototype._setScheme = function(s) {
    this.__scheme = s;
  };

  /**
   * Get a launch/session argument
   *
   * @return  Mixed     Argument value or null
   *
   * @method  Application::_getArgument()
   */
  Application.prototype._getArgument = function(k) {
    return typeof this.__args[k] === 'undefined' ? null : this.__args[k];
  };

  /**
   * Get all launch/session argument
   *
   * @return  Array
   *
   * @method  Application::_getArguments()
   */
  Application.prototype._getArguments = function() {
    return this.__args;
  };

  /**
   * Set a launch/session argument
   *
   * @param   String    k             Key
   * @param   String    v             Value
   *
   * @return  void
   *
   * @method  Application::_setArgument()
   */
  Application.prototype._setArgument = function(k, v) {
    this.__args[k] = v;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Application       = Application;

})(OSjs.Utils, OSjs.API, OSjs.Core.Process);
