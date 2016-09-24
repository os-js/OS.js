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

//
// See doc/handler-mysql.txt
//

(function(mysql, bcrypt) {
  'use strict';

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

  /////////////////////////////////////////////////////////////////////////////
  // USER SESSION ABSTRACTION
  /////////////////////////////////////////////////////////////////////////////

  var APIUser = function() {};
  APIUser.login = function(server, login, callback) {
    console.log('APIUser::login()');

    function complete(data) {
      server.handler.onLogin(server, {
        userData: {
          id : data.id,
          username : data.username,
          name : data.name,
          groups : data.groups
        },
        userSettings: data.settings
      }, callback);
    }

    function invalid() {
      callback('Invalid login credentials');
    }

    function onerror(err) {
      console.error(err.toString());
      callback(err.toString());
      return;
    }

    if ( !login ) {
      invalid();
      return;
    }

    function getUserInfo() {
      var q = 'SELECT `id`, `username`, `name`, `groups`, `settings` FROM `users` WHERE `username` = ? LIMIT 1;';
      var a = [login.username];

      query(q, a, function(err, rows, fields) {
        if ( err ) {
          onerror(err);
          return;
        }

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
        invalid();
      });
    }

    var q = 'SELECT `password` FROM `users` WHERE `username` = ? LIMIT 1;';
    var a = [login.username];

    query(q, a, function(err, rows, fields) {
      if ( err ) {
        onerror(err);
        return;
      }

      if ( rows[0] ) {
        var row = rows[0];
        var hash = row.password.replace(/^\$2y(.+)$/i, '\$2a$1');
        bcrypt.compare(login.password, hash, function(err, res) {
          if ( err ) {
            onerror(err);
          } else {
            if ( res === true ) {
              getUserInfo();
            } else {
              invalid();
            }
          }
        });
        return;
      }

      invalid();
    });
  };

  APIUser.updateSettings = function(server, settings, callback) {
    var uname = server.handler.getUserName(server);
    var q = 'UPDATE `users` SET `settings` = ? WHERE `username` = ?;';
    var a = [JSON.stringify(settings), uname];

    query(q, a, function(err, rows, fields) {
      if ( err ) {
        onerror(err);
        return;
      }

      callback(false, true);
    });
  };

  APIUser.add = function(server, args, user, callback) {
    var q = 'INSERT INTO `users` (`username`, `name`, `groups`, `password`) VALUES(?, ?, ?, ?);';
    var a = [user.username, user.name, user.groups.join(','), '']
    query(q, a, function(err, rows, fields) {
      callback(err, !err);
    });
  };

  APIUser.remove = function(server, args, user, callback) {
    var q = 'DELETE FROM `users` WHERE `id` = ?;';
    var a = [user.id]
    query(q, a, function(err, rows, fields) {
      callback(err, !err);
    });
  };

  APIUser.edit = function(server, args, user, callback) {
    var q = 'UPDATE `users` SET `username` = ?, `name` = ?, `groups` = ? WHERE `id` = ?;';
    var a = [user.username, user.name, user.groups.join(','), user.id]
    query(q, a, function(err, rows, fields) {
      callback(err, !err);
    });
  };

  APIUser.passwd = function(server, args, user, callback) {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(user.password, salt, function(err, hash) {
        var q = 'UPDATE `users` SET `password` = ? WHERE `id` = ?;';
        var a = [hash, user.id]
        query(q, a, function(err, rows, fields) {
          callback(err, !err);
        });
      });
    });
  };

  APIUser.list = function(server, args, user, callback) {
    var q = 'SELECT `id`, `username`, `name`, `groups` FROM `users`;';
    query(q, [], function(err, rows, fields) {
      callback(err, (rows || []).map(function(iter) {
        try {
          iter.groups = JSON.parse(iter.groups) || [];
        } catch ( e ) {
          iter.groups = [];
        }
        return iter;
      }));
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var API = {
    login: function(server, args, callback) {
      APIUser.login(server, args, function(error, result) {
        if ( error ) {
          callback(error);
          return;
        }

        server.handler.onLogin(server, result, function() {
          callback(false, result);
        });
      });
    },

    logout: function(server, args, callback) {
      server.handler.onLogout(server, callback);
    },

    settings: function(server, args, callback) {
      APIUser.updateSettings(server, args.settings, callback);
    },

    users: function(server, args, callback) {
      switch ( args.command ) {
        case 'list':
        case 'add':
        case 'remove':
        case 'edit':
        case 'passwd':
          APIUser[args.command](server, args, args.user, callback);
          break;

        default:
          callback('No such command', {});
          break;
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @api handler.MysqlHandler
   * @see handler.Handler
   * @class
   */
  exports.register = function(instance, DefaultHandler) {
    function MysqlHandler() {
      DefaultHandler.call(this, instance, API);
    }

    MysqlHandler.prototype = Object.create(DefaultHandler.prototype);
    MysqlHandler.constructor = DefaultHandler;

    MysqlHandler.prototype.onServerStart = function(cb) {
      var cfg = instance.config.handlers.mysql;
      var ccfg = {};

      Object.keys(cfg).forEach(function(c) {
        if ( typeof cfg[c] === 'object' ) {
          ccfg[c] = cfg[c];
        } else {
          ccfg[c] = String(cfg[c]);
        }
      });

      pool = mysql.createPool(ccfg);

      cb();
    };

    MysqlHandler.prototype.onServerEnd = function(cb) {
      cb();
    };

    return new MysqlHandler();
  };

})(require('mysql'), require('bcryptjs'));
