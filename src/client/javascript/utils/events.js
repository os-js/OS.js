/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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

import * as Keycodes from 'utils/keycodes';

/**
 * The callback for browser events bound by OS.js
 * @callback CallbackEvent
 * @param {Event} ev Browser event
 * @param {Object} pos Event pointer position in form of x and y
 */

/////////////////////////////////////////////////////////////////////////////
// MISC
/////////////////////////////////////////////////////////////////////////////

/*
 * Gets the event name considering compability with
 * MSPointerEvent and PointerEvent interfaces.
 */
function getRealEventName(evName) {
  let realName = evName;
  if ( evName !== 'mousewheel' && evName.match(/^mouse/) ) {
    if ( window.PointerEvent ) {
      realName = evName.replace(/^mouse/, 'pointer');
    } else if ( window.MSPointerEvent ) {
      const tmpName = evName.replace(/^mouse/, '');
      realName = 'MSPointer' + tmpName.charAt(0).toUpperCase() + tmpName.slice(1).toLowerCase();
    }
  }
  return realName;
}

/*
 * Gets a list from string of event names
 */
function getEventList(str) {
  return str.replace(/\s/g, '').split(',');
}

/////////////////////////////////////////////////////////////////////////////
// EVENTS
/////////////////////////////////////////////////////////////////////////////

/**
 * Gets mouse position in all cases (including touch)
 *
 * @example
 * mousePosition(ev); // -> {x:1, y:1}
 *
 * @param {Event}   ev    DOM Event
 *
 * @return {(Event|Object)}   ev      DOM Event or an Object
 * @return Object
 */
export function mousePosition(ev) {
  // If this is a custom event containing position
  if ( ev.detail && typeof ev.detail.x !== 'undefined' && typeof ev.detail.y !== 'undefined' ) {
    return {x: ev.detail.x, y: ev.detail.y};
  }

  // If this was a touch event
  const touch = ev.touches || ev.changedTouches || [];
  if ( touch.length ) {
    return {x: touch[0].clientX, y: touch[0].clientY};
  }

  return {x: ev.clientX, y: ev.clientY};
}

/**
 * Get the mouse button pressed
 *
 * @param   {Event}     ev    The DOM Event
 *
 * @return  {String}          The mouse button (left/middle/right)
 */
export function mouseButton(ev) {
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
}

/**
 * Checks if the event currently has the given key comination.
 *
 * Example: 'CTRL+SHIFT+A'
 *
 * @param   {Event}     ev            The DOM Event
 * @param   {String}    checkFor      The string of keystrokes to check
 *
 * @return  {Boolean}
 */
export const keyCombination = (function() {
  const modifiers = {
    CTRL: (ev) => {
      return ev.ctrlKey;
    },
    SHIFT: (ev) => {
      return ev.shiftKey;
    },
    ALT: (ev) => {
      return ev.altKey;
    },
    META: (ev) => {
      return ev.metaKey;
    }
  };

  function getKeyName(keyCode) {
    let result = false;
    Object.keys(Keycodes).forEach((k) => {
      if ( !result && (keyCode === Keycodes[k]) ) {
        result = k;
      }
    });
    return result;
  }

  return function(ev, checkFor) {
    const checks = checkFor.toUpperCase().split('+');
    const checkMods = {CTRL: false, SHIFT: false, ALT: false};
    const checkKeys = [];

    checks.forEach((f) => {
      if ( modifiers[f] ) {
        checkMods[f] = true;
      } else {
        checkKeys.push(f);
      }
    });

    const hasmod = Object.keys(checkMods).every((f) => {
      const fk = !!modifiers[f](ev);
      return checkMods[f] === fk;
    });

    const haskey = checkKeys.every((f) => {
      return getKeyName(ev.keyCode) === f;
    });

    return hasmod && haskey;
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
 * $bind(el, 'click', function(ev, pos, touch) {
 *  // A click event
 * });
 *
 * @example
 * $bind(el, 'click:customname', function(ev, pos, touch) {
 *  // A click event with custom namespace. Useful
 *  // for when you want to separate events with same
 *  // type.
 * });
 *
 * @example
 * $bind(el, 'click, mousedown, mouseup', function(ev, pos, touch) {
 *  // You can bind multiple events in one go
 * });
 *
 * @param   {Node}            el            DOM Element to attach event to
 * @param   {String}          ev            DOM Event Name
 * @param   {CallbackEvent}   callback      Callback on event
 * @param   {Boolean}         [useCapture]  Use capture mode
 */
export const $bind = (function() {

  function makeFakeEvent(name, ev) {
    const pos = mousePosition(ev);
    const nev = Object.assign({
      clientX: pos.x,
      clientY: pos.y,
      x: pos.x,
      y: pos.y
    }, ev);

    return new MouseEvent(name, nev);
  }

  /*
   * This is the wrapper for using addEventListener
   */
  function addEventHandler(el, n, t, callback, handler, useCapture, realType) {
    const args = [t, handler, useCapture];

    el.addEventListener.apply(el, args);

    el._boundEvents[n].push({
      realType: realType,
      args: args,
      callback: callback
    });
  }

  /*
   * Creates mousewheel handler
   */
  function createWheelHandler(el, n, t, callback, useCapture) {

    function _wheel(ev) {
      const pos = mousePosition(ev);
      const direction = (ev.detail < 0 || ev.wheelDelta > 0) ? 1 : -1;
      pos.z = direction;

      return callback(ev, pos);
    }

    addEventHandler(el, n, 'mousewheel', callback, _wheel, useCapture, 'mousewheel');
    addEventHandler(el, n, 'DOMMouseScroll', callback, _wheel, useCapture, 'DOMMouseScroll');
  }

  function createClick(el, n, t, callback, useCapture) {
    let cancelled = false;
    let timeout;
    let firstTarget;
    let firstEvent;

    const tempMove = () => (cancelled = true);

    function cancel() {
      clearTimeout(timeout);
      firstTarget = null;
      cancelled = true;

      window.removeEventListener('toucmove', tempMove);
    }

    function tempEnd(ev) {
      clearTimeout(timeout);
      window.removeEventListener('touchmove', tempMove);
      if ( !cancelled && ev.target === firstTarget ) {
        ev.target.dispatchEvent(makeFakeEvent('click', firstEvent));
      }
    }

    function tempStart(ev) {
      firstEvent = ev;
      firstTarget = ev.target;
      timeout = setTimeout(() => {
        cancelled = true;
      }, 300);
      window.addEventListener('touchmove', tempMove);
    }

    addEventHandler(el, n, 'touchcancel', callback, cancel, useCapture, 'dblclick');
    addEventHandler(el, n, 'touchstart', callback, tempStart, useCapture, 'click');
    addEventHandler(el, n, 'touchend', callback, tempEnd, useCapture, 'click');
  }

  function createDoubleClick(el, n, t, callback, useCapture) {
    let count = 0;
    let cancelled = false;
    let firstTarget;
    let firstEvent;
    let debounce;

    const tempMove = () => (cancelled = true);

    function cancel() {
      firstTarget = null;
      cancelled = true;
      count = 0;

      window.removeEventListener('toucmove', tempMove);
    }

    function tempEnd() {
      window.removeEventListener('touchmove', tempMove);
      debounce = setTimeout(cancel, 680);
    }

    function tempStart(ev) {
      window.addEventListener('touchmove', tempMove);
      clearTimeout(debounce);

      if ( count === 0 ) {
        firstEvent = ev;
        firstTarget = ev.target;
      } else if ( count > 0 ) {
        if ( ev.target !== firstTarget ) {
          cancel();
          return;
        }

        if ( !cancelled ) {
          ev.preventDefault(); // Prevent any zooming etc
          ev.stopPropagation(); // The first tap already propagated
          ev.target.dispatchEvent(makeFakeEvent('dblclick', firstEvent));
        }
      }

      cancelled = false;
      count++;
    }

    addEventHandler(el, n, 'touchcancel', callback, cancel, useCapture, 'dblclick');
    addEventHandler(el, n, 'touchstart', callback, tempStart, useCapture, 'dblclick');
    addEventHandler(el, n, 'touchend', callback, tempEnd, useCapture, 'dblclick');
  }

  function createContextMenu(el, n, t, callback, useCapture) {
    let cancelled = false;
    let timeout;

    const tempMove = () => (cancelled = true);

    function cancel() {
      clearTimeout(timeout);
      cancelled = true;

      window.removeEventListener('toucmove', tempMove);
    }

    function tempEnd(ev) {
      cancelled = true;
      clearTimeout(timeout);
      window.removeEventListener('touchmove', tempMove);
    }

    function tempStart(ev) {
      timeout = setTimeout(() => {
        if ( !cancelled ) {
          ev.preventDefault();
          ev.target.dispatchEvent(makeFakeEvent('contextmenu', ev));
        }
      }, 300);
      window.addEventListener('touchmove', tempMove);
    }

    addEventHandler(el, n, 'touchcancel', callback, cancel, useCapture, 'contextmenu');
    addEventHandler(el, n, 'touchstart', callback, tempStart, useCapture, 'contextmenu');
    addEventHandler(el, n, 'touchend', callback, tempEnd, useCapture, 'contextmenu');
  }

  /*
   * Map of touch events
   */
  const customEvents = {
    mousewheel: createWheelHandler,
    click: createClick,
    dblclick: createDoubleClick,
    contextmenu: createContextMenu
  };

  return function Utils_$bind(el, evName, callback, useCapture, noBind) {
    useCapture = (useCapture === true);

    if ( arguments.length < 3 ) {
      throw new Error('$bind expects 3 or more arguments');
    }
    if ( typeof evName !== 'string' ) {
      throw new Error('Given event type was not a string');
    }
    if ( typeof callback !== 'function' ) {
      throw new Error('Given callback was not a function');
    }

    function addEvent(nsType, type) {
      type = getRealEventName(type);

      addEventHandler(el, nsType, type, callback, function mouseEventHandler(ev) {
        if ( !window.OSjs ) { // Probably shut down
          return null;
        }

        if ( noBind ) {
          return callback(ev, mousePosition(ev));
        }
        return callback.call(el, ev, mousePosition(ev));
      }, useCapture);

      if ( customEvents[type] ) {
        customEvents[type](el, nsType, type, callback, useCapture);
      }
    }

    function initNamespace(ns) {
      if ( !el._boundEvents ) {
        el._boundEvents = {};
      }

      if ( !el._boundEvents[ns] ) {
        el._boundEvents[ns] = [];
      }

      const found = el._boundEvents[ns].filter((iter) => {
        return iter.callback === callback;
      });

      return found.length === 0;
    }

    getEventList(evName).forEach((ns) => {
      const type = ns.split(':')[0];

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
 * $unbind(el, 'click', function() {...}); // Unbinds spesific function
 *
 * @example
 * $unbind(el, 'click'); // Unbinds all click events
 *
 * @example
 * $unbind(el); // Unbinds all events
 *
 * @see $bind
 *
 * @param   {Node}          el            DOM Element to attach event to
 * @param   {String}        [evName]      DOM Event Name
 * @param   {Function}      [callback]    Callback on event
 * @param   {Boolean}       [useCapture]  Use capture mode
 */
export function $unbind(el, evName, callback, useCapture) {

  function unbindNamed(type) {
    if ( el._boundEvents ) {
      const list = el._boundEvents || {};

      if ( list[type] ) {
        for ( let i = 0; i < list[type].length; i++ ) {
          let iter = list[type][i];

          // If a callback/handler was applied make sure we remove the correct one
          if ( callback && iter.callback !== callback ) {
            continue;
          }

          // We stored the event binding earlier
          el.removeEventListener.apply(el, iter.args);

          list[type].splice(i, 1);
          i--;
        }
      }
    }
  }

  function unbindAll() {
    if ( el._boundEvents ) {
      Object.keys(el._boundEvents).forEach((type) => {
        unbindNamed(type);
      });
      delete el._boundEvents;
    }
  }

  if ( el ) {
    if ( evName ) {
      getEventList(evName).forEach((type) => {
        unbindNamed(type);
      });
    } else {
      unbindAll();
    }
  }
}

