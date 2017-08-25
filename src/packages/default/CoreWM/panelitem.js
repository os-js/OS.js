import Translations from './locales';

const _ = OSjs.require('core/locales').createLocalizer(Translations);
const Menu = OSjs.require('gui/menu');
const DOM = OSjs.require('utils/dom');
const Events = OSjs.require('utils/events');
const SettingsFragment = OSjs.require('helpers/settings-fragment');
const WindowManager = OSjs.require('core/window-manager');

export default class PanelItem {
  static metadata() {
    return {
      name: 'PanelItem',
      description: 'PanelItem Description',
      icon: 'actions/stock_about.png',
      hasoptions: false
    };
  }

  constructor(className, itemName, settings, defaults) {
    this._$root = null;
    this._$container = null;
    this._className = className || 'Unknown';
    this._itemName = itemName || className.split(' ')[0];
    this._settings = null;
    this._settingsDialog = null;

    if ( settings && (settings instanceof SettingsFragment) && defaults ) {
      this._settings = settings.mergeDefaults(defaults);
    }
  }

  init() {
    this._$root = document.createElement('corewm-panel-item');
    this._$root.className = this._className;

    this._$container = document.createElement('ul');
    this._$container.setAttribute('role', 'toolbar');
    this._$container.className = 'corewm-panel-buttons';

    if ( this._settings ) {
      var title = _('Open {0} Settings', _(this._itemName));
      Events.$bind(this._$root, 'contextmenu', (ev) => {
        ev.preventDefault();

        Menu.create([{
          title: title,
          onClick: () => this.openSettings()
        }], ev);
      });
    }

    this._$root.appendChild(this._$container);

    return this._$root;
  }

  destroy() {
    if ( this._settingsDialog ) {
      this._settingsDialog.destroy();
    }

    Events.$unbind(this._$root, 'contextmenu');

    this._settingsDialog = null;
    this._$root = DOM.$remove(this._$root);
    this._$container = DOM.$remove(this._$container);
  }

  applySettings() {
  }

  openSettings(DialogRef, args) {
    if ( this._settingsDialog ) {
      this._settingsDialog._restore();
      return false;
    }

    var wm = WindowManager.instance;

    if ( DialogRef ) {
      this._settingsDialog = new DialogRef(this, wm._scheme, (button) => {
        if ( button === 'ok' ) {
          this.applySettings();
        }
        this._settingsDialog = null;
      });

      wm.addWindow(this._settingsDialog, true);
    }

    return true;
  }

  getRoot() {
    return this._$root;
  }
}
