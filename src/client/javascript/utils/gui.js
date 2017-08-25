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
import * as Compability from 'utils/compability';
import PackageManager from 'core/package-manager';
import Theme from 'core/theme';
import GUIElement from 'gui/element';

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

/**
 * Gets window id from upper parent element
 *
 * @param   {Node}      el      Child element (can be anything)
 *
 * @return  {Number}
 */
export function getWindowId(el) {
  while ( el.parentNode ) {
    const attr = el.getAttribute('data-window-id');
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
 * @param   {Node}      el      The element
 *
 * @return  {String}
 */
export function getLabel(el) {
  const label = el.getAttribute('data-label');
  return label || '';
}

/**
 * Gets "label" from a node (Where it can be innerHTML and parameter)
 *
 * @param   {Node}      el              The element
 * @param   {Boolean}   [attr=false]    Get from attribute istead of node text
 *
 * @return  {String}
 */
export function getValueLabel(el, attr) {
  let label = attr ? el.getAttribute('data-label') : null;

  if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
    label = el.childNodes[0].nodeValue;
    DOM.$empty(el);
  }

  return label || '';
}

/**
 * Gets "value" from a node
 *
 * @param   {Node}      el       The element
 *
 * @return  {String}
 */
export function getViewNodeValue(el) {
  let value = el.getAttribute('data-value');
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
 * @param   {Node}      el      Element
 * @param   {Window}    [win]   Window Reference
 *
 * @return  {String}
 */
export function getIcon(el, win) {
  let image = el.getAttribute('data-icon');
  if ( image ) {
    return win ? PackageManager.getPackageResource(win._app, image) : image;
  }

  image = el.getAttribute('data-stock-icon');

  if ( image && image !== 'undefined') {
    let size  = '16x16';
    try {
      let spl = image.split('/');
      let tmp = spl.shift();
      let siz = tmp.match(/^\d+x\d+/);
      if ( siz ) {
        size = siz[0];
        image = spl.join('/');
      }

      image = Theme.getIcon(image, size);
    } catch ( e ) {}

    return image;
  }

  return null;
}

/**
 * Wrapper for getting custom dom element property value
 *
 * @param   {Node}     el          Element
 * @param   {String}   param       Parameter name
 * @param   {String}   [tagName]   What tagname is in use? Automatic
 *
 * @return  {Object|String}
 */
export function getProperty(el, param, tagName) {
  tagName = tagName || el.tagName.toLowerCase();
  const isDataView = tagName.match(/^gui\-(tree|icon|list|file)\-view$/);

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
    return GUIElement.createFromNode(el).values();
  }

  return el.getAttribute('data-' + param);
}

/**
 * Creates a label for given input element
 *
 * @param   {Node}            el        Element root
 * @param   {String}          type      Input element type
 * @param   {Node}            input     The input element
 * @param   {String}          [label]   Used when updating
 */
export function createInputLabel(el, type, input, label) {
  label = label || getLabel(el);

  if ( label ) {
    const lbl = document.createElement('label');
    const span = document.createElement('span');
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
 * Wrapper for setting custom dom element property value
 *
 * @param   {Node}            el            Element
 * @param   {String}          param         Parameter name
 * @param   {String}          value         Parameter value
 * @param   {String}          [tagName]     What tagname is in use? Automatic
 */
export function setProperty(el, param, value, tagName) {
  tagName = tagName || el.tagName.toLowerCase();

  function _setKnownAttribute(i, k, v, a) {
    if ( v ) {
      i.setAttribute(k, k);
    } else {
      i.removeAttribute(k);
    }

    if ( a ) {
      el.setAttribute('aria-' + k, String(value === true));
    }
  }

  function _setValueAttribute(i, k, v) {
    if ( typeof v === 'object' ) {
      try {
        v = JSON.stringify(value);
      } catch ( e ) {}
    }

    i.setAttribute(k, String(v));
  }

  // Generics for input elements
  const inner = el.children[0];

  let accept = ['gui-slider', 'gui-text', 'gui-password', 'gui-textarea', 'gui-checkbox', 'gui-radio', 'gui-select', 'gui-select-list', 'gui-button'];

  (function() {
    let firstChild;

    const params = {
      readonly: function() {
        _setKnownAttribute(firstChild, 'readonly', value, true);
      },

      disabled: function() {
        _setKnownAttribute(firstChild, 'disabled', value, true);
      },

      value: function() {
        if ( tagName === 'gui-radio' || tagName === 'gui-checkbox' ) {
          _setKnownAttribute(firstChild, 'checked', value);

          firstChild.checked = !!value;
        }
        firstChild.value = value;
      },

      label: function() {
        el.appendChild(firstChild);
        DOM.$remove(el.querySelector('label'));
        createInputLabel(el, tagName.replace(/^gui\-/, ''), firstChild, value);
      }
    };

    if ( accept.indexOf(tagName) >= 0 ) {
      firstChild = el.querySelector('textarea, input, select, button');

      if ( firstChild ) {
        if ( params[param] ) {
          params[param]();
        } else {
          _setValueAttribute(firstChild, param, value || '');
        }
      }
    }
  })();

  // Other types of elements
  accept = ['gui-image', 'gui-audio', 'gui-video'];
  if ( (['src', 'controls', 'autoplay', 'alt']).indexOf(param) >= 0 && accept.indexOf(tagName) >= 0 ) {
    inner[param] = value;
  }

  // Normal DOM attributes
  if ( (['_id', '_class', '_style']).indexOf(param) >= 0 ) {
    inner.setAttribute(param.replace(/^_/, ''), value);
    return;
  }

  // Set the actual root element property value
  if ( param !== 'value' ) {
    _setValueAttribute(el, 'data-' + param, value);
  }
}

/**
 * Create a new custom DOM element
 *
 * @param   {String}      tagName           Tag Name
 * @param   {Object}      params            Dict with data-* properties
 * @param   {Array}       [ignoreParams]    List of arguments to ignore
 *
 * @return {Node}
 */
export function createElement(tagName, params, ignoreParams) {
  ignoreParams = ignoreParams || [];

  const el = document.createElement(tagName);

  const classMap = {
    textalign: function(v) {
      DOM.$addClass(el, 'gui-align-' + v);
    },
    className: function(v) {
      DOM.$addClass(el, v);
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

      const value = params[k];
      if ( typeof value !== 'undefined' && typeof value !== 'function' ) {
        if ( classMap[k] ) {
          classMap[k](value);
          return;
        }

        const fvalue = getValue(k, value);
        el.setAttribute('data-' + k, fvalue);
      }
    });
  }

  return el;
}

/**
 * Sets the flexbox CSS style properties for given container
 *
 * @param   {Node}            el              The container
 * @param   {Number}          grow            Grow factor
 * @param   {Number}          shrink          Shrink factor
 * @param   {String}          [basis=auto]    Basis
 * @param   {Node}            [checkel]       Take defaults from this node
 */
export function setFlexbox(el, grow, shrink, basis, checkel) {
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

  const flex = [grow, shrink];
  if ( basis.length ) {
    flex.push(basis);
  }

  const style = flex.join(' ');
  el.style.webkitBoxFlex = style;
  el.style.mozBoxFlex = style;
  el.style.webkitFlex = style;
  el.style.mozFlex = style;
  el.style.msFlex = style;
  el.style.oFlex = style;
  el.style.flex = style;

  const align = el.getAttribute('data-align');
  DOM.$removeClass(el, 'gui-flex-align-start');
  DOM.$removeClass(el, 'gui-flex-align-end');
  if ( align ) {
    DOM.$addClass(el, 'gui-flex-align-' + align);
  }
}

/**
 * Wrapper for creating a draggable container
 *
 * @param   {Node}              el          The container
 * @param   {Function}          onDown      On down action callback
 * @param   {Function}          onMove      On move action callback
 * @param   {Function}          onUp        On up action callback
 */
export function createDrag(el, onDown, onMove, onUp) {
  onDown = onDown || function() {};
  onMove = onMove || function() {};
  onUp = onUp || function() {};

  let startX, startY, currentX, currentY;
  let dragging = false;

  function _onMouseMove(ev, pos, touchDevice) {
    ev.preventDefault();

    if ( dragging ) {
      currentX = pos.x;
      currentY = pos.y;

      const diffX = currentX - startX;
      const diffY = currentY - startY;

      onMove(ev, {x: diffX, y: diffY}, {x: currentX, y: currentY});
    }
  }

  function _onMouseUp(ev, pos, touchDevice) {
    onUp(ev, {x: currentX, y: currentY});
    dragging = false;

    Events.$unbind(window, 'pointerup:guidrag');
    Events.$unbind(window, 'pointermove:guidrag');
  }

  function _onMouseDown(ev, pos, touchDevice) {
    ev.preventDefault();

    startX = pos.x;
    startY = pos.y;

    onDown(ev, {x: startX, y: startY});
    dragging = true;

    Events.$bind(window, 'pointerup:guidrag', _onMouseUp, false);
    Events.$bind(window, 'pointermove:guidrag', _onMouseMove, false);
  }

  Events.$bind(el, 'pointerdown', _onMouseDown, false);
}

/**
 * Method for getting the next (or previous) element in sequence
 *
 * If you don't supply a current element, the first one will be taken!
 *
 * @param   {Boolean}     prev        Get previous element instead of next
 * @param   {Node}        current     The current element
 * @param   {Node}        root        The root container
 *
 * @return {Node}
 */
export function getNextElement(prev, current, root) {
  function getElements() {
    const ignore_roles = ['menu', 'menuitem', 'grid', 'gridcell', 'listitem'];
    const list = [];

    root.querySelectorAll('.gui-element').forEach(function(e) {
      // Ignore focused and disabled elements, and certain aria roles
      if ( DOM.$hasClass(e, 'gui-focus-element') || ignore_roles.indexOf(e.getAttribute('role')) >= 0 || e.getAttribute('data-disabled') === 'true' ) {
        return;
      }

      // Elements without offsetParent are invisible
      if ( e.offsetParent ) {
        list.push(e);
      }
    });
    return list;
  }

  function getCurrentIndex(els, m) {
    let found = -1;

    // Simply get index from array, it seems indexOf is a bit iffy here ?!
    if ( m ) {
      els.every(function(e, idx) {
        if ( e === m ) {
          found = idx;
        }
        return found === -1;
      });
    }

    return found;
  }

  function getCurrentParent(els, m) {
    if ( m ) {
      let cur = m;
      while ( cur.parentNode ) {
        if ( DOM.$hasClass(cur, 'gui-element') ) {
          return cur;
        }
        cur = cur.parentNode;
      }

      return null;
    }

    // When we dont have a initial element, take the first one
    return els[0];
  }

  function getNextIndex(els, p, i) {
    // This could probably be prettier, but it does the job
    if ( prev ) {
      i = (i <= 0) ? (els.length) - 1 : (i - 1);
    } else {
      i = (i >= (els.length - 1)) ? 0 : (i + 1);
    }
    return i;
  }

  function getNext(els, i) {
    let next = els[i];

    // Get "real" elements from input wrappers
    if ( next.tagName.match(/^GUI\-(BUTTON|TEXT|PASSWORD|SWITCH|CHECKBOX|RADIO|SELECT)/) ) {
      next = next.querySelectorAll('input, textarea, button, select')[0];
    }

    // Special case for elements that wraps
    if ( next.tagName === 'GUI-FILE-VIEW' ) {
      next = next.children[0];
    }

    return next;
  }

  if ( root ) {
    const elements = getElements();
    if ( elements.length ) {
      const currentParent = getCurrentParent(elements, current);
      const currentIndex = getCurrentIndex(elements, currentParent);

      if ( currentIndex >= 0 ) {
        const nextIndex = getNextIndex(elements, currentParent, currentIndex);
        return getNext(elements, nextIndex);
      }
    }
  }

  return null;
}

/**
 * Create a draggable DOM element
 *
 * @param  {Node}          el                               DOMElement
 * @param  {Object}        args                             JSON of draggable params
 * @param  {Object}        args.data                        The data (JSON by default)
 * @param  {String}        [args.type]                      A custom drag event 'type'
 * @param  {String}        [args.effect=move]               The draggable effect (cursor)
 * @param  {String}        [args.mime=application/json]     The mime type of content
 * @param  {Function}      args.onStart                     Callback when drag started => fn(ev, el, args)
 * @param  {Function}      args.onEnd                       Callback when drag ended => fn(ev, el, args)
 */
export function createDraggable(el, args) {
  /* eslint no-invalid-this: "off" */

  args = Object.assign({}, {
    type: null,
    effect: 'move',
    data: null,
    mime: 'application/json',
    dragImage: null,
    onStart: function() {
      return true;
    },
    onEnd: function() {
      return true;
    }
  }, args);

  if ( Compability.isIE() ) {
    args.mime = 'text';
  }

  function _toString(mime) {
    return JSON.stringify({
      type: args.type,
      effect: args.effect,
      data: args.data,
      mime: args.mime
    });
  }

  function _dragStart(ev) {
    try {
      ev.dataTransfer.effectAllowed = args.effect;
      if ( args.dragImage && (typeof args.dragImage === 'function') ) {
        if ( ev.dataTransfer.setDragImage ) {
          const dragImage = args.dragImage(ev, el);
          if ( dragImage ) {
            const dragEl = dragImage.element;
            const dragPos = dragImage.offset;

            document.body.appendChild(dragEl);
            ev.dataTransfer.setDragImage(dragEl, dragPos.x, dragPos.y);
          }
        }
      }
      ev.dataTransfer.setData(args.mime, _toString(args.mime));
    } catch ( e ) {
      console.warn('Failed to dragstart: ' + e);
      console.warn(e.stack);
    }
  }

  el.setAttribute('draggable', 'true');
  el.setAttribute('aria-grabbed', 'false');

  Events.$bind(el, 'dragstart', function(ev) {
    this.setAttribute('aria-grabbed', 'true');

    this.style.opacity = '0.4';
    if ( ev.dataTransfer ) {
      _dragStart(ev);
    }
    return args.onStart(ev, this, args);
  }, false);

  Events.$bind(el, 'dragend', function(ev) {
    this.setAttribute('aria-grabbed', 'false');
    this.style.opacity = '1.0';
    return args.onEnd(ev, this, args);
  }, false);
}

/**
 * Create a droppable DOM element
 *
 * @param   {Node}            el                              DOMElement
 * @param   {Object}          args                            JSON of droppable params
 * @param   {String}          [args.accept]                   Accept given drag event 'type'
 * @param   {String}          [args.effect=move]              The draggable effect (cursor)
 * @param   {String}          [args.mime=application/json]    The mime type of content
 * @param   {Boolean}         [args.files=true]               Support file drops from OS
 * @param   {Function}        args.onEnter                    Callback when drag entered => fn(ev, el)
 * @param   {Function}        args.onOver                     Callback when drag over => fn(ev, el)
 * @param   {Function}        args.onLeave                    Callback when drag leave => fn(ev, el)
 * @param   {Function}        args.onDrop                     Callback when drag drop all => fn(ev, el)
 * @param   {Function}        args.onFilesDropped             Callback when drag drop file => fn(ev, el, files, args)
 * @param   {Function}        args.onItemDropped              Callback when drag drop internal object => fn(ev, el, item, args)
 */
export function createDroppable(el, args) {
  /* eslint no-invalid-this: "off" */

  args = Object.assign({}, {
    accept: null,
    effect: 'move',
    mime: 'application/json',
    files: true,
    onFilesDropped: function() {
      return true;
    },
    onItemDropped: function() {
      return true;
    },
    onEnter: function() {
      return true;
    },
    onOver: function() {
      return true;
    },
    onLeave: function() {
      return true;
    },
    onDrop: function() {
      return true;
    }
  }, args);

  if ( Compability.isIE() ) {
    args.mime = 'text';
  }

  function getParent(start, matcher) {
    if ( start === matcher ) {
      return true;
    }

    let i = 10;

    while ( start && i > 0 ) {
      if ( start === matcher ) {
        return true;
      }
      start = start.parentNode;
      i--;
    }
    return false;
  }

  function _doDrop(ev, el) {
    if ( !ev.dataTransfer ) {
      return true;
    }

    if ( args.files ) {
      const files = ev.dataTransfer.files;
      if ( files && files.length ) {
        return args.onFilesDropped(ev, el, files, args);
      }
    }

    try {
      const data = ev.dataTransfer.getData(args.mime);
      const item = JSON.parse(data);
      if ( args.accept === null || args.accept === item.type ) {
        return args.onItemDropped(ev, el, item, args);
      }
    } catch ( e ) {
      console.warn('Failed to drop: ' + e);
    }

    return false;
  }

  function _onDrop(ev, el) {
    ev.stopPropagation();
    ev.preventDefault();

    const result = _doDrop(ev, el);
    args.onDrop(ev, el);
    return result;
  }

  el.setAttribute('aria-dropeffect', args.effect);

  Events.$bind(el, 'drop', function(ev) {
    //DOM.$removeClass(el, 'onDragEnter');
    return _onDrop(ev, this);
  }, false);

  Events.$bind(el, 'dragenter', function(ev) {
    //DOM.$addClass(el, 'onDragEnter');
    return args.onEnter.call(this, ev, this, args);
  }, false);

  Events.$bind(el, 'dragover', function(ev) {
    ev.preventDefault();
    if ( !getParent(ev.target, el) ) {
      return false;
    }

    ev.stopPropagation();
    ev.dataTransfer.dropEffect = args.effect;
    return args.onOver.call(this, ev, this, args);
  }, false);

  Events.$bind(el, 'dragleave', function(ev) {
    //DOM.$removeClass(el, 'onDragEnter');
    return args.onLeave.call(this, ev, this, args);
  }, false);
}
