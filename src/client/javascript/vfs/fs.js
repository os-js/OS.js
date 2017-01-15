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
(function(Utils, API, VFS, Core) {
  'use strict';

  /**
   * A response from a VFS request. The results are usually from the server,
   * except for when an exception occured in the stack.
   * @callback CallbackVFS
   * @param {String} [error] Error from response (if any)
   * @param {Mixed} result Result from response (if any)
   */

  var watches = [];

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /*
   * The default callback function when none was defined
   */
  function noop(err, res) {
    if ( err ) {
      console.error('VFS operation without callback caused an error', err)
    } else {
      console.warn('VFS operation without callback', res);
    }
  }

  /*
   * Perform VFS request
   */
  function request(test, method, args, callback, options, appRef) {
    var mm = Core.getMountManager();
    var d = mm.getModuleFromPath(test, false);

    if ( !d ) {
      throw new Error(API._('ERR_VFSMODULE_NOT_FOUND_FMT', test));
    }
    if ( typeof method !== 'string' ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'method', 'String', typeof method));
    }
    if ( !(args instanceof Object) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'args', 'Object', typeof args));
    }
    if ( !(callback instanceof Function) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'callback', 'Function', typeof callback));
    }
    if ( options && !(options instanceof Object) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'options', 'Object', typeof options));
    }

    var conn  = Core.getConnection();
    conn.onVFSRequest(d, method, args, function vfsRequestCallback(err, response) {
      if ( arguments.length === 2 ) {
        console.warn('VFS::request()', 'Core::onVFSRequest hijacked the VFS request');
        callback(err, response);
        return;
      }

      try {
        mm.getModule(d).request(method, args, function(err, res) {
          conn.onVFSRequestCompleted(d, method, args, err, res, function(e, r) {
            if ( arguments.length === 2 ) {
              console.warn('VFS::request()', 'Core::onVFSRequestCompleted hijacked the VFS request');
              callback(e, r);
              return;
            } else {
              callback(err, res);
            }
          }, appRef);
        }, options);
      } catch ( e ) {
        var msg = API._('ERR_VFSMODULE_EXCEPTION_FMT', e.toString());
        callback(msg);
        console.warn('VFS::request()', 'exception', e.stack, e);
      }
    });
  }

  /*
   * Just a helper function to reduce codesize by wrapping the general
   * request flow into one handy-dandy function.
   */
  function requestWrapper(args, errstr, callback, onfinished, options, appRef) {
    function _finished(error, response) {
      if ( error ) {
        error = API._(errstr, error);
      }

      if ( onfinished ) {
        response = onfinished(error, response);
      }
      callback(error, response);
    }

    args.push(_finished);
    args.push(options || {});
    args.push(appRef);

    try {
      request.apply(null, args);
    } catch ( e ) {
      _finished(e);
    }
  }

  /*
   * Check if given item has an aliased mount associated with it
   * and return the real path
   */
  function hasAlias(item, retm) {
    var mm = OSjs.Core.getMountManager();
    var module = mm.getModuleFromPath(item.path, false, true);

    if ( module && module.options && module.options.alias ) {
      return retm ? module : item.path.replace(module.match, module.options.alias);
    }

    return false;
  }

  /*
   * Check if destination is readOnly
   */
  function isReadOnly(item) {
    var m = Core.getMountManager().getModuleFromPath(item.path, false, true) || {};
    return m.readOnly === true;
  }

  /*
   * Will transform the argument to a VFS.File instance
   * or throw an error depending on input
   */
  function checkMetadataArgument(item, err, checkRo) {
    if ( typeof item === 'string' ) {
      item = new VFS.File(item);
    } else if ( typeof item === 'object' && item.path ) {
      item = new VFS.File(item);
    }

    if ( !(item instanceof VFS.File) ) {
      throw new TypeError(err || API._('ERR_VFS_EXPECT_FILE'));
    }

    var alias = hasAlias(item);
    if ( alias ) {
      item.path = alias;
    }

    var mm = Core.getMountManager();
    if ( !mm.getModuleFromPath(item.path, false) ) {
      throw new Error(API._('ERR_VFSMODULE_NOT_FOUND_FMT', item.path));
    }

    if ( checkRo && isReadOnly(item) ) {
      throw new Error(API._('ERR_VFSMODULE_READONLY_FMT', mm.getModuleFromPath(item.path)));
    }

    return item;
  }

  /*
   * Check if targets have the same transport/module
   */
  function hasSameTransport(src, dest) {
    // Modules using the normal server API
    var mm = Core.getMountManager();
    if ( mm.isInternal(src.path) && mm.isInternal(dest.path) ) {
      return true;
    }

    var msrc = mm.getModuleFromPath(src.path, false, true) || {};
    var mdst = mm.getModuleFromPath(dest.path, false, true) || {};

    return (msrc.transport === mdst.transport) || (msrc.name === mdst.name);
  }

  /*
   * A wrapper for checking if a file exists
   */
  function existsWrapper(item, callback, options) {
    options = options || {};

    try {
      if ( typeof options.overwrite !== 'undefined' && options.overwrite === true ) {
        callback();
      } else {
        VFS.exists(item, function(error, result) {
          if ( error ) {
            console.warn('existsWrapper() error', error);
          }

          if ( result ) {
            callback(API._('ERR_VFS_FILE_EXISTS'));
          } else {
            callback();
          }
        });
      }
    } catch ( e ) {
      callback(e);
    }
  }

  /*
   * Creates the '..' entry for scandir if not detected
   */
  function createBackLink(item, result, alias, oitem) {
    var path = item.path.split('://')[1].replace(/\/+/g, '/').replace(/^\/?/, '/');
    var isOnRoot = path === '/';

    if ( alias ) {
      isOnRoot = (oitem.path === alias.root);
    }

    if ( !isOnRoot ) {
      var foundBack = result.some(function(iter) {
        return iter.filename === '..';
      });

      if ( !foundBack ) {
        return new VFS.File({
          filename: '..',
          path: Utils.dirname(item.path),
          mime: null,
          size: 0,
          type: 'dir'
        });
      }
    }

    return false;
  }

  /*
   * Checks if an action mathes given path
   */
  function checkWatches(msg, obj) {
    watches.forEach(function(w) {
      var checkPath = w.path;

      function _check(f) {
        if ( w.type === 'dir' ) {
          return f.path.substr(0, checkPath.length) === checkPath;
        }
        return f.path === checkPath;
      }

      var wasTouched = false;
      if ( obj.destination ) {
        wasTouched = _check(obj.destination);
        if ( !wasTouched ) {
          wasTouched = _check(obj.source);
        }
      } else {
        wasTouched = _check(obj);
      }

      if ( wasTouched ) {
        w.cb(msg, obj);
      }
    });
  }

  /*
   * See if given item matches up with any VFS modules with aliases
   * and return given entry.
   */
  function findAlias(item) {
    var mm = OSjs.Core.getMountManager();
    var found = null;

    mm.getModules().forEach(function(iter) {
      if ( !found && iter.module.options && iter.module.options.alias ) {
        var a = iter.module.options.alias;
        if ( item.path.substr(0, a.length) === a ) {
          found = iter.module;
        }
      }
    });

    return found;
  }

  /*
   * Wrapper for broadcasting VFS messages
   */
  function broadcastMessage(msg, item, appRef) {
    function _message(i) {
      API.message(msg, i, {source: appRef ? appRef.__pid : null});

      checkWatches(msg, item);
    }

    // Makes sure aliased paths are called for
    var aliased = (function() {
      function _transform(i) {
        if ( i instanceof VFS.File ) {
          var n = new VFS.File(i);
          var alias = findAlias(n);
          if ( alias ) {
            n.path = n.path.replace(alias.options.alias, alias.root);
            return n;
          }
        }

        return false;
      }

      if ( item instanceof VFS.File ) {
        return _transform(item);
      } else if ( item && item.destination && item.source ) {
        return {
          source: _transform(item.source),
          destination: _transform(item.destination)
        };
      }

      return null;
    })();

    _message(item);

    var tuple = aliased.source || aliased.destination;
    if ( aliased && (aliased instanceof VFS.File || tuple) ) {
      if ( tuple ) {
        aliased.source = aliased.source || item.source;
        aliased.destination = aliased.destination || item.destination;
      }

      _message(aliased);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // VFS METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Find file(s)
   *
   * @function find
   * @memberof OSjs.VFS
   *
   * @param  {OSjs.VFS.File}   item              Root path
   * @param  {Object}          args              Search query
   * @param  {CallbackVFS}     callback          Callback function
   * @param  {Object}          [options]         Set of options
   * @param  {String}          options.query     The search query string
   * @param  {Number}          [options.limit]   Limit results to this amount
   *
   * @api     OSjs.VFS.find()
   */
  VFS.find = function VFS_find(item, args, callback, options) {
    options = options || {};
    callback = callback || noop;

    console.debug('VFS::find()', item, args, options);
    if ( arguments.length < 3 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item);
    } catch ( e ) {
      callback(e);
      return;
    }

    requestWrapper([item.path, 'find', [item, args]], 'ERR_VFSMODULE_FIND_FMT', callback, null, options);
  };

  /**
   * Scandir
   *
   * @summary Scans a directory for files and directories.
   *
   * @function scandir
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}   item                             File Metadata
   * @param   {CallbackVFS}     callback                         Callback function
   * @param   {Object}          [options]                        Set of options
   * @param   {String}          [options.typeFilter]             Filter by 'file' or 'dir'
   * @param   {Array}           [options.mimeFilter]             Array of mime regex matchers
   * @param   {Boolean}         [options.showHiddenFiles=true]   Show hidden files
   * @param   {Boolean}         [options.backlink=true]          Return '..' when applicable
   */
  VFS.scandir = function VFS_scandir(item, callback, options) {
    options = options || {};
    callback = callback || noop;

    console.debug('VFS::scandir()', item, options);
    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    var oitem = new VFS.File(item);
    var alias = hasAlias(oitem, true);

    try {
      item = checkMetadataArgument(item);
    } catch ( e ) {
      callback(e);
      return;
    }

    requestWrapper([item.path, 'scandir', [item]], 'ERR_VFSMODULE_SCANDIR_FMT', function(error, result) {
      // Makes sure aliased mounts have correct paths and entries
      if ( alias && result ) {
        result = result.map(function(iter) {
          var niter = new VFS.File(iter);
          var str = iter.path.replace(/\/?$/, '');
          var tmp = alias.options.alias.replace(/\/?$/, '');

          niter.path = Utils.pathJoin(alias.root, str.replace(tmp, ''));

          return niter;
        });
      }

      // Inserts the correct '..' entry if missing
      if ( !error && result instanceof Array ) {
        var back = createBackLink(item, result, alias, oitem);
        if ( back ) {
          result.unshift(back);
        }
      }

      return callback(error, result);
    }, null, options);
  };

  /**
   * Write File
   *
   * @summary Writes data to a file
   *
   * @function write
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}             item          File Metadata (you can also provide a string)
   * @param   {File}                      data          File Data (see supported types)
   * @param   {CallbackVFS}               callback      Callback function
   * @param   {Object}                    [options]     Set of options
   * @param   {OSjs.Core.Application}     [appRef]      Reference to an Application
   */
  VFS.write = function VFS_write(item, data, callback, options, appRef) {
    options = options || {};
    callback = callback || noop;

    console.debug('VFS::write()', item, options);
    if ( arguments.length < 3 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item, null, true);
    } catch ( e ) {
      callback(e);
      return;
    }

    function _finished(error, result) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_WRITE_FMT', error);
      }

      callback(error, result);
    }

    function _write(filedata) {
      try {
        request(item.path, 'write', [item, filedata], _finished, options, appRef);
      } catch ( e ) {
        _finished(e);
      }
    }

    function _converted(error, response) {
      if ( error ) {
        _finished(error, null);
        return;
      }
      _write(response);
    }

    try {
      if ( typeof data === 'string' ) {
        if ( data.length ) {
          VFS.Helpers.textToAb(data, item.mime, function(error, response) {
            _converted(error, response);
          });
        } else {
          _converted(null, data);
        }
      } else {
        if ( data instanceof VFS.FileDataURL ) {
          VFS.Helpers.dataSourceToAb(data.toString(), item.mime, function(error, response) {
            _converted(error, response);
          });
          return;
        } else if ( window.Blob && data instanceof window.Blob ) {
          VFS.Helpers.blobToAb(data, function(error, response) {
            _converted(error, response);
          });
          return;
        }
        _write(data);
      }
    } catch ( e ) {
      _finished(e);
    }
  };

  /**
   * Read File
   *
   * @summary Reads data from a file
   *
   * @function read
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}   item                File Metadata (you can also provide a string)
   * @param   {CallbackVFS}     callback            Callback function
   * @param   {Object}          [options]           Set of options
   * @param   {String}          [options.type]      What to return, default: binary. Can also be: text, datasource, json
   */
  VFS.read = function VFS_read(item, callback, options) {
    options = options || {};
    callback = callback || noop;

    console.debug('VFS::read()', item, options);
    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item);
    } catch ( e ) {
      callback(e);
      return;
    }

    function _finished(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_READ_FMT', error);
        callback(error);
        return;
      }

      if ( options.type ) {
        var types = {
          datasource: function readToDataSource() {
            VFS.Helpers.abToDataSource(response, item.mime, function(error, dataSource) {
              callback(error, error ? null : dataSource);
            });
          },
          text: function readToText() {
            VFS.Helpers.abToText(response, item.mime, function(error, text) {
              callback(error, error ? null : text);
            });
          },
          blob: function readToBlob() {
            VFS.Helpers.abToBlob(response, item.mime, function(error, blob) {
              callback(error, error ? null : blob);
            });
          },
          json: function readToJSON() {
            VFS.Helpers.abToText(response, item.mime, function(error, text) {
              var jsn;
              if ( typeof text === 'string' ) {
                try {
                  jsn = JSON.parse(text);
                } catch ( e ) {
                  console.warn('VFS::read()', 'readToJSON', e.stack, e);
                }
              }
              callback(error, error ? null : jsn);
            });
          }
        };

        var type = options.type.toLowerCase();
        if ( types[type] ) {
          types[type]();
          return;
        }
      }

      callback(error, error ? null : response);
    }

    try {
      request(item.path, 'read', [item], function(error, response) {
        _finished(error, error ? false : response);
      }, options);
    } catch ( e ) {
      _finished(e);
    }
  };

  /**
   * Copy File
   *
   * @summary Copies a file to a destination
   *
   * @function copy
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}             src                   Source File Metadata (you can also provide a string)
   * @param   {OSjs.VFS.File}             dest                  Destination File Metadata (you can also provide a string)
   * @param   {CallbackVFS}               callback              Callback function
   * @param   {Object}                    [options]             Set of options
   * @param   {Boolean}                   [options.overwrite]   If set to true it will not check if the destination exists
   * @param   {OSjs.Core.Application}     [appRef]              Seference to an Application
   */
  VFS.copy = function VFS_copy(src, dest, callback, options, appRef) {
    options = options || {};
    callback = callback || noop;

    console.debug('VFS::copy()', src, dest, options);
    if ( arguments.length < 3 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    var mm = Core.getMountManager();

    try {
      src = checkMetadataArgument(src, API._('ERR_VFS_EXPECT_SRC_FILE'));
      dest = checkMetadataArgument(dest, API._('ERR_VFS_EXPECT_DST_FILE'), true);
    } catch ( e ) {
      callback(e);
      return;
    }

    options = Utils.argumentDefaults(options, {
      type: 'binary',
      dialog: null
    });

    options.arrayBuffer = true;

    function dialogProgress(prog) {
      if ( options.dialog ) {
        options.dialog.setProgress(prog);
      }
    }

    function doRequest() {
      function _finished(error, result) {
        callback(error, result);
      }

      if ( hasSameTransport(src, dest) ) {
        request(src.path, 'copy', [src, dest], function(error, response) {
          dialogProgress(100);
          if ( error ) {
            error = API._('ERR_VFSMODULE_COPY_FMT', error);
          }
          _finished(error, response);
        }, options, appRef);
      } else {
        var msrc = mm.getModuleFromPath(src.path);
        var mdst = mm.getModuleFromPath(dest.path);

        // FIXME: This does not work for folders
        if ( src.type === 'dir' ) {
          _finished(API._('ERR_VFSMODULE_COPY_FMT', 'Copying folders between different transports is not yet supported!'));
          return;
        }

        dest.mime = src.mime;

        mm.getModule(msrc).request('read', [src], function(error, data) {
          dialogProgress(50);

          if ( error ) {
            _finished(API._('ERR_VFS_TRANSFER_FMT', error));
            return;
          }

          mm.getModule(mdst).request('write', [dest, data], function(error, result) {
            dialogProgress(100);

            if ( error ) {
              error = API._('ERR_VFSMODULE_COPY_FMT', error);
            }
            _finished(error, result);
          }, options);
        }, options);
      }
    }

    existsWrapper(dest, function(error) {
      if ( error ) {
        callback(API._('ERR_VFSMODULE_COPY_FMT', error));
      } else {
        try {
          doRequest();
        } catch ( e ) {
          callback(API._('ERR_VFSMODULE_COPY_FMT', e));
        }
      }
    });
  };

  /**
   * Move File
   *
   * @summary Moves a file to a destination
   *
   * @function move
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}             src                   Source File Metadata (you can also provide a string)
   * @param   {OSjs.VFS.File}             dest                  Destination File Metadata (you can also provide a string)
   * @param   {CallbackVFS}               callback              Callback function
   * @param   {Object}                    [options]             Set of options
   * @param   {Boolean}                   [options.overwrite]   If set to true it will not check if the destination exists
   * @param   {OSjs.Core.Application}     [appRef]              Seference to an Application
   */
  VFS.move = function VFS_move(src, dest, callback, options, appRef) {
    options = options || {};
    callback = callback || noop;

    console.debug('VFS::move()', src, dest, options);
    if ( arguments.length < 3 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    var mm = Core.getMountManager();

    try {
      src = checkMetadataArgument(src, API._('ERR_VFS_EXPECT_SRC_FILE'));
      dest = checkMetadataArgument(dest, API._('ERR_VFS_EXPECT_DST_FILE'), true);
    } catch ( e ) {
      callback(e);
      return;
    }

    function doRequest() {
      function _finished(error, result) {
        callback(error, result);
      }

      if ( hasSameTransport(src, dest) ) {
        request(src.path, 'move', [src, dest], function(error, response) {
          if ( error ) {
            error = API._('ERR_VFSMODULE_MOVE_FMT', error);
          }
          _finished(error, error ? null : response, dest);
        }, options, appRef);
      } else {
        var msrc = mm.getModuleFromPath(src.path);
        //var mdst = mm.getModuleFromPath(dest.path);

        dest.mime = src.mime;

        OSjs.VFS.copy(src, dest, function(error, result) {
          if ( error ) {
            error = API._('ERR_VFS_TRANSFER_FMT', error);
            return _finished(error);
          }

          mm.getModule(msrc).request('unlink', [src], function(error, result) {
            if ( error ) {
              error = API._('ERR_VFS_TRANSFER_FMT', error);
            }
            _finished(error, result, dest);
          }, options);
        });
      }
    }

    existsWrapper(dest, function(error) {
      if ( error ) {
        callback(API._('ERR_VFSMODULE_MOVE_FMT', error));
      } else {
        try {
          doRequest();
        } catch ( e ) {
          callback(API._('ERR_VFSMODULE_MOVE_FMT', e));
        }
      }
    });
  };

  /**
   * Alias of move
   *
   * @function rename
   * @memberof OSjs.VFS
   * @alias OSjs.VFS.move
   *
   * @param   {OSjs.VFS.File}             src                   Source File Metadata (you can also provide a string)
   * @param   {OSjs.VFS.File}             dest                  Destination File Metadata (you can also provide a string)
   * @param   {CallbackVFS}               callback              Callback function
   * @param   {Object}                    [options]             Set of options
   * @param   {Boolean}                   [options.overwrite]   If set to true it will not check if the destination exists
   * @param   {OSjs.Core.Application}     [appRef]              Seference to an Application
   */
  VFS.rename = function VFS_rename(src, dest, callback) {
    VFS.move.apply(this, arguments);
  };

  /**
   * Delete File
   *
   * This function currently have no options.
   *
   * @summary Deletes a file
   *
   * @function unlink
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}             item                  File Metadata (you can also provide a string)
   * @param   {CallbackVFS}               callback              Callback function
   * @param   {Object}                    [options]             Set of options
   * @param   {OSjs.Core.Application}     [appRef]              Reference to an Application
   */
  VFS.unlink = function VFS_unlink(item, callback, options, appRef) {
    options = options || {};
    callback = callback || noop;

    console.debug('VFS::unlink()', item, options);
    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item, null, true);
    } catch ( e ) {
      callback(e);
      return;
    }

    function _checkPath() {
      var pkgdir = OSjs.Core.getSettingsManager().instance('PackageManager').get('PackagePaths', []);

      var found = pkgdir.some(function(i) {
        var chkdir = new VFS.File(i);
        var idir = Utils.dirname(item.path);
        return idir === chkdir.path;
      });

      if ( found ) {
        Core.getPackageManager().generateUserMetadata(function() {});
      }
    }

    requestWrapper([item.path, 'unlink', [item]], 'ERR_VFSMODULE_UNLINK_FMT', callback, function(error, response) {
      if ( !error ) {
        _checkPath();
      }
      return response;
    }, options, appRef);
  };

  /**
   * Alias of unlink
   *
   * @function delete
   * @memberof OSjs.VFS
   * @alias OSjs.VFS.unlink
   */
  (function() {
    /*eslint dot-notation: "off"*/
    VFS['delete'] = function VFS_delete(item, callback) {
      VFS.unlink.apply(this, arguments);
    };
  })();

  /**
   * Create Directory
   *
   * @summary Creates a directory
   *
   * @function mkdir
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}             item                  File Metadata (you can also provide a string)
   * @param   {CallbackVFS}               callback              Callback function
   * @param   {Object}                    [options]             Set of options
   * @param   {Boolean}                   [options.overwrite]   If set to true it will not check if the destination exists
   * @param   {OSjs.Core.Application}     [appRef]              Reference to an Application
   */
  VFS.mkdir = function VFS_mkdir(item, callback, options, appRef) {
    options = options || {};
    callback = callback || noop;

    console.debug('VFS::mkdir()', item, options);
    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item, null, true);
    } catch ( e ) {
      callback(e);
      return;
    }

    existsWrapper(item, function(error) {
      if ( error ) {
        return callback(API._('ERR_VFSMODULE_MKDIR_FMT', error));
      }

      requestWrapper([item.path, 'mkdir', [item]], 'ERR_VFSMODULE_MKDIR_FMT', callback, function(error, response) {
        return response;
      }, options, appRef);
    });
  };

  /**
   * Check if file exists
   *
   * @summary Check if a target exists
   *
   * @function exists
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}   item      File Metadata (you can also provide a string)
   * @param   {CallbackVFS}     callback  Callback function
   */
  VFS.exists = function VFS_exists(item, callback) {
    callback = callback || noop;

    console.debug('VFS::exists()', item);
    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item);
    } catch ( e ) {
      callback(e);
      return;
    }
    requestWrapper([item.path, 'exists', [item]], 'ERR_VFSMODULE_EXISTS_FMT', callback);
  };

  /**
   * Get file info
   *
   * @summary Gets information about a file
   *
   * @function fileinfo
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}   item      File Metadata (you can also provide a string)
   * @param   {CallbackVFS}     callback  Callback function
   */
  VFS.fileinfo = function VFS_fileinfo(item, callback) {
    callback = callback || noop;

    console.debug('VFS::fileinfo()', item);
    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item);
    } catch ( e ) {
      callback(e);
      return;
    }
    requestWrapper([item.path, 'fileinfo', [item]], 'ERR_VFSMODULE_FILEINFO_FMT', callback);
  };

  /**
   * Get file URL
   *
   * @summary Gets absolute HTTP URL to a file
   *
   * @function url
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}   item      File Metadata (you can also provide a string)
   * @param   {CallbackVFS}     callback  Callback function
   */
  VFS.url = function VFS_url(item, callback) {
    callback = callback || noop;

    console.debug('VFS::url()', item);
    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item);
    } catch ( e ) {
      callback(e);
      return;
    }

    requestWrapper([item.path, 'url', [item]], 'ERR_VFSMODULE_URL_FMT', callback, function(error, response) {
      return error ? false : response;
    });
  };

  /**
   * Upload file(s)
   *
   * @summary Uploads a file to the target from browser
   *
   * @function upload
   * @memberof OSjs.VFS
   *
   * @param   {Object}                    args                Function arguments (see below)
   * @param   {String}                    args.destination    Full path to destination
   * @param   {Array}                     args.files          Array of 'File'
   * @param   {OSjs.Core.Application}     [args.app]          If specified (Application ref) it will create a Dialog window
   * @param   {OSjs.Core.Window}          [args.win]          Save as above only will add as child to this window
   * @param   {CallbackVFS}               callback            Callback function
   * @param   {Object}                    [options]           Set of options
   * @param   {Boolean}                   [options.overwrite] If set to true it will not check if the destination exists
   * @param   {OSjs.Core.Application}     [appRef]            Reference to an Application
   */
  VFS.upload = function VFS_upload(args, callback, options, appRef) {
    callback = callback || noop;
    options = options || {};
    args = args || {};

    console.debug('VFS::upload()', args);

    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }
    if ( !args.files ) {
      callback(API._('ERR_VFS_UPLOAD_NO_FILES'));
      return;
    }
    if ( !args.destination ) {
      callback(API._('ERR_VFS_UPLOAD_NO_DEST'));
      return;
    }

    function _createFile(filename, mime, size) {
      var npath = (args.destination + '/' + filename).replace(/\/\/\/\/+/, '///');
      return new VFS.File({
        filename: filename,
        path: npath,
        mime: mime || 'application/octet-stream',
        size: size
      });
    }

    function _dialogClose(ev, btn, ufile) {
      if ( btn !== 'ok' && btn !== 'complete' ) {
        callback(false, false);
        return;
      }

      var file = _createFile(ufile.name, ufile.mime, ufile.size);
      callback(false, file);
    }

    var mm = Core.getMountManager();
    if ( !mm.isInternal(args.destination) ) {
      args.files.forEach(function(f, i) {
        request(args.destination, 'upload', [f, args.destination], callback, options);
      });
      return;
    }

    if ( isReadOnly(VFS.file(args.destination)) ) {
      callback(API._('ERR_VFSMODULE_READONLY_FMT', mm.getModuleFromPath(args.destination)));
      return;
    }

    function doRequest(f, i) {
      if ( args.app ) {
        API.createDialog('FileUpload', {
          dest: args.destination,
          file: f
        }, _dialogClose, args.win || args.app);
      } else {
        var realDest = new VFS.File(args.destination);
        var tmpPath = hasAlias(realDest);
        if ( tmpPath ) {
          realDest = tmpPath;
        }

        VFS.Transports.OSjs.upload(f, realDest, function(err, result, ev) {
          if ( err ) {
            if ( err === 'canceled' ) {
              callback(API._('ERR_VFS_UPLOAD_CANCELLED'), null, ev);
            } else {
              var errstr = ev ? ev.toString() : 'Unknown reason';
              var msg = API._('ERR_VFS_UPLOAD_FAIL_FMT', errstr);
              callback(msg, null, ev);
            }
          } else {
            var file = _createFile(f.name, f.type, f.size);
            //broadcastMessage('vfs:upload', file, args.app, appRef); // FIXME
            callback(false, file, ev);
          }
        }, options);
      }
    }

    args.files.forEach(function(f, i) {
      var filename = (f instanceof window.File) ? f.name : f.filename;
      var dest = new VFS.File(args.destination + '/' + filename);

      existsWrapper(dest, function(error) {
        if ( error ) {
          return callback(error);
        }

        try {
          doRequest(f, i);
        } catch ( e ) {
          callback(API._('ERR_VFS_UPLOAD_FAIL_FMT', e));
        }
      }, options);
    });

  };

  /**
   * Download a file
   *
   * @summary Downloads a file to the computer
   *
   * @function download
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}   args      File Metadata (you can also provide a string)
   * @param   {CallbackVFS}     callback  Callback function
   */
  VFS.download = (function download() {
    var _didx = 1;

    return function(args, callback) {
      callback = callback || noop;
      args = args || {};

      console.debug('VFS::download()', args);
      if ( arguments.length < 2 ) {
        callback(API._('ERR_VFS_NUM_ARGS'));
        return;
      }

      if ( !args.path ) {
        callback(API._('ERR_VFS_DOWNLOAD_NO_FILE'));
        return;
      }

      try {
        args = checkMetadataArgument(args);
      } catch ( e ) {
        callback(e);
        return;
      }

      var lname = 'DownloadFile_' + _didx;
      _didx++;

      API.createLoading(lname, {className: 'BusyNotification', tooltip: API._('TOOLTIP_VFS_DOWNLOAD_NOTIFICATION')});

      var mm = Core.getMountManager();
      var dmodule = mm.getModuleFromPath(args.path);
      if ( !mm.isInternal(args.path) ) {
        var file = args;
        if ( !(file instanceof VFS.File) ) {
          file = new VFS.File(args.path);
          if ( args.id ) {
            file.id = args.id;
          }
        }

        mm.getModule(dmodule).request('read', [file], function(error, result) {
          API.destroyLoading(lname);

          if ( error ) {
            callback(API._('ERR_VFS_DOWNLOAD_FAILED', error));
            return;
          }

          callback(false, result);
        });
        return;
      }

      VFS.url(args, function(error, url) {
        if ( error ) {
          return callback(error);
        }

        Utils.ajax({
          url: url,
          method: 'GET',
          responseType: 'arraybuffer',
          onsuccess: function(result) {
            API.destroyLoading(lname);
            callback(false, result);
          },
          onerror: function(result) {
            API.destroyLoading(lname);
            callback(error);
          }
        });

      });
    };
  })();

  /**
   * Move file to trash (Not used in internal storage)
   *
   * @summary Trashes a file
   *
   * @function trash
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}   item      File Metadata (you can also provide a string)
   * @param   {CallbackVFS}     callback  Callback function
   */
  VFS.trash = function VFS_trash(item, callback) {
    callback = callback || noop;

    console.debug('VFS::trash()', item);
    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item);
    } catch ( e ) {
      callback(e);
      return;
    }

    requestWrapper([item.path, 'trash', [item]], 'ERR_VFSMODULE_TRASH_FMT', callback);
  };

  /**
   * Restore file from trash
   *
   * @summary Removes a file from trash
   *
   * @function untrash
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}   item      File Metadata (you can also provide a string)
   * @param   {CallbackVFS}     callback  Callback function
   */
  VFS.untrash = function VFS_untrash(item, callback) {
    callback = callback || noop;

    console.debug('VFS::untrash()', item);
    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item);
    } catch ( e ) {
      callback(e);
      return;
    }

    requestWrapper([item.path, 'untrash', [item]], 'ERR_VFSMODULE_UNTRASH_FMT', callback);
  };

  /**
   * Permanently empty trash
   *
   * @summary Empties the trash
   *
   * @function emptyTrash
   * @memberof OSjs.VFS
   *
   * @param   {CallbackVFS}     callback  Callback function
   */
  VFS.emptyTrash = function VFS_emptyTrash(callback) {
    callback = callback || noop;

    console.debug('VFS::emptyTrash()');
    if ( arguments.length < 1 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    requestWrapper([null, 'emptyTrash', []], 'ERR_VFSMODULE_EMPTYTRASH_FMT', callback);
  };

  /**
   * Checks for free space in given protocol from file
   *
   * Result is -1 when unavailable
   *
   * @summary Gets free space on target
   *
   * @function freeSpace
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}   item      File Metadata (you can also provide a string)
   * @param   {CallbackVFS}     callback  Callback function
   */
  VFS.freeSpace = function VFS_freeSpace(item, callback) {
    callback = callback || noop;

    console.debug('VFS::freeSpace()', item);
    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item);
    } catch ( e ) {
      callback(e);
      return;
    }

    var m = Core.getMountManager().getModuleFromPath(item.path, false, true);

    requestWrapper([item.path, 'freeSpace', [m.root]], 'ERR_VFSMODULE_FREESPACE_FMT', callback);
  };

  /**
   * Watches a file or directory for changes. Please note that this currently only works for
   * client-side APIs.
   * @summary Watches a file or directory for changes.
   *
   * @function watch
   * @memberof OSjs.VFS
   *
   * @param   {OSjs.VFS.File}   item      File Metadata (you can also provide a string)
   * @param   {CallbackVFS}     callback  Callback function
   *
   * @return  {Number}                    The index of your watch (you can unwatch with this)
   */
  VFS.watch = function VFS_watch(item, callback) {
    callback = callback || noop;

    if ( arguments.length < 2 ) {
      callback(API._('ERR_VFS_NUM_ARGS'));
      return;
    }

    try {
      item = checkMetadataArgument(item);
    } catch ( e ) {
      callback(e);
      return;
    }

    return watches.push({
      path: item.path,
      type: item.type,
      cb: callback
    }) - 1;
  };

  /**
   * Remove a watch
   *
   * @function unwatch
   * @memberof OSjs.VFS
   *
   * @param {Number}      idx     Watch index (from watch() method)
   */
  VFS.unwatch = function VFS_unwatch(idx) {
    if ( typeof watches[idx] !== 'undefined' ) {
      delete watches[idx];
    }
  };

  /**
   * Triggers a VFS watch event
   *
   * @function triggerWatch
   * @memberof OSjs.VFS.Helpers
   *
   * @param   {String}              method      VFS method
   * @param   {Object}              arg         VFS file
   * @param   {OSjs.Core.Process}   [appRef]    Optional application reference
   */
  VFS.Helpers = VFS.Helpers || {};
  VFS.Helpers.triggerWatch = function VFS_Helpers_triggerWatch(method, arg, appRef) {
    broadcastMessage('vfs:' + method, arg, appRef);
  };

})(OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.Core);
