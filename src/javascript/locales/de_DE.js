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

  OSjs.Locale = OSjs.Locale || {};
  OSjs.Locale.Lang = OSjs.Locale.Lang || {};

  OSjs.Locale.Lang.de_DE = {

    // core.js

    'ERR_FILE_OPEN': 'Fehler beim Öffnen der Datei',
    'ERR_WM_NOT_RUNNING': 'Es wird kein Fenster-Manager ausgeführt',
    'ERR_FILE_OPEN_FMT': 'Die Datei \'<span>{0}</span>\' kann nicht geöffnet werden',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Keine Anwendung gefunden, die den Datentyp \'{0}\' unterstützt',

    'ERR_APP_LAUNCH_FAILED': 'Fehler beim Starten der Anwendung',
    'ERR_APP_LAUNCH_FAILED_FMT': 'Ein Fehler ist aufgetreten, während des Versuchs \'{0}\' zu starten',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT': 'Anwendung \'{0}\' ist bereits gestartet und erlaubt nur eine Instanz',
    'ERR_APP_CONSTRUCT_FAILED_FMT': 'Anwendung \'{0}\' construct gescheitert: {1}',
    'ERR_APP_INIT_FAILED_FMT': 'Anwendung \'{0}\' init() gescheitert: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT': 'Anwendungsressourcen fehlen oder wurden nicht geladen für: {0}',
    'ERR_APP_PRELOAD_FAILED_FMT': 'Anwendung \'{0}\' preloading gescheitert: \n{1}',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT': '\'{0}\' konnte nicht gestartet werden. Anwendungsmanifest nicht gefunden!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Klarte ikke starte \'{0}\'. Uw browser ondersteunt geen: {1}',

    'ERR_JAVASCRIPT_EXCEPTION': 'JavaScript Fehlerbericht',
    'ERR_JAVACSRIPT_EXCEPTION_DESC': 'Ein unerwarteter Fehler ist aufgetreten, möglicherweise ein Bug',
    'ERR_CORE_INIT_FAILED': 'OS.js konnte nicht initialisiert werden',
    'ERR_CORE_INIT_FAILED_DESC': 'Während der Initialisirung von OS.js ist ein Fehler aufgetreten',
    'ERR_CORE_INIT_NO_WM': 'OS.js konnte nicht gestartet werden: Fenster-Manager nicht festgelegt!',
    'ERR_CORE_INIT_WM_FAILED_FMT': 'OS.js konnte nicht gestartet werden: Fenster-Manager konnte nicht gestartet werden: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED': 'OS.js konnte nicht gestartet werden: Resourssen konnten nicht vorab geladen werden...',

    'ERR_APP_API_ERROR': 'Anwendungs API Fehler',
    'ERR_APP_API_ERROR_DESC_FMT': 'Anwendung {0} konnte Aktion nicht ausführen \'{1}\'',

    'Logging out user \'{0}\'.\nDo you want to save current session?' : 'Benutzer wird abgemeldet \'{0}\'.\nWollen Sie die aktuelle Sitzung speichern?',

    // dialogs.js
    'Choose Application': 'Wählen Sie eine Anwendung',
    'Choose an application to open': 'Wählen Sie eine Anwendung zum Öffnen',
    'You need to select an application': 'Sie müssen eine Anwendung auswählen',
    'Use as default application for {0}': 'Als Standartanwendung für {0} verwenden',
    'File Operation Progress': 'Fortschritt',
    'Upload file to <span>{0}</span>.<br />Maximum size: {1} bytes': 'Upload nach <span>{0}</span>.<br />Maximale Größe: {1} bytes',
    'Upload Dialog': 'Upload-Dialog',
    'Uploading file...': 'Datei-Upload...',
    'Uploading \'{0}\' ({1} {2}) to {3}': 'Hochladen von \'{0}\' ({1} {2}) von {3}',
    'Upload failed': 'Upload fehlgeschlagen',
    'The upload has failed': 'Der Upload ist fehlgeschlagen',
    'Reason unknown...': 'Unbekannter Grund...',
    'Cancelled by user...': 'Abbruch durch Benutzer...',
    'FileDialog Error': 'Datei-Dialog Fehler',
    'Failed listing directory \'{0}\' because an error occured': 'Verzeichnis \'{0}\' konnte nicht geöffnet werden',
    'Are you sure you want to overwrite the file \'{0}\'?': 'Sind Sie sicher, dass Sie die Datei \'{0}\' überschreiben wollen?',
    'You need to select a file or enter new filename!': 'Sie müssen eine Datei auswählen oder geben Sie einen neuen Dateinamen an!',
    'You need to select a file!': 'Sie müssen eine Datei auswählen!',
    'File Information': 'Dateiinformationen',
    'Loading file information for: {0}': 'Laster fil-informasjon for: {0}',
    'FileInformationDialog Error': 'File-informasjon Dialog Feil',
    'Failed to get file information for <span>{0}</span>': 'Klarte ikke hente fil-informasjon for <span>{0}</span>',
    'Failed to get file information for: {0}': 'Klarte ikke hente fil-informasjon for: {0}',
    'Alert Dialog': 'Warnungsdialog',
    'Confirm Dialog': 'Bestätigungsdialog',
    'Input Dialog': 'Eingabedialog',
    'Color Dialog': 'Farb-Dialog',
    'Red: {0}': 'Rot: {0}',
    'Green: {0}': 'Grün: {0}',
    'Blue: {0}': 'Blau: {0}',
    'Alpha: {0}': 'Alpha: {0}',
    'Font Dialog': 'Schriftarten-Dialog',

    // DefaultApplication
    'ERR_GENERIC_APP_FMT' : '{0} Anwendungsfehler',
    'ERR_GENERIC_APP_ACTION_FMT' : 'Konnte Aktion nicht durchführen: \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN' : 'Unbekannter Fehler',
    'ERR_GENERIC_APP_REQUEST' : 'Während Ihres Requests ist ein Fehler aufgetreten',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Schwerwiegender Fehler: {0}',
    'MSG_GENERIC_APP_DISCARD' : 'Aktuelles Dokument verwerfen?',

    // Common
    'Minimize'          : 'Minimieren',
    'Maximize'          : 'Maximieren',
    'Restore'           : 'Wiederherstellen',
    'On Top - Disable'  : 'Im Vordergrund - Deaktivieren',
    'On Top - Enable'   : 'Im Vordergrund - Aktivieren',
    'Application'       : 'Anwendung',
    'Settings'          : 'Einstellungen',
    'Log out (Exit)'    : 'Abmelden',
    'Loading...'        : 'Lade...',
    'Message'           : 'Meldung',
    'Summary'           : 'Zusammenfassung',
    'Trace'             : 'Trace',
    'Name'              : 'Name',
    'Save'              : 'Speichern',
    'Open'              : 'Öffnen',
    'Close'             : 'Schließen',
    'Cancel'            : 'Abbrechen',
    'OK'                : 'OK',
    'Filename'          : 'Dateiname',
    'Type'              : 'Type',
    'MIME'              : 'MIME',
    'Path'              : 'Pfad',
    'Size'              : 'Größe',
    'Index'             : 'Index',
    'Bugreport'         : 'Fehlerbericht',
    'File'              : 'Datei',
    'Add'               : 'Hinzufügen',
    'New'               : 'Neu',
    'Save As...'        : 'Speichern unter...',
    'Create directory'  : 'Verzeichnis erstellen',
    'Edit'              : 'Bearbeiten',
    'View'              : 'Ansicht',
    'Upload'            : 'Hochladen',
    'Rename'            : 'Umbenennen',
    'Delete'            : 'Löschen',
    'Information'       : 'Information',
    'Open With...'      : 'Öffnen mit...',
    'List View'         : 'Liste',
    'Icon View'         : 'Symbole',
    'Refresh'           : 'Aktualisieren',
    'View type'         : 'Ansichtstyp',
    'PID'               : 'PID',
    'Alive'             : 'Aktiv',
    'Undo'              : 'Rückgängig',
    'Redo'              : 'Vorwärts',
    'Copy'              : 'Kopieren',
    'Paste'             : 'Einfügen',
    'Cut'               : 'Ausschneiden',
    'Unlink'            : 'Verknüpfung entfernen',
    'Ordered List'      : 'Sortierte Liste',
    'Unordered List'    : 'Unsortierte Liste',
    'Image'             : 'Bild',
    'Link'              : 'Verknüpfung',
    'Insert'            : 'Einfügen',
    'Bold'              : 'Fett',
    'Italic'            : 'Kursiv',
    'Underline'         : 'Unterstrichen',
    'Skrike'            : 'Gjennomstrek',
    'Left'              : 'Links',
    'Center'            : 'Zentriert',
    'Right'             : 'Rechts',
    'Indent'            : 'Einzug',
    'Outdent'           : 'Negativeinzug',
    'Text Color'        : 'Textfarbe',
    'Back Color'        : 'Hintergrundfarbe',
    'Fatal error'       : 'Schwerwiegender Fehler',
    'Reset to defaults' : 'Werkseinstellungen wiederherstellen',
    'Panels'            : 'Panel',
    'Theme'             : 'Design',
    'Color'             : 'Farbe',
    'Background Image'  : 'Hintergrundbild',
    'Background Color'  : 'Hintergrundfarbe',
    'Font'              : 'Schriftart',
    'Top'               : 'Oben',
    'Bottom'            : 'Unten',
    'Yes'               : 'Ja',
    'No'                : 'Nein',
    'Apply'             : 'Übernehmen',
    'Locales'           : 'Lokalisierung'

  };

})();
