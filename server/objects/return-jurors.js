(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default

  module.exports.returnsObject = new DAO('moj/trial/return-', {
    post: function(type, trialNumber, locCode, body) {
      const params = new URLSearchParams({ trial_number: trialNumber, location_code: locCode });

      return {
        uri: urljoin(
          this.resource + type,
          `?${params.toString()}`,
        ),
        body
      }
    }
  });
})();
