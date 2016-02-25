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
(function (Application, Window, Utils, API, VFS, GUI) {
    'use strict';

    /////////////////////////////////////////////////////////////////////////////
    // WINDOWS
    /////////////////////////////////////////////////////////////////////////////

    function ApplicationArduinoWizardSettingsWindow(app, metadata, scheme) {
        Window.apply(this, ['ApplicationArduinoWizardSettingsWindow', {
            icon: metadata.icon,
            title: metadata.name,
            width: 600,
            height: 400,
            maximized: true
        }, app, scheme]);

        this.currentSettings = {
            encryption: '',
            ssid: '',
            timezone: '',
            hostname: '',
            restapi: false
        }
    }

    ApplicationArduinoWizardSettingsWindow.prototype = Object.create(Window.prototype);

    ApplicationArduinoWizardSettingsWindow.constructor = Window.prototype;

    ApplicationArduinoWizardSettingsWindow.prototype.init = function (wmRef, app, scheme) {
        var root = Window.prototype.init.apply(this, arguments);
        var self = this;

        // Load and set up scheme (GUI) here
        scheme.render(this, 'ArduinoWizardSettingsWindow', root);

        this.initUI(wmRef, scheme);

        return root;
    };

    ApplicationArduinoWizardSettingsWindow.prototype.initUI = function (wm, scheme) {
        var self = this;

        var toBeSaved = {
            hostname : false,
            timezone: false,
            syspassword: false,
            wifisetting : false,
            restapi: false
        };

        var step = 0,
            steps = ['WizardStep1Container', 'WizardStep2Container', 'WizardStep3Container', 'WizardStep4Container', 'WizardStep5Container'],
            last_step = steps.length - 1,
            first_step = 0,
            buttons = {prev: "ID_BTN_PREV", next: "ID_BTN_NEXT"};


        //DOM elements:
        var btnPrev = scheme.find(this, "ID_BTN_PREV"),
            btnNext = scheme.find(this, "ID_BTN_NEXT"),
            txtBoardName = scheme.find(this, 'ID_TXT_BOARDNAME'),
            txtSystemPassword = scheme.find(this, "ID_TXT_PASSWORD"),
            txtSystemPasswordConfirm = scheme.find(this, "ID_TXT_CONF_PASSWORD"),
            ddlTimezone = scheme.find(this, "ID_DDL_TIMEZONE"),
            btnScan = scheme.find(this, "ID_BTN_WIFI_SCAN"),
            txtWifiSSID = scheme.find(this, "ID_TXT_WIFI_SSID"),
            ddlWifiSSID = scheme.find(this, "ID_DDL_WIFI_SSID"),
            txtWifiPassword = scheme.find(this, "ID_TXT_WIFI_PASSWORD"),
            ddlWifiEncryption = scheme.find(this, "ID_DDL_WIFI_ENCRYPTION"),
            chkRestApi = scheme.find(this, "ID_CHK_REST_API");

        /* Shared Buttons */
        btnPrev.set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_BACK'));
        btnNext.set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_NEXT'));

        /* Step 1 - Welcome */
        scheme.find(this, "ID_LBL_WS1_LN1").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_WELCOME_1LN'));
        scheme.find(this, "ID_LBL_WS1_LN2").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_WELCOME_2LN'));

        /* Step 2 - Board Setting */
        scheme.find(this, "ID_LBL_WS2_LN1").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_BOARD_1LN'));
        scheme.find(this, "ID_LBL_WS2_BOARDNAME").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_BOARDNAME'));
        scheme.find(this, "ID_LBL_WS2_TIMEZONE").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_TIMEZONE'));
        scheme.find(this, "ID_LBL_WS2_PASSWORD").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_PASSWORD'));
        txtSystemPassword.set("placeholder", OSjs.Applications.ApplicationArduinoWizardSettings._('PLHL_PASSWORD'));
        txtSystemPasswordConfirm.set("placeholder", OSjs.Applications.ApplicationArduinoWizardSettings._('PLHL_CONF_PASSWORD'));

        /* Step 3 - WiFi Setting */
        scheme.find(this, "ID_LBL_WS3_LN1").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_WIFI_1LN'));
        btnScan.set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_SCAN'));
        scheme.find(this, "ID_LBL_WIFI_SSID").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_WIFI_SSID'));
        scheme.find(this, "ID_LBL_WIFI_ENCRYPTION").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_WIFI_ENCRYPTION'));
        scheme.find(this, "ID_LBL_WIFI_PASSWORD").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_PASSWORD'));
            //by default set encryption to 'open'
        ddlWifiEncryption.set('value','open');

        /* Step 4 - Rest Api */
        scheme.find(this, "ID_LBL_WS4_LN1").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_REST_1LN'));
        scheme.find(this, "ID_LBL_WS4_LN2").set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_REST_2LN'));

        toggleVisibility();
        /* EVENTS */

        btnNext.on('click', function () {
            /*if (step < steps.length - 1) {
                    step++;
            }
            toggleVisibility();*/

            switch(step){
                case 0: // 0->1 - Welcome -> Board Settings
                    step++;
                    toggleVisibility();
                    break;
                case 1: // 1->2 - Board Settings -> WiFi Settings
                    if(checkSystemPasswordFields() && checkBoardNameField() && checkTimezoneField()) {
                        step++;
                        toggleVisibility();
                    }
                    break;
                case 2: // 2->3 - WiFi Settings -> Rest Api
                    if(checkWiFiField()) {
                        step++;
                        toggleVisibility();
                    }
                    break;
                case 3: // 3->4 - Rest Api -> Save and Restart
                    if(checkRestApiField()) {
                        step++;
                        toggleVisibility();
                    }
                    break;
                case 4: // 4->// - Save and Restart -> APPLY CHANGES
                    //step++;
                    //toggleVisibility();
                    saveAndRestart();
                    break;
            }

        });
        btnPrev.on('click', function () {
            if (step > 0) {
                step--;
            }
            toggleVisibility();
        });
        btnScan.on('click', function(ev) {
            scanNetworks();
        });
        ddlWifiSSID.on('change', function(ev) {
            if ( ev.detail ) {
                var data = null;
                try {
                    data = JSON.parse(ev.detail);
                } catch ( e ) {}

                console.warn(data);

                if ( data ) {
                    var enc = data.encryption.toLowerCase().replace(/[^A-z0-9]/, '');
                    var map = {'wep': 'wep', 'wpa': 'psk', 'wpa2': 'psk2'};
                    if ( enc == 'unknown' ) { enc = 'open'; }
                    if ( map[enc] ) {
                        enc = map[enc];
                    }

                    txtWifiPassword.set('value', '');
                    txtWifiSSID.set('value', data.ssid);
                    ddlWifiEncryption.set('value', enc);
                }
            }
        });

        getCurrentBoardSettings();
        getCurrentWifiSettings();
        scanNetworks();

        function getCurrentWifiSettings() {
            callAPI('iwinfo', {}, function (err, result) {
                /*var info = (result || '').split(' ');
                var keys = ['ap', 'ssid', 'security', 'signal'];
                var list = {};

                keys.forEach(function (key, idx) {
                    if (key !== 'security') { // FIXME
                        list[key] = info[idx] || null;
                    }
                });

                var ssid = list['ssid'] !== '<none>' ? list['ssid'] : '';
                var secu = list['security'] !== '<none>' ? list['security'] : '';
                 */

                if ( !err && result ) {
                  var ssid = result['ssid'] !== '<none>' ? result['ssid'].trim() : '';
                  var secu = result['security'] !== '<none>' ? result['security'].trim() : '';


                  txtWifiSSID.set("value", ssid);
                  ddlWifiEncryption.set("value", secu); //FIXME at the moment the security is always <none>

                  //set the current settings
                  self.currentSettings.encryption = secu;
                  self.currentSettings.ssid = ssid;
                }

            });
        }

        function getCurrentBoardSettings() {
            callAPI('sysinfo', {}, function (err, result) {
                if (err) {
                    alert(err);
                    return;
                }
                ddlTimezone.set('value', result.timezone.trim());
                txtBoardName.set('value', result.hostname);
                chkRestApi.set('value', (result.rest || '').replace(/\s+$/, '') === 'true');

                //set the current settings
                self.currentSettings.timezone = result.timezone.trim();
                self.currentSettings.hostname = result.hostname;
                self.currentSettings.restapi = (result.rest || '').replace(/\s+$/, '') === 'true';
            });
        }

        function toggleVisibility() {
            steps.forEach(function (key, idx) {
                if (step === idx) {
                    scheme.find(self, key).show();
                } else {
                    scheme.find(self, key).hide();
                }

                if (step === first_step) {
                    scheme.find(self, buttons.prev).hide();
                } else {
                    if (step === last_step) {
                        scheme.find(self, buttons.next).set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_SAVE_RESTART'));
                    } else {
                        scheme.find(self, buttons.prev).show();
                        scheme.find(self, buttons.next).set("value", OSjs.Applications.ApplicationArduinoWizardSettings._('LBL_NEXT'));
                    }
                }

            });
        }

        function checkSystemPasswordFields(){
            if ( txtSystemPassword.get('value') !== txtSystemPasswordConfirm.get('value') ) {
                API.createDialog('Error',
                    {   title: 'Password Check', //TODO localize
                        message: 'Password check fails', //TODO localize
                        error: 'Passwords do not match. Please insert passwords again.'}, //TODO localize
                    function(ev, btn, res){});

                toBeSaved.syspassword = false;
                return false;
            } else {
                if(!!txtSystemPassword.get('value')){ //password changed

                    if(txtSystemPassword.get('value').length < 8 ){
                        API.createDialog('Error',
                            {   title: 'Password Check', //TODO localize
                                message: 'Password check fails', //TODO localize
                                error: 'Password must be at least 8 characters. Please insert password again.'}, //TODO localize
                            function(ev, btn, res){});
                        toBeSaved.syspassword = false;
                        return false;
                    }

                    toBeSaved.syspassword = true;
                } else { //password not changed

                   toBeSaved.syspassword = false;
                }
                return true;
            }
        }

        function checkTimezoneField(){
            if (ddlTimezone.get('value') === self.currentSettings.timezone) { // when the timezone is the same as before
                toBeSaved.timezone = false;
            } else {
                toBeSaved.timezone = true;
            }

            return true;
        }

        function checkRestApiField(){
            if (chkRestApi.get('value') === self.currentSettings.restapi) { // when the timezone is the same as before
                toBeSaved.restapi = false;
            } else {
                toBeSaved.restapi = true;
            }
            return true;
        }

        function checkBoardNameField(){
            //TODO check for special chars
            var boardname = txtBoardName.get('value').replace(/ /g,'');
            txtBoardName.set('value', boardname);
            if ( !boardname ) {
                API.createDialog('Error',
                    {   title: 'Board Name Check', //TODO localize
                        message: 'Board Name check fails', //TODO localize
                        error: 'Please insert a valid name.'}, //TODO localize
                    function(ev, btn, res){});
                toBeSaved.hostname = false;
                return false;
            } else {
                if(boardname === self.currentSettings.hostname){
                    toBeSaved.hostname = false;
                } else {
                    toBeSaved.hostname = true;
                }
                return true;
            }
        }

        function checkWiFiField(){
            if( !txtWifiSSID.get('value').trim() ) { //
                API.createDialog('Error',
                    {   title: 'Wireless Network Check', //TODO localize
                        message: 'Wireless Network check fails', //TODO localize
                        error: 'Please insert a valid wireless network name. Try to scan the networks and select a valid SSID.'}, //TODO localize
                    function(ev, btn, res){});
                toBeSaved.wifisetting = false;
                return false;
            } else {
                var pass = txtWifiPassword.get('value'),
                    enc = ddlWifiEncryption.get('value');

                if (txtWifiSSID.get('value').trim() === self.currentSettings.ssid.trim()) { // when the ssid is the same as before

                    if(!!pass){ // but the password changed
                        toBeSaved.wifisetting = true;
                        return true;
                    } else {  // and the password not changed
                        toBeSaved.wifisetting = false;
                        return true;
                    }

                } else {
                    if(!!enc){
                        if(enc === 'open'){
                            toBeSaved.wifisetting = true;
                            return true;
                        } else{
                            if(!!pass && !!enc){ // password and ecnryption are setted
                                toBeSaved.wifisetting = true;
                                return true;
                            } else {
                                toBeSaved.wifisetting = false;
                                //alert('Please set a valid password and encryption'); //TODO localize
                                API.createDialog('Error',
                                    {   title: 'Wireless Network Check', //TODO localize
                                        message: 'Wireless Network check fails', //TODO localize
                                        error: 'Please set a valid password and encryption.'}, //TODO localize
                                    function(ev, btn, res){});
                                return false;
                            }
                        }

                    }
                }
            }
        }

        function saveAndRestart() {

            var blackout = document.createElement('div');
            blackout.style.position = 'absolute';
            blackout.style.top = '0';
            blackout.style.left = '0';
            blackout.style.right = '0';
            blackout.style.bottom = '0';
            blackout.style.zIndex = 10000;
            blackout.style.backgroundColor = 'rgba(0, 0, 0, .5)';
            document.body.appendChild(blackout);

            //self._toggleDisabled(true);
            var dialog = API.createDialog('FileProgress', {
                    title: 'Arduino Configuration Wizard ', //TODO localize
                    message: 'Applying settings...' //TODO localize
                }, function(btn) {
                //self._toggleDisabled(false);
                //self._close();
            });
            dialog.busy = true;

            dialog.setProgress(10);
            //var rebootMessage =  OSjs.Applications.ApplicationArduinoWizardSettings._('MSG_BOARD_RESTART');
            //var newNetworkMessage = Utils.format( OSjs.Applications.ApplicationArduinoWizardSettings._('MSG_NEW_WIFI') , txtWifiSSID.get('value'));
            //var redirectMessage = Utils.format( OSjs.Applications.ApplicationArduinoWizardSettings._('MSG_REDIRECT_TO') , window.location.protocol+ '//' + txtBoardName.get('value') + '.local/');

            var info = {};

            // This is a map of all "toBesaved"
            // These are called to set "info" variable above
            var map = {
                hostname: function() {
                    info.hostname = txtBoardName.get('value');
                },
                timezone: function() {
                    info.timezone = ddlTimezone.get('value');
                },
                syspassword: function() {
                    info.password = txtSystemPassword.get('value');
                },
                wifisetting: function() {
                    info.wifi = {
                        ssid: txtWifiSSID.get('value'),
                        encryption: ddlWifiEncryption.get('value'),
                        password: txtWifiPassword.get('value')
                    };
                },
                restapi: function() {
                    info.restapi = chkRestApi.get('value') ? 'true' : 'false';
                }

            };

            // Put all to be saved elements into our api call argument list
            Object.keys(map).forEach(function(key) {
                if ( toBeSaved[key] ) {
                    map[key]();
                }
            });

            // One call to rule them all. In lua server script, just check what "keys" were sent over
            callAPI('wizardboardconfig', info, function() {
                var  step = 3,
                    redirectURL = window.location.protocol+ '//' + txtBoardName.get('value') + '.local/' ;
                dialog.setProgress(20);
                dialog.setMessage("Restarting..."); //TODO localize

                var intervalReboot = setInterval(function(){
                    dialog.setProgress(step * 10);
                    if(step === 5 ){
                        dialog.setMessage("Restarting... Connect your computer to the wireless network called " + txtWifiSSID.get('value') ); //TODO localize
                    }
                    if(step === 8 ){
                        dialog.setMessage("Redirecting to " + redirectURL); //TODO localize
                    }
                    if(step++ === 10){
                        disableWizard(function(){
                            window.location.href =  redirectURL;
                        });
                        clearInterval(intervalReboot);
                    }
                }, 10 * 1000);



            });
        }

        function scanNetworks(){
            callAPI('iwscan', {device: 'radio0'}, function(err, result) {
                ddlWifiSSID.clear();

                if ( !err && result ) {
                    var list = [{
                        label: '--- SELECT FROM LIST ---', //TODO Localize
                        value: null
                    }];

                    (result || []).forEach(function(iter) {
                        if ( iter ) {
                            list.push({
                                label: Utils.format('{0} ({1}, {2}% signal)', iter.ssid, iter.encryption, iter.signal),
                                value: JSON.stringify(iter)
                            });
                        }
                    });

                    ddlWifiSSID.add(list);
                }
            });
        }

        function disableWizard(oncomplete){
            var pool = OSjs.Core.getSettingsManager().instance('Wizard');
            pool.set('completed', true, oncomplete);
        }

        function callAPI(fn, args, cb) {
            cb = cb || function(){};
            self._toggleLoading(true);
            API.call(fn, args, function (response) {
                self._toggleLoading(false);
                return cb(response.error, response.result);
            }, function (err) {
                err = 'Error while communicating with device: ' + (err || 'Unkown error (no response)');
                wm.notification({title: 'Arduino Settings', message: err, icon: 'status/error.png'});
            }, {
                timeout: 20000,
                ontimeout: function () {
                    self._toggleLoading(false);
                    return cb('Request timed out');
                }
            });
        }

    };

    ApplicationArduinoWizardSettingsWindow.prototype.destroy = function () {
        Window.prototype.destroy.apply(this, arguments);
    };

    /////////////////////////////////////////////////////////////////////////////
    // APPLICATION
    /////////////////////////////////////////////////////////////////////////////

    function ApplicationArduinoWizardSettings(args, metadata) {
        Application.apply(this, ['ApplicationArduinoWizardSettings', args, metadata]);
    }

    ApplicationArduinoWizardSettings.prototype = Object.create(Application.prototype);

    ApplicationArduinoWizardSettings.constructor = Application;

    ApplicationArduinoWizardSettings.prototype.destroy = function () {
        return Application.prototype.destroy.apply(this, arguments);
    };

    ApplicationArduinoWizardSettings.prototype.init = function (settings, metadata, onInited) {
        Application.prototype.init.apply(this, arguments);

        var self = this;
        var url = API.getApplicationResource(this, './scheme.html');
        var scheme = GUI.createScheme(url);
        scheme.load(function (error, result) {
            self._addWindow(new ApplicationArduinoWizardSettingsWindow(self, metadata, scheme));
            onInited();
        });

        this._setScheme(scheme);
    };

    /////////////////////////////////////////////////////////////////////////////
    // EXPORTS
    /////////////////////////////////////////////////////////////////////////////

    OSjs.Applications = OSjs.Applications || {};
    OSjs.Applications.ApplicationArduinoWizardSettings = OSjs.Applications.ApplicationArduinoWizardSettings || {};
    OSjs.Applications.ApplicationArduinoWizardSettings.Class = ApplicationArduinoWizardSettings;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
