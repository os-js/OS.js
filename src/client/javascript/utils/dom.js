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
(function() {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // DOM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get element by ID
   *
   * @function $
   * @memberof OSjs.Utils
   *
   * @param   {String}    id      DOM Element ID
   *
   * @return  {Node}        Found element or null
   */
  OSjs.Utils.$ = function(id) {
    return document.getElementById(id);
  };

  /**
   * Remove unwanted characters from ID or className
   *
   * @function $safeName
   * @memberof OSjs.Utils
   *
   * @param   {String}    str     The name
   *
   * @return  {String}            The new name
   */
  OSjs.Utils.$safeName = function(str) {
    return (str || '').replace(/[^a-zA-Z0-9]/g, '_');
  };

  /**
   * Remove given element from parent
   *
   * @function $remove
   * @memberof OSjs.Utils
   *
   * @param   {Node}    node      The DOM Element
   */
  OSjs.Utils.$remove = function(node) {
    if ( node && node.parentNode ) {
      node.parentNode.removeChild(node);
    }
    return null;
  };

  /**
   * Empty this element (remove children)
   *
   * @function $empty
   * @memberof OSjs.Utils
   *
   * @param   {Node}    myNode      The DOM Element
   */
  OSjs.Utils.$empty = function(myNode) {
    if ( myNode ) {
      while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
      }
    }
  };

  /**
   * Get CSS style attribute
   *
   * @function $getStyle
   * @memberof OSjs.Utils
   *
   * @param   {Node}          oElm          The DOM Element
   * @param   {String}        strCssRule    The CSS rule to get
   *
   * @return  {String}                      Style attribute
   */
  OSjs.Utils.$getStyle = function(oElm, strCssRule) {
    var strValue = '';
    if ( document.defaultView && document.defaultView.getComputedStyle ) {
      strValue = document.defaultView.getComputedStyle(oElm, '').getPropertyValue(strCssRule);
    } else if ( oElm.currentStyle ) {
      strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1) {
        return p1.toUpperCase();
      });
      strValue = oElm.currentStyle[strCssRule];
    }
    return strValue;
  };

  /**
   * Get element absolute position
   *
   * Modern browsers will return getBoundingClientRect()
   * See DOM documentation
   *
   * @function $position
   * @memberof OSjs.Utils
   *
   * @param   {Node}      el          The Element to find position of
   * @param   {Node}      [parentEl]  Parent to end loop in
   *
   * @return  {Object}                    The bounding box
   */
  OSjs.Utils.$position = function(el, parentEl) {
    if ( el ) {
      if ( parentEl ) {
        var result = {left:0, top:0, width: el.offsetWidth, height: el.offsetHeight};
        while ( true ) {
          result.left += el.offsetLeft;
          result.top  += el.offsetTop;
          if ( el.offsetParent ===  parentEl || el.offsetParent === null ) {
            break;
          }
          el = el.offsetParent;
        }
        return result;
      }
      return el.getBoundingClientRect();
    }
    return null;
  };

  /**
   * Traverses down to the parentnode validated by filter
   *
   * @function $parent
   * @memberof OSjs.Utils
   *
   * @param   {Node}            el        The Element to find position of
   * @param   {Function}        cb        The callback function => fn(node) return true/false here
   *
   * @return  {Node}            el        The DOM element
   */
  OSjs.Utils.$parent = function(el, cb) {
    var result = null;

    if ( el && cb ) {
      var current = el;
      while ( current.parentNode ) {
        if ( cb(current) ) {
          result = current;
          break;
        }
        current = current.parentNode;
      }
    }

    return result;
  };

  /**
   * Get the index of an element within a node
   *
   * @function $index
   * @memberof OSjs.Utils
   *
   * @param   {Node}      el          The Element to check
   * @param   {Node}      [parentEl]  Parent to end loop in
   *
   * @return  {Number}              The index
   */
  OSjs.Utils.$index = function(el, parentEl) {
    if ( el ) {
      parentEl = parentEl || el.parentNode;
      if ( parentEl ) {
        var nodeList = Array.prototype.slice.call(parentEl.children);
        var nodeIndex = nodeList.indexOf(el, parentEl);
        return nodeIndex;
      }
    }
    return -1;
  };

  /**
   * Selects range in a text field
   *
   * @function $selectRange
   * @memberof OSjs.Utils
   *
   * @param     {Node}      field     The DOM Element
   * @param     {Number}    start     Start position
   * @param     {Number}    end       End position
   */
  OSjs.Utils.$selectRange = function(field, start, end) {
    if ( !field ) {
      throw new Error('Cannot select range: missing element');
    }

    if ( typeof start === 'undefined' || typeof end === 'undefined' ) {
      throw new Error('Cannot select range: mising start/end');
    }

    if ( field.createTextRange ) {
      var selRange = field.createTextRange();
      selRange.collapse(true);
      selRange.moveStart('character', start);
      selRange.moveEnd('character', end);
      selRange.select();
      field.focus();
    } else if ( field.setSelectionRange ) {
      field.focus();
      field.setSelectionRange(start, end);
    } else if ( typeof field.selectionStart !== 'undefined' ) {
      field.selectionStart = start;
      field.selectionEnd = end;
      field.focus();
    }
  };

  /**
   * Add a className to a DOM Element
   *
   * @function $addClass
   * @memberof OSjs.Utils
   *
   * @param   {Node}      el      The dom Element
   * @param   {String}    name    The class name
   */
  OSjs.Utils.$addClass = function(el, name) {
    if ( el ) {
      name.split(' ').forEach(function(n) {
        el.classList.add(n);
      });
    }
  };

  /**
   * Remove a className from a DOM Element
   *
   * @function $removeClass
   * @memberof OSjs.Utils
   *
   * @param   {Node}      el      The dom Element
   * @param   {String}    name    The class name
   */
  OSjs.Utils.$removeClass = function(el, name) {
    if ( el ) {
      name.split(' ').forEach(function(n) {
        el.classList.remove(n);
      });
    }
  };

  /**
   * Check if a DOM Element has given className
   *
   * @function $hasClass
   * @memberof OSjs.Utils
   *
   * @param   {Node}      el      The dom Element
   * @param   {String}    name    The class name
   */
  OSjs.Utils.$hasClass = function(el, name) {
    if ( el && name ) {
      return name.split(' ').every(function(n) {
        return el.classList.contains(n);
      });
    }
    return false;
  };

  /**
   * Escapes the given string for HTML
   *
   * works sort of like PHPs htmlspecialchars()
   *
   * @function $escape
   * @memberof OSjs.Utils
   *
   * @param   {String}    str       Input
   *
   * @return  {String}              Escaped HTML
   */
  OSjs.Utils.$escape = function(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };

  /**
   * Create a link stylesheet tag
   *
   * @function $createCSS
   * @memberof OSjs.Utils
   *
   * @param   {String}      src           The URL of resource
   * @param   {Function}    onload        onload callback
   * @param   {Function}    onerror       onerror callback
   *
   * @return  {Node}                The tag
   */
  OSjs.Utils.$createCSS = function(src, onload, onerror) {
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.onload = onload || function() {};
    link.onerror = onerror || function() {};
    link.setAttribute('href', src);

    document.getElementsByTagName('head')[0].appendChild(link);

    return link;
  };

  /**
   * Create a script tag
   *
   * @function $createJS
   * @memberof OSjs.Utils
   *
   * @param   {String}      src                   The URL of resource
   * @param   {Function}    onreadystatechange    readystatechange callback
   * @param   {Function}    onload                onload callback
   * @param   {Function}    onerror               onerror callback
   * @param   {Object}      [attrs]               dict with optional arguments
   *
   * @return  {Node}                              The tag
   */
  OSjs.Utils.$createJS = function(src, onreadystatechange, onload, onerror, attrs) {
    var res = document.createElement('script');

    res.onreadystatechange = onreadystatechange || function() {};
    res.onerror = onerror || function() {};
    res.onload = onload || function() {};

    attrs = OSjs.Utils.mergeObject({
      type: 'text/javascript',
      charset: 'utf-8',
      src: src
    }, attrs || {});

    Object.keys(attrs).forEach(function(k) {
      res[k] = String(attrs[k]);
    });

    document.getElementsByTagName('head')[0].appendChild(res);

    return res;
  };

  /**
   * Check if event happened on a form element
   *
   * @function $isFormElement
   * @memberof OSjs.Utils
   *
   * @param   {Event}       ev      DOM Event
   * @param   {Array}       types   Array of types
   *
   * @return  {Boolean}             If is a form element
   */
  OSjs.Utils.$isFormElement = function(ev, types) {
    types = types || ['TEXTAREA', 'INPUT', 'SELECT'];

    var d = ev.srcElement || ev.target;
    if ( d ) {
      if ( types.indexOf(d.tagName.toUpperCase()) >= 0 ) {
        if ( !(d.readOnly || d.disabled) ) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * @function $isInput
   * @memberof OSjs.Utils
   * @alias OSjs.Utils.isFormElement
   * @deprecated Please use aliased method instead
   */
  OSjs.Utils.$isInput = function(ev) {
    console.warn('Utils::$isInput is deprecated', 'Use Utils::$isFormElement instead');
    return this.$isFormElement(ev);
  };

  /**
   * Set or Get element CSS
   *
   * @param {Node}                  el      DOM Node
   * @param {(String|Object)}       ink     CSS attribute name to get/set, or full dict to set
   * @param {(String|Number)}       [inv]   If previous argument was a string, this is the value that will be set
   *
   * @return {String} CSS attribute value
   *
   * @example
   * Utils.$css(element, {
   *  backgroundColor: '#000',
   *  'font-size': '14px' // You can also use CSS attributes like normal
   * });
   *
   * @example
   * Utils.$css(element, 'font-family', 'Arial');
   *
   * @example
   * Utils.$css(element, 'font-family'); // -> 'Arial'. Same as $getStyle
   *
   * @function $css
   * @memberof OSjs.Utils
   */
  OSjs.Utils.$css = function(el, ink, inv) {
    function rep(k) {
      return k.replace(/\-(\w)/g, function(strMatch, p1) {
        return p1.toUpperCase();
      });
    }

    var obj = {};
    if ( arguments.length === 2 ) {
      if ( typeof ink === 'string' ) {
        return el.parentNode ? OSjs.Utils.$getStyle(el, ink) : el.style[rep(ink)];
      }
      obj = ink;
    } else if ( arguments.length === 3 ) {
      obj[ink] = inv;
    }

    Object.keys(obj).forEach(function(k) {
      el.style[rep(k)] = String(obj[k]);
    });
  };

})();
