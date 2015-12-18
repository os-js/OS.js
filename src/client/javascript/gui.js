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
(function(API, Utils, VFS) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};
  OSjs.GUI.Elements = OSjs.GUI.Elements || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Gets window id from upper parent element
   *
   * @param   DOMElement      el      Child element (can be anything)
   *
   * @return  int
   *
   * @api OSjs.GUI.Helpers.getWindowId()
   */
  function getWindowId(el) {
    while ( el.parentNode ) {
      var attr = el.getAttribute('data-window-id');
      if ( attr !== null ) {
        return parseInt(attr, 10);
      }
      el = el.parentNode;
    }
    return null;
  }

  /**
   * Gets "label" from a node
   *
   * @param   DOMElement      el      The element
   *
   * @return  String
   *
   * @api OSjs.GUI.Helpers.getLabel()
   */
  function getLabel(el) {
    var label = el.getAttribute('data-label');
    return label || '';
  }

  /**
   * Gets "label" from a node (Where it can be innerHTML and parameter)
   *
   * @param   DOMElement      el      The element
   *
   * @return  String
   *
   * @api OSjs.GUI.Helpers.getValueLabel()
   */
  function getValueLabel(el, attr) {
    var label = attr ? el.getAttribute('data-label') : null;

    if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
      label = el.childNodes[0].nodeValue;
      Utils.$empty(el);
    }

    return label || '';
  }

  /**
   * Gets "value" from a node
   *
   * @param   DOMElement      el       The element
   *
   * @return  String
   *
   * @api OSjs.GUI.Helpers.getViewNodeValue()
   */
  function getViewNodeValue(el) {
    var value = el.getAttribute('data-value');
    if ( typeof value === 'string' && value.match(/^\[|\{/) ) {
      try {
        value = JSON.parse(value);
      } catch ( e ) {
        value = null;
      }
    }
    return value;
  }

  /**
   * Internal for getting
   *
   * @param   DOMElement          el      Element
   * @param   OSjs.Core.Window    win     (optional) Window Reference
   *
   * @return  String
   *
   * @api OSjs.GUI.Helpers.getIcon()
   */
  function getIcon(el, win) {
    var image = el.getAttribute('data-icon');

    if ( image && image !== 'undefined') {
      if ( image.match(/^stock:\/\//) ) {
        image = image.replace('stock://', '');

        var size  = '16x16';
        try {
          var spl = image.split('/');
          var tmp = spl.shift();
          var siz = tmp.match(/^\d+x\d+/);
          if ( siz ) {
            size = siz[0];
            image = spl.join('/');
          }

          image = API.getIcon(image, size);
        } catch ( e ) {}
      } else if ( image.match(/^app:\/\//) ) {
        image = API.getApplicationResource(win._app, image.replace('app://', ''));
      }

      return image;
    }

    return null;
  }

  /**
   * Wrapper for getting custom dom element property value
   *
   * @param   DOMElement      el      Element
   * @param   String          param   Parameter name
   * @param   String          tagName (Optional) What tagname is in use? Automatic
   *
   * @api OSjs.GUI.Helpers.getProperty()
   *
   * @return  Mixed
   */
  function getProperty(el, param, tagName) {
    tagName = tagName || el.tagName.toLowerCase();
    var isDataView = tagName.match(/^gui\-(tree|icon|list|file)\-view$/);

    if ( param === 'value' && !isDataView) {
      if ( (['gui-text', 'gui-password', 'gui-textarea', 'gui-slider', 'gui-select', 'gui-select-list']).indexOf(tagName) >= 0 ) {
        return el.querySelector('input, textarea, select').value;
      }
      if ( (['gui-checkbox', 'gui-radio', 'gui-switch']).indexOf(tagName) >= 0 ) {
        return !!el.querySelector('input').checked;
        //return el.querySelector('input').value === 'on';
      }
      return null;
    }

    if ( (param === 'value' || param === 'selected') && isDataView ) {
      return OSjs.GUI.Elements[tagName].values(el);
    }

    return el.getAttribute('data-' + param);
  }

  /**
   * Wrapper for setting custom dom element property value
   *
   * @param   DOMElement      el      Element
   * @param   String          param   Parameter name
   * @param   Mixed           value   Parameter value
   * @param   String          tagName (Optional) What tagname is in use? Automatic
   *
   * @api OSjs.GUI.Helpers.setProperty()
   *
   * @return  void
   */
  function setProperty(el, param, value, tagName) {
    tagName = tagName || el.tagName.toLowerCase();

    function _setInputProperty() {
      var firstChild = el.querySelector('textarea, input, select, button');

      if ( param === 'value' ) {
        if ( tagName === 'gui-radio' || tagName === 'gui-checkbox' ) {
          if ( value ) {
            firstChild.setAttribute('checked', 'checked');
          } else {
            firstChild.removeAttribute('checked');
          }
        }

        firstChild.value = value;
        return;
      } else if ( param === 'disabled' ) {
        if ( value ) {
          firstChild.setAttribute('disabled', 'disabled');
        } else {
          firstChild.removeAttribute('disabled');
        }
        return;
      }

      firstChild.setAttribute(param, value || '');
    }

    function _setElementProperty() {
      if ( typeof value === 'boolean' ) {
        value = value ? 'true' : 'false';
      } else if ( typeof value === 'object' ) {
        try {
          value = JSON.stringify(value);
        } catch ( e ) {}
      }
      el.setAttribute('data-' + param, value);
    }

    function _createInputLabel() {
      if ( param === 'label' ) {
        var firstChild = el.querySelector('textarea, input, select');
        el.appendChild(firstChild);
        Utils.$remove(el.querySelector('label'));
        createInputLabel(el, tagName.replace(/^gui\-/, ''), firstChild, value);
      }
    }

    // Generics for input elements
    var firstChild = el.children[0];
    var accept = ['gui-slider', 'gui-text', 'gui-password', 'gui-textarea', 'gui-checkbox', 'gui-radio', 'gui-select', 'gui-select-list', 'gui-button'];
    if ( accept.indexOf(tagName) >= 0 ) {
      _setInputProperty();
      _createInputLabel();
    }

    // Other types of elements
    accept = ['gui-image', 'gui-audio', 'gui-video'];
    if ( (['src', 'controls', 'autoplay', 'alt']).indexOf(param) >= 0 && accept.indexOf(tagName) >= 0 ) {
      firstChild[param] = value;
    }

    // Normal DOM attributes
    if ( (['_id', '_class', '_style']).indexOf(param) >= 0 ) {
      firstChild.setAttribute(param.replace(/^_/, ''), value);
      return;
    }

    // Set the actual root element property value
    if ( param !== 'value' ) {
      _setElementProperty();
    }
  }

  /**
   * Creates a label for given input element
   *
   * @param   DOMEelement     el        Element root
   * @param   String          type      Input element type
   * @param   DOMElement      input     The input element
   * @param   String          label     (Optional) Used when updating
   *
   * @return  void
   *
   * @api OSjs.GUI.Helpers.createInputLabel()
   */
  function createInputLabel(el, type, input, label) {
    label = label || getLabel(el);

    if ( label ) {
      var lbl = document.createElement('label');
      var span = document.createElement('span');
      span.appendChild(document.createTextNode(label));

      if ( type === 'checkbox' || type === 'radio' ) {
        lbl.appendChild(input);
        lbl.appendChild(span);
      } else {
        lbl.appendChild(span);
        lbl.appendChild(input);
      }
      el.appendChild(lbl);
    } else {
      el.appendChild(input);
    }
  }

  /**
   * Create a new custom DOM element
   *
   * @param   String      tagName           Tag Name
   * @param   Object      params            Dict with data-* properties
   * @param   Array       ignoreParams      (optional) list of arguments to ignore
   *
   * @return  DOMElement
   */
  function createElement(tagName, params, ignoreParams) {
    ignoreParams = ignoreParams || [];

    var el = document.createElement(tagName);

    var classMap = {
      textalign: function(v) {
        Utils.$addClass(el, 'gui-align-' + v);
      },
      className: function(v) {
        Utils.$addClass(el, v);
      }
    };

    function getValue(k, value) {
      if ( typeof value === 'boolean' ) {
        value = value ? 'true' : 'false';
      } else if ( typeof value === 'object' ) {
        try {
          value = JSON.stringify(value);
        } catch ( e ) {}
      }

      return value;
    }

    if ( typeof params === 'object' ) {
      Object.keys(params).forEach(function(k) {
        if ( ignoreParams.indexOf(k) >= 0 ) {
          return;
        }

        var value = params[k];
        if ( typeof value !== 'undefined' && typeof value !== 'function' ) {
          if ( classMap[k] ) {
            classMap[k](value);
            return;
          }

          var fvalue = getValue(k, value);
          el.setAttribute('data-' + k, fvalue);
        }
      });
    }

    return el;
  }

  /**
   * Sets the flexbox CSS style properties for given container
   *
   * @param   DOMElement      el              The container
   * @param   int             grow            Grow factor
   * @param   int             shrink          Shrink factor
   * @param   String          basis           (Optional: basis, default=auto)
   * @param   DOMElement      checkel         (Optional: take defaults from this node)
   *
   * @api OSjs.GUI.Helpers.setFlexbox()
   */
  function setFlexbox(el, grow, shrink, basis, checkel) {
    checkel = checkel || el;
    (function() {
      if ( typeof basis === 'undefined' || basis === null ) {
        basis = checkel.getAttribute('data-basis') || 'auto';
      }
    })();

    (function() {
      if ( typeof grow === 'undefined' || grow === null ) {
        grow = checkel.getAttribute('data-grow') || 0;
      }
    })();

    (function() {
      if ( typeof shrink === 'undefined' || shrink === null ) {
        shrink = checkel.getAttribute('data-shrink') || 0;
      }
    })();

    var flex = [grow, shrink];
    if ( basis.length ) {
      flex.push(basis);
    }

    var style = flex.join(' ');
    el.style.WebkitBoxFlex = style;
    el.style.MozBoxFlex = style;

    el.style.WebkitFlex = style;
    el.style.MozFlex = style;
    el.style.MSFlex = style;
    el.style.OFlex = style;
    el.style.flex = style;

    var align = el.getAttribute('data-align');
    Utils.$removeClass(el, 'gui-flex-align-start');
    Utils.$removeClass(el, 'gui-flex-align-end');
    if ( align ) {
      Utils.$addClass(el, 'gui-flex-align-' + align);
    }
  }

  /**
   * Wrapper for creating a draggable container
   *
   * @param   DOMElement        el          The container
   * @param   Function          onDown      On down action callback
   * @param   Function          onMove      On move action callback
   * @param   Function          onUp        On up action callback
   *
   * @api OSjs.GUI.Helpers.createDrag()
   */
  function createDrag(el, onDown, onMove, onUp) {
    onDown = onDown || function() {};
    onMove = onMove || function() {};
    onUp = onUp || function() {};

    var startX, startY, currentX, currentY;
    var dragging = false;
    var boundUp, boundMove;

    function _onMouseDown(ev, pos, touchDevice) {
      ev.preventDefault();

      startX = pos.x;
      startY = pos.y;

      onDown(ev, {x: startX, y: startY});
      dragging = true;

      boundUp = Utils.$bind(window, 'mouseup', _onMouseUp, false);
      boundMove = Utils.$bind(window, 'mousemove', _onMouseMove, false);
    }

    function _onMouseMove(ev, pos, touchDevice) {
      ev.preventDefault();

      if ( dragging ) {
        currentX = pos.x;
        currentY = pos.y;

        var diffX = currentX - startX;
        var diffY = currentY - startY;

        onMove(ev, {x: diffX, y: diffY}, {x: currentX, y: currentY});
      }
    }

    function _onMouseUp(ev, pos, touchDevice) {
      onUp(ev, {x: currentX, y: currentY});
      dragging = false;

      boundUp = Utils.$unbind(boundUp);
      boundMove = Utils.$unbind(boundMove);
    }

    Utils.$bind(el, 'mousedown', _onMouseDown, false);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Helpers = {
    getProperty: getProperty,
    getValueLabel: getValueLabel,
    getViewNodeValue: getViewNodeValue,
    getLabel: getLabel,
    getIcon: getIcon,
    getWindowId: getWindowId,
    createInputLabel: createInputLabel,
    createElement: createElement,
    createDrag: createDrag,
    setProperty: setProperty,
    setFlexbox: setFlexbox
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS);
