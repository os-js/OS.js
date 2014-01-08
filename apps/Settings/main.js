(function(Application, Window) {

  /**
   * Main Window
   */
  var ApplicationSettingsWindow = function(app) {
    Window.apply(this, ['ApplicationSettingsWindow', {width: 500, height: 300}, app]);

    this._title                   = "Settings";
    this._icon                    = "categories/applications-system.png";
    this._properties.allow_resize   = false;
    this._properties.allow_maximize = false;
  };

  ApplicationSettingsWindow.prototype = Object.create(Window.prototype);

  ApplicationSettingsWindow.prototype.init = function(wm) {
    var self      = this;
    var root      = Window.prototype.init.apply(this, arguments);
    var app       = this._appRef;

    var settings      = wm.getSettings();
    var themes        = wm.getThemes();
    var theme         = wm.getSetting('theme');
    var desktopMargin = settings.desktop.margin;
    var themelist     = {};

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
    var tabStyles = tabs.addTab('Theme and Background').content;
    var tabOther  = tabs.addTab('Desktop Settings', {}, function(c) {
      slider.setValue(desktopMargin);
    }).content;
    var tabMisc   = tabs.addTab('Misc').content;

    // Theme
    outer = _createContainer('Theme SettingsNoButton', 'Theme');
    var themeName = this._addGUIElement(new OSjs.GUI.Select('SettingsThemeName'), outer);
    themeName.addItems(themelist);
    themeName.setSelected(theme);
    tabStyles.appendChild(outer);

    //
    // Background Type
    //
    outer = _createContainer('BackgroundType SettingsNoButton', 'Background Type');
    var backgroundType = this._addGUIElement(new OSjs.GUI.Select('SettingsBackgroundType'), outer);
    backgroundType.addItems({
      'image':        'Image',
      'image-repeat': 'Image (Repeat)',
      'image-center': 'Image (Centered)',
      'image-fill':   'Image (Fill)',
      'image-strech': 'Image (Streched)',
      'color':        'Color'
    });
    backgroundType.setSelected(settings.background);
    tabStyles.appendChild(outer);

    //
    // Background Image
    //
    outer = _createContainer('BackgroundImage', 'Background Image');
    var backgroundImage = this._addGUIElement(new OSjs.GUI.Text('SettingsBackgroundImage', {disabled: true, value: settings.wallpaper}), outer);

    this._addGUIElement(new OSjs.GUI.Button('OpenDialog', {label: '...', onClick: function(el, ev) {
      self.openBackgroundSelect(ev, backgroundImage);
    }}), outer);

    tabStyles.appendChild(outer);

    //
    // Background Color
    //
    outer = _createContainer('BackgroundColor', 'Background Color');

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
    outer = _createContainer('Font', 'Font');

    var fontName = this._addGUIElement(new OSjs.GUI.Text('SettingsFont', {disabled: true, value: settings.style.fontFamily}), outer);
    fontName.$input.style.fontFamily = settings.style.fontFamily;

    this._addGUIElement(new OSjs.GUI.Button('OpenDialog', {label: '...', onClick: function(el, ev) {
      self.openFontSelect(ev, fontName);
    }}), outer);

    tabOther.appendChild(outer);

    //
    // Taskbar Position
    //
    outer = _createContainer('TaskbarPosition SettingsNoButton', 'Taskbar Position');
    var taskbarPosition = this._addGUIElement(new OSjs.GUI.Select('SettingsTaskbarPosition'), outer);
    taskbarPosition.addItems({
      'top':      'Top',
      'bottom':   'Bottom'
    });
    taskbarPosition.setSelected(settings.taskbar.position);
    tabOther.appendChild(outer);

    //
    // Taskbar Ontop
    //
    outer = _createContainer('TaskbarOntop SettingsNoButton', 'Taskbar Ontop ?');
    var taskbarOntop = this._addGUIElement(new OSjs.GUI.Select('SettingsTaskbarOntop'), outer);
    taskbarOntop.addItems({
      'yes':  'Yes',
      'no':   'No'
    });
    taskbarOntop.setSelected(settings.taskbar.ontop ? 'yes' : 'no');
    tabOther.appendChild(outer);

    //
    // Desktop Margin
    //
    outer = document.createElement('div');
    outer.className = "Setting Setting_DesktopMargin";

    var label = document.createElement('label');
    label.innerHTML = "Desktop Margin (" + desktopMargin + "px)";

    outer.appendChild(label);
    slider = this._addGUIElement(new OSjs.GUI.Slider('SliderMargin', {min: 0, max: 50, val: desktopMargin}, function(value, percentage) {
      desktopMargin = value;
      label.innerHTML = "Desktop Margin (" + desktopMargin + "px)";
    }), outer);
    tabOther.appendChild(outer);

    //
    // Misc
    //
    outer = _createContainer('Animations SettingsNoButton', 'Use animations ?');
    var useAnimations = this._addGUIElement(new OSjs.GUI.Select('SettingsUseAnimations'), outer);
    useAnimations.addItems({
      'yes':  'Yes',
      'no':   'No'
    });
    useAnimations.setSelected(settings.animations ? 'yes' : 'no');
    tabMisc.appendChild(outer);

    //
    // Buttons
    //
    this._addGUIElement(new OSjs.GUI.Button('Save', {label: 'Apply', onClick: function(el, ev) {
      app.save(ev, self, {
        animations:       useAnimations.getValue() == 'yes',
        taskbarOntop:     taskbarOntop.getValue() == 'yes',
        taskbarPosition:  taskbarPosition.getValue(),
        desktopMargin:    desktopMargin,
        desktopFont:      fontName.getValue(),
        theme:            themeName.getValue(),
        backgroundType:   backgroundType.getValue(),
        backgroundImage:  backgroundImage.getValue(),
        backgroundColor:  backgroundColor.getValue()
      });
    }}), root);
  };

  ApplicationSettingsWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationSettingsWindow.prototype.openBackgroundSelect = function(ev, input) {
    var curf = input.value ? OSjs.Utils.dirname(input.value) : OSjs.API.getDefaultPath('/');
    var curn = input.value ? OSjs.Utils.filename(input.value) : '';

    var self = this;
    this._appRef._createDialog('File', [{type: 'open', path: curf, filename: curn, mimes: ['^image']}, function(btn, fname, rmime) {
      self._focus();
      if ( btn !== 'ok' ) return;
      input.setValue(fname);
    }], this);
  };

  ApplicationSettingsWindow.prototype.openBackgroundColorSelect = function(ev, input) {
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

  ApplicationSettingsWindow.prototype.openFontSelect = function(ev, input) {
    var cur = input.value;
    var self = this;
    this._appRef._createDialog('Font', [{name: cur, minSize: 0, maxSize: 0}, function(btn, fontName, fontSize) {
      self._focus();
      if ( btn != 'ok' ) return;
      input.setValue(fontName);
      input.$input.style.fontFamily = fontName;
    }], this);
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

  ApplicationSettings.prototype.init = function(core, settings) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationSettingsWindow(this));
  };

  ApplicationSettings.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationSettingsWindow' ) {
      this.destroy();
    }

  };

  ApplicationSettings.prototype.save = function(ev, win, settings) {
    var wm = OSjs.API.getWMInstance();
    console.warn("ApplicationSettings::save()", settings);
    if ( wm ) {
      var res = wm.applySettings({
        animations : settings.animations,
        taskbar    : {ontop: settings.taskbarOntop, position: settings.taskbarPosition},
        desktop    : {margin: settings.desktopMargin},
        theme      : settings.theme,
        wallpaper  : settings.backgroundImage,
        background : settings.backgroundType,
        style      : {
          fontFamily       : settings.desktopFont,
          backgroundColor  : settings.backgroundColor
        }
      }, false, true);
    }
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = ApplicationSettings;

})(OSjs.Core.Application, OSjs.Core.Window);
