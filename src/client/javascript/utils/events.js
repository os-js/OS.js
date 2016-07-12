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
(function() {
  'use strict';

  /**
   * The callback for browser events bound by OS.js
   * @see OSjs.Utils.$bind
   * @see OSjs.Utils.$unbind
   * @callback CallbackEvent
   * @param {Event} ev Browser event
   * @param {Object} pos Event pointer position in form of x and y
   */

  /////////////////////////////////////////////////////////////////////////////
  // MISC
  /////////////////////////////////////////////////////////////////////////////

  /**
   * A collection of keycode mappings
   *
   * @memberof OSjs.Utils
   * @var
   */
  OSjs.Utils.Keys = {
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F6: 118,
    F7: 119,
    F8: 120,
    F9: 121,
    F10: 122,
    F11: 123,
    F12: 124,

    TILDE:      220,

    CMD:        17,
    LSUPER:     91,
    RSUPER:     92,

    DELETE:     46,
    INSERT:     45,
    HOME:       36,
    END:        35,
    PGDOWN:     34,
    PGUP:       33,
    PAUSE:      19,
    BREAK:      19,
    CAPS_LOCK:  20,
    SCROLL_LOCK:186,

    BACKSPACE:  8,
    SPACE:      32,
    TAB:        9,
    ENTER:      13,
    ESC:        27,
    LEFT:       37,
    RIGHT:      39,
    UP:         38,
    DOWN:       40
  };

  (function() {
    // Add all ASCII chacters to the map
    for ( var n = 48; n <= 57; n++ ) {
      OSjs.Utils.Keys[String.fromCharCode(n).toUpperCase()] = n;
    }
    for ( var c = 65; c <= 90; c++ ) {
      OSjs.Utils.Keys[String.fromCharCode(c).toUpperCase()] = c;
    }
  })();

  /////////////////////////////////////////////////////////////////////////////
  // EVENTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Gets mouse position in all cases (including touch)
   *
   * @example
   * Utils.mousePosition(ev); // -> {x:1, y:1}
   *
   * @return {(Event|Object)}   ev      DOM Event or an Object
   * @return Object
   */
  OSjs.Utils.mousePosition = function(ev) {
    // If this is not an event object, but a x/y dict
    if ( typeof ev.x !== 'undefined' && typeof ev.y !== 'undefined' ) {
      return {x: ev.x, y: ev.y};
    }

    // If this is a custom event containing position
    if ( ev.detail && typeof ev.detail.x !== 'undefined' && typeof ev.detail.y !== 'undefined' ) {
      return {x: ev.detail.x, y: ev.detail.y};
    }

    // If this was a touch event
    var touch = ev.touches || ev.changedTouches;
    if ( touch && touch[0] ) {
      return {x: touch[0].clientX, y: touch[0].clientY};
    }

    return {x: ev.clientX, y: ev.clientY};
  };

  /**
   * Get the mouse button pressed
   *
   * @function mouseButton
   * @memberof OSjs.Utils
   *
   * @param   {Event}     ev    The DOM Event
   *
   * @return  {String}          The mouse button (left/middle/right)
   */
  OSjs.Utils.mouseButton = function(ev) {
    if ( typeof ev.button !== 'undefined' ) {
      if ( ev.button === 0 ) {
        return 'left';
      } else if ( ev.button === 1 ) {
        return 'middle';
      }
      return 'right';
    }

    if ( ev.which === 2 || ev.which === 4 ) {
      return 'middle';
    } else if ( ev.which === 1 ) {
      return 'left';
    }
    return 'right';
  };

  /**
   * Checks if the event currently has the given key comination.
   *
   * Example: 'CTRL+SHIFT+A'
   *
   * @function keyCombination
   * @memberof OSjs.Utils
   *
   * @param   {Event}     ev            The DOM Event
   * @param   {String}    checkFor      The string of keystrokes to check
   *
   * @return  {Boolean}
   */
  OSjs.Utils.keyCombination = (function() {
    var modifiers = {
      CTRL: function(ev) {
        return ev.ctrlKey;
      },
      SHIFT: function(ev) {
        return ev.shiftKey;
      },
      ALT: function(ev) {
        return ev.altKey;
      },
      META: function(ev) {
        return ev.metaKey;
      }
    };

    function getKeyName(keyCode) {
      var result = false;
      Object.keys(OSjs.Utils.Keys).forEach(function(k) {
        if ( !result && (keyCode === OSjs.Utils.Keys[k]) ) {
          result = k;
        }
      });
      return result;
    }

    return function(ev, checkFor) {
      var checks = checkFor.toUpperCase().split('+');
      var checkMods = {CTRL: false, SHIFT: false, ALT: false};
      var checkKeys = [];

      checks.forEach(function(f) {
        if ( modifiers[f] ) {
          checkMods[f] = true;
        } else {
          checkKeys.push(f);
        }
      });

      return Object.keys(checkMods).every(function(f) {
        var fk = !!modifiers[f](ev);
        return checkMods[f] === fk;
      }) && checkKeys.every(function(f) {
        return getKeyName(ev.keyCode) === f;
      });
    };
  })();

  /**
   * Wrapper for event-binding
   *
   * <pre><code>
   * You can bind multiple events by separating types with a comma.
   *
   * This also automatically binds Touch events.
   *
   *   mousedown = touchstart
   *   mouseup = touchend
   *   mousemove = touchend
   *   contextmenu = long-hold
   *   dblclick = double-tap
   *   click = tap
   * </code></pre>
   *
   * @example
   * Utils.$bind(el, 'click', function(ev, pos, touch) {
   *  // A click event
   * });
   *
   * @example
   * Utils.$bind(el, 'click:customname', function(ev, pos, touch) {
   *  // A click event with custom namespace. Useful
   *  // for when you want to separate events with same
   *  // type.
   * });
   *
   * @example
   * Utils.$bind(el, 'click, mousedown, mouseup', function(ev, pos, touch) {
   *  // You can bind multiple events in one go
   * });
   *
   * @function $bind
   * @memberof OSjs.Utils
   * @TODO Implement MS Pointer events
   *
   * @param   {Node}            el            DOM Element to attach event to
   * @param   {String}          ev            DOM Event Name
   * @param   {CallbackEvent}   callback      Callback on event
   * @param   {Boolean}         [useCapture]  Use capture mode
   */
  OSjs.Utils.$bind = (function() {
    // Default timeouts
    var TOUCH_CONTEXTMENU = 1000;
    var TOUCH_CLICK_MIN = 30;
    var TOUCH_CLICK_MAX = 1000;
    var TOUCH_DBLCLICK = 400;

    /**
     * This is the wrapper for using addEventListener
     */
    function addEventHandler(el, n, t, callback, handler, useCapture, realType) {
      var args = [t, handler, useCapture];

      el.addEventListener.apply(el, args);

      el._boundEvents[n].push({
        realType: realType,
        args: args,
        callback: callback
      });
    }

    /**
     * Creates touch gestures for emulating mouse input
     */
    function createGestureHandler(el, n, t, callback, useCapture) {
      var started;
      var contextTimeout;
      var dblTimeout;
      var moved = false;
      var clicks = 0;

      // Wrapper for destroying` the event
      function _done() {
        contextTimeout = clearTimeout(contextTimeout);
        started = null;
        moved = false;

        el.removeEventListener('touchend', _touchend, false);
        el.removeEventListener('touchmove', _touchmove, false);
        el.removeEventListener('touchcancel', _touchcancel, false);
      }

      // Figure out what kind of event we're supposed to handle on start
      function _touchstart(ev) {
        ev.preventDefault();

        contextTimeout = clearTimeout(contextTimeout);
        started = new Date();
        moved = false;

        if ( t === 'contextmenu' ) {
          contextTimeout = setTimeout(function() {
            emitTouchEvent(ev, t, {button: 2, which: 3, buttons: 2});
            _done();
          }, TOUCH_CONTEXTMENU);
        } else if ( t === 'dblclick' ) {
          if ( clicks === 0 ) {
            dblTimeout = clearTimeout(dblTimeout);
            dblTimeout = setTimeout(function() {
              clicks = 0;
            }, TOUCH_DBLCLICK);

            clicks++;
          } else {
            if ( !moved ) {
              emitTouchEvent(ev, t);
            }
            clicks = 0;
          }
        }

        el.addEventListener('touchend', _touchend, false);
        el.addEventListener('touchmove', _touchmove, false);
        el.addEventListener('touchcancel', _touchcancel, false);
      }

      // Tapping is registered when you let go of the screen
      function _touchend(ev) {
        contextTimeout = clearTimeout(contextTimeout);
        if ( !started ) {
          return _done();
        }

        var now = new Date();
        var diff = now - started;

        if ( !moved && t === 'click' ) {
          if ( (diff > TOUCH_CLICK_MIN) && (diff < TOUCH_CLICK_MAX) ) {
            ev.stopPropagation();
            emitTouchEvent(ev, t);
          }
        }

        return _done();
      }

      // Whenever a movement has occured make sure to avoid clicks
      function _touchmove(ev) {
        if ( !started ) {
          return;
        }

        contextTimeout = clearTimeout(contextTimeout);
        dblTimeout = clearTimeout(dblTimeout);
        clicks = 0;
        moved = true;
      }

      // In case touch is canceled we reset our clickers
      function _touchcancel(ev) {
        dblTimeout = clearTimeout(dblTimeout);
        clicks = 0;

        _done();
      }

      addEventHandler(el, n, 'touchstart', callback, _touchstart, false, 'touchstart');
    }

    /**
     * Emits a normal mouse event from touches
     *
     * This basically emulates mouse behaviour on touch events
     */
    function emitTouchEvent(ev, type, combineWith) {
      ev.preventDefault();

      if ( !ev.currentTarget || ev.changedTouches.length > 1 || (ev.type === 'touchend' && ev.changedTouches > 0) ) {
        return;
      }

      // Make sure we copy the keyboard attributes as well
      var copy = ['ctrlKey', 'altKey', 'shiftKey', 'metaKey', 'screenX', 'screenY'];
      var touch = ev.changedTouches[0];
      var evtArgs = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        relatedTarget: ev.target
      };

      copy.forEach(function(k) {
        evtArgs[k] = ev[k];
      });

      if ( combineWith ) {
        Object.keys(combineWith).forEach(function(k) {
          evtArgs[k] = combineWith[k];
        });
      }

      ev.currentTarget.dispatchEvent(new MouseEvent(type, evtArgs));
    }

    /**
     * Map of touch events
     */
    var customEvents = {
      mousedown: 'touchstart',
      mouseup: 'touchend',
      mousemove: 'touchmove',
      contextmenu: createGestureHandler,
      click: createGestureHandler,
      dblclick: createGestureHandler
    };

    return function(el, evName, callback, useCapture) {
      useCapture = (useCapture === true);

      function addEvent(nsType, type) {
        addEventHandler(el, nsType, type, callback, function mouseEventHandler(ev) {
          return callback(ev, OSjs.Utils.mousePosition(ev));
        }, useCapture);

        if ( customEvents[type] ) {
          if ( typeof customEvents[type] === 'function' ) {
            customEvents[type](el, nsType, type, callback, useCapture);
          } else {
            addEventHandler(el, nsType, customEvents[type], callback, function touchEventHandler(ev) {
              emitTouchEvent(ev, type);
            }, useCapture, customEvents[type]);
          }
        }
      }

      function initNamespace(ns) {
        if ( !el._boundEvents ) {
          el._boundEvents = {};
        }

        if ( !el._boundEvents[ns] ) {
          el._boundEvents[ns] = [];
        }

        var found = el._boundEvents[ns].filter(function(iter) {
          return iter.callback === callback;
        });

        return found.length === 0;
      }

      evName.replace(/\s/g, '').split(',').forEach(function(ns) {
        var type = ns.split(':')[0];

        if ( !initNamespace(ns) ) {
          console.warn('Utils::$bind()', 'This event was already bound, skipping');
          return;
        }

        addEvent(ns, type);
      });
    };
  })();

  /**
   * Unbinds the given event
   *
   * <pre><b>
   * If you don't give a callback it will unbind *all* events in this category.
   *
   * You can unbind multiple events by separating types with a comma
   * </b></pre>
   *
   * @example
   * Utils.$unbind(el, 'click', function() {...}); // Unbinds spesific function
   *
   * @example
   * Utils.$unbind(el, 'click'); // Unbinds all click events
   *
   * @example
   * Utils.$unbind(el); // Unbinds all events
   *
   * @function $unbind
   * @memberof OSjs.Utils
   * @see OSjs.Utils.$bind
   *
   * @param   {Node}          el            DOM Element to attach event to
   * @param   {String}        [ev]          DOM Event Name
   * @param   {Function}      [callback]    Callback on event
   * @param   {Boolean}       [useCapture]  Use capture mode
   */
  OSjs.Utils.$unbind = function(el, evName, callback, param) {

    function unbindAll() {
      if ( el._boundEvents ) {
        Object.keys(el._boundEvents).forEach(function(type) {
          unbindNamed(type);
        });
        delete el._boundEvents;
      }
    }

    function unbindNamed(type) {
      if ( el._boundEvents ) {
        var list = el._boundEvents || {};

        if ( list[type] ) {
          for ( var i = 0; i < list[type].length; i++ ) {
            var iter = list[type][i];

            // If a callback/handler was applied make sure we remove the correct one
            if ( callback && iter.callback !== callback ) {
              continue;
            }

            // We stored the event binding earlier
            el.removeEventListener.apply(el, iter.args);

            list[type].splice(i, 1);
            i++;
          }
        }
      }
    }

    if ( el ) {
      if ( evName ) {
        evName.replace(/\s/g, '').split(',').forEach(function(type) {
          unbindNamed(type);
        });
      } else {
        unbindAll();
      }
    }
  };

})();
