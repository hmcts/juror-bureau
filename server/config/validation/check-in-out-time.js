;(function(){
  'use strict';

  const validate = require('validate.js')
    , timeMessageMapping = {
      //message mapping for check in check out variations
      checkOut: {
        missingWholeTime: {
          summary: 'Enter a check out time',
          details: 'Enter a check out time',
        },
        missingHour: {
          summary: 'Enter an hour for check out time',
          details: 'Enter an hour for check out time',
        },
        invalidHour: {
          summary: 'Enter an hour between 1 and 12',
          details: 'Enter an hour between 1 and 12',
        },
        missingMinutes: {
          summary: 'Enter minutes for check out time',
          details: 'Enter minutes for check out time',
        },
        invalidMinutes: {
          summary: 'Enter minutes between 0 and 59',
          details: 'Enter minutes between 0 and 59',
        },
        missingPeriod: {
          summary: 'Select whether check out time is am or pm',
          details: 'Select whether check out time is am or pm',
        },
        beforeCheckIn: {
          summary: 'Check out time cannot be earlier than check in time',
          details: 'Check out time cannot be earlier than check in time',
        },
        invalidChars: {
          summary: 'Check out time must only include numbers - you cannot enter letters or special characters',
          details: 'Check out time must only include numbers - you cannot enter letters or special characters',
        },
      },
      checkIn: {
        missingWholeTime: {
          summary: 'Enter a check in time or delete this juror\'s attendance',
          details: 'Enter a check in time or delete this juror\'s attendance',
        },
        missingHour: {
          summary: 'Enter an hour for check in time or delete this juror\'s attendance',
          details: 'Enter an hour for check in time or delete this juror\'s attendance',
        },
        invalidHour: {
          summary: 'Enter an hour between 1 and 12',
          details: 'Enter an hour between 1 and 12',
        },
        missingMinutes: {
          summary: 'Enter minutes for check in time or delete this juror\'s attendance',
          details: 'Enter minutes for check in time or delete this juror\'s attendance',
        },
        invalidMinutes: {
          summary: 'Enter minutes between 0 and 59',
          details: 'Enter minutes between 0 and 59',
        },
        missingPeriod: {
          summary: 'Select whether check in time is am or pm or delete this juror\'s attendance',
          details: 'Select whether check in time is am or pm or delete this juror\'s attendance',
        },

        invalidChars: {
          summary: 'Check in time must only include numbers - you cannot enter letters or special characters',
          details: 'Check in time must only include numbers - you cannot enter letters or special characters',
        },
      },
    };

  module.exports.timeMessageMapping = timeMessageMapping;

  module.exports.checkOutTimeEmpty = () => {
    return {
      checkOutTime:{
        attendanceTime: {
        },
      },
    };
  };

  module.exports.checkOutTime = () => {
    return {
      checkOutTimeHour: {
        attendanceTimeHour: {
        },
      },
      checkOutTimeMinute: {
        attendanceTimeMinute: {
        },
      },
      checkOutTimePeriod: {
        attendanceTimePeriod: {
        },
      },
    };
  };

  module.exports.checkInTimeEmpty = () => {
    return {
      checkInTime:{
        attendanceTime: {
        },
      },
    };
  };

  module.exports.checkInTime = () => {
    return {
      checkInTimeHour: {
        attendanceTimeHour: {
        },
      },
      checkInTimeMinute: {
        attendanceTimeMinute: {
        },
      },
      checkInTimePeriod: {
        attendanceTimePeriod: {
        },
      },
    };
  };


  validate.validators.attendanceTime = function(value, options, key, attributes) {
    let tmpErrors = [];

    const fieldName = key.substring(0, key.indexOf('Time'));

    // eslint-disable-next-line max-len
    if ((typeof value.hour === 'undefined' || value.hour === '') && (typeof value.minute === 'undefined' || value.minute === '')){
      tmpErrors = [timeMessageMapping[fieldName].missingWholeTime];
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.attendanceTimeHour = function(value, options, key, attributes) {
    let tmpErrors = [];

    const fieldName = key.substring(0, key.indexOf('Time'));

    if (value !== '') {
      if (isNaN(value)) {
        tmpErrors = [timeMessageMapping[fieldName].invalidChars];
      } else if (value < 1 || value > 12) {
        tmpErrors = [timeMessageMapping[fieldName].invalidHour];
      };
    } else {
      tmpErrors = [timeMessageMapping[fieldName].missingHour];
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.attendanceTimeMinute = function(value, options, key, attributes) {
    let tmpErrors = [];

    const fieldName = key.substring(0, key.indexOf('Time'));

    if (value !== '') {
      if (isNaN(value)) {
        tmpErrors = [timeMessageMapping[fieldName].invalidChars];
      } else if (value < 0 || value > 59) {
        tmpErrors = [timeMessageMapping[fieldName].invalidMinutes];
      };
    } else {
      tmpErrors = [timeMessageMapping[fieldName].missingMinutes];
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

  validate.validators.attendanceTimePeriod = function(value, options, key, attributes) {
    let tmpErrors = [];

    const fieldName = key.substring(0, key.indexOf('Time'));

    if (value === '' || typeof value === 'undefined') {
      tmpErrors = [timeMessageMapping[fieldName].missingPeriod];
    }

    return tmpErrors.length === 0
      ? null
      : tmpErrors;
  };

})();
