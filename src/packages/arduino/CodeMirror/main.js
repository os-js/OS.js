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
  var globalCounter = 0;

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationCodeMirrorWindow(app, metadata, scheme, file) {
    DefaultApplicationWindow.apply(this, ['ApplicationCodeMirrorWindow', {
      allow_drop: true,
      icon: metadata.icon,
      title: metadata.name,
      width: 500,
      height: 500
    }, app, scheme, file]);

    this.editor = null;
  }

  ApplicationCodeMirrorWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationCodeMirrorWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationCodeMirrorWindow.prototype.init = function(wmRef, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'CodeMirrorWindow', root);
    var statusbar = scheme.find(this, 'Statusbar');

    var container = scheme.find(this, 'MirrorContainer').$element;
    var id = 'CodeMirror' + globalCounter.toString();
    container.id = id;

    function updateStatusbar() {
      if ( self.editor ) {
        var c = self.editor.getCursor();
        var l = self.editor.lineCount();
        var txt = Utils.format('Row: {0}, Col: {1}, Lines: {2}', c.line, c.ch, l);
        statusbar.set('value', txt);
      }
    }

    this.editor = CodeMirror(container, {
      mode: 'text',
      lineNumbers: true,
      styleActiveLine: true,
      matchBrackets: true,
      theme: 'material'
    });
    this.editor.on('cursorActivity', function(i) {
      updateStatusbar();
    });

    globalCounter++;

    updateStatusbar();

    return root;
  };

  ApplicationCodeMirrorWindow.prototype.destroy = function() {
    this.editor = null;
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationCodeMirrorWindow.prototype.updateFile = function(file) {
    DefaultApplicationWindow.prototype.updateFile.apply(this, arguments);
    this.editor.getInputField().focus();
  };

  ApplicationCodeMirrorWindow.prototype.showFile = function(file, content) {
    this.editor.setValue(content || '');
    DefaultApplicationWindow.prototype.showFile.apply(this, arguments);

    var mode = file ? file.mime.split('/')[1].replace(/^x\-/, '') : 'text';
    if ( mode === 'plain' ) {
      mode = 'text';
    } else if ( mode === 'html' || mode === 'htm' ) {
      mode = 'xml';
    }

    this.editor.setOption('mode', mode);
  };

  ApplicationCodeMirrorWindow.prototype.getFileData = function() {
    return this.editor.getValue();
  };

  /*
  ApplicationCodeMirrorWindow.prototype._resize = function() {
    if ( DefaultApplicationWindow.prototype._resize.apply(this, arguments) ) {
      if ( this.editor ) {
        this.editor.resize();
      }
      return true;
    }
    return false;
  };
  */

  ApplicationCodeMirrorWindow.prototype._blur = function() {
    if ( DefaultApplicationWindow.prototype._blur.apply(this, arguments) ) {
      if ( this.editor ) {
        this.editor.getInputField().blur();
      }
      return true;
    }
    return false;
  };

  ApplicationCodeMirrorWindow.prototype._focus = function() {
    if ( DefaultApplicationWindow.prototype._focus.apply(this, arguments) ) {
      if ( this.editor ) {
        this.editor.getInputField().focus();
      }
      return true;
    }
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationCodeMirror(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationCodeMirror', args, metadata, {
      extension: 'txt',
      mime: 'text/plain',
      filename: 'New CodeMirror file.txt',
      filetypes: [
        {
          label: 'Plain Text',
          mime: 'text/plain',
          extension: 'txt'
        },
        {
          label: 'JavaScript',
          mime: 'application/javascript',
          extension: 'js'
        },
        {
          label: 'CSS',
          mime: 'text/css',
          extension: 'css'
        },
        {
          label: 'HTML',
          mime: 'text/html',
          extension: 'html'
        },
        {
          label: 'XML',
          mime: 'application/xml',
          extension: 'xml'
        },
        {
          label: 'Python',
          mime: 'application/x-python',
          extension: 'py'
        },
        {
          label: 'PHP',
          mime: 'application/php',
          extension: 'php'
        },
        {
          label: 'Lua',
          mime: 'application/x-lua',
          extension: 'lua'
        }
      ]
    }]);
  }

  ApplicationCodeMirror.prototype = Object.create(DefaultApplication.prototype);
  ApplicationCodeMirror.constructor = DefaultApplication;

  ApplicationCodeMirror.prototype.init = function(settings, metadata, onInited) {
    var self = this;
    DefaultApplication.prototype.init.call(this, settings, metadata, onInited, function(scheme, file) {
      self._addWindow(new ApplicationCodeMirrorWindow(self, metadata, scheme, file));
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationCodeMirror = OSjs.Applications.ApplicationCodeMirror || {};
  OSjs.Applications.ApplicationCodeMirror.Class = ApplicationCodeMirror;

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
