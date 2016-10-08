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
(function(Utils, API, Process, Window) {
  'use strict';

  var _WM;             // Running Window Manager process

  /////////////////////////////////////////////////////////////////////////////
  // WINDOW MOVEMENT BEHAVIOUR
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Holds information about current behaviour
   */
  function BehaviourState(win, action, mousePosition) {
    var self = this;

    this.win      = win;
    this.$element = win._$element;
    this.$top     = win._$top;
    this.$handle  = win._$resize;

    this.rectWorkspace  = _WM.getWindowSpace(true);
    this.rectWindow     = {
      x: win._position.x,
      y: win._position.y,
      w: win._dimension.w,
      h: win._dimension.h,
      r: win._dimension.w + win._position.x,
      b: win._dimension.h + win._position.y
    };

    var theme = _WM.getStyleTheme(true);
    if ( !theme.style ) {
      theme.style = {'window': {margin: 0, border: 0}};
    }

    this.theme = {
      topMargin : theme.style.window.margin || 0,
      borderSize: theme.style.window.border || 0
    };

    this.snapping   = {
      cornerSize : _WM.getSetting('windowCornerSnap') || 0,
      windowSize : _WM.getSetting('windowSnap') || 0
    };

    this.action     = action;
    this.moved      = false;
    this.direction  = null;
    this.startX     = mousePosition.x;
    this.startY     = mousePosition.y;
    this.minWidth   = win._properties.min_width;
    this.minHeight  = win._properties.min_height;

    var windowRects = [];
    _WM.getWindows().forEach(function(w) {
      if ( w && w._wid !== win._wid ) {
        var pos = w._position;
        var dim = w._dimension;
        var rect = {
          left : pos.x - self.theme.borderSize,
          top : pos.y - self.theme.borderSize,
          width: dim.w + (self.theme.borderSize * 2),
          height: dim.h + (self.theme.borderSize * 2) + self.theme.topMargin
        };

        rect.right = rect.left + rect.width;
        rect.bottom = (pos.y + dim.h) + self.theme.topMargin + self.theme.borderSize;//rect.top + rect.height;

        windowRects.push(rect);
      }
    });

    this.snapRects = windowRects;
  }

  BehaviourState.prototype.getRect = function() {
    var win = this.win;

    return {
      left: win._position.x,
      top: win._position.y,
      width: win._dimension.w,
      height: win._dimension.h
    };
  };

  BehaviourState.prototype.calculateDirection = function() {
    var dir = Utils.$position(this.$handle);
    var dirX = this.startX - dir.left;
    var dirY = this.startY - dir.top;
    var dirD = 20;

    var direction = 's';
    var checks = {
      nw: (dirX <= dirD) && (dirY <= dirD),
      n:  (dirX > dirD) && (dirY <= dirD),
      w:  (dirX <= dirD) && (dirY >= dirD),
      ne: (dirX >= (dir.width - dirD)) && (dirY <= dirD),
      e:  (dirX >= (dir.width - dirD)) && (dirY > dirD),
      se: (dirX >= (dir.width - dirD)) && (dirY >= (dir.height - dirD)),
      sw: (dirX <= dirD) && (dirY >= (dir.height - dirD))
    };

    Object.keys(checks).forEach(function(k) {
      if ( checks[k] ) {
        direction = k;
      }
    });

    this.direction = direction;
  };

  /**
   * Window Behavour Abstraction
   */
  function createWindowBehaviour(win, wm) {
    var current = null;
    var newRect = {};

    /**
     * When mouse button is pressed
     */
    function onMouseDown(ev, action, win, mousePosition) {
      OSjs.API.blurMenu();
      ev.preventDefault();

      if ( win._state.maximized ) {
        return;
      }

      current = new BehaviourState(win, action, mousePosition);
      newRect = {};

      win._focus();

      if ( action === 'move' ) {
        current.$element.setAttribute('data-hint', 'moving');
      } else {
        current.calculateDirection();
        current.$element.setAttribute('data-hint', 'resizing');

        newRect = current.getRect();
      }

      win._emit('preop');

      Utils.$bind(document, 'mousemove:movewindow', _onMouseMove, false);
      Utils.$bind(document, 'mouseup:movewindowstop', _onMouseUp, false);

      function _onMouseMove(ev, pos) {
        if ( wm._mouselock ) {
          onMouseMove(ev, action, win, pos);
        }
      }
      function _onMouseUp(ev, pos) {
        onMouseUp(ev, action, win, pos);
        Utils.$unbind(document, 'mousemove:movewindow');
        Utils.$unbind(document, 'mouseup:movewindowstop');
      }
    }

    /**
     * When mouse button is released
     */
    function onMouseUp(ev, action, win, mousePosition) {
      if ( !current ) {
        return;
      }

      if ( current.moved ) {
        if ( action === 'move' ) {
          win._onChange('move', true);
          win._emit('moved', [win._position.x, win._position.y]);
        } else if ( action === 'resize' ) {
          win._onChange('resize', true);
          win._emit('resized', [win._dimension.w, win._dimension.h]);
        }
      }

      current.$element.setAttribute('data-hint', '');

      win._emit('postop');

      current = null;
    }

    /**
     * When mouse is moved
     */
    function onMouseMove(ev, action, win, mousePosition) {
      if ( !_WM.getMouseLocked() || !action || !current ) {
        return;
      }

      var result;
      var dx = mousePosition.x - current.startX;
      var dy = mousePosition.y - current.startY;

      if ( action === 'move' ) {
        result = onWindowMove(ev, mousePosition, dx, dy);
      } else {
        result = onWindowResize(ev, mousePosition, dx, dy);
      }

      if ( result ) {
        if ( result.left !== null && result.top !== null ) {
          win._move(result.left, result.top);
          win._emit('move', [result.left, result.top]);
        }
        if ( result.width !== null && result.height !== null ) {
          win._resize(result.width, result.height, true);
          win._emit('resize', [result.width, result.height]);
        }
      }

      current.moved = true;
    }

    /**
     * Resizing action
     */
    function onWindowResize(ev, mousePosition, dx, dy) {
      if ( !current || !current.direction ) {
        return false;
      }

      var nw, nh, nl, nt;

      (function() { // North/South
        if ( current.direction.indexOf('s') !== -1 ) {
          nh = current.rectWindow.h + dy;

          newRect.height = Math.max(current.minHeight, nh);
        } else if ( current.direction.indexOf('n') !== -1 ) {
          nh = current.rectWindow.h - dy;
          nt = current.rectWindow.y + dy;

          if ( nt < current.rectWorkspace.top ) {
            nt = current.rectWorkspace.top;
            nh = newRect.height;
          } else {
            if ( nh < current.minHeight ) {
              nt = current.rectWindow.b - current.minHeight;
            }
          }

          newRect.height = Math.max(current.minHeight, nh);
          newRect.top = nt;
        }
      })();

      (function() { // East/West
        if ( current.direction.indexOf('e') !== -1 ) {
          nw = current.rectWindow.w + dx;

          newRect.width = Math.max(current.minWidth, nw);
        } else if ( current.direction.indexOf('w') !== -1 ) {
          nw = current.rectWindow.w - dx;
          nl = current.rectWindow.x + dx;

          if ( nw < current.minWidth ) {
            nl = current.rectWindow.r - current.minWidth;
          }

          newRect.width = Math.max(current.minWidth, nw);
          newRect.left = nl;
        }
      })();

      return newRect;
    }

    /**
     * Movement action
     */
    function onWindowMove(ev, mousePosition, dx, dy) {
      var newWidth = null;
      var newHeight = null;
      var newLeft = current.rectWindow.x + dx;
      var newTop = current.rectWindow.y + dy;
      var borderSize = current.theme.borderSize;
      var topMargin = current.theme.topMargin;
      var cornerSnapSize = current.snapping.cornerSize;
      var windowSnapSize = current.snapping.windowSize;

      if ( newTop < current.rectWorkspace.top ) {
        newTop = current.rectWorkspace.top;
      }

      var newRight = newLeft + current.rectWindow.w + (borderSize * 2);
      var newBottom = newTop + current.rectWindow.h + topMargin + (borderSize);

      // 8-directional corner window snapping
      if ( cornerSnapSize > 0 ) {
        if ( ((newLeft - borderSize) <= cornerSnapSize) && ((newLeft - borderSize) >= -cornerSnapSize) ) { // Left
          newLeft = borderSize;
        } else if ( (newRight >= (current.rectWorkspace.width - cornerSnapSize)) && (newRight <= (current.rectWorkspace.width + cornerSnapSize)) ) { // Right
          newLeft = current.rectWorkspace.width - current.rectWindow.w - borderSize;
        }
        if ( (newTop <= (current.rectWorkspace.top + cornerSnapSize)) && (newTop >= (current.rectWorkspace.top - cornerSnapSize)) ) { // Top
          newTop = current.rectWorkspace.top + (borderSize);
        } else if (
                    (newBottom >= ((current.rectWorkspace.height + current.rectWorkspace.top) - cornerSnapSize)) &&
                    (newBottom <= ((current.rectWorkspace.height + current.rectWorkspace.top) + cornerSnapSize))
                  ) { // Bottom
          newTop = (current.rectWorkspace.height + current.rectWorkspace.top) - current.rectWindow.h - topMargin - borderSize;
        }
      }

      // Snapping to other windows
      if ( windowSnapSize > 0 ) {
        current.snapRects.every(function(rect) {
          // >
          if ( newRight >= (rect.left - windowSnapSize) && newRight <= (rect.left + windowSnapSize) ) { // Left
            newLeft = rect.left - (current.rectWindow.w + (borderSize * 2));
            return false;
          }

          // <
          if ( (newLeft - borderSize) <= (rect.right + windowSnapSize) && (newLeft - borderSize) >= (rect.right - windowSnapSize) ) { // Right
            newLeft = rect.right + (borderSize * 2);
            return false;
          }

          // \/
          if ( newBottom >= (rect.top - windowSnapSize) && newBottom <= (rect.top + windowSnapSize) ) { // Top
            newTop = rect.top - (current.rectWindow.h + (borderSize * 2) + topMargin);
            return false;
          }

          // /\
          if ( newTop <= (rect.bottom + windowSnapSize) && newTop >= (rect.bottom - windowSnapSize) ) { // Bottom
            newTop = rect.bottom + borderSize * 2;
            return false;
          }

          return true;
        });

      }

      return {left: newLeft, top: newTop, width: newWidth, height: newHeight};
    }

    /**
     * Register a window
     */
    if ( win._properties.allow_move ) {
      Utils.$bind(win._$top, 'mousedown', function(ev, pos) {
        onMouseDown(ev, 'move', win, pos);
      }, true);
    }
    if ( win._properties.allow_resize ) {
      Utils.$bind(win._$resize, 'mousedown', function(ev, pos) {
        onMouseDown(ev, 'resize', win, pos);
      });
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOW MANAGER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * WindowManager Process Class
   * The default implementation of this is in apps/CoreWM/main.js
   *
   * <pre><code>
   * NEVER CONSTRUCT YOUR OWN INTANCE! To get one use:
   * OSjs.Core.getWindowManager();
   * </code></pre>
   *
   * @example
   * OSjs.Core.getWindowManager()
   *
   * @summary Class used for basis as a Window Manager.
   *
   * @param   {String}                      name      Window Manager name
   * @param   {OSjs.Core.WindowManager}     ref       Constructed instance ref
   * @param   {Object}                      args      Constructed arguments
   * @param   {Object}                      metadata  Package Metadata
   * @param   {Object}                      settings  Restored settings
   *
   * @abstract
   * @constructor
   * @memberof OSjs.Core
   * @extends OSjs.Core.Process
   */
  function WindowManager(name, ref, args, metadata, settings) {
    console.group('WindowManager::constructor()');
    console.debug('Name', name);
    console.debug('Arguments', args);

    this._$notifications = null;
    this._windows        = [];
    this._settings       = OSjs.Core.getSettingsManager().instance(name, settings);
    this._currentWin     = null;
    this._lastWin        = null;
    this._mouselock      = true;
    this._stylesheet     = null;
    this._sessionLoaded  = false;
    this._fullyLoaded    = false;
    this._scheme         = null;

    // Important for usage as "Application"
    this.__name    = (name || 'WindowManager');
    this.__path    = metadata.path;
    this.__iter    = metadata.iter;

    Process.apply(this, [this.__name, args, metadata]);

    _WM = (ref || this);

    console.groupEnd();
  }

  WindowManager.prototype = Object.create(Process.prototype);

  /**
   * Destroy the WindowManager
   *
   * @function destroy
   * @memberof OSjs.Core.WindowManager#
   */
  WindowManager.prototype.destroy = function() {
    var self = this;
    console.debug('WindowManager::destroy()');

    this.destroyStylesheet();

    Utils.$unbind(document, 'mouseout:windowmanager');
    Utils.$unbind(document, 'mouseenter:windowmanager');

    // Destroy all windows
    this._windows.forEach(function(win, i) {
      if ( win ) {
        win.destroy(true);
        self._windows[i] = null;
      }
    });

    if ( this._scheme ) {
      this._scheme.destroy();
    }

    this._windows = [];
    this._currentWin = null;
    this._lastWin = null;
    this._scheme = null;

    _WM = null;

    return Process.prototype.destroy.apply(this, []);
  };

  /**
   * Initialize the WindowManager
   *
   * @function init
   * @memberof OSjs.Core.WindowManager#
   */
  WindowManager.prototype.init = function(metadata, settings, scheme) {
    console.debug('WindowManager::init()');

    this._scheme = scheme;

    var self = this;

    Utils.$bind(document, 'mouseout:windowmanager', function(ev) {
      self._onMouseLeave(ev);
    });
    Utils.$bind(document, 'mouseenter:windowmanager', function(ev) {
      self._onMouseLeave(ev);
    });
  };

  /**
   * Setup features
   *
   * THIS IS IMPLEMENTED IN COREWM
   *
   * @function setup
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {Function}  cb        Callback
   */
  WindowManager.prototype.setup = function(cb) {
    // Implement in your WM
  };

  /**
   * Get a Window by name
   *
   * @function getWindow
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {String}      name        Window name
   *
   * @return  {OSjs.Core.Window}
   */
  WindowManager.prototype.getWindow = function(name) {
    var result = null;
    this._windows.every(function(w) {
      if ( w && w._name === name ) {
        result = w;
      }
      return w ? false : true;
    });
    return result;
  };

  /**
   * Add a Window
   *
   * @function addWindow
   * @memberof OSjs.Core.WindowManager#
   * @throws {Error} If invalid window is given
   *
   * @param   {OSjs.Core.Window}      w         Window reference
   * @param   {Boolean}               focus     Focus the window
   *
   * @return  {OSjs.Core.Window}                The added window
   */
  WindowManager.prototype.addWindow = function(w, focus) {
    if ( !(w instanceof Window) ) {
      console.warn('WindowManager::addWindow()', 'Got', w);
      throw new TypeError('given argument was not instance of Core.Window');
    }
    console.debug('WindowManager::addWindow()');

    try {
      w.init(this, w._app, w._scheme);
    } catch ( e ) {
      console.error('WindowManager::addWindow()', '=>', 'Window::init()', e, e.stack);
    }

    //attachWindowEvents(w, this);
    createWindowBehaviour(w, this);

    this._windows.push(w);
    w._inited();

    if ( focus === true || (w instanceof OSjs.Core.DialogWindow) ) {
      setTimeout(function() {
        w._focus();
      }, 10);
    }

    return w;
  };

  /**
   * Remove a Window
   *
   * @function removeWindow
   * @memberof OSjs.Core.WindowManager#
   * @throws {Error} If invalid window is given
   *
   * @param   {OSjs.Core.Window}      w         Window reference
   *
   * @return  {Boolean}               On success
   */
  WindowManager.prototype.removeWindow = function(w) {
    var self = this;
    if ( !(w instanceof Window) ) {
      console.warn('WindowManager::removeWindow()', 'Got', w);
      throw new TypeError('given argument was not instance of Core.Window');
    }
    console.debug('WindowManager::removeWindow()', w._wid);

    var result = false;
    this._windows.every(function(win, i) {
      if ( win && win._wid === w._wid ) {
        self._windows[i] = null;
        result = true;
      }
      return result ? false : true;
    });

    return result;
  };

  /**
   * Set WindowManager settings
   *
   * OVERRIDE THIS IN YOUR WM IMPLEMENTATION
   *
   * @function applySettings
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {Object}      settings              JSON Settings
   * @param   {Boolean}     force                 If forced, no merging will take place
   * @param   {Boolean}     save                  Saves settings
   * @param   {Boolean}     [triggerWatch=true]   Trigger change event for watchers
   *
   * @return  {Boolean}                     On success
   */
  WindowManager.prototype.applySettings = function(settings, force, save, triggerWatch) {
    settings = settings || {};
    console.debug('WindowManager::applySettings()', 'forced?', force);

    var result = force ? settings : Utils.mergeObject(this._settings.get(), settings);
    this._settings.set(null, result, save, triggerWatch);

    return true;
  };

  /**
   * Create Window Manager self-contained CSS from this object
   *
   * {
   *    '.classname': {
   *      'background-image': 'url()'
   *    }
   * }
   *
   * @function createStylesheet
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {Object}    styles      Style object
   * @param   {String}    [rawStyles] Raw CSS data
   */
  WindowManager.prototype.createStylesheet = function(styles, rawStyles) {
    this.destroyStylesheet();

    var innerHTML = [];
    Object.keys(styles).forEach(function(key) {
      var rules = [];
      Object.keys(styles[key]).forEach(function(r) {
        rules.push(Utils.format('    {0}: {1};', r, styles[key][r]));
      });

      rules = rules.join('\n');
      innerHTML.push(Utils.format('{0} {\n{1}\n}', key, rules));
    });

    innerHTML = innerHTML.join('\n');
    if ( rawStyles ) {
      innerHTML += '\n' + rawStyles;
    }

    var style       = document.createElement('style');
    style.type      = 'text/css';
    style.id        = 'WMGeneratedStyles';
    style.innerHTML = innerHTML;
    document.getElementsByTagName('head')[0].appendChild(style);

    this._stylesheet = style;
  };

  /**
   * Destroy Window Manager self-contained CSS
   *
   * @function destroyStylesheet
   * @memberof OSjs.Core.WindowManager#
   */
  WindowManager.prototype.destroyStylesheet = function() {
    if ( this._stylesheet ) {
      if ( this._stylesheet.parentNode ) {
        this._stylesheet.parentNode.removeChild(this._stylesheet);
      }
    }
    this._stylesheet = null;
  };

  /**
   * When Key Down Event received
   *
   * @function onKeyDown
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {Event}                  ev      DOM Event
   * @param   {OSjs.CoreWindow}        win     Active window
   */
  WindowManager.prototype.onKeyDown = function(ev, win) {
    // Implement in your WM
  };

  /**
   * When orientation of device has changed
   *
   * @function onOrientationChange
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {Event}    ev             DOM Event
   * @param   {String}   orientation    Orientation string
   */
  WindowManager.prototype.onOrientationChange = function(ev, orientation) {
    console.info('ORIENTATION CHANGED', ev, orientation);
  };

  /**
   * When session has been loaded
   *
   * @function onSessionLoaded
   * @memberof OSjs.Core.WindowManager#
   */
  WindowManager.prototype.onSessionLoaded = function() {
    if ( this._sessionLoaded ) {
      return false;
    }

    this._sessionLoaded = true;
    return true;
  };

  WindowManager.prototype.resize = function(ev, rect) {
    // Implement in your WM
  };

  /**
   * Create a desktop notification.
   *
   * THIS IS IMPLEMENTED IN COREWM
   *
   * @function notification
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {Object}    opts                   Notification options
   * @param   {String}    opts.icon              What icon to display
   * @param   {String}    opts.title             What title to display
   * @param   {String}    opts.message           What message to display
   * @param   {Number}    [opts.timeout=5000]    Timeout
   * @param   {Function}  opts.onClick           Event callback on click => fn(ev)
   */
  WindowManager.prototype.notification = function() {
    // Implement in your WM
  };

  /**
   * Create a panel notification icon.
   *
   * THIS IS IMPLEMENTED IN COREWM
   *
   * FOR OPTIONS SEE NotificationAreaItem IN CoreWM !
   *
   * @function createNotificationIcon
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {String}    name      Internal name (unique)
   * @param   {Object}    opts      Notification options
   * @param   {Number}    [panelId] Panel ID
   *
   * @return  OSjs.Applications.CoreWM.NotificationAreaItem
   */
  WindowManager.prototype.createNotificationIcon = function() {
    // Implement in your WM
  };

  /**
   * Remove a panel notification icon.
   *
   * THIS IS IMPLEMENTED IN COREWM
   *
   * @function removeNotificationIcon
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {String}    name      Internal name (unique)
   * @param   {Number}    [panelId] Panel ID
   *
   * @return  {Boolean}
   */
  WindowManager.prototype.removeNotificationIcon = function() {
    // Implement in your WM
  };

  /**
   * Whenever a window event occurs
   *
   * THIS IS IMPLEMENTED IN COREWM
   *
   * @function eventWindow
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {String}            ev      Event name
   * @param   {OSjs.Core.Window}  win     Window ref
   *
   * @return  {Boolean}
   */
  WindowManager.prototype.eventWindow = function(ev, win) {
    // Implement in your WM
  };

  /**
   * Show Settings Window (Application)
   *
   * THIS IS IMPLEMENTED IN COREWM
   *
   * @function showSettings
   * @memberof OSjs.Core.WindowManager#
   */
  WindowManager.prototype.showSettings = function() {
    // Implement in your WM
  };

  WindowManager.prototype._onMouseEnter = function(ev) {
    this._mouselock = true;
  };

  WindowManager.prototype._onMouseLeave = function(ev) {
    var from = ev.relatedTarget || ev.toElement;
    if ( !from || from.nodeName === 'HTML' ) {
      this._mouselock = false;
    } else {
      this._mouselock = true;
    }
  };

  /**
   * Get default Settings
   *
   * @function getDefaultSettings
   * @memberof OSjs.Core.WindowManager#
   *
   * @return  {Object}      JSON Data
   */
  WindowManager.prototype.getDefaultSetting = function() {
    // Implement in your WM
    return null;
  };

  /**
   * Get panel
   *
   * @function getPanel
   * @memberof OSjs.Core.WindowManager#
   *
   * @return {OSjs.Applications.CoreWM.Panel}
   */
  WindowManager.prototype.getPanel = function() {
    // Implement in your WM
    return null;
  };

  /**
   * Gets all panels
   *
   * @function getPanels
   * @memberof OSjs.Core.WindowManager#
   *
   * @return  {OSjs.Packages.CoreWM.Panel[]}       Panel List
   */
  WindowManager.prototype.getPanels = function() {
    // Implement in your WM
    return [];
  };

  /**
   * Gets current Style theme
   *
   * @function getStyleTheme
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {Boolean}    returnMetadata      Return theme metadata instead of name
   *
   * @return  {String}                      Or JSON
   */
  WindowManager.prototype.getStyleTheme = function(returnMetadata) {
    return returnMetadata ? {} : 'default';
  };

  /**
   * Gets current Sound theme
   *
   * @function getSoundTheme
   * @memberof OSjs.Core.WindowManager#
   *
   * @return  {String}
   */
  WindowManager.prototype.getSoundTheme = function() {
    return 'default';
  };

  /**
   * Gets sound filename from key
   *
   * @param  {String}     k       Sound name key
   * @function getSoundName
   * @memberof OSjs.Core.WindowManager#
   *
   * @return  {String}
   */
  WindowManager.prototype.getSoundFilename = function(k) {
    return null;
  };

  /**
   * Gets current Icon theme
   *
   * @function getIconTheme
   * @memberof OSjs.Core.WindowManager#
   *
   * @return  {String}
   */
  WindowManager.prototype.getIconTheme = function() {
    return 'default';
  };

  /**
   * Gets a list of Style themes
   *
   * @function getStyleThemes
   * @memberof OSjs.Core.WindowManager#
   *
   * @return  {String[]}   The list of themes
   */
  WindowManager.prototype.getStyleThemes = function() {
    return API.getConfig('Styles', []);
  };

  /**
   * Gets a list of Sound themes
   *
   * @function getSoundThemes
   * @memberof OSjs.Core.WindowManager#
   *
   * @return  {String[]}   The list of themes
   */
  WindowManager.prototype.getSoundThemes = function() {
    return API.getConfig('Sounds', []);
  };

  /**
   * Gets a list of Icon themes
   *
   * @function getIconThemes
   * @memberof OSjs.Core.WindowManager#
   *
   * @return  {String[]}   The list of themes
   */
  WindowManager.prototype.getIconThemes = function() {
    return API.getConfig('Icons', []);
  };

  /**
   * Sets a setting
   *
   * @function setSetting
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {String}      k       Key
   * @param   {Mixed}       v       Value
   *
   * @return  {Boolean}             On success
   */
  WindowManager.prototype.setSetting = function(k, v) {
    return this._settings.set(k, v);
  };

  /**
   * Gets the rectangle for window space
   *
   * @function getWindowSpace
   * @memberof OSjs.Core.WindowManager#
   *
   * @return    {Object} rectangle
   */
  WindowManager.prototype.getWindowSpace = function() {
    return Utils.getRect();
  };

  /**
   * Get next window position
   *
   * @function getWindowPosition
   * @memberof OSjs.Core.WindowManager#
   *
   * @return    {Object} rectangle
   */
  WindowManager.prototype.getWindowPosition = (function() {
    var _LNEWX = 0;
    var _LNEWY = 0;

    return function() {
      if ( _LNEWY >= (window.innerHeight - 100) ) {
        _LNEWY = 0;
      }
      if ( _LNEWX >= (window.innerWidth - 100) )  {
        _LNEWX = 0;
      }
      return {x: _LNEWX += 10, y: _LNEWY += 10};
    };
  })();

  /**
   * Gets a setting
   *
   * @function getSetting
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {String}    k     Key
   *
   * @return  {Mixed}           Setting value or 'null'
   */
  WindowManager.prototype.getSetting = function(k) {
    return this._settings.get(k);
  };

  /**
   * Gets all settings
   *
   * @function getSettings
   * @memberof OSjs.Core.WindowManager#
   *
   * @return    {Object}        JSON With all settings
   */
  WindowManager.prototype.getSettings = function() {
    return this._settings.get();
  };

  /**
   * Gets all Windows
   *
   * @function getWindows
   * @memberof OSjs.Core.WindowManager#
   *
   * @return    {OSjs.Core.Window[]}           List of all Windows
   */
  WindowManager.prototype.getWindows = function() {
    return this._windows;
  };

  /**
   * Gets current Window
   *
   * @function getCurrentWindow
   * @memberof OSjs.Core.WindowManager#
   *
   * @return {OSjs.Core.Window}        Current Window or 'null'
   */
  WindowManager.prototype.getCurrentWindow = function() {
    return this._currentWin;
  };

  /**
   * Sets the current Window
   *
   * @function setCurrentWindow
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {OSjs.Core.Window}    w       Window
   */
  WindowManager.prototype.setCurrentWindow = function(w) {
    this._currentWin = w || null;
  };

  /**
   * Gets previous Window
   *
   * @function getLastWindow
   * @memberof OSjs.Core.WindowManager#
   *
   * @return {OSjs.Core.Window}        Current Window or 'null'
   */
  WindowManager.prototype.getLastWindow = function() {
    return this._lastWin;
  };

  /**
   * Sets the last Window
   *
   * @function setLastWindow
   * @memberof OSjs.Core.WindowManager#
   *
   * @param   {OSjs.Core.Window}    w       Window
   */
  WindowManager.prototype.setLastWindow = function(w) {
    this._lastWin = w || null;
  };

  /**
   * If the pointer is inside the browser window
   *
   * @function getMouseLocked
   * @memberof OSjs.Core.WindowManager#
   *
   * @return  {Boolean}
   */
  WindowManager.prototype.getMouseLocked = function() {
    return this._mouselock;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.WindowManager     = Object.seal(WindowManager);

  /**
   * Get the current WindowManager instance
   *
   * @function getWindowManager
   * @memberof OSjs.Core
   *
   * @return {OSjs.Core.WindowManager}
   */
  OSjs.Core.getWindowManager  = function() {
    return _WM;
  };

})(OSjs.Utils, OSjs.API, OSjs.Core.Process, OSjs.Core.Window);
