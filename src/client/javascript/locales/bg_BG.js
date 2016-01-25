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

  OSjs.Locales.bg_BG = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Ãðåøêà ïðè îòâàðÿíå íà ôàéë',
    'ERR_WM_NOT_RUNNING'        : 'Ìåíèäæúðà íà ïðîçîðöè íå ðàáîòè ',
    'ERR_FILE_OPEN_FMT'         : 'Ôàéëúò \'**{0}**\' íå ìîæå äà áúäå îòâîðåí',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Íÿìà íàìåðåíè ïðèëîæåíèÿ ñ ïîääðúæêà çà \'{0}\' ôàéëîâå',
    'ERR_APP_LAUNCH_FAILED'     : 'Ïðèëîæåíèåòî íå ìîæà äà áúäå ñòàðòèðàíî',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Ïîëó÷è ñå ãðåøêà ïî âðåìå íà ñòàðòèðàíå: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Ïðèìîæåíèåòî \'{0}\' ïðîâàëåíî èçãðàæäàíå: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Ïðèëîæåíèåòî \'{0}\' init() ïðîâàëåíî: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Ëèïñâàùè ðåñóðñè çà ïðèëîæåíèåòî \'{0}\' èëè ñå ïðîâàëè ñòàðòèðàíåòî!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Ïðèëîæåíèåòî \'{0}\' ïðåäâàðèòåëíî ñòàðòèðàíå ïðîâàëåíî: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'Ïðèëîæåíèåòî \'{0}\' å âå÷å ñòàðòèðàíî!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Ãðåøêà ïðè ñòàðòèðàíå \'{0}\'. íÿìà íàìåðåíè äàííè!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Ãðåøêà ïðè ñòàðòèðàíå \'{0}\'. íåïîääúðæàí áðàóçúð: {1}',

    'ERR_NO_WM_RUNNING'         : 'Íÿìà ðàáîòåù ìåíèäæúð íà ïðîçîðöè',
    'ERR_CORE_INIT_FAILED'      : 'Ïðîâàëåíî èíèöèàëèçèðàíå íà OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'Ãðåøêà ïðè èíèöèàëèçèðàíå íà OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'OS.js íå ìîæå äà ñå ñòàðòèðà: Íå å îïðåäåëåí ìåíèäæúð íà ïðîçîðöè!',
    'ERR_CORE_INIT_WM_FAILED_FMT': 'OS.js íå ìîæå äà ñå ñòàðòèðà: Ïðîâàëåíî îòâàðÿíå íà ìåíèäæúð íà ïðîçîðöè: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED': 'OS.js íå ìîæå äà ñå ñòàðòèðà: Ïðîâàëåíî çàðåæäàíå íà ðåñóðñèòå...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript èíôîðìàöèÿ íà ãðåøêà ',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Ïîÿâè ñå íåî÷êàâàíà ãðåøêà, âåðîÿòíî áúã.',

    'ERR_APP_API_ERROR'           : 'Ãðåøêà â  API íà ïðèëîæåíèåòî',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Ïðèëîæåíèåòî {0} íå ìîæà äà èçïúëíè îïåðàöèÿòà \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Ëèïñâàù àðãóìåíò: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Íåïîçíàòà ãðåøêà',

    'ERR_OPERATION_TIMEOUT'       : 'Ïðåñðî÷åíî âðåìå íà îïåðàöèÿòà',
    'ERR_OPERATION_TIMEOUT_FMT'   : 'Ïðåñðî÷åíî âðåìå íà îïåðàöèÿòà ({0})',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Âå÷å èìà íàèìåíîâàí ïðîçîðåö \'{0}\'',
    'WINDOW_MINIMIZE' : 'Ìèíèìèçèðàé',
    'WINDOW_MAXIMIZE' : 'Ìàêñèìèçèðàíå',
    'WINDOW_RESTORE'  : 'Âúçîáíîâè',
    'WINDOW_CLOSE'    : 'çàòâîðè',
    'WINDOW_ONTOP_ON' : 'íàé-îòãîðå (ðàçðåøåíî)',
    'WINDOW_ONTOP_OFF': 'íàé-îòãîðå (çàáðàíåíî)',

    // Handler
    'TITLE_SIGN_OUT' : 'Èçõîä',
    'TITLE_SIGNED_IN_AS_FMT' : 'Âëåçëè ñòå êàòî: {0}',

    // SESSION
    'MSG_SESSION_WARNING' : 'Ñèãóðíè ëè ñòå, ÷å èñêàòå íà èçëåçåòå îò OS.js? Âñè÷êè íå çàïàçåíè íàñòðîéêè è èíôîðìàöèÿ ùå áúäàò çàãóáåíè!',

    // Service
    'BUGREPORT_MSG' : 'Ìîëÿ äîêëàäâàéòå òîâà àêî ìèñëèòå, ÷å å áúã.\âêëþ÷åòå äåòàéëíî îïèñàíèå êàê ñå ïîëó÷è ãðåøêàòà è ñàìî àêî ìîæåòå; êàê ìîæå äà áúäå ïîïðàâåíà ',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Âëåçëè ñòå âúâ âúíøíè óñëóãè: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Ôàòàëíà ãðåøêà',
    'ERR_UTILS_XHR_FMT' : 'AJAX/XHR ãðåøêà: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Èçëåç (Èçõîä)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Èçëèçàíå îò ïîòðåáèòåë \'{0}\'.\nÈñêàòå ëè äà çàïàçèòå òåêóùàòà ñåñèÿ?',

    'DIALOG_CLOSE' : 'Çàòâîðè',
    'DIALOG_CANCEL': 'Îòêàæè',
    'DIALOG_APPLY' : 'Ïðèëîæè',
    'DIALOG_OK'    : 'ÎÊ',

    'DIALOG_ALERT_TITLE' : 'Äèàëîã çà èçâåñòèå',

    'DIALOG_COLOR_TITLE' : 'Öâÿò íà äèàëîãà',
    'DIALOG_COLOR_R' : '×åðâåí: {0}',
    'DIALOG_COLOR_G' : 'Çåëåí: {0}',
    'DIALOG_COLOR_B' : 'Ñèí: {0}',
    'DIALOG_COLOR_A' : 'Àëôà: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Ïîòâúðäè äèàëîã',

    'DIALOG_ERROR_MESSAGE'   : 'Ñúîáùåíèå',
    'DIALOG_ERROR_SUMMARY'   : 'Ñúäúðæàíèå',
    'DIALOG_ERROR_TRACE'     : 'Òúðñè',
    'DIALOG_ERROR_BUGREPORT' : 'Äîêëàäâàé áúã',

    'DIALOG_FILE_SAVE'      : 'Çàïàçè',
    'DIALOG_FILE_OPEN'      : 'Îòâîðè',
    'DIALOG_FILE_MKDIR'     : 'Íîâà ïàïêà',
    'DIALOG_FILE_MKDIR_MSG' : 'Ñúçäàé íîâà äèðåêòîðèÿ â **{0}**',
    'DIALOG_FILE_OVERWRITE' : 'Ñèãóðíè ëè ñòå, ÷å èñêàòå äà ïðåçàïèøåòå ôàèëúò \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Òèï íà èçãëåä',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Ñïèñúê',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Äúðâî',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Èêîíè',
    'DIALOG_FILE_ERROR'        : 'Ãðåøêà âúâ ôàéëîâ äèàëîã',
    'DIALOG_FILE_ERROR_SCANDIR': 'Ïðîâàëåíî ðàçãëåæäàíå íà äèðåêòîðèÿòà \'{0}\' ïîðàäè ãðåøêà',
    'DIALOG_FILE_MISSING_FILENAME' : 'Òðÿáâà äà èçáåðåòå ôàéë èëè äà âúâåäåòå èìå!',
    'DIALOG_FILE_MISSING_SELECTION': 'Òðÿáâà äà èçáåðåòå ôàéë!',

    'DIALOG_FILEINFO_TITLE'   : 'Èíôîðàìöèÿ çà ôàéëúò',
    'DIALOG_FILEINFO_LOADING' : 'Çàðåæäàíå íà èíôîðìàöèÿ çà: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Ãðåøêà â èíôîðìàöèÿ çà ôàéë',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Íå ìîæå äà áúäå íàìåðåíà èíôîðìàöèÿ çà ôàéëúò **{0}**',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Íå ìîæå äà áúäå íàìåðåíà èíôîðìàöèÿ çà ôàéëúò: {0}',

    'DIALOG_INPUT_TITLE' : 'Âõîäÿù äèàëîã',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Ïðîãðåñ íà îïåðàöèÿòà íà ôàéëúò',
    'DIALOG_FILEPROGRESS_LOADING' : 'Çàðåæäàíå...',

    'DIALOG_UPLOAD_TITLE'   : 'Äîáàâè äèàëîã',
    'DIALOG_UPLOAD_DESC'    : 'Äîáàâè ôàéë êúì **{0}**.<br />Ìàêñèìàëåí ðàçìåð: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : 'Äîáàâÿíå \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : 'Äîáàâÿíå íà ôàèë...',
    'DIALOG_UPLOAD_FAILED'  : 'Äîáàâÿíå ïðîâàëåíî',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Äîáàâÿíåòî å ïðîâàëåíî',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Íåîïðåäåëåíà ïðè÷èíà...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Îòêàçàíî îò ïîòðåáèòåë...',
    'DIALOG_UPLOAD_TOO_BIG': 'Ôàéëúò å ïðåêàëåíî ãîëÿì',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Ôàéëúò å ïðåêàëåíî ãîëÿì, íàäâèøàâà {0}',

    'DIALOG_FONT_TITLE' : 'Øðèôò íà äèàëîã',

    'DIALOG_APPCHOOSER_TITLE' : 'Èçáåðåòå ïðèëîæåíèå',
    'DIALOG_APPCHOOSER_MSG'   : 'Èçáåðåòå ïðèëîæåíèå êîåòî äà ñå îòâîðè',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Òðÿáâà äà èçáåðåòå ïðèëîæåíèå',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Èçïîëçâàé êàòî ïðèëîæåíèå ïî ïîäðàçáèðàíå çà {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPI Ìîäóë íå å êîíôèãóðèðàí èëè å èçêëþ÷åí',
    'GAPI_SIGN_OUT'           : 'Èçõîä îò Google API óñëóãè',
    'GAPI_REVOKE'             : 'Îòòåãëÿíå íà ïðàâàòà è èçõîä',
    'GAPI_AUTH_FAILURE'       : 'Google API óäîñòîâåðÿâàíå ïðîâàëåíî èëè íå å ïðîâåäåíî',
    'GAPI_AUTH_FAILURE_FMT'   : 'Ãðåøêà ïðè óäîñòîâåðÿâàíå: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Ïðîâàëåíî ñòàðòèðàíå íà Google API',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Windows Live API ìîäóë íå å êîíôèãóðèðàí èëè å èçêëþ÷åí',
    'WLAPI_SIGN_OUT'          : 'Èçõîä îò Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'Ïðîâàëåíî ñòàðòèðàíå íà Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'Ïðîâàëåíî âëèçàíå â Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Ïðîâàëåíî âëèçàíå â Windows Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API îòãîâîðè {0} ñòàòóñ',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Íå ìîæå äà áúäå ñúçäàäåíà IndexedDB áåç èìå íà áàçà äàííè',
    'IDB_NO_SUCH_ITEM'   : 'Íå ñúùåñòâóâàù îáåêò',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Ôàòàëíà ãðåøêà',
    'ERR_VFS_UNAVAILABLE'     : 'Íå â íàëè÷íî',
    'ERR_VFS_FILE_ARGS'       : 'Ôàéëúò î÷àêâà ïîíå åäèí àðãóìåíò',
    'ERR_VFS_NUM_ARGS'        : 'Íÿìà äîñòàòú÷íî àðãóìåíòè',
    'ERR_VFS_EXPECT_FILE'     : 'Î÷àêâà ôàéëîâ-îáåêò',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Î÷êâà èçòî÷íèê Ôàéëîâ-îáåêò',
    'ERR_VFS_EXPECT_DST_FILE' : 'Î÷àêâà äåñòèíàöèÿ Ôàéëîâ-îáåêò',
    'ERR_VFS_FILE_EXISTS'     : 'Äåñòèíàöèÿòà âå÷å ñúùåñòâóâà',
    'ERR_VFS_TRANSFER_FMT'    : 'Ïîÿâè ñå ãðåøêà äîêàòî ñå èçâúðøâàøå òðàíñôåð: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Íå ìîæå äà áúäå äîáàâåí ôàéë áåç äåâñòèíàöèÿ',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Íå ìîæå äà ñå äîáàâÿ áåç îïðåäåëÿíå íà ôàéëîâå',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Ïðîâàëåíî äîáàâÿíå íà ôàéëîâå: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Äîáàâÿíåòî íà ôàéëîâå áåøå ïðåêðàòåíî',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Íå ìîæå äà ñå èçòåãëè áåç óêàçàí ïúò ',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Ïîÿâè ñå ãðåøêà ïðè èçòåãëÿíå: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'Îòãîâîðà áåøå ïðàçåí',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Èçòåãëÿíå íà ôàéë',

    'ERR_VFSMODULE_XHR_ERROR'      : 'XHR ãðåøêà',
    'ERR_VFSMODULE_ROOT_ID'        : 'Íå ìîæå äà áúäå íàìåðåíî ÈÄ íà root ïàïêàòà',
    'ERR_VFSMODULE_NOSUCH'         : 'Ôàéëúò íå ñúùåñòâóâà',
    'ERR_VFSMODULE_PARENT'         : 'Íÿìà íàìåðåí èçòî÷íèê',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Íå ìîæà äà áúäå íàìåðåí èçòî÷íêè: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Ïðîâàëåíî ñêàíèðàíå íà äèðåêòîðèÿ',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Ïðîâàëåíî ñêàíèðàíå íà äèðåêòîðèÿ: {0}',
    'ERR_VFSMODULE_READ'           : 'Ïðîâàëåíî ïðî÷èòàíå íà ôàéëúò',
    'ERR_VFSMODULE_READ_FMT'       : 'Ïðîâàëåíî ïðî÷èòàíå íà ôàéëúò: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Ïðîâàëåíî çàïèñâàíå íà ôàéëúò',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Ïðîâàëåíî çàïèñâàíå íà ôàéëúò: {0}',
    'ERR_VFSMODULE_COPY'           : 'Ïðîâàëåíî êîïèðàíå',
    'ERR_VFSMODULE_COPY_FMT'       : 'Ïðîâàëåíî êîïèðàíå: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Ïðîâàëåíî ðàçêà÷àíå íà ôàéëúò ',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Ïðîâàëåíî ðàçêà÷àíå íà ôàéëúò: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Ïðîâàëåíî ïðåìåñòâàíå íà ôàéëúò',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Ïðîâàëåíî ïðåìåñòâàíå íà ôàèëúò: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Ïðîâàëåíà ïðîæåðêà çà ñúùåñòâóâàíå íà ôàéëúò',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Ïðîâàëåíà ïðîæåðêà çà ñúùåñòâóâàíå íà ôàéëúò: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Ïðîâàëåíî ïîëó÷àâàíå íà èíôîðìàöèÿ çà ôàéëúò',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Ïðîâàëåíî ïîëó÷àâàíå íà èíôîðìàöèÿ çà ôàéëúò: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Ïðîâàëåíî ñúçäàâàíå íà äèðåêòîðèÿ',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Ïðîâàëåíî ñúçäàâàíå íà äèðåêòîðèÿ: {0}',
    'ERR_VFSMODULE_URL'            : 'Ïðîâàëåíî ïîëó÷àâàíå íà URL çà ôàéëúò',
    'ERR_VFSMODULE_URL_FMT'        : 'Ïðîâàëåíî ïîëó÷àâàíå íà URL çà ôàéëúò: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Ïðîâàëåíî èçòðèâàíå',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Ïðîâàëåíî èçòðèâàíå: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Ïðîâàëåíî èçêàðâàíå îò êîø÷åòî',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Ïðîâàëåíî èçêàðâàíå îò êîø÷åòî: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Ïðîâàëåíî èçïðàçâàíå íà êîø÷åòî',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Ïðîâàëåíî èçïðàçâàíå íà êîø÷åòî: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Âëåçëè ñòå â Dropbox API',
    'DROPBOX_SIGN_OUT'           : 'Èçõîä îò Dropbox API',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Ïðîâàëåíî íàìèðàíå íà ïúò: Îáåêòà íå å íàìåðåí',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'Äèðåêòîðèÿ çà èíñòàëèðàíå íà ïàêåòè âå÷å ñúùåñòâóâà. Íå ìîæå äà ïðîäúëæèòå!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Íå ìîæå äà áúäå îòâîðåí ôàéëúò',
    'ERR_FILE_APP_OPEN_FMT'     : 'Ôàéëúò {0} íå ìîæå äà áúäå îòîâîðåí {1} íå ñå ïîääúðæà',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Ôàéëúò {0} íå ìîæå äà áúäå îòâîðåí',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Ôàéëúò {0} íå ìîæå äà áúäå çàïàçåí',
    'ERR_GENERIC_APP_FMT'       : '{0} ãðåøêà â ïðèëîæåíèåòî',
    'ERR_GENERIC_APP_ACTION_FMT': 'Ïðîâàëåíî èçïúëíåíÿâàíå íà äåéñòâèå \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Íåïîçíàòà ãðåøêà',
    'ERR_GENERIC_APP_REQUEST'   : 'Ïîëó÷è ñå ãðåøêà ïðè èçïúëíÿâàíå íà çàÿâêàòà',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Ôàòàëíà ãðåøêà: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Îòêàæè ïðîìåíèòå?',
    'MSG_FILE_CHANGED'          : 'Ôàéëúò å ïðîìåíåí. ïðåçàðåäè?',
    'MSG_APPLICATION_WARNING'   : 'Ïðåäóïðåæäåíèå',
    'MSG_MIME_OVERRIDE'         : 'âèäà íà ôàéëà "{0}" íå ñå ïîääúðæà, èçïîëçâàéòå "{1}".',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Íåïîçíàò',
    'LBL_APPEARANCE'   : 'Âúíøåí âèä',
    'LBL_USER'         : 'Ïîòðåáèòåë',
    'LBL_NAME'         : 'Èìå',
    'LBL_APPLY'        : 'Ïðèëîæè',
    'LBL_FILENAME'     : 'Èìå íà ôàéë',
    'LBL_PATH'         : 'Ïúò',
    'LBL_SIZE'         : 'Ðàçìåð',
    'LBL_TYPE'         : 'Òèï',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Çàðåæäàíå',
    'LBL_SETTINGS'     : 'Íàñòðîéêè',
    'LBL_ADD_FILE'     : 'Äîáàâè ôàéë',
    'LBL_COMMENT'      : 'Êîìåíòàð',
    'LBL_ACCOUNT'      : 'Àêàóíò',
    'LBL_CONNECT'      : 'Ñâúðæè ñå',
    'LBL_ONLINE'       : 'Íà ëèíèÿ',
    'LBL_OFFLINE'      : 'Èçâúí ëèíèÿ',
    'LBL_AWAY'         : 'Îòñúñòâàù',
    'LBL_BUSY'         : 'Çàåò',
    'LBL_CHAT'         : '×àò',
    'LBL_HELP'         : 'Ïîìîù',
    'LBL_ABOUT'        : 'Èíôîðìàöèÿ',
    'LBL_PANELS'       : 'Ïàíåëè',
    'LBL_LOCALES'      : 'Ëîêàëèçàöèÿ',
    'LBL_THEME'        : 'Òåìà',
    'LBL_COLOR'        : 'Öâÿò',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Ïðåêðàòè',
    'LBL_ALIVE'        : 'Âêëþ÷è',
    'LBL_INDEX'        : 'Èíäåêñ',
    'LBL_ADD'          : 'Äîáàâè',
    'LBL_FONT'         : 'Øðèôò',
    'LBL_YES'          : 'Äà',
    'LBL_NO'           : 'Íå',
    'LBL_CANCEL'       : 'Îòêàæè',
    'LBL_TOP'          : 'Ãîðå',
    'LBL_LEFT'         : 'Ëÿâî',
    'LBL_RIGHT'        : 'Äÿñíî',
    'LBL_BOTTOM'       : 'Äîëó',
    'LBL_CENTER'       : 'Öåíòúð',
    'LBL_FILE'         : 'Ôàéë',
    'LBL_NEW'          : 'Íîâ',
    'LBL_OPEN'         : 'Îòâîðè',
    'LBL_SAVE'         : 'Çàïàçè',
    'LBL_SAVEAS'       : 'Çàïàçè êàòî...',
    'LBL_CLOSE'        : 'Çàòðâîðè',
    'LBL_MKDIR'        : 'Ñúçäàé äèðåêòîðèÿ',
    'LBL_UPLOAD'       : 'Äîáàâè',
    'LBL_VIEW'         : 'Èçãëåä',
    'LBL_EDIT'         : 'Ðåäàêòèðàé',
    'LBL_RENAME'       : 'Ïðåèìåíóâàé',
    'LBL_DELETE'       : 'Èçòðèè',
    'LBL_OPENWITH'     : 'Îòâîðè ñ...',
    'LBL_ICONVIEW'     : 'Èêîíè',
    'LBL_TREEVIEW'     : 'Äúðâî',
    'LBL_LISTVIEW'     : 'Ñïèñúê',
    'LBL_REFRESH'      : 'Îïðåñíè',
    'LBL_VIEWTYPE'     : 'Íà÷èí íà èçãëåä',
    'LBL_BOLD'         : 'Ïîëó÷åð',
    'LBL_ITALIC'       : 'Íàêëîíåí',
    'LBL_UNDERLINE'    : 'Ïîä÷åðòàí',
    'LBL_REGULAR'      : 'Îáèêíîâåí',
    'LBL_STRIKE'       : 'Strike',
    'LBL_INDENT'       : 'Èäåíòèôèêàöèÿ',
    'LBL_OUTDENT'      : 'Ïðåñðî÷âàíå',
    'LBL_UNDO'         : 'Ïððåìàõíè',
    'LBL_REDO'         : 'Îòìåíè ïðåìàõâàíåòî',
    'LBL_CUT'          : 'Èçðåæè',
    'LBL_UNLINK'       : 'Îòêà÷è',
    'LBL_COPY'         : 'Êîïèðàé',
    'LBL_PASTE'        : 'Ïîñòàâè',
    'LBL_INSERT'       : 'Äîáàâè',
    'LBL_IMAGE'        : 'Èçîáðàæåíèå',
    'LBL_LINK'         : 'Ëèíê',
    'LBL_DISCONNECT'    : 'Èçëåç îò âðúçêà',
    'LBL_APPLICATIONS'  : 'Ïðèëîæåíèÿ',
    'LBL_ADD_FOLDER'    : 'Äîáàâè ïàïêà',
    'LBL_INFORMATION'   : 'Èíôîðìàöèÿ',
    'LBL_TEXT_COLOR'    : 'Öâÿò íà òåêñòà',
    'LBL_BACK_COLOR'    : 'Öâÿò íà ôîíà',
    'LBL_RESET_DEFAULT' : 'Âúðíè ïî ïîäðàçáèðàíå',
    'LBL_DOWNLOAD_COMP' : 'Èçòåãëÿíå íà êîìïþòúðà',
    'LBL_ORDERED_LIST'  : 'Ïîäðåäåí ñïèñúê',
    'LBL_BACKGROUND_IMAGE' : 'Èçîáðàæåíèÿ çà ôîí',
    'LBL_BACKGROUND_COLOR' : 'Öâÿò íà ôîí',
    'LBL_UNORDERED_LIST'   : 'Íåïîäðåäåí ñïèñúê',
    'LBL_STATUS'   : 'Ñàòóñ',
    'LBL_READONLY' : 'ñàìî çà ÷åòåíå',
    'LBL_CREATED' : 'Ñúçäàäåí',
    'LBL_MODIFIED' : 'Ìîäèôèöèðàí',
    'LBL_SHOW_COLUMNS' : 'Ïîêàæè êîëîíè',
    'LBL_MOVE' : 'Ïðåìåñòè',
    'LBL_OPTIONS' : 'Îïöèè',
    'LBL_OK' : 'ÎÊ',
    'LBL_DIRECTORY' : 'Äèðåêòîðèÿ',
    'LBL_CREATE' : 'Ñúçäàé',
    'LBL_BUGREPORT' : 'Áúã-ðåïîðò',
    'LBL_INSTALL' : 'Èíñòàëèðàé',
    'LBL_UPDATE' : 'Àêòóàëèçèðàé',
    'LBL_REMOVE' : 'Ïðåìàõíè',
    'LBL_SHOW_SIDEBAR' : 'покажи страничен бар'
  };

})();
