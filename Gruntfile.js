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
module.exports = function(grunt) {
  'use strict';

  grunt.file.defaultEncoding = 'utf-8';

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-validate-xml');

  grunt.registerTask('testBuild', 'Tests the build', function() {
    var files = [
      'dist/index.html',
      'dist/favicon.ico',
      'dist/dialogs.html',
      'dist/locales.js',
      'dist/osjs.js',
      'dist/osjs.css',
      'dist/packages.js',
      'dist/settings.js',
      'dist/splash.png'
    ];

    var result = files.every(function(filename) {
      if ( !grunt.file.exists(filename) ) {
        grunt.log.error('Missing file from build: ' + filename);
        return false;
      }
      return true;
    });

    return result;
  });

  grunt.registerTask('test', ['eslint', 'csslint', 'validate_xml', 'mochaTest'/*, 'mocha'*/, 'testBuild']);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      options: {
        configFile: '.eslintrc'
      },
      target: [
        'Gruntfile.js',
        'src/*.js',
        'src/build/*.js',
        'src/server/node/*.js',
        'src/server/node/**/*.js',
        'src/client/javascript/*.js',
        'src/client/javascript/**/*.js',
        'src/packages/default/**/*.js',
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
    mocha: {
      test: {
        options: {
          urls: ['http://localhost:8000/test.html']
        }
      }
    },
    validate_xml: {
      all: {
        src: [
          'src/client/dialogs.html',
          'src/packages/default/*/scheme.html'
        ]
      }
    }
  });
};
