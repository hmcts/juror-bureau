;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { mapCamelToSnake } = require('../lib/mod-utils');

  module.exports.endTrialObject = new DAO('moj/trial/end-trial', {
    patch: function(body) {
      return {
        body: mapCamelToSnake(body),
      };
    }
  });
})();
