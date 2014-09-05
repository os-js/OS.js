(function(WindowManager, GUI) {

  OSjs.CoreWM       = OSjs.CoreWM       || {};
  OSjs.Applications = OSjs.Applications || {};

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      'Killing this process will stop things from working!' : 'Dreping av denne prosessen vil få konsekvenser!',
      'Open settings' : 'Åpne instillinger',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Ditt panel har ingen objekter. Gå til instillinger for å nullstille eller modifisere manuelt\n(Denne feilen kan oppstå etter en oppdatering av OS.js)'
    },
    de_DE : {
      'Killing this process will stop things from working!' : 'Durch das Beenden dieses Prozesses werden andere Programme aufhören zu arbeiten!',
      'Open settings' : 'Öffne Einstellungen',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Ihr Panel enthält keine Elemente. Gehen Sie in die Einstellungen und setzen Sie OS.js auf Werkseinstellungen zurück oder bearbeiten Sie das Panel manuell.\n(Dies kann nach einem Update von OS.js passieren.)'
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return OSjs.__.apply(this, args);
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
      enableSounds    : OSjs.Settings.DefaultConfig().Core.Sounds,
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
      cfg = OSjs.Utils.mergeObject(cfg, defaults);
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
    this.settingsWindow = null;
    this.iconView       = null;
    this.$themeLink     = null;
    this.$animationLink = null;

    this._$notifications    = document.createElement('div');
    this._$notifications.id = 'Notifications';
    document.body.appendChild(this._$notifications);
  };

  CoreWM.prototype = Object.create(WindowManager.prototype);

  CoreWM.prototype.init = function() {
    this.setThemeLink("/blank.css");
    this.setAnimationLink("/blank.css");

    WindowManager.prototype.init.apply(this, arguments);

    this.initDesktop();
    this.initWM(function() {
      this.initPanels();
      this.initIconView();
    });

    this.switcher = new OSjs.CoreWM.WindowSwitcher();
  };

  CoreWM.prototype.destroy = function(kill) {
    if ( kill && !confirm(_("Killing this process will stop things from working!")) ) {
      return false;
    }

    if ( this.iconView ) {
      this.iconView.destroy();
      this.iconView = null;
    }

    if ( this.settingsWindow ) {
      this.settingsWindow.destroy();
      this.settingsWindow = null;
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
    if ( msg == 'destroyWindow' && obj._name === 'CoreWMSettingsWindow' ) {
      this.settingsWindow = null;
    }
    if ( msg == 'destroyWindow' && obj._name === 'CoreWMPanelItemWindow' ) {
      if ( this.settingsWindow ) {
        this.settingsWindow.panelItemWindow = null;
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
    var back = document.getElementById("Background");
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

    OSjs.API.getHandlerInstance().getUserSettings('WindowManager', function(s) {
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
    this.destroyPanels();

    var ps = this.getSetting('panels');
    var added = false;
    if ( ps && ps.length ) {
      var p, j, n;
      for ( var i = 0; i < ps.length; i++ ) {
        p = new OSjs.CoreWM.Panel('Default', ps[i].options);
        p.init(document.body);

        if ( ps[i].items && ps[i].items.length ) {
          for ( j = 0; j < ps[i].items.length; j++ ) {
            try {
              n = ps[i].items[j];
              p.addItem(new OSjs.CoreWM.PanelItems[n.name]());
              added = true;
            } catch ( e ) {
              // FIXME: Should we notify the user with a error dialog ?!
              console.warn("An error occured while creating PanelItem", e);
              console.warn('stack', e.stack);
            }
          }
        }

        this.panels.push(p);
      }
    }

    if ( !added ) {
      this.notification({
        timeout : 0,
        icon: 'status/important.png',
        title: "CoreWM",
        message: _("Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)")
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
            console.warn("CoreWM::initPanels()", "I moved this window because it overlapped with a panel!", iter);
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

    this.iconView = new OSjs.CoreWM.DesktopIconView(this);
    this.iconView.init();
    this.iconView.update(this);
    document.body.appendChild(this.iconView.getRoot());

    var self = this;
    setTimeout(function() {
      self.iconView.resize(self);
    });
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
    var back = document.getElementById("Background");
    OSjs.Utils.$removeClass(back, 'Blinking');
  };

  CoreWM.prototype.onDropOver = function() {
    var back = document.getElementById("Background");
    OSjs.Utils.$addClass(back, 'Blinking');
  };

  CoreWM.prototype.onDrop = function() {
    var back = document.getElementById("Background");
    OSjs.Utils.$removeClass(back, 'Blinking');
  };

  CoreWM.prototype.onDropItem = function(ev, el, item, args) {
    var back = document.getElementById("Background");
    OSjs.Utils.$removeClass(back, 'Blinking');


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
        title: _('Create shortcut'), // FIXME: Translation
        onClick: function() {
          _createShortcut.call(self, data);
        }
      }, {
        title: _('Set as wallpaper'), // FIXME: Translation
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
    var dest = OSjs.API.getDefaultPath();
    var self = this;

    OSjs.API.UploadFiles(this, null, dest, files, function(dest, filename, mime, size) {
      if ( self.iconView ) {
        self.iconView.addShortcut({
          path:     OSjs.Utils.format('{0}/{1}', (dest == '/' ? '' : dest), filename),
          mime:     mime || 'text/plain', // FIXME: Some uploads does not have mime !?
          size:     size || 0,
          type:     'file',
          filename: filename
        }, self);
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

    var keys = OSjs.Utils.Keys;
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
      OSjs.API.getHandlerInstance().setUserSettings(store);
    } else {
      OSjs.API.getHandlerInstance().setUserSettings('WindowManager', this.getSettings());
    }
  };

  CoreWM.prototype.showSettings = function(tab) {
    var self = this;
    if ( this.settingsWindow ) {
      this.settingsWindow._restore();
      setTimeout(function() {
        self.settingsWindow.setTab(tab);
      }, 10);
      return;
    }

    this.settingsWindow = this.addWindow(new OSjs.CoreWM.SettingsWindow(this));
    this.settingsWindow._focus();
    setTimeout(function() {
      self.settingsWindow.setTab(tab);
    }, 10);
  };

  CoreWM.prototype.eventWindow = function(ev, win) {
    // Make sure panel items are updated correctly
    // FIXME: This is not compatible with other PanelItems
    var panel, panelItem;
    for ( var i = 0; i < this.panels.length; i++ ) {
      panel = this.panels[i];
      if ( panel ) {
        panelItem = panel.getItem(OSjs.CoreWM.PanelItems.WindowList);
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
        icon.src = OSjs.API.getThemeResource(opts.icon, 'icon', '32x32');
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
      var pitem = panel.getItem(OSjs.CoreWM.PanelItems.NotificationArea, false);
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
      var pitem = panel.getItem(OSjs.CoreWM.PanelItems.NotificationArea, false);
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
    console.group("OSjs::Applications::CoreWM::applySettings");

    // Styles
    var opts = this.getSetting('style');
    var valid = ['backgroundColor', 'fontFamily'];
    console.log("Styles", opts);
    for ( var i in opts ) {
      if ( opts.hasOwnProperty(i) && OSjs.Utils.inArray(valid, i) ) {
        document.body.style[i] = opts[i];
      }
    }

    // Wallpaper and Background
    var name = this.getSetting('wallpaper');
    var type = this.getSetting('background');

    var className = 'Color';
    var back      = 'none';

    if ( name && type.match(/^image/) ) {
      back = "url('" + OSjs.API.getResourceURL(name) + "')";
      switch ( type ) {
        case     'image' :        className = 'Normal';   break;
        case     'image-center':  className = 'Center';   break;
        case     'image-fill' :   className = 'Fill';     break;
        case     'image-strech':  className = 'Strech';   break;
        default:                  className = 'Default';  break;
      }
    }

    console.log("Wallpaper name", name);
    console.log("Wallpaper type", type);
    console.log("Wallpaper className", className);

    var cn = document.body.className;
    var nc = 'Wallpaper' + className + ' ';
    document.body.className             = cn.replace(/(Wallpaper(.*)\s?)?/, nc);
    document.body.style.backgroundImage = back;

    // Theme
    var theme = this.getSetting('theme');
    console.log("theme", theme);
    if ( this.$themeLink ) {
      this.setThemeLink(OSjs.API.getThemeCSS(theme));
    }

    // Animations
    var anim  = this.getSetting('animations');
    console.log("animations", anim);
    if ( this.$animationLink ) {
      if ( anim ) {
        this.setAnimationLink(OSjs.API.getApplicationResource(this, 'animations.css'));
      } else {
        this.setAnimationLink(OSjs.API.getThemeCSS(null));
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
    this.$animationLink = OSjs.Utils.$createCSS(src);
  };

  CoreWM.prototype.setThemeLink = function(src) {
    if ( this.$themeLink ) {
      if ( this.$themeLink.parentNode ) {
        this.$themeLink.parentNode.removeChild(this.$themeLink);
      }
      this.$themeLink = null;
    }
    this.$themeLink = OSjs.Utils.$createCSS(src);
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
          // FIXME: Replace with a constant ?!
          s.top    += 10;
          s.height -= 10;
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
            pos.y += 10; // FIXME: Replace with a constant ?!
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

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications.CoreWM = CoreWM;

})(OSjs.Core.WindowManager, OSjs.GUI);
