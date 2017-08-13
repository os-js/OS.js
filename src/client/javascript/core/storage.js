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

import Promise from 'bluebird';
import Connection from 'core/connection';
import Process from 'core/process';
import SettingsManager from 'core/settings-manager';

let _instance;

/**
 * Storage Base Class
 *
 * @abstract
 */
export default class Storage {

  static get instance() {
    return _instance;
  }

  constructor() {
    /* eslint consistent-this: "off" */
    _instance = this;

    this.saveTimeout = null;
  }

  /**
   * Initializes the Storage
   * @return {Promise<undefined, Error>}
   */
  init() {
    return Promise.resolve();
  }

  /**
   * Destroys the Storage
   */
  destroy() {
    _instance = null;
  }

  /**
   * Default method to save given settings pool
   *
   * @param  {String}           [pool]        Pool Name
   * @param  {*}                storage       Storage data
   * @return {Promise<Boolean, Error>}
   */
  saveSettings(pool, storage) {
    clearTimeout(this.saveTimeout);

    return new Promise((resolve, reject) => {
      this.saveTimeout = setTimeout(() => {
        Connection.request('settings', {pool: pool, settings: Object.assign({}, storage)})
          .then(resolve).catch(reject);
        clearTimeout(this.saveTimeout);
      }, 250);
    });
  }

  /**
   * Default method for saving current sessions
   * @return {Promise<Boolean, Error>}
   */
  saveSession() {
    return new Promise((resolve, reject) => {
      const data = Process.getProcesses()
        .filter((proc) => typeof proc._getSessionData === 'function')
        .map((proc) => proc._getSessionData());

      SettingsManager.set('UserSession', null, data, (err, res) => {
        return err ? reject(err) : resolve(res);
      });
    });
  }

  /**
   * Get last saved sessions
   * @return {Promise<Object[], Error>}
   */
  getLastSession() {
    const res = SettingsManager.get('UserSession');
    const list = (res || []).map((iter) => {
      const args = iter.args;
      args.__resume__ = true;
      args.__windows__ = iter.windows || [];
      return {name: iter.name, args};
    });

    return Promise.resolve(list);
  }
}

