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
(function(Service, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // SERVICE
  /////////////////////////////////////////////////////////////////////////////

  function ArduinoService(args, metadata) {
    Service.apply(this, ['ArduinoService', args, metadata]);

    this.pollingNetwork = false;
    this.pollingInterval = null;
    this.cache = {
      devices: {}
    };
  }

  ArduinoService.prototype = Object.create(Service.prototype);
  ArduinoService.constructor = Service;

  ArduinoService.prototype.destroy = function() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.destroyNotificationIcon('_ArduinoNetworkNotification');
      wm.destroyNotificationIcon('_ArduinoWIFINotification');
    }

    this.cache = {};
    this.pollingInterval = clearInterval(this._pollingInteval);

    return Service.prototype.destroy.apply(this, arguments);
  };

  ArduinoService.prototype.init = function(settings, metadata, onInited) {
    Service.prototype.init.apply(this, arguments);

    var self = this;
    var wm = OSjs.Core.getWindowManager();

    function showNetworkContextMenu(ev) {
      var mnu = [];
      var devs = self.cache.devices;

      function createSubItem(d, idx) {
        if ( idx > 0 ) {
          mnu.push({title: '<hr />', titleHTML: true});
        }

        mnu.push({
          title: '<b>' + d + '</b>',
          titleHTML: true
        });

        Object.keys(devs[d]).forEach(function(i) {
          mnu.push({
            title: i + ': ' + devs[d][i]
          });
        });
      }

      Object.keys(devs).forEach(function(d, idx) {
        createSubItem(d, idx);
      });

      OSjs.API.createMenu(mnu, ev);
    }

    function showWIFIContextMenu(ev) {
      var mnu = [
        {titleHTML: true, title: '<b>Status:</b> null'},
        {titleHTML: true, title: '<b>SSID:</b> null'},
        {titleHTML: true, title: '<b>Security:</b> null'}
      ];
      OSjs.API.createMenu(mnu, ev);
    }

    wm.createNotificationIcon('_ArduinoNetworkNotification', {
      onContextMenu: showNetworkContextMenu,
      onClick: showNetworkContextMenu,
      onInited: function(el) {
        if ( el ) {
          var img = document.createElement('img');
          img.title = img.alt = 'Arduino Network Devices';
          img.src = API.getIcon('devices/network-wired.png');
          el.appendChild(img);
        }
      }
    });
    wm.createNotificationIcon('_ArduinoWIFINotification', {
      onContextMenu: showWIFIContextMenu,
      onClick: showWIFIContextMenu,
      onInited: function(el) {
        if ( el ) {
          var img = document.createElement('img');
          img.title = img.alt = 'Open Settings';
          img.src = API.getIcon('devices/network-wireless.png');
          el.appendChild(img);
        }
      }
    });

    this.pollingInterval = setInterval(function() {
      self.pollNetwork();
    }, 5000);

    this.pollNetwork();

    onInited();
  };

  ArduinoService.prototype._onMessage = function(obj, msg, args) {
    if ( msg === 'attention' ) {
      // args.foo
    }
  };

  ArduinoService.prototype.pollNetwork = function() {
    var self = this;

    this.pollingNetwork = true;

    this.cache.devices = {};

    function getArpTable(table, dev) {
      return table.reduce(function(iter) {
        if ( iter.Device === dev ) {
          return iter;
        }
        return false;
      });
    };

    this.externalCall('netinfo', {}, function(err, result) {
      var devs = Object.keys(result.deviceinfo);

      devs.forEach(function(dev) {
        var details = {};
        var arp =  getArpTable(result.arptable, dev);
        if ( arp ) {
          details = {
            'IP Address': arp['IP address'],
            'HW Address': arp['HW address']
          };
        }
        self.cache.devices[dev] = details;
      });
    });
  };

  ArduinoService.prototype.externalCall = function(fn, args, cb) {
    this._call(fn, args, function(response) {
      response = response || {};
      if ( response.result ) {
        cb(false, response.result);
      } else {
        cb(response.error || 'No response from device');
      }
    }, function(err) {
      cb('Failed to get response from device: ' + err);
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ArduinoService = OSjs.Applications.ArduinoService || {};
  OSjs.Applications.ArduinoService.Class = ArduinoService;

})(OSjs.Core.Service, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
