(function(Application, Window) {

  /**
   * Main Window
   */
  var ApplicationSettingsWindow = function(app, opts) {
    Window.apply(this, ['ApplicationSettingsWindow', opts, app]);

    this.title = "Settings";
    this._title = this.title;
    this._icon = "/themes/default/icons/16x16/categories/applications-system.png";
  };

  ApplicationSettingsWindow.prototype = Object.create(Window.prototype);

  ApplicationSettingsWindow.prototype.init = function() {
    Window.prototype.init.apply(this, arguments);

    var app = this._appRef;
  };

  ApplicationSettingsWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  /**
   * Application
   */
  var ApplicationSettings = function(args, metadata) {
    Application.apply(this, ['ApplicationSettings', args, metadata]);
  };

  ApplicationSettings.prototype = Object.create(Application.prototype);

  ApplicationSettings.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, []);
  };

  ApplicationSettings.prototype.init = function(core, session) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationSettingsWindow(this, {width: 400, height: 200}));
  };

  ApplicationSettings.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationSettingsWindow' ) {
      this.destroy();
    }
  };


  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = ApplicationSettings;

})(OSjs.Core.Application, OSjs.Core.Window);
