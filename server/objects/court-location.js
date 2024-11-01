(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils')

  module.exports.courtLocationsFromPostcodeObj = new DAO('moj/court-location/catchment-areas', {
    get: function(postcode) {
      return {
        uri: this.resource + '?postcode=' + postcode,
        transform: (data) => { delete data._headers; return Object.values(data); },
      }
    }
  });

  module.exports.getCourtLocationRates = new DAO('moj/court-location/{loc_code}/rates', {
    get: function(locCode) {
      return {
        uri: this.resource.replace('{loc_code}', locCode),
        transform: basicDataTransform,
      }
    }
  });

})();
