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

/**
 * A collection of keycode mappings
 *
 * @var
 */
const Keycodes = (function() {
  const list = {
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

    TILDE: 220,
    GRAVE: 192,

    CMD: 17,
    LSUPER: 91,
    RSUPER: 92,

    DELETE: 46,
    INSERT: 45,
    HOME: 36,
    END: 35,
    PGDOWN: 34,
    PGUP: 33,
    PAUSE: 19,
    BREAK: 19,
    CAPS_LOCK: 20,
    SCROLL_LOCK: 186,

    BACKSPACE: 8,
    SPACE: 32,
    TAB: 9,
    ENTER: 13,
    ESC: 27,
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40
  };

  // Add all ASCII chacters to the map
  for ( let n = 33; n <= 126; n++ ) {
    list[String.fromCharCode(n)] = n;
  }

  return Object.freeze(list);
})();

export default Keycodes;
