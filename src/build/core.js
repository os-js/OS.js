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

const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

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
  const verbose = cli.option('verbose', false);
  const debug = cli.option('debug', false);
  const optimization = cli.option('optimization', false);
  const build = getBuildFiles(cfg.build);

  const only = cli.option('only');

  if ( !only || only === 'javascript' ) {
    _utils.writeScripts({
      dest: _path.join(ROOT, 'dist', 'osjs.min.js'),
      sources: build.javascript,
      debug: debug,
      verbose: verbose,
      optimizations: optimization
    });
  }
  if ( !only || only === 'locale' ) {
    _utils.writeScripts({
      dest: _path.join(ROOT, 'dist', 'locales.min.js'),
      sources: build.locales,
      debug: debug,
      verbose: verbose,
      optimizations: optimization
    });
  }
  if ( !only || only === 'css' ) {
    _utils.writeStyles({
      dest: _path.join(ROOT, 'dist', 'osjs.min.css'),
      sources: build.stylesheets,
      debug: debug,
      verbose: verbose,
      optimizations: optimization
    });
  }

  return Promise.resolve();
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports.clean = cleanFiles;
module.exports.buildFiles = buildFiles;
