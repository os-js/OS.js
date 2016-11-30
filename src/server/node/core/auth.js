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

/**
 * @namespace core.auth
 */

const _instance = require('./instance.js');
const _vfs = require('./vfs.js');

/**
 * Initializes a session
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 *
 * @function initSession
 * @memberof core.auth
 */
module.exports.initSession = function(http) {
  return _instance.getAuth().initSession(http);
};

/**
 * Checks a permission
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {String}           type          Permission type
 * @param   {Object}           [options]     Permission options/arguments
 *
 * @function checkPermission
 * @memberof core.auth
 */
module.exports.checkPermission = function(http, type, options) {
  const config = _instance.getConfig();
  const groups = config.api.groups;
  const username = http.session.get('username');

  function checkApiPermission(userGroups) {
    return new Promise(function(resolve, reject) {
      var checks = [];
      if ( type === 'fs' ) {
        checks = [type];
      } else {
        if ( options.method && typeof groups[options.method] !== 'undefined' ) {
          checks = [groups[options.method]];
        }
      }

      if ( module.exports.hasGroup(userGroups, checks) ) {
        resolve();
      } else {
        reject('Access denied!');
      }
    });
  }

  function checkMountPermission(userGroups) {
    const mountpoints = config.vfs.mounts || {};
    const groups = config.vfs.groups || {};
    function _checkMount(p, d) {
      const parsed = _vfs.parseVirtualPath(p, http);
      const mount = mountpoints[parsed.protocol];
      const map = d ? ['upload', 'write', 'delete', 'copy', 'move', 'mkdir'] : ['upload', 'write', 'delete', 'mkdir'];

      if ( typeof mount === 'object' ) {
        if ( mount.enabled === false || (mount.ro === true && map.indexOf(options.method) !== -1) ) {
          return false;
        }
      }

      if ( groups[parsed.protocol] ) {
        if ( !module.exports.hasGroup(userGroups, groups[parsed.protocol]) ) {
          return false;
        }
      }

      return true;
    }

    function _check() {
      const args = options.args;
      const src = args.path || args.root || args.src || '';

      if ( _checkMount(src) ) {
        if ( typeof args.dest !== 'undefined' ) {
          return _checkMount(args.dest, true);
        }
        return true;
      }

      return false;
    }

    return new Promise(function(resolve, reject) {
      if ( type === 'fs' ) {
        if ( _check() ) {
          resolve();
        } else {
          reject('Access Denied!');
        }
      } else {
        resolve();
      }
    });
  }

  function checkPackagePermission(userGroups) {
    return new Promise(function(resolve, reject) {
      if ( type === 'package' ) {
        _instance.getStorage().getBlacklist(http, username).then(function(blacklist) {
          if ( blacklist && blacklist.indexOf(options.path) !== -1 ) {
            reject('Access Denied!');
          } else {
            resolve();
          }
        }).catch(function() {
          reject('Access Denied!');
        });
      } else {
        resolve();
      }
    });
  }

  return new Promise(function(resolve, reject) {
    _instance.getAuth().checkPermission(http, type, options).then(function(checkGroups) {
      if ( typeof checkGroups === 'undefined' ) {
        checkGroups = true;
      }

      if ( checkGroups ) {
        _instance.getStorage().getGroups(http, username).then(function(userGroups) {
          checkApiPermission(userGroups).then(function() {
            checkMountPermission(userGroups).then(function() {
              checkPackagePermission(userGroups).then(resolve).catch(reject);
            }).catch(reject);
          }).catch(reject);
        }).catch(reject);
      } else {
        resolve();
      }
    }).catch(reject);
  });
}

/**
 * Checks a session
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 *
 * @function checkSession
 * @memberof core.auth
 */
module.exports.checkSession = function(http) {
  return _instance.getAuth().checkSession(http);
};

/**
 * Checks if user has given group(s)
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Array}            userGroups    User groups
 * @param   {String|Array}     groupList     Group(s)
 * @param   {Boolean}          [all=true]    Check if all and not some
 *
 * @function hasGroup
 * @memberof core.auth
 */
module.exports.hasGroup = function(userGroups, groupList, all) {
  if ( !(groupList instanceof Array) || !groupList.length ) {
    return true;
  }

  if ( userGroups.indexOf('admin') !== -1 ) {
    return true;
  }

  if ( !(groupList instanceof Array) ) {
    groupList = [groupList];
  }

  const m = (typeof all === 'undefined' || all) ? 'every' : 'some';
  return groupList[m](function(name) {
    if ( userGroups.indexOf(name) !== -1 ) {
      return true;
    }

    return false;
  });
};
