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
    login: function(args, callback, request, response) {
      function login(data) {
        request.cookies.set('username', data.username, {httpOnly:true});
        request.cookies.set('groups', JSON.stringify(data.groups), {httpOnly:true});
        return data;
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
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  exports.register = function(instance, DefaultHandler) {
    function Handler() {
      DefaultHandler.call(this, instance, API);
    }

    Handler.prototype = Object.create(DefaultHandler.prototype);
    Handler.constructor = DefaultHandler;

    Handler.prototype.checkAPIPrivilege = function(request, response, privilege) {
      return this._checkDefaultPrivilege(request, response);
    };

    Handler.prototype.checkVFSPrivilege = function(request, response, path, args) {
      return this._checkDefaultPrivilege(request, response);
    };

    return new Handler();
  };

})();
