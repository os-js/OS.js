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
    OSjs.VFS.internalCall('scandir', {path: item.path}, function(error, result) {
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
      var wopts = {path: item.path, data: dataSource};

      /*
      if ( API.getConfig('Connection.Type') === 'nw' ) {
        OSjs.Core.getHandler().nw.request(true, 'write', wopt, function(err, res) {
          callback(err, res);
        });
        return;
      }
      */

      OSjs.VFS.internalCall('write', wopts, callback, options);
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

    if ( API.getConfig('Connection.Type') === 'nw' ) {
      OSjs.Core.getHandler().nw.request(true, 'read', {
        path: item.path,
        options: {raw: true}
      }, function(err, res) {
        callback(err, res);
      });
      return;
    }

    OSjs.VFS.internalCall('get', {path: item.path}, callback, options);
  };

  internalTransport.copy = function(src, dest, callback) {
    OSjs.VFS.internalCall('copy', {src: src.path, dest: dest.path}, callback);
  };

  internalTransport.move = function(src, dest, callback) {
    OSjs.VFS.internalCall('move', {src: src.path, dest: dest.path}, callback);
  };

  internalTransport.unlink = function(item, callback) {
    OSjs.VFS.internalCall('delete', {path: item.path}, callback);
  };

  internalTransport.mkdir = function(item, callback) {
    OSjs.VFS.internalCall('mkdir', {path: item.path}, callback);
  };

  internalTransport.exists = function(item, callback) {
    OSjs.VFS.internalCall('exists', {path: item.path}, callback);
  };

  internalTransport.fileinfo = function(item, callback) {
    OSjs.VFS.internalCall('fileinfo', {path: item.path}, callback);
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

  /**
   * Make a OS.js Server HTTP request for VFS
   *
   * @param   String      name      Method name
   * @param   Object      args      Method arguments
   * @param   Function    callback  Callback => fn(error, result)
   * @param   Object      option    (Optional) request options
   *
   * @return  void
   * @api OSjs.VFS.Transports.Internal.request()
   */
  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};

    if ( !internalTransport[name] ) {
      throw new Error('Invalid Internal API call name');
    }

    var fargs = args;
    fargs.push(callback);
    fargs.push(options);
    internalTransport[name].apply(internalTransport, fargs);
  }

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

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Transports.Internal = {
    request: makeRequest,
    path: makePath
  };

})(OSjs.Utils, OSjs.API);
