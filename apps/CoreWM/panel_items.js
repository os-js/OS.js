(function(CoreWM, Panel, PanelItem) {

  /**
   * PanelItem: Buttons
   */
  var PanelItemButtons = function() {
    PanelItem.apply(this, ['PanelItemButtons']);

    this.$container = null;
  };

  PanelItemButtons.prototype = Object.create(PanelItem.prototype);

  PanelItemButtons.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$container = document.createElement('ul');
    root.appendChild(this.$container);

    this.addButton('Applications', 'categories/applications-other.png', function(ev) {
      ev.stopPropagation();
      var wm = OSjs.API.getWMInstance();
      if ( wm && wm.getSetting('menuCategories') ) {
        OSjs.CoreWM.BuildCategoryMenu(ev);
      } else {
        OSjs.CoreWM.BuildMenu(ev);
      }
      return false;
    });

    this.addButton('Log out (Exit)', 'actions/exit.png', function(ev) {
      var user = OSjs.API.getHandlerInstance().getUserData() || {name: 'Unknown'};
      var t = confirm("Logging out user '" + user.name + "'.\nDo you want to save current session?");
      OSjs._shutdown(t, false);
    });

    return root;
  };

  PanelItemButtons.prototype.destroy = function() {
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemButtons.prototype.addButton = function(title, icon, callback) {
    icon = OSjs.API.getThemeResource(icon, 'icon');

    var sel = document.createElement('li');
    sel.className = 'Button';
    sel.title = title;
    sel.innerHTML = '<img alt="" src="' + icon + '" />';
    sel.onclick = callback;

    this.$container.appendChild(sel);
  };

  /**
   * PanelItem: WindowList
   */
  var PanelItemWindowList = function() {
    PanelItem.apply(this, ['PanelItemWindowList']);

    this.$element = null;
  };

  PanelItemWindowList.prototype = Object.create(PanelItem.prototype);

  PanelItemWindowList.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$element = document.createElement('ul');

    root.appendChild(this.$element);
    return root;
  };

  PanelItemWindowList.prototype.destroy = function() {
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemWindowList.prototype.update = function(ev, win) {
    var self = this;
    if ( !this.$element || (win && win._properties.allow_windowlist === false) ) {
      return;
    }

    var cn = 'WindowList_Window_' + win._wid;
    var _change = function(cn, callback) {
      var els = self.$element.getElementsByClassName(cn);
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
      el.className = 'Button WindowList_Window_' + win._wid;
      el.title = win._title;
      el.onclick = function() {
        win._restore();
      };
      this.$element.appendChild(el);
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
        el.className = el.className.replace(/\s?Focused/, '');
      });
    } else if ( ev == 'title' ) {
      _change(cn, function(el) {
        el.getElementsByTagName('span')[0].innerHTML = win._title;
        el.title = win._title;
      });
    }
  };

  /**
   * PanelItem: Clock
   */
  var PanelItemClock = function() {
    PanelItem.apply(this, ['PanelItemClock']);
    this.clockInterval  = null;
  };

  PanelItemClock.prototype = Object.create(PanelItem.prototype);

  PanelItemClock.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    var clock = document.createElement('div');
    clock.innerHTML = '00:00';
    var _updateClock = function() {
      var d = new Date();
      clock.innerHTML = d.toLocaleTimeString();
      clock.title     = d.toLocaleDateString();
    };
    this.clockInterval = setInterval(_updateClock, 1000);
    _updateClock();

    root.appendChild(clock);

    return root;
  };

  PanelItemClock.prototype.destroy = function() {
    if ( this.clockInterval ) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }

    PanelItem.prototype.destroy.apply(this, arguments);
  };

  //
  // EXPORTS
  //
  OSjs.CoreWM                   = OSjs.CoreWM             || {};
  OSjs.CoreWM.PanelItems        = OSjs.CoreWM.PanelItems  || {};

  OSjs.CoreWM.PanelItems.Buttons    = PanelItemButtons;
  OSjs.CoreWM.PanelItems.WindowList = PanelItemWindowList;
  OSjs.CoreWM.PanelItems.Clock      = PanelItemClock;

})(OSjs.CoreWM, OSjs.CoreWM.Panel, OSjs.CoreWM.PanelItem);

