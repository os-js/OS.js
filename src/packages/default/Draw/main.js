/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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
  'use strict';

  // TODO: Copy/Cut/Paste
  // TODO: Resize
  // TODO: DefaultApplicationWindow
  // TODO: Check for changes

  function MoveLayer(arr, old_index, new_index) {
    if (new_index >= arr.length) {
      var k = new_index - arr.length;
      while ((k--) + 1) {
        arr.push(undefined);
      }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  }

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      'Toggle tools toolbar' : 'Svitsj verktøylinje',
      'Toggle layers toolbar' : 'Svitsj lag-verktøylinje',
      'Layer' : 'Lag',
      'Effect' : 'Effekt',
      'Foreground' : 'Forgrunn',
      'Bakgrunn' : 'Bakgrunn',
      'Foreground (Fill) Color' : 'Forgrunn (Fyll) Farge',
      'Background (Stroke) Color' : 'Bakgrunn (Strøk) Farge',
      'Line Join' : 'Linje Knytting',
      'Line Width' : 'Linje Bredde',
      'Toggle Stroke' : 'Svitsj strøk',
      'Enable stroke' : 'Skru på strøk',
      'Round' : 'Rund',
      'Miter' : 'Skjev',
      'Bevel' : 'Kantet',
      'Stroked' : 'Strøk På',
      'No stroke' : 'Strøk Av',

      'Pointer' : 'Peker',
      'Move active layer' : 'Flytt aktivt lag',

      'Picker' : 'Plukker',
      'LMB: set fg color, RMB: set gb color' : 'LMB: sett bg farge, RMB: sett fg farge',

      'Pencil' : 'Penn',
      'LMB/RMB: Draw with fg/bg color' : 'LMB/RMB: Tegn med fg/bg farge',
      'Path' : 'Sti',

      'Square/Rectangle' : 'Firkant/Rektangel',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw rectangle' : 'LMB/RMB: Tegn med fg/bg farge, SHIFT: Tegn rektangel',

      'Circle/Ellipse' : 'Sirkel/Ellipse',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw ellipse' : 'LMB/RMB: Tegn med fg/bg farge, SHIFT: Tegn ellipse',

      'Blur' : 'Klatte (Blur)',
      'Noise' : 'Støy',
      'Invert colors' : 'Inverter farger',
      'Grayscale' : 'Gråskala',
      'Sharpen' : 'Skarpgjør',
      'Simple Blur' : 'Simpel Klatte (Blur)'

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
      bg        : "#ffffff",
      fg        : "#000000",
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

    var toggleTools = app._getArgument("ShowTools");
    if ( typeof toggleTools !== "undefined" && toggleTools !== null ) {
      this.toggleTools = toggleTools;
    }

    var toggleLayers = app._getArgument("ShowLayers");
    if ( typeof toggleLayers !== "undefined" && toggleLayers !== null ) {
      this.toggleLayers = toggleLayers;
    }

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

      app._setArgument("ShowTools", self.toggleTools);

      self._focus();
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

      app._setArgument("ShowLayers", self.toggleLayers);

      self._focus();
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
      {title: _('Toggle tools toolbar'), name: 'ToggleToolsToolbar', onClick: function() {
        _toggleToolsToolbar();
      }},
      {title: _('Toggle layers toolbar'), name: 'ToggleLayersToolbar', onClick: function() {
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
        title: _(effects[f].title),
        name: effects[f].name,
        onClick: (function(instance) {
          return function() {
            self.applyEffect(instance);
          };
        })(effects[f])
      });
    }

    menuBar.addItem(_("Layer"), [
      {title: _('Effect'), name: 'Effect', menu: items},
      {title: _('Flip X'), name: 'FlipX', onClick : function() {
        self.applyModifier("flip", "x");
      }},
      {title: _('Flip Y'), name: 'FlipY', onClick : function() {
        self.applyModifier("flip", "y");
      }}
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
      button.title = _(name === 'foregroundColor' ? 'Foreground (Fill) Color' : 'Background (Stroke) Color');
      button.appendChild(color);
    };

    var _createLineJoin = function(name, item, container, button) {
      var join = document.createElement('div');
      join.className = 'LineJoin';

      button.title = _("Line Join");
      button.appendChild(join);
    };

    var _createLineWidth = function(name, item, container, button) {
      var width = document.createElement('div');
      width.className = 'LineWidth';

      button.title = _("Line Width");
      button.appendChild(width);
    };

    var _createEnableStroke = function(name, item, container, button) {
      var en = document.createElement('div');
      en.className = 'EnableStroke';

      button.title = _("Toggle Stroke");
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
      var txt = {round: "Round", miter: "Miter", bevel: "Bevel"};
      self.currentStyle.lineJoin = type;
      if ( toolBar ) {
        toolBar.getItem('lineJoin').getElementsByClassName('LineJoin')[0].innerHTML = _(txt[type]);
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
        toolBar.getItem('enableStroke').getElementsByClassName('EnableStroke')[0].innerHTML = _(self.currentStyle.stroke ? "Stroked" : "No stroke");
      }
    };

    toolBar.addItem('foregroundColor', {title: _('Foreground'), onClick: function() {
      app._createDialog('Color', [{color: self.currentStyle.fg}, function(btn, rgb, hex) {
        self._focus();
        if ( btn !== 'ok' ) return;
        _selectColor("fg", hex);
      }], self);
    }, onCreate: _createColorButton});

    toolBar.addItem('backgroundColor', {title: _('Background'), onClick: function() {
      app._createDialog('Color', [{color: self.currentStyle.bg}, function(btn, rgb, hex) {
        self._focus();
        if ( btn !== 'ok' ) return;
        _selectColor("bg", hex);
      }], self);
    }, onCreate: _createColorButton});

    toolBar.addItem('lineJoin', {title: _('Line Join'), onClick: function(ev) {
      GUI.createMenu([
        {
          title: _("Round"),
          onClick: function(ev) {
            _selectLineJoin("round");
          }
        },
        {
          title: _("Miter"),
          onClick: function(ev) {
            _selectLineJoin("miter");
          }
        },
        {
          title: _("Bevel"),
          onClick: function(ev) {
            _selectLineJoin("bevel");
          }
        }
      ], {x: ev.clientX, y: ev.clientY});

    }, onCreate: _createLineJoin});

    toolBar.addItem('lineWidth', {title: _('Line Width'), onClick: function(ev) {
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

    toolBar.addItem('enableStroke', {title: _('Enable stroke'), onClick: function(ev) {
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
    var hasMoved = false;

    var _onMove = function(ev) {
      ev.preventDefault();

      hasMoved = true;
      self.onMouseMove(ev);
    };

    this._addEventListener(this.$imageContainer, (isTouch ? "touchstart" : "mousedown"), function(ev) {
      ev.preventDefault();
      hasMoved = false;

      self.onMouseDown(ev);
      document.addEventListener((isTouch ? "touchmove" : "mousemove"), function(ev) {
        _onMove(ev);
      });
    });

    this._addEventListener(this.$imageContainer, (isTouch ? "tocuhend" : "mouseup"), function(ev) {
      ev.preventDefault();

      self.onMouseUp(ev);
      document.removeEventListener((isTouch ? "touchmove" : "mousemove"), function(ev) {
        _onMove(ev);
      });
    }, false);

    this._addEventListener(this.$imageContainer, (isTouch ? "touchend" : "click"), function(ev) {
      ev.preventDefault();
      if ( isTouch && hasMoved ) { return; }

      self.onMouseClick(ev);

      hasMoved = false;
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

    var layerButtonUp = this._addGUIElement(new OSjs.GUI.Button('ApplicationDrawLayerButtonUp', {disabled: false, icon: OSjs.API.getIcon('actions/up.png'), onClick: function(el, ev) {
      if ( layerList ) {
        self.moveLayer(self.activeLayer, "up");
      }
    }}), layerButtons);

    var layerButtonDown = this._addGUIElement(new OSjs.GUI.Button('ApplicationDrawLayerButtonDown', {disabled: false, icon: OSjs.API.getIcon('actions/down.png'), onClick: function(el, ev) {
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

    var updated = false;
    var nindex = l;
    if ( dir == "up" ) {
      nindex--;
    } else {
      nindex++;
    }

    if ( nindex >= 0 && nindex <= (this.image.layers.length-1) ) {
      MoveLayer(this.image.layers, l, nindex);
      updated = true;
    }

    if ( updated ) {
      this.image.refreshZindex();

      var layerList = this._getGUIElement('ApplicationDrawLayerListView');
      if ( layerList ) {
        layerList.setSelectedIndex(nindex, true);
      }

      this.activeLayer = nindex;

      this.updateLayers();
    }
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
   * Apply given Modifier or Transformation
   */
  ApplicationDrawWindow.prototype.applyModifier = function(mod, arg) {
    if ( !this.image ) { return; }
    var layer = this.image.getActiveLayer();
    if ( !layer ) { return; }

    if ( mod == "flip" ) {
      if ( arg == "x" ) {
        layer.flipX();
      } else {
        layer.flipY();
      }
    }
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
        win._focus();
      });
    }, 10);

    win._focus();
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

    var sx = data ? (typeof data.width  == "undefined" ? width : data.width)  : (width  || 640);
    var sy = data ? (typeof data.height == "undefined" ? height : data.height) : (height || 480);

    this.image = new OSjs.Applications.ApplicationDrawLibs.Image(name, sx, sy);
    if ( data ) {
      this.image.setData(data);
    }
    var container = this.image.getContainer();
    container.style.width = sx + "px";
    container.style.height = sy + "px";
    this.$imageContainer.appendChild(container);

    this.activeLayer = 0;

    this.setImageName(name);

    this.updateLayers();

    this._focus();
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
      statusBar.setText(_(tool.statusText));
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

    this._focus();
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
    Application.apply(this, ['ApplicationDraw', args, metadata]);

    this.dialogOptions.mimes = metadata.mime;
    this.dialogOptions.defaultFilename = "New image.odraw";
    this.dialogOptions.defaultMime = "osjs/draw";
    this.dialogOptions.filetypes = {
      "png": "image/png",
      "jpg": "image/jpeg",
      "odraw": "osjs/draw"
    };
  };

  ApplicationDraw.prototype = Object.create(Application.prototype);


  /**
   * Initialize Application
   */
  ApplicationDraw.prototype.init = function(core, settings, metadata) {
    this.mainWindow = this._addWindow(new ApplicationDrawWindow(this, metadata));

    Application.prototype.init.apply(this, arguments);
  };

  ApplicationDraw.prototype.onNew = function() {
    var win = this.mainWindow;
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

  ApplicationDraw.prototype.onOpen = function(filename, mime, data) {
    var self = this;
    var win = this.mainWindow;
    var ext = OSjs.Utils.filext(filename).toLowerCase();

    var _openRaw = function() {
      var imageData = JSON.parse(data);
      var width  = imageData.size[0] << 0;
      var height = imageData.size[1] << 0;
      var layers = imageData.layers;

      self._setCurrentFile(filename, mime);
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
        self._setCurrentFile(filename, mime);

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

  ApplicationDraw.prototype.onSave = function(filename, mime, data) {
    if ( this.mainWindow ) {
      this.mainWindow.setImageName(filename);
      this.mainWindow._focus();
    }
  };

  ApplicationDraw.prototype.onError = function() {
    if ( this.mainWindow ) {
      this.mainWindow.setImageName("");
    }
    return Application.prototype.onError.apply(this, arguments);
  };

  ApplicationDraw.prototype.onCheckDataSource = function(filename, mime) {
    var ext = OSjs.Utils.filext(filename).toLowerCase();
    return ext !== "odraw";
  };

  ApplicationDraw.prototype.onGetSaveData = function(callback, filename, mime) {
    if ( !this.mainWindow ) {
      callback(null);
      return;
    }

    var image = this.mainWindow.getImage();
    if ( !image ) {
      callback(null);
      return;
    }

    var ext = OSjs.Utils.filext(filename).toLowerCase();
    var data = ext === "odraw" ? image.getSaveData() : image.getData(mime);

    callback(data);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationDraw = ApplicationDraw;

})(OSjs.Helpers.DefaultApplication, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils);
