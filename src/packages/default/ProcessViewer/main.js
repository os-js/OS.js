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
(function(Application, Window, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window
   */
  var ApplicationProcessViewerWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationProcessViewerWindow', {width: 400, height: 400}, app]);

    this._title = metadata.name;
    this._icon = metadata.icon;
  };

  ApplicationProcessViewerWindow.prototype = Object.create(Window.prototype);

  ApplicationProcessViewerWindow.prototype.init = function() {
    var root = Window.prototype.init.apply(this, arguments);

    var listView = this._addGUIElement(new GUI.ListView('ProcessViewListView', {indexKey: 'pid'}), root);
    listView.setColumns([
      {key: 'pid',    title: OSjs._('PID'), domProperties: {width: "50"}},
      {key: 'name',   title: OSjs._('Name')},
      {key: 'alive',  title: OSjs._('Alive'), domProperties: {width: "100"}},
      {key: 'kill',   title: '', type: 'button', domProperties: {width: "45"}}
    ]);


    return root;
  };

  ApplicationProcessViewerWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationProcessViewerWindow.prototype.refresh = function(rows) {
    var listView = this._getGUIElement('ProcessViewListView');
    if ( listView ) {
      listView.setRows(rows);
      listView.render();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var ApplicationProcessViewer = function(args, metadata) {
    Application.apply(this, ['ApplicationProcessViewer', args, metadata]);
  };

  ApplicationProcessViewer.prototype = Object.create(Application.prototype);

  ApplicationProcessViewer.prototype.destroy = function(kill) {
    if ( this.timer ) {
      clearInterval(this.timer);
      this.timer = null;
    }
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationProcessViewer.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationProcessViewerWindow(this, metadata));

    var self = this;
    this.timer = setInterval(function() {
      self.refreshList();
    }, 2500);

    this.refreshList();
  };

  ApplicationProcessViewer.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationProcessViewerWindow' ) {
      this.destroy();
    }
  };

  ApplicationProcessViewer.prototype.refreshList = function() {
    var w = this._getWindow('ApplicationProcessViewerWindow');
    var r = w ? w._getRoot() : null;

    if ( r ) {
      var rows = [];
      var procs = OSjs.API.getProcesses();
      var now = new Date();

      var i = 0, l = procs.length;
      var cev;
      for ( i; i < l; i++ ) {
        if ( !procs[i] ) { continue; }

        try {
          cev = (function(pid) {
            return function(ev) {
              ev.preventDefault();
              ev.stopPropagation();
              OSjs.API.kill(pid);
              return false;
            };
          })(procs[i].__pid);

          rows.push({
            pid: procs[i].__pid,
            name: procs[i].__pname,
            alive: now-procs[i].__started,
            kill: 'Kill',
            customEvent: cev
          });
        } catch ( e ) {
          console.warn('err', e, e.stack);
        }
      }

      w.refresh(rows);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationProcessViewer = ApplicationProcessViewer;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI);
