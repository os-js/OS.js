/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Utils, API) {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function request(test, method, args) {
    var m = OSjs.VFS.Modules;
    var d = 'Internal';

    if ( test !== null ) {
      Object.keys(m).forEach(function(name) {
        var i = m[name];
        if ( i.enabled === true && i.match && test.match(i.match) ) {
          d = name;
          return false;
        }
        return true;
      });
    }

    m[d].request(method, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // FILE ABSTRACTION
  /////////////////////////////////////////////////////////////////////////////

  function OFile(arg) {
    if ( typeof arg === 'object' ) {
      this.setData(arg);
    } else if ( typeof arg === 'string' ) {
      this.path = arg;
      this.filename = Utils.filename(arg);
    }
  }

  OFile.prototype.path = null;
  OFile.prototype.filename = null;
  OFile.prototype.type = null;
  OFile.prototype.size = null;
  OFile.prototype.mime = null;
  OFile.prototype.id = null;

  OFile.prototype.setData = function(o) {
    var self = this;
    Object.keys(o).forEach(function(k) {
      if ( k !== '_element' ) {
        self[k] = o[k];
      }
    });
  };

  OFile.prototype.getData = function() {
    return {
      path: this.path,
      filename: this.filename,
      type: this.type,
      size: this.size,
      mime: this.mime,
      id: this.id
    };
  };

  OSjs.VFS.File = OFile;

  /////////////////////////////////////////////////////////////////////////////
  // VFS METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Returns a list of all enabled VFS modules
   */
  OSjs.VFS.getModules = function() {
    var m = OSjs.VFS.Modules;
    var a = [];
    Object.keys(m).forEach(function(name) {
      if ( m[name].enabled ) {
        a.push({
          name: name,
          module: m[name]
        });
      }
    });
    return a;
  };

  /**
   * Scandir
   */
  OSjs.VFS.scandir = function(item, callback) {
    console.info('VFS::read()', item);
    if ( !(item instanceof OFile) ) { throw 'Expects a file-object'; }

    request(item.path, 'scandir', [item, callback]);
  };

  /**
   * Write File
   */
  OSjs.VFS.write = function(item, data, callback) {
    console.info('VFS::write()', item);
    if ( !(item instanceof OFile) ) { throw 'Expects a file-object'; }
    request(item.path, 'write', [item, data, callback]);
  };

  /**
   * Read File
   */
  OSjs.VFS.read = function(item, callback) {
    console.info('VFS::read()', item);
    if ( !(item instanceof OFile) ) { throw 'Expects a file-object'; }
    request(item.path, 'read', [item, callback]);
  };

  /**
   * Copy File
   */
  OSjs.VFS.copy = function(src, dest, callback) {
    console.info('VFS::copy()', src, dest);
    if ( !(src instanceof OFile) ) { throw 'Expects a src file-object'; }
    if ( !(dest instanceof OFile) ) { throw 'Expects a dest file-object'; }

    // TODO
    if ( src.path.match(/google-drive\:\/\//) || dest.path.match(/google-drive\:\/\//) ) {
      callback('Not implemented');
      return;
    }

    request(null, 'copy', [src, dest, callback]);
  };

  /**
   * Move File
   */
  OSjs.VFS.move = function(src, dest, callback) {
    console.info('VFS::move()', src, dest);
    if ( !(src instanceof OFile) ) { throw 'Expects a src file-object'; }
    if ( !(dest instanceof OFile) ) { throw 'Expects a dest file-object'; }

    // TODO
    if ( src.path.match(/google-drive\:\/\//) || dest.path.match(/google-drive\:\/\//) ) {
      callback('Not implemented');
      return;
    }

    request(null, 'move', [src, dest, callback]);
  };
  OSjs.VFS.rename = function(src, dest, callback) {
    OSjs.VFS.move.apply(this, arguments);
  };

  /**
   * Delete File
   */
  OSjs.VFS.unlink = function(item, callback) {
    console.info('VFS::unlink()', item);
    if ( !(item instanceof OFile) ) { throw 'Expects a file-object'; }
    request(item.path, 'unlink', [item, callback]);
  };
  OSjs.VFS['delete'] = function(item, callback) {
    OSjs.VFS.unlink.apply(this, arguments);
  };

  /**
   * Create Directory
   */
  OSjs.VFS.mkdir = function(item, callback) {
    console.info('VFS::mkdir()', item);
    if ( !(item instanceof OFile) ) { throw 'Expects a file-object'; }
    request(item.path, 'mkdir', [item, callback]);
  };

  /**
   * Check if file exists
   */
  OSjs.VFS.exists = function(item, callback) {
    console.info('VFS::exists()', item);
    if ( !(item instanceof OFile) ) { throw 'Expects a file-object'; }
    request(item.path, 'exists', [item, callback]);
  };

  /**
   * Get file info
   */
  OSjs.VFS.fileinfo = function(item, callback) {
    console.info('VFS::fileinfo()', item);
    if ( !(item instanceof OFile) ) { throw 'Expects a file-object'; }
    request(item.path, 'fileinfo', [item, callback]);
  };

  /**
   * Get file URL
   */
  OSjs.VFS.url = function(item, callback) {
    console.info('VFS::url()', item);
    var path = (typeof item === 'string') ? item : item.path;
    if ( path.match(/^osjs\:\/\//) ) {
      callback(false, path.replace(/^osjs\:\/\//, ''));
      return;
    }

    request(path, 'url', [item, callback]);
  };

  /**
   * Upload file(s)
   */
  OSjs.VFS.upload = function(args, callback) {
    args = args || {};
    if ( !(args.app instanceof OSjs.Core.Process) ) {
      throw 'upload() expects an Application reference';
    }
    if ( !args.files ) {
      throw 'upload() expects a file array';
    }
    if ( !args.destination ) {
      throw 'upload() expects a destination';
    }
    // TODO
    if ( args.destination.match(/google-drive\:\/\//) ) {
      callback('upload() does not support google-drive yet');
      return;
    }

    var _dialogClose  = function(btn, filename, mime, size) {
      if ( btn !== 'ok' && btn !== 'complete' ) { return; }

      OSjs.API.message('vfs', {type: 'upload', path: args.destination, filename: filename, source: args.app.__pid});

      var file = new OSjs.VFS.File({
        filename: filename,
        path: args.destination + '/' + filename,
        mime: mime,
        size: size
      });

      callback(false, file);
    };

    args.files.forEach(function(f, i) {
      if ( args.win ) {
        args.app._createDialog('FileUpload', [args.destination, f, _dialogClose], args.win);
      } else {
        args.app.addWindow(new OSjs.Dialogs.FileUpload(args.destination, f, _dialogClose), false);
      }
    });
  };

  /**
   * Download a file
   */
  OSjs.VFS.download = (function() {
    var _didx = 1;

    return function(args, callback) {
      args = args || {};
      if ( !args.path ) {
        throw 'download() expects a path';
      }
      // TODO
      if ( args.path.match(/google-drive\:\/\//) ) {
        callback('download() does not support google-drive yet');
        return;
      }

      var lname = 'DownloadFile_' + _didx;
      _didx++;

      API.createLoading(lname, {className: 'BusyNotification', tooltip: 'Downloading file'});
      Utils.AjaxDownload(args.path, function(data) {
        API.destroyLoading(lname);
        callback(false, data);
      }, function(err) {
        API.destroyLoading(lname);
        callback(err);
      });
    };
  })();

})(OSjs.Utils, OSjs.API);
