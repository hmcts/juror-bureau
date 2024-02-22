;(function(){
  'use strict';

  require('./custom-validation');

  module.exports.searchParameters = function(req) {
    return {
      searchParameters: {
        searchParameters: req,
      },
    };
  };
})();
