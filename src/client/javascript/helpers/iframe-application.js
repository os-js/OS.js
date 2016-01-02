/*!
 * OS.js - JavaScript Operating System
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

  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};

  /////////////////////////////////////////////////////////////////////////////
  // Iframe Application Window Helper
  /////////////////////////////////////////////////////////////////////////////

  /**
   * IFrame Application Window constructor
   *
   * This class is a basic implementation of OSjs.Core.Window
   * that uses Iframe as window content. It's usefull for creating
   * applications that is not using OS.js API.
   *
   * You can use this in combination with 'IFrameApplication'
   *
   * @option  opts    src       String      The Iframe source
   * @option  opts    icon      String      The Icon relative/absolute path (./ for app dir)
   * @option  opts    title     String      The Window title
   *
   * @api OSjs.Helpers.IFrameApplicationWindow
   * @see OSjs.Core.Window
   * @link http://os.js.org/doc/tutorials/iframe-application.html
   * @extends Window
   * @class
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

    var iframe = document.createElement('iframe');
    iframe.setAttribute('border', 0);
    iframe.className = 'IframeApplicationFrame';
    iframe.addEventListener('load', function() {
      self.postMessage('Window::init');
    });
    iframe.src = this._opts.src;
    root.appendChild(iframe);

    this._frame = iframe;
    this._iwin = iframe.contentWindow;

    this._iwin.focus();
    this._frame.focus();
    this._opts.focus(this._frame, this._iwin);

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
   * @param   Mixed       message     The message
   * @return  void
   *
   * @method IFrameApplicationWindow::postMessage()
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
   * @param   Mixed       message     The message
   * @param   DOMEvent    ev          DOM Event
   * @return  void
   *
   * @method IFrameApplicationWindow::onPostMessage()
   */
  IFrameApplicationWindow.prototype.onPostMessage = function(message, ev) {
    console.debug('IFrameApplicationWindow::onPostMessage()', message);
  };

  /////////////////////////////////////////////////////////////////////////////
  // IFrame Application Helper
  /////////////////////////////////////////////////////////////////////////////

  /**
   * IFrame Application constructor
   *
   * Usage: Just apply the correct options and this should work
   * automatically.
   *
   * This just inits an empty application with a window that uses
   * iframe for contents. Look at the IFrameApplicationWindow
   * constructor for more options you can apply here.
   *
   * @option    opts      icon      String      Window Icon
   * @option    opts      title     String      Window Title
   *
   * @api OSjs.Helpers.IFrameApplication
   * @extends Application
   * @class
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

  /**
   * Default init() code (run this last in your Application init() method)
   *
   * @see Application::init()
   * @method IFrameApplication::init()
   */
  IFrameApplication.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);
    var name = this.__pname + 'Window';
    this._addWindow(new IFrameApplicationWindow(name, this.options, this), null, true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.IFrameApplication       = IFrameApplication;
  OSjs.Helpers.IFrameApplicationWindow = IFrameApplicationWindow;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.GUI);

