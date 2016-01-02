/*!
 * OS.js - JavaScript Operating System
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

(function(Utils, API) {
  'use strict';

  var OSjs = window.OSjs = window.OSjs || {};
  //var WL   = window.WL   = window.WL || {};

  OSjs.Helpers = OSjs.Helpers || {};

  var redirectURI = window.location.href.replace(/\/$/, '') + '/vendor/wlOauthReceiver.html';

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var SingletonInstance = null;


  /**
   * The WindowsLiveAPI wrapper class
   *
   * This is a private class and can only be aquired through
   * OSjs.Helpers.WindowsLiveAPI.createInsatance()
   *
   * Generally you want to create an instance of this helper
   * and when successfully created use `window.WL`.
   *
   * @see OSjs.Helpers.WindowsLiveAPI.createInsatance()
   * @api OSjs.Helpers.WindowsLiveAPI.WindowsLiveAPI
   *
   * @link http://msdn.microsoft.com/en-us/library/hh826547.aspx
   * @link http://msdn.microsoft.com/en-us/library/hh826538.aspx
   * @link http://msdn.microsoft.com/en-us/library/hh550837.aspx
   * @link http://msdn.microsoft.com/en-us/library/dn631844.aspx
   * @link http://msdn.microsoft.com/en-us/library/dn631839.aspx
   * @link http://msdn.microsoft.com/en-us/library/hh243643.aspx
   * @link https://account.live.com/developers/applications/index
   *
   * @private
   * @class
   */
  function WindowsLiveAPI(clientId) {
    this.hasSession = false;
    this.clientId = clientId;
    this.loaded = false;
    this.inited = false;
    this.accessToken = null;
    this.lastScope = null;
    this.preloads = [{
      type: 'javascript',
      src: '//js.live.net/v5.0/wl.js'
    }];
  }

  /**
   * Destroy the class
   */
  WindowsLiveAPI.prototype.destroy = function() {
  };

  /**
   * Initializes (preloads) the API
   */
  WindowsLiveAPI.prototype.init = function(callback) {
    callback = callback || function() {};
    var self = this;
    if ( this.loaded ) {
      callback(false, true);
    } else {
      Utils.preload(this.preloads, function(total, failed) {
        if ( !failed.length ) {
          self.loaded = true;
        }
        callback(failed.join('\n'));
      });
    }
  };

  /**
   * Loads the API
   */
  WindowsLiveAPI.prototype.load = function(scope, callback) {
    console.debug('WindowsLiveAPI::load()', scope);

    var self = this;
    var WL = window.WL || {};

    function _login() {
      var lastScope = (self.lastScope || []).sort();
      var currScope = (scope || []).sort();

      if ( self.hasSession && (lastScope.toString() === currScope.toString()) ) {
        callback(false, true);
        return;
      }

      self.login(scope, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }

        setTimeout(function() {
          callback(false, true);
        }, 10);
      });
    }

    this.init(function(error) {
      if ( error ) {
        callback(error);
        return;
      }

      if ( !window.WL ) {
        callback(API._('WLAPI_LOAD_FAILURE'));
        return;
      }
      WL = window.WL || {};

      if ( self.inited ) {
        _login();
      } else {
        self.inited = true;
        WL.Event.subscribe('auth.login', function() {
          self.onLogin.apply(self, arguments);
        });
        WL.Event.subscribe('auth.logout', function() {
          self.onLogout.apply(self, arguments);
        });
        WL.Event.subscribe('wl.log', function() {
          self.onLog.apply(self, arguments);
        });
        WL.Event.subscribe('auth.sessionChange', function() {
          self.onSessionChange.apply(self, arguments);
        });

        WL.init({
          client_id: self.clientId,
          display: 'popup',
          redirect_uri: redirectURI
        }).then(function(result) {
          console.debug('WindowsLiveAPI::load()', '=>', result);

          if ( result.session ) {
            self.accessToken = result.session.access_token || null;
          }

          if ( result.status === 'connected' ) {
            callback(false, true);
          } else if ( result.status === 'success' ) {
            _login();
          } else {
            callback(API._('WLAPI_INIT_FAILED_FMT', result.status.toString()));
          }
        }, function(result) {
          console.error('WindowsLiveAPI::load()', 'init() error', result);
          callback(result.error_description);
        });
      }
    });
  };

  WindowsLiveAPI.prototype._removeRing = function() {
    var ring = API.getServiceNotificationIcon();
    if ( ring ) {
      ring.remove('Windows Live API');
    }
  };

  /**
   * Sign out of WindowsLiveAPI
   *
   * @param   Function    cb      Callback => fn(error, result)
   *
   * @return  void
   *
   * @method  WindowsLiveAPI::logout()
   */
  WindowsLiveAPI.prototype.logout = function(callback) {
    callback = callback || function() {};

    var self = this;
    var WL = window.WL || {};

    if ( this.hasSession ) {
      callback(false, false);
    }

    WL.Event.unsubscribe('auth.logout');
    WL.Event.subscribe('auth.logout', function() {
      self._removeRing();

      WL.Event.unsubscribe('auth.logout');
      callback(false, true);
    });

    WL.logout();

    if ( OSjs.VFS.Modules.OneDrive ) {
      OSjs.VFS.Modules.OneDrive.unmount();
    }
  };

  /**
   * Authenticates the user
   */
  WindowsLiveAPI.prototype.login = function(scope, callback) {
    var self = this;
    var WL = window.WL || {};

    if ( this.hasSession ) {
      callback(false, true);
      return;
    }

    WL.login({
      scope: scope,
      redirect_uri: redirectURI
    }).then(function(result) {
      if ( result.status === 'connected' ) {
        callback(false, true);
      } else {
        callback(API._('WLAPI_LOGIN_FAILED'));
      }
    }, function(result) {
        callback(API._('WLAPI_LOGIN_FAILED_FMT', result.error_description));
    });
  };

  /**
   * If the API session was changed
   */
  WindowsLiveAPI.prototype.onSessionChange = function() {
    console.warn('WindowsLiveAPI::onSessionChange()', arguments);
    var WL = window.WL || {};
    var session = WL.getSession();
    if ( session ) {
      this.hasSession = true;
    } else {
      this.hasSession = false;
    }
  };

  /**
   * When user logged in
   */
  WindowsLiveAPI.prototype.onLogin = function() {
    console.warn('WindowsLiveAPI::onLogin()', arguments);
    this.hasSession = true;

    var self = this;
    var ring = API.getServiceNotificationIcon();
    if ( ring ) {
      ring.add('Windows Live API', [{
        title: API._('WLAPI_SIGN_OUT'),
        onClick: function() {
          self.logout();
        }
      }]);
    }
  };

  /**
   * When user logs out
   */
  WindowsLiveAPI.prototype.onLogout = function() {
    console.warn('WindowsLiveAPI::onLogout()', arguments);
    this.hasSession = false;
    this._removeRing();
  };

  /**
   * When API sends a log message
   */
  WindowsLiveAPI.prototype.onLog = function() {
    console.debug('WindowsLiveAPI::onLog()', arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.WindowsLiveAPI = OSjs.Helpers.WindowsLiveAPI || {};

  /**
   * Gets the currently running instance
   *
   * @api OSjs.Helpers.WindowsLiveAPI.getInstance()
   *
   * @return  WindowsLiveAPI       Can also be null
   */
  OSjs.Helpers.WindowsLiveAPI.getInstance = function() {
    return SingletonInstance;
  };

  /**
   * Create an instance of WindowsLiveAPI
   *
   * @param   Object    args      Arguments
   * @param   Function  callback  Callback function => fn(error, instance)
   *
   * @option  args    Array     scope     What scope to load
   *
   * @api OSjs.Helpers.WindowsLiveAPI.createInstance()
   *
   * @return  void
   */
  OSjs.Helpers.WindowsLiveAPI.createInstance = function(args, callback) {
    args = args || {};

    function _run() {
      var scope = args.scope;
      SingletonInstance.load(scope, function(error) {
        callback(error ? error : false, SingletonInstance);
      });
    }

    if ( SingletonInstance ) {
      _run();
      return;
    }

    var clientId = null;
    try {
      clientId = API.getConfig('WindowsLiveAPI.ClientId');
    } catch ( e ) {
      console.warn('getWindowsLiveAPI()', e, e.stack);
    }

    if ( !clientId ) {
      callback(API._('WLAPI_DISABLED'));
      return;
    }

    SingletonInstance = new WindowsLiveAPI(clientId);
    _run();
  };

})(OSjs.Utils, OSjs.API);
