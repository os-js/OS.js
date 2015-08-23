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
(function(Utils, API, Process, Window) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};

  var _WM;             // Running Window Manager process

  /**
   * Create Window move/resize events
   *
   * FIXME: Optimize
   */
  function attachWindowEvents(win, wm) {
    var main = win._$element;
    var windowTop = win._$top;
    var windowResize = win._$resize;
    var sx = 0;
    var sy = 0;
    var action = null;
    var moved = false;
    var startRect = null;
    var direction = null;
    var startDimension = {x: 0, y: 0, w: 0, h: 0};
    var cornerSnapSize = 0;
    var windowSnapSize = 0;
    var topMargin = 23;
    var borderSize = 0;
    var windowRects = [];

    function onMouseDown(ev, a, pos) {
      cornerSnapSize = wm ? (wm.getSetting('windowCornerSnap') || 0) : 0;
      windowSnapSize = wm ? (wm.getSetting('windowSnap') || 0) : 0;
      windowRects = [];
      ev.preventDefault();

      if ( win._state.maximized ) { return false; }

      var theme = wm.getStyleTheme(true);
      if ( theme && theme.style && theme.style.window ) {
        topMargin = theme.style.window.margin;
        borderSize = theme.style.window.border;
      }

      startRect = wm.getWindowSpace(true);
      wm.getWindows().forEach(function(win) {
        if ( win && win._wid !== win._wid ) {
          windowRects.push({
            left: win._position.x,
            top: win._position.y,
            right: win._position.x + win._dimension.w,
            bottom: win._position.y + win._dimension.h + topMargin,
            width: win._dimension.w,
            height: win._dimension.h
          });
        }
      });

      startDimension.x = win._position.x;
      startDimension.y = win._position.y;
      startDimension.w = win._dimension.w;
      startDimension.h = win._dimension.h;

      win._focus();

      if ( a === 'move' ) {
        main.setAttribute('data-hint', 'moving');
      } else {
        if ( windowResize ) {
          var cx = pos.x;
          var cy = pos.y;
          var dir = Utils.$position(windowResize);
          var dirX = cx - dir.left;
          var dirY = cy - dir.top;
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

          main.setAttribute('data-hint', 'resizing');
        }
      }

      win._fireHook('preop');

      sx = pos.x;
      sy = pos.y;
      action = a;

      Utils.$bind(document, 'mousemove', onMouseMove);
      Utils.$bind(document, 'mouseup', onMouseUp);

      return false;
    }

    function onMouseUp(ev, pos) {
      if ( moved ) {
        if ( wm ) {
          if ( action === 'move' ) {
            win._onChange('move', true);
            win._fireHook('moved');
          } else if ( action === 'resize' ) {
            win._onChange('resize', true);
            win._fireHook('resized');
          }
        }
      }

      main.setAttribute('data-hint', '');

      Utils.$unbind(document, 'mousemove', onMouseMove, false);
      Utils.$unbind(document, 'mouseup', onMouseUp, false);

      action = null;
      sx = 0;
      sy = 0;
      moved = false;
      startRect = null;

      win._fireHook('postop');
    }

    function onMouseMove(ev, pos) {
      if ( !wm || !wm.getMouseLocked() ) { return; }
      if ( action === null ) { return; }
      var cx = pos.x;
      var cy = pos.y;
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
        var newRight = newLeft + startDimension.w + (borderSize*2);
        var newBottom = newTop + startDimension.h + topMargin + (borderSize);

        // 8-directional corner window snapping
        if ( cornerSnapSize > 0 ) {
          if ( ((newLeft-borderSize) <= cornerSnapSize) && ((newLeft-borderSize) >= -cornerSnapSize) ) { // Left
            newLeft = borderSize;
          } else if ( (newRight >= (startRect.width - cornerSnapSize)) && (newRight <= (startRect.width + cornerSnapSize)) ) { // Right
            newLeft = startRect.width - startDimension.w - borderSize;
          }
          if ( (newTop <= (startRect.top + cornerSnapSize)) && (newTop >= (startRect.top - cornerSnapSize)) ) { // Top
            newTop = startRect.top + (borderSize);
          } else if ( 
                      (newBottom >= ((startRect.height + startRect.top) - cornerSnapSize)) &&
                      (newBottom <= ((startRect.height + startRect.top) + cornerSnapSize))
                    ) { // Bottom
            newTop = (startRect.height + startRect.top) - startDimension.h - topMargin + borderSize;
          }
        }

        // Snapping to other windows
        if ( windowSnapSize > 0 ) {
          windowRects.forEach(function(rect) {
            if ( newRight >= (rect.left - windowSnapSize) && newRight <= (rect.left + windowSnapSize) ) { // Left
              newLeft = rect.left - (startDimension.w + (borderSize*2));
              return false;
            }

            if ( (newLeft-borderSize) <= (rect.right + windowSnapSize) && (newLeft-borderSize) >= (rect.right - windowSnapSize) ) { // Right
              newLeft = rect.right + (borderSize*2);
              return false;
            }

            if ( newBottom >= (rect.top - windowSnapSize) && newBottom <= (rect.top + windowSnapSize) ) { // Top
              newTop = rect.top - (startDimension.h + borderSize + topMargin);
              return false;
            }

            if ( newTop <= (rect.bottom + windowSnapSize) && newTop >= (rect.bottom - windowSnapSize) ) { // Bottom
              newTop = rect.bottom + borderSize;
              return false;
            }

            return true;
          });

        }
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
        win._move(newLeft, newTop);
        win._fireHook('move');
      }
      if ( newWidth !== null && newHeight !== null ) {
        win._resize(newWidth, newHeight);
        win._fireHook('resize');
      }

      moved = true;
    }

    if ( win._properties.allow_move ) {
      Utils.$bind(windowTop, 'mousedown', function(ev, pos) {
        onMouseDown(ev, 'move', pos);
      });
    }
    if ( win._properties.allow_resize ) {
      Utils.$bind(windowResize, 'mousedown', function(ev, pos) {
        onMouseDown(ev, 'resize', pos);
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
   * NEVER CONSTRUCT YOUR OWN INTANCE! To get one use:
   * OSjs.Core.getWindowManager();
   *
   * @see     OSjs.Core.Process
   * @api     OSjs.Core.WindowManager
   * @extends Process
   * @class
   */
  var WindowManager = function(name, ref, args, metadata, settings) {
    console.group('WindowManager::constructor()');
    console.log('Name', name);
    console.log('Arguments', args);

    this._$notifications = null;
    this._windows        = [];
    this._settings       = OSjs.Helpers.SettingsManager.instance(name, settings);
    this._currentWin     = null;
    this._lastWin        = null;
    this._mouselock      = true;
    this._stylesheet     = null;
    this._sessionLoaded  = false;

    // Important for usage as "Application"
    this.__name    = (name || 'WindowManager');
    this.__path    = metadata.path;
    this.__iter    = metadata.iter;

    Process.apply(this, [this.__name]);

    _WM = (ref || this);

    console.groupEnd();
  };

  WindowManager.prototype = Object.create(Process.prototype);

  /**
   * Destroy the WindowManager
   *
   * @see Process::destroy()
   *
   * @method    WindowManager::destroy()
   */
  WindowManager.prototype.destroy = function() {
    var self = this;
    console.debug('WindowManager::destroy()');

    this.destroyStylesheet();

    document.removeEventListener('mouseout', function(ev) {
      self._onMouseLeave(ev);
    }, false);
    document.removeEventListener('mouseenter', function(ev) {
      self._onMouseEnter(ev);
    }, false);

    // Destroy all windows
    this._windows.forEach(function(win, i) {
      if ( win ) {
        win.destroy();
        self._windows[i] = null;
      }
    });
    this._windows = [];
    this._currentWin = null;
    this._lastWin = null;

    _WM = null;

    return Process.prototype.destroy.apply(this, []);
  };


  /**
   * Initialize the WindowManager
   *
   * @return  void
   *
   * @method  WindowManager::init()
   */
  WindowManager.prototype.init = function() {
    console.debug('WindowManager::init()');

    var self = this;
    document.addEventListener('mouseout', function(ev) {
      self._onMouseLeave(ev);
    }, false);
    document.addEventListener('mouseenter', function(ev) {
      self._onMouseEnter(ev);
    }, false);
  };

  /**
   * Get a Window by name
   *
   * @param   String      name        Window name
   *
   * @return  Window
   *
   * @method  WindowManager::getWindow()
   */
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

  /**
   * Add a Window
   *
   * @param   Window      w         Window reference
   * @param   boolean     focus     Focus the window
   *
   * @return  Window                The added window
   *
   * @method  WindowManager::addWindow()
   */
  WindowManager.prototype.addWindow = function(w, focus) {
    if ( !(w instanceof Window) ) {
      console.warn('WindowManager::addWindow()', 'Got', w);
      throw new Error('addWindow() expects a "Window" class');
    }
    console.debug('WindowManager::addWindow()');

    w.init(this, w._app, w._scheme);
    attachWindowEvents(w, this);
    if ( focus === true || (w instanceof OSjs.Core.DialogWindow) ) {
      w._focus();
    }
    w._inited();

    this._windows.push(w);

    return w;
  };

  /**
   * Remove a Window
   *
   * @param   Window      w         Window reference
   *
   * @return  boolean               On success
   *
   * @method  WindowManager::removeWindow()
   */
  WindowManager.prototype.removeWindow = function(w) {
    var self = this;
    if ( !(w instanceof Window) ) {
      console.warn('WindowManager::removeWindow()', 'Got', w);
      throw new Error('removeWindow() expects a "Window" class');
    }
    console.debug('WindowManager::removeWindow()', w._wid);

    var result = false;
    this._windows.forEach(function(win, i) {
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
   * @param   Object      settings        JSON Settings
   * @param   boolean     force           If forced, no merging will take place
   * @param   boolean     save            Saves settings
   *
   * @return  boolean                     On success
   *
   * @method  WindowManager::applySettings()
   */
  WindowManager.prototype.applySettings = function(settings, force, save) {
    settings = settings || {};
    console.debug('WindowManager::applySettings()', 'forced?', force);

    var result = force ? settings : Utils.mergeObject(this._settings.get(), settings);
    this._settings.set(null, result, save);

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
   * @param   Object    styles      Style object
   *
   * @return  void
   * @method  WindowManager::createStylesheet()
   */
  WindowManager.prototype.createStylesheet = function(styles) {
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
   * @return  void
   * @method  WindowManager::destroyStylesheet()
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
   * @param   DOMEvent      ev      DOM Event
   * @param   Window        win     Active window
   *
   * @return  void
   *
   * @method  WindowManager::onKeyDown()
   */
  WindowManager.prototype.onKeyDown = function(ev, win) {
    // Implement in your WM
  };

  WindowManager.prototype.onSessionLoaded = function() {
    if ( this._sessionLoaded ) { return false; }
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
   * @param   Object    opts      Notification options
   *
   * @option  opts      String    icon        What icon to display
   * @option  opts      String    title       What title to display
   * @option  opts      String    message     What message to display
   * @option  opts      int       timeout     Timeout (default = 5000)
   * @option  opts      Function  onClick     Event callback on click => fn(ev)
   *
   * @return  void
   *
   * @method  WindowManager::notification()
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
   * @param   String    name      Internal name (unique)
   * @param   Object    opts      Notification options
   * @param   int       panelId   (Optional) Panel ID
   *
   * @return  NotificationAreaItem
   *
   * @see NotificationAreaItem
   *
   * @method  WindowManager::createNotificationIcon()
   */
  WindowManager.prototype.createNotificationIcon = function() {
    // Implement in your WM
  };

  /**
   * Remove a panel notification icon.
   *
   * THIS IS IMPLEMENTED IN COREWM
   *
   * @param   String    name      Internal name (unique)
   * @param   int       panelId   (Optional) Panel ID
   *
   * @return  boolean
   *
   * @method  WindowManager::removeNotificationIcon()
   */
  WindowManager.prototype.removeNotificationIcon = function() {
    // Implement in your WM
  };

  WindowManager.prototype.eventWindow = function(ev, win) {
    // Implement in your WM
  };

  /**
   * Show Settings Window (Application)
   *
   * THIS IS IMPLEMENTED IN COREWM
   *
   * @return  void
   *
   * @method  WindowManager::showSettings()
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
   * @return  Object      JSON Data
   *
   * @method  WindowManager::getDefaultSettings()
   */
  WindowManager.prototype.getDefaultSetting = function() {
    // Implement in your WM
    return null;
  };

  /**
   * Get panel
   *
   * @method  WindowManager::getPanel()
   */
  WindowManager.prototype.getPanel = function() {
    // Implement in your WM
    return null;
  };

  /**
   * Gets all panels
   *
   * @return  Array       Panel List
   *
   * @method  WindowManager::getPanels()
   */
  WindowManager.prototype.getPanels = function() {
    // Implement in your WM
    return [];
  };

  /**
   * Gets current Style theme
   *
   * @param   bool    returnMetadata      Return theme metadata instead of name
   *
   * @return  String                      Or JSON
   *
   * @method  WindowManager::getStyleTheme()
   */
  WindowManager.prototype.getStyleTheme = function(returnMetadata) {
    return returnMetadata ? {} : 'default';
  };

  /**
   * Gets current Sound theme
   *
   * @return  String
   *
   * @method  WindowManager::getSoundTheme()
   */
  WindowManager.prototype.getSoundTheme = function() {
    return 'default';
  };

  /**
   * Gets current Icon theme
   *
   * @return  String
   *
   * @method  WindowManager::getIconTheme()
   */
  WindowManager.prototype.getIconTheme = function() {
    return 'default';
  };

  /**
   * Gets a list of Style themes
   *
   * @return  Array   The list of themes
   *
   * @method  WindowManager::getStyleThemes()
   */
  WindowManager.prototype.getStyleThemes = function() {
    var config = API.getDefaultSettings();
    return config.Styles || [];
  };

  /**
   * Gets a list of Sound themes
   *
   * @return  Array   The list of themes
   *
   * @method  WindowManager::getSoundThemes()
   */
  WindowManager.prototype.getSoundThemes = function() {
    var config = API.getDefaultSettings();
    return config.Sounds || [];
  };

  /**
   * Gets a list of Icon themes
   *
   * @return  Array   The list of themes
   *
   * @method  WindowManager::getIconThemes()
   */
  WindowManager.prototype.getIconThemes = function() {
    var config = API.getDefaultSettings();
    return config.Icons || [];
  };

  /**
   * Sets a setting
   *
   * @param   String      k       Key
   * @param   Mixed       v       Value
   *
   * @return  boolean             On success
   *
   * @method  WindowManager::setSetting()
   */
  WindowManager.prototype.setSetting = function(k, v) {
    return this._settings.set(k, v);
  };

  /**
   * Gets the rectangle for window space
   *
   * @return    Object {top:, left:, width:, height:}
   *
   * @method    WindowManager::getWindowSpace()
   */
  WindowManager.prototype.getWindowSpace = function() {
    return Utils.getRect();
  };

  /**
   * Get next window position
   *
   * @return    Object    {x:, y:}
   *
   * @method    WindowManager::getWindowPosition()
   */
  WindowManager.prototype.getWindowPosition = (function() {
    var _LNEWX = 0;
    var _LNEWY = 0;

    return function() {
      if ( _LNEWY >= (window.innerHeight - 100) ) { _LNEWY = 0; }
      if ( _LNEWX >= (window.innerWidth - 100) )  { _LNEWX = 0; }
      return {x: _LNEWX+=10, y: _LNEWY+=10};
    };
  })();

  /**
   * Gets a setting
   *
   * @param   String    k     Key
   *
   * @return  Mixed           Setting value or 'null'
   *
   * @method  WindowManager::getSetting()
   */
  WindowManager.prototype.getSetting = function(k) {
    return this._settings.get(k);
  };

  /**
   * Gets all settings
   *
   * @return    Object        JSON With all settings
   *
   * @method    WindowManager::getSettings()
   */
  WindowManager.prototype.getSettings = function() {
    return this._settings.get();
  };

  /**
   * Gets all Windows
   *
   * @return    Array           List of all Windows
   *
   * @method    WindowManager::getWindows()
   */
  WindowManager.prototype.getWindows = function() {
    return this._windows;
  };

  /**
   * Gets current Window
   *
   * @return      Window        Current Window or 'null'
   *
   * @method      WindowManager::getCurrentWindow()
   */
  WindowManager.prototype.getCurrentWindow = function() {
    return this._currentWin;
  };

  /**
   * Sets the current Window
   *
   * @param   Window    w       Window
   * @return  void
   * @method  WindowManager::setCurrentWindow()
   */
  WindowManager.prototype.setCurrentWindow = function(w) {
    this._currentWin = w || null;
  };

  /**
   * Gets previous Window
   *
   * @return      Window        Current Window or 'null'
   *
   * @method      WindowManager::getLastWindow()
   */
  WindowManager.prototype.getLastWindow = function() {
    return this._lastWin;
  };

  /**
   * Sets the last Window
   *
   * @param   Window    w       Window
   * @return  void
   * @method  WindowManager::setLastWindow()
   */
  WindowManager.prototype.setLastWindow = function(w) {
    this._lastWin = w || null;
  };

  /**
   * Get CSS animation duration
   * @return int Duration length in ms
   * @method WindowManager::getAnimDuration()
   */
  WindowManager.prototype.getAnimDuration = function() {
    var theme = this.getStyleTheme(true);
    if ( theme && theme.style && theme.style.animation ) {
      if ( typeof theme.style.animation.duration === 'number' ) {
        return theme.style.animation.dudation;
      }
    }
    return 301;
  };

  /**
   * If the pointer is inside the browser window
   *
   * @return  boolean
   * @method  WindowManager::getMouseLocked()
   */
  WindowManager.prototype.getMouseLocked = function() {
    return this._mouselock;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.WindowManager     = WindowManager;

  /**
   * Get the current WindowManager instance
   *
   * @return WindowManager
   * @api OSjs.Core.getWindowManager()
   */
  OSjs.Core.getWindowManager  = function() {
    return _WM;
  };


})(OSjs.Utils, OSjs.API, OSjs.Core.Process, OSjs.Core.Window);
