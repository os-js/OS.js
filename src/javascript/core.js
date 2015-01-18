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
  OSjs.API          = OSjs.API          || {};
  OSjs.Core         = OSjs.Core         || {};
  OSjs.Compability  = OSjs.Compability  || {};
  OSjs.Helpers      = OSjs.Helpers      || {};
  OSjs.Handlers     = OSjs.Handlers     || {};
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Dialogs      = OSjs.Dialogs      || {};
  OSjs.GUI          = OSjs.GUI          || {};
  OSjs.Locales      = OSjs.Locales      || {};
  OSjs.VFS          = OSjs.VFS          || {};

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
   * @api     OSjs.Core.triggerHook()
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
   * @api     OSjs.Core.addHook()
   * @see     core.js For a list of hooks
   */
  function doAddHook(name, fn) {
    if ( typeof _hooks[name] !== 'undefined' ) {
      _hooks[name].push(fn);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // INTERNAL VARIABLES
  /////////////////////////////////////////////////////////////////////////////

  var _$LOADING;          // Loading DOM Element
  var _$SPLASH_TXT;       //   It's description field
  var _$SPLASH;           // Loading Screen DOM Element
  var _$ROOT;             // Root element
  var _MOUSELOCK = true;  // Mouse inside view ?!
  var _INITED = false;

  /////////////////////////////////////////////////////////////////////////////
  // API HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Creates the version stamp
   *
   * @return  void
   */
  function createVersionStamp() {
    var handler = OSjs.API.getHandlerInstance();
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
      var wm = OSjs.API.getWMInstance();
      if ( !wm ) { return; }
      wm.resize(ev, OSjs.API.getWindowSpace());
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
    var wm = OSjs.API.getWMInstance();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win ) {
      win._blur();
    }
  }

  /**
   * Global onEnter Event
   *
   * @param   DOMEvent    ev      Event
   *
   * @return  void
   */
  function globalOnEnter(ev) {
    _MOUSELOCK = true;
  }

  /**
   * Global onLeave Event
   *
   * @param   DOMEvent    ev      Event
   *
   * @return  void
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
   *
   * @param   DOMEvent    ev      Event
   *
   * @return  void
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
   * @return  void
   */
  function globalOnKeyUp(ev) {
    var wm = OSjs.API.getWMInstance();
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
   * @return  void
   */
  function globalOnKeyPress(ev) {
    var wm = OSjs.API.getWMInstance();
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
   * @return  void
   */
  function globalOnKeyDown(ev) {
    var d = ev.srcElement || ev.target;
    var wm = OSjs.API.getWMInstance();
    var win = wm ? wm.getCurrentWindow() : null;

    // Some keys must be cancelled
    var doPrevent = d.tagName === 'BODY' ? true : false;
    if ( ev.keyCode === OSjs.Utils.Keys.BACKSPACE ) {
      if ( !OSjs.Utils.isInputElement(ev) ) {
        doPrevent = true;
      }
    } else if ( ev.keyCode === OSjs.Utils.Keys.TAB ) {
      if ( OSjs.Utils.isFormElement(ev) ) {
        doPrevent = true;
      }
    }

    if ( doPrevent ) {
      if ( !win || !win._properties.key_capture ) {
        ev.preventDefault();
      }
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

  /////////////////////////////////////////////////////////////////////////////
  // CORE FUNCTIONS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is the main initialization function
   * the first thing that is called after page has loaded
   *
   * @return  void
   * @api     OSjs.Core.initialize()
   */
  function doInitialize() {
    if ( _INITED ) { return; }
    _INITED = true;

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
      wargs.themes = handler.getThemes();
      OSjs.API.launch(wm.exec, wargs, function(app) {
        callback();
      }, function(error, name, args, exception) {
        _error(OSjs.API._('ERR_CORE_INIT_WM_FAILED_FMT', error), exception);
      });
    }

    function _Loaded() {
      OSjs.Core.triggerHook('onInited');

      _LaunchWM(function(/*app*/) {
        OSjs.Core.triggerHook('onWMInited');

        _$LOADING.style.display = 'none';
        OSjs.API.playSound('service-login');

        var wm = OSjs.API.getWMInstance();
        handler.onWMLaunched(wm, function() {

          handler.loadSession(function() {
            setTimeout(function() {
              globalOnResize();
            }, 500);

            OSjs.Core.triggerHook('onSessionLoaded');

            doAutostart();
          });
        });

        if ( _$SPLASH ) {
          _$SPLASH.style.display = 'none';
        }
      });
    }

    function _Preload(list, callback) {
      OSjs.Utils.Preload(list, function(total, errors) {
        if ( errors ) {
          _error(OSjs.API._('ERR_CORE_INIT_PRELOAD_FAILED'));
          return;
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
        var msg = 'Please report this if you think this is a bug.\nInclude a brief description on how the error occured, and if you can; how to replicate it'; // FIXME: Translation
        OSjs.API.error(OSjs.API._('ERR_JAVASCRIPT_EXCEPTION'),
                      OSjs.API._('ERR_JAVACSRIPT_EXCEPTION_DESC'),
                      msg,
                      exception || {name: 'window::onerror()', fileName: url, lineNumber: linenumber+':'+column, message: message},
                      true );

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
        OSjs.API.blurMenu();
      }, false);

      document.body.appendChild(_$ROOT);

      document.addEventListener('keydown', function(ev) {
        return globalOnKeyDown(ev);
      }, false);
      document.addEventListener('keypress', function(ev) {
        return globalOnKeyPress(ev);
      }, false);
      document.addEventListener('keyup', function(ev) {
        return globalOnKeyUp(ev);
      }, false);
      document.addEventListener('mousedown', function(ev) {
        globalOnMouseDown(ev);
      }, false);
      window.addEventListener('resize', function(ev) {
        globalOnResize(ev);
      }, false);
      window.addEventListener('scroll', function(ev) {
        return globalOnScroll(ev);
      }, false);
      document.addEventListener('mouseout', function(ev) {
        globalOnLeave(ev);
      }, false);
      document.addEventListener('mouseenter', function(ev) {
        globalOnEnter(ev);
      }, false);

      handler.boot(function(result, error) {

        if ( error ) {
          _error(error);
          return;
        }

        var preloads = handler.getConfig('Core').Preloads;
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
    handler = new OSjs.Handlers.Current();
    handler.init(function() {

      createVersionStamp();

      OSjs.Core.triggerHook('onInitialize');

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
   *
   * @param   boolean     save      Save the current session ?
   *
   * @return  void
   * @api     OSjs.Core.shutdown()
   */
  function doShutdown(save) {
    if ( !_INITED ) { return; }
    _INITED = false;

    var handler = OSjs.API.getHandlerInstance();

    function _Destroy() {
      OSjs.API.blurMenu();

      document.removeEventListener('keydown', function(ev) {
        return globalOnKeyDown(ev);
      }, false);
      document.removeEventListener('keyup', function(ev) {
        return globalOnKeyUp(ev);
      }, false);
      document.removeEventListener('keypress', function(ev) {
        return globalOnKeyPress(ev);
      }, false);
      document.removeEventListener('mousedown', function(ev) {
        globalOnMouseDown(ev);
      }, false);
      window.removeEventListener('resize', function(ev) {
        globalOnResize(ev);
      }, false);
      window.removeEventListener('scroll', function(ev) {
        return globalOnScroll(ev);
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
          OSjs.API.blurMenu();
        }, false);
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

      if ( _$LOADING && _$LOADING.parentNode ) {
        _$LOADING.parentNode.removeChild(_$LOADING);
      }
      _$LOADING = null;
    }

    var ring = OSjs.Helpers.getServiceRing();
    if ( ring ) {
      ring.destroy();
    }

    OSjs.Core.triggerHook('onLogout');

    handler.logout(save, function() {
      OSjs.Core.triggerHook('onShutdown');

      OSjs.API.playSound('service-logout');
      _shutdown();
    });
  }

  /**
   * Sign Out of OS.js
   *
   * @return  void
   * @api     OSjs.Core.signOut()
   */
  function doSignOut() {
    var handler = OSjs.API.getHandlerInstance();
    var wm = OSjs.API.getWMInstance();
    if ( wm ) {
      var user = handler.getUserData() || {name: OSjs.API._('LBL_UNKNOWN')};
      var conf = new OSjs.Dialogs.Confirm(OSjs.API._('DIALOG_LOGOUT_MSG_FMT', user.name), function(btn) {
        if ( btn === 'ok' ) {
          OSjs.Core.shutdown(true, false);
        } else if ( btn === 'cancel' ) {
          OSjs.Core.shutdown(false, false);
        }
      }, {title: OSjs.API._('DIALOG_LOGOUT_TITLE'), buttonClose: true, buttonCloseLabel: OSjs.API._('LBL_CANCEL'), buttonOkLabel: OSjs.API._('LBL_YES'), buttonCancelLabel: OSjs.API._('LBL_NO')});
      wm.addWindow(conf);
    } else {
      OSjs.Core.shutdown(true, false);
    }
  }

  /**
   * Autostart applications from config
   */
  function doAutostart() {
    var handler = OSjs.API.getHandlerInstance();
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

  // Classes and Core functions
  OSjs.Core.initialize        = doInitialize;
  OSjs.Core.addHook           = doAddHook;
  OSjs.Core.triggerHook       = doTriggerHook;
  OSjs.Core.shutdown          = doShutdown;
  OSjs.Core.signOut           = doSignOut;

  OSjs.API._isMouseLock           = function() { return _MOUSELOCK; };
  OSjs.API._onMouseDown           = globalOnMouseDown;

})();
