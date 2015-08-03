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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';
  // TODO: Playlist
  // TODO: Server seek support: https://gist.github.com/codler/3906826

  function formatTime(secs) {
    var hr  = Math.floor(secs / 3600);
    var min = Math.floor((secs - (hr * 3600))/60);
    var sec = Math.floor(secs - (hr * 3600) -  (min * 60));

    if (min < 10) {
      min = '0' + min;
    }
    if (sec < 10){
      sec  = '0' + sec;
    }

    return min + ':' + sec;
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationMusicPlayerWindow(app, metadata, scheme, file) {
    Window.apply(this, ['ApplicationMusicPlayerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      allow_drop: true,
      allow_resize: false,
      allow_maximize: false,
      width: 370,
      height: 260
    }, app, scheme]);

    this.currentFile = file ? new VFS.File(file) : null;
    this.updated = false;
  }

  ApplicationMusicPlayerWindow.prototype = Object.create(Window.prototype);
  ApplicationMusicPlayerWindow.constructor = Window.prototype;

  ApplicationMusicPlayerWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'MusicPlayerWindow', root);

    var label = this._scheme.find(this, 'LabelTime');
    var seeker = this._scheme.find(this, 'Seek');

    var player = scheme.find(this, 'Player');
    var audio = player.$element.firstChild;

    var menuMap = {
      MenuOpen: function() { app.openDialog(self.currentFile, self); },
      MenuClose: function() { self._close(); }
    };

    scheme.find(this, 'SubmenuFile').on('select', function(ev) {
      if ( menuMap[ev.detail.id] ) {
        menuMap[ev.detail.id]();
      }
    });

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
      audio.pause();
      audio.currentTime = ev.detail;
      audio.play();
    });

    player.on('play', function(ev) {
      buttonPause.set('disabled', false);
      buttonPlay.set('disabled', true);
    });
    player.on('ended', function(ev) {
      buttonPause.set('disabled', true);
    });
    player.on('pause', function(ev) {
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

    // Load given file
    if ( this.currentFile ) {
      app.openFile(this.currentFile, this);
    }

    return root;
  };

  ApplicationMusicPlayerWindow.prototype.play = function(file) {
    if ( !file ) { return; }

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
    this._setTitle();

    function getInfo() {
      self._app._call('info', {filename: file.path}, function(res) {
        var info = (res && res.result) ? res.result : null;
        if ( info ) {
          if ( info.Artist ) { labelArtist.set('value', info.Artist); }
          if ( info.Album ) { labelAlbum.set('value', info.Album); }
          if ( info.Title ) { labelTitle.set('value', info.Track); }
        }
      });
    }

    VFS.url(file, function(error, result) {
      if ( !error && result ) {
        self._setTitle(file.filename, true);
        self._currentFile = file;

        audio.src = result || '';
        audio.play();

        getInfo();
      }
    });
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

  ApplicationMusicPlayerWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) { return; }

    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._app.openFile(new VFS.File(data), this);
      }
    }
  };

  ApplicationMusicPlayerWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
    this.currentFile = null;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationMusicPlayer = function(args, metadata) {
    Application.apply(this, ['ApplicationMusicPlayer', args, metadata]);
  };

  ApplicationMusicPlayer.prototype = Object.create(Application.prototype);
  ApplicationMusicPlayer.constructor = Application;

  ApplicationMusicPlayer.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationMusicPlayer.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    var file = this._getArgument('file');
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationMusicPlayerWindow(self, metadata, scheme, file));
    });
  };

  ApplicationMusicPlayer.prototype.openFile = function(file, win) {
    if ( !file ) { return; }

    var check = this.__metadata.mime || [];
    if ( !Utils.checkAcceptMime(file.mime, check) ) {
      API.error(this.__label,
                API._('ERR_FILE_APP_OPEN'),
                API._('ERR_FILE_APP_OPEN_FMT',
                file.path, file.mime)
      );
      return;
    }

    this._setArgument('file', file);

    win.play(file);
  };

  ApplicationMusicPlayer.prototype.openDialog = function(path, win) {
    var self = this;

    win._toggleDisabled(true);
    API.createDialog('File', {
      filter: this.__metadata.mime,
      path: path
    }, function(ev, button, result) {
      win._toggleDisabled(false);
      if ( result ) {
        self.openFile(result, win);
      }
    }, win);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationMusicPlayer = OSjs.Applications.ApplicationMusicPlayer || {};
  OSjs.Applications.ApplicationMusicPlayer.Class = ApplicationMusicPlayer;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
