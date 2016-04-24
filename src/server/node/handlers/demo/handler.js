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

  var API = {
    login: function(args, callback, request, response, config, handler) {
      handler.onLogin(request, response, {
        userData: {
          id: 0,
          username: 'demo',
          name: 'Demo User',
          groups: ['admin']
        }
      }, callback);
    },

    logout: function(args, callback, request, response, config, handler) {
      handler.onLogout(request, response, callback);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @api handler.DemoHandler
   * @see handler.Handler
   * @class
   */
  exports.register = function(instance, DefaultHandler) {
    function DemoHandler() {
      DefaultHandler.call(this, instance, API);
    }

    DemoHandler.prototype = Object.create(DefaultHandler.prototype);
    DemoHandler.constructor = DefaultHandler;

    /**
     * By default OS.js will check src/conf for group permissions.
     * This overrides and leaves no checks (full access)
     */
    DemoHandler.prototype.checkAPIPrivilege = function(request, response, privilege, callback) {
      this._checkHasSession(request, response, callback);
    };

    /**
     * By default OS.js will check src/conf for group permissions.
     * This overrides and leaves no checks (full access)
     */
    DemoHandler.prototype.checkVFSPrivilege = function(request, response, path, args, callback) {
      this._checkHasSession(request, response, callback);
    };

    /**
     * By default OS.js will check src/conf for group permissions.
     * This overrides and leaves no checks (full access)
     */
    DemoHandler.prototype.checkPackagePrivilege = function(request, response, packageName, callback) {
      this._checkHasSession(request, response, callback);
    };

    return new DemoHandler();
  };

})();
