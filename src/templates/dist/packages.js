(function() {
  window.OSjs = window.OSjs || {}
  OSjs.Core = OSjs.Core || {}
  OSjs.Core.getMetadata = (function() {
    var _cache;

    return function() {
      var rootURI = window.location.pathname || '/';
      if ( window.location.protocol === 'file:' ) {
        rootURI = rootURI.replace(/(index\.html)$/, 'packages/');
      } else {
        rootURI = rootURI.replace(/\/$/, '/packages/'); // FIXME
      }

      function fixDirs(dirs, key) {
        dirs.forEach(function(it, idx) {
          if ( it.src && !it.src.match(/^(\/)|(http)|(ftp)/) ) {
            it.src = rootURI + it.src;
          }
        });
        return dirs;
      }

      if ( !_cache ) {
        _cache = %PACKAGES%;

        Object.keys(_cache).forEach(function(key) {
          var iter = _cache[key];
          if ( iter && iter.preload ) {
            _cache[key].preload = fixDirs(iter.preload, key);
          }
        });
      }

      return Object.freeze(_cache);
    };
  })();
})();
