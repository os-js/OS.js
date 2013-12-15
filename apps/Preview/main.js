(function(Application, Window) {

  /**
   * Main Window
   */
  var ApplicationPreviewWindow = function(app, opts) {
    Window.apply(this, ['ApplicationPreviewWindow', opts, app]);

    this.previewElement = null;
    this.title          = "Preview";
    this.$frame         = null;

    this._title = this.title;
    this._icon  = "mimetypes/image.png";
    this._properties.allow_drop = true;
  };

  ApplicationPreviewWindow.prototype = Object.create(Window.prototype);

  ApplicationPreviewWindow.prototype.init = function(wmref, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    var menuBar = this._addGUIElement(new OSjs.GUI.MenuBar('ApplicationPreviewMenuBar'), root);
    menuBar.addItem("File", [
      {title: 'Open', onClick: function() {
        app.defaultAction('open');
      }},
      {title: 'Close', onClick: function() {
        self._close();
      }}
    ]);

    this.$frame = document.createElement('div');
    this.$frame.className = "Frame";

    root.appendChild(this.$frame);
  };

  ApplicationPreviewWindow.prototype.destroy = function() {
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

    var self = this;
    if ( this.previewElement && this.previewElement.parentNode ) {
      this.previewElement.parentNode.removeChild(this.previewElement);
      this.previewElement = null;
    }

    var el;
    if ( t ) {
      try {
        var src = OSjs.API.getResourceURL(t);
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

    if ( el ) {
      this.previewElement = el;
      this.$frame.appendChild(this.previewElement);

      if ( el.tagName !== 'IMG' ) {
        this._resize(500, 400);
      }
    }

    this._setTitle(t ? (this.title + " - " + OSjs.Utils.filename(t)) : this.title);
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
    var self = this;
    Application.apply(this, ['ApplicationPreview', args, metadata]);

    this.defaultActionWindow  = 'ApplicationPreviewWindow';
    this.acceptMime           = ['^image', '^video', '^audio'];
    this.allowedActions       = ['open'];
    this.openAction           = 'filename';

    this.defaultActionError = function(action, error) {
      var w = self._getWindow('ApplicationPreviewWindow');
      var msg = "An error occured in action: " + action;
      if ( w ) {
        w._error("Preview error", msg, error);
      } else {
        OSjs.API.error("Preview error", msg, error);
      }
    };

    this.defaultActionSuccess = function(action, arg1, arg2) {
      var w = self._getWindow('ApplicationPreviewWindow');
      if ( w ) {
        if ( action === 'open' ) {
          w.setPreview(arg1.path, arg1.mime);
        }
        w._focus();
      }
    };
  };

  ApplicationPreview.prototype = Object.create(Application.prototype);

  ApplicationPreview.prototype.init = function(core, settings) {
    this._addWindow(new ApplicationPreviewWindow(this, {width: 400, height: 200}));
    Application.prototype.init.apply(this, arguments);
  };


  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationPreview = ApplicationPreview;

})(OSjs.Helpers.DefaultApplication, OSjs.Core.Window);
