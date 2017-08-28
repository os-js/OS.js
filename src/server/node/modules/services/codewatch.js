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
let packageWatcher;

/*
 * Unloads the Code watching
 */
module.exports.destroy = function() {
  if ( watcher ) {
    watcher.close();
  }
  watcher = null;

  if ( packageWatcher ) {
    packageWatcher.close();
  }
  packageWatcher = null;

  return Promise.resolve(true);
};

/*
 * Registers Code watching
 */
module.exports.register = function(env, config, wrapper) {
  const app = wrapper.getApp();
  const metaPath = path.resolve(Settings.option('SERVERDIR'), 'packages.json');

  console.log('> Watching', metaPath);
  if ( env.RELOAD ) {
    console.log('> Will reload all packages on update because you supplied --reload');
  }

  const createPackageWatch = () => {
    if ( !env.RELOAD ) {
      return;
    }

    if ( packageWatcher ) {
      packageWatcher.close();
    }

    const metadata = Modules.getMetadata();
    const metaMap = {};
    const watchPaths = [];

    Object.keys(metadata).forEach((pn) => {
      const entry = Modules.getPackageEntry(pn);
      if ( entry ) {
        const dn = path.dirname(entry);
        metaMap[pn] = dn;
        watchPaths.push(dn);
      }
    });

    const discoverPackage = (filename) => {
      const dir = path.dirname(filename);
      const found = Object.keys(metaMap).find((pn) => {
        return metaMap[pn].substr(0, dir.length) === dir;
      });

      return found;
    };

    packageWatcher = chokidar.watch(watchPaths);
    packageWatcher.on('change', (filename) => {
      const found = discoverPackage(filename);
      if ( found ) {
        Modules.unloadPackages([found]).then(() => {
          Modules.loadPackages(app).then(() => {
            console.log('! Reloaded', found);
          });
        });
      }
    });
  };

  watcher = chokidar.watch(metaPath);
  watcher.on('change', () => {
    console.log('! Reloading manifest');

    Modules.setMetadata(fs.readJsonSync(metaPath));

    const unloader = env.RELOAD ? Modules.unloadPackages() : Promise.resolve(true);

    unloader.then(() => {
      Modules.loadPackages(app).then(() => {
        console.log('! Loaded new packages');

        createPackageWatch();
      });
    });
  });

  createPackageWatch();

  return Promise.resolve(true);
};
