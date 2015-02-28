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
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  var PanelItemWindow = function(app, parentWindow) {
    Window.apply(this, ['CoreWMPanelItemWindow', {
      icon: "categories/applications-system.png",
      title: API._("CoreWM Panel Item Chooser"), // FIXME: Translation
      allow_resize: false,
      allow_maximize: false,
      allow_minimize: false,
      gravity: 'center',
      width:400,
      height:390
    }, app]);

    this.parentWindow = parentWindow;
    this.buttonConfirm = null;
    this.selectedItem = null;
  };

  PanelItemWindow.prototype = Object.create(Window.prototype);

  PanelItemWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    var list = [];
    var items = OSjs.Applications.CoreWM.PanelItems;
    for ( var i in items ) {
      if ( items.hasOwnProperty(i) ) {
        list.push({
          key:   i,
          image: API.getIcon(items[i].Icon),
          name:  Utils.format("{0} ({1})", items[i].Name, items[i].Description)
        });
      }
    }

    var _onActivate = function() {
      if ( self.selectedItem && self.parentWindow ) {
        addPanelItem(self.selectedItem.key, self.parentWindow);
      }
      self._close();
    };

    var listView = this._addGUIElement(new OSjs.GUI.ListView('PanelItemChooserDialogListView'), root);
    listView.setColumns([
      {key: 'image', title: '', type: 'image', width: 16},
      {key: 'name',  title: API._('LBL_NAME')},
      {key: 'key',   title: 'Key', visible: false}
     ]);
    listView.onActivate = function(ev, el, item) {
      if ( item && item.key ) {
        self.selectedItem = item;
        self.buttonConfirm.setDisabled(false);
        _onActivate();
      }
    };
    listView.onSelect = function(ev, el, item) {
      if ( item && item.key ) {
        self.selectedItem = item;
        self.buttonConfirm.setDisabled(false);
      }
    };

    this.buttonConfirm = this._addGUIElement(new OSjs.GUI.Button('OK', {label: API._('LBL_ADD'), onClick: function(el, ev) {
      if ( !this.isDisabled() ) {
        _onActivate();
      }
    }}), root);
    this.buttonConfirm.setDisabled(true);

    listView.setRows(list);
    listView.render();

    return root;
  };

  PanelItemWindow.prototype.destroy = function() {
    // Destroy custom objects etc. here

    Window.prototype.destroy.apply(this, arguments);
  };

  PanelItemWindow.prototype._onKeyEvent = function(ev) {
    Window.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === Utils.Keys.ESC ) {
      this._close();
    }
  };

  var ApplicationSettingsWindow = function(app, metadata, tab) {
    Window.apply(this, ['ApplicationSettingsWindow', {
      icon: "categories/applications-system.png",
      title: metadata.name,
      allow_resize: false,
      allow_maximize: false,
      gravity: 'center',
      width: 500,
      height: 550
    }, app]);

    this.currentPanelItem = null;
    this.panelItems       = [];
    this.openTab          = tab;
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  var panelItems = [];
  var currentPanelItem = null;

  function showPanelItemWindow(pwin) {
    var wm = OSjs.Core.getWindowManager();
    var win = wm.getWindow('CoreWMPanelItemWindow');
    if ( !win ) {
      win = new PanelItemWindow(pwin._appRef, pwin);
      pwin._appRef._addWindow(win);
    }

    setTimeout(function() {
      win._restore();
    }, 10);
  }

  function refreshPanelItems(win) {
    currentPanelItem = null;

    var panelItemList = win._getGUIElement('PanelItemListView');
    var addItems = [];
    for ( var j = 0; j < panelItems.length; j++ ) {
      addItems.push({name: panelItems[j].name, index: j});
    }
    panelItemList.setColumns([{key: 'name', title: API._('Name')}, {key: 'index', title: 'Index', visible: false}]);
    panelItemList.setRows(addItems);
    panelItemList.render();

    win._getGUIElement('PanelItemButtonRemove').setDisabled(true);
    win._getGUIElement('PanelItemButtonUp').setDisabled(true);
    win._getGUIElement('PanelItemButtonDown').setDisabled(true);
  }

  function addPanelItem(name, win) {
    console.debug("CoreWM::addPanelItem()", name);

    panelItems.push({name: name});

    refreshPanelItems(win);
    win._focus();
  }

  function removePanelItem(iter, win) {
    panelItems.splice(iter.index, 1);

    refreshPanelItems(win);
    win._focus();
  }

  function movePanelItem(iter, pos, win) {
    if ( iter.index <= 0 && pos < 0 ) { return; } // At top
    if ( pos > 0 && (iter.index >= (panelItems.length-1)) ) { return; } // At bottom

    var value = panelItems[iter.index];
    panelItems.splice(iter.index, 1);
    if ( pos > 0 ) {
      panelItems.splice(iter.index + 1, 0, value);
    } else if ( pos < 0 ) {
      panelItems.splice(iter.index - 1, 0, value);
    }

    refreshPanelItems(win);
    win._focus();
  }

  function resetPanelItems(win) {
    var wm = OSjs.Core.getWindowManager();
    var defaults = wm.getDefaultSetting('panels');
    console.debug("CoreWM::resetPanelItems()", defaults);

    panelItems = defaults[0].items;

    refreshPanelItems(win);
    win._focus();
  }

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  function createAppearenceTab(win, root, tabs, settings) {
    var _ = OSjs.Applications.ApplicationSettings._;
    var outer, wrapper;
    var opacity = 85;
    if ( typeof settings.panels[0].options.opacity === 'number' ) {
      opacity = settings.panels[0].options.opacity;
    }

    var tab = tabs.addTab('Appearence', {title: API._('LBL_APPEARANCE'), onSelect: function() { // FIXME: Translation
    }});

    // Position
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new OSjs.GUI.Label('LabelPanelPosition', {label: _('Position')}), outer);
    var selectPanelPosition = win._addGUIElement(new OSjs.GUI.Select('PanelPosition'), outer);
    selectPanelPosition.addItems({
      'top':      API._('LBL_TOP'),
      'bottom':   API._('LBL_BOTTOM')
    });
    selectPanelPosition.setSelected(settings.panels[0].options.position);
    tab.appendChild(outer);

    // Autohide
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new OSjs.GUI.Label('LabelPanelAutohide', {label: _('Autohide')}), outer);
    win._addGUIElement(new OSjs.GUI.Switch('PanelAutohide', {value: settings.panels[0].options.autohide}), outer);
    tab.appendChild(outer);

    // Ontop
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new OSjs.GUI.Label('LabelPanelOntop', {label: _('Ontop')}), outer);
    win._addGUIElement(new OSjs.GUI.Switch('PanelOntop', {value: settings.panels[0].options.ontop}), outer);
    tab.appendChild(outer);

    // Background color
    wrapper = document.createElement('div');
    wrapper.className = 'ButtonWrapper';

    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new OSjs.GUI.Label('LabelPanelBackgroundColor', {label: API._('LBL_BACKGROUND_COLOR')}), outer);
    var inputBackgroundColor = win._addGUIElement(new OSjs.GUI.Text('PanelBackgroundColor'), wrapper);

    function updateBackground(color) {
      inputBackgroundColor.$input.style.backgroundColor = color;
      inputBackgroundColor.$input.color = Utils.invertHEX(color);
      inputBackgroundColor.setValue(color);
    }
    inputBackgroundColor.setDisabled(true);

    var buttonBackgroundColor = win._addGUIElement(new OSjs.GUI.Button('ButtonPanelBackgroundColor', {label: '...', onClick: function() {
      win.createColorDialog(inputBackgroundColor.getValue(), function(color) {
        updateBackground(color);
      });
    }}), wrapper);

    updateBackground(settings.panels[0].options.background || '#101010');
    outer.appendChild(wrapper);
    tab.appendChild(outer);

    // Foreground color
    wrapper = document.createElement('div');
    wrapper.className = 'ButtonWrapper';

    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new OSjs.GUI.Label('LabelPanelForegroundColor', {label: API._('LBL_TEXT_COLOR')}), outer);
    var inputForegroundColor = win._addGUIElement(new OSjs.GUI.Text('PanelForegroundColor'), wrapper);

    function updateForeground(color) {
      inputForegroundColor.$input.style.backgroundColor = color;
      inputForegroundColor.$input.color = Utils.invertHEX(color);
      inputForegroundColor.setValue(color);
    }
    inputForegroundColor.setDisabled(true);

    var buttonForegroundColor = win._addGUIElement(new OSjs.GUI.Button('ButtonPanelForegroundColor', {label: '...', onClick: function() {
      win.createColorDialog(inputForegroundColor.getValue(), function(color) {
        updateForeground(color);
      });
    }}), wrapper);

    updateForeground(settings.panels[0].options.foreground || '#ffffff');
    outer.appendChild(wrapper);
    tab.appendChild(outer);

    // Opacity
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    var labelMargin = win._addGUIElement(new OSjs.GUI.Label('LabelPanelOpacity', {label: _('Opacity')}), outer); // FIXME: Translation
    win._addGUIElement(new OSjs.GUI.Slider('PanelOpacity', {min: 0, max:100, val: opacity}), outer);
    tab.appendChild(outer);
  }

  function createItemsTab(win, root, tabs, settings) {
    var _ = OSjs.Applications.ApplicationSettings._;
    var tab = tabs.addTab('Items', {title: _('Items'), onSelect: function() {
    }});

    var outer, wrapper;

    var panelItemContainer = document.createElement('div');
    panelItemContainer.className = 'PanelItemsContainer';

    var panelItemButtons = document.createElement('div');
    panelItemButtons.className = 'PanelItemButtons';

    var panelItemButtonAdd = win._addGUIElement(new OSjs.GUI.Button('PanelItemButtonAdd', {icon: API.getIcon('actions/add.png'), onClick: function(el, ev) {
      showPanelItemWindow(win);
      currentPanelItem = null;
      panelItemButtonRemove.setDisabled(true);
      panelItemButtonUp.setDisabled(true);
      panelItemButtonDown.setDisabled(true);
    }}), panelItemButtons);

    var panelItemButtonRemove = win._addGUIElement(new OSjs.GUI.Button('PanelItemButtonRemove', {disabled: true, icon: API.getIcon('actions/remove.png'), onClick: function(el, ev) {
      if ( currentPanelItem ) {
        removePanelItem(currentPanelItem, win);
      }
    }}), panelItemButtons);

    var panelItemButtonUp = win._addGUIElement(new OSjs.GUI.Button('PanelItemButtonUp', {disabled: true, icon: API.getIcon('actions/up.png'), onClick: function(el, ev) {
      if ( currentPanelItem ) {
        movePanelItem(currentPanelItem, -1, win);
      }
    }}), panelItemButtons);

    var panelItemButtonDown = win._addGUIElement(new OSjs.GUI.Button('PanelItemButtonDown', {disabled: true, icon: API.getIcon('actions/down.png'), onClick: function(el, ev) {
      if ( currentPanelItem ) {
        movePanelItem(currentPanelItem, 1, win);
      }
    }}), panelItemButtons);

    var panelItemButtonReset = win._addGUIElement(new OSjs.GUI.Button('PanelItemButtonReset', {tooltop: API._('LBL_RESET_DEFAULT'), icon: API.getIcon('actions/revert.png'), onClick: function(el, ev) {
      resetPanelItems(win);
    }}), panelItemButtons);

    var panelItemList = win._addGUIElement(new OSjs.GUI.ListView('PanelItemListView'), panelItemContainer);

    panelItemList.onSelect = function(ev, el, item) {
      if ( item ) {
        if ( item.index <= 0 ) {
          panelItemButtonUp.setDisabled(true);
        } else {
          panelItemButtonUp.setDisabled(false);
        }

        if ( item.index >= (panelItems.length-1) ) {
          panelItemButtonDown.setDisabled(true);
        } else {
          panelItemButtonDown.setDisabled(false);
        }

        panelItemButtonRemove.setDisabled(false);
        currentPanelItem = item;
      } else {
        panelItemButtonRemove.setDisabled(true);
        panelItemButtonUp.setDisabled(true);
        panelItemButtonDown.setDisabled(true);
        currentPanelItem = null;
      }
    };

    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    panelItemContainer.appendChild(panelItemButtons);
    outer.appendChild(panelItemContainer);
    tab.appendChild(outer);
  }

  function onCreate(win, root, settings) {
    var container = document.createElement('div');

    var tabs = win._addGUIElement(new GUI.Tabs('TabsPanel'), container);
    createAppearenceTab(win, root, tabs, settings);
    createItemsTab(win, root, tabs, settings);
    root.appendChild(container);

    var wm = OSjs.Core.getWindowManager();
    var panels = wm.getSetting('panels');
    if ( !panels || !panels[0] ) {
      panels = wm.getDefaultSetting('panels');
    }
    panelItems = panels[0].items;

    refreshPanelItems(win);

    return container;
  }

  function applySettings(win, settings) {
    settings.panels[0].options.position   = win._getGUIElement('PanelPosition').getValue();
    settings.panels[0].options.autohide   = win._getGUIElement('PanelAutohide').getValue();
    settings.panels[0].options.opacity    = win._getGUIElement('PanelOpacity').getValue();
    settings.panels[0].options.background = win._getGUIElement('PanelBackgroundColor').getValue();
    settings.panels[0].options.foreground = win._getGUIElement('PanelForegroundColor').getValue();
    settings.panels[0].items              = Array.prototype.concat.call(panelItems);
  }

  var SettingsModule = {
    name: 'panel',
    title: 'Panel',
    icon: 'categories/applications-utilities.png',
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
