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
      theme           : 'uncomplicated',
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
            {name: 'Clock'}
          ]
        }
      ],
      style           : {
        backgroundColor  : '#0B615E',
        fontFamily       : 'OSjsFont'
      }
    };

    if ( defaults ) {
      return OSjs.Utils.mergeObject(cfg, defaults);
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

    this._settings      = DefaultSettings(args.defaults || {});
    this.panels         = [];
    this.switcher       = null;
    this.settingsWindow = null;
    this.iconView       = null;
  };

  CoreWM.prototype = Object.create(WindowManager.prototype);

  CoreWM.prototype.init = function() {
    WindowManager.prototype.init.apply(this, arguments);

    this.initDesktop();
    this.initWM(function() {
      this.initPanels();
      this.initIconView();
    });

    this.switcher = new OSjs.CoreWM.WindowSwitcher();
    this.switcher.init();
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
    this.applySettings(DefaultSettings(), true);

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
        self.applySettings(DefaultSettings(), true);
      }

      callback.call(self);
    });
  };

  CoreWM.prototype.initDesktop = function() {
    var self = this;
    var _openDesktopSettings = function() {
      self.showSettings();
    };

    var _openDesktopMenu = function(ev) {
      OSjs.GUI.createMenu([{title: _('Open settings'), onClick: function(ev) {_openDesktopSettings();}}], {x: ev.clientX, y: ev.clientY});
    };

    var background = document.getElementById('Background');
    if ( background ) {
      background.oncontextmenu = function(ev) {
        ev.preventDefault();
        _openDesktopMenu(ev);
        return false;
      };
    };

    //this.showSettings('Panels');
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

        try {
          if ( ps[i].items ) {
            for ( j = 0; j < ps[i].items.length; j++ ) {
              n = ps[i].items[j];
              p.addItem(new OSjs.CoreWM.PanelItems[n.name]());
              added = true;
            }
          }
        } catch ( e ) {
          console.warn("An error occured while creating PanelItem", e);
          console.warn('stack', e.stack);
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

    this.iconView = new OSjs.CoreWM.DesktopIconView();
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
        this.iconView.addShortcut(data);
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
          _openMenu.call(this, data, this);
        } else {
          _createShortcut.call(this, data);
        }
      }
    }
  };

  CoreWM.prototype.onDropFile = function(ev, el, files, args) {
    // TODO
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
    // FIXME
    var panelItem = this.panels[0] ? this.panels[0].getItem(OSjs.CoreWM.PanelItems.WindowList) : null;
    if ( panelItem ) {
      panelItem.update(ev, win);
    }
  };

  CoreWM.prototype.applySettings = function(settings, force, save) {
    if ( !WindowManager.prototype.applySettings.apply(this, arguments) ) {
      return false;
    }
    console.group("OSjs::Applications::CoreWM::applySettings");

    // Styles
    var opts = this.getSetting('style');
    console.log("Styles", opts);
    for ( var i in opts ) {
      if ( opts.hasOwnProperty(i) ) {
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
    var tlink = document.getElementById("_OSjsTheme");
    console.log("theme", theme);
    tlink.setAttribute('href', OSjs.API.getThemeCSS(theme));

    // Animations
    var anim  = this.getSetting('animations');
    var alink = document.getElementById("_OSjsAnimations");
    console.log("animations", anim);
    if ( anim ) {
      alink.setAttribute('href', OSjs.API.getApplicationResource(this, 'animations.css'));
    } else {
      alink.setAttribute('href', OSjs.API.getThemeCSS(null));
    }

    console.groupEnd();

    if ( save ) {
      this.initPanels(true);

      var store = { WindowManager: this.getSettings() };
      if ( settings.language ) {
        store.Core = { Locale: settings.language };
      }
      OSjs.API.getHandlerInstance().setUserSettings(store);
    }

    return true;
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
      return DefaultSettings()[k];
    }
    return val;
  };

  CoreWM.prototype.getDefaultSetting = function(k) {
    var settings = DefaultSettings();
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
