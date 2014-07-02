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

  /**
   * Menu class
   */
  var Menu = function(menuList) {
    var self = this;

    var _onclick = function(ev, func) {
      func = func || function() { console.warn("Warning -- you forgot to implement a handler"); };
      if ( !func(ev) ) {
        OSjs.GUI.blurMenu();
      }
    };

    var _createMenu = function(list) {
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
        var m, img, span, arrow, sub;
        for ( var i = 0, l = list.length; i < l; i++ ) {
          m           = document.createElement('li');
          m.className = '';

          if ( !list[i].name ) {
            list[i].name = ((''+list[i].title) || '').replace(/\s/, '_');
          }

          if ( list[i].name ) {
            m.className = 'MenuItem_' + list[i].name;
          }

          if ( typeof list[i].onCreate === 'function' ) {
            list[i].onCreate(m, list[i]);
          } else {
            if ( list[i].tooltip ) {
              m.title = list[i].tooltip;
            }
            if ( list[i].icon ) {
              img     = document.createElement('img');
              img.alt = '';
              img.src = OSjs.API.getThemeResource(list[i].icon, 'icon');
              m.appendChild(img);
            }

            span            = document.createElement('span');
            span.appendChild(document.createTextNode(list[i].title));
            m.appendChild(span);

            if ( list[i].disabled ) {
              m.className += ' Disabled';
            }
          }

          if ( list[i].menu ) {
            m.className += ' HasSubMenu';

            arrow           = document.createElement('div');
            arrow.className = 'Arrow';

            sub = _createMenu(list[i].menu);
            m.appendChild(sub);
            m.appendChild(arrow);

            m.onmouseover = (function(s) {
              return function(ev) {
                var elem = this;
                setTimeout(function() {
                  self.show(elem, s);
                }, 0);
              };
            })(sub);
          } else {
            m.onclick = (function(ref) {
              return function(ev) {
                if ( this.className.match(/Disabled/) ) { return; }
                if ( this.getAttribute("disabled") == "disabled" ) { return; }

                _onclick(ev, ref.onClick);
              };
            })(list[i]);
          }

          ul.appendChild(m);
        }

        el.appendChild(ul);
      }

      return el;
    };

    this.$element = _createMenu(menuList);
  };

  Menu.prototype.destroy = function() {
    if ( this.$element ) {
      var ul = this.$element.getElementsByTagName('UL')[0];
      if ( ul ) {
        var i = 0, l = ul.childNodes.length;
        for ( i; i < l; i++ ) {
          ul.childNodes[i].onclick = null;
          ul.childNodes[i].onmousedown = null;
        }
      }
      if ( this.$element.parentNode ) {
        this.$element.parentNode.removeChild(this.$element);
      }
    }
    this.$element = null;
  };

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

  Menu.prototype.getRoot = function() {
    return this.$element;
  };

  Menu.prototype.setItemDisabled = function(name, d) {
    var root = this.getRoot();
    var el = root.getElementsByClassName("MenuItem_" + name);
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

  var _MENU;
  OSjs.GUI.createMenu = function(items, pos) {
    items = items || [];
    pos = pos || {x: 0, y: 0};

    OSjs.GUI.blurMenu();

    _MENU = new Menu(items);
    _MENU.show(pos);
    return _MENU;
  };
  OSjs.GUI.blurMenu   = function() {
    if ( _MENU ) {
      _MENU.destroy();
      _MENU = null;
    }
  };

})();
