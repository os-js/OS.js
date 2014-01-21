(function(WindowManager, GUI) {

  var DefaultCategories = {
    development : {icon: 'categories/package_development.png', title: 'Development'},
    education   : {icon: 'categories/applications-sience.png', title: 'Education'},
    games       : {icon: 'categories/package_games.png',       title: 'Games'},
    graphics    : {icon: 'categories/package_graphics.png',    title: 'Graphics'},
    network     : {icon: 'categories/package_network.png',     title: 'Network'},
    multimedia  : {icon: 'categories/package_multimedia.png',  title: 'Multimedia'},
    office      : {icon: 'categories/package_office.png',      title: 'Office'},
    system      : {icon: 'categories/package_system.png',      title: 'System'},
    utilities   : {icon: 'categories/package_utilities.png',   title: 'Utilities'},
    unknown     : {icon: 'categories/applications-other.png',  title: 'Other'}
  };

  /////////////////////////////////////////////////////////////////////////////
  // Window Switcher
  /////////////////////////////////////////////////////////////////////////////

  var WindowSwitcher = function() {
    this.$switcher      = null;
    this.showing        = false;
    this.index          = -1;
  };

  WindowSwitcher.prototype.init = function() {
    this.$switcher = document.createElement('div');
    this.$switcher.id = 'WindowSwitcher';
  };

  WindowSwitcher.prototype.destroy = function() {
    if ( this.$switcher ) {
      if ( this.$switcher.parentNode ) {
        this.$switcher.parentNode.removeChild(this.$switcher);
      }
      this.$switcher = null;
    }
  };

  WindowSwitcher.prototype.show = function(ev, win, wm) {
    ev.preventDefault();

    var list  = [];
    var index = 0;
    var i = 0, l = wm._windows.length, iter;

    for ( i; i < l; i++ ) {
      iter = wm._windows[i];
      if ( !iter ) { continue; }

      list.push({
        title:    iter._title,
        icon:     iter._icon
      });

      if ( index === 0 ) {
        if ( (win && win._wid === iter._wid) ) {
           index = i;
        }
      }
    }

    if ( this.index === -1 ) {
      this.index = index;
    } else {
      this.index++;
      if ( this.index >= l ) {
        this.index = 0;
      }

      index = this.index;
    }

    var height = 0;
    var root = this.$switcher;
    OSjs.Utils.$empty(root);

    var container, image, label;
    for ( i = 0; i < l; i++ ) {
      iter = list[i];
      if ( !iter ) { continue; }

      container       = document.createElement('div');

      image           = document.createElement('img');
      image.src       = iter.icon;

      label           = document.createElement('span');
      label.innerHTML = iter.title;

      if ( i === index ) {
        container.className = 'Active';
      }

      container.appendChild(image);
      container.appendChild(label);
      root.appendChild(container);

      height += 32;
    }

    if ( !root.parentNode ) {
      document.body.appendChild(root);
    }

    root.style.height = height + 'px';
    root.style.marginTop = (height ? -((height/2) << 0) : 0) + 'px';

    this.showing = true;
    this.index = index;
  };

  WindowSwitcher.prototype.hide = function(ev, win, wm) {
    if ( !this.showing ) { return; }

    ev.preventDefault();

    if ( this.$switcher && this.$switcher.parentNode ) {
      this.$switcher.parentNode.removeChild(this.$switcher);
    }

    if ( this.index >= 0 ) {
      var found = false;
      if ( wm._windows[this.index] ) {
        wm._windows[this.index]._focus();
        found = true;
      }

      if ( !found && win ) {
        win._focus();
      }
    }

    this.index   = -1;
    this.showing = false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // PANELS
  /////////////////////////////////////////////////////////////////////////////

  var Panel = function(name, options) {
    options = options || {};

    this._name = name;
    this._$element = null;
    this._$container = null;
    this._items = [];
    this._options = {
      position: options.position || 'top',
      ontop:    options.ontop === true
    };
  };

  Panel.prototype.init = function(root) {
    var self = this;

    this._$container = document.createElement('ul');

    this._$element = document.createElement('div');
    this._$element.className = 'WMPanel';

    this._$element.onmousedown = function(ev) {
      ev.preventDefault();
      return false;
    };
    this._$element.onclick = function(ev) {
      OSjs.GUI.blurMenu();
    };
    this._$element.oncontextmenu = function(ev) {
      OSjs.GUI.blurMenu();
      return false;
    };

    this._$element.appendChild(this._$container);
    root.appendChild(this._$element);

    setTimeout(function() {
      self.update();
    }, 0);
  };

  Panel.prototype.destroy = function() {
    for ( var i = 0; i < this._items.length; i++ ) {
      this._items[i].destroy();
    }
    this._items = [];

    if ( this._$element && this._$element.parentNode ) {
      this._$element.onmousedown = null;
      this._$element.onclick = null;
      this._$element.oncontextmenu = null;
      this._$element.parentNode.removeChild(this._$element);
      this._$element = null;
    }
  };

  Panel.prototype.update = function(options) {
    options = options || this._options;

    var cn = ['WMPanel'];
    if ( options.ontop ) {
      cn.push('Ontop');
    }
    if ( options.position ) {
      cn.push(options.position == 'top' ? 'Top' : 'Bottom');
    }
    this._$element.className = cn.join(' ');
    this._options = options;
  };

  Panel.prototype.addItem = function(item) {
    if ( !(item instanceof OSjs.CoreWM.PanelItem) ) {
      throw "Expected a PanelItem in Panel::addItem()";
    }

    this._items.push(item);
    this._$container.appendChild(item.init());
  };

  Panel.prototype.getItem = function(type) {
    for ( var i = 0; i < this._items.length; i++ ) {
      if ( this._items[i] instanceof type ) {
        return this._items[i];
      }
    }
    return null;
  };

  Panel.prototype.getOntop = function() {
    return this._options.ontop;
  };

  Panel.prototype.getPosition = function() {
    return this._options.position;
  };

  Panel.prototype.getRoot = function() {
    return this._$element;
  };

  /////////////////////////////////////////////////////////////////////////////
  // PANEL ITEM
  /////////////////////////////////////////////////////////////////////////////

  var PanelItem = function(className) {
    this._$root = null;
    this._className = className || 'Unknown';
  };

  PanelItem.prototype.init = function() {
    this._$root = document.createElement('li');
    this._$root.className = 'PanelItem ' + this._className;

    return this._$root;
  };

  PanelItem.prototype.destroy = function() {
    if ( this._$root ) {
      if ( this._$root.parentNode ) {
        this._$root.parentNode.removeChild(this._$root);
      }
      this._$root = null;
    }
  };

  PanelItem.prototype.getRoot = function() {
    return this._$root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function _createIcon(aiter, aname) {
    return OSjs.API.getIcon(aiter.icon, aiter);
  }

  /**
   * Create default application menu
   */
  function BuildMenu(ev) {
    var apps = OSjs.API.getHandlerInstance().getApplicationsMetadata();
    var list = [];
    for ( var a in apps ) {
      if ( apps.hasOwnProperty(a) ) {
        if ( apps[a].type === "service" || apps[a].type === "special" ) { continue; }
        list.push({
          title: apps[a].name,
          icon: _createIcon(apps[a], a),
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

  /**
   * Create default application menu with categories (sub-menus)
   */
  function BuildCategoryMenu(ev) {
    var apps = OSjs.API.getHandlerInstance().getApplicationsMetadata();
    var list = [];
    var cats = {};

    var c, a, iter, cat, submenu;

    for ( c in DefaultCategories ) {
      if ( DefaultCategories.hasOwnProperty(c) ) {
        cats[c] = [];
      }
    }

    for ( a in apps ) {
      if ( apps.hasOwnProperty(a) ) {
        iter = apps[a];
        if ( iter.type === "service" || iter.type === "special" ) { continue; }
        cat = iter.category && cats[iter.category] ? iter.category : 'unknown';
        cats[cat].push({name: a, data: iter})
      }
    }

    for ( c in cats ) {
      if ( cats.hasOwnProperty(c) ) {
        submenu = [];
        for ( a = 0; a < cats[c].length; a++ ) {
          iter = cats[c][a];
          submenu.push({
            title: iter.data.name,
            icon: _createIcon(iter.data, iter.name),
            onClick: (function(name, iter) {
              return function() {
                OSjs.API.launch(name);
              };
            })(iter.name, iter.data)
          });
        }

        if ( submenu.length ) {
          list.push({
            title: DefaultCategories[c].title,
            icon:  OSjs.API.getThemeResource(DefaultCategories[c].icon, 'icon', '16x16'),
            menu:  submenu
          });
        }
      }
    }

    GUI.createMenu(list, {x: ev.clientX, y: ev.clientY});
  }

  //
  // EXPORTS
  //
  OSjs.CoreWM                   = OSjs.CoreWM       || {};
  OSjs.CoreWM.BuildMenu         = BuildMenu;
  OSjs.CoreWM.BuildCategoryMenu = BuildCategoryMenu;
  OSjs.CoreWM.Panel             = Panel;
  OSjs.CoreWM.PanelItem         = PanelItem;
  OSjs.CoreWM.PanelItems        = {};
  OSjs.CoreWM.WindowSwitcher    = WindowSwitcher;

})(OSjs.Core.WindowManager, OSjs.GUI);
