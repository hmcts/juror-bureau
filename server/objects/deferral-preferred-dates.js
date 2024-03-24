;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.preferredDateDAO = new DAO('moj/deferral-maintenance/deferral-dates', {
    get: function(jurorNumber) {
      const uri = urljoin(this.resource, jurorNumber);

      return { uri };
    }}
  );
})();
