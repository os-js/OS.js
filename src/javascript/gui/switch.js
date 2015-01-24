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
(function(GUIElement, _Input, Checkbox) {
  'use strict';

  /**
   * Switch
   *
   * A toggle button that behaves like a checkbox (much like on Android and iOS)
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @see OSjs.GUI._Input
   * @see OSjs.GUI.Checkbox
   * @api OSjs.GUI.Switch
   *
   * @extends Checkbox
   * @class
   */
  var Switch = function(name, opts) {
    opts        = opts || {};
    opts.type   = 'checkbox';

    this.$overlay = null;

    _Input.apply(this, ['GUISwitch', 'input', name, opts]);
  };
  Switch.prototype = Object.create(Checkbox.prototype);

  Switch.prototype.init = function() {
    var self = this;
    var el = Checkbox.prototype.init.apply(this, [this.className]);

    this.$overlay = document.createElement('div');
    this.$overlay.className = 'Overlay';

    this._addEventListener(this.$overlay, 'click', function(ev) {
      if ( self.isDisabled() ) { return; }
      self.setValue(!self.getValue());
    });

    el.appendChild(this.$overlay);
    return el;
  };

  Switch.prototype.destroy = function() {
    var res = Checkbox.prototype.destroy.apply(this, arguments);
    this.$overlay = null;
    return res;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Switch        = Switch;

})(OSjs.Core.GUIElement, OSjs.GUI._Input, OSjs.GUI.Checkbox);
