(function() {

  exports.register = function(apiNamespace, vfsNamespace, instance) {
    API.broadway = function(args, callback, request, response) {
      callback(false, false);
    };
  };

})();
