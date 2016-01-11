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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationProcessViewerWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationProcessViewerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 300
    }, app, scheme]);

    this.interval = null;
  }

  ApplicationProcessViewerWindow.prototype = Object.create(Window.prototype);
  ApplicationProcessViewerWindow.constructor = Window.prototype;

  ApplicationProcessViewerWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'ProcessViewerWindow', root);

    var view = scheme.find(this, 'View');

    function update() {
      var now = new Date();
      var rows = [];
      API.getProcesses().forEach(function(p) {
        if ( p ) {
          var alive = now - p.__started;
          var iter = {
            value: p.__pid,
            id: p.__pid,
            columns: [
              {label: p.__pname},
              {label: p.__pid.toString(), textalign: 'right'},
              {label: alive.toString(), textalign: 'right'}
            ]
          };

          rows.push(iter);
        }
      });

      view.patch(rows);
    }

    view.set('columns', [
      {label: 'Name', basis: '100px', grow: 1, shrink: 1},
      {label: 'PID', basis: '60px', grow: 0, shrink: 0, textalign: 'right'},
      {label: 'Alive', basis: '60px', grow: 0, shrink: 0, textalign: 'right'}
    ]);

    scheme.find(this, 'ButtonKill').on('click', function() {
      var selected = view.get('selected');
      if ( selected && selected[0] && typeof selected[0].data !== 'undefined' ) {
        API.kill(selected[0].data);
      }
    });

    this.interval = setInterval(function() {
      update();
    }, 1000);

    update();

    return root;
  };

  ApplicationProcessViewerWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
    this.interval = clearInterval(this.interval);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationProcessViewer = function(args, metadata) {
    Application.apply(this, ['ApplicationProcessViewer', args, metadata]);
  };

  ApplicationProcessViewer.prototype = Object.create(Application.prototype);
  ApplicationProcessViewer.constructor = Application;

  ApplicationProcessViewer.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationProcessViewer.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationProcessViewerWindow(self, metadata, scheme));

      onInited();
    });

    this._setScheme(scheme);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationProcessViewer = OSjs.Applications.ApplicationProcessViewer || {};
  OSjs.Applications.ApplicationProcessViewer.Class = ApplicationProcessViewer;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
