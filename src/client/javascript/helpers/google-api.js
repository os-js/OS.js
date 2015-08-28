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

(function(Utils, API) {
  'use strict';

  var OSjs = window.OSjs = window.OSjs || {};
  var gapi = window.gapi = window.gapi || {};

  OSjs.Helpers = OSjs.Helpers || {};

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var SingletonInstance = null;

  /**
   * The GoogleAPI wrapper class
   *
   * This is a private class and can only be aquired through
   * OSjs.Helpers.GoogleAPI.createInsatance()
   *
   * Generally you want to create an instance of this helper
   * and when successfully created use `window.gapi`.
   *
   * @link  https://developers.google.com/api-client-library/javascript/start/start-js
   * @link  https://developers.google.com/api-client-library/javascript/
   * @link  https://console.developers.google.com/project
   *
   * @see OSjs.Helpers.GoogleAPI.createInsatance()
   * @api OSjs.Helpers.GoogleAPI.GoogleAPI
   *
   * @private
   * @class
   */
  function GoogleAPI(clientId) {
    this.clientId       = clientId;
    this.accessToken    = null;
    this.userId         = null;
    this.preloaded      = false;
    this.authenticated  = false;
    this.loaded         = [];
    this.preloads       = [
      {
        type: 'javascript',
        src: 'https://apis.google.com/js/api.js'
      }
    ];
  }

  /**
   * Destroy the class
   */
  GoogleAPI.prototype.destroy = function() {
  };

  /**
   * Initializes (preloads) the API
   */
  GoogleAPI.prototype.init = function(callback) {
    var self = this;

    callback = callback || function() {};
    if ( this.preloaded ) {
      callback(false, true);
    } else {
      Utils.preload(this.preloads, function(total, errors) {
        if ( !errors ) {
          self.preloaded = true;
        }
        callback(errors);
      });
    }
  };

  /**
   * Loads the API
   */
  GoogleAPI.prototype.load = function(load, scope, client, callback) {
    var self = this;

    function auth(cb) {
      self.authenticate(scope, function(error, result) {
        if ( error ) {
          return cb(error);
        }
        if ( !self.authenticated ) {
          return cb(API._('GAPI_AUTH_FAILURE'));
        }

        cb(false, result);
      });
    }

    function loadAll(finished) {
      var lload   = [];
      load.forEach(function(i) {
        if ( self.loaded.indexOf(i) === -1 ) {
          lload.push(i);
        }
      });

      var current = 0;
      var total   = lload.length;

      console.debug('GoogleAPI::load()', load, '=>', lload, scope);

      function _load(iter, cb) {
        var args = [];
        var name = null;

        if ( iter instanceof Array ) {
          if ( iter.length > 0 && iter.length < 3 ) {
            args = args.concat(iter);
            name = iter[0];
          }
        } else {
          args.push(iter);
          name = iter;
        }

        args.push(function() {
          self.loaded.push(name);

          cb.apply(this, arguments);
        });

        if ( client ) {
          gapi.client.load.apply(gapi, args);
        } else {
          gapi.load.apply(gapi, args);
        }
      }

      function _next() {
        if ( current >= total ) {
          finished();
        } else {
          _load(lload[current], function() {
            _next();
          });

          current++;
        }
      }

      _next();
    }

    this.init(function(error) {
      if ( error ) {
        callback(error);
        return;
      }

      if ( !window.gapi || !gapi.load ) {
        callback(API._('GAPI_LOAD_FAILURE'));
        return;
      }

      auth(function(error) {
        if ( error ) {
          callback(error);
          return;
        }

        loadAll(function(error, result) {
          callback(error, result, SingletonInstance);
        });
      });

    });
  };

  /**
   * Sign out of GoogleAPI
   *
   * @param   Function    cb      Callback => fn(error, result)
   *
   * @return  void
   *
   * @method  GoogleAPI::signOut()
   */
  GoogleAPI.prototype.signOut = function(cb) {
    cb = cb || function() {};

    console.info('GoogleAPI::signOut()');
    if ( this.authenticated ) {
      try {
        gapi.auth.signOut();
      } catch ( e ) {
        console.warn('GoogleAPI::signOut()', 'failed', e);
        console.warn(e.stack);
      }

      this.authenticated = false;

      var ring = API.getServiceNotificationIcon();
      if ( ring ) {
        ring.remove('Google API');
      }
    }

    if ( OSjs.VFS.Modules.GoogleDrive ) {
      OSjs.VFS.Modules.GoogleDrive.unmount();
    }

    cb(false, true);
  };

  /**
   * Revoke Google permissions for this app
   *
   * @param   Function    cb      Callback => fn(error, result)
   *
   * @return  void
   *
   * @method  GoogleAPI::revoke()
   */
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

  /**
   * Authenticates the user
   */
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
      var ring = API.getServiceNotificationIcon();
      if ( ring ) {
        ring.remove('Google API');

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

    var handleAuthResult = function(authResult, immediate) {
      console.info('GoogleAPI::authenticate() => handleAuthResult()', authResult);

      if ( authResult.error ) {
        if ( authResult.error_subtype === 'origin_mismatch' || (authResult.error_subtype === 'access_denied' && !immediate) ) {
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
        login(false, function(res) {
          handleAuthResult(res, false);
        });
      }
    };

    gapi.load('auth:client', function(result) {
      if ( result && result.error ) {
        var msg = API._('GAPI_AUTH_FAILURE_FMT', result.error, result.error_subtype);
        callback(msg);
        return;
      }

      login(true, function(res) {
        handleAuthResult(res, true);
      });
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.GoogleAPI = OSjs.Helpers.GoogleAPI || {};

  /**
   * Gets the currently running instance
   *
   * @api OSjs.Helpers.GoogleAPI.getInstance()
   *
   * @return  GoogleAPI       Can also be null
   */
  OSjs.Helpers.GoogleAPI.getInstance = function() {
    return SingletonInstance;
  };

  /**
   * Create an instance of GoogleAPI
   *
   * @param   Object    args      Arguments
   * @param   Function  callback  Callback function => fn(error, instance)
   *
   * @option  args    Array     load      What functions/apis to load
   * @option  args    Array     scope     What scopes to load
   * @option  args    boolean   client    Load using gapi.client (default=false) WILL BE REPLACED!
   *
   * The 'load' Array can be filled with either strings, or arrays. ex:
   * - ['drive-realtime', 'drive-share']
   * - [['calendar', 'v1'], 'drive-share']
   *
   * @api OSjs.Helpers.GoogleAPI.createInstance()
   *
   * @return  void
   */
  OSjs.Helpers.GoogleAPI.createInstance = function(args, callback) {
    var load = args.load || [];
    var scope = args.scope || [];
    var client = args.client === true;

    function _run() {
      SingletonInstance.load(load, scope, client, callback);
    }

    if ( SingletonInstance ) {
      return _run();
    }

    var clientId = null;
    var config = OSjs.Core.getConfig();
    try {
      clientId = config.GoogleAPI.ClientId;
    } catch ( e ) {
      console.warn('getGoogleAPI()', e, e.stack);
    }

    if ( !clientId ) {
      callback(API._('GAPI_DISABLED'));
      return;
    }

    SingletonInstance = new GoogleAPI(clientId);
    _run();
  };

})(OSjs.Utils, OSjs.API);
