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

  /**
   * MenuBar Class
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @option  opts    Function    onMenuOpen      Callback when menu is opened
   *
   * @api OSjs.GUI.MenuBar
   * @see OSjs.Core.GUIElement
   *
   * @extends GUIElement
   * @class
   */
  var MenuBar = function(name, opts) {
    opts = opts || {};

    this.$ul        = null;
    this.onMenuOpen = opts.onMenuOpen || function() {};
    this.lid        = 0;
    this.items      = [];

    GUIElement.apply(this, [name, {}]);
  };
  MenuBar.prototype = Object.create(GUIElement.prototype);

  MenuBar.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIMenuBar']);
    this.$ul = document.createElement('ul');
    el.appendChild(this.$ul);
    el.onmousedown = Utils._preventDefault;
    el.oncontextmenu = function(ev) {
      return false;
    };
    return el;
  };

  /**
   * Add an item to the bar
   *
   * @param   Object      item        The item (You can also just use a string here)
   * @param   Array       menu        The submenu items
   *
   * @option  opts  String  title       Item title
   * @option  opts  String  name        Item name (unique)
   * @option  opts  boolean disabled    Is disabled ?
   *
   * @return  void
   *
   * @method  MenuBar::addItem()
   */
  MenuBar.prototype.addItem = function(item, menu, pos) {
    if ( !this.$ul ) { return; }
    var self = this;
    var nitem = {name: '', title: '', disabled: false, element: null};

    if ( typeof item === 'string' ) {
      nitem.title = item;
      nitem.name = item;
    } else {
      nitem.title = item.title || '<undefined>';
      nitem.name = item.name  || nitem.title;
      nitem.disabled = item.disabled === true;
    }

    var el = document.createElement('li');
    el.className = 'MenuItem_' + this.lid;
    el.appendChild(document.createTextNode(nitem.title));
    if ( nitem.disabled ) {
      el.setAttribute('disabled', 'disabled');
    }
    el.onclick = function(ev, mpos) {
      if ( this.hasAttribute('disabled') || this.className.match(/disabled/g) ) {
        return;
      }

      var pos = {x: ev.clientX, y: ev.clientY};
      if ( !mpos ) {
        var tpos = Utils.$position(this);
        if ( tpos ) {
          pos.x = tpos.left;
          //pos.y = tpos.top + (el.offsetHeight || 0);
          pos.y = tpos.top;
        }
      }
      var elm = null;
      if ( menu && menu.length ) {
        elm = OSjs.API.createMenu(menu, pos);
      }
      self.onMenuOpen.call(self, elm, pos, (typeof item === 'string' ? item : nitem), self);
    };

    nitem.element = el;

    this.$ul.appendChild(el);
    this.lid++;
    this.items.push(nitem);
  };

  /**
   * Creates the context menu for given event/click
   *
   * @param   DOMEvent      ev      The event
   * @parm    int           idx     The menubar item index
   *
   * @return  void
   *
   * @method  MenuBar::createContextMenu()
   */
  MenuBar.prototype.createContextMenu = function(ev, idx) {
    this.$ul.childNodes[idx].onclick(ev, true);
  };

  /**
   * Get a menu item
   *
   * @param   String      name      Menu item name (unique)
   *
   * @return  Object                Or null on fail
   *
   * @method  MenuBar::getItem()
   */
  MenuBar.prototype.getItem = function(name) {
    for ( var i = 0; i < this.items.length; i++ ) {
      if ( this.items[i].name === name ) {
        return this.items[i];
      }
    }
    return null;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.MenuBar      = MenuBar;

})(OSjs.Core.GUIElement, OSjs.Utils);
