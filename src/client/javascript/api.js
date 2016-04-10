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
(function() {
  'use strict';

  /*@
   * Please note that there are some more methods defined in `process.js`
   */

  window.OSjs       = window.OSjs       || {};
  OSjs.API          = OSjs.API          || {};

  var DefaultLocale = 'en_EN';
  var CurrentLocale = 'en_EN';

  var _MENU;              // Current open 'OSjs.GUI.Menu'
  var _CLIPBOARD;         // Current 'clipboard' data

  var _hooks = {
    'onInitialize':          [],
    'onInited':              [],
    'onWMInited':            [],
    'onSessionLoaded':       [],
    'onLogout':              [],
    'onShutdown':            [],
    'onApplicationLaunch':   [],
    'onApplicationLaunched': []
  };

  /////////////////////////////////////////////////////////////////////////////
  // SERVICERING
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Service Notification Icon Class
   *
   * This is a private class and can only be retrieved through
   * OSjs.API.getServiceNotificationIcon()
   *
   * @see OSjs.API.getServiceNotificationIcon()
   * @class
   */
  function ServiceNotificationIcon() {
    this.entries = {};
    this.size = 0;
    this.notif = null;

    this.init();
  }

  ServiceNotificationIcon.prototype.init = function() {
    var wm = OSjs.Core.getWindowManager();
    var self = this;

    function show(ev) {
      self.displayMenu(ev);
      return false;
    }

    if ( wm ) {
      this.notif = wm.createNotificationIcon('ServiceNotificationIcon', {
        image: OSjs.API.getIcon('status/gtk-dialog-authentication.png'),
        onContextMenu: show,
        onClick: show,
        onInited: function(el, img) {
          self._updateIcon();
        }
      });

      this._updateIcon();
    }
  };

  /**
   * Destroys the notification icon
   *
   * @return  void
   * @method  ServiceNotificationIcon::destroy()
   */
  ServiceNotificationIcon.prototype.destroy = function() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.removeNotificationIcon('ServiceNotificationIcon');
    }

    this.size = 0;
    this.entries = {};
    this.notif = null;
  };

  ServiceNotificationIcon.prototype._updateIcon = function() {
    if ( this.notif ) {
      this.notif.$container.style.display = this.size ? 'inline-block' : 'none';
      this.notif.setTitle(OSjs.API._('SERVICENOTIFICATION_TOOLTIP', this.size.toString()));
    }
  };

  /**
   * Show the menu
   *
   * @param   DOMEvent      ev      Event
   *
   * @return  void
   * @method  ServiceNotificationIcon::displayMenu()
   */
  ServiceNotificationIcon.prototype.displayMenu = function(ev) {
    var menu = [];
    var entries = this.entries;

    Object.keys(entries).forEach(function(name) {
      menu.push({
        title: name,
        menu: entries[name]
      });
    });

    OSjs.API.createMenu(menu, ev);
  };

  /**
   * Adds an entry
   *
   * @param   String      name      Name (unique)
   * @param   Array       menu      Menu
   *
   * @see     OSjs.GUI.Menu
   * @return  void
   * @method  ServiceNotificationIcon::add()
   */
  ServiceNotificationIcon.prototype.add = function(name, menu) {
    if ( !this.entries[name] ) {
      this.entries[name] = menu;

      this.size++;
      this._updateIcon();
    }
  };

  /**
   * Removes an entry
   *
   * @param   String      name      Name (unique)
   *
   * @return  void
   * @method  ServiceNotificationIcon::remove()
   */
  ServiceNotificationIcon.prototype.remove = function(name) {
    if ( this.entries[name] ) {
      delete this.entries[name];
      this.size--;
      this._updateIcon();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // LOCALE API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Translate given string
   * @param  String   s     Translation key/string
   * @param  Mixed    ...   Format values
   *
   * @return String
   * @api    OSjs.API._()
   */
  function doTranslate() {
    var s = arguments[0];
    var a = arguments;

    if ( OSjs.Locales[CurrentLocale][s] ) {
      a[0] = OSjs.Locales[CurrentLocale][s];
    } else {
      a[0] = OSjs.Locales[DefaultLocale][s] || s;
    }

    return a.length > 1 ? OSjs.Utils.format.apply(null, a) : a[0];
  }

  /**
   * Same as _ only you can supply the list as first argument
   * @see    OSjs.API._()
   * @api    OSjs.API.__()
   */
  function doTranslateList() {
    var l = arguments[0];
    var s = arguments[1];
    var a = Array.prototype.slice.call(arguments, 1);

    if ( l[CurrentLocale] && l[CurrentLocale][s] ) {
      a[0] = l[CurrentLocale][s];
    } else {
      a[0] = l[DefaultLocale] ? (l[DefaultLocale][s] || s) : s;
      if ( a[0] && a[0] === s ) {
        a[0] = doTranslate.apply(null, a);
      }
    }

    return a.length > 1 ? OSjs.Utils.format.apply(null, a) : a[0];
  }

  /**
   * Get current locale
   *
   * @return String
   * @api    OSjs.API.getLocale()
   */
  function doGetLocale() {
    return CurrentLocale;
  }

  /**
   * Set locale
   *
   * @param  String   s     Locale name
   *
   * @return void
   * @api    OSjs.API.setLocale()
   */
  function doSetLocale(l) {
    if ( OSjs.Locales[l] ) {
      CurrentLocale = l;
    } else {
      console.warn('doSetLocale()', 'Invalid locale', l, '(Using default)');
      CurrentLocale = DefaultLocale;
    }

    var html = document.querySelector('html');
    if ( html ) {
      html.setAttribute('lang', l);
    }

    console.log('doSetLocale()', CurrentLocale);
  }

  /////////////////////////////////////////////////////////////////////////////
  // REQUEST API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Perform cURL call
   *
   * The response is in form of: {httpCode, body}
   *
   * @param   Object    args      cURL Arguments (see docs)
   * @param   Function  callback  Callback function => fn(error, response)
   *
   * @return  void
   * @link    https://os.js.org/doc/tutorials/using-curl.html
   * @link    https://os.js.org/doc/server/srcservernodenode_modulesosjsapijs.html#api-curl
   * @api     OSjs.API.curl()
   */
  function doCurl(args, callback) {
    args = args || {};
    callback = callback || {};

    var opts = args.body;
    if ( typeof opts === 'object' ) {
      console.warn('DEPRECATION WARNING', 'The \'body\' wrapper is no longer needed');
    } else {
      opts = args;
    }

    doAPICall('curl', opts, callback, args.options);
  }

  /**
   * Global function for calling API (backend)
   *
   * You can call VFS functions by prefixing your method name with "FS:"
   *
   * @param   String    m       Method name
   * @param   Object    a       Method arguments
   * @param   Function  cb      Callback on success => fn(err, res)
   * @param   Object    options (Optional) Options to send to the XHR request
   *
   * @see     OSjs.Core.Handler.callAPI()
   * @see     OSjs.Utils.ajax()
   *
   * @return  void
   * @api     OSjs.API.call()
   */
  var _CALL_INDEX = 1;
  function doAPICall(m, a, cb, options) {
    a = a || {};

    var lname = 'APICall_' + _CALL_INDEX;

    if ( typeof a.__loading === 'undefined' || a.__loading === true ) {
      createLoading(lname, {className: 'BusyNotification', tooltip: 'API Call'});
    }

    if ( typeof cb !== 'function' ) {
      throw new TypeError('call() expects a function as callback');
    }

    if ( options && typeof options !== 'object' ) {
      throw new TypeError('call() expects an object as options');
    }

    _CALL_INDEX++;

    var handler = OSjs.Core.getHandler();
    return handler.callAPI(m, a, function(response) {
      destroyLoading(lname);
      response = response || {};
      cb(response.error || false, response.result);
    }, function(err) {
      cb(err);
    }, options);
  }

  /////////////////////////////////////////////////////////////////////////////
  // PROCESS API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Open a file
   *
   * @param   OSjs.VFS.File   file          The File reference (can also be a tuple with 'path' and 'mime')
   * @param   Object          launchArgs    Arguments to send to process launch function
   * @see     doLaunchProcess
   *
   * @return  void
   * @api     OSjs.API.open()
   */
  function doLaunchFile(file, launchArgs) {
    launchArgs = launchArgs || {};
    if ( !file.path ) { throw new Error('Cannot doLaunchFile() without a path'); }
    if ( !file.mime )  { throw new Error('Cannot doLaunchFile() without a mime type'); }

    function getApplicationNameByFile(file, forceList, callback) {
      if ( !(file instanceof OSjs.VFS.File) ) {
        throw new Error('This function excepts a OSjs.VFS.File object');
      }

      var pacman = OSjs.Core.getPackageManager();
      var val = OSjs.Core.getSettingsManager().get('DefaultApplication', file.mime);

      console.debug('getApplicationNameByFile()', 'default application', val);
      if ( !forceList && val ) {
        if ( pacman.getPackage(val) ) {
          callback([val]);
          return;
        }
      }
      callback(pacman.getPackagesByMime(file.mime));
    }

    var wm = OSjs.Core.getWindowManager();
    var handler = OSjs.Core.getHandler();
    var args = {file: file};

    if ( launchArgs.args ) {
      Object.keys(launchArgs.args).forEach(function(i) {
        args[i] = launchArgs.args[i];
      });
    }

    console.group('doLaunchFile()', file);

    function setDefaultApplication(mime, app, callback) {
      callback = callback || function() {};
      console.debug('setDefaultApplication()', mime, app);
      OSjs.Core.getSettingsManager().set('DefaultApplication', mime, app);
      OSjs.Core.getSettingsManager().save('DefaultApplication', callback);
    }

    function _launch(name) {
      if ( name ) {
        OSjs.API.launch(name, args, launchArgs.onFinished, launchArgs.onError, launchArgs.onConstructed);
      }
    }

    function _onDone(app) {
      console.info('Found', app.length, 'applications supporting this mime');
      console.groupEnd();
      if ( app.length ) {

        if ( app.length === 1 ) {
          _launch(app[0]);
        } else {
          if ( wm ) {
            OSjs.API.createDialog('ApplicationChooser', {
              file: file,
              list: app
            }, function(ev, btn, result) {
              if ( btn !== 'ok' ) { return; }
              _launch(result.name);

              setDefaultApplication(file.mime, result.useDefault ? result.name : null);
            });
          } else {
            OSjs.API.error(OSjs.API._('ERR_FILE_OPEN'),
                           OSjs.API._('ERR_FILE_OPEN_FMT', file.path),
                           OSjs.API._('ERR_NO_WM_RUNNING') );
          }
        }
      } else {
        OSjs.API.error(OSjs.API._('ERR_FILE_OPEN'),
                       OSjs.API._('ERR_FILE_OPEN_FMT', file.path),
                       OSjs.API._('ERR_APP_MIME_NOT_FOUND_FMT', file.mime) );
      }
    }

    if ( file.mime === 'osjs/application' ) {
      doLaunchProcess(OSjs.Utils.filename(file.path));
      return;
    }

    getApplicationNameByFile(file, launchArgs.forceList, _onDone);
  }

  /**
   * Restarts all processes with the given name
   *
   * This also reloads any metadata preload items defined in the application.
   *
   * @param   String      n               Application Name
   *
   * @return  void
   * @api     OSjs.API.relaunch()
   */
  function doReLaunchProcess(n) {
    function relaunch(p) {
      var data = null;
      var args = {};
      if ( p instanceof OSjs.Core.Application ) {
        data = p._getSessionData();
      }

      try {
        p.destroy(true); // kill
      } catch ( e ) {
        console.warn('OSjs.API.relaunch()', e.stack, e);
      }

      if ( data !== null ) {
        args = data.args;
        args.__resume__ = true;
        args.__windows__ = data.windows || [];
      }

      args.__preload__ = {force: true};

      OSjs.API.launch(n, args);
    }

    OSjs.API.getProcess(n).forEach(relaunch);
  }

  /**
   * Launch a Process
   *
   * @param   String      n               Application Name
   * @param   Object      arg             Launch arguments
   * @param   Function    onFinished      Callback on success
   * @param   Function    onError         Callback on error
   * @param   Function    onConstructed   Callback on application init
   *
   * @return  bool
   * @api     OSjs.API.launch()
   */
  function doLaunchProcess(n, arg, onFinished, onError, onConstructed) {
    arg           = arg           || {};
    onFinished    = onFinished    || function() {};
    onError       = onError       || function() {};
    onConstructed = onConstructed || function() {};

    if ( !n ) { throw new Error('Cannot doLaunchProcess() witout a application name'); }

    var splash = null;
    var pargs = {};
    var handler = OSjs.Core.getHandler();
    var packman = OSjs.Core.getPackageManager();
    var compability = OSjs.Utils.getCompability();

    function checkApplicationCompability(comp) {
      var result = [];
      if ( typeof comp !== 'undefined' && (comp instanceof Array) ) {
        comp.forEach(function(c, i) {
          if ( typeof compability[c] !== 'undefined' ) {
            if ( !compability[c] ) {
              result.push(c);
            }
          }
        });
      }
      return result;
    }

    function getPreloads(data) {
      var preload = (data.preload || []).slice(0);

      function _add(chk) {
        if ( chk && chk.preload ) {
          chk.preload.forEach(function(p) {
            preload.unshift(p);
          });
        }
      }

      if ( data.scope === 'user' ) {
        preload = preload.map(function(p) {
          if ( p.src.substr(0, 1) !== '/' && !p.src.match(/^(https?|ftp)/) ) {
            OSjs.VFS.url(p.src, function(error, url) {
              if ( !error ) {
                p.src = url;
              }
            });
          }

          return p;
        });
      }

      if ( data.depends && data.depends instanceof Array ) {
        data.depends.forEach(function(k) {
          if ( !OSjs.Applications[k] ) {
            console.info('Using dependency', k);
            _add(packman.getPackage(k));
          }
        });
      }

      var pkgs = packman.getPackages(false);
      Object.keys(pkgs).forEach(function(pn) {
        var p = pkgs[pn];
        if ( p.type === 'extension' && p.uses === n ) {
          console.info('Using extension', pn);
          _add(p);
        }
      });

      return preload;
    }

    function _done() {
      if ( splash ) {
        splash.destroy();
        splash = null;
      }
    }

    function _error(msg, exception) {
      _done();
      console.groupEnd(); // !!!
      OSjs.API.error(OSjs.API._('ERR_APP_LAUNCH_FAILED'),
                  OSjs.API._('ERR_APP_LAUNCH_FAILED_FMT', n),
                  msg, exception, true);

      onError(msg, n, arg, exception);
    }

    function _checkSingular(result) {
      var singular = (typeof result.singular === 'undefined') ? false : (result.singular === true);
      if ( singular ) {
        var sproc = OSjs.API.getProcess(n, true);
        if ( sproc ) {
          console.debug('doLaunchProcess()', 'detected that this application is a singular and already running...');
          if ( sproc instanceof OSjs.Core.Application ) {
            sproc._onMessage(null, 'attention', arg);
          } else {
            _error(OSjs.API._('ERR_APP_LAUNCH_ALREADY_RUNNING_FMT', n));
          }
          console.groupEnd();
          return true;
        }
      }
      return false;
    }

    function _createInstance(result) {
      var a = null;
      try {
        a = new OSjs.Applications[n].Class(arg, result);
        onConstructed(a, result);
      } catch ( e ) {
        console.warn('Error on constructing application', e, e.stack);
        _error(OSjs.API._('ERR_APP_CONSTRUCT_FAILED_FMT', n, e), e);

        if ( a ) {
          try {
            a.destroy();
            a = null;
          } catch ( ee ) {
            console.warn('Something awful happened when trying to clean up failed launch Oo', ee);
            console.warn(ee.stack);
          }
        }
      }

      return a;
    }

    function _callback(result) {
      if ( typeof OSjs.Applications[n] === 'undefined' ) {
        _error(OSjs.API._('ERR_APP_RESOURCES_MISSING_FMT', n));
        return;
      }

      if ( typeof OSjs.Applications[n] === 'function' ) {
        OSjs.Applications[n]();
        _done();
        return;
      }

      // Only allow one instance if specified
      if ( _checkSingular(result) ) {
        _done();
        return;
      }

      // Create instance and restore settings
      var a = _createInstance(result);

      try {
        var settings = OSjs.Core.getSettingsManager().get(a.__pname) || {};
        a.init(settings, result, function() {}); // NOTE: Empty function is for backward-compability
        onFinished(a, result);

        doTriggerHook('onApplicationLaunched', [{
          application: a,
          name: n,
          args: arg,
          settings: settings,
          metadata: result
        }]);

        console.groupEnd();
      } catch ( ex ) {
        console.warn('Error on init() application', ex, ex.stack);
        _error(OSjs.API._('ERR_APP_INIT_FAILED_FMT', n, ex.toString()), ex);
      }

      _done();
    }

    function launch() {
      doTriggerHook('onApplicationLaunch', [n, arg]);

      // Get metadata and check compability
      var data = packman.getPackage(n);
      if ( !data ) {
        _error(OSjs.API._('ERR_APP_LAUNCH_MANIFEST_FAILED_FMT', n));
        return false;
      }
      var nosupport = checkApplicationCompability(data.compability);
      if ( nosupport.length ) {
        _error(OSjs.API._('ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT', n, nosupport.join(', ')));
        return false;
      }

      if ( arg.__preload__ ) {
        pargs = arg.__preload__;
        delete arg.__preload__;
      }

      if ( !OSjs.Applications[n] ) {
        if ( data.splash !== false ) {
          splash = OSjs.API.createSplash(data.name, data.icon);
        }
      }

      console.info('Manifest', data);

      // Preload
      createLoading(n, {className: 'StartupNotification', tooltip: 'Starting ' + n});

      var preload = getPreloads(data);
      OSjs.Utils.preload(preload, function(total, failed) {
        destroyLoading(n);

        if ( failed.length ) {
          _error(OSjs.API._('ERR_APP_PRELOAD_FAILED_FMT', n, failed.join(',')));
          return;
        }

        setTimeout(function() {
          _callback(data);
        }, 0);
      }, function(progress, count) {
        if ( splash ) {
          splash.update(progress, count);
        }
      }, pargs);

      return true;
    }

    console.group('doLaunchProcess()', n);
    console.info('Arguments', arg);

    return launch();
  }

  /**
   * Launch Processes from a List
   *
   * @param   Array         list        List of launch application arguments
   * @param   Function      onSuccess   Callback on success => fn(app, metadata, appName, appArgs)
   * @param   Function      onError     Callback on error => fn(error, appName, appArgs)
   * @param   Function      onFinished  Callback on finished running => fn()
   * @see     doLaunchProcess
   * @return  void
   * @api     OSjs.API.launchList()
   */
  function doLaunchProcessList(list, onSuccess, onError, onFinished) {
    list        = list        || []; /* idx => {name: 'string', args: 'object', data: 'mixed, optional'} */
    onSuccess   = onSuccess   || function() {};
    onError     = onError     || function() {};
    onFinished  = onFinished  || function() {};

    OSjs.Utils.asyncs(list, function(s, current, next) {
      if ( typeof s === 'string' ) {
        var args = {};
        var spl = s.split('@');
        var name = spl[0];
        if ( typeof spl[1] !== 'undefined' ) {
          try {
            args = JSON.parse(spl[1]);
          } catch ( e ) {}
        }

        s = {
          name: name,
          args: args
        };
      }

      var aname = s.name;
      var aargs = (typeof s.args === 'undefined') ? {} : (s.args || {});

      if ( !aname ) {
        console.warn('doLaunchProcessList() next()', 'No application name defined');
        next();
        return;
      }

      OSjs.API.launch(aname, aargs, function(app, metadata) {
        onSuccess(app, metadata, aname, aargs);
        next();
      }, function(err, name, args) {
        console.warn('doLaunchProcessList() _onError()', err);
        onError(err, name, args);
        next();
      });
    }, onFinished);
  }

  /////////////////////////////////////////////////////////////////////////////
  // RESOURCE API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get a resource from application
   *
   * @param   Process   app     Application instance reference
   *                            You can also specify a name by String
   * @param   String    name    Resource Name
   *
   * @return  String            The absolute URL of resource
   *
   * @api     OSjs.API.getApplicationResource()
   */
  function doGetApplicationResource(app, name) {
    if ( name.match(/^\//) ) {
      return name;
    }
    name = name.replace(/^\.\//, '');

    function getName() {
      var appname = null;
      if ( app instanceof OSjs.Core.Process ) {
        if ( app.__path ) {
          appname = app.__path;
        }
      } else if ( typeof app === 'string' ) {
        appname = app;

        var pacman = OSjs.Core.getPackageManager();
        var packs = pacman ? pacman.getPackages() : {};
        if ( packs[appname] ) {
          appname = packs[appname].path;
        }
      }
      return appname;
    }

    function getResourcePath() {
      var appname = getName();
      var path = '';

      if ( appname ) {
        var root;
        if ( appname.match(/^(.*)\/(.*)$/) ) {
          root = OSjs.API.getConfig('Connection.PackageURI');
          path = root + '/' + appname + '/' + name;
        } else {
          root = OSjs.API.getConfig('Connection.FSURI');
          var sub = OSjs.API.getConfig('PackageManager.UserPackages');
          path = root + OSjs.Utils.pathJoin(sub, appname, name);
        }
      }

      return OSjs.Utils.checkdir(path);
    }

    return getResourcePath();
  }

  /**
   * Get path to css theme
   *
   * @param   String    name    CSS Stylesheet name (without extension)
   *
   * @return  String            The absolute URL of css file
   *
   * @api     OSjs.API.getThemeCSS()
   */
  function doGetThemeCSS(name) {
    var root = OSjs.API.getConfig('Connection.RootURI', '/');
    if ( name === null ) {
      return root + 'blank.css';
    }

    root = OSjs.API.getConfig('Connection.ThemeURI');
    return OSjs.Utils.checkdir(root + '/' + name + '.css');
  }

  /**
   * Get a icon based in file and mime
   *
   * @param   [File]    file    File Data (see supported types)
   * @param   String    size    (Optional) Icon size (default="16x16")
   * @param   String    icon    (Optional) Default icon
   *
   * @return  String            The absolute URL to the icon
   *
   * @see     vfs.js
   * @api     OSjs.API.getFileIcon()
   */
  function doGetFileIcon(file, size, icon) {
    icon = icon || 'mimetypes/gnome-fs-regular.png';

    if ( typeof file === 'object' && !(file instanceof OSjs.VFS.File) ) {
      file = new OSjs.VFS.File(file);
    }

    if ( !file.filename ) {
      throw new Error('Filename is required for getFileIcon()');
    }

    var map = [
      {match: 'application/pdf', icon: 'mimetypes/gnome-mime-application-pdf.png'},
      {match: 'application/zip', icon: 'mimetypes/folder_tar.png'},
      {match: 'application/x-python', icon: 'mimetypes/stock_script.png'},
      {match: 'application/x-lua', icon: 'mimetypes/stock_script.png'},
      {match: 'application/javascript', icon: 'mimetypes/stock_script.png'},
      {match: 'text/html', icon: 'mimetypes/stock_script.png'},
      {match: 'text/xml', icon: 'mimetypes/stock_script.png'},
      {match: 'text/css', icon: 'mimetypes/stock_script.png'},

      {match: 'osjs/document', icon: 'mimetypes/gnome-mime-application-msword.png'},
      {match: 'osjs/draw', icon: 'mimetypes/image.png'},

      {match: /^text\//, icon: 'mimetypes/txt.png'},
      {match: /^audio\//, icon: 'mimetypes/sound.png'},
      {match: /^video\//, icon: 'mimetypes/video.png'},
      {match: /^image\//, icon: 'mimetypes/image.png'},
      {match: /^application\//, icon: 'mimetypes/binary.png'}
    ];

    if ( file.type === 'dir' ) {
      icon = 'places/folder.png';
    } else if ( file.type === 'trash' ) {
      icon = 'places/user-trash.png';
    } else {
      var mime = file.mime || 'application/octet-stream';

      map.every(function(iter) {
        var match = false;
        if ( typeof iter.match === 'string' ) {
          match = (mime === iter.match);
        } else {
          match = mime.match(iter.match);
        }

        if ( match ) {
          icon = iter.icon;
          return false;
        }

        return true;
      });
    }

    return OSjs.API.getIcon(icon, size);
  }

  /**
   * Default method for getting a resource from current theme
   *
   * @param   String    name    Resource filename
   * @param   String    type    Type ('base' or a sub-folder)
   *
   * @return  String            The absolute URL to the resource
   *
   * @api     OSjs.API.getThemeResource()
   */
  function doGetThemeResource(name, type) {
    name = name || null;
    type = type || null;

    var root = OSjs.API.getConfig('Connection.ThemeURI');

    function getName(str, theme) {
      if ( !str.match(/^\//) ) {
        if ( type === 'base' || type === null ) {
          str = root + '/' + theme + '/' + str;
        } else {
          str = root + '/' + theme + '/' + type + '/' + str;
        }
      }
      return str;
    }

    if ( name ) {
      var wm = OSjs.Core.getWindowManager();
      var theme = (wm ? wm.getSetting('theme') : 'default') || 'default';
      name = getName(name, theme);
    }

    return OSjs.Utils.checkdir(name);
  }

  /**
   * Default method for getting a sound from theme
   *
   * @param   String    name    Resource filename
   *
   * @return  String            The absolute URL to the resource
   *
   * @api     OSjs.API.getSound()
   */
  function doGetSound(name) {
    name = name || null;
    if ( name ) {
      var wm = OSjs.Core.getWindowManager();
      var theme = wm ? wm.getSoundTheme() : 'default';
      var root = OSjs.API.getConfig('Connection.SoundURI');
      var compability = OSjs.Utils.getCompability();
      if ( !name.match(/^\//) ) {
        var ext = 'oga';
        if ( !compability.audioTypes.ogg ) {
          ext = 'mp3';
        }
        name = root + '/' + theme + '/' + name + '.' + ext;
      }
    }
    return OSjs.Utils.checkdir(name);
  }

  /**
   * Default method for getting a icon from theme
   *
   * @param   String    name    Resource filename
   * @param   String    size    (Optional) Icon size (default=16x16)
   * @param   Process   app     (Optional) Application instance reference. Can also be String. For `name` starting with './'
   *
   * @return  String            The absolute URL to the resource
   *
   * @api     OSjs.API.getIcon()
   */
  function doGetIcon(name, size, app) {
    name = name || null;
    size = size || '16x16';
    app  = app  || null;

    var root = OSjs.API.getConfig('Connection.IconURI');
    var wm = OSjs.Core.getWindowManager();
    var theme = wm ? wm.getIconTheme() : 'default';

    function checkIcon() {
      if ( name.match(/^\.\//) ) {
        name = name.replace(/^\.\//, '');
        if ( (app instanceof OSjs.Core.Application) || (typeof app === 'string') ) {
          return OSjs.API.getApplicationResource(app, name);
        } else {
          if ( app !== null && typeof app === 'object' ) {
            return OSjs.API.getApplicationResource(app.path, name);
          }
        }
      } else {
        if ( !name.match(/^\//) ) {
          name = root + '/' + theme + '/' + size + '/' + name;
        }
      }
      return null;
    }

    if ( name && !name.match(/^(http|\/\/)/) ) {
      var chk = checkIcon();
      if ( chk !== null ) {
        return chk;
      }
    }

    return OSjs.Utils.checkdir(name);
  }

  /**
   * Method for getting a config parameter by path (Ex: "VFS.Mountpoints.shared.enabled")
   *
   * @param   String    path              (Optional) Path
   * @param   Mixed     defaultValue      (Optional) Default value if undefined
   *
   * @return  Mixed             Parameter value or entire tree on no path
   *
   * @see     OSjs.Core.getConfig()
   * @api     OSjs.API.getConfig()
   */
  function doGetConfig(path, defaultValue) {
    var config = OSjs.Utils.cloneObject(OSjs.Core.getConfig());
    if ( typeof path === 'string' ) {
      var result = window.undefined;
      var queue = path.split(/\./);
      var ns = config;

      queue.forEach(function(k, i) {
        if ( i >= queue.length - 1 ) {
          result = ns[k];
        } else {
          ns = ns[k];
        }
      });

      if ( typeof result === 'undefined' ) {
        return defaultValue;
      }
      if ( typeof defaultValue !== 'undefined' ) {
        return result || defaultValue;
      }

      return result;
    }
    return config;
  }

  /////////////////////////////////////////////////////////////////////////////
  // SETTINGS API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get default configured path
   *
   * @param   String    fallback      Fallback path on error (default= "osjs:///")
   * @return  String
   *
   * @api     OSjs.API.getDefaultPath()
   */
  function doGetDefaultPath(fallback) {
    if ( fallback && fallback.match(/^\//) ) {
      fallback = null;
    }
    return OSjs.API.getConfig('VFS.Home') || fallback || 'osjs:///';
  }

  /////////////////////////////////////////////////////////////////////////////
  // GUI API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Create a new Desktop Notification
   *
   * @see  WindowManager::notification()
   * @api OSjs.API.createNotification()
   */
  function doCreateNotification(opts) {
    var wm = OSjs.Core.getWindowManager();
    return wm.notification(opts);
  }

  /**
   * Create a new dialog
   *
   * You can also pass a function as `className` to return an instance of your own class
   *
   * @param   String        className       Dialog Namespace Class Name
   * @param   Object        args            Arguments you want to send to dialog
   * @param   Function      callback        Callback on dialog action (close/ok etc) => fn(ev, button, result)
   * @param   Mixed         parentObj       (Optional) A window or app (to make it a child window)
   *
   * @return  Window
   *
   * @api     OSjs.API.createDialog()
   */
  function doCreateDialog(className, args, callback, parentObj) {
    callback = callback || function() {};

    function cb() {
      if ( parentObj ) {
        if ( (parentObj instanceof OSjs.Core.Window) && parentObj._destroyed ) {
          console.warn('API::createDialog()', 'INGORED EVENT: Window was destroyed');
          return;
        }
        if ( (parentObj instanceof OSjs.Core.Process) && parentObj.__destroyed ) {
          console.warn('API::createDialog()', 'INGORED EVENT: Process was destroyed');
          return;
        }
      }

      callback.apply(null, arguments);
    }

    var win = typeof className === 'string' ? new OSjs.Dialogs[className](args, cb) : className(args, cb);

    if ( !parentObj ) {
      var wm = OSjs.Core.getWindowManager();
      wm.addWindow(win, true);
    } else if ( parentObj instanceof OSjs.Core.Window ) {
      win._addHook('destroy', function() {
        if ( parentObj ) {
          parentObj._focus();
        }
      });
      parentObj._addChild(win, true);
    } else if ( parentObj instanceof OSjs.Core.Application ) {
      parentObj._addWindow(win);
    }

    setTimeout(function() {
      win._focus();
    }, 10);

    return win;
  }

  /**
   * Create (or show) loading indicator
   *
   * @param   String    name        Name of notification (unique)
   * @param   Object    opts        Options
   * @param   int       panelId     Panel ID (optional)
   *
   * @return  String                Or false on error
   * @api     OSjs.API.createLoading()
   */
  function createLoading(name, opts, panelId) {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      if ( wm.createNotificationIcon(name, opts, panelId) ) {
        return name;
      }
    }
    return false;
  }

  /**
   * Destroy (or hide) loading indicator
   *
   * @param   String    name        Name of notification (unique)
   * @param   int       panelId     Panel ID (optional)
   *
   * @return  boolean
   * @api     OSjs.API.destroyLoading()
   */
  function destroyLoading(name, panelId) {
    var wm = OSjs.Core.getWindowManager();
    if ( name ) {
      if ( wm ) {
        if ( wm.removeNotificationIcon(name, panelId) ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Checks the given permission (groups) against logged in user
   *
   * @param   Mixed     group         Either a string or array of groups
   *
   * @api     OSjs.API.checkPermission()
   */
  function doCheckPermission(group) {
    var user = OSjs.Core.getHandler().getUserData();
    var userGroups = user.groups || [];

    if ( !(group instanceof Array) ) {
      group = [group];
    }

    var result = true;
    if ( userGroups.indexOf('admin') < 0 ) {
      group.every(function(g) {
        if ( userGroups.indexOf(g) < 0 ) {
          result = false;
        }
        return result;
      });
    }
    return result;
  }

  /**
   * Checks the given permission (groups) against logged in user
   *
   * Returns an object with the methods `update(precentage)` and `destroy()`
   *
   * @param   String      name          The name to display
   * @param   String      icon          The icon to display
   * @param   String      label         (Optional) The label (default = 'Starting')
   * @param   DOMElement  parentEl      (Optional) The parent element
   *
   * @return  Object
   *
   * @api     OSjs.API.createSplash()
   */
  function doCreateSplash(name, icon, label, parentEl) {
    label = label || 'Starting';
    parentEl = parentEl || document.body;

    var splash = document.createElement('application-splash');
    splash.setAttribute('role', 'dialog');

    var img;
    if ( icon ) {
      img = document.createElement('img');
      img.alt = name;
      img.src = OSjs.API.getIcon(icon);
    }

    var titleText = document.createElement('b');
    titleText.appendChild(document.createTextNode(name));

    var title = document.createElement('span');
    title.appendChild(document.createTextNode(label + ' '));
    title.appendChild(titleText);
    title.appendChild(document.createTextNode('...'));

    var splashBar = document.createElement('gui-progress-bar');
    OSjs.GUI.Elements['gui-progress-bar'].build(splashBar);

    if ( img ) {
      splash.appendChild(img);
    }
    splash.appendChild(title);
    splash.appendChild(splashBar);

    parentEl.appendChild(splash);

    return {
      destroy: function() {
        splash = OSjs.Utils.$remove(splash);

        img = null;
        title = null;
        titleText = null;
        splashBar = null;
      },

      update: function(p, c) {
        if ( !splash || !splashBar ) { return; }
        var per = c ? 0 : 100;
        if ( c ) {
          per = (p / c) * 100;
        }
        (new OSjs.GUI.Element(splashBar)).set('value', per);
      }
    };
  }

  /////////////////////////////////////////////////////////////////////////////
  // MISC API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Global function for showing an error dialog
   *
   * @param   String    title       Dialog title
   * @param   String    message     Dialog message
   * @param   String    error       Error message
   * @param   Object    exception   Exception reference (optional)
   * @param   boolean   bugreport   Enable bugreporting for this error (default=fale)
   *
   * @return  null
   * @api     OSjs.API.error()
   */
  function doErrorDialog(title, message, error, exception, bugreport) {
    if ( OSjs.API.getConfig('BugReporting') ) {
      bugreport = typeof bugreport === 'undefined' ? false : (bugreport ? true : false);
    } else {
      bugreport = false;
    }

    OSjs.API.blurMenu();

    var wm = OSjs.Core.getWindowManager();
    if ( wm && wm._fullyLoaded ) {
      try {
        return OSjs.API.createDialog('Error', {
          title: title,
          message: message,
          error: error,
          exception: exception,
          bugreport: bugreport
        });
      } catch ( e ) {
        console.warn('An error occured while creating Dialogs.Error', e);
        console.warn('stack', e.stack);
      }
    }

    window.alert(title + '\n\n' + message + '\n\n' + error);

    return null;
  }

  /**
   * Global function for playing a sound
   *
   * @param   String      name      Sound name
   * @param   float       volume    Sound volume (0.0 - 1.0)
   *
   * @return  DOMAudio
   * @api     OSjs.API.playSound()
   */
  function doPlaySound(name, volume) {
    var compability = OSjs.Utils.getCompability();
    if ( !compability.audio ) {
      console.debug('doPlaySound()', 'Browser has no support for sounds!');
      return false;
    }

    var wm = OSjs.Core.getWindowManager();
    if ( wm && !wm.getSetting('enableSounds') ) {
      console.debug('doPlaySound()', 'Window Manager has disabled sounds!');
      return false;
    }

    if ( typeof volume === 'undefined' ) {
      volume = 1.0;
    }

    var f = OSjs.API.getSound(name);
    console.info('doPlaySound()', name, f);
    var a = new Audio(f);
    a.volume = volume;
    a.play();
    return a;
  }

  /**
   * Set the "clipboard" data
   *
   * NOTE: This does not set the operating system clipboard (yet...)
   *
   * @param   Mixed       data      What data to set
   * @return  void
   * @api     OSjs.API.setClipboard()
   */
  function doSetClipboard(data) {
    console.info('OSjs.API.setClipboard()', data);
    _CLIPBOARD = data;
  }

  /**
   * Get the "clipboard" data
   *
   * NOTE: This does not the operating system clipboard (yet...)
   *
   * @return  Mixed
   * @api     OSjs.API.getClipboard()
   */
  function doGetClipboard() {
    return _CLIPBOARD;
  }

  /**
   * Returns an instance of ServiceNotificationIcon
   *
   * This is the icon in the panel where external connections
   * etc gets a menu entry.
   *
   * @return  ServiceNotificationIcon
   * @api     OSjs.API.getServiceNotificationIcon()
   */
  var doGetServiceNotificationIcon = (function() {
    var _instance;

    return function() {
      if ( !_instance ) {
        _instance = new ServiceNotificationIcon();
      }
      return _instance;
    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // MISC
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Signs the user out and shuts down OS.js
   *
   * @return  void
   * @method  OSjs.API.signOut()
   */
  function doSignOut() {
    var handler = OSjs.Core.getHandler();
    var wm = OSjs.Core.getWindowManager();

    function signOut(save) {
      OSjs.API.playSound('service-logout');

      handler.logout(save, function() {
        OSjs.API.shutdown();
      });
    }

    if ( wm ) {
      var user = handler.getUserData() || {name: OSjs.API._('LBL_UNKNOWN')};
      OSjs.API.createDialog('Confirm', {
        title: OSjs.API._('DIALOG_LOGOUT_TITLE'),
        message: OSjs.API._('DIALOG_LOGOUT_MSG_FMT', user.name)
      }, function(ev, btn) {
        if ( btn === 'yes' ) {
          signOut(true);
        } else if ( btn === 'no' ) {
          signOut(false);
        }
      });
    } else {
      signOut(true);
    }
  }

  /**
   * Method for triggering a hook
   *
   * @param   String    name      Hook name
   * @param   Array     args      List of arguments
   * @param   Object    thisarg   'this' ref
   *
   * @return  void
   * @api     OSjs.API.triggerHook()
   */
  function doTriggerHook(name, args, thisarg) {
    thisarg = thisarg || OSjs;
    args = args || [];

    if ( _hooks[name] ) {
      _hooks[name].forEach(function(hook) {
        if ( typeof hook === 'function' ) {
          try {
            hook.apply(thisarg, args);
          } catch ( e ) {
            console.warn('Error on Hook', e, e.stack);
          }
        } else {
          console.warn('No such Hook', name);
        }
      });
    }
  }

  /**
   * Method for adding a hook
   *
   * @param   String    name    Hook name
   * @param   Function  fn      Callback => fn()
   *
   * @return  void
   * @api     OSjs.API.addHook()
   */
  function doAddHook(name, fn) {
    if ( typeof _hooks[name] !== 'undefined' ) {
      _hooks[name].push(fn);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.API._                      = doTranslate;
  OSjs.API.__                     = doTranslateList;
  OSjs.API.getLocale              = doGetLocale;
  OSjs.API.setLocale              = doSetLocale;

  OSjs.API.curl                   = doCurl;
  OSjs.API.call                   = doAPICall;

  OSjs.API.open                   = doLaunchFile;
  OSjs.API.launch                 = doLaunchProcess;
  OSjs.API.launchList             = doLaunchProcessList;
  OSjs.API.relaunch               = doReLaunchProcess;

  OSjs.API.getApplicationResource = doGetApplicationResource;
  OSjs.API.getThemeCSS            = doGetThemeCSS;
  OSjs.API.getIcon                = doGetIcon;
  OSjs.API.getFileIcon            = doGetFileIcon;
  OSjs.API.getThemeResource       = doGetThemeResource;
  OSjs.API.getSound               = doGetSound;
  OSjs.API.getConfig              = doGetConfig;

  OSjs.API.getDefaultPath         = doGetDefaultPath;

  /**
   * @api OSjs.API.createMenu()
   * @see OSjs.GUI.Helpers.createMenu()
   */
  OSjs.API.createMenu             = function() {
    return OSjs.GUI.Helpers.createMenu.apply(null, arguments);
  };

  /**
   * @api OSjs.API.blurMenu()
   * @see OSjs.GUI.Helpers.blurMenu()
   */
  OSjs.API.blurMenu               = function() {
    return OSjs.GUI.Helpers.blurMenu.apply(null, arguments);
  };

  OSjs.API.createLoading          = createLoading;
  OSjs.API.destroyLoading         = destroyLoading;
  OSjs.API.createSplash           = doCreateSplash;
  OSjs.API.createDialog           = doCreateDialog;
  OSjs.API.createNotification     = doCreateNotification;
  OSjs.API.checkPermission        = doCheckPermission;

  OSjs.API.error                      = doErrorDialog;
  OSjs.API.shutdown                   = OSjs.API.shutdown || function() {}; // init.js
  OSjs.API.triggerHook                = doTriggerHook;
  OSjs.API.addHook                    = doAddHook;
  OSjs.API.signOut                    = doSignOut;
  OSjs.API.playSound                  = doPlaySound;
  OSjs.API.setClipboard               = doSetClipboard;
  OSjs.API.getClipboard               = doGetClipboard;
  OSjs.API.getServiceNotificationIcon = doGetServiceNotificationIcon;

})();
