/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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

  OSjs.Locales.en_EN = {
    'ERR_FILE_OPEN' : 'Error opening file',
    'ERR_WM_NOT_RUNNING' : 'ERR_WM_NOT_RUNNING',
    'ERR_FILE_OPEN_FMT' : 'The file \'<span>{0}</span>\' could not be opened',
    'ERR_APP_MIME_NOT_FOUND_FMT' : 'Could not find any Applications with support for \'{0}\' files',
    'ERR_APP_LAUNCH_FAILED' : 'Failed to launch Application',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'An error occured while trying to launch: {0}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT' : 'The application \'{0}\' is already launched and allows only one instance!',
    'ERR_APP_CONSTRUCT_FAILED_FMT' : 'Application \'{0}\' construct failed: {1}',
    'ERR_APP_INIT_FAILED_FMT' : 'Application \'{0}\' init() failed: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'Application resources missing for \'{0}\' or it failed to load!',
    'ERR_APP_PRELOAD_FAILED_FMT' : 'Application \'{0}\' preloading failed: \n{1}',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT' : 'Failed to launch \'{0}\'. Application manifest data not found!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Failed to launch \'{0}\'. Your browser does not support: {1}',

    'ERR_JAVASCRIPT_EXCEPTION' : 'JavaScript Error Report',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'An unexpected error occured, maybe a bug.',
    'ERR_CORE_INIT_FAILED' : 'Failed to initialize OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'An error occured while initializing OS.js',
    'ERR_CORE_INIT_NO_WM' : 'Cannot launch OS.js: No window manager defined!',
    'ERR_CORE_INIT_WM_FAILED_FMT' : 'Cannot launch OS.js: Failed to launch Window Manager: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED' : 'Cannot launch OS.js: Failed to preload resources...',

    'ERR_APP_API_ERROR' : 'Application API error',
    'ERR_APP_API_ERROR_DESC_FMT' : 'Application {0} failed to perform operation \'{1}\'',

    // DefaultApplication
    'ERR_FILE_APP_OPEN' : 'Cannot open file',
    'ERR_FILE_APP_OPEN_FMT' : 'The file {0} could not be opened because the mime {1} is not supported',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'The file {0} could not be opened',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'The file {0} could not be saved',
    'ERR_GENERIC_APP_FMT' : '{0} Application Error',
    'ERR_GENERIC_APP_ACTION_FMT' : 'Failed to perform action \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN' : 'Unknown Error',
    'ERR_GENERIC_APP_REQUEST' : 'An error occured while handling your request',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Fatal Error: {0}',
    'MSG_GENERIC_APP_DISCARD' : 'Discard changes?'
  };

})();
