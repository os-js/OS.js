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
(function() {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.Compability  = OSjs.Compability  || {};
  OSjs.Helpers      = OSjs.Helpers      || {};
  OSjs.Handlers     = OSjs.Handlers     || {};
  OSjs.Settings     = OSjs.Settings     || {};
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Dialogs      = OSjs.Dialogs      || {};
  OSjs.GUI          = OSjs.GUI          || {};
  OSjs.Locale       = OSjs.Locale       || {};
  OSjs.Hooks        = {};
  OSjs.Core         = {};
  OSjs.API          = {};
  OSjs.Version      = '2.0-alpha20';

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT HOOKS
  /////////////////////////////////////////////////////////////////////////////

  var _hooks = [
    'onInitialize',          // 1: When OS.js is starting
    'onInited',              // 2: When all resources has been loaded
    'onWMInited',            // 3: When Window Manager has started
    'onSessionLoaded',       // 4: After session has been loaded or restored
    'onLogout',              // When logout is requested
    'onShutdown',            // When shutting down after successfull logout
    'onApplicationLaunch',   // On application launch request
    'onApplicationLaunched'  // When application has been launched
  ];

  for ( var h = 0; h < _hooks.length; h++ ) {
    OSjs.Hooks[_hooks[h]] = OSjs.Hooks[_hooks[h]] || function __hookPlaceHolder() {};
  }

  /**
   * Method for triggering a hook
   */
  OSjs.Hooks._trigger = function(name, args, thisarg) {
    thisarg = thisarg || OSjs;
    args = args || [];

    if ( typeof OSjs.Hooks[name] === 'function' ) {
      try {
        OSjs.Hooks[name].apply(thisarg, args);
      } catch ( e ) {
        console.warn('Error on Hook', e, e.stack);
      }
    } else {
      console.warn('No such Hook', name);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // INTERNAL VARIABLES
  /////////////////////////////////////////////////////////////////////////////

  var _PROCS = [];        // Running processes
  var _HANDLER;           // Running Handler process
  var _WM;                // Running WindowManager process

  var _$LOADING;          // Loading DOM Element
  var _$SPLASH_TXT;       //   It's description field
  var _$SPLASH;           // Loading Screen DOM Element
  var _$ROOT;             // Root element
  var _MOUSELOCK = true;  // Mouse inside view ?!
  var _INITED = false;

  /////////////////////////////////////////////////////////////////////////////
  // DOM HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Create (or show) loading indicator
   */
  function createLoading(name, opts, panelId) {
    if ( _WM ) {
      if ( _WM.createNotificationIcon(name, opts, panelId) ) {
        return name;
      }
    }

    _$LOADING.style.display = 'block';

    return false;
  }

  /**
   * Destroy (or hide) loading indicator
   */
  function destroyLoading(name, panelId) {
    if ( name ) {
      if ( _WM ) {
        if ( _WM.removeNotificationIcon(name, panelId) ) {
          return true;
        }
      }
    }

    _$LOADING.style.display = 'none';

    return false;
  }

  /////////////////////////////////////////////////////////////////////////////
  // SYSTEM FUNCTIONS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Global onResize Event
   */
  var globalOnResize = (function() {
    var _timeout;

    function _resize(ev) {
      if ( !_WM ) { return; }
      _WM.resize(ev, OSjs.API.getWindowSpace());
    }

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

  /**
   * Global onMouseDown Event
   */
  function globalOnMouseDown(ev) {
    var win = _WM ? _WM.getCurrentWindow() : null;
    if ( win ) {
      win._blur();
    }
  }

  /**
   * Global onEnter Event
   */
  function globalOnEnter(ev) {
    _MOUSELOCK = true;
  }

  /**
   * Global onLeave Event
   */
  function globalOnLeave(ev) {
    var from = ev.relatedTarget || ev.toElement;
    if ( !from || from.nodeName === 'HTML' ) {
      _MOUSELOCK = false;
    } else {
      _MOUSELOCK = true;
    }
  }

  /**
   * Global onScroll Event
   */
  function globalOnScroll(ev) {
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
  }

  /**
   * Global onKeyUp Event
   */
  function globalOnKeyUp(ev) {
    if ( _WM ) {
      _WM.onKeyUp(ev, _WM.getCurrentWindow());
    }
  }

  /**
   * Global onKeyDown Event
   */
  function globalOnKeyDown(ev) {
    var d = ev.srcElement || ev.target;
    var doPrevent = d.tagName === 'BODY' ? true : false;
    var isHTMLInput = OSjs.Utils.isInputElement(ev);

    if ( ev.keyCode === OSjs.Utils.Keys.BACKSPACE ) {
      if ( !isHTMLInput ) {
        doPrevent = true;
      }
    }

    if ( doPrevent ) {
      ev.preventDefault();
    }

    var win = _WM ? _WM.getCurrentWindow() : null;
    if ( win ) {
      win._onKeyEvent(ev);
    }
    if ( _WM ) {
      _WM.onKeyDown(ev, win);
    }
  }

  /**
   * Initialize OS.js
   */
  function doInitialize() {
    if ( _INITED ) { return; }
    _INITED = true;

    function _error(msg) {
      doErrorDialog(OSjs._('ERR_CORE_INIT_FAILED'), OSjs._('ERR_CORE_INIT_FAILED_DESC'), msg, null, true);
    }

    function _LaunchWM(callback) {
      var wm = _HANDLER.getConfig('WM');
      if ( !wm || !wm.exec ) {
        _error(OSjs._('ERR_CORE_INIT_NO_WM'));
        return;
      }

      var wargs = wm.args || {};
      wargs.themes = _HANDLER.getThemes();
      doLaunchProcess(wm.exec, wargs, function(app) {
        _WM = app;

        callback();
      }, function(error) {
        _error(OSjs._('ERR_CORE_INIT_WM_FAILED_FMT', error));
      });
    }

    function _Loaded() {
      OSjs.Hooks._trigger('onInited');

      _LaunchWM(function(/*app*/) {
        OSjs.Hooks._trigger('onWMInited');

        _$LOADING.style.display = 'none';
        doPlaySound('service-login');

        _HANDLER.loadSession(function() {
          setTimeout(function() {
            globalOnResize();
          }, 500);

          OSjs.Hooks._trigger('onSessionLoaded');
        });

        if ( _$SPLASH ) {
          _$SPLASH.style.display = 'none';
        }
      });
    }

    function _Preload(list, callback) {
      OSjs.Utils.Preload(list, function(total, errors) {
        if ( errors ) {
          _error(OSjs._('ERR_CORE_INIT_PRELOAD_FAILED'));
          return;
        }

        callback();
      });
    }

    function _Boot() {
      window.onerror = function(message, url, linenumber, column, exception) {
        var msg = JSON.stringify({message: message, url: url, linenumber: linenumber, column: column}, null, '\t');
        doErrorDialog(OSjs._('ERR_JAVASCRIPT_EXCEPTION'), OSjs._('ERR_JAVACSRIPT_EXCEPTION_DESC'), msg, exception, true);
        return false;
      };

      _$ROOT = document.createElement('div');
      _$ROOT.id = 'Background';
      _$ROOT.addEventListener('contextmenu', function(ev) {
        if ( !OSjs.Utils.isInputElement(ev) ) {
          ev.preventDefault();
          return false;
        }
        return true;
      }, false);
      _$ROOT.addEventListener('mousedown', function(ev) {
        ev.preventDefault();
        OSjs.GUI.blurMenu();
      }, false);

      document.body.appendChild(_$ROOT);

      document.addEventListener('keydown', function(ev) {
        globalOnKeyDown(ev);
      }, false);
      document.addEventListener('keyup', function(ev) {
        globalOnKeyUp(ev);
      }, false);
      document.addEventListener('mousedown', function(ev) {
        globalOnMouseDown(ev);
      }, false);
      window.addEventListener('resize', function(ev) {
        globalOnResize(ev);
      }, false);
      window.addEventListener('scroll', function(ev) {
        globalOnScroll(ev);
      }, false);
      document.addEventListener('mouseout', function(ev) {
        globalOnLeave(ev);
      }, false);
      document.addEventListener('mouseenter', function(ev) {
        globalOnEnter(ev);
      }, false);

      _HANDLER.boot(function(result, error) {

        if ( error ) {
          _error(error);
          return;
        }

        var preloads = _HANDLER.getConfig('Core').Preloads;
        _Preload(preloads, function() {
          setTimeout(function() {
            _Loaded();
          }, 0);
        });
      });
    }

    window.onload = null;

    OSjs.Compability = OSjs.Utils.getCompability();

    // Launch handler
    _HANDLER = new OSjs.Handlers.Current();
    _HANDLER.init(function() {
      OSjs.Hooks._trigger('onInitialize');

      _$SPLASH              = document.getElementById('LoadingScreen');
      _$SPLASH_TXT          = _$SPLASH ? _$SPLASH.getElementsByTagName('p')[0] : null;

      _$LOADING             = document.createElement('div');
      _$LOADING.id          = 'Loading';
      _$LOADING.innerHTML   = '<div class="loader"></div>';
      document.body.appendChild(_$LOADING);

      _Boot();
    });
  }

  /**
   * Shut down OS.js
   */
  function doShutdown(save) {
    if ( !_INITED ) { return; }
    _INITED = false;

    function _Destroy() {
      OSjs.GUI.blurMenu();

      document.removeEventListener('keydown', function(ev) {
        globalOnKeyDown(ev);
      }, false);
      document.removeEventListener('keyup', function(ev) {
        globalOnKeyUp(ev);
      }, false);
      document.removeEventListener('mousedown', function(ev) {
        globalOnMouseDown(ev);
      }, false);
      window.removeEventListener('resize', function(ev) {
        globalOnResize(ev);
      }, false);
      window.removeEventListener('scroll', function(ev) {
        globalOnScroll(ev);
      }, false);

      document.removeEventListener('mouseout', function(ev) {
        globalOnLeave(ev);
      }, false);
      document.removeEventListener('mouseenter', function(ev) {
        globalOnEnter(ev);
      }, false);

      if ( _$ROOT ) {
        _$ROOT.removeEventListener('contextmenu', function(ev) {
          if ( !OSjs.Utils.isInputElement(ev) ) {
            ev.preventDefault();
            return false;
          }
          return true;
        }, false);
        _$ROOT.removeEventListener('mousedown', function(ev) {
          ev.preventDefault();
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

      if ( _$ROOT && _$ROOT.parentNode ) {
        _$ROOT.parentNode.removeChild(_$ROOT);
        _$ROOT = null;
      }

      _PROCS = [];

      window.onerror = function() {};
    }

    function _shutdown() {
      _Destroy();

      if ( _HANDLER ) {
        _HANDLER.destroy();
        _HANDLER = null;
      }
      _WM = null;

      if ( _$LOADING && _$LOADING.parentNode ) {
        _$LOADING.parentNode.removeChild(_$LOADING);
      }
      _$LOADING = null;
    }

    OSjs.Hooks._trigger('onLogout');

    _HANDLER.logout(save, function() {
      OSjs.Hooks._trigger('onShutdown');

      doPlaySound('service-logout');
      _shutdown();
    });
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
  var doAPICall = (function() {
    var _cidx = 1;

    return function(m, a, cok, cerror) {
      var lname = 'APICall_' + _cidx;
      createLoading(lname, {className: 'BusyNotification', tooltip: 'API Call'});

      _cidx++;

      return _HANDLER.callAPI(m, a, function() {
        destroyLoading(lname);
        cok.apply(this, arguments);
      }, function() {
        destroyLoading(lname);
        cerror.apply(this, arguments);
      });
    };
  })();

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
  function doErrorDialog(title, message, error, exception, bugreport) {
    if ( _HANDLER.getConfig('Core').BugReporting ) {
      bugreport = typeof bugreport === 'undefined' ? false : (bugreport ? true : false);
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
        console.warn('An error occured while creating Dialogs.ErrorMessage', e);
        console.warn('stack', e.stack);
      }
    }

    alert(title + '\n\n' + message + '\n\n' + error);
    return null;
  }

  /**
   * Open a file
   *
   * @param   String          fname         Full path to file
   * @param   String          mime          File MIME type
   * @param   Object          launchArgs    Arguments to send to process launch function
   * @see     doLaunchProcess
   * @return  void
   */
  function doLaunchFile(fname, mime, launchArgs) {
    launchArgs = launchArgs || {};
    if ( !fname ) { throw 'Cannot doLaunchFile() without a filename'; }
    if ( !mime )  { throw 'Cannot doLaunchFile() without a mime type'; }

    var args = {file: fname, mime: mime};

    if ( launchArgs.args ) {
      for ( var i in launchArgs.args ) {
        if ( launchArgs.args.hasOwnProperty(i) ) {
          args[i] = launchArgs.args[i];
        }
      }
    }

    console.group('doLaunchFile()');
    console.log('Filename', fname);
    console.log('MIME', mime);

    function _launch(name) {
      if ( name ) {
        doLaunchProcess(name, args, launchArgs.onFinished, launchArgs.onError, launchArgs.onConstructed);
      }
    }

    function _onDone(app) {
      console.info('Found', app.length, 'applications supporting this mime');
      console.groupEnd();
      if ( app.length ) {

        if ( app.length === 1 ) {
          _launch(app[0]);
        } else {
          if ( _WM ) {
            _WM.addWindow(new OSjs.Dialogs.ApplicationChooser(fname, mime, app, function(btn, appname, setDefault) {
              if ( btn !== 'ok' ) { return; }
              _launch(appname);

              _HANDLER.setDefaultApplication(mime, setDefault ? appname : null);
            }));
          } else {
            OSjs.API.error(OSjs._('ERR_FILE_OPEN'),
                           OSjs._('ERR_FILE_OPEN_FMT', fname),
                           OSjs._('No window manager is running') );
          }
        }
      } else {
        OSjs.API.error(OSjs._('ERR_FILE_OPEN'),
                       OSjs._('ERR_FILE_OPEN_FMT', fname),
                       OSjs._('ERR_APP_MIME_NOT_FOUND_FMT', mime) );
      }
    }

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
   * @return  bool
   */
  function doLaunchProcess(n, arg, onFinished, onError, onConstructed) {
    arg           = arg           || {};
    onFinished    = onFinished    || function() {};
    onError       = onError       || function() {};
    onConstructed = onConstructed || function() {};

    if ( !n ) { throw 'Cannot doLaunchProcess() witout a application name'; }

    console.group('doLaunchProcess()', n, arg);

    OSjs.Hooks._trigger('onApplicationLaunch', [n, arg]);

    var splash = null;
    var splashBar = null;

    function _updateSplash(p, c) {
      if ( !splash || !splashBar ) { return; }
      var per = c ? 0 : 100;
      if ( c ) {
        per = (p / c) * 100;
      }
      splashBar.setProgress(per);
    }

    function _createSplash(data) {
      createLoading(n, {className: 'StartupNotification', tooltip: 'Starting ' + n});

      if ( !data.splash ) { return; }

      splash = document.createElement('div');
      splash.className = 'ProcessSplash';

      var icon = document.createElement('img');
      icon.alt = n;
      icon.src = OSjs.API.getIcon(data.icon, data);

      var titleText = document.createElement('b');
      titleText.appendChild(document.createTextNode(data.name));

      var title = document.createElement('span');
      title.appendChild(document.createTextNode('Launching '));
      title.appendChild(titleText);
      title.appendChild(document.createTextNode('...'));

      splashBar = new OSjs.GUI.ProgressBar('ApplicationSplash' + n);

      splash.appendChild(icon);
      splash.appendChild(title);
      splash.appendChild(splashBar.getRoot());

      document.body.appendChild(splash);
    }

    function _removeSplash() {
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
    }

    function _error(msg, exception) {
      _removeSplash();
      console.groupEnd(); // !!!
      doErrorDialog(OSjs._('ERR_APP_LAUNCH_FAILED'),
                  OSjs._('ERR_APP_LAUNCH_FAILED_FMT', n),
                  msg, exception, true);

      onError(msg, n, arg);
    }

    function _callback(result) {
      _removeSplash();

      if ( typeof OSjs.Applications[n] !== 'undefined' ) {
        var singular = (typeof result.singular === 'undefined') ? false : (result.singular === true);
        if ( singular ) {
          var sproc = doGetProcess(n, true);
          if ( sproc ) {
            console.debug('doLaunchProcess()', 'detected that this application is a singular and already running...');
            if ( sproc instanceof Application ) {
              sproc._onMessage(null, 'attention', arg);
            } else {
              _error(OSjs._('ERR_APP_LAUNCH_ALREADY_RUNNING_FMT', n));
            }
            return;
          }
        }

        var a = null, err = false;
        try {
          if ( typeof OSjs.Applications[n].Class !== 'undefined' ) {
            a = new OSjs.Applications[n].Class(arg, result);
          } else {
            a = new OSjs.Applications[n](arg, result);
          }
          a.__sname = n;

          onConstructed(a, result);
        } catch ( e ) {
          console.warn('Error on constructing application', e, e.stack);
          _error(OSjs._('ERR_APP_CONSTRUCT_FAILED_FMT', n, e), e);
          err = true;
        }

        if ( err ) {
          if ( a ) {
            try {
              a.destroy();
              a = null;
            } catch ( e ) {
              console.warn('Something awful happened when trying to clean up failed launch Oo', e);
            }
          }
        } else {
          try {
            _HANDLER.getApplicationSettings(a.__name, function(settings) {
              a.init(settings, result);
              onFinished(a, result);

              OSjs.Hooks._trigger('onApplicationLaunched', [{
                application: a,
                name: n,
                args: arg,
                settings: settings,
                metadata: result
              }]);

              console.groupEnd();
            });
          } catch ( e ) {
            console.warn('Error on init() application', e, e.stack);
            _error(OSjs._('ERR_APP_INIT_FAILED_FMT', n, e), e);
          }
        }
      } else {
        _error(OSjs._('ERR_APP_RESOURCES_MISSING_FMT', n));
      }
    }

    function _preload(result) {
      OSjs.Utils.Preload(result.preload, function(total, errors, failed) {
        destroyLoading(n);

        if ( errors ) {
          _error(OSjs._('ERR_APP_PRELOAD_FAILED_FMT', n, failed.join(',')));
          return;
        }

        setTimeout(function() {
          _callback(result);
        }, 0);
      }, function(progress, count) {
        _updateSplash(progress, count);
      });
    }

    var data = _HANDLER.getApplicationMetadata(n);
    if ( !data ) {
      _error(OSjs._('ERR_APP_LAUNCH_MANIFEST_FAILED_FMT', n));
      return false;
    }

    if ( typeof data.compability !== 'undefined' && (data.compability instanceof Array) ) {
      var c;
      var nosupport = [];
      for ( var i = 0; i < data.compability.length; i++ ) {
        c = data.compability[i];
        if ( typeof OSjs.Compability[c] !== 'undefined' ) {
          if ( !OSjs.Compability[c] ) {
            nosupport.push(c);
          }
        }
      }
      if ( nosupport.length ) {
        _error(OSjs._('ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT', n, nosupport.join(', ')));
        return false;
      }
    }

    _createSplash(data);
    _preload(data);

    return true;
  }

  /**
   * Launch Processes from a List
   *
   * @param   Array         list        List of launch application arguments
   * @param   Function      onSuccess   Callback on success
   * @param   Function      onError     Callback on error
   * @param   Function      onFinished  Callback on finished running
   * @see     doLaunchProcess
   * @return  void
   */
  function doLaunchProcessList(list, onSuccess, onError, onFinished) {
    list        = list        || []; /* idx => {name: 'string', args: 'object', data: 'mixed, optional'} */
    onSuccess   = onSuccess   || function() {};
    onError     = onError     || function() {};
    onFinished  = onFinished  || function() {};

    function _onSuccess(app, metadata, appName, appArgs, queueData) {
      onSuccess(app, metadata, appName, appArgs, queueData);
      _onNext();
    }

    function _onError(err, appName, appArgs) {
      console.warn('doLaunchProcessList() _onError()', err);
      onError(err, appName, appArgs);
      _onNext();
    }

    function _onNext() {
      if ( list.length ) {
        var s = list.pop();
        if ( typeof s !== 'object' ) { return; }

        var aname = s.name;
        var aargs = (typeof s.args === 'undefined') ? {} : (s.args || {});
        var adata = s.data || {};

        if ( !aname ) {
          console.warn('doLaunchProcessList() _onNext()', 'No application name defined');
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
    }

    _onNext();
  }

  /**
   * Global function for playing a sound
   *
   * @param   String      name      Sound name
   * @param   float       volume    Sound volume (0.0 - 1.0)
   * @return  DOMAudio
   */
  function doPlaySound(name, volume) {
    if ( !OSjs.Compability.audio ) {
      console.debug('doPlaySound()', 'Browser has no support for sounds!');
      return false;
    }
    if ( _HANDLER && !_HANDLER.getConfig('Core').Sounds ) {
      console.debug('doPlaySound()', 'Core Config has disabled sounds!');
      return false;
    }
    if ( _WM && !_WM.getSetting('enableSounds') ) {
      console.debug('doPlaySound()', 'Window Manager has disabled sounds!');
      return false;
    }

    if ( typeof volume === 'undefined' ) {
      volume = 1.0;
    }

    var f = OSjs.API.getThemeResource(name, 'sound');
    console.info('doPlaySound()', name, f);
    var a = new Audio(f);
    a.volume = volume;
    a.play();
    return a;
  }

  /**
   * Global function for uploading a file
   */
  function doUploadFiles(app, win, dest, files, onUploaded) {
    files = files || [];
    onUploaded = onUploaded || function(/*dest, filename, mime, size*/) {};

    var _dialogClose  = function(btn, filename, mime, size) {
      if ( btn !== 'ok' && btn !== 'complete' ) { return; }

      OSjs.API.message('vfs', {type: 'upload', path: dest, filename: filename, source: app.__pid});

      onUploaded(dest, filename, mime, size);
    };

    if ( files && files.length ) {
      for ( var i = 0; i < files.length; i++ ) {
        if ( win ) {
          app._createDialog('FileUpload', [dest, files[i], _dialogClose], win);
        } else {
          app.addWindow(new OSjs.Dialogs.FileUpload(dest, files[i], _dialogClose), false);
        }
      }
    }
  }

  /**
   * Kills a process
   */
  function doKillProcess(pid) {
    if ( _PROCS[pid] ) {
      console.warn('Killing application', pid);
      if ( _PROCS[pid].destroy(true) === false ) {
        return;
      }
      _PROCS[pid] = null;
    }
  }

  /**
   * Sends a message to all processes
   */
  function doProcessMessage(msg, opts) {
    for ( var i = 0, l = _PROCS.length; i < l; i++ ) {
      if ( _PROCS[i] && _PROCS[i] instanceof Application ) {
        _PROCS[i]._onMessage(null, msg, opts);
      }
    }
  }

  /**
   * Get a process by name
   */
  function doGetProcess(name, first) {
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
      this.__index    = _PROCS.push(this) - 1;

      console.group('OSjs::Core::Process::__construct()');
      console.log('pid',    this.__pid);
      console.log('pname',  this.__pname);
      console.log('started',this.__started);
      console.groupEnd();


      _PID++;
    };
  })();

  Process.prototype.destroy = function(kill) {
    kill = (typeof kill === 'undefined') ? true : (kill === true);
    this.__state = -1;
    console.log('OSjs::Core::Process::destroy()', this.__pid, this.__pname);
    if ( kill ) {
      if ( this.__index >= 0 ) {
        _PROCS[this.__index] = null;
      }
    }
    return true;
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
    return doAPICall('application', {'application': this.__name, 'method': method, 'arguments': args}, onSuccess, onError);
  };

  /**
   * Application Class
   */
  var Application = function(name, args, metadata, settings) {
    console.group('OSjs::Core::Application::__construct()');
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

    console.log('Name', this.__name);
    console.log('Args', this.__args);
    console.groupEnd();
  };

  Application.prototype = Object.create(Process.prototype);

  Application.prototype.init = function(settings, metadata) {
    console.log('OSjs::Core::Application::init()', this.__name);

    if ( settings ) {
      this.__settings = OSjs.Utils.mergeObject(this.__settings, settings);
    }

    if ( this.__windows.length ) {
      if ( _WM ) {
        var last = null;
        var i = 0, l = this.__windows.length;
        for ( i; i < l; i++ ) {
          if ( this.__windows[i] ) {
            _WM.addWindow(this.__windows[i]);
            last = this.__windows[i];
          }
        }
        if ( last ) { last._focus(); }
      }
    }

    this.__inited = true;
  };

  Application.prototype.destroy = function(kill) {
    if ( this.__destroyed ) { return true; }
    this.__destroyed = true;
    console.log('OSjs::Core::Application::destroy()', this.__name);

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
      err = err || 'Unknown error';
      OSjs.API.error(OSjs._('ERR_APP_API_ERROR'),
                     OSjs._('ERR_APP_API_ERROR_DESC_FMT', self.__name, method),
                     err);
    };
    return doAPICall('application', {'application': this.__iter, 'path': this.__path, 'method': method, 'arguments': args}, onSuccess, onError);
  };

  Application.prototype._createDialog = function(className, args, parentClass) {
    if ( OSjs.Dialogs[className] ) {

      var w = Object.create(OSjs.Dialogs[className].prototype);
      OSjs.Dialogs[className].apply(w, args);

      if ( parentClass && (parentClass instanceof OSjs.Core.Window) ) {
        parentClass._addChild(w);
      }

      this._addWindow(w);
      return w;
    }
    return false;
  };

  Application.prototype._addWindow = function(w) {
    if ( !(w instanceof OSjs.Core.Window) ) { throw 'Application::_addWindow() expects Window'; }
    console.info('OSjs::Core::Application::_addWindow()');
    this.__windows.push(w);

    if ( this.__inited ) {
      if ( _WM ) {
        _WM.addWindow(w);
      }
      if ( w._properties.start_focused ) {
        setTimeout(function() {
          w._focus();
        }, 5);
      }
    }

    return w;
  };

  Application.prototype._removeWindow = function(w) {
    if ( !(w instanceof OSjs.Core.Window) ) { throw 'Application::_removeWindow() expects Window'; }
    var i = 0;
    var l = this.__windows.length;
    for ( i; i < l; i++ ) {
      if ( this.__windows[i] ) {
        if ( this.__windows[i]._wid === w._wid ) {
          console.info('OSjs::Core::Application::_removeWindow()', w._wid);
          this.__windows[i].destroy();
          //this.__windows[i] = null;
          this.__windows.splice(i, 1);
          break;
        }
      }
    }
  };

  Application.prototype._getWindow = function(checkfor, key) {
    key = key || 'name';

    var i = 0;
    var l = this.__windows.length;
    var result = key === 'tag' ? [] : null;

    for ( i; i < l; i++ ) {
      if ( this.__windows[i] ) {
        if ( this.__windows[i]['_' + key] === checkfor ) {
          if ( key === 'tag' ) {
            result.push(this.__windows[i]);
          } else {
            result = this.__windows[i];
            break;
          }
        }
      }
    }

    return result;
  };

  Application.prototype._getWindowByName = function(name) {
    return this._getWindow(name);
  };

  Application.prototype._getWindowsByTag = function(tag) {
    return this._getWindow(tag, 'tag');
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
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  // Classes
  OSjs.Core.Process           = Process;
  OSjs.Core.Application       = Application;
  OSjs.Core.Service           = Service;

  // Handler shortcuts
  OSjs.API.getDefaultPath         = function(def)              { return (_HANDLER.getConfig('Core').Home || (def || '/')); };
  OSjs.API.getThemeCSS            = function(name)             { return _HANDLER.getThemeCSS(name); };
  OSjs.API.getResourceURL         = function(path)             { return _HANDLER.getResourceURL(path); };
  OSjs.API.getThemeResource       = function(name, type, args) { return _HANDLER.getThemeResource(name, type, args); };
  OSjs.API.getApplicationResource = function(app, name)        { return _HANDLER.getApplicationResource(app, name); };
  OSjs.API.getIcon                = function(name, app)        { return _HANDLER.getIcon(name, app); };

  // Common API functions
  OSjs.Initialize             = doInitialize;
  OSjs.Shutdown               = doShutdown;

  OSjs.API.call               = doAPICall;
  OSjs.API.error              = doErrorDialog;
  OSjs.API.open               = doLaunchFile;
  OSjs.API.launch             = doLaunchProcess;
  OSjs.API.launchList         = doLaunchProcessList;
  OSjs.API.kill               = doKillProcess;
  OSjs.API.playSound          = doPlaySound;
  OSjs.API.uploadFiles        = doUploadFiles;
  OSjs.API.message            = doProcessMessage;
  OSjs.API.getProcess         = doGetProcess;
  OSjs.API.getProcesses       = function() { return _PROCS; };
  OSjs.API.getHandlerInstance = function() { return _HANDLER; };
  OSjs.API.getWMInstance      = function() { return _WM; };
  OSjs.API.isMouseLock        = function() { return _MOUSELOCK; };
  OSjs.API._onMouseDown       = globalOnMouseDown;

})();
