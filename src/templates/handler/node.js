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

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * These methods will be added to the OS.js `API` namespace
   */
  var API = {
    login: function(args, callback, request, response, config, handler) {
      handler.onLogin(request, response, {
        userSettings: {},
        userData: {
          id: 0,
          username: 'test',
          name: 'EXAMPLE handler user',
          groups: ['admin']
        }
      }, callback);
    },

    logout: function(args, callback, request, response, config, handler) {
      handler.onLogout(request, response, callback);
    },

    settings: function(args, callback, request, response, config, handler) {
      callback(false, true);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is your handler class
   *
   * Out-of-the-box support for permissions! You just have to make sure your
   * login method returns the right groups.
   *
   * @link http://os.js.org/doc/tutorials/create-handler.html
   *
   * @api handler.EXAMPLEHandler
   * @see handler.Handler
   * @class
   */
  exports.register = function(instance, DefaultHandler) {
    function EXAMPLEHandler() {
      DefaultHandler.call(this, instance, API);
    }

    EXAMPLEHandler.prototype = Object.create(DefaultHandler.prototype);
    EXAMPLEHandler.constructor = DefaultHandler;

    EXAMPLEHandler.prototype.onServerStart = function(cb) {
      cb();
    };

    EXAMPLEHandler.prototype.onServerEnd = function(cb) {
      cb();
    };

    return new EXAMPLEHandler();
  };

})();
