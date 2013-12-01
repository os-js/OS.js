"use strict";
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
  OSjs.Handlers     = OSjs.Handlers     || {};
  OSjs.Settings     = OSjs.Settings     || {};
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Dialogs      = OSjs.Dialogs      || {};
  OSjs.GUI          = OSjs.GUI          || {};

  /////////////////////////////////////////////////////////////////////////////
  // INTERNAL VARIABLES
  /////////////////////////////////////////////////////////////////////////////

  var _INITED   = false;
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
  var _HANDLER;
  var _$LOADING;

  /////////////////////////////////////////////////////////////////////////////
  // RESOURCE HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function getThemeResource(name, type, args) {
    type = type || null;
    args = args || null;

    var theme = (_WM ? _WM.getSetting('theme') : 'default') || 'default';
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
      } else if ( type == 'wm' ) {
        name = '/themes/' + theme + '/wm/' + name;
      } else if ( type == 'base' ) {
        name = '/themes/' + theme + '/' + name;
      }
    }

    return name;
  }

  function getThemeCSS(name) {
    if ( name === null ) {
      return '/frontend/blank.css';
    }
    return '/themes/' + name + '.css';
  }

  function getResourceURL(path) {
    if ( path && path.match(/^\/(themes|frontend|apps)/) ) {
      return path;
    }
    var fsuri = _HANDLER.getConfig('Core').FSURI;
    return path ? (fsuri + path) : fsuri;
  }

  function playSound(name) {
    if ( OSjs.Utils.getCompability().audio ) {
      var f = getThemeResource(name, 'sound');
      console.info("playSound()", name, f);
      var a = new Audio(f);
      a.play();
      return a;
    }
    return false;
  }

  /////////////////////////////////////////////////////////////////////////////
  // DOM HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function getNextZindex(ontop) {
    if ( typeof ontop !== 'undefined' && ontop === true ) {
      return (_LTZINDEX+=2);
    }
    return (_LZINDEX+=2);
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

  /////////////////////////////////////////////////////////////////////////////
  // API HELPERS
  /////////////////////////////////////////////////////////////////////////////

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

    _$LOADING.style.display = 'block';
    return _HANDLER.call(opts, function() {
      _$LOADING.style.display = 'none';
      cok.apply(this, arguments);
    }, function() {
      _$LOADING.style.display = 'none';
      cerror.apply(this, arguments);
    });
  }

  function createErrorDialog(title, message, error, exception, bugreport) {
    bugreport = typeof bugreport == 'undefined' ? false : (bugreport ? true : false);
    playSound('dialog-warning');

    OSjs.GUI.blurMenu();

    if ( _WM ) {
      try {
        var w = new OSjs.Dialogs.ErrorMessage();
        w.setError(title, message, error, exception, bugreport);
        _WM.addWindow(w);

        return w;
      } catch ( e ) {
        console.warn("An error occured while creating error Window", ex);
      }
    }

    alert(title + "\n\n" + message + "\n\n" + error);
    return null;
  }

  function LaunchFile(fname, mime, launchArgs) {
    launchArgs = launchArgs || {};
    if ( !fname ) throw "Cannot LaunchFile() without a filename";
    if ( !mime )  throw "Cannot LaunchFile() without a mime type";

    console.group("LaunchFile()", fname, mime);

    var args = {file: fname, mime: mime};

    if ( launchArgs.args ) {
      for ( var i in launchArgs.args ) {
        if ( launchArgs.args.hasOwnProperty(i) ) {
          args[i] = launchArgs.args[i];
        }
      }
    }

    var app = _HANDLER.getApplicationNameByMime(mime, fname);
    console.info("Found", app.length, "applications supporting this mime");
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
    var _error = function(msg, exception) {
      console.groupEnd(); // !!!
      createErrorDialog('Failed to launch Application', 'An error occured while trying to launch: ' + n, msg, exception, true);

      onError(msg, n, arg);
    };

    var _callback = function(result) {
      if ( typeof OSjs.Applications[n] != 'undefined' ) {
        var singular = (typeof result.singular === 'undefined') ? false : (result.singular === true);
        if ( singular ) {
          if ( _SPROCS[n] ) {
            console.debug("LaunchProcess()", "detected that this application is a singular and already running...");
            if ( _SPROCS[n] === 'Application' ) {
              var proc = _CORE.getProcess(n, true);
              if ( proc ) {
                proc._message('attention');
                return;
              }
            }
            _error("This application is already launched and allows only one instance!");
            return;
          }
        }

        var a = null, err = false;
        try {
          var a = new OSjs.Applications[n](arg, result);
          a.__sname = n;
          if ( singular ) {
            _SPROCS[n] = (a instanceof Service) ? 'Service' : 'Application';
          }

          onConstructed(a);
        } catch ( e ) {
          console.warn("Error on constructing application", e, e.stack);
          _error("Application construct failed: " + e, e);
          err = true;
        }

        if ( err ) {
          if ( a ) {
            try {
              a.destroy();
              a = null;
            } catch ( e ) {
              console.warn("Something awful happened when trying to clean up failed launch Oo", e);
            }
          }
        } else {
          try {
            a.init(_CORE);
            onFinished(a);
          } catch ( e ) {
            _error("Application init() failed: " + e, e);
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

    var data = _HANDLER.getApplicationMetadata(n);
    if ( !data ) {
      _error("Failed to launch -- application manifest not found!");
      return;
    }
    _preload(data);
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

    console.group("Compability");
    console.log(OSjs.Utils.getCompability());
    console.groupEnd();

    // Override error handling
    window.onerror = function(message, url, linenumber, column, exception) {
      var msg = JSON.stringify({message: message, url: url, linenumber: linenumber, column: column}, null, '\t');
      createErrorDialog('JavaScript Error Report', 'An error has been detected :(', msg, exception, true);
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
      ev.preventDefault();
      return false;
    }, false);
    this._$root.addEventListener('mousedown', function(ev) {
      OSjs.GUI.blurMenu();
    }, false);

    document.body.appendChild(this._$root);

    console.groupEnd();
  };
  Main.prototype = Object.create(Process.prototype);

  Main.prototype.init = function() {
    console.log("OSjs::Core::Main::init()");

    var self = this;

    var _error = function(msg) {
      createErrorDialog('Failed to initialize OS.js', 'An error occured while initializing OS.js', msg, null, true);
    };

    var _launchWM = function(callback) {
      var wm = _HANDLER.getConfig('WM');
      if ( !wm || !wm.exec ) {
        _error("No window manager defined!");
        return;
      }

      LaunchProcess(wm.exec, wm.args || {}, function() {
        callback();
      }, function(error) {
        _error("Failed to launch Window Manager: " + error);
      });
    };

    var _preload = function(list, callback) {
      if ( !list || !list.length ) {
        callback();
        return;
      }

      new OSjs.Utils.Preloader({list: list, onFinished: function(total, errors) {
        if ( errors ) {
          _error("Failed to preload resources...");
          return;
        }

        callback();
      }});
    };

    var _loadSession = function() {
      var onSuccess = function(data, a) {
        var w, r;
        for ( var i = 0, l = data.length; i < l; i++ ) {
          r = data[i];
          w = a._getWindow(r.name);
          if ( w ) {
            w._move(r.position.x, r.position.y);
            w._resize(r.dimension.w, r.dimension.h);
            // TODO: State

            console.info('CoreService::loadSession->onSuccess()()', 'Restored window "' + r.name + '" from session');
          }
        }
      };

      var onLoaded = function(session) {
        var s, sargs;
        for ( var i = 0, l = session.length; i < l; i++ ) {
          s = session[i];
          sargs = s.args || {};
          if ( typeof sargs.length !== 'undefined' ) sargs = {};

          OSjs.API.launch(s.name, sargs, (function(data) {
            return function(a) {
              onSuccess(data, a);
            };
          })(session[i].windows), function(err) {
            console.warn("_loadSession() error", err);
          });
        }
      };

      _HANDLER.getUserSession(function(res) {
        if ( res ) {
          onLoaded(res);
        }
      });
    };

    _HANDLER.boot(function() {
      var preloads = _HANDLER.getConfig('Core').Preloads;
      _preload(preloads, function() {
        _launchWM(function(app) {
          _$LOADING.style.display = 'none';
          playSound('service-login');

          _loadSession();
        });
      });
    });
  };

  Main.prototype.shutdown = function(save, onFinished) {
    var self = this;
    var session = null;
    if ( save ) {
      var getSessionSaveData = function(app) {
        var args = app.__args;
        var wins = app.__windows;
        var data = {name: app.__name, args: args, windows: []};

        for ( var i = 0, l = wins.length; i < l; i++ ) {
          data.windows.push({
            name      : wins[i]._name,
            dimension : wins[i]._dimension,
            position  : wins[i]._position,
            state     : wins[i]._state
          });
        }

        return data;
      };

      var data = [];
      for ( var i = 0, l = _PROCS.length; i < l; i++ ) {
        if ( _PROCS[i] && (_PROCS[i] instanceof OSjs.Core.Application) ) {
          data.push(getSessionSaveData(_PROCS[i]));
        }
      }
      session = data;
    }

    _HANDLER.logout(session, function() {
      playSound('service-logout');
      onFinished(self);
    });
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

  Main.prototype.getProcess = function(name, first) {
    var p;
    var result = first ? null : [];
    for ( var i = 0, l = _PROCS.length; i < l; i++ ) {
      p = _PROCS[i];
      if ( !p ) continue;
      if ( p.__pname === name ) {
        if ( first ) {
          result = p;
          break;
        }
        result.push(p);
      }
    }
    return result;
  };

  /////////////////////////////////////////////////////////////////////////////
  // MISC PROCESSES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * WindowManager Process Class
   * The default implementation of this is in apps/CoreWM/main.js
   */
  var WindowManager = function(name, ref, args, metadata) {
    console.group("OSjs::Core::WindowManager::__construct()");

    this._windows     = [];
    this._name        = (name || 'WindowManager');
    this._settings    = {};
    this._themes      = args.themes || [{'default': {title: 'Default'}}];

    Process.apply(this, [this._name]);

    _WM = (ref || this);

    console.groupEnd();
  };

  WindowManager.prototype = Object.create(Process.prototype);

  WindowManager.prototype.destroy = function() {
    console.log("OSjs::Core::WindowManager::destroy()");

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
      console.warn("OSjs::Core::WindowManager::addWindow()", "Got", w);
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
      console.warn("OSjs::Core::WindowManager::removeWindow()", "Got", w);
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
    //console.debug("OSjs::Core::WindowManager::eventWindow", ev, win._name);
  };

  WindowManager.prototype.applySettings = function(settings, force) {
    settings = settings || {};
    console.log("OSjs::Core::WindowManager::applySettings");

    if ( force ) {
      this._settings = settings;
    } else {
      for ( var s in settings ) {
        if ( settings.hasOwnProperty(s) ) {
          this.setSetting(s, settings[s]);
        }
      }
    }

    return true;
  };

  WindowManager.prototype.setSetting = function(k, v) {
    if ( v !== null ) {
      if ( this._settings[k] ) {
        if ( typeof this._settings[k] === 'object' ) {
          if ( typeof v === 'object' ) {
            for ( var i in v ) {
              if ( this._settings[k].hasOwnProperty(i) ) {
                if ( v[i] !== null ) {
                  this._settings[k][i] = v[i];
                }
              }
            }
            return true;
          }
        } else {
          this._settings[k] = v;
          return true;
        }
      }
    }
    return false;
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

  WindowManager.prototype.getSetting = function(k) {
    if ( this._settings[k] ) {
      return this._settings[k];
    }
    return null;
  };

  WindowManager.prototype.getSettings = function() {
    return this._settings;
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

  Application.prototype._message = function(msg, args) {
    if ( msg === 'attention' ) {
      if ( this.__windows.length ) {
        if ( this.__windows[0] ) {
          this.__windows[0]._focus();
          return true;
        }
      }
    }
    return false;
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
    console.info("OSjs::Core::Application::_addWindow()");
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
        console.info("OSjs::Core::Application::_removeWindow()", w._wid);
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
   * TODO: Instead of adding DOM event unload on hooks, just make a wrapper to bind events+destruct
   * TODO: removeGUIElement()
   */
  var Window = function(name, opts, appRef) {
    console.group("OSjs::Core::Window::__construct()");
    this._$element      = null;
    this._$root         = null;
    this._$loading      = null;
    this._$disabled     = null;
    this._appRef        = appRef || null;
    this._destroyed     = false;
    this._wid           = _WID;
    this._icon          = getThemeResource('wm.png', 'wm');
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
    this._disabled      = true;
    this._properties    = {
      gravity           : null,
      allow_move        : true,
      allow_resize      : true,
      allow_minimize    : true,
      allow_maximize    : true,
      allow_close       : true,
      allow_windowlist  : true,
      allow_drop        : false,
      min_width         : _MINIMUM_WINDOW_WIDTH,
      min_height        : _MINIMUM_WINDOW_HEIGHT,
      max_width         : null,
      max_height        : null
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
    console.log('wid',  this._wid);

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
          border.style.top = (main.offsetTop+2) + "px";
          border.style.left = (main.offsetLeft+2) + "px";
          border.style.width = (main.offsetWidth-4) + "px";
          border.style.height = (main.offsetHeight-4) + "px";
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
          onOver: function(ev, el, args) {
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

    var windowDisabled            = document.createElement('div');
    windowDisabled.className      = 'WindowDisabledOverlay';
    //windowDisabled.style.display  = 'none';
    windowDisabled.onmousedown    = function(ev) {
      ev.preventDefault();
      return false;
    };
    this._addHook('destroy', function() {
      windowDisabled.onmousedown = function() {};
    });

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
    main.appendChild(windowDisabled);

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

    this._$element  = main;
    this._$root     = windowWrapper;
    this._$loading  = windowLoading;
    this._$disabled = windowDisabled;

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
    this._toggleDisabled(false);

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
      this._$element.style.display = "none";
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
    var self = this;
    if ( !parentNode ) {
      throw "Adding a GUI Element requires a parentNode";
    }
    if ( gel instanceof OSjs.GUI.GUIElement ) {
      gel.wid = this._wid;

      //console.log("OSjs::Core::Window::_addGUIElement()");
      if ( gel.focusable ) {
        if ( gel.opts.focusable ) {
          this._addHook('blur', function() {
            gel.blur();
          });
        }
      }
      if ( (gel instanceof OSjs.GUI.RichText) ) {
        gel._addHook('focus', function() {
          self._focus();
        });
      }

      this._guiElements.push(gel);
      parentNode.appendChild(gel.getRoot());

      return gel;
    }

    return false;
  };

  Window.prototype._addChild = function(w, wmAdd) {
    console.info("OSjs::Core::Window::_addChild()");
    w._parent = this;
    if ( wmAdd && _WM ) {
      _WM.addWindow(w);
    }
    this._children.push(w);
  };

  Window.prototype._removeChild = function(w) {
    var i = 0, l = this._children.length;
    for ( i; i < l; i++ ) {
      if ( this._children[i] && this._children[i]._wid === w._wid ) {
        console.info("OSjs::Core::Window::_removeChild()");

        this._children[i].destroy();
        this._children[i] = null;
        break;
      }
    }
  };

  Window.prototype._close = function() {
    console.info("OSjs::Core::Window::_close()");
    if ( this._disabled ) return;

    if ( this._$element ) {
      this._$element.className += " WindowHintClosing";
    }

    this._blur();
    this.destroy();
  };

  Window.prototype._minimize = function() {
    console.debug(this._name, '>' , "OSjs::Core::Window::_minimize()");
    if ( !this._properties.allow_minimize ) return false;
    //if ( this._disabled ) return false;
    if ( this._state.minimized ) {
      this._restore(false, true);
      return true;
    }

    this._blur();

    this._state.minimized = true;
    if ( !this._$element.className.match(/WindowHintMinimized/) ) {
      this._$element.className += ' WindowHintMinimized';
    }

    this._$element.style.display = 'none';

    this._onChange('minimize');

    return true;
  };

  Window.prototype._maximize = function() {
    console.debug(this._name, '>' , "OSjs::Core::Window::_maximize()");
    if ( !this._properties.allow_maximize ) return false;
    //if ( this._disabled ) return false;
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
    if ( !this._$element.className.match(/WindowHintMaximized/) ) {
      this._$element.className += ' WindowHintMaximized';
    }

    this._onChange('maximize');

    this._resize();

    this._focus();

    return true;
  };

  Window.prototype._restore = function(max, min) {
    console.debug(this._name, '>' , "OSjs::Core::Window::_restore()");
    //if ( this._disabled ) return ;
    max = (typeof max === 'undefined') ? true : (max === true);
    min = (typeof min === 'undefined') ? true : (min === true);

    var cn = this._$element.className;
    if ( max && this._state.maximized ) {
      this._move(this._lastPosition.x, this._lastPosition.y);
      this._resize(this._lastDimension.w, this._lastDimension.h);
      this._state.maximized = false;
      this._$element.className = cn.replace(/\s?WindowHintMaximized/, '');
    }

    if ( min && this._state.minimized ) {
      this._$element.style.display = 'block';
      this._state.minimized = false;
      this._$element.className = cn.replace(/\s?WindowHintMinimized/, '');
    }

    this._onChange('restore');

    this._focus();
  };

  Window.prototype._focus = function() {
    if ( this._state.focused ) return false;
    console.debug(this._name, '>' , "OSjs::Core::Window::_focus()");

    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.className += ' WindowHintFocused';
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
    console.debug(this._name, '>' , "OSjs::Core::Window::_blur()");
    var cn = this._$element.className;
    this._$element.className = cn.replace(/\s?WindowHintFocused/, '');
    this._state.focused = false;

    this._onChange('blur');
    this._fireHook('blur');

    return true;
  };

  Window.prototype._resize = function(w, h) {
    if ( !this._properties.allow_resize ) return false;

    if ( w < this._properties.min_width ) w = this._properties.min_width;
    if ( this._properties.max_width !== null ) {
      if ( w > this._properties.max_width ) w = this._properties.max_width;
    }

    if ( h < this._properties.min_height ) h = this._properties.min_height;
    if ( this._properties.max_height !== null ) {
      if ( h > this._properties.max_height ) h = this._properties.max_height;
    }
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
    console.info("OSjs::Core::Window::_onDndEvent()", type);
  };

  Window.prototype._onKeyEvent = function(ev) {
  };

  Window.prototype._onWindowIconClick = function(ev, el) {
    console.debug(this._name, '>' , "OSjs::Core::Window::_onWindowIconClick()");
  };

  Window.prototype._onWindowButtonClick = function(ev, el, btn) {
    console.debug(this._name, '>' , "OSjs::Core::Window::_onWindowButtonClick()", btn);

    if ( btn === 'close' ) {
      this._close();
    } else if ( btn === 'minimize' ) {
      this._minimize();
    } else if ( btn === 'maximize' ) {
      this._maximize();
    }
  };

  Window.prototype._onChange = function(ev) {
    console.debug(this._name, '>' , "OSjs::Core::Window::_onChange()");
    if ( _WM ) {
      _WM.eventWindow(ev, this);
    }
  };

  Window.prototype._error = function(title, description, message, exception, bugreport) {
    console.debug(this._name, '>' , "OSjs::Core::Window::_error()");
    var w = createErrorDialog(title, description, message, exception, bugreport);
    this._addChild(w);
  };

  Window.prototype._toggleDisabled = function(t) {
    console.debug(this._name, '>' , "OSjs::Core::Window::_toggleDisabled()", t);
    this._$disabled.style.display = t ? 'block' : 'none';
    this._disabled = t ? true : false;
  };

  Window.prototype._toggleLoading = function(t) {
    console.debug(this._name, '>' , "OSjs::Core::Window::_toggleLoading()", t);
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

  OSjs.API.getHandlerInstance = function()    { return _HANDLER; };
  OSjs.API.getWMInstance      = function()    { return _WM; };
  OSjs.API.getCoreInstance    = function()    { return _CORE; };
  OSjs.API.getDefaultPath     = function(def) { return (_HANDLER.getConfig('Core').Home || (def || '/')); };

  OSjs.API.getThemeCSS      = getThemeCSS;
  OSjs.API.getResourceURL   = getResourceURL;
  OSjs.API.getThemeResource = getThemeResource;
  OSjs.API.call             = APICall;
  OSjs.API.error            = createErrorDialog;
  OSjs.API.launch           = LaunchProcess;
  OSjs.API.open             = LaunchFile;
  OSjs.API.playSound        = playSound;

  var __initialize = function() {
    _$LOADING = document.createElement('img');
    _$LOADING.id = "Loading";
    _$LOADING.src = getThemeResource('loading_small.gif', 'base');
    document.body.appendChild(_$LOADING);

    _CORE = new Main();
    if ( _CORE ) {
      _CORE.init();
    }
  };

  OSjs.initialize = function() {
    if ( _INITED ) return;
    _INITED = true;

    console.log('-- ');
    console.log('-- Launching OS.js v2');
    console.log('-- ');

    window.onload = null;

    // Launch handler
    var hname = OSjs.Settings.DefaultConfig().Handler.name;
    _HANDLER  = new OSjs.Handlers[hname]();

    _HANDLER.init(function() {
      __initialize();
    });
  };

  OSjs.shutdown = function(save, onunload) {
    if ( !_INITED ) return;
    _INITED = false;
    window.onunload = null;

    var _shutdown = function() {
      if ( _CORE ) {
        _CORE.destroy();
        _CORE = null;
      }
    };

    if ( onunload ) {
      _shutdown();
    } else {
      _CORE.shutdown(save, _shutdown);
    }

    document.body.removeChild(_$LOADING);
  };

})();
