;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.deferDAO = new DAO('bureau/juror/defer', {
    post: function(jurorNumber, version, acceptDeferral, deferralDate, deferralReason) {
      const uri = urljoin(this.resource, jurorNumber);
      const body = {
        acceptDeferral: acceptDeferral,
        deferralDate: deferralDate,
        deferralReason: deferralReason,
        version: version,
      };

      if (acceptDeferral === false) {
        delete body.deferralDate;
      }

      return { uri, body };
    }}
  );
})();
