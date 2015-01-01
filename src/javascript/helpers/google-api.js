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

(function(Utils, API) {
  'use strict';

  var OSjs = window.OSjs = window.OSjs || {};
  var gapi = window.gapi = window.gapi || {};

  OSjs.Helpers = OSjs.Helpers || {};

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var SingletonInstance = null;

  function GoogleAPI(clientId) {
    this.clientId       = clientId;
    this.accessToken    = null;
    this.userId         = null;
    this.loaded         = false;
    this.authenticated  = false;
    this.preloads       = [
      {
        type: 'javascript',
        src: 'https://apis.google.com/js/api.js'
      }
    ];
  }

  GoogleAPI.prototype.destroy = function() {
  };

  GoogleAPI.prototype.init = function(callback) {
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

  GoogleAPI.prototype.load = function(load, scope, callback) {
    load = (['auth:client']).concat(load);

    var self = this;
    this.init(function(error) {
      if ( error ) {
        callback(error);
        return;
      }

      if ( !window.gapi || !gapi.load ) {
        callback(API._('GAPI_LOAD_FAILURE'));
        return;
      }

      gapi.load(load.join(','), function() {
        self.authenticate(scope, function(error, result) {
          if ( error ) {
            return callback(error);
          }
          if ( !self.authenticated ) {
            return callback(API._('GAPI_AUTH_FAILURE'));
          }

          callback(false, result);
        });
      });

    });
  };

  GoogleAPI.prototype.signOut = function() {
    console.info('GoogleAPI::signOut()');
    if ( this.authenticated ) {
      try {
        gapi.auth.signOut();
      } catch ( e ) {
        console.warn('GoogleAPI::signOut()', 'failed', e);
        console.warn(e.stack);
      }

      this.authenticated = false;

      var ring = OSjs.Helpers.getServiceRing();
      if ( ring ) {
        ring.remove('Google API');
      }
    }
  };

  GoogleAPI.prototype.revoke = function(callback) {
    console.info('GoogleAPI::revoke()');

    if ( !this.accessToken ) {
      return callback(false);
    }

    var url = 'https://accounts.google.com/o/oauth2/revoke?token=' + this.accessToken;
    Utils.ajax({
      url: url,
      jsonp: true,
      onsuccess: function() {
        callback(true);
      },
      onerror: function() {
        callback(false);
      }
    });
  };

  GoogleAPI.prototype.authenticate = function(scope, callback) {
    console.info('GoogleAPI::authenticate()');

    callback = callback || function() {};

    var self = this;

    function getUserId(cb) {
      cb = cb || function() {};
      gapi.client.load('oauth2', 'v2', function() {
        gapi.client.oauth2.userinfo.get().execute(function(resp) {
          console.info('GoogleAPI::authenticate() => getUserId()', resp);
          cb(resp.id);
        });
      });
    }

    function login(immediate, cb) {
      console.info('GoogleAPI::authenticate() => login()', immediate);

      cb = cb || function() {};
      gapi.auth.authorize({
        client_id: self.clientId,
        scope: scope,
        user_id: self.userId,
        immediate: immediate
      }, cb);
    }

    function createRingNotification() {
      var ring = OSjs.Helpers.getServiceRing();
      if ( ring ) {
        ring.add('Google API', [{
          title: API._('GAPI_SIGN_OUT'),
          onClick: function() {
            self.signOut();
          }
        }, {
          title: API._('GAPI_REVOKE'),
          onClick: function() {
            self.revoke(function() {
              self.signOut();
            });
          }
        }]);
      }
    }

    var handleAuthResult = function(authResult) {
      console.info('GoogleAPI::authenticate() => handleAuthResult()', authResult);

      if ( authResult.error ) {
        if ( authResult.error_subtype === 'origin_mismatch' || authResult.error_subtype === 'access_denied' ) {
          var msg = API._('GAPI_AUTH_FAILURE_FMT', authResult.error, authResult.error_subtype);
          callback(msg);
          return;
        }
      }

      if ( authResult && !authResult.error ) {
        getUserId(function(id) {
          self.userId = id;

          if ( id ) {
            createRingNotification();
            self.authenticated = true;
            self.accessToken = authResult.access_token || null;
            callback(false, true);
          } else {
            callback(false, false);
          }
        });
      } else {
        login(false, handleAuthResult);
      }
    };

    login(true, handleAuthResult);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.GoogleAPI = OSjs.Helpers.GoogleAPI || {};

  OSjs.Helpers.GoogleAPI.getInstance = function() {
    return SingletonInstance;
  };

  OSjs.Helpers.GoogleAPI.createInstance = function(args, callback) {
    var load = args.load || [];
    var scope = args.scope || [];
    function _run() {
      SingletonInstance.load(load, scope, callback);
    }

    if ( SingletonInstance ) {
      return _run();
    }

    var clientId = null;
    var handler = API.getHandlerInstance();
    if ( handler ) {
      try {
        clientId = handler.getConfig('GoogleAPI').ClientId;
      } catch ( e ) {
        console.warn('getGoogleAPI()', e, e.stack);
      }
    }

    if ( !clientId ) {
      callback(API._('GAPI_DISABLED'));
      return;
    }

    SingletonInstance = new GoogleAPI(clientId);
    _run();
  };

})(OSjs.Utils, OSjs.API);
