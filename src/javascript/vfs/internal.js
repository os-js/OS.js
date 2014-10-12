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

  var InternalStorage = {};
  InternalStorage.scandir = function(item, callback) {
    OSjs.VFS.internalCall('scandir', [item.path], function(error, result) {
      var list = [];
      if ( result ) {
        result = OSjs.VFS.filterScandir(result, item._opts);
        result.forEach(function(iter) {
          list.push(new OSjs.VFS.File(iter));
        });
      }
      callback(error, list);
    });
  };
  InternalStorage.write = function(item, data, callback) {
    var wopts = [item.path, data];
    if ( item._opts ) {
      wopts.push(item._opts);
    }
    OSjs.VFS.internalCall('write', wopts, callback);
  };
  InternalStorage.read = function(item, callback) {
    var ropts = [item.path];
    if ( item._opts ) {
      ropts.push(item._opts);
    }
    OSjs.VFS.internalCall('read', ropts, callback);
  };
  InternalStorage.copy = function(src, dest, callback) {
    OSjs.VFS.internalCall('copy', [src.path, dest.path], callback);
  };
  InternalStorage.move = function(src, dest, callback) {
    OSjs.VFS.internalCall('move', [src.path, dest.path], callback);
  };
  InternalStorage.unlink = function(item, callback) {
    OSjs.VFS.internalCall('delete', [item.path], callback);
  };
  InternalStorage.mkdir = function(item, callback) {
    OSjs.VFS.internalCall('mkdir', [item.path], callback);
  };
  InternalStorage.exists = function(item, callback) {
    OSjs.VFS.internalCall('exists', [item.path], callback);
  };
  InternalStorage.fileinfo = function(item, callback) {
    OSjs.VFS.internalCall('fileinfo', [item.path], callback);
  };
  InternalStorage.url = function(item, callback) {
    var path    = typeof item === 'string' ? item : item.path;
    var handler = OSjs.API.getHandlerInstance();
    var fsuri   = handler.getConfig('Core').FSURI;
    callback(false, path ? (fsuri + path) : fsuri);
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function makeRequest(name, args, callback) {
    args = args || [];
    callback = callback || {};

    if ( !InternalStorage[name] ) {
      throw new Error('Invalid InternalStorage API call name');
    }

    var fargs = args;
    fargs.push(callback);
    InternalStorage[name].apply(InternalStorage, fargs);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Modules.User = OSjs.VFS.Modules.User || {
    description: 'Home',
    root: 'home:///',
    icon: 'places/folder_home.png',
    match: /^home\:\/\//,
    visible: true,
    enabled: function() {
      return true;
    },
    request: makeRequest
  };

  OSjs.VFS.Modules.Internal = OSjs.VFS.Modules.Internal || {
    description: 'Shared',
    root: '/',
    icon: 'places/folder-publicshare.png',
    visible: true,
    match: null,
    enabled: function() {
      return true;
    },
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);
