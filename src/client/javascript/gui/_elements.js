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

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Base UIElement Class
   *
   * @api OSjs.GUI.UIElement()
   * @class
   */
  function UIElement(el, q) {
    this.$element = el || null;
    this.tagName = el ? el.tagName.toLowerCase() : null;
    this.oldDisplay = null;

    if ( !el ) {
      console.error('UIElement() was constructed without a DOM element', q);
    }
  }

  UIElement.prototype.blur = function() {
    // TODO: For more elements
    if ( this.$element ) {
      var firstChild = this.$element.querySelector('input');
      if ( firstChild ) {
        firstChild.blur();
      }
    }
    return this;
  };

  UIElement.prototype.focus = function() {
    // TODO: For more elements
    if ( this.$element ) {
      var firstChild = this.$element.firstChild || this.$element; //this.$element.querySelector('input');
      if ( firstChild ) {
        firstChild.focus();
      }
    }
    return this;
  };

  UIElement.prototype.show = function() {
    if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].show ) {
      OSjs.GUI.Elements[this.tagName].show.apply(this, arguments);
    } else {
      if ( this.$element ) {
        this.$element.style.display = this.oldDisplay || '';
      }
    }
    return this;
  };

  UIElement.prototype.hide = function() {
    if ( this.$element ) {
      if ( !this.oldDisplay ) {
        this.oldDisplay = this.$element.style.display;
      }
      this.$element.style.display = 'none';
    }
    return this;
  };

  UIElement.prototype.on = function(evName, callback, args) {
    if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].bind ) {
      OSjs.GUI.Elements[this.tagName].bind(this.$element, evName, callback, args);
    }
    return this;
  };

  UIElement.prototype.set = function(param, value, arg) {
    if ( this.$element ) {
      if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].set ) {
        if ( OSjs.GUI.Elements[this.tagName].set(this.$element, param, value, arg) === true ) {
          return this;
        }
      }

      OSjs.GUI.Helpers.setProperty(this.$element, param, value, arg);
    }
    return this;
  };

  UIElement.prototype.get = function() {
    if ( this.$element ) {
      if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].get ) {
        var args = ([this.$element]).concat(Array.prototype.slice.call(arguments));
        return OSjs.GUI.Elements[this.tagName].get.apply(this, args);
      } else {
        return getProperty(this.$element, arguments[0]);
      }
    }
    return null;
  };

  UIElement.prototype.append = function(el) {
    if ( el instanceof UIElement ) {
      el = el.$element;
    }
    this.$element.appendChild(el);
  };

  UIElement.prototype.querySelector = function(q) {
    return this.$element.querySelector(q);
  };

  UIElement.prototype.querySelectorAll = function(q) {
    return this.$element.querySelectorAll(q);
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
   * @api OSjs.GUI.UIElementDataView()
   * @class
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

  OSjs.GUI.Element = UIElement;
  OSjs.GUI.ElementDataView = UIElementDataView;

})(OSjs.API, OSjs.Utils, OSjs.VFS);
