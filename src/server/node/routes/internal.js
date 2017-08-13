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
const express = require('express');

const Settings = require('./../settings.js');
const Modules = require('./../modules.js');

module.exports = function(app, wrapper) {
  const authenticator = () => Modules.getAuthenticator();
  const connection = () => Modules.getConnection();

  /*
   * Package requests
   */
  wrapper.get(/^\/?packages\/(.*\/.*)\/(.*)/, (http) => {
    const name = http.request.params[0];

    authenticator().getUserFromRequest(http).then((user) => {
      authenticator().checkPackagePermission(user, name).then(() => {
        http.next();
      }).catch((error) => {
        http.response.status(403).send(error);
      });
    }).catch((error) => {
      http.response.status(403).send(error);
    });

  });

  /*
   * Proxies
   */
  const proxy = connection().getProxy();
  if ( proxy ) {
    const proxies = Settings.get('proxies', []);
    Object.keys(proxies).forEach((uri) => {
      let re = uri;
      if ( re.substr(0, 1) === '/' ) {
        try {
          re = new RegExp(uri.substr(1));
        } catch ( e ) {}
      } else {
        re = '/' + re;
      }

      console.log('> Proxy at', re);

      app.all(re, (req, res, next) => {
        proxy.web(req, res, {
          target: proxies[uri]
        });
      });
    });
  }

  /*
   * Static resources
   */
  app.use(express.static('dist'));

  /*
   * Errors
   */
  app.use((err, req, res, next) => {
    if ( err ) {
      console.error(err);
    }
  });

};
