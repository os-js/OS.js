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
(function(Utils, API) {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var _NullModule = {};

  _NullModule.scandir = function(item, callback, options) {
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

  _NullModule.write = function(item, data, callback, options) {
    options = options || {};
    options.onprogress = options.onprogress || function() {};

    function _write(dataSource) {
      var wopts = [item.path, dataSource, options];
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

  _NullModule.read = function(item, callback, options) {
    options = options || {};
    options.onprogress = options.onprogress || function() {};

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

  _NullModule.copy = function(src, dest, callback) {
    OSjs.VFS.internalCall('copy', [src.path, dest.path], callback);
  };

  _NullModule.move = function(src, dest, callback) {
    OSjs.VFS.internalCall('move', [src.path, dest.path], callback);
  };

  _NullModule.unlink = function(item, callback) {
    OSjs.VFS.internalCall('delete', [item.path], callback);
  };

  _NullModule.mkdir = function(item, callback) {
    OSjs.VFS.internalCall('mkdir', [item.path], callback);
  };

  _NullModule.exists = function(item, callback) {
    OSjs.VFS.internalCall('exists', [item.path], callback);
  };

  _NullModule.fileinfo = function(item, callback) {
    OSjs.VFS.internalCall('fileinfo', [item.path], callback);
  };

  _NullModule.url = function(item, callback) {
    var path    = typeof item === 'string' ? item : item.path;
    var fsuri   = API.getConfig('Connection.FSURI');
    callback(false, path ? (fsuri + path) : fsuri);
  };

  _NullModule.trash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  _NullModule.untrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  _NullModule.emptyTrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};

    if ( !_NullModule[name] ) {
      throw new Error('Invalid _NullModule API call name');
    }

    var fargs = args;
    fargs.push(callback);
    fargs.push(options);
    _NullModule[name].apply(_NullModule, fargs);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS._NullModule = {
    unmount: function(cb) {
      cb = cb || function() {};
      cb(API._('ERR_VFS_UNAVAILABLE'), false);
    },
    mounted: function() {
      return true;
    },
    enabled: function() {
      return true;
    },
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);
