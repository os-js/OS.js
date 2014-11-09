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
(function(GUIElement, _DataView) {
  'use strict';

  /**
   * Tree View
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
   *  singleClick       bool            Single click to Activate (dblclick) forced on touch devices
   */
  var TreeView = function(name, opts) {
    opts = opts || {};

    var expand = false;
    if ( opts.expanded === true ) {
      expand = true;
    } else if ( opts.expanded >= 0 ) {
      expand = opts.expand;
    }

    this.total          = 0;
    this.expandLevel    = expand;
    this.onExpand       = opts.onExpand       || function(ev, el, item) {};
    this.onCollapse     = opts.onCollapse     || function(ev, el, item) {};
    this.onRenderItem   = opts.onRenderItem   || function(el, iter) {};

    this.singleClick    = typeof opts.singleClick === 'undefined' ? false : (opts.singleClick === true);
    if ( OSjs.Compability.touch ) {
      this.singleClick = true;
    }

    _DataView.apply(this, ['TreeView', name, opts]);
  };

  TreeView.prototype = Object.create(_DataView.prototype);

  TreeView.prototype.init = function() {
    var root = _DataView.prototype.init.call(this, 'GUITreeView');
    return root;
  };

  TreeView.prototype._render = function(list, root, expandLevel, ul) {
    var self = this;

    function _bindEvents(inner, c, e, singleClick) {
      self._addEventListener(inner, 'contextmenu', function(ev) {
        ev.stopPropagation(); // Or else eventual ContextMenu is blurred
        ev.preventDefault();

        if ( e ) {
          ev.stopPropagation();
        }
        self._onContextMenu(ev, c);

        return false;
      });

      if ( singleClick ) {
        self._addEventListener(inner, 'click', function(ev) {
          if ( e ) {
            ev.stopPropagation();
          }
          self._onSelect(ev, c);

          self._onActivate(ev, c);
        });
      } else {
        self._addEventListener(inner, 'click', function(ev) {
          if ( e ) {
            ev.stopPropagation();
          }
          self._onSelect(ev, c);
        });
        self._addEventListener(inner, 'dblclick', function(ev) {
          if ( e ) {
            ev.stopPropagation();
          }
          self._onActivate(ev, c);
        });
      }
    }

    function _bindSubEvents(exp, c, el, it) {
      exp.onclick = function(ev) {
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
    }

    function _render(list, root, ul, level) {
      if ( typeof level === 'undefined' ) {
        level = false;
      }

      if ( !ul ) {
        ul = document.createElement('ul');
        ul.className = 'Level_' + (level || 0);
      }

      list.forEach(function(iter, i) {
        var exp, ico, title, child;

        var li = document.createElement('li');
        var inner = document.createElement('div');

        iter.name      = iter.name  || 'treeviewitem_' + self.total;
        iter.title     = iter.title || iter.name;

        li.className = 'Item Level_' + (level || 0);
        li.setAttribute('data-index', i);

        Object.keys(iter).forEach(function(j) {
          if ( !OSjs.Utils.inArray(['items', 'title', 'icon'], j) ) {
            li.setAttribute('data-' + j, iter[j]);
          }
        });
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

        _bindEvents(inner, iter, !exp, self.singleClick);

        li.appendChild(inner);

        if ( exp ) {
          child = _render.call(self, iter.items, li, null, level + 1);
          if ( self.expandLevel === true || (level !== false && self.expandLevel >= level) ) {
            child.style.display = 'block';
          }
          _bindSubEvents(exp, child, li, iter);
        }

        self.total++;
        ul.appendChild(li);

        if ( self.onCreateItem ) {
          self.onCreateItem(li, iter);
        }
        if ( self.onRenderItem ) {
          self.onRenderItem(li, iter);
        }
      });

      root.appendChild(ul);

      return ul;
    }

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

  TreeView.prototype.onGlobalKeyPress = function(ev) {
  };

  TreeView.prototype.setData = function(data, render) {
    this.total = 0;
    _DataView.prototype.setData.apply(this, arguments);
  };

  TreeView.prototype.getItemByKey = function(key, val) {
    function _search(list) {
      var ret = null;

      Object.keys(list).forEach(function(i) {
        if ( list[i][key] === val ) {
          ret = list[i];
        }

        if ( !ret && list[i].items ) {
          var tst = _search(list[i].items);
          if ( tst ) {
            ret = tst;
          }
        }

        return ret ? false : true;
      });

      return ret;
    }

    return _search.call(this, this.data);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.TreeView     = TreeView;

})(OSjs.GUI.GUIElement, OSjs.GUI._DataView);
