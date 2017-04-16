/*!
 * OS.js - JavaScript Cloud/Web PM Platform
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
(function(Application, Window, Utils, API, PM, GUI, VFS) {
  'use strict';

  function installSelected(download, cb) {
    var pacman = OSjs.Core.getPackageManager();

    var file = new VFS.File(download, 'application/zip');
    VFS.read(file, function(error, ab) {
      if ( error ) {
        cb(error);
        return;
      }

      var dest = new VFS.File({
        filename: Utils.filename(download),
        type: 'file',
        path: 'home:///' + Utils.filename(download),
        mime: 'application/zip'
      });

      VFS.write(dest, ab, function(error, success) {
        if ( error ) {
          cb('Failed to write package: ' + error); // FIXME
          return;
        }

        OSjs.Core.getPackageManager().install(dest, true, function(error) {
          if ( error ) {
            cb('Failed to install package: ' + error); // FIXME
            return;
          }
          pacman.generateUserMetadata(function() {
            cb(false, true);
          });
        });
      });
    });
  }

  function renderStore(win) {
    win._toggleLoading(true);

    var pacman = OSjs.Core.getPackageManager();
    pacman.getStorePackages({}, function(error, result) {
      var rows = result.map(function(i, idx) {
        var a = document.createElement('a');
        a.href = i._repository;

        return {
          index: idx,
          value: i.download,
          columns: [
            {label: i.name},
            {label: a.hostname},
            {label: i.version},
            {label: i.author}
          ]
        };
      });

      win._toggleLoading(false);

      var gelList = win._find('AppStorePackages');
      if ( gelList ) {
        gelList.clear().add(rows);
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  var module = {
    group: 'user',
    name: 'Store',
    label: 'LBL_STORE',
    icon: 'apps/system-software-update.png',
    button: false,

    init: function() {
    },

    update: function(win, scheme, settings, wm, clicked) {
      if ( clicked ) {
        renderStore(win);
      }
    },

    render: function(win, scheme, root, settings, wm) {
      win._find('ButtonStoreRefresh').on('click', function() {
        renderStore(win);
      });

      win._find('ButtonStoreInstall').on('click', function() {
        var selected = win._find('AppStorePackages').get('selected');
        if ( selected.length && selected[0].data ) {
          win._toggleLoading(true);
          installSelected(selected[0].data, function(error, result) {
            win._toggleLoading(false);
            if ( error ) {
              alert(error); // FIXME
              return;
            }
          });
        }
      });
    },

    save: function(win, scheme, settings, wm) {
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Modules = OSjs.Applications.ApplicationSettings.Modules || {};
  OSjs.Applications.ApplicationSettings.Modules.Store = module;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.PM, OSjs.GUI, OSjs.VFS);
