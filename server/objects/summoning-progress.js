; (function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.summoningProgressDAO = new DAO('moj/manage-pool/summoning-progress', {
    get: function(query){
      const uri = urljoin(query.locCode, query.poolType);

      return { uri };
    }}
  );
})();
