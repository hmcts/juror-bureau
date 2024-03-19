(function() {
  'use strict';

  const validate = require('validate.js');

  module.exports.courtDetails = function(courtsList, judgesList) {
    return {
      mainPhoneNumber: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a main telephone number',
            details: 'Enter a main telephone number',
          },
        },
      },
      defaultAttendanceTimeHour: {
        defaultAttendanceTimeHour: {},
      },
      defaultAttendanceTimeMinute: {
        defaultAttendanceTimeMinute: {},
      },
      defaultAttendanceTimePeriod: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select whether check out time is am or pm',
            details: 'Select whether check out time is am or pm',
          },
        },
      },
      assemblyRoomId: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select an assembly room',
            details: 'Select an assembly room',
          },
        },
      },
      costCentre: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a cost centre',
            details: 'Enter a cost centre',
          },
        },
      },
      signature: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter a signature',
            details: 'Enter a signature',
          },
        },
      },
    };
  };

  validate.validators.defaultAttendanceTimeHour = function(value, options, key, attributes) {
    if (value === '') {
      return [{
        summary: 'Enter an hour for default attendance time',
        details: 'Enter an hour for default attendance time',
      }];
    }
    if (value && (isNaN(value) || (value < 1 || value > 12))) {
      return  [{
        summary: 'Enter an hour between 1 and 12',
        details: 'Enter an hour between 1 and 12',
      }];
    };
    return null;
  };

  validate.validators.defaultAttendanceTimeMinute = function(value, options, key, attributes) {
    if (value === '') {
      return [{
        summary: 'Enter minutes for default attendance time',
        details: 'Enter minutes for default attendance time',
      }];
    }
    if (value && (isNaN(value) || (value < 0 || value > 59))) {
      return  [{
        summary: 'Enter minutes between 0 and 59',
        details: 'Enter minutes between 0 and 59',
      }];
    };
    return null;
  };

})();
