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
(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationHTMLViewerWindow(app, metadata, scheme, file) {
    DefaultApplicationWindow.apply(this, ['ApplicationHTMLViewerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme, file]);
  }

  ApplicationHTMLViewerWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationHTMLViewerWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationHTMLViewerWindow.prototype.init = function(wmRef, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    scheme.render(this, 'HTMLViewerWindow', root);
    return root;
  };

  ApplicationHTMLViewerWindow.prototype.showFile = function(file, url) {
    if ( this._scheme ) {
      this._find('iframe').set('src', url);
    }
    DefaultApplicationWindow.prototype.showFile.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationHTMLViewer(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationHTMLViewer', args, metadata, {
      extension: 'html',
      mime: 'text/htm',
      filename: 'index.html',
      fileypes: ['htm', 'html'],
      readData: false
    }]);
  }

  ApplicationHTMLViewer.prototype = Object.create(DefaultApplication.prototype);
  ApplicationHTMLViewer.constructor = DefaultApplication;

  ApplicationHTMLViewer.prototype.init = function(settings, metadata) {
    var self = this;
    DefaultApplication.prototype.init.call(this, settings, metadata, function(scheme, file) {
      self._addWindow(new ApplicationHTMLViewerWindow(self, metadata, scheme, file));
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationHTMLViewer = OSjs.Applications.ApplicationHTMLViewer || {};
  OSjs.Applications.ApplicationHTMLViewer.Class = Object.seal(ApplicationHTMLViewer);

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
