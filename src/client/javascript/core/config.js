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
 * @licence Simplified BSD License
 */
import * as SimpleJSON from 'simplejsonconf';

/**
 * Method for getting a config parameter by path (Ex: "VFS.Mountpoints.shared.enabled")
 *
 * @param   {String}    [path]                        Path
 * @param   {*}         [defaultValue=undefined]      Use default value
 *
 * @return  {*}             Parameter value or entire tree on no path
 */
export function getConfig(path, defaultValue) {
  const config = OSjs.getConfig();
  if ( !path ) {
    return config;
  }

  const result = SimpleJSON.getJSON(config, path, defaultValue);
  return (typeof result === 'object' && !(result instanceof Array)) ? Object.assign({}, result) : result;
}

/**
 * Get default configured path
 *
 * @param   {String}    fallback      Fallback path on error
 * @return  {String}
 */
export function getDefaultPath(fallback) {
  if ( fallback && fallback.match(/^\//) ) {
    fallback = null;
  }
  return getConfig('VFS.Home') || fallback || getConfig('VFS.Dist');
}

/**
 * Gets the browser window path
 *
 * @param {String}    [app]     Append this path
 *
 * @return {String}
 */
export function getBrowserPath(app) {
  let str = getConfig('Connection.RootURI');
  if ( typeof app === 'string' ) {
    str = str.replace(/\/?$/, app.replace(/^\/?/, '/'));
  }
  return str;
}

/**
 * Gets the browser Locale
 *
 * For example 'en_EN'
 *
 * @return  {String}          Locale string
 */
export function getUserLocale() {
  const loc = ((window.navigator.userLanguage || window.navigator.language) || 'en-EN').replace('-', '_');

  // Restricts to a certain type of language.
  // Example: There are lots of variants of the English language, but currently we only
  // provide locales for one of them, so we force to use the one available.
  const map = {
    'nb': 'no_NO',
    'es': 'es_ES',
    'ru': 'ru_RU',
    'en': 'en_EN'
  };

  const major = loc.split('_')[0] || 'en';
  const minor = loc.split('_')[1] || major.toUpperCase();
  if ( map[major] ) {
    return map[major];
  }
  return major + '_' + minor;
}
