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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoSysLogWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationArduinoSysLogWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme]);
  }

  ApplicationArduinoSysLogWindow.prototype = Object.create(Window.prototype);
  ApplicationArduinoSysLogWindow.constructor = Window.prototype;

  ApplicationArduinoSysLogWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'ArduinoSysLogWindow', root);

    var input = scheme.find(this, 'LogOutput');
    function refresh() {
      self._toggleLoading(true);
      API.call('syslog', {}, function(response) {
        self._toggleLoading(false);

        if (response.error) {
          var err = response.error || (response.result ? 'Unknown error' : 'No data recieved');
          input.set('value', 'ERROR: ' + err);
        } else {
          input.set('value', response.result);
        }
      });
    }

    this.interval = setInterval(function() {
      refresh();
    }, 5000);
    refresh();


    return root;
  };

  ApplicationArduinoSysLogWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
    this.interval = clearInterval(this.interval);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoSysLog(args, metadata) {
    Application.apply(this, ['ApplicationArduinoSysLog', args, metadata]);
  }

  ApplicationArduinoSysLog.prototype = Object.create(Application.prototype);
  ApplicationArduinoSysLog.constructor = Application;

  ApplicationArduinoSysLog.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationArduinoSysLogWindow(self, metadata, scheme));
      onInited();
    });
    this._setScheme(scheme);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationArduinoSysLog = OSjs.Applications.ApplicationArduinoSysLog || {};
  OSjs.Applications.ApplicationArduinoSysLog.Class = ApplicationArduinoSysLog;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
