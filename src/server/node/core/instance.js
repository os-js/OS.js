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
/*eslint strict:["error", "global"]*/
'use strict';

/**
 * @namespace core.instance
 */

/**
 * An object with information about the current environment
 * @property  {Number}      [port=AUTO]     Which port to start on
 * @property  {String}      [AUTH]          Authentication module name
 * @property  {String}      [STORAGE]       Storage module name
 * @property  {String}      [SESSION]       Session module name
 * @typedef ServerOptions
 */

/**
 * An object with information about the current environment
 * @property  {Number}        PORT        Current port
 * @property  {Number}        LOGLEVEL    Current loglevel
 * @property  {String}        ROOTDIR     Root directory of OS.js
 * @property  {String[]}      MODULEDIR   Directories of server modules
 * @property  {String}        SERVERDIR   Directory of the server root
 * @property  {String}        NODEDIR     Directory of the node server
 * @typedef ServerEnvironment
 */

const _child = require('child_process');
const _fs = require('fs-extra');
const _path = require('path');
const _glob = require('glob-promise');

const _env = require('./env.js');
const _api = require('./api.js');
const _auth = require('./auth.js');
const _vfs = require('./vfs.js');
const _http = require('./http.js');
const _settings = require('./settings.js');
const _storage = require('./storage.js');
const _session = require('./session.js');
const _metadata = require('./metadata.js');
const _middleware = require('./middleware.js');

const _logger = require('./../lib/logger.js');
const _utils = require('./../lib/utils.js');
const _evhandler = require('./../lib/evhandler.js');

///////////////////////////////////////////////////////////////////////////////
// GLOBALS
///////////////////////////////////////////////////////////////////////////////

let CHILDREN = [];
let CONFIG = {};
let PACKAGES = {};
let ENV = {};

///////////////////////////////////////////////////////////////////////////////
// LOADERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Loads generated configuration file
 */
function loadConfiguration(opts) {
  _env.init(opts);

  function _load(resolve, reject) {
    CONFIG = _settings.init(opts);
    ENV = _env.update(CONFIG);
    _logger.init(ENV.LOGLEVEL);

    Object.keys(CONFIG.proxies).forEach((k) => {
      _logger.lognt('INFO', 'Using:', _logger.colored('Proxy', 'bold'), k);
    });

    resolve(opts);
  }

  return new Promise(_load);
}

/*
 * Loads generated package manifest
 */
function registerPackages(servers) {
  const path = _path.join(ENV.SERVERDIR, 'packages.json');
  _logger.lognt('INFO', 'Loading:', _logger.colored('Configuration', 'bold'), path.replace(ENV.ROOTDIR, ''));

  function _createOldInstance(env) {
    return {
      request: null,
      response: null,
      config: CONFIG,
      handler: null,
      logger: _logger
    };
  }

  function _registerApplication(name, packages, module) {
    if ( typeof module.api === 'object' ) {
      if ( typeof module.register === 'function' ) {
        module.register(ENV, packages[name], {
          http: servers.httpServer,
          ws: servers.websocketServer,
          proxy: servers.proxyServer
        });
      }
      return false;
    } else if ( typeof module._onServerStart === 'function' ) {
      // Backward compatible with old API
      module._onServerStart(servers.httpServer, _createOldInstance(ENV), packages[path]);
      return true;
    }

    return typeof module.api === 'undefined';
  }

  function _registerExtension(module) {
    return _api.register(module);
  }

  function _launchSpawners(pn, module, metadata) {
    if ( metadata.spawn && metadata.spawn.enabled ) {
      const rpath = _path.resolve(ENV.ROOTDIR, metadata._src);
      const spawner = _path.join(rpath, metadata.spawn.exec);
      _logger.lognt('INFO', 'Launching', _logger.colored('Spawner', 'bold'), spawner.replace(ENV.ROOTDIR, ''));
      CHILDREN.push(_child.fork(spawner, [], {
        stdio: 'pipe'
      }));
    }
  }

  function _load(resolve, reject) {
    _metadata.load(path).then((packages) => {
      Object.keys(packages).forEach((p) => {
        const metadata = packages[p];
        const filename = _utils.getPackageMainFile(metadata);
        const rpath = _path.resolve(ENV.ROOTDIR, metadata._src);
        const check = _path.join(rpath, filename);

        if ( metadata.enabled !== false && _fs.existsSync(check) ) {
          let deprecated = false;
          if ( metadata.type === 'extension' ) {
            _logger.lognt('INFO', 'Loading:', _logger.colored('Extension', 'bold'), check.replace(ENV.ROOTDIR, ''));
            deprecated = _registerExtension(require(check));
            _launchSpawners(p, module, metadata);
          } else {
            _logger.lognt('INFO', 'Loading:', _logger.colored('Application', 'bold'), check.replace(ENV.ROOTDIR, ''));
            deprecated = _registerApplication(p, packages, require(check));
          }

          if ( deprecated ) {
            _logger.lognt('WARN', _logger.colored('Warning:', 'yellow'), p, _logger.colored('is using the deprecated Application API(s)', 'bold'));
          }
        }
      });

      PACKAGES = Object.freeze(packages);

      resolve(servers);
    }).catch(reject);
  }

  return new Promise(_load);
}

/*
 * Registers Services
 */
function registerServices(servers) {
  return _utils.loadModules(ENV.MODULEDIR, 'services', (path) => {
    _logger.lognt('INFO', 'Loading:', _logger.colored('Service', 'bold'), path.replace(ENV.ROOTDIR, ''));
    try {
      const p = require(path).register(ENV, CONFIG, servers);
      if ( p instanceof Promise ) {
        return p;
      }
    } catch ( e ) {
      _logger.lognt('WARN', _logger.colored('Warning:', 'yellow'), e);
      console.warn(e.stack);
    }
  });
}

/*
 * Sends the destruction signals to all Packages
 */
function destroyPackages() {
  return new Promise((resolve, reject) => {
    const queue = Object.keys(PACKAGES).map((path) => {
      const metadata = PACKAGES[path];
      const rpath = _path.resolve(ENV.ROOTDIR, metadata._src);
      const check = _path.join(rpath, 'api.js');
      if ( _fs.existsSync(check) ) {
        try {
          const mod = require(check);

          _logger.lognt('VERBOSE', 'Destroying:', _logger.colored('Package', 'bold'), check.replace(ENV.ROOTDIR, ''));
          if ( typeof mod.destroy === 'function' ) {
            const res = mod.destroy();
            return res instanceof Promise ? res : Promise.resolve();
          }
        } catch ( e ) {
          _logger.lognt('WARN', _logger.colored('Warning:', 'yellow'), e);
          console.warn(e.stack);
        }
      }

      return Promise.resolve();
    });

    Promise.all(queue).then(resolve).catch(reject);
  });
}

/*
 * Sends the destruction signal to all Services
 */
function destroyServices() {
  return Promise.all(ENV.MODULEDIR.map((d) => {
    return new Promise((resolve, reject) => {
      const dirname = _path.join(d, 'services');
      _glob(_path.join(dirname, '*.js')).then((list) => {
        Promise.all(list.map((path) => {
          _logger.lognt('VERBOSE', 'Destroying:', _logger.colored('Service', 'bold'), path.replace(ENV.ROOTDIR, ''));
          try {
            const res = require(path).destroy();
            return res instanceof Promise ? res : Promise.resolve();
          } catch ( e ) {
            _logger.lognt('WARN', _logger.colored('Warning:', 'yellow'), e);
            console.warn(e.stack);
          }
          return Promise.resolve();
        })).then(resolve).catch(reject);
      }).catch(reject);
    });
  }));
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

/**
 * Destroys the current instance
 *
 * @param {Function}    [cb]      Callback
 *
 * @function destroy
 * @memberof core.instance
 */
module.exports.destroy = (() => {
  let destroyed = false;

  return function destroy(cb) {
    cb = cb || function() {};

    if ( destroyed ) {
      return cb();
    }

    _logger.log('INFO', _logger.colored('Trying to shut down sanely...', 'bold'));

    _evhandler.emit('server:destroy');

    function done() {
      CHILDREN.forEach((c) => {
        if ( c && typeof c.kill === 'function' ) {
          c.kill();
        }
      });

      const auth = _auth.get();
      if ( auth && typeof auth.destroy === 'function' ) {
        auth.destroy();
      }

      const storage = _storage.get();
      if ( storage && typeof storage.destroy === 'function' ) {
        storage.destroy();
      }

      _http.destroy((err) => {
        destroyed = true;

        cb(err);
      });
    }

    destroyServices()
      .then(destroyPackages())
      .then(done).catch(done);
  };
})();

/**
 * Initializes OS.js Server
 *
 * @param   {ServerOptions}   opts           Server Options
 *
 * @function init
 * @memberof core.instance
 * @return {Promise}
 */
module.exports.init = function init(opts) {
  return new Promise((resolve, reject) => {
    _evhandler.emit('server:init');

    loadConfiguration(opts)
      .then((opts) => {
        return new Promise((resolve, reject) => {
          _middleware.load().then(() => {
            resolve(opts);
          }).catch(reject);
        });
      })
      .then(_session.load)
      .then(_api.load)
      .then(_auth.load)
      .then(_storage.load)
      .then(_vfs.load)
      .then(_http.init)
      .then(registerPackages)
      .then(registerServices)
      .then((servers) => {
        resolve(Object.freeze(ENV));
      })
      .catch(reject);
  });
};

/**
 * Runs the OS.js Server
 *
 * @param   {Number}    [port]      Port number to start on
 *
 * @function run
 * @memberof core.instance
 * @return {Promise}
 */
module.exports.run = function run(port) {
  const httpConfig = Object.assign({ws: {}}, CONFIG.http || {});

  _evhandler.emit('server:run');

  _logger.log('INFO', _logger.colored('Starting OS.js server', 'green'));
  _logger.log('INFO', _logger.colored(['Running', httpConfig.mode, 'on localhost:' + ENV.PORT].join(' '), 'green'));

  if ( httpConfig.connection === 'ws' ) {
    const wsp = httpConfig.ws.port === 'upgrade' ? ENV.PORT : httpConfig.ws.port;
    const msg = ['Running ws', 'on localhost:' + wsp + (httpConfig.ws.path || '')];
    _logger.log('INFO', _logger.colored(msg.join(' '), 'green'));
  }

  if ( ENV.DEBUG ) {
    _logger.log('INFO', _logger.colored('Running in debug mode', 'blue'));
  } else {
    _logger.log('INFO', _logger.colored('Running in production mode', 'yellow'));
  }

  const result = _http.run(ENV.PORT);
  _logger.log('INFO', _logger.colored('Ready...', 'green'));

  return result;
};
