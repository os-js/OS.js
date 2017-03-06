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
const _glob = require('glob-promise');

const _utils = require('./utils.js');
const _logger = _utils.logger;

const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

let _ugly;
let Cleancss;

try {
  _ugly = require('uglify-js');
} catch ( e ) {}
try {
  Cleancss = require('clean-css');
} catch ( e ) {}

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Filter a file reference by string
 */
function _filter(i, target) {
  if ( i.match(/^dev:/) && target !== 'dist-dev' ) {
    return false;
  }
  if ( i.match(/^prod:/) && target !== 'dist' ) {
    return false;
  }
  return true;
}

/*
 * Wrapper for reading JS
 */
function readScript(target, verbose, compress, list) {
  return list.filter((i) => {
    return _filter(i, target);
  }).map((i) => {
    const path = _path.join(ROOT, i.replace(/^(dev|prod):/, ''));
    if ( verbose ) {
      _utils.log('- using:', path, '(compress: ' + String(compress) + ')');
    }

    let data = compress ? _ugly.minify(path, {comments: false}).code : _fs.readFileSync(path).toString();
    data = data.replace(/\/\*\![\s\S]*?\*\//, '')
      .replace(/console\.(log|debug|info|group|groupStart|groupEnd|count)\((.*)\);/g, '')
      .replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:^\s*\/\/(?:.*)$)/gm, '')
      .replace(/^\s*[\r\n]/gm, '');

    return data;
  }).join('\n');
}

/*
 * Wrapper for reading CSS
 */
function readStyle(target, verbose, compress, list) {
  return list.filter((i) => {
    return _filter(i, target);
  }).map((i) => {
    const path = _path.join(ROOT, i.replace(/^(dev|prod):/, ''));
    if ( verbose ) {
      _utils.log('- using:', path, '(compress: ' + String(compress) + ')');
    }

    let data = _fs.readFileSync(path).toString();
    if ( compress ) {
      data = new Cleancss().minify(data).styles;
    }

    data = data.replace(/\/\*\![\s\S]*?\*\//, '')
      .replace('@charset "UTF-8";', '')
      .replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:^\s*\/\/(?:.*)$)/gm, '')
      .replace(/^\s*[\r\n]/gm, '');

    return data;
  }).join('\n');
}

/*
 * Create a 'index.html' file
 */
function createIndex(verbose, cfg, dist, fn, test) {
  const tpldir = _path.join(ROOT, 'src', 'templates', 'dist', cfg.build.dist.template);
  const outdir = _path.join(ROOT, dist || 'dist-dev');
  const fileName = test ? 'test.html' : 'index.html';

  const scripts = [];
  const styles = [];

  fn(dist, cfg, (i) => {
    if ( verbose ) {
      _utils.log('- including:', i);
    }
    styles.push('    <link type="text/css" rel="stylesheet" href="' + i + '" />');
  }, (i) => {
    if ( verbose ) {
      _utils.log('- including:', i);
    }
    scripts.push('    <script type="text/javascript" charset="utf-8" src="' + i + '"></script>');
  }, test);

  const loginName = cfg.build.dist.login || 'default';
  const loginFile = _path.join(ROOT, 'src', 'templates', 'dist', 'login', loginName + '.html');
  const loginHTML = _fs.readFileSync(loginFile).toString();

  const splashName = cfg.build.dist.splash || 'default';
  const splashFile = _path.join(ROOT, 'src', 'templates', 'dist', 'splash', splashName + '.html');
  const splashHTML = _fs.readFileSync(splashFile).toString();

  let tpl = _fs.readFileSync(_path.join(tpldir, fileName)).toString();
  tpl = _utils.replaceAll(tpl, '%STYLES%', styles.join('\n'));
  tpl = _utils.replaceAll(tpl, '%SCRIPTS%', scripts.join('\n'));
  tpl = _utils.replaceAll(tpl, '%LOGIN%', loginHTML);
  tpl = _utils.replaceAll(tpl, '%SPLASH%', splashHTML);
  tpl = _utils.replaceAll(tpl, '%VERSION%', cfg.client.Version);

  _fs.writeFileSync(_path.join(outdir, fileName), tpl);
}

/*
 * Get build files
 */
function getBuildFiles(opts) {
  let javascripts = opts.javascript;
  let stylesheets = opts.stylesheets;
  let locales = opts.locales;

  if ( opts.overlays ) {
    Object.keys(opts.overlays).forEach((k) => {
      const a = opts.overlays[k];
      if ( a ) {
        if ( a.javascript instanceof Array ) {
          javascripts = javascripts.concat(a.javascript);
        }
        if ( a.stylesheets instanceof Array ) {
          stylesheets = stylesheets.concat(a.stylesheets);
        }
        if ( a.locales instanceof Array ) {
          locales = locales.concat(a.locales);
        }
      }
    });
  }

  return {
    javascript: javascripts,
    stylesheets: stylesheets,
    locales: locales
  };
}

/*
 * File adder wrapper
 */
function addFiles(dist, cfg, addStyle, addScript, test) {
  const build = getBuildFiles(cfg.build);
  const jss = (test ? ['vendor/mocha.js', 'vendor/chai.js', 'client/test/test.js'] : []).concat(build.javascript);
  const csss = (test ? ['vendor/mocha.css'] : []).concat(build.stylesheets);

  jss.forEach((i) => {
    addScript(i.replace(/src\/client\/(.*)/, 'client/$1'));
  });

  build.locales.forEach((i) => {
    addScript(i.replace(/src\/client\/(.*)/, 'client/$1'));
  });

  csss.forEach((i) => {
    if ( _filter(i, dist) ) {
      addStyle(i.replace(/^(dev|prod):/, '').replace(/src\/client\/(.*)/, 'client/$1'));
    }
  });
}

/*
 * Copies a templates resources
 */
function copyResources(verbose, cfg, dist) {
  const tpldir = _path.join(ROOT, 'src', 'templates', 'dist', cfg.build.dist.template);
  const dest = _path.join(ROOT, dist);

  return new Promise((resolve) => {
    _glob(_path.join(tpldir, '/**/*'), {
    }).then((list) => {
      list.forEach((path) => {
        if ( ['index.html', 'test.html'].indexOf(_path.basename(path)) === -1 ) {
          if ( verbose ) {
            _utils.log('- copying:', path);
          }

          _fs.copySync(path, _path.join(dest, path.replace(_utils.fixWinPath(tpldir), '')));
        }
      });

      Object.keys(cfg.build.statics).forEach((f) => {
        const dst = _path.join(ROOT, cfg.build.statics[f]);

        let path = f;
        let skip = false;
        try {
          if ( f.substr(0, 1) === '?' ) {
            path = path.substr(1);
            if ( _fs.existsSync(dst) ) {
              skip = true;
            } else {
              _fs.mkdirSync(_path.dirname(dst));
            }
          }
        } catch ( e ) {
          _utils.log(_logger.color('Warning:', 'yellow'), e);
        }

        if ( !skip ) {
          const src = _path.join(ROOT, path);
          if ( verbose ) {
            _utils.log('- included:', dst);
          }

          try {
            _fs.copySync(src, dst);
          } catch ( e ) {
            _utils.log(_logger.color('Warning:', 'yellow'), e);
          }
        }
      });

      resolve();
    });
  });
}

///////////////////////////////////////////////////////////////////////////////
// TASKS
///////////////////////////////////////////////////////////////////////////////

const TARGETS = {
  'dist': function(cli, cfg) {
    const jsh = _utils.readTemplate('dist/header.js');
    const cssh = _utils.readTemplate('dist/header.css');

    const verbose = cli.option('verbose', false);
    const compress = cli.option('compress', false);
    const standalone = cli.option('standalone', false);
    const target = 'dist';

    function _cleanup() {
      /*
      return new Promise((resolve) => {
        _glob(_path.join(ROOT, 'dist/*.*')).then((list) => {
          list.forEach((file) => {
            if ( ['settings.js', 'packages.js'].indexOf(_path.basename(file)) !== -1 ) {
              _utils.removeSilent(file);
            }
          });
          resolve();
        })
      });
      */
      return Promise.resolve();
    }

    function _build() {
      return new Promise((resolve, reject) => {
        const build = getBuildFiles(cfg.build);
        const end = compress ? '.min' : '';

        _fs.writeFileSync(_path.join(ROOT, 'dist', 'osjs' + end +  '.js'), jsh + readScript(target, verbose, compress, build.javascript));
        _fs.writeFileSync(_path.join(ROOT, 'dist', 'locales' + end +  '.js'), jsh + readScript(target, verbose, compress, build.locales));
        _fs.writeFileSync(_path.join(ROOT, 'dist', 'osjs' + end +  '.css'), cssh + readStyle(target, verbose, compress, build.stylesheets));

        let appendString = '';
        if ( cfg.client.Connection.AppendVersion ) {
          appendString = '?ver=' + cfg.client.Connection.AppendVersion;
        }

        createIndex(verbose, cfg, 'dist', (dist, c, addStyle, addScript) => {
          if ( compress ) {
            addStyle('osjs.min.css' + appendString);
            addScript('osjs.min.js' + appendString);
            addScript('locales.min.js' + appendString);
          } else {
            addStyle('osjs.css' + appendString);
            addScript('osjs.js' + appendString);
            addScript('locales.js' + appendString);
          }

          if ( standalone ) {
            addScript('_dialogs.js');
          }
        });

        if ( standalone ) {
          const src = _path.join(ROOT, 'src', 'client', 'dialogs.html');
          _utils.createStandaloneScheme(src, '/dialogs.html', _path.join(ROOT, 'dist', '_dialogs.js'));
        }

        resolve();
      });
    }

    return new Promise((resolve, reject) => {
      _cleanup().then(_build).then(() => {
        copyResources(verbose, cfg, 'dist').then(resolve);
      }).catch(reject);
    });
  },

  'dist-dev': function(cli, cfg) {
    const verbose = cli.option('verbose', false);

    return new Promise((resolve) => {
      createIndex(verbose, cfg, 'dist-dev', addFiles);
      createIndex(verbose, cfg, 'dist-dev', addFiles, true);

      copyResources(verbose, cfg, 'dist-dev').then(resolve);
    });
  }
};

/*
 * Builds core files
 */
function buildFiles(target, cli, cfg) {
  return new Promise((resolve, reject) => {
    if ( TARGETS[target] ) {
      TARGETS[target](cli, cfg).then(resolve).catch(reject);
    } else {
      reject('Invalid target: ' + target);
    }
  });
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports.buildFiles = buildFiles;
