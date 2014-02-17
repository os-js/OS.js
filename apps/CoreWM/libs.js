(function(WindowManager, Window, GUI) {

  var _Locales = {
    no_NO : {
      'CoreWM Settings' : 'CoreWM Instillinger',
      'Theme and Background' : 'Tema og Bakgrunn',
      'Desktop Settings' : 'Skrivebord Instillinger',
      'Panels' : 'Panel',
      'Theme' : 'Tema',
      'Background Type' : 'Bakgrunn type',
      'Image' : 'Bilde',
      'Image (Repeat)' : 'Bilde (Gjenta)',
      'Image (Centered)' : 'Bilde (Sentrert)',
      'Image (Fill)' : 'Bilde (Fyll)',
      'Image (Streched)' : 'Bilde (Strekk)',
      'Color' : 'Farge',
      'Background Image' : 'Bakgrunn Bilde',
      'Background Color' : 'Bakgrunn Farge',
      'Font' : 'Skrift-type',
      'Desktop Margin ({0}px)' : 'Skrivebord Margin ({0}px)',
      'Panel Position' : 'Panel Posisjon',
      'Top' : 'Topp',
      'Bottom' : 'Bunn',
      'Panel Ontop ?' : 'Panel på topp?',
      'Yes' : 'Ja',
      'No' : 'Nei',
      'Panel Items' : 'Panel objekter',
      'Name' : 'Navn',
      'Use animations ?' : 'Bruk animasjoner ?',
      'Apply' : 'Bruk',
      'Locales' : 'Lokalisering',
      'Language (requires restart)' : 'Språk (krever omstart)',

      'Development' : 'Utvikling',
      'Education' : 'Utdanning',
      'Games' : 'Spill',
      'Graphics' : 'Grafikk',
      'Network' : 'Nettverk',
      'Multimedia' : 'Multimedia',
      'Office' : 'Kontor',
      'System' : 'System',
      'Utilities' : 'Verktøy',
      'Other' : 'Andre'
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return OSjs.__.apply(this, args);
  }

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
  // Settings Window
  /////////////////////////////////////////////////////////////////////////////

  var SettingsWindow = function(app) {
    Window.apply(this, ['CoreWMSettingsWindow', {width: 500, height: 400}, app]);

    this._title                     = _("CoreWM Settings");
    this._icon                      = "categories/applications-system.png";
    this._properties.allow_resize   = false;
    this._properties.allow_maximize = false;
  };

  SettingsWindow.prototype = Object.create(Window.prototype);

  SettingsWindow.prototype.init = function(wm) {
    var self      = this;
    var root      = Window.prototype.init.apply(this, arguments);
    var app       = this._appRef;

    var settings      = wm.getSettings();
    var themes        = wm.getThemes();
    var theme         = wm.getSetting('theme');
    var desktopMargin = settings.desktop.margin;
    var themelist     = {};
    var panelItems    = [
                          {name: 'Buttons'},
                          {name: 'WindowList'},
                          {name: 'Clock'}
                        ];

    var iter;
    for ( var i = 0, l = themes.length; i < l; i++ ) {
      iter = themes[i];
      themelist[iter.name] = iter.title;
    }

    var _createContainer = function(name, lbl) {
      var outer = document.createElement('div');
      outer.className = "Setting Setting_" + name;

      if ( lbl ) {
        var label = document.createElement('label');
        label.innerHTML = lbl;
        outer.appendChild(label);
      }
      return outer;
    };

    var outer, slider;

    var tabs      = this._addGUIElement(new OSjs.GUI.Tabs('SettingTabs'), root);
    var tabStyles = tabs.addTab('Theme', {title: _('Theme and Background')});

    var tabOther  = tabs.addTab('Desktop', {title: _('Desktop Settings'), onSelect: function() {
      slider.setValue(desktopMargin);
    }});

    var tabPanels = tabs.addTab('Panels', {title: _('Panels')});
    var tabLocale = tabs.addTab('Locales', {title: _('Locales')});

    // Theme
    outer = _createContainer('Theme SettingsNoButton', _('Theme'));
    var themeName = this._addGUIElement(new OSjs.GUI.Select('SettingsThemeName'), outer);
    themeName.addItems(themelist);
    themeName.setSelected(theme);
    tabStyles.appendChild(outer);

    //
    // Background Type
    //
    outer = _createContainer('BackgroundType SettingsNoButton', _('Background Type'));
    var backgroundType = this._addGUIElement(new OSjs.GUI.Select('SettingsBackgroundType'), outer);
    backgroundType.addItems({
      'image':        _('Image'),
      'image-repeat': _('Image (Repeat)'),
      'image-center': _('Image (Centered)'),
      'image-fill':   _('Image (Fill)'),
      'image-strech': _('Image (Streched)'),
      'color':        _('Color')
    });
    backgroundType.setSelected(settings.background);
    tabStyles.appendChild(outer);

    //
    // Background Image
    //
    outer = _createContainer('BackgroundImage', _('Background Image'));
    var backgroundImage = this._addGUIElement(new OSjs.GUI.Text('SettingsBackgroundImage', {disabled: true, value: settings.wallpaper}), outer);

    this._addGUIElement(new OSjs.GUI.Button('OpenDialog', {label: '...', onClick: function(el, ev) {
      self.openBackgroundSelect(ev, backgroundImage);
    }}), outer);

    tabStyles.appendChild(outer);

    //
    // Background Color
    //
    outer = _createContainer('BackgroundColor', _('Background Color'));

    var backgroundColor = this._addGUIElement(new OSjs.GUI.Text('SettingsBackgroundColor', {disabled: true, value: settings.style.backgroundColor}), outer);
    backgroundColor.$input.style.backgroundColor = settings.style.backgroundColor;
    backgroundColor.$input.style.color = "#fff";

    this._addGUIElement(new OSjs.GUI.Button('OpenDialog', {label: '...', onClick: function(el, ev) {
      self.openBackgroundColorSelect(ev, backgroundColor);
    }}), outer);

    tabStyles.appendChild(outer);

    //
    // Font
    //
    outer = _createContainer('Font', _('Font'));

    var fontName = this._addGUIElement(new OSjs.GUI.Text('SettingsFont', {disabled: true, value: settings.style.fontFamily}), outer);
    fontName.$input.style.fontFamily = settings.style.fontFamily;

    this._addGUIElement(new OSjs.GUI.Button('OpenDialog', {label: '...', onClick: function(el, ev) {
      self.openFontSelect(ev, fontName);
    }}), outer);

    tabStyles.appendChild(outer);

    //
    // Desktop Margin
    //
    outer = document.createElement('div');
    outer.className = "Setting Setting_DesktopMargin";

    var label = document.createElement('label');
    label.innerHTML = _("Desktop Margin ({0}px)", desktopMargin);

    outer.appendChild(label);
    slider = this._addGUIElement(new OSjs.GUI.Slider('SliderMargin', {min: 0, max: 50, val: desktopMargin}, function(value, percentage) {
      desktopMargin = value;
      label.innerHTML = _("Desktop Margin ({0}px)", desktopMargin);
    }), outer);
    tabOther.appendChild(outer);

    //
    // Panel Position
    //
    outer = _createContainer('PanelPosition SettingsNoButton', _('Panel Position'));
    var panelPosition = this._addGUIElement(new OSjs.GUI.Select('SettingsPanelPosition'), outer);
    panelPosition.addItems({
      'top':      _('Top'),
      'bottom':   _('Bottom')
    });
    panelPosition.setSelected(settings.panels[0].options.position);
    tabPanels.appendChild(outer);

    //
    // Panel Ontop
    //
    outer = _createContainer('PanelOntop SettingsNoButton', _('Panel Ontop ?'));
    var panelOntop = this._addGUIElement(new OSjs.GUI.Select('SettingsPanelOntop'), outer);
    panelOntop.addItems({
      'yes':  _('Yes'),
      'no':   _('No')
    });
    panelOntop.setSelected(settings.panels[0].options.ontop ? 'yes' : 'no');
    tabPanels.appendChild(outer);

    //
    // Panel items
    //
    outer = _createContainer('PanelItems SettingsNoButton', _('Panel Items'));
    var panelItemContainer = document.createElement('div');
    panelItemContainer.className = 'PanelItemsContainer';

    var panelItemButtons = document.createElement('div');
    panelItemButtons.className = 'PanelItemButtons';

    var panelItemButtonAdd = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonAdd', {disabled: true, icon: OSjs.API.getIcon('actions/add.png'), onClick: function(el, ev) {
    }}), panelItemButtons);

    var panelItemButtonRemove = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonRemove', {disabled: true, icon: OSjs.API.getIcon('actions/remove.png'), onClick: function(el, ev) {
    }}), panelItemButtons);

    var panelItemButtonUp = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonUp', {disabled: true, icon: OSjs.API.getIcon('actions/up.png'), onClick: function(el, ev) {
    }}), panelItemButtons);

    var panelItemButtonDown = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonDown', {disabled: true, icon: OSjs.API.getIcon('actions/down.png'), onClick: function(el, ev) {
    }}), panelItemButtons);

    var panelItemList = this._addGUIElement(new OSjs.GUI.ListView('PanelItemListView'), panelItemContainer);
    var addItems = [];
    for ( var j = 0; j < panelItems.length; j++ ) {
      addItems.push({name: panelItems[j].name});
    }
    panelItemList.setColumns([{key: 'name', title: _('Name')}]);
    panelItemList.setRows(addItems);
    panelItemContainer.appendChild(panelItemButtons);
    outer.appendChild(panelItemContainer);
    tabPanels.appendChild(outer);
    panelItemList.render();

    //
    // Misc
    //
    outer = _createContainer('Animations SettingsNoButton', _('Use animations ?'));
    var useAnimations = this._addGUIElement(new OSjs.GUI.Select('SettingsUseAnimations'), outer);
    useAnimations.addItems({
      'yes':  _('Yes'),
      'no':   _('No')
    });
    useAnimations.setSelected(settings.animations ? 'yes' : 'no');
    tabStyles.appendChild(outer);

    //
    // Localization
    //
    outer = document.createElement('div');
    outer.className = "Setting SettingsNoButton Setting_Localization";

    var label = document.createElement('label');
    label.innerHTML = _("Language (requires restart)");

    outer.appendChild(label);
    var useLanguage = this._addGUIElement(new OSjs.GUI.Select('SettingsUseLanguage'), outer);
    var languages = OSjs.API.getHandlerInstance().getConfig('Core').Languages;
    useLanguage.addItems(languages);
    useLanguage.setSelected(OSjs.Locale.getLocale());
    tabLocale.appendChild(outer);

    //
    // Buttons
    //
    this._addGUIElement(new OSjs.GUI.Button('Save', {label: _('Apply'), onClick: function(el, ev) {
      var settings = {
        language:         useLanguage.getValue(),
        //sounds:           useSounds.getValue() == 'yes',
        animations:       useAnimations.getValue() == 'yes',
        panelOntop:       panelOntop.getValue() == 'yes',
        panelPosition:    panelPosition.getValue(),
        panelItems:       panelItems,
        desktopMargin:    desktopMargin,
        desktopFont:      fontName.getValue(),
        theme:            themeName.getValue(),
        backgroundType:   backgroundType.getValue(),
        backgroundImage:  backgroundImage.getValue(),
        backgroundColor:  backgroundColor.getValue()
      };

      var wm = OSjs.API.getWMInstance();
      console.warn("CoreWM::SettingsWindow::save()", settings);
      if ( wm ) {
        var res = wm.applySettings({
          language   : settings.language,
          animations : settings.animations,
          desktop    : {margin: settings.desktopMargin},
          theme      : settings.theme,
          wallpaper  : settings.backgroundImage,
          background : settings.backgroundType,
          panels     : [
            {
              options: {
                position: settings.panelPosition,
                ontop:    settings.panelOntop,
              },
              items:    settings.panelItems
            }
          ],
          style      : {
            fontFamily       : settings.desktopFont,
            backgroundColor  : settings.backgroundColor
          }
        }, false, true);
      }
    }}), root);
  };

  SettingsWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  SettingsWindow.prototype.setTab = function(tab) {
    var tabs = this._getGUIElement('SettingTabs');
    if ( !tab || !tabs ) { return; }
    tabs.setTab(tab);
  };

  SettingsWindow.prototype.openBackgroundSelect = function(ev, input) {
    var curf = input.value ? OSjs.Utils.dirname(input.value) : OSjs.API.getDefaultPath('/');
    var curn = input.value ? OSjs.Utils.filename(input.value) : '';

    var self = this;
    this._appRef._createDialog('File', [{type: 'open', path: curf, filename: curn, mimes: ['^image']}, function(btn, fname, rmime) {
      self._focus();
      if ( btn !== 'ok' ) return;
      input.setValue(fname);
    }], this);
  };

  SettingsWindow.prototype.openBackgroundColorSelect = function(ev, input) {
    var cur = input.value;
    var self = this;
    this._appRef._createDialog('Color', [{color: cur}, function(btn, rgb, hex) {
      self._focus();
      if ( btn != 'ok' ) return;

      input.setValue(hex);
      input.$input.style.backgroundColor = hex;
      input.$input.style.color = "#fff";
    }], this);
  };

  SettingsWindow.prototype.openFontSelect = function(ev, input) {
    var cur = input.value;
    var self = this;
    this._appRef._createDialog('Font', [{name: cur, minSize: 0, maxSize: 0}, function(btn, fontName, fontSize) {
      self._focus();
      if ( btn != 'ok' ) return;
      input.setValue(fontName);
      input.$input.style.fontFamily = fontName;
    }], this);
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

  Panel.prototype.getPosition = function(pos) {
    return pos ? (this._options.position == pos) : this._options.position;
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
            title: _(DefaultCategories[c].title),
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
  OSjs.CoreWM.SettingsWindow    = SettingsWindow;
  OSjs.CoreWM.BuildMenu         = BuildMenu;
  OSjs.CoreWM.BuildCategoryMenu = BuildCategoryMenu;
  OSjs.CoreWM.Panel             = Panel;
  OSjs.CoreWM.PanelItem         = PanelItem;
  OSjs.CoreWM.PanelItems        = {};
  OSjs.CoreWM.WindowSwitcher    = WindowSwitcher;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI);
