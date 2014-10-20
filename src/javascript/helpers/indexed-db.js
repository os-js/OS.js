/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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

(function(Utils, API) {
  'use strict';

  var indexedDB      = window.indexedDB      || window.mozIndexedDB         || window.webkitIndexedDB || window.msIndexedDB;
  var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  var IDBKeyRange    = window.IDBKeyRange    || window.webkitIDBKeyRange    || window.msIDBKeyRange;

  OSjs.Helpers.Helpers = OSjs.Helpers || {};

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  function OIndexedDB(args, callback) {
    args = args || {};

    this.version = (args.version || 1).toString();
    this.dbName = args.dbName;
    this.onupgrade = args.onupgrade || function __noop__() {};
    this.db = null;

    if ( !this.dbName ) {
      throw new Error('Cannot create IndexedDB without Database Name');
    }

    console.info('OIndexedDB::construct()', this);

    this.init(callback);
  }

  OIndexedDB.prototype.init = function(callback) {
    console.info('OIndexedDB::init()');

    var self = this;
    var request = indexedDB.open(this.dbName, this.version);

    request.onupgradeneeded = function(e) {
      console.info('OIndexedDB::init()','=>','onupgradeneeded()', e);

      var db = e.target.result;
      self.onupgrade(db, function() {
        callback(false, true);
      });
    };

    request.onsuccess = function(e) {
      console.info('OIndexedDB::init()','=>','onsuccess()', e);

      self.db = e.target.result;
      callback(false, true);
    };

    request.onerror = function(e) {
      console.info('OIndexedDB::init()','=>','onerror()', e);

      callback(e.value);
    };
  };

  OIndexedDB.prototype._queue = function(queue, onItem, onFinished) {
    console.info('OIndexedDB::_queue()', queue);

    var index = 0;

    function _process(item, cb) {
      console.info('OIndexedDB::_queue()','=>','_process()', index, item);
      if ( typeof item === 'undefined' ) {
        return cb('No such item');
      }
      onItem(item, cb);
    }

    function _next() {
      if ( index >= queue.length ) {
        return onFinished(false, true);
      }

      console.info('OIndexedDB::_queue()','=>','_next()', index);
      _process(queue[index], function(error, result) {
        index++;

        _next();
      });
    }

    _next();
  };

  OIndexedDB.prototype.update = function(args, items, callback) {
    args = args || {};

    console.info('OIndexedDB::update()', args, items);

    var self = this;
    var nitems = [];
    Object.keys(items).forEach(function(k) {
      var rel = OSjs.Utils.cloneObject(items[k]);
      if ( args.key ) {
        rel[args.key] = k;
      }
      nitems.push(rel);
    });
    this.insert(args, nitems, callback);
  };

  OIndexedDB.prototype.insert = function(args, items, callback) {
    args = args || {};

    console.info('OIndexedDB::insert()', args, items);

    var queue = items instanceof Array ? items : [items];
    var trans = this.db.transaction([args.store], 'readwrite');
    var store = trans.objectStore(args.store);

    this._queue(queue, function(item, cb) {
      var request = store.put(item);
      request.onsuccess = function(e) {
        console.info('OIndexedDB::insert()', '=>', 'onsuccess()', e);
        cb(false, e);
      };
      request.onerror = function(e) {
        console.info('OIndexedDB::insert()', '=>', 'onerror()', e);
        cb(e.value);
      };
    }, callback);
  };

  OIndexedDB.prototype.remove = function(args, items, callback) {
    console.info('OIndexedDB::remove()', args, items);

    var queue = items instanceof Array ? items : [items];
    var trans = this.db.transaction([args.store], 'readwrite');
    var store = trans.objectStore(args.store);

    this._queue(queue, function(item, cb) {
      var request = store.delete(item);
      trans.oncomplete = function(e) {
        console.info('OIndexedDB::remove()', '=>', 'oncomplete()', e);
        cb(false, e);
      };
      request.onerror = function(e) {
        console.info('OIndexedDB::remove()', '=>', 'onerror()', e);
        cb(e.value);
      };
    }, callback);
  };

  OIndexedDB.prototype.list = function(args, callback) {
    args = args || {};
    console.info('OIndexedDB::list()', args);

    var list = [];
    var trans = this.db.transaction([args.store], 'readwrite');
    var store = trans.objectStore(args.store);
    var keyRange = IDBKeyRange.lowerBound(0);
    var cursorRequest = store.openCursor(keyRange);

    cursorRequest.onsuccess = function(e) {
      var result = e.target.result;
      if ( (!!result) === false ) {
        console.info('OIndexedDB::list()', '=>', 'onsuccess()', 'FINISHED', list);
        callback(false, list);
        return;
      }
      if ( result ) {
        list.push(result.value);
      }
      result.continue();
    };

    cursorRequest.onerror = function(e) {
      console.info('OIndexedDB::list()', '=>', 'onerror()', e);

      callback(e.value);
    };
  };

  OIndexedDB.prototype.get = function(args, item, callback) {
    args = args || {};

    console.info('OIndexedDB::get()', args, item);

    var trans = this.db.transaction([args.store], 'readonly');
    var store = trans.objectStore(args.store);
    var req = store.get(item);
    req.onsuccess = function(e) {
      console.info('OIndexedDB::get()', '=>', 'onsuccess()', e);

      callback(false, e.target.result, trans, store);
    };
    req.onerror = function(e) {
      console.info('OIndexedDB::get()', '=>', 'onerror()', e);

      callback(e.value);
    };
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.IndexedDB = OSjs.Helpers.IndexedDB || {};

  OSjs.Helpers.IndexedDB.createInstance = function(args, callback) {
    return new OIndexedDB(args, callback);
  };

})(OSjs.Utils, OSjs.API);
