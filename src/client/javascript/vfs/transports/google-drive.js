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
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
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
import axios from 'axios';
import Promise from 'bluebird';
import Transport from 'vfs/transport';
import FileMetadata from 'vfs/file';
import FileDataURL from 'vfs/filedataurl';
import MountManager from 'core/mount-manager';
import {_} from 'core/locales';
import * as GoogleAPI from 'helpers/google-api';
import * as FS from 'utils/fs';

const CACHE_CLEAR_TIMEOUT = 7000;

let gapi = window.gapi = window.gapi || {};
let _authenticated;
let _clearCacheTimeout;
let _rootFolderId;
let _treeCache;

/*
 * Generate FileView compatible array of scandir()
 */
function createDirectoryList(dir, list, item, options, match) {
  const result = [];
  const rdir = dir.replace(match, '/').replace(/\/+/g, '/');
  const isOnRoot = rdir === '/';

  function createItem(iter, i) {
    let path = dir;
    if ( iter.title === '..' ) {
      path = FS.dirname(dir);
    } else {
      if ( !isOnRoot ) {
        path += '/';
      }
      path += iter.title;
    }
    let fileType = iter.mimeType === 'application/vnd.google-apps.folder' ? 'dir' : (iter.kind === 'drive#file' ? 'file' : 'dir');
    if ( iter.mimeType === 'application/vnd.google-apps.trash' ) {
      fileType = 'trash';
    }

    return new FileMetadata({
      filename: iter.title,
      path: path,
      id: iter.id,
      size: iter.quotaBytesUsed || 0,
      mime: iter.mimeType === 'application/vnd.google-apps.folder' ? null : iter.mimeType,
      type: fileType
    });
  }

  if ( list ) {
    list.forEach((iter, i) => {
      if ( !iter ) {
        return;
      }
      result.push(createItem(iter, i));
    });
  }
  return result ? result : [];
}

/*
 * Get all files in a directory
 */
function getAllDirectoryFiles(item, callback) {
  console.debug('GoogleDrive::*getAllDirectoryFiles()', item);

  function retrieveAllFiles(cb) {
    if ( _clearCacheTimeout ) {
      clearTimeout(_clearCacheTimeout);
      _clearCacheTimeout = null;
    }
    if ( _treeCache ) {
      console.info('USING CACHE FROM PREVIOUS FETCH!');
      cb(false, _treeCache);
      return;
    }
    console.info('UPDATING CACHE');

    let list = [];

    function retrievePageOfFiles(request, result) {
      request.execute((resp) => {
        if ( resp.error ) {
          console.warn('GoogleDrive::getAllDirectoryFiles()', 'error', resp);
        }

        result = result.concat(resp.items);

        const nextPageToken = resp.nextPageToken;
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
      const initialRequest = gapi.client.drive.files.list({});
      retrievePageOfFiles(initialRequest, list);
    } catch ( e ) {
      console.warn('GoogleDrive::getAllDirectoryFiles() exception', e, e.stack);
      console.warn('THIS ERROR OCCURS WHEN MULTIPLE REQUESTS FIRE AT ONCE ?!'); // FIXME
      cb(false, list);
    }
  }

  function getFilesBelongingTo(list, root, cb) {
    const idList = {};
    const parentList = {};
    list.forEach((iter) => {
      if ( iter ) {
        idList[iter.id] = iter;
        const parents = [];
        if ( iter.parents ) {
          iter.parents.forEach((piter) => {
            if ( piter ) {
              parents.push(piter.id);
            }
          });
        }
        parentList[iter.id] = parents;
      }
    });

    let resolves = FS.getPathFromVirtual(root).replace(/^\/+/, '').split('/');
    resolves = resolves.filter((el) => {
      return el !== '';
    });

    let currentParentId = _rootFolderId;
    let isOnRoot = !resolves.length;

    function _getFileList(foundId) {
      const result = [];

      if ( !isOnRoot ) {
        result.push({
          title: '..',
          path: FS.dirname(root),
          id: item.id,
          quotaBytesUsed: 0,
          mimeType: 'application/vnd.google-apps.folder'
        });
      }

      list.forEach((iter) => {
        if ( iter && parentList[iter.id] && parentList[iter.id].indexOf(foundId) !== -1 ) {
          result.push(iter);
        }
      });
      return result;
    }

    function _nextDir(completed) {
      let current = resolves.shift();
      let done = resolves.length <= 0;
      let found;

      if ( isOnRoot ) {
        found = currentParentId;
      } else {
        if ( current ) {
          list.forEach((iter) => {
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

    _nextDir((foundId) => {
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
    retrieveAllFiles((error, list) => {
      const root = item.path;
      if ( error ) {
        callback(error, false, root);
        return;
      }

      getFilesBelongingTo(list, root, (error, response) => {
        console.groupEnd();

        _clearCacheTimeout = setTimeout(() => {
          console.info('Clearing GoogleDrive filetree cache!');
          _treeCache = null;
        }, CACHE_CLEAR_TIMEOUT);

        console.debug('GoogleDrive::*getAllDirectoryFiles()', '=>', response);
        callback(error, response, root);
      });
    });

  }

  console.group('GoogleDrive::*getAllDirectoryFiles()');

  if ( !_rootFolderId ) {
    const request = gapi.client.drive.about.get();
    request.execute((resp) => {
      if ( !resp || !resp.rootFolderId ) {
        callback(_('ERR_VFSMODULE_ROOT_ID'));
        return;
      }
      _rootFolderId = resp.rootFolderId;

      doRetrieve();
    });
  } else {
    doRetrieve();
  }

}

/*
 * Scans entire file tree for given path
 */
function getFileFromPath(dir, type, callback) {
  if ( dir instanceof FileMetadata ) {
    dir = dir.path;
  }

  const tmpItem = new FileMetadata({
    filename: FS.filename(dir),
    type: 'dir',
    path: FS.dirname(dir)
  });

  console.debug('GoogleDrive::*getFileIdFromPath()', dir, type, tmpItem);

  getAllDirectoryFiles(tmpItem, (error, list, ldir) => {
    if ( error ) {
      callback(error);
      return;
    }

    let found = null;
    list.forEach((iter) => {
      if ( iter.title === FS.filename(dir) ) {
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

/*
 * Gets the parent path
 */
function getParentPathId(item, callback) {
  const dir = FS.dirname(item.path);
  const type = 'application/vnd.google-apps.folder';

  console.debug('GoogleDrive::*getParentPathId()', item);

  getFileFromPath(dir, type, (error, item) => {
    if ( error ) {
      callback(error);
    } else {
      callback(false, item ? item.id : null);
    }
  });
}

/*
 * Creates the boundary data for uploads
 */
function createBoundary(file, data, callback) {
  const boundary = '-------314159265358979323846';
  const delimiter = '\r\n--' + boundary + '\r\n';
  const close_delim = '\r\n--' + boundary + '--';
  const contentType = file.mime || 'text/plain'; //fileData.type || 'application/octet-stream';

  function createBody(result) {
    const metadata = {
      title: file.filename,
      mimeType: contentType
    };
    const base64Data = result;
    const multipartRequestBody =
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

  const reqContentType = 'multipart/mixed; boundary=\'' + boundary + '\'';

  if ( data instanceof FileDataURL ) {
    callback(false, {
      contentType: reqContentType,
      body: createBody(data.toBase64())
    });
  } else {
    FS.abToBinaryString(data, contentType, (error, response) => {
      callback(error, error ? false : {
        contentType: reqContentType,
        body: createBody(btoa(response))
      });
    });
  }
}

/*
 * Sets the folder for a file
 */
function setFolder(item, pid, callback) {
  console.info('GoogleDrive::setFolder()', item, pid);

  pid = pid || 'root';

  function _clearFolders(cb) {
    item.parents.forEach((p, i) => {
      const request = gapi.client.drive.children.delete({
        folderId: p.id,
        childId: item.id
      });

      request.execute((resp) => {
        if ( i >= (item.parents.length - 1) ) {
          cb();
        }
      });
    });
  }

  function _setFolder(rootId, cb) {
    const request = gapi.client.drive.children.insert({
      folderId: pid,
      resource: {id: item.id}
    });

    request.execute((resp) => {
      console.info('GoogleDrive::setFolder()', '=>', resp);
      callback(false, true);
    });
  }

  _clearFolders(() => {
    _setFolder(pid, callback);
  });
}

///////////////////////////////////////////////////////////////////////////////
// TRANSPORTER
///////////////////////////////////////////////////////////////////////////////

/**
 * Google Drive VFS Transport Module
 *
 * @extends Transport
 */
export default class GoogleDriveTransport extends Transport {

  _init() {
    if ( _authenticated ) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      GoogleAPI.create({
        scope: [
          'https://www.googleapis.com/auth/drive.install',
          'https://www.googleapis.com/auth/drive.file',
          'openid'
        ],
        load: [
          'drive-realtime',
          'drive-share'
        ]
      }, (err, res) => {
        gapi.client.load('drive', 'v2', (err) => {
          if ( !err ) {
            _authenticated = true;
          }

          return err ? reject(new Error(err)) : resolve(true);
        });
      });
    });
  }

  request(method, args, options, mount) {
    const fargs = arguments;
    return new Promise((resolve, reject) => {
      this._init().then(() => {
        return super.request(...fargs).then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  scandir(item, options, mount) {
    return new Promise((resolve, reject) => {
      getAllDirectoryFiles(item, (error, list, dir) => {
        if ( error ) {
          reject(new Error(error));
        } else {
          const result = createDirectoryList(dir, list, item, options, mount.option('match'));
          resolve(result);
        }
      });
    });
  }

  read(item, options, mount) {
    const read = (ritem) => new Promise((resolve, reject) => {

      const request = gapi.client.drive.files.get({
        fileId: ritem.id
      });

      request.execute((file) => {

        if ( file && file.id ) {
          let accessToken = gapi.auth.getToken().access_token;

          axios({
            url: file.downloadUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: {'Authorization': 'Bearer ' + accessToken}
          }).then((response) => {
            return resolve(response.data);
          }).catch((error) => {
            reject(new Error(_('ERR_VFSMODULE_XHR_ERROR') + ' - ' + error.message));
          });
        } else {
          reject(new Error(_('ERR_VFSMODULE_NOSUCH')));
        }
      });
    });

    return new Promise((resolve, reject) => {
      if ( item.downloadUrl ) {
        read(item).then(resolve).catch(reject);
      } else {
        getFileFromPath(item.path, item.mime, function(error, response) {
          if ( error ) {
            reject(new Error(error));
          } else if ( !response ) {
            reject(new Error(_('ERR_VFSMODULE_NOSUCH')));
          } else {
            read(response).then(resolve).catch(reject);
          }
        });
      }
    });
  }

  write(file, data) {
    const write = (parentId, fileId) => new Promise((resolve, reject) => {
      let uri = '/upload/drive/v2/files';
      let method = 'POST';
      if ( fileId ) {
        uri = '/upload/drive/v2/files/' + fileId;
        method = 'PUT';
      }

      createBoundary(file, data, (error, fileData) => {
        if ( error ) {
          reject(new Error(error));
        } else {
          const request = gapi.client.request({
            path: uri,
            method: method,
            params: {uploadType: 'multipart'},
            headers: {'Content-Type': fileData.contentType},
            body: fileData.body
          });

          request.execute((resp) => {
            _treeCache = null; // Make sure we refetch any cached stuff

            if ( resp && resp.id ) {
              if ( parentId ) {
                setFolder(resp, parentId, (err, res) => {
                  return err ? reject(new Error(err)) : resolve(res);
                });
              } else {
                resolve(true);
              }
            } else {
              reject(_('ERR_VFSMODULE_NOSUCH'));
            }
          });
        }
      });
    });

    return new Promise((resolve, reject) => {
      getParentPathId(file, (error, id) => {
        if ( error ) {
          reject(new Error(error));
        } else if ( file.id ) {
          write(id, file.id).then(resolve).catch(reject);
        } else {
          this.exists(file).then((exists) => {
            return write(id, exists ? exists.id : null).then(resolve).catch(reject);
          }).catch(() => {
            write(id, null).then(resolve).catch(reject);
          });
        }
      });
    });
  }

  copy(src, dest) {
    return new Promise((resolve, reject) => {
      const request = gapi.client.drive.files.copy({
        fileId: src.id, //FS.filename(src.path),
        resource: {title: FS.filename(dest.path)}
      });

      request.execute((resp) => {
        if ( resp.id ) {
          getParentPathId(dest, (error, parentId) => {
            if ( error ) {
              console.warn(error);
              resolve(true);
            } else {
              _treeCache = null; // Make sure we refetch any cached stuff

              setFolder(resp, parentId, (err, res) => {
                return err ? reject(new Error(err)) : resolve(res);
              });
            }
          });
        } else {
          const msg = resp && resp.message ? resp.message : _('ERR_APP_UNKNOWN_ERROR');
          reject(new Error(msg));
        }
      });
    });
  }

  move(src, dest) {
    return new Promise((resolve, reject) => {
      const request = gapi.client.drive.files.patch({
        fileId: src.id,
        resource: {
          title: FS.filename(dest.path)
        }
      });

      request.execute((resp) => {
        if ( resp && resp.id ) {
          _treeCache = null; // Make sure we refetch any cached stuff

          resolve(true);
        } else {
          const msg = resp && resp.message ? resp.message : _('ERR_APP_UNKNOWN_ERROR');
          reject(new Error(msg));
        }
      });
    });
  }

  exists(item) {
    // FIXME Is there a better way to do this ?
    return new Promise((resolve, reject) => {
      const req = new FileMetadata(FS.dirname(item.path));
      this.scandir(req).then((result) => {
        const found = result.find((iter) => iter.path === item.path);
        if ( found ) {
          const file = new FileMetadata(item.path, found.mimeType);
          file.id = found.id;
          file.title = found.title;
          return resolve(file);
        }

        return resolve(false);
      }).catch(reject);
    });
  }

  fileinfo(item) {
    return new Promise((resolve, reject) => {
      const request = gapi.client.drive.files.get({
        fileId: item.id
      });

      request.execute((resp) => {
        if ( resp && resp.id ) {
          const useKeys = ['createdDate', 'id', 'lastModifyingUser', 'lastViewedByMeDate', 'markedViewedByMeDate', 'mimeType', 'modifiedByMeDate', 'modifiedDate', 'title', 'alternateLink'];
          const info = {};
          useKeys.forEach((k) => {
            info[k] = resp[k];
          });

          resolve(info);
        } else {
          reject(_('ERR_VFSMODULE_NOSUCH'));
        }
      });
    });
  }

  url(item) {
    return new Promise((resolve, reject) => {
      if ( !item || !item.id ) {
        reject(new Error('url() expects a File ref with Id'));
      } else {
        const request = gapi.client.drive.files.get({
          fileId: item.id
        });

        request.execute((resp) => {
          if ( resp && resp.webContentLink ) {
            resolve(resp.webContentLink);
          } else {
            const msg = resp && resp.message ? resp.message : _('ERR_APP_UNKNOWN_ERROR');
            reject(new Error(msg));
          }
        });
      }
    });
  }

  mkdir(dir) {
    const mkdir = (parents) => new Promise((resolve, reject) => {
      const request = gapi.client.request({
        'path': '/drive/v2/files',
        'method': 'POST',
        'body': JSON.stringify({
          title: dir.filename,
          parents: parents,
          mimeType: 'application/vnd.google-apps.folder'
        })
      });

      request.execute((resp) => {
        if ( resp && resp.id ) {
          _treeCache = null; // Make sure we refetch any cached stuff
          resolve(true);
        } else {
          const msg = resp && resp.message ? resp.message : _('ERR_APP_UNKNOWN_ERROR');
          reject(new Error(msg));
        }
      });
    });

    return new Promise((resolve, reject) => {
      const module = MountManager.getModuleFromPath(dir.path);
      const dirDest = FS.getPathFromVirtual(FS.dirname(dir.path));
      const rootDest = FS.getPathFromVirtual(module.option('root'));

      if ( dirDest !== rootDest ) {
        getParentPathId(dir, (error, id) => {
          if ( error || !id ) {
            reject(new Error(_('ERR_VFSMODULE_PARENT_FMT', error || _('ERR_VFSMODULE_PARENT'))));
          } else {
            mkdir([{id: id}]).then(resolve).catch(reject);
          }
        });
      } else {
        mkdir(null).then(resolve).catch(reject);
      }
    });
  }

  upload(dest, file) {
    const item = new FileMetadata({
      filename: file.name,
      path: FS.pathJoin(dest.path, file.name),
      mime: file.type,
      size: file.size
    });

    return this.write(item, file);
  }

  trash(file) {
    return new Promise((resolve, reject) => {
      const request = gapi.client.drive.files.trash({
        fileId: file.id
      });

      request.execute((resp) => {
        if ( resp.id ) {
          resolve(true);
        } else {
          const msg = resp && resp.message ? resp.message : _('ERR_APP_UNKNOWN_ERROR');
          reject(new Error(msg));
        }
      });
    });
  }

  untrash(file) {
    return new Promise((resolve, reject) => {
      const request = gapi.client.drive.files.untrash({
        fileId: file.id
      });

      request.execute((resp) => {
        if ( resp.id ) {
          resolve(true);
        } else {
          const msg = resp && resp.message ? resp.message : _('ERR_APP_UNKNOWN_ERROR');
          reject(new Error(msg));
        }
      });
    });
  }

  emptyTrash() {
    return new Promise((resolve, reject) => {
      const request = gapi.client.drive.files.emptyTrash({});
      request.execute((resp) => {
        if ( resp && resp.message ) {
          const msg = resp && resp.message ? resp.message : _('ERR_APP_UNKNOWN_ERROR');
          reject(new Error(msg));
        } else {
          resolve(true);
        }
      });
    });
  }

  freeSpace(root) {
    return Promise.resolve(-1);
  }

  unlink(src) {
    const unlink = (s) => {
      _treeCache = null; // Make sure we refetch any cached stuff

      return new Promise((resolve, reject) => {
        const request = gapi.client.drive.files.delete({
          fileId: s.id
        });

        request.execute((resp) => {
          if ( resp && (typeof resp.result === 'object') ) {
            resolve(true);
          } else {
            const msg = resp && resp.message ? resp.message : _('ERR_APP_UNKNOWN_ERROR');
            reject(new Error(msg));
          }
        });
      });
    };

    if ( !src.id ) {
      return new Promise((resolve, reject) => {
        getFileFromPath(src.path, src.mime, (error, response) => {
          if ( error ) {
            reject(new Error(error));
          } else if ( !response ) {
            reject(new Error(_('ERR_VFSMODULE_NOSUCH')));
          } else {
            unlink(response).then(resolve).catch(reject);
          }
        });
      });
    }

    return unlink(src);
  }

}
