; (function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default;
  const { basicDataTransform } = require('../lib/utils');


  module.exports.getDisqualificationReasons = new DAO('moj/disqualify/reasons');

  module.exports.disqualifyJuror = new DAO('moj/disqualify/juror', {
    patch: function(jurorNumber, disqualifyCode, replyMethod) {
      return {
        uri: urljoin(this.resource, jurorNumber),
        body: {
          code: disqualifyCode,
          replyMethod: replyMethod.toUpperCase(),
        },
        transform: basicDataTransform,
      }
    }
  });
})();
