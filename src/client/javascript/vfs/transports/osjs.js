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
import Promise from 'bluebird';
import FileMetadata from 'vfs/file';
import * as FS from 'utils/fs';
import Connection from 'core/connection';
import Transport from 'vfs/transport';
import {getConfig} from 'core/config';
import {_} from 'core/locales';

/**
 * OS.js VFS Transport Module
 *
 * This module allows you to interact with files via the OS.js server.
 *
 * @extends Transport
 */
export default class OSjsTransport extends Transport {

  _request(method, args, options) {
    return Connection.request('FS:' + method, args, options);
  }

  _requestUpload(dest, file, options) {
    options = options || {};
    dest = (dest instanceof FileMetadata) ? dest.path : dest;

    if ( typeof file.size !== 'undefined' ) {
      const maxSize = getConfig('VFS.MaxUploadSize');
      if ( maxSize > 0 ) {
        const bytes = file.size;
        if ( bytes > maxSize ) {
          const msg = _('DIALOG_UPLOAD_TOO_BIG_FMT', FS.humanFileSize(maxSize));
          return Promise.reject(new Error(msg));
        }
      }
    }

    const fd  = new FormData();
    fd.append('path', dest);
    if ( file ) {
      fd.append('filename', file.filename);
    }

    if ( options ) {
      Object.keys(options).forEach((key) => {
        if ( key !== 'meta' && typeof options[key] !== 'function' ) {
          fd.append(key, String(options[key]));
        }
      });
    }

    if ( file instanceof window.ArrayBuffer ) {
      fd.append('size', String(file.byteLength));
    }

    FS.addFormFile(fd, 'upload', file, options.meta);

    return this._request('upload', fd, options);
  }

  scandir(item, options) {
    options = options || {};

    const args = {
      path: item.path,
      options: {
        shortcuts: options.shortcuts
      }
    };

    return new Promise((resolve, reject) => {
      this._request('scandir', args, options).then((result) => {
        return resolve(result.map((i) => new FileMetadata(i)));
      }).catch(reject);
    });
  }

  read(item, options) {
    return this._request('get', {path: item.path}, options);
  }

  write(file, data, options) {
    options = options || {};
    options.meta = file;
    options.overwrite = true;
    options.onprogress = options.onprogress || function() {};

    const parentfile = new FileMetadata(FS.dirname(file.path), file.mime);
    return this._requestUpload(parentfile, data, options);
  }

  unlink(src) {
    return this._request('unlink', {path: src.path});
  }

  copy(src, dest, options) {
    return this._request('copy', {src: src.path, dest: dest.path}, options);
  }

  move(src, dest, options) {
    return this._request('move', {src: src.path, dest: dest.path}, options);
  }

  exists(item) {
    return this._request('exists', {path: item.path});
  }

  fileinfo(item) {
    return this._request('fileinfo', {path: item.path});
  }

  mkdir(dir) {
    return this._request('mkdir', {path: dir.path});
  }

  upload(dest, data, options) {
    return this._requestUpload(dest, data, options);
  }

  url(item, options) {
    if ( typeof item === 'string' ) {
      item = new FileMetadata(item);
    }

    return Promise.resolve(Connection.instance.getVFSPath(item, options));
  }

  find(file, options) {
    return this._request('find', {path: file.path, args: options});
  }

  trash(file) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  untrash(file) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  emptyTrash() {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  freeSpace(root) {
    return this._request('freeSpace', {root: root});
  }

}
