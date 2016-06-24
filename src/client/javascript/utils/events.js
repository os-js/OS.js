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

  window.OSjs = window.OSjs || {};
  OSjs.Utils  = OSjs.Utils  || {};

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

  /**
   * Add new methods to EventTarget for better binding/unbinding of events.
   *
   * This makes it possible to add collections and remove them entirely later
   * without giving a reference to the bound function.
   *
   * It does not override the browser internals in any way.
   */
  (function() {

    function _initObject(self, type) {
      if ( typeof self._boundEvents === 'undefined' ) {
        self._boundEvents = {};
      }
      if ( typeof self._boundEvents[type] === 'undefined' ) {
        self._boundEvents[type] = [];
      }
    }

    EventTarget.prototype.bindEventListener = function(type, listener, useCapture) {
      _initObject(this, type);

      // Make sure no duplicate listeners take place
      for ( var i = 0; i < this._boundEvents[type].length; i++ ) {
        if ( this._boundEvents[type][i] === listener ) {
          return;
        }
      }

      this._boundEvents[type].push(listener);
      this.addEventListener.apply(this, arguments);
    };

    EventTarget.prototype.bindVirtualListneners = function(type, collection) {
      _initObject(this, type);
      this._boundEvents[type].push(collection);
    };

    EventTarget.prototype.unbindEventListeners = function() {
      var self = this;
      if ( this._boundEvents ) {
        Object.keys(this._boundEvents).forEach(function(type) {
          self.unbindEventListener(type);
        });

        delete this._boundEvents;
      }
    };

    EventTarget.prototype.unbindEventListener = function(type, listener, useCapture) {
      if ( typeof listener === 'function' ) {
        this.removeEventListener(type, listener, useCapture);
      } else {
        if ( this._boundEvents ) {
          var list = this._boundEvents || [];

          for ( var i = 0; i < list[type].length; i++ ) {
            if ( list[type][i] instanceof EventCollection ) {
              list[type][i].clear();
            } else {
              this.removeEventListener(type, list[type][i], useCapture);
            }

            list[type].splice(i, 1);
            i++;
          }
        }
      }
    };

  })();

  /////////////////////////////////////////////////////////////////////////////
  // MISC
  /////////////////////////////////////////////////////////////////////////////

  /**
   * A collection of keycode mappings
   *
   * @api OSjs.Utils.Keys
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
   * Prevents default Event (shortcut)
   *
   * @api OSjs.Utils._preventDefault()
   * @return bool
   */
  OSjs.Utils._preventDefault = function(ev) {
    ev.preventDefault();
    return false;
  };

  /**
   * Get the mouse button pressed
   *
   * @param   DOMEvent  ev    The DOM Event
   *
   * @return  String          The mouse button (left/middle/right)
   *
   * @api     OSjs.Utils.mouseButton()
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
   * @param   DOMEvent  ev            The DOM Event
   * @param   String    checkFor      The string of keystrokes to check
   *
   * @return  boolean
   *
   * @api     OSjs.Utils.keyCombination()
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
   * @param   DOMElement    el          DOM Element to attach event to
   * @param   String        ev          DOM Event Name
   * @param   Function      callback    Callback on event
   *
   * @return  void
   *
   * @api OSjs.Utils.$bind()
   */
  OSjs.Utils.$bind = (function(msPointerEnabled) {
    var touchstartName = msPointerEnabled ? 'pointerdown' : 'touchstart';
    var touchendName   = msPointerEnabled ? 'pointerup'   : 'touchend';
    var touchmoveName  = msPointerEnabled ? 'pointermove' : 'touchmove';

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

    function createTouchHandler(el, evName, collection, callback, signal) {
      var holdTimeout = null;
      var whenFinished = false;
      var isDone = false;

      function cbs(ev) {
        isDone = false;
        signal();

        if ( evName === 'click' ) {
          whenFinished = function() {
            if ( !isDone ) {
              isDone = true;
              callback.call(el, ev, pos(ev, true), true);
            }
          };

          holdTimeout = setTimeout(function() {
            whenFinished = false;
          }, 300);
        } else if ( evName === 'contextmenu' ) {
          holdTimeout = setTimeout(function() {
            if ( !isDone ) {
              isDone = true;
              ev.stopPropagation();
              ev.preventDefault();
              callback.call(el, ev, pos(ev, true), true);
            }
          }, 450);
        } else if ( evName === 'dblclick' ) {
          if ( el.getAttribute('data-tmp-clicked') !== 'true' ) {
            el.setAttribute('data-tmp-clicked', 'true');

            setTimeout(function() {
              el.removeAttribute('data-tmp-clicked');
            }, 500);
          } else {
            ev.stopPropagation();
            ev.preventDefault();
            callback.call(el, ev, pos(ev, true), true);
          }
        }
      }

      function cbe(ev) {
        signal();

        if ( typeof whenFinished === 'function' ) {
          whenFinished();
        }

        holdTimeout = clearTimeout(holdTimeout);
        whenFinished = false;
      }

      collection.add(el, [touchstartName, cbs, true]);
      collection.add(el, [touchendName, cbe, true]);
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
      var origName = evName;
      evName = origName.split(':')[0];

      var collection = new EventCollection();
      var tev = touchMap[evName];
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
        tev(el, evName, collection, callback, function() {
          wasTouch = true;
        });
      } else if ( typeof tev === 'string' ) {
        collection.add(el, [tev, cbTouchEvent, param === true]);
      }

      collection.add(el, [evName, cbMouseEvent, param === true]);

      el.bindVirtualListneners(origName, collection);
    };
  })(window.navigator.msPointerEnabled);

  /**
   * Unbinds the given event
   *
   * If you don't give a callback it will unbind *all* events in this category.
   *
   * @param   DOMElement    el          DOM Element to attach event to
   * @param   String        ev          DOM Event Name
   * @param   Function      callback    Callback on event
   *
   * @return  void
   *
   * @see OSjs.Utils.$bind()
   * @api OSjs.Utils.$unbind()
   */
  OSjs.Utils.$unbind = function(el, evName, callback, param) {
    if ( el ) {
      el.unbindEventListener(evName, callback, param);
    }
  };

})();
