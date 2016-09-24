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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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
(function(_path, _fs, _unzip, _vfs) {
  'use strict';

  /**
   * @namespace PackageManager
   */

  function que(queue, onentry, ondone) {
    (function next(idx) {
      if ( idx >= queue.length ) {
        return ondone(false);
      }
      onentry(queue[idx], function() {
        next(idx + 1);
      });
    })(0);
  }

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function getSystemMetadata(server, cb) {
    var path = _path.join(server.config._cfgdir, 'packages.json');
    _fs.readFile(path, function(e, data) {
      if ( e ) {
        cb(e);
      } else {
        var meta = JSON.parse(data)[server.config._env];
        Object.keys(meta).forEach(function(k) {
          meta[k].scope = 'system';
        });
        cb(false, meta);
      }
    });
  }

  function getUserMetadata(server, paths, cb) {
    paths = paths || [];

    var summed = {};
    que(paths, function(iter, next) {
      var path = [iter, 'packages.json'].join('/'); // path.join does not work
      try {
        _vfs.read(server, {path: path, options: {raw: true}}, function(err, res) {
          if ( !err && res ) {
            try {
              var meta = JSON.parse(res);
              Object.keys(meta).forEach(function(k) {
                summed[k] = meta[k];
                summed[k].scope = 'user';
              });
            } catch ( e ) {
              // TODO: Log!
            }
          }
          next();
        });
      } catch ( e ) {
        next();
      }
    }, function() {
      cb(false, summed);
    });
  }

  function generateUserMetadata(server, paths, cb) {
    paths = paths || [];

    que(paths, function(root, next) {
      _vfs.scandir(server, {path: root}, function(err, list) {
        var summed = {};

        que(list || [], function(liter, nnext) {
          var dirname = liter.filename;

          if ( liter.type === 'dir' && dirname.substr(0, 1) !== '.' ) {
            var path = [root, dirname, 'metadata.json'].join('/'); // path.join does not work
            _vfs.read(server, {path: path, options: {raw: true}}, function(err, res) {
              if ( !err && res ) {
                var meta = JSON.parse(res);
                meta.path = root + '/' + dirname;
                summed[meta.className] = meta;
              }
              nnext();
            });
          } else {
            nnext();
          }
        }, function() {
          var path = [root, 'packages.json'].join('/'); // path.join does not work
          var data = JSON.stringify(summed);
          var realPath = _vfs.getRealPath(server, path);

          _fs.writeFile(realPath.root, data, function(err) {
            next();
          });
        });
      });
    }, function() {
      cb(false, true);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // PACKAGE MANAGER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Installs given package
   *
   * @param   {Object}    server          Server object
   * @param   {Object}    args            API Call Arguments
   * @param   {String}    args.zip        Package zip path
   * @param   {String}    args.dest       Package destination path
   * @param   {Array}     args.paths      Package paths (for user scope)
   * @param   {Function}  callback        Callback function => fn(error, result)
   *
   * @function install
   * @memberof PackageManager
   */
  module.exports.install = function(server, args, cb) {
    /*eslint new-cap: "warn"*/

    function _onerror(root, e) {
      _fs.remove(root, function() {
        cb(e);
      });
    }

    if ( args.zip && args.dest && args.paths ) {
      var destPath = _vfs.getRealPath(server, args.dest);
      var zipPath = _vfs.getRealPath(server, args.zip);

      _fs.exists(destPath.root, function(exists) {
        if ( exists ) {
          cb('Package is already installed');
          return;
        }

        _fs.mkdir(destPath.root, function() {
          /*eslint new-cap: "off"*/
          try {
            _fs.createReadStream(zipPath.root).pipe(_unzip.Extract({
              path: destPath.root
            })).on('finish', function() {
              cb(false, true);
            }).on('error', function(e) {
              _onerror(destPath.root, 'Error occured while unzipping: ' + e);
            });
          } catch ( e ) {
            _onerror(destPath.root, 'Exception occured while unzipping: ' + e);
          }
        });
      });

      return;
    }
    cb('Invalid install action');
  };

  /**
   * Uninstalls given package
   *
   * @param   {Object}    server          Server object
   * @param   {Object}    args            API Call Arguments
   * @param   {Function}  callback        Callback function => fn(error, result)
   *
   * @function uninstall
   * @memberof PackageManager
   */
  module.exports.uninstall = function(server, args, cb) {
    if ( args.path ) {
      var destPath = _vfs.getRealPath(server, args.path);
      _fs.remove(destPath.root, function(e) {
        cb(e ? e : false, !e);
      });
    } else {
      cb('Invalid uninstall action');
    }
  };

  /**
   * Updates given package
   *
   * @param   {Object}    server          Server object
   * @param   {Object}    args            API Call Arguments
   * @param   {Function}  callback        Callback function => fn(error, result)
   *
   * @function update
   * @memberof PackageManager
   */
  module.exports.update = function(server, args, cb) {
    cb('Unavailable');
  };

  /**
   * Perform cache action
   *
   * @param   {Object}    server          Server object
   * @param   {Object}    args            API Call Arguments
   * @param   {String}    [args.scope]    Package scope (user, system or null)
   * @param   {Array}     [args.paths]    Package paths (for user scope)
   * @param   {Function}  callback        Callback function => fn(error, result)
   *
   * @function cache
   * @memberof PackageManager
   */
  module.exports.cache = function(server, args, cb) {
    var action = args.action;
    if ( action === 'generate' && args.scope === 'user' ) {
      generateUserMetadata(server, args.paths, cb);
    } else {
      cb('Unavailable');
    }
  };

  /**
   * List packages
   *
   * @param   {Object}    server          Server object
   * @param   {Object}    args            API Call Arguments
   * @param   {String}    [args.scope]    Package scope (user, system or null)
   * @param   {Array}     [args.paths]    Package paths (for user scope)
   * @param   {Function}  callback        Callback function => fn(error, result)
   *
   * @function list
   * @memberof PackageManager
   */
  module.exports.list = function(server, args, cb) {
    if ( !args.scope ) {
      getSystemMetadata(server, function(e, r) {
        var summed = r || {};
        getUserMetadata(server, args.paths, function(e, r) {
          Object.keys(r || {}).forEach(function(k) {
            if ( !summed[k] ) {
              summed[k] = r[k];
            }
          });
          cb(false, summed);
        });
      });
    } else if ( args.scope === 'system' ) {
      getSystemMetadata(server, cb);
    } else if ( args.scope === 'user' ) {
      getUserMetadata(server, args.paths, cb);
    } else {
      cb('Invalid scope');
    }
  };

})(require('path'), require('node-fs-extra'), require('unzip'), require('./vfs.js'));
