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

  OSjs.Locales.ko_KR = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : '파일을 열 수 없습니다',
    'ERR_WM_NOT_RUNNING'        : '윈도우 관리자가 실행 중이지 않습니다',
    'ERR_FILE_OPEN_FMT'         : '\'**{0}**\' 파일을 실행할 수 없습니다',
    'ERR_APP_MIME_NOT_FOUND_FMT': '\'{0}\' 파일을 실행할 수 있는 응용 프로그램을 찾을 수 없습니다',
    'ERR_APP_LAUNCH_FAILED'     : '응용 프로그램을 실행할 수 없습니다',
    'ERR_APP_LAUNCH_FAILED_FMT' : '{0}을(를) 실행할 수 없습니다',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : '응용 프로그램 \'{0}\'을 준비할 수 없습니다: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : '응용 프로그램  \'{0}\'을 초기화할 수 없습니다: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : '응용 프로그램 \'{0}\' 리소스를 찾을 수 없거나 로드할 수 없습니다!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : '응용 프로그램 \'{0}\'을 준비할 수 없습니다: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : '\'{0}\'은(는) 이미 실행중이며 하나의 인스턴스만 허용됩니다!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : '\'{0}\'을(를) 실행할 수 없습니다. 응용 프로그램 manifest 데이터를 찾을 수 없습니다!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : '\'{0}\'을(를) 실행할 수 없습니다. 사용중인 웹브라우저가 다음 기능을 지원하지 않습니다: {1}',

    'ERR_NO_WM_RUNNING'         : '윈도우 관리자가 실행 중이지 않습니다',
    'ERR_CORE_INIT_FAILED'      : 'OS.js를 초기화할 수 없습니다',
    'ERR_CORE_INIT_FAILED_DESC' : 'OS.js를 초기화하던 중 오류가 발생했습니다',
    'ERR_CORE_INIT_NO_WM'       : 'OS.js를 실행할 수 없습니다: 윈도우 관리자가 정의되지 않았습니다!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'OS.js를 실행할 수 없습니다: 윈도우 관리자를 실행할 수 없습니다: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'OS.js를 실행할 수 없습니다: 리소스를 준비할 수 없습니다...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript 오류 보고서',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : '오류가 발생했습니다. 버그일 수 있습니다',

    'ERR_APP_API_ERROR'           : '응용 프로그램 API 오류',
    'ERR_APP_API_ERROR_DESC_FMT'  : '응용 프로그램 {0}이 명령을 실행할 수 없습니다\'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': '누락된 매개변수: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : '알 수 없는 오류입니다',

    'ERR_OPERATION_TIMEOUT'       : '시간초과',
    'ERR_OPERATION_TIMEOUT_FMT'   : '시간초과 ({0})',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : '이미 \'{0}\' 창이 있습니다',
    'WINDOW_MINIMIZE' : '최소화',
    'WINDOW_MAXIMIZE' : '최대화',
    'WINDOW_RESTORE'  : '이전 크기로',
    'WINDOW_CLOSE'    : '닫기',
    'WINDOW_ONTOP_ON' : '위로 (활성화)',
    'WINDOW_ONTOP_OFF': '위로 (비활성화)',

    // Handler
    'TITLE_SIGN_OUT' : '로그아웃',
    'TITLE_SIGNED_IN_AS_FMT' : '{0}(으)로 로그인',

    // SESSION
    'MSG_SESSION_WARNING' : 'OS.js를 정말 종료하시겠습니까? 저장하지 않은 설정과 응용 프로그램 데이터가 손실될 수 있습니다!',

    // Service
    'BUGREPORT_MSG' : '버그라고 생각되면 보고해주십시요.\n오류가 어떻게 발생했는지 간단한 설명을 해주십시요. 가능하다면 재현 상황을 설명해주십시요',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : '{0}(으)로 외부 서비스 로그인',

    // Utils
    'ERR_UTILS_XHR_FATAL' : '심각한 오류',
    'ERR_UTILS_XHR_FMT' : 'AJAX/XHR 오류: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : '로그아웃 (종료)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : '\'{0}\' 사용자 로그아웃.\n현재 세션을 저장하시겠습니까?',

    'DIALOG_CLOSE' : '닫기',
    'DIALOG_CANCEL': '취소',
    'DIALOG_APPLY' : '적용',
    'DIALOG_OK'    : '확인',

    'DIALOG_ALERT_TITLE' : '알림 다이얼로그',

    'DIALOG_COLOR_TITLE' : '색상 다이얼로그',
    'DIALOG_COLOR_R' : '빨강: {0}',
    'DIALOG_COLOR_G' : '초록: {0}',
    'DIALOG_COLOR_B' : '파랑: {0}',
    'DIALOG_COLOR_A' : '투명: {0}',

    'DIALOG_CONFIRM_TITLE' : '확인 다이얼로그',

    'DIALOG_ERROR_MESSAGE'   : '메시지',
    'DIALOG_ERROR_SUMMARY'   : '요약',
    'DIALOG_ERROR_TRACE'     : '추적',
    'DIALOG_ERROR_BUGREPORT' : '오류 보고',

    'DIALOG_FILE_SAVE'      : '저장',
    'DIALOG_FILE_OPEN'      : '열기',
    'DIALOG_FILE_MKDIR'     : '디렉토리 생성',
    'DIALOG_FILE_MKDIR_MSG' : '**{0}**에 디렉토리 생성',
    'DIALOG_FILE_OVERWRITE' : '정말 \'{0}\'을 덮어쓰시겠습니까?',
    'DIALOG_FILE_MNU_VIEWTYPE' : '보기 타입',
    'DIALOG_FILE_MNU_LISTVIEW' : '자세히 보기',
    'DIALOG_FILE_MNU_TREEVIEW' : '간단히 보기',
    'DIALOG_FILE_MNU_ICONVIEW' : '아이콘으로 보기',
    'DIALOG_FILE_ERROR'        : '파일 다이얼로그 오류',
    'DIALOG_FILE_ERROR_SCANDIR': '오류가 발생했습니다. \'{0}\' 폴더를 불러올 수 없습니다',
    'DIALOG_FILE_MISSING_FILENAME' : '파일을 선택하거나 새로운 파일 이름을 입력해주십시요!',
    'DIALOG_FILE_MISSING_SELECTION': '파일을 선택해야 합니다!',

    'DIALOG_FILEINFO_TITLE'   : '파일 정보',
    'DIALOG_FILEINFO_LOADING' : '파일 정보를 불러오는 중: {0}',
    'DIALOG_FILEINFO_ERROR'   : '파일 정보 다이얼로그 오류',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : '파일 정보를 가져올 수 없습니다 **{0}**',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : '파일 정보를 가져올 수 없습니다: {0}',

    'DIALOG_INPUT_TITLE' : '입력 다이얼로그',

    'DIALOG_FILEPROGRESS_TITLE'   : '파일 명령 처리',
    'DIALOG_FILEPROGRESS_LOADING' : '처리 중...',

    'DIALOG_UPLOAD_TITLE'   : '업로드 다이얼로그',
    'DIALOG_UPLOAD_DESC'    : '**{0}**에 파일 업로드.<br />최대 용량: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : '\'{0}\' ({1} {2})을(를) {3}에 업로드 중',
    'DIALOG_UPLOAD_MSG'     : '파일을 업로드 중...',
    'DIALOG_UPLOAD_FAILED'  : '업로드 실패',
    'DIALOG_UPLOAD_FAILED_MSG'      : '업로드에 실패했습니다',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : '알 수 없는 오류...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': '사용자에 의해 취소...',
    'DIALOG_UPLOAD_TOO_BIG': '파일이 너무 큽니다',
    'DIALOG_UPLOAD_TOO_BIG_FMT': '파일이 너무 큽니다, {0} 초과',

    'DIALOG_FONT_TITLE' : '글꼴 다이얼로그',

    'DIALOG_APPCHOOSER_TITLE' : '응용 프로그램 선택',
    'DIALOG_APPCHOOSER_MSG'   : '열려는 응용 프로그램을 선택해주십시요',
    'DIALOG_APPCHOOSER_NO_SELECTION' : '응용 프로그램을 선택해야 합니다',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : '{0}을(를) 기본 응용 프로그램으로 설정',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPI 모듈이 설정되지 않았거나 사용할 수 없습니다',
    'GAPI_SIGN_OUT'           : 'Google API 서비스에서 로그아웃',
    'GAPI_REVOKE'             : '권한을 해제하고 로그아웃',
    'GAPI_AUTH_FAILURE'       : 'Google API 인증에 실패했습니다',
    'GAPI_AUTH_FAILURE_FMT'   : '인증에 실패: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Google API 로드 실패',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Windows Live API 모듈이 설정되지 않았거나 사용할 수 없습니다',
    'WLAPI_SIGN_OUT'          : 'Window Live API 서비스에서 로그아웃',
    'WLAPI_LOAD_FAILURE'      : 'Windows Live API 로드 실패',
    'WLAPI_LOGIN_FAILED'      : 'Windows Live API에 로그인 실패',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Windows Live API에 로그인 실패: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API가 {0} 상태를 반환했습니다',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Database의 이름 없이는 IndexedDB를 생성할 수 없습니다',
    'IDB_NO_SUCH_ITEM'   : '찾을 수 없습니다',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : '심각한 오류',
    'ERR_VFS_UNAVAILABLE'     : '사용할 수 없음',
    'ERR_VFS_FILE_ARGS'       : '적어도 하나의 매개변수가 필요합니다',
    'ERR_VFS_NUM_ARGS'        : '매개변수가 충분하지 않습니다',
    'ERR_VFS_EXPECT_FILE'     : '파일 객체가 필요합니다',
    'ERR_VFS_EXPECT_SRC_FILE' : '원본 파일 객체가 필요합니다',
    'ERR_VFS_EXPECT_DST_FILE' : '대상 파일 객체가 필요합니다',
    'ERR_VFS_FILE_EXISTS'     : '대상 파일이 이미 존재합니다',
    'ERR_VFS_TRANSFER_FMT'    : '저장소 간 파일을 이동하는 중 오류가 발생했습니다: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : '파일을 업로드하려면 대상을 선택해주십시요',
    'ERR_VFS_UPLOAD_NO_FILES' : '업로드하려는 파일을 선택해주십시요',
    'ERR_VFS_UPLOAD_FAIL_FMT' : '파일을 업로드하는데 실패했습니다: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': '파일 업로드가 취소되었습니다',
    'ERR_VFS_DOWNLOAD_NO_FILE': '경로 없이 경로를 다운로드할 수 없습니다',
    'ERR_VFS_DOWNLOAD_FAILED' : '다운로드 중 오류가 발생하였습니다: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': '응답이 비어있습니다',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': '파일 다운로드',

    'ERR_VFSMODULE_XHR_ERROR'      : 'XHR 오류',
    'ERR_VFSMODULE_ROOT_ID'        : '최상위 디렉토리 id를 찾을 수 없습니다',
    'ERR_VFSMODULE_NOSUCH'         : '파일이 존재하지 않습니다',
    'ERR_VFSMODULE_PARENT'         : '부모를 찾을 수 없습니다',
    'ERR_VFSMODULE_PARENT_FMT'     : '부모를찾을 수 없습니다: {0}',
    'ERR_VFSMODULE_SCANDIR'        : '디렉토리 불러오기 실패',
    'ERR_VFSMODULE_SCANDIR_FMT'    : '디렉토리를 불러올 수 없습니다: {0}',
    'ERR_VFSMODULE_READ'           : '파일 읽기 실패',
    'ERR_VFSMODULE_READ_FMT'       : '파일을 읽을 수 없습니다: {0}',
    'ERR_VFSMODULE_WRITE'          : '파일 생성 실패',
    'ERR_VFSMODULE_WRITE_FMT'      : '파일을 생성할 수 없습니다: {0}',
    'ERR_VFSMODULE_COPY'           : '복사 실패',
    'ERR_VFSMODULE_COPY_FMT'       : '복사할 수 없습니다: {0}',
    'ERR_VFSMODULE_UNLINK'         : '바로가기 해제',
    'ERR_VFSMODULE_UNLINK_FMT'     : '바로가기를 해제할 수 없습니다: {0}',
    'ERR_VFSMODULE_MOVE'           : '파일 이동 실패',
    'ERR_VFSMODULE_MOVE_FMT'       : '파일을 이동할 수 없습니다: {0}',
    'ERR_VFSMODULE_EXIST'          : '파일 존재 여부 확인',
    'ERR_VFSMODULE_EXIST_FMT'      : '파일이 존재하는지 확인할 수 없습니다: {0}',
    'ERR_VFSMODULE_FILEINFO'       : '파일 정보 조회 실패',
    'ERR_VFSMODULE_FILEINFO_FMT'   : '파일 정보를 읽을 수 없습니다: {0}',
    'ERR_VFSMODULE_MKDIR'          : '디렉토리 생성 실패',
    'ERR_VFSMODULE_MKDIR_FMT'      : '디렉토리를 생성할 수 없습니다: {0}',
    'ERR_VFSMODULE_URL'            : '파일 경로 찾기 실패',
    'ERR_VFSMODULE_URL_FMT'        : '파일의 경로를 찾을 수 없습니다: {0}',
    'ERR_VFSMODULE_TRASH'          : '휴지통으로 보내기 실패',
    'ERR_VFSMODULE_TRASH_FMT'      : '휴지통으로 보낼 수 없습니다: {0}',
    'ERR_VFSMODULE_UNTRASH'        : '휴지통 복원 실패',
    'ERR_VFSMODULE_UNTRASH_FMT'    : '휴지통에서 복원할 수 없습니다: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : '휴지통 비우기 실패',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : '휴지통을 비울 수 없습니다: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Dropbox API에 가입되어 있습니다',
    'DROPBOX_SIGN_OUT'           : 'Google API Services에서 로그아웃',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : '경로 탐색 실패: 항목을 찾을 수 없습니다',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': '패키지 설치 디렉토리가 이미 존재하여 설치를 계속 할 수 없습니다!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : '파일을 열 수 없습니다',
    'ERR_FILE_APP_OPEN_FMT'     : '마임(MIME) {1} 이(가) 지원되지 않아 파일 {0} 을(를) 열지 못했습니다',
    'ERR_FILE_APP_OPEN_ALT_FMT' : '파일 {0} 을(를) 열지 못했습니다',
    'ERR_FILE_APP_SAVE_ALT_FMT' : '파일 {0} 을(를) 저장하지 못했습니다',
    'ERR_GENERIC_APP_FMT'       : '{0} 응용 프로그램 오류',
    'ERR_GENERIC_APP_ACTION_FMT': '\'{0}\' 수행에 실패하였습니다',
    'ERR_GENERIC_APP_UNKNOWN'   : '알 수 없는 오류',
    'ERR_GENERIC_APP_REQUEST'   : '명령을 처리하는 도중 오류가 발생하였습니다',
    'ERR_GENERIC_APP_FATAL_FMT' : '치명적인 오류: {0}',
    'MSG_GENERIC_APP_DISCARD'   : '변경사항을 저장하지 않겠습니까?',
    'MSG_FILE_CHANGED'          : '파일이 변경되었습니다. 새로고침 하시겠습니까?',
    'MSG_APPLICATION_WARNING'   : '응용 프로그램 경고',
    'MSG_MIME_OVERRIDE'         : '파일 타입 "{0}" 은(는) 지원되지 않습니다, "{1}" (으)로 대신합니다',

    //
    // General
    //

    'LBL_UNKNOWN'      : '알수없음',
    'LBL_APPEARANCE'   : '모양',
    'LBL_USER'         : '사용자',
    'LBL_NAME'         : '이름',
    'LBL_APPLY'        : '적용',
    'LBL_FILENAME'     : '파일명',
    'LBL_PATH'         : '경로',
    'LBL_SIZE'         : '크기',
    'LBL_TYPE'         : '타입',
    'LBL_MIME'         : '마임(MIME)',
    'LBL_LOADING'      : '로딩',
    'LBL_SETTINGS'     : '설정',
    'LBL_ADD_FILE'     : '파일 추가',
    'LBL_COMMENT'      : '댓글',
    'LBL_ACCOUNT'      : '계정',
    'LBL_CONNECT'      : '연결',
    'LBL_ONLINE'       : '온라인',
    'LBL_OFFLINE'      : '오프라인',
    'LBL_AWAY'         : '부재중',
    'LBL_BUSY'         : '바쁨',
    'LBL_CHAT'         : '채팅',
    'LBL_HELP'         : '도움말',
    'LBL_ABOUT'        : '정보',
    'LBL_PANELS'       : '패널',
    'LBL_LOCALES'      : '지역',
    'LBL_THEME'        : '테마',
    'LBL_COLOR'        : '색상',
    'LBL_PID'          : '프로세스 ID',
    'LBL_KILL'         : '종료',
    'LBL_ALIVE'        : '활성',
    'LBL_INDEX'        : '인덱스',
    'LBL_ADD'          : '추가',
    'LBL_FONT'         : '글꼴',
    'LBL_YES'          : '예',
    'LBL_NO'           : '아니오',
    'LBL_CANCEL'       : '취소',
    'LBL_TOP'          : '위',
    'LBL_LEFT'         : '왼쪽',
    'LBL_RIGHT'        : '오른쪽',
    'LBL_BOTTOM'       : '아래',
    'LBL_CENTER'       : '가운데',
    'LBL_FILE'         : '파일',
    'LBL_NEW'          : '새로 만들기',
    'LBL_OPEN'         : '열기',
    'LBL_SAVE'         : '저장',
    'LBL_SAVEAS'       : '다른 이름으로 저장',
    'LBL_CLOSE'        : '닫기',
    'LBL_MKDIR'        : '디렉토리 생성',
    'LBL_UPLOAD'       : '업로드',
    'LBL_VIEW'         : '보기',
    'LBL_EDIT'         : '편집',
    'LBL_RENAME'       : '이름 변경',
    'LBL_DELETE'       : '삭제',
    'LBL_OPENWITH'     : '다른 프로그램으로 열기',
    'LBL_ICONVIEW'     : '아이콘으로 보기',
    'LBL_TREEVIEW'     : '트리로 보기',
    'LBL_LISTVIEW'     : '리스트로 보기',
    'LBL_REFRESH'      : '새로고침',
    'LBL_VIEWTYPE'     : '보기 방식',
    'LBL_BOLD'         : '굵게',
    'LBL_ITALIC'       : '이탤릭체',
    'LBL_UNDERLINE'    : '밑줄',
    'LBL_REGULAR'      : '일반',
    'LBL_STRIKE'       : '취소선',
    'LBL_INDENT'       : '들여쓰기',
    'LBL_OUTDENT'      : '내어쓰기',
    'LBL_UNDO'         : '실행 취소',
    'LBL_REDO'         : '다시 실행',
    'LBL_CUT'          : '잘라내기',
    'LBL_UNLINK'       : '링크 해제',
    'LBL_COPY'         : '복사',
    'LBL_PASTE'        : '붙여넣기',
    'LBL_INSERT'       : '삽입',
    'LBL_IMAGE'        : '이미지',
    'LBL_LINK'         : '링크',
    'LBL_DISCONNECT'    : '연결 해제',
    'LBL_APPLICATIONS'  : '응용 프로그램',
    'LBL_ADD_FOLDER'    : '폴더 추가',
    'LBL_INFORMATION'   : '정보',
    'LBL_TEXT_COLOR'    : '글자색',
    'LBL_BACK_COLOR'    : '배경색',
    'LBL_RESET_DEFAULT' : '기본값으로 복원',
    'LBL_DOWNLOAD_COMP' : '컴퓨터로 다운로드',
    'LBL_ORDERED_LIST'  : '정렬 된 리스트',
    'LBL_BACKGROUND_IMAGE' : '배경 이미지',
    'LBL_BACKGROUND_COLOR' : '배경 색상',
    'LBL_UNORDERED_LIST'   : '정렬 되지 않은 리스트',
    'LBL_STATUS'   : '상태',
    'LBL_READONLY' : '읽기 전용',
    'LBL_CREATED' : '생성됨',
    'LBL_MODIFIED' : '수정됨',
    'LBL_SHOW_COLUMNS' : '열 보기',
    'LBL_MOVE' : '이동',
    'LBL_OPTIONS' : '옵션',
    'LBL_OK' : '확인',
    'LBL_DIRECTORY' : '디렉토리',
    'LBL_CREATE' : '생성',
    'LBL_BUGREPORT' : '버그 리포트',
    'LBL_INSTALL' : '설치',
    'LBL_UPDATE' : '수정',
    'LBL_REMOVE' : '제거',
    'LBL_SHOW_SIDEBAR' : '사이드바 보이기',
    'LBL_SHOW_NAVIGATION' : '네비게이션 보이기',
    'LBL_SHOW_HIDDENFILES' : '숨긴 파일 보이기',
    'LBL_SHOW_FILEEXTENSIONS' : '파일 확장자 보이기'
  };

})();
