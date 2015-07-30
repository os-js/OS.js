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
   * List of Hooks:
   *     onInitialize             When OS.js is starting
   *     onInited                 When all resources has been loaded
   *     onWMInited               When Window Manager has started
   *     onSessionLoaded          After session has been loaded or restored
   *     onLogout                 When logout is requested
   *     onShutdown               When shutting down after successfull logout
   *     onApplicationLaunch      On application launch request
   *     onApplicationLaunched    When application has been launched
   */

  window.OSjs       = window.OSjs       || {};
  OSjs.Session      = OSjs.Session      || {};

  var signingOut = false;

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT HOOKS
  /////////////////////////////////////////////////////////////////////////////

  //
  // You can add hooks to your custom scripts to catch any of these events
  //

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

  /**
   * Method for triggering a hook
   *
   * @param   String    name      Hook name
   * @param   Array     args      List of arguments
   * @param   Object    thisarg   'this' ref
   *
   * @return  void
   * @api     OSjs.Session.triggerHook()
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
   * @api     OSjs.Session.addHook()
   * @see     session.js For a list of hooks
   */
  function doAddHook(name, fn) {
    if ( typeof _hooks[name] !== 'undefined' ) {
      _hooks[name].push(fn);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // INTERNAL VARIABLES AND FUNCTIONS
  /////////////////////////////////////////////////////////////////////////////

  var _$ROOT;             // Root element
  var _INITED = false;

  function onContextMenu(ev) {
    if ( !OSjs.Utils.$isInput(ev) ) {
      ev.preventDefault();
      return false;
    }
    return true;
  }

  function onMouseDown(ev) {
    ev.preventDefault();
    OSjs.API.blurMenu();
  }

  /////////////////////////////////////////////////////////////////////////////
  // API HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Creates the version stamp
   *
   * @return  void
   */
  function createVersionStamp() {
    var handler = OSjs.Core.getHandler();
    var append = handler.getConfig('Core').VersionAppend;

    var ver = OSjs.API.getDefaultSettings().Version || 'unknown verion';
    var cop = 'Copyright © 2011-2014 ';
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

    document.body.appendChild(el);
  }


  /////////////////////////////////////////////////////////////////////////////
  // EVENTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Global onResize Event
   *
   * @param   DOMEvent    ev      Event
   *
   * @return  void
   */
  var globalOnResize = (function() {
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
  })();

  /**
   * Global onMouseDown Event
   *
   * @param   DOMEvent    ev      Event
   *
   * @return  void
   */
  function globalOnMouseDown(ev) {
    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win ) {
      win._blur();
    }
  }

  /**
   * Global onScroll Event
   *
   * @param   DOMEvent    ev      Event
   *
   * @return  boolean
   */
  function globalOnScroll(ev) {
    if ( ev.target === document || ev.target === document.body || ev.target.id === 'Background' ) {
      ev.preventDefault();
      ev.stopPropagation();
      return false;
    }

    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
    return true;
  }

  /**
   * Global onKeyUp Event
   *
   * @param   DOMEvent    ev      Event
   *
   * @return  boolean
   */
  function globalOnKeyUp(ev) {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.onKeyUp(ev, wm.getCurrentWindow());

      var win = wm.getCurrentWindow();
      if ( win ) {
        return win._onKeyEvent(ev, 'keyup');
      }
    }
    return true;
  }

  /**
   * Global onKeyPress Event
   *
   * @param   DOMEvent    ev      Event
   *
   * @return  boolean
   */
  function globalOnKeyPress(ev) {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      var win = wm.getCurrentWindow();
      if ( win ) {
        return win._onKeyEvent(ev, 'keypress');
      }
    }
    return true;
  }

  /**
   * Global onKeyDown Event
   *
   * @param   DOMEvent    ev      Event
   *
   * @return  boolean
   */
  function globalOnKeyDown(ev) {
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
      if ( win ) {
        win._onKeyEvent(ev, 'keydown');
      }
      wm.onKeyDown(ev, win);
    }

    return true;
  }

  /**
   * Global onUnload Event
   *
   * @param   DOMEvent    ev      Event
   *
   * @return  void
   */
  function globalOnBeforeUnload(ev) {
    if ( signingOut ) { return; }

    try {
      var handler = OSjs.Core.getHandler();
      if ( handler.getConfig('Core').ShowQuitWarning ) {
        return OSjs.API._('MSG_SESSION_WARNING');
      }
    } catch ( e ) {}
  }

  /////////////////////////////////////////////////////////////////////////////
  // CORE FUNCTIONS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is the main initialization function
   * the first thing that is called after page has loaded
   *
   * @return  void
   * @api     OSjs.Session.init()
   */
  function doInitialize() {
    if ( _INITED ) { return; }

    var handler;

    function _error(msg) {
      OSjs.API.error(OSjs.API._('ERR_CORE_INIT_FAILED'), OSjs.API._('ERR_CORE_INIT_FAILED_DESC'), msg, null, true);
    }

    function _LaunchWM(callback) {
      var wm = handler.getConfig('WM');
      if ( !wm || !wm.exec ) {
        _error(OSjs.API._('ERR_CORE_INIT_NO_WM'));
        return;
      }

      var wargs = wm.args || {};
      OSjs.API.launch(wm.exec, wargs, function(app) {
        callback();
      }, function(error, name, args, exception) {
        _error(OSjs.API._('ERR_CORE_INIT_WM_FAILED_FMT', error), exception);
      });
    }

    function _Loaded() {
      OSjs.Session.triggerHook('onInited');

      if ( OSjs.VFS.registerMounts ) {
        OSjs.VFS.registerMounts();
      }

      _LaunchWM(function(/*app*/) {
        OSjs.Session.triggerHook('onWMInited');

        var splash = document.getElementById('LoadingScreen');
        if ( splash && splash.parentNode ) {
          splash.parentNode.removeChild(splash);
        }

        OSjs.API.playSound('service-login');

        var wm = OSjs.Core.getWindowManager();
        handler.onWMLaunched(wm, function() {

          handler.loadSession(function() {
            setTimeout(function() {
              globalOnResize();
            }, 500);

            OSjs.Session.triggerHook('onSessionLoaded');

            wm.onSessionLoaded();
            doAutostart();
          });
        });
      });
    }

    function _Preload(list, callback) {
      OSjs.Utils.preload(list, function(total, errors, failed) {
        if ( errors ) {
          /*
          _error(OSjs.API._('ERR_CORE_INIT_PRELOAD_FAILED'));
          return;
          */
          console.warn('doInitialize()', errors, 'preloads failed to load:', failed);
        }

        callback();
      });
    }

    function _Boot() {
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

      _$ROOT = document.createElement('div');
      _$ROOT.id = 'Background';
      _$ROOT.addEventListener('contextmenu', onContextMenu, false);
      _$ROOT.addEventListener('mousedown', onMouseDown, false);

      document.body.appendChild(_$ROOT);

      document.addEventListener('keydown', globalOnKeyDown, false);
      document.addEventListener('keypress', globalOnKeyPress, false);
      document.addEventListener('keyup', globalOnKeyUp, false);
      document.addEventListener('mousedown', globalOnMouseDown, false);
      window.addEventListener('resize', globalOnResize, false);
      window.addEventListener('scroll', globalOnScroll, false);
      window.onbeforeunload = globalOnBeforeUnload;
      //window.addEventListener('beforeunload', globalOnBeforeUnload, false);

      handler.boot(function(result, error) {

        if ( error ) {
          _error(error);
          return;
        }

        var preloads = handler.getConfig('Core').Preloads;
        preloads.forEach(function(val, index) {
          val.src = OSjs.Utils.checkdir(val.src);
        });

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
    handler = new OSjs.Core.Handler();
    handler.init(function() {
      if ( _INITED ) { return; }
      _INITED = true;

      createVersionStamp();

      OSjs.Session.triggerHook('onInitialize');

      _Boot();
    });
  }

  /**
   * Shut down OS.js
   *
   * @param   boolean     save      Save the current session ?
   *
   * @return  void
   * @api     OSjs.Session.destroy()
   */
  function doShutdown(save) {
    if ( !_INITED ) { return; }
    _INITED = false;

    signingOut = true;

    var handler = OSjs.Core.getHandler();

    function _Destroy() {
      OSjs.API.blurMenu();

      document.removeEventListener('keydown', globalOnKeyDown, false);
      document.removeEventListener('keypress', globalOnKeyPress, false);
      document.removeEventListener('keyup', globalOnKeyUp, false);
      document.removeEventListener('mousedown', globalOnMouseDown, false);
      window.removeEventListener('resize', globalOnResize, false);
      window.removeEventListener('scroll', globalOnScroll, false);
      window.onbeforeunload = null;
      //window.removeEventListener('beforeunload', globalOnBeforeUnload, false);

      if ( _$ROOT ) {
        _$ROOT.removeEventListener('contextmenu', onContextMenu, false);
        _$ROOT.removeEventListener('mousedown', onMouseDown, false);
      }


      OSjs.API.killAll();

      if ( _$ROOT && _$ROOT.parentNode ) {
        _$ROOT.parentNode.removeChild(_$ROOT);
        _$ROOT = null;
      }

      window.onerror = function() {};
    }

    function _shutdown() {
      _Destroy();

      if ( handler ) {
        handler.destroy();
        handler = null;
      }
    }

    var ring = OSjs.API.getServiceNotificationIcon();
    if ( ring ) {
      ring.destroy();
    }

    OSjs.Session.triggerHook('onLogout');

    handler.logout(save, function() {
      OSjs.Session.triggerHook('onShutdown');

      OSjs.API.playSound('service-logout');
      _shutdown();
    });
  }

  /**
   * Sign Out of OS.js
   *
   * @return  void
   * @api     OSjs.Session.signOut()
   */
  function doSignOut() {
    signingOut = true;

    var handler = OSjs.Core.getHandler();
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      var user = handler.getUserData() || {name: OSjs.API._('LBL_UNKNOWN')};
      OSjs.GUI.createDialog('Confirm', {
        title: OSjs.API._('DIALOG_LOGOUT_TITLE'),
        message: OSjs.API._('DIALOG_LOGOUT_MSG_FMT', user.name)
      }, function() {
        // TODO REFACTOR
        if ( btn === 'ok' ) {
          OSjs.Session.destroy(true, false);
        } else if ( btn === 'no' ) {
          OSjs.Session.destroy(false, false);
        }
      });
    } else {
      OSjs.Session.destroy(true, false);
    }
  }

  /**
   * Autostart applications from config
   */
  function doAutostart() {
    var handler = OSjs.Core.getHandler();
    if ( handler ) {
      var autostart;

      try {
        autostart = handler.getConfig('System').AutoStart;
      } catch ( e ) {
        console.warn('doAutostart() exception', e, e.stack);
      }

      console.info('doAutostart()', autostart);
      if ( autostart ) {
        OSjs.API.launchList(autostart);
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Session.init         = doInitialize;
  OSjs.Session.destroy      = doShutdown;
  OSjs.Session.signOut      = doSignOut;
  OSjs.Session.addHook      = doAddHook;
  OSjs.Session.triggerHook  = doTriggerHook;

})();
