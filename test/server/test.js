var _path = require('path');
var rootDir = _path.dirname(_path.dirname(__dirname));
var assert = require('assert');
var osjs = require(rootDir + '/src/server/node/node_modules/osjs/osjs.js');
var osjsServer = require(rootDir + '/src/server/node/http.js');
var serverRoot = _path.join(_path.dirname(_path.dirname(__dirname)), 'src', 'server', 'node');

var instance = osjs.init({
  dirname: serverRoot,
  root: rootDir,
  dist: 'dist-dev',
  logging: false,
  nw: false
});

var response = {};
var request = {
  cookies: {
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
    var testPath = instance.vfs.getRealPath('home:///', instance.config, request);

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

      instance.vfs.exists(file, function(error, result) {
        assert.equal(false, error);
        assert.equal(false, result);
        done();
      }, request, instance.config);
    });
  });

  describe('#exists', function() {
    it('should not find file', function(done) {
      instance.vfs.exists({path: 'home:///.mocha/test.txt'}, function(error, result) {
        assert.equal(false, error);
        assert.equal(false, result);
        done();
      }, request, instance.config);
    });
  });

  describe('#mkdir', function() {
    it('should create folder without error', function(done) {
      instance.vfs.mkdir({path: 'home:///.mocha'}, function(error, result) {
        assert.equal(false, error);
        assert.equal(true, result);
        done();
      }, request, instance.config);
    });
  });

  describe('#write', function() {
    it('should write file without error', function(done) {
      var data = (new Buffer(str).toString('base64'));
      var file = {
        path: 'home:///.mocha/test.txt',
        data: 'data:text/plain;base64,' + data
      };
      instance.vfs.write(file, function(error, result) {
        assert.equal(false, error);
        assert.equal(true, result);
        done();
      }, request, instance.config);
    });
  });

  describe('#read', function() {
    it('should read file without error', function(done) {
      instance.vfs.read({path: 'home:///.mocha/test.txt'}, function(error, result) {
        assert.equal(false, error);

        var result = result.replace(/^data\:(.*);base64\,/, '') || '';
        result = new Buffer(result, 'base64').toString('utf8');

        assert.equal(str, result);
        done();
      }, request, instance.config);
    });
  });

  describe('#scandir', function() {
    it('should find file (path and mime) without error', function(done) {
      var tst = 'home:///.mocha/test.txt';
      var found = {};
      instance.vfs.scandir({path: 'home:///.mocha'}, function(error, result) {
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
      }, request, instance.config);
    });
  });

  describe('#move', function() {
    it('should rename/move file without error', function(done) {
      var file = {
        src: 'home:///.mocha/test.txt',
        dest: 'home:///.mocha/test2.txt'
      };
      instance.vfs.move(file, function(error, result) {
        assert.equal(false, error);
        assert.equal(true, result);
        done();
      }, request, instance.config);
    });
  });

  describe('#copy', function() {
    it('should copy file without error', function(done) {
      var file = {
        src: 'home:///.mocha/test2.txt',
        dest: 'home:///.mocha/test3.txt'
      };
      instance.vfs.copy(file, function(error, result) {
        assert.equal(false, error);
        assert.equal(true, result);
        done();
      }, request, instance.config);
    });
  });

  describe('#copy', function() {
    it('should copy folder without error', function(done) {
      var file = {
        src: 'home:///.mocha',
        dest: 'home:///.mocha-copy'
      };
      instance.vfs.copy(file, function(error, result) {
        assert.equal(false, error);
        assert.equal(true, result);
        done();
      }, request, instance.config);
    });
  });

  describe('#fileinfo', function() {
    it('should get file information without error', function(done) {
      instance.vfs.fileinfo({path: 'home:///.mocha/test2.txt'}, function(error, result) {
        assert.equal(false, error);
        assert.equal('home:///.mocha/test2.txt', result.path);
        assert.equal('test2.txt', result.filename);
        assert.equal('text/plain', result.mime);
        done();
      }, request, instance.config);
    });
  });

  describe('#delete', function() {
    it('should delete file without error', function(done) {
      instance.vfs.delete({path: 'home:///.mocha/test2.txt'}, function(error, result) {
        assert.equal(false, error);
        assert.equal(true, result);
        done();
      }, request, instance.config);
    });

    it('should delete folder without error', function(done) {
      instance.vfs.delete({path: 'home:///.mocha'}, function(error, result) {
        assert.equal(false, error);
        assert.equal(true, result);
        done();
      }, request, instance.config);
    });

    it('should delete copied folder without error', function(done) {
      instance.vfs.delete({path: 'home:///.mocha-copy'}, function(error, result) {
        assert.equal(false, error);
        assert.equal(true, result);
        done();
      }, request, instance.config);
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
        instance.api.application({
          path: 'default/Settings',
          method: 'test',
          'arguments': {}
        }, function(error, result) {
          assert.equal(false, error);
          assert.equal('test', result);
          done();
        }, request, response, instance.config);
      });

      it('should trigger error on invalid method', function(done) {
        instance.api.application({
          path: 'default/Settings',
          method: 'xxx',
          'arguments': {}
        }, function(error, result) {
          assert.notEqual(null, error);
          done();
        }, request, response, instance.config);
      });

      it('should trigger error on invalid package', function(done) {
        instance.api.application({
          path: 'doesnotexist/PackageName',
          method: 'xxx',
          'arguments': {}
        }, function(error, result) {
          assert.notEqual(null, error);
          done();
        }, request, response, instance.config);
      });
    });
  });

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
      var cookie = req.cookie('username=demo');
      j.setCookie(cookie, url);
      opts.jar = j;
    }

    req(opts, function(error, response, body) {
      cb((error || false), response, (error ? false : body));
    });
  }

  before(function () {
    osjsServer.listen({
      port: port,
      dirname: serverRoot,
      root: rootDir,
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
        assert.equal(JSON.stringify(exp), JSON.stringify(body.result));
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

      post(url + '/API/application', data, function(err, res, body) {
        assert.equal(false, err);
        assert.equal(200, res.statusCode);
        assert.equal(false, body.error);
        assert.equal('test', body.result);
        done();
      }, true);
    });
  });

  after(function () {
    osjsServer.close();
  });
});
