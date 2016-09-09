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
(function(Utils, API) {
  'use strict';

  /**
   * @namespace API
   * @memberof OSjs
   */

  /*@
   * Please note that there are some more methods defined in `process.js`
   */

  var DefaultLocale = 'en_EN';
  var CurrentLocale = 'en_EN';

  var _MENU;              // Current open 'OSjs.GUI.Menu'
  var _CLIPBOARD;         // Current 'clipboard' data

  var _hooks = {
    'onInitialize':          [],
    'onInited':              [],
    'onWMInited':            [],
    'onSessionLoaded':       [],
    'onShutdown':            [],
    'onApplicationPreload':  [],
    'onApplicationLaunch':   [],
    'onApplicationLaunched': [],
    'onBlurMenu':            []
  };

  /////////////////////////////////////////////////////////////////////////////
  // SERVICERING
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Service Notification Icon Class
   *
   * This is a private class and can only be retrieved through
   * OSjs.API.getServiceNotificationIcon()
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
      if ( this.notif.$container ) {
        this.notif.$container.style.display = this.size ? 'inline-block' : 'none';
      }
      this.notif.setTitle(OSjs.API._('SERVICENOTIFICATION_TOOLTIP', this.size.toString()));
    }
  };

  /**
   * Show the menu
   *
   * @param   DOMEvent      ev      Event
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
   *
   * @function _
   * @memberof OSjs.API
   *
   * @param  {String}       s       Translation key/string
   * @param  {...String}    sargs   Format values
   *
   * @return {String}
   */
  API._ = function _apiTranslate() {
    var s = arguments[0];
    var a = arguments;

    if ( OSjs.Locales[CurrentLocale][s] ) {
      a[0] = OSjs.Locales[CurrentLocale][s];
    } else {
      a[0] = OSjs.Locales[DefaultLocale][s] || s;
    }

    return a.length > 1 ? Utils.format.apply(null, a) : a[0];
  };

  /**
   * Same as _ only you can supply the list as first argument
   *
   * @function __
   * @memberof OSjs.API
   * @see OSjs.API._
   */
  API.__ = function _apiTranslateList() {
    var l = arguments[0];
    var s = arguments[1];
    var a = Array.prototype.slice.call(arguments, 1);

    if ( l[CurrentLocale] && l[CurrentLocale][s] ) {
      a[0] = l[CurrentLocale][s];
    } else {
      a[0] = l[DefaultLocale] ? (l[DefaultLocale][s] || s) : s;
      if ( a[0] && a[0] === s ) {
        a[0] = API._.apply(null, a);
      }
    }

    return a.length > 1 ? Utils.format.apply(null, a) : a[0];
  };

  /**
   * Get current locale
   *
   * @function getLocale
   * @memberof OSjs.API
   *
   * @return {String}
   */
  API.getLocale = function _apiGetLocale() {
    return CurrentLocale;
  };

  /**
   * Set locale
   *
   * @function setLocale
   * @memberof OSjs.API
   *
   * @param  {String}   s     Locale name
   */
  API.setLocale = function _apiSetLocale(l) {
    var RTL = API.getConfig('LocaleOptions.RTL', []);

    if ( OSjs.Locales[l] ) {
      CurrentLocale = l;
    } else {
      console.warn('API::setLocale()', 'Invalid locale', l, '(Using default)');
      CurrentLocale = DefaultLocale;
    }

    var major = CurrentLocale.split('_')[0];
    var html = document.querySelector('html');
    if ( html ) {
      html.setAttribute('lang', l);
      html.setAttribute('dir', RTL.indexOf(major) !== -1 ? 'rtl' : 'ltr');
    }

    console.info('API::setLocale()', CurrentLocale);
  };

  /////////////////////////////////////////////////////////////////////////////
  // REQUEST API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Perform cURL call
   *
   * The response is in form of: {httpCode, body}
   *
   * @function curl
   * @memberof OSjs.API
   *
   * @param   {Object}    args      cURL Arguments (see docs)
   * @param   {Function}  callback  Callback function => fn(error, response)
   *
   * @link https://os.js.org/doc/tutorials/using-curl.html
   * @link https://os.js.org/doc/server/srcservernodenode_modulesosjsapijs.html#api-curl
   */
  API.curl = function _apiCurl(args, callback) {
    args = args || {};
    callback = callback || {};

    var opts = args.body;
    if ( typeof opts === 'object' ) {
      console.warn('DEPRECATION WARNING', 'The \'body\' wrapper is no longer needed');
    } else {
      opts = args;
    }

    API.call('curl', opts, callback, args.options);
  };

  /**
   * Global function for calling API (backend)
   *
   * You can call VFS functions by prefixing your method name with "FS:"
   *
   * @function call
   * @memberof OSjs.API
   * @see OSjs.Core.Handler#callAPI
   * @see OSjs.Utils.ajax
   * @throws {Error} On invalid arguments
   *
   * @param   {String}    m         Method name
   * @param   {Object}    a         Method arguments
   * @param   {Function}  cb        Callback on success => fn(err, res)
   * @param   {Object}    [options] Options to send to the XHR request
   */
  var _CALL_INDEX = 1;
  API.call = function _apiCall(m, a, cb, options) {
    a = a || {};

    var lname = 'APICall_' + _CALL_INDEX;

    if ( typeof a.__loading === 'undefined' || a.__loading === true ) {
      API.createLoading(lname, {className: 'BusyNotification', tooltip: 'API Call'});
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
      API.destroyLoading(lname);
      response = response || {};
      cb(response.error || false, response.result);
    }, function(err) {
      cb(err);
    }, options);
  };

  /////////////////////////////////////////////////////////////////////////////
  // PROCESS API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Open a file
   *
   * @function open
   * @memberof OSjs.API
   * @see OSjs.API.launch
   * @throws {Error} On invalid arguments
   *
   * @param   {OSjs.VFS.File}   file          The File reference (can also be a tuple with 'path' and 'mime')
   * @param   {Object}          launchArgs    Arguments to send to process launch function
   */
  API.open = function _apiOpen(file, launchArgs) {
    launchArgs = launchArgs || {};

    if ( !file.path ) {
      throw new Error('Cannot API::open() without a path');
    }

    var settingsManager = OSjs.Core.getSettingsManager();
    var wm = OSjs.Core.getWindowManager();
    var handler = OSjs.Core.getHandler();
    var args = {file: file};

    function getApplicationNameByFile(file, forceList, callback) {
      if ( !(file instanceof OSjs.VFS.File) ) {
        throw new Error('This function excepts a OSjs.VFS.File object');
      }

      var pacman = OSjs.Core.getPackageManager();
      var val = settingsManager.get('DefaultApplication', file.mime);

      console.debug('getApplicationNameByFile()', 'default application', val);
      if ( !forceList && val ) {
        if ( pacman.getPackage(val) ) {
          callback([val]);
          return;
        }
      }
      callback(pacman.getPackagesByMime(file.mime));
    }

    function setDefaultApplication(mime, app, callback) {
      callback = callback || function() {};
      console.debug('setDefaultApplication()', mime, app);
      settingsManager.set('DefaultApplication', mime, app);
      settingsManager.save('DefaultApplication', callback);
    }

    function _launch(name) {
      if ( name ) {
        OSjs.API.launch(name, args, launchArgs.onFinished, launchArgs.onError, launchArgs.onConstructed);
      }
    }

    function _launchApp(name, ar) {
      console.groupEnd();
      API.launch(name, ar);
    }

    function _onDone(app) {
      console.debug('Found', app.length, 'applications supporting this mime');
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
              if ( btn !== 'ok' ) {
                return;
              }

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

    console.group('API::open()', file);

    if ( file.mime === 'osjs/application' ) {
      _launchApp(Utils.filename(file.path), launchArgs);
    } else if ( file.type === 'dir' ) {
      var fm = settingsManager.instance('DefaultApplication').get('dir', 'ApplicationFileManager');
      _launchApp(fm, {path: file.path});
    } else {
      if ( launchArgs.args ) {
        Object.keys(launchArgs.args).forEach(function(i) {
          args[i] = launchArgs.args[i];
        });
      }

      getApplicationNameByFile(file, launchArgs.forceList, _onDone);
    }
  };

  /**
   * Restarts all processes with the given name
   *
   * This also reloads any metadata preload items defined in the application.
   *
   * @function relaunch
   * @memberof OSjs.API
   *
   * @param   {String}      n               Application Name
   */
  API.relaunch = function _apiRelaunch(n) {
    function relaunch(p) {
      var data = null;
      var args = {};
      if ( p instanceof OSjs.Core.Application ) {
        data = p._getSessionData();
      }

      try {
        p.destroy(); // kill
      } catch ( e ) {
        console.warn('OSjs.API.relaunch()', e.stack, e);
      }

      if ( data !== null ) {
        args = data.args;
        args.__resume__ = true;
        args.__windows__ = data.windows || [];
      }

      args.__preload__ = {force: true};

      //setTimeout with 500 ms is used to allow applications that might need
      //  some time to destroy resources before it can be relaunched.
      setTimeout(function() {
        OSjs.API.launch(n, args);
      }, 500);
    }

    OSjs.GUI.Scheme.clearCache(); // TODO Only for requested application

    OSjs.API.getProcess(n).forEach(relaunch);
  };

  /**
   * Launch a Process
   *
   * @function launch
   * @memberof OSjs.API
   *
   * @param   {String}      name          Application Name
   * @param   {Object}      [args]          Launch arguments
   * @param   {Function}    [ondone]        Callback on success
   * @param   {Function}    [onerror]       Callback on error
   * @param   {Function}    [onconstruct]   Callback on application init
   *
   * @return  {Boolean}
   */
  API.launch = function _apiLaunch(name, args, ondone, onerror, onconstruct) {
    args = args || {};

    var err;

    var splash = null;
    var instance = null;
    var pargs = {};

    var handler = OSjs.Core.getHandler();
    var packman = OSjs.Core.getPackageManager();
    var compability = Utils.getCompability();
    var metadata = packman.getPackage(name);
    var running = OSjs.API.getProcess(name, true);

    var preloads = (function() {
      var list = (metadata.preload || []).slice(0);
      var additions = [];

      function _add(chk) {
        if ( chk && chk.preload ) {
          chk.preload.forEach(function(p) {
            additions.push(p);
          });
        }
      }

      // If this package depends on another package, make sure
      // to load the resources for the related one as well
      if ( metadata.depends instanceof Array ) {
        metadata.depends.forEach(function(k) {
          if ( !OSjs.Applications[k] ) {
            console.info('Using dependency', k);
            _add(packman.getPackage(k));
          }
        });
      }

      // ... same goes for packages that uses this package
      // as a dependency.
      var pkgs = packman.getPackages(false);
      Object.keys(pkgs).forEach(function(pn) {
        var p = pkgs[pn];
        if ( p.type === 'extension' && p.uses === name ) {
          console.info('Using extension', pn);
          _add(p);
        }
      });

      list = additions.concat(list);
      additions = [];

      // For user packages, make sure to load the correct URL
      if ( metadata.scope === 'user' ) {
        list = list.map(function(p) {
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

      return list;
    })();

    function _createSplash() {
      API.createLoading(name, {className: 'StartupNotification', tooltip: 'Starting ' + name});
      if ( !OSjs.Applications[name] ) {
        if ( metadata.splash !== false ) {
          splash = OSjs.API.createSplash(metadata.name, metadata.icon);
        }
      }
    }

    function _destroySplash() {
      API.destroyLoading(name);
      if ( splash ) {
        splash.destroy();
        splash = null;
      }
    }

    function _onError(err, exception) {
      _destroySplash();

      OSjs.API.error(OSjs.API._('ERR_APP_LAUNCH_FAILED'),
                  OSjs.API._('ERR_APP_LAUNCH_FAILED_FMT', name),
                  err, exception, true);

      console.groupEnd();

      (onerror || function() {})(err, name, args, exception);
    }

    function _onFinished(skip) {
      _destroySplash();

      console.groupEnd();

      (ondone || function() {})(instance, metadata);
    }

    function _preLaunch(cb) {
      var isCompatible = (function() {
        var list = (metadata.compability || []).filter(function(c) {
          if ( typeof compability[c] !== 'undefined' ) {
            return !compability[c];
          }
          return false;
        });

        if ( list.length ) {
          return OSjs.API._('ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT', name, list.join(', '));
        }
        return true;
      })();

      if ( isCompatible !== true ) {
        throw new Error(isCompatible);
      }

      if ( metadata.singular === true && running ) {
        if ( running instanceof OSjs.Core.Application ) {
          // In this case we do not trigger an error. Applications simply get a signal for attention
          console.warn('API::launch()', 'detected that this application is a singular and already running...');
          running._onMessage('attention', args);
          _onFinished(true);
          return; // muy importante!
        } else {
          throw new Error(OSjs.API._('ERR_APP_LAUNCH_ALREADY_RUNNING_FMT', name));
        }
      }

      Utils.asyncs(_hooks.onApplicationPreload, function(qi, i, n) {
        qi(name, args, preloads, function(p) {
          if ( p && (p instanceof Array) ) {
            preloads = p;
          }
          n();
        });
      }, function() {
        _createSplash();
        cb();
      });

      API.triggerHook('onApplicationLaunch', [name, args]);
    }

    function _preload(cb) {
      Utils.preload(preloads, function(total, failed) {
        if ( failed.length ) {
          cb(OSjs.API._('ERR_APP_PRELOAD_FAILED_FMT', name, failed.join(',')));
        } else {
          setTimeout(function() {
            cb(false);
          }, 0);
        }
      }, function(progress, count) {
        if ( splash ) {
          splash.update(progress, count);
        }
      }, pargs);
    }

    function _createProcess(cb) {
      function __onprocessinitfailed() {
        if ( instance ) {
          try {
            instance.destroy();
            instance = null;
          } catch ( ee ) {
            console.warn('Something awful happened when trying to clean up failed launch Oo', ee);
            console.warn(ee.stack);
          }
        }
      }

      if ( typeof OSjs.Applications[name] === 'undefined' ) {
        throw new Error(OSjs.API._('ERR_APP_RESOURCES_MISSING_FMT', name));
      }

      if ( typeof OSjs.Applications[name] === 'function' ) {
        OSjs.Applications[name]();
        cb(false, true);
        return;
      }

      try {
        instance = new OSjs.Applications[name].Class(args, metadata);

        (onconstruct || function() {})(instance, metadata);
      } catch ( e ) {
        console.warn('Error on constructing application', e, e.stack);
        __onprocessinitfailed();
        cb(OSjs.API._('ERR_APP_CONSTRUCT_FAILED_FMT', name, e), e);
        return;
      }

      try {
        var settings = OSjs.Core.getSettingsManager().get(instance.__pname) || {};
        instance.init(settings, metadata, function() {}); // NOTE: Empty function is for backward-compability

        API.triggerHook('onApplicationLaunched', [{
          application: instance,
          name: name,
          args: args,
          settings: settings,
          metadata: metadata
        }]);
      } catch ( ex ) {
        console.warn('Error on init() application', ex, ex.stack);
        __onprocessinitfailed();
        cb(OSjs.API._('ERR_APP_INIT_FAILED_FMT', name, ex.toString()), ex);
        return;
      }

      cb(false, true);
    }

    if ( !name ) {
      err = 'Cannot API::launch() witout a application name';
      _onError(err);
      throw new Error(err);
    }

    if ( !metadata ) {
      err = OSjs.API._('ERR_APP_LAUNCH_MANIFEST_FAILED_FMT', name);
      _onError(err);
      throw new Error(err);
    }

    console.group('API::launch()', {
      name: name,
      args: args,
      metadata: metadata,
      preloads: preloads
    });

    if ( args.__preload__ ) { // This is for relaunch()
      pargs = args.__preload__;
      delete args.__preload__;
    }

    // Main blob
    try {
      _preLaunch(function() {
        _preload(function(err, res) {
          if ( err ) {
            _onError(err, res);
          } else {
            try {
              _createProcess(function(err, res) {
                if ( err ) {
                  _onError(err, res);
                } else {
                  try {
                    _onFinished(res);
                  } catch ( e ) {
                    _onError(e.toString(), e);
                  }
                }
              });
            } catch ( e ) {
              _onError(e.toString(), e);
            }
          }
        });
      });
    } catch ( e ) {
      _onError(e.toString());
    }
  };

  /**
   * Launch Processes from a List
   *
   * @function launchList
   * @memberof OSjs.API
   * @see OSjs.API.launch
   *
   * @param   {Array}         list        List of launch application arguments
   * @param   {Function}      onSuccess   Callback on success => fn(app, metadata, appName, appArgs)
   * @param   {Function}      onError     Callback on error => fn(error, appName, appArgs)
   * @param   {Function}      onFinished  Callback on finished running => fn()
   */
  API.launchList = function _apiLaunchList(list, onSuccess, onError, onFinished) {
    list        = list        || []; /* idx => {name: 'string', args: 'object', data: 'mixed, optional'} */
    onSuccess   = onSuccess   || function() {};
    onError     = onError     || function() {};
    onFinished  = onFinished  || function() {};

    Utils.asyncs(list, function(s, current, next) {
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
        console.warn('API::launchList() next()', 'No application name defined');
        next();
        return;
      }

      OSjs.API.launch(aname, aargs, function(app, metadata) {
        onSuccess(app, metadata, aname, aargs);
        next();
      }, function(err, name, args) {
        console.warn('API::launchList() _onError()', err);
        onError(err, name, args);
        next();
      });
    }, onFinished);
  };

  /////////////////////////////////////////////////////////////////////////////
  // RESOURCE API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get a resource from application
   *
   * @function getApplicationResource
   * @memberof OSjs.API
   *
   * @param   {OSjs.Core.Process}   app     Application instance reference. You can also specify a name by String
   * @param   {String}              name    Resource Name
   * @param   {Boolean}             vfspath Return a valid VFS path
   *
   * @return  {String}            The absolute URL of resource
   */
  API.getApplicationResource = function _apiGetAppResource(app, name, vfspath) {
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

    function getResultPath(path, userpkg) {
      path = Utils.checkdir(path);

      if ( vfspath ) {
        if ( userpkg ) {
          path = path.substr(OSjs.API.getConfig('Connection.FSURI').length);
        } else {
          path = 'osjs:///' + path;
        }
      }

      return path;
    }

    function getResourcePath() {
      var appname = getName();
      var path = '';

      var root, sub;
      if ( appname ) {
        if ( appname.match(/^(.*)\/(.*)$/) ) {
          root = OSjs.API.getConfig('Connection.PackageURI');
          path = root + '/' + appname + '/' + name;
        } else {
          root = OSjs.API.getConfig('Connection.FSURI');
          sub = OSjs.API.getConfig('PackageManager.UserPackages');
          path = root + '/get/' + Utils.pathJoin(sub, appname, name);
        }
      }

      return getResultPath(path, !!sub);
    }

    return getResourcePath();
  };

  /**
   * Get path to css theme
   *
   * @function getThemeCSS
   * @memberof OSjs.API
   *
   * @param   {String}    name    CSS Stylesheet name (without extension)
   *
   * @return  {String}            The absolute URL of css file
   */
  API.getThemeCSS = function _apiGetThemeCSS(name) {
    var root = OSjs.API.getConfig('Connection.RootURI', '/');
    if ( name === null ) {
      return root + 'blank.css';
    }

    root = OSjs.API.getConfig('Connection.ThemeURI');
    return Utils.checkdir(root + '/' + name + '.css');
  };

  /**
   * Get a icon based in file and mime
   *
   * @function getFileIcon
   * @memberof OSjs.API
   *
   * @param   {File}      file            File Data (see supported types)
   * @param   {String}    [size=16x16]    Icon size
   * @param   {String}    [icon]          Default icon
   *
   * @return  {String}            The absolute URL to the icon
   */
  API.getFileIcon = function _apiGetFileIcon(file, size, icon) {
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
  };

  /**
   * Default method for getting a resource from current theme
   *
   * @function getThemeResource
   * @memberof OSjs.API
   *
   * @param   {String}    name    Resource filename
   * @param   {String}    type    Type ('base' or a sub-folder)
   *
   * @return  {String}            The absolute URL to the resource
   */
  API.getThemeResource = function _apiGetThemeResource(name, type) {
    name = name || null;
    type = type || null;

    var root = OSjs.API.getConfig('Connection.ThemeURI');
    if ( !root.match(/^\//) ) {
      root = window.location.pathname + root;
    }

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

    return Utils.checkdir(name);
  };

  /**
   * Default method for getting a sound from theme
   *
   * @function getSound
   * @memberof OSjs.API
   *
   * @param   {String}    name    Resource filename
   *
   * @return  {String}            The absolute URL to the resource
   */
  API.getSound = function _apiGetSound(name) {
    name = name || null;
    if ( name ) {
      var wm = OSjs.Core.getWindowManager();
      var theme = wm ? wm.getSoundTheme() : 'default';
      var root = OSjs.API.getConfig('Connection.SoundURI');
      var compability = Utils.getCompability();
      if ( !name.match(/^\//) ) {
        var ext = 'oga';
        if ( !compability.audioTypes.ogg ) {
          ext = 'mp3';
        }
        name = root + '/' + theme + '/' + name + '.' + ext;
      }
    }
    return Utils.checkdir(name);
  };

  /**
   * Default method for getting a icon from theme
   *
   * @function getIcon
   * @memberof OSjs.API
   *
   * @param   {String}              name          Resource filename
   * @param   {String}              [size=16x16]  Icon size
   * @param   {OSjs.Core.Process}   [app]         Application instance reference. Can also be String. For `name` starting with './'
   *
   * @return  {String}            The absolute URL to the resource
   */
  API.getIcon = function _apiGetIcon(name, size, app) {
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

    return Utils.checkdir(name);
  };

  /**
   * Method for getting a config parameter by path (Ex: "VFS.Mountpoints.shared.enabled")
   *
   * @function getConfig
   * @memberof OSjs.API
   * @see OSjs.Core.getConfig
   *
   * @param   {String}    [path]                        Path
   * @param   {Mixed}     [defaultValue=undefined]      Use default value
   *
   * @return  {Mixed}             Parameter value or entire tree on no path
   */
  API.getConfig = function _apiGetConfig(path, defaultValue) {
    var config = Utils.cloneObject(OSjs.Core.getConfig());
    if ( typeof path === 'string' ) {
      var result = window.undefined;
      var queue = path.split(/\./);
      var ns = config;

      queue.forEach(function(k, i) {
        if ( i >= queue.length - 1 ) {
          if ( ns ) {
            result = ns[k];
          }
        } else {
          ns = ns[k];
        }
      });

      if ( typeof result === 'undefined' && typeof defaultValue !== 'undefined' ) {
        return defaultValue;
      }

      return result;
    }
    return config;
  };

  /**
   * Get default configured path
   *
   * @function getDefaultPath
   * @memberof OSjs.API
   *
   * @param   {String}    fallback      Fallback path on error (default= "osjs:///")
   * @return  {String}
   */
  API.getDefaultPath = function _apiGetDefaultPath(fallback) {
    if ( fallback && fallback.match(/^\//) ) {
      fallback = null;
    }
    return OSjs.API.getConfig('VFS.Home') || fallback || 'osjs:///';
  };

  /////////////////////////////////////////////////////////////////////////////
  // GUI API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Create a new Desktop Notification
   *
   * @function createNotification
   * @memberof OSjs.API
   * @see OSjs.Core.WindowManager#notification
   */
  API.createNotification = function _apiCreateNotification(opts) {
    var wm = OSjs.Core.getWindowManager();
    return wm.notification(opts);
  };

  /**
   * Create a new dialog
   *
   * You can also pass a function as `className` to return an instance of your own class
   *
   * @function createDialog
   * @memberof OSjs.API
   *
   * @param   {String}        className       Dialog Namespace Class Name
   * @param   {Object}        args            Arguments you want to send to dialog
   * @param   {Function}      callback        Callback on dialog action (close/ok etc) => fn(ev, button, result)
   * @param   {Mixed}         [parentObj]     A window or app (to make it a child window)
   *
   * @return  {OSjs.Core.Window}
   */
  API.createDialog = function _apiCreateDialog(className, args, callback, parentObj) {
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
      win._on('destroy', function() {
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
  };

  /**
   * Create (or show) loading indicator
   *
   * @function createLoading
   * @memberof OSjs.API
   *
   * @param   {String}    name          Name of notification (unique)
   * @param   {Object}    opts          Options
   * @param   {Number}    [panelId]     Panel ID
   *
   * @return  {String}                Or false on error
   */
  API.createLoading = function _apiCreateLoading(name, opts, panelId) {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      if ( wm.createNotificationIcon(name, opts, panelId) ) {
        return name;
      }
    }
    return false;
  };

  /**
   * Destroy (or hide) loading indicator
   *
   * @function destroyLoading
   * @memberof OSjs.API
   *
   * @param   {String}    name          Name of notification (unique)
   * @param   {Number}    [panelId]     Panel ID
   *
   * @return  {Boolean}
   */
  API.destroyLoading = function _apiDestroyLoading(name, panelId) {
    var wm = OSjs.Core.getWindowManager();
    if ( name ) {
      if ( wm ) {
        if ( wm.removeNotificationIcon(name, panelId) ) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Checks the given permission (groups) against logged in user
   *
   * @function checkPermission
   * @memberof OSjs.API
   *
   * @param   {Mixed}     group         Either a string or array of groups
   */
  API.checkPermission = function _apiCheckPermission(group) {
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
  };

  /**
   * Checks the given permission (groups) against logged in user
   *
   * Returns an object with the methods `update(precentage)` and `destroy()`
   *
   * @function createSplash
   * @memberof OSjs.API
   *
   * @param   {String}      name              The name to display
   * @param   {String}      icon              The icon to display
   * @param   {String}      [label=Starting]  The label
   * @param   {Node}        [parentEl]        The parent element
   *
   * @return  {Object}
   */
  API.createSplash = function _apiCreateSplash(name, icon, label, parentEl) {
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
        splash = Utils.$remove(splash);

        img = null;
        title = null;
        titleText = null;
        splashBar = null;
      },

      update: function(p, c) {
        if ( !splash || !splashBar ) {
          return;
        }

        var per = c ? 0 : 100;
        if ( c ) {
          per = (p / c) * 100;
        }
        (new OSjs.GUI.Element(splashBar)).set('value', per);
      }
    };
  };

  /////////////////////////////////////////////////////////////////////////////
  // MISC API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Global function for showing an error dialog
   *
   * @function error
   * @memberof OSjs.API
   *
   * @param   {String}    title               Dialog title
   * @param   {String}    message             Dialog message
   * @param   {String}    error               Error message
   * @param   {Object}    [exception]         Exception reference
   * @param   {Boolean}   [bugreport=false]   Enable bugreporting for this error
   */
  API.error = function _apiError(title, message, error, exception, bugreport) {
    bugreport = (function() {
      if ( OSjs.API.getConfig('BugReporting') ) {
        return typeof bugreport === 'undefined' ? false : (bugreport ? true : false);
      }
      return false;
    })();

    function _dialog() {
      var wm = OSjs.Core.getWindowManager();
      if ( wm && wm._fullyLoaded ) {
        try {
          OSjs.API.createDialog('Error', {
            title: title,
            message: message,
            error: error,
            exception: exception,
            bugreport: bugreport
          });

          return true;
        } catch ( e ) {
          console.warn('An error occured while creating Dialogs.Error', e);
          console.warn('stack', e.stack);
        }
      }

      return false;
    }

    OSjs.API.blurMenu();

    if ( exception && (exception.message.match(/^Script Error/i) && String(exception.lineNumber).match(/^0/)) ) {
      console.error('VENDOR ERROR', {
        title: title,
        message: message,
        error: error,
        exception: exception
      });
      return;
    }

    if ( OSjs.API.getConfig('MOCHAMODE') ) {
      console.error(title, message, error, exception);
    } else {
      if ( _dialog() ) {
        return;
      }

      window.alert(title + '\n\n' + message + '\n\n' + error);
    }
  };

  /**
   * Global function for playing a sound
   *
   * @function playSound
   * @memberof OSjs.API
   *
   * @param   {String}      name      Sound name
   * @param   {Number}      volume    Sound volume (0.0 - 1.0)
   *
   * @return {Audio}
   */
  API.playSound = function _apiPlaySound(name, volume) {
    var compability = Utils.getCompability();
    if ( !compability.audio ) {
      console.debug('API::playSound()', 'Browser has no support for sounds!');
      return false;
    }

    var wm = OSjs.Core.getWindowManager();
    if ( wm && !wm.getSetting('enableSounds') ) {
      console.debug('API::playSound()', 'Window Manager has disabled sounds!');
      return false;
    }

    if ( typeof volume === 'undefined' ) {
      volume = 1.0;
    }

    var f = OSjs.API.getSound(name);
    console.debug('API::playSound()', name, f);
    var a = new Audio(f);
    a.volume = volume;
    a.play();
    return a;
  };

  /**
   * Set the "clipboard" data
   *
   * NOTE: This does not set the operating system clipboard (yet...)
   *
   * @function setClipboard
   * @memberof OSjs.API
   *
   * @param   {Mixed}       data      What data to set
   */
  API.setClipboard = function _apiSetClipboard(data) {
    console.debug('OSjs.API.setClipboard()', data);
    _CLIPBOARD = data;
  };

  /**
   * Get the "clipboard" data
   *
   * NOTE: This does not the operating system clipboard (yet...)
   *
   * @function getClipboard
   * @memberof OSjs.API
   *
   * @return  {Mixed}
   */
  API.getClipboard = function _apiGetClipboard() {
    return _CLIPBOARD;
  };

  /**
   * Returns an instance of ServiceNotificationIcon
   *
   * This is the icon in the panel where external connections
   * etc gets a menu entry.
   *
   * @function getServiceNotificationIcon
   * @memberof OSjs.API
   *
   * @return  {ServiceNotificationIcon}
   */
  API.getServiceNotificationIcon = (function() {
    var _instance;

    return function _apiGetServiceNotificationIcon() {
      if ( !_instance ) {
        _instance = new ServiceNotificationIcon();
      }
      return _instance;
    };
  })();

  /**
   * Toggles fullscreen of an element
   *
   * @function toggleFullscreen
   * @memberof OSjs.API
   *
   * @param {Node}      el    The DOM Node
   * @param {Boolean}   [t]   Toggle value (auto-detected)
   */
  API.toggleFullscreen = (function() {

    var _prev;

    function trigger(el, state) {
      function _request() {
        if ( el.requestFullscreen ) {
          el.requestFullscreen();
        } else if ( el.mozRequestFullScreen ) {
          el.mozRequestFullScreen();
        } else if ( el.webkitRequestFullScreen ) {
          el.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
      }

      function _restore() {
        if ( el.webkitCancelFullScreen ) {
          el.webkitCancelFullScreen();
        } else if ( el.mozCancelFullScreen ) {
          el.mozCancelFullScreen();
        } else if ( el.exitFullscreen ) {
          el.exitFullscreen();
        }
      }

      if ( el ) {
        if ( state ) {
          _request();
        } else {
          _restore();
        }
      }
    }

    return function _apiToggleFullscreen(el, t) {
      if ( typeof t === 'boolean' ) {
        trigger(el, t);
      } else {
        if ( _prev && _prev !== el ) {
          trigger(_prev, false);
        }

        trigger(el, _prev !== el);
      }

      _prev = el;
    };

  })();

  /////////////////////////////////////////////////////////////////////////////
  // MISC
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Signs the user out and shuts down OS.js
   *
   * @function signOut
   * @memberof OSjs.API
   */
  API.signOut = function _apiSignOut() {
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
  };

  /**
   * Method for triggering a hook
   *
   * @function triggerHook
   * @memberof OSjs.API
   *
   * @param   {String}    name      Hook name
   * @param   {Array}     args      List of arguments
   * @param   {Object}    thisarg   'this' ref
   */
  API.triggerHook = function _apiTriggerHook(name, args, thisarg) {
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
  };

  /**
   * Method for adding a hook
   *
   * @function addHook
   * @memberof OSjs.API
   *
   * @param   {String}    name    Hook name
   * @param   {Function}  fn      Callback => fn()
   *
   * @return  {Number}       The index of hook
   */
  API.addHook = function _apiAddHook(name, fn) {
    if ( typeof _hooks[name] !== 'undefined' ) {
      return _hooks[name].push(fn) - 1;
    }
    return -1;
  };

  /**
   * Method for removing a hook
   *
   * @function removeHook
   * @memberof OSjs.API
   *
   * @param   {String}    name    Hook name
   * @param   {Number}    index     Hook index
   *
   * @return  {Boolean}
   */
  API.removeHook = function _apiRemoveHook(name, index) {
    if ( typeof _hooks[name] !== 'undefined' ) {
      if ( _hooks[name][index] ) {
        _hooks[name][index] = null;
        return true;
      }
    }
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXTERNALS
  /////////////////////////////////////////////////////////////////////////////

  API.shutdown = API.shutdown || function() {}; // init.js

  /**
   * @function createMenu
   * @memberof OSjs.API
   * @see OSjs.GUI.Helpers.createMenu
   */
  API.createMenu = function() {
    return OSjs.GUI.Helpers.createMenu.apply(null, arguments);
  };

  /**
   * @function blurMenu
   * @memberof OSjs.API
   * @see OSjs.GUI.Helpers.blurMenu
   */
  API.blurMenu = function() {
    return OSjs.GUI.Helpers.blurMenu.apply(null, arguments);
  };

})(OSjs.Utils, OSjs.API);
