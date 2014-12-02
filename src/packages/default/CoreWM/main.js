/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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
(function(WindowManager, GUI, Utils, API, VFS) {
  'use strict';

  var PADDING_PANEL_AUTOHIDE = 10; // FIXME: Replace with a constant ?!

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      'Killing this process will stop things from working!' : 'Dreping av denne prosessen vil få konsekvenser!',
      'Open settings' : 'Åpne instillinger',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Ditt panel har ingen objekter. Gå til instillinger for å nullstille eller modifisere manuelt\n(Denne feilen kan oppstå etter en oppdatering av OS.js)',
      'Create shortcut' : 'Lag snarvei',
      'Set as wallpaper' : 'Sett som bakgrunn',
      'An error occured while creating PanelItem: {0}' : 'En feil oppstod under lasting av PanelItem: {0}'
    },
    de_DE : {
      'Killing this process will stop things from working!' : 'Das Beenden dieses Prozesses wird Konsequenzen haben!',
      'Open settings' : 'Einstellungen öffnen',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Ihr Panel enthält keine Items. Öffnen Sie die Einstellungen um die Panel-Einstellungen zurückzusetzen oder manuell zu ändern (Dieser Fehler kann nach einem Upgrade von OS.js entstehen)',
      'Create shortcut' : 'Verknüpfung erstellen',
      'Set as wallpaper' : 'Als Hintergrund verwenden',
      'An error occured while creating PanelItem: {0}' : 'Während des Erstellens eines Panel-Items ist folgender Fehler aufgetreten: {0}'
    },
    fr_FR : {
    },
    ru_RU : {
      'Killing this process will stop things from working!' : 'Завершение этого процесса остановит работу системы!',
      'Open settings': 'Открыть настройки',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'На вашей панели отсутствуют элементы. Откройте настройки для сброса панели к начальному состоянию или ручной настройки\n(Эта ошибка может произойти после обновления OS.js)',
      'Create shortcut': 'Создать ярлык',
      'Set as wallpaper' : 'Установить как обои',
      'An error occured while creating PanelItem: {0}' : 'Произошла обшибка при создании PanelItem: {0}'
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return API.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // SETTINGS
  /////////////////////////////////////////////////////////////////////////////

  function DefaultSettings(defaults) {
    var cfg = {
      animations      : OSjs.Compability.css.animation,
      fullscreen      : false,
      desktop         : {margin: 5},
      wallpaper       : 'osjs:///themes/wallpapers/diamond_upholstery.png',
      theme           : 'default',
      background      : 'image-repeat',
      menuCategories  : true,
      enableIconView  : false,
      enableSwitcher  : true,
      enableHotkeys   : true,
      enableSounds    : API.getDefaultSettings().Core.Sounds,
      moveOnResize    : true,       // Move windows into viewport on resize
      panels          : [
        {
          options: {
            position: 'top',
            ontop:    true,
            autohide: false
          },
          items:    [
            {name: 'Buttons'},
            {name: 'WindowList'},
            {name: 'NotificationArea'},
            {name: 'Clock'}
          ]
        }
      ],
      desktopIcons : [],
      style           : {
        backgroundColor  : '#0B615E',
        fontFamily       : 'OSjsFont'
      }
    };

    if ( defaults ) {
      cfg = Utils.mergeObject(cfg, defaults);
    }
    return cfg;
  }

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var CoreWM = function(args, metadata) {
    WindowManager.apply(this, ['CoreWM', this, args, metadata]);

    this._defaults      = (args.defaults || {});
    this._settings      = DefaultSettings(this._defaults);
    this.panels         = [];
    this.switcher       = null;
    this.iconView       = null;
    this.$themeLink     = null;
    this.$animationLink = null;

    this._$notifications    = document.createElement('div');
    this._$notifications.id = 'Notifications';
    document.body.appendChild(this._$notifications);
  };

  CoreWM.prototype = Object.create(WindowManager.prototype);

  CoreWM.prototype.init = function() {
    this.setThemeLink('/blank.css');
    this.setAnimationLink('/blank.css');

    WindowManager.prototype.init.apply(this, arguments);

    this.initDesktop();
    this.initWM(function() {
      this.initPanels();
      this.initIconView();
    });

    this.switcher = new OSjs.Applications.CoreWM.WindowSwitcher();
  };

  CoreWM.prototype.destroy = function(kill) {
    if ( kill && !confirm(_('Killing this process will stop things from working!')) ) {
      return false;
    }

    if ( this.iconView ) {
      this.iconView.destroy();
      this.iconView = null;
    }

    if ( this.switcher ) {
      this.switcher.destroy();
      this.switcher = null;
    }

    this.destroyPanels();

    // Reset styles
    this.applySettings(DefaultSettings(this._defaults), true);

    if ( this.$themeLink ) {
      this.$themeLink.parentNode.removeChild(this.$themeLink);
      this.$themeLink = null;
    }
    if ( this.$animationLink ) {
      this.$animationLink.parentNode.removeChild(this.$animationLink);
      this.$animationLink = null;
    }

    return WindowManager.prototype.destroy.apply(this, []);
  };

  CoreWM.prototype.destroyPanels = function() {
    if ( this.panels.length ) {
      for ( var i = 0; i < this.panels.length; i++ ) {
        this.panels[i].destroy();
      }
      this.panels = [];
    }
  };

  // Copy from Application
  CoreWM.prototype._onMessage = function(obj, msg, args) {
    if ( this.iconView ) {
      if ( msg === 'vfs' ) {
        if ( args && args.type === 'delete' && args.file ) {
          this.iconView.removeShortcutByPath(args.file.path);
        }
      }
    }
  };

  // Copy from Application
  CoreWM.prototype._createDialog = function(className, args, parentClass) {
    if ( OSjs.Dialogs[className] ) {

      var w = Object.create(OSjs.Dialogs[className].prototype);
      OSjs.Dialogs[className].apply(w, args);

      if ( parentClass && (parentClass instanceof Window) ) {
        parentClass._addChild(w);
      }

      this.addWindow(w);
      return w;
    }
    return false;
  };

  //
  // Initialization
  //

  CoreWM.prototype.initWM = function(callback) {
    callback = callback || function() {};

    var self = this;

    // Enable dropping of new wallpaper if no iconview is enabled
    var back = document.getElementById('Background');
    if ( back ) {
      OSjs.GUI.createDroppable(back, {
        onOver: function(ev, el, args) {
          self.onDropOver(ev, el, args);
        },

        onLeave : function() {
          self.onDropLeave();
        },

        onDrop : function() {
          self.onDrop();
        },

        onItemDropped: function(ev, el, item, args) {
          self.onDropItem(ev, el, item, args);
        },

        onFilesDropped: function(ev, el, files, args) {
          self.onDropFile(ev, el, files, args);
        }
      });
    }

    API.getHandlerInstance().getUserSettings('WindowManager', function(s) {
      if ( s ) {
        self.applySettings(s);
      } else {
        self.applySettings(DefaultSettings(self._defaults), true);
      }

      callback.call(self);
    });
  };

  CoreWM.prototype.initDesktop = function() {

    var background = document.getElementById('Background');
    var self = this;
    if ( background ) {
      background.oncontextmenu = function(ev) {
        ev.preventDefault();
        self.openDesktopMenu(ev);
        return false;
      };
    };
  };

  CoreWM.prototype.initPanels = function(applySettings) {
    var ps = this.getSetting('panels');
    var added = false;
    if ( ps === false ) {
      added = true;
    } else {
      this.destroyPanels();
      if ( ps && ps.length ) {
        var p, j, n;
        for ( var i = 0; i < ps.length; i++ ) {
          p = new OSjs.Applications.CoreWM.Panel('Default', ps[i].options);
          p.init(document.body);

          if ( ps[i].items && ps[i].items.length ) {
            for ( j = 0; j < ps[i].items.length; j++ ) {
              try {
                n = ps[i].items[j];
                p.addItem(new OSjs.Applications.CoreWM.PanelItems[n.name]());
                added = true;
              } catch ( e ) {
                console.warn('An error occured while creating PanelItem', e);
                console.warn('stack', e.stack);

                this.notification({
                  icon: 'status/important.png',
                  title: 'CoreWM',
                  message: _('An error occured while creating PanelItem: {0}', e)
                });
              }
            }
          }

          this.panels.push(p);
        }
      }
    }

    if ( !added ) {
      this.notification({
        timeout : 0,
        icon: 'status/important.png',
        title: 'CoreWM',
        message: _('Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)')
      });
    }

    if ( applySettings ) {
      // Workaround for windows appearing behind panel
      var p = this.panels[0];
      if ( p && p.getOntop() && p.getPosition('top') ) {
        var iter;
        var space = this.getWindowSpace();
        for ( var i = 0; i < this._windows.length; i++ ) {
          iter = this._windows[i];
          if ( !iter ) { continue; }
          if ( iter._position.y < space.top ) {
            console.warn('CoreWM::initPanels()', 'I moved this window because it overlapped with a panel!', iter);
            iter._move(iter._position.x, space.top);
          }
        }
      }

      if ( this.iconView ) {
        this.iconView.resize(this);
      }
    }
  };

  CoreWM.prototype.initIconView = function() {
    if ( !this.getSetting('enableIconView') ) { return; }
    if ( this.iconView ) { return; }

    this.iconView = new OSjs.Applications.CoreWM.DesktopIconView(this);
    this.iconView.init();
    this.iconView.update(this);
    document.body.appendChild(this.iconView.getRoot());

    var self = this;
    this.iconView.resize(this);
    setTimeout(function() {
      self.iconView.resize(self);
    }, API.getAnimDuration());
  };

  //
  // Events
  //

  CoreWM.prototype.resize = function(ev, rect) {
    if ( !this.getSetting('moveOnResize') ) { return; }

    var space = this.getWindowSpace();
    var margin = this.getSetting('desktop').margin;
    var i = 0, l = this._windows.length, iter, wrect;
    var mx, my, moved;

    for ( i; i < l; i++ ) {
      iter = this._windows[i];
      if ( !iter ) { continue; }
      wrect = iter._getViewRect();
      if ( wrect === null ) { continue; }
      if ( iter._state.mimimized ) { continue; }

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
        if ( mx < space.left ) { mx = space.left; }
        if ( my < space.top  ) { my = space.top;  }
        iter._move(mx, my);
      }

      // Restore maximized windows (FIXME: Better solution?)
      if ( iter._state.maximized ) {
        iter._restore(true, false);
      }
    }

    if ( this.iconView ) {
      this.iconView.resize(this);
    }
  };

  CoreWM.prototype.onDropLeave = function() {
    var back = document.getElementById('Background');
    Utils.$removeClass(back, 'Blinking');
  };

  CoreWM.prototype.onDropOver = function() {
    var back = document.getElementById('Background');
    Utils.$addClass(back, 'Blinking');
  };

  CoreWM.prototype.onDrop = function() {
    var back = document.getElementById('Background');
    Utils.$removeClass(back, 'Blinking');
  };

  CoreWM.prototype.onDropItem = function(ev, el, item, args) {
    var back = document.getElementById('Background');
    Utils.$removeClass(back, 'Blinking');


    var _applyWallpaper = function(data) {
      this.applySettings({wallpaper: data.path}, false, true);
    };

    var _createShortcut = function(data) {
      if ( this.iconView ) {
        this.iconView.addShortcut(data, this);
      }
    };

    var _openMenu = function(data, self) {
      var pos = {x: ev.clientX, y: ev.clientY};
      OSjs.GUI.createMenu([{
        title: _('Create shortcut'),
        onClick: function() {
          _createShortcut.call(self, data);
        }
      }, {
        title: _('Set as wallpaper'),
        onClick: function() {
          _applyWallpaper.call(self, data);
        }
      }], pos)
    };

    if ( item && item.type === 'file' ) {
      var data = item.data;
      if ( data && data.mime ) {
        if ( data.mime.match(/^image/) ) {
          if ( this.iconView ) {
            _openMenu.call(this, data, this);
          } else {
            _applyWallpaper.call(this, data);
          }
        } else {
          _createShortcut.call(this, data);
        }
      }
    }
  };

  CoreWM.prototype.onDropFile = function(ev, el, files, args) {
    var self = this;

    VFS.upload({
      app: self,
      destination: API.getDefaultPath(),
      files: files
    }, function(error, file) {
      if ( !error && file && self.iconView ) {
        self.iconView.addShortcut(file, self);
      }
    });
  };

  CoreWM.prototype.onKeyUp = function(ev, win) {
    if ( !ev ) { return; }

    if ( !ev.shiftKey ) {
      if ( this.switcher ) {
        this.switcher.hide(ev, win, this);
      }
    }
  };

  CoreWM.prototype.onKeyDown = function(ev, win) {
    if ( !ev ) { return; }

    var keys = Utils.Keys;
    if ( ev.shiftKey && ev.keyCode === keys.TAB ) { // Toggle Window switcher
      if ( !this.getSetting('enableSwitcher') ) { return; }

      if ( this.switcher ) {
        this.switcher.show(ev, win, this);
      }
    } else if ( ev.altKey ) {
      if ( !this.getSetting('enableHotkeys') ) { return; }

      if ( win && win._properties.allow_hotkeys ) {
        if ( ev.keyCode === keys.H ) { // Hide window [H]
          win._minimize();
        } else if ( ev.keyCode === keys.M ) { // Maximize window [M]
          win._maximize();
        } else if ( ev.keyCode === keys.R ) { // Restore window [R]
          win._restore();
        } else if ( ev.keyCode === keys.LEFT ) { // Pin Window Left [Left]
          win._moveTo('left');
        } else if ( ev.keyCode === keys.RIGHT ) { // Pin Window Right [Right]
          win._moveTo('right');
        } else if ( ev.keyCode === keys.UP ) { // Pin Window Top [Up]
          win._moveTo('top');
        } else if ( ev.keyCode === keys.DOWN ) { // Pin Window Bottom [Down]
          win._moveTo('bottom');
        }
      }
    }
  };

  CoreWM.prototype.saveSettings = function(settings) {
    if ( settings ) {
      var store = { WindowManager: this.getSettings() };
      if ( settings.language ) {
        store.Core = { Locale: settings.language };
      }
      API.getHandlerInstance().setUserSettings(store);
    } else {
      API.getHandlerInstance().setUserSettings('WindowManager', this.getSettings());
    }
  };

  CoreWM.prototype.showSettings = function(tab) {
    var self = this;

    OSjs.API.launch('ApplicationSettings', {tab: tab});
  };

  CoreWM.prototype.eventWindow = function(ev, win) {
    // Make sure panel items are updated correctly
    // FIXME: This is not compatible with other PanelItems
    var panel, panelItem;
    for ( var i = 0; i < this.panels.length; i++ ) {
      panel = this.panels[i];
      if ( panel ) {
        panelItem = panel.getItem(OSjs.Applications.CoreWM.PanelItems.WindowList);
        if ( panelItem ) {
          panelItem.update(ev, win);
        }
      }
    }

    // Unfocus IconView if we focus a window
    if ( ev === 'focus' ) {
      if ( this.iconView ) {
        this.iconView._fireHook('blur');
      }
    }
  };

  CoreWM.prototype.notification = (function() {
    var _visible = 0;

    return function(opts) {
      opts          = opts          || {};
      opts.icon     = opts.icon     || null;
      opts.title    = opts.title    || null;
      opts.message  = opts.message  || '';
      opts.onClick  = opts.onClick  || function() {};

      if ( typeof opts.timeout === 'undefined' ) {
        opts.timeout  = 5000;
      }

      console.log('OSjs::Core::WindowManager::notification()', opts);

      var container  = document.createElement('div');
      var classNames = ['Notification'];
      var self       = this;
      var timeout    = null;

      function _remove() {
        if ( timeout ) {
          clearTimeout(timeout);
          timeout = null;
        }

        container.onclick = null;
        if ( container.parentNode ) {
          container.parentNode.removeChild(container);
        }
        _visible--;
        if ( _visible <= 0 ) {
          self._$notifications.style.display = 'none';
        }
      }

      if ( opts.icon ) {
        var icon = document.createElement('img');
        icon.alt = '';
        icon.src = API.getThemeResource(opts.icon, 'icon', '32x32');
        classNames.push('HasIcon');
        container.appendChild(icon);
      }

      if ( opts.title ) {
        var title = document.createElement('div');
        title.className = 'Title';
        title.appendChild(document.createTextNode(opts.title));
        classNames.push('HasTitle');
        container.appendChild(title);
      }

      if ( opts.message ) {
        var message = document.createElement('div');
        message.className = 'Message';
        message.appendChild(document.createTextNode(opts.message));
        classNames.push('HasMessage');
        container.appendChild(message);
      }

      _visible++;
      if ( _visible > 0 ) {
        this._$notifications.style.display = 'block';
      }

      container.className = classNames.join(' ');
      container.onclick = function(ev) {
        _remove();

        opts.onClick(ev);
      };

      var space = this.getWindowSpace();
      this._$notifications.style.top = space.top + 'px';

      this._$notifications.appendChild(container);

      if ( opts.timeout ) {
        timeout = setTimeout(function() {
          _remove();
        }, opts.timeout);
      }
    };
  })();

  CoreWM.prototype.createNotificationIcon = function(name, opts, panelId) {
    opts = opts || {};
    panelId = panelId || 0;
    if ( !name ) { return false; }

    var panel  = this.panels[panelId];
    var result = null;
    if ( panel ) {
      var pitem = panel.getItem(OSjs.Applications.CoreWM.PanelItems.NotificationArea, false);
      if ( pitem ) {
        result = pitem.createNotification(name, opts);
      }

    }
    return result;
  };

  CoreWM.prototype.removeNotificationIcon = function(name, panelId) {
    panelId = panelId || 0;
    if ( !name ) { return false; }

    var panel  = this.panels[panelId];
    var result = null;
    if ( panel ) {
      var pitem = panel.getItem(OSjs.Applications.CoreWM.PanelItems.NotificationArea, false);
      if ( pitem ) {
        pitem.removeNotification(name);
        return true;
      }

    }
    return false;
  };

  CoreWM.prototype.openDesktopMenu = function(ev) {
    var self = this;
    var _openDesktopSettings = function() {
      self.showSettings();
    };
    OSjs.GUI.createMenu([{title: _('Open settings'), onClick: function(ev) {_openDesktopSettings();}}], {x: ev.clientX, y: ev.clientY});
  };

  CoreWM.prototype.applySettings = function(settings, force, save) {
    if ( !WindowManager.prototype.applySettings.apply(this, arguments) ) {
      return false;
    }
    console.group('OSjs::Applications::CoreWM::applySettings');

    // Styles
    var opts = this.getSetting('style');
    var valid = ['backgroundColor', 'fontFamily'];
    console.log('Styles', opts);
    for ( var i in opts ) {
      if ( opts.hasOwnProperty(i) && Utils.inArray(valid, i) ) {
        document.body.style[i] = opts[i];
      }
    }

    // Wallpaper and Background
    var name = this.getSetting('wallpaper');
    var type = this.getSetting('background');

    var className = 'Color';
    var back      = 'none';

    if ( name && type.match(/^image/) ) {
      back = name;
      switch ( type ) {
        case     'image' :        className = 'Normal';   break;
        case     'image-center':  className = 'Center';   break;
        case     'image-fill' :   className = 'Fill';     break;
        case     'image-strech':  className = 'Strech';   break;
        default:                  className = 'Default';  break;
      }
    }

    console.log('Wallpaper name', name);
    console.log('Wallpaper type', type);
    console.log('Wallpaper className', className);

    var cn = document.body.className;
    var nc = 'Wallpaper' + className + ' ';
    document.body.className = cn.replace(/(Wallpaper(.*)\s?)?/, nc);

    if ( back !== 'none' ) {
      VFS.url(back, function(error, result) {
        if ( !error ) {
          back = 'url(\'' + result + '\')';
          document.body.style.backgroundImage = back;
        }
      });
    } else {
      document.body.style.backgroundImage = back;
    }

    // Theme
    var theme = this.getSetting('theme');
    console.log('theme', theme);
    if ( this.$themeLink ) {
      if ( theme ) {
        this.setThemeLink(API.getThemeCSS(theme));
      } else {
        console.warn('NO THEME WAS SELECTED!');
      }
    }

    // Animations
    var anim  = this.getSetting('animations');
    console.log('animations', anim);
    if ( this.$animationLink ) {
      if ( anim ) {
        this.setAnimationLink(API.getApplicationResource(this, 'animations.css'));
      } else {
        this.setAnimationLink(API.getThemeCSS(null));
      }
    }

    console.groupEnd();

    if ( this.getSetting('enableIconView') ) {
      this.initIconView();
    } else {
      if ( this.iconView ) {
        this.iconView.destroy();
        this.iconView = null;
      }
    }

    if ( save ) {
      this.initPanels(true);
      this.saveSettings(settings);
    }

    return true;
  };

  CoreWM.prototype.setAnimationLink = function(src) {
    if ( this.$animationLink ) {
      if ( this.$animationLink.parentNode ) {
        this.$animationLink.parentNode.removeChild(this.$animationLink);
      }
      this.$animationLink = null;
    }
    this.$animationLink = Utils.$createCSS(src);
  };

  CoreWM.prototype.setThemeLink = function(src) {
    if ( this.$themeLink ) {
      if ( this.$themeLink.parentNode ) {
        this.$themeLink.parentNode.removeChild(this.$themeLink);
      }
      this.$themeLink = null;
    }
    this.$themeLink = Utils.$createCSS(src);
  };


  //
  // Getters / Setters
  //

  CoreWM.prototype.getWindowSpace = function() {
    var s = WindowManager.prototype.getWindowSpace.apply(this, arguments);
    var d = this.getSetting('desktop');

    var p, ph;
    for ( var i = 0; i < this.panels.length; i++ ) {
      p = this.panels[i];
      if ( p && p.getOntop() ) {
        ph = p.getHeight();
        if ( p.getAutohide() ) {
          s.top    += PADDING_PANEL_AUTOHIDE;
          s.height -= PADDING_PANEL_AUTOHIDE;
        } else if ( p.getPosition('top') ) {
          s.top    += ph;
          s.height -= ph;
        } else {
          s.height -= ph;
        }
      }
    }

    if ( d.margin ) {
      s.top    += d.margin;
      s.left   += d.margin;
      s.width  -= (d.margin * 2);
      s.height -= (d.margin * 2);
    }

    return s;
  };

  CoreWM.prototype.getWindowPosition = function(borders) {
    borders = (typeof borders === 'undefined') || (borders === true);
    var pos = WindowManager.prototype.getWindowPosition.apply(this, arguments);

    var m = borders ? this.getSetting('desktop').margin : 0;
    pos.x += m || 0;
    pos.y += m || 0;

    var p;
    for ( var i = 0; i < this.panels.length; i++ ) {
      p = this.panels[i];
      if ( p && p.getOntop() ) {
        if ( p.getPosition('top') ) {
          if ( p.getAutohide() ) {
            pos.y += PADDING_PANEL_AUTOHIDE;
          } else {
            pos.y += p.getHeight();
          }

        }
      }
    }

    return pos;
  };

  CoreWM.prototype.getSetting = function(k) {
    var val = WindowManager.prototype.getSetting.apply(this, arguments);
    if ( typeof val === 'undefined' || val === null ) {
      return DefaultSettings(this._defaults)[k];
    }
    return val;
  };

  CoreWM.prototype.getDefaultSetting = function(k) {
    var settings = DefaultSettings(this._defaults);
    if ( typeof k !== 'undefined' ) {
      return settings[k];
    }
    return settings;
  };

  CoreWM.prototype.getPanels = function() {
    return this.panels;
  };

  CoreWM.prototype.getPanel = function(idx) {
    return this.panels[(idx || 0)];
  };

  CoreWM.prototype.getThemes = function() {
    var handler = API.getHandlerInstance();
    if ( handler ) {
      return handler.getThemes();
    }
    return [];
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications              = OSjs.Applications || {};
  OSjs.Applications.CoreWM       = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.Class = CoreWM;

})(OSjs.Core.WindowManager, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
