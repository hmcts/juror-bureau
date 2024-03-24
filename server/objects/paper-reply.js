(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const dateFilter = require('../components/filters').dateFilter

  module.exports.paperReplyDAO = new DAO('moj/juror-paper-response/juror', {
    get: function(jurorNumber) {
      const uri = urljoin(this.resource, jurorNumber);

      return { uri };
    }}
  );

  module.exports.createPaperReplyDAO = new DAO('moj/juror-paper-response/response', {
    post: function(pr) {
      const body = {
        ...pr,
        dateOfBirth: dateFilter(pr.dateOfBirth, 'DD/MM/YYYY', 'YYYY-MM-DD'),
        thirdParty: (typeof pr.thirdParty === 'string') ? null : pr.thirdParty,
      };

      if (pr.pendingFirstName) {
        body.title = pr.pendingTitle;
        body.firstName = pr.pendingFirstName;
        body.lastName = pr.pendingLastName;
      }

      // Support validation on back end
      if (body.primaryPhone === '') {
        delete body.primaryPhone;
      }
      if (body.secondaryPhone === '') {
        delete body.secondaryPhone;
      }

      return { body };
    }}
  );
})();
