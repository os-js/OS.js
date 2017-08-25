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
import Translations from './locales';
import PanelItem from './panelitem';

const _ = OSjs.require('core/locales').createLocalizer(Translations);
const DOM = OSjs.require('utils/dom');
const Events = OSjs.require('utils/events');
const Menu = OSjs.require('gui/menu');
const WindowManager = OSjs.require('core/window-manager');

/*eslint valid-jsdoc: "off"*/

const PANEL_SHOW_TIMEOUT = 150;
const PANEL_HIDE_TIMEOUT = 600;

export default class Panel {

  constructor(name, options, wm) {
    options = options || {};

    this._name = name;
    this._$element = null;
    this._$container = null;
    this._items = [];
    this._outtimeout = null;
    this._intimeout = null;
    this._options = options.mergeDefaults({
      position: 'top'
    });

    console.debug('Panel::construct()', this._name, this._options.get());
  }

  init(root) {
    var wm = WindowManager.instance;

    function createMenu(ev) {
      var menu = [
        {title: _('Open Panel Settings'), onClick: function(ev) {
          wm.showSettings('panel');
        }}
      ];

      if ( wm.getSetting('useTouchMenu') === true ) {
        menu.push({
          title: _('Turn off TouchMenu'),
          onClick: function(ev) {
            wm.applySettings({useTouchMenu: false}, false, true);
          }
        });
      } else {
        menu.push({
          title: _('Turn on TouchMenu'),
          onClick: function(ev) {
            wm.applySettings({useTouchMenu: true}, false, true);
          }
        });
      }

      Menu.create(menu, ev);
    }

    this._$container = document.createElement('corewm-panel-container');
    this._$element = document.createElement('corewm-panel');
    this._$element.setAttribute('data-orientation', 'horizontal');
    this._$element.setAttribute('role', 'toolbar');

    /*Utils.$bind(this._$element, 'mousedown', function(ev) {
      ev.preventDefault();
    }); // This makes DnD not work in panel items*/
    Events.$bind(this._$element, 'mouseover', (ev) => {
      this.onMouseOver(ev);
    });
    Events.$bind(this._$element, 'mouseout', (ev) => {
      this.onMouseOut(ev);
    });
    Events.$bind(this._$element, 'contextmenu', function(ev) {
      createMenu(ev);
    });

    Events.$bind(document, 'mouseout:panelmouseleave', (ev) => {
      this.onMouseLeave(ev);
    }, false);

    this._$element.appendChild(this._$container);
    root.appendChild(this._$element);

    setTimeout(() => this.update(), 0);
  }

  destroy() {
    this._clearTimeouts();

    Events.$unbind(document, 'mouseout:panelmouseleave');
    Events.$unbind(this._$element);

    this._items.forEach(function(item) {
      item.destroy();
    });
    this._items = [];
    this._$element = DOM.$remove(this._$element);
    this._$container = null;
  }

  update(options) {
    options = options || this._options.get();

    // CSS IS SET IN THE WINDOW MANAGER!
    var attrs = {
      ontop: !!options.ontop,
      position: options.position || 'bottom'
    };

    if ( options.autohide ) {
      this.onMouseOut();
    }
    if ( this._$element ) {
      Object.keys(attrs).forEach((k) => {
        this._$element.setAttribute('data-' + k, typeof attrs[k] === 'boolean' ? (attrs[k] ? 'true' : 'false') : attrs[k]);
      });
    }
    this._options.set(null, options);
  }

  autohide(hide) {
    if ( !this._options.get('autohide') || !this._$element ) {
      return;
    }

    if ( hide ) {
      this._$element.setAttribute('data-autohide', 'true');
    } else {
      this._$element.setAttribute('data-autohide', 'false');
    }
  }

  _clearTimeouts() {
    if ( this._outtimeout ) {
      clearTimeout(this._outtimeout);
      this._outtimeout = null;
    }
    if ( this._intimeout ) {
      clearTimeout(this._intimeout);
      this._intimeout = null;
    }
  }

  onMouseLeave(ev) {
    var from = ev.relatedTarget || ev.toElement;
    if ( !from || from.nodeName === 'HTML' ) {
      this.onMouseOut(ev);
    }
  }

  onMouseOver() {
    this._clearTimeouts();
    this._intimeout = setTimeout(() => {
      this.autohide(false);
    }, PANEL_SHOW_TIMEOUT);
  }

  onMouseOut() {
    this._clearTimeouts();
    this._outtimeout = setTimeout(() => {
      this.autohide(true);
    }, PANEL_HIDE_TIMEOUT);
  }

  addItem(item) {
    if ( !(item instanceof PanelItem) ) {
      throw 'Expected a PanelItem in Panel::addItem()';
    }

    this._items.push(item);
    this._$container.appendChild(item.init());
  }

  isAutoHidden() {
    if ( this._$element ) {
      return this._$element.getAttribute('data-autohide') === 'true';
    }

    return false;
  }

  getItemByType(type) {
    return this.getItem(type);
  }

  getItemsByType(type) {
    return this.getItem(type, true);
  }

  getItem(type, multiple) {
    var result = multiple ? [] : null;

    this._items.forEach(function(item, idx) {
      if ( item instanceof type ) {
        if ( multiple ) {
          result.push(item);
        } else {
          result = item;
          return false;
        }
      }
      return true;
    });

    return result;
  }

  getOntop() {
    return this._options.get('ontop');
  }

  getPosition(pos) {
    return pos ? (this._options.get('position') === pos) : this._options.get('position');
  }

  getAutohide() {
    return this._options.get('autohide');
  }

  getRoot() {
    return this._$element;
  }

  getHeight() {
    return this._$element ? this._$element.offsetHeight : 0;
  }
}
