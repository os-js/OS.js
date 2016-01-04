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

  OSjs.Locales.sh_SP = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Došlo je do greške prilikom otvaranja fajla',
    'ERR_WM_NOT_RUNNING'        : 'Menadžer ekrana nije pokrenut',
    'ERR_FILE_OPEN_FMT'         : 'Fajl \'**{0}**\' nije moguće otvoriti',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Nemoguće pronaći aplikaciju za podršku \'{0}\' fajlova',
    'ERR_APP_LAUNCH_FAILED'     : 'Došlo je do greške prilikom pokretanja aplikacije.',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Došlo je do greške prilikom pokretanja: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Aplikacija \'{0}\' construct nije uspio: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Aplikacija \'{0}\' init() nije uspio: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Nedostaju resursi za \'{0}\' ili nije upsjelo da učita!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Application \'{0}\' preloading failed: \n{1}', //TODO
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'Aplikacija \'{0}\' je već pokrenuta i dozvoljava samo jednu instancu!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Neuspjelo pokretanje \'{0}\' nije uspjelo. Manifestacija aplikacije nije pronađena!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Neuspjelo pokretanje \'{0}\'. Vaš pretraživač ne podržava: {1}',

    'ERR_NO_WM_RUNNING'         : 'Nema menadžera ekrana pokrenutih',
    'ERR_CORE_INIT_FAILED'      : 'Neuspjela inicijalizacija OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'Došlo je do greške prilikom inicijalizacije OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'Nije moguće pokrenuti OS.js: Nije definisan menadžer ekrana!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'Nije moguće pokrenuti OS.js: Pokretanje menadžera ekrana nije uspjelo: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'Nije moguće pokrenuti OS.js: Nije uspjelo učitavanje resursa...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript greška',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Došlo je do neočekivane greške. Možda je greška.',

    'ERR_APP_API_ERROR'           : 'Greška u aplikacijskom API-u',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Aplikacije {0} nije uspjela da izvrši operaciju \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Nedostaje argument: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Nepoznata greška',

    'ERR_OPERATION_TIMEOUT'       : 'Operation Timeout', //TODO
    'ERR_OPERATION_TIMEOUT_FMT'   : 'Operation Timeout ({0})', //TODO

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Već imate prozor sa nazivom \'{0}\'',
    'WINDOW_MINIMIZE' : 'Minimiziraj',
    'WINDOW_MAXIMIZE' : 'Maksimiziraj',
    'WINDOW_RESTORE'  : 'Povrati',
    'WINDOW_CLOSE'    : 'Zatvori',
    'WINDOW_ONTOP_ON' : 'Na vrhu (Uključeno)',
    'WINDOW_ONTOP_OFF': 'Na vrhu (Isključeno)',

    // Handler
    'TITLE_SIGN_OUT' : 'Odjavi se',
    'TITLE_SIGNED_IN_AS_FMT' : 'Prijavi se kao: {0}',

    // SESSION
    'MSG_SESSION_WARNING' : 'Da li ste sigurni da želite da ugasite OS.js? Svi nesačuvani programi i podatci će biti obrisani!',

    // Service
    'BUGREPORT_MSG' : 'Molimo Vas da prijavite ovo ako mislite da je greška.\nNapišite kratki opis kako je došlo do greške i ako možete kako ju zaobići',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Prijavljeni u eksterne servise: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Kobna greška',
    'ERR_UTILS_XHR_FMT' : 'AJAX/XHR greška: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Odjavi se (Izlaz)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Odjavljivanje korisnika \'{0}\'.\nDa li želite da sačuvate trenutnu sesiju?',

    'DIALOG_CLOSE' : 'Zatvori',
    'DIALOG_CANCEL': 'Odustani',
    'DIALOG_APPLY' : 'Primjeni',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'Prozor upozorenja',

    'DIALOG_COLOR_TITLE' : 'Prozor boja',
    'DIALOG_COLOR_R' : 'Crvena: {0}',
    'DIALOG_COLOR_G' : 'Zelena: {0}',
    'DIALOG_COLOR_B' : 'Plava: {0}',
    'DIALOG_COLOR_A' : 'Alfa: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Prozot potvrde',

    'DIALOG_ERROR_MESSAGE'   : 'Poruka',
    'DIALOG_ERROR_SUMMARY'   : 'Summary', //TODO
    'DIALOG_ERROR_TRACE'     : 'Trace',
    'DIALOG_ERROR_BUGREPORT' : 'Prijavite grešku',

    'DIALOG_FILE_SAVE'      : 'Sačuvaj',
    'DIALOG_FILE_OPEN'      : 'Otvori',
    'DIALOG_FILE_MKDIR'     : 'Novi folder',
    'DIALOG_FILE_MKDIR_MSG' : 'Napravite novi folder u **{0}**',
    'DIALOG_FILE_OVERWRITE' : 'Da li ste sigurni da želite prepisati fajl \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Tip prikaza',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Prikaz lista',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Prikaz drvo',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Prikaz ikonica',
    'DIALOG_FILE_ERROR'        : 'FileDialog greška', //TODO
    'DIALOG_FILE_ERROR_SCANDIR': 'Došlo je do greške prilikom izlistavanja \'{0}\'',
    'DIALOG_FILE_MISSING_FILENAME' : 'Morate odabrati fajl ili unijeti novo ime fajla!',
    'DIALOG_FILE_MISSING_SELECTION': 'Morate odabrati fajl!',

    'DIALOG_FILEINFO_TITLE'   : 'Informacije o fajlu',
    'DIALOG_FILEINFO_LOADING' : 'Učitavanje informacija za: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'FileInformationDialog Error', //TODO
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Došlo je do greške prilikom traženja informacija za **{0}**',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Došlo je do greške prilikom traženja informacija za: {0}',

    'DIALOG_INPUT_TITLE' : 'Prozor za unos',

    'DIALOG_FILEPROGRESS_TITLE'   : 'File Operation Progress', //TODO
    'DIALOG_FILEPROGRESS_LOADING' : 'Učitavanje...',

    'DIALOG_UPLOAD_TITLE'   : 'Prozor za dodavanje fajla', 
    'DIALOG_UPLOAD_DESC'    : 'Dodajte fajl u **{0}**.<br />Maksimalna veličina: {1} bajtova',
    'DIALOG_UPLOAD_MSG_FMT' : 'Dodavanje \'{0}\' ({1} {2}) do {3}',
    'DIALOG_UPLOAD_MSG'     : 'Dodavanje fajla...',
    'DIALOG_UPLOAD_FAILED'  : 'Dodavanje nije uspjelo',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Došlo je do greške prilikom dodavanja',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Razlog nepoznat...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Otkazano od strane korisnika...',
    'DIALOG_UPLOAD_TOO_BIG': 'Fajl je prevelik',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Fajl je prevelik, prelazi veličinu za {0}',

    'DIALOG_FONT_TITLE' : 'Prozor fonta',

    'DIALOG_APPCHOOSER_TITLE' : 'Odaberite aplikaciju',
    'DIALOG_APPCHOOSER_MSG'   : 'Odaberite aplikaciju da otvorite',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Morate odabrati aplikaciju',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Koristite kao podrazumjevanu aplikaciju za {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPI Modul nije podešen ili je ugašen',
    'GAPI_SIGN_OUT'           : 'Odjavite se sa Google API servisa',
    'GAPI_REVOKE'             : 'Uklonite permisije i odjavite se',
    'GAPI_AUTH_FAILURE'       : 'Google API autentikacija nije uspjela ili se nije ni desila',
    'GAPI_AUTH_FAILURE_FMT'   : 'Greška prilikom autentikacije: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Došlo je do greške prilikom učitavanja Google API',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Windows Live API modul nije podešen ili je ugašen',
    'WLAPI_SIGN_OUT'          : 'Odjavite se sa Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'Greška prilikom učitavanja Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'Greška prilikom prijave na Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Greška prilikom prijave na Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API je vratio {0} status',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Nije moguće napraviti IndexedDB bez imena baze',
    'IDB_NO_SUCH_ITEM'   : 'Takva stavka ne postoji',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Kobna greška',
    'ERR_VFS_UNAVAILABLE'     : 'Nije dostupno',
    'ERR_VFS_FILE_ARGS'       : 'Fajl očekuje barem jedan argument',
    'ERR_VFS_NUM_ARGS'        : 'Nedovoljno argumenata',
    'ERR_VFS_EXPECT_FILE'     : 'Expects a file-object', //TODO
    'ERR_VFS_EXPECT_SRC_FILE' : 'Expects a source file-object', //TODO
    'ERR_VFS_EXPECT_DST_FILE' : 'Expects a destination file-object', //TODO
    'ERR_VFS_FILE_EXISTS'     : 'Destinacija već postoji',
    'ERR_VFS_TRANSFER_FMT'    : 'Došlo je do greške prilikom prenosa između skladišta: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Nije moguće dodati fajl bez destinacije',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Nije moguće dodati fajl bez ijednog definisanog fajla',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Dodavanja fajla nije uspjelo: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Dodavanje fajla otkazano',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Cannot download a path without a path', //TODO
    'ERR_VFS_DOWNLOAD_FAILED' : 'Došlo je do greške prilikom preuzimanja: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'Prazan odgovor',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Preuzimanje fajla',

    'ERR_VFSMODULE_XHR_ERROR'      : 'XHR greška',
    'ERR_VFSMODULE_ROOT_ID'        : 'Došlo je do greške prilikom pronalaženja root folder ID-a',
    'ERR_VFSMODULE_NOSUCH'         : 'Fajl ne postoji',
    'ERR_VFSMODULE_PARENT'         : 'No such parent', //TODO
    'ERR_VFSMODULE_PARENT_FMT'     : 'Failed to look up parent: {0}', //TODO
    'ERR_VFSMODULE_SCANDIR'        : 'Greška prilikom skeniranja foldera', 
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Greška prilikom skeniranja foldera: {0}',
    'ERR_VFSMODULE_READ'           : 'Greška prilikom čitanja fajla',
    'ERR_VFSMODULE_READ_FMT'       : 'Greška prilikom čitanja fajla: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Greška prilikom upisa u fajl',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Greška prilikom upisa u fajl: {0}',
    'ERR_VFSMODULE_COPY'           : 'Greška prilikom kopiranja',
    'ERR_VFSMODULE_COPY_FMT'       : 'Nije uspjelo kopiranje: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Greška prilikom brisanja fajla',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Greška prilikom brisanja fajla: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Greška prilikom premještanja fajla',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Greška prilikom premještanja fajla: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Greška prilikom provjere postojanja fajla',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Greška prilikom provjere postojanja fajla: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Greška prilikom pribavljanja informacija o fajlu',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Greška prilikom pribavljanja informacija o fajlu: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Greška prilikom kreiranja foldera',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Greška prilikom kreiranja foldera: {0}',
    'ERR_VFSMODULE_URL'            : 'Greška prilikom pribavljanja URL-a fajla',
    'ERR_VFSMODULE_URL_FMT'        : 'Greška prilikom pribavljanja URL-a fajla: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Greška prilikom prmještanja fajla u kantu',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Greška prilikom prmještanja fajla u kantu: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Greška prilikom premještanja fajla izvan kante',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Greška prilikom premještanja fajla izvan kante: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Greška prilikom pražnjenja kante',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Greška prilikom pražnjenja kante: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Prijavljeni ste na  Dropbox API',
    'DROPBOX_SIGN_OUT'           : 'Odjavise sa Google API Services',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Greška prilikom riješavanja putanje: stavka nije pronađena',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'Instalacioni direktorijum paketa već postoji. Nije moguće nastaviti!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Nije moguće otvoriti fajl',
    'ERR_FILE_APP_OPEN_FMT'     : 'Fajl {0} zbog tipa {1} koji nije podržan',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Fajl {0} nije moguće otvoriti',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Fajl {0} nije moguće sačuvati',
    'ERR_GENERIC_APP_FMT'       : '{0} Greška u aplikaciji',
    'ERR_GENERIC_APP_ACTION_FMT': 'Greška u izvršavanju \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Nepoznata greška',
    'ERR_GENERIC_APP_REQUEST'   : 'Došlo je do greške prilikom obrade vašeg zahtjeva',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Fatalna greška: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Odbaci izmjene?',
    'MSG_FILE_CHANGED'          : 'Fajl je promjenjen. Ponovo učitaj?',
    'MSG_APPLICATION_WARNING'   : 'Grška u aplikaciji',
    'MSG_MIME_OVERRIDE'         : 'Tip fajla "{0}" nije podržan, koristi se "{1}" umjesto njega.',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Nepoznat',
    'LBL_APPEARANCE'   : 'Izgled',
    'LBL_USER'         : 'Korisnik',
    'LBL_NAME'         : 'Ime',
    'LBL_APPLY'        : 'Primjeni',
    'LBL_FILENAME'     : 'Ime fajla',
    'LBL_PATH'         : 'Putanja',
    'LBL_SIZE'         : 'Veličina',
    'LBL_TYPE'         : 'Tip',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Učitavanje',
    'LBL_SETTINGS'     : 'Podešavanja',
    'LBL_ADD_FILE'     : 'Dodajte fajl',
    'LBL_COMMENT'      : 'Komentar',
    'LBL_ACCOUNT'      : 'Nalog',
    'LBL_CONNECT'      : 'Poveži se',
    'LBL_ONLINE'       : 'Na mreži',
    'LBL_OFFLINE'      : 'Van mreže',
    'LBL_AWAY'         : 'Odsutan',
    'LBL_BUSY'         : 'Zauzet',
    'LBL_CHAT'         : 'Ćaskanje',
    'LBL_HELP'         : 'Pomoć',
    'LBL_ABOUT'        : 'O',
    'LBL_PANELS'       : 'Paneli',
    'LBL_LOCALES'      : 'Jezici',
    'LBL_THEME'        : 'Teme',
    'LBL_COLOR'        : 'Boja',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Ubij',
    'LBL_ALIVE'        : 'Živ',
    'LBL_INDEX'        : 'Indeks',
    'LBL_ADD'          : 'Dodaj',
    'LBL_FONT'         : 'Font',
    'LBL_YES'          : 'Da',
    'LBL_NO'           : 'Ne',
    'LBL_CANCEL'       : 'Odustani',
    'LBL_TOP'          : 'Vrh',
    'LBL_LEFT'         : 'Lijevo',
    'LBL_RIGHT'        : 'Desno',
    'LBL_BOTTOM'       : 'Dole',
    'LBL_CENTER'       : 'Centar',
    'LBL_FILE'         : 'Fajl',
    'LBL_NEW'          : 'Novi',
    'LBL_OPEN'         : 'Otvori',
    'LBL_SAVE'         : 'Sačuvaj',
    'LBL_SAVEAS'       : 'Sačuvaj kao...',
    'LBL_CLOSE'        : 'Zatvori',
    'LBL_MKDIR'        : 'Napravi folder',
    'LBL_UPLOAD'       : 'Dodaj',
    'LBL_VIEW'         : 'Prikaz',
    'LBL_EDIT'         : 'Uredi',
    'LBL_RENAME'       : 'Preimenuj',
    'LBL_DELETE'       : 'Obriši',
    'LBL_OPENWITH'     : 'Otvori sa ...',
    'LBL_ICONVIEW'     : 'Prikaz ikona',
    'LBL_TREEVIEW'     : 'Prikaz drvo',
    'LBL_LISTVIEW'     : 'Prikaz lista',
    'LBL_REFRESH'      : 'Osvježi',
    'LBL_VIEWTYPE'     : 'Tip prikaza',
    'LBL_BOLD'         : 'Podebljano',
    'LBL_ITALIC'       : 'Nakošeno',
    'LBL_UNDERLINE'    : 'Podvučeno',
    'LBL_REGULAR'      : 'Regularno',
    'LBL_STRIKE'       : 'Prekriženo',
    'LBL_INDENT'       : 'Identovano',
    'LBL_OUTDENT'      : 'Zastarjelo',
    'LBL_UNDO'         : 'Korak nazad',
    'LBL_REDO'         : 'Korak naprijed',
    'LBL_CUT'          : 'Isjeci',
    'LBL_UNLINK'       : 'Prekini vezu',
    'LBL_COPY'         : 'Kopiraj',
    'LBL_PASTE'        : 'Zaljepi',
    'LBL_INSERT'       : 'Ubaci',
    'LBL_IMAGE'        : 'Slika',
    'LBL_LINK'         : 'Link',
    'LBL_DISCONNECT'    : 'Diskonektuj',
    'LBL_APPLICATIONS'  : 'Aplikacije',
    'LBL_ADD_FOLDER'    : 'Dodaj folder',
    'LBL_INFORMATION'   : 'Informacije',
    'LBL_TEXT_COLOR'    : 'Boja texta',
    'LBL_BACK_COLOR'    : 'Back Color', //TODO
    'LBL_RESET_DEFAULT' : 'Vrati na podrazumjevano',
    'LBL_DOWNLOAD_COMP' : 'Preuzmi u računar',
    'LBL_ORDERED_LIST'  : 'Sortirana lista',
    'LBL_BACKGROUND_IMAGE' : 'Pozadinska slika',
    'LBL_BACKGROUND_COLOR' : 'Boja pozadine',
    'LBL_UNORDERED_LIST'   : 'Nesortirana lista',
    'LBL_STATUS'   : 'Status',
    'LBL_READONLY' : 'Samo za čitanje',
    'LBL_CREATED' : 'Napravljeno',
    'LBL_MODIFIED' : 'Modifikovano',
    'LBL_SHOW_COLUMNS' : 'Prikaži kolone',
    'LBL_MOVE' : 'Premjesti',
    'LBL_OPTIONS' : 'Opcije',
    'LBL_OK' : 'OK',
    'LBL_DIRECTORY' : 'Direktorija',
    'LBL_CREATE' : 'Napravi',
    'LBL_BUGREPORT' : 'Bugreport',
    'LBL_INSTALL' : 'Instaliraj',
    'LBL_UPDATE' : 'Ažuriraj',
    'LBL_REMOVE' : 'Obriši'
  };

})();
