(function(WindowManager, GUI) {
  // TODO: Panel
  // TODO: PanelItem's

  /**
   * Application
   */
  var CoreWM = function(args, metadata) {
    WindowManager.apply(this, ['CoreWM', this, args, metadata]);

    var root = document.createElement('div');
    root.id = 'WindowList';
    root.oncontextmenu = function(ev) {
      OSjs.GUI.blurMenu();
      return false;
    };

    var el = document.createElement('ul');

    var icon = OSjs.API.getThemeResource('categories/applications-other.png', 'icon');
    var sel;
    sel = document.createElement('li');
    sel.innerHTML = '<img alt="" src="' + icon + '" />';
    sel.onclick = function(ev) {
      var p = OSjs.API.getCoreService();
      if ( p ) {
        var apps = p.getApplicationCache();
        var list = [];
        for ( var a in apps ) {
          if ( apps.hasOwnProperty(a) ) {
            //if ( a.match(/^Core/) ) continue;
            if ( apps[a].type === "service" || apps[a].type === "special" ) continue;
            list.push({
              title: apps[a].name,
              icon: apps[a].icon,
              onClick: (function(name, iter) {
                return function() {
                  OSjs.API.launch(name);
                };
              })(a, apps[a])
            });
          }
        }
        GUI.createMenu(list, {x: ev.clientX, y: ev.clientY});
      }
    };
    el.appendChild(sel);

    icon = OSjs.API.getThemeResource('actions/exit.png', 'icon');
    sel = document.createElement('li');
    sel.innerHTML = '<img alt="" src="' + icon + '" />';
    sel.onclick = function() {
      var t = confirm("Do you want to save current session?");
      OSjs.shutdown(t, false);
    };
    el.appendChild(sel);

    var back = document.createElement('div');
    back.className = 'Background';

    root.appendChild(el);
    root.appendChild(back);

    this._$element = el;
    this._$root = root;

    document.body.appendChild(this._$root);
  };

  CoreWM.prototype = Object.create(WindowManager.prototype);

  CoreWM.prototype.destroy = function(kill) {
    if ( kill && !confirm("Killing this process will stop things from working!") ) {
      return false;
    }

    if ( this._$root && this._$root.parentNode ) {
      this._$root.parentNode.removeChild(this._$root);
    }

    return WindowManager.prototype.destroy.apply(this, []);
  };

  CoreWM.prototype.eventWindow = function(ev, win) {
    if ( win && win._properties.allow_windowlist === false ) {
      return;
    }
    console.log("OSjs::Applications::CoreWM::eventWindow", ev, win._name);

    var cn = 'WindowList_Window_' + win._wid;
    var self = this;
    var _change = function(cn, callback) {
      var els = self._$element.getElementsByClassName(cn);
      if ( els.length ) {
        for ( var i = 0, l = els.length; i < l; i++ ) {
          if ( els[i] && els[i].parentNode ) {
            callback(els[i]);
          }
        }
      }
    };

    if ( ev == 'create' ) {
      var el = document.createElement('li');
      el.innerHTML = '<img alt="" src="' + win._icon + '" /><span>' + win._title + '</span>';
      el.className = 'WindowList_Window_' + win._wid;
      el.onclick = function() {
        win._restore();
      };
      this._$element.appendChild(el);
    } else if ( ev == 'close' ) {
      _change(cn, function(el) {
        el.parentNode.removeChild(el);
      });
    } else if ( ev == 'focus' ) {
      _change(cn, function(el) {
        el.className += ' Focused';
      });
    } else if ( ev == 'blur' ) {
      _change(cn, function(el) {
        el.className = el.className.replace(' Focused', '');
      });
    } else if ( ev == 'title' ) {
      _change(cn, function(el) {
        el.getElementsByTagName('span')[0].innerHTML = win._title;
      });
    }
  };

  CoreWM.prototype.applySettings = function() {
    if ( !WindowManager.prototype.applySettings.apply(this, arguments) ) {
      return false;
    }

    var classNames = [];
    var opts = this.getSetting('taskbar');
    if ( opts ) {
      if ( opts.ontop ) {
        classNames.push('Ontop');
      }
      classNames.push(opts.position == 'top' ? 'Top' : 'Button');
    }

    this._$root.className = classNames.join(' ');

    return true;
  };

  CoreWM.prototype.getWindowSpace = function() {
    var s = WindowManager.prototype.getWindowSpace.apply(this, arguments);
    var t = this.getSetting('taskbar');
    if ( t.ontop ) {
      if ( t.position == 'top' ) {
        s.top += 35;
        s.height -= 35;
      } else {
        s.height -= 70;
      }
    }

    var d = this.getSetting('desktop');
    if ( d.margin ) {
      s.top += d.margin;
      s.left += d.margin;
      s.width -= (d.margin * 2);
      s.height -= (d.margin * 2);
    }

    return s;
  };

  CoreWM.prototype.getWindowPosition = function() {
    var pos = WindowManager.prototype.getWindowPosition.apply(this, arguments);
    if ( pos.y < 60 ) {
      pos.y += (60 - pos.y);
    }
    return pos;
  };


  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.CoreWM = CoreWM;

})(OSjs.Core.WindowManager, OSjs.GUI);
