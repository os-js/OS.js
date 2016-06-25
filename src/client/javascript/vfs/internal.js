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

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /*
   * Default VFS Transport Module
   *
   * All mountpoints without a spesified Transport module is routed through
   * here. This means the node/php server handles the request directly
   *
   * @api OSjs.VFS.Transports.Internal
   */
  var Transport = {
    scandir: function(item, callback, options) {
      internalRequest('scandir', {path: item.path}, function(error, result) {
        var list = [];
        if ( result ) {
          result = OSjs.VFS.filterScandir(result, options);
          result.forEach(function(iter) {
            list.push(new OSjs.VFS.File(iter));
          });
        }
        callback(error, list);
      });
    },

    write: function(item, data, callback, options) {
      options = options || {};
      options.onprogress = options.onprogress || function() {};

      function _write(dataSource) {
        var wopts = {path: item.path, data: dataSource};

        /*
        if ( API.getConfig('Connection.Type') === 'nw' ) {
          OSjs.Core.getHandler().nw.request(true, 'write', wopt, function(err, res) {
            callback(err, res);
          });
          return;
        }
        */

        internalRequest('write', wopts, callback, options);
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
    },

    read: function(item, callback, options) {
      if ( API.getConfig('Connection.Type') === 'nw' ) {
        OSjs.Core.getHandler().nw.request(true, 'read', {
          path: item.path,
          options: {raw: true}
        }, function(err, res) {
          callback(err, res);
        });
        return;
      }

      internalRequest('get', {path: item.path}, callback, options);
    },

    copy: function(src, dest, callback) {
      internalRequest('copy', {src: src.path, dest: dest.path}, callback);
    },

    move: function(src, dest, callback) {
      internalRequest('move', {src: src.path, dest: dest.path}, callback);
    },

    unlink: function(item, callback) {
      internalRequest('delete', {path: item.path}, callback);
    },

    mkdir: function(item, callback) {
      internalRequest('mkdir', {path: item.path}, callback);
    },

    exists: function(item, callback) {
      internalRequest('exists', {path: item.path}, callback);
    },

    fileinfo: function(item, callback) {
      internalRequest('fileinfo', {path: item.path}, callback);
    },

    find: function(item, args, callback) {
      internalRequest('find', {path: item.path, args: args}, callback);
    },

    url: function(item, callback) {
      callback(false, OSjs.VFS.Transports.Internal.path(item));
    },

    freeSpace: function(root, callback) {
      internalRequest('freeSpace', {root: root}, callback);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Make a OS.js Server HTTP URL for VFS
   *
   * @param   Mixed       item        (Optional) Path of VFS.File object
   *
   * @retun   String                  URL based on input
   *
   * @api OSjs.VFS.Transports.Internal.path()
   */
  function makePath(item) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    }
    return OSjs.Core.getHandler().getVFSPath(item);
  }

  /**
   * Perform default VFS call via backend
   *
   * @see _Handler.callAPI()
   * @api OSjs.VFS.Transports.Internal.request()
   */
  function internalRequest(name, args, callback) {
    API.call('FS:' + name, args, function(err, res) {
      if ( !err && typeof res === 'undefined' ) {
        err = API._('ERR_VFS_FATAL');
      }
      callback(err, res);
    });
  }

  /**
   * Wrapper for internal file uploads
   *
   * @see _Handler.callPOST()
   * @api OSjs.VFS.Transports.Internal.upload()
   */
  function internalUpload(file, dest, callback, options) {
    options = options || {};

    if ( typeof file.size !== 'undefined' ) {
      var maxSize = API.getConfig('VFS.MaxUploadSize');
      if ( maxSize > 0 ) {
        var bytes = file.size;
        if ( bytes > maxSize ) {
          var msg = API._('DIALOG_UPLOAD_TOO_BIG_FMT', Utils.humanFileSize(maxSize));
          callback('error', msg);
          return;
        }
      }
    }

    var fd  = new FormData();
    fd.append('upload', 1);
    fd.append('path', dest);

    if ( options ) {
      Object.keys(options).forEach(function(key) {
        fd.append(key, String(options[key]));
      });
    }

    OSjs.VFS.addFormFile(fd, 'upload', file);

    OSjs.Core.getHandler().callAPI('FS:upload', fd, callback, null, options);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Transports.Internal = {
    request: internalRequest,
    upload: internalUpload,

    module: Transport,
    path: makePath
  };

})(OSjs.Utils, OSjs.API);
