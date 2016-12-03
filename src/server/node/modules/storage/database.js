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

const _db = require('./../../core/database.js');
const _instance = require('./../../core/instance.js');

module.exports.setSettings = function(http, username, settings) {
  return new Promise(function(resolve, reject) {
    function done() {
      resolve(true);
    }

    _db.instance('authstorage').then(function(db) {
      db.query('UPDATE `users` SET `settings` = ? WHERE `username` = ?;', [JSON.stringify(settings), username])
        .then(done).catch(reject);
    }).catch(reject);
  });
};

module.exports.getSettings = function(http, username) {
  return new Promise(function(resolve, reject) {
    function done(row) {
      row = row || {};
      var json = {};
      try {
        json = JSON.parse(row.settings);
      } catch (e) {}
      resolve(json);
    }

    _db.instance('authstorage').then(function(db) {
      db.query('SELECT `settings` FROM `users` WHERE `username` = ? LIMIT 1;', [username])
        .then(done).catch(reject);
    }).catch(reject);
  });
};

module.exports.getGroups = function(http, username) {
  return new Promise(function(resolve, reject) {
    function done(row) {
      row = row || {};
      var json = [];
      try {
        json = JSON.parse(row.groups);
      } catch (e) {}
      resolve(json);
    }

    _db.instance('authstorage').then(function(db) {
      db.query('SELECT `groups` FROM `users` WHERE `username` = ? LIMIT 1;', [username])
        .then(done).catch(reject);
    }).catch(reject);
  });
};

module.exports.getBlacklist = function(http, username) {
  return new Promise(function(resolve) {
    resolve([]);
  });
};

module.exports.setBlacklist = function(http, username, list) {
  return new Promise(function(resolve) {
    resolve(true);
  });
};

module.exports.register = function(config) {
  const type = config.driver;
  const settings = config[type];
  const logger = _instance.getLogger();

  const str = type === 'sqlite' ? require('path').basename(settings.database) : settings.user + '@' + settings.host + ':/' + settings.database;
  logger.lognt('INFO', 'Module:', logger.colored('Storage', 'bold'), 'using', logger.colored(type, 'green'), '->', logger.colored(str, 'green'));

  return _db.instance('authstorage', type, settings);
};

module.exports.destroy = function() {
  return _db.destroy('authstorage');
};
