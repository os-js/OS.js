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

(function(API, Utils) {
  'use strict';

  window.OSjs   = window.OSjs   || {};
  OSjs.Core     = OSjs.Core     || {};

  var _handlerInstance;

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT HANDLING CODE
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Default Handler Implementation
   *
   * Used for communication, resources, settings and session handling
   *
   * You can implement your own, see documentation on Wiki.
   *
   * NEVER CONSTRUCT YOUR OWN INTANCE! To get one use:
   * OSjs.Core.getHandler();
   *
   * @api   OSjs.Core._Handler
   * @class _Handler
   */
  var _Handler = function() {
    if ( _handlerInstance ) {
      throw Error('Cannot create another Handler Instance');
    }

    this.dialogs    = null;
    this.offline    = false;
    this.userData   = {
      id      : 0,
      username: 'root',
      name    : 'root user',
      groups  : ['root']
    };

    _handlerInstance = this;
  };

  /**
   * Called upon window loaded from 'main.js'
   *
   * @param   Function      callback        Callback function
   *
   * @see OSjs.API.initialize()
   *
   * @return  void
   *
   * @method  _Handler::init()
   */
  _Handler.prototype.init = function(callback) {
    console.info('Handler::init()');

    var self = this;
    var config = OSjs.Core.getConfig();
    API.setLocale(config.Locale);

    if ( typeof navigator.onLine !== 'undefined' ) {
      window.addEventListener('offline', function(ev) {
        self.onOffline();
      });
      window.addEventListener('online', function(ev) {
        self.onOnline();
      });
    }

    callback();
  };

  /**
   * Destroy the handler
   *
   * @return  void
   *
   * @method  _Handler::destroy()
   */
  _Handler.prototype.destroy = function() {
    var self = this;
    if ( typeof navigator.onLine !== 'undefined' ) {
      window.removeEventListener('offline', function(ev) {
        self.onOffline();
      });
      window.removeEventListener('online', function(ev) {
        self.onOnline();
      });
    }

    if ( this.dialogs ) {
      this.dialogs.destroy();
    }
    this.dialogs = null;

    _handlerInstance = null;
  };

  /**
   * Called when booting in `init.js`
   *
   * @param   Function      callback        Callback function
   *
   * @return  void
   *
   * @method  _Handler::boot()
   */
  _Handler.prototype.boot = function(callback) {
    var self = this;
    console.info('Handler::boot()');

    var root = OSjs.Core.getConfig().RootURI;
    var url = root + 'client/dialogs.html';
    if ( OSjs.Core.getConfig().Dist === 'dist' ) {
      url = root + 'dialogs.html';
    }

    this.dialogs = OSjs.GUI.createScheme(url);
    this.dialogs.load(function(error) {
      if ( error ) {
        console.warn('Handler::boot()', 'error loading dialog schemes', error);
      }

      OSjs.Core.getPackageManager().load(function(presult, perror) {
        callback(presult, perror);
      });
    });
  };

  /**
   * Default login method
   * NOTE: This is just a placeholder.
   *       To implement your own login handler, see the Wiki :)
   *
   * @param   String    username      Login username
   * @param   String    password      Login password
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::login()
   */
  _Handler.prototype.login = function(username, password, callback) {
    console.info('Handler::login()', username);
    this.onLogin({}, function() {
      callback(true);
    });
  };

  /**
   * Default logout method
   *
   * NOTE: You should call this in your implemented handler
   *       or else your data will not be stored
   *
   * @parm    boolean   save          Save session?
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::logout()
   */
  _Handler.prototype.logout = function(save, callback) {
    console.info('Handler::logout()');

    function saveSession(cb) {
      function getSession() {
        var procs = API.getProcesses();

        function getSessionSaveData(app) {
          var args = app.__args;
          var wins = app.__windows;
          var data = {name: app.__name, args: args, windows: []};

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
        }

        var data = [];
        procs.forEach(function(proc, i) {
          if ( proc && (proc instanceof OSjs.Core.Application) ) {
            data.push(getSessionSaveData(proc));
          }
        });
        return data;
      }

      OSjs.Core.getSettingsManager().set('UserSession', null, getSession(), cb);
    }

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.removeNotificationIcon('_HandlerUserNotification');
    }

    if ( save ) {
      saveSession(function() {
        callback(true);
      });
      return;
    }
    callback(true);
  };

  /**
   * Default method to restore last running session
   *
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::loadSession()
   */
  _Handler.prototype.loadSession = function(callback) {
    callback = callback || function() {};

    console.info('Handler::loadSession()');

    var res = OSjs.Core.getSettingsManager().get('UserSession');
    var list = [];
    (res || []).forEach(function(iter, i) {
      var args = iter.args;
      args.__resume__ = true;
      args.__windows__ = iter.windows || [];

      list.push({name: iter.name, args: args});
    });

    API.launchList(list, null, null, callback);
  };

  /**
   * Default method to perform a call to the backend (API)
   * Use this shorthand method: API.call() instead :)
   *
   * @see OSjs.API.call()
   *
   * @method  _Handler::callAPI()
   */
  _Handler.prototype.callAPI = function(method, args, cbSuccess, cbError, options) {
    if ( this.offline ) {
      cbError('You are currently off-line and cannot perform this operation!');
      return false;
    }
    if ( window.location.href.match(/^file\:\/\//) ) {
      cbError('You are currently running locally and cannot perform this operation!');
      return false;
    }

    args      = args      || {};
    cbSuccess = cbSuccess || function() {};
    cbError   = cbError   || function() {};

    console.group('Handler::callAPI()');
    console.log('Method', method);
    console.log('Arguments', args);
    console.groupEnd();

    var config = OSjs.Core.getConfig();
    var data = {
      url: config.APIURI,
      method: 'POST',
      json: true,
      body: {
        'method'    : method,
        'arguments' : args
      },
      onsuccess: function(/*response, request, url*/) {
        cbSuccess.apply(this, arguments);
      },
      onerror: function(/*error, response, request, url*/) {
        cbError.apply(this, arguments);
      }
    };

    if ( options ) {
      Object.keys(options).forEach(function(key) {
        data[key] = options[key];
      });
    }

    return Utils.ajax(data);
  };

  //
  // Events
  //

  /**
   * Called when login() is finished
   *
   * @param   Object    userData      JSON User Data
   * @param   Object    userSettings  JSON User Settings
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::onLogin()
   */
  _Handler.prototype.onLogin = function(userData, userSettings, callback) {
    callback = callback || function() {};

    var config = OSjs.Core.getConfig();
    var found = Utils.getUserLocale();
    var curLocale = found || config.Locale;

    this.userData = userData;

    // Ensure we get the user-selected locale configured from WM
    var result = OSjs.Core.getSettingsManager().get('UserSettings');
    var locale = result ? result.Locale || curLocale : curLocale;

    API.setLocale(locale);

    OSjs.Core.getSettingsManager().init(userSettings);

    callback();
  };

  /**
   * Called upon a VFS request
   *
   * You can use this to interrupt operations
   *
   * @param   String    vfsModule     VFS Module Name
   * @param   String    vfsMethod     VFS Method Name
   * @param   Object    vfsArguments  VFS Method Arguments
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::onVFSRequest()
   */
  _Handler.prototype.onVFSRequest = function(vfsModule, vfsMethod, vfsArguments, callback) {
    // If you want to interrupt or modify somehow
    callback();
  };

  /**
   * When browser goes online
   *
   * @method _Handler::onOnline();
   */
  _Handler.prototype.onOnline = function() {
    console.warn('Handler::onOnline()', 'Going online...');
    this.offline = false;

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are On-line!'});
    }
  };

  /**
   * When browser goes offline
   *
   * @method _Handler::onOffline();
   */
  _Handler.prototype.onOffline = function() {
    console.warn('Handler::onOffline()', 'Going offline...');
    this.offline = true;

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are Off-line!'});
    }
  };

  /**
   * Method for saving your settings
   *
   * @param   String      pool        (Optional) Which pool to store
   * @param   Object      storage     Storage tree
   * @param   Function    callback    Callback function
   *
   * @method _Handler::saveSettings();
   */
  _Handler.prototype.saveSettings = function(pool, storage, callback) {
    callback();
  };

  /**
   * Get data for logged in user
   *
   * @return  Object      JSON With user data
   *
   * @method  _Handler::getUserData()
   */
  _Handler.prototype.getUserData = function() {
    return this.userData;
  };


  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core._Handler = _Handler;
  OSjs.Core.Handler  = null;

  /**
   * Get running 'Handler' instance
   *
   * @return  Handler
   *
   * @api     OSjs.Core.getHandler()
   */
  OSjs.Core.getHandler = function() {
    return _handlerInstance;
  };

})(OSjs.API, OSjs.Utils);

