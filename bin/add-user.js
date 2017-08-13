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

const fs = require('fs-extra');
const path = require('path');

const ROOT = path.join(__dirname, '/../');
const ARGS = process.argv;

const config = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'src', 'server', 'settings.json')));
const auther = config.authenticator;
const command = ARGS[2];
const username = ARGS[3];
const groups = String(ARGS[4] || 'admin').replace(/\s/g, '').split(',');

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

          resolve(password);
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
  console.error('You have to add users via your system for this authenticator.');
  process.exit(1);
}

if ( ARGS.length < 4 ) {
  console.log('Available commands:');
  console.log('  add <username> <groups> - Add a user (ex: anders api,fs,curl)');
  console.log('  pwd <username>          - Change a user password');
  console.log('  grp <username> <groups> - Change a users group(s)');
  process.exit(1);
}

const filename = path.resolve(ROOT, 'src/server/node/modules/auth', auther);
console.log('Using authenticator', auther, 'at', filename);

const instance = require(filename);
instance.register(config.modules.auth[auther]).then(() => {
  let promise;
  switch ( command ) {
    case 'add':
      promise = instance.manage('add', {
        username: username,
        name: username,
        groups: groups
      });
      break;

    case 'pwd':
      promise = new Promise((yes, no) => {
        instance.manager().then((manager) => {
          manager.getUserFromUsername(username).then((user) => {
            createPassword().then((input) => {
              instance.manage('passwd', {
                id: user.id,
                password: input
              }).then(yes).catch(no);
            });
          }).catch(no);
        }).catch(no);
      });
      break;

    case 'grp':
      promise = new Promise((yes, no) => {
        instance.manager().then((manager) => {
          manager.getUserFromUsername(username).then((user) => {
            return manager.setGroups(user.id, groups).then(yes).catch(no);
          }).catch(no);
        }).catch(no);
      });
      break;

    default:
      promise = Promise.reject('No such command');
      break;
  }

  promise.then((result) => {
    if ( result ) {
      console.log(result);
    }
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
});
