(function() {
  'use strict';

  module.exports.changeAttendanceType = function() {
    return {
      processActionType: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select absence type',
            details: 'Select absence type',
          },
        },
      },
    };
  };
})();
