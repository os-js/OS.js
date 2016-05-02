(function() {
  window.OSjs = window.OSjs || {}
  OSjs.Core = OSjs.Core || {}
  OSjs.Core.getConfig = (function() {
    var _cache;
    return function() {
      if ( !_cache ) {
        _cache = %CONFIG%;

        var rootURI = window.location.pathname || '/';
        if ( window.location.protocol === 'file:' ) {
          rootURI = '';
        }

        var replace = ['RootURI', 'APIURI', 'FSURI', 'MetadataURI', 'ThemeURI', 'SoundURI', 'IconURI', 'PackageURI'];
        replace.forEach(function(val) {
          if ( _cache[val] ) {
            _cache[val] = _cache[val].replace(/^\//, rootURI);
          }
        });

        var preloads = _cache.Preloads;
        if ( preloads ) {
          preloads.forEach(function(item, key) {
            if ( item && item.src && item.src.match(/^\//) ) {
              preloads[key].src = item.src.replace(/^\//, rootURI);
            }
          });
        }
      }

      return Object.freeze(_cache);
    };
  })();
})();
