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

  var list, hidden;

  function updateEnabledStates() {
    var pacman = OSjs.Core.getPackageManager();
    var sm = OSjs.Core.getSettingsManager();
    var pool = sm.instance('PackageManager', {Hidden: []});

    list = pacman.getPackages(false);
    hidden = pool.get('Hidden');
  }

  function renderInstalled(win, scheme) {
    win._find('ButtonUninstall').set('disabled', true);

    updateEnabledStates();

    var view = win._find('InstalledPackages');
    var rows = [];

    Object.keys(list).forEach(function(k, idx) {
      rows.push({
        index: idx,
        value: k,
        columns: [
          {label: ''},
          {label: k},
          {label: list[k].scope},
          {label: list[k].name}
        ]
      });
    });

    view.clear();
    view.add(rows);

    view.$element.querySelectorAll('gui-list-view-body > gui-list-view-row').forEach(function(row) {
      var col = row.children[0];
      var name = row.getAttribute('data-value');
      var enabled = hidden.indexOf(name) >= 0;

      win._create('gui-checkbox', {value: enabled}, col).on('change', function(ev) {
        var idx = hidden.indexOf(name);

        if ( ev.detail ) {
          if ( idx < 0 ) {
            hidden.push(name);
          }
        } else {
          if ( idx >= 0 ) {
            hidden.splice(idx, 1);
          }
        }
      });
    });
  }

  function renderPaths(win, scheme) {
    var sm = OSjs.Core.getSettingsManager();
    var paths = sm.instance('PackageManager').get('PackagePaths', []);
    win._find('PackagePaths').clear().add(paths.map(function(iter, idx) {
      return {
        value: idx,
        columns: [
          {label: iter}
        ]
      };
    }));
  }

  function _save(sf, win, scheme, paths) {
    win._toggleLoading(true);
    sf.set(null, {PackagePaths: paths}, function() {
      renderPaths(win, scheme);
      win._toggleLoading(false);
    }, false);
  }

  function addPath(win, scheme) {
    var sm = OSjs.Core.getSettingsManager();
    var sf = sm.instance('PackageManager');
    var paths = sf.get('PackagePaths', []);

    win._toggleDisabled(true);
    API.createDialog('Input', {
      message: 'Enter path',
      placeholder: 'mount:///path'
    }, function(ev, btn, value) {
      win._toggleDisabled(false);

      if ( value ) {
        if ( paths.indexOf(value) === -1 ) {
          paths.push(value);
          _save(sf, win, scheme, paths);
        }
      }
    });
  }

  function removePath(win, scheme, index) {
    var sm = OSjs.Core.getSettingsManager();
    var sf = sm.instance('PackageManager');
    var paths = sf.get('PackagePaths', []);
    if ( typeof paths[index] !== 'undefined' ) {
      paths.splice(index, 1);
      _save(sf, win, scheme, paths);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  var module = {
    group: 'misc',
    name: 'Packages',
    label: 'LBL_PACKAGES',
    icon: 'apps/system-software-install.png',
    button: false,

    init: function() {
    },

    update: function(win, scheme, settings, wm) {
      renderInstalled(win, scheme);
      renderPaths(win, scheme);
    },

    render: function(win, scheme, root, settings, wm) {
      var pacman = OSjs.Core.getPackageManager();
      var sm = OSjs.Core.getSettingsManager();
      var pool = sm.instance('PackageManager', {Hidden: []});

      win._find('ButtonUninstall').on('click', function() {
        var selected = win._find('InstalledPackages').get('selected');
        if ( selected && selected[0] ) {
          var pkg = pacman.getPackage(selected[0].data);
          if ( pkg && pkg.scope === 'user' ) {
            win._toggleLoading(true);

            var file = new VFS.File(pkg.path);
            pacman.uninstall(file, function(e) {
              win._toggleLoading(false);
              renderInstalled(win, scheme);

              if ( e ) {
                alert(e);
              }
            });
          }
        }
      });

      win._find('InstalledPackages').on('select', function(ev) {
        var d = true;
        var e = ev.detail.entries || [];
        if ( e.length ) {
          var pkg = pacman.getPackage(e[0].data);
          if ( pkg && pkg.scope === 'user' ) {
            d = false;
          }
        }

        win._find('ButtonUninstall').set('disabled', d);
      });

      win._find('ButtonSaveHidden').on('click', function() {
        win._toggleLoading(true);
        pool.set('Hidden', hidden, function() {
          win._toggleLoading(false);
        });
      });

      win._find('ButtonRegen').on('click', function() {
        win._toggleLoading(true);
        pacman.generateUserMetadata(function() {
          win._toggleLoading(false);

          renderInstalled(win, scheme);
        });
      });

      win._find('ButtonZipInstall').on('click', function() {
        win._toggleDisabled(true);

        API.createDialog('File', {
          filter: ['application/zip']
        }, function(ev, button, result) {
          if ( button !== 'ok' || !result ) {
            win._toggleDisabled(false);
          } else {
            OSjs.Core.getPackageManager().install(result, true, function(e) {
              win._toggleDisabled(false);
              renderInstalled(win, scheme);

              if ( e ) {
                alert(e);
              }
            });
          }
        }, win);
      });

      win._find('PackagePathsRemove').on('click', function() {
        var sel = win._find('PackagePaths').get('selected');
        if ( sel && sel.length ) {
          removePath(win, scheme, sel[0].data);
        }
      });

      win._find('PackagePathsAdd').on('click', function() {
        addPath(win, scheme);
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
  OSjs.Applications.ApplicationSettings.Modules.PM = module;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.PM, OSjs.GUI, OSjs.VFS);
