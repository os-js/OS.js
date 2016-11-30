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
const _glob = require('glob-promise');
const _fs = require('node-fs-extra');

const _utils = require('./utils.js');

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

    return new Promise(function(resolve, reject) {
      whitelist = whitelist || [];

      _glob(_path.join(themes, dir, '*', 'metadata.json')).then(function(files) {
        const list = files.filter(function(check) {
          const d = _path.basename(_path.dirname(check));
          return whitelist.indexOf(d) >= 0;
        }).map(function(check) {
          var raw = _fs.readFileSync(check);
          return JSON.parse(raw);
        });

        resolve(list);
      });
    });
  }

  function _readFonts(dir, whitelist) {
    return new Promise(function(resolve, reject) {
      _glob(_path.join(themes, dir, '*', 'style.css')).then(function(files) {
        resolve(files.map(function(check) {
          return _path.basename(_path.dirname(check));
        }));
      });
    });
  }

  return new Promise(function(resolve, reject) {
    return Promise.all([
      new Promise(function(yes, no) {
        _readFonts('fonts', cfg.themes.fonts).then(function(list) {
          result.fonts = list;
          yes();
        }).catch(no);
      }),
      new Promise(function(yes, no) {
        _readMetadata('icons', cfg.themes.icons).then(function(list) {
          result.icons = list;
          yes();
        }).catch(no);
      }),
      new Promise(function(yes, no) {
        _readMetadata('sounds', cfg.themes.sounds).then(function(list) {
          result.sounds = list;
          yes();
        }).catch(no);
      }),
      new Promise(function(yes, no) {
        _readMetadata('styles', cfg.themes.styles).then(function(list) {
          result.styles = list;
          yes();
        }).catch(no);
      })
    ]).then(function() {
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
  return new Promise(function(resolve, reject) {
    console.log('Building fonts');
    _utils.mkdirSilent(_path.join(ROOT, 'dist', 'themes', 'fonts'));

    var rep = cfg.client.Connection.FontURI;
    if ( !rep.match(/^\//) ) { // Fix for relative paths (CSS)
      rep = rep.replace(/^\w+\//, '');
    }

    const concated = cfg.themes.fonts.map(function(iter) {
      const src = _path.join(ROOT, 'src', 'client', 'themes', 'fonts', iter);
      const dst = _path.join(ROOT, 'dist', 'themes', 'fonts', iter);

      _fs.copySync(src, dst);
      _utils.removeSilent(_path.join(dst, 'metadata.json'));

      const file = _path.join(dst, 'style.css');
      const css = _fs.readFileSync(file).toString();
      return css.replace(/\%FONTURI\%/g, rep);
    });

    const dest = _path.join(ROOT, 'dist', 'themes', 'fonts.css');
    _fs.writeFileSync(dest, concated.join('\n'));

    resolve();
  });
}

/*
 * Builds static files
 */
function buildStatic(cli, cfg) {
  return new Promise(function(resolve, reject) {
    console.log('Building statics');

    const src = _path.join(ROOT, 'src', 'client', 'themes', 'wallpapers');
    const dst = _path.join(ROOT, 'dist', 'themes', 'wallpapers');
    _fs.copySync(src, dst);

    const sdst = _path.join(ROOT, 'dist', 'themes', 'sounds');
    _utils.mkdirSilent(sdst);

    cfg.themes.sounds.forEach(function(i) {
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
    return new Promise(function(resolve) {
      console.log('Building icon pack', String.color(n, 'blue,bold'));

      const src = _path.join(ROOT, 'src', 'client', 'themes', 'icons', n);
      const dst = _path.join(ROOT, 'dist', 'themes', 'icons', n);
      _utils.mkdirSilent(dst);

      function _next() {
        _utils.removeSilent(_path.join(dst, 'metadata.json'));
        _fs.copySync(src, dst);

        resolve();
      }

      const metafile = _path.join(src, 'metadata.json');
      const metadata = JSON.parse(_fs.readFileSync(metafile));

      if ( !metadata.parent ) {
        return _next();
      }

      const psrc = _path.join(ROOT, 'src', 'client', 'themes', 'icons', metadata.parent);
      _fs.copySync(psrc, dst);

      _next();
    })
  }

  const list = name ? [name] : cfg.themes.icons;
  return Promise.all(list.map(function(n) {
    return _buildIcon(n);
  }));
}

/*
 * Builds styles
 */
function buildStyle(cli, cfg, name) {

  function _buildStyle(n) {
    return new Promise(function(resolve) {
      console.log('Building style', String.color(n, 'blue,bold'));

      const src = _path.join(ROOT, 'src', 'client', 'themes', 'styles', n);
      const dst = _path.join(ROOT, 'dist', 'themes', 'styles');

      _utils.mkdirSilent(dst);
      _fs.copySync(src, _path.join(dst, n));

      const from = _path.join(src, 'style.less');
      const to = _path.join(dst, n + '.css');

      var base = 'theme.less';
      try {
        base = cfg.themes.styleBase;
      } catch ( e ) {}

      _utils.compileLess(from, to, {
        sourceMap: {},
        paths: [
          '.',
          _path.join(ROOT, 'src', 'client', 'themes'),
          _path.join(ROOT, 'src', 'client', 'stylesheets')
        ]
      }, function(err) {
        if ( !err ) {
          _utils.removeSilent(_path.join(dst, n, 'metadata.json'));
          _utils.removeSilent(_path.join(dst, n, 'style.less'));
        }

        resolve();
      }, function(css) {
        const header = '@import "' + base + '";\n\n';
        return header + css;
      });
    });
  }

  const list = name ? [name] : cfg.themes.styles;
  return Promise.all(list.map(function(n) {
    return _buildStyle(n);
  }));
}

/*
 * Builds everything
 */
function buildAll(cli, cfg) {
  return Promise.all([
    buildFonts(cli, cfg),
    buildStatic(cli, cfg),
    buildIcon(cli, cfg),
    buildStyle(cli, cfg)
  ]);
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
