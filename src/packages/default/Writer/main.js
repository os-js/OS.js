/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Application, Window, GUI, Dialogs, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var DEFAULT_FILENAME = "New text document.odoc";

  var _Locales = {
    no_NO : {
      'Insert URL' : 'Sett inn URL'
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return OSjs.API.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window
   */
  var ApplicationWriterWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationWriterWindow', {width: 800, height: 450}, app]);

    this.font       = 'Arial';
    this.fontSize   = 3;
    this.textColor  = '#000000';
    this.backColor  = '#ffffff';
    this.title      = metadata.name;

    // Set window properties here
    this._icon = metadata.icon;
    this._title = this.title;
    this._properties.allow_drop = true;
  };

  ApplicationWriterWindow.prototype = Object.create(Window.prototype);

  ApplicationWriterWindow.prototype.init = function(wmRef, app) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Create window contents here
    var mb = this._addGUIElement(new GUI.MenuBar('WriterMenuBar'), root);
    var tb = this._addGUIElement(new GUI.ToolBar('WriterToolBar'), root);

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

    tb.addItem('bold',          {toggleable: true, title: OSjs.API._('LBL_BOLD'),       onClick: _action, icon: _createIcon('actions/format-text-bold.png')});
    tb.addItem('italic',        {toggleable: true, title: OSjs.API._('LBL_ITALIC'),     onClick: _action, icon: _createIcon('actions/format-text-italic.png')});
    tb.addItem('underline',     {toggleable: true, title: OSjs.API._('LBL_UNDERLINE'),  onClick: _action, icon: _createIcon('actions/format-text-underline.png')});
    tb.addItem('strikeThrough', {toggleable: true, title: OSjs.API._('LBL_STRIKE'),     onClick: _action, icon: _createIcon('actions/format-text-strikethrough.png')});
    //tb.addItem('subscript',     {toggleable: true, title: 'Sub',        onClick: _action, icon: _createIcon('actions/format-text-strikethrough.png')});
    //tb.addItem('superscript',   {toggleable: true, title: 'Super',      onClick: _action, icon: _createIcon('actions/format-text-strikethrough.png')});
    tb.addSeparator();
    tb.addItem('justifyLeft',   {toggleable: true, title: OSjs.API._('LBL_LEFT'),       onClick: _action, icon: _createIcon('actions/format-justify-left.png')});
    tb.addItem('justifyCenter', {toggleable: true, title: OSjs.API._('LBL_CENTER'),     onClick: _action, icon: _createIcon('actions/format-justify-center.png')});
    tb.addItem('justifyRight',  {toggleable: true, title: OSjs.API._('LBL_RIGHT'),      onClick: _action, icon: _createIcon('actions/format-justify-right.png')});
    tb.addSeparator();
    tb.addItem('indent',        {title: OSjs.API._('LBL_INDENT'),                       onClick: _action, icon: _createIcon('actions/gtk-indent-ltr.png')});
    tb.addItem('outdent',       {title: OSjs.API._('LBL_OUTDENT'),                      onClick: _action, icon: _createIcon('actions/gtk-unindent-ltr.png')});
    tb.addSeparator();
    tb.addItem('textColor',     {title: OSjs.API._('LBL_TEXT_COLOR'),                   onClick: _action});
    tb.addItem('backColor',     {title: OSjs.API._('LBL_BACK_COLOR'),                   onClick: _action});
    tb.addItem('font',          {title: OSjs.API._('LBL_FONT'),                         onClick: _action});
    tb.render();
    tb.addItem('indent',        {title: OSjs.API._('LBL_INDENT'),                       onClick: _action, icon: _createIcon('actions/gtk-indent-ltr.png')});

    var rt = this._addGUIElement(new GUI.RichText('WriterRichText'), root);

    /*
    var sb = this._addGUIElement(new GUI.StatusBar('WriterStatusBar'), root);
    sb.setText("THIS IS A WORK IN PROGRESS");
    */

    mb.addItem(OSjs.API._("LBL_FILE"), [
      {title: OSjs.API._('LBL_NEW'), name: 'New', onClick: function() {
        app.action('new');
      }},
      {title: OSjs.API._('LBL_OPEN'), name: 'Open', onClick: function() {
        app.action('open');
      }},
      {title: OSjs.API._('LBL_SAVE'), name: 'Save', onClick: function() {
        app.action('save');
      }},
      {title: OSjs.API._('LBL_SAVEAS'), name: 'SaveAs', onClick: function() {
        app.action('saveas');
      }},
      {title: OSjs.API._('LBL_CLOSE'), name: 'Close', onClick: function() {
        self._close();
      }}
    ]);

    mb.addItem(OSjs.API._("LBL_EDIT"), [
      {title: OSjs.API._('LBL_UNDO'), name: 'undo', onClick: function() {
        self.command('undo');
      }},
      {title: OSjs.API._('LBL_REDO'), name: 'redo', onClick: function() {
        self.command('redo');
      }},
      {title: OSjs.API._('LBL_COPY'), name: 'copy', onClick: function() {
        self.command('copy');
      }},
      {title: OSjs.API._('LBL_CUT'), name: 'cut', onClick: function() {
        self.command('cut');
      }},
      {title: OSjs.API._('LBL_DELETE'), name: 'delete', onClick: function() {
        self.command('delete');
      }},
      {title: OSjs.API._('LBL_PASTE'), name: 'paste', onClick: function() {
        self.command('paste');
      }},
      {title: OSjs.API._('LBL_UNLINK'), name: 'unlink', onClick: function() {
        self.command('unlink');
      }}
    ]);

    mb.addItem(OSjs.API._("LBL_INSERT"), [
      {title: OSjs.API._('LBL_ORDERED_LIST'), name: 'OL', onClick: function() {
        self.command('insertOrderedList');
      }},
      {title: OSjs.API._('LBL_UNORDERED_LIST'), name: 'UL', onClick: function() {
        self.command('insertUnorderedList');
      }},
      {title: OSjs.API._('LBL_IMAGE'), name: 'IMG', onClick: function() {
        self._appRef._createDialog('File', [{type: 'open', mimes: ['^image']}, function(btn, file) {
          if ( btn !== 'ok' || !file || !file.mime.match(/^image/) ) return;
          VFS.url(file, function(error, result) {
            if ( !error ) {
              self.command('insertImage', result);
            }
          });
        }]);
      }},
      {title: OSjs.API._('LBL_LINK'), name: 'A', onClick: function() {
        self._appRef._createDialog('Input', [_('Insert URL'), 'http://', function(btn, val) {
          if ( btn !== 'ok' || ! val ) return;
          self.command('createLink', val);
        }]);
      }}
    ]);

    mb.onMenuOpen = function(menu) {
      menu.setItemDisabled("Save", app.currentFile ? false : true);
    };

    _setFont(self.font, self.fontSize);
    _setTextColor(self.textColor);
    _setBackColor(self.backColor);

    rt.hasChanged = false;

    return root;
  };

  ApplicationWriterWindow.prototype.update = function(file, contents) {
    if ( typeof contents !== 'undefined' ) {
      var rt = this._getGUIElement('WriterRichText');
      if ( rt ) {
        rt.setContent(contents || '');
      }
    }

    var t = DEFAULT_FILENAME;
    if ( file ) {
      t = OSjs.Utils.filename(file);
    }

    this._setTitle(this.title + " - " + t);
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

  ApplicationWriterWindow.prototype.checkChanged = function(callback, msg) {
    var gel = this._getGUIElement('WriterRichText');
    if ( gel && gel.hasChanged ) {
      return this._appRef.onConfirmDialog(this, msg, function(discard) {
        if ( discard ) {
          gel.hasChanged = false;
        }
        callback(discard);
      });
    }
    return false;
  };

  ApplicationWriterWindow.prototype.setChanged = function(c) {
    var gel  = this._getGUIElement('WriterRichText');
    if ( gel ) {
      gel.hasChanged = c;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var ApplicationWriter = function(args, metadata) {
    if ( !OSjs.Compability.richtext ) throw "Your platform does not support RichText editing";

    Application.apply(this, ['ApplicationWriter', args, metadata]);

    this.defaultCheckChange  = true;
    this.dialogOptions.mimes = metadata.mime;
    this.dialogOptions.defaultFilename = DEFAULT_FILENAME;
    this.dialogOptions.defaultMime = "osjs/document";
  };

  ApplicationWriter.prototype = Object.create(Application.prototype);

  ApplicationWriter.prototype.init = function(settings, metadata) {
    this.mainWindow = this._addWindow(new ApplicationWriterWindow(this, metadata));
    Application.prototype.init.apply(this, arguments);
  };

  ApplicationWriter.prototype.onNew = function() {
    if ( this.mainWindow ) {
      this.mainWindow.update(null, "");
      this.mainWindow.setChanged(false);
      this.mainWindow._focus();
    }
  };

  ApplicationWriter.prototype.onOpen = function(file, data) {
    if ( this.mainWindow ) {
      this.mainWindow.update(file.path, data);
      this.mainWindow.setChanged(false);
      this.mainWindow._focus();
    }
  };

  ApplicationWriter.prototype.onSave = function(file, data) {
    if ( this.mainWindow ) {
      this.mainWindow.update(file.path);
      this.mainWindow.setChanged(false);
      this.mainWindow._focus();
    }
  };

  ApplicationWriter.prototype.onGetSaveData = function(callback) {
    var data = null;
    if ( this.mainWindow ) {
      data = this.mainWindow.getRichTextData();
    }
    callback(data);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationWriter = ApplicationWriter;

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.GUI, OSjs.Dialogs, OSjs.VFS);
