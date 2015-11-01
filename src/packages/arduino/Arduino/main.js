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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationArduinoWindow', {
      icon: metadata.icon,
      title: metadata.name,
      min_height: 400,
      width: 400,
      height: 400
    }, app, scheme]);
  }

  ApplicationArduinoWindow.prototype = Object.create(Window.prototype);
  ApplicationArduinoWindow.constructor = Window.prototype;

  ApplicationArduinoWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'ArduinoWindow', root);

    scheme.find(this, 'Tabs').on('select', function(ev) {
      self.setTab(ev.detail.index);
    });

    var dev = scheme.find(this, 'NetworkDevice');
    scheme.find(this, 'NetworkRefresh').on('click', function() {
      self.pollNetworkDevice(dev.get('value'));
    });

    return root;
  };

  ApplicationArduinoWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationArduinoWindow.prototype._inited = function() {
    Window.prototype._inited.apply(this, arguments);
    this.setTab(0);
  };


  ApplicationArduinoWindow.prototype.pollNetworkDevice = function(dev) {
    var self = this;
    function render(data) {
      self._scheme.find(self, 'NetworkDeviceRXBytes').set('value', data[1]);
      self._scheme.find(self, 'NetworkDeviceRXPackets').set('value', data[2]);
      self._scheme.find(self, 'NetworkDeviceRXErrors').set('value', data[3]);
      self._scheme.find(self, 'NetworkDeviceRXDropped').set('value', data[4]);
      self._scheme.find(self, 'NetworkDeviceTXBytes').set('value', data[9]);
      self._scheme.find(self, 'NetworkDeviceTXPackets').set('value', data[10]);
      self._scheme.find(self, 'NetworkDeviceTXErrors').set('value', data[11]);
      self._scheme.find(self, 'NetworkDeviceTXDropped').set('value', data[12]);
      self._scheme.find(self, 'NetworkDeviceMulticast').set('value', data[8]);
      self._scheme.find(self, 'NetworkDeviceCollisions').set('value', data[14]);
    }

    if ( dev === null ) {
      this._scheme.find(this, 'NetworkDeviceRXBytes').set('value', '-1');
      this._scheme.find(this, 'NetworkDeviceRXPackets').set('value', '-1');
      this._scheme.find(this, 'NetworkDeviceRXErrors').set('value', '-1');
      this._scheme.find(this, 'NetworkDeviceRXDropped').set('value', '-1');
      this._scheme.find(this, 'NetworkDeviceTXBytes').set('value', '-1');
      this._scheme.find(this, 'NetworkDeviceTXPackets').set('value', '-1');
      this._scheme.find(this, 'NetworkDeviceTXErrors').set('value', '-1');
      this._scheme.find(this, 'NetworkDeviceTXDropped').set('value', '-1');
      this._scheme.find(this, 'NetworkDeviceMulticast').set('value', '-1');
      this._scheme.find(this, 'NetworkDeviceCollisions').set('value', '-1');
    }

    if ( dev ) {
      this._app._call('netinfo', {}, function(response) {
        response = response || {};
        if ( response.result ) {
          render(response.result[dev]);
        }
      });
    }
  };

  ApplicationArduinoWindow.prototype.renderSystemInfo = function(info) {
    this._scheme.find(this, 'SystemPlatform').set('value', info.platform);
    this._scheme.find(this, 'SystemModel').set('value', info.model);
    this._scheme.find(this, 'SystemBogomips').set('value', info.bogomips);
    this._scheme.find(this, 'SystemMemory').set('value', info.total_memory);
    this._scheme.find(this, 'SystemUptime').set('value', info.uptime);
  };

  ApplicationArduinoWindow.prototype.renderWirelessDevices = function(devices) {
    this._renderDevices('WirelessDevice', devices);
  };

  ApplicationArduinoWindow.prototype.renderNetworkDevices = function(devices) {
    this._renderDevices('NetworkDevice', devices);
    this.pollNetworkDevice(null);
  };

  ApplicationArduinoWindow.prototype._renderDevices = function(name, devices) {
    var lst = this._scheme.find(this, name);
    lst.clear();

    var devs = [];
    devices.forEach(function(d) {
      devs.push({
        label: d,
        value: d
      });
    });
    lst.add(devs);
  };

  ApplicationArduinoWindow.prototype.setTab = function(index) {
    var self = this;

    var functions = [
      {fn: 'sysinfo',    arg: {}, cb: self.renderSystemInfo},
      {fn: 'netdevices', arg: {}, cb: self.renderNetworkDevices},
      {fn: 'netdevices', arg: {}, cb: self.renderWirelessDevices}
    ];

    var iter = functions[index];
    if ( iter ) {
      this._toggleLoading(true);

      this._app._call(iter.fn, iter.arg, function(result) {
        self._toggleLoading(false);

        result = result || {};
        if ( result.result ) {
          iter.cb.call(self, result.result);
          return;
        }

        alert(result.error || 'Unknown error while communicating with board');
      }, function(err) {
        self._toggleLoading(false);

        alert(err || 'Fatal error while communicating with board');
      });
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduino(args, metadata) {
    Application.apply(this, ['ApplicationArduino', args, metadata]);
  }

  ApplicationArduino.prototype = Object.create(Application.prototype);
  ApplicationArduino.constructor = Application;

  ApplicationArduino.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationArduino.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationArduinoWindow(self, metadata, scheme));
      onInited();
    });

    this._setScheme(scheme);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationArduino = OSjs.Applications.ApplicationArduino || {};
  OSjs.Applications.ApplicationArduino.Class = ApplicationArduino;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
