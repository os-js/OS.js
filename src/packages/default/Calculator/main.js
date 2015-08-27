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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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
(function(Application, Window, Utils, API, VFS, GUI) {
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

  function ApplicationCalculatorWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationCalculatorWindow', {
      icon: metadata.icon,
      title: metadata.name,
      allow_resize: false,
      allow_maximize: false,
      width: 220,
      height: 340
    }, app, scheme]);

    this.calc_array = ['=', 1, '0', '0', 0];
    this.pas_ch = 0;
  }

  ApplicationCalculatorWindow.prototype = Object.create(Window.prototype);
  ApplicationCalculatorWindow.constructor = Window.prototype;

  ApplicationCalculatorWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and gel.set up scheme (GUI) here
    scheme.render(this, 'CalculatorWindow', root);

    this._scheme.find(this, 'Output').on('keypress', function(ev) {
      ev.stopPropagation();
      ev.preventDefault();

      var keyCode = ev.which || ev.keyCode;
      if ( (keyCode>95) && (keyCode<106) ) {
        self.operation(keyCode-96);
      } else if ( (keyCode>47) && (keyCode<58) ) {
        self.operation(keyCode-48);
      } else {
        if ( typeof keys[keyCode] !== 'undefined' ) {
          self.operation(keys[keyCode]);
        }
      }
    }).focus();

    root.querySelectorAll('gui-button').forEach(function(el, idx) {
      var r = parseInt(idx / 4, 10);
      var c = idx % 4;
      var op = buttons[r][c];

      el = scheme.get(el);
      el.set('value', labels[op]);
      el.on('click', function() {
        self.operation(op);
      });
    });

    return root;
  };

  ApplicationCalculatorWindow.prototype.operation = function(o) {
    var calcul;
    var gel = this._scheme.find(this, 'Output');
    var addition = false;
    var getval = function() {
      return gel.get('value').toString();
    };

    switch ( o ) {
      case 'CE' :
        this.calc_array = ['=', 1, '0', '0', 0];
        gel.set('value', '0');
      break;

      case 'nbs' :
        if ( getval()<10 && getval()>-10 ) {
          gel.set('value', 0);
        } else {
          gel.set('value', getval().slice(0, getval().length-1));
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

          gel.set('value', calcul);
          this.calc_array[2]=calcul;
          this.calc_array[3]=0;
        }
        this.calc_array[0] = ops[o];
      break;

      case 'dec' :
        if ( getval().indexOf(ops.dec) === -1 ) {
          if ( this.calc_array[1] == 1 && getval().indexOf(ops.dec) === -1 ) {
            gel.set('value', '0.');

            this.calc_array[1] = 0;
          } else {
            gel.set('value', getval() + '.');
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
        gel.set('value', getval()/100);
        if ( this.calc_array[0] == '=' ) {
          this.calc_array[2] = getval();
          this.calc_array[3] = 0;
        } else {
          this.calc_array[3] = getval();
        }
        this.pas_ch = 1;
      break;

      case 'swap' :
        gel.set('value', getval()*-1);
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
          gel.set('value', calcul);
          this.calc_array[2]=calcul;
          this.calc_array[3]=0;
        }
      break;

      default:
        var n = (o << 0);
        if ( this.calc_array[1] == 1 ) {
          gel.set('value', n);
        } else {
          gel.set('value', getval() + n);
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

  ApplicationCalculatorWindow.prototype._focus = function() {
    if ( Window.prototype._focus.apply(this, arguments) ) {
      var input = this._scheme.find(this, 'Output');
      if ( input ) {
        input.focus();
      }
      return true;
    }
    return false;
  };


  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationCalculator = function(args, metadata) {
    Application.apply(this, ['ApplicationCalculator', args, metadata]);
  };

  ApplicationCalculator.prototype = Object.create(Application.prototype);
  ApplicationCalculator.constructor = Application;

  ApplicationCalculator.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationCalculatorWindow(self, metadata, scheme));

      onInited();
    });

    this._setScheme(scheme);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationCalculator = OSjs.Applications.ApplicationCalculator || {};
  OSjs.Applications.ApplicationCalculator.Class = ApplicationCalculator;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
