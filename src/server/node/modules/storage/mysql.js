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

const _mysql = require('mysql');
const _utils = require('./../../core/utils.js');

var pool;

module.exports.setSettings = function(http, username, settings) {
  return new Promise(function(resolve, reject) {
    _utils.mysqlQuery(pool, 'UPDATE `users` SET `settings` = ? WHERE `username` = ? LIMIT 1;', [JSON.stringify(settings), username], function(err, row) {
      if ( err ) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

module.exports.getSettings = function(http, username) {
  return new Promise(function(resolve, reject) {
    _utils.mysqlQuery(pool, 'SELECT `settings` FROM `users` WHERE `username` = ? LIMIT 1;', [username], function(err, row) {
      row = row || {};
      if ( err ) {
        reject(err);
      } else {
        var json = {};
        try {
          json = JSON.parse(row.settings);
        } catch (e) {}
        resolve(json);
      }
    }, true);
  });
};

module.exports.getGroups = function(http, username) {
  return new Promise(function(resolve, reject) {
    _utils.mysqlQuery(pool, 'SELECT `groups` FROM `users` WHERE `username` = ? LIMIT 1;', [username], function(err, row) {
      row = row || {};
      if ( err ) {
        reject(err);
      } else {
        var json = {};
        try {
          json = JSON.parse(row.groups);
        } catch (e) {}
        resolve(json);
      }
    }, true);
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
  var ccfg = _utils.mysqlConfiguration(config);
  pool = _mysql.createPool(ccfg);
};

module.exports.destroy = function() {
};
