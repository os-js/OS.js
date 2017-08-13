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
import PanelDialog from '../panelitemdialog';

const DOM = OSjs.require('utils/dom');
const ExtendedDate = OSjs.require('helpers/date');

/////////////////////////////////////////////////////////////////////////////
// Clock Settings Dialog
/////////////////////////////////////////////////////////////////////////////

class ClockSettingsDialog extends PanelDialog {

  constructor(panelItem, scheme, closeCallback) {
    super('ClockSettingsDialog', {
      title: 'Clock Settings',
      icon: 'status/appointment-soon.png',
      width: 400,
      height: 280
    }, panelItem._settings, scheme, closeCallback);
  }

  init(wm, app) {
    const root = super.init(...arguments);
    this._find('InputUseUTC').set('value', this._settings.get('utc'));
    this._find('InputInterval').set('value', String(this._settings.get('interval')));
    this._find('InputTimeFormatString').set('value', this._settings.get('format'));
    this._find('InputTooltipFormatString').set('value', this._settings.get('tooltip'));
    return root;
  }

  applySettings() {
    this._settings.set('utc', this._find('InputUseUTC').get('value'));
    this._settings.set('interval', parseInt(this._find('InputInterval').get('value'), 10));
    this._settings.set('format', this._find('InputTimeFormatString').get('value'));
    this._settings.set('tooltip', this._find('InputTooltipFormatString').get('value'), true);
  }

}

/////////////////////////////////////////////////////////////////////////////
// ITEM
/////////////////////////////////////////////////////////////////////////////

/**
 * PanelItem: Clock
 */
export default class PanelItemClock extends PanelItem {
  constructor(settings) {
    super('PanelItemClock corewm-panel-right', 'Clock', settings, {
      utc: false,
      interval: 1000,
      format: 'H:i:s',
      tooltip: 'l, j F Y'
    });
    this.clockInterval  = null;
    this.$clock = null;
  }

  createInterval() {
    const timeFmt = this._settings.get('format');
    const tooltipFmt = this._settings.get('tooltip');

    const update = () => {
      let clock = this.$clock;
      if ( clock ) {
        const now = new Date();
        const t = ExtendedDate.format(now, timeFmt);
        const d = ExtendedDate.format(now, tooltipFmt);
        DOM.$empty(clock);
        clock.appendChild(document.createTextNode(t));
        clock.setAttribute('aria-label', String(t));
        clock.title = d;
      }
      clock = null;
    };

    const create = (interval) => {
      clearInterval(this.clockInterval);
      this.clockInterval = clearInterval(this.clockInterval);
      this.clockInterval = setInterval(() => update(), interval);
    };

    create(this._settings.get('interval'));
    update();
  }

  init() {
    const root = super.init(...arguments);

    this.$clock = document.createElement('span');
    this.$clock.innerHTML = '00:00:00';
    this.$clock.setAttribute('role', 'button');

    const li = document.createElement('li');
    li.appendChild(this.$clock);
    this._$container.appendChild(li);

    this.createInterval();

    return root;
  }

  applySettings() {
    this.createInterval();
  }

  openSettings() {
    return super.openSettings(ClockSettingsDialog, {});
  }

  destroy() {
    this.clockInterval = clearInterval(this.clockInterval);
    this.$clock = DOM.$remove(this.$clock);
    return super.destroy(...arguments);
  }
}
