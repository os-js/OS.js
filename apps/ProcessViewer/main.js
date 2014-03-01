(function(Application, Window, GUI) {

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window
   */
  var ApplicationProcessViewerWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationProcessViewerWindow', {width: 400, height: 400}, app]);

    this._title = metadata.name;
    this._icon = metadata.icon;
  };

  ApplicationProcessViewerWindow.prototype = Object.create(Window.prototype);

  ApplicationProcessViewerWindow.prototype.init = function() {
    var root = Window.prototype.init.apply(this, arguments);

    var listView = this._addGUIElement(new GUI.ListView('ProcessViewListView', {indexKey: 'pid'}), root);
    listView.setColumns([
      {key: 'pid',    title: OSjs._('PID'), domProperties: {width: "50"}},
      {key: 'name',   title: OSjs._('Name')},
      {key: 'alive',  title: OSjs._('Alive'), domProperties: {width: "100"}},
      {key: 'kill',   title: '', type: 'button', domProperties: {width: "45"}}
    ]);


    return root;
  };

  ApplicationProcessViewerWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationProcessViewerWindow.prototype.refresh = function(rows) {
    var listView = this._getGUIElement('ProcessViewListView');
    if ( listView ) {
      listView.setRows(rows);
      listView.render();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var ApplicationProcessViewer = function(args, metadata) {
    Application.apply(this, ['ApplicationProcessViewer', args, metadata]);
  };

  ApplicationProcessViewer.prototype = Object.create(Application.prototype);

  ApplicationProcessViewer.prototype.destroy = function(kill) {
    if ( this.timer ) {
      clearInterval(this.timer);
      this.timer = null;
    }
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationProcessViewer.prototype.init = function(core, settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationProcessViewerWindow(this, metadata));

    var self = this;
    this.timer = setInterval(function() {
      self.refreshList();
    }, 2500);

    this.refreshList();
  };

  ApplicationProcessViewer.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationProcessViewerWindow' ) {
      this.destroy();
    }
  };

  ApplicationProcessViewer.prototype.refreshList = function() {
    var w = this._getWindow('ApplicationProcessViewerWindow');
    var r = w ? w._getRoot() : null;
    var core = OSjs.API.getCoreInstance();

    if ( r ) {
      var rows = [];
      var procs = core.ps();
      var now = new Date();

      var i = 0, l = procs.length;
      var cev;
      for ( i; i < l; i++ ) {
        cev = (function(pid) {
          return function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            core.kill(pid);
            return false;
          };
        })(procs[i].pid);

        rows.push({
          pid: procs[i].pid,
          name: procs[i].name,
          alive: now-procs[i].started,
          kill: 'Kill',
          customEvent: cev
        });
      }

      w.refresh(rows);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationProcessViewer = ApplicationProcessViewer;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI);
