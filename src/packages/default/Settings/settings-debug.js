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
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  function createAPITab(win, tabs) {
    var tab = tabs.addTab('API', {title: 'API', onSelect: function() {
    }});

    var outer = document.createElement('div');
    outer.className = 'OuterWrapper';

    var output = document.createElement('div');
    output.className = 'APIOutput';

    var app = win._appRef;
    var wm = OSjs.Core.getWindowManager();

    win._addGUIElement(new GUI.Button('TesterNotification', {label: 'Test Desktop Notification', onClick: function() {
      app._call('TestMethod', {'Argument': 'Some Value'}, function(response) {
        if ( wm ) {
          wm.notification({icon: "categories/applications-system.png", title: "GUITest", message: "Notification"});
        }
      });
    }}), outer);

    win._addGUIElement(new OSjs.GUI.Button('TesterAPI', {label: 'Test Application API', onClick: function() {
      app._call('TestMethod', {'Argument': 'Some Value'}, function(response) {
        var txt;
        if ( response.result ) {
          txt = JSON.stringify(response.result) + "\n\n";
        } else {
          txt = "Error occured: " + (response.error || 'Unknown error') + "\n\n";
        }
        Utils.$empty(output);
        output.appendChild(document.createTextNode(txt));
      });
    }}), outer);

    outer.appendChild(output);
    tab.appendChild(outer);
  }

  function createDialogsTab(win, tabs) {
    var tab = tabs.addTab('Dialogs', {title: 'Dialogs', onSelect: function() {
    }});

    var outer = document.createElement('div');
    outer.className = 'OuterWrapper';

    var app = win._appRef;

    var _closeDialog = function(button, result) {
      if ( button === 'destroy' ) return;
      alert("You pressed: " + button + "\nResult: " + JSON.stringify(result));
    };

    var _createDialog = function(name) {
      var opts = [];
      switch ( name ) {
        case 'ApplicationChooser' :
          var apps = Object.keys(OSjs.Core.getHandler().getApplicationsMetadata());
          var fname = OSjs.API.getDefaultPath() + '/test.txt';
          var file  = new OSjs.VFS.File(fname, 'text/plain');
          opts = [file, apps, function(btn, val, def) {
            _closeDialog(btn, {application: val, useDefault: def});
          }];
        break;

        case 'FileProgress' :
          opts = ['File progress dialog', function(btn, val) {
            _closeDialog(btn, {value: val});
          }];
        break;
        case 'FileUpload' :
          opts = ['/foo/bar/', {}, function(btn, result) { // FIXME
            _closeDialog(btn, {result: result});
          }];
        break;
        case 'File' :
          opts = [{}, function(btn, item) {
            _closeDialog(btn, {item: item});
          }];
        break;
        case 'FileInfo' :
          opts = ['/foo.bar', function(btn, item) { // FIXME
            _closeDialog(btn, {item: item});
          }];
        break;

        case 'Input' :
          opts = ['Input dialog description', 'Default value', function(btn, val) {
            _closeDialog(btn, {value: val});
          }];
        break;
        case 'Alert' :
          opts = ['Alert dialog message', function(btn) {
            _closeDialog(btn);
          }];
        break;
        case 'Confirm' :
          opts = ['Confirm dialog message', function(btn) {
            _closeDialog(btn);
          }];
        break;

        case 'Color' :
          opts = [{}, function(btn, rgb, hex, alpha) {
            _closeDialog(btn, {rgb: rgb, hex: hex, alpha: alpha});
          }];
        break;
        case 'Font' :
          opts = [{}, function(btn, name, size) {
            _closeDialog(btn, {name: name, size: size});
          }];
        break;
      }
      app._createDialog(name, opts, win);
    };

    var _createButton = function(name) {
      win._addGUIElement(new GUI.Button(name, {label: name, onClick: function() {
        _createDialog(name);
      }}), outer);
    };

    _createButton('ApplicationChooser');
    _createButton('FileProgress');
    _createButton('FileUpload');
    _createButton('File');
    _createButton('FileInfo');
    _createButton('Input');
    _createButton('Alert');
    _createButton('Confirm');
    _createButton('Color');
    _createButton('Font');

    tab.appendChild(outer);
  }

  function createGUITab(win, tabs) {
    var tab = tabs.addTab('GUI', {title: 'GUI', onSelect: function() {
    }});

    var outer = document.createElement('div');
    outer.className = 'OuterWrapper';

    var  _createElement = function(obj, parentNode) {
      parentNode = parentNode || outer;
      var inner = document.createElement('div');
      var gel = win._addGUIElement(obj, inner);
      parentNode.appendChild(inner);
      return gel;
    };

    var subMenu = [
      {title: 'Sub menu item 1'},
      {title: 'Sub menu item 2'}
    ];

    var menuBar = _createElement(new GUI.MenuBar('TesterMenuBar'));
    menuBar.addItem("Menu Item", [
      {title: 'Sub Item 1', onClick: function() {
      }, menu: subMenu},
      {title: 'Sub Item 2', disabled: true, onClick: function() {
      }}
    ]);
    menuBar.addItem({name: 'testitem', disabled: true, title: "Disabled Menu Item"}, [
      {title: 'Sub Item 1', onClick: function() {
      }, menu: subMenu},
      {title: 'Sub Item 2', onClick: function() {
      }}
    ]);

    var myLabel = _createElement(new GUI.Label('TesterLabel'));

    var buttonouter = document.createElement('div');

    _createElement(new GUI.Button('ButtonTest1', {label: 'Normal Button'}), buttonouter);
    _createElement(new GUI.Button('ButtonTest2', {label: 'Disabled Button', disabled: true}), buttonouter);
    _createElement(new GUI.Button('ButtonTest3', {label: 'Image Button', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon')}), buttonouter);

    outer.appendChild(buttonouter);


    var textArea = _createElement(new GUI.Textarea('TesterTextarea'));
    textArea.setText("Text Area");

    var colorSwatch = _createElement(new GUI.ColorSwatch('TesterColorSwatch', {width: 100, height: 100, onSelect: function() {
      alert("Color select: " + JSON.stringify(arguments));
    }}));

    var statusBar = _createElement(new GUI.StatusBar('TesterStatusBar'));
    statusBar.setText('This is a status bar');

    var sliderHorizontal = _createElement(new GUI.Slider('TesterSliderHorizontal', {min: 0, max: 100, val: 0, onChange: function(value, percentage, evt) {
      if ( !evt || evt === 'mouseup' || evt === 'click' ) {
        alert("Slider value: " + value + " " + percentage + "%");
      }
    }, onUpdate: function() {}}));

    var sliderVertical = _createElement(new GUI.Slider('TesterSliderVertical', {min: 0, max: 100, val: 0, orientation: 'vertical', onChange: function(value, percentage, evt) {
      if ( !evt || evt === 'mouseup' || evt === 'click' ) {
        alert("Slider value: " + value + " " + percentage + "%");
      }
    }, onUpdate: function() {}}));

    var toolBar = _createElement(new GUI.ToolBar('TesterToolBar'));
    toolBar.addItem("Button1", {title: 'Toolbar Button 1'});
    toolBar.addItem("Button2", {title: 'Toolbar Button 2'});
    toolBar.addItem("Button3", {title: 'Toolbar Button 3'});
    toolBar.render();

    var panedView = _createElement(new GUI.PanedView('TesterPanedView'));
    var panedView1 = panedView.createView('View1');
    var panedView2 = panedView.createView('View2');

    var canvas1 = _createElement(new GUI.Canvas('TesterCanvas1'), panedView1);
    var canvas2 = _createElement(new GUI.Canvas('TesterCanvas2'), panedView2);

    var progressbarHorizontal = _createElement(new GUI.ProgressBar('TesterProgressBarHorizontal'));
    progressbarHorizontal.setProgress(50);

    var listView = _createElement(new GUI.ListView('TesterListView'));
    listView.setColumns([
      {'key': 'Column1', 'title': 'Column 1', domProperties: {width: 100}},
      {'key': 'Column2', 'title': 'Column 2'}
    ]);
    listView.setRows([
      {'Column1': 'Test item 1', 'Column2': 'Test item 1'},
      {'Column1': 'Test item 2', 'Column2': 'Test item 2'}
    ]);
    listView.render();

    var iconView = _createElement(new GUI.IconView('TesterIconView'));
    iconView.setData([
      {label: 'IconView 1', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon')},
      {label: 'IconView 2', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon')},
      {label: 'IconView 3', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon')}
    ]);
    iconView.render();

    var treeView = _createElement(new GUI.TreeView('TesterTreeView'));
    treeView.setData([
      {title: 'TreeView root 1', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon')},
      {title: 'TreeView root 2', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon'), items: [
        {title: 'TreeView child 1 -> 2', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon')},
        {title: 'TreeView child 2 -> 2', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon')},
        {title: 'TreeView child 3 -> 2', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon')},
        {title: 'TreeView child 4 -> 2', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon'), items: [
          {title: 'TreeView child 1 -> 4 -> 2', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon')},
          {title: 'TreeView child 2 -> 4 -> 2', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon')}
        ]}
      ]},
      {title: 'TreeView root 3', icon: OSjs.API.getThemeResource('apps/xfwm4.png', 'icon')}
    ]);
    treeView.render();

    // FIXME: On tab select() refresh content!
    var richText = _createElement(new GUI.RichText('TesterRichText', {
      onInited: function() {
        this.setContent('<h1>Rich Text</h1>');
      }
    }));

    var select = _createElement(new GUI.Select('TesterSelect', {onChange: function() {
      alert("GUISelect item: " + JSON.stringify(this.getValue()));
    }}));
    select.addItems({
      'yes':  'Selection box Yes',
      'no':   'Selection box No'
    });

    var select = _createElement(new GUI.SelectList('TesterSelectList', {onChange: function() {
      alert("GUISelectList items: " + JSON.stringify(this.getValue()));
    }}));
    select.addItems({
      'item1' : 'Item 1',
      'item2' : 'Item 2',
      'item3' : 'Item 3',
      'item4' : 'Item 4',
      'item5' : 'Item 5'
    });

    var text = _createElement(new GUI.Text('TesterTextbox'));
    text.setValue("Text input");

    var password = _createElement(new GUI.Text('TesterPasswordbox', {type: 'password'}));
    password.setValue("Password input");

    var checkbox = _createElement(new GUI.Checkbox('TesterCheckbox', {label: 'Checkbox'}));
    var radio1 = _createElement(new GUI.Radio('TesterRadio1', {label: 'Radio 1'}));
    var radio2 = _createElement(new GUI.Radio('TesterRadio2', {label: 'Radio 2'}));

    tab.appendChild(outer);
  }

  function createDnDTab(win, tabs) {
    var tab = tabs.addTab('DnD', {title: 'DnD', onSelect: function() {
    }});

    var outer = document.createElement('div');
    outer.className = 'OuterWrapper';

    outer.appendChild(document.createTextNode("Drag and drop an element into this window to view results.\n\n"));
    win._addGUIElement(new GUI.Textarea('DebugDnDTextarea'), outer);

    tab.appendChild(outer);
  }

  function onCreate(win, root, settings) {
    var container = document.createElement('div');
    var tabs = win._addGUIElement(new GUI.Tabs('TabsDebug'), container);

    createAPITab(win, tabs);
    createGUITab(win, tabs);
    createDialogsTab(win, tabs);
    createDnDTab(win, tabs);

    root.appendChild(container);

    return container;
  }

  function onDnD(win, ev, type, item, args) {
    var el = win._getGUIElement('DebugDnDTextarea');
    if ( el ) {
      var val = JSON.stringify({type: type, item: item, args: args}, null, 4);
      el.setValue(val);
    }
  }

  var SettingsModule = {
    name: 'debug',
    title: 'Debug',
    icon: 'emblems/emblem-system.png',
    onCreate: onCreate,
    onDnD: onDnD,
    applySettings: function() {}
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Modules = OSjs.Applications.ApplicationSettings.Modules || [];
  OSjs.Applications.ApplicationSettings.Modules.push(SettingsModule);

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
