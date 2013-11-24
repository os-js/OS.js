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
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  var Tools = {
    picker : {
      click : function(ev, clickX, clickY, canvas) {
        var leftClick = ev.which <= 1;
        var color = canvas.getColorAt(clickX, clickY);
        this.setColor(leftClick ? 'foreground' : 'background', color.hex);
      }
    },

    bucket : {
      click : function(ev, clickX, clickY, canvas) {
        var leftClick = ev.which <= 1;
        var color = leftClick ? this.currentForegroundColor : this.currentBackgroundColor;
        canvas.fillColor(color);
      }
    },

    pencil : {
      down : function(ev, pos, canvas) {
        canvas.$context.beginPath();
        canvas.$context.moveTo(pos.x, pos.y);
        canvas.$context.fillStyle = this.currentForegroundColor;
        canvas.$context.strokeStyle = this.currentBackgroundColor;
        canvas.$context.lineWidth = this.strokeWidth;
        canvas.$context.lineJoin = this.strokeStyle;
      },
      up : function(ev, startPos, endPos, canvas) {
      },
      move : function(ev, startPos, currentPos, canvas) {
        canvas.$context.lineTo(currentPos.x, currentPos.y);
        canvas.$context.stroke();
      }
    },

    path : {
      down : function(ev, pos, canvas) {
        canvas.$context.fillStyle = this.currentForegroundColor;
        canvas.$context.strokeStyle = this.currentBackgroundColor;
        canvas.$context.lineWidth = this.strokeWidth;
        canvas.$context.lineJoin = this.strokeStyle;
      },

      move : function(ev, startPos, currentPos, canvas) {
        canvas.$context.beginPath();
        canvas.$context.moveTo(startPos.x, startPos.y);
        canvas.$context.lineTo(currentPos.x, currentPos.y);
        if ( this.strokeWidth ) {
          canvas.$context.stroke();
        }
        canvas.$context.closePath();
      },

      up : function(ev, startPos, endPos, canvas) {
      }
    },

    rectangle : {
      down : function(ev, pos, canvas) {
        canvas.$context.fillStyle = this.currentForegroundColor;
        canvas.$context.strokeStyle = this.currentBackgroundColor;
        canvas.$context.lineWidth = this.strokeWidth;
        canvas.$context.lineJoin = this.strokeStyle;
      },

      move : function(ev, startPos, currentPos, canvas) {
        var x = Math.min(currentPos.x, startPos.x);
        var y = Math.min(currentPos.y, startPos.y);
        var w = Math.abs(currentPos.x - startPos.x);
        var h = Math.abs(currentPos.y - startPos.y);

        if ( w && h ) {
          if ( this.strokeWidth ) {
            canvas.$context.strokeRect(x, y, w, h);
          }
          canvas.$context.fillRect(x, y, w, h);
        }
      }
    },

    square : {
      down : function(ev, pos, canvas) {
        canvas.$context.fillStyle = this.currentForegroundColor;
        canvas.$context.strokeStyle = this.currentBackgroundColor;
        canvas.$context.lineWidth = this.strokeWidth;
        canvas.$context.lineJoin = this.strokeStyle;
      },

      move : function(ev, startPos, currentPos, canvas) {
        var x = startPos.x; //Math.min(currentPos.x, startPos.x);
        var y = startPos.y; //Math.min(currentPos.y, startPos.y);
        var w = Math.abs(currentPos.x - startPos.x) * (currentPos.x < startPos.x ? -1 : 1);
        var h = Math.abs(w) * (currentPos.y < startPos.y ? -1 : 1);

        if ( w && h ) {
          if ( this.strokeWidth ) {
            canvas.$context.strokeRect(x, y, w, h);
          }
          canvas.$context.fillRect(x, y, w, h);
        }
      }
    },

    circle : {
      down : function(ev, pos, canvas) {
        canvas.$context.fillStyle = this.currentForegroundColor;
        canvas.$context.strokeStyle = this.currentBackgroundColor;
        canvas.$context.lineWidth = this.strokeWidth;
        canvas.$context.lineJoin = this.strokeStyle;
      },

      move : function(ev, startPos, currentPos, canvas) {
        var x = Math.abs(startPos.x - currentPos.x);
        var y = Math.abs(startPos.y - currentPos.y);
        var r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        if ( r > 0 ) {
          canvas.$context.beginPath();
          canvas.$context.arc(startPos.x, startPos.y, r, 0, Math.PI*2, true);
          canvas.$context.closePath();
          if ( this.strokeWidth ) {
            canvas.$context.stroke();
          }
          canvas.$context.fill();
        }
      }
    },

    ellipse : {
      down : function(ev, pos, canvas) {
        canvas.$context.fillStyle = this.currentForegroundColor;
        canvas.$context.strokeStyle = this.currentBackgroundColor;
        canvas.$context.lineWidth = this.strokeWidth;
        canvas.$context.lineJoin = this.strokeStyle;
      },

      move : function(ev, startPos, currentPos, canvas) {
        var width = Math.abs(startPos.x - currentPos.x);
        var height = Math.abs(startPos.y - currentPos.y);

        if ( width > 0 && height > 0 ) {
          canvas.$context.beginPath();
          canvas.$context.moveTo(startPos.x, startPos.y - height*2); // A1
          canvas.$context.bezierCurveTo(
            startPos.x + width*2, startPos.y - height*2, // C1
            startPos.x + width*2, startPos.y + height*2, // C2
            startPos.x, startPos.y + height*2); // A2
          canvas.$context.bezierCurveTo(
            startPos.x - width*2, startPos.y + height*2, // C3
            startPos.x - width*2, startPos.y - height*2, // C4
            startPos.x, startPos.y - height*2); // A1

          canvas.$context.closePath();
          if ( this.strokeWidth ) {
            canvas.$context.stroke();
          }
          canvas.$context.fill();
        }
      }
    }
  };

  /**
   * Main Window
   */
  var ApplicationDrawWindow = function(app) {
    Window.apply(this, ['ApplicationDrawWindow', {width: 800, height: 450}, app]);

    this.title                  = 'Draw';
    this.$canvasContainer       = null;
    this.currentTool            = 'pointer';
    this.currentForegroundColor = '#000000';
    this.currentBackgroundColor = '#ffffff';
    this.strokeWidth            = 1;
    this.strokeStyle            = 'round';

    // Set window properties here
    this._icon = 'categories/gnome-graphics.png';
  };

  ApplicationDrawWindow.prototype = Object.create(Window.prototype);

  ApplicationDrawWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;
    // Create window contents here

    var _createIcon = function(i) {
      return '/apps/Draw/icons/' + i + '-16.png';
    };

    var _onClick = function(ev, el, name, item) {
      if ( name ) {
        if ( name === 'foregroundColor' ) {
          self.setColor('foreground');
        } else if ( name === 'backgroundColor' ) {
          self.setColor('background');
        } else {
          self.setTool(name);
        }
      }
    };

    var _createColorButton = function(name, item, container, button) {
      var color = document.createElement('div');
      color.className = 'Color';
      color.style.backgroundColor = '#ffffff';
      button.title = name === 'foregroundColor' ? 'Foreground (Fill) Color' : 'Background (Stroke) Color';
      button.appendChild(color);
    };

    var toolBar = this._addGUIElement(new OSjs.GUI.ToolBar('ApplicationDrawToolBar', {orientation: 'vertical'}), root);

    toolBar.addItem('pointer',    {toggleable: true, title: 'Pointer',   icon: _createIcon('stock-cursor'),                  onClick: _onClick});
    toolBar.addItem('picker',     {toggleable: true, title: 'Picker',    icon: _createIcon('stock-color-pick-from-screen'),  onClick: _onClick});
    toolBar.addItem('bucket',     {toggleable: true, title: 'Bucket',    icon: _createIcon('stock-tool-bucket-fill'),        onClick: _onClick});
    //toolBar.addItem('eraser',     {toggleable: true, title: 'Eraser',    icon: _createIcon('stock-tool-eraser'),             onClick: _onClick});

    toolBar.addItem('pencil',     {toggleable: true, title: 'Pencil',    icon: _createIcon('stock-tool-pencil'),             onClick: _onClick});
    toolBar.addItem('path',       {toggleable: true, title: 'Path',      icon: _createIcon('stock-tool-path'),               onClick: _onClick});
    toolBar.addItem('rectangle',  {toggleable: true, title: 'Rectangle', icon: _createIcon('stock-shape-rectangle'),         onClick: _onClick});
    toolBar.addItem('square',     {toggleable: true, title: 'Square',    icon: _createIcon('stock-shape-square'),            onClick: _onClick});
    toolBar.addItem('ellipse',    {toggleable: true, title: 'Ellipse',   icon: _createIcon('stock-shape-ellipse'),           onClick: _onClick});
    toolBar.addItem('circle',     {toggleable: true, title: 'Circle',    icon: _createIcon('stock-shape-circle'),            onClick: _onClick});
    //toolBar.addItem('text',       {toggleable: true, title: 'Text',      icon: _createIcon('stock-tool-text'),               onClick: _onClick});

    toolBar.addSeparator();

    toolBar.addItem('foregroundColor',       {title: 'Foreground', onClick: _onClick, onCreate: _createColorButton});
    toolBar.addItem('backgroundColor',       {title: 'Background', onClick: _onClick, onCreate: _createColorButton});

    toolBar.addItem('strokeWidth',          {title: 'Stroke Width', type: 'custom', onClick: function(ev, el, name, item) {
    }, onCreate: function(name, item, container, button) {
      container.className += ' Long';

      var select = document.createElement('select');
      select.onchange = function() {
        var el = this.options[this.selectedIndex];
        if ( el ) {
          self.strokeWidth = el.value << 0;
        }
      };
      var option;
      var label = document.createElement('label');
      label.innerHTML = 'Stroke';

      for ( var i = 0, l = 15; i < l; i++ ) {
        option = document.createElement('option');
        option.value = i;
        option.innerHTML = i;
        if ( self.strokeWidth == i ) {
          option.selected = "selected";
          select.selectedIndex = i;
        }
        select.appendChild(option);
      }
      button.appendChild(label);
      button.appendChild(select);
    }});

    toolBar.addItem('lineJoin',          {title: 'Line Join', type: 'custom', onClick: function(ev, el, name, item) {
    }, onCreate: function(name, item, container, button) {
      container.className += ' Long';

      var select = document.createElement('select');
      select.onchange = function() {
        var el = this.options[this.selectedIndex];
        if ( el ) {
          self.strokeStyle = el.value;
        }
      };
      var option;
      var label = document.createElement('label');
      label.innerHTML = 'Line Join';

      option = document.createElement('option');
      option.value = 'bevel';
      option.innerHTML = 'Bevel';
      select.appendChild(option);

      option = document.createElement('option');
      option.value = 'round';
      option.innerHTML = 'Round';
      option.selected = "selected";
      select.appendChild(option);

      option = document.createElement('option');
      option.value = 'miter';
      option.innerHTML = 'Miter';
      select.appendChild(option);

      button.appendChild(label);
      button.appendChild(select);
      option.selectedIndex = 1;
    }});

    var menuBar = this._addGUIElement(new OSjs.GUI.MenuBar('ApplicationDrawMenuBar'), root);
    menuBar.addItem("File", [
      {title: 'New', name: 'New', onClick: function() {
        app.action('new');
      }},
      {title: 'Open', name: 'Open', onClick: function() {
        app.action('open');
      }},
      {title: 'Save', name: 'Save', onClick: function() {
        app.action('save');
      }},
      {title: 'Save As...', name: 'SaveAs', onClick: function() {
        app.action('saveas');
      }},
      {title: 'Close', name: 'Close', onClick: function() {
        app.action('close');
      }}
    ]);

    menuBar.onMenuOpen = function(menu) {
      var el = menu.getRoot().getElementsByClassName("MenuItem_Save")[0];
      if ( el ) {
        if ( app.currentFilename ) {
          el.className = el.className.replace(/\s?Disabled/, '');
        } else {
          el.className += ' Disabled';
        }
      }
    };

    this.$canvasContainer = document.createElement('div');
    this.$canvasContainer.className = 'CanvasContainer';

    var canvasImage = this._addGUIElement(new OSjs.GUI.Canvas('ApplicationDrawCanvas', {width: 640, height:480}), this.$canvasContainer);
    var canvas = this._addGUIElement(new OSjs.GUI.Canvas('ApplicationDrawCanvasOverlay', {width: 640, height:480}), this.$canvasContainer);

    this.$canvasContainer.style.width = '640px';
    this.$canvasContainer.style.height = '480px';

    var mouseDown = false;
    var startX, startY;
    var start, end;

    var _getPosition = function(ev) {
      var cpos = OSjs.Utils.$position(self.$canvasContainer);
      return {x: (ev.clientX-cpos.left), y: (ev.clientY-cpos.top)};
    };

    var _onMouseMove = function(ev) {
      if ( !mouseDown ) return;
      var diffX = ev.clientX - startX;
      var diffY = ev.clientY - startY;
      var cur = {
        x: start.x + diffX,
        y: start.y + diffY
      };
      self.onMouseMove(ev, diffX, diffY, start, cur, canvas, canvasImage);
    };

    var _onMouseUp = function(ev) {
      end = _getPosition(ev);

      document.removeEventListener('mouseup', _onMouseUp, false);
      document.removeEventListener('mousemove', _onMouseMove, false);
      self.onMouseUp(ev, start, end, canvas, canvasImage);
      mouseDown = false;
    };

    var _onMouseDown = function(ev) {
      ev.preventDefault();
      start = _getPosition(ev);
      startX = ev.clientX;
      startY = ev.clientY;

      document.addEventListener('mouseup', _onMouseUp, false);
      document.addEventListener('mousemove', _onMouseMove, false);
      self.onMouseDown(ev, start, canvas, canvasImage);
      mouseDown = true;
    };

    var _onMouseClick = function(ev) {
      var pos = _getPosition(ev);
      self.onMouseClick(ev, ev.clientX-pos.x, ev.clientY-pos.y, canvas);
    };

    this.$canvasContainer.addEventListener('mousedown', _onMouseDown, false);
    this.$canvasContainer.addEventListener('click', _onMouseClick, false);


    root.appendChild(this.$canvasContainer);

    this.setTitle('');

    toolBar.render();

    this.setColor('foreground', this.currentForegroundColor);
    this.setColor('background', this.currentBackgroundColor);
    this.setTool(this.currentTool);

    return root;
  };

  ApplicationDrawWindow.prototype.destroy = function() {
    // Destroy custom objects etc. here

    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationDrawWindow.prototype.onMouseClick = function(ev, clickX, clickY, canvas, canvasImage) {
    if ( canvas && this.currentTool && Tools[this.currentTool] ) {
      if ( Tools[this.currentTool].click ) {
        Tools[this.currentTool].click.call(this, ev, clickX, clickY, canvas);
      }
    }
  };

  ApplicationDrawWindow.prototype.onMouseDown = function(ev, pos, canvas, canvasImage) {
    if ( canvas && this.currentTool && Tools[this.currentTool] ) {
      if ( Tools[this.currentTool].down ) {
        Tools[this.currentTool].down.call(this, ev, pos, canvas);
      }
    }
  };

  ApplicationDrawWindow.prototype.onMouseUp = function(ev, startPos, endPos, canvas, canvasImage) {
    if ( canvas && this.currentTool && Tools[this.currentTool] ) {
      if ( Tools[this.currentTool].up ) {
        Tools[this.currentTool].up.call(this, ev, startPos, endPos, canvas);
      }
      canvasImage.$context.drawImage(canvas.$canvas, 0, 0);
      canvas.clear();
    }
  };

  ApplicationDrawWindow.prototype.onMouseMove = function(ev, dx, dy, startPos, currentPos, canvas, canvasImage) {
    if ( canvas && this.currentTool && Tools[this.currentTool] ) {
      canvas.clear();
      if ( Tools[this.currentTool].move ) {
        Tools[this.currentTool].move.call(this, ev, startPos, currentPos, canvas);
      }
    }
  };

  ApplicationDrawWindow.prototype.setTitle = function(t) {
    var title = this.title + (t ? (' - ' + t) : ' - New File');
    return this._setTitle(title);
  };

  ApplicationDrawWindow.prototype.setTool = function(tool) {
    console.log("ApplicationDrawWindow::setTool()", tool);
    this.currentTool = tool;
  };

  ApplicationDrawWindow.prototype.setColor = function(what, color) {
    var self = this;

    var _onSelected = function() {
      var toolBar = self._getGUIElement('ApplicationDrawToolBar');
      if ( toolBar ) {
        toolBar.getItem('foregroundColor').getElementsByClassName('Color')[0].style.backgroundColor = self.currentForegroundColor;
        toolBar.getItem('backgroundColor').getElementsByClassName('Color')[0].style.backgroundColor = self.currentBackgroundColor;
      }
    };

    var _select = function(hex) {
      console.log("ApplicationDrawWindow::setColor()", what, hex);
      if ( what === 'foreground' ) {
        self.currentForegroundColor = hex;
      } else {
        self.currentBackgroundColor = hex;
      }
      _onSelected();
    };

    if ( color ) {
      _select(color);
    } else {
      var current = what === 'foreground' ? this.currentForegroundColor : this.currentBackgroundColor;
      this._appRef._createDialog('Color', [current, function(btn, rgb, hex) {
        self._focus();
        if ( btn !== 'ok' ) return;

        _select(hex);
      }], this);
    }
  };

  ApplicationDrawWindow.prototype.setData = function(data) {
    var self = this;
    var canvas = this._getGUIElement('ApplicationDrawCanvas');
    if ( canvas ) {
      this.createNew();
      console.log("ApplicationDrawWindow::setData()");

      canvas.clear();
      canvas.setImageData(data, function() {
        self.$canvasContainer.style.width = canvas.width + 'px';
        self.$canvasContainer.style.height = canvas.height + 'px';

        self._getGUIElement('ApplicationDrawCanvasOverlay').resize(canvas.width, canvas.height);
        self._getGUIElement('ApplicationDrawCanvasOverlay').clear();
      });

    }
  };

  ApplicationDrawWindow.prototype.createNew = function(w, h) {
    w = w || 640;
    h = h || 480;

    this.$canvasContainer.style.width = w + 'px';
    this.$canvasContainer.style.height = h + 'px';

    this._getGUIElement('ApplicationDrawCanvasOverlay').resize(w, h);
    this._getGUIElement('ApplicationDrawCanvasOverlay').clear();

    this._getGUIElement('ApplicationDrawCanvas').resize(w, h);
    this._getGUIElement('ApplicationDrawCanvas').clear();
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var ApplicationDraw = function(args, metadata) {
    this.currentFilename = null;

    Application.apply(this, ['ApplicationDraw', args, metadata]);
  };

  ApplicationDraw.prototype = Object.create(Application.prototype);

  ApplicationDraw.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, []);
  };

  ApplicationDraw.prototype.init = function(core, session) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationDrawWindow(this));

    var open = this._getArgument('file');
    if ( open ) {
      this.action('open', open);
    }
  };

  ApplicationDraw.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationDrawWindow' ) {
      this.destroy();
    }
  };

  ApplicationDraw.prototype.action = function(action, filename, mime) {
    var self = this;
    var win = this._getWindow('ApplicationDrawWindow');

    var _onError = function(error) {
      OSjs.API.error("Draw Application Error", "Failed to perform action '" + action + "'", error);
      if ( win ) {
        win.setTitle('');
      }
    };

    // Save
    var _saveFile = function(fname) {
      var _onSaveFinished = function(name) {
        self.currentFilename = name;
        if ( win ) {
          win.setTitle(name);
          win._focus();
        }
        console.warn("TODO --- onSaveFinished()");
      };

      var canvas = win._getGUIElement('ApplicationDrawCanvas');
      if ( !canvas ) return;
      var data = canvas.getImageData();

      OSjs.API.call('fs', {'method': 'file_put_contents', 'arguments': [fname, data, {dataSource: true}]}, function(res) {
        if ( res && res.result ) {
          _onSaveFinished(fname);
        } else {
          if ( res && res.error ) {
            _onError("Failed to save file: " + fname, res.error);
            return;
          }
          _onError("Failed to save file: " + fname, "Unknown error");
        }
      }, function(error) {
        _onError("Failed to save file (call): " + fname, error);
      });
    };

    // Open
    var _openFile = function(fname, fmime) {
      if ( fmime && !fmime.match(/^image/) ) {
        OSjs.API.error("Draw", "Cannot open file", "Not supported!");
        return;
      }

      var _openFileFinished = function(name, data) {
        self.currentFilename = name;
        if ( win ) {
          win.setTitle(fname);
          win.setData(data);
          win._focus();
        }
      };

      OSjs.API.call('fs', {'method': 'file_get_contents', 'arguments': [fname, {dataSource: true}]}, function(res) {
        if ( res && res.result ) {
          _openFileFinished(fname, res.result);
        } else {
          if ( res && res.error ) {
            _onError("Failed to open file: " + fname, res.error);
            return;
          }
          _onError("Failed to open file: " + fname, "Unknown error");
        }
      }, function(error) {
        _onError("Failed to open file (call): " + fname, error);
      });
    };

    // New
    var _newFile = function() {
      self.currentFilename = null;
      if ( win ) {
        win.setTitle('');
        win.createNew();
      }
    };

    // Check action
    switch ( action ) {
      case 'new' :
        _newFile();
      break;

      case 'open' :
        if ( filename ) {
          _openFile(filename, mime);
        } else {
          var path = (this.currentFilename) ? OSjs.Utils.dirname(this.currentFilename) : null;
          this._createDialog('File', [{type: 'open', mime: 'image/png', mimes: ['^image'], path: path}, function(btn, fname, fmime) {
            if ( btn !== 'ok' ) return;
            _openFile(fname, fmime);
          }], win);
        }
      break;

      case 'save' :
        if ( this.currentFilename ) {
          _saveFile(this.currentFilename);
        }
      break;

      case 'saveas' :
        var dir = this.currentFilename ? OSjs.Utils.dirname(this.currentFilename) : null;
        var fnm = this.currentFilename ? OSjs.Utils.filename(this.currentFilename) : null;
        this._createDialog('File', [{type: 'save', path: dir, filename: fnm, mime: 'image/png', mimes: ['^image']}, function(btn, fname) {
            if ( btn !== 'ok' ) return;
          _saveFile(fname);
        }], win);
      break;
    }
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationDraw = ApplicationDraw;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Core.GUI, OSjs.Core.Dialogs);
