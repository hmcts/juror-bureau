;(function(){
  'use strict';

  module.exports.responses = require('./responses').object;

  // new DAOs
  const requestPool = require('./request-pool');
  const panel = require('./panel');
  const jurorsOnTrial = require('./jurors-on-trial');
  const administration = require('./administration');
  const confirmIdentity = require('./confirm-identity');
  const status = require('./status');

  module.exports = {
    ...requestPool,
    ...panel,
    ...jurorsOnTrial,
    ...administration,
    ...confirmIdentity,
    ...status,
  };

})();
