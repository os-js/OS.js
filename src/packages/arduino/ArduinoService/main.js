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

    this.busy = false;
    this.updateCheckInterval = null;
  }

  ArduinoService.prototype = Object.create(Service.prototype);
  ArduinoService.constructor = Service;

  ArduinoService.prototype.destroy = function() {
    var wm = OSjs.Core.getWindowManager();

    this.updateCheckInterval = clearInterval(this.updateCheckInterval);

    if ( wm ) {
      wm.destroyNotificationIcon('_ArduinoNotification');
      wm.destroyNotificationIcon('_ArduinoNetworkNotification');
      wm.destroyNotificationIcon('_ArduinoWIFINotification');
    }

    return Service.prototype.destroy.apply(this, arguments);
  };

  ArduinoService.prototype.init = function(settings, metadata, onInited) {
    Service.prototype.init.apply(this, arguments);

    var self = this;
    var wm = OSjs.Core.getWindowManager();

    function showNetworkContextMenu(ev) {
      var mnu = [];

      function createSubItem(devs, d, idx) {
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

      self.pollNetwork(function(devs) {
        Object.keys(devs).forEach(function(d, idx) {
          createSubItem(devs, d, idx);
        });
        OSjs.API.createMenu(mnu, ev);
      });
    }

    function showWIFIContextMenu(ev) {
      self.pollWireless(function(result) {
        var menuItems = [];
        Object.keys(result).forEach(function(k) {
          var val = result[k];
          menuItems.push({
            titleHTML: true,
            title: Utils.format('<b>{0}:</b> {1}', k, Utils.$escape(String(val)))
          });
        });
        OSjs.API.createMenu(menuItems, ev);
      });
    }

    function showContextMenu(ev) {
      var mnu = [
        {title: 'Open Settings', onClick: function(ev) {
          API.launch('ApplicationArduinoSettings');
        }}
      ];
      OSjs.API.createMenu(mnu, ev);
    }

    wm.createNotificationIcon('_ArduinoNotification', {
      image: API.getIcon('devices/audio-card.png'),
      title: 'Arduino Device',
      onContextMenu: showContextMenu,
      onClick: showContextMenu
    });

    wm.createNotificationIcon('_ArduinoNetworkNotification', {
      image: API.getIcon('devices/network-wired.png'),
      title: 'Arduino Network Devices',
      onContextMenu: showNetworkContextMenu,
      onClick: showNetworkContextMenu
    });
    wm.createNotificationIcon('_ArduinoWIFINotification', {
      image: API.getIcon('devices/network-wireless.png'),
      title: 'Open Settings',
      onContextMenu: showWIFIContextMenu,
      onClick: showWIFIContextMenu
    });

    // Create update notification
    function pollUpdate() {
      self.pollUpdate('arduinoos', function(err, latest, packageName) {
        if ( wm ) {
          if ( err ) {
            wm.notification({
              icon: 'actions/stock_new-appointment.png',
              title: 'Update Notification',
              message: Utils.format('Failed to check for update of {0}: {1}', packageName, err)
            });
            return;
          }
          if ( latest ) {
            wm.notification({
              icon: 'actions/stock_new-appointment.png',
              title: 'Update Notification',
              message: Utils.format('An update of {0} ({1}) is available', packageName, latest.latest),
              onClick: function() {
                API.launch('ApplicationArduinoPackageManager', {upgrade: packageName})
              }
            });
          }
        }
      });
    }

    this.updateCheckInterval = setInterval(function() {
      pollUpdate();
    }, ((60 * 1000) * 60) * 2);

    pollUpdate();

    onInited();
  };

  ArduinoService.prototype._onMessage = function(obj, msg, args) {
    if ( msg === 'attention' ) {
      // args.foo
    }
  };

  ArduinoService.prototype.pollWireless = function(cb) {
    var self = this;
    if ( this.busy ) {
      return;
    }
    this.busy = true;

    function isConnected(tst) {
      tst = tst || '00:00:00:00:00:00';
      return tst !== '00:00:00:00:00:00' ? 'connected' : 'disconnected'
    }

    this.externalCall('iwinfo', {}, function(err, result) {
      var info = (result || '').split(' ');
      var keys = ['ap', 'ssid', 'security', 'signal'];
      var list = {
        'status': isConnected(info[0])
      };

      keys.forEach(function(key, idx) {
        if ( key !== 'security' ) { // FIXME
          list[key] = info[idx] || null;
        }
      });

      self.busy = false;

      cb(list);
    });
  };

  ArduinoService.prototype.pollUpdate = function(packageName, cb) {
    this.externalCall('opkg', {command: 'list', args: {category: 'upgradable'}}, function(err, stdout) {
      var list = (stdout || '').split('\n');
      var found = null;
      list.forEach(function(line) {
        var data = line.split(' - ');
        if ( data.length === 3 && data[0] === packageName ) {
          found = {
            name: data[0],
            current: data[1],
            latest: data[2]
          };
        }
        return !!found;
      });

      cb(err, found, packageName);
    });
  };

  ArduinoService.prototype.pollNetwork = function(cb) {
    var self = this;

    if ( this.busy ) {
      return;
    }
    this.busy = true;

    function getIfconfig(table, dev) {
      var result = null;
      table.forEach(function(iter) {
        if ( iter.iface === dev ) {
          result = iter;
        }
        return !!result;
      });
      return result;
    };

    this.externalCall('netinfo', {}, function(err, result) {
      var devs = [];
      try {
        devs = Object.keys(result.deviceinfo);
      } catch ( e ) {
        console.warn('Error parsing devices', e);
      }

      var list = {};
      devs.forEach(function(dev) {
        var arp =  getIfconfig(result.ifconfig, dev) || {};
        var details = {
          'IP': arp['ip'] || '',
          'Mask': arp['netmask'] || '',
          'MAC': arp['mac'] || ''
        };
        list[dev] = details;
      });

      self.busy = false;

      cb(list);
    });
  };

  ArduinoService.prototype.externalCall = function(fn, args, cb) {
    API.call(fn, args, function(response) {
      if ( response.error ) {
        cb(response.error || 'No response from device');
      } else {
        cb(false, response.result);
      }
    }, function(err) {
      cb('Failed to get response from device: ' + err);
    }, false);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ArduinoService = OSjs.Applications.ArduinoService || {};
  OSjs.Applications.ArduinoService.Class = ArduinoService;

})(OSjs.Core.Service, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
