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
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
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
import Process from 'core/process';
import {_} from 'core/locales';

function createMatch(m, sname) {
  if ( typeof m === 'string' ) {
    return new RegExp(m);
  } else if ( !m ) {
    return new RegExp('^' + (sname + '://').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));
  }

  return m;
}

/**
 * A VFS mountpoint
 *
 * @desc Connects to a Transport
 */
export default class Mountpoint {

  /**
   * Constructs a new Mountpoint
   * @param {Object} options Mountpoint options
   */
  constructor(options) {
    this.options = Object.assign({
      name: null,
      root: null,
      match: null,

      enabled: true,
      readOnly: false,
      transport: null,
      visible: true,
      searchable: false,
      dynamic: true,
      internal: false,
      special: false,
      options: {}
    }, options);

    if ( !this.options.transport ) {
      throw new Error('No transport was defined for mountpoint ' + this.options.name);
    }

    if ( !this.options.name ) {
      throw new Error(_('ERR_VFSMODULE_INVALID_CONFIG_FMT'));
    }

    const sname = this.options.name.replace(/\s/g, '-').toLowerCase();

    const defaults = {
      icon: 'devices/drive-harddisk.png',
      name: sname,
      title: this.options.name,
      description: this.options.description || this.options.name,
      root: sname + ':///',
      match: createMatch(this.options.match, sname)
    };

    Object.keys(defaults).forEach((k) => {
      if ( !this.options[k] ) {
        this.options[k] = defaults[k];
      }
    });

    this.name = sname;
    this.isMounted = false;
  }

  /**
   * Mounts given Mountpoint
   * @param {Object} [options] Mount options
   * @return {Promise<Boolean, Error>}
   */
  mount(options) {
    options = Object.assign({
      notify: true
    }, options || {});

    if ( !this.isMounted && !this.option('special') ) {
      if ( options.notify ) {
        Process.message('vfs:mount', this.option('name'), {source: null});
      }
      this.isMounted = true;
    }

    return Promise.resolve();
  }

  /**
   * Unmount given Mountpoint
   * @param {Object} [options] Unmount options
   * @return {Promise<Boolean, Error>}
   */
  unmount(options) {
    options = Object.assign({
      notify: true
    }, options || {});

    if ( this.isMounted && !this.option('special') ) {
      if ( options.notify ) {
        Process.message('vfs:unmount', this.option('name'), {source: null});
      }
      this.isMounted = false;
    }

    return Promise.resolve();
  }

  /**
   * Check if mounted
   * @return {Boolean}
   */
  mounted() {
    return this.isMounted;
  }

  /**
   * Check if enabled
   * @return {Boolean}
   */
  enabled() {
    return this.option('enabled');
  }

  /**
   * Gets an option by name
   * @param {String} name Option name
   * @return {*}
   */
  option(name) {
    return this.options[name];
  }

  /**
   * Check if readonly
   * @return {Boolean}
   */
  isReadOnly() {
    return this.option('readOnly');
  }

  /**
   * Set mounted state
   * @param {Boolean} mounted State
   */
  setMounted(mounted) {
    this.isMounted = mounted === true;
  }

  /**
   * Perform a request to assiged transport
   * @param {String}   method     VFS Method
   * @param {Array}    args       VFS Arguments
   * @param {Object}   [options]  Options
   * @return {Promise<Object, Error>}
   */
  request(method, args, options) {
    const transport = this.option('transport');
    if ( transport ) {
      return transport.request(method, args, options, this);
    }

    return Promise.reject(new Error(_('ERR_VFSMODULE_NOT_FOUND_FMT', test)));
  }

}
