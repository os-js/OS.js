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
(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationTextpadWindow(app, metadata, scheme, file) {
    DefaultApplicationWindow.apply(this, ['ApplicationTextpadWindow', {
      allow_drop: true,
      icon: metadata.icon,
      title: metadata.name,
      width: 450,
      height: 300
    }, app, scheme, file]);
  }

  ApplicationTextpadWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationTextpadWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationTextpadWindow.prototype.init = function(wmRef, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'TextpadWindow', root);
    scheme.find(this, 'Text').on('change', function() {
      self.hasChanged = true;
    });

    return root;
  };

  ApplicationTextpadWindow.prototype.updateFile = function(file) {
    DefaultApplicationWindow.prototype.updateFile.apply(this, arguments);
    this._scheme.find(this, 'Text').$element.focus();
  };

  ApplicationTextpadWindow.prototype.showFile = function(file, content) {
    this._scheme.find(this, 'Text').set('value', content || '');
    DefaultApplicationWindow.prototype.showFile.apply(this, arguments);
  };

  ApplicationTextpadWindow.prototype.getFileData = function() {
    return this._scheme.find(this, 'Text').get('value');
  };

  ApplicationTextpadWindow.prototype._focus = function() {
    if ( DefaultApplicationWindow.prototype._focus.apply(this, arguments) ) {
      if ( this._scheme ) {
        var input = this._scheme.find(this, 'Text').$element;
        if ( input ) {
          input.focus();
        }
      }
      return true;
    }
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationTextpad = function(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationTextpad', args, metadata, {
      extension: 'txt',
      mime: 'text/plain',
      filename: 'New text file.txt'
    }]);
  };

  ApplicationTextpad.prototype = Object.create(DefaultApplication.prototype);
  ApplicationTextpad.constructor = DefaultApplication;

  ApplicationTextpad.prototype.init = function(settings, metadata) {
    var self = this;
    DefaultApplication.prototype.init.call(this, settings, metadata, function(scheme, file) {
      self._addWindow(new ApplicationTextpadWindow(self, metadata, scheme, file));
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationTextpad = OSjs.Applications.ApplicationTextpad || {};
  OSjs.Applications.ApplicationTextpad.Class = ApplicationTextpad;

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
