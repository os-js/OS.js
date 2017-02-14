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

(function(Application, Window, Utils, VFS, GUI, API) {
  'use strict';

  /**
   * @namespace Broadway
   * @memberof OSjs
   */

  var _connected = false;
  var _ws = null;

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /*
   * Creates a new connection URL
   */
  function createURL(cfg) {
    var protocol = cfg.protocol || window.location.protocol.replace(/^http/, 'ws');
    var host = cfg.host || window.location.hostname;
    if ( host === 'localhost' && host !== window.location.hostname ) {
      host = window.location.hostname;
    }
    return protocol + '//' + host + ':' + cfg.port + '/' + cfg.uri;
  }

  /*
   * Get window
   */
  function actionOnWindow(id, cb) {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      var win = wm.getWindow('BroadwayWindow' + String(id));
      if ( win ) {
        return cb(win);
      }
    }
    return null;
  }

  /*
   * Removes the notification icon
   */
  function removeNotification() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.removeNotificationIcon('BroadwayService');
    }
  }

  /*
   * Updates notification icon based on state(s)
   */
  function updateNotification() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      var n = wm.getNotificationIcon('BroadwayService');
      if ( n ) {
        n.$image.style.opacity = _connected ? 1 : .4;
      }
    }
  }

  /*
   * Creates the notification icon
   */
  function createNotification() {
    var wm = OSjs.Core.getWindowManager();
    var conf = API.getConfig('Broadway');

    function displayMenu(ev) {
      var menuItems = [];
      if ( _connected ) {
        menuItems.push({
          title: 'Disconnect from Broadway server',
          onClick: function() {
            OSjs.Broadway.Connection.disconnect();
          }
        });
        menuItems.push({
          title: 'Create new process',
          onClick: function() {
            API.createDialog('Input', {message: 'Launch process', value: '/usr/bin/gtk3-demo'}, function(ev, btn, value) {
              if ( btn === 'ok' && value ) {
                OSjs.Broadway.Connection.spawn(value);
              }
            });
          }
        });
      } else {
        menuItems.push({
          title: 'Connect to Broadway server',
          onClick: function() {
            OSjs.Broadway.Connection.connect();
          }
        });
      }

      API.createMenu(menuItems, ev);
    }

    removeNotification();

    if ( wm && conf.enabled ) {
      removeNotification();

      wm.createNotificationIcon('BroadwayService', {
        image: API.getIcon('gtk.png'),
        onContextMenu: function(ev) {
          displayMenu(ev);
          return false;
        },
        onClick: function(ev) {
          displayMenu(ev);
          return false;
        }
      });

      updateNotification();
    }
  }

  /*
   * Creates a new Spawner connection
   */
  function createSpawner(host, cb) {
    _ws = new WebSocket(host, 'broadway-spawner');

    _ws.onerror = function() {
      cb('Failed to connect to spawner');
    };

    _ws.onopen = function() {
      cb(null, _ws);
    };

    _ws.onclose = function() {
      OSjs.Broadway.Connection.disconnect();
    };
  }

  var onResize = (function() {
    var wm;
    return function() {
      if ( !wm ) {
        wm = OSjs.Core.getWindowManager();
      }

      if ( wm ) {
        var space = wm.getWindowSpace();
        var theme = wm ? wm.getStyleTheme(true) : null;
        var topMargin = theme ? (theme.style.window.margin) : 26;

        OSjs.Broadway.GTK.inject(null, 'resize', null, {
          width: space.width,
          height: space.height - topMargin
        });
      }

    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Initializes Broadway
   *
   * @function init
   * @memberof OSjs.Broadway.Connection
   */
  function init() {
    createNotification();
  }

  /**
   * Disconnects the Broadway connections
   *
   * @function disconnect
   * @memberof OSjs.Broadway.Connection
   */
  function disconnect() {
    _connected = false;

    if ( _ws ) {
      _ws.close();
    }
    _ws = null;

    try {
      OSjs.Broadway.GTK.disconnect();
    } catch ( e ) {
      console.warn(e);
    }

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.getWindows().forEach(function(w) {
        if ( w && w instanceof OSjs.Broadway.Window ) {
          w.destroy();
        }
      });
    }

    setTimeout(function() {
      updateNotification();
    }, 100);
  }

  /**
   * Creates new Broadway connections
   *
   * @function connect
   * @memberof OSjs.Broadway.Connection
   */
  function connect() {
    if ( _connected || _ws ) {
      return;
    }

    var conf = API.getConfig('Broadway');

    createSpawner(createURL(conf.defaults.spawner), function(err) {
      _connected = true;

      if ( err ) {
        API.error('Broadway', 'Failed to connect', err);
      } else {
        try {
          var host = createURL(conf.defaults.connection);
          OSjs.Broadway.GTK.connect(host);
        } catch ( e ) {
          console.warn(e);
        }
      }
    });
  }

  /**
   * Spawns a new process on the Broadway server
   *
   * @param {String}  cmd     Command
   *
   * @function spawn
   * @memberof OSjs.Broadway.Connection
   */
  function spawn(cmd) {
    if ( !_connected || !_ws ) {
      return;
    }

    _ws.send(JSON.stringify({
      method: 'launch',
      argument: cmd
    }));
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Broadway.Events = {
    onSocketOpen: function() {
      window.addEventListener('resize', onResize);

      updateNotification();
      onResize();
    },

    onSocketClose: function() {
      window.removeEventListener('resize', onResize);

      disconnect();
    },

    onDeleteSurface: function(id) {
      return actionOnWindow(id, function(win) {
        return win._close();
      });
    },

    onShowSurface: function(id) {
      return actionOnWindow(id, function(win) {
        return win._restore();
      });
    },

    onHideSurface: function(id) {
      return actionOnWindow(id, function(win) {
        return win._minimize();
      });
    },

    onMoveSurface: function(id, has_pos, has_size, surface) {
      return actionOnWindow(id, function(win) {
        var wm = OSjs.Core.getWindowManager();
        var space = wm.getWindowSpace();

        if ( has_pos ) {
          win._move(space.left + surface.x, space.top + surface.y);
        }

        if ( has_size ) {
          win._resize(surface.width, surface.height);
        }
      });
    },

    onCreateSurface: function(id, surface) {
      var wm = OSjs.Core.getWindowManager();
      if ( !surface.isTemp ) {
        var win = new OSjs.Broadway.Window(id, surface.x, surface.y, surface.width, surface.height, surface.canvas);
        wm.addWindow(win, true);
      }
    }
  };

  /**
   * @namespace Connection
   * @memberof OSjs.Broadway
   */
  OSjs.Broadway.Connection = {
    init: init,
    connect: connect,
    disconnect: disconnect,
    spawn: spawn
  };

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.GUI, OSjs.API);
