(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils')


  module.exports.bureauDeferralsObject = new DAO('moj/pool-create/bureau-deferrals', {
    get: function(locationCode, deferredDate) {
      return {
        uri: `${this.resource}?locationCode=${locationCode}&deferredTo=${deferredDate}`,
        transform: basicDataTransform,
      }
    }
  });

})();
