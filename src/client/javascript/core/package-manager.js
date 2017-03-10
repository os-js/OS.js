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

(function(Utils, VFS, API) {
  'use strict';

  /**
   * This is the contents of a 'metadata.json' file for a package.
   * @typedef Metadata
   */

  /////////////////////////////////////////////////////////////////////////////
  // PACKAGE MANAGER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Package Manager Class
   *
   * For maintaining packages
   *
   * <pre><b>
   * YOU CAN ONLY GET AN INSTANCE WITH `Core.getPackageManager()`
   * </b></pre>
   *
   * @example
   * OSjs.Core.getPackageManager()
   *
   * @summary Used for managing packages
   *
   * @constructor
   * @memberof OSjs.Core
   * @see OSjs.Core.getPackageManager
   */
  var PackageManager = (function() {
    var blacklist = [];
    var packages = {};

    return Object.seal({
      destroy: function() {
        blacklist = [];
        packages = {};
      },

      /**
       * Load Metadata from server and set packages
       *
       * @function load
       * @memberof OSjs.Core.PackageManager#
       *
       * @param  {Function} callback      callback
       */
      load: function(callback) {
        var self = this;
        callback = callback || {};

        console.debug('PackageManager::load()');

        function loadMetadata(cb) {
          self._loadMetadata(function(err) {
            if ( err ) {
              callback(err, false, PackageManager);
              return;
            }

            var len = Object.keys(packages).length;
            if ( len ) {
              cb();
              return;
            }

            callback(false, 'No packages found!', PackageManager);
          });
        }

        loadMetadata(function() {
          self._loadExtensions(function() {
            callback(true, false, PackageManager);
          });
        });
      },

      /**
       * Internal method for loading all extensions
       *
       * @function _loadExtensions
       * @memberof OSjs.Core.PackageManager#
       *
       * @param  {Function} callback      callback
       */
      _loadExtensions: function(callback) {
        var preloads = [];

        Object.keys(packages).forEach(function(k) {
          var iter = packages[k];
          if ( iter.type === 'extension' && iter.preload ) {
            preloads = preloads.concat(iter.preload);
          }
        });

        if ( preloads.length ) {
          Utils.preload(preloads, function(total, failed) {
            callback();
          });
        } else {
          callback();
        }
      },

      /**
       * Internal method for loading all package metadata
       *
       * @function _loadMetadata
       * @memberof OSjs.Core.PackageManager#
       *
       * @param  {Function} callback      callback
       */
      _loadMetadata: function(callback) {
        var rootURI = API.getBrowserPath().replace(/\/$/, '/packages/'); // FIXME

        function checkEntry(key, iter, scope) {
          iter = Utils.cloneObject(iter);

          iter.type = iter.type || 'application';

          if ( scope ) {
            iter.scope = scope;
          }

          if ( iter.preload ) {
            iter.preload.forEach(function(it) {
              if ( it.src && !it.src.match(/^(\/)|(http)|(ftp)/) ) {
                if ( iter.scope === 'user' ) {
                  it.src = Utils.pathJoin(iter.path, it.src);
                } else {
                  it.src = Utils.pathJoin(rootURI, key, it.src);
                }
              }
            });
          }

          return iter;
        }

        if ( API.isStandalone() || API.getConfig('PackageManager.UseStaticManifest') === true ) {
          var uri = API.getConfig('Connection.MetadataURI');
          Utils.preload([uri], function(total, failed) {
            if ( failed.length ) {
              callback('Failed to load package manifest', failed);
              return;
            }

            packages = {};

            var list = OSjs.Core.getMetadata();
            Object.keys(list).forEach(function(name) {
              var iter = list[name];
              packages[iter.className] = checkEntry(name, iter);
            });

            callback();
          });
          return;
        }

        var paths = OSjs.Core.getSettingsManager().instance('PackageManager').get('PackagePaths', []);
        API.call('packages', {command: 'list', args: {paths: paths}}, function(err, res) {
          if ( res ) {
            packages = {};

            Object.keys(res).forEach(function(key) {
              var iter = res[key];
              if ( iter && !packages[iter.className] ) {
                packages[iter.className] = checkEntry(key, iter);
              }
            });
          }

          callback();
        });
      },

      /**
       * Generates user-installed package metadata (on runtime)
       *
       * @function generateUserMetadata
       * @memberof OSjs.Core.PackageManager#
       *
       * @param  {Function} callback      callback
       */
      generateUserMetadata: function(callback) {
        var self = this;
        var paths = OSjs.Core.getSettingsManager().instance('PackageManager').get('PackagePaths', []);
        API.call('packages', {command: 'cache', args: {action: 'generate', scope: 'user', paths: paths}}, function() {
          self._loadMetadata(callback);
        });
      },

      /**
       * Add a list of packages
       *
       * @param   {Object}    result    Package dict (manifest data)
       * @param   {String}    scope     Package scope (system/user)
       *
       *
       * @function _addPackages
       * @memberof OSjs.Core.PackageManager#
       */
      _addPackages: function(result, scope) {
        console.debug('PackageManager::_addPackages()', result);

        var keys = Object.keys(result);
        if ( !keys.length ) {
          return;
        }

        var currLocale = API.getLocale();

        keys.forEach(function(i) {
          var newIter = Utils.cloneObject(result[i]);
          if ( typeof newIter !== 'object' ) {
            return;
          }

          if ( typeof newIter.names !== 'undefined' && newIter.names[currLocale] ) {
            newIter.name = newIter.names[currLocale];
          }
          if ( typeof newIter.descriptions !== 'undefined' && newIter.descriptions[currLocale] ) {
            newIter.description = newIter.descriptions[currLocale];
          }
          if ( !newIter.description ) {
            newIter.description = newIter.name;
          }

          newIter.scope = scope || 'system';
          newIter.type  = newIter.type || 'application';

          packages[i] = newIter;
        });
      },

      /**
       * Installs a package by ZIP
       *
       * @function install
       * @memberof OSjs.Core.PackageManager#
       *
       * @param {OSjs.VFS.File}   file        The ZIP file
       * @param {String}          root        Packge install root (defaults to first path)
       * @param {Function}        cb          Callback function
       */
      install: function(file, root, cb) {
        var self = this;
        var paths = OSjs.Core.getSettingsManager().instance('PackageManager').get('PackagePaths', []);
        if ( typeof root !== 'string' ) {
          root = paths[0];
        }

        var dest = Utils.pathJoin(root, file.filename.replace(/\.zip$/i, ''));
        API.call('packages', {command: 'install', args: {zip: file.path, dest: dest, paths: paths}}, function(e, r) {
          if ( e ) {
            cb(e);
          } else {
            self.generateUserMetadata(cb);
          }
        });
      },

      /**
       * Uninstalls given package
       *
       * @function uninstall
       * @memberof OSjs.Core.PackageManager#
       *
       * @param {OSjs.VFS.File}   file        The path
       * @param {Function}        cb          Callback function
       */
      uninstall: function(file, cb) {
        var self = this;
        API.call('packages', {command: 'uninstall', args: {path: file.path}}, function(e, r) {
          if ( e ) {
            cb(e);
          } else {
            self.generateUserMetadata(cb);
          }
        });
      },

      /**
       * Sets the package blacklist
       *
       * @function setBlacklist
       * @memberof OSjs.Core.PackageManager#
       *
       * @param   {String[]}       list        List of package names
       */
      setBlacklist: function(list) {
        blacklist = list || [];
      },

      /**
       * Get a list of packges from online repositories
       *
       * @function getStorePackages
       * @memberof OSjs.Core.PackageManager#
       *
       * @param {Object}    opts      Options
       * @param {Function}  callback  Callback => fn(error, result)
       */
      getStorePackages: function(opts, callback) {
        var sm = OSjs.Core.getSettingsManager();
        var repos = sm.instance('PackageManager').get('Repositories', []);
        var entries = [];

        Utils.asyncs(repos, function(url, idx, next) {
          API.curl({
            url: url,
            method: 'GET'
          }, function(error, result) {
            if ( !error && result.body ) {
              var list = [];
              if ( typeof result.body === 'string' ) {
                try {
                  list = JSON.parse(result.body);
                } catch ( e ) {}
              }

              entries = entries.concat(list.map(function(iter) {
                iter._repository = url;
                return iter;
              }));
            }
            next();
          });
        }, function() {
          callback(false, entries);
        });
      },

      /**
       * Get package by name
       *
       * @function getPackage
       * @memberof OSjs.Core.PackageManager#
       *
       * @param {String}    name      Package name
       *
       * @return {Metadata}
       */
      getPackage: function(name) {
        if ( typeof packages[name] !== 'undefined' ) {
          return Object.freeze(Utils.cloneObject(packages)[name]);
        }
        return false;
      },

      /**
       * Get all packages
       *
       * @function getPackages
       * @memberof OSjs.Core.PackageManager#
       *
       * @param {Boolean}     [filtered=true]      Returns filtered list
       *
       * @return {Metadata[]}
       */
      getPackages: function(filtered) {
        var hidden = OSjs.Core.getSettingsManager().instance('PackageManager').get('Hidden', []);
        var p = Utils.cloneObject(packages);

        function allowed(i, iter) {
          if ( blacklist.indexOf(i) >= 0 ) {
            return false;
          }

          if ( iter && (iter.groups instanceof Array) ) {
            if ( !API.checkPermission(iter.groups) ) {
              return false;
            }
          }

          return true;
        }

        if ( typeof filtered === 'undefined' || filtered === true ) {
          var result = {};
          Object.keys(p).forEach(function(name) {
            var iter = p[name];
            if ( !allowed(name, iter) ) {
              return;
            }
            if ( iter && hidden.indexOf(name) < 0 ) {
              result[name] = iter;
            }
          });

          return Object.freeze(result);
        }

        return Object.freeze(p);
      },

      /**
       * Get packages by Mime support type
       *
       * @function getPackagesByMime
       * @memberof OSjs.Core.PackageManager#
       *
       * @param {String}    mime      MIME string
       *
       * @return  {Metadata[]}
       */
      getPackagesByMime: function(mime) {
        var list = [];
        var p = Utils.cloneObject(packages);

        Object.keys(p).forEach(function(i) {
          if ( blacklist.indexOf(i) < 0 ) {
            var a = p[i];
            if ( a && a.mime ) {
              if ( Utils.checkAcceptMime(mime, a.mime) ) {
                list.push(i);
              }
            }
          }
        });
        return list;
      },

      /**
       * Add a dummy package (useful for having shortcuts in the launcher menu)
       *
       * @function addDummyPackage
       * @memberof OSjs.Core.PackageManager#
       * @throws {Error} On invalid package name or callback
       *
       * @param   {String}      n             Name of your package
       * @param   {String}      title         The display title
       * @param   {String}      icon          The display icon
       * @param   {Function}    fn            The function to run when the package tries to launch
       */
      addDummyPackage: function(n, title, icon, fn) {
        if ( packages[n] || OSjs.Applications[n] ) {
          throw new Error('A package already exists with this name!');
        }
        if ( typeof fn !== 'function' ) {
          throw new TypeError('You need to specify a function/callback!');
        }

        packages[n] = Object.seal({
          _dummy: true,
          type: 'application',
          className: n,
          description: title,
          name: title,
          icon: icon,
          cateogry: 'other',
          scope: 'system'
        });

        OSjs.Applications[n] = fn;
      }
    });
  })();

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get the current PackageManager instance
   *
   * @function getPackageManager
   * @memberof OSjs.Core
   *
   * @return {OSjs.Core.PackageManager}
   */
  OSjs.Core.getPackageManager = function Core_getPackageManager() {
    return PackageManager;
  };

})(OSjs.Utils, OSjs.VFS, OSjs.API);
