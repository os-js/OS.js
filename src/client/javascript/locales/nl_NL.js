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
 * Dutch translation by Imre Biacsics
 */
(function() {
  'use strict';

  OSjs.Locales = OSjs.Locales || {};

  OSjs.Locales.nl_NL = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Er is een probleem opgetreden tijdens het starten',
    'ERR_WM_NOT_RUNNING'        : 'Window manager is niet gestart',
    'ERR_FILE_OPEN_FMT'         : 'Het bestand \'<span>{0}</span>\' kon niet worden geopend',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Kon geen programma vinden die \'{0}\' kan openen',
    'ERR_APP_LAUNCH_FAILED'     : 'Starten van het programma is mislukt',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Er is een probleem opgetreden tijden het starten van: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Toepassing \'{0}\' construct failed: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Toepassing \'{0}\' init() failed: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Toepassing bronnen ontbreken \'{0}\' of kon niet laden!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Toepassing \'{0}\' preload niet geslaagd: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'De toepassing \'{0}\' is al gestart en staat geen tweede instantie toe!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Starten van \'{0}\' is niet geslaagd. Application manifest data niet gevonden!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Starteb van \'{0}\' is niet geslaagd. De browser wordt niet ondersteund: {1}',

    'ERR_NO_WM_RUNNING'         : 'Window manager is niet gestart',
    'ERR_CORE_INIT_FAILED'      : 'Initialisatie van OS.js mislukt',
    'ERR_CORE_INIT_FAILED_DESC' : 'Er is een fout opgetreden tijdens de initialisatie van OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'Kan OS.js niet starten: Geen window manager gedefineerd!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'Kan OS.js niet starten: Window manager: {0} wil niet starten',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'Kan OS.js niet starten: Fout bij de preload van bronnen...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript Error Report',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Een onverwachte fout opgetreden, mogelijk een bug.',

    'ERR_APP_API_ERROR'           : 'Application API error',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Application {0} Kan actie \'{1}\' niet uitvoeren',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Missend argument: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Onbekende fout',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Er bestaat al een venster met de naam: \'{0}\'',
    'WINDOW_MINIMIZE' : 'Minimaliseren',
    'WINDOW_MAXIMIZE' : 'Maximaliseren',
    'WINDOW_RESTORE'  : 'Herstellen',
    'WINDOW_CLOSE'    : 'Sluiten',
    'WINDOW_ONTOP_ON' : 'Naar voorgrond (Aan)',
    'WINDOW_ONTOP_OFF': 'Naar voorgrond (Uit)',

    // Handler
    'TITLE_SIGN_OUT' : 'Afmelden',
    'TITLE_SIGNED_IN_AS_FMT' : 'Aangemeld als: {0}',

    // Service
    'BUGREPORT_MSG' : 'Vriendelijk verzoek dit probleem te rapporteren.\nVoeg een korte omschrijving toe en als het lukt; Hoe we dit kunnen na bootsen',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Aangemeld bij externe service: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Fatale Error',
    'ERR_UTILS_XHR_FMT' : 'AJAX/XHR Error: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Afmelden', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : ' \'{0}\'.\nWilt u deze sessie opslaan?',

    'DIALOG_CLOSE' : 'Sluiten',
    'DIALOG_CANCEL': 'Annuleren',
    'DIALOG_APPLY' : 'Bevestigen',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'Waarschuwing',

    'DIALOG_COLOR_TITLE' : 'Kleuren',
    'DIALOG_COLOR_R' : 'Red: {0}',
    'DIALOG_COLOR_G' : 'Green: {0}',
    'DIALOG_COLOR_B' : 'Blue: {0}',
    'DIALOG_COLOR_A' : 'Alpha: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Bevestigen',

    'DIALOG_ERROR_MESSAGE'   : 'Bericht',
    'DIALOG_ERROR_SUMMARY'   : 'Opsomming',
    'DIALOG_ERROR_TRACE'     : 'Trace',
    'DIALOG_ERROR_BUGREPORT' : 'Fouten rapport',

    'DIALOG_FILE_SAVE'      : 'Opslaan',
    'DIALOG_FILE_OPEN'      : 'Openen',
    'DIALOG_FILE_MKDIR'     : 'Nieuwe map',
    'DIALOG_FILE_MKDIR_MSG' : 'Maak nieuwe map in <span>{0}</span>',
    'DIALOG_FILE_OVERWRITE' : 'Weet u zeker dat het bestand overschreven moet worden \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Weergave',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Lijst weergave',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Boom weergave',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Icoontje',
    'DIALOG_FILE_ERROR'        : 'Bestands Error',
    'DIALOG_FILE_ERROR_SCANDIR': 'Kan de map niet doorzoeken \'{0}\' Er is een storing opgetreden',
    'DIALOG_FILE_MISSING_FILENAME' : 'Selecteer een bestand of geef een naam op!',
    'DIALOG_FILE_MISSING_SELECTION': 'Selecteer een bestand!',

    'DIALOG_FILEINFO_TITLE'   : 'Bestands informatie',
    'DIALOG_FILEINFO_LOADING' : 'Bestands informatie laden van: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Bestanda informatie Error',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Ophalen van informatie van <span>{0}</span> is mislukt',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Ophalen van informatie van: {0} is mislukt',

    'DIALOG_INPUT_TITLE' : 'Input Dialoog',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Voortgang',
    'DIALOG_FILEPROGRESS_LOADING' : 'Laden...',

    'DIALOG_UPLOAD_TITLE'   : 'Upload Dialoog',
    'DIALOG_UPLOAD_DESC'    : 'Upload bestand naar <span>{0}</span>.<br />Maximum grootte: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : 'Bezig met uploaden \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : 'Bezig met uploaden...',
    'DIALOG_UPLOAD_FAILED'  : 'Uploaden is niet geslaagd',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Uploaden is niet geslaagd',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Met onbekende oorzaak...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Onderbroeken door de gebruiker...',
    'DIALOG_UPLOAD_TOO_BIG': 'Het bestand is te groot',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Het bestand is te groot, overschrijding {0}',

    'DIALOG_FONT_TITLE' : 'Lettertype',

    'DIALOG_APPCHOOSER_TITLE' : 'Kies een programma',
    'DIALOG_APPCHOOSER_MSG'   : 'Kies een programma om te openen',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'U moet een programma kiezen',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Instellen als standaard toepassing voor {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPI Module is niet geconfigureerd of uitgeschakeld',
    'GAPI_SIGN_OUT'           : 'Afmelden bij Google API Services',
    'GAPI_REVOKE'             : 'Permissies herstellen en afmelden',
    'GAPI_AUTH_FAILURE'       : 'Google API Authentificatie niet gelukt of heeft niet plaatsgevonden',
    'GAPI_AUTH_FAILURE_FMT'   : 'Authentificatie mislukt: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Google API laden is mislukt',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Windows Live API module is niet geconfigureerd of uitgeschakeld',
    'WLAPI_SIGN_OUT'          : 'Afmelden bij Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'Windows Live API niet geladen',
    'WLAPI_LOGIN_FAILED'      : 'Aanmelden bij Windows Live mislukt',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Aanmelden bij Windows Live misluk: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live status: {0}',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Kan geen IndexedDB maken zonder database naam',
    'IDB_NO_SUCH_ITEM'   : 'Item bestaat niet',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'fatale Error',
    'ERR_VFS_UNAVAILABLE'     : 'Niet beschikbaar',
    'ERR_VFS_FILE_ARGS'       : 'Bestand verwacht tenminste 1 optie',
    'ERR_VFS_NUM_ARGS'        : 'Onjuist aantal opties',
    'ERR_VFS_EXPECT_FILE'     : 'Dit is geen bestands-object',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Dit is geen bronbestand',
    'ERR_VFS_EXPECT_DST_FILE' : 'Verwacht een bestemmings bestand',
    'ERR_VFS_FILE_EXISTS'     : 'Bestemming bestaat al',
    'ERR_VFS_TRANSFER_FMT'    : 'Er is een erroropgetreden bij het overzetten tussen opslag: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Kan het bestand niet uploaden zonder bestemming',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Geen bestand gedefineerd om te uploaden',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Bestand uploaden is mislukt: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Bestands upload is geannuleerd',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Kan niet downloaden zonder pad',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Er is een error opgetreden tijdens downloaden: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'De reactie was leeg',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Bestand downloaden',

    'ERR_VFSMODULE_XHR_ERROR'      : 'XHR Error',
    'ERR_VFSMODULE_ROOT_ID'        : 'ID van root map niet gevonden',
    'ERR_VFSMODULE_NOSUCH'         : 'Het bestand bestaat niet',
    'ERR_VFSMODULE_PARENT'         : 'Ouder bestaat niet',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Ouder opzoeken mislukt: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Mappen scannen mislukt',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Mappen scannen mislukt: {0}',
    'ERR_VFSMODULE_READ'           : 'Bestand lezen mislukt',
    'ERR_VFSMODULE_READ_FMT'       : 'Bestand lezen misluk: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Bestand schrijven misluk',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Bestand schrijven misluk: {0}',
    'ERR_VFSMODULE_COPY'           : 'Kopieren mislukt',
    'ERR_VFSMODULE_COPY_FMT'       : 'Kopieren mislukt: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Fout bij unlink opdracht',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Fout bij unlink opdrachte: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Bestand verplaatsen mislukt',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Bestand verplaatsen mislukt: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Fout tijdens het bepalen van het bestaan van een bestand',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Fout tijdens het bepalen van het bestaan van een bestand: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Bestands informatie lezen is mislukt',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Bestands informatie lezen is mislukt: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Map maken is mislukt',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Map maken is mislukt: {0}',
    'ERR_VFSMODULE_URL'            : 'Fout bij het verkrijgen van een URL',
    'ERR_VFSMODULE_URL_FMT'        : 'Fout bij het verkrijgen van een URL: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Fout bij het verplaatsen naar de prullebak',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Fout bij het verplaatsen naar de prullebak: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Fout bij het verplaatsen uit de prullebak',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Fout bij het verplaatsen uit de prullebak: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Fout bij het legen van de prullebak',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Fout bij het legen van de prullebak: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Aangemeld bij Dropbox',
    'DROPBOX_SIGN_OUT'           : 'Afmelden bij Google API Services',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Kan het pad niet oplossen: item niet gevonden',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Kan het bestand niet openen',
    'ERR_FILE_APP_OPEN_FMT'     : 'Het bestand {0} kan niet worden geopend {1} wordt niet ondersteund',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Het bestand {0} kan niet worden geopend',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Het bestand {0} kan niet worden opgeslagen',
    'ERR_GENERIC_APP_FMT'       : '{0} toepassing Error',
    'ERR_GENERIC_APP_ACTION_FMT': 'Kan de actie \'{0}\' niet voltooien',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Onbekende fout',
    'ERR_GENERIC_APP_REQUEST'   : 'Er is een fout opgetreden tijdens het afhandelen van dit verzoek',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Fatale fout: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Wijzigingen ongedaan maken?',
    'MSG_FILE_CHANGED'          : 'Het bestand is gewijzigd. Opnieuw laden?',
    'MSG_APPLICATION_WARNING'   : 'Waarschuwing',
    'MSG_MIME_OVERRIDE'         : 'Het bestandstype "{0}" wordt niet ondersteund, suggestie: "{1}"',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Onbekend',
    'LBL_APPEARANCE'   : 'Weergave',
    'LBL_USER'         : 'Gebruiker',
    'LBL_NAME'         : 'Naam',
    'LBL_APPLY'        : 'Bevestigen',
    'LBL_FILENAME'     : 'Bestandsnaam',
    'LBL_PATH'         : 'Map',
    'LBL_SIZE'         : 'Grootte',
    'LBL_TYPE'         : 'Type',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Laden',
    'LBL_SETTINGS'     : 'Instellingen',
    'LBL_ADD_FILE'     : 'Bestand toevoegen',
    'LBL_COMMENT'      : 'Opmerking',
    'LBL_ACCOUNT'      : 'Account',
    'LBL_CONNECT'      : 'Verbinden',
    'LBL_ONLINE'       : 'Verbonden',
    'LBL_OFFLINE'      : 'Verbroken',
    'LBL_AWAY'         : 'Afwezig',
    'LBL_BUSY'         : 'Bezig',
    'LBL_CHAT'         : 'Chat',
    'LBL_HELP'         : 'Help',
    'LBL_ABOUT'        : 'Over',
    'LBL_PANELS'       : 'Panelen',
    'LBL_LOCALES'      : 'Talen',
    'LBL_THEME'        : 'Thema',
    'LBL_COLOR'        : 'Kleur',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Stop',
    'LBL_ALIVE'        : 'Aktief',
    'LBL_INDEX'        : 'Index',
    'LBL_ADD'          : 'Toevoegen',
    'LBL_FONT'         : 'Lettertype',
    'LBL_YES'          : 'Ja',
    'LBL_NO'           : 'Nee',
    'LBL_CANCEL'       : 'Annuleren',
    'LBL_TOP'          : 'Boven',
    'LBL_LEFT'         : 'Links',
    'LBL_RIGHT'        : 'Rechts',
    'LBL_BOTTOM'       : 'Onder',
    'LBL_CENTER'       : 'Midden',
    'LBL_FILE'         : 'Bestand',
    'LBL_NEW'          : 'Nieuw',
    'LBL_OPEN'         : 'Open',
    'LBL_SAVE'         : 'Opslaan',
    'LBL_SAVEAS'       : 'opslaan als...',
    'LBL_CLOSE'        : 'Sluiten',
    'LBL_MKDIR'        : 'Nieuwe map maken',
    'LBL_UPLOAD'       : 'Uploaden',
    'LBL_VIEW'         : 'Beeld',
    'LBL_EDIT'         : 'Bewerken',
    'LBL_RENAME'       : 'Hernoemen',
    'LBL_DELETE'       : 'Verwijderen',
    'LBL_OPENWITH'     : 'Openen met ...',
    'LBL_ICONVIEW'     : 'Icoon weergave',
    'LBL_TREEVIEW'     : 'Boom weergave',
    'LBL_LISTVIEW'     : 'Lijst weergave',
    'LBL_REFRESH'      : 'Verversen',
    'LBL_VIEWTYPE'     : 'Weergave type',
    'LBL_BOLD'         : 'Vet',
    'LBL_ITALIC'       : 'Schuin',
    'LBL_UNDERLINE'    : 'Onderstreept',
    'LBL_REGULAR'      : 'Normaal',
    'LBL_STRIKE'       : 'Doorgehaald',
    'LBL_INDENT'       : 'Inspringen',
    'LBL_OUTDENT'      : 'Uitspringen',
    'LBL_UNDO'         : 'Ongedaan maken',
    'LBL_REDO'         : 'Ongedaan maken herstellen',
    'LBL_CUT'          : 'Knip',
    'LBL_UNLINK'       : 'Unlink',
    'LBL_COPY'         : 'Kopieren',
    'LBL_PASTE'        : 'Plakken',
    'LBL_INSERT'       : 'Invoegen',
    'LBL_IMAGE'        : 'Afbeelding',
    'LBL_LINK'         : 'Link',
    'LBL_DISCONNECT'    : 'Verbreken',
    'LBL_APPLICATIONS'  : 'Toepassingen',
    'LBL_ADD_FOLDER'    : 'Map toevoegen',
    'LBL_INFORMATION'   : 'Informatie',
    'LBL_TEXT_COLOR'    : 'Tekst kleur',
    'LBL_BACK_COLOR'    : 'Achtergrond kleur',
    'LBL_RESET_DEFAULT' : 'Standaard instelling terug zetten',
    'LBL_DOWNLOAD_COMP' : 'Downloaden naar je computer',
    'LBL_ORDERED_LIST'  : 'Gesorteerde lijst',
    'LBL_BACKGROUND_IMAGE' : 'Achtergrond afbeelding',
    'LBL_BACKGROUND_COLOR' : 'Achtergrond kleur',
    'LBL_UNORDERED_LIST'   : 'Ongesorteerde lijst',
    'LBL_STATUS'   : 'Status',
    'LBL_READONLY' : 'Alleen lezen'
  };

})();
