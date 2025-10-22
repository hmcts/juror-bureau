;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default;
  const { basicDataTransform } = require('../lib/utils');


  module.exports.object = new DAO('bureau/juror/defer', {
    post: function(jurorNumber, version, acceptDeferral, deferralDate, deferralReason) {
      return {
        uri: urljoin(this.resource, jurorNumber),
        body: {
          acceptDeferral,
          deferralDate,
          deferralReason,
          version,
        },
        transform: basicDataTransform,
      }
    }
  });
})();
