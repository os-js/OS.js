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
 * This file is part Arduino OS, Copyright (c) 2016
 * @author  Sergio Tomasello <sergio@arduino.org>
 * @licence Simplified BSD License
 */
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {
    // jscs:disable validateQuoteMarks
    'use strict';

    /////////////////////////////////////////////////////////////////////////////
    // LOCALES
    /////////////////////////////////////////////////////////////////////////////

    var _Locales = {
        no_NO : {
        },
        pl_PL : {
        },
        sk_SK : {
        },
        de_DE : {
        },
        es_ES : {
        },
        fr_FR : {
        },
        ru_RU : {
        },
        ko_KR : {
        },
        nl_NL : {
        },
        vi_VN : {
        },
        tr_TR : {
        },
        bg_BG : {
        },
        en_EN : {
            'LBL_BACK' : 'Back',
            'LBL_NEXT' : 'Next',
            'LBL_SAVE_RESTART' : 'Save',
            'LBL_WELCOME_1LN' : 'Welcome on Arduino OS Board configuration wizard!',
            'LBL_WELCOME_2LN' : 'Press \'Next\' to start Board configuration.',
            'LBL_BOARD_1LN' : 'Board Settings',
            'LBL_BOARDNAME': 'Board name',
            'LBL_TIMEZONE': 'Timezone',
            'LBL_PASSWORD': 'Password',
            'PLHL_PASSWORD': 'System Password',
            'PLHL_CONF_PASSWORD': 'System password (repeat)',
            'LBL_WIFI_1LN' : 'Wireless Settings',
            'LBL_SCAN' : 'Scan',
            'LBL_WIFI_SSID' : 'Wireless Network Name (SSID)',
            'LBL_WIFI_ENCRYPTION': 'Security',
            'LBL_REST_1LN' : 'Rest Api Settings',
            'LBL_REST_2LN' : 'REST APIs allow you to access your sketch from the web, sending commands or exchanging configuration values. If your board is on a public network, or controlling sensitive equipment, or both, we recommend you leave the REST API password protected.'

        },
        it_IT : {
            'LBL_BACK' : 'Indietro',
            'LBL_NEXT' : 'Avanti',
            'LBL_SAVE_RESTART' : 'Salva',
            'LBL_WELCOME_1LN' : 'Benvenuto nella configurazione rapida della sheda di Arduino OS!',
            'LBL_WELCOME_2LN' : 'Premi \'Avanti\' per iniziare la configurazione della scheda.',
            'LBL_BOARD_1LN' : 'Impostazioni Scheda',
            'LBL_BOARDNAME': 'Nome scheda',
            'LBL_TIMEZONE': 'Fuso orario',
            'PLHL_PASSWORD': 'Password di sistema',
            'PLHL_CONF_PASSWORD': 'Password di sistema (ripeti)',
            'LBL_WIFI_1LN' : 'Impostazioni Wireless',
            'LBL_SCAN' : 'Trova reti',
            'LBL_WIFI_SSID' : 'Nome Rete Wireless (SSID)',
            'LBL_WIFI_ENCRYPTION': 'Sicurezza',
            'LBL_REST_1LN' : 'Rest Api Settings',
            'LBL_REST_2LN' : 'REST APIs allow you to access your sketch from the web, sending commands or exchanging configuration values. If your board is on a public network, or controlling sensitive equipment, or both, we recommend you leave the REST API password protected.'

        }

    };

    function _() {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift(_Locales);
        return API.__.apply(this, args);
    }

    /////////////////////////////////////////////////////////////////////////////
    // EXPORTS
    /////////////////////////////////////////////////////////////////////////////

    OSjs.Applications = OSjs.Applications || {};
    OSjs.Applications.ApplicationArduinoWizardSettings = OSjs.Applications.ApplicationArduinoWizardSettings || {};
    OSjs.Applications.ApplicationArduinoWizardSettings._ = _;

})(OSjs.Helpers.DefaultApplication, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
