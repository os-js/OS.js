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

// TODO: Windows support

const _index = require('./index.js');
const _chokidar = require('chokidar');
const _path = require('path');

function completed() {
  console.log('... done ...');
}

function failed(task, error) {
  console.error('Something went wrong with %s: %s', task, error);
}

function watchCore(path, stats) {
  _index.build({
    option: () => {
      return null;
    }
  }, 'core')
    .then((res) => completed('core', res))
    .catch((err) => failed('core', err));
}

function watchThemes(path, stats, watchdir) {
  const basedir = watchdir.replace(/\*+\/?/g, '');
  const rdir = path.replace(basedir, '');

  let promise = new Promise(() => {});
  if ( path.match(/metadata\.json$/) ) {
    _index.build({
      option: () => {
        return null;
      }
    }, 'config');
  } else if ( rdir.match(/^icons/) ) {
    promise = _index.build({
      option: (k) => {
        return k === 'icons' ? rdir.split('/', 2)[1] : null;
      }
    }, 'theme');
  } else if ( rdir.match(/^wallpapers|sounds/) ) {
    promise = _index.build({
      option: (k) => {
        return k === 'static' ? true : null;
      }
    }, 'theme');
  } else if ( rdir.match(/^font/) ) {
    promise = _index.build({
      option: (k) => {
        return k === 'fonts' ? true : null;
      }
    }, 'theme');
  } else if ( rdir.match(/^styles/) ) {
    promise = _index.build({
      option: (k) => {
        return k === 'style' ? rdir.split('/', 2)[1] : null;
      }
    }, 'theme');
  }

  promise
    .then((res) => completed('config', res))
    .catch((err) => failed('config', err));
}

function watchConfig(path, stats) {
  _index.build({
    option: () => {
      return null;
    }
  }, 'config')
    .then((res) => completed('config', res))
    .catch((err) => failed('config', err));
}

function watchPackages(path, stats, watchdir) {
  const basedir = watchdir.replace(/\*+\/?/g, '');
  const temp = path.replace(basedir, '').split('/', 3);
  const repository = temp[0];
  const packageName = temp[1];
  const fileName = temp[2];
  const fullName = repository + '/' + packageName;

  let promise;
  if ( fileName === 'metadata.json' ) {
    promise = _index.build({option: (opt) => {
      return null;
    }}, 'manifest');
  } else {
    promise = _index.build({option: (opt) => {
      return opt === 'name' ? fullName : null;
    }}, 'package');
  }

  promise
    .then((res) => completed('package', res))
    .catch((err) => failed('package', err));
}

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

      _chokidar.watch(path, {
        ignored: /node_modules|\.git/,
        ignoreInitial: true,
        persistent: true
      }).on('add', fn).on('change', fn);
    });
  });
};

