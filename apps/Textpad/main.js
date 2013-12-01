(function(Application, Window) {

  /**
   * Main Window
   */
  var ApplicationTextpadWindow = function(app, opts) {
    this.title = "Textpad";

    Window.apply(this, ['ApplicationTextpadWindow', opts, app]);
    this._icon = "apps/accessories-text-editor.png";
    this._title = this.title;
    this._properties.allow_drop = true;
  };

  ApplicationTextpadWindow.prototype = Object.create(Window.prototype);

  ApplicationTextpadWindow.prototype.init = function() {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    var app = this._appRef;

    var menuBar = this._addGUIElement(new OSjs.GUI.MenuBar('ApplicationTextpadMenuBar'), root);
    menuBar.addItem("File", [
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
        self._close();
      }}
    ]);

    menuBar.onMenuOpen = function(menu) {
      var el = menu.getRoot().getElementsByClassName("MenuItem_Save")[0];
      if ( el ) {
        if ( app.currentFile ) {
          el.className = el.className.replace(/\s?Disabled/, '');
        } else {
          el.className += ' Disabled';
        }
      }
    };

    this._addGUIElement(new OSjs.GUI.Textarea('TextpadTextarea'), root);

    this.setText(null);
  };

  ApplicationTextpadWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationTextpadWindow.prototype._onDndEvent = function(ev, type, item, args) {
    Window.prototype._onDndEvent.apply(this, arguments);
    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._appRef.action('open', data.path, data.mime);
      }
    }
  };

  ApplicationTextpadWindow.prototype.setText = function(t, name) {
    var txt = this._getGUIElement('TextpadTextarea');
    if ( !txt ) return;

    if ( t === null ) {
      txt.setText("");
      this.refresh("New file");
      return;
    }

    txt.setText(t);
    this.refresh(name);
  };

  ApplicationTextpadWindow.prototype.getText = function() {
    var txt = this._getGUIElement('TextpadTextarea');
    return txt ? txt.getText() : '';
  };

  ApplicationTextpadWindow.prototype.refresh = function(name) {
    this._setTitle(this.title + " - " + OSjs.Utils.filename(name));
  };

  ApplicationTextpadWindow.prototype._focus = function() {
    Window.prototype._focus.apply(this, arguments);
    var txt = this._getGUIElement('TextpadTextarea');
    if ( txt ) {
      txt.focus();
    }
  };

  ApplicationTextpadWindow.prototype._close = function() {
    var gel = this._getGUIElement('TextpadTextarea');
    if ( gel && gel.hasChanged ) {
      var self = this;
      this._toggleDisabled(true);
      this._appRef._createDialog('Confirm', ['Quit without saving?', function(btn) {
        self._toggleDisabled(false);
        if ( btn == "ok" ) {
          gel.hasChanged = false;
          self._close();
        }
      }]);
      return false;
    }

    return Window.prototype._close.apply(this, arguments);
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
    var mime = this._getArgument('mime');
    if ( open ) {
      this.action('open', open, mime);
    }
  };

  ApplicationTextpad.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationTextpadWindow' ) {
      this.destroy();
    }
  };

  ApplicationTextpad.prototype.action = function(action, fname, mime) {
    var self = this;
    var w = this._getWindow('ApplicationTextpadWindow');
    if ( !w ) return;

    var _setSession = function(name, mime, content) {
      self.currentFile = name;
      self._setArgument('file', name);
      self._setArgument('mime', mime || null);
      w.refresh(name);

      if ( typeof content !== 'undefined' ) {
        w.setText(content, self.currentFile);
        w._focus();
      }
    };

    var _onError = function(msg, err) {
      if ( w ) {
        w._error("Textpad error", msg, err);
      } else {
        OSjs.API.error("Textpad error", msg, err);
      }
    };

    var _writeFile = function(fname) {
      var data = w.getText();

      OSjs.API.call('fs', {'method': 'file_put_contents', 'arguments': [fname, data]}, function(res) {
        if ( res.result ) {
          _setSession(fname);
        } else {
          if ( res.error ) {
            _onError("An error occured while handling your request", res.error);
          } else {
            _onError("Failed to save file: " + fname, "Fatal error");
          }
        }
        w._focus();
      }, function(error) {
        _onError("Failed to save file (call): " + fname, error);
      });
    };

    switch ( action ) {
      case 'new' :
        _setSession(null, null, null);
      break;

      case 'save' :
        if ( this.currentFile ) {
          _writeFile(this.currentFile);
        }
      break;

      case 'saveas' :
        var dir = this.currentFile ? OSjs.Utils.dirname(this.currentFile) : null;
        var fnm = this.currentFile ? OSjs.Utils.filename(this.currentFile) : null;
        this._createDialog('File', [{type: 'save', path: dir, filename: fnm, mime: 'text/plain', mimes: ['^text'], defaultFilename: "New Text File.txt"}, function(btn, fname) {
            if ( btn !== 'ok' ) return;
          _writeFile(fname);
        }], w);
      break;

      case 'open' :
        var _open = function(fname, mime) {
          if ( mime && !mime.match(/^text/) ) {
            _onError("Cannot open file", "Not supported!");
            return;
          }

          if ( fname ) {
            OSjs.API.call('fs', {'method': 'file_get_contents', 'arguments': [fname]}, function(res) {
              if ( !res ) return;

              if ( res.result ) {
                _setSession(fname, mime, res.result);
              } else {
                if ( res.error ) {
                  _onError("Failed to open file: " + fname, res.error);
                }
                _setSession(null, null, null);
              }
              w._focus();
            }, function(error) {
              _onError("Failed to open file (call): " + fname, error);
            });
          }
        };

        if ( fname ) {
          _open(fname, mime);
        } else {
          var path = (this.currentFile) ? OSjs.Utils.dirname(this.currentFile) : null;
          this._createDialog('File', [{type: 'open', mime: 'text/plain', mimes: ['^text'], path: path}, function(btn, fname, fmime) {
            if ( btn !== 'ok' ) return;
            _open(fname, fmime);
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
