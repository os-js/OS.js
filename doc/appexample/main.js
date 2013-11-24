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
(function(Application, Window, GUI, Dialogs) {

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window
   */
  var ApplicationEXAMPLEWindow = function(app) {
    Window.apply(this, ['ApplicationEXAMPLEWindow', {width: 400, height: 200}, app]);

    // Set window properties here
  };

  ApplicationEXAMPLEWindow.prototype = Object.create(Window.prototype);

  ApplicationEXAMPLEWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;
    // Create window contents here

    return root;
  };

  ApplicationEXAMPLEWindow.prototype.destroy = function() {
    // Destroy custom objects etc. here

    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var ApplicationEXAMPLE = function(args, metadata) {
    Application.apply(this, ['ApplicationEXAMPLE', args, metadata]);
  };

  ApplicationEXAMPLE.prototype = Object.create(Application.prototype);

  ApplicationEXAMPLE.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, []);
  };

  ApplicationEXAMPLE.prototype.init = function(core, session) {
    Application.prototype.init.apply(this, arguments);
    var self = this;

    this._addWindow(new ApplicationEXAMPLEWindow(this));
  };

  ApplicationEXAMPLE.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationEXAMPLEWindow' ) {
      this.destroy();
    }
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationEXAMPLE = ApplicationEXAMPLE;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Core.GUI, OSjs.Core.Dialogs);
