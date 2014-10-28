/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window
   */
  var ApplicationAboutWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationAboutWindow', {width: 350, height: 250, min_height: 250}, app]);

    // Set window properties here
    this._icon    = metadata.icon;
    this._title   = metadata.name;

    this._properties.gravity = 'center';
    this._properties.allow_resize = false;
    this._properties.allow_maximize = false;
  };

  ApplicationAboutWindow.prototype = Object.create(Window.prototype);

  ApplicationAboutWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;
    // Create window contents here

    var header = document.createElement('h1');
    header.innerHTML = 'About OS.js';

    var textarea = document.createElement('div');
    textarea.innerHTML = '<span>Created by Anders Evenrud</span><br />';
    textarea.innerHTML += '<a href="mailto:andersevenrud@gmail.com">Send e-mail</a> | ';
    textarea.innerHTML += '<a href="http://andersevenrud.github.io/">Author homepage</a>';
    textarea.innerHTML += '<br />';
    textarea.innerHTML += '<br />';
    textarea.innerHTML += 'Icon Theme is from <b>Gnome</b><br />';
    textarea.innerHTML += 'Sound Themes is from <b>Freedesktop</b><br />';
    textarea.innerHTML += 'OSS Font <i>Karla</i> by <b>Jonathan Pinhorn</b><br />';
    textarea.innerHTML += '<br />';
    textarea.innerHTML += '<a href="http://andersevenrud.github.io/OS.js-v2/" target="_blank">Visit GitHub project page</a>';

    root.appendChild(header);
    root.appendChild(textarea);

    return root;
  };

  ApplicationAboutWindow.prototype.destroy = function() {
    // Destroy custom objects etc. here

    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var ApplicationAbout = function(args, metadata) {
    Application.apply(this, ['ApplicationAbout', args, metadata]);
  };

  ApplicationAbout.prototype = Object.create(Application.prototype);

  ApplicationAbout.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, []);
  };

  ApplicationAbout.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);
    this._addWindow(new ApplicationAboutWindow(this, metadata));
  };

  ApplicationAbout.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationAboutWindow' ) {
      this.destroy();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationAbout = ApplicationAbout;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
