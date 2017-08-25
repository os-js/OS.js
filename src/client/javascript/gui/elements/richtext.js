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
import * as DOM from 'utils/dom';
import * as Events from 'utils/events';
import Theme from 'core/theme';
import GUIElement from 'gui/element';

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

function getDocument(el, iframe) {
  iframe = iframe || el.querySelector('iframe');
  return iframe.contentDocument || iframe.contentWindow.document;
}

function getDocumentData(el) {
  try {
    const doc = getDocument(el);
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

  el._fixInterval = setInterval(() => {
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

  const themeName = Theme.getStyleTheme();
  const themeSrc = '/themes.css';
  let editable = el.getAttribute('data-editable');
  editable = editable === null || editable === 'true';

  function onMouseDown(ev) {
    function insertTextAtCursor(text) {
      let sel, range;
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
      const t = ev.shiftKey ? "outdent" : "indent";
      document.execCommand("styleWithCSS",true,null);
      document.execCommand(t, false, null)
      */
      insertTextAtCursor('\u00A0');
      ev.preventDefault();
    }
  }

  const script = onMouseDown.toString() + ';window.addEventListener("keydown", onMouseDown)';

  let template = '<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="' + themeSrc + '" /><script>' + script + '</script></head><body contentEditable="true" data-style-theme="' + themeName + '"></body></html>';
  if ( !editable ) {
    template = template.replace(' contentEditable="true"', '');
  }

  const doc = getDocument(el);
  doc.open();
  doc.write(template);
  doc.close();
  createFixInterval(el, doc, text);
}

/////////////////////////////////////////////////////////////////////////////
// CLASSES
/////////////////////////////////////////////////////////////////////////////

/**
 * Element: 'gui-richtext'
 *
 * "Richt text" input area.
 *
 * <pre><code>
 *   getter    value   String        The value/contents
 *   setter    value   String        The value/contents
 * </code></pre>
 */
class GUIRichText extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-richtext'
    }, this);
  }

  on(evName, callback, params) {
    if ( (['selection']).indexOf(evName) !== -1 ) {
      evName = '_' + evName;
    }
    Events.$bind(this.$element, evName, callback.bind(this), params);
    return this;
  }

  build() {
    const el = this.$element;
    const text = el.childNodes.length ? el.childNodes[0].nodeValue : '';

    DOM.$empty(el);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('border', 0);
    iframe.onload = () => {
      iframe.contentWindow.addEventListener('selectstart', () => {
        el.dispatchEvent(new CustomEvent('_selection', {detail: {}}));
      });
      iframe.contentWindow.addEventListener('pointerup', () => {
        el.dispatchEvent(new CustomEvent('_selection', {detail: {}}));
      });
    };
    el.appendChild(iframe);

    setTimeout(() => {
      try {
        setDocumentData(el, text);
      } catch ( e ) {
        console.warn('gui-richtext', 'build()', e);
      }
    }, 1);

    return this;
  }

  command() {
    try {
      const doc = getDocument(this.$element);
      if ( doc && doc.execCommand ) {
        return doc.execCommand.apply(doc, arguments);
      }
    } catch ( e ) {
      console.warn('gui-richtext call() warning', e.stack, e);
    }
    return this;
  }

  query() {
    try {
      const doc = getDocument(this.$element);
      if ( doc && doc.queryCommandValue ) {
        return doc.queryCommandValue.apply(doc, arguments);
      }
    } catch ( e ) {
      console.warn('gui-richtext call() warning', e.stack, e);
    }
    return null;
  }

  get(param, value) {
    if ( param === 'value' ) {
      return getDocumentData(this.$element);
    }
    return super.get(...arguments);
  }

  set(param, value) {
    if ( param === 'value' ) {
      setDocumentData(this.$element, value);
      return this;
    }
    return super.set(...arguments);
  }
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default {
  GUIRichText: GUIRichText
};
