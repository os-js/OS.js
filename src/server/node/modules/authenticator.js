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
const Settings = require('./../settings.js');
const VFS = require('./../vfs.js');
const User = require('./../user.js');

/**
 * Base Authenticator Class
 */
class Authenticator {

  /**
   * Registers the module
   * @param {Object} config Configuration
   * @return {Promise<Boolean, Error>}
   */
  register(config) {
    return Promise.resolve(true);
  }

  /**
   * Destroys the module
   * @return {Promise<Boolean, Error>}
   */
  destroy() {
    return Promise.resolve(true);
  }

  /**
   * Login API request
   * @param {Object} data Login data
   * @return {Promise<Boolean, Error>}
   */
  login(data) {
    return Promise.reject(new Error('Not implemented'));
  }

  /**
   * Logout API request
   * @return {Promise<Boolean, Error>}
   */
  logout() {
    return Promise.resolve(true);
  }

  /**
   * Manage API request
   * @param {String} command The manage command
   * @param {Object} args Command arguments
   * @return {Promise<Boolean, Error>}
   */
  manage(command, args) {
    return Promise.reject(new Error('Not implemented'));
  }

  /**
   * Gets the Manager
   * @return {Object}
   */
  manager() {
    return null;
  }

  /**
   * Checks for given permission
   * @param {ServerObject} http The HTTP object
   * @param {String} type The group
   * @param {Object} [options] Options
   * @return {Promise<Boolean, Error>}
   */
  checkPermission(http, type, options) {
    options = options || {};

    return new Promise((resolve, reject) => {
      this.checkSession(http).then((user) => {
        // Only check types that are defined in the map
        const maps = Settings.get('api.groups');
        if ( typeof maps[type] !== 'undefined' ) {
          type = maps[type];
        } else {
          if ( type !== 'fs' ) {
            resolve(user);
            return true;
          }
        }

        const found = user.hasGroup([type]);

        if ( found ) {
          if ( type === 'fs' ) {
            this.checkFilesystemPermission(user, options.src, options.dest, options.method)
              .then((result) => {
                if ( result ) {
                  return resolve(user);
                } else {
                  return reject('Permission denied for: ' + type + ', ' + options.method);
                }
              }).catch(reject);

            return true;
          }
        } else {
          return reject('Permission denied for: ' + type);
        }

        return resolve(user);
      }).catch(reject);
    });
  }

  /**
   * Checks for given filesystem permission
   * @param {User} user The user making the request
   * @param {String} src Source file path
   * @param {String} [dest] Destination file path
   * @param {String} method The VFS method
   * @return {Promise<Boolean, Error>}
   */
  checkFilesystemPermission(user, src, dest, method) {
    const mountpoints = Settings.get('vfs.mounts') || {};
    const groups = Settings.get('vfs.groups') || {};

    const _checkMount = (p, d) => {
      const parsed = VFS.parseVirtualPath(p, user);
      const mount = mountpoints[parsed.protocol];
      const map = d ? ['upload', 'write', 'delete', 'copy', 'move', 'mkdir'] : ['upload', 'write', 'delete', 'mkdir'];

      if ( typeof mount === 'object' ) {
        if ( mount.enabled === false || (mount.ro === true && map.indexOf(method) !== -1) ) {
          return false;
        }
      }

      if ( groups[parsed.protocol] ) {
        if ( !user.hasGroup(groups[parsed.protocol]) ) {
          return false;
        }
      }

      return true;
    };

    return new Promise((resolve, reject) => {
      const srcCheck = src ? _checkMount(src, false) : true;
      const dstCheck = dest ? _checkMount(dest, true) : true;

      return resolve(srcCheck && dstCheck);
    });

  }

  /**
   * Checks if user has permission to package
   * @param {User} user The user making the request
   * @param {String} name Package name
   * @return {Promise<Boolean, Error>}
   */
  checkPackagePermission(user, name) {
    return new Promise((resolve, reject) => {
      this.getBlacklist(user).then((blacklist) => {
        return blacklist.indexOf(name) === -1 ? resolve(true) : reject('Blacklisted package');
      }).catch(reject);
    });
  }

  /**
   * Checks if user has session
   * @param {ServerObject} http The HTTP object
   * @return {Promise<Boolean, Error>}
   */
  checkSession(http) {
    return new Promise((resolve, reject) => {
      this.getUserFromRequest(http).then((user) => {
        if ( user ) {
          return resolve(user);
        }
        return reject('You have no OS.js Session, please log in!');
      }).catch((err) => {
        console.warn(err);
        reject('You have no OS.js Session, please log in!');
      });
    });
  }

  /**
   * Gets the current user from given Http request
   * @param {ServerObject} http The HTTP object
   * @return {Promise<User, Error>}
   */
  getUserFromRequest(http) {
    const uid = http.session.get('uid');
    const username = http.session.get('username');
    return Promise.resolve(new User(uid, username));
  }

  /**
   * Gets package blacklists of a user
   * @param {User} user The user making the request
   * @return {Promise<Array, Error>}
   */
  getBlacklist(user) {
    return Promise.resolve([]);
  }

  /**
   * Sets package blacklists of a user
   * @param {User} user The user making the request
   * @param {Array} list The blacklist
   * @return {Promise<Boolean, Error>}
   */
  setBlacklist(user, list) {
    return Promise.resolve(true);
  }

}

module.exports = Authenticator;
