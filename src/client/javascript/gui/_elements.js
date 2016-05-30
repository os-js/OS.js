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
(function(API, Utils, VFS) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};

  /**
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

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Base UIElement Class
   *
   * @api OSjs.GUI.Element
   * @class Element
   */
  function UIElement(el, q) {
    this.$element = el || null;
    this.tagName = el ? el.tagName.toLowerCase() : null;
    this.oldDisplay = null;

    if ( !el ) {
      console.error('UIElement() was constructed without a DOM element', q);
    }
  }

  /**
   * Removes element from the DOM
   *
   * @method Element::remove()
   * @return void
   */
  UIElement.prototype.remove = function() {
    this.$element = Utils.$remove(this.$element);
  };

  /**
   * Empties the DOM element
   *
   * @method Element::empty()
   * @return Element this
   */
  UIElement.prototype.empty = function() {
    Utils.$empty(this.$element);
    return this;
  };

  /**
   * Blur (unfocus)
   *
   * @method Element::blur()
   * @return Element this
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
   * @method Element::focus()
   * @return Element this
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
   * @method Element::show()
   * @return Element this
   */
  UIElement.prototype.show = function() {
    if ( this.$element && !this.$element.offsetParent ) {
      if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].show ) {
        OSjs.GUI.Elements[this.tagName].show.apply(this, arguments);
      } else {
        if ( this.$element ) {
          this.$element.style.display = this.oldDisplay || '';
        }
      }
    }
    return this;
  };

  /**
   * Hide
   *
   * @method Element::hide()
   * @return Element this
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
   * @param   String      evName      Event Name
   * @param   Function    callback    Callback function
   * @param   Object      args        (Optional) binding arguments
   *
   * @method Element::on()
   * @return Element this
   */
  UIElement.prototype.on = function(evName, callback, args) {
    if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].bind ) {
      OSjs.GUI.Elements[this.tagName].bind(this.$element, evName, callback, args);
    }
    return this;
  };

  /**
   * Sets a parameter/property by name
   *
   * @param   String    param     Parameter name
   * @param   Mixed     value     Parameter value
   * @param   Mixed     arg       (Optional) Extra argument ...
   * @param   Mixed     arg2      (Optional) Extra argument ...
   *
   * @method Element::set()
   * @return Element this
   */
  UIElement.prototype.set = function(param, value, arg, arg2) {
    if ( this.$element ) {
      if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].set ) {
        if ( OSjs.GUI.Elements[this.tagName].set(this.$element, param, value, arg, arg2) === true ) {
          return this;
        }
      }

      OSjs.GUI.Helpers.setProperty(this.$element, param, value, arg, arg2);
    }
    return this;
  };

  /**
   * Get a parameter/property by name
   *
   * @param   String    param     Parameter name
   * @param   Mixed     arg       (Optional) Extra argument ...
   *
   * @method Element::get()
   * @return Element this
   */
  UIElement.prototype.get = function() {
    if ( this.$element ) {
      if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].get ) {
        var args = ([this.$element]).concat(Array.prototype.slice.call(arguments));
        return OSjs.GUI.Elements[this.tagName].get.apply(this, args);
      } else {
        return OSjs.GUI.Helpers.getProperty(this.$element, arguments[0]);
      }
    }
    return null;
  };

  /**
   * Triggers a custom function by name and arguments
   *
   * @param   String    name      Name of function
   * @param   Array     args      (Optional) Argument array (passed to apply())
   * @param   Mixed     thisArg   (Optional) `this` argument (default=UIElement/this)
   *
   * @method Element::fn()
   * @return Mixed
   */
  UIElement.prototype.fn = function(name, args, thisArg) {
    args = args || [];
    thisArg = thisArg || this;

    if ( this.$element ) {
      return OSjs.GUI.Elements[this.tagName][name].apply(thisArg, args);
    }
    return null;
  };

  /**
   * Appends a childNode to this element
   *
   * @param   Mixed     el        DOMEelement or UIElement
   *
   * @method Element::append()
   * @return Element this
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
   * @param   String              html        HTML code
   * @param   OSjs.GUI.Scheme     scheme      (Optional) Reference to the Scheme
   * @param   OSjs.Core.Window    win         (Optional) Reference to the Window
   * @param   Object              args        (Optional) List of arguments to send to the parser
   *
   * @method Element::appendHTML()
   * @return Element this
   */
  UIElement.prototype.appendHTML = function(html, scheme, win, args) {
    var el = document.createElement('div');
    el.innerHTML = html;

    return this._append(el, scheme, win, args);
  };

  UIElement.prototype._append = function(el, scheme, win, args) {
    if ( el instanceof Element ) {
      OSjs.GUI.Scheme.parseNode(scheme, win, el, null, args);
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
   * @param     String      q     Query
   * @param     boolean     rui   Return UI Element if possible (default=false)
   *
   * @return    DOMElement
   * @method    Element::querySelector()
   */
  UIElement.prototype.querySelector = function(q, rui) {
    var el = this.$element.querySelector(q);
    if ( rui ) {
      return OSjs.GUI.Scheme.getElementInstance(el, q);
    }
    return el;
  };

  /**
   * Perform `querySelectorAll`
   *
   * @param     String      q     Query
   * @param     boolean     rui   Return UI Element if possible (default=false)
   *
   * @return    DOMElementCollection
   * @method    Element::querySelectorAll()
   */
  UIElement.prototype.querySelectorAll = function(q, rui) {
    var el = this.$element.querySelectorAll(q);
    if ( rui ) {
      el = el.map(function(i) {
        return OSjs.GUI.Scheme.getElementInstance(i, q);
      });
    }
    return el;
  };

  UIElement.prototype._call = function(method, args) {
    if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].call ) {
      var cargs = ([this.$element, method, args]);//.concat(args);
      return OSjs.GUI.Elements[this.tagName].call.apply(this, cargs);
    }
    return null;//this;
  };

  /**
   * Extended UIElement for ListView, TreeView, IconView, Select, SelectList
   * @extends UIElement
   * @api OSjs.GUI.ElementDataView
   * @class ElementDataView
   */
  function UIElementDataView() {
    UIElement.apply(this, arguments);
  }

  UIElementDataView.prototype = Object.create(UIElement.prototype);
  UIElementDataView.constructor = UIElement;

  UIElementDataView.prototype.clear = function() {
    return this._call('clear', []);
  };

  UIElementDataView.prototype.add = function(props) {
    return this._call('add', [props]);
  };

  UIElementDataView.prototype.patch = function(props) {
    return this._call('patch', [props]);
  };

  UIElementDataView.prototype.remove = function(id, key) {
    return this._call('remove', [id, key]);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Element = Object.seal(UIElement);
  OSjs.GUI.ElementDataView = Object.seal(UIElementDataView);

})(OSjs.API, OSjs.Utils, OSjs.VFS);
