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

const _manifest = require('./manifest.js');
const _utils = require('./utils.js');
const _logger = _utils.logger;

let _ugly;
let Cleancss;

try {
  _ugly = require('uglify-js');
} catch ( e ) {}
try {
  Cleancss = require('clean-css');
} catch ( e ) {}

const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Runs package build scripts
 */
function runBuildScripts(verbose, target, section, iter, src, dest, cb) {
  const build = iter.build || {};
  const scripts = ((build.scripts ? build.scripts[section] : null) || []).filter((s) => {
    return !!s;
  });

  return _utils.eachp(scripts.map((cmd) => {
    return function() {
      return new Promise((resolve, reject) => {
        cmd = cmd.replace('%PACKAGE%', src);
        _logger.log('$', cmd.replace(ROOT + '/', ''));

        let env = Object.create(process.env);
        env.OSJS_TARGET = target;
        env.OSJS_PACKAGE = src;

        require('child_process').exec(cmd, {cwd: dest, env: env}, (err, stdout, stderr) => {
          if ( stderr ) {
            _logger.error(stderr);
          }
          if ( verbose ) {
            _logger.log(stdout);
          }
          resolve();
        });
      });
    };
  }));
}

/*
 * Copies package resources
 */
function copyResources(verbose, iter, src, dest) {
  const copy = iter.build.copy || [];
  if ( copy.length ) {
    return new Promise((resolve, reject) => {
      copy.forEach((file) => {
        const d = _path.join(dest, file);
        const p = _path.dirname(d);

        if ( verbose ) {
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
          _logger.warn(e);
          _logger.warn('Failed copying resource', _path.join(src, file));
        }
      });

      resolve();
    });
  }

  return new Promise((resolve, reject) => {
    if ( verbose ) {
      _utils.log('-', src, '->', dest);
    }

    _fs.copy(_fs.realpathSync(src), dest, (err) => {
      /*eslint no-unused-expressions: "off"*/
      err ? reject(err) : resolve();
    });
  });
}

/*
 * Builds LESS file(s)
 */
function buildLess(verbose, iter, src, dest) {
  const files = iter.build.less || {};

  return Promise.all(Object.keys(files).map((f) => {
    return new Promise((resolve, reject) => {
      const from = _path.join(src, f);
      const to = _path.join(dest, files[f]);

      _utils.compileLess(from, to, {
        sourceMap: {},
        paths: [
          '.',
          _path.join(ROOT, 'src', 'client', 'themes'),
          _path.join(ROOT, 'src', 'client', 'stylesheets')
        ]
      }, (err) => {
        /*eslint no-unused-expressions: "off"*/
        err ? reject(err) : resolve();
      });
    });
  }));
}

/*
 * Create standalone scheme files
 */
function createStandaloneScheme(iter, dest) {
  let src = _path.join(dest, 'scheme.html');
  if ( _fs.existsSync(src) ) {
    iter.preload.forEach((p) => {
      if ( p.type === 'scheme' ) {
        _utils.createStandaloneScheme(src, '/' + iter.path +  '/' + p.src, _path.join(dest, '_scheme.js'));
        _fs.removeSync(src);
      }
    });
  }
}

/*
 * Combines resources
 */
function combineResources(standalone, metadata, dest) {
  const remove = [];
  const combined = {
    javascript: [],
    stylesheet: []
  };

  let iter = JSON.parse(JSON.stringify(metadata));
  return new Promise((resolve, reject) => {
    iter.preload.forEach((p) => {
      if ( p.combine === false || p.src.match(/^(ftp|https?\:)?\/\//) ) {
        return;
      }

      try {
        if ( Object.keys(combined).indexOf(p.type) !== -1 ) {
          const path = _path.join(dest, p.src);
          try {
            combined[p.type].push(_fs.readFileSync(path).toString());
          } catch ( e ) {
            _utils.log(_logger.color('Failed reading:', 'yellow'), path);
          }
          remove.push(path);
        }
      } catch ( e ) {
        _logger.error(e);
      }
    });

    if ( combined.javascript.length ) {
      _fs.writeFileSync(_path.join(dest, 'combined.js'), combined.javascript.join('\n'));
    }

    if ( combined.stylesheet.length ) {
      _fs.writeFileSync(_path.join(dest, 'combined.css'), combined.stylesheet.join('\n'));
    }

    const sfile = _path.join(dest, 'scheme.html');
    if ( _fs.existsSync(sfile) ) {
      let scheme = String(_fs.readFileSync(sfile));

      const found = scheme.match(/<gui\-fragment\s+?data\-fragment\-external=\"(.*)\"\s+?\/>/g);
      if ( found ) {
        found.forEach((f) => {
          let src = f.split(/<gui\-fragment\s+?data\-fragment\-external=\"(.*)\"\s+?\/>/)[1];
          src = _path.join(dest, src);

          if ( src && _fs.existsSync(src) ) {
            scheme = scheme.replace(f, String(_fs.readFileSync(src)));
            remove.push(src);
          }
        });
      }

      _fs.writeFileSync(sfile, scheme);
    }

    remove.forEach((f) => {
      _fs.removeSync(f);
      _fs.removeSync(f + '.map');
    });

    if ( standalone ) {
      createStandaloneScheme(iter, dest);
    }

    iter.preload = _manifest.combinePreloads(iter);

    _fs.writeFileSync(_path.join(dest, 'metadata.json'), JSON.stringify(iter, null, 4));

    resolve(iter);
  });
}

/*
 * Compresses resources
 */
function compressResources(verbose, iter, dest) {

  return new Promise((resolve, reject) => {
    const jsh = _utils.readTemplate('dist/header.js');
    const cssh = _utils.readTemplate('dist/header.css');

    const types = {
      stylesheet: function(src) {
        const css = _fs.readFileSync(src).toString();
        const min = new Cleancss({
          sourceMap: true
        }).minify(css);

        return [cssh + min.styles, min.sourceMap];
      },
      javascript: function(src) {
        const min = _ugly.minify(src, {
          comments: false,
          outSourceMap: 'out.js.map'
        });

        return [jsh + min.code, min.map];
      }
    };

    _utils.eachp(iter.preload.map((pre, idx) => {
      return function() {
        return new Promise((yes, no) => {
          const m = pre.src.match(/\.min\.(js|css)$/);
          if ( !m && !pre.src.match(/^(ftp|https?\:)?\/\//) ) {
            if ( types[pre.type] ) {
              const ext = pre.src.match(/\.(js|css)$/)[1];
              const shr = pre.src.replace(/\.(js|css)$/, '');

              const src = _path.join(dest, pre.src);
              const dst = _path.join(dest, shr + '.min.' + ext);
              const result = types[pre.type](src);

              _fs.writeFileSync(dst, result[0]);
              if ( result[1] ) {
                _fs.writeFileSync(dst + '.map', result[1]);
              }
              _fs.removeSync(src);
              _fs.removeSync(src + '.map');

              iter.preload[idx].src = shr + '.min.' + ext;
            }
          }

          yes();
        });
      };
    })).then(() => {
      _fs.writeFileSync(_path.join(dest, 'metadata.json'), JSON.stringify(iter, null, 4));
      resolve();
    }).catch(reject);
  });
}

///////////////////////////////////////////////////////////////////////////////
// TASKS
///////////////////////////////////////////////////////////////////////////////

const TARGETS = {
  'dist': function(cli, cfg, name, metadata) {
    const verbose = cli.option('verbose');
    const standalone = cli.option('standalone');

    return new Promise((resolve, reject) => {
      const src = _path.join(ROOT, 'src', 'packages', name);
      const dest = _path.join(ROOT, 'dist', 'packages', name);

      _utils.eachp([
        function() {
          _logger.log('Building', _logger.color('dist:', 'bold') + _logger.color(name, 'blue,bold'));

          _utils.removeSilent(dest);
          _utils.mkdirSilent(dest);

          return Promise.resolve();
        },
        function() {
          return runBuildScripts(verbose, 'dist', 'before', metadata, src, dest);
        }, () => {
          return copyResources(verbose, metadata, src, dest);
        }, () => {
          return buildLess(verbose, metadata, src, dest);
        }, () => {
          return new Promise((yes, no) => {
            return combineResources(standalone, metadata, dest).then((data) => {
              metadata = data; // Make sure we set new metadata after changes
              yes();
            }).catch(no);
          });
        }, () => {
          if ( cli.option('compress') ) {
            return compressResources(verbose, metadata, dest);
          } else {
            return Promise.resolve(true);
          }
        }, () => {
          return runBuildScripts(verbose, 'dist', 'after', metadata, src, dest);
        }
      ]).then(resolve).catch(reject);
    });
  },

  'dist-dev': function(cli, cfg, name, metadata) {
    const verbose = cli.option('verbose');

    return new Promise((resolve, reject) => {

      const src = _path.join(ROOT, 'src', 'packages', name);
      const dest = _path.join(ROOT, 'src', 'packages', name);

      _utils.eachp([
        function() {
          _logger.log('Building', _logger.color('dist-dev:', 'bold') + _logger.color(name, 'blue,bold'));
          return Promise.resolve();
        },
        function() {
          return runBuildScripts(verbose, 'dist-dev', 'before', metadata, src, dest);
        }, () => {
          return buildLess(verbose, metadata, src, dest);
        }, () => {
          return runBuildScripts(verbose, 'dist-dev', 'after', metadata, src, dest);
        }
      ]).then(resolve).catch(reject);
    });
  }
};

/*
 * Builds given package
 */
function buildPackage(target, cli, cfg, name, metadata) {
  return new Promise((resolve, reject) => {
    function _build(meta) {
      TARGETS[target](cli, cfg, name, meta).then(resolve).catch(reject);
    }

    if ( TARGETS[target] ) {
      if ( metadata ) {
        _build(metadata);
      } else {
        _manifest.getPackage(name).then((meta) => {
          _build(meta);
        });
      }
    } else {
      reject('Invalid target: ' + target);
    }
  });
}

/*
 * Builds all packages
 */
function buildPackages(target, cli, cfg) {
  return new Promise((resolve, reject) => {
    _manifest.getPackages(cfg.repositories).then((packages) => {
      _utils.eachp(Object.keys(packages).map((iter) => {
        return function() {
          return buildPackage(target, cli, cfg, packages[iter].path, packages[iter]);
        };
      })).catch(reject).then(resolve);
    }).catch(reject);
  });
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports.buildPackages = buildPackages;
module.exports.buildPackage = buildPackage;
