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
(function() {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // COOKIES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Gets a cookie by key, or all cookies
   *
   * @function getCookie
   * @memberof OSjs.Utils
   *
   * @param {String} [k] What key to get
   * @return {String|Object}  Depending on 'k' parameter
   */
  OSjs.Utils.getCookie = function(k) {
    var map = {};
    document.cookie.split(/;\s+?/g).forEach(function(i) {
      var idx = i.indexOf('=');
      map[i.substr(i, idx)] = i.substr(idx + 1);
    });
    return k ? map[k] : map;
  };

  /////////////////////////////////////////////////////////////////////////////
  // STRING
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Format a string (almost like sprintf)
   *
   * @function format
   * @memberof OSjs.Utils
   * @link http://stackoverflow.com/a/4673436
   *
   * @param   {String}      format        String format
   * @param   {...String}   s             Insert into format
   *
   * @return  {String}                    The formatted string
   */
  OSjs.Utils.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    var sprintfRegex = /\{(\d+)\}/g;

    function sprintf(match, number) {
      return number in args ? args[number] : match;
    }

    return format.replace(sprintfRegex, sprintf);
  };

  /**
   * Remove whitespaces and newlines from HTML document
   *
   * @function cleanHTML
   * @memberof OSjs.Utils
   *
   * @param   {String}    html          HTML string input
   *
   * @return  {String}
   */
  OSjs.Utils.cleanHTML = function(html) {
    return html.replace(/\n/g, '')
               .replace(/[\t ]+</g, '<')
               .replace(/\>[\t ]+</g, '><')
               .replace(/\>[\t ]+$/g, '>');
  };

  /**
   * Parses url into a dictionary (supports modification)
   *
   * @function parseurl
   * @memberof OSjs.Utils
   *
   * @param     {String}        url       Input URL
   * @param     {Object}        [modify]  Modify URL with these options
   *
   * @return    {Object}                  Object with protocol, host, path
   */
  OSjs.Utils.parseurl = function(url, modify) {
    modify = modify || {};

    if ( !url.match(/^(\w+\:)\/\//) ) {
      url = '//' + url;
    }

    var protocol = url.split(/^(\w+\:)?\/\//);

    var splitted = (function() {
      var tmp = protocol[2].replace(/^\/\//, '').split('/');
      return {
        proto: (modify.protocol || protocol[1] || window.location.protocol || '').replace(/\:$/, ''),
        host: modify.host || tmp.shift(),
        path: modify.path || '/' + tmp.join('/')
      };
    })();

    function _parts() {
      var parts = [splitted.proto, '://'];

      if ( modify.username ) {
        var authstr = String(modify.username) + ':' + String(modify.password);
        parts.push(authstr);
        parts.push('@');
      }

      parts.push(splitted.host);
      parts.push(splitted.path);
      return parts.join('');
    }

    return {
      protocol: splitted.proto,
      host: splitted.host,
      path: splitted.path,
      url: _parts()
    };
  };

  /////////////////////////////////////////////////////////////////////////////
  // OBJECT HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Wrapper for merging function argument dictionaries
   *
   * @function argumentDefaults
   * @memberof OSjs.Utils
   *
   * @param  {Object}   args      Given function Dictionary
   * @param  {Object}   defaults  Defaults Dictionary
   * @param  {Boolean}  undef     Check with 'undefined'
   * @return {Object}
   */
  OSjs.Utils.argumentDefaults = function(args, defaults, undef) {
    args = args || {};
    Object.keys(defaults).forEach(function(key) {
      if ( typeof defaults[key] === 'boolean' || typeof defaults[key] === 'number' ) {
        if ( typeof args[key] === 'undefined' || args[key] === null ) {
          args[key] = defaults[key];
        }
      } else {
        args[key] = args[key] || defaults[key];
      }
    });
    return args;
  };

  /**
   * Deep-merge to objects
   *
   * @function mergeObject
   * @memberof OSjs.Utils
   *
   * @param   {Object}      obj1      Object to merge to
   * @param   {Object}      obj2      Object to merge with
   *
   * @return  {Object}                The merged object
   */
  OSjs.Utils.mergeObject = function(obj1, obj2, opts) {
    opts = opts || {};

    for ( var p in obj2 ) {
      if ( obj2.hasOwnProperty(p) ) {
        try {
          if (opts.overwrite === false && obj1.hasOwnProperty(p)) {
            continue;
          }

          if ( obj2[p].constructor === Object ) {
            obj1[p] = OSjs.Utils.mergeObject(obj1[p], obj2[p]);
          } else {
            obj1[p] = obj2[p];
          }
        } catch (e) {
          obj1[p] = obj2[p];
        }
      }
    }
    return obj1;
  };

  /**
   * Clone a object
   *
   * @function cloneObject
   * @memberof OSjs.Utils
   *
   * @param   {Object}      o                     The object to clone
   * @param   {Boolean}     [alternative=false]   Do a programatic deep clone approach
   *
   * @return  {Object}            An identical object
   */
  OSjs.Utils.cloneObject = function(o, alternative) {
    function _clone(i) {
      if ( typeof i !== 'object' || i === null ) {
        return i;
      } else if ( i instanceof Array ) {
        return i.map(_clone);
      }

      var iter = {};
      Object.keys(i).forEach(function(k) {
        iter[k] = _clone(i[k]);
      });
      return iter;
    }

    if ( alternative ) {
      return _clone(o);
    }

    return JSON.parse(JSON.stringify(o, function(key, value) {
      if ( value && typeof value === 'object' && value.tagName ) {
        return undefined;
      }
      return value;
    }));
  };

  /**
   * Extends the given object
   *
   * <pre>
   * If you give a `parentObj` and a prototype method exists
   * in that target, the child object method will be wrapped
   * to make sure the super object method is called.
   * </pre>
   *
   * @example
   * Utils.extend({
   *  a: 'foo'
   * }, {
   *  b: 'bar'
   * }); // -> {a: 'foo', b: 'bar'}
   *
   * @function extend
   * @memberof OSjs.Utils
   *
   * @param {Object}    obj          The destination
   * @param {Object}    methods      The source
   */
  OSjs.Utils.extend = function(obj, methods) {
    if ( obj && methods ) {
      Object.keys(methods).forEach(function(k) {
        obj[k] = methods[k];
      });
    }
  };

  /**
   * Extends the given object by prototype chain
   *
   * @example
   * var MyApp = Utils.inherit(OSjs.Core.Application, function(name, args, metadata) {
   *  Application.apply(this, arguments);
   * }, {
   *  init: function() {
   *    // then do your stuff here
   *  }
   * });
   *
   * @function inherit
   * @memberof OSjs.Utils
   * @see OSjs.Utils.extend
   *
   * @param {Object}    to        The class to inherit
   * @param {Object}    from      The child class
   * @param {Object}    [extend]  Extend the class with these methods
   */
  OSjs.Utils.inherit = function(to, from, extend) {
    from.prototype = Object.create(to.prototype);
    from.constructor = to;

    if ( extend ) {
      OSjs.Utils.extend(from.prototype, extend);
    }

    return from;
  };

  /////////////////////////////////////////////////////////////////////////////
  // COLORS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Convert HEX to RGB
   *
   * @function convertToRGB
   * @memberof OSjs.Utils
   *
   * @param   {String}      hex     The hex string (with #)
   *
   * @return  {Object}              RGB in form of r, g, b
   */
  OSjs.Utils.convertToRGB = function(hex) {
    var rgb = parseInt(hex.replace('#', ''), 16);
    var val = {};
    val.r = (rgb & (255 << 16)) >> 16;
    val.g = (rgb & (255 << 8)) >> 8;
    val.b = (rgb & 255);
    return val;
  };

  /**
   * Convert RGB to HEX
   *
   * @function convertToHEX
   * @memberof OSjs.Utils
   *
   * @param   Object      rgb       (ALTERNATIVE 1) The RGB object in form of r, g, b
   * @param   {Number}    r         (ALTERNATIVE 2) Red value
   * @param   {Number}    g         (ALTERNATIVE 2) Green value
   * @param   {Number}    b         (ALTERNATIVE 2) Blue value
   *
   * @return  {String}                Hex string (with #)
   */
  OSjs.Utils.convertToHEX = function(r, g, b) {
    if ( typeof r === 'object' ) {
      g = r.g;
      b = r.b;
      r = r.r;
    }

    if ( typeof r === 'undefined' || typeof g === 'undefined' || typeof b === 'undefined' ) {
      throw new Error('Invalid RGB supplied to convertToHEX()');
    }

    var hex = [
      parseInt(r, 10).toString( 16 ),
      parseInt(g, 10).toString( 16 ),
      parseInt(b, 10).toString( 16 )
    ];

    Object.keys(hex).forEach(function(i) {
      if ( hex[i].length === 1 ) {
        hex[i] = '0' + hex[i];
      }
    });

    return '#' + hex.join('').toUpperCase();
  };

  /**
   * Ivert HEX color
   *
   * @function invertHEX
   * @memberof OSjs.Utils
   * @link http://stackoverflow.com/a/9601429/1236086
   *
   * @param   {String}      hex     Hex string (With #)
   *
   * @return  {String}              Inverted hex (With #)
   *
   */
  OSjs.Utils.invertHEX = function(hex) {
    var color = parseInt(hex.replace('#', ''), 16);
    color = 0xFFFFFF ^ color;
    color = color.toString(16);
    color = ('000000' + color).slice(-6);
    return '#' + color;
  };

  /////////////////////////////////////////////////////////////////////////////
  // ASYNC
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Run an async queue in series
   *
   * @function asyncs
   * @memberof OSjs.Utils
   *
   * @param   {Array}       queue     The queue
   * @param   {Function}    onentry   Callback on step => fn(entry, index, fnNext)
   * @param   {Function}    ondone    Callback on done => fn()
   */
  OSjs.Utils.asyncs = function(queue, onentry, ondone) {
    onentry = onentry || function(e, i, n) {
      return n();
    };
    ondone = ondone || function() {};

    var finished = [];
    var isdone = false;

    (function next(i) {
      // Ensure that the given index is not run again!
      // This might occur if something is out of time
      if ( isdone || finished.indexOf(i) !== -1 ) {
        return;
      }
      finished.push(i);

      if ( i >= queue.length ) {
        isdone = true;
        return ondone();
      }

      try {
        onentry(queue[i], i, function() {
          next(i + 1);
        });
      } catch ( e ) {
        console.warn('Utils::asyncs()', 'Exception while stepping', e.stack, e);
        next(i + 1);
      }
    })(0);
  };

  /**
   * Run an async queue in parallel
   *
   * @function asyncp
   * @memberof OSjs.Utils
   *
   * @param   {Array}       queue         The queue
   * @param   {Object}      [opts]        Options
   * @param   {Number}      [opts.max=3]  Maximum number of running entries
   * @param   {Function}    onentry       Callback on step => fn(entry, index, fnNext)
   * @param   {Function}    ondone        Callback on done => fn()
   */
  OSjs.Utils.asyncp = function(queue, opts, onentry, ondone) {
    opts = opts || {};

    var running = 0;
    var max = opts.max || 3;
    var qleft = Object.keys(queue);
    var finished = [];
    var isdone = false;

    function spawn(i, cb) {
      function _done() {
        running--;
        cb();
      }

      if ( finished.indexOf(i) !== -1 ) {
        return;
      }
      finished.push(i);

      running++;
      try {
        onentry(queue[i], i, _done);
      } catch ( e ) {
        console.warn('Utils::asyncp()', 'Exception while stepping', e.stack, e);
        _done();
      }
    }

    (function check() {
      if ( !qleft.length ) {
        if ( running || isdone ) {
          return;
        }
        isdone = true;
        return ondone();
      }

      var d = Math.min(qleft.length, max - running);
      for ( var i = 0; i < d; i++ ) {
        spawn(qleft.shift(), check);
      }
    })();
  };

})();
