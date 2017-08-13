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

const Promise = require('bluebird');
const Bcrypt = require('bcrypt');
const Database = require('./../database.js');
const Authenticator = require('./../authenticator.js');
const User = require('./../../user.js');

const getUserFrom = (db, key, value) => new Promise((resolve, reject) => {
  db.query('SELECT * FROM users WHERE ' + key + ' = ?', [value]).then((row) => {
    if ( row ) {
      row.groups = [];

      return db.queryAll('SELECT group_name FROM groups WHERE user_id = ?', [row.id]).then((rows) => {
        row.groups = (rows || []).map((r) => r.group_name);
        resolve(row);
      }).catch((err) => {
        console.warn(err);
        resolve(row);
      });
    }
    return resolve(null);
  }).catch(reject);
});

class Manager {

  constructor(db) {
    this.db = db;
  }

  _deleteSettings(userId) {
    return this.db.query('DELETE FROM `settings` WHERE user_id = ?', [userId]);
  }

  _deleteGroups(userId) {
    return this.db.query('DELETE FROM `groups` WHERE user_id = ?', [userId]);
  }

  _deleteUser(userId) {
    return this.db.query('DELETE FROM `users` WHERE id = ?', [userId]);
  }

  _addGroups(userId, groups) {
    return Promise.all(groups.map((g) => {
      return this.db.query('INSERT INTO `groups` (user_id, group_name) VALUES(?, ?)', [userId, g]);
    }));
  }

  add(user) {
    return new Promise((resolve, reject) => {
      const groups = user.groups || [];
      this.db.query(
        'INSERT INTO `users` (id, username, name, password) VALUES(NULL, ?, ?, ?);',
        [user.username, user.name, '']
      ).then(() => {
        return this.getUserFromUsername(user.username).then((user) => {
          if ( !groups.length ) {
            return Promise.resolve(true);
          }
          return this.setGroups(user.id, groups).then(resolve).catch(reject);
        }).catch(reject);
      }).catch(reject);
    });
  }

  passwd(user) {
    return new Promise((resolve, reject) => {
      Bcrypt.genSalt(10, (err, salt) => {
        Bcrypt.hash(user.password, salt, (err, hash) => {
          const q = 'UPDATE `users` SET `password` = ? WHERE `id` = ?;';
          const a = [hash, user.id];

          this.db.query(q, a).then(resolve).catch(reject);
        });
      });
    });
  }

  edit(user) {
    return new Promise((resolve, reject) => {
      const q = 'UPDATE `users` SET `username` = ?, `name` = ? WHERE `id` = ?;';
      const a = [user.username, user.name, user.id];
      this.db.query(q, a).then(() => {
        if ( typeof user.groups !== 'undefined' ) {
          return this.setGroups(user.id, user.groups).then(resolve).catch(reject);
        }
        return resolve(true);
      }).catch(reject);
    });
  }

  remove(user) {
    return Promise.all([
      this._deleteSettings(user.id),
      this._deleteGroups(user.id),
      this._deleteUser(user.id)
    ]);
  }

  list() {
    const q = 'SELECT users.*, groups.group_name FROM `users` LEFT JOIN `groups` ON (groups.user_id = users.id);';

    return new Promise((resolve, reject) => {
      this.db.queryAll(q, []).then((rows) => {
        const result = {};
        rows.forEach((row) => {
          if ( typeof result[row.username] === 'undefined' ) {
            result[row.username] = {
              id: row.id,
              name: row.name,
              username: row.username,
              groups: row.group_name ? [row.group_name] : []
            };
          } else {
            result[row.username].groups.push(row.group_name);
          }

        });

        return resolve(Object.values(result));
      }).catch(reject);
    });
  }

  // Private

  setGroups(uid, groups) {
    return new Promise((resolve, reject) => {
      return this._deleteGroups(uid).then(() => {
        return this._addGroups(uid, groups).then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  getUserFromUsername(username) {
    return getUserFrom(this.db, 'username', username);
  }
}

class DatabaseAuthenticator extends Authenticator {

  login(data) {
    return new Promise((resolve, reject) => {
      Database.instance('authstorage').then((db) => {
        (new Manager(db)).getUserFromUsername(data.username).then((row) => {
          if ( !row ) {
            return reject('Invalid credentials');
          }

          const hash = row.password.replace(/^\$2y(.+)$/i, '\$2a$1');
          return Bcrypt.compare(data.password, hash).then((res) => {
            if ( res ) {
              return resolve({
                id: parseInt(row.id, 10),
                username: row.username,
                name: row.name,
                groups: row.groups
              });
            }

            return reject('Invalid credentials');
          }).catch((err) => {
            console.warn(err);
            reject('Invalid credentials');
          });
        }).catch(reject);
      });
    });
  }

  manage(command, args) {
    return new Promise((resolve, reject) => {
      this.manager().then((manager) => {
        if ( ['add', 'passwd', 'edit', 'remove', 'list'].indexOf(command) === -1 ) {
          return reject('Not allowed: ' + command);
        }

        return manager[command](args)
          .then(resolve)
          .catch(reject);
      }).catch(reject);
    });
  }

  manager() {
    return new Promise((resolve, reject) => {
      return Database.instance('authstorage').then((db) => {
        return resolve(new Manager(db));
      }).catch(reject);
    });
  }

  getUserFromRequest(http) {
    return new Promise((resolve, reject) => {
      const uid = http.session.get('uid');
      return Database.instance('authstorage').then((db) => {
        return getUserFrom(db, 'id', uid).then((r) => resolve(User.createFromObject(r))).catch(reject);
      }).catch(reject);
    });
  }

  register(config) {
    const type = config.driver;
    const settings = config[type];

    const str = type === 'sqlite' ? require('path').basename(settings.database) : settings.user + '@' + settings.host + ':/' + settings.database;
    console.log('>', type, str);

    return Database.instance('authstorage', type, settings);
  }

  destroy() {
    return Database.destroy('authstorage');
  }

}

module.exports = new DatabaseAuthenticator();
