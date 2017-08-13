const Window = OSjs.require('core/window');

export default class PanelItemDialog extends Window {

  constructor(name, args, settings, scheme, closeCallback) {
    super(name, args, null);

    this._closeCallback = closeCallback || function() {};
    this._settings = settings;
    this._scheme = scheme;
  }

  init(wm, app) {
    var root = Window.prototype.init.apply(this, arguments);

    this._render(this._name, this._scheme);

    this._find('ButtonApply').on('click', () => {
      this.applySettings();
      this._close('ok');
    });

    this._find('ButtonCancel').on('click', () => {
      this._close();
    });

    return root;
  }

  applySettings() {
  }

  _close(button) {
    this._closeCallback(button);
    return super._close(...arguments);
  }

  _destroy() {
    this._settings = null;
    return super._destroy(...arguments);
  }
}
