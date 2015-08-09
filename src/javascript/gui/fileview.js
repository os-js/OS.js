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
(function(API, Utils, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function getChildView(el) {
    return el.children[0];
  }

  function buildChildView(el) {
    var type = el.getAttribute('data-type') || 'list-view';
    if ( !type.match(/^gui\-/) ) {
      type = 'gui-' + type;
    }

    var nel = new GUI.ElementDataView(GUI.Helpers.createElement(type, {'draggable': true, 'draggable-type': 'file'}));
    GUI.Elements[type].build(nel.$element);

    nel.on('select', function(ev) {
      el.dispatchEvent(new CustomEvent('_select', {detail: ev.detail}));
    });
    nel.on('activate', function(ev) {
      el.dispatchEvent(new CustomEvent('_activate', {detail: ev.detail}));
    });

    if ( type === 'gui-list-view' ) {
      nel.set('columns', [
        {label: API._('LBL_FILENAME'), grow: 1, shrink: 1},
        {label: API._('LBL_MIME'), basis: '100px', grow: 0, shrink: 0, textalign: 'right'},
        {label: API._('LBL_SIZE'), basis: '120px', grow: 0, shrink: 0, textalign: 'right'}
      ]);
    }

    el.appendChild(nel.$element);
  }

  function scandir(tagName, dir, opts, cb, oncreate) {
    var file = new VFS.File(dir);
    file.type  = 'dir';

    var scanopts = {
      showDotFiles: opts.dotfiles === true,
      mimeFilter:   opts.filter || [],
      typeFilter:   opts.filetype || null
    };

    VFS.scandir(file, function(error, result) {
      if ( error ) { cb(error); return; }

      var list = [];
      var summary = {size: 0, directories: 0, files: 0, hidden: 0};
      (result || []).forEach(function(iter) {
        list.push(oncreate(iter));

        summary.size += iter.size || 0;
        summary.directories += iter.type === 'dir' ? 1 : 0;
        summary.files += iter.type !== 'dir' ? 1 : 0;
        summary.hidden += iter.filename.substr(0) === '.' ? 1 : 0;
      });

      cb(false, list, summary);
    }, scanopts);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-file-view'
   *
   * Abstraction layer for displaying files within Icon-, Tree- or List Views
   *
   * Events:
   *  select        When an entry was selected (click) => fn(ev)
   *  activate      When an entry was activated (doubleclick) => fn(ev)
   *
   * Parameters:
   *  type      String      Child type
   *  filter    Array       MIME Filters
   *  dotfiles  boolean     Show dotfiles
   *
   * Actions:
   *  chdir(args)   Change directory (args = {path: '', done: function() })
   *
   * @api OSjs.GUI.Elements.gui-file-view
   * @see OSjs.GUI.Elements.gui-list-view
   * @see OSjs.GUI.Elements.gui-tree-view
   * @see OSjs.GUI.Elements.gui-icon-view
   * @class
   */
  GUI.Elements['gui-file-view'] = {
    bind: function(el, evName, callback, params) {
      if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    set: function(el, param, value, arg) {
      if ( param === 'type' ) {
        var firstChild = el.children[0];
        if ( firstChild && firstChild.tagName.toLowerCase() === value ) {
          return true;
        }

        Utils.$empty(el);
        el.setAttribute('data-type', value);
        buildChildView(el);

        if ( typeof arg === 'undefined' || arg === true ) {
          GUI.Elements['gui-file-view'].call(el, 'chdir', {
            path: el.getAttribute('data-path')
          });
        }
        return true;
      } else if ( (['filter', 'dotfiles', 'filetype']).indexOf(param) >= 0 ) {
        GUI.Helpers.setProperty(el, param, value);
        return true;
      }

      var target = getChildView(el);
      if ( target ) {
        var tagName = target.tagName.toLowerCase();
        GUI.Elements[tagName].set(target, param, value, arg);
        return true;
      }

      return false;
    },
    build: function(el) {
      buildChildView(el);
    },
    values: function(el) {
      var target = getChildView(el);
      if ( target ) {
        var tagName = target.tagName.toLowerCase();
        return GUI.Elements[tagName].values(target);
      }
      return null;
    },
    call: function(el, method, args) {
      args = args || {};
      args.done = args.done || function() {};

      var target = getChildView(el);
      if ( target ) {
        var tagName = target.tagName.toLowerCase();

        if ( method === 'chdir' ) {
          var t = new GUI.ElementDataView(target);
          var dir = args.path || OSjs.API.getDefaultPath('/');
          el.setAttribute('data-path', dir);

          var opts = {
            filter: null,
            dotfiles: el.getAttribute('data-dotfiles') === 'true',
            filetype: el.getAttribute('data-filetype')
          };

          try {
            opts.filter = JSON.parse(el.getAttribute('data-filter'));
          } catch ( e ) {
          }

          scandir(tagName, dir, opts, function(error, result, summary) {
            if ( !error ) {
              t.clear();
              t.add(result);
            }

            args.done(error, summary);
          }, function(iter) {
            function _getIcon(iter, size) {
              var icon = 'status/gtk-dialog-question.png';
              return API.getFileIcon(iter, size, icon);
            }

            var filesize = Utils.humanFileSize(iter.size);
            var tooltip = Utils.format('{0}\n{1}\n{2} {3}', iter.type.toUpperCase(), iter.filename, filesize, iter.mime || '');
            if ( tagName === 'gui-icon-view' || tagName === 'gui-tree-view' ) {
              return {
                value: iter,
                id: iter.id || iter.filename,
                label: iter.filename,
                tooltip: tooltip,
                icon: _getIcon(iter, tagName === 'gui-icon-view' ? '32x32' : '16x16')
              };
            }

            return {
              value: iter,
              id: iter.id || iter.filename,
              tooltip: tooltip,
              columns: [
                {label: iter.filename, icon: _getIcon(iter)},
                {label: iter.mime, textalign: 'right'},
                {label: filesize, textalign: 'right'}
              ]
            };
          });

          return;
        }

        GUI.Elements[tagName].call(target, method, args);
      }
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
