(function() {
  window.OSjs = window.OSjs || {}
  OSjs.getManifest = function() {
    return Object.freeze(%PACKAGES%);
  };
})();
