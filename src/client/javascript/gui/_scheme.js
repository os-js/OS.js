/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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
(function(API, Utils, VFS) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};

  /////////////////////////////////////////////////////////////////////////////
  // INTERNAL HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Internal for parsing GUI elements
   */
  function parseDynamic(scheme, node, win, args) {
    args = args || {};

    var translator = args._ || API._;

    node.querySelectorAll('*[data-label]').forEach(function(el) {
      var label = translator(el.getAttribute('data-label'));
      el.setAttribute('data-label', label);
    });

    node.querySelectorAll('gui-label, gui-button, gui-list-view-column, gui-select-option, gui-select-list-option').forEach(function(el) {
      if ( !el.children.length && !el.getAttribute('data-no-translate') ) {
        var lbl = OSjs.GUI.Helpers.getValueLabel(el);
        el.appendChild(document.createTextNode(translator(lbl)));
      }
    });

    node.querySelectorAll('gui-button').forEach(function(el) {
      var label = OSjs.GUI.Helpers.getValueLabel(el);
      if ( label ) {
        el.appendChild(document.createTextNode(API._(label)));
      }
    });

    node.querySelectorAll('*[data-icon]').forEach(function(el) {
      var image = OSjs.GUI.Helpers.getIcon(el, win);
      el.setAttribute('data-icon', image);
    });
  }

  /**
   * Method for adding children (moving)
   */
  function addChildren(frag, root) {
    if ( frag ) {
      var children = frag.children;
      var i = 0;
      while ( children.length && i < 10000 ) {
        root.appendChild(children[0]);
        i++;
      }
    }
  }

  /**
   * Makes sure "include" fragments are rendered correctly
   */
  function resolveFragments(scheme, node, el) {
    function _resolve() {
      var nodes = node.querySelectorAll('gui-fragment');
      if ( nodes.length ) {
        nodes.forEach(function(el) {
          var id = el.getAttribute('data-fragment-id');
          var frag = scheme.getFragment(id, 'application-fragment');

          addChildren(frag, el.parentNode);
          Utils.$remove(el);
        });
        return true;
      }

      return false;
    }

    var resolving = true;
    while ( resolving ) {
      resolving = _resolve();
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * The class for loading and parsing UI Schemes
   *
   * @api   OSjs.GUI.Scheme
   *
   * @class Scheme
   */
  function UIScheme(url) {
    console.group('UIScheme::construct()');
    console.log(url);
    console.groupEnd();

    this.url = url;
    this.scheme = null;
    this.triggers = {render: []};
  }

  UIScheme.prototype.destroy = function() {
    Utils.$empty(this.scheme);

    this.scheme = null;
    this.triggers = {};
  };

  /**
   * Register event
   *
   * @param   String      f       Event name
   * @param   Function    fn      Function/callback
   *
   * @return  void
   * @method  Scheme::on()
   */
  UIScheme.prototype.on = function(f, fn) {
    this.triggers[f].push(fn);
  };

  UIScheme.prototype._trigger = function(f, args) {
    args = args || [];

    var self = this;
    this.triggers[f].forEach(function(fn) {
      fn.apply(self, args);
    });
  };

  UIScheme.prototype._load = function(html) {
    function removeSelfClosingTags(str) {
      var split = (str || '').split('/>');
      var newhtml = '';
      for (var i = 0; i < split.length - 1;i++) {
        var edsplit = split[i].split('<');
        newhtml += split[i] + '></' + edsplit[edsplit.length - 1].split(' ')[0] + '>';
      }
      return newhtml + split[split.length - 1];
    }

    var doc = document.createDocumentFragment();
    var wrapper = document.createElement('div');
    wrapper.innerHTML = Utils.cleanHTML(removeSelfClosingTags(html));
    doc.appendChild(wrapper);

    this.scheme = doc.cloneNode(true);

    wrapper = null;
    doc = null;
  };

  /**
   * Load Scheme from given String
   *
   * @param   String      html    HTML data
   * @param   Function    cb      callback => fn(error, scheme)
   *
   * @return  void
   * @method  Scheme::load()
   */
  UIScheme.prototype.loadString = function(html, cb) {
    console.debug('UIScheme::loadString()');
    this._load(html);
    cb(false, this.scheme);
  };

  /**
   * Load Scheme from URL
   *
   * @param   Function    cb      callback => fn(error, scheme)
   *
   * @return  void
   * @method  Scheme::load()
   */
  UIScheme.prototype.load = function(cb) {
    var self = this;

    console.debug('UIScheme::load()', this.url);

    if ( window.location.protocol.match(/^file/) ) {
      var url = this.url;
      if ( !url.match(/^\//) ) {
        url = '/' + url;
      }
      self._load(OSjs.API.getDefaultSchemes(url.replace(/^\/packages/, '')));
      cb(false, self.scheme);
      return;
    }

    Utils.ajax({
      url: this.url,
      onsuccess: function(html) {
        self._load(html);
        cb(false, self.scheme);
      },
      onerror: function() {
        cb('Failed to fetch scheme');
      }
    });
  };

  /**
   * Get fragment from ID (and/or type)
   *
   * @param   String      id      ID
   * @param   String      type    (Optional) type (application-window | application-fragment)
   *
   * @return  DOMElement
   * @method  Scheme::getFragment()
   */
  UIScheme.prototype.getFragment = function(id, type) {
    var content = null;
    if ( id ) {
      if ( type ) {
        content = this.scheme.querySelector(type + '[data-id="' + id + '"]');
      } else {
        content = this.scheme.querySelector('application-window[data-id="' + id + '"]') ||
                  this.scheme.querySelector('application-fragment[data-id="' + id + '"]');
      }
    }
    return content;
  };

  /**
   * Parses the given fragment
   *
   * @param   String      id      Fragment ID
   * @param   String      type    (Optional) Fragment Type
   * @param   Window      win     OS.js Window
   * @param   Function    onparse (Optional) Callback on parsed
   * @param   Object      args    (Optional) Parameters
   *
   * @return  DOMElement
   * @method  Scheme::parse()
   */
  UIScheme.prototype.parse = function(id, type, win, onparse, args) {
    var self = this;
    var content = this.getFragment(id, type);

    console.debug('UIScheme::parse()', id);

    if ( !content ) {
      console.error('UIScheme::parse()', 'No fragment found', id, type);
      return null;
    }

    type = type || content.tagName.toLowerCase();
    onparse = onparse || function() {};
    args = args || {};

    if ( content ) {
      var node = content.cloneNode(true);

      // Resolve fragment includes before dynamic rendering
      resolveFragments(this, node);

      // Apply a default className to non-containers
      node.querySelectorAll('*').forEach(function(el) {
        var lcase = el.tagName.toLowerCase();
        if ( lcase.match(/^gui\-/) && !lcase.match(/(\-container|\-(h|v)box|\-columns?|\-rows?|(status|tool)bar|(button|menu)\-bar|bar\-entry)$/) ) {
          Utils.$addClass(el, 'gui-element');
        }
      });

      // Go ahead and parse dynamic elements (like labels)
      parseDynamic(this, node, win, args);

      // Lastly render elements
      onparse(node);

      Object.keys(OSjs.GUI.Elements).forEach(function(key) {
        node.querySelectorAll(key).forEach(function(pel) {
          if ( pel._wasParsed ) {
            return;
          }

          try {
            OSjs.GUI.Elements[key].build(pel);
          } catch ( e ) {
            console.warn('UIScheme::parse()', id, type, win, 'exception');
            console.warn(e, e.stack);
          }
          pel._wasParsed = true;
        });
      });

      return node;
    }

    return null;
  };

  /**
   * Renders the given fragment into Window
   *
   * @param   Window      win     OS.js Window
   * @param   String      id      Fragment ID
   * @param   DOMElement  root    (Optional) Root HTML Node
   * @param   String      type    (Optional) Fragment Type
   * @param   Function    onparse (Optional) Callback on parsed
   * @param   Object      args    (Optional) Parameters
   *
   * @return  DOMElement
   * @method  Scheme::render()
   */
  UIScheme.prototype.render = function(win, id, root, type, onparse, args) {
    root = root || win._getRoot();
    if ( root instanceof OSjs.GUI.Element ) {
      root = root.$element;
    }

    function setWindowProperties(frag) {
      if ( frag ) {
        var width = parseInt(frag.getAttribute('data-width'), 10) || 0;
        var height = parseInt(frag.getAttribute('data-height'), 10) || 0;

        if ( (!isNaN(width) && width > 0) || (!isNaN(height) && height > 0) ) {
          win._resize(width, height);
        }
      }
    }

    console.debug('UIScheme::render()', id);

    var content = this.parse(id, type, win, onparse, args);
    addChildren(content, root);

    if ( !win._restored ) {
      setWindowProperties(this.getFragment(id));
    }

    this._trigger('render', [root]);
  };

  /**
   * Renders the given fragment into Window
   *
   * @param   Window      win           OS.js Window
   * @param   String      tagName       OS.js GUI Element name
   * @param   Object      params        Parameters
   * @param   DOMElement  parentNode    Parent Node
   * @param   Object      applyArgs     New element parameters
   *
   * @return  UIElement
   * @method  Scheme::create()
   */
  UIScheme.prototype.create = function(win, tagName, params, parentNode, applyArgs) {
    tagName = tagName || '';
    params = params || {};
    parentNode = parentNode || win.getRoot();
    if ( parentNode instanceof OSjs.GUI.Element ) {
      parentNode = parentNode.$element;
    }

    var el;
    if ( OSjs.GUI.Elements[tagName] && OSjs.GUI.Elements[tagName].create ) {
      el = OSjs.GUI.Elements[tagName].create(params);
    } else {
      el = OSjs.GUI.Helpers.createElement(tagName, params);
    }

    parentNode.appendChild(el);
    OSjs.GUI.Elements[tagName].build(el, applyArgs, win);

    return new OSjs.GUI.Element(el);
  };

  /**
   * Returns given UIElement by ID
   *
   * @param   Window      win       OS.js Window
   * @param   String      id        Element ID (data-id)
   * @param   DOMElement  root      (Optional) Root Node
   *
   * @return  UIElement
   * @method  Scheme::find()
   */
  UIScheme.prototype.find = function(win, id, root) {
    root = this._findRoot(win, root);
    var res = this._findDOM(win, id, root);
    return this.get(res.el, res.q);
  };

  /**
   * Returns given DOMElement by ID
   *
   * @param   Window      win       OS.js Window
   * @param   String      id        Element ID (data-id)
   * @param   DOMElement  root      (Optional) Root Node
   *
   * @return  DOMNode
   * @method  Scheme::has()
   */
  UIScheme.prototype.findDOM = function(win, id, root) {
    root = this._findRoot(win, root);
    return this._findDOM(win, id, root).el;
  };

  UIScheme.prototype._findRoot = function(win, root) {
    if ( !(win instanceof OSjs.Core.Window) ) {
      throw new Error('UIScheme::_findDOM() expects a instance of Window');
    }
    return root || win._getRoot();
  };

  UIScheme.prototype._findDOM = function(win, id, root) {
    var q = '[data-id="' + id + '"]';
    return {
      q: q,
      el: root.querySelector(q)
    };
  };

  /**
   * Gets UIElement by DOMElement
   *
   * @param   DOMElement    el      DOM Element
   *
   * @return  UIElement
   * @method  Scheme::get()
   */
  UIScheme.prototype.get = function(el, q) {
    if ( el ) {
      var tagName = el.tagName.toLowerCase();
      if ( tagName.match(/^gui\-(list|tree|icon|file)\-view$/) || tagName.match(/^gui\-select/) ) {
        return new OSjs.GUI.ElementDataView(el, q);
      }
    }
    return new OSjs.GUI.Element(el, q);
  };

  /**
   * Get HTML from Scheme
   *
   * @return  String
   * @method  Scheme::getHTML()
   */
  UIScheme.prototype.getHTML = function() {
    return this.scheme.firstChild.innerHTML;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Scheme = UIScheme;

  /**
   * Shortcut for creating a new UIScheme class
   *
   * @param String    url     URL to scheme file
   * @return UIScheme
   * @api OSjs.GUI.createScheme()
   */
  OSjs.GUI.createScheme = function(url) {
    return new UIScheme(url);
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS);
