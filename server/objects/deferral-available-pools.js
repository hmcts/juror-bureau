;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.deferralPoolsDAO = new DAO('moj/deferral-maintenance/available-pools', {
    post: function(deferralDates, jurorNumber) {
      const uri = urljoin(this.resource, jurorNumber);

      return { uri, body: deferralDates};
    }}
  );
})();
