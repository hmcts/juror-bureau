(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.excusalResponseDAO = new DAO('moj/excusal-response/juror', {
    put: function(body, jurorNumber, replyMethod) {
      const uri = urljoin(this.resource, jurorNumber);
      const payload = {
        ...body,
        replyMethod: replyMethod.toUpperCase(),
      };

      return { uri, body: payload };
    }}
  );
})();
