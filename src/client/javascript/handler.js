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
    var config = API.getDefaultSettings();

    this.connection = new OSjs.Helpers.ConnectionManager(config.Core.Connection, config.Core.APIURI);
    this.packages   = new OSjs.Helpers.PackageManager(Utils.checkdir(config.Core.MetadataURI));
    this.dialogs    = null;
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

    var config = API.getDefaultSettings();
    API.setLocale(config.Core.Locale);

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
    if ( this.connection ) {
      this.connection.destroy();
      this.connection = null;
    }

    this.packages = null;

    _handlerInstance = null;
  };

  /**
   * Called after successfull login in 'session.js'
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

    var root = API.getDefaultSettings().Core.RootURI;
    var url = root + 'client/dialogs.html';
    if ( OSjs.API.getDefaultSettings().Dist === 'dist' ) {
      url = root + 'dialogs.html';
    }
    var scheme = OSjs.GUI.createScheme(url);
    scheme.load(function(error, doc) {
      if ( error ) {
        console.warn('Handler::boot()', 'error loading dialog schemes', error);
      }

      self.dialogs = scheme;
      self.packages.load(function(presult, perror) {
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

      OSjs.Helpers.SettingsManager.set('UserSession', getSession())
      OSjs.Helpers.SettingsManager.save('UserSession', cb);
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

    var res = OSjs.Helpers.SettingsManager.get('UserSession');
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
  _Handler.prototype.callAPI = function(method, args, cbSuccess, cbError) {
    return this.connection.callAPI(method, args, cbSuccess, cbError);
  };

  //
  // Events
  //

  /**
   * Called when login() is finished
   *
   * @param   Object    userData      JSON User Data
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::onLogin()
   */
  _Handler.prototype.onLogin = function(userData, callback) {
    callback = callback || function() {};

    var config = API.getDefaultSettings();
    var found = Utils.getUserLocale();
    var curLocale = found || config.Core.Locale;

    this.userData = userData;

    // Ensure we get the user-selected locale configured from WM
    var result = OSjs.Helpers.SettingsManager.get('UserSettings');
    var locale = result ? result.Locale || curLocale : curLocale;

    API.setLocale(locale);

    OSjs.Helpers.SettingsManager.init(userData.settings, function() {
      callback();
    });
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

  _Handler.prototype.onWMLaunched = function(wm, callback) {
    var user = this.userData;

    function displayMenu(ev) {
      OSjs.API.createMenu([{
        title: API._('TITLE_SIGN_OUT'),
        onClick: function() {
          OSjs.Session.signOut();
        }
      }], ev);

      return false;
    }

    if ( wm ) {
      wm.createNotificationIcon('_HandlerUserNotification', {
        onContextMenu: displayMenu,
        onClick: displayMenu,
        onInited: function(el) {
          if ( el.firstChild ) {
            var img = document.createElement('img');
            img.title = API._('TITLE_SIGNED_IN_AS_FMT', user.username);
            img.alt = img.title;
            img.src = API.getIcon('status/avatar-default.png', '16x16');
            el.firstChild.appendChild(img);
          }
        }
      });
    }

    callback();
  };

  //
  // Packages
  //

  /**
   * Get the package manager
   *
   * @return    PackageManager        Package Manager instance
   *
   * @method    _Handler::getPackageManager()
   */
  _Handler.prototype.getPackageManager = function() {
    return this.packages;
  };

  /**
   * Get metadata for application by class-name
   *
   * @return  Object        JSON data
   *
   * @method  _Handler::getApplicationMetadata()
   */
  _Handler.prototype.getApplicationMetadata = function(name) {
    return this.packages.getPackage(name);
  };

  /**
   * Get all package metadata
   *
   * @return  Array       Array of JSON data
   *
   * @method  _Handler::getApplicationsMetadata()
   */
  _Handler.prototype.getApplicationsMetadata = function() {
    return this.packages.getPackages();
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

