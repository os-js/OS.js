/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Mysql Handler: Login screen and session/settings handling via database
 * PLEASE NOTE THAT THIS AN EXAMPLE ONLY, AND SHOUD BE MODIFIED BEFORE USAGE
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
(function(qs, mysql, bcrypt) {
  'use strict';
  var connection;

  /////////////////////////////////////////////////////////////////////////////
  // CONFIGURATION
  /////////////////////////////////////////////////////////////////////////////

  var MYSQL_CONFIG = {
    host     : 'localhost',
    user     : 'osjs',
    password : 'osjs',
    database : 'osjs'
  };

  var PASSWORD_CONFIG = {
    bcrypt    : true,
    signature : '\$2a$1'
  };

  /////////////////////////////////////////////////////////////////////////////
  // USER SESSION ABSTRACTION
  /////////////////////////////////////////////////////////////////////////////

  var APIUser = function() {};
  APIUser.login = function(login, request, response, callback) {
    console.log('APIUser::login()');

    function complete(data) {
      request.cookies.set('username', data.username, {httpOnly:true});
      request.cookies.set('groups', JSON.stringify(data.groups), {httpOnly:true});

      callback(false, {
        userData : {
          id : data.id,
          username : data.username,
          name : data.name,
          groups : data.groups
        },
        userSettings: data.settings
      });
    }

    function invalid() {
      callback('Invalid login credentials');
    }

    if ( !login ) {
      invalid();
      return;
    }

    function getUserInfo() {
      var q = 'SELECT `id`, `username`, `name`, `groups`, `settings` FROM `osjs_users` WHERE `username` = ? LIMIT 1;';
      var a = [login.username];

      connection.query(q, a, function(err, rows, fields) {
        if ( err ) {
          console.error(err);
          callback(err.Error);
          return;
        } else {
          if ( rows[0] ) {
            var row = rows[0];
            var settings = {};
            var groups = [];

            try {
              settings = JSON.parse(row.settings);
            } catch ( e ) {
              console.log('failed to parse settings', e);
            }

            try {
              groups = JSON.parse(row.groups);
            } catch ( e ) {
              console.log('failed to parse groups', e);
            }

            complete({
              id: parseInt(row.id, 10),
              username: row.username,
              name: row.name,
              groups: groups,
              settings: settings
            });
            return;
          }
        }

        invalid();
      });
    }

    var q = 'SELECT `password` FROM `osjs_users` WHERE `username` = ? LIMIT 1;';
    var a = [login.username];

    connection.query(q, a, function(err, rows, fields) {
      if ( err ) {
        console.error(err);
        callback(err.Error);
        return;
      } else {
        if ( rows[0] ) {
          var row = rows[0];

          if ( PASSWORD_CONFIG.bcrypt === true ) {
            var hash = row.password.replace(/^\$2y(.+)$/i, PASSWORD_CONFIG.signature);
            bcrypt.compare(login.password, hash, function(err, res) {
              if ( res === true ) {
                getUserInfo();
              } else {
                invalid();
              }
            });
            return;
          } else {
            if ( row.password === login.password ) {
              getUserInfo();
            } else {
              invalid();
            }
          }
          return;
        }
      }
      invalid();
    });
  };

  APIUser.updateSettings = function(settings, request, response, callback) {
    var uname = request.cookies.get('username');

    var q = 'UPDATE `users` SET `settings` = ? WHERE `username` = ?;';
    var a = [JSON.stringify(settings), uname];

    connection.query(q, a, function(err, rows, fields) {
      if ( err ) {
        console.error(err);
        callback(err.Error);
        return;
      }

      callback(false, true);
    });
  };

  APIUser.logout = function(request, response) {
    console.log('APIUser::logout()');
    request.cookies.set('username', null, {httpOnly:true});
    request.cookies.set('groups', null, {httpOnly:true});
    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  exports.register = function(CONFIG, API, HANDLER) {
    console.info('-->', 'Registering handler API methods');

    HANDLER.onServerStart = function() {
      if ( !connection ) {
        connection = mysql.createConnection(MYSQL_CONFIG);
        connection.connect();
      }
    };

    HANDLER.onServerEnd = function() {
      if ( connection ) {
        connection.end();
      }
    };

    API.login = function(args, callback, request, response, body) {
      APIUser.login(args, request, response, function(error, result) {
        callback(error, result);
      });
    };

    API.logout = function(args, callback, request, response) {
      var result = APIUser.logout(request, response);
      callback(false, result);
    };

    API.settings = function(args, callback, request, response) {
      APIUser.updateSettings(args.settings, request, response, callback);
    };

  };

})(require('querystring'), require('mysql'), require('bcryptjs'));
