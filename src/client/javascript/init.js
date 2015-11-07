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

  window.OSjs = window.OSjs || {};

  var handler    = null;
  var loaded     = false;
  var inited     = false;
  var signingOut = false;

  /////////////////////////////////////////////////////////////////////////////
  // COMPABILITY
  /////////////////////////////////////////////////////////////////////////////

  // Make sure these namespaces exist
  (['API', 'GUI', 'Core', 'Dialogs', 'Helpers', 'Applications', 'Locales', 'VFS']).forEach(function(ns) {
    OSjs[ns] = OSjs[ns] || {};
  });

  // For browsers without "console" for some reason
  (function() {
    window.console    = window.console    || {};
    console.log       = console.log       || function() {};
    console.debug     = console.debug     || console.log;
    console.error     = console.error     || console.log;
    console.warn      = console.warn      || console.log;
    console.group     = console.group     || console.log;
    console.groupEnd  = console.groupEnd  || console.log;
  })();

  // Compability
  (function() {
    if ( window.HTMLCollection ) {
      window.HTMLCollection.prototype.forEach = Array.prototype.forEach;
    }
    if ( window.NodeList ) {
      window.NodeList.prototype.forEach = Array.prototype.forEach;
    }
    if ( window.FileList ) {
      window.FileList.prototype.forEach = Array.prototype.forEach;
    }

    (function () {
      function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
      }


      if ( window.navigator.userAgent.match(/MSIE|Edge|Trident/) ) {
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
      }
    })();
  })();

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
    body_mousedown: function(ev) {
      ev.preventDefault();
      OSjs.API.blurMenu();
    },

    fullscreen: (function(){
      var icons = {};
      
      return function(e){
        if ( !document.fullScreen && !document.mozFullScreen && !document.webkitIsFullScreen && !document.msFullscreenElement ) {
          if( !icons['enter'] ){
            icons['enter'] = OSjs.API.getIcon('actions/gtk-fullscreen.png', '16x16');
          }
          document.getElementsByClassName('NotificationArea__FullscreenNotification')[0].childNodes[0].src = icons['enter'];
          
        }
        else{
          if( !icons['exit'] ){
            icons['exit'] = OSjs.API.getIcon('actions/gtk-leave-fullscreen.png', '16x16');
          }
          document.getElementsByClassName('NotificationArea__FullscreenNotification')[0].childNodes[0].src = icons['exit'];
        }
      };
    })(),

    mousedown: function(ev) {
      var wm = OSjs.Core.getWindowManager();
      var win = wm ? wm.getCurrentWindow() : null;
      if ( win ) {
        win._blur();
      }
    },

    keydown: function(ev) {
      var wm  = OSjs.Core.getWindowManager();
      var win = wm ? wm.getCurrentWindow() : null;

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

      if ( checkPrevent() ) {
        ev.preventDefault();
      }

      // WindowManager and Window must always recieve events
      if ( wm ) {
        wm.onKeyDown(ev, win);

        if ( win ) {
          return win._onKeyEvent(ev, 'keydown');
        }
      }

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
      if ( signingOut ) { return; }

      try {
        var config = OSjs.Core.getConfig();
        if ( config.ShowQuitWarning ) {
          return OSjs.API._('MSG_SESSION_WARNING');
        }
      } catch ( e ) {}
    },

    resize: (function() {
      var _timeout;

      function _resize(ev) {
        var wm = OSjs.Core.getWindowManager();
        if ( !wm ) { return; }
        wm.resize(ev, wm.getWindowSpace());
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
    var config = OSjs.Core.getConfig();
    var append = config.VersionAppend;

    var ver = config.Version || 'unknown verion';
    var cop = 'Copyright © 2011-2015 ';
    var lnk = document.createElement('a');
    lnk.href = 'mailto:andersevenrud@gmail.com';
    lnk.appendChild(document.createTextNode('Anders Evenrud'));

    var el = document.createElement('div');
    el.id = 'DebugNotice';
    el.appendChild(document.createTextNode(OSjs.Utils.format('OS.js {0}', ver)));
    el.appendChild(document.createElement('br'));
    el.appendChild(document.createTextNode(cop));
    el.appendChild(lnk);
    if ( append ) {
      el.appendChild(document.createElement('br'));
      el.innerHTML += append;
    }

    document.getElementById('LoadingScreen').style.display = 'none';

    document.body.appendChild(el);
  }

  /**
   * Initializes handler
   */
  function initHandler(config, callback) {
    handler = new OSjs.Core.Handler();
    handler.init(function() {
      if ( inited ) {
        return;
      }
      inited = true;

      handler.boot(function(result, error) {
        if ( error ) {
          onError(error);
          return;
        }

        callback();
      });
    });
  }

  /**
   * Initializes events
   */
  function initEvents() {
    document.body.addEventListener('contextmenu', events.body_contextmenu, false);
    document.body.addEventListener('mousedown', events.body_mousedown, false);
    document.addEventListener('keydown', events.keydown, true);
    document.addEventListener('keypress', events.keypress, true);
    document.addEventListener('keyup', events.keyup, true);
    document.addEventListener('mousedown', events.mousedown, false);
    window.addEventListener('resize', events.resize, false);
    window.addEventListener('scroll', events.scroll, false);
    window.addEventListener('fullscreenchange', events.fullscreen, false);
    window.addEventListener('mozfullscreenchange', events.fullscreen, false);
    window.addEventListener('webkitfullscreenchange', events.fullscreen, false);
    window.addEventListener('msfullscreenchange', events.fullscreen, false);
    window.onbeforeunload = events.beforeunload;

    window.onerror = function(message, url, linenumber, column, exception) {
      if ( typeof exception === 'string' ) {
        exception = null;
      }
      console.warn('window::onerror()', arguments);
      OSjs.API.error(OSjs.API._('ERR_JAVASCRIPT_EXCEPTION'),
                    OSjs.API._('ERR_JAVACSRIPT_EXCEPTION_DESC'),
                    OSjs.API._('BUGREPORT_MSG'),
                    exception || {name: 'window::onerror()', fileName: url, lineNumber: linenumber+':'+column, message: message},
                    true );

      return false;
    };
  }

  /**
   * Preloads configured files
   */
  function initPreload(config, callback) {
    var preloads = config.Preloads;
    preloads.forEach(function(val, index) {
      val.src = OSjs.Utils.checkdir(val.src);
    });

    OSjs.Utils.preload(preloads, function(total, errors, failed) {
      if ( errors ) {
        console.warn('doInitialize()', errors, 'preloads failed to load:', failed);
      }

      setTimeout(function() {
        callback();
      }, 0);
    });
  }

  /**
   * Initalizes the VFS
   */
  function initVFS(config, callback) {
    if ( OSjs.VFS.registerMounts ) {
      OSjs.VFS.registerMounts();
    }
    callback();
  }

  /**
   * Initializes the Window Manager
   */
  function initWindowManager(config, callback) {
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
    OSjs.API.playSound('service-login');

    var wm = OSjs.Core.getWindowManager();

    function autostart() {
      var config = OSjs.Core.getConfig();
      var start = [];

      try {
        start = config.System.AutoStart;
      } catch ( e ) {
        console.warn('doAutostart() exception', e, e.stack);
      }

      console.info('doAutostart()', start);
      OSjs.API.launchList(autostart);
    }

    handler.loadSession(function() {
      setTimeout(function() {
        events.resize();
      }, 500);


      callback();

      wm.onSessionLoaded();

      autostart();
    });
  }

  /**
   * Wrapper for initializing OS.js
   */
  function init() {
    var config = OSjs.Core.getConfig();

    initLayout();

    initHandler(config, function() {
      OSjs.API.triggerHook('onInitialize');

      initPreload(config, function() {
        OSjs.API.triggerHook('onInited');

        initVFS(config, function() {
          initWindowManager(config, function() {
            OSjs.API.triggerHook('onWMInited');

            OSjs.Utils.$remove(document.getElementById('LoadingScreen'));

            initEvents();
            var wm = OSjs.Core.getWindowManager();
            wm._fullyLoaded = true;

            initSession(config, function() {
              OSjs.API.triggerHook('onSessionLoaded');
            });
          });
        });
      });
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Shuts down OS.js
   *
   * @api OSjs.API.shutdown()
   */
  OSjs.API.shutdown = function() {
    if ( !inited || !loaded ) {
      return;
    }

    signingOut = true;

    document.body.removeEventListener('contextmenu', events.body_contextmenu, false);
    document.body.removeEventListener('mousedown', events.body_mousedown, false);
    document.removeEventListener('keydown', events.keydown, true);
    document.removeEventListener('keypress', events.keypress, true);
    document.removeEventListener('keyup', events.keyup, true);
    document.removeEventListener('mousedown', events.mousedown, false);
    window.removeEventListener('resize', events.resize, false);
    window.removeEventListener('scroll', events.scroll, false);

    window.onerror = null;
    window.onbeforeunload = null;

    OSjs.API.blurMenu();
    OSjs.API.killAll();

    var ring = OSjs.API.getServiceNotificationIcon();
    if ( ring ) {
      ring.destroy();
    }

    var handler = OSjs.Core.getHandler();
    if ( handler ) {
      handler.destroy();
      handler = null;
    }

    console.warn('OS.js was shut down!');

    if ( window.require ) {
      try {
        var gui = require('nw.gui');
        var win = gui.Window.get();
        setTimeout(function() {
          win.close();
        }, 500);
      } catch ( e ) {}
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // FILLERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get default configured settings
   *
   * THIS IS JUST A PLACEHOLDER. 'settings.js' SHOULD HAVE THIS!
   *
   * @return  Object
   *
   * @api     OSjs.Core.getConfig()
   */
  OSjs.Core.getConfig = OSjs.Core.getConfig || function() {
    return {};
  };

  /**
   * Get default configured packages
   *
   * THIS IS JUST A PLACEHOLDER. 'packages.js' SHOULD HAVE THIS!
   *
   * @return  Object
   *
   * @api     OSjs.Core.getMetadata()
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
