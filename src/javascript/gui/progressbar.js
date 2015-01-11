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
   * ProgressBar Element
   *
   * @param String    name        Name of GUIElement (unique)
   * @param int       percentage  Start at this value
   *
   * @api OSjs.GUI.ProgressBar
   * @see OSjs.GUI.GUIElement
   *
   * @class
   */
  var ProgressBar = function(name, percentage) {
    this.$container = null;
    this.$bar       = null;
    this.$label     = null;
    this.percentage = percentage || 0;

    GUIElement.apply(this, [name, {}]);
  };

  ProgressBar.prototype = Object.create(GUIElement.prototype);

  ProgressBar.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIProgressBar']);

    this.$container           = document.createElement('div');
    this.$container.className = 'Container';

    this.$bar           = document.createElement('div');
    this.$bar.className = 'Bar';
    this.$container.appendChild(this.$bar);

    this.$label           = document.createElement('div');
    this.$label.className = 'Label';
    this.$container.appendChild(this.$label);

    el.appendChild(this.$container);

    this.setPercentage(this.percentage);
    return el;
  };

  ProgressBar.prototype.setPercentage = function(p) {
    if ( p < 0 || p > 100 ) { return; }
    this.percentage       = parseInt(p, 10);
    this.$bar.style.width = this.percentage + '%';
    this.$label.innerHTML = this.percentage + '%';
  };

  ProgressBar.prototype.setProgress = function(p) {
    this.setPercentage(p);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.ProgressBar  = ProgressBar;

})(OSjs.GUI.GUIElement);
