(function(WindowManager, Window, GUI) {

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      'CoreWM Settings' : 'CoreWM Instillinger',
      'Theme and Background' : 'Tema og Bakgrunn',
      'Desktop Settings' : 'Skrivebord Instillinger',
      'Background Type' : 'Bakgrunn type',
      'Image (Repeat)' : 'Bilde (Gjenta)',
      'Image (Centered)' : 'Bilde (Sentrert)',
      'Image (Fill)' : 'Bilde (Fyll)',
      'Image (Streched)' : 'Bilde (Strekk)',
      'Desktop Margin ({0}px)' : 'Skrivebord Margin ({0}px)',
      'Panel Position' : 'Panel Posisjon',
      'Panel Ontop ?' : 'Panel på topp?',
      'Panel Items' : 'Panel objekter',
      'Use animations ?' : 'Bruk animasjoner ?',
      'Language (requires restart)' : 'Språk (krever omstart)',
      'Open Panel Settings' : 'Åpne panel-instillinger',
      'Enable sounds' : 'Skru på lyder',
      'Enable Window Switcher' : 'Skru på Vindu-bytter',
      'Enable Hotkeys' : 'Skru på Hurtigtaster',
      'Enable iconview' : 'Skru på Ikonvisning',

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
    },

    de_DE : {
      'CoreWM Settings': 'CoreWM Einstellungen',
      'Theme and Background': 'Design und Hintergrund',
      'Desktop Settings': 'Desktop Einstellungen',
      'Background Type': 'Hintergrundtyp',
      'Image (Repeat)': 'Bild (wiederholend)',
      'Image (Centered)': 'Bild (zentriert)',
      'Image (Fill)': 'Bild (füllend)',
      'Image (Streched)': 'Bilde (ausgedehnt)',
      'Desktop Margin ({0}px)': 'Desktop-Rand ({0}px)',
      'Panel Position': 'Panel Position',
      'Panel Ontop ?': 'Panel im Vordergrund?',
      'Panel Items': 'Panel-Elemente',
      'Use animations ?': 'Animationen nutzen?',
      'Language (requires restart)': 'Sprache (benötigt Neustart)',
      'Open Panel Settings': 'Åpne panel-instillinger',
      'Enable sounds': 'Töne aktivieren',
      'Enable Window Switcher': 'Fensterwechsel möglich?',
      'Enable Hotkeys': 'Hotkeys aktivieren',
      'Enable iconview': 'Iconview aktivieren',

      'Development': 'Entwicklung',
      'Education': 'Bildung',
      'Games': 'Spiele',
      'Graphics': 'Grafik',
      'Network': 'Netzwerk',
      'Multimedia': 'Multimedia',
      'Office': 'Office',
      'System': 'System',
      'Utilities': 'Zubehör',
      'Other': 'Andere'
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return OSjs.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // SETTINGS
  /////////////////////////////////////////////////////////////////////////////

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
  // Panel Item Window
  /////////////////////////////////////////////////////////////////////////////

  var PanelItemWindow = function(app, parentWindow) {
    Window.apply(this, ['CoreWMPanelItemWindow', {width:400, height:390}, app]);

    this._title                     = _("CoreWM Panel Item Chooser");
    this._icon                      = "categories/applications-system.png";
    this._properties.allow_resize   = false;
    this._properties.allow_maximize = false;
    this._properties.allow_minimize = false;
    this._properties.gravity        = 'center';

    this.parentWindow = parentWindow;
    this.buttonConfirm = null;
    this.selectedItem = null;
  };

  PanelItemWindow.prototype = Object.create(Window.prototype);

  PanelItemWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    var list = [];
    var items = OSjs.CoreWM.PanelItems;
    for ( var i in items ) {
      if ( items.hasOwnProperty(i) ) {
        list.push({
          key:   i,
          image: OSjs.API.getThemeResource(items[i].Icon, 'icon', '16x16'),
          name:  OSjs.Utils.format("{0} ({1})", items[i].Name, items[i].Description)
        });
      }
    }

    var _onActivate = function() {
      if ( self.selectedItem && self.parentWindow ) {
        self.parentWindow.addPanelItem(self.selectedItem.key);
      }
      self._close();
    };

    var listView = this._addGUIElement(new OSjs.GUI.ListView('PanelItemChooserDialogListView'), root);
    listView.setColumns([
      {key: 'image', title: '', type: 'image', domProperties: {width: "16"}},
      {key: 'name',  title: OSjs._('Name')},
      {key: 'key',   title: 'Key', visible: false}
     ]);
    listView.onActivate = function(ev, el, item) {
      if ( item && item.key ) {
        self.selectedItem = item;
        self.buttonConfirm.setDisabled(false);
        _onActivate();
      }
    };
    listView.onSelect = function(ev, el, item) {
      if ( item && item.key ) {
        self.selectedItem = item;
        self.buttonConfirm.setDisabled(false);
      }
    };

    this.buttonConfirm = this._addGUIElement(new OSjs.GUI.Button('OK', {label: OSjs._('Add'), onClick: function(el, ev) {
      if ( !this.isDisabled() ) {
        _onActivate();
      }
    }}), root);
    this.buttonConfirm.setDisabled(true);

    listView.setRows(list);
    listView.render();

    return root;
  };

  PanelItemWindow.prototype.destroy = function() {
    // Destroy custom objects etc. here

    Window.prototype.destroy.apply(this, arguments);
  };

  PanelItemWindow.prototype._onKeyEvent = function(ev) {
    Window.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === OSjs.Utils.Keys.ESC ) {
      this._close();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // Settings Window
  /////////////////////////////////////////////////////////////////////////////

  var SettingsWindow = function(app) {
    Window.apply(this, ['CoreWMSettingsWindow', {width: 500, height: 450}, app]);

    this._title                     = _("CoreWM Settings");
    this._icon                      = "categories/applications-system.png";
    this._properties.allow_resize   = false;
    this._properties.allow_maximize = false;

    this.panelItemWindow  = null;
    this.currentPanelItem = null;
    this.panelItems       = [];
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

    var panels = this._appRef.getSetting('panels');
    if ( !panels || !panels[0] ) {
      panels = this._appRef.getDefaultSetting('panels');
    }
    var panel = panels[0];

    this.panelItems = panel.items;

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

    var tabPanels = tabs.addTab('Panels', {title: OSjs._('Panels')});
    var tabLocale = tabs.addTab('Locales', {title: _('Locales')});

    //
    // Tab: Theme
    //

    // Theme
    outer = _createContainer('Theme SettingsNoButton', OSjs._('Theme'));
    var themeName = this._addGUIElement(new OSjs.GUI.Select('SettingsThemeName'), outer);
    themeName.addItems(themelist);
    themeName.setSelected(theme);
    tabStyles.appendChild(outer);

    // Background Type
    outer = _createContainer('BackgroundType SettingsNoButton', _('Background Type'));
    var backgroundType = this._addGUIElement(new OSjs.GUI.Select('SettingsBackgroundType'), outer);
    backgroundType.addItems({
      'image':        OSjs._('Image'),
      'image-repeat': _('Image (Repeat)'),
      'image-center': _('Image (Centered)'),
      'image-fill':   _('Image (Fill)'),
      'image-strech': _('Image (Streched)'),
      'color':        OSjs._('Color')
    });
    backgroundType.setSelected(settings.background);
    tabStyles.appendChild(outer);

    // Background Image
    outer = _createContainer('BackgroundImage', OSjs._('Background Image'));
    var backgroundImage = this._addGUIElement(new OSjs.GUI.Text('SettingsBackgroundImage', {disabled: true, value: settings.wallpaper}), outer);

    this._addGUIElement(new OSjs.GUI.Button('OpenDialog', {label: '...', onClick: function(el, ev) {
      self.openBackgroundSelect(ev, backgroundImage);
    }}), outer);

    tabStyles.appendChild(outer);

    // Background Color
    outer = _createContainer('BackgroundColor', OSjs._('Background Color'));

    var backgroundColor = this._addGUIElement(new OSjs.GUI.Text('SettingsBackgroundColor', {disabled: true, value: settings.style.backgroundColor}), outer);
    backgroundColor.$input.style.backgroundColor = settings.style.backgroundColor;
    backgroundColor.$input.style.color = "#fff";

    this._addGUIElement(new OSjs.GUI.Button('OpenDialog', {label: '...', onClick: function(el, ev) {
      self.openBackgroundColorSelect(ev, backgroundColor);
    }}), outer);

    tabStyles.appendChild(outer);

    // Font
    outer = _createContainer('Font', OSjs._('Font'));

    var fontName = this._addGUIElement(new OSjs.GUI.Text('SettingsFont', {disabled: true, value: settings.style.fontFamily}), outer);
    fontName.$input.style.fontFamily = settings.style.fontFamily;

    this._addGUIElement(new OSjs.GUI.Button('OpenDialog', {label: '...', onClick: function(el, ev) {
      self.openFontSelect(ev, fontName);
    }}), outer);

    tabStyles.appendChild(outer);

    // Misc
    outer = _createContainer('Animations SettingsNoButton', _('Use animations ?'));
    var useAnimations = this._addGUIElement(new OSjs.GUI.Select('SettingsUseAnimations'), outer);
    useAnimations.addItems({
      'yes':  OSjs._('Yes'),
      'no':   OSjs._('No')
    });
    useAnimations.setSelected(settings.animations ? 'yes' : 'no');
    tabStyles.appendChild(outer);

    //
    // Tab: Desktop
    //

    // Desktop Margin
    outer = document.createElement('div');
    outer.className = "Setting Setting_DesktopMargin";

    var labelMargin = document.createElement('label');
    labelMargin.innerHTML = _("Desktop Margin ({0}px)", desktopMargin);

    outer.appendChild(labelMargin);
    slider = this._addGUIElement(new OSjs.GUI.Slider('SliderMargin', {min: 0, max: 50, val: desktopMargin, onChange: function(value, percentage) {
      desktopMargin = value;
      labelMargin.innerHTML = _("Desktop Margin ({0}px)", desktopMargin);
    }}), outer);
    tabOther.appendChild(outer);

    // Switcher
    outer = _createContainer('Switcher SettingsNoButton', _('Enable Window Switcher'));
    var useSwitcher = this._addGUIElement(new OSjs.GUI.Select('SettingsUseSwitcher'), outer);
    useSwitcher.addItems({
      'yes':  OSjs._('Yes'),
      'no':   OSjs._('No')
    });
    useSwitcher.setSelected(settings.enableSwitcher ? 'yes' : 'no');
    tabOther.appendChild(outer);

    // Hotkeys
    outer = _createContainer('Hotkeys SettingsNoButton', _('Enable Hotkeys'));
    var useHotkeys = this._addGUIElement(new OSjs.GUI.Select('SettingsUseHotkeys'), outer);
    useHotkeys.addItems({
      'yes':  OSjs._('Yes'),
      'no':   OSjs._('No')
    });
    useHotkeys.setSelected(settings.enableHotkeys ? 'yes' : 'no');
    tabOther.appendChild(outer);

    // Sounds
    outer = _createContainer('Sounds SettingsNoButton', _('Enable sounds'));
    var useSounds = this._addGUIElement(new OSjs.GUI.Select('SettingsUseSounds'), outer);
    useSounds.addItems({
      'yes':  OSjs._('Yes'),
      'no':   OSjs._('No')
    });
    useSounds.setSelected(settings.enableSounds ? 'yes' : 'no');
    tabOther.appendChild(outer);

    // IconView
    outer = _createContainer('IconView SettingsNoButton', _('Enable iconview'));
    var useIconView = this._addGUIElement(new OSjs.GUI.Select('SettingsUseIconView'), outer);
    useIconView.addItems({
      'yes':  OSjs._('Yes'),
      'no':   OSjs._('No')
    });
    useIconView.setSelected(settings.enableIconView ? 'yes' : 'no');
    tabOther.appendChild(outer);

    //
    // Tab: Panels
    //

    // Panel Position
    outer = _createContainer('PanelPosition SettingsNoButton', _('Panel Position'));
    var panelPosition = this._addGUIElement(new OSjs.GUI.Select('SettingsPanelPosition'), outer);
    panelPosition.addItems({
      'top':      OSjs._('Top'),
      'bottom':   OSjs._('Bottom')
    });
    panelPosition.setSelected(settings.panels[0].options.position);
    tabPanels.appendChild(outer);

    // Panel Autohide
    outer = _createContainer('PanelAutohide SettingsNoButton', _('Panel Autohide ?'));
    var panelAutohide = this._addGUIElement(new OSjs.GUI.Select('SettingsPanelAutohide'), outer);
    panelAutohide.addItems({
      'yes':  OSjs._('Yes'),
      'no':   OSjs._('No')
    });
    panelAutohide.setSelected(settings.panels[0].options.autohide ? 'yes' : 'no');
    tabPanels.appendChild(outer);

    // Panel Ontop
    outer = _createContainer('PanelOntop SettingsNoButton', _('Panel Ontop ?'));
    var panelOntop = this._addGUIElement(new OSjs.GUI.Select('SettingsPanelOntop'), outer);
    panelOntop.addItems({
      'yes':  OSjs._('Yes'),
      'no':   OSjs._('No')
    });
    panelOntop.setSelected(settings.panels[0].options.ontop ? 'yes' : 'no');
    tabPanels.appendChild(outer);

    // Panel items
    outer = _createContainer('PanelItems SettingsNoButton', _('Panel Items'));
    var panelItemContainer = document.createElement('div');
    panelItemContainer.className = 'PanelItemsContainer';

    var panelItemButtons = document.createElement('div');
    panelItemButtons.className = 'PanelItemButtons';

    var panelItemButtonAdd = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonAdd', {icon: OSjs.API.getIcon('actions/add.png'), onClick: function(el, ev) {
      self.showPanelItemWindow();
      self.currentPanelItem = null;
      panelItemButtonRemove.setDisabled(true);
      panelItemButtonUp.setDisabled(true);
      panelItemButtonDown.setDisabled(true);
    }}), panelItemButtons);

    var panelItemButtonRemove = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonRemove', {disabled: true, icon: OSjs.API.getIcon('actions/remove.png'), onClick: function(el, ev) {
      if ( self.currentPanelItem ) {
        self.removePanelItem(self.currentPanelItem);
      }
    }}), panelItemButtons);

    var panelItemButtonUp = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonUp', {disabled: true, icon: OSjs.API.getIcon('actions/up.png'), onClick: function(el, ev) {
      if ( self.currentPanelItem ) {
        self.movePanelItem(self.currentPanelItem, -1);
      }
    }}), panelItemButtons);

    var panelItemButtonDown = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonDown', {disabled: true, icon: OSjs.API.getIcon('actions/down.png'), onClick: function(el, ev) {
      if ( self.currentPanelItem ) {
        self.movePanelItem(self.currentPanelItem, 1);
      }
    }}), panelItemButtons);

    var panelItemButtonReset = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonReset', {tooltop: OSjs._('Reset to defaults'), icon: OSjs.API.getIcon('actions/revert.png'), onClick: function(el, ev) {
      self.resetPanelItems();
    }}), panelItemButtons);

    var panelItemList = this._addGUIElement(new OSjs.GUI.ListView('PanelItemListView'), panelItemContainer);

    panelItemList.onSelect = function(ev, el, item) {
      if ( item ) {
        if ( item.index <= 0 ) {
          panelItemButtonUp.setDisabled(true);
        } else {
          panelItemButtonUp.setDisabled(false);
        }

        if ( item.index >= (self.panelItems.length-1) ) {
          panelItemButtonDown.setDisabled(true);
        } else {
          panelItemButtonDown.setDisabled(false);
        }

        panelItemButtonRemove.setDisabled(false);
        self.currentPanelItem = item;
      } else {
        panelItemButtonRemove.setDisabled(true);
        panelItemButtonUp.setDisabled(true);
        panelItemButtonDown.setDisabled(true);
        self.currentPanelItem = null;
      }
    };

    panelItemContainer.appendChild(panelItemButtons);
    outer.appendChild(panelItemContainer);
    tabPanels.appendChild(outer);

    this.refreshPanelItems();

    //
    // Tab: Localization
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
    this._addGUIElement(new OSjs.GUI.Button('Save', {label: OSjs._('Apply'), onClick: function(el, ev) {
      // First validate
      var settings = {
        language:         useLanguage.getValue(),
        panelItems:       self.panelItems,
        animations:       useAnimations.getValue() == 'yes',
        panelOntop:       panelOntop.getValue() == 'yes',
        panelAutohide:    panelAutohide.getValue() == 'yes',
        panelPosition:    panelPosition.getValue(),
        enableSwitcher:   useSwitcher.getValue() == 'yes',
        enableHotkeys:    useHotkeys.getValue() == 'yes',
        enableSounds:     useSounds.getValue() == 'yes',
        enableIconView:   useIconView.getValue() == 'yes',
        desktopMargin:    desktopMargin,
        desktopFont:      fontName.getValue(),
        theme:            themeName.getValue(),
        backgroundType:   backgroundType.getValue(),
        backgroundImage:  backgroundImage.getValue(),
        backgroundColor:  backgroundColor.getValue()
      };

      // Then apply
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
                autohide: settings.panelAutohide
              },
              items: settings.panelItems
            }
          ],
          style      : {
            fontFamily       : settings.desktopFont,
            backgroundColor  : settings.backgroundColor
          },
          enableSwitcher: settings.enableSwitcher,
          enableHotkeys:  settings.enableHotkeys,
          enableSounds:   settings.enableSounds,
          enableIconView: settings.enableIconView
        }, false, true);
      }
    }}), root);
  };

  SettingsWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  SettingsWindow.prototype.refreshPanelItems = function() {
    this.currentPanelItem = null;

    var panelItemList = this._getGUIElement('PanelItemListView');
    var addItems = [];
    for ( var j = 0; j < this.panelItems.length; j++ ) {
      addItems.push({name: this.panelItems[j].name, index: j});
    }
    panelItemList.setColumns([{key: 'name', title: _('Name')}, {key: 'index', title: 'Index', visible: false}]);
    panelItemList.setRows(addItems);
    panelItemList.render();

    this._getGUIElement('PanelItemButtonRemove').setDisabled(true);
    this._getGUIElement('PanelItemButtonUp').setDisabled(true);
    this._getGUIElement('PanelItemButtonDown').setDisabled(true);
  };

  SettingsWindow.prototype.setTab = function(tab) {
    var tabs = this._getGUIElement('SettingTabs');
    if ( !tab || !tabs ) { return; }
    tabs.setTab(tab);
  };

  SettingsWindow.prototype.showPanelItemWindow = function() {
    if ( !this.panelItemWindow ) {
      this.panelItemWindow = new PanelItemWindow(this._appRef, this);
      this._addChild(this.panelItemWindow, true);
    }

    var self = this;
    setTimeout(function() {
      self.panelItemWindow._restore();
    }, 10);
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

  SettingsWindow.prototype.addPanelItem = function(name) {
    console.debug("CoreWM::addPanelItem()", name);

    this.panelItems.push({name: name});

    this.refreshPanelItems();
    this._focus();
  };

  SettingsWindow.prototype.removePanelItem = function(iter) {
    this.panelItems.splice(iter.index, 1);

    this.refreshPanelItems();
    this._focus();
  };

  SettingsWindow.prototype.movePanelItem = function(iter, pos) {
    if ( iter.index <= 0 && pos < 0 ) { return; } // At top
    if ( pos > 0 && (iter.index >= (this.panelItems.length-1)) ) { return; } // At bottom

    var value = this.panelItems[iter.index];
    this.panelItems.splice(iter.index, 1);
    if ( pos > 0 ) {
      this.panelItems.splice(iter.index + 1, 0, value);
    } else if ( pos < 0 ) {
      this.panelItems.splice(iter.index - 1, 0, value);
    }

    this.refreshPanelItems();
    this._focus();
  };

  SettingsWindow.prototype.resetPanelItems = function() {
    var defaults = this._appRef.getDefaultSetting('panels');
    console.debug("CoreWM::resetPanelItems()", defaults);

    this.panelItems = defaults[0].items;

    this.refreshPanelItems();
    this._focus();
  };

  /////////////////////////////////////////////////////////////////////////////
  // Window Switcher
  /////////////////////////////////////////////////////////////////////////////

  var WindowSwitcher = function() {
    this.$switcher      = null;
    this.showing        = false;
    this.index          = -1;
    this.winRef         = null;
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

    var height = 0;
    var items  = [];
    var index  = -1;

    // Render
    OSjs.Utils.$empty(this.$switcher);

    var container, image, label, iter;
    for ( var i = 0; i < wm._windows.length; i++ ) {
      iter = wm._windows[i];
      if ( iter ) {
        container       = document.createElement('div');

        image           = document.createElement('img');
        image.src       = iter._icon;

        label           = document.createElement('span');
        label.innerHTML = iter._title;

        container.appendChild(image);
        container.appendChild(label);
        this.$switcher.appendChild(container);

        height += 32; // FIXME: We can automatically calculate this

        if ( win && win._wid == iter._wid ) {
          index = i;
        }

        items.push({
          element: container,
          win: iter
        });
      }
    }

    if ( !this.$switcher.parentNode ) {
      document.body.appendChild(this.$switcher);
    }

    this.$switcher.style.height    = height + 'px';
    this.$switcher.style.marginTop = (height ? -((height/2) << 0) : 0) + 'px';

    // Select
    if ( this.showing ) {
      this.index++;
      if ( this.index > (items.length-1) ) {
        this.index = -1;
      }
    } else {
      this.index = index;
      this.showing = true;
    }

    if ( items[this.index] ) {
      items[this.index].element.className = 'Active';
      this.winRef = items[this.index].win;
    } else {
      this.winRef = null;
    }
  };

  WindowSwitcher.prototype.hide = function(ev, win, wm) {
    if ( !this.showing ) { return; }

    ev.preventDefault();

    if ( this.$switcher && this.$switcher.parentNode ) {
      this.$switcher.parentNode.removeChild(this.$switcher);
    }

    win = this.winRef || win;
    if ( win ) {
      win._focus();
    }

    this.winRef  = null;
    this.index   = -1;
    this.showing = false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // PANELS
  /////////////////////////////////////////////////////////////////////////////

  var PANEL_SHOW_TIMEOUT = 150;
  var PANEL_HIDE_TIMEOUT = 600;

  var Panel = function(name, options) {
    options = options || {};

    this._name = name;
    this._$element = null;
    this._$container = null;
    this._items = [];
    this._outtimeout = null;
    this._intimeout = null;
    this._options = {
      position: options.position || 'top',
      ontop:    options.ontop === true,
      autohide: options.autohide === true
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
    this._$element.onmouseover = function(ev) {
      self.onMouseOver(ev);
    };
    this._$element.onmouseout = function(ev) {
      self.onMouseOut(ev);
    };
    this._$element.onclick = function(ev) {
      OSjs.GUI.blurMenu();
    };
    this._$element.oncontextmenu = function(ev) {
      OSjs.GUI.createMenu([{title: _('Open Panel Settings'), onClick: function(ev) {
        var wm = OSjs.API.getWMInstance();
        if ( wm ) {
          wm.showSettings('Panels');
        }
      }}], {x: ev.clientX, y: ev.clientY});
      return false;
    };

    document.addEventListener('mouseout', function(ev) {
      self.onMouseLeave(ev);
    }, false);

    this._$element.appendChild(this._$container);
    root.appendChild(this._$element);

    setTimeout(function() {
      self.update();
    }, 0);
  };

  Panel.prototype.destroy = function() {
    this._clearTimeouts();

    var self = this;
    document.removeEventListener('mouseout', function(ev) {
      self.onMouseLeave(ev);
    }, false);

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
    if ( options.autohide ) {
      this.onMouseOut();
    }
    this._$element.className = cn.join(' ');
    this._options = options;
  };

  Panel.prototype.autohide = function(hide) {
    if ( !this._options.autohide || !this._$element ) {
      return;
    }

    if ( hide ) {
      this._$element.className = this._$element.className.replace(/\s?Visible/, '');
      if ( !this._$element.className.match(/Autohide/) ) {
        this._$element.className += ' Autohide';
      }
    } else {
      this._$element.className = this._$element.className.replace(/\s?Autohide/, '');
      if ( !this._$element.className.match(/Visible/) ) {
        this._$element.className += ' Visible';
      }
    }
  };

  Panel.prototype._clearTimeouts = function() {
    if ( this._outtimeout ) {
      clearTimeout(this._outtimeout);
      this._outtimeout = null;
    }
    if ( this._intimeout ) {
      clearTimeout(this._intimeout);
      this._intimeout = null;
    }
  };

  Panel.prototype.onMouseLeave = function(ev) {
    var from = ev.relatedTarget || ev.toElement;
    if ( !from || from.nodeName == "HTML" ) {
      this.onMouseOut(ev);
    }
  };

  Panel.prototype.onMouseOver = function() {
    var self = this;
    this._clearTimeouts();
    this._intimeout = setTimeout(function() {
      self.autohide(false);
    }, PANEL_SHOW_TIMEOUT);
  };

  Panel.prototype.onMouseOut = function() {
    var self = this;
    this._clearTimeouts();
    this._outtimeout = setTimeout(function() {
      self.autohide(true);
    }, PANEL_HIDE_TIMEOUT);
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

  Panel.prototype.getAutohide = function() {
    return this._options.autohide;
  };

  Panel.prototype.getRoot = function() {
    return this._$element;
  };

  Panel.prototype.getHeight = function() {
    return this._$element ? this._$element.offsetHeight : 0;
  };

  /////////////////////////////////////////////////////////////////////////////
  // PANEL ITEM
  /////////////////////////////////////////////////////////////////////////////

  var PanelItem = function(className) {
    this._$root = null;
    this._className = className || 'Unknown';
  };

  PanelItem.Name = 'PanelItem'; // Static name
  PanelItem.Description = 'PanelItem Description'; // Static description
  PanelItem.Icon = 'actions/stock_about.png'; // Static icon

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
          tooltip : iter.description,
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
            tooltip : iter.data.description,
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

  /////////////////////////////////////////////////////////////////////////////
  // ICON VIEW
  /////////////////////////////////////////////////////////////////////////////

  var DesktopIconView = function(wm) {
    var self = this;
    var opts = {
      data : [{
        icon: OSjs.API.getThemeResource('places/folder_home.png', 'icon', '32x32'),
        label: 'Home',
        launch: 'ApplicationFileManager',
        index: 0,
        args: {path: '/'}
      }],
      onActivate : function(ev, el, item) {
        if ( typeof item.launch === 'undefined' ) {
          OSjs.API.open(item.args.path, item.args.mime);
        } else {
          OSjs.API.launch(item.launch, item.args);
        }
      },
      onContextMenu : function(ev, el, item) {
        var pos = {x: ev.clientX, y: ev.clientY};
        OSjs.GUI.createMenu([{
          title: _('Remove shortcut'), // FIXME: Translation
          disabled: item.index === 0,
          onClick: function() {
            if ( item.launch ) { return; }

            self.removeShortcut(item, wm);
          }
        }], pos)
      }
    };
    GUI.IconView.apply(this, ['CoreWMDesktopIconView', opts]);

    this._addHook('blur', function() {
      this.setSelected(null, null);
    });
  };

  DesktopIconView.prototype = Object.create(GUI.IconView.prototype);

  DesktopIconView.prototype.update = function(wm) {
    GUI.IconView.prototype.update.apply(this, arguments);

    var el = this.getRoot();
    if ( el ) {
      // Make sure we trigger the default events
      this._addEvent(el, 'onmousedown', function(ev) {
        ev.preventDefault();
        OSjs.GUI.blurMenu();
        return false;
      });
      this._addEvent(el, 'oncontextmenu', function(ev) {
        ev.preventDefault();
        if ( wm ) {
          wm.openDesktopMenu(ev);
        }
        return false;
      });

      // Make DnD work just like a desktop without iconview
      OSjs.GUI.createDroppable(el, {
        onOver: function(ev, el, args) {
          wm.onDropOver(ev, el, args);
        },

        onLeave : function() {
          wm.onDropLeave();
        },

        onDrop : function() {
          wm.onDrop();
        },

        onItemDropped: function(ev, el, item, args) {
          wm.onDropItem(ev, el, item, args);
        },

        onFilesDropped: function(ev, el, files, args) {
          wm.onDropFile(ev, el, files, args);
        }
      });

      // Restore settings
      var icons = wm.getSetting('desktopIcons') || [];
      if ( icons.length ) {
        for ( var i = 0; i < icons.length; i++ ) {
          this._addShortcut(icons[i])
        }
        this.refresh();
      }
    };
  };

  DesktopIconView.prototype.resize = function(wm) {
    var el = this.getRoot();
    var s  = wm.getWindowSpace();

    if ( el ) {
      el.style.top    = (s.top) + 'px';
      el.style.left   = (s.left) + 'px';
      el.style.width  = (s.width) + 'px';
      el.style.height = (s.height) + 'px';
    }
  };

  DesktopIconView.prototype._save = function(wm) {
    var icons = [];
    for ( var i = 1; i < this.data.length; i++ ) {
      icons.push(this.data[i].args);
    }
    wm.setSetting('desktopIcons', icons);
    wm.saveSettings();
  };

  DesktopIconView.prototype._addShortcut = function(data) {
    this.data.push({
      icon: OSjs.GUI.getFileIcon(data.path, data.mime, null, null, '32x32'),
      label: data.filename,
      index: this.data.length,
      args: data
    });
  };

  DesktopIconView.prototype.addShortcut = function(data, wm) {
    this._addShortcut(data);

    if ( wm ) {
      this._save(wm);
    }

    this.refresh();
  };

  DesktopIconView.prototype.removeShortcut = function(data, wm) {
    var iter;
    for ( var i = 1; i < this.data.length; i++ ) {
      iter = this.data[i];
      if ( iter.index == data.index ) {
        this.data.splice(i, 1);
        break;
      }
    }

    if ( wm ) {
      this._save(wm);
    }

    this.refresh();
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.CoreWM                   = OSjs.CoreWM       || {};
  OSjs.CoreWM.SettingsWindow    = SettingsWindow;
  OSjs.CoreWM.PanleItemWindow   = PanelItemWindow;
  OSjs.CoreWM.BuildMenu         = BuildMenu;
  OSjs.CoreWM.BuildCategoryMenu = BuildCategoryMenu;
  OSjs.CoreWM.Panel             = Panel;
  OSjs.CoreWM.PanelItem         = PanelItem;
  OSjs.CoreWM.PanelItems        = {};
  OSjs.CoreWM.WindowSwitcher    = WindowSwitcher;
  OSjs.CoreWM.DesktopIconView   = DesktopIconView;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI);
