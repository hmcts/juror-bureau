/* eslint-disable strict */

const urljoin = require('url-join');
const { DAO } = require('./dataAccessObject');

module.exports.jurorsOnTrialDAO = new DAO('moj/juror-management/jurors-on-trial', {
  get: function(locCode, attendanceDate) {
    const uri = urljoin(this.resource, locCode, `?attendanceDate=${attendanceDate}`);

    return { uri };
  },
});

module.exports.confirmAttendanceDAO = new DAO('moj/juror-management/confirm-jury-attendance');
