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

/*eslint valid-jsdoc: "off"*/
// TODO: Playlist
// TODO: Server seek support: https://gist.github.com/codler/3906826

import Translations from './locales';

const FS = OSjs.require('utils/fs');
const Utils = OSjs.require('utils/misc');
const Locales = OSjs.require('core/locales');
const Dialog = OSjs.require('core/dialog');
const FileMetadata = OSjs.require('vfs/file');
const DefaultApplication = OSjs.require('helpers/default-application');
const DefaultApplicationWindow = OSjs.require('helpers/default-application-window');

const doTranslate = Locales.createLocalizer(Translations);

function formatTime(secs) {
  var hr  = Math.floor(secs / 3600);
  var min = Math.floor((secs - (hr * 3600)) / 60);
  var sec = Math.floor(secs - (hr * 3600) -  (min * 60));

  if (min < 10) {
    min = '0' + min;
  }
  if (sec < 10) {
    sec  = '0' + sec;
  }

  return min + ':' + sec;
}

class ApplicationMusicPlayerWindow extends DefaultApplicationWindow {

  constructor(app, metadata, file) {
    super('ApplicationMusicPlayerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      auto_size: true,
      allow_drop: true,
      allow_resize: false,
      allow_maximize: false,
      width: 370,
      height: 260,
      translator: doTranslate
    }, app, file);

    this.updated = 0;
    this.seeking = false;
  }

  init(wm, app) {
    const root = super.init(...arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    this._render('MusicPlayerWindow', require('osjs-scheme-loader!./scheme.html'));

    var label = this._find('LabelTime');
    var seeker = this._find('Seek');

    var player = this._find('Player');
    var audio = player.$element.firstChild;

    this._find('ButtonStart').set('disabled', true);
    this._find('ButtonRew').set('disabled', true);
    var buttonPlay = this._find('ButtonPlay').set('disabled', true).on('click', function() {
      audio.play();
    });
    var buttonPause = this._find('ButtonPause').set('disabled', true).on('click', function() {
      audio.pause();
    });
    this._find('ButtonFwd').set('disabled', true);
    this._find('ButtonEnd').set('disabled', true);

    seeker.on('change', function(ev) {
      self.seeking = false;
      if ( audio && !audio.paused ) {
        try {
          audio.pause();
          if ( ev ) {
            audio.currentTime = ev.detail || 0;
          }
          audio.play();
        } catch ( e ) {}
      }
    });

    player.on('play', function(ev) {
      seeker.set('disabled', false);
      buttonPause.set('disabled', false);
      buttonPlay.set('disabled', true);
    });
    player.on('ended', function(ev) {
      seeker.set('disabled', true);
      buttonPause.set('disabled', true);
    });
    player.on('pause', function(ev) {
      seeker.set('disabled', true);
      buttonPause.set('disabled', false);
      buttonPlay.set('disabled', false);
    });
    player.on('loadeddata', function(ev) {
    });
    player.on('timeupdate', function(ev) {
      self.updateTime(label, seeker);
    });
    player.on('error', function(ev) {
      if ( !player.$element.src ) {
        return;
      }

      var msg = null;
      try {
        switch ( ev.target.error.code ) {
          case ev.target.error.MEDIA_ERR_ABORTED:
            msg = doTranslate('Playback aborted');
            break;
          case ev.target.error.MEDIA_ERR_NETWORK:
            msg = doTranslate('Network or communication error');
            break;
          case ev.target.error.MEDIA_ERR_DECODE:
            msg = doTranslate('Decoding failed. Corruption or unsupported media');
            break;
          case ev.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            msg = doTranslate('Media source not supported');
            break;
          default:
            msg = Locales._('ERR_APP_UNKNOWN_ERROR');
            break;
        }
      } catch ( e ) {
        msg = Locales._('ERR_GENERIC_APP_FATAL_FMT', e);
      }

      if ( msg ) {
        Dialog.create('Alert', {title: self._title, message: msg}, null, self);
      }
    });

    return root;
  }

  showFile(file, content) {
    if ( !file || !content ) {
      return;
    }

    var self = this;
    var player = this._find('Player');
    var seeker = this._find('Seek');
    var audio = player.$element.firstChild;

    seeker.on('mousedown', function() {
      self.seeking = true;
    });
    seeker.on('mouseup', function() {
      self.seeking = false;
    });

    var artist = file ? file.filename : '';
    var album = file ? FS.dirname(file.path) : '';

    var labelArtist = this._find('LabelArtist').set('value', '');
    var labelTitle  = this._find('LabelTitle').set('value', artist);
    var labelAlbum  = this._find('LabelAlbum').set('value', album);
    this._find('LabelTime').set('value', '');
    seeker.set('min', 0);
    seeker.set('max', 0);
    seeker.set('value', 0);

    this.updated = 0;
    this.seeking = false;

    function getInfo() {
      self._app._api('info', {filename: file.path}).then((info) => {
        if ( info ) {
          if ( info.Artist ) {
            labelArtist.set('value', info.Artist);
          }
          if ( info.Album ) {
            labelAlbum.set('value', info.Album);
          }
          if ( info.Title ) {
            labelTitle.set('value', info.Track);
          }
        }
      });
    }

    audio.src = content || '';
    audio.play();
    getInfo();
  }

  updateTime(label, seeker) {
    if ( this._destroyed ) {
      return; // Important because async
    }

    var player = this._find('Player');
    var audio = player.$element.firstChild;

    var total   = audio.duration;
    var current = audio.currentTime;
    var unknown = false;

    if ( isNaN(current) || !isFinite(current) ) {
      current = 0.0;
    }

    if ( isNaN(total) || !isFinite(total) ) {
      total = current;
      unknown = true;
    }

    var time = Utils.format('{0} / {1}', formatTime(current), unknown ? '<unknown>' : formatTime(total));

    if ( this.updated < 2 ) {
      seeker.set('min', 0);
      seeker.set('max', total);
    } else {
      this.updated++;
    }

    label.set('value', time);
    if ( !this.seeking ) {
      seeker.set('value', current);
    }
  }
}

class ApplicationMusicPlayer extends DefaultApplication {

  constructor(args, metadata) {
    super('ApplicationMusicPlayer', args, metadata, {
      readData: false
    });
  }

  init(settings, metadata) {
    super.init(...arguments);

    const file = this._getArgument('file');
    this._addWindow(new ApplicationMusicPlayerWindow(this, metadata, file));
  }

  _onMessage(msg, obj, args) {
    super._onMessage(...arguments);

    if ( msg === 'attention' && obj && obj.file ) {
      var win = this._getMainWindow();
      this.openFile(new FileMetadata(obj.file), win);
    }
  }
}

OSjs.Applications.ApplicationMusicPlayer = ApplicationMusicPlayer;
