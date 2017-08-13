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
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
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
'use strict';

import chaiAsPromised from 'chai-as-promised';
import {expect, use} from 'chai';
import chai from 'chai';

chai.use(chaiAsPromised);

///////////////////////////////////////////////////////////////////////////////
// 'Ia! Ia! Cthulhu Fhtagn!
///////////////////////////////////////////////////////////////////////////////

const testString = "Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn";

///////////////////////////////////////////////////////////////////////////////
// UTILS
///////////////////////////////////////////////////////////////////////////////

function describeTests() {
  const Utils = OSjs.require('utils/misc');
  const DOM = OSjs.require('utils/dom');
  const Preloader = OSjs.require('utils/preloader');
  const FS = OSjs.require('utils/fs');
  const VFS = OSjs.require('vfs/fs');
  const Locales = OSjs.require('core/locales');
  const Config = OSjs.require('core/config');
  const Clipboard = OSjs.require('utils/clipboard');
  const FileMetadata = OSjs.require('vfs/file');
  const PackageManager = OSjs.require('core/package-manager');
  const Theme = OSjs.require('core/theme');
  const Process = OSjs.require('core/process');

  describe('format()', function() {
    it('should return correct string', function() {
      var res = Utils.format('foo {0} {1}', 'bar', 'baz');
      expect(res).to.be.equal('foo bar baz');
    });
  });

  describe('cleanHTML()', function() {
    it('should return correct string', function() {
      var res = Utils.cleanHTML('<b>\n  \n \nfoo</b>');
      expect(res).to.be.equal('<b>   foo</b>');
    });
  });

  describe('parseurl()', function() {
    it('should return correct location', function() {
      var res = Utils.parseurl('http://domain.tld/foo/bar#baz');

      expect(res.protocol).to.be.equal('http');
      expect(res.host).to.be.equal('domain.tld');
      expect(res.path).to.be.equal('/foo/bar#baz');
    });
  });

  describe('argumentDefaults()', function() {
    it('should return dict', function() {
      var res = Utils.argumentDefaults({
        foo: 'bar',
        koo: null
      }, {
        koo: 'coo'
      });

      expect(res.foo).to.be.equal('bar');
      expect(res.koo).to.be.equal('coo');
    });
  });

  describe('mergeObject()', function() {
    it('should return merged object', function() {
      var res = Utils.mergeObject({
        foo: 'bar'
      }, {
        koo: 'coo'
      });

      expect(res.foo).to.be.equal('bar');
      expect(res.koo).to.be.equal('coo');
    });
  });

  describe('cloneObject()', function() {
    it('should return merged object', function() {
      var res = Utils.cloneObject({
        foo: 'bar'
      });

      expect(res.foo).to.be.equal('bar');
    });
  });

  describe('convertToRGB()', function() {
    it('should return RGB object', function() {
      var res = Utils.convertToRGB('#000000');
      expect(res.r).to.be.equal(0);
      expect(res.g).to.be.equal(0);
      expect(res.b).to.be.equal(0);
    });
  });

  describe('convertToHEX()', function() {
    it('should return HEX string', function() {
      var res = Utils.convertToHEX(0, 0, 0);
      expect(res).to.be.equal('#000000');
    });
  });

  describe('invertHEX()', function() {
    it('should return HEX string', function() {
      var res = Utils.invertHEX('#000000');
      expect(res).to.be.equal('#ffffff');
    });
  });


  if ( navigator.userAgent.indexOf('PhantomJS') === -1 ) {
    describe('$()', function() {
      it('should return element', function() {
        var res = DOM.$('mocha');
        expect(res).to.not.be.null;
      });
    });

    describe('$safeName()', function() {
      it('should return safe string', function() {
        var res = DOM.$safeName('anders!evenrud');
        expect(res).to.be.equal('anders_evenrud');
      });
    });

    describe('$remove()', function() {
      it('should remove element', function() {
        var tmp = document.createElement('div');
        tmp.id = 'tmp';
        document.body.appendChild(tmp);
        DOM.$remove(tmp);

        expect(document.getElementById('tmp')).to.be.null;
      });
    });

    describe('$empty()', function() {
      it('should empty element', function() {
        var tmp = document.createElement('div');
        tmp.appendChild(document.createElement('div'));
        DOM.$empty(tmp);
        expect(tmp.children.length).to.be.equal(0);
      });
    });

    describe('$getStyle()', function() {
      it('should return correct value', function() {
        var res = DOM.$getStyle(document.body, 'background-color');
        expect(res).to.be.oneOf(['#ffffff', 'rgb(255, 255, 255)']);
      });
    });

    describe('$position()', function() {
      it('should get element position', function() {
        var tmp = document.createElement('div');
        tmp.style.position = 'absolute';
        tmp.style.top = '10px';
        tmp.style.left = '10px';
        document.body.appendChild(tmp);

        var pos = DOM.$position(tmp);
        DOM.$remove(tmp);

        expect(pos.left).to.be.equal(10);
        expect(pos.top).to.be.equal(10);
      });
    });

    describe('$index()', function() {
      it('should element index', function() {
        var pos = DOM.$index(document.body.children[0]);
        expect(pos).to.be.equal(0);

        pos = DOM.$index(document.body.children[1]);
        expect(pos).to.be.equal(1);

        pos = DOM.$index(null);
        expect(pos).to.be.equal(-1);
      });
    });

    describe('$addClass()', function() {
      it('should add class to element', function() {
        var tmp = document.createElement('div');
        tmp.className = 'foo';
        document.body.appendChild(tmp);

        DOM.$addClass(tmp, 'bar');
        DOM.$remove(tmp);

        expect(tmp.className).to.be.equal('foo bar');
      });
    });

    describe('$removeClass()', function() {
      it('should remove class from element', function() {
        var tmp = document.createElement('div');
        tmp.className = 'foo bar';
        document.body.appendChild(tmp);

        DOM.$removeClass(tmp, 'bar');
        DOM.$remove(tmp);

        expect(tmp.className).to.be.equal('foo');
      });
    });

    describe('$hasClass()', function() {
      it('should remove class from element', function() {
        var tmp = document.createElement('div');
        tmp.className = 'foo bar';
        document.body.appendChild(tmp);
        DOM.$remove(tmp);

        expect(DOM.$hasClass(tmp, 'foo')).to.be.equal(true);
        expect(DOM.$hasClass(tmp, 'bar')).to.be.equal(true);
      });
    });
  }

  describe('preload', function() {
    it('should load files correctly', function() {
      return Preloader.preload([
        '/packages/default/About/main.js',
        '/invalid/file.foo'
      ]).then((result) => {
        expect(result.loaded.length).to.be.equal(1);
        //expect(result.failed.length).to.be.equal(1); // FIXME
      }).catch((err) => {
        expect(err).to.be.equal(null);
      });
    });
  });

  describe('filext()', function() {
    it('should return file extension', function() {
      var res = FS.filext('home:///foo.bar');
      expect(res).to.be.equal('bar');
    });
  });

  describe('filename()', function() {
    it('should return filename (1)', function() {
      var res = FS.filename('home:///foo/bar.baz');
      expect(res).to.be.equal('bar.baz');
    });
    it('should return filename (2)', function() {
      var res = FS.filename('home:///foo/bar');
      expect(res).to.be.equal('bar');
    });
    it('should not return filename', function() {
      var res = FS.filename('home:///');
      expect(res).to.be.equal('');
    });
  });

  describe('dirname()', function() {
    it('should return parent (1)', function() {
      var res = FS.dirname('home:///');
      expect(res).to.be.equal('home:///');
    });
    it('should return parent (2)', function() {
      var res = FS.dirname('home:///foo/bar/baz');
      expect(res).to.be.equal('home:///foo/bar');
    });
    it('should return parent (3)', function() {
      var res = FS.dirname('home:///foo/bar');
      expect(res).to.be.equal('home:///foo');
    });
    it('should return parent (4)', function() {
      var res = FS.dirname('/');
      expect(res).to.be.equal('/');
    });
  });

  describe('humanFileSize', function() {
    it('should return bytes', function() {
      var res = FS.humanFileSize(0);
      expect(res).to.be.equal('0 B');
    });
    it('should return megabytes', function() {
      var res = FS.humanFileSize(1024 * 1024, true);
      expect(res).to.be.equal('1.0 MB');
    });
    it('should return megabits', function() {
      var res = FS.humanFileSize(2000 * 1024);
      expect(res).to.be.equal('2.0 MiB');
    });
  });

  describe('replaceFileExtension()', function() {
    it('should swap file extension', function() {
      var res = FS.replaceFileExtension('home:///foo.bar', 'baz');
      expect(res).to.be.equal('home:///foo.baz');
    });
  });

  describe('replaceFilename()', function() {
    it('should swap file name', function() {
      var res = FS.replaceFilename('home:///foo.bar', 'koo.coo');
      expect(res).to.be.equal('home:///koo.coo');
    });
  });

  describe('getFilenameRange()', function() {
    it('should return correct range', function() {
      var res = FS.getFilenameRange('home:///foo.bar');
      expect(res.min).to.be.equal(0);
      expect(res.max).to.be.equal(11);
    });
  });

  describe('pathJoin', function() {
    it('should return corrent path (1)', function() {
      var res = FS.pathJoin('foo', 'bar');
      expect(res).to.be.equal('/foo/bar');
    });
    it('should return corrent path (2)', function() {
      var res = FS.pathJoin('home://', 'foo', 'bar');
      expect(res).to.be.equal('home:///foo/bar');
    });
    it('should return corrent path (3)', function() {
      var res = FS.pathJoin('home://', 'foo', 'bar', '..', '.');
      expect(res).to.be.equal('home:///foo/bar');
    });
    it('should return corrent path (4)', function() {
      var res = FS.pathJoin('home:///../', 'foo', 'bar');
      expect(res).to.be.equal('home:///foo/bar');
    });
  });

  describe('setLocale()', function() {
    it('should return undefined', function() {
      expect(Locales.setLocale('en_EN')).to.be.equal(undefined);
    });
  });

  describe('getLocale()', function() {
    it('should return a string', function() {
      expect(Locales.getLocale()).to.be.equal('en_EN');
    });
  });

  describe('_()', function() {
    it('should return a translated string', function() {
      expect(Locales._('LBL_CANCEL')).to.be.equal('Cancel');
    });
  });

  describe('__()', function() {
    it('should return proper formatted string', function() {
      var list = {};
      list[Locales.getLocale()] = {
        TEST: '{0} bar baz'
      };

      var res = Locales.__(list, 'TEST', 'foo');
      expect(res).to.be.equal('foo bar baz');
    });
  });


  describe('getPackageResource()', function() {
    it('should return correct string', function() {
      expect(PackageManager.getPackageResource('App', 'foo.bar')).to.be.equal('foo.bar');
    });
    it('should return correct string', function() {
      expect(PackageManager.getPackageResource('ApplicationAbout', 'foo.bar')).to.contain('packages/default/About/foo.bar');
    });
  });

  describe('getThemeCSS()', function() {
    it('should return correct string', function() {
      expect(Theme.getThemeCSS('foo')).to.contain('/themes/styles/foo.css');
    });
  });

  describe('getIcon()', function() {
    it('should return correct string', function() {
      expect(Theme.getIcon('foo/bar.baz')).to.contain('default/16x16/foo/bar.baz');
    });
  });

  describe('getFileIcon()', function() {
    it('should return correct string', function() {
      expect(Theme.getFileIcon({
        filename: 'foo.bar',
        path: 'somewhere'
      })).to.contain('default/16x16');
    });
  });

  describe('getThemeResource()', function() {
    it('should return correct string', function() {
      expect(Theme.getThemeResource('foo.bar')).to.contain('styles/default/foo.bar');
    });
  });

  describe('getSound()', function() {
    it('should return correct string', function() {
      expect(Theme.getSound('foo.bar')).to.contain('default/foo.bar');
    });
  });

  describe('getConfig()', function() {
    it('should return correct string', function() {
      expect(Config.getConfig('Connection.Authenticator')).to.be.equal('demo');
    });
  });

  describe('setClipboard()', function() {
    it('should set clipboard data', function() {
      expect(Clipboard.setClipboard(testString)).to.be.equal(undefined);
    });
  });

  describe('getClipboard()', function() {
    it('should get correct clipboard data', function() {
      expect(Clipboard.getClipboard()).to.be.equal(testString);
    });
  });

  describe('launch()', function() {
    it('should recieve error on invalid Application', function() {
      return Process.create('InvalidApplication').catch((err) => {
        expect(err).to.be.an.instanceof(Error);
      });
    });

    it('should launch About application', function() {
      return Process.create('ApplicationAbout');
    });
  });

  describe('getProcess()', function() {
    it('should get ApplicationAbout', function() {
      expect(Process.getProcess(0)).to.be.instanceof(Process);
    });
  });

  describe('getProcesses()', function() {
    it('should get ApplicationAbout', function() {
      expect(Process.getProcesses()[0]).to.be.instanceof(OSjs.Applications.ApplicationAbout);
    });
  });

  describe('message()', function() {
    it('should broadcast and trigger event', function(done) {
      var proc = Process.getProcess(0);

      proc._on('FOO', function(args, opts, msg) {
        expect(msg).to.be.equal('FOO');
        expect(args.bar).to.be.equal('baz');
        done();
      });

      Process.message('FOO', {bar: 'baz'});
    });
  });

  describe('kill()', function() {
    it('should kill About Application', function() {
      expect(Process.kill(0)).to.be.equal(true);
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  // VFS
  ///////////////////////////////////////////////////////////////////////////////

  describe('VFS', function() {

    describe('File', function() {
      it('should validate File object (1)', function() {
        var f = new FileMetadata('home:///foo');

        expect(f.filename).to.be.equal('foo');
        expect(f.path).to.be.equal('home:///foo');
        expect(f.mime).to.be.equal('application/octet-stream');
      });
      it('should validate File object (2)', function() {
        var f = new FileMetadata('home:///foo', 'some/mime');

        expect(f.filename).to.be.equal('foo');
        expect(f.path).to.be.equal('home:///foo');
        expect(f.mime).to.be.equal('some/mime');
      });
      it('should validate File object (3)', function() {
        var f = new FileMetadata({
          path: 'home:///foo',
          filename: 'foo',
          size: 666,
          mime: 'some/mime'
        });

        expect(f.filename).to.be.equal('foo');
        expect(f.path).to.be.equal('home:///foo');
        expect(f.size).to.be.equal(666);
        expect(f.mime).to.be.equal('some/mime');
      });
    });

    describe('mkdir()', function() {
      describe('#exception', function() {
        it('should throw error', function() {
          return (VFS.mkdir('invalid:///foo')).should.be.rejectedWith(Error);
        });
      });

      describe('#failure', function() {
        it('should not be created', function() {
          return VFS.mkdir('osjs:///mocha-error').should.be.rejectedWith(Error);
        });
      });

      describe('#success', function() {
        it('should be created', function() {
          return (VFS.mkdir('home:///mocha-dir')).should.become(true);
        });
      });
    });

    describe('write() (encoded)', function() {
      describe('#exception', function() {
        it('should throw error', function() {
          return (VFS.write('invalid:///foo', testString, {upload: false})).should.be.rejectedWith(Error);
        });
      });

      describe('#failure', function() {
        it('should not be written', function() {
          return (VFS.write('osjs:///mocha-error', testString, {upload: false})).should.be.rejectedWith(Error);
        });
      });

      describe('#success', function() {
        it('should be written', function() {
          return (VFS.write('home:///mocha-file', testString, {upload: false})).should.become(true);
        });
      });
    });

    describe('write() (binary)', function() {
      describe('#exception', function() {
        it('should throw error', function() {
          return (VFS.write('invalid:///foo', testString)).should.be.rejectedWith(Error);
        });
      });

      describe('#failure', function() {
        it('should not be written', function() {
          return (VFS.write('osjs:///mocha-error', testString)).should.be.rejectedWith(Error);
        });
      });

      describe('#success', function() {
        it('should be written', function() {
          return (VFS.write('home:///mocha-file', testString)).should.become(true);
        });
      });
    });

    describe('read()', function() {
      describe('#exception', function() {
        it('should throw error', function() {
          return (VFS.read('invalid:///foo')).should.be.rejectedWith(Error);
        });
      });

      describe('#failure', function() {
        it('should fail to read', function() {
          return (VFS.read('osjs:///mocha-error')).should.be.rejectedWith(Error);
        });
      });

      describe('#success', function() {
        it('should read', function() {
          return (VFS.read('home:///mocha-file', {type: 'text'})).should.become(testString);
        });
      });
    });

    describe('exists()', function() {
      describe('#exception', function() {
        it('should throw error', function() {
          return (VFS.exists('invalid:///foo')).should.be.rejectedWith(Error);
        });
      });

      describe('#directories', function() {
        describe('#failure', function() {
          it('should not exist', function() {
            return (VFS.exists('home:///mocha-error')).should.become(false);
          });
        });

        describe('#success', function() {
          it('should exist', function() {
            return (VFS.exists('home:///mocha-dir')).should.become(true);
          });
        });
      });

      describe('#files', function() {
        describe('#failure', function() {
          it('should not exist', function() {
            return (VFS.exists('home:///mocha-error')).should.become(false);
          });
        });

        describe('#success', function() {
          it('should exist', function() {
            return (VFS.exists('home:///mocha-file')).should.become(true);
          });
        });
      });
    });

    describe('fileinfo()', function() {
      describe('#exception', function() {
        it('should throw error', function() {
          return (VFS.fileinfo('invalid:///foo')).should.be.rejectedWith(Error);
        });
      });

      describe('#failure', function() {
        it('should not have info', function() {
          return (VFS.fileinfo('osjs:///mocha-error')).should.be.rejectedWith(Error);
        });
      });

      describe('#success', function() {
        it('should have info', function() {
          return VFS.fileinfo('home:///mocha-file').then((res) => {
            expect(res.path).to.be.equal('home:///mocha-file');
            expect(res.size).to.be.equal(50);
          });
        });
      });
    });

    describe('url()', function() {
      describe('#exception', function() {
        it('should throw error', function() {
          return (VFS.url('invalid:///foo')).should.be.rejectedWith(Error);
        });
      });

      describe('#success', function() {
        it('should have URL', function() {
          return (VFS.url('home:///mocha-file')).should.become('/FS/read?path=home%3A%2F%2F%2Fmocha-file');
        });
      });
    });

    describe('download()', function() {
      // TODO
    });

    describe('copy()', function() {
      // TODO: Copy between mounts

      describe('#exception', function() {
        it('should throw error', function() {
          return (VFS.copy('invalid:///foo', 'invalid:///bar')).should.be.rejectedWith(Error);
        });
      });

      describe('#directories', function() {
        describe('#failure', function() {
          it('directory should not be copied', function() {
            return (VFS.copy('home:///mocha-error', 'home:///mocha-dir-copy')).should.be.rejectedWith(Error);
          });
        });

        describe('#success', function() {
          it('directory should be copied', function() {
            return (VFS.copy('home:///mocha-dir', 'home:///mocha-dir-copy')).should.become(true);
          });
        });
      });

      describe('#files', function() {
        describe('#failure', function() {
          it('file should not be copied', function() {
            return (VFS.copy('home:///mocha-error', 'home:///mocha-file-copy')).should.be.rejectedWith(Error);
          });
        });

        describe('#success', function() {
          it('file should be copied', function() {
            return (VFS.copy('home:///mocha-file', 'home:///mocha-file-copy')).should.become(true);
          });
        });
      });
    });

    describe('move()', function() {
      // TODO: Move between mounts

      describe('#exception', function() {
        it('should throw error', function() {
          return (VFS.move('invalid:///foo', 'invalid:///bar')).should.be.rejectedWith(Error);
        });
      });

      describe('#directories', function() {
        describe('#failure', function() {
          it('directory should not be moved', function() {
            return (VFS.move('home:///mocha-error', 'home:///mocha-dir-moved')).should.be.rejectedWith(Error);
          });
        });

        describe('#success', function() {
          it('directory should be moved', function() {
            return (VFS.move('home:///mocha-dir', 'home:///mocha-dir-moved')).should.become(true);
          });
        });
      });

      describe('#files', function() {
        describe('#failure', function() {
          it('file should not be moved', function() {
            return (VFS.move('home:///mocha-error', 'home:///mocha-file-moved')).should.be.rejectedWith(Error);
          });
        });

        describe('#success', function() {
          it('file should be moved', function() {
            return (VFS.move('home:///mocha-file', 'home:///mocha-file-moved')).should.become(true);
          });
        });
      });
    });

    describe('find()', function() {
      // FIXME: More tests
      it('should find appropriate file', function() {
        return VFS.find('home:///', {query: 'mocha-file-moved'}).then((r) => {
          var found = -1;
          (r || []).forEach(function(i, idx) {
            if ( found === -1 && i.filename === 'mocha-file-moved' ) {
              found = idx;
            }
          });

          expect(found).to.be.least(0);
        });
      });
    });

    describe('scandir()', function() {
      // FIXME: More tests
      it('should find appropriate file', function() {
        return VFS.scandir('home:///').then((r) => {
          var found = -1;
          (r || []).forEach(function(i, idx) {
            if ( found === -1 && i.filename === 'mocha-file-moved' ) {
              found = idx;
            }
          });

          expect(found).to.be.least(0);
        });
      });
    });

    describe('unlink()', function() {
      describe('#exception', function() {
        it('should throw error', function() {
          return (VFS.unlink('invalid:///foo')).should.be.rejectedWith(Error);
        });
      });

      describe('#directories', function() {
        describe('#failure', function() {
          it('should not be removed', function() {
            return (VFS.unlink('osjs:///mocha-error')).should.be.rejectedWith(Error);
          });
        });

        describe('#success', function() {
          it('should be removed', function() {
            return (VFS.unlink('home:///mocha-dir-moved')).should.become(true);
          });
        });

        describe('#success', function() {
          it('should be removed', function() {
            return (VFS.unlink('home:///mocha-dir-copy')).should.become(true);
          });
        });
      });

      describe('#files', function() {
        describe('#failure', function() {
          it('should not be removed', function() {
            return (VFS.unlink('osjs:///mocha-error')).should.be.rejectedWith(Error);
          });
        });

        describe('#success', function() {
          it('should be removed', function() {
            return (VFS.unlink('home:///mocha-file-moved')).should.become(true);
          });
        });

        describe('#success', function() {
          it('should be removed', function() {
            return (VFS.unlink('home:///mocha-file-copy')).should.become(true);
          });
        });

      });
    });

    describe('trash()', function() {
      // TODO: NOT AVAILABLE
    });

    describe('untrash()', function() {
      // TODO: NOT AVAILABLE
    });

    describe('emptyTrash()', function() {
      // TODO: NOT AVAILABLE
    });

    describe('freeSpace()', function() {
      describe('#exception', function() {
        it('should throw error', function() {
          return (VFS.freeSpace('invalid:///foo')).should.be.rejectedWith(Error);
        });
      });

      describe('#failure', function() {
        it('should fail to get space', function() {
          return (VFS.freeSpace('osjs:///')).should.be.rejectedWith(Error);
        });
      });

      describe('#success', function() {
        it('should get space', function() {
          return VFS.freeSpace('home:///').then((res) => {
            expect(res).to.be.above(0);
          });
        });
      });
    });

    describe('remoteRead()', function() {
      // TODO
    });

    describe('abToBinaryString()', function() {
      // TODO
    });

    describe('abToDataSource()', function() {
      // TODO
    });

    describe('abToText()', function() {
      // TODO
    });

    describe('textToAb()', function() {
      // TODO
    });

    describe('abToBlob()', function() {
      // TODO
    });

    describe('blobToAb()', function() {
      // TODO
    });

    describe('dataSourceToAb()', function() {
      // TODO
    });

    describe('createMountpoint()', function() {
      // TODO
    });

    describe('removeMountpoint()', function() {
      // TODO
    });
  });
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

window.OSjs = window.OSjs || {};
window.OSjs.runTests = function() {
  mocha.setup({
    timeout: 250
  });
  mocha.ui('bdd');
  mocha.reporter('html');
  chai.should();
  describeTests();
  mocha.run();
};
