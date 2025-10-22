(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default;
  const { basicDataTransform } = require('../lib/utils');
  const { toReplyMethod } = require('../lib/mod-utils');

  module.exports.excusalObject = new DAO('moj/excusal-response/juror', {
    put: function(body, jurorNumber, replyMethod) {
      const tmpBody = {
        excusalDecision: body.excusalDecision,
        excusalReasonCode: body.excusalCode,
      }

      if (replyMethod) {
        tmpBody.replyMethod = toReplyMethod(replyMethod);
      }

      return {
        uri: urljoin(this.resource, jurorNumber),
        body: tmpBody,
        transform: basicDataTransform,
      }
    }
  });
})();
