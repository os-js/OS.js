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

/**
 * Event Handler Class
 *
 * @desc
 * This class just holds a map of events that you can trigger.
 */
export default class EventHandler {

  /**
   * @param   {String}      name        A name (identifier)
   * @param   {Array}       names       List of initial event names
   */
  constructor(name, names) {
    this.name   = name;
    this.events = {};

    (names || []).forEach(function(n) {
      this.events[n] = [];
    }, this);

    console.debug('EventHandler::constructor()', this.events);
  }

  destroy() {
    this.events = {};
  }

  /**
   * Register an event
   *
   * You can also give a RegExp pattern as a name to match multiple entries,
   * as well as a comma separated string.
   * @throws {Error} On invalid callback
   *
   * @param   {String}    name        Event name
   * @param   {Function}  cb          Callback function
   * @param   {Object}    [thisArg]   Set 'this'
   *
   * @return  {Number}
   */
  on(name, cb, thisArg) {
    thisArg = thisArg || this;

    if ( !(cb instanceof Function) ) {
      throw new TypeError('EventHandler::on() expects cb to be a Function');
    }

    const added = [];

    const _register = (n) => {
      if ( !(this.events[n] instanceof Array) ) {
        this.events[n] = [];
      }

      added.push(this.events[n].push((args) => {
        return cb.apply(thisArg, args);
      }));
    };

    if ( name instanceof RegExp ) {
      Object.keys(this.events).forEach(function(n) {
        if ( name.test(n) ) {
          _register(n);
        }
      });
    } else {
      name.replace(/\s/g, '').split(',').forEach(function(n) {
        _register(n);
      });
    }

    return added.length === 1 ? added[0] : added;
  }

  /**
   * Unregister an event
   *
   * @throws {Error} On event name
   *
   * @param   {String}    name        Event name
   * @param   {Number}    index       Event index (as returned by on())
   */
  off(name, index) {
    if ( !(this.events[name] instanceof Array) ) {
      throw new TypeError('Invalid event name');
    }

    if ( arguments.length > 1 && typeof index === 'number' ) {
      this.events[name].splice(index, 1);
    } else {
      this.events[name] = [];
    }
  }

  /**
   * Fire an event
   *
   * @param   {String}    name              Event name
   * @param   {Array}     args              List of arguments to send to .apply()
   * @param   {Object}    [thisArg=this]    The `this` context
   * @param   {Boolean}   [applyArgs=false] Run `apply` on arguments
   */
  emit(name, args, thisArg, applyArgs) {
    args = args || [];
    thisArg = thisArg || this;

    if ( !(this.events[name] instanceof Array) ) {
      return;
    }

    (this.events[name]).forEach((fn) => {
      try {
        if ( applyArgs ) {
          fn.apply(thisArg, args);
        } else {
          fn.call(thisArg, args);
        }
      } catch ( e ) {
        console.warn('EventHandler::emit() exception', name, e);
        console.warn(e.stack);
      }
    });
  }
}

