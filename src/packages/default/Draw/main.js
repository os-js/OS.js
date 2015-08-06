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
(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  var DEFAULT_WIDTH = 1024;
  var DEFAULT_HEIGHT = 768;

  var toolEvents = {
    pointer: {
    },

    picker: (function() {
      var imageData;

      function pick(ev, args) {
        var value = "#000000";
        var t = (ev.shiftKey || ev.button > 0) ? 'background' : 'foreground';

        if ( !imageData ) {
          imageData = args.ctx.getImageData(0, 0, args.canvas.width, args.canvas.height).data;
        }

        var index = ((args.pos.x + args.pos.y * args.canvas.width) * 4);
        try {
          value = Utils.convertToHEX({
            r:imageData[index + 0],
            g:imageData[index + 1],
            b:imageData[index + 2],
            a:imageData[index + 3]
          });
        } catch ( e ) {
        }

        args.win.setToolProperty(t, value);
      }

      return {
        mousedown: pick,
        mousemove: pick,
        mouseup: function(ev, pos, canvas, ctx, win) {
          imageData = null;
        }
      };
    })(),

    bucket: {
      mousedown: function(ev, args) {
        var t = (ev.shiftKey || ev.button > 0) ? 'background' : 'foreground';
        args.ctx.fillStyle = args.win.tool[t];
        args.ctx.fillRect(0, 0, args.canvas.width, args.canvas.height);
      }
    },

    pencil: {
      mousedown: function(ev, args) {
        var t = (ev.shiftKey || ev.button > 0) ? 'background' : 'foreground';
        args.ctx.strokeStyle = args.win.tool[t];
      },
      mousemove: function(ev, args) {
        args.ctx.beginPath();
        args.ctx.moveTo(args.pos.x-1, args.pos.y);
        args.ctx.lineTo(args.pos.x, args.pos.y);
        args.ctx.closePath();
        args.ctx.stroke();
      }
    },

    path: {
      mousemove: function(ev, args) {
        if ( args.tmpContext ) {
          args.tmpContext.clearRect(0, 0, args.tmpCanvas.width, args.tmpCanvas.height);
          args.tmpContext.beginPath();
          args.tmpContext.moveTo(args.start.x, args.start.y);
          args.tmpContext.lineTo(args.pos.x, args.pos.y);
          args.tmpContext.closePath();
          args.tmpContext.stroke();
        }
      }
    },

    rectangle: {
      mousedown: function(ev, args) {
        args.tmpContext.fillStyle = (ev.button > 0) ? args.win.tool.background : args.win.tool.foreground;
        args.tmpContext.strokeStyle = (ev.button <= 0) ? args.win.tool.background : args.win.tool.foreground;
      },
      mousemove: function(ev, args) {
        var x, y, w, h;

        if ( ev.shiftKey ) {
          x = Math.min(args.pos.x, args.start.x);
          y = Math.min(args.pos.y, args.start.y);
          w = Math.abs(args.pos.x - args.start.x);
          h = Math.abs(args.pos.y - args.start.y);
        } else {
          x = args.start.x; //Math.min(args.pos.x, args.start.x);
          y = args.start.y; //Math.min(args.pos.y, args.start.y);
          w = Math.abs(args.pos.x - args.start.x) * (args.pos.x < args.start.x ? -1 : 1);
          h = Math.abs(w) * (args.pos.y < args.start.y ? -1 : 1);
        }

        args.tmpContext.clearRect(0, 0, args.tmpCanvas.width, args.tmpCanvas.height);
        if ( w && h ) {
          if ( args.win.tool.lineStroke ) {
            args.tmpContext.strokeRect(x, y, w, h);
          }
          args.tmpContext.fillRect(x, y, w, h);
        }
      }
    },

    circle: {
      mousedown: function(ev, args) {
        args.tmpContext.fillStyle = (ev.button > 0) ? args.win.tool.background : args.win.tool.foreground;
        args.tmpContext.strokeStyle = (ev.button <= 0) ? args.win.tool.background : args.win.tool.foreground;
      },
      mousemove: function(ev, args) {
        if ( ev.shiftKey ) {
          var width = Math.abs(args.start.x - args.pos.x);
          var height = Math.abs(args.start.y - args.pos.y);

          args.tmpContext.clearRect(0, 0, args.tmpCanvas.width, args.tmpCanvas.height);
          if ( width > 0 && height > 0 ) {
            args.tmpContext.beginPath();
            args.tmpContext.moveTo(args.start.x, args.start.y - height*2); // A1
            args.tmpContext.bezierCurveTo(
              args.start.x + width*2, args.start.y - height*2, // C1
              args.start.x + width*2, args.start.y + height*2, // C2
              args.start.x, args.start.y + height*2); // A2

            args.tmpContext.bezierCurveTo(
              args.start.x - width*2, args.start.y + height*2, // C3
              args.start.x - width*2, args.start.y - height*2, // C4
              args.start.x, args.start.y - height*2); // A1

            args.tmpContext.closePath();
            if ( args.win.tool.lineStroke ) {
              args.tmpContext.stroke();
            }
            args.tmpContext.fill();
          }
        } else {
          var x = Math.abs(args.start.x - args.pos.x);
          var y = Math.abs(args.start.y - args.pos.y);
          var r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

          args.tmpContext.clearRect(0, 0, args.tmpCanvas.width, args.tmpCanvas.height);
          if ( r > 0 ) {
            args.tmpContext.beginPath();
            args.tmpContext.arc(args.start.x, args.start.y, r, 0, Math.PI*2, true);
            args.tmpContext.closePath();

            if ( args.win.tool.lineStroke ) {
              args.tmpContext.stroke();
            }
            args.tmpContext.fill();
          }
        }
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationDrawWindow(app, metadata, scheme) {
    DefaultApplicationWindow.apply(this, ['ApplicationDrawWindow', {
      icon: metadata.icon,
      title: metadata.name,
      allow_drop: true,
      min_width: 400,
      min_height: 450,
      width: 800,
      height: 450
    }, app, scheme]);

    this.tool = {
      name: 'pointer',
      background: '#ffffff',
      foreground: '#000000',
      lineJoin: 'round',
      lineWidth: 1,
      lineStroke: false
    };
  }

  ApplicationDrawWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationDrawWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationDrawWindow.prototype.init = function(wm, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'DrawWindow', root);

    //
    // Menu
    //

    //
    // Canvas
    //
    var canvas = scheme.find(this, 'Canvas').querySelector('canvas');
    canvas.width = DEFAULT_WIDTH;
    canvas.height = DEFAULT_HEIGHT;

    var ctx = canvas.getContext('2d');

    var startPos = {x: 0, y: 0};
    var cpos = {x: 0, y: 0};
    var tmpTools = ['path', 'rectangle', 'circle'];
    var tmpCanvas, tmpContext;
    var startPos;

    function createTempCanvas(ev) {
      tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = canvas.width;
      tmpCanvas.height = canvas.height;
      tmpCanvas.style.position = 'absolute';
      tmpCanvas.style.top = '0px';
      tmpCanvas.style.left = '0px';
      tmpCanvas.style.zIndex = 9999999999;
      canvas.parentNode.appendChild(tmpCanvas);

      var t = (ev.shiftKey || ev.button > 0);

      tmpContext = tmpCanvas.getContext('2d');
      tmpContext.strokeStyle = t ? ctx.fillStyle : ctx.strokeStyle;
      tmpContext.fillStyle = t ? ctx.strokeSyle : ctx.fillStyle;
      tmpContext.lineWidth = ctx.lineWidth;
      tmpContext.lineJoin = ctx.lineJoin;
    }

    function removeTempCanvas() {
      Utils.$remove(tmpCanvas);
      tmpContext = null;
      tmpCanvas = null;
    }

    function toolAction(action, ev, pos, diff) {
      if ( action === 'down' ) {
        startPos = {x: pos.x, y: pos.y};

        removeTempCanvas();

        var elpos = Utils.$position(canvas);
        startPos.x = pos.x - elpos.left;
        startPos.y = pos.y - elpos.top;
        cpos = {x: startPos.x, y: startPos.y};

        ctx.strokeStyle = self.tool.foreground;
        ctx.fillStyle   = self.tool.background;
        ctx.lineWidth   = self.tool.lineWidth;
        ctx.lineJoin    = self.tool.lineJoin;

        if ( tmpTools.indexOf(self.tool.name) >= 0 ) {
          createTempCanvas(ev);
        }
      } else if ( action === 'move' ) {
        cpos.x = startPos.x + diff.x;
        cpos.y = startPos.y + diff.y;
      } else if ( action === 'up' ) {
        if ( tmpCanvas && ctx ) {
          ctx.drawImage(tmpCanvas, 0, 0);
        }
        removeTempCanvas();
        startPos = null;
      }

      if ( toolEvents[self.tool.name] && toolEvents[self.tool.name]['mouse' + action] ) {
        toolEvents[self.tool.name]['mouse' + action](ev, {
          pos: cpos,
          start: startPos,
          canvas: canvas,
          ctx: ctx,
          tmpContext: tmpContext,
          tmpCanvas: tmpCanvas,
          win: self
        });
      }
    }

    GUI.Helpers.createDrag(canvas, function(ev, pos) {
      toolAction('down', ev, pos);
    }, function(ev, diff, pos) {
      toolAction('move', ev, pos, diff);
    }, function(ev, pos) {
      toolAction('up', ev, pos);
    });

    //
    // Toolbars
    //
    scheme.find(this, 'Foreground').on('click', function() {
      self.openColorDialog('foreground');
    });
    scheme.find(this, 'Background').on('click', function() {
      self.openColorDialog('background');
    });

    var tools = ['pointer', 'picker', 'bucket', 'pencil', 'path', 'rectangle', 'circle'];
    tools.forEach(function(t) {
      scheme.find(self, 'tool-' + t).on('click', function() {
        self.setToolProperty('name', t);
      });
    });

    var lineWidths = [];
    for ( var i = 1; i < 22; i++ ) {
      lineWidths.push({label: i.toString(), value: i});
    }

    scheme.find(this, 'LineWidth').add(lineWidths).on('change', function(ev) {
      self.setToolProperty('lineWidth', parseInt(ev.detail, 10));
    });
    scheme.find(this, 'LineJoin').on('change', function(ev) {
      self.setToolProperty('lineJoin', ev.detail);
    });
    scheme.find(this, 'LineStroke').on('change', function(ev) {
      self.setToolProperty('lineStroke', ev.detail);
    });

    //
    // Init
    //
    this.setToolProperty('background', null);
    this.setToolProperty('foreground', null);
    this.setToolProperty('lineJoin', null);
    this.setToolProperty('lineWidth', null);
    this.setToolProperty('lineStroke', null);

    return root;
  };

  ApplicationDrawWindow.prototype.openColorDialog = function(param) {
    var self = this;

    API.createDialog('Color', {
      title: 'Set ' + param + ' color', // FIXME: Locale
      color: self.tool[param]
    }, function(ev, button, result) {
      if ( button !== 'ok' ) { return; }
      self.setToolProperty(param, result.hex);
    });
  };

  ApplicationDrawWindow.prototype.setToolProperty = function(param, value) {
    console.warn('setToolProperty', param, value);

    if ( typeof this.tool[param] !== 'undefined' ) {
      if ( value !== null ) {
        this.tool[param] = value;
      }
    }

    this._scheme.find(this, 'Foreground').set('value', this.tool.foreground);
    this._scheme.find(this, 'Background').set('value', this.tool.background);
    this._scheme.find(this, 'LineJoin').set('value', this.tool.lineJoin);
    this._scheme.find(this, 'LineWidth').set('value', this.tool.lineWidth);
    this._scheme.find(this, 'LineStroke').set('value', this.tool.lineStroke);
  };

  ApplicationDrawWindow.prototype.showFile = function(file, result) {
    var self = this;
    DefaultApplicationWindow.prototype.showFile.apply(this, arguments);
  };

  ApplicationDrawWindow.prototype.getFileData = function() {
    return null;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationDraw = function(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationDraw', args, metadata, {
      readData: false,
      extension: 'png',
      mime: 'image/png',
      filename: 'New image.png'
    }]);
  };

  ApplicationDraw.prototype = Object.create(DefaultApplication.prototype);
  ApplicationDraw.constructor = DefaultApplication;

  ApplicationDraw.prototype.init = function(settings, metadata) {
    DefaultApplication.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationDrawWindow(self, metadata, scheme));
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationDraw = OSjs.Applications.ApplicationDraw || {};
  OSjs.Applications.ApplicationDraw.Class = ApplicationDraw;

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
