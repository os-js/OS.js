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
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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

const _request = require('request');
const _path = require('path');

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

function createReadStream(path) {
  return new Promise((resolve, reject) => {
    resolve(_request.get(path));
  });
}

function createWriteStream(path) {
  return new Promise((resolve, reject) => {
    reject('Unavailable');
  });
}

///////////////////////////////////////////////////////////////////////////////
// VFS METHODS
///////////////////////////////////////////////////////////////////////////////

const VFS = {
  read: function(user, args, resolve, reject) {
    const options = args.options || {};

    function createRequest(path) {
      return new Promise((yes, no) => {
        _request(path).on('response', (response) => {
          const size = response.headers['content-length'];
          const mime = response.headers['content-type'];
          const data = response.body;

          if ( response.statusCode < 200 || response.statusCode >= 300 ) {
            no('Failed to fetch file: ' + response.statusCode);
          } else {
            yes({mime, size, data});
          }

        }).on('error', no);
      });
    }

    if ( options.stream !== false ) {
      _request.head(args.path).on('response', (response) => {
        const size = response.headers['content-length'];
        const mime = response.headers['content-type'];

        if ( response.statusCode < 200 || response.statusCode >= 300 ) {
          reject('Failed to fetch file: ' + response.statusCode);
        } else {
          resolve({
            resource: () => createReadStream(args.path),
            mime: mime,
            size: size,
            filename: args.path,
            options: options
          });
        }
      }).on('error', reject);
    } else {
      createRequest(args.path).then((result) => {
        resolve({
          raw: result.data,
          mime: result.mime,
          size: result.size,
          filename: _path.basename(args.path),
          options: options
        });
      }).catch(reject);
    }
  }
};

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports.request = function(user, method, args) {
  return new Promise((resolve, reject) => {
    if ( typeof VFS[method] === 'function' ) {
      VFS[method](user, args, resolve, reject);
    } else {
      reject('No such VFS method');
    }
  });
};

module.exports.createReadStream = createReadStream;
module.exports.createWriteStream = createWriteStream;
module.exports.name = 'HTTP';

