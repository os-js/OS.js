/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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
/*eslint strict:["error", "global"]*/
'use strict';

const _instance = require('./core/instance.js');
const _minimist = require('minimist');

///////////////////////////////////////////////////////////////////////////////
// MAIN
///////////////////////////////////////////////////////////////////////////////

const argv = _minimist(process.argv.slice(2));
const opts = {
  DIST: argv._[0],
  ROOT: argv.r || argv.root,
  PORT: argv.p || argv.port,
  LOGLEVEL: argv.l || argv.loglevel,
  AUTH: argv.authenticator,
  STORAGE: argv.storage
};

_instance.init(opts).then(function(env) {
  const config = _instance.getConfig();
  if ( config.tz ) {
    process.env.TZ = config.tz;
  }

  ['SIGTERM', 'SIGINT'].forEach(function(sig) {
    process.on(sig, function() {
      console.log('\n');
      _instance.destroy(function(err) {
        process.exit(err ? 1 : 0);
      });
    });
  });

  process.on('exit', function() {
    _instance.destroy();
  });

  _instance.run();

  process.on('uncaughtException', function(error) {
    console.log('UNCAUGHT EXCEPTION', error, error.stack);
  });
}).catch(function(error) {
  console.log(error);
  process.exit(1);
});
