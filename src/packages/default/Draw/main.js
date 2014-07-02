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

  // TODO: Locales (Translations)
  // TODO: Add/Remove/Position layers from GUI
  // TODO: Copy/Cut/Paste
  // TODO: Resize

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return OSjs.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////


  /**
   * Main Window
   */
  var ApplicationDrawWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationDrawWindow', {width: 800, height: 450}, app]);

    this.title            = metadata.name;
    this.image            = null;
    this.toggleTools      = true;
    this.toggleLayers     = false;
    this.currentTool      = null;
    this.currentStyle     = {
      stroke    : false,
      bg        : "#000000",
      fg        : "#ffffff",
      lineJoin  : "round",
      lineWidth : 3
    };
    this.mouseStartX      = 0;
    this.mouseStartY      = 0;
    this.offsetX          = 0;
    this.offsetY          = 0;
    this.isPainting       = false;
    this.$imageContainer  = null;

    // Set window properties here
    this._title = this.title;
    this._icon = metadata.icon;
    this._properties.allow_drop = true;
  };

  ApplicationDrawWindow.prototype = Object.create(Window.prototype);

  ApplicationDrawWindow.prototype.init = function(wmRef, app) {
    var self = this;

    var root = Window.prototype.init.apply(this, arguments);

    // Create window contents here
    var menuBar = this._addGUIElement(new GUI.MenuBar('ApplicationDrawMenuBar'), root);

    var _toggleToolsToolbar = function(t) {
      if ( typeof t !== "undefined" && t !== null ) {
        self.toggleTools = t ? true : false;
      } else {
        self.toggleTools = !self.toggleTools;
      }

      OSjs.Utils.$removeClass(root, "ShowToolToolbar");
      if ( self.toggleTools ) {
        OSjs.Utils.$addClass(root, "ShowToolToolbar");
      }
    };

    var _toggleLayersToolbar = function(t) {
      if ( typeof t !== "undefined" && t !== null ) {
        self.toggleLayers = t ? true : false;
      } else {
        self.toggleLayers = !self.toggleLayers;
      }

      OSjs.Utils.$removeClass(root, "ShowLayerToolbar");
      if ( self.toggleLayers ) {
        OSjs.Utils.$addClass(root, "ShowLayerToolbar");
      }
    };

    menuBar.addItem(OSjs._("File"), [
      {title: OSjs._('New'), name: 'New', onClick: function() {
        app.action('new');
      }},
      {title: OSjs._('Open'), name: 'Open', onClick: function() {
        app.action('open');
      }},
      {title: OSjs._('Save'), name: 'Save', onClick: function() {
        app.action('save');
      }},
      {title: OSjs._('Save As...'), name: 'SaveAs', onClick: function() {
        app.action('saveas');
      }},
      {title: OSjs._('Close'), name: 'Close', onClick: function() {
        app.action('close');
      }}
    ]);
    menuBar.addItem(OSjs._("View"), [
      {title: OSjs._('Toggle tools toolbar'), name: 'ToggleToolsToolbar', onClick: function() {
        _toggleToolsToolbar();
      }},
      {title: OSjs._('Toggle layers toolbar'), name: 'ToggleLayersToolbar', onClick: function() {
        _toggleLayersToolbar();
      }}
    ]);
    /*
    menuBar.addItem(OSjs._("Image"), [
      {title: OSjs._('Resize'), name: 'Resize', onClick: function() {
      }}
    ]);
    */

    var effects = OSjs.Applications.ApplicationDrawLibs.Effects;
    var items = [];
    for ( var f in effects ) {
      if ( effects.hasOwnProperty(f) ) {
        items.push({
          title: effects[f].name,
          name: f,
          onClick: (function(fn, fi) {
            return function() {
              self.applyEffect(fn, fi);
            };
          })(f, effects[f].func)
        });
      }
    }

    menuBar.addItem(OSjs._("Layer"), [
      {title: OSjs._('Effect'), name: 'Effect', menu: items}
    ]);

    menuBar.onMenuOpen = function(menu) {
      menu.setItemDisabled("Save", app.currentFilename ? false : true);
    };

    var toolBar = this._addGUIElement(new GUI.ToolBar('ApplicationDrawToolBar', {orientation: 'vertical'}), root);

    var _createColorButton = function(name, item, container, button) {
      var color = document.createElement('div');
      color.className = 'Color';
      color.style.backgroundColor = name === 'foregroundColor' ? self.currentStyle.fg : self.currentStyle.bg;
      button.title = name === 'foregroundColor' ? 'Foreground (Fill) Color' : 'Background (Stroke) Color';
      button.appendChild(color);
    };

    var _createLineJoin = function(name, item, container, button) {
      var join = document.createElement('div');
      join.className = 'LineJoin';

      button.title = "Line Join";
      button.appendChild(join);
    };

    var _createLineWidth = function(name, item, container, button) {
      var width = document.createElement('div');
      width.className = 'LineWidth';

      button.title = "Line Width";
      button.appendChild(width);
    };

    var _createEnableStroke = function(name, item, container, button) {
      var en = document.createElement('div');
      en.className = 'EnableStroke';

      button.title = "Toggle Stroke";
      button.appendChild(en);
    };

    var _selectColor = function(type, hex) {
      self.currentStyle[type] = hex;
      if ( toolBar ) {
        var className = (type == "fg") ? "foregroundColor" : "backgroundColor";
        toolBar.getItem(className).getElementsByClassName('Color')[0].style.backgroundColor = hex;
      }
    };

    var _selectLineJoin = function(type) {
      var txt = {round: "R", miter: "M", bevel: "B"};
      self.currentStyle.lineJoin = type;
      if ( toolBar ) {
        toolBar.getItem('lineJoin').getElementsByClassName('LineJoin')[0].innerHTML = txt[type];
      }
    };

    var _selectLineWidth = function(width) {
      self.currentStyle.lineWidth = width;
      if ( toolBar ) {
        toolBar.getItem('lineWidth').getElementsByClassName('LineWidth')[0].innerHTML = width;
      }
    };

    var _toggleStroke = function(t) {
      if ( typeof t !== "undefined" && t !== null ) {
        self.currentStyle.stroke = t ? true : false;
      } else {
        self.currentStyle.stroke = !self.currentStyle.stroke;
      }
      if ( toolBar ) {
        toolBar.getItem('enableStroke').getElementsByClassName('EnableStroke')[0].innerHTML = self.currentStyle.stroke ? "S" : "NS";
      }
    };

    toolBar.addItem('foregroundColor', {title: ('Foreground'), onClick: function() {
      app._createDialog('Color', [{color: self.currentStyle.fg}, function(btn, rgb, hex) {
        self._focus();
        if ( btn !== 'ok' ) return;
        _selectColor("fg", hex);
      }], self);
    }, onCreate: _createColorButton});

    toolBar.addItem('backgroundColor', {title: ('Background'), onClick: function() {
      app._createDialog('Color', [{color: self.currentStyle.bg}, function(btn, rgb, hex) {
        self._focus();
        if ( btn !== 'ok' ) return;
        _selectColor("bg", hex);
      }], self);
    }, onCreate: _createColorButton});

    toolBar.addItem('lineJoin', {title: ('Line Join'), onClick: function(ev) {
      GUI.createMenu([
        {
          title: "Round",
          onClick: function(ev) {
            _selectLineJoin("round");
          }
        },
        {
          title: "Miter",
          onClick: function(ev) {
            _selectLineJoin("miter");
          }
        },
        {
          title: "Bevel",
          onClick: function(ev) {
            _selectLineJoin("bevel");
          }
        }
      ], {x: ev.clientX, y: ev.clientY});

    }, onCreate: _createLineJoin});

    toolBar.addItem('lineWidth', {title: ('Line Width'), onClick: function(ev) {
      var items = [];
      for ( var i = 1; i < 20; i++ ) {
        items.push({
          title: i,
          onClick: (function(idx) {
            return function() {
              _selectLineWidth(idx);
            };
          })(i)
        });
      }

      GUI.createMenu(items, {x: ev.clientX, y: ev.clientY});
    }, onCreate: _createLineWidth});

    toolBar.addItem('enableStroke', {title: ('Enable stroke'), onClick: function(ev) {
      _toggleStroke();
    }, onCreate: _createEnableStroke});

    toolBar.addSeparator();

    var tools = OSjs.Applications.ApplicationDrawLibs.Tools;
    var t;
    for ( var i = 0; i < tools.length; i++ ) {
      t = tools[i];
      if ( t ) {
        toolBar.addItem(t.name, {
          grouped: true,
          title: t.title,

          icon:(function(tool) {
            return OSjs.API.getApplicationResource(app, 'icons/' + tool.icon + '-16.png');
          })(t),

          onClick : (function(tool) {
            return function() {
              self.setTool(tool);
            };
          })(t)
        });
      }
    }

    toolBar.render();

    this.$imageContainer = document.createElement("div");
    this.$imageContainer.className = "ImageContainer";

    this._addEventListener(this.$imageContainer, "mousedown", function(ev) {
      ev.preventDefault();

      self.onMouseDown(ev);
      document.addEventListener("mousemove", function(ev) {
        self.onMouseMove(ev);
      });
    });

    this._addEventListener(this.$imageContainer, "mouseup", function(ev) {
      ev.preventDefault();

      self.onMouseUp(ev);
      document.removeEventListener("mousemove", function(ev) {
        self.onMouseMove(ev);
      });
    }, false);

    this._addEventListener(this.$imageContainer, "click", function(ev) {
      ev.preventDefault();

      self.onMouseClick(ev);
    }, false);

    root.appendChild(this.$imageContainer);

    var statusBar  = this._addGUIElement(new GUI.StatusBar('ApplicationDrawStatusBar'), root);

    _selectLineJoin(this.currentStyle.lineJoin);
    _selectLineWidth(this.currentStyle.lineWidth);
    _selectColor("fg", this.currentStyle.fg);
    _selectColor("bg", this.currentStyle.bg);
    _toggleStroke(this.currentStyle.stroke);
    _toggleToolsToolbar(this.toggleTools);
    _toggleLayersToolbar(this.toggleLayers);

    this.setImage(null, null);
  };

  ApplicationDrawWindow.prototype.destroy = function() {
    var self = this;

    // Destroy custom objects etc. here
    if ( this.image ) {
      this.image.destroy();
    }
    this.image = null;

    Window.prototype.destroy.apply(this, arguments);

    if ( this.$imageContainer ) {
      if ( this.$imageContainer.parentNode ) {
        this.$imageContainer.parentNode.removeChild(this.$imageContainer);
      }
      this.$imageContainer = null;
    }
  };

  ApplicationDrawWindow.prototype._onDndEvent = function(ev, type, item, args) {
    Window.prototype._onDndEvent.apply(this, arguments);
    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._appRef.action('open', data.path, data.mime);
      }
    }
  };

  ApplicationDrawWindow.prototype.applyStyle = function(ev, context) {
    var style   = {
      enableStroke:  this.currentStyle.stroke,
      strokeStyle:   this.currentStyle.bg,
      fillStyle:     this.currentStyle.fg,
      lineJoin:      this.currentStyle.lineJoin,
      lineWidth:     this.currentStyle.lineWidth
    };

    if ( OSjs.Utils.mouseButton(ev) != "left" ) {
      style.strokeStyle = this.currentStyle.fg;
      style.fillStyle   = this.currentStyle.bg;
    }

    this.currentTool.applyStyle(style, context);
  };

  ApplicationDrawWindow.prototype.applyEffect = function(name, func) {
    if ( !this.image ) { return false; }
    var layer   = this.image.getActiveLayer();
    var context = layer.context;

    func(context.canvas, context);
  };

  ApplicationDrawWindow.prototype.onMouseDown = function(ev) {
    if ( !this.image || !this.currentTool ) { return false; }
    var layer   = this.image.getActiveLayer();
    var context = layer.context;

    if ( !context ) { return false; }

    var pos = OSjs.Utils.$position(this.$imageContainer);

    this.offsetX     = pos.left - this.$imageContainer.scrollLeft;
    this.offsetY     = pos.top - this.$imageContainer.scrollTop;
    this.mouseStartX = ev.pageX - this.offsetX;
    this.mouseStartY = ev.pageY - this.offsetY;

    this.applyStyle(ev, context);
    this.currentTool.onmousedown(ev, this, this.image, layer, [this.mouseStartX, this.mouseStartY], [this.mouseStartX, this.mouseStartY]);

    this.isPainting = true;

    return true;
  };

  ApplicationDrawWindow.prototype.onMouseUp = function(ev) {
    if ( !this.image || !this.currentTool ) { return false; }

    var curX        = ev.pageX - this.offsetX;
    var curY        = ev.pageY - this.offsetY;

    this.currentTool.onmouseup(ev, this, this.image, this.image.getActiveLayer(), [curX, curY], [this.mouseStartX, this.mouseStartY]);

    this.isPainting = false;

    return true;
  };

  ApplicationDrawWindow.prototype.onMouseMove = function(ev) {
    if ( !this.image || !this.currentTool ) { return false; }
    if ( !this.isPainting ) { return false; }

    var curX = ev.pageX - this.offsetX;
    var curY = ev.pageY - this.offsetY;

    this.isPainting  = true;

    this.currentTool.ondraw(ev, this, this.image, this.image.getActiveLayer(), [curX, curY], [this.mouseStartX, this.mouseStartY]);

    return true;
  };

  ApplicationDrawWindow.prototype.onMouseClick = function(ev) {
    if ( !this.image || !this.currentTool ) { return false; }
    var pos = OSjs.Utils.$position(this.$imageContainer);
    var layer   = this.image.getActiveLayer();
    var context = layer.context;

    if ( !context ) { return false; }

    this.mouseStartX = ev.pageX - (pos.left - this.$imageContainer.scrollLeft);
    this.mouseStartY = ev.pageY - (pos.top - this.$imageContainer.scrollTop);
    this.isPainting  = false;

    this.applyStyle(ev, context);

    this.currentTool.onclick(ev, this, this.image, this.image.getActiveLayer(), [this.mouseStartX, this.mouseStartY], [this.mouseStartX, this.mouseStartY]);

    return true;
  };

  ApplicationDrawWindow.prototype.setImage = function(name, data) {
    if ( this.image ) {
      this.image.destroy();
      this.image = null;
    }

    name = name ? OSjs.Utils.filename(name) : "New Image";
    data = data || null;

    var sx = data ? data.width : 640;
    var sy = data ? data.height : 480;

    this.image = new OSjs.Applications.ApplicationDrawLibs.Image(name, sx, sy);
    if ( data ) {
      this.image.setData(data);
    }
    this.$imageContainer.appendChild(this.image.getContainer());

    this.setImageName(name);
  };

  ApplicationDrawWindow.prototype.setImageName = function(name) {
    if ( this.image ) {
      this.image.setName(name);
    }

    this.setTitle(name);
    this._toggleLoading(false);
    this._focus();
  };

  ApplicationDrawWindow.prototype.setTool = function(tool) {
    this.currentTool = tool;

    var statusBar = this._getGUIElement('ApplicationDrawStatusBar');
    if ( statusBar ) {
      statusBar.setText(tool.statusText);
    }
  };

  ApplicationDrawWindow.prototype.setTitle = function(t) {
    var title = this.title + (t ? (' - ' + OSjs.Utils.filename(t)) : ' - New File');
    return this._setTitle(title);
  };

  ApplicationDrawWindow.prototype.setColor = function(type, val) {
    this.currentStyle[type] = val;

    var toolBar = this._getGUIElement('ApplicationDrawToolBar');
    if ( toolBar ) {
      var className = (type == "fg") ? "foregroundColor" : "backgroundColor";
      toolBar.getItem(className).getElementsByClassName('Color')[0].style.backgroundColor = val;
    }
  };

  ApplicationDrawWindow.prototype.getImage = function() {
    return this.image;
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

  ApplicationDraw.prototype.init = function(core, settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationDrawWindow(this, metadata));

    var open = this._getArgument('file');
    var mime = this._getArgument('mime');
    if ( open ) {
      this.action('open', open, mime);
    }
  };

  ApplicationDraw.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationDrawWindow' ) {
      this.destroy();
    }
  };

  // TODO: Refactor
  ApplicationDraw.prototype.action = function(action, filename, mime) {
    var self = this;
    var win = this._getWindow('ApplicationDrawWindow');

    var _setCurrentFile = function(name, mime) {
      self.currentFilename = name;
      self._setArgument('file', name);
      self._setArgument('mime', mime || null);
    };

    var _onError = function(error) {
      _setCurrentFile(null, null);
      if ( win ) {
        win.setImageName("");

        win._error(OSjs._("{0} Application Error", self.__label), OSjs._("Failed to perform action '{0}'", action), error);
      } else {
        OSjs.API.error(OSjs._("{0} Application Error", self.__label), OSjs._("Failed to perform action '{0}'", action), error);
      }
    };

    var _saveFile = function(fname) {
      var _onSaveFinished = function(name) {
        _setCurrentFile(name, mime);
        if ( win ) {
          win.setImageName(name);
        }
      };

      var image = win.getImage();
      if ( !image ) { return; }
      var data = image.getData();

      win._toggleLoading(true);
      OSjs.API.call('fs', {'method': 'file_put_contents', 'arguments': [fname, data, {dataSource: true}]}, function(res) {
        if ( res && res.result ) {
          _onSaveFinished(fname);
        } else {
          if ( res && res.error ) {
            _onError(OSjs._("Failed to save file: {0}", fname), res.error);
            return;
          }
          _onError(OSjs._("Failed to save file: {0}", fname), OSjs._("Unknown error"));
        }
      }, function(error) {
        _onError(OSjs._("Failed to save file (call): {0}", fname), error);
      });
    };

    var _readFile = function(fname, fmime, data) {
      var img = new Image();
      img.onerror = function() {
        _onError("Failed to load image data");
      };
      img.onload = function() {
        _setCurrentFile(fname, fmime);

        if ( win ) {
          win.setImage(fname, this);
        }
      };
      img.src = data;
    };

    var _openFile = function(fname, fmime) {
      if ( fmime && !fmime.match(/^image/) ) {
        OSjs.API.error(self.__label, OSjs._("Cannot open file"), OSjs._("Not supported!"));
        return;
      }

      win.setTitle('Loading...');
      win._toggleLoading(true);
      OSjs.API.call('fs', {'method': 'file_get_contents', 'arguments': [fname, {dataSource: true}]}, function(res) {
        if ( res && res.result ) {
          if ( win ) {
            _readFile(fname, fmime, res.result);
          }
        } else {
          if ( res && res.error ) {
            _onError(OSjs._("Failed to open file: {0}", fname), res.error);
            return;
          }
          _onError(OSjs._("Failed to open file: {0}", fname), OSjs._("Unknown error"));
        }
      }, function(error) {
        _onError(OSjs._("Failed to open file (call): {0}", fname), error);
      });
    };

    var _newFile = function() {
      _setCurrentFile(null, null);

      if ( win ) {
        win.setImage(null, null);
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
        this._createDialog('File', [{type: 'save', path: dir, filename: fnm, mime: 'image/png', mimes: ['^image'], defaultFilename: 'New Image.png'}, function(btn, fname) {
            if ( btn !== 'ok' ) return;
          _saveFile(fname);
        }], win);
      break;

      case 'close' :
        this.destroy();
      break;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationDraw = ApplicationDraw;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs);
