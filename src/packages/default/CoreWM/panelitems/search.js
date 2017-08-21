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
/*eslint valid-jsdoc: "off"*/
import PanelItem from '../panelitem';

const DOM = OSjs.require('utils/dom');
const Hooks = OSjs.require('helpers/hooks');
const Theme = OSjs.require('core/theme');
const Events = OSjs.require('utils/events');
const Locales = OSjs.require('core/locales');
const Keycodes = OSjs.require('utils/keycodes');
const Process = OSjs.require('core/process');
const FileMetadata = OSjs.require('vfs/file');
const SearchEngine = OSjs.require('core/search-engine');
const WindowManager = OSjs.require('core/window-manager');

export default class PanelItemSearch extends PanelItem {
  constructor(settings) {
    super('PanelItemSearch corewm-panel-right', 'Search', settings, {
    });

    this.$ul = null;
    this.$box = null;
    this.$input = null;

    this.$message = null;
    this.visible = false;
    this.hookId = -1;
    this.currentIndex = -1;
    this.currentCount = 0;
  }

  init() {
    const root = super.init(...arguments);

    const img = document.createElement('img');
    img.src = Theme.getIcon('actions/system-search.png');

    const input = document.createElement('input');
    input.setAttribute('type', 'text');

    const guinput = document.createElement('gui-text');
    guinput.appendChild(input);

    const ul = document.createElement('ul');

    this.$message = document.createElement('div');
    this.$message.appendChild(document.createTextNode(Locales._('SEARCH_LOADING')));

    this.$box = document.createElement('corewm-search');
    this.$box.className = 'custom-notification';
    this.$box.appendChild(guinput);
    this.$box.appendChild(this.$message);
    this.$box.appendChild(ul);

    const self = this;
    const keyEvents = {};
    keyEvents[Keycodes.DOWN] = () => this.navigateDown();
    keyEvents[Keycodes.UP] = () => this.navigateUp();
    keyEvents[Keycodes.ESC] = () => this.hide();
    keyEvents[Keycodes.ENTER] = function(ev) {
      if ( this.value.length ) {
        self.search(this.value);
        this.value = '';
      } else {
        self.navigateOpen();
      }
    };

    Hooks.addHook('menuBlur', () => this.hide());

    Events.$bind(root, 'click', function(ev) {
      ev.stopPropagation();

      if ( self.visible ) {
        self.hide();
      } else {
        self.show();
      }
    });

    Events.$bind(input, 'mousedown', (ev) => ev.stopPropagation());

    Events.$bind(input, 'keydown', function(ev) {
      /* eslint no-invalid-this: "off" */
      if ( keyEvents[ev.keyCode] ) {
        ev.preventDefault();
        ev.stopPropagation();

        keyEvents[ev.keyCode].call(this, ev);
      }
    });

    Events.$bind(ul, 'mousedown', (ev) => ev.stopPropagation());

    Events.$bind(ul, 'click', (ev) => {
      const target = ev.target;
      if ( target.tagName === 'LI' ) {
        self.launch(target);
      }
    });

    Events.$bind(this.$box, 'mousedown', () => {
      if ( input ) {
        input.focus();
      }
    });

    const li = document.createElement('li');
    li.appendChild(img);

    this.$ul = ul;
    this.$input = input;
    this._$container.appendChild(li);

    document.body.appendChild(this.$box);

    return root;
  }

  applySettings() {
  }

  openSettings() {
    Process.create('ApplicationSettings', {category: 'search'});
  }

  destroy() {
    if ( this.hookId >= 0 ) {
      Hooks.removeHook(this.hookId);
    }

    Events.$unbind(this._$root, 'click');
    Events.$unbind(this.$input, 'mousedown');
    Events.$unbind(this.$input, 'keydown');
    Events.$unbind(this.$ul, 'mousedown');
    Events.$unbind(this.$ul, 'click');
    Events.$unbind(this.$box, 'mousedown');

    this.$message = DOM.$remove(this.$message);
    this.$input = DOM.$remove(this.$input);
    this.$box = DOM.$remove(this.$box);
    this.$ul = DOM.$remove(this.$ul);

    return super.destroy(...arguments);
  }

  launch(target) {
    const launch = target.getAttribute('data-launch');
    const args = JSON.parse(target.getAttribute('data-args'));
    const file = target.getAttribute('data-file');
    const mime = target.getAttribute('data-mime');
    const type = target.getAttribute('data-type');

    if ( file ) {
      if ( type === 'dir' ) {
        Process.create('ApplicationFileManager', {path: file});
      } else {
        Process.createFromFile(new FileMetadata(file, mime));
      }
    } else {
      Process.create(launch, args);
    }

    this.hide();
  }

  show() {
    if ( !this.$box || this.visible ) {
      return;
    }

    const wm = WindowManager.instance;
    const space = wm.getWindowSpace(true);
    const input = this.$box.querySelector('input');

    DOM.$empty(this.$box.querySelector('ul'));
    this.$box.style.marginTop = String(space.top) + 'px';
    this.$box.setAttribute('data-visible', String(true));

    if ( input ) {
      input.value = '';
      input.focus();
    }
    this.visible = true;

    this.$message.style.display = 'none';
  }

  hide() {
    if ( !this.$box || !this.visible ) {
      return;
    }

    this.$box.setAttribute('data-visible', String(false));
    this.visible = false;
  }

  search(q) {
    if ( !this.$box ) {
      return;
    }

    this.currentIndex = -1;
    this.currentCount = 0;

    DOM.$empty(this.$message);
    this.$message.appendChild(document.createTextNode(Locales._('SEARCH_LOADING')));
    this.$message.style.display = 'block';

    SearchEngine.search(q, {limit: 10, recursive: true}).then((result) => {
      this.renderResult(result);
    }).catch((errors) => {
      console.error('PanelItemSearch::search()', 'errors', errors);
    });
  }

  renderResult(list) {
    if ( !this.$box ) {
      return;
    }

    const root = this.$box.querySelector('ul');
    DOM.$empty(root);

    this.currentCount = list.length;

    if ( this.currentCount ) {
      this.$message.style.display = 'none';
    } else {
      DOM.$empty(this.$message);
      this.$message.appendChild(document.createTextNode(Locales._('SEARCH_NO_RESULTS')));
      this.$message.style.display = 'block';
    }

    list.forEach(function(l) {
      const img = document.createElement('img');
      img.src = l.icon;

      const title = document.createElement('div');
      title.className = 'Title';
      title.appendChild(document.createTextNode(l.title));

      const description = document.createElement('div');
      description.className = 'Message';
      description.appendChild(document.createTextNode(l.description));

      const node = document.createElement('li');
      node.setAttribute('data-launch', l.launch.application);
      node.setAttribute('data-args', JSON.stringify(l.launch.args));
      if ( l.launch.file ) {
        node.setAttribute('data-file', l.launch.file.path);
        node.setAttribute('data-mime', l.launch.file.mime);
        node.setAttribute('data-type', l.launch.file.type);
      }

      node.appendChild(img);
      node.appendChild(title);
      node.appendChild(description);
      root.appendChild(node);
    });
  }

  updateSelection() {
    const root = this.$box.querySelector('ul');
    const child = root.children[this.currentIndex];

    root.querySelectorAll('li').forEach(function(el) {
      DOM.$removeClass(el, 'active');
    });

    DOM.$addClass(child, 'active');
  }

  navigateUp() {
    if ( !this.currentCount ) {
      return;
    }

    if ( this.currentIndex > 0 ) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.currentCount - 1;
    }

    this.updateSelection();
  }

  navigateDown() {
    if ( !this.currentCount ) {
      return;
    }

    if ( this.currentIndex < 0 || this.currentIndex >= (this.currentCount - 1) ) {
      this.currentIndex = 0;
    } else {
      this.currentIndex++;
    }

    this.updateSelection();
  }

  navigateOpen() {
    if ( this.currentIndex === -1 || !this.currentCount ) {
      return;
    }

    const root = this.$box.querySelector('ul');
    const child = root.children[this.currentIndex];
    if ( child ) {
      this.launch(child);
    }
  }

}
