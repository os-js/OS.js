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
const FS = OSjs.require('utils/fs');
const VFS = OSjs.require('vfs/fs');
const FileMetadata = OSjs.require('vfs/file');
const PackageManager = OSjs.require('core/package-manager');

function installSelected(download, cb) {
  const file = new FileMetadata(download, 'application/zip');

  (new Promise((resolve, reject) => {
    VFS.read(file).then((ab) => {

      const dest = new FileMetadata({
        filename: FS.filename(download),
        type: 'file',
        path: 'home:///' + FS.filename(download),
        mime: 'application/zip'
      });

      VFS.write(dest, ab).then(() => {
        return PackageManager.install(dest, true).then(() => {
          PackageManager.generateUserMetadata()
            .then(resolve).catch(reject);
        }).catch((error) => {
          reject(new Error('Failed to install package: ' + error)); // FIXME
        });
      }).catch(reject);
    }).catch(reject);
  })).then((res) => cb(false, res)).catch(cb);
}

function renderStore(win) {
  win._toggleLoading(true);

  PackageManager.getStorePackages({}).then((result) => {
    const rows = result.map(function(i, idx) {
      const a = document.createElement('a');
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

    const gelList = win._find('AppStorePackages');
    if ( gelList ) {
      gelList.clear().add(rows);
    }

    return true;
  }).catch((err) => {
    console.warn(err);
    win._toggleLoading(false);
  });
}

export default {
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
      const selected = win._find('AppStorePackages').get('selected');
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

