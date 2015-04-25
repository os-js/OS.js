(function() {
  window.OSjs = window.OSjs || {}
  OSjs.API = OSjs.API || {}
  OSjs.API.getDefaultSettings = function() {
    return %CONFIG%;
  };
})();
