/*!
 * OS.js - JavaScript Cloud/Web Panel Platform
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
const PackageManager = OSjs.require('core/package-manager');
const Locales = OSjs.require('core/locales');
const Dialog = OSjs.require('core/dialog');
const Theme = OSjs.require('core/theme');
const Utils = OSjs.require('utils/misc');

let panelItems = [];
let items = [];
let max = 0;
let panel;

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

function openOptions(wm, idx) {
  // FIXME
  try {
    wm.panels[0]._items[idx].openSettings();
  } catch ( e ) {}
}

function checkSelection(win, idx) {
  let hasOptions = true;

  try {
    const it = items[panel.items[idx].name];
    hasOptions = it.HasOptions === true;
  } catch ( e ) {}

  win._find('PanelButtonOptions').set('disabled', idx < 0 || !hasOptions);
  win._find('PanelButtonRemove').set('disabled', idx < 0);
  win._find('PanelButtonUp').set('disabled', idx <= 0);
  win._find('PanelButtonDown').set('disabled', idx < 0 || idx >= max);
}

function renderItems(win, setSelected) {
  const list = [];

  panelItems.forEach(function(i, idx) {
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
  max = panelItems.length - 1;

  const view = win._find('PanelItems');
  view.clear();
  view.add(list);

  if ( typeof setSelected !== 'undefined' ) {
    view.set('selected', setSelected);
    checkSelection(win, setSelected);
  } else {
    checkSelection(win, -1);
  }
}

function movePanelItem(win, index, pos) {
  const value = panelItems[index];
  const newIndex = index + pos;
  panelItems.splice(index, 1);
  panelItems.splice(newIndex, 0, value);
  renderItems(win, newIndex);
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

      nwin._setTitle('Panel Items', true);
    });
    win._addChild(nwin, true, true);
  }
}

function createColorDialog(win, color, cb) {
  win._toggleDisabled(true);

  Dialog.create('Color', {
    color: color
  }, function(ev, button, result) {
    win._toggleDisabled(false);
    if ( button === 'ok' && result ) {
      cb(result.hex);
    }
  }, win);
}

/////////////////////////////////////////////////////////////////////////////
// MODULE
/////////////////////////////////////////////////////////////////////////////

export default {
  group: 'personal',
  name: 'Panel',
  label: 'LBL_PANELS',
  icon: 'apps/gnome-panel.png',
  watch: ['CoreWM'],

  init: function() {
  },

  update: function(win, scheme, settings, wm) {
    panel = settings.panels[0];

    let opacity = 85;
    if ( typeof panel.options.opacity === 'number' ) {
      opacity = panel.options.opacity;
    }

    win._find('PanelPosition').set('value', panel.options.position);
    win._find('PanelAutoHide').set('value', panel.options.autohide);
    win._find('PanelOntop').set('value', panel.options.ontop);
    win._find('PanelBackgroundColor').set('value', panel.options.background || '#101010');
    win._find('PanelForegroundColor').set('value', panel.options.foreground || '#ffffff');
    win._find('PanelOpacity').set('value', opacity);

    items = PackageManager.getPackage('CoreWM').panelItems;

    panelItems = panel.items || [];

    renderItems(win);
  },

  render: function(win, scheme, root, settings, wm) {
    win._find('PanelPosition').add([
      {value: 'top',    label: Locales._('LBL_TOP')},
      {value: 'bottom', label: Locales._('LBL_BOTTOM')}
    ]);

    win._find('PanelBackgroundColor').on('open', function(ev) {
      createColorDialog(win, ev.detail, function(result) {
        win._find('PanelBackgroundColor').set('value', result);
      });
    });

    win._find('PanelForegroundColor').on('open', function(ev) {
      createColorDialog(win, ev.detail, function(result) {
        win._find('PanelForegroundColor').set('value', result);
      });
    });

    win._find('PanelItems').on('select', function(ev) {
      if ( ev && ev.detail && ev.detail.entries && ev.detail.entries.length ) {
        checkSelection(win, ev.detail.entries[0].index);
      }
    });

    win._find('PanelButtonAdd').on('click', function() {
      win._toggleDisabled(true);
      createDialog(win, scheme, function(ev, result) {
        win._toggleDisabled(false);

        if ( result ) {
          panelItems.push({name: result.data});
          renderItems(win);
        }
      });
    });

    win._find('PanelButtonRemove').on('click', function() {
      const selected = win._find('PanelItems').get('selected');
      if ( selected.length ) {
        panelItems.splice(selected[0].index, 1);
        renderItems(win);
      }
    });

    win._find('PanelButtonUp').on('click', function() {
      const selected = win._find('PanelItems').get('selected');
      if ( selected.length ) {
        movePanelItem(win, selected[0].index, -1);
      }
    });
    win._find('PanelButtonDown').on('click', function() {
      const selected = win._find('PanelItems').get('selected');
      if ( selected.length ) {
        movePanelItem(win, selected[0].index, 1);
      }
    });

    win._find('PanelButtonReset').on('click', function() {
      const defaults = wm.getDefaultSetting('panels');
      panelItems = defaults[0].items;
      renderItems(win);
    });

    win._find('PanelButtonOptions').on('click', function() {
      const selected = win._find('PanelItems').get('selected');
      if ( selected.length ) {
        openOptions(wm, selected[0].index);
      }
    });
  },

  save: function(win, scheme, settings, wm) {
    settings.panels = settings.panels || [{}];
    settings.panels[0].options = settings.panels[0].options || {};

    settings.panels[0].options.position = win._find('PanelPosition').get('value');
    settings.panels[0].options.autohide = win._find('PanelAutoHide').get('value');
    settings.panels[0].options.ontop = win._find('PanelOntop').get('value');
    settings.panels[0].options.background = win._find('PanelBackgroundColor').get('value') || '#101010';
    settings.panels[0].options.foreground = win._find('PanelForegroundColor').get('value') || '#ffffff';
    settings.panels[0].options.opacity = win._find('PanelOpacity').get('value');
    settings.panels[0].items = panelItems;
  }
};
