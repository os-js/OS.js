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

// TODO: Could use a cleanup after 2.1

import Promise from 'bluebird';
import Authenticator from 'core/authenticator';
import SettingsManager from 'core/settings-manager';
import {cloneObject} from 'utils/misc';
import {_, getLocale} from 'core/locales';
import {getConfig} from 'core/config';
import * as VFS from 'vfs/fs';
import * as FS from 'utils/fs';

import Connection from 'core/connection';

const resolvePreloads = (metadata, pm) => {
  const packageURI = getConfig('Connection.PackageURI');

  const mapIter = (s) => (typeof s === 'string' ? {src: s} : s);

  let additions = [];
  let list = (metadata.preload || []).slice(0).map(mapIter);

  // If this package depends on another package, make sure
  // to load the resources for the related one as well
  if ( metadata.depends instanceof Array ) {
    metadata.depends.forEach((k) => {
      if ( !OSjs.Applications[k] ) {
        const pkg = pm.getPackage(k);
        if ( pkg ) {
          console.info('Using dependency', k);
          additions = additions.concat(pkg.preload.map(mapIter));
        }
      }
    });
  }

  // ... same goes for packages that uses this package
  // as a dependency.
  const pkgs = pm.getPackages(false);
  Object.keys(pkgs).forEach((pn) => {
    const p = pkgs[pn];
    if ( p.type === 'extension' && p.uses === name ) {
      if ( p ) {
        console.info('Using extension', pn);
        additions = additions.concat(p.preload.map(mapIter));
      }
    }
  });

  return additions.concat(list).map((p) => {
    if ( !p.src.match(/^(\/|https?|ftp)/) ) {
      if ( metadata.scope === 'user' ) {
        // For user packages, make sure to load the correct URL
        VFS.url(FS.pathJoin(metadata.path, p.src)).then((url) => {
          p.src = url;
          return true;
        });
      } else {
        p.src = FS.pathJoin(packageURI, metadata.path, p.src);
      }
    }

    return p;
  });
};

/////////////////////////////////////////////////////////////////////////////
// PACKAGE MANAGER
/////////////////////////////////////////////////////////////////////////////

class PackageManager {

  constructor() {
    this.packages = {};
    this.blacklist = [];
  }

  destroy() {
    this.packages = {};
    this.blacklist = [];
  }

  /**
   * Initializes Package Manager
   * @param {Object} [metadata] An initial set of packages
   * @return {Promise<undefined, Error>}
   */
  init(metadata) {
    console.debug('PackageManager::load()', metadata);

    return new Promise((resolve, reject) => {
      const setPackages = metadata ? this.setPackages(metadata) : Promise.resolve();

      setPackages.then(() => {
        return this._loadMetadata().then(() => {
          const len = Object.keys(this.packages).length;
          if ( len ) {
            return resolve(true);
          }
          return reject(new Error(_('ERR_PACKAGE_ENUM_FAILED')));
        }).catch(reject);
      }).catch(reject);
    });
  }

  /**
   * Internal method for loading all package metadata
   * @return {Promise<Boolean, Error>}
   */
  _loadMetadata() {
    const paths = SettingsManager.instance('PackageManager').get('PackagePaths', []);
    return new Promise((resolve, reject) => {
      Connection.request('packages', {command: 'list', args: {paths: paths}}).then((res) => {
        return this.setPackages(res).then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  /**
   * Generates user-installed package metadata (on runtime)
   * @return {Promise<Boolean, Error>}
   */
  generateUserMetadata() {
    const paths = SettingsManager.instance('PackageManager').get('PackagePaths', []);
    return new Promise((resolve, reject) => {
      const cb = () => this._loadMetadata().then(resolve).catch(reject);

      Connection.request('packages', {command: 'cache', args: {action: 'generate', scope: 'user', paths: paths}})
        .then(cb)
        .catch(cb);
    });
  }

  /**
   * Add a list of packages
   *
   * @param   {Object}    result    Package dict (manifest data)
   * @param   {String}    scope     Package scope (system/user)
   */
  _addPackages(result, scope) {
    console.debug('PackageManager::_addPackages()', result);

    const keys = Object.keys(result);
    if ( !keys.length ) {
      return;
    }

    const currLocale = getLocale();

    keys.forEach((i) => {
      const newIter = cloneObject(result[i]);
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

      this.packages[i] = newIter;
    });
  }

  /**
   * Installs a package by ZIP
   *
   * @param {FileMetadata}    file        The ZIP file
   * @param {String}          root        Packge install root (defaults to first path)
   * @return {Promise<Object, Error>}
   */
  install(file, root) {
    const paths = SettingsManager.instance('PackageManager').get('PackagePaths', []);
    if ( typeof root !== 'string' ) {
      root = paths[0];
    }

    const dest = FS.pathJoin(root, file.filename.replace(/\.zip$/i, ''));
    return new Promise((resolve, reject) => {
      Connection.request('packages', {command: 'install', args: {zip: file.path, dest: dest, paths: paths}}).then(() => {
        return this.generateUserMetadata().then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  /**
   * Uninstalls given package
   *
   * @param {FileMetadata}   file        The path
   * @return {Promise<Boolean, Error>}
   */
  uninstall(file) {
    return new Promise((resolve, reject) => {
      Connection.request('packages', {command: 'uninstall', args: {path: file.path}}).then(() => {
        return this.generateUserMetadata().then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  /**
   * Sets the package blacklist
   *
   * @param   {String[]}       list        List of package names
   */
  setBlacklist(list) {
    this.blacklist = list || [];
  }

  /**
   * Get a list of packges from online repositories
   *
   * @param {Object}    opts      Options
   * @return {Promise<Array, Error>}
   */
  getStorePackages(opts) {
    const repos = SettingsManager.instance('PackageManager').get('Repositories', []);

    let entries = [];

    return new Promise((resolve, reject) => {
      Promise.all(repos.map((url) => {
        return new Promise((yes, no) => {
          Connection.request('curl', {
            url: url,
            method: 'GET'
          }).then((result) => {
            let list = [];
            if ( typeof result.body === 'string' ) {
              try {
                list = JSON.parse(result.body);
              } catch ( e ) {}
            }

            entries = entries.concat(list.map((iter) => {
              iter._repository = url;
              return iter;
            }));

            return yes();
          }).catch(no);
        });
      })).then(() => resolve(entries)).catch(reject);
    });
  }

  /**
   * Get package by name
   *
   * @param {String}    name      Package name
   *
   * @return {Object}
   */
  getPackage(name) {
    if ( typeof this.packages[name] !== 'undefined' ) {
      return Object.freeze(cloneObject(this.packages)[name]);
    }
    return false;
  }

  /**
   * Get all packages
   *
   * @param {Boolean}     [filtered=true]      Returns filtered list
   *
   * @return {Object[]}
   */
  getPackages(filtered) {
    const hidden = SettingsManager.instance('PackageManager').get('Hidden', []);
    const p = cloneObject(this.packages);

    const allowed = (iter) => {
      if ( this.blacklist.indexOf(iter.path) >= 0 ) {
        return false;
      }

      if ( iter && (iter.groups instanceof Array) ) {
        if ( !Authenticator.instance().checkPermission(iter.groups) ) {
          return false;
        }
      }

      return true;
    };

    if ( typeof filtered === 'undefined' || filtered === true ) {
      const result = {};
      Object.keys(p).forEach((name) => {
        const iter = p[name];
        if ( !allowed(iter) ) {
          return;
        }
        if ( iter && hidden.indexOf(name) < 0 ) {
          result[name] = iter;
        }
      });

      return Object.freeze(result);
    }

    return Object.freeze(p);
  }

  /**
   * Get packages by Mime support type
   *
   * @param {String}    mime      MIME string
   *
   * @return  {Object[]}
   */
  getPackagesByMime(mime) {
    const list = [];
    const p = cloneObject(this.packages);

    Object.keys(p).forEach((i) => {
      if ( this.blacklist.indexOf(i) < 0 ) {
        const a = p[i];
        if ( a && a.mime ) {
          if ( FS.checkAcceptMime(mime, a.mime) ) {
            list.push(i);
          }
        }
      }
    });
    return list;
  }

  /**
   * Get package resource
   *
   * @param {Process|String}    app       The application (or package name)
   * @param {String}            name      Resource name
   * @param {String}            vfspath   Return a VFS path
   * @return {String}
   */
  getPackageResource(app, name, vfspath) {
    if ( name.match(/^((https?:)|\.)?\//) ) {
      return name;
    }
    name = name.replace(/^\.\//, '');

    const appname = typeof app === 'string' ? app : app.__pname;
    const fsuri = getConfig('Connection.FSURI');
    const pkg = this.getPackage(appname);

    let path = name;
    if ( pkg ) {
      path = pkg.scope === 'user'
        ? '/user-package/' + FS.filename(pkg.path) + '/' + name.replace(/^\//, '')
        : 'packages/' + pkg.path + '/' + name;

      if ( vfspath ) {
        return pkg.scope === 'user'
          ? path.substr(fsuri.length)
          : getConfig('VFS.Dist') + path;
      }
    }

    return path;
  }

  /**
   * Sets the current list of packages
   * @param {Object} res Package map
   * @return {Promise<Boolean, Error>}
   */
  setPackages(res) {
    const packages = {};
    const locale = getLocale();

    const checkEntry = (key, iter, scope) => {
      iter = Object.assign({}, iter);
      iter.type = iter.type || 'application';

      if ( scope ) {
        iter.scope = scope;
      }

      if ( iter.names && iter.names[locale] ) {
        iter.name = iter.names[locale];
      }

      if ( iter.descriptions && iter.descriptions[locale] ) {
        iter.description = iter.descriptions[locale];
      }

      let resolveIcon = () => {
        if ( iter.icon && iter.path ) {
          let packagePath = iter.path.replace(/^\//, '');

          if ( iter.scope === 'user' ) {
            return VFS.url(FS.pathJoin(packagePath, iter.icon));
          } else {
            if ( iter.icon.match(/^\.\//) ) {
              const packageURI = getConfig('Connection.PackageURI').replace(/\/?$/, '/');
              return Promise.resolve(packageURI + packagePath + iter.icon.replace(/^\./, ''));
            }
          }
        }

        return Promise.resolve(iter.icon);
      };

      iter.preload = resolvePreloads(iter, this);
      return new Promise((resolve, reject) => {
        resolveIcon().then((icon) => {
          if ( icon ) {
            iter.icon = icon;
          }

          return resolve(iter);
        }).catch(reject);
      });
    };

    return new Promise((resolve, reject) => {
      const entries = Object.keys(res || {});
      Promise.each(entries, (key) => {
        return new Promise((yes, no) => {
          const iter = res[key];
          if ( iter && !packages[iter.className] ) {
            checkEntry(key, iter).then((pkg) => {
              packages[iter.className] = pkg;
              return yes();
            }).catch(no);
          } else {
            console.warn('No such package', key);
            yes();
          }
        });
      }).catch(reject).then(() => {
        this.packages = packages;
        return resolve();
      });
    });
  }

}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default (new PackageManager());
