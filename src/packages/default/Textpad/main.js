(function(Application, Window, GUI) {

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

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

    var menuBar = this._addGUIElement(new GUI.MenuBar('ApplicationTextpadMenuBar'), root);
    menuBar.addItem(OSjs._("File"), [
      {title: OSjs._('New'), name: 'New', onClick: function() {
        app.action('new');
      }},
      {title: OSjs._('Open'), name: 'Open', onClick: function() {
        app.action('open');
      }},
      {title: OSjs._('Save'), name: 'Save', onClick: function() {
        app.action('save');
      }},
      {title: OSjs._('Save As...'), name: 'SaveAs', onClick: function() {
        app.action('saveas');
      }},
      {title: OSjs._('Close'), name: 'Close', onClick: function() {
        self._close();
      }}
    ]);

    menuBar.onMenuOpen = function(menu) {
      menu.setItemDisabled("Save", app.currentFilename ? false : true);
    };

    this._addGUIElement(new GUI.Textarea('TextpadTextarea'), root);

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
    var gel = this._getGUIElement('TextpadTextarea');
    if ( gel && gel.hasChanged ) {
      return this._appRef.onConfirmDialog(this, msg, function(discard) {
        if ( discard ) {
          gel.hasChanged = false;
        }
        callback(discard);
      });
    }
    return false;
  };

  ApplicationTextpadWindow.prototype.setChanged = function(c) {
    var gel  = this._getGUIElement('TextpadTextarea');
    if ( gel ) {
      gel.hasChanged = false;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var ApplicationTextpad = function(args, metadata) {
    Application.apply(this, ['ApplicationTextpad', args, metadata]);

    this.dialogOptions.mimes = metadata.mime;
    this.dialogOptions.defaultFilename = "New text file.txt";
    this.dialogOptions.defaultMime = "text/plain";
  };

  ApplicationTextpad.prototype = Object.create(Application.prototype);

  ApplicationTextpad.prototype.init = function(core, settings, metadata) {
    Application.prototype.init.apply(this, arguments);
    this.mainWindow = this._addWindow(new ApplicationTextpadWindow(this, {width: 450, height: 300}, metadata));
  };

  ApplicationTextpad.prototype.onNew = function() {
    if ( this.mainWindow ) {
      this.mainWindow.setChanged(false);
      this.mainWindow.setText('', null);
      this.mainWindow._focus();
    }
  };

  ApplicationTextpad.prototype.onOpen = function(filename, mime, data) {
    if ( this.mainWindow ) {
      this.mainWindow.setChanged(false);
      this.mainWindow.setText(data, filename);
      this.mainWindow._focus();
    }
  };

  ApplicationTextpad.prototype.onSave = function(filename, mime, data) {
    if ( this.mainWindow ) {
      this.mainWindow.setChanged(false);
      this.mainWindow.setTitle(filename);
      this.mainWindow._focus();
    }
  };

  ApplicationTextpad.prototype.onCheckChanged = function(callback) {
    var msg = OSjs._("Discard current document ?");

    var self = this;
    var _cb = function(discard) {
      self.mainWindow._focus();

      callback(discard);
    };

    if ( this.mainWindow ) {
      if ( this.mainWindow.checkChanged(function(discard) { _cb(discard); }, msg) === false ) {
        _cb(true);
      }
    }
  };

  ApplicationTextpad.prototype.onGetSaveData = function(callback) {
    var data = null;
    if ( this.mainWindow ) {
      data = this.mainWindow.getText();
    }
    callback(data);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationTextpad = ApplicationTextpad;

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.GUI);
