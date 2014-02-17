(function(Application, Window) {

  /**
   * Main Window
   */
  var ApplicationTextpadWindow = function(app, opts, metadata) {
    Window.apply(this, ['ApplicationTextpadWindow', opts, app]);

    this.title  = metadata.name;
    this._icon  = metadata.icon;
    this._title = this.title;
  };

  ApplicationTextpadWindow.prototype = Object.create(Window.prototype);

  ApplicationTextpadWindow.prototype.init = function(wmref, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    var menuBar = this._addGUIElement(new OSjs.GUI.MenuBar('ApplicationTextpadMenuBar'), root);
    menuBar.addItem("File", [
      {title: 'New', name: 'New', onClick: function() {
        app.defaultAction('new');
      }},
      {title: 'Open', name: 'Open', onClick: function() {
        app.defaultAction('open');
      }},
      {title: 'Save', name: 'Save', onClick: function() {
        app.defaultAction('save');
      }},
      {title: 'Save As...', name: 'SaveAs', onClick: function() {
        app.defaultAction('saveas');
      }},
      {title: 'Close', name: 'Close', onClick: function() {
        self._close();
      }}
    ]);

    menuBar.onMenuOpen = function(menu) {
      menu.setItemDisabled("Save", app.currentFile.path ? false : true);
    };

    this._addGUIElement(new OSjs.GUI.Textarea('TextpadTextarea'), root);

    this.setText(null);
  };

  ApplicationTextpadWindow.prototype.setText = function(t, name) {
    var txt = this._getGUIElement('TextpadTextarea');
    if ( !txt ) return;
    txt.hasChanged = false;
    txt.setText(t);
    this.setTitle(name);
  };

  ApplicationTextpadWindow.prototype.getText = function() {
    var txt = this._getGUIElement('TextpadTextarea');
    return txt ? txt.getText() : '';
  };

  ApplicationTextpadWindow.prototype.setTitle = function(name) {
    name = name || "New file";
    this._setTitle(this.title + " - " + OSjs.Utils.filename(name));
  };

  ApplicationTextpadWindow.prototype._focus = function() {
    Window.prototype._focus.apply(this, arguments);
    var txt = this._getGUIElement('TextpadTextarea');
    if ( txt ) {
      txt.focus();
    }
  };

  ApplicationTextpadWindow.prototype.checkChanged = function(callback, msg) {
    var gel  = this._getGUIElement('TextpadTextarea');
    if ( gel && gel.hasChanged ) {
      return this._appRef.defaultConfirmClose(this, msg, function() {
        gel.hasChanged = false;
        callback();
      });
    }
    return false;
  };

  /**
   * Application
   */
  var ApplicationTextpad = function(args, metadata) {
    var self = this;
    Application.apply(this, ['ApplicationTextpad', args, metadata]);

    this.defaultActionWindow  = 'ApplicationTextpadWindow';
    this.defaultFilename      = "New text file.txt";
    this.defaultMime          = 'text/plain';
    this.acceptMime           = metadata.mime || null;
    this.getSaveData          = function() {
      var w = self._getWindow('ApplicationTextpadWindow');
      return w ? w.getText() : null;
    };

    this.defaultActionError = function(action, error) {
      var w = self._getWindow('ApplicationTextpadWindow');
      var msg = "An error occured in action: " + action;
      if ( w ) {
        w._error("Textpad error", msg, error);
      } else {
        OSjs.API.error("Textpad error", msg, error);
      }
    };

    this.defaultActionSuccess = function(action, arg1, arg2) {
      var w = self._getWindow('ApplicationTextpadWindow');
      if ( w ) {
        var msg = "Discard current document ?";
        var _new = function() {
          w.setText('', null);
        };
        var _open = function() {
          w.setText(arg1, arg2.path);
        };
        if ( action === 'open' ) {
          if ( w.checkChanged(function() { _open(); }, msg) === false ) {
            _open();
          }
        } else {
          if ( action === 'new' ) {
            if ( w.checkChanged(function() { _new(); }, msg) === false ) {
              _new();
            }
          } else {
            w.setTitle(arg1 ? arg1.path : null);
          }
        }
        w._focus();
      }
    };
  };

  ApplicationTextpad.prototype = Object.create(Application.prototype);

  ApplicationTextpad.prototype.init = function(core, session, metadata) {
    this._addWindow(new ApplicationTextpadWindow(this, {width: 450, height: 300}, metadata));
    Application.prototype.init.apply(this, arguments);
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationTextpad = ApplicationTextpad;

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow);
