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
import DialogWindow from 'core/dialog';
import * as Utils from 'utils/misc';
import {_} from 'core/locales';

function getColor(rgb) {
  let hex = rgb;

  if ( typeof rgb === 'string' ) {
    hex = rgb;
    rgb = Utils.convertToRGB(rgb);
    rgb.a = null;
  } else {
    if ( typeof rgb.a === 'undefined' ) {
      rgb.a = null;
    } else {
      if ( rgb.a > 1.0 ) {
        rgb.a /= 100;
      }
    }

    rgb = rgb || {r: 0, g: 0, b: 0, a: 100};
    hex = Utils.convertToHEX(rgb.r, rgb.g, rgb.b);
  }

  return [rgb, hex];
}

/**
 * An 'Color Chooser' dialog
 *
 * @example DialogWindow.create('Color', {}, fn);
 * @extends DialogWindow
 */
export default class ColorDialog extends DialogWindow {

  /**
   * @param  {Object}          args              An object with arguments
   * @param  {String}          args.title        Dialog title
   * @param  {String|Object}   args.color        Either hex string or rbg object
   * @param  {CallbackDialog}  callback          Callback when done
   */
  constructor(args, callback) {
    args = Object.assign({}, {}, args);

    const [rgb, hex] = getColor(args.color);

    super('ColorDialog', {
      title: args.title || _('DIALOG_COLOR_TITLE'),
      icon: 'apps/preferences-desktop-theme.png',
      width: 400,
      height: rgb.a !== null ? 300  : 220
    }, args, callback);

    this.color = {r: rgb.r, g: rgb.g, b: rgb.b, a: rgb.a, hex: hex};
  }

  init() {
    const root = super.init(...arguments);

    const updateHex = (update) => {
      this._find('LabelRed').set('value', _('DIALOG_COLOR_R', this.color.r));
      this._find('LabelGreen').set('value', _('DIALOG_COLOR_G', this.color.g));
      this._find('LabelBlue').set('value', _('DIALOG_COLOR_B', this.color.b));
      this._find('LabelAlpha').set('value', _('DIALOG_COLOR_A', this.color.a));

      if ( update ) {
        this.color.hex = Utils.convertToHEX(this.color.r, this.color.g, this.color.b);
      }

      let value = this.color.hex;
      if ( this.color.a !== null && !isNaN(this.color.a) ) {
        value = Utils.format('rgba({0}, {1}, {2}, {3})', this.color.r, this.color.g, this.color.b, this.color.a);
      }
      this._find('ColorPreview').set('value', value);
    };

    this._find('ColorSelect').on('change', (ev) => {
      this.color = ev.detail;
      this._find('Red').set('value', this.color.r);
      this._find('Green').set('value', this.color.g);
      this._find('Blue').set('value', this.color.b);
      updateHex(true);
    });

    this._find('Red').on('change', (ev) => {
      this.color.r = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.r);

    this._find('Green').on('change', (ev) => {
      this.color.g = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.g);

    this._find('Blue').on('change', (ev) => {
      this.color.b = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.b);

    this._find('Alpha').on('change', (ev) => {
      this.color.a = parseInt(ev.detail, 10) / 100;
      updateHex(true);
    }).set('value', this.color.a * 100);

    if ( this.color.a === null ) {
      this._find('AlphaContainer').hide();
      this._find('AlphaLabelContainer').hide();
    }

    updateHex(false, this.color.a !== null);

    return root;
  }

  onClose(ev, button) {
    this.closeCallback(ev, button, button === 'ok' ? this.color : null);
  }

}

