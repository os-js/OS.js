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

(function(Utils, VFS, API) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /*
   * Searches an object field for matches
   */
  function search(list, query) {
    var result = [];

    list.forEach(function(obj) {
      var found = false;

      obj.fields.forEach(function(s) {
        if ( found ) {
          return;
        }

        var qry = String(query).toLowerCase();
        var str = String(s).toLowerCase();
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
    var self = this;
    Object.keys(obj).forEach(function(k) {
      self[k] = obj[k];
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // MODULES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Search Applications
   */
  var ApplicationModule = (function() {
    function query() {
      var packages = OSjs.Core.getPackageManager().getPackages();

      return Object.keys(packages).map(function(pn) {
        var p = packages[pn];

        return new SearchObject({
          value: {
            title: p.name,
            description: p.description,
            icon: API.getFileIcon(new VFS.File('applications:///' + p.className, 'application'), '16x16'),
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
      search: function(q, args, settings, cb) {
        if ( settings.applications ) {
          var results = search(query(), q);

          if ( args.limit && results.length > args.dlimit ) {
            results = results.splice(0, args.dlimit);
          }

          cb(false, results);
        } else {
          cb(false, []);
        }
      },
      reindex: function(args, cb) {
        cb(false, true);
      },
      destroy: function() {
      }
    };
  })();

  /**
   * Search VFS for files
   */
  var FilesystemModule = {
    search: function(q, args, settings, cb) {
      if ( !settings.files || !settings.paths ) {
        cb(false, []);
        return;
      }

      var found = [];
      Utils.asyncs(settings.paths, function(e, i, n) {
        VFS.find(e, {query: q, limit: (args.limit ? args.dlimit : 0), recursive: args.recursive}, function(error, result) {
          if ( error ) {
            console.warn(error);
          }

          if ( result ) {
            var list = result.map(function(iter) {
              return {
                title: iter.filename,
                description: iter.path,
                icon: API.getFileIcon(new VFS.File(iter)),
                launch: {application: '', args: '', file: iter}
              };
            });

            found = found.concat(list);
          }

          n();
        });
      }, function() {
        cb(false, found);
      });
    },
    reindex: function(args, cb) {
      cb(false, true);
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
   * For maintaining settings
   *
   * <pre><b>
   * You can only get an instance with `Core.getSearchEngine()`
   * </b></pre>
   *
   * @example
   * OSjs.Core.getSearchEngine()
   *
   * @summary The Search Engine for location files and application.
   *
   * @constructor
   * @memberof OSjs.Core
   * @see OSjs.Core.getSearchEngine
   */
  var SearchEngine = (function() {

    var modules = [
      ApplicationModule,
      FilesystemModule
    ];

    var settings = {};
    var inited = false;

    return Object.seal({

      /**
       * Initialize instance
       *
       * @function init
       * @memberof OSjs.Core.SearchEngine#
       *
       * @param   {Function}    cb        Callback => fn(error, result)
       */
      init: function(cb) {
        console.debug('SearchEngine::init()');

        if ( inited ) {
          return;
        }

        var manager = OSjs.Core.getSettingsManager();
        settings = manager.get('SearchEngine') || {};

        inited = true;

        cb();
      },

      /**
       * Destroy instance
       *
       * @function destroy
       * @memberof OSjs.Core.SearchEngine#
       */
      destroy: function() {
        console.debug('SearchEngine::destroy()');

        modules.forEach(function(m) {
          m.destroy();
        });

        modules = [];
        settings = {};
        inited = false;
      },

      /**
       * Perform a search
       *
       * @function search
       * @memberof OSjs.Core.SearchEngine#
       *
       * @param   {String}      q         Search query
       * @param   {Object}      args      Arguments
       * @param   {Function}    cb        Callback => fn(error, result)
       */
      search: function(q, args, cb) {
        var result = [];
        var errors = [];

        args = Utils.argumentDefaults(args, {
          recursive: false,
          limit: 0,
          dlimit: 0
        });

        if ( args.limit ) {
          args.dlimit = args.limit;
        }

        Utils.asyncs(modules, function(module, index, next) {
          console.debug('SearchEngine::search()', '=>', module);

          if ( !args.limit || args.dlimit > 0 ) {
            module.search(q, args, settings, function(err, res) {
              if ( err ) {
                errors.push(err);
              } else {
                args.dlimit -= res.length;

                result = result.concat(res);
              }

              next();
            });
          } else {
            cb(errors, result);
          }
        }, function() {
          cb(errors, result);
        });
      },

      /**
       * Reindex databases
       *
       * @TODO implement
       * @function reindex
       * @memberof OSjs.Core.SearchEngine#
       *
       * @param   {Object}      args      Arguments
       * @param   {Function}    cb        Callback => fn(error, result)
       */
      reindex: function(args, cb) {
        var errors = [];

        Utils.asyncs(modules, function(module, index, next) {
          console.debug('SearchEngine::reindex()', '=>', module);

          module.reindex(args, function(err, res) {
            if ( err ) {
              errors.push(err);
            }
            next();
          });
        }, function() {
          cb(errors, true);
        });
      },

      /**
       * Configure the Search Engine
       *
       * @TODO implement
       * @function configure
       * @memberof OSjs.Core.SearchEngine#
       *
       * @param   {Object}      opts          Settings Object
       * @param   {Boolean}     [save=true]   Save settings
       */
      configure: function(opts, save) {
      }
    });

  })();

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get the current SearchEngine  instance
   *
   * @function getSearchEngine
   * @memberof OSjs.Core
   *
   * @return {OSjs.Core.SearchEngine}
   */
  OSjs.Core.getSearchEngine = function Core_getSearchEngine() {
    return SearchEngine;
  };

})(OSjs.Utils, OSjs.VFS, OSjs.API);
