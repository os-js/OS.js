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
(function(Application, Window, GUI, Dialogs, Utils) {

  // TODO: Raw image loading/saving
  // TODO: Locales (Translations)
  // TODO: Shift layer positions
  // TODO: Copy/Cut/Paste
  // TODO: Resize

  var FileTypes = {
    "png": "image/png",
    "jpg": "image/jpeg"/*,
    "odraw": "osjs/draw"*/
  };

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
    this.activeLayer      = 0;
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

  /**
   * Create window contents
   */
  ApplicationDrawWindow.prototype.init = function(wmRef, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    // Layer bar container
    var layerBar = document.createElement("div");
    layerBar.className = "GUIToolbar ApplicationDrawLayersBar";

    var layerBarContainer = document.createElement("div");
    layerBarContainer.className = "Container";

    // Menubar
    var menuBar = this._addGUIElement(new GUI.MenuBar('ApplicationDrawMenuBar'), root);

    var _toggleToolsToolbar = function(t) {
      if ( typeof t !== "undefined" && t !== null ) {
        self.toggleTools = t ? true : false;
      } else {
        self.toggleTools = !self.toggleTools;
      }

      Utils.$removeClass(root, "ShowToolToolbar");
      if ( self.toggleTools ) {
        Utils.$addClass(root, "ShowToolToolbar");
      }
    };

    var _toggleLayersToolbar = function(t) {
      if ( typeof t !== "undefined" && t !== null ) {
        self.toggleLayers = t ? true : false;
      } else {
        self.toggleLayers = !self.toggleLayers;
      }

      Utils.$removeClass(root, "ShowLayerToolbar");
      if ( self.toggleLayers ) {
        Utils.$addClass(root, "ShowLayerToolbar");
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
    for ( var f = 0; f < effects.length; f++ ) {
      items.push({
        title: effects[f].title,
        name: effects[f].name,
        onClick: (function(instance) {
          return function() {
            self.applyEffect(instance);
          };
        })(effects[f])
      });
    }

    menuBar.addItem(OSjs._("Layer"), [
      {title: OSjs._('Effect'), name: 'Effect', menu: items}
    ]);

    menuBar.onMenuOpen = function(menu) {
      menu.setItemDisabled("Save", app.currentFilename ? false : true);
    };

    // Tools Toolbar
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
      var txt = {round: "Round", miter: "Miter", bevel: "Beveled"};
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
        toolBar.getItem('enableStroke').getElementsByClassName('EnableStroke')[0].innerHTML = self.currentStyle.stroke ? "Stroked" : "No stroke";
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

    // Image/Canvas container
    this.$imageContainer = document.createElement("div");
    this.$imageContainer.className = "ImageContainer";

    var isTouch = OSjs.Utils.getCompability().touch;

    this._addEventListener(this.$imageContainer, (isTouch ? "touchstart" : "mousedown"), function(ev) {
      ev.preventDefault();

      self.onMouseDown(ev);
      document.addEventListener("mousemove", function(ev) {
        self.onMouseMove(ev);
      });
    });

    this._addEventListener(this.$imageContainer, (isTouch ? "tocuhend" : "mouseup"), function(ev) {
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
    layerBar.appendChild(layerBarContainer);
    root.appendChild(layerBar);

    // Statusbar
    var statusBar  = this._addGUIElement(new GUI.StatusBar('ApplicationDrawStatusBar'), root);

    // Layer listview
    var layerList = this._addGUIElement(new OSjs.GUI.ListView('ApplicationDrawLayerListView'), layerBarContainer);

    layerList.setColumns([
      {key: 'name',  title: OSjs._('Name')}
     ]);
    layerList.onActivate = function(ev, el, item) {
      if ( item ) {
        self.setActiveLayer(item._index);
      }
    };
    layerList.onSelect = function(ev, el, item) {
      if ( item ) {
        self.setActiveLayer(item._index);
      }
    };

    // Layer buttons
    var layerButtons = document.createElement("div");
    layerButtons.className = "Buttons";

    var layerButtonAdd = this._addGUIElement(new OSjs.GUI.Button('ApplicationDrawLayerButtonAdd', {disabled: false, icon: OSjs.API.getIcon('actions/add.png'), onClick: function(el, ev) {
      self.createLayer();
    }}), layerButtons);

    var layerButtonRemove = this._addGUIElement(new OSjs.GUI.Button('ApplicationDrawLayerButtonRemove', {disabled: false, icon: OSjs.API.getIcon('actions/remove.png'), onClick: function(el, ev) {
      if ( layerList ) {
        self.removeLayer(self.activeLayer);
      }
    }}), layerButtons);

    var layerButtonUp = this._addGUIElement(new OSjs.GUI.Button('ApplicationDrawLayerButtonUp', {disabled: true, icon: OSjs.API.getIcon('actions/up.png'), onClick: function(el, ev) {
      if ( layerList ) {
        self.moveLayer(self.activeLayer, "up");
      }
    }}), layerButtons);

    var layerButtonDown = this._addGUIElement(new OSjs.GUI.Button('ApplicationDrawLayerButtonDown', {disabled: true, icon: OSjs.API.getIcon('actions/down.png'), onClick: function(el, ev) {
      if ( layerList ) {
        self.moveLayer(self.activeLayer, "down");
      }
    }}), layerButtons);

    layerBar.appendChild(layerButtons);

    // Reset/Initialize tools etc.
    _selectLineJoin(this.currentStyle.lineJoin);
    _selectLineWidth(this.currentStyle.lineWidth);
    _selectColor("fg", this.currentStyle.fg);
    _selectColor("bg", this.currentStyle.bg);
    _toggleStroke(this.currentStyle.stroke);
    _toggleToolsToolbar(this.toggleTools);
    _toggleLayersToolbar(this.toggleLayers);

    this.setImage(null, null);
  };

  /**
   * Destroy window
   */
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

  /**
   * Drag'n'Drop event
   */
  ApplicationDrawWindow.prototype._onDndEvent = function(ev, type, item, args) {
    Window.prototype._onDndEvent.apply(this, arguments);
    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._appRef.action('open', data.path, data.mime);
      }
    }
  };

  /**
   * Update Layer Listview
   */
  ApplicationDrawWindow.prototype.updateLayers = function() {
    if ( !this.image ) { return; }

    var layerList = this._getGUIElement('ApplicationDrawLayerListView');
    if ( layerList ) {
      var layers = [];
      var ilayers = this.image.layers;

      for ( var i = 0; i < ilayers.length; i++ ) {
        layers.push({
          name: ilayers[i].name
        });
      }

      layerList.setRows(layers);
      layerList.render();

      var tbody = layerList.$element.getElementsByTagName("tbody");
      if ( tbody.length ) {
        var rows = tbody[0].getElementsByTagName("tr");
        if ( rows[this.activeLayer] ) {
          Utils.$addClass(rows[this.activeLayer], "ActiveLayer");
        }
      }
    }
  };

  /**
   * Remove a layer by index
   */
  ApplicationDrawWindow.prototype.removeLayer = function(l) {
    if ( !this.image ) { return; }
    if ( this.image.layers.length <= 1 ) { return; }

    this.image.removeLayer(l);

    if ( this.activeLayer > 0 ) {
      this.activeLayer = l - 1;
      if ( this.activeLayer < 0 ) {
        this.activeLayer = 0;
      }
    }

    this.updateLayers();
  };

  /**
   * Move a layer by index and direction
   */
  ApplicationDrawWindow.prototype.moveLayer = function(l, dir) {
    if ( !this.image ) { return; }
    if ( this.image.layers.length <= 1 ) { return; }

    this.updateLayers();
  };

  /**
   * Create a new layer
   */
  ApplicationDrawWindow.prototype.createLayer = function() {
    if ( !this.image ) { return; }

    this.image.createLayer("Layer " + this.image.layers.length, 0, 0, true);
    this.activeLayer = this.image.layers.length - 1;

    this.updateLayers();
  };

  /**
   * Apply user-defined styles for tool
   */
  ApplicationDrawWindow.prototype.applyStyle = function(ev, context) {
    var style   = {
      enableStroke:  this.currentStyle.stroke,
      strokeStyle:   this.currentStyle.bg,
      fillStyle:     this.currentStyle.fg,
      lineJoin:      this.currentStyle.lineJoin,
      lineWidth:     this.currentStyle.lineWidth
    };

    if ( Utils.mouseButton(ev) != "left" ) {
      style.strokeStyle = this.currentStyle.fg;
      style.fillStyle   = this.currentStyle.bg;
    }

    this.currentTool.applyStyle(style, context);
  };

  /**
   * Apply given Effect to active layer in Image
   */
  ApplicationDrawWindow.prototype.applyEffect = function(effect) {
    if ( !this.image ) { return false; }
    var layer   = this.image.getActiveLayer();
    var context = layer.context;
    var win     = this;

    this._toggleDisabled(true);
    setTimeout(function() {
      effect.run(win, context, context.canvas, function() {
        win._toggleLoading(false);
        win._toggleDisabled(false);
      });
    }, 10);
  };

  /**
   * Image mousedown event
   */
  ApplicationDrawWindow.prototype.onMouseDown = function(ev) {
    if ( !this.image || !this.currentTool ) { return false; }
    var layer   = this.image.getActiveLayer();
    var context = layer.context;

    if ( !context ) { return false; }

    var pos = Utils.$position(this.$imageContainer);

    this.offsetX     = pos.left - this.$imageContainer.scrollLeft;
    this.offsetY     = pos.top - this.$imageContainer.scrollTop;
    this.mouseStartX = ev.pageX - this.offsetX;
    this.mouseStartY = ev.pageY - this.offsetY;

    this.applyStyle(ev, context);
    this.currentTool.onmousedown(ev, this, this.image, layer, [this.mouseStartX, this.mouseStartY], [this.mouseStartX, this.mouseStartY]);

    this.isPainting = true;

    return true;
  };

  /**
   * Image mouseup event
   */
  ApplicationDrawWindow.prototype.onMouseUp = function(ev) {
    if ( !this.image || !this.currentTool ) { return false; }

    var curX        = ev.pageX - this.offsetX;
    var curY        = ev.pageY - this.offsetY;

    this.currentTool.onmouseup(ev, this, this.image, this.image.getActiveLayer(), [curX, curY], [this.mouseStartX, this.mouseStartY]);

    this.isPainting = false;

    return true;
  };

  /**
   * Image mousemove event
   */
  ApplicationDrawWindow.prototype.onMouseMove = function(ev) {
    if ( !this.image || !this.currentTool ) { return false; }
    if ( !this.isPainting ) { return false; }

    var curX = ev.pageX - this.offsetX;
    var curY = ev.pageY - this.offsetY;

    this.isPainting  = true;

    this.currentTool.ondraw(ev, this, this.image, this.image.getActiveLayer(), [curX, curY], [this.mouseStartX, this.mouseStartY]);

    return true;
  };

  /**
   * Image mouseclick event
   */
  ApplicationDrawWindow.prototype.onMouseClick = function(ev) {
    if ( !this.image || !this.currentTool ) { return false; }
    var pos = Utils.$position(this.$imageContainer);
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

  /**
   * Set the current image
   */
  ApplicationDrawWindow.prototype.setImage = function(name, data, width, height) {
    if ( this.image ) {
      this.image.destroy();
      this.image = null;
    }

    name = name ? Utils.filename(name) : "New Image";
    data = data || null;

    var sx = data ? data.width  : (width  || 640);
    var sy = data ? data.height : (height || 480);

    this.image = new OSjs.Applications.ApplicationDrawLibs.Image(name, sx, sy);
    if ( data ) {
      this.image.setData(data);
    }
    this.$imageContainer.appendChild(this.image.getContainer());

    this.activeLayer = 0;

    this.setImageName(name);

    this.updateLayers();
  };

  /**
   * Set current image (file)name
   */
  ApplicationDrawWindow.prototype.setImageName = function(name) {
    if ( this.image ) {
      this.image.setName(name);
    }

    this.setTitle(name);
    this._toggleLoading(false);
    this._focus();
  };

  /**
   * Set current tool (Internal function)
   */
  ApplicationDrawWindow.prototype.setTool = function(tool) {
    this.currentTool = tool;

    var statusBar = this._getGUIElement('ApplicationDrawStatusBar');
    if ( statusBar ) {
      statusBar.setText(tool.statusText);
    }
  };

  /**
   * Set the window title (helper)
   */
  ApplicationDrawWindow.prototype.setTitle = function(t) {
    var title = this.title + (t ? (' - ' + Utils.filename(t)) : ' - New File');
    return this._setTitle(title);
  };

  /**
   * Set current color (Internal function)
   */
  ApplicationDrawWindow.prototype.setColor = function(type, val) {
    this.currentStyle[type] = val;

    var toolBar = this._getGUIElement('ApplicationDrawToolBar');
    if ( toolBar ) {
      var className = (type == "fg") ? "foregroundColor" : "backgroundColor";
      toolBar.getItem(className).getElementsByClassName('Color')[0].style.backgroundColor = val;
    }
  };

  /**
   * Set the currently active Image Layer by index
   */
  ApplicationDrawWindow.prototype.setActiveLayer = function(l) {
    if ( !this.image ) return;
    this.activeLayer = l;
    this.image.setActiveLayer(l);
    this.updateLayers();
  };

  /**
   * Gets the current Image
   */
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

  /**
   * Destroy Application
   */
  ApplicationDraw.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, []);
  };

  /**
   * Initialize Application
   */
  ApplicationDraw.prototype.init = function(core, settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var win = this._addWindow(new ApplicationDrawWindow(this, metadata));

    var open = this._getArgument('file');
    var mime = this._getArgument('mime');
    if ( open ) {
      this.action('open', open, mime);
    }
  };

  /**
   * Drag And Drop Helper
   */
  ApplicationDraw.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationDrawWindow' ) {
      this.destroy();
    }
  };

  /**
   * Perform an external action
   */
  ApplicationDraw.prototype.action = function(action, filename, mime) {
    switch ( action ) {
      case 'new' :
        this.onNew();
      break;

      case 'open' :
        this.onOpen(filename, mime);
      break;

      case 'save' :
        this.onSave(filename, mime);
      break;

      case 'saveas' :
        this.onSaveAs(filename, mime);
      break;

      case 'close' :
        this.destroy();
      break;
    }
  };

  /**
   * Open given file
   */
  ApplicationDraw.prototype.doOpen = function(filename, mime, data) {
    var self = this;
    var win = this._getWindow('ApplicationDrawWindow');
    var ext = OSjs.Utils.filext(filename).toLowerCase();

    var _openRaw = function() {
      var imageData = JSON.parse(data);
      var width  = imageData.size[0];
      var height = imageData.size[1];
      var layers = imageData.layers;

      self.setCurrentFile(filename, mime);
      if ( win ) {
        win.setImage(filename, layers, width, height);
      }
    };

    var _openConverted = function() {
      var img = new Image();
      img.onerror = function() {
        self.onError("Failed to load image data", "doOpen");
      };
      img.onload = function() {
        self.setCurrentFile(filename, mime);

        if ( win ) {
          win.setImage(filename, this);
        }
      };
      img.src = data;
    };

    if ( ext === "odraw" ) {
      try {
        _openRaw();
      } catch ( e ) {
        this.onError("Failed to load raw image", e, "doOpen");
        console.warn(e.stack);
      }
    } else {
      _openConverted();
    }
  };

  /**
   * Save to given file
   */
  ApplicationDraw.prototype.doSave = function(filename, mime) {
    var self = this;
    var win = this._getWindow('ApplicationDrawWindow');

    var ext = OSjs.Utils.filext(filename).toLowerCase();
    if ( FileTypes[ext] ) {
      mime = FileTypes[ext];
    } else {
      return;
    }

    var _onSaveFinished = function(name) {
      self.setCurrentFile(name, mime);
      if ( win ) {
        win.setImageName(name);
      }
    };

    var image = win.getImage();
    if ( !image ) { return; }
    var data = ext === "odraw" ? image.getSaveData() : image.getData(mime);
    var datas = ext !== "odraw";

    win._toggleLoading(true);
    OSjs.API.call('fs', {'method': 'file_put_contents', 'arguments': [filename, data, {dataSource: datas}]}, function(res) {
      if ( res && res.result ) {
        _onSaveFinished(filename);
      } else {
        if ( res && res.error ) {
          self.onError(OSjs._("Failed to save file: {0}", filename), res.error, "doSave");
          return;
        }
        self.onError(OSjs._("Failed to save file: {0}", filename), OSjs._("Unknown error"), "doSave");
      }
    }, function(error) {
      self.onError(OSjs._("Failed to save file (call): {0}", filename), error, "doSave");
    });
  };

  /**
   * File operation error
   */
  ApplicationDraw.prototype.onError = function(error, action) {
    action || "unknown";

    this.setCurrentFile(null, null);

    var win = this._getWindow('ApplicationDrawWindow');
    if ( win ) {
      win.setImageName("");

      win._error(OSjs._("{0} Application Error", self.__label), OSjs._("Failed to perform action '{0}'", action), error);

      win._toggleDisabled(false);
    } else {
      OSjs.API.error(OSjs._("{0} Application Error", self.__label), OSjs._("Failed to perform action '{0}'", action), error);
    }
  };

  /**
   * Wrapper for save action
   */
  ApplicationDraw.prototype.onSave = function(filename, mime) {
    if ( this.currentFilename ) {
      this.doSave(this.currentFilename, mime);
    }
  };

  /**
   * Wrapper for save as action
   */
  ApplicationDraw.prototype.onSaveAs = function(filename, mime) {
    var self = this;
    var win = this._getWindow('ApplicationDrawWindow');
    var dir = this.currentFilename ? Utils.dirname(this.currentFilename) : null;
    var fnm = this.currentFilename ? Utils.filename(this.currentFilename) : null;

    if ( win ) {
      win._toggleDisabled(true);
      this._createDialog('File', [{type: 'save', path: dir, filename: fnm, mime: 'image/png', mimes: ['^image'], defaultFilename: 'New Image.png', filetypes: FileTypes}, function(btn, fname) {
        if ( win ) {
          win._toggleDisabled(false);
        }
        if ( btn !== 'ok' ) return;
        self.doSave(fname, mime);
      }], win);
    }
  };

  /**
   * Wrapper for open action
   */
  ApplicationDraw.prototype.onOpen = function(filename, mime) {
    var self = this;
    var win = this._getWindow('ApplicationDrawWindow');

    var _openFile = function(fname, fmime) {
      if ( !fmime || (fmime != "osjs/draw" && !fmime.match(/^image/)) ) {
        OSjs.API.error(self.__label, OSjs._("Cannot open file"), OSjs._("Not supported!"));
        return;
      }

      var ext = OSjs.Utils.filext(fname).toLowerCase();
      var datas = ext !== "odraw";

      win.setTitle('Loading...');
      win._toggleLoading(true);
      OSjs.API.call('fs', {'method': 'file_get_contents', 'arguments': [fname, {dataSource: datas}]}, function(res) {
        if ( res && res.result ) {
          self.doOpen(fname, fmime, res.result);
        } else {
          if ( res && res.error ) {
            self.onError(OSjs._("Failed to open file: {0}", fname), res.error, "onOpen");
            return;
          }
          self.onError(OSjs._("Failed to open file: {0}", fname), OSjs._("Unknown error"), "onOpen");
        }
      }, function(error) {
        self.onError(OSjs._("Failed to open file (call): {0}", fname), error, "onOpen");
      });
    };

    if ( filename ) {
      _openFile(filename, mime);
    } else {
      var path = (this.currentFilename) ? Utils.dirname(this.currentFilename) : null;

      win._toggleDisabled(true);

      this._createDialog('File', [{type: 'open', mime: 'image/png', mimes: ['^image', 'osjs\/draw'], path: path}, function(btn, fname, fmime) {
        if ( win ) {
          win._toggleDisabled(false);
        }

        if ( btn !== 'ok' ) return;
        _openFile(fname, fmime);
      }], win);
    }
  };

  /**
   * Wrapper for new action
   */
  ApplicationDraw.prototype.onNew = function() {
    var win = this._getWindow('ApplicationDrawWindow');

    this.setCurrentFile(null, null);

    if ( win ) {
      win._toggleDisabled(true);

      this._createDialog("Input", ["New image dimension", "640x480", function(btn, val) {
        if ( win ) {
          win._toggleDisabled(false);
        }
        if ( btn !== "ok" ) { return; }

        var split  = val.toLowerCase().split("x");
        var width  = split.shift() || 0;
        var height = split.shift() || 0;

        if ( win ) {
          win.setImage(null, null, width, height);
        }
      }], win);
    }
  };

  /**
   * Sets current active file
   */
  ApplicationDraw.prototype.setCurrentFile = function(name, mime) {
    this.currentFilename = name;
    this._setArgument('file', name);
    this._setArgument('mime', mime || null);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationDraw = ApplicationDraw;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils);
