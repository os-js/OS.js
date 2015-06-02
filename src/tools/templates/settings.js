(function() {
  window.OSjs = window.OSjs || {}
  OSjs.API = OSjs.API || {}
  OSjs.API.getDefaultSettings = (function() {
    var _cache;
    return function() {
      if ( !_cache ) {
        _cache = %CONFIG%;

        if ( _cache.Core ) {
          var rootURI = window.location.pathname || '/';
          var replace = ['RootURI', 'APIURI', 'FSURI', 'MetadataURI', 'ThemeURI', 'SoundURI', 'IconURI', 'PackageURI'];
          replace.forEach(function(val) {
            if ( _cache.Core[val] ) {
              _cache.Core[val] = _cache.Core[val].replace(/^\//, rootURI);
            }
          });

          var preloads = _cache.Core.Preloads;
          if ( preloads ) {
            preloads.forEach(function(item, key) {
              if ( item && item.src && item.src.match(/^\//) ) {
                preloads[key].src = item.src.replace(/^\//, rootURI);
              }
            });
          }
        }
      }

      return _cache;
    };
  })();
})();
