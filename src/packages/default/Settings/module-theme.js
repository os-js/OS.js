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
const Locales = OSjs.require('core/locales');
const Dialog = OSjs.require('core/dialog');
const FileMetadata = OSjs.require('vfs/file');
const Theme = OSjs.require('core/theme');
const _ = Locales.createLocalizer(Translations);

export default {
  group: 'personal',
  name: 'Theme',
  label: 'LBL_THEME',
  icon: 'apps/preferences-desktop-wallpaper.png',
  watch: ['CoreWM'],

  init: function() {
  },

  update: function(win, scheme, settings, wm) {
    win._find('BackgroundImage').set('value', settings.wallpaper);
    win._find('BackgroundColor').set('value', settings.backgroundColor);
    win._find('FontName').set('value', settings.fontFamily);

    win._find('StyleThemeName').set('value', settings.styleTheme);
    win._find('IconThemeName').set('value', settings.iconTheme);

    win._find('EnableTouchMenu').set('value', settings.useTouchMenu);

    win._find('BackgroundStyle').set('value', settings.background);
    win._find('BackgroundImage').set('value', settings.wallpaper);
    win._find('BackgroundColor').set('value', settings.backgroundColor);
  },

  render: function(win, scheme, root, settings, wm) {
    function _createDialog(n, a, done) {
      win._toggleDisabled(true);
      Dialog.create(n, a, function(ev, button, result) {
        win._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          done(result);
        }
      }, win);
    }

    win._find('StyleThemeName').add(Theme.getStyleThemes().map(function(t) {
      return {label: t.title, value: t.name};
    }));

    win._find('IconThemeName').add((function(tmp) {
      return Object.keys(tmp).map(function(t) {
        return {label: tmp[t], value: t};
      });
    })(Theme.getIconThemes()));

    win._find('BackgroundImage').on('open', function(ev) {
      _createDialog('File', {
        mime: ['^image'],
        file: new FileMetadata(ev.detail)
      }, function(result) {
        win._find('BackgroundImage').set('value', result.path);
      });
    });

    win._find('BackgroundColor').on('open', function(ev) {
      _createDialog('Color', {
        color: ev.detail
      }, function(result) {
        win._find('BackgroundColor').set('value', result.hex);
      }, win);
    });

    win._find('FontName').on('click', function() {
      _createDialog('Font', {
        fontName: settings.fontFamily,
        fontSize: -1
      }, function(result) {
        win._find('FontName').set('value', result.fontName);
      }, win);
    });

    win._find('BackgroundStyle').add([
      {value: 'image',        label: _('LBL_IMAGE')},
      {value: 'image-repeat', label: _('Image (Repeat)')},
      {value: 'image-center', label: _('Image (Centered)')},
      {value: 'image-fill',   label: _('Image (Fill)')},
      {value: 'image-strech', label: _('Image (Streched)')},
      {value: 'color',        label: _('LBL_COLOR')}
    ]);
  },

  save: function(win, scheme, settings, wm) {
    settings.styleTheme = win._find('StyleThemeName').get('value');
    settings.iconTheme = win._find('IconThemeName').get('value');
    settings.useTouchMenu = win._find('EnableTouchMenu').get('value');
    settings.wallpaper = win._find('BackgroundImage').get('value');
    settings.backgroundColor = win._find('BackgroundColor').get('value');
    settings.background = win._find('BackgroundStyle').get('value');
    settings.fontFamily = win._find('FontName').get('value');
  }
};

