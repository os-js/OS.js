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

/*eslint strict:["error", "global"]*/
'use strict';

const _path = require('path');
const _glob = require('glob-promise');
const _fs = require('fs-extra');

const _config = require('./config.js');
const _utils = require('./utils.js');

const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Parses the preload array(s)
 */
function parsePreloads(iter) {
  if ( typeof iter === 'string' ) {
    let niter = {
      src: iter,
      type: null
    };

    if ( iter.match(/\.js/) ) {
      niter.type = 'javascript';
    } else if ( iter.match(/\.css/) ) {
      niter.type = 'stylesheet';
    } else if ( iter.match(/\.html/) ) {
      niter.type = 'html';
    }

    return niter;
  }

  return iter;
}

///////////////////////////////////////////////////////////////////////////////
// API
///////////////////////////////////////////////////////////////////////////////

/*
 * Checks if package is enabled
 */
function checkEnabledState(enabled, disabled, meta) {
  const name = meta.path;
  const shortName = meta.path.split('/')[1];

  if ( String(meta.enabled) === 'false' ) {
    if ( enabled.indexOf(shortName) !== -1 || enabled.indexOf(name) !== -1 ) {
      return true;
    }
    return false;
  }

  if ( disabled.indexOf(shortName) !== -1 || disabled.indexOf(name) !== -1 ) {
    return false;
  }
  return true;
}

/*
 * Get Package Metadata
 */
function getPackageMetadata(repo, file) {

  return new Promise((resolve, reject) => {
    const name = [repo, _path.basename(_path.dirname(file))].join('/');
    try {
      const meta = _fs.readJsonSync(file);

      meta.type = meta.type || 'application';
      meta.path = name;
      meta.build = meta.build || {};
      meta.repo = repo;
      meta.preload = (meta.preload ? meta.preload : []).map(parsePreloads);

      if ( typeof meta.sources !== 'undefined' ) {
        meta.preload = meta.preload.concat(meta.sources.map(parsePreloads));
      }

      resolve(Object.freeze(meta));
    } catch (e) {
      reject('Error with ' + file + e);
    }
  });
}

/*
 * Get packages from repository
 */
function getRepositoryPackages(repo, all) {
  const path = _path.join(ROOT, 'src/packages', repo);
  const result = {};

  return new Promise((resolve, reject) => {
    _config.getConfiguration().then((cfg) => {
      const forceEnabled = _config.getConfigPath(cfg, 'packages.ForceEnable', []);
      const forceDisabled = _config.getConfigPath(cfg, 'packages.ForceDisable', []);

      _glob(_path.join(path, '*', 'metadata.json')).then((files) => {

        _utils.eachp(files.map((file) => {
          return function() {
            return getPackageMetadata(repo, file);
          };
        }), (meta) => {
          meta = Object.assign({}, meta);
          if ( all || checkEnabledState(forceEnabled, forceDisabled, meta) ) {
            result[meta.path] = meta;
          }
        }).then(() => {
          resolve(result);
        }).catch(reject);

      }).catch(reject);
    }).catch(reject);
  });
}

/*
 * Get all packages (with filter)
 */
function getPackages(repos, filter, all) {
  repos = repos || [];
  filter = filter || function() {
    return true;
  };

  let list = {};
  return new Promise((resolve, reject) => {
    _utils.eachp(repos.map((repo) => {
      return function() {
        return getRepositoryPackages(repo, all);
      };
    }), (packages) => {
      list = Object.assign(list, packages);
    }).then(() => {
      const result = {};
      Object.keys(list).forEach((k) => {
        if ( filter(list[k]) ) {
          result[k] = list[k];
        }
      });

      resolve(result);
    }).catch(reject);
  });
}

/*
 * Generates a client-side manifest file
 */
function generateClientManifest(manifest) {
  return new Promise((resolve, reject) => {
    const dest = _path.join(ROOT, 'dist', 'packages.js');

    let tpl = _fs.readFileSync(_path.join(ROOT, 'src/templates/dist/packages.js'));
    tpl = tpl.toString().replace('%PACKAGES%', JSON.stringify(manifest, null, 4));

    _fs.writeFile(dest, tpl, (err) => {
      /*eslint no-unused-expressions: "off"*/
      err ? reject(err) : resolve();
    });
  });
}

///////////////////////////////////////////////////////////////////////////////
// API
///////////////////////////////////////////////////////////////////////////////

/*
 * Gets a package manifest by name
 */
function getPackage(name) {
  const file = _path.join(ROOT, 'src/packages', name, 'metadata.json');
  const repo = file.split('/')[0];
  return getPackageMetadata(repo, file);
}

/*
 * Combines preload files
 */
function combinePreloads(manifest) {
  let pcss = false;
  let pjs  = false;
  let preload = [];

  manifest.preload.forEach((p) => {
    if ( p.combine === false || p.src.match(/^(ftp|https?\:)?\/\//) ) {
      preload.push(p);
      return;
    }

    if ( p.type === 'javascript' ) {
      if ( !pjs ) {
        preload.push({type: 'javascript', src: '_app.min.js'});
      }
      pjs = true;
    } else if ( p.type === 'stylesheet' ) {
      if ( !pcss ) {
        preload.push({type: 'stylesheet', src: '_app.min.css'});
      }
      pcss = true;
    } else {
      preload.push(p);
    }
  });

  return preload;
}

/*
 * Parses a client manifest
 */
function mutateClientManifest(packages) {
  packages = JSON.parse(JSON.stringify(packages));

  Object.keys(packages).forEach((p) => {
    packages[p].preload = combinePreloads(packages[p]);

    if ( packages[p].build ) {
      delete packages[p].build;
    }

    if ( typeof packages[p].enabled !== 'undefined' ) {
      delete packages[p].enabled;
    }

    if ( packages[p].type === 'service' ) {
      packages[p].singular = true;
    }

  });

  return packages;
}

///////////////////////////////////////////////////////////////////////////////
// TASKS
///////////////////////////////////////////////////////////////////////////////

function createClientManifest(cli, cfg) {
  return new Promise((resolve, reject) => {
    getPackages(cfg.repositories).then((packages) => {
      packages = mutateClientManifest(packages);

      generateClientManifest(packages).then(resolve).catch(reject);
    });
  });
}

function createServerManifest(cli, cfg) {
  return new Promise((resolve, reject) => {
    const dest = _path.join(ROOT, 'src', 'server', 'packages.json');

    getPackages(cfg.repositories).then((packages) => {
      const meta = mutateClientManifest(packages);

      _fs.writeFile(dest, JSON.stringify(meta, null, 4), (err) => {
        err ? reject(err) : resolve();
      });
    });
  });
}

/*
 * Writes the given manifest file(s)
 */
function writeManifest(cli, cfg) {
  return new Promise((resolve, reject) => {

    createClientManifest(cli, cfg).then(() => {
      createServerManifest(cli, cfg).then(resolve).catch(reject);
    }).catch(reject);
  });
}

/*
 * Cleans up build files
 */
function cleanFiles() {
  _utils.removeSilent(_path.join(ROOT, 'dist', 'packages.js'));
  _utils.removeSilent(_path.join(ROOT, 'src', 'server', 'packages.json'));
  return Promise.resolve();
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports.getPackages = getPackages;
module.exports.getPackage = getPackage;
module.exports.writeManifest = writeManifest;
module.exports.combinePreloads = combinePreloads;
module.exports.checkEnabledState = checkEnabledState;
module.exports.clean = cleanFiles;
