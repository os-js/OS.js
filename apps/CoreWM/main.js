(function(WindowManager, GUI) {

  function DefaultSettings(defaults) {
    var cfg = {
      animations      : OSjs.Compability.css.animation,
      fullscreen      : false,
      taskbar         : {position: 'top', ontop: true},
      desktop         : {margin: 5},
      wallpaper       : '/themes/wallpapers/noise_red.png',
      theme           : 'default',
      background      : 'image-repeat',
      menuCategories  : true,
      enableSwitcher  : true,
      enableHotkeys   : true,
      moveOnResize    : true,       // Move windows into viewport on resize
      style           : {
        backgroundColor  : '#0B615E',
        fontFamily       : 'OSjsFont'
      }
    };

    var _check = function(iter) {
      for ( var i in iter ) {
        if ( cfg.hasOwnProperty(i) ) {
          if ( typeof cfg[i] === 'object' ) {
            _check(iter[i]);
          } else {
            cfg[i] = iter[i];
          }
        }
      }
    };

    if ( defaults ) {
      _check(defaults);
    }

    return cfg;
  }

  var  DefaultCategories = {
    development : {icon: 'categories/package_development.png', title: 'Development'},
    education   : {icon: 'categories/applications-sience.png', title: 'Education'},
    games       : {icon: 'categories/package_games.png',       title: 'Games'},
    graphics    : {icon: 'categories/package_graphics.png',    title: 'Graphics'},
    network     : {icon: 'categories/package_network.png',     title: 'Network'},
    multimedia  : {icon: 'categories/package_multimedia.png',  title: 'Multimedia'},
    office      : {icon: 'categories/package_office.png',      title: 'Office'},
    system      : {icon: 'categories/package_system.png',      title: 'System'},
    utilities   : {icon: 'categories/package_utilities.png',   title: 'Utilities'},
    unknown     : {icon: 'categories/applications-other.png',  title: 'Other'}
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function _createIcon(aiter, aname) {
    return OSjs.API.getIcon(aiter.icon, aiter);
  }

  function BuildMenu(ev) {
    var apps = OSjs.API.getHandlerInstance().getApplicationsMetadata();
    var list = [];
    for ( var a in apps ) {
      if ( apps.hasOwnProperty(a) ) {
        if ( apps[a].type === "service" || apps[a].type === "special" ) { continue; }
        list.push({
          title: apps[a].name,
          icon: _createIcon(apps[a], a),
          onClick: (function(name, iter) {
            return function() {
              OSjs.API.launch(name);
            };
          })(a, apps[a])
        });
      }
    }
    GUI.createMenu(list, {x: ev.clientX, y: ev.clientY});
  }

  function BuildCategoryMenu(ev) {
    var apps = OSjs.API.getHandlerInstance().getApplicationsMetadata();
    var list = [];
    var cats = {};

    var c, a, iter, cat, submenu;

    for ( c in DefaultCategories ) {
      if ( DefaultCategories.hasOwnProperty(c) ) {
        cats[c] = [];
      }
    }

    for ( a in apps ) {
      if ( apps.hasOwnProperty(a) ) {
        iter = apps[a];
        if ( iter.type === "service" || iter.type === "special" ) { continue; }
        cat = iter.category && cats[iter.category] ? iter.category : 'unknown';
        cats[cat].push({name: a, data: iter})
      }
    }

    for ( c in cats ) {
      if ( cats.hasOwnProperty(c) ) {
        submenu = [];
        for ( a = 0; a < cats[c].length; a++ ) {
          iter = cats[c][a];
          submenu.push({
            title: iter.data.name,
            icon: _createIcon(iter.data, iter.name),
            onClick: (function(name, iter) {
              return function() {
                OSjs.API.launch(name);
              };
            })(iter.name, iter.data)
          });
        }

        if ( submenu.length ) {
          list.push({
            title: DefaultCategories[c].title,
            icon:  OSjs.API.getThemeResource(DefaultCategories[c].icon, 'icon', '16x16'),
            menu:  submenu
          });
        }
      }
    }

    GUI.createMenu(list, {x: ev.clientX, y: ev.clientY});
  }

  /////////////////////////////////////////////////////////////////////////////
  // Window Switcher
  /////////////////////////////////////////////////////////////////////////////

  var WindowSwitcher = function() {
    this.$switcher      = null;
    this.showing        = false;
    this.index          = -1;
  };

  WindowSwitcher.prototype.init = function() {
    this.$switcher = document.createElement('div');
    this.$switcher.id = 'WindowSwitcher';
  };

  WindowSwitcher.prototype.destroy = function() {
    if ( this.$switcher ) {
      if ( this.$switcher.parentNode ) {
        this.$switcher.parentNode.removeChild(this.$switcher);
      }
      this.$switcher = null;
    }
  };

  WindowSwitcher.prototype.show = function(ev, win, wm) {
    ev.preventDefault();

    var list  = [];
    var index = 0;
    var i = 0, l = wm._windows.length, iter;

    for ( i; i < l; i++ ) {
      iter = wm._windows[i];
      if ( !iter ) { continue; }

      list.push({
        title:    iter._title,
        icon:     iter._icon
      });

      if ( index === 0 ) {
        if ( (win && win._wid === iter._wid) ) {
           index = i;
        }
      }
    }

    if ( this.index === -1 ) {
      this.index = index;
    } else {
      this.index++;
      if ( this.index >= l ) {
        this.index = 0;
      }

      index = this.index;
    }

    var height = 0;
    var root = this.$switcher;
    OSjs.Utils.$empty(root);

    var container, image, label;
    for ( i = 0; i < l; i++ ) {
      iter = list[i];
      if ( !iter ) { continue; }

      container       = document.createElement('div');

      image           = document.createElement('img');
      image.src       = iter.icon;

      label           = document.createElement('span');
      label.innerHTML = iter.title;

      if ( i === index ) {
        container.className = 'Active';
      }

      container.appendChild(image);
      container.appendChild(label);
      root.appendChild(container);

      height += 32;
    }

    if ( !root.parentNode ) {
      document.body.appendChild(root);
    }

    root.style.height = height + 'px';
    root.style.marginTop = (height ? -((height/2) << 0) : 0) + 'px';

    this.showing = true;
    this.index = index;
  };

  WindowSwitcher.prototype.hide = function(ev, win, wm) {
    if ( !this.showing ) { return; }

    ev.preventDefault();

    if ( this.$switcher && this.$switcher.parentNode ) {
      this.$switcher.parentNode.removeChild(this.$switcher);
    }

    if ( this.index >= 0 ) {
      var found = false;
      if ( wm._windows[this.index] ) {
        wm._windows[this.index]._focus();
        found = true;
      }

      if ( !found && win ) {
        win._focus();
      }
    }

    this.index   = -1;
    this.showing = false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // PANELS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is a work in progress
   */
  var Panel = function(name) {
    this._name = name;
    this._$element = null;
    this._$container = null;
  };

  Panel.prototype.init = function(root) {
    var self = this;

    this._$container = document.createElement('ul');

    this._$element = document.createElement('div');
    this._$element.className = 'WMPanel';

    this._$element.onmousedown = function(ev) {
      ev.preventDefault();
      return false;
    };
    this._$element.onclick = function(ev) {
      OSjs.GUI.blurMenu();
    };
    this._$element.oncontextmenu = function(ev) {
      OSjs.GUI.blurMenu();
      return false;
    };

    this._$element.appendChild(this._$container);
    root.appendChild(this._$element);
  };

  Panel.prototype.destroy = function() {
    if ( this._$element && this._$element.parentNode ) {
      this._$element.onmousedown = null;
      this._$element.onclick = null;
      this._$element.oncontextmenu = null;
      this._$element.parentNode.removeChild(this._$element);
      this._$element = null;
    }
  };

  Panel.prototype.addItem = function(callback) {
    var self = this;
    var el = document.createElement('li');
    el.className = 'PanelItem';
    this._$container.appendChild(el);

    setTimeout(function() {
      callback.call(self, self._$element, el);
    }, 0);
  };

  Panel.prototype.getRoot = function() {
    return this._$element;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var CoreWM = function(args, metadata) {
    WindowManager.apply(this, ['CoreWM', this, args, metadata]);

    this._settings      = DefaultSettings(args.defaults || {});
    this.clockInterval  = null; // FIXME
    this.panels         = [];
    this.switcher       = null;
  };

  CoreWM.prototype = Object.create(WindowManager.prototype);

  CoreWM.prototype.init = function() {
    WindowManager.prototype.init.apply(this, arguments);

    this.initDesktop();
    this.initPanels();
    this.initWM();

    this.switcher = new WindowSwitcher();
    this.switcher.init();
  };

  CoreWM.prototype.destroy = function(kill) {
    if ( kill && !confirm("Killing this process will stop things from working!") ) {
      return false;
    }

    if ( this.switcher ) {
      this.switcher.destroy();
      this.switcher = null;
    }

    if ( this.panels.length ) {
      for ( var i = 0; i < this.panels.length; i++ ) {
        this.panels[i].destroy();
      }
      this.panels = [];
    }

    if ( this.clockInterval ) { // FIXME
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }

    // Reset styles
    this.applySettings(DefaultSettings(), true);

    return WindowManager.prototype.destroy.apply(this, []);
  };

  //
  // Initialization
  //

  CoreWM.prototype.initWM = function() {
    var self = this;
    OSjs.API.getHandlerInstance().getUserSettings('WindowManager', function(s) {
      if ( s ) {
        self.applySettings(s);
      } else {
        self.applySettings(DefaultSettings(), true);
      }
    });

    var back = document.getElementById("Background");
    if ( back ) {
      var _addBlink = function() {
        if ( !back.className.match(/Blinking/) ) {
          back.className += ' Blinking';
        }
      };
      var _remBlink = function() {
        if ( back.className.match(/Blinking/) ) {
          back.className = back.className.replace(/\s?Blinking/, '');
        }
      };

      OSjs.GUI.createDroppable(back, {
        onOver: function(ev, el, args) {
          _addBlink();
        },

        onLeave : function() {
          _remBlink();
        },

        onDrop : function() {
          _remBlink();
        },

        onItemDropped: function(ev, el, item, args) {
          _remBlink();
          if ( item ) {
            var data = item.data;
            if ( data && data.type === 'file' && data.mime && data.mime.match(/^image/) ) {
              self.applySettings({wallpaper: data.path});
            }
          }
        }
      });
    }
  };

  CoreWM.prototype.initDesktop = function() {
    var _openDesktopSettings = function() {
      OSjs.API.launch('ApplicationSettings');
    };

    var _openDesktopMenu = function(ev) {
      var h = OSjs.API.getHandlerInstance();
      if ( h ) {
        var app = h.getApplicationMetadata('ApplicationSettings');
        if ( app ) {
          OSjs.GUI.createMenu([{title: 'Open settings', onClick: function(ev) {_openDesktopSettings();}}], {x: ev.clientX, y: ev.clientY});
        }
      }
    };

    var background = document.getElementById('Background');
    if ( background ) {
      background.oncontextmenu = function(ev) {
        ev.preventDefault();
        _openDesktopMenu(ev);
        return false;
      };
    };
  };

  CoreWM.prototype.initPanels = function() {
    var self = this;
    var p = new Panel('Default');

    p.init(document.body);

    // Buttons
    p.addItem(function(root, elem) {
      var el = document.createElement('ul');
      var icon = OSjs.API.getThemeResource('categories/applications-other.png', 'icon');
      var sel = document.createElement('li');
      sel.className = 'Button';
      sel.title = "Applications";
      sel.innerHTML = '<img alt="" src="' + icon + '" />';
      sel.onclick = function(ev) {
        ev.stopPropagation();
        if ( self.getSetting('menuCategories') ) {
          BuildCategoryMenu(ev);
        } else {
          BuildMenu(ev);
        }
        return false;
      };

      el.appendChild(sel);

      icon = OSjs.API.getThemeResource('actions/exit.png', 'icon');
      sel = document.createElement('li');
      sel.className = 'Button';
      sel.title = 'Log out (Exit)';
      sel.innerHTML = '<img alt="" src="' + icon + '" />';
      sel.onclick = function() {
        var user = OSjs.API.getHandlerInstance().getUserData() || {name: 'Unknown'};
        var t = confirm("Logging out user '" + user.name + "'.\nDo you want to save current session?");
        OSjs._shutdown(t, false);
      };
      el.appendChild(sel);

      elem.className += ' PanelItemButtons';
      elem.appendChild(el);
    });

    // Window List
    p.addItem(function(root, elem) {
      var el = document.createElement('ul');
      el.id = 'WindowList';

      // Updated dynamically

      elem.className += ' PanelItemWindowList';
      elem.appendChild(el);
    });

    // Clock
    p.addItem(function(root, elem) {
      var clock = document.createElement('div');
      clock.innerHTML = '00:00';
      var _updateClock = function() {
        var d = new Date();
        clock.innerHTML = d.toLocaleTimeString();
        clock.title     = d.toLocaleDateString();
      };
      self.clockInterval = setInterval(_updateClock, 1000);
      _updateClock();
      elem.className += ' PanelItemClock';
      elem.appendChild(clock);
    });

    this.panels.push(p);
  };

  //
  // Events
  //

  CoreWM.prototype.resize = function(ev, rect) {
    if ( !this.getSetting('moveOnResize') ) { return; }

    var space = this.getWindowSpace();
    var margin = 10;
    var i = 0, l = this._windows.length, iter, wrect;
    var mx, my, mw, mh, moved;

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

      // Restore maximized windows if they overflow
      if ( iter._state.maximized ) {
        mw = (mx + iter._dimension.w);
        mh = (my + iter._dimension.h);
        if ( mw > space.width || mh > space.height ) {
          iter._restore(true, false);
        }
      }
    }
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
    // TODO: Custom key bindings

    if ( ev.shiftKey && ev.keyCode === 9 ) { // Toggle Window switcher
      if ( !this.getSetting('enableSwitcher') ) { return; }

      if ( this.switcher ) {
        this.switcher.show(ev, win, this);
      }
    } else if ( ev.altKey ) {
      if ( !this.getSetting('enableHotkeys') ) { return; }

      if ( win && win._properties.allow_hotkeys ) {
        if ( ev.keyCode === 72 ) { // Hide window [H]
          win._minimize();
        } else if ( ev.keyCode === 77 ) { // Maximize window [M]
          win._maximize();
        } else if ( ev.keyCode === 82 ) { // Restore window [R]
          win._restore();
        } else if ( ev.keyCode === 37 ) { // Pin Window Left [Left]
          win._moveTo('left');
        } else if ( ev.keyCode === 39 ) { // Pin Window Right [Right]
          win._moveTo('right');
        } else if ( ev.keyCode === 38 ) { // Pin Window Top [Up]
          win._moveTo('top');
        } else if ( ev.keyCode === 40 ) { // Pin Window Bottom [Down]
          win._moveTo('bottom');
        }
      }
    }
  };

  CoreWM.prototype.eventWindow = function(ev, win) {
    if ( win && win._properties.allow_windowlist === false ) {
      return;
    }
    // TODO: Move this code into a custom class
    //console.log("OSjs::Applications::CoreWM::eventWindow", ev, win._name);
    var $el = document.getElementById('WindowList');
    if ( !$el ) {
      return;
    }

    var cn = 'WindowList_Window_' + win._wid;
    var _change = function(cn, callback) {
      var els = $el.getElementsByClassName(cn);
      if ( els.length ) {
        for ( var i = 0, l = els.length; i < l; i++ ) {
          if ( els[i] && els[i].parentNode ) {
            callback(els[i]);
          }
        }
      }
    };

    if ( ev == 'create' ) {
      var el = document.createElement('li');
      el.innerHTML = '<img alt="" src="' + win._icon + '" /><span>' + win._title + '</span>';
      el.className = 'Button WindowList_Window_' + win._wid;
      el.title = win._title;
      el.onclick = function() {
        win._restore();
      };
      $el.appendChild(el);
    } else if ( ev == 'close' ) {
      _change(cn, function(el) {
        el.parentNode.removeChild(el);
      });
    } else if ( ev == 'focus' ) {
      _change(cn, function(el) {
        el.className += ' Focused';
      });
    } else if ( ev == 'blur' ) {
      _change(cn, function(el) {
        el.className = el.className.replace(/\s?Focused/, '');
      });
    } else if ( ev == 'title' ) {
      _change(cn, function(el) {
        el.getElementsByTagName('span')[0].innerHTML = win._title;
        el.title = win._title;
      });
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
      alink.setAttribute('href', OSjs.API.getResourceURL('/frontend/blank.css'));
    }

    // Misc
    var classNames = [];
    var opts = this.getSetting('taskbar');
    if ( opts ) {
      if ( opts.ontop ) {
        classNames.push('Ontop');
      }
      classNames.push(opts.position == 'top' ? 'Top' : 'Bottom');

      // Workaround for windows appearing behind panel
      if ( opts.position === 'top' ) {
        var iter;
        var space = this.getWindowSpace();
        for ( var i = 0; i < this._windows.length; i++ ) {
          iter = this._windows[i];
          if ( !iter ) { continue; }
          if ( iter._position.y < space.top ) {
            console.warn("CoreWM::applySettings()", "I moved this window because it overlapped with a panel!", iter);
            iter._move(iter._position.x, space.top);
          }
        }
      }
    }

    if ( this.panels.length ) {
      this.panels[0].getRoot().className = 'WMPanel ' + classNames.join(' ');
    }

    if ( save ) {
      OSjs.API.getHandlerInstance().setUserSettings('WindowManager', this.getSettings());
    }

    console.groupEnd();
    return true;
  };


  //
  // Getters / Setters
  //

  CoreWM.prototype.getWindowSpace = function() {
    var s = WindowManager.prototype.getWindowSpace.apply(this, arguments);
    var t = this.getSetting('taskbar');
    var d = this.getSetting('desktop');

    if ( t.ontop ) {
      if ( t.position == 'top' ) {
        s.top    += 35;
        s.height -= 35;
      } else {
        s.height -= 35;
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

    var t   = this.getSetting('taskbar');
    var b   = borders ? 10 : 0;
    var pos = {x: b, y: b};
    if ( t.ontop ) {
      if ( t.position == 'top' ) {
        if ( t.ontop ) {
          pos.y += 35;
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


  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.CoreWM = CoreWM;

})(OSjs.Core.WindowManager, OSjs.GUI);
