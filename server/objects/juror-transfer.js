; (function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.jurorTransfer = new DAO('moj/manage-pool/transfer', {
    put: function(jurorNumbers, receivingCourtLocCode, newServiceStartDate, sourcePoolNumber) {
      let jurorsArr;
      let sourceLocCode;

      if (!Array.isArray(jurorNumbers)) {
        jurorsArr = [jurorNumbers];
      } else {
        jurorsArr = jurorNumbers;
      }

      sourceLocCode = sourcePoolNumber.slice(0, 3);

      return {
        body: {
          jurorNumbers: jurorsArr,
          receivingCourtLocCode: receivingCourtLocCode,
          targetServiceStartDate: newServiceStartDate,
          sendingCourtLocCode: sourceLocCode,
          sourcePoolNumber: sourcePoolNumber,
        }
      }
    }
  })
})();
