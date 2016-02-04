/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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
  // jscs:disable validateQuoteMarks
  'use strict';

  OSjs.Locales = OSjs.Locales || {};

  OSjs.Locales.tr_TR = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Dosya açılırken hata oluştu',
    'ERR_WM_NOT_RUNNING'        : 'Window manager çalışır halde değil',
    'ERR_FILE_OPEN_FMT'         : '\'**{0}**\' dosya açılamadı',
    'ERR_APP_MIME_NOT_FOUND_FMT': ' \'{0}\' dosyalarını destekleyen herhangi bir program bulunamadı',
    'ERR_APP_LAUNCH_FAILED'     : 'Program açılırken hata oluştun',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Dosyanın açılmaya çalışıldığı sırada br hata meydana geldi: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : ' \'{0}\' programının inşası sırasında bir hata oluştu: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : ' \'{0}\' programında init() hatası: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : ' \'{0}\' dosyasında kaynak dosyası eksik ya da yüklenirken hata oluştu!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : ' \'{0}\' programında önyükleme hatası: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : '\'{0}\' programı zaten açık.Aynı anda yalnızca bir kez kullanabilirsiniz.',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : ' \'{0}\' açılamadı. Program bulunamadı!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : ' \'{0}\' açılamadı. Tarayıcınız deskteklemiyor: {1}',

    'ERR_NO_WM_RUNNING'         : 'Çalışan bir pencere bulunamadı',
    'ERR_CORE_INIT_FAILED'      : ' OS.js başlatılma hatası',
    'ERR_CORE_INIT_FAILED_DESC' : ' OS.js başlatılırken bir hata meydana geldi',
    'ERR_CORE_INIT_NO_WM'       : 'Cannot launch OS.js: No window manager defined!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'OS.js başlatılamaz: Window Manager yüklenirken hata oluştu: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : ' OS.js başlatılamaz: Kaynakların önyükleme işlemi sırasında hata oluştu...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript Hata Bildir',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Beklenmedik bir hata meydana geldi.',

    'ERR_APP_API_ERROR'           : 'Program API hatası',
    'ERR_APP_API_ERROR_DESC_FMT'  : '{0} programı  \'{1}\' işlemini gerçekleşirken hata oluştu',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Gözden kaçırdığınız değişken: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Bilinmeyen bir hata',

    'ERR_OPERATION_TIMEOUT'       : 'Zaman aşımına ugradı',
    'ERR_OPERATION_TIMEOUT_FMT'   : 'Zaman aşımı({0})',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Zaten \'{0}\' adına sahip bir pencere var',
    'WINDOW_MINIMIZE' : 'Küçült',
    'WINDOW_MAXIMIZE' : 'Büyült',
    'WINDOW_RESTORE'  : 'geri yükle',
    'WINDOW_CLOSE'    : 'Kapat',
    'WINDOW_ONTOP_ON' : 'en üstte (aktif)',
    'WINDOW_ONTOP_OFF': 'en üstte (aktif değil)',

    // Handler
    'TITLE_SIGN_OUT' : 'Çıkış Yap',
    'TITLE_SIGNED_IN_AS_FMT' : '{0} olarak giriş yap',

    // SESSION
    'MSG_SESSION_WARNING' : 'OS.jsda çıkmak istedigine emin misin? Kaydedilmemiş tüm veriler silinecek!',

    // Service
    'BUGREPORT_MSG' : 'Hata olduğunu düşünüyorsan lütfen bizimle irtibata geç.\nHatanın nasıl oluştuğunu kısa bir şekilde yaz ve eğer yapabiliyorsan bir kopyasını bize gönder',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Harici bir servise girildi: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Ölümcül Hata',
    'ERR_UTILS_XHR_FMT' : 'AJAX/XHR Hatası: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Oturumu Kapat (Çıkış)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Oturum Kapatılıyor user \'{0}\'.\nKaydetmek ister misin?',

    'DIALOG_CLOSE' : 'Kapat',
    'DIALOG_CANCEL': 'İptal',
    'DIALOG_APPLY' : 'Uygula',
    'DIALOG_OK'    : 'Tamam',

    'DIALOG_ALERT_TITLE' : 'Uyarı Penceresi',

    'DIALOG_COLOR_TITLE' : 'Renk Penceresi',
    'DIALOG_COLOR_R' : 'Kırmızı: {0}',
    'DIALOG_COLOR_G' : 'Yeşil: {0}',
    'DIALOG_COLOR_B' : 'Mavi: {0}',
    'DIALOG_COLOR_A' : 'Alpha: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Onay Penceresi',

    'DIALOG_ERROR_MESSAGE'   : 'Mesaj',
    'DIALOG_ERROR_SUMMARY'   : 'Özet',
    'DIALOG_ERROR_TRACE'     : 'İzle',
    'DIALOG_ERROR_BUGREPORT' : ' Hata bildir',

    'DIALOG_FILE_SAVE'      : 'Kaydet',
    'DIALOG_FILE_OPEN'      : 'Aç',
    'DIALOG_FILE_MKDIR'     : 'Yeni Klasör',
    'DIALOG_FILE_MKDIR_MSG' : '**{0}**da yeni bir Klasör oluştur',
    'DIALOG_FILE_OVERWRITE' : 'Dosyanın üzerine yazmak konusunda emin misin \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Görünüm Seçenekleri',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Liste Görünümü',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Tree Görünümü',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Icon Görünümü',
    'DIALOG_FILE_ERROR'        : 'Dosya Penceresi Hatası',
    'DIALOG_FILE_ERROR_SCANDIR': 'Bir hatadan dolayı \'{0}\' dosyaları listelenemedi',
    'DIALOG_FILE_MISSING_FILENAME' : 'Bir dosya seçmeli veya yeni bir dosya ismi girmelisin!',
    'DIALOG_FILE_MISSING_SELECTION': 'Bir dosya seçmelisin!',

    'DIALOG_FILEINFO_TITLE'   : 'Dosya Bilgileri',
    'DIALOG_FILEINFO_LOADING' : 'Dosya bilgileri yükleniyor: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Dosya Bilgi Penceresi Hatası',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : ' **{0}** hakkında bilgi alınırken hata meydana geldi',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : '{0} Hakkında bilgi alınırken hata meydana geldi',

    'DIALOG_INPUT_TITLE' : 'Giriş Penceresi',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Dosya İşlemlerinin İlerleme Durumu',
    'DIALOG_FILEPROGRESS_LOADING' : 'Yükleniyor...',

    'DIALOG_UPLOAD_TITLE'   : 'Yükleme Penceresi',
    'DIALOG_UPLOAD_DESC'    : 'Yükle **{0}**.<br />Maksimum boyut: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : 'Yükleniyor \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : 'Yükleniyor...',
    'DIALOG_UPLOAD_FAILED'  : 'Yükleme başarısız oldu',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Yükleme başarısız oldu',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'bilinmeyen bir sebepten dolayı hata oluştu...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Kullanıcı tarafından iptal edildi...',
    'DIALOG_UPLOAD_TOO_BIG': 'Dosya Boyutu çok fazla',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Dosya Boyutu çok fazla, {0} sınırını aştı',

    'DIALOG_FONT_TITLE' : 'Yazı Tipi Penceresi',

    'DIALOG_APPCHOOSER_TITLE' : 'Program Seç',
    'DIALOG_APPCHOOSER_MSG'   : 'Açmak İçin Bir Program Seçiniz',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Bir Program Seçmeniz Gerek',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : ' {0} için varsayılan bir program seçiniz',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPI Modulü inaktif veya kurulu değil',
    'GAPI_SIGN_OUT'           : 'Google API Services uygulamasında çık',
    'GAPI_REVOKE'             : 'İzinleri İptal Et ve Çık',
    'GAPI_AUTH_FAILURE'       : 'Google API Kimlik Doğrulama Hatası',
    'GAPI_AUTH_FAILURE_FMT'   : 'Kimlik Doğrulama Hatası: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Google API yüklenemedi',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Windows Live API inaktif veya kurulu değil',
    'WLAPI_SIGN_OUT'          : 'Window Live API uygulamasında çık',
    'WLAPI_LOAD_FAILURE'      : 'Windows Live API yüklenirken hata oluştu',
    'WLAPI_LOGIN_FAILED'      : 'Windows Live APIe girerken hata oluştu',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Windows Live APIe girerken hata oluştu: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API  {0} hatası verdi',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Veritabanı ismi olmadan IndexedDB Oluşturulamaz',
    'IDB_NO_SUCH_ITEM'   : 'Öge mevcut değil',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Ölümcül Hata',
    'ERR_VFS_UNAVAILABLE'     : 'Kullanılamaz',
    'ERR_VFS_FILE_ARGS'       : 'Dosyaya en az bir değişken girilmeli',
    'ERR_VFS_NUM_ARGS'        : 'Yeyersiz Değişken',
    'ERR_VFS_EXPECT_FILE'     : 'Dosya Bekleniyordu',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Kaynak Kod Dosyası Bekleniyordu',
    'ERR_VFS_EXPECT_DST_FILE' : 'Hedef Dosyası Bekleniyordu',
    'ERR_VFS_FILE_EXISTS'     : 'Hedef Dosyası Zaten Mevcut',
    'ERR_VFS_TRANSFER_FMT'    : 'depo ile {0} arasında aktarım sırasında bir hata meydana geldi',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Hedef Dosyası olmadan yükleme yapılamaz',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Dosya tanımlamadan yükleme yapılamaz',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Dosya yükleme hatası: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Dosya yükleme iptal edildi',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Hedef belli değilken dosya indirilemez',
    'ERR_VFS_DOWNLOAD_FAILED' : 'İndirilme sırasında bir hata meydana geldi: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'Geri Dönüş Boş',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Dosya İndiriliyor',

    'ERR_VFSMODULE_XHR_ERROR'      : 'XHR Hatası',
    'ERR_VFSMODULE_ROOT_ID'        : 'Root idsi bulunamadı',
    'ERR_VFSMODULE_NOSUCH'         : 'Dosya kullanımda değil',
    'ERR_VFSMODULE_PARENT'         : 'Üst Öge Bulunmuyors',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Üst Öge aranırken hata oluştu: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Klasör Görüntülenirken Hata Meydana Geldi',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Klasör Görüntülenirken Hata Meydana Geldi: {0}',
    'ERR_VFSMODULE_READ'           : 'Dosya Okunurken Hata oluştu',
    'ERR_VFSMODULE_READ_FMT'       : 'Dosya Okunurken Hata oluştu: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Dosyaya yazılırken Hata oluştu',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Dosyaya yazılırken Hata oluştu: {0}',
    'ERR_VFSMODULE_COPY'           : 'Kopyalanırken Hata meydana geldi.',
    'ERR_VFSMODULE_COPY_FMT'       : 'Kopyalanırken Hata meydana geldi: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Bağlantısız Dosya',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Bağlantısız Dosya: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Dosya Taşınırken Hata Oluştu',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Dosya Taşınırken Hata Oluştu: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Dosyanın varlığı teyit edilirken hata meydana geldi',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Dosyanın varlığı teyit edilirken hata meydana geldi: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Dosya Hakkında Bilgi Toplanırken Hata Oluştu',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Dosya Hakkında Bilgi Toplanırken Hata Oluştu: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Klasör Oluşturulurken Hata Oluştu',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Klasör Oluşturulurken Hata Oluştu: {0}',
    'ERR_VFSMODULE_URL'            : 'Dosyanın url adresi getirilirken hata meydana geldi',
    'ERR_VFSMODULE_URL_FMT'        : 'Dosyanın url adresi getirilirken hata meydana geldi: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Çöp Kutusuna Taşınırken Hata Oluştu',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Çöp Kutusuna Taşınırken Hata Oluştu: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Çöp Kutusundan Çıkarılırken Hata Meydana Geldi',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Çöp Kutusundan Çıkarılırken Hata Meydana Geldi: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Çöpü boşaltırken hata meydana geldi',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Çöpü boşaltırken hata meydana geldi: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Dropbox APIya girdiniz',
    'DROPBOX_SIGN_OUT'           : 'Google API servisi oturumunu kapat',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Öge bulunamadı',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'Paketlenecek yer zaten mevcut.Yine de devam etmek istiyor musun?',
    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Dosya Açılamadı',
    'ERR_FILE_APP_OPEN_FMT'     : '{0} dosyası açılmadı çünkü  {1} desteklenmiyor',
    'ERR_FILE_APP_OPEN_ALT_FMT' : '{0} dosyası açılamadı',
    'ERR_FILE_APP_SAVE_ALT_FMT' : '{0} dosyası kaydedilemedi',
    'ERR_GENERIC_APP_FMT'       : '{0} program hatası',
    'ERR_GENERIC_APP_ACTION_FMT': ' \'{0}\' gerçekleşirken hata oluştu',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Bilinmeyen Hata',
    'ERR_GENERIC_APP_REQUEST'   : 'İstek cevaplanırken bir hata meydana geldi.',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Ölümcül Hata: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Değişiklikleri Çıkar?',
    'MSG_FILE_CHANGED'          : 'Dosya değişmiş.Tekrar yüklemek ister misin?',
    'MSG_APPLICATION_WARNING'   : 'Program Uyarısı',
    'MSG_MIME_OVERRIDE'         : ' "{0}" türü desteklenmiyor :( .Bunun yerine "{1}" kullanının.',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Bilinmiyor',
    'LBL_APPEARANCE'   : 'Görünüm',
    'LBL_USER'         : 'Kullanıcı',
    'LBL_NAME'         : 'İsim',
    'LBL_APPLY'        : 'Uygula',
    'LBL_FILENAME'     : 'Dosya adı',
    'LBL_PATH'         : 'Dosya yolu',
    'LBL_SIZE'         : 'Boyut',
    'LBL_TYPE'         : 'Tür',
    'LBL_MIME'         : 'MIME',  //Eklenecektir
    'LBL_LOADING'      : 'Yükleniyor',
    'LBL_SETTINGS'     : 'Ayarlar',
    'LBL_ADD_FILE'     : 'Dosya ekle',
    'LBL_COMMENT'      : 'Yorum',
    'LBL_ACCOUNT'      : 'Hesap',
    'LBL_CONNECT'      : 'Bağlan',
    'LBL_ONLINE'       : 'Aktif',
    'LBL_OFFLINE'      : 'Aktif değil',
    'LBL_AWAY'         : 'Yolda',
    'LBL_BUSY'         : 'Meşgul',
    'LBL_CHAT'         : 'Chat',
    'LBL_HELP'         : 'Yardım',
    'LBL_ABOUT'        : 'Hakkında',
    'LBL_PANELS'       : 'Panels',
    'LBL_LOCALES'      : 'Yerler',
    'LBL_THEME'        : 'Tema',
    'LBL_COLOR'        : 'Renk',
    'LBL_PID'          : 'Kişisel Kimlik',
    'LBL_KILL'         : 'Kes',
    'LBL_ALIVE'        : 'Alive',
    'LBL_INDEX'        : 'Index',
    'LBL_ADD'          : 'Ekle',
    'LBL_FONT'         : 'Yazı Tipi',
    'LBL_YES'          : 'Evet',
    'LBL_NO'           : 'Hayır',
    'LBL_CANCEL'       : 'İptal',
    'LBL_TOP'          : 'Üst',
    'LBL_LEFT'         : 'Sol',
    'LBL_RIGHT'        : 'Sağ',
    'LBL_BOTTOM'       : 'Alt',
    'LBL_CENTER'       : 'Orta',
    'LBL_FILE'         : 'Dosya',
    'LBL_NEW'          : 'Yeni',
    'LBL_OPEN'         : 'Aç',
    'LBL_SAVE'         : 'Kaydet',
    'LBL_SAVEAS'       : '-olarak kaydet...',
    'LBL_CLOSE'        : 'Kapat',
    'LBL_MKDIR'        : 'Klasör oluştur',
    'LBL_UPLOAD'       : 'Yükle',
    'LBL_VIEW'         : 'Görünüm',
    'LBL_EDIT'         : 'Düzenle',
    'LBL_RENAME'       : 'İsmi Değiştir',
    'LBL_DELETE'       : 'Sil',
    'LBL_OPENWITH'     : '-ile aç ...',
    'LBL_ICONVIEW'     : 'icon görünüm',
    'LBL_TREEVIEW'     : 'Tree View',
    'LBL_LISTVIEW'     : 'Liste Görünüm',
    'LBL_REFRESH'      : 'Yenile',
    'LBL_VIEWTYPE'     : 'Görünüm Türü',
    'LBL_BOLD'         : 'Kalım',
    'LBL_ITALIC'       : 'İtalik',
    'LBL_UNDERLINE'    : 'Altı Çizili',
    'LBL_REGULAR'      : 'Düzenli',
    'LBL_STRIKE'       : 'Vurgulu',
    'LBL_INDENT'       : 'Indent',  //eklenecek
    'LBL_OUTDENT'      : 'Outdate', //eklenecek
    'LBL_UNDO'         : 'Geri Al',
    'LBL_REDO'         : 'İleri Al',
    'LBL_CUT'          : 'Kes',
    'LBL_UNLINK'       : 'Bağlantıyı Kaldır',
    'LBL_COPY'         : 'Kopyala',
    'LBL_PASTE'        : 'Yapıştır',
    'LBL_INSERT'       : 'Araya Ekle',
    'LBL_IMAGE'        : 'Resim',
    'LBL_LINK'         : 'Link',
    'LBL_DISCONNECT'    : 'Bağlantıyı Kes',
    'LBL_APPLICATIONS'  : 'Programlar',
    'LBL_ADD_FOLDER'    : 'Klasör Ekle',
    'LBL_INFORMATION'   : 'Bilgi',
    'LBL_TEXT_COLOR'    : 'Yazı Rengi',
    'LBL_BACK_COLOR'    : 'Zemin Rengi',
    'LBL_RESET_DEFAULT' : 'Reset to defaults',
    'LBL_DOWNLOAD_COMP' : 'Bilgisayara İndir',
    'LBL_ORDERED_LIST'  : 'Sıralı Liste',
    'LBL_BACKGROUND_IMAGE' : 'Arkaplan Resmi',
    'LBL_BACKGROUND_COLOR' : 'Arkaplan Rengi',
    'LBL_UNORDERED_LIST'   : 'Sırasız Liste',
    'LBL_STATUS'   : 'Durum',
    'LBL_READONLY' : 'Sadece Oku',
    'LBL_CREATED' : 'Oluşturulma Tarihi',
    'LBL_MODIFIED' : 'Değiştirilme Tarihi',
    'LBL_SHOW_COLUMNS' : 'Sütunları Göster',
    'LBL_MOVE' : 'Taşı',
    'LBL_OPTIONS' : 'Ayarlar',
    'LBL_OK' : 'Tamam',
    'LBL_DIRECTORY' : 'Klasör',
    'LBL_CREATE' : 'oluştur',
    'LBL_BUGREPORT' : 'Hata Bildir',
    'LBL_INSTALL' : 'Yükle',
    'LBL_UPDATE' : 'Güncelle',
    'LBL_REMOVE' : 'Kaldır',
    'LBL_SHOW_SIDEBAR' : 'Kenar çubuğunu göster'
  };

})();
