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
const _fs = require('node-fs-extra');

const _config = require('./config.js');
const _manifest = require('./manifest.js');
const _themes = require('./themes.js');
const _packages = require('./packages.js');
const _core = require('./core.js');
const _generate = require('./generate.js');

const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

///////////////////////////////////////////////////////////////////////////////
// POLYFILLS
///////////////////////////////////////////////////////////////////////////////

require('colors');

/*
 * Helper for printing colors
 */
String.color = function(str, color) {
  str = String(str);

  color.split(',').forEach(function(key) {
    str = str[key.trim()] || str;
  });
  return str;
};

/*
 * Helper for running promises in sequence
 */
Promise.each = function(list, onentry) {
  onentry = onentry || function() {};

  return new Promise(function(resolve, reject) {
    (function next(i) {
      if ( i >= list.length ) {
        return resolve();
      }

      const iter = list[i]();
      iter.then(function(arg) {
        onentry(arg);
        next(i + 1);
      }).catch(reject);
    })(0);
  });
};

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Parses targets from cli input
 */
function _getTargets(cli, defaults, strict) {
  const target = cli.option('target');

  var result = defaults;
  if ( target ) {
    result = target.split(',').map(function(iter) {
      const val = iter.trim();
      return strict ? (defaults.indexOf(val) === -1 ? null : val) : val;
    }).filter(function(iter) {
      return !!iter;
    });
  }

  return strict ? (!result.length ? defaults : result) : result;
}

/*
 * Iterates all given tasks
 */
function _eachTask(cli, args, taskName, namespace) {
  if ( !args ) {
    return Promise.reject('Not enough arguments');
  }

  return new Promise(function(resolve, reject) {
    _config.getConfiguration().then(function(cfg) {
      Promise.each(args.replace(/\s/, '').split(',').map(function(iter) {
        return function() {
          iter = (iter || '').replace('-', '_');
          if ( typeof namespace === 'function' ) {
            return namespace(cli, cfg, iter);
          } else {
            if ( namespace[iter] ) {
              console.log(String.color('Running task:', 'bold'), String.color([taskName, iter].join(':'), 'green'));
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
      const list = _getTargets(cli, ['client', 'server'], true);

      return Promise.all(list.map(function(target) {
        return _config.writeConfiguration(target, cli, cfg);
      }));
    },

    core: function(cli, cfg) {
      const list = _getTargets(cli, ['dist', 'dist-dev']);

      return Promise.all(list.map(function(target) {
        return _core.buildFiles(target, cli, cfg);
      }));
    },

    theme: function(cli, cfg) {
      const targets = [
        [cli.option('style'), _themes.buildStyle],
        [cli.option('icons'), _themes.buildIcon],
        [cli.option('static'), _themes.buildStatic],
        [cli.option('fonts'), _themes.buildFonts]
      ];

      const list = targets.filter(function(iter) {
        return iter && iter[0];
      }).map(function(iter) {
        return iter[1](cli, cfg, iter[0]);
      });

      return Promise.all(list);
    },

    themes: function(cli, cfg) {
      return _themes.buildAll(cli, cfg);
    },

    manifest: function(cli, cfg) {
      const list = _getTargets(cli, ['dist', 'dist-dev']);
      list.push('server');

      return Promise.all(list.map(function(target) {
        return _manifest.writeManifest(target, cli, cfg);
      }));
    },

    package: function(cli, cfg) {
      const list = _getTargets(cli, ['dist', 'dist-dev']);

      const name = cli.option('name');
      if ( !name || name.indexOf('/') === -1 ) {
        throw new Error('Invalid package name');
      }

      return Promise.all(list.map(function(target) {
        return _packages.buildPackage(target, cli, cfg, name);
      }));
    },

    packages: function(cli, cfg) {
      const list = _getTargets(cli, ['dist', 'dist-dev']);
      return Promise.all(list.map(function(target) {
        return _packages.buildPackages(target, cli, cfg);
      }));
    }
  },

  config: {
    set: function(cli, cfg) {
      return _config.set(cfg, cli.option('name'), cli.option('value'));
    },
    get: function(cli, cfg) {
      return _config.get(cfg, cli.option('name'));
    },
    add_mount: function(cli, cfg) {
      return _config.addMount(cfg, cli.option('name'), cli.option('description'), cli.option('path'), cli.option('transport'), cli.option('ro'));
    },
    add_preload: function(cli, cfg) {
      return _config.addPreload(cfg, cli.option('name'), cli.option('path'), cli.option('type'));
    },
    add_repository: function(cli, cfg) {
      return _config.addRepository(cfg, cli.option('name'));
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
      return new Promise(function(resolve, reject) {
        _generate[task](cli, cfg).then(function(arg) {

          const out = cli.option('out');
          if ( out ) {
            _fs.writeFileSync(out, String(arg));
            return resolve();
          } else {
            console.log(arg);
          }

          resolve();
        }).catch(reject);
      });
    } else {
      return Promise.reject('Invalid generator: ' + task);
    }
  }
};

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

/*
 * Task: `build`
 */
module.exports.build = function(cli, args) {
  if ( !args ) {
    args = 'config,core,themes,manifest,packages';
  }

  return _eachTask(cli, args, 'build', TASKS.build);
};

/*
 * Task: `config`
 */
module.exports.config = function(cli, arg) {
  return new Promise(function(resolve, reject) {
    arg = (arg || '').replace('-', '_');

    if ( TASKS.config[arg] ) {
      _config.getConfiguration().then(function(cfg) {
        TASKS.config[arg](cli, cfg).then(function(arg) {
          if ( typeof arg !== 'undefined' ) {
            console.log(arg);
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
 * Task: `generate`
 */
module.exports.generate = function(cli, args) {
  return _eachTask(cli, args, 'generate', TASKS.generate);
};

/*
 * Task: `run`
 */
module.exports.run = function(cli, args) {
  const instance = require(_path.join(ROOT, 'src/server/node/core/instance.js'));

  const opts = {
    PORT: cli.option('port'),
    LOGLEVEL: cli.option('loglevel'),
    DIST: cli.option('target') || 'dist-dev'
  };

  instance.init(opts).then(function(env) {
    const config = instance.getConfig();
    if ( config.tz ) {
      process.env.TZ = config.tz;
    }

    process.on('exit', function() {
      instance.destroy();
    });

    instance.run();

    process.on('uncaughtException', function(error) {
      console.log('UNCAUGHT EXCEPTION', error, error.stack);
    });
  }).catch(function(error) {
    console.log(error);
    process.exit(1);
  });

  return new Promise(function() {
    // This is one promise we can't keep! :(
  });
};
