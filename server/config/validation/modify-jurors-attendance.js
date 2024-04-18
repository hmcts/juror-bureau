(function() {
  'use strict';

  module.exports.modifyAttendanceType = function() {
    return {
      attendanceType: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select an attendance type',
            details: 'Select an attendance type',
          },
        },
      },
    };
  };
})();
