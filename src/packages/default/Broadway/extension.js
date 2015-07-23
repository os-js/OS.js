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
(function(Window, Utils, API, GUI) {
  'use strict';

  var _isConnected = false;
  var _connWindow = null;

  function createConnectionWindow() {
    if ( _connWindow ) { return; }

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      _connWindow = new BroadwayConnectionWindow();
      wm.addWindow(_connWindow, true);
    }
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
        onContextMenu: function(ev) {
          displayMenu(ev);
          return false;
        },
        onClick: function(ev) {
          displayMenu(ev);
          return false;
        },
        onInited: function(el) {
          if ( el.firstChild ) {
            var img = document.createElement('img');
            img.src = API.getIcon('status/network-transmit-receive.png');
            el.firstChild.appendChild(img);
          }
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
  var BroadwayConnectionWindow = function() {
    Window.apply(this, ['BroadwayConnectionWindow', {width: 400, height: 250}]);

    // Set window properties and other stuff here
    this._title = 'Broadway Client';
    //this._icon  = metadata.icon;

    this._properties.allow_maximize = false;
    this._properties.allow_resize   = false;
    this._properties.gravity        = 'center';
  };

  BroadwayConnectionWindow.prototype = Object.create(Window.prototype);

  BroadwayConnectionWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;
    var supported = OSjs.Core.Broadway ? true : false;

    var sproc, proc, stat, ws, start;

    // Create window contents (GUI) here
    var lbl = 'Broadway support is ' + (supported ? 'loaded' : 'not loaded');
    var stat = this._addGUIElement(new GUI.Label('LabelStatus', {label: lbl}), root);
    Utils.$addClass(stat.$element, supported ? 'supported' : 'unsupported');

    var host = this._addGUIElement(new GUI.Text('TextHost', {value: 'ws://10.0.0.113:8085/socket-bin'}), root);
    var spawner = this._addGUIElement(new GUI.Text('TextSpawn', {value: 'ws://10.0.0.113:9000'}), root);
    var init = this._addGUIElement(new GUI.Button('ButtonConnect', {label: 'Connect', onClick: function() {
      if ( self._destroyed ) { return; }

      if ( ws ) {
        ws.close();
        ws = null;
      }

      ws = new WebSocket(spawner.getValue(), 'broadway-spawner');
      ws.onerror = function() {
        alert('Failed to connect to spawner');
      };
      ws.onopen = function() {
        if ( self._destroyed ) { return; }
        sproc.setDisabled(false);
      };
      ws.onclose = function() {
        if ( self._destroyed ) { return; }
        sproc.setDisabled(true);
      };

      init.setDisabled(true);
      if ( stat ) {
        stat.setLabel('Connecting...');
      }

      OSjs.Core.Broadway.init(host.getValue(), function(error) {
        if ( self._destroyed ) { return; }

        if ( error ) {
          console.warn('BroadwayClient', error);
          stat.setLabel(error);
          init.setDisabled(false);
        } else {
          proc.setDisabled(false);
          init.setDisabled(true);
          stat.setLabel('Connected...');
        }
      }, function() {
        if ( self._destroyed ) { return; }

        stat.setLabel('Disconnected...');
        init.setDisabled(false);
        proc.setDisabled(true);

        if ( ws ) {
          ws.close();
          ws = null;
        }
      });
    }}), root);
    init.setDisabled(!supported);

    start = this._addGUIElement(new GUI.Label('LabelStartProcess', {label: 'Start new process:'}), root);
    proc = this._addGUIElement(new GUI.Text('TextStartProcess', {value: '/usr/bin/gtk3-demo', disabled: true}), root);
    sproc = this._addGUIElement(new GUI.Button('ButtonStartProcess', {label: 'Launch', disabled: true, onClick: function() {
      if ( self._destroyed ) { return; }
      if ( ws ) {
        ws.send(JSON.stringify({
          method: 'launch',
          argument: proc.getValue()
        }));
      }
    }}), root);
    stat = this._addGUIElement(new GUI.Label('LabelError', {label: ''}), root);

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
    Window.apply(this, ['BroadwayWindow' + id, {}]);

    this._dimension.w = w;
    this._dimension.h = h;
    //this._position.x  = Math.max(0, x);
    //this._position.y  = Math.max(0, y);
    this._title       = 'Broadway Window ' + id.toString();

    this._properties.allow_resize     = false;
    this._properties.allow_minimize   = false;
    this._properties.allow_maximize   = false;
    this._properties.allow_session    = false;
    this._properties.key_capture      = true; // IMPORTANT

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

    this._addEventListener(root, 'mouseover', function(ev) {
      return inject('mouseover', ev);
    });
    this._addEventListener(root, 'mouseout', function(ev) {
      return inject('mouseout', ev);
    });
    this._addEventListener(root, 'mousemove', function(ev) {
      return inject('mousemove', ev);
    });
    this._addEventListener(root, 'mousedown', function(ev) {
      return inject('mousedown', ev);
    });
    this._addEventListener(root, 'mouseup', function(ev) {
      return inject('mouseup', ev);
    });
    this._addEventListener(root, 'DOMMouseScroll', function(ev) {
      return inject('mousewheel', ev);
    });
    this._addEventListener(root, 'mousewheel', function(ev) {
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

  OSjs.Session.addHook('onSessionLoaded', function() {
    createNotification();
  });
  OSjs.Session.addHook('onLogout', function() {
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
