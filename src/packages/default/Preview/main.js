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
(function(Application, Window, GUI, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window
   */
  var ApplicationPreviewWindow = function(app, opts, metadata) {
    Window.apply(this, ['ApplicationPreviewWindow', opts, app]);

    this.previewElement = null;
    this.title          = metadata.name;
    this.frame          = null;
    this.loaded         = false;

    this._title = this.title;
    this._icon  = metadata.icon;
    this._properties.allow_drop = true;
  };

  ApplicationPreviewWindow.prototype = Object.create(Window.prototype);

  ApplicationPreviewWindow.prototype.init = function(wmref, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    var menuBar = this._addGUIElement(new GUI.MenuBar('ApplicationPreviewMenuBar'), root);
    menuBar.addItem(OSjs._("File"), [
      {title: OSjs._('Open'), onClick: function() {
        app.action('open');
      }},
      {title: OSjs._('Close'), onClick: function() {
        self._close();
      }}
    ]);

    this.frame = this._addGUIElement(new GUI.ScrollView('Frame'), root);

    this._addHook("resized", function() {
      if ( self.frame.$element ) {
        if ( self.previewElement ) {
          if ( (self.previewElement.offsetHeight <= self.frame.$element.offsetHeight) && (self.previewElement.offsetWidth <= self.frame.$element.offsetWidth) ) {
            self.frame.$element.style.overflow = "hidden";
          } else {
            self.frame.$element.style.overflow = "auto";
          }
        }
      }
    });
  };

  ApplicationPreviewWindow.prototype.destroy = function() {
    if ( this.previewElement && this.previewElement.parentNode ) {
      this.previewElement.parentNode.removeChild(this.previewElement);
      this.previewElement = null;
    }
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationPreviewWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) return;

    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._appRef.defaultAction('open', data.path, data.mime);
      }
    }
  };

  ApplicationPreviewWindow.prototype.setPreview = function(t, mime) {
    console.log("ApplicationPreviewWindow::setPreview()", t, mime);

    this.loaded = false;

    var self = this;
    if ( this.previewElement && this.previewElement.parentNode ) {
      this.previewElement.parentNode.removeChild(this.previewElement);
      this.previewElement = null;
    }

    var el;
    if ( t ) {
      this.frame.setScroll(false, false);
      try {
        if ( mime.match(/^image/) ) {
          el = document.createElement('img');
          el.alt = t;
          el.onload = function() {
            if ( self.frame ) {
              self._resizeTo(this.width, this.height, true, false, self.previewElement);
            }
          };

          this.frame.setScroll(true, true);
        } else if ( mime.match(/^audio/) ) {
          el = document.createElement('audio');
          el.controls = "controls";
          el.autoplay = "autoplay";
          this._resize(640, 480);
          this.loaded = true;
        } else if ( mime.match(/^video/) ) {
          el = document.createElement('video');
          el.controls = "controls";
          el.autoplay = "autoplay";

          el.addEventListener("loadedmetadata", function(ev) {
            if ( self.frame ) {
              self._resizeTo(this.offsetWidth, this.offsetHeight, true, false, self.previewElement);
            }
            self.loaded = true;
          });
        }

        if ( el ) {
          VFS.url(t, function(error, result) {
            if ( !error && el ) {
              el.src = result;
            }
          });
        }
      } catch ( e ) {
        console.warn("Preview error: " + e);
      }
    }

    if ( el ) {
      this.previewElement = el;
      this.frame.addElement(this.previewElement, true);
    }

    this._setTitle(t ? (this.title + " - " + OSjs.Utils.filename(t)) : this.title);
  };

  ApplicationPreviewWindow.prototype._resize = function(w, h) {
    if ( !Window.prototype._resize.apply(this, arguments) ) return false;

    if ( this.loaded ) {
      if ( this.previewElement && this.previewElement.tagName !== 'IMG' ) {
        if ( this.previewElement.parentNode ) {
          this.previewElement.width  = this.previewElement.parentNode.offsetWidth;
          this.previewElement.height = this.previewElement.parentNode.offsetHeight;
        }
      }
    }

    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var ApplicationPreview = function(args, metadata) {
    Application.apply(this, ['ApplicationPreview', args, metadata]);

    this.dialogOptions.read  = false;
    this.dialogOptions.mimes = metadata.mime;
  };

  ApplicationPreview.prototype = Object.create(Application.prototype);

  ApplicationPreview.prototype.init = function(settings, metadata) {
    this.mainWindow = this._addWindow(new ApplicationPreviewWindow(this, {width: 400, height: 200}, metadata));

    Application.prototype.init.apply(this, arguments);
  };

  ApplicationPreview.prototype.onOpen = function(file, data) {
    if ( this.mainWindow ) {
      this.mainWindow.setPreview(file.path, file.mime);
      this.mainWindow._focus();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationPreview = ApplicationPreview;

})(OSjs.Helpers.DefaultApplication, OSjs.Core.Window, OSjs.GUI, OSjs.VFS);
