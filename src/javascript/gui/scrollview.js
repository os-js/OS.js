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
(function(GUIElement) {
  'use strict';

  /**
   * ScrollView
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @option  opts  int   scrollX   Scroll X ? (default=true)
   * @option  opts  int   scrollY   Scroll Y ? (default=true)
   *
   * @see OSjs.Core.GUIElement
   * @api OSjs.GUI.ScrollView
   *
   * @extends GUIElement
   * @class
   */
  var ScrollView = function(name, opts) {
    opts      = opts || {};

    if ( typeof opts.scrollX === 'undefined' ) {
      opts.scrollX = true;
    }
    if ( typeof opts.scrollY === 'undefined' ) {
      opts.scrollY = true;
    }

    GUIElement.apply(this, [name, opts]);
  };
  ScrollView.prototype = Object.create(GUIElement.prototype);

  ScrollView.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIScrollView']);
    return el;
  };

  ScrollView.prototype.update = function() {
    if ( this.inited ) { return; }
    GUIElement.prototype.update.apply(this, arguments);

    this.setScroll(this.opts.scrollX, this.opts.scrollY);
  };

  /**
   * Add a DOM Element to the view
   *
   * @param   DOMElement    el        The dom element
   * @param   boolean       clear     Clear before adding this element?
   *
   * @return  void
   *
   * @method  ScrollView::addElement()
   */
  ScrollView.prototype.addElement = function(el, clear) {
    if ( clear ) {
      OSjs.Utils.$empty(this.$element);
    }
    this.$element.appendChild(el);
  };

  /**
   * Sets scroll directions
   *
   * @param   boolean   x     Horizontal
   * @param   boolean   y     Vertical
   *
   * @return  void
   *
   * @method  ScrollView::setScroll()
   */
  ScrollView.prototype.setScroll = function(x, y) {
    var classNames = ['GUIScrollView', OSjs.Utils.$safeName(this.name)];
    if ( x ) { classNames.push('ScrollX'); }
    if ( y ) { classNames.push('ScrollY'); }

    this.opts.scrollX = x;
    this.opts.scrollY = y;

    this.getRoot().className = classNames.join(' ');
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.ScrollView   = ScrollView;

})(OSjs.Core.GUIElement);
