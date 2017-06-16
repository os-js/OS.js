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
const _fs = require('fs-extra');
const _glob = require('glob');

const _config = require('./config.js');
const _manifest = require('./manifest.js');
const _themes = require('./themes.js');
const _packages = require('./packages.js');
const _core = require('./core.js');
const _dist = require('./dist.js');
const _generate = require('./generate.js');
const _utils = require('./utils.js');
const _watcher = require('./watcher.js');
const _logger = _utils.logger;

const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Iterates all given tasks
 */
function _eachTask(cli, args, taskName, namespace) {
  if ( !args ) {
    return Promise.reject('Not enough arguments');
  }

  return new Promise((resolve, reject) => {
    _config.getConfiguration().then((cfg) => {
      _utils.eachp(args.replace(/\s/, '').split(',').map((iter) => {
        return function() {
          iter = (iter || '').replace('-', '_');
          if ( typeof namespace === 'function' ) {
            return namespace(cli, cfg, iter);
          } else {
            if ( namespace[iter] ) {
              let msg = _logger.color([taskName, iter].join(':'), 'green');
              if ( cli.option('debug') ) {
                msg += ' (' + _logger.color('debug mode', 'blue') + ')';
              }

              _logger.log(_logger.color('Running task:', 'bold'), msg);

              return namespace[iter](cli, cfg);
            }
          }

          return Promise.reject('Invalid task: ' + iter);
        };
      })).then(resolve).catch(reject);
    }).catch(reject);
  });
}

///////////////////////////////////////////////////////////////////////////////
// TASKS
///////////////////////////////////////////////////////////////////////////////

const TASKS = {
  build: {
    config: function(cli, cfg) {
      return _config.writeConfiguration(cli, cfg);
    },

    core: function(cli, cfg) {
      return _core.buildFiles(cli, cfg);
    },

    dist: function(cli, cfg) {
      return _dist.buildFiles(cli, cfg);
    },

    theme: function(cli, cfg) {
      const targets = [
        [cli.option('style'), _themes.buildStyle],
        [cli.option('icons'), _themes.buildIcon],
        [cli.option('static'), _themes.buildStatic],
        [cli.option('fonts'), _themes.buildFonts],
        [cli.option('sounds'), _themes.buildSounds]
      ];

      const list = targets.filter((iter) => {
        return iter && iter[0];
      }).map((iter) => {
        return iter[1](cli, cfg, iter[0]);
      });

      return Promise.all(list);
    },

    themes: function(cli, cfg) {
      return _themes.buildAll(cli, cfg);
    },

    manifest: function(cli, cfg) {
      return _manifest.writeManifest(cli, cfg);
    },

    package: function(cli, cfg) {
      const name = cli.option('name');
      if ( !name || name.indexOf('/') === -1 ) {
        throw new Error('Invalid package name');
      }

      return _packages.buildPackage(cli, cfg, name);
    },

    packages: function(cli, cfg) {
      return _packages.buildPackages(cli, cfg);
    }
  },

  config: {
    set: function(cli, cfg) {
      return _config.set(cfg, cli.option('name'), cli.option('value'), cli.option('import'), cli.option('out'));
    },
    get: function(cli, cfg) {
      return _config.get(cfg, cli.option('name'));
    },
    add_mount: function(cli, cfg) {
      return _config.addMount(cfg, cli.option('name'), cli.option('description') || cli.option('desc'), cli.option('path'), cli.option('transport'), cli.option('ro'));
    },
    add_preload: function(cli, cfg) {
      return _config.addPreload(cfg, cli.option('name'), cli.option('path'), cli.option('type'));
    },
    add_repository: function(cli, cfg) {
      return _config.addRepository(cfg, cli.option('name'));
    },
    add_script: function(cli, cfg) {
      return _config.addOverlayFile(cfg, 'javascript', cli.option('path'), cli.option('overlay', 'custom'));
    },
    add_style: function(cli, cfg) {
      return _config.addOverlayFile(cfg, 'stylesheets', cli.option('path'), cli.option('overlay', 'custom'));
    },
    add_locale: function(cli, cfg) {
      return _config.addOverlayFile(cfg, 'locales', cli.option('path'), cli.option('overlay', 'custom'));
    },
    remove_repository: function(cli, cfg) {
      return _config.removeRepository(cfg, cli.option('name'));
    },
    enable_package: function(cli, cfg) {
      return _config.enablePackage(cfg, cli.option('name'));
    },
    disable_package: function(cli, cfg) {
      return _config.disablePackage(cfg, cli.option('name'));
    },
    list_packages: function(cli, cfg) {
      return _config.listPackages(cfg);
    }
  },

  generate: function(cli, cfg, task) {
    if ( _generate[task] ) {
      return new Promise((resolve, reject) => {
        _generate[task](cli, cfg).then((arg) => {

          const out = cli.option('out');
          if ( out ) {
            _fs.writeFileSync(out, String(arg));
            resolve();
            return;
          } else if ( arg ) {
            _logger.log(arg);
          }

          resolve();
        }).catch(reject);
      });
    } else {
      return Promise.reject('Invalid generator: ' + task);
    }
  }
};

const ORIGINAL_TASKS = (function() {
  const tmp = {};
  Object.keys(TASKS).forEach(function(s) {
    tmp[s] = Object.keys(TASKS[s]);
  });
  return tmp;
})();

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

/*
 * Init
 */
module.exports._init = function() {
  _glob.sync(_path.join(__dirname, 'modules/*.js')).forEach((file) => {
    require(file).register(TASKS);
  });
};

/*
 * Task: `build`
 */
module.exports.build = function(cli, args) {
  if ( !args ) {
    args = ['config', 'dist', 'core', 'themes', 'manifest', 'packages'];

    args = args.concat(Object.keys(TASKS.build).filter(function(i) {
      return ORIGINAL_TASKS.build.indexOf(i) === -1 && args.indexOf(i) === -1;
    })).join(',');
  }

  return _eachTask(cli, args, 'build', TASKS.build);
};

/*
 * Task: `config`
 */
module.exports.config = function(cli, arg) {
  return new Promise((resolve, reject) => {
    arg = (arg || '').replace('-', '_');

    if ( TASKS.config[arg] ) {
      _config.getConfiguration().then((cfg) => {
        TASKS.config[arg](cli, cfg).then((arg) => {
          if ( typeof arg !== 'undefined' ) {
            _logger.log(arg);
          }
          resolve();
        }).catch(reject);
      });
    } else {
      reject('Invalid action: ' + arg);
    }
  });
};

/*
 * Task: `watch`
 */
module.exports.watch = function(cli, args) {
  return _watcher.watch(cli);
};

/*
 * Task: `generate`
 */
module.exports.generate = function(cli, args) {
  return _eachTask(cli, args, 'generate', TASKS.generate);
};

/*
 * Task: `clean`
 */
module.exports.clean = function(cli, args) {
  return new Promise((resolve, reject) => {
    _logger.log(_logger.color('Running task:', 'bold'), _logger.color('clean', 'green'));

    _config.getConfiguration().then((cfg) => {
      Promise.all([
        _config.clean(cli, cfg),
        _dist.clean(cli, cfg),
        _core.clean(cli, cfg),
        _manifest.clean(cli, cfg),
        _themes.clean(cli, cfg),
        _packages.clean(cli, cfg)
      ]).then(resolve).catch(reject);
    });
  });
};

/*
 * Task: `run`
 */
module.exports.run = function(cli, args) {
  const instance = require(_path.join(ROOT, 'src/server/node/core/instance.js'));
  const settings = require(_path.join(ROOT, 'src/server/node/core/settings.js'));

  const opts = {
    HOSTNAME: cli.option('hostname'),
    DEBUG: cli.option('debug'),
    PORT: cli.option('port'),
    LOGLEVEL: cli.option('loglevel')
  };

  instance.init(opts).then((env) => {
    const config = settings.get();
    if ( config.tz ) {
      process.env.TZ = config.tz;
    }

    process.on('exit', () => {
      instance.destroy();
    });

    instance.run();

    process.on('uncaughtException', (error) => {
      _logger.log('UNCAUGHT EXCEPTION', error, error.stack);
    });

    process.on('unhandledRejection', (error) => {
      console.log('UNCAUGHT REJECTION', error);
    });

    ['SIGTERM', 'SIGINT'].forEach((sig) => {
      process.on(sig, () => {
        console.log('\n');
        instance.destroy((err) => {
          process.exit(err ? 1 : 0);
        });
      });
    });
  }).catch((error) => {
    _logger.log(error);
    process.exit(1);
  });

  return new Promise(() => {
    // This is one promise we can't keep! :(
  });
};
