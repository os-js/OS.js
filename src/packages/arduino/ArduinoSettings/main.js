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

  function ApplicationArduinoSettingsWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationArduinoSettingsWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 420,
      height: 400
    }, app, scheme]);
  }

  ApplicationArduinoSettingsWindow.prototype = Object.create(Window.prototype);
  ApplicationArduinoSettingsWindow.constructor = Window.prototype;

  ApplicationArduinoSettingsWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'ArduinoSettingsWindow', root);

    this.initUI(wmRef, scheme);

    return root;
  };

  ApplicationArduinoSettingsWindow.prototype.initUI = function(wm, scheme) {
    var self = this;
    var handler = OSjs.Core.getHandler();
    var pacman = OSjs.Core.getPackageManager();

    var inputHostname = scheme.find(this, 'InputArduinoBoardName');
    var selectTimezone = scheme.find(this, 'SelectArduinoTimezone');
    var wifiInput = scheme.find(this, 'InputArduinoWIFISSID');
    var wifiSelectEncrypt = scheme.find(this, 'SelectNetworkWIFISecurity');
    var wifiPassword = scheme.find(this, 'InputArduinoWIFIPassword');
    var switchRest = scheme.find(this, 'SwitchEnableRest');
    var pass = scheme.find(this, 'InputArduinoPassword');
    var passc = scheme.find(this, 'InputArduinoPasswordConfirm');

    function callAPI(fn, args, cb) {
      var proc = API.getProcess('ArduinoService', true);
      if ( proc ) {
        self._toggleLoading(true);
        proc.externalCall(fn, args, function(err, response) {
          self._toggleLoading(false);
          return cb(err, response);
        });
      }
    }

    function renderTimezones() {
      var timezones = API.getConfig('Timezones') || [];

      var options = [];
      timezones.forEach(function(group) {
        group.zones.forEach(function(zone) {
          var val = zone.value.replace(/\-/, ' ');
          options.push({
            label: Utils.format('{0} - {1}', val, zone.name),
            value: val
          });
        });
      });

      selectTimezone.add(options);
    }

    function renderDeviceInfo(cb) {
      cb = cb || function() {};

      var view = scheme.find(self, 'ArduinoInfo');

      callAPI('sysinfo', {}, function(err, result) {
        if ( err ) {
          alert(err);
          return;
        }

        var rows = [];
        var keys = ['system', 'model', 'memtotal', 'memcached', 'membuffers', 'memfree', 'bogomips', 'uptime'];
        result.metrics.forEach(function(val, idx) {
          var key = keys[idx];
          rows.push({
            index: idx,
            value: key,
            columns: [
              {label: key.toString()},
              {label: val.toString()}
            ]
          });
        });

        view.clear();
        view.add(rows);
        selectTimezone.set('value', result.timezone);
        inputHostname.set('value', result.hostname);
        switchRest.set('value', result.rest === 'true');

        cb();
      });
    }

    function renderNetworkDevices() {
      callAPI('netdevices', {}, function(err, result) {
        var rows = [{label: '--- SELECT NETWORK DEVICE ---', value: null}];

        if ( err ) {
          alert(err);
        } else {
          result.forEach(function(iter) {
            rows.push({label: iter, value: iter});
          });
        }

        var list = scheme.find(self, 'ArduinoNetworkDeviceSelect');
        list.clear();
        list.add(rows);
      });
    }


    function renderNetworkInfo(device) {
      if ( !device ) {
        return;
      }

      callAPI('netinfo', {}, function(err, response) {
        var viewi = scheme.find(self, 'ArduinoNetworkDeviceInfo');
        var viewa = scheme.find(self, 'ArduinoNetworkDeviceArptable');

        viewi.clear();
        viewa.clear();

        if ( err ) {
          alert(err);
          return;
        }

        var keys, rows;
        var netinfo = response.deviceinfo[device];
        var arptable = response.arptable;

        if ( netinfo ) {
          rows = [];
          keys = ['rx_bytes', 'rx_packets', 'rx_errors', 'rx_dropped', 'unknown', 'unknown', 'unknown', 'multicast', 'tx_bytes', 'tx_packets', 'tx_errors', 'tx_dropped', 'unknown', 'collisions', 'unknown', 'unknown'];
          netinfo.forEach(function(value, idx) {
            if ( keys[idx] !== 'unknown' ) {
              rows.push({
                columns: [
                  {label: keys[idx].toString()},
                  {label: value.toString()}
                ]
              });
            }
          });
          viewi.add(rows);
        }

        if ( arptable ) {
          rows = [];
          arptable.forEach(function(arp) {
            if ( arp.Device === device ) {
              Object.keys(arp).forEach(function(v) {
                rows.push({
                  columns: [
                    {label: v.toString()},
                    {label: arp[v].toString()}
                  ]
                });
              });
            }
          });
          viewa.add(rows);
        }

      });
    }

    scheme.find(this, 'ButtonArduinoInfoRefresh').on('click', function() {
      renderDeviceInfo();
    });

    scheme.find(this, 'ButtonArduinoPassword').on('click', function() {
      var pass1 = pass.get('value');
      var pass2 = passc.get('value');

      if ( !pass1 || !pass2 || (pass1 !== pass2) ) {
        alert('Passwords do not match');
        return;
      }

      callAPI('setpasswd', {password: pass1}, function(err, result) {
        err = result ? 'Password changed successfully' : (err || 'Failed to set password');
        alert(err);
        if ( !err ) {
          pass.set('value', '');
        }
      });
    });

    var selectNetworkDevice = scheme.find(this, 'ArduinoNetworkDeviceSelect').on('change', function(ev) {
      if ( ev.detail ) {
        renderNetworkInfo(ev.detail);
      }
    });

    var wifiSelect = scheme.find(this, 'SelectNetworkWIFISSID').on('change', function(ev) {
      if ( ev.detail ) {
        var data = null;
        try {
          data = JSON.parse(ev.detail);
        } catch ( e ) {}

        console.warn(data);

        if ( data ) {
          var enc = data.encryption.toLowerCase().replace(/[^A-z0-9]/, '');
          if ( enc == 'unknown' ) { enc = 'open'; }

          wifiPassword.set('value', '');
          wifiInput.set('value', data.ssid);
          wifiSelectEncrypt.set('value', enc);
        }
      }
    });

    scheme.find(this, 'ButtonArduinoRefreshWIFI').on('click', function(ev) {
      callAPI('iwscan', {device: 'radio0'}, function(err, result) {
        wifiSelect.clear();

        if ( !err && result ) {
          var list = [{
            label: '--- SELECT FROM LIST ---',
            value: null
          }];

          (result || []).forEach(function(iter) {
            list.push({
              label: Utils.format('{0} ({1}, {2}% signal)', iter.ssid, iter.encryption, iter.signal),
              value: JSON.stringify(iter)
            });
          });

          wifiSelect.add(list);
        }
      });

    });

    scheme.find(this, 'ButtonArduinoConfigureSettings').on('click', function() {
      callAPI('setsysinfo', {hostname: inputHostname.get('value'), timezone: selectTimezone.get('value')}, function() {
      });
    });
    scheme.find(this, 'ButtonArduinoRestart').on('click', function() {
      callAPI('reboot', {}, function() {
      });
    });
    scheme.find(this, 'ArduinoNetworkDevicePoll').on('click', function() {
      renderNetworkDevices();
    });
    scheme.find(this, 'ButtonNetworkDeviceRefresh').on('click', function() {
      renderNetworkInfo(selectNetworkDevice.get('value'));
    });
    scheme.find(this, 'ButtonArduinoConfigureWIFI').on('click', function() {
      callAPI('wifi', {
        ssid: wifiInput.get('value'),
        security: wifiSelectEncrypt.get('value'),
        password: wifiPassword.get('value')
      }, function() {
        wm.notification({title: 'Arduino', message: 'You will be notified when your wifi settings have been applied', icon: 'arduino.png' });
      });
    });

    scheme.find(this, 'ButtonArduinoConfigureRest').on('click', function() {
      var val = switchRest.get('value');

      self._toggleLoading(true);
      callAPI('rest', {
        enabled: val ? 'true' : 'false'
      }, function(ret) {
        self._toggleLoading(false);
      });
    });

    switchRest.on('change', function(ev, val) {
    });

    renderTimezones();

    renderDeviceInfo(function() {
      renderNetworkDevices();
    });

  };

  ApplicationArduinoSettingsWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoSettings(args, metadata) {
    Application.apply(this, ['ApplicationArduinoSettings', args, metadata]);
  }

  ApplicationArduinoSettings.prototype = Object.create(Application.prototype);
  ApplicationArduinoSettings.constructor = Application;

  ApplicationArduinoSettings.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationArduinoSettings.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationArduinoSettingsWindow(self, metadata, scheme));
      onInited();
    });

    this._setScheme(scheme);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationArduinoSettings = OSjs.Applications.ApplicationArduinoSettings || {};
  OSjs.Applications.ApplicationArduinoSettings.Class = ApplicationArduinoSettings;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
