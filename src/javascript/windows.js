
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
(function(Utils, API, Process) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};

  /////////////////////////////////////////////////////////////////////////////
  // GLOBALS
  /////////////////////////////////////////////////////////////////////////////

  var _WM;             // Running Window Manager process
  var _WIN;            // Currently selected Window

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
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

  /**
   * Get animation duration
   * @return int
   */
  function getAnimDuration() {
    if ( _WM ) {
      var name  = _WM.getSetting('theme');
      var theme = _WM.getTheme(name);
      if ( theme && (typeof theme.animduration !== 'undefined') ) {
        return parseInt(theme.animduration, 10) + 1;
      }
    }
    return 301;
  }

  /**
   * Create Window move/resize events (FIXME: Optimize)
   */
  function attachWindowEvents(self, main, windowTop, windowResize, isTouch) {
    var sx = 0;
    var sy = 0;
    var action = null;
    var moved = false;
    var startRect = null;
    var direction = null;
    var startDimension = {x: 0, y: 0, w: 0, h: 0};

    function onMouseDown(ev, a) {
      ev.preventDefault();

      if ( self._state.maximized ) { return false; }
      startRect = _WM.getWindowSpace();

      startDimension.x = self._position.x;
      startDimension.y = self._position.y;
      startDimension.w = self._dimension.w;
      startDimension.h = self._dimension.h;

      if ( a === 'move' ) {
        Utils.$addClass(main, 'WindowHintMoving');
      } else {
        if ( windowResize ) {
          var dir = Utils.$position(windowResize);
          var dirX = ev.clientX - dir.left;
          var dirY = ev.clientY - dir.top;
          var dirD = 20;

          direction = 's';
          if ( (dirX <= dirD) && (dirY <= dirD) ) {
            direction = 'nw';
          }
          if ( (dirX > dirD) && (dirY <= dirD) ) {
            direction = 'n';
          }
          if ( (dirX <= dirD) && (dirY >= dirD) ) {
            direction = 'w';
          }
          if ( (dirX >= (dir.width-dirD)) && (dirY <= dirD) ) {
            direction = 'ne';
          }
          if ( (dirX >= (dir.width-dirD)) && (dirY > dirD) ) {
            direction = 'e';
          }
          if ( (dirX >= (dir.width-dirD)) && (dirY >= (dir.height-dirD)) ) {
            direction = 'se';
          }
          if ( (dirX <= dirD) && (dirY >= (dir.height-dirD)) ) {
            direction = 'sw';
          }

          Utils.$addClass(main, 'WindowHintResizing');
        }
      }

      sx = isTouch ? (ev.changedTouches[0] || {}).clientX : ev.clientX;
      sy = isTouch ? (ev.changedTouches[0] || {}).clientY : ev.clientY;
      action = a;

      document.addEventListener((isTouch ? 'touchmove' : 'mousemove'), onMouseMove, false);
      document.addEventListener((isTouch ? 'touchend' : 'mouseup'), onMouseUp, false);

      return false;
    }

    function onMouseUp(ev) {
      if ( moved ) {
        if ( _WM ) {
          if ( action === 'move' ) {
            self._onChange('move', true);
          } else if ( action === 'resize' ) {
            self._onChange('resize', true);
            self._fireHook('resized');
          }
        }
      }

      Utils.$removeClass(main, 'WindowHintMoving');
      Utils.$removeClass(main, 'WindowHintResizing');

      document.removeEventListener((isTouch ? 'touchmove' : 'mousemove'), onMouseMove, false);
      document.removeEventListener((isTouch ? 'touchend' : 'mouseup'), onMouseUp, false);
      action = null;
      sx = 0;
      sy = 0;
      moved = false;
      startRect = null;
    }

    function onMouseMove(ev) {
      if ( !API._isMouseLock() ) { return; }
      if ( action === null ) { return; }
      var cx = isTouch ? (ev.changedTouches[0] || {}).clientX : ev.clientX;
      var cy = isTouch ? (ev.changedTouches[0] || {}).clientY : ev.clientY;
      var dx = cx - sx;
      var dy = cy - sy;
      var newLeft = null;
      var newTop = null;
      var newWidth = null;
      var newHeight = null;

      if ( action === 'move' ) {
        newLeft = startDimension.x + dx;
        newTop = startDimension.y + dy;
        if ( newTop < startRect.top ) { newTop = startRect.top; }
      } else {
        if ( direction === 's' ) {
          newWidth = startDimension.w;
          newHeight = startDimension.h + dy;
        } else if ( direction === 'se' ) {
          newWidth = startDimension.w + dx;
          newHeight = startDimension.h + dy;
        } else if ( direction === 'e' ) {
          newWidth = startDimension.w + dx;
          newHeight = startDimension.h;
        } else if ( direction === 'sw' ) {
          newWidth = startDimension.w - dx;
          newHeight = startDimension.h + dy;
          newLeft = startDimension.x + dx;
          newTop = startDimension.y;
        } else if ( direction === 'w' ) {
          newWidth = startDimension.w - dx;
          newHeight = startDimension.h;
          newLeft = startDimension.x + dx;
          newTop = startDimension.y;
        } else if ( direction === 'n' ) {
          newTop = startDimension.y + dy;
          newLeft = startDimension.x;
          newHeight = startDimension.h - dy;
          newWidth = startDimension.w;
        } else if ( direction === 'nw' ) {
          newTop = startDimension.y + dy;
          newLeft = startDimension.x + dx;
          newHeight = startDimension.h - dy;
          newWidth = startDimension.w - dx;
        } else if ( direction === 'ne' ) {
          newTop = startDimension.y + dy;
          newLeft = startDimension.x;
          newHeight = startDimension.h - dy;
          newWidth = startDimension.w + dx;
        }
      }

      if ( newLeft !== null && newTop !== null ) {
        self._move(newLeft, newTop);
      }
      if ( newWidth !== null && newHeight !== null ) {
        self._resize(newWidth, newHeight);
        self._fireHook('resize');
      }

      moved = true;
    }

    if ( self._properties.allow_move ) {
      self._addEventListener(windowTop, (isTouch ? 'touchstart' : 'mousedown'), function(ev) {
        onMouseDown(ev, 'move');
      });
    }
    if ( self._properties.allow_resize ) {
      self._addEventListener(windowResize, (isTouch ? 'touchstart' : 'mousedown'), function(ev) {
        onMouseDown(ev, 'resize');
      });
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOW
  /////////////////////////////////////////////////////////////////////////////

  /**
   * WindowManager Process Class
   * The default implementation of this is in apps/CoreWM/main.js
   */
  var WindowManager = function(name, ref, args, metadata) {
    console.group('OSjs::Core::WindowManager::__construct()');
    console.log('Name', name);
    console.log('Arguments', args);

    this._$notifications = null;
    this._windows        = [];
    this._settings       = {};

    // Important for usage as "Application"
    this.__name    = (name || 'WindowManager');
    this.__path    = metadata.path;
    this.__iter    = metadata.iter;

    Process.apply(this, [this.__name]);

    _WM = (ref || this);

    console.groupEnd();
  };

  WindowManager.prototype = Object.create(Process.prototype);

  WindowManager.prototype.destroy = function() {
    console.log('OSjs::Core::WindowManager::destroy()');

    // Destroy all windows
    var self = this;
    this._windows.forEach(function(win, i) {
      if ( win ) {
        win.destroy();
        self._windows[i] = null;
      }
    });
    this._windows = [];

    _WM = null;
    _WIN = null;

    return Process.prototype.destroy.apply(this, []);
  };

  WindowManager.prototype.init = function() {
    console.log('OSjs::Core::WindowManager::init()');
  };

  WindowManager.prototype.getWindow = function(name) {
    var result = null;
    this._windows.forEach(function(w) {
      if ( w && w._name === name ) {
        result = w;
      }
      return w ? false : true;
    });
    return result;
  };

  WindowManager.prototype.addWindow = function(w, focus) {
    if ( !(w instanceof Window) ) {
      console.warn('OSjs::Core::WindowManager::addWindow()', 'Got', w);
      throw new Error('addWindow() expects a "Window" class');
    }
    console.log('OSjs::Core::WindowManager::addWindow()');

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
      console.warn('OSjs::Core::WindowManager::removeWindow()', 'Got', w);
      throw new Error('removeWindow() expects a "Window" class');
    }
    console.log('OSjs::Core::WindowManager::removeWindow()');

    var result = false;
    var self = this;
    this._windows.forEach(function(win, i) {
      if ( win && win._wid === w._wid ) {
        self._windows[i] = null;
        result = true;
        return false;
      }
      return true;
    });
    return result;
  };

  WindowManager.prototype.applySettings = function(settings, force) {
    settings = settings || {};
    console.log('OSjs::Core::WindowManager::applySettings', 'forced?', force);

    if ( force ) {
      this._settings = settings;
    } else {
      this._settings = Utils.mergeObject(this._settings, settings);
    }

    return true;
  };


  WindowManager.prototype.onKeyDown = function(ev, win) {
    // Implement in your WM
  };

  WindowManager.prototype.resize = function(ev, rect) {
    // Implement in your WM
  };

  WindowManager.prototype.notification = function() {
    // Implement in your WM
  };

  WindowManager.prototype.createNotificationIcon = function() {
    // Implement in your WM
  };

  WindowManager.prototype.destroyNotificationIcon = function() {
    // Implement in your WM
  };

  WindowManager.prototype.eventWindow = function(ev, win) {
    // Implement in your WM
  };

  WindowManager.prototype.showSettings = function() {
    // Implement in your WM
  };

  WindowManager.prototype.getDefaultSetting = function() {
    // Implement in your WM
    return null;
  };

  WindowManager.prototype.getPanel = function() {
    // Implement in your WM
    return null;
  };

  WindowManager.prototype.getPanels = function() {
    // Implement in your WM
    return [];
  };

  WindowManager.prototype.getTheme = function() {
    // Implement in your WM
    return null;
  };

  WindowManager.prototype.getThemes = function() {
    // Implement in your WM
    return [];
  };

  WindowManager.prototype.setSetting = function(k, v) {
    if ( v !== null ) {
      if ( typeof this._settings[k] !== 'undefined' ) {
        if ( (typeof this._settings[k] === 'object') && !(this._settings[k] instanceof Array) ) {
          if ( typeof v === 'object' ) {
            Object.keys(v).forEach(function(i) {
              if ( this._settings[k].hasOwnProperty(i) ) {
                if ( v[i] !== null ) {
                  this._settings[k][i] = v[i];
                }
              }
            });
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

  WindowManager.prototype.getWindows = function() {
    return this._windows;
  };

  WindowManager.prototype.getCurrentWindow = function() {
    return _WIN;
  };

  /////////////////////////////////////////////////////////////////////////////
  // WINDOW
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
      if ( Utils.inArray(_NAMES, name) ) {
        throw new Error(API._('ERR_WIN_DUPLICATE_FMT', name));
      }

      var icon      = API.getThemeResource('wm.png', 'wm');
      var position  = {x:(opts.x), y:(opts.y)};
      var dimension = {w:(opts.width || _DEFAULT_WIDTH), h:(opts.height || _DEFAULT_HEIGHT)};

      this._$element      = null;                 // DOMElement: Window Outer container
      this._$root         = null;                 // DOMElement: Window Inner container (for content)
      this._$top          = null;                 // DOMElement: Window Top
      this._$winicon      = null;                 // DOMElement: Window Icon
      this._$loading      = null;                 // DOMElement: Window Loading overlay
      this._$disabled     = null;                 // DOMElement: Window Disabled Overlay
      this._$iframefix    = null;                 // DOMElement: Window IFrame Fix Overlay

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
      this._guiElement    = null;                 // Currently selected GUI Element
      this._disabled      = true;                 // If Window is currently disabled
      this._sound         = null;                 // Play this sound when window opens
      this._soundVolume   = _DEFAULT_SND_VOLUME;  // ... using this volume
      this._blinkTimer    = null;
      this._iframeFixEl   = null;

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
        key_capture       : false,
        start_focused     : true,
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

      console.info('OSjs::Core::Window::__construct()', this._wid, this._name);

      _WID++;
    };
  })();

  Window.prototype.init = function(_wm) {
    var self = this;
    var isTouch = OSjs.Compability.touch;

    console.group('OSjs::Core::Window::init()');

    this._state.focused = false;

    this._icon = API.getIcon(this._icon, this._appRef);

    // Initial position
    if ( !this._properties.gravity ) {
      if ( (typeof this._position.x === 'undefined') || (typeof this._position.y === 'undefined') ) {
        var np = _WM ? _WM.getWindowPosition() : {x:0, y:0};
        this._position.x = np.x;
        this._position.y = np.y;
      }
    }

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

    this._addEventListener(main, 'contextmenu', function(ev) {
      var r = Utils.isInputElement(ev);

      if ( !r ) {
        ev.preventDefault();
      }

      OSjs.GUI.blurMenu();

      return r;
    });

    function _showBorder() {
      Utils.$addClass(main, 'WindowHintDnD');
    }

    function _hideBorder() {
      Utils.$removeClass(main, 'WindowHintDnD');
    }

    if ( this._properties.allow_drop ) {
      if ( OSjs.Compability.dnd ) {
        var border = document.createElement('div');
        border.className = 'WindowDropRect';

        OSjs.GUI.createDroppable(main, {
          onOver: function(ev, el, args) {
            _showBorder();

            /*
            if ( self._$iframefix ) {
              self._$iframefix.style.display = 'none';
            }
            */
          },

          onLeave : function() {
            _hideBorder();

            /*
            if ( !self._state.focused ) {
              if ( self._$iframefix ) {
                self._$iframefix.style.display = 'block';
              }
            }
            */
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
    this._addEventListener(windowIcon, 'dblclick', function(ev) {
      ev.preventDefault();
    });
    this._addEventListener(windowIcon, (isTouch ? 'touchend' : 'click'), function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      self._onWindowIconClick(ev, this);
    });

    // Window -> Top -> Title
    var windowTitle       = document.createElement('div');
    windowTitle.className = 'WindowTitle';
    windowTitle.appendChild(document.createTextNode(this._title));

    // Window -> Top -> Buttons
    var windowButtons       = document.createElement('div');
    windowButtons.className = 'WindowButtons';
    if ( !isTouch ) {
      this._addEventListener(windowButtons, 'mousedown', function(ev) {
        ev.preventDefault();
        return stopPropagation(ev);
      });
    }

    var buttonMinimize        = document.createElement('div');
    buttonMinimize.className  = 'WindowButton WindowButtonMinimize';
    buttonMinimize.innerHTML  = '&nbsp;';
    if ( this._properties.allow_minimize ) {
      this._addEventListener(buttonMinimize, (isTouch ? 'touchend' : 'click'), function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        self._onWindowButtonClick(ev, this, 'minimize');
        return false;
      });
    } else {
      buttonMinimize.style.display = 'none';
    }

    var buttonMaximize        = document.createElement('div');
    buttonMaximize.className  = 'WindowButton WindowButtonMaximize';
    buttonMaximize.innerHTML  = '&nbsp;';
    if ( this._properties.allow_maximize ) {
      this._addEventListener(buttonMaximize, (isTouch ? 'touchend' : 'click'), function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        self._onWindowButtonClick(ev, this, 'maximize');
        return false;
      });
    } else {
      buttonMaximize.style.display = 'none';
    }

    var buttonClose       = document.createElement('div');
    buttonClose.className = 'WindowButton WindowButtonClose';
    buttonClose.innerHTML = '&nbsp;';
    if ( this._properties.allow_close ) {
      this._addEventListener(buttonClose, (isTouch ? 'touchend' : 'click'), function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        self._onWindowButtonClick(ev, this, 'close');
        return false;
      });
    } else {
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
    this._addEventListener(windowLoading, 'click', function(ev) {
      ev.preventDefault();
      return false;
    });

    var windowLoadingImage        = document.createElement('div');
    windowLoadingImage.className  = 'WindowLoadingIndicator';

    // Window -> Disabled Overlay
    var windowDisabled            = document.createElement('div');
    windowDisabled.className      = 'WindowDisabledOverlay';
    //windowDisabled.style.display  = 'none';
    this._addEventListener(windowDisabled, (isTouch ? 'touchstart' : 'mousedown'), function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      return false;
    });

    // Append stuff
    var classNames = ['Window'];
    classNames.push('Window_' + Utils.$safeName(this._name));
    if ( this._tag && (this._name !== this._tag) ) {
      classNames.push(Utils.$safeName(this._tag));
    }

    main.className    = classNames.join(' ');
    main.style.width  = this._dimension.w + 'px';
    main.style.height = this._dimension.h + 'px';
    main.style.top    = this._position.y + 'px';
    main.style.left   = this._position.x + 'px';
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

    attachWindowEvents(this, main, windowTop, windowResize, isTouch);

    this._addEventListener(main, (isTouch ? 'touchstart' : 'mousedown'), function(ev) {
      self._focus();
      return stopPropagation(ev);
    });

    this._$element  = main;
    this._$root     = windowWrapper;
    this._$top      = windowTop;
    this._$loading  = windowLoading;
    this._$winicon  = windowIconImage;
    this._$disabled = windowDisabled;

    document.body.appendChild(this._$element);

    windowTitle.style.right = windowButtons.offsetWidth + 'px';

    this._onChange('create');
    this._toggleLoading(false);
    this._toggleDisabled(false);

    if ( this._sound ) {
      API.playSound(this._sound, this._soundVolume);
    }

    console.groupEnd();

    return this._$root;
  };

  Window.prototype._inited = function() {
    if ( !this._rendered ) {
      this._guiElements.forEach(function(el, i) {
        if ( el ) {
          el.update();
        }
      });
    }
    this._rendered = true;

    if ( this._$iframefix && this._iframeFixEl ) {
      this._$iframefix.style.left = this._iframeFixEl.$element.style.offsetLeft + 'px';
      this._$iframefix.style.top = this._iframeFixEl.$element.offsetTop + 'px';
    }
  };

  Window.prototype.destroy = function() {
    var self = this;

    function _removeDOM() {
      if ( self._$element.parentNode ) {
        self._$element.parentNode.removeChild(self._$element);
      }
      self._$element    = null;
      self._$root       = null;
      self._$top        = null;
      self._$winicon    = null;
      self._$loading    = null;
      self._$disabled   = null;
      self._$iframefix  = null;
      self._iframeFixEl = null;
    }

    if ( this._destroyed ) { return; }
    this._destroyed = true;
    console.log('OSjs::Core::Window::destroy()');

    this._onChange('close');

    this._fireHook('destroy');

    // Children etc
    if ( this._parent ) {
      this._parent._removeChild(this);
    }
    this._parent = null;

    if ( this._guiElements && this._guiElements.length ) {
      this._guiElements.forEach(function(el, i) {
        if ( el ) {
          el.destroy();
        }
        self._guiElements[i] = null;
      });
    }
    this._guiElements = [];

    this._removeChildren();

    // Instance
    if ( _WM ) {
      _WM.removeWindow(this);
    }
    if ( _WIN && _WIN._wid === this._wid ) {
      _WIN = null;
    }

    if ( this._$element ) {
      var anim = _WM ? _WM.getSetting('animations') : false;
      if ( anim ) {
        Utils.$addClass(this._$element, 'WindowHintClosing');
        setTimeout(function() {
          _removeDOM();
        }, getAnimDuration());
      } else {
        this._$element.style.display = 'none';
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
      this._hooks[k].forEach(function(hook, i) {
        if ( hook ) {
          try {
            hook.apply(this, args);
          } catch ( e ) {
            console.warn('Window::_fireHook() failed to run hook', k, i, e);
            console.warn(e.stack);
            //console.log(e, e.prototype);
            //throw e;
          }
        }
      });
    }
  };

  Window.prototype._removeGUIElement = function(gel) {
    var self = this;
    this._guiElements.forEach(function(iter, i) {
      var destroy = false;

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
        self._guiElements[destroy].destroy();
        self._guiElements[destroy] = null;
        return false;
      }

      return true;
    });
  };

  Window.prototype._addGUIElement = function(gel, parentNode) {
    var self = this;
    if ( !parentNode ) {
      throw new Error('Adding a GUI Element requires a parentNode');
    }
    if ( gel instanceof OSjs.GUI.GUIElement ) {
      gel._setWindow(this);
      gel._setTabIndex(this._guiElements.length + 1);

      //console.log('OSjs::Core::Window::_addGUIElement()');
      if ( gel.opts ) {
        if ( gel.opts.focusable ) {
          gel._addHook('focus', function() {
            self._guiElement = this;
          });
          this._addHook('blur', function() {
            gel.blur();
          });
        }

        // NOTE: This is a fix for iframes blocking mousemove events (ex. moving windows)
        if ( gel.opts.isIframe ) {
          this._$iframefix = document.createElement('div');
          this._$iframefix.className = 'WindowIframeFix';
          this._$iframefix.onmousemove = function(ev) {
            ev.preventDefault();
            return false;
          };
          this._$element.appendChild(this._$iframefix);
          this._iframeFixEl = gel;
        }
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
            elpos = Utils.$position(gel.$element);

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
    console.info('OSjs::Core::Window::_addChild()');
    w._parent = this;
    if ( wmAdd && _WM ) {
      _WM.addWindow(w);
    }
    this._children.push(w);
  };

  Window.prototype._removeChild = function(w) {
    var self = this;
    this._children.forEach(function(child, i) {
      if ( child && child._wid === w._wid ) {
        console.info('OSjs::Core::Window::_removeChild()');

        child.destroy();
        self._children[i] = null;
        return false;
      }
      return true;
    });
  };

  Window.prototype._getChild = function(id, key) {
    key = key || 'wid';

    var result = key === 'tag' ? [] : null;
    this._children.forEach(function(child, i) {
      if ( child ) {
        if ( key === 'tag' ) {
          result.push(child);
        } else {
          if ( child['_' + key] === id ) {
            result = child;
            return false;
          }
        }
      }
      return true;
    });
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
      this._children.forEach(function(child, i) {
        if ( child ) {
          child.destroy();
        }
      });
    }
    this._children = [];
  };

  //
  // Actions
  //

  Window.prototype._close = function() {
    console.info('OSjs::Core::Window::_close()');
    if ( this._disabled ) { return false; }

    Utils.$addClass(this._$element, 'WindowHintClosing');

    this._blur();
    this.destroy();

    return true;
  };

  Window.prototype._minimize = function() {
    var self = this;
    console.debug(this._name, '>' , 'OSjs::Core::Window::_minimize()');
    if ( !this._properties.allow_minimize ) { return false; }
    //if ( this._disabled ) return false;
    if ( this._state.minimized ) {
      this._restore(false, true);
      return true;
    }

    this._blur();

    this._state.minimized = true;
    Utils.$addClass(this._$element, 'WindowHintMinimized');

    function _hideDOM() {
      self._$element.style.display = 'none';
    }

    var anim = _WM ? _WM.getSetting('animations') : false;
    if ( anim ) {
      setTimeout(function() {
        _hideDOM();
      }, getAnimDuration());
    } else {
      _hideDOM();
    }

    this._onChange('minimize');
    this._fireHook('minimize');

    if ( _WIN && _WIN._wid === this._wid ) {
      _WIN = null;
    }

    return true;
  };

  Window.prototype._maximize = function() {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_maximize()');
    if ( !this._properties.allow_maximize ) { return false; }
    if ( !this._$element ) { return false; }
    //if ( this._disabled ) return false;
    if ( this._state.maximized ) {
      this._restore(true, false);
      return true;
    }
    this._lastPosition    = {x: this._position.x,  y: this._position.y};
    this._lastDimension   = {w: this._dimension.w, h: this._dimension.h};
    this._state.maximized = true;

    var s = this._getMaximizedSize();
    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.style.top    = (s.top) + 'px';
    this._$element.style.left   = (s.left) + 'px';
    this._$element.style.width  = (s.width) + 'px';
    this._$element.style.height = (s.height) + 'px';
    Utils.$addClass(this._$element, 'WindowHintMaximized');

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
      }, getAnimDuration());
    } else {
      this._fireHook('maximize');
    }

    return true;
  };

  Window.prototype._restore = function(max, min) {
    if ( !this._$element ) { return; }

    console.debug(this._name, '>' , 'OSjs::Core::Window::_restore()');
    //if ( this._disabled ) return ;
    max = (typeof max === 'undefined') ? true : (max === true);
    min = (typeof min === 'undefined') ? true : (min === true);

    if ( max && this._state.maximized ) {
      this._move(this._lastPosition.x, this._lastPosition.y);
      this._resize(this._lastDimension.w, this._lastDimension.h);
      this._state.maximized = false;
      Utils.$removeClass(this._$element, 'WindowHintMaximized');
    }

    if ( min && this._state.minimized ) {
      this._$element.style.display = 'block';
      this._state.minimized = false;
      Utils.$removeClass(this._$element, 'WindowHintMinimized');
    }

    this._onChange('restore');

    var anim = _WM ? _WM.getSetting('animations') : false;
    if ( anim ) {
      var self = this;
      setTimeout(function() {
        self._fireHook('restore');
      }, getAnimDuration());
    } else {
      this._fireHook('restore');
    }

    this._focus();
  };

  Window.prototype._focus = function(force) {
    if ( !this._$element ) { return false; }

    //if ( !force && this._state.focused ) { return false; }
    //console.debug(this._name, '>' , 'OSjs::Core::Window::_focus()');
    this._toggleAttentionBlink(false);

    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    Utils.$addClass(this._$element, 'WindowHintFocused');

    if ( _WIN && _WIN._wid !== this._wid ) {
      _WIN._blur();
    }

    _WIN = this;

    if ( !this._state.focused || force) {
      this._onChange('focus');
      this._fireHook('focus');
    }

    this._state.focused = true;

    if ( this._$iframefix ) {
      this._$iframefix.style.display = 'none';
    }

    return true;
  };

  Window.prototype._blur = function(force) {
    if ( !this._$element ) { return false; }
    if ( !force && !this._state.focused ) { return false; }
    //console.debug(this._name, '>' , 'OSjs::Core::Window::_blur()');
    Utils.$removeClass(this._$element, 'WindowHintFocused');
    this._state.focused = false;

    this._onChange('blur');
    this._fireHook('blur');

    if ( _WIN && _WIN._wid === this._wid ) {
      _WIN = null;
    }

    if ( this._$iframefix ) {
      this._$iframefix.style.display = 'block';
    }

    return true;
  };

  Window.prototype._resizeTo = function(dw, dh, limit, move, container, force) {
    if ( !this._$element ) { return; }

    var self = this;
    if ( dw <= 0 || dh <= 0 ) { return; }

    limit = (typeof limit === 'undefined' || limit === true);

    var dx = 0;
    var dy = 0;

    if ( container ) {
      var cpos  = Utils.$position(container, this._$root);
      dx = parseInt(cpos.left, 10);
      dy = parseInt(cpos.top, 10);
    }

    var space = this._getMaximizedSize();
    var cx    = this._position.x + dx;
    var cy    = this._position.y + dy;
    var newW  = dw;
    var newH  = dh;
    var newX  = null;
    var newY  = null;

    if ( limit ) {
      if ( (cx + newW) > space.width ) {
        if ( move ) {
          newW = space.width;
          newX = space.left;
        } else {
          newW = (space.width - cx) + dx;
        }
      } else {
        newW += dx;
      }

      if ( (cy + newH) > space.height ) {
        if ( move ) {
          newH = space.height;
          newY = space.top;
        } else {
          newH = (space.height - cy + this._$top.offsetHeight) + dy;
        }
      } else {
        newH += dy;
      }
    }

    this._resize(newW, newH, force);

    if ( newX !== null ) {
      this._move(newX, this._position.y);
    }
    if ( newY !== null ) {
      this._move(this._position.x, newY);
    }

    var anim = _WM ? _WM.getSetting('animations') : false;
    if ( anim ) {
      setTimeout(function() {
        self._fireHook('resized');
      }, getAnimDuration());
    } else {
      this._fireHook('resized');
    }
  };

  Window.prototype._resize = function(w, h, force) {
    if ( !this._$element ) { return false; }

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
      this._$element.style.width = w + 'px';
      this._dimension.w = w;
    }

    if ( h ) {
      this._$element.style.height = h + 'px';
      this._dimension.h = h;
    }

    return true;
  };

  Window.prototype._moveTo = function(pos) {
    if ( !_WM ) { return; }

    var s = _WM.getWindowSpace();
    var cx = this._position.x;
    var cy = this._position.y;

    if ( pos === 'left' ) {
      this._move(s.left, cy);
    } else if ( pos === 'right' ) {
      this._move((s.width - this._dimension.w), cy);
    } else if ( pos === 'top' ) {
      this._move(cx, s.top);
    } else if ( pos === 'bottom' ) {
      this._move(cx, (s.height - this._dimension.h));
    }
  };

  Window.prototype._move = function(x, y) {
    if ( !this._$element ) { return false; }
    if ( !this._properties.allow_move ) { return false; }
    if ( typeof x === 'undefined' || typeof y === 'undefined') { return false; }

    this._$element.style.top  = y + 'px';
    this._$element.style.left = x + 'px';
    this._position.x          = x;
    this._position.y          = y;
    return true;
  };

  Window.prototype._error = function(title, description, message, exception, bugreport) {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_error()');
    var w = API.error(title, description, message, exception, bugreport);
    this._addChild(w);
  };

  Window.prototype._toggleDisabled = function(t) {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_toggleDisabled()', t);
    this._$disabled.style.display = t ? 'block' : 'none';
    this._disabled = t ? true : false;
  };

  Window.prototype._toggleLoading = function(t) {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_toggleLoading()', t);
    this._$loading.style.display = t ? 'block' : 'none';
  };

  Window.prototype._toggleAttentionBlink = function(t) {
    if ( !this._$element ) { return false; }
    if ( this._state.focused ) { return false; }

    var el     = this._$element;
    var self   = this;

    function _blink(stat) {
      if ( el ) {
        if ( stat ) {
          Utils.$addClass(el, 'WindowAttentionBlink');
        } else {
          Utils.$removeClass(el, 'WindowAttentionBlink');
        }
      }
      self._onChange(stat ? 'attention_on' : 'attention_off');
    }

    /*
    if ( t ) {
      if ( !this._blinkTimer ) {
        console.debug(this._name, '>' , 'OSjs::Core::Window::_toggleAttentionBlink()', t);
        this._blinkTimer = setInterval(function() {
          s = !s;

          _blink(s);
        }, 1000);
        _blink(true);
      }
    } else {
      if ( this._blinkTimer ) {
        console.debug(this._name, '>' , 'OSjs::Core::Window::_toggleAttentionBlink()', t);
        clearInterval(this._blinkTimer);
        this._blinkTimer = null;
      }
      _blink(false);
    }
    */

    _blink(t);

    return true;
  };

  Window.prototype._nextTabIndex = function() {
    if ( this._guiElement ) {
      if ( this._guiElement.tagName === 'textarea' ) {
        return;
      }
    }

    var found = null;
    var next  = (this._guiElement ? (this._guiElement.tabIndex || -1) : -1) + 1;

    console.debug('Window::_nextTabIndex()', next);
    if ( next <= 0 ) { return; }
    if ( next > this._guiElements.length ) { next = 1; }

    this._guiElements.forEach(function(iter) {
      if ( iter && iter.opts.focusable && iter.tabIndex === next ) {
        found = iter;
        return false;
      }
    });
    console.debug('Window::_nextTabIndex()', found);
    if ( found ) {
      found.focus();
    }
  };

  //
  // Events
  //

  Window.prototype._onDndEvent = function(ev, type) {
    console.info('OSjs::Core::Window::_onDndEvent()', type);
    if ( this._disabled ) { return false; }
    return true;
  };

  Window.prototype._onKeyEvent = function(ev, type) {
    if ( ev.keyCode === Utils.Keys.TAB ) {
      this._nextTabIndex();
    }

    if ( type === 'keydown' ) {
      if ( this._guiElement ) {
        this._guiElement.onGlobalKeyPress(ev);
      }
    }
  };

  Window.prototype._onWindowIconClick = function(ev, el) {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_onWindowIconClick()');
    if ( !this._properties.allow_iconmenu ) { return; }

    var self = this;
    var list = [];

    if ( this._properties.allow_minimize ) {
      list.push({
        title:    API._('WINDOW_MINIMIZE'),
        icon:     'actions/stock_up.png',
        onClick:  function(name, iter) {
          self._minimize();
        }
      });
    }
    if ( this._properties.allow_maximize ) {
      list.push({
        title:    API._('WINDOW_MAXIMIZE'),
        icon:     'actions/window_fullscreen.png',
        onClick:  function(name, iter) {
          self._maximize();
          self._focus();
        }
      });
    }
    if ( this._state.maximized ) {
      list.push({
        title:    API._('WINDOW_RESTORE'),
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
          title:    API._('WINDOW_ONTOP_OFF'),
          icon:     'actions/window-new.png',
          onClick:  function(name, iter) {
            self._state.ontop = false;
            if ( self._$element ) {
              self._$element.style.zIndex = getNextZindex(false);
            }
            self._focus();
          }
        });
      } else {
        list.push({
          title:    API._('WINDOW_ONTOP_ON'),
          icon:     'actions/window-new.png',
          onClick:  function(name, iter) {
            self._state.ontop = true;
            if ( self._$element ) {
              self._$element.style.zIndex = getNextZindex(true);
            }
            self._focus();
          }
        });
      }
    }
    if ( this._properties.allow_close ) {
      list.push({
        title:    API._('WINDOW_CLOSE'),
        icon:     'actions/window-close.png',
        onClick:  function(name, iter) {
          self._close();
        }
      });
    }

    OSjs.GUI.createMenu(list, {x: ev.clientX, y: ev.clientY});
  };

  Window.prototype._onWindowButtonClick = function(ev, el, btn) {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_onWindowButtonClick()', btn);

    if ( btn === 'close' ) {
      this._close();
    } else if ( btn === 'minimize' ) {
      this._minimize();
    } else if ( btn === 'maximize' ) {
      this._maximize();
    }
  };

  Window.prototype._onChange = function(ev, byUser) {
    ev = ev || '';
    if ( ev ) {
      console.debug(this._name, '>' , 'OSjs::Core::Window::_onChange()', ev);
      if ( _WM ) {
        _WM.eventWindow(ev, this);
      }
    }
  };

  //
  // Getters
  //

  Window.prototype._getMaximizedSize = function() {
    var s = getWindowSpace();
    if ( !this._$element ) { return s; }

    var margin = {left: 0, top: 0, right: 0, bottom: 0};
    try {
      margin.left = -parseInt(window.getComputedStyle(this._$element, ':before').getPropertyValue('left'), 10);
      margin.top = -parseInt(window.getComputedStyle(this._$element, ':before').getPropertyValue('top'), 10);
      margin.right = -parseInt(window.getComputedStyle(this._$element, ':before').getPropertyValue('right'), 10);
      margin.bottom = -parseInt(window.getComputedStyle(this._$element, ':before').getPropertyValue('bottom'), 10);
    } catch ( e ) {}

    s.left += margin.left;
    s.width -= (margin.left + margin.right);
    //s.top -= margin.top;
    s.top += margin.bottom;
    s.height -= (margin.bottom + margin.top);
    return s;
  };

  Window.prototype._getViewRect = function() {
    return this._$element ? Utils.$position(this._$element) : null;
  };

  Window.prototype._getRoot = function() {
    return this._$root;
  };

  Window.prototype._getGUIElement = function(n) {
    var result = null;
    this._guiElements.forEach(function(iter, i) {
      if (iter && (iter.id === n || iter.name === n) ) {
        result = iter;
        return false;
      }
      return true;
    });
    return result;
  };

  Window.prototype._setTitle = function(t) {
    if ( !this._$element ) { return; }
    var tel = this._$element.getElementsByClassName('WindowTitle')[0];
    if ( tel ) {
      tel.innerHTML = '';
      tel.appendChild(document.createTextNode(t));
    }
    this._title = t;
    this._onChange('title');
  };

  Window.prototype._setIcon = function(i) {
    if ( this._$winicon ) {
      this._$winicon.src = i;
    }
    this._icon = i;
    this._onChange('icon');
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

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  // Classes
  OSjs.Core.Window            = Window;
  OSjs.Core.DialogWindow      = DialogWindow;
  OSjs.Core.WindowManager     = WindowManager;

  // Common API functions
  OSjs.API.getWindowSpace     = getWindowSpace;
  OSjs.API.getAnimDuration    = getAnimDuration;

})(OSjs.Utils, OSjs.API, OSjs.Core.Process);
