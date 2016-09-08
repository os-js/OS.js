/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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

(function(API, Utils) {
  'use strict';

  /**
   * @namespace Handlers
   * @memberof OSjs
   */

  /**
   * Callback for all Handler methods
   * @param {String} [error] Error from response (if any)
   * @param {Mixed} result Result from response (if any)
   * @callback CallbackHandler
   */

  var _handlerInstance;

  /**
   * Attaches options to a XHR call
   */
  function appendRequestOptions(data, options) {
    options = options || {};

    var onprogress = options.onprogress || function() {};
    var ignore = ['onsuccess', 'onerror', 'onprogress', 'oncanceled'];

    Object.keys(options).forEach(function(key) {
      if ( ignore.indexOf(key) === -1 ) {
        data[key] = options[key];
      }
    });

    data.onprogress = function(ev) {
      if ( ev.lengthComputable ) {
        onprogress(ev, ev.loaded / ev.total);
      } else {
        onprogress(ev, -1);
      }
    };

    return data;
  }

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT CONNECTION CODE
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Default Handler Connection Implementation
   *
   * <pre><b>
   * You only have access to this via the 'Handler' instance
   * </b></pre>
   *
   * @summary Wrappers for communicating over HTTP, WS and NW
   *
   * @constructor HandlerConnection
   * @memberof OSjs.Core
   */
  function HandlerConnection(handler) {
    this.index = 0;
    this.handler = handler;
    this.nw = null;
    this.ws = null;

    if ( (API.getConfig('Connection.Type') === 'nw') ) {
      this.nw = require('osjs').init({
        root: process.cwd(),
        settings: {
          mimes: API.getConfig('MIME.mapping')
        },
        nw: true
      });
    }

    this.wsqueue = {};
  }

  /**
   * Initializes the instance
   *
   * @function init
   * @memberof OSjs.Core.HandlerConnection#
   */
  HandlerConnection.prototype.init = function(callback) {
    var self = this;

    if ( API.getConfig('Connection.Type') === 'ws' ) {
      var url = window.location.protocol.replace('http', 'ws') + '//' + window.location.host;
      var connected = false;

      console.info('Using WebSocket', url);

      this.ws = new WebSocket(url);

      this.ws.onopen = function() {
        connected = true;

        callback();
      };

      this.ws.onmessage = function(ev) {
        var data = JSON.parse(ev.data);
        var idx = data._index;

        if ( self.wsqueue[idx] ) {
          delete data._index;

          self.wsqueue[idx](data);

          delete self.wsqueue[idx];
        }
      };

      this.ws.onclose = function(ev) {
        if ( !connected && ev.code !== 3001 ) {
          callback('WebSocket connection error'); // FIXME: Locale
        }
      };

    } else {
      callback();
    }
  };

  /**
   * Destroys the instance
   *
   * @function destroy
   * @memberof OSjs.Core.HandlerConnection#
   */
  HandlerConnection.prototype.destroy = function() {
    if ( this.ws ) {
      this.ws.close();
    }

    this.nw = null;
    this.ws = null;
    this._wsRequest = {};
  };

  /**
   * Makes a HTTP POST call
   *
   * @function callPOST
   * @memberof OSjs.Core.HandlerConnection#
   *
   * @return {Boolean}
   */
  HandlerConnection.prototype.callPOST = function(form, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('HandlerConnection::callPOST()', 'error', arguments);
    };

    var self = this;

    Utils.ajax(appendRequestOptions({
      url: OSjs.VFS.Transports.Internal.path(),
      method: 'POST',
      body: form,
      onsuccess: function(result) {
        onsuccess(false, result);
      },
      onerror: function(result) {
        onerror('error', null, result);
      },
      oncanceled: function(evt) {
        onerror('canceled', null, evt);
      }
    }, options));

    return true;
  };

  /**
   * Makes a HTTP GET call
   *
   * @function callGET
   * @memberof OSjs.Core.HandlerConnection#
   *
   * @return {Boolean}
   */
  HandlerConnection.prototype.callGET = function(args, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('HandlerConnection::callGET()', 'error', arguments);
    };

    var self = this;

    Utils.ajax(appendRequestOptions({
      url: args.url || OSjs.VFS.Transports.Internal.path(args.path),
      method: args.method || 'GET',
      responseType: 'arraybuffer',
      onsuccess: function(response, xhr) {
        if ( !xhr || xhr.status === 404 || xhr.status === 500 ) {
          onsuccess({error: xhr.statusText || response, result: null});
          return;
        }
        onsuccess({error: false, result: response});
      },
      onerror: function() {
        onerror.apply(self, arguments);
      }
    }, options));

    return true;
  };

  /**
   * Makes a HTTP XHR call
   *
   * @function callXHR
   * @memberof OSjs.Core.HandlerConnection#
   *
   * @return {Boolean}
   */
  HandlerConnection.prototype.callXHR = function(url, args, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('HandlerConnection::callXHR()', 'error', arguments);
    };

    var self = this;

    Utils.ajax(appendRequestOptions({
      url: url,
      method: 'POST',
      json: true,
      body: args,
      onsuccess: function(/*response, request, url*/) {
        onsuccess.apply(self.handler, arguments);
      },
      onerror: function(/*error, response, request, url*/) {
        onerror.apply(self.handler, arguments);
      }
    }, options));

    return true;
  };

  /**
   * Makes a WebSocket call
   *
   * @function callWS
   * @memberof OSjs.Core.HandlerConnection#
   *
   * @return {Boolean}
   */
  HandlerConnection.prototype.callWS = function(path, args, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('HandlerConnection::callWS()', 'error', arguments);
    };

    var idx = this.index++;

    try {
      this.ws.send(JSON.stringify({
        _index: idx,
        sid: Utils.getCookie('session'),
        path: '/' + path,
        args: args
      }));

      this.wsqueue[idx] = onsuccess || function() {};

      return true;
    } catch ( e ) {
      console.warn('callWS() Warning', e.stack, e);
      onerror(e);
    }

    return false;
  };

  /**
   * Makes a Node NW call
   *
   * @function callNW
   * @memberof OSjs.Core.HandlerConnection#
   *
   * @return {Boolean}
   */
  HandlerConnection.prototype.callNW = function(method, args, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('HandlerConnection::callNW()', 'error', arguments);
    };

    try {
      this.nw.request(method.match(/^FS\:/) !== null, method.replace(/^FS\:/, ''), args, function(err, res) {
        onsuccess({error: err, result: res});
      });

      return true;
    } catch ( e ) {
      console.warn('callNW() Warning', e.stack, e);
      onerror(e);
    }

    return false;
  };

  /**
   * Wrapper for OS.js API calls
   *
   * @function request
   * @memberof OSjs.Core.HandlerConnection#
   *
   * @return {Boolean}
   */
  HandlerConnection.prototype.request = function(isVfs, method, args, options, onsuccess, onerror) {

    // Proxy all requests to NW module if required
    if ( API.getConfig('Connection.Type') === 'nw' ) {
      return this.callNW(method, args, options, onsuccess, onerror);
    }

    // Some methods can only be handled via HTTP
    if ( isVfs ) {
      if ( method === 'FS:get' ) {
        return this.callGET(args, options, onsuccess, onerror);
      } else if ( method === 'FS:upload' ) {
        return this.callPOST(args, options, onsuccess, onerror);
      }
    }

    // Use AJAX or WebSocket for everything else
    var url = (function() {
      if ( isVfs ) {
        return API.getConfig('Connection.FSURI') + '/' + method.replace(/^FS\:/, '');
      }
      return API.getConfig('Connection.APIURI') + '/' + method;
    })();

    if ( API.getConfig('Connection.Type') === 'ws' ) {
      return this.callWS(url, args, options, onsuccess, onerror);
    }

    return this.callXHR(url, args, options, onsuccess, onerror);
  };

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT HANDLING CODE
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Default Handler Implementation
   *
   * <pre><b>
   * YOU CAN ONLY GET AN INSTANCE WITH `Core.getHandler()`
   * </b></pre>
   *
   * @summary Used for communication, resources, settings and session handling
   * @throws {Error} If trying to construct multiple handlers
   *
   * @example
   * OSjs.Core.getHandler()
   *
   * @constructor Handler
   * @memberof OSjs.Core
   * @see OSjs.Core.getHandler
   */
  var _Handler = function() {
    /*eslint consistent-this: "warn"*/

    if ( _handlerInstance ) {
      throw Error('Cannot create another Handler Instance');
    }

    this._saveTimeout = null;

    /**
     * If user is logged in
     * @name loggedId
     * @memberof OSjs.Core.Handler#
     * @type {Boolean}
     */
    this.loggedIn   = false;

    /**
     * If browser is offline
     * @name offline
     * @memberof OSjs.Core.Handler#
     * @type {Boolean}
     */
    this.offline    = false;

    /**
     * User data
     * @name userData
     * @memberof OSjs.Core.Handler#
     * @type {Object}
     * @example
     * {
     *  id: -1,
     *  username: 'foo',
     *  groups: []
     * }
     */
    this.userData   = {
      id      : 0,
      username: 'root',
      name    : 'root user',
      groups  : ['admin']
    };

    /**
     * Connection management
     * @name connection
     * @memberof OSjs.Core.Handler#
     * @type {HandlerConnection}
     */
    this.connection = new HandlerConnection();

    _handlerInstance = this;
  };

  /**
   * Initializes the handler
   *
   * @function init
   * @memberof OSjs.Core.Handler#
   * @see OSjs.API.initialize
   *
   * @param   {CallbackHandler}      callback        Callback function
   */
  _Handler.prototype.init = function(callback) {
    console.group('Handler::init()');

    var self = this;
    API.setLocale(API.getConfig('Locale'));

    if ( typeof navigator.onLine !== 'undefined' ) {
      Utils.$bind(window, 'offline', function(ev) {
        self.onOffline();
      });
      Utils.$bind(window, 'online', function(ev) {
        self.onOnline();
      });
    }

    this.connection.init(function(err, res) {
      console.groupEnd();

      callback(err, res);
    });
  };

  /**
   * Destroy the handler
   *
   * @function destroy
   * @memberof OSjs.Core.Handler#
   */
  _Handler.prototype.destroy = function() {
    var self = this;

    Utils.$unbind(window, 'offline');
    Utils.$unbind(window, 'online');

    if ( this.connection ) {
      this.connection.destroy();
    }
    this.connection = null;

    _handlerInstance = null;
  };

  /**
   * Default login method
   *
   * @function login
   * @memberof OSjs.Core.Handler#
   *
   * @param   {String}           username      Login username
   * @param   {String}           password      Login password
   * @param   {CallbackHandler}  callback      Callback function
   */
  _Handler.prototype.login = function(username, password, callback) {
    console.info('Handler::login()', username);

    var opts = {username: username, password: password};
    this.callAPI('login', opts, function(response) {
      if ( response.result ) { // This contains an object with user data
        callback(false, response.result);
      } else {
        var error = response.error || API._('ERR_LOGIN_INVALID');
        callback(API._('ERR_LOGIN_FMT', error), false);
      }
    }, function(error) {
      callback(API._('ERR_LOGIN_FMT', error), false);
    });
  };

  /**
   * Default logout method
   *
   * @function logout
   * @memberof OSjs.Core.Handler#
   *
   * @param   {Boolean}          save          Save session?
   * @param   {CallbackHandler}  callback      Callback function
   */
  _Handler.prototype.logout = function(save, callback) {
    console.info('Handler::logout()');

    var self = this;

    function _finished() {
      var opts = {};
      self.callAPI('logout', opts, function(response) {
        if ( response.result ) {
          self.loggedIn = false;
          callback(true);
        } else {
          callback(false, 'An error occured: ' + (response.error || 'Unknown error'));
        }
      }, function(error) {
        callback(false, 'Logout error: ' + error);
      });
    }

    if ( save ) {
      this.saveSession(function() {
        _finished(true);
      });
      return;
    }
    _finished(true);
  };

  /**
   * Default method for saving current sessions
   *
   * @function saveSession
   * @memberof OSjs.Core.Handler#
   *
   * @param   {CallbackHandler}  callback      Callback function
   */
  _Handler.prototype.saveSession = function(callback) {
    var data = [];
    API.getProcesses().forEach(function(proc, i) {
      if ( proc && (proc instanceof OSjs.Core.Application) ) {
        data.push(proc._getSessionData());
      }
    });
    OSjs.Core.getSettingsManager().set('UserSession', null, data, callback);
  };

  /**
   * Get last saved sessions
   *
   * @function getLastSession
   * @memberof OSjs.Core.Handler#
   *
   * @param   {CallbackHandler}  callback      Callback function
   */
  _Handler.prototype.getLastSession = function(callback) {
    callback = callback || function() {};

    var res = OSjs.Core.getSettingsManager().get('UserSession');
    var list = [];
    (res || []).forEach(function(iter, i) {
      var args = iter.args;
      args.__resume__ = true;
      args.__windows__ = iter.windows || [];

      list.push({name: iter.name, args: args});
    });

    callback(false, list);
  };

  /**
   * Default method to restore last running session
   *
   * @function loadSession
   * @memberof OSjs.Core.Handler#
   *
   * @param   {Function}  callback      Callback function => fn()
   */
  _Handler.prototype.loadSession = function(callback) {
    callback = callback || function() {};

    console.info('Handler::loadSession()');

    this.getLastSession(function(err, list) {
      if ( err ) {
        callback();
      } else {
        API.launchList(list, null, null, callback);
      }
    });
  };

  /**
   * Default method to save given settings pool
   *
   * @function saveSettings
   * @memberof OSjs.Core.Handler#
   *
   * @param   {String}           [pool]        Pool Name
   * @param   {Mixed}            storage       Storage data
   * @param   {CallbackHandler}  callback      Callback function
   */
  _Handler.prototype.saveSettings = function(pool, storage, callback) {
    var self = this;
    var opts = {settings: storage};

    function _save() {
      self.callAPI('settings', opts, function(response) {
        callback.call(self, false, response.result);
      }, function(error) {
        callback.call(self, error, false);
      });
    }

    if ( this._saveTimeout ) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }

    setTimeout(_save, 250);
  };

  /**
   * Default method to perform a resolve on a VFS File object.
   *
   * This should return the URL for given resource.
   *
   * @function getVFSPath
   * @memberof OSjs.Core.Handler#
   *
   * @param   {OSjs.VFS.File}       item      The File Object
   *
   * @return  {String}
   */
  _Handler.prototype.getVFSPath = function(item) {
    var base = API.getConfig('Connection.FSURI', '/');
    if ( item ) {
      return base + '/get/' + item.path;
    }
    return base + '/upload';
  };

  /**
   * Gets the default options for API calls
   *
   * @function getAPICallOptions
   * @memberof OSjs.Core.Handler#
   *
   * @return  {Object}
   */
  _Handler.prototype.getAPICallOptions = function() {
    return {};
  };

  /**
   * Default method to perform a call to the backend (API)
   *
   * Please note that this function is internal, and if you want to make
   * a actual API call, use "API.call()" instead.
   *
   * @param {String}    method      API method name
   * @param {Object}    args        API method arguments
   * @param {Function}  cbSuccess   On success
   * @param {Function}  cbError     On error
   * @param {Object}    [options]   Options passed on to the connection request method (ex: Utils.ajax)
   *
   * @function callAPI
   * @memberof OSjs.Core.Handler#
   * @see OSjs.Core.handler#getAPICallOptions
   * @see OSjs.Core.Handler#_callAPI
   * @see OSjs.Core.Handler#_callVFS
   * @see OSjs.Core.API.call
   */
  _Handler.prototype.callAPI = function(method, args, cbSuccess, cbError, options) {
    args = args || {};
    options = Utils.mergeObject(this.getAPICallOptions(), options || {});
    cbSuccess = cbSuccess || function() {};
    cbError = cbError || function() {};

    if ( this.offline ) {
      cbError('You are currently off-line and cannot perform this operation!');
    } else if ( (API.getConfig('Connection.Type') === 'standalone') ) {
      cbError('You are currently running locally and cannot perform this operation!');
    } else {
      if ( method.match(/^FS/) ) {
        return this._callVFS(method, args, options, cbSuccess, cbError);
      }
      return this._callAPI(method, args, options, cbSuccess, cbError);
    }

    return false;
  };

  /**
   * Wrapper for server API XHR calls
   *
   * @function _callAPI
   * @memberof OSjs.Core.Handler#
   * @see OSjs.Core.Handler.callAPI
   *
   * @return {Boolean}
   */
  _Handler.prototype._callAPI = function(method, args, options, cbSuccess, cbError) {
    return this.connection.request(false, method, args, options, cbSuccess, cbError);
  };

  /**
   * Wrapper for server VFS XHR calls
   *
   * @function _callVFS
   * @memberof OSjs.Core.Handler#
   * @see OSjs.Core.Handler.callAPI
   *
   * @return {Boolean}
   */
  _Handler.prototype._callVFS = function(method, args, options, cbSuccess, cbError) {
    return this.connection.request(true, method, args, options, cbSuccess, cbError);
  };

  //
  // Events
  //

  /**
   * Called when login() is finished
   *
   * @function onLogin
   * @memberof OSjs.Core.Handler#
   *
   * @param   {Object}           data          JSON Data from login action (userData, userSettings, etc)
   * @param   {CallbackHandler}  callback      Callback function
   */
  _Handler.prototype.onLogin = function(data, callback) {
    callback = callback || function() {};

    var userSettings = data.userSettings;
    if ( !userSettings || userSettings instanceof Array ) {
      userSettings = {};
    }

    this.userData = data.userData;

    // Ensure we get the user-selected locale configured from WM
    function getUserLocale() {
      var curLocale = API.getConfig('Locale');
      var detectedLocale = Utils.getUserLocale();

      if ( API.getConfig('LocaleOptions.AutoDetect', true) && detectedLocale ) {
        console.info('Auto-detected user locale via browser', detectedLocale);
        curLocale = detectedLocale;
      }

      var result = OSjs.Core.getSettingsManager().get('CoreWM');
      if ( !result ) {
        try {
          result = userSettings.CoreWM;
        } catch ( e )  {}
      }
      return result ? (result.language || curLocale) : curLocale;
    }

    document.getElementById('LoadingScreen').style.display = 'block';

    API.setLocale(getUserLocale());
    OSjs.Core.getSettingsManager().init(userSettings);

    if ( data.blacklistedPackages ) {
      OSjs.Core.getPackageManager().setBlacklist(data.blacklistedPackages);
    }

    this.loggedIn = true;

    callback();
  };

  /**
   * Called upon a VFS request
   *
   * You can use this to interrupt/hijack operations.
   *
   * It is what gets called 'before' a VFS request takes place
   *
   * @function onVFSRequest
   * @memberof OSjs.Core.Handler#
   *
   * @param   {String}    vfsModule     VFS Module Name
   * @param   {String}    vfsMethod     VFS Method Name
   * @param   {Object}    vfsArguments  VFS Method Arguments
   * @param   {Function}  callback      Callback function
   */
  _Handler.prototype.onVFSRequest = function(vfsModule, vfsMethod, vfsArguments, callback) {
    // If you want to interrupt/hijack or modify somehow, just send the two arguments to the
    // callback: (error, result)
    callback(/* continue normal behaviour */);
  };

  /**
   * Called upon a VFS request completion
   *
   * It is what gets called 'after' a VFS request has taken place
   *
   * @function onVFSRequestCompleted
   * @memberof OSjs.Core.Handler#
   *
   * @param   {String}    vfsModule     VFS Module Name
   * @param   {String}    vfsMethod     VFS Method Name
   * @param   {Object}    vfsArguments  VFS Method Arguments
   * @param   {String}    vfsError      VFS Response Error
   * @param   {Mixed}     vfsResult     VFS Response Result
   * @param   {Function}  callback      Callback function
   */
  _Handler.prototype.onVFSRequestCompleted = function(vfsModule, vfsMethod, vfsArguments, vfsError, vfsResult, callback) {
    // If you want to interrupt/hijack or modify somehow, just send the two arguments to the
    // callback: (error, result)
    callback(/* continue normal behaviour */);
  };

  /**
   * When browser goes online
   *
   * @function onOnline
   * @memberof OSjs.Core.Handler#
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
   * @function onOffline
   * @memberof OSjs.Core.Handler#
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
   * Get data for logged in user
   *
   * @function getUserData
   * @memberof OSjs.Core.Handler#
   *
   * @return  {Object}      JSON With user data
   */
  _Handler.prototype.getUserData = function() {
    return this.userData || {};
  };

  /**
   * Initializes login screen
   *
   * @function initLoginScreen
   * @memberof OSjs.Core.Handler#
   * @throws {Error} If the login dom element does not exist
   */
  _Handler.prototype.initLoginScreen = function(callback) {
    var self      = this;
    var container = document.getElementById('Login');
    var login     = document.getElementById('LoginForm');
    var u         = document.getElementById('LoginUsername');
    var p         = document.getElementById('LoginPassword');
    var s         = document.getElementById('LoginSubmit');

    if ( !container ) {
      throw new Error('Could not find Login Form Container');
    }

    function _restore() {
      s.removeAttribute('disabled');
      u.removeAttribute('disabled');
      p.removeAttribute('disabled');
    }

    function _lock() {
      s.setAttribute('disabled', 'disabled');
      u.setAttribute('disabled', 'disabled');
      p.setAttribute('disabled', 'disabled');
    }

    function _login(username, password) {
      self.login(username, password, function(error, result) {
        if ( error ) {
          alert(error);
          _restore();
          return;
        }

        console.debug('Handlers::init()', 'login response', result);
        container.parentNode.removeChild(container);

        self.onLogin(result, function() {
          callback();
        });
      });
    }

    login.onsubmit = function(ev) {
      _lock();
      if ( ev ) {
        ev.preventDefault();
      }
      _login(u.value, p.value);
    };

    container.style.display = 'block';

    _restore();
  };

  /**
   * Apply certain traits for given class
   *
   * Available traits are: defaults, init, login, logout, settings
   *
   * Usage: _Handler.use.<trait>(obj)
   *
   * @method  {Class}   obj     Class reference
   *
   * @function use
   * @memberof OSjs.Core.Handler
   */
  _Handler.use = (function() {

    //
    // Traits
    //
    var traits = {
      init: function defaultInit(callback) {
        var self = this;
        return OSjs.Core._Handler.prototype.init.call(this, function() {
          self.initLoginScreen(callback);
        });
      },

      login: function defaultLogin(username, password, callback) {
        return OSjs.Core._Handler.prototype.login.apply(this, arguments);
      },

      logout: function defaultLogout(save, callback) {
        return OSjs.Core._Handler.prototype.logout.apply(this, arguments);
      },

      settings: function defaultSettings(pool, storage, callback) {
        return OSjs.Core._Handler.prototype.saveSettings.apply(this, arguments);
      }
    };

    //
    // Helpers
    //

    function applyTraits(obj, add) {
      add.forEach(function(fn) {
        obj.prototype[fn] = traits[fn];
      });
    }

    //
    // Exports
    //
    var exports = {
      defaults: function(obj) {
        applyTraits(obj, Object.keys(traits));
      }
    };

    Object.keys(traits).forEach(function(k) {
      exports[k] = function(obj) {
        applyTraits(obj, [k]);
      };
    });

    return exports;
  })();

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core._Handler = _Handler;
  OSjs.Core.Handler  = null;

  /**
   * Get running 'Handler' instance
   *
   * @function getHandler
   * @memberof OSjs.Core
   *
   * @return {OSjs.Core.Handler}
   */
  OSjs.Core.getHandler = function() {
    return _handlerInstance;
  };

})(OSjs.API, OSjs.Utils);

