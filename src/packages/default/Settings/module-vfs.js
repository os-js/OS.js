/*!
 * OS.js - JavaScript Cloud/Web VFS Platform
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

  function createMountWindow(win, scheme, selected, ondone) {

    var nwin = new Window('SettingsMountWindow', {
      icon: win._app.__metadata.icon,
      title: win._app.__metadata.name,
      width: 400,
      height: 440
    }, win._app, scheme);

    nwin._on('destroy', function(root) {
      win._toggleDisabled(false);
    });

    nwin._on('inited', function(root) {
      win._toggleDisabled(true);
    });

    nwin._on('init', function(root) {
      var self = this;

      function add(conn) {
        try {
          OSjs.Core.getMountManager().add(conn);
        } catch ( e ) {
          API.error(self._title, 'An error occured while trying to mount', e);
          console.warn(e.stack, e);
          return false;
        }
        return true;
      }

      function done() {
        var conn = {
          transport: scheme.find(self, 'MountType').get('value'),
          name: scheme.find(self, 'MountName').get('value'),
          description: scheme.find(self, 'MountDescription').get('value'),
          options: {
            host: scheme.find(self, 'MountHost').get('value'),
            ns: scheme.find(self, 'MountNamespace').get('value'),
            username: scheme.find(self, 'MountUsername').get('value'),
            password: scheme.find(self, 'MountPassword').get('value'),
            cors: scheme.find(self, 'MountCORS').get('value')
          }
        };

        if ( selected ) {
          try {
            OSjs.Core.getMountManager().remove(selected.name, function() {
              if ( add(conn) ) {
                ondone(conn, selected);
              }
              self._close();
            });
            return;
          } catch ( e ) {
            console.warn('Settings Mount modification failure', e, e.stack);
          }
        } else {
          if ( !add(conn) ) {
            conn = null;
          }
        }

        self._close();
        ondone();
      }

      scheme.render(this, this._name, root)

      if ( selected ) {
        scheme.find(self, 'MountType').set('value', selected.transport);
        scheme.find(self, 'MountName').set('value', selected.name);
        scheme.find(self, 'MountDescription').set('value', selected.description);
        if ( selected.options ) {
          scheme.find(self, 'MountHost').set('value', selected.options.host);
          scheme.find(self, 'MountNamespace').set('value', selected.options.ns);
          scheme.find(self, 'MountUsername').set('value', selected.options.username);
          scheme.find(self, 'MountPassword').set('value', selected.options.password);
          scheme.find(self, 'MountCORS').set('value', selected.options.cors);
        }
      }

      scheme.find(this, 'ButtonClose').on('click', function() {
        self._close();
      });

      scheme.find(this, 'ButtonOK').on('click', function() {
        done();
      });
    });

    return win._addChild(nwin, true, true);
  }

  function renderMounts(win, scheme) {
    var sm = OSjs.Core.getSettingsManager();
    var sf = sm.instance('VFS');
    var entries = sf.get('mounts', []).map(function(i, idx) {
      return {
        value: idx,
        columns: [
          {label: i.name},
          {label: i.description}
        ]
      };
    });

    win._find('MountList').clear().add(entries);
  }

  function _save(sf, win, scheme, mounts) {
    win._toggleLoading(true);
    sf.set(null, {mounts: mounts}, function() {
      renderMounts(win, scheme);
      win._toggleLoading(false);
    }, false);
  }

  function removeMount(win, scheme, index) {
    var sm = OSjs.Core.getSettingsManager();
    var sf = sm.instance('VFS');
    var mounts = sf.get('mounts', []);

    if ( typeof mounts[index] !== 'undefined' ) {
      mounts.splice(index, 1);
      _save(sf, win, scheme, mounts);
    }
  }

  function addMount(conn, replace, win, scheme) {
    if ( !conn ) {
      return;
    }

    var sm = OSjs.Core.getSettingsManager();
    var sf = sm.instance('VFS');
    var mounts = sf.get('mounts', []).filter(function(iter) {
      if ( replace && replace.name === iter.name ) {
        return false;
      }
      return true;
    });
    mounts.push(conn);

    _save(sf, win, scheme, mounts);
  }

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  var module = {
    group: 'system',
    name: 'VFS',
    label: 'VFS',
    icon: 'devices/harddrive.png',
    watch: ['VFS'],

    init: function(app) {
    },

    update: function(win, scheme, settings, wm) {
      var vfsOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
      var scandirOptions = vfsOptions.scandir || {};

      win._find('ShowFileExtensions').set('value', scandirOptions.showFileExtensions === true);
      win._find('ShowHiddenFiles').set('value', scandirOptions.showHiddenFiles === true);

      renderMounts(win, scheme);
    },

    render: function(win, scheme, root, settings, wm) {
      function ondone(connection, replace) {
        addMount(connection, replace, win, scheme);
      }

      win._find('MountList').set('columns', [
        {label: 'Name'},
        {label: 'Description'}
      ]);

      win._find('MountRemove').on('click', function() {
        var sel = win._find('MountList').get('selected');
        if ( sel && sel.length ) {
          removeMount(win, scheme, sel[0].data);
        }
      });

      win._find('MountAdd').on('click', function() {
        createMountWindow(win, scheme, null, ondone);
      });

      win._find('MountEdit').on('click', function() {
        var sel = win._find('MountList').get('selected');
        var sm = OSjs.Core.getSettingsManager();
        var mounts = sm.instance('VFS').get('mounts', []);
        if ( sel && sel.length ) {
          var mount = mounts[sel[0].data];
          if ( mount ) {
            createMountWindow(win, scheme, mount, ondone);
          }
        }
      });
    },

    save: function(win, scheme, settings, wm) {
      var vfsSettings = {
        scandir: {
          showHiddenFiles: win._find('ShowHiddenFiles').get('value'),
          showFileExtensions: win._find('ShowFileExtensions').get('value')
        }
      };

      return function(cb) {
        var sm = OSjs.Core.getSettingsManager();
        sm.instance('VFS').set(null, vfsSettings, cb, false);
      };
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Modules = OSjs.Applications.ApplicationSettings.Modules || {};
  OSjs.Applications.ApplicationSettings.Modules.VFS = module;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
