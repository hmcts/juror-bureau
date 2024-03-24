(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.bureauDeferralsDAO = new DAO('moj/pool-create/bureau-deferrals', {
    get: function(locationCode, deferredDate) {
      const uri = urljoin(
        this.resource,
        '?locationCode=' + locationCode,
        '&deferredTo=' + deferredDate
      );

      return { uri };
    }}
  );
})();
