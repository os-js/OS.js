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

const _storage = require('./../../core/storage.js');
const _auth = require('./../../core/auth.js');

/**
 * Send a login attempt
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Object}           data          Request data
 *
 * @function login
 * @memberof modules.api
 * @return {Promise}
 */
module.exports.login = function(http, data) {
  function _login(resolve, reject) {
    function _fail(e) {
      http.session.set('username', '', () => {
        reject(e);
      });
    }

    function _proceed(userData) {
      http.session.set('username', userData.username, () => {
        _storage.get().getSettings(http, userData.username).then((userSettings) => {
          _auth.get().getBlacklist(http, userData.username).then((blacklist) => {
            resolve({
              userData: userData,
              userSettings: userSettings,
              blacklistedPackages: blacklist
            });
          }).catch(_fail);
        }).catch(_fail);
      });
    }

    _auth.get().login(http, data).then((userData) => {
      if ( typeof userData.groups === 'undefined' ) {
        _auth.get().getGroups(http, userData.username).then((groups) => {
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
 * @param   {Object}           data          Request data
 *
 * @function logout
 * @memberof modules.api
 * @return {Promise}
 */
module.exports.logout = function(http, data) {
  return new Promise((resolve, reject) => {
    _auth.get().logout(http, data).then((arg) => {
      http.session.destroy(() => {
        resolve(arg);
      });
    }).catch(reject);
  });
};

