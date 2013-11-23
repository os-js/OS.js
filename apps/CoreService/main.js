(function(Service, Application) {

  var CoreService = function(args, metadata) {
    Service.apply(this, ['CoreService', {}, metadata]);
    this.running = false;
    this.applicationCache = {};
    this.skipNext = false;
    this.config = {
      'Home' : '/',
      'MaxUploadSize' : -1
    };

    if ( typeof args.settings !== 'undefined' && typeof args.settings === 'object' ) {
      this.setConfig(args.settings);
    }

    var self = this;
    this.interval = setInterval(function() {
      if ( self.skipNext ) {
        self.skipNext = false;
        return;
      }
      self.tick();
    }, (60*1000) * 15);
  };

  CoreService.prototype = Object.create(Service.prototype);

  CoreService.prototype.destroy = function(kill) {
    if ( kill && !confirm("Killing this process will stop things from working!") ) {
      return false;
    }

    this.running = false;
    if ( this.interval ) {
      clearInterval(this.interval);
      this.interval = null;
    }

    return Service.prototype.destroy.apply(this, arguments);
  };

  CoreService.prototype.init = function() {
    Service.prototype.init.apply(this, arguments);
    this.running = true;
    this.tick();
  };

  CoreService.prototype.tick = function() {
    if ( !this.running ) return;
    var self = this;
    this._call('getCache', {}, function(res) {
      self.applicationCache = res.result.applications;
    });
  };

  CoreService.prototype.forceUpdate = function() {
    this.skipNext = true;
    this.tick();
  };

  CoreService.prototype.loadSession = function(onFinished) {
    var onError = function(error) {
      // FIXME
      onFinished();
    };

    var onSuccess = function(data, a) {
      var w, r;
      for ( var i = 0, l = data.length; i < l; i++ ) {
        r = data[i];
        w = a._getWindow(r.name);
        if ( w ) {
          w._move(r.position.x, r.position.y);
          w._resize(r.dimension.w, r.dimension.h);
          // TODO: State

          console.warn('Restored window "' + r.name + '" from session');
        }
      }
    };

    var onLoaded = function(session) {
      var s, sargs;
      for ( var i = 0, l = session.length; i < l; i++ ) {
        s = session[i];
        sargs = s.args || {};
        if ( typeof sargs.length !== 'undefined' ) sargs = {};

        OSjs.API.launch(s.name, sargs, (function(data) {
          return function(a) {
            onSuccess(data, a);
          };
        })(session[i].windows), onError);
      }

      onFinished();
    };

    this._call('getSession', {}, function(res) {
      if ( res.error ) {
        onError(res.error);
      } else if ( res.result ) {
        onLoaded(res.result);
      }
    }, function(error) {
      onError(error);
    });
  };

  CoreService.prototype.saveSettings = function(onComplete, onError) {
    onComplete = onComplete || function() {};
    onError = onError || function(error) {
      OSjs.API.error("CoreService Error", "Failed to save settings", error);
    };

    var data = {};
    var wm = OSjs.API.getWMInstance();
    if ( !wm ) {
      onError("No window manager instance running");
      return;
    }
    data['WM'] = {};
    data['WM'][wm._name] = wm.getSettings();

    this._call('setSettings', {name: name, data: data}, function(res) {
      if ( res.error ) {
        onError(res.error);
      } else if ( res.result ) {
        onComplete();
      }
    }, function(error) {
      onError(error);
    });
  };

  CoreService.prototype.saveSession = function(name, procs, onFinished) {
    name = name || 'default';

    var onError = function() {
      onFinished();
    };

    var onSuccess = function() {
      onFinished();
    };

    var data = this.getSession(procs);
    this._call('setSession', {name: name, data: data}, function(res) {
      if ( res.error ) {
        onError(res.error);
      } else if ( res.result ) {
        onSuccess();
      }
    }, function(error) {
      onError(error);
    });
  };

  CoreService.prototype.getSession = function(procs) {
    var getSessionSaveData = function(app) {
      var args = app.__args;
      var wins = app.__windows;
      var data = {name: app.__name, args: args, windows: []};

      for ( var i = 0, l = wins.length; i < l; i++ ) {
        data.windows.push({
          name      : wins[i]._name,
          dimension : wins[i]._dimension,
          position  : wins[i]._position,
          state     : wins[i]._state
        });
      }

      return data;
    };

    var data = [];
    for ( var i = 0, l = procs.length; i < l; i++ ) {
      if ( procs[i] && (procs[i] instanceof Application) ) {
        data.push(getSessionSaveData(procs[i]));
      }
    }
    return data;
  };

  CoreService.prototype.getApplicationCache = function() {
    return this.applicationCache;
  };

  CoreService.prototype.getApplicationNameByMime = function(mime, fname) {
    var i, a;
    var list = [];
    for ( i in this.applicationCache ) {
      if ( this.applicationCache.hasOwnProperty(i) ) {
        a = this.applicationCache[i];
        if ( a && a.mime ) {
          for ( j = 0; j < a.mime.length; j++ ) {
            if ( (new RegExp(a.mime[j])).test(mime) === true ) {
              list.push(i);
            }
          }
        }
      }
    }

    return list;
  };

  CoreService.prototype._setConfig = function(k, v) {
    console.warn("CoreService::_setConfig()", k, v);

    if ( typeof this.config[k] !== 'undefined' ) {
      this.config[k] = v;
      return true;
    }
    return false;
  };

  CoreService.prototype.setConfig = function(k, v) {
    if ( typeof k === 'string' ) {
      return this._setConfig(k, v);
    } else if ( typeof k === 'object' ) {
      var i = 0;
      for ( var kk in k ) {
        if ( k.hasOwnProperty(kk) ) {
          if ( this._setConfig(kk, k[kk]) ) {
            i++;
          }
        }
      }
      return i > 0;
    }
    return false;
  };

  CoreService.prototype.getConfig = function(k) {
    return this.config[k] || null;
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.CoreService = CoreService;

})(OSjs.Core.Service, OSjs.Core.Application);
