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

/**
 * Get element by ID
 *
 * @param   {String}    id      DOM Element ID
 *
 * @return  {Node}        Found element or null
 */
export function $(id) {
  return document.getElementById(id);
}

/**
 * Remove unwanted characters from ID or className
 *
 * @param   {String}    str     The name
 *
 * @return  {String}            The new name
 */
export function $safeName(str) {
  return (str || '').replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Remove given element from parent
 *
 * @param   {Node}    node      The DOM Element
 */
export function $remove(node) {
  if ( node ) {
    if ( typeof node.remove === 'function' ) {
      node.remove();
    } else if ( node.parentNode ) {
      node.parentNode.removeChild(node);
    }
  }
}

/**
 * Empty this element (remove children)
 *
 * @param   {Node}             myNode                 The DOM Element
 */
export function $empty(myNode) {
  if ( myNode ) {
    while ( myNode.firstChild ) {
      myNode.removeChild(myNode.firstChild);
    }
  }
}

/**
 * Get CSS style attribute
 *
 * @param   {Node}          oElm          The DOM Element
 * @param   {String}        strCssRule    The CSS rule to get
 *
 * @return  {String}                      Style attribute
 */
export function $getStyle(oElm, strCssRule) {
  let strValue = '';
  if ( document.defaultView && document.defaultView.getComputedStyle ) {
    strValue = document.defaultView.getComputedStyle(oElm, '').getPropertyValue(strCssRule);
  } else if ( oElm.currentStyle ) {
    strCssRule = strCssRule.replace(/\-(\w)/g, (strMatch, p1) => {
      return p1.toUpperCase();
    });
    strValue = oElm.currentStyle[strCssRule];
  }
  return strValue;
}

/**
 * Get element absolute position
 *
 * Modern browsers will return getBoundingClientRect()
 * See DOM documentation
 *
 * @param   {Node}      el          The Element to find position of
 * @param   {Node}      [parentEl]  Parent to end loop in
 *
 * @return  {Object}                    The bounding box
 */
export function $position(el, parentEl) {
  if ( el ) {
    if ( parentEl ) {
      const result = {left: 0, top: 0, width: el.offsetWidth, height: el.offsetHeight};
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
}

/**
 * Traverses down to the parentnode validated by filter
 *
 * @param   {Node}            el        The Element to find position of
 * @param   {Function}        cb        The callback function => fn(node) return true/false here
 *
 * @return  {Node}            el        The DOM element
 */
export function $parent(el, cb) {
  let result = null;

  if ( el && cb ) {
    let current = el;
    while ( current.parentNode ) {
      if ( cb(current) ) {
        result = current;
        break;
      }
      current = current.parentNode;
    }
  }

  return result;
}

/**
 * Get the index of an element within a node
 *
 * @param   {Node}      el          The Element to check
 * @param   {Node}      [parentEl]  Parent to end loop in
 *
 * @return  {Number}              The index
 */
export function $index(el, parentEl) {
  if ( el ) {
    parentEl = parentEl || el.parentNode;
    if ( parentEl ) {
      const nodeList = Array.prototype.slice.call(parentEl.children);
      const nodeIndex = nodeList.indexOf(el, parentEl);
      return nodeIndex;
    }
  }
  return -1;
}

/**
 * Selects range in a text field
 *
 * @param     {Node}      field     The DOM Element
 * @param     {Number}    start     Start position
 * @param     {Number}    end       End position
 */
export function $selectRange(field, start, end) {
  if ( !field ) {
    throw new Error('Cannot select range: missing element');
  }

  if ( typeof start === 'undefined' || typeof end === 'undefined' ) {
    throw new Error('Cannot select range: mising start/end');
  }

  if ( field.createTextRange ) {
    const selRange = field.createTextRange();
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
}

/**
 * Add a className to a DOM Element
 *
 * @param   {Node}      el      The dom Element
 * @param   {String}    name    The class name
 */
export function $addClass(el, name) {
  if ( el ) {
    name.split(' ').forEach((n) => {
      el.classList.add(n);
    });
  }
}

/**
 * Remove a className from a DOM Element
 *
 * @param   {Node}      el      The dom Element
 * @param   {String}    name    The class name
 */
export function $removeClass(el, name) {
  if ( el ) {
    name.split(' ').forEach((n) => {
      el.classList.remove(n);
    });
  }
}

/**
 * Check if a DOM Element has given className
 *
 * @param   {Node}      el      The dom Element
 * @param   {String}    name    The class name
 *
 * @return {Boolean}
 */
export function $hasClass(el, name) {
  if ( el && name ) {
    return name.split(' ').every((n) => {
      return el.classList.contains(n);
    });
  }
  return false;
}

/**
 * Escapes the given string for HTML
 *
 * works sort of like PHPs htmlspecialchars()
 *
 * @param   {String}    str       Input
 *
 * @return  {String}              Escaped HTML
 */
export function $escape(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Creates a new DOM element
 *
 * @example
 * $create('div', {
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
 * @param   {String}    tagName     Tag Name
 * @param   {Object}    properties  Tag Properties
 *
 * @return  {Node}
 */
export function $create(tagName, properties) {
  const element = document.createElement(tagName);

  function _foreach(dict, l) {
    dict = dict || {};
    Object.keys(dict).forEach((name) => {
      l(name.replace(/_/g, '-'), String(dict[name]));
    });
  }

  _foreach(properties.style, (key, val) => {
    element.style[key] = val;
  });

  _foreach(properties.aria, (key, val) => {
    if ( (['role']).indexOf(key) !== -1 ) {
      key = 'aria-' + key;
    }
    element.setAttribute(key, val);
  });

  _foreach(properties.data, (key, val) => {
    element.setAttribute('data-' + key, val);
  });

  _foreach(properties, (key, val) => {
    if ( (['style', 'aria', 'data']).indexOf(key) === -1 ) {
      element[key] = val;
    }
  });

  return element;
}

/**
 * Create a link stylesheet tag
 *
 * @param   {String}      src           The URL of resource
 * @param   {Function}    onload        onload callback
 * @param   {Function}    onerror       onerror callback
 *
 * @return  {Node}                The tag
 */
export function $createCSS(src, onload, onerror) {
  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('type', 'text/css');
  link.onload = onload || function() {};
  link.onerror = onerror || function() {};
  link.setAttribute('href', src);

  document.getElementsByTagName('head')[0].appendChild(link);

  return link;
}

/**
 * Create a script tag
 *
 * @param   {String}      src                   The URL of resource
 * @param   {Function}    onreadystatechange    readystatechange callback
 * @param   {Function}    onload                onload callback
 * @param   {Function}    onerror               onerror callback
 * @param   {Object}      [attrs]               dict with optional arguments
 *
 * @return  {Node}                              The tag
 */
export function $createJS(src, onreadystatechange, onload, onerror, attrs) {
  const res = document.createElement('script');

  res.onreadystatechange = onreadystatechange || function() {};
  res.onerror = onerror || function() {};
  res.onload = onload || function() {};

  attrs = Object.assign({}, {
    type: 'text/javascript',
    charset: 'utf-8',
    src: src
  }, attrs || {});

  Object.keys(attrs).forEach((k) => {
    res[k] = String(attrs[k]);
  });

  document.getElementsByTagName('head')[0].appendChild(res);

  return res;
}

/**
 * Check if event happened on a form element
 *
 * @param   {Event|Element}   input     DOM Event or Element
 * @param   {Array}           [types]   Optional Array of types
 *
 * @return  {Boolean}             If is a form element
 */
export function $isFormElement(input, types) {
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
}

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
 * $css(element, {
 *  backgroundColor: '#000',
 *  'font-size': '14px' // You can also use CSS attributes like normal
 * });
 *
 * @example
 * $css(element, 'font-family', 'Arial');
 *
 * @example
 * $css(element, 'font-family'); // -> 'Arial'. Same as $getStyle
 */
export function $css(el, ink, inv) {
  function rep(k) {
    return k.replace(/\-(\w)/g, (strMatch, p1) => {
      return p1.toUpperCase();
    });
  }

  let obj = {};
  if ( arguments.length === 2 ) {
    if ( typeof ink === 'string' ) {
      return el.parentNode ? $getStyle(el, ink) : el.style[rep(ink)];
    }
    obj = ink;
  } else if ( arguments.length === 3 ) {
    obj[ink] = inv;
  }

  Object.keys(obj).forEach((k) => {
    el.style[rep(k)] = String(obj[k]);
  });

  return null;
}

/**
 * Gets the Xpath to a DOM Element
 *
 * @param {Node} el DOM Element
 * @return {String}
 */
export function $path(el) {
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

    let ix = 0;

    const siblings = e.parentNode ? e.parentNode.childNodes : [];
    for ( let i = 0; i < siblings.length; i++ ) {
      const sibling = siblings[i];
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
}

/**
 * Gets a DOM Element from Xpath
 *
 * @param {String} path The path
 * @param {HTMLDocument} [doc] The document to resolve in
 * @return {Node}
 */
export function $fromPath(path, doc) {
  doc = doc || document;

  const evaluator = new XPathEvaluator();
  const result = evaluator.evaluate(path, doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return result.singleNodeValue;
}
