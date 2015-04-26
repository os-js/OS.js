(function() {
  window.OSjs = window.OSjs || {}
  OSjs.API = OSjs.API || {}
  OSjs.API.getDefaultPackages = function() {
    return %PACKAGES%;
  };
})();
