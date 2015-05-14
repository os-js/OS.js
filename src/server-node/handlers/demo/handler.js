/*!
 * OS.js - JavaScript Operating System
 *
 * Example Handler: Login screen and session/settings handling via database
 * PLEASE NOTE THAT THIS AN EXAMPLE ONLY, AND SHOUD BE MODIFIED BEFORE USAGE
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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

  var APIUser = function() {};
  APIUser.login = function(data, request, response) {
    console.log('APIUser::login()');
    request.cookies.set('username', data.username, {httpOnly:true});
    request.cookies.set('groups', JSON.stringify(data.groups), {httpOnly:true});
    return data;
  };

  APIUser.logout = function(request, response) {
    console.log('APIUser::logout()');
    request.cookies.set('username', null, {httpOnly:true});
    request.cookies.set('groups', null, {httpOnly:true});
    return true;
  };

  // This simply adds full privileges to all users (remove this to enable default check)
  exports.checkPrivilege = function(request, response, privilege) {
    var uname = request.cookies.get('username');
    if ( !uname ) {
      respond('You have no OS.js Session, please log in!', "text/plain", response, null, 500);
      return false;
    }
    return true;
  };

  exports.register = function(CONFIG, API, HANDLER) {
    console.info('-->', 'Registering handler API methods');

    API.login = function(args, callback, request, response) {
      var result = APIUser.login({
        id: 0,
        username: 'demo',
        name: 'Demo User',
        groups: ['demo']
      }, request, response);

      callback(false, result);
    };

    API.logout = function(args, callback, request, response) {
      var result = APIUser.logout(request, response);
      callback(false, result);
    };

  };

})();
