/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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

  var PublicStorage = {};
  PublicStorage.scandir = function(item, callback, options) {
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
  PublicStorage.write = function(item, data, callback, options) {
    var wopts = [item.path, data];
    if ( options ) {
      wopts.push(options);
    }
    OSjs.VFS.internalCall('write', wopts, callback);
  };
  PublicStorage.read = function(item, callback, options) {
    var ropts = [item.path];
    var dataSource = options ? (options.dataSource ? true : false) : false;
    if ( options ) {
      ropts.push(options);
    }

    //OSjs.VFS.internalCall('read', ropts, callback);
    OSjs.VFS.internalCall('read', ropts, function(error, result) {
      if ( error ) {
        return callback(error);
      }
      callback(false, dataSource ? result : Utils.atobUtf(result));
    });
  };
  PublicStorage.copy = function(src, dest, callback) {
    OSjs.VFS.internalCall('copy', [src.path, dest.path], callback);
  };
  PublicStorage.move = function(src, dest, callback) {
    OSjs.VFS.internalCall('move', [src.path, dest.path], callback);
  };
  PublicStorage.unlink = function(item, callback) {
    OSjs.VFS.internalCall('delete', [item.path], callback);
  };
  PublicStorage.mkdir = function(item, callback) {
    OSjs.VFS.internalCall('mkdir', [item.path], callback);
  };
  PublicStorage.exists = function(item, callback) {
    OSjs.VFS.internalCall('exists', [item.path], callback);
  };
  PublicStorage.fileinfo = function(item, callback) {
    OSjs.VFS.internalCall('fileinfo', [item.path], callback);
  };
  PublicStorage.url = function(item, callback) {
    var path    = typeof item === 'string' ? item : item.path;
    var handler = OSjs.API.getHandlerInstance();
    var fsuri   = handler.getConfig('Core').FSURI;
    callback(false, path ? (fsuri + path) : fsuri);
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};

    if ( !PublicStorage[name] ) {
      throw new Error('Invalid PublicStorage API call name');
    }

    var fargs = args;
    fargs.push(callback);
    fargs.push(options);
    PublicStorage[name].apply(PublicStorage, fargs);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Modules.Public = OSjs.VFS.Modules.Public || {
    arrayBuffer: false,
    readOnly: false,
    description: 'Shared',
    root: '/',
    icon: 'places/folder-publicshare.png',
    visible: true,
    internal: true,
    match: /^\//,
    mounted: function() {
      return true;
    },
    enabled: function() {
      return true;
    },
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);
