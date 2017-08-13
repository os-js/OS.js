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
import * as FS from 'utils/fs';
import * as VFS from 'vfs/fs';
import * as DOM from 'utils/dom';
import * as GUI from 'utils/gui';
import * as Utils from 'utils/misc';
import * as Events from 'utils/events';
import * as Menu from 'gui/menu';
import GUIElement from 'gui/element';
import GUIDataView from 'gui/dataview';
import PackageManager from 'core/package-manager';
import SettingsManager from 'core/settings-manager';
import FileMetadata from 'vfs/file';
import DateExtended from 'helpers/date';
import Theme from 'core/theme';
import {_} from 'core/locales';
import {getConfig, getDefaultPath} from 'core/config';

/////////////////////////////////////////////////////////////////////////////
// ABSTRACTION HELPERS
/////////////////////////////////////////////////////////////////////////////

let _iconSizes = { // Defaults to 16x16
  'gui-icon-view': '32x32'
};

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

function getFileIcon(iter, size) {
  if ( iter.icon && typeof iter.icon === 'object' ) {
    if ( iter.icon.application ) {
      return PackageManager.getPackageResource(iter.icon.filename, iter.icon.application);
    }
    return Theme.getIcon(iter.icon.filename, size, iter.icon.application);
  }

  const icon = 'status/dialog-question.png';
  return Theme.getFileIcon(iter, size, icon);
}

function getFileSize(iter) {
  let filesize = '';
  if ( iter.type !== 'dir' && iter.size >= 0 ) {
    filesize = FS.humanFileSize(iter.size);
  }
  return filesize;
}

const removeExtension = (() => {
  let mimeConfig;

  return (str, opts) => {
    if ( !mimeConfig ) {
      mimeConfig = getConfig('MIME.mapping');
    }

    if ( opts.extensions === false ) {
      let ext = FS.filext(str);
      if ( ext ) {
        ext = '.' + ext;
        if ( mimeConfig[ext] ) {
          str = str.substr(0, str.length - ext.length);
        }
      }
    }
    return str;
  };
})();

function getDateFromStamp(stamp) {
  if ( typeof stamp === 'string' ) {
    let date = null;
    try {
      date = new Date(stamp);
      //date = new Date(stamp.replace('T', ' ').replace(/\..+/, ''));
    } catch ( e ) {}

    if ( date ) {
      return DateExtended.format(date);
    }
  }
  return stamp;
}

function getListViewColumns(cls, iter, opts) {
  opts = opts || {};

  const columnMapping = {
    filename: {
      label: 'LBL_FILENAME',
      icon: () => {
        return getFileIcon(iter);
      },
      value: () => {
        return removeExtension(iter.filename, opts);
      }
    },
    mime: {
      label: 'LBL_MIME',
      size: '100px',
      icon: () => {
        return null;
      },
      value: () => {
        return iter.mime;
      }
    },
    mtime: {
      label: 'LBL_MODIFIED',
      size: '160px',
      icon: () => {
        return null;
      },
      value: () => {
        return getDateFromStamp(iter.mtime);
      }
    },
    ctime: {
      label: 'LBL_CREATED',
      size: '160px',
      icon: () => {
        return null;
      },
      value: () => {
        return getDateFromStamp(iter.ctime);
      }
    },
    size: {
      label: 'LBL_SIZE',
      size: '120px',
      icon: () => {
        return null;
      },
      value: () => {
        return getFileSize(iter);
      }
    }
  };

  let defColumns = ['filename', 'mime', 'size'];
  let useColumns = defColumns;

  if ( !opts.defaultcolumns ) {
    const vfsOptions = Utils.cloneObject(SettingsManager.get('VFS') || {});
    const scandirOptions = vfsOptions.scandir || {};
    useColumns = scandirOptions.columns || defColumns;
  }

  const columns = [];
  const sortBy = cls.$element.getAttribute('data-sortby');
  const sortDir = cls.$element.getAttribute('data-sortdir');

  useColumns.forEach((key, idx) => {
    const map = columnMapping[key];

    if ( iter ) {
      columns.push({
        sortBy: key,
        label: map.value(),
        icon: map.icon(),
        textalign: idx === 0 ? 'left' : 'right'
      });
    } else {
      columns.push({
        sortBy: key,
        sortDir: key === sortBy ? sortDir : null,
        label: _(map.label),
        size: map.size || '',
        resizable: idx > 0,
        textalign: idx === 0 ? 'left' : 'right'
      });
    }
  });

  return columns;
}

function scandir(dir, opts, cb, oncreate) {
  const file = new FileMetadata(dir);
  file.type  = 'dir';

  const scanopts = {
    backlink: opts.backlink,
    showDotFiles: opts.dotfiles === true,
    showFileExtensions: opts.extensions === true,
    mimeFilter: opts.filter || [],
    typeFilter: opts.filetype || null,
    sortBy: opts.sortby,
    sortDir: opts.sortdir
  };

  VFS.scandir(file, scanopts).then((result) => {
    const list = [];
    const summary = {size: 0, directories: 0, files: 0, hidden: 0};

    function isHidden(iter) {
      return (iter.filename || '').substr(0) === '.';
    }

    (result || []).forEach((iter) => {
      list.push(oncreate(iter));

      summary.size += iter.size || 0;
      summary.directories += iter.type === 'dir' ? 1 : 0;
      summary.files += iter.type !== 'dir' ? 1 : 0;
      summary.hidden += isHidden(iter) ? 1 : 0;
    });

    cb(false, list, summary);
  }).catch(cb);
}

function readdir(cls, dir, done, sopts) {
  const childView = cls.getChildView();
  if ( !childView ) {
    return;
  }
  sopts = sopts || {};

  const vfsOptions = Utils.cloneObject(SettingsManager.get('VFS') || {});
  const scandirOptions = vfsOptions.scandir || {};

  const el = cls.$element;
  const target = childView.$element;
  const tagName = target.tagName.toLowerCase();
  el.setAttribute('data-path', dir);

  const opts = {filter: null, backlink: sopts.backlink};
  function setOption(s, d, c, cc) {
    if ( el.hasAttribute(s) ) {
      opts[d] = c(el.getAttribute(s));
    } else {
      opts[d] = (cc || function() {})();
    }
  }

  setOption('data-sortby', 'sortby', (val) => {
    return val;
  });
  setOption('data-sortdir', 'sortdir', (val) => {
    return val;
  });
  setOption('data-dotfiles', 'dotfiles', (val) => {
    return val === 'true';
  }, () => {
    return scandirOptions.showHiddenFiles === true;
  });
  setOption('data-extensions', 'extensions', (val) => {
    return val === 'true';
  }, () => {
    return scandirOptions.showFileExtensions === true;
  });
  setOption('data-filetype', 'filetype', (val) => {
    return val;
  });
  setOption('data-defaultcolumns', 'defaultcolumns', (val) => {
    return val === 'true';
  });

  try {
    opts.filter = JSON.parse(el.getAttribute('data-filter'));
  } catch ( e ) {
  }

  scandir(dir, opts, (error, result, summary) => {
    if ( tagName === 'gui-list-view' ) {
      cls.getChildView().set('zebra', true);
      if ( sopts.headers !== false ) {
        cls.getChildView().set('columns', getListViewColumns(cls, null, opts));
      }
    }

    done(error, result, summary);
  }, (iter) => {
    const tooltip = Utils.format('{0}\n{1}\n{2} {3}', iter.type.toUpperCase(), iter.filename, getFileSize(iter), iter.mime || '');

    function _createEntry() {
      const row = {
        value: iter,
        id: iter.id || removeExtension(iter.filename, opts),
        label: iter.filename,
        tooltip: tooltip,
        icon: getFileIcon(iter, _iconSizes[tagName] || '16x16')
      };

      if ( tagName === 'gui-tree-view' && iter.type === 'dir' ) {
        if ( iter.filename !== '..' ) {
          row.entries = [{
            label: 'Loading...'
          }];
        }
      }

      return row;
    }

    // List view works a little differently
    if ( tagName !== 'gui-list-view' ) {
      return _createEntry();
    }

    return {
      value: iter,
      id: iter.id || iter.filename,
      tooltip: tooltip,
      columns: getListViewColumns(cls, iter, opts)
    };
  });
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

/**
 * Element: 'gui-file-view'
 *
 * Abstraction layer for displaying files within Icon-, Tree- or List Views
 *
 * For more properties and events etc, see 'dataview'
 *
 * <pre><code>
 *   property  multiple    boolean       If multiple elements are selectable
 *   property  type        String        Child type
 *   property  filter      Array         MIME Filters
 *   property  dotfiles    boolean       Show dotfiles (default=true)
 *   property  extensions  boolean       Show file extensions (default=true)
 *   action    chdir                     Change directory => fn(args)  (args = {path: '', done: function() })
 * </code></pre>
 *
 * @see GUIListView
 * @see GUITreeView
 * @see GUIIconView
 */
class GUIFileView extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-file-view'
    }, this);
  }

  on(evName, callback, params) {
    if ( (['activate', 'select', 'contextmenu', 'sort']).indexOf(evName) !== -1 ) {
      evName = '_' + evName;
    }

    const el = this.$element;
    if ( evName === '_contextmenu' ) {
      el.setAttribute('data-has-contextmenu', 'true');
    }

    Events.$bind(el, evName, callback.bind(this), params);
    return this;
  }

  set(param, value, arg, arg2) {
    const el = this.$element;

    if ( param === 'type' ) {
      const firstChild = el.children[0];
      if ( firstChild && firstChild.tagName.toLowerCase() === value ) {
        return true;
      }

      el.setAttribute('data-type', value);
      this.buildChildView();

      if ( typeof arg === 'undefined' || arg === true ) {
        this.chdir({
          path: el.getAttribute('data-path')
        });
      }
      return this;
    } else if ( (['filter', 'dotfiles', 'filetype', 'extensions', 'defaultcolumns', 'sortby', 'sortdir']).indexOf(param) >= 0 ) {
      GUI.setProperty(el, param, value);
      return this;
    }

    const childView = this.getChildView();
    if ( childView ) {
      return childView.set.apply(childView, arguments);
    }
    return GUIDataView.prototype.set.apply(this, arguments);
  }

  build() {
    if ( this.childView ) {
      return this;
    }

    this.buildChildView();

    const el = this.$element;

    Events.$bind(el, '_expand', (ev) => {
      const target = ev.detail.element;
      if ( target.getAttribute('data-was-rendered') ) {
        return;
      }

      if ( ev.detail.expanded ) {
        const entry = ev.detail.entries[0].data;
        target.setAttribute('data-was-rendered', String(true));
        readdir(this, entry.path, (error, result, summary) => {
          if ( !error ) {
            target.querySelectorAll('gui-tree-view-entry').forEach((e) => {
              DOM.$remove(e);
            });

            const childView = this.getChildView();
            if ( childView ) {
              childView.add({
                entries: result,
                parentNode: target
              });
            }
          }
        }, {backlink: false});
      }
    });

    return this;
  }

  values() {
    const childView = this.getChildView();
    if ( childView ) {
      return childView.values();
    }
    return null;
  }

  contextmenu(ev) {
    const vfsOptions = SettingsManager.instance('VFS');
    const scandirOptions = (vfsOptions.get('scandir') || {});

    function setOption(opt, toggle) {
      const opts = {scandir: {}};
      opts.scandir[opt] = toggle;
      vfsOptions.set(null, opts, true);
    }

    Menu.create([{
      title: _('LBL_SHOW_HIDDENFILES'),
      type: 'checkbox',
      checked: scandirOptions.showHiddenFiles === true,
      onClick: () => {
        setOption('showHiddenFiles', !scandirOptions.showHiddenFiles);
      }
    }, {
      title: _('LBL_SHOW_FILEEXTENSIONS'),
      type: 'checkbox',
      checked: scandirOptions.showFileExtensions === true,
      onClick: () => {
        setOption('showFileExtensions', !scandirOptions.showFileExtensions);
      }
    }], ev);
  }

  chdir(args) {
    let childView = this.getChildView();
    if ( !childView ) {
      childView = this.buildChildView();
    }

    const cb = args.done || function() {};
    const dir = args.path || getDefaultPath();
    const child = childView;
    const el = this.$element;

    clearTimeout(el._readdirTimeout);
    el._readdirTimeout = setTimeout(() => {
      readdir(this, dir, (error, result, summary) => {
        if ( error ) {
          OSjs.error(_('ERR_VFSMODULE_XHR_ERROR'), _('ERR_VFSMODULE_SCANDIR_FMT', dir), error);
        } else {
          child.clear();
          child.add(result);
        }
        cb(error, summary);
      }, args.opts);
    }, 50); // Prevent exessive calls
  }

  getChildViewType() {
    let type = this.$element.getAttribute('data-type') || 'list-view';
    if ( !type.match(/^gui\-/) ) {
      type = 'gui-' + type;
    }
    return type;
  }

  getChildView() {
    return GUIElement.createFromNode(this.$element.children[0]);
  }

  buildChildView() {
    const el = this.$element;
    const type = this.getChildViewType();
    const childView = this.getChildView();

    if ( childView ) {
      if ( childView.$element && childView.$element.tagName.toLowerCase() === type ) {
        return null;
      }
    }

    DOM.$empty(el);

    const nel = GUIElement.create(type, {'draggable': true, 'draggable-type': 'file'});
    nel.build();

    nel.on('select', (ev) => {
      el.dispatchEvent(new CustomEvent('_select', {detail: ev.detail}));
    });
    nel.on('activate', (ev) => {
      el.dispatchEvent(new CustomEvent('_activate', {detail: ev.detail}));
    });
    nel.on('sort', (ev) => {
      el.setAttribute('data-sortby', String(ev.detail.sortBy));
      el.setAttribute('data-sortdir', String(ev.detail.sortDir));

      this.chdir({
        sopts: {
          headers: false
        },
        path: el.getAttribute('data-path')
      });

      el.dispatchEvent(new CustomEvent('_sort', {detail: ev.detail}));
    });
    nel.on('contextmenu', (ev) => {
      if ( !el.hasAttribute('data-has-contextmenu') || el.hasAttribute('data-has-contextmenu') === 'false' ) {
        this.contextmenu(ev);
      }
      el.dispatchEvent(new CustomEvent('_contextmenu', {detail: ev.detail}));
    });

    if ( type === 'gui-tree-view' ) {
      nel.on('expand', (ev) => {
        el.dispatchEvent(new CustomEvent('_expand', {detail: ev.detail}));
      });
    }

    el.setAttribute('role', 'region');
    el.appendChild(nel.$element);

    return nel;
  }

}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default {
  GUIFileView: GUIFileView
};

