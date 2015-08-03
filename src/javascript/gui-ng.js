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

  //////////////////////////////////////////////////////////////////////
  //                                                                  //
  //                         !!! WARNING !!!                          //
  //                                                                  //
  // THIS IS HIGHLY EXPERIMENTAL, BUT WILL BECOME THE NEXT GENERATION //
  // GUI SYSTEM: https://github.com/andersevenrud/OS.js-v2/issues/136 //
  //                                                                  //
  //////////////////////////////////////////////////////////////////////

  window.OSjs = window.OSjs || {};
  OSjs.API = OSjs.API || {};

  OSjs.GUI = OSjs.GUI || {};
  OSjs.GUI.Elements = OSjs.GUI.Elements || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

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

  function getLabel(el) {
    var label = el.getAttribute('data-label');
    return label || '';
  }

  function getValueLabel(el, attr) {
    var label = attr ? el.getAttribute('data-label') : null;

    if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
      label = el.childNodes[0].nodeValue;
      Utils.$empty(el);
    }

    return label || '';
  }

  function getViewNodeValue(found) {
    var value = found.getAttribute('data-value');
    try {
      value = JSON.parse(value);
    } catch ( e ) {
      value = null;
    }
    return value;
  }

  function getIcon(el, win) {
    var image = el.getAttribute('data-icon');

    if ( image ) {
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
    }

    return image;
  }

  function parseDynamic(node, win) {
    // TODO: Support application locales! :)
    node.querySelectorAll('*[data-label]').forEach(function(el) {
      var label = API._(el.getAttribute('data-label'));
      el.setAttribute('data-label', label);
    });

    node.querySelectorAll('gui-button').forEach(function(el) {
      var label = getValueLabel(el);
      if ( label ) {
        el.appendChild(document.createTextNode(API._(label)));
      }
    });

    node.querySelectorAll('*[data-icon]').forEach(function(el) {
      var image = getIcon(el, win);
      el.setAttribute('data-icon', image);
    });
  }

  function getProperty(el, param, tagName) {
    tagName = tagName || el.tagName.toLowerCase();

    if ( param === 'value' ) {
      if ( (['gui-text', 'gui-password', 'gui-textarea']).indexOf(tagName) >= 0 ) {
        return el.querySelector('input, textarea').value;
      }
      if ( (['gui-checkbox', 'gui-radio']).indexOf(tagName) >= 0 ) {
        return el.querySelector('input').value === 'on';
      }
      return null;
    }

    var isDataView = tagName.match(/^gui\-(tree|icon|list|file)\-view$/);
    if ( (param === 'value' || param === 'selected') && isDataView ) {
      return OSjs.GUI.Elements[tagName].values(el);
    }

    return el.getAttribute('data-' + param);
  }

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
          return;
        }
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

    // Generics for input elements
    var firstChild = el.children[0];
    var accept = ['gui-slider', 'gui-text', 'gui-password', 'gui-textarea', 'gui-checkbox', 'gui-radio', 'gui-select', 'gui-select-list', 'gui-button'];
    if ( accept.indexOf(tagName) >= 0 ) {
      _setInputProperty();
    }

    // Other types of elements
    accept = ['gui-image', 'gui-audio', 'gui-video'];
    if ( (['src', 'controls', 'autoplay', 'alt']).indexOf(param) >= 0 && accept.indexOf(tagName) >= 0 ) {
      firstChild.setAttribute(param, value);
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

  function createElement(tagName, params) {
    var el = document.createElement(tagName);
    Object.keys(params).forEach(function(k) {
      var value = params[k];
      if ( typeof value === 'boolean' ) {
        value = value ? 'true' : 'false';
      } else if ( typeof value === 'object' ) {
        try {
          value = JSON.stringify(value);
        } catch ( e ) {}
      }
      el.setAttribute('data-' + k, value);
    });
    return el;
  }

  function handleItemSelection(ev, item, idx, className, selected, root, multipleSelect) {
    root = root || item.parentNode;

    if ( !multipleSelect || !ev.shiftKey ) {
      root.querySelectorAll(className).forEach(function(i) {
        Utils.$removeClass(i, 'gui-active');
      });
      selected = [];
    }

    var findex = selected.indexOf(idx);
    if ( findex >= 0 ) {
      selected.splice(findex, 1);
      Utils.$removeClass(item, 'gui-active');
    } else {
      selected.push(idx);
      Utils.$addClass(item, 'gui-active');
    }

    return selected;
  }

  function setFlexbox(el, grow, shrink, defaultGrow, defaultShrink, checkEl) {
    var basis = (checkEl || el).getAttribute('data-basis') || 'auto';
    var align = el.getAttribute('data-align');

    var tmp;
    if ( typeof grow === 'undefined' || grow === null ) {
      tmp = (checkEl || el).getAttribute('data-grow');
      if ( tmp === null ) {
        grow = typeof defaultGrow === 'undefined' ? 0 : defaultGrow;
      } else {
        grow = parseInt(tmp, 10) || 0;
      }
    } else {
      grow = basis === 'auto' ? 1 : grow;
    }

    if ( typeof shrink === 'undefined' || shrink === null ) {
      tmp = (checkEl || el).getAttribute('data-shrink');
      if ( tmp === null ) {
        shrink = typeof defaultShrink === 'undefined' ? 0 : defaultShrink;
      } else {
        shrink = parseInt(tmp, 10) || 0;
      }
    } else {
      shrink = basis === 'auto' ? 1 : shrink;
    }

    var flex = Utils.format('{0} {1} {2}', grow.toString(), shrink.toString(), basis);
    el.style['webkitFlex'] = flex;
    el.style['mozFflex'] = flex;
    el.style['msFflex'] = flex;
    el.style['oFlex'] = flex;
    el.style['flex'] = flex;

    if ( align ) {
      el.style.alignSelf = align.match(/start|end/) ? 'flex-' + align : align;
    }
  }

  function createDrag(el, onDown, onMove, onUp) {
    onDown = onDown || function() {};
    onMove = onMove || function() {};
    onUp = onUp || function() {};

    var startX, startY;
    var dragging = false;

    function _onMouseDown(ev) {
      ev.preventDefault();

      startX = ev.clientX;
      startY = ev.clientY;

      onDown(ev);
      dragging = true;

      Utils.$bind(window, 'mouseup', _onMouseUp, false);
      Utils.$bind(window, 'mousemove', _onMouseMove, false);
    }

    function _onMouseMove(ev) {
      ev.preventDefault();

      if ( dragging ) {
        var diffX = ev.clientX - startX;
        var diffY = ev.clientY - startY;
        onMove(ev, diffX, diffX);
      }
    }

    function _onMouseUp(ev) {
      onUp(ev);
      dragging = false;

      Utils.$unbind(window, 'mouseup', _onMouseUp, false);
      Utils.$unbind(window, 'mousemove', _onMouseMove, false);
    }

    Utils.$bind(el, 'mousedown', _onMouseDown, false);
  }

  /////////////////////////////////////////////////////////////////////////////
  // UIELEMENT CLASS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Base UIElement Class
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
    if ( this.$element ) {
      this.$element.style.display = this.oldDisplay || '';
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
        OSjs.GUI.Elements[this.tagName].set(this.$element, param, value, arg);
      } else {
        setProperty(this.$element, param, value, arg);
      }
    }
    return this;
  };

  UIElement.prototype.get = function(param) {
    if ( this.$element ) {
      if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].get ) {
        return OSjs.GUI.Elements[this.tagName].get(this.$element, param);
      } else {
        return getProperty(this.$element, param);
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

  /**
   * Extended UIElement for ListView, TreeView, IconView, Select, SelectList
   */
  function UIElementDataView() {
    UIElement.apply(this, arguments);
  }

  UIElementDataView.prototype = Object.create(UIElement.prototype);
  UIElementDataView.constructor = UIElement;

  UIElementDataView.prototype._call = function(method, args) {
    if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].call ) {
      var cargs = ([this.$element, method, args]);//.concat(args);
      OSjs.GUI.Elements[this.tagName].call.apply(this, cargs);
    }
    return this;
  };

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
  // UISCHEME CLASS
  /////////////////////////////////////////////////////////////////////////////

  function UIScheme(url) {
    this.url = url;
    this.scheme = null;
  }

  UIScheme.prototype.load = function(cb) {
    var self = this;
    Utils.ajax({
      url: this.url,
      onsuccess: function(html) {
        var doc = document.createDocumentFragment();
        var wrapper = document.createElement('div');
        wrapper.innerHTML = Utils.cleanHTML(html);
        doc.appendChild(wrapper);
        self.scheme = doc;

        cb(false, doc);
      },
      onerror: function() {
        cb('Failed to fetch scheme');
      }
    });
  };

  UIScheme.prototype.parse = function(id, type, win, onparse) {
    onparse = onparse || function() {};

    var content;
    if ( type ) {
      content = this.scheme.querySelector(type + '[data-id="' + id + '"]');
    } else {
      content = this.scheme.querySelector('application-window[data-id="' + id + '"]') ||
                this.scheme.querySelector('application-fragment[data-id="' + id + '"]');
    }

    type = type || content.tagName.toLowerCase();
    if ( content ) {
      var node = content.cloneNode(true);

      node.querySelectorAll('*').forEach(function(el) {
        var lcase = el.tagName.toLowerCase();
        if ( lcase.match(/^gui\-/) && !lcase.match(/(\-container|\-(h|v)box|\-columns?|\-rows?|toolbar|button\-bar)$/) ) {
          Utils.$addClass(el, 'gui-element');
        }
      });

      parseDynamic(node, win);

      onparse(node);

      Object.keys(OSjs.GUI.Elements).forEach(function(key) {
        node.querySelectorAll(key).forEach(function(pel) {
          try {
            OSjs.GUI.Elements[key].build(pel);
          } catch ( e ) {
            console.warn('UIScheme::parse()', id, type, win, 'exception');
            console.warn(e, e.stack);
          }
        });
      });

      return node;
    }

    return null;
  };

  UIScheme.prototype.render = function(win, id, root, type, onparse) {
    root = root || win._getRoot();
    if ( root instanceof UIElement ) {
      root = root.$element;
    }

    var content = this.parse(id, type, win, onparse);
    if ( content ) {
      var children = content.children;
      var i = 0;
      while ( children.length && i < 10000 ) {
        root.appendChild(children[0]);
        i++;
      }
    }
  };

  UIScheme.prototype.create = function(win, tagName, params, parentNode, applyArgs) {
    tagName = tagName || '';
    params = params || {};
    parentNode = parentNode || win.getRoot();

    var el = createElement(tagName);
    parentNode.appendChild(el);
    OSjs.GUI.Elements[tagName].build(el, applyArgs, win);

    return new UIElement(el);
  };

  UIScheme.prototype.find = function(win, id, root) {
    root = root || win._getRoot();
    var q = '[data-id="' + id + '"]';
    return this.get(root.querySelector(q), q);
  };

  UIScheme.prototype.get = function(el, q) {
    if ( el ) {
      var tagName = el.tagName.toLowerCase();
      if ( tagName.match(/^gui\-(list|tree|icon|file)\-view$/) || tagName.match(/^gui\-select/) ) {
        return new UIElementDataView(el, q);
      }
    }
    return new UIElement(el, q);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Element = UIElement;
  OSjs.GUI.ElementDataView = UIElementDataView;
  OSjs.GUI.Scheme = UIScheme;
  OSjs.GUI.Helpers = {
    getValueLabel: getValueLabel,
    getViewNodeValue: getViewNodeValue,
    getLabel: getLabel,
    getIcon: getIcon,
    getWindowId: getWindowId,
    createElement: createElement,
    createDrag: createDrag,
    handleItemSelection: handleItemSelection,
    setProperty: setProperty,
    setFlexbox: setFlexbox
  };

  OSjs.GUI.createScheme = function(url) {
    return new UIScheme(url);
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS);
