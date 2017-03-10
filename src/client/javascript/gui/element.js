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
(function(API, Utils, VFS, GUI) {
  'use strict';

  /**
   * @namespace Elements
   * @memberof OSjs.GUI
   */

  var REGISTRY = {};

  /*
   * Wrapper for getting which element to focus/blur
   */
  function getFocusElement(inst) {
    var tagMap = {
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

    var translator = args._ || API._;

    node.querySelectorAll('*[data-label]').forEach(function(el) {
      var label = translator(el.getAttribute('data-label'));
      el.setAttribute('data-label', label);
    });

    node.querySelectorAll('gui-label, gui-button, gui-list-view-column, gui-select-option, gui-select-list-option').forEach(function(el) {
      if ( !el.children.length && !el.getAttribute('data-no-translate') ) {
        var lbl = GUI.Helpers.getValueLabel(el);
        el.appendChild(document.createTextNode(translator(lbl)));
      }
    });

    node.querySelectorAll('gui-button').forEach(function(el) {
      var label = GUI.Helpers.getValueLabel(el);
      if ( label ) {
        el.appendChild(document.createTextNode(API._(label)));
      }
    });

    node.querySelectorAll('*[data-icon]').forEach(function(el) {
      var image = GUI.Helpers.getIcon(el, win);
      el.setAttribute('data-icon', image);
    });

    node.querySelectorAll('*[data-src]').forEach(function(el) {
      var old = el.getAttribute('data-src') || '';
      if ( win._app && old.match(/^app:\/\//) ) {
        var source = API.getApplicationResource(win._app, old.replace('app://', ''));
        el.setAttribute('data-src', source);
      }
    });
  }

  /*
   * Wrapper for creating a new element instance
   */
  function createElementInstance(tagName, el, q, buildArgs) {
    tagName = tagName || el.tagName.toLowerCase();

    var instance;
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
   * Base UIElement Class
   *
   * @summary The Class used for all UI Elements.
   *
   * @param {Node}      el      DOM Node
   * @param {String}    [q]     Query that element came from
   *
   * @link https://os-js.org/manual/gui/elements/
   *
   * @constructor Element
   * @memberof OSjs.GUI
   */
  function UIElement(el, q) {

    /**
     * The DOM Node
     * @name $element
     * @memberof OSjs.GUI.Element#
     * @type {Node}
     */
    this.$element = el || null;

    /**
     * The DOM Tag Name
     * @name tagName
     * @memberof OSjs.GUI.Element#
     * @type {String}
     */
    this.tagName = el ? el.tagName.toLowerCase() : null;

    this.oldDisplay = null;

    if ( !el ) {
      console.warn('UIElement() was constructed without a DOM element', q);
    }
  }

  /**
   * Builds the DOM nodes etc
   *
   * @function build
   * @memberof OSjs.GUI.Element#
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.build = function() {
    return this;
  };

  /**
   * Removes element from the DOM
   *
   * @function remove
   * @memberof OSjs.GUI.Element#
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.remove = function() {
    this.$element = Utils.$remove(this.$element);
    return this;
  };

  /**
   * Empties the DOM element
   *
   * @function empty
   * @memberof OSjs.GUI.Element#
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.empty = function() {
    Utils.$empty(this.$element);
    return this;
  };

  /**
   * Blur (unfocus)
   *
   * @function blur
   * @memberof OSjs.GUI.Element#
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.blur = function() {
    if ( this.$element ) {
      var firstChild = getFocusElement(this);
      if ( firstChild ) {
        firstChild.blur();
      }
    }
    return this;
  };

  /**
   * Focus (focus)
   *
   * @function focus
   * @memberof OSjs.GUI.Element#
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.focus = function() {
    if ( this.$element ) {
      var firstChild = getFocusElement(this);
      if ( firstChild ) {
        firstChild.focus();
      }
    }
    return this;
  };

  /**
   * Show
   *
   * @function show
   * @memberof OSjs.GUI.Element#
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.show = function() {
    if ( this.$element && !this.$element.offsetParent ) {
      if ( this.$element ) {
        this.$element.style.display = this.oldDisplay || '';
      }
    }
    return this;
  };

  /**
   * Hide
   *
   * @function hide
   * @memberof OSjs.GUI.Element#
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.hide = function() {
    if ( this.$element && this.$element.offsetParent ) {
      if ( !this.oldDisplay ) {
        this.oldDisplay = this.$element.style.display;
      }
      this.$element.style.display = 'none';
    }
    return this;
  };

  /**
   * Register Event
   *
   * @function on
   * @memberof OSjs.GUI.Element#
   *
   * @example
   * element.on('click', function() {});
   *
   * @param   {String}        evName      Event Name
   * @param   {CallbackEvent} callback    Callback function
   * @param   {Object}        [args]      Binding arguments
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.on = function(evName, callback, args) {
    return this;
  };

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
   * @function son
   * @memberof OSjs.GUI.Element#
   * @see OSjs.GUI.Element#on
   *
   * @param   {String}        evName      Event Name
   * @param   {Object}        thisArg     Which object instance to bind to
   * @param   {CallbackEvent} callback    Callback function
   * @param   {Object}        [args]      Binding arguments
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.son = function(evName, thisArg, callback, args) {
    return this.on(evName, function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(this);
      callback.apply(thisArg, args);
    }, args);
  };

  /**
   * Sets a parameter/property by name
   *
   * @function set
   * @memberof OSjs.GUI.Element#
   *
   * @param   {String}    param     Parameter name
   * @param   {Mixed}     value     Parameter value
   * @param   {Mixed}     [arg]     Extra argument ...
   * @param   {Mixed}     [arg2]    Extra argument ...
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.set = function(param, value, arg, arg2) {
    if ( this.$element ) {
      GUI.Helpers.setProperty(this.$element, param, value, arg, arg2);
    }
    return this;
  };

  /**
   * Get a parameter/property by name
   *
   * @function get
   * @memberof OSjs.GUI.Element#
   *
   * @param   {String}    param     Parameter name
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.get = function(param) {
    if ( this.$element ) {
      return GUI.Helpers.getProperty(this.$element, param);
    }
    return null;
  };

  /**
   * Appends a childNode to this element
   *
   * @function append
   * @memberof OSjs.GUI.Element#
   *
   * @param   {(Node|OSjs.GUI.Element)}     el        Element
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.append = function(el) {
    if ( el instanceof UIElement ) {
      el = el.$element;
    } else if ( typeof el === 'string' || typeof el === 'number' ) {
      el = document.createTextNode(String(el));
    }

    var outer = document.createElement('div');
    outer.appendChild(el);

    this._append(outer);
    outer = null;

    return this;
  };

  /**
   * Appends (and builds) HTML into the node
   *
   * @function appendHTML
   * @memberof OSjs.GUI.Element#
   *
   * @param   {String}              html        HTML code
   * @param   {OSjs.Core.Window}    [win]       Reference to the Window
   * @param   {Object}              [args]      List of arguments to send to the parser
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.appendHTML = function(html, win, args) {
    var el = document.createElement('div');
    el.innerHTML = html;

    return this._append(el, win, args);
  };

  /*
   * Internal method for appending a Node
   */
  UIElement.prototype._append = function(el, win, args) {
    if ( el instanceof Element ) {
      UIElement.parseNode(win, el, null, args);
    }

    // Move elements over
    while ( el.childNodes.length ) {
      this.$element.appendChild(el.childNodes[0]);
    }

    el = null;

    return this;
  };

  /**
   * Perform `querySelector`
   *
   * @function querySelector
   * @memberof OSjs.GUI.Element#
   *
   * @param     {String}      q             Query
   * @param     {Boolean}     [rui=false]   Return UI Element if possible
   *
   * @return    {(Node|OSjs.GUI.Element)} Depending on arguments
   */
  UIElement.prototype.querySelector = function(q, rui) {
    var el = this.$element.querySelector(q);
    if ( rui ) {
      return GUI.Element.createFromNode(el, q);
    }
    return el;
  };

  /**
   * Perform `querySelectorAll`
   *
   * @function querySelectorAll
   * @memberof OSjs.GUI.Element#
   *
   * @param     {String}      q             Query
   * @param     {Boolean}     [rui=false]   Return UI Element if possible
   *
   * @return    {OSjs.GUI.Element[]}
   */
  UIElement.prototype.querySelectorAll = function(q, rui) {
    var el = this.$element.querySelectorAll(q);
    if ( rui ) {
      el = el.map(function(i) {
        return GUI.Element.createFromNode(i, q);
      });
    }
    return el;
  };

  /**
   * Set or get CSS attributes
   *
   * @param {String}          k     CSS key
   * @param {(String|Number)} v     CSS value
   *
   * @function css
   * @memberof OSjs.GUI.Element#
   * @see OSjs.Utils.$css
   *
   * @return {OSjs.GUI.Element} The current instance (this)
   */
  UIElement.prototype.css = function(k, v) {
    Utils.$css(this.$element, k, v);
    return this;
  };

  /**
   * Get position
   * @function position
   * @memberof OSjs.GUI.Element#
   * @see OSjs.Utils.$position
   * @return {Object}
   */
  UIElement.prototype.position = function() {
    return Utils.$position(this.$element);
  };

  // NOTE: DEPRECATED
  UIElement.prototype._call = function(method, args, thisArg) {
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
  };

  // NOTE: DEPRECATED
  UIElement.prototype.fn = function(name, args, thisArg) {
    console.warn('Element::fn("methodName") is DEPRECATED, use "instance.methodName()" instead');
    args = args || [];
    thisArg = thisArg || this;

    return this.fn(name, args, thisArg);
  };

  /////////////////////////////////////////////////////////////////////////////
  // GUI ELEMENT STATIC METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a new GUI Element into given parent
   *
   * @param   {String}                tagName       OS.js GUI Element name
   * @param   {Object}                params        Parameters
   * @param   {Node}                  [parentNode]  Parent Node
   * @param   {Object}                [applyArgs]   New element parameters
   * @param   {OSjs.Core.Window}      [win]         OS.js Window
   *
   * @return  {OSjs.GUI.Element}
   * @function createInto
   * @memberof OSjs.GUI.Element
   */
  UIElement.createInto = function createGUIElementInto(tagName, params, parentNode, applyArgs, win) {
    if ( parentNode instanceof GUI.Element ) {
      parentNode = parentNode.$element;
    }

    var gel = GUI.Element.create(tagName, params, applyArgs, win);
    parentNode.appendChild(gel.$element);
    return gel;
  };

  /**
   * Creates a new GUI.Element from Node
   *
   * @param {Element}     el          DOM Element
   * @param {String}      [q]         DOM Element query
   * @param {String}      [tagName]   Custom tag name
   *
   * @return  {OSjs.GUI.Element}
   * @function createFromNode
   * @memberof OSjs.GUI.Element
   */
  UIElement.createFromNode = function createGUIElementFromNode(el, q, tagName) {
    if ( el ) {
      var instance = createElementInstance(null, el, q);
      if ( instance ) {
        return instance;
      }
    }
    return new GUI.Element(el, q);
  };

  /**
   * Creates a new GUI.Element
   *
   * @param   {String}                tagName         OS.js GUI Element name
   * @param   {Object}                params          Parameters
   * @param   {Object}                [applyArgs]     New element parameters
   * @param   {OSjs.Core.Window}      [win]           OS.js Window
   *
   * @return  {OSjs.GUI.Element}
   * @function create
   * @memberof OSjs.GUI.Element
   */
  UIElement.create = function createGUIElement(tagName, params, applyArgs, win) {
    tagName = tagName || '';
    applyArgs = applyArgs || {};
    params = params || {};

    var el = GUI.Helpers.createElement(tagName, params);
    return createElementInstance(null, el, null, [applyArgs, win]);
  };

  /**
   * Creates a new GUI.Element instance from Node
   *
   * NOTE: DEPRECATED
   *
   * @param {Element}     el          DOM Element
   * @param {String}      [q]         DOM Element query
   * @param {String}      [tagName]   Custom tag name
   *
   * @function createInstance
   * @memberof OSjs.GUI.Element
   * @return {OSjs.GUI.Element}
   */
  UIElement.createInstance = function(el, q, tagName) {
    console.warn('Element::createInstance() is DEPRECATED, use Element::createFromNode() instead');
    return this.createFromNode(el, q, tagName);
  };

  /**
   * Parses the given HTML node and makes OS.js compatible markup
   *
   * @function parseNode
   * @memberof OSjs.GUI.Element
   *
   * @param   {OSjs.Core.Window}    win               Reference to the Window
   * @param   {Node}                node              The HTML node to parse
   * @param   {String}              [type=snipplet]   Node type
   * @param   {Object}              [args]            List of arguments to send to the parser
   * @param   {Function}            [onparse]         Method to signal when parsing has started
   * @param   {Mixed}               [id]              The id of the source (for debugging)
   */
  UIElement.parseNode = function(win, node, type, args, onparse, id) {
    onparse = onparse || function() {};
    args = args || {};
    type = type || 'snipplet';

    // Apply a default className to non-containers
    node.querySelectorAll('*').forEach(function(el) {
      var lcase = el.tagName.toLowerCase();
      if ( lcase.match(/^gui\-/) && !lcase.match(/(\-container|\-(h|v)box|\-columns?|\-rows?|(status|tool)bar|(button|menu)\-bar|bar\-entry)$/) ) {
        Utils.$addClass(el, 'gui-element');
      }
    });

    // Go ahead and parse dynamic elements (like labels)
    parseDynamic(node, win, args);

    // Lastly render elements
    onparse(node);

    Object.keys(REGISTRY).forEach(function(key) {
      node.querySelectorAll(key).forEach(function(pel) {
        if ( pel._wasParsed || Utils.$hasClass(pel, 'gui-data-view') ) {
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
  };

  /**
   * Register a GUI Element
   *
   * @function register
   * @memberof OSjs.GUI.Element
   *
   * @param {Object}    data                 GUI Element Metadata
   * @param {String}    data.tagName         Node tagName
   * @param {Function}  [data.parent]        Base class to extend from
   * @param {Object}    classRef             An object used as a class
   */
  UIElement.register = function(data, classRef) {
    var name = data.tagName;

    if ( REGISTRY[name] ) {
      throw new Error('GUI Element "' + name + '" already exists');
    }

    var base = data.parent || GUI.Element;
    var target = Utils.inherit(base, null, classRef);

    REGISTRY[name] = (function() {
      var metadata = Utils.argumentDefaults(Utils.cloneObject(data, true), {
        type: 'element',
        allowedChildren: [],
        allowedParents: []
      });

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
        component: target
      };
    })();
  };

  UIElement.getRegisteredElement = function(tagName) {
    return REGISTRY[tagName];
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  GUI.Element = Object.seal(UIElement);

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
