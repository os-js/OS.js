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

  /////////////////////////////////////////////////////////////////////////////
  // PRIVATES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is just a helper object for managing bound events.
   *
   * Let's say you bind the 'mousedown' event, this will result in both
   * 'mousedown' *and* 'touchstart' being bound due to how the cross-platform
   * system works. This object holds a reference to all of these.
   *
   * It is used together with the EventTarget extensions below.
   */
  function EventCollection() {
    this.collection = [];
  }

  EventCollection.prototype.add = function(el, iter) {
    el.addEventListener.apply(el, iter);
    this.collection.push([el, iter]);

  };

  EventCollection.prototype.clear = function() {
    this.collection.forEach(function(iter) {
      iter[0].removeEventListener.apply(iter[0], iter[1]);
    });
    this.collection = [];
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXTEND EVENT BINDING
  /////////////////////////////////////////////////////////////////////////////

  function _initObject(self, type) {
    if ( typeof self._boundEvents === 'undefined' ) {
      self._boundEvents = {};
    }
    if ( typeof self._boundEvents[type] === 'undefined' ) {
      self._boundEvents[type] = [];
    }
  }

  function bindEventListener(el, type, listener, useCapture) {
    _initObject(el, type);

    // Make sure no duplicate listeners take place
    for ( var i = 0; i < el._boundEvents[type].length; i++ ) {
      if ( el._boundEvents[type][i] === listener ) {
        return;
      }
    }

    el._boundEvents[type].push(listener);
    el.addEventListener(type, listener, useCapture);
  }

  function bindVirtualListneners(el, type, collection) {
    _initObject(el, type);
    el._boundEvents[type].push(collection);
  }

  function unbindEventListeners(el) {
    if ( el._boundEvents ) {
      Object.keys(el._boundEvents).forEach(function(type) {
        unbindEventListener(el, type);
      });
      delete el._boundEvents;
    }
  }

  function unbindEventListener(el, type, listener, useCapture) {
    if ( typeof listener === 'function' ) {
      el.removeEventListener(type, listener, useCapture);
    } else {
      if ( type ) {
        if ( el._boundEvents ) {
          var list = el._boundEvents || [];

          for ( var i = 0; i < list[type].length; i++ ) {
            if ( list[type][i] instanceof EventCollection ) {
              list[type][i].clear();
            } else {
              el.removeEventListener(type, list[type][i], useCapture);
            }

            list[type].splice(i, 1);
            i++;
          }
        }
      } else {
        unbindEventListeners(el);
      }
    }
  }

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
   * You can bind multiple events by separating types with a comma
   *
   * @function $bind
   * @memberof OSjs.Utils
   *
   * @param   {Node}          el            DOM Element to attach event to
   * @param   {String}        ev            DOM Event Name
   * @param   {Function}      callback      Callback on event
   * @param   {Boolean}       [useCapture]  Use capture mode
   */
  OSjs.Utils.$bind = (function(msPointerEnabled) {
    var touchstartName   = msPointerEnabled ? 'pointerdown'   : 'touchstart';
    var touchendName     = msPointerEnabled ? 'pointerup'     : 'touchend';
    var touchmoveName    = msPointerEnabled ? 'pointermove'   : 'touchmove';
    var touchcancelName  = msPointerEnabled ? 'pointercancel' : 'touchcancel';

    function pos(ev, touchDevice) {
      function _getTouch() {
        var t = {};
        if ( ev.changedTouches ) {
          t = ev.changedTouches[0];
        } else if ( ev.touches ) {
          t = ev.touches[0];
        }
        return t;
      }

      var dev = touchDevice ? _getTouch() : ev;
      return {x: dev.clientX, y: dev.clientY};
    }

    function createTouchHandler(el, evName, collection, callback, signal, param) {
      var touchStarted = false;
      var touchEnded = false;
      var cachedX = 0;
      var oldPos = {};
      var curPos = {};

      function _emitClick(ev) {
        ev.stopPropagation();

        if ( (oldPos.x === curPos.x) && !touchStarted && (oldPos.y === curPos.y) ) {
          callback.call(el, ev, curPos, true);
        }
        collection.timeout = clearTimeout(collection.timeout);
      }

      collection.add(el, [touchstartName, function(ev) {
        var now = new Date();

        ev.preventDefault();
        collection.timeout = clearTimeout(collection.timeout);

        if ( evName === 'dblclick' ) {
          ev.stopPropagation();
          if ( collection.firstTouch && ((now - collection.firstTouch) < 500) ) {
            _emitClick(ev);
            return;
          }
        }

        collection.firstTouch = now;
        oldPos = curPos = pos(ev, true);
        touchStarted = true;

        if ( ['click', 'contextmenu'].indexOf(evName) !== -1 ) {
          ev.stopPropagation();
          collection.timeout = setTimeout(function() {
            _emitClick(ev);
          }, evName === 'click' ? 250 : 600);
        } else if ( evName === 'mousedown' ) {
          _emitClick(ev);
        }
      }, param]);

      collection.add(el, [touchcancelName, function(ev) {
        ev.preventDefault();

        touchEnded = true;
        touchStarted = false;
        collection.timeout = clearTimeout(collection.timeout);
      }, param]);

      collection.add(el, [touchendName, function(ev) {
        ev.preventDefault();

        touchStarted = false;
        touchEnded = true;

        if ( evName === 'mouseup' ) {
          callback.call(el, ev, curPos, true);
        } else if ( evName === 'contextmenu' ) {
          collection.timeout = clearTimeout(collection.timeout);
        }
      }, param]);

      collection.add(el, [touchmoveName, function(ev) {
        ev.preventDefault();

        curPos = pos(ev, true);
        collection.timeout = clearTimeout(collection.timeout);

        if ( !touchEnded ) {
          if ( evName === 'mousemove' ) {
            callback.call(el, ev, curPos, true);
          }
        }
      }, param]);
    }

    var touchMap = {
      click: createTouchHandler,
      contextmenu: createTouchHandler,
      dblclick: createTouchHandler,
      mouseup: touchendName,
      mousemove: touchmoveName,
      mousedown: touchstartName
    };

    return function(el, evName, callback, param) {

      evName.replace(/\s/g, '').split(',').forEach(function(part) {
        var collection = new EventCollection();
        var type = part.split(':')[0];
        var tev = touchMap[type];
        var wasTouch = false;

        function cbTouchEvent(ev) {
          callback.call(el, ev, pos(ev, true), true);
        }

        function cbMouseEvent(ev) {
          if ( !wasTouch ) {
            callback.call(el, ev, pos(ev), false);
          }
        }

        if ( typeof tev === 'function' ) {
          tev(el, type, collection, callback, function() {
            wasTouch = true;
          }, param);
        } else if ( typeof tev === 'string' ) {
          collection.add(el, [tev, cbTouchEvent, param === true]);
        }

        collection.add(el, [type, cbMouseEvent, param === true]);

        bindVirtualListneners(el, part, collection);
      });

    };
  })(false);
  //})(window.navigator.msPointerEnabled);

  /**
   * Unbinds the given event
   *
   * If you don't give a callback it will unbind *all* events in this category.
   *
   * You can unbind multiple events by separating types with a comma
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
    if ( el ) {
      if ( evName ) {
        evName.replace(/\s/g, '').split(',').forEach(function(type) {
          unbindEventListener(el, type, callback, param);
        });
      } else {
        unbindEventListeners(el);
      }
    }
  };

})();
