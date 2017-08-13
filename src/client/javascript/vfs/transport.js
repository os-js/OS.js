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
import {_} from 'core/locales';

/**
 * A VFS transport
 *
 * @desc Used via a Mountpoint
 */
export default class Transport {

  /**
   * Performs a request
   *
   * @param {String}      method    Method name
   * @param {Array}       args      Method arguments
   * @param {Object}      options   Options
   * @param {Mountpoint}  mount     Requested from this mountpoint
   * @return {Promise<Object, Error>}
   */
  request(method, args, options, mount) {
    const readOnly = ['upload', 'unlink', 'write', 'mkdir', 'move', 'trash', 'untrash', 'emptyTrash'];
    if ( mount.isReadOnly() ) {
      if ( readOnly.indexOf(method) !== -1 ) {
        return Promise.reject(new Error(_('ERR_VFSMODULE_READONLY')));
      }
    }

    const newArgs = args.concat([options, mount]);
    return this[method](...newArgs);
  }

  scandir(item, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  read(item, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  write(file, data, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  unlink(src, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  copy(src, dest, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  move(src, dest, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  exists(item, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  fileinfo(item, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  mkdir(dir, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  upload(file, dest, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  download(item, options, mount) {
    return new Promise((resolve, reject) => {
      this.url(item).then((url) => {
        return axios({
          responseType: 'arraybuffer',
          url: url,
          method: 'GET'
        }).then((result) => {
          return resolve(result.data);
        }).catch((error) => {
          reject(error.message);
        });
      }).catch(reject);
    });
  }

  url(item, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  find(file, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  trash(file, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  untrash(file, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  emptyTrash(options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

  freeSpace(root, options, mount) {
    return Promise.reject(new Error(_('ERR_VFS_UNAVAILABLE')));
  }

}
