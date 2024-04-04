;(function(){
  'use strict';

  module.exports.responses = require('./responses').object;

  // new DAOs
  const requestPool = require('./request-pool');
  const panel = require('./panel');
  const jurorsOnTrial = require('./jurors-on-trial');

  module.exports = {
    ...requestPool,
    ...panel,
    ...jurorsOnTrial,
  };

})();
