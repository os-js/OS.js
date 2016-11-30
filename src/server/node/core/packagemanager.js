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
/*eslint strict:["error", "global"]*/
'use strict';

const _path = require('path');
const _fs = require('node-fs-extra');
const _unzip = require('unzip');
const _vfs = require('./vfs.js');
const _utils = require('./utils.js');
const _instance = require('./instance.js');

/**
 * @namespace core.packagemanager
 */

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

function getSystemMetadata(http, resolve, reject, args) {
  const env = _instance.getEnvironment();
  const path = _path.join(env.SERVERDIR, 'packages.json');
  _fs.readFile(path, function(e, data) {
    if ( e ) {
      reject(e);
    } else {
      var meta = JSON.parse(data)[env.DIST];
      Object.keys(meta).forEach(function(k) {
        meta[k].scope = 'system';
      });
      resolve(meta);
    }
  });
}

function getUserMetadata(http, resolve, reject, args) {
  const paths = args.paths || [];
  var summed = {};

  _utils.iterate(paths, function(iter, index, next) {
    const path = [iter, 'packages.json'].join('/'); // path.join does not work
    try {
      const args = {
        path: path,
        options: {
          stream: false,
          raw: true
        }
      };

      _vfs._request(http, 'read', args).then(function(res) {
        var meta = JSON.parse(res);
        Object.keys(meta).forEach(function(k) {
          summed[k] = meta[k];
          summed[k].scope = 'user';
        });
        next();
      }).catch(next);
    } catch ( e ) {
      next();
    }
  }, function() {
    resolve(summed);
  });
}

function generateUserMetadata(http, resolve, reject, args) {
  const paths = args.paths || [];
  var summed = {};

  _utils.iterate(paths, function(root, rindex, next) {
    _vfs._request(http, 'scandir', {path: root}).then(function(list) {
      _utils.iterate(list || [], function(liter, lindex, nnext) {
        const dirname = liter.filename;
        if ( liter.type === 'dir' && dirname.substr(0, 1) !== '.' ) {
          const path = [root, dirname, 'metadata.json'].join('/'); // path.join does not work
          const args = {
            path: path,
            options: {
              stream: false,
              raw: true
            }
          };

          _vfs._request(http, 'read', args).then(function(res) {
            if ( res ) {
              var meta = JSON.parse(res);
              meta.path = root + '/' + dirname;
              summed[meta.className] = meta;
            }

            nnext();
          }).catch(nnext);
        } else {
          nnext();
        }
      }, function() {
        const args = {
          data: JSON.stringify(summed),
          path: [root, 'packages.json'].join('/'),
          options: {
            raw: true,
            rawtype: 'utf8'
          }
        };

        _vfs._request(http, 'write', args).then(next).catch(next);
      });
    }).catch(next);
  }, function() {
    resolve(true);
  });
}

/////////////////////////////////////////////////////////////////////////////
// PACKAGE MANAGER
/////////////////////////////////////////////////////////////////////////////

/**
 * Installs given package
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Function}         resolve       Resolves the Promise
 * @param   {Function}         reject        Rejects the Promise
 * @param   {Object}           args          API Call Arguments
 *
 * @param   {String}    args.zip        Package zip path
 * @param   {String}    args.dest       Package destination path
 * @param   {Array}     args.paths      Package paths (for user scope)
 *
 * @function install
 * @memberof core.packagemanager
 */
module.exports.install = function(http, resolve, reject, args) {
  /*eslint new-cap: "warn"*/
  /*eslint new-cap: "off"*/

  function _onerror(e) {
    _vfs._request(http, 'delete', {path: args.dest}).then(function() {
      reject(e);
    }).catch(function() {
      reject(e);
    });
  }

  if ( args.zip && args.dest && args.paths ) {
    _vfs._request(http, 'exists', {
      path: args.dest
    }).then(function() {
      _vfs._request(http, 'mkdir', {
        path: args.dest
      }).then(function() {
        _vfs.createReadStream(http, args.zip).then(function(zipStream) {
          zipStream.pipe(_unzip.Parse()).on('entry', function(entry) {
            _vfs.createWriteStream(http, [args.dest, entry.path].join('/')).then(function(s) {
              entry.pipe(s);
            });
          }).on('finish', function() {
            resolve(true);
          }).on('error', _onerror);
        }).catch(_onerror);

      }).catch(_onerror);
    }).catch(reject);
  } else {
    reject('Invalid install action');
  }
};

/**
 * Uninstalls given package
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Function}         resolve       Resolves the Promise
 * @param   {Function}         reject        Rejects the Promise
 * @param   {Object}           args          API Call Arguments
 *
 * @param   {String}    args.path    Package path
 *
 * @function uninstall
 * @memberof core.packagemanager
 */
module.exports.uninstall = function(http, resolve, reject, args) {
  if ( args.path ) {
    _vfs._request(http, 'delete', {
      path: args.path
    }).then(resolve).catch(reject);
  } else {
    reject('Invalid uninstall action');
  }
};

/**
 * Updates given package
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Function}         resolve       Resolves the Promise
 * @param   {Function}         reject        Rejects the Promise
 * @param   {Object}           args          API Call Arguments
 *
 *
 * @function update
 * @memberof core.packagemanager
 */
module.exports.update = function(http, resolve, reject, args) {
  reject('Unavailable');
};

/**
 * Perform cache action
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Function}         resolve       Resolves the Promise
 * @param   {Function}         reject        Rejects the Promise
 * @param   {Object}           args          API Call Arguments
 *
 * @param   {String}    [args.scope]    Package scope (user, system or null)
 * @param   {Array}     [args.paths]    Package paths (for user scope)
 *
 * @function cache
 * @memberof core.packagemanager
 */
module.exports.cache = function(http, resolve, reject, args) {
  var action = args.action;
  if ( action === 'generate' && args.scope === 'user' ) {
    generateUserMetadata(http, resolve, reject, args);
  } else {
    reject('Unavailable');
  }
};

/**
 * List packages
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Function}         resolve       Resolves the Promise
 * @param   {Function}         reject        Rejects the Promise
 * @param   {Object}           args          API Call Arguments
 *
 * @param   {String}    [args.scope]    Package scope (user, system or null)
 * @param   {Array}     [args.paths]    Package paths (for user scope)
 *
 * @function list
 * @memberof core.packagemanager
 */
module.exports.list = function(http, resolve, reject, args) {
  if ( !args.scope ) {
    getSystemMetadata(http, function(summed) {
      summed = summed || {};

      getUserMetadata(http, function(r) {
        Object.keys(r || {}).forEach(function(k) {
          if ( !summed[k] ) {
            summed[k] = r[k];
          }
        });
        resolve(summed);
      }, reject, args);
    }, reject, args);
  } else if ( args.scope === 'system' ) {
    getSystemMetadata(http, resolve, reject, args);
  } else if ( args.scope === 'user' ) {
    getUserMetadata(http, resolve, reject, args);
  } else {
    reject('Invalid scope');
  }
};

