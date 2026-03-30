; (function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.poolSummaryObject = new DAO('moj/manage-pool/summary', {
    get: function(poolNumber) {
      return {
        uri: this.resource + `?poolNumber=${poolNumber}`,
      };
    },
  });
})();
