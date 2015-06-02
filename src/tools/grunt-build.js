//'use strict';

(function(_fs, _path, _exec) {
  var NODE_EXE  = 'node';
  var ISWIN     = /^win/.test(process.platform);

  var ROOT      = _path.dirname(_path.join(__dirname, '../'));
  var LESSC     = _path.join(ROOT, 'node_modules/less/bin/lessc');
  var REPOS     = JSON.parse(_fs.readFileSync(_path.join(ROOT, "src", "packages", "repositories.json")));
  var MIMES     = JSON.parse(_fs.readFileSync(_path.join(ROOT, "src", "mime.json")));
  var YUI       = _path.join(ROOT, 'vendor', 'yuicompressor-2.4.8.jar');
  var CC        = _path.join(ROOT, 'vendor', 'closurecompiler.jar');
  var BUILD     = generateBuildConfig();
  var HANDLER   = BUILD.handler || 'demo';

  /////////////////////////////////////////////////////////////////////////////
  // QUEUE
  /////////////////////////////////////////////////////////////////////////////

  function Queue() {
    this.queue = [];
  }
  Queue.prototype.add = function(i) {
    this.queue.push(i);
  };
  Queue.prototype.run = function(cb) {
    var self = this;
    function next() {
      if ( self.queue.length ) {
        self.queue.shift()(function() {
          next();
        });
        return;
      }
      cb();
    }

    next();
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function exec(cmd, cb) {
    cb = cb || function() {};
    if ( typeof cmd === 'array' || (cmd instanceof Array) ) {
      cmd = cmd.join(' ');
    }

    _exec(cmd, function (error, stdout, stderr) {
      cb(error, stdout, stderr);
    });
    return cmd;
  }

  function replaceAll(temp, stringToFind,stringToReplace) {
    var index = temp.indexOf(stringToFind);
    while(index != -1){
      temp = temp.replace(stringToFind,stringToReplace);
      index = temp.indexOf(stringToFind);
    }
    return temp;
  }

  function checkManifest(manifest) {
    if ( !manifest ) {
      throw 'No manifest';
    }
    if ( !manifest.className ) {
      throw 'Missing className';
    }
    if ( typeof manifest === 'string' ) {
      throw 'Invalid manifest';
    }
    if ( manifest['enabled'] === false || manifest['enabled'] === 'false' ) {
      throw 'Disabled';
    }
    return true;
  }

  /////////////////////////////////////////////////////////////////////////////
  // BUILDER CONFIG
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Generates an internal buld.json file from src/conf
   * Works sort of line in some linux applications.
   * Files in directory are loaded in alphabetical order and merged together
   */
  var _cache;
  function generateBuildConfig() {
    var getBuildConfig = (function() {

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

      return function() {

        var path = _path.join(ROOT, 'src', 'conf');
        var tmp = _path.join(path, '000-base.json');
        var config = {};
        var files = getConfigFiles(path);
        files.forEach(function(iter) {
          try {
            var json = JSON.parse(_fs.readFileSync(iter));
            var tjson = JSON.parse(JSON.stringify(config));
            config = mergeObject(tjson, json);
          } catch ( e ) {
            grunt.fail.warn('WARNING: Failed to parse ' + iter.replace(ROOT, ''));
            grunt.fail.warn(e.stack);
          }
        });

        return JSON.parse(JSON.stringify(config));
      };
    })();

    if ( !_cache ) {
      var json = getBuildConfig();
      var build = JSON.stringify(json, null, 2).toString();

      var handler    = json.handler    || "demo";
      var connection = json.connection || "http";
      var rooturi    = "/";
      try {
        rooturi = json.path || "/";
      } catch ( e ) {}

      if ( ISWIN ) {
        build = build.replace(/%ROOT%/g,       ROOT.replace(/(["\s'$`\\])/g,'\\$1'));
      } else {
        build = build.replace(/%ROOT%/g,       ROOT);
      }

      build = build.replace(/%HANDLER%/g,    handler);
      build = build.replace(/%CONNECTION%/g, connection);
      build = build.replace(/%ROOTURI%/g,    rooturi);

      _cache = JSON.parse(build);
    }

    return _cache;
  }

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Returns a list of directories in given path
   */
  function getDirs(dir) {
    var list = [];

    var files = _fs.readdirSync(dir);
    for ( var i = 0; i < files.length; i++ ) {
      if ( files[i].match(/^\./) ) {
        continue;
      }

      if ( _fs.lstatSync(_path.join(dir, files[i])).isDirectory() ) {
        list.push(files[i]);
      }
    }

    return list;
  }

  /**
   * Returns a list of packages of type extension
   */
  function getCoreExtensions() {
    var list = [];
    REPOS.forEach(function(r) {
      var dir = _path.join(ROOT, 'src', 'packages', r);
      getDirs(dir).forEach(function(d) {
        var path = _path.join(dir, d);
        var meta = _path.join(path, 'package.json');
        try {
          var data = JSON.parse(_fs.readFileSync(meta));
          if ( !data || data.enabled === false ) {
            return;
          }
          if ( data && data.type === 'extension' ) {
            data._root = path;
            data._dist = _path.join('packages', r, d);
            list.push(data);
          }
        } catch ( e ) {
          grunt.fail.warn('WARNING: Failed to read metadata of ' + r + ':' + d);
          grunt.fail.warn(e);
        }
      });
    });
    return list;
  }

  /////////////////////////////////////////////////////////////////////////////
  // CODE CONCATER
  /////////////////////////////////////////////////////////////////////////////

  function buildDistCore(headerPath, fileList, type, grunt) {
    var header;

    function _cleanup(path) {
      var src = _fs.readFileSync(path);
      src = src.toString().replace(/\/\*\![\s\S]*?\*\//, "");
      if ( type === 'css' ) {
        src = src.toString().replace('@charset "UTF-8";', "");
      } else {
        src = src.toString().replace(/console\.(log|debug|info|group|groupStart|groupEnd|count)\((.*)\);/g, "");
      }

      src = src.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:^\s*\/\/(?:.*)$)/gm, '');
      src = src.replace(/^\s*[\r\n]/gm, '');

      return src;
    }

    function _concat() {
      var iter, source, data = [];
      for ( var i = 0; i < fileList.length; i++ ) {
        iter = fileList[i];
        grunt.log.writeln('<<< ' + iter);
        try {
          source = _cleanup(iter);
          data.push(source);
        } catch ( e ) {
          grunt.fail.warn('Failed to read file: ' + iter);
        }
      }
      return data.join("\n");
    }

    var header = _fs.readFileSync(headerPath);
    return header + _concat();
  }

  /////////////////////////////////////////////////////////////////////////////
  // CONFIG BUILDER
  /////////////////////////////////////////////////////////////////////////////

  function buildConfig(grunt) {
    var extensions = getCoreExtensions();

    function buildPHPConfig() {
      var root = JSON.parse(JSON.stringify(BUILD.settings));
      var loadExtensions = [];

      var settings = root.backend;
      extensions.forEach(function(e) {
        var p = _path.join(e._root, 'api.php');
        if ( _fs.existsSync(p) ) {
          loadExtensions.push(p);
        }
      });
      if ( loadExtensions ) {
        settings.extensions = loadExtensions;
      }
      try {
        settings.MaxUpload = root.frontend.Core.MaxUploadSize;
      } catch ( exc ) {}

      if ( ISWIN ) {
        Object.keys(settings.vfs).forEach(function(key) {
          if ( typeof settings.vfs[key] === 'string' ) {
            settings.vfs[key] = settings.vfs[key].replace(/\\/g, '/');
          }
        });
      }

      var tmp = _fs.readFileSync(_path.join(ROOT, 'src', 'tools', 'templates', 'settings.php')).toString();
      tmp = tmp.replace('%JSON%', JSON.stringify(settings, null, 4));

      return tmp;
    }


    function buildNodeConfig() {
      var cfg_node = JSON.parse(JSON.stringify(BUILD.settings.backend));

      loadExtensions = [];
      extensions.forEach(function(e) {
        var p = _path.join(e._root, 'api.js');
        if ( _fs.existsSync(p) ) {
          loadExtensions.push(p);
        }
      });
      if ( loadExtensions ) {
        cfg_node.extensions = JSON.stringify(loadExtensions);
      }

      return cfg_node;
    }

    function buildJSConfig() {
      var cfg_js = _fs.readFileSync(_path.join(ROOT, 'src', 'tools', 'templates', 'settings.js')).toString();
      var preloads = [];

      settings = JSON.parse(JSON.stringify(BUILD.settings.frontend));
      if ( settings.Core.Preloads ) {
        Object.keys(settings.Core.Preloads).forEach(function(k) {
          preloads.push(settings.Core.Preloads[k]);
        });
      }

      function get_metadata(path, file, type) {
        var json_path = _path.join(path, "metadata.json");
        if ( _fs.existsSync(json_path) ) {
          try {
            var manifest = JSON.parse(_fs.readFileSync(json_path));

            grunt.verbose.writeln('<<< Added theme "' + file + '" (' + type + ')');

            return manifest;
          } catch ( e ) {
            grunt.log.errorlns('!!! Skipped theme "' + file + '" (' + type + '). Metadata parse failed!');
            grunt.log.errorlns(e);
          }
        }
        return null;
      }

      function scan_themes(pkgdir, type, compact) {
        var files = _fs.readdirSync(pkgdir);
        var file, path, metadata;
        var result = compact ? {} : [];
        for ( var f = 0; f < files.length; f++ ) {
          file = files[f];
          if ( !file.length || file.match(/^\./) ) continue;

          path = _path.join(pkgdir, file);
          if ( _fs.statSync(path).isDirectory() ) {
            metadata = get_metadata(path, file, type);
            if ( metadata !== null ) {
              if ( compact ) {
                result[metadata.name] = metadata.title;
              } else {
                result.push(metadata);
              }
            }
          }
        }
        return result;
      }


      var styles = (function() {
        var src = _path.join(ROOT, 'src', 'themes', 'styles');
        return scan_themes(src, 'style');
      })();

      var sounds = (function() {
        var src = _path.join(ROOT, 'src', 'themes', 'sounds');
        return scan_themes(src, 'sound', true);
      })();

      var icons = (function() {
        var src = _path.join(ROOT, 'src', 'themes', 'icons');
        return scan_themes(src, 'icon', true);
      })();

      var fonts = (function() {
        var list = [];
        var src = _path.join(ROOT, 'src', 'themes', 'fonts');
        getDirs(src).forEach(function(name) {
          if ( !name.match(/^\.|\_/) ) {
            list.push(name);
          }
        });
        return list;
      })();


      settings.Styles = styles;
      settings.Icons = icons;
      settings.Sounds = sounds;
      settings.Fonts.list = fonts.concat(settings.Fonts.list);
      settings.MIME = MIMES.descriptions;
      settings.EXTMIME = MIMES.mapping;
      settings.Core.Repositories = REPOS;
      settings.Core.Preloads = preloads;

      extensions.forEach(function(e) {
        if ( e.sources ) {
          e.sources.forEach(function(ee) {
            ee.src = _path.join('/', e._dist, ee.src);
            settings.Core.Preloads.push(ee);
          });
        }
      });

      return cfg_js.replace("%CONFIG%", JSON.stringify(settings, null, 2));
    }

    return {
      js: buildJSConfig(),
      node: buildNodeConfig(),
      php: buildPHPConfig()
    };
  }

  /////////////////////////////////////////////////////////////////////////////
  // THEME BUILDER
  /////////////////////////////////////////////////////////////////////////////

  function buildStyles(grunt, cb) {
    var q = new Queue();
    var dir  = _path.join(ROOT, 'src', 'themes', 'styles');

    getDirs(dir).forEach(function(name) {
      if ( !name.match(/^\.|\_/) ) {
        q.add(function(next) {
          grunt.log.subhead('* Building theme styles for "' + name + '"');

          // FIXME: THIS IS A HACK!
          if ( ISWIN ) {
            console.log("WARNING!!! WINDOWS IS EXPERIMENTAL! OVERWRITING SOME SYMLINKS WITH FILE COPIES");
            var fixsrc = _path.join(ROOT, 'src', 'stylesheets', 'theme.less');
            var fixdst = _path.join(ROOT, 'src', 'themes', 'styles', name, 'base.less');

            try {
              _fs.removeSync(fixdst);
            } catch ( e ) {}

            try {
              _fs.copySync(fixsrc, fixdst);
            } catch ( e ) {}
          }

          var src  = _path.join(dir, name, 'style.less');
          var dest = _path.join(ROOT, 'dist', 'themes', 'styles', name + '.css');
          var cmd = ([NODE_EXE, LESSC, src, dest]).join(' ');

          grunt.log.writeln('  ' + replaceAll(cmd.toString(), ROOT, ''));
          exec(cmd, function(error, stdout, stderr) {
            if ( error || stderr ) {
              grunt.log.errorlns('!!! An error occured: ' + (error || stderr))
              next();
              return;
            }
            var src  = _path.join(dir, name);
            var dest = _path.join(ROOT, 'dist', 'themes', 'styles', name);

            grunt.log.writeln('  cp ' + src + ' -> ' + dest);

            _fs.copy(src, dest, function() {
              next();
            });
          });
        });
      }
    });

    q.run(function() {
      cb(false);
    });
  }

  function buildFonts(grunt, cb) {
    var dir = _path.join(ROOT, 'src', 'themes', 'fonts');
    var fontStyles = [];
    getDirs(dir).forEach(function(name) {
      if ( !name.match(/^\.|\_/) ) {
        var stylesheet = _path.join(dir, name, 'style.css');
        if ( _fs.existsSync(stylesheet) ) {
          grunt.verbose.subhead('* Building font "' + name + '"');
          fontStyles.push(_fs.readFileSync(stylesheet).toString());
        }
      }
    });

    cb(false, fontStyles.join("\n"));
  }

  /////////////////////////////////////////////////////////////////////////////
  // PACKAGE BUILDER
  /////////////////////////////////////////////////////////////////////////////

  function buildManifest(grunt, dist) {
    var packages = {};

    var rootURI = '/';
    try {
      rootURI = BUILD.path || '/';
    } catch ( e ) {}
    rootURI = rootURI.replace(/\/$/, '') + '/packages';

    function get_metadata(path, file, repo) {
      var json_path = _path.join(path, "package.json");
      try {
        var relpath = _path.basename(path);
        var manifest = JSON.parse(_fs.readFileSync(json_path));

        try {
          checkManifest(manifest, relpath);
        } catch ( e ) {
          console.log("  - \033[0;31mSkipped '" + relpath + "' (" + e + ")\033[0m");
          return null;
        }

        if ( typeof manifest.preload !== 'undefined' && (manifest.preload instanceof Array)) {
          manifest.preload.forEach(function(p, i) {
            if ( !p.src.match(/^(ftp|https?\:)?\/\//) ) {
              manifest.preload[i].src = ([rootURI, repo, file, p.src]).join("/");
            }
          });
        }

        if ( typeof manifest.sources !== 'undefined' && (manifest.sources instanceof Array)) {
          manifest.sources.forEach(function(p, i) {
            if ( !p.src.match(/^(ftp|https?\:)?\/\//) ) {
              manifest.sources[i].src = ([rootURI, repo, file, p.src]).join("/");
            }
          });
        }

        manifest.type = manifest.type || 'application';
        manifest.path = repo + "/" + file;

        if ( manifest.build ) {
          delete manifest.build;
        }

        grunt.log.writeln('  - Added ' + relpath + ' (' + manifest.type + ')');

        return manifest;
      } catch ( e ) {
        grunt.fail.warn('WARNING: Failed to parse ' + file.replace(ROOT, '') + ': ' + e);
      }

      return null;
    }

    function scan_packages(pkgdir, repo) {
      var files = _fs.readdirSync(_path.join(pkgdir, repo));

      var file, path, metadata;
      for ( var f = 0; f < files.length; f++ ) {
        file = files[f];
        if ( !file.length || file.match(/^\./) ) continue;

        path = _path.join(pkgdir, repo, file);
        if ( _fs.statSync(path).isDirectory() ) {
          metadata = get_metadata(path, file, repo);
          if ( metadata !== null ) {
            packages[metadata.className] = metadata;
          }
        }
      }
    }

    var src, repo;
    for ( var i = 0; i < REPOS.length; i++ ) {
      repo = REPOS[i];
      grunt.log.subhead('* Scanning repository "' + repo + '"');
      if ( dist === 'nightly' ) {
        src = _path.join(ROOT, '.nightly', 'packages');
      } else {
        src = _path.join(ROOT, dist, 'packages');
      }
      try {
        scan_packages(src, repo);

      } catch ( e ) {
        grunt.fail.warn('WARNING: Failed to list directory ' + repo + ': ' + e);
      }
    }

    return packages;
  }

  /////////////////////////////////////////////////////////////////////////////
  // PACKAGE BUILDER
  /////////////////////////////////////////////////////////////////////////////

  function buildPackages(grunt, finished) {

    var q = new Queue();

    function build_package(repo, app) {

      q.add(function(cb) {
        var man;

        var src = _path.join(ROOT, 'src', 'packages', repo, app);
        var dir = _path.join(ROOT, 'dist', 'packages', repo, app);

        var newmanpath  = _path.join(dir, "package.json");
        var manpath     = _path.join(src, "package.json");

        grunt.log.subhead('* Building package "' + repo + '/' + app + '"');

        try {
          man = JSON.parse(_fs.readFileSync(manpath));
          checkManifest(man, app);
        } catch ( e ) {
          grunt.fail.warn('WARNING: Failed to parse ' + manpath.replace(ROOT, '') + ': ' + e);
          cb();
          return;
        }

        var copy_files = [];
        if ( man.build && man.build.copy ) {
          copy_files = man.build.copy;
        }
        if ( copy_files.length ) {
          grunt.verbose.writeln('  mkdir ' + dir.replace(ROOT, ''));
          try {
            _fs.mkdirSync(dir);
          } catch ( e ) {}

          copy_files.forEach(function(f) {
            try {
              _fs.mkdirSync(_path.join(dir, _path.dirname(f)));
            } catch ( e ) { }

            var nsrc = _path.join(src, f);
            var ndst = _path.join(dir, f);
            grunt.verbose.writeln('  cp ' + nsrc.replace(ROOT, '') + ' -> ' + ndst.replace(ROOT, ''));
            _fs.copySync(nsrc, ndst);
          });
        } else {
          grunt.verbose.writeln('  cp ' + src.replace(ROOT, '') + ' -> ' + dir.replace(ROOT, ''));
          _fs.copySync(src, dir);
        }

        if ( man.type === 'extension' ) {
          cb();
          return;
        }

        if ( man.preload && man.preload.length ) {
          var combined_js = [];
          var combined_css = [];
          var remove = [];
          var p, r, s;
          var n = [];

          for ( var i = 0; i < man.preload.length; i++ ) {
            s = man.preload[i];
            p = _path.join(dir, s.src);

            if ( ((typeof s.combine !== "undefined" && (s.combine === false || s.combine === "false"))) || s.src.match(/^combined\.(css|js)$/) ) {
              n.push(s);
              continue;
            }

            if ( s.type == "javascript" ) {
              combined_js.push(_fs.readFileSync(p));
              remove.push(p);
            } else if ( s.type == "stylesheet" ) {
              combined_css.push(_fs.readFileSync(p));
              remove.push(p);
            } else {
              n.push(s);
            }
          }

          for ( var r = 0; r < remove.length; r++ ) {
            _fs.unlinkSync(remove[r]);
          }

          if ( combined_css.length ) {
            n.push({type: "stylesheet", src: "combined.css"});
          }
          if ( combined_js.length ) {
            n.push({type: "javascript", src: "combined.js"});
          }

          man.preload = n;

          var odst;

          odst = _path.join(dir, "combined.js");
          grunt.log.writeln('  >>> ' + odst);
          _fs.writeFileSync(odst, combined_js.join("\n"));

          odst = _path.join(dir, "combined.css");
          grunt.log.writeln('  >>> ' + odst);
          _fs.writeFileSync(odst, combined_css.join("\n"));

          grunt.log.writeln('  >>> ' + newmanpath);
          _fs.writeFileSync(newmanpath, JSON.stringify(man, null, 2));
        }

        cb();
      });
    }

    var dirs, repo, src, dst;
    for ( var i = 0; i < REPOS.length; i++ ) {
      try {
        repo = REPOS[i];
        dirs = getDirs(_path.join(ROOT, 'src', 'packages', repo));
        for ( var d = 0; d < dirs.length; d++ ) {
          build_package(repo, dirs[d]);
        }

        q.add(function(cb) {
          src = _path.join(ROOT, 'src', 'packages', repo, 'repository.json');
          dst = _path.join(ROOT, 'dist', 'packages', repo, 'repository.json');
          grunt.log.writeln('\n>>> ' + dst);
          _fs.copySync(src, dst);

          cb();
        });

      } catch ( e ) {
        grunt.fail.warn('WARNING: Failed to list directory ' + REPOS[i] + ': ' + e);
      }
    }

    q.run(function() {
      finished();
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // WEB SERVER CONFIG GENERATION
  /////////////////////////////////////////////////////////////////////////////

  function generateNginxConfig(dist) {
    var mimes = [];
    var maps = MIMES.mapping;
    Object.keys(maps).forEach(function(i) {
      if ( !i.match(/^\./) ) { return; }
      mimes.push('        ' + maps[i] + ' ' + i.replace(/^\./, '') + ';');
    });
    mimes = mimes.join('\n');

    var src = _path.join(ROOT, 'src', 'tools', 'templates', 'nginx.conf');
    var tpl = _fs.readFileSync(src).toString();
    tpl = tpl.replace(/%DISTDIR%/, _path.join(ROOT, dist));
    tpl = tpl.replace(/%MIMES%/, mimes);

    return tpl;
  }

  function generateLighttpdConfig(dist) {
    var mimes = [];
    var maps = MIMES.mapping;
    Object.keys(maps).forEach(function(i) {
      if ( !i.match(/^\./) ) { return; }
      mimes.push('  "' + i + '" => "' + maps[i] + '"');
    });
    mimes = mimes.join(',\n');

    var src = _path.join(ROOT, 'src', 'tools', 'templates', 'lighttpd.conf');
    var tpl = _fs.readFileSync(src).toString();
    tpl = tpl.replace(/%DISTDIR%/, _path.join(ROOT, dist));
    tpl = tpl.replace(/%MIMES%/, mimes);

    return tpl;
  }

  function generateApacheHtaccess(grunt, a) {
    var mimes = [];
    var maps = MIMES.mapping;
    var rootURI = '/';

    for ( var i in maps ) {
      if ( maps.hasOwnProperty(i) ) {
        if ( !i.match(/^\./) ) { continue; }
        mimes.push('  AddType ' + maps[i] + ' ' + i);
      }
    }
    mimes = mimes.join('\n');

    try {
      rootURI = BUILD.path || '/';
    } catch ( e ) {}

    function generate_htaccess(t, d) {
      var src = _path.join(ROOT, 'src', 'tools', 'templates', t);
      var dst = _path.join(ROOT, d, '.htaccess');
      var tpl = _fs.readFileSync(src).toString();
      tpl = tpl.replace(/%MIMES%/, mimes);
      tpl = tpl.replace(/%ROOTURI%/g, rootURI);

      grunt.log.writeln('>>> ' + dst);
      _fs.writeFileSync(dst, tpl);
    }

    var out = [];
    if ( a ) {
      out.push(generate_htaccess('apache-prod-htaccess.conf', a));
    } else {
      out.push(generate_htaccess('apache-prod-htaccess.conf', 'dist'));
      out.push(generate_htaccess('apache-dev-htaccess.conf', 'dist-dev'));
    }

    return out.join("\n");
  }

  function generateApacheVhost(grunt, dist) {
    var src = _path.join(ROOT, 'src', 'tools', 'templates', 'apache-vhost.conf');
    var tpl = _fs.readFileSync(src).toString();
    tpl = tpl.replace(/%DISTDIR%/, _path.join(ROOT, dist));
    return tpl;
  }

  /////////////////////////////////////////////////////////////////////////////
  // INDEX.HTML GENERATOR
  /////////////////////////////////////////////////////////////////////////////

  function generateIndex(grunt) {
    var tpl = _fs.readFileSync(_path.join(ROOT, 'src', 'tools', 'templates', 'index.html')).toString();

    var script_list = [];
    var style_list = [];
    BUILD.javascript.files.forEach(function(i) {
      script_list.push(i.replace('src/javascript', 'js'));
    });
    BUILD.stylesheets.files.forEach(function(i) {
      style_list.push(i.replace('src/stylesheets', 'css'));
    });

    var styles = [];
    var scripts = [];
    script_list.forEach(function(i) {
      scripts.push('    <script type="text/javascript" charset="utf-8" src="/' + i + '"></script>');
    });
    style_list.forEach(function(i) {
      styles.push('    <link type="text/css" rel="stylesheet" href="/' + i + '" />');
    });

    tpl = replaceAll(tpl, "%STYLES%", styles.join('\n'));
    tpl = replaceAll(tpl, "%SCRIPTS%", scripts.join('\n'));

    return tpl;
  }

  /////////////////////////////////////////////////////////////////////////////
  // COMPRESSION
  /////////////////////////////////////////////////////////////////////////////

  function doCompress(grunt, finished) {
    var q = new Queue();

    function compress_css(src, dest, cb) {
      dest = dest || src;
      var cmd = ['java', '-jar', YUI, '--type css', '--charset utf-8', src, '-o', dest];
      exec(cmd, cb);
    }

    function compress_js(src, dest, cb) {
      dest = dest || src;
      var cmd = ['java', '-jar', CC, '--charset utf-8', '--js', src, '--js_output_file', dest];
      exec(cmd, cb);
    }

    function compress_package(repo, app) {
      q.add(function(cb) {
        grunt.log.writeln('* ' + repo + '/' + app);
        cb();
      });

      q.add(function(cb) {
        var src = _path.join(ROOT, 'dist', 'packages', repo, app, 'combined.js');
        var dst = _path.join(ROOT, 'dist', 'packages', repo, app, 'combined.tmp.js');
        compress_js(src, dst, cb);
      });
        q.add(function(cb) {
          var src = _path.join(ROOT, 'dist', 'packages', repo, app, 'combined.tmp.js');
          var dst = _path.join(ROOT, 'dist', 'packages', repo, app, 'combined.js');
          try {
            _fs.renameSync(src, dst);
          } catch ( e ) {
            grunt.log.errorlns('!!! An error occured: ' + e)
          }
          cb();
        });

      q.add(function(cb) {
        var src = _path.join(ROOT, 'dist', 'packages', repo, app, 'combined.css');
        var dst = _path.join(ROOT, 'dist', 'packages', repo, app, 'combined.tmp.css');
        compress_css(src, dst, cb);
      });
        q.add(function(cb) {
          var src = _path.join(ROOT, 'dist', 'packages', repo, app, 'combined.tmp.css');
          var dst = _path.join(ROOT, 'dist', 'packages', repo, app, 'combined.css');
          try {
            _fs.renameSync(src, dst);
          } catch ( e ) {
            grunt.log.errorlns(e);
          }
          cb();
        });
    }


    grunt.log.subhead('Compressing Core');

    var out_css = _path.join(ROOT, BUILD.stylesheets.output);
    q.add(function(cb) {
      var src = out_css;
      var dst = out_css.replace(/\.css$/, '.tmp.css');
      compress_css(src, dst, cb);
    });
      q.add(function(cb) {
        var src = out_css.replace(/\.css$/, '.tmp.css');
        var dst = out_css;
        grunt.log.writeln('>>> ' + dst);
        _fs.renameSync(src, dst);
        cb();
      });

    var out_js = _path.join(ROOT, BUILD.javascript.output);
    q.add(function(cb) {
      var src = out_js;
      var dst = out_js.replace(/\.js$/, '.tmp.js');
      compress_js(src, dst, cb);
    });
      q.add(function(cb) {
        var src = out_js.replace(/\.js$/, '.tmp.js');
        var dst = out_js;
        grunt.log.writeln('>>> ' + dst);
        _fs.renameSync(src, dst);
        cb();
      });

    q.add(function(cb) {
      grunt.log.subhead('Compressing Packages');
      var dirs;
      for ( var i = 0; i < REPOS.length; i++ ) {
        dirs = getDirs(_path.join(ROOT, 'src', 'packages', REPOS[i]));
        for ( var d = 0; d < dirs.length; d++ ) {
          compress_package(REPOS[i], dirs[d]);
        }
      }

      cb();
    });

    q.run(finished);
  }

  /////////////////////////////////////////////////////////////////////////////
  // CREATE PACKAGE
  /////////////////////////////////////////////////////////////////////////////

  function createPackage(grunt, name, finished) {
    var repo = repo || 'default';

    var src = _path.join(ROOT, 'src', 'tools', 'templates', 'package');
    var dst = _path.join(ROOT, 'src', 'packages', repo, name);

    if ( !_fs.existsSync(src) ) {
      finished('Template not found!');
      return;
    }

    if ( _fs.existsSync(dst) ) {
      finished('Package already exist!');
      return;
    }

    function rep(file) {
      var c = _fs.readFileSync(file).toString();
      c = replaceAll(c, 'EXAMPLE', name);
      _fs.writeFileSync(file, c);
    }

    _fs.copySync(src, dst);

    rep(_path.join(dst, 'main.js'));
    rep(_path.join(dst, 'main.css'));
    rep(_path.join(dst, 'package.json'));

    finished();
  }

  /////////////////////////////////////////////////////////////////////////////
  // NIGHTLY BUILD
  /////////////////////////////////////////////////////////////////////////////

  function createNightly(grunt, callback) {
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
      'osjs-logo.png',
      'packages.js',
      'settings.js'
    ];

    var dest = _path.join(ROOT, '.nightly');
    _fs.mkdirSync(_path.join(dest, 'themes'));
    _fs.mkdirSync(_path.join(dest, 'vendor'));
    _fs.mkdirSync(_path.join(dest, 'packages'));
    _fs.mkdirSync(_path.join(dest, 'packages', 'default'));
    _fs.copySync(_path.join(ROOT, 'README.md'), _path.join(dest, 'README.md'));
    _fs.copySync(_path.join(ROOT, 'LICENSE'), _path.join(dest, 'LICENSE'));
    _fs.copySync(_path.join(ROOT, 'AUTHORS'), _path.join(dest, 'AUTHORS'));

    list.forEach(function(src) {
      var dst = _path.join(dest, src);
      src = _path.join(ROOT, 'dist', src);

      grunt.log.writeln('cp ' + src + ' -> ' + dst);

      _fs.copySync(src, dst);
    });

    callback();
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  module.exports = {
    ROOT: ROOT,
    LESSC: LESSC,
    REPOS: REPOS,
    MIMES: MIMES,
    YUI: YUI,
    CC: CC,
    BUILD: BUILD,
    HANDLER: HANDLER,
    ISWIN: ISWIN,

    getDirs: getDirs,

    createPackage: createPackage,

    buildDistCore: buildDistCore,
    buildConfig: buildConfig,
    buildStyles: buildStyles,
    buildFonts: buildFonts,
    buildPackages: buildPackages,
    buildManifest: buildManifest,
    compress: doCompress,
    createNightly: createNightly,

    generateLighttpdConfig: generateLighttpdConfig,
    generateApacheHtaccess: generateApacheHtaccess,
    generateApacheVhost: generateApacheVhost,
    generateNginxConfig: generateNginxConfig,
    generateIndex: generateIndex
  };

})(require('node-fs-extra'), require('path'), require('child_process').exec);
