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
const Application = OSjs.require('core/application');
const Window = OSjs.require('core/window');

class ApplicationEXAMPLEWindow extends Window {

  constructor(app, metadata) {
    super('ApplicationEXAMPLEWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app);
  }

  init(wmRef, app) {
    const root = super.init(...arguments);

    // Render our Scheme file fragment into this Window
    this._render('EXAMPLEWindow', require('osjs-scheme-loader!./scheme.html'));

    // Put your GUI code here (or make a new prototype function and call it):

    return root;
  }

}

class ApplicationEXAMPLE extends Application {

  constructor(args, metadata) {
    super('ApplicationEXAMPLE', args, metadata);
  }

  init(settings, metadata) {
    super.init(...arguments);

    this._addWindow(new ApplicationEXAMPLEWindow(this, metadata));

    // Example on how to call `api.js` methods
    this._api('test', {}).then((res) => {
      return console.log('Result from your server API method', res);
    })
  };
}

OSjs.Applications.ApplicationEXAMPLE = ApplicationEXAMPLE;
