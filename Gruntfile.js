'use strict';

(function(_fs, _path, _build) {
  var ROOT  = _build.ROOT;
  var BUILD = _build.BUILD;

  /////////////////////////////////////////////////////////////////////////////
  // GRUNT
  /////////////////////////////////////////////////////////////////////////////

  module.exports = function(grunt) {

    function clean(remove, mkdir) {
      remove = remove || [];
      mkdir = mkdir || [];

      remove.forEach(function(i) {
        grunt.verbose.writeln('rm ' + i);
        _fs.removeSync(i);
      });
      mkdir.forEach(function(i) {
        grunt.verbose.writeln('mkdir ' + i);
        _fs.mkdirSync(i);
      });
    }

    grunt.file.defaultEncoding = 'utf-8';

    grunt.initConfig({
    });

    /**
     * Task: Clean
     */
    grunt.registerTask('clean', 'Clean up all build files', function(arg) {
      var remove = [
        BUILD.javascript.output,
        BUILD.stylesheets.output,
        'dist/packages.json',
        'dist/packages.js',
        'dist-dev/packages.json',
        'dist-dev/packages.js',
        'dist/packages',
        'dist/themes'
      ];

      var mkdir = [
        'dist/packages',
        'dist/themes'
      ];

      clean(remove, mkdir);

      grunt.verbose.ok();
    });

    /**
     * Task: Build config
     */
    grunt.registerTask('config', 'Build config files', function(arg) {
      var cfg = _build.buildConfig(grunt);
      var dest;

      dest = _path.join(ROOT, 'src', 'server-php', 'settings.php');
      grunt.log.writeln('>>> ' + dest);
      _fs.writeFileSync(dest, cfg.php);

      dest = _path.join(ROOT, 'src', 'server-node', 'settings.json');
      grunt.log.writeln('>>> ' + dest);
      _fs.writeFileSync(dest, JSON.stringify(cfg.node));

      dest = _path.join(ROOT, 'dist', 'settings.js');
      grunt.log.writeln('>>> ' + dest);
      _fs.writeFileSync(dest, cfg.js);

      grunt.verbose.ok();
    });

    /**
     * Task: Build core
     */
    grunt.registerTask('core', 'Build dist core files', function(arg) {

      grunt.log.writeln('Building JavaScript core');
      var hjs = _path.join(ROOT, 'src', 'tools', 'templates', 'dist-header.js');
      var ojs = _build.buildDistCore(hjs, BUILD.javascript.files, 'js', grunt);
      grunt.log.writeln('>>> ' + BUILD.javascript.output);
      _fs.writeFileSync(_path.join(ROOT, BUILD.javascript.output), ojs);

      grunt.log.writeln('');

      grunt.log.writeln('Building JavaScript locales');
      var hjs = _path.join(ROOT, 'src', 'tools', 'templates', 'dist-header.js');
      var ojs = _build.buildDistCore(hjs, BUILD.locales.files, 'js', grunt);
      grunt.log.writeln('>>> ' + BUILD.locales.output);
      _fs.writeFileSync(_path.join(ROOT, BUILD.locales.output), ojs);

      grunt.log.writeln('');

      grunt.log.writeln('Building Stylesheets');
      var hcss = _path.join(ROOT, 'src', 'tools', 'templates', 'dist-header.css');
      var ocss = _build.buildDistCore(hcss, BUILD.stylesheets.files, 'css', grunt);
      grunt.log.writeln('>>> ' + BUILD.stylesheets.output);
      _fs.writeFileSync(_path.join(ROOT, BUILD.stylesheets.output), ocss);

      grunt.verbose.ok();
    });

    /**
     * Task: Build packages
     */
    grunt.registerTask('packages', 'Build dist package files', function(arg) {
      clean(['dist/packages'], ['dist/packages']);

      var done = this.async();
      function finished() {
        grunt.verbose.ok();
        done();
      }

      _build.buildPackages(grunt, finished);
    });

    /**
     * Task: Build themes
     */
    grunt.registerTask('themes', 'Build theme files', function(arg) {
      var done = this.async();
      function finished() {
        var src, dst;

        grunt.log.subhead('Copying static files');

        src = _path.join(ROOT, 'src', 'themes', 'wallpapers');
        dst = _path.join(ROOT, 'dist', 'themes', 'wallpapers');
        grunt.log.writeln('  cp '  + src + ' -> ' + dst);
        _fs.copySync(src, dst);

        src = _path.join(ROOT, 'src', 'themes', 'icons');
        dst = _path.join(ROOT, 'dist', 'themes', 'icons');
        grunt.log.writeln('  cp '  + src + ' -> ' + dst);
        _fs.copySync(src, dst);

        src = _path.join(ROOT, 'src', 'themes', 'fonts');
        dst = _path.join(ROOT, 'dist', 'themes', 'fonts');
        grunt.log.writeln('  cp '  + src + ' -> ' + dst);
        _fs.copySync(src, dst);

        src = _path.join(ROOT, 'src', 'themes', 'sounds');
        dst = _path.join(ROOT, 'dist', 'themes', 'sounds');
        grunt.log.writeln('  cp '  + src + ' -> ' + dst);
        _fs.copySync(src, dst);

        grunt.log.subhead('Cleaning up');

        src = _path.join(ROOT, 'dist', 'themes', 'styles');
        _build.getDirs(src).forEach(function(dir) {
          (['metadata.json', 'style.less', 'base.less']).forEach(function(i) {
            dst = _path.join(src, dir, i);
            grunt.log.writeln('  rm '  + dst);
            _fs.removeSync(dst);
          });
        });

        src = _path.join(ROOT, 'dist', 'themes', 'fonts');
        _build.getDirs(src).forEach(function(dir) {
          dst = _path.join(src, dir, 'style.css');
          grunt.log.writeln('  rm '  + dst);
          _fs.removeSync(dst);
        });

        (['sounds', 'icons']).forEach(function(i) {
          src = _path.join(ROOT, 'dist', 'themes', i);
          _build.getDirs(src).forEach(function(dir) {
            dst = _path.join(src, dir, 'metadata.json');
            grunt.log.writeln('  rm '  + dst);
            _fs.removeSync(dst);
          });
        });

        done();
      }

      clean(['dist/themes'], ['dist/themes', 'dist/themes/styles']);

      grunt.log.subhead('Building fonts');
      _build.buildFonts(grunt, function(err, result) {
        if ( err ) {
          grunt.log.errorlns('An error occured while building fonts');
          grunt.log.errorlns(err);

          finished();
          return;
        } else {
          var dest = _path.join(ROOT, 'dist', 'themes', 'fonts.css');
          grunt.log.writeln('>>> ' + dest);
          _fs.writeFileSync(dest, result);
        }

        grunt.log.subhead('Building styles');
        _build.buildStyles(grunt, function(err) {
          if ( err ) {
            grunt.log.errorlns('An error occured while building styles');
            grunt.log.errorlns(err);
            finished();
            return;
          }
          grunt.verbose.ok();
          finished();
        });
      });
    });

    /**
     * Task: Build manifests
     */
    grunt.registerTask('manifest', 'Generate package manifest file', function(arg) {
      clean(['dist/packages.json', 'dist-dev/packages.json']);

      function generate(dist) {
        grunt.log.subhead('Generating package manifest for "' + dist + '"');

        var packages = _build.buildManifest(grunt, dist);
        var dest = _path.join(ROOT, dist, 'packages.js');
        var tpl = _fs.readFileSync(_path.join(ROOT, 'src', 'tools', 'templates', 'packages.js')).toString();
        var out = tpl.replace("%PACKAGES%", JSON.stringify(packages, null, 2));

        grunt.log.writeln('>>> ' + dest);
        _fs.writeFileSync(dest, out);
      }

      (['dist', 'dist-dev']).forEach(function(d) {
        generate(d);
      });
      grunt.verbose.ok();
    });

    /**
     * Task: Compress build
     */
    grunt.registerTask('compress', 'Compress dist files', function(arg) {
      var done = this.async();
      function finished() {
        grunt.verbose.ok();
        done();
      }
      _build.compress(grunt, finished);
    });

    /**
     * Task: Generate index.html
     */
    grunt.registerTask('dist-dev-index', 'Generate dist-dev index.html', function(arg) {
      var index = _build.generateIndex(grunt);
      var dest = _path.join(ROOT, 'dist-dev', 'index.html');
      grunt.log.writeln('>>> ' + dest);
      _fs.writeFileSync(dest, index);
    });

    /**
     * Task: Generate Apache vhost
     */
    grunt.registerTask('apache-vhost', 'Generate Apache vhost configuration file', function(arg) {
      var dist = arg || 'dist';
      var config = _build.generateApacheVhost(grunt, dist);
      console.log('\n' + config + '\n');
      grunt.verbose.ok();
    });

    /**
     * Task: Generate Apache htaccess
     */
    grunt.registerTask('apache-htaccess', 'Generate Apache htaccess file', function(arg) {
      var config = _build.generateApacheHtaccess(grunt, arg);
      console.log('\n' + config + '\n');
      grunt.verbose.ok();
    });

    /**
     * Task: Generate Lighttpd config
     */
    grunt.registerTask('lighttpd-config', 'Generate Lighttpd configuration file', function(arg) {
      var dist = arg || 'dist';
      var config = _build.generateLighttpdConfig(dist);
      console.log('\n' + config + '\n');
      grunt.verbose.ok();
    });

    /**
     * Task: Generate Nginx config
     */
    grunt.registerTask('nginx-config', 'Generate Nginx configuration file', function(arg) {
      var dist = arg || 'dist';
      var config = _build.generateNginxConfig(dist);
      console.log('\n' + config + '\n');
      grunt.verbose.ok();
    });

    /**
     * Task: Create a new package
     */
    grunt.registerTask('create-package', 'Create a new package/application', function(arg) {
      var done = this.async();
      if ( !arg ) {
        grunt.log.error('Expects an argument. Example: MyPackageName');
        done();
        return;
      }

      _build.createPackage(grunt, arg, function(err) {
        if ( err ) {
          grunt.log.error('Failed to create package: ' + err);
          done();
          return;
        }

        done();
        grunt.verbose.ok();
      });

    });

    /**
     * Task: Create a nightly build
     */
    grunt.registerTask('create-nightly-build', 'Creates a new OS.js nightly zip distribution', function(arg) {
      clean(['.nightly'], ['.nightly']);

      function generate(dist) {
        var packages = _build.buildManifest(grunt, 'nightly');
        var dest = _path.join(ROOT, '.nightly', 'packages.js');
        var tpl = _fs.readFileSync(_path.join(ROOT, 'src', 'tools', 'templates', 'packages.js')).toString();
        var out = tpl.replace("%PACKAGES%", JSON.stringify(packages, null, 2));

        grunt.log.writeln('>>> ' + dest);
        _fs.writeFileSync(dest, out);
      }


      var done = this.async();
      _build.createNightly(grunt, function(err) {
        if ( err ) {
          grunt.log.error('Failed to create nightly: ' + err);
          done();
          return;
        }

        generate();
        done();
        grunt.verbose.ok();
      });
    });


    grunt.registerTask('all', ['clean', 'config', 'core', 'themes', 'packages', 'manifest']);
    grunt.registerTask('default', ['all']);
  };
})(require('node-fs-extra'), require('path'), require('./src/tools/grunt-build.js'));
