; (function() {
  'use strict';
  
  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default;
  const utils = require('../lib/utils');

  module.exports.summoningProgressObject = new DAO('moj/manage-pool/summoning-progress', {
    get: function(query) {
      return {
        uri: urljoin(this.resource, query.locCode, query.poolType),
        transform: utils.basicDataTransform,
      }
    }
  });
})();
