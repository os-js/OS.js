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
(function() {
  'use strict';

  OSjs.Locales = OSjs.Locales || {};

  OSjs.Locales.de_DE = {
    'ERR_FILE_OPEN'     : 'Fehler beim Öffnen der Datei',
    'ERR_WM_NOT_RUNNING': 'Es wird kein Fenster-Manager ausgeführt',
    'ERR_FILE_OPEN_FMT' : 'Die Datei \'<span>{0}</span>\' kann nicht geöffnet werden',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Keine Anwendung gefunden, die den Datentyp \'{0}\' unterstützt',
    'ERR_APP_LAUNCH_FAILED'    : 'Fehler beim Starten der Anwendung',
    'ERR_APP_LAUNCH_FAILED_FMT': 'Ein Fehler ist aufgetreten, während des Versuchs \'{0}\' zu starten',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Anwendung \'{0}\' construct gescheitert: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Anwendung \'{0}\' init() gescheitert: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Anwendungsressourcen fehlen oder wurden nicht geladen für: {0}',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Anwendung \'{0}\' preloading gescheitert: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'Anwendung \'{0}\' ist bereits gestartet und erlaubt nur eine Instanz',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : '\'{0}\' konnte nicht gestartet werden. Anwendungsmanifest nicht gefunden!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Klarte ikke starte \'{0}\'. Uw browser ondersteunt geen: {1}',

    //'ERR_NO_WM_RUNNING'           : 'No window manager is running',
    'ERR_CORE_INIT_FAILED'        : 'OS.js konnte nicht initialisiert werden',
    'ERR_CORE_INIT_FAILED_DESC'   : 'Während der Initialisirung von OS.js ist ein Fehler aufgetreten',
    'ERR_CORE_INIT_NO_WM'         : 'OS.js konnte nicht gestartet werden: Fenster-Manager nicht festgelegt!',
    'ERR_CORE_INIT_WM_FAILED_FMT' : 'OS.js konnte nicht gestartet werden: Fenster-Manager konnte nicht gestartet werden: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED': 'OS.js konnte nicht gestartet werden: Resourssen konnten nicht vorab geladen werden...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript Fehlerbericht',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Ein unerwarteter Fehler ist aufgetreten, möglicherweise ein Bug',

    'ERR_APP_API_ERROR'           : 'Anwendungs API Fehler',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Anwendung {0} konnte Aktion nicht ausführen \'{1}\'',
    //'ERR_APP_MISSING_ARGUMENT_FMT': 'Missing argument: {0}',
    //'ERR_APP_UNKNOWN_ERROR'       : 'Unknown error',

    // Window
    //'ERR_WIN_DUPLICATE_FMT' : 'You already have a Window named \'{0}\'',
    'WINDOW_MINIMIZE' : 'Minimieren',
    'WINDOW_MAXIMIZE' : 'Maximieren',
    'WINDOW_RESTORE'  : 'Wiederherstellen',
    'WINDOW_CLOSE'    : 'Schließen',
    'WINDOW_ONTOP_ON' : 'Im Vordergrund - Aktivieren',
    'WINDOW_ONTOP_OFF': 'Im Vordergrund - Deaktivieren',

    // Handler
    //'TITLE_SIGN_OUT' : 'Sign out',
    //'TITLE_SIGNED_IN_AS_FMT' : 'Signed in as: {0}',

    // Dialogs
    'DIALOG_LOGOUT_TITLE' : 'Abmelden (Exit)', // Actually located in core.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Benutzer wird abgemeldet \'{0}\'.\nWollen Sie die aktuelle Sitzung speichern?',

    'DIALOG_CLOSE' : 'Schließen',
    'DIALOG_CANCEL': 'Abbrechen',
    'DIALOG_APPLY' : 'Übernehmen',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'Warnungsdialog',

    'DIALOG_COLOR_TITLE' : 'Farb-Dialog',
    'DIALOG_COLOR_R' : 'Rot: {0}',
    'DIALOG_COLOR_G' : 'Grün: {0}',
    'DIALOG_COLOR_B' : 'Blau: {0}',
    'DIALOG_COLOR_A' : 'Alpha: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Bestätigungsdialog',

    'DIALOG_ERROR_MESSAGE'   : 'Meldung',
    'DIALOG_ERROR_SUMMARY'   : 'Zusammenfassung',
    'DIALOG_ERROR_TRACE'     : 'Trace',
    'DIALOG_ERROR_BUGREPORT' : 'Fehlerbericht',

    'DIALOG_FILE_SAVE'      : 'Speichern',
    'DIALOG_FILE_OPEN'      : 'Öffnen',
    'DIALOG_FILE_MKDIR'     : 'Verzeichnis erstellen',
    //'DIALOG_FILE_MKDIR_MSG' : 'Create a new directory in <span>{0}</span>',
    'DIALOG_FILE_OVERWRITE' : 'Sind Sie sicher, dass Sie die Datei \'{0}\' überschreiben wollen?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Ansichtstyp',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Liste',
    //'DIALOG_FILE_MNU_TREEVIEW' : 'Tree View',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Symbole',
    'DIALOG_FILE_ERROR'        : 'Datei-Dialog Fehler',
    'DIALOG_FILE_ERROR_SCANDIR': 'Verzeichnis \'{0}\' konnte nicht geöffnet werden',
    'DIALOG_FILE_MISSING_FILENAME' : 'Sie müssen eine Datei auswählen oder geben Sie einen neuen Dateinamen an!',
    'DIALOG_FILE_MISSING_SELECTION': 'Sie müssen eine Datei auswählen!',

    'DIALOG_FILEINFO_TITLE'   : 'Dateiinformationen',
    'DIALOG_FILEINFO_LOADING' : 'Laster fil-informasjon for: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Dateiinformationen Dialog Fehler',
    //'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Failed to get file information for <span>{0}</span>',
    //'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Failed to get file information for: {0}',

    'DIALOG_INPUT_TITLE' : 'Eingabedialog',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Fortschritt',
    'DIALOG_FILEPROGRESS_LOADING' : 'Lade...',

    'DIALOG_UPLOAD_TITLE'   : 'Upload-Dialog',
    'DIALOG_UPLOAD_DESC'    : 'Upload nach <span>{0}</span>.<br />Maximale Größe: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : 'Hochladen von \'{0}\' ({1} {2}) von {3}',
    'DIALOG_UPLOAD_MSG'     : 'Datei-Upload...',
    'DIALOG_UPLOAD_FAILED'  : 'Upload fehlgeschlagen',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Der Upload ist fehlgeschlagen',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Unbekannter Grund...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Abbruch durch Benutzer...',

    'DIALOG_FONT_TITLE' : 'Schriftarten-Dialog',

    'DIALOG_APPCHOOSER_TITLE' : 'Wählen Sie eine Anwendung',
    'DIALOG_APPCHOOSER_MSG'   : 'Wählen Sie eine Anwendung zum Öffnen',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Sie müssen eine Anwendung auswählen',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Als Standartanwendung für {0} verwenden',

    // GoogleAPI
    //'GAPI_DISABLED'           : 'GoogleAPI Module not configured or disabled',
    //'GAPI_NOTIFICATION_TITLE' : 'You are signed in to Google API',
    //'GAPI_SIGN_OUT'           : 'Sign out from Google API Services',
    //'GAPI_REVOKE'             : 'Revoke permissions and Sign Out',
    //'GAPI_AUTH_FAILURE'       : 'Google API Authentication failed or did not take place',
    //'GAPI_AUTH_FAILURE_FMT'   : 'Failed to authenticate: {0}:{1}',
    //'GAPI_LOAD_FAILURE'       : 'Failed to load Google API',

    // IndexedDB
    //'IDB_MISSING_DBNAME' : 'Cannot create IndexedDB without Database Name',
    //'IDB_NO_SUCH_ITEM'   : 'No such item',

    // VFS
    'ERR_VFS_FATAL'           : 'Schwerwiegender Fehler',
    //'ERR_VFS_FILE_ARGS'       : 'File expects at least one argument',
    //'ERR_VFS_NUM_ARGS'        : 'Not enugh arguments',
    //'ERR_VFS_EXPECT_FILE'     : 'Expects a file-object',
    //'ERR_VFS_EXPECT_SRC_FILE' : 'Expects a source file-object',
    //'ERR_VFS_EXPECT_DST_FILE' : 'Expects a destination file-object',
    //'ERR_VFS_FILE_EXISTS'     : 'Destination already exists',
    //'ERR_VFS_TRANSFER_FMT'    : 'An error occured while transfering between storage: {0}',
    //'ERR_VFS_UPLOAD_NO_DEST'  : 'Cannot upload a file without a destination',
    //'ERR_VFS_UPLOAD_NO_FILES' : 'Cannot upload without any files defined',
    //'ERR_VFS_UPLOAD_FAIL_FMT' : 'File upload failed: {0}',
    //'ERR_VFS_UPLOAD_CANCELLED': 'File upload was cancelled',
    //'ERR_VFS_DOWNLOAD_NO_FILE': 'Cannot download a path without a path',
    //'ERR_VFS_DOWNLOAD_FAILED' : 'An error occured while downloading: {0}',
    //'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Downloading file',

    // DefaultApplication
    //'ERR_FILE_APP_OPEN'         : 'Cannot open file',
    //'ERR_FILE_APP_OPEN_FMT'     : 'The file {0} could not be opened because the mime {1} is not supported',
    //'ERR_FILE_APP_OPEN_ALT_FMT' : 'The file {0} could not be opened',
    //'ERR_FILE_APP_SAVE_ALT_FMT' : 'The file {0} could not be saved',
    //'ERR_GENERIC_APP_FMT'       : '{0} Anwendungsfehler',
    //'ERR_GENERIC_APP_ACTION_FMT': 'Konnte Aktion nicht durchführen: \'{0}\'',
    //'ERR_GENERIC_APP_UNKNOWN'   : 'Unbekannter Fehler',
    //'ERR_GENERIC_APP_REQUEST'   : 'Während Ihres Requests ist ein Fehler aufgetreten',
    //'ERR_GENERIC_APP_FATAL_FMT' : 'Schwerwiegender Fehler: {0}',
    //'MSG_GENERIC_APP_DISCARD'   : 'Aktuelles Dokument verwerfen?',
    //'MSG_FILE_CHANGED'          : 'The file has changed. Reload?',
    //'MSG_APPLICATION_WARNING'   : 'Application Warning',
    //'MSG_MIME_OVERRIDE'         : 'The filetype "{0}" is not supported, using "{1}" instead.',

    // General

    //'LBL_UNKNOWN'  : 'Unknown',
    'LBL_NAME'     : 'Name',
    'LBL_APPLY'    : 'Übernehmen',
    'LBL_FILENAME' : 'Dateiname',
    'LBL_PATH'     : 'Pfad',
    'LBL_SIZE'     : 'Größe',
    'LBL_TYPE'     : 'Type',
    'LBL_MIME'     : 'MIME',
    'LBL_LOADING'  : 'Lade',
    'LBL_SETTINGS' : 'Einstellungen',
    //'LBL_ADD_FILE' : 'Add file',
    //'LBL_COMMENT'  : 'Comment',
    //'LBL_ACCOUNT'  : 'Account',
    //'LBL_CONNECT'  : 'Connect',
    //'LBL_ONLINE'   : 'Online',
    //'LBL_OFFLINE'  : 'Offline',
    //'LBL_AWAY'     : 'Away',
    //'LBL_BUSY'     : 'Busy',
    //'LBL_CHAT'     : 'Chat',
    //'LBL_HELP'     : 'Help',
    //'LBL_ABOUT'    : 'About',
    'LBL_PANELS'   : 'Panel',
    'LBL_LOCALES'  : 'Lokalisierung',
    'LBL_THEME'    : 'Design',
    'LBL_COLOR'    : 'Farbe',
    'LBL_PID'      : 'PID',
    //'LBL_KILL'     : 'Kill',
    'LBL_ALIVE'    : 'Aktiv',
    'LBL_INDEX'    : 'Index',
    'LBL_ADD'      : 'Hinzufügen',
    'LBL_FONT'     : 'Schriftart',
    'LBL_YES'      : 'Ja',
    'LBL_NO'       : 'Nein',
    'LBL_CANCEL'   : 'Abbrechen',
    'LBL_TOP'      : 'Oben',
    'LBL_LEFT'     : 'Links',
    'LBL_RIGHT'    : 'Right',
    'LBL_BOTTOM'   : 'Unten',
    'LBL_CENTER'   : 'Zentriert',
    'LBL_FILE'     : 'Datei',
    'LBL_NEW'      : 'Neu',
    'LBL_OPEN'     : 'Öffnen',
    'LBL_SAVE'     : 'Speichern',
    'LBL_SAVEAS'   : 'Speichern unter...',
    'LBL_CLOSE'    : 'Schließen',
    'LBL_MKDIR'    : 'Create directory',
    'LBL_UPLOAD'   : 'Hochladen',
    'LBL_VIEW'     : 'Ansicht',
    'LBL_EDIT'     : 'Bearbeiten',
    'LBL_RENAME'   : 'Umbenennen',
    'LBL_DELETE'   : 'Löschen',
    'LBL_OPENWITH' : 'Öffnen mit...',
    'LBL_ICONVIEW' : 'Symbole',
    //'LBL_TREEVIEW' : 'Tree View',
    'LBL_LISTVIEW' : 'Liste',
    'LBL_REFRESH'  : 'Aktualisieren',
    'LBL_VIEWTYPE' : 'Ansichtstyp',
    'LBL_BOLD'     : 'Fett',
    'LBL_ITALIC'   : 'Kursiv',
    'LBL_UNDERLINE': 'Unterstrichen',
    //'LBL_REGULAR'  : 'Regular',
    'LBL_STRIKE'   : 'Gjennomstrek',
    'LBL_INDENT'   : 'Einzug',
    'LBL_OUTDENT'  : 'Negativeinzug',
    'LBL_UNDO'     : 'Rückgängig',
    'LBL_REDO'     : 'Vorwärts',
    'LBL_CUT'      : 'Ausschneiden',
    'LBL_UNLINK'   : 'Verknüpfung entfernen',
    'LBL_COPY'     : 'Kopieren',
    'LBL_PASTE'    : 'Einfügen',
    'LBL_INSERT'   : 'Einfügen',
    'LBL_IMAGE'    : 'Bild',
    'LBL_LINK'     : 'Verknüpfung',
    'LBL_DISCONNECT'    : 'Disconnect',
    'LBL_APPLICATIONS'  : 'Anwendung',
    //'LBL_ADD_FOLDER'    : 'Add folder',
    'LBL_INFORMATION'   : 'Information',
    'LBL_TEXT_COLOR'    : 'Textfarbe',
    'LBL_BACK_COLOR'    : 'Hintergrundfarbe',
    'LBL_RESET_DEFAULT' : 'Werkseinstellungen wiederherstellen',
    //'LBL_DOWNLOAD_COMP' : 'Download to computer',
    'LBL_ORDERED_LIST'  : 'Sortierte Liste',
    //'LBL_BACKGROUND_IMAGE' : 'Background Image',
    //'LBL_BACKGROUND_COLOR' : 'Background Color',
    'LBL_UNORDERED_LIST'   : 'Unsortierte Liste'
  };

})();
