;(function(){
  'use strict';

  module.exports.responses = require('./responses').object;

  // new DAOs
  const requestPool = require('./request-pool');

  module.exports = {
    ...requestPool,
  };

})();
