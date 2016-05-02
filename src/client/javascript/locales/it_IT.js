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

  OSjs.Locales.it_IT = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Errore durante l\'apertura del file',
    'ERR_WM_NOT_RUNNING'        : 'Windows manager non in esecuzione',
    'ERR_FILE_OPEN_FMT'         : 'Il file \'**{0}**\' non può essere aperto',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Nessuna applicazione che supporta il tipo di file \'{0}\' è stata trovata',
    'ERR_APP_LAUNCH_FAILED'     : 'Avvio Applicazione fallito',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Si è verificato un errore durante l\'avvio di : {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Applicazione \'{0}\' construct failed: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Applicazione \'{0}\', init() fallito: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Applicazione resources missing for \'{0}\' or it failed to load!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Applicazione \'{0}\' preloading failed: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'L\' Applicazione \'{0}\' è già stata lanciata, ed è permessa una sola istanza!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Avvio di \'{0}\' fallito. Manifesto dell\'applicazione non trovato',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Avvio di \'{0}\' fallito. il tuo browser non supporta: {1}',

    'ERR_NO_WM_RUNNING'         : 'Nessun window manager in esecuzione',
    'ERR_CORE_INIT_FAILED'      : 'Inizializzazione OS.js fallita',
    'ERR_CORE_INIT_FAILED_DESC' : 'Si è verificato un errore nella Inizializzazione di OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'Impossibile avviare OS.js: Nessun window manager settato!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'Impossibile avviare OS.js: Fallito avvio del window manager: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'Impossibile avviare OS.js: Precaricamento risorse fallito...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript Error Report',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Si è verificato un errore inaspettato, forse un bug.',

    'ERR_APP_API_ERROR'           : 'Application API error',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'L\'Applicazione {0} ha fallito nell\'eseguire l\'operazine \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Argomento mancante: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Errore sconosciuto',

    'ERR_OPERATION_TIMEOUT'       : 'Operation Timeout',
    'ERR_OPERATION_TIMEOUT_FMT'   : 'Operation Timeout ({0})',

    'ERR_ARGUMENT_FMT'    : '\'{0}\' prevede \'{1}\' di tipo \'{2}\', \'{3}\' ricevuto',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Hai già dato un nome alla finestra \'{0}\'',
    'WINDOW_MINIMIZE' : 'Minimizza',
    'WINDOW_MAXIMIZE' : 'Massimizza',
    'WINDOW_RESTORE'  : 'Ripristina',
    'WINDOW_CLOSE'    : 'Chiudi',
    'WINDOW_ONTOP_ON' : 'Primopiano (Abilita)',
    'WINDOW_ONTOP_OFF': 'Primopiano (Disabilita)',

    // Handler
    'TITLE_SIGN_OUT' : 'Disconnetti',
    'TITLE_SIGNED_IN_AS_FMT' : 'Connesso come: {0}',
    'ERR_LOGIN_FMT' : 'Errore di accesso: {0}',
    'ERR_LOGIN_INVALID' : 'Accesso non corretto',

    // SESSION
    'MSG_SESSION_WARNING' : 'Sei sicuro di voler chiudere OS.js? Ogni settaggio ed ogni dato non salvato andrà perduto!',

    // Service
    'BUGREPORT_MSG' : 'Per piacere, fai un report se pensi che questo sia un bug. \nIncludi una breve descrizione di come l\'errore si è verificato, se possibile come replicarlo.',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Connesso al servizio esterno: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Errore Fatale!',
    'ERR_UTILS_XHR_FMT' : 'Errore AJAX/XHR: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Disconetti (Esci)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Disconnessione utente \'{0}\'.\nVuoi salvare la sessinoe corrente?',

    'DIALOG_CLOSE' : 'Chiudi',
    'DIALOG_CANCEL': 'Cancella',
    'DIALOG_APPLY' : 'Applica',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'Attenzione!',

    'DIALOG_COLOR_TITLE' : 'Scegli colori',
    'DIALOG_COLOR_R' : 'Rosso: {0}',
    'DIALOG_COLOR_G' : 'Verde: {0}',
    'DIALOG_COLOR_B' : 'Blue: {0}',
    'DIALOG_COLOR_A' : 'Alpha: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Conferma scelta',

    'DIALOG_ERROR_MESSAGE'   : 'Messaggio',
    'DIALOG_ERROR_SUMMARY'   : 'Sommario',
    'DIALOG_ERROR_TRACE'     : 'Stack dell\'errore',
    'DIALOG_ERROR_BUGREPORT' : 'Segnala Bug',

    'DIALOG_FILE_SAVE'      : 'Salva',
    'DIALOG_FILE_OPEN'      : 'Open',
    'DIALOG_FILE_MKDIR'     : 'Nuova Cartella',
    'DIALOG_FILE_MKDIR_MSG' : 'Crea una nuova cartella in **{0}**',
    'DIALOG_FILE_OVERWRITE' : 'Sei sicuro di voler sovrascrivere il file \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Mostra tipo',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Visualizzazione a lista',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Visualizzazione ad albero',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Visualizzazione ad icone',
    'DIALOG_FILE_ERROR'        : 'FileDialog Errore',
    'DIALOG_FILE_ERROR_SCANDIR': 'Indicizzazione cartella \'{0}\' fallito, perchè si è verificato un errore!',
    'DIALOG_FILE_MISSING_FILENAME' : 'Devi selezionare un file o fornire un nuovo nome!',
    'DIALOG_FILE_MISSING_SELECTION': 'Devi selezionare un file!',

    'DIALOG_FILEINFO_TITLE'   : 'Informazioni file',
    'DIALOG_FILEINFO_LOADING' : 'Caricamento informazioni file: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Errore FileInformationDialog',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Recupero informazioni fallito **{0}**',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Recupero infomazioni file fallito: {0}',

    'DIALOG_INPUT_TITLE' : 'Richiesta di inserimento',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Operazione file in corso',
    'DIALOG_FILEPROGRESS_LOADING' : 'Caricamento...',

    'DIALOG_UPLOAD_TITLE'   : 'Caricamento',
    'DIALOG_UPLOAD_DESC'    : 'Carimento del filo a **{0}**.<br />Dimensione massima: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : 'Caricamento \'{0}\' ({1} {2}) a {3}',
    'DIALOG_UPLOAD_MSG'     : 'Caricamento file...',
    'DIALOG_UPLOAD_FAILED'  : 'Caricamento fallito',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Il caricamentoè fallito',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Ragione sconociuta...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Cancellato dall\'utente...',
    'DIALOG_UPLOAD_TOO_BIG': 'Dimensione file troppo grande',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Dimensione del file troppo grande, in eccesso {0}',

    'DIALOG_FONT_TITLE' : 'Scelta Font',

    'DIALOG_APPCHOOSER_TITLE' : 'Scegli Applicazione',
    'DIALOG_APPCHOOSER_MSG'   : 'Scegli un applicazione da aprire',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Devi selezionare un applicazione',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Usa l\'applicazione predefinita per {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'Modulo GoogleAPI non configurato o disabilitato',
    'GAPI_SIGN_OUT'           : 'Disconnettiti da Google API Services',
    'GAPI_REVOKE'             : 'Revoca i permessi e disconnetti',
    'GAPI_AUTH_FAILURE'       : 'L\'Autenticazione alla Google API fallito o non avvenuto',
    'GAPI_AUTH_FAILURE_FMT'   : 'Autenticazione fallita: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Caricamento Google API fallito',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Windows Live API module non configurato o disabilitato',
    'WLAPI_SIGN_OUT'          : 'Disconnetti da  Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'Caricamento Windows Live API fallito',
    'WLAPI_LOGIN_FAILED'      : 'Connessione a Windows Live API fallita',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Connessione a Windows Live API fallito: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API returned {0} status',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Impossibile creare IndexedDB senza un nome database',
    'IDB_NO_SUCH_ITEM'   : 'Nessun elemento',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Errore fatale',
    'ERR_VFS_UNAVAILABLE'     : 'No disponibile',
    'ERR_VFS_FILE_ARGS'       : 'Il file richiede almeno un argumento',
    'ERR_VFS_NUM_ARGS'        : 'Non abbastanza argomenti',
    'ERR_VFS_EXPECT_FILE'     : 'File-object previsto',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Sorgente file-object prevista',
    'ERR_VFS_EXPECT_DST_FILE' : 'Destinazion file-object prevista',
    'ERR_VFS_FILE_EXISTS'     : 'Destinazione già esistente',
    'ERR_VFS_TRANSFER_FMT'    : 'Un errore si è verificato durante il trasferimento tra le memorie: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Impossibile caricare un file senza una destinazione',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Impossibile caricare senza definire un file',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Carimento file fallito: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Caricamento file cancellato',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Impossibile scaricare una destinazione senza una destinazione',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Si è verificato un errore durante il download: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'La risposta era vuota',

    'ERR_VFSMODULE_INVALID'            : 'Modulo VFS Invalido',
    'ERR_VFSMODULE_INVALID_FMT'        : 'Modulo VFS Invalido: {0}',
    'ERR_VFSMODULE_INVALID_METHOD'     : 'Metodo VFS Invalido',
    'ERR_VFSMODULE_INVALID_METHOD_FMT' : 'Metodo VFS Invalido: {0}',
    'ERR_VFSMODULE_INVALID_TYPE'       : 'Modulo VFS tipo non valido',
    'ERR_VFSMODULE_INVALID_TYPE_FMT'   : 'Modulo VFS tipo non valido: {0}',
    'ERR_VFSMODULE_INVALID_CONFIG'     : 'Modulo VFS configurazione non valida',
    'ERR_VFSMODULE_INVALID_CONFIG_FMT' : 'Modulo VFS configurazione non valida: {0}',
    'ERR_VFSMODULE_ALREADY_MOUNTED'    : 'Modulo VFS già montato',
    'ERR_VFSMODULE_ALREADY_MOUNTED_FMT': 'Modulo VFS \'{0}\' già montato',
    'ERR_VFSMODULE_NOT_MOUNTED'        : 'Modulo VFS non montato',
    'ERR_VFSMODULE_NOT_MOUNTED_FMT'    : 'Modulo VFS \'{0}\' non montato',
    'ERR_VFSMODULE_EXCEPTION'          : 'Modulo VFS Eccezione',
    'ERR_VFSMODULE_EXCEPTION_FMT'      : 'Modulo VFS Eccezione: {0}',
    'ERR_VFSMODULE_NOT_FOUND_FMT'      : 'Nessun modulo VFS associato con {0}. Desinazione o formato sbagliato?',

    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Download file',

    'ERR_VFSMODULE_XHR_ERROR'      : 'Errore XHR',
    'ERR_VFSMODULE_ROOT_ID'        : 'ID cartella root non trovato',
    'ERR_VFSMODULE_NOSUCH'         : 'Il file non esiste',
    'ERR_VFSMODULE_PARENT'         : 'Nessun parente',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Cartella parente non trovata: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Scansione cartella fallito',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Scansione cartella fallito: {0}',
    'ERR_VFSMODULE_READ'           : 'Lettura file fallito',
    'ERR_VFSMODULE_READ_FMT'       : 'Lettura file fallito: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Scrittura file fallita',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Scrittura file fallita: {0}',
    'ERR_VFSMODULE_COPY'           : 'Copiatura fallita',
    'ERR_VFSMODULE_COPY_FMT'       : 'Copiatura fallita: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Unlink file fallito',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Unlink file fallito: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Spostamento file fallito',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Spostamento file fallito: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Verifica esistenza file fallita',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Verifica esistenza file fallita: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Recupero informazioni file fallito',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Recupero informazioni file fallito: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Creazione cartella fallito',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Creazione cartella fallito: {0}',
    'ERR_VFSMODULE_URL'            : 'Recupero URL file fallito',
    'ERR_VFSMODULE_URL_FMT'        : 'Recupero URL file fallito: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Spostamento file nel cestino fallito',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Spostamento file nel cestino fallito: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Spostamento del file fuori dal cestino fallito',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Spostamento del file fuori dal cestino fallito: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Svuotamento cestino fallito',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Svuotamento cestino fallito: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Sei connesso a Dropbox API',
    'DROPBOX_SIGN_OUT'           : 'Disconnetti Google API Services',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Risoluzione percorso fallita: elemento non trovato',

    // ZIP
    'ZIP_PRELOAD_FAIL'  : 'Caricamento zip.js fallito',
    'ZIP_VENDOR_FAIL'   : 'Libreria zip.js non trovata. L\'hai caricata correttamente?',
    'ZIP_NO_RESOURCE'   : 'Nessuna risorsa zip fornita',
    'ZIP_NO_PATH'       : 'Nessun percorso fornito',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'Percorso installazione pacchetto gia esistente. Impossibile continuare!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Impossibile aprire il file',
    'ERR_FILE_APP_OPEN_FMT'     : 'Impossibile aprire il file {0} perchè il mime {1} non è supportato',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Impossibile aprire il file {0}',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Impossibile salvare il file {0}',
    'ERR_GENERIC_APP_FMT'       : '{0} Application Error',
    'ERR_GENERIC_APP_ACTION_FMT': 'Esecuzione azione fallito \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Errore sconosciuto',
    'ERR_GENERIC_APP_REQUEST'   : 'Si è verificato un errore durante la risoluzione della richiesta',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Errore fatale: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Scarta cambiamenti?',
    'MSG_FILE_CHANGED'          : 'Il file è stato cambiato. Ricaricarlo?',
    'MSG_APPLICATION_WARNING'   : 'Avviso applicazione',
    'MSG_MIME_OVERRIDE'         : 'tipo del file "{0}" non supportato, si userà "{1}" al suo posto.',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Sconosciuto',
    'LBL_APPEARANCE'   : 'Aspetto',
    'LBL_USER'         : 'Utente',
    'LBL_NAME'         : 'Nome',
    'LBL_APPLY'        : 'Applica',
    'LBL_FILENAME'     : 'Nome file',
    'LBL_PATH'         : 'Percorso',
    'LBL_SIZE'         : 'Dimensione',
    'LBL_TYPE'         : 'Tipo',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Caricamento',
    'LBL_SETTINGS'     : 'Settaggi',
    'LBL_ADD_FILE'     : 'Aggiungi file',
    'LBL_COMMENT'      : 'Commenta',
    'LBL_ACCOUNT'      : 'Account',
    'LBL_CONNECT'      : 'Connetti',
    'LBL_ONLINE'       : 'Online',
    'LBL_OFFLINE'      : 'Offline',
    'LBL_AWAY'         : 'Non presente',
    'LBL_BUSY'         : 'Occupato',
    'LBL_CHAT'         : 'Chat',
    'LBL_HELP'         : 'Aiuto',
    'LBL_ABOUT'        : 'Riguardo a',
    'LBL_PANELS'       : 'Pannelli',
    'LBL_LOCALES'      : 'Localizzazioni',
    'LBL_THEME'        : 'Tema',
    'LBL_COLOR'        : 'Colore',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Terminal (kill)',
    'LBL_ALIVE'        : 'Mantieni (Alive)',
    'LBL_INDEX'        : 'Indice',
    'LBL_ADD'          : 'Aggiungi',
    'LBL_FONT'         : 'Font',
    'LBL_YES'          : 'Si',
    'LBL_NO'           : 'No',
    'LBL_CANCEL'       : 'Cancella',
    'LBL_TOP'          : 'Sopra',
    'LBL_LEFT'         : 'Sinistra',
    'LBL_RIGHT'        : 'Destra',
    'LBL_BOTTOM'       : 'Sotto',
    'LBL_CENTER'       : 'Centro',
    'LBL_FILE'         : 'File',
    'LBL_NEW'          : 'Nuovo',
    'LBL_OPEN'         : 'Apri',
    'LBL_SAVE'         : 'Salva',
    'LBL_SAVEAS'       : 'Salva come...',
    'LBL_CLOSE'        : 'Chiudi',
    'LBL_MKDIR'        : 'Crea cartella',
    'LBL_UPLOAD'       : 'Carica',
    'LBL_VIEW'         : 'Visualizza',
    'LBL_EDIT'         : 'Modifica',
    'LBL_RENAME'       : 'Rinomina',
    'LBL_DELETE'       : 'Cancella',
    'LBL_OPENWITH'     : 'Apri con...',
    'LBL_ICONVIEW'     : 'Visualizzazione ad Icone',
    'LBL_TREEVIEW'     : 'Visualizzazione ad Albero',
    'LBL_LISTVIEW'     : 'Visualizzazione ad Lista',
    'LBL_REFRESH'      : 'Aggiorna',
    'LBL_VIEWTYPE'     : 'Visualizza tipo',
    'LBL_BOLD'         : 'Grassetto',
    'LBL_ITALIC'       : 'Corsivo',
    'LBL_UNDERLINE'    : 'Sottolineato',
    'LBL_REGULAR'      : 'Regolare',
    'LBL_STRIKE'       : 'Strike',
    'LBL_INDENT'       : 'Indenta',
    'LBL_OUTDENT'      : 'Unindenta',
    'LBL_UNDO'         : 'Torna indietro',
    'LBL_REDO'         : 'Vai avanti',
    'LBL_CUT'          : 'Taglia',
    'LBL_UNLINK'       : 'Rimuovi link',
    'LBL_COPY'         : 'Copia',
    'LBL_PASTE'        : 'Incolla',
    'LBL_INSERT'       : 'Inserisci',
    'LBL_IMAGE'        : 'Immaggine',
    'LBL_LINK'         : 'Link',
    'LBL_DISCONNECT'    : 'Disconnetti',
    'LBL_APPLICATIONS'  : 'Applicazioni',
    'LBL_ADD_FOLDER'    : 'Aggiungi cartella',
    'LBL_INFORMATION'   : 'Informazione',
    'LBL_TEXT_COLOR'    : 'Colore testo',
    'LBL_BACK_COLOR'    : 'Colore in secondo piano',
    'LBL_RESET_DEFAULT' : 'Resetta ai valori predefiniti',
    'LBL_DOWNLOAD_COMP' : 'Scarica sul computer',
    'LBL_ORDERED_LIST'  : 'Lista ordinata',
    'LBL_BACKGROUND_IMAGE' : 'Immagine di sfondo',
    'LBL_BACKGROUND_COLOR' : 'Colore di sfondo',
    'LBL_UNORDERED_LIST'   : 'Lista non ordinata',
    'LBL_STATUS'   : 'Stato',
    'LBL_READONLY' : 'Di sola lettura',
    'LBL_CREATED' : 'Creato',
    'LBL_MODIFIED' : 'Modificato',
    'LBL_SHOW_COLUMNS' : 'Mostra colonne',
    'LBL_MOVE' : 'Muovi',
    'LBL_OPTIONS' : 'Opzioni',
    'LBL_OK' : 'OK',
    'LBL_DIRECTORY' : 'Cartella',
    'LBL_CREATE' : 'Crea',
    'LBL_BUGREPORT' : 'Segnalazione bug',
    'LBL_INSTALL' : 'Installa',
    'LBL_UPDATE' : 'Aggiorna',
    'LBL_REMOVE' : 'Rimuovi',
    'LBL_SHOW_SIDEBAR' : 'Mostra barra laterale',
    'LBL_SHOW_NAVIGATION' : 'Mostra navigazione',
    'LBL_SHOW_HIDDENFILES' : 'Mostra file nascosti',
    'LBL_SHOW_FILEEXTENSIONS' : 'Mostra le estenzioni dei file',
    'LBL_MOUNT': 'Monta',
    'LBL_DESCRIPTION': 'Descrizione',
    'LBL_USERNAME': 'Nome utente',
    'LBL_PASSWORD': 'Password',
    'LBL_HOST': 'Host',
    'LBL_NAMESPACE': 'Namespace'

  };

})();
