;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.jurorDeceasedObject = new DAO('moj/deceased-response/excuse-deceased-juror', {
    post: function(tmpBody, jurorNumber) {
      return {
        body: {
          deceasedComment: tmpBody.jurorDeceased,
          jurorNumber: jurorNumber,
          thirdPartyDeceased: tmpBody.thirdPartyDeceased,
          paperResponseExists: false
        }
      }
    }
  });
})();
