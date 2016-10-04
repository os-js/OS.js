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
(function(_fs, _path, _utils, _manifest, _themes) {
  'use strict';

  var ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));
  var CACHE = false;

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Gets a config value
   */
  function _getConfigPath(config, path) {
    if ( typeof path === 'string' ) {
      var result = null;
      var queue = path.split(/\./);
      var ns = config;

      queue.forEach(function(k, i) {
        if ( i >= queue.length - 1 ) {
          result = ns[k];
        } else {
          ns = ns[k];
        }
      });

      if ( typeof result === 'undefined' ) {
        return null;
      }
      return result;
    }
    return config;
  }

  /**
   * Sets a config value
   */
  var _setConfigPath = (function() {

    function removeNulls(obj) {
      var isArray = obj instanceof Array;
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
      var queue = key.split(/\./);
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

      var path = _path.join(ROOT, 'src', 'conf', '900-custom.json');
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

  /**
   * Toggles package enable state
   */
  function _togglePackage(config, packageName, enable) {
    var currentEnabled = _getConfigPath(config, 'packages.ForceEnable') || [];
    var currentDisabled = _getConfigPath(config, 'packages.ForceDisable') || [];

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

    _setConfigPath('packages', {
      packages: {
        ForceEnable: currentEnabled,
        ForceDisable: currentDisabled
      }
    }, true);
  }

  /**
   * Reads a settings template
   */
  function _readTemplate(cb) {
    var src = _path.join(ROOT, 'src', 'templates', 'dist', 'settings.js');
    _fs.readFile(src, function(err, res) {
      cb(err, err ? false : res.toString());
    });
  }

  /**
   * Writes a settings template
   */
  function _write(config, tpl, dist, cb) {
    var dest = _path.join(ROOT, dist, 'settings.js');
    var data = tpl.replace('%CONFIG%', JSON.stringify(config, null, 4));
    _fs.writeFile(dest, data, function(err) {
      cb(err, !!err);
    });
  }

  /**
   * Clones given object
   */
  function _clone(obj) {
    if ( obj === null || typeof(obj) !== 'object' ) {
      return obj;
    }

    var temp = {};
    if ( obj instanceof Array ) {
      temp = obj.map(function(iter) {
        return _clone(iter);
      });
    } else {
      Object.keys(obj).forEach(function(key) {
        temp[key] = _clone(obj[key]);
      });
    }

    return temp;
  }

  /**
   * Wrapper for getting packages with a filter
   */
  function __getPackagesFiltered(cfg, filter, cb) {
    _manifest.getPackages({
      repositories: cfg.repositories
    }, function(err, packages) {
      packages = packages || {};

      var list = {};
      Object.keys(packages).forEach(function(p) {
        var pkg = packages[p];
        if ( filter(pkg) ) {
          list[p] = _clone(pkg);
        }
      });

      cb(list);
    });
  }

  /**
   * Get packages with autostart set
   */
  function _getAutostarted(cfg, cb) {
    __getPackagesFiltered(cfg, function(pkg) {
      return pkg && pkg.autostart === true;
    }, function(list) {
      cb(Object.keys(list).map(function(i) {
        return list[i].className;
      }));
    });
  }

  /**
   * Get packages of the extension type
   */
  function _getExtensions(cfg, cb) {
    __getPackagesFiltered(cfg, function(pkg) {
      return pkg && pkg.type === 'extension';
    }, cb)
  }

  /**
   * Read and merge JSON objects
   */
  function _readAndMerge(iter, config) {
    try {
      if ( _fs.existsSync(iter) ) {
        var json = JSON.parse(_fs.readFileSync(iter).toString());
        config = _utils.mergeObject(_clone(config), json);
      }
    } catch ( e ) {
      console.log(e.stack);
    }
    return config;
  }

  /**
   * Make correction to package manifest
   */
  function _makeCorrections(cfg, opts, settings, target, cb) {
    var preloads = Object.keys(settings.Preloads || {}).map(function(k) {
      return settings.Preloads[k];
    });

    if ( target === 'dist-dev' ) {
      preloads.push({
        type: 'javascript',
        src: '/' + ['client', 'javascript', 'handlers', cfg.handler, 'handler.js'].join('/')
      });
    }

    if ( !(settings.AutoStart instanceof Array) ) {
      settings.AutoStart = [];
    }

    if ( opts.standalone && target === 'dist' ) {
      settings.Connection.Type = 'standalone';
      settings.VFS.GoogleDrive.Enabled = false;
      settings.VFS.OneDrive.Enabled = false;
      settings.VFS.Dropbox.Enabled = false;
      settings.VFS.LocalStorage.Enabled = false;

      var valid = ['applications', 'home', 'osjs'];
      Object.keys(settings.VFS.Mountpoints).forEach(function(k) {
        if ( valid.indexOf(k) === -1 ) {
          delete settings.VFS.Mountpoints[k];
        }
      });
    }

    var themes = _themes.readMetadata(cfg);
    settings.Fonts.list = themes.fonts.concat(settings.Fonts.list);
    settings.Styles = themes.styles;
    settings.Sounds = _utils.makedict(themes.sounds, function(iter) {
      return [iter.name, iter.title];
    });
    settings.Icons = _utils.makedict(themes.icons, function(iter) {
      return [iter.name, iter.title];
    });

    _getAutostarted(cfg, function(list) {
      settings.AutoStart = settings.AutoStart.concat(list);
      settings.MIME = cfg.mime;
      settings.Preloads = preloads;
      settings.Connection.Dist = target;

      cb(settings);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // TARGETS
  /////////////////////////////////////////////////////////////////////////////

  var TARGETS = {
    client: function(config, opts, done) {
      _readTemplate(function(err, tpl) {
        _utils.iterate(['dist', 'dist-dev'], function(dist, idx, next) {
          _makeCorrections(config, opts, _clone(config.client), dist, function(settings) {
            _write(settings, tpl, dist, function() {
              next();
            });
          });
        }, function() {
          done(false, true);
        });
      });
    },

    server: function(config, opts, done) {
      var dest = _path.join(ROOT, 'src', 'server', 'settings.json');
      var settings = _clone(config.server);

      _getExtensions(config, function(extensions) {
        var loadExtensions = [];
        var src = _path.join(ROOT, 'src');

        Object.keys(extensions).forEach(function(e) {
          (['api.php', 'api.js']).forEach(function(c) {
            var dir = _path.join(src, 'packages', e, c);
            if ( _fs.existsSync(dir) ) {
              var path = '/' + _utils.fixWinPath(dir).replace(_utils.fixWinPath(src), config.server.srcdir);
              loadExtensions.push(path);
            }
          });

          if ( extensions[e].conf && extensions[e].conf instanceof Array ) {
            extensions[e].conf.forEach(function(c) {
              try {
                var p = _path.join(src, 'packages', extensions[e].path, c);
                settings = _readAndMerge(p, settings);
              } catch ( e ) {
                console.warn('createConfigurationFiles()', e, e.stack);
              }
            });
          }
        });

        settings.extensions = loadExtensions;
        settings.mimes = config.mime.mapping;

        _fs.writeFile(dest, JSON.stringify(settings, null, 4), function(err) {
          done(err, !!err);
        });
      });
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Gets entire configuration tree
   */
  function getConfiguration(opts, done) {
    if ( CACHE ) {
      return done(false, Object.freeze(CACHE));
    }

    var path = _path.join(ROOT, 'src', 'conf');
    var data = {};

    _utils.enumFiles(path, function(list) {
      list = list.filter(function(iter) {
        return iter.match(/\.json$/);
      });

      _utils.iterate(list, function(iter, idx, next) {
        var file = _path.join(path, iter);
        _utils.readJSON(file, function(err, cfg) {
          if ( !err && cfg ) {
            _utils.mergeObject(data, cfg);
          }
          next();
        });
      }, function() {

        var handler = data.handler || 'demo';
        var connection = data.connection || 'http';

        var tmp = JSON.stringify(data).replace(/%ROOT%/g, _utils.fixWinPath(ROOT))
          .replace(/%HANDLER%/g, handler)
          .replace(/%CONNECTION%/g, connection);

        CACHE = Object.freeze(JSON.parse(tmp));
        done(false, CACHE);
      });
    });
  }

  /**
   * grunt build:config
   *
   * Generates dist configuration files
   */
  function writeConfiguration(opts, done) {
    console.log('Generating configuration for', opts.target);
    getConfiguration({
    }, function(err, config) {
      if ( err ) {
        done(err, false);
      } else {
        TARGETS[opts.target](config, opts, done);
      }
    });
  }

  /**
   * grunt config:get
   *
   * Gets a configuration option
   */
  function getConfig(config, key, done) {
    done(_getConfigPath(config, key));
  }

  /**
   * grunt config:set
   *
   * Sets a configuration option
   */
  function setConfig(config, key, value, done) {
    if ( typeof value === 'undefined' ) {
      return done(value);
    }
    done(_setConfigPath(key, value));
  }

  /**
   * grunt config:enable-package
   *
   * Add a force enable package to config files
   */
  function enablePackage(config, name, done) {
    _togglePackage(config, name, true);
    done();
  }

  /**
   * grunt config:disable-package
   *
   * Add a force disable package to config files
   */
  function disablePackage(config, name, done) {
    _togglePackage(config, name, false);
    done();
  }

  /**
   * grunt config:add-mount
   *
   * Add a mountpoint to config files
   */
  function addMount(config, name, description, path, done) {
    var current = _getConfigPath(config, 'client.VFS.Mountpoints') || {};
    current[name] = {description: description || name};
    _setConfigPath('client.VFS.Mountpoints', {client: {VFS: { Mountpoints: current}}}, true);

    current = _getConfigPath(config, 'server.vfs.mounts') || {};
    current[name] = path;
    _setConfigPath('server.vfs.mounts', {server: {vfs: {mounts: current}}}, true);

    done();
  }

  /**
   * grunt config:add-preload
   *
   * Add a preload to config files
   */
  function addPreload(config, name, path, type, done) {
    type = type || 'javascript';

    var current = _getConfigPath(config, 'client.Preloads') || {};
    current[name] = {type: type, src: path};

    _setConfigPath('client.Preloads', {client: {Preloads: current}}, true);

    done();
  }

  /**
   * grunt config:add-respository
   *
   * Add a repository to config files
   */
  function addRepository(config, name, done) {
    var current = _getConfigPath(config, 'repositories') || [];
    current.push(name);
    _setConfigPath('repositories', {repositories: current}, true);
    done();
  }

  /**
   * grunt config:remove-respository
   *
   * Removes a repository from config files
   */
  function removeRepository(config, name, done) {
    var current = _getConfigPath(config, 'repositories') || [];
    var found = current.indexOf(name);
    if ( found >= 0 ) {
      current.splice(found, 1);
    }
    if ( current.length === 1 && current[0] === 'default' ) {
      current = null;
    }
    _setConfigPath('repositories', {repositories: current}, true);
    done();
  }

  /**
   * grunt config:list-packages
   *
   * Lists all packages
   */
  function listPackages(config, done) {
    _manifest.getPackages({
      repositories: config.repositories
    }, function(err, packages) {
      var currentEnabled = _getConfigPath(config, 'packages.ForceEnable') || [];
      var currentDisabled = _getConfigPath(config, 'packages.ForceDisable') || [];

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
          var p = packages[pn];
          var es = p.enabled !== false;
          var esc = es ? 'green' : 'red';
          var prn = pn.split('/', 2)[1];
          if ( es ) {
            if ( currentDisabled.indexOf(prn) !== -1 ) {
              es = false;
              esc = 'yellow';
            }
          } else {
            if ( currentEnabled.indexOf(prn) !== -1 ) {
              es = true;
              esc = 'blue';
            }
          }

          var lblenabled = (es ? 'Enabled' : 'Disabled')[esc];
          var lblname = prn[es ? 'white' : 'grey'];
          var lblrepo = p.repo[es ? 'white' : 'grey'];
          var lbltype = p.type[es ? 'white' : 'grey'];

          console.log(pl(lblenabled, 20), pl(lblrepo, 30), pl(lbltype, 25), lblname);
        });
      }

      done();
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  module.exports.getConfiguration = getConfiguration;
  module.exports.writeConfiguration = writeConfiguration;
  module.exports.enablePackage = enablePackage;
  module.exports.disablePackage = disablePackage;
  module.exports.addMount = addMount;
  module.exports.addPreload = addPreload;
  module.exports.addRepository = addRepository;
  module.exports.removeRepository = removeRepository;
  module.exports.listPackages = listPackages;
  module.exports.getConfigPath = _getConfigPath;
  module.exports.get = getConfig;
  module.exports.set = setConfig;

})(require('node-fs-extra'), require('path'), require('./utils.js'), require('./manifest.js'), require('./themes.js'));
