/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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

(function(Utils) {
  'use strict';

  window.OSjs   = window.OSjs   || {};
  OSjs.Handlers = OSjs.Handlers || {};

  function fixJSON(response) {
    if ( typeof response === 'string' ) {
      if ( response.match(/^\{|\[/) ) {
        try {
          response = JSON.parse(response);
        } catch ( e  ){
          console.warn('FAILED TO FORCE JSON MIME TYPE', e);
        }
      }
    }
    return response;
  }

  var _handlerInstance;

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT SETTINGS MANAGER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Settings Manager
   */
  function SettingsManager(defaults, defaultMerge) {
    this.defaults = {};
    this.settings = {};
    this.defaultMerge = (typeof defaultMerge === 'undefined' || defaultMerge === true);

    this.load(defaults);
  }

  SettingsManager.prototype.load = function(obj) {
    this.defaults = {};
    this.settings = {};

    if ( obj ) {
      this.defaults = JSON.parse(JSON.stringify(obj));
      this.reset();
    }
  };

  SettingsManager.prototype.reset = function() {
    this.settings = JSON.parse(JSON.stringify(this.defaults));
  };

  SettingsManager.prototype.set = function(category, name, value, merge) {
    if ( !name ) {
      return this.setCategory(category, value, merge);
    }
    return this.setCategoryItem(category, name, value, merge);
  };

  SettingsManager.prototype.get = function(category, name, defaultValue) {
    if ( !category ) {
      return this.settings;
    }
    if ( !name ) {
      return this.getCategory(category, defaultValue);
    }
    return this.getCategoryItem(category, name, defaultValue);
  };

  SettingsManager.prototype._mergeSettings = function(obj1, obj2) {
    if ( ((typeof obj2) !== (typeof obj1)) && (!obj2 && obj1) ) {
      return obj1;
    }
    if ( (typeof obj2) !== (typeof obj1) ) {
      return obj2;
    }
    return OSjs.Utils.mergeObject(obj1, obj2);
  };

  SettingsManager.prototype.setCategory = function(category, value, merge) {
    console.debug('SettingsManager::setCategory()', category, value);
    if ( typeof merge === 'undefined' ) { merge = this.defaultMerge; }

    if ( merge ) {
      this.settings[category] = this._mergeSettings(this.settings[category], value);
    } else {
      this.settings[category] = value;
    }
  };

  SettingsManager.prototype.setCategoryItem = function(category, name, value, merge) {
    console.debug('SettingsManager::setCategoryItem()', category, name, value);
    if ( typeof merge === 'undefined' ) { merge = this.defaultMerge; }

    if ( !this.settings[category] ) {
      this.settings[category] = {};
    }

    if ( merge ) {
      this.settings[category][name] = this._mergeSettings(this.settings[category][name], value);
    } else {
      this.settings[category][name] = value;
    }
  };

  SettingsManager.prototype.getCategory = function(category, defaultValue) {
    if ( typeof this.settings[category] !== 'undefined' ) {
      return this.settings[category];
    }
    return defaultValue;
  };

  SettingsManager.prototype.getCategoryItem = function(category, name, defaultValue) {
    if ( typeof this.settings[category] !== 'undefined' ) {
      if ( typeof this.settings[category][name] !== 'undefined' ) {
        return this.settings[category][name];
      }
    }
    return defaultValue;
  };

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT CONNECTION MANAGER
  /////////////////////////////////////////////////////////////////////////////

  var ConnectionManager = function(type, url, cb) {
    cb = cb || function() {};

    this.type       = type;
    this.url        = url;
    this.offline    = false;
    this.connection = null;
    /*
    this._wsmid     = 0;
    this._wscb      = {};
    */

    var self = this;

    if ( typeof navigator.onLine !== 'undefined' ) {
      window.addEventListener('offline', function(ev) {
        self.onOffline();
      });
      window.addEventListener('online', function(ev) {
        self.onOnline();
      });
    }

    /*
    if ( this.type === 'websocket' ) {
      this.offline = true;

      //this.connection = new WebSocket(this.url);
      this.connection = new WebSocket('ws://10.0.0.52:8889');
      this.connection.onopen = function() {
        self.offline = false;
      };
      this.connection.onclose = function() {
        self.offline = true;
      };
      this.connection.onerror = function(ev) {
        console.error('Connection error', ev);
      };
      this.connection.onmessage = function(ev) {
        var data = JSON.parse(ev.data);
        var id = data.id;

        if ( self._wscb[id] ) {
          if ( data.error ) {
            self._wscb[id].cbError(data.error, data);
          } else {
            self._wscb[id].cbSuccess(data);
          }
          delete self._wscb[id];
        }
      };
    }
    */
  };

  ConnectionManager.prototype.destroy = function() {
    var self = this;
    /*
    if ( this.connection ) {
      this.connection.close();
      this.connection = null;
      this._wscb = {};
    }
    */

    if ( typeof navigator.onLine !== 'undefined' ) {
      window.removeEventListener('offline', function(ev) {
        self.onOffline();
      });
      window.removeEventListener('online', function(ev) {
        self.onOnline();
      });
    }
  };

  ConnectionManager.prototype.callAPI = function(method, args, cbSuccess, cbError) {
    if ( this.offline ) {
      cbError('You are currently off-line and cannot perform this operation!');
      return false;
    }

    args      = args      || {};
    cbSuccess = cbSuccess || function() {};
    cbError   = cbError   || function() {};

    console.group('ConnectionManager::callAPI()');
    console.log('Method', method);
    console.log('Arguments', args);
    console.groupEnd();

    /*
    if ( this.connection ) {
      var id = 'msg_' + this._wsmid;
      this._wscb[id] = {
        args: args,
        cbSuccess: cbSuccess,
        cbError: cbError
      };

      this.connection.send(JSON.stringify({
        id: id,
        method: method,
        args: args
      }));

      this._wsmid++;

      return true;
    }
    */

    return Utils.Ajax(this.url, function(response, httpRequest, url) {
      cbSuccess.apply(this, arguments);
    }, function(error, response, httpRequest, url) {
      cbError.apply(this, arguments);
    }, {
      method : 'POST',
      post   : {
        'method'    : method,
        'arguments' : args
      }
    });
  };

  ConnectionManager.prototype.onOnline = function() {
    console.warn('ConnectionManager::onOnline()', 'Going online...');
    this.offline = false;

    var wm = OSjs.API.getWMInstance();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are On-line!'});
    }
  };

  ConnectionManager.prototype.onOffline = function() {
    console.warn('ConnectionManager::onOffline()', 'Going offline...');
    this.offline = true;

    var wm = OSjs.API.getWMInstance();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are Off-line!'});
    }
  };


  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT USER MANAGER
  /////////////////////////////////////////////////////////////////////////////

  var UserSession = function(cfg) {
    this.userData = {
      id      : 0,
      username: 'root',
      name    : 'root user',
      groups  : ['root']
    };
  };

  UserSession.prototype.getSession = function() {
    var procs = OSjs.API.getProcesses();

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
  };

  UserSession.prototype.loadSession = function(res, callback) {
    var list = [];
    res.forEach(function(iter, i) {
      list.push({name: iter.name, args: iter.args, data: {windows: iter.windows || []}});
    });

    OSjs.API.launchList(list, function(app, metadata, appName, appArgs, queueData) {
      var data = ((queueData || {}).windows) || [];
      data.forEach(function(r, i) {
        var w = app._getWindow(r.name);
        if ( w ) {
          w._move(r.position.x, r.position.y, true);

          if ( w._properties.allow_resize ) {
            w._resize(r.dimension.w, r.dimension.h, true);
          }

          console.info('UserSession::loadSession()->onSuccess()', 'Restored window \'' + r.name + '\' from session');
        }
      });
    }, null, callback);
  };

  UserSession.prototype.setUserData = function(d) {
    this.userData = d || {};
  };

  UserSession.prototype.getUserData = function() {
    return this.userData;
  };

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

    console.info('ThemeManager::load()');

    Utils.Ajax(this.uri, function(response, httpRequest, url) {
      response = fixJSON(response);

      if ( response ) {
        self.themes = response;
        callback(true);
      } else {
        callback(false, 'No themes found!');
      }
    }, function(error, response, httpRequest) {
      if ( httpRequest && httpRequest.status !== 200 ) {
        error = 'Failed to theme manifest from ' + self.uri + ' - HTTP Error: ' + httpRequest.status;
      }
      callback(false, error);
    }, {method: 'GET', parse: true});
  };

  ThemeManager.prototype.getTheme = function(name) {
    var result = null;
    this.themes.forEach(function(theme, i) {
      if ( theme.name === name ) {
        result = theme;
        return false;
      }
      return true;
    });
    return result;
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

    console.info('PackageManager::load()');

    Utils.Ajax(this.uri, function(response, httpRequest, url) {
      response = fixJSON(response);

      if ( response ) {
        self._setPackages(response);
        callback(true);
      } else {
        callback(false, 'No packages found!');
      }
    }, function(error, response, httpRequest) {
      if ( httpRequest && httpRequest.status !== 200 ) {
        error = 'Failed to load package manifest from ' + self.uri + ' - HTTP Error: ' + httpRequest.status;
      }
      callback(false, error);
    }, {method: 'GET', parse: true});
  };

  /**
   * Set package list (does some corrections for locale)
   */
  PackageManager.prototype._setPackages = function(result) {
    console.debug('PackageManager::_setPackages()', result);
    var currLocale = OSjs.Locale.getLocale();
    var resulted = {};

    Object.keys(result).forEach(function(i) {
      var newIter = result[i];
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
    });

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
    var list = [];
    var self = this;
    Object.keys(this.packages).forEach(function(i) {
      var a = self.packages[i];
      if ( a && a.mime ) {
        if ( Utils.checkAcceptMime(mime, a.mime) ) {
          list.push(i);
        }
      }
    });
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
    if ( _handlerInstance ) {
      throw Error('Cannot create another Handler Instance');
    }
    this.config     = OSjs.Settings.DefaultConfig();
    this.settings   = new SettingsManager();
    this.connection = new ConnectionManager(this.config.Core.Connection, this.config.Core.APIURI);
    this.packages   = new PackageManager(this.config.Core.MetadataURI);
    this.themes     = new ThemeManager(this.config.Core.ThemeMetadataURI);
    this.user       = new UserSession(this.config.Core.DefaultUser);

    _handlerInstance = this;
  };

  /**
   * Called upon window loaded from 'main.js'
   * @see main.js
   * @see OSjs._initialize
   */
  DefaultHandler.prototype.init = function(callback) {
    console.info('OSjs::DefaultHandler::init()');

    OSjs.Locale.setLocale(this.config.Core.Locale);

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

    var wm = OSjs.API.getWMInstance();
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
   * Use this shorthand method: OSjs.API.call() instead :)
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

    var curLocale = this.config.Core.Locale;

    function _finished(locale) {
      OSjs.Locale.setLocale(locale || curLocale);
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

    if ( wm ) {
      wm.createNotificationIcon('DefaultHandlerUserNotification', {
        onContextMenu: function(ev) {
          var pos = {x: ev.clientX, y: ev.clientY};
          OSjs.GUI.createMenu([{
            title: 'Sign out', // FIXME: Translation
            onClick: function() {
              OSjs.Core.signOut();
            }
          }], pos);
          return false;
        },
        onInited: function(el) {
          if ( el.firstChild ) {
            var img = document.createElement('img');
            img.title = 'You are signed in as: ' + user.username; // FIXME: Translation;
            img.alt = img.title;
            img.src = OSjs.API.getThemeResource('status/avatar-default.png', 'icon', '16x16');
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
        if ( type === 'icon' ) {
          var size = args || '16x16';
          name = root + '/' + theme + '/icons/' + size + '/' + name;
        } else if ( type === 'sound' ) {
          var ext = 'oga';
          if ( !OSjs.Compability.audioTypes.ogg ) {
            ext = 'mp3';
          }
          name = root + '/' + theme + '/sounds/' + name + '.' + ext;
        } else if ( type === 'wm' ) {
          name = root + '/' + theme + '/wm/' + name;
        } else if ( type === 'base' ) {
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
    name = name || '';
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

  //
  // EXPORTS
  //
  OSjs.Handlers.Current           = null;
  OSjs.Handlers.Default           = DefaultHandler;
  OSjs.Handlers.ConnectionManager = ConnectionManager;
  OSjs.Handlers.UserSession       = UserSession;
  OSjs.Handlers.ThemeManager      = ThemeManager;
  OSjs.Handlers.PackageManager    = PackageManager;
  OSjs.Handlers.SettingsManager   = SettingsManager;

  OSjs.Handlers.getInstance = function() {
    return _handlerInstance;
  };

})(OSjs.Utils);

