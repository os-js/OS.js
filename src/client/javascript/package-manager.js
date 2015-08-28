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

(function(Utils, VFS, API) {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};

  var _instance;

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT PACKAGE MANAGER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Package Manager Class
   *
   * For maintaining packages
   *
   * You can only get an instance with `Core.getPackageManager()`
   *
   * @api     OSjs.Core.PackageManager
   * @class
   */
  function PackageManager() {
    var config = API.getDefaultSettings();
    var uri = Utils.checkdir(config.Core.MetadataURI);

    this.packages = {};
    this.uri = uri;
  }

  /**
   * Load Metadata from server and set packages
   *
   * @param  Function callback      callback
   *
   * @return void
   *
   * @method PackageManager::load()
   */
  PackageManager.prototype.load = function(callback) {
    var self = this;
    callback = callback || {};

    console.info('PackageManager::load()');

    this._loadMetadata(function(err) {
      if ( err ) {
        callback(err);
        return;
      }

      var len = Object.keys(self.packages).length;
      if ( len ) {
        callback(true);
        return;
      }
      callback(false, 'No packages found!');
    });
  };

  /**
   * Internal method for loading all package metadata
   *
   * @param  Function callback      callback
   *
   * @return void
   *
   * @method PackageManager::_loadMetadata()
   */
  PackageManager.prototype._loadMetadata = function(callback) {
    var self = this;
    this.packages = {};

    function _loadSystemMetadata(cb) {
      var preload = [{type: 'javascript', src: self.uri}];
      Utils.preload(preload, function(total, errors, failed) {
        if ( errors ) {
          callback('Failed to load package manifest');
          return;
        }
        var packages = OSjs.API.getDefaultPackages();
        self._addPackages(packages, 'system');
        cb();
      });
    }

    function _loadUserMetadata(cb) {
      var path = OSjs.API.getDefaultSettings().Core.UserMetadata;
      var file = new OSjs.VFS.File(path, 'application/json');
      OSjs.VFS.read(file, function(err, resp) {
        resp = OSjs.Utils.fixJSON(resp || '');
        if ( err ) {
          console.warn('Failed to read user package metadata', err);
        } else {
          if ( resp ) {
            self._addPackages(resp, 'user');
          }
        }
        cb();
      }, {type: 'text'});
    }

    _loadSystemMetadata(function(err) {
      if ( err ) {
        callback(err);
        return;
      }

      _loadUserMetadata(function() {
        callback();
      });
    });
  };

  /**
   * Generates user-installed package metadata (on runtime)
   *
   * @param  Function callback      callback
   *
   * @return void
   *
   * @method PackageManager::generateUserMetadata()
   */
  PackageManager.prototype.generateUserMetadata = function(callback) {
    var dir = new OSjs.VFS.File(OSjs.API.getDefaultSettings().Core.UserPackages);
    var found = {};
    var queue = [];
    var self = this;

    console.debug('PackageManager::generateUserMetadata()');

    function _checkDirectory(cb) {
      OSjs.VFS.mkdir(dir, function() {
        cb();
      });
    }

    function _runQueue(cb) {
      console.debug('PackageManager::generateUserMetadata()', '_runQueue()');

      function __handleMetadata(path, meta, cbf) {
        var preloads = meta.preload || [];
        var newpreloads = [];

        preloads.forEach(function(p) {
          var src = path.replace(/package\.json$/, p.src);
          var file = new OSjs.VFS.File(src);

          OSjs.VFS.url(file, function(err, resp) { // NOTE: This only works for internal FIXME
            if ( err || !resp ) { return; }

            newpreloads.push({
              type: p.type,
              src: resp
            });
          });

        });

        meta.path    = OSjs.Utils.filename(path.replace(/\/package\.json$/, ''));
        meta.preload = newpreloads;

        cbf(meta);
      }

      function __next() {
        if ( !queue.length ) {
          cb();
          return;
        }

        var iter = queue.pop();
        var file = new OSjs.VFS.File(iter, 'application/json');
        console.debug('PackageManager::generateUserMetadata()', '_runQueue()', '__next()', queue.length, iter);
        OSjs.VFS.read(file, function(err, resp) {
          resp = OSjs.Utils.fixJSON(resp);
          if ( !err && resp ) {
            __handleMetadata(iter, resp, function(data) {
              console.debug('PackageManager::generateUserMetadata()', 'ADDING PACKAGE', resp);
              found[resp.className] = data;
              __next();
            });
            return;
          }
          __next();
        }, {type: 'text'});
      }

      __next();
    }

    function _enumPackages(cb) {
      console.debug('PackageManager::generateUserMetadata()', '_enumPackages()');

      OSjs.VFS.scandir(dir, function(err, resp) {
        if ( resp && (resp instanceof Array) ) {
          resp.forEach(function(iter) {
            if ( !iter.filename.match(/^\./) && iter.type === 'dir' ) {
              queue.push(Utils.pathJoin(dir.path, iter.filename, 'package.json'));
            }
          });
        }
        _runQueue(cb);
      });
    }

    function _writeMetadata(cb) {
      console.debug('PackageManager::generateUserMetadata()', '_writeMetadata()');

      var file = new OSjs.VFS.File(dir.path + '/packages.json', 'application/json');
      var meta = JSON.stringify(found, null, 4);
      OSjs.VFS.write(file, meta, function() {
        cb();
      });
    }

    _checkDirectory(function() {
      _enumPackages(function() {
        _writeMetadata(function() {
          self._loadMetadata(function() {
            callback();
          });
        });
      });
    });
  };

  /**
   * Add a list of packages
   *
   * @return void
   *
   * @method PackageManager::_addPackages()
   */
  PackageManager.prototype._addPackages = function(result, scope) {
    console.debug('PackageManager::_addPackages()', result);

    var self = this;
    var keys = Object.keys(result);
    if ( !keys.length ) { return; }

    var currLocale = API.getLocale();

    keys.forEach(function(i) {
      var newIter = result[i];
      if ( typeof newIter.names !== 'undefined' ) {
        if ( newIter.names[currLocale] ) {
          newIter.name = newIter.names[currLocale];
        }
      }
      if ( typeof newIter.descriptions !== 'undefined' ) {
        if ( newIter.descriptions[currLocale] ) {
          newIter.description = newIter.descriptions[currLocale];
        }
      }

      if ( !newIter.description ) {
        newIter.description = newIter.name;
      }

      newIter.scope = scope || 'system';
      newIter.type  = newIter.type || 'application';

      self.packages[i] = newIter;
    });
  };

  /**
   * Installs a package by ZIP
   *
   * @param OSjs.VFS.File   file        The ZIP file
   * @param Function        cb          Callback function
   *
   * @return void
   *
   * @method PackageManager::install()
   */
  PackageManager.prototype.install = function(file, cb) {
    var config = API.getDefaultSettings();
    var dest = Utils.pathJoin(config.Core.UserPackages, file.filename.replace(/\.zip$/i, ''));

    VFS.mkdir(new VFS.File(root), function() {
      VFS.exists(new VFS.File(dest), function(error, exists) {
        if ( error ) {
          cb(error);
          return;
        }

        if ( exists ) {
          cb(API._('ERR_PACKAGE_EXISTS'));
          return;
        }

        OSjs.Helpers.ZipArchiver.createInstance({}, function(error, instance) {
          if ( instance ) {
            instance.extract(file, dest, {
              onprogress: function() {
              },
              oncomplete: function() {
                cb();
              }
            });
          }
        });

      });
    });
  };

  /**
   * Get package by name
   *
   * @param String    name      Package name
   *
   * @return Object
   *
   * @method PackageManager::getPackage()
   */
  PackageManager.prototype.getPackage = function(name) {
    if ( typeof this.packages[name] !== 'undefined' ) {
      return this.packages[name];
    }
    return false;
  };

  /**
   * Get all packages
   *
   * @param boolean     filtered      Returns filtered list (default=true)
   *
   * @return Array
   *
   * @method PackageManager::getPackages()
   */
  PackageManager.prototype.getPackages = function(filtered) {
    if ( typeof filtered === 'undefined' || filtered === true ) {
      var pkgs = this.packages;
      var result = {};
      Object.keys(pkgs).filter(function(name) {
        var iter = pkgs[name];
        if ( iter && (iter.groups instanceof Array) ) {
          if ( !API.checkPermission(iter.groups) ) {
            return;
          }
        }
        result[name] = iter;
      });
      return result;
    }

    return this.packages;
  };

  /**
   * Get packages by Mime support type
   *
   * @param String    mime      MIME string
   *
   * @return  Array
   */
  PackageManager.prototype.getPackagesByMime = function(mime) {
    var list = [];
    var self = this;
    Object.keys(this.packages).forEach(function(i) {
      var a = self.packages[i];
      if ( a && a.mime ) {
        if ( Utils.checkAcceptMime(mime, a.mime) ) {
          list.push(i);
        }
      }
    });
    return list;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get the current PackageManager instance
   *
   * @return PackageManager
   * @api OSjs.Core.getPackageManager()
   */
  OSjs.Core.getPackageManager = function() {
    if ( !_instance ) {
      _instance = new PackageManager();
    }
    return _instance;
  };

})(OSjs.Utils, OSjs.VFS, OSjs.API);

