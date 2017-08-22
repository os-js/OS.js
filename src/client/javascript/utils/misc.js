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

/////////////////////////////////////////////////////////////////////////////
// COOKIES
/////////////////////////////////////////////////////////////////////////////

/**
 * Gets a cookie by key, or all cookies
 *
 * @param {String} [k] What key to get
 * @return {String|Object}  Depending on 'k' parameter
 */
export function getCookie(k) {
  const map = {};
  document.cookie.split(/;\s+?/g).forEach((i) => {
    const idx = i.indexOf('=');
    map[i.substr(i, idx)] = i.substr(idx + 1);
  });
  return k ? map[k] : map;
}

/////////////////////////////////////////////////////////////////////////////
// STRING
/////////////////////////////////////////////////////////////////////////////

/**
 * Format a string (almost like sprintf)
 *
 * @link http://stackoverflow.com/a/4673436
 *
 * @param   {String}      format        String format
 * @param   {...String}   s             Insert into format
 *
 * @return  {String}                    The formatted string
 */
export function format(format) {
  const args = Array.prototype.slice.call(arguments, 1);
  const sprintfRegex = /\{(\d+)\}/g;

  function sprintf(match, number) {
    return number in args ? args[number] : match;
  }

  return format.replace(sprintfRegex, sprintf);
}

/**
 * Remove whitespaces and newlines from HTML document
 *
 * @param   {String}    html          HTML string input
 *
 * @return  {String}
 */
export function cleanHTML(html) {
  return html.replace(/\n/g, '')
    .replace(/[\t ]+</g, '<')
    .replace(/\>[\t ]+</g, '><')
    .replace(/\>[\t ]+$/g, '>');
}

/**
 * Parses url into a dictionary (supports modification)
 *
 * @param     {String}        url       Input URL
 * @param     {Object}        [modify]  Modify URL with these options
 *
 * @return    {Object}                  Object with protocol, host, path
 */
export function parseurl(url, modify) {
  modify = modify || {};

  if ( !url.match(/^(\w+\:)\/\//) ) {
    url = '//' + url;
  }

  const protocol = url.split(/^(\w+\:)?\/\//);

  const splitted = (() => {
    const tmp = protocol[2].replace(/^\/\//, '').split('/');
    return {
      proto: (modify.protocol || protocol[1] || window.location.protocol || '').replace(/\:$/, ''),
      host: modify.host || tmp.shift(),
      path: modify.path || '/' + tmp.join('/')
    };
  })();

  function _parts() {
    const parts = [splitted.proto, '://'];

    if ( modify.username ) {
      const authstr = String(modify.username) + ':' + String(modify.password);
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
}

/**
 * Get URL query parameters
 * @link https://gist.github.com/pirate/9298155edda679510723
 * @param {String} search The url to search
 * @param {Boolean} [hash=false] Use hash instead of query
 * @return {String[]}
 */
export function urlparams(search, hash) {
  let hashes = search.slice(search.indexOf(hash ? '#' : '?') + 1).split('&');
  return hashes.reduce((params, hash) => {
    let [key, val] = hash.split('=');
    return Object.assign(params, {[key]: decodeURIComponent(val)});
  }, {});
}

/////////////////////////////////////////////////////////////////////////////
// OBJECT HELPERS
/////////////////////////////////////////////////////////////////////////////

/**
 * Wrapper for merging function argument dictionaries
 *
 * @param  {Object}   args      Given function Dictionary
 * @param  {Object}   defaults  Defaults Dictionary
 * @param  {Boolean}  undef     Check with 'undefined'
 * @return {Object}
 */
export function argumentDefaults(args, defaults, undef) {
  args = args || {};
  Object.keys(defaults).forEach((key) => {
    if ( typeof defaults[key] === 'boolean' || typeof defaults[key] === 'number' ) {
      if ( typeof args[key] === 'undefined' || args[key] === null ) {
        args[key] = defaults[key];
      }
    } else {
      args[key] = args[key] || defaults[key];
    }
  });
  return args;
}

/**
 * Deep-merge to objects
 *
 * @param   {Object}      obj1                    Object to merge to
 * @param   {Object}      obj2                    Object to merge with
 * @param   {Object}      [opts]                  Options
 * @param   {Bollean}     [opts.overwrite=true]   Overwrite existing
 *
 * @return  {Object}                The merged object
 */
export function mergeObject(obj1, obj2, opts) {
  opts = opts || {};

  for ( let p in obj2 ) {
    if ( obj2.hasOwnProperty(p) ) {
      try {
        if (opts.overwrite === false && obj1.hasOwnProperty(p)) {
          continue;
        }

        if ( obj2[p].constructor === Object ) {
          obj1[p] = mergeObject(obj1[p], obj2[p]);
        } else {
          obj1[p] = obj2[p];
        }
      } catch (e) {
        obj1[p] = obj2[p];
      }
    }
  }
  return obj1;
}

/**
 * Clone a object
 *
 * @param   {Object}      o                     The object to clone
 * @param   {Boolean}     [alternative=false]   Do a programatic deep clone approach
 *
 * @return  {Object}            An identical object
 */
export function cloneObject(o, alternative) {
  function _clone(i) {
    if ( typeof i !== 'object' || i === null ) {
      return i;
    } else if ( i instanceof Array ) {
      return i.map(_clone);
    }

    const iter = {};
    Object.keys(i).forEach((k) => {
      iter[k] = _clone(i[k]);
    });
    return iter;
  }

  if ( alternative ) {
    return _clone(o);
  }

  return JSON.parse(JSON.stringify(o, (key, value) => {
    if ( value && typeof value === 'object' && value.tagName ) {
      return window.undefined;
    }
    return value;
  }));
}

/////////////////////////////////////////////////////////////////////////////
// COLORS
/////////////////////////////////////////////////////////////////////////////

/**
 * Convert HEX to RGB
 *
 * @param   {String}      hex     The hex string (with #)
 *
 * @return  {Object}              RGB in form of r, g, b
 */
export function convertToRGB(hex) {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const val = {};
  val.r = (rgb & (255 << 16)) >> 16;
  val.g = (rgb & (255 << 8)) >> 8;
  val.b = (rgb & 255);
  return val;
}

/**
 * Convert RGB to HEX
 *
 * @param   {Number|Object}    r         Red value or RGB object
 * @param   {Number|undefined} [g]       Green value
 * @param   {Number|undefined} [b]       Blue value
 *
 * @return  {String}              Hex string (with #)
 */
export function convertToHEX(r, g, b) {
  if ( typeof r === 'object' ) {
    g = r.g;
    b = r.b;
    r = r.r;
  }

  if ( typeof r === 'undefined' || typeof g === 'undefined' || typeof b === 'undefined' ) {
    throw new Error('Invalid RGB supplied to convertToHEX()');
  }

  const hex = [
    parseInt(r, 10).toString( 16 ),
    parseInt(g, 10).toString( 16 ),
    parseInt(b, 10).toString( 16 )
  ];

  Object.keys(hex).forEach((i) => {
    if ( hex[i].length === 1 ) {
      hex[i] = '0' + hex[i];
    }
  });

  return '#' + hex.join('').toUpperCase();
}

/**
 * Ivert HEX color
 * @link http://stackoverflow.com/a/9601429/1236086
 *
 * @param   {String}      hex     Hex string (With #)
 *
 * @return  {String}              Inverted hex (With #)
 *
 */
export function invertHEX(hex) {
  let color = parseInt(hex.replace('#', ''), 16);
  color = 0xFFFFFF ^ color;
  color = color.toString(16);
  color = ('000000' + color).slice(-6);
  return '#' + color;
}
