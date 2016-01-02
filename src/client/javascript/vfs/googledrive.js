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
(function(Utils, API) {
  'use strict';

  // https://developers.google.com/drive/web/quickstart/quickstart-js
  // https://developers.google.com/+/web/signin/javascript-flow
  // https://developers.google.com/drive/realtime/realtime-quickstart
  // https://developers.google.com/drive/v2/reference/

  // https://developers.google.com/drive/web/search-parameters
  // https://developers.google.com/drive/v2/reference/files/list
  // http://stackoverflow.com/questions/22092402/python-google-drive-api-list-the-entire-drive-file-tree
  // https://developers.google.com/drive/web/folder

  var gapi = window.gapi = window.gapi  || {};
  var OSjs = window.OSjs = window.OSjs  || {};

  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  // If the user idles the connection for this amount of time, the cache will automatically clean
  // forcing an update. If user uploads from another place etc. OS.js will make sure to fetch these
  var CACHE_CLEAR_TIMEOUT = 7000;

  var _isMounted    = false;
  var _rootFolderId = null;
  var _treeCache    = null;

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
      var base64Data = result;
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

    if ( data instanceof OSjs.VFS.FileDataURL ) {
      callback(false, {
        contentType: reqContentType,
        body: createBody(data.toBase64())
      });
    } else {
      OSjs.VFS.abToBinaryString(data, contentType, function(error, response) {
        callback(error, error ? false : {
          contentType: reqContentType,
          body: createBody(btoa(response))
        });
      });
    }
  }

  /**
   * Scans entire file tree for given path
   */
  function getFileFromPath(dir, type, callback) {
    if ( dir instanceof OSjs.VFS.File ) {
      dir = dir.path;
    }

    var tmpItem = new OSjs.VFS.File({
      filename: Utils.filename(dir),
      type: 'dir',
      path: Utils.dirname(dir)
    });

    console.debug('GoogleDrive::*getFileIdFromPath()', dir, type, tmpItem);

    getAllDirectoryFiles(tmpItem, function(error, list, ldir) {
      if ( error ) {
        return callback(error);
      }

      var found = null;
      list.forEach(function(iter) {
        if ( iter.title === Utils.filename(dir) ) {
          if ( type ) {
            if ( iter.mimeType === type ) {
              found = iter;
              return false;
            }
          } else {
            found = iter;
          }
        }
        return true;
      });

      callback(false, found);
    });
  }

  /**
   * Gets the parent path
   */
  function getParentPathId(item, callback) {
    var dir = Utils.dirname(item.path);
    var type = 'application/vnd.google-apps.folder';

    console.debug('GoogleDrive::*getParentPathId()', item);

    getFileFromPath(dir, type, function(error, item) {
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
    var rdir = dir.replace(/^google-drive\:\/+/, '/'); // FIXME
    var isOnRoot = rdir === '/';

    function createItem(iter, i) {
      var path = dir;
      if ( iter.title === '..' ) {
        path = Utils.dirname(dir);
      } else {
        if ( !isOnRoot ) {
          path += '/';
        }
        path += iter.title;
      }
      var fileType = iter.mimeType === 'application/vnd.google-apps.folder' ? 'dir' : (iter.kind === 'drive#file' ? 'file' : 'dir');
      if ( iter.mimeType === 'application/vnd.google-apps.trash' ) {
        fileType = 'trash';
      }

      return new OSjs.VFS.File({
        filename: iter.title,
        path:     path,
        id:       iter.id,
        size:     iter.quotaBytesUsed || 0,
        mime:     iter.mimeType === 'application/vnd.google-apps.folder' ? null : iter.mimeType,
        type:     fileType
      });
    }

    if ( list ) {
      list.forEach(function(iter, i) {
        if ( !iter ) { return; }
        result.push(createItem(iter, i));
      });
    }
    return result ? OSjs.VFS.filterScandir(result, options) : [];
  }

  /**
   * Get all files in a directory
   */
  var getAllDirectoryFiles = (function() {
    var clearCacheTimeout;

    return function (item, callback) {
      console.log('GoogleDrive::*getAllDirectoryFiles()', item);

      function retrieveAllFiles(cb) {
        if ( clearCacheTimeout ) {
          clearTimeout(clearCacheTimeout);
          clearCacheTimeout = null;
        }
        if ( _treeCache ) {
          console.info('USING CACHE FROM PREVIOUS FETCH!');
          cb(false, _treeCache);
          return;
        }
        console.info('UPDATING CACHE');

        var list = [];

        function retrievePageOfFiles(request, result) {
          request.execute(function(resp) {
            if ( resp.error ) {
              console.warn('GoogleDrive::getAllDirectoryFiles()', 'error', resp);
            }

            result = result.concat(resp.items);

            var nextPageToken = resp.nextPageToken;
            if (nextPageToken) {
              request = gapi.client.drive.files.list({
                pageToken: nextPageToken
              });
              retrievePageOfFiles(request, result);
            } else {
              _treeCache = result;

              cb(false, result);
            }
          });
        }

        try {
          var initialRequest = gapi.client.drive.files.list({});
          retrievePageOfFiles(initialRequest, list);
        } catch ( e ) {
          console.warn('GoogleDrive::getAllDirectoryFiles() exception', e, e.stack);
          console.warn('THIS ERROR OCCURS WHEN MULTIPLE REQUESTS FIRE AT ONCE ?!'); // FIXME
          cb(false, list);
        }
      }

      function getFilesBelongingTo(list, root, cb) {
        var idList = {};
        var parentList = {};
        list.forEach(function(iter) {
          if ( iter ) {
            idList[iter.id] = iter;
            var parents = [];
            if ( iter.parents ) {
              iter.parents.forEach(function(piter) {
                if ( piter ) {
                  parents.push(piter.id);
                }
              });
            }
            parentList[iter.id] = parents;
          }
        });

        var resolves = root.replace(OSjs.VFS.Modules.GoogleDrive.match, '').replace(/^\/+/, '').split('/');
        resolves = resolves.filter(function(el) {
          return el !== '';
        });

        var currentParentId = _rootFolderId;
        var isOnRoot = !resolves.length;

        function _getFileList(foundId) {
          var result = [];

          if ( !isOnRoot ) {
            result.push({
              title: '..',
              path: Utils.dirname(root),
              id: item.id,
              quotaBytesUsed: 0,
              mimeType: 'application/vnd.google-apps.folder'
            });
          }/* else {
            result.push({
              title: 'Trash',
              path: OSjs.VFS.Modules.GoogleDrive.root + '.trash',
              id: null,
              mimeType: 'application/vnd.google-apps.trash'
            });
          }*/

          list.forEach(function(iter) {
            if ( iter && parentList[iter.id] && parentList[iter.id].indexOf(foundId) !== -1 ) {
              result.push(iter);
            }
          });
          return result;
        }

        function _nextDir(completed) {
          var current = resolves.shift();
          var done = resolves.length <= 0;
          var found;

          if ( isOnRoot ) {
            found = currentParentId;
          } else {
            if ( current ) {
              list.forEach(function(iter) {
                if ( iter ) {
                  if ( iter.title === current && parentList[iter.id] && parentList[iter.id].indexOf(currentParentId) !== -1 ) {
                    currentParentId = iter.id;
                    found  = iter.id;
                  }
                }
              });
            }
          }

          if ( done ) {
            completed(found);
          } else {
            _nextDir(completed);
          }
        }

        _nextDir(function(foundId) {
          if ( foundId && idList[foundId] ) {
            cb(false, _getFileList(foundId));
            return;
          } else {
            if ( isOnRoot ) {
              cb(false, _getFileList(currentParentId));
              return;
            }
          }

          cb('Could not list directory');
        });
      }

      function doRetrieve() {
        retrieveAllFiles(function(error, list) {
          var root = item.path;
          if ( error ) {
            callback(error, false, root);
            return;
          }

          getFilesBelongingTo(list, root, function(error, response) {
            console.groupEnd();

            clearCacheTimeout = setTimeout(function() {
              console.info('Clearing GoogleDrive filetree cache!');
              _treeCache = null;
            }, CACHE_CLEAR_TIMEOUT);

            console.log('GoogleDrive::*getAllDirectoryFiles()', '=>', response);
            callback(error, response, root);
          });
        });

      }

      console.group('GoogleDrive::*getAllDirectoryFiles()');

      if ( !_rootFolderId ) {
        var request = gapi.client.drive.about.get();
        request.execute(function(resp) {
          if ( !resp || !resp.rootFolderId ) {
            callback(API._('ERR_VFSMODULE_ROOT_ID'));
            return;
          }
          _rootFolderId = resp.rootFolderId;

          doRetrieve();
        });
      } else {
        doRetrieve();
      }
    };

  })();

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

    getAllDirectoryFiles(item, function(error, list, dir) {
      if ( error ) {
        return callback(error);
      }
      var result = createDirectoryList(dir, list, item, options);
      callback(false, result, list);
    });
  };

  GoogleDriveStorage.read = function(item, callback, options) {
    console.info('GoogleDrive::read()', item);

    function doRead() {
      var request = gapi.client.drive.files.get({
        fileId: item.id
      });

      request.execute(function(file) {
        console.info('GoogleDrive::read()', '=>', file);

        if ( file && file.id ) {
          var accessToken = gapi.auth.getToken().access_token;
          Utils.ajax({
            url: file.downloadUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            requestHeaders: {'Authorization': 'Bearer ' + accessToken},
            onsuccess: function(response) {
              callback(false, response);
            },
            onerror: function(error) {
              callback(API._('ERR_VFSMODULE_XHR_ERROR') + ' - ' + error);
            }
          });
        } else {
          callback(API._('ERR_VFSMODULE_NOSUCH'));
        }
      });
    }

    if ( item.downloadUrl ) {
      doRead();
    } else {
      getFileFromPath(item.path, item.mime, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }
        if ( !response ) {
          callback(API._('ERR_VFSMODULE_NOSUCH'));
          return;
        }

        item = response;
        doRead();
      });
    }
  };

  GoogleDriveStorage.write = function(file, data, callback) {
    console.info('GoogleDrive::write()', file);

    var self = this;

    function doWrite(parentId, fileId) {
      console.debug('GoogleDrive::write()->doWrite()', parentId, fileId);
      var uri = '/upload/drive/v2/files';
      var method = 'POST';
      if ( fileId ) {
        uri = '/upload/drive/v2/files/' + fileId;
        method = 'PUT';
      }

      var fileData = createBoundary(file, data, function(error, fileData) {
        if ( error ) {
          callback(error);
          return;
        }

        var request = gapi.client.request({
          path: uri,
          method: method,
          params: {uploadType: 'multipart'},
          headers: {'Content-Type': fileData.contentType},
          body: fileData.body
        });

        request.execute(function(resp) {
          console.info('GoogleDrive::write()', '=>', resp);
          console.groupEnd();

          _treeCache = null; // Make sure we refetch any cached stuff
          if ( resp && resp.id ) {
            if ( parentId ) {
              setFolder(resp, parentId, callback);
            } else {
              callback(false, true);
            }
          } else {
            callback(API._('ERR_VFSMODULE_NOSUCH'));
          }
        });
      });
    }

    console.group('GoogleDrive::write()');
    getParentPathId(file, function(error, id) {
      console.debug('GoogleDrive::write()->getParentPathId', id);
      if ( error ) {
        console.groupEnd();
        return callback(error);
      }
      if ( file.id ) {
        doWrite(id, file.id);
      } else {
        self.exists(file, function(error, exists) {
          var fileid = error ? null : (exists ? exists.id : null);
          doWrite(id, fileid);
        });
      }
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

      var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
      callback(msg);
    });
  };

  GoogleDriveStorage.unlink = function(src, callback) {
    console.info('GoogleDrive::unlink()', src);

    function doDelete() {
      _treeCache = null; // Make sure we refetch any cached stuff

      var request = gapi.client.drive.files.delete({
        fileId: src.id
      });
      request.execute(function(resp) {
        console.info('GoogleDrive::unlink()', '=>', resp);
        if ( resp && (typeof resp.result === 'object') ) {
          callback(false, true);
        } else {
          var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
          callback(msg);
        }
      });
    }

    if ( !src.id ) {
      getFileFromPath(src.path, src.mime, function(error, response) {
        if ( error ) {
          callback(error);
          return;
        }
        if ( !response ) {
          callback(API._('ERR_VFSMODULE_NOSUCH'));
          return;
        }

        src = response;
        doDelete();
      });
    } else {
      doDelete();
    }
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
        _treeCache = null; // Make sure we refetch any cached stuff
        callback(false, true);
      } else {
        var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
        callback(msg);
      }
    });
  };

  // FIXME Is there a better way to do this ?
  GoogleDriveStorage.exists = function(item, callback) {
    console.info('GoogleDrive::exists()', item);

    var req = new OSjs.VFS.File(OSjs.Utils.dirname(item.path));

    this.scandir(req, function(error, result) {
      if ( error ) {
        callback(error);
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
      callback(API._('ERR_VFSMODULE_NOSUCH'));
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

    request.execute(function(resp) {
      console.info('GoogleDrive::url()', resp);
      if ( resp && resp.webContentLink ) {
        callback(false, resp.webContentLink);
      } else {
        var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
        callback(msg);
      }
    });
  };

  GoogleDriveStorage.mkdir = function(dir, callback) {
    console.info('GoogleDrive::mkdir()', dir);

    function doMkdir(parents) {

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
          _treeCache = null; // Make sure we refetch any cached stuff
          callback(false, true);
        } else {
          var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
          callback(msg);
        }
      });
    }

    if ( Utils.dirname(dir.path) !== OSjs.VFS.Modules.GoogleDrive.root ) {
      getParentPathId(dir, function(error, id) {
        console.debug('GoogleDrive::mkdir()->getParentPathId()', id, 'of', dir);
        if ( error || !id ) {
          error = error || API._('ERR_VFSMODULE_PARENT');
          callback(API._('ERR_VFSMODULE_PARENT_FMT', error));
          return;
        }
        doMkdir([{id: id}]);
      });

      return;
    }

    doMkdir(null);
  };

  GoogleDriveStorage.upload = function(file, dest, callback) {
    var ndest = dest;
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

  GoogleDriveStorage.trash = function(file, callback) {
    var request = gapi.client.drive.files.trash({
      fileId: file.id
    });
    request.execute(function(resp) {
      console.info('GoogleDrive::trash()', '=>', resp);

      if ( resp.id ) {
        callback(false, true);
        return;
      }

      var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
      callback(msg);
    });
  };

  GoogleDriveStorage.untrash = function(file, callback) {
    var request = gapi.client.drive.files.untrash({
      fileId: file.id
    });
    request.execute(function(resp) {
      console.info('GoogleDrive::untrash()', '=>', resp);

      if ( resp.id ) {
        callback(false, true);
        return;
      }

      var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
      callback(msg);
    });
  };

  GoogleDriveStorage.emptyTrash = function(callback) {
    var request = gapi.client.drive.files.emptyTrash({});
    request.execute(function(resp) {
      console.info('GoogleDrive::emptyTrash()', '=>', resp);
      if ( resp && resp.message ) {
        var msg = resp && resp.message ? resp.message : API._('ERR_APP_UNKNOWN_ERROR');
        callback(msg);
        return;
      }
      callback(false, true);
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function getGoogleDrive(callback, onerror) {
    callback = callback || function() {};
    onerror  = onerror  || function() {};

    // Check if user has signed out or revoked permissions
    if ( _isMounted ) {
      var inst = OSjs.Helpers.GoogleAPI.getInstance();
      if ( inst && !inst.authenticated ) {
        _isMounted = false;
      }
    }

    if ( !_isMounted ) {
      var scopes = [
        'https://www.googleapis.com/auth/drive.install',
        'https://www.googleapis.com/auth/drive.file',
        'openid'
      ];
      var loads = [
        'drive-realtime',
        'drive-share'
      ];
      var iargs = {load: loads, scope: scopes};
      OSjs.Helpers.GoogleAPI.createInstance(iargs, function(error, result) {
        if ( error ) {
          return onerror(error);
        }
        gapi.client.load('drive', 'v2', function() {
          _isMounted = true;

          API.message('vfs', {type: 'mount', module: 'GoogleDrive', source: null});

          callback(GoogleDriveStorage);
        });
      });
      return;
    }

    callback(GoogleDriveStorage);
  }

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
    readOnly: false,
    description: 'Google Drive',
    visible: true,
    unmount: function(cb) {
      // FIXME: Should we sign out here too ?
      cb = cb || function() {};
      _isMounted = false;
      API.message('vfs', {type: 'unmount', module: 'GoogleDrive', source: null});
      cb(false, true);
    },
    mounted: function() {
      return _isMounted;
    },
    enabled: function() {
      try {
        if ( API.getConfig('VFS.GoogleDrive.Enabled') ) {
          return true;
        }
      } catch ( e ) {
        console.warn('OSjs.VFS.Modules.GoogleDrive::enabled()', e, e.stack);
      }
      return false;
    },
    root: 'google-drive:///',
    icon: 'places/google-drive.png',
    match: /^google-drive\:\/\//,
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);
