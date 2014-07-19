"use strict";
/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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

  window.OSjs       = window.OSjs       || {};
  OSjs.Locale       = OSjs.Locale       || {};

  /////////////////////////////////////////////////////////////////////////////
  // TRANSLATIONS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Locales = OSjs.Locales || {};

  var DefaultLocale = 'en_EN';
  var CurrentLocale = 'en_EN';


  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Translate given string
   * @param  String   s     Translation key/string
   * @param  Mixed    ...   Format values
   * @return String
   */
  OSjs._ = function() {
    var s = arguments[0];
    var a = arguments;
    a[0] = OSjs.Locales[CurrentLocale][s] || s;

    return a.length > 1 ? OSjs.Utils.format.apply(null, a) : a[0];
  };

  /**
   * Same as _ only you can supply the list as first argument
   */
  OSjs.__ = function() {
    var l = arguments[0];
    var s = arguments[1];
    var a = Array.prototype.slice.call(arguments, 1);
    a[0] = l[CurrentLocale] ? (l[CurrentLocale][s] || s) : s;

    return a.length > 1 ? OSjs.Utils.format.apply(null, a) : a[0];
  };

  /**
   * Get current locale
   * @return String
   */
  OSjs.Locale.getLocale = function() {
    return CurrentLocale;
  };

  /**
   * Set locale
   * @param  String   s     Locale name
   * @return void
   */
  OSjs.Locale.setLocale = function(l) {
    if ( OSjs.Locales[l] ) {
      CurrentLocale = l;
    } else {
      console.warn("OSjs::Locale::setLocale()", "Invalid locale", l, "(Using default)");
      CurrentLocale = DefaultLocale;
    }

    console.log("OSjs::Locale::setLocale()", CurrentLocale);
  };

})();
