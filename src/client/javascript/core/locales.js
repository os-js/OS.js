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
import {format} from 'utils/misc';

let DefaultLocale = 'en_EN';
let CurrentLocale = 'en_EN';
let CurrentRTL = [];

/////////////////////////////////////////////////////////////////////////////
// LOCALE API METHODS
/////////////////////////////////////////////////////////////////////////////

/**
 * Translate given string
 *
 * @param  {String}       s       Translation key/string
 * @param  {...String}    sargs   Format values
 *
 * @return {String}
 */
export function _() {
  let userLocale = {};
  let systemLocale = {};
  try {
    userLocale = require('locales/' + CurrentLocale + '.js');
    systemLocale = require('locales/' + DefaultLocale + '.js');
  } catch ( e ) {
    console.warn('Locale error', e);
  }

  const s = arguments[0];
  let a = arguments;
  try {
    if ( userLocale && userLocale[s] ) {
      a[0] = userLocale[s];
    } else {
      a[0] = systemLocale[s] || s;
    }

    return a.length > 1 ? format.apply(null, a) : a[0];
  } catch ( e ) {
    console.warn(e.stack, e);
  }

  return s;
}

/**
 * Same as _ only you can supply the list as first argument
 * @see _
 *
 * @return {String}
 */
export function __() {
  const l = arguments[0];
  const s = arguments[1];

  let a = Array.prototype.slice.call(arguments, 1);
  if ( l[CurrentLocale] && l[CurrentLocale][s] ) {
    a[0] = l[CurrentLocale][s];
  } else {
    a[0] = l[DefaultLocale] ? (l[DefaultLocale][s] || s) : s;
    if ( a[0] && a[0] === s ) {
      a[0] = _.apply(null, a);
    }
  }

  return a.length > 1 ? format.apply(null, a) : a[0];
}

/**
 * Get current locale
 *
 * @return {String}
 */
export function getLocale() {
  return CurrentLocale;
}

/**
 * Set locale
 *
 * @param  {String}   l     Locale name
 */
export function setLocale(l) {
  let locale;

  try {
    locale = require('locales/' + l + '.js');
  } catch ( e ) {
    console.warn('Failed to set locale', e);
    return;
  }

  if ( locale ) {
    CurrentLocale = l;
  } else {
    console.warn('Locales::setLocale()', 'Invalid locale', l, '(Using default)');
    CurrentLocale = DefaultLocale;
  }

  const major = CurrentLocale.split('_')[0];
  const html = document.querySelector('html');
  if ( html ) {
    html.setAttribute('lang', l);
    html.setAttribute('dir', CurrentRTL.indexOf(major) !== -1 ? 'rtl' : 'ltr');
  }

  console.info('Locales::setLocale()', CurrentLocale);
}

/**
 * Creates a new translation function based on a map
 * @param {Object} locales A localization map
 * @return {Function}
 */
export function createLocalizer(locales) {
  return function() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(locales);
    return __(...args);
  };
}

/**
 * Initializes locales
 * @param {String}  locale         Locale name
 * @param {Object}  options        Locale options
 * @param {Array}   [options.RTL]  RTL Languages
 * @param {Array}   languages      Available languages
 */
export function init(locale, options, languages) {
  options = options || {};

  const names = languages ? Object.keys(languages) : {};
  if ( names.indexOf(locale) !== -1 ) {
    CurrentLocale = locale;
  }

  CurrentRTL = options.RTL || [];

  names.forEach((k) => {
    OSjs.Locales[k] = require('locales/' + k + '.js');
  });
}
