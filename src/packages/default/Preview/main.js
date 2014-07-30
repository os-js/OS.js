(function(Application, Window, GUI) {

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
        app.defaultAction('open');
      }},
      {title: OSjs._('Close'), onClick: function() {
        self._close();
      }}
    ]);

    this.frame = this._addGUIElement(new GUI.ScrollView('Frame'), root);
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
        var src = OSjs.API.getResourceURL(t);
        if ( mime.match(/^image/) ) {
          el = document.createElement('img');
          el.alt = t;
          el.onload = function() {
            if ( self.frame ) {
              self._resizeTo(this.width, this.height);
            }
          };
          el.src = src;

          this.frame.setScroll(true, true);
        } else if ( mime.match(/^audio/) ) {
          el = document.createElement('audio');
          el.controls = "controls";
          el.autoplay = "autoplay";
          el.src = src;
          this._resize(640, 480);
          this.loaded = true;
        } else if ( mime.match(/^video/) ) {
          el = document.createElement('video');
          el.controls = "controls";
          el.autoplay = "autoplay";

          el.addEventListener("loadedmetadata", function(ev) {
            if ( self.frame ) {
              self._resizeTo(this.offsetWidth, this.offsetHeight);
            }
            self.loaded = true;
          });
          el.src = src;
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
    var self = this;
    Application.apply(this, ['ApplicationPreview', args, metadata]);

    this.defaultActionWindow  = 'ApplicationPreviewWindow';
    this.acceptMime           = metadata.mime || null;
    this.allowedActions       = ['open'];
    this.openAction           = 'filename';

    this.defaultActionError = function(action, error) {
      var w = self._getWindow('ApplicationPreviewWindow');
      var msg = OSjs._("An error occured in action: {0}", action);
      if ( w ) {
        w._error(OSjs._("{0} Application Error", self.__label), msg, error);
      } else {
        OSjs.API.error(OSjs._("{0} Application Error", self.__label), msg, error);
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

  ApplicationPreview.prototype.init = function(core, settings, metadata) {
    this._addWindow(new ApplicationPreviewWindow(this, {width: 400, height: 200}, metadata));
    Application.prototype.init.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationPreview = ApplicationPreview;

})(OSjs.Helpers.DefaultApplication, OSjs.Core.Window, OSjs.GUI);
