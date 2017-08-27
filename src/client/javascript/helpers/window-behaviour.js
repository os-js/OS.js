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
import * as DOM from 'utils/dom';
import * as Events from 'utils/events';
import Theme from 'core/theme';

/*
 * Holds information about current behaviour
 */
class BehaviourState {
  constructor(wm, win, action, mousePosition) {
    this.win = win;
    this.$element = win._$element;
    this.$top = win._$top;
    this.$handle = win._$resize;

    this.rectWorkspace  = wm.getWindowSpace(true);
    this.rectWindow     = {
      x: win._position.x,
      y: win._position.y,
      w: win._dimension.w,
      h: win._dimension.h,
      r: win._dimension.w + win._position.x,
      b: win._dimension.h + win._position.y
    };

    const theme = Object.assign({}, Theme.getStyleTheme(true, true));
    if ( !theme.style ) {
      theme.style = {'window': {margin: 0, border: 0}};
    }

    this.theme = {
      topMargin: theme.style.window.margin || 0, // FIXME
      borderSize: theme.style.window.border || 0
    };

    this.snapping   = {
      cornerSize: wm.getSetting('windowCornerSnap') || 0,
      windowSize: wm.getSetting('windowSnap') || 0
    };

    this.action     = action;
    this.moved      = false;
    this.direction  = null;
    this.startX     = mousePosition.x;
    this.startY     = mousePosition.y;
    this.minWidth   = win._properties.min_width;
    this.minHeight  = win._properties.min_height;

    const windowRects = [];
    wm.getWindows().forEach((w) => {
      if ( w && w._wid !== win._wid ) {
        const pos = w._position;
        const dim = w._dimension;
        const rect = {
          left: pos.x - this.theme.borderSize,
          top: pos.y - this.theme.borderSize,
          width: dim.w + (this.theme.borderSize * 2),
          height: dim.h + (this.theme.borderSize * 2) + this.theme.topMargin
        };

        rect.right = rect.left + rect.width;
        rect.bottom = (pos.y + dim.h) + this.theme.topMargin + this.theme.borderSize;//rect.top + rect.height;

        windowRects.push(rect);
      }
    });

    this.snapRects = windowRects;
  }

  getRect() {
    const win = this.win;

    return {
      left: win._position.x,
      top: win._position.y,
      width: win._dimension.w,
      height: win._dimension.h
    };
  }

  calculateDirection() {
    const dir = DOM.$position(this.$handle);
    const dirX = this.startX - dir.left;
    const dirY = this.startY - dir.top;
    const dirD = 20;

    const checks = {
      nw: (dirX <= dirD) && (dirY <= dirD),
      n: (dirX > dirD) && (dirY <= dirD),
      w: (dirX <= dirD) && (dirY >= dirD),
      ne: (dirX >= (dir.width - dirD)) && (dirY <= dirD),
      e: (dirX >= (dir.width - dirD)) && (dirY > dirD),
      se: (dirX >= (dir.width - dirD)) && (dirY >= (dir.height - dirD)),
      sw: (dirX <= dirD) && (dirY >= (dir.height - dirD))
    };

    let direction = 's';
    Object.keys(checks).forEach(function(k) {
      if ( checks[k] ) {
        direction = k;
      }
    });

    this.direction = direction;
  }
}

/*
 * Window Behavour Abstraction
 */
export function createWindowBehaviour(win, wm) {
  let current = null;
  let newRect = {};

  /*
   * Resizing action
   */
  function onWindowResize(ev, mousePosition, dx, dy) {
    if ( !current || !current.direction ) {
      return false;
    }

    let nw, nh, nl, nt;

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

  /*
   * Movement action
   */
  function onWindowMove(ev, mousePosition, dx, dy) {
    let newWidth = null;
    let newHeight = null;
    let newLeft = current.rectWindow.x + dx;
    let newTop = current.rectWindow.y + dy;

    const borderSize = current.theme.borderSize;
    const topMargin = current.theme.topMargin;
    const cornerSnapSize = current.snapping.cornerSize;
    const windowSnapSize = current.snapping.windowSize;

    if ( newTop < current.rectWorkspace.top ) {
      newTop = current.rectWorkspace.top;
    }

    let newRight = newLeft + current.rectWindow.w + (borderSize * 2);
    let newBottom = newTop + current.rectWindow.h + topMargin + (borderSize);

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

  /*
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
    document.body.setAttribute('data-window-hint', '');

    win._emit('postop');

    current = null;
  }

  /*
   * When mouse is moved
   */
  function onMouseMove(ev, action, win, mousePosition) {
    if ( !wm.getMouseLocked() || !action || !current ) {
      return;
    }

    ev.preventDefault();

    let result;

    const dx = mousePosition.x - current.startX;
    const dy = mousePosition.y - current.startY;

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

  /*
   * When mouse button is pressed
   */
  function onMouseDown(ev, action, win, mousePosition) {
    ev.preventDefault();

    if ( win._state.maximized ) {
      return;
    }

    current = new BehaviourState(wm, win, action, mousePosition);
    newRect = {};

    win._focus();

    if ( action === 'move' ) {
      current.$element.setAttribute('data-hint', 'moving');
      document.body.setAttribute('data-window-hint', 'moving');
    } else {
      current.calculateDirection();
      current.$element.setAttribute('data-hint', 'resizing');
      document.body.setAttribute('data-window-hint', 'resizing');

      newRect = current.getRect();
    }

    win._emit('preop');

    function _onMouseMove(ev, pos) {
      ev.preventDefault();
      if ( wm._mouselock ) {
        onMouseMove(ev, action, win, pos);
      }
    }
    function _onMouseUp(ev, pos) {
      onMouseUp(ev, action, win, pos);
      Events.$unbind(document, 'pointermove:movewindow,touchmove:movewindowTouch');
      Events.$unbind(document, 'pointerup:movewindowstop,touchend:movewindowstopTouch');
    }

    Events.$bind(document, 'pointermove:movewindow,touchmove:movewindowTouch', _onMouseMove, false);
    Events.$bind(document, 'pointerup:movewindowstop,touchend:movewindowstopTouch', _onMouseUp, false);
  }

  /*
   * Register a window
   */
  if ( win._properties.allow_move ) {
    Events.$bind(win._$top, 'pointerdown,touchstart', (ev, pos) => {
      ev.preventDefault();
      if ( !win._destroyed ) {
        onMouseDown(ev, 'move', win, pos);
      }
    }, true);
  }
  if ( win._properties.allow_resize ) {
    Events.$bind(win._$resize, 'pointerdown,touchstart', (ev, pos) => {
      ev.preventDefault();
      if ( !win._destroyed ) {
        onMouseDown(ev, 'resize', win, pos);
      }
    });
  }
}
