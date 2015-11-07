/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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
    this.icon = null;
    this.element = null;

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

      wm.createNotificationIcon('ServiceNotificationIcon', {
        onContextMenu: show,
        onClick: show,
        onInited: function(el) {
          self.element = el;

          if ( el.firstChild ) {
            var img = document.createElement('img');
            img.src = OSjs.API.getIcon('status/gtk-dialog-authentication.png');
            el.firstChild.appendChild(img);
            self.icon = img;
            self._updateIcon();
          }
        }
      });
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
    this.element = null;
    this.icon = null;
  };

  ServiceNotificationIcon.prototype._updateIcon = function() {
    if ( this.element ) {
      this.element.style.display = this.size ? 'inline-block' : 'none';
    }
    if ( this.icon ) {
      this.icon.title = OSjs.API._('SERVICENOTIFICATION_TOOLTIP', this.size.toString());
      this.icon.alt   = this.icon.title;
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

    console.log('doSetLocale()', CurrentLocale);
  }

  /////////////////////////////////////////////////////////////////////////////
  // REQUEST API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Perform cURL call
   *
   * @param   Object    args      cURL Arguments (see backend)
   * @param   Function  callback  Callback function
   *                              fn(error, result)
   *
   * @return  void
   * @api     OSjs.API.curl()
   */
  function doCurl(args, callback) {
    args = args || {};
    callback = callback || {};

    doAPICall('curl', args.body, function(response) {
      if ( response && response.error ) {
        callback(response.error);
        return;
      }
      callback(false, response ? (response.result || null) : null);
    }, function(error) {
      callback(error);
    }, args.options);
  }

  /**
   * Global function for calling API (backend)
   *
   * @param   String    m       Method name
   * @param   Object    a       Method arguments
   * @param   Function  cok     Callback on success
   * @param   Function  cerror  Callback on error
   *
   * @return  void
   * @api     OSjs.API.call()
   */
  var doAPICall = (function() {
    var _cidx = 1;

    return function(m, a, cok, cerror) {
      var lname = 'APICall_' + _cidx;
      createLoading(lname, {className: 'BusyNotification', tooltip: 'API Call'});

      _cidx++;

      var handler = OSjs.Core.getHandler();
      return handler.callAPI(m, a, function() {
        destroyLoading(lname);
        cok.apply(this, arguments);
      }, function() {
        destroyLoading(lname);
        cerror.apply(this, arguments);
      });
    };
  })();

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

    console.group('doLaunchProcess()', n, arg);

    var splash = null;
    var handler = OSjs.Core.getHandler();
    var packman = OSjs.Core.getPackageManager();
    var compability = OSjs.Utils.getCompability();

    function createLaunchSplash(data, n) {
      var splash = null;
      var splashBar = null;

      if ( data.splash === false ) { return; }

      splash = document.createElement('application-splash');

      var icon = document.createElement('img');
      icon.alt = n;
      icon.src = OSjs.API.getIcon(data.icon);

      var titleText = document.createElement('b');
      titleText.appendChild(document.createTextNode(data.name));

      var title = document.createElement('span');
      title.appendChild(document.createTextNode('Launching '));
      title.appendChild(titleText);
      title.appendChild(document.createTextNode('...'));

      splashBar = document.createElement('gui-progress-bar');
      OSjs.GUI.Elements['gui-progress-bar'].build(splashBar);

      splash.appendChild(icon);
      splash.appendChild(title);
      splash.appendChild(splashBar);

      document.body.appendChild(splash);

      return {
        destroy: function() {
          OSjs.Utils.$remove(splash);
          splash = null;
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
        if ( typeof OSjs.Applications[n].Class !== 'undefined' ) {
          a = new OSjs.Applications[n].Class(arg, result);
        } else {
          a = new OSjs.Applications[n](arg, result);
        }
        a.__sname = n;

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

      // Only allow one instance if specified
      if ( _checkSingular(result) ) {
        _done();
        return;
      }

      // Create instance and restore settings
      var a = _createInstance(result);

      try {
        var settings = OSjs.Core.getSettingsManager().get(a.__pname) || {};
        a.init(settings, result, function() {
          setTimeout(function() {
            _done();
          }, 100);
        });
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

      // Just in case something goes wrong
      setTimeout(function() {
        _done();
      }, 30 * 1000);
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

      // Preload
      if ( !OSjs.Applications[n] ) {
        splash = createLaunchSplash(data, n);
      }
      createLoading(n, {className: 'StartupNotification', tooltip: 'Starting ' + n});

      /*
      if ( window.location.href.match(/^file\:\/\//) ) {
        data.preload.forEach(function(file, idx) {
          if ( file.src && file.src.match(/^\//) ) {
            file.src = file.src.replace(/^\//, '');
          }
        });
      }
      */

      OSjs.Utils.preload(data.preload, function(total, errors, failed) {
        destroyLoading(n);

        if ( errors ) {
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
      });

      return true;
    }

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

    function _onSuccess(app, metadata, appName, appArgs) {
      onSuccess(app, metadata, appName, appArgs);
      _onNext();
    }

    function _onError(err, appName, appArgs, exc) {
      console.warn('doLaunchProcessList() _onError()', err);
      if ( exc ) {
        console.warn(exc, exc.stack);
      }
      onError(err, appName, appArgs);
      _onNext();
    }

    var current = 0;
    function _onNext() {
      if ( current >= list.length ) {
        onFinished();
        return;
      }

      var s = list[current];
      current++;

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
        console.warn('doLaunchProcessList() _onNext()', 'No application name defined');
        return;
      }

      OSjs.API.launch(aname, aargs, function(app, metadata) {
        _onSuccess(app, metadata, aname, aargs);
      }, function(err, name, args) {
        _onError(err, name, args);
      });
    }

    _onNext();
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
    var path = '';
    var appname = null;
    var config = OSjs.Core.getConfig();

    name = name.replace(/^\.\//, '');

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

    var dir = new OSjs.VFS.File(OSjs.Core.getConfig());
    if ( appname ) {
      var root;
      if ( appname.match(/^(.*)\/(.*)$/) ) {
        root = OSjs.Core.getConfig().PackageURI;
        path = root + '/' + appname + '/' + name;
      } else {
        root = config.FSURI;
        path = root + OSjs.Utils.pathJoin(config.UserPackages, appname, name);
      }
    }

    return OSjs.Utils.checkdir(path);
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
    if ( name === null ) {
      var blank = OSjs.Core.getConfig().RootURI || '/';
      return blank + 'blank.css';
    }
    var root = OSjs.Core.getConfig().ThemeURI;
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
      {match: 'osjs/document', icon: 'mimetypes/gnome-mime-application-msword.png'},
      {match: 'osjs/draw', icon: 'mimetypes/image.png'},
      {match: 'application/zip', icon: 'mimetypes/folder_tar.png'},
      {match: 'application/x-python', icon: 'mimetypes/stock_script.png'},
      {match: 'application/javascript', icon: 'mimetypes/stock_script.png'},
      {match: 'text/html', icon: 'mimetypes/stock_script.png'},
      {match: 'text/xml', icon: 'mimetypes/stock_script.png'},
      {match: 'text/css', icon: 'mimetypes/stock_script.png'},

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

      map.forEach(function(iter) {
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
      var root = OSjs.Core.getConfig().ThemeURI;
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
      var root = OSjs.Core.getConfig().SoundURI;
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
      var wm = OSjs.Core.getWindowManager();
      var theme = wm ? wm.getIconTheme() : 'default';
      var root = OSjs.Core.getConfig().IconURI;
      var chk = checkIcon();
      if ( chk !== null ) {
        return chk;
      }
    }

    return OSjs.Utils.checkdir(name);
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
    var config = OSjs.Core.getConfig();
    if ( fallback && fallback.match(/^\//) ) {
      fallback = null;
    }
    return config.Home || fallback || 'osjs:///';
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
   * @param   String        className       Dialog Namespace Class Name
   * @param   Object        args            Arguments you want to send to dialog
   * @param   Function      callback        Callback on dialog action (close/ok etc)
   * @param   Mixed         parentObj       (Optional) A window or app (to make it a child window)
   *
   * @return  Window
   *
   * @api     OSjs.API.createDialog()
   */
  function doCreateDialog(className, args, callback, parentObj) {
    var win = new OSjs.Dialogs[className](args, callback);

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
   * Create a draggable DOM element
   *
   * @param   DOMElement    el      DOMElement
   * @param   Object        args    JSON of draggable params
   *
   * @return  void
   *
   * @api     OSjs.API.createDraggable()
   */
  function doCreateDraggable(el, args) {
    args = OSjs.Utils.argumentDefaults(args, {
      type       : null,
      effect     : 'move',
      data       : null,
      mime       : 'application/json',
      dragImage  : null,
      onStart    : function() { return true; },
      onEnd      : function() { return true; }
    });

    if ( OSjs.Utils.isIE() ) {
      args.mime = 'text';
    }

    function _toString(mime) {
      return JSON.stringify({
        type:   args.type,
        effect: args.effect,
        data:   args.data,
        mime:   args.mime
      });
    }

    function _dragStart(ev) {
      try {
        ev.dataTransfer.effectAllowed = args.effect;
        if ( args.dragImage && (typeof args.dragImage === 'function') ) {
          if ( ev.dataTransfer.setDragImage ) {
            var dragImage = args.dragImage(ev, el);
            if ( dragImage ) {
              var dragEl    = dragImage.element;
              var dragPos   = dragImage.offset;

              document.body.appendChild(dragEl);
              ev.dataTransfer.setDragImage(dragEl, dragPos.x, dragPos.y);
            }
          }
        }
        ev.dataTransfer.setData(args.mime, _toString(args.mime));
      } catch ( e ) {
        console.warn('Failed to dragstart: ' + e);
        console.warn(e.stack);
      }
    }

    el.setAttribute('draggable', 'true');
    el.addEventListener('dragstart', function(ev) {
      this.style.opacity = '0.4';
      if ( ev.dataTransfer ) {
        _dragStart(ev);
      }
      return args.onStart(ev, this, args);
    }, false);

    el.addEventListener('dragend', function(ev) {
      this.style.opacity = '1.0';
      return args.onEnd(ev, this, args);
    }, false);
  }

  /**
   * Create a droppable DOM element
   *
   * @param   DOMElement    el      DOMElement
   * @param   Object        args    JSON of droppable params
   *
   * @return  void
   *
   * @api     OSjs.API.createDroppable()
   */
  function doCreateDroppable(el, args) {
    args = OSjs.Utils.argumentDefaults(args, {
      accept         : null,
      effect         : 'move',
      mime           : 'application/json',
      files          : true,
      onFilesDropped : function() { return true; },
      onItemDropped  : function() { return true; },
      onEnter        : function() { return true; },
      onOver         : function() { return true; },
      onLeave        : function() { return true; },
      onDrop         : function() { return true; }
    });

    if ( OSjs.Utils.isIE() ) {
      args.mime = 'text';
    }

    function getParent(start, matcher) {
      if ( start === matcher ) { return true; }
      var i = 10;

      while ( start && i > 0 ) {
        if ( start === matcher ) {
          return true;
        }
        start = start.parentNode;
        i--;
      }
      return false;
    }

    function _onDrop(ev, el) {
      ev.stopPropagation();
      ev.preventDefault();

      args.onDrop(ev, el);
      if ( !ev.dataTransfer ) { return true; }

      if ( args.files ) {
        var files = ev.dataTransfer.files;
        if ( files && files.length ) {
          return args.onFilesDropped(ev, el, files, args);
        }
      }

      var data;
      try {
        data = ev.dataTransfer.getData(args.mime);
      } catch ( e ) {
        console.warn('Failed to drop: ' + e);
      }
      if ( data ) {
        var item = JSON.parse(data);
        if ( args.accept === null || args.accept === item.type ) {
          return args.onItemDropped(ev, el, item, args);
        }
      }

      return false;
    }

    el.addEventListener('drop', function(ev) {
      //Utils.$removeClass(el, 'onDragEnter');
      return _onDrop(ev, this);
    }, false);

    el.addEventListener('dragenter', function(ev) {
      //Utils.$addClass(el, 'onDragEnter');
      return args.onEnter.call(this, ev, this, args);
    }, false);

    el.addEventListener('dragover', function(ev) {
      ev.preventDefault();
      if ( !getParent(ev.target, el) ) {
        return false;
      }

      ev.stopPropagation();
      ev.dataTransfer.dropEffect = args.effect;
      return args.onOver.call(this, ev, this, args);
    }, false);

    el.addEventListener('dragleave', function(ev) {
      //Utils.$removeClass(el, 'onDragEnter');
      return args.onLeave.call(this, ev, this, args);
    }, false);
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
    group.forEach(function(g) {
      if ( userGroups.indexOf(g) < 0 ) {
        result = false;
      }
      return result;
    });
    return result;
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
    var config = OSjs.Core.getConfig();
    if ( config.BugReporting ) {
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
   * @param   Function  fn      Callback
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

  OSjs.API.getApplicationResource = doGetApplicationResource;
  OSjs.API.getThemeCSS            = doGetThemeCSS;
  OSjs.API.getIcon                = doGetIcon;
  OSjs.API.getFileIcon            = doGetFileIcon;
  OSjs.API.getThemeResource       = doGetThemeResource;
  OSjs.API.getSound               = doGetSound;

  OSjs.API.getDefaultPath         = doGetDefaultPath;

  OSjs.API.createDraggable        = doCreateDraggable;
  OSjs.API.createDroppable        = doCreateDroppable;
  OSjs.API.createMenu             = function() {}; // gui.js
  OSjs.API.blurMenu               = function() {}; // gui.js
  OSjs.API.createLoading          = createLoading;
  OSjs.API.destroyLoading         = destroyLoading;
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
