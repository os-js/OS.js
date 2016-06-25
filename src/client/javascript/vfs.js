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

  /*@
   *
   *  This is a wrapper for handling all VFS functions
   *  read() write() scandir() and so on.
   *
   *  See 'src/client/javascript/vfs/' for the specific modules.
   *
   *  You should read the information below!
   *
   *  ---------------------------------------------------------------------------
   *
   *  Functions that take 'metadata' (File Metadata) as an argument (like all of them)
   *  it expects you to use an instance of OSjs.VFS.File()
   *
   *     VFS.read(new VFS.File('/path/to/file', 'text/plain'), callback);
   *
   *  or anonymous file paths:
   *     VFS.read('/path/to/file', callback)
   *
   *  ---------------------------------------------------------------------------
   *
   *  By default all functions that read data will return ArrayBuffer, but you can also return:
   *     String
   *     dataSource
   *     ArrayBuffer
   *     Blob
   *
   *  ---------------------------------------------------------------------------
   *
   *  Functions that take 'data' (File Data) as an argument supports these types:
   *
   *     File                      Browser internal
   *     Blob                      Browser internal
   *     ArrayBuffer               Browser internal
   *     String                    Just a normal string
   *     OSjs.VFS.FileDataURL      Wrapper for dataSource URL strings
   *     JSON                      JSON Data defined as: {filename: foo, data: bar}
   *
   *  ---------------------------------------------------------------------------
   *
   *  This a list of modules and their paths
   *
   *     User         home:///            OS.js User Storage
   *     OS.js        osjs:///            OS.js Dist (Read-only)
   *     GoogleDrive  google-drive:///    Google Drive Storage
   *     OneDrive     onedrive:///        Microsoft OneDrive (SkyDrive)
   *     Dropbox      dropbox:///         Dropbox Storage
   *
   */

  OSjs.VFS             = OSjs.VFS            || {};
  OSjs.VFS.Modules     = OSjs.VFS.Modules    || {};
  OSjs.VFS.Transports  = OSjs.VFS.Transports || {};

  var DefaultModule = 'User';
  var MountsRegistered = false;

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Check if given path is an internal module
   *
   * @param   String    test        Module Name
   *
   * @return  boolean
   * @api     OSjs.VFS.isInternalModule()
   */
  function isInternalModule(test) {
    test = test || '';

    var m = OSjs.VFS.Modules;
    var d = null;

    if ( test !== null ) {
      Object.keys(m).every(function(name) {
        var i = m[name];
        if ( i.internal === true && i.match && test.match(i.match) ) {
          d = true;
          return false;
        }
        return true;
      });
    }

    return d;
  }

  /**
   * Checks if internal module is enabled
   *
   * @param   String    module        Module Name
   *
   * @return  boolean
   * @api     OSjs.VFS.isInternalEnabled()
   */
  function isInternalEnabled(module) {
    try {
      if ( API.getConfig('VFS.Internal.' + module + '.enabled') === false ) {
        return false;
      }
    } catch ( e ) {}

    return true;
  }

  /**
   * Returns a list of all enabled VFS modules
   *
   * @param   Object    opts          Options
   *
   * @option  opts      boolean       visible       All visible modules only (default=true)
   *
   * @return  Array                   List of all Modules found
   * @api     OSjs.VFS.getModules()
   */
  function getModules(opts) {
    opts = Utils.argumentDefaults(opts, {
      visible: true,
      special: false
    });

    var m = OSjs.VFS.Modules;
    var a = [];
    Object.keys(m).forEach(function(name) {
      var iter = m[name];
      if ( !iter.enabled() || (!opts.special && iter.special) ) {
        return;
      }

      if ( opts.visible && iter.visible === opts.visible ) {
        a.push({
          name: name,
          module: iter
        });
      }
    });
    return a;
  }

  /**
   * Get module name from path
   *
   * @param   String    test        Path name
   * @param   boolean   retdef      Return default upon failure (default = true)
   *
   * @return  boolean
   * @api     OSjs.VFS.getModuleFromPath()
   */
  function getModuleFromPath(test, retdef) {
    retdef = typeof retdef === 'undefined' ? true : (retdef === true);

    var d = null;

    if ( typeof test === 'string' ) {
      Object.keys(OSjs.VFS.Modules).forEach(function(name) {
        if ( d === null ) {
          var i = OSjs.VFS.Modules[name];
          if ( i.enabled() === true && i.match && test.match(i.match) ) {
            d = name;
          }
        }
      });
    }

    return d || (retdef ? DefaultModule : null);
  }

  /**
   * Filters a scandir() request
   *
   * @param             Array     list              List of results from scandir()
   * @param             Object    options           Filter options
   *
   * @option  opts      String    typeFilter        `type` filter
   * @option  opts      Array     mimeFilter        `mime` filter
   * @option  opts      boolean   showHiddenFiles   Show dotfiles
   *
   * @return  boolean
   * @api     OSjs.VFS.filterScandir()
   */
  function filterScandir(list, options) {

    var defaultOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});

    options = Utils.argumentDefaults(options, defaultOptions.scandir || {});
    options = Utils.argumentDefaults(options, {
      typeFilter: null,
      mimeFilter: [],
      showHiddenFiles: true
    }, true);

    var result = [];

    function filterFile(iter) {
      if ( iter.filename !== '..' ) {
        if ( (options.typeFilter && iter.type !== options.typeFilter) || (!options.showHiddenFiles && iter.filename.match(/^\.\w/)) ) {
          return false;
        }
      }
      return true;
    }

    function validMime(iter) {
      if ( options.mimeFilter && options.mimeFilter.length && iter.mime ) {
        var valid = false;
        options.mimeFilter.every(function(miter) {
          if ( iter.mime.match(miter) ) {
            valid = true;
            return false;
          }
          return true;
        });
        return valid;
      }
      return true;
    }

    list.forEach(function(iter) {
      if ( iter.mime === 'application/vnd.google-apps.folder' ) {
        iter.type = 'dir';
      }

      if ( (iter.filename === '..' && options.backlink === false) || !filterFile(iter) ) {
        return;
      }

      if ( iter.type === 'file' ) {
        if ( !validMime(iter) ) {
          return;
        }
      }

      result.push(iter);
    });

    var tree = {dirs: [], files: []};
    for ( var i = 0; i < result.length; i++ ) {
      if ( result[i].type === 'dir' ) {
        tree.dirs.push(result[i]);
      } else {
        tree.files.push(result[i]);
      }
    }

    return tree.dirs.concat(tree.files);
  }

  /**
   * Returns the URL without protocol
   *
   * @param   String    orig        Path name
   *
   * @return  String
   * @api     OSjs.VFS.getRelativeURL()
   */
  function getRelativeURL(orig) {
    return orig.replace(/^([A-z0-9\-_]+)\:\/\//, '');
  }

  /**
   * Get root from path (ex: foo:///)
   *
   * @param   String    path        Path name
   *
   * @return  String
   * @api     OSjs.VFS.getRootFromPath()
   */
  function getRootFromPath(path) {
    var module = getModuleFromPath(path);
    return OSjs.VFS.Modules[module].root;
  }

  /**
   * Creates a regexp matcher for a VFS module (from string)
   */
  function createMatch(name) {
    return new RegExp('^' + name.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));
  }

  /**
   * Wrapper for converting data
   */
  function _abToSomething(m, arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';

    try {
      var blob    = new Blob([arrayBuffer], {type: mime});
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r[m](blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // CONVERSION HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is a helper to add a File to FormData
   *
   * @param   FormData          fd      FormData instance
   * @param   String            key     FormData entry name
   * @param   [File]            data    File Data (see supported types)
   * @param   OSjs.VFS.File     file    File Metadata
   *
   * @return  void
   *
   * @api     OSjs.VFS.addFormFile()
   */
  function addFormFile(fd, key, data, file) {
    if ( data instanceof window.File ) {
      fd.append(key, data);
    } else {
      if ( file ) {
        if ( data instanceof window.ArrayBuffer ) {
          try {
            data = new Blob([data], {type: file.mime});
          } catch ( e ) {
            data = null;
            console.warn(e, e.stack);
          }
        }
        fd.append(key, data, file.filename);
      } else {
        if ( data.data && data.filename ) { // In case user defines custom
          fd.append(key, data.data, data.filename);
        }
      }
    }
  }

  /**
   * Convert DataSourceURL to ArrayBuffer
   *
   * @param   String        data        The datasource string
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.dataSourceToAb()
   */
  function dataSourceToAb(data, mime, callback) {
    var byteString = atob(data.split(',')[1]);
    var mimeString = data.split(',')[0].split(':')[1].split(';')[0];

    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    callback(false, ab);
  }

  /**
   * Convert PlainText to ArrayBuffer
   *
   * @param   String        data        The plaintext string
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.textToAb()
   */
  function textToAb(data, mime, callback) {
    _abToSomething('readAsArrayBuffer', data, mime, callback);
  }

  /**
   * Convert ArrayBuffer to DataSourceURL
   *
   * @param   ArrayBuffer   arrayBuffer The ArrayBuffer
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.abToDataSource()
   */
  function abToDataSource(arrayBuffer, mime, callback) {
    _abToSomething('readAsDataURL', arrayBuffer, mime, callback);
  }

  /**
   * Convert ArrayBuffer to PlainText
   *
   * @param   ArrayBuffer   arrayBuffer The ArrayBuffer
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.abToText()
   */
  function abToText(arrayBuffer, mime, callback) {
    _abToSomething('readAsText', arrayBuffer, mime, callback);
  }

  /**
   * Convert ArrayBuffer to BinaryString
   *
   * @param   ArrayBuffer   arrayBuffer The ArrayBuffer
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.abToBinaryString()
   */
  function abToBinaryString(arrayBuffer, mime, callback) {
    _abToSomething('readAsBinaryString', arrayBuffer, mime, callback);
  }

  /**
   * Convert ArrayBuffer to Blob
   *
   * @param   ArrayBuffer   arrayBuffer The ArrayBuffer
   * @param   String        mime        The mime type
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.abToBlob()
   */
  function abToBlob(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';

    try {
      var blob = new Blob([arrayBuffer], {type: mime});
      callback(false, blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }

  /**
   * Convert Blob to ArrayBuffer
   *
   * @param   Blob          data        The blob
   * @param   Function      callback    Callback function => fn(error, result)
   *
   * @return  void
   *
   * @api     OSjs.VFS.blobToAb()
   */
  function blobToAb(data, callback) {
    try {
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r.readAsArrayBuffer(data);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // MOUNTPOINTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Mounts given mountpoint
   *
   * Currently supports: Custom internal methods, webdav/owncloud
   *
   * If you want to configure default mountpoints, look at the manual linked below.
   *
   * @param Object        opts        Mountpoint options
   * @param Function      cb          Callback function => fn(err, result)
   *
   * @option  opts    String      name            Mountpoint Name (unique)
   * @option  opts    String      description     General description
   * @option  opts    String      icon            Icon
   * @option  opts    String      transport       Transporter name (Internal/WebDAV)
   * @option  opts    Object      options         Connection options (for external services like webdav)
   *
   * @option  options String      host            (Optional) Host (full URL)
   * @option  options String      username        (Optional) Username
   * @option  options String      password        (Optional) Password
   * @option  options boolean     cors            (Optional) If CORS is enabled (default=false)
   *
   * @return  void
   *
   * @link  https://os.js.org/doc/manuals/man-mountpoints.html
   *
   * @api   OSjs.VFS.createMountpoint()
   */
  function createMountpoint(opts, cb) {
    opts = Utils.argumentDefaults(opts, {
      description: 'My VFS Module',
      transport: 'Internal',
      name: 'MyModule',
      icon: 'places/server.png',
      searchable: false
    });

    if ( OSjs.VFS.Modules[opts.name] ) {
      throw new Error(API._('ERR_VFSMODULE_ALREADY_MOUNTED_FMT', opts.name));
    }

    if ( opts.transport.toLowerCase() === 'owndrive' ) {
      opts.transport = 'WebDAV';
    }

    var modulePath = opts.name.replace(/\s/g, '-').toLowerCase() + '://';
    var moduleRoot = modulePath + '/';
    var moduleMatch = createMatch(modulePath);
    var moduleOptions = opts.options || {};

    var module = (function createMountpointModule() {
      var isMounted = true;

      return _createMountpoint({
        readOnly: false,
        description: opts.description,
        visible: true,
        dynamic: true,
        unmount: function(cb) {
          isMounted = false;

          API.message('vfs:unmount', opts.name, {source: null});
          (cb || function() {})(false, true);

          delete OSjs.VFS.Modules[opts.name];
        },
        mounted: function() {
          return isMounted;
        },
        root: moduleRoot,
        icon: opts.icon,
        match: moduleMatch,
        options: moduleOptions
      });
    })();

    var validModule = (function() {
      if ( (['internal', 'webdav']).indexOf(opts.type) < 0 ) {
        return 'No such type \'' + opts.type + '\'';
      }
      if ( opts.type === 'webdav' && !moduleOptions.username ) {
        return 'Connection requires username (authorization)';
      }
      return true;
    })();

    if ( validModule !== true ) {
      throw new Error(API._('ERR_VFSMODULE_INVALID_CONFIG_FMT', validModule));
    }

    OSjs.VFS.Modules[opts.name] = module;
    API.message('vfs:mount', opts.name, {source: null});

    (cb || function() {})(false, true);
  }

  /**
   * Unmounts given mountpoint
   *
   * Only mountpoints mounted via `createMountpoint` is supported
   *
   * @param   String      moduleName        Name of registered module
   * @param   Function    cb                Callback function => fn(err, result)
   *
   * @return  void
   *
   * @api OSjs.VFS.removeMountpoints()
   */
  function removeMountpoint(moduleName, cb) {
    if ( !OSjs.VFS.Modules[moduleName] || !OSjs.VFS.Modules[moduleName].dynamic ) {
      throw new Error(API._('ERR_VFSMODULE_NOT_MOUNTED_FMT', moduleName));
    }
    OSjs.VFS.Modules[moduleName].unmount(cb);
  }

  /**
   * Registeres all configured mount points
   *
   * @return  void
   *
   * @api     OSjs.VFS.registerMountpoints()
   */
  function registerMountpoints() {
    if ( MountsRegistered ) { return; }
    MountsRegistered = true;

    var config = null;

    try {
      config = API.getConfig('VFS.Mountpoints');
    } catch ( e ) {
      console.warn('mountpoints.js initialization error', e, e.stack);
    }

    console.debug('Registering mountpoints...', config);

    if ( config ) {
      var points = Object.keys(config);
      points.forEach(function(key) {
        var iter = config[key];
        if ( iter.enabled !== false ) {
          console.info('VFS', 'Registering mountpoint', key, iter);

          var mp = _createMountpoint({
            readOnly: (typeof iter.readOnly === 'undefined') ? false : (iter.readOnly === true),
            transport: iter.transport || 'Internal',
            description: iter.description || key,
            icon: iter.icon || 'devices/harddrive.png',
            root: key + ':///',
            options: iter.options,
            visible: true,
            internal: true,
            searchable: true,
            match: createMatch(key + '://')
          });

          OSjs.VFS.Modules[key] = mp;
        }
      });
    }
  }

  /**
   * Wrapper for creating a new VFS module
   *
   * THIS IS ONLY USED INTERNALLY
   *
   * @param   Object  params      Module parameters
   *
   * @return  Object              Module parameters
   *
   * @api   OSjs.VFS.createMountpoint()
   */
  function _createMountpoint(params) {
    var target = OSjs.VFS.Transports[params.transport];
    if ( target && typeof target.defaults === 'function' ) {
      target.defaults(params);
    }

    return Utils.argumentDefaults(params, {
      request: function(name, args, callback, options) {
        callback = callback || function() {
          console.warn('NO CALLBACK FUNCTION WAS ASSIGNED IN VFS REQUEST');
        };

        if ( !target ) {
          callback(API._('ERR_VFSMODULE_INVALID_TYPE_FMT', params.transport));
          return;
        }

        if ( params.readOnly ) {
          var restricted = ['upload', 'unlink', 'write', 'mkdir', 'copy', 'move', 'trash', 'untrash', 'emptyTrash'];
          if ( restricted.indexOf(name) !== -1 ) {
            callback(API._('ERR_VFSMODULE_READONLY'));
            return;
          }
        }

        var module = target.module || {};
        if ( !module[name] ) {
          callback(API._('ERR_VFS_UNAVAILABLE'));
          return;
        }

        var fargs = args || [];
        fargs.push(callback);
        fargs.push(options);
        module[name].apply(module, fargs);
      },
      unmount: function(cb) {
        (cb || function() {})(API._('ERR_VFS_UNAVAILABLE'), false);
      },
      mounted: function() {
        return true;
      },
      enabled: function() {
        return true;
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.filterScandir         = filterScandir;
  OSjs.VFS.getModules            = getModules;
  OSjs.VFS.getModuleFromPath     = getModuleFromPath;
  OSjs.VFS.isInternalModule      = isInternalModule;
  OSjs.VFS.isInternalEnabled     = isInternalEnabled;
  OSjs.VFS.getRelativeURL        = getRelativeURL;
  OSjs.VFS.getRootFromPath       = getRootFromPath;
  OSjs.VFS.addFormFile           = addFormFile;

  OSjs.VFS.abToBinaryString      = abToBinaryString;
  OSjs.VFS.abToDataSource        = abToDataSource;
  OSjs.VFS.abToText              = abToText;
  OSjs.VFS.textToAb              = textToAb;
  OSjs.VFS.abToBlob              = abToBlob;
  OSjs.VFS.blobToAb              = blobToAb;
  OSjs.VFS.dataSourceToAb        = dataSourceToAb;

  OSjs.VFS._createMountpoint     = _createMountpoint;
  OSjs.VFS.createMountpoint      = createMountpoint;
  OSjs.VFS.removeMountpoint      = removeMountpoint;
  OSjs.VFS.registerMountpoints   = registerMountpoints;

})(OSjs.Utils, OSjs.API);
