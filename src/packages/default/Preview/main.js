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

  function ApplicationPreviewWindow(app, metadata, scheme, file) {
    DefaultApplicationWindow.apply(this, ['ApplicationPreviewWindow', {
      allow_drop: true,
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme, file]);

    this.zoomLevel = 0;
    this.isImage = true;
    this.origWidth = 0;
    this.origHeight = 0;
    this.$view = null;
  }

  ApplicationPreviewWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationPreviewWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationPreviewWindow.prototype.destroy = function() {
    this.$view = null;

    return DefaultApplicationWindow.prototype.destroy.apply(this, arguments);
  };

  ApplicationPreviewWindow.prototype.init = function(wm, app, scheme) {
    var self = this;
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);

    // Load and set up scheme (GUI) here
    scheme.render(this, 'PreviewWindow', root);

    this._find('ZoomIn').son('click', this, this.onZoomIn);
    this._find('ZoomOut').son('click', this, this.onZoomOut);
    this._find('ZoomFit').son('click', this, this.onZoomFit);
    this._find('ZoomOriginal').son('click', this, this.onZoomOriginal);

    var c = this._find('Content').$element;
    Utils.$bind(c, 'mousewheel', function(ev, pos) {
      if ( pos.z === 1 ) {
        self.onZoomOut();
      } else if ( pos.z === -1 ) {
        self.onZoomIn();
      }
    });

    return root;
  };

  ApplicationPreviewWindow.prototype.showFile = function(file, result) {
    var self = this;
    var root = this._scheme.find(this, 'Content').$element;
    Utils.$empty(root);

    if ( result ) {
      this.zoomLevel = 0;

      if ( file.mime.match(/^image/) ) {
        this.isImage = true;
        this.$view = this._scheme.create(self, 'gui-image', {src: result}, root, {
          onload: function() {
            self.origWidth = this.offsetWidth;
            self.origHeight = this.offsetHeight;
            self._resizeTo(this.offsetWidth, this.offsetHeight, true, false, this);
          }
        });
      } else if ( file.mime.match(/^video/) ) {
        this.isImage = false;
        this.$view = this._scheme.create(self, 'gui-video', {src: result, controls: true, autoplay: true}, root, {
          onload: function() {
            self._resizeTo(this.offsetWidth, this.offsetHeight, true, false, this);
          }
        });
      }
    }

    var toolbar = this._find('Toolbar');
    if ( toolbar ) {
      toolbar[this.isImage ? 'show' : 'hide']();
    }

    DefaultApplicationWindow.prototype.showFile.apply(this, arguments);
  };

  ApplicationPreviewWindow.prototype._onZoom = function(val) {
    if ( !this.isImage || !this.$view ) {
      return;
    }

    var zoom = ['in', 'out'].indexOf(val) !== -1;
    var attr = 'zoomed';
    var w = null;

    if ( val === 'in' ) {
      this.zoomLevel = Math.min(10, this.zoomLevel + 1);
    } else if ( val === 'out' ) {
      this.zoomLevel = Math.max(-10, this.zoomLevel - 1);
    } else {
      this.zoomLevel = 0;
      attr = val === 'fit' ? val : '';
    }

    if ( zoom ) {
      var z = this.zoomLevel;
      if ( z === 0 ) {
        z = 1;
        w = this.origWidth;
      } else if ( z > 0 ) {
        z += 1;
        w = this.origWidth * z;
      } else if ( z < 0 ) {
        z -= 1;
        w = Math.abs(this.origWidth / z);
      }

      this._setTitle(this.currentFile.filename + ' (' + String(z * 100) + '%)', true);
    } else {
      this._setTitle(this.currentFile.filename, true);
    }

    this.$view.$element.setAttribute('data-zoom', attr);
    this.$view.$element.firstChild.style.width = (w === null ? 'auto' : String(w) + 'px');
  }

  ApplicationPreviewWindow.prototype.onZoomIn = function() {
    this._onZoom('in');
  };

  ApplicationPreviewWindow.prototype.onZoomOut = function() {
    this._onZoom('out');
  };

  ApplicationPreviewWindow.prototype.onZoomFit = function() {
    this._onZoom('fit');
  };

  ApplicationPreviewWindow.prototype.onZoomOriginal = function() {
    this._onZoom();
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

  ApplicationPreview.prototype.init = function(settings, metadata) {
    var self = this;
    DefaultApplication.prototype.init.call(this, settings, metadata, function(scheme, file) {
      self._addWindow(new ApplicationPreviewWindow(self, metadata, scheme, file));
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationPreview = OSjs.Applications.ApplicationPreview || {};
  OSjs.Applications.ApplicationPreview.Class = Object.seal(ApplicationPreview);

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
