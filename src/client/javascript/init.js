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
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
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

  /**
   * @namespace Core
   * @memberof OSjs
   */

  /**
   * @namespace Utils
   * @memberof OSjs
   */

  /**
   * @namespace Helpers
   * @memberof OSjs
   */

  var handler    = null;
  var loaded     = false;
  var inited     = false;
  var signingOut = false;

  // Make sure these namespaces exist
  (['Utils', 'API', 'GUI', 'Core', 'Dialogs', 'Helpers', 'Applications', 'Locales', 'VFS', 'Extensions']).forEach(function(ns) {
    OSjs[ns] = OSjs[ns] || {};
  });

  (['Elements', 'Helpers']).forEach(function(ns) {
    OSjs.GUI[ns] = OSjs.GUI[ns] || {};
  });

  (['Helpers', 'Transports']).forEach(function(ns) {
    OSjs.VFS[ns] = OSjs.VFS[ns] || {};
  });

  /////////////////////////////////////////////////////////////////////////////
  // GLOBAL EVENTS
  /////////////////////////////////////////////////////////////////////////////

  var events = {
    body_contextmenu: function(ev) {
      ev.stopPropagation();
      if ( !OSjs.Utils.$isInput(ev) ) {
        ev.preventDefault();
        return false;
      }
      return true;
    },

    body_click: function(ev) {
      OSjs.API.blurMenu();

      if ( ev.target === document.body ) {
        var wm = OSjs.Core.getWindowManager();
        var win = wm ? wm.getCurrentWindow() : null;
        if ( win ) {
          win._blur();
        }
      }
    },

    message: function(ev) {
      if ( ev && ev.data && typeof ev.data.wid !== 'undefined' && typeof ev.data.pid !== 'undefined' ) {
        console.debug('window::message()', ev.data);
        var proc = OSjs.API.getProcess(ev.data.pid);
        if ( proc ) {
          if ( typeof proc.onPostMessage === 'function' ) {
            proc.onPostMessage(ev.data.message, ev);
          }

          var win  = proc._getWindow(ev.data.wid, 'wid');
          if ( win ) {
            win.onPostMessage(ev.data.message, ev);
          }
        }
      }
    },

    fullscreen: function(ev) {
      var notif = OSjs.Core.getWindowManager().getNotificationIcon('_FullscreenNotification');
      if ( notif ) {
        if ( !document.fullScreen && !document.mozFullScreen && !document.webkitIsFullScreen && !document.msFullscreenElement ) {
          notif.opts._isFullscreen = false;
          notif.setImage(OSjs.API.getIcon('actions/gtk-fullscreen.png', '16x16'));
        } else {
          notif.opts._isFullscreen = true;
          notif.setImage(OSjs.API.getIcon('actions/gtk-leave-fullscreen.png', '16x16'));
        }
      }
    },

    keydown: function(ev) {
      var wm  = OSjs.Core.getWindowManager();
      var win = wm ? wm.getCurrentWindow() : null;

      function sendKey(special) {
        if ( wm ) {
          wm.onKeyDown(ev, win, special);
          if ( win ) {
            return win._onKeyEvent(ev, 'keydown', special);
          }
        }
      }

      function checkPrevent() {
        var d = ev.srcElement || ev.target;
        var doPrevent = d.tagName === 'BODY' ? true : false;

        // We don't want backspace and tab triggering default browser events
        if ( (ev.keyCode === OSjs.Utils.Keys.BACKSPACE) && !OSjs.Utils.$isInput(ev) ) {
          doPrevent = true;
        } else if ( (ev.keyCode === OSjs.Utils.Keys.TAB) && OSjs.Utils.$isFormElement(ev) ) {
          doPrevent = true;
        }

        // Only prevent default event if current window is not set up to capture them by force
        if ( doPrevent && (!win || !win._properties.key_capture) ) {
          return true;
        }

        return false;
      }

      function checkShortcut() {
        if ( ((ev.keyCode === 115 || ev.keyCode === 83) && ev.ctrlKey) || ev.keyCode === 19 ) {
          if ( ev.shiftKey ) {
            return 'saveas';
          } else {
            return 'save';
          }
        } else if ( (ev.keyCode === 79 || ev.keyCode === 83) && ev.ctrlKey ) {
          return 'open';
        }
        return false;
      }

      var shortcut = checkShortcut();
      if ( checkPrevent() || shortcut ) {
        ev.preventDefault();
      }

      // WindowManager and Window must always recieve events
      sendKey(shortcut);

      return true;
    },
    keypress: function(ev) {
      var wm = OSjs.Core.getWindowManager();

      if ( wm ) {
        var win = wm.getCurrentWindow();
        if ( win ) {
          return win._onKeyEvent(ev, 'keypress');
        }
      }
      return true;
    },
    keyup: function(ev) {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.onKeyUp(ev, wm.getCurrentWindow());

        var win = wm.getCurrentWindow();
        if ( win ) {
          return win._onKeyEvent(ev, 'keyup');
        }
      }
      return true;
    },

    beforeunload: function(ev) {
      if ( signingOut ) {
        return;
      }

      try {
        if ( OSjs.API.getConfig('ShowQuitWarning') ) {
          return OSjs.API._('MSG_SESSION_WARNING');
        }
      } catch ( e ) {}
    },

    resize: (function() {
      var _timeout;

      function _resize(ev, wasInited) {
        var wm = OSjs.Core.getWindowManager();
        if ( !wm ) {
          return;
        }

        wm.resize(ev, wm.getWindowSpace(), wasInited);
      }

      return function(ev, wasInited) {
        if ( _timeout ) {
          clearTimeout(_timeout);
          _timeout = null;
        }

        var self = this;
        _timeout = setTimeout(function() {
          _resize.call(self, ev, wasInited);
        }, 100);
      };
    })(),

    scroll: function(ev) {
      if ( ev.target === document || ev.target === document.body ) {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
      }

      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
      return true;
    },

    hashchange: function(ev) {
      var hash = window.location.hash.substr(1);
      var spl = hash.split(/^([\w\.\-_]+)\:(.*)/);

      function getArgs(q) {
        var args = {};
        q.split('&').forEach(function(a) {
          var b = a.split('=');
          var k = decodeURIComponent(b[0]);
          args[k] = decodeURIComponent(b[1] || '');
        });
        return args;
      }

      if ( spl.length === 4 ) {
        var root = spl[1];
        var args = getArgs(spl[2]);

        if ( root ) {
          OSjs.API.getProcess(root).forEach(function(p) {
            p._onMessage('hashchange', {
              hash: hash,
              args: args
            }, {source: null});
          });
        }
      }
    },

    orientationchange: function(ev) {
      var orientation = 'landscape';

      if ( window.screen && window.screen.orientation ) {
        if ( window.screen.orientation.type.indexOf('portrait') !== -1 ) {
          orientation = 'portrait';
        }
      }

      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.onOrientationChange(ev, orientation);
      }

      document.body.setAttribute('data-orientation', orientation);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // INITIALIZERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * When an error occurs
   */
  function onError(msg) {
    OSjs.API.error(OSjs.API._('ERR_CORE_INIT_FAILED'), OSjs.API._('ERR_CORE_INIT_FAILED_DESC'), msg, null, true);
  }

  /**
   * Initialized some layout stuff
   */
  function initLayout() {
    console.debug('initLayout()');

    if ( OSjs.API.getConfig('Watermark.enabled') ) {
      var ver = OSjs.API.getConfig('Version', 'unknown version');
      var html = OSjs.API.getConfig('Watermark.lines') || [];

      var el = document.createElement('div');
      el.id = 'DebugNotice';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = html.join('<br />').replace(/%VERSION%/, ver);

      document.body.appendChild(el);
    }

    document.getElementById('LoadingScreen').style.display = 'none';
  }

  /**
   * Initializes handler
   */
  function initHandler(config, callback) {
    console.debug('initHandler()');

    handler = new OSjs.Core.Handler();

    function _done(error) {
      if ( error ) {
        onError(error);
        return;
      }

      if ( !inited ) {
        if ( !handler.loggedIn ) {
          if ( confirm(OSjs.API._('ERR_NO_SESSION')) ) {
            handler.init(_done);
          }
          return;
        }
      }

      inited = true;

      callback();
    }

    handler.init(_done);
  }

  /**
   * Initializes events
   */
  function initEvents() {
    console.debug('initEvents()');

    document.body.addEventListener('contextmenu', events.body_contextmenu, false);
    document.body.addEventListener('click', events.body_click, false);
    document.addEventListener('keydown', events.keydown, true);
    document.addEventListener('keypress', events.keypress, true);
    document.addEventListener('keyup', events.keyup, true);
    window.addEventListener('orientationchange', events.orientationchange, false);
    window.addEventListener('hashchange', events.hashchange, false);
    window.addEventListener('resize', events.resize, false);
    window.addEventListener('scroll', events.scroll, false);
    window.addEventListener('fullscreenchange', events.fullscreen, false);
    window.addEventListener('mozfullscreenchange', events.fullscreen, false);
    window.addEventListener('webkitfullscreenchange', events.fullscreen, false);
    window.addEventListener('msfullscreenchange', events.fullscreen, false);
    window.addEventListener('message', events.message, false);
    window.onbeforeunload = events.beforeunload;

    events.orientationchange();

    window.onerror = function(message, url, linenumber, column, exception) {
      if ( typeof exception === 'string' ) {
        exception = null;
      }
      console.warn('window::onerror()', arguments);
      OSjs.API.error(OSjs.API._('ERR_JAVASCRIPT_EXCEPTION'),
                    OSjs.API._('ERR_JAVACSRIPT_EXCEPTION_DESC'),
                    OSjs.API._('BUGREPORT_MSG'),
                    exception || {name: 'window::onerror()', fileName: url, lineNumber: linenumber + ':' + column, message: message},
                    true );

      return false;
    };
  }

  /**
   * Preloads configured files
   */
  function initPreload(config, callback) {
    console.debug('initPreload()');
    var list = [];

    function flatten(a) {
      a.forEach(function(i) {
        if ( i instanceof Array ) {
          flatten(i);
        } else {
          if ( typeof i === 'string' ) {
            i = OSjs.Utils.checkdir(i);
          } else {
            i.src = OSjs.Utils.checkdir(i.src);
          }
          list.push(i);
        }
      });
    }

    flatten(config.Preloads);

    OSjs.Utils.preload(list, function(total, failed) {
      if ( failed.length ) {
        console.warn('doInitialize()', 'some preloads failed to load:', failed);
      }

      setTimeout(function() {
        callback();
      }, 0);
    });
  }

  /**
   * Loads all extensions
   */
  function initExtensions(config, callback) {
    var exts = Object.keys(OSjs.Extensions);
    var manifest =  OSjs.Core.getMetadata();

    console.group('initExtensions()', exts);
    OSjs.Utils.asyncs(exts, function(entry, idx, next) {
      try {
        var m = manifest[entry];
        OSjs.Extensions[entry].init(m, function() {
          next();
        });
      } catch ( e ) {
        console.warn('Extension init failed', e.stack, e);
        next();
      }
    }, function() {
      console.groupEnd();
      callback();
    });
  }

  /**
   * Initializes the SettingsManager pools
   * from configuration file(s)
   */
  function initSettingsManager(cfg, callback) {
    console.debug('initSettingsManager()');
    var pools = cfg.SettingsManager || {};
    var manager = OSjs.Core.getSettingsManager();

    Object.keys(pools).forEach(function(poolName) {
      console.debug('initSettingsManager()', 'initializes pool', poolName, pools[poolName]);
      manager.instance(poolName, pools[poolName] || {});
    });

    callback();
  }

  /**
   * Initializes the PackageManager
   */
  function initPackageManager(cfg, callback) {
    OSjs.Core.getPackageManager().load(function(result, error) {
      callback(error, result);
    });
  }

  /**
   * Initalizes the VFS
   */
  function initVFS(config, callback) {
    console.debug('initVFS()');

    OSjs.Core.getMountManager().init(callback);
  }

  /**
   * Initializes the Search Engine
   */
  function initSearch(config, callback) {
    console.debug('initSearch()');

    OSjs.Core.getSearchEngine().init(callback);
  }

  /**
   * Initializes the Window Manager
   */
  function initWindowManager(config, callback) {
    console.debug('initWindowManager()');
    if ( !config.WM || !config.WM.exec ) {
      onError(OSjs.API._('ERR_CORE_INIT_NO_WM'));
      return;
    }

    OSjs.API.launch(config.WM.exec, (config.WM.args || {}), function(app) {
      app.setup(callback);
    }, function(error, name, args, exception) {
      onError(OSjs.API._('ERR_CORE_INIT_WM_FAILED_FMT', error), exception);
    });
  }

  /**
   * Initializes the Session
   */
  function initSession(config, callback) {
    console.debug('initSession()');
    OSjs.API.playSound('service-login');

    var wm = OSjs.Core.getWindowManager();
    var list = [];

    // In this case we merge the Autostart and the previous session together.
    // This ensures that items with autostart are loaded with correct
    // session data on restore. This is much better than relying on the internal
    // event/message system which does not trigger until after everything is loaded...
    // this does everything beforehand! :)
    //
    try {
      list = config.AutoStart;
    } catch ( e ) {
      console.warn('initSession()->autostart()', 'exception', e, e.stack);
    }

    var checkMap = {};
    var skipMap = [];
    list.forEach(function(iter, idx) {
      if ( typeof iter === 'string' ) {
        iter = list[idx] = {name: iter};
      }
      if ( skipMap.indexOf(iter.name) === -1 ) {
        if ( !checkMap[iter.name] ) {
          checkMap[iter.name] = idx;
          skipMap.push(iter.name);
        }
      }
    });

    handler.getLastSession(function(err, adds) {
      if ( !err ) {
        adds.forEach(function(iter) {
          if ( typeof checkMap[iter.name] === 'undefined' ) {
            list.push(iter);
          } else {
            if ( iter.args ) {
              var refid = checkMap[iter.name];
              var ref = list[refid];
              if ( !ref.args ) {
                ref.args = {};
              }
              ref.args = OSjs.Utils.mergeObject(ref.args, iter.args);
            }
          }
        });
      }

      console.info('initSession()->autostart()', list);

      OSjs.API.launchList(list, null, null, callback);
    });
  }

  /**
   * Client-side unit-testing
   */
  function initTestEnvironment(config, callback) {
    OSjs.Utils.preload([
      '/vendor/mocha/mocha.js',
      '/vendor/mocha/mocha.css',
      '/vendor/chai/chai.js'
    ], function() {
      // Add basic layout
      var h1 = document.createElement('h1');
      h1.style.margin = '20px';
      h1.appendChild(document.createTextNode('OS.js Mocha Client Test Suite'));
      document.body.appendChild(h1);

      var el = document.createElement('div');
      el.id = 'mocha';
      document.body.appendChild(el);

      // Reset certain styles
      document.body.style.background = '#fff';
      document.body.style.overflow = 'auto';

      // Init mocha interfaces
      window.mocha.ui('bdd');
      window.mocha.reporter('html');

      // Create mock Window Manager
      (new OSjs.Core.WindowManager('MochaWM', null, {}, {}, {})).init();

      // Load default themes
      OSjs.Utils.$createCSS(OSjs.API.getThemeCSS('default'));

      // Load and run tests
      OSjs.Utils.preload(['/client/test/test.js'], callback);
    });

    return true;
  }

  /**
   * Wrapper for initializing OS.js
   */
  function init() {
    console.group('init()');

    var config = OSjs.Core.getConfig();
    var splash = document.getElementById('LoadingScreen');
    var loading = OSjs.API.createSplash('OS.js', null, null, splash);
    var freeze = ['API', 'Core', 'Dialogs', 'Extensions', 'GUI', 'Helpers', 'Locales', 'Utils', 'VFS'];
    var queue = [
      initPreload,
      initHandler,
      initVFS,
      initPackageManager,
      initExtensions,
      initSettingsManager,
      initSearch,
      function(cfg, cb) {
        return OSjs.GUI.DialogScheme.init(cb);
      }
    ];

    function _inited() {
      loading = loading.destroy();
      splash = OSjs.Utils.$remove(splash);

      var wm = OSjs.Core.getWindowManager();
      wm._fullyLoaded = true;

      OSjs.API.triggerHook('onWMInited');

      console.groupEnd();
    }

    function _done() {
      OSjs.API.triggerHook('onInited');

      loading.update(queue.length - 1, queue.length + 1);

      freeze.forEach(function(f) {
        if ( typeof OSjs[f] === 'object' ) {
          Object.freeze(OSjs[f]);
        }
      });

      if ( config.DEVMODE || config.MOCHAMODE ) {
        _inited();
      }

      if ( config.MOCHAMODE ) {
        window.mocha.run();
      } else {
        initWindowManager(config, function() {
          initEvents();

          _inited();

          initSession(config, function() {
            OSjs.API.triggerHook('onSessionLoaded');
          });
        });
      }
    }

    initLayout();

    if ( config.MOCHAMODE ) {
      queue.push(initTestEnvironment);
    }

    OSjs.Utils.asyncs(queue, function(entry, index, next) {
      if ( index < 1 ) {
        OSjs.API.triggerHook('onInitialize');
      }

      loading.update(index + 1, queue.length + 1);

      entry(config, next);
    }, _done);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Shuts down OS.js
   *
   * @function shutdown
   * @memberof OSjs.API
   */
  OSjs.API.shutdown = function() {
    if ( !inited || !loaded ) {
      return;
    }

    signingOut = true;

    document.body.removeEventListener('contextmenu', events.body_contextmenu, false);
    document.body.removeEventListener('click', events.body_click, false);
    document.removeEventListener('keydown', events.keydown, true);
    document.removeEventListener('keypress', events.keypress, true);
    document.removeEventListener('keyup', events.keyup, true);
    window.removeEventListener('orientationchange', events.orientationchange, false);
    window.removeEventListener('hashchange', events.hashchange, false);
    window.removeEventListener('resize', events.resize, false);
    window.removeEventListener('scroll', events.scroll, false);
    window.removeEventListener('message', events.message, false);

    window.onerror = null;
    window.onbeforeunload = null;

    OSjs.GUI.Scheme.clearCache();
    OSjs.API.toggleFullscreen();
    OSjs.API.blurMenu();
    OSjs.API.killAll();
    OSjs.GUI.DialogScheme.destroy();

    var ring = OSjs.API.getServiceNotificationIcon();
    if ( ring ) {
      ring.destroy();
    }

    var handler = OSjs.Core.getHandler();
    if ( handler ) {
      handler.destroy();
      handler = null;
    }

    OSjs.API.triggerHook('onShutdown');

    console.warn('OS.js was shut down!');

    if ( OSjs.API.getConfig('Connection.Type') === 'nw' ) {
      try {
        var gui = require('nw.gui');
        var win = gui.Window.get();
        setTimeout(function() {
          win.close();
        }, 500);
      } catch ( e ) {
      }
    } else {
      if ( OSjs.API.getConfig('ReloadOnShutdown') === true ) {
        window.location.reload();
      }
    }

    Object.keys(OSjs).forEach(function(k) {
      try {
        delete OSjs[k];
      } catch ( e ) {}
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // FILLERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get default configured settings
   *
   * THIS IS JUST A PLACEHOLDER. 'settings.js' SHOULD HAVE THIS!
   *
   * You should use 'OSjs.API.getConfig()' to get a setting
   *
   * @function getConfig
   * @memberof OSjs.Core
   * @see OSjs.API.getConfig
   *
   * @return  {Object}
   */
  OSjs.Core.getConfig = OSjs.Core.getConfig || function() {
    return {};
  };

  /**
   * Get default configured packages
   *
   * THIS IS JUST A PLACEHOLDER. 'packages.js' SHOULD HAVE THIS!
   *
   * @function getMetadata
   * @memberof OSjs.Core
   *
   * @return  {Metadata[]}
   */
  OSjs.Core.getMetadata = OSjs.Core.getMetadata || function() {
    return {};
  };

  /////////////////////////////////////////////////////////////////////////////
  // MAIN
  /////////////////////////////////////////////////////////////////////////////

  (function() {
    function onLoad() {
      if ( loaded ) {
        return;
      }
      loaded = true;
      init();
    }

    function onUnload() {
      OSjs.API.shutdown();
    }

    document.addEventListener('DOMContentLoaded', onLoad);
    document.addEventListener('load', onLoad);
    document.addEventListener('unload', onUnload);
  })();

})();
