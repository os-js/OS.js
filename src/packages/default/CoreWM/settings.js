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
(function(WindowManager, GUI, Utils, API, VFS) {
  'use strict';

  var SETTING_STORAGE_NAME = 'CoreWM';
  var PADDING_PANEL_AUTOHIDE = 10; // FIXME: Replace with a constant ?!

  /////////////////////////////////////////////////////////////////////////////
  // SETTINGS
  /////////////////////////////////////////////////////////////////////////////

  function DefaultSettings(defaults) {
    var compability = Utils.getCompability();

    var cfg = {
      animations          : compability.css.animation,
      fullscreen          : true,
      desktopMargin       : 5,
      wallpaper           : 'osjs:///themes/wallpapers/wallpaper.png',
      icon                : 'osjs-white.png',
      backgroundColor     : '#572a79',
      fontFamily          : 'Karla',
      theme               : 'default',
      icons               : 'default',
      sounds              : 'default',
      background          : 'image-fill',
      windowCornerSnap    : 0,
      windowSnap          : 0,
      useTouchMenu        : compability.touch,
      enableIconView      : false,
      enableSwitcher      : true,
      enableHotkeys       : true,
      enableSounds        : true,
      invertIconViewColor : false,
      moveOnResize        : true,       // Move windows into viewport on resize
      desktopIcons        : [],
      panels              : [
        {
          options: {
            position: 'top',
            ontop:    false,
            autohide: false,
            background: '#101010',
            foreground: '#ffffff',
            opacity: 85
          },
          items:    [
            {name: 'AppMenu', settings: {}},
            {name: 'Buttons', settings: {}},
            {name: 'WindowList', settings: {}},
            {name: 'NotificationArea', settings: {}},
            {name: 'Clock', settings: {}}
          ]
        }
      ]
    };

    if ( defaults ) {
      cfg = Utils.mergeObject(cfg, defaults);
    }

    return cfg;
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.DefaultSettings   = DefaultSettings;

})(OSjs.Core.WindowManager, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
