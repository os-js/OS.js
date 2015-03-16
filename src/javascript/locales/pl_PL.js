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
 * Translated by michal4132 <michal4132.tk>
 */
(function() {
  'use strict';

  OSjs.Locales = OSjs.Locales || {};

  OSjs.Locales.pl_PL = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Błąd otwieranie pliku',
    'ERR_WM_NOT_RUNNING'        : 'Window manager is not running',
    'ERR_FILE_OPEN_FMT'         : 'The file \'<span>{0}</span>\' could not be opened',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Could not find any Applications with support for \'{0}\' files',
    'ERR_APP_LAUNCH_FAILED'     : 'Failed to launch Application',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'An error occured while trying to launch: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Application \'{0}\' construct failed: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Application \'{0}\' init() failed: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Application resources missing for \'{0}\' or it failed to load!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Application \'{0}\' preloading failed: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'The application \'{0}\' is already launched and allows only one instance!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Failed to launch \'{0}\'. Application manifest data not found!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Failed to launch \'{0}\'. Your browser does not support: {1}',

    'ERR_NO_WM_RUNNING'         : 'No window manager is running',
    'ERR_CORE_INIT_FAILED'      : 'Failed to initialize OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'An error occured while initializing OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'Cannot launch OS.js: No window manager defined!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'Cannot launch OS.js: Failed to launch Window Manager: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'Cannot launch OS.js: Failed to preload resources...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript Error Report',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'An unexpected error occured, maybe a bug.',

    'ERR_APP_API_ERROR'           : 'Application API error',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Application {0} failed to perform operation \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Missing argument: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Unknown error',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'You already have a Window named \'{0}\'',
    'WINDOW_MINIMIZE' : 'Minimalizuj',
    'WINDOW_MAXIMIZE' : 'Maksymalizuj',
    'WINDOW_RESTORE'  : 'Przywroc',
    'WINDOW_CLOSE'    : 'Zamknij',
    'WINDOW_ONTOP_ON' : 'Ontop (Enable)',
    'WINDOW_ONTOP_OFF': 'Ontop (Disable)',

    // Handler
    'TITLE_SIGN_OUT' : 'Wyloguj',
    'TITLE_SIGNED_IN_AS_FMT' : 'Zalogowano jako: {0}',

    // Service
    'BUGREPORT_MSG' : 'Prosze, zreportuj to jesli uwazasz, ze jest to blad.\nInclude a brief description on how the error occured, and if you can; how to replicate it',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Logged into external services: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Błąd krytyczny',
    'ERR_UTILS_XHR_FMT' : 'Błąd AJAX/XHR: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Wylogowywanie (Exit)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Wylogowywanie \'{0}\'.\nCzy chcesz zapisac sesje?',

    'DIALOG_CLOSE' : 'Zamknij',
    'DIALOG_CANCEL': 'Anuluj',
    'DIALOG_APPLY' : 'Zastosuj',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'Powiadomienia',

    'DIALOG_COLOR_TITLE' : 'Kolor',
    'DIALOG_COLOR_R' : 'Czerwony: {0}',
    'DIALOG_COLOR_G' : 'Zielony: {0}',
    'DIALOG_COLOR_B' : 'Niebieski: {0}',
    'DIALOG_COLOR_A' : 'Alpha: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Confirm Dialog',

    'DIALOG_ERROR_MESSAGE'   : 'Message',
    'DIALOG_ERROR_SUMMARY'   : 'Summary',
    'DIALOG_ERROR_TRACE'     : 'Trace',
    'DIALOG_ERROR_BUGREPORT' : 'Bugreport',

    'DIALOG_FILE_SAVE'      : 'Zapisz',
    'DIALOG_FILE_OPEN'      : 'Otworz',
    'DIALOG_FILE_MKDIR'     : 'Nowy folder',
    'DIALOG_FILE_MKDIR_MSG' : 'Nowy folder w <span>{0}</span>',
    'DIALOG_FILE_OVERWRITE' : 'Czy chcesz nadpisać plik \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'View type',
    'DIALOG_FILE_MNU_LISTVIEW' : 'List View',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Tree View',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Icon View',
    'DIALOG_FILE_ERROR'        : 'FileDialog Error',
    'DIALOG_FILE_ERROR_SCANDIR': 'Failed listing directory \'{0}\' because an error occured',
    'DIALOG_FILE_MISSING_FILENAME' : 'You need to select a file or enter new filename!',
    'DIALOG_FILE_MISSING_SELECTION': 'Zaznacz plik!',

    'DIALOG_FILEINFO_TITLE'   : 'Informacje',
    'DIALOG_FILEINFO_LOADING' : 'Ładowanie informacji dla: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'FileInformationDialog Error',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Failed to get file information for <span>{0}</span>',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Failed to get file information for: {0}',

    'DIALOG_INPUT_TITLE' : 'Wprowadzanie',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Postep',
    'DIALOG_FILEPROGRESS_LOADING' : 'Ładowanie...',

    'DIALOG_UPLOAD_TITLE'   : 'Wysyłanie',
    'DIALOG_UPLOAD_DESC'    : 'Wysyłanie pliku do <span>{0}</span>.<br />Maksymalny rozmiar: {1} bitów',
    'DIALOG_UPLOAD_MSG_FMT' : 'Wysyłanie \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : 'Wysyłanie pliku...',
    'DIALOG_UPLOAD_FAILED'  : 'Błąd wywyłania',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Wywyłanie nie powiodło się',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Reason unknown...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Anulowane przez użytkownika...',
    'DIALOG_UPLOAD_TOO_BIG': 'Plik jest za duży',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Plik jest za duży, exceeds {0}',

    'DIALOG_FONT_TITLE' : 'Czcionka',

    'DIALOG_APPCHOOSER_TITLE' : 'Wybierz aplikacje',
    'DIALOG_APPCHOOSER_MSG'   : 'Wybierz aplikacje do otwarcia',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Wybierz aplikacje',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Używaj jako domyślną aplikacje do {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPI Module not configured or disabled',
    'GAPI_SIGN_OUT'           : 'Sign out from Google API Services',
    'GAPI_REVOKE'             : 'Revoke permissions and Sign Out',
    'GAPI_AUTH_FAILURE'       : 'Google API Authentication failed or did not take place',
    'GAPI_AUTH_FAILURE_FMT'   : 'Failed to authenticate: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Failed to load Google API',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Windows Live API module not configured or disabled',
    'WLAPI_SIGN_OUT'          : 'Sign out from Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'Failed to load Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'Failed to log into Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Failed to log into Windows Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API returned {0} status',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Cannot create IndexedDB without Database Name',
    'IDB_NO_SUCH_ITEM'   : 'No such item',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Fatal Error',
    'ERR_VFS_UNAVAILABLE'     : 'Not available',
    'ERR_VFS_FILE_ARGS'       : 'File expects at least one argument',
    'ERR_VFS_NUM_ARGS'        : 'Not enugh arguments',
    'ERR_VFS_EXPECT_FILE'     : 'Expects a file-object',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Expects a source file-object',
    'ERR_VFS_EXPECT_DST_FILE' : 'Expects a destination file-object',
    'ERR_VFS_FILE_EXISTS'     : 'Destination already exists',
    'ERR_VFS_TRANSFER_FMT'    : 'An error occured while transfering between storage: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Cannot upload a file without a destination',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Cannot upload without any files defined',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'File upload failed: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'File upload was cancelled',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Cannot download a path without a path',
    'ERR_VFS_DOWNLOAD_FAILED' : 'An error occured while downloading: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'Response was empty',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Downloading file',

    'ERR_VFSMODULE_XHR_ERROR'      : 'XHR Error',
    'ERR_VFSMODULE_ROOT_ID'        : 'Failed to find root folder id',
    'ERR_VFSMODULE_NOSUCH'         : 'File does not exist',
    'ERR_VFSMODULE_PARENT'         : 'No such parent',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Failed to look up parent: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Failed to scan directory',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Failed to scan directory: {0}',
    'ERR_VFSMODULE_READ'           : 'Failed to read file',
    'ERR_VFSMODULE_READ_FMT'       : 'Failed to read file: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Failed to write file',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Failed to write file: {0}',
    'ERR_VFSMODULE_COPY'           : 'Failed to copy',
    'ERR_VFSMODULE_COPY_FMT'       : 'Failed to copy: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Failed to unlink file',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Failed to unlink file: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Failed to move file',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Failed to move file: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Failed to check file existence',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Failed to check file existence: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Failed to get file information',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Failed to get file information: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Failed to create directory',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Failed to create directory: {0}',
    'ERR_VFSMODULE_URL'            : 'Failed to get URL for file',
    'ERR_VFSMODULE_URL_FMT'        : 'Failed to get URL for file: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Failed to move file to trash',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Failed to move file to trash: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Failed to move file out of trash',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Failed to move file out of trash: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Failed to empty trash',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Failed to empty trash: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'You are signed in to Dropbox API',
    'DROPBOX_SIGN_OUT'           : 'Sign out from Google API Services',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Failed to resolve path: item not found',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Nie można otworzyć',
    'ERR_FILE_APP_OPEN_FMT'     : 'The file {0} could not be opened because the mime {1} is not supported',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'The file {0} could not be opened',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'The file {0} could not be saved',
    'ERR_GENERIC_APP_FMT'       : '{0} Application Error',
    'ERR_GENERIC_APP_ACTION_FMT': 'Failed to perform action \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Unknown Error',
    'ERR_GENERIC_APP_REQUEST'   : 'An error occured while handling your request',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Fatal Error: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Discard changes?',
    'MSG_FILE_CHANGED'          : 'The file has changed. Reload?',
    'MSG_APPLICATION_WARNING'   : 'Application Warning',
    'MSG_MIME_OVERRIDE'         : 'The filetype "{0}" is not supported, using "{1}" instead.',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Nieznany',
    'LBL_APPEARANCE'   : 'Appearance',
    'LBL_USER'         : 'Użytkownik',
    'LBL_NAME'         : 'Nazwa',
    'LBL_APPLY'        : 'Zastosuj',
    'LBL_FILENAME'     : 'Nazwa pliku',
    'LBL_PATH'         : 'Ścieżka',
    'LBL_SIZE'         : 'Rozmiar',
    'LBL_TYPE'         : 'Typ',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Ładowanie',
    'LBL_SETTINGS'     : 'Ustawienia',
    'LBL_ADD_FILE'     : 'Dodaj plik',
    'LBL_COMMENT'      : 'Komentarz',
    'LBL_ACCOUNT'      : 'Konto',
    'LBL_CONNECT'      : 'Połącz',
    'LBL_ONLINE'       : 'Online',
    'LBL_OFFLINE'      : 'Offline',
    'LBL_AWAY'         : 'Away',
    'LBL_BUSY'         : 'Busy',
    'LBL_CHAT'         : 'Chat',
    'LBL_HELP'         : 'Pomoc',
    'LBL_ABOUT'        : 'O',
    'LBL_PANELS'       : 'Panele',
    'LBL_LOCALES'      : 'Języki',
    'LBL_THEME'        : 'Motyw',
    'LBL_COLOR'        : 'Kolor',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Zabij',
    'LBL_ALIVE'        : 'Alive',
    'LBL_INDEX'        : 'Index',
    'LBL_ADD'          : 'Dodaj',
    'LBL_FONT'         : 'Czcionka',
    'LBL_YES'          : 'Tak',
    'LBL_NO'           : 'Nie',
    'LBL_CANCEL'       : 'Anuluj',
    'LBL_TOP'          : 'Góra',
    'LBL_LEFT'         : 'Lewo',
    'LBL_RIGHT'        : 'Prawo',
    'LBL_BOTTOM'       : 'Dół',
    'LBL_CENTER'       : 'Środek',
    'LBL_FILE'         : 'Plik',
    'LBL_NEW'          : 'Nowy',
    'LBL_OPEN'         : 'Otworz',
    'LBL_SAVE'         : 'Zapisz',
    'LBL_SAVEAS'       : 'Zapisz jako...',
    'LBL_CLOSE'        : 'Zamknij',
    'LBL_MKDIR'        : 'Nowy folder',
    'LBL_UPLOAD'       : 'Wyślij',
    'LBL_VIEW'         : 'Widok',
    'LBL_EDIT'         : 'Edytuj',
    'LBL_RENAME'       : 'Zmień nazwę',
    'LBL_DELETE'       : 'Usuń',
    'LBL_OPENWITH'     : 'Otwórz za pomocą ...',
    'LBL_ICONVIEW'     : 'Icon View',
    'LBL_TREEVIEW'     : 'Tree View',
    'LBL_LISTVIEW'     : 'List View',
    'LBL_REFRESH'      : 'Odśwież',
    'LBL_VIEWTYPE'     : 'View type',
    'LBL_BOLD'         : 'Bold',
    'LBL_ITALIC'       : 'Italic',
    'LBL_UNDERLINE'    : 'Underline',
    'LBL_REGULAR'      : 'Regular',
    'LBL_STRIKE'       : 'Strike',
    'LBL_INDENT'       : 'Indent',
    'LBL_OUTDENT'      : 'Outdate',
    'LBL_UNDO'         : 'Cofnij',
    'LBL_REDO'         : 'Przywróc',
    'LBL_CUT'          : 'Wytnij',
    'LBL_UNLINK'       : 'Oolinkuj',
    'LBL_COPY'         : 'Kopiuj',
    'LBL_PASTE'        : 'Wklej',
    'LBL_INSERT'       : 'Insert',
    'LBL_IMAGE'        : 'Obraz',
    'LBL_LINK'         : 'Linkuj',
    'LBL_DISCONNECT'    : 'Rozłącz',
    'LBL_APPLICATIONS'  : 'Aplikacje',
    'LBL_ADD_FOLDER'    : 'Dodaj folder',
    'LBL_INFORMATION'   : 'Informacje',
    'LBL_TEXT_COLOR'    : 'Kolor tekstu',
    'LBL_BACK_COLOR'    : 'Kolor tła',
    'LBL_RESET_DEFAULT' : 'Przywróć fabryczne',
    'LBL_DOWNLOAD_COMP' : 'Pobierz',
    'LBL_ORDERED_LIST'  : 'Ordered List',
    'LBL_BACKGROUND_IMAGE' : 'Tapeta',
    'LBL_BACKGROUND_COLOR' : 'Kolor tła',
    'LBL_UNORDERED_LIST'   : 'Unordered List',
    'LBL_STATUS'   : 'Status',
    'LBL_READONLY' : 'Read-Only',
    'LBL_CREATED' : 'Created',
    'LBL_MODIFIED' : 'Modified',
    'LBL_SHOW_COLUMNS' : 'Pokaż kolumny'
  };

})();
