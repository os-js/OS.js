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

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT HANDLING CODE
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Storage
   */
  var DefaultStorage = function() {
    if ( !OSjs.Utils.getCompability().localStorage ) {
      throw "Your browser does not support localStorage :(";
    }
    this.prefix = 'andersevenrud.github.io/OS.js-v2/';
  };

  DefaultStorage.prototype.set = function(k, v) {
    localStorage.setItem(this.prefix + k, JSON.stringify(v));
  };

  DefaultStorage.prototype.get = function(k) {
    var val = localStorage.getItem(this.prefix + k);
    return val ? JSON.parse(val) : null;
  };

  /**
   * Handler
   */
  var DefaultHandler = function() {
    this.storage  = new DefaultStorage();
    this.packages = {};
    this.config   = OSjs.Settings.DefaultConfig();
    this.userData = {};
    this.offline  = false;

    var self = this;
    if ( typeof navigator.onLine !== 'undefined' ) {
      window.addEventListener("offline", function(ev) {
        self.onOffline();
      });
      window.addEventListener("online", function(ev) {
        self.onOnline();
      });
    }
  };

  DefaultHandler.prototype.call = function(opts, cok, cerror) {
    if ( this.offline ) {
      cerror("You are currently off-line and cannot perform this operation!");
      return;
    }

    return OSjs.Utils.Ajax(this.config.Core.APIURI, function(response, httpRequest, url) {
      cok.apply(this, arguments);
    }, function(error, response, httpRequest, url) {
      cerror.apply(this, arguments);
    }, opts);
  };

  //
  // Events
  //

  DefaultHandler.prototype.onOnline = function() {
    console.warn("DefaultHandler::onOnline()", "Going online...");
    this.offline = false;

    var wm = OSjs.API.getWMInstance();
    if ( wm ) {
      wm.notification({title: "Warning!", message: "You are Offline!"});
    }
  };

  DefaultHandler.prototype.onOffline = function() {
    console.warn("DefaultHandler::onOffline()", "Going offline...");
    this.offline = true;

    var wm = OSjs.API.getWMInstance();
    if ( wm ) {
      wm.notification({title: "Warning!", message: "You are On-line!"});
    }
  };

  DefaultHandler.prototype.onInitialized = function() {
  };

  //
  // Main
  //
  DefaultHandler.prototype.init = function(callback) {
    var self      = this;
    var container = document.getElementById('Login');
    var login     = document.getElementById('LoginForm');
    var u         = document.getElementById('LoginUsername');
    var p         = document.getElementById('LoginPassword');
    var s         = document.getElementById('LoginSubmit');

    var _restore = function() {
      s.removeAttribute("disabled");
      u.removeAttribute("disabled");
      p.removeAttribute("disabled");
    };

    var _lock = function() {
      s.setAttribute("disabled", "disabled");
      u.setAttribute("disabled", "disabled");
      p.setAttribute("disabled", "disabled");
    };

    var _login = function(username, password) {
      self.login(username, password, function(result, error) {
        if ( error ) {
          alert(error);
          _restore();
          return;
        }
        self.userData = result;

        container.parentNode.removeChild(container);
        callback();
      });
    };

    /*
    login.onsubmit = function(ev) {
      _lock();
      if ( ev ) ev.preventDefault();
      _login(u.value, p.value);
    };
    */

    _login("demo", "demo");
  };

  DefaultHandler.prototype.boot = function(callback) {
    callback = callback || {};
    var self = this;

    this.pollPackages(function(result, error) {
      if ( error ) {
        callback(false, error);
        return;
      }

      if ( result ) {
        self.packages = result;
        callback(true);
        return;
      }

      callback(false);
    });
  };

  DefaultHandler.prototype.login = function(username, password, callback) {
    if ( username === 'demo' && password === 'demo' ) {
      var userData = {
        id:         1,
        username:   'demo',
        name:       'Demo User',
        groups:     ['demo']
      };

      callback(userData);
      return;
    }
    callback(false, "Invalid login");
  };

  DefaultHandler.prototype.logout = function(session, callback) {
    if ( session !== null ) {
      this.setUserSession(session, function() {
        callback(true);
      });
      return;
    }
    callback(true);
  };

  DefaultHandler.prototype.loadSession = function() {
    var _list = [];

    var onSuccess = function(data, a) {
      var w, r;
      for ( var i = 0, l = data.length; i < l; i++ ) {
        r = data[i];
        w = a._getWindow(r.name);
        if ( w ) {
          w._move(r.position.x, r.position.y);
          w._resize(r.dimension.w, r.dimension.h);

          console.info('DefaultHandler::loadSession()->onSuccess()', 'Restored window "' + r.name + '" from session');
        }
      }

      onNext();
    };

    var onNext = function() {
      if ( _list.length ) {
        var s = _list.pop();
        var sargs = s.args || {};
        if ( typeof sargs.length !== 'undefined' ) sargs = {};

        OSjs.API.launch(s.name, sargs, (function(data) {
          return function(a) {
            onSuccess(data, a);
          };
        })(s.windows), function(err) {
          console.warn("_loadSession() error", err);
          onNext();
        });
      }
    };

    this.getUserSession(function(res) {
      if ( res ) {
        _list = res;
        onNext();
      }
    });
  };

  DefaultHandler.prototype.pollPackages = function(callback) {
    callback = callback || function() {};

    var uri = this.getConfig('Core').PACKAGEURI;
    return OSjs.Utils.Ajax(uri, function(response, httpRequest, url) {
      if ( response ) {
        callback(response);
      } else {
        callback(false, "No packages found!");
      }
    }, function(error) {
      callback(false, error);
    }, {method: 'GET', parse: true});
  };

  //
  // Settings / Sessions
  //

  DefaultHandler.prototype.getApplicationsMetadata = function() {
    return this.packages;
  };

  DefaultHandler.prototype.getApplicationNameByMime = function(mime, fname, forceList, callback) {
    var self = this;
    var packages = this.packages;

    var _createList = function() {
      var j, i, a;
      var list = [];
      for ( i in packages ) {
        if ( packages.hasOwnProperty(i) ) {
          a = packages[i];
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

    this._getSettings('defaultApplication', mime, function(val) {
      console.debug("OSjs::DefaultHandler::getApplicationNameByMime()", "default application", val);
      if ( !forceList && val ) {
        if ( packages[val] ) {
          callback([val]);
          return;
        }
      }
      callback(_createList());
    });
  };

  DefaultHandler.prototype.setDefaultApplication = function(mime, app, callback) {
    callback = callback || function() {};
    console.debug("OSjs::DefaultHandler::setDefaultApplication()", mime, app);
    this._setSettings('defaultApplication', mime, app, callback);
  };

  DefaultHandler.prototype.getApplicationMetadata = function(name) {
    if ( this.packages[name] ) {
      return this.packages[name];
    }
    return false;
  };

  DefaultHandler.prototype._setSetting = function(cat, values, callback) {
    this.storage.set(cat, values);
    callback(true);
  };

  DefaultHandler.prototype._setSettings = function(cat, key, opts, callback) {
    var settings = this.storage.get(cat);
    if ( typeof settings !== 'object' || !settings ) {
      settings = {};
    }
    if ( typeof settings[key] !== 'object' || !settings[key] ) {
      settings[key] = {};
    }
    settings[key] = opts;

    this.storage.set(cat, settings);
    callback(true);
  };

  DefaultHandler.prototype._getSettings = function(cat, key, callback) {
    var s = this.storage.get(cat) || {};
    if ( key === null ) {
      callback(s);
      return;
    } else if ( s[key] ) {
      callback(s[key]);
      return;
    }
    callback(false);
  };

  DefaultHandler.prototype.setUserSettings = function(key, opts, callback) {
    callback = callback || function() {};
    this._setSettings('userSettings', key, opts, callback);
  };

  DefaultHandler.prototype.getUserSettings = function(key, callback) {
    callback = callback || function() {};
    this._getSettings('userSettings', key, callback);
  };

  DefaultHandler.prototype.setApplicationSettings = function(app, settings, callback) {
    callback = callback || function() {};
    this._setSetting(app, settings, callback);
  };

  DefaultHandler.prototype.getApplicationSettings = function(app, callback) {
    callback = callback || function() {};
    this._getSettings(app, null, callback);
  };

  DefaultHandler.prototype.setUserSession = function(session, callback) {
    callback = callback || function() {};
    this.storage.set("userSession", session);
    callback(true);
  };

  DefaultHandler.prototype.getUserSession = function(callback) {
    callback = callback || function() {};
    var s = this.storage.get("userSession");
    callback(s);
  };

  DefaultHandler.prototype.getConfig = function(key) {
    return key ? this.config[key] : this.config;
  };

  DefaultHandler.prototype.getUserData = function() {
    return this.userData;
  };

  //
  // Resources
  //

  DefaultHandler.prototype.getThemeResource = function(name, type, args) {
    name = name || null;
    type = type || null;
    args = args || null;

    if ( name ) {
      var wm = OSjs.API.getWMInstance();
      var theme = (wm ? wm.getSetting('theme') : 'default') || 'default';
      if ( !name.match(/^\//) ) {
        if ( type == 'icon' ) {
          var size = args || '16x16';
          name = '/themes/' + theme + '/icons/' + size + '/' + name;
        } else if ( type == 'sound' ) {
          var ext = 'oga';
          if ( !OSjs.Utils.getCompability().audioTypes.ogg ) {
            ext = 'mp3';
          }
          name = '/themes/' + theme + '/sounds/' + name + '.' + ext;
        } else if ( type == 'wm' ) {
          name = '/themes/' + theme + '/wm/' + name;
        } else if ( type == 'base' ) {
          name = '/themes/' + theme + '/' + name;
        }
      }
    }

    return name;
  };

  DefaultHandler.prototype.getThemeCSS = function(name) {
    if ( name === null ) {
      return '/frontend/blank.css';
    }
    return '/themes/' + name + '.css';
  }

  DefaultHandler.prototype.getResourceURL = function(path) {
    if ( path && path.match(/^\/(themes|frontend|apps)/) ) {
      return path;
    }
    var fsuri = this.getConfig('Core').FSURI;
    return path ? (fsuri + path) : fsuri;
  }

  OSjs.Handlers.Default = DefaultHandler;

})();

