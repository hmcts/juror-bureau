(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.postCodesDAO = new DAO('moj/pool-create/postcodes', {
    get: function(areaCode, isCoronersPool = false) {
      const uri = urljoin(
        this.resource,
        '?areaCode=' + areaCode,
        '&isCoronersPool=' + isCoronersPool
      );

      return { uri };
    }}
  );
})();
