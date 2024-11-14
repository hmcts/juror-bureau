(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const _ = require('lodash');
  const { replaceAllObjKeys } = require('../lib/mod-utils');

  module.exports.jurorsAttending = new DAO('moj/juror-management/appearance', {
    get: function(locationCode, attendanceDate, group) {
      return {
        uri: this.resource + `?locationCode=${locationCode}&attendanceDate=${attendanceDate}&group=${group}`,
      };
    },
  });

  module.exports.jurorAttendanceDao = new DAO('moj/juror-management/attendance');

  module.exports.updateJurorAttendanceDAO = new DAO('moj/juror-management/attendance');

  module.exports.changeNextDueAtCourtDAO = new DAO('moj/juror-management/attendance/attendance-date');

  module.exports.jurorNonAttendanceDao = new DAO('moj/juror-management/non-attendance');

  module.exports.jurorAddAttendanceDao = new DAO('moj/juror-management/add-attendance-day');

  module.exports.modifyJurorAttendance = new DAO('moj/juror-management/attendance/modify-attendance');

  module.exports.poolAttedanceAuditDAO = new DAO('moj/audit/{date}/pool', {
    get: function(date) {
      return {
        uri: this.resource.replace('{date}', date),
        transform: (data) => { delete data['_headers']; return Object.values(data)},
      };
    },
  });

  module.exports.unconfirmedJurorAttendancesDAO = new DAO('moj/juror-management/unconfirmed-jurors/{locCode}', {
    get: function(locCode, date) {
      return {
        uri: this.resource.replace('{locCode}', locCode) + `?attendanceDate=${date}`,
        transform: (data) => { delete data['_headers']; return replaceAllObjKeys(data.jurors, _.camelCase); },
      };
    },
  });
  
  module.exports.confirmJurorAttendanceDAO = new DAO('moj/juror-management/confirm-attendance');

})();
