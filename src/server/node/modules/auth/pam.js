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
const fs = require('fs-extra');

const PAM = require('authenticate-pam');
const UserID = require('userid');
const Settings = require('./../../settings.js');
const Authenticator = require('./../authenticator.js');

class PAMAuthenticator extends Authenticator {
  login(data) {
    return new Promise((resolve, reject) => {
      PAM.authenticate(data.username, data.password, (err) => {
        if ( err ) {
          reject(err);
        } else {
          this.getGroups({username: data.username}).then((groups) => {
            resolve({
              id: UserID.uid(data.username),
              username: data.username,
              name: data.username,
              groups: groups
            });
          }).catch(reject);
        }
      });
    });
  }

  getGroups(user) {
    const filename = Settings.get('modules.auth.pam.groups');
    return new Promise((resolve, reject) => {
      fs.readJson(filename).then((map) => {
        return resolve(map[user.username] || []);
      }).catch((err) => {
        console.warn(err);
        return resolve([]);
      });
    });
  }

  getBlacklist(user) {
    const filename = Settings.get('modules.auth.pam.blacklist');
    return new Promise((resolve, reject) => {
      fs.readJson(filename).then((map) => {
        return resolve(map[user.username] || []);
      }).catch((err) => {
        console.warn(err);
        return resolve([]);
      });
    });
  }
}

module.exports = new PAMAuthenticator();
