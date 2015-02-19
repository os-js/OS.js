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

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  function onCreate(win, root, settings) {
    var handler = OSjs.Core.getHandler();
    var pacman = handler.getPackageManager();

    var container = document.createElement('div');
    var tabs = win._addGUIElement(new GUI.Tabs('TabsUser'), container);
    var _ = OSjs.Applications.ApplicationSettings._;

    var outer = document.createElement('div');
    outer.className = 'OuterWrapper';

    var buttonContainer = document.createElement('div');
    buttonContainer.className = 'ButtonContainer';

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

    var tab = tabs.addTab('Packages', {title: 'Packages', onSelect: function() {}}); // FIXME: Translation!

    var packageList = win._addGUIElement(new OSjs.GUI.ListView('PackageList'), outer);
    packageList.setColumns([
      {key: 'iter', title: 'Application'},
      {key: 'scope', title: 'Scope'},
      {key: 'name', title: 'Name'}
    ]);
    packageList.render();

    var buttonRefresh = win._addGUIElement(new OSjs.GUI.Button('ButtonPackageRefresh', {icon: API.getIcon('actions/reload.png'), onClick: function() {
      renderList(true);
    }}), buttonContainer);

    outer.appendChild(buttonContainer);
    tab.appendChild(outer);
    root.appendChild(container);

    renderList();

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
