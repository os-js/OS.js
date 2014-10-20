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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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

  OSjs.Locale.Lang.no_NO = {

    'ERR_FILE_OPEN' : 'Feil ved åpning av fil',
    'ERR_WM_NOT_RUNNING' : 'Ingen vinubehandler kjørende',
    'ERR_FILE_OPEN_FMT' : 'Filen \'<span>{0}</span>\' kunne ikke åpnes',
    'ERR_APP_MIME_NOT_FOUND_FMT' : 'Klarte ikke finne en Applikasjon som støtter \'{0}\' filer',

    'ERR_APP_LAUNCH_FAILED' : 'Feil under oppstart av Applikasjon',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'En feil skjedde under oppstart av: {0}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT' : 'Applikasjonen \'{0}\' kjører allerede, og kun en instans er tillat',
    'ERR_APP_CONSTRUCT_FAILED_FMT' : 'Applikasjonen \'{0}\' construct feilet: {1}',
    'ERR_APP_INIT_FAILED_FMT' : 'Applikasjon \'{0}\' init() feilet: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Applikasjon ressursjer mangler for \'{0}\' (eller en feil oppstod)',
    'ERR_APP_PRELOAD_FAILED_FMT' : 'Applikasjonen \'{0}\' preloading feilet: \n{1}',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT' : 'Klarte ikke starte \'{0}\'. Applikasjonsmanifest ikke funnet!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Klarte ikke starte \'{0}\'. Din nettleser støtter ikke: {1}',

    'ERR_JAVASCRIPT_EXCEPTION' : 'JavaScript Feil Oppstod',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'An uventet feil oppstod, eller en kodefeil',
    'ERR_CORE_INIT_FAILED' : 'Klarte ikke starte OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'En feil skjedde under oppstart av OS.js',
    'ERR_CORE_INIT_NO_WM' : 'Klarte ikke starte OS.js: Ingen vinduhåndterer angitt!',
    'ERR_CORE_INIT_WM_FAILED_FMT' : 'Klarte ikke starte OS.js: Klarte ikke laste vindushåndterer: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED' : 'Klarte ikke starte OS.js: Klarte ikke preloade ressursjer...',

    'ERR_APP_API_ERROR' : 'Applikasjon API Feil',
    'ERR_APP_API_ERROR_DESC_FMT' : 'Applikasjonen {0} klarte ikke utføre operasjon \'{1}\'',

    'Logging out user \'{0}o\'.\nDo you want to save current session?' : 'Logger ut bruker \'{0}\'.\nVil du lagre gjeldende sessjon?',

    // helpers.js
    'The requested file MIME \'{0}\' is not accepted by this application.' : 'Denne applikasjonen støtter ikke filer med denne MIME-typen \'{0}\'',
    'Fatal error on open file!' : 'Fatal feil under åpning av fil!',
    'Fatal error on save file!' : 'Fatal feil under lagring av fil!',

    // dialogs.js
    'Choose Application' : 'Velg Applikasjon',
    'Choose an application to open' : 'Velg en applikasjon for åpning',
    'You need to select an application' : 'Du må velge en applikasjon',
    'Use as default application for {0}' : 'Bruk som standard for {0}',
    'File Operation Progress' : 'Fil-operasjon status',
    'Upload file to <span>{0}</span>.<br />Maximum size: {1} bytes' : 'Last opp til <span>{0}</span>.<br />Maks størrelse: {1} bytes',
    'Upload Dialog' : 'Opplasting dialog',
    'Uploading file...' : 'Laster opp fil...',
    'Uploading \'{0}\' ({1} {2}) to {3}' : 'Laster opp \'{0}\' ({1} {2}) til {3}',
    'Upload failed' : 'Opplasting feilet',
    'The upload has failed' : 'Opplastingen har feilet',
    'Reason unknown...' : 'Ukjent årsak...',
    'Cancelled by user...' : 'Avbrutt av bruker...',
    'FileDialog Error' : 'Fil Dialog Feil',
    'Failed listing directory \'{0}\' because an error occured' : 'Klarte ikke liste mappen \'{0}\' fordi en feil oppstod',
    'Are you sure you want to overwrite the file \'{0}\'?' : 'Er du sikker på at du vil overskrive filen \'{0}\'?',
    'You need to select a file or enter new filename!' : 'Du må velge en fil eller skrive inn et navn!',
    'You need to select a file!' : 'Du må velge en fil!',
    'File Information' : 'Fil-informasjon',
    'Loading file information for: {0}' : 'Laster fil-informasjon for: {0}',
    'FileInformationDialog Error' : 'File-informasjon Dialog Feil',
    'Failed to get file information for <span>{0}</span>' : 'Klarte ikke hente fil-informasjon for <span>{0}</span>',
    'Failed to get file information for: {0}' : 'Klarte ikke hente fil-informasjon for: {0}',
    'Alert Dialog' : 'Advarsel Dialog',
    'Confirm Dialog' : 'Konfirmasjons-dialog',
    'Input Dialog' : 'Inndata-dialog',
    'Color Dialog' : 'Farge-dialog',
    'Red: {0}' : 'Rød: {0}',
    'Green: {0}' : 'Grønn: {0}',
    'Blue: {0}' : 'Blå: {0}',
    'Alpha: {0}' : 'Alpha: {0}',
    'Font Dialog' : 'Skriftype-dialog',

    // DefaultApplication
    'ERR_GENERIC_APP_FMT' : '{0} Applikasjon Feil',
    'ERR_GENERIC_APP_ACTION_FMT' : 'Klarte ikke utføre \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN' : 'Unkjent Feil',
    'ERR_GENERIC_APP_REQUEST' : 'En feil oppstod under handling av din forespursel',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Fatal Feil: {0}',
    'MSG_GENERIC_APP_DISCARD' : 'Forkaste gjeldende dokument ?',

    // Common
    'Minimize'          : 'Minimiser',
    'Maximize'          : 'Maksimiser',
    'Restore'           : 'Gjenopprett',
    'On Top - Disable'  : 'På Topp - Skru av',
    'On Top - Enable'   : 'På Topp - Skru på',
    'Application'       : 'Applikasjon',
    'Settings'          : 'Instillinger',
    'Log out (Exit)'    : 'Logg ut (Avslutt)',
    'Loading...'        : 'Laster...',
    'Message'           : 'Melding',
    'Summary'           : 'Oppsummering',
    'Trace'             : 'Trace',
    'Name'              : 'Navn',
    'Save'              : 'Lagre',
    'Open'              : 'Åpne',
    'Close'             : 'Lukk',
    'Cancel'            : 'Avbryt',
    'OK'                : 'OK',
    'Filename'          : 'Filnavn',
    'Type'              : 'Type',
    'MIME'              : 'MIME',
    'Path'              : 'Sti',
    'Size'              : 'Størrelse',
    'Index'             : 'Indeks',
    'Bugreport'         : 'Meld feil',
    'File'              : 'Fil',
    'Add'               : 'Legg til',
    'New'               : 'Ny',
    'Save As...'        : 'Lagre Som...',
    'Create directory'  : 'Opprett mappe',
    'Edit'              : 'Rediger',
    'View'              : 'Visning',
    'Upload'            : 'Last opp',
    'Rename'            : 'Navngi',
    'Delete'            : 'Slett',
    'Information'       : 'Informasjon',
    'Open With...'      : 'Åpne Med...',
    'List View'         : 'Liste-visning',
    'Icon View'         : 'Ikon-visning',
    'Refresh'           : 'Gjennoppfrisk',
    'View type'         : 'Visnings type',
    'PID'               : 'PID',
    'Alive'             : 'Levetid',
    'Undo'              : 'Angre',
    'Redo'              : 'Gjenta',
    'Copy'              : 'Kopier',
    'Paste'             : 'Lim inn',
    'Cut'               : 'Klipp ut',
    'Unlink'            : 'Fjern lenke',
    'Ordered List'      : 'Sortert liste',
    'Unordered List'    : 'Usortert liste',
    'Image'             : 'Bilde',
    'Link'              : 'Lenke',
    'Insert'            : 'Sett inn',
    'Bold'              : 'Fet',
    'Italic'            : 'Kursiv',
    'Underline'         : 'Understrek',
    'Skrike'            : 'Gjennomstrek',
    'Left'              : 'Venstre',
    'Center'            : 'Sentrert',
    'Right'             : 'Høyre',
    'Indent'            : 'Indenter',
    'Outdent'           : 'Utdenter',
    'Text Color'        : 'Tekst farge',
    'Back Color'        : 'Bakgrunns farge',
    'Fatal error'       : 'Fatal feil',
    'Reset to defaults' : 'Nullstill til standard',
    'Panels'            : 'Panel',
    'Theme'             : 'Tema',
    'Color'             : 'Farge',
    'Font'              : 'Skrift-type',
    'Background Image'  : 'Bakgrunn Bilde',
    'Background Color'  : 'Bakgrunn Farge',
    'Apply'             : 'Bruk',
    'Locales'           : 'Lokalisering',
    'Top'               : 'Topp',
    'Bottom'            : 'Bunn',
    'Yes'               : 'Ja',
    'No'                : 'Nei'
  };
})();
