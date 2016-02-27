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

  function fetchJSON(cb) {
    var url = 'http://91.247.228.125/store/packages.json';
    API.curl({
      body: {
        url: url,
        method: 'GET'
      }
    }, cb);
  }

  function installSelected(download, cb) {
    var handler = OSjs.Core.getHandler();
    var pacman = OSjs.Core.getPackageManager();

    VFS.remoteRead(download, 'application/zip', function(error, ab) {
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

        OSjs.Core.getPackageManager().install(dest, function(error) {
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

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationPackageManagerWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationPackageManagerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 500,
      height: 400
    }, app, scheme]);
  }

  ApplicationPackageManagerWindow.prototype = Object.create(Window.prototype);
  ApplicationPackageManagerWindow.constructor = Window.prototype;

  ApplicationPackageManagerWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'PackageManagerWindow', root);

    var handler = OSjs.Core.getHandler();
    var pacman = OSjs.Core.getPackageManager();
    var sm = OSjs.Core.getSettingsManager();

    var view = scheme.find(this, 'InstalledPackages');
    var pool = sm.instance('Packages', {hidden: []});
    var list, hidden;

    function updateEnabledStates() {
      list = pacman.getPackages(false);
      hidden = pool.get('hidden');
    }

    function renderInstalled() {
      updateEnabledStates();

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

        scheme.create(self, 'gui-checkbox', {value: enabled}, col).on('change', function(ev) {
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

    scheme.find(this, 'ButtonSaveHidden').on('click', function() {
      self._toggleLoading(true);
      pool.set('hidden', hidden, function() {
        self._toggleLoading(false);
      });
    });

    scheme.find(this, 'ButtonRegen').on('click', function() {
      self._toggleLoading(true);
      pacman.generateUserMetadata(function() {
        self._toggleLoading(false);

        renderInstalled();
      });
    });

    scheme.find(this, 'ButtonZipInstall').on('click', function() {
      self._toggleDisabled(true);

      API.createDialog('File', {
        mime: ['application/zip']
      }, function(ev, button, result) {
        if ( button !== 'ok' || !result ) {
          self._toggleDisabled(false);
        } else {
          OSjs.Core.getPackageManager().install(result, function() {
            self._toggleDisabled(false);
            renderInstalled();
          });
        }
      }, self);
    });

    //
    // Store
    //
    var storeView = scheme.find(this, 'AppStorePackages');

    function renderStore() {
      self._toggleLoading(true);
      fetchJSON(function(error, result) {
        self._toggleLoading(false);

        if ( error ) {
          alert('Failed getting packages: ' + error); // FIXME
          return;
        }

        var jsn = Utils.fixJSON(result.body);
        var rows = [];
        if ( jsn instanceof Array ) {
          jsn.forEach(function(i, idx) {
            rows.push({
              index: idx,
              value: i.download,
              columns: [
                {label: i.name},
                {label: i.version},
                {label: i.author}
              ]
            });
          });
        }

        storeView.clear();
        storeView.add(rows);
      });
    }

    scheme.find(this, 'ButtonStoreRefresh').on('click', function() {
      renderStore();
    });

    scheme.find(this, 'ButtonStoreInstall').on('click', function() {
      var selected = storeView.get('selected');
      if ( selected.length && selected[0].data ) {
        self._toggleLoading(true);
        installSelected(selected[0].data, function(error, result) {
          self._toggleLoading(false);
          if ( error ) {
            alert(error); // FIXME
            return;
          }
        });
      }
    });

    //
    // Init
    //
    renderInstalled();

    scheme.find(this, 'TabsPackages').on('change', function(ev) {
      if ( ev.detail && ev.detail.index === 1 ) {
        renderStore();
      }
    });

    return root;
  };

  ApplicationPackageManagerWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationPackageManager(args, metadata) {
    Application.apply(this, ['ApplicationPackageManager', args, metadata]);
  }

  ApplicationPackageManager.prototype = Object.create(Application.prototype);
  ApplicationPackageManager.constructor = Application;

  ApplicationPackageManager.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationPackageManager.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationPackageManagerWindow(self, metadata, scheme));
    });

    this._setScheme(scheme);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationPackageManager = OSjs.Applications.ApplicationPackageManager || {};
  OSjs.Applications.ApplicationPackageManager.Class = ApplicationPackageManager;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
