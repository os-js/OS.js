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


//
// NOTE NOTE NOTE NOTE NOTE NOTE
//
// THIS IS HIGHLY EXPERIMENTAL!!!!
//
// NOTE NOTE NOTE NOTE NOTE NOTE
//

// http://msdn.microsoft.com/en-us/library/hh826547.aspx
// http://msdn.microsoft.com/en-us/library/hh826538.aspx
// http://msdn.microsoft.com/en-us/library/hh550837.aspx
// http://msdn.microsoft.com/en-us/library/dn631844.aspx
//
// http://msdn.microsoft.com/en-us/library/dn631839.aspx
// http://msdn.microsoft.com/en-us/library/hh243643.aspx

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

  function WindowsLiveAPI(clientId) {
    this.hasSession = false;
    this.clientId = clientId;
    this.loaded = false;
    this.preloads = [{
      type: 'javascript',
      src: '//js.live.net/v5.0/wl.js'
    }];
  }

  WindowsLiveAPI.prototype.destroy = function() {
  };

  WindowsLiveAPI.prototype.init = function(callback) {
    callback = callback || function() {};
    var self = this;
    if ( this.loaded ) {
      callback(false, true);
    } else {
      Utils.Preload(this.preloads, function(total, errors) {
        if ( !errors ) {
          self.loaded = true;
        }
        callback(errors);
      });
    }
  };

  WindowsLiveAPI.prototype.load = function(scope, callback) {
    console.debug('WindowsLiveAPI::load()', scope);

    var self = this;
    this.init(function(error) {
      if ( error ) {
        callback(error.join('\n'));
        return;
      }

      if ( !window.WL ) {
        callback('Windows Live API Was not loaded'); // FIXME: Translation
        return;
      }

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
        scope: scope,
        client_id: self.clientId,
        display: 'popup',
        redirect_uri: redirectURI
      }).then(function(result) {
        console.debug('WindowsLiveAPI::load()', '=>', result);

        if ( result.status == 'connected' ) {
          callback(false, true);
        } else {
          self.login(scope, function(error, response) {
            if ( error ) {
              callback(error);
              return;
            }

            callback(false, true);
          });
        }
      }, function(result) {
        console.error('WindowsLiveAPI::load()', 'init() error', result);
        callback(result.error_description);
      });
    });
  };

  WindowsLiveAPI.prototype._removeRing = function() {
    var ring = OSjs.Helpers.getServiceRing();
    if ( ring ) {
      ring.remove('Windows Live API');
    }
  };

  WindowsLiveAPI.prototype.logout = function(callback) {
    callback = callback || function() {};

    var self = this;
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
  };

  WindowsLiveAPI.prototype.login = function(scope, callback) {
    var self = this;
    if ( this.hasSession ) {
      callback(false, true);
      return;
    }

    WL.login({
      scope: scope,
      redirect_uri: redirectURI
    }).then(function(result) {
      if ( result.status == 'connected' ) {
        callback(false, true);
      } else {
        callback('Login failed'); // FIXME: Translation
      }
    }, function(result) {
      callback('An error occured while logging in to Windows Live API: ' + result.error_description); // FIXME: Translation
    });
  };

  WindowsLiveAPI.prototype.onSessionChange = function() {
    console.warn('WindowsLiveAPI::onSessionChange()', arguments);
    var session = WL.getSession();
    if ( session ) {
      this.hasSession = true;
    } else {
      this.hasSession = false;
    }
  };

  WindowsLiveAPI.prototype.onLogin = function() {
    console.warn('WindowsLiveAPI::onLogin()', arguments);
    this.hasSession = true;

    var self = this;
    var ring = OSjs.Helpers.getServiceRing();
    if ( ring ) {
      ring.add('Windows Live API', [{
        title: API._('Sign Out'),
        onClick: function() {
          self.logout();
        }
      }]);
    }
  };

  WindowsLiveAPI.prototype.onLogout = function() {
    console.warn('WindowsLiveAPI::onLogout()', arguments);
    this.hasSession = false;
    this._removeRing();
  };

  WindowsLiveAPI.prototype.onLog = function() {
    console.debug('WindowsLiveAPI::onLog()', arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.WindowsLiveAPI = OSjs.Helpers.WindowsLiveAPI || {};

  OSjs.Helpers.WindowsLiveAPI.getInstance = function() {
    return SingletonInstance;
  };

  OSjs.Helpers.WindowsLiveAPI.createInstance = function(args, callback) {
    args = args || {};

    function _run() {
      var scope = args.scope;
      SingletonInstance.load(scope, function() {
        callback(false, SingletonInstance);
      });
    }

    if ( SingletonInstance ) {
      _run();
      return;
    }

    var clientId = null;
    var handler = API.getHandlerInstance();
    if ( handler ) {
      try {
        clientId = handler.getConfig('WindowsLiveAPI').ClientId;
      } catch ( e ) {
        console.warn('getGoogleAPI()', e, e.stack);
      }
    }

    if ( !clientId ) {
      callback('Windows Live API disabled or not configured'); // FIXME: Translation
      return;
    }

    SingletonInstance = new WindowsLiveAPI(clientId);
    _run();
  };

})(OSjs.Utils, OSjs.API);
