'use strict';

(function(_fs, _path, _build, _grunt, _less) {
  var ROOT  = _build.ROOT;
  var BUILD = _build.BUILD;

  /////////////////////////////////////////////////////////////////////////////
  // GRUNT
  /////////////////////////////////////////////////////////////////////////////

  module.exports = function(grunt) {

    grunt.file.defaultEncoding = 'utf-8';

    require('time-grunt')(grunt);

    grunt.initConfig({
    });

    /**
     * Task: Clean
     */
    grunt.registerTask('clean', 'Clean up all build files', function(arg) {
    });

    /**
     * Task: Build config
     */
    grunt.registerTask('config', 'Build config files', function(arg) {
      grunt.log.writeln('Writing configuration files...');
      _build.createConfigurationFiles(grunt, arg);
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
      _build.createIndex(grunt, arg, 'dev');
    });

    /**
     * Task: Generate Apache vhost
     */
    grunt.registerTask('apache-vhost', 'Generate Apache vhost configuration file', function(arg) {
      _build.createApacheVhost(grunt, arg);
    });

    /**
     * Task: Generate Apache htaccess
     */
    grunt.registerTask('apache-htaccess', 'Generate Apache htaccess file', function(arg) {
      _build.createApacheHtaccess(grunt, arg);
    });

    /**
     * Task: Generate Lighttpd config
     */
    grunt.registerTask('lighttpd-config', 'Generate Lighttpd configuration file', function(arg) {
      _build.createLighttpdConfig(grunt, arg);
    });

    /**
     * Task: Generate Nginx config
     */
    grunt.registerTask('nginx-config', 'Generate Nginx configuration file', function(arg) {
      _build.createNginxConfig(grunt, arg);
    });

    /**
     * Task: Create a new package
     */
    grunt.registerTask('create-package', 'Create a new package/application', function(arg) {
      grunt.log.writeln('Creating package...');
      _build.createPackage(grunt, arg);
    });

    /**
     * Task: Create a nightly build
     */
    grunt.registerTask('create-nightly-build', 'Creates a new OS.js nightly zip distribution', function(arg) {
      grunt.log.writeln('Building nightly...');
      _build.buildNightly(grunt, arg);
    });


    grunt.registerTask('all', ['clean', 'config', 'core', 'themes', 'packages', 'manifest']);
    grunt.registerTask('default', ['all']);
  };
})(require('node-fs-extra'), require('path'), require('./src/build.js'), require('grunt'), require('less'));
