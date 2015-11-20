/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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
(function(_path, _fs, _less, _ugly, Cleancss) {
  'use strict';

  // TODO: Find a better way to handle windows paths

  var ISWIN = /^win/.test(process.platform);

  var ROOT = _path.dirname(_path.join(__dirname));

  var PATHS = {
    /**
     * Build dirs
     */
    dist:         _path.join(ROOT, 'dist'),
    distdev:      _path.join(ROOT, 'dist-dev'),

    /**
     * Build files
     */
    src:          _path.join(ROOT, 'src'),
    conf:         _path.join(ROOT, 'src', 'conf'),
    templates:    _path.join(ROOT, 'src', 'templates'),
    javascript:   _path.join(ROOT, 'src', 'client', 'javascript'),
    stylesheets:  _path.join(ROOT, 'src', 'client', 'stylesheets'),
    themes:       _path.join(ROOT, 'src', 'client', 'themes'),
    sounds:       _path.join(ROOT, 'src', 'client', 'themes', 'sounds'),
    fonts:        _path.join(ROOT, 'src', 'client', 'themes', 'fonts'),
    icons:        _path.join(ROOT, 'src', 'client', 'themes', 'icons'),
    styles:       _path.join(ROOT, 'src', 'client', 'themes', 'styles'),
    dialogs:      _path.join(ROOT, 'src', 'client', 'dialogs.html'),
    repos:        _path.join(ROOT, 'src', 'packages', 'repositories.json'),
    packages:     _path.join(ROOT, 'src', 'packages'),
    mime:         _path.join(ROOT, 'src', 'mime.json'),

    /**
     * Output
     */
    out_php_config:           _path.join(ROOT, 'src', 'server', 'php', 'settings.php'),
    out_node_config:          _path.join(ROOT, 'src', 'server', 'node', 'settings.json'),
    out_client_js:            _path.join(ROOT, 'dist', 'osjs.js'),
    out_client_css:           _path.join(ROOT, 'dist', 'osjs.css'),
    out_client_dialogs:       _path.join(ROOT, 'dist', 'dialogs.html'),
    out_client_locales:       _path.join(ROOT, 'dist', 'locales.js'),
    out_client_schemes:       _path.join(ROOT, 'dist', 'schemes.js'),
    out_client_locale:        _path.join(ROOT, 'dist', 'locales.js'),
    out_client_fontcss:       _path.join(ROOT, 'dist', 'themes', 'fonts.css'),
    out_client_styles:        _path.join(ROOT, 'dist', 'themes', 'styles'),
    out_client_icons:         _path.join(ROOT, 'dist', 'themes', 'icons'),
    out_client_sounds:        _path.join(ROOT, 'dist', 'themes', 'sounds'),
    out_client_fonts:         _path.join(ROOT, 'dist', 'themes', 'fonts'),
    out_client_manifest:      _path.join(ROOT, 'dist', 'packages.js'),
    out_client_config:        _path.join(ROOT, 'dist', 'settings.js'),
    out_client_packages:      _path.join(ROOT, 'dist', 'packages'),
    out_client_dev_manifest:  _path.join(ROOT, 'dist-dev', 'packages.js'),
    out_client_dev_config:    _path.join(ROOT, 'dist-dev', 'settings.js')
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Compiles a LESS file
   */
  function lessFile(src, dest, cb) {
    console.log('CSS', src.replace(ROOT, ''));

    try {
      var css = readFile(src).toString();

      _less.render(css).then(function(result) {
        writeFile(dest, result.css);
        cb();
      }, function(error) {
        console.warn(error);
        cb(error);
      });
    } catch ( e ) {
      console.warn(e, e.stack);
      cb();
    }
  }

  /**
   * Wrapper to copy file
   */
  function copyFile(src, dst) {
    console.log('CPY', src.replace(ROOT, ''), '=>', dst.replace(ROOT, ''));
    _fs.copySync(src, dst);
  }

  /**
   * Wrapper to write file
   */
  function writeFile(dest, content) {
    console.log('>>>', dest.replace(ROOT, ''));
    return _fs.writeFileSync(dest, content);
  }

  /**
   * Wrapper to read file
   */
  function readFile(src) {
    console.log('<<<', src.replace(ROOT, ''));
    return _fs.readFileSync(src);
  }

  /**
   * Wrapper to delete file
   */
  function deleteFile(src) {
    console.log('DEL', src.replace(ROOT, ''));
    try {
      return _fs.removeSync(src);
    } catch ( e ) {
    }
    return false;
  }

  /**
   * Wrapper to create directory
   */
  function mkdir(src) {
    console.log('MKD', src.replace(ROOT, ''));
    return _fs.mkdirSync(src);
  }

  /**
   * Wrapper for error message
   */
  function error(e) {
    console.log('!!!', e);
  }

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Gets a list of directories from path
   */
  function getDirectories(dir) {
    var list = [];
    _fs.readdirSync(dir).forEach(function(iter) {
      if ( !iter.match(/^\./) ) {
        if ( _fs.lstatSync(_path.join(dir, iter)).isDirectory() ) {
          list.push(iter);
        }
      }
    });
    return list;
  }

  /**
   * Fixes Windows paths (for JSON)
   */
  function fixWinPath(str) {
    if ( ISWIN ) {
      return str.replace(/(["\s'$`\\])/g,'\\$1').replace(/\\+/g, '/');
    }
    return str;
  }

  /**
   * Reads a template file
   */
  function getTemplate(filename) {
    return readFile(_path.join(PATHS.templates, filename)).toString();
  }

  /**
   * Clones an object
   */
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Replaces all instances of a string
   */
  function replaceAll(temp, stringToFind,stringToReplace) {
    var index = temp.indexOf(stringToFind);
    while(index !== -1){
      temp = temp.replace(stringToFind,stringToReplace);
      index = temp.indexOf(stringToFind);
    }
    return temp;
  }

  /**
   * Compile `src/conf` into an object
   */
  var generateBuildConfig = (function generateBuildConfig() {
    var _cache;

    function getConfigFiles(dir) {
      var list = [];
      _fs.readdirSync(dir).forEach(function(iter) {
        if ( !iter.match(/^\./) ) {
          list.push(_path.join(dir, iter));
        }
      });
      return list;
    }

    function mergeObject(into, from) {
      function mergeJSON(obj1, obj2) {
        for ( var p in obj2 ) {
          if ( obj2.hasOwnProperty(p) ) {
            try {
              if ( obj2[p].constructor === Object ) {
                obj1[p] = mergeJSON(obj1[p], obj2[p]);
              } else {
                obj1[p] = obj2[p];
              }
            } catch(e) {
              obj1[p] = obj2[p];
            }
          }
        }
        return obj1;
      }
      return mergeJSON(into, from);
    }

    function getBuildConfig() {
      var config = {};
      var files = getConfigFiles(PATHS.conf);
      files.forEach(function(iter) {
        try {
          var json = JSON.parse(_fs.readFileSync(iter));
          var tjson = JSON.parse(JSON.stringify(config));
          config = mergeObject(tjson, json);
        } catch ( e ) {
          console.log(e.stack);
          console.warn('WARNING: Failed to parse ' + iter.replace(ROOT, ''));
        }
      });
      return JSON.parse(JSON.stringify(config));
    }

    return function() {
      if ( !_cache ) {
        var json = getBuildConfig();
        var build = JSON.stringify(json, null, 2).toString();

        var handler    = json.handler    || 'demo';
        var connection = json.connection || 'http';

        build = build.replace(/%ROOT%/g,       fixWinPath(ROOT));
        build = build.replace(/%HANDLER%/g,    handler);
        build = build.replace(/%CONNECTION%/g, connection);

        _cache = JSON.parse(build);
      }

      return clone(_cache);
    };
  })();

  /**
   * Wrapper for creating web server configuration
   */
  function createWebserverConfig(grunt, arg, src, mimecb) {
    var dist = arg === 'dist-dev' ? 'dist-dev' : 'dist';
    var mime = readMIME();
    var mimes = mimecb(mime);
    var tpl = _fs.readFileSync(src).toString();
    tpl = tpl.replace(/%DISTDIR%/, _path.join(ROOT, dist));
    tpl = tpl.replace(/%MIMES%/, mimes);
    return tpl;
  }

  /////////////////////////////////////////////////////////////////////////////
  // MANIFESTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Reads MIME
   */
  var readMIME = (function readPackageRepositories() {
    function read() {
      var raw = _fs.readFileSync(PATHS.mime);
      var json = JSON.parse(raw);
      return json;
    }

    var _cache = null;
    return function() {
      if ( _cache === null ) {
        _cache = read();
      }
      return _cache;
    };
  })();

  /**
   * Reads package repositories
   */
  var readPackageRepositories = (function readPackageRepositories() {
    function read() {
      var raw = _fs.readFileSync(PATHS.repos);
      var json = JSON.parse(raw);
      return json;
    }

    var _cache = null;
    return function() {
      if ( _cache === null ) {
        _cache = read();
      }
      return _cache;
    };
  })();

  /**
   * Gets a list of core extensions
   */
  function getCoreExtensions() {
    var packages = readPackageMetadata();
    var list = {};
    Object.keys(packages).forEach(function(p) {
      var pkg = packages[p];
      if ( pkg && pkg.type === 'extension' ) {
        list[p] = pkg;
      }
    });
    return list;
  }

  /**
   * Reads all package metadata
   */
  var readPackageMetadata = (function readPackageMetadata() {
    function PackageException(msg) {
      Error.apply(this, arguments);
      this.message = msg;
    }
    PackageException.prototype = Object.create(Error.prototype);
    PackageException.constructor = Error;

    function check(json) {
      if ( !json || !Object.keys(json).length ) {
        throw new PackageException('Package manifest is empty');
      }
      if ( json.enabled === false || json.enabled === 'false' ) {
        throw new PackageException('Package is disabled');
      }
      if ( !json.className ) {
        throw new PackageException('Package is missing className');
      }

      return true;
    }

    function read(srcDir) {
      var list = {};
      var repos = readPackageRepositories();
      repos.forEach(function(r) {
        var dir = _path.join(srcDir || PATHS.packages, r);
        getDirectories(dir).forEach(function(p) {
          var pdir = _path.join(dir, p);
          var mpath = _path.join(pdir, 'package.json');

          if ( _fs.existsSync(mpath) ) {
            var raw = _fs.readFileSync(mpath);
            var name = r + '/' + p;
            try {
              var json = JSON.parse(raw);

              if ( check(json) ) {
                list[name] = json;
              }

              json.type = json.type || 'application';
              json.path = name;
              json.build = json.build || {};

            } catch ( e ) {
              if ( e instanceof PackageException ) {
                console.warn('!!!', p, e.message);
              } else {
                console.warn('readPackageMetadata()', e, e.stack);
              }
            }
          }

        });
      });
      return list;
    }

    var _cache = null;
    return function(dir) {
      if ( dir ) {
        return read(dir);
      }
      if ( _cache === null ) {
        _cache = read();
      }
      return clone(_cache);
    };
  })();

  /**
   * Reads all theme metadata
   */
  var readThemeMetadata = (function readThemeMetadata() {
    function _readMetadata(dir) {
      var list = [];
      getDirectories(dir).forEach(function(d) {
        var check = _path.join(dir, d, 'metadata.json');
        if ( _fs.existsSync(check) ) {
          var raw = _fs.readFileSync(check);
          var json = JSON.parse(raw);
          list.push(json);
        }
      });
      return list;
    }

    function readFonts() {
      var list = [];
      getDirectories(PATHS.fonts).forEach(function(d) {
        var check = _path.join(PATHS.fonts, d, 'style.css');
        if ( _fs.existsSync(check) ) {
          list.push(d);
        }
      });
      return list;
    }

    function readIcons() {
      try {
        return _readMetadata(PATHS.icons);
      } catch ( e ) {
        console.warn(e, e.stack);
      }
      return null;
    }

    function readStyles() {
      try {
        return _readMetadata(PATHS.styles);
      } catch ( e ) {
        console.warn(e, e.stack);
      }
      return null;
    }

    function readSounds() {
      try {
        return _readMetadata(PATHS.sounds);
      } catch ( e ) {
        console.warn(e, e.stack);
      }
      return null;
    }

    function read() {
      return {
        fonts: readFonts(),
        icons: readIcons(),
        sounds: readSounds(),
        styles: readStyles()
      };
    }

    var _cache = null;
    return function() {
      if ( _cache === null ) {
        _cache = read();
      }
      return _cache;
    };
  })();

  /**
   * Returns an object that client understand
   */
  function normalizeManifest(obj) {
    var result = {};
    Object.keys(obj).forEach(function(i) {
      result[obj[i].className] = obj[i];
    });
    return result;
  }

  /////////////////////////////////////////////////////////////////////////////
  // CONFIGS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Generates all configuration files
   */
  function createConfigurationFiles(grunt, arg) {
    var cfg = generateBuildConfig();
    var themes = readThemeMetadata();
    var repos = readPackageRepositories();
    var mime = readMIME();
    var extensions = getCoreExtensions();

    var loadExtensions = [];

    Object.keys(extensions).forEach(function(e) {
      (['api.php', 'api.js']).forEach(function(c) {
        var dir = _path.join(PATHS.packages, e, c);
        if ( _fs.existsSync(dir) ) {
          var path = fixWinPath(dir).replace(fixWinPath(ROOT), '');
          loadExtensions.push(path);
        }
      });
    });

    function buildPHP() {
      var phpSettings = clone(cfg.server);

      try {
        phpSettings.MaxUpload = cfg.client.MaxUploadSize;
      } catch ( e ) {}

      Object.keys(phpSettings.vfs).forEach(function(key) {
        if ( typeof phpSettings.vfs[key] === 'string' ) {
          phpSettings.vfs[key] = fixWinPath(phpSettings.vfs[key]);
        }
      });

      phpSettings.extensions = loadExtensions;

      // Write
      var tpl = getTemplate('settings.php');
      tpl = tpl.replace('%JSON%', JSON.stringify(phpSettings, null, 4));
      writeFile(PATHS.out_php_config, tpl);
    }

    function buildNode() {
      var nodeSettings = clone(cfg.server);
      nodeSettings.extensions = loadExtensions;

      // Write
      var tpl = JSON.stringify(nodeSettings, null, 4);
      writeFile(PATHS.out_node_config, tpl);
    }

    function buildClient(dist) {
      var settings = clone(cfg.client);

      var preloads = [];
      var styles = themes.styles;
      var sounds = {};
      var icons = {};
      var fonts = themes.fonts;

      if ( settings.Preloads ) {
        Object.keys(settings.Preloads).forEach(function(k) {
          preloads.push(settings.Preloads[k]);
        });
      }

      themes.sounds.forEach(function(t) {
        sounds[t.name] = t.title;
      });

      themes.icons.forEach(function(t) {
        icons[t.name] = t.title;
      });

      Object.keys(extensions).forEach(function(p) {
        var e = extensions[p];
        if ( e.sources ) {
          e.sources.forEach(function(ee) {
            preloads.push({
              type: ee.type,
              src: _path.join('/', 'packages', p, ee.src)
            });
          });
        }
      });


      settings.Styles = styles;
      settings.Icons = icons;
      settings.Sounds = sounds;
      settings.Fonts.list = fonts.concat(settings.Fonts.list);
      settings.MIME = mime.descriptions;
      settings.EXTMIME = mime.mapping;
      settings.Repositories = repos;
      settings.Preloads = preloads;
      settings.Dist = dist;

      // Write
      var tpl = getTemplate('settings.js');
      tpl = tpl.replace('%CONFIG%', JSON.stringify(settings, null, 4));
      if ( dist === 'dist-dev' ) {
        writeFile(PATHS.out_client_dev_config, tpl);
      } else {
        writeFile(PATHS.out_client_config, tpl);
      }
    }

    try {
      buildPHP();
      buildNode();
      buildClient('dist');
      buildClient('dist-dev');
    } catch ( e ) {
      console.warn(e, e.stack);
    }

  }

  /////////////////////////////////////////////////////////////////////////////
  // INDEX FILES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Create "index.html" file
   */
  function createIndex(grunt, arg, dist) {
    var cfg = generateBuildConfig();
    var tpldir = _path.join(PATHS.templates, 'dist', cfg.dist.template);
    var outdir = _path.join(ROOT, dist || 'dist-dev');

    var scripts = [];
    var styles = [];

    function addStyle(i) {
      styles.push('    <link type="text/css" rel="stylesheet" href="' + i + '" />');
    }
    function addScript(i) {
      scripts.push('    <script type="text/javascript" charset="utf-8" src="' + i + '"></script>');
    }

    if ( dist === 'dist' ) {
      addStyle('osjs.css');
      addScript('osjs.js');
      addScript('locales.js');
    } else {
      cfg.javascript.forEach(function(i) {
        addScript(i.replace('src/client/javascript', 'client/javascript'));
      });
      cfg.locales.forEach(function(i) {
        addScript(i.replace('src/client/javascript', 'client/javascript'));
      });
      cfg.stylesheets.forEach(function(i) {
        addStyle(i.replace('src/client/stylesheets', 'client/stylesheets'));
      });
    }

    if ( arg === 'standalone' ) {
      addScript('schemes.js');
    }

    var tpl = readFile(_path.join(tpldir, 'index.html')).toString();
        tpl = replaceAll(tpl, '%STYLES%', styles.join('\n'));
        tpl = replaceAll(tpl, '%SCRIPTS%', scripts.join('\n'));
        tpl = replaceAll(tpl, '%HANDLER%', cfg.handler);

    writeFile(_path.join(outdir, 'index.html'), tpl);
    copyFile(_path.join(tpldir, 'favicon.png'), _path.join(outdir, 'favicon.png'));
    copyFile(_path.join(tpldir, 'favicon.ico'), _path.join(outdir, 'favicon.ico'));
  }

  /////////////////////////////////////////////////////////////////////////////
  // WEB SERVER CONFIGS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Create Apache vhost
   */
  function createApacheVhost(grunt, arg) {
    var src = _path.join(PATHS.templates, 'apache-vhost.conf');
    var tpl = createWebserverConfig(grunt, arg, src, function(mime) {
      return '';
    });
    console.log(tpl);
  }

  /**
   * Create Apache htaccess
   */
  function createApacheHtaccess(grunt, arg) {
    var mimes = [];
    var mime = readMIME();

    Object.keys(mime.mapping).forEach(function(i) {
      if ( i.match(/^\./) ) {
        mimes.push('  AddType ' + mime.mapping[i] + ' ' + i);
      }
    });

    function generate_htaccess(t, d) {
      var src = _path.join(PATHS.templates, t);
      var dst = _path.join(ROOT, d, '.htaccess');
      var tpl = _fs.readFileSync(src).toString();
      tpl = tpl.replace(/%MIMES%/, mimes.join('\n'));
      writeFile(dst, tpl);
    }

    if ( arg ) {
      generate_htaccess('apache-prod-htaccess.conf', arg);
    } else {
      generate_htaccess('apache-prod-htaccess.conf', 'dist');
      generate_htaccess('apache-dev-htaccess.conf', 'dist-dev');
    }
  }

  /**
   * Create Lighttpd config
   */
  function createLighttpdConfig(grunt, arg) {
    var src = _path.join(PATHS.templates, 'lighttpd.conf');
    var tpl = createWebserverConfig(grunt, arg, src, function(mime) {
      var mimes = [];
      Object.keys(mime.mapping).forEach(function(i) {
        if ( !i.match(/^\./) ) { return; }
        mimes.push('  "' + i + '" => "' + mime.mapping[i] + '"');
      });
      return mimes.join(',\n');
    });
    console.log(tpl);
  }

  /**
   * Create Nginx config
   */
  function createNginxConfig(grunt, arg) {
    var src = _path.join(PATHS.templates, 'nginx.conf');
    var tpl = createWebserverConfig(grunt, arg, src, function(mime) {
      var mimes = [];
      Object.keys(mime.mapping).forEach(function(i) {
        if ( i.match(/^\./) ) {
          mimes.push('        ' + mime.mapping[i] + ' ' + i.replace(/^\./, '') + ';');
        }
      });
      return mimes.join('\n');
    });
    console.log(tpl);
  }

  /////////////////////////////////////////////////////////////////////////////
  // PACKAGES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a package
   */
  function createPackage(grunt, arg) {
    var tmp  = (arg || '').split('/');
    var repo = tmp.length > 1 ? tmp[0] : 'default';
    var name = tmp.length > 1 ? tmp[1] : arg;

    if ( !name ) {
      throw new Error('You have to specify a name');
    }

    var src = _path.join(PATHS.templates, 'package');
    var dst = _path.join(PATHS.packages, repo, name);

    if ( !_fs.existsSync(src) ) {
      throw new Error('Template not found');
    }

    if ( _fs.existsSync(dst) ) {
      throw new Error('Template already exists');
    }

    function rep(file) {
      var c = readFile(file).toString();
      c = replaceAll(c, 'EXAMPLE', name);
      writeFile(file, c);
    }

    copyFile(src, dst);

    rep(_path.join(dst, 'main.js'));
    rep(_path.join(dst, 'main.css'));
    rep(_path.join(dst, 'package.json'));
    rep(_path.join(dst, 'scheme.html'));
  }

  /////////////////////////////////////////////////////////////////////////////
  // BUILD
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Builds 'dist' core files (concatenation)
   */
  function buildCore(grunt, arg) {
    var cfg = generateBuildConfig();
    var header;

    function _cleanup(path, type) {
      var src = readFile(path);
      src = src.toString().replace(/\/\*\![\s\S]*?\*\//, '');
      if ( type === 'css' ) {
        src = src.toString().replace('@charset "UTF-8";', '');
      } else {
        src = src.toString().replace(/console\.(log|debug|info|group|groupStart|groupEnd|count)\((.*)\);/g, '');
      }

      src = src.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:^\s*\/\/(?:.*)$)/gm, '');
      src = src.replace(/^\s*[\r\n]/gm, '');

      return src;
    }

    function _concat(list, type) {
      var data = [];
      list.forEach(function(iter) {
        var path = _path.join(ROOT, iter);
        try {
          data.push(_cleanup(path, type));
        } catch ( e ) {
          console.warn(e, e.stack);
        }
      });
      return data.join('\n');
    }

    function buildJS() {
      var header = readFile(_path.join(PATHS.templates, 'dist-header.js'));
      return header + _concat(cfg.javascript, 'js');
    }

    function buildLocales() {
      var header = readFile(_path.join(PATHS.templates, 'dist-header.js'));
      return header + _concat(cfg.locales, 'js');
    }

    function buildCSS() {
      var header = readFile(_path.join(PATHS.templates, 'dist-header.css'));
      return header + _concat(cfg.stylesheets, 'css');
    }

    grunt.log.subhead('JavaScript');
    writeFile(PATHS.out_client_js, buildJS());

    grunt.log.subhead('Locales');
    writeFile(PATHS.out_client_locales, buildLocales());

    grunt.log.subhead('CSS');
    writeFile(PATHS.out_client_css, buildCSS());

    grunt.log.subhead('Static files');
    writeFile(PATHS.out_client_css, buildCSS());

    var stats = cfg.statics;
    Object.keys(stats).forEach(function(f) {
      var src = _path.join(ROOT, f);
      var dst = _path.join(ROOT, stats[f]);
      copyFile(src, dst);
    });

  }

  /**
   * Builds standalone files
   */
  function buildStandalone(grunt, arg) {
    var packages = readPackageMetadata();
    var tree = {
      '/dialogs.html': readFile(PATHS.dialogs).toString()
    };

    Object.keys(packages).forEach(function(p) {
      var src = _path.join(PATHS.packages, p, 'scheme.html');
      var name = _path.join('/', p, 'scheme.html');
      if ( _fs.existsSync(src) ) {
        tree[name] = readFile(src).toString();
      }
    });

    var tpl = readFile(_path.join(PATHS.templates, 'schemes.js')).toString();
    tpl = tpl.replace('%JSON%', JSON.stringify(tree, null, 4));
    writeFile(PATHS.out_client_schemes, tpl);
  }

  /**
   * Builds packages
   */
  function buildPackages(grunt, arg) {
    function copyFiles(src, dst, p, list) {
      list = list || [];

      deleteFile(dst);

      if ( list.length ) {
        mkdir(dst);

        list.forEach(function(f) {
          try {
            mkdir(_path.join(dst, _path.dirname(f)));
          } catch ( e ) {}

          try {
            copyFile(_path.join(src, f), _path.join(dst, f));
          } catch ( e ) {
            error(e);
          }
        });
      } else {
        copyFile(src, dst);
      }
    }

    function combineFiles(src, dst, p, iter) {
      var combined = {
        js: [],
        css: []
      };

      var pre = [];
      var remove = [];

      (iter.preload || []).forEach(function(p) {
        var path = _path.join(src, p.src);

        if ( p.combine === false ) {
          pre.push(p);
          return;
        }

        try {
          if ( p.type === 'javascript' ) {
            combined.js.push(readFile(path).toString());
          } else if ( p.type === 'stylesheet' ) {
            combined.css.push(readFile(path).toString());
          } else {
            pre.push(p);
            return;
          }

          remove.push(_path.join(dst, p.src));
        } catch ( e ) {
          error(e);
        }
      });

      if ( combined.js.length ) {
        pre.push({type: 'javascript', src: 'combined.js'});
      }
      if ( combined.css.length ) {
        pre.push({type: 'stylesheet', src: 'combined.css'});
      }

      iter.preload = pre;

      writeFile(_path.join(dst, 'combined.js'), combined.js.join('\n'));
      writeFile(_path.join(dst, 'combined.css'), combined.css.join('\n'));
      writeFile(_path.join(dst, 'package.json'), JSON.stringify(iter, null, 2));

      remove.forEach(function(r) {
        deleteFile(r);
      });
    }

    var packages = readPackageMetadata();
    Object.keys(packages).forEach(function(p) {
      if ( arg && arg !== p ) {
        return;
      }
      grunt.log.subhead(p);

      var iter = packages[p];
      var src = _path.join(PATHS.packages, p);
      var dst = _path.join(PATHS.out_client_packages, p);

      copyFiles(src, dst, p, iter.build.copy);

      if ( iter.type === 'extension' ) {
        return;
      }

      combineFiles(src, dst, p, iter);
    });
  }

  /**
   * Builds Theme Files
   */
  function buildThemes(grunt, arg, finished) {
    var themes = readThemeMetadata();

    function buildFonts() {
      grunt.log.subhead('Fonts');

      copyFile(_path.join(PATHS.themes, 'fonts'),
               _path.join(PATHS.dist, 'themes', 'fonts'));

      var styles = [];
      themes.fonts.forEach(function(name) {
        var path = _path.join(PATHS.fonts, name, 'style.css');
        styles.push(readFile(path).toString());
      });
      writeFile(PATHS.out_client_fontcss, styles.join('\n'));
    }

    function buildStyles(name, cb) {
      grunt.log.subhead('Styles');

      var current = 0;
      var queue = themes.styles;

      function _next() {
        if ( current >= queue.length ) {
          cb();
        }

        var s = queue[current];
        if ( name && name !== s.name ) {
          _next();
          return;
        }

        var dsrc = _path.join(PATHS.styles, s.name);
        var ddest = _path.join(PATHS.out_client_styles, s.name);
        copyFile(dsrc, ddest);

        var src  = _path.join(PATHS.styles, s.name, 'style.less');
        var dest = _path.join(PATHS.out_client_styles, s.name + '.css');

        lessFile(src, dest, function(error) {
          if ( error ) {
            grunt.fail.warn(error);
            return;
          }

          current++;
          _next();
        });
      }

      _next();
    }

    function buildStatic() {
      grunt.log.subhead('Static files');

      copyFile(_path.join(PATHS.themes, 'wallpapers'),
               _path.join(PATHS.dist, 'themes', 'wallpapers'));

      copyFile(_path.join(PATHS.themes, 'icons'),
               _path.join(PATHS.dist, 'themes', 'icons'));

      copyFile(_path.join(PATHS.themes, 'sounds'),
               _path.join(PATHS.dist, 'themes', 'sounds'));
    }

    function cleanup() {
      grunt.log.subhead('Cleaning up...');

      getDirectories(PATHS.out_client_styles).forEach(function(d) {
        deleteFile(_path.join(PATHS.out_client_styles, d, 'metadata.json'));
        deleteFile(_path.join(PATHS.out_client_styles, d, 'style.less'));
      });
      getDirectories(PATHS.out_client_fonts).forEach(function(d) {
        deleteFile(_path.join(PATHS.out_client_fonts, d, 'style.less'));
      });
      getDirectories(PATHS.out_client_sounds).forEach(function(d) {
        deleteFile(_path.join(PATHS.out_client_sounds, d, 'metadata.json'));
      });
      getDirectories(PATHS.out_client_icons).forEach(function(d) {
        deleteFile(_path.join(PATHS.out_client_icons, d, 'metadata.json'));
      });
    }

    function done() {
      cleanup();
      finished();
    }

    if ( !arg || arg === 'all' ) {
      buildFonts();
      buildStatic();
      buildStyles(null, done);
      return;
    } else if ( arg === 'resources' ) {
      buildStatic();
    } else if ( arg === 'fonts' ) {
      buildFonts();
    } else if ( arg.match(/^styles/) ) {
      buildStyles(arg.split(':')[1], done);
      return;
    }

    done();
  }

  /**
   * Builds package manifest
   */
  function buildManifest(grunt, arg) {

    function generate(out, dist) {
      var packages = readPackageMetadata();
      var list = {};

      Object.keys(packages).forEach(function(p) {
        var manifest = packages[p];
        var name = p;
        var preload = [];

        if ( manifest.preload && manifest.preload.length ) {
          if ( dist === 'dist' ) {
            var pcss = false;
            var pjs  = false;
            manifest.preload.forEach(function(p) {
              if ( p.combine === false ) {
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
                return;
              }
            });
          } else {
            preload = manifest.preload;
          }
        }

        if ( manifest.sources && manifest.sources.length ) {
          manifest.sources.forEach(function(s, i) {
            if ( !s.src.match(/^(ftp|https?\:)?\/\//) ) {
              manifest.sources[i].src = _path.join('packages', p, s.src);
            }
          });
        }

        if ( manifest.type === 'service' ) {
          manifest.singular = true;
        }

        manifest.preload = preload;
        manifest.preload.forEach(function(l, i) {
          if ( !l.src.match(/^(ftp|https?\:)?\/\//) ) {
            var src = ([p, l.src]).join('/');
            manifest.preload[i].src = src;

            if ( dist === 'dist-dev' ) {
              var asrc = _path.join(PATHS.packages, src);
              if ( _fs.existsSync(asrc) ) {
                var stat = _fs.statSync(asrc);
                var mtime = (new Date(stat.mtime)).getTime();
                manifest.preload[i].mtime = mtime;
              }
            }
          }
        });

        list[p] = manifest;
      });

      var tpl = readFile(_path.join(PATHS.templates, 'packages.js')).toString();
      var content = tpl.replace('%PACKAGES%', JSON.stringify(normalizeManifest(list), null, 4));
      writeFile(out, content);
    }

    generate(PATHS.out_client_manifest, 'dist');
    generate(PATHS.out_client_dev_manifest, 'dist-dev');
  }

  /**
   * Creates a nightly build
   */
  function buildNightly(grunt, arg) {
    var list = [
      'packages/default',
      'themes',
      'vendor',
      'blank.css',
      'favicon.ico',
      'favicon.png',
      'index.html',
      'osjs.css',
      'osjs.js',
      'locales.js',
      'schemes.js',
      'osjs-logo.png',
      'packages.js',
      'settings.js'
    ];

    var dest = _path.join(ROOT, '.nightly');
    mkdir(_path.join(dest, 'themes'));
    mkdir(_path.join(dest, 'vendor'));
    mkdir(_path.join(dest, 'packages'));
    mkdir(_path.join(dest, 'packages', 'default'));
    copyFile(_path.join(ROOT, 'CHANGELOG.md'), _path.join(dest, 'CHANGELOG.md'));
    copyFile(_path.join(ROOT, 'README.md'), _path.join(dest, 'README.md'));
    copyFile(_path.join(ROOT, 'LICENSE'), _path.join(dest, 'LICENSE'));
    copyFile(_path.join(ROOT, 'AUTHORS'), _path.join(dest, 'AUTHORS'));

    list.forEach(function(src) {
      copyFile(_path.join(PATHS.dist, src), _path.join(dest, src));
    });
  }

  /**
   * Creates a compressed build
   */
  function buildCompressed(grunt, arg) {
    var packages = readPackageMetadata(PATHS.out_client_packages);

    Object.keys(packages).forEach(function(p) {
      var iter = packages[p];
      if ( iter.preload ) {
        grunt.log.subhead(p);

        iter.preload.forEach(function(pl, idx) {
          var basename;
          var newname;
          var minified;
          var src = _path.join(PATHS.out_client_packages, p, pl.src);

          if ( pl.type === 'javascript' ) {
            if ( !pl.src.match(/\.min\.js$/) ) {
              basename = pl.src.replace(/\.js$/, '');
              newname = basename + '.min.js';
              console.log('---', 'uglify', newname);
              minified = _ugly.minify(src, {comments: true}).code;
            }
          } else if ( pl.type === 'stylesheet' ) {
            if ( !pl.src.match(/\.min\.css$/) ) {
              basename = pl.src.replace(/\.css$/, '');
              newname = basename + '.min.css';
              console.log('---', 'clean', newname);
              minified = new Cleancss().minify(readFile(src)).styles;
            }
          }

          if ( basename && newname && minified ) {
            writeFile(_path.join(PATHS.out_client_packages, p, newname), minified);
            iter.preload[idx].src = _path.join(p, pl.src.replace(_path.basename(pl.src), newname));
            writeFile(_path.join(PATHS.out_client_packages, p, 'package.json'), JSON.stringify(iter, null, 2));
          }
        });
      }
    });


    grunt.log.subhead('Writing metadata...');
    var tpl = readFile(_path.join(PATHS.templates, 'packages.js')).toString();
    var content = tpl.replace('%PACKAGES%', JSON.stringify(normalizeManifest(packages), null, 2));
    writeFile(PATHS.out_client_manifest, content);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  module.exports = {
    createConfigurationFiles: createConfigurationFiles,
    createIndex:              createIndex,
    createApacheVhost:        createApacheVhost,
    createApacheHtaccess:     createApacheHtaccess,
    createLighttpdConfig:     createLighttpdConfig,
    createNginxConfig:        createNginxConfig,
    createPackage:            createPackage,

    buildCore:        buildCore,
    buildStandalone:  buildStandalone,
    buildPackages:    buildPackages,
    buildThemes:      buildThemes,
    buildManifest:    buildManifest,
    buildNightly:     buildNightly,
    buildCompressed:  buildCompressed
  };

})(
  require('path'),
  require('node-fs-extra'),
  require('less'),
  require('uglify-js'),
  require('clean-css')
);
