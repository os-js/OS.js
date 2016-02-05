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
(function() {
  'use strict';

  //
  // THIS IS ONLY A DUMMY HANDLER
  //

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  var API = {
    settings: function(args, callback, request, response) {
      require('fs').writeFileSync('/tmp/osjs-settings.json', JSON.stringify(args.settings, null, 4));
      callback(false, true);
    },

    login: function(args, callback, request, response) {
      function login(data) {
        request.cookies.set('username', data.username, {httpOnly:true});
        request.cookies.set('groups', JSON.stringify(data.groups), {httpOnly:true});
        var settings = {};
        try {
          settings = JSON.parse(require('fs').readFileSync('/tmp/osjs-settings.json'));
        } catch ( e ) {
        }

        return {
          userData: data,
          userSettings: settings
        };
      }

      callback(false, login({
        id: 0,
        username: 'demo',
        name: 'Demo User',
        groups: ['demo']
      }, request, response));
    },

    logout: function(args, callback, request, response) {
      function logout() {
        request.cookies.set('username', null, {httpOnly:true});
        request.cookies.set('groups', null, {httpOnly:true});
        return true;
      }
      callback(false, logout());
    },

    sysinfo: function(args, callback, request, response) {
      callback(false, {metrics: [0, 0, 0, 0, 0, 0, 0, 0], hostname: 'foobar', timezone: 'UTC', rest: 'true'});
    },

    dmesg: function(args, callback, request, response) {
      callback(false, "dmesg");
    },

    syslog: function(args, callback, request, response) {
      callback(false, "syslog");
    },

    ps: function(args, callback, request, response) {
      callback(false, [
        {PID: 0, COMMAND: 'xxx', '%MEM': 0, '%CPU': 0}
      ]);
    },

    opkg: function(args, callback, request, response) {
      if ( args.command === 'list' ) {
        if ( args.args.category === 'upgradable' ) {
          var res = 'wget - 1.16.1-1 - 1.16.1-2';
          callback(false, res);
          return;
        }
      }
      callback('NOT IMPLEMENTED');
    },

    netdevices: function(args, callback, request, response) {
      callback(false, [
        "lo",
        "eth0",
        "wlan0"
      ]);
    },

    netinfo: function(args, callback, request, response) {
      callback(false, {
        "deviceinfo": {
          "lo": [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
          "eth0": [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
          "wlan0": [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
        },
        "ifconfig": [
          {
            "ip": "0.0.0.0",
            "mac": "00:00:00:00:00:00",
            "mask": "0.0.0.0",
            "iface": "lo"
          }
        ]
      });
    },

    setpasswd: function(args, callback, request, response) {
      callback(false, true);
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
    function ArduinoHandler() {
      DefaultHandler.call(this, instance, API);
    }

    ArduinoHandler.prototype = Object.create(DefaultHandler.prototype);
    ArduinoHandler.constructor = DefaultHandler;

    ArduinoHandler.prototype.checkAPIPrivilege = function(request, response, privilege, callback) {
      this._checkDefaultPrivilege(request, response, callback);
    };

    ArduinoHandler.prototype.checkVFSPrivilege = function(request, response, path, args, callback) {
      this._checkDefaultPrivilege(request, response, callback);
    };

    ArduinoHandler.prototype.checkPackagePrivilege = function(request, response, packageName, callback) {
      this._checkDefaultPrivilege(request, response, callback);
    };

    return new ArduinoHandler();
  };

})();
