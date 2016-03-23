/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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
(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';
  // TODO: Playlist
  // TODO: Server seek support: https://gist.github.com/codler/3906826

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

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationMusicPlayerWindow(app, metadata, scheme, file) {
    DefaultApplicationWindow.apply(this, ['ApplicationMusicPlayerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      allow_drop: true,
      allow_resize: false,
      allow_maximize: false,
      width: 370,
      height: 260
    }, app, scheme, file]);

    this.updated = false;
  }

  ApplicationMusicPlayerWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationMusicPlayerWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationMusicPlayerWindow.prototype.init = function(wm, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'MusicPlayerWindow', root, null, null, {
      _: OSjs.Applications.ApplicationMusicPlayer._
    });

    var label = this._scheme.find(this, 'LabelTime');
    var seeker = this._scheme.find(this, 'Seek');

    var player = scheme.find(this, 'Player');
    var audio = player.$element.firstChild;

    var buttonStart = scheme.find(this, 'ButtonStart').set('disabled', true);
    var buttonRew = scheme.find(this, 'ButtonRew').set('disabled', true);
    var buttonPlay = scheme.find(this, 'ButtonPlay').set('disabled', true).on('click', function() {
      audio.play();
    });
    var buttonPause = scheme.find(this, 'ButtonPause').set('disabled', true).on('click', function() {
      audio.pause();
    });
    var buttonFwd = scheme.find(this, 'ButtonFwd').set('disabled', true);
    var buttonEnd = scheme.find(this, 'ButtonEnd').set('disabled', true);

    seeker.on('change', function(ev) {
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
            msg = OSjs.Applications.ApplicationMusicPlayer._('Playback aborted');
            break;
          case ev.target.error.MEDIA_ERR_NETWORK:
            msg = OSjs.Applications.ApplicationMusicPlayer._('Network or communication error');
            break;
          case ev.target.error.MEDIA_ERR_DECODE:
            msg = OSjs.Applications.ApplicationMusicPlayer._('Decoding failed. Corruption or unsupported media');
            break;
          case ev.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            msg = OSjs.Applications.ApplicationMusicPlayer._('Media source not supported');
            break;
          default:
            msg = OSjs.API._('ERR_APP_UNKNOWN_ERROR');
            break;
        }
      } catch ( e ) {
        msg = OSjs.API._('ERR_GENERIC_APP_FATAL_FMT', e);
      }

      if ( msg ) {
        API.createDialog('Alert', {title: self._title, message: msg}, null, self);
      }
    });

    return root;
  };

  ApplicationMusicPlayerWindow.prototype.showFile = function(file, content) {
    if ( !file || !content ) { return; }

    var self = this;
    var scheme = this._scheme;
    var player = scheme.find(this, 'Player');
    var seeker = this._scheme.find(this, 'Seek');
    var audio = player.$element.firstChild;

    var artist = file ? file.filename : '';
    var album = file ? Utils.dirname(file.path) : '';

    var labelArtist = this._scheme.find(this, 'LabelArtist').set('value', '');
    var labelTitle  = this._scheme.find(this, 'LabelTitle').set('value', artist);
    var labelAlbum  = this._scheme.find(this, 'LabelAlbum').set('value', album);
    this._scheme.find(this, 'LabelTime').set('value', '');
    seeker.set('min', 0);
    seeker.set('max', 0);
    seeker.set('value', 0);

    this.updated = false;

    function getInfo() {
      self._app._api('info', {filename: file.path}, function(err, info) {
        if ( info ) {
          if ( info.Artist ) { labelArtist.set('value', info.Artist); }
          if ( info.Album ) { labelAlbum.set('value', info.Album); }
          if ( info.Title ) { labelTitle.set('value', info.Track); }
        }
      });
    }

    audio.src = content || '';
    audio.play();
    getInfo();
  };

  ApplicationMusicPlayerWindow.prototype.updateTime = function(label, seeker) {
    if ( this._destroyed ) { return; } // Important because async

    var player = this._scheme.find(this, 'Player');
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

    if ( !this.updated ) {
      seeker.set('min', 0);
      seeker.set('max', total);
    }

    label.set('value', time);
    seeker.set('value', current);

    this.updated = true;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationMusicPlayer = function(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationMusicPlayer', args, metadata, {
      readData: false
    }]);
  };

  ApplicationMusicPlayer.prototype = Object.create(DefaultApplication.prototype);
  ApplicationMusicPlayer.constructor = DefaultApplication;

  ApplicationMusicPlayer.prototype.destroy = function() {
    return DefaultApplication.prototype.destroy.apply(this, arguments);
  };

  ApplicationMusicPlayer.prototype.init = function(settings, metadata) {
    var self = this;
    DefaultApplication.prototype.init.call(this, settings, metadata, function(scheme, file) {
      self._addWindow(new ApplicationMusicPlayerWindow(self, metadata, scheme, file));
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationMusicPlayer = OSjs.Applications.ApplicationMusicPlayer || {};
  OSjs.Applications.ApplicationMusicPlayer.Class = ApplicationMusicPlayer;

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
