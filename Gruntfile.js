/*!
 * OS.js - JavaScript Operating System
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

    try {
      require('time-grunt')(grunt);
    } catch (e) { }

    grunt.file.defaultEncoding = 'utf-8';

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    //grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jscs');
    //grunt.loadNpmTasks('grunt-html-validation');
    grunt.loadNpmTasks('grunt-nw-builder');

    grunt.initConfig({
      jshint: {
        options: {
          globals: {
            OSjs: true,
            zip: true,
            alert: true
          },
          browser: true,
          curly: true,
          bitwise: false,
          eqeqeq: true,
          newcap: true,
          noarg: true,
          noempty: true,
          nonew: true,
          sub: true,
          undef: true,
          unused: false,
          nonbsp: true,
          trailing: true,
          boss: true,
          eqnull: true,
          strict: true,
          immed: true,
          expr: true,
          latedef: 'nofunc',
          quotmark: 'single',
          indent: 2,
          node: true,
          maxerr: 9999
        },
        all: [
          'Gruntfile.js',
          'src/*.js',
          'src/client/javascript/*.js',
          'src/client/javascript/**/*.js',
          'src/packages/default/**/*.js',
          '!src/packages/default/Broadway/**',
          '!src/packages/default/**/locales.js',
          '!src/packages/default/**/locale.js',
          '!src/packages/default/Calculator/main.js'
        ]
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
            'src/packages/*/*/package.json'
          ],
          tasks: ['config', 'manifest']
        }
      },
      jscs: {
        src: [
          'Gruntfile.js',
          'src/*.js',
          'src/client/javascript/*.js',
          'src/client/javascript/**/*.js',
          'src/packages/default/**/*.js',
          '!src/packages/default/Broadway/**',
          '!src/packages/default/Calculator/main.js'
        ],
        options: {
          config: '.jscsrc',
          verbose: true,
          fix: false,
          requireCurlyBraces: ['if']
        }
      },/*
      validation: {
        options: {
          wrapfile: 'src/templates/validation.html',
          stoponerror: false,
          relaxerror: [
          ]
        },
        files: {
          src: [
            'src/packages/default/ ** /scheme.html',
            'src/client/dialogs.html'
          ]
        }
      }
      */
      nwjs: {
        options: {
          version: '0.12.3',
          platforms: ['win', 'osx'],
          buildDir: '.nw'
        },
        src: ['src/templates/nw/package.json', '.standalone/**/*']
      }
    });

    /**
     * Task: Clean
     */
    grunt.registerTask('clean', 'Clean up all build files', function(arg) {
    });

    /**
     * Task: Build config
     */
    grunt.registerTask('config', 'Build config files (or modify `set:path.to.key:value`, `get:path.to.key`, `preload:name:path:type`)', function(fn, key, value, arg) {
      if (fn) {
        var result;
        if (fn === 'get') {
          grunt.log.writeln('Path: ' + key);

          result = _build.getConfigPath(grunt, key);
          grunt.log.writeln('Type: ' + typeof result);
          console.log(result);
          console.log();
        } else if (fn === 'set') {
          grunt.log.writeln('Path: ' + key);

          result = _build.setConfigPath(grunt, key, value);
          console.log(result);
        } else if (fn === 'preload') {
          result = _build.addPreload(grunt, key, value, arg);
          console.log(result);
        } else {
          throw new TypeError('Invalid config operation \'' + fn + '\'');
        }
        return;
      }

      grunt.log.writeln('Writing configuration files...');
      _build.createConfigurationFiles(grunt, fn);
    });

    /**
     * Task: View config
     */
    grunt.registerTask('view-config', '(Pre)view the generated config file', function(arg) {
      console.log(JSON.stringify(_build.getConfig(grunt), null, 4));
    });

    /**
     * Task: Build core
     */
    grunt.registerTask('core', 'Build dist core files', function(arg) {
      grunt.log.writeln('Building dist...');
      _build.buildCore(grunt, arg);
    });

    /**
     * Task: Build Standalone
     */
    grunt.registerTask('standalone', 'Build dist standalone files', function(arg) {
      grunt.log.writeln('Building standalone dist...');
      _build.buildStandalone(grunt, arg);
    });

    /**
     * Task: Build packages
     */
    grunt.registerTask('packages', 'Build dist package files (or a single package, ex: grunt packages:default/About)', function(arg) {
      grunt.log.writeln('Building packages...');
      _build.buildPackages(grunt, arg);
    });

    /**
     * Task: Build themes
     */
    grunt.registerTask('themes', 'Build theme files (arguments: resources, fonts. Or a single theme, ex: grunt themes:MyThemename)', function(arg) {
      grunt.log.writeln('Building themes...');
      var done = this.async();
      _build.buildThemes(grunt, arg, done);
    });

    /**
     * Task: Build manifests
     */
    grunt.registerTask('manifest', 'Generate package manifest file', function(arg) {
      grunt.log.writeln('Building package manifest...');
      _build.buildManifest(grunt, arg);
    });

    /**
     * Task: Compress build
     */
    grunt.registerTask('compress', 'Compress dist files (arguments: all, core, packages, ex: grunt compress:core)', function(arg) {
      grunt.log.writeln('Compressing dist...');
      _build.buildCompressed(grunt, arg);
    });

    /**
     * Task: Generate index.html
     */
    grunt.registerTask('dist-index', 'Generate dist index.html', function(arg) {
      grunt.log.writeln('Generating dist/index.html...');
      _build.createIndex(grunt, arg, 'dist');
    });

    /**
     * Task: Generate index.html
     */
    grunt.registerTask('dist-dev-index', 'Generate dist-dev index.html', function(arg) {
      grunt.log.writeln('Generating dist-dev/index.html...');
      _build.createIndex(grunt, arg, 'dist-dev');
    });

    /**
     * Task: Generate Apache vhost
     */
    grunt.registerTask('apache-vhost', 'Generate Apache vhost configuration file (arguments: [:dist/dist-dev][:output-to-file])', function(dist, outfile) {
      _build.createApacheVhost(grunt, dist, outfile);
    });

    /**
     * Task: Generate Apache htaccess
     */
    grunt.registerTask('apache-htaccess', 'Generate Apache htaccess file (arguments: [:dist/dist-dev])', function(dist, outfile) {
      _build.createApacheHtaccess(grunt, dist, outfile);
    });

    /**
     * Task: Generate Lighttpd config
     */
    grunt.registerTask('lighttpd-config', 'Generate Lighttpd configuration file (arguments: [:dist/dist-dev][:output-to-file])', function(dist, outfile) {
      _build.createLighttpdConfig(grunt, dist, outfile);
    });

    /**
     * Task: Generate Nginx config
     */
    grunt.registerTask('nginx-config', 'Generate Nginx configuration file (arguments: [:dist/dist-dev][:output-to-file])', function(dist, outfile) {
      _build.createNginxConfig(grunt, dist, outfile);
    });

    /**
     * Task: Create a new package
     */
    grunt.registerTask('create-package', 'Create a new package/application: [repo/]PackageName[:type] (types: application, iframe, service, extension)', function(arg1, arg2) {
      grunt.log.writeln('Creating package...');
      _build.createPackage(grunt, arg1, arg2);
    });

    /**
     * Task: Create a nightly build
     */
    grunt.registerTask('create-nightly-build', 'Creates a new OS.js nightly zip distribution', function(arg) {
      grunt.log.writeln('Building nightly...');
      _build.buildNightly(grunt, arg);
    });

    grunt.registerTask('all', ['clean', 'config', 'dist-dev-index', 'dist-index', 'core', 'themes', 'packages', 'manifest']);
    grunt.registerTask('default', ['all']);
    grunt.registerTask('dist', ['config', 'dist-index', 'core', 'themes', 'packages', 'manifest']);
    grunt.registerTask('dist-dev', ['config', 'dist-dev-index', 'themes:fonts', 'themes:styles', 'manifest']);
    grunt.registerTask('test', ['jshint', 'jscs', 'mochaTest'/*, 'mocha'*/]);
  };

})(require('node-fs-extra'), require('path'), require('./src/build.js'), require('grunt'), require('less'));
