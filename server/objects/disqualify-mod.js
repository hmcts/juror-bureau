; (function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.disqualificationReasonsDAO = new DAO('moj/disqualify/reasons');

  module.exports.disqualifyJurorDAO = new DAO('moj/disqualify/juror', {
    patch: function(jurorNumber, disqualifyCode, replyMethod) {
      const uri = urljoin(this.resource, jurorNumber);
      const body = {
        code: disqualifyCode,
        replyMethod: replyMethod.toUpperCase(),
      };

      return { uri, body };
    }}
  );
})();
