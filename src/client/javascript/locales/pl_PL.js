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
 */
(function() {
  'use strict';

  OSjs.Locales = OSjs.Locales || {};

  OSjs.Locales.pl_PL = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Błąd otwierania pliku',
    'ERR_WM_NOT_RUNNING'        : 'Menadżer okien nie jest włączony',
    'ERR_FILE_OPEN_FMT'         : 'Nie można otworzyć \'<span>{0}</span>\'',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Nie można znaleźć aplikacji wspierającej \'{0}\'',
    'ERR_APP_LAUNCH_FAILED'     : 'Błąd otwierania aplikacji',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Błąd podczas uruchamiania aplikacji: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Konstruowanie aplikacji \'{0}\' nie powiodło się: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'init() aplikacji \'{0}\' nie powiodło się: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Brakuje zasobów dla aplikacji \'{0}\' lub ładowanie nie powiodło się!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Wstępne ładowanie aplikacji \'{0}\' nie powiodło się: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'Aplikacja \'{0}\' została juz otwarta, a nie może być uruchomiona wielokrotnie!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Nie można otworzyć \'{0}\'. Nie znaleziono danych manifestu aplikacji!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Nie można otworzyć \'{0}\'. Twoja przeglądarka nie wspiera: {1}',

    'ERR_NO_WM_RUNNING'         : 'Menadżer okien nie został uruchomiony',
    'ERR_CORE_INIT_FAILED'      : 'Nie można zainicjalizować OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'Błąd podczas inicjalizacji OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'Nie można uruchomić OS.js: Nie wybrano Menadżera Okien!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'Nie można uruchomić OS.js: Błąd uruchamiania Menadżera Okien: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'Nie można uruchomić OS.js: Błąd przeładowywania plików...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'Błąd Javascript',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Nieznany błąd.',

    'ERR_APP_API_ERROR'           : 'Błąd API Aplikacji',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Aplikacja {0} nie może wykonać operacji \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Brakujący argument: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Nieznany błąd',

    'ERR_OPERATION_TIMEOUT'       : 'Przekroczono Czas Operacji',
    'ERR_OPERATION_TIMEOUT_FMT'   : 'Przekroczono Czas Operacji ({0})',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Masz już uruchomione Okno z nazwą \'{0}\'',
    'WINDOW_MINIMIZE' : 'Minimalizuj',
    'WINDOW_MAXIMIZE' : 'Maksymalizuj',
    'WINDOW_RESTORE'  : 'Przywroć',
    'WINDOW_CLOSE'    : 'Zamknij',
    'WINDOW_ONTOP_ON' : 'U Góry (Włączone)',
    'WINDOW_ONTOP_OFF': 'U Góry (Wyłączone)',

    // Handler
    'TITLE_SIGN_OUT' : 'Wyloguj',
    'TITLE_SIGNED_IN_AS_FMT' : 'Zalogowano jako: {0}',

    // SESSION
    'MSG_SESSION_WARNING' : 'Czy na pewno chcesz opuścić OS.js? Wszystkie niezapisane ustawienia i dane aplikacji zostaną utracone!',

    // Service
    'BUGREPORT_MSG' : 'Wyślij proszę raport błędu jesli uważasz, że jest to błąd.\nDołącz opis błędu',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Zalogowano w zewnętrznych serwisach: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Błąd krytyczny',
    'ERR_UTILS_XHR_FMT' : 'Błąd AJAX/XHR: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Wylogowywanie (Exit)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Wylogowywanie \'{0}\'.\nCzy chcesz zapisać sesję?',

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

    'DIALOG_CONFIRM_TITLE' : 'Potwierdź',

    'DIALOG_ERROR_MESSAGE'   : 'Wiadomość',
    'DIALOG_ERROR_SUMMARY'   : 'Podsumowanie',
    'DIALOG_ERROR_TRACE'     : 'Śledzenie',
    'DIALOG_ERROR_BUGREPORT' : 'Raport błędu',

    'DIALOG_FILE_SAVE'      : 'Zapisz',
    'DIALOG_FILE_OPEN'      : 'Otwórz',
    'DIALOG_FILE_MKDIR'     : 'Nowy folder',
    'DIALOG_FILE_MKDIR_MSG' : 'Nowy folder w <span>{0}</span>',
    'DIALOG_FILE_OVERWRITE' : 'Czy chcesz nadpisać plik \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Widok',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Lista',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Drzewo',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Ikony',
    'DIALOG_FILE_ERROR'        : 'Błąd okna dialogowego pliku',
    'DIALOG_FILE_ERROR_SCANDIR': 'Nie udało się wylistować katalogu \'{0}\' z powodu wystąpienia błędu',
    'DIALOG_FILE_MISSING_FILENAME' : 'Zaznacz plik albo wpisz nazwę nowego pliku!',
    'DIALOG_FILE_MISSING_SELECTION': 'Zaznacz plik!',

    'DIALOG_FILEINFO_TITLE'   : 'Informacje',
    'DIALOG_FILEINFO_LOADING' : 'Ładowanie informacji dla: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Błąd okna Informacji o pliku',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Nie udało się uzyskać informacji dla <span>{0}</span>',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Nie udało się uzyskać informacji dla: {0}',

    'DIALOG_INPUT_TITLE' : 'Wprowadzanie',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Postęp',
    'DIALOG_FILEPROGRESS_LOADING' : 'Ładowanie...',

    'DIALOG_UPLOAD_TITLE'   : 'Wysyłanie',
    'DIALOG_UPLOAD_DESC'    : 'Wysyłanie pliku do <span>{0}</span>.<br />Maksymalny rozmiar: {1} bitów',
    'DIALOG_UPLOAD_MSG_FMT' : 'Wysyłanie \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : 'Wysyłanie pliku...',
    'DIALOG_UPLOAD_FAILED'  : 'Błąd wywołania',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Wywołanie nie powiodło się',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Powód nieznany...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Anulowane przez użytkownika...',
    'DIALOG_UPLOAD_TOO_BIG': 'Plik jest za duży',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Plik jest za duży, przekracza {0}',

    'DIALOG_FONT_TITLE' : 'Czcionka',

    'DIALOG_APPCHOOSER_TITLE' : 'Wybierz aplikację',
    'DIALOG_APPCHOOSER_MSG'   : 'Wybierz aplikację do otwarcia',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Wybierz aplikację',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Używaj jako domyślną aplikację do {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'Moduł GoogleAPI jest nie skonfigurowany albo jest wyłączony',
    'GAPI_SIGN_OUT'           : 'Wyloguj z Serwisu Google API',
    'GAPI_REVOKE'             : 'Odwołaj uprawnienia i wyloguj',
    'GAPI_AUTH_FAILURE'       : 'Autentykacja Google API nie powiodła się lub nie miała miejsca',
    'GAPI_AUTH_FAILURE_FMT'   : 'Nie można uwierzytelnić: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Nie można załadować Google API',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Moduł Windows Live API nie jest skonfigurowany albo jest wyłączony',
    'WLAPI_SIGN_OUT'          : 'Wyloguj z Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'Nie można załadować Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'Nie można zalogować do Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Nie można zalogować do Windows Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API zwróciło status {0}',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Nie mozna utworzyć IndexedDB bez Nazwy Bazy Danych',
    'IDB_NO_SUCH_ITEM'   : 'Brak takiego elementu',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Błąd krytyczny',
    'ERR_VFS_UNAVAILABLE'     : 'Niedostępne',
    'ERR_VFS_FILE_ARGS'       : 'Plik oczekuje co najmniej jednego argumentu',
    'ERR_VFS_NUM_ARGS'        : 'Za mało argumentów',
    'ERR_VFS_EXPECT_FILE'     : 'Oczekuje obiektu-pliku',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Oczekuje źródłowego obiektu-pliku',
    'ERR_VFS_EXPECT_DST_FILE' : 'Oczekuje docelowego obiektu-pliku',
    'ERR_VFS_FILE_EXISTS'     : 'Plik docelowy istnieje',
    'ERR_VFS_TRANSFER_FMT'    : 'Wystąpił błąd podczas transferu pomiędzy magazynem: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Nie można wysłać pliku bez celu',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Nie można wysłać bez okreslenia plików',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Wysyłanie pliku: {0} nie powiodło się',
    'ERR_VFS_UPLOAD_CANCELLED': 'Wysyłanie pliku zostało anulowane',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Nie można pobrać ścieżki bez wskazania ścieżki',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Wystąpił błąd podczas pobierania: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'Odpowiedź była pusta',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Pobieranie pliku',

    'ERR_VFSMODULE_XHR_ERROR'      : 'Błąd XHR',
    'ERR_VFSMODULE_ROOT_ID'        : 'Nie odnaleziono id głównego folderu',
    'ERR_VFSMODULE_NOSUCH'         : 'Nie ma takiego pliku',
    'ERR_VFSMODULE_PARENT'         : 'Nie ma takiego rodzica',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Nie odnaleziono rodzica: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Nie udało się przeskanować folderu',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Nie udało się przeskanować folderu: {0}',
    'ERR_VFSMODULE_READ'           : 'Nie udało się odczytać pliku',
    'ERR_VFSMODULE_READ_FMT'       : 'Nie udało się odczytać pliku: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Nie udało się zapisać pliku',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Nie udało się zapisać pliku: {0}',
    'ERR_VFSMODULE_COPY'           : 'Nie można skopiować',
    'ERR_VFSMODULE_COPY_FMT'       : 'Kopiowanie: {0} nie powiodło się',
    'ERR_VFSMODULE_UNLINK'         : 'Nie można odlinkować pliku',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Odlinkowanie pliku: {0} nie powiodło się',
    'ERR_VFSMODULE_MOVE'           : 'Nie można przenieść',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Przenoszenie: {0} nie powiodło się',
    'ERR_VFSMODULE_EXIST'          : 'Nie udało się sprawdzić czy plik instnieje',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Nie udało się sprawdzić czy plik instnieje: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Nie udało się uzyskać informacji o pliku',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Nie udało się uzyskać informacji o pliku: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Nie można stworzyć folderu',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Tworzenie folderu: {0} nie powiodło się',
    'ERR_VFSMODULE_URL'            : 'Nie udało się uzyskać adresu URL pliku',
    'ERR_VFSMODULE_URL_FMT'        : 'Nie udało się uzyskać adresu URL pliku: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Nie udało się przenieść pliku do kosza',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Nie udało się przenieść pliku do kosza: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Nie udało się przenieść pliku z kosza',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Nie udało się przenieść pliku z kosza: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Nie udało się wyczyścić kosza',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Nie udało się wyczyścić kosza: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Jesteś zalogowany do Dropbox API',
    'DROPBOX_SIGN_OUT'           : 'Wylogowano z serwisu Dropbox API',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Nie znaleziono pozycji',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'Folder instalacyjny pakietów juz istnieje. Nie można kontynuować!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Nie można otworzyć',
    'ERR_FILE_APP_OPEN_FMT'     : 'Plik {0} nie może zostać otwarty ,ponieważ mime {1} nie jest wspierane',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Plik {0} nie może zostać otwarty',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Plik {0} nie może zostać zapisany',
    'ERR_GENERIC_APP_FMT'       : '{0} Błąd Aplikacji',
    'ERR_GENERIC_APP_ACTION_FMT': 'Nie udało się przeprowadzić akcji \'{0}\'.',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Nieznany błąd',
    'ERR_GENERIC_APP_REQUEST'   : 'Wystąpił błąd podczas obsługi żądania',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Błąd krytyczny: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Odrzucić zmiany?',
    'MSG_FILE_CHANGED'          : 'Plik został zmieniony. Przeładować?',
    'MSG_APPLICATION_WARNING'   : 'Ostrzeżenie Aplikacji',
    'MSG_MIME_OVERRIDE'         : 'Typ pliku  "{0}" nie jest wspierany, używając w zamian "{1}".',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Nieznany',
    'LBL_APPEARANCE'   : 'Wygląd',
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
    'LBL_ONLINE'       : 'Połączono',
    'LBL_OFFLINE'      : 'Rozłączono',
    'LBL_AWAY'         : 'Zaraz wracam',
    'LBL_BUSY'         : 'Zajęty',
    'LBL_CHAT'         : 'Chat',
    'LBL_HELP'         : 'Pomoc',
    'LBL_ABOUT'        : 'O',
    'LBL_PANELS'       : 'Panele',
    'LBL_LOCALES'      : 'Języki',
    'LBL_THEME'        : 'Motyw',
    'LBL_COLOR'        : 'Kolor',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Zabij',
    'LBL_ALIVE'        : 'Aktywne',
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
    'LBL_OPEN'         : 'Otwórz',
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
    'LBL_ICONVIEW'     : 'Ikony',
    'LBL_TREEVIEW'     : 'Drzewo',
    'LBL_LISTVIEW'     : 'Lista',
    'LBL_REFRESH'      : 'Odśwież',
    'LBL_VIEWTYPE'     : 'Typ widoku',
    'LBL_BOLD'         : 'Pogrubienie',
    'LBL_ITALIC'       : 'Kursywa',
    'LBL_UNDERLINE'    : 'Podkreślenie',
    'LBL_REGULAR'      : 'Regularne',
    'LBL_STRIKE'       : 'Przekreślenie',
    'LBL_INDENT'       : 'Wcięcie',
    'LBL_OUTDENT'      : 'Outdent',
    'LBL_UNDO'         : 'Cofnij',
    'LBL_REDO'         : 'Przywróć',
    'LBL_CUT'          : 'Wytnij',
    'LBL_UNLINK'       : 'Odlinkuj',
    'LBL_COPY'         : 'Kopiuj',
    'LBL_PASTE'        : 'Wklej',
    'LBL_INSERT'       : 'Wstaw',
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
    'LBL_ORDERED_LIST'  : 'Lista',
    'LBL_BACKGROUND_IMAGE' : 'Tapeta',
    'LBL_BACKGROUND_COLOR' : 'Kolor tła',
    'LBL_UNORDERED_LIST'   : 'Lista nieuporządkowana',
    'LBL_STATUS'   : 'Status',
    'LBL_READONLY' : 'Tylko-odczyt',
    'LBL_CREATED' : 'Utworzono',
    'LBL_MODIFIED' : 'Zmodyfikowano',
    'LBL_SHOW_COLUMNS' : 'Pokaż kolumny',
    'LBL_MOVE' : 'Przenieś',
    'LBL_OPTIONS' : 'Opcje',
    'LBL_OK' : 'OK',
    'LBL_DIRECTORY' : 'Folder',
    'LBL_CREATE' : 'Utwórz',
    'LBL_BUGREPORT' : 'Raport błędu',
    'LBL_INSTALL' : 'Instaluj',
    'LBL_UPDATE' : 'Aktualizuj',
    'LBL_REMOVE' : 'Usuń'
  };

})();
