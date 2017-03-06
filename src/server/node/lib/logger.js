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

/*
 * You can reach these methods via `instance.logger`
 * @namespace lib.logger
 */

/*
 * Gets timestamp
 */
function timestamp() {
  let now = new Date();
  return now.toISOString();
}

/*
 * Loglevel maps
 */
const levelMap = {
  INFO: 1,
  WARN: 2,
  WARNING: 2,
  ERROR: 3,
  VERBOSE: 8
};

module.exports = (function() {
  let level = 0;
  let ns = {};

  /*
   * Check if this message can be logged according to level
   */
  function _check(lvl) {
    if ( level > 0 ) {
      let tests = [
        (level & ns.INFO) === ns.INFO && (lvl & ns.INFO) === ns.INFO,
        (level & ns.WARNING) === ns.WARNING && (lvl & ns.WARNING) === ns.WARNING,
        (level & ns.ERROR) === ns.ERROR && (lvl & ns.ERROR) === ns.ERROR,
        (level & ns.VERBOSE) === ns.VERBOSE && (lvl & ns.VERBOSE) === ns.VERBOSE
      ];

      return tests.some((i) => {
        return !!i;
      });
    }

    return level !== 0;
  }

  /*
   * Logs given message
   */
  function _log(stamp, lvl/*, message[, message, ...]*/) {
    if ( typeof stamp !== 'boolean' ) {
      throw new TypeError('log() expects first argument to be a boolean');
    }

    if ( typeof lvl === 'string' ) {
      lvl = levelMap[lvl];
    }

    if ( typeof lvl !== 'number' ) {
      throw new TypeError('log() expects second argument to be a number');
    }

    if ( !_check(lvl) ) {
      return;
    }

    let line = [];
    if ( stamp ) {
      line.push(timestamp());
    }

    for ( let i = 2; i < arguments.length; i++ ) {
      let a = arguments[i];
      if ( a instanceof Array ) {
        line.push(a.concat(' '));
      } else {
        line.push(String(a));
      }
    }

    console.log(line.join(' '));
  }

  ns = {
    INFO: 1,
    WARNING: 2,
    ERROR: 4,
    VERBOSE: 8,

    /**
     * Initialize logger instance
     *
     * Level -1 is everything, -2 is everything except verbose
     *
     * @param {Number}          lvl     Log level
     *
     * @memberof lib.logger
     * @function init
     */
    init: function(lvl) {
      if ( lvl === -1 ) {
        level = ns.INFO | ns.WARNING | ns.ERROR | ns.VERBOSE;
      } else if ( lvl === -2 ) {
        level = ns.INFO | ns.WARNING | ns.ERROR;
      } else {
        level = lvl;
      }

      ns.lognt(ns.INFO, 'Loading:', ns.colored('Logger', 'bold'), 'with level', level);
    },

    /**
     * Logs a message
     *
     * @param {Number}          lvl     Log level
     * @param {String|Array}    msg     Log message (as a series of string or an array)
     *
     * @memberof lib.logger
     * @function log
     */
    log: function() {
      _log.apply(null, [true].concat(Array.prototype.slice.call(arguments)));
    },

    /**
     * Logs a message (without timestamp)
     *
     * @param {Number}          lvl     Log level
     * @param {String|Array}    msg     Log message (as a series of string or an array)
     *
     * @memberof lib.logger
     * @function lognt
     */
    lognt: function() {
      _log.apply(null, [false].concat(Array.prototype.slice.call(arguments)));
    },

    /**
     * Colors the given string
     *
     * @memberof lib.logger
     * @function colored
     */
    colored: (() => {
      let colors;

      try {
        colors = require('colors');
      } catch ( e ) {}

      return function() {
        let args = Array.prototype.slice.call(arguments);
        let str = args.shift();

        if ( colors ) {
          let ref = colors || [];
          args.forEach((a) => {
            ref = ref[a] || 'white';
          });
          return ref(str);
        } else {
          return str;
        }
      };
    })(),

    /**
     * Gets the log level
     *
     * @memberof lib.logger
     * @function getLevel
     * @return Number
     */
    getLevel: function() {
      return level;
    },

    /**
     * Sets the log level
     *
     * @param {Number}      lvl     Log level
     *
     * @memberof lib.logger
     * @function setLevel
     */
    setLevel: function(lvl) {
      let found = Object.keys(exports).some((k) => {
        return exports[k] === lvl;
      });

      if ( found ) {
        level = lvl;
      }
    }
  };

  return ns;
})();
