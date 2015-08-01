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
(function(Application, Window, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationPreviewWindow(app, metadata, scheme, file) {
    Window.apply(this, ['ApplicationPreviewWindow', {
      allow_drop: true,
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme]);

    this.currentFile = file ? new VFS.File(file) : null;
  }

  ApplicationPreviewWindow.prototype = Object.create(Window.prototype);
  ApplicationPreviewWindow.constructor = Window.prototype;

  ApplicationPreviewWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'PreviewWindow', root);

    var menuMap = {
      MenuOpen: function() { app.openDialog(null, self); },
      MenuClose: function() { self._close(); }
    };

    scheme.find(this, 'SubmenuFile').on('select', function(ev) {
      if ( menuMap[ev.detail.id] ) {
        menuMap[ev.detail.id]();
      }
    });

    // Load given file
    if ( this.currentFile ) {
      app.openFile(this.currentFile, this);
    }

    return root;
  };

  ApplicationPreviewWindow.prototype.preview = function(file) {
    if ( !file ) { return; }

    var self = this;
    var scheme = this._scheme;
    var root = scheme.find(this, 'Content').$element;

    Utils.$empty(root);
    this._setTitle();

    VFS.url(file, function(error, result) {
      if ( !error && result ) {
        self._setTitle(file.filename, true);
        self._currentFile = file;

        if ( file.mime.match(/^image/) ) {
          scheme.create(self, 'gui-image', {src: result}, root, {onload: function() {
            self._resizeTo(this.offsetWidth, this.offsetHeight, true, false, this);
          }});
        } else if ( file.mime.match(/^video/) ) {
          scheme.create(self, 'gui-video', {src: result, controls: true, autoplay: true}, root, {onload: function() {
            self._resizeTo(this.offsetWidth, this.offsetHeight, true, false, this);
          }});
        }
      }
    });
  };

  ApplicationPreviewWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
    this.currentFile = null;
  };

  ApplicationPreviewWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) { return; }

    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._app.openFile(new VFS.File(data), this);
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationPreview = function(args, metadata) {
    Application.apply(this, ['ApplicationPreview', args, metadata]);
  };

  ApplicationPreview.prototype = Object.create(Application.prototype);
  ApplicationPreview.constructor = Application;

  ApplicationPreview.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationPreview.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = OSjs.API.createScheme(url);
    var file = this._getArgument('file');

    scheme.load(function(error, result) {
      self._addWindow(new ApplicationPreviewWindow(self, metadata, scheme, file));
    });
  };

  ApplicationPreview.prototype.openFile = function(file, win) {
    if ( !file ) { return; }

    var check = this.__metadata.mime || [];
    if ( !Utils.checkAcceptMime(file.mime, check) ) {
      API.error(this.__label,
                API._('ERR_FILE_APP_OPEN'),
                API._('ERR_FILE_APP_OPEN_FMT',
                file.path, file.mime)
      );
      return;
    }

    this._setArgument('file', file);

    win.preview(file);
  };

  ApplicationPreview.prototype.openDialog = function(path, win) {
    var self = this;

    win._toggleDisabled(true);
    API.createDialog('File', {
      filter: this.__metadata.mime,
      path: path
    }, function(ev, button, result) {
      win._toggleDisabled(false);
      if ( result ) {
        self.openFile(result, win);
      }
    }, win);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationPreview = OSjs.Applications.ApplicationPreview || {};
  OSjs.Applications.ApplicationPreview.Class = ApplicationPreview;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS);
