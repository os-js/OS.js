(function() {
  window.OSjs = window.OSjs || {}
  OSjs.Core = OSjs.Core || {}
  OSjs.Core.getMetadata = function() {
    return Object.freeze(%PACKAGES%);
  };
})();
