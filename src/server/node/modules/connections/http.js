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

const fs = require('fs');
const path = require('path');
const colors = require('colors');

const Settings = require('./../../settings.js');
const Connection = require('./../connection.js');

class HttpConnection extends Connection {

  /**
   * Destroys the module
   * @return {Promise<Boolean, Error>}
   */
  destroy() {
    if ( this.server ) {
      this.server.close();
    }
    return Promise.resolve(true);
  }

  /**
   * Registers the module
   * @return {Promise<Boolean, Error>}
   */
  register() {
    return new Promise((resolve, reject) => {
      super.register(...arguments).then(() => {
        const isHttp2 = Settings.get('connection') === 'http2';
        const httpServer = require(isHttp2 ? 'spdy' : 'http');
        const httpPort = Settings.option('PORT') || Settings.get('http.port');
        const hostname = Settings.option('HOSTNAME') || Settings.get('http.hostname') || '0.0.0.0';

        console.log(colors.bold('Creating'),  colors.green(isHttp2 ? 'spdy' : 'http'), 'server on', hostname + '@' + httpPort, 'with');
        if ( isHttp2 ) {
          const rdir = Settings.get('http.cert.path') || Settings.option('SERVERDIR');
          const cname = Settings.get('http.cert.name') || 'localhost';
          const copts = Settings.get('http.cert.options') || {};
          copts.key = fs.readFileSync(path.join(rdir, cname + '.key'));
          copts.cert = fs.readFileSync(path.join(rdir, cname + '.crt'));

          this.server = httpServer.createServer(copts, this.app);
        } else {
          this.server = httpServer.createServer(this.app);
        }

        this.server.listen(httpPort, hostname, null, (err) => {
          if ( err ) {
            console.error(err);
          }
        });

        return resolve(true);
      }).catch(reject);
    });
  }

}

module.exports = HttpConnection;
