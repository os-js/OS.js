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

  window.OSjs       = window.OSjs       || {};
  OSjs.Compability  = OSjs.Compability  || {};
  OSjs.Helpers      = OSjs.Helpers      || {};
  OSjs.Handlers     = OSjs.Handlers     || {};
  OSjs.Settings     = OSjs.Settings     || {};
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Dialogs      = OSjs.Dialogs      || {};
  OSjs.GUI          = OSjs.GUI          || {};
  OSjs.Locale       = OSjs.Locale       || {};
  OSjs.Core         = {};
  OSjs.API          = {};
  OSjs.Version      = '2.0-alpha1';

  /////////////////////////////////////////////////////////////////////////////
  // INTERNAL VARIABLES
  /////////////////////////////////////////////////////////////////////////////

  var _PROCS = [];        // Running processes
  var _WM;                // Running Window Manager process
  var _WIN;               // Currently selected Window
  var _CORE;              // Running Core process
  var _HANDLER;           // Running Handler process
  var _$LOADING;          // Loading DOM Element
  var _MOUSELOCK = true;  // Mouse inside view ?!

  var ANIMDURATION = 300; // Animation duration constant

  /////////////////////////////////////////////////////////////////////////////
  // DOM HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get next z-index for Window
   * @return integer
   */
  var getNextZindex = (function() {
    var _lzindex  = 1;
    var _ltzindex = 100000;

    return function(ontop) {
      if ( typeof ontop !== 'undefined' && ontop === true ) {
        return (_ltzindex+=2);
      }
      return (_lzindex+=2);
    };
  })();

  /**
   * Wrapper for stopPropagation()
   * @return boolean
   */
  function stopPropagation(ev) {
    OSjs.GUI.blurMenu();
    ev.stopPropagation();
    return false;
  }

  /**
   * Get viewport
   * @return Object
   */
  function _getWindowSpace() {
    return {
      top    : 0,
      left   : 0,
      width  : window.innerWidth,
      height : window.innerHeight
    };
  }

  /**
   * Get viewport (Wrapper)
   * @return Object
   */
  function getWindowSpace() {
    if ( _WM ) {
      return _WM.getWindowSpace();
    }
    return _getWindowSpace();
  }

  /////////////////////////////////////////////////////////////////////////////
  // API HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Global function for calling API (backend)
   *
   * @param   String    m       Method name
   * @param   Object    a       Method arguments
   * @param   Function  cok     Callback on success
   * @param   Function  cerror  Callback on error
   * @return  void
   */
  function APICall(m, a, cok, cerror) {
    _$LOADING.style.display = 'block';
    return _HANDLER.callAPI(m, a, function() {
      _$LOADING.style.display = 'none';
      cok.apply(this, arguments);
    }, function() {
      _$LOADING.style.display = 'none';
      cerror.apply(this, arguments);
    });
  }

  /**
   * Global function for showing an error dialog
   *
   * @param   String    title       Dialog title
   * @param   String    message     Dialog message
   * @param   String    error       Error message
   * @param   Object    exception   Exception reference (optional)
   * @param   boolean   bugreport   Enable bugreporting for this error (default=fale)
   * @return  null
   */
  function ErrorDialog(title, message, error, exception, bugreport) {
    if ( _HANDLER.getConfig('Core').BugReporting ) {
      bugreport = typeof bugreport == 'undefined' ? false : (bugreport ? true : false);
    } else {
      bugreport = false;
    }

    OSjs.GUI.blurMenu();

    if ( _WM ) {
      try {
        var w = new OSjs.Dialogs.ErrorMessage();
        w.setError(title, message, error, exception, bugreport);
        _WM.addWindow(w);

        return w;
      } catch ( e ) {
        console.warn("An error occured while creating Dialogs.ErrorMessage", e);
        console.warn('stack', e.stack);
      }
    }

    alert(title + "\n\n" + message + "\n\n" + error);
    return null;
  }

  /**
   * Open a file
   *
   * @param   String          fname         Full path to file
   * @param   String          mime          File MIME type
   * @param   Object          launchArgs    Arguments to send to process launch function
   * @see     LaunchProcess
   * @return  void
   */
  function LaunchFile(fname, mime, launchArgs) {
    launchArgs = launchArgs || {};
    if ( !fname ) { throw "Cannot LaunchFile() without a filename"; }
    if ( !mime )  { throw "Cannot LaunchFile() without a mime type"; }


    var args = {file: fname, mime: mime};

    if ( launchArgs.args ) {
      for ( var i in launchArgs.args ) {
        if ( launchArgs.args.hasOwnProperty(i) ) {
          args[i] = launchArgs.args[i];
        }
      }
    }

    console.group("LaunchFile()");
    console.log("Filename", fname);
    console.log("MIME", mime);

    var _onDone = function(app) {
      console.info("Found", app.length, "applications supporting this mime");
      console.groupEnd();
      if ( app.length ) {
        var _launch = function(name) {
          if ( name ) {
            LaunchProcess(name, args, launchArgs.onFinished, launchArgs.onError, launchArgs.onConstructed);
          }
        };

        if ( app.length === 1 ) {
          _launch(app[0]);
        } else {
          if ( _WM ) {
            _WM.addWindow(new OSjs.Dialogs.ApplicationChooser(fname, mime, app, function(btn, appname, setDefault) {
              if ( btn != 'ok' ) { return; }
              _launch(appname);

              _HANDLER.setDefaultApplication(mime, setDefault ? appname : null);
            }));
          } else {
            OSjs.API.error(OSjs._("Error opening file"),
                           OSjs._("The file '<span>{0}</span>' could not be opened", fname),
                           OSjs._("No window manager is running") );
          }
        }
      } else {
        OSjs.API.error(OSjs._("Error opening file"),
                       OSjs._("The file '<span>{0}</span>' could not be opened", fname),
                       OSjs._("Could not find any Applications with support for '{0}' files", mime) );
      }
    };

    _HANDLER.getApplicationNameByMime(mime, fname, launchArgs.forceList, _onDone);
  }

  /**
   * Launch a Process
   *
   * @param   String      n               Application Name
   * @param   Object      arg             Launch arguments
   * @param   Function    onFinished      Callback on success
   * @param   Function    onError         Callback on error
   * @param   Function    onConstructed   Callback on application init
   * @return  void
   */
  function LaunchProcess(n, arg, onFinished, onError, onConstructed) {
    arg           = arg           || {};
    onFinished    = onFinished    || function() {};
    onError       = onError       || function() {};
    onConstructed = onConstructed || function() {};

    if ( !n ) { throw "Cannot LaunchProcess() witout a application name"; }

    console.group("LaunchProcess()", n, arg);

    var self = this;
    var splash = null;
    var splashBar = null;

    var _updateSplash = function(p, c) {
      if ( !splash || !splashBar ) { return; }
      var per = c ? 0 : 100;
      if ( c ) {
        per = (p / c) * 100;
      }
      splashBar.setProgress(per);
    };

    var _createSplash = function(data) {
      _$LOADING.style.display = 'block';

      if ( !data.splash ) { return; }

      splash = document.createElement('div');
      splash.className = 'ProcessSplash';

      var icon = document.createElement('img');
      icon.alt = n;
      icon.src = OSjs.API.getIcon(data.icon, data);

      var titleText = document.createElement('b');
      titleText.appendChild(document.createTextNode(data.name));

      var title = document.createElement('span');
      title.appendChild(document.createTextNode('Launching'));
      title.appendChild(titleText);
      title.appendChild(document.createTextNode('...'));

      splashBar = new OSjs.GUI.ProgressBar('ApplicationSplash' + n);

      splash.appendChild(icon);
      splash.appendChild(title);
      splash.appendChild(splashBar.getRoot());

      document.body.appendChild(splash);
    };

    var _removeSplash = function() {
      if ( splashBar ) {
        splashBar.destroy();
        splashBar = null;
      }

      if ( splash ) {
        if ( splash.parentNode ) {
          splash.parentNode.removeChild(splash);
        }
        splash = null;
      }
    };

    var _error = function(msg, exception) {
      _removeSplash();
      console.groupEnd(); // !!!
      ErrorDialog(OSjs._('Failed to launch Application'),
                  OSjs._('An error occured while trying to launch: {0}', n),
                  msg, exception, true);

      onError(msg, n, arg);
    };

    var _callback = function(result) {
      _removeSplash();

      if ( typeof OSjs.Applications[n] != 'undefined' ) {
        var singular = (typeof result.singular === 'undefined') ? false : (result.singular === true);
        if ( singular ) {
          var sproc = _CORE.getProcess(n, true);
          if ( sproc ) {
            console.debug("LaunchProcess()", "detected that this application is a singular and already running...");
            if ( sproc instanceof Application ) {
              sproc._onMessage(null, 'attention', arg);
            } else {
              _error(OSjs._("The application '{0}' is already launched and allows only one instance!", n));
            }
            return;
          }
        }

        var a = null, err = false;
        try {
          a = new OSjs.Applications[n](arg, result);
          a.__sname = n;

          onConstructed(a, result);
        } catch ( e ) {
          console.warn("Error on constructing application", e, e.stack);
          _error(OSjs._("Application '{0}' construct failed: {1}", n, e), e);
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
            _HANDLER.getApplicationSettings(a.__name, function(settings) {
              a.init(_CORE, settings, result);
              onFinished(a, result);
              console.groupEnd();
            });
          } catch ( e ) {
            console.warn("Error on init() application", e, e.stack);
            _error(OSjs._("Application '{0}' init() failed: {1}", n, e), e);
          }
        }
      } else {
        _error(OSjs._("Application resources missing for '{0}' or it failed to load!", n));
      }
    };


    var _preload = function(result) {
      OSjs.Utils.Preload(result.preload, function(total, errors, failed) {
        _$LOADING.style.display = 'none';

        if ( errors ) {
          _error(OSjs._("Application '{0}' preloading failed: \n{1}", n, failed.join(",")));
          return;
        }

        setTimeout(function() {
          _callback(result);
        }, 0);
      }, function(progress, count) {
        _updateSplash(progress, count);
      });
    };

    var data = _HANDLER.getApplicationMetadata(n);
    if ( !data ) {
      _error(OSjs._("Failed to launch '{0}'. Application manifest data not found!", n));
      return;
    }

    _createSplash(data);
    _preload(data);
  }

  /**
   * Launch Processes from a List
   *
   * @param   Array         list        List of launch application arguments
   * @param   Function      onSuccess   Callback on success
   * @param   Function      onError     Callback on error
   * @param   Function      onFinished  Callback on finished running
   * @see     LaunchProcess
   * @return  void
   */
  function LaunchProcessList(list, onSuccess, onError, onFinished) {
    list        = list        || []; /* idx => {name: 'string', args: 'object', data: 'mixed, optional'} */
    onSuccess   = onSuccess   || function() {};
    onError     = onError     || function() {};
    onFinished  = onFinished  || function() {};

    var _onSuccess = function(app, metadata, appName, appArgs, queueData) {
      onSuccess(app, metadata, appName, appArgs, queueData);
      _onNext();
    };

    var _onError = function(err, appName, appArgs) {
      console.warn("LaunchProcessList() _onError()", err);
      onError(err, appName, appArgs);
      _onNext();
    };

    var _onNext = function() {
      if ( list.length ) {
        var s = list.pop();
        if ( typeof s !== 'object' ) { return; }

        var aname = s.name;
        var aargs = (typeof s.args === 'undefined') ? {} : (s.args || {});
        var adata = s.data || {};

        if ( !aname ) {
          console.warn("LaunchProcessList() _onNext()", "No application name defined");
          return;
        }

        OSjs.API.launch(aname, aargs, function(app, metadata) {
          _onSuccess(app, metadata, aname, aargs, adata);
        }, function(err, name, args) {
          _onError(err, name, args);
        });
      } else {
        onFinished();
      }
    };

    _onNext();
  }

  /**
   * Global function for playing a sound
   *
   * @param   String      name      Sound name
   * @param   float       volume    Sound volume (0.0 - 1.0)
   * @return  DOMAudio
   */
  function PlaySound(name, volume) {
    if ( !OSjs.Compability.audio ) {
      console.debug("PlaySound()", "Browser has no support for sounds!");
      return false;
    }
    if ( _HANDLER && !_HANDLER.getConfig('Core').Sounds ) {
      console.debug("PlaySound()", "Core Config has disabled sounds!");
      return false;
    }
    if ( _WM && !_WM.getSetting('enableSounds') ) {
      console.debug("PlaySound()", "Window Manager has disabled sounds!");
      return false;
    }

    if ( typeof volume === 'undefined' ) {
      volume = 1.0;
    }

    var f = OSjs.API.getThemeResource(name, 'sound');
    console.info("PlaySound()", name, f);
    var a = new Audio(f);
    a.volume = volume;
    a.play();
    return a;
  }

  /////////////////////////////////////////////////////////////////////////////
  // BASE CLASSES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Process Template Class
   */
  var Process = (function() {
    var _PID = 0;

    return function(name) {
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
  })();

  Process.prototype.destroy = function(kill) {
    kill = (typeof kill === 'undefined') ? true : (kill === true);
    this.__state = -1;
    console.log("OSjs::Core::Process::destroy()", this.__pid, this.__pname);
    if ( kill ) {
      if ( this.__index >= 0 ) {
        _PROCS[this.__index] = null;
      }
    }
    return true;
  };

  /**
   * Root Process Class
   */
  var Main = function() {
    console.group("OSjs::Core::Main::__construct()");

    Process.apply(this, ['Main']);

    // Override error handling
    window.onerror = function(message, url, linenumber, column, exception) {
      var msg = JSON.stringify({message: message, url: url, linenumber: linenumber, column: column}, null, '\t');
      ErrorDialog(OSjs._('JavaScript Error Report'), OSjs._('An unexpected error occured, maybe a bug.'), msg, exception, true);
      return false;
    };

    // Events
    var self = this;
    document.addEventListener('keydown', function(ev) {
      self._onKeyDown.apply(self, arguments);
    }, false);
    document.addEventListener('keyup', function(ev) {
      self._onKeyUp.apply(self, arguments);
    }, false);
    document.addEventListener('mousedown', function(ev) {
      self._onMouseDown.apply(self, arguments);
    }, false);
    window.addEventListener('resize', function(ev) {
      self._onResize.apply(self, arguments);
    }, false);

    document.addEventListener('mouseout', function(ev) {
      self._onLeave(ev);
    }, false);
    document.addEventListener('mouseenter', function(ev) {
      self._onEnter(ev);
    }, false);

    // Background element
    this._$root = document.createElement('div');
    this._$root.id = "Background";
    this._$root.addEventListener('contextmenu', function(ev) {
      ev.preventDefault();
      return false;
    }, false);
    this._$root.addEventListener('mousedown', function(ev) {
      ev.preventDefault();
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
      ErrorDialog(OSjs._('Failed to initialize OS.js'), OSjs._('An error occured while initializing OS.js'), msg, null, true);
    };

    var _launchWM = function(callback) {
      var wm = _HANDLER.getConfig('WM');
      if ( !wm || !wm.exec ) {
        _error(OSjs._("Cannot launch OS.js: No window manager defined!"));
        return;
      }

      LaunchProcess(wm.exec, wm.args || {}, function() {
        callback();
      }, function(error) {
        _error(OSjs._("Cannot launch OS.js: Failed to launch Window Manager: {0}", error));
      });
    };

    var _preload = function(list, callback) {
      OSjs.Utils.Preload(list, function(total, errors) {
        if ( errors ) {
          _error(OSjs._("Cannot launch OS.js: Failed to preload resources..."));
          return;
        }

        callback();
      });
    };

    var _loaded = function() {
      _launchWM(function(app) {
        _$LOADING.style.display = 'none';
        PlaySound('service-login');

        _HANDLER.loadSession(function() {
          setTimeout(function() {
            self._onResize();
          }, ANIMDURATION);
        });
        _HANDLER.onInitialized();
      });
    };

    _HANDLER.boot(function(result, error) {
      if ( error ) {
        _error(error);
        return;
      }

      var preloads = _HANDLER.getConfig('Core').Preloads;
      _preload(preloads, function() {
        setTimeout(function() {
          _loaded();
        }, 0);
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
        var win;

        for ( var i = 0, l = wins.length; i < l; i++ ) {
          win = wins[i];
          if ( !win || !win._properties.allow_session ) continue;

          data.windows.push({
            name      : win._name,
            dimension : win._dimension,
            position  : win._position,
            state     : win._state
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
      PlaySound('service-logout');
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
    document.removeEventListener('keyup', function(ev) {
      self._onKeyUp.apply(self, arguments);
    }, false);
    document.removeEventListener('mousedown', function(ev) {
      self._onMouseDown.apply(self, arguments);
    }, false);
    window.removeEventListener('resize', function(ev) {
      self._onResize.apply(self, arguments);
    }, false);

    document.removeEventListener('mouseout', function(ev) {
      self._onLeave(ev);
    }, false);
    document.removeEventListener('mouseenter', function(ev) {
      self._onEnter(ev);
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
      if ( !_PROCS[i] ) { continue; }
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

  Main.prototype.message = function(msg, opts) {
    for ( var i = 0, l = _PROCS.length; i < l; i++ ) {
      if ( _PROCS[i] && _PROCS[i] instanceof Application ) {
        _PROCS[i]._onMessage(null, msg, opts);
      }
    }
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
      if ( !p ) { continue; }

      lst.push({
        pid     : p.__pid,
        name    : p.__pname,
        started : p.__started
      });
    }
    return lst;
  };

  Main.prototype._onKeyUp = function(ev) {
    if ( _WM ) {
      _WM.onKeyUp(ev, _WIN);
    }
  };

  Main.prototype._onKeyDown = function(ev) {
    var d = ev.srcElement || ev.target;
    var doPrevent = d.tagName === 'BODY' ? true : false;
    var isHTMLInput = false;
    if ((d.tagName.toUpperCase() === 'INPUT' && (d.type.toUpperCase() === 'TEXT' || d.type.toUpperCase() === 'PASSWORD' || d.type.toUpperCase() === 'FILE')) || d.tagName.toUpperCase() === 'TEXTAREA') {
          isHTMLInput = d.readOnly || d.disabled;
    }

    if ( ev.keyCode === OSjs.Utils.Keys.BACKSPACE ) {
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
    if ( _WM ) {
      _WM.onKeyDown(ev, _WIN);
    }
  };

  Main.prototype._onLeave = function(ev) {
    var from = ev.relatedTarget || ev.toElement;
    if ( !from || from.nodeName == "HTML" ) {
      _MOUSELOCK = false;
    } else {
      _MOUSELOCK = true;
    }
  };

  Main.prototype._onEnter = function(ev) {
    _MOUSELOCK = true;
  };

  Main.prototype._onMouseDown = function(ev) {
    if ( _WIN ) {
      _WIN._blur();
    }
  };

  Main.prototype._onResize = (function() {
    var _timeout;

    var _resize = function(ev) {
      if ( !_WM ) { return; }
      _WM.resize(ev, _getWindowSpace());
    };

    return function(ev) {
      if ( _timeout ) {
        clearTimeout(_timeout);
        _timeout = null;
      }


      var self = this;
      _timeout = setTimeout(function() {
        _resize.call(self, ev);
      }, 100);
    };
  })();

  Main.prototype.getProcesses = function() {
    return _PROCS;
  };

  Main.prototype.getProcess = function(name, first) {
    var p;
    var result = first ? null : [];
    for ( var i = 0, l = _PROCS.length; i < l; i++ ) {
      p = _PROCS[i];
      if ( !p ) { continue; }
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
    console.log("Name", name);
    console.log("Arguments", args);

    this._windows  = [];
    this._settings = {};
    this._themes   = args.themes || [{'default': {title: 'Default'}}];

    // Important for usage as "Application"
    this.__name    = (name || 'WindowManager');
    this.__path    = metadata.path;
    this.__iter    = metadata.iter;

    Process.apply(this, [this.__name]);

    _WM = (ref || this);

    console.groupEnd();

    this._$notifications  = document.createElement('div');
    this._$notifications.id = 'Notifications';
    document.body.appendChild(this._$notifications);
  };

  WindowManager.prototype = Object.create(Process.prototype);

  WindowManager.prototype.destroy = function() {
    console.log("OSjs::Core::WindowManager::destroy()");

    // Destroy all windows
    var i = 0;
    var l = this._windows.length;
    var w;
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

  WindowManager.prototype.resize = function(ev, rect) {
  };

  WindowManager.prototype.notification = (function() {
    var _visible = 0;

    return function(opts) {
      opts          = opts          || {};
      opts.icon     = opts.icon     || null;
      opts.title    = opts.title    || null;
      opts.message  = opts.message  || "";
      opts.onClick  = opts.onClick  || function() {};

      if ( typeof opts.timeout === 'undefined' ) {
        opts.timeout  = 5000;
      }

      console.log("OSjs::Core::WindowManager::notification()", opts);

      var container  = document.createElement('div');
      var classNames = ['Notification'];
      var self       = this;
      var timeout    = null;

      var _remove = function() {
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
      };

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

    w._inited();

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
      if ( !this._windows[i] ) { continue; }

      if ( this._windows[i]._wid == w._wid ) {
        if ( !this._windows[i] ) { break; }
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

  WindowManager.prototype.showSettings = function() {
    // Placeholder
  };

  WindowManager.prototype.applySettings = function(settings, force) {
    settings = settings || {};
    console.log("OSjs::Core::WindowManager::applySettings", "forced?", force);

    if ( force ) {
      this._settings = settings;
    } else {
      this._settings = OSjs.Utils.mergeObject(this._settings, settings);
    }

    if ( _$LOADING ) {
      _$LOADING.src = OSjs.API.getThemeResource('loading_small.gif', 'base');
    }

    return true;
  };

  WindowManager.prototype.setSetting = function(k, v) {
    if ( v !== null ) {
      if ( typeof this._settings[k] !== 'undefined' ) {
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
      if ( _LNEWY >= (window.innerHeight - 100) ) { _LNEWY = 0; }
      if ( _LNEWX >= (window.innerWidth - 100) )  { _LNEWX = 0; }
      return {x: _LNEWX+=10, y: _LNEWY+=10};
    };
  })();

  WindowManager.prototype.getSetting = function(k) {
    if ( typeof this._settings[k] !== 'undefined' ) {
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

  WindowManager.prototype.getWindows = function() {
    return this._windows;
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
  var Application = function(name, args, metadata, settings) {
    console.group("OSjs::Core::Application::__construct()");
    this.__name       = name;
    this.__label      = metadata.name;
    this.__path       = metadata.path;
    this.__iter       = metadata.iter;
    this.__destroyed  = false;
    this.__running    = true;
    this.__inited     = false;
    this.__windows    = [];
    this.__args       = args || {};
    this.__settings   = settings || {};
    this.__metadata   = metadata;

    Process.apply(this, [name]);

    console.log("Name", this.__name);
    console.log("Args", this.__args);
    console.groupEnd();
  };

  Application.prototype = Object.create(Process.prototype);

  Application.prototype.init = function(core, settings) {
    console.log("OSjs::Core::Application::init()", this.__name);

    if ( settings ) {
      this.__settings = OSjs.Utils.mergeObject(this.__settings, settings);
    }

    if ( this.__windows.length ) {
      if ( _WM ) {
        var last = null;
        var i = 0, l = this.__windows.length;
        for ( i; i < l; i++ ) {
          _WM.addWindow(this.__windows[i]);
          last = this.__windows[i];
        }
        if ( last ) { last._focus(); }
      }
    }

    this.__inited = true;
  };

  Application.prototype.destroy = function(kill) {
    if ( this.__destroyed ) { return true; }
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
    if ( !msg ) { return; }

    if ( msg === 'destroyWindow' ) {
      this._removeWindow(obj);
    } else if ( msg === 'attention' ) {
      if ( this.__windows.length ) {
        if ( this.__windows[0] ) {
          this.__windows[0]._focus();
        }
      }
    }
  };

  Application.prototype._call = function(method, args, onSuccess, onError) {
    var self = this;
    onSuccess = onSuccess || function() {};
    onError = onError || function(err) {
      err = err || "Unknown error";
      OSjs.API.error(OSjs._("Application API error"),
                     OSjs._("Application {0} failed to perform operation '{1}'", self.__name, method),
                     err);
    };
    return APICall('application', {'application': this.__iter, 'path': this.__path, 'method': method, 'arguments': args}, onSuccess, onError);
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
    if ( !(w instanceof Window) ) { throw "Application::_addWindow() expects Window"; }
    console.info("OSjs::Core::Application::_addWindow()");
    this.__windows.push(w);

    if ( this.__inited ) {
      if ( _WM ) {
        _WM.addWindow(w);
      }
      setTimeout(function() {
        w._focus();
      }, 5);
    }

    return w;
  };

  Application.prototype._removeWindow = function(w) {
    if ( !(w instanceof Window) ) { throw "Application::_removeWindow() expects Window"; }
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

  Application.prototype._getWindow = function(checkfor, key) {
    key = key || 'name';

    var i = 0;
    var l = this.__windows.length;
    var result = key === 'tag' ? [] : null;

    for ( i; i < l; i++ ) {
      if ( this.__windows[i]['_' + key] === checkfor ) {
        if ( key === 'tag' ) {
          result.push(this.__windows[i]);
        } else {
          result = this.__windows[i];
          break;
        }
      }
    }

    return result;
  };

  Application.prototype._getWindowByName = function(name) {
    return this._getWindow(name);
  };

  Application.prototype._getWindowByTags = function(tag) {
    return this._getWindow(name, 'tag');
  };

  Application.prototype._getWindows = function() {
    return this.__windows;
  };

  Application.prototype._getSetting = function(k) {
    return this.__settings[k];
  };

  Application.prototype._setSetting = function(k, v, save, saveCallback) {
    save = (typeof save === 'undefined' || save === true);
    this.__settings[k] = v;
    if ( save && _HANDLER ) {
      _HANDLER.setApplicationSettings(this.__name, this.__settings, saveCallback);
    }
  };

  Application.prototype._getArgument = function(k) {
    return typeof this.__args[k] === 'undefined' ? null : this.__args[k];
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
  var Window = (function() {
    var _WID                = 0;
    var _DEFAULT_WIDTH      = 200;
    var _DEFAULT_HEIGHT     = 200;
    var _DEFAULT_MIN_HEIGHT = 100;
    var _DEFAULT_MIN_WIDTH  = 100;
    var _DEFAULT_SND_VOLUME = 1.0;
    var _NAMES              = [];

    return function(name, opts, appRef) {
      if ( OSjs.Utils.inArray(_NAMES, name) ) {
        throw OSjs.Utils.format("You already have a Window named '{0}'", name);
      }

      var icon      = OSjs.API.getThemeResource('wm.png', 'wm');
      var position  = {x:(opts.x), y:(opts.y)};
      var dimension = {w:(opts.width || _DEFAULT_WIDTH), h:(opts.height || _DEFAULT_HEIGHT)};

      this._$element      = null;                 // DOMElement: Window Outer container
      this._$root         = null;                 // DOMElement: Window Inner container (for content)
      this._$loading      = null;                 // DOMElement: Window Loading overlay
      this._$disabled     = null;                 // DOMElement: Window Disabled Overlay

      this._rendered      = false;                // If Window has been initially rendered
      this._appRef        = appRef || null;       // Reference to Application Window was created from
      this._destroyed     = false;                // If Window has been destroyed
      this._wid           = _WID;                 // Window ID (Internal)
      this._icon          = icon;                 // Window Icon
      this._name          = name;                 // Window Name (Unique identifier)
      this._title         = name;                 // Window Title
      this._tag           = opts.tag || name;     // Window Tag (ex. Use this when you have a group of windows)
      this._position      = position;             // Window Position
      this._dimension     = dimension;            // Window Dimension
      this._lastDimension = this._dimension;      // Last Window Dimension
      this._lastPosition  = this._position;       // Last Window Position
      this._tmpPosition   = null;
      this._children      = [];                   // Child Windows
      this._parent        = null;                 // Parent Window reference
      this._guiElements   = [];                   // Added GUI Elements
      this._disabled      = true;                 // If Window is currently disabled
      this._sound         = null;                 // Play this sound when window opens
      this._soundVolume   = _DEFAULT_SND_VOLUME;  // ... using this volume

      this._properties    = {                     // Window Properties
        gravity           : null,
        allow_move        : true,
        allow_resize      : true,
        allow_minimize    : true,
        allow_maximize    : true,
        allow_close       : true,
        allow_windowlist  : true,
        allow_drop        : false,
        allow_iconmenu    : true,
        allow_ontop       : true,
        allow_hotkeys     : true,
        allow_session     : true,
        min_width         : opts.min_height || _DEFAULT_MIN_HEIGHT,
        min_height        : opts.min_width  || _DEFAULT_MIN_WIDTH,
        max_width         : opts.max_width  || null,
        max_height        : opts.max_height || null
      };

      this._state     = {                         // Window State
        focused   : false,
        modal     : false,
        minimized : false,
        maximized : false,
        ontop     : false,
        onbottom  : false
      };

      this._hooks     = {                         // Window Hooks (Events)
        focus     : [],
        blur      : [],
        destroy   : [],
        maximize  : [],
        minimize  : [],
        restore   : [],
        resize    : [], // Called inside the mousemove event
        resized   : []  // Called inside the mouseup event
      };

      console.info("OSjs::Core::Window::__construct()", this._wid, this._name);

      _WID++;
    };
  })();

  Window.prototype.init = function(_wm) {
    var self = this;
    console.group("OSjs::Core::Window::init()");

    this._state.focused = false;

    this._icon = OSjs.API.getIcon(this._icon, this._appRef);

    // Initial position
    if ( !this._properties.gravity ) {
      if ( (typeof this._position.x === 'undefined') || (typeof this._position.y === 'undefined') ) {
        var np = _WM ? _WM.getWindowPosition() : {x:0, y:0};
        this._position.x = np.x;
        this._position.y = np.y;
      }
    }

    // Clamp (FIXME: Create a clamp function)
    if ( this._properties.min_height ) {
      if ( this._dimension.h < this._properties.min_height ) {
        this._dimension.h = this._properties.min_height;
      }
    }
    if ( this._properties.max_width ) {
      if ( this._dimension.w < this._properties.max_width ) {
        this._dimension.w = this._properties.max_width;
      }
    }
    if ( this._properties.max_height ) {
      if ( this._dimension.h > this._properties.max_height ) {
        this._dimension.h = this._properties.max_height;
      }
    }
    if ( this._properties.max_width ) {
      if ( this._dimension.w > this._properties.max_width ) {
        this._dimension.w = this._properties.max_width;
      }
    }

    // Gravity
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

    console.log('Properties', this._properties);
    console.log('Position', this._position);
    console.log('Dimension', this._dimension);

    // Main outer container
    var main = document.createElement('div');

    this._addEvent(main, 'oncontextmenu', function(ev) {
      OSjs.GUI.blurMenu();
      if ( ev.target && (ev.target.tagName === 'TEXTAREA' || ev.target.tagName === 'INPUT') ) {
        return true;
      }
      return false;
    });


    if ( this._properties.allow_drop ) {
      if ( OSjs.Compability.dnd ) {
        var border = document.createElement('div');
        border.className = 'WindowDropRect';

        var _showBorder = function() {
          if ( !border.parentNode ) { document.body.appendChild(border); }
          border.style.top      = (main.offsetTop+2) + "px";
          border.style.left     = (main.offsetLeft+2) + "px";
          border.style.width    = (main.offsetWidth-4) + "px";
          border.style.height   = (main.offsetHeight-4) + "px";
          border.style.zIndex   = main.style.zIndex-1;
          border.style.display  = 'block';

          if ( !main.className.match('WindowHintDnD') ) {
            main.className += ' WindowHintDnD';
          }
        };
        var _hideBorder = function() {
          border.style.top      = 0 + "px";
          border.style.left     = 0 + "px";
          border.style.width    = 0 + "px";
          border.style.height   = 0 + "px";
          border.style.display  = 'none';

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

    // Window -> Top
    var windowTop           = document.createElement('div');
    windowTop.className     = 'WindowTop';

    // Window -> Top -> Icon
    var windowIcon          = document.createElement('div');
    windowIcon.className    = 'WindowIcon';

    var windowIconImage         = document.createElement('img');
    windowIconImage.alt         = this._title;
    windowIconImage.src         = this._icon;
    windowIconImage.width       = 16;
    windowIconImage.height      = 16;
    this._addEvent(windowIcon, 'ondblclick', function(ev) {
      ev.preventDefault();
    });
    this._addEvent(windowIcon, 'onclick', function(ev) {
      self._onWindowIconClick(ev, this);
    });

    // Window -> Top -> Title
    var windowTitle       = document.createElement('div');
    windowTitle.className = 'WindowTitle';
    windowTitle.appendChild(document.createTextNode(this._title));

    // Window -> Top -> Buttons
    var windowButtons       = document.createElement('div');
    windowButtons.className = 'WindowButtons';
    this._addEvent(windowButtons, 'onmousedown', function(ev) {
      ev.preventDefault();
      return stopPropagation(ev);
    });

    var buttonMinimize        = document.createElement('div');
    buttonMinimize.className  = 'WindowButton WindowButtonMinimize';
    buttonMinimize.innerHTML  = "&nbsp;";
    this._addEvent(buttonMinimize, 'onclick', function(ev) {
      ev.stopPropagation();
      self._onWindowButtonClick(ev, this, 'minimize');
      return false;
    });
    if ( !this._properties.allow_minimize ) {
      buttonMinimize.style.display = 'none';
    }

    var buttonMaximize        = document.createElement('div');
    buttonMaximize.className  = 'WindowButton WindowButtonMaximize';
    buttonMaximize.innerHTML  = "&nbsp;";
    this._addEvent(buttonMaximize, 'onclick', function(ev) {
      ev.stopPropagation();
      self._onWindowButtonClick(ev, this, 'maximize');
      return false;
    });
    if ( !this._properties.allow_maximize ) {
      buttonMaximize.style.display = 'none';
    }

    var buttonClose       = document.createElement('div');
    buttonClose.className = 'WindowButton WindowButtonClose';
    buttonClose.innerHTML = "&nbsp;";
    this._addEvent(buttonClose, 'onclick', function(ev) {
      ev.stopPropagation();
      self._onWindowButtonClick(ev, this, 'close');
      return false;
    });

    if ( !this._properties.allow_close ) {
      buttonClose.style.display = 'none';
    }

    // Window -> Top -> Content Container (Wrapper)
    var windowWrapper       = document.createElement('div');
    windowWrapper.className = 'WindowWrapper';

    // Window -> Resize handle
    var windowResize        = document.createElement('div');
    windowResize.className  = 'WindowResize';
    if ( !this._properties.allow_resize ) {
      windowResize.style.display = 'none';
    }

    // Window -> Loading Indication
    var windowLoading       = document.createElement('div');
    windowLoading.className = 'WindowLoading';
    this._addEvent(windowLoading, 'onclick', function(ev) {
      ev.preventDefault();
      return false;
    });

    var windowLoadingImage        = document.createElement('div');
    windowLoadingImage.className  = 'WindowLoadingIndicator';

    // Window -> Disabled Overlay
    var windowDisabled            = document.createElement('div');
    windowDisabled.className      = 'WindowDisabledOverlay';
    //windowDisabled.style.display  = 'none';
    this._addEvent(windowDisabled, 'onmousedown', function(ev) {
      ev.preventDefault();
      return false;
    });

    // Append stuff
    var classNames = ['Window'];
    classNames.push('Window_' + this._name.replace(/[^a-zA-Z0-9]/g, '_'));
    if ( this._tag && (this._name != this._tag) ) {
      classNames.push(this._tag.replace(/[^a-zA-Z0-9]/g, '_'));
    }

    main.className    = classNames.join(' ');
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
    var moved = false;
    var startRect = null;

    var onMouseDown = function(ev, a) {
      ev.preventDefault();

      if ( self._state.maximized ) { return false; }
      startRect = _WM.getWindowSpace();

      if ( a === 'move' ) {
        px = self._position.x;
        py = self._position.y;

        if ( !main.className.match(/WindowHintMoving/) ) {
          main.className += ' WindowHintMoving';
        }
      } else {
        px = self._dimension.w;
        py = self._dimension.h;

        if ( !main.className.match(/WindowHintResizing/) ) {
          main.className += ' WindowHintResizing';
        }
      }

      sx = ev.clientX;
      sy = ev.clientY;
      action = a;

      document.addEventListener('mousemove', onMouseMove, false);
      document.addEventListener('mouseup', onMouseUp, false);

      return false;
    };
    var onMouseUp = function(ev) {
      if ( moved ) {
        if ( _WM ) {
          if ( action === 'move' ) {
            self._onChange('move');
          } else if ( action === 'resize' ) {
            self._onChange('resize');
            self._fireHook('resized');

          }
        }
      }

      main.className = main.className.replace(/\s?WindowHintMoving/, '');
      main.className = main.className.replace(/\s?WindowHintResizing/, '');

      document.removeEventListener('mousemove', onMouseMove, false);
      document.removeEventListener('mouseup', onMouseUp, false);
      action = null;
      sx = 0;
      sy = 0;
      moved = false;
      startRect = null;
    };

    // FIXME: Do a timeout here to spare CPU
    var onMouseMove = function(ev) {
      if ( !_MOUSELOCK ) { return; }
      if ( action === null ) { return; }
      var dx = ev.clientX - sx;
      var dy = ev.clientY - sy;
      var rx = px + dx;
      var ry = py + dy;

      if ( action === 'move' ) {
        if ( ry < startRect.top ) { ry = startRect.top; }

        self._move(rx, ry);
      } else {
        self._resize(rx, ry);
        self._fireHook('resize');
      }

      moved = true;
    };

    if ( this._properties.allow_move ) {
      this._addEventListener(windowTop, 'mousedown', function(ev) {
        onMouseDown(ev, 'move');
      });
    }
    if ( this._properties.allow_resize ) {
      this._addEventListener(windowResize, 'mousedown', function(ev) {
        onMouseDown(ev, 'resize');
      });
    }

    this._addEventListener(main, 'mousedown', function(ev) {
      self._focus();
      return stopPropagation(ev);
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

    if ( this._sound ) {
      PlaySound(this._sound, this._soundVolume);
    }

    console.groupEnd();

    return this._$root;
  };

  Window.prototype._inited = function() {
    if ( !this._rendered ) {
      for ( var i = 0; i < this._guiElements.length; i++ ) {
        if ( this._guiElements[i] ) {
          this._guiElements[i].update();
        }
      }
    }
    this._rendered = true;
  };

  Window.prototype.destroy = function() {
    var self = this;
    if ( this._destroyed ) { return; }
    this._destroyed = true;
    console.log("OSjs::Core::Window::destroy()");

    this._onChange('close');

    this._fireHook('destroy');

    // Children etc
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

    this._removeChildren();

    // Instance
    if ( _WM ) {
      _WM.removeWindow(this);
    }
    if ( _WIN && _WIN._wid == this._wid ) {
      _WIN = null;
    }

    if ( this._$element ) {
      var _removeDOM = function() {
        if ( self._$element.parentNode ) {
          self._$element.parentNode.removeChild(self._$element);
        }
      };

      var anim = _WM ? _WM.getSetting('animations') : false;
      if ( anim ) {
        if ( !this._$element.className.match(/WindowHintClosing/) ) {
          this._$element.className += ' WindowHintClosing';
        }
        setTimeout(function() {
          _removeDOM();
        }, ANIMDURATION);
      } else {
        this._$element.style.display = "none";
        _removeDOM();
      }
    }

    // App messages
    if ( this._appRef ) {
      this._appRef._onMessage(this, 'destroyWindow', {});
    }

    this._appRef = null;
    this._hooks = {};
  };

  //
  // GUI And Event Hooks
  //

  Window.prototype._addEvent = function(el, ev, callback) {
    el[ev] = callback;
    this._addHook('destroy', function() {
      el[ev] = null;
    });
  };

  Window.prototype._addEventListener = function(el, ev, callback) {
    el.addEventListener(ev, callback, false);

    this._addHook('destroy', function() {
      el.removeEventListener(ev, callback, false);
    });
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
        if ( !this._hooks[k][i] ) { continue; }
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

  Window.prototype._removeGUIElement = function(gel) {
    var iter, destroy;
    for ( var i = 0; i < this._guiElements.length; i++ ) {
      iter = this._guiElements[i];
      destroy = false;

      if ( iter ) {
        if ( gel instanceof OSjs.GUI.GUIElement ) {
          if ( iter.id === gel.id ) {
            destroy = i;
          }
        } else {
          if ( iter.id === gel || iter.name === gel ) {
            destroy = i;
          }
        }
      }

      if ( destroy !== false ) {
        this._guiElements[destroy].destroy();
        this._guiElements[destroy] = null;
        break;
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
      if ( gel.opts && gel.opts.focusable ) {
        this._addHook('blur', function() {
          gel.blur();
        });
      }

      // NOTE: Fixes for Iframe "bugs"
      if ( (gel instanceof OSjs.GUI.RichText) ) {
        gel._addHook('focus', function() {
          OSjs.GUI.blurMenu();
          self._focus();
        });

        var overlay = null, elpos;
        this._addHook('resize', function() {
          if ( !overlay ) {
            elpos = OSjs.Utils.$position(gel.$element);

            overlay                   = document.createElement('div');
            overlay.className         = 'IFrameResizeFixer';
            overlay.style.position    = 'absolute';
            overlay.style.zIndex      = 9999999999;
            overlay.style.background  = 'transparent';
            document.body.appendChild(overlay);
          }
          overlay.style.top      = elpos.top + 'px';
          overlay.style.left     = elpos.left + 'px';
          overlay.style.width    = (gel.$element.offsetWidth||0) + 'px';
          overlay.style.height   = (gel.$element.offsetHeight||0) + 'px';
        });

        this._addHook('resized', function() {
          if ( overlay && overlay.parentNode ) {
            overlay.parentNode.removeChild(overlay);
            overlay = null;
          }
        });
      }

      this._guiElements.push(gel);
      parentNode.appendChild(gel.getRoot());

      if ( this._rendered ) {
        gel.update();
      }

      return gel;
    }

    return false;
  };

  //
  // Children (Windows)
  //

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

  Window.prototype._getChild = function(id, key) {
    key = key || 'wid';

    var result = key === 'tag' ? [] : null;
    var i = 0, l = this._children.length;
    for ( i; i < l; i++ ) {
      if ( this._children[i] ) {
        if ( key === 'tag' ) {
          result.push(this._children[i]);
        } else {
          if ( this._children[i]['_' + key] === id ) {
            result = this._children[i];
            break;
          }
        }
      }
    }
    return result;
  };

  Window.prototype._getChildById = function(id) {
    return this._getChild(id, 'wid');
  };

  Window.prototype._getChildByName = function(name) {
    return this._getChild(name, 'name');
  };

  Window.prototype._getChildrenByTag = function(tag) {
    return this._getChild(tag, 'tag');
  };

  Window.prototype._getChildren = function() {
    return this._children;
  };

  Window.prototype._removeChildren = function() {
    if ( this._children && this._children.length ) {
      var i = 0, l = this._children.length;
      for ( i; i < l; i++ ) {
        if ( this._children[i] ) {
          this._children[i].destroy();
        }
      }
    }
    this._children = [];
  };

  //
  // Actions
  //

  Window.prototype._close = function() {
    console.info("OSjs::Core::Window::_close()");
    if ( this._disabled ) { return; }

    if ( this._$element ) {
      if ( !this._$element.className.match(/WindowHintClosing/) ) {
        this._$element.className += " WindowHintClosing";
      }
    }

    this._blur();
    this.destroy();
  };

  Window.prototype._minimize = function() {
    var self = this;
    console.debug(this._name, '>' , "OSjs::Core::Window::_minimize()");
    if ( !this._properties.allow_minimize ) { return false; }
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

    var _hideDOM = function() {
      self._$element.style.display = 'none';
    };

    var anim = _WM ? _WM.getSetting('animations') : false;
    if ( anim ) {
      setTimeout(function() {
        _hideDOM();
      }, ANIMDURATION);
    } else {
      _hideDOM();
    }

    this._onChange('minimize');
    this._fireHook('minimize');

    if ( _WIN && _WIN._wid == this._wid ) {
      _WIN = null;
    }

    return true;
  };

  Window.prototype._maximize = function() {
    console.debug(this._name, '>' , "OSjs::Core::Window::_maximize()");
    if ( !this._properties.allow_maximize ) { return false; }
    //if ( this._disabled ) return false;
    if ( this._state.maximized ) {
      this._restore(true, false);
      return true;
    }
    this._lastPosition    = {x: this._position.x,  y: this._position.y};
    this._lastDimension   = {w: this._dimension.w, h: this._dimension.h};
    this._state.maximized = true;

    var s = getWindowSpace();

    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.style.top    = s.top + "px";
    this._$element.style.left   = s.left + "px";
    this._$element.style.width  = s.width + "px";
    this._$element.style.height = s.height + "px";
    if ( !this._$element.className.match(/WindowHintMaximized/) ) {
      this._$element.className += ' WindowHintMaximized';
    }

    //this._resize();
    this._dimension.w = s.width;
    this._dimension.h = s.height;
    this._position.x  = s.left;
    this._position.y  = s.top;

    this._onChange('maximize');
    this._focus();

    var anim = _WM ? _WM.getSetting('animations') : false;
    if ( anim ) {
      var self = this;
      setTimeout(function() {
        self._fireHook('maximize');
      }, ANIMDURATION);
    } else {
      this._fireHook('maximize');
    }

    return true;
  };

  Window.prototype._restore = function(max, min) {
    if ( !this._$element ) { return; }

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

    var anim = _WM ? _WM.getSetting('animations') : false;
    if ( anim ) {
      var self = this;
      setTimeout(function() {
        self._fireHook('restore');
      }, ANIMDURATION);
    } else {
      this._fireHook('restore');
    }

    this._focus();
  };

  Window.prototype._focus = function(force) {
    //if ( !force && this._state.focused ) { return false; }
    console.debug(this._name, '>' , "OSjs::Core::Window::_focus()");

    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    if ( !this._$element.className.match(/WindowHintFocused/) ) {
      this._$element.className += ' WindowHintFocused';
    }

    if ( _WIN && _WIN._wid != this._wid ) {
      _WIN._blur();
    }

    _WIN = this;

    if ( !this._state.focused || force) {
      this._onChange('focus');
      this._fireHook('focus');
    }

    this._state.focused = true;

    return true;
  };

  Window.prototype._blur = function(force) {
    if ( !force && !this._state.focused ) { return false; }
    console.debug(this._name, '>' , "OSjs::Core::Window::_blur()");
    var cn = this._$element.className;
    this._$element.className = cn.replace(/\s?WindowHintFocused/, '');
    this._state.focused = false;

    this._onChange('blur');
    this._fireHook('blur');

    return true;
  };

  Window.prototype._resizeTo = function(dw, dh, container, limit) {
    if ( dw <= 0 || dh <= 0 ) { return; }

    limit = (typeof limit === 'undefined' || limit === true);
    var posi  = OSjs.Utils.$position(container);
    var poso  = OSjs.Utils.$position(this._$root);

    if ( posi === null || poso === null ) {
      throw "Window resize failed, missing measure of element.";
    }

    var rx   = posi.left - poso.left;
    var ry   = posi.top - poso.top;
    var ex   = poso.right - posi.right;
    var ey   = poso.bottom - posi.bottom;
    var ow   = this._$element.offsetWidth;
    var oh   = this._$element.offsetHeight;
    var dx   = (ow - this._$root.offsetWidth);
    var dy   = (oh - this._$root.offsetHeight);

    var newW = dw + dx + rx + ex;
    var newH = dh + dy + ry + ey;

    if ( limit ) {
      var rect = _getWindowSpace();
      var x    = this._position.x;
      var y    = this._position.y;

      if ( (newW + x) > rect.width ) {
        newW = (rect.width - x - 10);
      }
      if ( (newH + y) > rect.height ) {
        newH = (rect.height - y - 10);
      }
    }

    this._resize(newW, newH);
  };

  Window.prototype._resize = function(w, h, force) {
    if ( !force ) {
      if ( !this._properties.allow_resize ) { return false; }

      if ( w < this._properties.min_width ) { w = this._properties.min_width; }
      if ( this._properties.max_width !== null ) {
        if ( w > this._properties.max_width ) { w = this._properties.max_width; }
      }

      if ( h < this._properties.min_height ) { h = this._properties.min_height; }
      if ( this._properties.max_height !== null ) {
        if ( h > this._properties.max_height ) { h = this._properties.max_height; }
      }
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

  Window.prototype._moveTo = function(pos) {
    if ( !_WM ) { return; }

    var s = _WM.getWindowSpace();
    var cx = this._position.x;
    var cy = this._position.y;

    if ( pos == 'left' ) {
      this._move(s.left, cy);
    } else if ( pos == 'right' ) {
      this._move((s.width - this._dimension.w), cy);
    } else if ( pos == 'top' ) {
      this._move(cx, s.top);
    } else if ( pos == 'bottom' ) {
      this._move(cx, (s.height - this._dimension.h));
    }
  };

  Window.prototype._move = function(x, y) {
    if ( !this._properties.allow_move ) { return false; }
    if ( typeof x === 'undefined' || typeof y === 'undefined') { return; }

    this._$element.style.top  = y + "px";
    this._$element.style.left = x + "px";
    this._position.x          = x;
    this._position.y          = y;
    return true;
  };

  Window.prototype._error = function(title, description, message, exception, bugreport) {
    console.debug(this._name, '>' , "OSjs::Core::Window::_error()");
    var w = ErrorDialog(title, description, message, exception, bugreport);
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

  //
  // Events
  //

  Window.prototype._onDndEvent = function(ev, type) {
    console.info("OSjs::Core::Window::_onDndEvent()", type);
    if ( this._disabled ) { return false; }
    return true;
  };

  Window.prototype._onKeyEvent = function(ev) {
  };

  Window.prototype._onWindowIconClick = function(ev, el) {
    console.debug(this._name, '>' , "OSjs::Core::Window::_onWindowIconClick()");
    if ( !this._properties.allow_iconmenu ) { return; }

    var self = this;
    var list = [];

    if ( this._properties.allow_minimize ) {
      list.push({
        title:    OSjs._('Minimize'),
        icon:     'actions/stock_up.png',
        onClick:  function(name, iter) {
          self._minimize();
        }
      });
    }
    if ( this._properties.allow_maximize ) {
      list.push({
        title:    OSjs._('Maximize'),
        icon:     'actions/window_fullscreen.png',
        onClick:  function(name, iter) {
          self._maximize();
          self._focus();
        }
      });
    }
    if ( this._state.maximized ) {
      list.push({
        title:    OSjs._('Restore'),
        icon:     'actions/view-restore.png',
        onClick:  function(name, iter) {
          self._restore();
          self._focus();
        }
      });
    }
    if ( this._properties.allow_ontop ) {
      if ( this._state.ontop ) {
        list.push({
          title:    OSjs._('On Top - Disable'),
          icon:     'actions/window-new.png',
          onClick:  function(name, iter) {
            self._state.ontop = false;
            self._$element.style.zIndex = getNextZindex(false);
            self._focus();
          }
        });
      } else {
        list.push({
          title:    OSjs._('On Top - Enable'),
          icon:     'actions/window-new.png',
          onClick:  function(name, iter) {
            self._state.ontop = true;
            self._$element.style.zIndex = getNextZindex(true);
            self._focus();
          }
        });
      }
    }
    if ( this._properties.allow_close ) {
      list.push({
        title:    OSjs._('Close'),
        icon:     'actions/window-close.png',
        onClick:  function(name, iter) {
          self._close();
        }
      });
    }

    OSjs.GUI.createMenu(list, {x: ev.clientX, y: ev.clientY});
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
    console.debug(this._name, '>' , "OSjs::Core::Window::_onChange()", ev);
    if ( _WM ) {
      _WM.eventWindow(ev, this);
    }
  };

  //
  // Getters
  //

  Window.prototype._getViewRect = function() {
    return this._$element ? OSjs.Utils.$position(this._$element) : null;
  };

  Window.prototype._getRoot = function() {
    return this._$root;
  };

  Window.prototype._getGUIElement = function(n) {
    var iter;
    for ( var i = 0, l = this._guiElements.length; i < l; i++ ) {
      iter = this._guiElements[i];
      if (iter && (iter.id === n || iter.name === n) ) {
        return iter;
      }
    }
    return null;
  };

  Window.prototype._setTitle = function(t) {
    var tel = this._$element.getElementsByClassName('WindowTitle')[0];
    if ( tel ) {
      tel.innerHTML = '';
      tel.appendChild(document.createTextNode(t));
    }
    this._title = t;
    this._onChange('title');
  };

  /////////////////////////////////////////////////////////////////////////////
  // DIALOG WINDOW
  /////////////////////////////////////////////////////////////////////////////

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
    this._properties.allow_session    = false;
    this._state.ontop                 = true;
  };

  DialogWindow.prototype = Object.create(Window.prototype);

  DialogWindow.prototype.init = function() {
    return Window.prototype.init.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  // Classes
  OSjs.Core.Process           = Process;
  OSjs.Core.Application       = Application;
  OSjs.Core.Service           = Service;
  OSjs.Core.Window            = Window;
  OSjs.Core.DialogWindow      = DialogWindow;
  OSjs.Core.WindowManager     = WindowManager;

  // Running instances
  OSjs.API.getHandlerInstance     = function() { return _HANDLER; };
  OSjs.API.getWMInstance          = function() { return _WM; };
  OSjs.API.getCoreInstance        = function() { return _CORE; };

  // Handler shortcuts
  OSjs.API.getDefaultPath         = function(def)              { return (_HANDLER.getConfig('Core').Home || (def || '/')); };
  OSjs.API.getThemeCSS            = function(name)             { return _HANDLER.getThemeCSS(name); };
  OSjs.API.getResourceURL         = function(path)             { return _HANDLER.getResourceURL(path); };
  OSjs.API.getThemeResource       = function(name, type, args) { return _HANDLER.getThemeResource(name, type, args); };
  OSjs.API.getApplicationResource = function(app, name)        { return _HANDLER.getApplicationResource(app, name); };
  OSjs.API.getIcon                = function(name, app)        { return _HANDLER.getIcon(name, app); };

  // Common API functions
  OSjs.API.call               = APICall;
  OSjs.API.error              = ErrorDialog;
  OSjs.API.launch             = LaunchProcess;
  OSjs.API.launchList         = LaunchProcessList;
  OSjs.API.open               = LaunchFile;
  OSjs.API.playSound          = PlaySound;

  /////////////////////////////////////////////////////////////////////////////
  // STARTUP / SHUTDOWN FUNCTIONS
  /////////////////////////////////////////////////////////////////////////////

  var __initialized = false;
  var __initialize  = function() {
    if ( typeof OSjs.Hooks !== 'undefined' ) {
      if ( typeof OSjs.Hooks.onInitialize === 'function' ) {
        OSjs.Hooks.onInitialize();
      }
    }

    _$LOADING     = document.createElement('img');
    _$LOADING.id  = "Loading";
    _$LOADING.src = OSjs.API.getThemeResource('loading_small.gif', 'base');
    document.body.appendChild(_$LOADING);

    _CORE = new Main();
    if ( _CORE ) {
      _CORE.init();
    }
  };

  OSjs._initialize = function() {
    if ( __initialized ) { return; }
    __initialized = true;

    console.log("");
    console.log(" .--.  .--.     _               .---.   ");
    console.log(": ,. :: .--'   :_;              `--. :  ");
    console.log(": :: :`. `.    .-. .--.   .-..-.  ,','  ");
    console.log(": :; : _`, : _ : :`._-.'  : `; :.'.'_   ");
    console.log("`.__.'`.__.':_;: :`.__.'  `.__.':____;  ");
    console.log("             .-. :                      ");
    console.log("             `._.'                      ");
    console.log("");


    window.onload = null;

    OSjs.Compability = OSjs.Utils.getCompability();

    // Launch handler
    _HANDLER = new OSjs.Handlers.Current();
    _HANDLER.init(function() {
      __initialize();
    });
  };

  OSjs._shutdown = function(save, onunload) {
    if ( !__initialized ) { return; }
    __initialized = false;
    window.onunload = null;

    var _shutdown = function() {
      if ( _CORE ) {
        _CORE.destroy();
        _CORE = null;
      }
      if ( _HANDLER ) {
        _HANDLER.destroy();
        _HANDLER = null;
      }
      _WIN = null;
      _WM = null;

      if ( _$LOADING && _$LOADING.parentNode ) {
        _$LOADING.parentNode.removeChild(_$LOADING);
      }
      _$LOADING = null;
    };

    if ( onunload ) {
      _shutdown();
    } else {
      _CORE.shutdown(save, _shutdown);
    }
  };

})();
