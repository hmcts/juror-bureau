/* eslint-disable strict */

const { DAO } = require('./dataAccessObject');
const { mapSnakeToCamel } = require('../lib/mod-utils');

module.exports.runPoliceCheckDAO = new DAO('moj/pnc/manual', {
  patch: function(jurorNumber) {
    const uri = this.resource + '?juror_number=' + jurorNumber;

    return { uri, body: {}, transform: mapSnakeToCamel };
  },
});
