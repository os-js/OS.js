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
(function(GUIElement, Utils) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // BOX
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Flex Box Class
   *
   * Use this to create flexible column/row layouts
   * without having to set element positions and sizes with CSS
   *
   * This is a private class
   *
   * @api OSjs.GUI.Box
   * @class
   */
  function Box(type, name, opts) {
    opts = opts || {};

    this.type = type;
    this.elements = [];
    this.onInserted = opts.onInserted || function() {};

    GUIElement.apply(this, [name, opts]);
  }

  Box.prototype = Object.create(GUIElement.prototype);

  Box.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIBox']);
    Utils.$addClass(el, this.type);
    return el;
  };

  Box.prototype.destroy = function() {
    GUIElement.prototype.destroy.apply(this, arguments);
    this.elements = [];
  };

  /**
   * Insert a row/column into the Flex Box
   *
   * @param   String    name      Name of item (unique)
   * @param   int       grow      (Optional) Grow factor (null=default)
   * @param   int       shrink    (Optional) Shrink factor (null=default)
   * @param   String    basis     (Optional) Basis (static width/height or 'auto')
   * @param   Object    opts      (Optional) Options
   *
   * @option  opts      boolean   fill        Should the child item fill/strecth the entire space?
   * @option  opts      Strign    flex        Manual flex CSS style (overrides function arguments)
   *
   * @method  Box::insert()
   * @return  DOMElement          The row or column
   */
  Box.prototype.insert = function(name, grow, shrink, basis, opts) {
    opts = opts || {};
    var classNames = [];

    if ( typeof grow !== 'number' ) { grow = 1; }
    if ( typeof shrink !== 'number' ) { shrink = 1; }
    if ( !basis ) { basis = 'auto'; }

    if ( opts.fill === true ) {
      classNames.push('Fill');
    }

    var el = document.createElement('div');
    el.className = classNames.join(' ');

    var flex = opts.flex;
    if ( !flex ) {
      flex = Utils.format('{0} {1} {2}', grow.toString(), shrink.toString(), basis);
    }

    el.style['webkitFlex'] = flex;
    el.style['mozFflex'] = flex;
    el.style['msFflex'] = flex;
    el.style['oFlex'] = flex;
    el.style['flex'] = flex;

    this.$element.appendChild(el);

    this.elements.push({
      opts: opts,
      el: el
    });

    if ( typeof this.onInserted === 'function' ) {
      this.onInserted(el, opts);
    }

    return el;
  };

  /////////////////////////////////////////////////////////////////////////////
  // HBOX
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Horizontal (column) Flex Box
   *
   * @see OSjs.GUI.Box
   * @api OSjs.GUI.HBox
   * @extends OSjs.GUI.Box
   * @class
   */
  function HBox(name, opts) {
    Box.apply(this, ['GUIHBox', name, opts]);
  }
  HBox.prototype = Object.create(Box.prototype);

  /////////////////////////////////////////////////////////////////////////////
  // VBOX
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Vertical (row) Flex Box
   *
   * @see OSjs.GUI.Box
   * @api OSjs.GUI.VBox
   * @extends OSjs.GUI.Box
   * @class
   */
  function VBox(name, opts) {
    Box.apply(this, ['GUIVBox', name, opts]);
  }
  VBox.prototype = Object.create(Box.prototype);

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.VBox = VBox;
  OSjs.GUI.HBox = HBox;

})(OSjs.Core.GUIElement, OSjs.Utils);
