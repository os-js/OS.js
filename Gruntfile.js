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
(function(_fs, _path, _build, _grunt) {
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

    if ( grunt.option('nw') ) {
      grunt.loadNpmTasks('grunt-nw-builder');
    }

    // Make sure we only load required modules (ignore warnings)
    var checks = ['test', 'eslint', 'csslint', 'validate_xml', 'mochaTest'];
    checks.forEach(function(k) {
      if ( grunt.cli.tasks.indexOf(k) >= 0 ) {
        grunt.loadNpmTasks('grunt-eslint');
        grunt.loadNpmTasks('grunt-mocha-test');
        //grunt.loadNpmTasks('grunt-mocha');
        grunt.loadNpmTasks('grunt-contrib-csslint');
        grunt.loadNpmTasks('grunt-contrib-validate-xml');
        return false;
      }
      return true;
    });

    if ( grunt.cli.tasks.indexOf('watch') >= 0 ) {
      grunt.loadNpmTasks('grunt-contrib-watch');
    }

    //
    // Load tasks
    //
    grunt.initConfig({
      eslint: {
        options: {
          configFile: '.eslintrc'
        },
        target: [
          'Gruntfile.js',
          'src/*.js',
          'src/server/node/*.js',
          'src/server/node/**/*.js',
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
            '!src/client/stylesheets/debug.css',
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
            'src/client/stylesheets/gui.css',
            'src/client/stylesheets/debug.css'
          ]
        }
      },
      mochaTest: {
        test: {
          src: ['src/server/test/node/*.js']
        }
      },
      watch: {
        core: {
          files: [
            'src/client/stylesheets/*.css',
            'src/client/javascript/*.js',
            'src/client/javascript/*/*.js'
          ],
          tasks: ['build:core']
        },
        themes: {
          files: [
            'src/client/stylesheets/*.less',
            'src/client/themes/styles/*/*.less',
            'src/client/themes/fonts/*/*.css'
          ],
          tasks: ['build:themes']
        },
        configs: {
          files: ['src/conf/*.json'],
          tasks: ['build:config', 'build:core']
        },
        metadata: {
          files: [
            'src/client/themes/styles/*/metadata.json',
            'src/client/themes/sounds/*/metadata.json',
            'src/client/themes/icons/*/metadata.json',
            'src/packages/*/*/metadata.json'
          ],
          tasks: ['build:config', 'build:manifest']
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

    //
    // BUILD TASKS
    //

    grunt.registerTask('clean', 'Clean up all build files', function(arg) {
    });

    grunt.registerTask('build', 'Builds OS.js', function(arg) {
      _build.build(grunt, arg, this.async());
    });

    grunt.registerTask('generate', 'Generates configuration files etc.', function(arg) {
      _build.generate(grunt, arg, this.async());
    });

    grunt.registerTask('config', 'Modify and build config files', function(arg) {
      if ( arg ) {
        _build.config(grunt, arg, this.async());
      } else {
        _build.build(grunt, 'config', this.async());
      }
    });

    //
    // DEPRECATED TASKS
    //

    grunt.registerTask('core', '(DEPRECATED) Build dist core files', function(arg) {
      grunt.log.writeln('This task is deprecated. Please start using "grunt build:core" instead.'['yellow'].bold);
      _build.build(grunt, 'core', this.async());
    });

    grunt.registerTask('packages', '(DEPRECATED) Builds package(s)', function(arg) {
      if ( arg ) {
        grunt.log.writeln('This task is deprecated. Please start using "grunt build:package --name=REPO/NAME" instead.'['yellow'].bold);
        _build.build(grunt, 'package', this.async(), {
          name: arg
        });
      } else {
        grunt.log.writeln('This task is deprecated. Please start using "grunt build:packages" instead.'['yellow'].bold);
        _build.build(grunt, 'packages', this.async());
      }
    });

    grunt.registerTask('themes', '(DEPRECATED) Build theme files', function(arg) {
      grunt.log.writeln('This task is deprecated. Please start using "grunt build:themes" instead.'['yellow'].bold);
      _build.build(grunt, 'themes', this.async());
    });

    grunt.registerTask('manifest', '(DEPRECATED) Generate package manifest file', function(arg) {
      grunt.log.writeln('This task is deprecated. Please start using "grunt build:manifest" instead.'['yellow'].bold);
      _build.build(grunt, 'manifest', this.async());
    });

    grunt.registerTask('dist-files', '(DEPRECATED) Generate dist files from template', function(arg) {
      grunt.log.writeln('This task is deprecated. Please start using "grunt build:core" instead.'['yellow'].bold);
      _build.build(grunt, 'core', this.async());
    });

    grunt.registerTask('apache-vhost', '(DEPRECATED) Generate Apache vhost configuration', function(dist, outfile) {
      grunt.log.writeln('This task is deprecated. Please start using "grunt generate:apache-vhost --out=/path/file" instead.'['yellow'].bold);
      _build.build(grunt, 'generate', 'apache-vhost', this.async());
    });

    grunt.registerTask('apache-htaccess', '(DEPRECATED) Generate Apache htaccess file', function(dist, outfile) {
      grunt.log.writeln('This task is deprecated. Please start using "grunt generate:apache-htaccess" instead.'['yellow'].bold);
      _build.build(grunt, 'generate', 'apache-htaccess', this.async());
    });

    grunt.registerTask('lighttpd-config', '(DEPRECATED) Generate Lighttpd configuration', function(dist, outfile) {
      grunt.log.writeln('This task is deprecated. Please start using "grunt generate:lighttpd-config --out=/path/file" instead.'['yellow'].bold);
      _build.build(grunt, 'generate', 'lighttpd-config', this.async());
    });

    grunt.registerTask('nginx-config', '(DEPRECATED) Generate Nginx configuration', function(dist, outfile) {
      grunt.log.writeln('This task is deprecated. Please start using "grunt generate:nginx-config --out=/path/file" instead.'['yellow'].bold);
      _build.build(grunt, 'generate', 'nginx-config', this.async());
    });

    grunt.registerTask('dist', '(DEPRECATED) Build dist', function() {
      grunt.log.writeln('This task is deprecated. use "grunt --target=dist" instead.'['yellow'].bold);
    });

    grunt.registerTask('dist-dev', '(DEPRECATED) Build dist-dev', function() {
      grunt.log.writeln('This task is deprecated. use "grunt --target=dist-dev" instead.'['yellow'].bold);
    });

    grunt.registerTask('nw', '(DEPRECATED) Make NW build', function() {
      grunt.log.writeln('This task is deprecated. use "grunt --target=dist --nw" instead.'['yellow'].bold);
    });

    grunt.registerTask('compress', '(DEPRECATED) Compress dist files', function(arg) {
      grunt.log.writeln('This task is deprecated. use "grunt build:core,packages --compress" instead.'['yellow'].bold);
    });

    grunt.registerTask('standalone', '(DEPRECATED) Build dist standalone files', function(arg) {
      grunt.log.writeln('This task is deprecated. use "grunt --target=dist --standalone" instead.'['yellow'].bold);
    });

    grunt.registerTask('create-package', '(DEPRECATED) Create a new package/application', function(arg1) {
      grunt.log.writeln('This task is deprecated. use "grunt generate:package --name=REPO/NAME" instead.'['yellow'].bold);
    });

    grunt.registerTask('create-handler', '(DEPRECATED) Create a new handler with given name', function(arg1) {
      grunt.log.writeln('This task is deprecated. use "grunt generate:handler --name=MyName" instead.'['yellow'].bold);
    });

    //
    // Register aliases
    //

    grunt.registerTask('all', ['clean', 'build:config', 'build:core', 'build:themes', 'build:manifest', 'build:packages', 'generate:apache-htaccess']);
    grunt.registerTask('default', ['all']);
    grunt.registerTask('test', ['eslint', 'csslint', 'validate_xml', 'mochaTest'/*, 'mocha'*/]);
  };

})(require('node-fs-extra'), require('path'), require('./src/build/index.js'), require('grunt'));
