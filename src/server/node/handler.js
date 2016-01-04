/*!
 * OS.js - JavaScript Operating System
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
(function(_path, _api, _config) {
  var HANDLER = require(_path.join(_config.rootdir, 'src', 'server', 'node', 'handlers', _config.handler , 'handler.js'));

  if ( !HANDLER.checkPrivilege ) {
    HANDLER.checkPrivilege = function(request, response, privilege, respond) {
      if ( typeof privilege !== 'boolean' ) {
        if ( !privilege ) privilege = [];
        if ( !(privilege instanceof Array) && privilege ) privilege = [privilege];
      }

      function check() {
        var groups = [];
        try {
          groups = JSON.parse(request.cookies.get('groups'));
        } catch ( e ) {
          groups = [];
        }

        if ( groups.indexOf('admin') < 0 ) {
          var allowed = true;
          privilege.forEach(function(p) {
            if ( groups.indexOf(p) < 0 ) {
              allowed = false;
            }
            return allowed;
          });
          return allowed;
        }

        return true;
      }

      var uname = request.cookies.get('username');
      if ( !uname ) {
        respond('You have no OS.js Session, please log in!', "text/plain", response, null, 500);
        return false;
      }

      if ( privilege.length && !check() ) {
        respond('You are not allowed to use this API function!', "text/plain", response, null, 403);
        return false;
      }

      return true;
    };
  }

  if ( _config.extensions ) {
    var exts = _config.extensions;
    exts.forEach(function(f) {
      if ( f.match(/\.js$/) ) {
        console.info('-->', 'Registering external API methods', f);
        require(_config.rootdir + f).register(_config, _api, HANDLER);
      }
    });
  }

  if ( !HANDLER ) {
    console.log("Invalid handler %s defined", _config.handler);
    return;
  }

  HANDLER.register(_config, _api, HANDLER);

  module.exports = HANDLER;
})(
  require("path"),
  require("./api.js"),
  require("./config.js")
);
