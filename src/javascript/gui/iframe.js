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
   * An IFrame intended for frame applications
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @option opts String    src           HREF to load
   * @option opts int       width         Static width (optional in px)
   * @option opts int       height        Static height (optional in px)
   * @option opts Function  onFocus       When frame gets focused callback (optional)
   * @option opts Function  onBlur        When frame gets blurred callback (optional)
   *
   * @see OSjs.Core.GUIElement
   * @api OSjs.GUI.IFrame
   *
   * @extends GUIElement
   * @class
   */
  var IFrame = function(name, opts, cb) {
    opts = opts || {};
    opts.src = opts.src || 'about:blank';
    opts.isIframe = true;
    opts.width = opts.width || null;
    opts.height = opts.height || null;
    opts.onFocus = opts.onFocus || function() {};
    opts.onBlur = opts.onBlur || function() {};

    this.frameCallback = cb || function() {};
    this.frameWindow = null;
    this.frame = null;

    GUIElement.apply(this, [name, opts]);
  };

  IFrame.prototype = Object.create(GUIElement.prototype);

  IFrame.prototype.init = function() {
    var self = this;
    var el = GUIElement.prototype.init.apply(this, ['GUIIFrame']);
    this.frame = document.createElement('iframe');

    el.style.width = this.opts.width ? this.opts.width + 'px' : '100%';
    el.style.height = this.opts.height ? this.opts.height + 'px' : '100%';

    this.frame.style.width = this.opts.width ? this.opts.width + 'px' : '100%';
    this.frame.style.height = this.opts.height ? this.opts.height + 'px' : '100%';
    this.frame.style.border = '0 none';
    this.frame.frameborder = '0';
    this.frame.onload = function() {
      self.frameWindow = self.frame.contentWindow;
      self.frameCallback(self.frameWindow, self.frame);
    };
    this.frame.src = this.opts.src;
    el.appendChild(this.frame);
    return el;
  };

  IFrame.prototype.update = function() {
    var self = this;
    var win = this._window;
    if ( win ) {
      win._addHook('focus', function() {
        self.focus();
      });
      win._addHook('blur', function() {
        self.blur();
      });
    }
  };

  IFrame.prototype.blur = function() {
    if ( !GUIElement.prototype.blur.apply(this, arguments) ) { return false; }
    if ( this.frameWindow ) {
      this.frameWindow.blur();
    }
    if ( this.frame ) {
      this.frame.blur();
    }
    this.opts.onBlur(this.frameWindow, this.frame);
    return true;
  };

  IFrame.prototype.focus = function() {
    if ( !GUIElement.prototype.focus.apply(this, arguments) ) { return false; }
    if ( this.frameWindow ) {
      this.frameWindow.focus();
    }
    if ( this.frame ) {
      this.frame.focus();
    }
    this.opts.onFocus(this.frameWindow, this.frame);
    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.IFrame     = IFrame;

})(OSjs.Core.GUIElement);
