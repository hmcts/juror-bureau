;(function(){
  'use strict';

  require('./custom-validation');

  module.exports = function(req) {
    return {

      searchParameters: {

        searchParameters: req,

      },

    };
  };
})();
