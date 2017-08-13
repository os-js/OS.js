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
const PackageManager = require('./../packagemanager.js');
const Modules = require('./../modules.js');
const Settings = require('./../settings.js');
const User = require('./../user.js');

module.exports = function(app, wrapper) {
  const authenticator = () => Modules.getAuthenticator();
  const storage = () => Modules.getStorage();

  /*
   * Login attempts
   */
  wrapper.post('/API/login', (http) => {

    const errored = (error) => http.response.json({error});

    authenticator().login(http.data)
      .then((userData) => {
        const user = User.createFromObject(userData);

        authenticator().getBlacklist(user).then((blacklist) => {
          return storage().getSettings(user).then((settings) => {
            http.session.set('uid', user.id);
            http.session.set('username', user.username);
            http.setActiveUser(http.request, true);

            return http.request.session.save(() => {
              http.response.json({result: {
                userData: user.toJson(),
                userSettings: settings,
                blacklistedPackages: blacklist
              }});
            });
          }).catch(errored);
        }).catch(errored);
      }).catch(errored);
  });

  /*
   * Logout attempts
   */
  wrapper.post('/API/logout', (http) => {
    authenticator().logout()
      .then((result) => {
        http.setActiveUser(http.request, false);
        http.request.session.destroy(() => {
          http.response.json({result});
        });
        /*
        http.session.set('uid', null);
        http.session.set('username', null);
        return http.request.session.save(() => {
          http.response.json({result});
        });
        */
      })
      .catch((error) => http.response.json({error}));
  });

  /*
   * Package operations
   */
  wrapper.post('/API/packages', (http) => {
    const command = http.data.command;
    const args = http.data.args || {};

    authenticator().checkPermission(http, 'packages').then((user) => {
      if ( PackageManager[command] ) {
        PackageManager[command](user, args)
          .then((result) => http.response.json({result}))
          .catch((error) => http.response.json({error}));
      } else {
        http.response.json({error: 'No such command'});
      }
    }).catch((error) => http.response.status(403).json({error}));
  });

  /*
   * Application operations
   */
  wrapper.post('/API/application', (http) => {
    const apath = http.data.path || null;
    const ameth = http.data.method || null;
    const aargs = http.data.args || {};

    authenticator().checkPermission(http, 'application').then((user) => {
      let module;
      try {
        module = require(Modules.getPackageEntry(apath));
      } catch ( e ) {
        console.warn(e);
      }

      if ( module ) {
        if ( typeof module.api[ameth] === 'function' ) {
          module.api[ameth](Settings.option(), http, aargs, user).then((result) => {
            return http.response.json({result});
          }).catch((error) => {
            return http.response.json({error});
          });
        } else {
          http.response.json({error: 'No such API method: ' + ameth});
        }
      } else {
        http.response.json({error: 'Failed to load Application API for: ' + apath});
      }
    }).catch((error) => http.response.status(403).json({error}));
  });

  /*
   * Settings operations
   */
  wrapper.post('/API/settings', (http) => {
    const settings = http.data.settings;
    authenticator().checkSession(http).then((user) => {
      storage().setSettings(user, settings)
        .then((result) => http.response.json({result}))
        .catch((error) => http.response.json({error}));
    }).catch((error) => http.response.status(403).json({error}));
  });

  /*
   * Users operations
   */
  wrapper.post('/API/users', (http) => {
    const command = http.data.command;
    const args = http.data.user || {};

    authenticator().checkPermission(http, 'users').then((user) => {
      authenticator().manage(command, args)
        .then((result) => http.response.json({result}))
        .catch((error) => http.response.json({error}));
    }).catch((error) => http.response.status(403).json({error}));
  });

};
