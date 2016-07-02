(function() {

  exports.register = function(API, VFS, instance) {
    API.broadway = function(args, callback, request, response) {
      callback(false, false);
    };
  };

})();
