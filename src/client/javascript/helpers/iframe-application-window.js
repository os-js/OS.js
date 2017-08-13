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

import Window from 'core/window';

let IFRAME_COUNT = 0;

/**
 * IFrame Application Window constructor
 *
 * @desc
 * <pre><b>
 * This class is a basic implementation of Window
 * that uses Iframe as window content. It's usefull for creating
 * applications that is not using OS.js API.
 *
 * You can use this in combination with 'IFrameApplication'
 * </b></pre>
 *
 * @link https://manual.os-js.org/packages/iframe/
 */
export default class IFrameApplicationWindow extends Window {

  /**
   * @param  {String}       name          Window name
   * @param  {Object}       opts          Window options
   * @param  {String}       opts.src      The Iframe source
   * @param  {String}       opts.icon     The Icon relative/absolute path (./ for app dir)
   * @param  {String}       opts.title    The Window title
   * @param  {Application}  app           The Application reference
   */
  constructor(name, opts, app) {
    opts = Object.assign({}, {
      src: 'about:blank',
      focus: function() {},
      blur: function() {},
      icon: null,
      title: 'IframeApplicationWindow',
      width: 320,
      height: 240,
      allow_resize: false,
      allow_restore: false,
      allow_maximize: false
    }, opts);

    super('IFrameApplicationWindow', opts, app);

    this._iwin = null;
    this._frame = null;
  }

  destroy() {
    this.postMessage('Window::destroy');
    return super.destroy(...arguments);
  }

  init(wmRef, app) {
    const root = super.init(...arguments);
    root.style.overflow = 'visible';

    const id = 'IframeApplicationWindow' + IFRAME_COUNT.toString();
    const iframe = document.createElement('iframe');
    iframe.setAttribute('border', 0);
    iframe.id = id;
    iframe.className = 'IframeApplicationFrame';
    iframe.addEventListener('load', () => {
      this._iwin = iframe.contentWindow;
      this.postMessage('Window::init');
    });

    this.setLocation(this._opts.src, iframe);
    root.appendChild(iframe);

    this._frame = iframe;

    try {
      this._iwin = iframe.contentWindow;
    } catch ( e ) {}

    if ( this._iwin ) {
      this._iwin.focus();
    }

    this._frame.focus();
    this._opts.focus(this._frame, this._iwin);

    IFRAME_COUNT++;

    return root;
  }

  _blur() {
    if ( super._blur(...arguments) ) {
      if ( this._iwin ) {
        this._iwin.blur();
      }
      if ( this._frame ) {
        this._frame.blur();
      }

      this._opts.blur(this._frame, this._iwin);
      return true;
    }
    return false;
  }

  _focus() {
    if ( super._focus(...arguments) ) {
      if ( this._iwin ) {
        this._iwin.focus();
      }
      if ( this._frame ) {
        this._frame.focus();
      }
      this._opts.focus(this._frame, this._iwin);
      return true;
    }
    return false;
  }

  /**
   * Post a message to IFrame Application
   *
   * @param   {*}       message     The message
   */
  postMessage(message) {
    if ( this._iwin && this._app ) {
      console.debug('IFrameApplicationWindow::postMessage()', message);
      this._iwin.postMessage({
        message: message,
        pid: this._app.__pid,
        wid: this._wid
      }, window.location.href);
    }
  }

  /**
   * When Window receives a message from IFrame Application
   *
   * @param   {*}       message     The message
   * @param   {Event}   ev          DOM Event
   */
  onPostMessage(message, ev) {
    console.debug('IFrameApplicationWindow::onPostMessage()', message);
  }

  /**
   * Set Iframe source
   *
   * @param   {String}      src       Source
   * @param   {Element}     iframe    Iframe element
   */
  setLocation(src, iframe) {
    iframe = iframe || this._frame;

    const oldbefore = window.onbeforeunload;
    window.onbeforeunload = null;
    iframe.src = src;
    window.onbeforeunload = oldbefore;
  }

}
