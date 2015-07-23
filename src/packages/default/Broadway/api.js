(function() {

  exports.register = function(CONFIG, API) {
    API.broadway = function(args, callback, request, response) {
      callback(false, false);
    };
  };

})();
