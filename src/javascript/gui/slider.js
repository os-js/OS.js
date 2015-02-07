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
(function(GUIElement) {
  'use strict';

  /**
   * Slider Element
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @option  opts  int       min           Minimum value
   * @option  opts  int       max           Maximum value
   * @option  opts  int       val           Current value (alias=value)
   * @option  opts  String    orientation   Orientation (default=horizontal)
   * @option  opts  int       steps         Stepping value (default=1)
   * @option  opts  Function  onChange      On Change (after change) callback => fn(val, percentage)
   * @option  opts  Function  onUpdate      Same as above
   *
   * @see OSjs.Core.GUIElement
   * @api OSjs.GUI.Slider
   *
   * @extends GUIElement
   * @class
   */
  var Slider = function(name, opts) {
    opts = opts || {};

    this.min      = opts.min          || 0;
    this.max      = opts.max          || 0;
    this.val      = opts.val          || opts.value || 0;
    this.perc     = 0;
    this.type     = opts.orientation  || 'horizontal';
    this.steps    = opts.steps        || 1;
    this.onChange = opts.onChange     || function() {};
    this.onUpdate = opts.onUpdate     || function() {};
    this.$root    = null;
    this.$button  = null;

    GUIElement.apply(this, [name, {}]);
  };

  Slider.prototype = Object.create(GUIElement.prototype);

  /**
   * When GUIElement is inited
   */
  Slider.prototype.init = function() {
    var self = this;

    var el        = GUIElement.prototype.init.apply(this, ['GUISlider']);
    el.className += ' ' + this.type;

    this.$root             = document.createElement('div');
    this.$root.className   = 'Root';
    this.$button           = document.createElement('div');
    this.$button.className = 'Button';

    el.appendChild(this.$root);
    el.appendChild(this.$button);

    this._addEventListener(this.$button, 'mousedown', function(ev) {
      return self._onMouseDown(ev);
    });

    this._addEventListener(this.$root, 'click', function(ev) {
      if ( ev.target && ev.target.className === 'Button' ) { return; }
      return self._onSliderClick(ev);
    });

    return el;
  };

  /**
   * When GUIElement has rendered
   */
  Slider.prototype.update = function(force) {
    if ( !force && this.inited ) { return; }
    GUIElement.prototype.update.apply(this, arguments);

    this.setValue(this.val, false, true);
  };

  /**
   * When user clicks/drags button
   */
  Slider.prototype._onMouseDown = function(ev) {
    var self = this;
    if ( !this.inited ) { return; }

    ev.preventDefault();

    var newX = null;
    var newY = null;

    var mouseStart = {x: ev.clientX, y: ev.clientY};
    var mouseDiff  = {x: 0, y: 0};
    var elPos      = {x: this.$button.offsetLeft, y: this.$button.offsetTop};
    var moved      = false;

    function _onMouseMove(evt) {
      evt.preventDefault();

      moved = true;

      if ( self.type === 'horizontal' ) {
        mouseDiff.x = evt.clientX - mouseStart.x;
        newX = elPos.x + mouseDiff.x;
      } else {
        mouseDiff.y = evt.clientY - mouseStart.y;
        newY = elPos.y + mouseDiff.y;
      }

      self._onSliderMove(evt, newX, newY);

      return false;
    }

    function _onMouseUp(evt) {
      if ( moved ) {
        self.onChange.call(self, self.val, self.perc, evt);
        self.onUpdate.call(self, self.val, self.perc, evt);
      }
      document.removeEventListener('mousemove', _onMouseMove, false);
      document.removeEventListener('mouseup', _onMouseUp, false);
    }

    document.addEventListener('mousemove', _onMouseMove, false);
    document.addEventListener('mouseup', _onMouseUp, false);

    return false;
  };

  /**
   * When user slides the button
   */
  Slider.prototype._onSliderMove = function(ev, newX, newY, ignoreEvent, ignoreValue) {
    if ( !this.inited ) { return; }
    if ( newX === null && newY === null ) { return; }

    var maxPos = {x: (this.$element.offsetWidth  - this.$button.offsetWidth), y: (this.$element.offsetHeight - this.$button.offsetHeight)};
    var snapping = 0;
    var perc;

    if ( this.steps > 0 ) {
      if ( this.type === 'horizontal' ) {
        snapping  = (maxPos.x / ((this.max - this.min) / this.steps));
      } else {
        snapping  = (maxPos.y / ((this.max - this.min) / this.steps));
      }
    }

    if ( newX !== null ) {
      if ( newX < 0 ) { newX = 0; }
      if ( newX > maxPos.x ) { newX = maxPos.x; }
      if ( snapping > 0.0 ) {
        newX = snapping * Math.round(newX / snapping);
      }

      this.$button.style.left = parseInt(newX, 10).toString() + 'px';
      perc = (newX/(maxPos.x)) * 100;
    }

    if ( newY !== null ) {
      if ( newY < 0 ) { newY = 0; }
      if ( newY > maxPos.y ) { newY = maxPos.y; }
      if ( snapping > 0.0 ) {
        newY = snapping * Math.round(newY / snapping);
      }
      this.$button.style.top = parseInt(newY, 10).toString() + 'px';
      perc = 100 - ((newY/maxPos.y) * 100);
    }

    if ( !ignoreValue ) {
      var tmp = (this.max - this.min) / 100;
      var val = perc * tmp;

      if ( this.steps > 0 ) {
        // Kudos to jQuery UI here. I was having some trouble with this one
        var valModStep = (val - this.min) % this.steps;
        var alignValue = val - valModStep;
        if ( Math.abs(valModStep) * 2 >= this.steps ) {
          alignValue += ( valModStep > 0 ) ? this.steps : ( -this.steps );
        }
        val = alignValue;
      }

      if ( !isNaN(val) ) {
        this.setValue(val, true);
      }
    }

    if ( !ignoreEvent ) {
      this.onChange.call(this, this.val, this.perc, ev);
      this.onUpdate.call(this, this.val, this.perc, ev);
    }
  };

  /**
   * When user clicks on slider
   */
  Slider.prototype._onSliderClick = function(ev) {
    if ( !this.inited ) { return; }
    var newX = null;
    var newY = null;
    var p = OSjs.Utils.$position(this.$root);

    if ( this.type === 'horizontal' ) {
      newX = ev.clientX - p.left - (this.$button.offsetWidth/2);
    } else {
      newY = ev.clientY - p.top - (this.$button.offsetHeight/2);
    }

    this._onSliderMove(ev, newX, newY);

    return true;
  };

  /**
   * Set the value of slider
   *
   * @param   int     val     The value
   *
   * @return  void
   *
   * @method  Slider::setValue()
   */
  Slider.prototype.setValue = function(val, internalEvent, ignoreUpdate) {
    if ( val < this.min || val > this.max ) { return; }
    var tmp = (this.max - this.min);
    this.val = val;
    this.perc = (this.val / tmp) * 100;

    if ( !internalEvent ) {
      var newX = null;
      var newY = null;

      if ( this.type === 'horizontal' ) {
        newX = ((this.$root.offsetWidth-this.$button.offsetWidth) / 100) * this.perc;
      } else {
        var tmp2 = (this.$root.offsetHeight-this.$button.offsetHeight);
        newY = tmp2 - ((tmp2 / 100) * this.perc);
      }

      this._onSliderMove(null, newX, newY, true, true);
    }

    if ( !ignoreUpdate ) {
      this.onChange.call(this, this.val, this.perc, null);
      this.onUpdate.call(this, this.val, this.perc, null);
    }

    if ( this.$root ) {
      this.$root.setAttribute('data-percentage', this.perc.toString());
      this.$root.setAttribute('data-value', this.val.toString());
    }
  };

  /**
   * Get the value
   *
   * @return int
   *
   * @method Slider::getValue()
   */
  Slider.prototype.getValue = function() {
    return this.val;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Slider       = Slider;

})(OSjs.Core.GUIElement);
