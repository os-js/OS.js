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
   * @extends Process
   * @class
   */
  var Application = function(name, args, metadata, settings) {
    console.group('OSjs::Core::Application::__construct()');
    this.__name       = name;
    this.__label      = metadata.name;
    this.__path       = metadata.path;
    this.__scope      = metadata.scope || 'system';
    this.__iter       = metadata.className;
    this.__destroyed  = false;
    this.__running    = true;
    this.__inited     = false;
    this.__windows    = [];
    this.__args       = args || {};
    this.__settings   = settings || {};
    this.__metadata   = metadata;

    Process.apply(this, [name]);

    console.log('Name', this.__name);
    console.log('Args', this.__args);
    console.groupEnd();
  };

  Application.prototype = Object.create(Process.prototype);

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
    console.log('OSjs::Core::Application::init()', this.__name);

    if ( settings ) {
      this.__settings = OSjs.Utils.mergeObject(this.__settings, settings);
    }

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
    console.log('OSjs::Core::Application::destroy()', this.__name);

    var i;
    while ( this.__windows.length ) {
      i = this.__windows.pop();
      if ( i ) {
        i.destroy();
      }
    }

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
    } else if ( msg === 'attention' ) {
      if ( this.__windows.length ) {
        if ( this.__windows[0] ) {
          this.__windows[0]._focus();
        }
      }
    }
  };

  /**
   * Call the ApplicationAPI
   *
   * This is used for calling 'api.php' or 'api.js' in your Application.
   *
   * @param   String      method      Name of method
   * @param   Object      args        Arguments in JSON
   * @param   Function    onSuccess   When request is done callback fn(result)
   * @param   Function    onError     When an error occured fn(error)
   *
   * @return  boolean
   *
   * @method  Application::_call()
   */
  Application.prototype._call = function(method, args, onSuccess, onError) {
    var self = this;
    onSuccess = onSuccess || function() {};
    onError = onError || function(err) {
      err = err || 'Unknown error';
      OSjs.API.error(OSjs.API._('ERR_APP_API_ERROR'),
                     OSjs.API._('ERR_APP_API_ERROR_DESC_FMT', self.__name, method),
                     err);
    };
    return OSjs.API.call('application', {'application': this.__iter, 'path': this.__path, 'method': method, 'arguments': args}, onSuccess, onError);
  };

  /**
   * Wrapper for creating dialogs
   *
   * Using this function will add them as children, making sure they will
   * be destroyed on close.
   *
   * @param   String    className     ClassName in OSjs.Dialogs namespace
   * @param   Array     args          Array of arguments for constructor
   * @param   Window    parentClass   The parent window
   *
   * @return  Window                  Or false on error
   *
   * @method  Application::_createDialog()
   */
  Application.prototype._createDialog = function(className, args, parentClass) {
    if ( OSjs.Dialogs[className] ) {

      var w = Object.create(OSjs.Dialogs[className].prototype);
      OSjs.Dialogs[className].apply(w, args);

      if ( parentClass && (parentClass instanceof OSjs.Core.Window) ) {
        parentClass._addChild(w);
      }

      this._addWindow(w);
      return w;
    }
    return false;
  };

  /**
   * Add a window to the application
   *
   * This will automatically add it to the WindowManager and show it to you
   *
   * @param   Window    w     The Window
   *
   * @return  Window
   *
   * @method  Application::_addWindow()
   */
  Application.prototype._addWindow = function(w) {
    if ( !(w instanceof OSjs.Core.Window) ) { throw new Error('Application::_addWindow() expects Window'); }
    console.info('OSjs::Core::Application::_addWindow()');
    this.__windows.push(w);

    if ( this.__inited ) {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.addWindow(w);
      }
      if ( w._properties.start_focused ) {
        setTimeout(function() {
          w._focus();
        }, 5);
      }
    }

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
    if ( !(w instanceof OSjs.Core.Window) ) { throw new Error('Application::_removeWindow() expects Window'); }

    var self = this;
    this.__windows.forEach(function(win, i) {
      if ( win ) {
        if ( win._wid === w._wid ) {
          console.info('OSjs::Core::Application::_removeWindow()', w._wid);
          win.destroy();
          //this.__windows[i] = null;
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
   * @param   String    checkfor      The argument to check for
   * @param   Mixed     key           What to match against
   *
   * @return  Window                  Or null on error or nothing
   *
   * @method  Application::_getWindow()
   */
  Application.prototype._getWindow = function(checkfor, key) {
    key = key || 'name';

    var result = key === 'tag' ? [] : null;
    this.__windows.forEach(function(win, i) {
      if ( win ) {
        if ( win['_' + key] === checkfor ) {
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
   * Get the sessions JSON
   *
   * @return  Object    the current settings
   *
   * @method  Application::_getSettings()
   */
  Application.prototype._getSetting = function(k) {
    return this.__settings[k];
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
    this.__settings[k] = v;

    var handler = OSjs.Core.getHandler();
    if ( save && handler ) {
      handler.setApplicationSettings(this.__name, this.__settings, saveCallback);
    }
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
