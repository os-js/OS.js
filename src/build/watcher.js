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
/*eslint strict:["error", "global"]*/
'use strict';

const _index = require('./index.js');
const _utils = require('./utils.js');

const _chokidar = require('chokidar');
const _path = require('path');

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

function log() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(new Date());
  console.log(args.join(' '));
}

function getBasedDirectory(path, watchdir) {
  const basedir = _utils.fixWinPath(watchdir).replace(/\*+\/?/g, '');
  return _utils.fixWinPath(path).replace(basedir, '');
}

function getPackageFromPath(path, watchdir) {
  const rdir = getBasedDirectory(path, watchdir);
  const temp = rdir.split('/', 3);
  const repository = temp[0];
  const packageName = temp[1];
  return repository + '/' + packageName;
}

const runTask = (() => {
  const timeouts = {};

  function completed() {
    console.log('\n');
    log('... done ...');
  }

  function failed(error) {
    console.error('Something went wrong', error);
  }

  return (t, ik, iv) => {
    const hash = [t, ik, iv].join(' ');
    if ( timeouts[hash] ) {
      clearTimeout(timeouts[hash]);
    }

    timeouts[hash] = setTimeout(function() {
      console.log('\n');
      _index.build({
        option: (k) => {
          return ik === null ? null : (k === ik ? iv : null);
        }
      }, t).then(completed).catch(failed);
    }, 250);
  };
})();

///////////////////////////////////////////////////////////////////////////////
// TASKS
///////////////////////////////////////////////////////////////////////////////

function watchCore(path, stats) {
  log('Core files changed');
  runTask('core', null);
}

function watchThemes(path, stats, watchdir) {
  const rdir = getBasedDirectory(path, watchdir);
  const name = rdir.split('/', 2)[1];

  if ( path.match(/metadata\.json$/) ) {
    log('Theme metadata changed');
    runTask('config', null);
  } else if ( rdir.match(/^icons/) ) {
    log('Icon theme changed', name);
    runTask('theme', 'icons', name);
  } else if ( rdir.match(/^wallpapers|sounds/) ) {
    log('Theme files changed');
    runTask('theme', 'static', true);
  } else if ( rdir.match(/^font/) ) {
    log('Fonts changed');
    runTask('theme', 'fonts', true);
  } else if ( rdir.match(/^styles/) ) {
    log('Style theme changed', name);
    runTask('theme', 'style', name);
  }
}

function watchConfig(path, stats) {
  log('Configuration has changed');
  runTask('config', null);
}

function watchPackages(path, stats, watchdir) {
  const fullName = getPackageFromPath(path, watchdir);
  if ( _path.basename(path) === 'metadata.json' ) {
    log('Package manifest changed for', fullName);
    runTask('manifest', null);
  } else {
    log('Package sources changed for', fullName);
    runTask('package', 'name', fullName);
  }
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

/*
 * Watch for changes
 */
module.exports.watch = function watch() {
  const root = _path.dirname(_path.dirname(_path.join(__dirname)));
  const paths = {
    'src/client/javascript/**/*': watchCore,
    'src/client/themes/**/*': watchThemes,
    'src/conf/*': watchConfig,
    'src/packages/*/**': watchPackages
  };

  return new Promise((resolve, reject) => {
    Object.keys(paths).forEach((p) => {
      const path = _path.join(root, p);
      const fn = (res, stats) => {
        paths[p](res, stats, path);
      };

      log('Watching', p);

      _chokidar.watch(path, {
        ignored: /node_modules|\.git/,
        ignoreInitial: true,
        persistent: true
      }).on('add', fn).on('change', fn);

    });
  });
};

