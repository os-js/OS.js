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
 * Splash Screen Class
 * @desc Builds the splash screen
 */
class SplashScreen {

  constructor() {
    this.$el = document.getElementById('LoadingScreen');
    this.$progress = this.$el ? this.$el.querySelector('.progress') : null;
  }

  /**
   * Applies the watermark
   * @param {Object} config Configuration tree
   */
  watermark(config) {
    if ( config.Watermark.enabled ) {
      var ver = config.Version || 'unknown version';
      var html = config.Watermark.lines || [];

      var el = document.createElement('osjs-watermark');
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = html.join('<br />').replace(/%VERSION%/, ver);

      document.body.appendChild(el);
    }
  }

  /**
   * Show the splash
   */
  show() {
    if ( this.$el ) {
      this.$el.style.display = 'block';
    }
  }

  /**
   * Hide the splash
   */
  hide() {
    if ( this.$el ) {
      this.$el.style.display = 'none';
    }
  }

  /**
   * Update the splash
   * @param {Number}  p       Step x of...
   * @param {Number}  c       ... y
   */
  update(p, c) {
    if ( this.$progress ) {
      let per = c ? 0 : 100;
      if ( c ) {
        per = (p / c) * 100;
      }

      this.$progress.style.width = String(per) + '%';
    }
  }

}

export default (new SplashScreen());
