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
import Connection from 'core/connection';
import * as FS from 'utils/fs';

/**
 * Web VFS Transport Module
 *
 * This module makes it possible to use normal URLs in VFS operations
 *
 * @extends Transport
 */
export default class WebTransport extends Transport {

  _request(url, responseType, method, options) {
    return new Promise((resolve, reject) => {
      if ( !options.cors ) {
        const binary = options.type === 'text' ? false : (responseType === 'arraybuffer');

        Connection.request('curl', {
          url: url,
          method: method,
          binary: binary
        }).then((result) => {
          if ( binary ) {
            return FS.dataSourceToAb(result.body, 'application/octet-stream', (err, ab) => {
              return err ? reject(err) : resolve(ab);
            });
          }
          return resolve(result.body);
        }).catch(reject);
      } else {
        axios({
          responseType: responseType,
          url: url,
          method: method
        }).then((response) => {
          return resolve(responseType === null ? response.statusText : response.data);
        }).catch((e) => reject(new Error(e.message || e)));
      }
    });
  }

  scandir(item, options, mount) {
    return new Promise((resolve, reject) => {
      const root = mount.option('root');
      const url = item.path.replace(/\/?$/, '/_scandir.json');

      this._request(url, 'json', 'GET', options).then((response) => {
        return resolve(response.map((iter) => {
          iter.path = root + iter.path.replace(/^\//, '');
          return iter;
        }));
      }).catch(reject);
    });
  }

  read(item, options) {
    const mime = item.mime || 'application/octet-stream';

    return new Promise((resolve, reject) => {
      this._request(item.path, 'arraybuffer', 'GET', options).then((response) => {
        if ( options.cors ) {
          if ( options.type === 'text' ) {
            resolve(response);
          } else {
            FS.dataSourceToAb(response, 'application/octet-stream', (err, ab) => {
              return err ? reject(err) : resolve(ab);
            });
          }

          return true;
        }

        if ( options.type === 'text' ) {
          FS.abToText(response, mime, (err, txt) => {
            if ( err ) {
              reject(new Error(err));
            } else {
              resolve(txt);
            }
          });

          return true;
        }

        return resolve(response);
      }).catch(reject);
    });
  }

  exists(item) {
    return new Promise((resolve, reject) => {
      this._request(item.path, null, 'HEAD').then((response) => {
        return resolve(response.toUpperCase() === 'OK');
      }).catch(reject);
    });
  }

  url(item) {
    return Promise.resolve(item.path);
  }
}
