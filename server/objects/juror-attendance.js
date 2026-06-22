(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const _ = require('lodash');
  const { replaceAllObjKeys, mapCamelToSnake, mapSnakeToCamel } = require('../lib/mod-utils');

  module.exports.jurorsAttending = new DAO('moj/juror-management/appearance', {
    get: function(locationCode, attendanceDate, group) {
      return {
        uri: this.resource + `?locationCode=${locationCode}&attendanceDate=${attendanceDate}&group=${group}`,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.jurorAttendanceDao = new DAO('moj/juror-management/attendance', {
    post: function(body) {
      return {
        body,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.updateJurorAttendanceDAO = new DAO('moj/juror-management/attendance', {
    patch: function(payload) {
      return {
        uri: this.resource,
        body: mapCamelToSnake(payload),
        transform: mapSnakeToCamel,
      };
    }
  });

  module.exports.changeNextDueAtCourtDAO = new DAO('moj/juror-management/attendance/attendance-date', {
    patch: function(body) {
      return {
        body,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.jurorNonAttendanceDao = new DAO('moj/juror-management/non-attendance', {
    post: function(body) {
      return {
        body: mapCamelToSnake(body),
        transform: mapSnakeToCamel,
      };
    }
  });

  module.exports.bulkJurorNonAttendanceDao = new DAO('moj/trial/non-attendance', {
    post: function(body) {
      return {
        body: mapCamelToSnake(body),
        transform: mapSnakeToCamel,
      };
    }
  });

  module.exports.jurorAddAttendanceDao = new DAO('moj/juror-management/add-attendance-day', {
    post: function(body) {
      return {
        body,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.modifyJurorAttendance = new DAO('moj/juror-management/attendance/modify-attendance', {
    patch: function(body) {
      return {
        body,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.poolAttedanceAuditDAO = new DAO('moj/audit/{date}/pool', {
    get: function(date) {
      return {
        uri: this.resource.replace('{date}', date),
        transform: (data) => { delete data['_headers']; return mapSnakeToCamel(Object.values(data))},
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
  
  module.exports.confirmJurorAttendanceDAO = new DAO('moj/juror-management/confirm-attendance', {
    patch: function(body) {
      return {
        body,
        transform: mapSnakeToCamel,
      };
    },
  });

})();
