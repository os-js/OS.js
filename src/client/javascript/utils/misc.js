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

  window.OSjs = window.OSjs || {};
  OSjs.Utils  = OSjs.Utils  || {};

  /////////////////////////////////////////////////////////////////////////////
  // STRING
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Format a string (almost like sprintf)
   *
   * @param   String      format        String format
   * @param   String      ...           Insert into format
   *
   * @return  String                    The formatted string
   *
   * @link    http://stackoverflow.com/a/4673436
   * @api     OSjs.Utils.format()
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
   * @param   String    html          HTML string input
   *
   * @return  String
   *
   * @api     OSjs.Utils.cleanHTML()
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
   * @param     String        url       Input URL
   * @param     Object        modify    (Optional) Modify URL with these options
   *
   * @return    Object                  Object with {protocol, host, path}
   *
   * @api       OSjs.Utils.parseurl()
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
   * @api    OSjs.Utils.argumentDefaults()
   *
   * @param  Object   args      Given function Dictionary
   * @param  Object   defaults  Defaults Dictionary
   * @param  boolean  undef     Check with 'undefined'
   * @return Object
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
   * @param   Object      obj1      Object to merge to
   * @param   Object      obj2      Object to merge with
   *
   * @return  Object                The merged object
   *
   * @api     OSjs.Utils.mergeObject()
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
   * @param   Object      o     The object to clone
   *
   * @return  Object            An identical object
   *
   * @api     OSjs.Utils.cloneObject()
   */
  OSjs.Utils.cloneObject = function(o) {
    return JSON.parse(JSON.stringify(o, function(key, value) {
      if ( value && typeof value === 'object' && value.tagName ) {
        return undefined;
      }
      return value;
    }));
  };

  /**
   * Fixes JSON for HTTP requests (in case they were returned as string)
   *
   * @param   Mixed     response      The data
   *
   * @return  Object                  JSON
   *
   * @api     OSjs.Utils.fixJSON()
   */
  OSjs.Utils.fixJSON = function(response) {
    if ( typeof response === 'string' ) {
      if ( response.match(/^\{|\[/) ) {
        try {
          response = JSON.parse(response);
        } catch ( e  ) {
          console.warn('FAILED TO FORCE JSON MIME TYPE', e);
        }
      }
    }
    return response;
  };

  /////////////////////////////////////////////////////////////////////////////
  // COLORS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Convert HEX to RGB
   *
   * @param   String      hex     The hex string (with #)
   *
   * @return  Object              RGB in form of {r:0, g:0, b:0}
   *
   * @api     OSjs.Utils.convertToRGB()
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
   * @param   Object      rgb       The RGB object in form of {r:0, g:0, b:0}
   *
   * OR
   *
   * @param   int         r         Red value
   * @param   int         g         Green value
   * @param   int         b         Blue value
   *
   * @return  String                Hex string (with #)
   *
   * @api     OSjs.Utils.convertToHEX()
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
   * @param   String      hex     Hex string (With #)
   *
   * @return  String              Inverted hex (With #)
   *
   * @link    http://stackoverflow.com/a/9601429/1236086
   * @api     OSjs.Utils.invertHEX()
   */
  OSjs.Utils.invertHEX = function(hex) {
    var color = parseInt(hex.replace('#', ''), 16);
    color = 0xFFFFFF ^ color;
    color = color.toString(16);
    color = ('000000' + color).slice(-6);
    return '#' + color;
  };

})();
