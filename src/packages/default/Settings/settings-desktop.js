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

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  function createGeneralTab(win, root, tabs, settings) {

    var _ = OSjs.Applications.ApplicationSettings._;
    var outer, wrapper;

    var tab = tabs.addTab('General', {title: _('General'), onSelect: function() {
    }});

    // Enable Sounds
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new OSjs.GUI.Label('LabelDesktopEnableSound', {label: _('Enable Sounds')}), outer);
    var selectDesktop = win._addGUIElement(new OSjs.GUI.Select('DesktopEnableSound'), outer);
    selectDesktop.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    selectDesktop.setSelected(settings.enableSounds ? 'yes' : 'no');
    tab.appendChild(outer);

    // Enable Hotkeys
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new OSjs.GUI.Label('LabelDesktopEnableHotkey', {label: _('Enable Hotkeys')}), outer);
    var selectDesktop = win._addGUIElement(new OSjs.GUI.Select('DesktopEnableHotkey'), outer);
    selectDesktop.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    selectDesktop.setSelected(settings.enableHotkeys ? 'yes' : 'no');
    tab.appendChild(outer);

    // Enable Window Switcher
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new OSjs.GUI.Label('LabelDesktopEnableWindow Switcher', {label: _('Enable Window Switcher')}), outer);
    var selectDesktop = win._addGUIElement(new OSjs.GUI.Select('DesktopEnableWindowSwitcher'), outer);
    selectDesktop.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    selectDesktop.setSelected(settings.enableSwitcher ? 'yes' : 'no');
    tab.appendChild(outer);

    // Desktop Margin
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    var labelMargin = win._addGUIElement(new OSjs.GUI.Label('LabelDesktopMargin', {label: _('Desktop Margin')}), outer);
    function updateMargin(value) {
      labelMargin.$element.innerHTML = _('Desktop Margin ({0}px)', value);
    }
    win._addGUIElement(new OSjs.GUI.Slider('SliderMargin', {min: 0, max: 50, val: settings.desktop.margin, onChange: function(value, percentage) {
      updateMargin(value);
    }}), outer);
    updateMargin(settings.desktop.margin);
    tab.appendChild(outer);
  }

  function createIconViewTab(win, root, tabs, settings) {
    var _ = OSjs.Applications.ApplicationSettings._;
    var outer, wrapper;
    var tab = tabs.addTab('IconView', {title: 'Icon View', onSelect: function() {
    }});

    // Enable IconView
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new OSjs.GUI.Label('LabelDesktopEnableIconView', {label: _('Enable Icon View')}), outer);
    var selectDesktop = win._addGUIElement(new OSjs.GUI.Select('DesktopEnableIconView'), outer);
    selectDesktop.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    selectDesktop.setSelected(settings.enableIconView ? 'yes' : 'no');
    tab.appendChild(outer);

    // Enable IconView Invert Color
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new OSjs.GUI.Label('LabelDesktopInvertIconViewColor', {label: _('Invert Text Color')}), outer); // FIXME: Translation
    var selectDesktop = win._addGUIElement(new OSjs.GUI.Select('DesktopInvertIconViewColor'), outer);
    selectDesktop.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    selectDesktop.setSelected(settings.invertIconViewColor ? 'yes' : 'no');
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
    settings.enableSounds         = win._getGUIElement('DesktopEnableSound').getValue() === 'yes';
    settings.enableHotkeys        = win._getGUIElement('DesktopEnableHotkey').getValue() === 'yes';
    settings.enableSwitched       = win._getGUIElement('DesktopEnableWindowSwitcher').getValue() === 'yes';
    settings.enableIconView       = win._getGUIElement('DesktopEnableIconView').getValue() === 'yes';
    settings.invertIconViewColor  = win._getGUIElement('DesktopInvertIconViewColor').getValue() === 'yes';
    settings.desktop.margin       = win._getGUIElement('SliderMargin').getValue();
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
