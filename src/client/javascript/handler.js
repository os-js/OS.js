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
   * You can implement your own.
   *
   * NEVER CONSTRUCT YOUR OWN INTANCE! To get one use:
   * OSjs.Core.getHandler();
   *
   * @api   OSjs.Core._Handler
   * @link http://os.js.org/doc/manuals/man-multiuser.html
   * @link http://os.js.org/doc/tutorials/create-handler.html
   * @class _Handler
   */
  var _Handler = function() {
    if ( _handlerInstance ) {
      throw Error('Cannot create another Handler Instance');
    }

    this.dialogs    = null;
    this.offline    = false;
    this.nw         = null;
    this.userData   = {
      id      : 0,
      username: 'root',
      name    : 'root user',
      groups  : ['root']
    };

    if ( (API.getConfig('Connection.Type') === 'nw') ) {
      this.nw = require('osjs').init({
        root: process.cwd(),
        settings: {
          mimes: API.getConfig('MIME.mapping')
        },
        nw: true
      });
    }

    _handlerInstance = this;
  };

  /**
   * Initializes the handler
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
    API.setLocale(API.getConfig('Locale'));

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
    this.nw = null;

    _handlerInstance = null;
  };

  /**
   * Called after the Handler is initialized
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

    var root = API.getConfig('Connection.RootURI');
    var url = root + 'client/dialogs.html';
    if ( API.getConfig('Connection.Dist') === 'dist' ) {
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
   *
   * NOTE: This is just a placeholder. The actual method
   *       is in the currently assigned (ex: handlers/demo/handler.js)
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
   * @param   boolean   save          Save session?
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
          var data = {name: app.__pname, args: args, windows: []};

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
   *
   * Please note that this function is internal, and if you want to make
   * a actual API call, use "API.call()" instead.
   *
   * @see OSjs.API.call()
   *
   * @see _Handler::__callNW()
   * @see _Handler::_callAPI()
   * @see _Handler::_callVFS()
   * @method  _Handler::callAPI()
   */
  _Handler.prototype.callAPI = function(method, args, cbSuccess, cbError, options) {
    args      = args      || {};
    options   = options   || {};
    cbSuccess = cbSuccess || function() {};
    cbError   = cbError   || function() {};

    var self = this;

    function checkState() {
      if ( self.offline ) {
        cbError('You are currently off-line and cannot perform this operation!');
        return false;
      } else if ( (API.getConfig('Connection.Type') === 'standalone') ) {
        cbError('You are currently running locally and cannot perform this operation!');
        return false;
      }
      return true;
    }

    function _call() {
      if ( (API.getConfig('Connection.Type') === 'nw') ) {
        return self.__callNW(method, args, options, cbSuccess, cbError);
      }

      if ( method.match(/^FS/) ) {
        return self._callVFS(method, args, options, cbSuccess, cbError);
      }
      return self._callAPI(method, args, options, cbSuccess, cbError);
    }

    console.group('Handler::callAPI()');
    console.log('Method', method);
    console.log('Arguments', args);
    console.log('Options', options);
    console.groupEnd();

    return checkState() ? _call() : false;
  };

  /**
   * Calls NW "backend"
   *
   * @return boolean
   * @method _Handler::__callNW()
   * @see  _Handler::callAPI()
   */
  _Handler.prototype.__callNW = function(method, args, options, cbSuccess, cbError) {
    try {
      this.nw.request(method.match(/^FS\:/) !== null, method.replace(/^FS\:/, ''), args, function(err, res) {
        cbSuccess({error: err, result: res});
      });
    } catch ( e ) {
      console.warn('callAPI() NW.js Warning', e.stack, e);
      cbError(e);
    }
    return true;
  };

  /**
   * Calls Normal "Backend"
   *
   * @see _Handler::_callAPI()
   * @see _Handler::_callVFS()
   * @method  _Handler::__callXHR()
   */
  _Handler.prototype.__callXHR = function(url, args, options, cbSuccess, cbError) {
    var self = this;
    var data = {
      url: url,
      method: 'POST',
      json: true,
      body: args,
      onsuccess: function(/*response, request, url*/) {
        cbSuccess.apply(self, arguments);
      },
      onerror: function(/*error, response, request, url*/) {
        cbError.apply(self, arguments);
      }
    };

    if ( options ) {
      Object.keys(options).forEach(function(key) {
        data[key] = options[key];
      });
    }

    Utils.ajax(data);

    return true;
  };

  /**
   * Wrapper for server API XHR calls
   *
   * @return boolean
   * @method _Handler::_callAPI()
   * @see  _Handler::callAPI()
   * @see  _Handler::__callXHR()
   */
  _Handler.prototype._callAPI = function(method, args, options, cbSuccess, cbError) {
    var url = API.getConfig('Connection.APIURI') + '/' + method;
    return this.__callXHR(url, args, options, cbSuccess, cbError);
  };

  /**
   * Wrapper for server VFS XHR calls
   *
   * @return boolean
   * @method _Handler::_callVFS()
   * @see  _Handler::callAPI()
   * @see _Handler::__callGET()
   * @see _Handler::__callPOST()
   * @see  _Handler::__callXHR()
   */
  _Handler.prototype._callVFS = function(method, args, options, cbSuccess, cbError) {
    if ( method === 'FS:xhr' ) {
      return this.__callGET(args, options, cbSuccess, cbError);
    } else if ( method === 'FS:upload' ) {
      return this.__callPOST(args, options, cbSuccess, cbError);
    }

    var url = API.getConfig('Connection.FSURI') + '/' + method.replace(/^FS\:/, '');
    return this.__callXHR(url, args, options, cbSuccess, cbError);
  };

  /**
   * Does a HTTP POST via XHR (For file uploading)
   *
   * @return boolean
   * @method _Handler::__callPOST()
   * @see  _Handler::callAPI()
   */
  _Handler.prototype.__callPOST = function(form, options, cbSuccess, cbError) {
    var onprogress = options.onprogress || function() {};

    OSjs.Utils.ajax({
      url: OSjs.VFS.Transports.Internal.path(),
      method: 'POST',
      body: form,
      onsuccess: function(result) {
        cbSuccess(false, result);
      },
      onerror: function(result) {
        cbError('error', null, result);
      },
      onprogress: function(evt) {
        onprogress(evt);
      },
      oncanceled: function(evt) {
        cbError('canceled', null, evt);
      }
    });

    return true;
  };

  /**
   * Does a HTTP GET via XHR (For file downloading);
   *
   * @return boolean
   * @method _Handler::__callGET()
   * @see  _Handler::callAPI()
   */
  _Handler.prototype.__callGET = function(args, options, cbSuccess, cbError) {
    var self = this;
    var onprogress = args.onprogress || function() {};

    Utils.ajax({
      url: args.url || OSjs.VFS.Transports.Internal.path(args.path),
      method: args.method || 'GET',
      responseType: 'arraybuffer',
      onprogress: function(ev) {
        if ( ev.lengthComputable ) {
          onprogress(ev, ev.loaded / ev.total);
        } else {
          onprogress(ev, -1);
        }
      },
      onsuccess: function(response, xhr) {
        if ( !xhr || xhr.status === 404 || xhr.status === 500 ) {
          cbSuccess({error: xhr.statusText || response, result: null});
          return;
        }
        cbSuccess({error: false, result: response});
      },
      onerror: function(error) {
        cbError.apply(self, arguments);
      }
    });

    return true;
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

    if ( !userSettings || userSettings instanceof Array ) {
      userSettings = {};
    }

    this.userData = userData;

    // Ensure we get the user-selected locale configured from WM
    function getUserLocale() {
      var curLocale = Utils.getUserLocale() || API.getConfig('Locale');
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
   * @method _Handler::onOnline()
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
   * @method _Handler::onOffline()
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
   * @method _Handler::saveSettings()
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
    return this.userData || {};
  };

  /**
   * Initializes login screen
   *
   * @method  _Handler::initLoginScreen()
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
      self.login(username, password, function(result, error) {
        if ( error ) {
          alert(error);
          _restore();
          return;
        }

        console.debug('OSjs::Handlers::init()', 'login response', result);
        container.parentNode.removeChild(container);

        self.onLogin(result.userData, result.userSettings, function() {
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

