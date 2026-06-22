; (function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { basicDataTransform } = require('../lib/utils');
  const { mapCamelToSnake } = require('../lib/mod-utils');


  module.exports.getDisqualificationReasons = new DAO('moj/disqualify/reasons', {
    get: function() {
      return {
        transform: basicDataTransform,
      };
    },
  });

  module.exports.disqualifyJuror = new DAO('moj/disqualify/juror', {
    patch: function(jurorNumber, payload) {
      return {
        uri: urljoin(this.resource, jurorNumber),
        body: mapCamelToSnake(payload),
        transform: basicDataTransform,
      }
    }
  });

  module.exports.bulkDisqualifyJurorsDAO = new DAO('moj/deferral-maintenance/deferrals/bulk-disqualify-age', {
    post: function(payload) {
      return {
        uri: this.resource,
        body: payload,
        transform: basicDataTransform,
      }
    }
  });
  
})();
