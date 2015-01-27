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

  function createGeneralTab(win, root, tabs, settings) {

    var _ = OSjs.Applications.ApplicationSettings._;
    var outer, wrapper;

    var tab = tabs.addTab('General', {title: _('General'), onSelect: function() {
    }});

    // Enable Hotkeys
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new GUI.Label('LabelDesktopEnableHotkey', {label: _('Enable Hotkeys')}), outer);
    win._addGUIElement(new GUI.Switch('DesktopEnableHotkey', {value: settings.enableHotkeys}), outer);
    tab.appendChild(outer);

    // Enable Window Switcher
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new GUI.Label('LabelDesktopEnableWindow Switcher', {label: _('Enable Window Switcher')}), outer);
    win._addGUIElement(new GUI.Switch('DesktopEnableWindowSwitcher', {value: settings.enableSwitcher}), outer);
    tab.appendChild(outer);

    // Desktop Margin
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    var labelMargin = win._addGUIElement(new GUI.Label('LabelDesktopMargin', {label: _('Desktop Margin')}), outer);
    function updateMargin(value) {
      labelMargin.$element.innerHTML = _('Desktop Margin ({0}px)', value);
    }
    win._addGUIElement(new GUI.Slider('SliderMargin', {min: 0, max: 50, val: settings.desktopMargin, onChange: function(value, percentage) {
      updateMargin(value);
    }}), outer);
    updateMargin(settings.desktopMargin);
    tab.appendChild(outer);
  }

  function createIconViewTab(win, root, tabs, settings) {
    var _ = OSjs.Applications.ApplicationSettings._;
    var outer, wrapper;
    var tab = tabs.addTab('IconView', {title: _('Icon View'), onSelect: function() {
    }});

    // Enable IconView
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new GUI.Label('LabelDesktopEnableIconView', {label: _('Enable Icon View')}), outer);
    win._addGUIElement(new GUI.Switch('DesktopEnableIconView', {value: settings.enableIconView}), outer);
    tab.appendChild(outer);

    // Enable IconView Invert Color
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new GUI.Label('LabelDesktopInvertIconViewColor', {label: _('Invert Text Color')}), outer); // FIXME: Translation
    win._addGUIElement(new GUI.Switch('DesktopInvertIconViewColor', {value: settings.invertIconViewColor}), outer);
    tab.appendChild(outer);
  }

  function onCreate(win, root, settings) {
    var container = document.createElement('div');

    var tabs = win._addGUIElement(new GUI.Tabs('TabsDesktop'), container);
    createGeneralTab(win, root, tabs, settings);
    createIconViewTab(win, root, tabs, settings);
    root.appendChild(container);

    return container;
  }

  function applySettings(win, settings) {
    settings.enableHotkeys       = win._getGUIElement('DesktopEnableHotkey').getValue();
    settings.enableSwitched      = win._getGUIElement('DesktopEnableWindowSwitcher').getValue();
    settings.enableIconView      = win._getGUIElement('DesktopEnableIconView').getValue();
    settings.invertIconViewColor = win._getGUIElement('DesktopInvertIconViewColor').getValue();
    settings.desktopMargin       = win._getGUIElement('SliderMargin').getValue();
  }

  var SettingsModule = {
    name: 'desktop',
    title: 'Desktop',
    icon: 'devices/display.png',
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
