/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Application, Window, GUI, Dialogs) {

  function formatTime(secs) {
    var hr  = Math.floor(secs / 3600);
    var min = Math.floor((secs - (hr * 3600))/60);
    var sec = Math.floor(secs - (hr * 3600) -  (min * 60));

    if (min < 10){
      min = "0" + min;
    }
    if (sec < 10){
      sec  = "0" + sec;
    }

    return min + ':' + sec;
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window
   */
  var ApplicationMusicPlayerWindow = function(app) {
    Window.apply(this, ['ApplicationMusicPlayerWindow', {width: 322, height: 225}, app]);

    this.title            = "Music Player";
    this.$buttons         = {};
    this.$labels          = {};
    this.$audio           = null;
    this.currentFilename  = '';
    this.seeking          = false;
    this.showPlaylist     = false;

    // Set window properties here
    this._title = this.title;
    this._icon  = "status/audio-volume-high.png";

    this._properties.allow_drop     = true;
    this._properties.allow_resize   = false;
    this._properties.allow_maximize = false;
  };

  ApplicationMusicPlayerWindow.prototype = Object.create(Window.prototype);

  ApplicationMusicPlayerWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    var _createButton = function(img, onclick) {
      var b = document.createElement('button');
      var i = document.createElement('img');
      i.alt = '';
      i.src = OSjs.API.getThemeResource('actions/' + img + '.png', 'icon', '32x32');
      b.onclick = onclick;
      b.disabled = "disabled";
      b.appendChild(i);

      self.$buttons[img.split('_')[1]] = b;

      return b;
    };

    var _openFile = function(playlist) {
      app._createDialog('File', [{type: 'open', mimes: ['^audio']}, function(btn, fname, fmime) {
        if ( btn !== 'ok' ) return;
        app.play(fname, fmime);
      }], self);
    };

    var menuBar = this._addGUIElement(new OSjs.GUI.MenuBar('MusicPlayerMenuBar'), root);
    menuBar.addItem("File", [
      {title: 'Open', name: 'Open', onClick: function() {
        _openFile(false);
      }},
      /*
      {title: 'Add', name: 'Add', onClick: function() {
        _openFile(true);
      }},
      */
      {title: 'Close', name: 'Close', onClick: function() {
        self._close();
      }}
    ]);
    menuBar.addItem("Playlist", []);

    menuBar.onMenuOpen = function(menu, pos, title) {
      if ( title == "Playlist" ) {
        self.togglePlaylist();
      }
    };

    var container = document.createElement('div');
    container.className = 'Container';

    // Audio
    this.$audio = document.createElement('audio');
    this.$audio.style.display = 'none';
    this.$audio.style.position = 'absolute';
    this.$audio.style.top = '-10000px';
    this.$audio.style.left = '-10000px';

    // Info
    var info = document.createElement('div');
    info.className = 'Info';

    var lblArtist = document.createElement('div');
    var spanArtist = document.createElement('span');
    var infoArtist = document.createElement('span');
    spanArtist.className = 'Label';
    spanArtist.innerHTML = 'Artist';
    infoArtist.innerHTML = '-';
    lblArtist.appendChild(spanArtist);
    lblArtist.appendChild(infoArtist);
    info.appendChild(lblArtist);
    this.$labels.Artist = infoArtist;

    var lblAlbum = document.createElement('div');
    var spanAlbum = document.createElement('span');
    var infoAlbum = document.createElement('span');
    spanAlbum.className = 'Label';
    spanAlbum.innerHTML = 'Album';
    infoAlbum.innerHTML = '-';
    lblAlbum.appendChild(spanAlbum);
    lblAlbum.appendChild(infoAlbum);
    info.appendChild(lblAlbum);
    this.$labels.Album = infoAlbum;

    var lblTrack = document.createElement('div');
    var spanTrack = document.createElement('span');
    var infoTrack = document.createElement('span');
    spanTrack.className = 'Label';
    spanTrack.innerHTML = 'Track';
    infoTrack.innerHTML = '-';
    lblTrack.appendChild(spanTrack);
    lblTrack.appendChild(infoTrack);
    info.appendChild(lblTrack);
    this.$labels.Track = infoTrack;

    var lblTime = document.createElement('div');
    var spanTime = document.createElement('span');
    var infoTime = document.createElement('span');
    spanTime.className = 'Label';
    spanTime.innerHTML = 'Time';
    infoTime.innerHTML = '00:00 / 00:00';
    lblTime.appendChild(spanTime);
    lblTime.appendChild(infoTime);
    info.appendChild(lblTime);
    this.$labels.Time = infoTime;

    // Buttons
    var buttons = document.createElement('div');
    buttons.className = 'Buttons';

    buttons.appendChild(_createButton('player_start', function(ev) {
    }));
    buttons.appendChild(_createButton('player_rew', function(ev) {
    }));
    buttons.appendChild(_createButton('player_play', function(ev) {
      self.$audio.play();
    }));
    buttons.appendChild(_createButton('player_pause', function(ev) {
      self.$audio.pause();
    }));
    buttons.appendChild(_createButton('player_fwd', function(ev) {
    }));
    buttons.appendChild(_createButton('player_end', function(ev) {
    }));

    // Containers
    container.appendChild(info);
    var slider = this._addGUIElement(new OSjs.GUI.Slider('MusicPlayerSlider', {min:0, max:100, val:0}, function(val) {
      if ( val < 0 ) return;
      self.seek(val);
    }), container);
    container.appendChild(buttons);

    // FIXME: Remove event listeners
    this.$audio.addEventListener("loadeddata", function(ev) {
      self.updateInfo(ev, null, slider);
      app.info(self.currentFilename);
    });
    this.$audio.addEventListener("timeupdate", function(ev) {
      self.updateTime(ev, slider);
    });
    this.$audio.addEventListener("error", function(ev) {
      self.updateInfo(ev, null, slider);

      var msg;
      try {
        switch ( ev.target.error.code ) {
          case ev.target.error.MEDIA_ERR_ABORTED:
            msg = 'You aborted the video playback.';
            break;
          case ev.target.error.MEDIA_ERR_NETWORK:
            msg = 'A network error caused the audio download to fail.';
            break;
          case ev.target.error.MEDIA_ERR_DECODE:
            msg = 'The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.';
            break;
          case ev.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            msg = 'The video audio not be loaded, either because the server or network failed or because the format is not supported.';
            break;
          default:
            msg = "Unknown error";
            break;
        }
      } catch ( e ) {
        msg = "Fatal error: " + e;
      }

      self._error("Music Player error", "Failed to play file", msg);
    }, true);

    root.appendChild(container);
    root.appendChild(this.$audio);

    var pl = this._addGUIElement(new OSjs.GUI.ListView('MusicPlayerPlaylist'), root);
    pl.setColumns([
      {key: 'name',     title: 'Name'},
      {key: 'filename', title: 'Filename', visible: false},
      {key: 'mime',     title: 'Mime', visible: false}
     ]);

    pl.onActivate = function(ev, el, item) {
      if ( item && item.filename ) {
        app.play(item.filename, item.mime);
      }
    };

    return root;
  };

  ApplicationMusicPlayerWindow.prototype.destroy = function() {
    // Destroy custom objects etc. here

    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationMusicPlayerWindow.prototype._onDndEvent = function(ev, type, item, args) {
    Window.prototype._onDndEvent.apply(this, arguments);
    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._appRef.play(data.path, data.mime);
      }
    }
  };

  ApplicationMusicPlayerWindow.prototype.play = function(filename, mime, opened) {
    this.currentFilename = filename;

    try {
      this.$labels.Artist.innerHTML = filename;
      this.$labels.Album.innerHTML = mime;
    } catch ( e ) {
      console.warn("Failed to set labels", e);
    }

    try {
      this.$buttons.play.removeAttribute('disabled');
      this.$buttons.pause.removeAttribute('disabled');
    } catch ( e ) {
      console.warn("Failed toggle buttons", e);
    }

    this.$audio.src         = OSjs.API.getResourceURL(filename);
    this.$audio.volume      = .0;

    this.$audio.play();

    this._setTitle(this.title + ' - ' + OSjs.Utils.filename(filename));

    var pl = this._getGUIElement('MusicPlayerPlaylist');
    if ( pl ) {
      if ( opened ) {
        var row = {
          name:       filename,
          filename:   filename,
          mime:       mime
        };

        pl.setRows([row]);
      } else {
        pl.setRows([]);
      }

      pl.render();
    }

    return true;
  };

  ApplicationMusicPlayerWindow.prototype.updateInfo = function(ev, info, slider) {
    if ( this.seeking ) return;
    if ( !this.$audio ) return;
    info = info || {};
    var msg = '-';
    if ( !info.Artist && !info.Album && !info.Track ) {
      msg = "<i>Media information query failed</i>";
    }
    this.$labels.Artist.innerHTML = info.Artist || msg;
    this.$labels.Album.innerHTML  = info.Album  || OSjs.Utils.dirname(this.currentFilename);
    this.$labels.Track.innerHTML  = info.Track  || OSjs.Utils.filename(this.currentFilename);
    this.updateTime(ev, slider);

    if ( slider ) {
      slider.min = 0;
      slider.max = 0;
      slider.setValue(0);
    }
  };

  ApplicationMusicPlayerWindow.prototype.updateTime = function(ev, slider, error) {
    if ( this.seeking ) return;
    if ( !this.$audio ) return;
    ev = ev || window.event;

    var total   = error ? 0 : this.$audio.duration;
    var current = error ? 0 : this.$audio.currentTime;
    var unknown = false;

    if ( isNaN(current) || !isFinite(current) ) current = 0.0;
    if ( isNaN(total) || !isFinite(total) ) {
      total = current;
      unknown = true;
    }

    var ftotal   = formatTime(total);
    var fcurrent = formatTime(current);
    if ( unknown ) {
      ftotal = '-' + ftotal + ' <i>(seek unavailable in format)</i>';
    }
    this.$labels.Time.innerHTML = fcurrent  + " / " + ftotal;

    if ( slider ) {
      slider.max = Math.round(total);
      slider.setValue(Math.round(current));
    }
  };

  ApplicationMusicPlayerWindow.prototype.seek = function(val) {
    this.seeking = true;
    try {
      this.$audio.currentTime = val;
    } catch ( e ) {
      console.warn("Failed to seek", e, val);
    }

    this.seeking = false;
  };

  ApplicationMusicPlayerWindow.prototype.togglePlaylist = (function() {
    var _lastDimension = null;

    return function() {
      if ( _lastDimension === null ) {
        _lastDimension = {w: this._dimension.w, h: this._dimension.h};
      }

      this.showPlaylist = !this.showPlaylist;
      console.info("MusicPlayer::togglePlaylist()", this.showPlaylist);

      if ( this.showPlaylist ) {
        this._resize(_lastDimension.w, _lastDimension.h + 200, true);
      } else {
        this._resize(_lastDimension.w, _lastDimension.h, true);
      }
    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var ApplicationMusicPlayer = function(args, metadata) {
    if ( !OSjs.Utils.getCompability().audio ) {
      throw "Your platform does not support Audio :(";
    }
    Application.apply(this, ['ApplicationMusicPlayer', args, metadata]);
    this.__dname = 'MusicPlayer';
  };

  ApplicationMusicPlayer.prototype = Object.create(Application.prototype);

  ApplicationMusicPlayer.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, []);
  };

  ApplicationMusicPlayer.prototype.init = function(core, session) {
    Application.prototype.init.apply(this, arguments);
    var self = this;

    this._addWindow(new ApplicationMusicPlayerWindow(this));

    var path = this._getArgument('file');
    var mime = this._getArgument('mime');
    if ( path ) {
      this.play(path, mime);
    }
  };

  ApplicationMusicPlayer.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationMusicPlayerWindow' ) {
      this.destroy();
    } else if ( msg == 'attention' && args ) {
      this.play(args.file, args.mime);
    }
  };

  ApplicationMusicPlayer.prototype.play = function(filename, mime) {
    mime = mime || '';
    if ( !mime.match(/^audio/) ) {
      var msg = "The audio type is not supported: " + mime;
      var win = this._getWindow('ApplicationMusicPlayerWindow');
      win._error("Music Player error", "Failed to play file", msg);
      return;
    }

    var win = this._getWindow('ApplicationMusicPlayerWindow');
    if ( win ) {
      if ( win.play(filename, mime, true) ) {
        (function() {})();
      }
    }

    this._setArgument('file', filename);
    this._setArgument('mime', mime);
  };

  ApplicationMusicPlayer.prototype.info = function(filename) {
    var win = this._getWindow('ApplicationMusicPlayerWindow');
    if ( win ) {
      this._call('info', {filename: filename}, function(res) {
        var info = (res && res.result) ? res.result : null;
        win.updateInfo(null, info);
      });
    }
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationMusicPlayer = ApplicationMusicPlayer;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Core.GUI, OSjs.Core.Dialogs);
