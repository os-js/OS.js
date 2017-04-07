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
(function(Utils, API, VFS) {
  'use strict';

  /**
   * @namespace OSjs
   * @memberof OSjs.VFS.Transports
   */

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Make a OS.js Server HTTP URL for VFS
   *
   * @param   {(String|OSjs.VFS.File)}    item        VFS File
   * @param   {Object}                    [options]   Options
   *
   * @return  {String}                  URL based on input
   *
   * @function path
   * @memberof OSjs.VFS.Transports.OSjs
   */
  function makePath(item, options) {
    if ( typeof item === 'string' ) {
      item = new VFS.File(item);
    }
    return OSjs.Core.getConnection().getVFSPath(item, options);
  }

  /**
   * Perform default VFS call via backend
   *
   * @param {String}    name      Request method name
   * @param {Object}    args      Request arguments
   * @param {Function}  callback  Callback function
   *
   * @function request
   * @memberof OSjs.VFS.Transports.OSjs
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
   * @param   {Object}        file        Upload object
   * @param   {Object}        dest        Destination file info (VFS Object if possible)
   * @param   {Function}      callback    Callback function
   * @param   {Object}        options     Options
   * @param   {OSjs.VFS.File} [vfsfile]   Optional file metadata
   *
   * @function upload
   * @memberof OSjs.VFS.Transports.OSjs
   */
  function internalUpload(file, dest, callback, options, vfsfile) {
    options = options || {};

    if ( dest instanceof VFS.File ) {
      dest = dest.path;
    }

    if ( typeof file.size !== 'undefined' ) {
      var maxSize = API.getConfig('VFS.MaxUploadSize');
      if ( maxSize > 0 ) {
        var bytes = file.size;
        if ( bytes > maxSize ) {
          var msg = API._('DIALOG_UPLOAD_TOO_BIG_FMT', Utils.humanFileSize(maxSize));
          callback('error', null, msg);
          return;
        }
      }
    }

    var fd  = new FormData();
    fd.append('path', dest);
    if ( vfsfile ) {
      fd.append('filename', vfsfile.filename);
    }

    if ( options ) {
      Object.keys(options).forEach(function(key) {
        if ( key !== 'meta' && typeof options[key] !== 'function' ) {
          fd.append(key, String(options[key]));
        }
      });
    }

    if ( file instanceof window.ArrayBuffer ) {
      fd.append('size', String(file.byteLength));
    }

    VFS.Helpers.addFormFile(fd, 'upload', file, options.meta);

    OSjs.Core.getConnection().request('FS:upload', fd, callback, null, options);
  }

  /**
   * Read a remote file with URL (CORS)
   *
   * This function basically does a cURL call and downloads
   * the data.
   *
   * @param   {String}          url             URL
   * @param   {String}          mime            MIME Type
   * @param   {Function}        callback        Callback function => fn(error, result)
   * @param   {Object}          options         Options
   * @param   {String}          [options.type]  What to return, default: binary. Can also be: text, datasource
   *
   * @function fetch
   * @memberof OSjs.VFS.Transports.OSjs
   */
  function internalFetch(url, mime, callback, options) {
    options = options || {};
    options.type = options.type || 'binary';
    mime = options.mime || 'application/octet-stream';

    console.debug('VFS::Transports::OSjs::fetch()', url, mime);

    if ( arguments.length < 1 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }

    options = options || {};

    API.curl({
      url: url,
      binary: true,
      mime: mime
    }, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }

      if ( !response.body ) {
        callback(API._('ERR_VFS_REMOTEREAD_EMPTY'));
        return;
      }

      if ( options.type.toLowerCase() === 'datasource' ) {
        callback(false, response.body);
        return;
      }

      VFS.Helpers.dataSourceToAb(response.body, mime, function(error, response) {
        if ( options.type === 'text' ) {
          VFS.Helpers.abToText(response, mime, function(error, text) {
            callback(error, text);
          });
          return;
        }
        callback(error, response);
      });
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /*
   * Default VFS Transport Module
   *
   * All mountpoints without a spesified Transport module is routed through
   * here. This means the node/php server handles the request directly
   */
  var Transport = {
    scandir: function(item, callback, options) {
      options = options || {};
      var args = {
        path: item.path,
        options: {
          shortcuts: options.shortcuts
        }
      };

      internalRequest('scandir', args, function(error, result) {
        var list = [];
        if ( result ) {
          result = VFS.Helpers.filterScandir(result, options);
          result.forEach(function(iter) {
            list.push(new VFS.File(iter));
          });
        }
        callback(error, list);
      });
    },

    write: function(item, data, callback, options) {
      options = options || {};
      options.meta = item;
      options.overwrite = true;
      options.onprogress = options.onprogress || function() {};

      function _write(dataSource) {
        var wopts = {path: item.path, data: dataSource};
        internalRequest('write', wopts, callback, options);
      }

      if ( options.upload === false ) {
        if ( typeof data === 'string' && !data.length ) {
          _write(data);
        } else {
          VFS.Helpers.abToDataSource(data, item.mime, function(error, dataSource) {
            if ( error ) {
              callback(error);
              return;
            }

            _write(dataSource);
          });
        }
        return;
      }

      var parentItem = VFS.file(Utils.dirname(item.path), item.mime);
      internalUpload(data, parentItem, function() {
        callback(null, true);
      }, options, item);
    },

    read: function(item, callback, options) {
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

    url: function(item, callback, options) {
      callback(false, VFS.Transports.OSjs.path(item, options));
    },

    freeSpace: function(root, callback) {
      internalRequest('freeSpace', {root: root}, callback);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  VFS.Transports.OSjs = {
    request: internalRequest,
    upload: internalUpload,
    fetch: internalFetch,

    module: Transport,
    path: makePath
  };

})(OSjs.Utils, OSjs.API, OSjs.VFS);
