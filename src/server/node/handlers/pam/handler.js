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

(function(qs, pam, userid, fs, path) {

  function getRootPath(username) {
    return path.join('/home', username, '.osjs');
  }

  function getSettingsPath(username) {
    return path.join(getRootPath(username), 'settings.json');
  }

  function getGroupsPath() {
    return path.join('/etc', 'osjs', 'groups.json');
  }

  function authenticate(login, callback) {

    function getUserGroups(cb) {
      fs.readFile(getGroupsPath(), function(err, gdata) {
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
      fs.readFile(getSettingsPath(login.username), function(err, sdata) {
        var settings = {};
        if ( !err && sdata ) {
          try {
            settings = JSON.parse(sdata.toString());
          } catch ( e ) {}
        }
        cb(settings);
      });
    }

    pam.authenticate(login.username, login.password, function(err) {
      if ( err ) {
        callback(err);
      } else {
        getUserSettings(function(settings) {
          getUserGroups(function(groups) {
            callback(false, {
              id: userid.uid(login.username),
              groups: groups,
              name: login.username
            }, settings);
          });
        });
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  // Attach API functions
  exports.register = function(CONFIG, API, HANDLER) {
    API.login = function(login, callback, request, response, body) {
      authenticate(login, function(err, data, settings) {
        if ( err ) {
          callback(err);
          return;
        }

        request.cookies.set('username', login.username, {httpOnly:true});
        request.cookies.set('groups', JSON.stringify(data.groups), {httpOnly:true});

        callback(false, {
          userData : {
            id:       data.id,
            username: login.username,
            name:     data.name,
            groups:   data.groups
          },
          userSettings: settings
        });

      });
    };

    API.logout = function(args, callback, request, response) {
      request.cookies.set('username', null, {httpOnly:true});
      request.cookies.set('groups', null, {httpOnly:true});
      callback(false, true);
    };

    API.settings = function(args, callback, request, response) {
      var settings = args.settings;
      var uname = request.cookies.get('username');
      var data = JSON.stringify(settings);

      // Make sure directory exists before writing
      fs.mkdir(getRootPath(uname), function() {
        fs.writeFile(getSettingsPath(uname), data,  function(err) {
          callback(err || false, !!err);
        });
      });
    };
  };

})(
  require('querystring'),
  require('authenticate-pam'),
  require('userid'),
  require('fs'),
  require('path')
);
