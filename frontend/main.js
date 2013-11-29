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

  window.OSjs   = window.OSjs   || {};
  OSjs.Settings = OSjs.Settings || {};
  OSjs.Bindings = OSjs.Bindings || {};

  window.console    = window.console    || {};
  console.log       = console.log       || function() {};
  console.debug     = console.debug     || console.log;
  console.error     = console.error     || console.log;
  console.warn      = console.warn      || console.log;
  console.group     = console.group     || console.log;
  console.groupEnd  = console.groupEnd  || console.log;

  /////////////////////////////////////////////////////////////////////////////
  // Bindings code
  /////////////////////////////////////////////////////////////////////////////

  //
  // To override these, just add a preload file to the backend and update the
  // bindings. Remember to allways call the 'continueCallback' function!
  //

  /**
   * Called when OS.js has booted
   */
  OSjs.Bindings.onBooted = function(continueCallback) {
    continueCallback();
  };

  /**
   * Called when OS.js has logged the user in
   */
  OSjs.Bindings.onLoggedIn = function(continueCallback) {
    continueCallback();
  };

  /**
   * Called when OS.js has logged the user out
   */
  OSjs.Bindings.onLoggedOut = function(continueCallback) {
    continueCallback();
  };

  /////////////////////////////////////////////////////////////////////////////
  // Settings code
  /////////////////////////////////////////////////////////////////////////////

  var _DEFAULT_SETTINGS = function() {
    return {
      WM : {
        fullscreen    : false,
        taskbar       : {position: 'top', ontop: true},
        desktop       : {margin: 5},
        wallpaper     : '/themes/wallpapers/noise_red.png',
        theme         : 'default',
        background    : 'image-repeat',
        style         : {
          backgroundColor  : '#0B615E',
          color            : '#333',
          fontWeight       : 'normal',
          textDecoration   : 'none',
          backgroundRepeat : 'repeat'
        }
      }
    };
  };


  OSjs.Settings.getSetting = function(cat, key) {
    var set = _DEFAULT_SETTINGS()[cat];
    if ( key ) {
      return set[key];
    }
    return set;
  };

  /////////////////////////////////////////////////////////////////////////////
  // Main initialization code
  /////////////////////////////////////////////////////////////////////////////

  window.onload = function() {
    console.info("window::onload()");
    OSjs.initialize();
  };

  window.onunload = function() {
    console.info("window::onunload()");
    OSjs.shutdown(false, true);
  };

})();

