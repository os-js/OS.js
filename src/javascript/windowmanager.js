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
(function(Utils, API, Process, Window, DialogWindow) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};

  var _WM;             // Running Window Manager process

  /**
   * Get viewport
   * @return Object
   */
  function _getWindowSpace() {
    return {
      top    : 0,
      left   : 0,
      width  : window.innerWidth,
      height : window.innerHeight
    };
  }

  /////////////////////////////////////////////////////////////////////////////
  // API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get the current WindowManager instance
   *
   * @return WindowManager
   * @api OSjs.API.getWMInstance()
   */
  function getWMInstance() {
    return _WM;
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOW MANAGER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * WindowManager Process Class
   * The default implementation of this is in apps/CoreWM/main.js
   *
   * NEVER CONSTRUCT YOUR OWN INTANCE! To get one use:
   * OSjs.API.getWMInstance();
   *
   * @see     OSjs.Core.Process
   * @api     OSjs.Core.WindowManager
   * @extends Process
   * @class
   */
  var WindowManager = function(name, ref, args, metadata) {
    console.group('OSjs::Core::WindowManager::__construct()');
    console.log('Name', name);
    console.log('Arguments', args);

    this._$notifications = null;
    this._windows        = [];
    this._settings       = {};
    this._currentWin     = null;
    this._lastWin        = null;

    // Important for usage as "Application"
    this.__name    = (name || 'WindowManager');
    this.__path    = metadata.path;
    this.__iter    = metadata.iter;

    Process.apply(this, [this.__name]);

    _WM = (ref || this);

    console.groupEnd();
  };

  WindowManager.prototype = Object.create(Process.prototype);

  /**
   * Destroy the WindowManager
   *
   * @see Process::destroy()
   *
   * @method    WindowManager::destroy()
   */
  WindowManager.prototype.destroy = function() {
    console.log('OSjs::Core::WindowManager::destroy()');

    // Destroy all windows
    var self = this;
    this._windows.forEach(function(win, i) {
      if ( win ) {
        win.destroy();
        self._windows[i] = null;
      }
    });
    this._windows = [];
    this._currentWin = null;
    this._lastWin = null;

    _WM = null;

    return Process.prototype.destroy.apply(this, []);
  };


  /**
   * Initialize the WindowManager
   *
   * @return  void
   *
   * @method  WindowManager::init()
   */
  WindowManager.prototype.init = function() {
    console.log('OSjs::Core::WindowManager::init()');
  };

  /**
   * Get a Window by name
   *
   * @param   String      name        Window name
   *
   * @return  Window
   *
   * @method  WindowManager::getWindow()
   */
  WindowManager.prototype.getWindow = function(name) {
    var result = null;
    this._windows.forEach(function(w) {
      if ( w && w._name === name ) {
        result = w;
      }
      return w ? false : true;
    });
    return result;
  };

  /**
   * Add a Window
   *
   * @param   Window      w         Window reference
   * @param   boolean     focus     Focus the window
   *
   * @return  Window                The added window
   *
   * @method  WindowManager::addWindow()
   */
  WindowManager.prototype.addWindow = function(w, focus) {
    if ( !(w instanceof Window) ) {
      console.warn('OSjs::Core::WindowManager::addWindow()', 'Got', w);
      throw new Error('addWindow() expects a "Window" class');
    }
    console.log('OSjs::Core::WindowManager::addWindow()');

    w.init(this, w._appRef);
    this._windows.push(w);
    if ( focus === true || (w instanceof DialogWindow) ) {
      w._focus();
    }

    w._inited();

    return w;
  };

  /**
   * Remove a Window
   *
   * @param   Window      w         Window reference
   *
   * @return  boolean               On success
   *
   * @method  WindowManager::removeWindow()
   */
  WindowManager.prototype.removeWindow = function(w) {
    if ( !(w instanceof Window) ) {
      console.warn('OSjs::Core::WindowManager::removeWindow()', 'Got', w);
      throw new Error('removeWindow() expects a "Window" class');
    }
    console.log('OSjs::Core::WindowManager::removeWindow()');

    var result = false;
    var self = this;
    this._windows.forEach(function(win, i) {
      if ( win && win._wid === w._wid ) {
        self._windows[i] = null;
        result = true;
        return false;
      }
      return true;
    });
    return result;
  };

  /**
   * Set WindowManager settings
   *
   * @param   Object      settings        JSON Settings
   * @param   boolean     force           If forced, no merging will take place
   *
   * @return  boolean                     On success
   *
   * @method  WindowManager::applySettings()
   */
  WindowManager.prototype.applySettings = function(settings, force) {
    settings = settings || {};
    console.log('OSjs::Core::WindowManager::applySettings', 'forced?', force);

    if ( force ) {
      this._settings = settings;
    } else {
      this._settings = Utils.mergeObject(this._settings, settings);
    }

    return true;
  };


  /**
   * When Key Down Event received
   *
   * @param   DOMEvent      ev      DOM Event
   * @param   Window        win     Active window
   *
   * @return  void
   *
   * @method  WindowManager::onKeyDown()
   */
  WindowManager.prototype.onKeyDown = function(ev, win) {
    // Implement in your WM
  };

  WindowManager.prototype.resize = function(ev, rect) {
    // Implement in your WM
  };

  WindowManager.prototype.notification = function() {
    // Implement in your WM
  };

  WindowManager.prototype.createNotificationIcon = function() {
    // Implement in your WM
  };

  WindowManager.prototype.destroyNotificationIcon = function() {
    // Implement in your WM
  };

  WindowManager.prototype.eventWindow = function(ev, win) {
    // Implement in your WM
  };

  WindowManager.prototype.showSettings = function() {
    // Implement in your WM
  };

  /**
   * Get default Settings
   *
   * @return  Object      JSON Data
   *
   * @method  WindowManager::getDefaultSettings()
   */
  WindowManager.prototype.getDefaultSetting = function() {
    // Implement in your WM
    return null;
  };

  /**
   * Get panel
   *
   * @method  WindowManager::getPanel()
   */
  WindowManager.prototype.getPanel = function() {
    // Implement in your WM
    return null;
  };

  /**
   * Gets all panels
   *
   * @return  Array       Panel List
   *
   * @method  WindowManager::getPanels()
   */
  WindowManager.prototype.getPanels = function() {
    // Implement in your WM
    return [];
  };

  /**
   * Gets current theme
   *
   * @return  String      Theme name or 'null'
   *
   * @method  WindowManager::getTheme()
   */
  WindowManager.prototype.getTheme = function() {
    // Implement in your WM
    return null;
  };

  /**
   * Gets a list of themes
   *
   * @return  Array   The list of themes
   *
   * @method  WindowManager::getThemes()
   */
  WindowManager.prototype.getThemes = function() {
    // Implement in your WM
    return [];
  };

  /**
   * Sets a setting
   *
   * @param   String      k       Key
   * @param   Mixed       v       Value
   *
   * @return  boolean             On success
   *
   * @method  WindowManager::setSetting()
   */
  WindowManager.prototype.setSetting = function(k, v) {
    if ( v !== null ) {
      if ( typeof this._settings[k] !== 'undefined' ) {
        if ( (typeof this._settings[k] === 'object') && !(this._settings[k] instanceof Array) ) {
          if ( typeof v === 'object' ) {
            Object.keys(v).forEach(function(i) {
              if ( this._settings[k].hasOwnProperty(i) ) {
                if ( v[i] !== null ) {
                  this._settings[k][i] = v[i];
                }
              }
            });
            return true;
          }
        } else {
          this._settings[k] = v;
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Gets the rectangle for window space
   *
   * @return    Object {top:, left:, width:, height:}
   *
   * @method    WindowManager::getWindowSpace()
   */
  WindowManager.prototype.getWindowSpace = function() {
    return _getWindowSpace();
  };

  /**
   * Get next window position
   *
   * @return    Object    {x:, y:}
   *
   * @method    WindowManager::getWindowPosition()
   */
  WindowManager.prototype.getWindowPosition = (function() {
    var _LNEWX = 0;
    var _LNEWY = 0;

    return function() {
      if ( _LNEWY >= (window.innerHeight - 100) ) { _LNEWY = 0; }
      if ( _LNEWX >= (window.innerWidth - 100) )  { _LNEWX = 0; }
      return {x: _LNEWX+=10, y: _LNEWY+=10};
    };
  })();

  /**
   * Gets a setting
   *
   * @param   String    k     Key
   *
   * @return  Mixed           Setting value or 'null'
   *
   * @method  WindowManager::getSetting()
   */
  WindowManager.prototype.getSetting = function(k) {
    if ( typeof this._settings[k] !== 'undefined' ) {
      return this._settings[k];
    }
    return null;
  };

  /**
   * Gets all settings
   *
   * @return    Object        JSON With all settings
   *
   * @method    WindowManager::getSettings()
   */
  WindowManager.prototype.getSettings = function() {
    return this._settings;
  };

  /**
   * Gets all Windows
   *
   * @return    Array           List of all Windows
   *
   * @method    WindowManager::getWindows()
   */
  WindowManager.prototype.getWindows = function() {
    return this._windows;
  };

  /**
   * Gets current Window
   *
   * @return      Window        Current Window or 'null'
   *
   * @method      WindowManager::getCurrentWindow()
   */
  WindowManager.prototype.getCurrentWindow = function() {
    return this._currentWin;
  };

  /**
   * Sets the current Window
   *
   * @param   Window    w       Window
   * @return  void
   * @method  WindowManager::setCurrentWindow()
   */
  WindowManager.prototype.setCurrentWindow = function(w) {
    this._currentWin = w || null;
  };

  /**
   * Gets previous Window
   *
   * @return      Window        Current Window or 'null'
   *
   * @method      WindowManager::getLastWindow()
   */
  WindowManager.prototype.getLastWindow = function() {
    return this._lastWin;
  };

  /**
   * Sets the last Window
   *
   * @param   Window    w       Window
   * @return  void
   * @method  WindowManager::setLastWindow()
   */
  WindowManager.prototype.setLastWindow = function(w) {
    this._lastWin = w || null;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.WindowManager     = WindowManager;

  OSjs.API.getWMInstance      = getWMInstance;

})(OSjs.Utils, OSjs.API, OSjs.Core.Process, OSjs.Core.Window, OSjs.Core.DialogWindow);
