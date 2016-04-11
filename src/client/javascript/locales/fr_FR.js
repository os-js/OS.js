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
 * @author  Emersion <contact@emersion.fr>
 * @author  Emilien Raffaëlli <emilienraffaelli@hotmail.com>
 * @licence Simplified BSD License
 */
(function() {
  // jscs:disable validateQuoteMarks
  'use strict';

  OSjs.Locales = OSjs.Locales || {};

  OSjs.Locales.fr_FR = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Erreur lors de l\'ouverture du fichier',
    'ERR_WM_NOT_RUNNING'        : 'Le gestionnaire de fenêtre n\'est pas en cours d\'execution',
    'ERR_FILE_OPEN_FMT'         : 'Le fichier \'**{0}**\' n\'a pas pu être ouvert',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Impossible de trouver une application supportant les fichiers \'{0}\'',
    'ERR_APP_LAUNCH_FAILED'     : 'Impossible de lancer l\'application',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Une erreur est survenue lors du lancement de : {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Application \'{0}\' construct failed: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Application \'{0}\' init() failed: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Application resources missing for \'{0}\' or it failed to load!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Application \'{0}\' preloading failed: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'L\'application \'{0}\' est déjà lancée et n\'autorise qu\'une seule instance !',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Impossible de lancer \'{0}\'. Le manifeste de l\'application n\'a pas été trouvé !',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Impossible de lancer \'{0}\'. Votre navigateur ne supporte pas : {1}',

    'ERR_NO_WM_RUNNING'         : 'Le gestionnaire de fenêtres n\'est pas lancé',
    'ERR_CORE_INIT_FAILED'      : 'Impossible d\'initialiser OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'Une erreur est survenue lors de l\'initialisation de OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'Impossible de lancer OS.js: aucun gestionnaire de fenêtres défini !',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'Impossible de lancer OS.js: erreur lors du lancement du gestionnaire de fenêtres : {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'Impossible de lancer OS.js: impossible de précharger les ressources...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'Rapport d\'erreur Javascript',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Une erreur inconnue est survenue, peut-être un bug.',

    'ERR_APP_API_ERROR'           : 'Erreur de l\'API de l\'application',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'L\'pplication {0} n\'a pas pu exécuter l\'opération \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Argument manquant: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Erreur inconnue',

    'ERR_OPERATION_TIMEOUT'       : 'Operation Expirée',
    'ERR_OPERATION_TIMEOUT_FMT'   : 'Operation Expirée ({0})',
    
    'ERR_ARGUMENT_FMT'    : '\'{0}\' attends \'{1}\' d\'être \'{2}\', \'{3}\' fournie',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Une autre fenêtre porte déjà le nom \'{0}\'',
    'WINDOW_MINIMIZE' : 'Minimiser',
    'WINDOW_MAXIMIZE' : 'Maximiser',
    'WINDOW_RESTORE'  : 'Restaurer',
    'WINDOW_CLOSE'    : 'Fermer',
    'WINDOW_ONTOP_ON' : 'Au-dessus (activer)',
    'WINDOW_ONTOP_OFF': 'Au-dessous (désactiver)',

    // Handler
    'TITLE_SIGN_OUT' : 'Déconnexion',
    'TITLE_SIGNED_IN_AS_FMT' : 'Connecté en tant que: {0}',
    'ERR_LOGIN_FMT' : 'Erreur de connexion : {0}',
    'ERR_LOGIN_INVALID' : 'Identification invalide',

    // SESSION
    'MSG_SESSION_WARNING' : 'Êtes-vous sûr de vouloir quitter OS.js? Tous vos paramètres et vos données seront perdues!',

    // Service
    'BUGREPORT_MSG' : 'Veuillez reporter cela si vous pensez que c\'est un bug.\n Incluez une brève description de comment cela est arrivé et si vous le pouvez; comment le reproduire',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Loggué dans un service externe: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Erreur Fatale',
    'ERR_UTILS_XHR_FMT' : 'Erreure AJAX/XHR: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Déconnexion (quitter)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Déconnexion de l\'utilisateur \'{0}\'.\nVoulez-vous enregistrer votre session courante ?',

    'DIALOG_CLOSE' : 'Fermer',
    'DIALOG_CANCEL': 'Annuler',
    'DIALOG_APPLY' : 'Appliquer',
    'DIALOG_OK'    : 'Valider',

    'DIALOG_ALERT_TITLE' : 'Fenêtre d\'alerte',

    'DIALOG_COLOR_TITLE' : 'Fenêtre de couleur',
    'DIALOG_COLOR_R' : 'Rouge: {0}',
    'DIALOG_COLOR_G' : 'Vert: {0}',
    'DIALOG_COLOR_B' : 'Bleu: {0}',
    'DIALOG_COLOR_A' : 'Alpha: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Fenêtre de confirmation',

    'DIALOG_ERROR_MESSAGE'   : 'Message',
    'DIALOG_ERROR_SUMMARY'   : 'Résumé',
    'DIALOG_ERROR_TRACE'     : 'Trace',
    'DIALOG_ERROR_BUGREPORT' : 'Rapport de bug',

    'DIALOG_FILE_SAVE'      : 'Enregistrer',
    'DIALOG_FILE_OPEN'      : 'Ouvrir',
    'DIALOG_FILE_MKDIR'     : 'Nouveau dossier',
    'DIALOG_FILE_MKDIR_MSG' : 'Créer un nouveau dossier dans **{0}**',
    'DIALOG_FILE_OVERWRITE' : 'Êtes-vous sûr de vouloir écraser le fichier \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Type de vue',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Vue en liste',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Vue en arborescence',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Vue en icônes',
    'DIALOG_FILE_ERROR'        : 'Erreur FileDialog',
    'DIALOG_FILE_ERROR_SCANDIR': 'Impossible de lister le contenu du dossier \'{0}\' car une erreur est survenue',
    'DIALOG_FILE_MISSING_FILENAME' : 'Vous devez sélectionner un fichier ou entrer un nouveau nom de fichier !',
    'DIALOG_FILE_MISSING_SELECTION': 'Vous devez sélectionner un fichier!',

    'DIALOG_FILEINFO_TITLE'   : 'Informations sur le fichier',
    'DIALOG_FILEINFO_LOADING' : 'Chargement des informations sur le fichier: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Erreur FileInformationDialog',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Impossible de récupérer les informations sur : **{0}**',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'FImpossible de récupérer les informations sur : {0}',

    'DIALOG_INPUT_TITLE' : 'Fenêtre de saisie',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Progression des opérations sur les fichiers',
    'DIALOG_FILEPROGRESS_LOADING' : 'Chargement...',

    'DIALOG_UPLOAD_TITLE'   : 'Fenêtre d\'envoi de fichier',
    'DIALOG_UPLOAD_DESC'    : 'Envoyer un fichier vers **{0}**.\nTaille maximum: {1} octets',
    'DIALOG_UPLOAD_MSG_FMT' : 'Envoi de \'{0}\' ({1} {2}) vers {3}',
    'DIALOG_UPLOAD_MSG'     : 'Envoi du fichier...',
    'DIALOG_UPLOAD_FAILED'  : 'L\'envoi a échoué!',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'L\'envoi a échoué',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Raison inconnue...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Annulé pas l\'utilisateur...',
    'DIALOG_UPLOAD_TOO_BIG': 'Le fichier est trop gros',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Le fichier est trop gros, sa taille éxcède {0}',

    'DIALOG_FONT_TITLE' : 'Fenêtre de police',

    'DIALOG_APPCHOOSER_TITLE' : 'Choisir une application',
    'DIALOG_APPCHOOSER_MSG'   : 'Choisir une application pour ouvrir',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Vous devez sélectionner une application',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Utiliser comme application par défaut pour {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'Module Google API non configuré ou désactivé',
    'GAPI_SIGN_OUT'           : 'Déconnexion de l\'API Google',
    'GAPI_REVOKE'             : 'Révoquer les permissions et déconnecter',
    'GAPI_AUTH_FAILURE'       : 'L\'authentification Google API a échouer ou ne s\'est pas déroulée',
    'GAPI_AUTH_FAILURE_FMT'   : 'Impossible d\'authentifier: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Impossible de charger l\'API Google',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Module Live API non configuré ou désactivé',
    'WLAPI_SIGN_OUT'          : 'Déconnexion de l\'API Live',
    'WLAPI_LOAD_FAILURE'      : 'Impossible de charger Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'Impossible de s\'authentifier dans Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Impossible de s\'authentifier dans Windows Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API a retourné le status {0}',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Impossible de créer une base IndexedDB sans nom de base',
    'IDB_NO_SUCH_ITEM'   : 'Aucun item correspondant',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Erreur fatale',
    'ERR_VFS_UNAVAILABLE'     : 'Non disponible',
    'ERR_VFS_FILE_ARGS'       : 'Le fichier attend au moins un argument',
    'ERR_VFS_NUM_ARGS'        : 'Pas assez d\'arguments',
    'ERR_VFS_EXPECT_FILE'     : 'Un objet "fichier" est attendu',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Un objet "fichier source" est attendu',
    'ERR_VFS_EXPECT_DST_FILE' : 'Un objet "fichier destination" est attendu',
    'ERR_VFS_FILE_EXISTS'     : 'Le fichier destination existe déjà',
    'ERR_VFS_TRANSFER_FMT'    : 'Une erreur est survenu lors du transfert entre espaces de stockage : {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Impossible d\'envoyer un fichier sans destination',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Impossible d\'envoyer un fichier sans aucun fichier défini',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Impossible d\'envoyer le fichier: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'L\'envoi du fichier a été annulé',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Impossible de télécharger un chemin sans chemin',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Une erreur est survenue lors du téléchargement: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'La réponse est vide',

    'ERR_VFSMODULE_INVALID'            : 'Module VFS invalide',
    'ERR_VFSMODULE_INVALID_FMT'        : 'Module VFS invalide: {0}',
    'ERR_VFSMODULE_INVALID_METHOD'     : 'Méthode VFS invalide',
    'ERR_VFSMODULE_INVALID_METHOD_FMT' : 'Méthode VFS invalide: {0}',
    'ERR_VFSMODULE_INVALID_TYPE'       : 'Type de module VFS invalide',
    'ERR_VFSMODULE_INVALID_TYPE_FMT'   : 'Type de module VFS invalide: {0}',
    'ERR_VFSMODULE_INVALID_CONFIG'     : 'Configuration VFS Module ',
    'ERR_VFSMODULE_INVALID_CONFIG_FMT' : 'Configuration VFS Module non valide : {0}',
    'ERR_VFSMODULE_ALREADY_MOUNTED'    : 'Module VFS déjà monté',
    'ERR_VFSMODULE_ALREADY_MOUNTED_FMT': 'Module VFS \'{0}\' déjà monté',
    'ERR_VFSMODULE_NOT_MOUNTED'        : 'Module VFS non monté',
    'ERR_VFSMODULE_NOT_MOUNTED_FMT'    : 'Module VFS \'{0}\' non monté',
    'ERR_VFSMODULE_EXCEPTION'          : 'Exception du module VFS',
    'ERR_VFSMODULE_EXCEPTION_FMT'      : 'Exception du module VFS: {0}',
    'ERR_VFSMODULE_NOT_FOUND_FMT'      : 'Aucun Module VFS ne correspond {0}. Mauvais chemin ou Mauvais formats ?',
    
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Téléchargement du fichier',

    'ERR_VFSMODULE_XHR_ERROR'      : 'Erreur XHR',
    'ERR_VFSMODULE_ROOT_ID'        : 'Impossible de trouver l\'id du répertoire racine',
    'ERR_VFSMODULE_NOSUCH'         : 'Le fichier n\'existe pas',
    'ERR_VFSMODULE_PARENT'         : 'Pas de parent',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Impossible de trouver un parent: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Impossible de scanner le répertoire',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Impossible de scanner le répertoire: {0}',
    'ERR_VFSMODULE_READ'           : 'Impossible de lire le fichier',
    'ERR_VFSMODULE_READ_FMT'       : 'Impossible de lire le fichier: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Impossible d\'écrire dans le fichier',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Impossible d\'écrire dans le fichier: {0}',
    'ERR_VFSMODULE_COPY'           : 'Impossible de copier',
    'ERR_VFSMODULE_COPY_FMT'       : 'Impossible de copier: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Impossible de détacher le fichier',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Impossible de détacher le fichier: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Impossible de déplacer le fichier',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Impossible de déplacer le fichier: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Impossible de vérifier l\'existance du fichier',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Impossible de vérifier l\'existance du fichier: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Impossible de récuperer les informations du fichier',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Impossible de récuperer les informations du fichier: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Impossible de créer un répertoire',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Impossible de créer un répertoire: {0}',
    'ERR_VFSMODULE_URL'            : 'Impossible de récuperer l\'URL du fichier',
    'ERR_VFSMODULE_URL_FMT'        : 'Impossible de récuperer l\'URL du fichier: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Impossible de déplacer le fichier dans la corbeille',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Impossible de déplacer le fichier dans la corbeille: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Impossible de sortir le fichier de la corbeille',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Impossible de sortir le fichier de la corbeille: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Impossible de vider la corbeille',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Impossible de vider la corbeille: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Vous êtes connectés dans l\'API Dropbox',
    'DROPBOX_SIGN_OUT'           : 'Déconnexion des services Google API',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Impossible de résoudre le chemin: objet non trouvé',

    // ZIP
    'ZIP_PRELOAD_FAIL'  : 'LE chargement de zip.js a échoué',
    'ZIP_VENDOR_FAIL'   : 'La bibliothèque zip.js n\'a pas été trouvée. A-t-elle été chargée correctement?',
    'ZIP_NO_RESOURCE'   : 'Aucune archive zip n\'a été fournie',
    'ZIP_NO_PATH'       : 'Aucun chemin fourni',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'Le répertoire d\'installation des paquêts existe déjà. L\'opération est interrompue!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Impossible d\'ouvrir le fichier',
    'ERR_FILE_APP_OPEN_FMT'     : 'Le fichier {0} n\'a pas pu être ouvert car le type mime {1} m\'est pas supporté',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Le fichier {0} n\'a pas pu être ouvert',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Le fichier {0} n\'a pas pu être enregistré',
    'ERR_GENERIC_APP_FMT'       : '{0} Erreur de l\'application',
    'ERR_GENERIC_APP_ACTION_FMT': 'Impossible d\'effectuer l\'action \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Erreur inconnue',
    'ERR_GENERIC_APP_REQUEST'   : 'Une erreur est survenue lors du traitement de votre requête',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Erreur fatale : {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Abandonner les modifications ?',
    'MSG_FILE_CHANGED'          : 'Le fichier a été modifié. Le recharger ?',
    'MSG_APPLICATION_WARNING'   : 'Avertissement de l\'application',
    'MSG_MIME_OVERRIDE'         : 'Le type de fichier "{0}" n\'est pas supporté, utilisation de "{1}" à la place.',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Inconnu',
    'LBL_APPEARANCE'   : 'Appearance',
    'LBL_USER'         : 'Utilisateur',
    'LBL_NAME'         : 'Nom',
    'LBL_APPLY'        : 'Appliquer',
    'LBL_FILENAME'     : 'Nom de fichier',
    'LBL_PATH'         : 'Chemin',
    'LBL_SIZE'         : 'Taille',
    'LBL_TYPE'         : 'Type',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Chargement',
    'LBL_SETTINGS'     : 'Paramètres',
    'LBL_ADD_FILE'     : 'Ajouter un fichier',
    'LBL_COMMENT'      : 'Commentaire',
    'LBL_ACCOUNT'      : 'Compte',
    'LBL_CONNECT'      : 'Connexion',
    'LBL_ONLINE'       : 'En ligne',
    'LBL_OFFLINE'      : 'Hors ligne',
    'LBL_AWAY'         : 'Absent',
    'LBL_BUSY'         : 'Occupé',
    'LBL_CHAT'         : 'Chat',
    'LBL_HELP'         : 'Aide',
    'LBL_ABOUT'        : 'À propos',
    'LBL_PANELS'       : 'Panneaux',
    'LBL_LOCALES'      : 'Langues',
    'LBL_THEME'        : 'Thème',
    'LBL_COLOR'        : 'Couleur',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Fin de tâche',
    'LBL_ALIVE'        : 'Vivant',
    'LBL_INDEX'        : 'Index',
    'LBL_ADD'          : 'Ajouter',
    'LBL_FONT'         : 'Police',
    'LBL_YES'          : 'Oui',
    'LBL_NO'           : 'Non',
    'LBL_CANCEL'       : 'Annuler',
    'LBL_TOP'          : 'Haut',
    'LBL_LEFT'         : 'Gauche',
    'LBL_RIGHT'        : 'Droite',
    'LBL_BOTTOM'       : 'Bas',
    'LBL_CENTER'       : 'Centre',
    'LBL_FILE'         : 'Fichier',
    'LBL_NEW'          : 'Nouveau',
    'LBL_OPEN'         : 'Ouvrir',
    'LBL_SAVE'         : 'Enregistrer',
    'LBL_SAVEAS'       : 'Enregistrer sous...',
    'LBL_CLOSE'        : 'Fermer',
    'LBL_MKDIR'        : 'Créer un dossier',
    'LBL_UPLOAD'       : 'Envoyer un fichier',
    'LBL_VIEW'         : 'Vue',
    'LBL_EDIT'         : 'Édition',
    'LBL_RENAME'       : 'Renommer',
    'LBL_DELETE'       : 'Supprimer',
    'LBL_OPENWITH'     : 'Ouvrir avec...',
    'LBL_ICONVIEW'     : 'Vue en icônes',
    'LBL_TREEVIEW'     : 'Vue en arborescence',
    'LBL_LISTVIEW'     : 'Vue en liste',
    'LBL_REFRESH'      : 'Rafraîchir',
    'LBL_VIEWTYPE'     : 'Type de vue',
    'LBL_BOLD'         : 'Gras',
    'LBL_ITALIC'       : 'Italique',
    'LBL_UNDERLINE'    : 'Souligné',
    'LBL_REGULAR'      : 'Régulier',
    'LBL_STRIKE'       : 'Barré',
    'LBL_INDENT'       : 'Indentation',
    'LBL_OUTDENT'      : 'Outdate',
    'LBL_UNDO'         : 'Annuler',
    'LBL_REDO'         : 'Refaire',
    'LBL_CUT'          : 'Couper',
    'LBL_UNLINK'       : 'Supprimer le lien',
    'LBL_COPY'         : 'Copier',
    'LBL_PASTE'        : 'Coller',
    'LBL_INSERT'       : 'Insérer',
    'LBL_IMAGE'        : 'Image',
    'LBL_LINK'         : 'Lien',
    'LBL_DISCONNECT'    : 'Déconnexion',
    'LBL_APPLICATIONS'  : 'Applications',
    'LBL_ADD_FOLDER'    : 'Ajouter un dossier',
    'LBL_INFORMATION'   : 'Information',
    'LBL_TEXT_COLOR'    : 'Couleur du texte',
    'LBL_BACK_COLOR'    : 'Couleur de fond',
    'LBL_RESET_DEFAULT' : 'Rétablir par défaut',
    'LBL_DOWNLOAD_COMP' : 'Télécharger sur l\'ordinateur',
    'LBL_ORDERED_LIST'  : 'Liste ordonnée',
    'LBL_BACKGROUND_IMAGE' : 'Image d\'arrière-plan',
    'LBL_BACKGROUND_COLOR' : 'Couleur d\'arrière-plan',
    'LBL_UNORDERED_LIST'   : 'Liste désordonnée',
    'LBL_STATUS'   : 'Status',
    'LBL_READONLY' : 'Lecture seule',
    'LBL_CREATED' : 'Crée',
    'LBL_MODIFIED' : 'Modifié',
    'LBL_SHOW_COLUMNS' : 'Montrer les colonnes',
    'LBL_MOVE' : 'Déplacer',
    'LBL_OPTIONS' : 'Options',
    'LBL_OK' : 'OK',
    'LBL_DIRECTORY' : 'Repertoire',
    'LBL_CREATE' : 'Créer',
    'LBL_BUGREPORT' : 'Report de bug',
    'LBL_INSTALL' : 'Installer',
    'LBL_UPDATE' : 'Mettre à jour',
    'LBL_REMOVE' : 'Enlever',
    'LBL_SHOW_SIDEBAR' : 'Afficher la barre de côté',
    'LBL_SHOW_NAVIGATION' : 'Afficher la navigation',
    'LBL_SHOW_HIDDENFILES' : 'Afficher les fichiers cachés',
    'LBL_SHOW_FILEEXTENSIONS' : 'Afficher les extensions de fichier',
    'LBL_MOUNT': 'Monter',
    'LBL_DESCRIPTION': 'Description',
    'LBL_USERNAME': 'Nom d\'utilisateur',
    'LBL_PASSWORD': 'Mot de passe',
    'LBL_HOST': 'Hôte',
    'LBL_NAMESPACE': 'Espace de nom'
  };

})();
