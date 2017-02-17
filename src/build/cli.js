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

const _fs = require('fs');
const _path = require('path');
const _build = require('./index.js');
const _utils = require('./utils.js');
const _minimist = require('minimist');

module.exports.run = function(args, done) {
  args = _minimist(args);

  if ( process.argv.length < 3 || args.help ) {
    console.log(_fs.readFileSync(_path.join(__dirname, 'help.txt'), 'utf-8'));
    return done(true);
  }

  _build._init();

  const actions = args._.map((iter) => {
    let action = iter.trim().split(':');
    let task = action[0];
    let arg = action[1];

    if ( task.substr(0, 1) === '_' || !_build[task] ) {
      console.error('Invalid task', task);
      return done(true);
    }

    return [task, arg];
  });

  process.on('uncaughtException', (error) => {
    console.error('An uncaught exception occured', error);
    console.error(error.stack);
    done(true);
  });

  _utils.eachp(actions.map((action) => {
    return function() {
      return _build[action[0]]({
        option: function(k, d) {
          return typeof args[k] === 'undefined' ? d : args[k];
        }
      }, action[1]);
    };
  })).then(() => {
    done();
  }).catch((err) => {
    console.error(err);
    done(err);
  });
};
