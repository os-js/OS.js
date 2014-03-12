"use strict";
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
(function() {
  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function createDroppable(el, args) {
    args = args || {};

    args.accept = args.accept || null;
    args.effect = args.effect || 'move';
    args.mime   = args.mime   || 'application/json';
    args.files  = args.files  || true;

    if ( OSjs.Utils.isIE() ) {
      args.mime = "text";
    }

    args.onFilesDropped = args.onFilesDropped || function() { return true; };
    args.onItemDropped  = args.onItemDropped  || function() { return true; };
    args.onEnter        = args.onEnter        || function() { return true; };
    args.onOver         = args.onOver         || function() { return true; };
    args.onLeave        = args.onLeave        || function() { return true; };
    args.onDrop         = args.onDrop         || function() { return true; };

    var _onDrop = function(ev, el) {
      ev.stopPropagation();
      ev.preventDefault();

      args.onDrop.call(this, ev, el);
      if ( !ev.dataTransfer ) { return true; }

      if ( args.files ) {
        var files = ev.dataTransfer.files;
        if ( files && files.length ) {
          return args.onFilesDropped.call(this, ev, el, files, args);
        }
      }

      var data;
      var self = this;
      try {
        data = ev.dataTransfer.getData(args.mime);
      } catch ( e ) {
        console.warn('Failed to drop: ' + e);
      }
      if ( data ) {
        var item = JSON.parse(data);
        if ( args.accept === null || args.accept == item.type ) {
          return args.onItemDropped.call(self, ev, el, item, args);
        }
      }

      return false;
    };

    el.addEventListener('drop', function(ev) {
      return _onDrop(ev, this);
    }, false);

    el.addEventListener('dragenter', function(ev) {
      return args.onEnter.call(this, ev, this, args);
    }, false);

    el.addEventListener('dragover', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      ev.dataTransfer.dropEffect = args.effect;
      return args.onOver.call(this, ev, this, args);
    }, false);

    el.addEventListener('dragleave', function(ev) {
      return args.onLeave.call(this, ev, this, args);
    }, false);
  }

  function createDraggable(el, args) {
    args        = args        || {};
    args.type   = args.type   || null;
    args.effect = args.effect || 'move';
    args.data   = args.data   || null;
    args.mime   = args.mime   || 'application/json';

    args.onStart    = args.onStart    || function() { return true; };
    args.onEnd      = args.onEnd      || function() { return true; };

    if ( OSjs.Utils.isIE() ) {
      args.mime = "text";
    }

    var _toString = function(mime) {
      return JSON.stringify({
        type:   args.type,
        effect: args.effect,
        data:   args.data,
        mime:   args.mime
      });
    };

    el.setAttribute("draggable", "true");
    el.addEventListener('dragstart', function(ev) {
      this.style.opacity = '0.4';
      if ( ev.dataTransfer ) {
        try {
          ev.dataTransfer.effectAllowed = args.effect;
          ev.dataTransfer.setData(args.mime, _toString(args.mime));
        } catch ( e ) {
          console.warn("Failed to dragstart: " + e);
        }
      }

      return args.onStart(ev, this, args);
    }, false);

    el.addEventListener('dragend', function(ev) {
      this.style.opacity = '1.0';

      return args.onEnd(ev, this, args);
    }, false);
  }

  function getFileIcon(filename, mime, type, icon, size) {
    if ( !filename ) { throw "Filename is required for getFileIcon()"; }
    type = type || 'file';
    icon = icon || 'mimetypes/gnome-fs-regular.png';
    size = size || '16x16';

    if ( type == 'dir' ) {
      icon = 'places/folder.png';
    } else if ( type == 'file' ) {
      if ( mime ) {
        if ( mime.match(/^application\/(x\-python|javascript)/) || mime.match(/^text\/(html|xml|css)/) ) {
          icon = 'mimetypes/stock_script.png';
        } else if ( mime.match(/^text\//) ) {
          icon = 'mimetypes/txt.png';
        } else if ( mime.match(/^audio\//) ) {
          icon = 'mimetypes/sound.png';
        } else if ( mime.match(/^video\//) ) {
          icon = 'mimetypes/video.png';
        } else if ( mime.match(/^image\//) ) {
          icon = 'mimetypes/image.png';
        } else if ( mime.match(/^application\//) ) {
          icon = 'mimetypes/binary.png';
        } else if ( mime.match(/^osjs\/document/) ) {
          icon = 'mimetypes/gnome-mime-application-msword.png';
        }
      }
    }

    return OSjs.API.getThemeResource(icon, 'icon', size);
  }

  /**
   * GUI Element
   *
   * options:
   *  onItemDropped   Function      Callback - When internal object dropped (requires dnd enabled)
   *  onFilesDropped  Function      Callback - When external file object dropped (requires dnd enabled)
   *  dnd             bool          Enable DnD (Default = false)
   *  dndDrop         bool          Enable DnD Droppable (Default = DnD)
   *  dndDrag         bool          Enable DnD Draggable (Default = DnD)
   *  dndOpts         Object        DnD Options
   *  focusable       bool          If element is focusable (Default = false)
   */
  var GUIElement = (function() {
    var _Count = 0;

    return function(name, opts) {
      opts = opts || {};

      this.name           = name || ('Unknown_' + _Count);
      this.opts           = opts || {};
      this.id             = _Count;
      this.destroyed      = false;
      this.wid            = 0; // Set in Window::_addGUIElement()
      this.hasChanged     = false;
      this.hasCustomKeys  = opts.hasCustomKeys === true;
      this.onItemDropped  = opts.onItemDropped  || function() {};
      this.onFilesDropped = opts.onFilesDropped || function() {};
      this.$element       = null;
      this.inited         = false;
      this._hooks         = {
        focus   : [],
        blur    : [],
        destroy : []
      };

      if ( typeof this.opts.dnd === 'undefined' ) {
        this.opts.dnd     = false;
      }
      if ( typeof this.opts.dndDrop === 'undefined' ) {
        this.opts.dndDrop = this.opts.dnd;
      }
      if ( typeof this.opts.dndDrag === 'undefined' ) {
        this.opts.dndDrag = this.opts.dnd;
      }
      if ( typeof this.opts.dndOpts === 'undefined' ) {
        this.opts.dndOpts = {};
      }
      if ( typeof this.opts.focusable === 'undefined' ) {
        this.opts.focusable = false;
      }

      this.init();
      _Count++;
    };
  })();

  GUIElement.prototype.init = function(className) {
    var self = this;

    var classNames = [
      'GUIElement',
      'GUIElement_' + this.id,
      OSjs.Utils.$safeName(className),
      OSjs.Utils.$safeName(this.name)
    ];

    this.$element = document.createElement('div');
    this.$element.className = classNames.join(' ');

    if ( this.opts.dnd && this.opts.dndDrop && OSjs.Compability.dnd ) {
      var opts = this.opts.dndOpts;
      opts.onItemDropped = function(ev, el, item) {
        return self.onItemDropped.call(self, ev, el, item);
      };
      opts.onFilesDropped = function(ev, el, files) {
        return self.onFilesDropped.call(self, ev, el, files);
      };

      createDroppable(this.$element, opts);
    }

    if ( this.opts.focusable ) {
      this._addEventListener(this.$element, 'mousedown', function(ev) {
        self.focus();
      });
    }

    return this.$element;
  };

  GUIElement.prototype.update = function() {
    this.inited = true;
  };

  GUIElement.prototype.destroy = function() {
    if ( this.destroyed ) { return; }

    this.destroyed = true;
    this._fireHook('destroy');
    if ( this.$element && this.$element.parentNode ) {
      this.$element.parentNode.removeChild(this.$element);
    }
    this._hooks = {};
  };

  GUIElement.prototype._addEvent = function(el, ev, callback) {
    el[ev] = callback;
    this._addHook('destroy', function() {
      el[ev] = null;
    });
  };

  GUIElement.prototype._addEventListener = function(el, ev, callback) {
    el.addEventListener(ev, callback, false);

    this._addHook('destroy', function() {
      el.removeEventListener(ev, callback, false);
    });
  };

  GUIElement.prototype._addHook = function(k, func) {
    if ( typeof func === 'function' && this._hooks[k] ) {
      this._hooks[k].push(func);
    }
  };

  GUIElement.prototype._fireHook = function(k, args) {
    args = args || {};
    if ( this._hooks[k] ) {
      for ( var i = 0, l = this._hooks[k].length; i < l; i++ ) {
        if ( !this._hooks[k][i] ) { continue; }
        try {
          this._hooks[k][i].apply(this, args);
        } catch ( e ) {
          console.warn("GUIElement::_fireHook() failed to run hook", k, i, e);
        }
      }
    }
  };

  GUIElement.prototype.getRoot = function() {
    return this.$element;
  };

  GUIElement.prototype.onDndDrop = function(ev) {
    return true;
  };

  GUIElement.prototype.onKeyPress = function(ev) {
    if ( this.hasCustomKeys ) { return false; }
    if ( !this.focused ) { return false; }
    return true;
  };

  GUIElement.prototype.focus = function() {
    if ( this.focused ) { return false; }
    console.debug("GUIElement::focus()", this.id, this.name);
    this.focused = true;
    this._fireHook('focus');
    return true;
  };

  GUIElement.prototype.blur = function() {
    if ( !this.focused ) { return false; }
    console.debug("GUIElement::blur()", this.id, this.name);
    this.focused = false;
    this._fireHook('blur');
    return true;
  };

  /**
   * _Input
   *
   * options: (See GUIElement for more)
   *  disabled        bool          HTML Input disabled ?
   *  value           String        HTML Input value
   *  label           String        Label value
   *  placeholder     String        Placeholder value (HTML5)
   *  onChange        Function      Callback - When value changed
   *  onClick         Function      Callback - When clicked
   *  onKeyPress      Function      Callback - When key pressed
   *
   *  Please not that not all of these options applies to all
   *  implemented input elements!
   */
  var _Input = function(className, tagName, name, opts) {
    opts = opts || {};
    opts.hasCustomKeys = true;

    this.$input       = null;
    this.type         = tagName === 'input' ? (opts.type || 'text') : null;
    this.disabled     = opts.disabled     || false;
    this.value        = opts.value        || '';
    this.label        = opts.label        || '';
    this.placeholder  = opts.placeholder  || '';
    this.className    = className;
    this.tagName      = tagName;
    this.onChange     = opts.onChange     || function() {};
    this.onClick      = opts.onClick      || function() {};
    this.onKeyPress   = opts.onKeyPress   || function() {};

    GUIElement.apply(this, [name, opts]);
  };

  _Input.prototype = Object.create(GUIElement.prototype);

  _Input.prototype.init = function() {
    var self = this;
    var el = GUIElement.prototype.init.apply(this, [this.className]);
    this.$input = document.createElement(this.tagName);

    if ( this.tagName == 'input' ) {
      this.$input.type = this.type;
      if ( this.type === 'text' || this.type === 'password' ) {
        if ( this.placeholder ) {
          this.$input.setAttribute('placeholder', this.placeholder);
        }

        this._addEventListener(this.$input, 'keypress', function(ev) {
          self.onKeyPress.apply(self, [ev]);
        });
      }
    }

    if ( this.tagName == 'button' ) {
      if ( this.opts.icon ) {
        var img = document.createElement('img');
        img.alt = '';
        img.src = this.opts.icon;
        this.$input.appendChild(img);
      }
      this.$input.appendChild(document.createTextNode(this.value || this.label));
      this._addEvent(this.$input, 'onclick', function(ev) {
        if ( self.isDisabled() ) { return; }
        self.onClick.apply(self, [this, ev]);
      });
    } else {
      this._addEvent(this.$input, 'onchange', function(ev) {
        self.onChange.apply(self, [this, ev, self.getValue()]);
      });
    }

    el.appendChild(this.$input);

    this.setDisabled(this.disabled);
    this.setValue(this.value);
    return el;
  };

  _Input.prototype.blur = function() {
    if ( GUIElement.prototype.blur.apply(this, arguments) ) {
      this.$input.blur();
    }
    return false;
  };

  _Input.prototype.focus = function() {
    if ( GUIElement.prototype.focus.apply(this, arguments) ) {
      this.$input.focus();
    }
    return false;
  };

  _Input.prototype.setDisabled = function(d) {
    this.disabled = d;
    if ( d ) {
      this.$input.setAttribute("disabled", "disabled");
    } else {
      this.$input.removeAttribute("disabled");
    }
  };

  _Input.prototype.isDisabled = function() {
    return this.disabled;
  };

  _Input.prototype.setValue = function(val) {
    if ( this.tagName === 'button' ) {
      return;
    }
    this.value = val;
    this.$input.value = val;
  };

  _Input.prototype.getValue = function() {
    if ( this.tagName === 'button' ) {
      return null;
    }
    return this.$input.value;
  };

  /**
   * Data View Base Class
   *
   * This is for handling data lists in some sort of view
   *
   * options: (See GUIElement for more)
   *  onSelect          Function        Callback - When item is selected (clicked)
   *  onActivate        Function        Callback - When item is activated (dblclick)
   *  onContextMenu     Function        Callback - When item menu is activated (rightclick)
   *  onCreateItem      Function        Callback - When item is created
   *  data              Array           Data (Items)
   *  indexKey          String          What key is used as an index (usefull for autoselecting last selected row on re-render)
   *  render            bool            Render on create (default = true when data is supplied)
   */
  var _DataView = function(name, opts) {
    opts            = opts || {};
    opts.focusable  = true;

    this.$view      = null;
    this.selected   = null;
    this.data       = [];

    this.indexKey       = opts.indexKey       || null;
    this.onSelect       = opts.onSelect       || function(ev, el, item) {};
    this.onActivate     = opts.onActivate     || function(ev, el, item) {};
    this.onContextMenu  = opts.onContextMenu  || function(ev, el, item) {};
    this.onCreateItem   = opts.onCreateItem   || function(el, iter) {};

    GUIElement.apply(this, [name, opts]);
  };

  _DataView.prototype = Object.create(GUIElement.prototype);

  _DataView.prototype.update = function() {
    GUIElement.prototype.update.apply(this, arguments);

    // Automatic render when user supplies data
    if ( this.opts.data ) {
      if ( typeof this.opts.render === 'undefined' || this.opts.render === true ) {
      //if ( typeof this.opts.row === 'undefined' || this.opts.render === true ) {
        this.render(this.opts.data);
      }
    }
  };

  _DataView.prototype.init = function(className, view) {
    var el = GUIElement.prototype.init.apply(this, [className]);
    this.$view = document.createElement('div');
    if ( typeof view === 'undefined' || view === true ) {
      el.appendChild(this.$view);
    }
    return el;
  };

  _DataView.prototype.clear = function() {
    this.render([], true);
  };

  _DataView.prototype.refresh = function() {
    this.render(this.data, false);
  };

  _DataView.prototype.render = function(data, reset) {
    if ( !this.$view ) { return false; }

    var self = this;
    var reselect = null;
    var scrollTop = 0;

    if ( !reset ) {
      if ( this.indexKey ) {
        if ( this.selected ) {
          reselect = this.selected[this.indexKey];
          scrollTop = this.$view.scrollTop;
        }
      }
    }

    if ( typeof data !== 'undefined' ) {
      this.setData(data);
    }
    this._onSelect(null, null);

    this._onRender();

    if ( reselect ) {
      setTimeout(function() {
        self.setSelected(reselect, self.indexKey);
        if ( self.$view ) {
          self.$view.scrollTop = scrollTop;
        }
      }, 10);
    } else {
      this.$view.scrollTop = 0;
    }

    return true;
  };

  _DataView.prototype._onRender = function() {
  };

  _DataView.prototype.__onSelect = function(ev, item, scroll) {
    if ( this.selected && this.selected._element ) {
      OSjs.Utils.$removeClass(this.selected._element, 'Active');
    }

    this.selected = null;

    if ( item && item._element ) {
      this.selected  = item;
      OSjs.Utils.$addClass(this.selected._element, 'Active');

      if ( scroll ) {
        var pos = OSjs.Utils.$position(this.selected._element, this.$view);
        if ( pos !== null && this.$view.scrollTop < pos.top ) {
          this.$view.scrollTop = pos.top;
        }
      }
    }
  };

  _DataView.prototype._onSelect = function(ev, item, scroll, callback) {
    this.__onSelect(ev, item, scroll);

    if ( typeof callback === 'undefined' || callback === true ) {
      if ( ev !== null && item !== null ) {
        this.onSelect.apply(this, [ev, (item ? item._element : null), item]);
      }
    }
    return this.selected;
  };

  _DataView.prototype._onActivate = function(ev, item, callback) {
    if ( typeof callback === 'undefined' || callback === true ) {
      this.onActivate.apply(this, [ev, (item ? item._element : null), item]);
    }
    return item;
  };

  _DataView.prototype._onContextMenu = function(ev, item) {
    this._onSelect(ev, item);

    this.onContextMenu.apply(this, [ev, item._element, item]);
    return item;
  };

  _DataView.prototype.setData = function(data, render) {
    this.data = data;
    if ( render ) {
      this.render();
    }
  };

  _DataView.prototype.setSelected = function(val, key, scrollTo) {
    if ( !key && !val ) {
      this._onSelect(null, null, false);
      return true;
    }

    var item = this.getItemByKey(key, val);
    if ( item ) {
      this._onSelect(null, item, scrollTo);
      return true;
    }
    return false;
  };

  _DataView.prototype.setSelectedIndex = function(idx, scrollTo) {
    if ( this.data[idx] ) {
      this._onSelect(null, this.data[idx], scrollTo);
    }
  };

  _DataView.prototype.setItems = function() {
    this.setData.apply(this, arguments);
  };

  _DataView.prototype.getItemByKey = function(key, val) {
    var data = this.data;
    for ( var i = 0, l = data.length; i < l; i++ ) {
      if ( data[i][key] == val ) {
        return data[i];
      }
    }
    return null;
  };

  _DataView.prototype.getItem = function(idx) {
    return this.data[idx];
  };

  _DataView.prototype.getSelected = function() {
    return this.selected;
  };

  /////////////////////////////////////////////////////////////////////////////
  // CLASSES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Menu class
   */
  var Menu = function(menuList) {
    var self = this;

    var _onclick = function(ev, func) {
      func = func || function() { console.warn("Warning -- you forgot to implement a handler"); };
      if ( !func(ev) ) {
        OSjs.GUI.blurMenu();
      }
    };

    var _createMenu = function(list) {
      var el          = document.createElement('div');
      el.className    = 'Menu';
      el.oncontextmenu= function(ev) {
        ev.preventDefault();
        return false;
      };
      el.onmousedown  = function(ev) {
        ev.preventDefault();
        return false;
      };

      if ( list ) {
        var ul = document.createElement('ul');
        var m, img, span, arrow, sub;
        for ( var i = 0, l = list.length; i < l; i++ ) {
          m           = document.createElement('li');
          m.className = '';

          if ( !list[i].name ) {
            list[i].name = (list[i].title || '').replace(/\s/, '_');
          }

          if ( list[i].name ) {
            m.className = 'MenuItem_' + list[i].name;
          }

          if ( typeof list[i].onCreate === 'function' ) {
            list[i].onCreate(m, list[i]);
          } else {
            if ( list[i].tooltip ) {
              m.title = list[i].tooltip;
            }
            if ( list[i].icon ) {
              img     = document.createElement('img');
              img.alt = '';
              img.src = OSjs.API.getThemeResource(list[i].icon, 'icon');
              m.appendChild(img);
            }

            span            = document.createElement('span');
            span.appendChild(document.createTextNode(list[i].title));
            m.appendChild(span);

            if ( list[i].disabled ) {
              m.className += ' Disabled';
            }
          }

          if ( list[i].menu ) {
            m.className += ' HasSubMenu';

            arrow           = document.createElement('div');
            arrow.className = 'Arrow';

            sub = _createMenu(list[i].menu);
            m.appendChild(sub);
            m.appendChild(arrow);

            m.onmouseover = (function(s) {
              return function(ev) {
                var elem = this;
                setTimeout(function() {
                  self.show(elem, s);
                }, 0);
              };
            })(sub);
          } else {
            m.onclick = (function(ref) {
              return function(ev) {
                if ( this.className.match(/Disabled/) ) { return; }
                if ( this.getAttribute("disabled") == "disabled" ) { return; }

                _onclick(ev, ref.onClick);
              };
            })(list[i]);
          }

          ul.appendChild(m);
        }

        el.appendChild(ul);
      }

      return el;
    };

    this.$element = _createMenu(menuList);
  };

  Menu.prototype.destroy = function() {
    if ( this.$element ) {
      var ul = this.$element.getElementsByTagName('UL')[0];
      if ( ul ) {
        var i = 0, l = ul.childNodes.length;
        for ( i; i < l; i++ ) {
          ul.childNodes[i].onclick = null;
          ul.childNodes[i].onmousedown = null;
        }
      }
      if ( this.$element.parentNode ) {
        this.$element.parentNode.removeChild(this.$element);
      }
    }
    this.$element = null;
  };

  Menu.prototype.show = function(pos, submenu) {
    var tw, th, px, py;
    if ( submenu ) {
      var off = OSjs.Utils.$position(submenu);
      if ( off.bottom > window.innerHeight ) {
        submenu.style.top = (window.innerHeight-off.bottom) + 'px';
      }
      if ( off.right > window.innerWidth ) {
        submenu.style.left = (window.innerWidth-off.right) + 'px';
      }
      return;
    }

    this.$element.style.top = -10000 + 'px';
    this.$element.style.left = -10000 + 'px';
    document.body.appendChild(this.$element);

    tw = pos.x + this.$element.offsetWidth;
    th = pos.y + this.$element.offsetHeight;
    px = pos.x;
    py = pos.y;

    if ( tw > window.innerWidth ) {
      px = window.innerWidth - this.$element.offsetWidth;
    }
    this.$element.style.left = px + 'px';

    if ( th > window.innerHeight ) {
      py = window.innerHeight - this.$element.offsetHeight;
    }
    this.$element.style.top = py + 'px';
  };

  Menu.prototype.getRoot = function() {
    return this.$element;
  };

  Menu.prototype.setItemDisabled = function(name, d) {
    var root = this.getRoot();
    var el = root.getElementsByClassName("MenuItem_" + name);
    el = (el && el.length) ? el[0] : null;
    if ( el ) {
      if ( d ) {
        OSjs.Utils.$addClass(el, 'Disabled');
      } else {
        OSjs.Utils.$removeClass(el, 'Disabled');
      }
      return true;
    }
    return false;
  };

  /**
   * MenuBar Class
   *
   * options: (See GUIElement for more)
   *  onMenuOpen    Function      Callback - When menu is opened
   */
  var MenuBar = function(name, opts) {
    opts = opts || {};

    this.$ul        = null;
    this.onMenuOpen = opts.onMenuOpen || function() {};
    this.lid        = 0;
    this.items      = [];

    GUIElement.apply(this, [name, {}]);
  };
  MenuBar.prototype = Object.create(GUIElement.prototype);

  MenuBar.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIMenuBar']);
    this.$ul = document.createElement('ul');
    el.appendChild(this.$ul);
    el.onmousedown = function(ev) {
      ev.preventDefault();
      return false;
    };
    el.oncontextmenu = function(ev) {
      return false;
    };
    return el;
  };

  MenuBar.prototype.addItem = function(item, menu, pos) {
    if ( !this.$ul ) { return; }
    var self = this;
    var nitem = {name: '', title: '', disabled: false, element: null};

    if ( typeof item === 'string' ) {
      nitem.title = item;
      nitem.name = item;
    } else {
      nitem.title = item.title || '<undefined>';
      nitem.name = item.name  || nitem.title;
      nitem.disabled = item.disabled === true;
    }

    var el = document.createElement('li');
    el.className = 'MenuItem_' + this.lid;
    el.appendChild(document.createTextNode(nitem.title));
    if ( nitem.disabled ) {
      el.setAttribute('disabled', 'disabled');
    }
    el.onclick = function(ev, mpos) {
      if ( this.hasAttribute('disabled') || this.className.match(/disabled/g) ) {
        return;
      }

      var pos = {x: ev.clientX, y: ev.clientY};
      if ( !mpos ) {
        var tpos = OSjs.Utils.$position(this);
        if ( tpos ) {
          pos.x = tpos.left;
          //pos.y = tpos.top + (el.offsetHeight || 0);
          pos.y = tpos.top;
        }
      }
      var elm = null;
      if ( menu && menu.length ) {
        elm = OSjs.GUI.createMenu(menu, pos);
      }
      self.onMenuOpen.call(self, elm, pos, (typeof item === 'string' ? item : nitem), self);
    };

    nitem.element = el;

    this.$ul.appendChild(el);
    this.lid++;
    this.items.push(nitem);
  };

  MenuBar.prototype.createContextMenu = function(ev, idx) {
    this.$ul.childNodes[idx].onclick(ev, true);
  };

  MenuBar.prototype.getItem = function(name) {
    for ( var i = 0; i < this.items.length; i++ ) {
      if ( this.items[i].name == name ) {
        return this.items[i];
      }
    }
    return null;
  };

  /**
   * List View Class
   *
   * column data example:
   * [
   *   {key: 'mykey', title: 'Title'},
   *   {key: 'id', visible: false}
   * ]
   * row data example:
   * [
   *  {mykey: 'Some title', id: 1},
   *  {mykey: 'Some title', id: 2}
   * ]
   *
   * options: (See _DataView for more)
   *  columns           Object          Columns
   *  rows              Array           Rows (data alias)
   *  singleClick       bool            Single click to Activate (dblclick)
   */
  var ListView = function(name, opts) {
    opts = opts || {};

    if ( opts.rows ) {
      opts.data = opts.rows;
      delete opts.rows;
    }


    this.singleClick      = typeof opts.singleClick === 'undefined' ? false : (opts.singleClick === true);
    this.columns          = opts.columns || [];
    this.$head            = null;
    this.$headTop         = null;
    this.$body            = null;
    this.$table           = null;
    this.$tableTop        = null;
    this.$scroll          = null;
    this.lastSelectedDOM  = null;
    this.onCreateItem     = opts.onCreateItem   || function(el, iter, col) {};

    _DataView.apply(this, arguments);
  };

  ListView.prototype = Object.create(_DataView.prototype);

  ListView.prototype.init = function() {
    var el = _DataView.prototype.init.apply(this, ['GUIListView', false]);

    var startW = 0;
    var startX = 0;
    var column = null;
    var self = this;

    var onResizeMove = function(ev) {
      var newW = startW + (ev.clientX - startX);
      if ( column >= 0 && newW >= 16 ) {
        self.$headTop.rows[0].childNodes[column].width = newW;
        self.$body.rows[0].childNodes[column].width = newW;
      }
    };

    var onResizeEnd = function(ev) {
      document.removeEventListener('mouseup',   onResizeEnd,  false);
      document.removeEventListener('mousemove', onResizeMove, false);
    };

    var onResizeStart = function(ev, col) {
      startX = ev.clientX;
      startW = col.offsetWidth;
      column = col.parentNode.getAttribute("data-index");

      document.addEventListener('mouseup',    onResizeEnd,  false);
      document.addEventListener('mousemove',  onResizeMove, false);
    };

    var onHeaderAction = function(ev, type) {
      ev.preventDefault();
      var t = ev.target;
      if ( t.tagName === 'DIV' ) {
        if ( type === 'mousedown' && t.className === 'Resizer' ) {
          onResizeStart(ev, t.parentNode);
        } else if ( type === 'click' && t.className === 'Label' ) {
          var col = t.parentNode.className.replace('Column_', '');
          self._onColumnClick(ev, col);
        }
        return false;
      }
      return true;
    };

    var table = document.createElement('table');
    table.className = 'Body';

    var head = document.createElement('thead');
    var body = document.createElement('tbody');

    var tableTop        = document.createElement('table');
    var headTop         = document.createElement('thead');
    tableTop.className  = 'Header';

    this.$scroll            = document.createElement('div');
    this.$scroll.className  = 'Scroll';
    this.$scroll.appendChild(table);

    this._addEventListener(tableTop, 'mousedown', function(ev) {
      return onHeaderAction(ev, 'mousedown');
    });
    this._addEventListener(tableTop, 'click', function(ev) {
      return onHeaderAction(ev, 'click');
    });
    this._addEventListener(this.$scroll, 'scroll', function(ev) {
      tableTop.style.left = -this.scrollLeft + 'px';
    });

    table.appendChild(head);
    table.appendChild(body);
    tableTop.appendChild(headTop);
    el.appendChild(tableTop);
    el.appendChild(this.$scroll);

    this.$head      = head;
    this.$headTop   = headTop;
    this.$body      = body;
    this.$table     = table;
    this.$tableTop  = tableTop;
    this.$view      = this.$scroll; // NOTE: Shorthand
  };

  ListView.prototype._render = function(list, columns) {
    var self = this;
    var i, l, ii, ll, row, col, colref, iter, val, type, tmp, d, span, label, resizer;

    // Columns (header)
    row = document.createElement('tr');
    for ( i = 0, l = columns.length; i < l; i++ ) {
      colref = columns[i];
      if ( typeof colref.visible !== 'undefined' && colref.visible === false ) { continue; }

      col           = document.createElement('td');
      col.className = 'Column_' + colref.key;
      col.setAttribute("data-index", i);

      label           = document.createElement('div');
      label.className = 'Label';
      label.appendChild(document.createTextNode(colref.title));

      if ( typeof colref.resizable === 'undefined' || colref.resizable === true ) {
        if ( i < (l-i) ) {
          resizer           = document.createElement('div');
          resizer.className = 'Resizer';
          label.appendChild(resizer);
        }
      }
      col.appendChild(label);

      if ( colref.domProperties ) {
        for ( d in colref.domProperties ) {
          if ( colref.domProperties.hasOwnProperty(d) ) {
            col.setAttribute(d, colref.domProperties[d]);
          }
        }
      }
      row.appendChild(col);
    }
    this.$head.appendChild(row);
    this.$headTop.appendChild(row);

    // Rows (data)
    for ( i = 0, l = list.length; i < l; i++ ) {
      row = document.createElement('tr');
      iter = list[i];

      for ( ii = 0, ll = columns.length; ii < ll; ii++ ) {
        span = null;

        colref = columns[ii];
        row.setAttribute('data-' + colref.key, iter[colref.key]);

        if ( (typeof colref.visible !== 'undefined' && colref.visible === false) ) { continue; }
        type = (typeof colref.type === 'undefined') ? 'text' : colref.type;
        col = document.createElement('td');
        col.className = 'Column_' + colref.key;

        if ( colref.callback ) {
          val = colref.callback(iter);
        } else {
          val = iter[colref.key];
        }

        if ( colref.domProperties ) {
          for ( d in colref.domProperties ) {
            if ( colref.domProperties.hasOwnProperty(d) ) {
              col.setAttribute(d, colref.domProperties[d]);
            }
          }
        }

        if ( type === 'image' ) {
          tmp = document.createElement('img');
          //tmp.ondragstart = function() { return false; };
          tmp.alt = '';
          tmp.src = val;
          col.appendChild(tmp);
          row.removeAttribute('data-' + colref.key);
        } else if ( type === 'button' ) {
          tmp = document.createElement('button');
          tmp.appendChild(document.createTextNode(val || ''));
          tmp.onclick = iter.customEvent;
          col.appendChild(tmp);
          row.removeAttribute('data-' + colref.key);
        } else {
          span = document.createElement('span');
          span.appendChild(document.createTextNode(val || ''));
          col.appendChild(span);
        }

        // FIXME: ListView - Use local event listener adding

        row.oncontextmenu = (function(it) {
          return function(ev) {
            ev.stopPropagation(); // Or else eventual ContextMenu is blurred
            ev.preventDefault();

            self._onContextMenu(ev, it);
          };
        })(this.data[i]);

        if ( this.singleClick ) {
          row.onclick = (function(it) {
            return function(ev) {
              self._onSelect(ev, it);
              self._onActivate(ev, it);
            };
          })(this.data[i]);
        } else {
          row.onclick = (function(it) {
            return function(ev) {
              self._onSelect(ev, it);
            };
          })(this.data[i]);

          row.ondblclick = (function(it) {
            return function(ev) {
              self._onActivate(ev, it);
            };
          })(this.data[i]);
        }


        row.appendChild(col);
      }
      this.$body.appendChild(row);

      this.onCreateItem(row, iter, colref);

      this.data[i]._index   = i;
      this.data[i]._element = row;
    }
  };

  ListView.prototype.render = function(data, reset) {
    if ( !_DataView.prototype.render.apply(this, arguments) ) {
      return;
    }

    this._render(this.data, this.columns);
  };

  ListView.prototype.onKeyPress = function(ev) {
    if ( this.destroyed ) { return false; }
    if ( !GUIElement.prototype.onKeyPress.apply(this, arguments) ) { return false; }

    ev.preventDefault();
    if ( this.selected ) {

      var idx  = this.selected._index;
      var tidx = idx;
      var len  = this.data.length;

      if ( idx >= 0 && idx < len  ) {
        if ( ev.keyCode === OSjs.Utils.Keys.UP ) {
          idx--;
        } else if ( ev.keyCode === OSjs.Utils.Keys.DOWN ) {
          idx++;
        } else if ( ev.keyCode === OSjs.Utils.Keys.ENTER ) {
          this._onActivate(ev, this.data[idx]);
          return true;
        }

        if ( idx != tidx ) {
          this.setSelectedIndex(idx);
        }
      }
    }
    return true;
  };

  ListView.prototype._onRender = function() {
    OSjs.Utils.$empty(this.$head);
    OSjs.Utils.$empty(this.$body);
    OSjs.Utils.$empty(this.$headTop);
  };

  ListView.prototype._onColumnClick = function(ev, col) {
  };

  ListView.prototype.addColumn = function(c) {
    this.columns.push(c);
  };

  ListView.prototype.addRow = function(r) {
    this.rows.push(r);
  };

  ListView.prototype.setColumns = function(cols) {
    this.columns = cols || [];
  };

  ListView.prototype.setRows = function(rows, render) {
    this.setData.apply(this, arguments);
  };

  /**
   * Textarea
   *
   * options: (See _Input for more)
   */
  var Textarea = function(name, opts) {
    opts = opts || {};
    opts.focusable = true;

    this.$area = null;
    this.strLen = 0;

    _Input.apply(this, ['GUITextarea', 'textarea', name, opts]);
  };

  Textarea.prototype = Object.create(_Input.prototype);

  Textarea.prototype.init = function() {
    var self = this;
    var el = _Input.prototype.init.apply(this, ['GUITextarea']);

    this._addEvent(this.$input, 'onkeypress', function(ev) {
      var cur = this.value.length;
      self.hasChanged = (cur != self.strLen);
    });

    return el;
  };

  Textarea.prototype.setValue = function(t) {
    return this.setText(t);
  };

  Textarea.prototype.setText = function(t) {
    this.hasChanged = false;
    if ( this.$input ) {
      this.$input.value = (t || '');
      this.strLen = this.$input.value.length;
      return true;
    }
    return false;
  };

  Textarea.prototype.getValue = function() {
    return this.getText();
  };

  Textarea.prototype.getText = function() {
    return this.$input ? this.$input.value : '';
  };

  Textarea.prototype.focus = function() {
    if ( !GUIElement.prototype.focus.apply(this, arguments) ) { return false; }
    if ( this.$input ) { this.$input.focus(); }
    return true;
  };

  Textarea.prototype.blur = function() {
    if ( !GUIElement.prototype.blur.apply(this, arguments) ) { return false; }
    if ( this.$input ) { this.$input.blur(); }
    return true;
  };

  /**
   * Color Swatch
   */
  var ColorSwatch = function(name, w, h, onSelect) {
    this.$element = null;
    this.$canvas  = null;
    this.width    = w || 100;
    this.height   = h || 100;
    this.onSelect = onSelect || function(r, g, b) {};

    if ( !OSjs.Compability.canvas ) {
      throw "Canvas is not supported on your platform!";
    }

    GUIElement.apply(this, [name, {}]);
  };

  ColorSwatch.prototype = Object.create(GUIElement.prototype);

  ColorSwatch.prototype.init = function() {
    var el        = GUIElement.prototype.init.apply(this, ['GUIColorSwatch']);

    var cv        = document.createElement('canvas');
    cv.width      = this.width;
    cv.height     = this.height;

    var ctx       = cv.getContext('2d');
    var gradient  = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);

    // Create color gradient
    gradient.addColorStop(0,    "rgb(255,   0,   0)");
    gradient.addColorStop(0.15, "rgb(255,   0, 255)");
    gradient.addColorStop(0.33, "rgb(0,     0, 255)");
    gradient.addColorStop(0.49, "rgb(0,   255, 255)");
    gradient.addColorStop(0.67, "rgb(0,   255,   0)");
    gradient.addColorStop(0.84, "rgb(255, 255,   0)");
    gradient.addColorStop(1,    "rgb(255,   0,   0)");

    // Apply gradient to canvas
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Create semi transparent gradient (white -> trans. -> black)
    gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0,   "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.5, "rgba(0,     0,   0, 0)");
    gradient.addColorStop(1,   "rgba(0,     0,   0, 1)");

    // Apply gradient to canvas
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var self = this;
    cv.addEventListener('click', function(e) {
      var pos = OSjs.Utils.$position(cv);
      var cx = typeof e.offsetX === 'undefined' ? (e.clientX - pos.left) : e.offsetX;
      var cy = typeof e.offsetY === 'undefined' ? (e.clientY - pos.top) : e.offsetY;
      var data = ctx.getImageData(cx, cy, 1, 1).data;
      self.onSelect.call(self, data[0], data[1], data[2]);
    }, false);

    el.appendChild(cv);
    this.$element = el;
    this.$canvas = cv;

    return el;
  };

  /**
   * Status Bar Element
   *
   * options: (See GUIElement for more)
   *  value   String      Initial value
   */
  var StatusBar = function(name) {
    this.$contents = null;
    GUIElement.apply(this, [name]);
  };

  StatusBar.prototype = Object.create(GUIElement.prototype);

  StatusBar.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIStatusBar']);
    this.$contents = document.createElement('div');
    this.$contents.className = "Contents";
    el.appendChild(this.$contents);

    if ( this.opts.value ) {
      this.setText(value);
    }

    return el;
  };

  StatusBar.prototype.setText = function(t) {
    this.$contents.innerHTML = t;
  };

  StatusBar.prototype.appendChild = function(el) {
    this.$contents.appendChild(el);
  };

  /**
   * Slider Element
   *
   * options: (See GUIElement for more)
   *  min             int           Minimum value
   *  max             int           Maximim value
   *  val             int           Current value
   *  orientation     String        Orientation (Default = horizontal)
   *  steps           int           Stepping value (Default = 1)
   *  onChange        Function      Callback - When value has changed (on drag)
   *  onUpdate        Function      Callback - When value is updated (finished)
   */
  var Slider = function(name, opts) {
    this.min      = opts.min          || 0;
    this.max      = opts.max          || 0;
    this.val      = opts.val          || 0;
    this.type     = opts.orientation  || 'horizontal';
    this.steps    = opts.steps        || 1;
    this.onChange = opts.onChange     || function() {};
    this.$root    = null;
    this.$button  = null;

    var self = this;
    this.onUpdate = function(val, perc) {
      (opts.onUpdate || function(val, perc) {
        console.warn("GUIScroll onUpdate() missing...", val, '('+perc+'%)');
      }).apply(self, arguments);
      self.onChange.apply(this, arguments);
    };

    GUIElement.apply(this, [name, {}]);
  };

  Slider.prototype = Object.create(GUIElement.prototype);

  Slider.prototype.init = function() {
    var el        = GUIElement.prototype.init.apply(this, ['GUISlider']);
    el.className += ' ' + this.type;

    this.$root            = document.createElement('div');
    this.$root.className  = 'Root';

    this.$button            = document.createElement('div');
    this.$button.className  = 'Button';

    var scrolling = false;
    var startX    = 0;
    var startY    = 0;
    var elX       = 0;
    var elY       = 0;
    var maxX      = 0;
    var maxY      = 0;
    var snapping  = 0;
    var self      = this;

    var _onMouseMove = function(ev) {
      if ( !scrolling ) { return; }

      var newX, newY;
      if ( self.type == 'horizontal' ) {
        var diffX = (ev.clientX - startX);
        newX = elX + diffX;
        newX = snapping * Math.round(newX / snapping);

        if ( newX < 0 ) { newX = 0; }
        if ( newX > maxX ) { newX = maxX; }
        self.$button.style.left = newX + 'px';
      } else {
        var diffY = (ev.clientY - startY);
        newY = elY + diffY;
        newY = snapping * Math.round(newY / snapping);

        if ( newY < 0 ) { newY = 0; }
        if ( newY > maxY ) { newY = maxY; }
        self.$button.style.top = newY + 'px';
      }

      self.onSliderUpdate(newX, newY, maxX, maxY, 'mousemove');
    };

    var _onMouseUp = function(ev) {
      scrolling = false;
      document.removeEventListener('mousemove', _onMouseMove, false);
      document.removeEventListener('mouseup', _onMouseUp, false);

      var p = (self.max / 100) * self.val; //self.val) * 100;
      self.onChange.call(self, self.val, p, 'mouseup');
    };

    var _onMouseDown = function(ev) {
      ev.preventDefault();

      scrolling = true;
      if ( self.type == 'horizontal' ) {
        startX    = ev.clientX;
        elX       = self.$button.offsetLeft;
        maxX      = self.$element.offsetWidth - self.$button.offsetWidth;
        snapping  = (self.$element.offsetWidth / ((self.max - self.min) / self.steps));
      } else {
        startY    = ev.clientY;
        elY       = self.$button.offsetTop;
        maxY      = self.$element.offsetHeight - self.$button.offsetHeight;
        snapping  = (self.$element.offsetHeight / ((self.max - self.min) / self.steps));
      }

      document.addEventListener('mousemove', _onMouseMove, false);
      document.addEventListener('mouseup', _onMouseUp, false);
    };

    this._addEventListener(this.$button, 'mousedown', function(ev) {
      return _onMouseDown(ev);
    });

    this._addEventListener(el, 'click', function(ev) {
      if ( ev.target && ev.target.className === 'Button' ) { return; }

      var p  = OSjs.Utils.$position(el);
      var cx = ev.clientX - p.left;
      var cy = ev.clientY - p.top;

      self.onSliderClick(ev, cx, cy, (self.$element.offsetWidth - (self.$button.offsetWidth/2)), (self.$element.offsetHeight - (self.$button.offsetHeight/2)));
    });

    el.appendChild(this.$root);
    el.appendChild(this.$button);

    return el;
  };

  Slider.prototype.update = function() {
    GUIElement.prototype.update.apply(this, arguments);
    this.setValue(this.val);
  };

  Slider.prototype.setPercentage = function(p, evt) {
    p = p << 0;

    var cd  = (this.max - this.min);
    var val = (cd*(p/100)) << 0;
    this.val = val;
    this.onUpdate.call(this, val, p, evt);
  };

  Slider.prototype.onSliderClick = function(ev, cx, cy, tw, th) {
    var cd = (this.max - this.min);
    var tmp;

    if ( this.type == 'horizontal' ) {
      tmp = (cx/tw)*100;
    } else {
      tmp = (cy/th)*100;
    }

    var val = (cd*(tmp/100)) << 0;
    this.setValue(val);
    this.setPercentage(tmp, 'click');
  };

  Slider.prototype.onSliderUpdate = function(x, y, maxX, maxY, evt) {
    var p = null;
    if ( typeof x !== 'undefined' ) {
      p = (x/maxX) * 100;
    } else if ( typeof y !== 'undefined' ) {
      p = (y/maxY) * 100;
    }
    if ( p !== null ) {
      this.setPercentage(p, evt);
    }
  };

  Slider.prototype.setValue = function(val) {
    if ( !this.inited ) { return; }

    if ( val < this.min || val > this.max ) { return; }
    this.val = val;

    var cd = (this.max - this.min);
    var cp = this.val / (cd/100);

    if ( this.type == 'horizontal' ) {
      var rw    = this.$element.offsetWidth;
      var bw    = this.$button.offsetWidth;
      var dw    = (rw - bw);
      var left  = (dw/100)*cp;

      this.$button.style.left = left + 'px';
    } else {
      var rh    = this.$element.offsetHeight;
      var bh    = this.$button.offsetHeight;
      var dh    = (rh - bh);
      var top   = (dh/100)*cp;

      this.$button.style.top = top + 'px';
    }
  };

  Slider.prototype.getValue = function() {
    return this.val;
  };

  /**
   * Toolbar Element
   *
   * options: (See GUIElement for more)
   *  orientation     String        Orientation (Default = horizontal)
   */
  var ToolBar = function(name, opts) {
    opts = opts || {};

    this.$container = null;
    this.$active    = null;

    this.items        = {};
    this.orientation  = opts.orientation || 'horizontal';

    GUIElement.apply(this, [name, {}]);
  };

  ToolBar.prototype = Object.create(GUIElement.prototype);

  ToolBar.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIToolbar']);
    this.$container = document.createElement('ul');
    this.$container.className = 'Container';
    el.className += ' ' + this.orientation;
    el.appendChild(this.$container);
    return el;
  };

  ToolBar.prototype.addItem = function(name, opts) {
    this.items[name] = opts;
  };

  ToolBar.prototype.addSeparator = (function() {
    var _sid = 1;
    return function() {
      this.items['separator_' + _sid] = null;
      _sid++;
    };
  })();

  ToolBar.prototype.render = function() {
    if ( !this.$container ) { return; }

    var el, btn, img, span, item;
    var self = this;
    for ( var i in this.items ) {
      if ( this.items.hasOwnProperty(i) ) {
        item = this.items[i] || null;
        el = document.createElement('li');

        if ( !item ) {
          el.className = 'Separator ' + i;
          this.$container.appendChild(el);
          continue;
        }

        el.className = 'Item ' + i;
        switch ( item.type ) {
          case 'custom' :
            btn = document.createElement('div');
          break;

          default :
            btn = document.createElement('button');
          break;
        }

        if ( typeof item.onCreate === 'function' ) {
          item.onCreate.call(this, i, item, el, btn);
        } else {
          if ( item.icon ) {
            img = document.createElement('img');
            img.alt = ''; //item.icon;
            img.src = item.icon;
            btn.appendChild(img);
            el.className += ' HasIcon';
          }
          if ( item.title ) {
            span = document.createElement('span');
            span.appendChild(document.createTextNode(item.title));
            btn.appendChild(span);
            el.className += ' HasTitle';
          }
        }

        if ( item.tooltip && !btn.title ) {
          btn.title = item.tooltip;
        }

        btn.onclick = (function(key, itm) {
          return function(ev) {
            if ( itm.grouped ) {
              OSjs.Utils.$removeClass(self.$active, 'Active');
              self.$active = this;
              OSjs.Utils.$addClass(self.$active, 'Active');
            }

            self._onItemSelect(ev, this, key, itm);
          };
        })(i, item);

        el.appendChild(btn);
        this.$container.appendChild(el);
      }
    }
  };

  ToolBar.prototype._onItemSelect = function(ev, el, name, item) {
    if ( item && item.onClick ) {
      item.onClick(ev, el, name, item);
    }
  };

  ToolBar.prototype.getItem = function(name) {
    if ( this.$container ) {
      var children = this.$container.childNodes;
      for ( var i = 0, l = children.length; i < l; i++ ) {
        if ( (new RegExp(name)).test(children[i].className) ) {
          return children[i];
        }
      }
    }
    return null;
  };

  /**
   * ProgressBar Element
   *
   * options: (See GUIElement for more)
   */
  var ProgressBar = function(name, percentage) {
    this.$container = null;
    this.$bar       = null;
    this.$label     = null;
    this.percentage = percentage || 0;

    GUIElement.apply(this, [name, {}]);
  };

  ProgressBar.prototype = Object.create(GUIElement.prototype);

  ProgressBar.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIProgressBar']);

    this.$container           = document.createElement('div');
    this.$container.className = 'Container';

    this.$bar           = document.createElement('div');
    this.$bar.className = 'Bar';
    this.$container.appendChild(this.$bar);

    this.$label           = document.createElement('div');
    this.$label.className = 'Label';
    this.$container.appendChild(this.$label);

    el.appendChild(this.$container);

    this.setPercentage(this.percentage);
    return el;
  };

  ProgressBar.prototype.setPercentage = function(p) {
    if ( p < 0 || p > 100 ) { return; }
    this.percentage       = (p << 0);
    this.$bar.style.width = this.percentage + '%';
    this.$label.innerHTML = this.percentage + '%';
  };

  ProgressBar.prototype.setProgress = function(p) {
    this.setPercentage(p);
  };

  /**
   * Canvas Element
   *
   * options: (See GUIElement for more)
   *  width   int       Canvas width
   *  height  int       Canvas height
   *  type    String    Image type (Default = image/png)
   */
  var Canvas = function(name, opts) {
    opts = opts || {};
    if ( !OSjs.Compability.canvas ) {
      throw "Your platform does not support canvas :/";
    }

    this.$canvas    = null;
    this.$context   = null;
    this.width      = opts.width  || null;
    this.height     = opts.height || null;
    this.type       = opts.type   || 'image/png';

    GUIElement.apply(this, [name, {}]);
  };

  Canvas.prototype = Object.create(GUIElement.prototype);

  Canvas.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUICanvas']);

    this.$canvas = document.createElement('canvas');
    if ( this.width !== null ) {
      this.$canvas.width = this.width;
      this.$element.style.width = this.width + 'px';
    }
    if ( this.height !== null ) {
      this.$canvas.height = this.height;
      this.$element.style.height = this.height + 'px';
    }
    this.$context = this.$canvas.getContext('2d');

    el.appendChild(this.$canvas);
    return el;
  };

  Canvas.prototype.clear = function() {
    if ( this.$context ) {
      this.$context.clearRect(0, 0, this.width, this.height);
      return true;
    }
    return false;
  };

  Canvas.prototype.fillColor = function(color) {
    this.$context.fillStyle = color;
    this.$context.fillRect(0, 0, this.width, this.height);
  };

  Canvas.prototype.resize = function(w, h) {
    this.width  = w;
    this.height = h;

    this.$canvas.width  = w;
    this.$canvas.height = h;

    this.$element.style.width   = w + 'px';
    this.$element.style.height  = h + 'px';
  };

  Canvas.prototype.func = function(f, args) {
    if ( !f || !args ) {
      throw "Canvas::func() expects a function name and arguments";
    }
    if ( this.$canvas && this.$context ) {
      return this.$context[f].apply(this.$context, args);
    }
    return null;
  };

  Canvas.prototype.setImageData = function(src, onDone, onError) {
    if ( !this.$context ) { return; }

    onDone = onDone || function() {};
    onError = onError || function() {};
    var self  = this;
    var img   = new Image();
    var can   = this.$canvas;
    var ctx   = this.$context;
    var mime  = null;

    try {
      mime = src.split(/;/)[0].replace(/^data\:/, '');
    } catch ( e ) {
      throw "Cannot setImageData() invalid or no mime";
      //return;
    }

    this.type = mime;

    img.onload = function() {
      self.resize(this.width, this.height);
      ctx.drawImage(img, 0, 0);
      onDone.apply(self, arguments);
    };
    img.onerror = function() {
      onError.apply(self, arguments);
    };
    img.src = src;
  };

  Canvas.prototype.getCanvas = function() {
    return this.$canvas;
  };

  Canvas.prototype.getContext = function() {
    return this.$context;
  };

  Canvas.prototype.getColorAt = function(x, y) {
    var imageData = this.$context.getImageData(0, 0, this.$canvas.width, this.$canvas.height).data;
    var index = ((x + y * this.$canvas.width) * 4);

    var rgb = {r:imageData[index + 0], g:imageData[index + 1], b:imageData[index + 2], a:imageData[index + 3]};
    var hex = OSjs.Utils.RGBtoHEX(rgb);
    return {rgb: rgb, hex:  hex};
  };

  Canvas.prototype.getImageData = function(type) {
    if ( this.$context && this.$canvas ) {
      type = type || this.type;
      return this.$canvas.toDataURL(type);
    }
    return null;
  };

  /**
   * Icon View Element
   *
   * TODO: IconView - onKeyPress
   * FIXME: IconView - Unselect by click in background
   *
   * reserved item (data) keys:
   *  label = What to show as title
   *  icon = Path to icon
   *
   * options: (See _DataView for more)
   *  iconSize      String        Icon Size (default = 32x32)
   */
  var IconView = function(name, opts) {
    opts = opts || {};

    this.$ul          = null;
    this.iconSize     = opts.size || '32x32';

    _DataView.apply(this, [name, opts]);
  };

  IconView.prototype = Object.create(_DataView.prototype);

  IconView.prototype.init = function() {
    var self      = this;
    var el        = _DataView.prototype.init.apply(this, ['GUIIconView']);
    var view      = this.$view;
    el.className += ' IconSize' + this.iconSize;

    this.$ul    = document.createElement('ul');
    this._addEvent(view, 'onclick', function(ev) {
      var t = ev.target || ev.srcElement;
      if ( t && t == view ) {
        self.setSelected(null, null);
      }
    });

    view.appendChild(this.$ul);

    el.appendChild(view);

    return el;
  };

  IconView.prototype._onRender = function() {
    OSjs.Utils.$empty(this.$ul);
  };

  IconView.prototype._render = function() {
    var _createImage = function(i) {
      return OSjs.API.getThemeResource(i, 'icon');
    };

    var i, l, iter, li, imgContainer, img, lblContainer, lbl;
    var k, j;
    var self = this;
    for ( i = 0, l = this.data.length; i < l; i++ ) {
      iter = this.data[i];
      imgContainer = null;

      li = document.createElement('li');
      li.setAttribute("data-index", i);

      for ( var k in iter ) {
        if ( iter.hasOwnProperty(k) ) {
          if ( !OSjs.Utils.inArray(['title', 'icon'], k) ) {
            li.setAttribute('data-' + k, iter[k]);
          }
        }
      }

      if ( iter.icon ) {
        imgContainer = document.createElement('div');
        img = document.createElement('img');
        img.alt = ''; //iter.label || '';
        img.title = ''; //iter.label || '';
        img.src = _createImage(iter.icon);
        imgContainer.appendChild(img);
      }

      lblContainer = document.createElement('div');
      lbl = document.createElement('span');
      lbl.appendChild(document.createTextNode(iter.label));
      lblContainer.appendChild(lbl);

      // FIXME: IconView - Use local event listener adding
      li.oncontextmenu = (function(it) {
        return function(ev) {
          ev.stopPropagation(); // Or else eventual ContextMenu is blurred
          ev.preventDefault();

          self._onContextMenu(ev, it);
        };
      })(iter);

      li.onclick = (function(it) {
        return function(ev) {
          self._onSelect(ev, it);
        };
      })(iter);

      li.ondblclick = (function(it) {
        return function(ev) {
          self._onActivate(ev, it);
        };
      })(iter);

      if ( imgContainer ) {
        li.appendChild(imgContainer);
      }
      li.appendChild(lblContainer);

      this.$ul.appendChild(li);

      this.onCreateItem(li, iter);

      this.data[i]._element = li;
    }
  };

  IconView.prototype.render = function(data, reset) {
    if ( !_DataView.prototype.render.call(this, data, reset) ) {
      return;
    }
    this._render();
  };

  /**
   * Tree View
   *
   * TODO: TreeView - onKeyPress
   *
   * reserved item (data) keys:
   *  title = What to show as title
   *  icon = Path to icon
   *
   * options: (See _DataView for more)
   *  onExpand          Function        Callback - When item has been expanded
   *  onCollapse        Function        Callback - When item has been collapsed
   *  data              Array           Data (Items)
   *  expanded          Mixed           What level to expand on render (Default = false (none), true = (1), int for level)
   */
  var TreeView = function(name, opts) {
    opts = opts || {};

    var expand = false;
    if ( opts.expanded === true ) {
      expand = 0;
    } else if ( opts.expanded >= 0 ) {
      expand = opts.expand;
    }

    this.total          = 0;
    this.expandLevel    = expand;
    this.onExpand       = opts.onExpand       || function(ev, el, item) {};
    this.onCollapse     = opts.onCollapse     || function(ev, el, item) {};

    _DataView.apply(this, [name, opts]);
  };

  TreeView.prototype = Object.create(_DataView.prototype);

  TreeView.prototype.init = function() {
    var root = _DataView.prototype.init.call(this, 'GUITreeView');
    return root;
  };

  TreeView.prototype._render = function(list, root, expandLevel, ul) {
    var self = this;

    var _render = function(list, root, ul, level) {
      if ( typeof level === 'undefined' ) {
        level = false;
      }

      if ( !ul ) {
        ul = document.createElement('ul');
        ul.className = 'Level_' + (level || 0);
      }

      var li, iter, exp, ico, title, child, inner, j;
      for ( var i = 0; i < list.length; i++ ) {
        li = document.createElement('li');
        inner = document.createElement('div');

        iter           = list[i]    || {};
        iter.name      = iter.name  || 'treeviewitem_' + this.total;
        iter.title     = iter.title || iter.name;

        li.className = 'Item Level_' + (level || 0);
        li.setAttribute('data-index', i);

        for ( j in iter ) {
          if ( iter.hasOwnProperty(j) ) {
            if ( !OSjs.Utils.inArray(['items', 'title', 'icon'], j) ) {
              li.setAttribute('data-' + j, iter[j]);
            }
          }
        }
        iter._element  = li;

        if ( iter.items && iter.items.length ) {
          li.className += ' Expandable';
          exp = document.createElement('div');
          exp.className = 'Expander';
          exp.innerHTML = '';
          inner.appendChild(exp);
        } else {
          exp = null;
        }

        if ( iter.icon ) {
          ico = document.createElement('img');
          ico.src = iter.icon;
          ico.alt = '';
          inner.appendChild(ico);
        }

        title = document.createElement('span');
        title.appendChild(document.createTextNode(iter.title));
        inner.appendChild(title);

        // FIXME: TreeView - Use local event listener adding
        inner.oncontextmenu = (function(c, e) {
          return function(ev) {
            ev.stopPropagation(); // Or else eventual ContextMenu is blurred
            ev.preventDefault();

            if ( e ) {
              ev.stopPropagation();
            }
            self._onContextMenu(ev, c);
            return false;
          };
        })(iter, !exp);

        inner.onclick = (function(c, e) {
          return function(ev) {
            if ( e ) {
              ev.stopPropagation();
            }
            self._onSelect(ev, c);
          };
        })(iter, !exp);

        inner.ondblclick = (function(c, e) {
          return function(ev) {
            if ( e ) {
              ev.stopPropagation();
            }
            self._onActivate(ev, c);
          };
        })(iter, !exp);

        li.appendChild(inner);

        if ( exp ) {
          child = _render.call(self, iter.items, li, null, level + 1);
          if ( level !== false && this.expandLevel >= level ) {
            child.style.display = 'block';
          }
          exp.onclick = (function(c, el, it) {
            return function(ev) {
              var s = c.style.display;
              if ( s === 'none' || s === '' ) {
                c.style.display = 'block';
                OSjs.Utils.$addClass(el, 'Expanded');

                self._onExpand.call(self, ev, it);
              } else {
                c.style.display = 'none';
                OSjs.Utils.$removeClass(el, 'Expanded');

                self._onCollapse.call(self, ev, it);
              }
            };
          })(child, li, iter);
        }

        this.total++;
        ul.appendChild(li);

        if ( this.onCreateItem ) {
          this.onCreateItem(li, iter);
        }
      }

      root.appendChild(ul);

      return ul;
    };

    return _render.call(this, list, root, ul, expandLevel);
  };

  TreeView.prototype.render = function(data, reset) {
    if ( !_DataView.prototype.render.call(this, data, reset) ) {
      return;
    }
  };

  TreeView.prototype._onRender = function() {
    OSjs.Utils.$empty(this.$view);

    this._render(this.data, this.$view);
  };

  TreeView.prototype._onExpand = function(ev, item) {
    this.onExpand.apply(this, [ev, (item ? item._element : null), item]);
  };

  TreeView.prototype._onCollapse = function(ev, item) {
    this.onCollapse.apply(this, [ev, (item ? item._element : null), item]);
  };

  TreeView.prototype.setData = function(data, render) {
    this.total = 0;
    _DataView.prototype.setData.apply(this, arguments);
  };

  TreeView.prototype.getItemByKey = function(key, val) {
    var _search = function(list) {
      var ret = null;

      for ( var i in list ) {
        if ( list.hasOwnProperty(i) ) {
          if ( list[i][key] == val ) {
            return list[i];
          }

          if ( list[i].items ) {
            ret = _search(list[i].items);
            if ( ret ) {
              return ret;
            }
          }
        }
      }

      return null;
    };

    return _search.call(this, this.data);
  };


  /**
   * Richt Text Element
   *
   * options: (See GUIElement for more)
   *  fontName      String        Font name (default)
   *  onInited      Function      Callback - When initialized
   */
  var RichText = function(name, opts) {
    if ( !OSjs.Compability.richtext ) { throw "Your platform does not support RichText editing"; }

    this.$view          = null;
    this.opts           = opts || {};
    this.opts.fontName  = this.opts.fontName || 'Arial';
    this.opts.onInited  = this.opts.onInited || function() {};
    this.loadContent    = null;

    GUIElement.apply(this, [name, {focusable: true}]);
  };

  RichText.prototype = Object.create(GUIElement.prototype);

  RichText.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIRichText']);

    this.$view = document.createElement('iframe');
    this.$view.setAttribute("border", "0");

    el.appendChild(this.$view);

    return el;
  };

  RichText.prototype.update = function() {
    GUIElement.prototype.update.apply(this, arguments);

    var self = this;
    var template = '<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="/themes/default.css" /></head><body contentEditable="true"></body></html>';
    var doc;
    try {
      doc = this.getDocument();
      doc.open();
      doc.write(template);
      doc.close();
    } catch (error) {
      console.error("Failed to write RichText template", error);
    }

    if ( doc ) {
      doc.body.style.fontFamily = this.opts.fontName;

      try {
        this.$view.execCommand('styleWithCSS', false, false);
      } catch(e) {
        try {
          this.$view.execCommand('useCSS', false, null);
        } catch(e) {
          try {
            this.$view.execCommand('styleWithCSS', false, false);
          } catch(e) {
          }
        }
      }

      try {
        this.$view.contentWindow.onfocus = function() {
          self.focus();
        };
        this.$view.contentWindow.onblur = function() {
          self.blur();
        };
      } catch ( e ) {
        console.warn("Failed to bind focus/blur on richtext", e);
      }

      if ( this.opts.onInited ) {
        this.opts.onInited.apply(this, []);
      }

      if ( this.loadContent ) {
        this.loadContent();
        this.loadContent = null;
      }
    }
  };

  RichText.prototype.command = function(cmd, defaultUI, args) {
    var d = this.getDocument();
    if ( d ) {
      var argss = [];
      if ( typeof cmd         !== 'undefined' ) { argss.push(cmd); }
      if ( typeof defaultUI   !== 'undefined' ) { argss.push(defaultUI); }
      if ( typeof args        !== 'undefined' ) { argss.push(args); }

      try {
        return d.execCommand.apply(d, argss);
      } catch ( e ) {
        console.warn("OSjs.GUI.RichText::command() failed", cmd, defaultUI, args, e);
      }
    }
    return false;
  };

  RichText.prototype.setContent = function(c) {
    this.hasChanged = false;

    var d = this.getDocument();
    if ( d && d.body ) {
      d.body.innerHTML = c;
      return true;
    }
    return false;
  };

  RichText.prototype.getContent = function() {
    var self = this;
    function _getContent() {
      var d = self.getDocument();
      if ( d && d.body ) {
        return d.body.innerHTML;
      }
      return null;
    }

    if ( !this.inited ) {
      this.loadContent = _getContent;
      return null;
    }
    return _getContent();
  };

  RichText.prototype.getDocument = function() {
    if ( this.$view ) {
      return this.$view.contentDocument || this.$view.contentWindow.document;
    }
    return null;
  };

  RichText.prototype.blur = function() {
    if ( !GUIElement.prototype.blur.apply(this, arguments) ) { return false; }
    if ( this.$view && this.$view.contentWindow ) {
      this.$view.contentWindow.blur();
    }
    return true;
  };

  RichText.prototype.focus = function() {
    if ( !GUIElement.prototype.focus.apply(this, arguments) ) { return false; }
    if ( this.$view && this.$view.contentWindow ) {
      this.$view.contentWindow.focus();
    }
    return true;
  };

  /**
   * Tabs > Tab Container
   *
   * options:
   *  title           String        Tab title/label
   *  onCreate        Function      Callback - On creation
   *  onSelect        Function      Callback - On selected
   *  onUnselect      Function      Callback - On unselected
   *  onDestroy       Function      Callback - When destroyed
   *  onClose         Function      Callback - When closed
   */
  var Tab = function(name, opts, index, $tabs, $container, _tabs) {
    var self = this;

    opts            = opts            || {};
    opts.title      = opts.title      || {};
    opts.onCreate   = opts.onCreate   || function() {};
    opts.onSelect   = opts.onSelect   || function() {};
    opts.onUnselect = opts.onUnselect || function() {};
    opts.onDestroy  = opts.onDestroy  || function() {};
    opts.onClose    = opts.onClose    || function() { return true; };

    this.$c           = document.createElement('div');
    this.$c.className = 'TabContent';

    this.$t           = document.createElement('div');
    this.$t.className = 'Tab';
    this.$t.innerHTML = '<span>&nbsp;</span>';
    this.$t.onclick = function(ev) {
      _tabs.setTab(name);
    };

    this.$x               = null;
    if ( opts.closeable ) {
      this.$x             = document.createElement('span');
      this.$x.className   = 'Close';
      this.$x.innerHTML   = 'X';
      this.$x.onclick     = function(ev) {
        ev.stopPropagation();
        if ( opts.onClose(ev, self) === true ) {
          _tabs.removeTab(name);
        }
      };
      this.$t.appendChild(this.$x);
      this.$t.className += ' HasClose';
    }

    this.name     = name;
    this.selected = false;
    this.index    = index;
    this.params   = opts;

    this.setTitle(opts.title);
    $tabs.appendChild(this.$t);
    $container.appendChild(this.$c);

    this.params.onCreate.call(this);
  };
  Tab.prototype.destroy = function() {
    this.params.onDestroy.call(this);

    if ( this.$x ) {
      this.$x.onclick = null;
      if ( this.$x.parentNode ) {
        this.$x.parentNode.removeChild(this.$x);
      }
      this.$x = null;
    }

    if ( this.$c ) {
      if ( this.$c.parentNode ) {
        this.$c.parentNode.removeChild(this.$c);
      }
      this.$c = null;
    }
    if ( this.$t ) {
      this.$t.onclick = null;
      if ( this.$t.parentNode ) {
        this.$t.parentNode.removeChild(this.$t);
      }
      this.$t = null;
    }
  };
  Tab.prototype.select = function() {
    if ( this.selected || !this.$c || !this.$t ) { return; }
    OSjs.Utils.$addClass(this.$c, 'Active');
    OSjs.Utils.$addClass(this.$t, 'Active');
    this.selected = true;
    this.params.onSelect.call(this);
  };
  Tab.prototype.unselect = function() {
    if ( !this.selected || !this.$c || !this.$t ) { return; }
    OSjs.Utils.$removeClass(this.$c, 'Active');
    OSjs.Utils.$removeClass(this.$t, 'Active');
    this.selected = false;
    this.params.onUnselect.call(this);
  };
  Tab.prototype.appendChild = function(c) {
    if ( this.$c ) {
      this.$c.appendChild(c);
    }
  };
  Tab.prototype.setTitle = function(t) {
    this.params.title = t;
    if ( this.$t ) {
      this.$t.firstChild.innerHTML = '';
      this.$t.firstChild.appendChild(document.createTextNode(this.params.title));
    }
  };
  Tab.prototype.getTitle = function(t) {
    return this.params.title;
  };

  /**
   * Tabs Container
   *
   * options: (See GUIElement for more)
   *  orientation     String        Orientation (Default = horizontal)
   */
  var Tabs = function(name, opts) {
    opts = opts || {};

    this.$container   = null;
    this.$tabs        = null;
    this.orientation  = opts.orientation || 'horizontal';
    this.tabs         = {};
    this.tabCount     = 0;
    this.currentTab   = null;

    GUIElement.apply(this, [name, {focusable: true}]);
  };

  Tabs.prototype = Object.create(GUIElement.prototype);

  Tabs.prototype.init = function() {
    var self = this;
    var el = GUIElement.prototype.init.apply(this, ['GUITabs']);
    OSjs.Utils.$addClass(el, OSjs.Utils.$safeName(this.orientation));

    this.$container = document.createElement('div');
    this.$container.className = 'TabContents';

    this.$tabs = document.createElement('div');
    this.$tabs.className = 'Tabs';

    el.appendChild(this.$tabs);
    el.appendChild(this.$container);

    return el;
  };

  Tabs.prototype.destroy = function() {
    for ( var i in this.tabs ) {
      if ( this.tabs.hasOwnProperty(i) && this.tabs[i] ) {
        this.tabs[i].destroy();
      }
    }
    this.tabs = {};
    GUIElement.prototype.destroy.apply(this, arguments);

  };

  Tabs.prototype.setTab = function(idx) {
    console.debug("OSjs::GUI::Tabs::setTab()", idx);

    if ( this.tabs[idx] ) {
      if ( this.currentTab ) {
        this.currentTab.unselect();
        this.currentTab = null;
      }

      this.currentTab = this.tabs[idx];
      this.currentTab.select();
    }
  };

  Tabs.prototype.removeTab = function(idx) {
    console.debug("OSjs::GUI::Tabs::removeTab()", idx);

    if ( idx instanceof Tab ) {
      idx = idx.name;
    }

    if ( this.tabs[idx] ) {
      this.tabs[idx].destroy();
      delete this.tabs[idx];
      this.tabCount--;
    }

    this.selectFirstTab();
  };

  Tabs.prototype.selectFirstTab = function() {
    if ( !this.$tabs || !this.$container ) { return; }

    var found = false;
    for ( var i in this.tabs ) {
      if ( this.tabs.hasOwnProperty(i) && this.tabs[i] !== null ) {
        found = i;
        break
      }
    }

    if ( found !== false ) {
      this.setTab(found);
    }
  };

  Tabs.prototype.addTab = function(name, opts) {
    var self  = this;

    console.debug("OSjs::GUI::Tabs::addTab()", name, opts);

    var tab = new Tab(name, opts, this.tabCount, this.$tabs, this.$container, this);
    this.tabs[name] = tab;
    this.tabCount++;

    if ( this.inited && this.tabCount > 0 ) {
      this.setTab(name);
    }

    return tab;
  };

  Tabs.prototype.update = function() {
    if ( !this.inited ) {
      this.selectFirstTab();
    }
    GUIElement.prototype.update.apply(this, arguments);
  };

  /**
   * Text
   *
   * options: (See _Input for more)
   *  type      String        Input text type (Default = text)
   */
  var Text = function(name, opts) {
    opts            = opts || {};
    opts.focusable  = true;
    opts.type       = opts.type || 'text';

    _Input.apply(this, ['GUIText', 'input', name, opts]);
  };
  Text.prototype = Object.create(_Input.prototype);

  Text.prototype.select = function(range) {
    if ( this.$input ) {
      if ( range ) {
        try {
          if ( typeof range !== 'object' ) { range = {}; }
          if ( typeof range.min === 'undefined' || !range.min) { range.min = 0; }
          if ( typeof range.max === 'undefined' || !range.max || range.max < range.min ) { range.max = this.getValue().length - 1; }
          OSjs.Utils.$selectRange(this.$input, range.min, range.max);
        } catch ( e ) {
          console.warn("OSjs::GUI::Text::select()", "exception", e);
          this.$input.select();
        }
      } else {
        this.$input.select();
      }
    }
  };

  /**
   * Checkbox
   *
   * options: (See _Input for more)
   *  label           String        Label value
   */
  var Checkbox = function(name, opts) {
    opts      = opts || {};
    opts.type = 'checkbox';

    this.label  = opts.label || 'GUICheckbox Label';
    this.$label = null;

    _Input.apply(this, ['GUICheckbox', 'input', name, opts]);
  };
  Checkbox.prototype = Object.create(_Input.prototype);

  Checkbox.prototype.init = function() {
    var self = this;
    var el = GUIElement.prototype.init.apply(this, [this.className]);

    this.$input       = document.createElement(this.tagName);
    this.$input.type  = this.type;
    this._addEvent(this.$input, 'onchange', function(ev) {
      self.onChange.apply(self, [this, ev, self.getValue()]);
    });

    this.$label = document.createElement('label');
    this.$label.appendChild(this.$input);
    this.$label.appendChild(document.createTextNode(this.label));

    el.appendChild(this.$label);

    this.setDisabled(this.disabled);
    this.setValue(this.value);

    return el;
  };

  Checkbox.prototype.setChecked = function(val) {
    this.setValue(val);
  };

  Checkbox.prototype.setValue = function(val) {
    this.value = val ? true : false;
    if ( this.value ) {
      this.$input.setAttribute("checked", "checked");
    } else {
      this.$input.removeAttribute("checked");
    }
  };

  Checkbox.prototype.getValue = function() {
    return this.$input.checked ? true : false;
  };

  /**
   * Radio
   *
   * options: (See GUIElement for more)
   *  group           String        Group name
   *  label           String        Label value
   */
  var Radio = function(name, opts) {
    opts        = opts || {};
    opts.type   = 'radio';

    this.group  = opts.group || 'GUIRadioDefaultGroup';
    this.label  = opts.label || 'GUIRadio Label';
    this.$label = null;

    _Input.apply(this, ['GUICheckbox', 'input', name, opts]);
  };
  Radio.prototype = Object.create(Checkbox.prototype);

  Radio.prototype.init = function() {
    var el = Checkbox.prototype.init.apply(this, [this.className]);

    this.$input.name = this.group;

    return el;
  };

  /**
   * Select
   *
   * options: (See _Input for more)
   */
  var Select = function(name, opts) {
    _Input.apply(this, ['GUISelect', 'select', name, opts]);
  };

  Select.prototype = Object.create(_Input.prototype);

  Select.prototype.addItems = function(items) {
    for ( var i in items ) {
      if ( items.hasOwnProperty(i) ) {
        this.addItem(i, items[i]);
      }
    }
  };

  Select.prototype.addItem = function(value, label) {
    var el        = document.createElement('option');
    el.value      = value;
    el.appendChild(document.createTextNode(label));
    this.$input.appendChild(el);
  };

  Select.prototype.setValue = function(val) {
    this.setSelected(val);
  };

  Select.prototype.setSelected = function(val) {
    var i = 0;
    var l = this.$input.childNodes.length;
    var found = false;

    for ( i; i < l; i++ ) {
      if ( i === val || this.$input.childNodes[i].value == val ) {
        found = i;
        break;
      }
    }

    if ( found !== false ) {
      this.$input.selectedIndex = found;
      this.value = found;
    }
  };

  /**
   * SelectList
   *
   * options: (See _Input for more)
   */
  var SelectList = function(name, opts) {
    _Input.apply(this, ['GUISelectList', 'select', name, opts]);
  };

  SelectList.prototype = Object.create(_Input.prototype);

  SelectList.prototype.init = function() {
    var el = _Input.prototype.init.apply(this, [this.className]);

    this.$input.multiple = 'multiple';

    return el;
  };

  SelectList.prototype.addItems = function(items) {
    for ( var i in items ) {
      if ( items.hasOwnProperty(i) ) {
        this.addItem(i, items[i]);
      }
    }
  };

  SelectList.prototype.addItem = function(value, label) {
    var el        = document.createElement('option');
    el.value      = value;
    el.appendChild(document.createTextNode(label));
    this.$input.appendChild(el);
  };

  SelectList.prototype.setValue = function(val) {
    this.setSelected(val);
  };

  SelectList.prototype.setSelected = function(val) {
    if ( !this.$input ) { return; }

    var sel = [];
    if ( val instanceof Array ) {
      sel = val;
    } else {
      sel = [val];
    }

    var i = 0;
    var l = this.$input.childNodes.length;
    for ( i; i < l; i++ ) {
      this.$input.childNodes[i].removeAttribute("selected");
      if ( OSjs.Utils.inArray(sel, this.$input.childNodes[i].value) ) {
        this.$input.childNodes[i].setAttribute("selected", "selected");
      }
    }
  };

  SelectList.prototype.getValue = function() {
    var selected = [];
    if ( this.$input ) {
      var i = 0;
      var l = this.$input.childNodes.length;
      for ( i; i < l; i++ ) {
        if ( this.$input.childNodes[i].selected ) {
          selected.push(this.$input.childNodes[i].value);
        }
      }
    }
    return selected;
  };

  /**
   * Button
   *
   * options: (See _Input for more)
   */
  var Button = function(name, opts) {
    _Input.apply(this, ['GUIButton', 'button', name, opts]);
  };
  Button.prototype = Object.create(_Input.prototype);

  /**
   * ScrollView
   *
   * options: (See GUIElement for more)
   */
  var ScrollView = function(name, opts) {
    opts      = opts || {};

    if ( typeof opts.scrollX === 'undefined' ) {
      opts.scrollX = true;
    }
    if ( typeof opts.scrollY === 'undefined' ) {
      opts.scrollY = true;
    }

    GUIElement.apply(this, [name, opts]);
  };
  ScrollView.prototype = Object.create(GUIElement.prototype);

  ScrollView.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIScrollView']);
    return el;
  };

  ScrollView.prototype.update = function() {
    GUIElement.prototype.update.apply(this, arguments);

    this.setScroll(this.opts.scrollX, this.opts.scrollY);
  };

  ScrollView.prototype.addElement = function(el, clear) {
    if ( clear ) {
      OSjs.Utils.$empty(this.$element);
    }
    this.$element.appendChild(el);
  };

  ScrollView.prototype.setScroll = function(x, y) {
    var classNames = ['GUIScrollView', OSjs.Utils.$safeName(this.name)];
    if ( x ) { classNames.push('ScrollX'); }
    if ( y ) { classNames.push('ScrollY'); }

    this.opts.scrollX = x;
    this.opts.scrollY = y;

    this.getRoot().className = classNames.join(' ');
  };

  /**
   * PanedView
   * FIXME: PanedView - When more than two Views manual CSS is required
   * FIXME: PanedView - Vertical orientation (direction)
   *
   * options: (See GUIElement for more)
   *  orientation     String        Orientation (Default = horizontal)
   */
  var PanedView = function(name, opts) {
    opts            = opts            || {};
    opts.direction  = (opts.direction || opts.orientation)  || 'horizontal';

    this.$container = null;
    this.$separator = null;

    GUIElement.apply(this, [name, opts]);
  };
  PanedView.prototype = Object.create(GUIElement.prototype);

  PanedView.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIPanedView']);
    var type = this.opts.direction === 'horizontal' ? 'Horizontal' : 'Vertical';
    OSjs.Utils.$addClass(el, OSjs.Utils.$safeName(type));

    this.$container = document.createElement('ul');
    el.appendChild(this.$container);
    return el;
  };

  PanedView.prototype.update = function() {
    GUIElement.prototype.update.apply(this, arguments);

  };

  PanedView.prototype.createView = function(name) {
    if ( this.$container.childNodes.length % 2 ) {
      var separator = document.createElement('li');
      separator.className = 'Separator';


      var startW = 0;
      var startX = 0;
      var idx    = this.$container.childNodes.length - 1;
      var column = this.$container.childNodes[idx];

      var onResizeMove = function(ev) {
        var newW = startW + (ev.clientX - startX);
        column.style.width = newW + 'px';
      };

      var onResizeEnd = function(ev) {
        document.removeEventListener('mouseup',   onResizeEnd,  false);
        document.removeEventListener('mousemove', onResizeMove, false);
      };

      var onResizeStart = function(ev, col) {
        startX = ev.clientX;
        startW = column.offsetWidth;

        document.addEventListener('mouseup',    onResizeEnd,  false);
        document.addEventListener('mousemove',  onResizeMove, false);
      };

      this._addEventListener(separator, 'mousedown', function(ev) {
        ev.preventDefault();
        return onResizeStart(ev);
      });

      this.$container.appendChild(separator);
      this.$separator = separator;
    }

    var container = document.createElement('li');
    container.className = 'View ' + name;
    this.$container.appendChild(container);
    return container;
  };

  PanedView.prototype.addItem = function(el, name) {
    var container = this.createView(name);

    if ( el ) {
      if ( el instanceof GUIElement ) {
        container.appendChild(el.getRoot());
      } else {
        container.appendChild(el);
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // FileView
  /////////////////////////////////////////////////////////////////////////////

  /**
   * FileView > TreeView
   *
   * options: (See GUIElement for more)
   *  onSelected        Function        Callback - When item is selected (clicked)
   *  onActivated       Function        Callback - When item is activated (dblclick)
   *  onDropped         Function        Callback - When item has been dropped
   */
  var FileTreeView = function(fileView, name, opts) {
    opts = opts || {};
    if ( typeof opts.dnd === 'undefined' ) {
      opts.dnd = true;
    }
    TreeView.apply(this, [name, opts]);

    this.onActivated  = function(path, type, mime) {};
    this.onSelected   = function(item, el) {};
    this.onDropped    = function() { console.warn("Not implemented yet!"); };
    this.fileView     = fileView;
  };

  FileTreeView.prototype = Object.create(TreeView.prototype);

  FileTreeView.prototype.init = function() {
    TreeView.prototype.init.apply(this, arguments);

    var self = this;
    if ( this.opts.dnd && this.opts.dndDrag && OSjs.Compability.dnd ) {
      this.onCreateItem = function(el, item) {
        var self = this;
        if ( item.filename == '..' ) { return; }

        if ( item.type === 'file' ) {
          el.title = ([
            OSjs._("Filename") + ": "  + item.filename,
            OSjs._("Path")     + ": "  + item.path,
            OSjs._("Size")     + ": "  + item.size || 0,
            OSjs._("MIME")     + ": "  + item.mime || 'none'
          ]).join("\n");

          createDraggable(el, {
            type   : 'file',
            source : {wid: self.wid},
            data   : {
              type   : 'file',
              filename: item.filename,
              path: item.path,
              size : item.size,
              mime: item.mime
            }
          });
        } else if ( item.type == 'dir' ) {
          el.title = item.path;

          createDroppable(el, {
            onItemDropped: function(ev, el, item, args) {
              return self.onItemDropped.call(self, ev, el, item, args);
            },
            onFilesDropped: function(ev, el, files, args) {
              return self.onFilesDropped.call(self, ev, el, item, args);
            }
          });
        }

      };
    }
  };

  FileTreeView.prototype._createList = function(list, skipDot) {
    var fileList = [];
    var _createIcon = function(iter) {
      var defIcon = 'status/gtk-dialog-question.png';
      return getFileIcon(iter.filename, iter.mime, iter.type, defIcon, '16x16');
    };

    var iter;
    for ( var i = 0; i < list.length; i++ ) {
      iter = list[i];
      if ( skipDot && iter.filename == '..' ) {
        continue;
      }

      iter.title = iter.filename;
      iter.icon  = _createIcon(iter);
      iter._loaded = false;

      if ( iter.type == 'dir' && iter.filename != '..' ) {
        iter.items = [{
          icon: iter.icon,
          title: 'Loading...'
        }];
      }
      fileList.push(iter);
    }

    return fileList;
  };

  FileTreeView.prototype.render = function(list, dir) {
    if ( this.destroyed ) { return; }
    var fileList = this._createList(list);
    TreeView.prototype.render.apply(this, [fileList, true]);
  };

  FileTreeView.prototype._onSelect = function(ev, item) {
    item = TreeView.prototype._onSelect.apply(this, arguments);
    if ( item && item.path ) {
      this.onSelected(item.path, item.type, item.mime);
    }
  };

  FileTreeView.prototype._onActivate = function(ev, item) {
    item = TreeView.prototype._onActivate.apply(this, arguments);
    if ( item && item.path ) {
      this.onActivated(item.path, item.type, item.mime);
    }
  };

  FileTreeView.prototype._onExpand = function(ev, item) {
    TreeView.prototype._onActivate.apply(this, arguments);
    if ( item._loaded ) {
      return;
    }

    if ( this.fileView && item && item.path && item._element ) {
      var fv = this.fileView;
      var self = this;
      fv._getDir(item.path, function(list, dir, num, size) {
        var ul = item._element.getElementsByTagName('UL')[0];
        if ( ul ) {
          OSjs.Utils.$empty(ul);
        }

        var level = item._element.className.replace('Level_', '') << 0;
        var fileList = self._createList(list, true);
        self._render(fileList, item._element, level+1, ul);
        ul.style.display = 'block';
      });

      item._loaded = true;
    }
  };

  /**
   * FileView > IconView
   *
   * options: (See GUIElement for more)
   *  onSelected        Function        Callback - When item is selected (clicked)
   *  onActivated       Function        Callback - When item is activated (dblclick)
   *  onDropped         Function        Callback - When item has been dropped
   */
  var FileIconView = function(fileView, name, opts) {
    opts = opts || {};
    if ( typeof opts.dnd === 'undefined' ) {
      opts.dnd = true;
    }
    IconView.apply(this, [name, opts]);

    this.onActivated  = function(path, type, mime) {};
    this.onSelected   = function(item, el) {};
    this.onDropped    = function() { console.warn("Not implemented yet!"); };
    this.fileView     = fileView;
  };

  FileIconView.prototype = Object.create(IconView.prototype);

  FileIconView.prototype.init = function() {
    IconView.prototype.init.apply(this, arguments);

    var self = this;
    if ( this.opts.dnd && this.opts.dndDrag && OSjs.Compability.dnd ) {
      this.onCreateItem = function(el, item) {
        var self = this;
        if ( item.filename == '..' ) { return; }

        if ( item.type === 'file' ) {
          el.title = ([
            OSjs._("Filename") + ": "  + item.filename,
            OSjs._("Path")     + ": "  + item.path,
            OSjs._("Size")     + ": "  + item.size || 0,
            OSjs._("MIME")     + ": "  + item.mime || 'none'
          ]).join("\n");

          createDraggable(el, {
            type   : 'file',
            source : {wid: self.wid},
            data   : {
              type   : 'file',
              filename: item.filename,
              path: item.path,
              size : item.size,
              mime: item.mime
            }
          });
        } else if ( item.type == 'dir' ) {
          el.title = item.path;

          createDroppable(el, {
            onItemDropped: function(ev, el, item, args) {
              return self.onItemDropped.call(self, ev, el, item, args);
            },
            onFilesDropped: function(ev, el, files, args) {
              return self.onFilesDropped.call(self, ev, el, item, args);
            }
          });
        }

      };
    }
  };

  FileIconView.prototype.render = function(list, dir) {
    if ( this.destroyed ) { return; }

    var fileList = [];
    var _createIcon = function(iter) {
      var defIcon = 'status/gtk-dialog-question.png';
      return getFileIcon(iter.filename, iter.mime, iter.type, defIcon, '32x32');
    };

    var iter;
    for ( var i = 0; i < list.length; i++ ) {
      iter = list[i];
      iter.label = iter.filename;
      iter.icon  = _createIcon(iter);
      fileList.push(iter);
    }

    IconView.prototype.render.apply(this, [fileList, true]);
  };

  FileIconView.prototype._onSelect = function(ev, item) {
    item = IconView.prototype._onSelect.apply(this, arguments);
    if ( item && item.path ) {
      this.onSelected(item.path, item.type, item.mime);
    }
  };

  FileIconView.prototype._onActivate = function(ev, item) {
    item = IconView.prototype._onActivate.apply(this, arguments);
    if ( item && item.path ) {
      this.onActivated(item.path, item.type, item.mime);
    }
  };

  /**
   * FileView > ListView
   *
   * options: (See GUIElement for more)
   *  onSelected        Function        Callback - When item is selected (clicked)
   *  onActivated       Function        Callback - When item is activated (dblclick)
   *  onDropped         Function        Callback - When item has been dropped
   *  humanSize         bool            Show human-readable sized (default = True)
   */
  var FileListView = function(fileView, name, opts) {
    opts = opts || {};
    if ( typeof opts.dnd === 'undefined' ) {
      opts.dnd = true;
    }

    ListView.apply(this, [name, opts]);

    this.humanSize  = (typeof opts.humanSize === 'undefined' || opts.humanSize);

    this.onActivated  = function(path, type, mime) {};
    this.onSelected   = function(item, el) {};
    this.onDropped    = function() { console.warn("Not implemented yet!"); };
    this.onSort       = function() { console.warn("Not implemented yet!"); };
    this.fileView     = fileView;
  };

  FileListView.prototype = Object.create(ListView.prototype);

  FileListView.prototype.init = function() {
    ListView.prototype.init.apply(this, arguments);

    var self = this;
    if ( this.opts.dnd && this.opts.dndDrag && OSjs.Compability.dnd ) {
      this.onCreateItem = function(el, item, column) {
        var self = this;
        if ( item.filename == '..' ) { return; }

        if ( item.type === 'file' ) {
          el.title = ([
            OSjs._("Filename") + ": "  + item.filename,
            OSjs._("Path")     + ": "  + item.path,
            OSjs._("Size")     + ": "  + item.size || 0,
            OSjs._("MIME")     + ": "  + item.mime || 'none'
          ]).join("\n");

          createDraggable(el, {
            type   : 'file',
            source : {wid: self.wid},
            data   : {
              type: 'file',
              filename: item.filename,
              path: item.path,
              size : item.size,
              mime: item.mime
            }
          });

        } else if ( item.type == 'dir' ) {
          el.title = item.path;

          createDroppable(el, {
            onItemDropped: function(ev, el, item, args) {
              return self.onItemDropped.call(self, ev, el, item, args);
            },
            onFilesDropped: function(ev, el, files, args) {
              return self.onFilesDropped.call(self, ev, el, item, args);
            }
          });
        }

      };
    }
  };

  FileListView.prototype.render = function(list, dir) {
    if ( this.destroyed ) { return; }
    var self = this;

    var _callbackIcon = function(iter) {
      var icon = 'status/gtk-dialog-question.png';
      return getFileIcon(iter.filename, iter.mime, iter.type, icon);
    };

    var _callbackSize = function(iter) {
      if ( iter.size === '' ) { return ''; }
      if ( self.humanSize ) {
        return OSjs.Utils.humanFileSize(iter.size);
      }
      return iter.size;
    };

    this.setColumns([
      {key: 'image',    title: '', type: 'image', callback: _callbackIcon, domProperties: {width: "16"}, resizable: false},
      {key: 'filename', title: OSjs._('Filename')},
      {key: 'mime',     title: OSjs._('MIME'), domProperties: {width: "150"}},
      {key: 'size',     title: OSjs._('Size'), callback: _callbackSize, domProperties: {width: "80"}},
      {key: 'path',     title: OSjs._('Path'), visible: false},
      {key: 'type',     title: OSjs._('Type'), visible: false}
     ]);

    ListView.prototype.render.apply(this, [list, true]);
  };

  FileListView.prototype._onColumnClick = function(ev, col) {
    ListView.prototype._onColumnClick.apply(this, arguments);
    this.onSort(col);
  };

  FileListView.prototype._onActivate = function(ev, item) {
    var item = ListView.prototype._onActivate.apply(this, arguments);
    if ( item && item.path ) {
      this.onActivated(item.path, item.type, item.mime);
    }
  };

  FileListView.prototype._onSelect = function(ev, item) {
    var item = ListView.prototype._onSelect.apply(this, arguments);
    if ( item && item.path ) {
      this.onSelected(item, item._element);
    }
  };

  /**
   * FileView
   *
   * options: (See GUIElement for more)
   *  startViewType     String          Default view type (Default = ListView)
   *  locked            bool            Locked (Default = false)
   *  humanSize         bool            Show human-readable sized (default = True)
   *  summary           bool            Return statistics for onFinished() (Default = False)
   *  onSelected        Function        Callback - When item is selected (clicked)
   *  onActivated       Function        Callback - When item is activated (dblclick)
   *  onItemDropped     Function        Callback - When item has been dropped
   *  onDropped         Function        Callback - When item has been dropped (FIXME)
   *  onError           Function        Callback - When error happened
   *  onRefresh         Function        Callback - On refresh
   *  onContextMenu     Function        Callback - On context menu
   *  onColumnSort      Function        Callback - On sort
   */
  var FileView = function(name, opts) {
    opts = opts || {};

    var self = this;
    var mimeFilter = [];
    if ( opts.mimeFilter ) {
      mimeFilter = opts.mimeFilter || null;
      if ( !mimeFilter || Object.prototype.toString.call(mimeFilter) !== '[object Array]' ) {
        mimeFilter = [];
      }
    }

    var viewOpts        = {};
    viewOpts.dnd        = (typeof opts.dnd === 'undefined' || opts.dnd === true);
    viewOpts.summary    = opts.summary || false;
    viewOpts.humanSize  = (typeof opts.humanSize === 'undefined' || opts.humanSize);

    this.startViewType  = opts.viewType || 'ListView';
    this.viewType       = null;
    this.viewOpts       = viewOpts;
    this.lastDir        = viewOpts.path || '/';
    this.mimeFilter     = mimeFilter;
    this.typeFilter     = opts.typeFilter || null;
    this.wasUpdated     = false;
    this.sortKey        = null;
    this.sortDir        = true; // true = asc, false = desc
    this.locked         = opts.locked || false;
    this.$view          = null;

    this.onActivated    = function(path, type, mime) {};
    this.onError        = function(error) {};
    this.onFinished     = function() {};
    this.onSelected     = function(item, el) {};
    this.onRefresh      = function() {};
    this.onDropped      = function() { console.warn("Not implemented yet!"); };
    this.onContextMenu  = function(ev, el, item) {};
    this.onItemDropped  = function(ev, el, item) {};

    this.onColumnSort   = function(column) {
      if ( column === 'image' ) { column = null; }

      self.setSort(column);
    };

    GUIElement.apply(this, arguments);
  };

  FileView.prototype = Object.create(GUIElement.prototype);

  FileView.prototype.destroy = function() {
    if ( this.$view ) {
      this.$view.destroy();
      this.$view = null;
    }

    GUIElement.prototype.destroy.apply(this, arguments);
  };

  FileView.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIFileView']);

    this.createView(this.startViewType, el);

    return el;
  };

  FileView.prototype.createView = function(v, root) {
    var self = this;

    if ( v != this.viewType ) {

      if ( this.$view ) {
        this.$view.destroy();
        this.$view = null;

        this.sortKey = null;
        this.sortDir = true;
      }

      if ( v.toLowerCase() == 'listview' ) {
        this.$view = new FileListView(this, 'FileListView', this.viewOpts);
      } else if ( v.toLowerCase() == 'iconview' ) {
        this.$view = new FileIconView(this, 'FileIconView', this.viewOpts);
      } else if ( v.toLowerCase() == 'treeview' ) {
        this.$view = new FileTreeView(this, 'FileTreeView', this.viewOpts);
      } else {
        throw "Invalid view type: " + v;
      }

      this.$view.onActivated  = function(path, type, mime) {
        if ( type === 'dir' ) {
          self.chdir(path);
        } else {
          self.onActivated.apply(this, arguments);
        }
      };

      this.$view.onSelected     = function() { return self.onSelected.apply(this, arguments); };
      this.$view.onDropped      = function() { return self.onDropped.apply(this, arguments); };
      this.$view.onContextMenu  = function() { return self.onContextMenu.apply(this, arguments); };
      this.$view.onItemDropped  = function() { return self.onItemDropped.apply(this, arguments); };
      this.$view.onSort         = function() { return self.onColumnSort.apply(this, arguments); };

      (root || this.$element).appendChild(this.$view.getRoot());
      this.viewType = v;

      if ( !this.rendered ) {
        this.$view.update();
      }
    }
  };

  FileView.prototype.refresh = function(onRefreshed, onError) {
    if ( this.$view ) {
      this.chdir(this.getPath(), onRefreshed, onError);
    }
  };

  FileView.prototype._getDir = function(dir, onSuccess, onError) {
    var self = this;

    onSuccess = onSuccess || function() {};
    onError   = onError   || function() {};

    function sortList(list, key, asc) {
      if ( !key ) { return list; }

      var first = null;
      if ( list.length && list[0].filename === '..' ) {
        first = list.shift();
      }

      var lst = list.sort(function(a, b) {
        var keyA = new Date(a[key]),
            keyB = new Date(b[key]);

        if(keyA < keyB) { return -1; }
        if(keyA > keyB) { return 1; }
        return 0;
      });

      if ( !asc ) {
        lst.reverse();
      }

      if ( first ) {
        lst.unshift(first);
      }

      return lst;
    }

    OSjs.API.call('fs', {method: 'scandir', 'arguments' : [dir, {mimeFilter: this.mimeFilter, typeFilter: this.typeFilter}]}, function(res) {
      if ( self.destroyed ) { return; }

      var rendered  = false;
      var num       = 0;
      var size      = 0;
      var list      = [];

      if ( res ) {
        if ( res.error ) {
          onError.call(self, res.error, dir);
          return;
        } else {
          if ( res.result /* && res.result.length*/ ) {
            if ( self.locked ) {
              if ( res.result.length > 0 ) {
                if ( res.result[0].filename == '..' ) {
                  res.result.shift();
                }
              }
            }
            if ( self.summary && res.result.length ) {
              for ( var i = 0, l = res.result.length; i < l; i++ ) {
                if ( res.result[i].filename !== ".." ) {
                  if ( res.result[i].size ) {
                    size += (res.result[i].size << 0);
                  }
                  num++;
                }
              }
            }

            list = self.sortKey ? sortList(res.result, self.sortKey, self.sortDir) : res.result;
          }
        }
      }

      onSuccess.call(self, list, dir, num, size);
    }, function(error) {
      onError.call(self, error, dir, true);
    });
  };

  FileView.prototype.chdir = function(dir, onRefreshed, onError) {
    if ( this.destroyed ) { return; }

    onRefreshed = onRefreshed || function() {};
    onError     = onError     || function() {};

    if ( !this.$view ) {
      throw "FileView has no GUI element attached!";
    }

    this.onRefresh.call(this);

    this._getDir(dir, function(list, dir, num, size) {
      this.lastDir = dir;
      this.wasUpdated = true;

      if ( this.$view ) {
        this.$view.render(list, dir);
      }

      this.onFinished(dir, num, size);

      if ( this.$view && this.getViewType() === 'ListView' ) {
        if ( this.sortKey ) {
          var col = this.$view.$headTop.getElementsByClassName("Column_" + this.sortKey);
          col = (col && col.length) ? col[0] : null;
          if ( col ) {
            //col.className += 'Sorted';
            var arrow = document.createElement('div');
            arrow.className = 'Arrow ' + (this.sortDir ? 'Ascending' : 'Descending');
            col.firstChild.appendChild(arrow);
          }
        }
      }

      onRefreshed.call(this);
    }, function(error, dir, arg) {
      this.onError.call(this, error, dir, (arg || false));
      onError.call(this, error, dir, (arg || false));
    });
  };

  FileView.prototype.setViewType = function(v) {
    this.createView(v);

    if ( this.wasUpdated ) {
      this.refresh();
    }
  };

  FileView.prototype.setSort = function(col) {
    if ( this.wasUpdated ) {
      if ( col === this.sortKey ) {
        this.sortDir = !this.sortDir;
      } else {
        this.sortDir = true;
      }
      this.sortKey = col;
      this.refresh();
    }
  };

  FileView.prototype.setSelected = function(val, key) {
    if ( this.$view ) {
      this.$view.setSelected.apply(this.$view, [val, key, true]);
    }
  };

  FileView.prototype.getPath = function() {
    return this.lastDir;
  };

  FileView.prototype.getSelected = function() {
    return this.$view ? this.$view.getSelected() : null;
  };

  FileView.prototype.getViewType = function() {
    return this.viewType;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.GUIElement   = GUIElement;

  OSjs.GUI.MenuBar      = MenuBar;
  OSjs.GUI.ListView     = ListView;
  OSjs.GUI.FileView     = FileView;
  OSjs.GUI.Textarea     = Textarea;
  OSjs.GUI.ColorSwatch  = ColorSwatch;
  OSjs.GUI.StatusBar    = StatusBar;
  OSjs.GUI.Slider       = Slider;
  OSjs.GUI.ToolBar      = ToolBar;
  OSjs.GUI.Canvas       = Canvas;
  OSjs.GUI.ProgressBar  = ProgressBar;
  OSjs.GUI.IconView     = IconView;
  OSjs.GUI.TreeView     = TreeView;
  OSjs.GUI.RichText     = RichText;
  OSjs.GUI.Tabs         = Tabs;
  OSjs.GUI.Select       = Select;
  OSjs.GUI.SelectList   = SelectList;
  OSjs.GUI.Text         = Text;
  OSjs.GUI.Checkbox     = Checkbox;
  OSjs.GUI.Radio        = Radio;
  OSjs.GUI.Button       = Button;
  OSjs.GUI.ScrollView   = ScrollView;
  OSjs.GUI.PanedView    = PanedView;

  OSjs.GUI.createDraggable  = createDraggable;
  OSjs.GUI.createDroppable  = createDroppable;
  OSjs.GUI.getFileIcon      = getFileIcon;

  var _MENU;
  OSjs.GUI.createMenu = function(items, pos) {
    items = items || [];
    pos = pos || {x: 0, y: 0};

    OSjs.GUI.blurMenu();

    _MENU = new Menu(items);
    _MENU.show(pos);
    return _MENU;
  };
  OSjs.GUI.blurMenu   = function() {
    if ( _MENU ) {
      _MENU.destroy();
      _MENU = null;
    }
  };

})();
