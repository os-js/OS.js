/*!
 * OS.js - JavaScript Operating System
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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationFirefoxMarketplaceWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationFirefoxMarketplaceWindow', {
      icon: metadata.icon,
      title: metadata.name,
      min_width: 400,
      width: 500,
      min_height: 400,
      height: 400
    }, app, scheme]);
  }

  ApplicationFirefoxMarketplaceWindow.prototype = Object.create(Window.prototype);
  ApplicationFirefoxMarketplaceWindow.constructor = Window.prototype;

  ApplicationFirefoxMarketplaceWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'FirefoxMarketplaceWindow', root);

    var view = scheme.find(this, 'View');
    var preview = scheme.find(this, 'Preview');

    function showPreview(item) {
      Utils.$empty(preview.$element);
      if ( !item ) { return; }
      scheme.render(self, 'FirefoxMarketplacePreview', preview);
      scheme.find(self, 'LabelName').set('value', item.name);
      scheme.find(self, 'LabelAuthor').set('value', item.author);
      scheme.find(self, 'LabelDescription').set('value', item.description, true);
      scheme.find(self, 'PreviewImage').set('src', item.preview);
    }

    function launch(p) {
      self._toggleLoading(true);
      OSjs.Helpers.FirefoxMarketplace.getInstance().launch(p.id, function() {
        self._toggleLoading(false);
      });
    }

    function renderList(q) {
      showPreview();

      self._toggleLoading(true);

      app.getList(q, function(error, result) {
        self._toggleLoading(false);

        if ( error ) {
          API.createDialog('Alert', {
            message: error
          }, null, self);
          return;
        }

        var add = [];
        result.forEach(function(iter) {
          add.push({
            value: iter,
            id: iter.id,
            columns: [
              {label: iter.name},
              {label: iter.version}
            ]
          });
        });

        view.clear();
        view.add(add);
      });
    }

    scheme.find(this, 'Search').on('enter', function(ev) {
      renderList(ev.detail || null);
    });

    view.set('columns', [
      {label: 'Name', grow: 1, shrink: 1},
      {label: 'Version', basis: '60px', grow: 0, shrink: 0}
    ]);

    scheme.find(this, 'ButtonRefresh').on('click', function() {
      renderList();
    });

    scheme.find(this, 'ButtonLaunch').on('click', function() {
      var selected = view.get('selected');
      if ( selected && selected[0] && typeof selected[0].data !== 'undefined' ) {
        launch(selected[0].data);
      }
    });

    view.on('select', function(ev) {
      if ( ev && ev.detail && ev.detail.entries[0] ) {
        showPreview(ev.detail.entries[0].data);
      }
    });

    view.on('activate', function(ev) {
      if ( ev && ev.detail && ev.detail.entries[0] ) {
        launch(ev.detail.entries[0].data);
      }
    });

    renderList();

    return root;
  };

  ApplicationFirefoxMarketplaceWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationFirefoxMarketplace = function(args, metadata) {
    Application.apply(this, ['ApplicationFirefoxMarketplace', args, metadata]);
  };

  ApplicationFirefoxMarketplace.prototype = Object.create(Application.prototype);
  ApplicationFirefoxMarketplace.constructor = Application;

  ApplicationFirefoxMarketplace.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationFirefoxMarketplace.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationFirefoxMarketplaceWindow(self, metadata, scheme));

      onInited();
    });
    this._setScheme(scheme);
  };

  ApplicationFirefoxMarketplace.prototype.getList = function(filter, callback) {

    OSjs.Helpers.FirefoxMarketplace.createInstance({}, function(error, instance) {
      if ( error || !instance ) {
        callback('Failed to init marketplace: ' + (error || 'No instance'));
        return;
      }

      instance.search(filter, function(err, list) {
        if ( err ) {
          callback('Failed listing marketplace: ' + err);
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

        callback(false, rows);
      });
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationFirefoxMarketplace = OSjs.Applications.ApplicationFirefoxMarketplace || {};
  OSjs.Applications.ApplicationFirefoxMarketplace.Class = ApplicationFirefoxMarketplace;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
