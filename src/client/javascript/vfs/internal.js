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
(function(Utils, API) {
  'use strict';

  window.OSjs          = window.OSjs          || {};
  OSjs.VFS             = OSjs.VFS             || {};
  OSjs.VFS.Transports  = OSjs.VFS.Transports  || {};

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var internalTransport = {};

  internalTransport.scandir = function(item, callback, options) {
    OSjs.VFS.internalCall('scandir', [item.path], function(error, result) {
      var list = [];
      if ( result ) {
        result = OSjs.VFS.filterScandir(result, options);
        result.forEach(function(iter) {
          list.push(new OSjs.VFS.File(iter));
        });
      }
      callback(error, list);
    });
  };

  internalTransport.write = function(item, data, callback, options) {
    options = options || {};
    options.onprogress = options.onprogress || function() {};

    function _write(dataSource) {
      var wopts = [item.path, dataSource, options];

      /*
      if ( API.getConfig('Connection.Type') === 'nw' ) {
        OSjs.Core.getHandler().nw.request('fs', {
          'method': 'write',
          'arguments': wopts
        }, function(err, res) {
          callback(err, res);
        });
        return;
      }
      */

      OSjs.VFS.internalCall('write', wopts, callback);
    }

    if ( typeof data === 'string' && !data.length ) {
      _write(data);
      return;
    }

    OSjs.VFS.abToDataSource(data, item.mime, function(error, dataSource) {
      if ( error ) {
        callback(error);
        return;
      }

      _write(dataSource);
    });
  };

  internalTransport.read = function(item, callback, options) {
    options = options || {};
    options.onprogress = options.onprogress || function() {};

    if ( API.getConfig('Connection.Type') === 'nw' ) {
      OSjs.Core.getHandler().nw.request('fs', {
        'method': 'read',
        'arguments': [
          item.path,
          {raw: true}
        ]
      }, function(err, res) {
        callback(err, res);
      });
      return;
    }

    this.url(item, function(error, url) {
      if ( error ) {
        return callback(error);
      }

      Utils.ajax({
        url: url,
        method: 'GET',
        responseType: 'arraybuffer',
        onprogress: function(ev) {
          if ( ev.lengthComputable ) {
            options.onprogress(ev, ev.loaded / ev.total);
          } else {
            options.onprogress(ev, -1);
          }
        },
        onsuccess: function(response, xhr) {
          if ( !xhr || xhr.status === 404 || xhr.status === 500 ) {
            callback(xhr.statusText || response);
            return;
          }
          callback(false, response);
        },
        onerror: function(error) {
          callback(error);
        }
      });
    });
  };

  internalTransport.copy = function(src, dest, callback) {
    OSjs.VFS.internalCall('copy', [src.path, dest.path], callback);
  };

  internalTransport.move = function(src, dest, callback) {
    OSjs.VFS.internalCall('move', [src.path, dest.path], callback);
  };

  internalTransport.unlink = function(item, callback) {
    OSjs.VFS.internalCall('delete', [item.path], callback);
  };

  internalTransport.mkdir = function(item, callback) {
    OSjs.VFS.internalCall('mkdir', [item.path], callback);
  };

  internalTransport.exists = function(item, callback) {
    OSjs.VFS.internalCall('exists', [item.path], callback);
  };

  internalTransport.fileinfo = function(item, callback) {
    OSjs.VFS.internalCall('fileinfo', [item.path], callback);
  };

  internalTransport.url = function(item, callback) {
    callback(false, OSjs.VFS.Transports.Internal.path(item));
  };

  internalTransport.trash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  internalTransport.untrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  internalTransport.emptyTrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};

    if ( !internalTransport[name] ) {
      throw new Error('Invalid internalTransport API call name');
    }

    var fargs = args;
    fargs.push(callback);
    fargs.push(options);
    internalTransport[name].apply(internalTransport, fargs);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is the WebDAV VFS Module wrapper
   *
   * @api OSjs.VFS.Transports.WebDAV
   */
  OSjs.VFS.Transports.Internal = {
    request: makeRequest,
    path: function(input) {
      var path = typeof input === 'string' ? input : input.path;
      var base  = API.getConfig('Connection.FSURI', '/') + '/get';
      return path ? (base + path) : path;
    }
  };

})(OSjs.Utils, OSjs.API);
