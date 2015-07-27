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
(function(API, Utils) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.GUING = OSjs.GUING || {};

  var CONSTRUCTORS = {
    'gui-textarea': {
      parameters: [],
      events: [],
      build: function(el) {
        var input = document.createElement('textarea');
        el.appendChild(input);
      }
    },
    'gui-text': {
      parameters: [],
      events: [],
      build: function(el) {
        var input = document.createElement('input');
        input.setAttribute('type', 'text');
        el.appendChild(input);
      }
    },
    'gui-password': {
      parameters: [],
      events: [],
      build: function(el) {
        var input = document.createElement('input');
        input.setAttribute('type', 'text');
        el.appendChild(input);
      }
    },
    'gui-radio': {
      parameters: [],
      events: [],
      build: function(el) {
        var input = document.createElement('input');
        input.setAttribute('type', 'radio');
        el.appendChild(input);
      }
    },
    'gui-checkbox': {
      parameters: [],
      events: [],
      build: function(el) {
        var input = document.createElement('input');
        input.setAttribute('type', 'checkbox');
        el.appendChild(input);
      }
    },
    'gui-button': {
      parameters: [],
      events: [],
      build: function(el) {
        var input = document.createElement('button');
        var label = el.getAttribute('data-label');
        input.appendChild(document.createTextNode(label));
        el.appendChild(input);
      }
    },

    'gui-tabs': {
      container: true,
      parameters: [],
      events: [],
      build: function(el) {
        var tabs = document.createElement('ul');
        var contents = document.createElement('div');

        el.querySelectorAll('gui-tab-container').forEach(function(el) {
          var tab = document.createElement('li');
          var label = el.getAttribute('data-label');
          tab.appendChild(document.createTextNode(label));
          tabs.appendChild(tab);
          contents.appendChild(el);
        });

        el.appendChild(tabs);
        el.appendChild(contents);
      }
    },

    'gui-vbox': {
      container: true,
      parameters: [],
      events: [],
      build: function(el) {
      }
    },

    'gui-hbox': {
      container: true,
      parameters: [],
      events: [],
      build: function(el) {
      }
    }

  };

  /////////////////////////////////////////////////////////////////////////////
  // CLASS
  /////////////////////////////////////////////////////////////////////////////

  function UIScheme(app) {
    this.url = API.getApplicationResource(app, './scheme.html');
  }

  UIScheme.prototype.load = function(cb) {
    var self = this;
    Utils.ajax({
      url: this.url,
      onsuccess: function(data) {
        var parsed = self.parse(data);
        cb(false, parsed);
      },
      onerror: function() {
        cb('Failed to fetch scheme');
      }
    });
  };

  UIScheme.prototype.parse = function(html) {
    var doc = document.createDocumentFragment();
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    doc.appendChild(wrapper);

    doc.querySelectorAll('*').forEach(function(el) {
      var lcase = el.tagName.toLowerCase();
      if ( lcase.match(/^gui\-/) ) {
        el.className = 'gui-element';
      }
    });

    Object.keys(CONSTRUCTORS).forEach(function(key) {
      doc.querySelectorAll(key).forEach(CONSTRUCTORS[key].build);
    });

    return doc;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUING.Scheme = UIScheme;

})(OSjs.API, OSjs.Utils);
