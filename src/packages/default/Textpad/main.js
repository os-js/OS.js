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

/*eslint valid-jsdoc: "off"*/
const DefaultApplication = OSjs.require('helpers/default-application');
const DefaultApplicationWindow = OSjs.require('helpers/default-application-window');

class ApplicationTextpadWindow extends DefaultApplicationWindow {

  constructor(app, metadata, file) {
    super('ApplicationTextpadWindow', {
      allow_drop: true,
      icon: metadata.icon,
      title: metadata.name,
      width: 450,
      height: 300
    }, app, file);
  }

  init(wmRef, app) {
    const root = super.init(...arguments);

    // Load and set up scheme (GUI) here
    this._render('TextpadWindow', require('osjs-scheme-loader!scheme.html'));

    this._find('Text').on('input', () => {
      this.hasChanged = true;
    });

    return root;
  }

  updateFile(file) {
    super.updateFile(...arguments);

    const gel = this._find('Text');
    if ( gel ) {
      gel.$element.focus();
    }
  }

  showFile(file, content) {
    const gel = this._find('Text');
    if ( gel ) {
      gel.set('value', content || '');
    }

    super.showFile(...arguments);
  }

  getFileData() {
    var gel = this._find('Text');
    return gel ? gel.get('value') : '';
  }

  _focus() {
    if ( super._focus(...arguments) ) {
      var gel = this._find('Text');
      if ( gel ) {
        if ( gel.$element ) {
          gel.$element.focus();
        }
      }
      return true;
    }
    return false;
  }
}

class ApplicationTextpad extends DefaultApplication {

  constructor(args, metadata) {
    super('ApplicationTextpad', args, metadata, {
      extension: 'txt',
      mime: 'text/plain',
      filename: 'New text file.txt'
    });
  }

  init(settings, metadata) {
    super.init(...arguments);

    const file = this._getArgument('file');

    this._addWindow(new ApplicationTextpadWindow(this, metadata, file));
  }

}

OSjs.Applications.ApplicationTextpad = ApplicationTextpad;
