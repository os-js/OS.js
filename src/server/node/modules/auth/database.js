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

const _bcrypt = require('bcrypt');
const _db = require('./../../lib/database.js');
const _logger = require('./../../lib/logger.js');

const manager = {

  add: function(db, user, callback) {
    const q = 'INSERT INTO `users` (`username`, `name`, `groups`, `password`) VALUES(?, ?, ?, ?);';
    const a = [user.username, user.name, JSON.stringify(user.groups), ''];
    return db.query(q, a);
  },

  remove: function(db, user, callback) {
    const q = 'DELETE FROM `users` WHERE `username` = ?;';
    const a = [user._username];
    return db.query(q, a);
  },

  edit: function(db, user, callback) {
    const q = 'UPDATE `users` SET `username` = ?, `name` = ?, `groups` = ? WHERE `username` = ?;';
    const a = [user.username, user.name, JSON.stringify(user.groups), user._username];
    return db.query(q, a);
  },

  passwd: function(db, user, callback) {
    return new Promise((resolve, reject) => {
      _bcrypt.genSalt(10, (err, salt) => {
        _bcrypt.hash(user.password, salt, (err, hash) => {
          const q = 'UPDATE `users` SET `password` = ? WHERE `username` = ?;';
          const a = [hash, user._username];

          db.query(q, a).then(resolve).catch(reject);
        });
      });
    });
  },

  list: function(db, user, callback) {
    const q = 'SELECT `id`, `username`, `name`, `groups` FROM `users`;';

    return new Promise((resolve, reject) => {
      db.queryAll(q, []).then((rows) => {
        resolve((rows || []).map((iter) => {
          try {
            iter.groups = JSON.parse(iter.groups) || [];
          } catch ( e ) {
            iter.groups = [];
          }
          return iter;
        }));
      }).catch(reject);
    });
  }
};

module.exports.login = function(http, data) {
  const q = 'SELECT `id`, `username`, `name`, `password` FROM `users` WHERE `username` = ? LIMIT 1;';
  const a = [data.username];

  return new Promise((resolve, reject) => {
    function _invalid() {
      reject('Invalid credentials');
    }

    function _auth(row) {
      const hash = row.password.replace(/^\$2y(.+)$/i, '\$2a$1');
      _bcrypt.compare(data.password, hash, (err, res) => {
        if ( err ) {
          reject(err);
        } else if ( res === true ) {
          resolve({
            id: parseInt(row.id, 10),
            username: row.username,
            name: row.name
          });
        } else {
          _invalid();
        }
      });
    }

    _db.instance('authstorage').then((db) => {
      db.query(q, a).then((row) => {
        if ( row ) {
          _auth(row);
        } else {
          _invalid();
        }
      }).catch(reject);
    });
  });
};

module.exports.logout = function(http) {
  return new Promise((resolve) => {
    resolve(true);
  });
};

module.exports.initSession = function(http) {
  return new Promise((resolve) => {
    resolve(true);
  });
};

module.exports.checkPermission = function(http, type, options) {
  return new Promise((resolve) => {
    resolve(true);
  });
};

module.exports.checkSession = function(http) {
  return new Promise((resolve, reject) => {
    if ( http.session.get('username') ) {
      resolve();
    } else {
      reject('You have no OS.js Session, please log in!');
    }
  });
};

module.exports.getGroups = function(http, username) {
  return new Promise((resolve, reject) => {
    function done(row) {
      row = row || {};
      let json = [];
      try {
        json = JSON.parse(row.groups);
      } catch (e) {}
      resolve(json);
    }

    _db.instance('authstorage').then((db) => {
      db.query('SELECT `groups` FROM `users` WHERE `username` = ? LIMIT 1;', [username])
        .then(done).catch(reject);
    }).catch(reject);
  });
};

module.exports.getBlacklist = function(http, username) {
  return new Promise((resolve) => {
    resolve([]);
  });
};

module.exports.setBlacklist = function(http, username, list) {
  return new Promise((resolve) => {
    resolve(true);
  });
};

module.exports.manage = function(http, command, args) {
  return new Promise((resolve, reject) => {
    if ( manager[command] ) {
      _db.instance('authstorage').then((db) => {
        manager[command](db, args)
          .then(resolve)
          .catch(reject);
      }).catch(reject);
    } else {
      reject('Not available');
    }
  });
};

module.exports.register = function(config) {
  const type = config.driver;
  const settings = config[type];

  const str = type === 'sqlite' ? require('path').basename(settings.database) : settings.user + '@' + settings.host + ':/' + settings.database;
  _logger.lognt('INFO', 'Module:', _logger.colored('Authenticator', 'bold'), 'using', _logger.colored(type, 'green'), '->', _logger.colored(str, 'green'));

  return _db.instance('authstorage', type, settings);
};

module.exports.destroy = function() {
  return _db.destroy('authstorage');
};

