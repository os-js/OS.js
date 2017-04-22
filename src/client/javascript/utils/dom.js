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
  OSjs.Utils.$ = function Utils_$(id) {
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
  OSjs.Utils.$safeName = function Utils_$safeName(str) {
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
  OSjs.Utils.$remove = function Utils_$remove(node) {
    if ( node && node.parentNode ) {
      node.parentNode.removeChild(node);
    }
  };

  /**
   * Empty this element (remove children)
   *
   * @function $empty
   * @memberof OSjs.Utils
   *
   * @param   {Node}             myNode                 The DOM Element
   * @param   {Boolean|String}   [removeEvents=false]   Force removal of event handlers (on given elements)
   */
  OSjs.Utils.$empty = function Utils_$empty(myNode, removeEvents) {
    if ( myNode ) {
      if ( removeEvents ) {
        removeEvents = typeof removeEvents === 'string' ? removeEvents : '*';
        myNode.querySelectorAll(removeEvents).forEach(function(el) {
          OSjs.Utils.$unbind(el);
        });
      }

      while ( myNode.firstChild ) {
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
  OSjs.Utils.$getStyle = function Utils_$getStyle(oElm, strCssRule) {
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
  OSjs.Utils.$position = function Utils_$position(el, parentEl) {
    if ( el ) {
      if ( parentEl ) {
        var result = {left: 0, top: 0, width: el.offsetWidth, height: el.offsetHeight};
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
  OSjs.Utils.$parent = function Utils_$parent(el, cb) {
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
  OSjs.Utils.$index = function Utils_$index(el, parentEl) {
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
  OSjs.Utils.$selectRange = function Utils_$selectRange(field, start, end) {
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
  OSjs.Utils.$addClass = function Utils_$addClass(el, name) {
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
  OSjs.Utils.$removeClass = function Utils_$removeClass(el, name) {
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
   *
   * @return {Boolean}
   */
  OSjs.Utils.$hasClass = function Utils_$hasClass(el, name) {
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
  OSjs.Utils.$escape = function Utils_$escape(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };

  /**
   * Creates a new DOM element
   *
   * @example
   * Utils.$create('div', {
   *  className: 'foo',
   *  style: {
   *    width: '200px'
   *  },
   *  data: {
   *    custom_attribute: 'bar'
   *  },
   *  aria: {
   *    role: 'button'
   *  },
   *  some_custom_attribute: 'baz'
   * })
   *
   * @function $create
   * @memberof OSjs.Utils
   *
   * @param   {String}    tagName     Tag Name
   * @param   {Object}    properties  Tag Properties
   *
   * @return  {Node}
   */
  OSjs.Utils.$create = function Utils_$create(tagName, properties) {
    var element = document.createElement(tagName);

    function _foreach(dict, l) {
      dict = dict || {};
      Object.keys(dict).forEach(function(name) {
        l(name.replace(/_/g, '-'), String(dict[name]));
      });
    }

    _foreach(properties.style, function(key, val) {
      element.style[key] = val;
    });

    _foreach(properties.aria, function(key, val) {
      if ( (['role']).indexOf(key) !== -1 ) {
        key = 'aria-' + key;
      }
      element.setAttribute(key, val);
    });

    _foreach(properties.data, function(key, val) {
      element.setAttribute('data-' + key, val);
    });

    _foreach(properties, function(key, val) {
      if ( (['style', 'aria', 'data']).indexOf(key) === -1 ) {
        element[key] = val;
      }
    });

    return element;
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
  OSjs.Utils.$createCSS = function Utils_$createCSS(src, onload, onerror) {
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
  OSjs.Utils.$createJS = function Utils_$createJS(src, onreadystatechange, onload, onerror, attrs) {
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
   * @param   {Event|Element}   input     DOM Event or Element
   * @param   {Array}           [types]   Optional Array of types
   *
   * @return  {Boolean}             If is a form element
   */
  OSjs.Utils.$isFormElement = function Utils_$isFormElement(input, types) {
    types = types || ['TEXTAREA', 'INPUT', 'SELECT'];

    if ( input instanceof window.Event ) {
      input = input.srcElement || input.target;
    }

    if ( input instanceof window.Element ) {
      if ( types.indexOf(input.tagName.toUpperCase()) >= 0 ) {
        if ( !(input.readOnly || input.disabled) ) {
          return true;
        }
      }
    }

    return false;
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
  OSjs.Utils.$css = function Utils_$css(el, ink, inv) {
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

  /**
   * Gets the Xpath to a DOM Element
   *
   * @param {Node} el DOM Element
   * @return {String}
   *
   * @function $path
   * @memberof OSjs.Utils
   */
  OSjs.Utils.$path = function Utils_$path(el) {
    function _path(e) {
      if ( e === document.body ) {
        return e.tagName;
      } else if ( e === window ) {
        return 'WINDOW';
      } else if ( e === document ) {
        return 'DOCUMENT';
      }

      if ( e.id !== '' ) {
        return 'id("' + e.id + '")';
      }

      var ix = 0;
      var siblings = e.parentNode ? e.parentNode.childNodes : [];

      for ( var i = 0; i < siblings.length; i++ ) {
        var sibling = siblings[i];
        if ( sibling === e ) {
          return _path(e.parentNode) + '/' + e.tagName + '[' + (ix + 1) + ']';
        }

        if ( sibling.nodeType === 1 && sibling.tagName === e.tagName ) {
          ix++;
        }
      }

      return null;
    }

    return _path(el);
  };

  /**
   * Gets a DOM Element from Xpath
   *
   * @param {String} path The path
   * @param {HTMLDocument} [doc] The document to resolve in
   * @return {Node}
   *
   * @function $fromPath
   * @memberof OSjs.Utils
   */
  OSjs.Utils.$fromPath = function Uitls_$fromPath(path, doc) {
    doc = doc || document;

    var evaluator = new XPathEvaluator();
    var result = evaluator.evaluate(path, doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
  };

})();
