/* eslint-disable strict */

const { DAO } = require('./dataAccessObject');

module.exports.runPoliceCheckDAO = new DAO('moj/pnc/manual', {
  patch: function(jurorNumber) {
    const uri = this.resource + '?juror_number=' + jurorNumber;

    return { uri, body: {} };
  },
});
