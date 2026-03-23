; (function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform2 } = require('../lib/utils');

  module.exports.poolSummaryObject = new DAO('moj/manage-pool/summary', {
    get: function(poolNumber) {
      return {
        uri: this.resource + `?poolNumber=${poolNumber}`,
        transform: basicDataTransform2
      };
    },
  });
})();
