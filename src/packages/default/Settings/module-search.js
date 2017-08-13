/*!
 * OS.js - JavaScript Cloud/Web Search Platform
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
const SettingsManager = OSjs.require('core/settings-manager');
const Notification = OSjs.require('gui/notification');
const Locales = OSjs.require('core/locales');
const Dialog = OSjs.require('core/dialog');
const Utils = OSjs.require('utils/misc');
const _ = Locales.createLocalizer(Translations);

export default {
  group: 'system',
  name: 'Search',
  label: 'LBL_SEARCH',
  icon: 'actions/system-search.png',

  init: function() {
  },

  update: function(win, scheme, settings, wm) {

    const searchOptions = Utils.cloneObject(SettingsManager.get('SearchEngine') || {});

    win._find('SearchEnableApplications').set('value', searchOptions.applications === true);
    win._find('SearchEnableFiles').set('value', searchOptions.files === true);

    const view = win._find('SearchPaths').clear();
    view.set('columns', [
      {label: 'Path'}
    ]);

    const list = (searchOptions.paths || []).map(function(l) {
      return {
        value: l,
        id: l,
        columns: [
          {label: l}
        ]
      };
    });

    view.add(list);
  },

  render: function(win, scheme, root, settings, wm) {
    function openAddDialog() {
      win._toggleDisabled(true);

      Dialog.create('File', {
        select: 'dir',
        mfilter: [
          function(m) {
            return m.option('searchable') && m.mounted();
          }
        ]
      }, function(ev, button, result) {
        win._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          win._find('SearchPaths').add([{
            value: result.path,
            id: result.path,
            columns: [
              {label: result.path}
            ]
          }]);
        }
      }, win);
    }

    function removeSelected() {
      const view = win._find('SearchPaths');
      const current = view.get('value') || [];
      current.forEach(function(c) {
        view.remove(c.index);
      });
    }

    win._find('SearchAdd').on('click', openAddDialog);
    win._find('SearchRemove').on('click', removeSelected);
  },

  save: function(win, scheme, settings, wm) {
    const tmpPaths = win._find('SearchPaths').get('entry', null, null, true).sort();
    const paths = [];

    function isChildOf(tp) {
      let result = false;
      paths.forEach(function(p) {
        if ( !result ) {
          result = tp.substr(0, p.length) === p;
        }
      });
      return result;
    }

    tmpPaths.forEach(function(tp) {
      const c = isChildOf(tp);
      if ( c ) {
        Notification.create({
          title: _('LBL_SEARCH'),
          message: _('Search path \'{0}\' is already handled by another entry', tp)
        });
      }

      if ( !paths.length || !c ) {
        paths.push(tp);
      }

    });

    const searchSettings = {
      applications: win._find('SearchEnableApplications').get('value'),
      files: win._find('SearchEnableFiles').get('value'),
      paths: paths
    };

    SettingsManager.instance('SearchEngine').set(null, searchSettings, false, false);
  }
};

