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

const Modules = require('../../modules.js');
const Settings = require('../../settings.js');

const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');

let watcher;

/*
 * Unloads the Code watching
 */
module.exports.destroy = function() {
  if ( watcher ) {
    watcher.close();
  }
  watcher = null;

  return Promise.resolve(true);
};

/*
 * Registers Code watching
 */
module.exports.register = function(env, config, wrapper) {
  const app = wrapper.getApp();
  const metaPath = path.resolve(Settings.option('SERVERDIR'), 'packages.json');

  watcher = chokidar.watch(metaPath);
  watcher.on('change', () => {
    console.log('! Reloading manifest');

    Modules.setMetadata(fs.readJsonSync(metaPath));

    Modules.unloadPackages().then(() => {
      Modules.loadPackages(app).then(() => {
        console.log('! Loaded new packages');
      });
    });
  });

  return Promise.resolve(true);
};
