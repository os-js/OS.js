/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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

(function(Application, Window, Utils, VFS, GUI) {
  'use strict';

  var IFRAME_COUNT = 0;

  /////////////////////////////////////////////////////////////////////////////
  // Iframe Application Window Helper
  /////////////////////////////////////////////////////////////////////////////

  /**
   * IFrame Application Window constructor
   *
   * <pre><b>
   * This class is a basic implementation of OSjs.Core.Window
   * that uses Iframe as window content. It's usefull for creating
   * applications that is not using OS.js API.
   *
   * You can use this in combination with 'IFrameApplication'
   * </b></pre>
   *
   * @summary Helper for making IFrame Applications.
   *
   * @param  {String}                 name          Window name
   * @param  {Object}                 opts          Window options
   * @param  {String}                 opts.src      The Iframe source
   * @param  {String}                 opts.icon     The Icon relative/absolute path (./ for app dir)
   * @param  {String}                 opts.title    The Window title
   * @param  {OSjs.Core.Application}  app           The Application reference
   *
   * @constructor
   * @memberof OSjs.Helpers
   * @see OSjs.Core.Window
   *
   * @link https://os.js.org/doc/tutorials/iframe-application.html
   */
  var IFrameApplicationWindow = function(name, opts, app) {
    opts = Utils.argumentDefaults(opts, {
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
    });

    Window.apply(this, ['IFrameApplicationWindow', opts, app]);

    this._iwin = null;
    this._frame = null;
  };

  IFrameApplicationWindow.prototype = Object.create(Window.prototype);

  IFrameApplicationWindow.prototype.destroy = function() {
    this.postMessage('Window::destroy');
    return Window.prototype.destroy.apply(this, arguments);
  };

  IFrameApplicationWindow.prototype.init = function(wmRef, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    root.style.overflow = 'visible';

    var id = 'IframeApplicationWindow' + IFRAME_COUNT.toString();
    var iframe = document.createElement('iframe');
    iframe.setAttribute('border', 0);
    iframe.id = id;
    iframe.className = 'IframeApplicationFrame';
    iframe.addEventListener('load', function() {
      self._iwin = iframe.contentWindow;
      self.postMessage('Window::init');
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
  };

  IFrameApplicationWindow.prototype._blur = function() {
    if ( Window.prototype._blur.apply(this, arguments) ) {
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
  };

  IFrameApplicationWindow.prototype._focus = function() {
    if ( Window.prototype._focus.apply(this, arguments) ) {
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
  };

  /**
   * Post a message to IFrame Application
   *
   * @function postMessage
   * @memberof OSjs.Helpers.IframeApplicationWindow#
   *
   * @param   {Mixed}       message     The message
   */
  IFrameApplicationWindow.prototype.postMessage = function(message) {
    if ( this._iwin && this._app ) {
      console.debug('IFrameApplicationWindow::postMessage()', message);
      this._iwin.postMessage({
        message: message,
        pid: this._app.__pid,
        wid: this._wid
      }, window.location.href);
    }
  };

  /**
   * When Window receives a message from IFrame Application
   *
   * @function onPostMessage
   * @memberof OSjs.Helpers.IframeApplicationWindow#
   *
   * @param   {Mixed}       message     The message
   * @param   {Event}       ev          DOM Event
   */
  IFrameApplicationWindow.prototype.onPostMessage = function(message, ev) {
    console.debug('IFrameApplicationWindow::onPostMessage()', message);
  };

  /**
   * Set Iframe source
   *
   * @function setLocation
   * @memberof OSjs.Helpers.IframeApplicationWindow#
   *
   * @param   {String}      src       Source
   */
  IFrameApplicationWindow.prototype.setLocation = function(src, iframe) {
    iframe = iframe || this._frame;

    var oldbefore = window.onbeforeunload;
    window.onbeforeunload = null;
    iframe.src = src;
    window.onbeforeunload = oldbefore;
  };

  /////////////////////////////////////////////////////////////////////////////
  // IFrame Application Helper
  /////////////////////////////////////////////////////////////////////////////

  /**
   * IFrame Application constructor
   *
   * <pre><code>
   * Usage: Just apply the correct options and this should work
   * automatically.
   *
   * This just inits an empty application with a window that uses
   * iframe for contents. Look at the IFrameApplicationWindow
   * constructor for more options you can apply here.
   * </code></pre>
   *
   * @summary Helper for making IFrame Applications.
   *
   * @param   {String}    name          Process name
   * @param   {Object}    args          Process arguments
   * @param   {Object}    metadata      Application metadata
   * @param   {Object}    opts          Application options
   * @param   {String}    opts.icon     Window Icon
   * @param   {String}    opts.title    Window Title
   *
   * @constructor
   * @memberof OSjs.Helpers
   * @see OSjs.Core.Application
   */
  var IFrameApplication = function(name, args, metadata, opts) {
    Application.call(this, name, args, metadata);

    this.options = Utils.argumentDefaults(opts, {
      icon: '',
      title: 'IframeApplicationWindow'
    });
    this.options.src = OSjs.API.getApplicationResource(this, this.options.src);
  };

  IFrameApplication.prototype = Object.create(Application.prototype);

  IFrameApplication.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);
    var name = this.__pname + 'Window';
    this._addWindow(new IFrameApplicationWindow(name, this.options, this), null, true);
  };

  /**
   * @alias OSjs.Helpers.IframeApplicationWindow#onPostMessage
   */
  IFrameApplication.prototype.onPostMessage = function(message, ev) {
    console.debug('IFrameApplication::onPostMessage()', message);
  };

  /**
   * @alias OSjs.Helpers.IframeApplicationWindow#postMessage
   */
  IFrameApplication.prototype.postMessage = function(message) {
    var win = this._getMainWindow();
    if ( win ) {
      win.postMessage(message);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.IFrameApplication       = IFrameApplication;
  OSjs.Helpers.IFrameApplicationWindow = IFrameApplicationWindow;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.GUI);

