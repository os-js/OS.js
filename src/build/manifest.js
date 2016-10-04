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
(function(_fs, _path, _less, _utils) {
  'use strict';

  var ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Reads given template
   */
  function _readTemplate(cb) {
    var src = _path.join(ROOT, 'src', 'templates', 'dist', 'packages.js');
    _fs.readFile(src, function(err, res) {
      cb(err, err ? false : res.toString());
    });
  }

  /**
   * Wrapper for creating config file from template
   */
  function _createClientManifest(manifest, target, fn, done) {
    var dest = _path.join(ROOT, target, 'packages.js');
    var oroot = _path.join(ROOT, 'src', 'packages')
    var newman = JSON.parse(JSON.stringify(manifest));

    fn(oroot, newman, function(result) {
      _readTemplate(function(err, tpl) {
        _fs.writeFile(dest, tpl.replace('%PACKAGES%', JSON.stringify(newman, null, 4)), function() {
          done(newman);
        });
      });
    });
  }

  /**
   * Iterate all preloads that are valid
   */
  function _iteratePreloads(man, cb) {
    Object.keys(man).forEach(function(p) {
      var pre = man[p].preload;
      pre.forEach(function(iter) {
        if ( !iter.src.match(/^(ftp|https?\:)?\/\//) ) {
          cb(iter, man[p]);
        }
      });
    });
  }

  /**
   * Checks if a package is enabled
   */
  function _checkEnabledState(force, metadata, name) {
    if ( force ) {
      if ( String(metadata.enabled) === 'false' ) {
        return force.enabled.indexOf(name) !== -1;
      } else {
        return force.disabled.indexOf(name) === -1;
      }
    }
    return true;
  }

  /////////////////////////////////////////////////////////////////////////////
  // BUILD TARGETS
  /////////////////////////////////////////////////////////////////////////////

  var TARGETS = {

    'dist': function(manifest, opts, done) {
      _createClientManifest(manifest, 'dist', function(oroot, man, cb) {
        Object.keys(man).forEach(function(p) {
          man[p].preload = combinePreloads(man[p])
        });

        cb();
      }, done);
    },

    'dist-dev': function(manifest, opts, done) {
      _createClientManifest(manifest, 'dist-dev', function(oroot, man, cb) {
        _iteratePreloads(man, function(iter, meta) {
          var asrc = _path.join(oroot, meta.path, iter.src);
          if ( _fs.existsSync(asrc) ) {
            var stat = _fs.statSync(asrc);
            iter.mtime = (new Date(stat.mtime)).getTime();
          }
        });

        cb(man);
      }, done);
    },

    'server': function(manifest, opts, done) {
      var dest = _path.join(ROOT, 'src', 'server', 'packages.json');
      _fs.writeFile(dest, JSON.stringify(manifest, null, 4), done);
    }

  };

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Parses a preload entry and makes corrections
   */
  function parsePreloads(iter) {
    if ( typeof iter === 'string' ) {
      var niter = {
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

  /**
   * Check preloads in given manifest and combine as needed
   */
  function combinePreloads(manifest) {
    var pcss = false;
    var pjs  = false;
    var preload = [];

    manifest.preload.forEach(function(p) {
      if ( p.combine === false || p.src.match(/^(ftp|https?\:)?\/\//) ) {
        preload.push(p);
        return;
      }

      if ( p.type === 'javascript' ) {
        if ( !pjs ) {
          preload.push({type: 'javascript', src: 'combined.js'});
        }
        pjs = true;
      } else if ( p.type === 'stylesheet' ) {
        if ( !pcss ) {
          preload.push({type: 'stylesheet', src: 'combined.css'});
        }
        pcss = true;
      } else {
        preload.push(p);
      }
    });

    return preload;
  }

  /**
   * Gets a package given by name
   */
  function getPackage(opts, done) {
    var path = _path.join(ROOT, 'src', 'packages', opts.repository, opts.name);
    var metapath = _path.join(path, 'metadata.json');

    _fs.exists(metapath, function(exists) {
      if ( !exists ) {
        return done('Could not find metadata for package: ' + metapath);
      }

      _utils.readJSON(metapath, function(err, meta) {
        if ( err ) {
          console.log('Error while parsing', metapath, err);
          done(err, false);
        } else {
          var name = [opts.repository, opts.name].join('/');

          meta.type = meta.type || 'application';
          meta.path = name;
          meta.build = meta.build || {};
          meta.repo = opts.repository;
          meta.preload = meta.preload ? meta.preload.map(parsePreloads) : [];

          if ( meta.sources && meta.sources.length ) {
            meta.sources = meta.sources.map(function(s, i) {
              if ( !s.src.match(/^(ftp|https?\:)?\/\//) ) {
                s.src = _path.join('packages', name, s.src);
              }
              return s;
            });
          }

          if ( meta.type === 'service' ) {
            meta.singular = true;
          }

          done(false, meta);
        }
      }, true);
    });
  }

  /**
   * Gets package manifests from given repository
   */
  function getRepositoryPackages(opts, done) {
    var path = _path.join(ROOT, 'src', 'packages', opts.repository);
    var packages = {};

    _utils.enumDirectories(path, function(list) {
      _utils.iterate(list, function(iter, idx, next) {

        getPackage({
          repository: opts.repository,
          name: iter
        }, function(err, metadata) {
          if ( !err && metadata ) {
            packages[metadata.path] = metadata;
          }
          next();
        });
      }, function() {
        done(false, packages);
      });
    });
  }

  /**
   * Gets packages from given repository
   */
  function getPackages(opts, done) {
    var packages = {};

    _utils.iterate(opts.repositories, function(iter, idx, next) {
      getRepositoryPackages({repository: iter}, function(err, res) {
        if ( !err ) {
          Object.keys(res).forEach(function(key) {
            if ( !packages[key] ) {
              var pn = key.split('/')[1] || key;
              if ( _checkEnabledState(opts.force, res[key], pn) ) {
                packages[key] = res[key];
              }
            }
          });
        }
        next();
      });
    }, function() {
      done(false, packages);
    });
  }

  /**
   * Gets package manifests from given repositories
   */
  function getManifest(opts, done) {
    getPackages({
      force: opts.force,
      repositories: opts.repositories
    }, function(err, packages) {
      var result = {
        'dist-dev': packages,
        'dist': (function() {
          var result = JSON.parse(JSON.stringify(packages));
          Object.keys(result).forEach(function(p) {
            result[p].preload = combinePreloads(result[p]);
          });
          return result;
        })()
      };

      done(err, opts.target ? result[opts.target] : result);
    });
  }

  /**
   * grunt build:manifest
   *
   * Builds package manifest(s)
   */
  function writeManifest(opts, done) {
    getManifest({
      force: opts.force,
      repositories: opts.repositories,
      target: opts.target === 'server' ? null : opts.target
    }, function(err, manifest) {
      TARGETS[opts.target](manifest, opts, function() {
        done();
      });
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  module.exports.getRepositoryPackages = getRepositoryPackages;
  module.exports.getPackage = getPackage;
  module.exports.getPackages = getPackages;
  module.exports.getManifest = getManifest;
  module.exports.writeManifest = writeManifest;
  module.exports.combinePreloads = combinePreloads;

})(require('node-fs-extra'), require('path'), require('less'), require('./utils.js'));
