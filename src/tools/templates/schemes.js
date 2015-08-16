(function() {
  window.OSjs = window.OSjs || {}
  OSjs.API = OSjs.API || {}

  var schemes = %JSON%;

  OSjs.API.getDefaultSchemes = function(url) {
    return url ? schemes[url] : schemes;
  };

})();
