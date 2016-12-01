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
const _fs = require('node-fs-extra');

const _themes = require('./themes.js');
const _metadata = require('./manifest.js');
const _utils = require('./utils.js');

const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Generates a client-side config file
 */
function generateClientConfiguration(target, cli, cfg) {
  return new Promise(function(resolve, reject) {
    var settings = Object.assign({}, cfg.client);

    const preloads = Object.keys(settings.Preloads || {}).map(function(k) {
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
      Object.keys(settings.VFS.Mountpoints).forEach(function(k) {
        if ( valid.indexOf(k) === -1 ) {
          delete settings.VFS.Mountpoints[k];
        }
      });
    }

    _themes.readMetadata(cfg).then(function(themes) {
      settings.Fonts.list = themes.fonts.concat(settings.Fonts.list);
      settings.Styles = themes.styles;
      settings.Sounds = _utils.makedict(themes.sounds, function(iter) {
        return [iter.name, iter.title];
      });
      settings.Icons = _utils.makedict(themes.icons, function(iter) {
        return [iter.name, iter.title];
      });

      _metadata.getPackages(cfg.repositories, function(pkg) {
        return pkg && pkg.autostart === true;
      }).then(function(list) {
        settings.AutoStart = settings.AutoStart.concat(Object.keys(list).map(function(k) {
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
  var settings = Object.assign({}, cfg.server);

  return new Promise(function(resolve, reject) {
    _metadata.getPackages(cfg.repositories, function(pkg) {
      return pkg && pkg.type === 'extension';
    }).then(function(extensions) {
      const src = _path.join(ROOT, 'src');
      Object.keys(extensions).forEach(function(e) {

        if ( extensions[e].conf && extensions[e].conf instanceof Array ) {
          extensions[e].conf.forEach(function(c) {
            try {
              const p = _path.join(src, 'packages', extensions[e].path, c);
              try {
                const s = JSON.parse(_fs.readFileSync(p));
                settings = _utils.mergeObject(settings, s);
              } catch ( e ) {
                _utils.log(String.color('Failed reading:', 'yellow'), p);
              }
            } catch ( e ) {
              console.warn('createConfigurationFiles()', e, e.stack);
            }
          });
        }
      });

      settings.mimes = cfg.mime.mapping;
      settings.vfs.maxuploadsize = cfg.client.VFS.MaxUploadSize;

      resolve(settings);
    });
  });
}

/*
 * Get a configuration value by path
 */
function getConfigPath(config, path, defaultValue) {
  if ( typeof path === 'string' ) {
    var result = null;
    var ns = config;

    const queue = path.split(/\./);
    queue.forEach(function(k, i) {
      if ( i >= queue.length - 1 ) {
        result = ns[k];
      } else {
        ns = ns[k];
      }
    });

    if ( typeof result === 'undefined' ) {
      return defaultValue;
    }

    return result;
  }

  return config;
}

/*
 * Sets a config value
 */
const setConfigPath = (function() {

  function removeNulls(obj) {
    const isArray = obj instanceof Array;

    for (var k in obj) {
      if ( obj[k] === null ) {
        if ( isArray ) {
          obj.splice(k, 1);
        } else {
          delete obj[k];
        }
      } else if ( typeof obj[k] === 'object') {
        removeNulls(obj[k]);
      }
    }
  }

  function getNewTree(key, value) {
    const queue = key.split(/\./);

    var resulted = {};
    var ns = resulted;

    queue.forEach(function(k, i) {
      if ( i >= queue.length - 1 ) {
        ns[k] = value;
      } else {
        if ( typeof ns[k] === 'undefined' ) {
          ns[k] = {};
        }
        ns = ns[k];
      }
    });

    return resulted;
  }

  function guessValue(value) {
    value = String(value);

    if ( value === 'true' ) {
      return true;
    } else if ( value === 'false' ) {
      return false;
    } else if ( value === 'null' ) {
      return null;
    } else {
      if ( value.match(/^\d+$/) && !value.match(/^0/) ) {
        return parseInt(value, 10);
      } else if ( value.match(/^\d{0,2}(\.\d{0,2}){0,1}$/) ) {
        return parseFloat(value);
      }
    }
    return value;
  }

  return function(key, value, isTree) {
    if ( !isTree ) {
      value = guessValue(value);
    }

    const path = _path.join(ROOT, 'src', 'conf', '900-custom.json');

    var newTree = isTree ? value : getNewTree(key, value);
    var oldTree = {};

    try {
      oldTree = JSON.parse(_fs.readFileSync(path).toString());
    } catch ( e ) {
      oldTree = {};
    }

    var result = _utils.mergeObject(oldTree, newTree);
    removeNulls(result);

    _fs.writeFileSync(path, JSON.stringify(result, null, 2));

    return result;
  };
})();

/*
 * Toggles package enable state
 */
function _togglePackage(config, packageName, enable) {
  const currentEnabled = getConfigPath(config, 'packages.ForceEnable') || [];
  const currentDisabled = getConfigPath(config, 'packages.ForceDisable') || [];

  var idx;
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
  return new Promise(function(resolve, reject) {
    const path = _path.join(ROOT, 'src', 'conf');

    var object = {};
    _glob(path + '/*.json').then(function(files) {

      files.forEach(function(file) {
        const json = JSON.parse(_fs.readFileSync(file));

        try {
          object = _utils.mergeObject(object, json);
        } catch ( e ) {
          console.warn('Failed to read JSON file', _path.basename(file), 'Syntax error ?', e);
        }
      });

      const authenticator = object.authenticator || 'demo';
      const connection = object.connection || 'http';
      const storage = object.storage || 'demo';

      const tmp = JSON.stringify(object).replace(/%ROOT%/g, _utils.fixWinPath(ROOT))
        .replace(/%AUTHENTICATOR%/g, authenticator)
        .replace(/%STORAGE%/g, storage)
        .replace(/%CONNECTION%/g, connection);

      resolve(Object.freeze(JSON.parse(tmp)));
    }).catch(reject);

  });
}

///////////////////////////////////////////////////////////////////////////////
// TASKS
///////////////////////////////////////////////////////////////////////////////

const TARGETS = {
  client: function(cli, cfg) {
    return Promise.all(['dist', 'dist-dev'].map(function(dist) {
      return new Promise(function(resolve, reject) {
        const src = _path.join(ROOT, 'src', 'templates', 'dist', 'settings.js');
        const tpl = _fs.readFileSync(src).toString();
        const dest = _path.join(ROOT, dist, 'settings.js');

        generateClientConfiguration(dist, cli, cfg).then(function(settings) {
          const data = tpl.replace('%CONFIG%', JSON.stringify(settings, null, 4));
          resolve(_fs.writeFileSync(dest, data));
        }).catch(reject);
      });
    }));
  },

  server: function(cli, cfg) {
    return new Promise(function(resolve, reject) {
      const dest = _path.join(ROOT, 'src', 'server', 'settings.json');

      generateServerConfiguration(cli, cfg).then(function(settings) {
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
  return new Promise(function(resolve, reject) {
    if ( TARGETS[target] ) {
      console.log('Generating configuration for', target);
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
  return Promise.resolve(getConfigPath(config, key));
}

/*
 * Sets a configuration option
 */
function setConfig(config, key, value) {
  if ( typeof value === 'undefined' ) {
    return Promise.resolve(value);
  }
  return Promise.resolve(setConfigPath(key, value));
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
 * Add a mountpoint to config files
 */
function addMount(config, name, description, path, transport, ro) {
  if ( typeof transport !== 'string' ) {
    transport = null;
  }

  if ( !path || !name ) {
    return Promise.reject('You have to define a path and name for a mountpoint');
  }

  var iter = path;
  if ( transport || ro ) {
    iter = {destination: path};
    if ( transport ) {
      iter.transport = transport;
    }
    if ( ro ) {
      iter.ro = ro === true;
    }
  }

  var current = getConfigPath(config, 'client.VFS.Mountpoints') || {};
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

  var current = getConfigPath(config, 'client.Preloads') || {};
  current[name] = {type: type, src: path};

  setConfigPath('client.Preloads', {client: {Preloads: current}}, true);

  return Promise.resolve(getConfigPath(config, 'client.Preloads'));
}

/*
 * Add a repository to config files
 */
function addRepository(config, name) {
  var current = getConfigPath(config, 'repositories') || [];
  current.push(name);
  setConfigPath('repositories', {repositories: current}, true);

  return Promise.resolve(getConfigPath(config, 'repositories'));
}

/*
 * Removes a repository from config files
 */
function removeRepository(config, name) {
  var current = getConfigPath(config, 'repositories') || [];
  var found = current.indexOf(name);
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
  return new Promise(function(resolve) {
    _metadata.getPackages(config.repositories).then(function(packages) {
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
        Object.keys(packages).forEach(function(pn) {
          const p = packages[pn];

          var es = p.enabled !== false;
          var esc = es ? 'green' : 'red';

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

          console.log(pl(lblenabled, 20), pl(lblrepo, 30), pl(lbltype, 25), lblname);
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
module.exports.addMount = addMount;
module.exports.addPreload = addPreload;
module.exports.addRepository = addRepository;
module.exports.removeRepository = removeRepository;
module.exports.listPackages = listPackages;
module.exports.get = getConfig;
module.exports.set = setConfig;
