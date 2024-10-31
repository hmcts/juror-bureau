(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');
  const urljoin = require('url-join');


  module.exports.deferralObject = new DAO('moj/deferral-response/juror', {
    put: function(body, jurorNumber) {
      let uri = this.resource;
      if (jurorNumber) {
        uri = urljoin(uri, jurorNumber);
      }
      return {
        uri,
        body,
        transform: basicDataTransform,
      }
    },
    post: function(jurorNumber, poolNumber, deferralDate, deferralReason, replyMethod) {
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
          'deferralDate': deferralDate,
          'excusalReasonCode': deferralReason,
          'replyMethod': replyMethod.toUpperCase(),
        };
      }

      return {
        uri: urljoin('moj/deferral-maintenance/juror/defer', jurorNumber),
        body,
        transform: basicDataTransform,
      }
    }
  });

  module.exports.changeDeferralObject = new DAO('moj/deferral-maintenance/deferrals/change-deferral-date', {
    post: function(jurorNumber, deferralDate, poolNumber, excusalReasonCode) {
      return {
        uri: urljoin(this.resource, jurorNumber),
        body: {
          deferralDate,
          poolNumber,
          excusalReasonCode,
        },
        transform: basicDataTransform,
      }
    }
  });

  module.exports.deferralPoolsObject = new DAO('moj/deferral-maintenance/available-pools', {
    post: function(deferralDates, jurorNumber) {
      return {
        uri: urljoin(this.resource, jurorNumber),
        body: {
          deferralDates,
        },
        transform: basicDataTransform,
      }
    }
  });

  module.exports.deleteDeferralObject = new DAO('moj/deferral-maintenance/delete-deferral', {
    delete: function(jurorNumber) {
      return {
        uri: urljoin(this.resource, jurorNumber),
        transform: basicDataTransform,
      }
    }
  });

})();
