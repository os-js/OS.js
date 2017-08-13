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

/*eslint valid-jsdoc: "off"*/
import Translations from './locales';

const _ = OSjs.require('core/locales').createLocalizer(Translations);
const Menu = OSjs.require('gui/menu');
const DOM = OSjs.require('utils/dom');
const Utils = OSjs.require('utils/misc');
const Events = OSjs.require('utils/events');
const WindowManager = OSjs.require('core/window-manager');

/////////////////////////////////////////////////////////////////////////////
// DEFAULTS
/////////////////////////////////////////////////////////////////////////////

const MIN_WIDTH = 64;
const MIN_HEIGHT = 64;

const TIMEOUT_SAVE = 500;
const TIMEOUT_SHOW_ENVELOPE = 3000;
const TIMEOUT_HIDE_ENVELOPE = 1000;

const DEFAULT_OPTIONS = {
  aspect: false, // true for automatic aspect based on width
  width: 100,
  height: 100,
  minWidth: MIN_WIDTH,
  minHeight: MIN_HEIGHT,
  maxHeight: 500,
  maxWidth: 500,
  left: 0,
  right: null,
  top: 0,
  bottom: null,
  locked: false,
  canvas: false,
  resizable: false,
  viewBox: false, // x y w h or 'true'
  frequency: 2, // FPS for canvas
  custom: {
    // Used for widget-spesific styles etc
  },
  settings: {
    enabled: false,
    name: 'CoreWMWidgetSettingsWindow',
    title: _('LBL_SETTINGS'),
    width: 300,
    height: 300
  }
};

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

function bindWidgetEvents(instance) {
  var timeout = null;
  var position = instance._getNormalizedPosition();
  var dimension = instance._getDimension();
  var start = {x: 0, y: 0};

  function _getDimensionAspected(dx, dy) {
    if ( instance._options.aspect === true ) {
      var width = dimension.width + dx;
      var height = width / instance._aspect;
      return {width: width, height: height};
    }

    return {
      width: dimension.width + dx,
      height: dimension.height + dy
    };
  }

  function _mouseDown(ev, pos, action) {
    ev.preventDefault();
    if ( instance._locked ) {
      return;
    }

    timeout = clearTimeout(timeout);
    start = pos;
    position = instance._getNormalizedPosition();
    dimension = instance._getDimension();

    Events.$bind(window, 'mousemove:modifywidget', function(ev, pos) {
      var dx = pos.x - start.x;
      var dy = pos.y - start.y;
      var obj = action === 'move' ? {
        left: position.left + dx,
        top: position.top + dy
      } : _getDimensionAspected(dx, dy);

      instance._onMouseMove(ev, obj, action);
    });

    Events.$bind(window, 'mouseup:modifywidget', function(ev, pos) {
      Events.$unbind(window, 'mousemove:modifywidget');
      Events.$unbind(window, 'mouseup:modifywidget');

      instance._onMouseUp(ev, pos, action);
    });

    instance._windowWidth = window.innerWidth;
    instance._windowHeight = window.innerHeight;
    instance._onMouseDown(ev, pos, action);
  }

  Events.$bind(instance._$element, 'mousedown:movewidget', function(ev, pos) {
    _mouseDown(ev, pos, 'move');
  });
  Events.$bind(instance._$resize, 'mousedown:resizewidget', function(ev, pos) {
    ev.stopPropagation();
    _mouseDown(ev, pos, 'resize');
  });

  Events.$bind(instance._$element, 'click:showenvelope', function(ev) {
    timeout = clearTimeout(timeout);
    instance._showEnvelope();
  });
  Events.$bind(instance._$element, 'mouseover:showenvelope', function() {
    timeout = clearTimeout(timeout);
    timeout = setTimeout(function() {
      instance._showEnvelope();
    }, TIMEOUT_SHOW_ENVELOPE);
  });
  Events.$bind(instance._$element, 'mouseout:hideenvelope', function(ev) {
    timeout = clearTimeout(timeout);
    timeout = setTimeout(function() {
      instance._hideEnvelope();
    }, TIMEOUT_HIDE_ENVELOPE);
  });

  Events.$bind(instance._$element, 'contextmenu:widgetcontext', function(ev) {
    instance._onContextMenu(ev);
  });
}

function validNumber(num) {
  if ( typeof num !== 'undefined' && num !== null ) {
    return !isNaN(num);
  }
  return false;
}

/////////////////////////////////////////////////////////////////////////////
// WIDGET
/////////////////////////////////////////////////////////////////////////////

export default class Widget {
  /**
   * A CoreWM Widget
   *
   * TODO: Behave according to orientation
   *
   * @param   {String}             name      Widget Name
   * @param   {Object}             options   Widget Options
   * @param   {SettingsFragment}   settings  SettingsFragment instance
   */
  constructor(name, options, settings) {
    options = Utils.mergeObject(Utils.cloneObject(DEFAULT_OPTIONS), options || {});

    this._aspect = options.aspect === true ? options.width / options.height : (typeof options.aspect === 'number' ? options.aspect : 1.0);
    if ( options.aspect !== false ) {
      options.minHeight = options.width / this._aspect;
      options.maxHeight = options.maxWidth / this._aspect;
    }

    if ( options.viewBox ) {
      options.resizable = true;
      if ( options.viewBox === true ) {
        options.viewBox = '0 0 ' + options.width + ' ' + options.height;
      }
    }

    this._position = {
      left: settings.get('left', options.left),
      top: settings.get('top', options.top),
      right: settings.get('right', options.right),
      bottom: settings.get('bottom', options.bottom)
    };

    this._dimension = {
      height: settings.get('height', options.height),
      width: settings.get('width', options.width)
    };

    this._name = name;
    this._settings = settings;
    this._options = options;
    this._isManipulating = false;
    this._windowWidth = window.innerWidth;
    this._windowHeight = window.innerHeight;
    this._requestId = null;
    this._saveTimeout = null;
    this._settingsWindow = null;
    this._locked = settings.get('locked', false);

    this._$element = null;
    this._$resize = null;
    this._$canvas = null;
    this._$context = null;

    Utils.mergeObject(this._options.settings, settings.get('settings', {}));

    console.debug('Widget::construct()', this._name, this._settings.get());
  }

  /**
   * When Widget is initialized
   *
   * @param {Node}      root          The DOM Node to append Widget to
   *
   * @return {Node}                   The created DOM Node containing Widget
   */
  init(root) {
    this._windowWidth = window.innerWidth;
    this._windowHeight = window.innerHeight;
    this._$element = document.createElement('corewm-widget');
    this._$resize = document.createElement('corewm-widget-resize');

    if ( this._options.canvas ) {
      this._$canvas = document.createElement('canvas');

      if ( this._options.viewBox ) {
        this._$canvas.setAttribute('viewBox', this._options.viewBox);
      }

      this._$context = this._$canvas.getContext('2d');
      this._$element.appendChild(this._$canvas);
    }

    bindWidgetEvents(this);

    this._updatePosition();
    this._updateDimension();
    this._setLock(this._locked);

    DOM.$addClass(this._$element, 'Widget' + this._name);
    this._$element.appendChild(this._$resize);
    root.appendChild(this._$element);

    return this._$element;
  }

  /**
   * When widget has been rendered to DOM and added in WindowManager
   */
  _inited() {
    this.onInited();
    this.onResize(this._dimension);

    var fpsInterval, now, then, elapsed;

    const animate = () => {
      window.requestAnimationFrame(animate);

      now = Date.now();
      elapsed = now - then;

      if ( elapsed > fpsInterval ) {
        then = now - (elapsed % fpsInterval);
        this.onRender();
      }
    };

    if ( this._$canvas ) {
      var fps = Math.min(this._options.frequency, 1);

      this._requestId = window.requestAnimationFrame(function() {
        fpsInterval = 1000 / fps;
        then = Date.now();

        animate();
      });
    }
  }

  /**
   * When WindowManager requests destruction of Widget
   */
  destroy() {
    Events.$unbind(window, 'mousemove:modifywidget');
    Events.$unbind(window, 'mouseup:modifywidget');
    Events.$unbind(this._$resize, 'mousedown:resizewidget');
    Events.$unbind(this._$element, 'mousedown:movewidget');
    Events.$unbind(this._$element, 'click:showenvelope');
    Events.$unbind(this._$element, 'mouseover:showenvelope');
    Events.$unbind(this._$element, 'mouseout:hideenvelope');
    Events.$unbind(this._$element, 'contextmenu:widgetcontext');

    this._saveTimeout = clearTimeout(this._saveTimeout);

    if ( this._requestId ) {
      window.cancelAnimationFrame(this._requestId);
    }
    this._requestId = null;

    if ( this._settingsWindow ) {
      this._settingsWindow.destroy();
    }
    this._settingsWindow = null;

    this._$canvas = DOM.$remove(this._$canvas);
    this._$resize = DOM.$remove(this._$resize);
    this._$element = DOM.$remove(this._$element);
    this._$context = null;
  }

  /**
   * Blurs the widget if active
   */
  blur() {
  }

  /**
   * When mouse is pressed
   */
  _onMouseDown(ev, pos, action) {
    this._saveTimeout = clearTimeout(this._saveTimeout);

    DOM.$addClass(this._$element, 'corewm-widget-active');

    // This temporarily sets the position to a normalized one
    // to prevent resizing going in wrong direction
    if ( action === 'resize' ) {
      var obj = this._getNormalizedPosition();
      this._setPosition(obj);
    }
  }

  /**
   * When mouse is moved after pressing
   */
  _onMouseMove(ev, obj, action) {
    this._isManipulating = true;

    if ( action === 'move' ) {
      this._setPosition(obj, true);
      this.onMove(this._position);
    } else {
      this._setDimension(obj);
      this.onResize(this._dimension);
    }
  }

  /**
   * When mouse has been released
   */
  _onMouseUp(ev, pos, action) {
    this._isManipulating = false;
    this._resizeTimeout = clearTimeout(this._resizeTimeout);

    DOM.$removeClass(this._$element, 'corewm-widget-active');

    this._hideEnvelope();

    // This resets the position back to an absolute one
    // after it was temporarily set in onMouseDown
    if ( action === 'resize' ) {
      this._setPosition(null, true);
    }

    this._saveTimeout = clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => {
      this._saveOptions();
    }, TIMEOUT_SAVE);
  }

  /**
   * When right mouse button is pressed
   */
  _onContextMenu(ev) {
    var c = this.onContextMenu(ev);

    var menu = [{
      title: this._locked ? _('LBL_UNLOCK') : _('LBL_LOCK'),
      onClick: () => {
        this._setLock();
        this._saveOptions();
      }
    }];

    if ( c !== true ) {
      if ( c instanceof Array ) {
        menu = c.concat(menu);
      }

      if ( this._options.settings.enabled ) {
        menu.push({
          title: _('Open {0} Settings', _(this._name)),
          onClick: (ev) => {
            this._openSettings(ev);
          }
        });
      }
    }

    Menu.create(menu, ev);
  }

  /**
   * Saves this Widgets options to CoreWM
   */
  _saveOptions(custom) {
    if ( typeof custom !== 'undefined' ) {
      this._options.settings.tree = custom;
    }

    var opts = {
      width: this._dimension.width,
      height: this._dimension.height,
      right: this._position.right,
      left: validNumber(this._position.right) ? null : this._position.left,
      bottom: this._position.bottom,
      top: validNumber(this._position.bottom) ? null : this._position.top,
      locked: this._locked,
      settings: {
        tree: this._options.settings.tree
      }
    };

    this._settings.set(null, opts, true);
  }

  /**
   * Show settings dialog
   */
  _openSettings(ev) {
    if ( this._settingsWindow ) {
      this._settingsWindow._focus();
      return;
    }

    var wm = WindowManager.instance;
    var win = new Window(this._options.settings.name, {
      title: this._options.settings.title,
      width: this._options.settings.width,
      height: this._options.settings.height
    }, null, wm._scheme);

    win._on('init', (root, scheme) => {
      var opts = this.onOpenSettings(root, scheme, ev);

      win._render(opts.id);

      win._find('ButtonOK').on('click', () => {
        var settings = opts.save(root, scheme, ev);
        this._saveOptions(settings);
      });

      opts.render(root, scheme, ev);
    });

    win._on('close', () => {
      this._settingsWindow = null;
    });

    this._settingsWindow = wm.addWindow(win, true);
  }

  /**
   * Show the envelope containing this Widget
   */
  _showEnvelope() {
    if ( !this._$element ) {
      return;
    }
    DOM.$addClass(this._$element, 'corewm-widget-envelope');
  }

  /**
   * Hide the envelope containing this Widget
   */
  _hideEnvelope() {
    if ( !this._$element || this._isManipulating ) {
      return;
    }
    DOM.$removeClass(this._$element, 'corewm-widget-envelope');
  }

  /**
   * Sets the position and correctly aligns it to the DOM (sticking)
   */
  _setPosition(obj, stick) {
    obj = obj || Utils.cloneObject(this._position);

    this._position.top = obj.top;
    this._position.left = obj.left;
    this._position.bottom = null;
    this._position.right = null;

    if ( stick ) {
      if ( this._isPastHalf('vertical', obj) ) {
        this._position.top = null;
        this._position.bottom = this._windowHeight - this._dimension.height - obj.top;
      }

      if ( this._isPastHalf('horizontal', obj) ) {
        this._position.left = null;
        this._position.right = this._windowWidth - this._dimension.width - obj.left;
      }
    }

    this._updatePosition();
  }

  /**
   * Sets the dimension of the widget
   */
  _setDimension(obj) {
    var o = this._options;
    var w = Math.min(Math.max(obj.width, o.minWidth), o.maxWidth);
    var h = Math.min(Math.max(obj.height, o.minHeight), o.maxHeight);
    if ( this._options.aspect === true ) {
      h = w / this._aspect;
    }

    this._dimension.width = w;
    this._dimension.height = h;

    this._updateDimension();
  }

  /**
   * Lock widget (make unmoveable)
   */
  _setLock(l) {
    if ( typeof l !== 'boolean' ) {
      l = !this._locked;
    }
    this._locked = l;

    if ( this._$element ) {
      this._$element.setAttribute('data-locked', String(this._locked));
    }
  }

  /**
   * Updates the Widgets position based on internal options
   */
  _updatePosition() {
    if ( this._$element ) {
      if ( validNumber(this._position.right) ) {
        this._$element.style.left = 'auto';
        this._$element.style.right = String(this._position.right) + 'px';
      } else {
        this._$element.style.left = String(this._position.left) + 'px';
        this._$element.style.right = 'auto';
      }

      if ( validNumber(this._position.bottom) ) {
        this._$element.style.top = 'auto';
        this._$element.style.bottom = String(this._position.bottom) + 'px';
      } else {
        this._$element.style.top = String(this._position.top) + 'px';
        this._$element.style.bottom = 'auto';
      }
    }
  }

  /**
   * Updates the Widgets dimensions based on internal options
   */
  _updateDimension() {
    if ( this._$element ) {
      this._$element.style.width = String(this._dimension.width) + 'px';
      this._$element.style.height = String(this._dimension.height) + 'px';
    }

    if ( this._$canvas ) {
      this._$canvas.width = this._dimension.width || MIN_WIDTH;
      this._$canvas.height = this._dimension.height || MIN_HEIGHT;
    }
  }

  /**
   * Gets the position of the Widget
   *
   * @return {Object}
   */
  _getNormalizedPosition() {
    var left = this._position.left;
    if ( validNumber(this._position.right) ) {
      left = this._windowWidth - this._position.right - this._dimension.width;
    }

    var top = this._position.top;
    if ( validNumber(this._position.bottom) ) {
      top = this._windowHeight - this._position.bottom - this._dimension.height;
    }

    return {left: left, top: top};
  }

  /**
   * Gets the dimensions
   *
   * @return {Object}
   */
  _getDimension() {
    return {
      width: this._dimension.width,
      height: this._dimension.height
    };
  }

  /**
   * Gets the position
   *
   * @return {Object}
   */
  _getPosition() {
    return {
      left: this._position.left,
      top: this._position.top,
      right: this._position.right,
      bottom: this._position.bottom
    };
  }

  /**
   * Sets a setting
   */
  _setSetting(k, v, save) {
    this._options.settings.tree[k] = v;
    if ( save ) {
      this._saveOptions();
    }
  }

  /**
   * Gets a setting
   */
  _getSetting(k, def) {
    if ( typeof this._options.settings === 'undefined' || typeof this._options.settings.tree === 'undefined' ) {
      return def;
    }

    var value = this._options.settings.tree[k];
    return typeof value === 'undefined' ? def : value;
  }

  /**
   * Check if widget has passed the middle of screen in
   * given direction
   *
   * @return {Boolean}
   */
  _isPastHalf(dir, obj) {
    obj = obj || this._position;

    var hleft = this._windowWidth / 2;
    var aleft = obj.left + (this._dimension.width / 2);
    if ( dir === 'horizontal' ) {
      return aleft >= hleft;
    }

    var htop = this._windowHeight / 2;
    var atop = obj.top + (this._dimension.height / 2);
    return atop >= htop;
  }

  /**
   * When Widget is being moved
   */
  onMove() {
    // Implement in your widget
  }

  /**
   * When Widget is being resized
   */
  onResize() {
    // Implement in your widget
  }

  /**
   * When Widget is being rendered
   */
  onRender() {
    // Implement in your widget
  }

  /**
   * When Widget has been initialized
   */
  onInited() {
    // Implement in your widget
  }

  /**
   * When Widget opens contextmenu
   */
  onContextMenu(ev) {
    // Implement in your widget.
    // You can return true to prevent default context action.
    // Or an array of elements to append to the default menu.
  }

  /**
   * When Widget Settings dialog shows
   */
  onOpenSettings(root, scheme, ev) {
    // Implement in your widget.
    return {
      id: null,
      save: function() {
        return {};
      },
      render: function() {
      }
    };
  }

}
