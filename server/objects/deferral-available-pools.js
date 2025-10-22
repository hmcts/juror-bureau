;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default
  const { basicDataTransform } = require('../lib/utils')

  module.exports.object = new DAO('moj/deferral-maintenance/available-pools', {
    post: function(deferralDates, jurorNumber, courtLocCode) {
      let uri;
      if (courtLocCode) {
        uri = urljoin(this.resource, courtLocCode, jurorNumber, 'deferral_dates');
      } else {
        uri = urljoin(this.resource, jurorNumber);
      }
      return {
        uri,
        body: deferralDates,
        transform: basicDataTransform,
      }
    }
  });
})();
