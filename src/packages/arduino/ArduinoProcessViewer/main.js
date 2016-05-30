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

  function ApplicationArduinoProcessViewerWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationArduinoProcessViewerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme]);

    this.interval = null;
  }

  ApplicationArduinoProcessViewerWindow.prototype = Object.create(Window.prototype);
  ApplicationArduinoProcessViewerWindow.constructor = Window.prototype;

  ApplicationArduinoProcessViewerWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'ArduinoProcessViewerWindow', root);

    var view = scheme.find(this, 'View');

    function callAPI(fn, args, cb) {
      self._toggleLoading(true);
      API.call(fn, args, function(response) {
        self._toggleLoading(false);
        return cb(response.error, response.result);
      });
    }

    function kill(selected, signal) {
      if ( selected && selected[0] && typeof selected[0].data !== 'undefined' ) {
        var pid = selected[0].data;
        callAPI('kill', {pid: pid, signal: signal}, function() {
        });
      }
    }

    function update() {
      callAPI('ps', {}, function(err, result) {
        var rows = [];

        if ( result ) {
          (result || []).forEach(function(p) {
            var iter = {
              value: p.PID,
              id: p.PID,
              columns: [
                {label: p.PID.toString()},
                {label: p.COMMAND},
                {label: p['%CPU'].toString()},
                {label: p['%MEM'].toString()}
              ]
            };

            rows.push(iter);
          });
        }

        view.patch(rows);
      });
    }

    view.set('columns', [
      {label: 'PID', basis: '30px'},
      {label: 'Name'},
      {label: '%CPU', basis: '30px'},
      {label: '%MEM', basis: '30px'}
    ]);

    scheme.find(this, 'ButtonKill').on('click', function() {
      kill(view.get('selected'), 'KILL');
    });
    scheme.find(this, 'ButtonTerminate').on('click', function() {
      kill(view.get('selected'), 'TERM');
    });
    scheme.find(this, 'ButtonHangUp').on('click', function() {
      kill(view.get('selected'), 'HUP');
    });

    this.interval = setInterval(function() {
      update();
    }, 5000);

    update();

    return root;
  };

  ApplicationArduinoProcessViewerWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
    this.interval = clearInterval(this.interval);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoProcessViewer(args, metadata) {
    Application.apply(this, ['ApplicationArduinoProcessViewer', args, metadata]);
  }

  ApplicationArduinoProcessViewer.prototype = Object.create(Application.prototype);
  ApplicationArduinoProcessViewer.constructor = Application;

  ApplicationArduinoProcessViewer.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationArduinoProcessViewerWindow(self, metadata, scheme));
    });

    this._setScheme(scheme);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationArduinoProcessViewer = OSjs.Applications.ApplicationArduinoProcessViewer || {};
  OSjs.Applications.ApplicationArduinoProcessViewer.Class = ApplicationArduinoProcessViewer;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
