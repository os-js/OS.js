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
(function(WindowManager, Window, GUI, Utils, API, VFS) {
  'use strict';

  var DefaultCategories = {
    development : {icon: 'categories/package_development.png', title: 'Development'},
    education   : {icon: 'categories/applications-sience.png', title: 'Education'},
    games       : {icon: 'categories/package_games.png',       title: 'Games'},
    graphics    : {icon: 'categories/package_graphics.png',    title: 'Graphics'},
    network     : {icon: 'categories/package_network.png',     title: 'Network'},
    multimedia  : {icon: 'categories/package_multimedia.png',  title: 'Multimedia'},
    office      : {icon: 'categories/package_office.png',      title: 'Office'},
    system      : {icon: 'categories/package_system.png',      title: 'System'},
    utilities   : {icon: 'categories/package_utilities.png',   title: 'Utilities'},
    unknown     : {icon: 'categories/applications-other.png',  title: 'Other'}
  };

  function _createIcon(aiter, aname, arg) {
    return API.getIcon(aiter.icon, arg, aiter);
  }

  /**
   * Create default application menu with categories (sub-menus)
   */
  function doBuildCategoryMenu(ev) {
    var apps = OSjs.Core.getHandler().getApplicationsMetadata();
    var list = [];
    var cats = {};

    var c, a, iter, cat, submenu;

    for ( c in DefaultCategories ) {
      if ( DefaultCategories.hasOwnProperty(c) ) {
        cats[c] = [];
      }
    }

    for ( a in apps ) {
      if ( apps.hasOwnProperty(a) ) {
        iter = apps[a];
        if ( iter.type !== "application" ) { continue; }
        cat = iter.category && cats[iter.category] ? iter.category : 'unknown';
        cats[cat].push({name: a, data: iter})
      }
    }

    for ( c in cats ) {
      if ( cats.hasOwnProperty(c) ) {
        submenu = [];
        for ( a = 0; a < cats[c].length; a++ ) {
          iter = cats[c][a];
          submenu.push({
            title: iter.data.name,
            icon: _createIcon(iter.data, iter.name),
            tooltip : iter.data.description,
            onCreated: (function(name, iter) {
              return function(el) {
                OSjs.API.createDraggable(el, {
                  type   : 'application',
                  data   : {
                    launch: name
                  }
                });
              };
            })(iter.name, iter.data),
            onClick: (function(name, iter) {
              return function() {
                API.launch(name);
              };
            })(iter.name, iter.data)
          });
        }

        if ( submenu.length ) {
          list.push({
            title: OSjs.Applications.CoreWM._(DefaultCategories[c].title),
            icon:  API.getIcon(DefaultCategories[c].icon, '16x16'),
            menu:  submenu
          });
        }
      }
    }

    return list;
  }

  /////////////////////////////////////////////////////////////////////////////
  // NEW MENU
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationMenu() {
    this.$element = document.createElement('div');
    this.$element.id = 'CoreWMApplicationMenu';
    this.$element.className = 'Menu';

    var apps = OSjs.Core.getHandler().getApplicationsMetadata();
    var ul = document.createElement('ul');
    Object.keys(apps).forEach(function(a) {
      var iter = apps[a];
      if ( iter.type === 'application' ) {
        var li = document.createElement('li');
        li.title = iter.description;
        li.onclick = function(ev) {
          API.launch(a);
          OSjs.API.blurMenu(ev);
        };
        li.touchstart = function(ev) {
          API.launch(a);
          OSjs.API.blurMenu(ev);
        };

        var img = document.createElement('img');
        img.src = _createIcon(iter, a, '32x32');

        var txt = document.createElement('div');
        txt.appendChild(document.createTextNode(iter.name.replace(/([^\s-]{6})([^\s-]{6})/, '$1-$2')));

        li.appendChild(img);
        li.appendChild(txt);
        ul.appendChild(li);
      }
    });

    /*
    var ac = document.createElement('div');
    ac.className = 'Pointer';
    this.$element.appendChild(ac);
    */
    this.$element.appendChild(ul);
  }

  ApplicationMenu.prototype.destroy = function() {
    if ( this.$element && this.$element.parentNode ) {
      this.$element.parentNode.removeChild(this.$element);
    }
    this.$element = null;
  };

  ApplicationMenu.prototype.show = function(pos) {
    if ( !this.$element ) { return; }

    if ( !this.$element.parentNode ) {
      document.body.appendChild(this.$element);
    }


    // FIXME: This is a very hackish way of doing it and does not work when button is moved!
    Utils.$removeClass(this.$element, 'AtBottom');
    Utils.$removeClass(this.$element, 'AtTop');
    if ( pos.y > (window.innerHeight/2) ) {
      Utils.$addClass(this.$element, 'AtBottom');

      this.$element.style.top = 'auto';
      this.$element.style.bottom = '30px';
    } else {
      Utils.$addClass(this.$element, 'AtTop');

      this.$element.style.bottom = 'auto';
      this.$element.style.top = '30px';
    }

    this.$element.style.left = pos.x + 'px';
  };

  ApplicationMenu.prototype.getRoot = function() {
    return this.$element;
  };

  /////////////////////////////////////////////////////////////////////////////
  // MENU
  /////////////////////////////////////////////////////////////////////////////

  function doShowMenu(ev) {
    var wm = OSjs.Core.getWindowManager();

    function isTouchDevice() {
      if ( "ontouchstart" in document.documentElement ) {
        return true;
      }
      try {
        if ( document.createEvent("TouchEvent") ) {
          return true;
        }
      } catch ( e ) {}

      var el = document.createElement('div');
      el.setAttribute('ongesturestart', 'return;'); // or try "ontouchstart"
      return typeof el.ongesturestart === "function";
    }

    //if ( isTouchDevice() || (wm && wm.getSetting('useTouchMenu') === true) ) {
    //FIXME
    if ( (wm && wm.getSetting('useTouchMenu') === true) ) {
      var inst = new ApplicationMenu();
      var pos = {x: ev.clientX, y: ev.clientY};
      if ( ev.target ) {
        var target = ev.target;
        if ( target.tagName === 'IMG' ) {
          target = target.parentNode;
        }
        var rect = Utils.$position(target, document.body);
        if ( rect.left && rect.top && rect.width && rect.height ) {
          pos.x = rect.left - (rect.width/2) + 4;
          pos.y = rect.top + rect.height + 4;
        }
      }
      API.createMenu(null, pos, inst);
    } else {
      var list = doBuildCategoryMenu(ev);
      API.createMenu(list, {x: ev.clientX, y: ev.clientY});
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.showMenu          = doShowMenu;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
