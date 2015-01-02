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
   * options: (See GUIElement for more)
   *  min             int           Minimum value
   *  max             int           Maximim value
   *  val             int           Current value
   *  orientation     String        Orientation (Default = horizontal)
   *  steps           int           Stepping value (Default = 1)
   *  onChange        Function      Callback - When value has changed (on drag)
   *  onUpdate        Function      Callback - When value is updated (finished)
   */
  var Slider = function(name, opts) {
    this.min      = opts.min          || 0;
    this.max      = opts.max          || 0;
    this.val      = opts.val          || 0;
    this.type     = opts.orientation  || 'horizontal';
    this.steps    = opts.steps        || 1;
    this.onChange = opts.onChange     || function() {};
    this.$root    = null;
    this.$button  = null;

    var self = this;
    this.onUpdate = function(val, perc) {
      (opts.onUpdate || function(val, perc) {
        console.warn('GUIScroll onUpdate() missing...', val, '('+perc+'%)');
      }).apply(self, arguments);
      self.onChange.apply(this, arguments);
    };

    GUIElement.apply(this, [name, {}]);
  };

  Slider.prototype = Object.create(GUIElement.prototype);

  Slider.prototype.init = function() {
    var el        = GUIElement.prototype.init.apply(this, ['GUISlider']);
    el.className += ' ' + this.type;

    this.$root            = document.createElement('div');
    this.$root.className  = 'Root';

    this.$button            = document.createElement('div');
    this.$button.className  = 'Button';

    var scrolling = false;
    var startX    = 0;
    var startY    = 0;
    var elX       = 0;
    var elY       = 0;
    var maxX      = 0;
    var maxY      = 0;
    var snapping  = 0;
    var self      = this;

    function _onMouseMove(ev) {
      if ( !scrolling ) { return; }

      var newX, newY;
      if ( self.type === 'horizontal' ) {
        var diffX = (ev.clientX - startX);
        newX = elX + diffX;
        newX = snapping * Math.round(newX / snapping);

        if ( newX < 0 ) { newX = 0; }
        if ( newX > maxX ) { newX = maxX; }
        self.$button.style.left = newX + 'px';
      } else {
        var diffY = (ev.clientY - startY);
        newY = elY + diffY;
        newY = snapping * Math.round(newY / snapping);

        if ( newY < 0 ) { newY = 0; }
        if ( newY > maxY ) { newY = maxY; }
        self.$button.style.top = newY + 'px';
      }

      self.onSliderUpdate(newX, newY, maxX, maxY, 'mousemove');
    }

    function _onMouseUp(ev) {
      scrolling = false;
      document.removeEventListener('mousemove', _onMouseMove, false);
      document.removeEventListener('mouseup', _onMouseUp, false);

      var p = (self.max / 100) * self.val; //self.val) * 100;
      self.onChange.call(self, self.val, p, 'mouseup');
    }

    function _onMouseDown(ev) {
      ev.preventDefault();

      scrolling = true;
      if ( self.type === 'horizontal' ) {
        startX    = ev.clientX;
        elX       = self.$button.offsetLeft;
        maxX      = self.$element.offsetWidth - self.$button.offsetWidth;
        snapping  = (self.$element.offsetWidth / ((self.max - self.min) / self.steps));
      } else {
        startY    = ev.clientY;
        elY       = self.$button.offsetTop;
        maxY      = self.$element.offsetHeight - self.$button.offsetHeight;
        snapping  = (self.$element.offsetHeight / ((self.max - self.min) / self.steps));
      }

      document.addEventListener('mousemove', _onMouseMove, false);
      document.addEventListener('mouseup', _onMouseUp, false);
    }

    this._addEventListener(this.$button, 'mousedown', function(ev) {
      return _onMouseDown(ev);
    });

    this._addEventListener(el, 'click', function(ev) {
      if ( ev.target && ev.target.className === 'Button' ) { return; }

      var p  = OSjs.Utils.$position(el);
      var cx = ev.clientX - p.left;
      var cy = ev.clientY - p.top;

      self.onSliderClick(ev, cx, cy, (self.$element.offsetWidth - (self.$button.offsetWidth/2)), (self.$element.offsetHeight - (self.$button.offsetHeight/2)), self.$element.offsetHeight, self.$button.offsetHeight);
    });

    el.appendChild(this.$root);
    el.appendChild(this.$button);

    return el;
  };

  Slider.prototype.update = function() {
    GUIElement.prototype.update.apply(this, arguments);
    this.setValue(this.val);
  };

  Slider.prototype.setPercentage = function(p, evt) {
    p = parseInt(p, 10);

    var cd  = (this.max - this.min);
    var val = parseInt(cd*(p/100), 10);
    this.val = val;
    this.onUpdate.call(this, val, p, evt);
  };

  Slider.prototype.onSliderClick = function(ev, cx, cy, tw, th, rh, bh) {
    var cd = (this.max - this.min);
    var tmp;

    if ( this.type === 'horizontal' ) {
      tmp = (cx/tw)*100;
    } else {
      tmp = (rh + (bh/2)) - ((cy/th)*100);
    }

    var val = parseInt(cd*(tmp/100), 10);
    this.setValue(val);
    this.setPercentage(tmp, 'click');
  };

  Slider.prototype.onSliderUpdate = function(x, y, maxX, maxY, evt) {
    var p = null;
    if ( typeof x !== 'undefined' ) {
      p = (x/maxX) * 100;
    } else if ( typeof y !== 'undefined' ) {
      p = 100 - ((y/maxY) * 100);
    }
    if ( p !== null ) {
      this.setPercentage(p, evt);
    }
  };

  Slider.prototype.setValue = function(val) {
    if ( !this.inited ) { return; }

    if ( val < this.min || val > this.max ) { return; }
    this.val = val;

    var cd = (this.max - this.min);
    var cp = this.val / (cd/100);

    if ( this.type === 'horizontal' ) {
      var rw    = this.$element.offsetWidth;
      var bw    = this.$button.offsetWidth;
      var dw    = (rw - bw);
      var left  = (dw/100)*cp;

      this.$button.style.left = left + 'px';
    } else {
      var rh    = this.$element.offsetHeight;
      var bh    = this.$button.offsetHeight;
      var dh    = (rh - bh);
      var top   = (dh/100)*cp;

      top = (rh-bh) - top;

      this.$button.style.top = top + 'px';
    }
  };

  Slider.prototype.getValue = function() {
    return this.val;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Slider       = Slider;

})(OSjs.GUI.GUIElement);
