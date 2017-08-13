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

const path = require('path');
const Database = require('./../database.js');
const Storage = require('./../storage.js');

class DatabaseStorage extends Storage {

  setSettings(user, settings) {
    return new Promise((resolve, reject) => {
      Database.instance('authstorage').then((db) => {
        return db.query('SELECT `settings` FROM `settings` WHERE user_id = ?', [user.id]).then((row) => {
          let promise;
          const json = JSON.stringify(settings);
          if ( typeof row === 'undefined' ) {
            promise = db.query('INSERT INTO `settings` (user_id, settings) VALUES(?, ?)', [user.id, json]);
          } else {
            promise = db.query('UPDATE `settings` SET `settings` = ? WHERE `user_id` = ?;', [json, user.id]);
          }

          return promise.then(() => resolve(true)).catch((err) => {
            console.warn(err);
            resolve(false);
          });
        }).catch(reject);
      }).catch(reject);
    });
  }

  getSettings(user) {
    return new Promise((resolve, reject) => {
      function done(row) {
        row = row || {};
        let json = {};
        try {
          json = JSON.parse(row.settings);
        } catch (e) {}
        resolve(json);
      }

      Database.instance('authstorage').then((db) => {
        return db.query('SELECT `settings` FROM `settings` WHERE user_id = ?', [user.id]).then(done).catch(reject);
      }).catch(reject);
    });
  }

  register(config) {
    const type = config.driver;
    const settings = config[type];

    const str = type === 'sqlite' ? path.basename(settings.database) : settings.user + '@' + settings.host + ':/' + settings.database;
    console.log('>', type, str);

    return Database.instance('authstorage', type, settings);
  }

  destroy() {
    return Database.destroy('authstorage');
  }

}

module.exports = new DatabaseStorage();
