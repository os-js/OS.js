"use strict";
/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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

  window.OSjs       = window.OSjs       || {};
  OSjs.Locale       = OSjs.Locale       || {};

  /////////////////////////////////////////////////////////////////////////////
  // TRANSLATIONS
  /////////////////////////////////////////////////////////////////////////////

  var DefaultLocale = 'en_US';
  var CurrentLocale = 'en_US';
  var Locales       = {};

  /*
   * English
   */
  Locales.en_US = {

  };

  /**
   * Norwegian
   */
  Locales.no_NO = {

    // core.js
    "Error opening file" : "Feil ved åpning av fil",
    "No window manager is running" : "Ingen vinubehandler kjørende",
    "The file '<span>{0}</span>' could not be opened" : "Filen '<span>{0}</span>' kunne ikke åpnes",
    "Could not find any Applications with support for '{0}' files" : "Klarte ikke finne en Applikasjon som støtter '{0}' filer",

    'Failed to launch Application' : 'Feil under oppstart av Applikasjon',
    'An error occured while trying to launch: {0}' : 'En feil skjedde under oppstart av: {0}',
    "The application '{0}' is already launched and allows only one instance!" : "Applikasjonen '{0}' kjører allerede, og kun en instans er tillat",
    "Application '{0}' construct failed: {1}" : "Applikasjonen '{0}' construct feilet: {1}",
    "Application '{0}' init() failed: {1}" : "Applikasjon '{0}' init() feilet: {1}",
    "Application resources missing for '{0}' or it failed to load!" : "Applikasjon ressursjer mangler for '{0}' (eller en feil oppstod)",
    "Application '{0}' preloading failed: \n{1}" : "Applikasjonen '{0}' preloading feilet: \n{1}",
    "Failed to launch '{0}'. Application manifest data not found!" : "Klarte ikke starte '{0}'. Applikasjonsmanifest ikke funnet!",

    'JavaScript Error Report' : 'JavaScript Feil Oppstod',
    'An unexpected error occured, maybe a bug.' : 'An uventet feil oppstod, eller en kodefeil',
    'Failed to initialize OS.js' : 'Klarte ikke starte OS.js',
    'An error occured while initializing OS.js' : 'En feil skjedde under oppstart av OS.js',
    "Cannot launch OS.js: No window manager defined!" : 'Klarte ikke starte OS.js: Ingen vinduhåndterer angitt!',
    "Cannot launch OS.js: Failed to launch Window Manager: {0}" : 'Klarte ikke starte OS.js: Klarte ikke laste vindushåndterer: {0}',
    "Cannot launch OS.js: Failed to preload resources..." : 'Klarte ikke starte OS.js: Klarte ikke preloade ressursjer...',

    "Application API error" : 'Applikasjon API Feil',
    "Application {0} failed to perform operation '{1}'" : "Applikasjonen {0} klarte ikke utføre operasjon '{1}'",

    // helpers.js
    "The requested file MIME is not accepted by this application." : 'Denne applikasjonen støtter ikke filer med denne MIME-typen',
    'Fatal error on open file!' : 'Fatal feil under åpning av fil!',
    "Failed to open file: {0}" : 'Klarte ikke åpne filen: {0}',
    'Fatal error on save file!' : 'Fatal feil under lagring av fil!',
    "Failed to save file: {0}" : 'Klarte ikke lagre filen: {1}',

    // dialogs.js
    "Choose Application" : 'Velg Applikasjon',
    "Choose an application to open" : 'Velg en applikasjon for åpning',
    "You need to select an application" : 'Du må velge en applikasjon',
    'Use as default application for {0}' : 'Bruk som standard for {0}',
    "File Operation Progress" : 'Fil-operasjon status',
    'Upload file to <span>{0}</span>.<br />Maximum size: {1} bytes' : 'Last opp til <span>{0}</span>.<br />Maks størrelse: {1} bytes',
    "Upload Dialog" : 'Opplasting dialog',
    "Uploading file..." : 'Laster opp fil...',
    "Uploading '{0}' ({1} {2}) to {3}" : "Laster opp '{0}' ({1} {2}) til {3}",
    "Upload failed" : 'Opplasting feilet',
    "The upload has failed" : 'Opplastingen har feilet',
    "Reason unknown..." : 'Ukjent årsak...',
    "Cancelled by user..." : 'Avbrutt av bruker...',
    "FileDialog Error" : 'Fil Dialog Feil',
    "Failed listing directory '{0}' because an error occured" : "Klarte ikke liste mappen '{0}' fordi en feil oppstod",
    "Are you sure you want to overwrite the file '{0}'?" : "Er du sikker på at du vil overskrive filen '{0}'?",
    "The file '{0}' already exists. Overwrite?" : "Filen '{0}' finnes allerede. Overskrive?",
    'You need to select a file or enter new filename!' : 'Du må velge en fil eller skrive inn et navn!',
    'You need to select a file!' : 'Du må velge en fil!',
    "File Information" : 'Fil-informasjon',
    "Loading file information for: {0}" : 'Laster fil-informasjon for: {0}',
    "FileInformationDialog Error" : 'File-informasjon Dialog Feil',
    "Failed to get file information for <span>{0}</span>" : "Klarte ikke hente fil-informasjon for <span>{0}</span>",
    "Failed to get file information for: {0}" : 'Klarte ikke hente fil-informasjon for: {0}',
    "Alert Dialog" : 'Advarsel Dialog',
    "Confirm Dialog" : 'Konfirmasjons-dialog',
    "Input Dialog" : 'Inndata-dialog',
    "Color Dialog" : 'Farge-dialog',
    'Red: {0}' : 'Rød: {0}',
    'Green: {0}' : 'Grønn: {0}',
    'Blue: {0}' : 'Blå: {0}',
    'Alpha: {0}' : 'Alpha: {0}',
    "Font Dialog" : 'Skriftype-dialog',

    // Common
    'Loading...' : 'Laster...',
    'Message' : 'Melding',
    'Summary' : 'Oppsummering',
    'Trace' : 'Trace',
    'Name' : 'Navn',
    "Save" : 'Lagre',
    "Open" : 'Åpne',
    "Close" : 'Lukk',
    'Cancel' : 'Avbryt',
    'OK' : 'OK',
    'Filename' : 'Filnavn',
    'Type' : 'Type',
    'MIME' : 'MIME',
    'Path' : 'Sti',
    'Size' : 'Størrelse'
  };

  /**
   * German
   */
  Locales.de_DE = {

  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Locale.Strings = Locales[DefaultLocale];

  /**
   * Translate given string
   * @param  String   s     Translation key/string
   * @param  Mixed    ...   Format values
   * @return String
   */
  OSjs._ = function() {
    var s = arguments[0];
    var a = arguments;
    a[0] = Locales[CurrentLocale][s] || s;

    return a.length > 1 ? OSjs.Utils.format.apply(null, a) : a[0];
  };

  /**
   * Get current locale
   * @return String
   */
  OSjs.Locale.getLocale = function() {
    return CurrentLocale;
  };

  /**
   * Set locale
   * @param  String   s     Locale name
   * @return void
   */
  OSjs.Locale.setLocale = function(l) {
    if ( Locales[l] ) {
      CurrentLocale = l;
    } else {
      CurrentLocale = DefaultLocale;
    }

    OSjs.Locale.Strings = Locales[CurrentLocale];
  };

})();
