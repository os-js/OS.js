"use strict";
/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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
(function() {
  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};

  /**
   * Textarea
   *
   * options: (See _Input for more)
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

    this._addEvent(this.$input, 'onkeypress', function(ev) {
      var cur = this.value.length;
      self.hasChanged = (cur != self.strLen);
    });

    return el;
  };

  Textarea.prototype.setValue = function(t) {
    return this.setText(t);
  };

  Textarea.prototype.setText = function(t) {
    this.hasChanged = false;
    if ( this.$input ) {
      this.$input.value = (t || '');
      this.strLen = this.$input.value.length;
      return true;
    }
    return false;
  };

  Textarea.prototype.getValue = function() {
    return this.getText();
  };

  Textarea.prototype.getText = function() {
    return this.$input ? this.$input.value : '';
  };

  Textarea.prototype.focus = function() {
    if ( !GUIElement.prototype.focus.apply(this, arguments) ) { return false; }
    if ( this.$input ) { this.$input.focus(); }
    return true;
  };

  Textarea.prototype.blur = function() {
    if ( !GUIElement.prototype.blur.apply(this, arguments) ) { return false; }
    if ( this.$input ) { this.$input.blur(); }
    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Textarea     = Textarea;

})();
