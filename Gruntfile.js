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

(function(_fs, _path, _build, _grunt, _less) {

  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // GRUNT
  /////////////////////////////////////////////////////////////////////////////

  module.exports = function(grunt) {

    grunt.file.defaultEncoding = 'utf-8';

    //
    // Load plugins
    //
    try {
      require('time-grunt')(grunt);
    } catch (e) { }

    // Make sure we only load required modules (ignore warnings)
    var checks = ['test', 'jshint', 'jscs', 'csslint', 'validate_xml', 'mochaTest'];
    checks.forEach(function(k) {
      if ( grunt.cli.tasks.indexOf(k) >= 0 ) {
        grunt.loadNpmTasks('grunt-contrib-jshint');
        grunt.loadNpmTasks('grunt-mocha-test');
        //grunt.loadNpmTasks('grunt-mocha');
        grunt.loadNpmTasks('grunt-jscs');
        grunt.loadNpmTasks('grunt-contrib-csslint');
        grunt.loadNpmTasks('grunt-contrib-validate-xml');
        return false;
      }
      return true;
    });

    if ( grunt.cli.tasks.indexOf('nw') >= 0 ) {
      grunt.loadNpmTasks('grunt-nw-builder');
    }

    if ( grunt.cli.tasks.indexOf('watch') >= 0 ) {
      grunt.loadNpmTasks('grunt-contrib-watch');
    }

    //
    // Load tasks
    //
    grunt.initConfig({
      jshint: {
        options: {
          jshintrc: true
        },
        all: [
          'Gruntfile.js',
          'src/*.js',
          'src/server/node/*.js',
          'src/server/node/**/*.js',
          'src/server/node/node_modules/osjs/*.js',
          'src/client/javascript/*.js',
          'src/client/javascript/**/*.js',
          'src/packages/default/**/*.js',
          '!src/packages/default/Broadway/**',
          '!src/packages/default/**/locales.js',
          '!src/packages/default/**/locale.js'
        ]
      },
      csslint: {
        options: {
          csslintrc: '.csslintrc'
        },
        strict: {
          src: [
            'src/client/stylesheets/*.css',
            '!src/client/stylesheets/gui.css',
            'src/client/themes/fonts/*/*.css',
            'src/client/themes/styles/*/*.css',
            'src/packages/default/*/*.css',
            '!src/packages/default/CoreWM/animations.css'
          ]
        },
        lax: {
          options: {
            'known-properties': false,
            'compatible-vendor-prefixes': false
          },
          src: [
            'src/client/stylesheets/gui.css'
          ]
        }
      },
      mochaTest: {
        test: {
          src: ['test/server/*.js']
        }
      },
      watch: {
        core: {
          files: [
            'src/client/stylesheets/*.css',
            'src/client/javascript/*.js',
            'src/client/javascript/*/*.js'
          ],
          tasks: ['core']
        },
        themes: {
          files: [
            'src/client/stylesheets/*.less',
            'src/client/themes/styles/*/*.less'
          ],
          tasks: ['themes:styles']
        },
        fonts: {
          files: ['src/client/themes/fonts/*/*.css'],
          tasks: ['themes:fonts']
        },
        configs: {
          files: ['src/conf/*.json'],
          tasks: ['config', 'dist-dev-index']
        },
        //packages: { // SHOULD BE RUN MANUALLY. CAN BE WAY TO TIME CONSUMING
        //  files: ['src/packages/*/*.js'],
        //  tasks: ['packages']
        //},
        metadata: {
          files: [
            'src/client/themes/styles/*/metadata.json',
            'src/client/themes/sounds/*/metadata.json',
            'src/client/themes/icons/*/metadata.json',
            'src/packages/*/*/metadata.json'
          ],
          tasks: ['config', 'manifest']
        }
      },
      jscs: {
        src: [
          'Gruntfile.js',
          'src/*.js',
          'src/server/node/*.js',
          'src/server/node/**/*.js',
          'src/server/node/node_modules/osjs/*.js',
          'src/client/javascript/*.js',
          'src/client/javascript/**/*.js',
          'src/packages/default/**/*.js',
          '!src/packages/default/Broadway/**'
        ],
        options: {
          config: '.jscsrc',
          verbose: true,
          fix: false,
          requireCurlyBraces: ['if']
        }
      },
      validate_xml: {
        all: {
          src: [
            'src/client/dialogs.html',
            'src/packages/default/*/scheme.html'
          ]
        }
      },
      nwjs: {
        options: {
          version: '0.12.3',
          //version: '0.13.0-beta2',
          //platforms: ['win', 'linux', 'osx'],
          platforms: ['win64', 'linux64'],
          buildDir: '.nw'
        },
        src: ['src/templates/nw/package.json', '.standalone/**/*']
      }
    });

    grunt.registerTask('clean', 'Clean up all build files', function(arg) {
    });

    grunt.registerTask('config', 'Build config files (or modify `set:path.to.key:value`, `get:path.to.key`, `preload:name:path:type`, `(add|remove)-repository:name)', function(fn, key, value, arg) {
      if ( fn ) {
        var result;
        if ( fn === 'get' ) {
          grunt.log.writeln('Path: ' + key);

          result = _build.getConfigPath(grunt, key);
          grunt.log.writeln('Type: ' + typeof result);
          console.log(result);
        } else if ( fn === 'set' ) {
          grunt.log.writeln('Path: ' + key);

          result = _build.setConfigPath(grunt, key, value);
          console.log(result);
        } else if ( fn === 'preload' ) {
          result = _build.addPreload(grunt, key, value, arg);
          console.log(result);
        } else if ( fn === 'add-repository' ) {
          result = _build.addRepository(grunt, key);
          console.log(result);
        } else if ( fn === 'remove-repository' ) {
          result = _build.removeRepository(grunt, key);
          console.log(result);
        } else {
          throw new TypeError('Invalid config operation \'' + fn + '\'');
        }
        return;
      }

      grunt.log.writeln('Writing configuration files...');
      _build.createConfigurationFiles(grunt, fn);
    });

    grunt.registerTask('core', 'Build dist core files', function(arg) {
      grunt.log.writeln('Building dist...');
      _build.buildCore(grunt, arg);
    });

    grunt.registerTask('standalone', 'Build dist standalone files', function(arg) {
      grunt.log.writeln('Building standalone dist...');
      var done = this.async();
      _build.buildStandalone(grunt, done, arg);
    });

    grunt.registerTask('packages', 'Build dist package files (or a single package, ex: grunt packages:default/About. Also enable/disable)', function(arg, arg2) {
      grunt.log.writeln('Building packages...');
      if ( arg === 'disable' || arg === 'enable' ) {
        _build.togglePackage(grunt, arg2, arg === 'enable');
        return;
      }
      _build.buildPackages(grunt, arg);
    });

    grunt.registerTask('themes', 'Build theme files (arguments: resources, fonts. Or a single theme, ex: grunt themes:MyThemename)', function(arg) {
      grunt.log.writeln('Building themes...');
      var done = this.async();
      _build.buildThemes(grunt, arg, done);
    });

    grunt.registerTask('manifest', 'Generate package manifest file', function(arg) {
      grunt.log.writeln('Building package manifest...');
      _build.buildManifest(grunt, arg);
    });

    grunt.registerTask('compress', 'Compress dist files (arguments: all, core, packages, ex: grunt compress:core)', function(arg) {
      grunt.log.writeln('Compressing dist...');
      _build.buildCompressed(grunt, arg);
    });

    grunt.registerTask('dist-files', 'Generate dist files from template', function(arg) {
      if ( arg ) {
        if ( arg === 'dist' || arg === 'dist-dev' ) {
          _build.createDistFiles(grunt, arg);
        }
      } else {
        _build.createDistFiles(grunt, 'dist');
        _build.createDistFiles(grunt, 'dist-dev');
      }
    });

    grunt.registerTask('apache-vhost', 'Generate Apache vhost configuration file (arguments: [:dist/dist-dev][:output-to-file])', function(dist, outfile) {
      _build.createApacheVhost(grunt, dist, outfile);
    });

    grunt.registerTask('apache-htaccess', 'Generate Apache htaccess file (arguments: [:dist/dist-dev])', function(dist, outfile) {
      _build.createApacheHtaccess(grunt, dist, outfile);
    });

    grunt.registerTask('lighttpd-config', 'Generate Lighttpd configuration file (arguments: [:dist/dist-dev][:output-to-file])', function(dist, outfile) {
      _build.createLighttpdConfig(grunt, dist, outfile);
    });

    grunt.registerTask('nginx-config', 'Generate Nginx configuration file (arguments: [:dist/dist-dev][:output-to-file])', function(dist, outfile) {
      _build.createNginxConfig(grunt, dist, outfile);
    });

    grunt.registerTask('create-package', 'Create a new package/application: [repo/]PackageName[:type] (types: application, iframe, service, extension)', function(arg1, arg2) {
      grunt.log.writeln('Creating package...');
      _build.createPackage(grunt, arg1, arg2);
    });

    grunt.registerTask('create-handler', 'Create a new handler with given name', function(arg1, arg2) {
      grunt.log.writeln('Creating handler...');
      _build.createHandler(grunt, arg1);
    });

    //
    // Register aliases
    //

    grunt.registerTask('all', ['clean', 'config', 'dist-files', 'core', 'themes', 'packages', 'manifest']);
    grunt.registerTask('default', ['all']);
    grunt.registerTask('nw', ['config', 'core:nw', 'themes', 'packages', 'manifest', 'standalone:nw', 'nwjs']);
    grunt.registerTask('dist', ['config', 'dist-files:dist', 'core', 'themes', 'packages', 'manifest']);
    grunt.registerTask('dist-dev', ['config', 'dist-files:dist-dev', 'themes:fonts', 'themes:styles', 'manifest']);
    grunt.registerTask('test', ['jshint', 'jscs', 'csslint', 'validate_xml', 'mochaTest'/*, 'mocha'*/]);
  };

})(require('node-fs-extra'), require('path'), require('./src/build.js'), require('grunt'), require('less'));
