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

  OSjs.Locales.vi_VN = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Lỗi khi mở tệp',
    'ERR_WM_NOT_RUNNING'        : 'Trình quản lí cửa sổ không hoạt động',
    'ERR_FILE_OPEN_FMT'         : 'Tập tin \'<span>{0}</span>\' không mở được',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Không thể tìm thấy bất kỳ ứng dụng hỗ trợ cho \'{0}\' files',
    'ERR_APP_LAUNCH_FAILED'     : 'Không thể khởi động ứng dụng',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Có lỗi xảy ra trong khi cố gắng khởi động: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Phần mềm \'{0}\' xây dựng thất bại: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Phần mềm \'{0}\' init() thất bại: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Tài nguyên ứng dụng còn thiếu cho \'{0}\' hoặc nó không tải được!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'Nạp trước phần mềm \'{0}\'  thất bại: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'Phần mềm \'{0}\' đã được khởi chạy và chỉ cho phép một hoạt động!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Không thể khởi động \'{0}\'. Application manifest không tìm thấy!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Không thể khởi động\'{0}\'. Trình duyệt của bạn không hỗ trợ: {1}',

    'ERR_NO_WM_RUNNING'         : 'Quản lí cửa sổ không chạy',
    'ERR_CORE_INIT_FAILED'      : 'Không thể khởi động OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'Một lỗi đã xảy ra trong khi khởi tạo OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'Không thể khởi động OS.js: Không có quản lí cửa sổ nào được xác định!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'Không thể khởi động OS.js: Không thể khởi động Window Manager: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'Không thể khởi động OS.js: Không thể tải trước tài nguyên...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'Báo cáo lỗi JavaScript',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Một lỗi không mong muốn xảy ra, có thể là một bug.',

    'ERR_APP_API_ERROR'           : 'Lỗi ứng dụng API',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Phần mềm {0} không thực hiện hoạt động \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Thiếu đối số: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Lỗi không xác định',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Bạn đã có một cửa sổ có tên \'{0}\'',
    'WINDOW_MINIMIZE' : 'Giảm thiểu',
    'WINDOW_MAXIMIZE' : 'Tối đa hóa',
    'WINDOW_RESTORE'  : 'Khôi phục',
    'WINDOW_CLOSE'    : 'Đóng',
    'WINDOW_ONTOP_ON' : 'Ở trên (Bật)',
    'WINDOW_ONTOP_OFF': 'Ở trên (Tắt)',

    // Handler
    'TITLE_SIGN_OUT' : 'Đăng xuất',
    'TITLE_SIGNED_IN_AS_FMT' : 'Đăng nhập như: {0}',

    // Service
    'BUGREPORT_MSG' : 'Xin báo lỗi này nếu bạn nghĩ rằng đây là một bug.\nBao gồm một mô tả ngắn gọn về các lỗi xảy ra như thế nào, và nếu có thể; làm thế nào để làm lại nó',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Đăng nhập vào các dịch vụ bên ngoài: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Lỗi nghiêm trọng',
    'ERR_UTILS_XHR_FMT' : 'Lỗi AJAX/XHR: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Đăng xuất (Thoát)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Đăng xuất người dùng \'{0}\'.\nBạn có muốn lưu lại phiên chạy hiện thời?',

    'DIALOG_CLOSE' : 'Đóng',
    'DIALOG_CANCEL': 'Hủy',
    'DIALOG_APPLY' : 'Áp dụng',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'Cảnh báo',

    'DIALOG_COLOR_TITLE' : 'Bảng màu',
    'DIALOG_COLOR_R' : 'Đỏ: {0}',
    'DIALOG_COLOR_G' : 'Xanh lá cây: {0}',
    'DIALOG_COLOR_B' : 'Xanh da trời: {0}',
    'DIALOG_COLOR_A' : 'Alpha: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Xác nhận',

    'DIALOG_ERROR_MESSAGE'   : 'Thông điệp',
    'DIALOG_ERROR_SUMMARY'   : 'Tóm tắt',
    'DIALOG_ERROR_TRACE'     : 'Dấu vết',
    'DIALOG_ERROR_BUGREPORT' : 'Báo cáo lỗi',

    'DIALOG_FILE_SAVE'      : 'Lưu',
    'DIALOG_FILE_OPEN'      : 'Mở',
    'DIALOG_FILE_MKDIR'     : 'Thư mục mới',
    'DIALOG_FILE_MKDIR_MSG' : 'Tạo một thư mục mới trong <span>{0}</span>',
    'DIALOG_FILE_OVERWRITE' : 'Bạn có chắc muốn ghi đè lên tập tin \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Kiểu xem',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Danh sách',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Cây',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Biểu tượng',
    'DIALOG_FILE_ERROR'        : 'Lỗi FileDialog',
    'DIALOG_FILE_ERROR_SCANDIR': 'Không thể liệt kê thư mục \'{0}\' vì đã xảy ra lỗi',
    'DIALOG_FILE_MISSING_FILENAME' : 'Bạn cần phải chọn một tập tin hoặc nhập tên tập tin mới!',
    'DIALOG_FILE_MISSING_SELECTION': 'Bạn cần phải chọn một tập tin!',

    'DIALOG_FILEINFO_TITLE'   : 'Thông tin file',
    'DIALOG_FILEINFO_LOADING' : 'Đang tải thông tin tập tin cho: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Lỗi FileInformationDialog',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Không thể có được thông tin file cho <span>{0}</span>',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Không thể có được thông tin file cho: {0}',

    'DIALOG_INPUT_TITLE' : 'Nhập liệu',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Tiến độ của tập tin',
    'DIALOG_FILEPROGRESS_LOADING' : 'Đang nạp...',

    'DIALOG_UPLOAD_TITLE'   : 'Tải lên',
    'DIALOG_UPLOAD_DESC'    : 'Tải tập tin lên đến <span>{0}</span>.<br />Kích thước tối đa: {1} byte',
    'DIALOG_UPLOAD_MSG_FMT' : 'Đang tải lên \'{0}\' ({1} {2}) đến {3}',
    'DIALOG_UPLOAD_MSG'     : 'Đang tải lên file...',
    'DIALOG_UPLOAD_FAILED'  : 'Tải lên thất bại',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'Việc upload đã thất bại',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Lý do không rõ...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Hủy bỏ bởi người dùng...',
    'DIALOG_UPLOAD_TOO_BIG': 'Tập tin quá lớn',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'Tập tin quá lớn, vượt quá {0}',

    'DIALOG_FONT_TITLE' : 'Chọn phông',

    'DIALOG_APPCHOOSER_TITLE' : 'Chọn ứng dụng',
    'DIALOG_APPCHOOSER_MSG'   : 'Chọn một ứng dụng để mở',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Bạn cần phải chọn một ứng dụng',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Sử dụng như là ứng dụng mặc định cho {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'Mô-đun GoogleAPI không được cấu hình hoặc vô hiệu hóa',
    'GAPI_SIGN_OUT'           : 'Đăng xuất khỏi dịch vụ Google API',
    'GAPI_REVOKE'             : 'Thu hồi giấy phép và Đăng xuất',
    'GAPI_AUTH_FAILURE'       : 'Google API Xác thực không thành công hoặc không diễn ra',
    'GAPI_AUTH_FAILURE_FMT'   : 'Không xác thực được: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Không tải được Google API',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Mô-đun Windows Live API  không được cấu hình hoặc vô hiệu',
    'WLAPI_SIGN_OUT'          : 'Đăng xuất khỏi Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'Không tải được Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'Không thể đăng nhập vào Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Không thể đăng nhập vào Windows Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API gửi lại {0} status',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Không thể tạo IndexedDB mà không có Database Name',
    'IDB_NO_SUCH_ITEM'   : 'Không có item',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Lỗi nghiêm trọng',
    'ERR_VFS_UNAVAILABLE'     : 'Không khả dụng',
    'ERR_VFS_FILE_ARGS'       : 'Tập cần ít nhất một tham số',
    'ERR_VFS_NUM_ARGS'        : 'Không đủ đối số',
    'ERR_VFS_EXPECT_FILE'     : 'Cần một file-object',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Cần một nguồn file-object',
    'ERR_VFS_EXPECT_DST_FILE' : 'Cần một điểm đến file-object',
    'ERR_VFS_FILE_EXISTS'     : 'Điểm đến đã tồn tại',
    'ERR_VFS_TRANSFER_FMT'    : 'Có lỗi xảy ra trong khi chuyển giao lưu trữ tới ổ cứng: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Không thể tải lên một tập tin mà không có một điểm đến',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Không thể tải lên bất kỳ tập tin mà không có định nghĩa',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Tập tin tải lên không thành công: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Tập tin tải lên đã bị hủy bỏ',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Không thể tải về một đường dẫn mà không có một đường dẫn',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Một lỗi đã xảy ra trong khi tải về: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'Trả lời là rỗng',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Đang tải xuống tập tin',

    'ERR_VFSMODULE_XHR_ERROR'      : 'Lỗi XHR',
    'ERR_VFSMODULE_ROOT_ID'        : 'Không thể tìm thấy id thư mục gốc',
    'ERR_VFSMODULE_NOSUCH'         : 'Tập tin không tồn tại',
    'ERR_VFSMODULE_PARENT'         : 'Không có thư mục cha nào như vậy',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Không thể tìm thư mục cha : {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Không thể quét thư mục',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Failed to scan directory: {0}',
    'ERR_VFSMODULE_READ'           : 'Không thể đọc tập tin',
    'ERR_VFSMODULE_READ_FMT'       : 'Không thể đọc tập tin: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Không thể ghi tập tin',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Không thể ghi tập tin: {0}',
    'ERR_VFSMODULE_COPY'           : 'Không thể sao chép',
    'ERR_VFSMODULE_COPY_FMT'       : 'Không thể sao chép: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Không thể bỏ liên kết tập tin',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Không thể bỏ liên kết tập tin: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Không thể di chuyển tập tin',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Không thể di chuyển tập tin: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Không thể kiểm tra sự tồn tại của tập tin',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Không thể kiểm tra sự tồn tại của tập tin: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Không thể lấy thông tin file',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Không thể lấy thông tin file: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Không thể tạo thư mục',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Không thể tạo thư mục: {0}',
    'ERR_VFSMODULE_URL'            : 'Không thể lấy URL cho file',
    'ERR_VFSMODULE_URL_FMT'        : 'Không thể lấy URL cho file: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Không thể di chuyển tập tin vào thùng rác',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Không thể di chuyển tập tin vào thùng rác: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Không thể di chuyển tập tin ra khỏi thùng rác',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Không thể di chuyển tập tin ra khỏi thùng rác: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Không thể làm rỗng thùng rác',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Không thể làm rỗng thùng rác : {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Bạn đã đăng nhập vào Dropbox API',
    'DROPBOX_SIGN_OUT'           : 'Đăng xuất khỏi Google API Services',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Không thể giải quyết đường dẫn: mục không tìm thấy',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Không thể mở tập tin',
    'ERR_FILE_APP_OPEN_FMT'     : 'Tập tin {0} không thể mở được vì mime {1} không được hỗ trợ',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'Tập tin {0} không mở được',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'Tập tin {0} không lưu được',
    'ERR_GENERIC_APP_FMT'       : '{0} Lỗi phần mềm',
    'ERR_GENERIC_APP_ACTION_FMT': 'Không thể thực hiện hành động \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Lỗi không xác định',
    'ERR_GENERIC_APP_REQUEST'   : 'Một lỗi đã xảy ra trong khi xử lý yêu cầu của bạn',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Lỗi nghiêm trọng: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Hủy các thay đổi?',
    'MSG_FILE_CHANGED'          : 'Các tập tin đã thay đổi. Nạp lại?',
    'MSG_APPLICATION_WARNING'   : 'Cảnh báo ứng dụng',
    'MSG_MIME_OVERRIDE'         : 'Loại tập tin "{0}" không được hỗ trợ, sử dụng "{1}" thay thế.',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Không biết',
    'LBL_APPEARANCE'   : 'Giao diện',
    'LBL_USER'         : 'Người dùng',
    'LBL_NAME'         : 'Tên',
    'LBL_APPLY'        : 'Áp dụng',
    'LBL_FILENAME'     : 'Tên file',
    'LBL_PATH'         : 'Đường dẫn',
    'LBL_SIZE'         : 'Kích cỡ',
    'LBL_TYPE'         : 'Kiểu',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Đang tải',
    'LBL_SETTINGS'     : 'Cài đặt',
    'LBL_ADD_FILE'     : 'Thêm file',
    'LBL_COMMENT'      : 'Chú thích',
    'LBL_ACCOUNT'      : 'Tài khoản',
    'LBL_CONNECT'      : 'Kết nối',
    'LBL_ONLINE'       : 'Online',
    'LBL_OFFLINE'      : 'Offline',
    'LBL_AWAY'         : 'Ở xa',
    'LBL_BUSY'         : 'Bận',
    'LBL_CHAT'         : 'Chat',
    'LBL_HELP'         : 'Hướng dẫn',
    'LBL_ABOUT'        : 'Thông tin',
    'LBL_PANELS'       : 'Panels',
    'LBL_LOCALES'      : 'Ngôn ngữ',
    'LBL_THEME'        : 'Giao diện',
    'LBL_COLOR'        : 'Màu',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Đóng',
    'LBL_ALIVE'        : 'Còn sống',
    'LBL_INDEX'        : 'Phân mục',
    'LBL_ADD'          : 'Thêm',
    'LBL_FONT'         : 'Phông',
    'LBL_YES'          : 'Có',
    'LBL_NO'           : 'Không',
    'LBL_CANCEL'       : 'Hủy bỏ',
    'LBL_TOP'          : 'Trên',
    'LBL_LEFT'         : 'Trái',
    'LBL_RIGHT'        : 'Phải',
    'LBL_BOTTOM'       : 'Dưới',
    'LBL_CENTER'       : 'Giữa',
    'LBL_FILE'         : 'Tệp',
    'LBL_NEW'          : 'Mới',
    'LBL_OPEN'         : 'Mở',
    'LBL_SAVE'         : 'Lưu',
    'LBL_SAVEAS'       : 'Lưu như...',
    'LBL_CLOSE'        : 'Đóng',
    'LBL_MKDIR'        : 'Tạo thư mục',
    'LBL_UPLOAD'       : 'Tải lên',
    'LBL_VIEW'         : 'Xem',
    'LBL_EDIT'         : 'Chỉnh sửa',
    'LBL_RENAME'       : 'Đổi tên',
    'LBL_DELETE'       : 'Xóa',
    'LBL_OPENWITH'     : 'Mở bằng ...',
    'LBL_ICONVIEW'     : 'Biểu tượng',
    'LBL_TREEVIEW'     : 'Cây',
    'LBL_LISTVIEW'     : 'Danh sách',
    'LBL_REFRESH'      : 'Làm mới',
    'LBL_VIEWTYPE'     : 'Kiểu xem',
    'LBL_BOLD'         : 'In đậm',
    'LBL_ITALIC'       : 'Ngiêng',
    'LBL_UNDERLINE'    : 'Gạch dưới',
    'LBL_REGULAR'      : 'Bình thường',
    'LBL_STRIKE'       : 'Strike',
    'LBL_INDENT'       : 'Thụt về',
    'LBL_OUTDENT'      : 'Quá hạn',
    'LBL_UNDO'         : 'Trở lại',
    'LBL_REDO'         : 'Làm lại',
    'LBL_CUT'          : 'Cắt',
    'LBL_UNLINK'       : 'Bở link',
    'LBL_COPY'         : 'Sao chép',
    'LBL_PASTE'        : 'Dán',
    'LBL_INSERT'       : 'Thêm',
    'LBL_IMAGE'        : 'Ảnh',
    'LBL_LINK'         : 'Link',
    'LBL_DISCONNECT'    : 'Mất kết nối',
    'LBL_APPLICATIONS'  : 'Các ứng dụng',
    'LBL_ADD_FOLDER'    : 'Thêm thư mục',
    'LBL_INFORMATION'   : 'Thông tin',
    'LBL_TEXT_COLOR'    : 'Màu chữ',
    'LBL_BACK_COLOR'    : 'Màu nền',
    'LBL_RESET_DEFAULT' : 'Về mặc định',
    'LBL_DOWNLOAD_COMP' : 'Tải về máy',
    'LBL_ORDERED_LIST'  : 'Danh sách có thứ tự',
    'LBL_BACKGROUND_IMAGE' : 'Ảnh nền',
    'LBL_BACKGROUND_COLOR' : 'Màu nền',
    'LBL_UNORDERED_LIST'   : 'Danh sách không có thứ tự',
    'LBL_STATUS'   : 'Tình trạng',
    'LBL_READONLY' : 'Chỉ đọc',
    'LBL_CREATED' : 'Tạo lúc',
    'LBL_MODIFIED' : 'Sửa lúc',
    'LBL_SHOW_COLUMNS' : 'Hiện các cột',
    'LBL_MOVE' : 'Di chuyển',
    'LBL_OPTIONS' : 'Cài đặt'
  };

})();
