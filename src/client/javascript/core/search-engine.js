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

import Promise from 'bluebird';
import PackageManager from 'core/package-manager';
import SettingsManager from 'core/settings-manager';
import FileMetadata from 'vfs/file';
import Theme from 'core/theme';
import * as VFS from 'vfs/fs';

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

/*
 * Searches an object field for matches
 */
function search(list, query) {
  const result = [];

  list.forEach((obj) => {
    let found = false;

    obj.fields.forEach((s) => {
      if ( found ) {
        return;
      }

      const qry = String(query).toLowerCase();
      const str = String(s).toLowerCase();
      if ( str.indexOf(qry) !== -1 ) {
        result.push(obj.value);

        found = true;
      }
    });
  });

  return result;
}

/*
 * A search Object
 */
function SearchObject(obj) {
  Object.keys(obj).forEach((k) => {
    this[k] = obj[k];
  });
}

/////////////////////////////////////////////////////////////////////////////
// MODULES
/////////////////////////////////////////////////////////////////////////////

/*
 * Search Applications
 */
const ApplicationModule = (function() {
  function query() {
    const packages = PackageManager.getPackages();

    return Object.keys(packages).map((pn) => {
      const p = packages[pn];

      return new SearchObject({
        value: {
          title: p.name,
          description: p.description,
          icon: Theme.getFileIcon(new FileMetadata('applications:///' + p.className, 'application'), '16x16'),
          launch: {application: pn, args: {}}
        },
        fields: [
          p.className,
          p.name,
          p.description
        ]
      });
    });
  }

  return {
    search: function(q, args, settings) {
      if ( settings.applications ) {
        let results = search(query(), q);

        if ( args.limit && results.length > args.dlimit ) {
          results = results.splice(0, args.dlimit);
        }

        return Promise.resolve(results);
      }
      return Promise.resolve([]);
    },
    reindex: function(args) {
      return Promise.resolve(true);
    },
    destroy: function() {
    }
  };
})();

/*
 * Search VFS for files
 */
const FilesystemModule = {
  search: function(q, args, settings, cb) {
    if ( !settings.files || !settings.paths ) {
      return Promise.resolve([]);
    }

    let found = [];
    const append = (result) => {
      if ( result ) {
        found = found.concat(result.map((iter) => {
          return {
            title: iter.filename,
            description: iter.path,
            icon: Theme.getFileIcon(new FileMetadata(iter)),
            launch: {application: '', args: '', file: iter}
          };
        }));
      }
    };

    return new Promise((resolve, reject) => {
      Promise.each(settings.paths, (e) => {
        return new Promise((n) => {
          VFS.find(e, {query: q, limit: (args.limit ? args.dlimit : 0), recursive: args.recursive}).then((result) => {
            return n(append(result));
          }).catch((error) => {
            console.warn(error);
            n();
          });
        });
      }).then(() => {
        return resolve(found);
      }).catch(reject);
    });
  },
  reindex: function(args) {
    return Promise.resolve();
  },
  destroy: function() {
  }
};

/////////////////////////////////////////////////////////////////////////////
// ENGINE
/////////////////////////////////////////////////////////////////////////////

/**
 * Settings Manager Class
 *
 * @desc The Search Engine for location files and application.
 */
class SearchEngine {

  constructor() {
    this.settings = {};
    this.inited = false;
    this.modules = [
      ApplicationModule,
      FilesystemModule
    ];
  }

  /**
   * Initialize instance
   *
   * @return {Promise<undefined, Error>}
   */
  init() {
    console.debug('SearchEngine::init()');

    if ( !this.inited ) {
      this.settings = SettingsManager.get('SearchEngine') || {};
      this.inited = true;
    }

    return Promise.resolve();
  }

  /**
   * Destroy instance
   */
  destroy() {
    console.debug('SearchEngine::destroy()');

    this.modules.forEach((m) => {
      m.destroy();
    });

    this.modules = [];
    this.settings = {};
    this.inited = false;
  }

  /**
   * Perform a search
   *
   * @param   {String}      q         Search query
   * @param   {Object}      args      Arguments
   * @return  {Promise<Array, Error>}
   */
  search(q, args) {
    let result = [];
    let errors = [];

    args = Object.assign({}, {
      recursive: false,
      limit: 0,
      dlimit: 0
    }, args);

    if ( args.limit ) {
      args.dlimit = args.limit;
    }

    return new Promise((resolve, reject) => {
      Promise.each(this.modules, (module) => {
        return new Promise((next, reject) => {

          console.debug('SearchEngine::search()', '=>', module);

          if ( !args.limit || args.dlimit > 0 ) {
            module.search(q, args, this.settings).then((res) => {
              args.dlimit -= res.length;
              result = result.concat(res);

              next();
            }).catch((err) => {
              console.warn(err);
              errors.push(err instanceof Error ? err.toString() : err);
              next();
            });
          } else {
            next();
            //reject(new Error(errors.join(', ')));
          }
        });
      }).then(() => resolve(result)).catch(reject);
    });
  }

  /**
   * Reindex databases
   *
   * @TODO implement
   *
   * @param   {Object}      args      Arguments
   * @param   {Function}    cb        Callback => fn(error, result)
   * @return {Promise<Boolean, Error>}
   */
  reindex(args) {
    const errors = [];

    return Promise.each(this.modules, (module) => {
      return new Promise((next) => {
        console.debug('SearchEngine::reindex()', '=>', module);

        module.reindex(args).then(next).catch((err) => {
          if ( err ) {
            errors.push(err);
          }
          next();
        });
      });
    });
  }

  /**
   * Configure the Search Engine
   *
   * @TODO implement
   *
   * @param   {Object}      opts          Settings Object
   * @param   {Boolean}     [save=true]   Save settings
   */
  configure(opts, save) {
  }

}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default (new SearchEngine());
