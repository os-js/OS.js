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
   * SelectList
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @see OSjs.GUI._Input
   * @api OSjs.GUI.SelectList
   *
   * @extends _Input
   * @class
   */
  var SelectList = function(name, opts) {
    _Input.apply(this, ['GUISelectList', 'select', name, opts]);
  };

  SelectList.prototype = Object.create(_Input.prototype);

  SelectList.prototype.init = function() {
    var el = _Input.prototype.init.apply(this, [this.className]);

    this.$input.multiple = 'multiple';

    return el;
  };

  /**
   * Add a list of items
   *
   * @param   Array     items     List of items
   *
   * @return  void
   *
   * @see     SelectList::addItem()
   *
   * @method  SelectList::addItems()
   */
  SelectList.prototype.addItems = function(items) {
    for ( var i in items ) {
      if ( items.hasOwnProperty(i) ) {
        this.addItem(i, items[i]);
      }
    }
  };

  /**
   * Add a item to the list
   *
   * @param   Mixed   value       The value
   * @param   String  label       The label
   *
   * @return  void
   *
   * @method  SelectList::addItem()
   */
  SelectList.prototype.addItem = function(value, label) {
    var el        = document.createElement('option');
    el.value      = value;
    el.appendChild(document.createTextNode(label));
    this.$input.appendChild(el);
  };

  /**
   * Alias of setValue()
   *
   * @see     SelectList::setSelected()
   * @method  SelectList::setValue()
   */
  SelectList.prototype.setValue = function(val) {
    this.setSelected(val);
  };

  /**
   * Set the currently selected item/value
   *
   * @param   Mixed     val   The value of added item
   *
   * @return  boolean         If it was selected
   *
   * @method  SelectList::setSelected()
   */
  SelectList.prototype.setSelected = function(val) {
    if ( !this.$input ) { return; }

    var sel = [];
    if ( val instanceof Array ) {
      sel = val;
    } else {
      sel = [val];
    }

    var i = 0;
    var l = this.$input.childNodes.length;
    for ( i; i < l; i++ ) {
      this.$input.childNodes[i].removeAttribute('selected');
      if ( OSjs.Utils.inArray(sel, this.$input.childNodes[i].value) ) {
        this.$input.childNodes[i].setAttribute('selected', 'selected');
      }
    }
  };

  /**
   * Gets selected values
   *
   * @return  Array
   *
   * @method  SelectList::getValue()
   */
  SelectList.prototype.getValue = function() {
    var selected = [];
    if ( this.$input ) {
      var i = 0;
      var l = this.$input.childNodes.length;
      for ( i; i < l; i++ ) {
        if ( this.$input.childNodes[i].selected ) {
          selected.push(this.$input.childNodes[i].value);
        }
      }
    }
    return selected;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.SelectList   = SelectList;

})(OSjs.GUI.GUIElement, OSjs.GUI._Input);
