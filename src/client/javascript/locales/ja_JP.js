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

  OSjs.Locales.ja_JP = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'エラー: ファイルが開けません',
    'ERR_WM_NOT_RUNNING'        : 'ウィンドウマネジャーが稼働していません',
    'ERR_FILE_OPEN_FMT'         : 'ファイル \'**{0}**\' を開けません',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'ファイル \'{0}\' をサポートしているアプリケーションが見つかりません',
    'ERR_APP_LAUNCH_FAILED'     : 'アプリケーションの起動に失敗しました',
    'ERR_APP_LAUNCH_FAILED_FMT' : '起動中にエラーが起きました: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'アプリケーション \'{0}\' の構築に失敗しました: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'アプリケーション \'{0}\' のinit()が失敗しました: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : '\'{0}\'のためのアプリケーションのリソースが欠けているかロードに失敗しました!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'アプリケーション \'{0}\' のプリローディングに失敗しました: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'アプリケーション \'{0}\' は既に起動していて、一つのインスタンスのみ許可されています!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : '\'{0}\' の起動に失敗しました。 アプリケーションのマニフェストデータが見つかりません!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : '\'{0}\' の起動に失敗しました。 このブラウザは {1} をサポートしていません',

    'ERR_NO_WM_RUNNING'         : '稼働しているウィンドウマネージャーがありません',
    'ERR_CORE_INIT_FAILED'      : 'OS.jsの初期化に失敗しました。',
    'ERR_CORE_INIT_FAILED_DESC' : 'OS.jsの初期化中にエラーが発生しました',
    'ERR_CORE_INIT_NO_WM'       : 'OS.jsを起動できません: 定義されたウィンドウマネージャーがありません!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'OS.jsを起動できません: ウィンドウマネージャーの起動に失敗しました: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'OS.jsを起動できません: リソースのプリロードに失敗しました...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScriptエラーレポート',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : '予期しないエラーが発生しました。おそらくバグです。',

    'ERR_APP_API_ERROR'           : 'アプリケーションAPIエラー',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'アプリケーション {0} の \'{1}\'の処理が失敗しました。',
    'ERR_APP_MISSING_ARGUMENT_FMT': '引数がありません: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : '不明のエラー',

    'ERR_OPERATION_TIMEOUT'       : '処理がタイムアウトしました',
    'ERR_OPERATION_TIMEOUT_FMT'   : '処理がタイムアウトしました ({0})',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'ウィンドウ名 \'{0}\' は既に使用されています。',
    'WINDOW_MINIMIZE' : '最小化',
    'WINDOW_MAXIMIZE' : '最大化',
    'WINDOW_RESTORE'  : '元に戻す',
    'WINDOW_CLOSE'    : '閉じる',
    'WINDOW_ONTOP_ON' : '最前面に移動 (有効)',
    'WINDOW_ONTOP_OFF': '最前面に移動 (無効)',

    // Handler
    'TITLE_SIGN_OUT' : 'サインアウト',
    'TITLE_SIGNED_IN_AS_FMT' : '{0} としてサインインしています',

    // SESSION
    'MSG_SESSION_WARNING' : '本当にOS.jsを終了してもよろしいですか? 保存していない設定とアプリケーションのデータは全て失われます!',

    // Service
    'BUGREPORT_MSG' : 'これがバクだと思ったら報告してください。\nできるなら、どうやってエラーが起きたのか、どうやって直したのかということの簡潔な説明を入れてください',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : '外部サービスにログインしています: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : '致命的なエラー',
    'ERR_UTILS_XHR_FMT' : 'AJAX/XHR エラー: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'ログアウト (終了)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'ユーザー \'{0}\' がログアウトします。\n現在のセッションを保存しますか?',

    'DIALOG_CLOSE' : '閉じる',
    'DIALOG_CANCEL': 'キャンセル',
    'DIALOG_APPLY' : '適用',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'アラートダイアログ',

    'DIALOG_COLOR_TITLE' : 'カラーダイアログ',
    'DIALOG_COLOR_R' : '赤: {0}',
    'DIALOG_COLOR_G' : '緑: {0}',
    'DIALOG_COLOR_B' : '青: {0}',
    'DIALOG_COLOR_A' : 'アルファ: {0}',

    'DIALOG_CONFIRM_TITLE' : '確認ダイアログ',

    'DIALOG_ERROR_MESSAGE'   : 'メッセージ',
    'DIALOG_ERROR_SUMMARY'   : '概要',
    'DIALOG_ERROR_TRACE'     : 'トレース',
    'DIALOG_ERROR_BUGREPORT' : 'バグを報告',

    'DIALOG_FILE_SAVE'      : '保存',
    'DIALOG_FILE_OPEN'      : '開く',
    'DIALOG_FILE_MKDIR'     : '新しいフォルダ',
    'DIALOG_FILE_MKDIR_MSG' : ' **{0}** 内に新しいディレクトリを作成',
    'DIALOG_FILE_OVERWRITE' : 'ファイル \'{0}\' を上書きしますか?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'ビュータイプ',
    'DIALOG_FILE_MNU_LISTVIEW' : 'リストビュー',
    'DIALOG_FILE_MNU_TREEVIEW' : 'ツリービュー',
    'DIALOG_FILE_MNU_ICONVIEW' : 'アイコンビュー',
    'DIALOG_FILE_ERROR'        : 'ファイルダイアログエラー',
    'DIALOG_FILE_ERROR_SCANDIR' : 'エラーが起きたのでディレクトリのリスティングに失敗しました \'{0}\'',
    'DIALOG_FILE_MISSING_FILENAME' : 'ファイルを選択するか新しいファイル名を入力してください!',
    'DIALOG_FILE_MISSING_SELECTION': 'ファイルを選択してください!',

    'DIALOG_FILEINFO_TITLE'   : 'ファイル情報',
    'DIALOG_FILEINFO_LOADING' : '{0} のファイル情報をロードしています',
    'DIALOG_FILEINFO_ERROR'   : 'ファイル情報ダイアログエラー',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : ' **{0}** のファイル情報取得に失敗しました',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : '{0} のファイル情報取得に失敗しました',

    'DIALOG_INPUT_TITLE' : '入力ダイアログ',

    'DIALOG_FILEPROGRESS_TITLE'   : 'ファイル処理進行中',
    'DIALOG_FILEPROGRESS_LOADING' : 'ロード中です...',

    'DIALOG_UPLOAD_TITLE'   : 'アップロードダイアログ',
    'DIALOG_UPLOAD_DESC'    : 'ファイルを **{0}** にアップロードします<br />最大サイズ: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : '\'{0}\' ({1} {2}) を {3} にアップロードしています',
    'DIALOG_UPLOAD_MSG'     : 'ファイルのアップロード中です...',
    'DIALOG_UPLOAD_FAILED'  : 'アップロードが失敗しました。',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'アップロードが失敗しました。',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : '原因不明です...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'ユーザーによってキャンセルされました...',
    'DIALOG_UPLOAD_TOO_BIG': 'ファイルサイズが大きすぎます',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'ファイルサイズが大きすぎます, {0} を超えています',

    'DIALOG_FONT_TITLE' : 'フォントダイアログ',

    'DIALOG_APPCHOOSER_TITLE' : 'アプリケーションを選ぶ',
    'DIALOG_APPCHOOSER_MSG'   : '開くアプリケーションを選択する',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'アプリケーションを選んでください。',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : '{0} の規定のアプリケーションとして使う',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPIモジュールは設定されていないか使用不可能です',
    'GAPI_SIGN_OUT'           : 'GoogleAPIサービスからサインアウト',
    'GAPI_REVOKE'             : 'Revoke permissions and サインアウト',
    'GAPI_AUTH_FAILURE'       : 'GoogleAPI認証が失敗したか、認証が行われていません',
    'GAPI_AUTH_FAILURE_FMT'   : '認証に失敗しました: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'GoogleAPIのロードに失敗しました',

    // Windows Live API
    'WLAPI_DISABLED'          : 'WindowsLiveAPIモジュールは設定されていないか使用不可能です',
    'WLAPI_SIGN_OUT'          : 'WindowLiveAPIからサインアウト',
    'WLAPI_LOAD_FAILURE'      : 'WindowsLiveAPIのロードに失敗しました',
    'WLAPI_LOGIN_FAILED'      : 'WindowsLiveAPIへのログインに失敗しました',
    'WLAPI_LOGIN_FAILED_FMT'  : 'WindowsLiveAPIへのログインに失敗しました: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'WindowsLiveAPIはステータス {0} を返しました',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'データベース名なしでIndexedDBを作ることはできません',
    'IDB_NO_SUCH_ITEM'   : 'そのようなアイテムはありません',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : '致命的なエラー',
    'ERR_VFS_UNAVAILABLE'     : '利用できません',
    'ERR_VFS_FILE_ARGS'       : 'ファイルには少なくとも一つの引数が必要です',
    'ERR_VFS_NUM_ARGS'        : '引数が足りません',
    'ERR_VFS_EXPECT_FILE'     : 'ファイルオブジェクトが要求されています',
    'ERR_VFS_EXPECT_SRC_FILE' : 'ソースファイルオブジェクトが要求されています',
    'ERR_VFS_EXPECT_DST_FILE' : 'デスティネーションファイルオブジェクトが要求されています',
    'ERR_VFS_FILE_EXISTS'     : '宛先は既に存在しています',
    'ERR_VFS_TRANSFER_FMT'    : 'ストレージ間の移動中にエラーが起きました: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : '宛先なしでファイルをアップロードできません',
    'ERR_VFS_UPLOAD_NO_FILES' : '定義されたファイルなしでアップロードできません',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'ファイルアップロード失敗: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'ファイルのアップロードがキャンセルされました',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'パスなしでパスをダウンロードできません',
    'ERR_VFS_DOWNLOAD_FAILED' : '{0} のダウンロード中にエラーが発生しました',
    'ERR_VFS_REMOTEREAD_EMPTY': 'レスポンスがありません',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'ファイルをダウンロードしています',

    'ERR_VFSMODULE_XHR_ERROR'      : 'XHRエラー',
    'ERR_VFSMODULE_ROOT_ID'        : 'ルートフォルダのidが見つかりませんでした',
    'ERR_VFSMODULE_NOSUCH'         : 'ファイルが存在しません',
    'ERR_VFSMODULE_PARENT'         : 'このような親ディレクトリはありません',
    'ERR_VFSMODULE_PARENT_FMT'     : '親ディレクトリの検索に失敗しました: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'ディレクトリのスキャンに失敗しました',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'ディレクトリのスキャンに失敗しました: {0}',
    'ERR_VFSMODULE_READ'           : 'ファイルの読み込みに失敗しました',
    'ERR_VFSMODULE_READ_FMT'       : 'ファイルの読み込みに失敗しました: {0}',
    'ERR_VFSMODULE_WRITE'          : 'ファイルの書き込みに失敗しました',
    'ERR_VFSMODULE_WRITE_FMT'      : 'ファイルの書き込みに失敗しました: {0}',
    'ERR_VFSMODULE_COPY'           : 'コピーに失敗しました',
    'ERR_VFSMODULE_COPY_FMT'       : 'コピーに失敗しました: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'ファイルのアンリンクに失敗しました',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'ファイルのアンリンクに失敗しました: {0}',
    'ERR_VFSMODULE_MOVE'           : 'ファイルの移動に失敗しました',
    'ERR_VFSMODULE_MOVE_FMT'       : 'ファイルの移動に失敗しました: {0}',
    'ERR_VFSMODULE_EXIST'          : 'ファイルの存在確認に失敗しました',
    'ERR_VFSMODULE_EXIST_FMT'      : 'ファイルの存在確認に失敗しました: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'ファイル情報を取得できませんでした',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'ファイル情報を取得できませんでした: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'ディレクトリの作成に失敗しました',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'ディレクトリの作成に失敗しました: {0}',
    'ERR_VFSMODULE_URL'            : 'ファイルのURLの取得に失敗しました',
    'ERR_VFSMODULE_URL_FMT'        : 'ファイルのURLの取得に失敗しました: {0}',
    'ERR_VFSMODULE_TRASH'          : 'ファイルをゴミ箱に移動できませんでした',
    'ERR_VFSMODULE_TRASH_FMT'      : 'ファイルをゴミ箱に移動できませんでした: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'ゴミ箱からファイルを取り出せませんでした',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'ゴミ箱からファイルを取り出せませんでした: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'ゴミ箱を空にできませんでした',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'ゴミ箱を空にできませんでした: {0}',
    'ERR_VFSMODULE_MOVE'           : 'ファイルの移動に失敗しました',
    'ERR_VFSMODULE_MOVE_FMT'       : 'ファイルの移動に失敗しました: {0}',
    'ERR_VFSMODULE_EXIST'          : 'ファイルの存在確認に失敗しました',
    'ERR_VFSMODULE_EXIST_FMT'      : 'ファイルの存在確認に失敗しました: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'ファイル情報の取得に失敗しました',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'ファイル情報の取得に失敗しました: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'ディレクトリの作成に失敗しました',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'ディレクトリの作成に失敗しました: {0}',
    'ERR_VFSMODULE_URL'            : 'ファイルのURLを取得できませんでした',
    'ERR_VFSMODULE_URL_FMT'        : 'ファイルのURLを取得できませんでした: {0}',
    'ERR_VFSMODULE_TRASH'          : 'ファイルをゴミ箱に移動できませんでした',
    'ERR_VFSMODULE_TRASH_FMT'      : 'ファイルをゴミ箱に移動できませんでした: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'ゴミ箱からファイルを取り出せませんでした',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'ゴミ箱からファイルを取り出せませんでした: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'ゴミ箱を空にできませんでした',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'ゴミ箱を空にできませんでした: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'DropboxAPIにサインインしています',
    'DROPBOX_SIGN_OUT'           : 'GoogleAPIサービスからサインアウト',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'パス解決に失敗しました: アイテムが見つかりません',

    // ZIP
    'ZIP_PRELOAD_FAIL'  : 'zip.jsのロードに失敗しました',
    'ZIP_VENDOR_FAIL'   : 'ライブラリ zip.js が見つかりませんでした. 適切にロードしましたか?'
    'ZIP_NO_RESOURCE'   : 'zipリソースが与えられていません',
    'ZIP_NO_PATH'       : 'パスが与えられていません',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'インストールされたパッケージのディレクトリは既に存在します。 続行不可能です!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'ファイルを開けません',
    'ERR_FILE_APP_OPEN_FMT'     : 'ファイル {0} を開けません  マイム {1} はサポートされていません',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'ファイル {0} を開けません',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'ファイル {0} を保存できません',
    'ERR_GENERIC_APP_FMT'       : '{0} アプリケーションエラー',
    'ERR_GENERIC_APP_ACTION_FMT': 'アクション \'{0}\' に失敗しました',
    'ERR_GENERIC_APP_UNKNOWN'   : '不明のエラー',
    'ERR_GENERIC_APP_REQUEST'   : 'リクエストの処理中にエラーが起きました',
    'ERR_GENERIC_APP_FATAL_FMT' : '致命的なエラー: {0}',
    'MSG_GENERIC_APP_DISCARD'   : '変更を破棄しますか?',
    'MSG_FILE_CHANGED'          : 'このファイルは変更されています。 再読み込みしますか?',
    'MSG_APPLICATION_WARNING'   : 'アプリケーションの警告',
    'MSG_MIME_OVERRIDE'         : 'ファイルタイプ "{0}" はサポートされていません。 代わりに "{1}" を使用します。',

    //
    // General
    //

    'LBL_UNKNOWN'      : '不明',
    'LBL_APPEARANCE'   : '外観',
    'LBL_USER'         : 'ユーザー',
    'LBL_NAME'         : '名前',
    'LBL_APPLY'        : '適用',
    'LBL_FILENAME'     : 'ファイル名',
    'LBL_PATH'         : 'パス',
    'LBL_SIZE'         : 'サイズ',
    'LBL_TYPE'         : 'タイプ',
    'LBL_MIME'         : 'マイム',
    'LBL_LOADING'      : 'ローディング',
    'LBL_SETTINGS'     : '設定',
    'LBL_ADD_FILE'     : 'ファイルを追加する',
    'LBL_COMMENT'      : 'コメント',
    'LBL_ACCOUNT'      : 'アカウント',
    'LBL_CONNECT'      : '接続',
    'LBL_ONLINE'       : 'オンライン',
    'LBL_OFFLINE'      : 'オフライン',
    'LBL_AWAY'         : '退席中',
    'LBL_BUSY'         : '取り込み中',
    'LBL_CHAT'         : 'チャット',
    'LBL_HELP'         : 'ヘルプ',
    'LBL_ABOUT'        : '概要',
    'LBL_PANELS'       : 'パネル',
    'LBL_LOCALES'      : 'ロケール',
    'LBL_THEME'        : 'テーマ',
    'LBL_COLOR'        : '色',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Kill',
    'LBL_ALIVE'        : 'Alive',
    'LBL_INDEX'        : 'インデックス',
    'LBL_ADD'          : '追加',
    'LBL_FONT'         : 'フォント',
    'LBL_YES'          : 'はい',
    'LBL_NO'           : 'いいえ',
    'LBL_CANCEL'       : 'キャンセル',
    'LBL_TOP'          : '上',
    'LBL_LEFT'         : '左',
    'LBL_RIGHT'        : '右',
    'LBL_BOTTOM'       : '下',
    'LBL_CENTER'       : '中央',
    'LBL_FILE'         : 'ファイル',
    'LBL_NEW'          : '新規',
    'LBL_OPEN'         : '開く',
    'LBL_SAVE'         : '保存',
    'LBL_SAVEAS'       : '名前を付けて保存',
    'LBL_CLOSE'        : '閉じる',
    'LBL_MKDIR'        : 'ディレクトリを作成',
    'LBL_UPLOAD'       : 'アップロード',
    'LBL_VIEW'         : '表示',
    'LBL_EDIT'         : '編集',
    'LBL_RENAME'       : '名前変更',
    'LBL_DELETE'       : '削除',
    'LBL_OPENWITH'     : 'このアプリケーションで開く...',
    'LBL_ICONVIEW'     : 'アイコン',
    'LBL_TREEVIEW'     : 'ツリー',
    'LBL_LISTVIEW'     : 'リスト',
    'LBL_REFRESH'      : '更新',
    'LBL_VIEWTYPE'     : '表示方法',
    'LBL_BOLD'         : 'ボールド',
    'LBL_ITALIC'       : 'イタリック',
    'LBL_UNDERLINE'    : 'アンダーライン',
    'LBL_REGULAR'      : 'レギュラー',
    'LBL_STRIKE'       : 'ストライク',
    'LBL_INDENT'       : 'インデント',
    'LBL_OUTDENT'      : 'インデントを戻す',
    'LBL_UNDO'         : '元に戻す',
    'LBL_REDO'         : 'やり直す',
    'LBL_CUT'          : '切り取り',
    'LBL_UNLINK'       : 'アンリンク',
    'LBL_COPY'         : 'コピー',
    'LBL_PASTE'        : '貼り付け',
    'LBL_INSERT'       : '挿入',
    'LBL_IMAGE'        : '画像',
    'LBL_LINK'         : 'リンク',
    'LBL_DISCONNECT'    : '切断',
    'LBL_APPLICATIONS'  : 'アプリケーション',
    'LBL_ADD_FOLDER'    : 'フォルダを追加',
    'LBL_INFORMATION'   : '情報',
    'LBL_TEXT_COLOR'    : '文字色',
    'LBL_BACK_COLOR'    : '背景色',
    'LBL_RESET_DEFAULT' : 'デフォルトに戻す',
    'LBL_DOWNLOAD_COMP' : 'コンピュータにダウンロードする',
    'LBL_ORDERED_LIST'  : '番号付きリスト',
    'LBL_BACKGROUND_IMAGE' : '背景画像',
    'LBL_BACKGROUND_COLOR' : '背景色',
    'LBL_UNORDERED_LIST'   : '番号なしリスト',
    'LBL_STATUS'   : 'ステータス',
    'LBL_READONLY' : '読み込み専用',
    'LBL_CREATED' : '作成日',
    'LBL_MODIFIED' : '変更日',
    'LBL_SHOW_COLUMNS' : '表示する情報',
    'LBL_MOVE' : '移動',
    'LBL_OPTIONS' : 'オプション',
    'LBL_OK' : 'OK',
    'LBL_DIRECTORY' : 'ディレクトリ',
    'LBL_CREATE' : '作成',
    'LBL_BUGREPORT' : 'バグの報告',
    'LBL_INSTALL' : 'インストール',
    'LBL_UPDATE' : 'アップデート',
    'LBL_REMOVE' : '削除'
    'LBL_SHOW_SIDEBAR' : 'サイドバーを表示',
    'LBL_SHOW_NAVIGATION' : 'ナビゲーションを表示',
    'LBL_SHOW_HIDDENFILES' : '隠しファイルを表示',
    'LBL_SHOW_FILEEXTENSIONS' : '拡張子を表示'
  };

})();
