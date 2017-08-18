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
const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob-promise');
const unzip = require('unzip-stream');

const Settings = require('./settings.js');
const VFS = require('./vfs.js');

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

const readManifestFile = (filename, scope) => {
  return new Promise((resolve, reject) => {
    fs.readJson(filename).then((json) => {
      Object.keys(json).forEach((k) => {
        json[k].scope = scope;
      });
      return resolve(json);
    }).catch(reject);
  });
};

const getSystemMetadata = () => {
  const filename = path.resolve(Settings.option('SERVERDIR'), 'packages.json');
  return readManifestFile(filename, 'system');
};

const traversePackageDirectory = (fake, real) => {
  const packages = [];

  const readMetadata = (filename) => {
    return new Promise((yes, no) => {
      fs.readJson(filename).then((json) => {
        json.path = fake + '/' + path.basename(path.dirname(filename));
        return yes(packages.push(json));
      }).catch(no);
    });
  };

  const promise = new Promise((resolve, reject) => {
    glob(path.join(real, '*/metadata.json')).then((files) => {
      return Promise.all(files.map((filename) => readMetadata(filename)))
        .then(resolve).catch(reject);
    }).catch(reject);
  });

  return new Promise((resolve, reject) => {
    promise.then(() => {
      const result = {};

      packages.filter((p) => !!p).forEach((p) => {
        result[p.className] = p;
      });

      resolve(result);
    }).catch(reject);
  });
};

const generateUserMetadata = (username, paths) => {
  return new Promise((resolve, reject) => {
    let result = {};

    Promise.each(paths, (p) => {
      try {
        const parsed = VFS.parseVirtualPath(p, {username});
        return new Promise((yes, no) => {
          traversePackageDirectory(p, parsed.real).then((packages) => {
            result = Object.assign(result, packages);
            return yes();
          }).catch(no);
        });
      } catch ( e ) {
        return Promise.reject('Failed to read user packages');
      }
    }).then(() => {
      const dest = 'home:///.packages/packages.json';
      const parsed = VFS.parseVirtualPath(dest, {username});
      fs.writeJson(parsed.real, result).then(resolve).catch(reject);
      return resolve(result);
    }).catch(reject);
  });
};

const getUserMetadata = (username, paths) => {
  return new Promise((resolve, reject) => {
    let result = {};

    Promise.each(paths, (p) => {
      const filename = [p, 'packages.json'].join('/'); // path.join does not work
      try {
        const parsed = VFS.parseVirtualPath(filename, {username: username});
        return new Promise((yes, no) => {
          fs.stat(parsed.real, (err, stat) => {
            if ( err || stat.isDirectory() ) {
              return yes({});
            }

            return readManifestFile(parsed.real, 'user').then((json) => {
              result = Object.assign(result, json);
              return yes(json);
            }).catch(no);
          });
        });
      } catch ( e ) {
        return Promise.reject('Failed to parse user manifest');
      }
    }).then(() => {
      return resolve(result);
    }).catch((e) => {
      console.warn(e);
      resolve(result);
    });
  });
};

const installFromZip = (username, args) => {
  return new Promise((resolve, reject) => {
    VFS.createReadStream(args.zip, {username}).then((zipStream) => {
      /*eslint new-cap: "off"*/
      zipStream.pipe(unzip.Parse()).on('entry', (entry) => {
        const target = [args.dest, entry.path].join('/');
        const targetParent = entry.type === 'Directory' ? target : path.dirname(target);
        const targetRealParent = VFS.parseVirtualPath(targetParent, {username}).real;

        try {
          if ( !fs.existsSync(targetRealParent) ) {
            fs.mkdirSync(targetRealParent);
          }
        } catch ( e  ) {
          console.warn(e);
        }

        VFS.createWriteStream(target, {username}).then((writeStream) => {
          return entry.pipe(writeStream);
        }).catch((e) => {
          console.warn(e);
          entry.autodrain();
        });
      }).on('finish', () => {
        resolve(true);
      }).on('error', reject);
    }).catch(reject);
  });
};

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

/**
 * Installs a package
 *
 * @param {User} user The user
 * @param {Object} args Arguments
 * @param {String} args.zip Zip file virtual path
 * @param {String} args.dest Destination virtual path
 * @param {Boolean} [args.overwrite=false] Overwrite previously installed
 * @return {Promise<Boolean, Error>}
 */
module.exports.install = function(user, args) {
  // FIXME: Make totally async
  if ( args.zip && args.dest && args.paths ) {
    return new Promise((resolve, reject) => {
      try {
        const overwrite =  args.overwrite !== false;
        const realDst = VFS.parseVirtualPath(args.dest, user).real;

        const onError = (err) => {
          if ( realDst ) {
            try {
              fs.removeSync(realDst);
            } catch (e) {
              console.warn(e);
            }
          }
          return reject(err);
        };

        const exists = fs.existsSync(realDst);
        if ( exists && !overwrite ) {
          reject('Package already installed');
        } else {
          if ( !exists ) {
            fs.mkdirSync(realDst);
          }

          installFromZip(user.username, args).then(resolve).catch(onError);
        }
      } catch ( e ) {
        reject(e);
      }
    });
  }

  return Promise.reject('Not enough arguments');
};

/**
 * Uninstalls a package
 *
 * @param {User} user The user
 * @param {Object} args Arguments
 * @param {String} args.path Path tot the package
 * @return {Promise<Boolean, Error>}
 */
module.exports.uninstall = function(user, args) {
  if ( !args.path ) {
    return Promise.reject('Missing path');
  }

  let result = Promise.reject('Uninstallation failed');

  try {
    const parsed = VFS.parseVirtualPath(args.path, user);
    result = fs.remove(parsed.real);
  } catch ( e ) {
    result = Promise.reject(e);
  }

  return result;
};

module.exports.update = function() {
  return Promise.reject('Not yet implemented');
};

/**
 * Perform an action on the cache
 *
 * @param {User} user The user
 * @param {Object} args Arguments
 * @param {String} args.action Action
 * @param {String} args.scope Action scope
 * @return {Promise<*, Error>}
 */
module.exports.cache = function(user, args) {
  if ( args.action === 'generate' ) {
    if ( args.scope === 'user' ) {
      return generateUserMetadata(user.username, args.paths);
    }
  }

  return Promise.reject('Not available');
};

/**
 * List all packages (local + global)
 *
 * @param {User} user The user
 * @param {Object} args Arguments
 * @param {String[]} args.paths User package paths
 * @return {Promise<Object, Error>}
 */
module.exports.list = function(user, args) {
  return new Promise((resolve, reject) => {
    const paths = args.paths;

    getSystemMetadata().then((systemMeta) => {
      return getUserMetadata(user.username, paths).then((userMeta) => {
        return resolve(Object.assign({}, userMeta, systemMeta));
      }).catch(reject);
    }).catch(reject);
  });
};
