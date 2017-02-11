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

(function(Application, Window, Utils, VFS, GUI, API) {
  'use strict';

  /**
   * This script is based on https://github.com/GNOME/gtk/tree/master/gdk/broadway
   * and was made to fit with OS.js
   *
   * @namespace Broadway
   * @memberof OSjs
   */

  /////////////////////////////////////////////////////////////////////////////
  // CONSTANTS
  /////////////////////////////////////////////////////////////////////////////

  var GDK_CROSSING_NORMAL = 0;
  //var GDK_CROSSING_GRAB = 1;
  //var GDK_CROSSING_UNGRAB = 2;

  // GdkModifierType
  var GDK_SHIFT_MASK = 1 << 0;
  //var GDK_LOCK_MASK     = 1 << 1;
  var GDK_CONTROL_MASK  = 1 << 2;
  var GDK_MOD1_MASK     = 1 << 3;
  //var GDK_MOD2_MASK     = 1 << 4;
  //var GDK_MOD3_MASK     = 1 << 5;
  //var GDK_MOD4_MASK     = 1 << 6;
  //var GDK_MOD5_MASK     = 1 << 7;
  var GDK_BUTTON1_MASK  = 1 << 8;
  var GDK_BUTTON2_MASK  = 1 << 9;
  var GDK_BUTTON3_MASK  = 1 << 10;
  var GDK_BUTTON4_MASK  = 1 << 11;
  var GDK_BUTTON5_MASK  = 1 << 12;
  //var GDK_SUPER_MASK    = 1 << 26;
  //var GDK_HYPER_MASK    = 1 << 27;
  //var GDK_META_MASK     = 1 << 28;
  //var GDK_RELEASE_MASK  = 1 << 30;

  var ON_KEYDOWN = 1 << 0; /* Report on keydown, otherwise wait until keypress  */

  var specialKeyTable = {
    // These generate a keyDown and keyPress in Firefox and Opera
    8: [0xFF08, ON_KEYDOWN], // BACKSPACE
    13: [0xFF0D, ON_KEYDOWN], // ENTER

    // This generates a keyDown and keyPress in Opera
    9: [0xFF09, ON_KEYDOWN], // TAB

    27: 0xFF1B, // ESCAPE
    46: 0xFFFF, // DELETE
    36: 0xFF50, // HOME
    35: 0xFF57, // END
    33: 0xFF55, // PAGE_UP
    34: 0xFF56, // PAGE_DOWN
    45: 0xFF63, // INSERT
    37: 0xFF51, // LEFT
    38: 0xFF52, // UP
    39: 0xFF53, // RIGHT
    40: 0xFF54, // DOWN
    16: 0xFFE1, // SHIFT
    17: 0xFFE3, // CONTROL
    18: 0xFFE9, // Left ALT (Mac Command)
    112: 0xFFBE, // F1
    113: 0xFFBF, // F2
    114: 0xFFC0, // F3
    115: 0xFFC1, // F4
    116: 0xFFC2, // F5
    117: 0xFFC3, // F6
    118: 0xFFC4, // F7
    119: 0xFFC5, // F8
    120: 0xFFC6, // F9
    121: 0xFFC7, // F10
    122: 0xFFC8, // F11
    123: 0xFFC9  // F12
  };

  /////////////////////////////////////////////////////////////////////////////
  // GLOBALS
  /////////////////////////////////////////////////////////////////////////////

  var ws = null;
  var lastSerial = 0;
  var lastState;
  var lastTimeStamp = 0;
  var surfaces = {};
  var keyDownList = [];
  var outstandingCommands = [];

  /////////////////////////////////////////////////////////////////////////////
  // CLASSES
  /////////////////////////////////////////////////////////////////////////////

  function BinCommands(message) {
    this.arraybuffer = message;
    this.u8 = new Uint8Array(message);
    this.length = this.u8.length;
    this.pos = 0;
  }

  BinCommands.prototype.get_char = function() {
    return String.fromCharCode(this.u8[this.pos++]);
  };

  BinCommands.prototype.get_bool = function() {
    return this.u8[this.pos++] !== 0;
  };

  BinCommands.prototype.get_flags = function() {
    return this.u8[this.pos++];
  };

  BinCommands.prototype.get_16 = function() {
    var v = this.u8[this.pos] + (this.u8[this.pos + 1] << 8);
    this.pos = this.pos + 2;
    return v;
  };

  BinCommands.prototype.get_16s = function() {
    var v = this.get_16 ();
    return (v > 32767) ? v - 65536 : v;
  };

  BinCommands.prototype.get_32 = function() {
    var v =
      this.u8[this.pos] +
      (this.u8[this.pos + 1] << 8) +
      (this.u8[this.pos + 2] << 16) +
      (this.u8[this.pos + 3] << 24);

    this.pos = this.pos + 4;
    return v;
  };

  BinCommands.prototype.get_data = function() {
    var size = this.get_32();
    var data = new Uint8Array (this.arraybuffer, this.pos, size);
    this.pos = this.pos + size;
    return data;
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function resizeCanvas(canvas, w, h) {
    var tmpCanvas = canvas.ownerDocument.createElement('canvas');
    tmpCanvas.width = canvas.width;
    tmpCanvas.height = canvas.height;
    var tmpContext = tmpCanvas.getContext('2d');
    tmpContext.globalCompositeOperation = 'copy';
    tmpContext.drawImage(canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);

    canvas.width = w;
    canvas.height = h;

    var context = canvas.getContext('2d');
    context.globalCompositeOperation = 'copy';
    context.drawImage(tmpCanvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
  }

  function copyRect(src, srcX, srcY, dest, destX, destY, width, height) {
    // Clip to src
    if (srcX + width > src.width) {
      width = src.width - srcX;
    }
    if (srcY + height > src.height) {
      height = src.height - srcY;
    }

    // Clip to dest
    if (destX + width > dest.width) {
      width = dest.width - destX;
    }
    if (destY + height > dest.height) {
      height = dest.height - destY;
    }

    var srcRect = src.width * 4 * srcY + srcX * 4;
    var destRect = dest.width * 4 * destY + destX * 4;

    for (var i = 0; i < height; i++) {
      var line = src.data.subarray(srcRect, srcRect + width * 4);
      dest.data.set(line, destRect);
      srcRect += src.width * 4;
      destRect += dest.width * 4;
    }
  }

  function decodeBuffer(context, oldData, w, h, data, debug) {
    var i;
    var imageData = context.createImageData(w, h);

    if ( oldData !== null ) {
      // Copy old frame into new buffer
      copyRect(oldData, 0, 0, imageData, 0, 0, oldData.width, oldData.height);
    }

    var src = 0;
    var dest = 0;

    while (src < data.length)  {
      var b = data[src++];
      var g = data[src++];
      var r = data[src++];
      var alpha = data[src++];
      var len;

      if (alpha !== 0) {
        imageData.data[dest++] = r;
        imageData.data[dest++] = g;
        imageData.data[dest++] = b;
        imageData.data[dest++] = alpha;
      } else {
        var cmd = r & 0xf0;
        switch (cmd) {
          case 0x00: // Transparent pixel
            //log("Got transparent");
            imageData.data[dest++] = 0;
            imageData.data[dest++] = 0;
            imageData.data[dest++] = 0;
            imageData.data[dest++] = 0;
            break;

          case 0x10: // Delta 0 run
            len = (r & 0xf) << 16 | g << 8 | b;
            //log("Got delta0, len: " + len);
            dest += len * 4;
            break;

          case 0x20: // Block reference
            var blockid = (r & 0xf) << 16 | g << 8 | b;

            var block_stride = (oldData.width + 32 - 1) / 32 | 0;
            var srcY = (blockid / block_stride | 0) * 32;
            var srcX = (blockid % block_stride | 0) * 32;

            b = data[src++];
            g = data[src++];
            r = data[src++];
            alpha = data[src++];

            var destX = alpha << 8 | r;
            var destY = g << 8 | b;

            copyRect(oldData, srcX, srcY, imageData, destX, destY, 32, 32);
            //log("Got block, id: " + blockid +  "(" + srcX +"," + srcY + ") at " + destX + "," + destY);

            break;

          case 0x30: // Color run
            len = (r & 0xf) << 16 | g << 8 | b;
            //log("Got color run, len: " + len);

            b = data[src++];
            g = data[src++];
            r = data[src++];
            alpha = data[src++];

            for (i = 0; i < len; i++) {
              imageData.data[dest++] = r;
              imageData.data[dest++] = g;
              imageData.data[dest++] = b;
              imageData.data[dest++] = alpha;
            }

            break;

          case 0x40: // Delta run
            len = (r & 0xf) << 16 | g << 8 | b;
            //log("Got delta run, len: " + len);

            b = data[src++];
            g = data[src++];
            r = data[src++];
            alpha = data[src++];

            for (i = 0; i < len; i++) {
              imageData.data[dest] = (imageData.data[dest] + r) & 0xff;
              dest++;
              imageData.data[dest] = (imageData.data[dest] + g) & 0xff;
              dest++;
              imageData.data[dest] = (imageData.data[dest] + b) & 0xff;
              dest++;
              imageData.data[dest] = (imageData.data[dest] + alpha) & 0xff;
              dest++;
            }
            break;

          default:
            console.error('Unknown buffer commend ' + cmd);
        }
      }
    }

    return imageData;
  }

  function getLayer(ev, id) {
    var cid = id;
    if ( ev.target ) {
      var tmp = ev.target.getAttribute('data-surface-id');
      if ( tmp ) {
        cid = parseInt(tmp, 10);
      }
    }
    return cid;
  }

  /////////////////////////////////////////////////////////////////////////////
  // ACTIONS
  /////////////////////////////////////////////////////////////////////////////

  function sendInput(cmd, args) {
    if ( ws === null ) {
      return;
    }

    var fullArgs = [cmd.charCodeAt(0), lastSerial, lastTimeStamp].concat(args);
    var buffer = new window.ArrayBuffer(fullArgs.length * 4);
    var view = new window.DataView(buffer);
    fullArgs.forEach(function(arg, i) {
      view.setInt32(i * 4, arg, false);
    });

    ws.send(buffer);
  }

  /////////////////////////////////////////////////////////////////////////////
  // INPUT
  /////////////////////////////////////////////////////////////////////////////

  function updateForEvent(ev) {
    lastState &= ~(GDK_SHIFT_MASK | GDK_CONTROL_MASK | GDK_MOD1_MASK);
    if (ev.shiftKey) {
      lastState |= GDK_SHIFT_MASK;
    }
    if (ev.ctrlKey) {
      lastState |= GDK_CONTROL_MASK;
    }
    if (ev.altKey) {
      lastState |= GDK_MOD1_MASK;
    }

    lastTimeStamp = ev.timeStamp;
  }

  function getButtonMask(button) {
    if (button === 1) {
      return GDK_BUTTON1_MASK;
    }
    if (button === 2) {
      return GDK_BUTTON2_MASK;
    }
    if (button === 3) {
      return GDK_BUTTON3_MASK;
    }
    if (button === 4) {
      return GDK_BUTTON4_MASK;
    }
    if (button === 5) {
      return GDK_BUTTON5_MASK;
    }
    return 0;
  }

  function cancelEvent(ev) {
    ev = ev ? ev : window.event;

    if ( ev.stopPropagation ) {
      ev.stopPropagation();
    }
    if ( ev.preventDefault ) {
      ev.preventDefault();
    }
    ev.cancelBubble = true;
    ev.cancel = true;
    ev.returnValue = false;

    return false;
  }

  function copyKeyEvent(ev) {
    var members = ['type', 'keyCode', 'charCode', 'which',
      'altKey', 'ctrlKey', 'shiftKey',
      'keyLocation', 'keyIdentifier'];

    var i, obj = {};
    for ( i = 0; i < members.length; i++ ) {
      if ( typeof ev[members[i]] !== 'undefined' ) {
        obj[members[i]] = ev[members[i]];
      }
    }
    return obj;
  }

  function getEventKeySym(ev) {
    if (typeof ev.which !== 'undefined' && ev.which > 0) {
      return ev.which;
    }
    return ev.keyCode;
  }

  function getKeysym(ev) {
    var keysym = getEventKeySym(ev);
    var unicodeTable = OSjs.Broadway.unicodeTable;
    if ((keysym > 255) && (keysym < 0xFF00)) {
      // Map Unicode outside Latin 1 to gdk keysyms
      keysym = unicodeTable[keysym];
      if (typeof keysym === 'undefined') {
        keysym = 0;
      }
    }

    return keysym;
  }

  function ignoreKeyEvent(ev) {
    // Blarg. Some keys have a different keyCode on keyDown vs keyUp
    if ( ev.keyCode === 229 ) {
      // French AZERTY keyboard dead key.
      // Lame thing is that the respective keyUp is 219 so we can't
      // properly ignore the keyUp event
      return true;
    }
    return false;
  }

  // This is based on the approach from noVNC. We handle
  // everything in keydown that we have all info for, and that
  // are not safe to pass on to the browser (as it may do something
  // with the key. The rest we pass on to keypress so we can get the
  // translated keysym.
  function getKeysymSpecial(ev) {
    if (ev.keyCode in specialKeyTable) {
      var r = specialKeyTable[ev.keyCode];
      var flags = 0;
      if (typeof r !== 'number') {
        flags = r[1];
        r = r[0];
      }
      if (ev.type === 'keydown' || flags & ON_KEYDOWN) {
        return r;
      }
    }
    // If we don't hold alt or ctrl, then we should be safe to pass
    // on to keypressed and look at the translated data
    if (!ev.ctrlKey && !ev.altKey) {
      return null;
    }

    var keysym = getEventKeySym(ev);

    // Remap symbols
    switch (keysym) {
      case 186 : keysym = 59; break; // ; (IE)
      case 187 : keysym = 61; break; // = (IE)
      case 188 : keysym = 44; break; // , (Mozilla, IE)
      case 109 : // - (Mozilla, Opera)
        if (true) {
          // TODO: check if browser is firefox or opera
          keysym = 45;
        }
        break;
      case 189 : keysym = 45; break; // - (IE)
      case 190 : keysym = 46; break; // . (Mozilla, IE)
      case 191 : keysym = 47; break; // / (Mozilla, IE)
      case 192 : keysym = 96; break; // ` (Mozilla, IE)
      case 219 : keysym = 91; break; // [ (Mozilla, IE)
      case 220 : keysym = 92; break; // \ (Mozilla, IE)
      case 221 : keysym = 93; break; // ] (Mozilla, IE)
      case 222 : keysym = 39; break; // ' (Mozilla, IE)
    }

    // Remap shifted and unshifted keys
    if (!!ev.shiftKey) {
      switch (keysym) {
        case 48 : keysym = 41 ; break; // ) (shifted 0)
        case 49 : keysym = 33 ; break; // ! (shifted 1)
        case 50 : keysym = 64 ; break; // @ (shifted 2)
        case 51 : keysym = 35 ; break; // # (shifted 3)
        case 52 : keysym = 36 ; break; // $ (shifted 4)
        case 53 : keysym = 37 ; break; // % (shifted 5)
        case 54 : keysym = 94 ; break; // ^ (shifted 6)
        case 55 : keysym = 38 ; break; // & (shifted 7)
        case 56 : keysym = 42 ; break; // * (shifted 8)
        case 57 : keysym = 40 ; break; // ( (shifted 9)
        case 59 : keysym = 58 ; break; // : (shifted `)
        case 61 : keysym = 43 ; break; // + (shifted ;)
        case 44 : keysym = 60 ; break; // < (shifted ,)
        case 45 : keysym = 95 ; break; // _ (shifted -)
        case 46 : keysym = 62 ; break; // > (shifted .)
        case 47 : keysym = 63 ; break; // ? (shifted /)
        case 96 : keysym = 126; break; // ~ (shifted `)
        case 91 : keysym = 123; break; // { (shifted [)
        case 92 : keysym = 124; break; // | (shifted \)
        case 93 : keysym = 125; break; // } (shifted ])
        case 39 : keysym = 34 ; break; // " (shifted ')
      }
    } else if ((keysym >= 65) && (keysym <= 90)) {
      // Remap unshifted A-Z
      keysym += 32;
    } else if (ev.keyLocation === 3) {
      // numpad keys
      switch (keysym) {
        case 96 : keysym = 48; break; // 0
        case 97 : keysym = 49; break; // 1
        case 98 : keysym = 50; break; // 2
        case 99 : keysym = 51; break; // 3
        case 100: keysym = 52; break; // 4
        case 101: keysym = 53; break; // 5
        case 102: keysym = 54; break; // 6
        case 103: keysym = 55; break; // 7
        case 104: keysym = 56; break; // 8
        case 105: keysym = 57; break; // 9
        case 109: keysym = 45; break; // -
        case 110: keysym = 46; break; // .
        case 111: keysym = 47; break; // /
      }
    }

    return keysym;
  }

  function getKeyEvent(keyCode, pop) {
    var i, fev = null;
    for (i = keyDownList.length - 1; i >= 0; i--) {
      if (keyDownList[i].keyCode === keyCode) {
        if ((typeof pop !== 'undefined') && pop) {
          fev = keyDownList.splice(i, 1)[0];
        } else {
          fev = keyDownList[i];
        }
        break;
      }
    }
    return fev;
  }

  /////////////////////////////////////////////////////////////////////////////
  // COMMANDS
  /////////////////////////////////////////////////////////////////////////////

  function cmdGrabPointer(id, ownerEvents) {
    sendInput ('g', []);
  }

  function cmdUngrabPointer() {
    sendInput ('u', []);
  }

  function cmdPutBuffer(id, w, h, compressed) {
    var surface = surfaces[id];
    var context = surface.canvas.getContext('2d');

    var inflate = new window.Zlib.RawInflate(compressed);
    var data = inflate.decompress();

    var imageData = decodeBuffer(context, surface.imageData, w, h, data, false);
    context.putImageData(imageData, 0, 0);
    surface.imageData = imageData;
  }

  function sendConfigureNotify(surface) {
    sendInput('w', [surface.id, surface.x, surface.y, surface.width, surface.height]);
  }

  function cmdLowerSurface(id) {
    /* TODO
    var surface = surfaces[id];
    */
  }

  function cmdRaiseSurface(id) {
    /* TODO
    var surface = surfaces[id];
    */
  }

  function cmdMoveResizeSurface(id, has_pos, x, y, has_size, w, h) {
    var surface = surfaces[id];

    console.debug('Broadway', 'onMoveResizeSurface()', [id, has_pos, has_size], [x, y], [w, h], surface);

    if ( has_pos ) {
      surface.positioned = true;
      surface.x = x;
      surface.y = y;
    }

    if ( has_size ) {
      surface.width = w;
      surface.height = h;
    }

    if ( has_size ) {
      resizeCanvas(surface.canvas, w, h);
    }

    if ( surface.isTemp ) {
      if ( has_pos ) {
        var parentSurface = surfaces[surface.transientParent];
        var xOffset = surface.x - parentSurface.x;
        var yOffset = surface.y - parentSurface.y;

        surface.xOff = xOffset;
        surface.yOff = yOffset;

        surface.canvas.style.left = xOffset + 'px';
        surface.canvas.style.top = yOffset + 'px';
      }
    } else {
      if ( surface.visible ) {
        OSjs.Broadway.Events.onMoveSurface(id, has_pos, has_size, surface);
      }
    }

    sendConfigureNotify(surface);
  }

  function cmdDeleteSurface(id) {
    var surface = surfaces[id];

    if ( surface ) {
      console.debug('Broadway', 'onDeleteSurface()', id);
      if ( surface.canvas.parentNode ) {
        surface.canvas.parentNode.removeChild(surface.canvas);
      }

      OSjs.Broadway.Events.onDeleteSurface(id);

      delete surfaces[id];
    }
  }

  function cmdSetTransientFor(id, parentId) {
    var surface = surfaces[id];

    if ( surface ) {
      if ( surface.transientParent === parentId ) {
        return;
      }

      surface.transientParent = parentId;
      var parentSurface = surfaces[parentId];
      if ( surface.positioned ) {
        console.debug('Broadway', 'onSetTransient()', id, parentId, surface);
        parentSurface.canvas.parentNode.appendChild(surface.canvas);
      }
    }
  }

  function cmdHideSurface(id) {
    var surface = surfaces[id];
    if ( surface ) {
      surface.visible = false;
      if ( surface.canvas ) {
        surface.canvas.style.display = 'none';
      }

      console.debug('Broadway', 'onHideSurface()', id);
      OSjs.Broadway.Events.onHideSurface(id);
    }
  }

  function cmdShowSurface(id) {
    var surface = surfaces[id];

    if ( surface ) {
      surface.visible = true;
      if ( surface.canvas ) {
        surface.canvas.style.display = 'inline';
      }

      console.debug('Broadway', 'onShowSurface()', id);
      OSjs.Broadway.Events.onShowSurface(id);
    }
  }

  function cmdCreateSurface(id, x, y, width, height, isTemp) {
    var surface = {
      id: id,
      xOff: 0,
      yOff: 0,
      x: x,
      y: y,
      width: width,
      height: height,
      isTemp: isTemp,
      positioned: isTemp,
      transientParent: 0,
      visible: false,
      imageData: null,
      canvas: document.createElement('canvas')
    };

    console.debug('Broadway', 'onCreateSurface()', surface);

    surface.canvas.width = width;
    surface.canvas.height = height;
    surface.canvas.setAttribute('data-surface-id', String(id));

    if ( isTemp ) {
      surface.canvas.style.position = 'absolute';
      surface.canvas.style.left = x + 'px';
      surface.canvas.style.top = y + 'px';
      surface.canvas.style.zIndex = '9999999';
      surface.canvas.style.display = 'none';
    }

    OSjs.Broadway.Events.onCreateSurface(id, surface);

    surfaces[id] = surface;
    sendConfigureNotify(surface);
  }

  /////////////////////////////////////////////////////////////////////////////
  // COMMAND HANDLERS
  /////////////////////////////////////////////////////////////////////////////

  var Commands = {
    D: function() {
      OSjs.Broadway.GTK.disconnect();
    },

    s: function(cmd) { // Create new surface
      cmdCreateSurface(
        cmd.get_16(), // id
        cmd.get_16s(), // x
        cmd.get_16s(), // y
        cmd.get_16(), // w
        cmd.get_16(), // h
        cmd.get_bool() // tmp
      );
    },

    S: function(cmd) { // Shows a surface
      cmdShowSurface(cmd.get_16());
    },

    H: function(cmd) { // Hides a surface
      cmdHideSurface(cmd.get_16());
    },

    p: function(cmd) { // Set transient parent
      cmdSetTransientFor(cmd.get_16(), cmd.get_16());
    },

    d: function(cmd) { // Deletes a surface
      cmdDeleteSurface(cmd.get_16());
    },

    m: function(cmd) { // Moves a surface
      var x, y, w, h;

      var id = cmd.get_16();
      var ops = cmd.get_flags();
      var has_pos = ops & 1;

      if ( has_pos ) {
        x = cmd.get_16s();
        y = cmd.get_16s();
      }

      var has_size = ops & 2;
      if ( has_size ) {
        w = cmd.get_16();
        h = cmd.get_16();
      }

      cmdMoveResizeSurface(id, has_pos, x, y, has_size, w, h);
    },

    r: function(cmd) { // Raises a surface
      cmdRaiseSurface(cmd.get_16());
    },

    R: function(cmd) { // Lowers a surface
      cmdLowerSurface(cmd.get_16());
    },

    b: function(cmd) { // Put image buffer
      cmdPutBuffer(
        cmd.get_16(), // id
        cmd.get_16(), // w
        cmd.get_16(), // h
        cmd.get_data() // data
      );
    },

    g: function(cmd) { // Grab
      cmdGrabPointer(cmd.get_16(), cmd.get_bool());
    },

    u: function() { // Ungrab
      cmdUngrabPointer();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // INPUT INJECTORS
  /////////////////////////////////////////////////////////////////////////////

  var Input = {
    mousewheel: function(id, cid, ev, relx, rely, mx, my) {
      var offset = ev.detail ? ev.detail : -ev.wheelDelta;
      var dir = offset > 0 ? 1 : 0;
      sendInput('s', [id, cid, relx, rely, mx, my, lastState, dir]);
    },

    mousedown: function(id, cid, ev, relx, rely, mx, my) {
      updateForEvent(ev);
      var button = ev.button + 1;
      lastState = lastState | getButtonMask(button);
      sendInput('b', [id, cid, relx, rely, mx, my, lastState, button]);
    },

    mouseup: function(id, cid, ev, relx, rely, mx, my) {
      updateForEvent(ev);
      var button = ev.button + 1;
      lastState = lastState & ~getButtonMask (button);
      sendInput('B', [id, cid, relx, rely, mx, my, lastState, button]);
    },

    mouseover: function(id, cid, ev, relx, rely, mx, my) {
      updateForEvent(ev);
      if ( id !== 0 ) {
        sendInput('e', [id, cid, relx, rely, mx, my, lastState, GDK_CROSSING_NORMAL]);
      }
    },

    mouseout: function(id, cid, ev, relx, rely, mx, my) {
      updateForEvent(ev);
      if ( id !== 0 ) {
        sendInput('l', [id, cid, relx, rely, mx, my, lastState, GDK_CROSSING_NORMAL]);
      }
    },

    mousemove: function(id, cid, ev, relx, rely, mx, my) {
      updateForEvent(ev);
      sendInput('m', [id, cid, relx, rely, mx, my, lastState]);
    },

    keydown: function(id, cid, ev) {
      updateForEvent(ev);

      var fev = copyKeyEvent(ev || window.event);
      var keysym = getKeysymSpecial(ev);
      var suppress = false;

      fev.keysym = keysym;
      if ( keysym ) {
        if ( !ignoreKeyEvent(ev) ) {
          sendInput('k', [keysym, lastState]);
        }
        suppress = true;
      }

      if ( !ignoreKeyEvent(ev) ) {
        keyDownList.push(fev);
      }

      if ( suppress ) {
        cancelEvent(ev);
      }
    },

    keypress: function(id, cid, ev) {
      var kdlen = keyDownList.length;

      if (((typeof ev.which !== 'undefined') && (ev.which === 0)) || getKeysymSpecial(ev)) {
        // Firefox and Opera generate a keyPress event even if keyDown
        // is suppressed. But the keys we want to suppress will have
        // either:
        // - the which attribute set to 0
        // - getKeysymSpecial() will identify it
        cancelEvent(ev);
        return;
      }

      var keysym = getKeysym(ev);

      // Modify the which attribute in the depressed keys list so
      // that the keyUp event will be able to have the character code
      // translation available.
      if (kdlen > 0) {
        keyDownList[kdlen - 1].keysym = keysym;
      }

      // Send the translated keysym
      if (keysym > 0) {
        sendInput ('k', [keysym, lastState]);
      }

      // Stop keypress events just in case
      cancelEvent(ev);
    },

    keyup: function(id, cid, ev) {
      var fev = getKeyEvent(ev.keyCode, true);
      var keysym = fev ? fev.keysym : 0;
      if ( keysym > 0 ) {
        sendInput('K', [keysym, lastState]);
      }
      cancelEvent(ev);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var Broadway = {
    /**
     * Connects to a Broadway server
     *
     * @param {String}    url     Connection URL
     * @param {Option}    opts    Options
     *
     * @function connect
     * @memberof OSjs.Broadway.GTK
     */
    connect: function(url, opts) {
      if ( ws ) {
        OSjs.Broadway.Connection.disconnect();
      }

      ws = new WebSocket(url, 'broadway');
      ws.binaryType = 'arraybuffer';

      ws.onopen = function() {
        OSjs.Broadway.Events.onSocketOpen();
      };

      ws.onclose = function() {
        ws = null;

        OSjs.Broadway.Events.onSocketClose();
      };

      function handleCommands(cmd) {
        while ( cmd.pos < cmd.length ) {
          var command = cmd.get_char();
          lastSerial = cmd.get_32();

          if ( Commands[command] ) {
            Commands[command](cmd);
          } else {
            console.warn('Unknown op ' + command);
          }
        }

        return true;
      }

      ws.onmessage = function(ev) {
        var message = ev.data;
        var cmd = new BinCommands(message);
        outstandingCommands.push(cmd);

        if ( outstandingCommands.length === 1 ) {
          while ( outstandingCommands.length > 0 ) {
            var cmd = outstandingCommands.shift();
            if ( !handleCommands(cmd) ) {
              outstandingCommands.unshift(cmd);
              return;
            }
          }
        }
      };
    },

    /**
     * Disconnects the Broadway connection
     *
     * @function disconnect
     * @memberof OSjs.Broadway.GTK
     */
    disconnect:  function() {
      if ( ws ) {
        ws.close();
      }
      ws = null;
    },

    /**
     * Sends a notification to move a window
     *
     * @param {Number}  id      Window ID
     * @param {Number}  x       X Position
     * @param {Number}  y       Y Position
     *
     * @function move
     * @memberof OSjs.Broadway.GTK
     */
    move: function(id, x, y) {
      if ( surfaces[id] ) {
        var surface = surfaces[id];
        surface.x = x;
        surface.y = y;
        sendConfigureNotify(surface);
      }
    },

    /**
     * Sends a notification to close a window
     *
     * @param {Number}  id      Window ID
     *
     * @function close
     * @memberof OSjs.Broadway.GTK
     */
    close: function(id) {
      if ( surfaces[id] ) {
        sendInput('W', [id]);
      }
    },

    /**
     * Sends a raw input
     *
     * @param {String}    cmd     Command name
     * @param {Array}     args    Command arguments
     *
     * @function send
     * @memberof OSjs.Broadway.GTK
     */
    send: function(cmd, args) {
      sendInput(cmd, args);
    },

    /**
     * Injects an event into Broadway Window
     *
     * @param {Number}  id      Window ID
     * @param {String}  type    Event Type
     * @param {Event}   ev      Event
     * @param {Object}  [opts]  Options
     *
     * @function inject
     * @memberof OSjs.Broadway.GTK
     */
    inject: function(id, type, ev, opts) {
      if ( type === 'resize' ) {
        sendInput('d', [opts.width, opts.height]);
        return;
      } else if ( type === 'blur' ) {
        // TODO: Find some way to hide open menus etc
        return;
      }

      var surface = surfaces[id];
      if ( surface ) {
        var cid = getLayer(ev, id);
        var relx = -1;
        var rely = -1;
        var mx = -1;
        var my = -1;

        if ( opts ) {
          var tsurface = surfaces[cid] || surface;

          mx = opts.mx - tsurface.xOff;
          my = opts.my - tsurface.yOff;

          relx = tsurface.x + mx;
          rely = tsurface.y + my;
        }

        if ( Input[type] ) {
          Input[type](id, cid, ev, relx, rely, mx, my);
        }
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @namespace GTK
   * @memberof OSjs.Broadway
   */
  OSjs.Broadway.GTK = Broadway;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.GUI, OSjs.API);
