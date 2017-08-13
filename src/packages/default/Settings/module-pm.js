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
const Dialog = OSjs.require('core/dialog');
const SettingsManager = OSjs.require('core/settings-manager');
const PackageManager = OSjs.require('core/package-manager');
const FileMetadata = OSjs.require('vfs/file');

let list, hidden;

function updateEnabledStates() {
  const pool = SettingsManager.instance('PackageManager', {Hidden: []});

  list = PackageManager.getPackages(false);
  hidden = pool.get('Hidden');
}

function renderInstalled(win, scheme) {
  if ( !win || win._destroyed ) {
    return;
  }

  win._find('ButtonUninstall').set('disabled', true);

  updateEnabledStates();

  const view = win._find('InstalledPackages');
  const rows = Object.keys(list).map(function(k, idx) {
    return {
      index: idx,
      value: k,
      columns: [
        {label: ''},
        {label: k},
        {label: list[k].scope},
        {label: list[k].name}
      ]
    };
  });

  view.clear();
  view.add(rows);

  view.$element.querySelectorAll('gui-list-view-body > gui-list-view-row').forEach(function(row) {
    const col = row.children[0];
    const name = row.getAttribute('data-value');
    const enabled = hidden.indexOf(name) >= 0;

    win._create('gui-checkbox', {value: enabled}, col).on('change', function(ev) {
      const idx = hidden.indexOf(name);

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
  if ( !win || win._destroyed ) {
    return;
  }

  const paths = SettingsManager.instance('PackageManager').get('PackagePaths', []);
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
  const sf = SettingsManager.instance('PackageManager');
  const paths = sf.get('PackagePaths', []);

  win._toggleDisabled(true);
  Dialog.create('Input', {
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
  const sf = SettingsManager.instance('PackageManager');
  const paths = sf.get('PackagePaths', []);
  if ( typeof paths[index] !== 'undefined' ) {
    paths.splice(index, 1);
    _save(sf, win, scheme, paths);
  }
}

/////////////////////////////////////////////////////////////////////////////
// MODULE
/////////////////////////////////////////////////////////////////////////////

export default {
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
    const pool = SettingsManager.instance('PackageManager', {Hidden: []});

    win._find('ButtonUninstall').on('click', function() {
      const selected = win._find('InstalledPackages').get('selected');
      if ( selected && selected[0] ) {
        const pkg = PackageManager.getPackage(selected[0].data);
        if ( pkg && pkg.scope === 'user' ) {
          win._toggleLoading(true);

          const file = new FileMetadata(pkg.path);
          PackageManager.uninstall(file).then(() => {
            win._toggleLoading(false);
            renderInstalled(win, scheme);
          }).catch((e) => {
            win._toggleLoading(false);
            alert(e);
          });
        }
      }
    });

    win._find('InstalledPackages').on('select', function(ev) {
      let d = true;
      const e = ev.detail.entries || [];
      if ( e.length ) {
        const pkg = PackageManager.getPackage(e[0].data);
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
      PackageManager.generateUserMetadata().then(() => {
        win._toggleLoading(false);
        renderInstalled(win, scheme);
      }).catch(() => {
        win._toggleLoading(false);
      });
    });

    win._find('ButtonZipInstall').on('click', function() {
      win._toggleDisabled(true);

      Dialog.create('File', {
        filter: ['application/zip']
      }, function(ev, button, result) {
        if ( button !== 'ok' || !result ) {
          win._toggleDisabled(false);
        } else {
          PackageManager.install(result, true).then(() => {
            win._toggleDisabled(false);
            renderInstalled(win, scheme);
          }).catch((e) => {
            win._toggleDisabled(false);
            alert(e);
          });
        }
      }, win);
    });

    win._find('PackagePathsRemove').on('click', function() {
      const sel = win._find('PackagePaths').get('selected');
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

