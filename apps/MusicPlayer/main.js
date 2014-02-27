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

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      'Playlist' : 'Spilleliste',
      'Playback aborted' : 'Avspilling avbrutt',
      'Network or communication error' : 'Nettverks- eller kommunikasjonsfeil',
      'Decoding failed. Corruption or unsupported media' : 'Dekoding feilet. Korrupt eller ustøttet media',
      'Media source not supported' : 'Media-kilde ikke støttet',
      'Failed to play file' : 'Klarte ikke spille av fil',
      'Artist' : 'Artist',
      'Album' : 'Album',
      'Track' : 'Låt',
      'Time' : 'Tid',
      'Media information query failed' : 'Media-informasjon forespursel feil',
      'seek unavailable in format' : 'spoling utilgjenglig i format',
      'The audio type is not supported: {0}' : 'Denne lyd-typen er ikke støttet: {0}',
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return OSjs.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

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

  /**
   * Playlist Class
   */
  var Playlist = function() {
    this.list   = [];
    this.index  = -1;
    this.length = 0;
    this.loop   = true;
  };

  Playlist.prototype.add = function(item) {
    this.list.push(item);
    this.length = this.list.length;
    return this.length - 1;
  };

  Playlist.prototype.set = function(i) {
    this.index = i;
  };

  Playlist.prototype.remove = function(i) {
    if ( this.list[i] ) {
      this.list.splice(i, 1);
    }
    if ( this.index === i ) {
      this.index = -1;
    }

    this.length = this.list.length;
  };

  Playlist.prototype.first = function() {
    if ( this.list.length ) {
      this.index = 0;
      return this.list[this.index];
    }
    return null;
  };

  Playlist.prototype.last = function() {
    if ( this.list.length ) {
      this.index = this.list.length-1;
      return this.list[this.index];
    }
    return null;
  };

  Playlist.prototype.next = function() {
    var item = null;
    if ( this.list.length ) {
      this.index++;
      if ( this.index >= this.list.length ) {
        if ( this.loop ) {
          this.index = 0;
        } else {
          this.index = this.list.length - 1;
        }
      }
      item = this.list[this.index];
    }

    return item;
  };

  Playlist.prototype.prev = function() {
    var item = null;
    if ( this.list.length ) {
      this.index--;
      if ( this.index < 0 ) {
        if ( this.loop ) {
          this.index = this.list.length - 1;
        } else {
          this.index = 0;
        }
      }
      item = this.list[this.index];
    }

    return item;
  };

  Playlist.prototype.clear = function() {
    this.index = -1;
    this.list  = [];
  };

  Playlist.prototype.load = function(list) {
    this.clear();
    this.list = list;
  };

  Playlist.prototype.isFirst = function() {
    return this.index === 0;
  };

  Playlist.prototype.isLast = function() {
    return this.index === (this.length-1);
  };

  Playlist.prototype.isEmpty = function() {
    return this.length === 0;
  };

  /**
   * AudioPlayer Class
   */
  var AudioPlayer = function() {
    this.destroyed = false;

    this.$audio                 = document.createElement('audio');
    //this.$audio.preload         = 'none';
    this.$audio.style.display   = 'none';
    this.$audio.style.position  = 'absolute';
    this.$audio.style.top       = '-10000px';
    this.$audio.style.left      = '-10000px';

    this.currentFilename        = null;
    this.paused                 = true;

    this.onLoadedData           = function() {};
    this.onTimeUpdate           = function() {};
    this.onTrackEnded           = function() {};
    this.onTrackStarted         = function() {};
    this.onTrackPaused          = function() {};
    this.onError                = function() {};

    var self = this;
    this.$audio.addEventListener("play", function(ev) {
      self._event('play', ev);
    });
    this.$audio.addEventListener("ended", function(ev) {
      self._event('ended', ev);
    });
    this.$audio.addEventListener("pause", function(ev) {
      self._event('pause', ev);
    });
    this.$audio.addEventListener("loadeddata", function(ev) {
      self._event('loadeddata', ev);
    });
    this.$audio.addEventListener("timeupdate", function(ev) {
      self._event('timeupdate', ev);
    });
    this.$audio.addEventListener("error", function(ev) {
      self._event('error', ev);
    }, true);
  };

  AudioPlayer.prototype.destroy = function() {
    var self = this;

    this.destroyed = true;

    if ( this.$audio ) {
      if ( this.$audio.parentNode ) {
        this.$audio.pause();
        this.$audio.src = 'about:blank';

        this.$audio.removeEventListener("play", function(ev) {
          self._event('play', ev);
        });
        this.$audio.removeEventListener("ended", function(ev) {
          self._event('ended', ev);
        });
        this.$audio.removeEventListener("pause", function(ev) {
          self._event('pause', ev);
        });
        this.$audio.removeEventListener("loadeddata", function(ev) {
          self._event('loadeddata', ev);
        });
        this.$audio.removeEventListener("timeupdate", function(ev) {
          self._event('timeupdate', ev);
        });
        this.$audio.removeEventListener("error", function(ev) {
          self._event('error', ev);
        }, true);

        this.$audio.parentNode.removeChild(this.$audio);
      }
      this.$audio = null;
    }
  };

  AudioPlayer.prototype.open = function(filename) {
    if ( !this.$audio ) return false;

    this.currentFilename = filename;
    this.$audio.src      = OSjs.API.getResourceURL(filename);
    //this.$audio.volume   = .0;
    this.$audio.play();


    return true;
  };

  AudioPlayer.prototype._event = function(name, ev) {
    if ( this.destroyed ) { return; }

    switch ( name ) {

      case 'play' :
        this.paused = false;
        this.onTrackStarted(ev, this);
        break;

      case 'ended' :
        this.onTrackEnded(ev, this);
        break;

      case 'pause' :
        this.paused = true;
        this.onTrackPaused(ev, this);
        break;

      case 'loadeddata' :
        this.onLoadedData(ev, this);
        break;

      case 'timeupdate' :
        this.onTimeUpdate(ev, this);
        break;

      case 'error' :
        var msg;
        try {
          switch ( ev.target.error.code ) {
            case ev.target.error.MEDIA_ERR_ABORTED:
              msg = _('Playback aborted');
              break;
            case ev.target.error.MEDIA_ERR_NETWORK:
              msg = _('Network or communication error');
              break;
            case ev.target.error.MEDIA_ERR_DECODE:
              msg = _('Decoding failed. Corruption or unsupported media');
              break;
            case ev.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              msg = _('Media source not supported');
              break;
            default:
              msg = OSjs._('Unknown error');
              break;
          }
        } catch ( e ) {
          msg = OSjs._('Fatal error: {0}', e);
        }

        this.onError(ev, this, msg);
        break;

      default:
        break;
    }
  };

  AudioPlayer.prototype.seek = function(to) {
    if ( to < 0 ) return;
    try {
      this.$audio.currentTime = to;
    } catch ( e ) {
      console.warn("Failed to seek", e, to);
    }
  };

  AudioPlayer.prototype.play = function() {
    this.$audio.play();
  };

  AudioPlayer.prototype.pause = function() {
    this.$audio.pause();
  };

  AudioPlayer.prototype.getTimes = function(error) {
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
    return {total: total, totalStamp: ftotal, current: current, currentStamp: fcurrent, unknown: unknown};
  };

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window
   */
  var ApplicationMusicPlayerWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationMusicPlayerWindow', {width: 322, height: 225}, app]);

    this.title            = metadata.name;
    this.$buttons         = {};
    this.$labels          = {};
    this.seeking          = false;
    this.showPlaylist     = false;

    this.playlist         = new Playlist();
    this.player           = new AudioPlayer();

    // Set window properties here
    this._title = this.title;
    this._icon  = metadata.icon;

    this._properties.allow_drop     = true;
    this._properties.allow_resize   = false;
    this._properties.allow_maximize = false;
  };

  ApplicationMusicPlayerWindow.prototype = Object.create(Window.prototype);

  ApplicationMusicPlayerWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    var _createButton = function(container, img, onclick) {
      var i = document.createElement('img');
      i.alt = '';
      i.src = OSjs.API.getThemeResource('actions/' + img + '.png', 'icon', '32x32');

      var b = self._addGUIElement(new GUI.Button('ControllerButton', {label: '', onClick: onclick}), container);
      b.$input.appendChild(i);

      self.$buttons[img.split('_')[1]] = b;

      return b;
    };

    var _buttonAction = function(i) {
      if ( i ) {
        self.play(i.filename, i.mime);
      }
      self.updateButtons();
    };

    var _openFile = function(append) {
      app._createDialog('File', [{type: 'open', mimes: ['^audio']}, function(btn, fname, fmime) {
        if ( btn !== 'ok' ) return;
        app.play(fname, fmime, append);
      }], self);
    };

    var menuBar = this._addGUIElement(new GUI.MenuBar('MusicPlayerMenuBar'), root);
    menuBar.addItem(OSjs._("File"), [
      {title: OSjs._('Open'), name: 'Open', onClick: function() {
        _openFile(false);
      }},
      {title: OSjs._('Add'), name: 'Add', onClick: function() {
        _openFile(true);
      }},
      {title: OSjs._('Close'), name: 'Close', onClick: function() {
        self._close();
      }}
    ]);
    menuBar.addItem(_("Playlist"), []);

    menuBar.onMenuOpen = function(menu, pos, title) {
      if ( title == _("Playlist") ) {
        self.togglePlaylist();
      }
    };

    var container = document.createElement('div');
    container.className = 'Container';

    // Info
    var info = document.createElement('div');
    info.className = 'Info';

    var lblArtist = document.createElement('div');
    var spanArtist = document.createElement('span');
    var infoArtist = document.createElement('span');
    spanArtist.className = 'Label';
    spanArtist.innerHTML = _('Artist');
    infoArtist.innerHTML = '-';
    lblArtist.appendChild(spanArtist);
    lblArtist.appendChild(infoArtist);
    info.appendChild(lblArtist);
    this.$labels.Artist = infoArtist;

    var lblAlbum = document.createElement('div');
    var spanAlbum = document.createElement('span');
    var infoAlbum = document.createElement('span');
    spanAlbum.className = 'Label';
    spanAlbum.innerHTML = _('Album');
    infoAlbum.innerHTML = '-';
    lblAlbum.appendChild(spanAlbum);
    lblAlbum.appendChild(infoAlbum);
    info.appendChild(lblAlbum);
    this.$labels.Album = infoAlbum;

    var lblTrack = document.createElement('div');
    var spanTrack = document.createElement('span');
    var infoTrack = document.createElement('span');
    spanTrack.className = 'Label';
    spanTrack.innerHTML = _('Track');
    infoTrack.innerHTML = '-';
    lblTrack.appendChild(spanTrack);
    lblTrack.appendChild(infoTrack);
    info.appendChild(lblTrack);
    this.$labels.Track = infoTrack;

    var lblTime = document.createElement('div');
    var spanTime = document.createElement('span');
    var infoTime = document.createElement('span');
    spanTime.className = 'Label';
    spanTime.innerHTML = _('Time');
    infoTime.innerHTML = '00:00 / 00:00';
    lblTime.appendChild(spanTime);
    lblTime.appendChild(infoTime);
    info.appendChild(lblTime);
    this.$labels.Time = infoTime;

    // Buttons
    var buttons = document.createElement('div');
    buttons.className = 'Buttons';

    _createButton(buttons, 'player_start', function(ev) {
      _buttonAction(self.playlist.first());
    });
    _createButton(buttons, 'player_rew', function(ev) {
      _buttonAction(self.playlist.prev());
    });
    _createButton(buttons, 'player_play', function(ev) {
      if ( self.playlist.length ) {
        if ( self.playlist.index == -1 ) {
          _buttonAction(self.playlist.first());
          return;
        }
        self.player.play();
      }
    });
    _createButton(buttons, 'player_pause', function(ev) {
      if ( self.playlist.length ) {
        self.player.pause();
      }
    });
    _createButton(buttons, 'player_fwd', function(ev) {
      _buttonAction(self.playlist.next());
    });
    _createButton(buttons, 'player_end', function(ev) {
      _buttonAction(self.playlist.last());
    });

    // Containers
    container.appendChild(info);
    var slider = this._addGUIElement(new GUI.Slider('MusicPlayerSlider', {min:0, max:100, val:0}, function(val) {
      self.player.seek(val);
    }), container);
    container.appendChild(buttons);

    this.player.onLoadedData = function(ev, player) {
      self.updateInfo(ev, null, slider);
    };
    this.player.onTimeUpdate = function(ev, player) {
      self.updateTime(ev, slider);
    };
    this.player.onError = function(ev, player, msg) {
      self.updateInfo(ev, null, slider);
      self._error(OSjs._('{0} Application Error', self.title), _('Failed to play file'), msg);
    };
    this.player.onTrackEnded = function(ev, player) {
      if ( self.playlist.isLast() ) return;
      _buttonAction(self.playlist.next());
      self.updateInfo(ev, null, slider);
      self.updateButtons();
    };
    this.player.onTrackStarted = function(ev, player) {
      app.info(player.currentFilename);
      self.updateButtons();
    };
    this.player.onTrackPaused = function(ev, player) {
      self.updateButtons();
    };

    root.appendChild(container);
    root.appendChild(this.player.$audio);

    var pl = this._addGUIElement(new GUI.ListView('MusicPlayerPlaylist'), root);
    pl.setColumns([
      {key: 'name',     title: OSjs._('Name')},
      {key: 'filename', title: OSjs._('Filename'),  visible: false},
      {key: 'mime',     title: OSjs._('MIME'),      visible: false},
      {key: 'index',    title: OSjs._('Index'),     visible: false}
     ]);

    pl.onActivate = function(ev, el, item) {
      if ( item && item.filename ) {
        self.playlist.set(item.index);
        self.play(item.filename, item.mime);
      }
    };

    this.updateButtons();

    return root;
  };

  ApplicationMusicPlayerWindow.prototype.destroy = function() {
    // Destroy custom objects etc. here
    if ( this.player ) {
      this.player.destroy();
      this.player = null;
    }

    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationMusicPlayerWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) return;

    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._appRef.play(data.path, data.mime, true);
      }
    }
  };

  ApplicationMusicPlayerWindow.prototype.open = function(filename, mime, append) {

    if ( !append ) {
      this.playlist.clear();
    }
    var row = {
      index:      this.playlist.length,
      name:       filename,
      filename:   filename,
      mime:       mime
    };
    var idx = this.playlist.add(row);

    var pl = this._getGUIElement('MusicPlayerPlaylist');
    if ( pl ) {
      pl.setRows(this.playlist.list);
      pl.render();
    }

    if ( !append ) {
      this.play(filename, mime);
      if ( idx >= 0 ) {
        this.playlist.set(idx);
      }
    }

    this.updateButtons();
  };

  ApplicationMusicPlayerWindow.prototype.play = function(filename, mime) {
    try {
      this.$labels.Artist.innerHTML = filename;
      this.$labels.Album.innerHTML = mime;
    } catch ( e ) {
      console.warn("Failed to set labels", e);
    }

    this.player.open(filename);

    this._setTitle(this.title + ' - ' + OSjs.Utils.filename(filename));

    this.updateButtons();

    return true;
  };

  ApplicationMusicPlayerWindow.prototype.updateButtons = function() {
    try {
      this.$buttons.play.setDisabled(true);
      this.$buttons.pause.setDisabled(true);

      this.$buttons.start.setDisabled(true);
      this.$buttons.end.setDisabled(true);

      this.$buttons.rew.setDisabled(true);
      this.$buttons.fwd.setDisabled(true);

      if ( !this.playlist.isEmpty() ) {
        if ( this.playlist.length > 1 ) {
          if ( !this.playlist.isFirst() ) {
            this.$buttons.rew.setDisabled(false);
            this.$buttons.start.setDisabled(false);
          }
          if ( !this.playlist.isLast() ) {
            this.$buttons.fwd.setDisabled(false);
            this.$buttons.end.setDisabled(false);
          }
        }

        if ( this.player.paused ) {
          this.$buttons.play.setDisabled(false);
        } else {
          this.$buttons.pause.setDisabled(false);
        }
      }
    } catch ( e ) {
      console.warn("Failed toggle buttons", e);
    }
  };

  ApplicationMusicPlayerWindow.prototype.updateInfo = function(ev, info, slider) {
    if ( this.seeking ) return;
    if ( !this.player ) return;
    info = info || {};
    var msg = '-';
    if ( !info.Artist && !info.Album && !info.Track ) {
      msg = "<i>" + _("Media information query failed") + "</i>";
    }
    this.$labels.Artist.innerHTML = info.Artist || msg;
    this.$labels.Album.innerHTML  = info.Album  || OSjs.Utils.dirname(this.player.currentFilename);
    this.$labels.Track.innerHTML  = info.Track  || OSjs.Utils.filename(this.player.currentFilename);
    this.updateTime(ev, slider);

    if ( slider ) {
      slider.min = 0;
      slider.max = 0;
      slider.setValue(0);
    }
  };

  ApplicationMusicPlayerWindow.prototype.updateTime = function(ev, slider, error) {
    if ( this.seeking ) return;
    if ( !this.player ) return;
    ev = ev || window.event;


    var times = this.player.getTimes(error);
    if ( times.unknown ) {
      this.$labels.Time.innerHTML = times.currentStamp  + " / -" + times.totalStamp + ' <i>(' + _('seek unavailable in format') + ')</i>';
    } else {
      this.$labels.Time.innerHTML = times.currentStamp  + " / " + times.totalStamp;
    }

    if ( slider ) {
      slider.max = Math.round(times.total);
      slider.setValue(Math.round(times.current));
    }
  };

  ApplicationMusicPlayerWindow.prototype.seek = function(val) {
    this.seeking = true;
    this.player.seek(val);
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
    if ( !OSjs.Compability.audio ) {
      throw "Your platform does not support Audio :(";
    }
    Application.apply(this, ['ApplicationMusicPlayer', args, metadata]);
  };

  ApplicationMusicPlayer.prototype = Object.create(Application.prototype);

  ApplicationMusicPlayer.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, []);
  };

  ApplicationMusicPlayer.prototype.init = function(core, settings, metadata) {
    Application.prototype.init.apply(this, arguments);
    var self = this;

    this._addWindow(new ApplicationMusicPlayerWindow(this, metadata));

    var path = this._getArgument('file');
    var mime = this._getArgument('mime');
    if ( path ) {
      this.play(path, mime, false);
    }
  };

  ApplicationMusicPlayer.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationMusicPlayerWindow' ) {
      this.destroy();
    } else if ( msg == 'attention' && args ) {
      this.play(args.file, args.mime, true);
    }
  };

  ApplicationMusicPlayer.prototype.play = function(filename, mime, append) {
    mime = mime || '';
    if ( !mime.match(/^audio/) ) {
      var msg = _('The audio type is not supported: {0}', mime);
      var win = this._getWindow('ApplicationMusicPlayerWindow');
      win._error(OSjs._("{0} Application Error", win.title), _("Failed to play file"), msg);
      return;
    }

    var win = this._getWindow('ApplicationMusicPlayerWindow');
    if ( win ) {
      if ( win.open(filename, mime, append) ) {
        (function() {})();
      }
    }

    if ( !append ) {
      this._setArgument('file', filename);
      this._setArgument('mime', mime);
    }
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

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationMusicPlayer = ApplicationMusicPlayer;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs);
