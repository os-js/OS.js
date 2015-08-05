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
(function(API, Utils, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////


  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  // TODO Events
  /**
   * Element: 'gui-richtext'
   *
   * "Richt text" input area.
   *
   * @api OSjs.GUI.Elements.gui-richtext
   * @class
   */
  GUI.Elements['gui-richtext'] = {
    build: function(el) {
      var text = el.childNodes.length ? el.childNodes[0].nodeValue : '';

      var wm = OSjs.Core.getWindowManager();
      var theme = (wm ? wm.getSetting('theme') : 'default') || 'default';
      var themeSrc = OSjs.API.getThemeCSS(theme);

      var editable = el.getAttribute('data-editable');
      editable = editable === null || editable === 'true';

      var template = '<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="' + themeSrc + '" /></head><body contentEditable="true"></body></html>';
      if ( !editable ) {
        template = template.replace(' contentEditable="true"', '');
      }

      Utils.$empty(el);

      var doc;
      var iframe = document.createElement('iframe');
      iframe.setAttribute('border', 0);
      el.appendChild(iframe);

      setTimeout(function() {
        try {
          doc = iframe.contentDocument || iframe.contentWindow.document;
          doc.open();
          doc.write(template);
          doc.close();

          if ( text ) {
            doc.body.innerHTML = text;
          }
        } catch ( error ) {
          console.error('gui-richtext', error);
        }
      }, 0);
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
