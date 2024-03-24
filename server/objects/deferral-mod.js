(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.deferResponseDAO = new DAO('moj/deferral-response/juror', {
    put: function(body, jurorNumber) {
      const uri = urljoin(this.resource, jurorNumber);

      return { uri, body };
    }}
  );

  module.exports.deferJurorDAO = new DAO('moj/deferral-maintenance/juror/defer', {
    post: function(jurorNumber, poolNumber, deferralDate, deferralReason, replyMethod) {
      const uri = urljoin(this.resource, jurorNumber);
      let body;

      if (poolNumber) {
        body = {
          deferralDate: deferralDate,
          excusalReasonCode: deferralReason,
          poolNumber: poolNumber,
          replyMethod: replyMethod.toUpperCase(),
        };
      } else {
        body = {
          deferralDate: deferralDate,
          excusalReasonCode: deferralReason,
          replyMethod: replyMethod.toUpperCase(),
        };
      }

      return { uri, body };
    }}
  );

  module.exports.changeDeferralDateDAO = new DAO('moj/deferral-maintenance/deferrals/change-deferral-date', {
    post: function(jurorNumber, deferralDate, poolNumber, excusalReasonCode) {
      const uri = urljoin(this.resource, jurorNumber);
      const body = {
        deferralDate,
        poolNumber,
        excusalReasonCode,
      };

      return { uri, body };
    }}
  );

  module.exports.deferralPoolsDAO = new DAO('moj/deferral-maintenance/available-pools', {
    post: function(deferralDates, jurorNumber) {
      const uri = urljoin(this.resource, jurorNumber);

      return { uri, body: deferralDates };
    }}
  );

  module.exports.deleteDeferralDAO = new DAO('moj/deferral-maintenance/delete-deferral', {
    delete: function(jurorNumber) {
      const uri = urljoin(this.resource, jurorNumber);

      return { uri };
    }}
  );
})();
