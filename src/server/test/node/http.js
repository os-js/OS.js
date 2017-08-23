/*eslint strict: ["warn"]*/
const assert = require('assert');
const request = require('request');
const cap = require('chai-as-promised');
const osjs = require('../../node/server.js');
const path = require('path');
const fs = require('fs');

var url;
var cookie;

function mrequest(method, data, uurl, cb) {
  var opts = {
    url: uurl,
    method: method
  };

  if ( data !== null ) {
    opts.json = data;
  }

  if ( cookie ) {
    var j = request.jar();
    var ck = request.cookie(cookie);
    j.setCookie(ck, url);
    opts.jar = j;
  }

  request(opts, cb);
}

function get(uurl, cb) {
  mrequest('GET', null, uurl, cb);
}

function post(uurl, data, cb) {
  mrequest('POST', data, uurl, function(error, response, body) {
    cb((error || false), response, (error ? false : body));
  });
}

let indexContent;

/////////////////////////////////////////////////////////////////////////////
// TESTS
/////////////////////////////////////////////////////////////////////////////

describe('HTTP Server', function() {
  before(function(done) {
    url = 'http://localhost:' + String(8008);
    osjs.start({
      MOCHA: true,
      LOGLEVEL: 0,
      PORT: 8008,
      AUTH: 'test',
      STORAGE: 'test',
      CONNECTION: 'http',
      SESSION: 'memory'
    }).then((instance) => {
      indexContent = fs.readFileSync(path.join(instance.options.ROOTDIR, 'dist/index.html'), 'utf8');
      done();
    }).catch((err) => {
      assert.equal(null, err);
      done();
    });
  });

  describe('#index', function() {
    it('should return 200', function(done) {
      request({
        method: 'GET',
        url: url + '/'
      }, function(error, res) {
        assert.equal(null, error);
        assert.equal(200, res.statusCode);
        done();
      });
    });
  });

  describe('#auth', function() {
    describe('#login', function() {
      it('should return 200 with error', function(done) {
        var data = {
          username: 'xxx',
          password: 'demo'
        };

        post(url + '/API/login', data, function(err, res, body) {
          assert.equal(200, res.statusCode);
          assert.notEqual(null, body.error);

          done();
        });
      });

      it('should return 200 with success', function(done) {
        var data = {
          username: 'demo',
          password: 'demo'
        };

        post(url + '/API/login', data, function(err, res, body) {
          assert.equal(false, err);
          assert.equal(200, res.statusCode);
          assert.equal(null, body.error);

          cookie = res.headers['set-cookie'][0];

          var data = body.result.userData;
          assert.equal('demo', data.username);

          done();
        });
      });
    });

    describe('#logout', function() {
      it('should return 200 with success', function(done) {
        post(url + '/API/logout', {}, function(err, res, body) {
          assert.equal(false, err);
          assert.equal(200, res.statusCode);
          assert.equal(null, body.error);
          cookie = done();
        });
      });
    });

    describe('#login', function() {
      it('should return 200 with success', function(done) {
        var data = {
          username: 'restricted',
          password: 'demo'
        };

        post(url + '/API/login', data, function(err, res, body) {
          assert.equal(false, err);
          assert.equal(200, res.statusCode);
          assert.equal(null, body.error);

          cookie = res.headers['set-cookie'][0];

          var data = body.result.userData;
          assert.equal('restricted', data.username);

          done();
        });
      });
    });
  });

  describe('#api', function() {
    describe('#application', function() {
      it('should return test data', function(done) {
        var data = {
          path: 'default/Settings',
          method: 'test'
        };

        post(url + '/API/application', data, function(err, res, body) {
          assert.equal(false, err);
          assert.equal(200, res.statusCode);
          assert.equal(null, body.error);
          assert.equal('test', body.result);
          done();
        });
      });

      it('should return error', function(done) {
        var data = {
          path: 'default/Nothing',
          method: 'test'
        };

        post(url + '/API/application', data, function(err, res, body) {
          assert.notEqual(null, body.error);
          done();
        });
      });
    });

    describe('#curl', function() {
      it('should fail due to missing group permission', function(done) {
        var data = {
        };

        post(url + '/API/curl', data, function(err, res, body) {
          assert.equal(false, err);
          assert.equal(403, res.statusCode);
          done();
        });
      });
    });
  });

  describe('#static', function() {
    describe('#packages', function() {
      it('should return 403 on blacklist', function(done) {
        get(url + '/packages/default/CoreWM/main.js', function(err, res, body) {
          assert.equal(403, res.statusCode);
          done();
        });
      });

      it('should return 200 on success', function(done) {
        get(url + '/packages/default/Calculator/main.js', function(err, res, body) {
          assert.equal(200, res.statusCode);
          done();
        });
      });

      it('should return 404 on failure', function(done) {
        get(url + '/packages/default/XXX/main.js', function(err, res, body) {
          assert.equal(404, res.statusCode);
          done();
        });
      });
    });
  });

  describe('#vfs', function() {
    it('should not be able to read file', function(done) {
      post(url + '/FS/read', {path: 'osjs:///index.html'}, function(err, res, body) {
        assert.equal(403, res.statusCode);
        done();
      });
    });
  });

  describe('#auth', function() {
    describe('#logout', function() {
      it('should return 200 with success', function(done) {
        post(url + '/API/logout', {}, function(err, res, body) {
          assert.equal(false, err);
          assert.equal(200, res.statusCode);
          assert.equal(null, body.error);
          cookie = done();
        });
      });
    });

    describe('#login', function() {
      it('should return 200 with success', function(done) {
        var data = {
          username: 'demo',
          password: 'demo'
        };

        post(url + '/API/login', data, function(err, res, body) {
          assert.equal(false, err);
          assert.equal(200, res.statusCode);
          assert.equal(null, body.error);

          cookie = res.headers['set-cookie'][0];

          var data = body.result.userData;
          assert.equal('demo', data.username);

          done();
        });
      });
    });
  });

  describe('#vfs', function() {
    it('should give write error due to read-only', function(done) {
      post(url + '/FS/write', {path: 'osjs:///foo', data: 'mocha'}, function(err, res, body) {
        assert.equal(403, res.statusCode);
        done();
      });
    });
    it('should give copy error due to read-only', function(done) {
      post(url + '/FS/copy', {src: 'home:///foo', dest: 'osjs:///foo'}, function(err, res, body) {
        assert.equal(403, res.statusCode);
        done();
      });
    });

    it('should give write success', function(done) {
      post(url + '/FS/write', {path: 'home:///foo', data: 'mocha'}, function(err, res, body) {
        assert.equal(200, res.statusCode);
        assert.equal(true, body.result);
        done();
      });
    });

    it('should get correct file content (raw stream)', function(done) {
      post(url + '/FS/read', {path: 'home:///foo'}, function(err, res, body) {
        assert.equal(200, res.statusCode);
        assert.equal('mocha', body);
        done();
      });
    });

    it('should get correct file content (raw body)', function(done) {
      post(url + '/FS/read', {path: 'home:///foo', options: {stream: false}}, function(err, res, body) {
        assert.equal(200, res.statusCode);
        assert.equal('mocha', body);
        done();
      });
    });

    it('should get correct file content (base body)', function(done) {
      post(url + '/FS/read', {path: 'home:///foo', options: {raw: false, stream: false}}, function(err, res, body) {
        assert.equal(200, res.statusCode);
        assert.equal('data:application/octet-stream;base64,bW9jaGE=', body);
        done();
      });
    });

    it('should successfully read file', function(done) {
      post(url + '/FS/read', {path: 'osjs:///index.html'}, function(err, res, body) {
        assert.equal(200, res.statusCode);
        assert.equal(indexContent, body);
        done();
      });
    });

    it('should successfully read file', function(done) {
     get(url + '/FS/read?path=' + encodeURIComponent('osjs:///index.html'), function(err, res, body) {
        assert.equal(200, res.statusCode);
        assert.equal(indexContent, body);
        done();
      });
    });
    it('should successfully remove file', function(done) {
      post(url + '/FS/unlink', {path: 'home:///foo'}, function(err, res, body) {
        assert.equal(200, res.statusCode);
        assert.equal(true, body.result);
        done();
      });
    });
    /*
    it('should successfully read remote file', function(done) {
      get(url + '/FS/get/https://os-js.org/images/logo-header.png', function(err, res, body) {
        assert.equal(200, res.statusCode);
        assert.equal('image/png', res.headers['content-type']);
        done();
      });
    });
    */
  });

  after(function() {
    osjs.shutdown();
  });
});
