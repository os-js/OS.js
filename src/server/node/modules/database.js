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

let instances = {};

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

function mysqlConfiguration(config) {
  let ccfg = {};
  Object.keys(config).forEach((c) => {
    if ( typeof config[c] === 'object' ) {
      ccfg[c] = config[c];
    } else {
      ccfg[c] = String(config[c]);
    }
  });
  return ccfg;
}

///////////////////////////////////////////////////////////////////////////////
// API
///////////////////////////////////////////////////////////////////////////////

function DatabaseInstance(name, type, opts) {
  this.conn = null;
  this.type = type;
  this.name = name;

  if ( type === 'mysql' ) {
    const _mysql = require('mysql');
    this.conn = _mysql.createPool(mysqlConfiguration(opts));
  } else if ( type === 'sqlite' ) {
    const _sqlite = require('sqlite3');
    this.conn = new _sqlite.Database(opts.database);
  }
}

DatabaseInstance.prototype.destroy = function() {
  if ( this.conn ) {
    if ( this.type === 'sqlite' ) {
      this.conn.close();
    }
  }

  this.conn = null;
  this.type = null;
};

DatabaseInstance.prototype.init = function() {
  const conn = this.conn;
  const type = this.type;

  if ( type === 'sqlite' ) {
    return new Promise((resolve, reject) => {
      conn.serialize(resolve);
    });
  }

  return Promise.resolve();
};

DatabaseInstance.prototype._query = function(q, a, all) {
  a = a || [];

  const type = this.type;
  const conn = this.conn;

  function mysqlQuery(done) {
    conn.getConnection((err, connection) => {
      if ( err ) {
        done(err);
      } else {
        connection.query(q, a, (err, row, fields) => {
          if ( all ) {
            done(err, row, fields);
          } else {
            done(err, row ? row[0] : null, fields);
          }

          connection.release();
        });
      }
    });
  }

  function sqliteQuery(done) {
    if ( all ) {
      conn.all(q, a, done);
    } else {
      conn.get(q, a, done);
    }
  }

  if ( conn ) {
    return new Promise((resolve, reject) => {
      if ( type === 'mysql' ) {
        mysqlQuery((err, res) => {
          if ( err ) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      } else if ( type === 'sqlite' ) {
        sqliteQuery((err, res) => {
          if ( err ) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      } else {
        reject('Invalid database driver');
      }
    });
  }

  return Promise.reject('No SQL connection available');
};

DatabaseInstance.prototype.query = function(q, a) {
  return this._query(q, a, false);
};

DatabaseInstance.prototype.queryAll = function(q, a) {
  return this._query(q, a, true);
};

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

/**
 * Creates or fethes a connection
 *
 * @param   {String}      name      Connection Name
 * @param   {String}      [type]    Connection Type
 * @param   {Object}      [opts]    Connection Options
 *
 * @function instance
 * @memberof lib.database
 * @return {Promise}
 */
module.exports.instance = function(name, type, opts) {
  return new Promise((resolve, reject) => {
    if ( arguments.length === 1 || !(type && opts) ) {
      resolve(instances[name]);
      return;
    }

    try {
      let i = new DatabaseInstance(name, type, opts);
      i.init().then(() => {
        instances[name] = i;
        resolve(i);
      }).catch(reject);
    } catch ( e ) {
      reject(e);
    }
  });
};

/**
 * Destroys all database connections
 *
 * @param {String}    name    Instance name
 *
 * @function destroy
 * @memberof lib.database
 */
module.exports.destroy = function(name) {
  if ( name ) {
    try {
      if ( instances[name] ) {
        instances[name].destroy();
      }
    } catch ( e ) {
      console.warn(e);
    }
    delete instances[name];
  } else {
    Object.keys(instances).forEach((k) => {
      instances[k].destroy();
      delete instances[k];
    });
  }
};
