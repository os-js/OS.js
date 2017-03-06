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
/*eslint strict:["error", "global"]*/
'use strict';

/**
 * @namespace lib.utils
 */

/**
 * Iterates array async
 *
 * @param {Array}     list      List
 * @param {Function}  entry     Callback on entry ( fn => (iter, index, next) )
 * @param {Function}  done      Callback on done
 *
 * @function iterate
 * @memberof lib.utils
 */
module.exports.iterate = function iterate(list, entry, done) {
  (function _next(i) {
    if ( i >= list.length ) {
      return done();
    }
    entry(list[i], i, () => {
      _next(i + 1);
    });
  })(0);
};

/**
 * Creates a readable string from file permission
 *
 * @param {Number}      mode      The permission mode
 *
 * @return {String}
 * @function permissionToString
 * @memberof lib.utils
 */
module.exports.permissionToString = function permissionToString(mode) {
  let str = '';
  let map = {
    0xC000: 's',
    0xA000: 'l',
    0x8000: '-',
    0x6000: 'b',
    0x4000: 'd',
    0x1000: 'p'
  };

  let type = 'u';
  Object.keys(map).forEach((k) => {
    if ( (mode & k) === k ) {
      type = map[k];
    }
    return type === 'u';
  });

  // Owner
  str += (() => {
    let ret = ((mode & 0x0100) ? 'r' : '-');
    ret += ((mode & 0x0080) ? 'w' : '-');
    ret += ((mode & 0x0040) ? ((mode & 0x0800) ? 's' : 'x' ) : ((mode & 0x0800) ? 'S' : '-'));
    return ret;
  })();

  // Group
  str += (() => {
    let ret = ((mode & 0x0020) ? 'r' : '-');
    ret += ((mode & 0x0010) ? 'w' : '-');
    ret += ((mode & 0x0008) ? ((mode & 0x0400) ? 's' : 'x' ) : ((mode & 0x0400) ? 'S' : '-'));
    return ret;
  })();

  // World
  str += (() => {
    let ret = ((mode & 0x0004) ? 'r' : '-');
    ret += ((mode & 0x0002) ? 'w' : '-');
    ret += ((mode & 0x0001) ? ((mode & 0x0200) ? 't' : 'x' ) : ((mode & 0x0200) ? 'T' : '-'));
    return ret;
  })();

  return str;
};

