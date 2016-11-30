/*!
 * OS.js - JavaScript Cloud/Web Search Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  var module = {
    group: 'system',
    name: 'Search',
    label: 'LBL_SEARCH',
    icon: 'actions/search.png',

    init: function() {
    },

    update: function(win, scheme, settings, wm) {

      var sm = OSjs.Core.getSettingsManager();
      var searchOptions = Utils.cloneObject(sm.get('SearchEngine') || {});

      win._find('SearchEnableApplications').set('value', searchOptions.applications === true);
      win._find('SearchEnableFiles').set('value', searchOptions.files === true);

      var view = win._find('SearchPaths').clear();
      view.set('columns', [
        {label: 'Path'}
      ]);

      var list = (searchOptions.paths || []).map(function(l) {
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

        API.createDialog('File', {
          select: 'dir',
          mfilter: [
            function(m) {
              return m.module.searchable === true;
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
        var view = win._find('SearchPaths');
        var current = view.get('value') || [];
        current.forEach(function(c) {
          view.remove(c.index);
        });
      }

      win._find('SearchAdd').on('click', openAddDialog);
      win._find('SearchRemove').on('click', removeSelected);
    },

    save: function(win, scheme, settings, wm) {
      var _ = OSjs.Applications.ApplicationSettings._;
      var tmpPaths = win._find('SearchPaths').get('entry', null, null, true).sort();
      var paths = [];

      function isChildOf(tp) {
        var result = false;
        paths.forEach(function(p) {
          if ( !result ) {
            result = tp.substr(0, p.length) === p;
          }
        });
        return result;
      }

      tmpPaths.forEach(function(tp) {
        var c = isChildOf(tp);
        if ( c ) {
          wm.notification({
            title: API._('LBL_SEARCH'),
            message: _('Search path \'{0}\' is already handled by another entry', tp)
          });
        }

        if ( !paths.length || !c ) {
          paths.push(tp);
        }

      });

      var searchSettings = {
        applications: win._find('SearchEnableApplications').get('value'),
        files: win._find('SearchEnableFiles').get('value'),
        paths: paths
      };

      var sm = OSjs.Core.getSettingsManager();
      sm.instance('SearchEngine').set(null, searchSettings, false, false);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Modules = OSjs.Applications.ApplicationSettings.Modules || {};
  OSjs.Applications.ApplicationSettings.Modules.Search = module;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
