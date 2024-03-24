;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.jurorTransferDAO = new DAO('moj/manage-pool/transfer', {
    put: function(jurorNumbers, receivingCourtLocCode, newServiceStartDate, sourcePoolNumber) {
      let jurorsArr;

      if (!Array.isArray(jurorNumbers)) {
        jurorsArr = [jurorNumbers];
      } else {
        jurorsArr = jurorNumbers;
      }

      const sourceLocCode = sourcePoolNumber.slice(0, 3);

      const payload = {
        jurorNumbers: jurorsArr,
        receivingCourtLocCode: receivingCourtLocCode,
        targetServiceStartDate: newServiceStartDate,
        sendingCourtLocCode: sourceLocCode,
        sourcePoolNumber: sourcePoolNumber,
      };

      return { body: payload };
    }}
  );
})();
