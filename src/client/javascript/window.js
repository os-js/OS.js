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
(function(Utils, API, GUI, Process) {
  'use strict';

  /**
   * The predefined events are as follows:
   * <pre><code>
   *  init          When window is being inited and rendered  => (root, scheme)
   *  inited        When window has been inited and rendered  => (scheme)
   *  focus         When window gets focus                    => ()
   *  blur          When window loses focus                   => ()
   *  destroy       When window is closed                     => ()
   *  maximize      When window is maxmimized                 => ()
   *  minimize      When window is minimized                  => ()
   *  restore       When window is restored                   => ()
   *  resize        When window is resized                    => (w, h)
   *  resized       Triggers after window is resized          => (w, h)
   *  move          When window is moved                      => (x, y)
   *  moved         Triggers after window is moved            => (x, y)
   *  keydown       When keydown                              => (ev, keyCode, shiftKey, ctrlKey, altKey)
   *  keyup         When keyup                                => (ev, keyCode, shiftKey, ctrlKey, altKey)
   *  keypress      When keypress                             => (ev, keyCode, shiftKey, ctrlKey, altKey)
   *  drop          When a drop event occurs                  => (ev, type, item, args, srcEl)
   *  drop:upload   When a upload file was dropped            => (ev, <File>, args)
   *  drop:file     When a internal file object was dropped   => (ev, VFS.File, args, srcEl)
   * </code></pre>
   * @typedef WindowEvent
   */

  function _noEvent(ev) {
    OSjs.API.blurMenu();
    ev.preventDefault();
    ev.stopPropagation();
    return false;
  }

  function camelCased(str) {
    return str.replace(/_([a-z])/g, function(g) {
      return g[1].toUpperCase();
    });
  }

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
        return (_ltzindex += 2);
      }
      return (_lzindex += 2);
    };
  })();

  /**
   * Wrapper for stopPropagation()
   * @return boolean
   */
  function stopPropagation(ev) {
    if ( ev ) {
      ev.stopPropagation();
    }
    return false;
  }

  /**
   * Get viewport (Wrapper)
   *
   * @return {Object}
   * @api OSjs.API.getWindowSpace()
   */
  function getWindowSpace() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      return wm.getWindowSpace();
    }
    return Utils.getRect();
  }

  /**
   * Wrapper to wait for animations to finish
   */
  function waitForAnimation(win, cb) {
    var wm = OSjs.Core.getWindowManager();
    var anim = wm ? wm.getSetting('animations') : false;
    if ( anim ) {
      win._animationCallback = cb;
    } else {
      cb();
    }
  }

  /**
   * Creates media queries from configuration file
   */
  var createMediaQueries = (function() {
    var queries;

    function _createQueries() {
      var result = {};

      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        var qs = wm._settings.get('mediaQueries') || {};

        Object.keys(qs).forEach(function(k) {
          if ( qs[k] ) {
            result[k] = function(w, h, ref) {
              return w <= qs[k];
            };
          }
        });
      }

      return result;
    }

    return function() {
      if ( !queries ) {
        queries = _createQueries();
      }
      return queries;
    };
  })();

  /**
   * Checks window dimensions and makes media queries dynamic
   */
  function checkMediaQueries(win) {
    if ( !win._$element ) {
      return;
    }

    var qs = win._properties.media_queries || {};
    var w = win._dimension.w;
    var h = win._dimension.h;
    var n = '';
    var k;

    for ( k in qs ) {
      if ( qs.hasOwnProperty(k) ) {
        if ( qs[k](w, h, win) ) {
          n = k;
          break;
        }
      }
    }

    win._$element.setAttribute('data-media', n);
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOW
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Window Class
   *
   * @summary Class used for basis as a Window.
   *
   * @param   {String}                    name                     Window name (unique)
   * @param   {Object}                    opts                     List of options
   * @param   {String}                    opts.title               Window Title
   * @param   {String}                    opts.icon                Window Icon
   * @param   {Number}                    [opts.x]                 X Position
   * @param   {Number}                    [opts.y]                 Y Position
   * @param   {Number}                    [opts.w]                 Width
   * @param   {Number}                    [opts.h]                 Height
   * @param   {String}                    [opts.tag]               Window Tag
   * @param   {String}                    [opts.gravity]           Window Gravity
   * @param   {boolean}                   [opts.allow_move]        Allow movment
   * @param   {boolean}                   [opts.allow_resize]      Allow resize
   * @param   {boolean}                   [opts.allow_minimize]    Allow minimize
   * @param   {boolean}                   [opts.allow_maximize]    Allow maximize
   * @param   {boolean}                   [opts.allow_close]       Allow closing
   * @param   {boolean}                   [opts.allow_windowlist]  Allow appear in WindowList (Panel)
   * @param   {boolean}                   [opts.allow_drop]        Allow DnD
   * @param   {boolean}                   [opts.allow_iconmenu]    Allow Menu when click on Window Icon
   * @param   {boolean}                   [opts.allow_ontop]       Allow ontop
   * @param   {boolean}                   [opts.allow_hotkeys]     Allow usage of hotkeys
   * @param   {boolean}                   [opts.allow_session]     Allow to store for session
   * @param   {boolean}                   [opts.key_capture]       Allow key capture (UNSUSED ?!)
   * @param   {boolean}                   [opts.min_width]         Minimum allowed width
   * @param   {boolean}                   [opts.min_height]        Minimum allowed height
   * @param   {boolean}                   [opts.max_width]         Maximum allowed width
   * @param   {boolean}                   [opts.max_height]        Maximum allowed height
   * @param   {Object}                    [opts.media_queries]     Media queries to apply CSS attribute => {name: fn(w,h,win) => Boolean }
   * @param   {String}                    [opts.sound]             Sound name when window is displayed
   * @param   {Number}                    [opts.sound_volume]      Sound volume
   * @param   {OSjs.Core.Application}     appRef                   Application Reference
   * @param   {OSjs.GUI.Scheme}           schemeRef                GUI Scheme Reference
   *
   * @abstract
   * @constructor
   * @memberof OSjs.Core
   * @mixes OSjs.Helpers.EventHandler
   * @throws {Error} On invalid arguments
   */
  var Window = (function() {
    var _WID                = 0;
    var _DEFAULT_WIDTH      = 200;
    var _DEFAULT_HEIGHT     = 200;
    var _DEFAULT_MIN_HEIGHT = 150;
    var _DEFAULT_MIN_WIDTH  = 150;
    var _DEFAULT_SND_VOLUME = 1.0;
    var _NAMES              = [];

    return function(name, opts, appRef, schemeRef) {
      var self = this;

      if ( _NAMES.indexOf(name) >= 0 ) {
        throw new Error(API._('ERR_WIN_DUPLICATE_FMT', name));
      }

      if ( appRef && !(appRef instanceof OSjs.Core.Application) ) {
        throw new TypeError('appRef given was not instance of Core.Application');
      }

      if ( schemeRef && !(schemeRef instanceof OSjs.GUI.Scheme) ) {
        throw new TypeError('schemeRef given was not instance of GUI.Scheme');
      }

      opts = Utils.argumentDefaults(opts, {
        icon: API.getThemeResource('wm.png', 'wm'),
        width: _DEFAULT_WIDTH,
        height: _DEFAULT_HEIGHT,
        title: name,
        tag: name
      });

      console.group('Window::constructor()', _WID, arguments);

      /**
       * The outer container
       * @name _$element
       * @memberof OSjs.Core.Window#
       * @type {Node}
       */
      this._$element = null;

      /**
       * The inner (content) container
       * @name _$root
       * @memberof OSjs.Core.Window#
       * @type {Node}
       */
      this._$root = null;

      /**
       * The top container
       * @name _$top
       * @memberof OSjs.Core.Window#
       * @type {Node}
       */
      this._$top = null;

      /**
       * The icon element
       * @name _$winicon
       * @memberof OSjs.Core.Window#
       * @type {Node}
       */
      this._$winicon = null;

      /**
       * The loading overlay
       * @name _$loading
       * @memberof OSjs.Core.Window#
       * @type {Node}
       */
      this._$loading = null;

      /**
       * The disabled overlay
       * @name _$disabled
       * @memberof OSjs.Core.Window#
       * @type {Node}
       */
      this._$disabled = null;

      /**
       * The resize underlay
       * @name _$resize
       * @memberof OSjs.Core.Window#
       * @type {Node}
       */
      this._$resize = null;

      /**
       * The warning overlay
       * @name _$warning
       * @memberof OSjs.Core.Window#
       * @type {Node}
       */
      this._$warning = null;

      /**
       * Constructor options copy
       * @name _opts
       * @memberof OSjs.Core.Window#
       * @type {Object}
       */
      this._opts = opts;

      /**
       * Application reference
       * @name _app
       * @memberof OSjs.Core.Window#
       * @type {OSjs.Core.Application}
       */
      this._app = appRef || null;

      /**
       * Scheme reference
       * @name _scheme
       * @memberof OSjs.Core.Window#
       * @type {OSjs.GUI.Scheme}
       */
      this._scheme = schemeRef || null;

      /**
       * If Window has been destroyed
       * @name _destroyed
       * @memberof OSjs.Core.Window#
       * @type {Boolean}
       */
      this._destroyed = false;

      /**
       * If Window was restored
       * @name _restored
       * @memberof OSjs.Core.Window#
       * @type {Boolean}
       */
      this._restored = false;

      /**
       * If Window is finished loading
       * @name _loaded
       * @memberof OSjs.Core.Window#
       * @type {Boolean}
       */
      this._loaded = false;

      /**
       * If Window is finished initing
       * @name _initialized
       * @memberof OSjs.Core.Window#
       * @type {Boolean}
       */
      this._initialized = false;

      /**
       * If Window is currently disabled
       * @name _disabled
       * @memberof OSjs.Core.Window#
       * @type {Boolean}
       */
      this._disabled = true;

      /**
       * If Window is currently loading
       * @name _loading
       * @memberof OSjs.Core.Window#
       * @type {Boolean}
       */
      this._loading = false;

      /**
       * Window ID (Internal)
       * @name _wid
       * @memberof OSjs.Core.Window#
       * @type {Number}
       */
      this._wid = _WID;

      /**
       * Window Icon
       * @name _icon
       * @memberof OSjs.Core.Window#
       * @type {String}
       */
      this._icon = opts.icon;

      /**
       * Window Name
       * @name _name
       * @memberof OSjs.Core.Window#
       * @type {String}
       */
      this._name = name;

      /**
       * Window Title
       * @name _title
       * @memberof OSjs.Core.Window#
       * @type {String}
       */
      this._title = opts.title;

      /**
       * Window Tag (ex. Use this when you have a group of windows)
       * @name _title
       * @memberof OSjs.Core.Window#
       * @type {String}
       */
      this._tag = opts.tag;

      /**
       * Window Position With x and y
       * @name _position
       * @memberof OSjs.Core.Window#
       * @type {Object}
       */
      this._position = {x:opts.x, y:opts.y};

      /**
       * Window Dimension With w and h
       * @name _dimension
       * @memberof OSjs.Core.Window#
       * @type {Object}
       */
      this._dimension     = {w:opts.width, h:opts.height};

      /**
       * Children
       * @name _children
       * @memberof OSjs.Core.Window#
       * @return {OSjs.Core.Window[]}
       */
      this._children = [];

      /**
       * Parent
       * @name _parent
       * @memberof OSjs.Core.Window#
       * @type {OSjs.Core.Window}
       */
      this._parent = null;

      /**
       * Original Window title (The one set on construct)
       * @name _origtitle
       * @memberof OSjs.Core.Window#
       * @type {String}
       */
      this._origtitle = this._title;

      /**
       * Last dimension (before window movement)
       * @name _lastDimension
       * @memberof OSjs.Core.Window#
       * @type {Object}
       */
      this._lastDimension = this._dimension;

      /**
       * Last position (before window movement)
       * @name _lastPosition
       * @memberof OSjs.Core.Window#
       * @type {Object}
       */
      this._lastPosition = this._position;

      /**
       * The sound this window makes when it is created
       * @name _sound
       * @memberof OSjs.Core.Window#
       * @type {String}
       */
      this._sound = null;

      /**
       * The volume of the window sound
       * @name _soundVolume
       * @memberof OSjs.Core.Window#
       * @type {Number} Between 0.0 and 1.0
       */
      this._soundVolume   = _DEFAULT_SND_VOLUME;

      /**
       * Window Properties
       * @name _properties
       * @memberof OSjs.Core.Window#
       * @type {Object}
       */
      this._properties    = {
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
        min_width         : _DEFAULT_MIN_HEIGHT,
        min_height        : _DEFAULT_MIN_WIDTH,
        max_width         : null,
        max_height        : null,
        media_queries     : createMediaQueries()
      };

      /**
       * Window State
       * @name _state
       * @memberof OSjs.Core.Window#
       * @type {Object}
       */
      this._state = {
        focused   : false,
        modal     : false,
        minimized : false,
        maximized : false,
        ontop     : false,
        onbottom  : false
      };

      this._animationCallback = null;

      //
      // Internals
      //

      this._queryTimer = null;

      this._evHandler = new OSjs.Helpers.EventHandler(name, [
        'focus', 'blur', 'destroy', 'maximize', 'minimize', 'restore',
        'move', 'moved', 'resize', 'resized',
        'keydown', 'keyup', 'keypress',
        'drop', 'drop:upload', 'drop:file'
      ]);

      //
      // Inherit properties given in arguments
      //

      Object.keys(opts).forEach(function(k) {
        if ( typeof self._properties[k] !== 'undefined' ) {
          self._properties[k] = opts[k];
        } else if ( typeof self._state[k] !== 'undefined' && k !== 'focused' ) {
          self._state[k] = opts[k];
        } else if ( ('sound', 'sound_volume').indexOf(k) !== -1 ) {
          self['_' + camelCased(k)] = opts[k];
        }
      });

      //
      // Make sure that properties are correct according to requested arguments
      //

      (function _initPosition(properties, position) {
        if ( !properties.gravity && (typeof position.x === 'undefined') || (typeof position.y === 'undefined') ) {
          var wm = OSjs.Core.getWindowManager();
          var np = wm ? wm.getWindowPosition() : {x:0, y:0};

          position.x = np.x;
          position.y = np.y;
        }
      })(this._properties, this._position);

      (function _initDimension(properties, dimension) {
        if ( properties.min_height && (dimension.h < properties.min_height) ) {
          dimension.h = properties.min_height;
        }
        if ( properties.max_width && (dimension.w < properties.max_width) ) {
          dimension.w = properties.max_width;
        }
        if ( properties.max_height && (dimension.h > properties.max_height) ) {
          dimension.h = properties.max_height;
        }
        if ( properties.max_width && (dimension.w > properties.max_width) ) {
          dimension.w = properties.max_width;
        }
      })(this._properties, this._dimension);

      (function _initRestore(position, dimension) {
        if ( appRef && appRef.__args && appRef.__args.__windows__ ) {
          appRef.__args.__windows__.forEach(function(restore) {
            if ( !self._restored && restore.name && restore.name === self._name ) {
              position.x = restore.position.x;
              position.y = restore.position.y;
              if ( self._properties.allow_resize ) {
                dimension.w = restore.dimension.w;
                dimension.h = restore.dimension.h;
              }

              console.info('RESTORED FROM SESSION', restore);
              self._restored = true;
            }
          });
        }
      })(this._position, this._dimension);

      (function _initGravity(properties, position, dimension, restored) {
        var grav = properties.gravity;
        if ( grav && !restored ) {
          if ( grav === 'center' ) {
            position.y = (window.innerHeight / 2) - (self._dimension.h / 2);
            position.x = (window.innerWidth / 2) - (self._dimension.w / 2);
          } else {
            var space = getWindowSpace();
            if ( grav.match(/^south/) ) {
              position.y = space.height - dimension.h;
            } else {
              position.y = space.top;
            }
            if ( grav.match(/west$/) ) {
              position.x = space.left;
            } else {
              position.x = space.width - dimension.w;
            }
          }
        }
      })(this._properties, this._position, this._dimension, this._restored);

      console.debug('State', this._state);
      console.debug('Properties', this._properties);
      console.debug('Position', this._position);
      console.debug('Dimension', this._dimension);
      console.groupEnd();

      _WID++;
    };
  })();

  /**
   * Initialize the Window
   *
   * This creates all elements and attaches basic events to them.
   * If you are looking for move/resize events, they are located in
   * the WindowManager.
   *
   * @function init
   * @memberof OSjs.Core.Window#
   *
   * @param   {OSjs.Core.WindowManager}   _wm     Window Manager reference
   * @param   {OSjs.Core.Application}     _app    Application reference
   * @param   {OSjs.GUI.Scheme}           _scheme UIScheme reference
   *
   * @return  {Node} The Window DOM element
   */
  Window.prototype.init = function(_wm, _app, _scheme) {
    var self = this;

    if ( this._initialized || this._loaded ) {
      return this._$root;
    }

    // Create DOM
    this._$element = Utils.$create('application-window', {
      className: (function(n, t) {
        var classNames = ['Window', Utils.$safeName(n)];
        if ( t && (n !== t) ) {
          classNames.push(Utils.$safeName(t));
        }
        return classNames;
      })(this._name, this._tag).join(' '),
      style: {
        width: this._dimension.w + 'px',
        height: this._dimension.h + 'px',
        top: this._position.y + 'px',
        left: this._position.x + 'px',
        zIndex: getNextZindex(this._state.ontop)
      },
      data: {
        window_id: this._wid,
        allow_resize: this._properties.allow_resize,
        allow_minimize: this._properties.allow_minimize,
        allow_maximize: this._properties.allow_maximize,
        allow_close: this._properties.allow_close
      },
      aria: {
        role: 'application',
        live: 'polite',
        hidden: 'false'
      }
    });

    this._$root = document.createElement('application-window-content');
    this._$resize = document.createElement('application-window-resize');

    ['nw', 'n',  'ne', 'e', 'se', 's', 'sw', 'w'].forEach(function(i) {
      var h = document.createElement('application-window-resize-handle');
      h.setAttribute('data-direction', i);
      self._$resize.appendChild(h);
      h = null;
    });

    this._$loading = document.createElement('application-window-loading');
    this._$disabled = document.createElement('application-window-disabled');
    this._$top = document.createElement('application-window-top');
    this._$winicon = document.createElement('application-window-icon');
    this._$winicon.setAttribute('role', 'button');
    this._$winicon.setAttribute('aria-haspopup', 'true');
    this._$winicon.setAttribute('aria-label', 'Window Menu');

    var windowTitle = document.createElement('application-window-title');
    windowTitle.setAttribute('role', 'heading');

    // Bind events
    Utils.$bind(this._$loading, 'mousedown', _noEvent);
    Utils.$bind(this._$disabled, 'mousedown', _noEvent);

    var preventTimeout;
    function _onanimationend(ev) {
      if ( typeof self._animationCallback === 'function') {
        clearTimeout(preventTimeout);
        preventTimeout = setTimeout(function() {
          self._animationCallback(ev);
          self._animationCallback = false;
          preventTimeout = clearTimeout(preventTimeout);
        }, 10);
      }
    }

    Utils.$bind(this._$element, 'transitionend', _onanimationend);
    Utils.$bind(this._$element, 'animationend', _onanimationend);

    Utils.$bind(this._$element, 'mousedown', function(ev) {
      self._focus();
      return stopPropagation(ev);
    });

    Utils.$bind(this._$element, 'contextmenu', function(ev) {
      var r = Utils.$isFormElement(ev);

      if ( !r ) {
        ev.preventDefault();
        ev.stopPropagation();
      }

      OSjs.API.blurMenu();

      return !!r;
    });

    Utils.$bind(this._$top, 'click', function(ev) {
      var t = ev.isTrusted ? ev.target : (ev.relatedTarget || ev.target);

      ev.preventDefault();
      if ( t ) {
        if ( t.tagName.match(/^APPLICATION\-WINDOW\-BUTTON/) ) {
          self._onWindowButtonClick(ev, t, t.getAttribute('data-action'));
        } else if ( t.tagName === 'APPLICATION-WINDOW-ICON' ) {
          ev.stopPropagation();
          self._onWindowIconClick(ev, t);
        }
      }
    }, true);

    Utils.$bind(windowTitle, 'mousedown', _noEvent);
    Utils.$bind(windowTitle, 'dblclick', function() {
      self._maximize();
    });

    (function _initDnD(properties, main, compability) {
      if ( properties.allow_drop && compability.dnd ) {
        var border = document.createElement('div');
        border.className = 'WindowDropRect';

        OSjs.GUI.Helpers.createDroppable(main, {
          onOver: function(ev, el, args) {
            main.setAttribute('data-dnd-state', 'true');
          },

          onLeave : function() {
            main.setAttribute('data-dnd-state', 'false');
          },

          onDrop : function() {
            main.setAttribute('data-dnd-state', 'false');
          },

          onItemDropped: function(ev, el, item, args) {
            main.setAttribute('data-dnd-state', 'false');
            return self._onDndEvent(ev, 'itemDrop', item, args, el);
          },
          onFilesDropped: function(ev, el, files, args) {
            main.setAttribute('data-dnd-state', 'false');
            return self._onDndEvent(ev, 'filesDrop', files, args, el);
          }
        });
      }
    })(this._properties, this._$element, Utils.getCompability());

    // Append to DOM
    windowTitle.appendChild(document.createTextNode(this._title));

    this._$top.appendChild(this._$winicon);
    this._$top.appendChild(windowTitle);
    this._$top.appendChild(Utils.$create('application-window-button-minimize', {
      className: 'application-window-button-entry',
      data: {
        action: 'minimize'
      },
      aria: {
        role: 'button',
        label: 'Minimize Window'
      }
    }));

    this._$top.appendChild(Utils.$create('application-window-button-maximize', {
      className: 'application-window-button-entry',
      data: {
        action: 'maximize'
      },
      aria: {
        role: 'button',
        label: 'Maximize Window'
      }
    }));

    this._$top.appendChild(Utils.$create('application-window-button-close', {
      className: 'application-window-button-entry',
      data: {
        action: 'close'
      },
      aria: {
        role: 'button',
        label: 'Close Window'
      }
    }));

    this._$loading.appendChild(document.createElement('application-window-loading-indicator'));
    this._$element.appendChild(this._$top);
    this._$element.appendChild(this._$root);
    this._$element.appendChild(this._$resize);
    this._$element.appendChild(this._$disabled);
    document.body.appendChild(this._$element);

    // Final stuff
    this._onChange('create');
    this._toggleLoading(false);
    this._toggleDisabled(false);
    this._setIcon(API.getIcon(this._icon, null, this._app));
    this._updateMarkup();

    if ( this._sound ) {
      API.playSound(this._sound, this._soundVolume);
    }

    this._initialized = true;
    this._emit('init', [this._$root, _scheme]);

    return this._$root;
  };

  /**
   * When window is rendered and inited
   *
   * @function _inited
   * @memberof OSjs.Core.Window#
   */
  Window.prototype._inited = function() {
    if ( this._loaded ) {
      return;
    }

    this._loaded = true;

    this._onResize();

    if ( !this._restored ) {
      if ( this._state.maximized ) {
        this._maximize(true);
      } else if ( this._state.minimized ) {
        this._minimize(true);
      }
    }

    var self = this;
    var inittimeout = setTimeout(function() {
      self._emit('inited', [self._scheme]);
      inittimeout = clearTimeout(inittimeout);
    }, 10);

    if ( this._app ) {
      this._app._onMessage('initedWindow', this, {});
    }

    console.debug('Window::_inited()', this._name);
  };

  /**
   * Destroy the Window
   *
   * @function destroy
   * @memberof OSjs.Core.Window#
   *
   * @return  Boolean
   */
  Window.prototype.destroy = function(shutdown) {
    var self = this;

    if ( this._destroyed ) {
      return false;
    }

    this._emit('destroy');

    this._destroyed = true;

    var wm = OSjs.Core.getWindowManager();

    console.group('Window::destroy()');

    // Nulls out stuff
    function _removeDOM() {
      self._setWarning(null);

      self._$root       = null;
      self._$top        = null;
      self._$winicon    = null;
      self._$loading    = null;
      self._$disabled   = null;
      self._$resize     = null;
      self._$warning    = null;
      self._$element    = Utils.$remove(self._$element);
    }

    // Removed DOM elements and their referring objects (GUI Elements etc)
    function _destroyDOM() {
      if ( self._$element ) {
        // Make sure to remove any remaining event listeners
        self._$element.querySelectorAll('*').forEach(function(iter) {
          if ( iter ) {
            Utils.$unbind(iter);
          }
        });
      }
      if ( self._parent ) {
        self._parent._removeChild(self);
      }
      self._parent = null;
      self._removeChildren();
    }

    // Destroys the window
    function _destroyWin() {
      if ( wm ) {
        wm.removeWindow(self);
      }

      var curWin = wm ? wm.getCurrentWindow() : null;
      if ( curWin && curWin._wid === self._wid ) {
        wm.setCurrentWindow(null);
      }

      var lastWin = wm ? wm.getLastWindow() : null;
      if ( lastWin && lastWin._wid === self._wid ) {
        wm.setLastWindow(null);
      }
    }

    function _animateClose(fn) {
      if ( API.isShuttingDown() ) {
        fn();
      } else {
        if ( self._$element ) {
          var anim = wm ? wm.getSetting('animations') : false;
          if ( anim ) {
            self._$element.setAttribute('data-hint', 'closing');
            self._animationCallback = fn;

            // This prevents windows from sticking when shutting down.
            // In some cases this would happen when you remove the stylesheet
            // with animation properties attached.
            var animatetimeout = setTimeout(function() {
              if ( self._animationCallback ) {
                self._animationCallback();
              }
              animatetimeout = clearTimeout(animatetimeout);
            }, 1000);
          } else {
            self._$element.style.display = 'none';
            fn();
          }
        }
      }
    }

    this._onChange('close');

    _animateClose(function() {
      _removeDOM();
    });
    _destroyDOM();
    _destroyWin();

    // App messages
    if ( this._app ) {
      this._app._onMessage('destroyWindow', this, {});
    }

    if ( this._evHandler ) {
      this._evHandler.destroy();
    }

    this._scheme = null;
    this._app = null;
    this._evHandler = null;
    this._args = {};
    this._queryTimer = clearTimeout(this._queryTimer);

    console.groupEnd();

    return true;
  };

  //
  // GUI And Event Hooks
  //

  /**
   * Finds a GUI Element by ID from Scheme.
   *
   * THIS IS JUST A SHORTCUT METHOD FROM THE UI SCHEME CLASS
   *
   * @function _find
   * @memberof OSjs.Core.Window#
   * @see OSjs.GUI.Scheme#find
   *
   * @param     {String}      id        The value of element 'data-id' parameter
   *
   * @return {OSjs.GUI.Element}
   */
  Window.prototype._find = function(id) {
    return this._scheme ? this._scheme.find(this, id) : null;
  };

  /**
   * Finds a GUI Element by ID from Scheme.
   *
   * THIS IS JUST A SHORTCUT METHOD FROM THE UI SCHEME CLASS
   *
   * @function _findByQuery
   * @memberof OSjs.Core.Window#
   * @see OSjs.GUI.Scheme#findByQuery
   *
   * @return {(Array|OSjs.GUI.Element)}
   */
  Window.prototype._findByQuery = function(q, root, all) {
    return this._scheme ? this._scheme.findByQuery(this, q, root, all) : null;
  };

  /**
   * Fire a hook to internal event
   *
   * @function _emit
   * @memberof OSjs.Core.Window#
   * @see OSjs.Helpers.EventHandler#emit
   *
   * @param   {WindowEvent}    k       Event name
   * @param   {Array}          args    Send these arguments (fn.apply)
   *
   * @return {Boolean}
   */
  Window.prototype._emit = function(k, args) {
    if ( !this._destroyed ) {
      if ( this._evHandler ) {
        return this._evHandler.emit(k, args);
      }
    }
    return false;
  };

  /**
   * Adds a hook to internal event
   *
   * @function _on
   * @memberof OSjs.Core.Window#
   * @see OSjs.Helpers.EventHandler#on
   *
   * @param   {WindowEvent}    k       Event name
   * @param   {Function}       func    Callback function
   *
   * @return  {Number}
   */
  Window.prototype._on = function(k, func) {
    if ( this._evHandler ) {
      return this._evHandler.on(k, func, this);
    }
    return false;
  };

  /**
   * Removes a hook to internal event
   *
   * @function _off
   * @memberof OSjs.Core.Window#
   * @see OSjs.Helpers.EventHandler#off
   *
   * @param   {WindowEvent}    k       Event name
   * @param   {Number}         idx     The hook index returned from _on()
   *
   * @return {Boolean}
   */
  Window.prototype._off = function(k, idx) {
    if ( this._evHandler ) {
      return this._evHandler.off(k, idx);
    }
    return false;
  };

  //
  // Children (Windows)
  //

  /**
   * Add a child-window
   *
   * @function _addChild
   * @memberof OSjs.Core.Window#
   * @see OSjs.Helpers.EventHandler#off
   *
   * @return  {OSjs.Core.Window} The added instance
   */
  Window.prototype._addChild = function(w, wmAdd, wmFocus) {
    console.debug('Window::_addChild()');
    w._parent = this;

    var wm = OSjs.Core.getWindowManager();
    if ( wmAdd && wm ) {
      wm.addWindow(w, wmFocus);
    }
    this._children.push(w);

    return w;
  };

  /**
   * Removes a child Window
   *
   * @function _removeChild
   * @memberof OSjs.Core.Window#
   *
   * @param   {OSjs.Core.Window}    w     Widow reference
   *
   * @return  {Boolean}         On success
   */
  Window.prototype._removeChild = function(w) {
    var self = this;

    this._children.forEach(function(child, i) {
      if ( child && child._wid === w._wid ) {
        console.debug('Window::_removeChild()');
        child.destroy();
        self._children[i] = null;
      }
    });
  };

  /**
   * Get a Window child by X
   *
   * @function _getChild
   * @memberof OSjs.Core.Window#
   *
   * @param   {String}      value   Value to look for
   * @param   {String}      key     Key to look for
   *
   * @return  {OSjs.Core.Window} Resulted Window or 'null'
   */
  Window.prototype._getChild = function(value, key) {
    key = key || 'wid';

    var result = key === 'tag' ? [] : null;
    this._children.every(function(child, i) {
      if ( child ) {
        if ( key === 'tag' ) {
          result.push(child);
        } else {
          if ( child['_' + key] === value ) {
            result = child;
            return false;
          }
        }
      }
      return true;
    });
    return result;
  };

  /**
   * Get a Window child by ID
   *
   * @function _getChildById
   * @memberof OSjs.Core.Window#
   * @see OSjs.Core.Window#_getChild
   *
   * @param {Number} id Window id
   * @return {OSjs.Core.Window}
   */
  Window.prototype._getChildById = function(id) {
    return this._getChild(id, 'wid');
  };

  /**
   * Get a Window child by Name
   *
   * @function _getChildByName
   * @memberof OSjs.Core.Window#
   * @see OSjs.Core.Window#_getChild
   *
   * @param {String} name Window name
   * @return {OSjs.Core.Window}
   */
  Window.prototype._getChildByName = function(name) {
    return this._getChild(name, 'name');
  };

  /**
   * Get Window(s) child by Tag
   *
   * @function _getChildrenByTag
   * @memberof OSjs.Core.Window#
   * @see OSjs.Core.Window#_getChild
   *
   * @param {String} tag Tag name
   *
   * @return {OSjs.Core.Window[]}
   */
  Window.prototype._getChildrenByTag = function(tag) {
    return this._getChild(tag, 'tag');
  };

  /**
   * Gets all children Windows
   *
   * @function _getChildren
   * @memberof OSjs.Core.Window#
   *
   * @return {OSjs.Core.Window[]}
   */
  Window.prototype._getChildren = function() {
    return this._children;
  };

  /**
   * Removes all children Windows
   *
   * @function _removeChildren
   * @memberof OSjs.Core.Window#
   */
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

  /**
   * Close the Window
   *
   * @function _close
   * @memberof OSjs.Core.Window#
   *
   * @return  {Boolean}     On succes
   */
  Window.prototype._close = function() {
    console.debug('Window::_close()');
    if ( this._disabled || this._destroyed ) {
      return false;
    }

    this._blur();
    this.destroy();

    return true;
  };

  /**
   * Minimize the Window
   *
   * @function _minimize
   * @memberof OSjs.Core.Window#
   *
   * @return    {Boolean}     On success
   */
  Window.prototype._minimize = function(force) {
    var self = this;
    if ( !this._properties.allow_minimize || this._destroyed  ) {
      return false;
    }

    if ( !force && this._state.minimized ) {
      this._restore(false, true);
      return true;
    }

    console.debug(this._name, '>', 'Window::_minimize()');

    this._blur();

    this._state.minimized = true;
    this._$element.setAttribute('data-minimized', 'true');

    waitForAnimation(this, function() {
      self._$element.style.display = 'none';
      self._emit('minimize');
    });

    this._onChange('minimize');

    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid === this._wid ) {
      wm.setCurrentWindow(null);
    }

    this._updateMarkup();

    return true;
  };

  /**
   * Maximize the Window
   *
   * @function _maximize
   * @memberof OSjs.Core.Window#
   *
   * @return    {Boolean}     On success
   */
  Window.prototype._maximize = function(force) {
    var self = this;

    if ( !this._properties.allow_maximize || this._destroyed || !this._$element  ) {
      return false;
    }

    if ( !force && this._state.maximized ) {
      this._restore(true, false);
      return true;
    }

    console.debug(this._name, '>', 'Window::_maximize()');

    this._lastPosition    = {x: this._position.x,  y: this._position.y};
    this._lastDimension   = {w: this._dimension.w, h: this._dimension.h};
    this._state.maximized = true;

    var s = this._getMaximizedSize();
    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.style.top    = (s.top) + 'px';
    this._$element.style.left   = (s.left) + 'px';
    this._$element.style.width  = (s.width) + 'px';
    this._$element.style.height = (s.height) + 'px';
    this._$element.setAttribute('data-maximized', 'true');

    //this._resize();
    this._dimension.w = s.width;
    this._dimension.h = s.height;
    this._position.x  = s.left;
    this._position.y  = s.top;

    this._focus();

    waitForAnimation(this, function() {
      self._emit('maximize');
    });

    this._onChange('maximize');
    this._onResize();

    this._updateMarkup();

    return true;
  };

  /**
   * Restore the Window
   *
   * @function _restore
   * @memberof OSjs.Core.Window#
   *
   * @param     {Boolean}     max     Revert maximize state
   * @param     {Boolean}     min     Revert minimize state
   */
  Window.prototype._restore = function(max, min) {
    var self = this;

    if ( !this._$element || this._destroyed  ) {
      return;
    }

    function restoreMaximized() {
      if ( max && self._state.maximized ) {
        self._move(self._lastPosition.x, self._lastPosition.y);
        self._resize(self._lastDimension.w, self._lastDimension.h);
        self._state.maximized = false;
        self._$element.setAttribute('data-maximized', 'false');
      }
    }

    function restoreMinimized() {
      if ( min && self._state.minimized ) {
        self._$element.style.display = 'block';
        self._$element.setAttribute('data-minimized', 'false');
        self._state.minimized = false;
      }
    }

    console.debug(this._name, '>', 'Window::_restore()');

    max = (typeof max === 'undefined') ? true : (max === true);
    min = (typeof min === 'undefined') ? true : (min === true);

    restoreMaximized();
    restoreMinimized();

    waitForAnimation(this, function() {
      self._emit('restore');
    });

    this._onChange('restore');
    this._onResize();

    this._focus();

    this._updateMarkup();
  };

  /**
   * Focus the window
   *
   * @function _focus
   * @memberof OSjs.Core.Window#
   *
   * @param   {Boolean}     force     Forces focus
   *
   * @return  {Boolean}               On success
   */
  Window.prototype._focus = function(force) {
    if ( !this._$element || this._destroyed ) {
      return false;
    }

    console.debug(this._name, '>', 'Window::_focus()');

    this._toggleAttentionBlink(false);

    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.setAttribute('data-focused', 'true');

    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid !== this._wid ) {
      win._blur();
    }

    if ( wm ) {
      wm.setCurrentWindow(this);
      wm.setLastWindow(this);
    }

    if ( !this._state.focused || force) {
      this._onChange('focus');
      this._emit('focus');
    }

    this._state.focused = true;

    this._updateMarkup();

    return true;
  };

  /**
   * Blur the window
   *
   * @function _blur
   * @memberof OSjs.Core.Window#
   *
   * @param   {Boolean}     force     Forces blur
   *
   * @return  {Boolean}               On success
   */
  Window.prototype._blur = function(force) {
    if ( !this._$element || this._destroyed || (!force && !this._state.focused) ) {
      return false;
    }

    console.debug(this._name, '>', 'Window::_blur()');

    this._$element.setAttribute('data-focused', 'false');
    this._state.focused = false;

    this._onChange('blur');
    this._emit('blur');

    // Force all standard HTML input elements to loose focus
    this._blurGUI();

    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid === this._wid ) {
      wm.setCurrentWindow(null);
    }

    this._updateMarkup();

    return true;
  };

  /**
   * Blurs the GUI
   *
   * @function _blurGUI
   * @memberof OSjs.Core.Window#
   */
  Window.prototype._blurGUI = function() {
    this._$root.querySelectorAll('input, textarea, select, iframe, button').forEach(function(el) {
      el.blur();
    });
  };

  /**
   * Resize Window to given size
   *
   * Use this method if you want the window to fit into the viewport and not
   * just set a specific size
   *
   * @function _resizeTo
   * @memberof OSjs.Core.Window#
   *
   * @param   {Number}      dw                   Width
   * @param   {Number}      dh                   Height
   * @param   {Boolean}     [limit=true]         Limit to this size
   * @param   {Boolean}     [move=false]         Move window if too big
   * @param   {Node}        [container=null]     Relative to this container
   * @param   {Boolean}     [force=false]        Force movment
   */
  Window.prototype._resizeTo = function(dw, dh, limit, move, container, force) {
    var self = this;
    if ( !this._$element || (dw <= 0 || dh <= 0) ) {
      return;
    }

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

    function _limitTo() {
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
          newH = (space.height - cy + self._$top.offsetHeight) + dy;
        }
      } else {
        newH += dy;
      }
    }

    function _moveTo() {
      if ( newX !== null ) {
        self._move(newX, self._position.y);
      }
      if ( newY !== null ) {
        self._move(self._position.x, newY);
      }
    }

    function _resizeFinished() {
      var wm = OSjs.Core.getWindowManager();
      var anim = wm ? wm.getSetting('animations') : false;
      if ( anim ) {
        self._animationCallback = function() {
          self._emit('resized');
        };
      } else {
        self._emit('resized');
      }
    }

    if ( limit ) {
      _limitTo();
    }

    this._resize(newW, newH, force);

    _moveTo();
    _resizeFinished();
  };

  // TODO: Optimize
  Window.prototype._resize = function(w, h, force) {
    if ( !this._$element || this._destroyed  ) {
      return false;
    }

    var p = this._properties;

    if ( !force ) {
      if ( !p.allow_resize ) {
        return false;
      }
      (function() {
        if ( !isNaN(w) && w ) {
          if ( w < p.min_width ) {
            w = p.min_width;
          }
          if ( p.max_width !== null ) {
            if ( w > p.max_width ) {
              w = p.max_width;
            }
          }
        }
      })();

      (function() {
        if ( !isNaN(h) && h ) {
          if ( h < p.min_height ) {
            h = p.min_height;
          }
          if ( p.max_height !== null ) {
            if ( h > p.max_height ) {
              h = p.max_height;
            }
          }
        }
      })();
    }

    if ( !isNaN(w) && w ) {
      this._$element.style.width = w + 'px';
      this._dimension.w = w;
    }

    if ( !isNaN(h) && h ) {
      this._$element.style.height = h + 'px';
      this._dimension.h = h;
    }

    this._onResize();

    return true;
  };

  /**
   * Move window to position
   *
   * @function _moveTo
   * @memberof OSjs.Core.Window#
   *
   * @param   {Object}      pos       Position rectangle
   */
  Window.prototype._moveTo = function(pos) {
    var wm = OSjs.Core.getWindowManager();
    if ( !wm ) {
      return;
    }

    var s = wm.getWindowSpace();
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

  /**
   * Move window to position
   *
   * @function _move
   * @memberof OSjs.Core.Window#
   *
   * @param   {Number}       x     X Position
   * @param   {Number}       y     Y Position
   *
   * @return  {Boolean}         On success
   */
  Window.prototype._move = function(x, y) {
    if ( !this._$element || this._destroyed || !this._properties.allow_move  ) {
      return false;
    }

    if ( typeof x === 'undefined' || typeof y === 'undefined') {
      return false;
    }

    this._$element.style.top  = y + 'px';
    this._$element.style.left = x + 'px';
    this._position.x          = x;
    this._position.y          = y;

    return true;
  };

  /**
   * Toggle disabled overlay
   *
   * @function _toggleDisabled
   * @memberof OSjs.Core.Window#
   *
   * @param     {Boolean}     t       Toggle
   */
  Window.prototype._toggleDisabled = function(t) {
    console.debug(this._name, '>', 'Window::_toggleDisabled()', t);
    if ( this._$disabled ) {
      this._$disabled.style.display = t ? 'block' : 'none';
    }

    this._disabled = t ? true : false;

    this._updateMarkup();
  };

  /**
   * Toggle loading overlay
   *
   * @function _toggleLoading
   * @memberof OSjs.Core.Window#
   *
   * @param     {Boolean}     t       Toggle
   */
  Window.prototype._toggleLoading = function(t) {
    console.debug(this._name, '>', 'Window::_toggleLoading()', t);
    if ( this._$loading ) {
      this._$loading.style.display = t ? 'block' : 'none';
    }

    this._loading = t ? true : false;

    this._updateMarkup();
  };

  /**
   * Updates window markup with attributes etc
   *
   * @function _updateMarkup
   * @memberof OSjs.Core.Window#
   */
  Window.prototype._updateMarkup = function(ui) {
    if ( !this._$element ) {
      return;
    }

    var t = this._loading || this._disabled;
    var d = this._disabled;
    var h = this._state.minimized;
    var f = !this._state.focused;

    this._$element.setAttribute('aria-busy', String(t));
    this._$element.setAttribute('aria-hidden', String(h));
    this._$element.setAttribute('aria-disabled', String(d));
    this._$root.setAttribute('aria-hidden', String(f));

    if ( !ui ) {
      return;
    }

    var dmax   = this._properties.allow_maximize === true ? 'inline-block' : 'none';
    var dmin   = this._properties.allow_minimize === true ? 'inline-block' : 'none';
    var dclose = this._properties.allow_close === true ? 'inline-block' : 'none';

    this._$top.querySelector('application-window-button-maximize').style.display = dmax;
    this._$top.querySelector('application-window-button-minimize').style.display = dmin;
    this._$top.querySelector('application-window-button-close').style.display = dclose;

    var dres   = this._properties.allow_resize === true;

    this._$element.setAttribute('data-allow-resize', String(dres));
  };

  /**
   * Toggle attention
   *
   * @function _toggleAttentionBlink
   * @memberof OSjs.Core.Window#
   *
   * @param     {Boolean}     t       Toggle
   */
  Window.prototype._toggleAttentionBlink = function(t) {
    if ( !this._$element || this._destroyed || this._state.focused ) {
      return false;
    }

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

    _blink(t);

    return true;
  };

  /**
   * Check next Tab (cycle GUIElement)
   *
   * @function _nextTabIndex
   * @memberof OSjs.Core.Window#
   *
   * @param   {Event}     ev            DOM Event
   */
  Window.prototype._nextTabIndex = function(ev) {
    var nextElement = OSjs.GUI.Helpers.getNextElement(ev.shiftKey, document.activeElement, this._$root);
    if ( nextElement ) {
      if ( Utils.$hasClass(nextElement, 'gui-data-view') ) {
        new OSjs.GUI.ElementDataView(nextElement)._call('focus');
      } else {
        try {
          nextElement.focus();
        } catch ( e ) {}
      }
    }
  };

  //
  // Events
  //

  /**
   * On Drag-and-drop event
   *
   * @function _onDndEvent
   * @memberof OSjs.Core.Window#
   *
   * @param   {Event}     ev        DOM Event
   * @param   {String}    type      DnD type
   *
   * @return  {Boolean} On success
   */
  Window.prototype._onDndEvent = function(ev, type, item, args, el) {
    if ( this._disabled || this._destroyed ) {
      return false;
    }

    console.debug('Window::_onDndEvent()', type, item, args);

    this._emit('drop', [ev, type, item, args, el]);

    if ( item ) {
      if ( type === 'filesDrop' ) {
        this._emit('drop:upload', [ev, item, args, el]);
      } else if ( type === 'itemDrop' && item.type === 'file' && item.data ) {
        this._emit('drop:file', [ev, new OSjs.VFS.File(item.data || {}), args, el]);
      }
    }

    return true;
  };

  /**
   * On Key event
   *
   * @function _onKeyEvent
   * @memberof OSjs.Core.Window#
   *
   * @param   {Event}      ev        DOM Event
   * @param   {String}     type      Key type
   */
  Window.prototype._onKeyEvent = function(ev, type) {
    if ( this._destroyed ) {
      return false;
    }

    if ( type === 'keydown' && ev.keyCode === Utils.Keys.TAB ) {
      this._nextTabIndex(ev);
    }

    this._emit(type, [ev, ev.keyCode, ev.shiftKey, ev.ctrlKey, ev.altKey]);

    return true;
  };

  /**
   * On Window resized
   *
   * @function _onResize
   * @memberof OSjs.Core.Window#
   */
  Window.prototype._onResize = function() {
    clearTimeout(this._queryTimer);

    var self = this;
    this._queryTimer = setTimeout(function() {
      checkMediaQueries(self);
      self._queryTimer = clearTimeout(self._queryTimer);
    }, 20);
  };

  /**
   * On Window Icon Click
   *
   * @function _onResize
   * @memberof OSjs.Core.Window#
   *
   * @param   {Event}   ev        DOM Event
   * @param   {Node}    el        DOM Element
   */
  Window.prototype._onWindowIconClick = function(ev, el) {
    if ( !this._properties.allow_iconmenu || this._destroyed  ) {
      return;
    }

    console.debug(this._name, '>', 'Window::_onWindowIconClick()');

    var self = this;
    var control = [
      [this._properties.allow_minimize, function() {
        return {
          title: API._('WINDOW_MINIMIZE'),
          icon: API.getIcon('actions/stock_up.png'),
          onClick: function(name, iter) {
            self._minimize();
          }
        };
      }],
      [this._properties.allow_maximize, function() {
        return {
          title: API._('WINDOW_MAXIMIZE'),
          icon: API.getIcon('actions/window_fullscreen.png'),
          onClick: function(name, iter) {
            self._maximize();
            self._focus();
          }
        };
      }],
      [this._state.maximized, function() {
        return {
          title: API._('WINDOW_RESTORE'),
          icon: API.getIcon('actions/view-restore.png'),
          onClick: function(name, iter) {
            self._restore();
            self._focus();
          }
        };
      }],
      [this._properties.allow_ontop, function() {
        if ( self._state.ontop ) {
          return {
            title: API._('WINDOW_ONTOP_OFF'),
            icon: API.getIcon('actions/window-new.png'),
            onClick: function(name, iter) {
              self._state.ontop = false;
              if ( self._$element ) {
                self._$element.style.zIndex = getNextZindex(false);
              }
              self._focus();
            }
          };
        }

        return {
          title: API._('WINDOW_ONTOP_ON'),
          icon: API.getIcon('actions/window-new.png'),
          onClick: function(name, iter) {
            self._state.ontop = true;
            if ( self._$element ) {
              self._$element.style.zIndex = getNextZindex(true);
            }
            self._focus();
          }
        };
      }],
      [this._properties.allow_close, function() {
        return {
          title: API._('WINDOW_CLOSE'),
          icon: API.getIcon('actions/window-close.png'),
          onClick: function(name, iter) {
            self._close();
          }
        };
      }]
    ];

    var list = [];
    control.forEach(function(iter) {
      if (iter[0] ) {
        list.push(iter[1]());
      }
    });

    OSjs.API.createMenu(list, ev);
  };

  /**
   * On Window Button Click
   *
   * @function _onWindowButtonClick
   * @memberof OSjs.Core.Window#
   *
   * @param   {Event}   ev        DOM Event
   * @param   {Node}    el        DOM Element
   * @param   {String}  btn       Button name
   */
  Window.prototype._onWindowButtonClick = function(ev, el, btn) {
    console.debug(this._name, '>', 'Window::_onWindowButtonClick()', btn);

    this._blurGUI();

    if ( btn === 'close' ) {
      this._close();
    } else if ( btn === 'minimize' ) {
      this._minimize();
    } else if ( btn === 'maximize' ) {
      this._maximize();
    }
  };

  /**
   * On Window has changed
   *
   * @function _onChange
   * @memberof OSjs.Core.Window#
   *
   * @param   {Event}     ev        DOM Event
   * @param   {Boolean}   byUser    Performed by user?
   */
  Window.prototype._onChange = function(ev, byUser) {
    ev = ev || '';
    if ( ev ) {
      console.debug(this._name, '>', 'Window::_onChange()', ev);
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.eventWindow(ev, this);
      }
    }
  };

  //
  // Getters
  //

  /**
   * Get Window maximized size
   *
   * @function _getMaximizedSize
   * @memberof OSjs.Core.Window#
   *
   * @return    {Object}      Size in rectangle
   */
  Window.prototype._getMaximizedSize = function() {
    var s = getWindowSpace();
    if ( !this._$element || this._destroyed ) {
      return s;
    }

    var topMargin = 23;
    var borderSize = 0;

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      var theme = wm.getStyleTheme(true);
      if ( theme && theme.style && theme.style.window ) {
        topMargin = theme.style.window.margin;
        borderSize = theme.style.window.border;
      }
    }

    s.left += borderSize;
    s.top += borderSize;
    s.width -= (borderSize * 2);
    s.height -= topMargin + (borderSize * 2);

    return Object.freeze(s);
  };

  /**
   * Get Window position in DOM
   *
   * @function _getViewRect
   * @memberof OSjs.Core.Window#
   * @see OSjs.Utils.position
   */
  Window.prototype._getViewRect = function() {
    return this._$element ? Object.freeze(Utils.$position(this._$element)) : null;
  };

  /**
   * Get Window main DOM element
   *
   * @function _getRoot
   * @memberof OSjs.Core.Window#
   *
   * @return  {Node}
   */
  Window.prototype._getRoot = function() {
    return this._$root;
  };

  /**
   * Get Window z-index
   *
   * @function _getZindex
   * @memberof OSjs.Core.Window#
   *
   * @return    {Number}
   */
  Window.prototype._getZindex = function() {
    if ( this._$element ) {
      return parseInt(this._$element.style.zIndex, 10);
    }
    return -1;
  };

  /**
   * Set Window title
   *
   * @function _setTitle
   * @memberof OSjs.Core.Window#
   *
   * @param   {String}      t           Title
   * @param   {Boolean}     [append]    Append this to original title
   * @param   {String}      [delimiter] The delimiter (default is -)
   */
  Window.prototype._setTitle = function(t, append, delimiter) {
    if ( !this._$element || this._destroyed ) {
      return;
    }

    delimiter = delimiter || '-';

    var tel = this._$element.getElementsByTagName('application-window-title')[0];
    var text = [];
    if ( append ) {
      text = [this._origtitle, delimiter, t];
    } else {
      text = [t || this._origtitle];
    }

    this._title = text.join(' ') || this._origtitle;

    if ( tel ) {
      Utils.$empty(tel);
      tel.appendChild(document.createTextNode(this._title));
    }

    this._onChange('title');

    this._updateMarkup();
  };

  /**
   * Set Windoc icon
   *
   * @function _setIcon
   * @memberof OSjs.Core.Window#
   *
   * @param   {String}      i     Icon path
   */
  Window.prototype._setIcon = function(i) {
    if ( this._$winicon ) {
      this._$winicon.title = this._title;
      this._$winicon.style.backgroundImage = 'url(' + i + ')';
    }

    this._icon = i;
    this._onChange('icon');
  };

  /**
   * Set Window warning message (Displays as a popup inside window)
   *
   * @function _setWarning
   * @memberof OSjs.Core.Window#
   *
   * @param   {String}      message       Warning message
   */
  Window.prototype._setWarning = function(message) {
    var self = this;

    this._$warning = Utils.$remove(this._$warning);

    if ( this._destroyed || message === null ) {
      return;
    }

    message = message || '';

    var container = document.createElement('application-window-warning');

    var close = document.createElement('div');
    close.innerHTML = 'X';
    Utils.$bind(close, 'click', function() {
      self._setWarning(null);
    });

    var msg = document.createElement('div');
    msg.appendChild(document.createTextNode(message));

    container.appendChild(close);
    container.appendChild(msg);
    this._$warning = container;
    this._$root.appendChild(this._$warning);
  };

  /**
   * Set a window property
   *
   * @function _setProperty
   * @memberof OSjs.Core.Window#
   *
   * @param   {String}    p     Key
   * @param   {String}    v     Value
   */
  Window.prototype._setProperty = function(p, v) {
    if ( (v === '' || v === null) || !this._$element || (typeof this._properties[p] === 'undefined') ) {
      return;
    }

    this._properties[p] = String(v) === 'true';

    this._updateMarkup(true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Window = Object.seal(Window);

})(OSjs.Utils, OSjs.API, OSjs.GUI, OSjs.Core.Process);
