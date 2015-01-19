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
   * Select
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @see OSjs.GUI._Input
   * @api OSjs.GUI.Select
   *
   * @extends _Input
   * @class
   */
  var Select = function(name, opts) {
    _Input.apply(this, ['GUISelect', 'select', name, opts]);
  };

  Select.prototype = Object.create(_Input.prototype);

  /**
   * Add a list of items
   *
   * @param   Array     items     List of items
   *
   * @return  void
   *
   * @see     Select::addItem()
   *
   * @method  Select::addItems()
   */
  Select.prototype.addItems = function(items) {
    var self = this;
    Object.keys(items).forEach(function(i) {
      self.addItem(i, items[i]);
    });
  };

  /**
   * Add a item to the list
   *
   * @param   Mixed   value       The value
   * @param   String  label       The label
   *
   * @return  void
   *
   * @method  Select::addItem()
   */
  Select.prototype.addItem = function(value, label, icon) {
    var self      = this;
    var el        = document.createElement('option');
    el.value      = value;
    el.appendChild(document.createTextNode(label));

    /*
    if ( icon ) {
      el.style.background = OSjs.Utils.format('transparent url({0}) 0px 0px', icon);
    }
    */

    this.$input.appendChild(el);
  };

  /**
   * Alias of setValue()
   *
   * @see     Select::setSelected()
   * @method  Select::setValue()
   */
  Select.prototype.setValue = function(val) {
    return this.setSelected(val);
  };

  /**
   * Set the currently selected item/value
   *
   * @param   Mixed     val   The value of added item
   *
   * @return  boolean         If it was selected
   *
   * @method  Select::setSelected()
   */
  Select.prototype.setSelected = function(val) {
    var found = false;

    this.$input.childNodes.forEach(function(iter, i) {
      if ( i === val || iter.value === val ) {
        found = i;
        return false;
      }
      return true;
    });

    if ( found !== false ) {
      this.$input.selectedIndex = found;
      this.value = found;
      return true;
    }

    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Select       = Select;

})(OSjs.Core.GUIElement, OSjs.GUI._Input);
