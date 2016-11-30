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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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
/*eslint strict:["error", "global"]*/
'use strict';

/**
 * @namespace modules.api
 */

const _instance = require('./../../core/instance.js');

/**
 * Send a login attempt
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Object}           data          Request data
 *
 * @function login
 * @memberof modules.api
 */
module.exports.login = function(http, data) {
  function _login(resolve, reject) {
    function _fail(e) {
      http.session.set('username', '');
      reject(e);
    }

    function _proceed(userData) {
      http.session.set('username', userData.username);

      _instance.getStorage().getSettings(http, userData.username).then(function(userSettings) {
        _instance.getStorage().getBlacklist(http, userData.username).then(function(blacklist) {
          http.session.set('username', userData.username);

          resolve({
            userData: userData,
            userSettings: userSettings,
            blacklistedPackages: blacklist
          });

        }).catch(_fail);
      }).catch(_fail);
    }

    _instance.getAuth().login(http, data).then(function(userData) {
      if ( typeof userData.groups === 'undefined' ) {
        _instance.getStorage().getGroups(http, userData.username).then(function(groups) {
          userData.groups = groups;
          _proceed(userData);
        }).catch(_fail);
      } else {
        _proceed(userData);
      }
    }).catch(_fail);
  }

  return new Promise(_login);
};

/**
 * Send a logout attempt
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Function}         resolve       Resolves the Promise
 * @param   {Function}         reject        Rejects the Promise
 *
 * @function logout
 * @memberof modules.api
 */
module.exports.logout = function(http, resolve, reject) {
  return new Promise(function(resolve, reject) {
    _instance.getAuth().logout(http).then(function(arg) {
      http.session.set('username', null);

      resolve(arg);
    }).catch(reject);
  });
};

