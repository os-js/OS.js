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

  function ApplicationSettingsWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationSettingsWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 500,
      height: 500
    }, app, scheme]);

    this.settings = {};
  }

  ApplicationSettingsWindow.prototype = Object.create(Window.prototype);
  ApplicationSettingsWindow.constructor = Window.prototype;

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

  ApplicationSettingsWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

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

  ApplicationSettingsWindow.prototype.initDesktopTab = function(wm, scheme) {
    scheme.find(this, 'EnableHotkeys').set('value', this.settings.enableHotkeys);
    scheme.find(this, 'EnableWindowSwitcher').set('value', this.settings.enableSwitcher);

    scheme.find(this, 'DesktopMargin').set('value', this.settings.desktopMargin);
    scheme.find(this, 'CornerSnapping').set('value', this.settings.windowCornerSnap);
    scheme.find(this, 'WindowSnapping').set('value', this.settings.windowSnap);

    scheme.find(this, 'EnableIconView').set('value', this.settings.enableIconView);
    scheme.find(this, 'EnableIconViewInvert').set('value', this.settings.invertIconViewColor);
  };

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
  };

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

  ApplicationSettingsWindow.prototype.initPackagesTab = function(wm, scheme) {
  };

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

    // User
    this.settings.language = scheme.find(this, 'UserLocale').get('value');

    wm.applySettings(this.settings, false, true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationSettings = function(args, metadata) {
    Application.apply(this, ['ApplicationSettings', args, metadata]);
  };

  ApplicationSettings.prototype = Object.create(Application.prototype);
  ApplicationSettings.constructor = Application;

  ApplicationSettings.prototype.destroy = function() {
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
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Class = ApplicationSettings;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
