"use strict";
/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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

(function() {

  window.OSjs   = window.OSjs   || {};
  OSjs.Handlers = OSjs.Handlers || {};

  function FixJSON(response) {
    if ( typeof response === "string" ) {
      if ( response.match(/^\{|\[/) ) {
        try {
          response = JSON.parse(response);
        } catch ( e  ){
          console.warn("FAILED TO FORCE JSON MIME TYPE", e);
        }
      }
    }
    return response;
  }

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT THEME MANAGER
  /////////////////////////////////////////////////////////////////////////////

  var ThemeManager = function(uri) {
    this.themes = [];
    this.uri = uri;
  };

  ThemeManager.prototype.load = function(callback) {
    var self = this;
    callback = callback || {};

    console.info("ThemeManager::load()");

    OSjs.Utils.Ajax(this.uri, function(response, httpRequest, url) {
      response = FixJSON(response);

      if ( response ) {
        self.themes = response;
        callback(true);
      } else {
        callback(false, "No themes found!")
      }
    }, function(error, response, httpRequest) {
      if ( httpRequest && httpRequest.status != 200 ) {
        error = 'Failed to theme manifest from ' + self.uri + ' - HTTP Error: ' + httpRequest.status;
      }
      callback(false, error);
    }, {method: 'GET', parse: true});
  };

  ThemeManager.prototype.getThemes = function() {
    return this.themes;
  };

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT PACKAGE MANAGER
  /////////////////////////////////////////////////////////////////////////////

  var PackageManager = function(uri) {
    this.packages = {};
    this.uri = uri;
  };

  /**
   * Load Metadata from server and set packages
   */
  PackageManager.prototype.load = function(callback) {
    var self = this;
    callback = callback || {};

    console.info("PackageManager::load()");

    OSjs.Utils.Ajax(this.uri, function(response, httpRequest, url) {
      response = FixJSON(response);

      if ( response ) {
        self._setPackages(response);
        callback(true);
      } else {
        callback(false, "No packages found!");
      }
    }, function(error, response, httpRequest) {
      if ( httpRequest && httpRequest.status != 200 ) {
        error = 'Failed to load package manifest from ' + self.uri + ' - HTTP Error: ' + httpRequest.status;
      }
      callback(false, error);
    }, {method: 'GET', parse: true});
  };

  /**
   * Set package list (does some corrections for locale)
   */
  PackageManager.prototype._setPackages = function(result) {
    console.debug("PackageManager::_setPackages()", result);
    var currLocale = OSjs.Locale.getLocale();
    var resulted = {};
    var newIter;
    for ( var i in result ) {
      if ( result.hasOwnProperty(i) ) {
        newIter = result[i];
        if ( typeof newIter.names !== 'undefined' ) {
          if ( newIter.names[currLocale] ) {
            newIter.name = newIter.names[currLocale];
          }
        }
        if ( typeof newIter.descriptions !== 'undefined' ) {
          if ( newIter.descriptions[currLocale] ) {
            newIter.description = newIter.descriptions[currLocale];
          }
        }

        if ( !newIter.description ) {
          newIter.description = newIter.name;
        }

        resulted[i] = newIter;
      }
    }

    this.packages = resulted;
  };

  /**
   * Get package by name
   */
  PackageManager.prototype.getPackage = function(name) {
    if ( typeof this.packages[name] !== 'undefined' ) {
      return this.packages[name];
    }
    return false;
  };

  /**
   * Get all packages
   */
  PackageManager.prototype.getPackages = function() {
    return this.packages;
  };

  /**
   * Get packages by Mime support type
   */
  PackageManager.prototype.getPackagesByMime = function(mime) {
    var j, i, a;
    var list = [];
    for ( i in this.packages ) {
      if ( this.packages.hasOwnProperty(i) ) {
        a = this.packages[i];
        if ( a && a.mime ) {
          for ( j = 0; j < a.mime.length; j++ ) {
            if ( (new RegExp(a.mime[j])).test(mime) === true ) {
              list.push(i);
            }
          }
        }
      }
    }

    return list;
  };

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
    var self = this;
    var cfg = OSjs.Settings.DefaultConfig();

    this.offline  = false;
    this.settings = new OSjs.Core.SettingsManager();           // Settings cache
    this.config   = cfg;                                          // Main configuration copy
    this.packages = new PackageManager(cfg.Core.MetadataURI);     // Package manager
    this.themes   = new ThemeManager(cfg.Core.ThemeMetadataURI);  // Theme Manager
    this.userData = {                                             // User Session data
      id      : 0,
      username: 'root',
      name    : 'root user',
      groups  : ['root']
    };

    if ( typeof navigator.onLine !== 'undefined' ) {
      window.addEventListener("offline", function(ev) {
        self.onOffline();
      });
      window.addEventListener("online", function(ev) {
        self.onOnline();
      });
    }
  };

  /**
   * Default method to perform a call to the backend (Wrapper)
   */
  DefaultHandler.prototype._call = function(opts, cok, cerror) {
    if ( this.offline ) {
      cerror("You are currently off-line and cannot perform this operation!");
      return false;
    }

    return OSjs.Utils.Ajax(this.config.Core.APIURI, function(response, httpRequest, url) {
      response = response || {};
      cok.apply(this, arguments);
    }, function(error, response, httpRequest, url) {
      cerror.apply(this, arguments);
    }, opts);
  };

  /**
   * Default method to perform a call to the backend (API)
   * Use this shorthand method: OSjs.API.call() instead :)
   */
  DefaultHandler.prototype.callAPI = function(method, args, cok, cerror) {
    args = args || {};

    console.group("DefaultHandler::callAPI()");
    console.log("Method", method);
    console.log("Arguments", args);
    console.groupEnd();

    var opts = {
      method : 'POST',
      post   : {
        'method'    : method,
        'arguments' : args
      }
    };

    return this._call(opts, cok, cerror);
  };

  //
  // Events
  //

  /**
   * Event when browser goes on-line (again)
   */
  DefaultHandler.prototype.onOnline = function() {
    console.warn("DefaultHandler::onOnline()", "Going online...");
    this.offline = false;

    var wm = OSjs.API.getWMInstance();
    if ( wm ) {
      wm.notification({title: "Warning!", message: "You are On-line!"});
    }
  };

  /**
   * Event when browser gies off-line
   */
  DefaultHandler.prototype.onOffline = function() {
    console.warn("DefaultHandler::onOffline()", "Going offline...");
    this.offline = true;

    var wm = OSjs.API.getWMInstance();
    if ( wm ) {
      wm.notification({title: "Warning!", message: "You are Off-line!"});
    }
  };

  /**
   * Event when OS.js has successfully initialized
   */
  DefaultHandler.prototype.onInitialized = function() {
    console.debug("OSjs::DefaultHandler::onInitialized()");
  };

  //
  // Main
  //

  /**
   * Called upon window loaded from 'main.js'
   * @see main.js
   * @see OSjs._initialize
   */
  DefaultHandler.prototype.init = function(callback) {
    console.info("OSjs::DefaultHandler::init()");

    OSjs.Locale.setLocale(this.config.Core.Locale);

    callback();
  };

  /**
   * Called upon unload
   */
  DefaultHandler.prototype.destroy = function() {
    var self = this;
    if ( typeof navigator.onLine !== 'undefined' ) {
      window.removeEventListener("offline", function(ev) {
        self.onOffline();
      });
      window.removeEventListener("online", function(ev) {
        self.onOnline();
      });
    }
  };

  /**
   * Called after successfull login in 'core.js'
   * @see Core::Main::init()
   */
  DefaultHandler.prototype.boot = function(callback) {
    console.info("OSjs::DefaultHandler::boot()");

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
    console.info("OSjs::DefaultHandler::login()", username);
    callback(true);
  };

  /**
   * Default logout method
   * NOTE: This is just a placeholder.
   *       To implement your own login handler, see the Wiki :)
   */
  DefaultHandler.prototype.logout = function(session, callback) {
    console.info("OSjs::DefaultHandler::logout()");

    if ( session !== null ) {
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
    console.info("OSjs::DefaultHandler::loadSession()");

    callback = callback || function() {};

    this.getUserSession(function(res) {
      if ( res ) {
        var list = [];
        for ( var i = 0; i < res.length; i++ ) {
          list.push({name: res[i].name, args: res[i].args, data: {windows: res[i].windows || []}});
        }

        OSjs.API.launchList(list, function(app, metadata, appName, appArgs, queueData) {
          var data = ((queueData || {}).windows) || [];
          var w, r;
          for ( var i = 0, l = data.length; i < l; i++ ) {
            r = data[i];
            w = app._getWindow(r.name);
            if ( w ) {
              w._move(r.position.x, r.position.y, true);
              w._resize(r.dimension.w, r.dimension.h, true);

              console.info('DefaultHandler::loadSession()->onSuccess()', 'Restored window "' + r.name + '" from session');
            }
          }
        }, null, callback);
      }
    });
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
      console.debug("OSjs::DefaultHandler::getApplicationNameByMime()", "default application", val);
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

  //
  // Settings and Sessions
  //

  /**
   * Set the default application for given mime type
   */
  DefaultHandler.prototype.setDefaultApplication = function(mime, app, callback) {
    callback = callback || function() {};
    console.debug("OSjs::DefaultHandler::setDefaultApplication()", mime, app);
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
   * @see OSjs.Core.SettingsManager
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
   * @see OSjs.Core.SettingsManager
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
      for ( var i in name ) {
        if ( name.hasOwnProperty(i) ) {
          this.setSetting('userSettings', i, name[i], null, false);
        }
      }

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
    return this.userData;
  };

  /**
   * Get the settings manager
   */
  DefaultHandler.prototype.getSettings = function() {
    return this.settings;
  };

  //
  // Resources
  //

  /**
   * Default method for getting a resource from application
   */
  DefaultHandler.prototype.getApplicationResource = function(app, name) {
    var aname = ((app instanceof OSjs.Core.Process)) ? (app.__path || '') : app;
    var root = OSjs.Settings.DefaultConfig().Core.PackageURI;
    return root + '/' + aname + '/' + name;
  };

  /**
   * Default method for getting a resource from theme
   */
  DefaultHandler.prototype.getThemeResource = function(name, type, args) {
    name = name || null;
    type = type || null;
    args = args || null;

    if ( name ) {
      var wm = OSjs.API.getWMInstance();
      var theme = (wm ? wm.getSetting('theme') : 'default') || 'default';
      var root = OSjs.Settings.DefaultConfig().Core.ThemeURI;
      if ( !name.match(/^\//) ) {
        if ( type == 'icon' ) {
          var size = args || '16x16';
          name = root + '/' + theme + '/icons/' + size + '/' + name;
        } else if ( type == 'sound' ) {
          var ext = 'oga';
          if ( !OSjs.Compability.audioTypes.ogg ) {
            ext = 'mp3';
          }
          name = root + '/' + theme + '/sounds/' + name + '.' + ext;
        } else if ( type == 'wm' ) {
          name = root + '/' + theme + '/wm/' + name;
        } else if ( type == 'base' ) {
          name = root + '/' + theme + '/' + name;
        }
      }
    }

    return name;
  };

  /**
   * Default method for getting a icon (wrapper for above methods)
   */
  DefaultHandler.prototype.getIcon = function(name, app, args) {
    if ( name.match(/\.\//) ) {
      if ( (app instanceof OSjs.Core.Application) || (typeof app === 'string') ) {
          return OSjs.API.getApplicationResource(app, name);
      } else {
        if ( typeof app === 'object' ) {
          return OSjs.API.getApplicationResource(app.path, name);
        }
      }
    }
    return OSjs.API.getThemeResource(name, 'icon', args);
  };

  /**
   * Default method for getting path to css theme
   */
  DefaultHandler.prototype.getThemeCSS = function(name) {
    if ( name === null ) {
      return '/blank.css';
    }
    var root = OSjs.Settings.DefaultConfig().Core.ThemeURI;
    return root + '/' + name + '.css';
  };

  /**
   * Default method for getting path to a resource
   */
  DefaultHandler.prototype.getResourceURL = function(path) {
    path = path || '';
    if ( path.match(/^osjs\:\/\//) ) {
      return path.replace(/^osjs\:\/\//, '');
    }
    var fsuri = this.getConfig('Core').FSURI;
    return path ? (fsuri + path) : fsuri;
  };

  OSjs.Handlers.Default = DefaultHandler;

})();

