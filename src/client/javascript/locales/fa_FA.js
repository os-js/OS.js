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

  OSjs.Locales.fa_FA = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'خطا در باز کردن فايل',
    'ERR_WM_NOT_RUNNING'        : 'مديريت پنجره ها اجرا نشده است',
    'ERR_FILE_OPEN_FMT'         : 'فايل \'**{0}**\' رانمي توان باز کرد',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'برنامه اي که از \'{0}\' فايل پشتيباني کند پيدا نشد',
    'ERR_APP_LAUNCH_FAILED'     : 'اجراي برنامه موفق نبود',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'وقوع خطادر زمان اجراي برنامه: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'برنامه \'{0}\' خطا در سازنده: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'برنامه \'{0}\' init() با خطا مواجه شد: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'نبودن منابع براي برنامه \'{0}\' يا اجرا کردن نا موفق!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'برنامه \'{0}\'قبل بارگزاري با خطا مواجه شد: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'برنامه \'{0}\' قبلا اجرا شده و فقط ميتواند يک نمونه از آن اجرا شود!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'مشکل در اجرا \'{0}\'. اطلاعات فايل مانيفست پيدا نشد!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'مشکل در اجرا \'{0}\'. مرورگر شما از اين نسخه پشتيباني نميکند: {1}',

    'ERR_NO_WM_RUNNING'         : 'مديريت پنجره ها در حال اجرا نيست',
    'ERR_CORE_INIT_FAILED'      : 'اجراي OS.js با مشکل مواجه شد',
    'ERR_CORE_INIT_FAILED_DESC' : 'بروز يک مشکل در زمان اجراي OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'ناتوان در اجراي OS.js: مديريت پنجره مشخص نشده!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'ناتوان در اجراي OS.js: با مشکل مواجه شدن مديريت پنجره : {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'ناتوان در اجراي OS.js: خطا در بارگزاري اوليه منابع ...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'گزارش خطا جاواسکريپت',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'يک خطاي غيره منتظره رخ داد, ممکن است يک باگ باشد.',

    'ERR_APP_API_ERROR'           : 'خظاي API برنامه',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'برنامه {0} با خطا مواجه شدن اجراي عمليات \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'کمبود آرگامنت: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'خطاي ناشناخته',

    'ERR_OPERATION_TIMEOUT'       : 'به اتمام رسيدن عمليات',
    'ERR_OPERATION_TIMEOUT_FMT'   : 'به اتمام رسيدن عمليات ({0})',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'شما قبلا يک پنجره با نام  \'{0}\'',
    'WINDOW_MINIMIZE' : 'تمام صفحه',
    'WINDOW_MAXIMIZE' : 'کوچک  شدن صفحه',
    'WINDOW_RESTORE'  : 'بازيابي',
    'WINDOW_CLOSE'    : 'بستن',
    'WINDOW_ONTOP_ON' : 'برروي همه (فعال)',
    'WINDOW_ONTOP_OFF': 'برري همه(غيرفعال)',

    // Handler
    'TITLE_SIGN_OUT' : 'خروج',
    'TITLE_SIGNED_IN_AS_FMT' : 'وارد شده با نام : {0}',
    'ERR_LOGIN_FMT' : 'خطاي ورود: {0}',
    'ERR_LOGIN_INVALID' : 'نا معتبر بودن ورود',

    // SESSION
    'MSG_SESSION_WARNING' : 'آيا شما مطمئن به خارح شدن از برنامه  هستيد? تماميه اطلاعات ذخيره نشد پنجره ها از بين خواهند رفت!',

    // Service
    'BUGREPORT_MSG' : 'درصورتي که تصورميکنيد اين يک باگ است گزارش دهيد.\nشامل توضيح کوتاهي که چگونه اين اتفاق افتاد, و اگر شما توانستد  برطرف کنيد نحوه آن را اطلاع دهيد',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'وارد شدن به سرويس هاي خارجي: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'خطاي مخرب',
    'ERR_UTILS_XHR_FMT' : 'AJAX/XHR خطاي: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'خروج از برنامه', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'خروج کاربر \'{0}\'.\nآيا نميخواهيد جلسه جاري حفظ شود?',

    'DIALOG_CLOSE' : 'بستن',
    'DIALOG_CANCEL': 'انصراف',
    'DIALOG_APPLY' : 'اعمال',
    'DIALOG_OK'    : 'تاييد',

    'DIALOG_ALERT_TITLE' : 'ديالوگ هشدار',

    'DIALOG_COLOR_TITLE' : 'ديالوگ رنگ',
    'DIALOG_COLOR_R' : 'قرمز: {0}',
    'DIALOG_COLOR_G' : 'سبز: {0}',
    'DIALOG_COLOR_B' : 'آبي: {0}',
    'DIALOG_COLOR_A' : 'آلفا: {0}',

    'DIALOG_CONFIRM_TITLE' : 'ديالوگ تاييد',

    'DIALOG_ERROR_MESSAGE'   : 'پيام',
    'DIALOG_ERROR_SUMMARY'   : 'خلاصه',
    'DIALOG_ERROR_TRACE'     : 'پيگيري',
    'DIALOG_ERROR_BUGREPORT' : 'گزارش باگ',

    'DIALOG_FILE_SAVE'      : 'ذخيره',
    'DIALOG_FILE_OPEN'      : 'بازکردن',
    'DIALOG_FILE_MKDIR'     : 'پوشه جديد',
    'DIALOG_FILE_MKDIR_MSG' : 'ساخت پوشه در مسير **{0}**',
    'DIALOG_FILE_OVERWRITE' : 'داشتن حصول اطمينان از رونوشت فايل \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'نوع نمايش',
    'DIALOG_FILE_MNU_LISTVIEW' : 'نمايش ليست',
    'DIALOG_FILE_MNU_TREEVIEW' : 'نمايش درختي',
    'DIALOG_FILE_MNU_ICONVIEW' : 'نمايش آيکون',
    'DIALOG_FILE_ERROR'        : 'خطاي ديالوگ فايل',
    'DIALOG_FILE_ERROR_SCANDIR': 'خطا در ليست کردن مسير \'{0}\' به دليل رخ دادن يک خطا',
    'DIALOG_FILE_MISSING_FILENAME' : 'شما ميبايست يک فايل انتخاب کنيد يا يک نام فايل جديد وارد کنيد!',
    'DIALOG_FILE_MISSING_SELECTION': 'شما مي بايست يک فايل انتخاب کنيد!',

    'DIALOG_FILEINFO_TITLE'   : 'اطلاعات فايل',
    'DIALOG_FILEINFO_LOADING' : 'بارکزاري اطلاعات فايل براي: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'خطاي ديالوک انتقال فايل',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'مشکل در گرفتن اطلاعات فايل براي **{0}**',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'مشکل در گرفتن اطلاعات فايل براي: {0}',

    'DIALOG_INPUT_TITLE' : 'ديالوگ ورودي',

    'DIALOG_FILEPROGRESS_TITLE'   : 'پروسه عمليات فايل',
    'DIALOG_FILEPROGRESS_LOADING' : 'بارگزاري...',

    'DIALOG_UPLOAD_TITLE'   : 'ديالوگ ارسال فايل',
    'DIALOG_UPLOAD_DESC'    : 'ارسال فايل به **{0}**.<br />بيشترين اندازه: {1} بايت',
    'DIALOG_UPLOAD_MSG_FMT' : 'بارگزاري',
    'DIALOG_UPLOAD_MSG'     : 'درحال ارسال فايل...',
    'DIALOG_UPLOAD_FAILED'  : 'ارسال فايل با خطا مواجه شد',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'ارسال فايل با خطا مواجه شده است',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'دليل ناشناخته...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'انصراف به وسيله کاربر...',
    'DIALOG_UPLOAD_TOO_BIG': 'فايل بيش ازاندازه بزرگ است',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'فايل بيش از اندازه بزرک است, سقف {0}',

    'DIALOG_FONT_TITLE' : 'ديالوگ فونت',

    'DIALOG_APPCHOOSER_TITLE' : 'انتخاب برنامه',
    'DIALOG_APPCHOOSER_MSG'   : 'انتخاب يک برنامه براي باز شدن',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'شما ميبايست يک برنامه انتخاب کنيد',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'استفاده به عنوان پيش فرض براي {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : ' ماژول GoogleAPI پيکربندي نشده يا غير فعال ميباشد',
    'GAPI_SIGN_OUT'           : 'خارج شدن از API هاي سرويس هاي گوگل',
    'GAPI_REVOKE'             : 'رد مجوز هاو خروج از برنامه',
    'GAPI_AUTH_FAILURE'       : 'Google API تشخيض هويت با مشکل واجه شد و يا اتفاق نيافتاد',
    'GAPI_AUTH_FAILURE_FMT'   : 'با مشکل مواجه شدن تشخيص هويت: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'مشکل با بارگزاري Google API',

    // Windows Live API
    'WLAPI_DISABLED'          : 'ماژول هاي Windows Live API پيکربندي نشده و يا غير فعال مي باشد',
    'WLAPI_SIGN_OUT'          : 'خروج از Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'مشکل در بارگزاري Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'مشکل در ثبت لاگ در Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : 'مشکل ثبت لاگ در Windows Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API ارجاع {0} وضعيت',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'قادر به ايجاد IndexDB بدون نام پايگاه داده ها نمي باشيم',
    'IDB_NO_SUCH_ITEM'   : 'آيتم اين چنين نميباد',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'خطاي بحراني',
    'ERR_VFS_UNAVAILABLE'     : 'موجود نمي باشد',
    'ERR_VFS_FILE_ARGS'       : 'فايل حدااقل يک آرگامنت مي خواهد',
    'ERR_VFS_NUM_ARGS'        : 'آرگامنت ها کافي نيست',
    'ERR_VFS_EXPECT_FILE'     : 'انتظار يک شي فايلي',
    'ERR_VFS_EXPECT_SRC_FILE' : 'انتظار يک شي فايلي منبع',
    'ERR_VFS_EXPECT_DST_FILE' : 'انتظار شي فايلي مقصد',
    'ERR_VFS_FILE_EXISTS'     : 'مقصد قبلا وجود دارد',
    'ERR_VFS_TRANSFER_FMT'    : 'بروز مشکل در زمان انتقال بين ذخيره کننده ها: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'بدون اطلاعات مقصد قادر به ارسال فايل نمي باشد',
    'ERR_VFS_UPLOAD_NO_FILES' : 'بدن مشخص کردن فايل امکان پذير نمي باشد',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'ارسال فايل به مشکل برخورد کرد: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'ارسال فايل لغو شد',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'دانلود فايل بدون انتخاب فايل امکان پذير نميباشد',
    'ERR_VFS_DOWNLOAD_FAILED' : 'بروز مشکل در حين دانلود فايل : {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'پاسخ تهي ميباشد',

    'ERR_VFSMODULE_INVALID'            : 'ماژول VFS نا م عتبر ميباشد',
    'ERR_VFSMODULE_INVALID_FMT'        : ' ماژول VFS نامعتبر ميباشد : {0}',
    'ERR_VFSMODULE_INVALID_METHOD'     : 'متد VُّّFS نامعتبر مي باشد',
    'ERR_VFSMODULE_INVALID_METHOD_FMT' : 'متد VُّّFS نامعتبر مي باشد: {0}',
    'ERR_VFSMODULE_INVALID_TYPE'       : 'نوع ماژول VFS نامعتبر ميباشد',
    'ERR_VFSMODULE_INVALID_TYPE_FMT'   : 'نوع ماژول VFS نامعتبر ميباشد: {0}',
    'ERR_VFSMODULE_INVALID_CONFIG'     : 'پيکربندي ماژول VFS نامعتبر مي باشد',
    'ERR_VFSMODULE_INVALID_CONFIG_FMT' : 'پيکربندي ماژول VFS نامعتبر مي باشد: {0}',
    'ERR_VFSMODULE_ALREADY_MOUNTED'    : 'ماژول VFS قبلا الصاق شده است',
    'ERR_VFSMODULE_ALREADY_MOUNTED_FMT': 'ماژول VFS \'{0}\' قابلا الصاق شده ',
    'ERR_VFSMODULE_NOT_MOUNTED'        : 'ماژول VFS  الصاق نشده',
    'ERR_VFSMODULE_NOT_MOUNTED_FMT'    : 'ماؤول VFS \'{0}\' الصاق نشده است',
    'ERR_VFSMODULE_EXCEPTION'          : 'بروز خطا در ماژول VFS',
    'ERR_VFSMODULE_EXCEPTION_FMT'      : 'بروز خطا در ماژول VFS : {0}',

    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'در حال دانلود فايل',

    'ERR_VFSMODULE_XHR_ERROR'      : 'XHR خطاي',
    'ERR_VFSMODULE_ROOT_ID'        : 'پيدا کردن شناسه پوشه روت با خطا مواجه شد',
    'ERR_VFSMODULE_NOSUCH'         : 'فايل موحود نيست',
    'ERR_VFSMODULE_PARENT'         : 'والدين اين چنين وجود ندارد',
    'ERR_VFSMODULE_PARENT_FMT'     : 'جستجوي والدين با خطا مواجه شد: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'اسکن دايرکتوري باخطا موجه شد',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'اسکن دايرکتوري باخطا موجه شد: {0}',
    'ERR_VFSMODULE_READ'           : 'خواندن فايل با خطا مواجه شد',
    'ERR_VFSMODULE_READ_FMT'       : 'خواندن فايل با خطا مواجه شد: {0}',
    'ERR_VFSMODULE_WRITE'          : 'نوشتن فايل با خطا مواجه شد',
    'ERR_VFSMODULE_WRITE_FMT'      : 'نوشتن فايل با خطا موجه شد: {0}',
    'ERR_VFSMODULE_COPY'           : 'کپي با خطا مواجه شد',
    'ERR_VFSMODULE_COPY_FMT'       : 'کپي با خطا مواجه شد: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'قطع اتصال با خطا مواجه شد',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'قطع ارتباط با شکست مواجه شد: {0}',
    'ERR_VFSMODULE_MOVE'           : 'جابه جايي فايل با شکست مواجه شد',
    'ERR_VFSMODULE_MOVE_FMT'       : 'جابه جايي فايل با شکست مواجه شد: {0}',
    'ERR_VFSMODULE_EXIST'          : 'برسي موجود بودن فايل با مشکل مواجه شد',
    'ERR_VFSMODULE_EXIST_FMT'      : 'برسي موجود بودن فايل با مشکل مواجه شد: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'به دست آرودن اطلاعات فايل با مشکل مواجه شد',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'به دست آرودن اطلاعات فايل با مشکل مواجه شد: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'ساخت دايرکتوري با مشکل مواجه شد',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'به دست آرودن اطلاعات فايل با مشکل مواجه شد: {0}',
    'ERR_VFSMODULE_URL'            : 'به دست آوردن URL فايل با مشکل مواجه شد',
    'ERR_VFSMODULE_URL_FMT'        : 'به دست آوردن URL فايل با مشکل مواجه شد: {0}',
    'ERR_VFSMODULE_TRASH'          : 'انتقال فايل به سطل زباله با مشکل مواجه شد',
    'ERR_VFSMODULE_TRASH_FMT'      : 'انتقال فايل به سطل زباله با مشکل مواجه شد: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'بازيافت فايل با مشکل مواجه شد',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'بازيافت فايل با مشکل مواجه شد: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'تخليه سطل زباله با مشکل مواجه شد',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'تخليه سطل زباله با مشکل مواجه شد: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'شما به وسيله DroBox API ثبت ورود کرده ايد',
    'DROPBOX_SIGN_OUT'           : 'خروج از سرويس هاي Google API',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'آيتم پيدا نشد: حل و فصل مسير با مشکل مواجه شد',

    // ZIP
    'ZIP_PRELOAD_FAIL'  : 'بار گزاري zip.js  با مشکل مواجه شد',
    'ZIP_VENDOR_FAIL'   : 'کتابخانه zip.js پيدا نشد : آيا شما موارد متعلق به آن را بارگزاري کرده ايد ?',
    'ZIP_NO_RESOURCE'   : 'هيچ يک از منابع zip داده نشده است',
    'ZIP_NO_PATH'       : 'مسيري داده نشده است',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'ميسر نصب بسته قبلا وجود دارد. قادر به ادامه نميباشيم!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'باز کردن فايل امکان پذير نيست',
    'ERR_FILE_APP_OPEN_FMT'     : 'فايل {0} قابل باز کردن نمي باشد به دليل اينکه نوع  {1} پشنيباي نميشود',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'فايل {0} را نمي توان باز کرد',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'فايل {0} قادر ذخيره کردن نمي باشد',
    'ERR_GENERIC_APP_FMT'       : '{0} خطاي برنامه',
    'ERR_GENERIC_APP_ACTION_FMT': 'مشکل در اجراي فرآيند \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'خطاي ناشناخته',
    'ERR_GENERIC_APP_REQUEST'   : 'درحال اجراي درخواست شما يک خطا اتفاق افتاد',
    'ERR_GENERIC_APP_FATAL_FMT' : 'خطاي مخرب: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'لغو تغييرات?',
    'MSG_FILE_CHANGED'          : 'فايل تغيير کرده است.آيا دوباره بازگزاري شود؟',
    'MSG_APPLICATION_WARNING'   : 'هشدار برنامه',
    'MSG_MIME_OVERRIDE'         : 'نوع فايل "{0}" پشتيباني نميشود, ولي از نوع "{1}" استفاده شود.',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'ناشناخته',
    'LBL_APPEARANCE'   : 'ظاهر',
    'LBL_USER'         : 'کاربر',
    'LBL_NAME'         : 'نام',
    'LBL_APPLY'        : 'اعمال',
    'LBL_FILENAME'     : 'نام فايل',
    'LBL_PATH'         : 'مسير',
    'LBL_SIZE'         : 'حجم',
    'LBL_TYPE'         : 'نوع',
    'LBL_MIME'         : 'نوع',
    'LBL_LOADING'      : 'درحال بارگزاري',
    'LBL_SETTINGS'     : 'تنظيمات',
    'LBL_ADD_FILE'     : 'اضافه کردن فايل',
    'LBL_COMMENT'      : 'نظر',
    'LBL_ACCOUNT'      : 'حساب',
    'LBL_CONNECT'      : 'متصل',
    'LBL_ONLINE'       : 'روي خط',
    'LBL_OFFLINE'      : 'چراغ خاموش',
    'LBL_AWAY'         : 'دور',
    'LBL_BUSY'         : 'مشغول',
    'LBL_CHAT'         : 'چت',
    'LBL_HELP'         : 'کمک',
    'LBL_ABOUT'        : 'درباره',
    'LBL_PANELS'       : 'پنل ها',
    'LBL_LOCALES'      : 'موقعيت ها',
    'LBL_THEME'        : 'شمايل',
    'LBL_COLOR'        : 'رنگ',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'کشتن',
    'LBL_ALIVE'        : 'زنده',
    'LBL_INDEX'        : 'ايندکس',
    'LBL_ADD'          : 'اضافه',
    'LBL_FONT'         : 'فونت',
    'LBL_YES'          : 'بله',
    'LBL_NO'           : 'نه',
    'LBL_CANCEL'       : 'انصراف',
    'LBL_TOP'          : 'روي',
    'LBL_LEFT'         : 'چپ',
    'LBL_RIGHT'        : 'راست',
    'LBL_BOTTOM'       : 'پايين',
    'LBL_CENTER'       : 'مرکز',
    'LBL_FILE'         : 'فايل',
    'LBL_NEW'          : 'جديد',
    'LBL_OPEN'         : 'بازکردن',
    'LBL_SAVE'         : 'ذخيره کردن',
    'LBL_SAVEAS'       : 'ذخيره کردن به صورت...',
    'LBL_CLOSE'        : 'بستن',
    'LBL_MKDIR'        : 'ايجاد مسير',
    'LBL_UPLOAD'       : 'ارسال',
    'LBL_VIEW'         : 'نمايش',
    'LBL_EDIT'         : 'ويرايش',
    'LBL_RENAME'       : 'تغيير نام',
    'LBL_DELETE'       : 'حذف',
    'LBL_OPENWITH'     : 'بازکردن با ...',
    'LBL_ICONVIEW'     : 'نمايش آيکون',
    'LBL_TREEVIEW'     : 'نمايش درختي',
    'LBL_LISTVIEW'     : 'نمايش ليست',
    'LBL_REFRESH'      : 'تازه کردن',
    'LBL_VIEWTYPE'     : 'نمايش نوع',
    'LBL_BOLD'         : 'درشت',
    'LBL_ITALIC'       : 'ايتاليک',
    'LBL_UNDERLINE'    : 'زير خط',
    'LBL_REGULAR'      : 'قاعده',
    'LBL_STRIKE'       : 'Strike',
    'LBL_INDENT'       : 'مقصود',
    'LBL_OUTDENT'      : 'خارج از تاريخ',
    'LBL_UNDO'         : 'برعکس ',
    'LBL_REDO'         : 'دوباره کار',
    'LBL_CUT'          : 'قطع کردن',
    'LBL_UNLINK'       : 'برخلاف',
    'LBL_COPY'         : 'کپي',
    'LBL_PASTE'        : 'در اين محل',
    'LBL_INSERT'       : 'درج',
    'LBL_IMAGE'        : 'تصوير',
    'LBL_LINK'         : 'اتصال',
    'LBL_DISCONNECT'    : 'قطع ارتباط',
    'LBL_APPLICATIONS'  : 'برنامه ها',
    'LBL_ADD_FOLDER'    : 'اضاقه کردن پوشه',
    'LBL_INFORMATION'   : 'اطلاعات',
    'LBL_TEXT_COLOR'    : 'رنگ متن',
    'LBL_BACK_COLOR'    : 'رنگ سياه',
    'LBL_RESET_DEFAULT' : 'برگردان به تنظيمات اوليه',
    'LBL_DOWNLOAD_COMP' : 'دانلود به کامپيوتر',
    'LBL_ORDERED_LIST'  : 'ليست مرتب شده',
    'LBL_BACKGROUND_IMAGE' : 'تصوير پس زمينه',
    'LBL_BACKGROUND_COLOR' : 'رنگ پس زمينه',
    'LBL_UNORDERED_LIST'   : 'ليست مرتب نشده',
    'LBL_STATUS'   : 'وضعيت ها',
    'LBL_READONLY' : 'فقط خواندني',
    'LBL_CREATED' : 'ايجاد شده',
    'LBL_MODIFIED' : 'تغيير داده شده',
    'LBL_SHOW_COLUMNS' : 'نمايش ستون ها',
    'LBL_MOVE' : 'حرکت',
    'LBL_OPTIONS' : 'انتخاب',
    'LBL_OK' : 'تاييد',
    'LBL_DIRECTORY' : 'دايرکتوري',
    'LBL_CREATE' : 'ايجاد کردن',
    'LBL_BUGREPORT' : 'گزارش مشکل',
    'LBL_INSTALL' : 'نصب',
    'LBL_UPDATE' : 'به روز رساني',
    'LBL_REMOVE' : 'برداشتن',
    'LBL_SHOW_SIDEBAR' : 'نمايش نوار لغزنده',
    'LBL_SHOW_NAVIGATION' : 'نمايش ناوبري',
    'LBL_SHOW_HIDDENFILES' : 'نمايش فايل هاي مخفي',
    'LBL_SHOW_FILEEXTENSIONS' : 'نمايش پسوند فايل'
  };

})();
