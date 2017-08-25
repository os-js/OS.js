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
import PanelItem from '../panelitem';
import {showMenu} from '../menu';

const Theme = OSjs.require('core/theme');
const Events = OSjs.require('utils/events');
const Locales = OSjs.require('core/locales');
const WindowManager = OSjs.require('core/window-manager');

/*eslint valid-jsdoc: "off"*/
export default class PanelItemAppMenu extends PanelItem {

  constructor(settings) {
    super('PanelItemAppMenu', 'AppMenu', settings, {});
  }

  init() {
    const root = super.init(...arguments);
    const wm = WindowManager.instance;

    const img = document.createElement('img');
    img.alt = '';
    img.src = Theme.getIcon(wm.getSetting('icon') || 'osjs-white.png');

    const sel = document.createElement('li');
    sel.title = Locales._('LBL_APPLICATIONS');
    sel.className = 'corewm-panel-button-centered';
    sel.setAttribute('role', 'button');
    sel.setAttribute('data-label', 'OS.js Application Menu');
    sel.appendChild(img);

    Events.$bind(sel, 'click', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      const wm = WindowManager.instance;
      if ( wm ) {
        showMenu(ev);
      }
    });

    this._$container.appendChild(sel);

    return root;
  }

  destroy() {
    if ( this._$container ) {
      Events.$unbind(this._$container.querySelector('li'), 'click');
    }
    return super.destroy(...arguments);
  }

}
