/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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

import Translations from './locales';
import WindowSwitcher from './windowswitcher';
import DesktopIconView from './iconview';
import Panel from './panel';

import WidgetDigitalClock from './widgets/digitalclock';
import WidgetAnalogClock from './widgets/analogclock';
import PanelItemAppMenu from './panelitems/appmenu';
import PanelItemButtons from './panelitems/buttons';
import PanelItemClock from './panelitems/clock';
import PanelItemNotificationArea from './panelitems/notificationarea';
import PanelItemSearch from './panelitems/search';
import PanelItemWeather from './panelitems/weather';
import PanelItemWindowList from './panelitems/windowlist';

const Menu = OSjs.require('gui/menu');
const Locales = OSjs.require('core/locales');
const GUIScheme = OSjs.require('gui/scheme');
const Config = OSjs.require('core/config');
const Authenticator = OSjs.require('core/authenticator');
const Application = OSjs.require('core/application');
const PackageManager = OSjs.require('core/package-manager');
const WindowManager = OSjs.require('core/window-manager');
const SettingsFragment = OSjs.require('helpers/settings-fragment');
const SettingsManager = OSjs.require('core/settings-manager');
const Events = OSjs.require('utils/events');
const Compability = OSjs.require('utils/compability');
const FileMetadata = OSjs.require('vfs/file');
const Notification = OSjs.require('gui/notification');
const Theme = OSjs.require('core/theme');
const DOM = OSjs.require('utils/dom');
const Utils = OSjs.require('utils/misc');
const Init = OSjs.require('core/init');
const GUI = OSjs.require('utils/gui');
const VFS = OSjs.require('vfs/fs');
const FS = OSjs.require('utils/fs');
const ServiceNotificationIcon = OSjs.require('helpers/service-notification-icon');

/*eslint valid-jsdoc: "off"*/

const PADDING_PANEL_AUTOHIDE = 10; // FIXME: Replace with a constant ?!

function defaultSettings(defaults) {
  const compability = Compability.getCompability();

  let cfg = {
    animations: compability.css.animation,
    useTouchMenu: compability.touch
  };

  if ( defaults ) {
    cfg = Utils.mergeObject(cfg, defaults);
  }

  return cfg;
}

const translate = Locales.createLocalizer(Translations);

/////////////////////////////////////////////////////////////////////////////
// APPLICATION
/////////////////////////////////////////////////////////////////////////////

/**
 * Application
 */
class CoreWM extends WindowManager {

  constructor(args, metadata) {
    const importSettings = args.defaults || {};

    super('CoreWM', args, metadata, defaultSettings(importSettings));

    this.panels           = [];
    this.widgets          = [];
    this.switcher         = null;
    this.iconView         = null;
    this.importedSettings = Utils.mergeObject(Config.getConfig('SettingsManager.CoreWM'), importSettings);
    this._scheme          = GUIScheme.fromString(require('osjs-scheme-loader!scheme.html'));

    this.generatedHotkeyMap = {};

    function _winGenericHotkey(ev, win, wm, hotkey) {
      if ( win ) {
        win._onKeyEvent(ev, 'keydown', hotkey);
      }
    }
    this.hotkeyMap = {
      SEARCH: function(ev, win, wm) {
        if ( wm ) {
          const panel = wm.getPanel();
          if ( panel ) {
            const pitem = panel.getItemByType(OSjs.Applications.CoreWM.PanelItems.Search);
            if ( pitem ) {
              ev.preventDefault();
              pitem.show();
            }
          }
        }
      },
      SWITCHER: function(ev, win, wm) {
        if ( wm.getSetting('enableSwitcher') && wm.switcher ) {
          wm.switcher.show(ev, win, wm);
        }
      },
      WINDOW_MINIMIZE: function(ev, win) {
        if ( win ) {
          win._minimize();
        }
      },
      WINDOW_MAXIMIZE: function(ev, win) {
        if ( win ) {
          win._maximize();
        }
      },
      WINDOW_RESTORE: function(ev, win) {
        if ( win ) {
          win._restore();
        }
      },
      WINDOW_MOVE_LEFT: function(ev, win) {
        if ( win ) {
          win._moveTo('left');
        }
      },
      WINDOW_MOVE_RIGHT: function(ev, win) {
        if ( win ) {
          win._moveTo('right');
        }
      },
      WINDOW_MOVE_UP: function(ev, win) {
        if ( win ) {
          win._moveTo('top');
        }
      },
      WINDOW_MOVE_DOWN: function(ev, win) {
        if ( win ) {
          win._moveTo('bottom');
        }
      },
      SAVE: _winGenericHotkey,
      SAVEAS: _winGenericHotkey,
      OPEN: _winGenericHotkey
    };

    Theme.update(this.importedSettings);
  }

  setup() {

    const initNotifications = () => {
      ServiceNotificationIcon.init();

      const user = Authenticator.instance.getUser();

      const displayMenu = (ev) => {
        Menu.create([{
          title: Locales._('TITLE_SIGN_OUT'),
          onClick: function() {
            Init.logout();
          }
        }], ev);

        return false;
      };

      const toggleFullscreen = () => {
        const docElm = document.documentElement;
        const notif = Notification.getIcon('_FullscreenNotification');
        if ( notif ) {
          this.toggleFullscreen(notif.opts._isFullscreen ? document : docElm, !notif.opts._isFullscreen);
        }
      };

      const displayDevMenu = (ev) => {
        const don = DOM.$hasClass(document.body, 'debug');
        const apps = Application.getProcesses().filter(function(iter) {
          return iter !== null && iter instanceof Application;
        }).map(function(iter) {
          return {
            title: iter.__label + ' (pid:' + iter.__pid + ')',
            onClick: function() {
              Application.reload(iter.__pid);
            }
          };
        });

        const mnu = [{
          title: don ? 'Turn off debug overlay' : 'Turn on debug overlay',
          onClick: function() {
            if ( don ) {
              DOM.$removeClass(document.body, 'debug');
            } else {
              DOM.$addClass(document.body, 'debug');
            }
          }
        }, {
          title: 'Reload manifest',
          onClick: function() {
            PackageManager.init();
          }
        }, {
          title: 'Reload running application',
          menu: apps
        }];

        Menu.create(mnu, ev);
      };

      if ( Config.getConfig('Debug') ) {
        Notification.createIcon('_DeveloperNotification', {
          icon: Theme.getIcon('categories/applications-development.png', '16x16'),
          title: 'Developer Tools',
          onContextMenu: displayDevMenu,
          onClick: displayDevMenu
        });
      }

      if ( this.getSetting('fullscreen') ) {
        Notification.createIcon('_FullscreenNotification', {
          icon: Theme.getIcon('actions/view-fullscreen.png', '16x16'),
          title: 'Enter fullscreen',
          onClick: toggleFullscreen,
          _isFullscreen: false
        });
      }

      Notification.createIcon('_HandlerUserNotification', {
        icon: Theme.getIcon('status/avatar-default.png', '16x16'),
        title: Locales._('TITLE_SIGNED_IN_AS_FMT', user.username),
        onContextMenu: displayMenu,
        onClick: displayMenu
      });
    };

    this.applySettings(this._settings.get());

    try {
      VFS.watch(new FileMetadata(this.getSetting('desktopPath'), 'dir'), (msg, obj) => {
        if ( !obj || msg.match(/^vfs:(un)?mount/) ) {
          return;
        }

        if ( this.iconView ) {
          this.iconView._refresh();
        }
      });
    } catch ( e ) {
      console.warn('Failed to apply CoreWM VFS watch', e, e.stack);
    }

    this.initSwitcher();
    this.initDesktop();
    this.initPanels();
    this.initWidgets();
    this.initIconView();

    initNotifications();

    return Promise.resolve();
  }

  destroy(force) {
    if ( !force && !window.confirm(translate('Killing this process will stop things from working!')) ) {
      return false;
    }

    ServiceNotificationIcon.destroy();

    try {
      Events.$unbind(document.body, 'dragenter, dragleave, dragover, drop');

      Notification.destroyIcon('_HandlerUserNotification');

      if ( this.iconView ) {
        this.iconView.destroy();
      }
      if ( this.switcher ) {
        this.switcher.destroy();
      }

      // Reset
      this.destroyPanels();
      this.destroyWidgets();

      const settings = this.importedSettings;
      try {
        settings.background = 'color';
      } catch ( e ) {}

      //this.applySettings(defaultSettings(settings), true);
    } catch ( e ) {
      console.warn(e);
      return false;
    }

    // Clear DOM
    this.switcher = null;
    this.iconView = null;

    return super.destroy(...arguments);
  }

  destroyPanels() {
    this.panels.forEach(function(p) {
      p.destroy();
    });
    this.panels = [];
  }

  destroyWidgets() {
    this.widgets.forEach(function(w) {
      w.destroy();
    });
    this.widgets = [];
  }

  //
  // Initialization
  //

  initSwitcher() {
    this.switcher = new WindowSwitcher();
  }

  initDesktop() {

    // Enable dropping of new wallpaper if no iconview is enabled
    GUI.createDroppable(document.body, {
      onOver: (ev, el, args) => this.onDropOver(ev, el, args),
      onLeave: () => this.onDropLeave(),
      onDrop: () => this.onDrop(),
      onItemDropped: (ev, el, item, args) => this.onDropItem(ev, el, item, args),
      onFilesDropped: (ev, el, files, args) => this.onDropFile(ev, el, files, args)
    });
  }

  initPanels(applySettings) {
    const ps = this.getSetting('panels');
    let added = false;

    if ( ps === false ) {
      added = true;
    } else {
      this.destroyPanels();

      (ps || []).forEach((storedItem) => {
        if ( !storedItem.options ) {
          storedItem.options = {};
        }

        const panelSettings = new SettingsFragment(storedItem.options, 'CoreWM', SettingsManager);
        const p = new Panel('Default', panelSettings, this);
        p.init(document.body);

        (storedItem.items || []).forEach((iter) => {
          try {
            if ( typeof iter.settings === 'undefined' || iter.settings === null ) {
              iter.settings = {};
            }

            let itemSettings = {};
            try {
              itemSettings = new SettingsFragment(iter.settings, 'CoreWM', SettingsManager);
            } catch ( ex ) {
              console.warn('An error occured while loading PanelItem settings', ex);
              console.warn('stack', ex.stack);
            }

            p.addItem(new OSjs.Applications.CoreWM.PanelItems[iter.name](itemSettings));
            added = true;
          } catch ( e ) {
            console.warn('An error occured while creating PanelItem', e);
            console.warn('stack', e.stack);

            Notification.create({
              icon: Theme.getIcon('status/dialog-warning.png', '32x32'),
              title: 'CoreWM',
              message: translate('An error occured while creating PanelItem: {0}', e)
            });
          }
        });

        this.panels.push(p);
      });
    }

    if ( !added ) {
      Notification.create({
        timeout: 0,
        icon: Theme.getIcon('status/dialog-warning.png', '32x32'),
        title: 'CoreWM',
        message: translate('Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)')
      });
    }

    if ( applySettings ) {
      // Workaround for windows appearing behind panel
      const p = this.panels[0];
      if ( p && p.getOntop() && p.getPosition('top') ) {
        setTimeout(() => {
          const space = this.getWindowSpace();
          this._windows.forEach(function(iter) {
            if ( iter && iter._position.y < space.top ) {
              console.warn('CoreWM::initPanels()', 'I moved this window because it overlapped with a panel!', iter);
              iter._move(iter._position.x, space.top);
            }
          });
        }, 800);
      }

      if ( this.iconView ) {
        this.iconView.resize(this);
      }
    }

    setTimeout(() => {
      this.setStyles(this._settings.get());
    }, 250);
  }

  initWidgets(applySettings) {
    this.destroyWidgets();

    const widgets = this.getSetting('widgets');

    (widgets || []).forEach((item) => {
      if ( !item.settings ) {
        item.settings = {};
      }

      const settings = new SettingsFragment(item.settings, 'CoreWM', SettingsManager);

      try {
        const w = new OSjs.Applications.CoreWM.Widgets[item.name](settings);
        w.init(document.body);
        this.widgets.push(w);

        w._inited();
      } catch ( e ) {
        console.warn('CoreWM::initWidgets()', e, e.stack);
      }
    });
  }

  initIconView() {
    const en = this.getSetting('enableIconView');
    if ( !en && this.iconView ) {
      this.iconView.destroy();
      this.iconView = null;
      return;
    }

    if ( en && !this.iconView ) {
      this.iconView = new DesktopIconView(this);
      document.body.appendChild(this.iconView.getRoot());
    }

    setTimeout(() => {
      if ( this.iconView ) {
        this.iconView.resize(this);
      }
    }, 280);
  }

  //
  // Events
  //

  resize(ev, rect, wasInited) {
    super.resize(...arguments);

    const space = this.getWindowSpace();
    const margin = this.getSetting('desktopMargin');
    const windows = this._windows;

    function moveIntoView() {
      let i = 0, l = windows.length, iter, wrect;
      let mx, my, moved;

      for ( i; i < l; i++ ) {
        iter = windows[i];
        if ( !iter ) {
          continue;
        }
        wrect = iter._getViewRect();
        if ( wrect === null || iter._state.mimimized ) {
          continue;
        }

        // Move the window into view if outside of view
        mx = iter._position.x;
        my = iter._position.y;
        moved = false;

        if ( (wrect.left + margin) > rect.width ) {
          mx = space.width - iter._dimension.w;
          moved = true;
        }
        if ( (wrect.top + margin) > rect.height ) {
          my = space.height - iter._dimension.h;
          moved = true;
        }

        if ( moved ) {
          if ( mx < space.left ) {
            mx = space.left;
          }
          if ( my < space.top  ) {
            my = space.top;
          }
          iter._move(mx, my);
        }

        // Restore maximized windows (FIXME: Better solution?)
        if ( iter._state.maximized && (wasInited ? iter._restored : true) ) {
          iter._restore(true, false);
        }
      }
    }

    if ( !this._isResponsive ) {
      if ( this.getSetting('moveOnResize') ) {
        moveIntoView();
      }
    }
  }

  onDropLeave() {
    document.body.setAttribute('data-attention', 'false');
  }

  onDropOver() {
    document.body.setAttribute('data-attention', 'true');
  }

  onDrop() {
    document.body.setAttribute('data-attention', 'false');
  }

  onDropItem(ev, el, item, args) {
    document.body.setAttribute('data-attention', 'false');

    const _applyWallpaper = (data) => {
      this.applySettings({wallpaper: data.path}, false, true);
    };

    const _createShortcut = (data) => {
      if ( this.iconView ) {
        this.iconView.addShortcut(data, this, true);
      }
    };

    const _openMenu = (data) =>  {
      Menu.create([{
        title: translate('LBL_COPY'),
        onClick: () => {
          const dst = FS.pathJoin(this.getSetting('desktopPath'), data.filename);
          VFS.copy(data, dst);
        }
      /*}, {
        title: translate('Create shortcut'),
        onClick: () => {
          _createShortcut.call(this, data);
        }
        */
      }, {
        title: translate('Set as wallpaper'),
        onClick: () => {
          _applyWallpaper(data);
        }
      }], ev);
    };

    if ( item ) {
      const data = item.data;
      if ( item.type === 'file' ) {
        if ( data && data.mime ) {
          if ( data.mime.match(/^image/) ) {
            if ( this.iconView ) {
              _openMenu(data);
            } else {
              _applyWallpaper(data);
            }
          } else {
            _createShortcut(data);
          }
        }
      } else if ( item.type === 'application' ) {
        _createShortcut(data);
      }
    }
  }

  onDropFile(ev, el, files, args) {
    VFS.upload({
      destination: 'desktop:///',
      files: files
    });
  }

  onContextMenu(ev) {
    if ( ev.target === document.body ) {
      ev.preventDefault();
      this.openDesktopMenu(ev);
      return false;
    }
    return true;
  }

  onKeyUp(ev, win) {
    if ( !ev ) {
      return;
    }

    if ( !ev.altKey ) {
      if ( this.switcher ) {
        this.switcher.hide(ev, win, this);
      }
    }
  }

  onKeyDown(ev, win) {
    let combination = false;

    if ( ev ) {
      const map = this.generatedHotkeyMap;
      Object.keys(map).some((i) => {
        if ( Events.keyCombination(ev, i) ) {
          map[i](ev, win, this);
          combination = i;
          return true;
        }
        return false;
      });
    }
    return combination;
  }

  showSettings(category) {
    Application.create('ApplicationSettings', {category: category});
  }

  eventWindow(ev, win) {
    // Make sure panel items are updated correctly
    // FIXME: This is not compatible with other PanelItems

    this.panels.forEach(function(panel) {
      if ( panel ) {
        const panelItem = panel.getItem(OSjs.Applications.CoreWM.PanelItems.WindowList);
        if ( panelItem ) {
          panelItem.update(ev, win);
        }
      }
    });

    // Unfocus IconView if we focus a window
    if ( ev === 'focus' ) {
      if ( this.iconView ) {
        this.iconView.blur();
        this.widgets.forEach(function(w) {
          w.blur();
        });
      }
    }
  }

  getNotificationArea() {
    const panelId = 0; // FIXME
    const panel = this.panels[panelId];
    if ( panel ) {
      return panel.getItem(OSjs.Applications.CoreWM.PanelItems.NotificationArea);
    }
    return null;
  }

  _getContextMenu(arg) {
    let menu = [];

    if ( this.iconView ) {
      menu = this.iconView._getContextMenu(arg);
    }

    menu.push({
      title: translate('Open settings'),
      onClick: () => this.showSettings()
    });

    if ( this.getSetting('enableIconView') === true ) {
      menu.push({
        title: translate('Hide Icons'),
        onClick: (ev) => {
          this.applySettings({enableIconView: false}, false, true);
        }
      });
    } else {
      menu.push({
        title: translate('Show Icons'),
        onClick: (ev) => {
          this.applySettings({enableIconView: true}, false, true);
        }
      });
    }

    return menu;
  }

  openDesktopMenu(ev) {
    if ( this._emit('wm:contextmenu', [ev, this]) === false ) {
      return;
    }

    const menu = this._getContextMenu();
    Menu.create(menu, ev);
  }

  applySettings(settings, force, save, triggerWatch) {
    console.group('CoreWM::applySettings()');

    settings = force ? settings : Utils.mergeObject(this._settings.get(), settings);

    console.log(settings);

    Theme.update(settings, true);

    this.setIconView(settings);
    this.setStyles(settings);

    if ( save ) {
      this.initPanels(true);
      this.initWidgets(true);

      if ( settings && save === true ) {
        if ( settings.language ) {
          SettingsManager.set('Core', 'Locale', settings.language, triggerWatch);
          Locales.setLocale(settings.language);
        }
        this._settings.set(null, settings, save, triggerWatch);
      }
    }

    this.generatedHotkeyMap = {};

    const keys = this._settings.get('hotkeys');
    const self = this;
    Object.keys(keys).forEach((k) => {
      this.generatedHotkeyMap[keys[k]] = function() {
        const args = Array.prototype.slice.call(arguments);
        args.push(k);
        return self.hotkeyMap[k].apply(this, args);
      };
    });

    console.groupEnd();

    return true;
  }

  setIconView(settings) {
    if ( settings.enableIconView ) {
      this.initIconView();
    } else {
      if ( this.iconView ) {
        this.iconView.destroy();
        this.iconView = null;
      }
    }
  }

  setStyles(settings) {
    /*eslint dot-notation: "off"*/

    let styles = {};
    let raw = '';

    if ( settings.panels ) {
      settings.panels.forEach(function(p, i) {
        styles['corewm-panel'] = {};
        styles['corewm-notification'] = {};
        styles['corewm-notification:before'] = {
          'opacity': p.options.opacity / 100
        };
        styles['corewm-panel:before'] = {
          'opacity': p.options.opacity / 100
        };

        styles['.custom-notification'] = {};
        styles['.custom-notification:before'] = {
          'opacity': p.options.opacity / 100
        };

        if ( p.options.background ) {
          styles['corewm-panel:before']['background-color'] = p.options.background;
          styles['corewm-notification:before']['background-color'] = p.options.background;
          styles['.custom-notification:before']['background-color'] = p.options.background;
        }
        if ( p.options.foreground ) {
          styles['corewm-panel']['color'] = p.options.foreground;
          styles['corewm-notification']['color'] = p.options.foreground;
          styles['.custom-notification']['color'] = p.options.foreground;
        }
      });
    }

    let mw = this.getDefaultSetting('fullscreenTrigger') || 800;
    raw += '@media all and (max-width: ' + String(mw) + 'px) {\n';
    raw += 'application-window {\n';

    let borderSize = 0;
    const space = this.getWindowSpace(true);
    const theme = Theme.getStyleTheme(true);
    if ( theme && theme.style && theme.style.window ) {
      borderSize = theme.style.window.border;
    }

    raw += 'top: calc(' + String(space.top) + 'px + ' + borderSize + ') !important;\n';
    raw += 'left: calc(' + String(space.left) + 'px + ' + borderSize + ') !important;\n';
    raw += 'right: calc(' + String(borderSize) + ') !important;\n';
    raw += 'bottom: calc(' + (space.bottom ? String(space.bottom) + 'px + ' : '') + borderSize + ') !important;\n';
    raw += '\n}';
    raw += '\n}';

    styles['#CoreWMDesktopIconView'] = {};
    if ( settings.invertIconViewColor && settings.backgroundColor ) {
      styles['#CoreWMDesktopIconView']['color'] = Utils.invertHEX(settings.backgroundColor);
    }

    if ( Object.keys(styles).length ) {
      this.createStylesheet(styles, raw);
    }
  }

  //
  // Getters / Setters
  //

  getWindowSpace(noMargin) {
    const s = super.getWindowSpace(...arguments);
    const d = this.getSetting('desktopMargin');

    s.bottom = 0;

    this.panels.forEach(function(p) {
      if ( p && p.getOntop() ) {
        const ph = p.getHeight();
        if ( p.getAutohide() && p.isAutoHidden() ) {
          s.top    += PADDING_PANEL_AUTOHIDE;
          s.height -= PADDING_PANEL_AUTOHIDE;
        } else if ( p.getPosition('top') ) {
          s.top    += ph;
          s.height -= ph;
        } else {
          s.height -= ph;
        }

        if ( p._options.get('position') === 'bottom' ) {
          s.bottom += ph;
        }
      }
    });

    if ( !noMargin ) {
      if ( d > 0 ) {
        s.top    += d;
        s.left   += d;
        s.width  -= (d * 2);
        s.height -= (d * 2);
      }
    }

    return s;
  }

  getWindowPosition(borders) {
    borders = (typeof borders === 'undefined') || (borders === true);
    let pos = super.getWindowPosition(...arguments);

    const m = borders ? this.getSetting('desktopMargin') : 0;
    pos.x += m || 0;
    pos.y += m || 0;

    this.panels.forEach(function(p) {
      if ( p && p.getOntop() && p.getPosition('top') ) {
        if ( p.getAutohide() ) {
          pos.y += PADDING_PANEL_AUTOHIDE;
        } else {
          pos.y += p.getHeight();
        }
      }
    });

    return pos;
  }

  getSetting(k) {
    const val = super.getSetting(...arguments);
    if ( typeof val === 'undefined' || val === null ) {
      return defaultSettings(this.importedSettings)[k];
    }
    return val;
  }

  getDefaultSetting(k) {
    const settings = defaultSettings(this.importedSettings);
    if ( typeof k !== 'undefined' ) {
      return settings[k];
    }
    return settings;
  }

  getPanels() {
    return this.panels;
  }

  getPanel(idx) {
    return this.panels[(idx || 0)];
  }

  static get Widgets() {
    return {
      DigitalClock: WidgetDigitalClock,
      AnalogClock: WidgetAnalogClock
    };
  }

  static get PanelItems() {
    return {
      AppMenu: PanelItemAppMenu,
      Buttons: PanelItemButtons,
      Clock: PanelItemClock,
      NotificationArea: PanelItemNotificationArea,
      Search: PanelItemSearch,
      Weather: PanelItemWeather,
      WindowList: PanelItemWindowList
    };
  }
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

OSjs.Applications.CoreWM = CoreWM;

