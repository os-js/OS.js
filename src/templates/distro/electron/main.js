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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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
'use strict';

const electron = require('electron');
const app = electron.app
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');
const osjs = require('osjs/core/instance');

let mainWindow;

function createServer() {
  if ( app.server ) {
    return Promise.resolve();
  }

  const opts = {
    ROOT: __dirname,
    SERVERDIR: __dirname,
    PORT: 8000,
    //LOGLEVEL: 15,
    AUTH: 'demo',
    STORAGE: 'demo'
  };

  return new Promise(function(resolve, reject) {
    osjs.init(opts).then(function() {
      resolve(osjs.run());
    }).catch(reject);
  });
}

function createWindow() {
  createServer().then(function() {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600
    });

    mainWindow.loadURL('http://localhost:8000');

    //mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function() {
      mainWindow = null
    })
  }).catch(function(err) {
    alert(err);
  });
}

app.on('ready', createWindow)

app.on('window-all-closed', function() {
  if ( process.platform !== 'darwin' ) {
    app.quit();
  }
})

app.on('activate', function() {
  if ( mainWindow === null ) {
    createWindow();
  }
})
