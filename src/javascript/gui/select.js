/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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
   * Select
   *
   * options: (See _Input for more)
   */
  var Select = function(name, opts) {
    _Input.apply(this, ['GUISelect', 'select', name, opts]);
  };

  Select.prototype = Object.create(_Input.prototype);

  Select.prototype.addItems = function(items) {
    for ( var i in items ) {
      if ( items.hasOwnProperty(i) ) {
        this.addItem(i, items[i]);
      }
    }
  };

  Select.prototype.addItem = function(value, label) {
    var self      = this;
    var el        = document.createElement('option');
    el.value      = value;
    el.appendChild(document.createTextNode(label));
    this.$input.appendChild(el);
  };

  Select.prototype.setValue = function(val) {
    this.setSelected(val);
  };

  Select.prototype.setSelected = function(val) {
    var i = 0;
    var l = this.$input.childNodes.length;
    var found = false;

    for ( i; i < l; i++ ) {
      if ( i === val || this.$input.childNodes[i].value === val ) {
        found = i;
        break;
      }
    }

    if ( found !== false ) {
      this.$input.selectedIndex = found;
      this.value = found;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Select       = Select;

})(OSjs.GUI.GUIElement, OSjs.GUI._Input);
