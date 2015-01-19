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
(function(Utils, API) {
  'use strict';

  // https://social.msdn.microsoft.com/forums/onedrive/en-US/5e259b9c-8e9e-40d7-95c7-722ef5bb6d38/upload-file-to-skydrive-using-javascript
  // http://msdn.microsoft.com/en-us/library/hh826531.aspx
  // http://msdn.microsoft.com/en-us/library/dn659726.aspx

  //var WL   = window.WL   = window.WL    || {};
  var OSjs = window.OSjs = window.OSjs  || {};

  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  var _isMounted    = false;

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Perform a REST call to WL API
   */
  function onedriveCall(args, callback) {
    console.debug('OneDrive::*onedriveCall()', args);

    WL.api(args).then(
      function(response) {
        callback(false, response);
      },
      function(responseFailed) {
        console.error('OneDrive::*onedriveCall()', 'error', responseFailed, args);
        callback(responseFailed.error.message);
      }
    );
  }

  /**
   * Gets OS.js VFS File Metadata type from OneDrive item
   */
  function getItemType(iter) {
    var type = 'file';
    if ( iter.type === 'folder' || iter.type === 'album' ) {
      type = 'dir';
    }
    return type;
  }

  /**
   * Get OS.js VFS File Metadata from OneDrive item
   */
  function getMetadataFromItem(dir, item) {
    var path = 'onedrive://' + dir.replace(/^\/+/, '').replace(/\/+$/, '') + '/' + item.name; // FIXME

    var itemFile = new OSjs.VFS.File({
      id: item.id,
      filename: item.name,
      size: item.size || 0,
      path: path,
      mime: getItemMime(item),
      type: getItemType(item)
    });
    return itemFile;
  }

  /**
   * Get MIME type from file extension of a file
   * Yeah... it's pretty rough, but OneDrive does
   * not support mimes yet
   */
  var getItemMime = (function() {
    var EXTs;

    return function(iter) {
      if ( !EXTs ) {
        EXTs = API.getDefaultSettings().EXTMIME || {};
      }
      var mime = null;
      if ( getItemType(iter) !== 'dir' ) {
        mime = 'application/octet-stream';
        var ext = Utils.filext(iter.name);
        if ( ext.length ) {
          ext = '.' + ext;
          if ( EXTs[ext] ) {
            mime = EXTs[ext];
          }
        }
      }
      return mime;
    };
  })();

  /**
   * Create an Array filled with OS.js VFS file metadata
   */
  function createDirectoryList(dir, list, item, options) {
    var result = [];

    if ( dir !== '/' ) {
      result.push(new OSjs.VFS.File({
        id: item.id,
        filename: '..',
        path: Utils.dirname(item.path),
        size: 0,
        type: 'dir'
      }));
    }

    list.forEach(function(iter) {
      result.push(getMetadataFromItem(dir, iter));
    });

    return result;
  }

  /**
   * Get files inside given folder
   */
  function getFilesInFolder(folderId, callback) {
    onedriveCall({
      path: folderId + '/files',
      method: 'GET'
    }, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }

      console.debug('OneDrive::*getFilesInFolder()', '=>', response);
      callback(false, response.data || []);
    });
  }

  /**
   * Check if file is existent inside given folder
  function isFileInFolder(folderId, file, callback, returnIter) {
    getFilesInFolder(folderId, function(error, list) {
      if ( error ) {
        callback(error);
        return;
      }

      var found;
      list.forEach(function(iter) {
        if ( iter.name === file.filename ) {
          found = iter;
          return false;
        }
        return true;
      });

      if ( found ) {
        if ( returnIter ) {
          callback(false, found);
          return;
        }

        var dir = OSjs.VFS.getRelativeURL(Utils.dirname(found.path));
        var foundFile = getMetadataFromItem(dir, found);
        callback(false, foundFile);
      } else {
        callback('Could not find requested file'); // FIXME: Translation
      }
    });
  }
  */

  /**
   * Resolve normal /path/to/file to OneDrive ID
   */
  function resolvePath(item, callback, useParent) {
    if ( !useParent ) {
      if ( item.id ) {
        callback(false, item.id);
        return;
      }
    }

    var path = OSjs.VFS.getRelativeURL(item.path).replace(/\/+/, '/');
    if ( useParent ) {
      path = Utils.dirname(path);
    }
    if ( path === '/' ) {
      callback(false, 'me/skydrive');
      return;
    }

    var resolves = path.replace(/^\/+/, '').split('/');
    var isOnRoot = !resolves.length;
    var currentParentId = 'me/skydrive';

    function _nextDir(completed) {
      var current = resolves.shift();
      var done = resolves.length <= 0;
      var found;

      if ( isOnRoot ) {
        found = currentParentId;
      } else {

        if ( current ) {
          getFilesInFolder(currentParentId, function(error, list) {
            list = list || [];
            var lfound;
            list.forEach(function(iter) { // FIXME: Not very precise
              if ( iter ) {
                if ( iter.name === current ) {
                  lfound = iter.id;
                }
              }
            });

            if ( lfound ) {
              currentParentId = lfound;
            }

            if ( done ) {
              completed(lfound);
            } else {
              _nextDir(completed);
            }

          });

          return;
        }
      }

      if ( done ) {
        completed(found);
      } else {
        _nextDir(completed);
      }
    }

    _nextDir(function(foundId) {
      if ( foundId ) {
        callback(false, foundId);
      } else {
        callback(API._('ONEDRIVE_ERR_RESOLVE'));
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var OneDriveStorage = {};

  OneDriveStorage.scandir = function(item, callback, options) {
    console.group('OneDrive::scandir()');

    console.info('OneDrive::scandir()', item);

    var relativePath = OSjs.VFS.getRelativeURL(item.path);

    function _finished(error, result) {
      console.groupEnd();
      callback(error, result);
    }

    function _scandir(drivePath) {
      onedriveCall({
        path: drivePath,
        method: 'GET'
      }, function(error, response) {
        if ( error ) {
          _finished(error);
          return;
        }
        console.debug('OneDrive::scandir()', '=>', response);

        getFilesInFolder(response.id, function(error, list) {
          if ( error ) {
            _finished(error);
            return;
          }
          var fileList = createDirectoryList(relativePath, list, item, options);
          _finished(false, fileList);
        });
      });
    }

    resolvePath(item, function(error, drivePath) {
      if ( error ) {
        _finished(error);
        return;
      }
      _scandir(drivePath);
    });
  };

  OneDriveStorage.read = function(item, callback, options) {
    options = options || {};

    this.url(item, function(error, url) {
      if ( error ) {
        callback(error);
        return;
      }

      OSjs.VFS.remoteRead(url, item.mime, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }
        callback(false, response);
      }, options);
    });
  };

  OneDriveStorage.write = function(file, data, callback) {
    console.info('OneDrive::write()', file);

    var inst = OSjs.Helpers.WindowsLiveAPI.getInstance();
    var url = '//apis.live.net/v5.0/me/skydrive/files?access_token=' + inst.accessToken;
    var fd  = new FormData();
    OSjs.VFS.addFormFile(fd, 'file', data, file);

    OSjs.Utils.ajax({
      url: url,
      method: 'POST',
      json: true,
      body: fd,
      onsuccess: function(result) {
        if ( result && result.id ) {
          callback(false, result.id);
          return;
        }
        callback(API._('ERR_APP_UNKNOWN_ERROR'));
      },
      onerror: function(error, result) {
        if ( result && result.error ) {
          error += ' - ' + result.error.message;
        }
        callback(error);
      }
    });
  };

  OneDriveStorage.copy = function(src, dest, callback) {
    resolvePath(src, function(error, srcDrivePath) {
      if ( error ) {
        callback(error);
        return;
      }

      resolvePath(dest, function(error, dstDrivePath) {
        if ( error ) {
          callback(error);
          return;
        }

        onedriveCall({
          path: srcDrivePath,
          method: 'COPY',
          body: {
            destination: dstDrivePath
          }
        }, function(error, response) {
          callback(error, error ? null : true);
        });
      });
    });
  };

  OneDriveStorage.unlink = function(src, callback) {
    resolvePath(src, function(error, drivePath) {
      if ( error ) {
        callback(error);
        return;
      }

      onedriveCall({
        path: drivePath,
        method: 'DELETE'
      }, function(error, response) {
        callback(error, error ? null : true);
      });
    });
  };

  OneDriveStorage.move = function(src, dest, callback) {
    resolvePath(src, function(error, srcDrivePath) {
      if ( error ) {
        callback(error);
        return;
      }

      resolvePath(dest, function(error, dstDrivePath) {
        if ( error ) {
          callback(error);
          return;
        }

        onedriveCall({
          path: srcDrivePath,
          method: 'MOVE',
          body: {
            destination: dstDrivePath
          }
        }, function(error, response) {
          callback(error, error ? null : true);
        });
      });
    });

  };

  // FIXME Is there a better way to do this ?
  OneDriveStorage.exists = function(item, callback) {
    console.info('OneDrive::exists()', item); // TODO

    /*
    resolvePath(item, function(error, drivePath) {
      if ( error ) {
        callback(false, false);
        //callback(error);
        return;
      }
      isFileInFolder(drivePath, item, callback);
    });
    */
    this.fileinfo(item, function(error, response) {
      if ( error ) {
        callback(false, false);
        return;
      }
      callback(false, response ? true : false);
    });
  };

  OneDriveStorage.fileinfo = function(item, callback) {
    console.info('OneDrive::fileinfo()', item);
    resolvePath(item, function(error, drivePath) {
      if ( error ) {
        callback(error);
        return;
      }

      onedriveCall({
        path: drivePath,
        method: 'GET'
      }, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }

        var useKeys = ['created_time', 'id', 'link', 'name', 'type', 'updated_time', 'upload_location', 'description', 'client_updated_time'];
        var info = {};
        useKeys.forEach(function(k) {
          info[k] = response[k];
        });
        callback(false, info);
      });

    });
  };

  OneDriveStorage.mkdir = function(dir, callback) {
    resolvePath(dir, function(error, drivePath) {
      if ( error ) {
        callback(error);
        return;
      }

      onedriveCall({
        path: drivePath,
        method: 'POST',
        body: {
          name: dir.filename
        }
      }, function(error, response) {
        callback(error, error ? null : true);
      });
    }, true);
  };

  OneDriveStorage.upload = function(file, dest, callback) {
    console.info('OneDrive::upload()', file, dest);

    var ndest = dest;
    if ( !ndest.match(/\/$/) ) {
      ndest += '/';
    }

    var item = new OSjs.VFS.File({
      filename: file.name,
      path: ndest + file.name,
      mime: file.type,
      size: file.size
    });

    this.write(item, file, callback);
  };

  OneDriveStorage.url = function(item, callback) {
    console.info('OneDrive::url()', item);

    /*
    var drivePath = item.id; // TODO
    var inst = OSjs.Helpers.WindowsLiveAPI.getInstance();
    var url = '//apis.live.net/v5.0/' + drivePath + '/content?access_token=' + inst.accessToken;

    callback(false, url);
    */

    resolvePath(item, function(error, drivePath) {
      if ( error ) {
        callback(error);
        return;
      }

      onedriveCall({
        path: drivePath + '/content',
        method: 'GET'
      }, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }
        callback(false, response.location);
      });
    });

  };

  OneDriveStorage.trash = function(file, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  OneDriveStorage.untrash = function(file, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  OneDriveStorage.emptyTrash = function(callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function getOneDrive(callback, onerror) {
    callback = callback || function() {};
    onerror  = onerror  || function() {};

    // Check if user has signed out or revoked permissions
    if ( _isMounted ) {
      var inst = OSjs.Helpers.WindowsLiveAPI.getInstance();
      if ( inst && !inst.authenticated ) {
        _isMounted = false;
      }
    }

    if ( !_isMounted ) {
      var iargs = {scope: ['wl.signin', 'wl.skydrive', 'wl.skydrive_update']};

      OSjs.Helpers.WindowsLiveAPI.createInstance(iargs, function(error, result) {
        if ( error ) {
          return onerror(error);
        }

        _isMounted = true;
        API.message('vfs', {type: 'mount', module: 'OneDrive', source: null});
        callback(OneDriveStorage);
      });
      return;
    }

    callback(OneDriveStorage);
  }

  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || function() {};

    getOneDrive(function(instance) {
      if ( !instance ) {
        throw new Error('No OneDrive instance was created. Load error ?');
      } else if ( !instance[name] ) {
        throw new Error('Invalid OneDrive API call name');
      }

      var fargs = args;
      fargs.push(callback);
      fargs.push(options);
      instance[name].apply(instance, fargs);
    }, function(error) {
      callback(error);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Modules.OneDrive = OSjs.VFS.Modules.OneDrive || {
    readOnly: false,
    description: 'OneDrive',
    visible: true,
    unmount: function(cb) {
      // FIXME: Should we sign out here too ?
      cb = cb || function() {};
      _isMounted = false;
      API.message('vfs', {type: 'unmount', module: 'OneDrive', source: null});
      cb(false, true);
    },
    mounted: function() {
      return _isMounted;
    },
    enabled: function() {
      var handler = OSjs.Core.getHandler();
      if ( handler ) {
        try {
          if ( handler.getConfig('Core').VFS.OneDrive.Enabled ) {
            return true;
          }
        } catch ( e ) {
          console.warn('OSjs.VFS.Modules.OneDrive::enabled()', e, e.stack);
        }
      }
      return false;
    },
    root: 'onedrive:///',
    icon: 'places/onedrive.png',
    match: /^onedrive\:\/\//,
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);
