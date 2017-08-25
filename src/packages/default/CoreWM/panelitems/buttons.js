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
import PanelItem from '../panelitem';

const GUI = OSjs.require('utils/gui');
const Menu = OSjs.require('gui/menu');
const DOM = OSjs.require('utils/dom');
const Init = OSjs.require('core/init');
const Theme = OSjs.require('core/theme');
const Events = OSjs.require('utils/events');
const Locales = OSjs.require('core/locales');
const Process = OSjs.require('core/process');
const PackageManager = OSjs.require('core/package-manager');
const WindowManager = OSjs.require('core/window-manager');

/////////////////////////////////////////////////////////////////////////////
// ITEM
/////////////////////////////////////////////////////////////////////////////

/**
 * PanelItem: Buttons
 */
export default class PanelItemButtons extends PanelItem {
  constructor(settings) {
    super('PanelItemButtons', 'Buttons', settings, {
      buttons: [
        {
          title: Locales._('LBL_SETTINGS'),
          icon: 'categories/applications-system.png',
          launch: 'ApplicationSettings'
        }
      ]
    });
  }

  init() {
    const root = super.init(...arguments);

    this.renderButtons();

    let ghost, lastTarget;

    function clearGhost(inner) {
      ghost = DOM.$remove(ghost);
      if ( !inner ) {
        lastTarget = null;
      }
    }

    function createGhost(target) {
      const isUl = target.tagName === 'UL';
      if ( !target || lastTarget === target || isUl ) {
        return;
      }

      const ul = target.parentNode;
      lastTarget = target;

      clearGhost(true);

      ghost = document.createElement('li');
      ghost.className = 'Ghost';

      ul.insertBefore(ghost, target);
    }

    let counter = 0;
    GUI.createDroppable(this._$container, {
      onOver: (ev, el, args) => {
        if ( ev.target ) {
          createGhost(ev.target);
        }
      },

      onEnter: (ev) => {
        ev.preventDefault();
        counter++;
      },

      onLeave: (ev) => {
        if ( counter <= 0 ) {
          clearGhost();
        }
      },

      onDrop: () => {
        counter = 0;
        clearGhost();
      },

      onItemDropped: (ev, el, item, args) => {
        if ( item && item.data ) {
          let newPosition = 0;
          if ( DOM.$hasClass(ev.target, 'Ghost') ) {
            newPosition = DOM.$index(ev.target);
          }

          if ( typeof item.data.position !== 'undefined' ) {
            this.moveButton(item.data.position, newPosition - 1);
          } else if ( item.data.mime === 'osjs/application' ) {
            const appName = item.data.path.split('applications:///')[1];
            this.createButton(appName, newPosition);
          }
        }
      }
    });

    return root;
  }

  clearButtons() {
    DOM.$empty(this._$container);
  }

  renderButtons() {
    const wm = WindowManager.instance;

    const systemButtons = {
      applications: (ev) => {
        wm.showMenu(ev);
      },
      settings: (ev) => {
        if ( wm ) {
          wm.showSettings();
        }
      },
      exit: (ev) => {
        Init.logout();
      }
    };

    this.clearButtons();

    (this._settings.get('buttons') || []).forEach((btn, idx) => {
      let menu = [{
        title: 'Remove button',
        onClick: () => {
          this.removeButton(idx);
        }
      }];
      let callback = () => {
        Process.create(btn.launch);
      };

      if ( btn.system ) {
        menu = null; //systemMenu;
        callback = function(ev) {
          ev.stopPropagation();
          systemButtons[btn.system](ev);
        };
      }

      this.addButton(btn.title, btn.icon, menu, callback, idx);
    });
  }

  removeButton(index) {
    const buttons = this._settings.get('buttons');
    buttons.splice(index, 1);
    this.renderButtons();

    this._settings.save();
  }

  moveButton(from, to) {
    const buttons = this._settings.get('buttons');

    if ( from === to || buttons.length <= 1 ) {
      return;
    }

    if ( to >= buttons.length ) {
      let k = to - buttons.length;
      while ( (k--) + 1 ) {
        buttons.push(window.undefined);
      }
    }

    buttons.splice(to, 0, buttons.splice(from, 1)[0]);

    this._settings.save(() => {
      this.renderButtons();
    });
  }

  createButton(appName, position) {
    const pkg = PackageManager.getPackage(appName);
    const buttons = this._settings.get('buttons');

    const iter = {
      title: appName,
      icon: pkg.icon,
      launch: appName
    };

    if ( !buttons.length ) {
      buttons.push(iter);
    } else {
      buttons.splice(position, 0, iter);
    }

    this.renderButtons();

    this._settings.save();
  }

  addButton(title, icon, menu, callback, idx) {
    const img = document.createElement('img');
    img.alt = '';
    img.src = Theme.getIcon(icon);

    const sel = document.createElement('li');
    sel.title = title;
    sel.setAttribute('role', 'button');
    sel.setAttribute('aria-label', title);
    sel.appendChild(img);

    Events.$bind(sel, 'click', callback, true);
    Events.$bind(sel, 'contextmenu', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      if ( menu ) {
        Menu.create(menu, ev);
      }
    });

    GUI.createDraggable(sel, {
      data: {
        position: idx
      },
      onStart: function(ev, el) {
        setTimeout(function() {
          DOM.$addClass(el, 'Ghosting');
        }, 1);
      },
      onEnd: function(ev, el) {
        DOM.$removeClass(el, 'Ghosting');
      }
    });

    this._$container.appendChild(sel);
  }
}
