/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
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

  OSjs.Locales.de_DE = {
    'ERR_FILE_OPEN'     : 'Fehler beim Öffnen der Datei',
    'ERR_WM_NOT_RUNNING': 'Fenster-Manager wird nicht ausgeführt',
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

    'ERR_NO_WM_RUNNING'           : 'Es wird kein Fenster-Manager ausgeführt',
    'ERR_CORE_INIT_FAILED'        : 'OS.js konnte nicht initialisiert werden',
    'ERR_CORE_INIT_FAILED_DESC'   : 'Während der Initialisirung von OS.js ist ein Fehler aufgetreten',
    'ERR_CORE_INIT_NO_WM'         : 'OS.js konnte nicht gestartet werden: Fenster-Manager nicht festgelegt!',
    'ERR_CORE_INIT_WM_FAILED_FMT' : 'OS.js konnte nicht gestartet werden: Fenster-Manager konnte nicht gestartet werden: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED': 'OS.js konnte nicht gestartet werden: Resourssen konnten nicht vorab geladen werden...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript Fehlerbericht',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Ein unerwarteter Fehler ist aufgetreten, möglicherweise ein Bug',

    'ERR_APP_API_ERROR'           : 'Anwendungs API Fehler',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Anwendung {0} konnte Aktion nicht ausführen \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Fehlendes Argument: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Unbekannter Fehler',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Sie haben bereits ein Fenster namens \'{0}\'',
    'WINDOW_MINIMIZE' : 'Minimieren',
    'WINDOW_MAXIMIZE' : 'Maximieren',
    'WINDOW_RESTORE'  : 'Wiederherstellen',
    'WINDOW_CLOSE'    : 'Schließen',
    'WINDOW_ONTOP_ON' : 'Im Vordergrund - Aktivieren',
    'WINDOW_ONTOP_OFF': 'Im Vordergrund - Deaktivieren',

    // Handler
    'TITLE_SIGN_OUT' : 'Abmelden',
    'TITLE_SIGNED_IN_AS_FMT' : 'Angemeldet als: {0}',

    // Dialogs
    'DIALOG_LOGOUT_TITLE' : 'Abmelden (Exit)', // Actually located in session.js
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
    'DIALOG_FILE_MKDIR_MSG' : 'Erstelle ein neues Verzeichnis in <span>{0}</span>',
    'DIALOG_FILE_OVERWRITE' : 'Sind Sie sicher, dass Sie die Datei \'{0}\' überschreiben wollen?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Ansichtstyp',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Liste',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Baum',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Symbole',
    'DIALOG_FILE_ERROR'        : 'Datei-Dialog Fehler',
    'DIALOG_FILE_ERROR_SCANDIR': 'Verzeichnis \'{0}\' konnte nicht geöffnet werden',
    'DIALOG_FILE_MISSING_FILENAME' : 'Sie müssen eine Datei auswählen oder geben Sie einen neuen Dateinamen an!',
    'DIALOG_FILE_MISSING_SELECTION': 'Sie müssen eine Datei auswählen!',

    'DIALOG_FILEINFO_TITLE'   : 'Dateiinformationen',
    'DIALOG_FILEINFO_LOADING' : 'Laster fil-informasjon for: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Dateiinformationen Dialog Fehler',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Fehler beim bekommen von Dateiinformationen für <span>{0}</span>',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Fehler beim bekommen von Dateiinformationen für: {0}',

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
    'GAPI_DISABLED'           : 'GoogleAPI Modul ist nicht konfiguriert oder aktiviert',
    'GAPI_NOTIFICATION_TITLE' : 'Sie sind bei Google API angemeldet',
    'GAPI_SIGN_OUT'           : 'Von Google API Dienst abmelden',
    'GAPI_REVOKE'             : 'Berechtigungen wiederrufen und abmelden',
    'GAPI_AUTH_FAILURE'       : 'Google API Authentifizierung ist fehlgeschlagen oder fand nicht statt',
    'GAPI_AUTH_FAILURE_FMT'   : 'Fehler beim Authentifizieren: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Konnte Google API nicht laden',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'IndexedDB kann nicht ohne Datenbankname erstellt werden',
    'IDB_NO_SUCH_ITEM'   : 'Keine Elemente',

    // VFS
    'ERR_VFS_FATAL'           : 'Schwerwiegender Fehler',
    'ERR_VFS_FILE_ARGS'       : 'Datei erwartet mindestens ein Argument',
    'ERR_VFS_NUM_ARGS'        : 'Nicht genug Argumente',
    'ERR_VFS_EXPECT_FILE'     : 'Erwartet ein Datei-Objekt',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Erwartet einen Quelldatei-Objekt',
    'ERR_VFS_EXPECT_DST_FILE' : 'Erwartet ein Zieldatei-Objekt',
    'ERR_VFS_FILE_EXISTS'     : 'Ziel existiert bereits',
    'ERR_VFS_TRANSFER_FMT'    : 'Während des übertragen zwischen Speicher ist ein Fehler aufgetreten: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Eine Datei ohne Ziel kann nicht hochgeladen werden',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Ohne Dateien zu definieren kann nicht hochgeladen werden',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Datei-Upload fehlgeschlagen: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Datei-Upload wurde abgebrochen',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Kann keinen Pfad ohne angegebenen Pfad herunterladen',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Während des Downloads ist ein Fehler aufgetreten: {0}',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Datei herunterladen',

    // DefaultApplication
    'ERR_FILE_APP_OPEN'         : 'Datei kann nicht geöffnet werden',
    'ERR_FILE_APP_OPEN_FMT'     : 'Die Datei {0} kann nicht geöffnet werden, da der Dateityp (MIME) {1} nicht unterstützt wird',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Die Datei {0} konnte nicht geöffnet werden',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Die Datei {0} konnte nicht gespeichert werden',
    'ERR_GENERIC_APP_FMT'       : '{0} Anwendungsfehler',
    'ERR_GENERIC_APP_ACTION_FMT': 'Konnte Aktion nicht durchführen: \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Unbekannter Fehler',
    'ERR_GENERIC_APP_REQUEST'   : 'Während Ihres Requests ist ein Fehler aufgetreten',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Schwerwiegender Fehler: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Aktuelles Dokument verwerfen?',
    'MSG_FILE_CHANGED'          : 'Die Datei wurde geändert. Neuladen?',
    'MSG_APPLICATION_WARNING'   : 'Anwendungswarnung',
    'MSG_MIME_OVERRIDE'         : 'Der Dateityp "{0}" wird nicht unterstützt, benutzen Sie "{1}" stattdessen.',

    // General
    'LBL_UNKNOWN'      : 'Unbekannt',
    'LBL_APPEARANCE'   : 'Aussehen',
    'LBL_USER'         : 'Benutzer',
    'LBL_NAME'         : 'Name',
    'LBL_APPLY'        : 'Übernehmen',
    'LBL_FILENAME'     : 'Dateiname',
    'LBL_PATH'         : 'Pfad',
    'LBL_SIZE'         : 'Größe',
    'LBL_TYPE'         : 'Type',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Lade',
    'LBL_SETTINGS'     : 'Einstellungen',
    'LBL_ADD_FILE'     : 'Datei hinzufügen',
    'LBL_COMMENT'      : 'Kommentar',
    'LBL_ACCOUNT'      : 'Konto',
    'LBL_CONNECT'      : 'Verbinden',
    'LBL_ONLINE'       : 'Online',
    'LBL_OFFLINE'      : 'Offline',
    'LBL_AWAY'         : 'Abwesend',
    'LBL_BUSY'         : 'Beschäftigt',
    'LBL_CHAT'         : 'Chat',
    'LBL_HELP'         : 'Hilfe',
    'LBL_ABOUT'        : 'Über',
    'LBL_PANELS'       : 'Panel',
    'LBL_LOCALES'      : 'Lokalisierung',
    'LBL_THEME'        : 'Design',
    'LBL_COLOR'        : 'Farbe',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Beenden (Kill)',
    'LBL_ALIVE'        : 'Aktiv',
    'LBL_INDEX'        : 'Index',
    'LBL_ADD'          : 'Hinzufügen',
    'LBL_FONT'         : 'Schriftart',
    'LBL_YES'          : 'Ja',
    'LBL_NO'           : 'Nein',
    'LBL_CANCEL'       : 'Abbrechen',
    'LBL_TOP'          : 'Oben',
    'LBL_LEFT'         : 'Links',
    'LBL_RIGHT'        : 'Right',
    'LBL_BOTTOM'       : 'Unten',
    'LBL_CENTER'       : 'Zentriert',
    'LBL_FILE'         : 'Datei',
    'LBL_NEW'          : 'Neu',
    'LBL_OPEN'         : 'Öffnen',
    'LBL_SAVE'         : 'Speichern',
    'LBL_SAVEAS'       : 'Speichern unter...',
    'LBL_CLOSE'        : 'Schließen',
    'LBL_MKDIR'        : 'Verzeichnis erstellen',
    'LBL_UPLOAD'       : 'Hochladen',
    'LBL_VIEW'         : 'Ansicht',
    'LBL_EDIT'         : 'Bearbeiten',
    'LBL_RENAME'       : 'Umbenennen',
    'LBL_DELETE'       : 'Löschen',
    'LBL_OPENWITH'     : 'Öffnen mit...',
    'LBL_ICONVIEW'     : 'Symbole',
    'LBL_TREEVIEW'     : 'Baum',
    'LBL_LISTVIEW'     : 'Liste',
    'LBL_REFRESH'      : 'Aktualisieren',
    'LBL_VIEWTYPE'     : 'Ansichtstyp',
    'LBL_BOLD'         : 'Fett',
    'LBL_ITALIC'       : 'Kursiv',
    'LBL_UNDERLINE'    : 'Unterstrichen',
    'LBL_REGULAR'      : 'Regelmäßig',
    'LBL_STRIKE'       : 'Gjennomstrek',
    'LBL_INDENT'       : 'Einzug',
    'LBL_OUTDENT'      : 'Negativeinzug',
    'LBL_UNDO'         : 'Rückgängig',
    'LBL_REDO'         : 'Vorwärts',
    'LBL_CUT'          : 'Ausschneiden',
    'LBL_UNLINK'       : 'Verknüpfung entfernen',
    'LBL_COPY'         : 'Kopieren',
    'LBL_PASTE'        : 'Einfügen',
    'LBL_INSERT'       : 'Einfügen',
    'LBL_IMAGE'        : 'Bild',
    'LBL_LINK'         : 'Verknüpfung',
    'LBL_DISCONNECT'    : 'Disconnect',
    'LBL_APPLICATIONS'  : 'Anwendung',
    'LBL_ADD_FOLDER'    : 'Verzeichnis hinzufügen',
    'LBL_INFORMATION'   : 'Information',
    'LBL_TEXT_COLOR'    : 'Textfarbe',
    'LBL_BACK_COLOR'    : 'Hintergrundfarbe',
    'LBL_RESET_DEFAULT' : 'Werkseinstellungen wiederherstellen',
    'LBL_DOWNLOAD_COMP' : 'Auf PC herunterladen',
    'LBL_ORDERED_LIST'  : 'Sortierte Liste',
    'LBL_BACKGROUND_IMAGE' : 'Hintergrundbild',
    'LBL_BACKGROUND_COLOR' : 'Hintergrundfarbe',
    'LBL_UNORDERED_LIST'   : 'Unsortierte Liste'
  };

})();
