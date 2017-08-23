const chai = require('chai');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const stream = require('stream');

const Authenticator = require('../../node/modules/authenticator.js');
const Storage = require('../../node/modules/storage.js');
const Connection = require('../../node/modules/connection.js');
const Settings = require('../../node/settings.js');
const User = require('../../node/user.js');
const VFS = require('../../node/vfs.js');
const VFSFilesystem = require('../../node/modules/vfs/filesystem.js');

const ROOT = path.resolve(__dirname + '/../../../../');

chai.use(require('chai-as-promised'));
chai.should();

//
// Settings
//
describe('Settings', () => {
  describe('#load', () => {
    it('should successfully load', (done) => {
      Settings.load({
        AUTH: 'demo',
        STORAGE: 'demo'
      }, {
        HOSTNAME: null,
        DEBUG: false,
        PORT: null,
        LOGLEVEL: 0,
        NODEDIR: path.resolve(ROOT, 'src/server/node'),
        ROOTDIR: ROOT,
        SERVERDIR: path.resolve(ROOT, 'src/server')
      }, {});

      done();
    });
  });
});

//
// Connection
//
describe('Connection', () => {
  let instance;
  let appObject = {
    use: () => {}
  };

  describe('#constructor', () => {
    it('Should be constructed', () => {
      instance = new Connection(appObject);
    });
  });
  describe('#register', () => {
    it('Should register', () => {
      return instance.register().should.be.fulfilled;
    });
  });
  describe('#getServer', () => {
    it('Should get null', () => {
      return assert(instance.getServer() === null);
    });
  });
  describe('#getWebsocket', () => {
    it('Should get null', () => {
      return assert(instance.getWebsocket() === null);
    });
  });
  describe('#getProxy', () => {
    it('Should get instance', () => {
      return assert(instance.getProxy() !== null);
    });
  });
  describe('#getSessionId', () => {
    it('Should get null', () => {
      return assert(instance.getSessionId({
        headers: {}
      }) === null);
    });
  });
  describe('#getSessionWrapper', () => {
    it('Should get object', () => {
      return assert(instance.getSessionWrapper() instanceof Object);
    });
  });
  describe('#getWrapper', () => {
    it('Should get object', () => {
      return assert(instance.getWrapper() instanceof Object);
    });
  });
  describe('#destroy', () => {
    it('Should be destroyed', () => {
      return instance.destroy().should.be.fulfilled;
    });
  });
});

//
// Authenticator
//
describe('Authenticator', () => {
  let inststance, userObject, httpObject;

  before(() => {
    instance = new Authenticator();

    userObject = User.createFromObject({
      id: 666,
      username: 'Chthulu'
    });

    httpObject = {
      session: {
        get: (n) => {
          const vars = {
            uid: 1,
            username: 'demo'
          };
          return vars[n];
        }
      }
    };
  });

  describe('#register', () => {
    it('Should return promise', () => {
      return instance.register().should.eventually.equal(true);
    });
  });
  describe('#login', () => {
    it('Should return promise', () => {
      return instance.manage().should.be.rejectedWith(Error);
    });
  });
  describe('#logout', () => {
    it('Should return promise', () => {
      return instance.logout().should.eventually.equal(true);
    });
  });
  describe('#manage', () => {
    it('Should return promise', () => {
      return instance.manage().should.be.rejectedWith(Error);
    });
  });
  describe('#checkPermission', () => {
    it('Should be fulfilled', () => {
      return instance.checkPermission(httpObject, 'foo').should.be.fulfilled;
    });
  });
  describe('#checkFilesystemPermission', () => {
    it('Should be rejected', () => {
      return instance.checkFilesystemPermission(userObject, 'foo', null, 'read').should.be.rejectedWith(Error);
    });
    /*
    it('Should be fulfilled', () => {
      return instance.checkFilesystemPermission(userObject, 'home:///', null, 'read').should.be.fulfilled;
    });
    */
  });
  describe('#checkPackagePermission', () => {
    it('Should be fulfilled', () => {
      return instance.checkPackagePermission(userObject, 'foo').should.be.fulfilled;
    });
  });
  describe('#checkSession', () => {
    it('Should resolve', (done) => {
      instance.checkSession(httpObject).then((u) => {
        assert(u instanceof User);
        done();
      });
    });
  });
  describe('#getUserFromRequest', () => {
    it('Should return User', (done) => {
      instance.getUserFromRequest(httpObject).then((u) => {
        assert(u instanceof User);
        done();
      });
    });
  });
  describe('#getBlacklist', () => {
    it('Should return array', () => {
      return instance.getBlacklist().should.become([]);
    });
  });
  describe('#setBlacklist', () => {
    it('Should return boolean', () => {
      return instance.setBlacklist().should.eventually.equal(true);
    });
  });
  describe('#destroy', () => {
    it('Should return promise', () => {
      return instance.destroy().should.eventually.equal(true);
    });
  });
});

//
// Storage
//

describe('Storage', () => {
  let inststance;
  before(() => {
    instance = new Storage();
  });

  describe('#register', () => {
    it('Should return promise', () => {
      return instance.register().should.eventually.equal(true);
    });
  });
  describe('#setSettings', () => {
    it('Should be fulfilled', () => {
      return instance.setSettings().should.be.fulfilled;
    });
  });
  describe('#getSettings', () => {
    it('Should be fulfilled', () => {
      return instance.getSettings().should.eventually.deep.equal({});
    });
  });
  describe('#destroy', () => {
    it('Should return promise', () => {
      return instance.destroy().should.eventually.equal(true);
    });
  });
});

//
// VFS
//
describe('VFS', () => {
  const src = 'home:///__mocha__.txt';

  describe('#parseVirtualPath', () => {
    it('Should throw exception', () => {
      assert.throws(function() {
        VFS.parseVirtualPath('xxx:///yyy');
      }, Error, 'Failed to find real path');
    });
    it('Should find path', () => {
      const result = VFS.parseVirtualPath('home:///yyy', {
        username: 'demo'
      });

      assert.deepEqual(result, {
        transportName: '__default__',
        query: 'home:///yyy',
        protocol: 'home',
        real: path.resolve(ROOT, 'vfs/home/demo/yyy'),
        path: '/yyy'
      });
    });
  });
  describe('#getTransportName', () => {
    it('should return default', () => {
      assert(VFS.getTransportName() === '__default__');
    });
    it('should return default', () => {
      assert(VFS.getTransportName('zzz:///foo') === '__default__');
    });
    it('should return HTTP', () => {
      assert(VFS.getTransportName('http://foo.bar') === 'HTTP');
    });
    it('should return custom', () => {
      assert(VFS.getTransportName('zzz:///foo', {
        transport: 'custom'
      }) === 'custom');
    });
  });
  describe('#resolvePathArguments', () => {
    it('Should resolve correctly', () => {
      const result = VFS.resolvePathArguments('a/%UID%/c/%USERNAME%', {
        id: 'b',
        username: 'd'
      });
      assert(result === 'a/b/c/d');
    });
  });
  describe('#getMime', () => {
    it('Should return correct', () => {
      assert(VFS.getMime('foo.txt') === 'text/plain');
    });
    it('Should return undefined', () => {
      assert(VFS.getMime('foo.dat') === undefined);
    });
  });
  describe('#permissionToString', () => {
    it('Should return correct pattern', () => {
      assert(VFS.permissionToString('0700') === '-w-rwxr-T');
    });
  });
  describe('#watch', () => {
    it('', () => {

    });
  });
  describe('#request', () => {
    it('Should create file', () => {
      VFS.request(User.createFromObject({
        id: 1001,
        username: 'demo'
      }), 'write', {
        path: src,
        data: 'Just a test',
        options: {
          rawtype: 'utf8'
        }
      }, false, VFSFilesystem);
    });
  });
  describe('#createReadStream', () => {
    it('Should create stream', (done) => {
      VFS._createStream('createReadStream', src, {
        id: 1001,
        username: 'demo'
      }, {}, VFSFilesystem).then((s) => {
        assert(s instanceof stream.Stream);
        done();
      });
    });
  });
  describe('#createWriteStream', () => {
    it('Should create stream', (done) => {
      VFS._createStream('createWriteStream', src, {
        id: 1001,
        username: 'demo'
      }, {}, VFSFilesystem).then((s) => {
        assert(s instanceof stream.Stream);
        done();
      });
    });
  });
  describe('#respond', () => {
    it('Should respond with JSON', (done) => {
      VFS.respond({
        response: {
          json: (data) => {
            assert.deepEqual(data, {
              result: {
                a: 'b'
              }
            });
            done();
          }
        }
      }, 'nothing', {}, {
        a: 'b'
      })
    });

    it('Should respond with Stream', (done) => {
      VFS.respond({
        request: {
          headers: {}
        },
        response: {
          setHeader: () => {},
          status: () => {},
          send: () => {}
        }
      }, 'read', {}, {
        resource: () => {
          return Promise.resolve({
            pipe: () => {
              assert(true);
              done();
            }
          });
        }
      });
    });

    it('Should respond with Ranged Stream', (done) => {
      const response = {
        setHeader: () => response,
        status: () => response,
        send: () => response,
        status: (status) => {
          assert(status === 206);
          done();
        }
      };

      VFS.respond({
        request: {
          headers: {
            range: 'bytes=1802240-'
          }
        },
        response: response
      }, 'read', {}, {
        resource: () => {
          return Promise.resolve({
            pipe: () => {}
          });
        }
      });
    });

    it('Should respond with Binary', (done) => {
      VFS.respond({
        request: {
          headers: {}
        },
        response: {
          setHeader: () => {},
          status: () => {},
          send: () => {
            assert(true);
            done();
          }
        }
      }, 'read', {}, {
        options: {
          raw: true
        }
      });
    });

    it('Should respond with Encoded', (done) => {
      VFS.respond({
        request: {
          headers: {}
        },
        response: {
          setHeader: () => {},
          status: () => {},
          send: (data) => {
            assert(data === 'data:none;base64,YWJj');
            done();
          }
        }
      }, 'read', {}, {
        mime: 'none',
        resource: 'abc',
        options: {
          raw: false
        }
      });
    });
  });
  describe('#request', () => {
    it('Should remove file', () => {
      VFS.request(User.createFromObject({
        id: 1001,
        username: 'demo'
      }), 'unlink', {
        path: src
      }, false, VFSFilesystem);
    });
  });
});

//
// User
//
describe('User', () => {
  describe('#constructor', () => {
    it('Should create correct object', () => {
      const obj = {
        id: 666,
        username: 'chthulu',
        name: 'Chthulu',
        groups: ['a', 'b', 'c']
      };

      assert.deepEqual((new User(
        obj.id,
        obj.username,
        obj.name,
        obj.groups
      )).toJson(), obj);
    });
  });

  describe('#createFromObject', () => {
    it('Should create correct object', () => {
      const obj = {
        id: 666,
        username: 'chthulu',
        name: 'Chthulu',
        groups: ['a', 'b', 'c']
      };

      assert.deepEqual((User.createFromObject(obj)).toJson(), obj);
    });
  });

  describe('#hasGroup', () => {
    const user = User.createFromObject({
      id: 666,
      username: 'chthulu',
      name: 'Chthulu',
      groups: ['a', 'b', 'c']
    });

    it('Should be true', () => {
      assert(user.hasGroup('a') === true);
    });
    it('Should be false', () => {
      assert(user.hasGroup('e') === false);
    });
  });

});

//
// PackageManager
//
describe('PackageManager', () => {

});
