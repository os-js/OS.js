/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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

  var SETTING_STORAGE_NAME = 'CoreWM';
  var PADDING_PANEL_AUTOHIDE = 10; // FIXME: Replace with a constant ?!

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var CoreWM = function(args, metadata) {
    var ds = OSjs.Applications.CoreWM.DefaultSettings;

    var importSettings = args.defaults || {};

    WindowManager.apply(this, ['CoreWM', this, args, metadata, ds(importSettings)]);

    this.scheme           = null;
    this.panels           = [];
    this.switcher         = null;
    this.iconView         = null;
    this.$themeLink       = null;
    this.$themeScript     = null;
    this.$animationLink   = null;
    this.importedSettings = importSettings;

    this._$notifications    = document.createElement('corewm-notifications');
    this._$notifications.setAttribute('role', 'log');

    document.body.appendChild(this._$notifications);
  };

  CoreWM.prototype = Object.create(WindowManager.prototype);
  CoreWM.constructor = WindowManager;

  CoreWM.prototype.init = function() {
    var link = (OSjs.Core.getConfig().Connection.RootURI || '/') + 'blank.css';
    this.setThemeLink(Utils.checkdir(link));
    this.setAnimationLink(Utils.checkdir(link));

    WindowManager.prototype.init.apply(this, arguments);
  };

  CoreWM.prototype.setup = function(cb) {
    var self = this;

    function initNotifications() {
      var user = OSjs.Core.getHandler().getUserData();

      function displayMenu(ev) {
        OSjs.API.createMenu([{
          title: API._('TITLE_SIGN_OUT'),
          onClick: function() {
            OSjs.API.signOut();
          }
        }], ev);

        return false;
      }

      function toggleFullscreen() {
        var notif = self.getNotificationIcon('_FullscreenNotification');
        if ( notif ) {
          if ( notif.opts._isFullscreen ) {
            if ( document.webkitCancelFullScreen ) {
              document.webkitCancelFullScreen();
            } else if ( document.mozCancelFullScreen ) {
              document.mozCancelFullScreen();
            } else if ( document.exitFullscreen ) {
              document.exitFullscreen();
            }
          } else {
            var docElm = document.documentElement;
            if ( docElm.requestFullscreen ) {
              docElm.requestFullscreen();
            } else if ( docElm.mozRequestFullScreen ) {
              docElm.mozRequestFullScreen();
            } else if ( docElm.webkitRequestFullScreen ) {
              docElm.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
          }
        }
      }

      if ( self.getSetting('fullscreen') ) {
        self.createNotificationIcon('_FullscreenNotification', {
          image: OSjs.API.getIcon('actions/gtk-fullscreen.png', '16x16'),
          title: 'Enter fullscreen',
          onClick: toggleFullscreen,
          _isFullscreen: false
        });
      }

      self.createNotificationIcon('_HandlerUserNotification', {
        image: API.getIcon('status/avatar-default.png', '16x16'),
        title: API._('TITLE_SIGNED_IN_AS_FMT', user.username),
        onContextMenu: displayMenu,
        onClick: displayMenu
      });
    }

    function initScheme(icb) {
      var schemeUrl = API.getApplicationResource('CoreWM', 'scheme.html');
      self.scheme = GUI.createScheme(schemeUrl);
      self.scheme.load(function(err) {
        icb();
      });
    }

    this.applySettings(this._settings.get());

    initScheme(function() {
      self.initSwitcher();
      self.initDesktop();
      self.initPanels();
      self.initIconView();

      initNotifications();

      cb();
    });

  };

  CoreWM.prototype.destroy = function(kill, force) {
    if ( !force && kill && !window.confirm(OSjs.Applications.CoreWM._('Killing this process will stop things from working!')) ) {
      return false;
    }

    this.removeNotificationIcon('_HandlerUserNotification');

    if ( this.iconView ) {
      this.iconView.destroy();
    }
    if ( this.switcher ) {
      this.switcher.destroy();
    }
    if ( this.scheme ) {
      this.scheme.destroy();
    }

    // Reset
    this.destroyPanels();
    var settings = this.importedSettings;
    try {
      settings.background = 'color';
    } catch ( e ) {}
    this.applySettings(OSjs.Applications.CoreWM.DefaultSettings(settings), true);

    // Clear DOM
    this._$notifications = Utils.$remove(this._$notifications);
    this.$themeLink = Utils.$remove(this.$themeLink);
    this.$themeScript = Utils.$remove(this.$themeScript);
    this.$animationLink = Utils.$remove(this.$animationLink);
    this.switcher = null;
    this.iconView = null;
    this.scheme = null;

    return WindowManager.prototype.destroy.apply(this, []);
  };

  CoreWM.prototype.destroyPanels = function() {
    this.panels.forEach(function(p) {
      p.destroy();
    });
    this.panels = [];
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

      if ( parentClass && (parentClass instanceof OSjs.Core.Window) ) {
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

  CoreWM.prototype.initSwitcher = function() {
    this.switcher = new OSjs.Applications.CoreWM.WindowSwitcher();
  };

  CoreWM.prototype.initDesktop = function() {
    var self = this;

    // Enable dropping of new wallpaper if no iconview is enabled
    GUI.Helpers.createDroppable(document.body, {
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

    document.addEventListener('contextmenu', function(ev) {
      return self.onContextMenu(ev);
    }, true);

    document.addEventListener('click', function(ev) {
      return self.onGlobalClick(ev);
    }, true);
  };

  CoreWM.prototype.initPanels = function(applySettings) {
    var ps = this.getSetting('panels');
    var added = false;
    var self = this;

    if ( ps === false ) {
      added = true;
    } else {
      this.destroyPanels();

      (ps || []).forEach(function(storedItem) {
        if ( !storedItem.options ) {
          storedItem.options = {};
        }

        var panelSettings = new OSjs.Helpers.SettingsFragment(storedItem.options, 'CoreWM');
        var p = new OSjs.Applications.CoreWM.Panel('Default', panelSettings, self);
        p.init(document.body);

        (storedItem.items || []).forEach(function(iter) {
          try {
            if ( typeof iter.settings === 'undefined' || iter.settings === null ) {
              iter.settings = {};
            }

            var itemSettings = {};
            try {
              itemSettings = new OSjs.Helpers.SettingsFragment(iter.settings, 'CoreWM');
            } catch ( ex ) {
              console.warn('An error occured while loading PanelItem settings', ex);
              console.warn('stack', ex.stack);
            }

            p.addItem(new OSjs.Applications.CoreWM.PanelItems[iter.name](itemSettings));
            added = true;
          } catch ( e ) {
            console.warn('An error occured while creating PanelItem', e);
            console.warn('stack', e.stack);

            self.notification({
              icon: 'status/important.png',
              title: 'CoreWM',
              message: OSjs.Applications.CoreWM._('An error occured while creating PanelItem: {0}', e)
            });
          }
        });

        self.panels.push(p);
      });
    }

    if ( !added ) {
      this.notification({
        timeout : 0,
        icon: 'status/important.png',
        title: 'CoreWM',
        message: OSjs.Applications.CoreWM._('Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)')
      });
    }

    if ( applySettings ) {
      // Workaround for windows appearing behind panel
      var p = this.panels[0];
      if ( p && p.getOntop() && p.getPosition('top') ) {
        var space = this.getWindowSpace();
        this._windows.forEach(function(iter) {
          if ( iter && iter._position.y < space.top ) {
            console.warn('CoreWM::initPanels()', 'I moved this window because it overlapped with a panel!', iter);
            iter._move(iter._position.x, space.top);
          }
        });
      }

      if ( this.iconView ) {
        this.iconView.resize(this);
      }
    }

    setTimeout(function() {
      self.setStyles(self._settings.get());
    }, 1000);
  };

  CoreWM.prototype.initIconView = function() {
    var self = this;

    if ( this.iconView ) {
      this.iconView.destroy();
      this.iconView = null;
    }

    if ( !this.getSetting('enableIconView') ) { return; }

    this.iconView = new OSjs.Applications.CoreWM.DesktopIconView(this);
    document.body.appendChild(this.iconView.getRoot());

    setTimeout(function() {
      if ( self.iconView ) {
        self.iconView.resize(self);
      }
    }, this.getAnimDuration() + 500);
  };

  //
  // Events
  //

  CoreWM.prototype.resize = function(ev, rect, wasInited) {
    if ( !this.getSetting('moveOnResize') ) { return; }

    var space = this.getWindowSpace();
    var margin = this.getSetting('desktopMargin');
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
      if ( iter._state.maximized && (wasInited ? iter._restored : true) ) {
        iter._restore(true, false);
      }
    }
  };

  CoreWM.prototype.onDropLeave = function() {
    document.body.setAttribute('data-attention', 'false');
  };

  CoreWM.prototype.onDropOver = function() {
    document.body.setAttribute('data-attention', 'true');
  };

  CoreWM.prototype.onDrop = function() {
    document.body.setAttribute('data-attention', 'false');
  };

  CoreWM.prototype.onDropItem = function(ev, el, item, args) {
    document.body.setAttribute('data-attention', 'false');

    var _applyWallpaper = function(data) {
      this.applySettings({wallpaper: data.path}, false, true);
    };

    var _createShortcut = function(data) {
      if ( this.iconView ) {
        this.iconView.addShortcut(data, this, true);
      }
    };

    var _openMenu = function(data, self) {
      var pos = {x: ev.clientX, y: ev.clientY};
      OSjs.API.createMenu([{
        title: OSjs.Applications.CoreWM._('Create shortcut'),
        onClick: function() {
          _createShortcut.call(self, data);
        }
      }, {
        title: OSjs.Applications.CoreWM._('Set as wallpaper'),
        onClick: function() {
          _applyWallpaper.call(self, data);
        }
      }], pos);
    };

    if ( item ) {
      var data = item.data;
      if ( item.type === 'file' ) {
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
      } else if ( item.type === 'application' ) {
        _createShortcut.call(this, data);
      }
    }
  };

  CoreWM.prototype.onDropFile = function(ev, el, files, args) {
    var self = this;

    VFS.upload({
      destination: API.getDefaultPath(),
      files: files
    }, function(error, file) {
      if ( !error && file && self.iconView ) {
        self.iconView.addShortcut(file, self, true);
      }
    });
  };

  CoreWM.prototype.onGlobalClick = function(ev) {
    this.themeAction('event', [ev]);
    return true;
  };

  CoreWM.prototype.onContextMenu = function(ev) {
    if ( ev.target === document.body ) {
      ev.preventDefault();
      ev.stopPropagation();
      this.openDesktopMenu(ev);
      return false;
    }
    return true;
  };

  CoreWM.prototype.onKeyUp = function(ev, win) {
    if ( !ev ) { return; }

    if ( !ev.altKey ) {
      if ( this.switcher ) {
        this.switcher.hide(ev, win, this);
      }
    }
  };

  CoreWM.prototype.onKeyDown = function(ev, win) {
    if ( !ev ) { return; }

    var keys = Utils.Keys;
    if ( ev.altKey && ev.keyCode === keys.TILDE ) { // Toggle Window switcher
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

  CoreWM.prototype.showSettings = function(category) {
    var self = this;

    OSjs.API.launch('ApplicationSettings', {category: category});
  };

  CoreWM.prototype.eventWindow = function(ev, win) {
    // Make sure panel items are updated correctly
    // FIXME: This is not compatible with other PanelItems

    this.panels.forEach(function(panel) {
      if ( panel ) {
        var panelItem = panel.getItem(OSjs.Applications.CoreWM.PanelItems.WindowList);
        if ( panelItem ) {
          panelItem.update(ev, win);
        }
      }
    });

    // Unfocus IconView if we focus a window
    if ( ev === 'focus' ) {
      if ( this.iconView ) {
        this.iconView.blur();
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

      var container  = document.createElement('corewm-notification');
      var classNames = [''];
      var self       = this;
      var timeout    = null;
      var wm         = OSjs.Core.getWindowManager();

      function _remove() {
        if ( timeout ) {
          clearTimeout(timeout);
          timeout = null;
        }

        container.onclick = null;
        function _removeDOM() {
          if ( container.parentNode ) {
            container.parentNode.removeChild(container);
          }
          _visible--;
          if ( _visible <= 0 ) {
            self._$notifications.style.display = 'none';
          }
        }

        var anim = wm ? wm.getSetting('animations') : false;
        if ( anim ) {
          container.setAttribute('data-hint', 'closing');
          setTimeout(function() {
            _removeDOM();
          }, wm.getAnimDuration());
        } else {
          container.style.display = 'none';
          _removeDOM();
        }
      }

      if ( opts.icon ) {
        var icon = document.createElement('img');
        icon.alt = '';
        icon.src = API.getIcon(opts.icon, '32x32');
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
        var lines = opts.message.split('\n');
        lines.forEach(function(line, idx) {
          message.appendChild(document.createTextNode(line));
          if ( idx < (lines.length - 1) ) {
            message.appendChild(document.createElement('br'));
          }
        });
        classNames.push('HasMessage');
        container.appendChild(message);
      }

      _visible++;
      if ( _visible > 0 ) {
        this._$notifications.style.display = 'block';
      }

      container.setAttribute('aria-label', String(opts.title));
      container.setAttribute('role', 'alert');

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

  CoreWM.prototype._getNotificationArea = function(panelId) {
    panelId = panelId || 0;
    var panel  = this.panels[panelId];
    var result = null;
    if ( panel ) {
      return panel.getItem(OSjs.Applications.CoreWM.PanelItems.NotificationArea, false);
    }

    return false;
  };

  CoreWM.prototype.createNotificationIcon = function(name, opts, panelId) {
    opts = opts || {};
    if ( !name ) { return false; }

    var pitem = this._getNotificationArea(panelId);
    if ( pitem ) {
      return pitem.createNotification(name, opts);
    }
    return null;
  };

  CoreWM.prototype.removeNotificationIcon = function(name, panelId) {
    if ( !name ) { return false; }

    var pitem = this._getNotificationArea(panelId);
    if ( pitem ) {
      pitem.removeNotification(name);
      return true;
    }
    return false;
  };

  CoreWM.prototype.getNotificationIcon = function(name, panelId) {
    if ( !name ) { return false; }
    var pitem = this._getNotificationArea(panelId);
    if ( pitem ) {
      return pitem.getNotification(name);
    }
    return false;
  };

  CoreWM.prototype.openDesktopMenu = function(ev) {
    var self = this;
    var menu = [
      {title: OSjs.Applications.CoreWM._('Open settings'), onClick: function(ev) {
        self.showSettings();
      }}
    ];

    if ( this.getSetting('enableIconView') === true ) {
      menu.push({
        title: OSjs.Applications.CoreWM._('Hide Icons'),
        onClick: function(ev) {
          self.applySettings({enableIconView: false}, false, true);
        }
      });
    } else {
      menu.push({
        title: OSjs.Applications.CoreWM._('Show Icons'),
        onClick: function(ev) {
          self.applySettings({enableIconView: true}, false, true);
        }
      });
    }

    API.createMenu(menu, ev);
  };

  CoreWM.prototype.applySettings = function(settings, force, save) {
    console.group('OSjs::Applications::CoreWM::applySettings');

    settings = force ? settings : Utils.mergeObject(this._settings.get(), settings);

    this.setBackground(settings);
    this.setTheme(settings);
    this.setIconView(settings);
    this.setStyles(settings);

    if ( save ) {
      this.initPanels(true);
      if ( settings ) {
        if ( settings.language ) {
          OSjs.Core.getSettingsManager().set('Core', 'Locale', settings.language);
          API.setLocale(settings.language);
        }
        this._settings.set(null, settings, save);
      }
    }

    console.groupEnd();

    return true;
  };

  CoreWM.prototype.themeAction = function(action, args) {
    args = args || [];
    if ( OSjs.Applications.CoreWM.CurrentTheme ) {
      try {
        OSjs.Applications.CoreWM.CurrentTheme[action].apply(null, args);
      } catch ( e ) {
        console.warn('CoreWM::themeAction()', 'exception', e);
        console.warn(e.stack);
      }
    }
  };

  //
  // Theme Setters
  //

  CoreWM.prototype.setBackground = function(settings) {
    if ( settings.backgroundColor ) {
      document.body.style.backgroundColor = settings.backgroundColor;
    }
    if ( settings.fontFamily ) {
      document.body.style.fontFamily = settings.fontFamily;
    }

    var name = settings.wallpaper;
    var type = settings.background;

    var className = 'color';
    var back      = 'none';

    if ( name && type.match(/^image/) ) {
      back = name;
      switch ( type ) {
        case 'image' :        className = 'normal';   break;
        case 'image-center':  className = 'center';   break;
        case 'image-fill' :   className = 'fill';     break;
        case 'image-strech':  className = 'strech';   break;
        default:                  className = 'default';  break;
      }
    }

    console.log('Wallpaper name', name);
    console.log('Wallpaper type', type);
    console.log('Wallpaper className', className);

    document.body.setAttribute('data-background-style', className);

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
  };

  CoreWM.prototype.setTheme = function(settings) {
    console.log('theme', settings.theme);
    if ( this.$themeLink ) {
      if ( settings.theme ) {
        this.setThemeLink(API.getThemeCSS(settings.theme));
      } else {
        console.warn('NO THEME WAS SELECTED!');
      }
    }

    if ( this.$themeLink ) {
      this.themeAction('destroy');
    }

    this.setThemeScript(API.getThemeResource('theme.js'));

    console.log('animations', settings.animations);
    if ( this.$animationLink ) {
      if ( settings.animations ) {
        this.setAnimationLink(API.getApplicationResource(this, 'animations.css'));
      } else {
        this.setAnimationLink(API.getThemeCSS(null));
      }
    }
  };

  CoreWM.prototype.setIconView = function(settings) {
    if ( settings.enableIconView ) {
      this.initIconView();
    } else {
      if ( this.iconView ) {
        this.iconView.destroy();
        this.iconView = null;
      }
    }
  };

  CoreWM.prototype.setStyles = function(settings) {
    /*jshint sub:true*/
    var styles = {};
    var raw = '';

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
        if ( p.options.background ) {
          styles['corewm-panel:before']['background-color'] = p.options.background;
          styles['corewm-notification:before']['background-color'] = p.options.background;
        }
        if ( p.options.foreground ) {
          styles['corewm-panel']['color'] = p.options.foreground;
          styles['corewm-notification']['color'] = p.options.foreground;
        }
      });
    }

    raw += '@media all and (max-width: 800px) {\n';
    raw += 'application-window {\n';

    var borderSize = 0;
    var space = this.getWindowSpace(true);
    var theme = this.getStyleTheme(true);
    if ( theme && theme.style && theme.style.window ) {
      borderSize = theme.style.window.border;
    }

    raw += 'top:' + String(space.top + borderSize) + 'px !important;\n';
    raw += 'left:' + String(space.left + borderSize) + 'px !important;\n';
    raw += 'right:' + String(borderSize) + 'px !important;\n';
    raw += 'bottom:' + String(space.bottom + borderSize) + 'px !important;\n';
    raw += '\n}';
    raw += '\n}';

    styles['#CoreWMDesktopIconView'] = {};
    if ( settings.invertIconViewColor && settings.backgroundColor ) {
      styles['#CoreWMDesktopIconView']['color'] = Utils.invertHEX(settings.backgroundColor);
    }

    if ( Object.keys(styles).length ) {
      this.createStylesheet(styles, raw);
    }
  };

  CoreWM.prototype.setAnimationLink = function(src) {
    if ( this.$animationLink ) {
      this.$animationLink = Utils.$remove(this.$animationLink);
    }
    this.$animationLink = Utils.$createCSS(src);
  };

  CoreWM.prototype.setThemeLink = function(src) {
    if ( this.$themeLink ) {
      this.$themeLink = Utils.$remove(this.$themeLink);
    }
    this.$themeLink = Utils.$createCSS(src);
  };

  CoreWM.prototype.setThemeScript = function(src) {
    if ( this.$themeScript ) {
      this.$themeScript = Utils.$remove(this.$themeScript);
    }

    var self = this;
    if ( src ) {
      this.$themeScript = Utils.$createJS(src, null, function() {
        self.themeAction('init');
      });
    }
  };

  //
  // Getters / Setters
  //

  CoreWM.prototype.getWindowSpace = function(noMargin) {
    var s = WindowManager.prototype.getWindowSpace.apply(this, arguments);
    var d = this.getSetting('desktopMargin');

    s.bottom = 0;

    this.panels.forEach(function(p) {
      if ( p && p.getOntop() ) {
        var ph = p.getHeight();
        if ( p.getAutohide() ) {
          s.top    += PADDING_PANEL_AUTOHIDE;
          s.height -= PADDING_PANEL_AUTOHIDE;
        } else if ( p.getPosition('top') ) {
          s.top    += ph;
          s.height -= ph;
        } else {
          s.height -= ph;
        }

        if ( p._options.position === 'bottom' ) {
          p.bottom += ph;
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
  };

  CoreWM.prototype.getWindowPosition = function(borders) {
    borders = (typeof borders === 'undefined') || (borders === true);
    var pos = WindowManager.prototype.getWindowPosition.apply(this, arguments);

    var m = borders ? this.getSetting('desktopMargin') : 0;
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
  };

  CoreWM.prototype.getSetting = function(k) {
    var val = WindowManager.prototype.getSetting.apply(this, arguments);
    if ( typeof val === 'undefined' || val === null ) {
      var ds = OSjs.Applications.CoreWM.DefaultSettings;
      return ds(this.importedSettings)[k];
    }
    return val;
  };

  CoreWM.prototype.getDefaultSetting = function(k) {
    var ds = OSjs.Applications.CoreWM.DefaultSettings;
    var settings = ds(this.importedSettings);
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

  CoreWM.prototype.getStyleTheme = function(returnMetadata) {
    var name = this.getSetting('theme') || null;
    if ( returnMetadata ) {
      var found = null;
      if ( name ) {
        this.getStyleThemes().forEach(function(t) {
          if ( t && t.name === name ) {
            found = t;
          }
          return found ? false : true;
        });
      }
      return found;
    }
    return name;
  };

  CoreWM.prototype.getSoundTheme = function() {
    return this.getSetting('sounds') || 'default';
  };

  CoreWM.prototype.getIconTheme = function() {
    return this.getSetting('icons') || 'default';
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.Class             = Object.seal(CoreWM);
  OSjs.Applications.CoreWM.PanelItems        = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.CurrentTheme      = OSjs.Applications.CoreWM.CurrentTheme || null;

})(OSjs.Core.WindowManager, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
