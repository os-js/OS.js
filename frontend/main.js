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

  window.console    = window.console    || {};
  console.log       = console.log       || function() {};
  console.debug     = console.debug     || console.log;
  console.error     = console.error     || console.log;
  console.warn      = console.warn      || console.log;
  console.group     = console.group     || console.log;
  console.groupEnd  = console.groupEnd  || console.log;

  /*
  window.indexedDB      = window.indexedDB      || window.mozIndexedDB          || window.webkitIndexedDB   || window.msIndexedDB;
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction  || window.msIDBTransaction;
  window.IDBKeyRange    = window.IDBKeyRange    || window.webkitIDBKeyRange     || window.msIDBKeyRange;
  */

  /////////////////////////////////////////////////////////////////////////////
  // Default settings
  /////////////////////////////////////////////////////////////////////////////

  var _checkConfig = function() {
    if ( !OSjs.Settings.DefaultConfig ) {
      OSjs.Settings.DefaultConfig = function() {
        return {
          Core : {
            APIURI:         '/API',
            FSURI:          '/FS',
            PACKAGEURI:     '/packages.json',
            Home:           '/opt/OSjs/home',
            MaxUploadSize:  2097152,
            BugReporting:   true,
            Preloads: [
              {type: 'javascript', src: '/apps/CoreWM/main.js'},
              {type: 'stylesheet', src: '/apps/CoreWM/main.css'}
            ]
          },

          Handler : {
            name : 'Default'
          },

          WM : {
            exec: 'CoreWM',
            args: {themes: {'default': {title: 'Default'}}, defaults: null}
          }
        };
      };
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // Main initialization code
  /////////////////////////////////////////////////////////////////////////////

  window.onload = function() {
    _checkConfig();
    OSjs._initialize();
  };

  window.onunload = function() {
    OSjs._shutdown(false, true);
  };

})();

