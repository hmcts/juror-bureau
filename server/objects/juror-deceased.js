;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.jurorDeceasedDAO = new DAO('moj/deceased-response/excuse-deceased-juror', {
    post: function(body, jurorNumber) {
      const payload = {
        ...body,
        jurorNumber,
        paperResponseExists: false,
      };

      return { body: payload };
    }}
  );
})();
