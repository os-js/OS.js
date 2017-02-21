/*!
 * OS.js - JavaScript Cloud/Web VFS Platform
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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  var TEMPLATES = {
    WebDAV: {
      MountName: 'owncloud',
      MountDescription: 'OwnCloud',
      MountHost: 'http://localhost/remote.php/webdav/',
      MountNamespace: 'DAV:',
      MountUsername: function() {
        return OSjs.Core.getAuthenticator().getUser().username;
      }
    }
  };

  var removeMounts = [];
  var addMounts = [];

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

      function setTemplate(name) {
        var tpl = TEMPLATES[name];
        if ( tpl ) {
          Object.keys(tpl).forEach(function(k) {
            var val = tpl[k];
            if ( typeof val === 'function' ) {
              val = val();
            }
            self._find(k).set('value', val);
          });
        }
      }

      function done() {
        ondone({
          transport: self._find('MountType').get('value'),
          name: self._find('MountName').get('value'),
          description: self._find('MountDescription').get('value'),
          options: {
            host: self._find('MountHost').get('value'),
            ns: self._find('MountNamespace').get('value'),
            username: self._find('MountUsername').get('value'),
            password: self._find('MountPassword').get('value'),
            cors: self._find('MountCORS').get('value')
          }
        }, selected);

        self._close();
      }

      this._render(this._name);

      if ( selected ) {
        self._find('MountType').set('value', selected.transport);
        self._find('MountName').set('value', selected.name);
        self._find('MountDescription').set('value', selected.description);

        if ( selected.options ) {
          self._find('MountHost').set('value', selected.options.host);
          self._find('MountNamespace').set('value', selected.options.ns);
          self._find('MountUsername').set('value', selected.options.username);
          self._find('MountPassword').set('value', selected.options.password);
          self._find('MountCORS').set('value', selected.options.cors);
        }
      } else {
        setTemplate(this._find('MountType').get('value'));
        this._find('MountType').on('change', function(ev) {
          setTemplate(ev.detail);
        });
      }

      this._find('ButtonClose').on('click', function() {
        self._close();
      });

      this._find('ButtonOK').on('click', function() {
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
        if ( connection ) {
          if ( replace ) {
            removeMounts.push(replace);
          }
          addMounts.push(connection);
        }

        win.onButtonOK();
        win.onModuleSelect(module.name);
      }

      win._find('MountList').set('columns', [
        {label: 'Name'},
        {label: 'Description'}
      ]);

      win._find('MountRemove').on('click', function() {
        var sel = win._find('MountList').get('selected');
        if ( sel instanceof Array ) {
          sel.forEach(function(item) {
            var sm = OSjs.Core.getSettingsManager();
            var mounts = sm.instance('VFS').get('mounts', []);
            var idx = item.data;

            if ( mounts[idx] ) {
              removeMounts.push(mounts[idx]);

              win.onButtonOK();
              win.onModuleSelect(module.name);
            }
          });
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
      var mm = OSjs.Core.getMountManager();
      var sm = OSjs.Core.getSettingsManager();
      var si = sm.instance('VFS');

      var mounts = si.get('mounts', []).filter(function(iter) {
        for ( var i = 0; i < removeMounts.length; i++ ) {
          var name = removeMounts[i].name;
          if ( name === iter.name ) {
            mm.remove(name, function() {
            });

            removeMounts.splice(i, 1);
            return false;
          }
        }

        return true;
      });

      addMounts.forEach(function(iter) {
        try {
          mm.add(iter);

          mounts.push(iter); // FIXME: Move this  down ?
        } catch ( e ) {
          API.error('Settings', 'An error occured while trying to mount', e);
          console.warn(e.stack, e);
        }
      });

      var vfsSettings = {
        mounts: mounts,
        scandir: {
          showHiddenFiles: win._find('ShowHiddenFiles').get('value'),
          showFileExtensions: win._find('ShowFileExtensions').get('value')
        }
      };

      si.set(null, vfsSettings, false, false);

      addMounts = [];
      removeMounts = [];
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
