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

const Window = OSjs.require('core/window');
const Application = OSjs.require('core/application');
const GUIElement = OSjs.require('gui/element');
const DOM = OSjs.require('utils/dom');

var ops = {
  dec: '.',
  perc: '%',
  minus: '-',
  plus: '+',
  multiply: '*',
  divide: '/'
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
  'CE': 'CE',  'AC': 'AC', 'perc': '%',  'plus': '+',
  '7': '7',   '8': '8',  '9': '9',  'minus': '-',
  '4': '4',   '5': '5',  '6': '6',  'multiply': 'x',
  '1': '1',   '2': '2',  '3': '3',  'divide': '÷',
  '0': '0',   'swap': '±',  'dec': ',',  'equal': '='
};

var buttons = [
  ['CE', 'AC',   'perc', 'plus'],
  ['7',  '8',    '9',    'minus'],
  ['4',  '5',    '6',    'multiply'],
  ['1',  '2',    '3',    'divide'],
  ['0',  'dec',  'equal']
];

/////////////////////////////////////////////////////////////////////////////
// WINDOWS
/////////////////////////////////////////////////////////////////////////////

class ApplicationCalculatorWindow extends Window {
  constructor(app, metadata) {
    super('ApplicationCalculatorWindow', {
      icon: metadata.icon,
      title: metadata.name,
      allow_resize: false,
      allow_maximize: false,
      width: 220,
      height: 340
    }, app);

    this.total = 0;
    this.entries = [];
    this.temp = '';
  }

  init(wm, app) {
    const root = super.init(...arguments);

    var self = this;

    // Load and gel.set up scheme (GUI) here
    this._render('CalculatorWindow', require('osjs-scheme-loader!scheme.html'));

    this._find('Output').on('keypress', function(ev) {
      ev.stopPropagation();
      ev.preventDefault();

      var keyCode = ev.which || ev.keyCode;
      if ( (keyCode > 95) && (keyCode < 106) ) {
        self.operation(keyCode - 96);
      } else if ( (keyCode > 47) && (keyCode < 58) ) {
        self.operation(keyCode - 48);
      } else {
        if ( typeof keys[keyCode] !== 'undefined' ) {
          self.operation(keys[keyCode]);
        }
      }
    }).set('readonly', true).focus();

    root.querySelectorAll('gui-button').forEach(function(el, idx) {
      var r = parseInt(idx / 4, 10);
      var c = idx % 4;
      var op = buttons[r][c];

      el = GUIElement.createInstance(el);
      el.set('value', labels[op] || '');
      if ( op === null ) {
        DOM.$addClass(el.$element, 'noop');
        el.set('disabled', true);
      } else {
        el.on('click', function() {
          self.operation(op);
        });
      }
    });

    return root;
  }

  operation(val) {
    var self = this;

    if (this.temp === '' && ['plus', 'minus', 'multiply', 'divide'].indexOf(val) !== -1) {
      this.temp = this._find('Output').get('value');
    }

    function getAnswer() {
      var nt = Number(self.entries[0]);

      for ( var i = 1; i < self.entries.length; i++ ) {
        var nextNum = Number(self.entries[i + 1]);
        var symbol = self.entries[i];
        if (symbol === '+') {
          nt += nextNum;
        } else if ( symbol === '-' ) {
          nt -= nextNum;
        } else if ( symbol === '*' ) {
          nt *= nextNum;
        } else if ( symbol === '/' ) {
          nt /= nextNum;
        }
        i++;
      }

      if ( nt < 0 ) {
        nt = '-' + Math.abs(nt);
      }

      return nt;
    }

    var output = (function() {
      // Kudos http://codepen.io/GeoffStorbeck/pen/zxgaqw

      if ( !isNaN(val) || val === 'dec' ) { // Number
        self.temp += val === 'dec' ? ops[val] : val;

        return self.temp.substring(0, 10);
      } else if ( val === 'AC' ) { // Clear
        self.entries = [];
        self.temp = '';
        self.total = 0;

        return '';
      } else if ( val === 'CE' ) { // Clear Last Entry
        self.temp = '';

        return '';
      } else if ( val === 'equal' ) { // Equal
        self.entries.push(self.temp);

        var nt = getAnswer();
        self.entries = [];
        self.temp = '';

        return nt;
      } else {
        if ( typeof ops[val] !== 'undefined' ) {
          val = ops[val];
        }

        self.entries.push(self.temp);
        self.entries.push(val);
        self.temp = '';
      }

      return null;
    })();

    if ( output !== null ) {
      if ( !String(output).length ) {
        output = String(0);
      }

      if ( output === 'NaN' || output === 'Infinity' || isNaN(output) || !isFinite(output) ) {
        DOM.$addClass(this._$element, 'NaN');

        setTimeout(function() {
          DOM.$removeClass(self._$element, 'NaN');
        }, 3000);
      }

      this._find('Output').set('value', String(output));
    }

    this._find('Output').focus();
  }
}

class ApplicationCalculator extends Application {
  constructor(args, metadata) {
    super('ApplicationCalculator', args, metadata);
  }

  init(settings, metadata) {
    super.init(...arguments);

    this._addWindow(new ApplicationCalculatorWindow(this, metadata));
  }
}

OSjs.Applications.ApplicationCalculator = ApplicationCalculator;

