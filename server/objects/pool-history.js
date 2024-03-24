(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.poolHistoryDAO = new DAO('moj/pool-history', {
    get: function(poolNumber) {
      const uri = urljoin(this.resource, poolNumber);

      return { uri };
    }}
  );
})();
