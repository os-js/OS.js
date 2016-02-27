/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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
(function(CoreWM, Panel, PanelItem, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Weather
   */
  var PanelItemWeather = function() {
    var self = this;

    PanelItem.apply(this, ['PanelItemWeather PanelItemFill PanelItemRight']);

    this.clockInterval  = null;
    this.position = null;
    this.interval = null;

    if ( navigator.geolocation ) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        self.position = pos;
        setTimeout(function() {
          self.updateWeather();
        }, 100);
      });
    }
  };

  PanelItemWeather.prototype = Object.create(PanelItem.prototype);
  PanelItemWeather.Name = 'Weather'; // Static name
  PanelItemWeather.Description = 'Weather notification'; // Static description
  PanelItemWeather.Icon = 'status/weather-few-clouds.png'; // Static icon

  PanelItemWeather.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);
    this.updateWeather(root);
    return root;
  };

  PanelItemWeather.prototype.destroy = function() {
    this.interval = clearInterval(this.interval);
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemWeather.prototype.updateWeather = function(root) {
    var self = this;
    root = root || this._$element;

    if ( !root ) {
      return;
    }

    root.title = 'Not allowed or unavailable';

    var busy = false;

    function setImage(src) {
      root.style.background = 'transparent url(\'' + src + '\') no-repeat center center';
    }

    function setWeather(name, weather, main) {
      name = name || '<unknown location>';
      weather = weather || {};
      main = main || {};

      var desc = weather.description || '<unknown weather>';
      var temp = main.temp || '<unknown temp>';
      if ( main.temp ) {
        temp += 'C';
      }
      var icon = 'sunny.png';

      switch ( desc  ) {
        case 'clear sky':
          if ( weather.icon === '01n' ) {
            icon = 'weather-clear-night.png';
          } else {
            icon = 'weather-clear.png';
          }
          break;
        case 'few clouds':
          if ( weather.icon === '02n' ) {
            icon = 'weather-few-clouds-night.png';
          } else {
            icon = 'weather-few-clouds.png';
          }
          break;
        case 'scattered clouds':
        case 'broken clouds':
          icon = 'weather-overcast.png';
          break;
        case 'shower rain':
          icon = 'weather-showers.png';
          break;
        case 'rain':
          icon = 'weather-showers-scattered.png';
          break;
        case 'thunderstorm':
          icon = 'stock_weather-storm.png';
          break;
        case 'snow':
          icon = 'stock_weather-snow.png';
          break;
        case 'mist':
          icon = 'stock_weather-fog.png';
          break;
        default:
          if ( desc.match(/rain$/) ) {
            icon = 'weather-showers-scattered.png';
          }
          break;
      }

      var src = API.getIcon('status/' + icon);
      root.title = Utils.format('{0} - {1} - {2}', name, desc, temp);
      setImage(src);
    }

    function updateWeather() {
      if ( busy || !self.position ) {
        return;
      }
      busy = true;

      var lat = self.position.coords.latitude;
      var lon = self.position.coords.longitude;
      var unt = 'metric';
      var key = '4ea33327bcfa4ea0293b2d02b6fda385';
      var url = Utils.format('http://api.openweathermap.org/data/2.5/weather?lat={0}&lon={1}&units={2}&APPID={3}', lat, lon, unt, key);

      API.curl({
        body: {
          url: url
        }
      }, function(error, response) {
        if ( !error && response ) {
          var result = null;
          try {
            result = JSON.parse(response.body);
          } catch ( e ) {}

          if ( result ) {
            setWeather(result.name, result.weather ? result.weather[0] : null, result.main);
          }
        }

        busy = false;
      });
    }

    setImage(API.getIcon('status/weather-severe-alert.png'));

    this.interval = setInterval(function() {
      updateWeather();
    }, (60 * 60 * 1000));

    Utils.$bind(root, 'click', function() {
      updateWeather();
    });

    setTimeout(function() {
      updateWeather();
    }, 1000);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.Weather          = PanelItemWeather;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.VFS);
