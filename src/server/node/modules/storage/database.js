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

const _db = require('./../../lib/database.js');
const _logger = require('./../../lib/logger.js');

module.exports.setSettings = function(http, username, settings) {
  return new Promise((resolve, reject) => {
    function done() {
      resolve(true);
    }

    _db.instance('authstorage').then((db) => {
      db.query('UPDATE `users` SET `settings` = ? WHERE `username` = ?;', [JSON.stringify(settings), username])
        .then(done).catch(reject);
    }).catch(reject);
  });
};

module.exports.getSettings = function(http, username) {
  return new Promise((resolve, reject) => {
    function done(row) {
      row = row || {};
      let json = {};
      try {
        json = JSON.parse(row.settings);
      } catch (e) {}
      resolve(json);
    }

    _db.instance('authstorage').then((db) => {
      db.query('SELECT `settings` FROM `users` WHERE `username` = ? LIMIT 1;', [username])
        .then(done).catch(reject);
    }).catch(reject);
  });
};

module.exports.register = function(config) {
  const type = config.driver;
  const settings = config[type];

  const str = type === 'sqlite' ? require('path').basename(settings.database) : settings.user + '@' + settings.host + ':/' + settings.database;
  _logger.lognt('INFO', 'Module:', _logger.colored('Storage', 'bold'), 'using', _logger.colored(type, 'green'), '->', _logger.colored(str, 'green'));

  return _db.instance('authstorage', type, settings);
};

module.exports.destroy = function() {
  return _db.destroy('authstorage');
};
