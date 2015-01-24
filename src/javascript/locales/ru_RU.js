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

  OSjs.Locales.ru_RU = {
    'ERR_FILE_OPEN'             : 'Ошибка открытия файла',
    'ERR_WM_NOT_RUNNING'        : 'Менеджер окон не запущен',
    'ERR_FILE_OPEN_FMT'         : 'Файд \'<span>{0}</span>\' не может быть открыт',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Неудалось найти Проиложение, способное открыть файл \'{0}\'',
    'ERR_APP_LAUNCH_FAILED'     : 'Ошибка запуска приложения',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'При попытке запуска, произошла следующая ошибка: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Приложение \'{0}\' ошибка построения: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Приложение \'{0}\' ошибка инициализации (init()): {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Приложение \'{0}\' отсутсвует ресурс или ошибка при его загрузке!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Приложение \'{0}\' ошибка предварительной загрузки: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'Приложение \'{0}\' уже запущено и единовременно поддерживает только одну копию!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Ошибка запуска \'{0}\'. Отсутствует манифест данных для приложения!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Ошибка запуска \'{0}\'. Ваш браузер не поддерживает: {1}',

    'ERR_NO_WM_RUNNING'         : 'Не запущен оконный менеджер',
    'ERR_CORE_INIT_FAILED'      : 'Ошибка инициализации OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'Произошла ошибка в момент инициализации OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'Невозможно запустить OS.js: Оконный менеджер не определен!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'Невозможно запустить OS.js: Failed to launch Window Manager: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'Невозможно запустить OS.js: Failed to preload resources...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript отчет об ошибке',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Проихошла непредвиденная ошибка, возможно баг.',

    'ERR_APP_API_ERROR'           : 'Приложение ошибка API',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Приложение {0} неудалось выполнить операцию \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Пропущен аргумент: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Неизвестная ошибка',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'У вас уже присутствует окно с названием \'{0}\'',
    'WINDOW_MINIMIZE' : 'Свернуть',
    'WINDOW_MAXIMIZE' : 'Развернуть',
    'WINDOW_RESTORE'  : 'Восстановить',
    'WINDOW_CLOSE'    : 'Закрыть',
    'WINDOW_ONTOP_ON' : 'Поверх всех окон (Включить)',
    'WINDOW_ONTOP_OFF': 'Поверх всех окон (Выключить)',

    // Handler
    'TITLE_SIGN_OUT' : 'Выйти',
    'TITLE_SIGNED_IN_AS_FMT' : 'Вы вошли как: {0}',

    // Dialogs
    'DIALOG_LOGOUT_TITLE' : 'Выйти (Выход)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Выход как пользователь: \'{0}\'.\nЖелаете сохранить текущую сессию?',

    'DIALOG_CLOSE' : 'Закрыть',
    'DIALOG_CANCEL': 'Отменить',
    'DIALOG_APPLY' : 'Применить',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'Внимание',

    'DIALOG_COLOR_TITLE' : 'Цвет',
    'DIALOG_COLOR_R' : 'Красный: {0}',
    'DIALOG_COLOR_G' : 'Зеленый: {0}',
    'DIALOG_COLOR_B' : 'Синий: {0}',
    'DIALOG_COLOR_A' : 'Прозрачность: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Подтверждение',

    'DIALOG_ERROR_MESSAGE'   : 'Сообщение',
    'DIALOG_ERROR_SUMMARY'   : 'Сводка',
    'DIALOG_ERROR_TRACE'     : 'Цепочка вызовов',
    'DIALOG_ERROR_BUGREPORT' : 'Отчет об ошибке',

    'DIALOG_FILE_SAVE'      : 'Сохранить',
    'DIALOG_FILE_OPEN'      : 'Открыть',
    'DIALOG_FILE_MKDIR'     : 'Новая папка',
    'DIALOG_FILE_MKDIR_MSG' : 'Создать новый каталог в <span>{0}</span>',
    'DIALOG_FILE_OVERWRITE' : 'Вы уверены, что хотите перезаписать файл \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Режим просмотра',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Список',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Древовидный',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Значки',
    'DIALOG_FILE_ERROR'        : 'FileDialog Ошибка',
    'DIALOG_FILE_ERROR_SCANDIR': 'Не удалось отобразить содержимое \'{0}\', произошла ошибка',
    'DIALOG_FILE_MISSING_FILENAME' : 'Вам необходимо выбрать файл или ввести новое имя файла!',
    'DIALOG_FILE_MISSING_SELECTION': 'Вам необходимо выбрать файл!',

    'DIALOG_FILEINFO_TITLE'   : 'Информация о файле',
    'DIALOG_FILEINFO_LOADING' : 'Загрузка информации о файле: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'FileInformationDialog Ошибка',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Ошибка при получения информации о файле <span>{0}</span>',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Ошибка при получения информации о файле: {0}',

    'DIALOG_INPUT_TITLE' : 'Input Dialog',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Состояние операции над файлом',
    'DIALOG_FILEPROGRESS_LOADING' : 'Загрузка...',

    'DIALOG_UPLOAD_TITLE'   : 'Загрузка',
    'DIALOG_UPLOAD_DESC'    : 'Загрузка файла <span>{0}</span>.<br />Максимальный размер: {1} байт',
    'DIALOG_UPLOAD_MSG_FMT' : 'Загрузка \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : 'Загрузка файла...',
    'DIALOG_UPLOAD_FAILED'  : 'Загрузка не удалась',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Загрузка завершилась неудачей',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Причина неизвестна...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Отменено пользователем...',

    'DIALOG_FONT_TITLE' : 'Шрифт',


    'DIALOG_APPCHOOSER_TITLE' : 'Выберите приложение',
    'DIALOG_APPCHOOSER_MSG'   : 'Выберите приложение для открытия',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Вам необходимо выбрать приложение',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Использовать в качестве приложения по умолчанию для {0}',

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPI модуль не настроен или отключен',
    'GAPI_SIGN_OUT'           : 'Выйти из API служб Google',
    'GAPI_REVOKE'             : 'Отозвать права доступа и выйти',
    'GAPI_AUTH_FAILURE'       : 'Не удалось аутентифицировать Google API',
    'GAPI_AUTH_FAILURE_FMT'   : 'Не удалось проверить подлинность: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Не удалось загрузить Google API',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Не удается создать IndexedDB без названия',
    'IDB_NO_SUCH_ITEM'   : 'Ничего не удалось найти',

    // VFS
    'ERR_VFS_FATAL'           : 'Критическая ошибка',
    'ERR_VFS_FILE_ARGS'       : 'Файл ожидает по меньшей мере один аргумент',
    'ERR_VFS_NUM_ARGS'        : 'Не достаточно аргументов',
    'ERR_VFS_EXPECT_FILE'     : 'Ожидается file-object',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Ожидается источник file-object',
    'ERR_VFS_EXPECT_DST_FILE' : 'Ожидается имя файла file-object',
    'ERR_VFS_FILE_EXISTS'     : 'Файл с таким именем уже существует',
    'ERR_VFS_TRANSFER_FMT'    : 'Произошла ошибка во время переноса между хранилищами: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Невозможно загрузить файл, без указания имени',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Невозможно загрузить файлы, без указания опредленных файлов',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Загрузка файла не удалась: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Загрузка файла была отменена',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Невозможно скачать каталог без пути',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Произошла ошибка при загрузке: {0}',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Скачивание файла',

    // DefaultApplication
    'ERR_FILE_APP_OPEN'         : 'Невозможно открыть файл',
    'ERR_FILE_APP_OPEN_FMT'     : 'Файл {0} не может быть открыт, mime-type {1} не поддерживается',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Файл {0} не может быть открыт',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Файл {0} не может быть сохранен',
    'ERR_GENERIC_APP_FMT'       : '{0} Ошибка приложения',
    'ERR_GENERIC_APP_ACTION_FMT': 'Не удалось выполнить действие \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Неизвестная ошибка',
    'ERR_GENERIC_APP_REQUEST'   : 'Произошла ошибка при обработке вашего запроса',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Критическая ошибка: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Отменить изменения?',
    'MSG_FILE_CHANGED'          : 'Файл был изменен. Перезагрузить?',
    'MSG_APPLICATION_WARNING'   : 'Предупреждение',
    'MSG_MIME_OVERRIDE'         : 'Тип файла "{0}" не поддерживается, используете "{1}".',

    // General
    'LBL_UNKNOWN'  : 'Неизвестный',
    'LBL_USER'     : 'Пользователь',
    'LBL_NAME'     : 'Название',
    'LBL_APPLY'    : 'Применить',
    'LBL_FILENAME' : 'Имя файла',
    'LBL_PATH'     : 'Путь',
    'LBL_SIZE'     : 'Размер',
    'LBL_TYPE'     : 'Тип',
    'LBL_MIME'     : 'MIME',
    'LBL_LOADING'  : 'Загрузка',
    'LBL_SETTINGS' : 'Настройки',
    'LBL_ADD_FILE' : 'Добавить файл',
    'LBL_COMMENT'  : 'Комментарий',
    'LBL_ACCOUNT'  : 'Учетная запись',
    'LBL_CONNECT'  : 'Connect',
    'LBL_ONLINE'   : 'В сети',
    'LBL_OFFLINE'  : 'Не в сети',
    'LBL_AWAY'     : 'Отошел',
    'LBL_BUSY'     : 'Занят',
    'LBL_CHAT'     : 'Чат',
    'LBL_HELP'     : 'Помощь',
    'LBL_ABOUT'    : 'О программе',
    'LBL_PANELS'   : 'Панели',
    'LBL_LOCALES'  : 'Локали',
    'LBL_THEME'    : 'Тема',
    'LBL_COLOR'    : 'Цвет',
    'LBL_PID'      : 'PID',
    'LBL_KILL'     : 'Убить',
    'LBL_ALIVE'    : 'Живой',
    'LBL_INDEX'    : 'Индекс',
    'LBL_ADD'      : 'Добавить',
    'LBL_FONT'     : 'Шрифт',
    'LBL_YES'      : 'Да',
    'LBL_NO'       : 'Нет',
    'LBL_CANCEL'   : 'Отмена',
    'LBL_TOP'      : 'Верх',
    'LBL_LEFT'     : 'Лево',
    'LBL_RIGHT'    : 'Право',
    'LBL_BOTTOM'   : 'Низ',
    'LBL_CENTER'   : 'Центр',
    'LBL_FILE'     : 'Файл',
    'LBL_NEW'      : 'Новый',
    'LBL_OPEN'     : 'Открыть',
    'LBL_SAVE'     : 'Сохранить',
    'LBL_SAVEAS'   : 'Сохранить как...',
    'LBL_CLOSE'    : 'Закрыть',
    'LBL_MKDIR'    : 'Создать каталог',
    'LBL_UPLOAD'   : 'Загрузить',
    'LBL_VIEW'     : 'Вид',
    'LBL_EDIT'     : 'Редактировать',
    'LBL_RENAME'   : 'Переименовать',
    'LBL_DELETE'   : 'Удалить',
    'LBL_OPENWITH' : 'Открыть в ...',
    'LBL_ICONVIEW' : 'Значки',
    'LBL_TREEVIEW' : 'Древовидный',
    'LBL_LISTVIEW' : 'Список',
    'LBL_REFRESH'  : 'Обновить',
    'LBL_VIEWTYPE' : 'Режим просмотра',
    'LBL_BOLD'     : 'Полужирный',
    'LBL_ITALIC'   : 'Курсив',
    'LBL_UNDERLINE': 'Подчеркнутый',
    'LBL_REGULAR'  : 'Обычный',
    'LBL_STRIKE'   : 'Перечеркнутый',
    'LBL_INDENT'   : 'Уменьшить отступ',
    'LBL_OUTDENT'  : 'Увеличить отступ',
    'LBL_UNDO'     : 'Отменить',
    'LBL_REDO'     : 'Поветорить',
    'LBL_CUT'      : 'Вырезать',
    'LBL_UNLINK'   : 'Удалить ссылку',
    'LBL_COPY'     : 'Копировать',
    'LBL_PASTE'    : 'Вставить',
    'LBL_INSERT'   : 'Вставка',
    'LBL_IMAGE'    : 'Изображение',
    'LBL_LINK'     : 'Ссылка',
    'LBL_DISCONNECT'    : 'Disconnect',
    'LBL_APPLICATIONS'  : 'Приложения',
    'LBL_ADD_FOLDER'    : 'Добавить папку',
    'LBL_INFORMATION'   : 'Информация',
    'LBL_TEXT_COLOR'    : 'Цвет текста',
    'LBL_BACK_COLOR'    : 'Цвет фона',
    'LBL_RESET_DEFAULT' : 'Сбросить к стандартным',
    'LBL_DOWNLOAD_COMP' : 'Скачать',
    'LBL_ORDERED_LIST'  : 'Нумерованный список',
    'LBL_BACKGROUND_IMAGE' : 'Фоновое изображение',
    'LBL_BACKGROUND_COLOR' : 'Фоновоый цвет',
    'LBL_UNORDERED_LIST'   : 'Неупорядоченный список'
  };

})();
