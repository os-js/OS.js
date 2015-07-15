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
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window Constructor
   */
  var ApplicationEXAMPLEWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationEXAMPLEWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app]);
  };

  ApplicationEXAMPLEWindow.prototype = Object.create(Window.prototype);

  ApplicationEXAMPLEWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Create window contents (GUI) here

    return root;
  };

  ApplicationEXAMPLEWindow.prototype._inited = function() {
    Window.prototype._inited.apply(this, arguments);

    // Window has been successfully created and displayed.
    // You can start communications, handle files etc. here

  };

  ApplicationEXAMPLEWindow.prototype.destroy = function() {
    // Destroy custom objects etc. here

    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application constructor
   */
  var ApplicationEXAMPLE = function(args, metadata) {
    Application.apply(this, ['ApplicationEXAMPLE', args, metadata]);

    // You can set application variables here
  };

  ApplicationEXAMPLE.prototype = Object.create(Application.prototype);

  ApplicationEXAMPLE.prototype.destroy = function() {
    // Destroy communication, timers, objects etc. here

    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationEXAMPLE.prototype.init = function(settings, metadata) {
    var self = this;

    Application.prototype.init.apply(this, arguments);

    // Create your main window
    var mainWindow = this._addWindow(new ApplicationEXAMPLEWindow(this, metadata));

    // Do other stuff here
  };

  ApplicationEXAMPLE.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    // Make sure we kill our application if main window was closed
    if ( msg == 'destroyWindow' && obj._name === 'ApplicationEXAMPLEWindow' ) {
      this.destroy();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationEXAMPLE = OSjs.Applications.ApplicationEXAMPLE || {};
  OSjs.Applications.ApplicationEXAMPLE.Class = ApplicationEXAMPLE;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
