(function(Application, Window) {

  // TODO: Mime check from metadata

  /**
   * Main Window
   */
  var ApplicationPreviewWindow = function(app, opts) {
    Window.apply(this, ['ApplicationPreviewWindow', opts, app]);

    this.menuBar = null;
    this.previewElement = null;
    this.title = "Preview";
    this.$frame = null;

    this._title = this.title;
    this._icon = "/themes/default/icons/16x16/mimetypes/image.png";
    this._properties.allow_drop = true;
  };

  ApplicationPreviewWindow.prototype = Object.create(Window.prototype);

  ApplicationPreviewWindow.prototype.init = function() {
    var root = Window.prototype.init.apply(this, arguments);
    var app = this._appRef;

    this.menuBar = new OSjs.GUI.MenuBar();
    this.menuBar.addItem("File", [
      {title: 'Open', onClick: function() {
        app.action('open');
      }},
      {title: 'Close', onClick: function() {
        app.action('close');
      }}
    ]);

    this.$frame = document.createElement('div');
    this.$frame.className = "Frame";

    root.appendChild(this.menuBar.getRoot());
    root.appendChild(this.$frame);
  };

  ApplicationPreviewWindow.prototype.destroy = function() {
    if ( this.menuBar ) {
      this.menuBar.destroy();
      this.menuBar = null;
    }
    if ( this.previewElement && this.previewElement.parentNode ) {
      this.previewElement.parentNode.removeChild(this.previewElement);
      this.previewElement = null;
    }
    if ( this.$frame && this.$frame.parentNode ) {
      this.$frame.parentNode.removeChild(this.$frame);
      this.$frame = null;
    }
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationPreviewWindow.prototype._onDndAction = function(ev, type, item, args) {
    Window.prototype._onDndAction.apply(this, arguments);
    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._appRef.action('open', data.path, data.mime);
      }
    }
  };

  ApplicationPreviewWindow.prototype.setPreview = function(t, mime) {
    console.log("ApplicationPreviewWindow::setPreview()", t, mime);

    if ( this.previewElement && this.previewElement.parentNode ) {
      this.previewElement.parentNode.removeChild(this.previewElement);
      this.previewElement = null;
    }

    var el;
    if ( mime ) {
      if ( !mime.match(/^(image|video|audio)/) ) {
        OSjs.API.error("Preview", "Cannot open file", "Not supported!");
        return;
      }

      if ( t ) {
        try {
          var src = OSjs.API.getFilesystemURL(t);
          if ( mime.match(/^image/) ) {
            el = document.createElement('img');
            el.alt = t;
            el.src = src;
          } else if ( mime.match(/^audio/) ) {
            el = document.createElement('audio');
            el.controls = "controls";
            el.autoplay = "autoplay";
            el.src = src;
          } else if ( mime.match(/^video/) ) {
            el = document.createElement('video');
            el.controls = "controls";
            el.autoplay = "autoplay";
            el.src = src;
          }
        } catch ( e ) {
          console.warn("Preview error: " + e);
        }
      }
    }

    if ( el ) {
      this.previewElement = el;
      this.$frame.appendChild(this.previewElement);

      if ( el.tagName !== 'IMG' ) {
        this._resize(500, 400);
      }
    }

    this._setTitle(t ? (this.title + " - " + t) : this.title);
  };

  ApplicationPreviewWindow.prototype._resize = function(w, h) {
    if ( !Window.prototype._resize.apply(this, arguments) ) return false;

    if ( this.previewElement && this.previewElement.tagName !== 'IMG' ) {
      if ( this.previewElement.parentNode ) {
        this.previewElement.width  = this.previewElement.parentNode.offsetWidth;
        this.previewElement.height = this.previewElement.parentNode.offsetHeight;
      }
    }

    return true;
  };

  /**
   * Application
   */
  var ApplicationPreview = function(args, metadata) {
    Application.apply(this, ['ApplicationPreview', args, metadata]);
  };

  ApplicationPreview.prototype = Object.create(Application.prototype);

  ApplicationPreview.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, []);
  };

  ApplicationPreview.prototype.init = function(core, session) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationPreviewWindow(this, {width: 400, height: 200}));

    var open = this._getArgument('file');
    var mime = this._getArgument('mime');
    if ( open ) {
      this.action('open', open, mime);
    }
  };

  ApplicationPreview.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationPreviewWindow' ) {
      this.destroy();
    }
  };

  ApplicationPreview.prototype.action = function(action, fname, mime) {
    var w = this._getWindow('ApplicationPreviewWindow');
    if ( !w ) return;
    var self = this;
    switch ( action ) {
      case 'close' :
        this.destroy();
      break;

      case 'open' :
        var _open = function(fname, rmime) {
          if ( fname ) {
            w.setPreview(fname, (mime || rmime) || null);
            self._setArgument('file', fname);
            self._setArgument('mime', (mime || rmime) || null);
          }
        };

        if ( fname ) {
          _open(fname);
        } else {
          this._createDialog('File', [{type: 'open'}, function(fname, rmime) {
            _open(fname, (mime || rmime));
          }], w);
        }
      break;
    }
  };


  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationPreview = ApplicationPreview;

})(OSjs.Core.Application, OSjs.Core.Window);
