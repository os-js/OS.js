/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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
import SettingsManager from 'core/settings-manager';
import {getConfig} from 'core/config';
import FileMetadata from 'vfs/file';
import PackageManager from 'core/package-manager';
import * as FS from 'utils/fs';
import * as Compability from 'utils/compability';
import * as DOM from 'utils/dom';
import * as VFS from 'vfs/fs';

/**
 * Theme resource handling
 */
class Theme {

  constructor() {
    this.settings = null;
    this.$themeScript = null;
  }

  init() {
    this.settings = SettingsManager.instance('__theme__', {
      enableSounds: true,
      styleTheme: 'default',
      soundTheme: 'default',
      iconTheme: 'default',
      sounds: {}
    });
  }

  update(settings, settheme) {
    this.settings.set(null, settings);
    if ( settheme ) {
      this.setTheme(settings);
    }
  }

  destroy() {
    this.$themeScript = DOM.$remove(this.$themeScript);
  }

  /**
   * Perform an action on current theme
   * @param {String} action Method name
   * @param {Array} args Method arumentgs
   * @return {*}
   */
  themeAction(action, args) {
    const theme = this.getStyleTheme();
    args = args || [];

    try {
      if ( OSjs.Themes[theme] ) {
        return OSjs.Themes[theme][action].apply(null, args);
      }
    } catch ( e ) {
      console.warn(e);
    }

    return null;
  }

  /**
   * Set the background
   * @param {Object} settings Settings
   */
  _setBackground(settings) {
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    const typeMap = {
      'image': 'normal',
      'image-center': 'center',
      'image-fill': 'fill',
      'image-strech': 'strech'
    };

    let className = 'color';
    let back = 'none';
    if ( settings.wallpaper && settings.background.match(/^image/) ) {
      back = settings.wallpaper;
      className = typeMap[settings.background] || 'default';
    }

    if ( back !== 'none' ) {
      try {
        VFS.url(back).then((result) => {
          back = 'url(\'' + result + '\')';
          document.body.style.backgroundImage = back;
          return true;
        });
      } catch ( e ) {
        console.warn(e);
      }
    } else {
      document.body.style.backgroundImage = back;
    }

    if ( settings.backgroundColor ) {
      document.body.style.backgroundColor = settings.backgroundColor;
    }

    if ( settings.fontFamily ) {
      document.body.style.fontFamily = settings.fontFamily;
    }

    if ( isFirefox ) {
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundAttachment = 'scroll';
    }

    document.body.setAttribute('data-background-style', className);
  }

  getThemeCSS(name) {
    let root = getConfig('Connection.RootURI', '/');
    if ( name === null ) {
      return root + 'blank.css';
    }

    root = getConfig('Connection.ThemeURI');
    return root + '/' + name + '.css';
  }

  /**
   * Set theme
   * @param {Object} settings Settings
   */
  setTheme(settings) {
    this.themeAction('destroy');

    this.setThemeScript(this.getThemeResource('theme.js'));

    document.body.setAttribute('data-style-theme', settings.styleTheme);
    document.body.setAttribute('data-icon-theme', settings.iconTheme);
    document.body.setAttribute('data-sound-theme', settings.soundTheme);
    document.body.setAttribute('data-animations', String(settings.animations));

    this._setBackground(settings);

    this.settings.set(null, settings);
  }

  /**
   * Set theme script
   * @param {String} src Source file
   */
  setThemeScript(src) {
    if ( this.$themeScript ) {
      this.$themeScript = DOM.$remove(this.$themeScript);
    }

    if ( src ) {
      this.$themeScript = DOM.$createJS(src, null, () => {
        this.themeAction('init');
      });
    }
  }

  /**
   * Gets current Style theme
   *
   * @param   {Boolean}    returnMetadata      Return theme metadata instead of name
   * @param   {Boolean}    [convert=false]     Converts the measures into px
   *
   * @return  {String}                      Or JSON
   */
  getStyleTheme(returnMetadata, convert) {
    const name = this.settings.get('styleTheme') || null;
    if ( returnMetadata ) {
      let found = null;
      if ( name ) {
        this.getStyleThemes().forEach(function(t) {
          if ( t && t.name === name ) {
            found = t;
          }
        });
      }

      // FIXME: Optimize
      if ( found && convert === true ) {
        const tmpEl = document.createElement('div');
        tmpEl.style.visibility = 'hidden';
        tmpEl.style.position = 'fixed';
        tmpEl.style.top = '-10000px';
        tmpEl.style.left = '-10000px';
        tmpEl.style.width = '1em';
        tmpEl.style.height = '1em';

        document.body.appendChild(tmpEl);
        const wd = tmpEl.offsetWidth;
        tmpEl.parentNode.removeChild(tmpEl);

        if ( typeof found.style.window.margin === 'string' && found.style.window.margin.match(/em$/) ) {
          const marginf = parseFloat(found.style.window.margin);
          found.style.window.margin = marginf * wd;
        }

        if ( typeof found.style.window.border === 'string' && found.style.window.border.match(/em$/) ) {
          const borderf = parseFloat(found.style.window.border);
          found.style.window.border = borderf * wd;
        }
      }

      return found;
    }

    return name;
  }

  /**
   * Default method for getting a resource from current theme
   *
   * @param   {String}    name    Resource filename
   * @param   {String}    type    Type ('base' or a sub-folder)
   *
   * @return  {String}            The absolute URL to the resource
   */
  getThemeResource(name, type) {
    name = name || null;
    type = type || null;

    const root = getConfig('Connection.ThemeURI');

    function getName(str, theme) {
      if ( !str.match(/^\//) ) {
        if ( type === 'base' || type === null ) {
          str = root + '/' + theme + '/' + str;
        } else {
          str = root + '/' + theme + '/' + type + '/' + str;
        }
      }
      return str;
    }

    if ( name ) {
      const theme = this.getStyleTheme();
      name = getName(name, theme);
    }

    return name;
  }

  /**
   * Default method for getting a sound from theme
   *
   * @param   {String}    name    Resource filename
   *
   * @return  {String}            The absolute URL to the resource
   */
  getSound(name) {
    name = name || null;
    if ( name ) {
      const theme = this.getSoundTheme();
      const root = getConfig('Connection.SoundURI');
      const compability = Compability.getCompability();

      if ( !name.match(/^\//) ) {
        let ext = 'oga';
        if ( !compability.audioTypes.ogg ) {
          ext = 'mp3';
        }
        name = root + '/' + theme + '/' + name + '.' + ext;
      }
    }
    return name;
  }

  /**
   * Global function for playing a sound
   *
   * @param   {String}      name      Sound name
   * @param   {Number}      volume    Sound volume (0.0 - 1.0)
   *
   * @return {Audio}
   */
  playSound(name, volume) {
    const filename = this.getSoundFilename(name);
    if ( !filename ) {
      console.debug('playSound()', 'Cannot play sound, no compability or not enabled!');
      return null;
    }

    if ( typeof volume === 'undefined' ) {
      volume = 1.0;
    }

    const f = this.getSound(filename);
    console.debug('playSound()', name, filename, f, volume);

    const a = new Audio(f);
    a.volume = volume;
    a.play();
    return a;
  }

  /**
   * Default method for getting a icon from theme
   *
   * @param   {String}    name          Resource filename
   * @param   {String}    [size=16x16]  Icon size
   *
   * @return  {String}            The absolute URL to the resource
   */
  getIcon(name, size) {
    name = name || '';
    size = size || '16x16';

    if ( !name.match(/^(https?)?:?\//) ) {
      const root = getConfig('Connection.IconURI');
      const theme = this.getIconTheme();

      return root + '/' + theme + '/' + size + '/' + name;
    }

    return name;
  }

  /**
   * Get a icon based in file and mime
   *
   * @param   {File}      file            File Data (see supported types)
   * @param   {String}    [size=16x16]    Icon size
   * @param   {String}    [icon]          Default icon
   *
   * @return  {String}            The absolute URL to the icon
   */
  getFileIcon(file, size, icon) {
    icon = icon || 'mimetypes/text-x-preview.png';

    if ( typeof file === 'object' && !(file instanceof FileMetadata) ) {
      file = new FileMetadata(file);
    }

    if ( !file.filename ) {
      throw new Error('Filename is required for getFileIcon()');
    }

    const map = [
      {match: 'application/pdf', icon: 'mimetypes/x-office-document.png'},
      {match: 'application/zip', icon: 'mimetypes/package-x-generic.png'},
      {match: 'application/x-python', icon: 'mimetypes/text-x-script.png'},
      {match: 'application/x-lua', icon: 'mimetypes/text-x-script.png'},
      {match: 'application/javascript', icon: 'mimetypes/text-x-script.png'},
      {match: 'text/html', icon: 'mimetypes/text-html.png'},
      {match: 'text/xml', icon: 'mimetypes/text-html.png'},
      {match: 'text/css', icon: 'mimetypes/text-x-script.png'},

      {match: 'osjs/document', icon: 'mimetypes/x-office-document.png'},
      {match: 'osjs/draw', icon: 'mimetypes/image-x-generic.png'},

      {match: /^text\//, icon: 'mimetypes/text-x-generic.png'},
      {match: /^audio\//, icon: 'mimetypes/audio-x-generic.png'},
      {match: /^video\//, icon: 'mimetypes/video-x-generic.png'},
      {match: /^image\//, icon: 'mimetypes/image-x-generic.png'},
      {match: /^application\//, icon: 'mimetypes/application-x-executable.png'}
    ];

    if ( file.type === 'dir' ) {
      icon = 'places/folder.png';
    } else if ( file.type === 'trash' ) {
      icon = 'places/user-trash.png';
    } else if ( file.type === 'application' ) {
      const appname = FS.filename(file.path);
      const meta = PackageManager.getPackage(appname);

      if ( meta ) {
        if ( !meta.icon.match(/^((https?:)|\.)?\//) ) {
          return this.getIcon(meta.icon, size);
        }
        return PackageManager.getPackageResource(appname, meta.icon);
      }
    } else {
      const mime = file.mime || 'application/octet-stream';

      map.every((iter) => {
        let match = false;
        if ( typeof iter.match === 'string' ) {
          match = (mime === iter.match);
        } else {
          match = mime.match(iter.match);
        }

        if ( match ) {
          icon = iter.icon;
          return false;
        }

        return true;
      });
    }

    return this.getIcon(icon, size);
  }

  /**
   * Gets current icon theme
   * @return {String}
   */
  getIconTheme() {
    return this.settings.get('iconTheme', 'default');
  }

  /**
   * Gets current sound theme
   * @return {String}
   */
  getSoundTheme() {
    return this.settings.get('soundTheme', 'default');
  }

  /**
   * Gets sound filename from key
   *
   * @param  {String}     k       Sound name key
   *
   * @return  {String}
   */
  getSoundFilename(k) {
    const compability = Compability.getCompability();
    if ( !compability.audio || !this.settings.get('enableSounds') || !k ) {
      return false;
    }

    const sounds = this.settings.get('sounds', {});
    return sounds[k] || null;
  }

  /**
   * Gets a list of Style themes
   *
   * @return  {String[]}   The list of themes
   */
  getStyleThemes() {
    return getConfig('Styles', []);
  }

  /**
   * Gets a list of Sound themes
   *
   * @return  {String[]}   The list of themes
   */
  getSoundThemes() {
    return getConfig('Sounds', []);
  }

  /**
   * Gets a list of Icon themes
   *
   * @return  {String[]}   The list of themes
   */
  getIconThemes() {
    return getConfig('Icons', []);
  }

}

export default (new Theme());
