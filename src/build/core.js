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

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Create a 'index.html' file
 */
function createIndex(debug, verbose, standalone, cfg) {
  const tpldir = _path.join(ROOT, 'src', 'templates', 'dist', cfg.build.dist.template);
  const outdir = _path.join(ROOT, 'dist');

  function _write(fileName) {
    const inputScripts = [
      'osjs.min.js',
      'locales.min.js'
    ];

    const inputStylesheets = [
      'osjs.min.css'
    ];

    let appendString = '';
    if ( cfg.client.Connection.AppendVersion ) {
      appendString = '?ver=' + cfg.client.Connection.AppendVersion;
    }

    const scripts = inputScripts.map((i) => {
      if ( verbose ) {
        _utils.log('- including:', i);
      }
      return '    <script type="text/javascript" charset="utf-8" src="' + i + appendString + '"></script>';
    });
    const styles = inputStylesheets.map((i) => {
      if ( verbose ) {
        _utils.log('- including:', i);
      }
      return '    <link type="text/css" rel="stylesheet" href="' + i + appendString + '" />';
    });

    const loginName = cfg.build.dist.login || 'default';
    const loginFile = _path.join(ROOT, 'src', 'templates', 'dist', 'login', loginName + '.html');
    const loginHTML = _fs.readFileSync(loginFile).toString();

    const splashName = cfg.build.dist.splash || 'default';
    const splashFile = _path.join(ROOT, 'src', 'templates', 'dist', 'splash', splashName + '.html');
    const splashHTML = _fs.readFileSync(splashFile).toString();

    const replace = {
      '%STYLES%': styles.join('\n'),
      '%SCRIPTS%': scripts.join('\n'),
      '%LOGIN%': loginHTML,
      '%SPLASH%': splashHTML,
      '%VERSION%': cfg.client.Version
    };

    let tpl = _fs.readFileSync(_path.join(tpldir, fileName), 'utf8');
    Object.keys(replace).forEach((s) => {
      tpl = _utils.replaceAll(tpl, s, replace[s]);
    });

    _fs.writeFileSync(_path.join(outdir, fileName), tpl);
  }

  _write('index.html');
  if ( debug ) {
    _write('test.html');
  }
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
 * Copies a templates resources
 */
function copyResources(verbose, cfg) {
  const tpldir = _path.join(ROOT, 'src', 'templates', 'dist', cfg.build.dist.template);
  const dest = _path.join(ROOT, 'dist');

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

/*
 * Cleans core build files
 */
function cleanFiles(cli, cfg) {
  return new Promise((done, errored) => {
    let globs = [
      'dist/dialogs.html',
      'dist/_dialogs.js',
      'dist/locales.js',
      'dist/test.js',
      'dist/osjs.*',
      'dist/*.min.*'
    ];

    const tpldir = _path.join(ROOT, 'src', 'templates', 'dist', cfg.build.dist.template);
    globs = globs.concat(_fs.readdirSync(tpldir).map((f) => {
      return 'dist/' + f;
    }));

    Promise.all(globs.map((g) => {
      return new Promise((ok) => {
        _glob(g).then((list) => {
          list.forEach((file) => {
            _utils.removeSilent(file);
          });
          ok();
        }).catch(ok);
      });
    })).then(done).catch(errored);
  });
}

/*
 * Builds core files
 */
function buildFiles(cli, cfg) {
  return new Promise((resolve, reject) => {
    const verbose = cli.option('verbose', false);
    const standalone = cli.option('standalone', false);
    const debug = cli.option('debug', false);

    const build = getBuildFiles(cfg.build);

    if ( !cli.option('dist') ) {
      _utils.writeScripts(_path.join(ROOT, 'dist', 'osjs.min.js'), build.javascript, debug, verbose);
      _utils.writeScripts(_path.join(ROOT, 'dist', 'locales.min.js'), build.locales, debug, verbose);
      _utils.writeStyles(_path.join(ROOT, 'dist', 'osjs.min.css'), build.stylesheets, debug, verbose);
    }

    createIndex(debug, verbose, standalone, cfg);

    if ( debug ) {
      try {
        const s = _path.join(ROOT, 'src/client/test/test.js');
        const d = _path.join(ROOT, 'dist', 'test.js');
        _fs.symlinkSync(s, d, 'file');
      } catch ( e ) {}
    }

    if ( standalone ) {
      const src = _path.join(ROOT, 'src', 'client', 'dialogs.html');
      _utils.createStandaloneScheme(src, '/dialogs.html', _path.join(ROOT, 'dist', '_dialogs.js'));
    }

    copyResources(verbose, cfg).then(resolve).catch(reject);
  });
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports.clean = cleanFiles;
module.exports.buildFiles = buildFiles;
