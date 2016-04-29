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

(function(Utils, API, VFS) {
  'use strict';

  var OSjs = window.OSjs = window.OSjs || {};
  OSjs.Helpers = OSjs.Helpers || {};

  var requestFileSystem = window.webkitRequestFileSystem || window.mozRequestFileSystem || window.requestFileSystem;
  var URL = window.webkitURL || window.mozURL || window.URL;

  function getEntries(file, callback) {
    zip.createReader(new zip.BlobReader(file), function(zipReader) {
      zipReader.getEntries(function(entries) {
        callback(false, entries);
      });
    }, function(message) {
      callback(message);
    });
  }

  function getEntryFile(entry, onend, onprogress) {
    var writer = new zip.BlobWriter();
    entry.getData(writer, function(blob) {
      onend(blob);
      writer = null;
    }, onprogress);
  }

  function openFile(file, done) {
    console.log('-->', 'openFile()');

    VFS.download(file, function(error, data) {
      if ( error ) {
        console.warning('An error while opening zip', error);
        done(error);
        return;
      }

      var blob = new Blob([data], {type: file.mime});
      getEntries(blob, function(error, result) {
        done(error, result || []);
      });
    });
  }

  function importFiles(writer, entries, pr, done, ignore) {
    ignore = ignore || [];

    console.log('-->', 'importFiles()', entries);

    function _next(index) {
      if ( !entries.length || index >= entries.length ) {
        done(false);
        return;
      }

      var current = entries[index];
      if ( ignore.indexOf(current.filename) >= 0 ) {
        console.warn('Ignoring', index, current);
        pr('ignored', index, current);
        _next(index + 1);
        return;
      }

      console.log('Importing', index, current);

      getEntryFile(current, function(blob) {
        writer.add(current.filename, new zip.BlobReader(blob), function() {
          pr('added', index, current);
          _next(index + 1);
        }, function(current, total) {
          pr('reading', index, total, current);
        }, {
          directory: current.directory,
          lastModDate: current.lastModDate,
          version: current.version
        });
      });
    }

    _next(0);
  }

  function createZip(done) {
    console.log('-->', 'createZip()');

    var writer = new zip.BlobWriter();
    zip.createWriter(writer, function(writer) {
      done(false, writer);
    }, function(error) {
      done(error);
    });
  }

  function saveZip(writer, file, ccb) {
    console.log('-->', 'saveZip()');

    writer.close(function(blob) {
      VFS.upload({
        destination: Utils.dirname(file.path),
        files: [{filename: Utils.filename(file.path), data: blob}]
      }, function(type, ev) {
        var error = (type === 'error') ? ev : false;
        ccb(error, !!error);
      }, {overwrite: true});
    });
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
    Utils.preload(this.preloads, function(total, failed) {
      if ( failed.length ) {
        cb(API._('ZIP_PRELOAD_FAIL'), failed);
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
   * Lists contents of a ZIP file
   *
   * @param   OSjs.VFS.File     file          File to extract
   * @param   Function          cb            Callback function => fn(error, entries)
   *
   * @return  void
   * @method  ZipArchiver::list()
   */
  ZipArchiver.prototype.list = function(file, cb) {
    VFS.download(file, function(error, result) {
      if ( error ) {
        alert(error);

        cb(error, null);
        return;
      }

      var blob = new Blob([result], {type: 'application/zip'});
      getEntries(blob, function(error, entries) {
        cb(error, entries);
      });
    });
  };

  /**
   * Create a new blank ZIP file
   *
   * @param   OSjs.VFS.File     file          File to extract
   * @param   Function          cb            Callback function => fn(error)
   * @param   Application       appRef        (Optional) Application reference
   *
   * @return  void
   * @method  ZipArchiver::create()
   */
  ZipArchiver.prototype.create = function(file, cb, appRef) {
    var writer = new zip.BlobWriter();
    zip.createWriter(writer, function(writer) {
      writer.close(function(blob) {
        VFS.upload({
          destination: Utils.dirname(file.path),
          files: [
            {filename: Utils.filename(file.path), data: blob}
          ]
        }, function(type, ev) {
          if ( type === 'error' ) {
            console.warn('Error creating blank zip', ev);
          }
          writer = null;

          if ( type !== 'error' ) {
            API.message('vfs', {type: 'upload', file: appRef ? appRef.__pid : null});
          }

          cb(type === 'error' ? ev : false, type !== 'error');
        }, {overwrite: true});
      });
    });
  };

  /**
   * Add a entry to the ZIP file
   *
   * TODO: Adding directory does not actually add files inside dirs yet
   *
   * @param   OSjs.VFS.File     file          Archive File
   * @param   OSjs.VFS.File     add           File to add
   * @param   Object            args          Arguments
   *
   * @option  args    String      path            Root path to add to (default='/')
   * @option  args    Function    onprogress      Callback on progress => fn(state[, args, ...])
   * @option  args    Function    oncomplete      Callback on complete => fn(error, result)
   *
   * @return  void
   * @method  ZipArchiver::add()
   */
  ZipArchiver.prototype.add = function(file, add, args) {
    var cb = args.oncomplete || function() {};
    var pr = args.onprogress || function() {};
    var currentDir = args.path || '/';

    console.group('ZipArchiver::add()');
    console.log('Archive', file);
    console.log('Add', file);

    function finished(err, res) {
      console.groupEnd();
      cb(err, res);
    }

    function checkIfExists(entries, done) {
      console.log('-->', 'checkIfExists()');

      var found = false;
      var chk = Utils.filename(add.path);

      entries.forEach(function(i) {
        if ( i.filename === chk ) {
          if ( !i.directory || (i.directory && add.type === 'dir') ) {
            found = true;
          }
        }
        return !found;
      });

      done(found ? 'File is already in archive' : false);
    }

    function addFile(writer, done) {
      var filename = add instanceof window.File ? add.name : add.filename;
      var type = add instanceof window.File ? 'file' : (add.type || 'file');

      console.log('-->', 'addFile()', filename, type, add);

      filename = ((currentDir || '/').replace(/\/$/, '') + '/' + filename).replace(/^\//, '');

      function _addBlob(blob) {
        console.log('-->', 'addFile()', '-->', '_addBlob()');

        writer.add(filename, new zip.BlobReader(blob), function() {
          console.log('ADDED FILE', filename);

          saveZip(writer, file, done);
        }, function(current, total) {
          pr('compressing', current);
        });
      }

      function _addFolder() {
        console.log('-->', 'addFile()', '-->', '_addFolder()');
        writer.add(filename, null, function() {
          console.log('ADDED FOLDER', filename);

          saveZip(writer, file, done);
        }, null, {directory: true});
      }

      if ( type === 'dir' ) {
        _addFolder();
      } else {
        if ( add instanceof window.File ) {
          _addBlob(add);
        } else {
          VFS.download(add, function(error, data) {
            if ( error ) {
              done(error);
              return;
            }

            var blob = new Blob([data], {type: add.mime});
            _addBlob(blob);
          });
        }
      }
    }

    // Proceed!
    openFile(file, function(err, entries) {
      if ( err ) {
        finished(err); return;
      }

      checkIfExists(entries, function(err) {
        if ( err ) {
          finished(err); return;
        }

        createZip(function(err, writer) {
          if ( err ) {
            finished(err); return;
          }

          importFiles(writer, entries, pr, function(err) {
            if ( err ) {
              finished(err); return;
            }
            addFile(writer, function(err) {
              finished(err, !!err);
            });
          });
        });
      });
    });

  };

  /**
   * Removes an entry from ZIP file
   *
   * @param   OSjs.VFS.File     file          Archive File
   * @param   String            path          Path
   * @param   Function          cb            Callback function => fn(err, result)
   *
   * @return  void
   * @method  ZipArchiver::remove()
   */
  ZipArchiver.prototype.remove = function(file, path, cb) {

    console.group('ZipArchiver::remove()');
    console.log('Archive', file);
    console.log('Remove', path);

    function finished(err, res, writer) {
      if ( err || !writer ) {
        console.groupEnd();
        cb(err || API._('ZIP_NO_RESOURCE'));
        return;
      }

      saveZip(writer, file, function(eer, rees) {
        console.groupEnd();
        cb(eer, rees);
      });
    }

    if ( !path ) {
      finished(API._('ZIP_NO_PATH'));
      return;
    }

    openFile(file, function(err, entries) {
      if ( err ) {
        finished(err); return;
      }

      createZip(function(err, writer) {
        if ( err ) {
          finished(err); return;
        }

        importFiles(writer, entries, function() {
        }, function(err) {
          finished(err, !!err, writer);
        }, [path]);
      });
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
   * @option  args    Application app             (Optional) Application reference
   *
   * @return  void
   * @method  ZipArchiver::extract()
   */
  ZipArchiver.prototype.extract = function(file, destination, args) {
    args = args || {};

    args.onprogress = args.onprogress || function(/*filename, current, total*/) {};
    args.oncomplete = args.oncomplete || function(/*error, warnings, result*/) {};

    console.group('ZipArchiver::extract()');
    console.log('Archive', file);
    console.log('Destination', destination);

    function finished(error, warnings, result) {
      if ( !error ) {
        API.message('vfs', {type: 'updated', dir: destination, source: args.app ? args.app.__pid : null});
      }

      console.groupEnd();
      args.oncomplete(error, warnings, result);
    }

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
        finished(false, warnings, true);
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
          console.warn('ZipArchiver::extract()', '_checkDirectory()', 'VFS::mkdir()', error);
        }

        VFS.exists(dst, function(err, result) {
          if ( err ) {
            console.warn('ZipArchiver::extract()', '_checkDirectory()', 'VFS::exists()', err);
          }

          if ( result ) {
            cb(false);
          } else {
            cb('Destination directory was not created or does not exist');
          }
        });
      });
    }

    console.debug('ZipArchiver::extract()', 'Downloading file...');

    VFS.download(file, function(error, result) {
      if ( error ) {
        finished(error, warnings, false);
        return;
      }

      var blob = new Blob([result], {type: 'application/zip'});
      _checkDirectory(destination, function(err) {

        if ( err ) {
          finished(error, warnings, false);
          return;
        }

        getEntries(blob, function(error, entries) {
          if ( error ) {
            finished(error, warnings, false);
            return;
          }

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
          error = API._('ZIP_VENDOR_FAIL');
        }
      }
      callback(error, error ? false : SingletonInstance);
    });
  };

})(OSjs.Utils, OSjs.API, OSjs.VFS);
