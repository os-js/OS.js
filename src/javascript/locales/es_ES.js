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

  OSjs.Locales.es_ES = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Error abriendo archivo',
    'ERR_WM_NOT_RUNNING'        : 'El gestor de ventanas no está en ejecución',
    'ERR_FILE_OPEN_FMT'         : 'No se pudo abrir el fichero \'<span>{0}</span>\'',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'No se pudo encontrar ninguna aplicación asociada a los archivos \'{0}\'',
    'ERR_APP_LAUNCH_FAILED'     : 'Error abriendo aplicación',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Se produjo un error intentando ejecutar: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Error construyendo la aplicación \'{0}\': {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Error en init() de la applicación \'{0}\': {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : '¡La aplicación  \'{0}\' no pudo obtener los recursos necesarios, o falló al cargarse!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Error en la precarga de la application \'{0}\': \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : '¡La aplicación \'{0}\' ya está ejecutándose y sólo permite una instancia!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : '¡Error al abrir \'{0}\'. No se encontraron los datos del manifiesto de la aplicación!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : '¡Error al abrir \'{0}\'. Tu explorador no da soporte: {1}',

    'ERR_NO_WM_RUNNING'         : 'Ningún gestor de ventanas en ejecución',
    'ERR_CORE_INIT_FAILED'      : 'Error inicializando OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'Se produjo un error inicializando OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'No se puede lanzar OS.js: ¡No se definió ningún gestor de ventanas!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'No se puede lanzar OS.js: se fallo al lanzar el gestor de ventanas: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'No se puede lanzar OS.js: se falló precargando recursos...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'Informe de errores de JavaScript',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Error inesperado, puede que sea un bug.',

    'ERR_APP_API_ERROR'           : 'Error del API de la aplicación',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'La aplicación {0} no pudo realizar la operación \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Falta un argumento: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Error desconocido',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Ya tienes una ventana llamada \'{0}\'',
    'WINDOW_MINIMIZE' : 'Minimizar',
    'WINDOW_MAXIMIZE' : 'Maximizar',
    'WINDOW_RESTORE'  : 'Restaurar',
    'WINDOW_CLOSE'    : 'Cerrar',
    'WINDOW_ONTOP_ON' : 'En primer plano (Activar)',
    'WINDOW_ONTOP_OFF': 'En primer plano (Desactivar)',

    // Handler
    'TITLE_SIGN_OUT' : 'Sesión finalizada',
    'TITLE_SIGNED_IN_AS_FMT' : 'Sesión iniciada como: {0}',

    // SESSION
    'MSG_SESSION_WARNING' : '¿Estás seguro de que quieres salir de OS.js? Se perderán todas las configuraciones y datos que no se hayan guardado',

    // Service
    'BUGREPORT_MSG' : 'Por favor, informa de esto si piensas que es un bug.\nIncluye una breve descripción sobre cómo se produjo el probleñam y si es posible, cómo reproducirlo. Gracias',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Se accedió a servicios externos: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Error fatal',
    'ERR_UTILS_XHR_FMT' : 'Error AJAX/XHR: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Finalizar sesión (Salir)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Usuario \'{0}\' desconectando.\n¿Quieres guardar la sesión en curso?',

    'DIALOG_CLOSE' : 'Cerrar',
    'DIALOG_CANCEL': 'Cancelar',
    'DIALOG_APPLY' : 'Aplicar',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'Diálogo de alerta',

    'DIALOG_COLOR_TITLE' : 'Diálogo de color',
    'DIALOG_COLOR_R' : 'Rojo: {0}',
    'DIALOG_COLOR_G' : 'Verde: {0}',
    'DIALOG_COLOR_B' : 'Azul: {0}',
    'DIALOG_COLOR_A' : 'Alfa: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Diálogo de confirmación',

    'DIALOG_ERROR_MESSAGE'   : 'Mensaje',
    'DIALOG_ERROR_SUMMARY'   : 'Resumen',
    'DIALOG_ERROR_TRACE'     : 'Traza',
    'DIALOG_ERROR_BUGREPORT' : 'Informe de errores',

    'DIALOG_FILE_SAVE'      : 'Guardar',
    'DIALOG_FILE_OPEN'      : 'Abrir',
    'DIALOG_FILE_MKDIR'     : 'Nueva carpeta',
    'DIALOG_FILE_MKDIR_MSG' : 'Crear una nueva carpeta en <span>{0}</span>',
    'DIALOG_FILE_OVERWRITE' : '¿Seguro que quieres sobreescribir el fichero \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Tipo de vista',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Vista de lista',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Vista de árbol',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Vista de icono',
    'DIALOG_FILE_ERROR'        : 'Error en el diálogo de fichero',
    'DIALOG_FILE_ERROR_SCANDIR': 'Error listando el directorio \'{0}\' porque ocurrió un error',
    'DIALOG_FILE_MISSING_FILENAME' : '¡Tienes que seleccionar un archivo o introducir un nombre de archivo nuevo!',
    'DIALOG_FILE_MISSING_SELECTION': '¡Tienes que seleccionar un archivo!',

    'DIALOG_FILEINFO_TITLE'   : 'Información de fichero',
    'DIALOG_FILEINFO_LOADING' : 'Cargando la información del fichero: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Error del diálogo de información de fichero',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'No se pudo obtener la información del fichero <span>{0}</span>',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'No se pudo obtener la información del fichero: {0}',

    'DIALOG_INPUT_TITLE' : 'Diálogo de entrada',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Operación de archivo en progreso',
    'DIALOG_FILEPROGRESS_LOADING' : 'Cargando...',

    'DIALOG_UPLOAD_TITLE'   : 'Diálogo de subida',
    'DIALOG_UPLOAD_DESC'    : 'Subir archivo a <span>{0}</span>.<br />Tamaño máximo: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : 'Subiendo \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : 'Subiendo archivo...',
    'DIALOG_UPLOAD_FAILED'  : 'Fallo en la subida',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'La subida ha fallado',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Razón desconocida...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Cancelado por el usuario...',
    'DIALOG_UPLOAD_TOO_BIG': 'El archivo es demasiado grande',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'El archivo es demasiado grande, excede los {0}',

    'DIALOG_FONT_TITLE' : 'Diálogo de tipografía',

    'DIALOG_APPCHOOSER_TITLE' : 'Elegir aplicación',
    'DIALOG_APPCHOOSER_MSG'   : 'Elegir la aplicación a abrir',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Necesitas seleccionar una aplicación',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Usar como la aplicación por defecto para {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'El módulo GoogleAPI no está configurado o está desactivado',
    'GAPI_SIGN_OUT'           : 'Desconectar de los servicios Google API',
    'GAPI_REVOKE'             : 'Revocar permisos y desconectar',
    'GAPI_AUTH_FAILURE'       : 'La autenticación en Google API falló, o no llegó a efectuarse',
    'GAPI_AUTH_FAILURE_FMT'   : 'No se pudo autenticar: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'No se pudo cargar Google API',

    // Windows Live API
    'WLAPI_DISABLED'          : 'El módulo Windows Live API no está configurado o está desactivado',
    'WLAPI_SIGN_OUT'          : 'Desconectar de los servicios Windows Live API',
    'WLAPI_LOAD_FAILURE'      : 'No se pudo cargar Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'No se pudo acceder a Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : 'No se pudo acceder a Windows Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API devolvió el estado {0}',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'No se pudo crear IndexedDB sin un nombre de base de datos',
    'IDB_NO_SUCH_ITEM'   : 'No existe ese elemento',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Error fatal',
    'ERR_VFS_UNAVAILABLE'     : 'No disponible',
    'ERR_VFS_FILE_ARGS'       : 'El archivo espera al menos un argumento',
    'ERR_VFS_NUM_ARGS'        : 'Argumentos insuficientes',
    'ERR_VFS_EXPECT_FILE'     : 'Se espera un objeto-fichero',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Se espera un origen objeto-fichero',
    'ERR_VFS_EXPECT_DST_FILE' : 'Se espera un destino objeto-fichero',
    'ERR_VFS_FILE_EXISTS'     : 'El destino ya existe',
    'ERR_VFS_TRANSFER_FMT'    : 'Se produjo un error al transferir entre almacenamientos: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'No se puede subir un fichero sin un destino',
    'ERR_VFS_UPLOAD_NO_FILES' : 'No se puede efectuar la subida si no hay archivos definidos',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Fallo en la subida: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Se canceló la subida del fichero',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'No se puede descargar una ruta sin una ruta',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Se produjo un error en la descarga: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'La respuesta estaba vacía',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Descargando fichero',

    'ERR_VFSMODULE_XHR_ERROR'      : 'Error XHR',
    'ERR_VFSMODULE_ROOT_ID'        : 'No se pudo encontrar el identificador del directorio raíz',
    'ERR_VFSMODULE_NOSUCH'         : 'El archivo no existe',
    'ERR_VFSMODULE_PARENT'         : 'No existe el padre',
    'ERR_VFSMODULE_PARENT_FMT'     : 'No se pudo localizar el padre: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'No se pudo analizar el directorio',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'No se pudo analizar el directorio: {0}',
    'ERR_VFSMODULE_READ'           : 'No se pudo leer el fichero',
    'ERR_VFSMODULE_READ_FMT'       : 'No se pudo leer el fichero: {0}',
    'ERR_VFSMODULE_WRITE'          : 'No se pudo escribir el fichero',
    'ERR_VFSMODULE_WRITE_FMT'      : 'No se pudo escribir el fichero: {0}',
    'ERR_VFSMODULE_COPY'           : 'No se pudo copiar',
    'ERR_VFSMODULE_COPY_FMT'       : 'No se pudo copiar: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'No se pudo desenlazar el fichero',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'No se pudo desenlazar el fichero: {0}',
    'ERR_VFSMODULE_MOVE'           : 'No se pudo mover el fichero',
    'ERR_VFSMODULE_MOVE_FMT'       : 'No se pudo mover el fichero: {0}',
    'ERR_VFSMODULE_EXIST'          : 'No se pudo comprobar la existencia del fichero',
    'ERR_VFSMODULE_EXIST_FMT'      : 'No se pudo comprobar la existencia del fichero: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'No se pudo obtener la infomación del archivo',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'No se pudo obtener la infomación del archivo: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'No se pudo crear el directorio',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'No se pudo crear el directorio: {0}',
    'ERR_VFSMODULE_URL'            : 'No se pudo obtener la URL del archivo',
    'ERR_VFSMODULE_URL_FMT'        : 'No se pudo obtener la URL del archivo: {0}',
    'ERR_VFSMODULE_TRASH'          : 'No se pudo enviar el archivo a la papelera',
    'ERR_VFSMODULE_TRASH_FMT'      : 'No se pudo enviar el archivo a la papelera: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'No se pudo recuperar el archivo de la la papelera',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'No se pudo recuperar el archivo de la la papelera: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'No se pudo vaciar la papelera',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'No se pudo vaciar la papelera: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Estás identificado en el API de dropbox',
    'DROPBOX_SIGN_OUT'           : 'Desconectar de los servicios Google API Services',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'No se pudo resolver la ruta: no se encontró el elemento',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'No se puede abrir el archivo',
    'ERR_FILE_APP_OPEN_FMT'     : 'El archivo {0} no pudo abrirse porque no hay soporte para el tipo MIME {1}',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'No pudo abrirse el archivo {0}',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'No pudo guardarse el archivo {0}',
    'ERR_GENERIC_APP_FMT'       : 'Error en la aplicación {0}',
    'ERR_GENERIC_APP_ACTION_FMT': 'No se pudo efectuar la acción \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Error desconocido',
    'ERR_GENERIC_APP_REQUEST'   : 'Se produjo un error manipulando la solicitud',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Error fatal: {0}',
    'MSG_GENERIC_APP_DISCARD'   : '¿Descartar cambios?',
    'MSG_FILE_CHANGED'          : 'El archivo ha cambiado. ¿Recargar?',
    'MSG_APPLICATION_WARNING'   : 'Advertencia de aplicación',
    'MSG_MIME_OVERRIDE'         : 'El tipo de fichero "{0}" no está soportado, se usará "{1}" en su lugar.',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Desconocido',
    'LBL_APPEARANCE'   : 'Aspecto',
    'LBL_USER'         : 'Usuario',
    'LBL_NAME'         : 'Nombre',
    'LBL_APPLY'        : 'Aplicar',
    'LBL_FILENAME'     : 'Nombre de archivo',
    'LBL_PATH'         : 'Ruta',
    'LBL_SIZE'         : 'Tamaño',
    'LBL_TYPE'         : 'Tipo',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Cargando',
    'LBL_SETTINGS'     : 'Configuración',
    'LBL_ADD_FILE'     : 'Añadir fichero',
    'LBL_COMMENT'      : 'Comentario',
    'LBL_ACCOUNT'      : 'Cuenta',
    'LBL_CONNECT'      : 'Conectar',
    'LBL_ONLINE'       : 'Conectado',
    'LBL_OFFLINE'      : 'Desconectado',
    'LBL_AWAY'         : 'No disponible',
    'LBL_BUSY'         : 'Ocupado',
    'LBL_CHAT'         : 'Chat',
    'LBL_HELP'         : 'Ayuda',
    'LBL_ABOUT'        : 'A propósito de',
    'LBL_PANELS'       : 'Paneles',
    'LBL_LOCALES'      : 'Internacionalización',
    'LBL_THEME'        : 'Tema',
    'LBL_COLOR'        : 'Color',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Kill',
    'LBL_ALIVE'        : 'Alive',
    'LBL_INDEX'        : 'Índice',
    'LBL_ADD'          : 'Añadir',
    'LBL_FONT'         : 'Tipografía',
    'LBL_YES'          : 'Si',
    'LBL_NO'           : 'No',
    'LBL_CANCEL'       : 'Cancelar',
    'LBL_TOP'          : 'Arriba',
    'LBL_LEFT'         : 'Izquierda',
    'LBL_RIGHT'        : 'Derecha',
    'LBL_BOTTOM'       : 'Abajo',
    'LBL_CENTER'       : 'Centro',
    'LBL_FILE'         : 'Fichero',
    'LBL_NEW'          : 'Nuevo',
    'LBL_OPEN'         : 'Abrir',
    'LBL_SAVE'         : 'Guardar',
    'LBL_SAVEAS'       : 'Guardar cómo...',
    'LBL_CLOSE'        : 'Cerrar',
    'LBL_MKDIR'        : 'Crear directorio',
    'LBL_UPLOAD'       : 'Subir',
    'LBL_VIEW'         : 'Vista',
    'LBL_EDIT'         : 'Editar',
    'LBL_RENAME'       : 'Renombrar',
    'LBL_DELETE'       : 'Eliminar',
    'LBL_OPENWITH'     : 'Abrir con...',
    'LBL_ICONVIEW'     : 'Vista de iconos',
    'LBL_TREEVIEW'     : 'Vista de árbol',
    'LBL_LISTVIEW'     : 'Vista de lista',
    'LBL_REFRESH'      : 'Recargar',
    'LBL_VIEWTYPE'     : 'Ver tipo',
    'LBL_BOLD'         : 'Negrita',
    'LBL_ITALIC'       : 'Cursiva',
    'LBL_UNDERLINE'    : 'Subrayado',
    'LBL_REGULAR'      : 'Regular',
    'LBL_STRIKE'       : 'Barra',
    'LBL_INDENT'       : 'Indentar',
    'LBL_OUTDENT'      : 'Obsoleto',
    'LBL_UNDO'         : 'Deshacer',
    'LBL_REDO'         : 'Rehacer',
    'LBL_CUT'          : 'Cortar',
    'LBL_UNLINK'       : 'Desenlazar',
    'LBL_COPY'         : 'Copiar',
    'LBL_PASTE'        : 'Pegar',
    'LBL_INSERT'       : 'Insertar',
    'LBL_IMAGE'        : 'Imágen',
    'LBL_LINK'         : 'Enlace',
    'LBL_DISCONNECT'    : 'Desconectar',
    'LBL_APPLICATIONS'  : 'Aplicaciones',
    'LBL_ADD_FOLDER'    : 'Añadir carpeta',
    'LBL_INFORMATION'   : 'Información',
    'LBL_TEXT_COLOR'    : 'Color de texto',
    'LBL_BACK_COLOR'    : 'Color de fondo',
    'LBL_RESET_DEFAULT' : 'Restablecer los valores por defecto',
    'LBL_DOWNLOAD_COMP' : 'Descargar en el ordenador',
    'LBL_ORDERED_LIST'  : 'Lista ordenada',
    'LBL_BACKGROUND_IMAGE' : 'Imagen de fondo',
    'LBL_BACKGROUND_COLOR' : 'Color de fondo',
    'LBL_UNORDERED_LIST'   : 'Lista no ordenada',
    'LBL_STATUS'   : 'Estado',
    'LBL_READONLY' : 'Sólo lectura',
    'LBL_CREATED' : 'Creado',
    'LBL_MODIFIED' : 'Modificado',
    'LBL_SHOW_COLUMNS' : 'Mostrar columnas',
    'LBL_MOVE' : 'Mover',
    'LBL_OPTIONS' : 'Opciones',
    'LBL_OK' : 'OK'
  };

})();
