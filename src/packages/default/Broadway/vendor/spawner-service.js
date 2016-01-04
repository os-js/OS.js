var PORT = 9000;

var spawn = require('child_process').spawn;

function spawnBroadwayProcess(launch) {
  var cmd = 'nohup';
  var args = [launch];
  var env = {
    BROADWAY_DISPLAY: ':5',
    DISPLAY: ':0',
    XAUTHORITY: '~/.Xauthority',
    GDK_BACKEND: 'broadway',
    UBUNTU_MENUPROXY: '',
    LIBOVERLAY_SCROLLBAR: '0'
  };

  Object.keys(env).forEach(function(k) {
    process.env[k] = env[k];
  });

  var ls = spawn(cmd, args, {env: process.env});

  ls.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  ls.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  ls.on('error', function (data) {
    console.log('error: ' + data);
  });

  ls.on('close', function (code) {
    console.log('child process exited with code ' + code);
  });
}

var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: PORT});

wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    console.log('received: %s', message);
    var json = JSON.parse(message);
    if ( json.method === 'launch' ) {
      spawnBroadwayProcess(json.argument);
    }
  });
});
