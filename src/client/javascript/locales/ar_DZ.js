/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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
 * @author  Mohammed Seddik Laraba <lmseddik@icloud.com>
 * @licence Simplified BSD License
 */
/*eslint key-spacing: "off"*/

module.exports = {
  //
  // CORE
  //

  'ERR_FILE_OPEN'             : 'خطأ فتح الملف',
  'ERR_WM_NOT_RUNNING'        : 'مسيير النوافذ ليس قيد التشغيل',
  'ERR_FILE_OPEN_FMT'         : ' الملف \'**{0}**\' غير قابل للفتح من طرف النظام',
  'ERR_APP_MIME_NOT_FOUND_FMT': 'لم يتمكن النظام من إيجاد تطبيق يدعم هذه الملفات \'{0}\' files',
  'ERR_APP_LAUNCH_FAILED'     : 'خطأ في تشغيل التطبيق',
  'ERR_APP_LAUNCH_FAILED_FMT' : 'حدث خطأ أثناء محاولة التشغيل: {0}',
  'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'التطبيق \'{0}\' construct فشل: {1}',
  'ERR_APP_INIT_FAILED_FMT'       : 'التطبيق \'{0}\' init() فشل: {1}',
  'ERR_APP_RESOURCES_MISSING_FMT' : 'موارد التطبيق ناقصة لـ \'{0}\' أو لم تتمكن من التشغيل!',
  'ERR_APP_PRELOAD_FAILED_FMT'    : 'التطبيق \'{0}\' preloading failed: \n{1}',
  'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'The application \'{0}\' is already launched and allows only one instance!',
  'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'خطأ في تشغيل \'{0}\'. لا توجد تعاريف للتطبيق!',
  'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'خطأ في تشغيل \'{0}\'. متصفحك غير مدعوم: {1}',

  'ERR_NO_WM_RUNNING'         : 'لايوجد أي مسيير نوافذ قيد التشغيل',
  'ERR_CORE_INIT_FAILED'      : 'Failed to initialize OS.js',
  'ERR_CORE_INIT_FAILED_DESC' : 'حدث خطأ أثناء بداية تشغيل OS.js',
  'ERR_CORE_INIT_NO_WM'       : 'لا يمكن تشغيل OS.js: لايوجد مسيير نوافذ!',
  'ERR_CORE_INIT_WM_FAILED_FMT'   : 'لايمكن تشغيل OS.js: فشل في تحميل مسير النوافذ: {0}',
  'ERR_CORE_INIT_PRELOAD_FAILED'  : 'لايمكن تشغيل OS.js: فشل في تحميل الموارد...',
  'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript إشعار بخطأ',
  'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'خطأ غير متوقع.',

  'ERR_APP_API_ERROR'           : 'خطأ في API التطبيق ',
  'ERR_APP_API_ERROR_DESC_FMT'  : 'التطبيق {0} لم يستطيع أن يقوم بالعملية \'{1}\'',
  'ERR_APP_MISSING_ARGUMENT_FMT': 'نقص في لعناصر : {0}',
  'ERR_APP_UNKNOWN_ERROR'       : 'خطأ غير معروف',

  'ERR_OPERATION_TIMEOUT'       : 'نهاية الوقت المسموع للعملية',
  'ERR_OPERATION_TIMEOUT_FMT'   : 'نهاية الوقت المسموح للعملية ({0})',

  'ERR_ARGUMENT_FMT'    : '\'{0}\' متوقع \'{1}\' أن تكون \'{2}\', \'{3}\' معطى',

  // Window
  'ERR_WIN_DUPLICATE_FMT' : 'لديك نافذة مسبقا بإسم \'{0}\'',
  'WINDOW_MINIMIZE' : 'تصغير',
  'WINDOW_MAXIMIZE' : 'تكبير',
  'WINDOW_RESTORE'  : 'إستعادة',
  'WINDOW_CLOSE'    : 'إغلاق',
  'WINDOW_ONTOP_ON' : 'فوق الجميع (تشغيل)',
  'WINDOW_ONTOP_OFF': 'فوق الجميع (تعطيل)',

  // Handler
  'TITLE_SIGN_OUT' : 'تسجيل الخروج',
  'TITLE_SIGNED_IN_AS_FMT' : 'متصل بإسم: {0}',
  'ERR_LOGIN_FMT' : 'خطأ تسجيل الدخول: {0}',
  'ERR_LOGIN_INVALID' : 'تسجيل دخول غير موجود',

  // SESSION
  'ERR_NO_SESSION': 'لا توجد أي حصة منشأة، هل تريد التجربة مرة أخرى ؟',
  'MSG_SESSION_WARNING' : 'هل تريد بالتأكيد الخروج من OS.js ؟ جميع التغيرات الغير محفوظة ستلغى !',

  // Service
  'BUGREPORT_MSG' : 'الرجاء إشعارنا إذا ضننت أن هذا خطأ،\n أضف شرح قصير حول كيفية حدوث الخطأ، وإن أمكن كيفية إعادة إستحداث الخطأ مرة أخرى',

  // API
  'SERVICENOTIFICATION_TOOLTIP' : 'تسجيل دخول إلى خدمات خارجية: {0}',

  // Utils
  'ERR_UTILS_XHR_FATAL' : 'خطأ مميت',
  'ERR_UTILS_XHR_FMT' : 'AJAX/XHR خطأ: {0}',

  //
  // DIALOGS
  //
  'DIALOG_LOGOUT_TITLE' : 'تسجيل الخروج (خروج)', // Actually located in session.js
  'DIALOG_LOGOUT_MSG_FMT' : 'خروج المستخدم \'{0}\'.\nهل تريد بالتأكيد إنهاء الحصة الجارية?',

  'DIALOG_CLOSE' : 'إغلاق',
  'DIALOG_CANCEL': 'إلغاء',
  'DIALOG_APPLY' : 'تطبيق',
  'DIALOG_OK'    : 'موافق',

  'DIALOG_ALERT_TITLE' : 'نافذة التحذير',

  'DIALOG_COLOR_TITLE' : 'نافذة الألوان',
  'DIALOG_COLOR_R' : 'أحمر: {0}',
  'DIALOG_COLOR_G' : 'أخضر: {0}',
  'DIALOG_COLOR_B' : 'أزرق: {0}',
  'DIALOG_COLOR_A' : 'ألفا: {0}',

  'DIALOG_CONFIRM_TITLE' : 'نافذة التأكيد',

  'DIALOG_ERROR_MESSAGE'   : 'رسالة',
  'DIALOG_ERROR_SUMMARY'   : 'الحوصلة',
  'DIALOG_ERROR_TRACE'     : 'إتباع',
  'DIALOG_ERROR_BUGREPORT' : 'إشعار بخطأ',

  'DIALOG_FILE_SAVE'      : 'حفظ',
  'DIALOG_FILE_OPEN'      : 'فتح',
  'DIALOG_FILE_MKDIR'     : 'مجلد جديد',
  'DIALOG_FILE_MKDIR_MSG' : 'إنشاء مجلد جديد في **{0}**',
  'DIALOG_FILE_OVERWRITE' : 'هل تريد بالتأكيد تجاوز وإستبدال الملف \'{0}\'?',
  'DIALOG_FILE_MNU_VIEWTYPE' : 'نوع المظهر',
  'DIALOG_FILE_MNU_LISTVIEW' : 'مظهر القائمة',
  'DIALOG_FILE_MNU_TREEVIEW' : 'مظهر الشجرة',
  'DIALOG_FILE_MNU_ICONVIEW' : 'مظهر الأيقونات',
  'DIALOG_FILE_ERROR'        : 'خطأ نافذة الملفات',
  'DIALOG_FILE_ERROR_SCANDIR': 'فشل إظهار محتوي المجلد \'{0}\' بسبب حدوث خطأ',
  'DIALOG_FILE_ERROR_FIND': 'فشل البحث في المجلد \'{0}\' بسبب حدوث خطأ',
  'DIALOG_FILE_MISSING_FILENAME' : 'يجب إختيار ملف أو إدخال ملف جديد!',
  'DIALOG_FILE_MISSING_SELECTION': 'يجب إختيار ملف!',

  'DIALOG_FILEINFO_TITLE'   : 'معلومات الملف',
  'DIALOG_FILEINFO_LOADING' : 'تحميل معلومات الملف: {0}',
  'DIALOG_FILEINFO_ERROR'   : 'نافذة معلومات الملف خطأ',
  'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'فشل في تحديد معلومات الملف for **{0}**',
  'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'فشل في تحديد معلومات الملف for: {0}',

  'DIALOG_INPUT_TITLE' : 'نافذة الإدخال',

  'DIALOG_FILEPROGRESS_TITLE'   : 'عملية على الملفات جارية',
  'DIALOG_FILEPROGRESS_LOADING' : 'تحميل...',

  'DIALOG_UPLOAD_TITLE'   : 'نافذة رفع الملفات',
  'DIALOG_UPLOAD_DESC'    : 'رفم الملف إلى **{0}**.<br />حد الحجم: {1} bytes',
  'DIALOG_UPLOAD_MSG_FMT' : 'جاري الرفع \'{0}\' ({1} {2}) to {3}',
  'DIALOG_UPLOAD_MSG'     : 'جاري رفع الملف...',
  'DIALOG_UPLOAD_FAILED'  : 'رفع الملف',
  'DIALOG_UPLOAD_FAILED_MSG'      : 'خطأ رفع الملف',
  'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'أسباب غير معروفة...',
  'DIALOG_UPLOAD_FAILED_CANCELLED': 'إلغي من طرف المستخدم...',
  'DIALOG_UPLOAD_TOO_BIG': 'ملف كبير جدا',
  'DIALOG_UPLOAD_TOO_BIG_FMT': 'ملف كبير جدا, تخطى {0}',

  'DIALOG_FONT_TITLE' : 'نافذة الخطوط',

  'DIALOG_APPCHOOSER_TITLE' : 'إختيار التطبيق',
  'DIALOG_APPCHOOSER_MSG'   : 'إختار تطبيق لفتحه',
  'DIALOG_APPCHOOSER_NO_SELECTION' : 'يجب إختيار تطبيق',
  'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'إستخدام كتطبيق إفتراضي دائم {0}',

  //
  // HELPERS
  //

  // GoogleAPI
  'GAPI_DISABLED'           : 'GoogleAPI Module not configured or disabled',
  'GAPI_SIGN_OUT'           : 'Sign out from Google API Services',
  'GAPI_REVOKE'             : 'Revoke permissions and Sign Out',
  'GAPI_AUTH_FAILURE'       : 'Google API Authentication failed or did not take place',
  'GAPI_AUTH_FAILURE_FMT'   : 'Failed to authenticate: {0}:{1}',
  'GAPI_LOAD_FAILURE'       : 'Failed to load Google API',

  // Windows Live API
  'WLAPI_DISABLED'          : 'Windows Live API module not configured or disabled',
  'WLAPI_SIGN_OUT'          : 'Sign out from Window Live API',
  'WLAPI_LOAD_FAILURE'      : 'Failed to load Windows Live API',
  'WLAPI_LOGIN_FAILED'      : 'Failed to log into Windows Live API',
  'WLAPI_LOGIN_FAILED_FMT'  : 'Failed to log into Windows Live API: {0}',
  'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API returned {0} status',

  // IndexedDB
  'IDB_MISSING_DBNAME' : 'لا يمكن إنشاء IndexedDB دون إسم قاعدة معطيات',
  'IDB_NO_SUCH_ITEM'   : 'عنصر غير موجود',

  //
  // VFS
  //
  'ERR_VFS_FATAL'            : 'خطأ مميت',
  'ERR_VFS_UNAVAILABLE'      : 'غير متوفر',
  'ERR_VFS_FILE_ARGS'        : 'ملف ينتظر على الأقل عنصر',
  'ERR_VFS_NUM_ARGS'         : 'عدد العناصر غير كافي',
  'ERR_VFS_EXPECT_FILE'      : 'متوقع ملف',
  'ERR_VFS_EXPECT_SRC_FILE'  : 'متوقع مصدر الملف',
  'ERR_VFS_EXPECT_DST_FILE'  : 'متوقع وجهة الملف',
  'ERR_VFS_FILE_EXISTS'      : 'وجهة موجودة مسبقا',
  'ERR_VFS_TARGET_NOT_EXISTS': 'وجهة غير موجودة',
  'ERR_VFS_TRANSFER_FMT'     : 'حدث خطأ أثناء التحويل من مساحات التخزين: {0}',
  'ERR_VFS_UPLOAD_NO_DEST'   : 'لا يمكن رفع ملف من دون وجهة',
  'ERR_VFS_UPLOAD_NO_FILES'  : 'لا يمكن رفع الملفات من دون تعيينها',
  'ERR_VFS_UPLOAD_FAIL_FMT'  : 'خطأ رفع الملف: {0}',
  'ERR_VFS_UPLOAD_CANCELLED' : 'تك إلغاء رفع الملف',
  'ERR_VFS_DOWNLOAD_NO_FILE' : 'لا يمكن رفع مسار من دون مسار',
  'ERR_VFS_DOWNLOAD_FAILED'  : 'حدث خطأ أثناء تحميل: {0}',
  'ERR_VFS_REMOTEREAD_EMPTY' : 'الإجابة كانت فارغة',

  'ERR_VFSMODULE_INVALID'            : 'قسم VFS غير صحيح',
  'ERR_VFSMODULE_INVALID_FMT'        : 'قسم VFS غير صحيح: {0}',
  'ERR_VFSMODULE_INVALID_METHOD'     : 'قسم VFS طريقة',
  'ERR_VFSMODULE_INVALID_METHOD_FMT' : 'قسم VFS طريقة: {0}',
  'ERR_VFSMODULE_INVALID_TYPE'       : 'نوع القسم VFS غير صحيح',
  'ERR_VFSMODULE_INVALID_TYPE_FMT'   : 'نوع القسم VFS غير صحيح: {0}',
  'ERR_VFSMODULE_INVALID_CONFIG'     : 'إعدادات القسم VFS غير صحيحة',
  'ERR_VFSMODULE_INVALID_CONFIG_FMT' : 'إعدادات القسم VFS إعدادات القسم: {0}',
  'ERR_VFSMODULE_ALREADY_MOUNTED'    : 'قسم VFS مركب مسبقا',
  'ERR_VFSMODULE_ALREADY_MOUNTED_FMT': 'قسم VFS \'{0}\' مركب مسبقا',
  'ERR_VFSMODULE_NOT_MOUNTED'        : 'قسم VFS غير مركب',
  'ERR_VFSMODULE_NOT_MOUNTED_FMT'    : 'قسم VFS \'{0}\' غير مركب',
  'ERR_VFSMODULE_EXCEPTION'          : 'قسم VFS خطأ',
  'ERR_VFSMODULE_EXCEPTION_FMT'      : 'قسم VFS خطأ: {0}',
  'ERR_VFSMODULE_NOT_FOUND_FMT'      : 'لا يوجد VFS {0}. خطأ في شاكلة المسار ?',
  'ERR_VFSMODULE_READONLY'           : 'هذا VFS للقراءة فقط',
  'ERR_VFSMODULE_READONLY_FMT'       : 'هذا VFS  للقراءة فقط : {0}',

  'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'جاري تحميل الملف',

  'ERR_VFSMODULE_XHR_ERROR'      : 'XHR خطأ',
  'ERR_VFSMODULE_ROOT_ID'        : 'خطأ تحديد معرف root',
  'ERR_VFSMODULE_NOSUCH'         : 'ملف غير موجود',
  'ERR_VFSMODULE_PARENT'         : 'لا يوجد أب',
  'ERR_VFSMODULE_PARENT_FMT'     : 'فشل البحث عن أب: {0}',
  'ERR_VFSMODULE_SCANDIR'        : 'فشل مسح المجلد',
  'ERR_VFSMODULE_SCANDIR_FMT'    : 'فشل مسح المجلد : {0}',
  'ERR_VFSMODULE_READ'           : 'فشل قراءة الملف',
  'ERR_VFSMODULE_READ_FMT'       : 'فشل قراءة الملف: {0}',
  'ERR_VFSMODULE_WRITE'          : 'فشل الكتابة في الملف',
  'ERR_VFSMODULE_WRITE_FMT'      : 'فشل الكتابة في الملف: {0}',
  'ERR_VFSMODULE_COPY'           : 'فشل في النسخ',
  'ERR_VFSMODULE_COPY_FMT'       : 'فشل في النسخ: {0}',
  'ERR_VFSMODULE_UNLINK'         : 'فشل في حذف رابط الملف',
  'ERR_VFSMODULE_UNLINK_FMT'     : 'فشل في حذف رابط الملف: {0}',
  'ERR_VFSMODULE_MOVE'           : 'فشل في تحريك الملف',
  'ERR_VFSMODULE_MOVE_FMT'       : 'فشل في تحريك الملف: {0}',
  'ERR_VFSMODULE_EXIST'          : 'فشل في تحديد وجود الملف',
  'ERR_VFSMODULE_EXIST_FMT'      : 'فشل في تحديد وجود الملف: {0}',
  'ERR_VFSMODULE_FILEINFO'       : 'فشل في تحديد معلومات الملف',
  'ERR_VFSMODULE_FILEINFO_FMT'   : 'فشل في تحديد معلومات الملف: {0}',
  'ERR_VFSMODULE_MKDIR'          : 'فشل في إنشاء المجلد',
  'ERR_VFSMODULE_MKDIR_FMT'      : 'فشل في إنشاء المجلد: {0}',
  'ERR_VFSMODULE_URL'            : 'فشل في الحصول على رابط الملف',
  'ERR_VFSMODULE_URL_FMT'        : 'فشل في الحصول على رابط الملف: {0}',
  'ERR_VFSMODULE_TRASH'          : 'فشل في تحريك الملف إلى سلة المحذوفات',
  'ERR_VFSMODULE_TRASH_FMT'      : 'فشل في تحريك الملف إلى سلة المحذوفات: {0}',
  'ERR_VFSMODULE_UNTRASH'        : 'فشل في تحريك الملف من سلة المحذوفات',
  'ERR_VFSMODULE_UNTRASH_FMT'    : 'فشل في تحريك الملف من سلة المحذوفات: {0}',
  'ERR_VFSMODULE_EMPTYTRASH'     : 'فشل في تفريغ سلة المحذوفات',
  'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'فشل في تفريغ سلة المحذوفات: {0}',
  'ERR_VFSMODULE_FIND'           : 'فشل في البحث',
  'ERR_VFSMODULE_FIND_FMT'       : 'فشل في البحث: {0}',
  'ERR_VFSMODULE_FREESPACE'      : 'فشل في الحصول على المساحة الفارغة',
  'ERR_VFSMODULE_FREESPACE_FMT'  : 'فشل في الحصول على المساحة الفارغة: {0}',
  'ERR_VFSMODULE_EXISTS'         : 'فشل في التأكيد على الوجود',
  'ERR_VFSMODULE_EXISTS_FMT'     : 'فشل في التأكيد على الوجود: {0}',

  // VFS -> Dropbox
  'DROPBOX_NOTIFICATION_TITLE' : 'أنت الآن مسجل في Dropbox API',
  'DROPBOX_SIGN_OUT'           : 'خروج من Google API Services',

  // VFS -> OneDrive
  'ONEDRIVE_ERR_RESOLVE'      : 'خطأ في تحديد المسار : لا يوجد أي عنصر',

  // ZIP
  'ZIP_PRELOAD_FAIL'  : 'خطأ تحميل zip.js',
  'ZIP_VENDOR_FAIL'   : 'zip.js غير موجود ?',
  'ZIP_NO_RESOURCE'   : 'لا توجد أي موارد zip.',
  'ZIP_NO_PATH'       : 'لم يعطى إي مسار',

  //
  // SearchEngine
  //
  'SEARCH_LOADING': 'جاري البحث...',
  'SEARCH_NO_RESULTS': 'لا توجد أي نتيجة',

  //
  // PackageManager
  //

  'ERR_PACKAGE_EXISTS': 'مجلد التثبيت موجود من قبل، من المستحيل المتابعة !',

  //
  // DefaultApplication
  //
  'ERR_FILE_APP_OPEN'         : 'لا يمكن فتح الملف',
  'ERR_FILE_APP_OPEN_FMT'     : 'الملف {0} غير قابل للفتح لأن التعريف {1} غير مدعوم',
  'ERR_FILE_APP_OPEN_ALT_FMT' : 'الملف {0} غير ممكن فتحه: {1}',
  'ERR_FILE_APP_SAVE_ALT_FMT' : 'الملف {0} غير ممكن حفظه: {1}',
  'ERR_GENERIC_APP_FMT'       : '{0} خطأ في التطبيق',
  'ERR_GENERIC_APP_ACTION_FMT': 'عدم التمكن من إنجاز العملية \'{0}\'',
  'ERR_GENERIC_APP_UNKNOWN'   : 'خطأ غير معروف',
  'ERR_GENERIC_APP_REQUEST'   : 'حدث خطأ أثناء إجراء العملية المطلوبة',
  'ERR_GENERIC_APP_FATAL_FMT' : 'خطأ مميت {0}',
  'MSG_GENERIC_APP_DISCARD'   : 'إلغاء التغيرات ?',
  'MSG_FILE_CHANGED'          : 'تم تغيير الملف، هل تريد التحديث',
  'MSG_APPLICATION_WARNING'   : 'تحذير النطبيق',
  'MSG_MIME_OVERRIDE'         : 'نوع الملف "{0}" غير مدعوم, إستخدم "{1}" في مكانه.',

  //
  // General
  //

  'LBL_UNKNOWN'      : 'غير معروف',
  'LBL_APPEARANCE'   : 'مظهر',
  'LBL_USER'         : 'مستخدم',
  'LBL_NAME'         : 'إسم',
  'LBL_APPLY'        : 'تطبيق',
  'LBL_FILENAME'     : 'إسم الملف',
  'LBL_PATH'         : 'مسار',
  'LBL_SIZE'         : 'حجم',
  'LBL_TYPE'         : 'نوع',
  'LBL_MIME'         : 'التعريف',
  'LBL_LOADING'      : 'جاري التحميل',
  'LBL_SETTINGS'     : 'إعدادات',
  'LBL_ADD_FILE'     : 'إضافة ملفات',
  'LBL_COMMENT'      : 'تعليق',
  'LBL_ACCOUNT'      : 'حساب',
  'LBL_CONNECT'      : 'إتصال',
  'LBL_ONLINE'       : 'متصل',
  'LBL_OFFLINE'      : 'غير متصل',
  'LBL_AWAY'         : 'بعيد',
  'LBL_BUSY'         : 'مشغول',
  'LBL_CHAT'         : 'دردشة',
  'LBL_HELP'         : 'مساعدة',
  'LBL_ABOUT'        : 'عن',
  'LBL_PANELS'       : 'اللوحات',
  'LBL_LOCALES'      : 'اللغة/المنطقة',
  'LBL_THEME'        : 'القالب',
  'LBL_COLOR'        : 'اللون',
  'LBL_PID'          : 'رقم العملية',
  'LBL_KILL'         : 'إنهاء',
  'LBL_ALIVE'        : 'في الخدمة',
  'LBL_INDEX'        : 'الرقم',
  'LBL_ADD'          : 'إضافة',
  'LBL_FONT'         : 'الخط',
  'LBL_YES'          : 'نعم',
  'LBL_NO'           : 'لا',
  'LBL_CANCEL'       : 'إلغاء',
  'LBL_TOP'          : 'أعلى',
  'LBL_LEFT'         : 'اليسار',
  'LBL_RIGHT'        : 'اليمين',
  'LBL_BOTTOM'       : 'أسفل',
  'LBL_CENTER'       : 'وسط',
  'LBL_FILE'         : 'ملف',
  'LBL_NEW'          : 'جديد',
  'LBL_OPEN'         : 'فتح',
  'LBL_SAVE'         : 'حفظ',
  'LBL_SAVEAS'       : 'حفظ بإسم...',
  'LBL_CLOSE'        : 'إغلاق',
  'LBL_MKDIR'        : 'مجلد جديد',
  'LBL_UPLOAD'       : 'رفع ملف',
  'LBL_VIEW'         : 'إظهار',
  'LBL_EDIT'         : 'تغيير',
  'LBL_RENAME'       : 'إعادة تسمية',
  'LBL_DELETE'       : 'حذف',
  'LBL_OPENWITH'     : 'فتح بواسطة ...',
  'LBL_ICONVIEW'     : 'إظهار كأيقونات',
  'LBL_TREEVIEW'     : 'إظهار كشجرة',
  'LBL_LISTVIEW'     : 'إظهار كقائمة',
  'LBL_REFRESH'      : 'تحديث',
  'LBL_VIEWTYPE'     : 'نوع المظهر',
  'LBL_BOLD'         : 'غليظ',
  'LBL_ITALIC'       : 'مائل',
  'LBL_UNDERLINE'    : 'مسطر',
  'LBL_REGULAR'      : 'عادي',
  'LBL_STRIKE'       : 'مشطوب',
  'LBL_INDENT'       : 'مساحة لأمام',
  'LBL_OUTDENT'      : 'مساحة للخلف',
  'LBL_UNDO'         : 'تراجع',
  'LBL_REDO'         : 'إلى الأمام',
  'LBL_CUT'          : 'قص',
  'LBL_UNLINK'       : 'حذف الرابط',
  'LBL_COPY'         : 'نسخ',
  'LBL_PASTE'        : 'لصق',
  'LBL_INSERT'       : 'إدراج',
  'LBL_IMAGE'        : 'صورة',
  'LBL_LINK'         : 'رابط',
  'LBL_DISCONNECT'    : 'قطع الإتصال',
  'LBL_APPLICATIONS'  : 'التطبيقات',
  'LBL_ADD_FOLDER'    : 'إضافة مجلد',
  'LBL_INFORMATION'   : 'معلومات',
  'LBL_TEXT_COLOR'    : 'لون النص',
  'LBL_BACK_COLOR'    : 'خلفية النص',
  'LBL_RESET_DEFAULT' : 'لإستعادة لإفتراضي',
  'LBL_DOWNLOAD_COMP' : 'تحميل إلى الكمبيوتر',
  'LBL_ORDERED_LIST'  : 'ترتيب القائمة',
  'LBL_BACKGROUND_IMAGE' : 'صورة الخلفية',
  'LBL_BACKGROUND_COLOR' : 'لون الخلفية',
  'LBL_UNORDERED_LIST'   : 'قائمة غير مرتبة',
  'LBL_STATUS'   : 'الحالة',
  'LBL_READONLY' : 'قراءة-فقط',
  'LBL_CREATED' : 'تاريخ الإنشاء',
  'LBL_MODIFIED' : 'تاريخ التغيير',
  'LBL_SHOW_COLUMNS' : 'إظهار الأعمدة',
  'LBL_MOVE' : 'تحريك',
  'LBL_OPTIONS' : 'خيارات',
  'LBL_OK' : 'موافق',
  'LBL_DIRECTORY' : 'مجلد',
  'LBL_CREATE' : 'إنشاء',
  'LBL_BUGREPORT' : 'إشعار بخطأ',
  'LBL_INSTALL' : 'تثبيت',
  'LBL_UPDATE' : 'تحديث',
  'LBL_REMOVE' : 'إزالة',
  'LBL_SHOW_SIDEBAR' : 'إظهار الشريط الجانبي',
  'LBL_SHOW_NAVIGATION' : 'إظهار شريط الإنتقال',
  'LBL_SHOW_HIDDENFILES' : 'إظهار الملفات المخفية',
  'LBL_SHOW_FILEEXTENSIONS' : 'إظهار لواحق الملفات',
  'LBL_MOUNT': 'تركيب',
  'LBL_DESCRIPTION': 'الوصف',
  'LBL_USERNAME': 'المستخدم',
  'LBL_PASSWORD': 'كلمة المرور',
  'LBL_HOST': 'المستضيف',
  'LBL_NAMESPACE': 'إسم الساحة',
  'LBL_SEARCH': 'بحث',
  'LBL_Theme' : 'القالب',
  'LBL_SOUNDS' : 'أصوات',
  'LBL_ICONS' : 'أيقونات',
  'LBL_BACKGROUND' : 'خلفيات',
  'LBL_DESKTOP' : 'المكتب',
  'LBL_PANEL' : 'اللوحة',
  'LBL_POSITION' : 'الوصعية',
  'LBL_ONTOP' : 'في المقدمة',
  'LBL_ITEMS' : 'العناصر',
  'LBL_GENERAL' : 'عام',
  'LBL_DEBUG' : 'تصحيح',
  'LBL_AUTOHIDE' : 'إخفاء تلقائي',
  'LBL_OPACITY' : 'الشفافية',
  'LBL_PACKAGES' : 'الحزم',
  'LBL_GROUPS' : 'المجموعات',
  'LBL_VERSION' : 'الطبعة',
  'LBL_AUTHOR' : 'الكاتب',
  'LBL_HIDE' : 'إخفاء',
  'LBL_APPLICATION' : 'تطبيق',
  'LBL_SCOPE' : 'الزمرة'
};
