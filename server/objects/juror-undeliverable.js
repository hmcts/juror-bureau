;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.undeliverableResponseDAO = new DAO('moj/undeliverable-response', {
    put: function(jurorNumber) {
      const uri = urljoin(this.response, jurorNumber);

      return { uri };
    }}
  );
})();
