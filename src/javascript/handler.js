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
  OSjs.Handlers = OSjs.Handlers || {};

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
   */
  var DefaultHandler = function() {
    if ( _handlerInstance ) {
      throw Error('Cannot create another Handler Instance');
    }
    this.config     = API.getDefaultSettings();
    this.settings   = new OSjs.Helpers.SettingsManager();
    this.connection = new OSjs.Helpers.ConnectionManager(this.config.Core.Connection, this.config.Core.APIURI);
    this.packages   = new OSjs.Helpers.PackageManager(this.config.Core.MetadataURI);
    this.themes     = new OSjs.Helpers.ThemeManager(this.config.Core.ThemeMetadataURI);
    this.user       = new OSjs.Helpers.UserSession(this.config.Core.DefaultUser);

    _handlerInstance = this;
  };

  /**
   * Called upon window loaded from 'main.js'
   * @see main.js
   * @see API._initialize
   */
  DefaultHandler.prototype.init = function(callback) {
    console.info('OSjs::DefaultHandler::init()');

    API.setLocale(this.config.Core.Locale);

    callback();
  };

  /**
   * Called upon unload
   */
  DefaultHandler.prototype.destroy = function() {
    if ( this.connection ) {
      this.connection.destroy();
      this.connection = null;
    }

    this.user     = null;
    this.themes   = null;
    this.packages = null;
    this.settings = null;
    this.config   = {};
  };

  /**
   * Called after successfull login in 'core.js'
   * @see Core::Main::init()
   */
  DefaultHandler.prototype.boot = function(callback) {
    console.info('OSjs::DefaultHandler::boot()');

    var self = this;
    this.themes.load(function(tresult, terror) {
      if ( !tresult ) {
        callback(tresult, terror);
        return;
      }

      self.packages.load(function(presult, perror) {
        callback(presult, perror);
      });
    });
  };

  /**
   * Default login method
   * NOTE: This is just a placeholder.
   *       To implement your own login handler, see the Wiki :)
   */
  DefaultHandler.prototype.login = function(username, password, callback) {
    console.info('OSjs::DefaultHandler::login()', username);
    this.onLogin({}, function() {
      callback(true);
    });
  };

  /**
   * Default logout method
   *
   * NOTE: You should call this in your implemented handler
   *       or else your data will not be stored
   */
  DefaultHandler.prototype.logout = function(save, callback) {
    console.info('OSjs::DefaultHandler::logout()');

    var wm = API.getWMInstance();
    if ( wm ) {
      wm.destroyNotificationIcon('DefaultHandlerUserNotification');
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
   */
  DefaultHandler.prototype.loadSession = function(callback) {
    callback = callback || function() {};

    console.info('OSjs::DefaultHandler::loadSession()');

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
   */
  DefaultHandler.prototype.callAPI = function(method, args, cbSuccess, cbError) {
    return this.connection.callAPI(method, args, cbSuccess, cbError);
  };

  //
  // Events
  //

  /**
   * Called when login() is finished
   */
  DefaultHandler.prototype.onLogin = function(userData, callback) {
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
   */
  DefaultHandler.prototype.onVFSRequest = function(vfsModule, vfsMethod, vfsArguments, callback) {
    // If you want to interrupt or modify somehow
    callback();
  };

  DefaultHandler.prototype.onWMLaunched = function(wm, callback) {
    var user = this.user.getUserData();

    function displayMenu(ev) {
      var pos = {x: ev.clientX, y: ev.clientY};
      OSjs.GUI.createMenu([{
        title: API._('TITLE_SIGN_OUT'),
        onClick: function() {
          OSjs.Core.signOut();
        }
      }], pos);
    }

    if ( wm ) {
      wm.createNotificationIcon('DefaultHandlerUserNotification', {
        onContextMenu: function(ev) {
          displayMenu(ev);
          return false;
        },
        onClick: function(ev) {
          displayMenu(ev);
          return false;
        },
        onInited: function(el) {
          if ( el.firstChild ) {
            var img = document.createElement('img');
            img.title = API._('TITLE_SIGNED_IN_AS_FMT', user.username);
            img.alt = img.title;
            img.src = API.getThemeResource('status/avatar-default.png', 'icon', '16x16');
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
   * Get metadata for application by class-name
   */
  DefaultHandler.prototype.getApplicationMetadata = function(name) {
    return this.packages.getPackage(name);
  };

  /**
   * Get all package metadata
   */
  DefaultHandler.prototype.getApplicationsMetadata = function() {
    return this.packages.getPackages();
  };

  /**
   * Get a list of application supporting mime type
   */
  DefaultHandler.prototype.getApplicationNameByMime = function(mime, fname, forceList, callback) {
    var pacman = this.packages;
    this.getSetting('defaultApplication', mime, function(val) {
      console.debug('OSjs::DefaultHandler::getApplicationNameByMime()', 'default application', val);
      if ( !forceList && val ) {
        if ( pacman.getPackage(val) ) {
          callback([val]);
          return;
        }
      }
      callback(pacman.getPackagesByMime(mime));
    });
  };

  //
  // Themes
  //

  DefaultHandler.prototype.getThemes = function() {
    if ( this.themes ) {
      return this.themes.getThemes();
    }
    return [];
  };

  DefaultHandler.prototype.getTheme = function(name) {
    if ( this.themes ) {
      return this.themes.getTheme(name);
    }
    return null;
  };

  //
  // Settings and Sessions
  //

  /**
   * Set the default application for given mime type
   */
  DefaultHandler.prototype.setDefaultApplication = function(mime, app, callback) {
    callback = callback || function() {};
    console.debug('OSjs::DefaultHandler::setDefaultApplication()', mime, app);
    this.setSetting('defaultApplication', mime, app, callback);
  };

  /**
   * Internal method for saving settings (wrapper)
   * NOTE: This is should be called from the implemented handler
   *       See 'demo' handler for example
   */
  DefaultHandler.prototype.saveSettings = function(callback) {
    console.debug('OSjs::DefaultHandler::saveSettings()');
    callback.call(this, true);
  };

  /**
   * Sets a setting
   * @see SettingsManager
   */
  DefaultHandler.prototype.setSetting = function(category, name, value, callback, save, merge) {
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
   * @see SettingsManager
   */
  DefaultHandler.prototype.getSetting = function(category, name, callback, defaultValue) {
    callback = callback || function() {};
    callback.call(this, this.settings.get(category, name, defaultValue));
  };

  /**
   * Wrapper for setting user settings
   */
  DefaultHandler.prototype.setUserSettings = function(name, values, callback) {
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
   */
  DefaultHandler.prototype.getUserSettings = function(name, callback) {
    callback = callback || function() {};
    this.getSetting('userSettings', name, callback);
  };

  /**
   * Wrapper for setting user session
   */
  DefaultHandler.prototype.setUserSession = function(session, callback) {
    callback = callback || function() {};
    this.setSetting('userSession', null, session, callback, true, false);
  };

  /**
   * Wrapper for getting user session
   */
  DefaultHandler.prototype.getUserSession = function(callback) {
    callback = callback || function() {};
    this.getSetting('userSession', null, callback);
  };

  /**
   * Wrapper for setting application settings
   */
  DefaultHandler.prototype.setApplicationSettings = function(app, settings, callback) {
    callback = callback || function() {};
    this.setSetting(app, null, settings, callback, true, false);
  };

  /**
   * Wrapper for getting application settings
   */
  DefaultHandler.prototype.getApplicationSettings = function(app, callback) {
    callback = callback || function() {};
    this.getSetting(app, null, callback);
  };

  /**
   * Get entire configuration
   */
  DefaultHandler.prototype.getConfig = function(key) {
    return key ? this.config[key] : this.config;
  };

  /**
   * Get data for logged in user
   */
  DefaultHandler.prototype.getUserData = function() {
    return this.user.getUserData();
  };

  /**
   * Get the settings manager
   */
  DefaultHandler.prototype.getSettings = function() {
    return this.settings;
  };

  //
  // EXPORTS
  //
  OSjs.Handlers.Current           = null;
  OSjs.Handlers.Default           = DefaultHandler;

  OSjs.Handlers.getInstance = function() {
    return _handlerInstance;
  };

})(OSjs.API, OSjs.Utils);

