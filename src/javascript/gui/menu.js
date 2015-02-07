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
(function() {
  'use strict';

  /**
   * Menu class
   *
   * Usage:
   *  OSjs.API.createMenu(items, pos);
   *    items = Array
   *    pos   = Object(x:0, y:0)
   *
   * Just provide an array with a collection of tuples containing these parameters:
   *  title       Item title
   *  icon        Item icon
   *  tooltip     Item tooltip
   *  disabled    Initialize as disabled
   *  menu        An array of submenu items
   *  onCreate    Callback when item has been created (usefull for creating custom elements)
   *
   * @api OSjs.GUI.Menu
   *
   * @class
   */
  var Menu = function(menuList) {
    var self = this;

    function _onclick(ev, func) {
      func = func || function() { console.warn('Warning -- you forgot to implement a handler'); };
      if ( !func(ev) ) {
        OSjs.API.blurMenu();
      }
    }

    function _bindMouseOver(m, s) {
      m.onmouseover = function(ev) {
        var elem = this;
        setTimeout(function() {
          self.show(elem, s);
        }, 0);
      };
    }

    function _bindMouseClick(m, ref) {
      m.onclick = function(ev) {
        if ( this.className.match(/Disabled/) ) { return; }
        if ( this.getAttribute('disabled') === 'disabled' ) { return; }

        _onclick(ev, ref.onClick);
      };
    }

    function _createMenu(list) {

      var el          = document.createElement('div');
      el.className    = 'Menu';
      el.oncontextmenu= function(ev) {
        ev.preventDefault();
        return false;
      };
      el.onmousedown  = function(ev) {
        ev.preventDefault();
        return false;
      };

      if ( list ) {
        var ul = document.createElement('ul');

        list.forEach(function(iter, i) {
          var m       = document.createElement('li');
          m.className = '';

          if ( !iter.name ) {
            iter.name = ((''+iter.title) || '').replace(/\s/, '_');
          }

          if ( iter.name ) {
            m.className = 'MenuItem_' + iter.name;
          }

          if ( typeof iter.onCreate === 'function' ) {
            iter.onCreate(m, iter);
          } else {
            if ( iter.tooltip ) {
              m.title = iter.tooltip;
            }
            if ( iter.icon ) {
              var img = document.createElement('img');
              img.alt = '';
              img.src = OSjs.API.getIcon(iter.icon);
              m.appendChild(img);
            }

            var span = document.createElement('span');
            span.appendChild(document.createTextNode(iter.title));
            m.appendChild(span);

            if ( iter.disabled ) {
              m.className += ' Disabled';
            }
          }

          if ( iter.menu ) {
            m.className += ' HasSubMenu';

            var arrow       = document.createElement('div');
            arrow.className = 'Arrow';

            var sub = _createMenu(iter.menu);
            m.appendChild(sub);
            m.appendChild(arrow);

            _bindMouseOver(m, sub);
          } else {
            _bindMouseClick(m, iter);
          }

          ul.appendChild(m);
        });

        el.appendChild(ul);
      }

      return el;
    }

    this.$element = _createMenu(menuList);
  };

  /**
   * Destroy the Menu
   *
   * @return  void
   *
   * @method  Menu::destroy()
   */
  Menu.prototype.destroy = function() {
    if ( this.$element ) {
      var ul = this.$element.getElementsByTagName('UL')[0];
      if ( ul ) {
        ul.childNodes.forEach(function(li, i) {
          li.onclick = null;
          li.onmousedown = null;
        });
      }
      if ( this.$element.parentNode ) {
        this.$element.parentNode.removeChild(this.$element);
      }
    }
    this.$element = null;
  };

  /**
   * Show the Menu
   *
   * @param   Object      pos         The position {x, y}
   * @param   DOMElement  submenu     If this is a submenu, give the dom element
   *
   * @return  void
   *
   * @method  Menu::show()
   */
  Menu.prototype.show = function(pos, submenu) {
    var tw, th, px, py;
    if ( submenu ) {
      var off = OSjs.Utils.$position(submenu);
      if ( off.bottom > window.innerHeight ) {
        submenu.style.top = (window.innerHeight-off.bottom) + 'px';
      }
      if ( off.right > window.innerWidth ) {
        submenu.style.left = (window.innerWidth-off.right) + 'px';
      }
      return;
    }

    this.$element.style.top = -10000 + 'px';
    this.$element.style.left = -10000 + 'px';
    document.body.appendChild(this.$element);

    tw = pos.x + this.$element.offsetWidth;
    th = pos.y + this.$element.offsetHeight;
    px = pos.x;
    py = pos.y;

    if ( tw > window.innerWidth ) {
      px = window.innerWidth - this.$element.offsetWidth;
    }
    this.$element.style.left = px + 'px';

    if ( th > window.innerHeight ) {
      py = window.innerHeight - this.$element.offsetHeight;
    }
    this.$element.style.top = py + 'px';
  };

  /**
   * Get the root DOM Element
   *
   * @return  DOMElement
   *
   * @method  Menu::getRoot()
   */
  Menu.prototype.getRoot = function() {
    return this.$element;
  };

  /**
   * Sets the disabled state of an item
   *
   * @param   String    name      Item name
   * @param   boolean   d         Disabled ?
   *
   * @return  void
   *
   * @method  Menu::setItemDisabled()
   */
  Menu.prototype.setItemDisabled = function(name, d) {
    var root = this.getRoot();
    var el = root.getElementsByClassName('MenuItem_' + name);
    el = (el && el.length) ? el[0] : null;
    if ( el ) {
      if ( d ) {
        OSjs.Utils.$addClass(el, 'Disabled');
      } else {
        OSjs.Utils.$removeClass(el, 'Disabled');
      }
      return true;
    }
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Menu = Menu;

})();
