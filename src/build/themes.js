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
const _glob = require('glob-promise');
const _fs = require('fs-extra');

const _utils = require('./utils.js');
const _logger = _utils.logger;

const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

///////////////////////////////////////////////////////////////////////////////
// API
///////////////////////////////////////////////////////////////////////////////

/*
 * Reads all theme metadata
 */
function readMetadata(cfg) {

  const themes = _path.join(ROOT, 'src', 'client', 'themes');

  const result = {
    fonts: [],
    icons: [],
    sounds: [],
    styles: []
  };

  function _readMetadata(dir, whitelist) {

    return new Promise((resolve, reject) => {
      whitelist = whitelist || [];

      _glob(_path.join(themes, dir, '*', 'metadata.json')).then((files) => {
        const list = files.filter((check) => {
          const d = _path.basename(_path.dirname(check));
          return whitelist.indexOf(d) >= 0;
        }).map((check) => {
          return _fs.readJsonSync(check);
        });

        resolve(list);
      });
    });
  }

  function _readFonts(dir, whitelist) {
    return new Promise((resolve, reject) => {
      _glob(_path.join(themes, dir, '*', 'style.css')).then((files) => {
        resolve(files.map((check) => {
          return _path.basename(_path.dirname(check));
        }));
      });
    });
  }

  return new Promise((resolve, reject) => {
    return Promise.all([
      new Promise((yes, no) => {
        _readFonts('fonts', cfg.themes.fonts).then((list) => {
          result.fonts = list;
          yes();
        }).catch(no);
      }),
      new Promise((yes, no) => {
        _readMetadata('icons', cfg.themes.icons).then((list) => {
          result.icons = list;
          yes();
        }).catch(no);
      }),
      new Promise((yes, no) => {
        _readMetadata('sounds', cfg.themes.sounds).then((list) => {
          result.sounds = list;
          yes();
        }).catch(no);
      }),
      new Promise((yes, no) => {
        _readMetadata('styles', cfg.themes.styles).then((list) => {
          result.styles = list;
          yes();
        }).catch(no);
      })
    ]).then(() => {
      resolve(result);
    }).catch(reject);
  });
}

///////////////////////////////////////////////////////////////////////////////
// TASKS
///////////////////////////////////////////////////////////////////////////////

/*
 * Builds fonts
 */
function buildFonts(cli, cfg) {
  return new Promise((resolve, reject) => {
    _logger.log('Building fonts');
    _utils.mkdirSilent(_path.join(ROOT, 'dist', 'themes', 'fonts'));

    let rep = cfg.client.Connection.FontURI;
    if ( !rep.match(/^\//) ) { // Fix for relative paths (CSS)
      rep = rep.replace(/^\w+\//, '');
    }

    const concated = cfg.themes.fonts.map((iter) => {
      const src = _path.join(ROOT, 'src', 'client', 'themes', 'fonts', iter);
      const dst = _path.join(ROOT, 'dist', 'themes', 'fonts', iter);

      _fs.copySync(src, dst);
      _utils.removeSilent(_path.join(dst, 'metadata.json'));

      const file = _path.join(dst, 'style.css');
      const css = _fs.readFileSync(file, 'utf8');
      return css.replace(/\%FONTURI\%/g, rep);
    });

    const src = _path.join(ROOT, 'dist', 'themes', 'fonts.css');
    const dest = _path.join(ROOT, 'dist', 'themes', 'fonts.min.css');
    _fs.writeFileSync(src, concated.join('\n'));
    _utils.writeStyles(dest, [src], cli.option('debug'));
    _utils.removeSilent(src);

    resolve();
  });
}

/*
 * Builds static files
 */
function buildStatic(cli, cfg) {
  return new Promise((resolve, reject) => {
    _logger.log('Building statics');

    const src = _path.join(ROOT, 'src', 'client', 'themes', 'wallpapers');
    const dst = _path.join(ROOT, 'dist', 'themes', 'wallpapers');
    _fs.copySync(src, dst);

    const sdst = _path.join(ROOT, 'dist', 'themes', 'sounds');
    _utils.mkdirSilent(sdst);

    cfg.themes.sounds.forEach((i) => {
      const src = _path.join(ROOT, 'src', 'client', 'themes', 'sounds', i);
      const dst = _path.join(ROOT, 'dist', 'themes', 'sounds', i);
      _fs.copySync(src, dst);
      _utils.removeSilent(_path.join(dst, 'metadata.json'));
    });

    resolve();
  });
}

/*
 * Builds icon packs
 */
function buildIcon(cli, cfg, name) {

  function _buildIcon(n) {
    return new Promise((resolve) => {
      _logger.log('Building icon pack', _logger.color(n, 'blue,bold'));

      const src = _path.join(ROOT, 'src', 'client', 'themes', 'icons', n);
      const dst = _path.join(ROOT, 'dist', 'themes', 'icons', n);
      _utils.mkdirSilent(dst);

      function _next() {
        _utils.removeSilent(_path.join(dst, 'metadata.json'));
        _fs.copySync(src, dst);

        resolve();
      }

      const metafile = _path.join(src, 'metadata.json');
      const metadata = _fs.readJsonSync(metafile);

      if ( !metadata.parent ) {
        return _next();
      }

      const psrc = _path.join(ROOT, 'src', 'client', 'themes', 'icons', metadata.parent);
      _fs.copySync(psrc, dst);

      _next();
    });
  }

  const list = name ? [name] : cfg.themes.icons;
  return Promise.all(list.map((n) => {
    return _buildIcon(n);
  }));
}

/*
 * Builds styles
 */
function buildStyle(cli, cfg, name) {
  const debug = cli.option('debug');

  function _buildStyle(n) {
    return new Promise((resolve) => {
      _logger.log('Building style', _logger.color(n, 'blue,bold'));

      const src = _path.join(ROOT, 'src', 'client', 'themes', 'styles', n);
      const dst = _path.join(ROOT, 'dist', 'themes', 'styles');

      _utils.mkdirSilent(dst);
      _fs.copySync(src, _path.join(dst, n));

      const from = _path.join(src, 'style.less');
      const to = _path.join(dst, n + '.css');

      let base = 'theme.less';
      try {
        base = cfg.themes.styleBase;
      } catch ( e ) {}

      _utils.compileLess(debug, from, to, {
        sourceMap: {},
        paths: [
          '.',
          _path.join(ROOT, 'src', 'client', 'themes'),
          _path.join(ROOT, 'src', 'client', 'stylesheets')
        ]
      }, (err) => {
        if ( !err ) {
          _utils.removeSilent(_path.join(dst, n, 'metadata.json'));
          _utils.removeSilent(_path.join(dst, n, 'style.less'));
        }

        resolve();
      }, (css) => {
        const header = '@import "' + base + '";\n\n';
        return header + css;
      });
    });
  }

  const list = name ? [name] : cfg.themes.styles;
  return Promise.all(list.map((n) => {
    return _buildStyle(n);
  }));
}

/*
 * Builds everything
 */
function buildAll(cli, cfg) {
  const only = cli.option('only');

  return Promise.all([
    !only || only === 'fonts' ? buildFonts(cli, cfg) : Promise.resolve(),
    !only || only === 'static' ? buildStatic(cli, cfg) : Promise.resolve(),
    !only || only === 'icons' ? buildIcon(cli, cfg) : Promise.resolve(),
    !only || only === 'styles' ? buildStyle(cli, cfg) : Promise.resolve()
  ]);
}

/*
 * Cleans up build files
 */
function cleanFiles() {
  _utils.removeSilent(_path.join(ROOT, 'dist', 'themes'));
  return Promise.resolve();
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports.readMetadata = readMetadata;
module.exports.buildAll = buildAll;
module.exports.buildStyle = buildStyle;
module.exports.buildIcon = buildIcon;
module.exports.buildStatic = buildStatic;
module.exports.buildFonts = buildFonts;
module.exports.clean = cleanFiles;
