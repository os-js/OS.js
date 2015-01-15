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
(function(GUIElement, _Input) {
  'use strict';

  /**
   * Textarea
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @see OSjs.GUI._Input
   * @api OSjs.GUI.Textarea
   *
   * @extends _Input
   * @class
   */
  var Textarea = function(name, opts) {
    opts = opts || {};

    this.$area = null;
    this.strLen = 0;

    _Input.apply(this, ['GUITextarea', 'textarea', name, opts]);
  };

  Textarea.prototype = Object.create(_Input.prototype);

  Textarea.prototype.init = function() {
    var self = this;
    var el = _Input.prototype.init.apply(this, ['GUITextarea']);

    this._addEventListener(this.$input, 'keypress', function(ev) {
      var cur = this.value.length;
      self.hasChanged = (cur !== self.strLen);
    });

    this._addEventListener(this.$input, 'keydown', function(e) {
      if ( e.keyCode === OSjs.Utils.Keys.TAB ) {
        var start = this.selectionStart;
        var end = this.selectionEnd;
        var target = e.target;
        var value = target.value;

        target.value = value.substring(0, start) + '\t' + value.substring(end);

        this.selectionStart = this.selectionEnd = start + 1;
        e.preventDefault();
      }
    });

    return el;
  };

  /**
   * Alias of SetText()
   *
   * @see Textarea::setText()
   * @method Textarea::setValue()
   */
  Textarea.prototype.setValue = function(t) {
    return this.setText(t);
  };

  /**
   * Sets the value
   *
   * @param   String      t       The text
   *
   * @return  void
   *
   * @method  Textarea::setText()
   */
  Textarea.prototype.setText = function(t) {
    this.hasChanged = false;
    if ( this.$input ) {
      this.$input.value = (t || '');
      this.strLen = this.$input.value.length;
      return true;
    }
    return false;
  };

  /**
   * Alias of getText()
   *
   * @see Textarea::getText()
   * @method Textarea::getValue()
   */
  Textarea.prototype.getValue = function() {
    return this.getText();
  };

  /**
   * Gets the value
   *
   * @return  String
   *
   * @method  TextArea::getText()
   */
  Textarea.prototype.getText = function() {
    return this.$input ? this.$input.value : '';
  };

  /**
   * Focus the input element
   *
   * @return  boolean     On success
   *
   * @method  Textarea::focus()
   */
  Textarea.prototype.focus = function() {
    if ( !GUIElement.prototype.focus.apply(this, arguments) ) { return false; }
    if ( this.$input ) { this.$input.focus(); }
    return true;
  };

  /**
   * Blur the input element
   *
   * @return  boolean     On success
   *
   * @method  Textarea::blur()
   */
  Textarea.prototype.blur = function() {
    if ( !GUIElement.prototype.blur.apply(this, arguments) ) { return false; }
    if ( this.$input ) { this.$input.blur(); }
    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Textarea     = Textarea;

})(OSjs.GUI.GUIElement, OSjs.GUI._Input);
