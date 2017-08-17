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
import Widget from '../widget';
const Locales = OSjs.require('core/locales');
const Dialog = OSjs.require('core/dialog');

/////////////////////////////////////////////////////////////////////////////
// ITEM
/////////////////////////////////////////////////////////////////////////////

/**
 * Widget: DigitalClock
 */
export default class WidgetDigitalClock extends Widget {

  constructor(settings) {
    super('DigitalClock', {
      width: 300,
      height: 100,
      aspect: true,
      top: 100,
      right: 20,
      canvas: true,
      frequency: 1,
      resizable: true,
      viewBox: true,
      settings: {
        enabled: false,
        tree: {
          color: '#ffffff'
        }
      }
    }, settings);
  }

  onRender() {
    if ( !this._$canvas ) {
      return;
    }

    const ctx = this._$context;
    const now = new Date();
    const txt = [now.getHours(), now.getMinutes(), now.getSeconds()].map(function(i) {
      return i < 10 ? '0' + String(i) : String(i);
    }).join(':');

    const ratio = 0.55;
    const xOffset = -10;
    const fontSize = Math.round(this._dimension.height * ratio);

    ctx.font = String(fontSize) + 'px Digital-7Mono';
    //ctx.textAlign = 'center'; // Does not work properly for @font-facve
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this._getSetting('color');

    const x = Math.round(this._dimension.width / 2);
    const y = Math.round(this._dimension.height / 2);
    const m = ctx.measureText(txt).width;

    ctx.clearRect(0, 0, this._dimension.width, this._dimension.height);
    //ctx.fillText(txt, x, y);
    ctx.fillText(txt, x - (m / 2) + xOffset, y);
  }

  onContextMenu(ev) {
    const color = this._getSetting('color') || '#ffffff';

    return [{
      title: Locales._('LBL_COLOR'),
      onClick: () => {
        Dialog.create('Color', {
          color: color
        }, (ev, btn, result) => {
          if ( btn === 'ok' ) {
            this._setSetting('color', result.hex, true);
          }
        });
      }
    }];
  }

}

