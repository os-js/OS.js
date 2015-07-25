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
(function(Service, Utils, API, VFS) {

  var DeveloperService = function(args, metadata) {
    Service.apply(this, ['DeveloperService', args, metadata]);
    this.currentManifest = Utils.cloneObject(API.getDefaultPackages());
  };

  DeveloperService.prototype = Object.create(Service.prototype);

  DeveloperService.prototype.destroy = function() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.destroyNotificationIcon('DeveloperServiceNotificationIcon');
    }
    return Service.prototype.destroy.apply(this, arguments);
  };

  DeveloperService.prototype.init = function(settings, metadata) {
    Service.prototype.init.apply(this, arguments);

    var wm = OSjs.Core.getWindowManager();
    var self = this;

    function show(ev) {
      var menu = [];
      menu.push({
        title: 'Reload Manifest',
        onClick: function() {
          self.reloadManifest(true);
        }
      });
      OSjs.API.createMenu(menu, ev);
      return false;
    }

    if ( wm ) {
      wm.createNotificationIcon('DeveloperServiceNotificationIcon', {
        onContextMenu: show,
        onClick: show,
        onInited: function(el) {
          if ( el.firstChild ) {
            var img = document.createElement('img');
            img.src = OSjs.API.getIcon('categories/gnome-devel.png');
            el.firstChild.appendChild(img);
          }
        }
      });
    }
  };

  DeveloperService.prototype._onMessage = function(obj, msg, args) {
    Service.prototype._onMessage.apply(this, arguments);
  };

  DeveloperService.prototype.reloadManifest = function(compare) {
    var self = this;

    function _fetched() {
      var newManifest = Utils.cloneObject(API.getDefaultPackages());
      var currentManifest = Utils.cloneObject(self.currentManifest);
      self.compareManifest(currentManifest, newManifest);
      self.currentManifest = newManifest;
    }

    var preloads = [{type: 'javascript', src: 'packages.js', force: true}];
    Utils.preload(preloads, function(total, errors) {
      if ( !errors ) {
        _fetched();
      }
    });
  };

  DeveloperService.prototype.compareManifest = function(oldManifest, newManifest) {
    var changed = [];

    function compare(p, oldFiles, newFiles) {
      var o = {};
      oldFiles.forEach(function(i) {
        o[i.src] = i.mtime;
      });

      newFiles.forEach(function(i) {
        if ( o[i.src] && i.mtime != o[i.src] ) {
          if ( changed.indexOf(p) === -1 ) {
            console.warn("File", i, "has changed in", p);
            changed.push(p);
          }
        }
      });
    }

    Object.keys(oldManifest).forEach(function(op) {
      var iter = oldManifest[op];
      var niter = newManifest[op];

      if ( iter && niter ) {
        compare(op, iter.preload, niter.preload);
      }
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.DeveloperService = OSjs.Applications.DeveloperService || {};
  OSjs.Applications.DeveloperService.Class = DeveloperService;

})(OSjs.Core.Service, OSjs.Utils, OSjs.API, OSjs.VFS);
