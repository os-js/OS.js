/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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
(function(GUIElement, _Input) {
  "use strict";

  /**
   * Text
   *
   * options: (See _Input for more)
   *  type      String        Input text type (Default = text)
   */
  var Text = function(name, opts) {
    opts            = opts || {};
    opts.type       = opts.type || 'text';

    _Input.apply(this, ['GUIText', 'input', name, opts]);
  };
  Text.prototype = Object.create(_Input.prototype);

  Text.prototype.select = function(range) {
    if ( this.$input ) {
      if ( range ) {
        try {
          if ( typeof range !== 'object' ) { range = {}; }
          if ( typeof range.min === 'undefined' || !range.min) { range.min = 0; }
          if ( typeof range.max === 'undefined' || !range.max || range.max < range.min ) { range.max = this.getValue().length - 1; }
          OSjs.Utils.$selectRange(this.$input, range.min, range.max);
        } catch ( e ) {
          console.warn("OSjs::GUI::Text::select()", "exception", e);
          this.$input.select();
        }
      } else {
        this.$input.select();
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Text         = Text;

})(OSjs.GUI.GUIElement, OSjs.GUI._Input);
