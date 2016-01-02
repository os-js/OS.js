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

  OSjs.Locales.bg_BG = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Грешка при отваряне на файл',
    'ERR_WM_NOT_RUNNING'        : 'Мениджъра на прозорци не работи ',
    'ERR_FILE_OPEN_FMT'         : 'Файлът \'<span>{0}</span>\' не може да бъде отворен',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Няма намерени приложения с поддръжка за \'{0}\' файлове',
    'ERR_APP_LAUNCH_FAILED'     : 'Приложението не можа да бъде стартирано',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Получи се грешка по време на стартиране: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Приможението \'{0}\' провалено изграждане: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Приложението \'{0}\' init() провалено: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Липсващи ресурси за приложението \'{0}\' или се провали стартирането!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Приложението \'{0}\' предварително стартиране провалено: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'Приложението \'{0}\' е вече стартирано!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Грешка при стартиране \'{0}\'. няма намерени данни!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Грешка при стартиране \'{0}\'. неподдържан браузър: {1}',

    'ERR_NO_WM_RUNNING'         : 'Няма работещ мениджър на прозорци',
    'ERR_CORE_INIT_FAILED'      : 'Провалено инициализиране на OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'Грешка при инициализиране на OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'OS.js не може да се стартира: Не е определен мениджър на прозорци!',
    'ERR_CORE_INIT_WM_FAILED_FMT': 'OS.js не може да се стартира: Провалено отваряне на мениджър на прозорци: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED': 'OS.js не може да се стартира: Провалено зареждане на ресурсите...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript информация на грешка ',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Появи се неочкавана грешка, вероятно бъг.',

    'ERR_APP_API_ERROR'           : 'Грешка в  API на приложението',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Приложението {0} не можа да изпълни операцията \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Липсващ аргумент: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Непозната грешка',

    'ERR_OPERATION_TIMEOUT'       : 'Пресрочено време на операцията',
    'ERR_OPERATION_TIMEOUT_FMT'   : 'Пресрочено време на операцията ({0})',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Вече има наименован прозорец \'{0}\'',
    'WINDOW_MINIMIZE' : 'Минимизирай',
    'WINDOW_MAXIMIZE' : 'Максимизиране',
    'WINDOW_RESTORE'  : 'Възобнови',
    'WINDOW_CLOSE'    : 'затвори',
    'WINDOW_ONTOP_ON' : 'най-отгоре (разрешено)',
    'WINDOW_ONTOP_OFF': 'най-отгоре (забранено)',

    // Handler
    'TITLE_SIGN_OUT' : 'Изход',
    'TITLE_SIGNED_IN_AS_FMT' : 'Влезли сте като: {0}',

    // SESSION
    'MSG_SESSION_WARNING' : 'Сигурни ли сте, че искате на излезете от OS.js? Всички не запазени настройки и информация ще бъдат загубени!',

    // Service
    'BUGREPORT_MSG' : 'Моля докладвайте това ако мислите, че е бъг.\включете детайлно описание как се получи грешката и само ако можете; как може да бъде поправена ',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Влезли сте във външни услуги: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Фатална грешка',
    'ERR_UTILS_XHR_FMT' : 'AJAX/XHR грешка: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Излез (Изход)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Излизане от потребител \'{0}\'.\nИскате ли да запазите текущата сесия?',

    'DIALOG_CLOSE' : 'Затвори',
    'DIALOG_CANCEL': 'Откажи',
    'DIALOG_APPLY' : 'Приложи',
    'DIALOG_OK'    : 'ОК',

    'DIALOG_ALERT_TITLE' : 'Диалог за известие',

    'DIALOG_COLOR_TITLE' : 'Цвят на диалога',
    'DIALOG_COLOR_R' : 'Червен: {0}',
    'DIALOG_COLOR_G' : 'Зелен: {0}',
    'DIALOG_COLOR_B' : 'Син: {0}',
    'DIALOG_COLOR_A' : 'Алфа: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Потвърди диалог',

    'DIALOG_ERROR_MESSAGE'   : 'Съобщение',
    'DIALOG_ERROR_SUMMARY'   : 'Съдържание',
    'DIALOG_ERROR_TRACE'     : 'Търси',
    'DIALOG_ERROR_BUGREPORT' : 'Докладвай бъг',

    'DIALOG_FILE_SAVE'      : 'Запази',
    'DIALOG_FILE_OPEN'      : 'Отвори',
    'DIALOG_FILE_MKDIR'     : 'Нова папка',
    'DIALOG_FILE_MKDIR_MSG' : 'Създай нова директория в <span>{0}</span>',
    'DIALOG_FILE_OVERWRITE' : 'Сигурни ли сте, че искате да презапишете фаилът \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Тип на изглед',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Списък',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Дърво',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Икони',
    'DIALOG_FILE_ERROR'        : 'Грешка във файлов диалог',
    'DIALOG_FILE_ERROR_SCANDIR': 'Провалено разглеждане на директорията \'{0}\' поради грешка',
    'DIALOG_FILE_MISSING_FILENAME' : 'Трябва да изберете файл или да въведете име!',
    'DIALOG_FILE_MISSING_SELECTION': 'Трябва да изберете файл!',

    'DIALOG_FILEINFO_TITLE'   : 'Инфорамция за файлът',
    'DIALOG_FILEINFO_LOADING' : 'Зареждане на информация за: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Грешка в информация за файл',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Не може да бъде намерена информация за файлът <span>{0}</span>',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Не може да бъде намерена информация за файлът: {0}',

    'DIALOG_INPUT_TITLE' : 'Входящ диалог',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Прогрес на операцията на файлът',
    'DIALOG_FILEPROGRESS_LOADING' : 'Зареждане...',

    'DIALOG_UPLOAD_TITLE'   : 'Добави диалог',
    'DIALOG_UPLOAD_DESC'    : 'Добави файл към <span>{0}</span>.<br />Максимален размер: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : 'Добавяне \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : 'Добавяне на фаил...',
    'DIALOG_UPLOAD_FAILED'  : 'Добавяне провалено',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Добавянето е провалено',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Неопределена причина...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Отказано от потребител...',
    'DIALOG_UPLOAD_TOO_BIG': 'Файлът е прекалено голям',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Файлът е прекалено голям, надвишава {0}',

    'DIALOG_FONT_TITLE' : 'Шрифт на диалог',

    'DIALOG_APPCHOOSER_TITLE' : 'Изберете приложение',
    'DIALOG_APPCHOOSER_MSG'   : 'Изберете приложение което да се отвори',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Трябва да изберете приложение',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Използвай като приложение по подразбиране за {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPI Модул не е конфигуриран или е изключен',
    'GAPI_SIGN_OUT'           : 'Изход от Google API услуги',
    'GAPI_REVOKE'             : 'Оттегляне на правата и изход',
    'GAPI_AUTH_FAILURE'       : 'Google API удостоверяване провалено или не е проведено',
    'GAPI_AUTH_FAILURE_FMT'   : 'Грешка при удостоверяване: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Провалено стартиране на Google API',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Windows Live API модул не е конфигуриран или е изключен',
    'WLAPI_SIGN_OUT'          : 'Изход от Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'Провалено стартиране на Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'Провалено влизане в Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Провалено влизане в Windows Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API отговори {0} статус',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Не може да бъде създадена IndexedDB без име на база данни',
    'IDB_NO_SUCH_ITEM'   : 'Не съществуващ обект',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Фатална грешка',
    'ERR_VFS_UNAVAILABLE'     : 'Не в налично',
    'ERR_VFS_FILE_ARGS'       : 'Файлът очаква поне един аргумент',
    'ERR_VFS_NUM_ARGS'        : 'Няма достатъчно аргументи',
    'ERR_VFS_EXPECT_FILE'     : 'Очаква файлов-обект',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Очква източник Файлов-обект',
    'ERR_VFS_EXPECT_DST_FILE' : 'Очаква дестинация Файлов-обект',
    'ERR_VFS_FILE_EXISTS'     : 'Дестинацията вече съществува',
    'ERR_VFS_TRANSFER_FMT'    : 'Появи се грешка докато се извършваше трансфер: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Не може да бъде добавен файл без девстинация',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Не може да се добавя без определяне на файлове',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Провалено добавяне на файлове: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Добавянето на файлове беше прекратено',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Не може да се изтегли без указан път ',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Появи се грешка при изтегляне: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'Отговора беше празен',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Изтегляне на файл',

    'ERR_VFSMODULE_XHR_ERROR'      : 'XHR грешка',
    'ERR_VFSMODULE_ROOT_ID'        : 'Не може да бъде намерено ИД на root папката',
    'ERR_VFSMODULE_NOSUCH'         : 'Файлът не съществува',
    'ERR_VFSMODULE_PARENT'         : 'Няма намерен източник',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Не можа да бъде намерен източнки: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Провалено сканиране на директория',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Провалено сканиране на директория: {0}',
    'ERR_VFSMODULE_READ'           : 'Провалено прочитане на файлът',
    'ERR_VFSMODULE_READ_FMT'       : 'Провалено прочитане на файлът: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Провалено записване на файлът',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Провалено записване на файлът: {0}',
    'ERR_VFSMODULE_COPY'           : 'Провалено копиране',
    'ERR_VFSMODULE_COPY_FMT'       : 'Провалено копиране: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Провалено разкачане на файлът ',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Провалено разкачане на файлът: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Провалено преместване на файлът',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Провалено преместване на фаилът: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Провалена прожерка за съществуване на файлът',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Провалена прожерка за съществуване на файлът: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Провалено получаване на информация за файлът',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Провалено получаване на информация за файлът: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Провалено създаване на директория',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Провалено създаване на директория: {0}',
    'ERR_VFSMODULE_URL'            : 'Провалено получаване на URL за файлът',
    'ERR_VFSMODULE_URL_FMT'        : 'Провалено получаване на URL за файлът: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Провалено изтриване',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Провалено изтриване: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Провалено изкарване от кошчето',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Провалено изкарване от кошчето: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Провалено изпразване на кошчето',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Провалено изпразване на кошчето: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Влезли сте в Dropbox API',
    'DROPBOX_SIGN_OUT'           : 'Изход от Dropbox API',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Провалено намиране на път: Обекта не е намерен',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'Директория за инсталиране на пакети вече съществува. Не може да продължите!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Не може да бъде отворен файлът',
    'ERR_FILE_APP_OPEN_FMT'     : 'Файлът {0} не може да бъде отоворен {1} не се поддържа',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Файлът {0} не може да бъде отворен',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Файлът {0} не може да бъде запазен',
    'ERR_GENERIC_APP_FMT'       : '{0} грешка в приложението',
    'ERR_GENERIC_APP_ACTION_FMT': 'Провалено изпълненяване на действие \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Непозната грешка',
    'ERR_GENERIC_APP_REQUEST'   : 'Получи се грешка при изпълняване на заявката',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Фатална грешка: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Откажи промените?',
    'MSG_FILE_CHANGED'          : 'Файлът е променен. презареди?',
    'MSG_APPLICATION_WARNING'   : 'Предупреждение',
    'MSG_MIME_OVERRIDE'         : 'вида на файла "{0}" не се поддържа, използвайте "{1}".',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Непознат',
    'LBL_APPEARANCE'   : 'Външен вид',
    'LBL_USER'         : 'Потребител',
    'LBL_NAME'         : 'Име',
    'LBL_APPLY'        : 'Приложи',
    'LBL_FILENAME'     : 'Име на файл',
    'LBL_PATH'         : 'Път',
    'LBL_SIZE'         : 'Размер',
    'LBL_TYPE'         : 'Тип',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Зареждане',
    'LBL_SETTINGS'     : 'Настройки',
    'LBL_ADD_FILE'     : 'Добави файл',
    'LBL_COMMENT'      : 'Коментар',
    'LBL_ACCOUNT'      : 'Акаунт',
    'LBL_CONNECT'      : 'Свържи се',
    'LBL_ONLINE'       : 'На линия',
    'LBL_OFFLINE'      : 'Извън линия',
    'LBL_AWAY'         : 'Отсъстващ',
    'LBL_BUSY'         : 'Зает',
    'LBL_CHAT'         : 'Чат',
    'LBL_HELP'         : 'Помощ',
    'LBL_ABOUT'        : 'Информация',
    'LBL_PANELS'       : 'Панели',
    'LBL_LOCALES'      : 'Локализация',
    'LBL_THEME'        : 'Тема',
    'LBL_COLOR'        : 'Цвят',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Прекрати',
    'LBL_ALIVE'        : 'Включи',
    'LBL_INDEX'        : 'Индекс',
    'LBL_ADD'          : 'Добави',
    'LBL_FONT'         : 'Шрифт',
    'LBL_YES'          : 'Да',
    'LBL_NO'           : 'Не',
    'LBL_CANCEL'       : 'Откажи',
    'LBL_TOP'          : 'Горе',
    'LBL_LEFT'         : 'Ляво',
    'LBL_RIGHT'        : 'Дясно',
    'LBL_BOTTOM'       : 'Долу',
    'LBL_CENTER'       : 'Център',
    'LBL_FILE'         : 'Файл',
    'LBL_NEW'          : 'Нов',
    'LBL_OPEN'         : 'Отвори',
    'LBL_SAVE'         : 'Запази',
    'LBL_SAVEAS'       : 'Запази като...',
    'LBL_CLOSE'        : 'Затрвори',
    'LBL_MKDIR'        : 'Създай директория',
    'LBL_UPLOAD'       : 'Добави',
    'LBL_VIEW'         : 'Изглед',
    'LBL_EDIT'         : 'Редактирай',
    'LBL_RENAME'       : 'Преименувай',
    'LBL_DELETE'       : 'Изтрии',
    'LBL_OPENWITH'     : 'Отвори с...',
    'LBL_ICONVIEW'     : 'Икони',
    'LBL_TREEVIEW'     : 'Дърво',
    'LBL_LISTVIEW'     : 'Списък',
    'LBL_REFRESH'      : 'Опресни',
    'LBL_VIEWTYPE'     : 'Начин на изглед',
    'LBL_BOLD'         : 'Получер',
    'LBL_ITALIC'       : 'Наклонен',
    'LBL_UNDERLINE'    : 'Подчертан',
    'LBL_REGULAR'      : 'Обикновен',
    'LBL_STRIKE'       : 'Strike',
    'LBL_INDENT'       : 'Идентификация',
    'LBL_OUTDENT'      : 'Пресрочване',
    'LBL_UNDO'         : 'Прремахни',
    'LBL_REDO'         : 'Отмени премахването',
    'LBL_CUT'          : 'Изрежи',
    'LBL_UNLINK'       : 'Откачи',
    'LBL_COPY'         : 'Копирай',
    'LBL_PASTE'        : 'Постави',
    'LBL_INSERT'       : 'Добави',
    'LBL_IMAGE'        : 'Изображение',
    'LBL_LINK'         : 'Линк',
    'LBL_DISCONNECT'    : 'Излез от връзка',
    'LBL_APPLICATIONS'  : 'Приложения',
    'LBL_ADD_FOLDER'    : 'Добави папка',
    'LBL_INFORMATION'   : 'Информация',
    'LBL_TEXT_COLOR'    : 'Цвят на текста',
    'LBL_BACK_COLOR'    : 'Цвят на фона',
    'LBL_RESET_DEFAULT' : 'Върни по подразбиране',
    'LBL_DOWNLOAD_COMP' : 'Изтегляне на компютъра',
    'LBL_ORDERED_LIST'  : 'Подреден списък',
    'LBL_BACKGROUND_IMAGE' : 'Изображения за фон',
    'LBL_BACKGROUND_COLOR' : 'Цвят на фон',
    'LBL_UNORDERED_LIST'   : 'Неподреден списък',
    'LBL_STATUS'   : 'Сатус',
    'LBL_READONLY' : 'само за четене',
    'LBL_CREATED' : 'Създаден',
    'LBL_MODIFIED' : 'Модифициран',
    'LBL_SHOW_COLUMNS' : 'Покажи колони',
    'LBL_MOVE' : 'Премести',
    'LBL_OPTIONS' : 'Опции',
    'LBL_OK' : 'ОК',
    'LBL_DIRECTORY' : 'Директория',
    'LBL_CREATE' : 'Създай',
    'LBL_BUGREPORT' : 'Бъг-репорт',
    'LBL_INSTALL' : 'Инсталирай',
    'LBL_UPDATE' : 'Актуализирай',
    'LBL_REMOVE' : 'Премахни'
  };

})();
