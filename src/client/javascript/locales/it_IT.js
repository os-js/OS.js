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

    'ERR_FILE_OPEN'             : 'Errore nell\'apertura del file',
    'ERR_WM_NOT_RUNNING'        : 'Gestore finestre non in esecuzione',
    'ERR_FILE_OPEN_FMT'         : 'Il file \'**{0}**\' non può essere aperto',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Nessuna applicazione trovata con supporto a file \'{0}\'',
    'ERR_APP_LAUNCH_FAILED'     : 'Avvio applicazione fallito',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Si è verificato un errore all\'avvio di: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Applicazione \'{0}\' controllo fallito {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Applicatione \'{0}\' init() fallito: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Application resources missing for \'{0}\' or it failed to load!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Applicazione \'{0}\' precaricamento fallito: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'L\'applicazione \'{0}\' è già avviata ed è permessa una sola istanza!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Avvio fallito \'{0}\'. Manifesto applicazione non trovato!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Avvio fallito \'{0}\'. Il tuo browser non supporta: {1}',

    'ERR_NO_WM_RUNNING'         : 'Nessun Gestore Finestre in esecuzione',
    'ERR_CORE_INIT_FAILED'      : 'OS.js Inizializzazione fallita',
    'ERR_CORE_INIT_FAILED_DESC' : 'Si è verifica un errore nell\'inizializzazione di OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'Impossibile avviare OS.js: Nessun gestore di finestre definito!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'Impossbile avviare OS.js: Avvio gestore finestre fallito: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'Impossbile avviare OS.js: Precaricamento risorse fallito...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'Report errore javascript',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Si è verificato un errore imprevisto, forse un bug.',

    'ERR_APP_API_ERROR'           : 'Errore API applicazione',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Applicatione {0} ha fallito nell\'eseguire l\'operazione \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Argomento mancante: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Errore sconosciuto',

    'ERR_OPERATION_TIMEOUT'       : 'Operazione scaduta',
    'ERR_OPERATION_TIMEOUT_FMT'   : 'Operazione scaduta ({0})',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Esiste già una finestra chiamata \'{0}\'',
    'WINDOW_MINIMIZE' : 'Massimizza',
    'WINDOW_MAXIMIZE' : 'Minimizza',
    'WINDOW_RESTORE'  : 'Ripristina',
    'WINDOW_CLOSE'    : 'Chiudi',
    'WINDOW_ONTOP_ON' : 'In evidenza (Abilita)',
    'WINDOW_ONTOP_OFF': 'In evidenza (disabilita)',

    // Handler
    'TITLE_SIGN_OUT' : 'Esci',
    'TITLE_SIGNED_IN_AS_FMT' : 'Accesso effettuato come: {0}',

    // SESSION
    'MSG_SESSION_WARNING' : 'Sei sicuro di voler chiudere OS.js? Le configurazioni ed i dati non salvati verranno persi!',

    // Service
    'BUGREPORT_MSG' : 'Per favore segnala l\'errore se pensi sia un bug.\nIncludi una breve descrizione su come l\'errore si è verificato, se puoi anche come replicarlo',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Accesso effettuato su servizio esterno: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Errore fatale',
    'ERR_UTILS_XHR_FMT' : 'Errore AJAX/XHR: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Disconnetti (Esci)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Disconnessione utente \'{0}\'.\nVuoi salvare la sessione corrente?',

    'DIALOG_CLOSE' : 'Chiudi',
    'DIALOG_CANCEL': 'Cancella',
    'DIALOG_APPLY' : 'Applica',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'Attenzione',

    'DIALOG_COLOR_TITLE' : 'Colori',
    'DIALOG_COLOR_R' : 'Rosso: {0}',
    'DIALOG_COLOR_G' : 'Verde: {0}',
    'DIALOG_COLOR_B' : 'Blue: {0}',
    'DIALOG_COLOR_A' : 'Alpha: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Richiesta di conferma',

    'DIALOG_ERROR_MESSAGE'   : 'Messaggio',
    'DIALOG_ERROR_SUMMARY'   : 'Sommario',
    'DIALOG_ERROR_TRACE'     : 'Tracciamento',
    'DIALOG_ERROR_BUGREPORT' : 'Segnala errore',

    'DIALOG_FILE_SAVE'      : 'Salva',
    'DIALOG_FILE_OPEN'      : 'Apri',
    'DIALOG_FILE_MKDIR'     : 'Nuova Cartella',
    'DIALOG_FILE_MKDIR_MSG' : 'Crea una nuova cartella in **{0}**',
    'DIALOG_FILE_OVERWRITE' : 'Sei sicuro di vole sovrascrivere il file \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Mostra tipo',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Visualizza Lista',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Visualizza Albero',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Visualizza Icone',
    'DIALOG_FILE_ERROR'        : 'Errore FileDialog',
    'DIALOG_FILE_ERROR_SCANDIR': 'Elenco cartelle fallito \'{0}\' perchè si è verificato un errore',
    'DIALOG_FILE_MISSING_FILENAME' : 'Devi selezionare un file o inserire un nuovo nome del file!',
    'DIALOG_FILE_MISSING_SELECTION': 'Devi selezionare un file!',

    'DIALOG_FILEINFO_TITLE'   : 'Informazioni file',
    'DIALOG_FILEINFO_LOADING' : 'Caricamento informazioni file: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Error FileInformationDialog',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Recupero informazioni del file **{0}**  fallito',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Recupero informazioni fallito per file: {0}',

    'DIALOG_INPUT_TITLE' : 'Inserimento',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Operazione file in corso',
    'DIALOG_FILEPROGRESS_LOADING' : 'Caricamento...',

    'DIALOG_UPLOAD_TITLE'   : 'Informazioni caricamento',
    'DIALOG_UPLOAD_DESC'    : 'Caricamento file su **{0}**.<br />Grandezza file massima: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : 'Caricamento \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : 'Caricamento file...',
    'DIALOG_UPLOAD_FAILED'  : 'Caricamento fallito',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Il caricamento ha fallito',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Causa sconosciuta...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Cancellato dall\'utente...',
    'DIALOG_UPLOAD_TOO_BIG': 'Il file è troppo grande',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Il file è troppo grande, in eccesso {0}',

    'DIALOG_FONT_TITLE' : 'Font',

    'DIALOG_APPCHOOSER_TITLE' : 'Scegli applicatione',
    'DIALOG_APPCHOOSER_MSG'   : 'Scegli applicazione da aprire',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Devi selezionare un applicazione',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Usa come applicazione predefinita per {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'Modulo GoogleAPI non configurato o disabilitato',
    'GAPI_SIGN_OUT'           : 'Disconnetti da Google API Services',
    'GAPI_REVOKE'             : 'Revoca permessi e disconnetti',
    'GAPI_AUTH_FAILURE'       : 'Autenticazione a Google API ha fallito o non è avvenuta',
    'GAPI_AUTH_FAILURE_FMT'   : 'Autenticazione fallita: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Caricamento Google API fallito',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Modulo Windows Live API non configurato o disabilitato',
    'WLAPI_SIGN_OUT'          : 'Disconnetti da Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'Caricamento fallito Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'Autenticazione a Windows Live API fallita',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Autenticazione a Windows Live API fallita: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API returned {0} status',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Impossibile creare un IndexedDB senza un nome per il database',
    'IDB_NO_SUCH_ITEM'   : 'Nessun risultato',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Errore fatale',
    'ERR_VFS_UNAVAILABLE'     : 'Non disponibile',
    'ERR_VFS_FILE_ARGS'       : 'Il file richiede almeno un parametro',
    'ERR_VFS_NUM_ARGS'        : 'Parametri non sufficenti',
    'ERR_VFS_EXPECT_FILE'     : 'Richiede un file-object',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Richiede un file-object sorgente',
    'ERR_VFS_EXPECT_DST_FILE' : 'Richiede una file-object di destinazione',
    'ERR_VFS_FILE_EXISTS'     : 'Destinatione esistente',
    'ERR_VFS_TRANSFER_FMT'    : 'Si è verificato un errore durante il trasferimento tra le memorie: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Impossibile caricare un file senza la destinazione',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Impossibile caricare senza file definiti',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Caricamento file fallito: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Caricamento file cancellato',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Non posso caricare un percorso senza percorso',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Si è verifica errore durante il download: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'La risposta era vuota',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Scaricamento file',

    'ERR_VFSMODULE_XHR_ERROR'      : 'Errore XHR',
    'ERR_VFSMODULE_ROOT_ID'        : 'Ricerca id cartella root fallito',
    'ERR_VFSMODULE_NOSUCH'         : 'Il file non esiste',
    'ERR_VFSMODULE_PARENT'         : 'Parente non trovato',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Ricerca cartella parent fallita: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Scansine cartella fallito',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Scansione cartella fallito: {0}',
    'ERR_VFSMODULE_READ'           : 'Lettura file fallita',
    'ERR_VFSMODULE_READ_FMT'       : 'Lettura file fallita: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Scrittura file fallita',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Scrittura file fallita: {0}',
    'ERR_VFSMODULE_COPY'           : 'Copiatura fallita',
    'ERR_VFSMODULE_COPY_FMT'       : 'Copiatura fallita: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Rimozzione file fallita',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Rimozzione file fallita: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Spostamento file fallito',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Spostamento file fallito: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Controllo esistenza del file fallita',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Controllo esistenza del file fallita: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Recupero informazioni file fallito',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Recupero informazioni file fallito: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Creazione cartella fallito',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Creazione cartella fallito: {0}',
    'ERR_VFSMODULE_URL'            : 'Recupero URL file fallito',
    'ERR_VFSMODULE_URL_FMT'        : 'Recupero URL file fallito: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Spostamento file nel cestino fallito',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Spostamento file nel cestino fallito: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Recupero file dal cestino fallito',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Recupero file dal cestino fallito: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Svuotamento cestino fallito',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Svuotamento cestino fallito: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Sei authenticato nella Dropbox API',
    'DROPBOX_SIGN_OUT'           : 'Disconnessione dalla Google API Services',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Risoluzione percorso fallita: elemento non trovato',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'Percorso di installazione del pacchetto già esistente. Impossibile continuare!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Impossibile aprire il file',
    'ERR_FILE_APP_OPEN_FMT'     : 'Il file {0} non può essere aperto perchè il mime {1} non è supportato',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Il file {0} non può essere aperto',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Il file {0} non può essere salvato',
    'ERR_GENERIC_APP_FMT'       : '{0} Errore application',
    'ERR_GENERIC_APP_ACTION_FMT': 'Esecuzione azione fallito \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Errore sconosciuto',
    'ERR_GENERIC_APP_REQUEST'   : 'Si è verificato un errore durante la gestione della tua richiesta',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Errore fatale: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Scartare cambiamenti?',
    'MSG_FILE_CHANGED'          : 'Il file è cambiato, vuoi ricaricarlo?',
    'MSG_APPLICATION_WARNING'   : 'Avvertimento Applicazione',
    'MSG_MIME_OVERRIDE'         : 'Il tipe di file "{0}" non è supportato, verrà usato "{1}" al suo posto.',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Sconosciuto',
    'LBL_APPEARANCE'   : 'Aspetto',
    'LBL_USER'         : 'Utente',
    'LBL_NAME'         : 'Nome',
    'LBL_APPLY'        : 'Applica',
    'LBL_FILENAME'     : 'Nomefile',
    'LBL_PATH'         : 'Percorso',
    'LBL_SIZE'         : 'Dimensione',
    'LBL_TYPE'         : 'Tipo',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Caricamento',
    'LBL_SETTINGS'     : 'Settaggi',
    'LBL_ADD_FILE'     : 'Aggiungi file',
    'LBL_COMMENT'      : 'Commento',
    'LBL_ACCOUNT'      : 'Account',
    'LBL_CONNECT'      : 'Connetti',
    'LBL_ONLINE'       : 'Online',
    'LBL_OFFLINE'      : 'Offline',
    'LBL_AWAY'         : 'Non disponibile',
    'LBL_BUSY'         : 'Impegnato',
    'LBL_CHAT'         : 'Chat',
    'LBL_HELP'         : 'Aiuto',
    'LBL_ABOUT'        : 'Informazioni',
    'LBL_PANELS'       : 'Panelli',
    'LBL_LOCALES'      : 'Localizzazioni',
    'LBL_THEME'        : 'Temi',
    'LBL_COLOR'        : 'Colori',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Kill',
    'LBL_ALIVE'        : 'Alive',
    'LBL_INDEX'        : 'Indice',
    'LBL_ADD'          : 'Aggiungi',
    'LBL_FONT'         : 'Font',
    'LBL_YES'          : 'Si',
    'LBL_NO'           : 'No',
    'LBL_CANCEL'       : 'Cancella',
    'LBL_TOP'          : 'Superiore',
    'LBL_LEFT'         : 'Sinistra',
    'LBL_RIGHT'        : 'Destra',
    'LBL_BOTTOM'       : 'In fondo',
    'LBL_CENTER'       : 'Centro',
    'LBL_FILE'         : 'File',
    'LBL_NEW'          : 'Nuovo',
    'LBL_OPEN'         : 'Apri',
    'LBL_SAVE'         : 'Salva',
    'LBL_SAVEAS'       : 'Salva come...',
    'LBL_CLOSE'        : 'Chiudi',
    'LBL_MKDIR'        : 'Crea cartella',
    'LBL_UPLOAD'       : 'Carica',
    'LBL_VIEW'         : 'Mostra',
    'LBL_EDIT'         : 'Modifica',
    'LBL_RENAME'       : 'Rinomina',
    'LBL_DELETE'       : 'Rimuovi',
    'LBL_OPENWITH'     : 'Apri con ...',
    'LBL_ICONVIEW'     : 'Visualizzazione ad icone',
    'LBL_TREEVIEW'     : 'Visualizzazione ad albero',
    'LBL_LISTVIEW'     : 'Visualizzazione ad list',
    'LBL_REFRESH'      : 'Ricarica',
    'LBL_VIEWTYPE'     : 'Mostra tipo',
    'LBL_BOLD'         : 'Grassetto',
    'LBL_ITALIC'       : 'Corsivo',
    'LBL_UNDERLINE'    : 'Sottolineato',
    'LBL_REGULAR'      : 'Regolare',
    'LBL_STRIKE'       : 'Strike',
    'LBL_INDENT'       : 'Indenta',
    'LBL_OUTDENT'      : 'Scaduto',
    'LBL_UNDO'         : 'Annulla',
    'LBL_REDO'         : 'Ripeti',
    'LBL_CUT'          : 'Taglia',
    'LBL_UNLINK'       : 'Scollega',
    'LBL_COPY'         : 'Copia',
    'LBL_PASTE'        : 'Incolla',
    'LBL_INSERT'       : 'Inserisci',
    'LBL_IMAGE'        : 'Immagine',
    'LBL_LINK'         : 'Link',
    'LBL_DISCONNECT'    : 'Disconnetti',
    'LBL_APPLICATIONS'  : 'Applicazioni',
    'LBL_ADD_FOLDER'    : 'Aggiungi cartella',
    'LBL_INFORMATION'   : 'Informationi',
    'LBL_TEXT_COLOR'    : 'Colore Testo',
    'LBL_BACK_COLOR'    : 'Colore Evidenziatore',
    'LBL_RESET_DEFAULT' : 'Ripristina predefiniti',
    'LBL_DOWNLOAD_COMP' : 'Scarica sul computer',
    'LBL_ORDERED_LIST'  : 'Lista ordinata',
    'LBL_BACKGROUND_IMAGE' : 'Immagine di sfondo',
    'LBL_BACKGROUND_COLOR' : 'Colore sfondo',
    'LBL_UNORDERED_LIST'   : 'Lista non ordinata',
    'LBL_STATUS'   : 'Stato',
    'LBL_READONLY' : 'Sola-Lettura',
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
    'LBL_REMOVE' : 'Rimuovi'
  };

})();
