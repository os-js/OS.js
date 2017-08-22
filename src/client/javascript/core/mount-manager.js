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

import Promise from 'bluebird';

import Mountpoint from 'vfs/mountpoint';
import {_} from 'core/locales';
import {getConfig} from 'core/config';

function loadTransports() {
  const list = ['web', 'osjs', 'dist', 'applications', 'webdav', 'google-drive', 'onedrive', 'dropbox'];
  const result = {};
  list.forEach((name) => {
    result[name] = require(`vfs/transports/${name}`).default;
  });
  return result;
}

/////////////////////////////////////////////////////////////////////////////
// MOUNT MANAGER
/////////////////////////////////////////////////////////////////////////////

/**
 * Mount Manager Class
 *
 * @desc Class for maintaining mountpoints and handling
 *       requests over to VFS.
 */
class MountManager {

  /**
   * Constructs a new MountManager
   */
  constructor() {
    this.inited = false;
    this.mountpoints = [];
    this.transports = loadTransports();
  }

  /**
   * Initializes MountManager
   *
   * @return {Promise<Boolean, Error>}
   */
  init() {
    if ( this.inited ) {
      return Promise.resolve();
    }

    this.inited = true;

    const config = getConfig('VFS.Mountpoints', {});
    const enabled = Object.keys(config).filter((name) => {
      return config[name].enabled !== false;
    });

    return Promise.each(enabled, (name) => {
      return new Promise((resolve) => {
        const iter = Object.assign({
          name: name,
          dynamic: false
        }, config[name]);

        this.add(iter, true, {
          notify: false
        }).then(resolve).catch((e) => {
          console.warn('Failed to init VFS Mountpoint', name, iter, String(e));
          return resolve(false); // We skip errors on init
        });
      });
    });
  }

  /**
   * Adds a list of mountpoints
   *
   * @param {Mountpoint[]|Object[]} mountPoints Mountpoints
   * @return {Promise<Boolean, Error>}
   */
  addList(mountPoints) {
    return Promise.each(mountPoints, (iter) => this.add(iter));
  }

  /**
   * Adds a mountpoint
   *
   * @param {Mountpoint|Object} point   The mountpoint
   * @param {Boolean}           mount   Mounts the mountpoint
   * @param {Object}            options Mount options
   * @return {Promise<Mountpoint, Error>}
   */
  add(point, mount, options) {

    try {
      if ( !(point instanceof Mountpoint) ) {

        if ( typeof point.transport === 'string' ) {
          const T = this.transports[point.transport];
          if ( !T ) {
            return Promise.reject(new Error('No such transport: ' + point.transport));
          }
          point.transport = new T();
        }

        point = new Mountpoint(point);
      }

      const found = this.mountpoints.filter((m) => {
        if ( m.option('name') === point.option('name') ) {
          return true;
        }
        if ( m.option('root') === point.option('root') ) {
          return true;
        }
        return false;
      });

      if ( found.length ) {
        return Promise.reject(new Error(_('ERR_VFSMODULE_ALREADY_MOUNTED_FMT', point.option('name'))));
      }

      this.mountpoints.push(point);
    } catch ( e ) {
      return Promise.reject(e);
    }

    console.info('Mounting', point);

    return new Promise((resolve, reject) => {
      if ( mount ) {
        point.mount().then(() => {
          return resolve(point);
        }).catch(reject);
      } else {
        resolve(point);
      }
    });
  }

  /**
   * Removes a mountpoint
   *
   * @param {String}      moduleName      Name of the mountpoint
   * @param {Object}      options         Unmount options
   * @return {Promise<Boolean, Error>}
   */
  remove(moduleName, options) {
    const module = this.getModule(moduleName);
    const index = this.getModule(moduleName, true);
    if ( module ) {
      return new Promise((resolve, reject) => {
        module.unmount(options).then((res) => {
          if ( index !== -1 ) {
            this.mountpoints.splice(index, 1);
          }
          return resolve(res);
        }).catch(reject);
      });
    }

    return Promise.reject(new Error(_('ERR_VFSMODULE_NOT_MOUNTED_FMT', moduleName)));
  }

  /**
   * Gets all modules (with filtering)
   *
   * @param {Object} filter The filter
   * @return {Mountpoint[]}
   */
  getModules(filter) {
    filter = Object.assign({}, {
      visible: true,
      special: false
    }, filter);

    return this.mountpoints.filter((mount) => {
      if ( mount.enabled() && mount.option('visible') ) {

        const hits = Object.keys(filter).filter((filterName) => {
          return mount.option(filterName) === filter[filterName];
        });

        return hits.length > 0;
      }

      return false;
    });
  }

  /**
   * Gets a mountpoint from a matching path
   * @param {String} test Path to test
   * @return {Mountpoint}
   */
  getModuleFromPath(test) {
    return this.mountpoints.find((mount) => {
      if ( typeof test === 'string' && mount.enabled() ) {
        if ( mount.option('match') && test.match(mount.option('match')) ) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Gets a mountpoint by name
   * @param {String}  name         Mountpoint name
   * @param {Boolean} [idx=false]  Get index and not the actual mountpoint
   * @return {Mountpoint|Number}
   */
  getModule(name, idx) {
    const m = idx ? 'findIndex' : 'find';
    return this.mountpoints[m]((i) => i.option('name') === name);
  }

  /**
   * Gets a transport by name
   * @param {String}  name   Transport name
   * @return {Mountpoint}
   */
  getTransport(name) {
    return this.transports[name];
  }

}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default (new MountManager());
