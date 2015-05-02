/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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

  var MountPoints = {};
  MountPoints.scandir = function(item, callback, options) {
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

  MountPoints.write = function(item, data, callback, options) {
    options = options || {};

    OSjs.VFS.abToDataSource(data, item.mime, function(error, dataSource) {
      if ( error ) {
        callback(error);
        return;
      }

      var wopts = [item.path, dataSource, options];
      OSjs.VFS.internalCall('write', wopts, callback);
    });
  };

  MountPoints.read = function(item, callback, options) {
    options = options || {};

    this.url(item, function(error, url) {
      if ( error ) {
        return callback(error);
      }

      Utils.ajax({
        url: url,
        method: 'GET',
        responseType: 'arraybuffer',
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

  MountPoints.copy = function(src, dest, callback) {
    OSjs.VFS.internalCall('copy', [src.path, dest.path], callback);
  };

  MountPoints.move = function(src, dest, callback) {
    OSjs.VFS.internalCall('move', [src.path, dest.path], callback);
  };

  MountPoints.unlink = function(item, callback) {
    OSjs.VFS.internalCall('delete', [item.path], callback);
  };

  MountPoints.mkdir = function(item, callback) {
    OSjs.VFS.internalCall('mkdir', [item.path], callback);
  };

  MountPoints.exists = function(item, callback) {
    OSjs.VFS.internalCall('exists', [item.path], callback);
  };

  MountPoints.fileinfo = function(item, callback) {
    OSjs.VFS.internalCall('fileinfo', [item.path], callback);
  };

  MountPoints.url = function(item, callback) {
    var path    = typeof item === 'string' ? item : item.path;
    var handler = OSjs.Core.getHandler();
    var fsuri   = handler.getConfig('Core').FSURI;
    callback(false, path ? (fsuri + path) : fsuri);
  };

  MountPoints.trash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  MountPoints.untrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  MountPoints.emptyTrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};

    if ( !MountPoints[name] ) {
      throw new Error('Invalid MountPoints API call name');
    }

    var fargs = args;
    fargs.push(callback);
    fargs.push(options);
    MountPoints[name].apply(MountPoints, fargs);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.registerMounts = function() {

    var settings = OSjs.API.getDefaultSettings();
    var config = null;

    try {
      config = settings.Core.VFS.Mountpoints;
    } catch ( e ) {
      console.warn('mountpoints.js initialization error', e, e.stack);
    }

    console.debug('Registering mountpoints...', config);

    if ( config ) {
      var points = Object.keys(config);
      points.forEach(function(key) {
        var iter = config[key];
        console.info('VFS', 'Registering mountpoint', key, iter);

        var re = new RegExp('^' + key + '\\:\\/\\/');
        OSjs.VFS.Modules[key] = {
          readOnly: (typeof iter.readOnly === 'undefined') ? false : (iter.readOnly === true),
          description: iter.description || key,
          icon: 'places/folder-publicshare.png',
          root: key + ':///',
          visible: true,
          internal: true,
          match: re,
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
      });
    }
  };

})(OSjs.Utils, OSjs.API);
