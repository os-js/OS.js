/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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

/*eslint valid-jsdoc: "off"*/
import Translations from './locales';

const _ = OSjs.require('core/locales').createLocalizer(Translations);
const Menu = OSjs.require('gui/menu');
const GUI = OSjs.require('utils/gui');
const DOM = OSjs.require('utils/dom');
const Events = OSjs.require('utils/events');
const Process = OSjs.require('core/process');
const Theme = OSjs.require('core/theme');
const WindowManager = OSjs.require('core/window-manager');
const PackageManager = OSjs.require('core/package-manager');

class CategorizedApplicationMenu {

  constructor() {
    var apps = PackageManager.getPackages();
    var wm = WindowManager.instance;
    var cfgCategories = wm.getDefaultSetting('menu');

    function createEvent(iter) {
      return function(el) {
        GUI.createDraggable(el, {
          type: 'application',
          data: {
            launch: iter.name
          }
        });
      };
    }

    function clickEvent(iter) {
      return function() {
        Process.create(iter.name);
      };
    }

    var cats = {};

    Object.keys(cfgCategories).forEach(function(c) {
      cats[c] = [];
    });

    Object.keys(apps).forEach(function(a) {
      var iter = apps[a];
      if ( iter.type === 'application' && iter.visible !== false ) {
        var cat = iter.category && cats[iter.category] ? iter.category : 'unknown';
        cats[cat].push({name: a, data: iter});
      }
    });

    var list = [];
    Object.keys(cats).forEach(function(c) {
      var submenu = [];
      for ( var a = 0; a < cats[c].length; a++ ) {
        var iter = cats[c][a];
        submenu.push({
          title: iter.data.name,
          icon: Theme.getIcon(iter.data.icon, '16x16'),
          tooltip: iter.data.description,
          onCreated: createEvent(iter),
          onClick: clickEvent(iter)
        });
      }

      if ( submenu.length ) {
        list.push({
          title: _(cfgCategories[c].title),
          icon: Theme.getIcon(cfgCategories[c].icon, '16x16'),
          menu: submenu
        });
      }
    });

    this.list = list;
  }

  show(ev) {
    var m = Menu.create(this.list, ev);
    if ( m && m.$element ) {
      DOM.$addClass(m.$element, 'CoreWMDefaultApplicationMenu');
    }
  }

}

class ApplicationMenu {

  constructor() {
    var root = this.$element = document.createElement('gui-menu');
    this.$element.id = 'CoreWMApplicationMenu';

    var apps = PackageManager.getPackages();

    function createEntry(a, iter) {
      var entry = document.createElement('gui-menu-entry');

      var img = document.createElement('img');
      img.src = Theme.getIcon(iter.icon, '32x32');

      var txt = document.createElement('div');
      txt.appendChild(document.createTextNode(iter.name)); //.replace(/([^\s-]{8})([^\s-]{8})/, '$1-$2')));

      Events.$bind(entry, 'click', function(ev) {
        Process.create(a);
      });

      entry.appendChild(img);
      entry.appendChild(txt);
      root.appendChild(entry);
    }

    Object.keys(apps).forEach(function(a) {
      var iter = apps[a];
      if ( iter.type === 'application' && iter.visible !== false ) {
        createEntry(a, iter);
      }
    });
  }

  destroy() {
    if ( this.$element ) {
      this.$element.querySelectorAll('gui-menu-entry').forEach(function(el) {
        Events.$unbind(el, 'click');
      });
      DOM.$remove(this.$element);
    }
    this.$element = null;
  }

  show(pos) {
    if ( !this.$element ) {
      return;
    }

    if ( !this.$element.parentNode ) {
      document.body.appendChild(this.$element);
    }

    // FIXME: This is a very hackish way of doing it and does not work when button is moved!
    DOM.$removeClass(this.$element, 'AtBottom');
    DOM.$removeClass(this.$element, 'AtTop');
    if ( pos.y > (window.innerHeight / 2) ) {
      DOM.$addClass(this.$element, 'AtBottom');

      this.$element.style.top = 'auto';
      this.$element.style.bottom = '30px';
    } else {
      DOM.$addClass(this.$element, 'AtTop');

      this.$element.style.bottom = 'auto';
      this.$element.style.top = '30px';
    }

    this.$element.style.left = pos.x + 'px';
  }

  getRoot() {
    return this.$element;
  }
}

export function showMenu(ev) {
  const wm = WindowManager.instance;

  let inst;
  if ( (wm && wm.getSetting('useTouchMenu') === true) ) {
    inst = new ApplicationMenu();

    var pos = {x: ev.clientX, y: ev.clientY};
    if ( ev.target ) {
      var rect = DOM.$position(ev.target, document.body);
      if ( rect.left && rect.top && rect.width && rect.height ) {
        pos.x = rect.left - (rect.width / 2);

        if ( pos.x <= 16 ) {
          pos.x = 0; // Snap to left
        }

        var panel = DOM.$parent(ev.target, function(node) {
          return node.tagName.toLowerCase() === 'corewm-panel';
        });

        if ( panel ) {
          var prect = DOM.$position(panel);
          pos.y = prect.top + prect.height;
        } else {
          pos.y = rect.top + rect.height;
        }
      }
    }
    Menu.create(null, pos, inst);
  } else {
    inst = new CategorizedApplicationMenu();
    inst.show(ev);
  }
}

