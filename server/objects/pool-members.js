(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.poolMembersDAO = new DAO('moj/pool-create/members', {
    get: function(poolNumber) {
      const uri = urljoin(this.resource, '?poolNumber=' + poolNumber);

      return { uri };
    }}
  );
})();
