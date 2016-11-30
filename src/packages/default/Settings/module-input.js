/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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

  var hotkeys = {};

  function renderList(win, scheme) {
    win._find('HotkeysList').clear().add(Object.keys(hotkeys).map(function(name) {
      return {
        value: {
          name: name,
          value: hotkeys[name]
        },
        columns: [
          {label: name},
          {label: hotkeys[name]}
        ]
      };
    }));
  }

  function editList(win, scheme, key) {
    var _ = OSjs.Applications.ApplicationSettings._;

    win._toggleDisabled(true);
    API.createDialog('Input', {
      message: _('Enter shortcut for:') + ' ' + key.name,
      value: key.value
    }, function(ev, button, value) {
      win._toggleDisabled(false);
      value = value || '';
      if ( value.indexOf('+') !== -1 ) {
        hotkeys[key.name] = value;
      }

      renderList(win, scheme);
    })
  }

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  var module = {
    group: 'system',
    name: 'Input',
    label: 'LBL_INPUT',
    icon: 'apps/key_bindings.png',

    init: function() {
    },

    update: function(win, scheme, settings, wm) {
      win._find('EnableHotkeys').set('value', settings.enableHotkeys);

      hotkeys = Utils.cloneObject(settings.hotkeys);

      renderList(win, scheme);
    },

    render: function(win, scheme, root, settings, wm) {
      win._find('HotkeysEdit').on('click', function() {
        var selected = win._find('HotkeysList').get('selected');
        if ( selected && selected[0] ) {
          editList(win, scheme, selected[0].data);
        }
      });
    },

    save: function(win, scheme, settings, wm) {
      settings.enableHotkeys = win._find('EnableHotkeys').get('value');
      if ( hotkeys && Object.keys(hotkeys).length ) {
        settings.hotkeys = hotkeys;
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Modules = OSjs.Applications.ApplicationSettings.Modules || {};
  OSjs.Applications.ApplicationSettings.Modules.Input = module;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
