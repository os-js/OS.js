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
const Theme = OSjs.require('core/theme');
const Utils = OSjs.require('utils/misc');
const PackageManager = OSjs.require('core/package-manager');
const _ = Locales.createLocalizer(Translations);

let widgets = [];
let items = [];

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

function renderItems(win, setSelected) {
  const list = [];

  widgets.forEach(function(i, idx) {
    const name = i.name;

    if ( items[name] ) {
      list.push({
        value: idx,
        columns: [{
          icon: Theme.getIcon(items[name].Icon),
          label: Utils.format('{0} ({1})', items[name].Name, items[name].Description)
        }]
      });
    }
  });

  const view = win._find('WidgetItems');
  view.clear();
  view.add(list);
}

function createDialog(win, scheme, cb) {
  if ( scheme ) {
    const app = win._app;
    const nwin = new OSjs.Applications.ApplicationSettings.SettingsItemDialog(app, app.__metadata, scheme, cb);
    nwin._on('inited', function(scheme) {
      nwin._find('List').clear().add(Object.keys(items).map(function(i, idx) {
        return {
          value: i,
          columns: [{
            icon: Theme.getIcon(items[i].Icon),
            label: Utils.format('{0} ({1})', items[i].Name, items[i].Description)
          }]
        };
      }));
      nwin._setTitle('Widgets', true);
    });
    win._addChild(nwin, true, true);
  }
}

function updateLabel(win, lbl, value) {

  const map = {
    DesktopMargin: 'Desktop Margin ({0}px)',
    CornerSnapping: 'Desktop Corner Snapping ({0}px)',
    WindowSnapping: 'Window Snapping ({0}px)'
  };

  const label = Utils.format(_(map[lbl]), value);
  win._find(lbl + 'Label').set('value', label);
}

/////////////////////////////////////////////////////////////////////////////
// MODULE
/////////////////////////////////////////////////////////////////////////////

export default {
  group: 'personal',
  name: 'Desktop',
  label: 'LBL_DESKTOP',
  icon: 'devices/video-display.png',
  watch: ['CoreWM'],

  init: function(app) {
  },

  update: function(win, scheme, settings, wm) {
    win._find('EnableAnimations').set('value', settings.animations);
    win._find('EnableTouchMenu').set('value', settings.useTouchMenu);

    win._find('EnableWindowSwitcher').set('value', settings.enableSwitcher);

    win._find('DesktopMargin').set('value', settings.desktopMargin);
    win._find('CornerSnapping').set('value', settings.windowCornerSnap);
    win._find('WindowSnapping').set('value', settings.windowSnap);

    updateLabel(win, 'DesktopMargin', settings.desktopMargin);
    updateLabel(win, 'CornerSnapping', settings.windowCornerSnap);
    updateLabel(win, 'WindowSnapping', settings.windowSnap);

    items = PackageManager.getPackage('CoreWM').widgets;
    widgets = settings.widgets || [];

    renderItems(win);
  },

  render: function(win, scheme, root, settings, wm) {
    win._find('DesktopMargin').on('change', function(ev) {
      updateLabel(win, 'DesktopMargin', ev.detail);
    });
    win._find('CornerSnapping').on('change', function(ev) {
      updateLabel(win, 'CornerSnapping', ev.detail);
    });
    win._find('WindowSnapping').on('change', function(ev) {
      updateLabel(win, 'WindowSnapping', ev.detail);
    });

    win._find('EnableIconView').set('value', settings.enableIconView);
    win._find('EnableIconViewInvert').set('value', settings.invertIconViewColor);

    win._find('WidgetButtonAdd').on('click', function() {
      win._toggleDisabled(true);
      createDialog(win, scheme, function(ev, result) {
        win._toggleDisabled(false);

        if ( result ) {
          widgets.push({name: result.data});
          renderItems(win);
        }
      });
    });

    win._find('WidgetButtonRemove').on('click', function() {
      const selected = win._find('WidgetItems').get('selected');
      if ( selected.length ) {
        widgets.splice(selected[0].index, 1);
        renderItems(win);
      }
    });

    win._find('WidgetButtonOptions').on('click', function() {
    });
  },

  save: function(win, scheme, settings, wm) {
    settings.animations = win._find('EnableAnimations').get('value');
    settings.useTouchMenu = win._find('EnableTouchMenu').get('value');
    settings.enableSwitcher = win._find('EnableWindowSwitcher').get('value');
    settings.desktopMargin = win._find('DesktopMargin').get('value');
    settings.windowCornerSnap = win._find('CornerSnapping').get('value');
    settings.windowSnap = win._find('WindowSnapping').get('value');
    settings.enableIconView = win._find('EnableIconView').get('value');
    settings.invertIconViewColor = win._find('EnableIconViewInvert').get('value');

    settings.widgets = widgets;
  }
};

