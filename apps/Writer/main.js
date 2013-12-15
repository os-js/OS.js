/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Application, Window, GUI, Dialogs) {

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window
   */
  var ApplicationWriterWindow = function(app) {
    Window.apply(this, ['ApplicationWriterWindow', {width: 800, height: 450}, app]);

    // Set window properties here
    this._icon = 'apps/libreoffice34-writer.png';
    this._title = "Writer (WIP)";
    this._properties.allow_drop = true;

    this.font       = 'Arial';
    this.fontSize   = 3;
    this.textColor  = '#000000';
    this.backColor  = '#ffffff';
  };

  ApplicationWriterWindow.prototype = Object.create(Window.prototype);

  ApplicationWriterWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Create window contents here
    var mb = this._addGUIElement(new OSjs.GUI.MenuBar('WriterMenuBar'), root);
    var tb = this._addGUIElement(new OSjs.GUI.ToolBar('WriterToolBar'), root);

    var _createIcon = function(i) {
      return OSjs.API.getThemeResource(i, 'icon');
    };

    var _createColorDialog = function(callback, current) {
      app._createDialog('Color', [{color: current}, function(btn, rgb, hex) {
        if ( btn !== 'ok' ) return;
        callback(hex);
      }], self);
    };

    var _createFontDialog = function(callback, currentName, currentSize) {
      app._createDialog('Font', [{name: self.font, size: self.fontSize, color: self.textColor, background: self.backColor, minSize: 1, maxSize: 7, sizeType: 'internal'}, function(btn, fname, fsize) {
        if ( btn !== 'ok' ) return;
        callback(fname, fsize);
      }], self);
    };

    var _setFont = function(name, size) {
      self.command('fontName', name);
      self.command('fontSize', size);
      self.font = name;
      self.fontSize = size;
      tb.getItem('font').getElementsByTagName('span')[0].style.fontFamily = name;
      tb.getItem('font').getElementsByTagName('span')[0].innerHTML = name + ' (' + size + ')';
    };
    var _setTextColor = function(hex) {
      self.command('foreColor', hex);
      self.textColor = hex;
      tb.getItem('textColor').getElementsByTagName('span')[0].style.color = hex;
    };
    var _setBackColor = function(hex) {
      self.command('hiliteColor', hex);
      self.backColor = hex;
      tb.getItem('backColor').getElementsByTagName('span')[0].style.backgroundColor = hex;
    };

    var _action = function(ev, el, name, item) {
      switch ( name ) {
        case 'textColor' :
          _createColorDialog(function(hex) {
            _setTextColor(hex);
          }, self.textColor);
        break;

        case 'backColor':
          _createColorDialog(function(hex) {
            _setBackColor(hex);
          }, self.backColor);
        break;

        case 'font' :
          _createFontDialog(function(font, size) {
            _setFont(font, size);
          }, self.font, self.fontSize);
        break;

        default:
          self.command(name);
        break;
      }
    };

    tb.addItem('bold',          {toggleable: true, title: 'Bold',       onClick: _action, icon: _createIcon('actions/format-text-bold.png')});
    tb.addItem('italic',        {toggleable: true, title: 'Italic',     onClick: _action, icon: _createIcon('actions/format-text-italic.png')});
    tb.addItem('underline',     {toggleable: true, title: 'Underline',  onClick: _action, icon: _createIcon('actions/format-text-underline.png')});
    tb.addItem('strikeThrough', {toggleable: true, title: 'Strike',     onClick: _action, icon: _createIcon('actions/format-text-strikethrough.png')});
    //tb.addItem('subscript',     {toggleable: true, title: 'Sub',        onClick: _action, icon: _createIcon('actions/format-text-strikethrough.png')});
    //tb.addItem('superscript',   {toggleable: true, title: 'Super',      onClick: _action, icon: _createIcon('actions/format-text-strikethrough.png')});
    tb.addSeparator();
    tb.addItem('justifyLeft',   {toggleable: true, title: 'Left',       onClick: _action, icon: _createIcon('actions/format-justify-left.png')});
    tb.addItem('justifyCenter', {toggleable: true, title: 'Center',     onClick: _action, icon: _createIcon('actions/format-justify-center.png')});
    tb.addItem('justifyRight',  {toggleable: true, title: 'Right',      onClick: _action, icon: _createIcon('actions/format-justify-right.png')});
    tb.addSeparator();
    tb.addItem('indent',        {title: 'Indent',                       onClick: _action, icon: _createIcon('actions/gtk-indent-ltr.png')});
    tb.addItem('outdent',       {title: 'Outdent',                      onClick: _action, icon: _createIcon('actions/gtk-unindent-ltr.png')});
    tb.addSeparator();
    tb.addItem('textColor',     {title: 'Text Color',                   onClick: _action});
    tb.addItem('backColor',     {title: 'Back Color',                   onClick: _action});
    tb.addItem('font',          {title: 'Font',                         onClick: _action});
    tb.render();
    tb.addItem('indent',        {title: 'Indent',                       onClick: _action, icon: _createIcon('actions/gtk-indent-ltr.png')});

    var rt = this._addGUIElement(new OSjs.GUI.RichText('WriterRichText'), root);

    /*
    var sb = this._addGUIElement(new OSjs.GUI.StatusBar('WriterStatusBar'), root);
    sb.setText("THIS IS A WORK IN PROGRESS");
    */

    mb.addItem("File", [
      {title: 'New', name: 'New', onClick: function() {
        app.defaultAction('new');
      }},
      {title: 'Open', name: 'Open', onClick: function() {
        app.defaultAction('open');
      }},
      {title: 'Save', name: 'Save', onClick: function() {
        app.defaultAction('save');
      }},
      {title: 'Save As...', name: 'SaveAs', onClick: function() {
        app.defaultAction('saveas');
      }},
      {title: 'Close', name: 'Close', onClick: function() {
        self._close();
      }}
    ]);

    mb.addItem("Edit", [
      {title: 'Undo', name: 'undo', onClick: function() {
        self.command('undo');
      }},
      {title: 'Redo', name: 'redo', onClick: function() {
        self.command('redo');
      }},
      {title: 'Copy', name: 'copy', onClick: function() {
        self.command('copy');
      }},
      {title: 'Cut', name: 'cut', onClick: function() {
        self.command('cut');
      }},
      {title: 'Delete', name: 'delete', onClick: function() {
        self.command('delete');
      }},
      {title: 'Paste', name: 'paste', onClick: function() {
        self.command('paste');
      }},
      {title: 'Unlink', name: 'unlink', onClick: function() {
        self.command('unlink');
      }}
    ]);

    mb.addItem("Insert", [
      {title: 'Ordered List', name: 'OL', onClick: function() {
        self.command('insertOrderedList');
      }},
      {title: 'Unordered List', name: 'UL', onClick: function() {
        self.command('insertUnorderedList');
      }},
      {title: 'Image', name: 'IMG', onClick: function() {
        self._appRef._createDialog('File', [{type: 'open', mimes: ['^image']}, function(btn, fname, fmime) {
          if ( btn !== 'ok' || !fmime.match(/^image/) ) return;
          var src = OSjs.API.getResourceURL(fname);
          self.command('insertImage', src);
        }]);
      }},
      {title: 'Link', name: 'A', onClick: function() {
        self._appRef._createDialog('Input', ['Insert URL', 'http://', function(btn, val) {
          if ( btn !== 'ok' || ! val ) return;
          self.command('createLink', val);
        }]);
      }}
    ]);

    mb.onMenuOpen = function(menu) {
      var el = menu.getRoot().getElementsByClassName("MenuItem_Save")[0];
      if ( el ) {
        if ( app.currentFile.path ) {
          el.className = el.className.replace(/\s?Disabled/, '');
        } else {
          el.className += ' Disabled';
        }
      }
    };

    _setFont(self.font, self.fontSize);
    _setTextColor(self.textColor);
    _setBackColor(self.backColor);

    return root;
  };

  ApplicationWriterWindow.prototype.destroy = function() {
    // Destroy custom objects etc. here

    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationWriterWindow.prototype.update = function(file, contents) {
    if ( typeof contents !== 'undefined' ) {
      var rt = this._getGUIElement('WriterRichText');
      if ( rt ) {
        rt.setContent(contents || '');
      }
    }

    var t = "New file";
    if ( file && file.path ) {
      t = OSjs.Utils.filename(file.path);
    }

    this._setTitle("Writer (WIP) - " + t);
  };

  ApplicationWriterWindow.prototype.command = function(name, value) {
    var rt = this._getGUIElement('WriterRichText');
    if ( rt ) {
      rt.command(name, false, value);
      this._focus();
      var rt = this._getGUIElement('WriterRichText');
      if ( rt ) {
        rt.focus();
      }
      return true;
    }
    return false;
  };

  ApplicationWriterWindow.prototype.getRichTextData = function() {
    var rt = this._getGUIElement('WriterRichText');
    return rt ? rt.getContent() : '';
  };

  ApplicationWriterWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) return;

    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._appRef.defaultAction('open', data.path, data.mime);
      }
    }
  };

  ApplicationWriterWindow.prototype._close = function() {
    var self = this;
    var gel  = this._getGUIElement('WriterRichText');
    if ( gel && gel.hasChanged ) {
      return this._appRef.defaultConfirmClose(this, function() {
        gel.hasChanged = false;
        self._close();
      });
    }
    return Window.prototype._close.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var ApplicationWriter = function(args, metadata) {
    if ( !OSjs.Utils.getCompability().richtext ) throw "Your platform does not support RichText editing";

    Application.apply(this, ['ApplicationWriter', args, metadata]);

    var self = this;

    this.defaultActionWindow  = 'ApplicationWriterWindow';
    this.defaultFilename      = "New text document.odoc";
    this.defaultMime          = 'osjs/document';
    this.acceptMime           = ['^text', '^osjs\\/document'];
    this.getSaveData          = function() {
      var w = self._getWindow('ApplicationWriterWindow');
      return w ? w.getRichTextData() : '';
    };

    this.defaultActionError = function(action, error) {
      var w = self._getWindow('ApplicationWriterWindow');
      var msg = "An error occured in action: " + action;
      if ( w ) {
        w._error("Writer error", msg, error);
      } else {
        OSjs.API.error("Writer error", msg, error);
      }
    };

    this.defaultActionSuccess = function(action, arg1, arg2) {
      var w = self._getWindow('ApplicationWriterWindow');
      if ( w ) {
        if ( action === 'open' ) {
          w.update(arg2, arg1);
        } else if ( action === 'new' ) {
          w.update(null, '');
        } else {
          w.update(arg1);
        }
        w._focus();
      }
    };
  };

  ApplicationWriter.prototype = Object.create(Application.prototype);

  ApplicationWriter.prototype.init = function(core, settings) {
    this._addWindow(new ApplicationWriterWindow(this));
    Application.prototype.init.apply(this, arguments);
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationWriter = ApplicationWriter;

})(OSjs.Helpers.DefaultApplication, OSjs.Core.Window, OSjs.Core.GUI, OSjs.Core.Dialogs);
