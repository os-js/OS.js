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
    this.config     = API.getDefaultSettings();
    this.settings   = new OSjs.Helpers.SettingsManager();
    this.connection = new OSjs.Helpers.ConnectionManager(this.config.Core.Connection, this.config.Core.APIURI);
    this.packages   = new OSjs.Helpers.PackageManager(Utils.checkdir(this.config.Core.MetadataURI));
    this.user       = new OSjs.Helpers.UserSession(this.config.Core.DefaultUser);
    this.dialogs    = null;

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
    console.info('OSjs::_Handler::init()');

    API.setLocale(this.config.Core.Locale);

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

    this.user     = null;
    this.packages = null;
    this.settings = null;
    this.config   = {};

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
    console.info('OSjs::_Handler::boot()');

    // TODO
    var url = '/js/dialogs/schemes.html';
    var scheme = OSjs.API.createScheme(url);
    scheme.load(function(error, doc) {
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
    console.info('OSjs::_Handler::login()', username);
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
    console.info('OSjs::_Handler::logout()');

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.removeNotificationIcon('_HandlerUserNotification');
    }

    if ( save ) {
      var session = this.user ? this.user.getSession() : [];
      this.setUserSession(session, function() {
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

    console.info('OSjs::_Handler::loadSession()');

    var self = this;
    this.getUserSession(function(res) {
      if ( res ) {
        self.user.loadSession(res, callback);
      }
    });
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

    var found = Utils.getUserLocale();
    var curLocale = found || this.config.Core.Locale;

    function _finished(locale) {
      API.setLocale(locale || curLocale);
      if ( callback ) {
        callback();
      }
    }

    this.user.setUserData(userData);

    // Ensure we get the user-selected locale configured from WM
    this.getUserSettings('Core', function(result) {
      var locale = null;
      if ( result ) {
        if ( (typeof result.Locale !== 'undefined') && result.Locale ) {
          locale = result.Locale;
        }
      }
      _finished(locale);
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
    var user = this.user.getUserData();

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
   * Get a list of application supporting mime type
   *
   *
   * @param   VFS.File  file      File
   * @param   boolean   forceList Force entry to show up
   * @param   Function  callback  Callback function
   *
   * @return  void
   *
   * @method  _Handler::getApplicationNameByFile()
   */
  _Handler.prototype.getApplicationNameByFile = function(file, forceList, callback) {
    if ( !(file instanceof OSjs.VFS.File) ) {
      throw new Error('This function excepts a OSjs.VFS.File object');
    }

    var pacman = this.packages;
    this.getSetting('defaultApplication', file.mime, function(val) {
      console.debug('OSjs::_Handler::getApplicationNameByFile()', 'default application', val);
      if ( !forceList && val ) {
        if ( pacman.getPackage(val) ) {
          callback([val]);
          return;
        }
      }
      callback(pacman.getPackagesByMime(file.mime));
    });
  };

  //
  // Settings and Sessions
  //

  /**
   * Set the default application for given mime type
   *
   * @param   String    mime      MIME Type
   * @param   String    app       Application name
   * @param   Function  callback  Callback function
   *
   * @return  void
   *
   * @method  _Handler::setDefaultApplication()
   */
  _Handler.prototype.setDefaultApplication = function(mime, app, callback) {
    callback = callback || function() {};
    console.debug('OSjs::_Handler::setDefaultApplication()', mime, app);
    this.setSetting('defaultApplication', mime, app, callback);
  };

  /**
   * Internal method for saving settings (wrapper)
   * NOTE: This is should be called from the implemented handler
   *       See 'demo' handler for example
   *
   * @param   Function  callback  Callback function
   *
   * @return  void
   *
   * @method  _Handler::saveSettings()
   */
  _Handler.prototype.saveSettings = function(callback) {
    console.debug('OSjs::_Handler::saveSettings()');
    callback.call(this, true);
  };

  /**
   * Sets a setting
   *
   * @param   String    category      The group/category of setting
   * @param   String    name          The setting key
   * @param   Mixed     value         The setting value
   * @param   Function  callback      Callback function
   * @param   boolean   save          Also save settings? (default=true)
   * @param   boolean   merge         Merge instead of set?
   *
   * @return  void
   *
   * @method  _Handler::setSetting()
   */
  _Handler.prototype.setSetting = function(category, name, value, callback, save, merge) {
    save = (typeof save === 'undefined' || save === true);
    callback = callback || function() {};
    var stored = this.settings.set(category, name, value, merge);
    if ( save ) {
      this.saveSettings(function() {
        callback.call(this, stored);
      });
    } else {
      callback.call(this, stored);
    }
  };

  /**
   * Gets a setting
   *
   * @param   String    category      The group/category of setting
   * @param   String    name          The setting key
   * @param   Function  callback      Callback function
   * @param   Mixed     defaultValue  Use as default if none found
   *
   * @return  void
   *
   * @method  _Handler::getSetting()
   */
  _Handler.prototype.getSetting = function(category, name, callback, defaultValue) {
    callback = callback || function() {};
    callback.call(this, this.settings.get(category, name, defaultValue));
  };

  /**
   * Wrapper for setting user settings
   *
   * @param   String    name          The setting key
   * @param   Object    values        JSON of settings
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::setUserSettings()
   */
  _Handler.prototype.setUserSettings = function(name, values, callback) {
    callback = callback || function() {};
    if ( typeof name === 'object' ) {
      var self = this;
      Object.keys(name).forEach(function(i) {
        self.setSetting('userSettings', i, name[i], null, false);
      });

      this.saveSettings(function() {
        callback.call(this, true);
      });
    } else {
      this.setSetting('userSettings', name, values, callback);
    }
  };

  /**
   * Wrapper for getting user settings
   *
   * @param   String    name          The setting key
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::getUserSettings()
   */
  _Handler.prototype.getUserSettings = function(name, callback) {
    callback = callback || function() {};
    this.getSetting('userSettings', name, callback);
  };

  /**
   * Wrapper for setting user session
   *
   * @param   Array     session       Array of session JSON data
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::setUserSession()
   */
  _Handler.prototype.setUserSession = function(session, callback) {
    callback = callback || function() {};
    this.setSetting('userSession', null, session, callback, true, false);
  };

  /**
   * Wrapper for getting user session
   *
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::getUserSession()
   */
  _Handler.prototype.getUserSession = function(callback) {
    callback = callback || function() {};
    this.getSetting('userSession', null, callback);
  };

  /**
   * Wrapper for setting application settings
   *
   * @param   String    app           Application name
   * @param   Array     settings      Array of setting JSON data
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::setApplicationSettings()
   */
  _Handler.prototype.setApplicationSettings = function(app, settings, callback) {
    callback = callback || function() {};
    this.setSetting(app, null, settings, callback, true, false);
  };

  /**
   * Wrapper for getting application settings
   *
   * @param   String    app           Application name
   * @param   Function  callback      Callback function
   *
   * @return  void
   *
   * @method  _Handler::getApplicationSettings()
   */
  _Handler.prototype.getApplicationSettings = function(app, callback) {
    callback = callback || function() {};
    this.getSetting(app, null, callback);
  };

  /**
   * Get entire configuration
   *
   * @param   String    key     Optionally get just this value
   *
   * @return  Object    All settings or just value by key
   *
   * @method  _Handler::getConfig()
   */
  _Handler.prototype.getConfig = function(key) {
    return key ? this.config[key] : this.config;
  };

  /**
   * Get data for logged in user
   *
   * @return  Object      JSON With user data
   *
   * @method  _Handler::getUserData()
   */
  _Handler.prototype.getUserData = function() {
    return this.user.getUserData();
  };

  /**
   * Get the settings manager
   *
   * @return  Object    All settings in JSON
   *
   * @method  _Handler::getSettings()
   */
  _Handler.prototype.getSettings = function() {
    return this.settings;
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

