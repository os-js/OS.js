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
(function(_fs, _path, _utils) {
  'use strict';

  var ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Supresses errors while removing files
   */
  function _removeSilent(file) {
    try {
      _fs.removeSync(file);
    } catch (e) {}
  }

  /**
   * Supresses errors while making directories
   */
  function _mkdirSilent(file) {
    try {
      _fs.mkdirSync(file);
    } catch (e) {}
  }

  /**
   * Gets a list of directories
   */
  function _getDirectories(dir) {
    var list = [];
    _fs.readdirSync(dir).forEach(function(iter) {
      if ( !iter.match(/^\./) ) {
        var s = _fs.lstatSync(_path.join(dir, iter));
        if ( s.isDirectory() || s.isSymbolicLink() ) {
          list.push(iter);
        }
      }
    });
    return list;
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Builds all fonts
   */
  function buildFonts(cfg, done) {
    console.log('Building fonts');
    _mkdirSilent(_path.join(ROOT, 'dist', 'themes', 'fonts'));

    var rep = cfg.client.Connection.FontURI;
    if ( !rep.match(/^\//) ) { // Fix for relative paths (CSS)
      rep = rep.replace(/^\w+\//, '');
    }

    var concated = cfg.themes.fonts.map(function(iter) {
      var src = _path.join(ROOT, 'src', 'client', 'themes', 'fonts', iter);
      var dst = _path.join(ROOT, 'dist', 'themes', 'fonts', iter);

      _fs.copySync(src, dst);
      _removeSilent(_path.join(dst, 'metadata.json'));

      var file = _path.join(dst, 'style.css');
      var css = _fs.readFileSync(file).toString();
      return css.replace(/\%FONTURI\%/g, rep);
    });

    var dest = _path.join(ROOT, 'dist', 'themes', 'fonts.css');
    _fs.writeFileSync(dest, concated.join('\n'));

    done();
  }

  /**
   * Builds given style
   */
  function buildStyle(cfg, name, done) {
    console.log('Building style', _utils.color(name, 'blue,bold'));

    var src = _path.join(ROOT, 'src', 'client', 'themes', 'styles', name);
    var dst = _path.join(ROOT, 'dist', 'themes', 'styles');

    _mkdirSilent(dst);
    _fs.copySync(src, _path.join(dst, name));

    var from = _path.join(src, 'style.less');
    var to = _path.join(dst, name + '.css');
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
        _removeSilent(_path.join(dst, name, 'metadata.json'));
        _removeSilent(_path.join(dst, name, 'style.less'));
      }
      done();
    }, function(css) {
      var header = '@import "' + base + '";\n\n';
      return header + css;
    });
  }

  /**
   * Builds all styles
   */
  function buildStyles(cfg, done) {
    _utils.iterate(cfg.themes.styles, function(name, idx, next) {
      buildStyle(cfg, name, next);
    }, done);
  }

  /**
   * Builds all static files
   */
  function buildStatic(cfg, done) {
    console.log('Building statics');

    var src = _path.join(ROOT, 'src', 'client', 'themes', 'wallpapers');
    var dst = _path.join(ROOT, 'dist', 'themes', 'wallpapers');
    _fs.copySync(src, dst);

    var sdst = _path.join(ROOT, 'dist', 'themes', 'sounds');
    _mkdirSilent(sdst);

    cfg.themes.sounds.forEach(function(i) {
      var src = _path.join(ROOT, 'src', 'client', 'themes', 'sounds', i);
      var dst = _path.join(ROOT, 'dist', 'themes', 'sounds', i);
      _fs.copySync(src, dst);
      _removeSilent(_path.join(dst, 'metadata.json'));
    });

    done();
  }

  /**
   * Builds given icon pack
   */
  function buildIcon(cfg, name, done) {
    console.log('Building icon pack', _utils.color(name, 'blue,bold'));

    var src = _path.join(ROOT, 'src', 'client', 'themes', 'icons', name);
    var dst = _path.join(ROOT, 'dist', 'themes', 'icons', name);
    _mkdirSilent(dst);

    function _next() {
      _removeSilent(_path.join(dst, 'metadata.json'));
      _fs.copySync(src, dst);
      done();
    }

    var metafile = _path.join(src, 'metadata.json');
    _utils.readJSON(metafile, function(err, metadata) {
      if ( err || !metadata || !metadata.parent ) {
        return _next();
      }

      var psrc = _path.join(ROOT, 'src', 'client', 'themes', 'icons', metadata.parent);
      _fs.copySync(psrc, dst);
      _next();
    });
  }

  /**
   * Builds all icons
   */
  function buildIcons(cfg, done) {
    _utils.iterate(cfg.themes.icons, function(name, idx, next) {
      buildIcon(cfg, name, next);
    }, done);
  }

  /**
   * grunt build:themes
   *
   * Builds all theme files
   */
  function buildAll(cfg, done) {
    var targets = [
      function(cb) {
        buildStyles(cfg, cb);
      },
      function(cb) {
        buildFonts(cfg, cb);
      },
      function(cb) {
        buildIcons(cfg, cb);
      },
      function(cb) {
        buildStatic(cfg, cb);
      }
    ];

    _utils.iterate(targets, function(iter, idx, next) {
      iter(next);
    }, done);
  }

  /**
   * Reads all theme metadata
   */
  function readMetadata(cfg) {

    function _readMetadata(dir, i, whitelist) {
      whitelist = whitelist || [];

      var list = [];
      var root = _path.join(dir, i);
      _getDirectories(root).forEach(function(d) {
        if ( whitelist.indexOf(d) >= 0 ) {
          var check = _path.join(root, d, 'metadata.json');
          if ( _fs.existsSync(check) ) {
            var raw = _fs.readFileSync(check);
            var json = JSON.parse(raw);
            list.push(json);
          }
        }
      });
      return list;
    }

    var themes = _path.join(ROOT, 'src', 'client', 'themes');
    return {
      fonts: (function() {
        var list = [];
        _getDirectories(themes, 'fonts', cfg.themes.fonts).forEach(function(d) {
          var check = _path.join(themes, 'fonts', d, 'style.css');
          if ( _fs.existsSync(check) ) {
            list.push(d);
          }
        });
        return list;
      })(),
      icons: _readMetadata(themes, 'icons', cfg.themes.icons),
      sounds: _readMetadata(themes, 'sounds', cfg.themes.sounds),
      styles: _readMetadata(themes, 'styles', cfg.themes.styles)
    };
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  module.exports.buildAll = buildAll;
  module.exports.buildFonts = buildFonts;
  module.exports.buildStyle = buildStyle;
  module.exports.buildStyles = buildStyles;
  module.exports.buildStatic = buildStatic;
  module.exports.buildIcon = buildIcon;
  module.exports.buildIcons = buildIcons;
  module.exports.readMetadata = readMetadata;

})(require('node-fs-extra'), require('path'), require('./utils.js'));
