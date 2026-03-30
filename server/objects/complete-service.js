;(function(){
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const { replaceAllObjKeys } = require('../lib/mod-utils');

  module.exports.completeService = new DAO('moj/complete-service', {
    patch: function(pool, payload) {
      return {
        uri: `${this.resource}/${pool}/complete`,
        body: replaceAllObjKeys(payload, _.snakeCase),
      }
    }
  });

})();
