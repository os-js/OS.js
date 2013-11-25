/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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
(function() {

  window.OSjs = window.OSjs || {};
  OSjs.Core         = {};
  OSjs.API          = {};
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Dialogs      = OSjs.Dialogs      || {};
  OSjs.GUI          = OSjs.GUI          || {};

  window.console    = window.console    || {};
  console.log       = console.log       || function() {};
  console.error     = console.error     || console.log;
  console.warn      = console.warn      || console.log;
  console.group     = console.group     || console.log;
  console.groupEnd  = console.groupEnd  || console.log;

  /////////////////////////////////////////////////////////////////////////////
  // INTERNAL VARIABLES
  /////////////////////////////////////////////////////////////////////////////

  var _INITED   = false;
  var _CALLURL  = "/API";
  var _FSURL    = "/FS";
  var _PROCS    = [];
  var _SPROCS   = {};
  var _WID      = 0;
  var _PID      = 0;
  var _LZINDEX  = 1;
  var _LTZINDEX = 100000;

  var _DEFAULT_WINDOW_WIDTH   = 200;
  var _DEFAULT_WINDOW_HEIGHT  = 200;
  var _MINIMUM_WINDOW_WIDTH   = 100;
  var _MINIMUM_WINDOW_HEIGHT  = 50;

  var _WM;
  var _WIN;
  var _CORE;
  var _LOADING;

  var _DEFAULT_SETTINGS = {
    WM : {
      wallpaper   : 'osjs:///themes/wallpapers/noise_red.png',
      themes      : [{'default': {title: 'Default'}}],
      theme       : 'default',
      background  : 'image-repeat',
      style       : {
        backgroundColor  : '#0B615E',
        color            : '#333',
        fontWeight       : 'normal',
        textDecoration   : 'none',
        backgroundRepeat : 'repeat'
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function getThemeResource(name, type, args) {
    type = type || null;
    args = args || null;

    var theme = (_WM ? _WM.getTheme() : 'default') || 'default';
    if ( !name.match(/^\//) ) {
      if ( type == 'icon' ) {
        var size = args || '16x16';
        name = '/themes/' + theme + '/icons/' + size + '/' + name;
      } else if ( type == 'sound' ) {
        var ext = 'oga';
        if ( !OSjs.Utils.getCompability().audioTypes.ogg ) {
          ext = 'mp3';
        }
        name = '/themes/' + theme + '/sounds/' + name + '.' + ext;
      }
    }

    return name;
  }

  function playSound(name) {
    if ( OSjs.Utils.getCompability().audio ) {
      var f = getThemeResource(name, 'sound');
      console.log("playSound()", name, f);
      var a = new Audio(f);
      a.play();
      return a;
    }
    return false;
  }

  function getFilesystemURL(t) {
    if ( t ) {
      return _FSURL + '/' + t; //encodeURIComponent(t);
    }
    return _FSURL;
  }

  function getNextZindex(ontop) {
    if ( typeof ontop !== 'undefined' && ontop === true ) {
      return (_LTZINDEX+=2);
    }
    return (_LZINDEX+=2);
  }

  function getRealPath(path) {
    if ( path.match(/^osjs\:\/\//) ) {
      return path.replace(/^osjs\:\/\//, "");
    } else if ( path.match(/^(https?|ftp)\:\/\//) ) {
      return path;
    }

    return _FSURL + path;
  }

  function stopPropagation(ev) {
    OSjs.GUI.blurMenu();
    ev.stopPropagation();
    return false;
  }

  function _getWindowSpace() {
    return {
      top : 0,
      left : 0,
      width : window.innerWidth,
      height : window.innerHeight
    };
  }

  function getWindowSpace() {
    if ( _WM ) {
      return _WM.getWindowSpace();
    }
    return _getWindowSpace();
  }

  function APICall(m, a, cok, cerror) {
    a = a || {};

    console.group("API Call");
    console.log("Method", m);
    console.log("Arguments", a);
    console.groupEnd();

    var opts = {
      method: 'POST',
      post: {
        'method': m,
        'arguments': a
      }
    };

    return OSjs.Utils.Ajax(_CALLURL, cok, cerror, opts);
  }

  function createErrorDialog(title, message, error) {
    playSound('dialog-warning');

    OSjs.GUI.blurMenu();

    var ex = null;
    if ( _WM ) {
      try {
        var w = new OSjs.Dialogs.ErrorMessage();
        w.setError(title, message, error);
        _WM.addWindow(w);

        return w;
      } catch ( e ) {
        ex = e;
      } // FIXME
    }

    alert(title + "\n\n" + message + "\n\n" + error);
    if ( ex ) {
      throw ex;
    }
    return null;
  }

  function LaunchFile(fname, mime, launchArgs) {
    launchArgs = launchArgs || {};
    if ( !fname ) throw "Cannot LaunchFile() without a filename";
    if ( !mime )  throw "Cannot LaunchFile() without a mime type";

    console.group("LaunchFile()", fname, mime);

    var cs = OSjs.API.getCoreService();
    var app = [];
    var args = {file: fname, mime: mime};

    if ( launchArgs.args ) {
      for ( var i in launchArgs.args ) {
        if ( launchArgs.args.hasOwnProperty(i) ) {
          args[i] = launchArgs.args[i];
        }
      }
    }

    if ( cs ) {
      app = cs.getApplicationNameByMime(mime, fname);
      console.log("Found", app.length, "applications supporting this mime");
      if ( app.length ) {
        var self = this;
        var _launch = function(name) {
          if ( name ) {
            LaunchProcess(name, args, launchArgs.onFinished, launchArgs.onError, launchArgs.onConstructed);
          }
        };

        if ( app.length === 1 ) {
          _launch(app[0]);
        } else {
          if ( _WM ) {
            _WM.addWindow(new OSjs.Dialogs.ApplicationChooser(fname, mime, app, function(btn, appname) {
              if ( btn != 'ok' ) return;
              _launch(appname);
            }));
          } else {
            OSjs.API.error("Error opening file", "Fatal Error", "No window manager is running");
          }
        }
      } else {
        OSjs.API.error("Error opening file", "The file <span>" + fname + "' could not be opened", "Could not find any Applications with support for '" + mime + "'files");
      }
    }

    console.groupEnd();

    return app.length > 0;
  }

  function LaunchProcess(n, arg, onFinished, onError, onConstructed) {
    arg           = arg           || {};
    onFinished    = onFinished    || function() {};
    onError       = onError       || function() {};
    onConstructed = onConstructed || function() {};

    if ( !n ) throw "Cannot LaunchProcess() witout a application name";

    console.group("LaunchProcess()", n, arg);

    var self = this;
    var _error = function(msg) {
      console.groupEnd(); // !!!
      createErrorDialog('Failed to launch Application', 'An error occured while trying to launch: ' + n, msg);

      onError(msg, n, arg);
    };

    var _callback = function(result) {
      if ( typeof OSjs.Applications[n] != 'undefined' ) {
        var singular = (typeof result.singular === 'undefined') ? false : (result.singular === true);
        if ( singular ) {
          if ( _SPROCS[n] ) {
            _error("This application is already launched and allows only one instance!");
            return;
          }
        }

        var a = null, err = false;
        try {
          var a = new OSjs.Applications[n](arg, result);
          a.__sname = n;
          if ( singular ) {
            _SPROCS[n] = true;
          }

          onConstructed(a);
        } catch ( e ) {
          _error("Application construct failed: " + e);
          err = true;
        }

        if ( err ) {
          if ( a ) {
            try {
              a.destroy();
              a = null;
            } catch ( e ) {
              console.warn("Something awful happened when trying to clean up failed launch Oo");
            }
          }
        } else {
          try {
            a.init(_CORE);
            onFinished(a);
          } catch ( e ) {
            _error("Application init() failed: " + e);
          }

          console.groupEnd(); // !!!
        }
      } else {
        _error("Application resource not found!");
      }
    };

    var _preload = function(result) {
      var lst = result.preload;
      new OSjs.Utils.Preloader({list: lst, onFinished: function(total, errors, failed) {
        if ( errors ) {
          _error("Application preloading failed: \n" + failed.join(","));
          return;
        }

        _callback(result);
      }});
    };

    APICall('launch', {application: n, 'arguments': arg}, function(res) {
      _preload(res.result);
    }, function() {
      _error("Failed to launch -- communication error!");
    });

  }

  /////////////////////////////////////////////////////////////////////////////
  // BASE CLASSES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Process Template Class
   */
  var Process = function(name) {
    this.__pid      = _PID;
    this.__pname    = name;
    this.__sname    = name; // Used internall only
    this.__state    = 0;
    this.__started  = new Date();
    this.__index    = -1;

    console.group("OSjs::Core::Process::__construct()");
    console.log("pid",    this.__pid);
    console.log("pname",  this.__pname);
    console.log("started",this.__started);
    console.groupEnd();

    if ( _PID > 0 ) {
      this.__index = _PROCS.push(this) - 1;
    }

    _PID++;
  };

  Process.prototype.destroy = function(kill) {
    kill = (typeof kill === 'undefined') ? true : (kill === true);
    this.__state = -1;
    console.log("OSjs::Core::Process::destroy()", this.__pid, this.__pname);
    if ( kill ) {
      if ( this.__index >= 0 ) {
        _PROCS[this.__index] = null;
      }
    }

    if ( typeof _SPROCS[this.__sname] !== 'undefined' ) {
      delete _SPROCS[this.__sname];
    }

    return true;
  };

  /**
   * Root Process Class
   */
  var Main = function() {
    console.group("OSjs::Core::Main::__construct()");

    Process.apply(this, ['Main']);

    this.__session = {
      applications : [],
      settings     : []
    };

    console.group("Compability");
    console.log(OSjs.Utils.getCompability());
    console.groupEnd();

    // Override error handling
    window.onerror = function(message, url, linenumber) {
      var msg = JSON.stringify({message: message, url: url, linenumber: linenumber}, null, '\t');
      createErrorDialog('JavaScript Error Report', 'An error has been detected :(', msg);
      return false;
    };

    // Events
    var self = this;
    document.addEventListener('keydown', function(ev) {
      self._onKeyDown.apply(self, arguments);
    }, false);
    document.addEventListener('mousedown', function(ev) {
      self._onMouseDown.apply(self, arguments);
    }, false);

    // Background element
    this._$root = document.createElement('div');
    this._$root.id = "Background";
    this._$root.addEventListener('contextmenu', function(ev) {
      return false;
    }, false);
    this._$root.addEventListener('mousedown', function(ev) {
      OSjs.GUI.blurMenu();
    }, false);

    document.body.appendChild(this._$root);

    console.groupEnd();
  };
  Main.prototype = Object.create(Process.prototype);

  Main.prototype.init = function(onContentLoaded, onInitialized) {
    console.log("OSjs::Core::Main::init()");

    var self = this;

    var _finished = function() {
      onContentLoaded(self);
      self.login(onInitialized);
    };

    var _error = function(msg) {
      createErrorDialog('Failed to initialize OS.js', 'An error occured while initializing OS.js', msg);
    };

    var _launchWM = function(wm) {
      if ( !wm.exec ) {
        _error("No window manager defined!");
        return;
      }

      LaunchProcess(wm.exec, wm.args || {}, function() {
        _finished();
      }, function(error) {
        _error("Failed to launch Window Manager: " + error);
      });
    };

    var _launchCoreService = function(wm, settings) {
      LaunchProcess('CoreService', {settings: settings}, function() {
        _launchWM(wm);
      }, function(error) {
        _error("Failed to launch Core Service: " + error);
      });
    };

    var _preload = function(prelist, settings, wm) {
      new OSjs.Utils.Preloader({list: prelist, onFinished: function(total, errors) {
        if ( errors ) {
          _error("Failed to preload resources...");
          return;
        }
        _launchCoreService(wm, settings);
      }});
    };

    APICall('boot', {}, function(res) {
      if ( !res || !res.result || !res.result.preload || !res.result.settings ) {
        alert("Booting failed... probably server error!");
        return;
      }

      _preload(res.result.preload, res.result.settings.Core, res.result.settings.WM);
    }, function(error) {
      _error("Failed to initialize -- " + error);
    });
  };

  Main.prototype.login = function(onFinished) {
    var self = this;

    APICall('login', {username: 'foo', password: 'bar'}, function(res) {
      var settings = res.result.settings || {};

      if ( _WM ) {
        var s = settings.WM[_WM._name];
        if ( s ) {
          _WM.applySettings(s);
        }
      }

      var _finished = function() {
        playSound('service-login');
        onFinished(self);
      };

      var cs = OSjs.API.getCoreService();
      if ( cs ) {
        cs.loadSession(_finished);
      } else {
        _finished();
      }

    }, function(error) {
      createErrorDialog('Failed to login to OS.js', 'An error occured while logging in', error);
    });
  };

  Main.prototype.logout = function(save, onFinished) {
    var self = this;

    var _finished = function() {
      APICall('logout', {}, function() {
        playSound('service-logout');
        onFinished(self);
      }, function(error) {
        createErrorDialog('Failed to log out of OS.js', 'An error occured while logging out', error);
      });
    };

    var cs = OSjs.API.getCoreService();
    if ( cs && save ) {
      cs.saveSession(null, _PROCS, _finished);
    } else {
      _finished();
    }
  };

  Main.prototype.destroy = function() {
    console.log("OSjs::Core::Main::destroy()");
    Process.prototype.destroy.apply(this, []);

    OSjs.GUI.blurMenu();

    var self = this;
    document.removeEventListener('keydown', function(ev) {
      self._onKeyDown.apply(self, arguments);
    }, false);
    document.removeEventListener('mousedown', function(ev) {
      self._onMouseDown.apply(self, arguments);
    }, false);

    if ( this._$root ) {
      this._$root.removeEventListener('contextmenu', function(ev) {
        return false;
      }, false);
      this._$root.removeEventListener('mousedown', function(ev) {
        OSjs.GUI.blurMenu();
      }, false);
    }

    var i = 0;
    var l = _PROCS.length;
    for ( i; i < l; i++ ) {
      if ( !_PROCS[i] ) continue;
      _PROCS[i].destroy(false);
      _PROCS[i] = null;
    }

    if ( this._$root && this._$root.parentNode ) {
      this._$root.parentNode.removeChild(this._$root);
      this._$root = null;
    }

    _PROCS = [];

    window.onerror = function() {};
  };

  Main.prototype.kill = function(pid) {
    if ( pid > 0 ) {
      pid--;
      if ( _PROCS[pid] ) {
        console.warn("Killing application", pid);
        if ( _PROCS[pid].destroy(true) === false ) {
          return;
        }
        _PROCS[pid] = null;
      }
    }
  };

  Main.prototype.ps = function() {
    var lst = [];
    var p;
    for ( var i = 0, l = _PROCS.length; i < l; i++ ) {
      p = _PROCS[i];
      if ( !p ) continue;

      lst.push({
        pid     : p.__pid,
        name    : p.__pname,
        started : p.__started
      });
    }
    return lst;
  };

  Main.prototype._onKeyDown = function(ev) {
    var d = ev.srcElement || ev.target;
    var doPrevent = d.tagName === 'BODY' ? true : false;
    var isHTMLInput = false;
    if ((d.tagName.toUpperCase() === 'INPUT' && (d.type.toUpperCase() === 'TEXT' || d.type.toUpperCase() === 'PASSWORD' || d.type.toUpperCase() === 'FILE')) 
        || d.tagName.toUpperCase() === 'TEXTAREA') {
          isHTMLInput = d.readOnly || d.disabled;
    }

    if ( ev.keyCode === 8 ) {
      if ( isHTMLInput ) {
        doPrevent = true;
      }
    }

    if ( doPrevent ) {
      ev.preventDefault();
    }

    if ( _WIN ) {
      _WIN._onKeyEvent(ev);
    }
  };

  Main.prototype._onMouseDown = function(ev) {
    if ( _WIN ) {
      _WIN._blur();
    }
  };

  Main.prototype.getProcesses = function() {
    return _PROCS;
  };

  Main.prototype.getProcess = function(name) {
    var p;
    for ( var i = 0, l = _PROCS.length; i < l; i++ ) {
      p = _PROCS[i];
      if ( !p ) continue;
      if ( p.__pname === name ) return p;
    }
    return null;
  };

  /////////////////////////////////////////////////////////////////////////////
  // MISC PROCESSES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * WindowManager Process Class
   */
  var WindowManager = function(name, ref, args, metadata) {
    console.group("OSjs::Core::WindowManager::__construct()");

    name = name || 'WindowManager';
    ref = ref || this;
    var dsettings = _DEFAULT_SETTINGS.WM;

    this._windows     = [];
    this._name        = name;
    this._wallpaper   = dsettings.wallpaper;
    this._themes      = args.themes || dsettings.themes;
    this._theme       = dsettings.theme;
    this._background  = dsettings.background;
    this._style       = dsettings.style;

    Process.apply(this, [name]);

    _WM = ref;

    console.groupEnd();

    var self = this;
    window.foo = function() {
      console.log(self._windows);
    };
  };

  WindowManager.prototype = Object.create(Process.prototype);

  WindowManager.prototype.destroy = function() {
    console.log("OSjs::Core::WindowManager::destroy()");

    // Reset styles
    var defaults = _DEFAULT_SETTINGS.WM;
    defaults.theme = null;
    delete defaults.themes;

    this.applySettings();
    this.setWallpaper(defaults.wallpaper, defaults.background);

    // Destroy all windows
    var i = 0;
    var l = this._windows.length;
    for ( i; i < l; i++ ) {
      if ( this._windows[i] !== null ) {
        this._windows[i].destroy();
        this._windows[i] = null;
      }
    }
    this._windows = [];

    _WM = null;

    return Process.prototype.destroy.apply(this, []);
  };

  WindowManager.prototype.init = function() {
    console.log("OSjs::Core::WindowManager::init()");
  };

  WindowManager.prototype.addWindow = function(w, focus) {
    if ( !(w instanceof Window) ) {
      throw ("addWindow() expects a 'Window' class");
    }
    console.log("OSjs::Core::WindowManager::addWindow()");

    w.init(this, w._appRef);
    this._windows.push(w);
    if ( focus === true || (w instanceof DialogWindow) ) {
      w._focus();
    }

    return w;
  };

  WindowManager.prototype.removeWindow = function(w) {
    if ( !(w instanceof Window) ) {
      throw ("removeWindow() expects a 'Window' class");
    }
    console.log("OSjs::Core::WindowManager::removeWindow()");

    var i = 0;
    var l = this._windows.length;
    for ( i; i < l; i++ ) {
      if ( !this._windows[i] ) continue;

      if ( this._windows[i]._wid == w._wid ) {
        if ( !this._windows[i] ) break;
        this._windows[i] = null;
        //this._windows.splice(i, 1);
        return true;
        //break;
      }
    }

    return false;
  };

  WindowManager.prototype.eventWindow = function(ev, win) {
    console.log("OSjs::Core::WindowManager::eventWindow", ev, win._name);
  };

  WindowManager.prototype.applySettings = function(settings) {
    settings = settings || {};
    console.log("OSjs::Core::WindowManager::applySettings", settings);

    var opts        = settings.style      || {};
    var theme       = settings.theme      || this._theme;
    var wallpaper   = settings.wallpaper  || this._wallpaper;
    var background  = settings.background || this._background;

    for ( var x in this._style ) {
      if ( this._style.hasOwnProperty(x) ) {
        if ( !opts[x] ) {
          opts[x] = this._style[x];
        }
      }
    }

    for ( var i in opts ) {
      if ( opts.hasOwnProperty(i) ) {
        document.body.style[i] = opts[i];
      }
    }

    this.setTheme(theme);
    this.setWallpaper(wallpaper, background);

    return true;
  };

  WindowManager.prototype.setWallpaper = function(name, type) {
    console.log("OSjs::Core::WindowManager::setWallpaper", name, type);
    if ( name && type.match(/^image/) ) {
      var path = name.match(/^\/themes\/wallpapers/) ? name : getRealPath(name); // FIXME
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
      this._wallpaper   = name;
      this._background  = type;
    } else {
      document.body.style.backgroundImage     = '';
      document.body.style.backgroundRepeat    = 'no-repeat';
      document.body.style.backgroundPosition  = '';
      this._wallpaper   = null;
      this._background  = 'color';
    }
  };

  WindowManager.prototype.setTheme = function(name) {
    console.log("OSjs::Core::WindowManager::setTheme", name);

    if ( name === null ) {
      document.getElementById("_OSjsTheme").setAttribute('href', '/frontend/blank.css');
    } else {
      var url = '/themes/' + name + '.css';
      document.getElementById("_OSjsTheme").setAttribute('href', url);
    }
    this._theme = name;
  };

  WindowManager.prototype.getWindowSpace = function() {
    return _getWindowSpace();
  };

  WindowManager.prototype.getWindowPosition = (function() {
    var _LNEWX = 0;
    var _LNEWY = 0;

    return function() {
      return {x: _LNEWX+=10, y: _LNEWY+=10};
    };
  })();

  WindowManager.prototype.getSettings = function() {
    return {
      theme:      this._theme,
      wallpaper:  this._wallpaper,
      background: this._background,
      style:      this._style
    };
  };

  WindowManager.prototype.getTheme = function() {
    return this._theme;
  };

  WindowManager.prototype.getThemes = function() {
    return this._themes;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATIONS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Service Class
   */
  var Service = function(name, args) {
    this.__name = name;
    this.__args = args;

    Process.apply(this, [name]);
  };

  Service.prototype = Object.create(Process.prototype);

  Service.prototype.init = function() {
  };

  Service.prototype._call = function(method, args, onSuccess, onError) {
    onSuccess = onSuccess || function() {};
    onError = onError || function() {};
    return APICall('application', {'application': this.__name, 'method': method, 'arguments': args}, onSuccess, onError);
  };

  /**
   * Application Class
   */
  var Application = function(name, args, metadata) {
    console.group("OSjs::Core::Application::__construct()");
    this.__name       = name;
    this.__destroyed  = false;
    this.__running    = true;
    this.__inited     = false;
    this.__windows    = [];
    this.__args       = args || {};

    Process.apply(this, [name]);

    console.log("Name", this.__name);
    console.log("Args", this.__args);
    console.groupEnd();
  };

  Application.prototype = Object.create(Process.prototype);

  Application.prototype.init = function(core) {
    console.log("OSjs::Core::Application::init()", this.__name);

    if ( this.__windows.length ) {
      if ( _WM ) {
        for ( var i = 0, l = this.__windows.length; i < l; i++ ) {
          _WM.addWindow(this.__windows[i]);
        }
        this.__windows[i]._focus();
      }
    }

    this.__inited = true;
  };

  Application.prototype.destroy = function(kill) {
    if ( this.__destroyed ) return;
    this.__destroyed = true;
    console.log("OSjs::Core::Application::destroy()", this.__name);

    var i;
    while ( this.__windows.length ) {
      i = this.__windows.pop();
      if ( i ) {
        i.destroy();
      }
    }

    return Process.prototype.destroy.apply(this, arguments);
  };

  Application.prototype._onMessage = function(obj, msg, args) {
    if ( msg === 'destroyWindow' ) {
      this._removeWindow(obj);
    }
  };

  Application.prototype._call = function(method, args, onSuccess, onError) {
    onSuccess = onSuccess || function() {};
    onError = onError || function(err) {
      err = err || "Unknown error";
      OSjs.API.error("Application API error", "Application " + this.__name + " failed to perform operation '" + method + "'", err);
    };
    return APICall('application', {'application': this.__name, 'method': method, 'arguments': args}, onSuccess, onError);
  };

  Application.prototype._createDialog = function(className, args, parentClass) {
    if ( OSjs.Dialogs[className] ) {

      var w = Object.create(OSjs.Dialogs[className].prototype);
      OSjs.Dialogs[className].apply(w, args);

      if ( parentClass && (parentClass instanceof Window) ) {
        parentClass._addChild(w);
      }

      this._addWindow(w);
      return w;
    }
    return false;
  };

  Application.prototype._addWindow = function(w) {
    if ( !(w instanceof Window) ) throw "Application::_addWindow() expects Window";
    console.log("OSjs::Core::Application::_addWindow()");
    this.__windows.push(w);

    if ( this.__inited ) {
      if ( _WM ) {
        _WM.addWindow(w);
      }
      w._focus();
    }
  };

  Application.prototype._removeWindow = function(w) {
    if ( !(w instanceof Window) ) throw "Application::_removeWindow() expects Window";
    var i = 0;
    var l = this.__windows.length;
    for ( i; i < l; i++ ) {
      if ( this.__windows[i]._wid === w._wid ) {
        console.log("OSjs::Core::Application::_removeWindow()", w._wid);
        this.__windows[i].destroy();
        this.__windows.splice(i, 1);
        break;
      }
    }
  };

  Application.prototype._getWindow = function(name) {
    var i = 0;
    var l = this.__windows.length;
    for ( i; i < l; i++ ) {
      if ( this.__windows[i]._name === name ) {
        return this.__windows[i];
        break;
      }
    }
    return null;
  };

  Application.prototype._getArgument = function(k) {
    return this.__args[k] || null;
  };

  Application.prototype._setArgument = function(k, v) {
    this.__args[k] = v;
  };

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Window Class
   */
  var Window = function(name, opts, appRef) {
    console.group("OSjs::Core::Window::__construct()");
    this._$element      = null;
    this._$root         = null;
    this._$loading      = null;
    this._appRef        = appRef || null;
    this._destroyed     = false;
    this._wid           = _WID;
    this._icon          = "/themes/default/wm/wm.png";
    this._name          = name;
    this._title         = name;
    this._position      = {x:opts.x, y:opts.y};
    this._dimension     = {w:opts.width||_DEFAULT_WINDOW_WIDTH, h:opts.height||_DEFAULT_WINDOW_HEIGHT};
    this._lastDimension = this._dimension;
    this._lastPosition  = this._position;
    this._tmpPosition   = null;
    this._children      = [];
    this._parent        = null;
    this._guiElements   = [];
    this._properties    = {
      gravity           : null,
      allow_move        : true,
      allow_resize      : true,
      allow_minimize    : true,
      allow_maximize    : true,
      allow_close       : true,
      allow_windowlist  : true,
      allow_drop        : false
    };
    this._state     = {
      focused   : false,
      modal     : false,
      minimized : false,
      maximized : false,
      ontop     : false,
      onbottom  : false
    };
    this._hooks     = {
      focus   : [],
      blur    : [],
      destroy : []
    };

    if ( (typeof this._position.x === 'undefined') || (typeof this._position.y === 'undefined') ) {
      var np = _WM ? _WM.getWindowPosition() : {x:0, y:0};
      this._position.x = np.x;
      this._position.y = np.y;
    }

    console.log('name', this._name);
    console.log('wid', this._wid);

    _WID++;

    console.groupEnd();
  };

  Window.prototype.init = function(_wm) {
    var self = this;
    console.log("OSjs::Core::Window::init()");

    this._state.focused = false;

    this._icon = getThemeResource(this._icon, 'icon');

    var grav = this._properties.gravity;
    if ( grav ) {
      if ( grav === 'center' ) {
        this._position.y = (window.innerHeight / 2) - (this._dimension.h / 2);
        this._position.x = (window.innerWidth / 2) - (this._dimension.w / 2);
      } else {
        var space = getWindowSpace();
        if ( grav.match(/^south/) ) {
          this._position.y = space.height - this._dimension.h;
        } else {
          this._position.y = space.top;
        }
        if ( grav.match(/west$/) ) {
          this._position.x = space.left;
        } else {
          this._position.x = space.width - this._dimension.w;
        }
      }
    }

    var main            = document.createElement('div');
    main.className      = 'Window';
    main.oncontextmenu  = function(ev) {
      OSjs.GUI.blurMenu();
      if ( ev.target && (ev.target.tagName === 'TEXTAREA' || ev.target.tagName === 'INPUT') ) {
        return true;
      }
      return false;
    };
    this._addHook('destroy', function() {
      main.oncontextmenu = function() {};
    });

    if ( this._properties.allow_drop ) {
      var cpb = OSjs.Utils.getCompability();
      if ( cpb.dnd ) {
        var border = document.createElement('div');
        border.className = 'WindowDropRect';

        var _showBorder = function() {
          if ( !border.parentNode ) { document.body.appendChild(border); }
          border.style.top = main.offsetTop + "px";
          border.style.left = main.offsetLeft + "px";
          border.style.width = main.offsetWidth + "px";
          border.style.height = main.offsetHeight + "px";
          border.style.zIndex = main.style.zIndex-1;
          border.style.display = 'block';

          if ( !main.className.match('WindowHintDnD') ) {
            main.className += ' WindowHintDnD';
          }
        };
        var _hideBorder = function() {
          border.style.top = 0 + "px";
          border.style.left = 0 + "px";
          border.style.width = 0 + "px";
          border.style.height = 0 + "px";
          border.style.display = 'none';

          if ( border.parentNode ) { border.parentNode.removeChild(border); }
          if ( main.className.match('WindowHintDnD') ) {
            main.className = main.className.replace(' WindowHintDnD', '');
          }
        };

        OSjs.GUI.createDroppable(main, {
          onOver: function() {
            _showBorder();
          },

          onLeave : function() {
            _hideBorder();
          },

          onDrop : function() {
            _hideBorder();
          },

          onItemDropped: function(ev, el, item, args) {
            _hideBorder();
            return self._onDndEvent(ev, 'itemDrop', item, args);
          },
          onFilesDropped: function(ev, el, files, args) {
            _hideBorder();
            return self._onDndEvent(ev, 'filesDrop', files, args);
          }
        });
      }
    }

    var windowTop           = document.createElement('div');
    windowTop.className     = 'WindowTop';

    var windowIcon        = document.createElement('div');
    windowIcon.className  = 'WindowIcon';

    var windowIconImage         = document.createElement('img');
    windowIconImage.alt         = this._title;
    windowIconImage.src         = this._icon;
    windowIconImage.width       = 16;
    windowIconImage.height      = 16;
    windowIconImage.onclick     = function(ev) {
      self._onWindowIconClick(ev, this);
    };
    this._addHook('destroy', function() {
      windowIconImage.onclick = function() {};
    });

    var windowTitle       = document.createElement('div');
    windowTitle.className = 'WindowTitle';
    windowTitle.innerHTML = this._title;

    var windowButtons       = document.createElement('div');
    windowButtons.className = 'WindowButtons';
    windowButtons.onmousedown = function(ev) {
      ev.preventDefault();
      return stopPropagation(ev);
    };
    this._addHook('destroy', function() {
      windowButtons.onmousedown = function() {};
    });

    var buttonMinimize        = document.createElement('div');
    buttonMinimize.className  = 'WindowButton WindowButtonMinimize';
    buttonMinimize.innerHTML  = "&nbsp;";
    buttonMinimize.onclick = function(ev) {
      ev.stopPropagation();
      self._onWindowButtonClick(ev, this, 'minimize');
      return false;
    };
    this._addHook('destroy', function() {
      buttonMinimize.onclick = function() {};
    });
    if ( !this._properties.allow_minimize ) {
      buttonMinimize.style.display = 'none';
    }

    var buttonMaximize        = document.createElement('div');
    buttonMaximize.className  = 'WindowButton WindowButtonMaximize';
    buttonMaximize.innerHTML  = "&nbsp;";
    buttonMaximize.onclick = function(ev) {
      ev.stopPropagation();
      self._onWindowButtonClick(ev, this, 'maximize');
      return false;
    };
    this._addHook('destroy', function() {
      buttonMaximize.onclick = function() {};
    });
    if ( !this._properties.allow_maximize ) {
      buttonMaximize.style.display = 'none';
    }

    var buttonClose       = document.createElement('div');
    buttonClose.className = 'WindowButton WindowButtonClose';
    buttonClose.innerHTML = "&nbsp;";
    buttonClose.onclick = function(ev) {
      ev.stopPropagation();
      self._onWindowButtonClick(ev, this, 'close');
      return false;
    };
    this._addHook('destroy', function() {
      buttonClose.onclick = function() {};
    });

    if ( !this._properties.allow_close ) {
      buttonClose.style.display = 'none';
    }

    var windowWrapper       = document.createElement('div');
    windowWrapper.className = 'WindowWrapper';

    var windowResize        = document.createElement('div');
    windowResize.className  = 'WindowResize';
    if ( !this._properties.allow_resize ) {
      windowResize.style.display = 'none';
    }

    var windowLoading       = document.createElement('div');
    windowLoading.className = 'WindowLoading';
    windowLoading.onclick = function(ev) {
      ev.preventDefault();
      return false;
    };
    this._addHook('destroy', function() {
      windowLoading.onclick = function() {};
    });

    var windowLoadingImage        = document.createElement('div');
    windowLoadingImage.className  = 'WindowLoadingIndicator';

    main.className    = 'Window Window_' + this._name.replace(/[^a-zA-Z0-9]/g, '_');
    main.style.width  = this._dimension.w + "px";
    main.style.height = this._dimension.h + "px";
    main.style.top    = this._position.y + "px";
    main.style.left   = this._position.x + "px";
    main.style.zIndex = getNextZindex(this._state.ontop);

    windowIcon.appendChild(windowIconImage);

    windowButtons.appendChild(buttonMinimize);
    windowButtons.appendChild(buttonMaximize);
    windowButtons.appendChild(buttonClose);

    windowTop.appendChild(windowIcon);
    windowTop.appendChild(windowTitle);
    windowTop.appendChild(windowButtons);

    windowLoading.appendChild(windowLoadingImage);

    main.appendChild(windowTop);
    main.appendChild(windowWrapper);
    main.appendChild(windowResize);
    main.appendChild(windowLoading);

    var sx = 0;
    var sy = 0;
    var px = 0;
    var py = 0;
    var action = null;

    var onMouseDown = function(ev, a) {
      ev.preventDefault();

      if ( a === 'move' ) {
        px = self._position.x;
        py = self._position.y;
      } else {
        px = self._dimension.w;
        py = self._dimension.h;
      }

      sx = ev.clientX;
      sy = ev.clientY;
      action = a;

      document.addEventListener('mousemove', onMouseMove, false);
      document.addEventListener('mouseup', onMouseUp, false);

      return false;
    };
    var onMouseUp = function(ev) {
      if ( _WM ) {
        if ( action === 'move' ) {
          self._onChange('move');
        } else if ( action === 'resize' ) {
          self._onChange('resize');
        }
      }
      document.removeEventListener('mousemove', onMouseMove, false);
      document.removeEventListener('mouseup', onMouseUp, false);
      action = null;
      sx = 0;
      sy = 0;
    };
    var onMouseMove = function(ev) {
      if ( action === null ) return;
      var dx = ev.clientX - sx;
      var dy = ev.clientY - sy;
      var rx = px + dx;
      var ry = py + dy;

      if ( action === 'move' ) {
        //if ( rx < 1 ) rx = 1;
        if ( ry < 1 ) ry = 1;
        //if ( rx > (window.innerWidth-1) ) rx = (window.innerWidth - 1);
        //if ( ry > (window.innerHeight-1) ) ry = (window.innerHeight - 1);

        self._move(rx, ry);
      } else {
        if ( rx < _MINIMUM_WINDOW_WIDTH ) rx = _MINIMUM_WINDOW_WIDTH;
        if ( ry < _MINIMUM_WINDOW_HEIGHT ) ry = _MINIMUM_WINDOW_HEIGHT;

        self._resize(rx, ry);
      }
    };

    if ( this._properties.allow_move ) {
      windowTop.addEventListener('mousedown', function(ev) {
        onMouseDown(ev, 'move');
      }, false);

      this._addHook('destroy', function() {
        windowTop.removeEventListener('mousedown', function(ev) {
          onMouseDown(ev, 'move');
        }, false);
      });
    }
    if ( this._properties.allow_resize ) {
      windowResize.addEventListener('mousedown', function(ev) {
        onMouseDown(ev, 'resize');
      }, false);

      this._addHook('destroy', function() {
        windowResize.removeEventListener('mousedown', function(ev) {
          onMouseDown(ev, 'resize');
        }, false);
      });
    }

    main.addEventListener('mousedown', function(ev) {
      self._focus();
      return stopPropagation(ev);
    });
    this._addHook('destroy', function() {
      main.removeEventListener('mousedown', function(ev) {
        self._focus();
        return stopPropagation(ev);
      });
    });

    this._$element = main;
    this._$root    = windowWrapper;
    this._$loading = windowLoading;

    document.body.appendChild(this._$element);
    var buttonsWidth = 0;

    if ( this._properties.allow_maximize ) {
      buttonsWidth += buttonMaximize.offsetWidth;
    }
    if ( this._properties.allow_minimize ) {
      buttonsWidth += buttonMinimize.offsetWidth;
    }
    if ( this._properties.allow_close ) {
      buttonsWidth += buttonClose.offsetWidth;
    }
    windowTitle.style.marginRight = buttonsWidth + 'px';

    this._onChange('create');
    this._toggleLoading(false);

    return this._$root;
  };

  Window.prototype.destroy = function() {
    var self = this;
    if ( this._destroyed ) return;
    this._destroyed = true;
    console.log("OSjs::Core::Window::destroy()");

    this._onChange('close');

    this._fireHook('destroy');

    // Children
    if ( this._appRef ) {
      this._appRef._onMessage(this, 'destroyWindow', {});
    }

    if ( this._parent ) {
      this._parent._removeChild(this);
    }
    this._parent = null;

    if ( this._guiElements && this._guiElements.length ) {
      for ( var e = 0, s = this._guiElements.length; e < s; e++ ) {
        if ( this._guiElements[e] ) {
          this._guiElements[e].destroy();
          this._guiElements[e] = null;
        }
      }
    }
    this._guiElements = [];

    if ( this._children && this._children.length ) {
      var i = 0, l = this._children.length;
      for ( i; i < l; i++ ) {
        if ( this._children[i] ) {
          this._children[i].destroy();
        }
      }
    }
    this._children = [];

    // Instance
    if ( _WM ) {
      _WM.removeWindow(this);
    }

    if ( this._$element ) {
      if ( this._$element.parentNode ) {
        this._$element.parentNode.removeChild(this._$element);
      }
    }

    this._appRef = null;
    this._hooks = {};
  };

  Window.prototype._addHook = function(k, func) {
    if ( typeof func === 'function' && this._hooks[k] ) {
      this._hooks[k].push(func);
    }
  };

  Window.prototype._fireHook = function(k, args) {
    args = args || {};
    if ( this._hooks[k] ) {
      for ( var i = 0, l = this._hooks[k].length; i < l; i++ ) {
        if ( !this._hooks[k][i] ) continue;
        try {
          this._hooks[k][i].apply(this, args);
        } catch ( e ) {
          console.warn("Window::_fireHook() failed to run hook", k, i, e);
          //console.log(e, e.prototype);
          //throw e;
        }
      }
    }
  };

  Window.prototype._addGUIElement = function(gel, parentNode) {
    if ( !parentNode ) {
      throw "Adding a GUI Element requires a parentNode";
    }
    if ( gel instanceof OSjs.GUI.GUIElement ) {
      console.log("OSjs::Core::Window::_addGUIElement()");
      if ( gel.focusable ) {
        if ( gel.opts.focusable ) {
          this._addHook('blur', function() {
            gel.blur();
          });
        }
      }

      this._guiElements.push(gel);
      if ( parentNode ) {
        parentNode.appendChild(gel.getRoot());
      }

      return gel;
    }

    return false;
  };

  Window.prototype._addChild = function(w) {
    console.log("OSjs::Core::Window::_addChild()");
    w._parent = this;
    this._children.push(w);
  };

  Window.prototype._removeChild = function(w) {
    var i = 0, l = this._children.length;
    for ( i; i < l; i++ ) {
      if ( this._children[i] && this._children[i]._wid === w._wid ) {
        console.log("OSjs::Core::Window::_removeChild()");

        this._children[i].destroy();
        this._children[i] = null;
        break;
      }
    }
  };

  Window.prototype._close = function() {
    console.log("OSjs::Core::Window::_close()");

    this.destroy();
  };

  Window.prototype._minimize = function() {
    console.log("OSjs::Core::Window::_minimize()");
    if ( !this._properties.allow_minimize ) return false;
    if ( this._state.minimized ) {
      this._restore(false, true);
      return true;
    }

    this._blur();

    this._state.minimized = true;
    this._$element.style.display = 'none';

    this._onChange('minimize');

    return true;
  };

  Window.prototype._maximize = function() {
    console.log("OSjs::Core::Window::_maximize()");
    if ( !this._properties.allow_maximize ) return false;
    if ( this._state.maximized ) {
      this._restore(true, false);
      return true;
    }
    this._lastPosition = this._position;
    this._lastDimension = this._dimension;
    this._state.maximized = true;

    var s = getWindowSpace();
    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.style.top = s.top + "px";
    this._$element.style.left = s.left + "px";
    this._$element.style.width = s.width + "px";
    this._$element.style.height = s.height + "px";

    this._onChange('maximize');

    this._resize();

    this._focus();

    return true;
  };

  Window.prototype._restore = function(max, min) {
    console.log("OSjs::Core::Window::_restore()");
    max = (typeof max === 'undefined') ? true : (max === true);
    min = (typeof min === 'undefined') ? true : (min === true);

    if ( max && this._state.maximized ) {
      this._move(this._lastPosition.x, this._lastPosition.y);
      this._resize(this._lastDimension.w, this._lastDimension.h);
      this._state.maximized = false;
    }

    if ( min && this._state.minimized ) {
      this._$element.style.display = 'block';
      this._state.minimized = false;
    }

    this._onChange('restore');

    this._focus();
  };

  Window.prototype._focus = function() {
    if ( this._state.focused ) return false;
    console.log("OSjs::Core::Window::_focus()");

    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.className = 'Window WindowHintFocused Window_' + this._name.replace(/[^a-zA-Z0-9]/g, '_');
    this._state.focused = true;

    if ( _WIN && _WIN._wid != this._wid ) {
      _WIN._blur();
    }
    _WIN = this;

    this._onChange('focus');
    this._fireHook('focus');

    return true;
  };

  Window.prototype._blur = function() {
    if ( !this._state.focused ) return false;
    console.log("OSjs::Core::Window::_blur()");
    this._$element.className = 'Window Window_' + this._name.replace(/[^a-zA-Z0-9]/g, '_');
    this._state.focused = false;

    this._onChange('blur');
    this._fireHook('blur');

    return true;
  };

  Window.prototype._resize = function(w, h) {
    if ( !this._properties.allow_resize ) return false;
    //if ( typeof w === 'undefined' || typeof h === 'undefined' ) return false;

    if ( w ) {
      this._$element.style.width = w + "px";
      this._dimension.w = w;
    }

    if ( h ) {
      this._$element.style.height = h + "px";
      this._dimension.h = h;
    }
    return true;
  };

  Window.prototype._move = function(x, y) {
    if ( !this._properties.allow_move ) return false;
    this._$element.style.top = y + "px";
    this._$element.style.left = x + "px";
    this._position.x = x;
    this._position.y = y;
    return true;
  };

  Window.prototype._onDndEvent = function(ev, type) {
    console.log("OSjs::Core::Window::_onDndEvent()", type);
  };

  Window.prototype._onKeyEvent = function(ev) {
  };

  Window.prototype._onWindowIconClick = function(ev, el) {
    console.log("OSjs::Core::Window::_onWindowIconClick()");
  };

  Window.prototype._onWindowButtonClick = function(ev, el, btn) {
    console.log("OSjs::Core::Window::_onWindowButtonClick()", btn);

    if ( btn === 'close' ) {
      this._close();
    } else if ( btn === 'minimize' ) {
      this._minimize();
    } else if ( btn === 'maximize' ) {
      this._maximize();
    }
  };

  Window.prototype._onChange = function(ev) {
    console.log("OSjs::Core::Window::_onChange()");
    if ( _WM ) {
      _WM.eventWindow(ev, this);
    }
  };

  Window.prototype._error = function(title, description, message) {
    var w = createErrorDialog(title, description, message);
    this._addChild(w);
  };

  Window.prototype._toggleLoading = function(t) {
    this._$loading.style.display = t ? 'block' : 'none';
  };

  Window.prototype._getRoot = function() {
    return this._$root;
  };

  Window.prototype._getGUIElement = function(n) {
    for ( var i = 0, l = this._guiElements.length; i < l; i++ ) {
      if ( this._guiElements[i] && this._guiElements[i].name === n ) {
        return this._guiElements[i];
      }
    }
    return null;
  };

  Window.prototype._setTitle = function(t) {
    var tel = this._$element.getElementsByClassName('WindowTitle')[0];
    if ( tel ) {
      tel.innerHTML = t;
    }
    this._title = t;
    this._onChange('title');
  };

  /**
   * Dialog Window
   */
  var DialogWindow = function(/* See Window */) {
    Window.apply(this, arguments);

    this._properties.gravity          = 'center';
    this._properties.allow_resize     = false;
    this._properties.allow_minimize   = false;
    this._properties.allow_maximize   = false;
    this._properties.allow_windowlist = false;
    this._state.ontop                 = true;
  };

  DialogWindow.prototype = Object.create(Window.prototype);

  DialogWindow.prototype.init = function() {
    return Window.prototype.init.apply(this, arguments);
  };

  //
  // EXPORTS
  //
  OSjs.Core.Process       = Process;
  OSjs.Core.Application   = Application;
  OSjs.Core.Service       = Service;
  OSjs.Core.Window        = Window;
  OSjs.Core.DialogWindow  = DialogWindow;
  OSjs.Core.WindowManager = WindowManager;

  OSjs.API.getWMInstance    = function() { return _WM; };
  OSjs.API.getCoreInstance  = function() { return _CORE; };
  OSjs.API.getCoreService   = function() { return _CORE.getProcess('CoreService'); };
  OSjs.API.getConfig        = function(key) { var cs = OSjs.API.getCoreService(); if ( cs ) { return cs.getConfig(key); } return null; };
  OSjs.API.getDefaultPath   = function(def) { def = def || '/'; var cs = OSjs.API.getCoreService(); if ( cs ) { return cs.getConfig('Home') || def; } return def; };
  OSjs.API.getCallURL       = function() { return _CALLURL; };
  OSjs.API.getFilesystemURL = getFilesystemURL;
  OSjs.API.getThemeResource = getThemeResource;
  OSjs.API.call             = APICall;
  OSjs.API.error            = createErrorDialog;
  OSjs.API.launch           = LaunchProcess;
  OSjs.API.open             = LaunchFile;
  OSjs.API.playSound        = playSound;

  OSjs.initialize = function(onContentLoaded, onInitialized) {
    if ( _INITED ) return;
    _INITED = true;

    console.log('-- ');
    console.log('-- Launching OS.js v2');
    console.log('-- ');

    window.onload = null;

    _CORE = new Main();
    if ( _CORE ) {
      _CORE.init(onContentLoaded, onInitialized);
    }
  };

  OSjs.shutdown = function(save, onunload) {
    if ( !_INITED ) return;
    _INITED = false;
    window.onunload = null;

    var _shutdown = function() {
      if ( _CORE ) {
        _CORE.destroy();
        _CORE = null;
        //document.body.innerHTML = '';
      }
    };

    if ( onunload ) {
      _shutdown();
    } else {
      _CORE.logout(save, _shutdown);
    }
  };
})();
