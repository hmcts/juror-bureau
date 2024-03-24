;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.deletePoolDAO = new DAO('moj/manage-pool/delete', {
    delete: function(poolNumber) {
      const uri = urljoin(this.resource, '?poolNumber=' + poolNumber);

      return { uri };
    }}
  );
})();
