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

import axios from 'axios';
import Promise from 'bluebird';
import EventHandler from 'helpers/event-handler';
import Loader from 'helpers/loader';
import {getConfig} from 'core/config';

//let _CALL_INDEX = 1;
function progressHandler(ev, onprogress) {
  if ( ev.lengthComputable ) {
    onprogress(ev, ev.loaded / ev.total);
  } else {
    onprogress(ev, -1);
  }
}

/*
 * Attaches options to a XHR call
 */
function appendRequestOptions(data, options) {
  options = options || {};

  const onprogress = options.onprogress || function() {};
  const ignore = ['onsuccess', 'onerror', 'onprogress', 'oncanceled'];

  Object.keys(options).forEach((key) => {
    if ( ignore.indexOf(key) === -1 ) {
      data[key] = options[key];
    }
  });

  data.onUploadProgress = (ev) => progressHandler(ev, onprogress);
  data.onDownloadProgress = (ev) => progressHandler(ev, onprogress);

  return data;
}

let _instance;

/**
 * Default Connection Implementation
 *
 * @desc Wrappers for communicating over HTTP, WS and NW
 *
 * @mixes utils/event-handler~EventHandler
 */
export default class Connection {

  static get instance() {
    return _instance;
  }

  /**
   * Create a new Connection
   */
  constructor() {
    /* eslint consistent-this: "off" */
    if ( !_instance ) {
      _instance = this;
    }

    /**
     * If browser is offline
     * @type {Boolean}
     */
    this.offline    = false;

    this.index = 0;
    this._evHandler = new EventHandler(name, []);

    this.onlineFn = () => this.onOnline();
    this.offlineFn = () => this.onOffline();
  }

  /**
   * Initializes the instance
   * @return {Promise<undefined, Error>}
   */
  init() {
    if ( typeof navigator.onLine !== 'undefined' ) {
      window.addEventListener('offline', this.offlineFn);
      window.addEventListener('online', this.onlineFn);
    }

    return Promise.resolve();
  }

  /**
   * Destroys the instance
   */
  destroy() {
    window.removeEventListener('offline', this.offlineFn);
    window.removeEventListener('online', this.onlineFn);

    if ( this._evHandler ) {
      this._evHandler = this._evHandler.destroy();
    }

    _instance = null;
  }

  /**
   * Default method to perform a resolve on a VFS File object.
   *
   * This should return the URL for given resource.
   *
   * @param   {FileMetadata}       item      The File Object
   * @param   {Object}             [options] Options. These are added to the URL
   *
   * @return  {String}
   */
  getVFSPath(item, options) {
    options = options || {};

    const base = getConfig('Connection.RootURI', '/').replace(/\/?$/, '/');
    const defaultDist = getConfig('VFS.Dist');
    if ( window.location.protocol === 'file:' ) {
      return item ? base + item.path.substr(defaultDist.length) : base;
    }

    let url = getConfig('Connection.FSURI', '/');
    if ( item ) {
      url += '/read';
      options.path = item.path;
    } else {
      url += '/upload';
    }

    if ( options ) {
      const q = Object.keys(options).map((k) => {
        return k + '=' + encodeURIComponent(options[k]);
      });

      if ( q.length ) {
        url += '?' + q.join('&');
      }
    }

    return url;
  }

  /**
   * Get if connection is Online
   *
   * @return {Boolean}
   */
  isOnline() {
    return !this.offline;
  }

  /**
   * Get if connection is Offline
   *
   * @return {Boolean}
   */
  isOffline() {
    return this.offline;
  }

  /**
   * Called upon a VFS request completion
   *
   * It is what gets called 'after' a VFS request has taken place
   *
   * @param   {Mountpoint} mount     VFS Module Name
   * @param   {String}     method    VFS Method Name
   * @param   {Object}     args      VFS Method Arguments
   * @param   {*}          response  VFS Response Result
   * @param   {Process}    [appRef]  Application reference
   * @return  {Promise<Boolean, Error>}
   */
  onVFSRequestCompleted(mount, method, args, response, appRef) {
    return Promise.resolve(true);
  }

  /**
   * When browser goes online
   */
  onOnline() {
    console.warn('Connection::onOnline()', 'Going online...');
    this.offline = false;

    if ( this._evHandler ) {
      this._evHandler.emit('online');
    }
  }

  /**
   * When browser goes offline
   *
   * @param {Number} reconnecting Amount retries for connection
   */
  onOffline(reconnecting) {
    console.warn('Connection::onOffline()', 'Going offline...');

    if ( !this.offline && this._evHandler ) {
      this._evHandler.emit('offline', [reconnecting]);
    }

    this.offline = true;
  }

  /**
   * Default method to perform a call to the backend (API)
   *
   * Please use the static request() method externally.
   *
   * @param {String}    method      API method name
   * @param {Object}    args        API method arguments
   * @param {Object}    [options]   Options passed on to the connection request method (ex: XHR.ajax)
   *
   * @return {Promise<Object, Error>}
   */
  createRequest(method, args, options) {
    args = args || {};
    options = options || {};

    if ( this.offline ) {
      return Promise.reject(new Error('You are currently off-line and cannot perform this operation!'));
    }

    const {raw, requestOptions} = this.createRequestOptions(method, args);

    return new Promise((resolve, reject) => {
      axios(appendRequestOptions(requestOptions, options)).then((result) => {
        return resolve(raw ? result.data : {error: false, result: result.data});
      }).catch((error) => {
        reject(new Error(error.message || error));
      });
    });
  }

  /**
   * Creates default request options
   *
   * @param {String}    method      API method name
   * @param {Object}    args        API method arguments
   *
   * @return {Object}
   */
  createRequestOptions(method, args) {
    const realMethod = method.replace(/^FS:/, '');

    let raw = true;
    let requestOptions = {
      responseType: 'json',
      url: getConfig('Connection.APIURI') + '/' + realMethod,
      method: 'POST',
      data: args
    };

    if ( method.match(/^FS:/) ) {
      if ( realMethod === 'get' ) {
        requestOptions.responseType = 'arraybuffer';
        requestOptions.url = args.url || this.getVFSPath({path: args.path});
        requestOptions.method = args.method || 'GET';
        raw = false;
      } else if ( realMethod === 'upload' ) {
        requestOptions.url = this.getVFSPath();
      } else {
        requestOptions.url = getConfig('Connection.FSURI') + '/' + realMethod;
      }
    }

    return {raw, requestOptions};
  }

  /**
   * Subscribe to a event
   *
   * NOTE: This is only available on WebSocket connections
   *
   * @param   {String}    k       Event name
   * @param   {Function}  func    Callback function
   *
   * @return  {Number}
   *
   * @see EventHandler#on
   */
  subscribe(k, func) {
    return this._evHandler.on(k, func, this);
  }

  /**
   * Removes an event subscription
   *
   * @param   {String}    k       Event name
   * @param   {Number}    [idx]   The hook index returned from subscribe()
   *
   * @return {Boolean}
   *
   * @see EventHandler#off
   */
  unsubscribe(k, idx) {
    return this._evHandler.off(k, idx);
  }

  /*
   * This is a wrapper for making a request
   *
   * @desc This method performs a request to the server
   *
   * @param {String}   m        Method name
   * @param {Object}   a        Method arguments
   * @param {Object}   options  Request options
   * @return {Promise<Object, Error>}
   */
  static request(m, a, options) {
    a = a || {};
    options = options || {};

    if ( options && typeof options !== 'object' ) {
      return Promise.reject(new TypeError('request() expects an object as options'));
    }

    Loader.create('Connection.request');

    if ( typeof options.indicator !== 'undefined' ) {
      delete options.indicator;
    }

    return new Promise((resolve, reject) => {
      this.instance.createRequest(m, a, options).then((response) => {
        if ( response.error ) {
          return reject(new Error(response.error));
        }
        return resolve(response.result);
      }).catch(((err) => {
        reject(new Error(err));
      })).finally(() => {
        Loader.destroy('Connection.request');
      });
    });
  }
}
