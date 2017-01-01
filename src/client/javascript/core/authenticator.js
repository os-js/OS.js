/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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

  var _authInstance;

  /**
   * Authenticator Base Class
   *
   * @abstract
   * @constructor Authenticator
   * @memberof OSjs.Core
   */
  function Authenticator() {

    /**
     * User data
     * @name userData
     * @memberof OSjs.Core.Authenticator#
     * @type {Object}
     * @example
     * {
     *  id: -1,
     *  username: 'foo',
     *  groups: []
     * }
     */
    this.userData = {
      id      : 0,
      username: 'root',
      name    : 'root user',
      groups  : ['admin']
    };

    /**
     * If user is logged in
     * @name loggedIn
     * @memberof OSjs.Core.Authenticator#
     * @type {Boolean}
     */
    this.loggedIn = false;

    /*eslint consistent-this: "off"*/
    _authInstance = this;
  }

  /**
   * Initializes the Authenticator
   *
   * @function init
   * @memberof OSjs.Core.Authenticator#
   *
   * @param   {CallbackHandler}      callback        Callback function
   */
  Authenticator.prototype.init = function(callback) {
    this.onCreateUI(callback);
  };

  /**
   * Destroys the Authenticator
   *
   * @function destroy
   * @memberof OSjs.Core.Authenticator#
   */
  Authenticator.prototype.destroy = function() {
  };

  /**
   * Get data for logged in user
   *
   * @function getUser
   * @memberof OSjs.Core.Authenticator#
   *
   * @return  {Object}      JSON With user data
   */
  Authenticator.prototype.getUser = function() {
    return Utils.cloneObject(this.userData || {}, true);
  };

  /**
   * Gets if there is a user logged in
   *
   * @function isLoggedIn
   * @memberof OSjs.Core.Authenticator#
   *
   * @return {Boolean}
   */
  Authenticator.prototype.isLoggedIn = function() {
    return this.isLoggedIn;
  };

  /**
   * Log in user
   *
   * @function login
   * @memberof OSjs.Core.Authenticator#
   *
   * @param   {Object}               data            Login form data
   * @param   {CallbackHandler}      callback        Callback function
   */
  Authenticator.prototype.login = function(data, callback) {
    API.call('login', data, function onLoginResponse(error, result) {
      if ( result ) {
        callback(false, result);
      } else {
        var error = error || API._('ERR_LOGIN_INVALID');
        callback(API._('ERR_LOGIN_FMT', error), false);
      }
    });
  };

  /**
   * Log out user
   *
   * @function logout
   * @memberof OSjs.Core.Authenticator#
   *
   * @param   {CallbackHandler}      callback        Callback function
   */
  Authenticator.prototype.logout = function(callback) {
    var opts = {};

    API.call('logout', opts, function onLogoutResponse(error, result) {
      if ( result ) {
        callback(false, true);
      } else {
        callback('An error occured: ' + (error || 'Unknown error'));
      }
    });
  };

  /**
   * When login is requested
   *
   * @function onLoginRequest
   * @memberof OSjs.Core.Authenticator#
   *
   * @param   {Object}               data            Login data
   * @param   {CallbackHandler}      callback        Callback function
   */
  Authenticator.prototype.onLoginRequest = function(data, callback) {
    var self = this;

    this.login(data, function onLoginRequest(err, result) {
      if ( err ) {
        callback(err);
      } else {
        self.onLogin(result, callback);
      }
    });
  };

  /**
   * When login has occured
   *
   * @function onLogin
   * @memberof OSjs.Core.Authenticator#
   *
   * @param   {Object}               data            User data
   * @param   {CallbackHandler}      callback        Callback function
   */
  Authenticator.prototype.onLogin = function(data, callback) {
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

    callback(null, true);
  };

  /**
   * When login UI is requested
   *
   * @function onCreateUI
   * @memberof OSjs.Core.Authenticator#
   *
   * @param   {CallbackHandler}      callback        Callback function
   */
  Authenticator.prototype.onCreateUI = function(callback) {
    var self = this;
    var container = document.getElementById('Login');
    var login = document.getElementById('LoginForm');
    var u = document.getElementById('LoginUsername');
    var p = document.getElementById('LoginPassword');
    var s = document.getElementById('LoginSubmit');

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

    login.onsubmit = function(ev) {
      _lock();
      if ( ev ) {
        ev.preventDefault();
      }

      self.onLoginRequest({
        username: u.value,
        password: p.value
      }, function(err) {
        if ( err ) {
          alert(err);
          _restore();
        } else {
          container.parentNode.removeChild(container);
          callback();
        }
      });
    };

    container.style.display = 'block';

    _restore();
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Authenticator = Authenticator;

  /**
   * Get running 'Authenticator' instance
   *
   * @function getAuthenticator
   * @memberof OSjs.Core
   *
   * @return {OSjs.Core.Authenticator}
   */
  OSjs.Core.getAuthenticator = function Core_getAuthenticator() {
    return _authInstance;
  };

})(OSjs.API, OSjs.Utils);

