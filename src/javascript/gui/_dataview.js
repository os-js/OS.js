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
(function(GUIElement, API, Utils) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};

  /////////////////////////////////////////////////////////////////////////////
  // CLASS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Data View Base Class
   *
   * This is for handling data lists in some sort of view
   *
   * @param   String      className     The element className
   * @param   String      name          The element name
   * @param   Object      opts          A list of options
   *
   * @option  opts onSelect          Function        Callback - When item is selected (clicked item)
   * @option  opts onActivate        Function        Callback - When item is activated (double-click item)
   * @option  opts onContextMenu     Function        Callback - When item menu is activated (right click on item)
   * @option  opts onViewContextMenu Function        Callback - When view menu is activated (right click background)
   * @option  opts onCreateItem      Function        Callback - When item is created
   * @option  opts data              Array           Data (Items)
   * @option  opts indexKey          String          What key is used as an index (usefull for autoselecting last selected row on re-render)
   * @option  opts render            bool            Render on create (default = true when data is supplied)
   *
   * @api OSjs.GUI._DataView
   *
   * @class
   */
  var _DataView = function(className, name, opts) {
    opts = opts || {};

    this.className  = className;
    this.$view      = null;
    this.selected   = null;
    this.data       = [];

    this.indexKey           = opts.indexKey           || null;
    this.onSelect           = opts.onSelect           || function(ev, el, item) {};
    this.onActivate         = opts.onActivate         || function(ev, el, item) {};
    this.onContextMenu      = opts.onContextMenu      || function(ev, el, item) {};
    this.onViewContextMenu  = opts.onViewContextMenu  || function(ev) {};
    this.onCreateItem       = opts.onCreateItem       || function(el, iter) {};

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
    var self = this;
    var el = GUIElement.prototype.init.apply(this, [className]);
    this.$view = document.createElement('div');
    if ( typeof view === 'undefined' || view === true ) {
      el.appendChild(this.$view);
      this._addEventListener(this.$view, 'contextmenu', function(ev) {
        ev.stopPropagation(); // Or else eventual ContextMenu is blurred
        ev.preventDefault();

        self.onViewContextMenu.call(self, ev);

        return false;
      });
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
      Utils.$removeClass(this.selected._element, 'Active');
    }

    this.selected = null;

    if ( item && item._element ) {
      this.selected  = item;
      Utils.$addClass(this.selected._element, 'Active');

      if ( scroll ) {
        var pos = Utils.$position(this.selected._element, this.$view);
        if ( pos !== null && 
             (pos.top > (this.$view.scrollTop + this.$view.offsetHeight) || 
             (pos.top < this.$view.scrollTop)) ) {
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

  _DataView.prototype.onGlobalKeyPress = function(ev) {
    if ( this.destroyed ) { return false; }
    if ( GUIElement.prototype.onGlobalKeyPress.apply(this, arguments) ) { return false; }

    var valid = [Utils.Keys.UP, Utils.Keys.DOWN, Utils.Keys.LEFT, Utils.Keys.RIGHT, Utils.Keys.ENTER];
    if ( !Utils.inArray(valid, ev.keyCode) ) {
      return true;
    }
    if ( this.className === 'TreeView' ) {
      // TreeView has custom code
      return true;
    }

    ev.preventDefault();
    if ( this.selected ) {

      var idx  = this.selected._index;
      var tidx = idx;
      var len  = this.data.length;
      var skip = 1;
      var prev = idx;

      if ( this.className === 'IconView' ) {
        if ( this.$view ) {
          var el = this.$view.getElementsByTagName('LI')[0];
          if ( el ) {
            var ow = el.offsetWidth;
            try {
              ow += parseInt(Utils.$getStyle(el, 'padding-left').replace('px', ''), 10);
              ow += parseInt(Utils.$getStyle(el, 'padding-right').replace('px', ''), 10);
              ow += parseInt(Utils.$getStyle(el, 'margin-left').replace('px', ''), 10);
              ow += parseInt(Utils.$getStyle(el, 'margin-right').replace('px', ''), 10);
            } catch ( e ) {}
            skip = Math.floor(this.$view.offsetWidth / ow);
          }
        }
      }

      if ( idx >= 0 && idx < len  ) {
        if ( ev.keyCode === Utils.Keys.UP ) {
          idx -= skip;
          if ( idx < 0 ) { idx = prev; }
        } else if ( ev.keyCode === Utils.Keys.DOWN ) {
          idx += skip;
          if ( idx >= len ) { idx = prev; }
        } else if ( ev.keyCode === Utils.Keys.LEFT ) {
          idx--;
        } else if ( ev.keyCode === Utils.Keys.RIGHT ) {
          idx++;
        } else if ( ev.keyCode === Utils.Keys.ENTER ) {
          this._onActivate(ev, this.data[idx]);
          return true;
        }

        if ( idx !== tidx ) {
          this.setSelectedIndex(idx, true);
        }
      }
    }
    return true;
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
    var result = null;
    this.data.forEach(function(iter, i) {
      if ( iter[key] === val ) {
        result = iter;
        return false;
      }
      return true;
    });
    return result;
  };

  _DataView.prototype.getItem = function(idx) {
    return this.data[idx];
  };

  _DataView.prototype.getSelected = function() {
    return this.selected;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI._DataView        = _DataView;

})(OSjs.GUI.GUIElement, OSjs.API, OSjs.Utils);
