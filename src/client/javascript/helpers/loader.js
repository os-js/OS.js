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
class Loader {

  constructor() {
    this.loaders = {};
    this.loaderGraze = {};
    this.$container = document.createElement('osjs-loaders');
  }

  /**
   * Create (or show) loading indicator
   *
   * @param   {String}    name          Name of notification (unique)
   * @param   {Object}    opts          Options
   */
  create(name, opts) {
    opts = opts || {};
    if ( !this.$container.parentNode ) {
      document.body.appendChild(this.$container);
    }

    if ( this.loaders[name] ) {
      return;
    }

    const el = document.createElement('osjs-loading');
    el.title = opts.title || '';
    if ( opts.icon ) {
      const img = document.createElement('img');
      img.src = opts.icon;
      el.appendChild(img);
    }
    this.$container.appendChild(el);

    this.loaderGraze[name] = setTimeout(() => {
      el.style.display = 'inline-block';
    }, 100);

    this.loaders[name] = el;
  }

  /**
   * Destroy (or hide) loading indicator
   *
   * @param   {String}    name          Name of notification (unique)
   */
  destroy(name) {
    if ( !this.loaders[name] ) {
      return;
    }

    clearTimeout(this.loaderGraze[name]);

    this.loaders[name].remove();
    delete this.loaders[name];
    delete this.loaderGraze[name];
  }

}
export default (new Loader());
