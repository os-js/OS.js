var _path = require('path');
var rootDir = _path.dirname(_path.dirname(__dirname));

var assert = require('assert');
var osjs = require(rootDir + '/src/server/node/osjs.js');
var osjsVFS = require(rootDir + '/src/server/node/vfs.js');
var osjsServer = require(rootDir + '/src/server/node/http.js');

osjsServer.logging(false);

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

/////////////////////////////////////////////////////////////////////////////
// PREPARATION
/////////////////////////////////////////////////////////////////////////////

describe('Prepare', function() {
  var fs = require('fs');

  describe('#handler', function() {
    it('handler should be set to demo', function() {
      assert.equal('demo', osjs.CONFIG.handler);
    });
  });

  describe('#vfs', function() {
    var testPath = osjsVFS.getRealPath('home:///', osjs.CONFIG, request);

    it('read access to demo area', function() {
      assert.doesNotThrow(function() {
        fs.accessSync(testPath.root, fs.R_OK);
      }, Error);
    });

    it('write access to demo area', function() {
      assert.doesNotThrow(function() {
        fs.accessSync(testPath.root, fs.W_OK);
      }, Error);
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
      var file = [
        'home:///.mocha'
      ];
      osjsVFS.exists(file, request, function(json) {
        assert.equal(null, json.error);
        assert.equal(false, json.result);
        done();
      }, osjs.CONFIG);
    });
  });

  describe('#exists', function() {
    it('should not find file', function(done) {
      osjsVFS.exists(['home:///.mocha/test.txt'], request, function(json) {
        assert.equal(null, json.error);
        assert.equal(false, json.result);
        done();
      }, osjs.CONFIG);
    });
  });

  describe('#mkdir', function() {
    it('should create folder without error', function(done) {
      osjsVFS.mkdir(['home:///.mocha'], request, function(json) {
        assert.equal(null, json.error);
        assert.equal(true, json.result);
        done();
      }, osjs.CONFIG);
    });
  });

  describe('#write', function() {
    it('should write file without error', function(done) {
      var data = (new Buffer(str).toString('base64'));
      var file = [
        'home:///.mocha/test.txt',
        'data:text/plain;base64,' + data
      ];
      osjsVFS.write(file, request, function(json) {
        assert.equal(null, json.error);
        assert.equal(true, json.result);
        done();
      }, osjs.CONFIG);
    });
  });

  describe('#read', function() {
    it('should read file without error', function(done) {
      osjsVFS.read(['home:///.mocha/test.txt'], request, function(json) {
        assert.equal(null, json.error);

        var result = json.result.replace(/^data\:(.*);base64\,/, '') || '';
        result = new Buffer(result, 'base64').toString('utf8');

        assert.equal(str, result);
        done();
      }, osjs.CONFIG);
    });
  });

  describe('#scandir', function() {
    it('should find file (path and mime) without error', function(done) {
      var tst = 'home:///.mocha/test.txt';
      var found = {};
      osjsVFS.scandir(['home:///.mocha'], request, function(json) {
        assert.equal(null, json.error);

        try {
          json.result.forEach(function(f) {
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
      }, osjs.CONFIG);
    });
  });

  describe('#move', function() {
    it('should rename/move file without error', function(done) {
      var file = [
        'home:///.mocha/test.txt',
        'home:///.mocha/test2.txt'
      ];
      osjsVFS.move(file, request, function(json) {
        assert.equal(null, json.error);
        assert.equal(true, json.result);
        done();
      }, osjs.CONFIG);
    });
  });

  describe('#copy', function() {
    it('should copy file without error', function(done) {
      var file = [
        'home:///.mocha/test2.txt',
        'home:///.mocha/test3.txt'
      ];
      osjsVFS.copy(file, request, function(json) {
        assert.equal(null, json.error);
        assert.equal(true, json.result);
        done();
      }, osjs.CONFIG);
    });
  });

  describe('#copy', function() {
    it('should copy folder without error', function(done) {
      var file = [
        'home:///.mocha',
        'home:///.mocha-copy'
      ];
      osjsVFS.copy(file, request, function(json) {
        assert.equal(null, json.error);
        assert.equal(true, json.result);
        done();
      }, osjs.CONFIG);
    });
  });

  describe('#fileinfo', function() {
    it('should get file information without error', function(done) {
      osjsVFS.fileinfo(['home:///.mocha/test2.txt'], request, function(json) {
        assert.equal(null, json.error);
        assert.equal('home:///.mocha/test2.txt', json.result.path);
        assert.equal('test2.txt', json.result.filename);
        assert.equal('text/plain', json.result.mime);
        done();
      }, osjs.CONFIG);
    });
  });

  describe('#delete', function() {
    it('should delete file without error', function(done) {
      osjsVFS.delete(['home:///.mocha/test2.txt'], request, function(json) {
        assert.equal(null, json.error);
        assert.equal(true, json.result);
        done();
      }, osjs.CONFIG);
    });

    it('should delete folder without error', function(done) {
      osjsVFS.delete(['home:///.mocha'], request, function(json) {
        assert.equal(null, json.error);
        assert.equal(true, json.result);
        done();
      }, osjs.CONFIG);
    });

    it('should delete copied folder without error', function(done) {
      osjsVFS.delete(['home:///.mocha-copy'], request, function(json) {
        assert.equal(null, json.error);
        assert.equal(true, json.result);
        done();
      }, osjs.CONFIG);
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
        osjsServer.API.application({
          path: 'default/Settings',
          method: 'test',
          'arguments': {}
        }, function(error, result) {
          assert.equal(false, error);
          assert.equal('test', result);
          done();
        }, request, response);
      });

      it('should trigger error on invalid method', function(done) {
        osjsServer.API.application({
          path: 'default/Settings',
          method: 'xxx',
          'arguments': {}
        }, function(error, result) {
          assert.notEqual(null, error);
          done();
        }, request, response);
      });

      it('should trigger error on invalid package', function(done) {
        osjsServer.API.application({
          path: 'doesnotexist/PackageName',
          method: 'xxx',
          'arguments': {}
        }, function(error, result) {
          assert.notEqual(null, error);
          done();
        }, request, response);
      });
    });
  });

  describe('cURL', function() {
    describe('#HEAD', function() {
      it('successfull HEAD request', function(done) {
        osjsServer.API.curl({
          method: 'HEAD',
          url: 'http://os.js.org/test/curl-example.html'
        }, function(error, result) {
          assert.equal(false, error);
          assert.equal(200, result.httpCode);
          done();
        }, request, response);
      });
    });

    describe('#GET', function() {
      var testFor = '<!DOCTYPE html><html><head></head><body>OS.js Test</body></html>\n';
      it('successfull GET request', function(done) {
        osjsServer.API.curl({
          method: 'GET',
          url: 'http://os.js.org/test/curl-example.html'
        }, function(error, result) {
          assert.equal(false, error);
          assert.equal(200, result.httpCode);
          assert.equal(testFor, result.body);
          done();
        }, request, response);
      });

      it('successfull GET binary/raw request', function(done) {
        osjsServer.API.curl({
          method: 'GET',
          binary: true,
          url: 'http://os.js.org/test/curl-example.html'
        }, function(error, result) {
          var data = 'data:application/octet-stream;base64,' + (new Buffer(testFor).toString('base64'));
          assert.equal(false, error);
          assert.equal(200, result.httpCode);
          assert.equal(data, result.body);
          done();
        }, request, response);
      });
    });

    describe('#POST', function() {
      var testFor = '<!DOCTYPE html><html><head></head><body>OS.js Test</body></html>';
      it('successfull POST request', function(done) {
        osjsServer.API.curl({
          method: 'POST',
          url: 'http://os.js.org/test/curl-example.html'
        }, function(error, result) {
          assert.equal(false, error);
          assert.equal(405, result.httpCode); // Should be 405 because of github pages
          done();
        }, request, response);
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
    osjsServer.listen(port);
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
        'method': 'login',
        'arguments': {
          username: 'demo',
          password: 'demo'
        }
      };

      var exp = {
        id: 0,
        username: 'demo',
        name: 'Demo User',
        groups: [ 'demo' ]
      };

      post(url + '/API', data, function(err, res, body) {
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
        'method': 'application',
        'arguments': {
          'path': 'default/Settings',
          'method': 'test'
        }
      };

      post(url + '/API', data, function(err, res, body) {
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
