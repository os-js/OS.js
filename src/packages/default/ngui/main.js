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
(function(Application, Window, Dialogs, Utils, API, VFS, GUI) {

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window Constructor
   */
  function ApplicationnguiWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationnguiWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 700,
      height: 600
    }, app, scheme]);
  }

  ApplicationnguiWindow.prototype = Object.create(Window.prototype);

  ApplicationnguiWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);

    scheme.render(this, 'MyWindowID', root);

    var bar = scheme.find(this, 'MyProgressBar');
    var val = 0;

    setInterval(function() {
      if ( bar ) {
        bar.set('progress', val);
        val+=Math.random()*10;
      }
      val = val % 100;
    }, 1000);

    scheme.find(this, 'MyListView').on('select', function(ev) {
      console.warn('listview select', ev);
    });
    scheme.find(this, 'MyListView').on('activate', function(ev) {
      console.warn('listview activate', ev);
    });
    scheme.find(this, 'MyListView').on('expand', function(ev) {
      console.warn('listview expand', ev);
    });

    scheme.find(this, 'MyTreeView').on('select', function(ev) {
      console.warn('treeview', ev);
    });

    scheme.find(this, 'MyIconView').on('select', function(ev) {
      console.warn('iconview', ev);
    });

    scheme.find(this, 'MyTabs').on('change', function(ev) {
      console.warn('tab', ev);
    });

    scheme.find(this, 'MyMenuBar').on('select', function(ev) {
      console.warn('menubar', ev);
    });

    scheme.find(this, 'MySubMenu').on('select', function(ev) {
      console.warn('menubar submenu', ev);
    });

    scheme.find(this, 'MyColor').on('change', function(ev) {
      console.warn('color', ev);
    });

    scheme.find(this, 'MyText').on('change', function(ev) {
      console.warn('text change', ev);
    });
    scheme.find(this, 'MyText').on('enter', function(ev) {
      console.warn('enter', ev, this.get('value'));
      this.set('value', 'You pressed enter!');
      this.set('disabled', true);
    });
    scheme.find(this, 'MyTextArea').on('enter', function(ev) {
      console.warn('enter', ev, this.get('value'));
    });

    return root;
  };

  ApplicationnguiWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application constructor
   */
  var Applicationngui = function(args, metadata) {
    Application.apply(this, ['Applicationngui', args, metadata]);
  };

  Applicationngui.prototype = Object.create(Application.prototype);

  Applicationngui.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  Applicationngui.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationnguiWindow(self, metadata, scheme));
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.Applicationngui = OSjs.Applications.Applicationngui || {};
  OSjs.Applications.Applicationngui.Class = Applicationngui;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
