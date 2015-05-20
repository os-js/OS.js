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
(function(GUIElement, API, Utils) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};

  /////////////////////////////////////////////////////////////////////////////
  // CLASS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * HTML Input Element Wrapper
   *
   * @param   String      className     The element className
   * @param   String      tagName       The element tagName
   * @param   String      name          The element name
   * @param   Object      opts          A list of options
   *
   * @option  opts  disabled        bool          HTML Input disabled ?
   * @option  opts  value           String        HTML Input value
   * @option  opts  label           String        Label value
   * @option  opts  placeholder     String        Placeholder value (HTML5)
   * @option  opts  onChange        Function      Callback - When value changed
   * @option  opts  onClick         Function      Callback - When clicked
   * @option  opts  onKeyPress      Function      Callback - When key pressed
   * @option  opts  onKeyUp         Function      Callback - When key released
   * @option  opts  onMouseDown     Function      Callabck - When mouse is pressed
   * @option  opts  onMouseUp       Function      Callback - When mouse is released
   *
   * @api OSjs.GUI._Input
   *
   * @class
   */
  var _Input = function(className, tagName, name, opts) {
    opts = Utils.argumentDefaults(opts, {
      disabled: false,
      value: '',
      label: '',
      placeholder: '',
      onClick: function() {},
      onChange: function() {},
      onKeyPress: function() {},
      onKeyUp: function() {},
      onMouseUp: function() {},
      onMouseDown: function() {}
    });
    opts.hasCustomKeys = true;

    this.$input       = null;
    this.type         = tagName === 'input' ? (opts.type || 'text') : null;
    this.disabled     = opts.disabled;
    this.value        = opts.value;
    this.label        = opts.label;
    this.placeholder  = opts.placeholder;
    this.className    = className;
    this.tagName      = tagName;
    this.onChange     = opts.onChange;
    this.onClick      = opts.onClick;
    this.onKeyPress   = opts.onKeyPress;
    this.onKeyUp      = opts.onKeyUp;
    this.onMouseUp    = opts.onMouseUp;
    this.onMouseDown  = opts.onMouseDown;

    GUIElement.apply(this, [name, opts]);
  };

  _Input.prototype = Object.create(GUIElement.prototype);

  /**
   * Destroy and remove Input Element from DOM
   *
   * @return  void
   *
   * @see     GUIElement::destroy();
   * @method  _Input::destroy()
   */
  _Input.prototype.destroy = function() {
    GUIElement.prototype.destroy.apply(this, arguments);
    if ( this.$input && this.$input.parentNode ) {
      this.$input.parentNode.removeChild(this.$input);
      this.$input = null;
    }
  };

  /**
   * Initializes the Input Element
   *
   * Inserts into DOM and attaches events
   *
   * @return  DOMElement
   *
   * @see     GUIElement::init();
   * @method  _Input::init()
   */
  _Input.prototype.init = function() {
    var self = this;
    var el = GUIElement.prototype.init.apply(this, [this.className]);

    function _addPlaceholder($input) {
      if ( self.tagName === 'textarea' || self.type === 'text' || self.type === 'password' ) {
        if ( self.placeholder ) {
          $input.setAttribute('placeholder', self.placeholder);
        }
      }
    }

    function _addKeyEvents($input) {
      if ( self.tagName === 'input' ) {
        if ( self.type === 'text' || self.type === 'password' ) {
          self._addEventListener($input, 'keypress', function(ev) {
            self.onKeyPress.apply(self, [ev]);
          });
          self._addEventListener($input, 'keyup', function(ev) {
            self.onKeyUp.apply(self, [ev]);
          });
        }
      }
    }

    function _addMouseEvents($input) {
      self._addEventListener($input, 'mousedown', function(ev) {
        self.onMouseDown.apply(self, [ev]);
      });
      self._addEventListener($input, 'mouseup', function(ev) {
        self.onMouseUp.apply(self, [ev]);
      });
    }

    function _addInputEvents($input) {
      var evt = self.tagName === 'button' ? 'click' : 'change';
      var evtName = self.tagName === 'button' ? 'onClick' : 'onChange';
      self._addEventListener($input, evt, function(ev) {
        self[evtName].apply(self, [this, ev, self.getValue()]);
      });
    }

    this.$input = document.createElement(this.tagName);
    this.$input.setAttribute('tabindex', '-1');

    if ( this.tagName === 'button' ) {
      if ( this.opts.icon ) {
        var img = document.createElement('img');
        img.alt = '';
        img.src = this.opts.icon;
        this.$input.appendChild(img);
      }

      this.$input.appendChild(document.createTextNode(this.value || this.label));
    } else {
      try {
        this.$input.type = this.type;
      } catch ( e ) {}

      _addPlaceholder(this.$input);
      _addKeyEvents(this.$input);
      _addMouseEvents(this.$input);
    }

    _addInputEvents(this.$input);

    el.appendChild(this.$input);

    this.setDisabled(this.disabled);
    this.setValue(this.value);

    return el;
  };

  /**
   * Blur the input element
   *
   * @return  boolean     On success
   *
   * @method  _Input::blur()
   */
  _Input.prototype.blur = function() {
    if ( GUIElement.prototype.blur.apply(this, arguments) ) {
      if ( this.$input ) {
        this.$input.blur();
        return true;
      }
    }
    return false;
  };

  /**
   * Focus the input element
   *
   * @return  boolean     On success
   *
   * @method  _Input::focus()
   */
  _Input.prototype.focus = function() {
    if ( GUIElement.prototype.focus.apply(this, arguments) ) {
      if ( this.$input ) {
        this.$input.focus();
        return true;
      }
    }
    return false;
  };

  /**
   * This is a special event to make elements
   * behave a bit better
   *
   * @param   DOMEvent      ev      The Event
   *
   * @return  boolean
   *
   * @method  _Input::onGlobalKeypress()
   */
  _Input.prototype.onGlobalKeyPress = function(ev) {
    if ( this.destroyed ) { return false; }
    if ( !this.focused ) { return false; }

    // Simulate click
    if ( this.$input && ev.keyCode === Utils.Keys.SPACE ) {
      if ( this.tagName === 'input' && (this.type === 'checkbox' || this.type === 'radio') ) {
        var e = document.createEvent('MouseEvents');
        e.initEvent('click', true, true);
        this.$input.dispatchEvent(e);
      }
    }

    return GUIElement.prototype.onGlobalKeyPress.apply(this, arguments);
  };

  /**
   * Gets if element is disabled
   *
   * @return  boolean
   *
   * @method  _Input::getDisabled()
   */
  _Input.prototype.getDisabled = function() {
    return this.disabled;
  };

  /**
   * Sets if the element is disabled
   *
   * @param   boolean   d     Disabled
   *
   * @return  void
   *
   * @method  _Input::setDisabled()
   */
  _Input.prototype.setDisabled = function(d) {
    this.disabled = d;
    if ( this.$input && d ) {
      this.$input.setAttribute('disabled', 'disabled');
      Utils.$addClass(this.$element, 'Disabled');
    } else {
      this.$input.removeAttribute('disabled');
      Utils.$removeClass(this.$element, 'Disabled');
    }
  };

  /**
   * Alias of getDisabled()
   *
   * @see _Input::getDisabled()
   *
   * @method _Input::isDisabled()
   */
  _Input.prototype.isDisabled = function() {
    return this.disabled;
  };

  /**
   * Sets the value
   *
   * @param   Mixed     val     The value
   *
   * @return  void
   *
   * @method  _Input::setValue()
   */
  _Input.prototype.setValue = function(val) {
    if ( this.tagName === 'button' ) {
      return;
    }
    this.value = val;
    this.$input.value = val;
  };

  /**
   * Gets the value
   *
   * @return  Mixed     Result depends on input type
   *
   * @method  _Input::getValue()
   */
  _Input.prototype.getValue = function() {
    if ( this.tagName === 'button' ) {
      return null;
    }
    return this.$input.value;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI._Input           = _Input;

})(OSjs.Core.GUIElement, OSjs.API, OSjs.Utils);
