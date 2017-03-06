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
 * Internal events:
 *
 * <pre><code>
 *   http:start => fn()
 *   http:end => fn()
 *   request:start() => fn()
 *   request:end() => fn()
 *   api:request => fn(type, method)
 *   ws:connection => fn(ws)
 * </code></pre>
 *
 * @namespace lib.evhandler
 */

const eventHandlers = {};

/**
 * Emits an event
 *
 * @param {String}    evName        Event name
 * @param {Array}     [args]        Array of arguments
 * @param {Object}    [thisArg]     The `this` to apply
 *
 * @memberof lib.evhandler
 * @function emit
 *
 * @return {Boolean}
 */
module.exports.emit = function(evName, args, thisArg) {
  args = args || [];

  if ( typeof eventHandlers[evName] !== 'undefined' ) {
    eventHandlers[evName].forEach((fn) => fn.apply(thisArg, args));
    return true;
  }

  return false;
};

/**
 * Subscribes to an event
 *
 * @param {String}    evName        Event name
 * @param {Function}  cb            Callback function
 *
 * @memberof lib.evhandler
 * @function subscribe
 *
 * @return {Number} Event index
 */
module.exports.subscribe = function(evName, cb) {
  if ( typeof eventHandlers[evName] === 'undefined' ) {
    eventHandlers[evName] = [];
  }
  return eventHandlers[evName].push(cb) - 1;
};

/**
 * Un-subscribes to an event
 *
 * @param {String}    evName        Event name
 * @param {Function}  [cb]          Callback function
 *
 * @memberof lib.evhandler
 * @function unsubscribe
 *
 * @return {Boolean}
 */
module.exports.unsubscribe = function(evName, cb) {
  if ( typeof eventHandlers[evName] === 'undefined' ) {
    return false;
  }

  if ( arguments.length === 1 || !cb ) {
    eventHandlers[evName] = [];
    return true;
  }

  return eventHandlers[evName].some((ccb, idx) => {
    if ( ccb.toString() === cb.toString() ) {
      eventHandlers.splice(idx, 1);
      return true;
    }
    return false;
  });
};
