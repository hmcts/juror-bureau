(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.poolHistoryObject = new DAO('moj/pool-history', {
    get: function(poolNumber) {
      return {
        uri: urljoin(this.resource, poolNumber),
      }
    }
  });

})();
