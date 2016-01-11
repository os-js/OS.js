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
(function(Window, Utils, API, GUI) {
  'use strict';

  var _isConnected = false;
  var _connWindow = null;
  var _scheme = null;

  function createConnectionWindow() {
    if ( _connWindow ) { return; }

    function addWindow() {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        _connWindow = new BroadwayConnectionWindow(_scheme);
        wm.addWindow(_connWindow, true);
      }
    }

    if ( _scheme ) {
      addWindow();
      return;
    }

    var url = API.getApplicationResource('ExtensionBroadway', 'scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      if ( result ) {
        _scheme = scheme;
        addWindow();
      }
    });
  }

  function destroyConnectionWindow() {
    if ( _connWindow ) {
      _connWindow._close();
      _connWindow = null;
    }
  }

  function createNotification() {
    var wm = OSjs.Core.getWindowManager();

    function displayMenu(ev) {
      var menuItems = [];
      if ( _isConnected ) {
        menuItems.push({
          title: 'Disconnect from Broadway server',
          onClick: function() {
            window.GTK.disconnect();
          }
        });
      } else {
        menuItems.push({
          title: 'Connect to Broadway server',
          onClick: function() {
            createConnectionWindow();
          }
        });
      }

      OSjs.API.createMenu(menuItems, {x: ev.clientX, y: ev.clientY});
    }

    if ( wm ) {
      removeNotification();

      wm.createNotificationIcon('BroadwayService', {
        image: API.getIcon('status/network-transmit-receive.png'),
        onContextMenu: function(ev) {
          displayMenu(ev);
          return false;
        },
        onClick: function(ev) {
          displayMenu(ev);
          return false;
        }
      });
    }
  }

  function removeNotification() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.removeNotificationIcon('BroadwayService');
    }
  }

  function actionOnWindow(id, cb) {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      var win = wm.getWindow('BroadwayWindow' + id);
      if ( win ) {
        return cb(win);
      }
    }
    return null;
  }

  /////////////////////////////////////////////////////////////////////////////
  // CLIENT WINDOW
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window Constructor
   */
  var BroadwayConnectionWindow = function(scheme) {
    Window.apply(this, ['BroadwayConnectionWindow', {
      title: 'Broadway Client',
      allow_maximize: false,
      allow_reszie: false,
      gravity: 'center',
      width: 400,
      height: 250
    }, null, scheme]);
  };

  BroadwayConnectionWindow.prototype = Object.create(Window.prototype);

  BroadwayConnectionWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    var supported = OSjs.Core.Broadway ? true : false;
    var lbl = 'Broadway support is ' + (supported ? 'loaded' : 'not loaded');
    var ws;

    scheme.render(this, 'ConnectionWindow', root);

    var connectInput = scheme.find(this, 'GtkConnection').set('disabled', !supported);
    var procConnection = scheme.find(this, 'ProcConnection').set('disabled', !supported);
    var connectButton = scheme.find(this, 'ConnectButton').set('disabled', !supported);

    var procInput = scheme.find(this, 'StartProc').set('disabled', true);
    var procButton = scheme.find(this, 'StartButton').set('disabled', true);

    var statusText = scheme.find(this, 'StatusText').set('value', lbl);

    connectButton.on('click', function() {
      if ( self._destroyed ) { return; }

      if ( ws ) {
        ws.close();
        ws = null;
      }

      ws = new WebSocket(procConnection.get('value'), 'broadway-spawner');
      ws.onerror = function() {
        alert('Failed to connect to spawner');
      };
      ws.onopen = function() {
        if ( self._destroyed ) { return; }
        procButton.set('disabled', false);
      };
      ws.onclose = function() {
        if ( self._destroyed ) { return; }
        procButton.set('disabled', true);
      };

      connectButton.set('disabled', true);
      statusText.set('value', 'Connecting...');

      OSjs.Core.Broadway.init(connectInput.get('value'), function(error) {
        if ( self._destroyed ) { return; }

        if ( error ) {
          console.warn('BroadwayClient', error);
          statusText.set('value', error);
          connectButton.set('disabled', false);
        } else {
          procInput.set('disabled', false);
          connectButton.set('disabled', true);
          statusText.set('value', 'Connected!');
        }
      }, function() {
        if ( self._destroyed ) { return; }

        statusText.set('value', 'Disconnecting...');
        connectButton.set('disabled', false);
        procInput.set('disabled', true);

        if ( ws ) {
          ws.close();
          ws = null;
        }
      });
    });

    procButton.on('click', function() {
      if ( self._destroyed ) { return; }
      if ( ws ) {
        ws.send(JSON.stringify({
          method: 'launch',
          argument: procInput.get('value')
        }));
      }
    });

    return root;
  };

  BroadwayConnectionWindow.prototype.destroy = function() {
    _connWindow = null;
    return Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // BROADWAY WINDOW
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Dialog Window
   */
  var BroadwayWindow = function(id, x, y, w, h) {
    Window.apply(this, ['BroadwayWindow' + id, {
      w: w,
      h: h,
      title: 'Broadway Window ' + id.toString(),
      min_width: 100,
      min_height: 100,
      allow_resize: false,
      allow_minimize: false,
      allow_maximize: false,
      allow_session: false,
      key_capture: true // IMPORTANT
    }]);

    this._broadwayId = id;
    this._canvas = document.createElement('canvas');
  };

  BroadwayWindow.prototype = Object.create(Window.prototype);

  BroadwayWindow.prototype.init = function() {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    this._canvas.width = this._dimension.w;
    this._canvas.height = this._dimension.h;


    function getMousePos(ev) {
      return {
        x:ev.pageX - self._position.x,
        y:ev.pageY - self._position.y - 26 // FIXME
      };
    }

    function inject(type, ev) {
      var pos = getMousePos(ev);
      return window.GTK.inject(self._broadwayId, type, ev, {
        wx: self._position.x,
        wy: self._position.y,
        mx: parseInt(pos.x, 0),
        my: parseInt(pos.y, 0)
      });
    }

    Utils.$bind(root, 'mouseover', function(ev) {
      return inject('mouseover', ev);
    });
    Utils.$bind(root, 'mouseout', function(ev) {
      return inject('mouseout', ev);
    });
    Utils.$bind(root, 'mousemove', function(ev) {
      return inject('mousemove', ev);
    });
    Utils.$bind(root, 'mousedown', function(ev) {
      return inject('mousedown', ev);
    });
    Utils.$bind(root, 'mouseup', function(ev) {
      return inject('mouseup', ev);
    });
    Utils.$bind(root, 'DOMMouseScroll', function(ev) {
      return inject('mousewheel', ev);
    });
    Utils.$bind(root, 'mousewheel', function(ev) {
      return inject('mousewheel', ev);
    });

    root.appendChild(this._canvas);
    return root;
  };

  BroadwayWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
    this._canvas = null;
  };

  BroadwayWindow.prototype._inited = function() {
    Window.prototype._inited.apply(this, arguments);

    this._onChange('move', true);
  };

  BroadwayWindow.prototype._close = function() {
    if ( !Window.prototype._close.apply(this, arguments) ) {
      return false;
    }

    window.GTK.close(this._broadwayId);

    return true;
  };

  BroadwayWindow.prototype._resize = function(w, h) {
    if ( !Window.prototype._resize.apply(this, [w, h, true]) ) {
      return false;
    }

    function resizeCanvas(canvas, w, h) {
      var tmpCanvas = canvas.ownerDocument.createElement("canvas");
      tmpCanvas.width = canvas.width;
      tmpCanvas.height = canvas.height;
      var tmpContext = tmpCanvas.getContext("2d");
      tmpContext.globalCompositeOperation = "copy";
      tmpContext.drawImage(canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);

      canvas.width = w;
      canvas.height = h;

      var context = canvas.getContext("2d");

      context.globalCompositeOperation = "copy";
      context.drawImage(tmpCanvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
    }

    if ( this._canvas ) {
      resizeCanvas(this._canvas, w, h);
    }

    return true;
  };

  BroadwayWindow.prototype._onKeyEvent = function(ev, type) {
    window.GTK.inject(this._broadwayId, type, ev);
  };

  BroadwayWindow.prototype._onChange = function(ev, byUser) {
    if ( !byUser ) { return; }

    if ( ev === 'move' ) {
      window.GTK.move(this._broadwayId, this._position.x, this._position.y);
    } else if ( ev === 'resize' ) {
      window.GTK.resize(this._broadwayId, this._dimension.w, this._dimension.h);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.API.addHook('onSessionLoaded', function() {
    createNotification();
  });
  OSjs.API.addHook('onLogout', function() {
    removeNotification();
    destroyConnectionWindow();
  });

  OSjs.Core.Broadway = {};
  OSjs.Core.Broadway.init = function(host, cb, cbclose) {
    window.GTK.connect(host, {
      onSocketOpen: function() {
        _isConnected = true;
        createNotification();
      },

      onSocketClose: function() {
        _isConnected = false;
        createNotification();
      },

      onSetTransient: function(id, parentId, surface) {
        return actionOnWindow(parentId, function(win) {
          if ( win._canvas && surface.canvas ) {
            if ( win._canvas.parentNode ) {
              win._canvas.parentNode.appendChild(surface.canvas);
            }
          }
        });
      },

      onFlushSurface: function(id, q) {
        return actionOnWindow(id, function(win) {
          return win._canvas;
        });
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
          /*
          if ( has_pos ) {
            win._move(x, y);
          }
          */
          if ( has_size ) {
            win._resize(surface.width, surface.height);
          }
        });
      },

      onCreateSurface: function(id, surface) {
        var wm = OSjs.Core.getWindowManager();
        var win = new BroadwayWindow(id, surface.x, surface.y, surface.width, surface.height);
        wm.addWindow(win);
        return win._canvas;
      }

    }, cb, cbclose);
  };

})(OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.GUI);
