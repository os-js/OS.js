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
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {
  'use strict';

  var ops = {
    'dec'      : '.',
    'perc'     : '%',
    'minus'    : '-',
    'plus'     : '+',
    'multiply' : '*',
    'divide'   : '/'
  };

  var keys = {
    107: 'plus',
    109: 'minus',
    106: 'multiply',
    111: 'divide',
    110: 'dec',
    188: 'dec',
     13: 'equal',
     47: 'divide',
     46: 'CE',
     45: 'minus',
     44: 'dec',
     43: 'plus',
     42: 'multiply',
     27: 'CE',
      8: 'nbs'
  };

  var labels = {
    'CE' : 'CE',  'nbs' : '←',  'perc' : '%',  'plus'     : '+',
    '7'  : '7',   '8'   : '8',  '9'    : '9',  'minus'    : '-',
    '4'  : '4',   '5'   : '5',  '6'    : '6',  'multiply' : 'x',
    '1'  : '1',   '2'   : '2',  '3'    : '3',  'divide'   : '÷',
    '0'  : '0',   'swap': '±',  'dec'  : ',',  'equal'    : '='
  };

  var buttons = [
    ['CE', 'nbs',  'perc', 'plus'],
    ['7',  '8',    '9',    'minus'],
    ['4',  '5',    '6',    'multiply'],
    ['1',  '2',    '3',    'divide'],
    ['0',  'swap', 'dec',  'equal']
  ];

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window Constructor
   */
  var ApplicationCalculatorWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationCalculatorWindow', {
      title: metadata.name,
      icon: metadata.icon,
      allow_resize: false,
      allow_maximize: false,
      width: 220,
      height: 315
    }, app]);

    this.calc_array = ['=', 1, '0', '0', 0];
    this.pas_ch = 0;
  };

  ApplicationCalculatorWindow.prototype = Object.create(Window.prototype);

  ApplicationCalculatorWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Create window contents (GUI) here
    var row, col, lbl, key, container;

    container = document.createElement("div");
    container.className = "Output";
    this._addGUIElement(new GUI.Text('TextOutput', {value: "0", onKeyPress: function(ev) {
      ev.preventDefault();
      self.key(ev);
      return false;
    }}), container);
    root.appendChild(container);

    for ( row = 0; row < buttons.length; row++ ) {
      container = document.createElement("div");
      container.className = "Buttons";

      for ( col = 0; col < buttons[row].length; col++ ) {
        key = buttons[row][col];
        lbl = labels[key];

        this._addGUIElement(new GUI.Button('Button_'+key, {label: lbl, onClick: (function(c) {
          return function() {
            self.operation(c);
          };
        })(key), onMouseUp: function() {
          self.setFocus();
        }}), container);
      }

      root.appendChild(container);
    }

    return root;
  };

  ApplicationCalculatorWindow.prototype._inited = function() {
    Window.prototype._inited.apply(this, arguments);

    this.setFocus();
  };

  ApplicationCalculatorWindow.prototype._focus = function() {
    this.setFocus();
    return Window.prototype._focus.apply(this, arguments);
  };

  ApplicationCalculatorWindow.prototype._blur = function() {
    var gel = this._getGUIElement("TextOutput");
    if ( gel ) {
      gel.blur();
    }
    return Window.prototype._blur.apply(this, arguments);
  };

  ApplicationCalculatorWindow.prototype.destroy = function() {
    // Destroy custom objects etc. here

    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationCalculatorWindow.prototype.setFocus = function() {
    var gel = this._getGUIElement("TextOutput");
    if ( gel ) {
      gel.focus();
    }
  };

  ApplicationCalculatorWindow.prototype.key = function(ev) {
    var keyCode = ev.which || ev.keyCode;
    if ( (keyCode>95) && (keyCode<106) ) {
      this.operation(keyCode-96);
    } else if ( (keyCode>47) && (keyCode<58) ) {
      this.operation(keyCode-48);
    } else {
      if ( typeof keys[keyCode] !== "undefined" ) {
        this.operation(keys[keyCode]);
      }
    }
  };

  ApplicationCalculatorWindow.prototype._onKeyEvent = function(ev) {
    Window.prototype._onKeyEvent.apply(this, arguments);

    return;
    /*
    if ( ev.type == "keydown" || ev == "keypress" ) {
      this.key(ev);
    }
    */
  };

  ApplicationCalculatorWindow.prototype.operation = function(o) {
    var calcul;
    var gel = this._getGUIElement("TextOutput");
    if ( !gel ) return;
    gel.blur();

    var addition = false;
    var getval = function() {
      return gel.getValue().toString();
    };

    switch ( o ) {
      case 'CE' :
        this.calc_array = ['=', 1, '0', '0', 0];
        gel.setValue("0");
      break;

      case 'nbs' :
        if ( getval()<10 && getval()>-10 ) {
          gel.setValue(0);
        } else {
          gel.setValue(getval().slice(0, getval().length-1));
          
          this.pas_ch = 1;
        }
        if ( this.calc_array[0] == '=' ) {
          this.calc_array[2] = getval();
          this.calc_array[3] = 0;
        } else {
          this.calc_array[3] = getval();
        }
      break;
      
      case 'plus' :
      case 'minus' :
      case 'multiply' :
      case 'divide' :
        if ( this.calc_array[0] != '=' && this.calc_array[1] != 1 ) {
          eval('calcul='+this.calc_array[2]+this.calc_array[0]+this.calc_array[3]+';');

          gel.setValue(calcul);
          this.calc_array[2]=calcul;
          this.calc_array[3]=0;
        }
        this.calc_array[0] = ops[o];
      break;
        
      case 'dec' :
        if ( getval().indexOf(ops.dec) === -1 ) {
          if ( this.calc_array[1] == 1 && getval().indexOf(ops.dec) === -1 ) {
            gel.setValue('0.');

            this.calc_array[1] = 0;
          } else {
            gel.setValue(getval() + '.');
          }

          if ( this.calc_array[0] == '=' ) {
            this.calc_array[2] = getval();
            this.calc_array[3] = 0;
          } else {
            this.calc_array[3] = getval();
          }
        }
        
        addition = true;
      break;
        
      case 'perc' :
        gel.setValue(getval()/100);
        if ( this.calc_array[0] == '=' ) {
          this.calc_array[2] = getval();
          this.calc_array[3] = 0;
        } else {
          this.calc_array[3] = getval();
        }
        this.pas_ch = 1;
      break;

      case 'swap' :
        gel.setValue(getval()*-1);
        if ( this.calc_array[0] == '=' ) {
          this.calc_array[2] = getval();
          this.calc_array[3] = 0;
        } else {
          this.calc_array[3] = getval();
        }
        this.pas_ch = 1;
      break;

      case 'equal' :
        if ( this.calc_array[0] != '=' && this.calc_array[1] != 1 ) {
          eval('calcul='+this.calc_array[2]+this.calc_array[0]+this.calc_array[3]+';');
          this.calc_array[0] = '=';
          gel.setValue(calcul);
          this.calc_array[2]=calcul;
          this.calc_array[3]=0;
        }
      break;

      default:
        var n = (o << 0);
        if ( this.calc_array[1] == 1 ) {
          gel.setValue(n);
        } else {
          gel.setValue(getval() + n);
        }

        if ( this.calc_array[0] == '=' ) {
          this.calc_array[2] = getval();
          this.calc_array[3] = 0;
        } else {
          this.calc_array[3] = getval();
        }
        this.calc_array[1] = 0;

        addition = true;
      break;
    }

    if ( !addition ) {
      if ( this.pas_ch == 0 ) {
        this.calc_array[1] = 1;
      } else {
        this.pas_ch=0;
      }
    }

    gel.focus();
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application constructor
   */
  var ApplicationCalculator = function(args, metadata) {
    Application.apply(this, ['ApplicationCalculator', args, metadata]);

    // You can set application variables here
  };

  ApplicationCalculator.prototype = Object.create(Application.prototype);

  ApplicationCalculator.prototype.destroy = function() {
    // Destroy communication, timers, objects etc. here

    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationCalculator.prototype.init = function(settings, metadata) {
    var self = this;

    Application.prototype.init.apply(this, arguments);

    // Create your main window
    var mainWindow = this._addWindow(new ApplicationCalculatorWindow(this, metadata));

    // Do other stuff here
  };

  ApplicationCalculator.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    // Make sure we kill our application if main window was closed
    if ( msg == 'destroyWindow' && obj._name === 'ApplicationCalculatorWindow' ) {
      this.destroy();
    }
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationCalculator = ApplicationCalculator;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
