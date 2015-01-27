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

  OSjs.Locales.zh_CN = {
    'ERR_FILE_OPEN'             : '打开文件错误',
    'ERR_WM_NOT_RUNNING'        : '窗口管理器未支持',
    'ERR_FILE_OPEN_FMT'         : '文件 \'<span>{0}</span>\' 无法打开',
    'ERR_APP_MIME_NOT_FOUND_FMT': '找不到能打开此 \'{0}\' 文件的应用',
    'ERR_APP_LAUNCH_FAILED'     : '应用运行失败',
    'ERR_APP_LAUNCH_FAILED_FMT' : '运行时出现错误: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : '应用 \'{0}\' 构建失败: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : '应用 \'{0}\' 初始化失败: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : '应用资源文件丢失 \'{0}\' 或加载失败',
    'ERR_APP_PRELOAD_FAILED_FMT'    : '应用 \'{0}\' 载入失败: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : '这个应用 \'{0}\' 已经运行，且只支持单实例运行',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : '运行应用失败 \'{0}\'. 未找到清单文件',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : '运行应用失败 \'{0}\'. 你的浏览器支持: {1}',

    'ERR_NO_WM_RUNNING'         : '没有窗口管理器在运行',
    'ERR_CORE_INIT_FAILED'      : '初始化OS.js失败',
    'ERR_CORE_INIT_FAILED_DESC' : '初始化OS.js时出现一个错误',
    'ERR_CORE_INIT_NO_WM'       : '无法运行OS.js: 没有指定窗口管理器',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : '无法运行OS.js: 运行窗口管理器失败: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : '无法运行OS.js: 无法加载资源文件...',
    'ERR_JAVASCRIPT_EXCEPTION'      : '脚本错误报告',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : '发生未知异常, 也许是个BUG.',

    'ERR_APP_API_ERROR'           : '应用API错误',
    'ERR_APP_API_ERROR_DESC_FMT'  : '应用 {0} 执行操作失败 \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': '缺少参数: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : '未知错误',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : '你已经有了一个被命名的窗口 \'{0}\'',
    'WINDOW_MINIMIZE' : '最小化',
    'WINDOW_MAXIMIZE' : '最大化',
    'WINDOW_RESTORE'  : '还原',
    'WINDOW_CLOSE'    : '关闭',
    'WINDOW_ONTOP_ON' : '置顶 (开)',
    'WINDOW_ONTOP_OFF': '置顶 (关)',

    // Handler
    'TITLE_SIGN_OUT' : '退出',
    'TITLE_SIGNED_IN_AS_FMT' : '登录: {0}',

    // Dialogs
    'DIALOG_LOGOUT_TITLE' : '退出 (Exit)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : '注册用户 \'{0}\'.\n你是否想保留当前会话?',

    'DIALOG_CLOSE' : '关闭',
    'DIALOG_CANCEL': '取消',
    'DIALOG_APPLY' : '应用',
    'DIALOG_OK'    : '确定',

    'DIALOG_ALERT_TITLE' : '错误',

    'DIALOG_COLOR_TITLE' : '调色板',
    'DIALOG_COLOR_R' : '红: {0}',
    'DIALOG_COLOR_G' : '绿: {0}',
    'DIALOG_COLOR_B' : '蓝: {0}',
    'DIALOG_COLOR_A' : '透明度: {0}',

    'DIALOG_CONFIRM_TITLE' : '确认',

    'DIALOG_ERROR_MESSAGE'   : '错误信息',
    'DIALOG_ERROR_SUMMARY'   : '错误概要',
    'DIALOG_ERROR_TRACE'     : '错误跟踪',
    'DIALOG_ERROR_BUGREPORT' : 'BUG反馈',

    'DIALOG_FILE_SAVE'      : '保存',
    'DIALOG_FILE_OPEN'      : '打开',
    'DIALOG_FILE_MKDIR'     : '新建目录',
    'DIALOG_FILE_MKDIR_MSG' : '在 <span>{0}</span> 里创建一个目录',
    'DIALOG_FILE_OVERWRITE' : '你确定要覆盖 \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : '视图类型',
    'DIALOG_FILE_MNU_LISTVIEW' : '列表',
    'DIALOG_FILE_MNU_TREEVIEW' : '树型框',
    'DIALOG_FILE_MNU_ICONVIEW' : '图标',
    'DIALOG_FILE_ERROR'        : '文件错误',
    'DIALOG_FILE_ERROR_SCANDIR': '有错误发生，导致无法显示目录 \'{0}\' 列表',
    'DIALOG_FILE_MISSING_FILENAME' : '你需要选择一个文件或者输入一个文件名！',
    'DIALOG_FILE_MISSING_SELECTION': '你需要选择一个文件!',

    'DIALOG_FILEINFO_TITLE'   : '文件信息',
    'DIALOG_FILEINFO_LOADING' : '从 {0} 加载文件信息',
    'DIALOG_FILEINFO_ERROR'   : '读取文件信息错误',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : '无法获取<span>{0}</span>的文件信息',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : '无法获取文件信息: {0}',

    'DIALOG_INPUT_TITLE' : '输入',

    'DIALOG_FILEPROGRESS_TITLE'   : '文件操作',
    'DIALOG_FILEPROGRESS_LOADING' : '加载中...',

    'DIALOG_UPLOAD_TITLE'   : '上传',
    'DIALOG_UPLOAD_DESC'    : '上传文件到<span>{0}</span>.<br />最大限制: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : '正在上传 \'{0}\' ({1} {2}) 到 {3}',
    'DIALOG_UPLOAD_MSG'     : '上传文件...',
    'DIALOG_UPLOAD_FAILED'  : '上传失败',
    'DIALOG_UPLOAD_FAILED_MSG'      : '上传文件失败',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : '未知原因...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': '用户取消...',
    'DIALOG_UPLOAD_TOO_BIG': '文件过大',
    'DIALOG_UPLOAD_TOO_BIG_FMT': '文件过大, 超过 {0}',

    'DIALOG_FONT_TITLE' : '字体',

    'DIALOG_APPCHOOSER_TITLE' : '选择应用',
    'DIALOG_APPCHOOSER_MSG'   : '选择一个应用打开',
    'DIALOG_APPCHOOSER_NO_SELECTION' : '你必须要选择一个应用',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : '使用默认应用打开 {0}',

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPI 模块未配置或者未开启',
    'GAPI_SIGN_OUT'           : '注销GoogleAPI',
    'GAPI_REVOKE'             : '撤销权限并注销',
    'GAPI_AUTH_FAILURE'       : 'GoogleAPI 认证失败或者未认证',
    'GAPI_AUTH_FAILURE_FMT'   : '认证失败: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : '加载Google API失败',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Windows Live API 模块未配置或者未开启',
    'WLAPI_SIGN_OUT'          : '注销Window Live API',
    'WLAPI_LOAD_FAILURE'      : '加载 Windows Live API失败',
    'WLAPI_LOGIN_FAILED'      : '无法登录到Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : '无法登录到Windows Live API: {0}',

    // IndexedDB
    'IDB_MISSING_DBNAME' : '数据库名称未定义，无法创建数据库',
    'IDB_NO_SUCH_ITEM'   : '没有项目',

    // VFS
    'ERR_VFS_FATAL'           : '致命的错误',
    'ERR_VFS_UNAVAILABLE'     : '不可用',
    'ERR_VFS_FILE_ARGS'       : '文件至少需要一个参数',
    'ERR_VFS_NUM_ARGS'        : '参数不够',
    'ERR_VFS_EXPECT_FILE'     : '需要一个文件对象',
    'ERR_VFS_EXPECT_SRC_FILE' : '需要一个文件内容对象',
    'ERR_VFS_EXPECT_DST_FILE' : '需要目标文件',
    'ERR_VFS_FILE_EXISTS'     : '目标文件已存在',
    'ERR_VFS_TRANSFER_FMT'    : '保存时发生错误: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : '没有指定目标文件路径，无法上传',
    'ERR_VFS_UPLOAD_NO_FILES' : '没有指定文件，无法上传。',
    'ERR_VFS_UPLOAD_FAIL_FMT' : '上传失败: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': '文件上传取消',
    'ERR_VFS_DOWNLOAD_NO_FILE': '未指定文件路径无法下载',
    'ERR_VFS_DOWNLOAD_FAILED' : '文件下载时发生活错误: {0}',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': '下载文件',

    'ERR_VFSMODULE_XHR_ERROR'      : 'XHR 错误',
    'ERR_VFSMODULE_ROOT_ID'        : '找不到要根目录',
    'ERR_VFSMODULE_NOSUCH'         : '文件不存在',
    'ERR_VFSMODULE_PARENT'         : '上层目录不存在',
    'ERR_VFSMODULE_PARENT_FMT'     : '无法浏览上层目录: {0}',
    'ERR_VFSMODULE_SCANDIR'        : '搜索目录失败',
    'ERR_VFSMODULE_SCANDIR_FMT'    : '搜索目录失败: {0}',
    'ERR_VFSMODULE_READ'           : '读取文件失败',
    'ERR_VFSMODULE_READ_FMT'       : '读取文件失败: {0}',
    'ERR_VFSMODULE_WRITE'          : '写入文件失败',
    'ERR_VFSMODULE_WRITE_FMT'      : '写入文件失败: {0}',
    'ERR_VFSMODULE_COPY'           : '复制文件失败',
    'ERR_VFSMODULE_COPY_FMT'       : '复制文件失败: {0}',
    'ERR_VFSMODULE_UNLINK'         : '删除文件失败 file',
    'ERR_VFSMODULE_UNLINK_FMT'     : '删除文件失败: {0}',
    'ERR_VFSMODULE_MOVE'           : '移动文件失败',
    'ERR_VFSMODULE_MOVE_FMT'       : '移动文件失败: {0}',
    'ERR_VFSMODULE_EXIST'          : '检查文件是否存在失败',
    'ERR_VFSMODULE_EXIST_FMT'      : '检查文件是否存在失败: {0}',
    'ERR_VFSMODULE_FILEINFO'       : '获取文件信息失败',
    'ERR_VFSMODULE_FILEINFO_FMT'   : '获取文件信息失败: {0}',
    'ERR_VFSMODULE_MKDIR'          : '创建目录失败',
    'ERR_VFSMODULE_MKDIR_FMT'      : '创建目录失败: {0}',
    'ERR_VFSMODULE_URL'            : '获取远程文件失败',
    'ERR_VFSMODULE_URL_FMT'        : '获取远程文件失败: {0}',
    'ERR_VFSMODULE_TRASH'          : '将文件移动到回收站失败',
    'ERR_VFSMODULE_TRASH_FMT'      : '将文件移动到回收站失败: {0}',
    'ERR_VFSMODULE_UNTRASH'        : '将文件移出回收站失败',
    'ERR_VFSMODULE_UNTRASH_FMT'    : '将文件移出回收站失败: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : '清空回收收失败',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : '清空回收收失败: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : '你正在登录到Dropbox API',
    'DROPBOX_SIGN_OUT'           : '注销Google API 服务',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : '找不到项目',

    // DefaultApplication
    'ERR_FILE_APP_OPEN'         : '无法打开文件',
    'ERR_FILE_APP_OPEN_FMT'     : '文件 {0} 的类型 {1} 不支持,无法打开',
    'ERR_FILE_APP_OPEN_ALT_FMT' : '文件 {0} 无法打开',
    'ERR_FILE_APP_SAVE_ALT_FMT' : '文件 {0} 无法保存',
    'ERR_GENERIC_APP_FMT'       : '{0} 应用错误',
    'ERR_GENERIC_APP_ACTION_FMT': '无法执行此操作 \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : '未知错误',
    'ERR_GENERIC_APP_REQUEST'   : '请求时发生错误',
    'ERR_GENERIC_APP_FATAL_FMT' : '致命错误: {0}',
    'MSG_GENERIC_APP_DISCARD'   : '放弃更改?',
    'MSG_FILE_CHANGED'          : '该文件已更改。确定重新载入？',
    'MSG_APPLICATION_WARNING'   : '应用警告',
    'MSG_MIME_OVERRIDE'         : '该文件 "{0}" 的类型不支持，用 "{1}" 替代.',

    // General

    'LBL_UNKNOWN'      : '未知',
    'LBL_APPEARANCE'   : '外观',
    'LBL_USER'         : '用户',
    'LBL_NAME'         : '名称',
    'LBL_APPLY'        : '应用',
    'LBL_FILENAME'     : '文件名',
    'LBL_PATH'         : '路径',
    'LBL_SIZE'         : '大小',
    'LBL_TYPE'         : '类似',
    'LBL_MIME'         : '扩展类型',
    'LBL_LOADING'      : '加载',
    'LBL_SETTINGS'     : '设置',
    'LBL_ADD_FILE'     : '添加文件',
    'LBL_COMMENT'      : '评论',
    'LBL_ACCOUNT'      : '账户',
    'LBL_CONNECT'      : '联系',
    'LBL_ONLINE'       : '在线',
    'LBL_OFFLINE'      : '离线',
    'LBL_AWAY'         : '离开',
    'LBL_BUSY'         : '忙碌',
    'LBL_CHAT'         : '聊天',
    'LBL_HELP'         : '帮助',
    'LBL_ABOUT'        : '关于',
    'LBL_PANELS'       : '控制板',
    'LBL_LOCALES'      : '本地化',
    'LBL_THEME'        : '主题',
    'LBL_COLOR'        : '颜色',
    'LBL_PID'          : '句柄',
    'LBL_KILL'         : '结束',
    'LBL_ALIVE'        : '活动',
    'LBL_INDEX'        : '索引',
    'LBL_ADD'          : '添加',
    'LBL_FONT'         : '字体',
    'LBL_YES'          : '是',
    'LBL_NO'           : '否',
    'LBL_CANCEL'       : '取消',
    'LBL_TOP'          : '上',
    'LBL_LEFT'         : '左',
    'LBL_RIGHT'        : '右',
    'LBL_BOTTOM'       : '下',
    'LBL_CENTER'       : '中',
    'LBL_FILE'         : '文件',
    'LBL_NEW'          : '新建',
    'LBL_OPEN'         : '打开',
    'LBL_SAVE'         : '保存',
    'LBL_SAVEAS'       : '加存为...',
    'LBL_CLOSE'        : '关闭',
    'LBL_MKDIR'        : '创建目录',
    'LBL_UPLOAD'       : '上传',
    'LBL_VIEW'         : '查看',
    'LBL_EDIT'         : '编辑',
    'LBL_RENAME'       : '重命名',
    'LBL_DELETE'       : '删除',
    'LBL_OPENWITH'     : '打开方式...',
    'LBL_ICONVIEW'     : '图标',
    'LBL_TREEVIEW'     : '树型框',
    'LBL_LISTVIEW'     : '列表',
    'LBL_REFRESH'      : '刷新',
    'LBL_VIEWTYPE'     : '视图类型',
    'LBL_BOLD'         : '加粗',
    'LBL_ITALIC'       : '斜体',
    'LBL_UNDERLINE'    : '下划线',
    'LBL_REGULAR'      : '对齐',
    'LBL_STRIKE'       : '删除线',
    'LBL_INDENT'       : '缩进',
    'LBL_OUTDENT'      : '减少缩进',
    'LBL_UNDO'         : '撤销',
    'LBL_REDO'         : '重做',
    'LBL_CUT'          : '剪切',
    'LBL_UNLINK'       : '删除',
    'LBL_COPY'         : '复制',
    'LBL_PASTE'        : '粘贴',
    'LBL_INSERT'       : '插入',
    'LBL_IMAGE'        : '图片',
    'LBL_LINK'         : '链接',
    'LBL_DISCONNECT'    : '清除链接',
    'LBL_APPLICATIONS'  : '应用',
    'LBL_ADD_FOLDER'    : '添加目录',
    'LBL_INFORMATION'   : '文件信息',
    'LBL_TEXT_COLOR'    : '字体颜色',
    'LBL_BACK_COLOR'    : '背景颜色',
    'LBL_RESET_DEFAULT' : '恢复默认设置',
    'LBL_DOWNLOAD_COMP' : '下载到电脑',
    'LBL_ORDERED_LIST'  : '有序列表',
    'LBL_BACKGROUND_IMAGE' : '背景图片',
    'LBL_BACKGROUND_COLOR' : '背景颜色',
    'LBL_UNORDERED_LIST'   : '无序列表',

    //
    // NEW
    //
    'LBL_STATUS' : '状态',
    'LBL_READONLY' : '只读'
  };

})();
