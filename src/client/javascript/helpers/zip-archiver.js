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

(function(Utils, API, VFS) {
  'use strict';

  var OSjs = window.OSjs = window.OSjs || {};
  OSjs.Helpers = OSjs.Helpers || {};

  var requestFileSystem = window.webkitRequestFileSystem || window.mozRequestFileSystem || window.requestFileSystem;
  var URL = window.webkitURL || window.mozURL || window.URL;

  function getEntries(file, callback) {
    zip.createReader(new zip.BlobReader(file), function(zipReader) {
      zipReader.getEntries(function(entries) {
        callback(entries);
      });
    }, function(message) {
      alert(message); // FIXME
    });
  }

  function getEntryFile(entry, onend, onprogress) {
    var writer = new zip.BlobWriter();
    entry.getData(writer, function(blob) {
      onend(blob);
      writer = null;
    }, onprogress);
  }


  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var SingletonInstance = null;

  /**
   * The GoogleAPI wrapper class
   *
   * This is a private class and can only be aquired through
   * OSjs.Helpers.ZipArchiver.createInsatance()
   *
   * Generally you want to create an instance of this helper
   * and when successfully created use `window.zip` use the instance helpers.
   *
   * @see OSjs.Helpers.ZipArchiver.createInsatance()
   * @api OSjs.Helpers.ZipArchiver.ZipArchiver
   *
   * @private
   * @class
   */
  function ZipArchiver(opts) {
    this.opts = opts;
    this.inited = false;
    this.preloads = [{
      type: 'javascript',
      src: '/vendor/zip.js/WebContent/zip.js'
    }];
  }

  ZipArchiver.prototype.init = function(cb) {
    cb = cb || function() {};

    if ( this.inited ) {
      cb();
      return;
    }

    var self = this;
    Utils.preload(this.preloads, function(total, errors) {
      if ( errors ) {
        cb('Failed to load zip.js'); // FIXME: Translation
        return;
      }

      if ( window.zip ) {
        zip.workerScriptsPath = '/vendor/zip.js/WebContent/';

        self.inited = true;
      }

      cb();
    });
  };

  /**
   * Extract a File to destination
   *
   * @param   OSjs.VFS.File     file          File to extract
   * @param   String            destination   Destination path
   * @param   Object            args          Arguments
   *
   * @option  args    Function    onprogress      Callback on progress => fn(filename, currentIndex, totalIndex)
   * @option  args    Function    oncomplete      Callback on complete => fn(error, warnings, result)
   *
   * @return  void
   * @method  ZipArchiver::extract()
   */
  ZipArchiver.prototype.extract = function(file, destination, args) {
    args = args || {};

    args.onprogress = args.onprogress || function(/*filename, current, total*/) {};
    args.oncomplete = args.oncomplete || function(/*error, warnings, result*/) {};

    var extracted = [];
    var warnings = [];
    var total = 0;

    function _extractList(list, destination) {
      total = list.length;
      console.debug('ZipArchiver::extract()', 'Extracting', total, 'item(s)');

      var index = 0;

      function _extract(item, cb) {
        args.onprogress(item.filename, index, total);

        var dest = destination;
        if ( item.filename.match(/\//) ) {
          if ( item.directory ) {
            dest += '/' + item.filename;
          } else {
            dest += '/' + Utils.dirname(item.filename);
          }
        }

        console.log('Extract', item, dest);
        if ( item.directory ) {
          VFS.mkdir(new VFS.File(dest), function(error, result) {
            if ( error ) {
              warnings.push(Utils.format('Could not create directory "{0}": {1}', item.filename, error));
            } else {
              extracted.push(item.filename);
            }

            cb();
          });
          return;
        }

        getEntryFile(item, function(blob) {
          console.log('....', blob);
          VFS.upload({
            destination: dest,
            files: [{filename: Utils.filename(item.filename), data: blob}]
          }, function(type, ev) { // error, result, ev
            console.warn('ZipArchiver::extract()', '_extract()', 'upload', type, ev);

            if ( type === 'error' ) {
              warnings.push(Utils.format('Could not extract "{0}": {1}', item.filename, ev));
            } else {
              extracted.push(item.filename);
            }

            cb();
          });

        }, function() {
        });
      }

      function _finished() {
        console.log('Extract finished', total, 'total', extracted.length, 'extracted', extracted);
        console.log(warnings.length, 'warnings', warnings);
        args.oncomplete(false, warnings, true);
      }

      function _next() {
        if ( !list.length || index >= list.length ) {
          return _finished();
        }

        _extract(list[index], function() {
          index++;
          _next();
        });
      }

      _next();
    }

    function _checkDirectory(destination, cb) {
      console.debug('ZipArchiver::extract()', 'Checking destination');

      var dst = new VFS.File({path: destination, type: 'dir'});
      VFS.mkdir(dst, function(error, result) {
        if ( error ) {
          args.oncomplete(error, warnings, false);
          return;
        }
        cb();
      });
    }

    console.debug('ZipArchiver::extract()', 'Downloading file...');

    VFS.download(file, function(error, result) {
      if ( error ) {
        return args.oncomplete(error, warnings, false);
      }
      var blob = new Blob([result], {type: 'application/zip'});
      _checkDirectory(destination, function() {
        getEntries(blob, function(entries) {
          _extractList(entries, destination);
        });
      });
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.ZipArchiver = OSjs.Helpers.ZipArchiver || {};

  /**
   * Gets the currently running instance
   *
   * @api OSjs.Helpers.ZipArchiver.getInstance()
   *
   * @return  ZipArchiver       Can also be null
   */
  OSjs.Helpers.ZipArchiver.getInstance = function() {
    return SingletonInstance;
  };

  /**
   * Create an instance of ZipArchiver
   *
   * @param   Object    args      Arguments
   * @param   Function  callback  Callback function => fn(error, instance)
   *
   * @option  args    Array     scope     What scope to load
   *
   * @api OSjs.Helpers.ZipArchiver.createInstance()
   *
   * @return  void
   */
  OSjs.Helpers.ZipArchiver.createInstance = function(args, callback) {
    args = args || {};
    if ( !SingletonInstance ) {
      SingletonInstance = new ZipArchiver(args);
    }

    SingletonInstance.init(function(error) {
      if ( !error ) {
        if ( !window.zip ) {
          error = 'zip.js library was not found. Did it load properly?'; // FIXME: Translation
        }
      }
      callback(error, error ? false : SingletonInstance);
    });
  };

})(OSjs.Utils, OSjs.API, OSjs.VFS);
