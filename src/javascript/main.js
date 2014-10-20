/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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

  // Compability
  window.OSjs       = window.OSjs       || {};
  window.console    = window.console    || {};
  console.log       = console.log       || function() {};
  console.debug     = console.debug     || console.log;
  console.error     = console.error     || console.log;
  console.warn      = console.warn      || console.log;
  console.group     = console.group     || console.log;
  console.groupEnd  = console.groupEnd  || console.log;

  if ( window.NodeList ) {
    window.NodeList.prototype.forEach = Array.prototype.forEach;
  }
  if ( window.FileList ) {
    window.FileList.prototype.forEach = Array.prototype.forEach;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Main initialization code
  /////////////////////////////////////////////////////////////////////////////

  function _onLoad() {
    OSjs.Core.initialize();
  }

  function _onUnload() {
    OSjs.Core.shutdown(false, true);
  }

  var jQuery = window.$ || window.jQuery;
  if ( typeof jQuery !== 'undefined' ) {
    console.warn('Using jQuery initialization');
    jQuery(window).on('load', _onLoad);
    jQuery(window).on('unload', _onUnload);
  } else {
    window.onload   = _onLoad;
    window.onunload = _onUnload;
  }

})();
