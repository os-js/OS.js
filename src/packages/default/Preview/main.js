/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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

/*eslint valid-jsdoc: "off"*/
const DOM = OSjs.require('utils/dom');
const Events = OSjs.require('utils/events');
const Dialog = OSjs.require('core/dialog');
const Locales = OSjs.require('core/locales');
const Connection = OSjs.require('core/connection');
const FileMetadata = OSjs.require('vfs/file');
const DefaultApplication = OSjs.require('helpers/default-application');
const DefaultApplicationWindow = OSjs.require('helpers/default-application-window');

class ApplicationPreviewWindow extends DefaultApplicationWindow {

  constructor(app, metadata, file) {
    super('ApplicationPreviewWindow', {
      allow_drop: true,
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, file);

    this.zoomLevel = 0;
    this.isImage = true;
    this.origWidth = 0;
    this.origHeight = 0;
    this.$view = null;
  }

  destroy() {
    this.$view = null;

    return super.destroy(...arguments);
  }

  init(wm, app) {
    var self = this;
    const root = super.init(...arguments);

    // Load and set up scheme (GUI) here
    this._render('PreviewWindow', require('osjs-scheme-loader!scheme.html'));

    this._find('ZoomIn').son('click', this, this.onZoomIn);
    this._find('ZoomOut').son('click', this, this.onZoomOut);
    this._find('ZoomFit').son('click', this, this.onZoomFit);
    this._find('ZoomOriginal').son('click', this, this.onZoomOriginal);

    this._find('SubmenuFile').on('select', function(ev) {
      if ( ev.detail.id === 'MenuOpenLocation' ) {
        Dialog.create('Input', {
          value: 'http://'
        }, function(ev, btn, value) {
          if ( btn === 'ok' ) {
            if ( !value.match(/^http/) ) {
              self._setWarning(Locales._('ERR_OPEN_LOCATION_FMT', Locales._('ERR_INVALID_LOCATION')));
              return;
            }

            Connection.request('curl', {
              method: 'HEAD',
              url: value
            }, function(err, res) {
              var contentType = res.headers['content-type'];
              if ( !contentType ) {
                err = Locales._('ERR_VFS_NO_MIME_DETECT');
              }

              if ( err ) {
                self._setWarning(Locales._('ERR_OPEN_LOCATION_FMT', err));
              } else {
                self.showFile(new FileMetadata(value, contentType), value);
              }
            });
          }
        }, {parent: self, modal: true});
      }
    });

    var c = this._find('Content').$element;
    Events.$bind(c, 'mousewheel', function(ev, pos) {
      if ( pos.z === 1 ) {
        self.onZoomOut();
      } else if ( pos.z === -1 ) {
        self.onZoomIn();
      }
    });

    return root;
  }

  showFile(file, result) {
    var self = this;
    var root = this._find('Content').$element;
    DOM.$empty(root);

    if ( result ) {
      this.zoomLevel = 0;

      if ( file.mime.match(/^image/) ) {
        this.isImage = true;
        this.$view = this._create('gui-image', {src: result}, root, {
          onload: function() {
            self.origWidth = this.offsetWidth;
            self.origHeight = this.offsetHeight;
            self._resizeTo(this.offsetWidth, this.offsetHeight, true, false, this);
          }
        });
      } else if ( file.mime.match(/^video/) ) {
        this.isImage = false;
        this.$view = this._create('gui-video', {src: result, controls: true, autoplay: true}, root, {
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

    super.showFile(...arguments);
  }

  _onZoom(val) {
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

  onZoomIn() {
    this._onZoom('in');
  }

  onZoomOut() {
    this._onZoom('out');
  }

  onZoomFit() {
    this._onZoom('fit');
  }

  onZoomOriginal() {
    this._onZoom();
  }

}

class ApplicationPreview extends DefaultApplication {

  constructor(args, metadata) {
    super('ApplicationPreview', args, metadata, {
      readData: false
    });
  }

  init(settings, metadata) {
    super.init(...arguments);

    const file = this._getArgument('file');
    this._addWindow(new ApplicationPreviewWindow(this, metadata, file));
  }
}

OSjs.Applications.ApplicationPreview = ApplicationPreview;
