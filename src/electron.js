const {app, BrowserWindow} = require('electron');
const getPort = require('get-port');
const osjs = require('./server');

const main = async () => {
  const port = await getPort();
  const server = osjs({port});

  const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600
    });

    win.loadURL(`http://localhost:${port}`);
    win.focus();
  };

  const onReady = () => {
    server.on('osjs/core:started', createWindow);
    server.boot()
      .catch((err) => {
        console.error(err);
        app.quit();
      });
  };

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('ready', onReady);
};

main();
