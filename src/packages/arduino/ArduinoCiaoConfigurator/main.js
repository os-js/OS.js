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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoCiaoConfiguratorWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationArduinoCiaoConfiguratorWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 800,
      height: 600
    }, app, scheme]);
  }

  ApplicationArduinoCiaoConfiguratorWindow.prototype = Object.create(Window.prototype);
  ApplicationArduinoCiaoConfiguratorWindow.constructor = Window.prototype;


  //TODO Manage errors
  ApplicationArduinoCiaoConfiguratorWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    //Check if Ciao is installed
    callAPI('opkg', {command: "list", args : {category : "installed"}}, function(err,res){
      if(err){
        console.log("ERROR in installation phase: " + err);
        wmRef.notification({
          icon: "apps/update-manager.png",
          title: "Error",
          message: err
        });
      }
      if(res.indexOf("ciao")<0)
        API.createDialog("Confirm", {buttons: ['yes', 'no'], message: "Ciao library not found.\n Do you want install it?" },
          function(ev, button) {
            if (button == "yes"){
              self._toggleLoading(true);
              callAPI('opkg', {command: "install", args : {packagename : "ciao"}}, function(err,res){
                var msg = "Done"
                if(err)
                  msg = "Error";

                  wmRef.notification({
                    icon: "apps/update-manager.png",
                    title: "Ciao installation",
                    message: msg
                  });

                  self._toggleLoading(false);
                  self.initUI(scheme, app);
              });
            }
            else
              app.destroy();
          });
      else
        self.initUI(scheme, app);
    });

    // Load and set up scheme (GUI) here
    scheme.render(this, 'ArduinoCiaoConfiguratorWindow', root);

    return root;
  };


  ApplicationArduinoCiaoConfiguratorWindow.prototype.initUI = function (scheme, app) {
    var self = this;
    var ciaoPath = "root:///" + "usr/lib/python2.7/ciao/conf";
    var ciaoPathRoot = "root:///" + "usr/lib/python2.7/ciao";
    var connectorsSelectView = this._scheme.find(this, 'SelectConnectorView');
    var connectorsList = [{label: "Select connector", value: null}];

    VFS.scandir(ciaoPath, function(err,res){
      if(err) {
        console.log("Ciao err:" + err);
        API.createDialog("Error", {
          title : "Ciao Error",
          message : "Ciao conf directory not found\nThe app will be closed",
          error : err
        }, function (ev, button, result){
          app.destroy();
        });

      }
      connectorsSelectView.clear();
      res.forEach(function(item, index, array){
         //item = { filename:"ArduinoLuci" , id:null , mime:"" , path:"root:///osjs/dist/packages/target/ArduinoLuci" , size:0 , type:"dir" }
        var connectorName = item.filename.split(".")[0];
        connectorsList.push({
              label: connectorName,
              value: connectorName
        });
      });
      connectorsSelectView.add(connectorsList);

    }, {backlink:false});

    var editConfigurationButton = this._scheme.find(this, 'editConfigurationButton');
    editConfigurationButton.set('disabled', true);
    var editConnectorCoreConfButton = this._scheme.find(this, 'editConnectorCoreConfButton');
    editConnectorCoreConfButton.set('disabled', true);


    scheme.find(this, 'SelectConnectorView').on('change', function(evChange) {
      if (evChange.detail != "null")
      {
        editConfigurationButton.set('disabled', false);
        editConnectorCoreConfButton.set('disabled', false);

        self.showConnectorConf(evChange.detail, ciaoPathRoot, self);


      }
      else {
        editConfigurationButton.set('disabled', true);
        editConnectorCoreConfButton.set('disabled', true);
        scheme.find(self, 'ConnectorConfView').clear();
      }
    });

    scheme.find(this, 'editConnectorCoreConfButton').on('click', function (evClick) {

      var confFile = new VFS.File (ciaoPathRoot + "/connectors/" + scheme.find(self, 'SelectConnectorView').get("value") + "/" + scheme.find(self, 'SelectConnectorView').get("value") + ".json.conf", "text/plain");

      console.log("@"+confFile)
      if(scheme.find(self, 'SelectConnectorView').get("value") != "null") {
        scheme.find(self, 'SelectConnectorView').get("value");

        API.createDialog("Alert", {title: "Alert", message: "To apply changes reset MCU or upload a new Ciao sketch." }, function() {});

        API.launch('ApplicationCodeMirror', {file: confFile});
      }
    });

    scheme.find(this, 'editConfigurationButton').on('click', function (evClick) {

      var confFile = new VFS.File (ciaoPathRoot + "/conf/" + scheme.find(self, 'SelectConnectorView').get("value") + ".json.conf", "text/plain");

      if(scheme.find(self, 'SelectConnectorView').get("value") != "null") {
        scheme.find(self, 'SelectConnectorView').get("value");

        API.createDialog("Alert", {title: "Alert", message: "To apply changes reset MCU or upload a new Ciao sketch." }, function() {});

        API.launch('ApplicationCodeMirror', {file: confFile});
        //API.launch('ApplicationTextpad', {file: confFile});
      }
    });
  };

  function callAPI(fn, args, cb) {
    //self._toggleLoading(true);
    API.call(fn, args, function(response) {
      //self._toggleLoading(false);
      return cb(response.error, response.result);
    });
  }

  ApplicationArduinoCiaoConfiguratorWindow.prototype.showConnectorConf = function (selection, ciaoPath, wind){
    var connectorConfView = this._scheme.find(this, 'ConnectorConfView');
    var ConnectorCoreConfView = this._scheme.find(this, 'ConnectorCoreConfView');
    var CommandsView = this._scheme.find(this, 'CommandsView');

    var coreConfObj = {}, connectorConfObj = {}, paramsConnectorConfObj = {}, connectorConfFile;
    var conf = [], confCore = [], thisScheme = this._scheme, thisWindow = Window;

    VFS.read(ciaoPath + "/conf/" + selection + ".json.conf", function (err, res){
      if(err) {
        console.log("Error in connector conf file opening : " + err);
        API.createDialog("Error", {
          title : "Ciao Error",
          message : "Problem in connector conf file opening",
          error : err
        });
      }
      else {
        VFS.abToBinaryString(res, "application/json", function(e,r) {
          if (e) {
            console.log("Error in file reading : " + e);
            API.createDialog("Error", {
              title : "Ciao Error",
              message : "Problem in conf file ellaboration",
              error : err
            });
          }
          else {
            coreConfObj = JSON.parse(r);

            for (var key in coreConfObj) {
              if (coreConfObj.hasOwnProperty(key)) {
                if(typeof coreConfObj[key] == "object")
                  confCore.push({
                    value: coreConfObj[key],
                    columns: [
                      {label: key},
                      {label: JSON.stringify(coreConfObj[key])}
                    ]
                  });
                else
                confCore.push({
                  value: coreConfObj[key],
                  columns: [
                    {label: key},
                    {label: coreConfObj[key]}
                  ]
                });
              }
            }

            connectorConfFile = (coreConfObj.commands.start[0].split(coreConfObj.name)[0]) + coreConfObj.name + "/" + coreConfObj.name + ".json.conf";
            console.log(connectorConfFile);
            VFS.read("root://" + connectorConfFile, function (err, res) {
              if (err){
                console.log("Error in core conf file opening : " + err);
                API.createDialog("Error", {
                  title : "Ciao Error",
                  message : "Problem in core conf file opening",
                  error : err
                });
              }
              else{
                VFS.abToBinaryString(res, "application/json", function(e,r) {
                  connectorConfObj = JSON.parse(r);
                  paramsConnectorConfObj = connectorConfObj.params;
                  for (var key in paramsConnectorConfObj) {
                    if (paramsConnectorConfObj.hasOwnProperty(key)) {
                      if(typeof paramsConnectorConfObj[key] == "object")
                        conf.push({
                          value: paramsConnectorConfObj[key],
                          columns: [
                            {label: key},
                            {label: JSON.stringify(paramsConnectorConfObj[key])}
                          ]
                        });

                      else
                      conf.push({
                        value: paramsConnectorConfObj[key],
                        columns: [
                          {label: key},
                          {label: paramsConnectorConfObj[key]}
                        ]
                      });
                    }
                  }
                  connectorConfView.clear();
                  ConnectorCoreConfView.clear();
                  connectorConfView.set('columns', [
                    {label: 'Key', basis: '30px', grow: 1, shrink: 1},
                    {label: 'Value', basis: '90px', grow: 1, shrink: 1, textalign: 'left'}
                  ]);
                  ConnectorCoreConfView.set('columns', [
                    {label: 'Key', basis: '30px', grow: 1, shrink: 1},
                    {label: 'Value', basis: '650px', grow: 0, shrink: 0, textalign: 'left'}
                  ]);
                  connectorConfView.add(conf);
                  ConnectorCoreConfView.add(confCore);
                });
              }
            });
          }
        });
      }
    });
  }



  ApplicationArduinoCiaoConfiguratorWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoCiaoConfigurator(args, metadata) {
    Application.apply(this, ['ApplicationArduinoCiaoConfigurator', args, metadata]);
  }

  ApplicationArduinoCiaoConfigurator.prototype = Object.create(Application.prototype);
  ApplicationArduinoCiaoConfigurator.constructor = Application;

  ApplicationArduinoCiaoConfigurator.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationArduinoCiaoConfigurator.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationArduinoCiaoConfiguratorWindow(self, metadata, scheme));
      onInited();
    });

    this._setScheme(scheme);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationArduinoCiaoConfigurator = OSjs.Applications.ApplicationArduinoCiaoConfigurator || {};
  OSjs.Applications.ApplicationArduinoCiaoConfigurator.Class = ApplicationArduinoCiaoConfigurator;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
