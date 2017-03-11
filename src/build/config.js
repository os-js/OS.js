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
const _sjc = require('simplejsonconf');

const _themes = require('./themes.js');
const _metadata = require('./manifest.js');
const _utils = require('./utils.js');
const _logger = _utils.logger;

const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Generates a client-side config file
 */
function generateClientConfiguration(target, cli, cfg) {
  return new Promise((resolve, reject) => {
    let settings = Object.assign({}, cfg.client);

    const preloads = Object.keys(settings.Preloads || {}).map((k) => {
      return settings.Preloads[k];
    });

    if ( !(settings.AutoStart instanceof Array) ) {
      settings.AutoStart = [];
    }

    if ( cli.option('standalone') && target === 'dist' ) {
      settings.Connection.Type = 'standalone';
      settings.VFS.GoogleDrive.Enabled = false;
      settings.VFS.OneDrive.Enabled = false;
      settings.VFS.Dropbox.Enabled = false;
      settings.VFS.LocalStorage.Enabled = false;

      const valid = ['applications', 'home', 'osjs'];
      Object.keys(settings.VFS.Mountpoints).forEach((k) => {
        if ( valid.indexOf(k) === -1 ) {
          delete settings.VFS.Mountpoints[k];
        }
      });
    }

    settings.Broadway = cfg.broadway;

    if ( cfg.broadway.enabled ) {
      preloads.push({
        'type': 'javascript',
        'src': '/vendor/zlib.js'
      });
    }

    _themes.readMetadata(cfg).then((themes) => {
      settings.Fonts.list = themes.fonts.concat(settings.Fonts.list);
      settings.Styles = themes.styles;
      settings.Sounds = _utils.makedict(themes.sounds, (iter) => {
        return [iter.name, iter.title];
      });
      settings.Icons = _utils.makedict(themes.icons, (iter) => {
        return [iter.name, iter.title];
      });

      _metadata.getPackages(cfg.repositories, (pkg) => {
        return pkg && pkg.autostart === true;
      }).then((list) => {
        settings.AutoStart = settings.AutoStart.concat(Object.keys(list).map((k) => {
          return list[k].className;
        }));
        settings.MIME = cfg.mime;
        settings.Preloads = preloads;
        settings.Connection.Dist = target;

        resolve(settings);
      });
    }).catch(reject);
  });
}

/*
 * Generates a server-side config file
 */
function generateServerConfiguration(cli, cfg) {
  let settings = Object.assign({}, cfg.server);

  return new Promise((resolve, reject) => {
    _metadata.getPackages(cfg.repositories, (pkg) => {
      return pkg && pkg.type === 'extension';
    }).then((extensions) => {
      const src = _path.join(ROOT, 'src');
      Object.keys(extensions).forEach((e) => {

        if ( extensions[e].conf && extensions[e].conf instanceof Array ) {
          extensions[e].conf.forEach((c) => {
            try {
              const p = _path.join(src, 'packages', extensions[e].path, c);
              try {
                const s = _fs.readJsonSync(p);
                settings = _utils.mergeObject(settings, s);
              } catch ( e ) {
                _utils.log(_logger.color('Failed reading:', 'yellow'), p);
              }
            } catch ( e ) {
              _logger.warn('createConfigurationFiles()', e, e.stack);
            }
          });
        }
      });

      settings.mimes = cfg.mime.mapping;
      settings.broadway = cfg.broadway;
      settings.vfs.maxuploadsize = cfg.client.VFS.MaxUploadSize;

      resolve(settings);
    });
  });
}

/*
 * Get a configuration value by path
 */
function getConfigPath(config, path, defaultValue) {
  return _sjc.getJSON(config, path, defaultValue);
}

/*
 * Sets a config value
 */
function setConfigPath(key, value, isTree, outputFile) {
  let path = _path.join(ROOT, 'src', 'conf', '900-custom.json');
  if ( outputFile ) {
    const confDir = _path.join(ROOT, 'src', 'conf');
    path = _path.resolve(confDir, outputFile);
  }

  let conf = {};
  try {
    conf = _fs.readJsonSync(path);
  } catch ( e ) {}

  try {
    const result = _sjc.setJSON(conf, isTree ? null : key, value, {
      prune: true,
      guess: true
    });

    _fs.writeFileSync(path, JSON.stringify(result, null, 2));
  } catch ( e ) {
    console.error(e.stack, e);
    return;
  }

  _logger.info('Changes written to: ' + path.replace(ROOT, ''));
  _logger.warn(_logger.color('Remember to run \'osjs build:config\' to update your build(s)...', 'green'));
}

/*
 * Toggles package enable state
 */
function _togglePackage(config, packageName, enable) {
  const currentEnabled = getConfigPath(config, 'packages.ForceEnable') || [];
  const currentDisabled = getConfigPath(config, 'packages.ForceDisable') || [];

  let idx;
  if ( enable ) {
    if ( currentEnabled.indexOf(packageName) < 0 ) {
      currentEnabled.push(packageName);
    }

    idx = currentDisabled.indexOf(packageName);
    if ( idx >= 0 ) {
      currentDisabled.splice(idx, 1);
    }
  } else {
    idx = currentEnabled.indexOf(packageName);
    if ( idx >= 0 ) {
      currentEnabled.splice(idx, 1);
    }

    idx = currentDisabled.indexOf(packageName);
    if ( idx < 0 ) {
      currentDisabled.push(packageName);
    }
  }

  setConfigPath('packages', {
    packages: {
      ForceEnable: currentEnabled,
      ForceDisable: currentDisabled
    }
  }, true);
}

///////////////////////////////////////////////////////////////////////////////
// API
///////////////////////////////////////////////////////////////////////////////

/*
 * Gets currenct configuration(s)
 */
function getConfiguration() {
  const safeWords = [
    '%VERSION%',
    '%DIST%',
    '%DROOT%',
    '%UID%',
    '%USERNAME%'
  ];

  return new Promise((resolve, reject) => {
    const path = _path.join(ROOT, 'src', 'conf');

    let object = {};
    _glob(path + '/*.json').then((files) => {

      files.forEach((file) => {
        try {
          const json = _fs.readJsonSync(file);
          object = _utils.mergeObject(object, json);
        } catch ( e ) {
          _logger.warn('Failed to read JSON file', _path.basename(file), 'Syntax error ?', e);
        }
      });

      // Resolves all "%something%" config entries
      let tmpFile = JSON.stringify(object).replace(/%ROOT%/g, _utils.fixWinPath(ROOT));
      const tmpConfig = JSON.parse(tmpFile);

      const words = tmpFile.match(/%([A-z0-9_\-\.]+)%/g).filter((() => {
        let seen = {};
        return function(element, index, array) {
          return !(element in seen) && (seen[element] = 1);
        };
      })());

      words.forEach((w) => {
        const p = w.replace(/%/g, '');
        const u = /^[A-Z]*$/.test(p);
        if ( safeWords.indexOf(w) === -1 ) {
          const value = (u ? process.env[p] : null) || getConfigPath(tmpConfig, p);
          const re = w.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '$1');
          tmpFile = tmpFile.replace(new RegExp(re, 'g'), String(value));
        }
      });

      resolve(Object.freeze(JSON.parse(tmpFile)));
    }).catch(reject);

  });
}

///////////////////////////////////////////////////////////////////////////////
// TASKS
///////////////////////////////////////////////////////////////////////////////

const TARGETS = {
  client: function(cli, cfg) {
    return _utils.eachp(['dist', 'dist-dev'].map((dist) => {
      return function() {
        return new Promise((resolve, reject) => {
          const src = _path.join(ROOT, 'src', 'templates', 'dist', 'settings.js');
          const tpl = _fs.readFileSync(src).toString();
          const dest = _path.join(ROOT, dist, 'settings.js');

          generateClientConfiguration(dist, cli, cfg).then((settings) => {
            const data = tpl.replace('%CONFIG%', JSON.stringify(settings, null, 4));
            resolve(_fs.writeFileSync(dest, data));
          }).catch(reject);
        });
      };
    }));
  },

  server: function(cli, cfg) {
    return new Promise((resolve, reject) => {
      const dest = _path.join(ROOT, 'src', 'server', 'settings.json');

      generateServerConfiguration(cli, cfg).then((settings) => {
        const data = JSON.stringify(settings, null, 4);
        resolve(_fs.writeFileSync(dest, data));
      }).catch(reject);
    });
  }
};

/*
 * Writes given configuration file(s)
 */
function writeConfiguration(target, cli, cfg) {
  return new Promise((resolve, reject) => {
    if ( TARGETS[target] ) {
      _logger.log('Generating configuration for', target);
      TARGETS[target](cli, cfg).then(resolve).catch(reject);
    } else {
      reject('Invalid target ' + target);
    }
  });
}

/*
 * Gets a configuration option
 */
function getConfig(config, key) {
  let dump = getConfigPath(config, key);
  try {
    dump = JSON.stringify(dump, null, 4);
  } catch ( e ) {}
  return Promise.resolve(dump);
}

/*
 * Sets a configuration option
 */
function setConfig(config, key, value, importFile, outputFile) {
  key = key || '';

  function getNewTree(k, v) {
    let resulted = {};

    if ( k.length ) {
      const queue = k.split(/\./);
      let ns = resulted;
      queue.forEach((k, i) => {
        if ( i >= queue.length - 1 ) {
          ns[k] = v;
        } else {
          if ( typeof ns[k] === 'undefined' ) {
            ns[k] = {};
          }
          ns = ns[k];
        }
      });
    }

    return resulted;
  }

  if ( importFile ) {
    const importJson = _fs.readJsonSync(importFile);
    const importTree = key.length ? getNewTree(key, importJson) : importJson;
    return Promise.resolve(setConfigPath(null, importTree, true));
  }

  if ( typeof value === 'undefined' ) {
    return Promise.resolve(value);
  }

  return Promise.resolve(setConfigPath(key, value, false, outputFile));
}

/*
 * Add a force enable package to config files
 */
function enablePackage(config, name) {
  return Promise.resolve(_togglePackage(config, name, true));
}

/*
 * Add a force disable package to config files
 */
function disablePackage(config, name) {
  return Promise.resolve(_togglePackage(config, name, false));
}

/*
 * Adds a file to an overlay
 */
function addOverlayFile(config, type, path, overlay) {
  const play = 'build.overlays.' + overlay;

  let overlays = getConfigPath(config, 'build.overlays');
  if ( typeof overlays !== 'object' ) {
    overlays = {};
  }

  if ( typeof overlays[overlay] !== 'object' ) {
    overlays[overlay] = {};
  }

  const files = overlays[overlay][type] || [];
  if ( files.indexOf(path) === -1 ) {
    files.push(path);
  }
  overlays[overlay][type] = files;

  setConfigPath('build.overlays', {build: {overlays: overlays}}, true);
  return Promise.resolve(getConfigPath(config, play));
}

/*
 * Add a mountpoint to config files
 */
function addMount(config, name, description, path, transport, ro) {
  if ( typeof transport !== 'string' ) {
    transport = null;
  }

  if ( !path || !name ) {
    return Promise.reject('You have to define a path and name for a mountpoint');
  }

  let iter = path;
  if ( transport || ro ) {
    iter = {destination: path};
    if ( transport ) {
      iter.transport = transport;
    }
    if ( ro ) {
      iter.ro = ro === true;
    }
  }

  let current = getConfigPath(config, 'client.VFS.Mountpoints') || {};
  current[name] = {description: description || name};
  setConfigPath('client.VFS.Mountpoints', {client: {VFS: {Mountpoints: current}}}, true);

  current = getConfigPath(config, 'server.vfs.mounts') || {};
  current[name] = iter;
  setConfigPath('server.vfs.mounts', {server: {vfs: {mounts: current}}}, true);

  return Promise.resolve(getConfigPath(config, 'server.vfs.mounts'));
}

/*
 * Add a preload to config files
 */
function addPreload(config, name, path, type) {
  type = type || 'javascript';

  let current = getConfigPath(config, 'client.Preloads') || {};
  current[name] = {type: type, src: path};

  setConfigPath('client.Preloads', {client: {Preloads: current}}, true);

  return Promise.resolve(getConfigPath(config, 'client.Preloads'));
}

/*
 * Add a repository to config files
 */
function addRepository(config, name) {
  let current = getConfigPath(config, 'repositories') || [];
  if ( current.indexOf(name) === -1 ) {
    current.push(name);
  }
  setConfigPath('repositories', {repositories: current}, true);

  return Promise.resolve(getConfigPath(config, 'repositories'));
}

/*
 * Removes a repository from config files
 */
function removeRepository(config, name) {
  let current = getConfigPath(config, 'repositories') || [];
  let found = current.indexOf(name);
  if ( found >= 0 ) {
    current.splice(found, 1);
  }
  if ( current.length === 1 && current[0] === 'default' ) {
    current = null;
  }

  setConfigPath('repositories', {repositories: current}, true);

  return Promise.resolve(getConfigPath(config, 'repositories'));
}

/*
 * Lists all packages
 */
function listPackages(config) {
  return new Promise((resolve) => {
    _metadata.getPackages(config.repositories, null, true).then((packages) => {
      const currentEnabled = getConfigPath(config, 'packages.ForceEnable') || [];
      const currentDisabled = getConfigPath(config, 'packages.ForceDisable') || [];

      function pl(str, s) {
        if ( str.length > s ) {
          str = str.substr(0, s - 3) + '...';
        }

        while ( str.length <= s ) {
          str += ' ';
        }

        return str;
      }

      if ( packages ) {
        Object.keys(packages).forEach((pn) => {
          const p = packages[pn];

          let es = String(p.enabled) !== 'false';
          let esc = es ? 'green' : 'red';

          if ( es ) {
            if ( !_metadata.checkEnabledState(currentEnabled, currentDisabled, p) ) {
              es = false;
              esc = 'yellow';
            }
          } else {
            if ( _metadata.checkEnabledState(currentEnabled, currentDisabled, p) ) {
              es = true;
              esc = 'blue';
            }
          }

          const prn = pn.split('/', 2)[1];
          const lblenabled = (es ? 'Enabled' : 'Disabled')[esc];
          const lblname = prn[es ? 'white' : 'grey'];
          const lblrepo = p.repo[es ? 'white' : 'grey'];
          const lbltype = p.type[es ? 'white' : 'grey'];

          _logger.log(pl(lblenabled, 20), pl(lblrepo, 30), pl(lbltype, 25), lblname);
        });
      }

      resolve();
    });
  });
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports.getConfiguration = getConfiguration;
module.exports.writeConfiguration = writeConfiguration;
module.exports.getConfigPath = getConfigPath;
module.exports.enablePackage = enablePackage;
module.exports.disablePackage = disablePackage;
module.exports.addOverlayFile = addOverlayFile;
module.exports.addMount = addMount;
module.exports.addPreload = addPreload;
module.exports.addRepository = addRepository;
module.exports.removeRepository = removeRepository;
module.exports.listPackages = listPackages;
module.exports.get = getConfig;
module.exports.set = setConfig;
module.exports._set = setConfigPath;
