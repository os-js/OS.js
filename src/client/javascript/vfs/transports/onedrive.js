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
import {getConfig} from 'core/config';
import {_} from 'core/locales';
import * as WindowsLiveAPI from 'helpers/windows-live-api';
import * as FS from 'utils/fs';
import * as VFS from 'vfs/fs';

let _isMounted = false;
let _mimeCache;

/*
 * Perform a REST call to WL API
 */
function onedriveCall(args, callback) {
  console.debug('OneDrive::*onedriveCall()', args);

  const WL = window.WL || {};
  WL.api(args).then(
    (response) => {
      callback(false, response);
    },
    (responseFailed) => {
      console.error('OneDrive::*onedriveCall()', 'error', responseFailed, args);
      callback(responseFailed.error.message);
    }
  );
}

/*
 * Gets OS.js VFS File Metadata type from OneDrive item
 */
function getItemType(iter) {
  let type = 'file';
  if ( iter.type === 'folder' || iter.type === 'album' ) {
    type = 'dir';
  }
  return type;
}

/*
 * Get MIME type from file extension of a file
 * Yeah... it's pretty rough, but OneDrive does
 * not support mimes yet
 */
function getItemMime(iter) {
  if ( !_mimeCache ) {
    _mimeCache = getConfig('MIME.mapping', {});
  }
  let mime = null;
  if ( getItemType(iter) !== 'dir' ) {
    mime = 'application/octet-stream';
    let ext = FS.filext(iter.name);
    if ( ext.length ) {
      ext = '.' + ext;
      if ( _mimeCache[ext] ) {
        mime = _mimeCache[ext];
      }
    }
  }
  return mime;
}

/*
 * Get OS.js VFS File Metadata from OneDrive item
 */
function getMetadataFromItem(dir, item, root) {
  const par = dir.replace(/^\/+/, '').replace(/\/+$/, '');
  const path = root + (par ? par + '/' : par) + item.name;

  const itemFile = new FileMetadata({
    id: item.id,
    filename: item.name,
    size: item.size || 0,
    path: path,
    mime: getItemMime(item),
    type: getItemType(item)
  });
  return itemFile;
}

/*
 * Create an Array filled with OS.js VFS file metadata
 */
function createDirectoryList(dir, list, item, options, root) {
  const result = [];

  if ( dir !== '/' ) {
    result.push(new FileMetadata({
      id: item.id,
      filename: '..',
      path: FS.dirname(item.path),
      size: 0,
      type: 'dir'
    }));
  }

  list.forEach((iter) => {
    result.push(getMetadataFromItem(dir, iter, root));
  });

  return result;
}

/*
 * Get files inside given folder
 */
function getFilesInFolder(folderId, callback) {
  onedriveCall({
    path: folderId + '/files',
    method: 'GET'
  }, (error, response) => {
    if ( error ) {
      callback(error);
      return;
    }

    console.debug('OneDrive::*getFilesInFolder()', '=>', response);
    callback(false, response.data || []);
  });
}

/*
 * Check if file is existent inside given folder
function isFileInFolder(folderId, file, callback, returnIter) {
  getFilesInFolder(folderId, (error, list) => {
    if ( error ) {
      callback(error);
      return;
    }

    var found;
    list.forEach((iter) => {
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

      var dir = FS.getPathProtocol(FS.dirname(found.path));
      var foundFile = getMetadataFromItem(dir, found);
      callback(false, foundFile);
    } else {
      callback('Could not find requested file');
    }
  });
}
*/

/*
 * Resolve normal /path/to/file to OneDrive ID
 */
function resolvePath(item, callback, useParent) {
  if ( !useParent ) {
    if ( item.id ) {
      callback(false, item.id);
      return;
    }
  }

  let path = FS.getPathFromVirtual(item.path).replace(/\/+/, '/');
  if ( useParent ) {
    path = FS.dirname(path);
  }
  if ( path === '/' ) {
    callback(false, 'me/skydrive');
    return;
  }

  const resolves = path.replace(/^\/+/, '').split('/');
  const isOnRoot = !resolves.length;

  let currentParentId = 'me/skydrive';

  function _nextDir(completed) {
    const current = resolves.shift();
    const done = resolves.length <= 0;
    let found;

    if ( isOnRoot ) {
      found = currentParentId;
    } else {

      if ( current ) {
        getFilesInFolder(currentParentId, (error, list) => {
          list = list || [];

          let lfound;

          if ( !error ) {
            list.forEach((iter) => { // FIXME: Not very precise
              if ( iter ) {
                if ( iter.name === current ) {
                  lfound = iter.id;
                }
              }
            });

            if ( lfound ) {
              currentParentId = lfound;
            }
          } else {
            console.warn('OneDrive', 'resolvePath()', 'getFilesInFolder() error', error);
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

  _nextDir((foundId) => {
    if ( foundId ) {
      callback(false, foundId);
    } else {
      callback(_('ONEDRIVE_ERR_RESOLVE'));
    }
  });
}

///////////////////////////////////////////////////////////////////////////////
// TRANSPORTER
///////////////////////////////////////////////////////////////////////////////

/**
 * Microsoft OneDrive VFS Transport Module
 *
 * @extends Transport
 */
export default class OneDriveTransport extends Transport {

  _init() {
    return new Promise((resolve, reject) => {
      const iargs = {scope: ['wl.signin', 'wl.skydrive', 'wl.skydrive_update']};
      if ( _isMounted ) {
        resolve(true);
      } else {
        WindowsLiveAPI.create(iargs, (error) => {
          if ( error ) {
            reject(new Error(error));
          } else {
            _isMounted = true;
            resolve(true);
          }
        });
      }
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
      const relativePath = FS.getPathFromVirtual(item.path);

      resolvePath(item, (error, drivePath) => {
        if ( error ) {
          reject(new Error(error));
        } else {
          onedriveCall({
            path: drivePath,
            method: 'GET'
          }, (error, response) => {
            if ( error ) {
              reject(new Error(error));
            } else {
              getFilesInFolder(response.id, (error, list) => {
                if ( error ) {
                  reject(new Error(error));
                } else {
                  const fileList = createDirectoryList(relativePath, list, item, options, mount.option('root'));
                  resolve(fileList);
                }
              });
            }
          });
        }
      });
    });
  }

  read(item, options, mount) {
    return new Promise((resolve, reject) => {
      this.url(item).then((url) => {
        const file = new FileMetadata(url, item.mime);
        VFS.read(file, options).then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  write(file, data) {
    return new Promise((resolve, reject) => {
      const inst = WindowsLiveAPI.instance();
      const url = 'https://apis.live.net/v5.0/me/skydrive/files?access_token=' + inst.accessToken;
      const fd  = new FormData();
      FS.addFormFile(fd, 'file', data, file);

      axios({
        url: url,
        method: 'POST',
        responseType: 'json',
        data: fd
      }).then((response) => {
        const result = response.data;
        if ( result && result.id ) {
          return resolve(result.id);
        }
        return reject(new Error(_('ERR_APP_UNKNOWN_ERROR')));
      }).catch(reject);
    });
  }

  copy(src, dest) {
    return new Promise((resolve, reject) => {
      dest = new FileMetadata(FS.dirname(dest.path));

      resolvePath(src, (error, srcDrivePath) => {
        if ( error ) {
          reject(new Error(error));
        } else {
          resolvePath(dest, (error, dstDrivePath) => {
            if ( error ) {
              reject(new Error(error));
            } else {
              onedriveCall({
                path: srcDrivePath,
                method: 'COPY',
                body: {
                  destination: dstDrivePath
                }
              }, (error, response) => {
                return error ? reject(new Error(error)) : resolve(true);
              });
            }
          });
        }
      });
    });
  }

  move(src, dest) {
    return new Promise((resolve, reject) => {
      dest = new FileMetadata(FS.dirname(dest.path));

      resolvePath(src, (error, srcDrivePath) => {
        if ( error ) {
          reject(new Error(error));
        } else {
          resolvePath(dest, (error, dstDrivePath) => {
            if ( error ) {
              reject(new Error(error));
            } else {
              onedriveCall({
                path: srcDrivePath,
                method: 'MOVE',
                body: {
                  destination: dstDrivePath
                }
              }, (error, response) => {
                return error ? reject(new Error(error)) : resolve(true);
              });
            }
          });
        }
      });
    });
  }

  exists(item) {
    return new Promise((resolve, reject) => {
      // FIXME Is there a better way to do this ?
      this.fileinfo(item)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }

  fileinfo(item) {
    return new Promise((resolve, reject) => {
      resolvePath(item, (error, drivePath) => {
        if ( error ) {
          reject(new Error(error));
        } else {
          onedriveCall({
            path: drivePath,
            method: 'GET'
          }, (error, response) => {
            if ( error ) {
              reject(new Error(error));
            } else {
              const useKeys = ['created_time', 'id', 'link', 'name', 'type', 'updated_time', 'upload_location', 'description', 'client_updated_time'];
              const info = {};
              useKeys.forEach((k) => {
                info[k] = response[k];
              });
              resolve(info);
            }
          });
        }
      });
    });
  }

  url(item) {
    return new Promise((resolve, reject) => {
      resolvePath(item, function(error, drivePath) {
        if ( error ) {
          reject(new Error(error));
        } else {
          onedriveCall({
            path: drivePath + '/content',
            method: 'GET'
          }, (error, response) => {
            if ( error ) {
              reject(new Error(error));
            } else {
              resolve(response.location);
            }
          });
        }
      });
    });
  }

  mkdir(dir) {
    return new Promise((resolve, reject) => {
      resolvePath(dir, (error, drivePath) => {
        if ( error ) {
          reject(error);
        } else {
          onedriveCall({
            path: drivePath,
            method: 'POST',
            body: {
              name: dir.filename
            }
          }, (error, response) => {
            return error ? reject(new Error(error)) : resolve(true);
          });
        }
      }, true);
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

  freeSpace(root) {
    return Promise.resolve(-1);
  }

  unlink(src) {
    return new Promise((resolve, reject) => {
      resolvePath(src, (error, drivePath) => {
        if ( error ) {
          reject(new Error(error));
        } else {
          onedriveCall({
            path: drivePath,
            method: 'DELETE'
          }, (error, response) => {
            return error ? reject(new Error(error)) : resolve(true);
          });
        }
      });
    });
  }

}
