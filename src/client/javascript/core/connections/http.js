/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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

(function(VFS, API, Utils, Connection) {
  'use strict';

  function HttpConnection() {
    Connection.apply(this, arguments);
  }

  HttpConnection.prototype = Object.create(Connection.prototype);
  HttpConnection.constructor = Connection;

  HttpConnection.prototype.request = function(method, args, onsuccess, onerror, options) {
    var res = Connection.prototype.request.apply(this, arguments);

    if ( res === false ) {
      var url = (function() {
        if ( method.match(/^FS:/) ) {
          return API.getConfig('Connection.FSURI') + '/' + method.replace(/^FS\:/, '');
        }
        return API.getConfig('Connection.APIURI') + '/' + method;
      })();

      return this._requestXHR(url, args, options, onsuccess, onerror);
    }

    return res;
  };

  HttpConnection.prototype.onVFSRequestCompleted = function(module, method, args, error, result, callback, appRef) {
    if ( !error ) {
      // Emit a VFS event when a change occures
      if ( ['write', 'mkdir', 'copy', 'move', 'unlink'].indexOf(method) !== -1 ) {
        var arg = method === 'move' ? {
          source: args[0] instanceof VFS.File ? args[0] : null,
          destination: args[1] instanceof VFS.File ? args[1] : null
        } : args[method === 'copy' ? 1 : 0];

        VFS.Helpers.triggerWatch(method, arg, appRef);
      }
    }
    callback();
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Connections = OSjs.Connections || {};
  OSjs.Connections.http = HttpConnection;

})(OSjs.VFS, OSjs.API, OSjs.Utils, OSjs.Core.Connection);
