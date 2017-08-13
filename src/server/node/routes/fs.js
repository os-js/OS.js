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
const VFS = require('./../vfs.js');
const Modules = require('./../modules.js');

const request = (method, http, app, wrapper) => {
  const data = http.data;

  Modules.getAuthenticator().checkPermission(http, 'fs', {
    src: data.src || data.root,
    dest: data.dest || data.path,
    method: method
  }).then((user) => {
    VFS.request(user, method, data).then((result) => {
      return VFS.respond(http, method, data, result);
    }).catch((error) => {
      if ( method === 'read' && data.options.raw !== false ) {
        http.response.status(404).send(error);
      } else {
        http.response.json({error});
      }
    });
  }).catch((error) => http.response.status(403).json({error}));
};

module.exports = function(app, wrapper) {
  wrapper.get('/FS/read', (http) => {
    request('read', http, app, wrapper);
  });

  wrapper.upload('/FS/upload', (http) => {
    request('upload', http, app, wrapper);
  });

  wrapper.post('/FS/:method', (http) => {
    request(http.request.params.method, http, app, wrapper);
  });
};
