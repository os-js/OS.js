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

// https://github.com/dropbox/dropbox-sdk-js
// https://github.com/dropbox/dropbox-sdk-js/blob/master/examples/javascript/auth/index.html
// http://dropbox.github.io/dropbox-sdk-js/Dropbox.html

import Promise from 'bluebird';
import Transport from 'vfs/transport';
import Preloader from 'utils/preloader';
import {getConfig} from 'core/config';
import FileMetadata from 'vfs/file';
import {urlparams} from 'utils/misc';
import {_} from 'core/locales';
import * as FS from 'utils/fs';

const AUTH_TIMEOUT = (1000 * 30);
const MAX_RESULTS = 100;

///////////////////////////////////////////////////////////////////////////////
// TRANSPORTER
///////////////////////////////////////////////////////////////////////////////

/**
 * Dropbox (v2) VFS Transport Module
 *
 * @extends Transport
 */
export default class DropboxTransport extends Transport {
  constructor() {
    super(...arguments);

    this.loaded = false;
    this.authed = false;
    this.dbx = null;
  }

  _loadDependencies() {
    if ( this.loaded ) {
      return Promise.resolve(true);
    }

    return new Promise((resolve, reject) => {
      Preloader.preload([
        'https://unpkg.com/dropbox/dist/Dropbox-sdk.min.js'
      ]).then(() => {
        if ( window.Dropbox ) {
          this.loaded = true;
          return resolve(true);
        }

        return reject(new Error(_('ERR_DROPBOX_API')));
      }).catch((err) => {
        this.loaded = true;
        return reject(err);
      });
    });
  }

  _createClient(clientId) {
    if ( this.authed ) {
      return Promise.resolve(true);
    }

    return new Promise((resolve, reject) => {
      let timedOut;
      let loginTimeout;

      this.dbx = new window.Dropbox({
        clientId: clientId
      });

      const redirectUrl = window.location.href.replace(/\/?$/, '/') + 'dropbox-oauth.html';
      const callbackName = '__osjs__dropbox_callback__';

      window[callbackName] = (url) => {
        clearTimeout(loginTimeout);
        if ( timedOut ) {
          return;
        }

        const params = urlparams(url, true);
        if ( params.access_token ) {
          this.authed = true;
          this.dbx = new window.Dropbox({
            accessToken: params.access_token
          });

          resolve(true);
        } else {
          reject(new Error(_('ERR_DROPBOX_AUTH')));
        }
      };

      const authUrl = this.dbx.getAuthenticationUrl(redirectUrl);

      loginTimeout = setTimeout(() => {
        timedOut = true;
        reject(new Error(_('ERR_DROPBOX_AUTH')));
      }, AUTH_TIMEOUT);

      window.open(authUrl);
    });
  }

  _init() {
    const clientId = getConfig('DropboxAPI.ClientKey');
    if ( !clientId ) {
      return Promise.reject(new Error(_('ERR_DROPBOX_KEY')));
    }

    return new Promise((resolve, reject) => {
      this._loadDependencies().then(() => {
        return this._createClient(clientId).then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  request(method, args, options, mount) {
    const fargs = arguments;
    return new Promise((resolve, reject) => {
      this._init().then(() => {
        return super.request(...fargs).then(resolve).catch((err) => {
          if ( typeof err !== 'string' && !(err instanceof Error) ) {
            if ( err.status && err.response && err.error ) {
              return reject(new Error(err.error.error_summary));
            }
          }
          return reject(err);
        });
      }).catch(reject);
    });
  }

  _createMetadata(root, iter) {
    return {
      id: iter.id,
      filename: iter.name,
      path: FS.pathJoin(root, iter.path_display),
      type: iter['.tag'] === 'folder' ? 'dir' : 'file',
      size: iter.size || 0
    };
  }

  find(file, options, a, mount) {
    const root = FS.getPathFromVirtual(file.path);

    return new Promise((resolve, reject) => {
      this.dbx.filesSearch({
        path: root === '/' ? '' : root,
        query: options.query,
        max_results: MAX_RESULTS,
        mode: {
          '.tag': 'filename'
        }
      }).then((response) => {
        return resolve(response.matches.map((iter) => {
          return this._createMetadata(mount.option('root'), iter.metadata);
        }));
      }).catch(reject);
    });
  }

  scandir(item, options, mount) {
    const root = FS.getPathFromVirtual(item.path);

    let result = [];

    const scandir = (cursor) => new Promise((resolve, reject) => {
      const m = cursor ? 'filesListFolderContinue' : 'filesListFolder';
      const a = cursor ? {cursor} : {path: root === '/' ? '' : root};

      this.dbx[m](a).then((response) => {
        const found = (response.entries || []).map((iter) => {
          return this._createMetadata(mount.option('root'), iter);
        });

        result = result.concat(found);

        if ( response.has_more && response.cursor ) {
          return scandir(response.cursor).then(resolve).catch(reject);
        }

        return resolve(result);
      }).catch(reject);
    });

    return scandir(null);
  }

  read(item, options, mount) {
    return new Promise((resolve, reject) => {
      this.url(item, {dl: 0}).then((url) => {
        this.dbx.sharingGetSharedLinkFile({
          url
        }).then((data) => {
          return resolve(data.fileBlob);
        }).catch(reject);
      }).catch(reject);
    });
  }

  write(file, data) {
    return new Promise((resolve, reject) => {
      this.dbx.filesUpload({
        path: FS.getPathFromVirtual(file.path),
        mode: {
          '.tag': 'overwrite'
        },
        contents: data
      }).then(() => resolve(true)).catch(reject);
    });
  }

  copy(src, dest) {
    return new Promise((resolve, reject) => {
      this.dbx.filesCopy({
        from_path: FS.getPathFromVirtual(src.path),
        to_path: FS.getPathFromVirtual(dest.path)
      }).then(() => resolve(true)).catch(reject);
    });
  }

  move(src, dest) {
    return new Promise((resolve, reject) => {
      this.dbx.filesMove({
        from_path: FS.getPathFromVirtual(src.path),
        to_path: FS.getPathFromVirtual(dest.path)
      }).then(() => resolve(true)).catch(reject);
    });
  }

  exists(item) {
    return new Promise((resolve, reject) => {
      this.fileinfo(item)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }

  fileinfo(item) {
    return this.dbx.filesGetMetadata({
      path: FS.getPathFromVirtual(item.path)
    });
  }

  url(item, options) {
    const visibility = 'public';

    const hasLink = () => new Promise((resolve, reject) => {
      this.dbx.sharingGetSharedLinks({
        path: FS.getPathFromVirtual(item.path)
      }).then((response) => {
        if ( response.links.length ) {
          const found = response.links.find((iter) => iter.visibility['.tag'] === visibility);
          const dl = typeof options.dl === 'undefined' ? 1 : options.dl;
          if ( found ) {
            return resolve(found.url.replace('dl=0', 'dl=' + String(dl)));
          }
        }
        return resolve(false);
      }).catch(reject);
    });

    const newLink = () => new Promise((resolve, reject) => {
      this.dbx.sharingCreateSharedLinkWithSettings({
        path: FS.getPathFromVirtual(item.path),
        settings: {
          requested_visibility: visibility
        }
      }).then((response) => {
        return resolve(response.url);
      }).catch(reject);
    });

    return new Promise((resolve, reject) => {
      hasLink().then((url) => {
        if ( url ) {
          console.warn('ALREADY HAS URL', url);
          return resolve(url);
        }

        console.warn('CREATING NEW URL');
        return newLink().then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  mkdir(dir) {
    return new Promise((resolve, reject) => {
      this.dbx.filesCreateFolder({
        path: FS.getPathFromVirtual(dir.path)
      }).then(() => resolve(true)).catch(reject);
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
    return new Promise((resolve, reject) => {
      this.dbx.usersGetSpaceUsage().then((response) => {
        try {
          if ( response.allocation && typeof response.allocation.individual !== 'undefined' ) {
            return resolve(response.allocation.individual.allocated);
          }
        } catch ( e ) {
          console.warn(e);
        }

        return resolve(-1);
      }).catch(reject);
    });
  }

  unlink(src) {
    return new Promise((resolve, reject) => {
      this.dbx.filesDelete({
        path: FS.getPathFromVirtual(src.path)
      }).then(() => resolve(true)).catch(reject);
    });
  }

}
