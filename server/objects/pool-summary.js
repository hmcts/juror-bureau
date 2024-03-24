;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.poolSummaryDAO = new DAO('moj/manage-pool/summary', {
    get: function(poolNumber) {
      const uri = urljoin(this.resource, '?poolNumber=' + poolNumber);

      return { uri };
    }}
  );
})();
