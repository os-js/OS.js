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
(function() {
  'use strict';

  var _path = require('path');

  var _utils = require('./utils.js');
  var _config = require('./config.js');
  var _core = require('./core.js');
  var _manifest = require('./manifest.js');
  var _packages = require('./packages.js');
  var _themes = require('./themes.js');
  var _generate = require('./generate.js');

  var ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Wrapper for getting build target(s)
   */
  function _getTargets(cli, defaults, strict) {
    var target = cli.option('target');
    var result = defaults;

    if ( target ) {
      result = target.split(',').map(function(iter) {
        var val = iter.trim();
        return strict ? (defaults.indexOf(val) === -1 ? null : val) : val;
      }).filter(function(iter) {
        return !!iter;
      });
    }
    return strict ? (!result.length ? defaults : result) : result;
  }

  /**
   * Wrapper for getting name option
   */
  function _configAction(cli, cfg, done, cb) {
    var name = cli.option('name');
    if ( !name ) {
      return done('No name provided');
    }
    cb(name);
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var CONFIG_ACTIONS = {

    add_mount: function(cli, cfg, done) {
      _configAction(cli, cfg, done, function(name) {
        _config.addMount(cfg, name, cli.option('description'), cli.option('path'), done);
      });
    },
    add_preload: function(cli, cfg, done) {
      _configAction(cli, cfg, done, function(name) {
        _config.addPreload(cfg, name, cli.option('path'), cli.option('type'), done);
      });
    },
    add_repository: function(cli, cfg, done) {
      _configAction(cli, cfg, done, function(name) {
        _config.addRepository(cfg, name, done);
      });
    },
    remove_repository: function(cli, cfg, done) {
      _configAction(cli, cfg, done, function(name) {
        _config.removeRepository(cfg, name, done);
      });
    },
    enable_package: function(cli, cfg, done) {
      _configAction(cli, cfg, done, function(name) {
        _config.enablePackage(cfg, name, done);
      });
    },
    disable_package: function(cli, cfg, done) {
      _configAction(cli, cfg, done, function(name) {
        _config.enablePackage(cfg, name, done);
      });
    },
    list_packages: function(cli, cfg, done) {
      _config.listPackages(cfg, done);
    },
    set: function(cli, cfg, done) {
      _config.set(cfg, cli.option('name'), cli.option('value'), function(val) {
        console.log(val);
        done();
      });
    },
    get: function(cli, cfg, done) {
      _config.get(cfg, cli.option('name'), function(val) {
        console.log(val);
        done();
      });
    }

  };

  var BUILD_ACTIONS = {

    config: function(cli, cfg, done) {
      var list = _getTargets(cli, ['client', 'server'], true);
      _utils.iterate(list, function(target, idx, next) {
        _config.writeConfiguration({
          verbose: cli.option('verbose'),
          nw: cli.option('nw'),
          standalone: cli.option('standalone'),
          target: target
        }, next)
      }, done)
    },

    core: function(cli, cfg, done) {
      var list = _getTargets(cli, ['dist', 'dist-dev']);
      _utils.iterate(list, function(target, idx, next) {
        console.log('Generating files for', target);
        _core.buildFiles({
          repositories: cfg.repositories,
          verbose: cli.option('verbose'),
          nw: cli.option('nw'),
          standalone: cli.option('standalone'),
          handler: cfg.handler,
          dist: cfg.dist,
          client: cfg.client,
          statics: cfg.statics,
          target: target,
          compress: cli.option('compress'),
          javascript: cfg.javascript,
          stylesheets: cfg.stylesheets,
          locales: cfg.locales
        }, next);
      }, done);
    },

    themes: function(cli, cfg, done) {
      _themes.buildAll(cfg, done)
    },

    theme: function(cli, cfg, done) {
      var targets = [
        [cli.option('style'), function(val, cb) {
          _themes.buildStyle(cfg, val, cb);
        }],
        [cli.option('icons'), function(val, cb) {
          _themes.buildIcon(cfg, val, cb);
        }],
        [cli.option('static'), function(val, cb) {
          _themes.buildStatic(cfg, cb);
        }],
        [cli.option('fonts'), function(val, cb) {
          _themes.buildFonts(cfg, cb);
        }]
      ];

      _utils.iterate(targets, function(iter, idx, next) {
        if ( typeof iter[0] === 'string' ) {
          iter[1](iter[0], next);
        } else {
          next();
        }
      }, function() {
        done();
      });
    },

    manifest: function(cli, cfg, done) {
      var list = _getTargets(cli, ['dist', 'dist-dev']);
      list.push('server');

      var forceEnabled = _config.getConfigPath(cfg, 'packages.ForceEnable') || [];
      var forceDisabled = _config.getConfigPath(cfg, 'packages.ForceDisable') || [];

      _utils.iterate(list, function(key, idx, next) {
        console.log('Generating manifest for', key);
        _manifest.writeManifest({
          standalone: cli.option('standalone'),
          verbose: cli.option('verbose'),
          force: {
            enabled: forceEnabled,
            disabled: forceDisabled
          },
          repositories: cfg.repositories,
          target: key
        }, next)
      }, done)
    },

    packages: function(cli, cfg, done) {
      var list = _getTargets(cli, ['dist', 'dist-dev']);
      _utils.iterate(list, function(target, idx, next) {
        _packages.buildPackages({
          verbose: cli.option('verbose'),
          compress: cli.option('compress'),
          standalone: cli.option('standalone'),
          repositories: cfg.repositories,
          target: target
        }, next);
      }, done);
    },

    package: function(cli, cfg, done, backwardCompability) {
      backwardCompability = backwardCompability || {};

      var name = backwardCompability.name || cli.option('name');
      if ( !name || name.indexOf('/') === -1 ) {
        throw new Error('Invalid package name');
      }

      var list = _getTargets(cli, ['dist', 'dist-dev']);
      _utils.iterate(list, function(target, idx, next) {
        _packages.buildPackage({
          name: name,
          target: target,
          standalone: cli.option('standalone'),
          verbose: cli.option('verbose'),
          compress: cli.option('compress')
        }, next)
      }, done);
    }

  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * cli config:X
   */
  module.exports.config = function(cli, arg, done, misc) {
    arg = arg.replace('-', '_');

    if ( !CONFIG_ACTIONS[arg] ) {
      console.error('Invalid argument');
      return done();
    }

    _config.getConfiguration({}, function(err, cfg) {
      CONFIG_ACTIONS[arg](cli, cfg, function(err) {
        if ( err ) {
          console.warn(err);
        }
        done();
      });
    });
  };

  /**
   * cli build:X
   */
  module.exports.build = function build(cli, arg, done, misc) {
    if ( !arg ) {
      arg = 'config,core,themes,manifest,packages';
    }

    _utils.iterate(arg.split(','), function(a, idx, next) {
      a = a.trim();

      if ( BUILD_ACTIONS[a] ) {
        _config.getConfiguration({}, function(err, cfg) {
          BUILD_ACTIONS[a](cli, cfg, function(err) {
            if ( err ) {
              console.warn(err);
            }

            next();
          }, misc);
        });
      } else {
        console.error('Invalid argument ' + a);
        next();
      }
    }, function() {
      done();
    });
  };

  /**
   * cli generate:X
   */
  module.exports.generate = function build(cli, arg, done, misc) {
    _config.getConfiguration({}, function(err, cfg) {
      console.log('Generating', arg);

      _generate.generate(cfg, arg, {
        target: cli.option('target') || 'dist-dev',
        verbose: cli.option('verbose'),
        out: cli.option('out'),
        name: cli.option('name'),
        type: cli.option('type')
      }, function(e) {
        if ( e ) {
          console.error(e);
        }
        done();
      });
    });
  };

  /**
   * cli run
   */
  module.exports.run = function run(cli, arg, done) {
    var serverRoot = _path.join(ROOT, 'src', 'server', 'node');
    var _server = require(_path.join(serverRoot, 'http.js'));
    process.chdir(ROOT);

    process.on('exit', function() {
      _server.close();
    });

    process.on('uncaughtException', function(error) {
      console.log('UNCAUGHT EXCEPTION', error, error.stack);
    });

    _server.listen({
      port: cli.option('port'),
      dirname: serverRoot,
      root: ROOT,
      dist: cli.option('target') || 'dist-dev',
      logging: !cli.option('silent'),
      nw: false
    });
  };

})();
