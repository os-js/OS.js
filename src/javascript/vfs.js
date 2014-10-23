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

  var DefaultModule = 'Public';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function isInternalModule(test) {
    test = test || '';

    var m = OSjs.VFS.Modules;
    var d = null;

    if ( test !== null ) {
      Object.keys(m).forEach(function(name) {
        var i = m[name];
        if ( i.internal === true && i.match && test.match(i.match) ) {
          d = true;
          return false;
        }
        return true;
      });
    }

    return d;
  }

  function getModuleFromPath(test) {
    test = test || '';

    var m = OSjs.VFS.Modules;
    var d = null;

    if ( test !== null ) {
      Object.keys(m).forEach(function(name) {
        var i = m[name];
        if ( i.enabled() === true && i.match && test.match(i.match) ) {
          d = name;
          return false;
        }
        return true;
      });
    }

    if ( !d ) {
      return DefaultModule;
    }

    return d;
  }

  /**
   * Perform VFS request
   */
  function request(test, method, args, callback) {
    var m = OSjs.VFS.Modules;
    var d = getModuleFromPath(test);
    var h = OSjs.API.getHandlerInstance();

    h.onVFSRequest(d, method, args, function() {
      m[d].request(method, args, callback);
    });
  }

  /**
   * Filters a scandir() request
   */
  function filterScandir(list, options) {
    options = options || {};
    var result = [];

    var typeFilter = options.typeFilter || null;
    var mimeFilter = options.mimeFilter || [];
    list.forEach(function(iter) {
      if ( iter.mime === 'application/vnd.google-apps.folder' ) {
        iter.type = 'dir';
      }

      if ( typeFilter && iter.type !== typeFilter ) {
        return;
      }

      if ( iter.type === 'file' ) {
        if ( mimeFilter && mimeFilter.length && iter.mime ) {
          var valid = false;
          mimeFilter.forEach(function(miter) {
            if ( iter.mime.match(miter) ) {
              valid = true;
              return false;
            }
            return true;
          });

          if ( !valid ) {
            return;
          }
        }
      }

      result.push(iter);
    });

    var tree = {dirs: [], files: []};
    for ( var i = 0; i < result.length; i++ ) {
      if ( result[i].type === 'dir' ) {
        tree.dirs.push(result[i]);
      } else {
        tree.files.push(result[i]);
      }
    }

    return tree.dirs.concat(tree.files);
  }

  /**
   * Returns the URL without protocol
   */
  function getRelativeURL(orig) {
    return orig.replace(/^([A-z0-9\-_]+)\:\/\//, '');
  }

  /**
   * Perform default VFS call via backend
   */
  function internalCall(name, args, callback) {
    API.call('fs', {'method': name, 'arguments': args}, function(res) {
      if ( !res || (typeof res.result === 'undefined') || res.error ) {
        callback(res.error || OSjs.API._('Fatal error'));
      } else {
        callback(false, res.result);
      }
    }, function(error) {
      callback(error);
    });
  }

  function createDataURL(str, mime, callback) {
    var blob = new Blob([str], {type: mime});
    var r = new FileReader();
    r.onloadend = function() {
      callback(false, r.result);
    };
    r.readAsDataURL(blob);
  }

  function existsWrapper(item, callback) {
    if ( typeof item._overwrite !== 'undefined' && item._overwrite === true ) {
      callback();
    } else {
      OSjs.VFS.exists(item, function(error, result) {
        if ( result ) {
          callback('Destination already exists');
        } else {
          callback();
        }
      });
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // FILE ABSTRACTION
  /////////////////////////////////////////////////////////////////////////////

  function OFile(arg, mime) {
    if ( !arg ) {
      throw new Error('File expects at least one argument');
    }
    if ( typeof arg === 'object' ) {
      this.setData(arg);
    } else if ( typeof arg === 'string' ) {
      this.path = arg;
      this.filename = Utils.filename(arg);
    }
    if ( mime ) {
      this.mime = mime;
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

  /////////////////////////////////////////////////////////////////////////////
  // VFS METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Returns a list of all enabled VFS modules
   */
  OSjs.VFS.getModules = function(visible) {
    visible = (typeof visible === 'undefined') ? true : visible === true;
    var m = OSjs.VFS.Modules;
    var a = [];
    Object.keys(m).forEach(function(name) {
      if ( m[name].enabled() ) {
        if ( visible && m[name].visible === visible ) {
          a.push({
            name: name,
            module: m[name]
          });
        }
      }
    });
    return a;
  };

  /**
   * Scandir
   */
  OSjs.VFS.scandir = function(item, callback) {
    console.info('VFS::read()', item);
    if ( arguments.length < 2 ) { throw new Error('Not enough aruments'); }
    if ( !(item instanceof OFile) ) { throw new Error('Expects a file-object'); }
    request(item.path, 'scandir', [item], callback);
  };

  /**
   * Write File
   */
  OSjs.VFS.write = function(item, data, callback, appRef) {
    console.info('VFS::write()', item);
    if ( arguments.length < 3 ) { throw new Error('Not enough aruments'); }
    if ( !(item instanceof OFile) ) { throw new Error('Expects a file-object'); }
    function _finished(error, result) {
      if ( !error ) {
        OSjs.API.message('vfs', {type: 'write', file: item, source: appRef ? appRef.__pid : null});
      }
      callback(error, result);
    }

    /*
    existsWrapper(item, function(error) {
      if ( error ) {
        return callback(error);
      }
    });
    */
    request(item.path, 'write', [item, data], _finished);

  };

  /**
   * Read File
   */
  OSjs.VFS.read = function(item, callback) {
    console.info('VFS::read()', item);
    if ( arguments.length < 2 ) { throw new Error('Not enough aruments'); }
    if ( !(item instanceof OFile) ) { throw new Error('Expects a file-object'); }
    request(item.path, 'read', [item], callback);
  };

  /**
   * Copy File
   */
  OSjs.VFS.copy = function(src, dest, callback, appRef) {
    console.info('VFS::copy()', src, dest);
    if ( arguments.length < 3 ) { throw new Error('Not enough aruments'); }
    if ( !(src instanceof OFile) ) { throw new Error('Expects a src file-object'); }
    if ( !(dest instanceof OFile) ) { throw new Error('Expects a dest file-object'); }

    function doRequest() {
      var msrc, mdst;

      function _finished(error, result) {
        if ( !error ) {
          OSjs.API.message('vfs', {type: 'mkdir', file: dest, source: appRef ? appRef.__pid : null});
        }
        callback(error, result);
      }

      function _write(data) {
        OSjs.VFS.Modules[mdst].request('write', [dest, data], function(error, result) {
          if ( error ) {
            error = 'An error occured while copying between storage: ' + error;
          }
          _finished(error, result);
        });
      }

      if ( isInternalModule(src.path) !== isInternalModule(dest.path) ) {
        msrc = getModuleFromPath(src.path);
        mdst = getModuleFromPath(dest.path);

        if ( msrc === 'GoogleDrive'  ) {
          src._opts = {arraybuffer: true};
        }

        OSjs.VFS.Modules[msrc].request('read', [src], function(error, result) {
          if ( error ) {
            _finished('An error occured while copying between storage: ' + error);
            return;
          }

          dest.mime = src.mime;
          if ( msrc === 'GoogleDrive' ) {
            createDataURL(result, src.mime, function(error, data) {
              dest._opts = {dataSource: true};

              _write(data);
            });
          } else {
            _write(result);
          }

        });
        return;
      }

      request(null, 'copy', [src, dest], _finished);
    }

    existsWrapper(dest, function(error) {
      if ( error ) {
        return callback(error);
      }
      doRequest();
    });
  };

  /**
   * Move File
   */
  OSjs.VFS.move = function(src, dest, callback, appRef) {
    console.info('VFS::move()', src, dest);
    if ( arguments.length < 3 ) { throw new Error('Not enough aruments'); }
    if ( !(src instanceof OFile) ) { throw new Error('Expects a src file-object'); }
    if ( !(dest instanceof OFile) ) { throw new Error('Expects a dest file-object'); }

    function doRequest() {
      function _finished(error, result) {
        if ( !error ) {
          OSjs.API.message('vfs', {type: 'move', file: dest, source: appRef ? appRef.__pid : null});
        }
        callback(error, result);
      }

      var isInternal = (isInternalModule(src.path) && isInternalModule(dest.path));
      var isOther    = (isInternalModule(src.path) !== isInternalModule(dest.path));
      var msrc = getModuleFromPath(src.path);
      var mdst = getModuleFromPath(dest.path);

      if ( !isInternal && (msrc === mdst) ) {
        request(src.path, 'move', [src, dest], _finished);
      } else if ( isOther ) {
        self.copy(src, dest, function(error, result) {
          if ( error ) {
            return _finished(error);
          }

          OSjs.VFS.Module[msrc].request('unlink', [src], function(error, result) {
            if ( error ) {
              error = 'An error occured while movin between storage: ' + error;
            }
            _finished(error, result);
          });
        });
      } else {
        request(null, 'move', [src, dest], _finished);
      }
    }

    existsWrapper(dest, function(error) {
      if ( error ) {
        return callback(error);
      }
      doRequest();
    });
  };
  OSjs.VFS.rename = function(src, dest, callback) {
    OSjs.VFS.move.apply(this, arguments);
  };

  /**
   * Delete File
   */
  OSjs.VFS.unlink = function(item, callback, appRef) {
    console.info('VFS::unlink()', item);
    if ( arguments.length < 2 ) { throw new Error('Not enough aruments'); }
    if ( !(item instanceof OFile) ) { throw new Error('Expects a file-object'); }
    function _finished(error, result) {
      if ( !error ) {
        OSjs.API.message('vfs', {type: 'delete', file: item, source: appRef ? appRef.__pid : null});
      }
      callback(error, result);
    }
    request(item.path, 'unlink', [item], _finished);
  };
  OSjs.VFS['delete'] = function(item, callback) {
    OSjs.VFS.unlink.apply(this, arguments);
  };

  /**
   * Create Directory
   */
  OSjs.VFS.mkdir = function(item, callback, appRef) {
    console.info('VFS::mkdir()', item);
    if ( arguments.length < 2 ) { throw new Error('Not enough aruments'); }
    if ( !(item instanceof OFile) ) { throw new Error('Expects a file-object'); }

    function doRequest() {
      function _finished(error, result) {
        if ( !error ) {
          OSjs.API.message('vfs', {type: 'mkdir', file: item, source: appRef ? appRef.__pid : null});
        }
        callback(error, result);
      }
      request(item.path, 'mkdir', [item], _finished);
    }

    existsWrapper(item, function(error) {
      if ( error ) {
        return callback(error);
      }
      doRequest();
    });
  };

  /**
   * Check if file exists
   */
  OSjs.VFS.exists = function(item, callback) {
    console.info('VFS::exists()', item);
    if ( arguments.length < 2 ) { throw new Error('Not enough aruments'); }
    if ( !(item instanceof OFile) ) { throw new Error('Expects a file-object'); }
    request(item.path, 'exists', [item], callback);
  };

  /**
   * Get file info
   */
  OSjs.VFS.fileinfo = function(item, callback) {
    console.info('VFS::fileinfo()', item);
    if ( arguments.length < 2 ) { throw new Error('Not enough aruments'); }
    if ( !(item instanceof OFile) ) { throw new Error('Expects a file-object'); }
    request(item.path, 'fileinfo', [item], callback);
  };

  /**
   * Get file URL
   */
  OSjs.VFS.url = function(item, callback) {
    console.info('VFS::url()', item);
    if ( arguments.length < 2 ) { throw new Error('Not enough aruments'); }
    if ( typeof item === 'string' ) {
      item = new OFile(item);
    }
    request(item.path, 'url', [item], callback);
  };

  /**
   * Upload file(s)
   */
  OSjs.VFS.upload = function(args, callback, appRef) {
    console.info('VFS::upload()', args);
    args = args || {};
    if ( arguments.length < 2 ) { throw new Error('Not enough aruments'); }

    /*
    if ( !(args.app instanceof OSjs.Core.Process) ) {
      throw new Error('upload() expects an Application reference');
    }
    */
    if ( !args.files ) {
      throw new Error('upload() expects a file array');
    }
    if ( !args.destination ) {
      throw new Error('upload() expects a destination');
    }

    function _dialogClose(btn, filename, mime, size) {
      if ( btn !== 'ok' && btn !== 'complete' ) {
        callback(false, false);
        return;
      }


      var file = new OSjs.VFS.File({
        filename: filename,
        path: args.destination + '/' + filename,
        mime: mime,
        size: size
      });

      OSjs.API.message('vfs', {type: 'upload', file: file, source: args.app.__pid});

      callback(false, file);
    }

    if ( !isInternalModule(args.destination) ) {
      args.files.forEach(function(f, i) {
        request(args.destination, 'upload', [f, args.destination], callback);
      });
      return;
    }

    function doRequest(f, i) {
      if ( args.app ) {
        if ( args.win ) {
          args.app._createDialog('FileUpload', [args.destination, f, _dialogClose], args.win);
        } else {
          args.app._addWindow(new OSjs.Dialogs.FileUpload(args.destination, f, _dialogClose), false);
        }
      } else {
        Utils.AjaxUpload(f, 0, args.destination, {
          progress: function() { },
          complete: function(evt) { callback(false, true, evt); },
          failed:   function(evt, message) { callback('File upload failed: ' + (message || 'Unknown reason'), null, evt); },
          canceled: function(evt) { callback('File upload was cancelled', null, evt); }
        });
      }
    }

    args.files.forEach(function(f, i) {
      var filename = (f instanceof window.File) ? f.name : f.filename;
      var dest = new OFile(args.destination + '/' + filename);
      dest._overwrite = f._overwrite === true;

      existsWrapper(dest, function(error) {
        if ( error ) {
          return callback(error);
        }
        doRequest(f, i);
      });
    });

  };

  /**
   * Download a file
   */
  OSjs.VFS.download = (function() {
    var _didx = 1;

    return function(args, callback) {
      console.info('VFS::download()', args);
      args = args || {};

      if ( arguments.length < 2 ) { throw new Error('Not enough aruments'); }

      if ( !args.path ) {
        throw new Error('download() expects a path');
      }

      var lname = 'DownloadFile_' + _didx;
      _didx++;

      API.createLoading(lname, {className: 'BusyNotification', tooltip: 'Downloading file'});

      var dmodule = getModuleFromPath(args.path);
      if ( !isInternalModule(args.path) ) {
        var file = args;
        if ( !(file instanceof OSjs.VFS.File) ) {
          file = new OSjs.VFS.File(args.path);
          if ( args.id ) {
            file.id = args.id;
          }
        }


        OSjs.VFS.Modules[dmodule].request('read', [file], function(error, result) {
          API.destroyLoading(lname);

          if ( error ) {
            callback('An error occured while downloading: ' + error);
            return;
          }

          callback(false, result);
        });
        return;
      }

      OSjs.VFS.url(args, function(error, result) {
        if ( error ) {
          return callback(error);
        }
        Utils.AjaxDownload(result, function(data) {
          API.destroyLoading(lname);
          callback(false, data);
        }, function(err) {
          API.destroyLoading(lname);
          callback(err);
        });
      });


      /*
      var path = getRelativeURL(args.path);
      Utils.AjaxDownload(path, function(data) {
        API.destroyLoading(lname);
        callback(false, data);
      }, function(err) {
        API.destroyLoading(lname);
        callback(err);
      });
      */
    };
  })();

  //
  // Misc exports
  //
  OSjs.VFS.internalCall          = internalCall;
  OSjs.VFS.filterScandir         = filterScandir;
  OSjs.VFS.getModuleFromPath     = getModuleFromPath;
  OSjs.VFS.isInternalModule      = isInternalModule;
  OSjs.VFS.getRelativeURL        = getRelativeURL;
  OSjs.VFS.File                  = OFile;

})(OSjs.Utils, OSjs.API);
