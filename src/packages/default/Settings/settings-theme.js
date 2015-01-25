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

  function createThemeTab(win, root, tabs, settings) {
    var outer;

    var _ = OSjs.Applications.ApplicationSettings._;
    var wm = OSjs.Core.getWindowManager();
    var themes = {};

    wm.getThemes().forEach(function(t) {
      themes[t.name] = t.title;
    });

    var tab = tabs.addTab('Theme', {title: 'Theme', onSelect: function() {
    }});

    // Theme selection
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new GUI.Label('LabelThemeThemeName', {label: _('Theme')}), outer);
    var selectTheme = win._addGUIElement(new GUI.Select('ThemeThemeName'), outer);
    selectTheme.addItems(themes);
    selectTheme.setSelected(settings.theme);
    tab.appendChild(outer);

    // Enable animations
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new GUI.Label('LabelThemeEnableAnimation', {label: _('Enable Animations')}), outer);
    win._addGUIElement(new GUI.Switch('ThemeEnableAnimation', {value: settings.animations}), outer);
    tab.appendChild(outer);
  }

  function createBackgroundTab(win, root, tabs, settings) {
    var _ = OSjs.Applications.ApplicationSettings._;
    var wrapper, outer;

    var backgroundTypes = {
      'image':        API._('LBL_IMAGE'),
      'image-repeat': _('Image (Repeat)'),
      'image-center': _('Image (Centered)'),
      'image-fill':   _('Image (Fill)'),
      'image-strech': _('Image (Streched)'),
      'color':        API._('LBL_COLOR')
    };

    var tab = tabs.addTab('Background', {title: _('Background'), onSelect: function() {
    }});

    // Background Image
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    wrapper = document.createElement('div');
    wrapper.className = 'ButtonWrapper';
    win._addGUIElement(new GUI.Label('LabelThemeBackgroundImage', {label: _('Background Image')}), outer);
    var inputBackgroundImage = win._addGUIElement(new GUI.Text('ThemeBackgroundImage'), wrapper);
    inputBackgroundImage.setValue(settings.wallpaper);
    inputBackgroundImage.setDisabled(true);
    var buttonBackgroundImage = win._addGUIElement(new GUI.Button('ButtonThemeBackgroundImage', {label: '...', onClick: function() {
      win.createFileDialog(inputBackgroundImage.getValue(), function(file) {
        inputBackgroundImage.setValue(file);
      });
    }}), wrapper);
    outer.appendChild(wrapper);
    tab.appendChild(outer);

    // Background Color
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    wrapper = document.createElement('div');
    wrapper.className = 'ButtonWrapper';
    win._addGUIElement(new GUI.Label('LabelThemeBackgroundColor', {label: API._('LBL_BACKGROUND_COLOR')}), outer);
    var inputBackgroundColor = win._addGUIElement(new GUI.Text('ThemeBackgroundColor'), wrapper);

    function updateColor(color) {
      inputBackgroundColor.$input.style.backgroundColor = color;
      inputBackgroundColor.$input.style.color = Utils.invertHEX(color);
      inputBackgroundColor.setValue(color);
    }

    inputBackgroundColor.setDisabled(true);
    var buttonBackgroundColor = win._addGUIElement(new GUI.Button('ButtonThemeBackgroundColor', {label: '...', onClick: function() {
      win.createColorDialog(inputBackgroundColor.getValue(), updateColor);
    }}), wrapper);
    outer.appendChild(wrapper);
    tab.appendChild(outer);
    updateColor(settings.backgroundColor);

    // Background Type
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    win._addGUIElement(new GUI.Label('LabelThemeBackgroundType', {label: API._('LBL_BACKGROUND_IMAGE')}), outer);
    var selectBackgroundType = win._addGUIElement(new GUI.Select('ThemeBackgroundType'), outer);
    selectBackgroundType.addItems(backgroundTypes);
    selectBackgroundType.setSelected(settings.background);
    tab.appendChild(outer);
  }

  function createFontTab(win, root, tabs, settings) {
    var outer, wrapper;

    var _ = OSjs.Applications.ApplicationSettings._;
    var tab = tabs.addTab('Fonts', {title: API._('LBL_FONT'), onSelect: function() {
    }});

    // Font Type
    outer = document.createElement('div');
    outer.className = 'OuterWrapper';
    wrapper = document.createElement('div');
    wrapper.className = 'ButtonWrapper';
    win._addGUIElement(new GUI.Label('LabelThemeFont', {label: API._('LBL_FONT')}), outer);
    var inputFont = win._addGUIElement(new GUI.Text('ThemeFont'), wrapper);

    function updateFont(font) {
      inputFont.setValue(font);
      inputFont.$input.style.fontFamily = font;
    }
    var buttonFont = win._addGUIElement(new GUI.Button('ButtonThemeFont', {label: '...', onClick: function() {
      win.createFontDialog(inputFont.getValue(), function(font) {
        updateFont(font);
      });
    }}), wrapper);

    inputFont.setDisabled(true);
    updateFont(settings.fontFamily);
    outer.appendChild(wrapper);
    tab.appendChild(outer);
  }

  function onCreate(win, root, settings) {
    var container = document.createElement('div');

    var tabs = win._addGUIElement(new GUI.Tabs('TabsTheme'), container);
    createThemeTab(win, root, tabs, settings);
    createBackgroundTab(win, root, tabs, settings);
    createFontTab(win, root, tabs, settings);
    root.appendChild(container);

    return container;
  }

  function applySettings(win, settings) {
    settings.theme           = win._getGUIElement('ThemeThemeName').getValue();
    settings.animations      = win._getGUIElement('ThemeEnableAnimation').getValue();
    settings.wallpaper       = win._getGUIElement('ThemeBackgroundImage').getValue();
    settings.background      = win._getGUIElement('ThemeBackgroundType').getValue();
    settings.fontFamily      = win._getGUIElement('ThemeFont').getValue();
    settings.backgroundColor = win._getGUIElement('ThemeBackgroundColor').getValue();
  }

  var SettingsModule = {
    name: 'theme',
    title: 'Theme',
    icon: 'apps/background.png',
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
