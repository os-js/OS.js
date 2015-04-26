/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {
  'use strict';

  function installPackage(file, cb) {
    var dest = 'home:///Packages/' + file.filename.replace(/\.zip$/i, '');

    VFS.exists(new VFS.File(dest), function(error, exists) {
      if ( error ) {
        cb(error);
        return;
      }

      if ( exists ) {
        cb('Target directory already exists. Is this package already installed?'); // FIXME: Translation
        return;
      }

      OSjs.Helpers.ZipArchiver.createInstance({}, function(error, instance) {
        if ( instance ) {
          instance.extract(file, dest, {
            onprogress: function() {
            },
            oncomplete: function() {
              cb();
            }
          });
        }
      });

    });

  }

  /////////////////////////////////////////////////////////////////////////////
  // FIREFOX MARKETPLACE
  /////////////////////////////////////////////////////////////////////////////

  function createMarketplaceTab(app, win, root, settings, container, tabs) {
    var packageList;

    function renderList(q) {
      win._toggleLoading(true);

      OSjs.Helpers.FirefoxMarketplace.createInstance({}, function(err, instance) {
        win._toggleLoading(false);
        if ( !err && !instance ) {
          err = 'No instance';
        }
        if ( err ) {
          alert('Failed initializing marketplace: ' + err);
          return;
        }

        win._toggleLoading(true);
        instance.search(q, function(err, list) {
          win._toggleLoading(false);
          if ( err ) {
            alert('Failed listing marketplace: ' + err);
            return;
          }

          var rows = [];
          list.forEach(function(i) {
            rows.push({
              name: i.name['en-US'] || i.name[Object.keys(i.name)[0]],
              version: i.current_version,
              description: i.description['en-US'],
              author: i.author,
              id: i.id
            });
          });

          packageList.setRows(rows);
          packageList.render();
        });
      });
    }

    function launchSelected(sel) {
      if ( !sel || !sel.id ) {
        return;
      }

      win._toggleLoading(true);
      OSjs.Helpers.FirefoxMarketplace.getInstance().launch(sel.id, function() {
        win._toggleLoading(false);
      });
    }

    var outer = document.createElement('div');
    outer.className = 'OuterWrapper';

    var buttonContainer = document.createElement('div');
    buttonContainer.className = 'ButtonContainer';

    var search = win._addGUIElement(new OSjs.GUI.Text('MarketplaceSearch', {placeholder: 'Search marketplace...', onKeyPress: function(ev) {
      if ( ev.keyCode === Utils.Keys.ENTER ) {
        renderList(search.getValue());
      }
    }}), outer);

    var tab = tabs.addTab('Marketplace', {title: 'Firefox Marketplace', onSelect: function() { // FIXME: Translation!
      renderList();
    }});

    packageList = win._addGUIElement(new OSjs.GUI.ListView('PackageListMarketplace'), outer);
    packageList.setColumns([
      {key: 'name', title: 'Name'},
      {key: 'description', title: 'Description'},
      {key: 'version', title: 'Version', width: 50, visible: false},
      {key: 'author', title: 'Author', visible: false},
      {key: 'id', title: 'id', visible: false}
    ]);
    packageList.render();

    var buttonRefresh = win._addGUIElement(new OSjs.GUI.Button('ButtonMarketplaceRefresh', {label: 'Refresh', onClick: function() { // FIXME: Translation
      search.setValue('');
      renderList();
    }}), buttonContainer);

    var buttonRun = win._addGUIElement(new OSjs.GUI.Button('ButtonMarketplaceRun', {label: 'Launch Selected', onClick: function() { // FIXME: Translation
      launchSelected(packageList.getSelected());
    }}), buttonContainer);

    outer.appendChild(buttonContainer);
    tab.appendChild(outer);
    root.appendChild(container);
  }

  /////////////////////////////////////////////////////////////////////////////
  // APP STORE
  /////////////////////////////////////////////////////////////////////////////

  function createStoreTab(app, win, root, settings, container, tabs) {
    var handler = OSjs.Core.getHandler();
    var pacman = handler.getPackageManager();
    var _ = OSjs.Applications.ApplicationSettings._;
    var packageList;

    function fetchJSON(cb) {
      var url = 'http://andersevenrud.github.io/OS.js-v2/store/packages.json';
      API.curl({
        body: {
          url: url,
          method: 'GET'
        }
      }, cb);
    }

    function renderList() {
      win._toggleLoading(true);

      fetchJSON(function(error, result) {
        win._toggleLoading(false);
        if ( error ) {
          alert('Failed getting packages: ' + error); // FIXME
          return;
        }
        var jsn = Utils.fixJSON(result.body);
        var rows = [];
        if ( jsn instanceof Array ) {
          jsn.forEach(function(i) {
            rows.push(i);
          });
        }

        packageList.setRows(rows);
        packageList.render();
      });
    }

    function installSelected(sel) {
      if ( !sel || !sel.download ) {
        return;
      }

      win._toggleLoading(true);

      VFS.remoteRead(sel.download, 'application/zip', function(error, ab) {
        win._toggleLoading(false);
        if ( error ) {
          alert('Failed to download package: ' + error); // FIXME
          return;
        }

        win._toggleLoading(true);
        var dest = new VFS.File({
          filename: Utils.filename(sel.download),
          type: 'file',
          path: 'home:///' + Utils.filename(sel.download),
          mime: 'application/zip'
        });
        VFS.write(dest, ab, function(error, success) {

          win._toggleLoading(false);
          if ( error ) {
            alert('Failed to write package: ' + error); // FIXME
            return;
          }

          win._toggleLoading(true);
          installPackage(dest, function(error) {
            win._toggleLoading(false);
            if ( error ) {
              alert('Failed to install package: ' + error); // FIXME
              return;
            }

            win._toggleLoading(true);
            pacman.generateUserMetadata(function() {
              win._toggleLoading(false);
            });
          });

        });

      });

    }

    var outer = document.createElement('div');
    outer.className = 'OuterWrapper';

    var buttonContainer = document.createElement('div');
    buttonContainer.className = 'ButtonContainer';

    var tab = tabs.addTab('AppStore', {title: 'App Store', onSelect: function() { // FIXME: Translation!
      renderList();
    }});

    packageList = win._addGUIElement(new OSjs.GUI.ListView('PackageList'), outer);
    packageList.setColumns([
      {key: 'name', title: 'Name'},
      {key: 'version', title: 'Version', width: 50},
      {key: 'author', title: 'Author'},
      {key: 'className', title: 'Class Name', visible: false},
      {key: 'download', title: 'Download URL', visible: false}
    ]);
    packageList.render();

    var buttonRefresh = win._addGUIElement(new OSjs.GUI.Button('ButtonPackageRefresh', {label: 'Refresh', onClick: function() { // FIXME: Translation
      renderList();
    }}), buttonContainer);

    var buttonInstall = win._addGUIElement(new OSjs.GUI.Button('ButtonPackageInstall', {label: 'Install Selected', onClick: function() { // FIXME: Translation
      installSelected(packageList.getSelected());
    }}), buttonContainer);

    outer.appendChild(buttonContainer);
    tab.appendChild(outer);
    root.appendChild(container);
  }

  /////////////////////////////////////////////////////////////////////////////
  // INSTALLED PACKAGES
  /////////////////////////////////////////////////////////////////////////////

  function createInstalledTab(app, win, root, settings, container, tabs) {
    var handler = OSjs.Core.getHandler();
    var pacman = handler.getPackageManager();
    var _ = OSjs.Applications.ApplicationSettings._;

    var outer = document.createElement('div');
    outer.className = 'OuterWrapper';

    var buttonContainer = document.createElement('div');
    buttonContainer.className = 'ButtonContainer';

    function openInstallPackage() {
      var opt = {
        mimes: ['application/zip'],
        type:  'open',
        path:  OSjs.API.getDefaultPath()
      };

      app._createDialog('File', [opt, function(btn, item) {
        if ( btn !== 'ok' ) { return; }
        installPackage(item, function() {
          renderList(true);
        });
      }], win);
    }

    function renderList(force) {
      if ( !packageList ) { return; }
      if ( !pacman ) { return; }

      win._toggleLoading(true);

      function _render() {
        var rows = [];
        var list = pacman.getPackages();
        Object.keys(list).forEach(function(k) {
          rows.push({
            iter: k,
            scope: list[k].scope,
            name: list[k].name
          });
        });
        packageList.setRows(rows);
        packageList.render();

        win._toggleLoading(false);
      }

      if ( force ) {
        pacman.generateUserMetadata(function() {
          _render();
        });
        return;
      }
      _render();
    }

    var tab = tabs.addTab('Packages', {title: 'Installed Packages', onSelect: function() { // FIXME: Translation!
      renderList();
    }});

    var packageList = win._addGUIElement(new OSjs.GUI.ListView('PackageList'), outer);
    packageList.setColumns([
      {key: 'iter', title: 'Application'},
      {key: 'scope', title: 'Scope'},
      {key: 'name', title: 'Name'}
    ]);
    packageList.render();

    var buttonRefresh = win._addGUIElement(new OSjs.GUI.Button('ButtonPackageRefresh', {label: 'Regenerate metadata', onClick: function() { // FIXME: Translation
      renderList(true);
    }}), buttonContainer);

    var buttonInstall = win._addGUIElement(new OSjs.GUI.Button('ButtonPackageInstall', {label: 'Install from zip', onClick: function() { // FIXME: Translation
      openInstallPackage();
    }}), buttonContainer);

    outer.appendChild(buttonContainer);
    tab.appendChild(outer);
    root.appendChild(container);
  }

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  function onCreate(win, root, settings, app) {
    var container = document.createElement('div');
    var tabs = win._addGUIElement(new GUI.Tabs('TabsPackages'), container);

    createInstalledTab(app, win, root, settings, container, tabs);
    createStoreTab(app, win, root, settings, container, tabs);
    createMarketplaceTab(app, win, root, settings, container, tabs);

    return container;
  }

  function applySettings(win, settings) {
  }

  var SettingsModule = {
    name: 'packages',
    title: 'Packages',
    icon: 'apps/system-software-install.png',
    onCreate: onCreate,
    applySettings: applySettings
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Modules = OSjs.Applications.ApplicationSettings.Modules || [];
  OSjs.Applications.ApplicationSettings.Modules.push(SettingsModule);

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
