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
(function() {
  // jscs:disable validateQuoteMarks
  'use strict';

  OSjs.Locales = OSjs.Locales || {};

  OSjs.Locales.sk_SK = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Chyba pri otváraní súboru',
    'ERR_WM_NOT_RUNNING'        : 'Správca okien nebeží',
    'ERR_FILE_OPEN_FMT'         : 'Súbor \'**{0}**\' sa nedá otvoriť',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Neviem nájsť Aplikáciu pre otvorenie súboru \'{0}\'',
    'ERR_APP_LAUNCH_FAILED'     : 'Chyba pri spúšťaní Aplikácie',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Nastala chyba pri spúšťaní Aplikácie: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Aplikácia \'{0}\' chyba pri konštrukcii: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Aplikácia \'{0}\' chyba pri funkcii init(): {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Aplikácia \'{0}\' chýbajú prostriedky pre spustenie alebo nastala chyba pri zavádzaní!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Aplikácia \'{0}\' chyba pri zavádzaní: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'Aplikácia \'{0}\' už beží a je povolená iba jedna inštancia!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Chyba pri spustení \'{0}\'. Súpisné dáta Aplikácie sa nenašli!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Chyba pri spustení \'{0}\'. Váš prehliadač nie je podporovaný: {1}',

    'ERR_NO_WM_RUNNING'         : 'Správca okien nebeží',
    'ERR_CORE_INIT_FAILED'      : 'Chyba pri inicializácii OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'Nastala chyba pri inicializácii OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'Nemôžem spustiť OS.js: Nie je definovaný žiadny Správca okien!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'Nemôžem spustiť OS.js: Chyba pri spúšťaní Správcu okien: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'Nemôžem spustiť OS.js: Chyba pri zavádzaní prostriedkov...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'Chybová správa JavaScript',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Vyskytla sa neočakávaná chyba, možno sa jedná o chybu v programe.',

    'ERR_APP_API_ERROR'           : 'Chyba v API Aplikácie',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Aplikácia {0} chyba pri vykonávaní operácie \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Chýbajúci argument: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Neznáma chyba',

    'ERR_OPERATION_TIMEOUT'       : 'Časový limit vypršal',
    'ERR_OPERATION_TIMEOUT_FMT'   : 'Časový limit vypršal ({0})',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Okno s názvom \'{0}\' už existuje',
    'WINDOW_MINIMIZE' : 'Minimalizovať',
    'WINDOW_MAXIMIZE' : 'Maximalizovať',
    'WINDOW_RESTORE'  : 'Obnoviť',
    'WINDOW_CLOSE'    : 'Zatvoriť',
    'WINDOW_ONTOP_ON' : 'Vždy na vrchu (Zapnúť)',
    'WINDOW_ONTOP_OFF': 'Vždy na vrchu (Vypnúť)',

    // Handler
    'TITLE_SIGN_OUT' : 'Odhlásiť sa',
    'TITLE_SIGNED_IN_AS_FMT' : 'Prihlásený ako: {0}',

    // SESSION
    'MSG_SESSION_WARNING' : 'Ste si istý že chcete opustiť OS.js? Všetky neuložené nastavenia a dáta aplikácii budú vymazané!',

    // Service
    'BUGREPORT_MSG' : 'Prosím nahláste túto chybu, ak si myslíte že sa jedná o chybu aplikácie.\nPripojte krátky popis ako k chybe došlo, a ak je to možné informáciu ako ju môžeme zopakovať',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Prihlásený k externej službe: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Fatálna chyba',
    'ERR_UTILS_XHR_FMT' : 'Chyba AJAX/XHR: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Odhlásiť sa (Ukončiť)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Odhlásenie užívateľa \'{0}\'.\nŽeláte si uložiť nastavenia?',

    'DIALOG_CLOSE' : 'Zatvor',
    'DIALOG_CANCEL': 'Zrušiť',
    'DIALOG_APPLY' : 'Použiť',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'Výstraha',

    'DIALOG_COLOR_TITLE' : 'Výber farby',
    'DIALOG_COLOR_R' : 'Červená: {0}',
    'DIALOG_COLOR_G' : 'Zelená: {0}',
    'DIALOG_COLOR_B' : 'Modrá: {0}',
    'DIALOG_COLOR_A' : 'Alpha: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Potvrdiť',

    'DIALOG_ERROR_MESSAGE'   : 'Správa',
    'DIALOG_ERROR_SUMMARY'   : 'Sumár',
    'DIALOG_ERROR_TRACE'     : 'Stopovanie',
    'DIALOG_ERROR_BUGREPORT' : 'Nahlásiť chybu',

    'DIALOG_FILE_SAVE'      : 'Uložiť',
    'DIALOG_FILE_OPEN'      : 'Otvoriť',
    'DIALOG_FILE_MKDIR'     : 'Nový adresár',
    'DIALOG_FILE_MKDIR_MSG' : 'Vytvor nový adresár v **{0}**',
    'DIALOG_FILE_OVERWRITE' : 'Ste si istý že chcete nahradiť súbor \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Zobraziť ako',
    'DIALOG_FILE_MNU_LISTVIEW' : 'List',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Strom',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Ikony',
    'DIALOG_FILE_ERROR'        : 'Chyba pri práci so súborom',
    'DIALOG_FILE_ERROR_SCANDIR': 'Chyba pri čítaní adresára \'{0}\'',
    'DIALOG_FILE_MISSING_FILENAME' : 'Vyberte si súbor alebo zadajte meno nového súboru',
    'DIALOG_FILE_MISSING_SELECTION': 'Vyberte si súbor!',

    'DIALOG_FILEINFO_TITLE'   : 'Informácie o súbore',
    'DIALOG_FILEINFO_LOADING' : 'Nahrávam informácie o súbore: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Chyba pri získavaní informácií o súbore',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Nie je možné získať informácie o **{0}**',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Nie je možné získať informácie o súbore: {0}',

    'DIALOG_INPUT_TITLE' : 'Vstupný dialóg',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Stav práce so súborom',
    'DIALOG_FILEPROGRESS_LOADING' : 'Nahrávam...',

    'DIALOG_UPLOAD_TITLE'   : 'Nahraj na server',
    'DIALOG_UPLOAD_DESC'    : 'Nahrávam súbor do **{0}**.<br />Maximálna veľkosť" {1} bajtov',
    'DIALOG_UPLOAD_MSG_FMT' : 'Nahrávam na server \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : 'Nahrávam súbor na server...',
    'DIALOG_UPLOAD_FAILED'  : 'Nahrávanie na server sa nepodarilo',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Nahrávanie na server sa nepodarilo',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Neznámy dôvod...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Zrušené užívateľom...',
    'DIALOG_UPLOAD_TOO_BIG': 'Súbor je príliš veľký',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Súbor je príliš veľký, presahuje {0}',

    'DIALOG_FONT_TITLE' : 'Výber písma',

    'DIALOG_APPCHOOSER_TITLE' : 'Vyberte Aplikáciu',
    'DIALOG_APPCHOOSER_MSG'   : 'Vyberte Aplikáciu ktorou chcete otvoriť',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Vyberte si aplikáciu',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Použi ako východziu aplikáciu pre {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPI Modul je vypnutý alebo nie je nakonfigurovaný',
    'GAPI_SIGN_OUT'           : 'Odhlásiť sa z Google API Services',
    'GAPI_REVOKE'             : 'Odobrať práva a odhlásiť',
    'GAPI_AUTH_FAILURE'       : 'Google API autentifikácia sa nepodarila alebo sa neuskutočnila',
    'GAPI_AUTH_FAILURE_FMT'   : 'Nepodarilo sa autentifikovať: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Chyba pri nahrávaní Google API',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Windows Live API modul je vypnutý alebo nie je nakonfigurovaný',
    'WLAPI_SIGN_OUT'          : 'Odhlásiť sa z Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'Chyba pri nahrávaní Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'Chyba pri prihlasovaní do Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Chyba pri prihlasovaní do Windows Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API vrátil status {0}',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Nemôžem vytvoriť IndexedDB bez mena databázy',
    'IDB_NO_SUCH_ITEM'   : 'Položka neexistuje',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Fatálna chyba',
    'ERR_VFS_UNAVAILABLE'     : 'Nie je dostupný',
    'ERR_VFS_FILE_ARGS'       : 'Súbor vyžaduje aspoň jeden argument',
    'ERR_VFS_NUM_ARGS'        : 'Málo argumentov',
    'ERR_VFS_EXPECT_FILE'     : 'Očakáva súbor-objekt',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Očakáva zdrojový súbor-objekt',
    'ERR_VFS_EXPECT_DST_FILE' : 'Očakáva cieľový súbor-objekt',
    'ERR_VFS_FILE_EXISTS'     : 'Cieľ už existuje',
    'ERR_VFS_TRANSFER_FMT'    : 'Nastala chyba počas prenosu medzi úložiskom: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Nemôžem nahrať na server súbor bez špecifikovaného cieľa',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Nemôžem nahrať na server bez špecifikovaných súborov',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Nepodarilo sa nahrať na server: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Nahrávanie na server bolo zrušené',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Nemôžem stiahnuť cestu k súboru',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Nastala chyba pri sťahovaní: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'Prázdna odpoveď',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Sťahujem súbor',

    'ERR_VFSMODULE_XHR_ERROR'      : 'Chyba XHR',
    'ERR_VFSMODULE_ROOT_ID'        : 'Nepodarilo sa nájsť id hlavného (koreňového) adresára',
    'ERR_VFSMODULE_NOSUCH'         : 'Súbor neexistuje',
    'ERR_VFSMODULE_PARENT'         : 'Nadradený adresár neexistuje',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Nepodarilo sa nájsť nadradený adresár: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Chyba pri čítaní adresára',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Chyba pri čítaní adresára: {0}',
    'ERR_VFSMODULE_READ'           : 'Chyba pri čítaní súboru',
    'ERR_VFSMODULE_READ_FMT'       : 'Chyba pri čítaní súboru: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Chyba pri zápise do súboru',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Chyba pri zápise do súboru: {0}',
    'ERR_VFSMODULE_COPY'           : 'Chyba pri kopírovaní',
    'ERR_VFSMODULE_COPY_FMT'       : 'Chyba pri kopírovaní: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Chyba pri mazaní súboru',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Chyba pri mazaní súboru: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Chyba pri presune súboru',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Chyba pri presune súboru: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Chyba pri overovaní existenciu súboru',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Chyba pri overovaní existenciu súboru: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Chyba pri získavaní informácií o súbore',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Chyba pri získavaní informácií o súbore: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Chyba pri vytváraní adresára',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Chyba pri vytváraní adresára: {0}',
    'ERR_VFSMODULE_URL'            : 'Chyba pri získavaní URL pre súbor',
    'ERR_VFSMODULE_URL_FMT'        : 'Chyba pri získavaní URL pre súbor: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Chyba pri presune súboru do koša',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Chyba pri presune súboru do koša: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Chyba pri presune súboru z koša',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Chyba pri presune súboru z koša: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Chyba pri vysýpaní koša',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Chyba pri vysýpaní koša: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Ste prihlásený do Dropbox API',
    'DROPBOX_SIGN_OUT'           : 'Odhlásiť z Google API Services',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Chyba v ceste: Položka nebola nájdená',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'Adresár pre inštaláciu balíkov už existuje. Nemôžem pokračovať!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Nemôžem otvoriť súbor',
    'ERR_FILE_APP_OPEN_FMT'     : 'Súbor {0} sa nedá otvoriť pretože mime typ {1} nie je podporovaný',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Súbor {0} sa nedá otvoriť',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Súbor {0} sa nedá uložiť',
    'ERR_GENERIC_APP_FMT'       : '{0} Chyba Aplikácie',
    'ERR_GENERIC_APP_ACTION_FMT': 'Nepodarilo sa uskutočniť akciu \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Neznáma chyba',
    'ERR_GENERIC_APP_REQUEST'   : 'Chyba počas obsluhy Vášho požiadavku',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Fatálna chyba: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Zrušiť zmeny?',
    'MSG_FILE_CHANGED'          : 'Súbor sa zmenil. Chcete zmeny načítať?',
    'MSG_APPLICATION_WARNING'   : 'Varovanie Aplikácie',
    'MSG_MIME_OVERRIDE'         : 'Typ súboru "{0}" nie je podporovaný, použijem "{1}".',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Neznámi',
    'LBL_APPEARANCE'   : 'Výskyt',
    'LBL_USER'         : 'Užívateľ',
    'LBL_NAME'         : 'Meno',
    'LBL_APPLY'        : 'Použiť',
    'LBL_FILENAME'     : 'Názov súboru',
    'LBL_PATH'         : 'Cesta',
    'LBL_SIZE'         : 'Veľkosť',
    'LBL_TYPE'         : 'Typ',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Nahrávam',
    'LBL_SETTINGS'     : 'Nastavenia',
    'LBL_ADD_FILE'     : 'Pridať súbor',
    'LBL_COMMENT'      : 'Komentár',
    'LBL_ACCOUNT'      : 'Účet',
    'LBL_CONNECT'      : 'Pripojiť',
    'LBL_ONLINE'       : 'Prihlásený',
    'LBL_OFFLINE'      : 'Neprihlásený',
    'LBL_AWAY'         : 'Preč',
    'LBL_BUSY'         : 'Zaneprázdnený',
    'LBL_CHAT'         : 'Rozhovor',
    'LBL_HELP'         : 'Pomoc',
    'LBL_ABOUT'        : 'O programe',
    'LBL_PANELS'       : 'Panely',
    'LBL_LOCALES'      : 'Lokalizácie',
    'LBL_THEME'        : 'Témy',
    'LBL_COLOR'        : 'Farba',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Ukončiť',
    'LBL_ALIVE'        : 'živý',
    'LBL_INDEX'        : 'Index',
    'LBL_ADD'          : 'Pridať',
    'LBL_FONT'         : 'Písmo',
    'LBL_YES'          : 'Áno',
    'LBL_NO'           : 'Nie',
    'LBL_CANCEL'       : 'Zrušiť',
    'LBL_TOP'          : 'Hore',
    'LBL_LEFT'         : 'V ľavo',
    'LBL_RIGHT'        : 'V pravo',
    'LBL_BOTTOM'       : 'Dole',
    'LBL_CENTER'       : 'V strede',
    'LBL_FILE'         : 'Súbor',
    'LBL_NEW'          : 'Nový',
    'LBL_OPEN'         : 'Otvoriť',
    'LBL_SAVE'         : 'Uložiť',
    'LBL_SAVEAS'       : 'Uložiť ako...',
    'LBL_CLOSE'        : 'Zatvoriť',
    'LBL_MKDIR'        : 'Vytvor adresár',
    'LBL_UPLOAD'       : 'Nahrať na server',
    'LBL_VIEW'         : 'Zobraziť',
    'LBL_EDIT'         : 'Upraviť',
    'LBL_RENAME'       : 'Premenovať',
    'LBL_DELETE'       : 'Vymazať',
    'LBL_OPENWITH'     : 'Otvoriť pomocou ...',
    'LBL_ICONVIEW'     : 'Ikony',
    'LBL_TREEVIEW'     : 'Strom',
    'LBL_LISTVIEW'     : 'List',
    'LBL_REFRESH'      : 'Obnoviť',
    'LBL_VIEWTYPE'     : 'Zobraziť ako',
    'LBL_BOLD'         : 'Bold',
    'LBL_ITALIC'       : 'Italic',
    'LBL_UNDERLINE'    : 'Podčiarknuť',
    'LBL_REGULAR'      : 'Regulárny',
    'LBL_STRIKE'       : 'Strike',
    'LBL_INDENT'       : 'Odrážka',
    'LBL_OUTDENT'      : 'Outdate',
    'LBL_UNDO'         : 'Undo',
    'LBL_REDO'         : 'Redo',
    'LBL_CUT'          : 'Vystrihnúť',
    'LBL_UNLINK'       : 'Zrušiť odkaz (URL)',
    'LBL_COPY'         : 'Kopírovať',
    'LBL_PASTE'        : 'Prilepiť',
    'LBL_INSERT'       : 'Vložiť',
    'LBL_IMAGE'        : 'Obrázok',
    'LBL_LINK'         : 'Odkaz (URL)',
    'LBL_DISCONNECT'    : 'Odpojiť',
    'LBL_APPLICATIONS'  : 'Aplikácie',
    'LBL_ADD_FOLDER'    : 'Pridaj adresár',
    'LBL_INFORMATION'   : 'Informácie',
    'LBL_TEXT_COLOR'    : 'Farba textu',
    'LBL_BACK_COLOR'    : 'Farba pozadia',
    'LBL_RESET_DEFAULT' : 'Obnoviť predvolené nastavenia',
    'LBL_DOWNLOAD_COMP' : 'Stiahnuť do počítača',
    'LBL_ORDERED_LIST'  : 'Zoradený list',
    'LBL_BACKGROUND_IMAGE' : 'Obrázok na pozadí',
    'LBL_BACKGROUND_COLOR' : 'Farba pozadia',
    'LBL_UNORDERED_LIST'   : 'Nezoradený list',
    'LBL_STATUS'   : 'Status',
    'LBL_READONLY' : 'Iba na čítanie',
    'LBL_CREATED' : 'Vytvorený',
    'LBL_MODIFIED' : 'Zmenený',
    'LBL_SHOW_COLUMNS' : 'Ukáž stĺpce',
    'LBL_MOVE' : 'Presuň',
    'LBL_OPTIONS' : 'Možnosti',
    'LBL_OK' : 'OK',
    'LBL_DIRECTORY' : 'Adresár',
    'LBL_CREATE' : 'Vytvoriť',
    'LBL_BUGREPORT' : 'Bugreport',
    'LBL_INSTALL' : 'Inštalovať',
    'LBL_UPDATE' : 'Aktualizovať',
    'LBL_REMOVE' : 'Odstrániť'
  };

})();
