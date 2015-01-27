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
(function(API, Utils) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};

  var _PreviousGUIElement;

  /////////////////////////////////////////////////////////////////////////////
  // CLASS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * GUI Element
   *
   * @param   String    name      Name of GUI Element (unique)
   * @param   Object    opts      A dict of options (see below)
   *
   * @option  opts   Function     onItemDropped      Callback - When internal object dropped (requires dnd enabled)
   * @option  opts   Function     onFilesDropped     Callback - When external file object dropped (requires dnd enabled)
   * @option  opts   bool         dnd                Enable DnD (Default = false)
   * @option  opts   bool         dndDrop            Enable DnD Droppable (Default = DnD)
   * @option  opts   bool         dndDrag            Enable DnD Draggable (Default = DnD)
   * @option  opts   Object       dndOpts            DnD Options
   * @option  opts   bool         focusable          If element is focusable (Default = true)
   *
   * @api     OSjs.Core.GUIElement
   * @class
   */
  var GUIElement = (function() {
    var _Count = 0;

    return function(name, opts) {
      opts = opts || {};

      this.tagName        = this.tagName || 'div';
      this.className      = this.className || null;
      this.name           = name || ('Unknown_' + _Count);
      this.opts           = opts || {};
      this.id             = _Count;
      this.destroyed      = false;
      this.focused        = false;
      this.tabIndex       = -1; // Set in Window::_addGUIElement()
      this.wid            = 0; // Set in Window::_addGUIElement()
      this.hasTabIndex    = opts.hasTabIndex === true;
      this.hasChanged     = false;
      this.hasCustomKeys  = opts.hasCustomKeys === true;
      this.onItemDropped  = opts.onItemDropped  || function() {};
      this.onFilesDropped = opts.onFilesDropped || function() {};
      this._onFocusWindow = function() {};
      this.$element       = null;
      this.inited         = false;
      this._children      = [];
      this._parent        = null;
      this._window        = null;
      this._hooks         = {
        focus   : [],
        blur    : [],
        destroy : []
      };

      if ( typeof this.opts.dnd === 'undefined' ) {
        this.opts.dnd     = false;
      }
      if ( typeof this.opts.dndDrop === 'undefined' ) {
        this.opts.dndDrop = this.opts.dnd;
      }
      if ( typeof this.opts.dndDrag === 'undefined' ) {
        this.opts.dndDrag = this.opts.dnd;
      }
      if ( typeof this.opts.dndOpts === 'undefined' ) {
        this.opts.dndOpts = {};
      }
      if ( typeof this.opts.focusable === 'undefined' ) {
        this.opts.focusable = true;
      }

      this.init();
      _Count++;
    };
  })();

  /**
   * Initializes the GUI Element
   *
   * @return  DOMElement    The outer container of created element
   *
   * @method  GUIElement::init()
   */
  GUIElement.prototype.init = function(className, tagName) {
    tagName = tagName || 'div';
    if ( !this.tagName ) {
      this.tagName = tagName;
    }
    if ( !this.className ) {
      this.className = className;
    }

    var self = this;

    var classNames = [
      'GUIElement',
      'GUIElement_' + this.id,
      Utils.$safeName(className),
      Utils.$safeName(this.name)
    ];

    this.$element = document.createElement(tagName);
    this.$element.className = classNames.join(' ');

    if ( this.opts.dnd && this.opts.dndDrop && OSjs.Compability.dnd ) {
      var opts = this.opts.dndOpts;
      opts.onItemDropped = function(ev, el, item) {
        return self.onItemDropped.call(self, ev, el, item);
      };
      opts.onFilesDropped = function(ev, el, files) {
        return self.onFilesDropped.call(self, ev, el, files);
      };

      OSjs.API.createDroppable(this.$element, opts);
    }

    if ( this.opts.focusable ) {
      this._addEventListener(this.$element, 'mousedown', function(ev) {
        self._onFocus(ev);
      });
    }

    return this.$element;
  };

  /**
   * When element receives update event
   *
   * Normally received on Window::_init()
   *
   * @param   boolean     force       Force update?
   *
   * @return  void
   *
   * @method  GUIElement::update()
   */
  GUIElement.prototype.update = function(force) {
    this.inited = true;
  };

  /**
   * Destroys the GUI Element
   *
   * @return  void
   *
   * @method  GUIElement::destroy()
   */
  GUIElement.prototype.destroy = function() {
    if ( this.destroyed ) { return; }

    console.debug('GUIElement::destroy()', this.name);
    if ( _PreviousGUIElement && _PreviousGUIElement.id !== this.id ) {
      _PreviousGUIElement = null;
    }

    var self = this;
    if ( this._window ) {
      this._children.forEach(function(id) {
        self._window._removeGUIElement(id);
      });
    }

    this.destroyed = true;
    this._fireHook('destroy');
    if ( this.$element && this.$element.parentNode ) {
      this.$element.parentNode.removeChild(this.$element);
    }
    this.$element = null;
    this._hooks = {};
    this._window = null;
    this._parent = null;
    this._children = [];
  };

  /**
   * Adds a listener for an event
   *
   * @param   DOMElement    el          DOM Element to attach event to
   * @param   String        ev          DOM Event Name
   * @param   Function      callback    Callback on event
   *
   * @return  void
   *
   * @method  GUIElement::_addEventListener()
   */
  GUIElement.prototype._addEventListener = function(el, ev, callback) {
    el.addEventListener(ev, callback, false);

    this._addHook('destroy', function() {
      el.removeEventListener(ev, callback, false);
    });
  };

  /**
   * Adds a hook (internal events)
   *
   * @param   String    k       Hook name: focus, blur, destroy
   * @param   Function  func    Callback function
   *
   * @return  void
   *
   * @method  GUIElement::_addHook()
   */
  GUIElement.prototype._addHook = function(k, func) {
    if ( typeof func === 'function' && this._hooks[k] ) {
      this._hooks[k].push(func);
    }
  };

  /**
   * Fire a hook (internal event)
   *
   * @param   String    k       Hook name: focus, blur, destroy
   *
   * @return  void
   *
   * @method  GUIElement::_fireHook()
   */
  GUIElement.prototype._fireHook = function(k, args) {
    var self = this;
    args = args || {};
    if ( this._hooks[k] ) {
      this._hooks[k].forEach(function(hook, i) {
        if ( hook ) {
          try {
            hook.apply(self, args);
          } catch ( e ) {
            console.warn('GUIElement::_fireHook() failed to run hook', k, i, e);
            console.warn(e.stack);
          }
        }
      });
    }
  };

  /**
   * Get root DOM Element
   *
   * @return  DOMElement    The outer container
   *
   * @method  GUIElement::getRoot()
   */
  GUIElement.prototype.getRoot = function() {
    return this.$element;
  };

  /**
   * Event for DnD
   *
   * @param   DOMEvent      ev      DOM Event
   *
   * @return  boolean
   *
   * @method  GUIElement::onDndDrop()
   */
  GUIElement.prototype.onDndDrop = function(ev) {
    return true;
  };

  /**
   * Event for Key Press
   *
   * @param   DOMEvent      ev      DOM Event
   *
   * @see     OSjs.Core.Window::_onKeyEvent
   * @return  boolean
   *
   * @method  GUIElement::onGlobalKeyPress()
   */
  GUIElement.prototype.onGlobalKeyPress = function(ev) {
    if ( this.hasCustomKeys ) { return false; }
    if ( !this.focused ) { return false; }

    // CTRL+C
    if ( ev.keyCode === 67 && ev.ctrlKey ) {
      var clip = this.onClipboardRequest('get', ev);
      if ( clip !== null ) {
        API.setClipboard(clip);
      }
      return true;
    }


    if ( !this.opts.onKeyPress ) { return false; }

    this.opts.onKeyPress.call(this, ev);

    return true;
  };

  /**
   * Event for Clipboard data request
   *
   * Normally called when CTRL+C or CTRL+V etc.
   * is used
   *
   * @param   String    type      Request type (get/put)
   * @param   DOMEvent  ev        Event
   *
   * @return  Mixed               get returns data, put returns null
   * @method  GUIElement::onClipboardRequest()
   */
  GUIElement.prototype.onClipboardRequest = function(type, ev) {
    console.debug('GUIElement::onClipboardRequest()', type, ev);
    return null;
  };

  /**
   * Event for Key Release
   *
   * @param   DOMEvent      ev      DOM Event
   *
   * @see     OSjs.Core.Window::_onKeyEvent
   * @return  boolean
   *
   * @method  GUIElement::onKeyUp()
   */
  GUIElement.prototype.onKeyUp = function(ev) {
    if ( this.hasCustomKeys ) { return false; }
    if ( !this.focused ) { return false; }
    if ( !this.opts.onKeyUp ) { return false; }

    this.opts.onKeyUp.call(this, ev);

    return true;
  };

  /**
   * Event for focus
   *
   * @param   DOMEvent      ev      DOM Event
   *
   * @return  boolean
   *
   * @method  GUIElement::_onFocus()
   */
  GUIElement.prototype._onFocus = function(ev) {
    ev.stopPropagation();
    OSjs.API.blurMenu();

    this.focus();
    this._onFocusWindow.call(this, ev);
  };

  /**
   * Set focus to the GUI Element
   *
   * @return  boolean
   *
   * @method  GUIElement::focus()
   */
  GUIElement.prototype.focus = function() {
    if ( !this.opts.focusable ) { return false; }
    if ( this.focused ) { return false; }
    if ( _PreviousGUIElement && _PreviousGUIElement.id !== this.id ) {
      _PreviousGUIElement.blur();
    }
    console.debug('GUIElement::focus()', this.id, this.name);
    this.focused = true;
    this._fireHook('focus');
    _PreviousGUIElement = this;
    return true;
  };

  /**
   * Unset focus for the GUI Element
   *
   * @return  boolean
   *
   * @method  GUIElement::blur()
   */
  GUIElement.prototype.blur = function() {
    if ( !this.opts.focusable ) { return false; }
    if ( !this.focused ) { return false; }
    console.debug('GUIElement::blur()', this.id, this.name);
    this.focused = false;
    this._fireHook('blur');
    return true;
  };

  /**
   * Set what Window we belong to
   *
   * @param   Window    w       The Window
   *
   * @return  void
   *
   * @method  GUIElement::_setWindow()
   */
  GUIElement.prototype._setWindow = function(w) {
    this.wid      = w._wid;
    this._window  = w;

    this._onFocusWindow = function() {
      w._focus();
    };
  };

  /**
   * Sets the tabindex
   *
   * @param   int     i       Tab index (0+)
   *
   * @return  void
   *
   * @method  GUIElement::_setTabIndex()
   */
  GUIElement.prototype._setTabIndex = function(i) {
    if ( !this.hasTabIndex ) { return; }

    this.tabIndex = parseInt(i, 10) || -1;
    if ( this.$element ) {
      this.$element.setAttribute('data-tabindex', this.tabIndex.toString());
    }
  };

  /**
   * Add a child GUIElement
   *
   * @param   String      id        GUIElement id
   * @return  void
   * @method  GUIElement::_addChild()
   */
  GUIElement.prototype._addChild = function(id) {
    if ( this._children.indexOf(id) < 0 ) {
      this._children.push(id);
    }
  };

  /**
   * Remove a child GUIElement
   *
   * @param   String      id        GUIElement id
   * @return  void
   * @method  GUIElement::_removeChild()
   */
  GUIElement.prototype._removeChild = function(id) {
    var idx = this._children.indexOf(id);
    if ( idx >= 0 ) {
      this._children = this._children.splice(idx, 1);
    }
  };

  /**
   * Gets the list of GUIElement children (ids)
   *
   * @return  Array
   * @method  GUIElement::_getChildren()
   */
  GUIElement.prototype._getChildren = function() {
    return this._children;
  };

  /**
   * Set the parent GUIElement id of this instance
   *
   * @param   String    id      GUIElement id
   * @return  void
   * @method  GUIElement::_setParent()
   */
  GUIElement.prototype._setParent = function(id) {
    this._parent = id;
  };

  /**
   * Get the parent GUIElement id of this instance
   * @return  String
   * @method  GUIElement::_getParent()
   */
  GUIElement.prototype._getParent = function() {
    return this._parent;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.GUIElement       = GUIElement;

})(OSjs.API, OSjs.Utils);
