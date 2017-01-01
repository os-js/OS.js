#!/usr/bin/env node
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
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

const _bcrypt = require('bcryptjs');
const _path = require('path');
const _fs = require('fs');

const ROOT = _path.join(__dirname, '/../');
const ARGS = process.argv;

const _db = require(_path.join(ROOT, 'src/server/node/core/database.js'));

const config = JSON.parse(_fs.readFileSync(_path.join(ROOT, 'src', 'server', 'settings.json')));

const username = ARGS[3];
const name = ARGS[3];
const groups = String(ARGS[4] || 'admin').replace(/\s/g, '').split(',');

const auther = config.http.authenticator;
const cfg = config.modules.auth[auther];

function createPassword() {
  return new Promise(function(resolve, reject) {
    var password = '';

    process.stdout.write('New Password: ');
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    process.stdin.on('data', function(ch) {
       ch = String(ch);

       switch (ch) {
         case '\n':
         case '\r':
         case '\u0004':
           process.stdout.write('\n');
           stdin.setRawMode(false);
           stdin.pause();

           const salt = _bcrypt.genSaltSync(10);
           const hash = _bcrypt.hashSync(password, salt);
           if ( hash ) {
             resolve(hash);
           } else {
             reject('Empty password');
           }
           break;

         case '\u0003':
           reject('Aborted...');
           break;

         default:
           process.stdout.write('*');
           password += ch;
           break;
      }
    });
  });
}

if ( auther !== 'database' ) {
  return Promise.reject('You have to add users via your system for this authenticator.');
}

if ( ARGS.length < 4 ) {
  console.log('Available commands:');
  console.log('  add <username> <groups> - Add a user (ex: anders api,fs,curl)');
  console.log('  pwd <username>          - Change a user password');
  console.log('  grp <username> <groups> - Change a users group(s)');
  return;
}

console.log('Using authenticator', auther);

(new Promise(function(resolve, reject) {
  _db.instance('cli', cfg.driver, cfg[cfg.driver]).then(function(db) {
    switch ( ARGS[2] ) {
      case 'add' :
        createPassword().then(function(password) {
          db.query('INSERT INTO `users` (`username`, `password`, `groups`, `name`) VALUES(?, ?, ?, ?);', [username, password, JSON.stringify(groups), username])
            .then(resolve).catch(reject);
        }).catch(reject);
      break;

      case 'pwd' :
        createPassword().then(function(password) {
          db.query('UPDATE `users` SET `password` = ? WHERE `username` = ?;', [password, username])
            .then(resolve).catch(reject);
        }).catch(reject);
      break;

      case 'grp' :
        db.query('UPDATE `users` SET `groups` = ? WHERE `username` = ?;', [JSON.stringify(groups), username])
          .then(resolve).catch(reject);
      break;

      default:
        reject('Invalid command' + ARGS[2]);
      break;
    }
  });
})).then(function(result) {
  if ( result ) {
    console.log(result);
  }
  process.exit(0);
}).catch(function(error) {
  console.error(error);
  process.exit(1);
});
