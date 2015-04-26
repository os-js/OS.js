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
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window Constructor
   */
  var ApplicationFirefoxMarketplaceWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationFirefoxMarketplaceWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 640,
      height: 400,
      allow_resize: false,
      allow_maximize: false
    }, app]);

    this.previewContainer = null;
  };

  ApplicationFirefoxMarketplaceWindow.prototype = Object.create(Window.prototype);

  ApplicationFirefoxMarketplaceWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Create window contents (GUI) here
    var left = document.createElement('div');
    left.className = 'ColumnLeft';

    var right = document.createElement('div');
    right.className = 'ColumnRight';

    var buttonContainer = document.createElement('div');
    buttonContainer.className = 'ButtonContainer';

    this.previewContainer = document.createElement('div');
    right.appendChild(this.previewContainer);

    var search = this._addGUIElement(new OSjs.GUI.Text('ApplicationSearch', {placeholder: 'Search marketplace...', onKeyPress: function(ev) {
      if ( ev.keyCode === Utils.Keys.ENTER ) {
        self.renderList(search.getValue());
      }
    }}), left);

    var packageList = this._addGUIElement(new OSjs.GUI.ListView('ApplicationList', {onSelect: function(ev, dom, obj) {
      self.showPreview(obj);
    }}), left);
    packageList.setColumns([
      {key: 'name', title: 'Name'},
      {key: 'description', title: 'Description', visible: false},
      {key: 'version', title: 'Version', width: 50},
      {key: 'author', title: 'Author', visible: false},
      {key: 'preview', title: 'Preview', visible: false},
      {key: 'homepage', title: 'Homepage', visible: false},
      {key: 'id', title: 'id', visible: false}
    ]);
    packageList.render();

    var buttonRefresh = this._addGUIElement(new OSjs.GUI.Button('ButtonMarketplaceRefresh', {label: 'Refresh', onClick: function() { // FIXME: Translation
      search.setValue('');
      self.renderList();
    }}), buttonContainer);

    var buttonRun = this._addGUIElement(new OSjs.GUI.Button('ButtonMarketplaceRun', {label: 'Launch Selected', onClick: function() { // FIXME: Translation
      self.launchSelected(packageList.getSelected());
    }}), buttonContainer);

    root.appendChild(left);
    root.appendChild(right);
    root.appendChild(buttonContainer);

    return root;
  };

  ApplicationFirefoxMarketplaceWindow.prototype._inited = function() {
    Window.prototype._inited.apply(this, arguments);

    // Window has been successfully created and displayed.
    // You can start communications, handle files etc. here
    this.renderList();
  };

  ApplicationFirefoxMarketplaceWindow.prototype.destroy = function() {
    // Destroy custom objects etc. here
    if ( this.previewContainer && this.previewContainer.parentNode ) {
      this.previewContainer.parentNode.removeChild(this.previewContainer);
    }
    this.previewContainer = null;

    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationFirefoxMarketplaceWindow.prototype.launchSelected = function(sel) {
    var self = this;
    if ( !sel || !sel.id ) {
      return;
    }

    this._toggleLoading(true);
    OSjs.Helpers.FirefoxMarketplace.getInstance().launch(sel.id, function() {
      self._toggleLoading(false);
    });
  };

  ApplicationFirefoxMarketplaceWindow.prototype.showPreview = function(item) {
    if ( !this.previewContainer ) { return; }
    Utils.$empty(this.previewContainer);

    if ( item ) {
      var h1 = document.createElement('h1');
      h1.appendChild(document.createTextNode(item.name));
      this.previewContainer.appendChild(h1);

      var h2 = document.createElement('h2');
      h2.appendChild(document.createTextNode(item.author));
      this.previewContainer.appendChild(h2);

      var h3 = document.createElement('h3');
      h3.appendChild(document.createTextNode(item.description));
      this.previewContainer.appendChild(h3);

      if ( item.homepage ) {
        var a = document.createElement('a');
        a.href = item.homepage;
        a.target = '_blank';
        a.appendChild(document.createTextNode('Homepage'));
        this.previewContainer.appendChild(a);
      }

      if ( item.preview ) {
        var img = document.createElement('img');
        img.alt = item.name;
        img.src = item.preview;
        this.previewContainer.appendChild(img);
      }
      return;
    }

    var text = document.createTextNode('No preview available');
    this.previewContainer.appendChild(text);
  };

  ApplicationFirefoxMarketplaceWindow.prototype.renderList = function(q) {
    var self = this;
    var search = this._getGUIElement('ApplicationSearch');
    var packageList = this._getGUIElement('ApplicationList');

    if ( !search || !packageList ) { return; }

    this._toggleLoading(true);

    this.showPreview();

    OSjs.Helpers.FirefoxMarketplace.createInstance({}, function(err, instance) {
      self._toggleLoading(false);
      if ( !err && !instance ) {
        err = 'No instance';
      }
      if ( err ) {
        alert('Failed initializing marketplace: ' + err);
        return;
      }

      self._toggleLoading(true);
      instance.search(q, function(err, list) {
        self._toggleLoading(false);
        if ( err ) {
          alert('Failed listing marketplace: ' + err);
          return;
        }

        var rows = [];
        list.forEach(function(i) {
          var preview;

          if ( i.previews ) {
            i.previews.forEach(function(p) {
              if ( preview ) { return; }

              if ( p && p.thumbnail_url ) {
                preview = p.thumbnail_url;
              }
            });
          }

          rows.push({
            name: i.name['en-US'] || i.name[Object.keys(i.name)[0]],
            version: i.current_version,
            description: i.description['en-US'],
            author: i.author,
            preview: preview,
            homepage: (i.homepage ? i.homepage['en-US'] : null) || null,
            id: i.id
          });
        });

        packageList.setRows(rows);
        packageList.render();
      });
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application constructor
   */
  var ApplicationFirefoxMarketplace = function(args, metadata) {
    Application.apply(this, ['ApplicationFirefoxMarketplace', args, metadata]);

    // You can set application variables here
  };

  ApplicationFirefoxMarketplace.prototype = Object.create(Application.prototype);

  ApplicationFirefoxMarketplace.prototype.destroy = function() {
    // Destroy communication, timers, objects etc. here

    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationFirefoxMarketplace.prototype.init = function(settings, metadata) {
    var self = this;

    Application.prototype.init.apply(this, arguments);

    // Create your main window
    var mainWindow = this._addWindow(new ApplicationFirefoxMarketplaceWindow(this, metadata));

    // Do other stuff here
  };

  ApplicationFirefoxMarketplace.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    // Make sure we kill our application if main window was closed
    if ( msg == 'destroyWindow' && obj._name === 'ApplicationFirefoxMarketplaceWindow' ) {
      this.destroy();
    }
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationFirefoxMarketplace = OSjs.Applications.ApplicationFirefoxMarketplace || {};
  OSjs.Applications.ApplicationFirefoxMarketplace.Class = ApplicationFirefoxMarketplace;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
