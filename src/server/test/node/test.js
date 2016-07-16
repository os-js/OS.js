(function(_path, _fs) {
  /*eslint strict: ["warn"]*/

  var rootDir = _fs.realpathSync(__dirname + '/../../../../');
  var serverRoot = _path.join(rootDir, 'src', 'server', 'node');

  var assert = require('assert');
  var osjs = require(_path.join(serverRoot, 'core', 'index.js'));
  var osjsServer = require(_path.join(serverRoot, 'http.js'));

  var instance = osjs.init({
    dirname: serverRoot,
    root: rootDir,
    dist: 'dist-dev',
    logging: false,
    nw: false,
    testing: true
  });

  var response = {};
  var request = {
    session: {
      get: function(key) {
        if ( key === 'username' ) {
          return 'demo';
        }
        return null;
      },
      set: function() {
      }
    }
  };

  var serverObject = {
    request: request,
    response: response,
    config: instance.config,
    handler: instance.handler
  };

  process.chdir(rootDir);

  /////////////////////////////////////////////////////////////////////////////
  // PREPARATION
  /////////////////////////////////////////////////////////////////////////////

  describe('Prepare', function() {
    var fs = require('fs');

    describe('#handler', function() {
      it('handler should be set to demo', function() {
        assert.equal('demo', instance.config.handler);
      });
    });

    describe('#vfs', function() {
      var testPath = instance.vfs.getRealPath(serverObject, 'home:///');

      it('read access to demo area', function() {
        if ( fs.accessSync ) {
          assert.doesNotThrow(function() {
            fs.accessSync(testPath.root, fs.R_OK);
          }, Error);
        } else {
          assert.equal(true, true);
        }
      });

      it('write access to demo area', function() {
        if ( fs.accessSync ) {
          assert.doesNotThrow(function() {
            fs.accessSync(testPath.root, fs.W_OK);
          }, Error);
        } else {
          assert.equal(true, true);
        }
      });
    });

  });

  /////////////////////////////////////////////////////////////////////////////
  // VFS
  /////////////////////////////////////////////////////////////////////////////

  describe('VFS', function() {
    var str = 'Mocha Testing';

    describe('#exists', function() {
      it('should not find folder', function(done) {
        var file = {path: 'home:///.mocha'};

        instance.vfs.exists(serverObject, file, function(error, result) {
          assert.equal(false, error);
          assert.equal(false, result);
          done();
        });
      });
    });

    describe('#exists', function() {
      it('should not find file', function(done) {
        instance.vfs.exists(serverObject, {path: 'home:///.mocha/test.txt'}, function(error, result) {
          assert.equal(false, error);
          assert.equal(false, result);
          done();
        });
      });
    });

    describe('#mkdir', function() {
      it('should create folder without error', function(done) {
        instance.vfs.mkdir(serverObject, {path: 'home:///.mocha'}, function(error, result) {
          assert.equal(false, error);
          assert.equal(true, result);
          done();
        });
      });
    });

    describe('#write', function() {
      it('should write file without error', function(done) {
        var data = (new Buffer(str).toString('base64'));
        var file = {
          path: 'home:///.mocha/test.txt',
          data: 'data:text/plain;base64,' + data
        };
        instance.vfs.write(serverObject, file, function(error, result) {
          assert.equal(false, error);
          assert.equal(true, result);
          done();
        });
      });
    });

    describe('#read', function() {
      it('should read file without error', function(done) {
        instance.vfs.read(serverObject, {path: 'home:///.mocha/test.txt'}, function(error, result) {
          assert.equal(false, error);

          var result = result.replace(/^data\:(.*);base64\,/, '') || '';
          result = new Buffer(result, 'base64').toString('utf8');

          assert.equal(str, result);
          done();
        });
      });
    });

    describe('#scandir', function() {
      it('should find file (path and mime) without error', function(done) {
        var tst = 'home:///.mocha/test.txt';
        var found = {};
        instance.vfs.scandir(serverObject, {path: 'home:///.mocha'}, function(error, result) {
          assert.equal(false, error);

          try {
            result.forEach(function(f) {
              if ( f.filename === 'test.txt' ) {
                found = {
                  path: f.path,
                  mime: f.mime
                };
              }
            });
          } catch ( e ) {};
          assert.equal(tst, found.path);
          assert.equal('text/plain', found.mime);
          done();
        });
      });
    });

    describe('#move', function() {
      it('should rename/move file without error', function(done) {
        var file = {
          src: 'home:///.mocha/test.txt',
          dest: 'home:///.mocha/test2.txt'
        };
        instance.vfs.move(serverObject, file, function(error, result) {
          assert.equal(false, error);
          assert.equal(true, result);
          done();
        });
      });
    });

    describe('#copy', function() {
      it('should copy file without error', function(done) {
        var file = {
          src: 'home:///.mocha/test2.txt',
          dest: 'home:///.mocha/test3.txt'
        };
        instance.vfs.copy(serverObject, file, function(error, result) {
          assert.equal(false, error);
          assert.equal(true, result);
          done();
        });
      });
    });

    describe('#copy', function() {
      it('should copy folder without error', function(done) {
        var file = {
          src: 'home:///.mocha',
          dest: 'home:///.mocha-copy'
        };
        instance.vfs.copy(serverObject, file, function(error, result) {
          assert.equal(false, error);
          assert.equal(true, result);
          done();
        });
      });
    });

    describe('#fileinfo', function() {
      it('should get file information without error', function(done) {
        instance.vfs.fileinfo(serverObject, {path: 'home:///.mocha/test2.txt'}, function(error, result) {
          assert.equal(false, error);
          assert.equal('home:///.mocha/test2.txt', result.path);
          assert.equal('test2.txt', result.filename);
          assert.equal('text/plain', result.mime);
          done();
        });
      });
    });

    describe('#delete', function() {
      it('should delete file without error', function(done) {
        instance.vfs.delete(serverObject, {path: 'home:///.mocha/test2.txt'}, function(error, result) {
          assert.equal(false, error);
          assert.equal(true, result);
          done();
        });
      });

      it('should delete folder without error', function(done) {
        instance.vfs.delete(serverObject, {path: 'home:///.mocha'}, function(error, result) {
          assert.equal(false, error);
          assert.equal(true, result);
          done();
        });
      });

      it('should delete copied folder without error', function(done) {
        instance.vfs.delete(serverObject, {path: 'home:///.mocha-copy'}, function(error, result) {
          assert.equal(false, error);
          assert.equal(true, result);
          done();
        });
      });
    });
  });

  /////////////////////////////////////////////////////////////////////////////
  // APIS
  /////////////////////////////////////////////////////////////////////////////

  describe('API', function() {

    describe('Application API', function() {
      describe('#call', function() {
        it('should return dummy data', function(done) {
          instance.api.application(serverObject, {
            path: 'default/Settings',
            method: 'test',
            'arguments': {}
          }, function(error, result) {
            assert.equal(false, error);
            assert.equal('test', result);
            done();
          });
        });

        it('should trigger error on invalid method', function(done) {
          instance.api.application(serverObject, {
            path: 'default/Settings',
            method: 'xxx',
            'arguments': {}
          }, function(error, result) {
            assert.notEqual(null, error);
            done();
          });
        });

        it('should trigger error on invalid package', function(done) {
          instance.api.application(serverObject, {
            path: 'doesnotexist/PackageName',
            method: 'xxx',
            'arguments': {}
          }, function(error, result) {
            assert.notEqual(null, error);
            done();
          });
        });
      });
    });

    /*
    describe('cURL', function() {
      describe('#HEAD', function() {
        it('successfull HEAD request', function(done) {
          instance.api.curl({
            method: 'HEAD',
            url: 'http://os.js.org/test/curl-example.html'
          }, function(error, result) {
            assert.equal(false, error);
            assert.equal(200, result.httpCode);
            done();
          }, request, response, instance.config);
        });
      });

      describe('#GET', function() {
        var testFor = '<!DOCTYPE html><html><head></head><body>OS.js Test</body></html>\n';
        it('successfull GET request', function(done) {
          instance.api.curl({
            method: 'GET',
            url: 'http://os.js.org/test/curl-example.html'
          }, function(error, result) {
            assert.equal(false, error);
            assert.equal(200, result.httpCode);
            assert.equal(testFor, result.body);
            done();
          }, request, response, instance.config);
        });

        it('successfull GET binary/raw request', function(done) {
          instance.api.curl({
            method: 'GET',
            binary: true,
            url: 'http://os.js.org/test/curl-example.html'
          }, function(error, result) {
            var data = 'data:application/octet-stream;base64,' + (new Buffer(testFor).toString('base64'));
            assert.equal(false, error);
            assert.equal(200, result.httpCode);
            assert.equal(data, result.body);
            done();
          }, request, response, instance.config);
        });
      });

      describe('#POST', function() {
        var testFor = '<!DOCTYPE html><html><head></head><body>OS.js Test</body></html>';
        it('successfull POST request', function(done) {
          instance.api.curl({
            method: 'POST',
            url: 'http://os.js.org/test/curl-example.html'
          }, function(error, result) {
            assert.equal(false, error);
            assert.equal(405, result.httpCode); // Should be 405 because of github pages
            done();
          }, request, response, instance.config);
        });
      });

    });
    */

  });

  /////////////////////////////////////////////////////////////////////////////
  // SERVER
  /////////////////////////////////////////////////////////////////////////////

  describe('Node HTTP Server', function() {
    var req = require('request');
    var port = 8009;
    var url  = 'http://localhost:' + port.toString();

    function post(uurl, data, cb, cookie) {

      var opts = {
        url: uurl,
        method: 'POST',
        json: data
      };

      if ( cookie ) {
        var j = req.jar();
        var ck = req.cookie(cookie);
        j.setCookie(ck, url);
        opts.jar = j;
      }

      req(opts, function(error, response, body) {
        cb((error || false), response, (error ? false : body));
      });
    }

    before(function() {
      osjsServer.listen({
        port: port,
        dirname: serverRoot,
        root: rootDir,
        testing: true,
        dist: 'dist-dev',
        logging: false,
        nw: false
      });
    });

    describe('#index', function() {
      it('should return 200', function(done) {
        req({
          method: 'GET',
          url: url
        }, function(error, res) {
          assert.equal(200, res.statusCode);
          done();
        });
      });
    });

    var cookie;
    describe('#login', function() {
      it('should return 200 with proper json result', function(done) {
        var data = {
          username: 'demo',
          password: 'demo'
        };

        var exp = {
          userData: {
            id: 0,
            username: 'demo',
            name: 'Demo User',
            groups: [ 'admin' ]
          },
          userSettings: {}
        };

        post(url + '/API/login', data, function(err, res, body) {
          assert.equal(false, err);
          assert.equal(200, res.statusCode);
          assert.equal(false, body.error);
          var expc = {
            userData: body.result.userData,
            userSettings: body.result.userSettings
          };
          assert.equal(JSON.stringify(exp), JSON.stringify(expc));

          cookie = res.headers['set-cookie'][0];
          done();
        });
      });
    });

    describe('#api', function() {
      it('w/session - should return 200 with proper response', function(done) {
        var data = {
          path: 'default/Settings',
          method: 'test'
        };

        var sessid = null;

        post(url + '/API/application', data, function(err, res, body) {
          assert.equal(false, err);
          assert.equal(200, res.statusCode);
          assert.equal(false, body.error);
          assert.equal('test', body.result);
          done();
        }, cookie);
      });
    });

    after(function() {
      osjsServer.close();
    });
  });
})(
  require('path'),
  require('fs')
);
