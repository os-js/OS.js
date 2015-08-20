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

  function getDocument(el, iframe) {
    iframe = iframe || el.querySelector('iframe');
    return iframe.contentDocument || iframe.contentWindow.document;
  }

  function getDocumentData(el) {
    try {
      var doc = getDocument(el);
      return doc.body.innerHTML;
    } catch ( error ) {
      console.error('gui-richtext', 'getDocumentData()', error.stack, error);
    }
    return '';
  }

  function destroyFixInterval(el) {
    el._fixTry = 0;
    el._fixInterval = clearInterval(el._fixInterval);
  }

  function createFixInterval(el, doc, text) {
    if ( el._fixTry > 10 ) {
      el._fixTry = 0;
      return;
    }

    el._fixInterval = setInterval(function() {
      try {
        if ( text ) {
          doc.body.innerHTML = text;
        }
        destroyFixInterval(el);
      } catch ( error ) {
        console.warn('gui-richtext', 'setDocumentData()', error.stack, error, '... trying again');
      }
      el._fixTry++;
    }, 100);
  }

  function setDocumentData(el, text) {
    destroyFixInterval(el);

    text = text || '';

    var wm = OSjs.Core.getWindowManager();
    var theme = (wm ? wm.getSetting('theme') : 'default') || 'default';
    var themeSrc = OSjs.API.getThemeCSS(theme);

    var editable = el.getAttribute('data-editable');
    editable = editable === null || editable === 'true';

    function onMouseDown(ev) {
      function insertTextAtCursor(text) {
        var sel, range, html;
        if (window.getSelection) {
          sel = window.getSelection();
          if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode( document.createTextNode(text) );
          }
        } else if (document.selection && document.selection.createRange) {
          document.selection.createRange().text = text;
        }
      }

      if ( ev.keyCode === 9 ) {
        /*
        var t = ev.shiftKey ? "outdent" : "indent";
        document.execCommand("styleWithCSS",true,null);
        document.execCommand(t, false, null)
        */
        insertTextAtCursor('\u00A0');
        ev.preventDefault();
      }
    }

    var script = onMouseDown.toString() + ';window.addEventListener("keydown", onMouseDown)';

    var template = '<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="' + themeSrc + '" /><script>' + script + '</script></head><body contentEditable="true"></body></html>';
    if ( !editable ) {
      template = template.replace(' contentEditable="true"', '');
    }

    var doc = getDocument(el);
    doc.open();
    doc.write(template);
    doc.close();
    createFixInterval(el, doc, text);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-richtext'
   *
   * "Richt text" input area.
   *
   * @api OSjs.GUI.Elements.gui-richtext
   * @class
   */
  GUI.Elements['gui-richtext'] = {
    bind: function(el, evName, callback, params) {
      if ( (['selection']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var text = el.childNodes.length ? el.childNodes[0].nodeValue : '';

      Utils.$empty(el);

      var iframe = document.createElement('iframe');
      iframe.setAttribute('border', 0);
      iframe.onload = function() {
        iframe.contentWindow.addEventListener('selectstart', function() {
          el.dispatchEvent(new CustomEvent('_selection', {detail: {}}));
        });
        iframe.contentWindow.addEventListener('mouseup', function() {
          el.dispatchEvent(new CustomEvent('_selection', {detail: {}}));
        });
      };
      el.appendChild(iframe);

      setTimeout(function() {
        setDocumentData(el, text);
      }, 0);
    },
    call: function(el, method, args) {
      var doc = getDocument(el);
      if ( method === 'command' ) {
        return doc.execCommand.apply(doc, args);
      } else if ( method === 'query' ) {
        return doc.queryCommandValue.apply(doc, args);
      }
      return null;
    },
    get: function(el, param, value) {
      if ( param === 'value' ) {
        return getDocumentData(el);
      }
      return GUI.Helpers.getProperty(el, param);
    },
    set: function(el, param, value) {
      if ( param === 'value' ) {
        setDocumentData(el, value);
        return true;
      }
      return false;
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
