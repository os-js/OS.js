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
const _hooks = {
  'onInitialize': [],
  'onInited': [],
  'onSessionLoaded': [],
  'onShutdown': [],
  'onApplicationLaunch': [],
  'onApplicationLaunched': [],
  'onBlurMenu': []
};

/**
 * Get all hooks
 * @param {String} name Hook name
 * @return {Map<String, Array>}
 */
export function getHooks(name) {
  return _hooks[name];
}

/**
 * Method for triggering a hook
 *
 * @param   {String}    name      Hook name
 * @param   {Array}     args      List of arguments
 * @param   {Object}    thisarg   'this' ref
 */
export function triggerHook(name, args, thisarg) {
  thisarg = thisarg || OSjs;
  args = args || [];

  if ( _hooks[name] ) {
    _hooks[name].forEach(function(hook) {
      if ( typeof hook === 'function' ) {
        try {
          hook.apply(thisarg, args);
        } catch ( e ) {
          console.warn('Error on Hook', e, e.stack);
        }
      } else {
        console.warn('No such Hook', name);
      }
    });
  }
}

/**
 * Method for adding a hook
 *
 * @param   {String}    name    Hook name
 * @param   {Function}  fn      Callback => fn()
 *
 * @return  {Number}       The index of hook
 */
export function addHook(name, fn) {
  if ( typeof _hooks[name] !== 'undefined' ) {
    return _hooks[name].push(fn) - 1;
  }
  return -1;
}

/**
 * Method for removing a hook
 *
 * @param   {String}    name    Hook name
 * @param   {Number}    index     Hook index
 *
 * @return  {Boolean}
 */
export function removeHook(name, index) {
  if ( typeof _hooks[name] !== 'undefined' ) {
    if ( _hooks[name][index] ) {
      _hooks[name][index] = null;
      return true;
    }
  }
  return false;
}
