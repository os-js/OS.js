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
require('app-module-path/register');

const express = require('express');
const path = require('path');
const minimist = require('minimist');

const Modules = require('./modules.js');
const Settings = require('./settings.js');

const isDirect = require.main === module;

/**
 * Shuts down the server
 * @return {Promise}
 */
const shutdown = () => {
  console.log('\n');

  if ( isDirect ) {
    Modules.destroy()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));

    return Promise.resolve(true);
  }

  return Modules.destroy();
};

/**
 * Starts the server
 * @param {Object}  [opts]                Override default options object
 * @param {String}  [opts.HOSTNAME=null]  Hostname (autodetected)
 * @param {Number}  [opts.PORT=8000]      Listen port
 * @param {Boolean} [opts.DEBUG=false]    Enable debugging
 * @param {Number}  [opts.LOGLEVEL=7]     Loglevel
 * @param {String}  [opts.NODEDIR]        The `src/server/node` sources directory
 * @param {String}  [opts.ROOTDIR]        OS.js root directory
 * @param {String}  [opts.SERVERDIR]      The `src/server` directory
 * @param {String}  [opts.CONNECTION]     Load this connection module instead of the configured one
 * @param {String}  [opts.AUTH]           Load this authentication module instead of the configured one
 * @param {String}  [opts.STORAGE]        Load this storage module instead of the configured one
 * @return {Promise<Boolean, Error>}
 */
const start = (opts) => {
  opts = opts || {};

  return new Promise((resolve, reject) => {
    const app = express();

    try {
      Settings.load(minimist(process.argv.slice(2)), {
        HOSTNAME: null,
        DEBUG: false,
        PORT: null,
        LOGLEVEL: 7,
        NODEDIR: path.resolve(__dirname + '/../'),
        ROOTDIR: path.resolve(__dirname + '/../../../'),
        SERVERDIR: path.resolve(__dirname + '/../')
      }, opts);

      const runningOptions = Settings.option();
      if ( runningOptions.DEBUG ) {
        Object.keys(runningOptions).forEach((k) => {
          console.log('-', k, '=', runningOptions[k]);
        });
      }
    } catch ( e ) {
      reject(e);
      return;
    }

    Modules.load(app).then(() => {
      console.info('Running...');

      return resolve({
        settings: Settings.get(),
        options: Settings.option(),
        connection: Modules.getConnection(),
        authenticator: Modules.getAuthenticator(),
        storage: Modules.getStorage()
      });
    }).catch(reject);
  });
};

if ( isDirect ) { // If run directly via cli
  process.on('uncaughtException', (error) => {
    console.log('UNCAUGHT EXCEPTION', error, error.stack);
  });

  process.on('unhandledRejection', (error) => {
    console.log('UNCAUGHT REJECTION', error);
  });

  ['SIGTERM', 'SIGINT'].forEach((sig) => {
    process.on(sig, () => shutdown());
  });

  process.on('exit', () => shutdown());

  start().catch((err) => {
    console.error(err);
  });
} else { // Or if was used as require()
  module.exports = {start, shutdown};
}

