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
(function(API, Utils, Authenticator) {
  'use strict';

  function DemoAuthenticator() {
    Authenticator.apply(this, arguments);
  }

  DemoAuthenticator.prototype = Object.create(Authenticator.prototype);
  DemoAuthenticator.constructor = Authenticator;

  DemoAuthenticator.prototype.login = function(login, callback) {
    var settings = {};
    var key;

    for ( var i = 0; i < localStorage.length; i++ ) {
      key = localStorage.key(i);
      if ( key.match(/^OSjs\//) ) {
        try {
          settings[key.replace(/^OSjs\//, '')] = JSON.parse(localStorage.getItem(key));
        } catch ( e ) {
          console.warn('DemoAuthenticator::login()', e, e.stack);
        }
      }
    }

    if ( API.isStandalone() ) {
      return callback(false, {
        userData: {
          id: 0,
          username: 'demo',
          name: 'Demo User',
          groups: ['admin']
        },
        userSettings: settings,
        blacklistedPackages: []
      });
    }

    return Authenticator.prototype.login.call(this, login, function(error, result) {
      if ( error ) {
        callback(error);
      } else {
        result.userSettings = settings;
        callback(null, result);
      }
    });
  };

  DemoAuthenticator.prototype.onCreateUI = function(callback) {
    this.onLoginRequest({
      username: 'demo',
      password: 'demo'
    }, callback);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Auth = OSjs.Auth || {};
  OSjs.Auth.demo = DemoAuthenticator;

})(OSjs.API, OSjs.Utils, OSjs.Core.Authenticator);
