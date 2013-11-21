(function(Application, Window) {

  /**
   * Main Window
   */
  var ApplicationTextpadWindow = function(app, opts) {
    Window.apply(this, ['ApplicationTextpadWindow', opts, app]);
    this.menuBar = null;
    this.textView = null;
    this.textArea = null;
    this.title = "Textpad";
    this._icon = "/themes/default/icons/16x16/apps/accessories-text-editor.png";
    this._title = this.title;
    this._properties.allow_drop = true;
  };

  ApplicationTextpadWindow.prototype = Object.create(Window.prototype);

  ApplicationTextpadWindow.prototype.init = function() {
    var root = Window.prototype.init.apply(this, arguments);
    var app = this._appRef;

    this.menuBar = new OSjs.GUI.MenuBar();
    this.menuBar.addItem("File", [
      {title: 'New', name: 'New', onClick: function() {
        app.action('new');
      }},
      {title: 'Open', name: 'Open', onClick: function() {
        app.action('open');
      }},
      {title: 'Save', name: 'Save', onClick: function() {
        app.action('save');
      }},
      {title: 'Save As...', name: 'SaveAs', onClick: function() {
        app.action('saveas');
      }},
      {title: 'Close', name: 'Close', onClick: function() {
        app.action('close');
      }}
    ]);

    this.menuBar.onMenuOpen = function(menu) {
      var el = menu.getRoot().getElementsByClassName("MenuItem_Save")[0];
      if ( el ) {
        if ( app.currentFile ) {
          el.className = el.className.replace(/\s?Disabled/, '');
        } else {
          el.className += ' Disabled';
        }
      }
    };

    this.textArea = new OSjs.GUI.Textarea();

    root.appendChild(this.menuBar.getRoot());
    root.appendChild(this.textArea.getRoot());

    this.setText(null);
  };

  ApplicationTextpadWindow.prototype.destroy = function() {
    if ( this.textArea ) {
      this.textArea.destroy();
      this.textArea = null;
    }
    if ( this.menuBar ) {
      this.menuBar.destroy();
      this.menuBar = null;
    }
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationTextpadWindow.prototype._onDndEvent = function(ev, type, item, args) {
    Window.prototype._onDndEvent.apply(this, arguments);
    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime && (data.mime.match(/^text\//) ) ) {
        this._appRef.action('open', data.path);
      }
    }
  };

  ApplicationTextpadWindow.prototype.setText = function(t, name) {
    if ( !this.textArea ) return;

    if ( t === null ) {
      this.textArea.setText("");
      this.refresh("New file");
      return;
    }

    this.textArea.setText(t);
    this.refresh(name);
  };

  ApplicationTextpadWindow.prototype.getText = function() {
    return this.textArea ? this.textArea.getText() : '';
  };

  ApplicationTextpadWindow.prototype.refresh = function(name) {
    this._setTitle(this.title + " - " + name);
  };

  ApplicationTextpadWindow.prototype._focus = function() {
    Window.prototype._focus.apply(this, arguments);
    if ( this.textArea ) {
      this.textArea.focus();
    }
  };

  /**
   * Application
   */
  var ApplicationTextpad = function(args, metadata) {
    Application.apply(this, ['ApplicationTextpad', args, metadata]);
    this.currentFile = null;
  };

  ApplicationTextpad.prototype = Object.create(Application.prototype);

  ApplicationTextpad.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, []);
  };

  ApplicationTextpad.prototype.init = function(core, session) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationTextpadWindow(this, {width: 400, height: 200}));

    var open = this._getArgument('file');
    if ( open ) {
      this.action('open', open);
    }
  };

  ApplicationTextpad.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationTextpadWindow' ) {
      this.destroy();
    }
  };

  ApplicationTextpad.prototype.action = function(action, fname) {
    var self = this;
    var w = this._getWindow('ApplicationTextpadWindow');
    if ( !w ) return;

    var _onError = function(msg, err) {
      OSjs.API.error("Textpad error", msg, err);
    };

    var _save = function(fname) {
      var data = w.getText();

      OSjs.API.call('fs', {'method': 'file_put_contents', 'arguments': [fname, data]}, function(res) {
        if ( res.result ) {
          self.currentFile = fname;
          self._setArgument('file', fname);
          w.refresh(fname);
        } else {
          if ( res.error ) {
            _onError("An error occured while handling your request", res.error);
          } else {
            _onError("Failed to save file: " + fname, "Fatal error");
          }
        }
      }, function(error) {
        _onError("Failed to save file (call): " + fname, error);
      });
    };

    switch ( action ) {
      case 'new' :
        this.currentFile = null;
        w.setText(null);
        this._setArgument('file', null);
      break;

      case 'close' :
        this.destroy();
      break;

      case 'save' :
        if ( this.currentFile ) {
          _save(this.currentFile);
        }
      break;

      case 'saveas' :
        var dir = this.currentFile ? OSjs.Utils.dirname(this.currentFile) : null;
        var fnm = this.currentFile ? OSjs.Utils.filename(this.currentFile) : null;
        this._createDialog('File', [{type: 'save', path: dir, filename: fnm, mime: 'text/plain'}, function(btn, fname) {
            if ( btn !== 'ok' ) return;
          _save(fname);
        }], w);
      break;

      case 'open' :
        var _open = function(fname) {
          if ( fname ) {
            OSjs.API.call('fs', {'method': 'file_get_contents', 'arguments': [fname]}, function(res) {
              if ( !res ) return;

              if ( res.result ) {
                w.setText(res.result, fname);
                self._setArgument('file', fname);
                self.currentFile = fname;
              } else {
                if ( res.error ) {
                  _onError("Failed to open file: " + fname, res.error);
                }

                w.setText(null);
                self._setArgument('file', null);
                self.currentFile = null;
              }
            }, function(error) {
              _onError("Failed to open file (call): " + fname, error);
            });
          }
        };

        // FIXME: Send relative path
        if ( fname ) {
          _open(fname);
        } else {
          this._createDialog('File', [{type: 'open', mime: 'text/plain'}, function(btn, fname) {
            if ( btn !== 'ok' ) return;
            _open(fname);
          }], w);
        }
      break;
    }
  };


  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationTextpad = ApplicationTextpad;

})(OSjs.Core.Application, OSjs.Core.Window);
