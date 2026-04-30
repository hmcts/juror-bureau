; (function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { mapCamelToSnake } = require('../lib/mod-utils');

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
        body: mapCamelToSnake({
          jurorNumbers: jurorsArr,
          receivingCourtLocCode: receivingCourtLocCode,
          serviceStartDate: newServiceStartDate,
          sendingCourtLocCode: sourceLocCode,
          sourcePoolNumber: sourcePoolNumber,
        })
      }
    }
  })
})();
