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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function PanelItemDialog(app, metadata, scheme, callback) {
    Window.apply(this, ['ApplicationSettingsPanelItemsWindow', {
      icon: metadata.icon,
      title: metadata.name + ' - Panel Items',
      width: 400,
      height: 300
    }, app, scheme]);

    this.callback = callback;
    this.closed = false;
  }

  PanelItemDialog.prototype = Object.create(Window.prototype);
  PanelItemDialog.constructor = Window;

  PanelItemDialog.prototype.init = function(wm, app, scheme) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    // Load and set up scheme (GUI) here
    scheme.render(this, 'PanelSettingWindow', root);

    var view = scheme.find(this, 'List');

    var items = OSjs.Applications.CoreWM.PanelItems;
    var list = [];
    Object.keys(items).forEach(function(i, idx) {
      list.push({
        value: i,
        columns: [{
          icon: API.getIcon(items[i].Icon),
          label: Utils.format("{0} ({1})", items[i].Name, items[i].Description)
        }]
      });
    });
    view.clear();
    view.add(list);

    scheme.find(this, 'ButtonOK').on('click', function() {
      this.closed = true;
      var selected = view.get('selected');
      self.callback('ok', selected.length ? selected[0] : null);
      self._close();
    });

    scheme.find(this, 'ButtonCancel').on('click', function() {
      self._close();
    });

    return root;
  };
  PanelItemDialog.prototype._close = function() {
    if ( !this.closed ) {
      this.callback('cancel');
    }
    return Window.prototype._close.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationSettingsWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationSettingsWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 500,
      height: 500
    }, app, scheme]);

    this.settings = {};
    this.panelItems = [];
  }

  ApplicationSettingsWindow.prototype = Object.create(Window.prototype);
  ApplicationSettingsWindow.constructor = Window.prototype;

  /**
   * Init
   */
  ApplicationSettingsWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    this.settings = Utils.cloneObject(wm.getSettings());
    delete this.settings.desktopIcons;
    delete this.settings.fullscreen;
    delete this.settings.moveOnResize;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'SettingsWindow', root);

    var indexes = ['TabsTheme', 'TabsDesktop', 'TabsPanel', 'TabsUser', 'TabsPackages'];
    var container = scheme.find(this, 'TabsContainer');
    var header = scheme.find(this, 'Header');
    var view = scheme.find(this, 'IconMenu');

    function setContainer(idx) {
      var found;
      container.$element.querySelectorAll('gui-tabs').forEach(function(el, i) {
        Utils.$removeClass(el, 'active');
        if ( i === idx ) {
          found = el;
        }
      });

      header.set('value', indexes[idx].replace(/^Tabs/, ''));
      Utils.$addClass(found, 'active');

      view.set('value', idx);
    }

    view.on('select', function(ev) {
      if ( ev.detail && ev.detail.entries && ev.detail.entries.length ) {
        var sel = ev.detail.entries[0].index;
        setContainer(sel);
      }
    });

    scheme.find(this, 'ButtonApply').on('click', function() {
      self.applySettings(wm, scheme);
    });

    this.initThemeTab(wm, scheme);
    this.initDesktopTab(wm, scheme);
    this.initPanelTab(wm, scheme);
    this.initUserTab(wm, scheme);
    this.initPackagesTab(wm, scheme);

    setContainer(0);

    return root;
  };

  /**
   * Destroy
   */
  ApplicationSettingsWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  /**
   * Theme
   */
  ApplicationSettingsWindow.prototype.initThemeTab = function(wm, scheme) {
    var self = this;
    var _ = OSjs.Applications.ApplicationSettings._;

    var styleThemes = [];
    var soundThemes = [];
    var iconThemes = [];
    var backgroundTypes = [
      {value: 'image',        label: API._('LBL_IMAGE')},
      {value: 'image-repeat', label: _('Image (Repeat)')},
      {value: 'image-center', label: _('Image (Centered)')},
      {value: 'image-fill',   label: _('Image (Fill)')},
      {value: 'image-strech', label: _('Image (Streched)')},
      {value: 'color',        label: API._('LBL_COLOR')}
    ];

    var tmp;

    wm.getStyleThemes().forEach(function(t) {
      styleThemes.push({label: t.title, value: t.name});
    });

    tmp = wm.getSoundThemes();
    Object.keys(tmp).forEach(function(t) {
      soundThemes.push({label: tmp[t], value: t});
    });

    tmp = wm.getIconThemes();
    Object.keys(tmp).forEach(function(t) {
      iconThemes.push({label: tmp[t], value: t});
    });

    scheme.find(this, 'StyleThemeName').add(styleThemes).set('value', this.settings.theme);
    scheme.find(this, 'SoundThemeName').add(soundThemes).set('value', this.settings.sounds);
    scheme.find(this, 'IconThemeName').add(iconThemes).set('value', this.settings.icons);

    scheme.find(this, 'EnableAnimations').set('value', this.settings.animations);
    scheme.find(this, 'EnableSounds').set('value', this.settings.enableSounds);
    scheme.find(this, 'EnableTouchMenu').set('value', this.settings.useTouchMenu);

    var backImage = scheme.find(this, 'BackgroundImage').set('value', this.settings.wallpaper).on('open', function(ev) {
      self._toggleDisabled(true);

      API.createDialog('File', {
        mime: ['^image'],
        file: new VFS.File(ev.detail)
      }, function(ev, button, result) {
        self._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          backImage.set('value', result.path);
        }
      });
    });
    var backColor = scheme.find(this, 'BackgroundColor').set('value', this.settings.backgroundColor).on('open', function(ev) {
      self._toggleDisabled(true);

      API.createDialog('Color', {
        color: ev.detail
      }, function(ev, button, result) {
        self._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          backColor.set('value', result.hex);
        }
      });
    });

    scheme.find(this, 'BackgroundStyle').add(backgroundTypes).set('value', this.settings.background);

    scheme.find(this, 'FontName').set('value', this.settings.fontFamily);
  };

  /**
   * Desktop
   */
  ApplicationSettingsWindow.prototype.initDesktopTab = function(wm, scheme) {
    scheme.find(this, 'EnableHotkeys').set('value', this.settings.enableHotkeys);
    scheme.find(this, 'EnableWindowSwitcher').set('value', this.settings.enableSwitcher);

    scheme.find(this, 'DesktopMargin').set('value', this.settings.desktopMargin);
    scheme.find(this, 'CornerSnapping').set('value', this.settings.windowCornerSnap);
    scheme.find(this, 'WindowSnapping').set('value', this.settings.windowSnap);

    scheme.find(this, 'EnableIconView').set('value', this.settings.enableIconView);
    scheme.find(this, 'EnableIconViewInvert').set('value', this.settings.invertIconViewColor);
  };

  /**
   * Panel
   */
  ApplicationSettingsWindow.prototype.initPanelTab = function(wm, scheme) {
    var self = this;
    var panel = this.settings.panels[0];

    var panelPositions = [
      {value: 'top',    label: API._('LBL_TOP')},
      {value: 'bottom', label: API._('LBL_BOTTOM')}
    ];

    var opacity = 85;
    if ( typeof panel.options.opacity === 'number' ) {
      opacity = panel.options.opacity;
    }

    // Style
    scheme.find(this, 'PanelPosition').add(panelPositions).set('value', panel.options.position);
    scheme.find(this, 'PanelAutoHide').set('value', panel.options.autohide);
    scheme.find(this, 'PanelOntop').set('value', panel.options.ontop);
    var panelFg = scheme.find(this, 'PanelBackgroundColor').set('value', panel.options.background || '#101010').on('open', function(ev) {
      self._toggleDisabled(true);

      API.createDialog('Color', {
        color: ev.detail
      }, function(ev, button, result) {
        self._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          panelFg.set('value', result.hex);
        }
      });
    });
    var panelBg = scheme.find(this, 'PanelForegroundColor').set('value', panel.options.foreground || '#ffffff').on('open', function(ev) {
      self._toggleDisabled(true);

      API.createDialog('Color', {
        color: ev.detail
      }, function(ev, button, result) {
        self._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          panelBg.set('value', result.hex);
        }
      });
    });
    scheme.find(this, 'PanelOpacity').set('value', opacity);

    // Items
    var view = scheme.find(this, 'PanelItems');
    var buttonAdd = scheme.find(this, 'PanelButtonAdd');
    var buttonRemove = scheme.find(this, 'PanelButtonRemove');
    var buttonUp = scheme.find(this, 'PanelButtonUp');
    var buttonDown = scheme.find(this, 'PanelButtonDown');
    var buttonReset = scheme.find(this, 'PanelButtonReset');

    var max = 0;
    var items = OSjs.Applications.CoreWM.PanelItems;

    this.panelItems = panel.items || [];

    function checkSelection(idx) {
      buttonRemove.set('disabled', idx < 0);
      buttonUp.set('disabled', idx <= 0);
      buttonDown.set('disabled', idx < 0 || idx >= max);
    }

    function renderItems(setSelected) {
      var list = [];
      self.panelItems.forEach(function(i, idx) {
        var name = i.name;
        list.push({
          value: idx,
          columns: [{
            icon: API.getIcon(items[name].Icon),
            label: Utils.format("{0} ({1})", items[name].Name, items[name].Description)
          }]
        });
      });
      max = self.panelItems.length - 1;

      view.clear();
      view.add(list);

      if ( typeof setSelected !== 'undefined' ) {
        view.set('selected', setSelected);
        checkSelection(setSelected);
      } else {
        checkSelection(-1);
      }
    }

    function movePanelItem(index, pos) {
      var value = self.panelItems[index];
      var newIndex = index + pos;
      self.panelItems.splice(index, 1);
      self.panelItems.splice(newIndex, 0, value);
      renderItems(newIndex);
    }

    view.on('select', function(ev) {
      if ( ev && ev.detail && ev.detail.entries ) {
        checkSelection(ev.detail.entries[0].index);
      }
    });

    buttonAdd.on('click', function() {
      self._toggleDisabled(true);
      self._app.panelItemsDialog(function(ev, result) {
        self._toggleDisabled(false);

        if ( result ) {
          self.panelItems.push({name: result.data});
          renderItems();
        }
      });
    });

    buttonRemove.on('click', function() {
      var selected = view.get('selected');
      if ( selected.length ) {
        self.panelItems.splice(selected[0].index, 1);
        renderItems();
      }
    });

    buttonUp.on('click', function() {
      var selected = view.get('selected');
      if ( selected.length ) {
        movePanelItem(selected[0].index, -1);
      }
    });
    buttonDown.on('click', function() {
      var selected = view.get('selected');
      if ( selected.length ) {
        movePanelItem(selected[0].index, 1);
      }
    });

    buttonReset.on('click', function() {
      var defaults = wm.getDefaultSetting('panels');
      self.panelItems = defaults[0].items;
      renderItems();
    });

    renderItems();
  };

  /**
   * User
   */
  ApplicationSettingsWindow.prototype.initUserTab = function(wm, scheme) {
    var user = OSjs.Core.getHandler().getUserData();
    var locales = OSjs.Core.getHandler().getConfig('Core').Languages;
    var langs = [];

    Object.keys(locales).forEach(function(l) {
      langs.push({label: locales[l], value: l});
    });

    var data = OSjs.Core.getHandler().getUserData();
    scheme.find(this, 'UserID').set('value', user.id);
    scheme.find(this, 'UserName').set('value', user.name);
    scheme.find(this, 'UserUsername').set('value', user.username);
    scheme.find(this, 'UserGroups').set('value', user.groups);

    scheme.find(this, 'UserLocale').add(langs).set('value', API.getLocale());
  };

  /**
   * Packages
   */
  ApplicationSettingsWindow.prototype.initPackagesTab = function(wm, scheme) {
  };

  /**
   * Apply
   */
  ApplicationSettingsWindow.prototype.applySettings = function(wm, scheme) {
    // Theme
    this.settings.theme = scheme.find(this, 'StyleThemeName').get('value');
    this.settings.sounds = scheme.find(this, 'SoundThemeName').get('value');
    this.settings.icons = scheme.find(this, 'IconThemeName').get('value');
    this.settings.animations = scheme.find(this, 'EnableAnimations').get('value');
    this.settings.enableSounds = scheme.find(this, 'EnableSounds').get('value');
    this.settings.useTouchMenu = scheme.find(this, 'EnableTouchMenu').get('value');
    this.settings.wallpaper = scheme.find(this, 'BackgroundImage').get('value');
    this.settings.backgroundColor = scheme.find(this, 'BackgroundColor').get('value');
    this.settings.background = scheme.find(this, 'BackgroundStyle').get('value');

    // Desktop
    this.settings.enableHotkeys = scheme.find(this, 'EnableHotkeys').get('value');
    this.settings.enableSwitcher = scheme.find(this, 'EnableWindowSwitcher').get('value');
    this.settings.desktopMargin = scheme.find(this, 'DesktopMargin').get('value');
    this.settings.windowCornerSnap = scheme.find(this, 'CornerSnapping').get('value');
    this.settings.windowSnap = scheme.find(this, 'WindowSnapping').get('value');
    this.settings.enableIconView = scheme.find(this, 'EnableIconView').get('value');
    this.settings.invertIconViewColor = scheme.find(this, 'EnableIconViewInvert').get('value');

    // Panel
    this.settings.panels[0].options.position = scheme.find(this, 'PanelPosition').get('value');
    this.settings.panels[0].options.autohide = scheme.find(this, 'PanelAutoHide').get('value');
    this.settings.panels[0].options.ontop = scheme.find(this, 'PanelOntop').get('value');
    this.settings.panels[0].options.background = scheme.find(this, 'PanelBackgroundColor').get('value') || '#101010';
    this.settings.panels[0].options.foreground = scheme.find(this, 'PanelForegroundColor').get('value') || '#ffffff';
    this.settings.panels[0].options.opacity = scheme.find(this, 'PanelOpacity').get('value');
    this.settings.panels[0].items = this.panelItems;

    // User
    this.settings.language = scheme.find(this, 'UserLocale').get('value');

    wm.applySettings(this.settings, false, true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationSettings = function(args, metadata) {
    Application.apply(this, ['ApplicationSettings', args, metadata]);
    this.scheme = null;
  };

  ApplicationSettings.prototype = Object.create(Application.prototype);
  ApplicationSettings.constructor = Application;

  ApplicationSettings.prototype.destroy = function() {
    this.scheme = null;
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationSettings.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationSettingsWindow(self, metadata, scheme));
    });

    this.scheme = scheme;
  };

  ApplicationSettings.prototype.panelItemsDialog = function(callback) {
    if ( this.scheme ) {
      this._addWindow(new PanelItemDialog(this, this.__metadata, this.scheme, callback));
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Class = ApplicationSettings;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
