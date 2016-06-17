(function() {

  exports.register = function(apiNamespace, vfsNamespace, instance) {
    API.broadway = function(server, args, callback) {
      callback(false, false);
    };
  };

})();
