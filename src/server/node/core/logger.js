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
(function() {
  'use strict';

  /**
   * You can reach these methods via `instance.logger`
   * @namespace Logger
   */

  /**
   * Gets timestamp
   */
  function timestamp() {
    var now = new Date();
    return now.toISOString();
  }

  /**
   * Create the logger instance
   *
   * Level -1 is everything, -2 is everything except verbose
   */
  module.exports.create = function createLogger(config, lvl) {
    var ns = {};
    var level = 0;

    /**
     * Check if this message can be logged according to level
     */
    function _check(lvl) {
      if ( level > 0 ) {
        var tests = [
          (level & ns.INFO) === ns.INFO && (lvl & ns.INFO) === ns.INFO,
          (level & ns.WARNING) === ns.WARNING && (lvl & ns.WARNING) === ns.WARNING,
          (level & ns.ERROR) === ns.ERROR && (lvl & ns.ERROR) === ns.ERROR,
          (level & ns.VERBOSE) === ns.VERBOSE && (lvl & ns.VERBOSE) === ns.VERBOSE
        ];

        return tests.some(function(i) {
          return !!i;
        });
      }

      return level !== 0;
    }

    /**
     * Logs given message
     */
    function _log(stamp, lvl/*, message[, message, ...]*/) {
      if ( typeof stamp !== 'boolean' ) {
        throw new TypeError('log() expects first argument to be a boolean');
      }

      if ( typeof lvl !== 'number' ) {
        throw new TypeError('log() expects second argument to be a number');
      }

      if ( !_check(lvl) ) {
        return;
      }

      var line = [];
      if ( stamp ) {
        line.push(timestamp());
      }

      for ( var i = 2; i < arguments.length; i++ ) {
        var a = arguments[i];
        if ( a instanceof Array ) {
          line.push(a.concat(' '));
        } else {
          line.push(String(a));
        }
      }

      console.log(line.join(' '));
    }

    // The namespace
    ns = {
      INFO: 1,
      WARNING: 2,
      ERROR: 4,
      VERBOSE: 8,

      /**
       * Logs a message
       *
       * @param {Number}          lvl     Log level
       * @param {String|Array}    msg     Log message (as a series of string or an array)
       *
       * @memberof Logger
       * @function log
       */
      log: function() {
        return _log.apply(null, [true].concat(Array.prototype.slice.call(arguments)));
      },

      /**
       * Logs a message (without timestamp)
       *
       * @param {Number}          lvl     Log level
       * @param {String|Array}    msg     Log message (as a series of string or an array)
       *
       * @memberof Logger
       * @function lognt
       */
      lognt: function() {
        return _log.apply(null, [false].concat(Array.prototype.slice.call(arguments)));
      },

      /**
       * Gets the log level
       *
       * @memberof Logger
       * @function getLevel
       */
      getLevel: function() {
        return level;
      },

      /**
       * Sets the log level
       *
       * @param {Number}      lvl     Log level
       *
       * @memberof Logger
       * @function setLevel
       */
      setLevel: function(lvl) {
        var found = Object.keys(exports).some(function(k) {
          return exports[k] === lvl;
        });

        if ( found ) {
          level = lvl;
        }
      }
    };

    // Make sure we take logging options from cmd/configs
    var clvl = config.logging;
    if ( clvl === true || typeof clvl === 'number' ) {
      if ( typeof clvl === 'number' ) {
        level = clvl;
      }

      if ( lvl === -1 ) {
        level = ns.INFO | ns.WARNING | ns.ERROR | ns.VERBOSE;
      } else if ( lvl === -2 ) {
        level = ns.INFO | ns.WARNING | ns.ERROR;
      }
    }

    ns.lognt(ns.INFO, '---', 'Created Logger with loglevel', level);

    return ns;
  };

})();
