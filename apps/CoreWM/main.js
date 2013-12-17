(function(WindowManager, GUI) {

  function DefaultSettings(defaults) {
    var cfg = {
      animations    : true,
      fullscreen    : false,
      taskbar       : {position: 'top', ontop: true},
      desktop       : {margin: 5},
      wallpaper     : '/themes/wallpapers/noise_red.png',
      theme         : 'default',
      background    : 'image-repeat',
      style         : {
        backgroundColor  : '#0B615E',
        color            : '#333',
        fontWeight       : 'normal',
        textDecoration   : 'none',
        fontFamily       : 'OSjsFont',
        backgroundRepeat : 'repeat'
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

  /**
   * Application
   */
  var CoreWM = function(args, metadata) {
    WindowManager.apply(this, ['CoreWM', this, args, metadata]);
    this._settings = DefaultSettings(args.defaults || {});
  };

  CoreWM.prototype = Object.create(WindowManager.prototype);

  CoreWM.prototype.init = function() {
    WindowManager.prototype.init.apply(this, arguments);

    var root = document.createElement('div');
    root.id = 'WindowList';
    root.onclick = function(ev) {
      OSjs.GUI.blurMenu();
    };
    root.oncontextmenu = function(ev) {
      OSjs.GUI.blurMenu();
      return false;
    };

    // Application Menu
    var el = document.createElement('ul');
    var icon = OSjs.API.getThemeResource('categories/applications-other.png', 'icon');
    var sel;
    sel = document.createElement('li');
    sel.innerHTML = '<img alt="" src="' + icon + '" />';
    sel.onclick = function(ev) {
      ev.stopPropagation();

      var apps = OSjs.API.getHandlerInstance().getApplicationsMetadata();
      var list = [];
      for ( var a in apps ) {
        if ( apps.hasOwnProperty(a) ) {
          if ( apps[a].type === "service" || apps[a].type === "special" ) continue;
          list.push({
            title: apps[a].name,
            icon: apps[a].icon,
            onClick: (function(name, iter) {
              return function() {
                OSjs.API.launch(name);
              };
            })(a, apps[a])
          });
        }
      }
      GUI.createMenu(list, {x: ev.clientX, y: ev.clientY});
      return false;
    };
    el.appendChild(sel);

    // Quit button
    icon = OSjs.API.getThemeResource('actions/exit.png', 'icon');
    sel = document.createElement('li');
    sel.innerHTML = '<img alt="" src="' + icon + '" />';
    sel.onclick = function() {
      var user = OSjs.API.getHandlerInstance().getUserData() || {name: 'Unknown'};
      var t = confirm("Logging out user '" + user.name + "'.\nDo you want to save current session?");
      OSjs._shutdown(t, false);
    };
    el.appendChild(sel);

    // Background
    var back = document.createElement('div');
    back.className = 'Background';

    // Append
    root.appendChild(el);
    root.appendChild(back);

    this._$element = el;
    this._$root = root;

    document.body.appendChild(this._$root);

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

  CoreWM.prototype.destroy = function(kill) {
    if ( kill && !confirm("Killing this process will stop things from working!") ) {
      return false;
    }

    // Reset styles
    this.applySettings(DefaultSettings(), true);

    if ( this._$root && this._$root.parentNode ) {
      this._$root.parentNode.removeChild(this._$root);
    }

    return WindowManager.prototype.destroy.apply(this, []);
  };

  CoreWM.prototype.eventWindow = function(ev, win) {
    if ( win && win._properties.allow_windowlist === false ) {
      return;
    }
    //console.log("OSjs::Applications::CoreWM::eventWindow", ev, win._name);

    var cn = 'WindowList_Window_' + win._wid;
    var self = this;
    var _change = function(cn, callback) {
      var els = self._$element.getElementsByClassName(cn);
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
      el.className = 'WindowList_Window_' + win._wid;
      el.onclick = function() {
        win._restore();
      };
      this._$element.appendChild(el);
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
        el.className = el.className.replace(' Focused', '');
      });
    } else if ( ev == 'title' ) {
      _change(cn, function(el) {
        el.getElementsByTagName('span')[0].innerHTML = win._title;
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

    // Wallpaper
    var name = this.getSetting('wallpaper');
    var type = this.getSetting('background');
    console.log("Wallpaper name", name);
    console.log("Wallpaper type", type);
    if ( name && type.match(/^image/) ) {
      var path = OSjs.API.getResourceURL(name);
      document.body.style.backgroundImage = "url('" + path + "')";

      switch ( type ) {
        case 'image' :
          document.body.style.backgroundRepeat    = 'no-repeat';
          document.body.style.backgroundPosition  = '';
        break;

        case 'image-center':
          document.body.style.backgroundRepeat    = 'no-repeat';
          document.body.style.backgroundPosition  = 'center center';
        break;

        case 'image-fill' :
          document.body.style.backgroundRepeat    = 'no-repeat';
          document.body.style.backgroundSize      = 'cover';
          document.body.style.backgroundPosition  = 'center center fixed';
        break;

        case 'image-strech':
          document.body.style.backgroundRepeat    = 'no-repeat';
          document.body.style.backgroundSize      = '100% auto';
          document.body.style.backgroundPosition  = '';
        break;

        default:
          document.body.style.backgroundRepeat    = 'repeat';
          document.body.style.backgroundPosition  = '';
        break;
      }
    } else {
      document.body.style.backgroundImage     = '';
      document.body.style.backgroundRepeat    = 'no-repeat';
      document.body.style.backgroundPosition  = '';
    }

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
      alink.setAttribute('href', OSjs.API.getApplicationResource('CoreWM', 'animations.css')); // FIXME
    } else {
      alink.setAttribute('href', '/frontend/blank.css'); // FIXME
    }

    // Misc
    var classNames = [];
    var opts = this.getSetting('taskbar');
    if ( opts ) {
      if ( opts.ontop ) {
        classNames.push('Ontop');
      }
      classNames.push(opts.position == 'top' ? 'Top' : 'Bottom');
    }

    this._$root.className = classNames.join(' ');

    if ( save ) {
      OSjs.API.getHandlerInstance().setUserSettings('WindowManager', this.getSettings());
    }

    console.groupEnd();
    return true;
  };

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

  CoreWM.prototype.getWindowPosition = function() {
    var pos = WindowManager.prototype.getWindowPosition.apply(this, arguments);
    var t   = this.getSetting('taskbar');

    if ( t.ontop ) {
      if ( t.position == 'top' ) {
        pos.y += 35;
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
