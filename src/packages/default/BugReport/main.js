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
(function(Application, Window, GUI, Dialogs) {

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window Constructor
   */
  var ApplicationBugReportWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationBugReportWindow', {width: 400, height: 300}, app]);

    // Set window properties and other stuff here
    this._title = metadata.name;
    this._icon  = metadata.icon;
    this._properties.allow_minimize = false;
    this._properties.allow_maximize = false;
    this._properties.allow_resize = false;
  };

  ApplicationBugReportWindow.prototype = Object.create(Window.prototype);

  ApplicationBugReportWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Create window contents (GUI) here
    this._addGUIElement(new OSjs.GUI.Label('DescriptionLabel', {value: 'Your report'}), root);
    var description = this._addGUIElement(new OSjs.GUI.Textarea('Description', {placeholder: 'Enter your message here'}), root);

    this._addGUIElement(new OSjs.GUI.Label('ReportDataLabel', {value: 'Report Data'}), root);
    var misc = this._addGUIElement(new OSjs.GUI.Textarea('ReportData'), root);
    misc.setValue(JSON.stringify(app.reportData, null, 2));

    var btn = this._addGUIElement(new OSjs.GUI.Button('Send', {label: OSjs._('Send and Close'), onClick: function() {
      if ( app ) {
        btn.setDisabled(true);

        app.report(description.getValue(), misc.getValue(), function() {
          btn.setDisabled(false);
        });
      } else {
        self._close();
      }
    }}), root);

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application constructor
   */
  var ApplicationBugReport = function(args, metadata) {
    Application.apply(this, ['ApplicationBugReport', args, metadata]);

    var nav = navigator || {};
    this.reportData = args.data || {};
    this.reportData.compability = OSjs.Utils.getCompability();
    this.reportData.client = {
      name: nav.appName,
      agent: nav.userAgent,
      platform: nav.platform
    };
  };

  ApplicationBugReport.prototype = Object.create(Application.prototype);

  ApplicationBugReport.prototype.init = function(core, settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationBugReportWindow(this, metadata));
  };

  ApplicationBugReport.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    // Make sure we kill our application if main window was closed
    if ( msg == 'destroyWindow' && obj._name === 'ApplicationBugReportWindow' ) {
      this.destroy();
    }
  };

  ApplicationBugReport.prototype.report  = function(message, misc, cb) {
    cb = cb || function() {};

    var self = this;

    this._call('Report', {message:message, misc:misc}, function(response) {
      var error = 'Unknown error';

      cb(response);

      if ( response ) {
        if ( response.result === true ) {
          alert('The error was reported and will be looked into');
          self.destroy();
          return;
        } else {
          error = response.error || error;
        }
      }

      alert('Failed to send bugreport: ' + error);
    });
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationBugReport = ApplicationBugReport;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs);
