#!/usr/bin/env node
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
(function(bcrypt, mysql, fs, path, util) {
  'use strict';

  var ROOT = path.join(__dirname, '/../');
  var args = process.argv;
  var pool;

  function query(q, a, cb) {
    if ( !pool ) {
      cb('No mysql connection available');
      return;
    }

    pool.getConnection(function(err, connection) {
      if ( err ) {
        cb(err);
        return;
      }

      connection.query(q, a, function(err, row, fields) {
        cb(err, row, fields);
        connection.release();
      });
    });
  }

  function init() {
    var config = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'server', 'settings.json')));
    var cfg = config.handlers.mysql;
    var ccfg = {};

    Object.keys(cfg).forEach(function(c) {
      if ( typeof cfg[c] === 'object' ) {
        ccfg[c] = cfg[c];
      } else {
        ccfg[c] = String(cfg[c]);
      }
    });

    pool = mysql.createPool(ccfg);
  }

  function createPassword(cb) {
    process.stdout.write('New Password: ');

    var password = '';
    var stdin = process.stdin;
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

           var salt = bcrypt.genSaltSync(10);
           var hash = bcrypt.hashSync(password, salt);
           cb(hash);
           break;

         case '\u0003':
           cb(false);
           break;

         default:
           process.stdout.write('*');
           password += ch;
           break;
      }
    });
  }

  function done(failed) {
    console.log('...done', failed);
    process.exit(failed ? 1 : 0);
  }

  if ( args.length < 4 ) {
    console.log('Available commands:');
    console.log('  add <username> <groups> - Add a user (ex: anders api,fs,curl)');
    console.log('  pwd <username>          - Change a user password');
    console.log('  grp <username> <groups> - Change a users group(s)');
    return;
  }

  init();

  var username = args[3];
  var groups = (args[4] || '').replace(/\s/g, '').split(',');

  switch ( args[2] ) {
    case 'add' :
      createPassword(function(password) {
        if ( !password ) {
          done();
          return;
        }
        query('INSERT INTO `users` (`username`, `password`, `groups`, `name`) VALUES(?, ?, ?, ?);', [username, password, JSON.stringify(groups), username], done);
      });
    break;

    case 'pwd' :
      createPassword(function(password) {
        if ( !password ) {
          done();
          return;
        }
        query('UPDATE `users` SET `password` = ? WHERE `username` = ? LIMIT 1;', [password, username], done);
      });
    break;

    case 'grp' :
      query('UPDATE `users` SET `groups` = ? WHERE `username` = ? LIMIT 1;', [JSON.stringify(groups), username], done);
    break;

    default:
      console.log('Invalid command', args[2]);
    break;
  }

})(require('bcryptjs'), require('mysql'), require('fs'), require('path'), require('util'));
