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
(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationPreviewWindow(app, metadata, scheme, file) {
    DefaultApplicationWindow.apply(this, ['ApplicationPreviewWindow', {
      allow_drop: true,
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme, file]);
  }

  ApplicationPreviewWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationPreviewWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationPreviewWindow.prototype.init = function(wm, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);

    // Load and set up scheme (GUI) here
    scheme.render(this, 'PreviewWindow', root);

    return root;
  };

  ApplicationPreviewWindow.prototype.showFile = function(file, result) {
    var self = this;
    var root = this._scheme.find(this, 'Content').$element;
    Utils.$empty(root);

    if ( result ) {
      if ( file.mime.match(/^image/) ) {
        this._scheme.create(self, 'gui-image', {src: result}, root, {onload: function() {
          self._resizeTo(this.offsetWidth, this.offsetHeight, true, false, this);
        }});
      } else if ( file.mime.match(/^video/) ) {
        this._scheme.create(self, 'gui-video', {src: result, controls: true, autoplay: true}, root, {onload: function() {
          self._resizeTo(this.offsetWidth, this.offsetHeight, true, false, this);
        }});
      }
    }

    DefaultApplicationWindow.prototype.showFile.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationPreview = function(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationPreview', args, metadata, {
      readData: false
    }]);
  };

  ApplicationPreview.prototype = Object.create(DefaultApplication.prototype);
  ApplicationPreview.constructor = DefaultApplication;

  ApplicationPreview.prototype.init = function(settings, metadata, onInited) {
    var self = this;
    DefaultApplication.prototype.init.call(this, settings, metadata, onInited, function(scheme, file) {
      self._addWindow(new ApplicationPreviewWindow(self, metadata, scheme, file));
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationPreview = OSjs.Applications.ApplicationPreview || {};
  OSjs.Applications.ApplicationPreview.Class = ApplicationPreview;

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
