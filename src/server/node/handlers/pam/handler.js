/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Example Handler: Login screen and session/settings handling via database
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

//
// See doc/pam-handler.txt
//

(function(pam, userid, fs, path) {
  'use strict';

  function getSettingsPath(cfg, username) {
    return cfg.settings.replace('%USERNAME%', username);
  }

  function authenticate(cfg, login, callback) {

    function getUserGroups(cb) {
      fs.readFile(cfg.groups, function(err, gdata) {
        var list = {};
        if ( !err ) {
          try {
            list = JSON.parse(gdata.toString());
          } catch ( e ) {}
        }

        cb(list[login.username] || []);
      });
    }

    function getUserSettings(cb) {
      fs.readFile(getSettingsPath(cfg, login.username), function(err, sdata) {
        var settings = {};
        if ( !err && sdata ) {
          try {
            settings = JSON.parse(sdata.toString());
          } catch ( e ) {}
        }
        cb(settings);
      });
    }

    function getUserBlacklist(cb) {
      fs.readFile(cfg.blacklist, function(err, bdata) {
        var blacklist = [];

        if ( !err && bdata ) {
          try {
            blacklist = JSON.parse(bdata)[login.username] || [];
          } catch ( e ) {}
        }

        cb(blacklist);
      });
    }

    pam.authenticate(login.username, login.password, function(err) {
      if ( err ) {
        callback(err);
      } else {
        getUserSettings(function(settings) {
          getUserGroups(function(groups) {
            getUserBlacklist(function(blacklist) {
              callback(false, {
                id: userid.uid(login.username),
                groups: groups,
                name: login.username
              }, settings, blacklist);
            });
          });
        });
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var API = {
    login: function(login, callback, request, response, config, handler) {
      var cfg = config.handlers.pam;
      authenticate(cfg, login, function(err, data, settings, blacklist) {
        if ( err ) {
          callback(err);
          return;
        }

        var d = {
          id:       data.id,
          username: login.username,
          name:     data.name,
          groups:   data.groups
        };

        handler.onLogin(request, response, {
          userData: d,
          userSettings: settings,
          blacklistedPackages: blacklist
        }, callback);
      });
    },

    logout: function(args, callback, request, response, config, handler) {
      handler.onLogout(request, response, callback);
    },

    settings: function(args, callback, request, response, config, handler) {
      var settings = args.settings;
      var uname = handler.getUserName(request, response);
      var data = JSON.stringify(settings);

      var cfg = config.handlers.pam;
      var spath = getSettingsPath(cfg, uname);

      // Make sure directory exists before writing
      fs.mkdir(path.dirname(spath), function() {
        fs.writeFile(spath, data,  function(err) {
          callback(err || false, !!err);
        });
      });
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @api handler.PAMHandler
   * @see handler.Handler
   * @class
   */
  exports.register = function(instance, DefaultHandler) {
    function PAMHandler() {
      DefaultHandler.call(this, instance, API);
    }

    PAMHandler.prototype = Object.create(DefaultHandler.prototype);
    PAMHandler.constructor = DefaultHandler;

    return new PAMHandler();
  };

})(
  require('authenticate-pam'),
  require('userid'),
  require('fs'),
  require('path')
);
