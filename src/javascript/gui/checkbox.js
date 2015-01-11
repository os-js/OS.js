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
(function(_Input, GUIElement) {
  'use strict';

  var _idx = 0;

  /**
   * Checkbox
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @option  opts  String    label       The Label of Element
   *
   * @see OSjs.GUI._Input
   * @api OSjs.GUI.Checkbox
   *
   * @class
   */
  var Checkbox = function(name, opts) {
    opts      = opts || {};
    opts.type = 'checkbox';

    this.label  = opts.label || null;
    this.$label = null;

    _Input.apply(this, ['GUICheckbox', 'input', name, opts]);
  };
  Checkbox.prototype = Object.create(_Input.prototype);

  Checkbox.prototype.init = function() {
    var self = this;
    var el = GUIElement.prototype.init.apply(this, [this.className]);
    var ref = this.opts.group || 'GUICheckbox_' + _idx.toString();

    this.$input       = document.createElement(this.tagName);
    this.$input.type  = this.type;
    this._addEventListener(this.$input, 'change', function(ev) {
      self.onChange.apply(self, [this, ev, self.getValue()]);
    });

    this.$label = document.createElement('label');
    this.$label.appendChild(document.createTextNode(this.label || ''));
    this._addEventListener(this.$label, 'click', function(ev) {
      var e = document.createEvent('MouseEvents');
      e.initEvent('click', true, true);
      self.$input.dispatchEvent(e);
    });

    el.appendChild(this.$input);
    el.appendChild(this.$label);

    this.setDisabled(this.disabled);
    this.setValue(this.value);

    _idx++;

    return el;
  };

  Checkbox.prototype.setChecked = function(val) {
    this.setValue(val);
  };

  Checkbox.prototype.setValue = function(val) {
    this.value = val ? true : false;
    if ( this.value ) {
      this.$input.setAttribute('checked', 'checked');
    } else {
      this.$input.removeAttribute('checked');
    }
  };

  Checkbox.prototype.getValue = function() {
    return this.$input.checked ? true : false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Checkbox     = Checkbox;

})(OSjs.GUI._Input, OSjs.GUI.GUIElement);
