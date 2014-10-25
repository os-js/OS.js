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

  // https://developers.google.com/drive/web/quickstart/quickstart-js
  // https://developers.google.com/+/web/signin/javascript-flow
  // https://developers.google.com/drive/realtime/realtime-quickstart
  // https://developers.google.com/drive/v2/reference/

  var gapi = window.gapi = window.gapi  || {};
  var OSjs = window.OSjs = window.OSjs  || {};

  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function createBoundary(file, data, callback) {
    var boundary = '-------314159265358979323846';
    var delimiter = '\r\n--' + boundary + '\r\n';
    var close_delim = '\r\n--' + boundary + '--';
    var contentType = file.mime || 'text/plain'; //fileData.type || 'application/octet-stream';

    function createBody(result) {
      var metadata = {
        title: file.filename,
        mimeType: contentType
      };
      var base64Data = btoa(result);
      var multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: ' + contentType + '\r\n' +
          'Content-Transfer-Encoding: base64\r\n' +
          '\r\n' +
          base64Data +
          close_delim;

      return multipartRequestBody;
    }

    var reqContentType = 'multipart/mixed; boundary=\'' + boundary + '\'';
    if ( typeof data === 'string' ) {
      var body = createBody(data);
      callback(false, {
        contentType: reqContentType,
        body: body
      });
    } else {
      var reader = new FileReader();
      reader.readAsBinaryString(data);
      reader.onload = function(e) {
        var body = createBody(reader.result);
        callback(false, {
          contentType: reqContentType,
          body: body
        });
      };
      reader.onerror = function(e) {
        callback(e);
      };
    }
  }

  /**
   * Scans entire file tree for given path
   */
  function getFileIdFromPath(dir, type, callback) {
    var tmp = dir.replace(OSjs.VFS.Modules.GoogleDrive.match, '');
    tmp = tmp.replace(/^\//, '').replace(/\/$/).split('/');

    var currentItem, currentIter;
    var atoms = [''];

    if ( !tmp.length ) {
      return callback(false, false);
    }

    function _findMatching(m, list) {
      var result = null;
      list.forEach(function(iter) {
        if ( iter && iter.title === m ) {
          if ( type ) {
            if ( iter.mimeType === type ) {
              result = iter;
              return false;
            }
          } else {
            result = iter;
            return false;
          }
        }
      });
      return result;
    }

    function _nextDirectory() {
      if ( currentItem ) {
        atoms.push(currentIter);
      }
      currentIter = tmp.shift();

      var tmpItem = new OSjs.VFS.File({
        filename: currentIter,
        type: 'dir',
        path: 'google-drive://' + atoms.join('/')
      });

      getAllDirectoryFiles(tmpItem, function(error, list, ldir) {
        if ( error ) {
          return callback(error);
        }

        currentItem = _findMatching(currentIter, list);
        if ( tmp.length ) {
          _nextDirectory();
        } else {
          callback(false, currentItem);
        }
      });

    }

    _nextDirectory();
  }

  /**
   * Gets the parent path
   */
  function getParentPathId(item, callback) {
    var dir = Utils.dirname(item.path);
    var type = 'application/vnd.google-apps.folder';

    getFileIdFromPath(dir, type, function(error, item) {
      if ( error ) {
        return callback(error);
      }
      callback(false, item ? item.id : null);
    });
  }

  /**
   * Generate FileView compatible array of scandir()
   */
  function createDirectoryList(dir, list, item, options) {
    var result = [];
    if ( list ) {
      list.forEach(function(iter, i) {
        if ( !iter ) { return; }

        var path = dir;

        if ( !path.match(/\/$/) ) {
          path += '/';
        }

        if ( iter.title === '..' ) {
          var tmp = dir.split('/');
          tmp.pop();
          path = tmp.join('/').replace(/\.\.$/);
        }

        path += iter.title === '..' ? '/' : iter.title;

        result.push(new OSjs.VFS.File({
          filename: iter.title,
          path:     path,
          id:       iter.id,
          size:     iter.quotaBytesUsed,
          mime:     iter.mimeType === 'application/vnd.google-apps.folder' ? null : iter.mimeType,
          type:     iter.mimeType === 'application/vnd.google-apps.folder' ? 'dir' : (iter.kind === 'drive#file' ? 'file' : 'dir')
        }));
      });
    }
    return result ? OSjs.VFS.filterScandir(result, options) : [];
  }

  /**
   * Get all files in a directory
   */
  function getAllDirectoryFiles(item, callback) {
    var dir = item.type === 'dir' ? item.path : (Utils.dirname(item.path) + '/'); // FIXME
    var root = dir.replace(OSjs.VFS.Modules.GoogleDrive.match, '') || '/';
    var method = gapi.client.drive.files.list;
    var args = {};
    var initialList = [];

    if ( item.type === 'dir' && root !== '/' ) {
      method = gapi.client.drive.children.list;
      args = {folderId: item.id};
      initialList = [
        {
          title: '..',
          path: Utils.dirname(item.path),
          id: item.id,
          quotaBytesUsed: 0,
          mimeType: 'application/vnd.google-apps.folder'
        }
      ];
    }

    function retrieveAllFiles(cb) {
      var retrievePageOfFiles = function(request, result) {
        request.execute(function(resp) {
          if ( resp.error ) {
            console.warn('GoogleDrive::getAllDirectoryFiles()', 'error', resp);
          }
          if ( root === '/' ) {
            var files = [];
            if ( resp.items ) {
              resp.items.forEach(function(fiter) {
                var isRooted = false;
                fiter.parents.forEach(function(par, idx) {
                  if ( par.isRoot ) {
                    isRooted = true;
                  }
                  if ( idx > 0 && par.isRoot ) {
                    isRooted = false;
                  }
                });

                if ( isRooted ) {
                  files.push(fiter);
                }
              });
            }

            result = result.concat(files);
          } else {
            result = result.concat(resp.items);
          }


          var nextPageToken = resp.nextPageToken;
          if (nextPageToken) {
            var targs = Utils.cloneObject(args);
            args.pageToken = nextPageToken;
            request = method(targs);
            retrievePageOfFiles(request, result);
          } else {
            cb(result);
          }
        });
      };

      try {
        var initialRequest = method(args);
        retrievePageOfFiles(initialRequest, initialList);
      } catch ( e ) {
        console.warn('GoogleDrive::getAllDirectoryFiles() exception', e, e.stack);
        console.warn('THIS ERROR OCCURS WHEN MULTIPLE REQUESTS FIRE AT ONCE ?!'); // FIXME
        cb(initialList);
      }
    }

    function resolveChildLinks(list, cb) {
      var filelist = list.slice(0);
      var result = [];

      function _next() {
        if ( !filelist.length ) {
          return cb(false, result, dir);
        }

        var cur = filelist.shift();
        if ( !cur ) {
          return _next();
        }

        if ( cur.childLink ) {
          var request = gapi.client.drive.files.get({
            fileId: cur.id
          });
          request.execute(function(resp) {
            if ( resp && resp.id ) {
              result.push(resp);
            }
            _next();
          });
        } else {
          result.push(cur);
          _next();
        }
      }

      _next();
    }

    retrieveAllFiles(function(list) {
      console.info('GoogleDrive::getAllDirectoryFiles()', '=>', list);
      resolveChildLinks(list, callback);
    });
  }

  /**
   * Sets the folder for a file
   */
  function setFolder(item, pid, callback) {
    console.info('GoogleDrive::setFolder()', item, pid);

    pid = pid || 'root';

    function _clearFolders(cb) {
      item.parents.forEach(function(p, i) {
        var request = gapi.client.drive.children.delete({
          folderId: p.id,
          childId: item.id
        });

        request.execute(function(resp) {
          if ( i >= (item.parents.length-1) ) {
            cb();
          }
        });
      });
    }

    function _setFolder(rootId, cb) {
      var request = gapi.client.drive.children.insert({
        folderId: pid,
        resource: {id: item.id}
      });

      request.execute(function(resp) {
        console.info('GoogleDrive::setFolder()', '=>', resp);
        callback(false, true);
      });
    }

    _clearFolders(function() {
      _setFolder(pid, callback);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var GoogleDriveStorage = {};

  GoogleDriveStorage.scandir = function(item, callback, options) {
    console.info('GoogleDrive::scandir()', item);

    function doScandir() {
      getAllDirectoryFiles(item, function(error, list, dir) {
        if ( error ) {
          return callback(error);
        }
        var result = createDirectoryList(dir, list, item, options);
        callback(false, result, list);
      });
    }

    var root = item.path.replace(OSjs.VFS.Modules.GoogleDrive.match, '') || '/';
    if ( root !== '/' && !item.id ) {
      var type = 'application/vnd.google-apps.folder';

      getFileIdFromPath(item.path, type, function(error, found) {
        if ( error ) {
          return callback(error);
        }

        if ( found ) {
          item.id = found.id;
        }
        doScandir();
      });
      return;
    }

    doScandir();
  };

  GoogleDriveStorage.read = function(item, callback, options) {
    console.info('GoogleDrive::read()', item);

    var request = gapi.client.drive.files.get({
      fileId: item.id
    });

    var arraybuffer = options ? options.arraybuffer === true : false;
    request.execute(function(file) {
      console.info('GoogleDrive::read()', '=>', file);

      if ( file && file.id ) {
        var accessToken = gapi.auth.getToken().access_token;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', file.downloadUrl);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        if ( arraybuffer ) {
          xhr.responseType = 'arraybuffer';
        }
        xhr.onload = function() {
          callback(false, arraybuffer ? xhr.response : xhr.responseText);
        };
        xhr.onerror = function() {
          callback('XHR Error');
        };
        xhr.send();
      } else {
        callback('Failed to fetch file');
      }
    });
  };

  GoogleDriveStorage.write = function(file, data, callback) {
    console.info('GoogleDrive::write()', file);

    var self = this;

    function _write(parentId) {
      self.exists(file, function(error, exists) {
        var uri = '/upload/drive/v2/files';
        var method = 'POST';
        if ( !error && exists ) {
          uri = '/upload/drive/v2/files/' + exists.id;
          method = 'PUT';
        }

        var fileData = createBoundary(file, data, function(error, fileData) {
          var request = gapi.client.request({
            path: uri,
            method: method,
            params: {uploadType: 'multipart'},
            headers: {'Content-Type': fileData.contentType},
            body: fileData.body
          });

          request.execute(function(resp) {
            console.info('GoogleDrive::write()', '=>', resp);
            if ( resp && resp.id ) {
              if ( parentId ) {
                setFolder(resp, parentId, callback);
              } else {
                callback(false, true);
              }
            } else {
              callback('Failed to write file');
            }
          });
        });
      });
    }

    getParentPathId(file, function(error, id) {
      if ( error ) {
        return callback(error);
      }
      _write(id);
    });
  };

  GoogleDriveStorage.copy = function(src, dest, callback) {
    console.info('GoogleDrive::copy()', src, dest);
    var request = gapi.client.drive.files.copy({
      fileId: Utils.filename(src),
      resource: {title: Utils.filename(dest)}
    });
    request.execute(function(resp) {
      console.info('GoogleDrive::copy()', '=>', resp);
      if ( resp.id ) {
        callback(false, true);
        return;
      }
      callback('Failed to copy');
    });
  };

  GoogleDriveStorage.unlink = function(src, callback) {
    console.info('GoogleDrive::unlink()', src);
    var request = gapi.client.drive.files.delete({
      fileId: src.id
    });
    request.execute(function(resp) {
      console.info('GoogleDrive::unlink()', '=>', resp);
      if ( resp && (typeof resp.result === 'object') ) {
        callback(false, true);
      } else {
        callback('Failed to unlink file');
      }
    });
  };

  GoogleDriveStorage.move = function(src, dest, callback) {
    console.info('GoogleDrive::move()', src, dest);

    var request = gapi.client.drive.files.patch({
      fileId: src.id,
      resource: {
        title: Utils.filename(dest.path)
      }
    });

    request.execute(function(resp) {
      if ( resp && resp.id ) {
        callback(false, true);
      } else {
        callback('Failed to move file');
      }
    });
  };

  GoogleDriveStorage.exists = function(item, callback) {
    console.info('GoogleDrive::exists()', item);

    // FIXME Is there a better way to do this ?
    this.scandir(item, function(error, result) {
      if ( error ) {
        callback('Failed to check existence: ' + error);
        return;
      }
      var found = false;

      if ( result ) {
        result.forEach(function(iter) {
          if ( iter.path === item.path ) {
            found = new OSjs.VFS.File(item.path, iter.mimeType);
            found.id = iter.id;
            found.title = iter.title;
            return false;
          }
          return true;
        });
      }

      callback(false, found);
    });
  };

  GoogleDriveStorage.fileinfo = function(item, callback) {
    console.info('GoogleDrive::fileinfo()', item);

    var request = gapi.client.drive.files.get({
      fileId: item.id
    });
    request.execute(function(resp) {
      if ( resp && resp.id ) {
        var useKeys = ['createdDate', 'id', 'lastModifyingUser', 'lastViewedByMeDate', 'markedViewedByMeDate', 'mimeType', 'modifiedByMeDate', 'modifiedDate', 'title', 'alternateLink'];
        var info = {};
        useKeys.forEach(function(k) {
          info[k] = resp[k];
        });
        return callback(false, info);
      }
      callback('Failed to get file information');
    });
  };

  GoogleDriveStorage.url = function(item, callback) {
    console.info('GoogleDrive::url()', item);
    if ( !item || !item.id ) {
      throw new Error('url() expects a File ref with Id');
    }

    var request = gapi.client.drive.files.get({
      fileId: item.id
    });

    request.execute(function(file) {
      console.info('GoogleDrive::url()', file);
      if ( file && file.webContentLink ) {
        callback(false, file.webContentLink);
      } else {
        callback('Failed to get URL or file not found!');
      }
    });
  };

  GoogleDriveStorage.mkdir = function(dir, callback) {
    console.info('GoogleDrive::mkdir()', dir);
    var parents = null; // TODO

    if ( Utils.dirname(dir.path) !== OSjs.VFS.Modules.GoogleDrive.root ) {
      return callback('You must create folders on the root'); // TODO
    }

    var request = gapi.client.request({
      'path': '/drive/v2/files',
      'method': 'POST',
      'body': JSON.stringify({
        title: dir.filename,
        parents: parents,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    request.execute(function(resp) {
      console.info('GoogleDrive::mkdir()', '=>', resp);
      if ( resp && resp.id ) {
        callback(false, true);
      } else {
        callback('Failed to create directory');
      }
    });
  };

  GoogleDriveStorage.upload = function(file, dest, callback) {
    var ndest = dest.replace(OSjs.VFS.Modules.GoogleDrive.match, '');
    if ( !ndest.match(/\/$/) ) {
      ndest += '/';
    }

    console.info('GoogleDrive::upload()', file, dest, ndest);

    var item = new OSjs.VFS.File({
      filename: file.name,
      path: ndest + file.name,
      mime: file.type,
      size: file.size
    });

    this.write(item, file, callback);
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  var getGoogleDrive = (function() {
    var inited = false;
    return function(callback, onerror) {
      callback = callback || function() {};
      onerror  = onerror  || function() {};

      // Check if user has signed out or revoked permissions
      if ( inited ) {
        var inst = OSjs.Helpers.GoogleAPI.getInstance();
        if ( inst && !inst.authenticated ) {
          inited = false;
        }
      }

      if ( !inited ) {
        var scopes = [
          'https://www.googleapis.com/auth/drive.install',
          'https://www.googleapis.com/auth/drive.file',
          'openid'
        ];
        var iargs = {load: ['drive-realtime', 'drive-share'], scope: scopes};
        OSjs.Helpers.GoogleAPI.createInstance(iargs, function(error, result) {
          if ( error ) {
            return onerror(error);
          }
          gapi.client.load('drive', 'v2', function() {
            inited = true;

            callback(GoogleDriveStorage);
          });
        });
        return;
      }

      callback(GoogleDriveStorage);
    };
  })();

  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || function() {};

    getGoogleDrive(function(instance) {
      if ( !instance ) {
        throw new Error('No GoogleDrive instance was created. Load error ?');
      } else if ( !instance[name] ) {
        throw new Error('Invalid GoogleDrive API call name');
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

  OSjs.VFS.Modules.GoogleDrive = OSjs.VFS.Modules.GoogleDrive || {
    description: 'Google Drive',
    visible: true,
    enabled: function() {
      var handler = API.getHandlerInstance();
      if ( handler ) {
        try {
          if ( handler.getConfig('Core').VFS.GoogleDrive.Enabled ) {
            return true;
          }
        } catch ( e ) {
          console.warn('OSjs.VFS.Modules.GoogleDrive::enabled()', e, e.stack);
        }
      }
      return false;
    },
    root: 'google-drive:///',
    icon: 'places/google-drive.png',
    match: /^google-drive\:\/\//,
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);
