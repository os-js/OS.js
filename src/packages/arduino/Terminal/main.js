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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var netinfo,
      ip = 'undefined';

  var ApplicationTerminal = function(args, metadata) {
    Application.apply(this, ['ApplicationTerminal', args, metadata, {
      src: 'about:blank',
      title: metadata.name,
      icon: metadata.icon,
      width: 800,
      height: 600,
      allow_resize: true,
      allow_restore: false,
      allow_maximize: false
    }]);
  }

  ApplicationTerminal.prototype = Object.create(Application.prototype);

  ApplicationTerminal.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);
    onInited();

    var self =  this;
    OSjs.API.call('netinfo', {}, function(result, xhr) {
      if ( result.error ) {
        netinfo = null;
      } else {
        netinfo = result.result.ifconfig;
        netinfo.forEach(function(cur, index, result){
          if ( cur.ip !== '' && cur.iface !== 'lo' ) {
            self._frame.src = window.location.protocol + '//' + cur.ip + ':4200/' ;
            return false;
          }
          return true;
        })
      }
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationTerminal = OSjs.Applications.ApplicationTerminal || {};
  OSjs.Applications.ApplicationTerminal.Class = ApplicationTerminal;

})(OSjs.Helpers.IFrameApplication, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
