/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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

  // Make sure these namespaces exist
  (['API', 'Core', 'Compability', 'Helpers', 'Applications', 'Dialogs', 'GUI', 'Locales', 'VFS', 'Session']).forEach(function(ns) {
    OSjs[ns] = OSjs[ns] || {};
  });

  // For browsers without "console" for some reason
  (function() {
    window.console    = window.console    || {};
    console.log       = console.log       || function() {};
    console.debug     = console.debug     || console.log;
    console.error     = console.error     || console.log;
    console.warn      = console.warn      || console.log;
    console.group     = console.group     || console.log;
    console.groupEnd  = console.groupEnd  || console.log;
  })();

  // Compability
  (function() {
    if ( window.NodeList ) {
      window.NodeList.prototype.forEach = Array.prototype.forEach;
    }

    if ( window.FileList ) {
      window.FileList.prototype.forEach = Array.prototype.forEach;
    }
  })();

  // Initialize
  (function() {
    var onLoaded = (function() {
      var loaded = false;

      return function() {
        if ( !loaded ) {
          loaded = true;
          OSjs.Session.init();
        }
      };
    })();

    function onUnload() {
      OSjs.Session.destroy(false, true);
    }

    document.addEventListener('DOMContentLoaded', onLoaded);
    document.addEventListener('load', onLoaded);
    document.addEventListener('unload', onUnload);
  })();

})();
