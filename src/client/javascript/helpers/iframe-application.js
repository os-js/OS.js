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

import IFrameApplicationWindow from 'helpers/iframe-application-window';
import Application from 'core/application';

/////////////////////////////////////////////////////////////////////////////
// IFrame Application Helper
/////////////////////////////////////////////////////////////////////////////

/**
 * IFrame Application constructor
 *
 * @desc
 * <pre><code>
 * Usage: Just apply the correct options and this should work
 * automatically.
 *
 * This just inits an empty application with a window that uses
 * iframe for contents. Look at the IFrameApplicationWindow
 * constructor for more options you can apply here.
 * </code></pre>
 */
export default class IFrameApplication extends Application {

  /**
   * This is an Iframe Window
   *
   * See `Window` for more options
   *
   * @param   {String}    name          Process name
   * @param   {Object}    args          Process arguments
   * @param   {Object}    metadata      Application metadata
   * @param   {Object}    opts          Application options
   * @param   {Object}    opts.src      Iframe Source
   */
  constructor(name, args, metadata, opts) {
    super(...arguments);

    this.options = Object.assign({}, {
      icon: '',
      title: 'IframeApplicationWindow'
    }, opts);
    this.options.src = this._getResource(this.options.src);
  }

  init(settings, metadata) {
    super.init(...arguments);

    const name = this.__pname + 'Window';
    this._addWindow(new IFrameApplicationWindow(name, this.options, this));
  }

  /**
   * When Application receives a message from IFrame
   *
   * @alias IFrameApplicationWindow#onPostMessage
   *
   * @param   {*}       message     The message
   * @param   {Event}   ev          DOM Event
   */
  onPostMessage(message, ev) {
    console.debug('IFrameApplication::onPostMessage()', message);

    const _response = (err, res) => {
      this.postMessage({
        id: message.id,
        method: message.method,
        error: err,
        result: Object.assign({}, res)
      });
    };

    if ( typeof message.id === 'number' && message.method ) {
      if ( this[message.method] ) {
        this[message.method](message.args || {}, _response);
      } else {
        _response('No such method');
      }
    }
  }

  /**
   * @param   {*}       message     The message
   * @alias IFrameApplicationWindow#postMessage
   */
  postMessage(message) {
    const win = this._getMainWindow();
    if ( win ) {
      win.postMessage(message);
    }
  }

}

