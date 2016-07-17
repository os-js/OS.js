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
(function(Utils, API, VFS) {
  'use strict';

  /**
   * @namespace Internal
   * @memberof OSjs.VFS.Transports
   */

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Make a OS.js Server HTTP URL for VFS
   *
   * @param   {(String|OSjs.VFS.File)}    item        VFS File
   *
   * @retun   {String}                  URL based on input
   *
   * @function path
   * @memberof OSjs.VFS.Transports.Internal
   */
  function makePath(item) {
    if ( typeof item === 'string' ) {
      item = new VFS.File(item);
    }
    return OSjs.Core.getHandler().getVFSPath(item);
  }

  /**
   * Perform default VFS call via backend
   *
   * @function request
   * @memberof OSjs.VFS.Transports.Internal
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
   * @function upload
   * @memberof OSjs.VFS.Transports.Internal
   */
  function internalUpload(file, dest, callback, options) {
    options = options || {};

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
    fd.append('upload', 1);
    fd.append('path', dest);

    if ( options ) {
      Object.keys(options).forEach(function(key) {
        fd.append(key, String(options[key]));
      });
    }

    VFS.Helpers.addFormFile(fd, 'upload', file);

    OSjs.Core.getHandler().callAPI('FS:upload', fd, callback, null, options);
  }

  /**
   * Read a remote file with URL (CORS)
   *
   * This function basically does a cURL call and downloads
   * the data.
   *
   * @param   String          url       URL
   * @param   String          mime      MIME Type
   * @param   Function        callback  Callback function => fn(error, result)
   * @param   Object          options   Options
   *
   * @option  options     String      type    What to return, default: binary. Can also be: text, datasource
   *
   * @function fetch
   * @memberof OSjs.VFS.Transports.Internal
   */
  function internalFetch(url, mime, callback, options) {
    options = options || {};
    options.type = options.type || 'binary';
    mime = options.mime || 'application/octet-stream';

    console.debug('VFS::Transports::Internal::fetch()', url, mime);

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
      internalRequest('scandir', {path: item.path}, function(error, result) {
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

      VFS.Helpers.abToDataSource(data, item.mime, function(error, dataSource) {
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
      callback(false, VFS.Transports.Internal.path(item));
    },

    freeSpace: function(root, callback) {
      internalRequest('freeSpace', {root: root}, callback);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  VFS.Transports.Internal = {
    request: internalRequest,
    upload: internalUpload,
    fetch: internalFetch,

    module: Transport,
    path: makePath
  };

})(OSjs.Utils, OSjs.API, OSjs.VFS);
