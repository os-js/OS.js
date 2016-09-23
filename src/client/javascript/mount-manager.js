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
(function(Utils, VFS, API) {
  'use strict';

  /**
   * A mountpoint object for use in MountManager
   * @property {String}     name                      Mountpoint Name (unique)
   * @property {String}     description               General description
   * @property {String}     icon                      Icon
   * @property {String}     root                      The root path (ex: home:///)
   * @property {RegExp}     match                     Matches a path given in VFS methods to this
   * @property {String}     transport                 Transporter name (Internal/WebDAV)
   * @property {Boolean}    [readOnly=false]          If this is a readonly point
   * @property {Boolean}    [visible=true]            If this is visible in the UIs
   * @property {Boolean}    [searchable=true]         If you can search for files in this module
   * @property {Boolean}    [internal=false]          If this is a internal module
   * @property {Function}   [mount]                   Method for mounting (INTERNAL)
   * @property {Function}   [unmount]                 Method for unmounting (INTERNAL)
   * @property {Function}   [enabled]                 Method for getting enabled state (INTERNAL)
   * @property {Function}   [request]                 Method for making a request (INTERNAL)
   * @property {Object}     options                   Connection options (for external services like webdav)
   * @property {String}     [options.host]            Host (full URL)
   * @property {String}     [options.username]        Username
   * @property {String}     [options.password]        Password
   * @property {Boolean}    [options.cors=false]      If CORS is enabled
   * @typedef Mountpoint
   */

  var DefaultModule = 'User';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a regexp matcher for a VFS module (from string)
   */
  function createMatch(name) {
    return new RegExp('^' + name.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));
  }

  /////////////////////////////////////////////////////////////////////////////
  // MOUNT MANAGER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Mount Manager Class
   *
   * @summary Class for maintaining mountpoints
   *
   * <pre><b>
   * YOU CAN ONLY GET AN INSTANCE WITH `Core.getMountManager()`
   * </b></pre>
   *
   * @example
   * OSjs.Core.getMountManager()
   *
   * @constructor
   * @memberof OSjs.Core
   * @see OSjs.Core.getMountManager
   */
  var MountManager = (function() {
    var _queue = [];
    var _inited = false;
    var _modules = {};

    return Object.seal({

      /**
       * Creates a valid Mountpoint object from given data
       *
       * @function _create
       * @memberof OSjs.Core.MountManager#
       *
       * @param {Mountpoint}  opts                Mounpoint options
       * @return {Mountpoint} With corrections and/or necesarry modifications
       */
      _create: function(params) {
        var target = VFS.Transports[params.transport];
        if ( target && typeof target.defaults === 'function' ) {
          target.defaults(params);
        }

        function _checkReadOnly(name, params, args) {
          if ( params.readOnly ) {
            var restricted = ['upload', 'unlink', 'write', 'mkdir', 'move', 'trash', 'untrash', 'emptyTrash'];

            if ( name === 'copy' ) {
              var dest = MountManager.getModuleFromPath(args[1].path, false, true);
              return dest.internal !== params.internal;
            }

            if ( restricted.indexOf(name) !== -1 ) {
              return true;
            }
          }
          return false;
        }

        var mparams = (function() {
          var o = {};
          Object.keys(params).forEach(function(k) {
            if ( typeof params[k] !== 'function' ) {
              o[k] = params[k];
            }
          });
          return Object.freeze(o);
        })();

        var cfg = Utils.argumentDefaults(params, {
          request: function(name, args, callback, options) {
            callback = callback || function() {
              console.warn('NO CALLBACK FUNCTION WAS ASSIGNED IN VFS REQUEST');
            };

            if ( !target ) {
              callback(API._('ERR_VFSMODULE_INVALID_TYPE_FMT', params.transport));
              return;
            }

            if ( _checkReadOnly(name, params, args) ) {
              callback(API._('ERR_VFSMODULE_READONLY'));
              return;
            }

            var module = target.module || {};
            if ( !module[name] ) {
              callback(API._('ERR_VFS_UNAVAILABLE'));
              return;
            }

            var fargs = args || [];
            fargs.push(callback);
            fargs.push(options);
            fargs.push(mparams);
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

        return cfg;
      },

      /**
       * Method for adding pre-defined modules like Dropbox and GoogleDrive
       *
       * @function _add
       * @memberof OSjs.Core.MountManager#
       *
       * @param {Mountpoint}  opts                Mounpoint options
       * @param {Boolean}     [emitEvent=false]   Emit the internal mount event
       */
      _add: function(opts, emitEvent) {
        if ( _inited ) {
          _modules[opts.name] = Object.seal(opts);
          if ( emitEvent ) {
            API.message('vfs:mount', opts.name, {source: null});
          }

          console.debug('MountManager::_add()', 'Created mountpoint...', opts);
        } else {
          _queue.push(arguments);
        }
      },

      /**
       * Initializes all pre-configured mountpoints
       *
       * @function init
       * @memberof OSjs.Core.MountManager#
       *
       * @param {Function} callback Callback when done
       */
      init: function(callback) {
        if ( _inited ) {
          callback();
          return;
        }

        _inited = true;

        _queue.forEach(function(i) {
          var add = MountManager._create.apply(MountManager, i);
          MountManager._add(add, false);
        });

        var config = API.getConfig('VFS.Mountpoints', {});
        Object.keys(config).forEach(function(key) {
          var iter = config[key];
          if ( iter.enabled !== false ) {
            var mp = MountManager._create({
              readOnly: (typeof iter.readOnly === 'undefined') ? false : (iter.readOnly === true),
              name: key,
              transport: iter.transport || 'Internal',
              description: iter.description || key,
              icon: iter.icon || 'devices/harddrive.png',
              root: key + ':///',
              options: iter.options,
              visible: iter.visible !== false,
              internal: true,
              searchable: true,
              match: createMatch(key + '://')
            });

            MountManager._add(mp, false);
          }
        });

        _queue = [];

        callback();
      },

      /**
       * Restores all stored connections
       *
       * @function restore
       * @memberof OSjs.Core.MountManager#
       *
       * @param {Function} callback Callback when done
       */
      restore: function(callback) {
        var sm = OSjs.Core.getSettingsManager();
        Utils.asyncs(sm.instance('VFS').get('mounts', []), function(iter, idx, next) {
          try {
            MountManager.add(iter, next);
          } catch ( e ) {
            console.warn('MountManager::restore()', e, e.stack);
            next();
          }
        }, function() {
          callback();
        });
      },

      /**
       * Mounts given mountpoint
       *
       * Currently supports: Custom internal methods, webdav/owncloud
       *
       * If you want to configure default mountpoints, look at the manual linked below.
       *
       * @function add
       * @memberof OSjs.Core.MountManager#
       * @throws {Error} If the mountpoint is already mounted or the module is invalid
       *
       * @param {Mountpoint} opts                           Mountpoint options
       * @param {Function}   cb                             Callback function => fn(err, result)
       *
       * @link  https://os.js.org/doc/manuals/man-mountpoints.html
       */
      add: function(opts, cb) {
        opts = Utils.argumentDefaults(opts, {
          description: 'My VFS Module',
          transport: 'Internal',
          name: 'MyModule',
          icon: 'places/server.png',
          searchable: false,
          visible: true,
          readOnly: false
        });

        if ( _modules[opts.name] ) {
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

          return MountManager._create({
            readOnly: opts.readOnly,
            transport: opts.transport,
            name: opts.name,
            description: opts.description,
            visible: opts.visible,
            dynamic: true,
            unmount: function(cb) {
              isMounted = false;

              API.message('vfs:unmount', opts.name, {source: null});
              (cb || function() {})(false, true);
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
          if ( Object.keys(VFS.Transports).indexOf(opts.transport) < 0 ) {
            return 'No such transport \'' + opts.transport + '\'';
          }
          if ( opts.transport === 'WebDAV' && !moduleOptions.username ) {
            return 'Connection requires username (authorization)';
          }
          return true;
        })();

        if ( validModule !== true ) {
          throw new Error(API._('ERR_VFSMODULE_INVALID_CONFIG_FMT', validModule));
        }

        MountManager._add(module, true);

        (cb || function() {})(false, true);
      },

      /**
       * Unmounts given mountpoint
       *
       * Only mountpoints mounted via `_create` is supported
       *
       * @function remove
       * @memberof OSjs.Core.MountManager#
       * @throws {Error} If the mountpoint does not exist
       *
       * @param   {String}      moduleName        Name of registered module
       * @param   {Function}    cb                Callback function => fn(err, result)
       */
      remove: function(moduleName, cb) {
        if ( !_modules[moduleName] ) {
          throw new Error(API._('ERR_VFSMODULE_NOT_MOUNTED_FMT', moduleName));
        }

        _modules[moduleName].unmount(function() {
          delete _modules[moduleName];
          cb.apply(MountManager, arguments);
        });
      },

      /**
       * Check if given path is an internal module
       *
       * @function isInternal
       * @memberof OSjs.Core.MountManager#
       *
       * @param   {String}    test        Module Name
       *
       * @return  {Boolean}
       */
      isInternal: function isInternalModule(test) {
        test = test || '';

        var m = _modules;
        var d = null;

        if ( test !== null ) {
          Object.keys(m).forEach(function(name) {
            if ( d !== true ) {
              var i = m[name];
              if ( i.internal === true && i.match && test.match(i.match) ) {
                d = true;
              }
            }
          });
        }

        return d;
      },

      /**
       * Checks if internal module is enabled
       *
       * @function isInternalEnabled
       * @memberof OSjs.Core.MountManager#
       *
       * @param   {String}    module        Module Name
       *
       * @return  {Boolean}
       */
      isInternalEnabled: function(module) {
        try {
          if ( API.getConfig('VFS.Internal.' + module + '.enabled') === false ) {
            return false;
          }
        } catch ( e ) {}

        return true;
      },

      /**
       * Returns a list of all enabled VFS modules
       *
       * @function getModules
       * @memberof OSjs.Core.MountManager#
       *
       * @param   {Object}    opts                  Options
       * @param   {Boolean}   [opts.visible=true]   All visible modules only
       *
       * @return  {Object{}}                   List of all Modules found
       */
      getModules: function(opts) {
        opts = Utils.argumentDefaults(opts, {
          visible: true,
          special: false
        });

        var m = _modules;
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
      },

      getModule: function(name) {
        return _modules[name];
      },

      /**
       * Get module name from path
       *
       * @function getModuleFromPath
       * @memberof OSjs.Core.MountManager#
       *
       * @param   {String}    test               Path name
       * @param   {Boolean}   [retdef=true]      Return default upon failure
       * @param   {Boolean}   [retobj=false]     Return module object instead of name
       *
       * @return  {Mixed}                 Module name or object based on arguments
       */
      getModuleFromPath: function getModuleFromPath(test, retdef, retobj) {
        retdef = typeof retdef === 'undefined' ? true : (retdef === true);

        var d = null;

        if ( typeof test === 'string' ) {
          Object.keys(_modules).forEach(function(name) {
            if ( d === null ) {
              var i = _modules[name];
              if ( i.enabled() === true && i.match && test.match(i.match) ) {
                d = name;
              }
            }
          });
        }

        var moduleName = d || (retdef ? DefaultModule : null);
        return retobj ? _modules[moduleName] : moduleName;
      },

      /**
       * Get root from path (ex: foo:///)
       *
       * @function getRootFromPath
       * @memberof OSjs.Core.MountManager#
       *
       * @param   {String}    path        Path name
       * @return  {String}
       * @api     OSjs.VFS.getRootFromPath()
       */
      getRootFromPath: function getRootFromPath(path) {
        return MountManager.getModuleFromPath(path, false, true).root;
      },

      getModuleProperty: function(module, property) {
        if ( typeof module === 'string' ) {
          module = _modules[module];
        }

        return module[property];
      }
    });

  })();

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get the current MountManager  instance
   *
   * @function getMountManager
   * @memberof OSjs.Core
   * @return {OSjs.Core.MountManager}
   */
  OSjs.Core.getMountManager = function() {
    return MountManager;
  };

})(OSjs.Utils, OSjs.VFS, OSjs.API);
