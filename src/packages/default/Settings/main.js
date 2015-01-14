/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
(function(Application, Window, GUI, Utils, API, VFS) {

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
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
      'Remove shortcut' : 'Fjern snarvei',

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
      'Theme and Background' : 'Thema und Hintergrund',
      'Desktop Settings' : 'Arbeitsoberflächen Einstellungen',
      'Background Type' : 'Hintergrundtyp',
      'Image (Repeat)' : 'Bild (Wiederholend)',
      'Image (Centered)' : 'Bild (Zentriert)',
      'Image (Fill)' : 'Bild (Ausgefüllt)',
      'Image (Streched)' : 'Bild (Gestreckt)',
      'Desktop Margin ({0}px)' : 'Arbeitsoberflächen Margin ({0}px)',
      'Panel Position' : 'Panel Position',
      'Panel Ontop ?' : 'Panel im Vordergrund?',
      'Panel Items' : 'Panel Items',
      'Use animations ?' : 'Animationen verwenden?',
      'Language (requires restart)' : 'Sprache (benötigt Neustart)',
      'Open Panel Settings' : 'Öffne Panel-Einstellungen',
      'Enable sounds' : 'Aktiviere Sounds',
      'Enable Window Switcher' : 'Aktiviere Fensterwechsler',
      'Enable Hotkeys' : 'Aktiviere Hotkeys',
      'Enable iconview' : 'Aktiviere Icon-Ansicht',
      'Remove shortcut' : 'Verknüpfung entfernen',

      'Development' : 'Entwicklung',
      'Education' : 'Bildung',
      'Games' : 'Spile',
      'Graphics' : 'Grafik',
      'Network' : 'Netzwerk',
      'Multimedia' : 'Multimedia',
      'Office' : 'Büro',
      'System' : 'System',
      'Utilities' : 'Zubehör',
      'Other' : 'Andere'
    },
    fr_FR : {
    },
    ru_RU : {
      'Theme and Background' : 'Тема и фон',
      'Desktop Settings' : 'Настройки рабочего стола',
      'Background Type' : 'Тип фона',
      'Image (Repeat)' : 'Изображение(повторяющееся)',
      'Image (Centered)' : 'Изображение(по центру)',
      'Image (Fill)' : 'Изображение(заполнить)',
      'Image (Streched)' : 'Изображение(растянуть)',
      'Desktop Margin ({0}px)' : 'Отсутуп рабочего стола ({0}px)',
      'Panel Position' : 'Позиция панели',
      'Panel Ontop ?' : 'Панель вверху?',
      'Panel Items' : 'Элементы панели',
      'Use animations ?' : 'Исплользовать анимации?',
      'Language (requires restart)' : 'Язык (необходим перезапуск)',
      'Open Panel Settings' : 'Открыть настройки панели',
      'Enable sounds' : 'Включить звук',
      'Enable Window Switcher' : 'Включить растягивание окон',
      'Enable Hotkeys' : 'Включить горячии клавиши',
      'Enable iconview' : 'Включить иконки',
      'Remove shortcut' : 'Удалить ярлык',

      'Development' : 'Разработка',
      'Education' : 'Образование',
      'Games' : 'Игры',
      'Graphics' : 'Графика',
      'Network' : 'Интернет',
      'Multimedia' : 'Мультимедиа',
      'Office' : 'Офис',
      'System' : 'Система',
      'Utilities' : 'Утилиты',
      'Other' : 'Другое'
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return API.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  var PanelItemWindow = function(app, parentWindow) {
    Window.apply(this, ['CoreWMPanelItemWindow', {
      icon: "categories/applications-system.png",
      title: _("CoreWM Panel Item Chooser"),
      allow_resize: false,
      allow_maximize: false,
      allow_minimize: false,
      gravity: 'center',
      width:400,
      height:390
    }, app]);

    this.parentWindow = parentWindow;
    this.buttonConfirm = null;
    this.selectedItem = null;
  };

  PanelItemWindow.prototype = Object.create(Window.prototype);

  PanelItemWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    var list = [];
    var items = OSjs.Applications.CoreWM.PanelItems;
    for ( var i in items ) {
      if ( items.hasOwnProperty(i) ) {
        list.push({
          key:   i,
          image: API.getThemeResource(items[i].Icon, 'icon', '16x16'),
          name:  Utils.format("{0} ({1})", items[i].Name, items[i].Description)
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
      {key: 'name',  title: API._('LBL_NAME')},
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

    this.buttonConfirm = this._addGUIElement(new OSjs.GUI.Button('OK', {label: API._('LBL_ADD'), onClick: function(el, ev) {
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
    if ( ev.keyCode === Utils.Keys.ESC ) {
      this._close();
    }
  };

  var ApplicationSettingsWindow = function(app, metadata, tab) {
    Window.apply(this, ['ApplicationSettingsWindow', {
      icon: "categories/applications-system.png",
      title: metadata.name,
      allow_resize: false,
      allow_maximize: false,
      gravity: 'center',
      width: 500,
      height: 550
    }, app]);

    this.currentPanelItem = null;
    this.panelItems       = [];
    this.openTab          = tab;
  };

  ApplicationSettingsWindow.prototype = Object.create(Window.prototype);

  ApplicationSettingsWindow.prototype._inited = function() {
    Window.prototype._inited.apply(this, arguments);

    if ( this.openTab ) {
      this.setTab(this.openTab);
    }
  };

  ApplicationSettingsWindow.prototype.init = function() {
    var self      = this;
    var root      = Window.prototype.init.apply(this, arguments);
    var wm        = API.getWMInstance();

    var settings      = wm.getSettings();
    var themes        = wm.getThemes();
    var theme         = wm.getSetting('theme');
    var desktopMargin = settings.desktop.margin;
    var opacity       = 85;
    var themelist     = {};

    var panels = wm.getSetting('panels');
    if ( !panels || !panels[0] ) {
      panels = wm.getDefaultSetting('panels');
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

    var outer, slider, panelOpacity;

    var tabs      = this._addGUIElement(new OSjs.GUI.Tabs('SettingTabs'), root);
    var tabStyles = tabs.addTab('Theme', {title: _('Theme and Background')});

    var tabOther  = tabs.addTab('Desktop', {title: _('Desktop Settings'), onSelect: function() {
      slider.setValue(desktopMargin);
    }});

    var tabPanels = tabs.addTab('Panels', {title: API._('LBL_PANELS'), onSelect: function() {
      panelOpacity.setValue(opacity);
    }});
    var tabLocale = tabs.addTab('Locales', {title: API._('LBL_LOCALES')});

    //
    // Tab: Theme
    //

    // Theme
    outer = _createContainer('Theme SettingsNoButton', API._('LBL_THEME'));
    var themeName = this._addGUIElement(new OSjs.GUI.Select('SettingsThemeName'), outer);
    themeName.addItems(themelist);
    themeName.setSelected(theme);
    tabStyles.appendChild(outer);

    // Background Type
    outer = _createContainer('BackgroundType SettingsNoButton', _('Background Type'));
    var backgroundType = this._addGUIElement(new OSjs.GUI.Select('SettingsBackgroundType'), outer);
    backgroundType.addItems({
      'image':        API._('LBL_IMAGE'),
      'image-repeat': _('Image (Repeat)'),
      'image-center': _('Image (Centered)'),
      'image-fill':   _('Image (Fill)'),
      'image-strech': _('Image (Streched)'),
      'color':        API._('LBL_COLOR')
    });
    backgroundType.setSelected(settings.background);
    tabStyles.appendChild(outer);

    // Background Image
    outer = _createContainer('BackgroundImage', API._('LBL_BACKGROUND_IMAGE'));
    var backgroundImage = this._addGUIElement(new OSjs.GUI.Text('SettingsBackgroundImage', {disabled: true, value: settings.wallpaper}), outer);

    this._addGUIElement(new OSjs.GUI.Button('OpenDialog', {label: '...', onClick: function(el, ev) {
      self.openBackgroundSelect(ev, backgroundImage);
    }}), outer);

    tabStyles.appendChild(outer);

    // Background Color
    outer = _createContainer('BackgroundColor', API._('LBL_BACKGROUND_COLOR'));

    var backgroundColor = this._addGUIElement(new OSjs.GUI.Text('SettingsBackgroundColor', {disabled: true, value: settings.style.backgroundColor}), outer);
    backgroundColor.$input.style.backgroundColor = settings.style.backgroundColor;
    backgroundColor.$input.style.color = OSjs.Utils.invertHEX(settings.style.backgroundColor);

    this._addGUIElement(new OSjs.GUI.Button('OpenDialog', {label: '...', onClick: function(el, ev) {
      self.openBackgroundColorSelect(ev, backgroundColor);
    }}), outer);

    tabStyles.appendChild(outer);

    // Font
    outer = _createContainer('Font', API._('LBL_FONT'));

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
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
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
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    useSwitcher.setSelected(settings.enableSwitcher ? 'yes' : 'no');
    tabOther.appendChild(outer);

    // Hotkeys
    outer = _createContainer('Hotkeys SettingsNoButton', _('Enable Hotkeys'));
    var useHotkeys = this._addGUIElement(new OSjs.GUI.Select('SettingsUseHotkeys'), outer);
    useHotkeys.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    useHotkeys.setSelected(settings.enableHotkeys ? 'yes' : 'no');
    tabOther.appendChild(outer);

    // Sounds
    outer = _createContainer('Sounds SettingsNoButton', _('Enable sounds'));
    var useSounds = this._addGUIElement(new OSjs.GUI.Select('SettingsUseSounds'), outer);
    useSounds.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    useSounds.setSelected(settings.enableSounds ? 'yes' : 'no');
    tabOther.appendChild(outer);

    // IconView
    outer = _createContainer('IconView SettingsNoButton', _('Enable iconview'));
    var useIconView = this._addGUIElement(new OSjs.GUI.Select('SettingsUseIconView'), outer);
    useIconView.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    useIconView.setSelected(settings.enableIconView ? 'yes' : 'no');
    tabOther.appendChild(outer);

    // FIXME: Translations!!!
    outer = _createContainer('IconView SettingsNoButton', _('Invert iconview colors (uses background color)'));
    var useInvertedColor = this._addGUIElement(new OSjs.GUI.Select('SettingsInvertIconView'), outer);
    useInvertedColor.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    useInvertedColor.setSelected(settings.invertIconViewColor ? 'yes' : 'no');
    tabOther.appendChild(outer);

    //
    // Tab: Panels
    //

    // Panel Position
    outer = _createContainer('PanelPosition SettingsNoButton', _('Panel Position'));
    var panelPosition = this._addGUIElement(new OSjs.GUI.Select('SettingsPanelPosition'), outer);
    panelPosition.addItems({
      'top':      API._('LBL_TOP'),
      'bottom':   API._('LBL_BOTTOM')
    });
    panelPosition.setSelected(settings.panels[0].options.position);
    tabPanels.appendChild(outer);

    // Panel Autohide
    outer = _createContainer('PanelAutohide SettingsNoButton', _('Panel Autohide ?'));
    var panelAutohide = this._addGUIElement(new OSjs.GUI.Select('SettingsPanelAutohide'), outer);
    panelAutohide.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    panelAutohide.setSelected(settings.panels[0].options.autohide ? 'yes' : 'no');
    tabPanels.appendChild(outer);

    // Panel Ontop
    outer = _createContainer('PanelOntop SettingsNoButton', _('Panel Ontop ?'));
    var panelOntop = this._addGUIElement(new OSjs.GUI.Select('SettingsPanelOntop'), outer);
    panelOntop.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    panelOntop.setSelected(settings.panels[0].options.ontop ? 'yes' : 'no');
    tabPanels.appendChild(outer);

    // Panel Custom Color
    outer = _createContainer('PanelUseCustomColor SettingsNoButton', _('Use Custom panel color ?')); // FIXME: Translation
    var panelUseCustomColor = this._addGUIElement(new OSjs.GUI.Select('SettingsPanelUseCustomColor'), outer);
    panelUseCustomColor.addItems({
      'yes':  API._('LBL_YES'),
      'no':   API._('LBL_NO')
    });
    panelUseCustomColor.setSelected(settings.panels[0].options.background ? 'yes' : 'no');
    tabPanels.appendChild(outer);

    var bgcolor = settings.panels[0].options.background || '#000000';
    outer = _createContainer('PanelBackgroundColor', _('Panel Background color ?')); // FIXME: Translation
    var panelBackground = this._addGUIElement(new OSjs.GUI.Text('SettingsPanelBackground', {disabled: true, value: bgcolor}), outer);
    panelBackground.$input.style.backgroundColor = bgcolor;
    panelBackground.$input.style.color = OSjs.Utils.invertHEX(bgcolor);

    this._addGUIElement(new OSjs.GUI.Button('OpenDialogPanelBackground', {label: '...', onClick: function(el, ev) {
      self.openBackgroundColorSelect(ev, panelBackground);
    }}), outer);
    tabPanels.appendChild(outer);


    // Panel Opacity
    if ( typeof settings.panels[0].options.opacity === 'number' ) {
      opacity = settings.panels[0].options.opacity;
    }

    outer = _createContainer('PanelOpacity SettingsNoButton', _('Panel Opacity')); // FIXME: Translation
    panelOpacity = this._addGUIElement(new OSjs.GUI.Slider('SettingsPanelOpacity', {min:0, max:100, steps:1, value:opacity, onUpdate: function(val) {
      opacity = val;
    }}), outer);
    tabPanels.appendChild(outer);

    // Panel items
    outer = _createContainer('PanelItems SettingsNoButton', _('Panel Items'));
    var panelItemContainer = document.createElement('div');
    panelItemContainer.className = 'PanelItemsContainer';

    var panelItemButtons = document.createElement('div');
    panelItemButtons.className = 'PanelItemButtons';

    var panelItemButtonAdd = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonAdd', {icon: API.getIcon('actions/add.png'), onClick: function(el, ev) {
      self.showPanelItemWindow();
      self.currentPanelItem = null;
      panelItemButtonRemove.setDisabled(true);
      panelItemButtonUp.setDisabled(true);
      panelItemButtonDown.setDisabled(true);
    }}), panelItemButtons);

    var panelItemButtonRemove = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonRemove', {disabled: true, icon: API.getIcon('actions/remove.png'), onClick: function(el, ev) {
      if ( self.currentPanelItem ) {
        self.removePanelItem(self.currentPanelItem);
      }
    }}), panelItemButtons);

    var panelItemButtonUp = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonUp', {disabled: true, icon: API.getIcon('actions/up.png'), onClick: function(el, ev) {
      if ( self.currentPanelItem ) {
        self.movePanelItem(self.currentPanelItem, -1);
      }
    }}), panelItemButtons);

    var panelItemButtonDown = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonDown', {disabled: true, icon: API.getIcon('actions/down.png'), onClick: function(el, ev) {
      if ( self.currentPanelItem ) {
        self.movePanelItem(self.currentPanelItem, 1);
      }
    }}), panelItemButtons);

    var panelItemButtonReset = this._addGUIElement(new OSjs.GUI.Button('PanelItemButtonReset', {tooltop: API._('LBL_RESET_DEFAULT'), icon: API.getIcon('actions/revert.png'), onClick: function(el, ev) {
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
    var languages = API.getHandlerInstance().getConfig('Core').Languages;
    useLanguage.addItems(languages);
    useLanguage.setSelected(API.getLocale());
    tabLocale.appendChild(outer);

    //
    // Buttons
    //
    this._addGUIElement(new OSjs.GUI.Button('Save', {label: API._('LBL_APPLY'), onClick: function(el, ev) {
      // First validate
      var settings = {
        language:             useLanguage.getValue(),
        animations:           useAnimations.getValue() == 'yes',
        panelItems:           self.panelItems,
        panelBackground:      (panelUseCustomColor.getValue() === 'no' ? null : panelBackground.getValue()),
        panelOpacity:         panelOpacity.getValue(),
        panelOntop:           panelOntop.getValue() == 'yes',
        panelAutohide:        panelAutohide.getValue() == 'yes',
        panelPosition:        panelPosition.getValue(),
        enableSwitcher:       useSwitcher.getValue() == 'yes',
        enableHotkeys:        useHotkeys.getValue() == 'yes',
        enableSounds:         useSounds.getValue() == 'yes',
        enableIconView:       useIconView.getValue() == 'yes',
        invertIconViewColor:  useInvertedColor.getValue() == 'yes',
        desktopMargin:        desktopMargin,
        desktopFont:          fontName.getValue(),
        theme:                themeName.getValue(),
        backgroundType:       backgroundType.getValue(),
        backgroundImage:      backgroundImage.getValue(),
        backgroundColor:      backgroundColor.getValue()
      };

      // Then apply
      var wm = API.getWMInstance();
      console.warn("CoreWM::ApplicationSettingsWindow::save()", settings);
      if ( wm ) {
        wm.applySettings({
          language   : settings.language,
          animations : settings.animations,
          desktop    : {margin: settings.desktopMargin},
          theme      : settings.theme,
          wallpaper  : settings.backgroundImage,
          background : settings.backgroundType,
          panels     : [
            {
              options: {
                position:   settings.panelPosition,
                ontop:      settings.panelOntop,
                autohide:   settings.panelAutohide,
                background: settings.panelBackground,
                opacity:    settings.panelOpacity
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
          enableIconView: settings.enableIconView,
          invertIconViewColor: settings.invertIconViewColor
        }, false, true);
      }
    }}), root);

    return root;
  };

  ApplicationSettingsWindow.prototype.refreshPanelItems = function() {
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

  ApplicationSettingsWindow.prototype.setTab = function(tab) {
    var tabs = this._getGUIElement('SettingTabs');
    if ( !tab || !tabs ) { return; }
    tabs.setTab(tab);

    this._appRef._setArgument('tab', tab);
  };

  ApplicationSettingsWindow.prototype.showPanelItemWindow = function() {
    var self = this;
    var wm = API.getWMInstance();
    var win = wm.getWindow('CoreWMPanelItemWindow');
    if ( !win ) {
      win = new PanelItemWindow(this._appRef, this);
      this._appRef._addWindow(win);
    }

    setTimeout(function() {
      win._restore();
    }, 10);
  };

  ApplicationSettingsWindow.prototype.openBackgroundSelect = function(ev, input) {
    var curf = input.value ? Utils.dirname(input.value) : API.getDefaultPath('/');
    var curn = input.value ? Utils.filename(input.value) : '';

    var self = this;
    this._appRef._createDialog('File', [{type: 'open', path: curf, filename: curn, mimes: ['^image']}, function(btn, file) {
      self._focus();
      if ( btn !== 'ok' ) return;
      input.setValue(file.path);
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

  ApplicationSettingsWindow.prototype.addPanelItem = function(name) {
    console.debug("CoreWM::addPanelItem()", name);

    this.panelItems.push({name: name});

    this.refreshPanelItems();
    this._focus();
  };

  ApplicationSettingsWindow.prototype.removePanelItem = function(iter) {
    this.panelItems.splice(iter.index, 1);

    this.refreshPanelItems();
    this._focus();
  };

  ApplicationSettingsWindow.prototype.movePanelItem = function(iter, pos) {
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

  ApplicationSettingsWindow.prototype.resetPanelItems = function() {
    var wm = API.getWMInstance();
    var defaults = wm.getDefaultSetting('panels');
    console.debug("CoreWM::resetPanelItems()", defaults);

    this.panelItems = defaults[0].items;

    this.refreshPanelItems();
    this._focus();
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application constructor
   */
  var ApplicationSettings = function(args, metadata) {
    Application.apply(this, ['ApplicationSettings', args, metadata]);

    // You can set application variables here
  };

  ApplicationSettings.prototype = Object.create(Application.prototype);

  ApplicationSettings.prototype.destroy = function() {
    // Destroy communication, timers, objects etc. here

    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationSettings.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);
    this._addWindow(new ApplicationSettingsWindow(this, metadata, this._getArgument('tab')));
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
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Class = ApplicationSettings;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
