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
import * as GUI from 'utils/gui';
import {_} from 'core/locales';
import PackageManager from 'core/package-manager';

let REGISTRY = {};

/*
 * Wrapper for getting which element to focus/blur
 */
function getFocusElement(inst) {
  const tagMap = {
    'gui-switch': 'button',
    'gui-list-view': 'textarea',
    'gui-tree-view': 'textarea',
    'gui-icon-view': 'textarea',
    'gui-input-modal': 'button'
  };

  if ( tagMap[inst.tagName] ) {
    return inst.$element.querySelector(tagMap[inst.tagName]);
  }
  return inst.$element.firstChild || inst.$element;
}

/*
 * Internal for parsing GUI elements
 */
function parseDynamic(node, win, args) {
  args = args || {};

  const translator = args._ || _;

  node.querySelectorAll('*[data-label]').forEach(function(el) {
    const label = translator(el.getAttribute('data-label'));
    el.setAttribute('data-label', label);
  });

  node.querySelectorAll('gui-label, gui-button, gui-list-view-column, gui-select-option, gui-select-list-option').forEach(function(el) {
    if ( !el.children.length && !el.getAttribute('data-no-translate') ) {
      const lbl = GUI.getValueLabel(el);
      el.appendChild(document.createTextNode(translator(lbl)));
    }
  });

  node.querySelectorAll('gui-button').forEach(function(el) {
    const label = GUI.getValueLabel(el);
    if ( label ) {
      el.appendChild(document.createTextNode(_(label)));
    }
  });

  node.querySelectorAll('*[data-icon], *[data-stock-icon]').forEach(function(el) {
    const image = GUI.getIcon(el, win);
    el.setAttribute('data-icon', image);
  });

  node.querySelectorAll('*[data-src],*[src]').forEach(function(el) {
    const isNative = el.hasAttribute('src');
    const src = isNative
      ? el.getAttribute('src')
      : el.getAttribute('data-src') || '';

    if ( win && win._app && !src.match(/^(https?:)?\//) ) {
      const source = PackageManager.getPackageResource(win._app, src);
      el.setAttribute(isNative ? 'src' : 'data-src', source);
    }
  });
}

/*
 * Wrapper for creating a new element instance
 */
function createElementInstance(tagName, el, q, buildArgs) {
  tagName = tagName || el.tagName.toLowerCase();

  let instance;
  if ( REGISTRY[tagName] ) {
    /*eslint new-cap: 0*/
    instance = new REGISTRY[tagName].component(el, q);
    if ( buildArgs ) {
      instance.build.apply(instance, buildArgs);
    }
  }

  return instance;
}

/////////////////////////////////////////////////////////////////////////////
// GUI ELEMENT CLASS
/////////////////////////////////////////////////////////////////////////////

/**
 * Base GUIElement Class
 *
 * @desc The Class used for all UI Elements.
 *
 * @link https://manual.os-js.org/packages/scheme/
 */
export default class GUIElement {

  /**
   * @param {Node}      el      DOM Node
   * @param {String}    [q]     Query that element came from
   */
  constructor(el, q) {

    /**
     * The DOM Node
     * @type {Node}
     */
    this.$element = el || null;

    /**
     * The DOM Tag Name
     * @type {String}
     */
    this.tagName = el ? el.tagName.toLowerCase() : null;

    this.oldDisplay = null;

    if ( !el ) {
      console.warn('GUIElement() was constructed without a DOM element', q);
    }
  }

  /**
   * Builds the DOM nodes etc
   *
   * @return {GUIElement} The current instance (this)
   */
  build() {
    return this;
  }

  /**
   * Removes element from the DOM
   *
   * @return {GUIElement} The current instance (this)
   */
  remove() {
    this.$element = DOM.$remove(this.$element);
    return this;
  }

  /**
   * Empties the DOM element
   *
   * @return {GUIElement} The current instance (this)
   */
  empty() {
    DOM.$empty(this.$element);
    return this;
  }

  /**
   * Blur (unfocus)
   *
   * @return {GUIElement} The current instance (this)
   */
  blur() {
    if ( this.$element ) {
      const firstChild = getFocusElement(this);
      if ( firstChild ) {
        firstChild.blur();
      }
    }
    return this;
  }

  /**
   * Focus (focus)
   *
   * @return {GUIElement} The current instance (this)
   */
  focus() {
    if ( this.$element ) {
      const firstChild = getFocusElement(this);
      if ( firstChild ) {
        firstChild.focus();
      }
    }
    return this;
  }

  /**
   * Show
   *
   * @return {GUIElement} The current instance (this)
   */
  show() {
    if ( this.$element && !this.$element.offsetParent ) {
      if ( this.$element ) {
        this.$element.style.display = this.oldDisplay || '';
      }
    }
    return this;
  }

  /**
   * Hide
   *
   * @return {GUIElement} The current instance (this)
   */
  hide() {
    if ( this.$element && this.$element.offsetParent ) {
      if ( !this.oldDisplay ) {
        this.oldDisplay = this.$element.style.display;
      }
      this.$element.style.display = 'none';
    }
    return this;
  }

  /**
   * Register Event
   *
   * @example
   * element.on('click', function() {});
   *
   * @param   {String}        evName      Event Name
   * @param   {CallbackEvent} callback    Callback function
   * @param   {Object}        [args]      Binding arguments
   *
   * @return {GUIElement} The current instance (this)
   */
  on(evName, callback, args) {
    return this;
  }

  /**
   * Register Event with scope
   *
   * <pre><code>
   * This is the same as on() except that you can proxy your callback.
   * Useful for binding UI events directly to a Window.
   * </code></pre>
   *
   * <b><code>
   * The callback produced from the event will the same as original, except
   * **the first parameter is always the GUI element**
   *
   * fn(obj, ev, pos, isTouch)
   * </code></b>
   *
   * @example
   * element.son('click', this, this.onClick);
   *
   * @example
   * MyWindow.prototype.onClick = function(obj, ev, pos, isTouch ) {
   *  // obj = 'element'
   * }
   *
   * @see GUIElement#on
   *
   * @param   {String}        evName      Event Name
   * @param   {Object}        thisArg     Which object instance to bind to
   * @param   {CallbackEvent} callback    Callback function
   * @param   {Object}        [args]      Binding arguments
   *
   * @return {GUIElement} The current instance (this)
   */
  son(evName, thisArg, callback, args) {
    return this.on(evName, function() {
      /* eslint no-invalid-this: "off" */
      const args = Array.prototype.slice.call(arguments);
      args.unshift(this);
      callback.apply(thisArg, args);
    }, args);
  }

  /**
   * Sets a parameter/property by name
   *
   * @param   {String}    param     Parameter name
   * @param   {*}         value     Parameter value
   * @param   {*}         [arg]     Extra argument ...
   * @param   {*}         [arg2]    Extra argument ...
   *
   * @return {GUIElement} The current instance (this)
   */
  set(param, value, arg, arg2) {
    if ( this.$element ) {
      GUI.setProperty(this.$element, param, value, arg, arg2);
    }
    return this;
  }

  /**
   * Get a parameter/property by name
   *
   * @param   {String}    param     Parameter name
   *
   * @return {GUIElement} The current instance (this)
   */
  get(param) {
    if ( this.$element ) {
      return GUI.getProperty(this.$element, param);
    }
    return null;
  }

  /**
   * Appends a childNode to this element
   *
   * @param   {(Node|GUIElement)}     el        Element
   *
   * @return {GUIElement} The current instance (this)
   */
  append(el) {
    if ( el instanceof GUIElement ) {
      el = el.$element;
    } else if ( typeof el === 'string' || typeof el === 'number' ) {
      el = document.createTextNode(String(el));
    }

    let outer = document.createElement('div');
    outer.appendChild(el);

    this._append(outer);
    outer = null;

    return this;
  }

  /**
   * Appends (and builds) HTML into the node
   *
   * @param   {String}    html        HTML code
   * @param   {Window}    [win]       Reference to the Window
   * @param   {Object}    [args]      List of arguments to send to the parser
   *
   * @return {GUIElement} The current instance (this)
   */
  appendHTML(html, win, args) {
    const el = document.createElement('div');
    el.innerHTML = html;

    return this._append(el, win, args);
  }

  /*
   * Internal method for appending a Node
   */
  _append(el, win, args) {
    if ( el instanceof Element ) {
      GUIElement.parseNode(win, el, null, args);
    }

    // Move elements over
    while ( el.childNodes.length ) {
      this.$element.appendChild(el.childNodes[0]);
    }

    el = null;

    return this;
  }

  /**
   * Perform `querySelector`
   *
   * @param     {String}      q             Query
   * @param     {Boolean}     [rui=false]   Return UI Element if possible
   *
   * @return    {(Node|GUIElement)} Depending on arguments
   */
  querySelector(q, rui) {
    const el = this.$element.querySelector(q);
    if ( rui ) {
      return GUIElement.createFromNode(el, q);
    }
    return el;
  }

  /**
   * Perform `querySelectorAll`
   *
   * @param     {String}      q             Query
   * @param     {Boolean}     [rui=false]   Return UI Element if possible
   *
   * @return    {GUIElement[]}
   */
  querySelectorAll(q, rui) {
    let el = this.$element.querySelectorAll(q);
    if ( rui ) {
      el = el.map((i) => {
        return GUIElement.createFromNode(i, q);
      });
    }
    return el;
  }

  /**
   * Set or get CSS attributes
   *
   * @param {String}          k     CSS key
   * @param {(String|Number)} v     CSS value
   *
   * @return {GUIElement} The current instance (this)
   */
  css(k, v) {
    DOM.$css(this.$element, k, v);
    return this;
  }

  /**
   * Get position
   * @return {Object}
   */
  position() {
    return DOM.$position(this.$element);
  }

  // NOTE: DEPRECATED
  _call(method, args, thisArg) {
    if ( arguments.length < 3 ) {
      console.warn('Element::_call("methodName") is DEPRECATED, use "instance.methodName()" instead');
    }
    try {
      if ( typeof this._call === 'function' ) {
        return this._call(method, args);
      }
      return this[method](args);
    } catch ( e ) {
      console.warn(e.stack, e);
    }
    return null;
  }

  // NOTE: DEPRECATED
  fn(name, args, thisArg) {
    console.warn('Element::fn("methodName") is DEPRECATED, use "instance.methodName()" instead');
    args = args || [];
    thisArg = thisArg || this;

    return this.fn(name, args, thisArg);
  }

  /////////////////////////////////////////////////////////////////////////////
  // GUI ELEMENT STATIC METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a new GUI Element into given parent
   *
   * @param   {String}      tagName       OS.js GUI Element name
   * @param   {Object}      params        Parameters
   * @param   {Node}        [parentNode]  Parent Node
   * @param   {Object}      [applyArgs]   New element parameters
   * @param   {Window}      [win]         OS.js Window
   *
   * @return  {GUIElement}
   */
  static createInto(tagName, params, parentNode, applyArgs, win) {
    if ( parentNode instanceof GUIElement ) {
      parentNode = parentNode.$element;
    }

    const gel = GUIElement.create(tagName, params, applyArgs, win);
    parentNode.appendChild(gel.$element);
    return gel;
  }

  /**
   * Creates a new GUI.Element from Node
   *
   * @param {Element}     el          DOM Element
   * @param {String}      [q]         DOM Element query
   * @param {String}      [tagName]   Custom tag name
   *
   * @return  {GUIElement}
   */
  static createFromNode(el, q, tagName) {
    if ( el ) {
      const instance = createElementInstance(null, el, q);
      if ( instance ) {
        return instance;
      }
    }
    return new GUIElement(el, q);
  }

  /**
   * Creates a new GUI.Element
   *
   * @param   {String}      tagName         OS.js GUI Element name
   * @param   {Object}      params          Parameters
   * @param   {Object}      [applyArgs]     New element parameters
   * @param   {Window}      [win]           OS.js Window
   *
   * @return  {GUIElement}
   */
  static create(tagName, params, applyArgs, win) {
    tagName = tagName || '';
    applyArgs = applyArgs || {};
    params = params || {};

    const el = GUI.createElement(tagName, params);
    return createElementInstance(null, el, null, [applyArgs, win]);
  }

  /**
   * Creates a new GUI.Element instance from Node
   *
   * NOTE: DEPRECATED
   *
   * @param {Element}     el          DOM Element
   * @param {String}      [q]         DOM Element query
   * @param {String}      [tagName]   Custom tag name
   *
   * @return {GUIElement}
   */
  static createInstance(el, q, tagName) {
    console.warn('Element::createInstance() is DEPRECATED, use Element::createFromNode() instead');
    return this.createFromNode(el, q, tagName);
  }

  /**
   * Parses the given HTML node and makes OS.js compatible markup
   *
   * @param   {Window}    win               Reference to the Window
   * @param   {Node}      node              The HTML node to parse
   * @param   {String}    [type=snipplet]   Node type
   * @param   {Object}    [args]            List of arguments to send to the parser
   * @param   {Function}  [onparse]         Method to signal when parsing has started
   * @param   {*}         [id]              The id of the source (for debugging)
   */
  static parseNode(win, node, type, args, onparse, id) {
    onparse = onparse || function() {};
    args = args || {};
    type = type || 'snipplet';

    // Apply a default className to non-containers
    node.querySelectorAll('*').forEach((el) => {
      const lcase = el.tagName.toLowerCase();
      if ( lcase.match(/^gui\-/) && !lcase.match(/(\-container|\-(h|v)box|\-columns?|\-rows?|(status|tool)bar|(button|menu)\-bar|bar\-entry)$/) ) {
        DOM.$addClass(el, 'gui-element');
      }
    });

    // Go ahead and parse dynamic elements (like labels)
    parseDynamic(node, win, args);

    // Lastly render elements
    onparse(node);

    Object.keys(REGISTRY).forEach((key) => {
      node.querySelectorAll(key).forEach((pel) => {
        if ( pel._wasParsed || DOM.$hasClass(pel, 'gui-data-view') ) {
          return;
        }

        try {
          createElementInstance(key, pel, null, []);
        } catch ( e ) {
          console.warn('parseNode()', id, type, win, 'exception');
          console.warn(e, e.stack);
        }
        pel._wasParsed = true;
      });
    });
  }

  /**
   * Register a GUI Element
   *
   * @param {Object}      data                 GUI Element Metadata
   * @param {String}      data.tagName         Node tagName
   * @param {GUIElement}  classRef             An object used as a class
   */
  static register(data, classRef) {
    const name = data.tagName;

    if ( REGISTRY[name] ) {
      throw new Error('GUI Element "' + name + '" already exists');
    }

    REGISTRY[name] = (() => {
      const metadata = Object.assign({}, {
        type: 'element',
        allowedChildren: [],
        allowedParents: []
      }, data);

      if ( metadata.parent ) {
        delete metadata.parent;
      }

      if ( metadata.type === 'input' ) {
        metadata.allowedChildren = true;
      } else if ( metadata.type !== 'container' ) {
        metadata.allowedChildren = false;
      }

      return {
        metadata: metadata,
        component: classRef
      };
    })();
  }

  /**
   * Get Element from registry
   * @param {String} tagName HTML Tag Name
   * @return {Object}
   */
  static getRegisteredElement(tagName) {
    return REGISTRY[tagName];
  }

}

