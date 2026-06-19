/* eslint-disable strict */

const urljoin = require('url-join');
const { DAO } = require('./dataAccessObject');
const { mapCamelToSnake, mapSnakeToCamel } = require('../lib/mod-utils');

module.exports.jurorsOnTrialDAO = new DAO('moj/juror-management/jurors-on-trial', {
  get: function(locCode, attendanceDate) {
    const uri = urljoin(this.resource, locCode, `?attendanceDate=${attendanceDate}`);

    return {
      uri,
      transform: mapSnakeToCamel,
    };
  },
});

module.exports.confirmAttendanceDAO = new DAO('moj/juror-management/confirm-jury-attendance', {
  patch: function(payload) {
    return {
      uri: this.resource,
      body: mapCamelToSnake(payload),
      transform: mapSnakeToCamel,
    }
  }
});
