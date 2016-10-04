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
(function(_fs, _path, _utils, _manifest) {
  'use strict';

  var ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

  var _ugly;
  var Cleancss;

  try {
    _ugly = require('uglify-js');
  } catch ( e ) {}
  try {
    Cleancss = require('clean-css');
  } catch ( e ) {}

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function _createStandaloneScheme(iter, dest) {
    var src = _path.join(dest, 'scheme.html');
    if ( _fs.existsSync(src) ) {
      iter.preload.forEach(function(p) {
        if ( p.type === 'scheme' ) {
          _utils.createStandaloneScheme(src, '/' + iter.path +  '/' + p.src, _path.join(dest, '_scheme.js'));
          _fs.removeSync(src);
        }
      })
    }
  }

  /**
   * Wrapper for running package build scripts
   */
  function _runBuildScripts(verbose, target, section, iter, src, dest, cb) {
    var scripts = iter.build.scripts || [];

    _utils.iterate(scripts[section] || [], function(cmd, idx, next) {
      if ( !cmd ) {
        return next();
      }

      cmd = cmd.replace('%PACKAGE%', src);
      console.log('$', cmd.replace(ROOT + '/', ''));

      var env = Object.create(process.env);
      env.OSJS_TARGET = target;
      env.OSJS_PACKAGE = src;

      require('child_process').exec(cmd, {cwd: dest, env: env}, function(err, stdout, stderr) {
        if ( stderr ) {
          console.error(stderr);
        }
        if ( verbose ) {
          console.log(stdout);
        }
        next();
      });
    }, cb);
  }

  /**
   * Wrapper for combining package resources
   */
  function _combineResources(standalone, iter, dest, cb) {
    var remove = [];
    var combined = {
      javascript: [],
      stylesheet: []
    };

    iter.preload.forEach(function(p) {
      if ( p.combine === false || p.src.match(/^(ftp|https?\:)?\/\//) ) {
        return;
      }

      try {
        if ( Object.keys(combined).indexOf(p.type) !== -1 ) {
          var path = _path.join(dest, p.src);
          combined[p.type].push(_fs.readFileSync(path).toString());
          remove.push(path);
        }
      } catch ( e ) {
        console.error(e, e.stack);
      }
    });

    if ( combined.javascript.length ) {
      _fs.writeFileSync(_path.join(dest, 'combined.js'), combined.javascript.join('\n'));
    }

    if ( combined.stylesheet.length ) {
      _fs.writeFileSync(_path.join(dest, 'combined.css'), combined.stylesheet.join('\n'));
    }

    var sfile = _path.join(dest, 'scheme.html');
    if ( _fs.existsSync(sfile) ) {
      var scheme = String(_fs.readFileSync(sfile));
      var found = scheme.match(/<gui\-fragment\s+?data\-fragment\-external=\"(.*)\"\s+?\/>/g);
      if ( found ) {
        found.forEach(function(f) {
          var src = f.split(/<gui\-fragment\s+?data\-fragment\-external=\"(.*)\"\s+?\/>/)[1];
          src = _path.join(dest, src);
          if ( src && _fs.existsSync(src) ) {
            scheme = scheme.replace(f, String(_fs.readFileSync(src)));
            remove.push(src);
          }
        });
      }

      _fs.writeFileSync(sfile, scheme);
    }

    remove.forEach(function(f) {
      _fs.removeSync(f);
      _fs.removeSync(f + '.map');
    });

    if ( standalone ) {
      _createStandaloneScheme(iter, dest);
    }

    iter.preload = _manifest.combinePreloads(iter);

    _fs.writeFileSync(_path.join(dest, 'metadata.json'), JSON.stringify(iter, null, 4));

    cb(false, true);
  }

  /**
   * Wrapper for compressing package resources
   */
  function _compressResources(iter, dest, cb) {
    var jsh = _utils.readTemplate('dist/header.js');
    var cssh = _utils.readTemplate('dist/header.css');

    var types = {
      stylesheet: function(src) {
        var css = _fs.readFileSync(src).toString();
        var min = new Cleancss({
          sourceMap: true
        }).minify(css);

        return [cssh + min.styles, min.sourceMap];
      },
      javascript: function(src) {
        var min = _ugly.minify(src, {
          comments: false,
          outSourceMap: 'out.js.map'
        });

        return [jsh + min.code, min.map];
      }
    };

    _utils.iterate(iter.preload, function(pre, idx, next) {
      var m = pre.src.match(/\.min\.(js|css)$/);
      if ( !m && !pre.src.match(/^(ftp|https?\:)?\/\//) ) {
        if ( types[pre.type] ) {
          var ext = pre.src.match(/\.(js|css)$/)[1];
          var shr = pre.src.replace(/\.(js|css)$/, '');

          var src = _path.join(dest, pre.src);
          var dst = _path.join(dest, shr + '.min.' + ext);
          var result = types[pre.type](src);
          _fs.writeFileSync(dst, result[0]);
          if ( result[1] ) {
            _fs.writeFileSync(dst + '.map', result[1]);
          }
          _fs.removeSync(src);
          _fs.removeSync(src + '.map');

          iter.preload[idx].src = shr + '.min.' + ext;
        }
      }

      next();
    }, function() {
      _fs.writeFileSync(_path.join(dest, 'metadata.json'), JSON.stringify(iter, null, 4));

      cb(false, true);
    });
  }

  /**
   * Wrapper for compiling package LESS files
   */
  function _buildLess(iter, src, dest, cb) {
    var files = iter.build.less || {};

    _utils.iterate(Object.keys(files), function(f, idx, next) {
      var from = _path.join(src, f);
      var to = _path.join(dest, files[f]);

      _utils.compileLess(from, to, {
        sourceMap: {},
        paths: [
          '.',
          _path.join(ROOT, 'src', 'client', 'themes'),
          _path.join(ROOT, 'src', 'client', 'stylesheets')
        ]
      }, function(err) {
        next();
      });
    }, cb)
  }

  /**
   * Wrapper for copying package files
   */
  function _copyResources(opts, iter, src, dest, cb) {
    var copy = iter.build.copy || [];

    if ( copy.length ) {
      copy.forEach(function(file) {
        var d = _path.join(dest, file);
        var p = _path.dirname(d);

        if ( opts.verbose ) {
          _utils.log('-', _path.join(src, file), '->', d);
        }

        try {
          if ( !_fs.existsSync ) {
            _fs.mkdirSync(p);
          }
          if ( _fs.existsSync(d) ) {
            _fs.removeSync(d);
          }
          _fs.copySync(_path.join(src, file), d);
        } catch ( e ) {
          console.warn(e);
          console.warn('Failed copying resource', _path.join(src, file));
        }
      });

      cb();
    } else {
      if ( opts.verbose ) {
        _utils.log('-', src, '->', dest);
      }
      _fs.copy(_fs.realpathSync(src), dest, cb);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // BUILD TARGETS
  /////////////////////////////////////////////////////////////////////////////

  var TARGETS = {
    'dist': function(metadata, opts, done) {
      var src = _path.join(ROOT, 'src', 'packages', opts.name);
      var dest = _path.join(ROOT, 'dist', 'packages', opts.name);

      _fs.remove(dest, function() {
        _fs.mkdir(dest, function() {
          _runBuildScripts(opts.verbose, 'dist', 'before', metadata, src, dest, function() {
            _copyResources(opts, metadata, src, dest, function() {
              _buildLess(metadata, src, dest, function() {
                _combineResources(opts.standalone, metadata, dest, function() {
                  if ( opts.compress ) {
                    _compressResources(metadata, dest, function() {
                      _runBuildScripts(opts.verbose, 'dist', 'after', metadata, src, dest, done);
                    })
                  } else {
                    _runBuildScripts(opts.verbose, 'dist', 'after', metadata, src, dest, done);
                  }
                });
              });
            });
          });
        })
      });
    },

    'dist-dev': function(metadata, opts, done) {
      var src = _path.join(ROOT, 'src', 'packages', opts.name);
      var dest = _path.join(ROOT, 'src', 'packages', opts.name);

      _runBuildScripts(opts.verbose, 'dist-dev', 'before', metadata, src, dest, function() {
        _buildLess(metadata, src, dest, function() {
          _runBuildScripts(opts.verbose, 'dist-dev', 'after', metadata, src, dest, done);
        });
      });
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * grunt build:package
   *
   * Builds given package
   */
  function buildPackage(opts, done) {
    function _build(meta) {
      if ( TARGETS[opts.target] ) {
        console.log('Building', _utils.color(opts.target + ':', 'bold') + _utils.color(opts.name, 'blue,bold'));
        TARGETS[opts.target](meta, opts, done)
      } else {
        done('Invalid target');
      }
    }

    if ( opts.metadata ) {
      _build(opts.metadata);
    } else {
      var split = opts.name.split('/');
      _manifest.getPackage({
        name: split[1],
        repository: split[0]
      }, function(err, meta) {
        if ( err ) {
          done(err);
        } else {
          _build(meta);
        }
      });
    }
  }

  /**
   * grunt build:packages
   *
   * Builds all pakages in given repositories
   */
  function buildPackages(opts, done) {
    _manifest.getPackages({
      standalone: opts.standalone,
      repositories: opts.repositories,
      target: opts.target,
      verbose: opts.verbose
    }, function(err, packages) {
      var list = err ? [] : Object.keys(packages);
      _utils.iterate(list, function(iter, idx, next) {
        buildPackage({
          standalone: opts.standalone,
          verbose: opts.verbose,
          compress: opts.compress,
          target: opts.target,
          name: iter,
          metadata: packages[iter]
        }, function() {
          next();
        });
      }, function() {
        done(false, true);
      });
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  module.exports.buildPackage = buildPackage;
  module.exports.buildPackages = buildPackages;

})(require('node-fs-extra'), require('path'), require('./utils.js'), require('./manifest.js'));
